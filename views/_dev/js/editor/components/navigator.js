/**
 * Navigator — Structure tree panel for iqitelementor editor.
 *
 * Provides a floating panel that displays the hierarchical structure
 * of sections, columns and widgets. Supports drag & drop reordering,
 * click-to-scroll, right-click context menu and expand/collapse.
 */

var NavigatorElementView,
	NavigatorRootView,
	NavigatorView;

// ---------------------------------------------------------------------------
// NavigatorElementView — recursive CompositeView for each element node
// ---------------------------------------------------------------------------

NavigatorElementView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-navigator__elements' ),

	className: function() {
		var elType = this.model.get( 'elType' );
		var cls = 'elementor-navigator__element elementor-navigator__element--' + elType;

		if ( 'widget' === elType ) {
			cls += ' elementor-navigator__element--' + this.model.get( 'widgetType' );
		}

		return cls;
	},

	childViewContainer: '.elementor-navigator__elements',

	// Recursive reference — must use getChildView() instead of childView
	// because Marionette 2.4 would try to instantiate childView as a constructor.
	getChildView: function() {
		return NavigatorElementView;
	},

	ui: {
		item: '> .elementor-navigator__item',
		listToggle: '> .elementor-navigator__item .elementor-navigator__element__list-toggle',
		title: '> .elementor-navigator__item .elementor-navigator__element__title__text',
		toggle: '> .elementor-navigator__item .elementor-navigator__element__toggle'
	},

	events: {
		'click @ui.item': 'onItemClick',
		'dblclick @ui.title': 'onTitleDblClick',
		'click @ui.listToggle': 'onListToggleClick',
		'click @ui.toggle': 'onVisibilityToggle',
		'contextmenu @ui.item': 'onContextMenu'
	},

	templateHelpers: function() {
		var elementData = elementor.getElementData( this.model );
		var elType = this.model.get( 'elType' );
		var icon = '';

		if ( elementData && elementData.icon ) {
			icon = 'eicon-' + elementData.icon;
		}

		// No icon for sections
		if ( 'section' === elType ) {
			icon = '';
		}

		return {
			title: this.model.getTitle(),
			icon: icon,
			elType: elType
		};
	},

	initialize: function() {
		var elements = this.model.get( 'elements' );

		if ( elements ) {
			this.collection = elements;
		}

		// Listen for child changes to re-render the tree
		if ( this.collection ) {
			this.listenTo( this.collection, 'add remove reset', this.onElementsChanged );
		}

		// Listen for title/settings changes
		this.listenTo( this.model.get( 'settings' ), 'change', this.onSettingsChanged );

		// Collapsed state (default: sections collapsed, columns expanded)
		this._collapsed = ( 'section' === this.model.get( 'elType' ) );
	},

	onRender: function() {
		// Apply initial collapsed state
		if ( this._collapsed ) {
			this.$el.addClass( 'elementor-navigator__element--collapsed' );
		}

		// Widgets have no children — hide the toggle arrow
		if ( 'widget' === this.model.get( 'elType' ) ) {
			this.$el.addClass( 'elementor-navigator__element--no-children' );
		}

		// Init sortable for drag & drop reordering
		this._initSortable();

		// Set data attribute for model CID (used by sortable)
		this.$el.attr( 'data-model-cid', this.model.cid );
	},

	onBeforeDestroy: function() {
		var $container = this.$( '> .elementor-navigator__elements' );
		if ( $container.sortable && $container.sortable( 'instance' ) ) {
			$container.sortable( 'destroy' );
		}
	},

	// -- Sortable ----------------------------------------------------------

	_initSortable: function() {
		var self = this;
		var elType = this.model.get( 'elType' );

		// Only sections and columns can have sortable children
		if ( 'widget' === elType ) {
			return;
		}

		var $container = this.$( '> .elementor-navigator__elements' );
		if ( ! $container.length ) {
			return;
		}

		var childType = ( 'section' === elType ) ? 'column' : 'widget';

		// connectWith: allow dragging between siblings of the same type
		var connectSelector = '.elementor-navigator__element--' + elType + ' > .elementor-navigator__elements';

		$container.sortable( {
			items: '> .elementor-navigator__element',
			handle: '> .elementor-navigator__item',
			connectWith: connectSelector,
			placeholder: 'elementor-navigator__sortable-placeholder',
			tolerance: 'pointer',
			axis: 'y',
			cursor: 'move',
			containment: '#elementor-navigator',
			start: function( event, ui ) {
				ui.item.addClass( 'elementor-navigator__element--dragging' );
			},
			stop: function( event, ui ) {
				ui.item.removeClass( 'elementor-navigator__element--dragging' );
				self._onSortStop( event, ui, childType );
			},
			receive: function( event, ui ) {
				self._onSortReceive( event, ui, childType );
			}
		} );
	},

	/**
	 * Handle reorder within the same container.
	 * Mirrors the approach from sortable.js: remove + addChildModel.
	 */
	_onSortStop: function( event, ui, childType ) {
		event.stopPropagation();

		var $item = ui.item;
		var modelCid = $item.attr( 'data-model-cid' );
		var model = this.collection.get( { cid: modelCid } );

		if ( ! model ) {
			return; // Moved to another container — handled by _onSortReceive
		}

		var newIndex = $item.parent().children( '.elementor-navigator__element' ).index( $item );
		var oldIndex = this.collection.indexOf( model );

		if ( oldIndex === newIndex ) {
			return;
		}

		// Find the parent editor view and use its addChildModel (same as sortable.js)
		var parentEditorView = this._findParentEditorViewForModel( this.model );

		if ( parentEditorView ) {
			// Suppress navigator re-render during sort (DOM already correct)
			this._suppressRefresh = true;
			parentEditorView.collection.remove( model );
			parentEditorView.addChildModel( model, { at: newIndex } );
			this._suppressRefresh = false;
		}

		elementor.setFlagEditorChange( true );
	},

	/**
	 * Handle element received from another container.
	 */
	_onSortReceive: function( event, ui, childType ) {
		event.stopPropagation();

		var $item = ui.item;
		var modelCid = $item.attr( 'data-model-cid' );
		var newIndex = $item.parent().children( '.elementor-navigator__element' ).index( $item );

		// Find the model in the source collection
		var model = this._findModelByCid( elementor.elements, modelCid );

		if ( ! model ) {
			Backbone.$( ui.sender ).sortable( 'cancel' );
			return;
		}

		// Validate: only same-type moves allowed
		var modelElType = model.get( 'elType' );
		var expectedChild = ( 'section' === this.model.get( 'elType' ) ) ? 'column' : 'widget';

		if ( modelElType !== expectedChild ) {
			Backbone.$( ui.sender ).sortable( 'cancel' );
			return;
		}

		// Find target editor view
		var targetEditorView = this._findParentEditorViewForModel( this.model );

		if ( targetEditorView ) {
			// Remove from old collection (triggers re-render in old parent)
			model.destroy();

			// Add to new parent in the editor using addChildModel
			var newModel = new targetEditorView.collection.model( model.toJSON( { copyHtmlCache: true } ) );
			targetEditorView.addChildModel( newModel, { at: newIndex } );
		}

		elementor.setFlagEditorChange( true );

		// Full refresh needed for cross-container moves
		elementor.channels.editor.trigger( 'navigator:refresh' );
	},

	/**
	 * Recursively find a model by CID in nested collections.
	 */
	_findModelByCid: function( collection, cid ) {
		var found = null;

		collection.each( function( model ) {
			if ( model.cid === cid ) {
				found = model;
				return false;
			}
			var children = model.get( 'elements' );
			if ( children && children.length ) {
				found = this._findModelByCid( children, cid );
				if ( found ) {
					return false;
				}
			}
		}, this );

		return found;
	},

	/**
	 * Find the editor view that is the parent of a given model.
	 * Traverses elementor.elements to find which collection holds the model,
	 * then returns the editor view for that parent.
	 */
	_findParentEditorViewForModel: function( childModel ) {
		// Top-level sections → parent is SectionsCollectionView
		if ( elementor.elements.get( childModel ) ) {
			return elementor.getRegion( 'sections' ).currentView;
		}

		// Search recursively for the collection that contains this model
		var parentModel = this._findParentModel( elementor.elements, childModel );

		if ( parentModel ) {
			return this._findEditorView( parentModel );
		}

		return null;
	},

	/**
	 * Find the parent model whose elements collection contains childModel.
	 */
	_findParentModel: function( collection, childModel ) {
		var found = null;

		collection.each( function( model ) {
			if ( found ) {
				return;
			}
			var children = model.get( 'elements' );
			if ( children ) {
				if ( children.get( childModel ) ) {
					found = model;
					return;
				}
				found = this._findParentModel( children, childModel );
			}
		}, this );

		return found;
	},

	/**
	 * Find the Marionette view in the editor that corresponds to a model.
	 */
	_findEditorView: function( model ) {
		var sectionsView = elementor.getRegion( 'sections' ).currentView;

		if ( ! sectionsView ) {
			return null;
		}

		// Top-level sections view
		if ( ! model.get( 'elType' ) ) {
			return sectionsView;
		}

		return this._findViewRecursive( sectionsView, model );
	},

	_findViewRecursive: function( parentView, targetModel ) {
		if ( ! parentView || ! parentView.children ) {
			return null;
		}

		var found = parentView.children.findByModel( targetModel );
		if ( found ) {
			return found;
		}

		var result = null;
		parentView.children.each( function( childView ) {
			if ( ! result ) {
				result = this._findViewRecursive( childView, targetModel );
			}
		}, this );

		return result;
	},

	// -- Click handlers ----------------------------------------------------

	onItemClick: function( event ) {
		event.stopPropagation();

		// Don't scroll if clicking on a toggle or list-toggle
		if ( Backbone.$( event.target ).closest( '.elementor-navigator__element__list-toggle, .elementor-navigator__element__toggle' ).length ) {
			return;
		}

		this._scrollToElement();
		this._selectElement();

		// Highlight active element in navigator
		Backbone.$( '#elementor-navigator .elementor-navigator__element--active' ).removeClass( 'elementor-navigator__element--active' );
		this.$el.addClass( 'elementor-navigator__element--active' );
	},

	onListToggleClick: function( event ) {
		event.stopPropagation();
		this._collapsed = ! this._collapsed;
		this.$el.toggleClass( 'elementor-navigator__element--collapsed', this._collapsed );
	},

	onVisibilityToggle: function( event ) {
		event.stopPropagation();
		// Toggle hidden state visually (does not affect the actual rendering)
		this.$el.toggleClass( 'elementor-navigator__element--hidden' );
	},

	onTitleDblClick: function( event ) {
		event.stopPropagation();
		// Allow inline renaming via contenteditable (optional UX)
		var $text = this.ui.title;
		$text.attr( 'contenteditable', 'true' ).focus();

		var self = this;
		$text.one( 'blur keydown', function( e ) {
			if ( e.type === 'keydown' && e.keyCode !== 13 ) {
				return;
			}
			e.preventDefault();
			$text.removeAttr( 'contenteditable' );
			var newTitle = $text.text().trim();
			if ( newTitle ) {
				self.model.get( 'settings' ).set( '_title', newTitle );
			}
		} );
	},

	onContextMenu: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		// Find the editor view for this model to get context menu groups
		var editorView = this._findEditorView( this.model );
		var groups = [];

		if ( editorView && 'function' === typeof editorView.getContextMenuGroups ) {
			groups = editorView.getContextMenuGroups();
		} else {
			// Fallback: basic edit/delete actions
			var self = this;
			groups = [ {
				name: 'navigator',
				actions: [
					{
						name: 'edit',
						title: 'Edit ' + this.model.getTitle(),
						icon: '<i class="eicon-edit"></i>',
						callback: function() {
							self._selectElement();
						}
					},
					{
						name: 'delete',
						title: 'Delete',
						icon: '<i class="fa fa-trash"></i>',
						separator: 'before',
						callback: function() {
							self.model.destroy();
						}
					}
				]
			} ];
		}

		if ( ! groups.length ) {
			return;
		}

		// Build fake event with real coordinates for the context menu
		event.realClientX = event.clientX;
		event.realClientY = event.clientY;

		elementor.channels.editor.trigger( 'context-menu:open', {
			event: event,
			view: editorView || this,
			groups: groups
		} );
	},

	// -- Helpers -----------------------------------------------------------

	_scrollToElement: function() {
		var elementId = this.model.get( 'id' );
		var $el = elementor.$previewContents.find( '.elementor-element-' + elementId );

		if ( $el.length ) {
			$el[0].scrollIntoView( { behavior: 'smooth', block: 'center' } );
		}
	},

	_selectElement: function() {
		// Find the actual editor view in the iframe and trigger click:edit
		// so that the element gets the selection overlay + the panel opens
		var editorView = this._findEditorView( this.model );

		if ( editorView ) {
			editorView.triggerMethod( 'click:edit' );
		} else {
			// Fallback: open panel directly
			elementor.getPanelView().setPage( 'editor', this.model.getTitle(), {
				model: this.model
			} );
		}
	},

	// -- Sync with editor --------------------------------------------------

	onElementsChanged: function() {
		// Don't re-render during navigator-initiated drag (DOM is already correct)
		if ( this._suppressRefresh ) {
			return;
		}
		this.render();
	},

	onSettingsChanged: function() {
		// Update title if settings changed
		if ( this.ui.title && this.ui.title.length ) {
			this.ui.title.text( this.model.getTitle() );
		}
	}
} );

