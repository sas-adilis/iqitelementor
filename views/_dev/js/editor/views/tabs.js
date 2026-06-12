var BaseElementView = require( 'elementor-views/base-element' ),
	TabView = require( 'elementor-views/tab' ),
	TabsView;

TabsView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-element-tabs-content' ),

	childView: TabView,

	className: function() {
		return 'elementor-tabs-wrapper';
	},

	childViewContainer: '> .elementor-tabs > .elementor-tabs-content',

	childViewOptions: function() {
		return { parentTabsView: this };
	},

	triggers: {
		'click > .elementor-element-overlay .elementor-editor-tabs-settings > ul .elementor-editor-element-trigger': 'click:edit',
		'click > .elementor-element-overlay .elementor-editor-tabs-settings > ul .elementor-editor-element-duplicate': 'click:duplicate'
	},

	elementEvents: {
		'click > .elementor-element-overlay .elementor-editor-tabs-settings > ul .elementor-editor-element-remove': 'onClickRemove'
	},

	ui: {
		tabsNav: '> .elementor-tabs > .elementor-tabs-nav',
		tabsContent: '> .elementor-tabs > .elementor-tabs-content'
	},

	events: function() {
		return _.extend( {}, this.baseEvents, this.elementEvents, {
			'click > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title': 'onTabTitleClick'
		} );
	},

	behaviors: {
		HandleDuplicate: {
			behaviorClass: require( 'elementor-behaviors/handle-duplicate' )
		},
		HandleEditor: {
			behaviorClass: require( 'elementor-behaviors/handle-editor' )
		},
		HandleEditMode: {
			behaviorClass: require( 'elementor-behaviors/handle-edit-mode' )
		},
		HandleAddMode: {
			behaviorClass: require( 'elementor-behaviors/duplicate' )
		},
		HandleElementsRelation: {
			behaviorClass: require( 'elementor-behaviors/elements-relation' )
		},
		ContextMenu: {
			behaviorClass: require( 'elementor-behaviors/context-menu' )
		}
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		this.activeIndex = 0;
		this._syncing = false;

		this.listenTo( this.collection, 'add remove reset', this.onCollectionChanged );

		var settings = this.model.get( 'settings' );
		this.listenTo( settings, 'change:panel_tabs', this.onPanelTabsChange );

		var panelTabs = settings.get( 'panel_tabs' );
		if ( panelTabs && typeof panelTabs.on === 'function' ) {
			this.listenTo( panelTabs, 'add remove reset change', this.onPanelTabsChange );
		}
	},

	addEmptyTab: function( settings ) {
		var newModel = this.addChildModel( {
			id: elementor.helpers.getUniqueID(),
			elType: 'tab',
			settings: settings || {},
			elements: []
		} );

		var newIndex = this.collection.indexOf( newModel );
		this.setActiveTab( newIndex );

		return newModel;
	},

	_checkIsEmpty: function() {
		var panelTabs = this.model.get( 'settings' ).get( 'panel_tabs' );

		if ( panelTabs && panelTabs.length ) {
			this.syncChildrenFromPanel();
			return;
		}

		if ( ! this.collection.length ) {
			this.addEmptyTab();
			this.addEmptyTab();
		}

		this.seedPanelTabsFromChildren();
	},

	seedPanelTabsFromChildren: function() {
		if ( this._syncing ) {
			return;
		}

		var rows = [];
		this.collection.each( function( child ) {
			var s = child.get( 'settings' );
			rows.push( {
				tab_title: ( s && s.get( 'tab_title' ) ) || ''
			} );
		} );

		this._syncing = true;
		var panelTabs = this.model.get( 'settings' ).get( 'panel_tabs' );
		if ( panelTabs && typeof panelTabs.reset === 'function' ) {
			panelTabs.reset( rows );
		} else {
			this.model.get( 'settings' ).set( 'panel_tabs', rows, { silent: true } );
		}
		this._syncing = false;
	},

	_readRow: function( row ) {
		if ( ! row ) {
			return { tab_title: '' };
		}
		if ( typeof row.get === 'function' ) {
			return { tab_title: row.get( 'tab_title' ) || '' };
		}
		if ( row.attributes ) {
			return { tab_title: row.attributes.tab_title || '' };
		}
		return { tab_title: row.tab_title || '' };
	},

	_getPanelRows: function() {
		var panelTabs = this.model.get( 'settings' ).get( 'panel_tabs' );
		if ( ! panelTabs ) {
			return [];
		}
		// Backbone collection
		if ( panelTabs.models && _.isArray( panelTabs.models ) ) {
			return panelTabs.models;
		}
		if ( _.isArray( panelTabs ) ) {
			return panelTabs;
		}
		return [];
	},

	syncChildrenFromPanel: function() {
		var rows = this._getPanelRows();
		var current = this.collection.length;
		var desired = rows.length;

		this._syncing = true;

		while ( current > desired ) {
			var last = this.collection.at( current - 1 );
			if ( last ) {
				last.destroy();
			}
			current--;
		}

		while ( current < desired ) {
			this.addChildModel( {
				id: elementor.helpers.getUniqueID(),
				elType: 'tab',
				settings: {},
				elements: []
			} );
			current++;
		}

		var self = this;
		_.each( rows, function( row, index ) {
			var child = self.collection.at( index );
			if ( ! child ) { return; }
			var settings = child.get( 'settings' );
			if ( ! settings ) { return; }
			var data = self._readRow( row );
			settings.set( 'tab_title', data.tab_title );
		} );

		this._syncing = false;
	},

	onPanelTabsChange: function() {
		if ( this._syncing ) {
			return;
		}
		this.syncChildrenFromPanel();
		this.renderNav();
		this.applyActiveStates();
	},

	onBeforeRender: function() {
		this._checkIsEmpty();
	},

	onRender: function() {
		this.renderNav();
		this.applyActiveStates();
	},

	onCollectionChanged: function() {
		BaseElementView.prototype.onCollectionChanged.apply( this, arguments );

		// Clamp active index
		if ( this.activeIndex >= this.collection.length ) {
			this.activeIndex = Math.max( 0, this.collection.length - 1 );
		}

		this.renderNav();
		this.applyActiveStates();
	},

	renderNav: function() {
		var $nav = this.$el.find( '> .elementor-tabs > .elementor-tabs-nav' ).first();

		if ( ! $nav.length ) {
			// Template not yet rendered — nav will be built on onRender
			return;
		}

		var self = this,
			tabsId = this.model.get( 'id' ),
			panelRows = this._getPanelRows();

		$nav.empty();

		this.collection.each( function( tabModel, index ) {
			var settings = tabModel.get( 'settings' ),
				panelData = self._readRow( panelRows[ index ] ),
				title = panelData.tab_title || settings.get( 'tab_title' ) || ( 'Tab #' + ( index + 1 ) ),
				isActive = index === self.activeIndex,
				$li = Backbone.$( '<li>', {
					'class': 'elementor-tab-title' + ( isActive ? ' elementor-active' : '' ),
					'role': 'tab',
					'data-tab': index,
					'id': 'elementor-tab-title-' + tabsId + '-' + index,
					'aria-controls': 'elementor-tab-pane-' + tabsId + '-' + index,
					'aria-selected': isActive ? 'true' : 'false'
				} );

			$li.append( Backbone.$( '<span>' ).text( title ) );

			$nav.append( $li );
		} );
	},

	onTabTitleClick: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		var $title = Backbone.$( event.currentTarget ),
			index = parseInt( $title.attr( 'data-tab' ), 10 );

		if ( isNaN( index ) ) {
			return;
		}

		this.setActiveTab( index );
	},

	setActiveTab: function( index ) {
		this.activeIndex = index;
		this.applyActiveStates();
	},

	applyActiveStates: function() {
		var self = this,
			$nav = this.$el.find( '> .elementor-tabs > .elementor-tabs-nav' ).first();

		if ( $nav.length ) {
			$nav.children( '.elementor-tab-title' ).each( function() {
				var $title = Backbone.$( this ),
					idx = parseInt( $title.attr( 'data-tab' ), 10 ),
					isActive = idx === self.activeIndex;

				$title.toggleClass( 'elementor-active', isActive );
				$title.attr( 'aria-selected', isActive ? 'true' : 'false' );
			} );
		}

		// Child tab content views
		if ( this.children && this.children.length ) {
			this.children.each( function( childView, idx ) {
				var isActive = idx === self.activeIndex;
				childView.$el.toggleClass( 'elementor-tab-active', isActive );
			} );
		}
	},

	onAddChild: function() {
		this.renderNav();
		this.applyActiveStates();
	},

	onChildviewRequestDuplicate: function( childView ) {
		var clonedModel = childView.model.clone(),
			index = this.collection.indexOf( childView.model );

		this.addChildModel( clonedModel, { at: index + 1 } );
		this.setActiveTab( index + 1 );
	},

	getContextMenuGroups: function() {
		var groups = [];
		var $settings = this.$el.find( '> .elementor-element-overlay .elementor-editor-element-settings' );

		if ( $settings.length ) {
			var actions = [];

			actions.push( {
				name: 'edit',
				title: elementor.translate ? elementor.translate( 'Edit Tabs' ) : 'Edit Tabs',
				icon: '<i class="eicon-edit"></i>',
				callback: _.bind( function() {
					this.triggerMethod( 'click:edit' );
				}, this )
			} );

			var $duplicate = $settings.find( '.elementor-editor-element-duplicate' );
			var $remove = $settings.find( '.elementor-editor-element-remove' );

			if ( $duplicate.length ) {
				actions.push( {
					name: 'duplicate',
					icon: '<i class="fa fa-copy"></i>',
					title: elementor.translate ? elementor.translate( 'Duplicate' ) : 'Duplicate',
					callback: function() {
						$duplicate.trigger( 'click' );
					}
				} );
			}

			if ( $remove.length ) {
				actions.push( {
					name: 'delete',
					icon: '<i class="fa fa-trash"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate( 'Delete' ) : 'Supprimer',
					callback: function() {
						$remove.trigger( 'click' );
					}
				} );
			}

			if ( actions.length ) {
				groups.push( { name: 'element', actions: actions } );
			}
		}

		return groups;
	}
} );

module.exports = TabsView;