// ---------------------------------------------------------------------------
// NavigatorRootView — CollectionView for top-level sections
// ---------------------------------------------------------------------------

NavigatorRootView = Marionette.CollectionView.extend( {
	childView: NavigatorElementView,

	className: 'elementor-navigator__elements elementor-navigator__elements--root',

	initialize: function() {
		this.listenTo( this.collection, 'add remove reset', this.onCollectionChanged );
	},

	onRender: function() {
		this._initSortable();
	},

	onBeforeDestroy: function() {
		if ( this.$el.sortable && this.$el.sortable( 'instance' ) ) {
			this.$el.sortable( 'destroy' );
		}
	},

	_initSortable: function() {
		var self = this;

		this.$el.sortable( {
			items: '> .elementor-navigator__element',
			handle: '> .elementor-navigator__item',
			placeholder: 'elementor-navigator__sortable-placeholder',
			tolerance: 'pointer',
			axis: 'y',
			cursor: 'move',
			containment: '#elementor-navigator',
			start: function( event, ui ) {
				ui.item.addClass( 'elementor-navigator__element--dragging' );
			},
			stop: function( event, ui ) {
				ui.item.removeClass( 'elementor-navigator__element--dragging' );
				self._onSortStop( event, ui );
			}
		} );
	},

	_onSortStop: function( event, ui ) {
		var $item = ui.item;
		var modelCid = $item.attr( 'data-model-cid' );
		var model = this.collection.get( { cid: modelCid } );

		if ( ! model ) {
			return;
		}

		var newIndex = $item.parent().children( '.elementor-navigator__element' ).index( $item );
		var oldIndex = this.collection.indexOf( model );

		if ( oldIndex === newIndex ) {
			return;
		}

		// Use the same approach as sortable.js: remove + addChildModel
		var sectionsView = elementor.getRegion( 'sections' ).currentView;
		if ( sectionsView ) {
			this._suppressRefresh = true;
			sectionsView.collection.remove( model );
			sectionsView.addChildModel( model, { at: newIndex } );
			this._suppressRefresh = false;
		}

		elementor.setFlagEditorChange( true );
	},

	onCollectionChanged: function() {
		if ( this._suppressRefresh ) {
			return;
		}
		this.render();
	}
} );

// ---------------------------------------------------------------------------
// NavigatorView — main layout (header + tree + footer)
// ---------------------------------------------------------------------------

NavigatorView = Marionette.LayoutView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-navigator' ),

	el: '#elementor-navigator',

	regions: {
		elements: '#elementor-navigator__elements'
	},

	ui: {
		toggleAll: '#elementor-navigator__toggle-all',
		close: '#elementor-navigator__close',
		header: '#elementor-navigator__header'
	},

	events: {
		'click @ui.toggleAll': 'onToggleAll',
		'click @ui.close': 'onClose'
	},

	_allExpanded: false,

	initialize: function() {
		this.listenTo( elementor.channels.editor, 'navigator:toggle', this.toggle );
		this.listenTo( elementor.channels.editor, 'navigator:refresh', this.refreshTree );

		// Listen for edit mode switches — hide navigator in preview mode
		this.listenTo( elementor.channels.dataEditMode, 'switch', this.onEditModeSwitch );
	},

	onRender: function() {
		// Show the root tree
		this.refreshTree();

		// Make the panel draggable by the header
		this.$el.draggable( {
			handle: '#elementor-navigator__header',
			containment: 'window'
		} );
	},

	refreshTree: function() {
		this.getRegion( 'elements' ).show( new NavigatorRootView( {
			collection: elementor.elements
		} ) );
	},

	toggle: function() {
		this.$el.toggleClass( 'elementor-navigator--open' );
	},

	show: function() {
		this.$el.addClass( 'elementor-navigator--open' );
	},

	hide: function() {
		this.$el.removeClass( 'elementor-navigator--open' );
	},

	onToggleAll: function() {
		this._allExpanded = ! this._allExpanded;

		var action = this._allExpanded ? 'removeClass' : 'addClass';

		this.$el.find( '.elementor-navigator__element' )[ action ]( 'elementor-navigator__element--collapsed' );

		// Update icon
		this.ui.toggleAll
			.toggleClass( 'eicon-expand', ! this._allExpanded )
			.toggleClass( 'eicon-collapse', this._allExpanded );
	},

	onClose: function() {
		this.hide();

		// Deactivate the topbar button
		Backbone.$( '#elementor-topbar-navigator' ).removeClass( 'active' );
	},

	onEditModeSwitch: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		if ( 'preview' === activeMode ) {
			this.hide();
		}
	}
} );

// ---------------------------------------------------------------------------
// Export — init function (called from editor.js)
// ---------------------------------------------------------------------------

var navigatorInstance = null;

module.exports = {
	init: function() {
		if ( ! navigatorInstance ) {
			navigatorInstance = new NavigatorView();
			navigatorInstance.render();
		}
		return navigatorInstance;
	},

	getInstance: function() {
		return navigatorInstance;
	}
};
