(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const ContextMenuBehavior = Marionette.Behavior.extend({
    events: {
        // On écoute le clic droit sur la vue entière (tu peux restreindre si besoin)
        'contextmenu': 'onContextMenu',
        'click': 'onClick',
        'keydown': 'onKeyDown',
    },

    onClick(event) {
        if (Backbone.$(event.target).closest('.iqit-context-menu').length) {
            return;
        }
        // Trigger global pour fermer
        if (elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.trigger('context-menu:close');
        }
    },

    onKeyDown(event) {
        if (event.key === 'Escape' || event.keyCode === 27) {
            if (elementor.channels && elementor.channels.editor) {
                elementor.channels.editor.trigger('context-menu:close');
            }
        }
    },

    onContextMenu(event) {

        event.preventDefault();
        event.stopPropagation();

        const view = this.view;

        if (typeof view.getContextMenuGroups !== 'function') {
            return;
        }
        // Groupes propres à la vue
        let groups = view.getContextMenuGroups() || [];

        if (!groups.length) {
            return;
        }

        let coords = {
            clientX: event.clientX,
            clientY: event.clientY,
        };

        // Translater les coordonnées de l'iframe vers la fenêtre parente
        // Les vues Marionette tournent dans le contexte parent mais gèrent
        // des éléments dans l'iframe — window.frameElement est donc null.
        // On récupère l'iframe via elementor.$preview ou via le target de l'événement.
        var iframeEl = null;

        if (elementor && elementor.$preview && elementor.$preview.length) {
            iframeEl = elementor.$preview[0];
        } else if (event.target && event.target.ownerDocument && event.target.ownerDocument.defaultView) {
            var iframeWin = event.target.ownerDocument.defaultView;
            if (iframeWin.frameElement) {
                iframeEl = iframeWin.frameElement;
            }
        }

        if (iframeEl) {
            var iframeRect = iframeEl.getBoundingClientRect();
            coords = {
                clientX: event.clientX + iframeRect.left,
                clientY: event.clientY + iframeRect.top,
            };
        }

        event.realClientX = coords.clientX;
        event.realClientY = coords.clientY;

        // On délègue l’affichage au manager via le channel editor
        if (elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.trigger('context-menu:open', {
                event,
                view,
                groups,
            });
        }
    },
});

module.exports = ContextMenuBehavior;
},{}],2:[function(require,module,exports){
var HandleAddDuplicateBehavior;

HandleAddDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewClickNew: function( childView ) {
		var currentIndex = childView.$el.index() + 1;

		this.addChild( { at: currentIndex } );
	},

	onRequestNew: function() {
		this.addChild();
	},

	addChild: function( options ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		options = options || {};

		var newItem = {
			id: elementor.helpers.getUniqueID(),
			elType: this.view.getChildType()[0],
			settings: {},
			elements: []
		};

		this.view.addChildModel( newItem, options );
	}
} );

module.exports = HandleAddDuplicateBehavior;

},{}],3:[function(require,module,exports){
var HandleElementsRelation;

HandleElementsRelation = Marionette.Behavior.extend( {

	onRequestAdd: function( itemData, options ) {
		this._addChildElement( itemData, options );
	},

	/**
	 *
	 * @param {Object} itemData
	 * @param {Object} options
	 * @private
	 */
	_addChildElement: function( itemData, options ) {
		options = options || {};

		var myChildType = this.view.getChildType();

		if ( -1 === myChildType.indexOf( itemData.elType ) ) {
			delete options.at;

			this.view.children.last().triggerMethod( 'request:add', itemData, options );

			return;
		}

		var newModel = this.view.addChildModel( itemData, options ),
			newView = this.view.children.findByModel( newModel );

		if ( 'section' === newView.getElementType() && newView.isInner() ) {
			newView.addEmptyColumn();
		}

		newView.triggerMethod( 'open:editor' );
	}
} );

module.exports = HandleElementsRelation;

},{}],4:[function(require,module,exports){
var HandleDuplicateBehavior;

HandleDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewClickDuplicate: function( childView ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		var currentIndex = this.view.collection.indexOf( childView.model ),
			newModel = childView.model.clone();

		this.view.addChildModel( newModel, { at: currentIndex } );
	}
} );

module.exports = HandleDuplicateBehavior;
},{}],5:[function(require,module,exports){
var HandleEditModeBehavior;

HandleEditModeBehavior = Marionette.Behavior.extend( {
	initialize: function() {
		this.listenTo( elementor.channels.dataEditMode, 'switch', this.onEditModeSwitched );
	},

	onEditModeSwitched: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		this.view.$el.toggleClass( 'elementor-active-mode', 'preview' !== activeMode );
	},

	onRender: function() {
		this.onEditModeSwitched();
	}
} );

module.exports = HandleEditModeBehavior;

},{}],6:[function(require,module,exports){
var HandleEditorBehavior;

HandleEditorBehavior = Marionette.Behavior.extend( {

	onClickEdit: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		if ( 'preview' === activeMode ) {
			return;
		}

		this.onOpenEditor();
	},

	onOpenEditor: function() {
		var currentPanelPageName = elementor.getPanelView().getCurrentPageName();

		if ( 'editor' === currentPanelPageName ) {
			var currentPanelPageView = elementor.getPanelView().getCurrentPageView(),
				currentEditableModel = currentPanelPageView.model;

			if ( currentEditableModel === this.view.model ) {
				return;
			}
		}

		var elementData = elementor.getElementData( this.view.model );

		elementor.getPanelView().setPage( 'editor', elementor.translate( 'edit_element', [ elementData.title ] ), {
			model: this.view.model,
			editedElementView: this.view
		} );
	}
} );

module.exports = HandleEditorBehavior;

},{}],7:[function(require,module,exports){
var ResizableBehavior;

ResizableBehavior = Marionette.Behavior.extend( {
	defaults: {
		handles: elementor.config.is_rtl ? 'w' : 'e'
	},

	ui: {
		columnTitle: '.column-title'
	},

	events: {
		resizestart: 'onResizeStart',
		resizestop: 'onResizeStop',
		resize: 'onResize'
	},

	initialize: function() {
		Marionette.Behavior.prototype.initialize.apply( this, arguments );

		this.listenTo( elementor.channels.dataEditMode, 'switch', this.onEditModeSwitched );
	},

	active: function() {
		var options = _.clone( this.options );

		delete options.behaviorClass;

		var $childViewContainer = this.getChildViewContainer(),
			defaultResizableOptions = {},
			resizableOptions = _.extend( defaultResizableOptions, options );

		$childViewContainer.resizable( resizableOptions );
	},

	deactivate: function() {
		if ( this.getChildViewContainer().resizable( 'instance' ) ) {
			this.getChildViewContainer().resizable( 'destroy' );
		}
	},

	onEditModeSwitched: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		if ( 'preview' !== activeMode ) {
			this.active();
		} else {
			this.deactivate();
		}
	},

	onRender: function() {
		// Call this method from other thread (non-block UI)
		_.defer( _.bind( this.onEditModeSwitched, this ) );
	},

	onDestroy: function() {
		this.deactivate();
	},

	onResizeStart: function( event ) {
		event.stopPropagation();

		this.view.triggerMethod( 'request:resize:start' );
	},

	onResizeStop: function( event ) {
		event.stopPropagation();

		this.view.triggerMethod( 'request:resize:stop' );
	},

	onResize: function( event, ui ) {
		event.stopPropagation();

		this.view.triggerMethod( 'request:resize', ui );
	},

	getChildViewContainer: function() {
		return this.$el;
	}
} );

module.exports = ResizableBehavior;

},{}],8:[function(require,module,exports){
var SortableBehavior;

SortableBehavior = Marionette.Behavior.extend( {
	defaults: {
		elChildType: 'widget'
	},

	events: {
		'sortstart': 'onSortStart',
		'sortreceive': 'onSortReceive',
		'sortupdate': 'onSortUpdate',
		'sortstop': 'onSortStop',
		'sortover': 'onSortOver',
		'sortout': 'onSortOut'
	},

	initialize: function() {
		this.listenTo( elementor.channels.dataEditMode, 'switch', this.onEditModeSwitched );
		this.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	onEditModeSwitched: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		if ( 'preview' !== activeMode ) {
			this.active();
		} else {
			this.deactivate();
		}
	},

	onDeviceModeChange: function() {
		var deviceMode = elementor.channels.deviceMode.request( 'currentMode' );

		if ( 'desktop' === deviceMode ) {
			this.active();
		} else {
			this.deactivate();
		}
	},

	onRender: function() {
		_.defer( _.bind( this.onEditModeSwitched, this ) );
	},

	onDestroy: function() {
		this.deactivate();
	},

	active: function() {
		if ( this.getChildViewContainer().sortable( 'instance' ) ) {
			return;
		}

		var $childViewContainer = this.getChildViewContainer(),
			defaultSortableOptions = {
				connectWith: $childViewContainer.selector,
				cursor: 'move',
				placeholder: 'elementor-sortable-placeholder',
				cursorAt: {
					top: 20,
					left: 25
				},
				helper: _.bind( this._getSortableHelper, this )
			},
			sortableOptions = _.extend( defaultSortableOptions, this.view.getSortableOptions() );

		$childViewContainer.sortable( sortableOptions );
	},

	_getSortableHelper: function( event, $item ) {
		var model = this.view.collection.get( {
			cid: $item.data( 'model-cid' )
		} );

		return '<div style="height: 84px; width: 125px;" class="elementor-sortable-helper elementor-sortable-helper-' + model.get( 'elType' ) + '"><div class="icon"><i class="eicon-' + model.getIcon() + '"></i></div><div class="elementor-element-title-wrapper"><div class="title">' + model.getTitle() + '</div></div></div>';
	},

	deactivate: function() {
		if ( this.getChildViewContainer().sortable( 'instance' ) ) {
			this.getChildViewContainer().sortable( 'destroy' );
		}
	},

	onSortStart: function( event, ui ) {
		event.stopPropagation();

		var model = this.view.collection.get( {
			cid: ui.item.data( 'model-cid' )
		} );

		if ( 'column' === this.options.elChildType ) {
			// the following code is just for touch
			ui.placeholder.addClass( 'elementor-column' );

			var uiData = ui.item.data( 'sortableItem' ),
				uiItems = uiData.items,
				itemHeight = 0;

			uiItems.forEach( function( item ) {
				if ( item.item[0] === ui.item[0] ) {
					itemHeight = item.height;
					return false;
				}
			} );

			ui.placeholder.height( itemHeight );

			// ui.placeholder.addClass( 'elementor-column elementor-col-' + model.getSetting( 'size' ) );
		}

		elementor.channels.data.trigger( model.get( 'elType' ) + ':drag:start' );

		elementor.channels.data.reply( 'cache:' + model.cid, model );
	},

	onSortOver: function( event, ui ) {
		event.stopPropagation();

		var model = elementor.channels.data.request( 'cache:' + ui.item.data( 'model-cid' ) );

		Backbone.$( event.target )
			.addClass( 'elementor-draggable-over' )
			.attr( {
				'data-dragged-element': model.get( 'elType' ),
				'data-dragged-is-inner': model.get( 'isInner' )
			} );

		this.$el.addClass( 'elementor-dragging-on-child' );
	},

	onSortOut: function( event ) {
		event.stopPropagation();

		Backbone.$( event.target )
			.removeClass( 'elementor-draggable-over' )
			.removeAttr( 'data-dragged-element data-dragged-is-inner' );

		this.$el.removeClass( 'elementor-dragging-on-child' );
	},

	onSortReceive: function( event, ui ) {
		event.stopPropagation();

		if ( this.view.isCollectionFilled() ) {
			Backbone.$( ui.sender ).sortable( 'cancel' );
			return;
		}

		var model = elementor.channels.data.request( 'cache:' + ui.item.data( 'model-cid' ) ),
			draggedElType = model.get( 'elType' ),
			draggedIsInnerSection = 'section' === draggedElType && model.get( 'isInner' ),
			targetIsInnerColumn = 'column' === this.view.getElementType() && this.view.isInner();

		if ( draggedIsInnerSection && targetIsInnerColumn ) {
			Backbone.$( ui.sender ).sortable( 'cancel' );
			return;
		}

		var newIndex = ui.item.parent().children().index( ui.item ),
			newModel = new this.view.collection.model( model.toJSON( { copyHtmlCache: true } ) );

		this.view.addChildModel( newModel, { at: newIndex } );

		elementor.channels.data.trigger( draggedElType + ':drag:end' );

		model.destroy();
	},

	onSortUpdate: function( event, ui ) {
		event.stopPropagation();

		var model = this.view.collection.get( ui.item.attr( 'data-model-cid' ) );
		if ( model ) {
			elementor.channels.data.trigger( model.get( 'elType' ) + ':drag:end' );
		}
	},

	onSortStop: function( event, ui ) {
		event.stopPropagation();

		var $childElement = ui.item,
			collection = this.view.collection,
			model = collection.get( $childElement.attr( 'data-model-cid' ) ),
			newIndex = $childElement.parent().children().index( $childElement );

		if ( this.getChildViewContainer()[0] === ui.item.parent()[0] ) {
			if ( null === ui.sender && model ) {
				var oldIndex = collection.indexOf( model );

				if ( oldIndex !== newIndex ) {
					collection.remove( model );
					this.view.addChildModel( model, { at: newIndex } );

					elementor.setFlagEditorChange( true );
				}

				elementor.channels.data.trigger( model.get( 'elType' ) + ':drag:end' );
			}
		}
	},

	onAddChild: function( view ) {
		view.$el.attr( 'data-model-cid', view.model.cid );
	},

	getChildViewContainer: function() {
		if ( 'function' === typeof this.view.getChildViewContainer ) {
			// CompositeView
			return this.view.getChildViewContainer( this.view );
		} else {
			// CollectionView
			return this.$el;
		}
	}
} );

module.exports = SortableBehavior;
},{}],9:[function(require,module,exports){
var InnerTabsBehavior = Marionette.Behavior.extend({

    onRenderCollection: function () {
        this.handleInnerTabs(this.view);
    },

    handleInnerTabs: function (parent) {
        var closedClass = 'elementor-tab-close',
            activeClass = 'elementor-tab-active';

        var tabsWrappers = parent.children.filter(function (view) {
            return view.model.get('type') === 'tabs';
        });

        _.each(tabsWrappers, function (wrapperView) {
            wrapperView.$el.find('.elementor-control-content').remove();

            var tabsWrapperId = wrapperView.model.get('name');

            var tabs = parent.children.filter(function (childView) {
                return childView.model.get('type') === 'tab' &&
                    childView.model.get('tabs_wrapper') === tabsWrapperId;
            });

            _.each(tabs, function (tabView, index) {

                wrapperView._addChildView(tabView);

                var tabId = tabView.model.get('name');

                tabView.$el
                    .off('click.iqiTab')
                    .on('click.iqiTab', function (event) {
                        event.preventDefault();
                        tabView.triggerMethod('control:tab:clicked');
                    });

                var controlsUnderTab = parent.children.filter(function (controlView) {
                    return controlView.model.get('inner_tab') === tabId;
                });

                if (index === 0) {
                    tabView.$el.addClass(activeClass);
                } else {
                    _.each(controlsUnderTab, function (controlView) {
                        controlView.$el.addClass(closedClass);
                    });
                }
            });
        });
    },

    onChildviewControlTabClicked: function (childView) {
        var closedClass = 'elementor-tab-close';
        var activeClass = 'elementor-tab-active';

        var clickedTabName = childView.model.get('name');
        var tabsWrapperId = childView.model.get('tabs_wrapper');

        var siblingTabs = this.view.children.filter(function (view) {
            return view.model.get('type') === 'tab' &&
                view.model.get('tabs_wrapper') === tabsWrapperId;
        });

        var tabNames = _.map(siblingTabs, function (view) {
            return view.model.get('name');
        });

        var childrenUnderTab = this.view.children.filter(function (view) {
            return _.contains(tabNames, view.model.get('inner_tab'));
        });

        _.each(siblingTabs, function (view) {
            view.$el.removeClass(activeClass);
        });

        childView.$el.addClass(activeClass);

        _.each(childrenUnderTab, function (view) {
            if (view.model.get('inner_tab') === clickedTabName) {
                view.$el.removeClass(closedClass);
            } else {
                view.$el.addClass(closedClass);
            }
        });

        elementor.getPanelView().updateScrollbar();
    }
});

module.exports = InnerTabsBehavior;
},{}],10:[function(require,module,exports){
var ContextMenuView = Marionette.ItemView.extend( {
    tagName: 'div',
    className: 'iqit-context-menu',
    template: false, // On gère le HTML à la main

    ui: {
        list: '.iqit-context-menu-list'
    },

    events: {
        'click .iqit-context-menu-item': 'onItemClick'
    },

    initialize: function() {
        // Vue Marionette => même logique que Backbone.View, mais plus cohérente avec le reste
        this.context = null;

        this.$el.html( '<ul class="iqit-context-menu-list"></ul>' );
        Backbone.$( 'body' ).append( this.el );
        this.hide();

        // On écoute un channel de l’éditeur
        if ( elementor.channels && elementor.channels.editor ) {
            this.listenTo( elementor.channels.editor, 'context-menu:open', this.onOpen );
            this.listenTo( elementor.channels.editor, 'context-menu:close', this.hide.bind( this ) );
        }
    },

    onOpen: function( payload ) {
        var event  = payload.event,
            view   = payload.view,
            groups = payload.groups,
            menuX = event.realClientX,
            menuY = event.realClientY
        ;

        this.context = { event: event, view: view, groups: groups };
        this.renderMenu();

        // Positionner en fixed puis vérifier les limites de l'écran
        this.$el.css( {
            left: menuX,
            top: menuY,
            position: 'fixed'
        } ).show();

        // Empêcher le menu de sortir de l'écran
        var menuWidth = this.$el.outerWidth(),
            menuHeight = this.$el.outerHeight(),
            winWidth = Backbone.$(window).width(),
            winHeight = Backbone.$(window).height();

        if (menuX + menuWidth > winWidth) {
            menuX = winWidth - menuWidth - 5;
        }
        if (menuY + menuHeight > winHeight) {
            menuY = winHeight - menuHeight - 5;
        }

        this.$el.css({ left: menuX, top: menuY });
    },

    hide: function() {
        this.$el.hide();
        this.context = null;
    },

    renderMenu: function() {
        var $list = this.$( '.iqit-context-menu-list' );
        $list.empty();

        if ( ! this.context || ! this.context.groups ) {
            return;
        }


        this.context.groups.forEach( function( group ) {
            ( group.actions || [] ).forEach( function( action ) {

                // Ajouter un séparateur avant si demandé
                if (action.separator === 'before') {
                    $list.append('<li class="iqit-context-menu-separator"></li>');
                }

                var $item = Backbone.$('<li class="iqit-context-menu-item" />')
                    .attr('data-action', action.name)
                    .data('actionData', action);

                // Construire contenu avec icône si fournie
                var text = action.title || action.name;
                var iconHtml = action.icon ? '<span class="iqit-context-menu-icon">' + action.icon + '</span>' : '';

                $item.html(iconHtml + '<span class="iqit-context-menu-label">' + text + '</span>');

                $list.append( $item );
            } );
        } );
    },


    onItemClick: function( event ) {
        event.stopPropagation();

        var $item   = this.$( event.currentTarget ),
            action  = $item.data( 'actionData' ),
            context = this.context;

        if ( action && 'function' === typeof action.callback ) {
            action.callback( context );
        }

        this.hide();
    }
} );


let singletonInstance = null;

module.exports = function initContextMenu() {
    if (!singletonInstance) {
        singletonInstance = new ContextMenuView();
    }
}
},{}],11:[function(require,module,exports){
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
		'click @ui.listToggle': 'onListToggleClick',
		'click @ui.toggle': 'onVisibilityToggle',
		'click @ui.item': 'onItemClick',
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

		// Collapsed state (default: all collapsed)
		this._collapsed = true;
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

		// Find the editor view for this container and use its addChildModel (same as sortable.js)
		var containerEditorView = this._findEditorView( this.model );

		if ( containerEditorView ) {
			// Suppress navigator re-render during sort (DOM already correct)
			this._suppressRefresh = true;
			containerEditorView.collection.remove( model );
			containerEditorView.addChildModel( model, { at: newIndex } );
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

		// Find the editor view for this container (the drop target)
		var targetEditorView = this._findEditorView( this.model );

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
		event.stopImmediatePropagation();
		this._collapsed = ! this._collapsed;
		this.$el.toggleClass( 'elementor-navigator__element--collapsed', this._collapsed );
	},

	onVisibilityToggle: function( event ) {
		event.stopPropagation();
		event.stopImmediatePropagation();

		var isHidden = ! this.$el.hasClass( 'elementor-navigator__element--hidden' );
		this.$el.toggleClass( 'elementor-navigator__element--hidden', isHidden );

		// Hide/show the element in the editor preview via native DOM
		var elementId = this.model.get( 'id' );
		var iframe = document.getElementById( 'elementor-preview-iframe' );

		if ( iframe && iframe.contentDocument ) {
			var el = iframe.contentDocument.querySelector( '[data-id="' + elementId + '"]' );

			if ( el ) {
				el.style.display = isHidden ? 'none' : '';
			}
		}
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
			containment: 'window',
			distance: 10
		} );

		// Make the panel resizable by the footer (south handle)
		if ( $.fn.resizable ) {
			this.$el.resizable( {
				handles: { s: '#elementor-navigator__footer' },
				minHeight: 250
			} );
		}
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

},{}],12:[function(require,module,exports){
var StyleModel = require( 'elementor-styles/models/style' );

var StyleCollection = Backbone.Collection.extend( {
	model: StyleModel
} );

module.exports = StyleCollection;

},{"elementor-styles/models/style":14}],13:[function(require,module,exports){
var StyleLibraryLayoutView = require( 'elementor-styles/views/layout' ),
	StyleCollection = require( 'elementor-styles/collections/styles' ),
	StyleLibraryManager;

StyleLibraryManager = function() {
	var self = this,
		modal,
		deleteDialog,
		layout,
		stylesCollection;

	// ------------------------------------------------------------------
	//  Collection helpers
	// ------------------------------------------------------------------

	var ensureCollection = function() {
		if ( ! stylesCollection ) {
			var data = ( elementor.config && elementor.config.widgetStyles ) || [];
			stylesCollection = new StyleCollection( data );
		}
	};

	this.getStylesCollection = function() {
		ensureCollection();
		return stylesCollection;
	};

	/**
	 * Return styles filtered by widget type.
	 */
	this.getStylesForWidget = function( widgetType ) {
		ensureCollection();
		return stylesCollection.filter( function( model ) {
			return model.get( 'widget_type' ) === widgetType;
		} );
	};

	/**
	 * Return the default style for a widget type, or null.
	 */
	this.getDefaultStyle = function( widgetType ) {
		ensureCollection();
		return stylesCollection.find( function( model ) {
			return model.get( 'widget_type' ) === widgetType && model.get( 'is_default' );
		} ) || null;
	};

	// ------------------------------------------------------------------
	//  Modal management
	// ------------------------------------------------------------------

	this.getModal = function() {
		if ( ! modal ) {
			modal = elementor.dialogsManager.createWidget( 'elementor-modal', {
				id: 'elementor-style-library-modal',
				closeButton: false
			} );
		}
		return modal;
	};

	this.getLayout = function() {
		return layout;
	};

	var initLayout = function() {
		layout = new StyleLibraryLayoutView();
	};

	this.startModal = function( onReady ) {
		self.getModal().show();

		if ( ! layout ) {
			initLayout();
		}

		layout.showLoadingView();

		self.requestStyles( function() {
			if ( onReady ) {
				onReady();
			}
		} );
	};

	// ------------------------------------------------------------------
	//  AJAX
	// ------------------------------------------------------------------

	this.requestStyles = function( callback, forceUpdate ) {
		if ( stylesCollection && ! forceUpdate ) {
			if ( callback ) {
				callback();
			}
			return;
		}

		elementor.ajax.send( 'GetWidgetStyles', {
			success: function( data ) {
				stylesCollection = new StyleCollection( data );

				// Keep config cache in sync
				elementor.config.widgetStyles = data;

				if ( callback ) {
					callback();
				}
			}
		} );
	};

	this.saveStyle = function( widgetType, name, settings, callback ) {
		elementor.ajax.send( 'SaveWidgetStyle', {
			data: {
				widget_type: widgetType,
				name: name,
				settings: JSON.stringify( settings )
			},
			success: function( data ) {
				if ( ! stylesCollection ) {
					stylesCollection = new StyleCollection();
				}

				var styleData = {
					id_widget_style: data.id_widget_style,
					widget_type: data.widget_type,
					name: data.name,
					settings: settings,
					is_default: data.is_default,
					export_link: data.export_link || ''
				};

				var newModel = stylesCollection.add( styleData );

				// Also update the config cache
				if ( ! elementor.config.widgetStyles ) {
					elementor.config.widgetStyles = [];
				}
				elementor.config.widgetStyles.push( styleData );

				if ( callback ) {
					callback( newModel );
				}
			}
		} );
	};

	// ------------------------------------------------------------------
	//  Delete
	// ------------------------------------------------------------------

	this.getDeleteDialog = function() {
		if ( ! deleteDialog ) {
			deleteDialog = elementor.dialogsManager.createWidget( 'confirm', {
				id: 'elementor-style-library-delete-dialog',
				headerMessage: elementor.translate( 'delete_style' ),
				message: elementor.translate( 'delete_style_confirm' ),
				strings: {
					confirm: elementor.translate( 'delete' )
				}
			} );
		}
		return deleteDialog;
	};

	this.deleteStyle = function( styleModel ) {
		var dialog = self.getDeleteDialog();

		dialog.onConfirm = function() {
			elementor.ajax.send( 'DeleteWidgetStyle', {
				data: {
					id_widget_style: styleModel.get( 'id_widget_style' )
				},
				success: function() {
					// Remove from config cache
					self._removeFromConfigCache( styleModel.get( 'id_widget_style' ) );

					stylesCollection.remove( styleModel, { silent: true } );
					self.showStyles();
				}
			} );
		};

		dialog.show();
	};

	// ------------------------------------------------------------------
	//  Set / unset default
	// ------------------------------------------------------------------

	this.toggleDefault = function( styleModel ) {
		elementor.ajax.send( 'SetWidgetStyleDefault', {
			data: {
				id_widget_style: styleModel.get( 'id_widget_style' )
			},
			success: function( data ) {
				var widgetType = styleModel.get( 'widget_type' );

				// Reset all defaults for this widget type in collection
				stylesCollection.each( function( m ) {
					if ( m.get( 'widget_type' ) === widgetType ) {
						m.set( 'is_default', 0, { silent: true } );
					}
				} );

				styleModel.set( 'is_default', data.is_default );

				// Update config cache
				self._syncConfigCache();

				// Re-render if modal is open
				if ( layout ) {
					self.showStyles();
				}
			}
		} );
	};

	// ------------------------------------------------------------------
	//  Apply a style to a widget model
	// ------------------------------------------------------------------

	this.applyStyle = function( styleModel, targetWidgetModel ) {
		var settings = styleModel.get( 'settings' );
		if ( ! settings || typeof settings !== 'object' ) {
			return;
		}

		var targetSettings = targetWidgetModel.get( 'settings' );
		if ( ! targetSettings ) {
			return;
		}

		// Merge style settings onto the target widget
		Object.keys( settings ).forEach( function( key ) {
			// Skip system keys
			if ( key === 'widgetType' || key === 'elType' || key === 'isInner' ) {
				return;
			}
			targetSettings.set( key, settings[ key ] );
		} );
	};

	// ------------------------------------------------------------------
	//  View display
	// ------------------------------------------------------------------

	this.showStyles = function() {
		layout.showStylesView( stylesCollection );
	};

	this.showSaveStyleView = function( widgetType, settings ) {
		layout.showSaveStyleView( widgetType, settings );
	};

	// ------------------------------------------------------------------
	//  Config cache helpers
	// ------------------------------------------------------------------

	this._removeFromConfigCache = function( id ) {
		if ( ! elementor.config.widgetStyles ) {
			return;
		}
		elementor.config.widgetStyles = elementor.config.widgetStyles.filter( function( s ) {
			return s.id_widget_style !== id;
		} );
	};

	this._syncConfigCache = function() {
		if ( ! stylesCollection ) {
			return;
		}
		elementor.config.widgetStyles = stylesCollection.toJSON();
	};
};

module.exports = new StyleLibraryManager();

},{"elementor-styles/collections/styles":12,"elementor-styles/views/layout":15}],14:[function(require,module,exports){
var StyleModel = Backbone.Model.extend( {
	defaults: {
		id_widget_style: 0,
		widget_type: '',
		name: '',
		settings: {},
		is_default: 0,
		export_link: ''
	}
} );

module.exports = StyleModel;

},{}],15:[function(require,module,exports){
var StyleLibraryHeaderView = require( 'elementor-styles/views/parts/header' ),
	StyleLibraryHeaderLogoView = require( 'elementor-styles/views/parts/header-logo' ),
	StyleLibraryHeaderSaveView = require( 'elementor-styles/views/parts/header-save' ),
	StyleLibraryHeaderLoadView = require( 'elementor-styles/views/parts/header-load' ),
	StyleLibraryLoadingView = require( 'elementor-styles/views/parts/loading' ),
	StyleLibraryCollectionView = require( 'elementor-styles/views/parts/styles' ),
	StyleLibrarySaveView = require( 'elementor-styles/views/parts/save-style' ),
	StyleLibraryLoadStyleView = require( 'elementor-styles/views/parts/load-style' ),
	StyleLibraryLayoutView;

StyleLibraryLayoutView = Marionette.LayoutView.extend( {
	el: '#elementor-style-library-modal',

	regions: {
		modalContent: '.dialog-message',
		modalHeader: '.dialog-widget-header'
	},

	initialize: function() {
		this.getRegion( 'modalHeader' ).show( new StyleLibraryHeaderView() );
	},

	getHeaderView: function() {
		return this.getRegion( 'modalHeader' ).currentView;
	},

	showLoadingView: function() {
		this.getRegion( 'modalContent' ).show( new StyleLibraryLoadingView() );
	},

	showStylesView: function( stylesCollection ) {
		this.getRegion( 'modalContent' ).show( new StyleLibraryCollectionView( {
			collection: stylesCollection
		} ) );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.show( new StyleLibraryHeaderSaveView() );
		headerView.tools2.show( new StyleLibraryHeaderLoadView() );
	},

	showSaveStyleView: function( widgetType, settings ) {
		this.getRegion( 'modalContent' ).show( new StyleLibrarySaveView( {
			widgetType: widgetType,
			settings: settings
		} ) );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.reset();
		headerView.tools2.show( new StyleLibraryHeaderLoadView() );
	},

	showLoadStyleView: function() {
		this.getRegion( 'modalContent' ).show( new StyleLibraryLoadStyleView() );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.show( new StyleLibraryHeaderSaveView() );
		headerView.tools2.reset();
	}
} );

module.exports = StyleLibraryLayoutView;

},{"elementor-styles/views/parts/header":19,"elementor-styles/views/parts/header-load":16,"elementor-styles/views/parts/header-logo":17,"elementor-styles/views/parts/header-save":18,"elementor-styles/views/parts/load-style":20,"elementor-styles/views/parts/loading":21,"elementor-styles/views/parts/save-style":22,"elementor-styles/views/parts/styles":25}],16:[function(require,module,exports){
var StyleLibraryHeaderLoadView;

StyleLibraryHeaderLoadView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-load',

	id: 'elementor-style-library-header-load',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.getLayout().showLoadStyleView();
	}
} );

module.exports = StyleLibraryHeaderLoadView;

},{}],17:[function(require,module,exports){
var StyleLibraryHeaderLogoView;

StyleLibraryHeaderLogoView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-logo',

	id: 'elementor-style-library-header-logo',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.showStyles();
	}
} );

module.exports = StyleLibraryHeaderLogoView;

},{}],18:[function(require,module,exports){
var StyleLibraryHeaderSaveView;

StyleLibraryHeaderSaveView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-save',

	id: 'elementor-style-library-header-save',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.getLayout().showSaveStyleView( '', {} );
	}
} );

module.exports = StyleLibraryHeaderSaveView;

},{}],19:[function(require,module,exports){
var StyleLibraryHeaderView;

StyleLibraryHeaderView = Marionette.LayoutView.extend( {
	id: 'elementor-style-library-header',

	template: '#tmpl-elementor-style-library-header',

	regions: {
		logoArea: '#elementor-style-library-header-logo-area',
		tools: '#elementor-style-library-header-tools',
		tools2: '#elementor-style-library-header-tools2',
		menuArea: '#elementor-style-library-header-menu-area'
	},

	ui: {
		closeModal: '#elementor-style-library-header-close-modal'
	},

	events: {
		'click @ui.closeModal': 'onCloseModalClick'
	},

	onCloseModalClick: function() {
		elementor.styleLibrary.getModal().hide();
	}
} );

module.exports = StyleLibraryHeaderView;

},{}],20:[function(require,module,exports){
var StyleLibraryLoadView;

StyleLibraryLoadView = Marionette.ItemView.extend( {
	id: 'elementor-style-library-load-style',

	template: '#tmpl-elementor-style-library-load-style',

	ui: {
		form: '#elementor-style-library-load-style-form',
		submitButton: '#elementor-style-library-load-style-submit',
		fileInput: '#elementor-style-library-load-style-file',
		fileInputNice: '#elementor-style-library-load-btn-file'
	},

	events: {
		'submit @ui.form': 'onFormSubmit',
		'change @ui.fileInput': 'onFileChange'
	},

	onFileChange: function() {
		Backbone.$( this.ui.fileInputNice ).text(
			Backbone.$( this.ui.fileInput )[0].files[0].name
		);
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		this.ui.submitButton.addClass( 'elementor-btn-state' );

		elementor.ajax.send( 'ImportWidgetStyle', {
			data: new FormData( this.ui.form[0] ),
			processData: false,
			contentType: false,
			success: function( data ) {
				elementor.styleLibrary.getStylesCollection().add( data );
				elementor.styleLibrary._syncConfigCache();
				elementor.styleLibrary.showStyles();
			},
			error: function() {
				elementor.styleLibrary.showStyles();
			}
		} );
	}
} );

module.exports = StyleLibraryLoadView;

},{}],21:[function(require,module,exports){
var StyleLibraryLoadingView;

StyleLibraryLoadingView = Marionette.ItemView.extend( {
	id: 'elementor-style-library-loading',

	template: '#tmpl-elementor-style-library-loading'
} );

module.exports = StyleLibraryLoadingView;

},{}],22:[function(require,module,exports){
var StyleLibrarySaveView;

StyleLibrarySaveView = Marionette.ItemView.extend( {
	id: 'elementor-style-library-save-style',

	template: '#tmpl-elementor-style-library-save-style',

	ui: {
		form: '#elementor-style-library-save-style-form',
		submitButton: '#elementor-style-library-save-style-submit',
		nameInput: '#elementor-style-library-save-style-name',
		widgetTypeInput: '#elementor-style-library-save-widget-type',
		settingsInput: '#elementor-style-library-save-settings'
	},

	events: {
		'submit @ui.form': 'onFormSubmit'
	},

	onRender: function() {
		var widgetType = this.getOption( 'widgetType' ) || '';
		var settings = this.getOption( 'settings' ) || {};

		this.ui.widgetTypeInput.val( widgetType );
		this.ui.settingsInput.val( JSON.stringify( settings ) );
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		var self = this;
		var name = this.ui.nameInput.val().trim();
		var widgetType = this.ui.widgetTypeInput.val();
		var settings = this.getOption( 'settings' ) || {};

		if ( ! name ) {
			return;
		}

		self.ui.submitButton.addClass( 'elementor-btn-state' );

		elementor.styleLibrary.saveStyle( widgetType, name, settings, function() {
			elementor.styleLibrary.showStyles();
		} );
	}
} );

module.exports = StyleLibrarySaveView;

},{}],23:[function(require,module,exports){
var StyleItemView;

StyleItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-style-item',

	className: 'elementor-style-library-style-item',

	ui: {
		defaultBtn: '.elementor-style-library-style-default-toggle',
		deleteBtn: '.elementor-style-library-style-delete'
	},

	events: {
		'click @ui.deleteBtn': 'onDeleteClick',
		'click @ui.defaultBtn': 'onDefaultClick'
	},

	modelEvents: {
		'change:is_default': 'render'
	},

	onDeleteClick: function() {
		elementor.styleLibrary.deleteStyle( this.model );
	},

	onDefaultClick: function() {
		elementor.styleLibrary.toggleDefault( this.model );
	}
} );

module.exports = StyleItemView;

},{}],24:[function(require,module,exports){
var StyleLibraryEmptyView;

StyleLibraryEmptyView = Marionette.ItemView.extend( {
	id: 'elementor-style-library-styles-empty',

	template: '#tmpl-elementor-style-library-styles-empty'
} );

module.exports = StyleLibraryEmptyView;

},{}],25:[function(require,module,exports){
var StyleItemView = require( 'elementor-styles/views/parts/style-item' ),
	StylesEmptyView = require( 'elementor-styles/views/parts/styles-empty' ),
	StyleLibraryCollectionView;

StyleLibraryCollectionView = Marionette.CompositeView.extend( {
	template: '#tmpl-elementor-style-library-styles',

	id: 'elementor-style-library-styles',

	childViewContainer: '#elementor-style-library-styles-container',

	emptyView: StylesEmptyView,

	childView: StyleItemView,

	ui: {
		filterSelect: '#elementor-style-library-filter-widget-type'
	},

	events: {
		'change @ui.filterSelect': 'onFilterChange'
	},

	onRender: function() {
		this._populateWidgetTypeDropdown();
	},

	/**
	 * Build the widget type dropdown from the collection data.
	 */
	_populateWidgetTypeDropdown: function() {
		var $select = this.ui.filterSelect;
		var types = {};

		this.collection.each( function( model ) {
			var wt = model.get( 'widget_type' );
			if ( wt && ! types[ wt ] ) {
				types[ wt ] = true;
			}
		} );

		var sortedTypes = Object.keys( types ).sort();

		sortedTypes.forEach( function( wt ) {
			// Try to get a human-readable title from elementor config
			var title = wt;
			if ( elementor.config && elementor.config.widgets && elementor.config.widgets[ wt ] ) {
				title = elementor.config.widgets[ wt ].title || wt;
			}
			$select.append(
				Backbone.$( '<option>' ).val( wt ).text( title )
			);
		} );
	},

	filter: function( childModel ) {
		var filterValue = this._filterWidgetType;

		if ( ! filterValue ) {
			return true;
		}

		return childModel.get( 'widget_type' ) === filterValue;
	},

	onFilterChange: function() {
		this._filterWidgetType = this.ui.filterSelect.val();
		this._renderChildren();
	}
} );

module.exports = StyleLibraryCollectionView;

},{"elementor-styles/views/parts/style-item":23,"elementor-styles/views/parts/styles-empty":24}],26:[function(require,module,exports){
var TemplateLibraryTemplateModel = require( 'elementor-templates/models/template' ),
	TemplateLibraryCollection;

TemplateLibraryCollection = Backbone.Collection.extend( {
	model: TemplateLibraryTemplateModel
} );

module.exports = TemplateLibraryCollection;

},{"elementor-templates/models/template":28}],27:[function(require,module,exports){
var TemplateLibraryLayoutView = require( 'elementor-templates/views/layout' ),
	TemplateLibraryCollection = require( 'elementor-templates/collections/templates' ),
	TemplateLibraryManager;

TemplateLibraryManager = function() {
	var self = this,
		modal,
		deleteDialog,
		errorDialog,
		layout,
		templatesCollection;

	var initLayout = function() {
		layout = new TemplateLibraryLayoutView();
	};

	this.deleteTemplate = function( templateModel ) {
		var dialog = self.getDeleteDialog();

		dialog.onConfirm = function() {
			elementor.ajax.send( 'deleteTemplate', {
				data: {
					source: templateModel.get( 'source' ),
					template_id: templateModel.get( 'template_id' )
				},
				success: function() {
					templatesCollection.remove( templateModel, { silent: true } );

					self.showTemplates();
				}
			} );
		};

		dialog.show();
	};

	this.importTemplate = function( templateModel ) {
		layout.showLoadingView();

		elementor.ajax.send( 'getTemplateContent', {
			data: {
				source: templateModel.get( 'source' ),
				post_id: elementor.config.post_id,
				template_id: templateModel.get( 'template_id' )
			},
			success: function( data ) {
				self.getModal().hide();
				var newdata = self.generateNewTemplateIds(data);

				elementor.getRegion( 'sections' ).currentView.addChildModel( newdata );
			},
			error: function( data ) {
				self.showErrorDialog( data.message );
			}
		} );
	};

	this.generateNewTemplateIds = function( data ) {

		var newCollection = [];

		data.forEach( function( model, index ) {
			model.id = elementor.helpers.getUniqueID();
			newCollection[index] =  model;

			if(model.elements){
				self.generateNewTemplateIds(model.elements);
			}
		} );

		return newCollection;

	};


	this.getDeleteDialog = function() {
		if ( ! deleteDialog ) {
			deleteDialog = elementor.dialogsManager.createWidget( 'confirm', {
				id: 'elementor-template-library-delete-dialog',
				headerMessage: elementor.translate( 'delete_template' ),
				message: elementor.translate( 'delete_template_confirm' ),
				strings: {
					confirm: elementor.translate( 'delete' )
				}
			} );
		}

		return deleteDialog;
	};

	this.getErrorDialog = function() {
		if ( ! errorDialog ) {
			errorDialog = elementor.dialogsManager.createWidget( 'alert', {
				id: 'elementor-template-library-error-dialog',
				headerMessage: elementor.translate( 'an_error_occurred' )
			} );
		}

		return errorDialog;
	};

	this.getModal = function() {
		if ( ! modal ) {
			modal = elementor.dialogsManager.createWidget( 'elementor-modal', {
				id: 'elementor-template-library-modal',
				closeButton: false
			} );
		}

		return modal;
	};

	this.getLayout = function() {
		return layout;
	};

	this.getTemplatesCollection = function() {
		return templatesCollection;
	};

	this.requestRemoteTemplates = function( callback, forceUpdate ) {
		if ( templatesCollection && ! forceUpdate ) {
			if ( callback ) {
				callback();
			}

			return;
		}

		elementor.ajax.send( 'GetTemplates', {
			success: function( data ) {
				templatesCollection = new TemplateLibraryCollection( data );

				if ( callback ) {
					callback();
				}
			}
		} );
	};

	this.startModal = function( onModalReady ) {
		self.getModal().show();

		self.setTemplatesSource( 'local' );

		if ( ! layout ) {
			initLayout();
		}

		layout.showLoadingView();

		self.requestRemoteTemplates( function() {
			if ( onModalReady ) {
				onModalReady();
			}
		} );
	};

	this.setTemplatesSource = function( source, trigger ) {
		var channel = elementor.channels.templates;

		channel.reply( 'filter:source', source );

		if ( trigger ) {
			channel.trigger( 'filter:change' );
		}
	};

	this.showTemplates = function() {
		layout.showTemplatesView( templatesCollection );
	};

	this.showErrorDialog = function( errorMessage ) {
		self.getErrorDialog()
		    .setMessage( elementor.translate( 'templates_request_error' ) + '<div id="elementor-template-library-error-info">' + errorMessage + '</div>' )
		    .show();
	};
};

module.exports = new TemplateLibraryManager();

},{"elementor-templates/collections/templates":26,"elementor-templates/views/layout":29}],28:[function(require,module,exports){
var TemplateLibraryTemplateModel;

TemplateLibraryTemplateModel = Backbone.Model.extend( {
	defaults: {
		template_id: 0,
		name: '',
		title: '',
		source: '',
		type: '',
		author: '',
		thumbnail: '',
		url: '',
		export_link: '',
		categories: [],
		keywords: []
	}
} );

module.exports = TemplateLibraryTemplateModel;

},{}],29:[function(require,module,exports){
var TemplateLibraryHeaderView = require( 'elementor-templates/views/parts/header' ),
	TemplateLibraryHeaderLogoView = require( 'elementor-templates/views/parts/header-parts/logo' ),
	TemplateLibraryHeaderSaveView = require( 'elementor-templates/views/parts/header-parts/save' ),
	TemplateLibraryHeaderLoadView = require( 'elementor-templates/views/parts/header-parts/load' ),
	TemplateLibraryHeaderMenuView = require( 'elementor-templates/views/parts/header-parts/menu' ),
	TemplateLibraryHeaderPreviewView = require( 'elementor-templates/views/parts/header-parts/preview' ),
	TemplateLibraryHeaderBackView = require( 'elementor-templates/views/parts/header-parts/back' ),
	TemplateLibraryLoadingView = require( 'elementor-templates/views/parts/loading' ),
	TemplateLibraryCollectionView = require( 'elementor-templates/views/parts/templates' ),
	TemplateLibrarySaveTemplateView = require( 'elementor-templates/views/parts/save-template' ),
	TemplateLibraryLoadTemplateView = require( 'elementor-templates/views/parts/load-template' ),
	TemplateLibraryPreviewView = require( 'elementor-templates/views/parts/preview' ),
	TemplateLibraryLayoutView;

TemplateLibraryLayoutView = Marionette.LayoutView.extend( {
	el: '#elementor-template-library-modal',

	regions: {
		modalContent: '.dialog-message',
		modalHeader: '.dialog-widget-header'
	},

	initialize: function() {
		this.getRegion( 'modalHeader' ).show( new TemplateLibraryHeaderView() );
	},

	getHeaderView: function() {
		return this.getRegion( 'modalHeader' ).currentView;
	},

	showLoadingView: function() {
		this.getRegion( 'modalContent' ).show( new TemplateLibraryLoadingView() );
	},

	showTemplatesView: function( templatesCollection ) {
		this.getRegion( 'modalContent' ).show( new TemplateLibraryCollectionView( {
			collection: templatesCollection
		} ) );

		var headerView = this.getHeaderView();

		headerView.tools.show( new TemplateLibraryHeaderSaveView() );
		headerView.tools2.show( new TemplateLibraryHeaderLoadView() );
		headerView.logoArea.show( new TemplateLibraryHeaderLogoView() );
	},

	showSaveTemplateView: function( sectionID ) {
		this.getRegion( 'modalContent' ).show( new TemplateLibrarySaveTemplateView( { sectionID: sectionID } ) );

		var headerView = this.getHeaderView();

		headerView.tools.reset();
		headerView.tools2.show( new TemplateLibraryHeaderLoadView() );
		headerView.menuArea.show( new TemplateLibraryHeaderMenuView() );
		headerView.logoArea.show( new TemplateLibraryHeaderLogoView() );
	},

	showLoadTemplateView: function( sectionID ) {
		this.getRegion( 'modalContent' ).show( new TemplateLibraryLoadTemplateView( { sectionID: sectionID } ) );

		var headerView = this.getHeaderView();

		headerView.tools2.reset();
		headerView.tools.show( new TemplateLibraryHeaderSaveView() );
		headerView.menuArea.show( new TemplateLibraryHeaderMenuView() );
		headerView.logoArea.show( new TemplateLibraryHeaderLogoView() );
	},

	showPreviewView: function( templateModel ) {
		this.getRegion( 'modalContent' ).show( new TemplateLibraryPreviewView( {
			url: templateModel.get( 'url' )
		} ) );

		var headerView = this.getHeaderView();

		headerView.menuArea.reset();

		headerView.tools.show( new TemplateLibraryHeaderPreviewView( {
			model: templateModel
		} ) );

		headerView.logoArea.show( new TemplateLibraryHeaderBackView() );
	}
} );

module.exports = TemplateLibraryLayoutView;

},{"elementor-templates/views/parts/header":36,"elementor-templates/views/parts/header-parts/back":30,"elementor-templates/views/parts/header-parts/load":31,"elementor-templates/views/parts/header-parts/logo":32,"elementor-templates/views/parts/header-parts/menu":33,"elementor-templates/views/parts/header-parts/preview":34,"elementor-templates/views/parts/header-parts/save":35,"elementor-templates/views/parts/load-template":37,"elementor-templates/views/parts/loading":38,"elementor-templates/views/parts/preview":39,"elementor-templates/views/parts/save-template":40,"elementor-templates/views/parts/templates":42}],30:[function(require,module,exports){
var TemplateLibraryHeaderBackView;

TemplateLibraryHeaderBackView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-back',

	id: 'elementor-template-library-header-preview-back',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.templates.showTemplates();
	}
} );

module.exports = TemplateLibraryHeaderBackView;

},{}],31:[function(require,module,exports){
var TemplateLibraryHeaderLoadView;

TemplateLibraryHeaderLoadView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-load',

	id: 'elementor-template-library-header-load',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.templates.getLayout().showLoadTemplateView();
	}
} );

module.exports = TemplateLibraryHeaderLoadView;

},{}],32:[function(require,module,exports){
var TemplateLibraryHeaderLogoView;

TemplateLibraryHeaderLogoView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-logo',

	id: 'elementor-template-library-header-logo',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.templates.setTemplatesSource( 'local' );
		elementor.templates.showTemplates();
	}
} );

module.exports = TemplateLibraryHeaderLogoView;

},{}],33:[function(require,module,exports){
var TemplateLibraryHeaderMenuView;

TemplateLibraryHeaderMenuView = Marionette.ItemView.extend( {
	options: {
		activeClass: 'elementor-active'
	},

	template: '#tmpl-elementor-template-library-header-menu',

	id: 'elementor-template-library-header-menu',

	ui: {
		menuItems: '.elementor-template-library-menu-item'
	},

	events: {
		'click @ui.menuItems': 'onMenuItemClick'
	},

	$activeItem: null,

	activateMenuItem: function( $item ) {
		var activeClass = this.getOption( 'activeClass' );

		if ( this.$activeItem === $item ) {
			return;
		}

		if ( this.$activeItem ) {
			this.$activeItem.removeClass( activeClass );
		}

		$item.addClass( activeClass );

		this.$activeItem = $item;
	},

	onRender: function() {
		var currentSource = elementor.channels.templates.request( 'filter:source' ),
			$sourceItem = this.ui.menuItems.filter( '[data-template-source="' + currentSource + '"]' );

		this.activateMenuItem( $sourceItem );
	},

	onMenuItemClick: function( event ) {
		var item = event.currentTarget;

		this.activateMenuItem( Backbone.$( item ) );

		elementor.templates.setTemplatesSource( 'local');
		elementor.templates.showTemplates();
	}
} );

module.exports = TemplateLibraryHeaderMenuView;

},{}],34:[function(require,module,exports){
var TemplateLibraryHeaderPreviewView;

TemplateLibraryHeaderPreviewView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-preview',

	id: 'elementor-template-library-header-preview',

	ui: {
		insertButton: '#elementor-template-library-header-preview-insert'
	},

	events: {
		'click @ui.insertButton': 'onInsertButtonClick'
	},

	onInsertButtonClick: function() {
		elementor.templates.importTemplate( this.model );
	}
} );

module.exports = TemplateLibraryHeaderPreviewView;

},{}],35:[function(require,module,exports){
var TemplateLibraryHeaderSaveView;

TemplateLibraryHeaderSaveView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-save',

	id: 'elementor-template-library-header-save',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.templates.getLayout().showSaveTemplateView();
	}
} );

module.exports = TemplateLibraryHeaderSaveView;

},{}],36:[function(require,module,exports){
var TemplateLibraryHeaderView;

TemplateLibraryHeaderView = Marionette.LayoutView.extend( {

	id: 'elementor-template-library-header',

	template: '#tmpl-elementor-template-library-header',

	regions: {
		logoArea: '#elementor-template-library-header-logo-area',
		tools: '#elementor-template-library-header-tools',
		tools2: '#elementor-template-library-header-tools2',
		menuArea: '#elementor-template-library-header-menu-area'
	},

	ui: {
		closeModal: '#elementor-template-library-header-close-modal'
	},

	events: {
		'click @ui.closeModal': 'onCloseModalClick'
	},

	onCloseModalClick: function() {
		elementor.templates.getModal().hide();
	}
} );

module.exports = TemplateLibraryHeaderView;

},{}],37:[function(require,module,exports){
var TemplateLibraryLoadTemplateView;

TemplateLibraryLoadTemplateView = Marionette.ItemView.extend( {
	id: 'elementor-template-library-load-template',

	template: '#tmpl-elementor-template-library-load-template',

	ui: {
		form: '#elementor-template-library-load-template-form',
		submitButton: '#elementor-template-library-load-template-submit',
		fileInput: '#elementor-template-library-load-template-file',
		fileInputNice: '#elementor-template-library-load-btn-file'
	},

	events: {
		'submit @ui.form': 'onFormSubmit',
		'change @ui.fileInput': 'onFileChange'
	},


	templateHelpers: function() {
		return {
			sectionID: this.getOption( 'sectionID' )
		};
	},

	onFileChange: function() {
		$(this.ui.fileInputNice).text($(this.ui.fileInput)[0].files[0].name);
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		this.ui.submitButton.addClass( 'elementor-btn-state' );

		elementor.ajax.send( 'importTemplate', {
			data: new FormData( this.ui.form[ 0 ] ),
			processData: false,
			contentType: false,
			success: function( data ) {
				elementor.templates.getTemplatesCollection().add( data );

				elementor.templates.setTemplatesSource( 'local' );

				elementor.templates.showTemplates();
			},
			error: function( data ) {
				elementor.templates.showErrorDialog( data.message );
			}
		} );
	}
} );

module.exports = TemplateLibraryLoadTemplateView;

},{}],38:[function(require,module,exports){
var TemplateLibraryLoadingView;

TemplateLibraryLoadingView = Marionette.ItemView.extend( {
	id: 'elementor-template-library-loading',

	template: '#tmpl-elementor-template-library-loading'
} );

module.exports = TemplateLibraryLoadingView;

},{}],39:[function(require,module,exports){
var TemplateLibraryPreviewView;

TemplateLibraryPreviewView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-preview',

	id: 'elementor-template-library-preview',

	ui: {
		iframe: '> iframe'
	},

	onRender: function() {
		this.ui.iframe.attr( 'src', this.getOption( 'url' ) );
	}
} );

module.exports = TemplateLibraryPreviewView;

},{}],40:[function(require,module,exports){
var TemplateLibrarySaveTemplateView;

TemplateLibrarySaveTemplateView = Marionette.ItemView.extend( {
	id: 'elementor-template-library-save-template',

	template: '#tmpl-elementor-template-library-save-template',

	ui: {
		form: '#elementor-template-library-save-template-form',
		submitButton: '#elementor-template-library-save-template-submit'
	},

	events: {
		'submit @ui.form': 'onFormSubmit'
	},

	templateHelpers: function() {
		return {
			sectionID: this.getOption( 'sectionID' )
		};
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		var formData = this.ui.form.elementorSerializeObject(),
			elementsData = elementor.helpers.cloneObject( elementor.elements.toJSON() ),
			sectionID = this.getOption( 'sectionID' ),
			saveType = sectionID ? 'section' : 'page';

		if ( 'section' === saveType ) {
			elementsData = [ _.findWhere( elementsData, { id: sectionID } ) ];
		}

		_.extend( formData, {
			data: JSON.stringify( elementsData ),
			source: 'local',
			type: saveType
		} );

		this.ui.submitButton.addClass( 'elementor-btn-state' );

		elementor.ajax.send( 'saveTemplate', {
			data: formData,
			success: function( data ) {
				elementor.templates.getTemplatesCollection().add( data );

				elementor.templates.setTemplatesSource( 'local' );

				elementor.templates.showTemplates();
			},
			error: function( data ) {
				elementor.templates.showErrorDialog( data.message );
			}
		} );
	}
} );

module.exports = TemplateLibrarySaveTemplateView;

},{}],41:[function(require,module,exports){
var TemplateLibraryTemplatesEmptyView;

TemplateLibraryTemplatesEmptyView = Marionette.ItemView.extend( {
	id: 'elementor-template-library-templates-empty',

	template: '#tmpl-elementor-template-library-templates-empty'
} );

module.exports = TemplateLibraryTemplatesEmptyView;

},{}],42:[function(require,module,exports){
var TemplateLibraryTemplateLocalView = require( 'elementor-templates/views/template/local' ),
	TemplateLibraryTemplatesEmptyView = require( 'elementor-templates/views/parts/templates-empty' ),
	TemplateLibraryCollectionView;

TemplateLibraryCollectionView = Marionette.CompositeView.extend( {
	template: '#tmpl-elementor-template-library-templates',

	id: 'elementor-template-library-templates',

	childViewContainer: '#elementor-template-library-templates-container',

	emptyView: TemplateLibraryTemplatesEmptyView,

	getChildView: function( childModel ) {
		return TemplateLibraryTemplateLocalView;
	},

	initialize: function() {
		this.listenTo( elementor.channels.templates, 'filter:change', this._renderChildren );
	},

	filterByName: function( model ) {
		var filterValue = elementor.channels.templates.request( 'filter:text' );

		if ( ! filterValue ) {
			return true;
		}

		filterValue = filterValue.toLowerCase();

		if ( model.get( 'title' ).toLowerCase().indexOf( filterValue ) >= 0 ) {
			return true;
		}

		return _.any( model.get( 'keywords' ), function( keyword ) {
			return keyword.toLowerCase().indexOf( filterValue ) >= 0;
		} );
	},

	filterBySource: function( model ) {
		var filterValue = elementor.channels.templates.request( 'filter:source' );

		if ( ! filterValue ) {
			return true;
		}

		return filterValue === model.get( 'source' );
	},

	filter: function( childModel ) {
		return this.filterByName( childModel ) && this.filterBySource( childModel );
	},

	onRenderCollection: function() {
		var isEmpty = this.children.isEmpty();

		this.$childViewContainer.attr( 'data-template-source', isEmpty ? 'empty' : elementor.channels.templates.request( 'filter:source' ) );
	}
} );

module.exports = TemplateLibraryCollectionView;

},{"elementor-templates/views/parts/templates-empty":41,"elementor-templates/views/template/local":44}],43:[function(require,module,exports){

TemplateLibraryTemplateView = Marionette.ItemView.extend( {
	className: function() {
		return 'elementor-template-library-template elementor-template-library-template-' + this.model.get( 'source' );
	},

	ui: function() {
		return {
			insertButton: '.elementor-template-library-template-insert',
			previewButton: '.elementor-template-library-template-preview'
		};
	},

	events: function() {
		return {
			'click @ui.insertButton': 'onInsertButtonClick',
			'click @ui.previewButton': 'onPreviewButtonClick'
		};
	},

	onInsertButtonClick: function() {
		elementor.templates.importTemplate( this.model );
	}
} );

module.exports = TemplateLibraryTemplateView;

},{}],44:[function(require,module,exports){
var TemplateLibraryTemplateView = require( 'elementor-templates/views/template/base' ),
	TemplateLibraryTemplateLocalView;

TemplateLibraryTemplateLocalView = TemplateLibraryTemplateView.extend( {
	template: '#tmpl-elementor-template-library-template-local',

	ui: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.ui.apply( this, arguments ), {
			deleteButton: '.elementor-template-library-template-delete'
		} );
	},

	events: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.events.apply( this, arguments ), {
			'click @ui.deleteButton': 'onDeleteButtonClick'
		} );
	},

	onDeleteButtonClick: function() {
		elementor.templates.deleteTemplate( this.model );
	},

	onPreviewButtonClick: function() {
		open( this.model.get( 'url' ), '_blank' );
	}
} );

module.exports = TemplateLibraryTemplateLocalView;

},{"elementor-templates/views/template/base":43}],45:[function(require,module,exports){
/* global ElementorConfig */
var App;

/**
 * Inline SVG icon rendering for content_template (underscore.js) contexts.
 *
 * Icons are stored as JSON: { library, value, svgKey }.
 * - If svgKey is present, fetch the SVG file and inline it so CSS size/color controls work.
 * - Otherwise fall back to a font icon <i> tag.
 *
 * The preview lives inside an iframe, so a MutationObserver is attached to each
 * document root (main + iframe) via elementorIconObserve() to detect placeholders
 * once Marionette inserts the rendered template into the DOM.
 *
 * Usage: {{{ elementorRenderIcon(settings.icon) }}}
 */
( function() {
	var svgCache = {};
	var selector = '.elementor-icon-svg[data-svg-key]:not([data-svg-loaded])';

	function svgBaseUrl() {
		return ( window.elementor && elementor.config && elementor.config.assets_url || '' ) + 'data/svg-cache/';
	}

	function loadSvg( el ) {
		var key = el.getAttribute( 'data-svg-key' );
		el.setAttribute( 'data-svg-loaded', '1' );

		if ( svgCache[ key ] ) {
			el.innerHTML = svgCache[ key ];
			return;
		}

		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', svgBaseUrl() + key + '.svg', true );
		xhr.onload = function() {
			if ( xhr.status === 200 && xhr.responseText.indexOf( '<svg' ) !== -1 ) {
				svgCache[ key ] = xhr.responseText;
				el.innerHTML = xhr.responseText;
			}
		};
		xhr.send();
	}

	function processRoot( root ) {
		var els = root.querySelectorAll( selector );
		for ( var i = 0; i < els.length; i++ ) {
			loadSvg( els[ i ] );
		}
	}

	window.elementorIconObserve = function( root ) {
		if ( ! root || root._svgObserved ) {
			return;
		}
		root._svgObserved = true;

		new MutationObserver( function( mutations ) {
			for ( var i = 0; i < mutations.length; i++ ) {
				var nodes = mutations[ i ].addedNodes;
				for ( var j = 0; j < nodes.length; j++ ) {
					if ( nodes[ j ].nodeType === 1 ) {
						processRoot( nodes[ j ] );
					}
				}
			}
		} ).observe( root, { childList: true, subtree: true } );

		processRoot( root );
	};

	elementorIconObserve( document.body || document.documentElement );

	window.elementorRenderIcon = function( value, iconType, svgMedia ) {
		// Custom SVG mode
		if ( iconType === 'svg' && svgMedia ) {
			var svgUrl = '';
			if ( typeof svgMedia === 'object' && svgMedia.url ) {
				svgUrl = svgMedia.url;
			} else if ( typeof svgMedia === 'string' && svgMedia.length ) {
				svgUrl = svgMedia;
			}
			if ( svgUrl ) {
				return '<span class="elementor-icon-svg elementor-icon-svg--custom"><img src="' + svgUrl + '" alt="" /></span>';
			}
			return '';
		}

		if ( ! value ) {
			return '';
		}

		var parsed = typeof value === 'object' ? value : null;

		if ( ! parsed && typeof value === 'string' && value.charAt( 0 ) === '{' ) {
			try { parsed = JSON.parse( value ); } catch ( e ) {}
		}

		if ( parsed ) {
			if ( parsed.svgKey ) {
				var safeKey = parsed.svgKey.replace( /[^a-z0-9\-\/]/g, '' );
				if ( safeKey ) {
					if ( svgCache[ safeKey ] ) {
						return '<span class="elementor-icon-svg">' + svgCache[ safeKey ] + '</span>';
					}
					return '<span class="elementor-icon-svg" data-svg-key="' + safeKey + '"></span>';
				}
			}
			if ( parsed.value ) {
				return '<i class="' + parsed.value + '"></i>';
			}
		}

		if ( typeof value === 'string' && value.length ) {
			return '<i class="' + value + '"></i>';
		}

		return '';
	};
} )();

Marionette.TemplateCache.prototype.compileTemplate = function( rawTemplate, options ) {
	options = {
		evaluate: /<#([\s\S]+?)#>/g,
		interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
		escape: /\{\{([^\}]+?)\}\}(?!\})/g
	};

	return _.template( rawTemplate, options );
};

App = Marionette.Application.extend( {
	helpers: require( 'elementor-utils/helpers' ),
	schemes: require( 'elementor-utils/schemes' ),
	presetsFactory: require( 'elementor-utils/presets-factory' ),
	modals: require( 'elementor-utils/modals' ),
	introduction: require( 'elementor-utils/introduction' ),
	templates: require( 'elementor-templates/manager' ),
	styleLibrary: require( 'elementor-styles/manager' ),
	ajax: require( 'elementor-utils/ajax' ),

	channels: {
		editor: Backbone.Radio.channel( 'ELEMENTOR:editor' ),
		data: Backbone.Radio.channel( 'ELEMENTOR:data' ),
		panelElements: Backbone.Radio.channel( 'ELEMENTOR:panelElements' ),
		dataEditMode: Backbone.Radio.channel( 'ELEMENTOR:editmode' ),
		deviceMode: Backbone.Radio.channel( 'ELEMENTOR:deviceMode' ),
		templates: Backbone.Radio.channel( 'ELEMENTOR:templates' )
	},

	// Private Members
	_controlsItemView: null,

	_defaultDeviceMode: 'desktop',

	getElementData: function( modelElement ) {
		var elType = modelElement.get( 'elType' );

		if ( 'widget' === elType ) {
			var widgetType = modelElement.get( 'widgetType' );

			if ( ! this.config.widgets[ widgetType ] ) {
				return false;
			}

			return this.config.widgets[ widgetType ];
		}

		if ( ! this.config.elements[ elType ] ) {
			return false;
		}

		return this.config.elements[ elType ];
	},

	getElementControls: function( modelElement ) {
		var elementData = this.getElementData( modelElement );

		if ( ! elementData ) {
			return false;
		}

		var elType = modelElement.get( 'elType' ),
			isInner = modelElement.get( 'isInner' );

		if ( 'widget' === elType ) {
			return elementData.controls;
		}

		return _.filter( elementData.controls, function( controlData ) {
			return ! ( isInner && controlData.hide_in_inner || ! isInner && controlData.hide_in_top );
		} );
	},

	getControlItemView: function( controlType ) {
		if ( null === this._controlsItemView ) {
			this._controlsItemView = {
				color: require( 'elementor-views/controls/color' ),
				dimensions: require( 'elementor-views/controls/dimensions' ),
				image_dimensions: require( 'elementor-views/controls/image-dimensions' ),
				media: require( 'elementor-views/controls/media' ),
				slider: require( 'elementor-views/controls/slider' ),
				wysiwyg: require( 'elementor-views/controls/wysiwyg' ),
				autocomplete_products: require( 'elementor-views/controls/autocomplete-products' ),
				autocomplete_posts: require( 'elementor-views/controls/autocomplete-posts' ),
				choose: require( 'elementor-views/controls/choose' ),
				url: require( 'elementor-views/controls/url' ),
				font: require( 'elementor-views/controls/font' ),
				section: require( 'elementor-views/controls/section' ),
				repeater: require( 'elementor-views/controls/repeater' ),
				wp_widget: require( 'elementor-views/controls/wp_widget' ),
				icon: require( 'elementor-views/controls/icon' ),
				gallery: require( 'elementor-views/controls/gallery' ),
				select2: require( 'elementor-views/controls/select2' ),
				select_sort: require( 'elementor-views/controls/select-sort' ),
				box_shadow: require( 'elementor-views/controls/box-shadow' ),
				text_shadow: require( 'elementor-views/controls/text-shadow' ),
				structure: require( 'elementor-views/controls/structure' ),
				animation: require( 'elementor-views/controls/animation' ),
				hover_animation: require( 'elementor-views/controls/animation' ),
				datetime: require( 'elementor-views/controls/datetime'),
				code: require( 'elementor-views/controls/code' ),
				popover_toggle: require( 'elementor-views/controls/popover-toggle' )
			};

			this.channels.editor.trigger( 'editor:controls:initialize' );
		}

		return this._controlsItemView[ controlType ] || require( 'elementor-views/controls/base' );
	},

	getPanelView: function() {
		return this.getRegion( 'panel' ).currentView;
	},

	initComponents: function() {
		this.initDialogsManager();

		this.modals.init();
		this.ajax.init();

		const initContextMenu = require("./components/context-menu");
		initContextMenu(this);
	},

	initDialogsManager: function() {
		this.dialogsManager = new DialogsManager.Instance();
	},

	initPreview: function() {
		this.$previewWrapper = Backbone.$( '#elementor-preview' );

		this.$previewResponsiveWrapper = Backbone.$( '#elementor-preview-responsive-wrapper' );

		var previewIframeId = 'elementor-preview-iframe';

		// Make sure the iFrame does not exist.
		if ( ! Backbone.$( '#' + previewIframeId ).length ) {
			var previewIFrame = document.createElement( 'iframe' );

			previewIFrame.id = previewIframeId;
		    previewIFrame.src = this.config.preview_link + '&ts=' + ( new Date().getTime() );

			this.$previewResponsiveWrapper.append( previewIFrame );
		}

		this.$preview = Backbone.$( '#' + previewIframeId );

		this.$preview.on( 'load', _.bind( this.onPreviewLoaded, this ) );
	},

	initFrontend: function() {
		elementorFrontend.setScopeWindow( this.$preview[0].contentWindow );

		elementorFrontend.init();
	},

	onStart: function() {
		NProgress.start();
		NProgress.inc( 0.2 );

		this.config = ElementorConfig;

		Backbone.Radio.DEBUG = false;
		Backbone.Radio.tuneIn( 'ELEMENTOR' );

		this.initComponents();

		// Init Base elements collection from the server
		var ElementModel = require( 'elementor-models/element' );

		this.elements = new ElementModel.Collection( this.config.data );

		this.initPreview();

		this.listenTo( this.channels.dataEditMode, 'switch', this.onEditModeSwitched );

		this.setWorkSaver();

		this.initClearPageDialog();
		this.initLostPageDialog();
		this.initIeEdgeDialog();

	},

	onPreviewLoaded: function() {
		NProgress.done();

		this.initFrontend();

		this.$previewContents = this.$preview.contents();

		// Observe the preview iframe for SVG icon placeholders
		elementorIconObserve( ( this.$preview[0].contentDocument || this.$preview[0].contentWindow.document ).body );

		var SectionsCollectionView = require( 'elementor-views/sections' ),
			PanelLayoutView = require( 'elementor-layouts/panel/panel' );

		var $previewElementorEl = this.$previewContents.find( '#elementor' );

		if ( ! $previewElementorEl.length ) {
			this.onPreviewElNotFound();
			return;
		}

		var iframeRegion = new Marionette.Region( {
			// Make sure you get the DOM object out of the jQuery object
			el: $previewElementorEl[0]
		} );

		this.schemes.init();
		this.schemes.printSchemesStyle();

		this.$previewContents.on( 'click', function( event ) {
			var $target = Backbone.$( event.target ),
				editMode = elementor.channels.dataEditMode.request( 'activeMode' ),
				isClickInsideElementor = !! $target.closest( '#elementor' ).length,
				isTargetInsideDocument = this.contains( $target[0] );

			if ( isClickInsideElementor && 'preview' !== editMode || ! isTargetInsideDocument ) {
				return;
			}

			if ( $target.closest( 'a' ).length ) {
				event.preventDefault();
			}

			if ( ! isClickInsideElementor ) {
				elementor.getPanelView().setPage( 'elements' );
			}
		} );
		/*console.log( this.$previewContents );

		// Right-click context menu handling inside the preview iframe
		this.$previewContents.on( 'contextmenu', function( event ) {
			console.log( 'IQIT ContextMenu: native contextmenu event detected', event );

			var $target = Backbone.$( event.target ),
				isClickInsideElementor = !! $target.closest( '#elementor' ).length,
				isTargetInsideDocument = this.contains( $target[0] );

			// Ignore right-clicks en dehors de la zone Elementor ou hors du document
			if ( ! isClickInsideElementor || ! isTargetInsideDocument ) {
				return;
			}

			// Empêche le menu contextuel natif du navigateur
			event.preventDefault();

			console.log( 'IQIT ContextMenu: native contextmenu captured on', $target[0] );

			// TODO: retrouver la vue Backbone/Marionette associée à l'élément cliqué
			var clickedView = null;

			// Déclenchement de l'événement interne consommé par ContextMenuView
			elementor.channels.editor.trigger( 'context-menu:open', {
				event: event,
				view: clickedView,
				groups: []
			} );
		} );*/

		this.addRegions( {
			sections: iframeRegion,
			panel: '#elementor-panel',
			topBar: '#elementor-topbar'
		} );

		this.getRegion( 'sections' ).show( new SectionsCollectionView( {
			collection: this.elements
		} ) );

		this.getRegion( 'panel' ).show( new PanelLayoutView() );

		var TopBarItemView = require( 'elementor-layouts/panel/topbar' );
		this.getRegion( 'topBar' ).show( new TopBarItemView() );

		// Init Navigator
		var navigator = require( 'elementor-components/navigator' );
		this.navigator = navigator.init();

		this.$previewContents
		    .children() // <html>
		    .addClass( 'elementor-html' )
		    .children( 'body' )
		    .addClass( 'elementor-editor-active' );

		this.setResizablePanel();

		this.changeDeviceMode( this._defaultDeviceMode );

		Backbone.$( '#elementor-loading' ).fadeOut( 600 );

		_.defer( function() {
			elementorFrontend.getScopeWindow().jQuery.holdReady( false );
		} );

		this.enqueueTypographyFonts();

		//this.introduction.startOnLoadIntroduction(); // TEMP Removed

		this.trigger( 'preview:loaded' );

		var browserVersion = this.detectIE();

		if (browserVersion != false){
			this.getIeEdgeDialog().show();
		}
	},

	onEditModeSwitched: function() {
		var activeMode = elementor.channels.dataEditMode.request( 'activeMode' );

		if ( 'preview' === activeMode ) {
			this.enterPreviewMode();
		} else {
			this.exitPreviewMode();
		}
	},

	onPreviewElNotFound: function() {
		var dialog = this.dialogsManager.createWidget( 'confirm', {
			id: 'elementor-fatal-error-dialog',
			headerMessage: elementor.translate( 'preview_el_not_found_header' ),
			message: elementor.translate( 'preview_el_not_found_message' ),
			position: {
				my: 'center center',
				at: 'center center'
			},
            strings: {
				confirm: elementor.translate( 'learn_more' ),
				cancel: elementor.translate( 'go_back' )
            },
			onConfirm: function() {
				open( elementor.config.maintance_url_settings, '_blank' );
			},
			onCancel: function() {
				parent.history.go( -1 );
			},
			hideOnButtonClick: false
		} );

		dialog.show();
	},

	setFlagEditorChange: function( status ) {
		elementor.channels.editor.reply( 'editor:changed', status );
		elementor.channels.editor.trigger( 'editor:changed', status );
	},

	isEditorChanged: function() {
		return ( true === elementor.channels.editor.request( 'editor:changed' ) );
	},

	setWorkSaver: function() {
		Backbone.$( window ).on( 'beforeunload', function() {
			if ( elementor.isEditorChanged() ) {
				return elementor.translate( 'before_unload_alert' );
			}
		} );
	},

	setResizablePanel: function() {
		var self = this,
			side = elementor.config.is_rtl ? 'right' : 'left';

		self.panel.$el.resizable( {
			handles: elementor.config.is_rtl ? 'w' : 'e',
			minWidth: 200,
			maxWidth: 500,
			start: function() {
				self.$previewWrapper
					.addClass( 'ui-resizable-resizing' )
					.css( 'pointer-events', 'none' );
			},
			stop: function() {
				self.$previewWrapper
					.removeClass( 'ui-resizable-resizing' )
					.css( 'pointer-events', '' );

				elementor.channels.data.trigger( 'scrollbar:update' );
			},
			resize: function( event, ui ) {
				self.$previewWrapper
					.css( side, ui.size.width );
			}
		} );
	},

	enterPreviewMode: function() {
		this.$previewContents
		    .find( 'body' )
		    .add( 'body' )
		    .removeClass( 'elementor-editor-active' )
		    .addClass( 'elementor-editor-preview' );

		// Handle panel resize
		this.$previewWrapper.css( elementor.config.is_rtl ? 'right' : 'left', '' );

		this.panel.$el.css( 'width', '' );
	},

	exitPreviewMode: function() {
		this.$previewContents
		    .find( 'body' )
		    .add( 'body' )
		    .removeClass( 'elementor-editor-preview' )
		    .addClass( 'elementor-editor-active' );
	},

	saveBuilder: function( options ) {
		options = _.extend( {
			revision: 'draft',
			onSuccess: null
		}, options );

		NProgress.start();

		let elements = elementor.elements.toJSON();
		for (let i = 0; i < elements.length; i++) {
			elements[i] = this.cleanEmptyValues(elements[i]);
		}

		return this.ajax.send( 'SaveEditor', {
	        data: {
		        page_id: this.config.post_id,
				id_lang: this.config.id_lang,
				new_content: this.config.new_content,
				content_type: this.config.content_type,
				page_type: this.config.page_type,
		        revision: options.revision,
		        data: JSON.stringify( elements )
	        },
			success: function( data ) {
				NProgress.done();

				elementor.setFlagEditorChange( false );

				if ( _.isFunction( options.onSuccess ) ) {
					options.onSuccess.call( this, data );
				}
			}
        } );
	},

	cleanEmptyValues: function(element) {
		//console.log('Before cleaning:', element);
		//element = this._cleanEmptyData(element);
		//console.log('After cleaning:', element);
		return element;
	},

	_cleanEmptyData: function(data) {
		// Si tableau → nettoyer chaque entrée récursivement et supprimer les entrées vides
		if (Array.isArray(data)) {
			const cleanedArray = data
				.map(item => this._cleanEmptyData(item))
				.filter(item => {
					if (item === null || item === undefined || item === '') {
						return false;
					}

					if (Array.isArray(item) && item.length === 0) {
						return false;
					}

					if (item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) {
						return false;
					}

					return true;
				});

			return cleanedArray;
		}

		// Si objet → nettoyer chaque clé récursivement
		if (data && typeof data === 'object') {
			const cleanedObj = {};

			Object.keys(data).forEach(key => {
				const value = this._cleanEmptyData(data[key]);

				const isEmpty =
					value === null ||
					value === undefined ||
					value === '' ||
					(Array.isArray(value) && value.length === 0) ||
					(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

				if (!isEmpty) {
					cleanedObj[key] = value;
				}
			});

			// Si l'objet ne contient qu'une seule clé 'unit', on le considère comme vide
			const keys = Object.keys(cleanedObj);
			if (keys.length === 1 && keys[0] === 'unit') {
				return {};
			}

			return cleanedObj;
		}

		// Valeur primitive → retourner tel quel
		return data;
	},

	changeDeviceMode: function( newDeviceMode ) {
		var oldDeviceMode = this.channels.deviceMode.request( 'currentMode' );

		if ( oldDeviceMode === newDeviceMode ) {
			return;
		}

		Backbone.$( 'body' )
			.removeClass( 'elementor-device-' + oldDeviceMode )
			.addClass( 'elementor-device-' + newDeviceMode );

		this.channels.deviceMode
			.reply( 'previousMode', oldDeviceMode )
			.reply( 'currentMode', newDeviceMode )
			.trigger( 'change' );

		Backbone.$( window ).trigger('changedDeviceMode');
	},

	initClearPageDialog: function() {
		var self = this,
			dialog;

		self.getClearPageDialog = function() {
			if ( dialog ) {
				return dialog;
			}

			dialog = this.dialogsManager.createWidget( 'confirm', {
				id: 'elementor-clear-page-dialog',
				headerMessage: elementor.translate( 'clear_page' ),
				message: elementor.translate( 'dialog_confirm_clear_page' ),
				position: {
					my: 'center center',
					at: 'center center'
				},
				onConfirm: function() {
					self.getRegion( 'sections' ).currentView.collection.reset();
				}
			} );

			return dialog;
		};
	},

	initLostPageDialog: function() {
		var self = this,
			dialog;

		self.getLostPageDialog = function() {
			if ( dialog ) {
				return dialog;
			}

			dialog = this.dialogsManager.createWidget( 'confirm', {
				id: 'elementor-clear-page-dialog',
				headerMessage: elementor.translate( 'changes_lost' ),
				message: elementor.translate( 'dialog_confirm_changes_lost' ),
				position: {
					my: 'center center',
					at: 'center center'
				},
				onConfirm: function() {
					Backbone.$( '#elementor-loading, #elementor-preview-loading' ).fadeIn( 600 );
					window.location.href =  self.addUrlParam(window.location.href, 'idLang', id_lang);
				}
			} );

			return dialog;
		};
	},

	initIeEdgeDialog: function() {
		var self = this,
			dialog;

		self.getIeEdgeDialog = function() {
			if ( dialog ) {
				return dialog;
			}

			dialog = this.dialogsManager.createWidget( 'alert', {
				id: 'elementor-ie-edge-dialog',
				headerMessage: elementor.translate( 'ie_edge_browser' ),
				message: elementor.translate( 'ie_edge_browser_info' ),
				position: {
					my: 'center center',
					at: 'center center'
				},
				onConfirm: function() {
					window.location = elementor.config.edit_post_link;
				}
			} );

			return dialog;
		};
	},

	clearPage: function() {
		this.getClearPageDialog().show();
	},

	changeLanguage: function(id_lang, ignore) {

		if ( elementor.isEditorChanged() ) {
			self.id_lang = id_lang;
			this.getLostPageDialog().show();
			return false;
		}
		Backbone.$( '#elementor-loading, #elementor-preview-loading' ).fadeIn( 600 );
		window.location.href = this.addUrlParam(window.location.href, 'idLang', id_lang);

	},

	detectIE: function() {
		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
			return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}
		return false;
	},

	addUrlParam: function(url, param, value){
		var a = document.createElement('a'), regex = /(?:\?|&amp;|&)+([^=]+)(?:=([^&]*))*/g;
		var match, str = []; a.href = url; param = encodeURIComponent(param);

		while (match = regex.exec(a.search)){
			if (param != match[1]) str.push(match[1]+(match[2]?"="+match[2]:""));
		}

		str.push(param+(value?"="+ encodeURIComponent(value):""));
		a.search = str.join("&");
		return a.href;
	},



	enqueueTypographyFonts: function() {
		var self = this,
			typographyScheme = this.schemes.getScheme( 'typography' );

		_.each( typographyScheme.items, function( item ) {
			self.helpers.enqueueFont( item.value.font_family );
		} );
	},

	translate: function( stringKey, templateArgs ) {
		var string = this.config.i18n[ stringKey ];

		if ( undefined === string ) {
			string = stringKey;
		}

		if ( templateArgs ) {
			string = string.replace( /{(\d+)}/g, function( match, number ) {
				return undefined !== templateArgs[ number ] ? templateArgs[ number ] : match;
			} );
		}

		return string;
	}
} );

module.exports = ( window.elementor = new App() ).start();

},{"./components/context-menu":10,"elementor-components/navigator":11,"elementor-layouts/panel/panel":70,"elementor-layouts/panel/topbar":71,"elementor-models/element":74,"elementor-styles/manager":13,"elementor-templates/manager":27,"elementor-utils/ajax":80,"elementor-utils/helpers":81,"elementor-utils/introduction":82,"elementor-utils/modals":85,"elementor-utils/presets-factory":86,"elementor-utils/schemes":87,"elementor-views/controls/animation":91,"elementor-views/controls/autocomplete-posts":92,"elementor-views/controls/autocomplete-products":93,"elementor-views/controls/base":96,"elementor-views/controls/box-shadow":97,"elementor-views/controls/choose":98,"elementor-views/controls/code":99,"elementor-views/controls/color":100,"elementor-views/controls/datetime":101,"elementor-views/controls/dimensions":102,"elementor-views/controls/font":103,"elementor-views/controls/gallery":104,"elementor-views/controls/icon":105,"elementor-views/controls/image-dimensions":106,"elementor-views/controls/media":107,"elementor-views/controls/popover-toggle":108,"elementor-views/controls/repeater":110,"elementor-views/controls/section":111,"elementor-views/controls/select-sort":112,"elementor-views/controls/select2":113,"elementor-views/controls/slider":114,"elementor-views/controls/structure":115,"elementor-views/controls/text-shadow":116,"elementor-views/controls/url":117,"elementor-views/controls/wp_widget":118,"elementor-views/controls/wysiwyg":119,"elementor-views/sections":122}],46:[function(require,module,exports){
var EditModeItemView;

EditModeItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-mode-switcher-content',

	id: 'elementor-mode-switcher-inner',

	ui: {
		previewButton: '#elementor-mode-switcher-preview-input',
		previewLabel: '#elementor-mode-switcher-preview',
		previewLabelA11y: '#elementor-mode-switcher-preview .elementor-screen-only'
	},

	events: {
		'change @ui.previewButton': 'onEditModeChange'
	},

	getCurrentMode: function() {
		return this.ui.previewButton.is( ':checked' ) ? 'preview' : 'edit';
	},

	setMode: function( mode ) {
		this.ui.previewButton.prop( 'checked', 'preview' === mode );
	},

	onRender: function() {
		this.onEditModeChange();
	},

	onEditModeChange: function() {
		var dataEditMode = elementor.channels.dataEditMode,
			oldEditMode = dataEditMode.request( 'activeMode' ),
			currentMode = this.getCurrentMode();

		dataEditMode.reply( 'activeMode', currentMode );

		if ( currentMode !== oldEditMode ) {
			dataEditMode.trigger( 'switch' );

			var title = 'preview' === currentMode ? 'Back to Editor' : 'Preview';

			this.ui.previewLabel.attr( 'title', title );
			this.ui.previewLabelA11y.text( title );
		}
	}
} );

module.exports = EditModeItemView;

},{}],47:[function(require,module,exports){
var PanelFooterItemView;

PanelFooterItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-footer-content',

	tagName: 'nav',

	id: 'elementor-panel-footer-tools',

	possibleRotateModes: [ 'portrait', 'landscape' ],

	ui: {
		menuButtons: '.elementor-panel-footer-tool',
		deviceModeIcon: '#elementor-panel-footer-responsive > i',
		deviceModeButtons: '#elementor-panel-footer-responsive .elementor-panel-footer-sub-menu-item',
		buttonSave: '#elementor-panel-footer-save',
		buttonSaveButton: '#elementor-panel-footer-save .elementor-btn',
		buttonPublish: '#elementor-panel-footer-publish',
		watchTutorial: '#elementor-panel-footer-watch-tutorial',
		showTemplates: '#elementor-panel-footer-templates-modal',
		saveTemplate: '#elementor-panel-footer-save-template',
		buttonGoBackoffice: '#elementor-panel-footer-view-edit-page',
	},

	events: {
		'click @ui.deviceModeButtons': 'onClickResponsiveButtons',
		'click @ui.buttonSave': 'onClickButtonSave',
		'click @ui.buttonPublish': 'onClickButtonPublish',
		'click @ui.watchTutorial': 'onClickWatchTutorial',
		'click @ui.showTemplates': 'onClickShowTemplates',
		'click @ui.buttonGoBackoffice': 'onClickButtonGoBackoffice',
		'click @ui.saveTemplate': 'onClickSaveTemplate'
	},

	initialize: function() {
		this._initDialog();

		this.listenTo( elementor.channels.editor, 'editor:changed', this.onEditorChanged )
			.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	_initDialog: function() {
		var dialog;

		this.getDialog = function() {
			if ( ! dialog ) {
				var $ = Backbone.$,
					$dialogMessage = $( '<div>', {
						'class': 'elementor-dialog-message'
					} ),
					$messageIcon = $( '<i>', {
						'class': 'fa fa-check-circle'
					} ),
					$messageText = $( '<div>', {
						'class': 'elementor-dialog-message-text'
					} ).text( elementor.translate( 'saved' ) );

				$dialogMessage.append( $messageIcon, $messageText );

				dialog = elementor.dialogsManager.createWidget( 'popup', {
					hide: {
						delay: 1500
					}
				} );

				dialog.setMessage( $dialogMessage );
			}

			return dialog;
		};
	},

	_publishBuilder: function() {
		var self = this;

		var options = {
			revision: 'publish',
			onSuccess: function() {
				self.getDialog().show();

				self.ui.buttonSaveButton.removeClass( 'elementor-btn-state' );
			}
		};

		self.ui.buttonSaveButton.addClass( 'elementor-btn-state' );

		elementor.saveBuilder( options );
	},

	_saveBuilderDraft: function() {
		elementor.saveBuilder();
	},

	getDeviceModeButton: function( deviceMode ) {
		return this.ui.deviceModeButtons.filter( '[data-device-mode="' + deviceMode + '"]' );
	},

	onPanelClick: function( event ) {
		var $target = Backbone.$( event.target ),
			isClickInsideOfTool = $target.closest( '.elementor-panel-footer-sub-menu-wrapper' ).length;

		if ( isClickInsideOfTool ) {
			return;
		}

		var $tool = $target.closest( '.elementor-panel-footer-tool' ),
			isClosedTool = $tool.length && ! $tool.hasClass( 'elementor-open' );

		this.ui.menuButtons.removeClass( 'elementor-open' );

		if ( isClosedTool ) {
			$tool.addClass( 'elementor-open' );
		}
	},

	onEditorChanged: function() {
		this.ui.buttonSave.toggleClass( 'elementor-save-active', elementor.isEditorChanged() );
	},

	onDeviceModeChange: function() {
		var previousDeviceMode = elementor.channels.deviceMode.request( 'previousMode' ),
			currentDeviceMode = elementor.channels.deviceMode.request( 'currentMode' );

		this.getDeviceModeButton( previousDeviceMode ).removeClass( 'active' );

		this.getDeviceModeButton( currentDeviceMode ).addClass( 'active' );

		// Change the footer icon
		this.ui.deviceModeIcon.removeClass( 'eicon-device-' + previousDeviceMode ).addClass( 'eicon-device-' + currentDeviceMode );
	},

	onClickButtonSave: function() {
		this._publishBuilder();
	},

	onClickButtonPublish: function( event ) {
		// Prevent click on save button
		event.stopPropagation();

		this._publishBuilder();
	},

	onClickResponsiveButtons: function( event ) {
		var $clickedButton = this.$( event.currentTarget ),
			newDeviceMode = $clickedButton.data( 'device-mode' );

		elementor.changeDeviceMode( newDeviceMode );
	},

	onClickWatchTutorial: function() {
		elementor.introduction.startIntroduction();
	},

	onClickShowTemplates: function() {
		elementor.templates.startModal( function() {
			elementor.templates.showTemplates();
		} );
	},

	onClickSaveTemplate: function() {
		elementor.templates.startModal( function() {
			elementor.templates.getLayout().showSaveTemplateView();
		} );
	},

	onClickButtonGoBackoffice: function(e) {
		e.preventDefault();
		window.location = elementor.config.edit_post_link;
	},

	onRender: function() {
		var self = this;

		_.defer( function() {
			elementor.getPanelView().$el.on( 'click', _.bind( self.onPanelClick, self ) );
		} );
	}
} );

module.exports = PanelFooterItemView;

},{}],48:[function(require,module,exports){
var PanelHeaderItemView;

PanelHeaderItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-header',

	id: 'elementor-panel-header',

	ui: {
		menuButton: '#elementor-panel-header-menu-button',
		title: '#elementor-panel-header-title',
		addButton: '#elementor-panel-header-add-button'
	},

	events: {
		'click @ui.addButton': 'onClickAdd',
		'click @ui.menuButton': 'onClickMenu'
	},

	setTitle: function( title ) {
		this.ui.title.html( title );
	},

	onClickAdd: function() {
		elementor.getPanelView().setPage( 'elements' );
	},

	onClickMenu: function() {
		var panel = elementor.getPanelView(),
			currentPanelPageName = panel.getCurrentPageName(),
			nextPage = 'menu' === currentPanelPageName ? 'elements' : 'menu';

		panel.setPage( nextPage );
	}
} );

module.exports = PanelHeaderItemView;

},{}],49:[function(require,module,exports){
var InnerTabsBehavior = require('../../../behaviors/tabs');

var EditorCompositeView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-editor-content' ),

	id: 'elementor-panel-page-editor',

	classes: {
		popover: 'elementor-controls-popover'
	},

	behaviors: {
		HandleInnerTabs: {
			behaviorClass: InnerTabsBehavior
		}
	},

	templateHelpers: function() {
		return {
			elementData: elementor.getElementData( this.model )
		};
	},

	childViewContainer: 'div.elementor-controls',

	modelEvents: {
		'destroy': 'onModelDestroy'
	},

	ui: {
		'tabs': '.elementor-tabs-controls li'
	},

	events: {
		'click @ui.tabs a': 'onClickTabControl'
	},

	initialize: function() {
		this.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	getChildView: function( item ) {
		var controlType = item.get( 'type' );
		return elementor.getControlItemView( controlType );
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model.get( 'settings' ),
			elementEditSettings: this.model.get( 'editSettings' )
		};
	},

	onDestroy: function() {
		this.getOption( 'editedElementView' ).$el.removeClass( 'elementor-element-editable' );
		this.model.trigger( 'editor:close' );

		this.triggerMethod( 'editor:destroy' );
	},

	onBeforeRender: function() {
		var controls = elementor.getElementControls( this.model.get( 'settings' ) );

		if ( ! controls ) {
			throw new Error( 'Editor controls not found' );
		}

		// Create new instance of that collection
		this.collection = new Backbone.Collection( controls );
	},

	onRender: function() {
		this.getOption( 'editedElementView' ).$el.addClass( 'elementor-element-editable' );

		// Wrap section controls in a container
		this.wrapSectionsControls();

		// Handle popovers
		this.handlePopovers();

		// Set the first tab as active
		this.ui.tabs.eq( 0 ).find( 'a' ).trigger( 'click' );

		// Create tooltip on controls
		this.$( '.tooltip-target' ).tipsy( {
			gravity: function() {
				// `n` for down, `s` for up
				var gravity = Backbone.$( this ).data( 'tooltip-pos' );

				if ( undefined !== gravity ) {
					return gravity;
				} else {
					return 'n';
				}
			},
			title: function() {
				return this.getAttribute( 'data-tooltip' );
			}
		} );

	},

	wrapSectionsControls: function() {
		var $controlsContainer = this.$( 'div.elementor-controls' ),
			$sections = $controlsContainer.find( '> .elementor-control-type-section' );

		$sections.each( function() {
			var $section = Backbone.$( this ),
				sectionName = $section.find( '[data-collapse_id]' ).data( 'collapse_id' ),
				$wrapper = Backbone.$( '<div class="elementor-section-wrapper elementor-section-wrapper-' + sectionName + '"></div>' ),
				$header = Backbone.$( '<div class="elementor-section-header"></div>' ),
				$content = Backbone.$( '<div class="elementor-section-content"></div>' ),
				$nextControls = $section.nextUntil( '.elementor-control-type-section' );

			// Insert wrapper before the section
			$section.before( $wrapper );

			// Build the structure: wrapper > header + content
			$header.append( $section );
			$content.append( $nextControls );
			$wrapper.append( $header );
			$wrapper.append( $content );
		} );
	},

	/**
	 * Handle popovers.
	 *
	 * Groups controls that belong to a popover into a container div.
	 */
	handlePopovers: function() {
		var self = this,
			popoverStarted = false,
			$popover;

		self.removePopovers();

		self.children.each( function( child ) {
			if ( popoverStarted ) {
				$popover.append( child.$el );
			}

			var popover = child.model.get( 'popover' );

			if ( ! popover ) {
				return;
			}

			if ( popover.start ) {
				popoverStarted = true;
				$popover = Backbone.$( '<div>', {
					'class': self.classes.popover
				} );
				child.$el.before( $popover );
				$popover.append( child.$el );
			}

			if ( popover.end ) {
				popoverStarted = false;
			}
		} );
	},

	/**
	 * Remove popovers.
	 *
	 * Removes all popover containers from the DOM.
	 */
	removePopovers: function() {
		this.$el.find( '.' + this.classes.popover ).remove();
	},

	onModelDestroy: function() {
		this.destroy();
	},

	onClickTabControl: function( event ) {
		event.preventDefault();

		var $thisTab = this.$( event.target );

		this.ui.tabs.removeClass( 'active' );
		$thisTab.closest( 'li' ).addClass( 'active' );

		this.model.get( 'settings' ).trigger( 'control:switch:tab', $thisTab.data( 'tab' ) );

		this.openFirstSectionInCurrentTab( $thisTab.data( 'tab' ) );
	},

	onDeviceModeChange: function() {
		var self = this;

		self.$el.removeClass( 'elementor-responsive-switchers-open' );

		// Timeout according to preview resize css animation duration
		setTimeout( function() {
			elementor.$previewContents.find( 'html, body' ).animate( {
				scrollTop: self.getOption( 'editedElementView' ).$el.offset().top - elementor.$preview[0].contentWindow.innerHeight / 2
			} );
		}, 500 );
	},

	/**
	 * Opens the first section in the current tab.
	 */
	openFirstSectionInCurrentTab: function( currentTab ) {
		var openedClass = 'elementor-open',
			self = this,

			firstSectionControlView = this.children.filter( function( view ) {
				return ( 'section' === view.model.get( 'type' ) ) && ( currentTab === view.model.get( 'tab' ) );
			} );

		// Check if found any section controls
		if ( _.isEmpty( firstSectionControlView ) ) {
			return;
		}

		// Close all sections first
		self.$( '.elementor-section-wrapper' ).removeClass( openedClass );
		self.$( '.elementor-control.elementor-control-type-section .elementor-panel-heading' ).removeClass( openedClass );

		// Open the first section
		firstSectionControlView = firstSectionControlView[0];
		firstSectionControlView.ui.heading.addClass( openedClass );
		firstSectionControlView.$el.closest( '.elementor-section-wrapper' ).addClass( openedClass );
	},

	onChildviewControlSectionClicked: function( childView ) {
		var openedClass = 'elementor-open',
			$wrapper = childView.$el.closest( '.elementor-section-wrapper' ),
			isSectionOpen = $wrapper.hasClass( openedClass );

		// Close all sections
		this.$( '.elementor-section-wrapper' ).removeClass( openedClass );
		this.$( '.elementor-control.elementor-control-type-section .elementor-panel-heading' ).removeClass( openedClass );

		// If the clicked section was not open, open it
		if ( ! isSectionOpen ) {
			childView.ui.heading.addClass( openedClass );
			$wrapper.addClass( openedClass );
		}

		elementor.channels.data.trigger( 'scrollbar:update' );
	}
} );

module.exports = EditorCompositeView;

},{"../../../behaviors/tabs":9}],50:[function(require,module,exports){
var PanelElementsCategory = require( '../models/element' ),
	PanelElementsCategoriesCollection;

PanelElementsCategoriesCollection = Backbone.Collection.extend( {
	model: PanelElementsCategory
} );

module.exports = PanelElementsCategoriesCollection;

},{"../models/element":53}],51:[function(require,module,exports){
var PanelElementsElementModel = require( '../models/element' ),
	PanelElementsElementsCollection;

PanelElementsElementsCollection = Backbone.Collection.extend( {
	model: PanelElementsElementModel/*,
	comparator: 'title'*/
} );

module.exports = PanelElementsElementsCollection;

},{"../models/element":53}],52:[function(require,module,exports){
var PanelElementsCategoriesCollection = require( './collections/categories' ),
	PanelElementsElementsCollection = require( './collections/elements' ),
	PanelElementsCategoriesView = require( './views/categories' ),
	PanelElementsElementsView = require( './views/elements' ),
	PanelElementsSearchView = require( './views/search' ),
	PanelElementsLanguageselectorView = require( './views/languageselector' ),
	PanelElementsLayoutView;

PanelElementsLayoutView = Marionette.LayoutView.extend( {
	template: '#tmpl-elementor-panel-elements',

	regions: {
		elements: '#elementor-panel-elements-wrapper',
		search: '#elementor-panel-elements-search-area',
		languageselector: '#elementor-panel-elements-languageselector-area'
	},

	elementsCollection: null,

	categoriesCollection: null,

	initialize: function() {
		this.listenTo( elementor.channels.panelElements, 'element:selected', this.destroy );
	},

	initElementsCollection: function() {
		var elementsCollection = new PanelElementsElementsCollection(),
			sectionConfig = elementor.config.elements.section;

		elementsCollection.add( {
			title: elementor.translate( 'inner_section' ),
			elType: 'section',
			categories: sectionConfig.categories,
			keywords: sectionConfig.keywords,
			icon: sectionConfig.icon
		} );

		// TODO: Change the array from server syntax, and no need each loop for initialize
		_.each( elementor.config.widgets, function( element, widgetType ) {
			elementsCollection.add( {
				title: element.title,
				elType: 'widget',
				categories: element.categories,
				keywords: element.keywords,
				icon: element.icon,
				widgetType: widgetType
			} );
		} );

		this.elementsCollection = elementsCollection;
	},

	initCategoriesCollection: function() {
		var categories = {};

		this.elementsCollection.each( function( element ) {
			_.each( element.get( 'categories' ), function( category ) {
				if ( ! categories[ category ] ) {
					categories[ category ] = [];
				}

				categories[ category ].push( element );
			} );
		} );

		var categoriesCollection = new PanelElementsCategoriesCollection();

		_.each( elementor.config.elements_categories, function( categoryConfig, categoryName ) {
			if ( ! categories[ categoryName ] ) {
				return;
			}

			categoriesCollection.add( {
				name: categoryName,
				title: categoryConfig.title,
				icon: categoryConfig.icon,
				items: categories[ categoryName ]
			} );
		} );

		this.categoriesCollection = categoriesCollection;
	},

	showCategoriesView: function() {
		this.getRegion( 'elements' ).show( new PanelElementsCategoriesView( { collection: this.categoriesCollection } ) );
	},

	showElementsView: function() {
		this.getRegion( 'elements' ).show( new PanelElementsElementsView( { collection: this.elementsCollection } ) );
	},

	clearSearchInput: function() {
		this.getChildView( 'search' ).clearInput();
	},

	changeFilter: function( filterValue ) {
		elementor.channels.panelElements
			.reply( 'filter:value', filterValue )
			.trigger( 'change' );
	},

	clearFilters: function() {
		this.changeFilter( null );
		this.clearSearchInput();
	},

	onChildviewChildrenRender: function() {
		this.updateElementsScrollbar();
	},

	onChildviewSearchChangeInput: function( child ) {
		var value = child.ui.input.val();

		if ( _.isEmpty( value ) ) {
			this.showCategoriesView();
		} else {
			var oldValue = elementor.channels.panelElements.request( 'filter:value' );

			if ( _.isEmpty( oldValue ) ) {
				this.showElementsView();
			}
		}

		this.changeFilter( value, 'search' );
	},

	onDestroy: function() {
		elementor.channels.panelElements.reply( 'filter:value', null );
	},

	onShow: function() {
		var searchRegion = this.getRegion( 'search' );
		var languageselectorRegion = this.getRegion( 'languageselector' );

		this.initElementsCollection();
		this.initCategoriesCollection();
		this.showCategoriesView();

		searchRegion.show( new PanelElementsSearchView() );
		languageselectorRegion.show( new PanelElementsLanguageselectorView() );
	},

	updateElementsScrollbar: function() {
		elementor.channels.data.trigger( 'scrollbar:update' );
	}
} );

module.exports = PanelElementsLayoutView;

},{"./collections/categories":50,"./collections/elements":51,"./views/categories":54,"./views/elements":57,"./views/languageselector":58,"./views/search":59}],53:[function(require,module,exports){
var PanelElementsElementModel;

PanelElementsElementModel = Backbone.Model.extend( {
	defaults: {
		title: '',
		categories: [],
		keywords: [],
		icon: '',
		elType: 'widget',
		widgetType: ''
	}
} );

module.exports = PanelElementsElementModel;

},{}],54:[function(require,module,exports){
var PanelElementsCategoryView = require( './category' ),
	PanelElementsCategoriesView;

PanelElementsCategoriesView = Marionette.CollectionView.extend( {
	childView: PanelElementsCategoryView,

	id: 'elementor-panel-elements-categories'
} );

module.exports = PanelElementsCategoriesView;

},{"./category":55}],55:[function(require,module,exports){
var PanelElementsElementView = require( './element' ),
	PanelElementsElementsCollection = require( '../collections/elements' ),
	PanelElementsCategoryView;

PanelElementsCategoryView = Marionette.CompositeView.extend( {
	template: '#tmpl-elementor-panel-elements-category',

	className: 'elementor-panel-category',

	childView: PanelElementsElementView,

	childViewContainer: '.panel-elements-category-items',

	initialize: function() {
		this.collection = new PanelElementsElementsCollection( this.model.get( 'items' ) );
	}
} );

module.exports = PanelElementsCategoryView;

},{"../collections/elements":51,"./element":56}],56:[function(require,module,exports){
var PanelElementsElementView;

PanelElementsElementView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-element-library-element',

	className: 'elementor-element-wrapper',

	onRender: function() {
		var self = this;

		this.$el.html5Draggable( {

			onDragStart: function() {
				elementor.channels.panelElements
					.reply( 'element:selected', self )
					.trigger( 'element:drag:start' );
			},

			onDragEnd: function() {
				elementor.channels.panelElements.trigger( 'element:drag:end' );
			},

			groups: [ 'elementor-element' ]
		} );
	}
} );

module.exports = PanelElementsElementView;

},{}],57:[function(require,module,exports){
var PanelElementsElementView = require( './element' ),
	PanelElementsElementsView;

PanelElementsElementsView = Marionette.CollectionView.extend( {
	childView: PanelElementsElementView,

	id: 'elementor-panel-elements',

	initialize: function() {
		this.listenTo( elementor.channels.panelElements, 'change', this.onFilterChanged );
	},

	filter: function( childModel ) {
		var filterValue = elementor.channels.panelElements.request( 'filter:value' );

		if ( ! filterValue ) {
			return true;
		}

		return _.any( [ 'title', 'keywords' ], function( type ) {
			return ( -1 !== childModel.get( type ).toLowerCase().indexOf( filterValue.toLowerCase() ) );
		} );
	},

	onFilterChanged: function() {
		this._renderChildren();
		this.triggerMethod( 'children:render' );
	}
} );

module.exports = PanelElementsElementsView;

},{"./element":56}],58:[function(require,module,exports){
var PanelElementsLanguageselectorView;

PanelElementsLanguageselectorView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-element-languageselector',

	id: 'elementor-panel-elements-languageselector-wrapper',

	ui: {
		select: 'select',
		btnShowLanguages: '#elementor-panel-elements-language-import-btn',
		btnLanguageImport: '.elementor-panel-elements-language-import-lng'
	},

	events: {
		'change @ui.select': 'onSelectChanged',
		'click @ui.btnShowLanguages': 'onShowLanguagesClick',
		'click @ui.btnLanguageImport': 'onLanguageImportClick',
	},

	initialize: function() {
		this.initImportLanguageDialog();
	},

	onSelectChanged: function( ) {
		if (!elementor.changeLanguage($(this.ui.select).val())) {
			$(this.ui.select).val(elementor.config.id_lang);
		}
	},

	onShowLanguagesClick: function( ) {
		$(this.ui.btnShowLanguages).parent().toggleClass('elementor-open');
	},

	initImportLanguageDialog: function( ) {
		var self = this,
			dialog;


		self.getImportLanguageDialog = function(id_lang) {
			if ( dialog ) {
				return dialog;
			}

			dialog = elementor.dialogsManager.createWidget( 'confirm', {
				id: 'elementor-import-language-dialog',
				headerMessage: elementor.translate( 'import_language_dialog_title' ),
				message: elementor.translate( 'import_language_dialog_msg' ),
				position: {
					my: 'center center',
					at: 'center center'
				},
				onConfirm: function() {
					Backbone.$( '#elementor-loading, #elementor-preview-loading' ).fadeIn( 600 );
					elementor.getRegion( 'sections' ).currentView.collection.reset();

					elementor.ajax.send( 'getLanguageContent', {
						data: {
							id_lang: id_lang,
							page_type: elementor.config.page_type,
							page_id: elementor.config.post_id,
							content_type: elementor.config.content_type,
						},
						success: function( data ) {
							elementor.getRegion( 'sections' ).currentView.addChildModel( data );
							Backbone.$( '#elementor-loading, #elementor-preview-loading' ).fadeOut( 600 );
						},
					} );
				}
			} );

			return dialog;
		};
	},

	onLanguageImportClick: function( element ) {
		element.preventDefault();
		var id_lang = $(element.currentTarget).data('language');
		this.getImportLanguageDialog(id_lang).show();

	},


} );

module.exports = PanelElementsLanguageselectorView;

},{}],59:[function(require,module,exports){
var PanelElementsSearchView;

PanelElementsSearchView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-element-search',

	id: 'elementor-panel-elements-search-wrapper',

	ui: {
		input: 'input'
	},

	events: {
		'keyup @ui.input': 'onInputChanged'
	},

	onInputChanged: function( event ) {
		var ESC_KEY = 27;

		if ( ESC_KEY === event.keyCode ) {
			this.clearInput();
		}

		this.triggerMethod( 'search:change:input' );
	},

	clearInput: function() {
		this.ui.input.val( '' );
	}
} );

module.exports = PanelElementsSearchView;

},{}],60:[function(require,module,exports){
var PanelMenuItemView = require( 'elementor-panel/pages/menu/views/item' ),
	PanelMenuPageView;

PanelMenuPageView = Marionette.CollectionView.extend( {
	id: 'elementor-panel-page-menu',

	childView: PanelMenuItemView,

	initialize: function() {
		this.collection = new Backbone.Collection( [
			{
				icon: 'eraser',
				title: elementor.translate( 'clear_page' ),
				callback: function() {
					elementor.clearPage();
				}
			},
			{
				icon: 'info-circle',
				title: elementor.translate( 'about_elementor' ),
				type: 'link',
				link: elementor.config.elementor_site,
				newTab: true
			}
		] );
	},

	onChildviewClick: function( childView ) {
		var menuItemType = childView.model.get( 'type' );

		switch ( menuItemType ) {
			case 'page' :
				var pageName = childView.model.get( 'pageName' ),
					pageTitle = childView.model.get( 'title' );

				elementor.getPanelView().setPage( pageName, pageTitle );
				break;

			case 'link' :
				var link = childView.model.get( 'link' ),
					isNewTab = childView.model.get( 'newTab' );

				if ( isNewTab ) {
					open( link, '_blank' );
				} else {
					location.href = childView.model.get( 'link' );
				}

				break;

			default:
				var callback = childView.model.get( 'callback' );

				if ( _.isFunction( callback ) ) {
					callback.call( childView );
				}
		}
	}
} );

module.exports = PanelMenuPageView;

},{"elementor-panel/pages/menu/views/item":61}],61:[function(require,module,exports){
var PanelMenuItemView;

PanelMenuItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-menu-item',

	className: 'elementor-panel-menu-item',

	triggers: {
		click: 'click'
	}
} );

module.exports = PanelMenuItemView;

},{}],62:[function(require,module,exports){
var PanelRevisionsPageView;

PanelRevisionsPageView = Marionette.ItemView.extend( {
	id: 'elementor-panel-page-revisions',

	template: '#tmpl-elementor-panel-revisions',

	selectedRevisionId: null,

	events: {
		'click .elementor-revision-apply': 'onClickApply'
	},

	onRender: function() {
		this.loadRevisions();
	},

	loadRevisions: function() {
		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		$.ajax( {
			url: config.ajaxurl + '&action=GetRevisions',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id
			},
			success: function( response ) {
				if ( ! response.success ) {
					self.showError();
					return;
				}
				self.renderRevisionsList( response );
			},
			error: function() {
				self.showError();
			}
		} );
	},

	showError: function() {
		var tmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-error' );
		this.$el.html( tmpl() );
	},

	renderRevisionsList: function( response ) {
		var $ = Backbone.$,
			self = this;

		// Render the list wrapper
		var listTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-list' );
		this.$el.html( listTmpl() );

		var $list = this.$el.find( '.elementor-revisions-list' );

		// Autosave item
		if ( response.autosave ) {
			var asEmpName = response.autosave.employee_name || 'System';
			var autosaveTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-autosave' );

			var $autosave = $( '<div class="elementor-revision-item elementor-revision-autosave" data-rev-id="autosave"></div>' );
			$autosave.html( autosaveTmpl( {
				initial: asEmpName.charAt( 0 ).toUpperCase(),
				timeAgo: self.getTimeAgo( response.autosave.autosave_at ),
				formattedDate: self.formatDate( response.autosave.autosave_at ),
				employeeName: self.escapeHtml( asEmpName )
			} ) );
			$list.append( $autosave );
		}

		// Empty state
		if ( response.revisions.length === 0 && ! response.autosave ) {
			var emptyTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-empty' );
			$list.html( emptyTmpl() );
			return;
		}

		// Revision items
		var itemTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-item' );

		response.revisions.forEach( function( rev, index ) {
			var empName = rev.employee_name || 'System';
			var isCurrent = ( index === 0 );

			var $item = $( '<div class="elementor-revision-item" data-rev-id="' + rev.id + '"></div>' );

			if ( isCurrent ) {
				$item.addClass( 'elementor-revision-current' );
			}

			$item.html( itemTmpl( {
				id: rev.id,
				initial: empName.charAt( 0 ).toUpperCase(),
				timeAgo: self.getTimeAgo( rev.created_at ),
				formattedDate: self.formatDate( rev.created_at ),
				label: self.escapeHtml( rev.label || elementor.translate( 'revisions_revision' ) ),
				employeeName: self.escapeHtml( empName ),
				isCurrent: isCurrent
			} ) );

			$list.append( $item );
		} );

		// Bind item click for selection
		this.$el.on( 'click', '.elementor-revision-item', function() {
			var $item = $( this ),
				revId = $item.data( 'rev-id' );

			self.$el.find( '.elementor-revision-item' ).removeClass( 'elementor-revision-selected' );
			$item.addClass( 'elementor-revision-selected' );
			self.selectedRevisionId = revId;

			self.$el.find( '.elementor-revision-apply' ).prop( 'disabled', false );
		} );
	},

	onClickApply: function() {
		if ( ! this.selectedRevisionId ) {
			return;
		}

		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		// Autosave restore
		if ( self.selectedRevisionId === 'autosave' ) {
			$.ajax( {
				url: config.ajaxurl + '&action=GetAutosave',
				type: 'POST',
				data: {
					entity_type: config.page_type,
					entity_id: config.post_id
				},
				success: function( response ) {
					if ( response.success && response.content ) {
						var parsed = JSON.parse( response.content );
						elementor.elements.reset( parsed );
						elementor.setFlagEditorChange( true );
						elementor.getPanelView().setPage( 'elements' );
					}
				}
			} );
			return;
		}

		// Regular revision restore
		$.ajax( {
			url: config.ajaxurl + '&action=RestoreRevision',
			type: 'POST',
			data: { id_revision: self.selectedRevisionId },
			success: function( response ) {
				if ( response.success && response.content ) {
					var parsed = JSON.parse( response.content );
					elementor.elements.reset( parsed );
					elementor.setFlagEditorChange( true );
					elementor.getPanelView().setPage( 'elements' );
				}
			}
		} );
	},

	getTimeAgo: function( dateStr ) {
		var now = new Date(),
			date = new Date( dateStr.replace( ' ', 'T' ) ),
			diff = Math.floor( ( now - date ) / 1000 );

		if ( diff < 60 ) { return diff + ' ' + elementor.translate( 'revisions_seconds_ago' ); }
		if ( diff < 3600 ) { return Math.floor( diff / 60 ) + ' ' + elementor.translate( 'revisions_min_ago' ); }
		if ( diff < 86400 ) { return Math.floor( diff / 3600 ) + ' ' + elementor.translate( 'revisions_hours_ago' ); }
		return Math.floor( diff / 86400 ) + ' ' + elementor.translate( 'revisions_days_ago' );
	},

	formatDate: function( dateStr ) {
		var d = new Date( dateStr.replace( ' ', 'T' ) );
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return d.getDate() + ' ' + months[ d.getMonth() ] + ' @ ' +
			( '0' + d.getHours() ).slice( -2 ) + ':' + ( '0' + d.getMinutes() ).slice( -2 );
	},

	escapeHtml: function( str ) {
		var div = document.createElement( 'div' );
		div.textContent = str;
		return div.innerHTML;
	}
} );

module.exports = PanelRevisionsPageView;

},{}],63:[function(require,module,exports){
var PanelSchemeBaseView;

PanelSchemeBaseView = Marionette.CompositeView.extend( {
	id: function() {
		return 'elementor-panel-scheme-' + this.getType();
	},

	className: 'elementor-panel-scheme',

	childViewContainer: '.elementor-panel-scheme-items',

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-elementor-panel-schemes-' + this.getType() );
	},

	ui: function() {
		return {
			saveButton: '.elementor-panel-scheme-save .elementor-btn',
			discardButton: '.elementor-panel-scheme-discard .elementor-btn',
			resetButton: '.elementor-panel-scheme-reset .elementor-btn'
		};
	},

	events: function() {
		return {
			'click @ui.saveButton': 'saveScheme',
			'click @ui.discardButton': 'discardScheme',
			'click @ui.resetButton': 'setDefaultScheme'
		};
	},

	initialize: function() {
		this.model = new Backbone.Model();

		this.resetScheme();
	},

	getType: function() {},

	getScheme: function() {
		return elementor.schemes.getScheme( this.getType() );
	},

	changeChildrenUIValues: function( schemeItems ) {
		var self = this;

		_.each( schemeItems, function( value, key ) {
			var model = self.collection.findWhere( { key: key } ),
				childView = self.children.findByModelCid( model.cid );

			childView.changeUIValue( value );
		} );
	},

	discardScheme: function() {
		elementor.schemes.resetSchemes( this.getType() );

		this.ui.saveButton.prop( 'disabled', true );

		this._renderChildren();
	},

	setSchemeValue: function( key, value ) {
		elementor.schemes.setSchemeValue( this.getType(), key, value );
	},

	saveScheme: function() {
		elementor.schemes.saveScheme( this.getType() );

		this.ui.saveButton.prop( 'disabled', true );

		this.resetScheme();

		this._renderChildren();
	},

	setDefaultScheme: function() {
		var defaultScheme = elementor.config.default_schemes[ this.getType() ].items;

		this.changeChildrenUIValues( defaultScheme );
	},

	resetItems: function() {
		this.model.set( 'items', this.getScheme().items );
	},

	resetCollection: function() {
		var items = this.model.get( 'items' );

		this.collection = new Backbone.Collection();

		_.each( items, _.bind( function( item, key ) {
			item.type = this.getType();
			item.key = key;

			this.collection.add( item );
		}, this ) );
	},

	resetScheme: function() {
		this.resetItems();
		this.resetCollection();
	},

	onChildviewValueChange: function( childView, newValue ) {
		this.ui.saveButton.removeProp( 'disabled' );

		this.setSchemeValue( childView.model.get( 'key' ), newValue );
	}
} );

module.exports = PanelSchemeBaseView;

},{}],64:[function(require,module,exports){
var PanelSchemeBaseView = require( 'elementor-panel/pages/schemes/base' ),
	PanelSchemeColorsView;

PanelSchemeColorsView = PanelSchemeBaseView.extend( {

	ui: function() {
		var ui = PanelSchemeBaseView.prototype.ui.apply( this, arguments );

		ui.systemSchemes = '.elementor-panel-scheme-color-system-scheme';

		return ui;
	},

	events: function() {
		var events = PanelSchemeBaseView.prototype.events.apply( this, arguments );

		events[ 'click @ui.systemSchemes' ] = 'onSystemSchemeClick';

		return events;
	},

	getChildView: function() {
		return require( 'elementor-panel/pages/schemes/items/color' );
	},

	getType: function() {
		return 'color';
	},

	onSystemSchemeClick: function( event ) {
		var $schemeClicked = Backbone.$( event.currentTarget ),
			schemeName = $schemeClicked.data( 'schemeName' ),
			scheme = elementor.config.system_schemes.color[ schemeName ].items;

		this.changeChildrenUIValues( scheme );
	}
} );

module.exports = PanelSchemeColorsView;

},{"elementor-panel/pages/schemes/base":63,"elementor-panel/pages/schemes/items/color":67}],65:[function(require,module,exports){
var PanelSchemeDisabledView;

PanelSchemeDisabledView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-schemes-disabled',

	disabledTitle: '',

	templateHelpers: function() {
		return {
			disabledTitle: this.disabledTitle
		};
	},

	id: 'elementor-panel-schemes-disabled'
} );

module.exports = PanelSchemeDisabledView;

},{}],66:[function(require,module,exports){
var PanelSchemeItemView;

PanelSchemeItemView = Marionette.ItemView.extend( {
	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-elementor-panel-scheme-' + this.model.get( 'type' ) + '-item' );
	},

	className: function() {
		return 'elementor-panel-scheme-item';
	}
} );

module.exports = PanelSchemeItemView;

},{}],67:[function(require,module,exports){
var PanelSchemeItemView = require( 'elementor-panel/pages/schemes/items/base' ),
	PanelSchemeColorView;

PanelSchemeColorView = PanelSchemeItemView.extend( {
	ui: {
		input: '.elementor-panel-scheme-color-value'
	},

	changeUIValue: function( newValue ) {
		this.ui.input.wpColorPicker( 'color', newValue );
	},

	onBeforeDestroy: function() {
		if ( this.ui.input.wpColorPicker( 'instance' ) ) {
			this.ui.input.wpColorPicker( 'close' );
		}
	},

	onRender: function() {
		this.ui.input.wpColorPicker( {
			change: _.bind( function( event, ui ) {
				this.triggerMethod( 'value:change', ui.color.toString() );
			}, this )
		} );
	}
} );

module.exports = PanelSchemeColorView;

},{"elementor-panel/pages/schemes/items/base":66}],68:[function(require,module,exports){
var PanelSchemeItemView = require( 'elementor-panel/pages/schemes/items/base' ),
	PanelSchemeTypographyView;

PanelSchemeTypographyView = PanelSchemeItemView.extend( {
	className: function() {
		var classes = PanelSchemeItemView.prototype.className.apply( this, arguments );

		return classes + ' elementor-panel-box';
	},

	ui: {
		heading: '.elementor-panel-heading',
		allFields: '.elementor-panel-scheme-typography-item-field',
		inputFields: 'input.elementor-panel-scheme-typography-item-field',
		selectFields: 'select.elementor-panel-scheme-typography-item-field',
		selectFamilyFields: 'select.elementor-panel-scheme-typography-item-field[name="font_family"]'
	},

	events: {
		'input @ui.inputFields': 'onFieldChange',
		'change @ui.selectFields': 'onFieldChange',
		'click @ui.heading': 'toggleVisibility'
	},

	onRender: function() {
		var self = this;

		this.ui.inputFields.add( this.ui.selectFields ).each( function() {
			var $this = Backbone.$( this ),
				name = $this.attr( 'name' ),
				value = self.model.get( 'value' )[ name ];

			$this.val( value );
		} );

		this.ui.selectFamilyFields.select2( {
			dir: elementor.config.is_rtl ? 'rtl' : 'ltr'
		} );
	},

	toggleVisibility: function() {
		this.ui.heading.toggleClass( 'elementor-open' );
	},

	changeUIValue: function( newValue ) {
		this.ui.allFields.each( function() {
			var $this = Backbone.$( this ),
				thisName = $this.attr( 'name' ),
				newFieldValue = newValue[ thisName ];

			$this.val( newFieldValue ).trigger( 'change' );
		} );
	},

	onFieldChange: function( event ) {
		var $select = this.$( event.currentTarget ),
			currentValue = elementor.helpers.cloneObject( this.model.get( 'value' ) ),
			fieldKey = $select.attr( 'name' );

		currentValue[ fieldKey ] = $select.val();

		if ( 'font_family' === fieldKey && ! _.isEmpty( currentValue[ fieldKey ] ) ) {
			elementor.helpers.enqueueFont( currentValue[ fieldKey ] );
		}

		this.triggerMethod( 'value:change', currentValue );
	}
} );

module.exports = PanelSchemeTypographyView;

},{"elementor-panel/pages/schemes/items/base":66}],69:[function(require,module,exports){
var PanelSchemeBaseView = require( 'elementor-panel/pages/schemes/base' ),
	PanelSchemeTypographyView;

PanelSchemeTypographyView = PanelSchemeBaseView.extend( {

	getChildView: function() {
		return require( 'elementor-panel/pages/schemes/items/typography' );
	},

	getType: function() {
		return 'typography';
	}
} );

module.exports = PanelSchemeTypographyView;

},{"elementor-panel/pages/schemes/base":63,"elementor-panel/pages/schemes/items/typography":68}],70:[function(require,module,exports){
var EditModeItemView = require( 'elementor-layouts/edit-mode' ),
	PanelLayoutView;

PanelLayoutView = Marionette.LayoutView.extend( {
	template: '#tmpl-elementor-panel',

	id: 'elementor-panel-inner',

	regions: {
		content: '#elementor-panel-content-wrapper',
		header: '#elementor-panel-header-wrapper',
		footer: '#elementor-panel-footer',
		modeSwitcher: '#elementor-mode-switcher'
	},

	pages: {},

	childEvents: {
		'click:add': function() {
			this.setPage( 'elements' );
		},
		'editor:destroy': function() {
			this.setPage( 'elements' );
		}
	},

	currentPageName: null,

	_isScrollbarInitialized: false,

	initialize: function() {
		this.initPages();
	},

	initPages: function() {
		var pages = {
			elements: {
				view: require( 'elementor-panel/pages/elements/elements' ),
				title: '<img src="' + elementor.config.assets_url + 'images/logo-panel.svg">'
			},
			editor: {
				view: require( 'elementor-panel/pages/editor' )
			},
			menu: {
				view: require( 'elementor-panel/pages/menu/menu' ),
				title: '<img src="' + elementor.config.assets_url + 'images/logo-panel.svg">'
			},
			colorScheme: {
				view: require( 'elementor-panel/pages/schemes/colors' )
			},
			typographyScheme: {
				view: require( 'elementor-panel/pages/schemes/typography' )
			},
			revisions: {
				view: require( 'elementor-panel/pages/revisions' ),
				title: 'Revisions'
			}
		};

		var schemesTypes = Object.keys( elementor.schemes.getSchemes() ),
			disabledSchemes = _.difference( schemesTypes, elementor.schemes.getEnabledSchemesTypes() );

		_.each( disabledSchemes, function( schemeType ) {
			var scheme  = elementor.schemes.getScheme( schemeType );

			pages[ schemeType + 'Scheme' ].view = require( 'elementor-panel/pages/schemes/disabled' ).extend( {
				disabledTitle: scheme.disabled_title
			} );
		} );

		this.pages = pages;
	},

	getHeaderView: function() {
		return this.getChildView( 'header' );
	},

	getCurrentPageName: function() {
		return this.currentPageName;
	},

	getCurrentPageView: function() {
		return this.getChildView( 'content' );
	},

	setPage: function( page, title, viewOptions ) {
		var pageData = this.pages[ page ];

		if ( ! pageData ) {
			throw new ReferenceError( 'Elementor panel doesn\'t have page named \'' + page + '\'' );
		}

		this.showChildView( 'content', new pageData.view( viewOptions ) );

		this.getHeaderView().setTitle( title || pageData.title );

		this.currentPageName = page;
	},

	onBeforeShow: function() {
		var PanelFooterItemView = require( 'elementor-layouts/panel/footer' ),
			PanelHeaderItemView = require( 'elementor-layouts/panel/header' );

		// Edit Mode
		this.showChildView( 'modeSwitcher', new EditModeItemView() );

		// Header
		this.showChildView( 'header', new PanelHeaderItemView() );

		// Footer
		this.showChildView( 'footer', new PanelFooterItemView() );

		// Added Editor events
		this.updateScrollbar = _.throttle( this.updateScrollbar, 100 );

		this.getRegion( 'content' )
			.on( 'before:show', _.bind( this.onEditorBeforeShow, this ) )
			.on( 'empty', _.bind( this.onEditorEmpty, this ) )
			.on( 'show', _.bind( this.updateScrollbar, this ) );

		// Set default page to elements
		this.setPage( 'elements' );

		this.listenTo( elementor.channels.data, 'scrollbar:update', this.updateScrollbar );
	},

	onEditorBeforeShow: function() {
		_.defer( _.bind( this.updateScrollbar, this ) );
	},

	onEditorEmpty: function() {
		this.updateScrollbar();
	},

	updateScrollbar: function() {
		var $panel = this.content.$el;

		if ( ! this._isScrollbarInitialized ) {
			$panel.perfectScrollbar();
			this._isScrollbarInitialized = true;

			return;
		}

		$panel.perfectScrollbar( 'update' );
	}
} );

module.exports = PanelLayoutView;

},{"elementor-layouts/edit-mode":46,"elementor-layouts/panel/footer":47,"elementor-layouts/panel/header":48,"elementor-panel/pages/editor":49,"elementor-panel/pages/elements/elements":52,"elementor-panel/pages/menu/menu":60,"elementor-panel/pages/revisions":62,"elementor-panel/pages/schemes/colors":64,"elementor-panel/pages/schemes/disabled":65,"elementor-panel/pages/schemes/typography":69}],71:[function(require,module,exports){
var TopBarItemView;

TopBarItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-topbar-content',

	tagName: 'nav',

	id: 'elementor-topbar-tools',

	ui: {
		exit: '#elementor-topbar-exit',
		logo: '#elementor-topbar-logo',
		revisions: '#elementor-topbar-revisions',
		deviceButtons: '.elementor-topbar-device-btn',
		templates: '#elementor-topbar-templates',
		styles: '#elementor-topbar-styles',
		navigator: '#elementor-topbar-navigator',
		inspect: '#elementor-topbar-inspect',
		preview: '#elementor-topbar-preview',
		save: '#elementor-topbar-save',
		saveIcon: '#elementor-topbar-save .elementor-topbar-save-icon'
	},

	events: {
		'click @ui.exit': 'onClickExit',
		'click @ui.logo': 'onClickLogo',
		'click @ui.revisions': 'onClickRevisions',
		'click @ui.deviceButtons': 'onClickDeviceButton',
		'click @ui.templates': 'onClickTemplates',
		'click @ui.styles': 'onClickStyles',
		'click @ui.navigator': 'onClickNavigator',
		'click @ui.inspect': 'onClickInspect',
		'click @ui.preview': 'onClickPreview',
		'click @ui.save': 'onClickSave'
	},

	initialize: function() {
		this._initSaveDialog();
		this._initAutosave();

		this.listenTo( elementor.channels.editor, 'editor:changed', this.onEditorChanged );
		this.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	_initSaveDialog: function() {
		var dialog;

		this.getSaveDialog = function() {
			if ( ! dialog ) {
				var $ = Backbone.$,
					$dialogMessage = $( '<div>', {
						'class': 'elementor-dialog-message'
					} ),
					$messageIcon = $( '<i>', {
						'class': 'fa fa-check-circle'
					} ),
					$messageText = $( '<div>', {
						'class': 'elementor-dialog-message-text'
					} ).text( elementor.translate( 'saved' ) );

				$dialogMessage.append( $messageIcon, $messageText );

				dialog = elementor.dialogsManager.createWidget( 'popup', {
					hide: {
						delay: 1500
					}
				} );

				dialog.setMessage( $dialogMessage );
			}

			return dialog;
		};
	},

	_initAutosave: function() {
		var self = this;

		// Autosave every 60 seconds when there are unsaved changes
		this._autosaveInterval = setInterval( function() {
			if ( elementor.isEditorChanged() ) {
				self._doAutosave();
			}
		}, 60000 );
	},

	_doAutosave: function() {
		var config = elementor.config,
			data = elementor.elements.toJSON();

		if ( ! data || ! data.length ) {
			return;
		}

		Backbone.$.ajax( {
			url: config.ajaxurl + '&action=SaveAutosave',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id,
				data: JSON.stringify( data )
			}
		} );
	},

	onClickExit: function() {
		if ( elementor.isEditorChanged() ) {
			var dialog = elementor.dialogsManager.createWidget( 'confirm', {
				headerMessage: elementor.translate( 'changes_lost' ),
				message: elementor.translate( 'dialog_confirm_changes_lost' ),
				strings: {
					confirm: elementor.translate( 'go_back' ),
					cancel: elementor.translate( 'cancel' )
				},
				onConfirm: function() {
					window.location = elementor.config.edit_post_link;
				}
			} );
			dialog.show();
		} else {
			window.location = elementor.config.edit_post_link;
		}
	},

	onClickLogo: function( e ) {
		e.preventDefault();
		window.location = elementor.config.edit_post_link;
	},

	onClickRevisions: function() {
		var panel = elementor.getPanelView();
		if ( panel.getCurrentPageName() === 'revisions' ) {
			panel.setPage( 'elements' );
		} else {
			panel.setPage( 'revisions', 'Revisions' );
		}
	},

	onClickDeviceButton: function( e ) {
		var newDeviceMode = Backbone.$( e.currentTarget ).data( 'device-mode' );
		elementor.changeDeviceMode( newDeviceMode );
	},

	onClickNavigator: function() {
		this.ui.navigator.toggleClass( 'active' );
		elementor.channels.editor.trigger( 'navigator:toggle' );
	},

	onClickTemplates: function() {
		elementor.templates.startModal( function() {
			elementor.templates.showTemplates();
		} );
	},

	onClickStyles: function() {
		elementor.styleLibrary.startModal( function() {
			elementor.styleLibrary.showStyles();
		} );
	},

	onClickInspect: function() {
		// Toggle inspect mode via the panel footer (delegates to existing logic)
		var $inspectBtn = Backbone.$( '#elementor-panel-footer-inspect' );
		if ( $inspectBtn.length ) {
			$inspectBtn.trigger( 'click' );
		}
		this.ui.inspect.toggleClass( 'active' );
	},

	onClickPreview: function() {
		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		// Step 1: autosave current content
		var data = elementor.elements.toJSON();
		if ( ! data || ! data.length ) {
			return;
		}

		self.ui.preview.addClass( 'active' );

		$.ajax( {
			url: config.ajaxurl + '&action=SaveAutosave',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id,
				data: JSON.stringify( data )
			},
			success: function() {
				// Step 2: get the front-office preview URL
				$.ajax( {
					url: config.ajaxurl + '&action=GetPreviewUrl',
					type: 'POST',
					data: {
						page_type: config.page_type,
						page_id: config.post_id,
						content_type: config.content_type,
						id_lang: config.id_lang
					},
					success: function( response ) {
						self.ui.preview.removeClass( 'active' );
						if ( response.success && response.url ) {
							window.open( response.url, '_blank' );
						}
					},
					error: function() {
						self.ui.preview.removeClass( 'active' );
					}
				} );
			},
			error: function() {
				self.ui.preview.removeClass( 'active' );
			}
		} );
	},

	onClickSave: function() {
		var self = this;

		self.ui.save.addClass( 'elementor-topbar-save-loading' );

		var options = {
			revision: 'publish',
			onSuccess: function() {
				self.getSaveDialog().show();
				self.ui.save.removeClass( 'elementor-topbar-save-loading' );

				// Refresh revisions panel if currently displayed
				var panel = elementor.getPanelView();
				if ( panel.getCurrentPageName() === 'revisions' ) {
					panel.setPage( 'revisions', 'Revisions' );
				}
			}
		};

		elementor.saveBuilder( options );
	},

	onEditorChanged: function() {
		this.ui.save.toggleClass( 'elementor-topbar-save-active', elementor.isEditorChanged() );
	},

	onDeviceModeChange: function() {
		var previousDeviceMode = elementor.channels.deviceMode.request( 'previousMode' ),
			currentDeviceMode = elementor.channels.deviceMode.request( 'currentMode' );

		this.ui.deviceButtons.filter( '[data-device-mode="' + previousDeviceMode + '"]' ).removeClass( 'active' );
		this.ui.deviceButtons.filter( '[data-device-mode="' + currentDeviceMode + '"]' ).addClass( 'active' );
	},

	onDestroy: function() {
		if ( this._autosaveInterval ) {
			clearInterval( this._autosaveInterval );
		}
	}
} );

module.exports = TopBarItemView;

},{}],72:[function(require,module,exports){
var BaseSettingsModel;

BaseSettingsModel = Backbone.Model.extend( {

	initialize: function( data ) {
		this.controls = elementor.getElementControls( this );
		if ( ! this.controls ) {
			return;
		}

		var attrs = data || {},
			defaults = {};

		_.each( this.controls, function( field ) {
			var control = elementor.config.controls[ field.type ];

			if ( _.isObject( control.default_value )  ) {
				defaults[ field.name ] = _.extend( {}, control.default_value, field['default'] || {} );
			} else {
				defaults[ field.name ] = field['default'] || control.default_value;
			}
		} );

		this.defaults = defaults;

		// Apply default style when creating a new widget (empty settings)
		var widgetType = attrs.widgetType;
		var isNewWidget = widgetType && this._countUserKeys( attrs ) === 0;

		if ( isNewWidget ) {
			var defaultStyle = this._findDefaultStyle( widgetType );

			if ( defaultStyle ) {
				attrs = _.defaults( {}, defaultStyle, defaults );
				attrs.widgetType = widgetType;
				if ( data && data.elType ) {
					attrs.elType = data.elType;
				}
				if ( data && data.isInner ) {
					attrs.isInner = data.isInner;
				}
			}
		}

		// TODO: Change method to recursive
		attrs = _.defaults( {}, attrs, defaults );

		_.each( this.controls, function( field ) {
			if ( 'repeater' === field.type ) {
				attrs[ field.name ] = new Backbone.Collection( attrs[ field.name ], {
					model: BaseSettingsModel
				} );
			}
		} );

		this.set( attrs );
	},

	/**
	 * Count keys in settings data that are not system/meta keys.
	 * Used to detect if a widget was just created (empty user settings).
	 */
	_countUserKeys: function( data ) {
		var metaKeys = [ 'widgetType', 'elType', 'isInner' ];
		var count = 0;

		_.each( data, function( value, key ) {
			if ( ! _.contains( metaKeys, key ) ) {
				count++;
			}
		} );

		return count;
	},

	/**
	 * Find the default style settings for a given widget type
	 * from the widgetStyles config array.
	 */
	_findDefaultStyle: function( widgetType ) {
		if ( ! elementor.config || ! elementor.config.widgetStyles ) {
			return null;
		}

		var styles = elementor.config.widgetStyles;

		for ( var i = 0; i < styles.length; i++ ) {
			if ( styles[ i ].widget_type === widgetType && styles[ i ].is_default ) {
				return styles[ i ].settings || null;
			}
		}

		return null;
	},

	getFontControls: function() {
		return _.filter( this.controls, _.bind( function( control ) {
			return 'font' === control.type;
		}, this ) );
	},

	getStyleControls: function( controls ) {
		var self = this;

		controls = controls || self.controls;

		return _.filter( controls, function( control ) {
			if ( control.fields ) {
				control.styleFields = self.getStyleControls( control.fields );

				return true;
			}

			return self.isStyleControl( control.name, controls );
		} );
	},

	isStyleControl: function( attribute, controls ) {
		controls = controls || this.controls;

		var currentControl = _.find( controls, function( control ) {
			return attribute === control.name;
		} );

		return currentControl && ! _.isEmpty( currentControl.selectors );
	},

	getClassControls: function() {
		return _.filter( this.controls, _.bind( function( control ) {
			return this.isClassControl( control.name );
		}, this ) );
	},

	isClassControl: function( attribute ) {
		var currentControl = _.find( this.controls, function( control ) {
			return attribute === control.name;
		} );

		return currentControl && ! _.isUndefined( currentControl.prefix_class );
	},

	getControl: function( id ) {
		return _.find( this.controls, function( control ) {
			return id === control.name;
		} );
	},

	clone: function() {
		return new BaseSettingsModel( elementor.helpers.cloneObject( this.attributes ) );
	},

	toJSON: function() {

		var data = Backbone.Model.prototype.toJSON.call( this );

		delete data.widgetType;
		delete data.elType;
		delete data.isInner;

		_.each( data, function( attribute, key ) {
			if ( attribute && attribute.toJSON ) {
				data[ key ] = attribute.toJSON();
			}
		} );

		return data;
	},

	toJSONCleaned: function() {
		var data = Backbone.Model.prototype.toJSONCleaned.call( this );

		delete data.widgetType;
		delete data.elType;
		delete data.isInner;

		// remove empty values
		data = this.cleanEmptyValues(data);


		console.log(data);
		_.each( data, function( attribute, key ) {
			if ( attribute && attribute.toJSON ) {
				data[ key ] = attribute.toJSON();
			}
		});

		return data;
	},

	cleanEmptyValues: function(data) {
		function cleanEmptyValues(data) {
			// Si tableau → nettoyer chaque entrée
			if (Array.isArray(data)) {
				const cleanedArray = data
					.map(item => cleanEmptyValues(item))           // nettoyage récursif
					.filter(item =>                                 // suppression des entrées vides
						item !== null &&
						item !== undefined &&
						item !== '' &&
						!(typeof item === 'object' && Object.keys(item).length === 0)
					);

				return cleanedArray.length > 0 ? cleanedArray : [];  // retourne tableau vide si vide
			}

			// Si objet → nettoyer chaque clé
			if (typeof data === 'object' && data !== null) {
				const cleanedObj = {};

				Object.keys(data).forEach(key => {
					const value = cleanEmptyValues(data[key]);

					const isEmpty =
						value === null ||
						value === undefined ||
						value === '' ||
						(Array.isArray(value) && value.length === 0) ||
						(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

					if (!isEmpty) {
						cleanedObj[key] = value;
					}
				});

				return cleanedObj;
			}

			// Valeur primitive → retourner tel quel
			return data;
		}
	}
} );

module.exports = BaseSettingsModel;
},{}],73:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	ColumnSettingsModel;

ColumnSettingsModel = BaseSettingsModel.extend( {
	defaults: {
		_inline_size: '',
		_column_size: 100
	}
} );

module.exports = ColumnSettingsModel;

},{"elementor-models/base-settings":72}],74:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	WidgetSettingsModel = require( 'elementor-models/widget-settings' ),
	ColumnSettingsModel = require( 'elementor-models/column-settings' ),
	RowSettingsModel = require( 'elementor-models/row-settings' ),
	SectionSettingsModel = require( 'elementor-models/section-settings' ),

	ElementModel,
	ElementCollection;

ElementModel = Backbone.Model.extend( {
	defaults: {
		id: '',
		elType: '',
		isInner: false,
		settings: {},
		defaultEditSettings: {}
	},

	remoteRender: false,
	_htmlCache: null,
	_jqueryXhr: null,
	renderOnLeave: false,

	initialize: function( options ) {
		var elements = this.get( 'elements' ),
			elType = this.get( 'elType' ),
			settings;

		var settingModels = {
			widget: WidgetSettingsModel,
			column: ColumnSettingsModel,
			row: RowSettingsModel,
			section: SectionSettingsModel
		};

		var SettingsModel = settingModels[ elType ] || BaseSettingsModel;

		settings = this.get( 'settings' ) || {};
		if ( 'widget' === elType ) {
			settings.widgetType = this.get( 'widgetType' );
		}

		settings.elType = elType;
		settings.isInner = this.get( 'isInner' );

		settings = new SettingsModel( settings );
		this.set( 'settings', settings );

		this.initEditSettings();

		if ( undefined !== elements ) {
			this.set( 'elements', new ElementCollection( elements ) );
		}

		if ( 'widget' === this.get( 'elType' ) ) {
			this.remoteRender = true;
			this.setHtmlCache( options.htmlCache || '' );
		}

		// No need this variable anymore
		delete options.htmlCache;

		// Make call to remote server as throttle function
		this.renderRemoteServer = _.throttle( this.renderRemoteServer, 1000 );

		this.on( 'destroy', this.onDestroy );
		this.on( 'editor:close', this.onCloseEditor );
	},

	initEditSettings: function() {
		this.set( 'editSettings', new Backbone.Model( this.get( 'defaultEditSettings' ) ) );
	},

	onDestroy: function() {
		// Clean the memory for all use instances
		var settings = this.get( 'settings' ),
			elements = this.get( 'elements' );

		if ( undefined !== elements ) {
			_.each( _.clone( elements.models ), function( model ) {
				model.destroy();
			} );
		}
		settings.destroy();
	},

	onCloseEditor: function() {
		this.initEditSettings();

		if ( this.renderOnLeave ) {
			this.renderRemoteServer();
		}
	},

	setSetting: function( key, value, triggerChange ) {
		triggerChange = triggerChange || false;

		var settings = this.get( 'settings' );

		settings.set( key, value );

		this.set( 'settings', settings );

		if ( triggerChange ) {
			this.trigger( 'change', this );
			this.trigger( 'change:settings', this );
			this.trigger( 'change:settings:' + key, this );
		}
	},

	getSetting: function( key ) {
		var settings = this.get( 'settings' );

		if ( undefined === settings.get( key ) ) {
			return '';
		}

		return settings.get( key );
	},

	setHtmlCache: function( htmlCache ) {
		this._htmlCache = htmlCache;
	},

	getHtmlCache: function() {
		return this._htmlCache;
	},

	getTitle: function() {
		var elementData = elementor.getElementData( this );

		return ( elementData ) ? elementData.title : 'Unknown';
	},

	getIcon: function() {
		var elementData = elementor.getElementData( this );

		return ( elementData ) ? elementData.icon : 'unknown';
	},

	renderRemoteServer: function() {
		if ( ! this.remoteRender ) {
			return;
		}

		this.renderOnLeave = false;

		this.trigger( 'before:remote:render' );

		if ( this._jqueryXhr && 4 !== this._jqueryXhr ) {
			this._jqueryXhr.abort();
		}

		var data = this.toJSON();

		this._jqueryXhr = elementor.ajax.send( 'renderWidget', {
			url: elementor.config.ajaxFrontUrl,
			data: {
				post_id: elementor.config.post_id,
				data: JSON.stringify( data ),
			},
			success: _.bind( this.onRemoteGetHtml, this )
		} );
	},




	onRemoteGetHtml: function( data ) {
		this.setHtmlCache( data.render );
		this.trigger( 'remote:render' );
	},

	clone: function() {
		var newModel = Backbone.Model.prototype.clone.apply( this, arguments );
		newModel.set( 'id', elementor.helpers.getUniqueID() );

		newModel.setHtmlCache( this.getHtmlCache() );

		var elements = this.get( 'elements' ),
			settings = this.get( 'settings' );

		if ( ! _.isEmpty( elements ) ) {
			newModel.set( 'elements', elements.clone() );
		}

		newModel.set( 'settings', settings.clone() );

		return newModel;
	},

	toJSON: function( options ) {
		options = _.extend( { copyHtmlCache: false }, options );

		// Call parent's toJSON method
		var data = Backbone.Model.prototype.toJSON.call( this );

		_.each( data, function( attribute, key ) {
			if ( attribute && attribute.toJSON ) {
				data[ key ] = attribute.toJSON( options );
			}
		} );

		if ( options.copyHtmlCache ) {
			data.htmlCache = this.getHtmlCache();
		} else {
			delete data.htmlCache;
		}

		return data;
	}

} );

ElementCollection = Backbone.Collection.extend( {
	add: function( models, options, isCorrectSet ) {
		if ( ( ! options || ! options.silent ) && ! isCorrectSet ) {
			throw 'Call Error: Adding model to element collection is allowed only by the dedicated addChildModel() method.';
		}

		return Backbone.Collection.prototype.add.call( this, models, options );
	},

	model: function( attrs, options ) {
		if ( attrs.elType ) {
			return new ElementModel( attrs, options );
		}
		return new Backbone.Model( attrs, options );
	},

	clone: function() {
		var tempCollection = Backbone.Collection.prototype.clone.apply( this, arguments ),
			newCollection = new ElementCollection();

		tempCollection.forEach( function( model ) {
			newCollection.add( model.clone(), null, true );
		} );

		return newCollection;
	}
} );

ElementCollection.prototype.sync = function() {
	return null;
};
ElementCollection.prototype.fetch = function() {
	return null;
};
ElementCollection.prototype.save = function() {
	return null;
};

ElementModel.prototype.sync = function() {
	return null;
};
ElementModel.prototype.fetch = function() {
	return null;
};
ElementModel.prototype.save = function() {
	return null;
};

module.exports = {
	Model: ElementModel,
	Collection: ElementCollection
};

},{"elementor-models/base-settings":72,"elementor-models/column-settings":73,"elementor-models/row-settings":75,"elementor-models/section-settings":76,"elementor-models/widget-settings":77}],75:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	RowSettingsModel;

RowSettingsModel = BaseSettingsModel.extend( {
	defaults: {}
} );

module.exports = RowSettingsModel;

},{"elementor-models/base-settings":72}],76:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	SectionSettingsModel;

SectionSettingsModel = BaseSettingsModel.extend( {
	defaults: {}
} );

module.exports = SectionSettingsModel;

},{"elementor-models/base-settings":72}],77:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	WidgetSettingsModel;

WidgetSettingsModel = BaseSettingsModel.extend( {

} );

module.exports = WidgetSettingsModel;

},{"elementor-models/base-settings":72}],78:[function(require,module,exports){
// modules/iqitelementor/views/_dev/js/editor/utils/context-clipboard.js

let clipboard = window.iqitElementorClipboard || null;

function setClipboardFromElement( view ) {
    const model = view.model;

    clipboard = {
        type: 'element',
        elType: model.get( 'elType' ),          // section / column / widget
        widgetType: model.get( 'widgetType' ),  // uniquement pour les widgets
        data: model.toJSON(),
    };

    window.iqitElementorClipboard = clipboard;
    return clipboard;
}

function getCopyAction( view, options = {} ) {
    const defaults = {
        icon: '<i class="fa fa-clipboard"></i>',
    };

    const settings = Object.assign( {}, defaults, options );

    return {
        name: 'copy',
        icon: settings.icon,
        title: elementor.translate ? elementor.translate( 'Copy' ) : 'Copy',
        separator: settings.separator,
        callback: () => {
            setClipboardFromElement( view );
        },
    };
}

module.exports = getCopyAction;
},{}],79:[function(require,module,exports){
/**
 * Utils: paste only style-related settings from one element to another.
 *
 * This module exposes two helpers:
 * - canPasteStyles(clipboardModel, targetModel)
 * - pasteStyles(clipboardModel, targetModel)
 *
 * Both parameters are expected to be Backbone models of Elementor-like widgets
 * (the same type as those used in the editor).
 */

/**
 * Try to get the control definitions for a given element model.
 * The exact API may vary a bit depending on the fork, so we try
 * a few common patterns and fall back safely.
 *
 * @param {Backbone.Model} model
 * @returns {Object|null}
 */
function getControlsFromModel(model) {
	if (!model || typeof model !== 'object') {
		return null;
	}

	let widgetType = null;
	if (typeof model.get === 'function') {
		widgetType = model.get('widgetType');
	}

	if (
		typeof elementor !== 'undefined' &&
		elementor.config &&
		elementor.config.widgets &&
		widgetType &&
		elementor.config.widgets[widgetType]
	) {
		const widgetConfig = elementor.config.widgets[widgetType];
		if (widgetConfig && widgetConfig.controls && typeof widgetConfig.controls === 'object') {
			return widgetConfig.controls;
		}
	}

	return null;
}

/**
 * Return the list of setting keys that belong to the Style tab
 * (or to a section considered as a style section).
 *
 * @param {Backbone.Model} model
 * @returns {string[]} Array of setting keys
 */
function getStyleControls(model) {
	const controls = getControlsFromModel(model);
	if (!controls) {
		return [];
	}

	return controls.filter((control) => {
		if (typeof control !== 'object') {
			return false;
		}

		if ( undefined !== control.style_transfer ) {
			return control.style_transfer;
		}

		return 'content' !== control.tab || control.selectors || control.prefix_class;
	});
}

/**
 * Petit helper pour normaliser les settings d'un modèle
 * (Backbone model ou simple objet).
 *
 * @param {any} rawSettings
 * @returns {Object}
 */
function normalizeSettings(rawSettings) {
	if (!rawSettings) {
		return {};
	}

	// Backbone model avec toJSON()
	if (typeof rawSettings.toJSON === 'function') {
		return rawSettings.toJSON();
	}

	// Déjà un objet simple
	if (typeof rawSettings === 'object') {
		return rawSettings;
	}

	return {};
}

/**
 * Colle uniquement les settings liés au Style depuis clipboardModel vers targetModel.
 * Ne fait rien si les prérequis ne sont pas remplis.
 *
 * @param {Backbone.Model} targetModel
 */
function pasteStyles(targetModel) {
    const clipboardModel = window.iqitElementorClipboard;
	if (!clipboardModel || !targetModel) {
		return;
	}

	// Clés de style basées sur la définition des controls de la CIBLE :
	// ça évite d'essayer de setter des clés qui n'existent pas sur ce widget.
	const styleControls = getStyleControls(targetModel);

	if (!styleControls.length) {
		return;
	}

	const sourceSettings = normalizeSettings(clipboardModel.data.settings);
	const newStyleSettings = {};

	styleControls.forEach((control) => {
		if (Object.prototype.hasOwnProperty.call(sourceSettings, control.name)) {
			newStyleSettings[control.name] = sourceSettings[control.name];
		}
	});

	const targetSettingsRaw = targetModel.get && targetModel.get('settings');
	const targetSettings = normalizeSettings(targetSettingsRaw);

	if (!Object.keys(newStyleSettings).length) {
		// Rien à coller
		return;
	}

	// Fusion des settings actuels avec les nouveaux styles
	const mergedSettings = (typeof _ !== 'undefined' && typeof _.extend === 'function')
		? _.extend({}, targetSettings, newStyleSettings)
		: Object.assign({}, targetSettings, newStyleSettings);

	// On met à jour le modèle cible. Selon ton implémentation,
	// tu peux avoir un setSetting() ou similaire.
	if (typeof targetSettingsRaw === 'object' && typeof targetSettingsRaw.set === 'function') {
		// Si settings est un Backbone Model
		Object.keys(mergedSettings).forEach((settingKey) => {
			targetSettingsRaw.set(settingKey, mergedSettings[settingKey]);
		});
	} else if (typeof targetModel.setSettings === 'function') {
		// Certaines implémentations exposent une API dédiée
		targetModel.setSettings(mergedSettings);
	} else if (typeof targetModel.set === 'function') {
		// Fallback : on remplace le bloc settings complet
		targetModel.set('settings', mergedSettings);
	}
}

function getPastStylesAction( view, options = {} ) {
    const defaults = {
        icon: '<i class="fa fa-paint-brush"></i>',
    };

    const settings = Object.assign( {}, defaults, options );

    return {
        name: 'paste_styles',
        icon: settings.icon,
        title: elementor.translate ? elementor.translate( 'Paste styles' ) : 'Copy',
        separator: settings.separator,
        callback: () => {
            pasteStyles(view.model);
        },
    };
}

// Export par défaut pratique si tu préfères importer un seul objet.
module.exports = getPastStylesAction;

},{}],80:[function(require,module,exports){
var Ajax;

Ajax = {
	config: {},

	initConfig: function() {
		this.config = {
			ajaxParams: {
				type: 'POST',
				url: elementor.config.ajaxurl,
				data: {}
			}
		};
	},

	init: function() {
		this.initConfig();
	},

	send: function( action, options ) {
		var ajaxParams = elementor.helpers.cloneObject( this.config.ajaxParams );

		options = options || {};

		Backbone.$.extend( ajaxParams, options );


		if ( ajaxParams.data instanceof FormData ) {
			ajaxParams.data.append( 'action', action );
		} else {
			ajaxParams.data.action = action;
		}

		var successCallback = ajaxParams.success,
			errorCallback = ajaxParams.error;

		if ( successCallback || errorCallback ) {
			ajaxParams.success = function( response ) {
				if ( response.success && successCallback ) {
					successCallback( response.data );
				}

				if ( ( ! response.success ) && errorCallback ) {
					errorCallback( response.data );
				}
			};

			if ( errorCallback ) {
				ajaxParams.error = function( data ) {
					errorCallback( data );
				};
			}
		}

		return Backbone.$.ajax( ajaxParams );
	}
};

module.exports = Ajax;

},{}],81:[function(require,module,exports){
var helpers;

helpers = {
	_enqueuedFonts: [],

	elementsHierarchy: {
		section: {
			column: {
				widget: null,
				section: null
			}
		}
	},

	enqueueFont: function( font ) {
		if ( -1 !== this._enqueuedFonts.indexOf( font ) ) {
			return;
		}

		var fontType = elementor.config.controls.font.fonts[ font ],
			fontUrl;

		switch ( fontType ) {
			case 'googlefonts' :
				fontUrl = 'https://fonts.googleapis.com/css?family=' + font + ':100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic';
				break;

			case 'earlyaccess' :
				var fontLowerString = font.replace( /\s+/g, '' ).toLowerCase();
				fontUrl = 'https://fonts.googleapis.com/earlyaccess/' + fontLowerString + '.css';
				break;
		}

		if ( ! _.isEmpty( fontUrl ) ) {
			elementor.$previewContents.find( 'link:last' ).after( '<link href="' + fontUrl + '" rel="stylesheet" type="text/css">' );
		}
		this._enqueuedFonts.push( font );
	},

	getElementChildType: function( elementType, container ) {
		if ( ! container ) {
			container = this.elementsHierarchy;
		}

		if ( undefined !== container[ elementType ] ) {

			if ( Backbone.$.isPlainObject( container[ elementType ] ) ) {
				return Object.keys( container[ elementType ] );
			}

			return null;
		}

		for ( var type in container ) {

			if ( ! container.hasOwnProperty( type ) ) {
				continue;
			}

			if ( ! Backbone.$.isPlainObject( container[ type ] ) ) {
				continue;
			}

			var result = this.getElementChildType( elementType, container[ type ] );

			if ( result ) {
				return result;
			}
		}

		return null;
	},

	getUniqueID: function() {
		var id;

		// TODO: Check conflict models
		//while ( true ) {
			id = Math.random().toString( 36 ).substr( 2, 7 );
			//if ( 1 > $( 'li.item-id-' + id ).length ) {
				return id;
			//}
		//}
	},

	stringReplaceAll: function( string, replaces ) {
		var re = new RegExp( Object.keys( replaces ).join( '|' ), 'gi' );

		return string.replace( re, function( matched ) {
			return replaces[ matched ];
		} );
	},

	isControlVisible: function( controlModel, elementSettingsModel ) {
		var condition;

		// TODO: Better way to get this?
		if ( _.isFunction( controlModel.get ) ) {
			condition = controlModel.get( 'condition' );
		} else {
			condition = controlModel.condition;
		}

		if ( _.isEmpty( condition ) ) {
			return true;
		}

		var hasFields = _.filter( condition, function( conditionValue, conditionName ) {
			var conditionNameParts = conditionName.match( /([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i ),
				conditionRealName = conditionNameParts[1],
				conditionSubKey = conditionNameParts[2],
				isNegativeCondition = !! conditionNameParts[3],
				controlValue = elementSettingsModel.get( conditionRealName );

			if ( conditionSubKey ) {
				controlValue = controlValue[ conditionSubKey ];
			}

			var isContains = ( _.isArray( conditionValue ) ) ? _.contains( conditionValue, controlValue ) : conditionValue === controlValue;

			return isNegativeCondition ? isContains : ! isContains;
		} );

		return _.isEmpty( hasFields );
	},

	cloneObject: function( object ) {
		return JSON.parse( JSON.stringify( object ) );
	},

	getYoutubeIDFromURL: function( url ) {
		var videoIDParts = url.match( /^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/ );

		return videoIDParts && videoIDParts[1];
	},

	disableElementEvents: function( $element ) {
		$element.each( function() {
			var currentPointerEvents = this.style.pointerEvents;

			if ( 'none' === currentPointerEvents ) {
				return;
			}

			Backbone.$( this )
				.data( 'backup-pointer-events', currentPointerEvents )
				.css( 'pointer-events', 'none' );
		} );
	},

	enableElementEvents: function( $element ) {
		$element.each( function() {
			var $this = Backbone.$( this ),
				backupPointerEvents = $this.data( 'backup-pointer-events' );

			if ( undefined === backupPointerEvents ) {
				return;
			}

			$this
				.removeData( 'backup-pointer-events' )
				.css( 'pointer-events', backupPointerEvents );
		} );
	}
};

module.exports = helpers;

},{}],82:[function(require,module,exports){
var Introduction;

Introduction = function() {
	var modal;

	var initModal = function() {
		modal = elementor.dialogsManager.createWidget( 'elementor-modal', {
			id: 'elementor-introduction'
		} );

		modal.on( 'hide', function() {
			modal.getElements( 'message' ).empty(); // In order to stop the video
		} );
	};

	this.getSettings = function() {
		return elementor.config.introduction;
	};

	this.getModal = function() {
		if ( ! modal ) {
			initModal();
		}

		return modal;
	};

	this.startIntroduction = function() {
		var settings = this.getSettings();

		this.getModal()
		    .setHeaderMessage( settings.title )
		    .setMessage( settings.content )
		    .show();
	};

	this.startOnLoadIntroduction = function() {
		var settings = this.getSettings();

		if ( ! settings.is_user_should_view ) {
			return;
		}

		setTimeout( _.bind( function() {
			this.startIntroduction();
		}, this ), settings.delay );
	};

};

module.exports = new Introduction();

},{}],83:[function(require,module,exports){
/**
 * HTML5 - Drag and Drop
 */
;(function( $ ) {

	var hasFullDataTransferSupport = function( event ) {
		try {
			event.originalEvent.dataTransfer.setData( 'test', 'test' );

			event.originalEvent.dataTransfer.clearData( 'test' );

			return true;
		} catch ( e ) {
			return false;
		}
	};

	var Draggable = function( userSettings ) {
		var self = this,
			settings = {},
			elementsCache = {},
			defaultSettings = {
				element: '',
				groups: null,
				onDragStart: null,
				onDragEnd: null
			};

		var initSettings = function() {
			$.extend( true, settings, defaultSettings, userSettings );
		};

		var initElementsCache = function() {
			elementsCache.$element = $( settings.element );
		};

		var buildElements = function() {
			elementsCache.$element.attr( 'draggable', true );
		};

		var onDragEnd = function( event ) {
			if ( $.isFunction( settings.onDragEnd ) ) {
				settings.onDragEnd.call( elementsCache.$element, event, self );
			}
		};

		var onDragStart = function( event ) {
			var groups = settings.groups || [],
				dataContainer = {
					groups: groups
				};

			if ( hasFullDataTransferSupport( event ) ) {
				event.originalEvent.dataTransfer.setData( JSON.stringify( dataContainer ), true );
			}

			if ( $.isFunction( settings.onDragStart ) ) {
				settings.onDragStart.call( elementsCache.$element, event, self );
			}
		};

		var attachEvents = function() {
			elementsCache.$element
				.on( 'dragstart', onDragStart )
				.on( 'dragend', onDragEnd );
		};

		var init = function() {
			initSettings();

			initElementsCache();

			buildElements();

			attachEvents();
		};

		this.destroy = function() {
			elementsCache.$element.off( 'dragstart', onDragStart );

			elementsCache.$element.removeAttr( 'draggable' );
		};

		init();
	};

	var Droppable = function( userSettings ) {
		var self = this,
			settings = {},
			elementsCache = {},
			defaultSettings = {
				element: '',
				items: '>',
				horizontalSensitivity: '10%',
				axis: [ 'vertical', 'horizontal' ],
				groups: null,
				isDroppingAllowed: null,
				onDragEnter: null,
				onDragging: null,
				onDropping: null,
				onDragLeave: null
			};

		var initSettings = function() {
			$.extend( settings, defaultSettings, userSettings );
		};

		var initElementsCache = function() {
			elementsCache.$element = $( settings.element );
		};

		var hasHorizontalDetection = function() {
			return -1 !== settings.axis.indexOf( 'horizontal' );
		};

		var hasVerticalDetection = function() {
			return -1 !== settings.axis.indexOf( 'vertical' );
		};

		var checkHorizontal = function( offsetX, elementWidth ) {
			var isPercentValue,
				sensitivity;

			if ( ! hasHorizontalDetection() ) {
				return false;
			}

			if ( ! hasVerticalDetection() ) {
				return offsetX > elementWidth / 2 ? 'right' : 'left';
			}

			sensitivity = settings.horizontalSensitivity.match( /\d+/ );

			if ( ! sensitivity ) {
				return false;
			}

			sensitivity = sensitivity[ 0 ];

			isPercentValue = /%$/.test( settings.horizontalSensitivity );

			if ( isPercentValue ) {
				sensitivity = elementWidth / sensitivity;
			}

			if ( offsetX > elementWidth - sensitivity ) {
				return 'right';
			} else if ( offsetX < sensitivity ) {
				return 'left';
			}

			return false;
		};

		var getSide = function( element, event ) {
			var $element,
				thisHeight,
				thisWidth,
				side;

			event = event.originalEvent;

			$element = $( element );
			thisHeight = $element.outerHeight();
			thisWidth = $element.outerWidth();

			if ( side = checkHorizontal( event.offsetX, thisWidth ) ) {
				return side;
			}

			if ( ! hasVerticalDetection() ) {
				return false;
			}

			if ( event.offsetY > thisHeight / 2 ) {
				side = 'bottom';
			} else {
				side = 'top';
			}

			return side;
		};

		var isDroppingAllowed = function( element, side, event ) {
			var dataTransferTypes,
				draggableGroups,
				isGroupMatch,
				isDroppingAllowed;

			if ( settings.groups && hasFullDataTransferSupport( event ) ) {

				dataTransferTypes = event.originalEvent.dataTransfer.types;
				isGroupMatch = false;

				dataTransferTypes = Array.prototype.slice.apply( dataTransferTypes ); // Convert to array, since Firefox hold him as DOMStringList

				dataTransferTypes.forEach( function( type ) {
					try {
						draggableGroups = JSON.parse( type );

						if ( ! draggableGroups.groups.slice ) {
							return;
						}

						settings.groups.forEach( function( groupName ) {

							if ( -1 !== draggableGroups.groups.indexOf( groupName ) ) {
								isGroupMatch = true;
								return false; // stops the forEach from extra loops
							}
						} );
					} catch ( e ) {
					}
				} );

				if ( ! isGroupMatch ) {
					return false;
				}
			}

			if ( $.isFunction( settings.isDroppingAllowed ) ) {

				isDroppingAllowed = settings.isDroppingAllowed.call( element, side, event, self );

				if ( ! isDroppingAllowed ) {
					return false;
				}
			}

			return true;
		};

		var onDragEnter = function( event ) {
			if ( event.target !== this ) {
				return;
			}

			// Avoid internal elements event firing
			$( this ).children().each( function() {
				var currentPointerEvents = this.style.pointerEvents;

				if ( 'none' === currentPointerEvents ) {
					return;
				}

				$( this )
					.data( 'backup-pointer-events', currentPointerEvents )
					.css( 'pointer-events', 'none' );
			} );

			var side = getSide( this, event );

			if ( ! isDroppingAllowed( this, side, event ) ) {
				return;
			}

			if ( $.isFunction( settings.onDragEnter ) ) {
				settings.onDragEnter.call( this, side, event, self );
			}
		};

		var onDragOver = function( event ) {
			var side = getSide( this, event );

			if ( ! isDroppingAllowed( this, side, event ) ) {
				return;
			}

			event.preventDefault();

			if ( $.isFunction( settings.onDragging ) ) {
				settings.onDragging.call( this, side, event, self );
			}
		};

		var onDrop = function( event ) {
			var side = getSide( this, event );

			if ( ! isDroppingAllowed( this, side, event ) ) {
				return;
			}

			event.preventDefault();

			if ( $.isFunction( settings.onDropping ) ) {
				settings.onDropping.call( this, side, event, self );
			}
		};

		var onDragLeave = function( event ) {
			// Avoid internal elements event firing
			$( this ).children().each( function() {
				var $this = $( this ),
					backupPointerEvents = $this.data( 'backup-pointer-events' );

				if ( undefined === backupPointerEvents ) {
					return;
				}

				$this
					.removeData( 'backup-pointer-events' )
					.css( 'pointer-events', backupPointerEvents );
			} );

			if ( $.isFunction( settings.onDragLeave ) ) {
				settings.onDragLeave.call( this, event, self );
			}
		};

		var attachEvents = function() {
			elementsCache.$element
				.on( 'dragenter', settings.items, onDragEnter )
				.on( 'dragover', settings.items, onDragOver )
				.on( 'drop', settings.items, onDrop )
				.on( 'dragleave drop', settings.items, onDragLeave );
		};

		var init = function() {
			initSettings();

			initElementsCache();

			attachEvents();
		};

		this.destroy = function() {
			elementsCache.$element
				.off( 'dragenter', settings.items, onDragEnter )
				.off( 'dragover', settings.items, onDragOver )
				.off( 'drop', settings.items, onDrop )
				.off( 'dragleave drop', settings.items, onDragLeave );
		};

		init();
	};

	var plugins = {
		html5Draggable: Draggable,
		html5Droppable: Droppable
	};

	$.each( plugins, function( pluginName, Plugin ) {
		$.fn[ pluginName ] = function( options ) {
			options = options || {};

			this.each( function() {
				var instance = $.data( this, pluginName ),
					hasInstance = instance instanceof Plugin;

				if ( hasInstance ) {

					if ( 'destroy' === options ) {

						instance.destroy();

						$.removeData( this, pluginName );
					}

					return;
				}

				options.element = this;

				$.data( this, pluginName, new Plugin( options ) );
			} );

			return this;
		};
	} );
})( jQuery );

},{}],84:[function(require,module,exports){
/*!
 * jQuery Serialize Object v1.0.1
 */
(function( $ ) {
	$.fn.elementorSerializeObject = function() {
		var serializedArray = this.serializeArray(),
			data = {};

		var parseObject = function( dataContainer, key, value ) {
			var isArrayKey = /^[^\[\]]+\[]/.test( key ),
				isObjectKey = /^[^\[\]]+\[[^\[\]]+]/.test( key ),
				keyName = key.replace( /\[.*/, '' );

			if ( isArrayKey ) {
				if ( ! dataContainer[ keyName ] ) {
					dataContainer[ keyName ] = [];
				}
			} else {
				if ( ! isObjectKey ) {
					if ( dataContainer.push ) {
						dataContainer.push( value );
					} else {
						dataContainer[ keyName ] = value;
					}

					return;
				}

				if ( ! dataContainer[ keyName ] ) {
					dataContainer[ keyName ] = {};
				}
			}

			var nextKeys = key.match( /\[[^\[\]]*]/g );

			nextKeys[ 0 ] = nextKeys[ 0 ].replace( /\[|]/g, '' );

			return parseObject( dataContainer[ keyName ], nextKeys.join( '' ), value );
		};

		$.each( serializedArray, function() {
			parseObject( data, this.name, this.value );
		} );
		return data;
	};
})( jQuery );

},{}],85:[function(require,module,exports){
var Modals;

Modals = {
	init: function() {
		this.initModalWidgetType();
	},

	initModalWidgetType: function() {
		var modalProperties = {
			getDefaultSettings: function() {
				var settings = DialogsManager.getWidgetType( 'options' ).prototype.getDefaultSettings.apply( this, arguments );

				return _.extend( settings, {
					position: {
						my: 'center',
						at: 'center'
					},
					contentWidth: 'auto',
					contentHeight: 'auto',
					closeButton: true
				} );
			},
			buildWidget: function() {
				DialogsManager.getWidgetType( 'options' ).prototype.buildWidget.apply( this, arguments );

				if ( ! this.getSettings( 'closeButton' ) ) {
					return;
				}

				var $closeButton = this.addElement( 'closeButton', '<div><i class="fa fa-times"></i></div>' );

				this.getElements( 'widgetContent' ).prepend( $closeButton );
			},
			attachEvents: function() {
				if ( this.getSettings( 'closeButton' ) ) {
					this.getElements( 'closeButton' ).on( 'click', this.hide );
				}
			},
			onReady: function() {
				DialogsManager.getWidgetType( 'options' ).prototype.onReady.apply( this, arguments );

				var elements = this.getElements(),
					settings = this.getSettings();

				if ( 'auto' !== settings.contentWidth ) {
					elements.message.width( settings.contentWidth );
				}

				if ( 'auto' !== settings.contentHeight ) {
					elements.message.height( settings.contentHeight );
				}
			}
		};

		DialogsManager.addWidgetType( 'elementor-modal', DialogsManager.getWidgetType( 'options' ).extend( 'elementor-modal', modalProperties ) );
	}
};

module.exports = Modals;

},{}],86:[function(require,module,exports){
var presetsFactory;

presetsFactory = {

	getPresetsDictionary: function() {
		return {
			11: 100 / 9,
			12: 100 / 8,
			14: 100 / 7,
			16: 100 / 6,
			33: 100 / 3,
			66: 2 / 3 * 100,
			83: 5 / 6 * 100
		};
	},

	getAbsolutePresetValues: function( preset ) {
		var clonedPreset = elementor.helpers.cloneObject( preset ),
			presetDictionary = this.getPresetsDictionary();

		_.each( clonedPreset, function( unitValue, unitIndex ) {
			if ( presetDictionary[ unitValue ] ) {
				clonedPreset[ unitIndex ] = presetDictionary[ unitValue ];
			}
		} );

		return clonedPreset;
	},

	getPresets: function( columnsCount, presetIndex ) {
		var presets = elementor.helpers.cloneObject( elementor.config.elements.section.presets );

		if ( columnsCount ) {
			presets = presets[ columnsCount ];
		}

		if ( presetIndex ) {
			presets = presets[ presetIndex ];
		}

		return presets;
	},

	getPresetByStructure: function( structure ) {
		var parsedStructure = this.getParsedStructure( structure );

		return this.getPresets( parsedStructure.columnsCount, parsedStructure.presetIndex );
	},

	getParsedStructure: function( structure ) {
		structure += ''; // Make sure this is a string

		return {
			columnsCount: structure.slice( 0, -1 ),
			presetIndex: structure.substr( -1 )
		};
	},

	getPresetSVG: function( preset, svgWidth, svgHeight, separatorWidth ) {
		svgWidth = svgWidth || 100;
		svgHeight = svgHeight || 50;
		separatorWidth = separatorWidth || 2;

		var absolutePresetValues = this.getAbsolutePresetValues( preset ),
			presetSVGPath = this._generatePresetSVGPath( absolutePresetValues, svgWidth, svgHeight, separatorWidth );

		return this._createSVGPreset( presetSVGPath, svgWidth, svgHeight );
	},

	_createSVGPreset: function( presetPath, svgWidth, svgHeight ) {
		var svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );

		svg.setAttributeNS( 'http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink' );
		svg.setAttribute( 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight );

		var path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );

		path.setAttribute( 'd', presetPath );

		svg.appendChild( path );

		return svg;
	},

	_generatePresetSVGPath: function( preset, svgWidth, svgHeight, separatorWidth ) {
		var DRAW_SIZE = svgWidth - separatorWidth * ( preset.length - 1 );

		var xPointer = 0,
			dOutput = '';

		for ( var i = 0; i < preset.length; i++ ) {
			if ( i ) {
				dOutput += ' ';
			}

			var increment = preset[ i ] / 100 * DRAW_SIZE;

			xPointer += increment;

			dOutput += 'M' + ( +xPointer.toFixed( 4 ) ) + ',0';

			dOutput += 'V' + svgHeight;

			dOutput += 'H' + ( +( xPointer - increment ).toFixed( 4 ) );

			dOutput += 'V0Z';

			xPointer += separatorWidth;
		}

		return dOutput;
	}
};

module.exports = presetsFactory;

},{}],87:[function(require,module,exports){
var Schemes;

Schemes = function() {
	var self = this,
		styleRules = {},
		schemes = {},
		settings = {
			selectorWrapperPrefix: '.elementor-widget-'
		},
		elements = {};

	var buildUI = function() {
		elements.$previewHead.append( elements.$style );
	};

	var initElements = function() {
		elements.$style = Backbone.$( '<style>', {
			id: 'elementor-style-scheme'
		});

		elements.$previewHead = elementor.$previewContents.find( 'head' );
	};

	var initSchemes = function() {
		schemes = elementor.helpers.cloneObject( elementor.config.schemes.items );
	};

	var addStyleRule = function( selector, property ) {
		if ( ! styleRules[ selector ] ) {
			styleRules[ selector ] = [];
		}

		styleRules[ selector ].push( property );
	};

	var fetchControlStyles = function( control, widgetType ) {
		_.each( control.selectors, function( cssProperty, selector ) {
			var currentSchemeValue = self.getSchemeValue( control.scheme.type, control.scheme.value, control.scheme.key ),
				outputSelector,
				outputCssProperty;

			if ( _.isEmpty( currentSchemeValue.value ) ) {
				return;
			}

			outputSelector = selector.replace( /\{\{WRAPPER\}\}/g, settings.selectorWrapperPrefix + widgetType );
			outputCssProperty = elementor.getControlItemView().replaceStyleValues( cssProperty, currentSchemeValue.value );

			addStyleRule( outputSelector, outputCssProperty );
		} );
	};

	var fetchWidgetControlsStyles = function( widget, widgetType ) {
		var widgetSchemeControls = self.getWidgetSchemeControls( widget );

		_.each( widgetSchemeControls, function( control ) {
			fetchControlStyles( control, widgetType );
		} );
	};

	var fetchAllWidgetsSchemesStyle = function() {
		_.each( elementor.config.widgets, function( widget, widgetType ) {
			fetchWidgetControlsStyles(  widget, widgetType  );
		} );
	};

	var parseSchemeStyle = function() {
		var stringOutput = '';

		_.each( styleRules, function( properties, selector ) {
			stringOutput += selector + '{' + properties.join( '' ) + '}';
		} );

		return stringOutput;
	};

	var resetStyleRules = function() {
		styleRules = {};
	};

	this.init = function() {
		initElements();
		buildUI();
		initSchemes();

		return self;
	};

	this.getWidgetSchemeControls = function( widget ) {
		return _.filter( widget.controls, function( control ) {
			return _.isObject( control.scheme );
		} );
	};

	this.getSchemes = function() {
		return schemes;
	};

	this.getEnabledSchemesTypes = function() {
		return elementor.config.schemes.enabled_schemes;
	};

	this.getScheme = function( schemeType ) {
		return schemes[ schemeType ];
	};

	this.getSchemeValue = function( schemeType, value, key ) {
		if ( this.getEnabledSchemesTypes().indexOf( schemeType ) < 0 ) {
			return false;
		}

		var scheme = self.getScheme( schemeType ),
			schemeValue = scheme.items[ value ];

		if ( key && _.isObject( schemeValue ) ) {
			var clonedSchemeValue = elementor.helpers.cloneObject( schemeValue );

			clonedSchemeValue.value = schemeValue.value[ key ];

			return clonedSchemeValue;
		}

		return schemeValue;
	};

	this.printSchemesStyle = function() {
		resetStyleRules();
		fetchAllWidgetsSchemesStyle();

		elements.$style.text( parseSchemeStyle() );
	};

	this.resetSchemes = function( schemeName ) {
		schemes[ schemeName ] = elementor.helpers.cloneObject( elementor.config.schemes.items[ schemeName ] );

		this.onSchemeChange();
	};

	this.saveScheme = function( schemeName ) {
		elementor.config.schemes.items[ schemeName ].items = elementor.helpers.cloneObject( schemes[ schemeName ].items );

		NProgress.start();

		elementor.ajax.send( 'apply_scheme', {
			data: {
				scheme_name: schemeName,
				data: JSON.stringify( schemes[ schemeName ].items )
			},
			success: function() {
				NProgress.done();
			}
		} );
	};

	this.setSchemeValue = function( schemeName, itemKey, value ) {
		schemes[ schemeName ].items[ itemKey ].value = value;

		this.onSchemeChange();
	};

	this.onSchemeChange = function() {
		this.printSchemesStyle();
	};
};

module.exports = new Schemes();

},{}],88:[function(require,module,exports){
( function( $ ) {

	var Stylesheet = function() {
		var self = this,
			rules = {},
			devices = {};

		var getDeviceMaxValue = function( deviceName ) {
			var deviceNames = Object.keys( devices ),
				deviceNameIndex = deviceNames.indexOf( deviceName ),
				nextIndex = deviceNameIndex + 1;

			if ( nextIndex >= deviceNames.length ) {
				throw new RangeError( 'Max value for this device is out of range.' );
			}

			return devices[ deviceNames[ nextIndex ] ] - 1;
		};

		var queryToHash = function( query ) {
			var hash = [];

			$.each( query, function( endPoint ) {
				hash.push( endPoint + '_' + this );
			} );

			return hash.join( '-' );
		};

		var hashToQuery = function( hash ) {
			var query = {};

			hash = hash.split( '-' ).filter( String );

			hash.forEach( function( singleQuery ) {
				var queryParts = singleQuery.split( '_' ),
					endPoint = queryParts[0],
					deviceName = queryParts[1];

				query[ endPoint ] = 'max' === endPoint ? getDeviceMaxValue( deviceName ) : devices[ deviceName ];
			} );

			return query;
		};

		var addQueryHash = function( queryHash ) {
			rules[ queryHash ] = {};

			var hashes = Object.keys( rules );

			if ( hashes.length < 2 ) {
				return;
			}

			// Sort the devices from narrowest to widest
			hashes.sort( function( a, b ) {
				if ( 'all' === a ) {
					return -1;
				}

				if ( 'all' === b ) {
					return 1;
				}

				var aQuery = hashToQuery( a ),
					bQuery = hashToQuery( b );

				return bQuery.max - aQuery.max;
			} );

			var sortedRules = {};

			hashes.forEach( function( deviceName ) {
				sortedRules[ deviceName ] = rules[ deviceName ];
			} );

			rules = sortedRules;
		};

		this.addDevice = function( deviceName, deviceValue ) {
			devices[ deviceName ] = deviceValue;

			var deviceNames = Object.keys( devices );

			if ( deviceNames.length < 2 ) {
				return self;
			}

			// Sort the devices from narrowest to widest
			deviceNames.sort( function( a, b ) {
				return devices[ a ] - devices[ b ];
			} );

			var sortedDevices = {};

			deviceNames.forEach( function( deviceName ) {
				sortedDevices[ deviceName ] = devices[ deviceName ];
			} );

			devices = sortedDevices;

			return self;
		};

		var getQueryHashStyleFormat = function( queryHash ) {
			var query = hashToQuery( queryHash ),
				styleFormat = [];

			$.each( query, function( endPoint ) {
				styleFormat.push( '(' + endPoint + '-width:' + this + 'px)' );
			} );

			return '@media' + styleFormat.join( ' and ' );
		};

		this.addRules = function( selector, styleRules, query ) {
			var queryHash = 'all';

			if ( query ) {
				queryHash = queryToHash( query );
			}

			if ( ! rules[ queryHash ] ) {
				addQueryHash( queryHash );
			}

			if ( ! rules[ queryHash ][ selector ] ) {
				rules[ queryHash ][ selector ] = {};
			}

			if ( 'string' === typeof styleRules ) {
				styleRules = styleRules.split( ';' ).filter( String );

				var orderedRules = {};

				try {
					$.each( styleRules, function() {
						var property = this.split( /:(.*)?/ );
						orderedRules[ property[ 0 ].trim() ] = property[ 1 ].trim().replace( ';', '' );
					} );
				} catch ( error ) { // At least one of the properties is incorrect
					return;
				}

				styleRules = orderedRules;
			}

			$.extend( rules[ queryHash ][ selector ], styleRules );

			return self;
		};

		this.empty = function() {
			rules = {};
		};

		this.toString = function() {
			var styleText = '';

			$.each( rules, function( queryHash ) {
				var deviceText = Stylesheet.parseRules( this );

				if ( 'all' !== queryHash ) {
					deviceText = getQueryHashStyleFormat( queryHash ) + '{' + deviceText + '}';
				}

				styleText += deviceText;
			} );

			return styleText;
		};
	};

	Stylesheet.parseRules = function( rules ) {
		var parsedRules = '';

		$.each( rules, function( selector ) {
			var selectorContent = Stylesheet.parseProperties( this );

			if ( selectorContent ) {
				parsedRules += selector + '{' + selectorContent + '}';
			}
		} );

		return parsedRules;
	};

	Stylesheet.parseProperties = function( properties ) {
		var parsedProperties = '';

		$.each( properties, function( propertyKey ) {
			if ( this ) {
				parsedProperties += propertyKey + ':' + this + ';';
			}
		} );

		return parsedProperties;
	};

	module.exports = Stylesheet;
} )( jQuery );

},{}],89:[function(require,module,exports){
var BaseSettingsModel = require( 'elementor-models/base-settings' ),
	Stylesheet = require( 'elementor-utils/stylesheet' ),
	BaseElementView;

BaseElementView = Marionette.CompositeView.extend( {
	tagName: 'div',

	id: function() {
		return this.getElementUniqueClass();
	},

	attributes: function() {
		var type = this.model.get( 'elType' );

		if ( 'widget'  === type ) {
			type = this.model.get( 'widgetType' );
		}
		return {
			'data-element_type': type
		};
	},

	baseEvents: {},

	elementEvents: {},

	stylesheet: null,
	$stylesheetElement: null,

	getElementType: function() {
		return this.model.get( 'elType' );
	},

	getChildType: function() {
		return elementor.helpers.getElementChildType( this.getElementType() );
	},

	templateHelpers: function() {
		return {
			elementModel: this.model
		};
	},

	events: function() {
		return _.extend( {}, this.baseEvents, this.elementEvents );
	},

	getTemplateType: function() {
		return 'js';
	},

	initialize: function() {
		// grab the child collection from the parent model
		// so that we can render the collection as children
		// of this parent element
		this.collection = this.model.get( 'elements' );

		if ( this.collection ) {
			this.listenTo( this.collection, 'add remove reset', this.onCollectionChanged, this );
		}

		this.listenTo( this.model.get( 'settings' ), 'change', this.onSettingsChanged, this );
		this.listenTo( this.model.get( 'editSettings' ), 'change', this.onSettingsChanged, this );

		this.on( 'render', function() {
			this.renderUI();
			this.runReadyTrigger();
		} );

		this.initRemoveDialog();

		this.initStylesheet();
	},

	addChildModel: function( model, options ) {
		return this.collection.add( model, options, true );
	},

	isCollectionFilled: function() {
		return false;
	},

	isInner: function() {
		return !! this.model.get( 'isInner' );
	},

	initRemoveDialog: function() {
		var removeDialog;

		this.getRemoveDialog = function() {
			if ( ! removeDialog ) {
				var elementTitle = this.model.getTitle();

				removeDialog = elementor.dialogsManager.createWidget( 'confirm', {
					message: elementor.translate( 'dialog_confirm_delete', [ elementTitle.toLowerCase() ] ),
					headerMessage: elementor.translate( 'delete_element', [ elementTitle ] ),
					strings: {
						confirm: elementor.translate( 'delete' ),
						cancel: elementor.translate( 'cancel' )
					},
					defaultOption: 'confirm',
					onConfirm: _.bind( function() {
						this.model.destroy();
					}, this )
				} );
			}

			return removeDialog;
		};
	},

	initStylesheet: function() {
		this.stylesheet = new Stylesheet();

		var viewportBreakpoints = elementor.config.viewportBreakpoints;

		this.stylesheet
			.addDevice( 'mobile', 0 )
			.addDevice( 'tablet', viewportBreakpoints.md )
			.addDevice( 'desktop', viewportBreakpoints.lg );
	},

	enqueueFonts: function() {
		_.each( this.model.get( 'settings' ).getFontControls(), _.bind( function( control ) {
			var fontFamilyName = this.model.getSetting( control.name );
			if ( _.isEmpty( fontFamilyName ) ) {
				return;
			}

			var isVisible = elementor.helpers.isControlVisible( control, this.model.get( 'settings' ) );
			if ( ! isVisible ) {
				return;
			}

			elementor.helpers.enqueueFont( fontFamilyName );
		}, this ) );
	},

	renderStyles: function() {
		var self = this,
			settings = self.model.get( 'settings' );

		self.stylesheet.empty();

		self.addStyleRules( settings.getStyleControls(), settings.attributes );


		/*
		 _.each( settings.getStyleControls(), function( control ) {
		 var controlValue = self.model.getSetting( control.name );

		 if ( ! _.isNumber( controlValue ) && _.isEmpty( controlValue ) ) {
		 return;
		 }

		 var isVisible = elementor.helpers.isControlVisible( control, self.model.get( 'settings' ) );
		 if ( ! isVisible ) {
		 return;
		 }

		 _.each( control.selectors, function( cssProperty, selector ) {
		 var outputSelector = selector.replace( /\{\{WRAPPER}}/g, '#' + self.getElementUniqueClass() ),
		 outputCssProperty = elementor.getControlItemView( control.type ).replaceStyleValues( cssProperty, controlValue ),
		 query;

		 if ( _.isEmpty( outputCssProperty ) ) {
		 return;
		 }

		 if ( control.responsive && 'desktop' !== control.responsive ) {
		 query = { max: control.responsive };
		 }

		 self.stylesheet.addRules( outputSelector, outputCssProperty, query );
		 } );
		 } );
		 */




		if ( 'column' === self.model.get( 'elType' ) ) {
			var inlineSize = self.model.getSetting( '_inline_size' );

			if ( ! _.isEmpty( inlineSize ) ) {
				self.stylesheet.addRules( '#' + self.getElementUniqueClass(), { width: inlineSize + '%' }, { min: 'tablet' } );
			}
		}

		self.addStyleToDocument();

		// Render custom CSS
		self.renderCustomCSS();
	},

	renderCustomCSS: function() {
		var customCSS = this.model.getSetting( '_custom_css' ),
			styleId = 'elementor-style-' + this.model.get( 'id' ) + '-custom';

		var $existing = elementor.$previewContents.find( '#' + styleId );

		// Same view — update in place
		if ( $existing.length && this.$customCSSElement && $existing[0] === this.$customCSSElement[0] ) {
			if ( _.isEmpty( customCSS ) ) {
				this.$customCSSElement.remove();
				this.$customCSSElement = null;
			} else {
				var selector = '.elementor-element.elementor-element-' + this.model.get( 'id' );
				this.$customCSSElement.text( customCSS.replace( /selector/g, selector ) );
			}
			return;
		}

		// Different view owns the element — invalidate its reference
		if ( $existing.length ) {
			$existing.remove();
		}

		this.$customCSSElement = null;

		if ( _.isEmpty( customCSS ) ) {
			return;
		}

		var selector = '.elementor-element.elementor-element-' + this.model.get( 'id' );
		customCSS = customCSS.replace( /selector/g, selector );

		this.$customCSSElement = Backbone.$( '<style>', { id: styleId } );
		elementor.$previewContents.find( 'head' ).append( this.$customCSSElement );
		this.$customCSSElement.text( customCSS );
	},

	addStyleRules: function( controls, values, placeholders, replacements ) {
		var self = this;

		placeholders = placeholders || [ /\{\{WRAPPER}}/g ];

		replacements = replacements || [ '#' + self.getElementUniqueClass() ];

		_.each( controls, function( control ) {

			if ( control.styleFields ) {
				placeholders[1] = '{{CURRENT_ITEM}}';

				values[ control.name ].each( function( itemModel ) {
					replacements[1] = '.elementor-repeater-item-' + itemModel.get( '_id' );

					self.addStyleRules( control.styleFields, itemModel.attributes, placeholders, replacements );
				} );
			}

			//self.addControlStyleRules( control, values, self.model.get( 'settings' ), placeholders, replacements );
			self.addControlStyleRules( control, values, self.model.get( 'settings' ).controls, placeholders, replacements );
		} );
	},

	addControlStyleRules: function( control, values, controlsStack, placeholders, replacements ) {
		var self = this;

		BaseElementView.addControlStyleRules( self.stylesheet, control, controlsStack, function( control ) {
			return self.getStyleControlValue( control, values );
		}, placeholders, replacements );
	},

	getStyleControlValue: function( control, values ) {
		var value = values[ control.name ];

		if ( control.selectors_dictionary ) {
			value = control.selectors_dictionary[ value ] || value;
		}

		if ( ! _.isNumber( value ) && _.isEmpty( value ) ) {
			return;
		}

		var isVisible = elementor.helpers.isControlVisible( control, this.model.get( 'settings' ) );
		if ( ! isVisible ) {
			return;
		}

		return value;
	},



	/*

	addControlStyleRules: function( control, values, controlsStack, placeholders, replacements ) {
		var self = this,
			value = values[ control.name ];

		if ( ! _.isNumber( value ) && _.isEmpty( value ) ) {
			return;
		}

		var isVisible = elementor.helpers.isControlVisible( control, this.model.get( 'settings' ) );
		if ( ! isVisible ) {
			return;
		}
		_.each( control.selectors, function( cssProperty, selector ) {

			var outputCssProperty,
				parsedValue = '',
				parserControl,
				valueToInsert = value,
				query;


			try {
				outputCssProperty = cssProperty.replace( /\{\{(?:([^.}]+)\.)?([^}]*)}}/g, function( originalPhrase, controlName, placeholder ) {

					if ( controlName ) {
						parserControl = _.findWhere( controlsStack, { name: controlName } );

						valueToInsert = values( parserControl );

						console.log(controlName);
						console.log(originalPhrase);
						console.log(placeholder);
						console.log(valueToInsert);
					}

					parsedValue = elementor.getControlItemView( control.type ).getStyleValue( placeholder.toLowerCase(), valueToInsert );


					if ( '' === parsedValue ) {
						throw '';
					}

					return parsedValue;
				} );
			} catch ( e ) {
				console.log(e);
				return;
			}

			//console.log(outputCssProperty);


		var outputCssProperty = elementor.getControlItemView( control.type ).replaceStyleValues( cssProperty, value );
			//console.log(outputCssProperty);


			if ( _.isEmpty( outputCssProperty ) ) {
				return;
			}

			_.each( placeholders, function( placeholder, index ) {
				selector = selector.replace( placeholder, replacements[ index ] );
			} );

			if ( control.responsive && 'desktop' !== control.responsive ) {
				query = { max: control.responsive };
			}

			self.stylesheet.addRules( selector, outputCssProperty, query );
		} );
	},

	*/

	addStyleToDocument: function() {
		var styleText = this.stylesheet.toString(),
			styleId = 'elementor-style-' + this.model.get( 'id' );

		var $existing = elementor.$previewContents.find( '#' + styleId );

		// Same view updating its own styles — update text in place
		if ( $existing.length && this.$stylesheetElement && $existing[0] === this.$stylesheetElement[0] ) {
			if ( _.isEmpty( styleText ) ) {
				this.$stylesheetElement.remove();
				this.$stylesheetElement = null;
			} else {
				this.$stylesheetElement.text( styleText );
			}
			return;
		}

		// Different view owns the <style> (drag-and-drop) — remove it so
		// the old view's cached reference becomes stale and its
		// onBeforeDestroy .remove() will be a no-op.
		if ( $existing.length ) {
			$existing.remove();
		}

		this.$stylesheetElement = null;

		if ( _.isEmpty( styleText ) ) {
			return;
		}

		this.$stylesheetElement = Backbone.$( '<style>', { id: styleId } );
		elementor.$previewContents.find( 'head' ).append( this.$stylesheetElement );
		this.$stylesheetElement.text( styleText );
	},

	renderCustomClasses: function() {
		// Add base class and unique element class (same as ID for CSS selector compatibility)
		this.$el.addClass( 'elementor-element' );
		this.$el.addClass( this.getElementUniqueClass() );

		var settings = this.model.get( 'settings' );

		_.each( settings.attributes, _.bind( function( value, attribute ) {
			if ( settings.isClassControl( attribute ) ) {
				var currentControl = settings.getControl( attribute );

				this.$el.removeClass( currentControl.prefix_class + settings.previous( attribute ) );

				var isVisible = elementor.helpers.isControlVisible( currentControl, this.model.get( 'settings' ) );

				if ( isVisible && ! _.isEmpty( settings.get( attribute ) ) ) {
					this.$el.addClass( currentControl.prefix_class + settings.get( attribute ) );
					this.$el.addClass( _.result( this, 'className' ) );
				}
			}
		}, this ) );
	},

	renderUI: function() {
		this.renderStyles();
		this.renderCustomClasses();
		this.renderCustomAttributes();
		this.enqueueFonts();
	},

	// Attributes blacklist (same as PHP)
	_attributesBlacklist: [
		'id', 'class', 'data-id', 'data-settings', 'data-element_type',
		'data-widget_type', 'data-model-cid'
	],

	// Store previous custom attributes to remove them on change
	_previousCustomAttributes: [],

	renderCustomAttributes: function() {
		var self = this,
			customAttributes = this.model.getSetting( '_custom_attributes' );

		// Remove previous custom attributes
		_.each( this._previousCustomAttributes, function( attrName ) {
			self.$el.removeAttr( attrName );
		});
		this._previousCustomAttributes = [];

		if ( _.isEmpty( customAttributes ) ) {
			return;
		}

		// Parse attributes (format: key|value per line)
		var lines = customAttributes.split( '\n' );

		_.each( lines, function( line ) {
			line = line.trim();
			if ( _.isEmpty( line ) ) {
				return;
			}

			var parts = line.split( '|' ),
				attrKey = parts[0].trim().toLowerCase(),
				attrValue = parts[1] ? parts[1].trim() : '';

			// Validate attribute name (only valid characters)
			if ( ! /^[a-z][-_a-z0-9]*$/.test( attrKey ) ) {
				var match = attrKey.match( /[-_a-z0-9]+/ );
				if ( ! match ) {
					return;
				}
				attrKey = match[0];
			}

			// Block dangerous attributes (on* events, href)
			if ( attrKey === 'href' || attrKey.indexOf( 'on' ) === 0 ) {
				return;
			}

			// Block blacklisted attributes
			if ( _.contains( self._attributesBlacklist, attrKey ) ) {
				return;
			}

			// Apply attribute
			self.$el.attr( attrKey, attrValue );
			self._previousCustomAttributes.push( attrKey );
		});
	},

	runReadyTrigger: function() {
		_.defer( _.bind( function() {
			elementorFrontend.elementsHandler.runReadyTrigger( this.$el );
		}, this ) );
	},

	getElementUniqueClass: function() {
		return 'elementor-element-' + this.model.get( 'id' );
	},

	onCollectionChanged: function() {
		elementor.setFlagEditorChange( true );
	},

	onSettingsChanged: function( settings ) {
		if ( this.model.get( 'editSettings' ) !== settings ) {
			// Change flag only if server settings was changed
			elementor.setFlagEditorChange( true );
		}

		// Make sure is correct model
		if ( settings instanceof BaseSettingsModel ) {
			var isContentChanged = false;

			_.each( settings.changedAttributes(), function( settingValue, settingKey ) {
				var control = settings.getControl( settingKey );

				if ( ! control ) {
					return;
				}

				if ( control.force_render || ! settings.isStyleControl( settingKey ) && ! settings.isClassControl( settingKey ) ) {
					isContentChanged = true;
				}
			} );

			if ( ! isContentChanged ) {
				this.renderUI();
				return;
			}
		}

		// Re-render the template
		var templateType = this.getTemplateType();

		if ( 'js' === templateType ) {
			this.model.setHtmlCache();
			this.render();
			this.model.renderOnLeave = true;
		} else {
			this.model.renderRemoteServer();
		}
	},

	onClickRemove: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.getRemoveDialog().show();
	},

	onBeforeDestroy: function() {
		// Remove element stylesheet from the DOM
		if ( this.$stylesheetElement ) {
			this.$stylesheetElement.remove();
			this.$stylesheetElement = null;
		}

		// Remove custom CSS style from the DOM
		if ( this.$customCSSElement ) {
			this.$customCSSElement.remove();
			this.$customCSSElement = null;
		}
	}
}, {
	addControlStyleRules: function( stylesheet, control, controlsStack, valueCallback, placeholders, replacements ) {
		var value = valueCallback( control );

		if ( undefined === value ) {
			return;
		}

		_.each( control.selectors, function( cssProperty, selector ) {

			var outputCssProperty,
				query;

			try {
				outputCssProperty = cssProperty.replace( /\{\{(?:([^.}]+)\.)?([^}]*)}}/g, function( originalPhrase, controlName, placeholder ) {
                    var parserControl = control,
                        valueToInsert = value;

                    if ( controlName ) {
                        parserControl = _.findWhere( controlsStack, { name: controlName } );

                        valueToInsert = valueCallback( parserControl );
                    }

                    var parsedValue = elementor.getControlItemView( parserControl.type ).getStyleValue( placeholder.toLowerCase(), valueToInsert );

                    // Skip if value is empty, undefined or null
                    if ( '' === parsedValue || undefined === parsedValue || null === parsedValue ) {
                        throw '';
                    }

					if ('__EMPTY__' === parsedValue) {
						parsedValue = '';
					}

                    return parsedValue;
				} );
			} catch ( e ) {
				return;
			}

			if ( _.isEmpty( outputCssProperty ) ) {
				return;
			}

            _.each( placeholders, function( placeholder, index ) {
                var placeholderPattern = new RegExp( placeholder, 'g' );

                selector = selector.replace( placeholderPattern, replacements[ index ] );
            } );

			if ( control.responsive && 'desktop' !== control.responsive ) {
				query = { max: control.responsive };
			}

			stylesheet.addRules( selector, outputCssProperty, query );
		} );
	}
} );

module.exports = BaseElementView;
},{"elementor-models/base-settings":72,"elementor-utils/stylesheet":88}],90:[function(require,module,exports){
var BaseElementView = require( 'elementor-views/base-element' ),
	ElementEmptyView = require( 'elementor-views/element-empty' ),
	WidgetView = require( 'elementor-views/widget' ),
	ColumnView;

ColumnView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-element-column-content' ),

	elementEvents: {
		'click > .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-remove': 'onClickRemove',
		'click @ui.listTriggers': 'onClickTrigger'
	},

	getChildView: function( model ) {
		if ( 'section' === model.get( 'elType' ) ) {
			return require( 'elementor-views/section' ); // We need to require the section dynamically
		}

		return WidgetView;
	},

	emptyView: ElementEmptyView,

	className: function() {
		var classes = 'elementor-column',
			type = this.isInner() ? 'inner' : 'top';

		classes += ' elementor-' + type + '-column';

		return classes;
	},

	childViewContainer: '> .elementor-column-wrap > .elementor-widget-wrap',

	triggers: {
		'click > .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-add': 'click:new',
		'click > .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-edit': 'click:edit',
		'click > .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-trigger': 'click:edit',
		'click > .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-duplicate': 'click:duplicate'
	},

	ui: {
		columnTitle: '.column-title',
		columnInner: '> .elementor-column-wrap',
		listTriggers: '> .elementor-element-overlay .elementor-editor-element-trigger'
	},

	behaviors: {
		Sortable: {
			behaviorClass: require( 'elementor-behaviors/sortable' ),
			elChildType: 'widget'
		},
		Resizable: {
			behaviorClass: require( 'elementor-behaviors/resizable' )
		},
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

		this.listenTo( elementor.channels.data, 'widget:drag:start', this.onWidgetDragStart );
		this.listenTo( elementor.channels.data, 'widget:drag:end', this.onWidgetDragEnd );
	},

	isDroppingAllowed: function( side, event ) {
		var elementView = elementor.channels.panelElements.request( 'element:selected' ),
			elType = elementView.model.get( 'elType' );

		if ( 'section' === elType ) {
			return ! this.isInner();
		}

		return 'widget' === elType;
	},

	changeSizeUI: function() {
		var columnSize = this.model.getSetting( '_column_size' ),
			inlineSize = this.model.getSetting( '_inline_size' ),
			columnSizeTitle = parseFloat( inlineSize || columnSize ).toFixed( 1 ) + '%';

		this.$el.attr( 'data-col', columnSize );

		this.ui.columnTitle.html( columnSizeTitle );
	},

	getSortableOptions: function() {
		return {
			connectWith: '.elementor-widget-wrap',
			items: '> .elementor-element'
		};
	},

	// Events
	onCollectionChanged: function() {
		BaseElementView.prototype.onCollectionChanged.apply( this, arguments );

		this.changeChildContainerClasses();
	},

	changeChildContainerClasses: function() {
		var emptyClass = 'elementor-element-empty',
			populatedClass = 'elementor-element-populated';

		if ( !this.collection || this.collection.isEmpty() ) {
			this.ui.columnInner.removeClass( populatedClass ).addClass( emptyClass );
		} else {
			this.ui.columnInner.removeClass( emptyClass ).addClass( populatedClass );
		}
	},

	onRender: function() {
		var self = this;

		self.changeChildContainerClasses();
		self.changeSizeUI();

		self.$el.html5Droppable( {
			items: ' > .elementor-column-wrap > .elementor-widget-wrap > .elementor-element, >.elementor-column-wrap > .elementor-widget-wrap > .elementor-empty-view > .elementor-first-add',
			axis: [ 'vertical' ],
			groups: [ 'elementor-element' ],
			isDroppingAllowed: _.bind( self.isDroppingAllowed, self ),
			onDragEnter: function() {
				self.$el.addClass( 'elementor-dragging-on-child' );
			},
			onDragging: function( side, event ) {
				event.stopPropagation();

				if ( this.dataset.side !== side ) {
					Backbone.$( this ).attr( 'data-side', side );
				}
			},
			onDragLeave: function() {
				self.$el.removeClass( 'elementor-dragging-on-child' );

				Backbone.$( this ).removeAttr( 'data-side' );
			},
			onDropping: function( side, event ) {
				event.stopPropagation();

				var elementView = elementor.channels.panelElements.request( 'element:selected' ),
					newIndex = Backbone.$( this ).index();

				if ( 'bottom' === side ) {
					newIndex++;
				}

				var itemData = {
					id: elementor.helpers.getUniqueID(),
					elType: elementView.model.get( 'elType' )
				};

				if ( 'widget' === itemData.elType ) {
					itemData.widgetType = elementView.model.get( 'widgetType' );
				} else if ( 'section' === itemData.elType ) {
					itemData.elements = [];
					itemData.isInner = true;
				} else {
					return;
				}

				self.triggerMethod( 'request:add', itemData, { at: newIndex } );
			}
		} );
	},

	onClickTrigger: function( event ) {
		event.preventDefault();

		var $trigger = this.$( event.currentTarget ),
			isTriggerActive = $trigger.hasClass( 'elementor-active' );

		this.ui.listTriggers.removeClass( 'elementor-active' );

		if ( ! isTriggerActive ) {
			$trigger.addClass( 'elementor-active' );
		}
	},

	onWidgetDragStart: function() {
		this.$el.addClass( 'elementor-dragging' );
	},

	onWidgetDragEnd: function() {
		this.$el.removeClass( 'elementor-dragging' );
	},

	getContextMenuGroups() {
		const groups = [];

		const $settings = this.$el.find(
			'> .elementor-element-overlay .elementor-editor-element-settings'
		);

		if ($settings.length) {
			const actions = [];

			actions.push({
				name: 'edit',
				title: (elementor.translate ? elementor.translate('Edit Column') : 'Edit Column'),
				icon: '<i class="eicon-edit"></i>',
				callback: () => {
					this.triggerMethod('click:edit');
				},
			});

			const $duplicate = $settings.find('.elementor-editor-element-duplicate');
			const $remove = $settings.find('.elementor-editor-element-remove');
			const $add = this.$el.find('.elementor-editor-element-add');

			if ($duplicate.length) {
				actions.push({
					name: 'duplicate',
					icon: '<i class="fa fa-copy"></i>',
					title: elementor.translate ? elementor.translate('Duplicate') : 'Duplicate',
					callback: () => {
						$duplicate.trigger('click');
					},
				});
			}

			if ($add.length) {
				actions.push({
					name: 'add',
					icon: '<i class="fa fa-plus"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate('Add column after') : 'Add column after',
					callback: () => {
						$add.trigger('click');
					},
				});
			}

			if ($remove.length) {
				actions.push({
					name: 'delete',
					icon: '<i class="fa fa-trash"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate('Delete') : 'Supprimer',
					callback: () => {
						$remove.trigger('click');
					},
				});
			}

			if (actions.length) {
				groups.push({
					name: 'element',
					actions,
				});
			}
		}

		/*// Hook plus spécifique pour les widgets,
		// comme le `getContextMenuGroups` du widget promo sur le dépôt officiel.
		if (elementor.hooks && elementor.hooks.applyFilters) {
			return elementor.hooks.applyFilters(
				'elements/widget/context-menu/groups',
				groups,
				this.model
			);
		}*/

		return groups;
	},
} );

module.exports = ColumnView;

},{"elementor-behaviors/context-menu":1,"elementor-behaviors/duplicate":2,"elementor-behaviors/elements-relation":3,"elementor-behaviors/handle-duplicate":4,"elementor-behaviors/handle-edit-mode":5,"elementor-behaviors/handle-editor":6,"elementor-behaviors/resizable":7,"elementor-behaviors/sortable":8,"elementor-views/base-element":89,"elementor-views/element-empty":120,"elementor-views/section":121,"elementor-views/widget":123}],91:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlAnimationItemView;

ControlAnimationItemView = ControlBaseItemView.extend( {

	onReady: function() {
		this.ui.select.select2();
	}
} );

module.exports = ControlAnimationItemView;

},{"elementor-views/controls/base":96}],92:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlAutocompletePostsItemView;

ControlAutocompletePostsItemView = ControlBaseItemView.extend( {

	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.searchInput = '.elementor-control-autocomplete-search';
		ui.selectedOptions = '.elementor-control-selected-options';
		ui.selectedPreview = '.elementor-control-selected-preview';
		ui.buttonPostRemove = '.elementor-post-remove';

		return ui;
	},

	childEvents: {
		'click @ui.buttonPostRemove': 'onClickPostRemove',
	},


	onShow: function () {

		var self = this;

		self.ui.selectedPreview.sortable( {
		    axis: 'y',
            stop: function( event, ui ) {

		        var $selectBox = $(self.ui.selectedOptions).empty();

                $.map($(this).find('.elementor-post'), function(el) {
                    $selectBox.append('<option value="' + $(el).data('post-id') + '" selected>p</option>');
                });

                $selectBox.trigger('change');
            }
        } );

		self.insertPosts(this.getControlValue());

		var p_auto_settings = {
			minChars: 3,
			autoFill: true,
			max: 20,
			matchContains: true,
			mustMatch: true,
			dataType: 'json',
			extraParams: {
				format: 'json',
				excludeIds: self.getSelectedPostsIds(),
				action: 'SearchPosts'
			},
			parse: function (data) {
				var parsed = [];
				if (data == null)
					return true;
				for (var i = 0; i < data.length; i++) {
					parsed[parsed.length] = {
						data: data[i],
						value: data[i].name,
						result: data[i].name
					};
				}
				return parsed;
			},
			formatItem: function (item) {
				return '<img src="' + item.image + '" style="width: 30px; max-height: 100%; margin-right: 5px; border: 1px dotted #cecece; display: inline-block; vertical-align: middle;" />(ID: ' + item.id + ') ' + item.name;
			},
			cacheLength: 0,
		};

		$(this.ui.searchInput).autocomplete(ElementorConfig.ajaxurl, p_auto_settings).result(function (event, data, formatted) {
			if (data == null)
				return false;

			var optionHtml = '<option value="' + data.id + '" selected>' + '(ID: ' + data.id+ ') ' + data.name + '</option>';
			var previewHtml = '<div class="elementor-post" data-post-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-post-image" src="' + data.image + '" />' +
				'<div class="elementor-post-info"><span class="elementor-post-reference">(id: ' + data.id + ')</span>'
				+ data.name
				+ '<button data-post-id="' + data.id + '" class="elementor-post-remove elementor-post-remove2' + data.id + '"><i class="fa fa-remove"></i></button></div></div>';

			if ($(self.ui.searchInput).attr('data-single')) {
				$(self.ui.selectedOptions).html(optionHtml);
				$(self.ui.selectedPreview).html(previewHtml);
			} else{
				$(self.ui.selectedOptions).append(optionHtml);
				$(self.ui.selectedPreview).append(previewHtml);
			}



			$(self.ui.searchInput).setOptions({
				extraParams: {
					format: 'json',
					excludeIds : self.getSelectedPostsIds(),
					action: 'SearchPosts'
				}
			});

			$(self.ui.selectedOptions).trigger('change');
			$(this).val('');

		});

	},

	onClickPostRemove: function(domEvent) {

		var $post = $(domEvent.currentTarget);
		var postId = $post.data('post-id');

		$post.parents('.elementor-post').first().remove();

		$(this.ui.selectedOptions).find('option[value=' + postId +' ]').remove();

		$(this.ui.searchInput).setOptions({
			extraParams: {
				format: 'json',
				excludeIds : this.getSelectedPostsIds(),
				action: 'SearchPosts'
			}
		});

		$(this.ui.selectedOptions).trigger('change');


	},

	getSelectedPostsIds: function() {

		var ids = $(this.ui.selectedOptions).val();

		if (_.isUndefined(ids)|| ids == null) {
			return '';
		}
		else{
			return ids.toString();
		}

	},

	onBeforeDestroy: function() {

		$(this.ui.searchInput).unautocomplete();

	},

	insertPosts: function(ids) {

		if (_.isUndefined(ids)|| ids == null) {
			return;
		}

		var posts = null;
		var self = this;

		elementor.ajax.send( 'GetPosts', {
			data: {
				ids: ids.toString(),
			},
			success: function(data) {
				_.each( data, function( data ) {
					$(self.ui.selectedPreview).append('<div class="elementor-post" data-post-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-post-image" src="' + data.image + '" />' +
						'<div class="elementor-post-info"><span class="elementor-post-reference">(id: ' + data.id + ')</span>'
						+ data.name
						+ '<button data-post-id="' + data.id + '" class="elementor-post-remove"><i class="fa fa-remove"></i></button></div></div>');
				});
			}
		} );
		return posts;
	}

} );

module.exports = ControlAutocompletePostsItemView;



},{"elementor-views/controls/base":96}],93:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlAutocompleteProductsItemView;

ControlAutocompleteProductsItemView = ControlBaseItemView.extend( {

	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.searchInput = '.elementor-control-autocomplete-search';
		ui.selectedOptions = '.elementor-control-selected-options';
		ui.selectedPreview = '.elementor-control-selected-preview';
		ui.buttonProductRemove = '.elementor-product-remove';

		return ui;
	},

	childEvents: {
		'click @ui.buttonProductRemove': 'onClickProductRemove',
	},


	onShow: function () {

		var self = this;

		self.ui.selectedPreview.sortable( {
		    axis: 'y',
            stop: function( event, ui ) {

		        var $selectBox = $(self.ui.selectedOptions).empty();

                $.map($(this).find('.elementor-product'), function(el) {
                    $selectBox.append('<option value="' + $(el).data('product-id') + '" selected>p</option>');
                });

                $selectBox.trigger('change');
            }
        } );

		self.insertProducts(this.getControlValue());

		var p_auto_settings = {
			minChars: 3,
			autoFill: true,
			max: 20,
			matchContains: true,
			mustMatch: true,
			dataType: 'json',
			extraParams: {
				format: 'json',
				excludeIds: self.getSelectedProductsIds(),
				action: 'SearchProducts'
			},
			parse: function (data) {
				var parsed = [];
				if (data == null)
					return true;
				for (var i = 0; i < data.length; i++) {
					parsed[parsed.length] = {
						data: data[i],
						value: data[i].name,
						result: data[i].name
					};
				}
				return parsed;
			},
			formatItem: function (item) {
				return '<img src="' + item.image + '" style="width: 30px; max-height: 100%; margin-right: 5px; border: 1px dotted #cecece; display: inline-block; vertical-align: middle;" />(ID: ' + item.id + ') ' + item.name;
			},
			cacheLength: 0,
		};

		$(this.ui.searchInput).autocomplete(ElementorConfig.ajaxurl, p_auto_settings).result(function (event, data, formatted) {
			if (data == null)
				return false;

			var optionHtml = '<option value="' + data.id + '" selected>' + '(ID: ' + data.id+ ') ' + data.name + '</option>';
			var previewHtml = '<div class="elementor-product" data-product-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-product-image" src="' + data.image + '" />' +
				'<div class="elementor-product-info"><span class="elementor-product-reference">(id: ' + data.id + ')</span>'
				+ data.name
				+ '<button data-product-id="' + data.id + '" class="elementor-product-remove elementor-product-remove2' + data.id + '"><i class="fa fa-remove"></i></button></div></div>';

			if ($(self.ui.searchInput).attr('data-single')) {
				$(self.ui.selectedOptions).html(optionHtml);
				$(self.ui.selectedPreview).html(previewHtml);
			} else{
				$(self.ui.selectedOptions).append(optionHtml);
				$(self.ui.selectedPreview).append(previewHtml);
			}



			$(self.ui.searchInput).setOptions({
				extraParams: {
					format: 'json',
					excludeIds : self.getSelectedProductsIds(),
					action: 'SearchProducts'
				}
			});

			$(self.ui.selectedOptions).trigger('change');
			$(this).val('');

		});

	},

	onClickProductRemove: function(domEvent) {

		var $product = $(domEvent.currentTarget);
		var productId = $product.data('product-id');

		$product.parents('.elementor-product').first().remove();

		$(this.ui.selectedOptions).find('option[value=' + productId +' ]').remove();

		$(this.ui.searchInput).setOptions({
			extraParams: {
				format: 'json',
				excludeIds : this.getSelectedProductsIds(),
				action: 'SearchProducts'
			}
		});

		$(this.ui.selectedOptions).trigger('change');


	},

	getSelectedProductsIds: function() {

		var ids = $(this.ui.selectedOptions).val();

		if (_.isUndefined(ids)|| ids == null) {
			return '';
		}
		else{
			return ids.toString();
		}

	},

	onBeforeDestroy: function() {

		$(this.ui.searchInput).unautocomplete();

	},

	insertProducts: function(ids) {

		if (_.isUndefined(ids)|| ids == null) {
			return;
		}

		var products = null;
		var self = this;

		elementor.ajax.send( 'GetProducts', {
			data: {
				ids: ids.toString(),
			},
			success: function(data) {
				_.each( data, function( data ) {
					data.id = data.id_product;
					$(self.ui.selectedPreview).append('<div class="elementor-product" data-product-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-product-image" src="' + data.image + '" />' +
						'<div class="elementor-product-info"><span class="elementor-product-reference">(id: ' + data.id + ')</span>'
						+ data.name
						+ '<button data-product-id="' + data.id + '" class="elementor-product-remove"><i class="fa fa-remove"></i></button></div></div>');
				});
			}
		} );
		return products;
	}

} );

module.exports = ControlAutocompleteProductsItemView;



},{"elementor-views/controls/base":96}],94:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlBaseMultipleItemView;

ControlBaseMultipleItemView = ControlBaseItemView.extend( {

	applySavedValue: function() {
		var values = this.getControlValue(),
			$inputs = this.$( '[data-setting]' ),
			self = this;

		_.each( values, function( value, key ) {
			var $input = $inputs.filter( function() {
				return key === this.dataset.setting;
			} );

			self.setInputValue( $input, value );
		} );
	},

	getControlValue: function( key ) {
		var values = this.elementSettingsModel.get( this.model.get( 'name' ) );

		if ( ! Backbone.$.isPlainObject( values ) ) {
			return {};
		}

		if ( key ) {
			return values[ key ] || '';
		}

		return elementor.helpers.cloneObject( values );
	},

	setValue: function( key, value ) {
		var values = this.getControlValue();

		if ( 'object' === typeof key ) {
			_.each( key, function( internalValue, internalKey ) {
				values[ internalKey ] = internalValue;
			} );
		} else {
			values[ key ] = value;
		}

		this.setSettingsModel( values );
	},

	updateElementModel: function( event ) {
		var inputValue = this.getInputValue( event.currentTarget ),
			key = event.currentTarget.dataset.setting;

		this.setValue( key, inputValue );
	}
}, {
	// Static methods
	replaceStyleValues: function( cssProperty, controlValue ) {
		if ( ! _.isObject( controlValue ) ) {
			return ''; // invalid
		}

		// Trying to retrieve whole the related properties
		// according to the string matches.
		// When one of the properties is empty, aborting
		// the action and returning an empty string.
		try {
			return cssProperty.replace( /\{\{([A-Z]+)}}/g, function( fullMatch, pureMatch ) {
				var value = controlValue[ pureMatch.toLowerCase() ];

				// Skip if value is empty, undefined or null
				if ( '' === value || undefined === value || null === value ) {
					throw '';
				}

				return value;
			} );
		} catch ( exception ) {
			return '';
		}
	},
	getStyleValue: function( placeholder, controlValue ) {
		if ( ! _.isObject( controlValue ) ) {
			return ''; // invalid
		}

		var value = controlValue[ placeholder ];

		// Return empty string if value is undefined or null
		if ( undefined === value || null === value ) {
			return '';
		}

		return value;
	}
} );

module.exports = ControlBaseMultipleItemView;

},{"elementor-views/controls/base":96}],95:[function(require,module,exports){
var ControlBaseMultipleItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlBaseUnitsItemView;

ControlBaseUnitsItemView = ControlBaseMultipleItemView.extend( {

	getCurrentRange: function() {
		return this.getUnitRange( this.getControlValue( 'unit' ) );
	},

	getUnitRange: function( unit ) {
		var ranges = this.model.get( 'range' );

		if ( ! ranges || ! ranges[ unit ] ) {
			return false;
		}

		return ranges[ unit ];
	}
}, {

	// Static methods
	getStyleValue( placeholder, controlValue ) {
		let returnValue = ControlBaseMultipleItemView.getStyleValue( placeholder, controlValue );

		if ( 'unit' === placeholder && 'custom' === returnValue ) {
			returnValue = '__EMPTY__';
		}

		return returnValue;
	},
} );

module.exports = ControlBaseUnitsItemView;

},{"elementor-views/controls/base-multiple":94}],96:[function(require,module,exports){
var ControlBaseItemView;

ControlBaseItemView = Marionette.CompositeView.extend( {
	ui: function() {
		return {
			input: 'input[data-setting][type!="checkbox"][type!="radio"]',
			checkbox: 'input[data-setting][type="checkbox"]',
			radio: 'input[data-setting][type="radio"]',
			select: 'select[data-setting]',
			textarea: 'textarea[data-setting]',
			controlTitle: '.elementor-control-title',
			responsiveSwitchers: '.elementor-responsive-switcher',
			switcherDesktop: '.elementor-responsive-switcher-desktop'
		};
	},

	className: function() {
		// TODO: Any better classes for that?
		var classes = 'elementor-control elementor-control-' + this.model.get( 'name' ) + ' elementor-control-type-' + this.model.get( 'type' ),
			modelClasses = this.model.get( 'classes' ),
			responsiveControl = this.model.get( 'responsive' );

		if ( ! _.isEmpty( modelClasses ) ) {
			classes += ' ' + modelClasses;
		}

		if ( ! _.isEmpty( this.model.get( 'section' ) ) ) {
			classes += ' elementor-control-under-section';
		}

		if ( ! _.isEmpty( responsiveControl ) ) {
			classes += ' elementor-control-responsive-' + responsiveControl;
		}

		return classes;
	},

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-elementor-control-' + this.model.get( 'type' ) + '-content' );
	},

	templateHelpers: function() {
		var controlData = {
			controlValue: this.getControlValue(),
			_cid: this.model.cid
		};

		return {
			data: _.extend( {}, this.model.toJSON(), controlData )
		};
	},

	baseEvents: {
		'input @ui.input': 'onBaseInputChange',
		'change @ui.checkbox': 'onBaseInputChange',
		'change @ui.radio': 'onBaseInputChange',
		'input @ui.textarea': 'onBaseInputChange',
		'change @ui.select': 'onBaseInputChange',
		'click @ui.switcherDesktop': 'onSwitcherDesktopClick',
		'click @ui.responsiveSwitchers': 'onSwitcherClick'
	},

	childEvents: {},

	events: function() {
		return _.extend( {}, this.baseEvents, this.childEvents );
	},

	initialize: function( options ) {
		this.elementSettingsModel = options.elementSettingsModel;

		var controlType = this.model.get( 'type' ),
			controlSettings = Backbone.$.extend( true, {}, elementor.config.controls[ controlType ], this.model.attributes );

		this.model.set( controlSettings );

		this.listenTo( this.elementSettingsModel, 'change', this.toggleControlVisibility );
		this.listenTo( this.elementSettingsModel, 'control:switch:tab', this.onControlSwitchTab );
		this.listenTo( elementor.channels.deviceMode, 'change', this.toggleControlVisibility );
	},

	getControlValue: function() {
		return this.elementSettingsModel.get( this.model.get( 'name' ) );
	},

	isValidValue: function( value ) {
		return true;
	},

	setValue: function( value ) {
		this.setSettingsModel( value );
	},

	setSettingsModel: function( value ) {
		if ( true !== this.isValidValue( value ) ) {
			this.triggerMethod( 'settings:error' );
			return;
		}

		this.elementSettingsModel.set( this.model.get( 'name' ), value );

		this.triggerMethod( 'settings:change' );
	},

	applySavedValue: function() {
		this.setInputValue( '[data-setting="' + this.model.get( 'name' ) + '"]', this.getControlValue() );
	},

	getEditSettings: function( setting ) {
		var settings = this.getOption( 'elementEditSettings' ).toJSON();

		if ( setting ) {
			return settings[ setting ];
		}

		return settings;
	},

	setEditSetting: function( settingKey, settingValue ) {
		var settings = this.getOption( 'elementEditSettings' );

		settings.set( settingKey, settingValue );
	},

	getInputValue: function( input ) {
		var $input = this.$( input ),
			inputValue = $input.val(),
			inputType = $input.attr( 'type' );

		if ( -1 !== [ 'radio', 'checkbox' ].indexOf( inputType ) ) {
			return $input.prop( 'checked' ) ? inputValue : '';
		}

		return inputValue;
	},

	// This method used inside of repeater
	getFieldTitleValue: function() {
		return this.getControlValue();
	},

	setInputValue: function( input, value ) {
		var $input = this.$( input ),
			inputType = $input.attr( 'type' );

		if ( 'checkbox' === inputType ) {
			$input.prop( 'checked', !! value );
		} else if ( 'radio' === inputType ) {
			$input.filter( '[value="' + value + '"]' ).prop( 'checked', true );
		} else if ( 'select2' === inputType ) {
			// don't touch
		} else {
			$input.val( value );
		}
	},

	onSettingsError: function() {
		this.$el.addClass( 'elementor-error' );
	},

	onSettingsChange: function() {
		this.$el.removeClass( 'elementor-error' );
	},

	onRender: function() {
		this.applySavedValue();

		var layoutType = this.model.get( 'label_block' ) ? 'block' : 'inline',
			showLabel = this.model.get( 'show_label' ),
			elClasses = 'elementor-label-' + layoutType;

		elClasses += ' elementor-control-separator-' + this.model.get( 'separator' );

		if ( ! showLabel ) {
			elClasses += ' elementor-control-hidden-label';
		}

		this.$el.addClass( elClasses );
		this.renderResponsiveSwitchers();

		this.triggerMethod( 'ready' );
		this.toggleControlVisibility();
	},

	onBaseInputChange: function( event ) {
		this.updateElementModel( event );

		this.triggerMethod( 'input:change', event );
	},

	onSwitcherClick: function( event ) {
		var device = Backbone.$( event.currentTarget ).data( 'device' );

		elementor.changeDeviceMode( device );
	},

	onSwitcherDesktopClick: function() {
		elementor.getPanelView().getCurrentPageView().$el.toggleClass( 'elementor-responsive-switchers-open' );
	},

	renderResponsiveSwitchers: function() {
		if ( _.isEmpty( this.model.get( 'responsive' ) ) ) {
			return;
		}

		var templateHtml = Backbone.$( '#tmpl-elementor-control-responsive-switchers' ).html();

		this.ui.controlTitle.after( templateHtml );
	},

	toggleControlVisibility: function() {
		var isVisible = elementor.helpers.isControlVisible( this.model, this.elementSettingsModel );

		// Vérifier aussi la visibilité responsive
		var responsiveControl = this.model.get( 'responsive' );
		if ( isVisible && ! _.isEmpty( responsiveControl ) ) {
			var currentDeviceMode = elementor.channels.deviceMode.request( 'currentMode' );
			isVisible = ( responsiveControl === currentDeviceMode );
		}

		this.$el.toggleClass( 'elementor-hidden-control', ! isVisible );
		elementor.channels.data.trigger( 'scrollbar:update' );
	},

	onControlSwitchTab: function( activeTab ) {
		var isActiveTab = ( activeTab === this.model.get( 'tab' ) );
		this.$el.toggleClass( 'elementor-active-tab', isActiveTab );

		// If this is a section control, propagate the class to the wrapper
		if ( 'section' === this.model.get( 'type' ) ) {
			var $wrapper = this.$el.closest( '.elementor-section-wrapper' );
			if ( $wrapper.length ) {
				$wrapper.toggleClass( 'elementor-active-tab', isActiveTab );
			}
		}

		elementor.channels.data.trigger( 'scrollbar:update' );
	},

	onReady: function() {},

	updateElementModel: function( event ) {
		this.setValue( this.getInputValue( event.currentTarget ) );
	}
}, {
	// Static methods
	replaceStyleValues: function( cssProperty, controlValue ) {
		var replaceArray = { '\{\{VALUE\}\}': controlValue };

		return elementor.helpers.stringReplaceAll( cssProperty, replaceArray );
	},
	getStyleValue: function( placeholder, controlValue ) {
		return controlValue;
	}
} );

module.exports = ControlBaseItemView;

},{}],97:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlBoxShadowItemView;

ControlBoxShadowItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.sliders = '.elementor-slider';
		ui.colors = '.elementor-box-shadow-color-picker';

		return ui;
	},

	childEvents: {
		'slide @ui.sliders': 'onSlideChange'
	},

	initSliders: function() {
		var value = this.getControlValue();

		this.ui.sliders.each( function() {
			var $slider = Backbone.$( this ),
				$input = $slider.next( '.elementor-slider-input' ).find( 'input' );

			$slider.slider( {
				value: value[ this.dataset.input ],
				min: +$input.attr( 'min' ),
				max: +$input.attr( 'max' )
			} );
		} );
	},

	initColors: function() {
		var self = this;

		this.ui.colors.wpColorPicker( {
			change: function() {
				var $this = Backbone.$( this ),
					type = $this.data( 'setting' );

				self.setValue( type, $this.wpColorPicker( 'color' ) );
			},

			clear: function() {
				self.setValue( this.dataset.setting, '' );
			},

			width: 251
		} );
	},

	onInputChange: function( event ) {
		var type = event.currentTarget.dataset.setting,
			$slider = this.ui.sliders.filter( '[data-input="' + type + '"]' );

		$slider.slider( 'value', this.getControlValue( type ) );
	},

	onReady: function() {
		this.initSliders();
		this.initColors();
	},

	onSlideChange: function( event, ui ) {
		var type = event.currentTarget.dataset.input,
			$input = this.ui.input.filter( '[data-setting="' + type + '"]' );

		$input.val( ui.value );
		this.setValue( type, ui.value );
	},

	onBeforeDestroy: function() {
		this.ui.colors.each( function() {
			var $color = Backbone.$( this );

			if ( $color.wpColorPicker( 'instance' ) ) {
				$color.wpColorPicker( 'close' );
			}
		} );

		this.$el.remove();
	}
} );

module.exports = ControlBoxShadowItemView;

},{"elementor-views/controls/base-multiple":94}],98:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlChooseItemView;

ControlChooseItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.inputs = '[type="radio"]';

		return ui;
	},

	childEvents: {
		'mousedown label': 'onMouseDownLabel',
		'click @ui.inputs': 'onClickInput',
		'change @ui.inputs': 'updateElementModel'
	},

	onMouseDownLabel: function( event ) {
		var $clickedLabel = this.$( event.currentTarget ),
			$selectedInput = this.$( '#' + $clickedLabel.attr( 'for' ) );

		$selectedInput.data( 'checked', $selectedInput.prop( 'checked' ) );
	},

	onClickInput: function( event ) {
		if ( ! this.model.get( 'toggle' ) ) {
			return;
		}

		var $selectedInput = this.$( event.currentTarget );

		if ( $selectedInput.data( 'checked' ) ) {
			$selectedInput.prop( 'checked', false ).trigger( 'change' );
		}
	},

	onRender: function() {
		ControlBaseItemView.prototype.onRender.apply( this, arguments );

		var currentValue = this.getControlValue();

		if ( currentValue ) {
			this.ui.inputs.filter( '[value="' + currentValue + '"]' ).prop( 'checked', true );
		} else if ( ! this.model.get( 'toggle' ) ) {
			this.ui.inputs.first().prop( 'checked', true ).trigger( 'change' );
		}
	}
} );

module.exports = ControlChooseItemView;

},{"elementor-views/controls/base":96}],99:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlCodeItemView;

ControlCodeItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.editor = '.elementor-code-editor';
		ui.textarea = '.elementor-code-editor-value';

		return ui;
	},

	editor: null,
	markerIds: [],

	onReady: function() {
		var self = this;

		if ( typeof ace === 'undefined' ) {
			return;
		}

		var editorElement = this.ui.editor[0];
		var mode = this.ui.editor.data( 'mode' ) || 'css';

		this.editor = ace.edit( editorElement );
		this.editor.setTheme( 'ace/theme/tomorrow' );
		this.editor.session.setMode( 'ace/mode/' + mode );
		this.editor.setOptions( {
			minLines: 8,
			maxLines: 20,
			showPrintMargin: false,
			fontSize: 12,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true
		});

		// Add custom completer for "selector" keyword
		this.addSelectorCompleter();

		// Set initial value
		var initialValue = this.getControlValue() || '';
		this.editor.setValue( initialValue, -1 );

		// Highlight "selector" keyword
		this.highlightSelector();

		// Listen for changes
		this.editor.session.on( 'change', function() {
			self.setValue( self.editor.getValue() );
			self.highlightSelector();
		} );
	},

	addSelectorCompleter: function() {
		if ( typeof ace.require !== 'function' ) {
			return;
		}

		var langTools = ace.require( 'ace/ext/language_tools' );
		if ( ! langTools ) {
			return;
		}

		var selectorCompleter = {
			getCompletions: function( editor, session, pos, prefix, callback ) {
				callback( null, [
					{
						caption: 'selector',
						value: 'selector',
						meta: 'Wrapper',
						score: 1
					}
				]);
			}
		};

		langTools.addCompleter( selectorCompleter );
	},

	highlightSelector: function() {
		var self = this;
		var session = this.editor.session;
		var Range = ace.require( 'ace/range' ).Range;

		// Remove previous markers
		this.markerIds.forEach( function( id ) {
			session.removeMarker( id );
		});
		this.markerIds = [];

		// Find and highlight all "selector" occurrences
		var content = session.getValue();
		var regex = /\bselector\b/g;
		var match;

		while ( ( match = regex.exec( content ) ) !== null ) {
			var startPos = session.doc.indexToPosition( match.index );
			var endPos = session.doc.indexToPosition( match.index + match[0].length );
			var range = new Range( startPos.row, startPos.column, endPos.row, endPos.column );

			var markerId = session.addMarker( range, 'ace_selector_highlight', 'text', true );
			self.markerIds.push( markerId );
		}
	},

	onBeforeDestroy: function() {
		if ( this.editor ) {
			this.editor.destroy();
			this.editor = null;
		}
	},

	applySavedValue: function() {
		if ( this.editor ) {
			var value = this.getControlValue() || '';
			if ( this.editor.getValue() !== value ) {
				this.editor.setValue( value, -1 );
			}
		}
	}
} );

module.exports = ControlCodeItemView;

},{"elementor-views/controls/base":96}],100:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlColorItemView;

ControlColorItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.picker = '.color-picker-hex';

		return ui;
	},

	onReady: function() {
		this.ui.picker.wpColorPicker( {
			change: _.bind( function() {
				this.setValue( this.ui.picker.wpColorPicker( 'color' ) );
			}, this ),

			clear: _.bind( function() {
				this.setValue( '' );
			}, this ),

			width: 251
		} ).wpColorPicker( 'instance' )
			.wrap.find( '> .wp-picker-input-wrap > .wp-color-picker' )
			.removeAttr( 'maxlength' );
	},

	onBeforeDestroy: function() {
		if ( this.ui.picker.wpColorPicker( 'instance' ) ) {
			this.ui.picker.wpColorPicker( 'close' );
		}
		this.$el.remove();
	}
} );

module.exports = ControlColorItemView;

},{"elementor-views/controls/base":96}],101:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
    ControlDateTimeItemView;

ControlDateTimeItemView = ControlBaseItemView.extend( {
    ui: function() {
        var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );
        ui.picker = '.datetimepicker';

        return ui;
    },

    onReady: function() {
        console.log(this.ui.picker);

        this.ui.picker.datetimepicker({
            prevText: '',
            nextText: '',
            dateFormat: 'yy-mm-dd',
            currentText: dateTimePickerL10n.currentText,
            closeText: dateTimePickerL10n.closeText,
            ampm: false,
            amNames: ['AM', 'A'],
            pmNames: ['PM', 'P'],
            timeFormat: 'hh:mm:ss tt',
            timeSuffix: '',
            timeOnlyTitle: dateTimePickerL10n.timeOnlyTitle,
            timeText: dateTimePickerL10n.timeText,
            hourText: dateTimePickerL10n.hourText,
            minuteText: dateTimePickerL10n.minuteText,
        });
    },

    onBeforeDestroy: function() {
        var picker = this.ui && this.ui.picker ? this.ui.picker : null;

        if (picker && picker.length && picker.data('datetimepicker')) {
            picker.datetimepicker('destroy');
        }
    }
} );

module.exports = ControlDateTimeItemView;
},{"elementor-views/controls/base":96}],102:[function(require,module,exports){
var ControlBaseUnitsItemView = require( 'elementor-views/controls/base-units' ),
	ControlDimensionsItemView;

ControlDimensionsItemView = ControlBaseUnitsItemView.extend( {
	ui: function() {
		var ui = ControlBaseUnitsItemView.prototype.ui.apply( this, arguments );

		ui.controls = '.elementor-control-dimension > input:enabled';
		ui.link = 'button.elementor-link-dimensions';

		return ui;
	},

	childEvents: {
		'click @ui.link': 'onLinkDimensionsClicked'
	},

	defaultDimensionValue: 0,

	initialize: function() {
		ControlBaseUnitsItemView.prototype.initialize.apply( this, arguments );

		// TODO: Need to be in helpers, and not in variable
		this.model.set( 'allowed_dimensions', this.filterDimensions( this.model.get( 'allowed_dimensions' ) ) );
	},

	getPossibleDimensions: function() {
		return [
			'top',
			'right',
			'bottom',
			'left'
		];
	},

	filterDimensions: function( filter ) {
		filter = filter || 'all';

		var dimensions = this.getPossibleDimensions();

		if ( 'all' === filter ) {
			return dimensions;
		}

		if ( ! _.isArray( filter ) ) {
			if ( 'horizontal' === filter ) {
				filter = [ 'right', 'left' ];
			} else if ( 'vertical' === filter ) {
				filter = [ 'top', 'bottom' ];
			}
		}

		return filter;
	},

	onReady: function() {
		var currentValue = this.getControlValue();

		if ( ! this.isLinkedDimensions() ) {
			this.ui.link.addClass( 'unlinked' );

			this.ui.controls.each( _.bind( function( index, element ) {
				var value = currentValue[ element.dataset.setting ];

				if ( _.isEmpty( value ) ) {
					value = this.defaultDimensionValue;
				}

				this.$( element ).val( value );
			}, this ) );
		}

		this.fillEmptyDimensions();
	},

	updateDimensionsValue: function() {
		var currentValue = {},
			dimensions = this.getPossibleDimensions(),
			$controls = this.ui.controls;

		dimensions.forEach( _.bind( function( dimension ) {
			var $element = $controls.filter( '[data-setting="' + dimension + '"]' );

			currentValue[ dimension ] = $element.length ? $element.val() : this.defaultDimensionValue;
		}, this ) );

		this.setValue( currentValue );
	},

	fillEmptyDimensions: function() {
		var dimensions = this.getPossibleDimensions(),
			allowedDimensions = this.model.get( 'allowed_dimensions' ),
			$controls = this.ui.controls;

		if ( this.isLinkedDimensions() ) {
			return;
		}

		dimensions.forEach( _.bind( function( dimension ) {
			var $element = $controls.filter( '[data-setting="' + dimension + '"]' ),
				isAllowedDimension = -1 !== _.indexOf( allowedDimensions, dimension );

			if ( isAllowedDimension && $element.length && _.isEmpty( $element.val() ) ) {
				$element.val( this.defaultDimensionValue );
			}

		}, this ) );
	},

	updateDimensions: function() {
		this.fillEmptyDimensions();
		this.updateDimensionsValue();
	},

	resetDimensions: function() {
		this.ui.controls.val( '' );

		this.updateDimensionsValue();
	},

	onInputChange: function( event ) {
		var inputSetting = event.target.dataset.setting;

		if ( 'unit' === inputSetting ) {
			this.resetDimensions();
		}

		if ( ! _.contains( this.getPossibleDimensions(), inputSetting ) ) {
			return;
		}

		if ( this.isLinkedDimensions() ) {
			var $thisControl = this.$( event.target );

			this.ui.controls.val( $thisControl.val() );
		}

		this.updateDimensions();
	},

	onLinkDimensionsClicked: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.ui.link.toggleClass( 'unlinked' );

		this.setValue( 'isLinked', ! this.ui.link.hasClass( 'unlinked' ) );

		if ( this.isLinkedDimensions() ) {
			// Set all controls value from the first control.
			this.ui.controls.val( this.ui.controls.eq( 0 ).val() );
		}

		this.updateDimensions();
	},

	isLinkedDimensions: function() {
		return this.getControlValue( 'isLinked' );
	}
} );

module.exports = ControlDimensionsItemView;

},{"elementor-views/controls/base-units":95}],103:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlFontItemView;

ControlFontItemView = ControlBaseItemView.extend( {
	onReady: function() {
		this.ui.select.select2( {
			dir: elementor.config.is_rtl ? 'rtl' : 'ltr'
		} );
	},

	templateHelpers: function() {
		var helpers = ControlBaseItemView.prototype.templateHelpers.apply( this, arguments );

		helpers.getFontsByGroups = _.bind( function( groups ) {
			var fonts = this.model.get( 'fonts' ),
				filteredFonts = {};

			_.each( fonts, function( fontType, fontName ) {
				if ( _.isArray( groups ) && _.contains( groups, fontType ) || fontType === groups ) {
					filteredFonts[ fontName ] = fontType;
				}
			} );

			return filteredFonts;
		}, this );

		return helpers;
	}
} );

module.exports = ControlFontItemView;

},{"elementor-views/controls/base":96}],104:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlMediaItemView;

ControlMediaItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.addImages = '.elementor-control-gallery-add';
		ui.clearGallery = '.elementor-control-gallery-clear';
		ui.galleryThumbnails = '.elementor-control-gallery-thumbnails';

		return ui;
	},

	childEvents: {
		'click @ui.addImages': 'onAddImagesClick',
		'click @ui.clearGallery': 'onClearGalleryClick',
		'click @ui.galleryThumbnails': 'onGalleryThumbnailsClick'
	},

	onReady: function() {
		var hasImages = this.hasImages();

		this.$el
		    .toggleClass( 'elementor-gallery-has-images', hasImages )
		    .toggleClass( 'elementor-gallery-empty', ! hasImages );

		this.initRemoveDialog();
	},

	hasImages: function() {
		return !! this.getControlValue().length;
	},

	openFrame: function( action ) {
		this.initFrame( action );

		this.frame.open();
	},

	initFrame: function( action ) {
		var frameStates = {
			create: 'gallery',
			add: 'gallery-library',
			edit: 'gallery-edit'
		};

		var options = {
			frame:  'post',
			multiple: true,
			state: frameStates[ action ],
			button: {
				text: elementor.translate( 'insert_media' )
			}
		};

		if ( this.hasImages() ) {
			options.selection = this.fetchSelection();
		}

		this.frame = wp.media( options );

		// When a file is selected, run a callback.
		this.frame.on( {
			'update': this.select,
			'menu:render:default': this.menuRender,
			'content:render:browse': this.gallerySettings
		}, this );
	},

	menuRender: function( view ) {
		view.unset( 'insert' );
		view.unset( 'featured-image' );
	},

	gallerySettings: function( browser ) {
		browser.sidebar.on( 'ready', function() {
			browser.sidebar.unset( 'gallery' );
		} );
	},

	fetchSelection: function() {
		var attachments = wp.media.query( {
			orderby: 'post__in',
			order: 'ASC',
			type: 'image',
			perPage: -1,
			post__in: _.pluck( this.getControlValue(), 'id' )
		} );

		return new wp.media.model.Selection( attachments.models, {
			props: attachments.props.toJSON(),
			multiple: true
		} );
	},

	/**
	 * Callback handler for when an attachment is selected in the media modal.
	 * Gets the selected image information, and sets it within the control.
	 */
	select: function( selection ) {
		var images = [];

		selection.each( function( image ) {
			images.push( {
				id: image.get( 'id' ),
				url: image.get( 'url' )
			} );
		} );

		this.setValue( images );

		this.render();
	},

	onBeforeDestroy: function() {
		if ( this.frame ) {
			this.frame.off();
		}

		this.$el.remove();
	},

	resetGallery: function() {
		this.setValue( '' );

		this.render();
	},

	initRemoveDialog: function() {
		var removeDialog;

		this.getRemoveDialog = function() {
			if ( ! removeDialog ) {
				removeDialog = elementor.dialogsManager.createWidget( 'confirm', {
					message: elementor.translate( 'dialog_confirm_gallery_delete' ),
					headerMessage: elementor.translate( 'delete_gallery' ),
					strings: {
						confirm: elementor.translate( 'delete' ),
						cancel: elementor.translate( 'cancel' )
					},
					defaultOption: 'confirm',
					onConfirm: _.bind( this.resetGallery, this )
				} );
			}

			return removeDialog;
		};
	},

	onAddImagesClick: function() {
		this.openFrame( this.hasImages() ? 'add' : 'create' );
	},

	onClearGalleryClick: function() {
		this.getRemoveDialog().show();
	},

	onGalleryThumbnailsClick: function() {
		this.openFrame( 'edit' );
	}
} );

module.exports = ControlMediaItemView;

},{"elementor-views/controls/base":96}],105:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlIconItemView;

// Shared caches across all icon control instances (repeater rows, etc.)
var _manifestCache = {};
var _loadedCss = {};
var _svgCache = {};

ControlIconItemView = ControlBaseItemView.extend( {

	_currentLibrary: null,
	_allIcons: [],
	_filteredIcons: [],
	_renderOffset: 0,
	_BATCH_SIZE: 60,
	_panelOpen: false,
	_libraries: null,
	_outsideClickHandler: null,

	ui: function() {
		var parentUi = ControlBaseItemView.prototype.ui;
		if ( typeof parentUi === 'function' ) {
			parentUi = parentUi.call( this );
		}
		return _.extend( {}, parentUi, {
			picker: '.elementor-icon-picker',
			preview: '.elementor-icon-picker-preview',
			previewIcon: '.elementor-icon-picker-preview-icon',
			previewLabel: '.elementor-icon-picker-preview-label',
			clearBtn: '.elementor-icon-picker-clear',
			panel: '.elementor-icon-picker-panel',
			tabs: '.elementor-icon-picker-tabs',
			searchInput: '.elementor-icon-picker-search input',
			grid: '.elementor-icon-picker-grid'
		} );
	},

	events: function() {
		return _.extend( ControlBaseItemView.prototype.events.apply( this, arguments ), {
			'click .elementor-icon-picker-preview': 'onTogglePanel',
			'click .elementor-icon-picker-clear': 'onClearIcon',
			'input .elementor-icon-picker-search input': 'onSearchInput',
			'click .elementor-icon-picker-tab': 'onTabClick',
			'click .elementor-icon-picker-item': 'onIconClick'
		} );
	},

	onReady: function() {
		this._libraries = this.model.get( 'libraries' ) || {};
		var keys = _.keys( this._libraries );
		this._currentLibrary = keys[0] || null;

		// Build tabs only if multiple libraries
		if ( keys.length > 1 ) {
			this._renderTabs( keys );
		}

		// Restore preview from existing value
		this._restorePreview();

		// Load first library manifest
		if ( this._currentLibrary ) {
			this._loadManifest( this._currentLibrary );
		}

		// Infinite scroll
		this.ui.grid.on( 'scroll', _.bind( this._onGridScroll, this ) );
	},

	// ──────────────────────────────────────
	// Tabs
	// ──────────────────────────────────────

	_renderTabs: function( keys ) {
		var self = this;
		var $tabs = this.ui.tabs;
		$tabs.empty();

		_.each( keys, function( key ) {
			var lib = self._libraries[ key ];
			var $tab = Backbone.$( '<div class="elementor-icon-picker-tab" />' )
				.attr( 'data-library', key )
				.text( lib.label );

			if ( key === self._currentLibrary ) {
				$tab.addClass( 'active' );
			}
			$tabs.append( $tab );
		} );
	},

	onTabClick: function( e ) {
		var $tab = Backbone.$( e.currentTarget );
		var key = $tab.data( 'library' );

		if ( key === this._currentLibrary ) {
			return;
		}

		this.ui.tabs.find( '.elementor-icon-picker-tab' ).removeClass( 'active' );
		$tab.addClass( 'active' );

		this._currentLibrary = key;
		this.ui.searchInput.val( '' );
		this._loadManifest( key );
	},

	// ──────────────────────────────────────
	// Panel toggle
	// ──────────────────────────────────────

	onTogglePanel: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		if ( this._panelOpen ) {
			this._closePanel();
		} else {
			this._openPanel();
		}
	},

	_openPanel: function() {
		this.ui.panel.show();
		this._panelOpen = true;
		this.ui.searchInput.focus();

		// Close on click outside
		var self = this;
		this._outsideClickHandler = function( e ) {
			if ( ! Backbone.$( e.target ).closest( '.elementor-icon-picker' ).length ) {
				self._closePanel();
			}
		};

		_.defer( function() {
			Backbone.$( document ).on( 'click.iconPicker', self._outsideClickHandler );
		} );
	},

	_closePanel: function() {
		this.ui.panel.hide();
		this._panelOpen = false;
		Backbone.$( document ).off( 'click.iconPicker' );
	},

	// ──────────────────────────────────────
	// Manifest loading
	// ──────────────────────────────────────

	_loadManifest: function( key ) {
		var self = this;
		var lib = this._libraries[ key ];

		if ( ! lib ) {
			return;
		}

		// Check cache
		if ( _manifestCache[ key ] ) {
			self._onManifestLoaded( key, _manifestCache[ key ] );
			return;
		}

		// Show loading state
		this.ui.grid.html( '<div class="elementor-icon-picker-loading">Loading...</div>' );

		var url = elementor.config.assets_url + 'data/icon-manifests/' + lib.manifest;

		Backbone.$.getJSON( url )
			.done( function( data ) {
				_manifestCache[ key ] = data;
				self._onManifestLoaded( key, data );
			} )
			.fail( function() {
				self.ui.grid.html( '<div class="elementor-icon-picker-empty">Failed to load icons</div>' );
			} );
	},

	_onManifestLoaded: function( key, data ) {
		// Load CDN CSS for font preview in editor
		if ( data.cdnCss ) {
			this._loadLibraryCss( key, data.cdnCss );
		}

		this._allIcons = data.icons || [];
		this._renderGrid();
	},

	_loadLibraryCss: function( key, url ) {
		if ( _loadedCss[ key ] ) {
			return;
		}
		_loadedCss[ key ] = true;

		var link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = url;
		link.id = 'iqit-icon-lib-' + key;
		document.head.appendChild( link );
	},

	// ──────────────────────────────────────
	// Grid rendering
	// ──────────────────────────────────────

	_renderGrid: function() {
		this.ui.grid.empty().scrollTop( 0 );
		this._renderOffset = 0;

		var term = ( this.ui.searchInput.val() || '' ).toLowerCase().trim();

		if ( term ) {
			this._filteredIcons = _.filter( this._allIcons, function( icon ) {
				return icon.n.indexOf( term ) !== -1;
			} );
		} else {
			this._filteredIcons = this._allIcons;
		}

		if ( ! this._filteredIcons.length ) {
			var noResultText = this.ui.picker.data( 'no-result' ) || 'No icons found';
			this.ui.grid.html( '<div class="elementor-icon-picker-empty">' + noResultText + '</div>' );
			return;
		}

		this._renderBatch();
	},

	_renderBatch: function() {
		var batch = this._filteredIcons.slice( this._renderOffset, this._renderOffset + this._BATCH_SIZE );

		if ( ! batch.length ) {
			return;
		}

		var currentValue = this._getCurrentIconClass();
		var fragment = document.createDocumentFragment();

		_.each( batch, function( icon ) {
			var div = document.createElement( 'div' );
			div.className = 'elementor-icon-picker-item';
			if ( icon.c === currentValue ) {
				div.className += ' selected';
			}
			div.setAttribute( 'data-class', icon.c );
			div.setAttribute( 'data-style', icon.s );
			div.setAttribute( 'data-name', icon.n );
			div.title = icon.n;

			var i = document.createElement( 'i' );
			i.className = icon.c;
			div.appendChild( i );

			fragment.appendChild( div );
		} );

		this.ui.grid[0].appendChild( fragment );
		this._renderOffset += batch.length;
	},

	_onGridScroll: function() {
		var el = this.ui.grid[0];
		if ( el.scrollTop + el.clientHeight >= el.scrollHeight - 40 ) {
			this._renderBatch();
		}
	},

	// ──────────────────────────────────────
	// Search
	// ──────────────────────────────────────

	onSearchInput: _.debounce( function() {
		this._renderGrid();
	}, 200 ),

	// ──────────────────────────────────────
	// Icon selection & SVG fetch
	// ──────────────────────────────────────

	onIconClick: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		var $item = Backbone.$( e.currentTarget );
		var iconClass = $item.attr( 'data-class' );
		var style = $item.attr( 'data-style' );
		var name = $item.attr( 'data-name' );
		var library = this._currentLibrary;

		// Visual feedback
		this.ui.grid.find( '.selected' ).removeClass( 'selected' );
		$item.addClass( 'selected' );

		// Update preview immediately (using font icon)
		this._updatePreview( iconClass, name );

		// Fetch SVG, save to disk, then store only the key
		var self = this;
		this._fetchSvg( library, style, name, function( svg ) {
			if ( svg ) {
				self._saveSvgToDisk( library, style, name, svg, function( svgKey ) {
					var newValue = JSON.stringify( {
						library: library,
						value: iconClass,
						svgKey: svgKey || ''
					} );

					self.ui.input.val( newValue ).trigger( 'input' );
					self.setValue( newValue );
					self._closePanel();
				} );
			} else {
				var newValue = JSON.stringify( {
					library: library,
					value: iconClass
				} );

				self.ui.input.val( newValue ).trigger( 'input' );
				self.setValue( newValue );
				self._closePanel();
			}
		} );
	},

	_fetchSvg: function( library, style, name, callback ) {
		var cacheKey = library + '/' + style + '/' + name;

		if ( _svgCache[ cacheKey ] ) {
			callback( _svgCache[ cacheKey ] );
			return;
		}

		var manifest = _manifestCache[ library ];
		if ( ! manifest || ! manifest.cdnSvgBase ) {
			callback( '' );
			return;
		}

		// Build SVG URL based on library type
		var svgUrl;
		if ( library === 'bi' ) {
			// Bootstrap Icons: no style subfolder
			svgUrl = manifest.cdnSvgBase + '/' + name + '.svg';
		} else {
			// FA & Phosphor: style subfolder
			svgUrl = manifest.cdnSvgBase + '/' + style + '/' + name + '.svg';
		}

		Backbone.$.get( svgUrl )
			.done( function( data ) {
				var svg;
				if ( typeof data === 'string' ) {
					svg = data;
				} else if ( data && data.documentElement ) {
					svg = new XMLSerializer().serializeToString( data.documentElement );
				} else {
					svg = '';
				}
				_svgCache[ cacheKey ] = svg;
				callback( svg );
			} )
			.fail( function() {
				callback( '' );
			} );
	},

	_saveSvgToDisk: function( library, style, name, svg, callback ) {
		var cacheKey = library + '/' + style + '/' + name;

		// Already saved in this session
		if ( _svgCache[ '__saved__' + cacheKey ] ) {
			callback( cacheKey );
			return;
		}

		elementor.ajax.send( 'SaveSvgIcon', {
			data: {
				library: library,
				style: style,
				name: name,
				svg: svg
			},
			success: function( data ) {
				_svgCache[ '__saved__' + cacheKey ] = true;
				callback( data && data.svgKey ? data.svgKey : cacheKey );
			},
			error: function() {
				// Fallback: use the computed key even if save failed
				callback( cacheKey );
			}
		} );
	},

	// ──────────────────────────────────────
	// Clear
	// ──────────────────────────────────────

	onClearIcon: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		this.ui.input.val( '' ).trigger( 'input' );
		this.setValue( '' );
		this.ui.previewIcon.empty();
		this.ui.previewLabel.text(
			this.$( '.elementor-icon-picker-preview-label' ).first().data( 'default' ) || 'Select Icon'
		);
		this.ui.clearBtn.hide();
		this.ui.grid.find( '.selected' ).removeClass( 'selected' );
	},

	// ──────────────────────────────────────
	// Value management
	// ──────────────────────────────────────

	setValue: function( value ) {
		this.setSettingsModel( value );
	},

	applySavedValue: function() {
		var value = this.getControlValue();
		this.$( 'input[data-setting]' ).val( typeof value === 'string' ? value : JSON.stringify( value ) );
		this._restorePreview();
	},

	_restorePreview: function() {
		var value = this.getControlValue();
		if ( ! value ) {
			this.ui.clearBtn.hide();
			return;
		}

		var iconClass = this._getCurrentIconClass();
		if ( iconClass ) {
			this._updatePreview( iconClass, iconClass.replace( /^(fa-\w+\s+fa-|bi\s+bi-|ph\s+ph-)/, '' ) );
		}
	},

	_getCurrentIconClass: function() {
		var value = this.getControlValue();
		if ( ! value ) {
			return '';
		}

		if ( typeof value === 'object' && value !== null && value.value ) {
			return value.value;
		}

		if ( typeof value === 'string' ) {
			try {
				var parsed = JSON.parse( value );
				if ( parsed && parsed.value ) {
					return parsed.value;
				}
			} catch ( e ) {
				// Legacy string value
				return value;
			}
		}

		return '';
	},

	_updatePreview: function( iconClass, label ) {
		this.ui.previewIcon.html( '<i class="' + iconClass + '"></i>' );
		this.ui.previewLabel.text( label );
		this.ui.clearBtn.show();
	},

	getFieldTitleValue: function() {
		var iconClass = this._getCurrentIconClass();
		return iconClass ? iconClass.replace( /^(fa-\w+\s+fa-|bi\s+bi-|ph\s+ph-)/, '' ) : '';
	},

	onBeforeDestroy: function() {
		this.ui.grid.off( 'scroll' );
		Backbone.$( document ).off( 'click.iconPicker' );
	}
} );

module.exports = ControlIconItemView;

},{"elementor-views/controls/base":96}],106:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlImageDimensionsItemView;

ControlImageDimensionsItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		return {
			inputWidth: 'input[data-setting="width"]',
			inputHeight: 'input[data-setting="height"]',

			btnApply: 'button.elementor-image-dimensions-apply-button'
		};
	},

	// Override the base events
	baseEvents: {
		'click @ui.btnApply': 'onApplyClicked'
	},

	onApplyClicked: function( event ) {
		event.preventDefault();

		this.setValue( {
			width: this.ui.inputWidth.val(),
			height: this.ui.inputHeight.val()
		} );
	}
} );

module.exports = ControlImageDimensionsItemView;

},{"elementor-views/controls/base-multiple":94}],107:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlMediaItemView;

ControlMediaItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.controlMedia = '.elementor-control-media';
		ui.frameOpeners = '.elementor-control-media-upload-button, .elementor-control-media-image';
		ui.deleteButton = '.elementor-control-media-delete';
		ui.fileField = '.elementor-control-media-field';

		return ui;
	},

	childEvents: {
		'click @ui.frameOpeners': 'openFrame',
		'click @ui.deleteButton': 'deleteImage',
		'input @ui.fileField': 'select'
	},

	onReady: function() {
		if ( _.isEmpty( this.getControlValue( 'url' ) ) ) {
			this.ui.controlMedia.addClass( 'media-empty' );
		} else{
			var attachment = this.ui.fileField.val();

			if ( attachment) {
				var img = new Image();
				var self = this;

				img.onload = function() {
					var width = this.width;
					var  height = this.height;
					self.setValue( {
						url: attachment,
						id: 1,
						width: width,
						height: height,
					});
				};
				img.src = attachment;
			}
		}
	},

	openFrame: function() {
		openPsFileManager('elementor-control-media-field-' + this.model.cid, 1);
	},

	deleteImage: function() {
		this.setValue( {
			url: '',
			width: '',
			height: '',
			id: ''
		} );

		this.render();
	},

	select: function() {
		var attachment = this.ui.fileField.val();

		if ( attachment) {
			var img = new Image();
			var self = this;

			img.onload = function() {
				var width = this.width;
				var  height = this.height;
				self.setValue( {
					url: attachment,
					id: 1,
					width: width,
					height: height,
				});
				self.render();
				self.ui.fileField.val(attachment);
			};

			img.src = attachment;
		}
	},

	onBeforeDestroy: function() {
		this.$el.remove();
	}
} );

module.exports = ControlMediaItemView;

},{"elementor-views/controls/base-multiple":94}],108:[function(require,module,exports){
var ControlBaseView = require( './base' );

var ControlPopoverToggleView = ControlBaseView.extend( {
	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		ui.toggleButton = '.elementor-control-popover-toggle-toggle';
		ui.toggleButtonLabel = '.elementor-control-popover-toggle-toggle-label';
		ui.resetButton = '.elementor-control-popover-toggle-reset-label';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseView.prototype.events.apply( this, arguments ), {
			'change @ui.toggleButton': 'onToggleChange',
			'click @ui.toggleButtonLabel': 'onToggleLabelClick',
			'click @ui.resetButton': 'onResetClick'
		} );
	},

	onToggleChange: function() {
		var value = this.ui.toggleButton.filter( ':checked' ).val();
		this.setValue( value );
		this.togglePopover( !! value );

		console.log( 'Popover toggle changed to value:', value );
	},

	onToggleLabelClick: function( event ) {
		const $popover = this.$el.next('.elementor-controls-popover');
		this.togglePopover( !$popover.hasClass( 'elementor-open' ) );

		console.log( 'Popover toggled via label click.' );
	},

	onResetClick: function( event ) {
		event.preventDefault();
		this.resetPopoverControls();
	},

	togglePopover: function( show ) {
		const $popover = this.$el.next('.elementor-controls-popover');
		console.log( this.$el, $popover );

		if ( ! $popover.length ) {
			return;
		}

		$popover.toggleClass( 'elementor-open', show );

		// Manage outside click listener
		if ( show ) {
			this.addOutsideClickListener();
		} else {
			this.removeOutsideClickListener();
		}
	},

	addOutsideClickListener: function() {
		var self = this;

		// Avoid duplicates
		this.removeOutsideClickListener();

		this.outsideClickHandler = function( event ) {
			var $target = Backbone.$( event.target ),
				$popover = self.$el.next( '.elementor-controls-popover' );

			// If click is not on toggle control and not inside popover
			if ( ! $target.closest( self.$el ).length &&
				 ! $target.closest( $popover ).length ) {
				// Close the popover
				self.togglePopover( false );
			}
		};

		// Use namespaced event to avoid conflicts
		Backbone.$( document ).on( 'click.popoverToggle' + this.cid, this.outsideClickHandler );
	},

	removeOutsideClickListener: function() {
		Backbone.$( document ).off( 'click.popoverToggle' + this.cid );
	},

	onDestroy: function() {
		this.removeOutsideClickListener();
	},

	resetPopoverControls: function() {
		this.setValue( '' );
		this.ui.toggleButton.filter( '[value=""]' ).prop( 'checked', true );
		this.ui.toggleButton.filter( '[value!=""]' ).prop( 'checked', false );
		this.togglePopover( false );
	},

	onRender: function() {
		this.togglePopover( false );
	}
} );

module.exports = ControlPopoverToggleView;
},{"./base":96}],109:[function(require,module,exports){
var RepeaterRowView;

RepeaterRowView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-repeater-row' ),

	className: 'repeater-fields',

	ui: {
		duplicateButton: '.elementor-repeater-tool-duplicate',
		editButton: '.elementor-repeater-tool-edit',
		removeButton: '.elementor-repeater-tool-remove',
		itemTitle: '.elementor-repeater-row-item-title'
	},

	triggers: {
		'click @ui.removeButton': 'click:remove',
		'click @ui.duplicateButton': 'click:duplicate',
		'click @ui.itemTitle': 'click:edit'
	},

	templateHelpers: function() {
		return {
			itemIndex: this.getOption( 'itemIndex' )
		};
	},

	childViewContainer: '.elementor-repeater-row-controls',

	getChildView: function( item ) {
		var controlType = item.get( 'type' );
		return elementor.getControlItemView( controlType );
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model
		};
	},

	updateIndex: function( newIndex ) {
		this.itemIndex = newIndex;
		this.setTitle();
	},

	setTitle: function() {
		var titleField = this.getOption( 'titleField' ),
			title;

		if ( titleField ) {
			var changerControlModel = this.collection.find( { name: titleField } ),
				changerControlView = this.children.findByModelCid( changerControlModel.cid );

			title = changerControlView.getFieldTitleValue();
		}

		if ( ! title ) {
			title = elementor.translate( 'Item #{0}', [ this.getOption( 'itemIndex' ) ] );
		}

		this.ui.itemTitle.text( title );
	},

	initialize: function( options ) {
		this.elementSettingsModel = options.elementSettingsModel;

		this.itemIndex = 0;

		// Collection for Controls list
		this.collection = new Backbone.Collection( options.controlFields );

		if ( options.titleField ) {
			this.listenTo( this.model, 'change:' + options.titleField, this.setTitle );
		}
	},

	onRender: function() {
		this.setTitle();
	}
} );

module.exports = RepeaterRowView;

},{}],110:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	RepeaterRowView = require( 'elementor-views/controls/repeater-row' ),
	ControlRepeaterItemView;

ControlRepeaterItemView = ControlBaseItemView.extend( {
	ui: {
		btnAddRow: '.elementor-repeater-add',
		fieldContainer: '.elementor-repeater-fields'
	},

	events: {
		'click @ui.btnAddRow': 'onButtonAddRowClick',
		'sortstart @ui.fieldContainer': 'onSortStart',
		'sortupdate @ui.fieldContainer': 'onSortUpdate'
	},

	childView: RepeaterRowView,

	childViewContainer: '.elementor-repeater-fields',

	templateHelpers: function() {
		return {
			data: _.extend( {}, this.model.toJSON(), { controlValue: [] } )
		};
	},

	childViewOptions: function() {
		return {
			controlFields: this.model.get( 'fields' ),
			titleField: this.model.get( 'title_field' )
		};
	},

	initialize: function( options ) {
		ControlBaseItemView.prototype.initialize.apply( this, arguments );

		this.collection = this.elementSettingsModel.get( this.model.get( 'name' ) );

		this.listenTo( this.collection, 'change add remove reset', this.onCollectionChanged, this );
	},

	editRow: function( rowView ) {
		if ( this.currentEditableChild ) {
			this.currentEditableChild.getChildViewContainer( this.currentEditableChild ).removeClass( 'editable' );

			var sortedRowView = this.currentEditableChild,
				rowControls = sortedRowView.children._views;

			jQuery.each( rowControls, function() {
				if ( 'wysiwyg' === this.model.get( 'type' ) ) {
					tinymce.EditorManager.execCommand( 'mceRemoveEditor', true, this.editorID);
				}
			} );
		}


		if ( this.currentEditableChild === rowView ) {
			delete this.currentEditableChild;
			return;
		}

		rowView.getChildViewContainer( rowView ).addClass( 'editable' );

		this.currentEditableChild = rowView;


		var sortedRowView = this.currentEditableChild,
			rowControls = sortedRowView.children._views;

		jQuery.each( rowControls, function() {
			if ( 'wysiwyg' === this.model.get( 'type' ) ) {
				tinymce.EditorManager.execCommand( 'mceRemoveEditor', true, this.editorID);
				tinymce.EditorManager.execCommand('mceAddEditor', false, this.editorID);
			}
		} );

		this.updateActiveRow();
	},

	toggleMinRowsClass: function() {
		if ( ! this.model.get( 'prevent_empty' ) ) {
			return;
		}

		this.$el.toggleClass( 'elementor-repeater-has-minimum-rows', 1 >= this.collection.length );
	},

	updateActiveRow: function() {
		var activeItemIndex = 0;


		if ( this.currentEditableChild ) {
			activeItemIndex = this.currentEditableChild.itemIndex;
		}

		this.setEditSetting( 'activeItemIndex', activeItemIndex );
	},

	updateChildIndexes: function() {
		this.children.each( _.bind( function( view ) {
			view.updateIndex( this.collection.indexOf( view.model ) + 1 );
		}, this ) );
	},

	onRender: function() {
		this.ui.fieldContainer.sortable( { axis: 'y' } );

		this.toggleMinRowsClass();
	},

	onSortStart: function( event, ui ) {
		ui.item.data( 'oldIndex', ui.item.index() );
	},

	onSortUpdate: function( event, ui ) {
		var oldIndex = ui.item.data( 'oldIndex' ),
			model = this.collection.at( oldIndex ),
			newIndex = ui.item.index();

		this.collection.remove( model );
		this.collection.add( model, { at: newIndex } );
	},

	onAddChild: function() {
		this.updateChildIndexes();
		this.updateActiveRow();
	},

	onRemoveChild: function( childView ) {
		if ( childView === this.currentEditableChild ) {
			delete this.currentEditableChild;
		}

		this.updateChildIndexes();
		this.updateActiveRow();
	},

	onCollectionChanged: function() {
		this.elementSettingsModel.trigger( 'change' );

		this.toggleMinRowsClass();
	},

	onButtonAddRowClick: function() {
		var defaults = {};
		_.each( this.model.get( 'fields' ), function( field ) {
			defaults[ field.name ] = field['default'];
		} );

		var newModel = this.collection.add( defaults ),
			newChildView = this.children.findByModel( newModel );

		this.editRow( newChildView );
	},

	onChildviewClickRemove: function( childView ) {
		childView.model.destroy();
	},

	onChildviewClickDuplicate: function( childView ) {
		this.collection.add( childView.model.clone(), { at: childView.itemIndex } );
	},

	onChildviewClickEdit: function( childView ) {
		this.editRow( childView );
	}
} );

module.exports = ControlRepeaterItemView;

},{"elementor-views/controls/base":96,"elementor-views/controls/repeater-row":109}],111:[function(require,module,exports){
var ControlBaseItemView = require('elementor-views/controls/base'),
    ControlSectionItemView;

ControlSectionItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.heading = '.elementor-panel-heading';

		return ui;
	},

	triggers: {
		'click': 'control:section:clicked'
	}
} );

module.exports = ControlSectionItemView;

},{"elementor-views/controls/base":96}],112:[function(require,module,exports){
// Attention: DO NOT use this control since it has bugs
// TODO: This control is unused
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlSelectSortItemView;

ControlSelectSortItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.select = '.elementor-select-sort';
		ui.selectedOptions = '.elementor-select-sort-selector';
		ui.selectedPreview = '.elementor-control-selected-preview';
		ui.buttonAdd = '.elementor-value-add';
		ui.buttonRemove = '.elementor-selected-value-remove';

		return ui;
	},

	childEvents: {
		'click @ui.buttonRemove': 'onClickRemove',
		'click @ui.buttonAdd': 'onClickAdd',
	},

	onReady: function() {

		var self = this;

		this.ui.selectedPreview.sortable( {
			axis: 'y',
			stop: function( event, ui ) {

				var $selectBox = $(self.ui.select).empty();

				$.map($(this).find('.elementor-selected-value-preview'), function(el) {
					$selectBox.append('<option value="' + $(el).data('value-id') + '" selected>'+ $(el).data('value-text') +'</option>');
				});

				$selectBox.trigger('change');
			}
		} );

	},

	onClickRemove: function(domEvent) {

		var $element = $(domEvent.currentTarget);
		var id = $element.data('value-id');
		$element.parents('.elementor-selected-value-preview').first().remove();
		$(this.ui.select).find('option[value=' + id +' ]').remove().prop("selected", false);
		$(this.ui.selectedOptions).find('option[value=' + id +' ]').prop('disabled', false).removeClass('hidden-option');

		$(this.ui.select).trigger('change');

	},

	onClickAdd: function(domEvent) {

		var self = this;

		$(this.ui.selectedOptions).find(':selected').each(function() {
			$option = $( this );

			if($option .prop('disabled') == true){
				return;
			}
			$optionClone = $option.clone().prop("selected", true);


			$option.prop('disabled', true);

			if($(self.ui.selectedOptions).data('remove')){
				$option.addClass('hidden-option');
			}

			$optionClone.appendTo(self.ui.select);
			var id = $(this).val();
			var text = $(this).text();

			$(self.ui.selectedPreview).append('<div class="elementor-selected-value-preview" data-value-text="' + text + '" data-value-id="' + id  + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div>' +
				'<div class="selected-value-preview-info">'
				+ text
				+ '<button data-value-id="' + id + '" data-value-text="' + text + '" class="elementor-selected-value-remove selected-value-remove' + id + '"><i class="fa fa-remove"></i></button></div></div>');
		});

		$(this.ui.select).trigger('change');


	},

	onBeforeDestroy: function() {

		this.$el.remove();
	}
} );

module.exports = ControlSelectSortItemView;

},{"elementor-views/controls/base":96}],113:[function(require,module,exports){
// Attention: DO NOT use this control since it has bugs
// TODO: This control is unused
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlSelect2ItemView;

ControlSelect2ItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.select = '.elementor-select2';

		return ui;
	},

	onReady: function() {
		var options = {
			allowClear: true
		};

		this.ui.select.select2( options );
	},

	onBeforeDestroy: function() {
		if ( this.ui.select.data( 'select2' ) ) {
			this.ui.select.select2( 'destroy' );
		}
		this.$el.remove();
	}
} );

module.exports = ControlSelect2ItemView;

},{"elementor-views/controls/base":96}],114:[function(require,module,exports){
var ControlBaseUnitsItemView = require( 'elementor-views/controls/base-units' ),
	ControlSliderItemView;

ControlSliderItemView = ControlBaseUnitsItemView.extend( {
	ui: function() {
		var ui = ControlBaseUnitsItemView.prototype.ui.apply( this, arguments );

		ui.slider = '.elementor-slider';

		return ui;
	},

	childEvents: {
		'slide @ui.slider': 'onSlideChange'
	},

	_isCustomUnit: function() {
		return 'custom' === this.getControlValue( 'unit' );
	},

	_setInputMode: function( isCustom ) {
		this.ui.input.attr( 'type', isCustom ? 'text' : 'number' );

		if ( isCustom ) {
			this.ui.input.removeAttr( 'min' ).removeAttr( 'max' ).removeAttr( 'step' );
		}
	},

	_applyNumberConstraints: function( unitRange ) {
		// jQuery 3.5.1: éviter attr(object) (peut throw si une valeur n'est pas une string)
		// unitRange vient typiquement de getCurrentRange(): { min, max, step }
		this.ui.input
			.removeAttr( 'min' )
			.removeAttr( 'max' )
			.removeAttr( 'step' );

		if ( unitRange && null != unitRange.min ) {
			this.ui.input.attr( 'min', unitRange.min );
		}
		if ( unitRange && null != unitRange.max ) {
			this.ui.input.attr( 'max', unitRange.max );
		}
		if ( unitRange && null != unitRange.step ) {
			this.ui.input.attr( 'step', unitRange.step );
		}
	},

	_destroySliderIfNeeded: function() {
		// jQuery UI slider: éviter exceptions si pas initialisé.
		if ( this.ui.slider && this.ui.slider.length && this.ui.slider.hasClass( 'ui-slider' ) ) {
			this.ui.slider.slider( 'destroy' );
		}
	},

	_updateUnitsUI: function() {
		var isCustom = this._isCustomUnit();

		this._setInputMode( isCustom );

		if ( isCustom ) {
			this._destroySliderIfNeeded();
			this.ui.slider.hide();
			var size = this.getControlValue( 'size' );
			this.ui.input.val( size );

			return;
		}

		this.ui.slider.show();
		this.initSlider();
	},

	initSlider: function() {
		// Ne pas initialiser le slider si on est en "custom".
		if ( this._isCustomUnit() ) {
			// En custom, on laisse l'input tel quel (texte libre).
			this._setInputMode( true );
			this.ui.slider.hide();
			return;
		}

		var size = this.getControlValue( 'size' ),
			unitRange = this.getCurrentRange();

		this._setInputMode( false );
		this._applyNumberConstraints( unitRange );

		/*// Normaliser size pour le slider (jQuery UI attend un nombre).
		if ( '' === size || null == size ) {
			size = unitRange && null != unitRange.min ? unitRange.min : 0;
		}
		size = Number( size );
		if ( isNaN( size ) ) {
			size = unitRange && null != unitRange.min ? Number( unitRange.min ) : 0;
		}*/

		console.log('Initializing slider with size:', size, this.ui.input);



		this.ui.input.val( size );

		this._destroySliderIfNeeded();

		this.ui.slider.slider( _.extend( {}, unitRange, { value: size } ) );
	},

	resetSize: function() {
		this.setValue( 'size', '' );
		this.initSlider();
	},

	onReady: function() {
		this._updateUnitsUI();
	},

	onSlideChange: function( event, ui ) {
		this.setValue( 'size', ui.value );

		this.ui.input.val( ui.value );
	},

	onInputChange: function( event ) {
		var dataChanged = event.currentTarget.dataset.setting;

		if ( 'size' === dataChanged ) {
			if ( this._isCustomUnit() ) {
				return;
			}

			// Eviter d'envoyer une string vide / non-numérique au slider.
			var v = this.getControlValue( 'size' );
			v = Number( v );
			if ( isNaN( v ) ) {
				return;
			}

			this.ui.slider.slider( 'value', v );
		} else if ( 'unit' === dataChanged ) {
			// Si on repasse sur une unité numérique, la valeur doit être un entier "pur".
			// parseInt suffit: si "12px"/"12.5" => mismatch => on vide.
			if ( ! this._isCustomUnit() ) {
				const rawSize = this.getControlValue('size');
				if ( null != rawSize && '' !== rawSize ) {
					const trimmed = String( rawSize ).trim();
					const parsed = parseInt( trimmed, 10 );
					if ( isNaN( parsed ) || String( parsed ) !== trimmed ) {
						this.setValue( 'size', '' );
						if ( this.ui && this.ui.input && this.ui.input.length ) {
							this.ui.input.val( '' );
						}
					}
				}
			}

			this._updateUnitsUI();
		}
	},

	onBeforeDestroy: function() {
		this._destroySliderIfNeeded();
		this.$el.remove();
	}
} );

module.exports = ControlSliderItemView;

},{"elementor-views/controls/base-units":95}],115:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlStructureItemView;

ControlStructureItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.resetStructure = '.elementor-control-structure-reset';

		return ui;
	},

	childEvents: {
		'click @ui.resetStructure': 'onResetStructureClick'
	},

	templateHelpers: function() {
		var helpers = ControlBaseItemView.prototype.templateHelpers.apply( this, arguments );

		helpers.getMorePresets = _.bind( this.getMorePresets, this );

		return helpers;
	},

	getCurrentEditedSection: function() {
		var editor = elementor.getPanelView().getCurrentPageView();

		return editor.getOption( 'editedElementView' );
	},

	getMorePresets: function() {
		var parsedStructure = elementor.presetsFactory.getParsedStructure( this.getControlValue() );

		return elementor.presetsFactory.getPresets( parsedStructure.columnsCount );
	},

	onInputChange: function() {
		this.getCurrentEditedSection().redefineLayout();

		this.render();
	},

	onResetStructureClick: function() {
		this.getCurrentEditedSection().resetColumnsCustomSize();
	}
} );

module.exports = ControlStructureItemView;

},{"elementor-views/controls/base":96}],116:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlTextShadowItemView;

ControlTextShadowItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.sliders = '.elementor-slider';
		ui.colors = '.elementor-text-shadow-color-picker';

		return ui;
	},

	childEvents: {
		'slide @ui.sliders': 'onSlideChange'
	},

	initSliders: function() {
		var value = this.getControlValue();

		this.ui.sliders.each( function() {
			var $slider = Backbone.$( this ),
				$input = $slider.next( '.elementor-slider-input' ).find( 'input' );

			$slider.slider( {
				value: value[ this.dataset.input ],
				min: +$input.attr( 'min' ),
				max: +$input.attr( 'max' )
			} );
		} );
	},

	initColors: function() {
		var self = this;
		this.ui.colors.wpColorPicker( {
			change: function() {
				var $this = Backbone.$( this ),
					type = $this.data( 'setting' );

				self.setValue( type, $this.wpColorPicker( 'color' ) );
			},

			clear: function() {
				self.setValue( this.dataset.setting, '' );
			},

			width: 251
		} );
	},

	onInputChange: function( event ) {
		var type = event.currentTarget.dataset.setting,
			$slider = this.ui.sliders.filter( '[data-input="' + type + '"]' );

		$slider.slider( 'value', this.getControlValue( type ) );
	},

	onReady: function() {
		this.initSliders();
		this.initColors();
	},

	onSlideChange: function( event, ui ) {
		var type = event.currentTarget.dataset.input,
			$input = this.ui.input.filter( '[data-setting="' + type + '"]' );

		$input.val( ui.value );
		this.setValue( type, ui.value );
	},

	onBeforeDestroy: function() {
		this.ui.colors.each( function() {
			var $color = Backbone.$( this );

			if ( $color.wpColorPicker( 'instance' ) ) {
				$color.wpColorPicker( 'close' );
			}
		} );

		this.$el.remove();
	}
} );

module.exports = ControlTextShadowItemView;

},{"elementor-views/controls/base-multiple":94}],117:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlUrlItemView;

var _searchCache = {};

ControlUrlItemView = ControlMultipleBaseItemView.extend( {

	_dropdownOpen: false,
	_searchXhr: null,
	_entityMode: false,
	_outsideClickHandler: null,

	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.searchInput = '.elementor-control-url-search';
		ui.dropdown = '.elementor-control-url-dropdown';
		ui.inputWrap = '.elementor-control-url-input-wrap';
		ui.entityPreview = '.elementor-control-url-entity-preview';
		ui.entityType = '.elementor-control-url-entity-type';
		ui.entityLabel = '.elementor-control-url-entity-label';
		ui.entityClear = '.elementor-control-url-entity-clear';
		ui.btnExternal = 'button.elementor-control-url-target';
		ui.frameOpeners = '.elementor-control-url-media';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'input .elementor-control-url-search': 'onSearchInput',
			'focus .elementor-control-url-search': 'onSearchFocus',
			'keydown .elementor-control-url-search': 'onSearchKeydown',
			'click .elementor-control-url-entity-clear': 'onEntityClear',
			'click .elementor-control-url-target': 'onExternalClicked',
			'click .elementor-control-url-media': 'openFrame',
			'click .elementor-control-url-dropdown-item': 'onDropdownItemClick'
		} );
	},

	onReady: function() {
		if ( this.getControlValue( 'is_external' ) ) {
			this.ui.btnExternal.addClass( 'active' );
		}

		this._restoreEntityPreview();
	},

	// ──────────────────────────────────────
	// Entity preview (when an entity is selected)
	// ──────────────────────────────────────

	_restoreEntityPreview: function() {
		var type = this.getControlValue( 'type' );
		var label = this.getControlValue( 'label' );

		if ( type && type !== 'custom' && label ) {
			this._showEntityPreview( type, label );
		} else {
			this._hideEntityPreview();
		}
	},

	_showEntityPreview: function( type, label ) {
		this._entityMode = true;
		this.ui.entityType.text( this._getTypeLabel( type ) );
		this.ui.entityLabel.text( label );
		this.ui.entityPreview.show();
		this.ui.inputWrap.hide();
	},

	_hideEntityPreview: function() {
		this._entityMode = false;
		this.ui.entityPreview.hide();
		this.ui.inputWrap.show();
	},

	_getTypeLabel: function( type ) {
		var labels = {
			'category': 'Category',
			'cms': 'CMS',
			'manufacturer': 'Brand',
			'supplier': 'Supplier'
		};
		return labels[ type ] || type;
	},

	onEntityClear: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue( {
			type: '',
			id: '',
			url: '',
			label: ''
		} );

		this._hideEntityPreview();
		this.ui.searchInput.val( '' ).focus();
	},

	// ──────────────────────────────────────
	// Search & dropdown
	// ──────────────────────────────────────

	onSearchFocus: function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();
		if ( val.length >= 2 ) {
			this._doSearch( val );
		}
	},

	onSearchInput: _.debounce( function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();

		if ( val.length < 2 ) {
			this._closeDropdown();

			// Treat as custom URL on blur/change
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: ''
			} );
			return;
		}

		// If it looks like a URL, set as custom immediately
		if ( this._looksLikeUrl( val ) ) {
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: ''
			} );
		}

		this._doSearch( val );
	}, 300 ),

	onSearchKeydown: function( e ) {
		// Escape closes dropdown
		if ( e.keyCode === 27 ) {
			this._closeDropdown();
			return;
		}

		// Enter on a custom URL
		if ( e.keyCode === 13 ) {
			e.preventDefault();
			this._closeDropdown();

			var val = ( this.ui.searchInput.val() || '' ).trim();
			if ( val ) {
				this.setValue( {
					type: 'custom',
					id: '',
					url: val,
					label: ''
				} );
			}
		}
	},

	_looksLikeUrl: function( str ) {
		return /^(https?:\/\/|\/|#|mailto:|tel:)/.test( str );
	},

	_doSearch: function( term ) {
		var self = this;

		// Cancel previous request
		if ( this._searchXhr ) {
			this._searchXhr.abort();
			this._searchXhr = null;
		}

		// Check cache
		var cacheKey = term.toLowerCase();
		if ( _searchCache[ cacheKey ] ) {
			self._renderDropdown( _searchCache[ cacheKey ], term );
			return;
		}

		// Show loading
		this.ui.dropdown.html( '<div class="elementor-control-url-dropdown-loading">...</div>' ).show();
		this._dropdownOpen = true;
		this._bindOutsideClick();

		this._searchXhr = elementor.ajax.send( 'SearchEntities', {
			data: {
				q: term
			},
			success: function( data ) {
				self._searchXhr = null;
				_searchCache[ cacheKey ] = data || [];
				self._renderDropdown( data || [], term );
			},
			error: function() {
				self._searchXhr = null;
				self._closeDropdown();
			}
		} );
	},

	_renderDropdown: function( results, term ) {
		var $dropdown = this.ui.dropdown;
		$dropdown.empty();

		if ( ! results.length ) {
			var noResult = this.ui.searchInput.data( 'no-result' ) || 'No results';
			$dropdown.html( '<div class="elementor-control-url-dropdown-empty">' + noResult + '</div>' );
			$dropdown.show();
			this._dropdownOpen = true;
			this._bindOutsideClick();
			return;
		}

		var fragment = document.createDocumentFragment();

		_.each( results, function( item ) {
			var div = document.createElement( 'div' );
			div.className = 'elementor-control-url-dropdown-item';
			div.setAttribute( 'data-type', item.type );
			div.setAttribute( 'data-id', item.id );
			div.setAttribute( 'data-label', item.name );

			var typeSpan = document.createElement( 'span' );
			typeSpan.className = 'elementor-control-url-dropdown-item-type';
			typeSpan.textContent = item.type_label;
			div.appendChild( typeSpan );

			var nameSpan = document.createElement( 'span' );
			nameSpan.className = 'elementor-control-url-dropdown-item-name';
			nameSpan.textContent = item.name;
			div.appendChild( nameSpan );

			fragment.appendChild( div );
		} );

		$dropdown[0].appendChild( fragment );
		$dropdown.show();
		this._dropdownOpen = true;
		this._bindOutsideClick();
	},

	onDropdownItemClick: function( e ) {
		var $item = Backbone.$( e.currentTarget );
		var type = $item.attr( 'data-type' );
		var id = $item.attr( 'data-id' );
		var label = $item.attr( 'data-label' );

		this.setValue( {
			type: type,
			id: id,
			url: '',
			label: label
		} );

		this._showEntityPreview( type, label );
		this._closeDropdown();
	},

	_closeDropdown: function() {
		this.ui.dropdown.hide().empty();
		this._dropdownOpen = false;
		this._unbindOutsideClick();
	},

	_bindOutsideClick: function() {
		if ( this._outsideClickHandler ) {
			return;
		}
		var self = this;
		this._outsideClickHandler = function( e ) {
			if ( ! Backbone.$( e.target ).closest( '.elementor-control-url-input-wrap' ).length ) {
				self._closeDropdown();
			}
		};
		_.defer( function() {
			Backbone.$( document ).on( 'click.urlSearch', self._outsideClickHandler );
		} );
	},

	_unbindOutsideClick: function() {
		if ( this._outsideClickHandler ) {
			Backbone.$( document ).off( 'click.urlSearch', this._outsideClickHandler );
			this._outsideClickHandler = null;
		}
	},

	// ──────────────────────────────────────
	// External & Media (keep existing behavior)
	// ──────────────────────────────────────

	openFrame: function() {
		openPsFileManager( 'elementor-control-url-field-' + this.model.cid, 2 );
	},

	onExternalClicked: function( e ) {
		e.preventDefault();
		this.ui.btnExternal.toggleClass( 'active' );
		this.setValue( 'is_external', this.isExternal() );
	},

	isExternal: function() {
		return this.ui.btnExternal.hasClass( 'active' );
	},

	// ──────────────────────────────────────
	// Value management
	// ──────────────────────────────────────

	applySavedValue: function() {
		ControlMultipleBaseItemView.prototype.applySavedValue.apply( this, arguments );

		var url = this.getControlValue( 'url' );
		var type = this.getControlValue( 'type' );

		// If entity mode, don't show URL in input
		if ( type && type !== 'custom' ) {
			this.ui.searchInput.val( '' );
		} else if ( url ) {
			this.ui.searchInput.val( url );
		}
	},

	// Override to handle custom URL changes from the input
	updateElementModel: function( event ) {
		var key = event.currentTarget.dataset.setting;

		if ( key === 'url' ) {
			var val = this.getInputValue( event.currentTarget );

			// Only update if not in entity mode
			if ( ! this._entityMode ) {
				this.setValue( {
					type: 'custom',
					id: '',
					url: val,
					label: ''
				} );
			}
			return;
		}

		ControlMultipleBaseItemView.prototype.updateElementModel.apply( this, arguments );
	},

	onBeforeDestroy: function() {
		this._unbindOutsideClick();
		if ( this._searchXhr ) {
			this._searchXhr.abort();
		}
	}
} );

module.exports = ControlUrlItemView;

},{"elementor-views/controls/base-multiple":94}],118:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlWPWidgetItemView;

ControlWPWidgetItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.form = 'form';
		ui.loading = '.wp-widget-form-loading';

		return ui;
	},

	events: {
		'keyup @ui.form :input': 'onFormChanged',
		'change @ui.form :input': 'onFormChanged'
	},

	onFormChanged: function() {
		var idBase = 'widget-' + this.model.get( 'id_base' ),
			settings = this.ui.form.elementorSerializeObject()[ idBase ].REPLACE_TO_ID;

		this.setValue( settings );
	},

	onReady: function() {
		/*
		elementor.ajax.send( 'editor_get_wp_widget_form', {
			data: {
				widget_type: this.model.get( 'widget' ),
				data: JSON.stringify( this.elementSettingsModel.toJSON() )
			},
			success: _.bind( function( data ) {
				this.ui.form.html( data );
			}, this )
		} );
		*/
	}
} );

module.exports = ControlWPWidgetItemView;

},{"elementor-views/controls/base":96}],119:[function(require,module,exports){
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlWysiwygItemView;

ControlWysiwygItemView = ControlBaseItemView.extend( {

	childEvents: {
		'keyup textarea.elementor-wp-editor': 'updateElementModel'
	},

	initialize: function() {
		ControlBaseItemView.prototype.initialize.apply( this, arguments );
		this.editorID = 'elementorwpeditor' + this.cid;

	},
	
	attachElContent: function() {
		var editorTemplate = elementor.config.wp_editor.replace( /elementorwpeditor/g, this.editorID ).replace( '%%EDITORCONTENT%%', this.getControlValue() );

		this.$el.html( editorTemplate );

		return this;
	},

	onShow: function() {
		tinymce.EditorManager.execCommand('mceAddEditor', false, this.editorID);
	},

	onBeforeDestroy: function() {
		tinymce.EditorManager.execCommand( 'mceRemoveEditor', true, this.editorID);
	}
} );

module.exports = ControlWysiwygItemView;

},{"elementor-views/controls/base":96}],120:[function(require,module,exports){
var ElementEmptyView;

ElementEmptyView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-empty-preview',

	className: 'elementor-empty-view',

	events: {
		'click': 'onClickAdd'
	},

	onClickAdd: function() {
		elementor.getPanelView().setPage( 'elements' );
	}
} );

module.exports = ElementEmptyView;

},{}],121:[function(require,module,exports){
var BaseElementView = require( 'elementor-views/base-element' ),
	ColumnView = require( 'elementor-views/column' ),
	SectionView;

SectionView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-element-section-content' ),

	childView: ColumnView,

	className: function() {
		var classes = 'elementor-section',
			type = this.isInner() ? 'inner' : 'top';

		classes += ' elementor-' + type + '-section';

		return classes;
	},

	tagName: 'section',

	childViewContainer: '> .elementor-container > .elementor-row',

	triggers: {
		'click .elementor-editor-section-settings-list .elementor-editor-element-edit': 'click:edit',
		'click .elementor-editor-section-settings-list .elementor-editor-element-trigger': 'click:edit',
		'click .elementor-editor-section-settings-list .elementor-editor-element-duplicate': 'click:duplicate'
	},

	elementEvents: {
		'click .elementor-editor-section-settings-list .elementor-editor-element-remove': 'onClickRemove',
		'click .elementor-editor-section-settings-list .elementor-editor-element-save': 'onClickSave'
	},

	behaviors: {
		Sortable: {
			behaviorClass: require( 'elementor-behaviors/sortable' ),
			elChildType: 'column'
		},
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

		this.listenTo( this.collection, 'add remove reset', this._checkIsFull );
		this.listenTo( this.collection, 'remove', this.onCollectionRemove );
		this.listenTo( this.model, 'change:settings:structure', this.onStructureChanged );
	},

	addEmptyColumn: function() {
		this.addChildModel( {
			id: elementor.helpers.getUniqueID(),
			elType: 'column',
			settings: {},
			elements: []
		} );
	},

	addChildModel: function( model, options ) {
		var isModelInstance = model instanceof Backbone.Model,
			isInner = this.isInner();

		if ( isModelInstance ) {
			model.set( 'isInner', isInner );
		} else {
			model.isInner = isInner;
		}

		return BaseElementView.prototype.addChildModel.apply( this, arguments );
	},

	getSortableOptions: function() {
		var sectionConnectClass = this.isInner() ? '.elementor-inner-section' : '.elementor-top-section';

		return {
			connectWith: sectionConnectClass + ' > .elementor-container > .elementor-row',
			handle: '> .elementor-element-overlay .elementor-editor-column-settings-list .elementor-editor-element-trigger',
			items: '> .elementor-column'
		};
	},

	getColumnPercentSize: function( element, size ) {
		return size / element.parent().width() * 100;
	},

	getDefaultStructure: function() {
		return this.collection.length + '0';
	},

	getStructure: function() {
		return this.model.getSetting( 'structure' );
	},

	setStructure: function( structure ) {
		var parsedStructure = elementor.presetsFactory.getParsedStructure( structure );

		if ( +parsedStructure.columnsCount !== this.collection.length ) {
			throw new TypeError( 'The provided structure doesn\'t match the columns count.' );
		}

		this.model.setSetting( 'structure', structure, true );
	},

	redefineLayout: function() {
		var preset = elementor.presetsFactory.getPresetByStructure( this.getStructure() );

		this.collection.each( function( model, index ) {
			model.setSetting( '_column_size', preset.preset[ index ] );
			model.setSetting( '_inline_size', null );
		} );

		this.children.invoke( 'changeSizeUI' );
	},

	resetLayout: function() {
		this.setStructure( this.getDefaultStructure() );
	},

	resetColumnsCustomSize: function() {
		this.collection.each( function( model ) {
			model.setSetting( '_inline_size', null );
		} );

		this.children.invoke( 'changeSizeUI' );
	},

	isCollectionFilled: function() {
		var MAX_SIZE = 10,
			columnsCount = this.collection.length;

		return ( MAX_SIZE <= columnsCount );
	},

	_checkIsFull: function() {
		this.$el.toggleClass( 'elementor-section-filled', this.isCollectionFilled() );
	},

	_checkIsEmpty: function() {
		if ( ! this.collection.length ) {
			this.addEmptyColumn();
		}
	},

	getNextColumn: function( columnView ) {
		var modelIndex = this.collection.indexOf( columnView.model ),
			nextModel = this.collection.at( modelIndex + 1 );

		return this.children.findByModelCid( nextModel.cid );
	},

	onBeforeRender: function() {
		this._checkIsEmpty();
	},

	onRender: function() {
		this._checkIsFull();
	},

	onAddChild: function() {
		if ( ! this.isBuffering ) {
			// Reset the layout just when we have really add/remove element.
			this.resetLayout();
		}
	},

	onCollectionRemove: function() {
		// If it's the last column, please create new one.
		this._checkIsEmpty();

		this.resetLayout();
	},

	onChildviewRequestResizeStart: function( childView ) {
		var nextChildView = this.getNextColumn( childView );

		if ( ! nextChildView ) {
			return;
		}

		var $iframes = childView.$el.find( 'iframe' ).add( nextChildView.$el.find( 'iframe' ) );

		elementor.helpers.disableElementEvents( $iframes );
	},

	onChildviewRequestResizeStop: function( childView ) {
		var nextChildView = this.getNextColumn( childView );

		if ( ! nextChildView ) {
			return;
		}

		var $iframes = childView.$el.find( 'iframe' ).add( nextChildView.$el.find( 'iframe' ) );

		elementor.helpers.enableElementEvents( $iframes );
	},

	onChildviewRequestResize: function( childView, ui ) {
		// Get current column details
		var currentSize = childView.model.getSetting( '_inline_size' );

		if ( ! currentSize ) {
			currentSize = this.getColumnPercentSize( ui.element, ui.originalSize.width );
		}

		var newSize = this.getColumnPercentSize( ui.element, ui.size.width ),
			difference = newSize - currentSize;

		ui.element.css( {
			//width: currentSize + '%',
			width: '',
			left: 'initial' // Fix for RTL resizing
		} );

		// Get next column details
		var nextChildView = this.getNextColumn( childView );

		if ( ! nextChildView ) {
			return;
		}

		var MINIMUM_COLUMN_SIZE = 10,

			$nextElement = nextChildView.$el,
			nextElementCurrentSize = this.getColumnPercentSize( $nextElement, $nextElement.width() ),
			nextElementNewSize = nextElementCurrentSize - difference;

		if ( newSize < MINIMUM_COLUMN_SIZE || newSize > 100 || ! difference || nextElementNewSize < MINIMUM_COLUMN_SIZE || nextElementNewSize > 100 ) {
			return;
		}

		// Set the current column size
		childView.model.setSetting( '_inline_size', newSize.toFixed( 3 ) );
		childView.changeSizeUI();

		// Set the next column size
		nextChildView.model.setSetting( '_inline_size', nextElementNewSize.toFixed( 3 ) );
		nextChildView.changeSizeUI();
	},

	onStructureChanged: function() {
		this.redefineLayout();
	},

	onClickSave: function( event ) {
		event.preventDefault();

		var sectionID = this.model.get( 'id' );

		elementor.templates.startModal( function() {
			elementor.templates.getLayout().showSaveTemplateView( sectionID );
		} );
	},

	getContextMenuGroups() {
		const groups = [];

		const $settings = this.$el.find(
			'> .elementor-element-overlay .elementor-editor-element-settings'
		);

		if ($settings.length) {
			const actions = [];
			actions.push({
				name: 'edit',
				title: (elementor.translate ? elementor.translate('Edit Section') : 'Edit Section'),
				icon: '<i class="eicon-edit"></i>',
				callback: () => {
					this.triggerMethod('click:edit');
				},
			});

			const $duplicate = $settings.find('.elementor-editor-element-duplicate');
			const $remove = $settings.find('.elementor-editor-element-remove');
			const $template = this.$el.find('.elementor-editor-element-save');

			if ($duplicate.length) {
				actions.push({
					name: 'duplicate',
					icon: '<i class="fa fa-copy"></i>',
					title: elementor.translate ? elementor.translate('Duplicate') : 'Duplicate',
					callback: () => {
						$duplicate.trigger('click');
					},
				});
			}

			if ($template.length) {
				actions.push({
					name: 'save-as-template',
					icon: '<i class="fa fa-save"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate('Save as Template') : 'Save as Template',
					callback: () => {
						$template.trigger('click');
					},
				});
			}

			if ($remove.length) {
				actions.push({
					name: 'delete',
					icon: '<i class="fa fa-trash"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate('Delete') : 'Supprimer',
					callback: () => {
						$remove.trigger('click');
					},
				});
			}

			if (actions.length) {
				groups.push({
					name: 'element',
					actions,
				});
			}
		}

		return groups;
	},
} );

module.exports = SectionView;

},{"elementor-behaviors/context-menu":1,"elementor-behaviors/duplicate":2,"elementor-behaviors/elements-relation":3,"elementor-behaviors/handle-duplicate":4,"elementor-behaviors/handle-edit-mode":5,"elementor-behaviors/handle-editor":6,"elementor-behaviors/sortable":8,"elementor-views/base-element":89,"elementor-views/column":90}],122:[function(require,module,exports){
var SectionView = require( 'elementor-views/section' ),
	SectionsCollectionView;

SectionsCollectionView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-preview' ),

	id: 'elementor-inner',

	childViewContainer: '#elementor-section-wrap',

	childView: SectionView,

	ui: {
		addSectionArea: '#elementor-add-section',
		addNewSection: '#elementor-add-new-section',
		closePresetsIcon: '#elementor-select-preset-close',
		addSectionButton: '#elementor-add-section-button',
		addTemplateButton: '#elementor-add-template-button',
		selectPreset: '#elementor-select-preset',
		presets: '.elementor-preset'
	},

	events: {
		'click @ui.addSectionButton': 'onAddSectionButtonClick',
		'click @ui.addTemplateButton': 'onAddTemplateButtonClick',
		'click @ui.closePresetsIcon': 'closeSelectPresets',
		'click @ui.presets': 'onPresetSelected'
	},

	behaviors: {
		Sortable: {
			behaviorClass: require( 'elementor-behaviors/sortable' ),
			elChildType: 'section'
		},
		HandleDuplicate: {
			behaviorClass: require( 'elementor-behaviors/handle-duplicate' )
		},
		HandleAdd: {
			behaviorClass: require( 'elementor-behaviors/duplicate' )
		},
		HandleElementsRelation: {
			behaviorClass: require( 'elementor-behaviors/elements-relation' )
		}
	},

	getSortableOptions: function() {
		return {
			handle: '> .elementor-element-overlay .elementor-editor-section-settings-list .elementor-editor-element-trigger',
			items: '> .elementor-section'
		};
	},

	getChildType: function() {
		return [ 'section' ];
	},

	isCollectionFilled: function() {
		return false;
	},

	initialize: function() {
		this
			.listenTo( this.collection, 'add remove reset', this.onCollectionChanged )
			.listenTo( elementor.channels.panelElements, 'element:drag:start', this.onPanelElementDragStart )
			.listenTo( elementor.channels.panelElements, 'element:drag:end', this.onPanelElementDragEnd );
	},

	addChildModel: function( model, options ) {
		return this.collection.add( model, options, true );
	},

	addSection: function( properties ) {
		var newSection = {
			id: elementor.helpers.getUniqueID(),
			elType: 'section',
			settings: {},
			elements: []
		};

		if ( properties ) {
			_.extend( newSection, properties );
		}

		var newModel = this.addChildModel( newSection );

		return this.children.findByModelCid( newModel.cid );
	},

	closeSelectPresets: function() {
		this.ui.addNewSection.show();
		this.ui.selectPreset.hide();
	},

	fixBlankPageOffset: function() {
		var sectionHandleHeight = 27,
			elTopOffset = this.$el.offset().top,
			elTopOffsetRange = sectionHandleHeight - elTopOffset;

		if ( 0 < elTopOffsetRange ) {
			var $style = Backbone.$( '<style>' ).text( '.elementor-editor-active #elementor-inner{margin-top: ' + elTopOffsetRange + 'px}' );

			elementor.$previewContents.children().children( 'head' ).append( $style );
		}
	},

	onAddSectionButtonClick: function() {
		this.ui.addNewSection.hide();
		this.ui.selectPreset.show();
	},

	onAddTemplateButtonClick: function() {
		elementor.templates.startModal( function() {
			elementor.templates.showTemplates();
		} );
	},

	onRender: function() {
		var self = this;

		self.ui.addSectionArea.html5Droppable( {
			axis: [ 'vertical' ],
			groups: [ 'elementor-element' ],
			onDragEnter: function( side ) {
				self.ui.addSectionArea.attr( 'data-side', side );
			},
			onDragLeave: function() {
				self.ui.addSectionArea.removeAttr( 'data-side' );
			},
			onDropping: function() {
				var elementView = elementor.channels.panelElements.request( 'element:selected' ),
					newSection = self.addSection(),
					elType = elementView.model.get( 'elType' );

				var elementData = {
					id: elementor.helpers.getUniqueID(),
					elType: elType
				};

				if ( 'widget' === elType ) {
					elementData.widgetType = elementView.model.get( 'widgetType' );
				} else {
					elementData.elements = [];
					elementData.isInner = true;
				}

				newSection.triggerMethod( 'request:add', elementData );
			}
		} );

		_.defer( _.bind( self.fixBlankPageOffset, this ) );
	},

	onCollectionChanged: function() {
		elementor.setFlagEditorChange( true );
	},

	onPresetSelected: function( event ) {
		this.closeSelectPresets();

		var selectedStructure = event.currentTarget.dataset.structure,
			parsedStructure = elementor.presetsFactory.getParsedStructure( selectedStructure ),
			elements = [],
			loopIndex;

		for ( loopIndex = 0; loopIndex < parsedStructure.columnsCount; loopIndex++ ) {
			elements.push( {
				id: elementor.helpers.getUniqueID(),
				elType: 'column',
				settings: {},
				elements: []
			} );
		}

		var newSection = this.addSection( { elements: elements } );

		newSection.setStructure( selectedStructure );
		newSection.redefineLayout();
	},

	onPanelElementDragStart: function() {
		elementor.helpers.disableElementEvents( this.$el.find( 'iframe' ) );
	},

	onPanelElementDragEnd: function() {
		elementor.helpers.enableElementEvents( this.$el.find( 'iframe' ) );
	}
} );

module.exports = SectionsCollectionView;

},{"elementor-behaviors/duplicate":2,"elementor-behaviors/elements-relation":3,"elementor-behaviors/handle-duplicate":4,"elementor-behaviors/sortable":8,"elementor-views/section":121}],123:[function(require,module,exports){
var BaseElementView = require( 'elementor-views/base-element' ),
	WidgetView;

WidgetView = BaseElementView.extend( {
	_templateType: null,

	getTemplate: function() {
		if ( 'remote' !== this.getTemplateType() ) {
			return Marionette.TemplateCache.get( '#tmpl-elementor-' + this.model.get( 'elType' ) + '-' + this.model.get( 'widgetType' ) + '-content' );
		} else {
			return _.template( '' );
		}
	},

	className: function() {
		return 'elementor-widget elementor-widget-' + this.model.get( 'widgetType' );
	},

	modelEvents: {
		'before:remote:render': 'onModelBeforeRemoteRender',
		'remote:render': 'onModelRemoteRender'
	},

	triggers: {
		'click': {
			event: 'click:edit',
			stopPropagation: false
		},
		'click > .elementor-editor-element-settings .elementor-editor-add-element': 'click:add',
		'click > .elementor-editor-element-settings .elementor-editor-element-duplicate': 'click:duplicate'
	},

	elementEvents: {
		'click > .elementor-editor-element-settings .elementor-editor-element-remove': 'onClickRemove'
	},

	behaviors: {
		HandleEditor: {
			behaviorClass: require( 'elementor-behaviors/handle-editor' )
		},
		HandleEditMode: {
			behaviorClass: require( 'elementor-behaviors/handle-edit-mode' )
		},
		ContextMenu: {
			behaviorClass: require( 'elementor-behaviors/context-menu' )
		}
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		if ( 'remote' === this.getTemplateType() &&  ! this.model.getHtmlCache() ) {
			this.model.renderRemoteServer();
		}
	},

	getTemplateType: function() {
		if ( null === this._templateType ) {
			var $template = Backbone.$( '#tmpl-elementor-' + this.model.get( 'elType' ) + '-' + this.model.get( 'widgetType' ) + '-content' );

			if ( 0 === $template.length ) {
				this._templateType = 'remote';
			} else {
				this._templateType = 'js';
			}
		}

		return this._templateType;
	},

	onModelBeforeRemoteRender: function() {
		this.$el.addClass( 'elementor-loading' );
	},

	onBeforeDestroy: function() {
		// Parent handles $stylesheetElement and $customCSSElement cleanup
		BaseElementView.prototype.onBeforeDestroy.apply( this, arguments );
	},

	onModelRemoteRender: function() {
		if ( this.isDestroyed ) {
			return;
		}

		this.$el.removeClass( 'elementor-loading' );
		this.render();
	},

	attachElContent: function( html ) {
		var htmlCache = this.model.getHtmlCache();

		if ( htmlCache ) {
			html = htmlCache;
		}

		//this.$el.html( html );
		_.defer( _.bind( function() {
			elementorFrontend.getScopeWindow().jQuery( '#' + this.getElementUniqueClass() ).html( html );
		}, this ) );

		return this;
	},

	onRender: function() {
		var self = this;

		self.$el
			.removeClass( 'elementor-widget-empty' )
			.children( '.elementor-widget-empty-icon' )
			.remove();

		//self.$el.imagesLoaded().always( function() {

		//setTimeout( function() {
				//	if ( 1 > self.$el.height() ) {
					//	self.$el.addClass( 'elementor-widget-empty' );

					// TODO: REMOVE THIS !!
					// TEMP CODING !!
					//	self.$el.append( '<i class="elementor-widget-empty-icon eicon-' + self.model.getIcon() + '"></i>' );
					//	}
				//}, 200 );
			// Is element empty?
		//} );
	},
	getContextMenuGroups() {
		const groups = [];

		const $settings = this.$el.find(
			'.elementor-editor-element-settings'
		);

		if ($settings.length) {
			const actions = [];

			const elementTitle = $settings.attr('data-title') || 'Widget';

			actions.push({
			    name: 'edit',
			    title: (elementor.translate ? elementor.translate('Edit') : 'Edit') + ' ' + elementTitle,
			    icon: '<i class="eicon-edit"></i>',
			    callback: () => {
			        this.triggerMethod('click:edit');
			    },
			});

			const $duplicate = $settings.find('.elementor-editor-element-duplicate');
			const $remove = $settings.find('.elementor-editor-element-remove');

			if ($duplicate.length) {
				actions.push({
					name: 'duplicate',
					icon: '<i class="fa fa-copy"></i>',
					title: elementor.translate ? elementor.translate('Duplicate') : 'Duplicate',
					callback: () => {
						$duplicate.trigger('click');
					},
				});
			}

			actions.push(
				require( 'elementor-utils/actions/copy' )( this, {
					separator: 'before',
				})
			);

			actions.push(
				require( 'elementor-utils/actions/paste-styles' )( this)
			);

			// --- Style Library actions ---
			var widgetView = this;
			var widgetType = this.model.get( 'widgetType' );

			// "Save styles as..."
			actions.push( {
				name: 'save_style_as',
				icon: '<i class="fa fa-floppy-o"></i>',
				separator: 'before',
				title: elementor.translate ? elementor.translate( 'save_style_as' ) : 'Save styles as...',
				callback: function() {
					var settingsModel = widgetView.model.get( 'settings' );
					var settings = settingsModel && typeof settingsModel.toJSON === 'function'
						? settingsModel.toJSON()
						: {};

					elementor.styleLibrary.startModal( function() {
						elementor.styleLibrary.showSaveStyleView( widgetType, settings );
					} );
				}
			} );

			// "Use style" — list available styles for this widget type
			var widgetStyles = elementor.styleLibrary.getStylesForWidget( widgetType );

			if ( widgetStyles.length ) {
				widgetStyles.forEach( function( styleModel, index ) {
					var styleName = styleModel.get( 'name' );
					var isDefault = styleModel.get( 'is_default' );

					actions.push( {
						name: 'use_style_' + styleModel.get( 'id_widget_style' ),
						icon: isDefault
							? '<i class="fa fa-star"></i>'
							: '<i class="fa fa-paint-brush"></i>',
						title: styleName,
						callback: function() {
							elementor.styleLibrary.applyStyle( styleModel, widgetView.model );
						}
					} );
				} );
			} else {
				actions.push( {
					name: 'no_styles',
					icon: '<i class="fa fa-paint-brush"></i>',
					title: elementor.translate ? elementor.translate( 'no_styles_for_widget' ) : 'No saved styles',
					callback: function() {}
				} );
			}

			if ($remove.length) {
				actions.push({
					name: 'delete',
					icon: '<i class="fa fa-trash"></i>',
					separator: 'before',
					title: elementor.translate ? elementor.translate('Delete') : 'Supprimer',
					callback: () => {
						$remove.trigger('click');
					},
				});
			}

			if (actions.length) {
				groups.push({
					name: 'element',
					actions,
				});
			}
		}

		return groups;
	},
} );

module.exports = WidgetView;

},{"elementor-behaviors/context-menu":1,"elementor-behaviors/handle-edit-mode":5,"elementor-behaviors/handle-editor":6,"elementor-utils/actions/copy":78,"elementor-utils/actions/paste-styles":79,"elementor-views/base-element":89}]},{},[83,84,45])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9iZWhhdmlvcnMvY29udGV4dC1tZW51LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvYmVoYXZpb3JzL2R1cGxpY2F0ZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2JlaGF2aW9ycy9lbGVtZW50cy1yZWxhdGlvbi5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2JlaGF2aW9ycy9oYW5kbGUtZHVwbGljYXRlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvYmVoYXZpb3JzL2hhbmRsZS1lZGl0LW1vZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9iZWhhdmlvcnMvaGFuZGxlLWVkaXRvci5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2JlaGF2aW9ycy9yZXNpemFibGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9iZWhhdmlvcnMvc29ydGFibGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9iZWhhdmlvcnMvdGFicy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvY29udGV4dC1tZW51LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy9uYXZpZ2F0b3IuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3N0eWxlLWxpYnJhcnkvY29sbGVjdGlvbnMvc3R5bGVzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy9zdHlsZS1saWJyYXJ5L21hbmFnZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3N0eWxlLWxpYnJhcnkvbW9kZWxzL3N0eWxlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy9zdHlsZS1saWJyYXJ5L3ZpZXdzL2xheW91dC5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9oZWFkZXItbG9hZC5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9oZWFkZXItbG9nby5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9oZWFkZXItc2F2ZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9oZWFkZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3N0eWxlLWxpYnJhcnkvdmlld3MvcGFydHMvbG9hZC1zdHlsZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9sb2FkaW5nLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy9zdHlsZS1saWJyYXJ5L3ZpZXdzL3BhcnRzL3NhdmUtc3R5bGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3N0eWxlLWxpYnJhcnkvdmlld3MvcGFydHMvc3R5bGUtaXRlbS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvc3R5bGUtbGlicmFyeS92aWV3cy9wYXJ0cy9zdHlsZXMtZW1wdHkuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3N0eWxlLWxpYnJhcnkvdmlld3MvcGFydHMvc3R5bGVzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L2NvbGxlY3Rpb25zL3RlbXBsYXRlcy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvdGVtcGxhdGUtbGlicmFyeS9tYW5hZ2VyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L21vZGVscy90ZW1wbGF0ZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvdGVtcGxhdGUtbGlicmFyeS92aWV3cy9sYXlvdXQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL2JhY2suanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL2xvYWQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL2xvZ28uanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL21lbnUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL3ByZXZpZXcuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLXBhcnRzL3NhdmUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvaGVhZGVyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L3ZpZXdzL3BhcnRzL2xvYWQtdGVtcGxhdGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvbG9hZGluZy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvdGVtcGxhdGUtbGlicmFyeS92aWV3cy9wYXJ0cy9wcmV2aWV3LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L3ZpZXdzL3BhcnRzL3NhdmUtdGVtcGxhdGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9jb21wb25lbnRzL3RlbXBsYXRlLWxpYnJhcnkvdmlld3MvcGFydHMvdGVtcGxhdGVzLWVtcHR5LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L3ZpZXdzL3BhcnRzL3RlbXBsYXRlcy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2NvbXBvbmVudHMvdGVtcGxhdGUtbGlicmFyeS92aWV3cy90ZW1wbGF0ZS9iYXNlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvY29tcG9uZW50cy90ZW1wbGF0ZS1saWJyYXJ5L3ZpZXdzL3RlbXBsYXRlL2xvY2FsLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvZWRpdG9yLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9lZGl0LW1vZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL2Zvb3Rlci5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvaGVhZGVyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9lZGl0b3IuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL2VsZW1lbnRzL2NvbGxlY3Rpb25zL2NhdGVnb3JpZXMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL2VsZW1lbnRzL2NvbGxlY3Rpb25zL2VsZW1lbnRzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9lbGVtZW50cy9lbGVtZW50cy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvcGFnZXMvZWxlbWVudHMvbW9kZWxzL2VsZW1lbnQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL2VsZW1lbnRzL3ZpZXdzL2NhdGVnb3JpZXMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL2VsZW1lbnRzL3ZpZXdzL2NhdGVnb3J5LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9lbGVtZW50cy92aWV3cy9lbGVtZW50LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9lbGVtZW50cy92aWV3cy9lbGVtZW50cy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvcGFnZXMvZWxlbWVudHMvdmlld3MvbGFuZ3VhZ2VzZWxlY3Rvci5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvcGFnZXMvZWxlbWVudHMvdmlld3Mvc2VhcmNoLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9tZW51L21lbnUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL21lbnUvdmlld3MvaXRlbS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvcGFnZXMvcmV2aXNpb25zLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9zY2hlbWVzL2Jhc2UuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL3NjaGVtZXMvY29sb3JzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9zY2hlbWVzL2Rpc2FibGVkLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYWdlcy9zY2hlbWVzL2l0ZW1zL2Jhc2UuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL3NjaGVtZXMvaXRlbXMvY29sb3IuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9sYXlvdXRzL3BhbmVsL3BhZ2VzL3NjaGVtZXMvaXRlbXMvdHlwb2dyYXBoeS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvcGFnZXMvc2NoZW1lcy90eXBvZ3JhcGh5LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbGF5b3V0cy9wYW5lbC9wYW5lbC5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL2xheW91dHMvcGFuZWwvdG9wYmFyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbW9kZWxzL2Jhc2Utc2V0dGluZ3MuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9tb2RlbHMvY29sdW1uLXNldHRpbmdzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbW9kZWxzL2VsZW1lbnQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9tb2RlbHMvcm93LXNldHRpbmdzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvbW9kZWxzL3NlY3Rpb24tc2V0dGluZ3MuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci9tb2RlbHMvd2lkZ2V0LXNldHRpbmdzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvdXRpbHMvYWN0aW9ucy9jb3B5LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvdXRpbHMvYWN0aW9ucy9wYXN0ZS1zdHlsZXMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci91dGlscy9hamF4LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3IvdXRpbHMvaGVscGVycy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL2ludHJvZHVjdGlvbi5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL2pxdWVyeS1odG1sNS1kbmQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci91dGlscy9qcXVlcnktc2VyaWFsaXplLW9iamVjdC5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL21vZGFscy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL3ByZXNldHMtZmFjdG9yeS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL3NjaGVtZXMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci91dGlscy9zdHlsZXNoZWV0LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvYmFzZS1lbGVtZW50LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29sdW1uLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvYW5pbWF0aW9uLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvYXV0b2NvbXBsZXRlLXBvc3RzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvYXV0b2NvbXBsZXRlLXByb2R1Y3RzLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvYmFzZS1tdWx0aXBsZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2Jhc2UtdW5pdHMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9iYXNlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvYm94LXNoYWRvdy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2Nob29zZS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2NvZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9jb2xvci5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2RhdGV0aW1lLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvZGltZW5zaW9ucy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2ZvbnQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9nYWxsZXJ5LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvaWNvbi5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL2ltYWdlLWRpbWVuc2lvbnMuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9tZWRpYS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL2NvbnRyb2xzL3BvcG92ZXItdG9nZ2xlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvcmVwZWF0ZXItcm93LmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvcmVwZWF0ZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9zZWN0aW9uLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvc2VsZWN0LXNvcnQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy9zZWxlY3QyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvc2xpZGVyLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvc3RydWN0dXJlLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvY29udHJvbHMvdGV4dC1zaGFkb3cuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy91cmwuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy93cF93aWRnZXQuanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9jb250cm9scy93eXNpd3lnLmpzIiwidmlld3MvX2Rldi9qcy9lZGl0b3Ivdmlld3MvZWxlbWVudC1lbXB0eS5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL3NlY3Rpb24uanMiLCJ2aWV3cy9fZGV2L2pzL2VkaXRvci92aWV3cy9zZWN0aW9ucy5qcyIsInZpZXdzL19kZXYvanMvZWRpdG9yL3ZpZXdzL3dpZGdldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvcUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3bUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBDb250ZXh0TWVudUJlaGF2aW9yID0gTWFyaW9uZXR0ZS5CZWhhdmlvci5leHRlbmQoe1xuICAgIGV2ZW50czoge1xuICAgICAgICAvLyBPbiDDqWNvdXRlIGxlIGNsaWMgZHJvaXQgc3VyIGxhIHZ1ZSBlbnRpw6hyZSAodHUgcGV1eCByZXN0cmVpbmRyZSBzaSBiZXNvaW4pXG4gICAgICAgICdjb250ZXh0bWVudSc6ICdvbkNvbnRleHRNZW51JyxcbiAgICAgICAgJ2NsaWNrJzogJ29uQ2xpY2snLFxuICAgICAgICAna2V5ZG93bic6ICdvbktleURvd24nLFxuICAgIH0sXG5cbiAgICBvbkNsaWNrKGV2ZW50KSB7XG4gICAgICAgIGlmIChCYWNrYm9uZS4kKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmlxaXQtY29udGV4dC1tZW51JykubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJpZ2dlciBnbG9iYWwgcG91ciBmZXJtZXJcbiAgICAgICAgaWYgKGVsZW1lbnRvci5jaGFubmVscyAmJiBlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yKSB7XG4gICAgICAgICAgICBlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLnRyaWdnZXIoJ2NvbnRleHQtbWVudTpjbG9zZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uS2V5RG93bihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyB8fCBldmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRvci5jaGFubmVscyAmJiBlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvci50cmlnZ2VyKCdjb250ZXh0LW1lbnU6Y2xvc2UnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkNvbnRleHRNZW51KGV2ZW50KSB7XG5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMudmlldztcblxuICAgICAgICBpZiAodHlwZW9mIHZpZXcuZ2V0Q29udGV4dE1lbnVHcm91cHMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBHcm91cGVzIHByb3ByZXMgw6AgbGEgdnVlXG4gICAgICAgIGxldCBncm91cHMgPSB2aWV3LmdldENvbnRleHRNZW51R3JvdXBzKCkgfHwgW107XG5cbiAgICAgICAgaWYgKCFncm91cHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29vcmRzID0ge1xuICAgICAgICAgICAgY2xpZW50WDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFksXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVHJhbnNsYXRlciBsZXMgY29vcmRvbm7DqWVzIGRlIGwnaWZyYW1lIHZlcnMgbGEgZmVuw6p0cmUgcGFyZW50ZVxuICAgICAgICAvLyBMZXMgdnVlcyBNYXJpb25ldHRlIHRvdXJuZW50IGRhbnMgbGUgY29udGV4dGUgcGFyZW50IG1haXMgZ8OocmVudFxuICAgICAgICAvLyBkZXMgw6lsw6ltZW50cyBkYW5zIGwnaWZyYW1lIOKAlCB3aW5kb3cuZnJhbWVFbGVtZW50IGVzdCBkb25jIG51bGwuXG4gICAgICAgIC8vIE9uIHLDqWN1cMOocmUgbCdpZnJhbWUgdmlhIGVsZW1lbnRvci4kcHJldmlldyBvdSB2aWEgbGUgdGFyZ2V0IGRlIGwnw6l2w6luZW1lbnQuXG4gICAgICAgIHZhciBpZnJhbWVFbCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGVsZW1lbnRvciAmJiBlbGVtZW50b3IuJHByZXZpZXcgJiYgZWxlbWVudG9yLiRwcmV2aWV3Lmxlbmd0aCkge1xuICAgICAgICAgICAgaWZyYW1lRWwgPSBlbGVtZW50b3IuJHByZXZpZXdbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50ICYmIGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3KSB7XG4gICAgICAgICAgICB2YXIgaWZyYW1lV2luID0gZXZlbnQudGFyZ2V0Lm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG4gICAgICAgICAgICBpZiAoaWZyYW1lV2luLmZyYW1lRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGlmcmFtZUVsID0gaWZyYW1lV2luLmZyYW1lRWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpZnJhbWVFbCkge1xuICAgICAgICAgICAgdmFyIGlmcmFtZVJlY3QgPSBpZnJhbWVFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICBjbGllbnRYOiBldmVudC5jbGllbnRYICsgaWZyYW1lUmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgIGNsaWVudFk6IGV2ZW50LmNsaWVudFkgKyBpZnJhbWVSZWN0LnRvcCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBldmVudC5yZWFsQ2xpZW50WCA9IGNvb3Jkcy5jbGllbnRYO1xuICAgICAgICBldmVudC5yZWFsQ2xpZW50WSA9IGNvb3Jkcy5jbGllbnRZO1xuXG4gICAgICAgIC8vIE9uIGTDqWzDqGd1ZSBs4oCZYWZmaWNoYWdlIGF1IG1hbmFnZXIgdmlhIGxlIGNoYW5uZWwgZWRpdG9yXG4gICAgICAgIGlmIChlbGVtZW50b3IuY2hhbm5lbHMgJiYgZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvcikge1xuICAgICAgICAgICAgZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvci50cmlnZ2VyKCdjb250ZXh0LW1lbnU6b3BlbicsIHtcbiAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICB2aWV3LFxuICAgICAgICAgICAgICAgIGdyb3VwcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHRNZW51QmVoYXZpb3I7IiwidmFyIEhhbmRsZUFkZER1cGxpY2F0ZUJlaGF2aW9yO1xuXG5IYW5kbGVBZGREdXBsaWNhdGVCZWhhdmlvciA9IE1hcmlvbmV0dGUuQmVoYXZpb3IuZXh0ZW5kKCB7XG5cblx0b25DaGlsZHZpZXdDbGlja05ldzogZnVuY3Rpb24oIGNoaWxkVmlldyApIHtcblx0XHR2YXIgY3VycmVudEluZGV4ID0gY2hpbGRWaWV3LiRlbC5pbmRleCgpICsgMTtcblxuXHRcdHRoaXMuYWRkQ2hpbGQoIHsgYXQ6IGN1cnJlbnRJbmRleCB9ICk7XG5cdH0sXG5cblx0b25SZXF1ZXN0TmV3OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZENoaWxkKCk7XG5cdH0sXG5cblx0YWRkQ2hpbGQ6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdGlmICggdGhpcy52aWV3LmlzQ29sbGVjdGlvbkZpbGxlZCgpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0dmFyIG5ld0l0ZW0gPSB7XG5cdFx0XHRpZDogZWxlbWVudG9yLmhlbHBlcnMuZ2V0VW5pcXVlSUQoKSxcblx0XHRcdGVsVHlwZTogdGhpcy52aWV3LmdldENoaWxkVHlwZSgpWzBdLFxuXHRcdFx0c2V0dGluZ3M6IHt9LFxuXHRcdFx0ZWxlbWVudHM6IFtdXG5cdFx0fTtcblxuXHRcdHRoaXMudmlldy5hZGRDaGlsZE1vZGVsKCBuZXdJdGVtLCBvcHRpb25zICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGVBZGREdXBsaWNhdGVCZWhhdmlvcjtcbiIsInZhciBIYW5kbGVFbGVtZW50c1JlbGF0aW9uO1xuXG5IYW5kbGVFbGVtZW50c1JlbGF0aW9uID0gTWFyaW9uZXR0ZS5CZWhhdmlvci5leHRlbmQoIHtcblxuXHRvblJlcXVlc3RBZGQ6IGZ1bmN0aW9uKCBpdGVtRGF0YSwgb3B0aW9ucyApIHtcblx0XHR0aGlzLl9hZGRDaGlsZEVsZW1lbnQoIGl0ZW1EYXRhLCBvcHRpb25zICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBpdGVtRGF0YVxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2FkZENoaWxkRWxlbWVudDogZnVuY3Rpb24oIGl0ZW1EYXRhLCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0dmFyIG15Q2hpbGRUeXBlID0gdGhpcy52aWV3LmdldENoaWxkVHlwZSgpO1xuXG5cdFx0aWYgKCAtMSA9PT0gbXlDaGlsZFR5cGUuaW5kZXhPZiggaXRlbURhdGEuZWxUeXBlICkgKSB7XG5cdFx0XHRkZWxldGUgb3B0aW9ucy5hdDtcblxuXHRcdFx0dGhpcy52aWV3LmNoaWxkcmVuLmxhc3QoKS50cmlnZ2VyTWV0aG9kKCAncmVxdWVzdDphZGQnLCBpdGVtRGF0YSwgb3B0aW9ucyApO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG5ld01vZGVsID0gdGhpcy52aWV3LmFkZENoaWxkTW9kZWwoIGl0ZW1EYXRhLCBvcHRpb25zICksXG5cdFx0XHRuZXdWaWV3ID0gdGhpcy52aWV3LmNoaWxkcmVuLmZpbmRCeU1vZGVsKCBuZXdNb2RlbCApO1xuXG5cdFx0aWYgKCAnc2VjdGlvbicgPT09IG5ld1ZpZXcuZ2V0RWxlbWVudFR5cGUoKSAmJiBuZXdWaWV3LmlzSW5uZXIoKSApIHtcblx0XHRcdG5ld1ZpZXcuYWRkRW1wdHlDb2x1bW4oKTtcblx0XHR9XG5cblx0XHRuZXdWaWV3LnRyaWdnZXJNZXRob2QoICdvcGVuOmVkaXRvcicgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZUVsZW1lbnRzUmVsYXRpb247XG4iLCJ2YXIgSGFuZGxlRHVwbGljYXRlQmVoYXZpb3I7XG5cbkhhbmRsZUR1cGxpY2F0ZUJlaGF2aW9yID0gTWFyaW9uZXR0ZS5CZWhhdmlvci5leHRlbmQoIHtcblxuXHRvbkNoaWxkdmlld0NsaWNrRHVwbGljYXRlOiBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdGlmICggdGhpcy52aWV3LmlzQ29sbGVjdGlvbkZpbGxlZCgpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBjdXJyZW50SW5kZXggPSB0aGlzLnZpZXcuY29sbGVjdGlvbi5pbmRleE9mKCBjaGlsZFZpZXcubW9kZWwgKSxcblx0XHRcdG5ld01vZGVsID0gY2hpbGRWaWV3Lm1vZGVsLmNsb25lKCk7XG5cblx0XHR0aGlzLnZpZXcuYWRkQ2hpbGRNb2RlbCggbmV3TW9kZWwsIHsgYXQ6IGN1cnJlbnRJbmRleCB9ICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGVEdXBsaWNhdGVCZWhhdmlvcjsiLCJ2YXIgSGFuZGxlRWRpdE1vZGVCZWhhdmlvcjtcblxuSGFuZGxlRWRpdE1vZGVCZWhhdmlvciA9IE1hcmlvbmV0dGUuQmVoYXZpb3IuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5kYXRhRWRpdE1vZGUsICdzd2l0Y2gnLCB0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCApO1xuXHR9LFxuXG5cdG9uRWRpdE1vZGVTd2l0Y2hlZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YUVkaXRNb2RlLnJlcXVlc3QoICdhY3RpdmVNb2RlJyApO1xuXG5cdFx0dGhpcy52aWV3LiRlbC50b2dnbGVDbGFzcyggJ2VsZW1lbnRvci1hY3RpdmUtbW9kZScsICdwcmV2aWV3JyAhPT0gYWN0aXZlTW9kZSApO1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlRWRpdE1vZGVCZWhhdmlvcjtcbiIsInZhciBIYW5kbGVFZGl0b3JCZWhhdmlvcjtcblxuSGFuZGxlRWRpdG9yQmVoYXZpb3IgPSBNYXJpb25ldHRlLkJlaGF2aW9yLmV4dGVuZCgge1xuXG5cdG9uQ2xpY2tFZGl0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYWN0aXZlTW9kZSA9IGVsZW1lbnRvci5jaGFubmVscy5kYXRhRWRpdE1vZGUucmVxdWVzdCggJ2FjdGl2ZU1vZGUnICk7XG5cblx0XHRpZiAoICdwcmV2aWV3JyA9PT0gYWN0aXZlTW9kZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLm9uT3BlbkVkaXRvcigpO1xuXHR9LFxuXG5cdG9uT3BlbkVkaXRvcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGN1cnJlbnRQYW5lbFBhZ2VOYW1lID0gZWxlbWVudG9yLmdldFBhbmVsVmlldygpLmdldEN1cnJlbnRQYWdlTmFtZSgpO1xuXG5cdFx0aWYgKCAnZWRpdG9yJyA9PT0gY3VycmVudFBhbmVsUGFnZU5hbWUgKSB7XG5cdFx0XHR2YXIgY3VycmVudFBhbmVsUGFnZVZpZXcgPSBlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuZ2V0Q3VycmVudFBhZ2VWaWV3KCksXG5cdFx0XHRcdGN1cnJlbnRFZGl0YWJsZU1vZGVsID0gY3VycmVudFBhbmVsUGFnZVZpZXcubW9kZWw7XG5cblx0XHRcdGlmICggY3VycmVudEVkaXRhYmxlTW9kZWwgPT09IHRoaXMudmlldy5tb2RlbCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBlbGVtZW50RGF0YSA9IGVsZW1lbnRvci5nZXRFbGVtZW50RGF0YSggdGhpcy52aWV3Lm1vZGVsICk7XG5cblx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuc2V0UGFnZSggJ2VkaXRvcicsIGVsZW1lbnRvci50cmFuc2xhdGUoICdlZGl0X2VsZW1lbnQnLCBbIGVsZW1lbnREYXRhLnRpdGxlIF0gKSwge1xuXHRcdFx0bW9kZWw6IHRoaXMudmlldy5tb2RlbCxcblx0XHRcdGVkaXRlZEVsZW1lbnRWaWV3OiB0aGlzLnZpZXdcblx0XHR9ICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGVFZGl0b3JCZWhhdmlvcjtcbiIsInZhciBSZXNpemFibGVCZWhhdmlvcjtcblxuUmVzaXphYmxlQmVoYXZpb3IgPSBNYXJpb25ldHRlLkJlaGF2aW9yLmV4dGVuZCgge1xuXHRkZWZhdWx0czoge1xuXHRcdGhhbmRsZXM6IGVsZW1lbnRvci5jb25maWcuaXNfcnRsID8gJ3cnIDogJ2UnXG5cdH0sXG5cblx0dWk6IHtcblx0XHRjb2x1bW5UaXRsZTogJy5jb2x1bW4tdGl0bGUnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0cmVzaXplc3RhcnQ6ICdvblJlc2l6ZVN0YXJ0Jyxcblx0XHRyZXNpemVzdG9wOiAnb25SZXNpemVTdG9wJyxcblx0XHRyZXNpemU6ICdvblJlc2l6ZSdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRNYXJpb25ldHRlLkJlaGF2aW9yLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5kYXRhRWRpdE1vZGUsICdzd2l0Y2gnLCB0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCApO1xuXHR9LFxuXG5cdGFjdGl2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG9wdGlvbnMgPSBfLmNsb25lKCB0aGlzLm9wdGlvbnMgKTtcblxuXHRcdGRlbGV0ZSBvcHRpb25zLmJlaGF2aW9yQ2xhc3M7XG5cblx0XHR2YXIgJGNoaWxkVmlld0NvbnRhaW5lciA9IHRoaXMuZ2V0Q2hpbGRWaWV3Q29udGFpbmVyKCksXG5cdFx0XHRkZWZhdWx0UmVzaXphYmxlT3B0aW9ucyA9IHt9LFxuXHRcdFx0cmVzaXphYmxlT3B0aW9ucyA9IF8uZXh0ZW5kKCBkZWZhdWx0UmVzaXphYmxlT3B0aW9ucywgb3B0aW9ucyApO1xuXG5cdFx0JGNoaWxkVmlld0NvbnRhaW5lci5yZXNpemFibGUoIHJlc2l6YWJsZU9wdGlvbnMgKTtcblx0fSxcblxuXHRkZWFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZ2V0Q2hpbGRWaWV3Q29udGFpbmVyKCkucmVzaXphYmxlKCAnaW5zdGFuY2UnICkgKSB7XG5cdFx0XHR0aGlzLmdldENoaWxkVmlld0NvbnRhaW5lcigpLnJlc2l6YWJsZSggJ2Rlc3Ryb3knICk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uRWRpdE1vZGVTd2l0Y2hlZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YUVkaXRNb2RlLnJlcXVlc3QoICdhY3RpdmVNb2RlJyApO1xuXG5cdFx0aWYgKCAncHJldmlldycgIT09IGFjdGl2ZU1vZGUgKSB7XG5cdFx0XHR0aGlzLmFjdGl2ZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmRlYWN0aXZhdGUoKTtcblx0XHR9XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIENhbGwgdGhpcyBtZXRob2QgZnJvbSBvdGhlciB0aHJlYWQgKG5vbi1ibG9jayBVSSlcblx0XHRfLmRlZmVyKCBfLmJpbmQoIHRoaXMub25FZGl0TW9kZVN3aXRjaGVkLCB0aGlzICkgKTtcblx0fSxcblxuXHRvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVhY3RpdmF0ZSgpO1xuXHR9LFxuXG5cdG9uUmVzaXplU3RhcnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHRoaXMudmlldy50cmlnZ2VyTWV0aG9kKCAncmVxdWVzdDpyZXNpemU6c3RhcnQnICk7XG5cdH0sXG5cblx0b25SZXNpemVTdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR0aGlzLnZpZXcudHJpZ2dlck1ldGhvZCggJ3JlcXVlc3Q6cmVzaXplOnN0b3AnICk7XG5cdH0sXG5cblx0b25SZXNpemU6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR0aGlzLnZpZXcudHJpZ2dlck1ldGhvZCggJ3JlcXVlc3Q6cmVzaXplJywgdWkgKTtcblx0fSxcblxuXHRnZXRDaGlsZFZpZXdDb250YWluZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLiRlbDtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc2l6YWJsZUJlaGF2aW9yO1xuIiwidmFyIFNvcnRhYmxlQmVoYXZpb3I7XG5cblNvcnRhYmxlQmVoYXZpb3IgPSBNYXJpb25ldHRlLkJlaGF2aW9yLmV4dGVuZCgge1xuXHRkZWZhdWx0czoge1xuXHRcdGVsQ2hpbGRUeXBlOiAnd2lkZ2V0J1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdzb3J0c3RhcnQnOiAnb25Tb3J0U3RhcnQnLFxuXHRcdCdzb3J0cmVjZWl2ZSc6ICdvblNvcnRSZWNlaXZlJyxcblx0XHQnc29ydHVwZGF0ZSc6ICdvblNvcnRVcGRhdGUnLFxuXHRcdCdzb3J0c3RvcCc6ICdvblNvcnRTdG9wJyxcblx0XHQnc29ydG92ZXInOiAnb25Tb3J0T3ZlcicsXG5cdFx0J3NvcnRvdXQnOiAnb25Tb3J0T3V0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5kYXRhRWRpdE1vZGUsICdzd2l0Y2gnLCB0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlLCAnY2hhbmdlJywgdGhpcy5vbkRldmljZU1vZGVDaGFuZ2UgKTtcblx0fSxcblxuXHRvbkVkaXRNb2RlU3dpdGNoZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3RpdmVNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRhdGFFZGl0TW9kZS5yZXF1ZXN0KCAnYWN0aXZlTW9kZScgKTtcblxuXHRcdGlmICggJ3ByZXZpZXcnICE9PSBhY3RpdmVNb2RlICkge1xuXHRcdFx0dGhpcy5hY3RpdmUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5kZWFjdGl2YXRlKCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uRGV2aWNlTW9kZUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRldmljZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZS5yZXF1ZXN0KCAnY3VycmVudE1vZGUnICk7XG5cblx0XHRpZiAoICdkZXNrdG9wJyA9PT0gZGV2aWNlTW9kZSApIHtcblx0XHRcdHRoaXMuYWN0aXZlKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZGVhY3RpdmF0ZSgpO1xuXHRcdH1cblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Xy5kZWZlciggXy5iaW5kKCB0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCwgdGhpcyApICk7XG5cdH0sXG5cblx0b25EZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRlYWN0aXZhdGUoKTtcblx0fSxcblxuXHRhY3RpdmU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5nZXRDaGlsZFZpZXdDb250YWluZXIoKS5zb3J0YWJsZSggJ2luc3RhbmNlJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciAkY2hpbGRWaWV3Q29udGFpbmVyID0gdGhpcy5nZXRDaGlsZFZpZXdDb250YWluZXIoKSxcblx0XHRcdGRlZmF1bHRTb3J0YWJsZU9wdGlvbnMgPSB7XG5cdFx0XHRcdGNvbm5lY3RXaXRoOiAkY2hpbGRWaWV3Q29udGFpbmVyLnNlbGVjdG9yLFxuXHRcdFx0XHRjdXJzb3I6ICdtb3ZlJyxcblx0XHRcdFx0cGxhY2Vob2xkZXI6ICdlbGVtZW50b3Itc29ydGFibGUtcGxhY2Vob2xkZXInLFxuXHRcdFx0XHRjdXJzb3JBdDoge1xuXHRcdFx0XHRcdHRvcDogMjAsXG5cdFx0XHRcdFx0bGVmdDogMjVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscGVyOiBfLmJpbmQoIHRoaXMuX2dldFNvcnRhYmxlSGVscGVyLCB0aGlzIClcblx0XHRcdH0sXG5cdFx0XHRzb3J0YWJsZU9wdGlvbnMgPSBfLmV4dGVuZCggZGVmYXVsdFNvcnRhYmxlT3B0aW9ucywgdGhpcy52aWV3LmdldFNvcnRhYmxlT3B0aW9ucygpICk7XG5cblx0XHQkY2hpbGRWaWV3Q29udGFpbmVyLnNvcnRhYmxlKCBzb3J0YWJsZU9wdGlvbnMgKTtcblx0fSxcblxuXHRfZ2V0U29ydGFibGVIZWxwZXI6IGZ1bmN0aW9uKCBldmVudCwgJGl0ZW0gKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy52aWV3LmNvbGxlY3Rpb24uZ2V0KCB7XG5cdFx0XHRjaWQ6ICRpdGVtLmRhdGEoICdtb2RlbC1jaWQnIClcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gJzxkaXYgc3R5bGU9XCJoZWlnaHQ6IDg0cHg7IHdpZHRoOiAxMjVweDtcIiBjbGFzcz1cImVsZW1lbnRvci1zb3J0YWJsZS1oZWxwZXIgZWxlbWVudG9yLXNvcnRhYmxlLWhlbHBlci0nICsgbW9kZWwuZ2V0KCAnZWxUeXBlJyApICsgJ1wiPjxkaXYgY2xhc3M9XCJpY29uXCI+PGkgY2xhc3M9XCJlaWNvbi0nICsgbW9kZWwuZ2V0SWNvbigpICsgJ1wiPjwvaT48L2Rpdj48ZGl2IGNsYXNzPVwiZWxlbWVudG9yLWVsZW1lbnQtdGl0bGUtd3JhcHBlclwiPjxkaXYgY2xhc3M9XCJ0aXRsZVwiPicgKyBtb2RlbC5nZXRUaXRsZSgpICsgJzwvZGl2PjwvZGl2PjwvZGl2Pic7XG5cdH0sXG5cblx0ZGVhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmdldENoaWxkVmlld0NvbnRhaW5lcigpLnNvcnRhYmxlKCAnaW5zdGFuY2UnICkgKSB7XG5cdFx0XHR0aGlzLmdldENoaWxkVmlld0NvbnRhaW5lcigpLnNvcnRhYmxlKCAnZGVzdHJveScgKTtcblx0XHR9XG5cdH0sXG5cblx0b25Tb3J0U3RhcnQ6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR2YXIgbW9kZWwgPSB0aGlzLnZpZXcuY29sbGVjdGlvbi5nZXQoIHtcblx0XHRcdGNpZDogdWkuaXRlbS5kYXRhKCAnbW9kZWwtY2lkJyApXG5cdFx0fSApO1xuXG5cdFx0aWYgKCAnY29sdW1uJyA9PT0gdGhpcy5vcHRpb25zLmVsQ2hpbGRUeXBlICkge1xuXHRcdFx0Ly8gdGhlIGZvbGxvd2luZyBjb2RlIGlzIGp1c3QgZm9yIHRvdWNoXG5cdFx0XHR1aS5wbGFjZWhvbGRlci5hZGRDbGFzcyggJ2VsZW1lbnRvci1jb2x1bW4nICk7XG5cblx0XHRcdHZhciB1aURhdGEgPSB1aS5pdGVtLmRhdGEoICdzb3J0YWJsZUl0ZW0nICksXG5cdFx0XHRcdHVpSXRlbXMgPSB1aURhdGEuaXRlbXMsXG5cdFx0XHRcdGl0ZW1IZWlnaHQgPSAwO1xuXG5cdFx0XHR1aUl0ZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBpdGVtICkge1xuXHRcdFx0XHRpZiAoIGl0ZW0uaXRlbVswXSA9PT0gdWkuaXRlbVswXSApIHtcblx0XHRcdFx0XHRpdGVtSGVpZ2h0ID0gaXRlbS5oZWlnaHQ7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdHVpLnBsYWNlaG9sZGVyLmhlaWdodCggaXRlbUhlaWdodCApO1xuXG5cdFx0XHQvLyB1aS5wbGFjZWhvbGRlci5hZGRDbGFzcyggJ2VsZW1lbnRvci1jb2x1bW4gZWxlbWVudG9yLWNvbC0nICsgbW9kZWwuZ2V0U2V0dGluZyggJ3NpemUnICkgKTtcblx0XHR9XG5cblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZGF0YS50cmlnZ2VyKCBtb2RlbC5nZXQoICdlbFR5cGUnICkgKyAnOmRyYWc6c3RhcnQnICk7XG5cblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZGF0YS5yZXBseSggJ2NhY2hlOicgKyBtb2RlbC5jaWQsIG1vZGVsICk7XG5cdH0sXG5cblx0b25Tb3J0T3ZlcjogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHZhciBtb2RlbCA9IGVsZW1lbnRvci5jaGFubmVscy5kYXRhLnJlcXVlc3QoICdjYWNoZTonICsgdWkuaXRlbS5kYXRhKCAnbW9kZWwtY2lkJyApICk7XG5cblx0XHRCYWNrYm9uZS4kKCBldmVudC50YXJnZXQgKVxuXHRcdFx0LmFkZENsYXNzKCAnZWxlbWVudG9yLWRyYWdnYWJsZS1vdmVyJyApXG5cdFx0XHQuYXR0cigge1xuXHRcdFx0XHQnZGF0YS1kcmFnZ2VkLWVsZW1lbnQnOiBtb2RlbC5nZXQoICdlbFR5cGUnICksXG5cdFx0XHRcdCdkYXRhLWRyYWdnZWQtaXMtaW5uZXInOiBtb2RlbC5nZXQoICdpc0lubmVyJyApXG5cdFx0XHR9ICk7XG5cblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2VsZW1lbnRvci1kcmFnZ2luZy1vbi1jaGlsZCcgKTtcblx0fSxcblxuXHRvblNvcnRPdXQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdEJhY2tib25lLiQoIGV2ZW50LnRhcmdldCApXG5cdFx0XHQucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZHJhZ2dhYmxlLW92ZXInIClcblx0XHRcdC5yZW1vdmVBdHRyKCAnZGF0YS1kcmFnZ2VkLWVsZW1lbnQgZGF0YS1kcmFnZ2VkLWlzLWlubmVyJyApO1xuXG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZHJhZ2dpbmctb24tY2hpbGQnICk7XG5cdH0sXG5cblx0b25Tb3J0UmVjZWl2ZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdGlmICggdGhpcy52aWV3LmlzQ29sbGVjdGlvbkZpbGxlZCgpICkge1xuXHRcdFx0QmFja2JvbmUuJCggdWkuc2VuZGVyICkuc29ydGFibGUoICdjYW5jZWwnICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG1vZGVsID0gZWxlbWVudG9yLmNoYW5uZWxzLmRhdGEucmVxdWVzdCggJ2NhY2hlOicgKyB1aS5pdGVtLmRhdGEoICdtb2RlbC1jaWQnICkgKSxcblx0XHRcdGRyYWdnZWRFbFR5cGUgPSBtb2RlbC5nZXQoICdlbFR5cGUnICksXG5cdFx0XHRkcmFnZ2VkSXNJbm5lclNlY3Rpb24gPSAnc2VjdGlvbicgPT09IGRyYWdnZWRFbFR5cGUgJiYgbW9kZWwuZ2V0KCAnaXNJbm5lcicgKSxcblx0XHRcdHRhcmdldElzSW5uZXJDb2x1bW4gPSAnY29sdW1uJyA9PT0gdGhpcy52aWV3LmdldEVsZW1lbnRUeXBlKCkgJiYgdGhpcy52aWV3LmlzSW5uZXIoKTtcblxuXHRcdGlmICggZHJhZ2dlZElzSW5uZXJTZWN0aW9uICYmIHRhcmdldElzSW5uZXJDb2x1bW4gKSB7XG5cdFx0XHRCYWNrYm9uZS4kKCB1aS5zZW5kZXIgKS5zb3J0YWJsZSggJ2NhbmNlbCcgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgbmV3SW5kZXggPSB1aS5pdGVtLnBhcmVudCgpLmNoaWxkcmVuKCkuaW5kZXgoIHVpLml0ZW0gKSxcblx0XHRcdG5ld01vZGVsID0gbmV3IHRoaXMudmlldy5jb2xsZWN0aW9uLm1vZGVsKCBtb2RlbC50b0pTT04oIHsgY29weUh0bWxDYWNoZTogdHJ1ZSB9ICkgKTtcblxuXHRcdHRoaXMudmlldy5hZGRDaGlsZE1vZGVsKCBuZXdNb2RlbCwgeyBhdDogbmV3SW5kZXggfSApO1xuXG5cdFx0ZWxlbWVudG9yLmNoYW5uZWxzLmRhdGEudHJpZ2dlciggZHJhZ2dlZEVsVHlwZSArICc6ZHJhZzplbmQnICk7XG5cblx0XHRtb2RlbC5kZXN0cm95KCk7XG5cdH0sXG5cblx0b25Tb3J0VXBkYXRlOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIG1vZGVsID0gdGhpcy52aWV3LmNvbGxlY3Rpb24uZ2V0KCB1aS5pdGVtLmF0dHIoICdkYXRhLW1vZGVsLWNpZCcgKSApO1xuXHRcdGlmICggbW9kZWwgKSB7XG5cdFx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZGF0YS50cmlnZ2VyKCBtb2RlbC5nZXQoICdlbFR5cGUnICkgKyAnOmRyYWc6ZW5kJyApO1xuXHRcdH1cblx0fSxcblxuXHRvblNvcnRTdG9wOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyICRjaGlsZEVsZW1lbnQgPSB1aS5pdGVtLFxuXHRcdFx0Y29sbGVjdGlvbiA9IHRoaXMudmlldy5jb2xsZWN0aW9uLFxuXHRcdFx0bW9kZWwgPSBjb2xsZWN0aW9uLmdldCggJGNoaWxkRWxlbWVudC5hdHRyKCAnZGF0YS1tb2RlbC1jaWQnICkgKSxcblx0XHRcdG5ld0luZGV4ID0gJGNoaWxkRWxlbWVudC5wYXJlbnQoKS5jaGlsZHJlbigpLmluZGV4KCAkY2hpbGRFbGVtZW50ICk7XG5cblx0XHRpZiAoIHRoaXMuZ2V0Q2hpbGRWaWV3Q29udGFpbmVyKClbMF0gPT09IHVpLml0ZW0ucGFyZW50KClbMF0gKSB7XG5cdFx0XHRpZiAoIG51bGwgPT09IHVpLnNlbmRlciAmJiBtb2RlbCApIHtcblx0XHRcdFx0dmFyIG9sZEluZGV4ID0gY29sbGVjdGlvbi5pbmRleE9mKCBtb2RlbCApO1xuXG5cdFx0XHRcdGlmICggb2xkSW5kZXggIT09IG5ld0luZGV4ICkge1xuXHRcdFx0XHRcdGNvbGxlY3Rpb24ucmVtb3ZlKCBtb2RlbCApO1xuXHRcdFx0XHRcdHRoaXMudmlldy5hZGRDaGlsZE1vZGVsKCBtb2RlbCwgeyBhdDogbmV3SW5kZXggfSApO1xuXG5cdFx0XHRcdFx0ZWxlbWVudG9yLnNldEZsYWdFZGl0b3JDaGFuZ2UoIHRydWUgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnRvci5jaGFubmVscy5kYXRhLnRyaWdnZXIoIG1vZGVsLmdldCggJ2VsVHlwZScgKSArICc6ZHJhZzplbmQnICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdG9uQWRkQ2hpbGQ6IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdHZpZXcuJGVsLmF0dHIoICdkYXRhLW1vZGVsLWNpZCcsIHZpZXcubW9kZWwuY2lkICk7XG5cdH0sXG5cblx0Z2V0Q2hpbGRWaWV3Q29udGFpbmVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICdmdW5jdGlvbicgPT09IHR5cGVvZiB0aGlzLnZpZXcuZ2V0Q2hpbGRWaWV3Q29udGFpbmVyICkge1xuXHRcdFx0Ly8gQ29tcG9zaXRlVmlld1xuXHRcdFx0cmV0dXJuIHRoaXMudmlldy5nZXRDaGlsZFZpZXdDb250YWluZXIoIHRoaXMudmlldyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBDb2xsZWN0aW9uVmlld1xuXHRcdFx0cmV0dXJuIHRoaXMuJGVsO1xuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvcnRhYmxlQmVoYXZpb3I7IiwidmFyIElubmVyVGFic0JlaGF2aW9yID0gTWFyaW9uZXR0ZS5CZWhhdmlvci5leHRlbmQoe1xuXG4gICAgb25SZW5kZXJDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlSW5uZXJUYWJzKHRoaXMudmlldyk7XG4gICAgfSxcblxuICAgIGhhbmRsZUlubmVyVGFiczogZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICB2YXIgY2xvc2VkQ2xhc3MgPSAnZWxlbWVudG9yLXRhYi1jbG9zZScsXG4gICAgICAgICAgICBhY3RpdmVDbGFzcyA9ICdlbGVtZW50b3ItdGFiLWFjdGl2ZSc7XG5cbiAgICAgICAgdmFyIHRhYnNXcmFwcGVycyA9IHBhcmVudC5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgIHJldHVybiB2aWV3Lm1vZGVsLmdldCgndHlwZScpID09PSAndGFicyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF8uZWFjaCh0YWJzV3JhcHBlcnMsIGZ1bmN0aW9uICh3cmFwcGVyVmlldykge1xuICAgICAgICAgICAgd3JhcHBlclZpZXcuJGVsLmZpbmQoJy5lbGVtZW50b3ItY29udHJvbC1jb250ZW50JykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIHZhciB0YWJzV3JhcHBlcklkID0gd3JhcHBlclZpZXcubW9kZWwuZ2V0KCduYW1lJyk7XG5cbiAgICAgICAgICAgIHZhciB0YWJzID0gcGFyZW50LmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAoY2hpbGRWaWV3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkVmlldy5tb2RlbC5nZXQoJ3R5cGUnKSA9PT0gJ3RhYicgJiZcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRWaWV3Lm1vZGVsLmdldCgndGFic193cmFwcGVyJykgPT09IHRhYnNXcmFwcGVySWQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgXy5lYWNoKHRhYnMsIGZ1bmN0aW9uICh0YWJWaWV3LCBpbmRleCkge1xuXG4gICAgICAgICAgICAgICAgd3JhcHBlclZpZXcuX2FkZENoaWxkVmlldyh0YWJWaWV3KTtcblxuICAgICAgICAgICAgICAgIHZhciB0YWJJZCA9IHRhYlZpZXcubW9kZWwuZ2V0KCduYW1lJyk7XG5cbiAgICAgICAgICAgICAgICB0YWJWaWV3LiRlbFxuICAgICAgICAgICAgICAgICAgICAub2ZmKCdjbGljay5pcWlUYWInKVxuICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrLmlxaVRhYicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYlZpZXcudHJpZ2dlck1ldGhvZCgnY29udHJvbDp0YWI6Y2xpY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBjb250cm9sc1VuZGVyVGFiID0gcGFyZW50LmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAoY29udHJvbFZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRyb2xWaWV3Lm1vZGVsLmdldCgnaW5uZXJfdGFiJykgPT09IHRhYklkO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhYlZpZXcuJGVsLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goY29udHJvbHNVbmRlclRhYiwgZnVuY3Rpb24gKGNvbnRyb2xWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sVmlldy4kZWwuYWRkQ2xhc3MoY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uQ2hpbGR2aWV3Q29udHJvbFRhYkNsaWNrZWQ6IGZ1bmN0aW9uIChjaGlsZFZpZXcpIHtcbiAgICAgICAgdmFyIGNsb3NlZENsYXNzID0gJ2VsZW1lbnRvci10YWItY2xvc2UnO1xuICAgICAgICB2YXIgYWN0aXZlQ2xhc3MgPSAnZWxlbWVudG9yLXRhYi1hY3RpdmUnO1xuXG4gICAgICAgIHZhciBjbGlja2VkVGFiTmFtZSA9IGNoaWxkVmlldy5tb2RlbC5nZXQoJ25hbWUnKTtcbiAgICAgICAgdmFyIHRhYnNXcmFwcGVySWQgPSBjaGlsZFZpZXcubW9kZWwuZ2V0KCd0YWJzX3dyYXBwZXInKTtcblxuICAgICAgICB2YXIgc2libGluZ1RhYnMgPSB0aGlzLnZpZXcuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICByZXR1cm4gdmlldy5tb2RlbC5nZXQoJ3R5cGUnKSA9PT0gJ3RhYicgJiZcbiAgICAgICAgICAgICAgICB2aWV3Lm1vZGVsLmdldCgndGFic193cmFwcGVyJykgPT09IHRhYnNXcmFwcGVySWQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB0YWJOYW1lcyA9IF8ubWFwKHNpYmxpbmdUYWJzLCBmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgcmV0dXJuIHZpZXcubW9kZWwuZ2V0KCduYW1lJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBjaGlsZHJlblVuZGVyVGFiID0gdGhpcy52aWV3LmNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgcmV0dXJuIF8uY29udGFpbnModGFiTmFtZXMsIHZpZXcubW9kZWwuZ2V0KCdpbm5lcl90YWInKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF8uZWFjaChzaWJsaW5nVGFicywgZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgIHZpZXcuJGVsLnJlbW92ZUNsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY2hpbGRWaWV3LiRlbC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG5cbiAgICAgICAgXy5lYWNoKGNoaWxkcmVuVW5kZXJUYWIsIGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICBpZiAodmlldy5tb2RlbC5nZXQoJ2lubmVyX3RhYicpID09PSBjbGlja2VkVGFiTmFtZSkge1xuICAgICAgICAgICAgICAgIHZpZXcuJGVsLnJlbW92ZUNsYXNzKGNsb3NlZENsYXNzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmlldy4kZWwuYWRkQ2xhc3MoY2xvc2VkQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkudXBkYXRlU2Nyb2xsYmFyKCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5uZXJUYWJzQmVoYXZpb3I7IiwidmFyIENvbnRleHRNZW51VmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG4gICAgdGFnTmFtZTogJ2RpdicsXG4gICAgY2xhc3NOYW1lOiAnaXFpdC1jb250ZXh0LW1lbnUnLFxuICAgIHRlbXBsYXRlOiBmYWxzZSwgLy8gT24gZ8OocmUgbGUgSFRNTCDDoCBsYSBtYWluXG5cbiAgICB1aToge1xuICAgICAgICBsaXN0OiAnLmlxaXQtY29udGV4dC1tZW51LWxpc3QnXG4gICAgfSxcblxuICAgIGV2ZW50czoge1xuICAgICAgICAnY2xpY2sgLmlxaXQtY29udGV4dC1tZW51LWl0ZW0nOiAnb25JdGVtQ2xpY2snXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWdWUgTWFyaW9uZXR0ZSA9PiBtw6ptZSBsb2dpcXVlIHF1ZSBCYWNrYm9uZS5WaWV3LCBtYWlzIHBsdXMgY29ow6lyZW50ZSBhdmVjIGxlIHJlc3RlXG4gICAgICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy4kZWwuaHRtbCggJzx1bCBjbGFzcz1cImlxaXQtY29udGV4dC1tZW51LWxpc3RcIj48L3VsPicgKTtcbiAgICAgICAgQmFja2JvbmUuJCggJ2JvZHknICkuYXBwZW5kKCB0aGlzLmVsICk7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuXG4gICAgICAgIC8vIE9uIMOpY291dGUgdW4gY2hhbm5lbCBkZSBs4oCZw6lkaXRldXJcbiAgICAgICAgaWYgKCBlbGVtZW50b3IuY2hhbm5lbHMgJiYgZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvciApIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5lZGl0b3IsICdjb250ZXh0LW1lbnU6b3BlbicsIHRoaXMub25PcGVuICk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLCAnY29udGV4dC1tZW51OmNsb3NlJywgdGhpcy5oaWRlLmJpbmQoIHRoaXMgKSApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uT3BlbjogZnVuY3Rpb24oIHBheWxvYWQgKSB7XG4gICAgICAgIHZhciBldmVudCAgPSBwYXlsb2FkLmV2ZW50LFxuICAgICAgICAgICAgdmlldyAgID0gcGF5bG9hZC52aWV3LFxuICAgICAgICAgICAgZ3JvdXBzID0gcGF5bG9hZC5ncm91cHMsXG4gICAgICAgICAgICBtZW51WCA9IGV2ZW50LnJlYWxDbGllbnRYLFxuICAgICAgICAgICAgbWVudVkgPSBldmVudC5yZWFsQ2xpZW50WVxuICAgICAgICA7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0ID0geyBldmVudDogZXZlbnQsIHZpZXc6IHZpZXcsIGdyb3VwczogZ3JvdXBzIH07XG4gICAgICAgIHRoaXMucmVuZGVyTWVudSgpO1xuXG4gICAgICAgIC8vIFBvc2l0aW9ubmVyIGVuIGZpeGVkIHB1aXMgdsOpcmlmaWVyIGxlcyBsaW1pdGVzIGRlIGwnw6ljcmFuXG4gICAgICAgIHRoaXMuJGVsLmNzcygge1xuICAgICAgICAgICAgbGVmdDogbWVudVgsXG4gICAgICAgICAgICB0b3A6IG1lbnVZLFxuICAgICAgICAgICAgcG9zaXRpb246ICdmaXhlZCdcbiAgICAgICAgfSApLnNob3coKTtcblxuICAgICAgICAvLyBFbXDDqmNoZXIgbGUgbWVudSBkZSBzb3J0aXIgZGUgbCfDqWNyYW5cbiAgICAgICAgdmFyIG1lbnVXaWR0aCA9IHRoaXMuJGVsLm91dGVyV2lkdGgoKSxcbiAgICAgICAgICAgIG1lbnVIZWlnaHQgPSB0aGlzLiRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgd2luV2lkdGggPSBCYWNrYm9uZS4kKHdpbmRvdykud2lkdGgoKSxcbiAgICAgICAgICAgIHdpbkhlaWdodCA9IEJhY2tib25lLiQod2luZG93KS5oZWlnaHQoKTtcblxuICAgICAgICBpZiAobWVudVggKyBtZW51V2lkdGggPiB3aW5XaWR0aCkge1xuICAgICAgICAgICAgbWVudVggPSB3aW5XaWR0aCAtIG1lbnVXaWR0aCAtIDU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lbnVZICsgbWVudUhlaWdodCA+IHdpbkhlaWdodCkge1xuICAgICAgICAgICAgbWVudVkgPSB3aW5IZWlnaHQgLSBtZW51SGVpZ2h0IC0gNTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGVsLmNzcyh7IGxlZnQ6IG1lbnVYLCB0b3A6IG1lbnVZIH0pO1xuICAgIH0sXG5cbiAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaGlkZSgpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIH0sXG5cbiAgICByZW5kZXJNZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRsaXN0ID0gdGhpcy4kKCAnLmlxaXQtY29udGV4dC1tZW51LWxpc3QnICk7XG4gICAgICAgICRsaXN0LmVtcHR5KCk7XG5cbiAgICAgICAgaWYgKCAhIHRoaXMuY29udGV4dCB8fCAhIHRoaXMuY29udGV4dC5ncm91cHMgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuY29udGV4dC5ncm91cHMuZm9yRWFjaCggZnVuY3Rpb24oIGdyb3VwICkge1xuICAgICAgICAgICAgKCBncm91cC5hY3Rpb25zIHx8IFtdICkuZm9yRWFjaCggZnVuY3Rpb24oIGFjdGlvbiApIHtcblxuICAgICAgICAgICAgICAgIC8vIEFqb3V0ZXIgdW4gc8OpcGFyYXRldXIgYXZhbnQgc2kgZGVtYW5kw6lcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uLnNlcGFyYXRvciA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpc3QuYXBwZW5kKCc8bGkgY2xhc3M9XCJpcWl0LWNvbnRleHQtbWVudS1zZXBhcmF0b3JcIj48L2xpPicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciAkaXRlbSA9IEJhY2tib25lLiQoJzxsaSBjbGFzcz1cImlxaXQtY29udGV4dC1tZW51LWl0ZW1cIiAvPicpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLWFjdGlvbicsIGFjdGlvbi5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAuZGF0YSgnYWN0aW9uRGF0YScsIGFjdGlvbik7XG5cbiAgICAgICAgICAgICAgICAvLyBDb25zdHJ1aXJlIGNvbnRlbnUgYXZlYyBpY8O0bmUgc2kgZm91cm5pZVxuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gYWN0aW9uLnRpdGxlIHx8IGFjdGlvbi5uYW1lO1xuICAgICAgICAgICAgICAgIHZhciBpY29uSHRtbCA9IGFjdGlvbi5pY29uID8gJzxzcGFuIGNsYXNzPVwiaXFpdC1jb250ZXh0LW1lbnUtaWNvblwiPicgKyBhY3Rpb24uaWNvbiArICc8L3NwYW4+JyA6ICcnO1xuXG4gICAgICAgICAgICAgICAgJGl0ZW0uaHRtbChpY29uSHRtbCArICc8c3BhbiBjbGFzcz1cImlxaXQtY29udGV4dC1tZW51LWxhYmVsXCI+JyArIHRleHQgKyAnPC9zcGFuPicpO1xuXG4gICAgICAgICAgICAgICAgJGxpc3QuYXBwZW5kKCAkaXRlbSApO1xuICAgICAgICAgICAgfSApO1xuICAgICAgICB9ICk7XG4gICAgfSxcblxuXG4gICAgb25JdGVtQ2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgdmFyICRpdGVtICAgPSB0aGlzLiQoIGV2ZW50LmN1cnJlbnRUYXJnZXQgKSxcbiAgICAgICAgICAgIGFjdGlvbiAgPSAkaXRlbS5kYXRhKCAnYWN0aW9uRGF0YScgKSxcbiAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cbiAgICAgICAgaWYgKCBhY3Rpb24gJiYgJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGFjdGlvbi5jYWxsYmFjayApIHtcbiAgICAgICAgICAgIGFjdGlvbi5jYWxsYmFjayggY29udGV4dCApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxufSApO1xuXG5cbmxldCBzaW5nbGV0b25JbnN0YW5jZSA9IG51bGw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5pdENvbnRleHRNZW51KCkge1xuICAgIGlmICghc2luZ2xldG9uSW5zdGFuY2UpIHtcbiAgICAgICAgc2luZ2xldG9uSW5zdGFuY2UgPSBuZXcgQ29udGV4dE1lbnVWaWV3KCk7XG4gICAgfVxufSIsIi8qKlxuICogTmF2aWdhdG9yIOKAlCBTdHJ1Y3R1cmUgdHJlZSBwYW5lbCBmb3IgaXFpdGVsZW1lbnRvciBlZGl0b3IuXG4gKlxuICogUHJvdmlkZXMgYSBmbG9hdGluZyBwYW5lbCB0aGF0IGRpc3BsYXlzIHRoZSBoaWVyYXJjaGljYWwgc3RydWN0dXJlXG4gKiBvZiBzZWN0aW9ucywgY29sdW1ucyBhbmQgd2lkZ2V0cy4gU3VwcG9ydHMgZHJhZyAmIGRyb3AgcmVvcmRlcmluZyxcbiAqIGNsaWNrLXRvLXNjcm9sbCwgcmlnaHQtY2xpY2sgY29udGV4dCBtZW51IGFuZCBleHBhbmQvY29sbGFwc2UuXG4gKi9cblxudmFyIE5hdmlnYXRvckVsZW1lbnRWaWV3LFxuXHROYXZpZ2F0b3JSb290Vmlldyxcblx0TmF2aWdhdG9yVmlldztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBOYXZpZ2F0b3JFbGVtZW50VmlldyDigJQgcmVjdXJzaXZlIENvbXBvc2l0ZVZpZXcgZm9yIGVhY2ggZWxlbWVudCBub2RlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuTmF2aWdhdG9yRWxlbWVudFZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiBNYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUuZ2V0KCAnI3RtcGwtZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudHMnICksXG5cblx0Y2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxUeXBlID0gdGhpcy5tb2RlbC5nZXQoICdlbFR5cGUnICk7XG5cdFx0dmFyIGNscyA9ICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50IGVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLScgKyBlbFR5cGU7XG5cblx0XHRpZiAoICd3aWRnZXQnID09PSBlbFR5cGUgKSB7XG5cdFx0XHRjbHMgKz0gJyBlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS0nICsgdGhpcy5tb2RlbC5nZXQoICd3aWRnZXRUeXBlJyApO1xuXHRcdH1cblxuXHRcdHJldHVybiBjbHM7XG5cdH0sXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRzJyxcblxuXHQvLyBSZWN1cnNpdmUgcmVmZXJlbmNlIOKAlCBtdXN0IHVzZSBnZXRDaGlsZFZpZXcoKSBpbnN0ZWFkIG9mIGNoaWxkVmlld1xuXHQvLyBiZWNhdXNlIE1hcmlvbmV0dGUgMi40IHdvdWxkIHRyeSB0byBpbnN0YW50aWF0ZSBjaGlsZFZpZXcgYXMgYSBjb25zdHJ1Y3Rvci5cblx0Z2V0Q2hpbGRWaWV3OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gTmF2aWdhdG9yRWxlbWVudFZpZXc7XG5cdH0sXG5cblx0dWk6IHtcblx0XHRpdGVtOiAnPiAuZWxlbWVudG9yLW5hdmlnYXRvcl9faXRlbScsXG5cdFx0bGlzdFRvZ2dsZTogJz4gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2l0ZW0gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRfX2xpc3QtdG9nZ2xlJyxcblx0XHR0aXRsZTogJz4gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2l0ZW0gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRfX3RpdGxlX190ZXh0Jyxcblx0XHR0b2dnbGU6ICc+IC5lbGVtZW50b3ItbmF2aWdhdG9yX19pdGVtIC5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50X190b2dnbGUnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5saXN0VG9nZ2xlJzogJ29uTGlzdFRvZ2dsZUNsaWNrJyxcblx0XHQnY2xpY2sgQHVpLnRvZ2dsZSc6ICdvblZpc2liaWxpdHlUb2dnbGUnLFxuXHRcdCdjbGljayBAdWkuaXRlbSc6ICdvbkl0ZW1DbGljaycsXG5cdFx0J2NvbnRleHRtZW51IEB1aS5pdGVtJzogJ29uQ29udGV4dE1lbnUnXG5cdH0sXG5cblx0dGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudERhdGEgPSBlbGVtZW50b3IuZ2V0RWxlbWVudERhdGEoIHRoaXMubW9kZWwgKTtcblx0XHR2YXIgZWxUeXBlID0gdGhpcy5tb2RlbC5nZXQoICdlbFR5cGUnICk7XG5cdFx0dmFyIGljb24gPSAnJztcblxuXHRcdGlmICggZWxlbWVudERhdGEgJiYgZWxlbWVudERhdGEuaWNvbiApIHtcblx0XHRcdGljb24gPSAnZWljb24tJyArIGVsZW1lbnREYXRhLmljb247XG5cdFx0fVxuXG5cdFx0Ly8gTm8gaWNvbiBmb3Igc2VjdGlvbnNcblx0XHRpZiAoICdzZWN0aW9uJyA9PT0gZWxUeXBlICkge1xuXHRcdFx0aWNvbiA9ICcnO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR0aXRsZTogdGhpcy5tb2RlbC5nZXRUaXRsZSgpLFxuXHRcdFx0aWNvbjogaWNvbixcblx0XHRcdGVsVHlwZTogZWxUeXBlXG5cdFx0fTtcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudHMgPSB0aGlzLm1vZGVsLmdldCggJ2VsZW1lbnRzJyApO1xuXG5cdFx0aWYgKCBlbGVtZW50cyApIHtcblx0XHRcdHRoaXMuY29sbGVjdGlvbiA9IGVsZW1lbnRzO1xuXHRcdH1cblxuXHRcdC8vIExpc3RlbiBmb3IgY2hpbGQgY2hhbmdlcyB0byByZS1yZW5kZXIgdGhlIHRyZWVcblx0XHRpZiAoIHRoaXMuY29sbGVjdGlvbiApIHtcblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY29sbGVjdGlvbiwgJ2FkZCByZW1vdmUgcmVzZXQnLCB0aGlzLm9uRWxlbWVudHNDaGFuZ2VkICk7XG5cdFx0fVxuXG5cdFx0Ly8gTGlzdGVuIGZvciB0aXRsZS9zZXR0aW5ncyBjaGFuZ2VzXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSwgJ2NoYW5nZScsIHRoaXMub25TZXR0aW5nc0NoYW5nZWQgKTtcblxuXHRcdC8vIENvbGxhcHNlZCBzdGF0ZSAoZGVmYXVsdDogYWxsIGNvbGxhcHNlZClcblx0XHR0aGlzLl9jb2xsYXBzZWQgPSB0cnVlO1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHQvLyBBcHBseSBpbml0aWFsIGNvbGxhcHNlZCBzdGF0ZVxuXHRcdGlmICggdGhpcy5fY29sbGFwc2VkICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1jb2xsYXBzZWQnICk7XG5cdFx0fVxuXG5cdFx0Ly8gV2lkZ2V0cyBoYXZlIG5vIGNoaWxkcmVuIOKAlCBoaWRlIHRoZSB0b2dnbGUgYXJyb3dcblx0XHRpZiAoICd3aWRnZXQnID09PSB0aGlzLm1vZGVsLmdldCggJ2VsVHlwZScgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudC0tbm8tY2hpbGRyZW4nICk7XG5cdFx0fVxuXG5cdFx0Ly8gSW5pdCBzb3J0YWJsZSBmb3IgZHJhZyAmIGRyb3AgcmVvcmRlcmluZ1xuXHRcdHRoaXMuX2luaXRTb3J0YWJsZSgpO1xuXG5cdFx0Ly8gU2V0IGRhdGEgYXR0cmlidXRlIGZvciBtb2RlbCBDSUQgKHVzZWQgYnkgc29ydGFibGUpXG5cdFx0dGhpcy4kZWwuYXR0ciggJ2RhdGEtbW9kZWwtY2lkJywgdGhpcy5tb2RlbC5jaWQgKTtcblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciAkY29udGFpbmVyID0gdGhpcy4kKCAnPiAuZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudHMnICk7XG5cdFx0aWYgKCAkY29udGFpbmVyLnNvcnRhYmxlICYmICRjb250YWluZXIuc29ydGFibGUoICdpbnN0YW5jZScgKSApIHtcblx0XHRcdCRjb250YWluZXIuc29ydGFibGUoICdkZXN0cm95JyApO1xuXHRcdH1cblx0fSxcblxuXHQvLyAtLSBTb3J0YWJsZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0X2luaXRTb3J0YWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBlbFR5cGUgPSB0aGlzLm1vZGVsLmdldCggJ2VsVHlwZScgKTtcblxuXHRcdC8vIE9ubHkgc2VjdGlvbnMgYW5kIGNvbHVtbnMgY2FuIGhhdmUgc29ydGFibGUgY2hpbGRyZW5cblx0XHRpZiAoICd3aWRnZXQnID09PSBlbFR5cGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyICRjb250YWluZXIgPSB0aGlzLiQoICc+IC5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50cycgKTtcblx0XHRpZiAoICEgJGNvbnRhaW5lci5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGNoaWxkVHlwZSA9ICggJ3NlY3Rpb24nID09PSBlbFR5cGUgKSA/ICdjb2x1bW4nIDogJ3dpZGdldCc7XG5cblx0XHQvLyBjb25uZWN0V2l0aDogYWxsb3cgZHJhZ2dpbmcgYmV0d2VlbiBzaWJsaW5ncyBvZiB0aGUgc2FtZSB0eXBlXG5cdFx0dmFyIGNvbm5lY3RTZWxlY3RvciA9ICcuZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudC0tJyArIGVsVHlwZSArICcgPiAuZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudHMnO1xuXG5cdFx0JGNvbnRhaW5lci5zb3J0YWJsZSgge1xuXHRcdFx0aXRlbXM6ICc+IC5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50Jyxcblx0XHRcdGhhbmRsZTogJz4gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2l0ZW0nLFxuXHRcdFx0Y29ubmVjdFdpdGg6IGNvbm5lY3RTZWxlY3Rvcixcblx0XHRcdHBsYWNlaG9sZGVyOiAnZWxlbWVudG9yLW5hdmlnYXRvcl9fc29ydGFibGUtcGxhY2Vob2xkZXInLFxuXHRcdFx0dG9sZXJhbmNlOiAncG9pbnRlcicsXG5cdFx0XHRheGlzOiAneScsXG5cdFx0XHRjdXJzb3I6ICdtb3ZlJyxcblx0XHRcdGNvbnRhaW5tZW50OiAnI2VsZW1lbnRvci1uYXZpZ2F0b3InLFxuXHRcdFx0c3RhcnQ6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0XHRcdHVpLml0ZW0uYWRkQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1kcmFnZ2luZycgKTtcblx0XHRcdH0sXG5cdFx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdFx0XHR1aS5pdGVtLnJlbW92ZUNsYXNzKCAnZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudC0tZHJhZ2dpbmcnICk7XG5cdFx0XHRcdHNlbGYuX29uU29ydFN0b3AoIGV2ZW50LCB1aSwgY2hpbGRUeXBlICk7XG5cdFx0XHR9LFxuXHRcdFx0cmVjZWl2ZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRcdFx0c2VsZi5fb25Tb3J0UmVjZWl2ZSggZXZlbnQsIHVpLCBjaGlsZFR5cGUgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhhbmRsZSByZW9yZGVyIHdpdGhpbiB0aGUgc2FtZSBjb250YWluZXIuXG5cdCAqIE1pcnJvcnMgdGhlIGFwcHJvYWNoIGZyb20gc29ydGFibGUuanM6IHJlbW92ZSArIGFkZENoaWxkTW9kZWwuXG5cdCAqL1xuXHRfb25Tb3J0U3RvcDogZnVuY3Rpb24oIGV2ZW50LCB1aSwgY2hpbGRUeXBlICkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyICRpdGVtID0gdWkuaXRlbTtcblx0XHR2YXIgbW9kZWxDaWQgPSAkaXRlbS5hdHRyKCAnZGF0YS1tb2RlbC1jaWQnICk7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmdldCggeyBjaWQ6IG1vZGVsQ2lkIH0gKTtcblxuXHRcdGlmICggISBtb2RlbCApIHtcblx0XHRcdHJldHVybjsgLy8gTW92ZWQgdG8gYW5vdGhlciBjb250YWluZXIg4oCUIGhhbmRsZWQgYnkgX29uU29ydFJlY2VpdmVcblx0XHR9XG5cblx0XHR2YXIgbmV3SW5kZXggPSAkaXRlbS5wYXJlbnQoKS5jaGlsZHJlbiggJy5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50JyApLmluZGV4KCAkaXRlbSApO1xuXHRcdHZhciBvbGRJbmRleCA9IHRoaXMuY29sbGVjdGlvbi5pbmRleE9mKCBtb2RlbCApO1xuXG5cdFx0aWYgKCBvbGRJbmRleCA9PT0gbmV3SW5kZXggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gRmluZCB0aGUgZWRpdG9yIHZpZXcgZm9yIHRoaXMgY29udGFpbmVyIGFuZCB1c2UgaXRzIGFkZENoaWxkTW9kZWwgKHNhbWUgYXMgc29ydGFibGUuanMpXG5cdFx0dmFyIGNvbnRhaW5lckVkaXRvclZpZXcgPSB0aGlzLl9maW5kRWRpdG9yVmlldyggdGhpcy5tb2RlbCApO1xuXG5cdFx0aWYgKCBjb250YWluZXJFZGl0b3JWaWV3ICkge1xuXHRcdFx0Ly8gU3VwcHJlc3MgbmF2aWdhdG9yIHJlLXJlbmRlciBkdXJpbmcgc29ydCAoRE9NIGFscmVhZHkgY29ycmVjdClcblx0XHRcdHRoaXMuX3N1cHByZXNzUmVmcmVzaCA9IHRydWU7XG5cdFx0XHRjb250YWluZXJFZGl0b3JWaWV3LmNvbGxlY3Rpb24ucmVtb3ZlKCBtb2RlbCApO1xuXHRcdFx0Y29udGFpbmVyRWRpdG9yVmlldy5hZGRDaGlsZE1vZGVsKCBtb2RlbCwgeyBhdDogbmV3SW5kZXggfSApO1xuXHRcdFx0dGhpcy5fc3VwcHJlc3NSZWZyZXNoID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0ZWxlbWVudG9yLnNldEZsYWdFZGl0b3JDaGFuZ2UoIHRydWUgKTtcblx0fSxcblxuXHQvKipcblx0ICogSGFuZGxlIGVsZW1lbnQgcmVjZWl2ZWQgZnJvbSBhbm90aGVyIGNvbnRhaW5lci5cblx0ICovXG5cdF9vblNvcnRSZWNlaXZlOiBmdW5jdGlvbiggZXZlbnQsIHVpLCBjaGlsZFR5cGUgKSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR2YXIgJGl0ZW0gPSB1aS5pdGVtO1xuXHRcdHZhciBtb2RlbENpZCA9ICRpdGVtLmF0dHIoICdkYXRhLW1vZGVsLWNpZCcgKTtcblx0XHR2YXIgbmV3SW5kZXggPSAkaXRlbS5wYXJlbnQoKS5jaGlsZHJlbiggJy5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50JyApLmluZGV4KCAkaXRlbSApO1xuXG5cdFx0Ly8gRmluZCB0aGUgbW9kZWwgaW4gdGhlIHNvdXJjZSBjb2xsZWN0aW9uXG5cdFx0dmFyIG1vZGVsID0gdGhpcy5fZmluZE1vZGVsQnlDaWQoIGVsZW1lbnRvci5lbGVtZW50cywgbW9kZWxDaWQgKTtcblxuXHRcdGlmICggISBtb2RlbCApIHtcblx0XHRcdEJhY2tib25lLiQoIHVpLnNlbmRlciApLnNvcnRhYmxlKCAnY2FuY2VsJyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFZhbGlkYXRlOiBvbmx5IHNhbWUtdHlwZSBtb3ZlcyBhbGxvd2VkXG5cdFx0dmFyIG1vZGVsRWxUeXBlID0gbW9kZWwuZ2V0KCAnZWxUeXBlJyApO1xuXHRcdHZhciBleHBlY3RlZENoaWxkID0gKCAnc2VjdGlvbicgPT09IHRoaXMubW9kZWwuZ2V0KCAnZWxUeXBlJyApICkgPyAnY29sdW1uJyA6ICd3aWRnZXQnO1xuXG5cdFx0aWYgKCBtb2RlbEVsVHlwZSAhPT0gZXhwZWN0ZWRDaGlsZCApIHtcblx0XHRcdEJhY2tib25lLiQoIHVpLnNlbmRlciApLnNvcnRhYmxlKCAnY2FuY2VsJyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEZpbmQgdGhlIGVkaXRvciB2aWV3IGZvciB0aGlzIGNvbnRhaW5lciAodGhlIGRyb3AgdGFyZ2V0KVxuXHRcdHZhciB0YXJnZXRFZGl0b3JWaWV3ID0gdGhpcy5fZmluZEVkaXRvclZpZXcoIHRoaXMubW9kZWwgKTtcblxuXHRcdGlmICggdGFyZ2V0RWRpdG9yVmlldyApIHtcblx0XHRcdC8vIFJlbW92ZSBmcm9tIG9sZCBjb2xsZWN0aW9uICh0cmlnZ2VycyByZS1yZW5kZXIgaW4gb2xkIHBhcmVudClcblx0XHRcdG1vZGVsLmRlc3Ryb3koKTtcblxuXHRcdFx0Ly8gQWRkIHRvIG5ldyBwYXJlbnQgaW4gdGhlIGVkaXRvciB1c2luZyBhZGRDaGlsZE1vZGVsXG5cdFx0XHR2YXIgbmV3TW9kZWwgPSBuZXcgdGFyZ2V0RWRpdG9yVmlldy5jb2xsZWN0aW9uLm1vZGVsKCBtb2RlbC50b0pTT04oIHsgY29weUh0bWxDYWNoZTogdHJ1ZSB9ICkgKTtcblx0XHRcdHRhcmdldEVkaXRvclZpZXcuYWRkQ2hpbGRNb2RlbCggbmV3TW9kZWwsIHsgYXQ6IG5ld0luZGV4IH0gKTtcblx0XHR9XG5cblx0XHRlbGVtZW50b3Iuc2V0RmxhZ0VkaXRvckNoYW5nZSggdHJ1ZSApO1xuXG5cdFx0Ly8gRnVsbCByZWZyZXNoIG5lZWRlZCBmb3IgY3Jvc3MtY29udGFpbmVyIG1vdmVzXG5cdFx0ZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvci50cmlnZ2VyKCAnbmF2aWdhdG9yOnJlZnJlc2gnICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlY3Vyc2l2ZWx5IGZpbmQgYSBtb2RlbCBieSBDSUQgaW4gbmVzdGVkIGNvbGxlY3Rpb25zLlxuXHQgKi9cblx0X2ZpbmRNb2RlbEJ5Q2lkOiBmdW5jdGlvbiggY29sbGVjdGlvbiwgY2lkICkge1xuXHRcdHZhciBmb3VuZCA9IG51bGw7XG5cblx0XHRjb2xsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdGlmICggbW9kZWwuY2lkID09PSBjaWQgKSB7XG5cdFx0XHRcdGZvdW5kID0gbW9kZWw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHZhciBjaGlsZHJlbiA9IG1vZGVsLmdldCggJ2VsZW1lbnRzJyApO1xuXHRcdFx0aWYgKCBjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGggKSB7XG5cdFx0XHRcdGZvdW5kID0gdGhpcy5fZmluZE1vZGVsQnlDaWQoIGNoaWxkcmVuLCBjaWQgKTtcblx0XHRcdFx0aWYgKCBmb3VuZCApIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cblx0XHRyZXR1cm4gZm91bmQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZpbmQgdGhlIGVkaXRvciB2aWV3IHRoYXQgaXMgdGhlIHBhcmVudCBvZiBhIGdpdmVuIG1vZGVsLlxuXHQgKiBUcmF2ZXJzZXMgZWxlbWVudG9yLmVsZW1lbnRzIHRvIGZpbmQgd2hpY2ggY29sbGVjdGlvbiBob2xkcyB0aGUgbW9kZWwsXG5cdCAqIHRoZW4gcmV0dXJucyB0aGUgZWRpdG9yIHZpZXcgZm9yIHRoYXQgcGFyZW50LlxuXHQgKi9cblx0X2ZpbmRQYXJlbnRFZGl0b3JWaWV3Rm9yTW9kZWw6IGZ1bmN0aW9uKCBjaGlsZE1vZGVsICkge1xuXHRcdC8vIFRvcC1sZXZlbCBzZWN0aW9ucyDihpIgcGFyZW50IGlzIFNlY3Rpb25zQ29sbGVjdGlvblZpZXdcblx0XHRpZiAoIGVsZW1lbnRvci5lbGVtZW50cy5nZXQoIGNoaWxkTW9kZWwgKSApIHtcblx0XHRcdHJldHVybiBlbGVtZW50b3IuZ2V0UmVnaW9uKCAnc2VjdGlvbnMnICkuY3VycmVudFZpZXc7XG5cdFx0fVxuXG5cdFx0Ly8gU2VhcmNoIHJlY3Vyc2l2ZWx5IGZvciB0aGUgY29sbGVjdGlvbiB0aGF0IGNvbnRhaW5zIHRoaXMgbW9kZWxcblx0XHR2YXIgcGFyZW50TW9kZWwgPSB0aGlzLl9maW5kUGFyZW50TW9kZWwoIGVsZW1lbnRvci5lbGVtZW50cywgY2hpbGRNb2RlbCApO1xuXG5cdFx0aWYgKCBwYXJlbnRNb2RlbCApIHtcblx0XHRcdHJldHVybiB0aGlzLl9maW5kRWRpdG9yVmlldyggcGFyZW50TW9kZWwgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXHQvKipcblx0ICogRmluZCB0aGUgcGFyZW50IG1vZGVsIHdob3NlIGVsZW1lbnRzIGNvbGxlY3Rpb24gY29udGFpbnMgY2hpbGRNb2RlbC5cblx0ICovXG5cdF9maW5kUGFyZW50TW9kZWw6IGZ1bmN0aW9uKCBjb2xsZWN0aW9uLCBjaGlsZE1vZGVsICkge1xuXHRcdHZhciBmb3VuZCA9IG51bGw7XG5cblx0XHRjb2xsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdGlmICggZm91bmQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciBjaGlsZHJlbiA9IG1vZGVsLmdldCggJ2VsZW1lbnRzJyApO1xuXHRcdFx0aWYgKCBjaGlsZHJlbiApIHtcblx0XHRcdFx0aWYgKCBjaGlsZHJlbi5nZXQoIGNoaWxkTW9kZWwgKSApIHtcblx0XHRcdFx0XHRmb3VuZCA9IG1vZGVsO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRmb3VuZCA9IHRoaXMuX2ZpbmRQYXJlbnRNb2RlbCggY2hpbGRyZW4sIGNoaWxkTW9kZWwgKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cblx0XHRyZXR1cm4gZm91bmQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEZpbmQgdGhlIE1hcmlvbmV0dGUgdmlldyBpbiB0aGUgZWRpdG9yIHRoYXQgY29ycmVzcG9uZHMgdG8gYSBtb2RlbC5cblx0ICovXG5cdF9maW5kRWRpdG9yVmlldzogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdHZhciBzZWN0aW9uc1ZpZXcgPSBlbGVtZW50b3IuZ2V0UmVnaW9uKCAnc2VjdGlvbnMnICkuY3VycmVudFZpZXc7XG5cblx0XHRpZiAoICEgc2VjdGlvbnNWaWV3ICkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gVG9wLWxldmVsIHNlY3Rpb25zIHZpZXdcblx0XHRpZiAoICEgbW9kZWwuZ2V0KCAnZWxUeXBlJyApICkge1xuXHRcdFx0cmV0dXJuIHNlY3Rpb25zVmlldztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5fZmluZFZpZXdSZWN1cnNpdmUoIHNlY3Rpb25zVmlldywgbW9kZWwgKTtcblx0fSxcblxuXHRfZmluZFZpZXdSZWN1cnNpdmU6IGZ1bmN0aW9uKCBwYXJlbnRWaWV3LCB0YXJnZXRNb2RlbCApIHtcblx0XHRpZiAoICEgcGFyZW50VmlldyB8fCAhIHBhcmVudFZpZXcuY2hpbGRyZW4gKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHR2YXIgZm91bmQgPSBwYXJlbnRWaWV3LmNoaWxkcmVuLmZpbmRCeU1vZGVsKCB0YXJnZXRNb2RlbCApO1xuXHRcdGlmICggZm91bmQgKSB7XG5cdFx0XHRyZXR1cm4gZm91bmQ7XG5cdFx0fVxuXG5cdFx0dmFyIHJlc3VsdCA9IG51bGw7XG5cdFx0cGFyZW50Vmlldy5jaGlsZHJlbi5lYWNoKCBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdFx0aWYgKCAhIHJlc3VsdCApIHtcblx0XHRcdFx0cmVzdWx0ID0gdGhpcy5fZmluZFZpZXdSZWN1cnNpdmUoIGNoaWxkVmlldywgdGFyZ2V0TW9kZWwgKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzICk7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdC8vIC0tIENsaWNrIGhhbmRsZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRvbkl0ZW1DbGljazogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0Ly8gRG9uJ3Qgc2Nyb2xsIGlmIGNsaWNraW5nIG9uIGEgdG9nZ2xlIG9yIGxpc3QtdG9nZ2xlXG5cdFx0aWYgKCBCYWNrYm9uZS4kKCBldmVudC50YXJnZXQgKS5jbG9zZXN0KCAnLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRfX2xpc3QtdG9nZ2xlLCAuZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudF9fdG9nZ2xlJyApLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9zY3JvbGxUb0VsZW1lbnQoKTtcblx0XHR0aGlzLl9zZWxlY3RFbGVtZW50KCk7XG5cblx0XHQvLyBIaWdobGlnaHQgYWN0aXZlIGVsZW1lbnQgaW4gbmF2aWdhdG9yXG5cdFx0QmFja2JvbmUuJCggJyNlbGVtZW50b3ItbmF2aWdhdG9yIC5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1hY3RpdmUnICkucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1hY3RpdmUnICk7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1hY3RpdmUnICk7XG5cdH0sXG5cblx0b25MaXN0VG9nZ2xlQ2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHR0aGlzLl9jb2xsYXBzZWQgPSAhIHRoaXMuX2NvbGxhcHNlZDtcblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLWNvbGxhcHNlZCcsIHRoaXMuX2NvbGxhcHNlZCApO1xuXHR9LFxuXG5cdG9uVmlzaWJpbGl0eVRvZ2dsZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyIGlzSGlkZGVuID0gISB0aGlzLiRlbC5oYXNDbGFzcyggJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLWhpZGRlbicgKTtcblx0XHR0aGlzLiRlbC50b2dnbGVDbGFzcyggJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLWhpZGRlbicsIGlzSGlkZGVuICk7XG5cblx0XHQvLyBIaWRlL3Nob3cgdGhlIGVsZW1lbnQgaW4gdGhlIGVkaXRvciBwcmV2aWV3IHZpYSBuYXRpdmUgRE9NXG5cdFx0dmFyIGVsZW1lbnRJZCA9IHRoaXMubW9kZWwuZ2V0KCAnaWQnICk7XG5cdFx0dmFyIGlmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZWxlbWVudG9yLXByZXZpZXctaWZyYW1lJyApO1xuXG5cdFx0aWYgKCBpZnJhbWUgJiYgaWZyYW1lLmNvbnRlbnREb2N1bWVudCApIHtcblx0XHRcdHZhciBlbCA9IGlmcmFtZS5jb250ZW50RG9jdW1lbnQucXVlcnlTZWxlY3RvciggJ1tkYXRhLWlkPVwiJyArIGVsZW1lbnRJZCArICdcIl0nICk7XG5cblx0XHRcdGlmICggZWwgKSB7XG5cdFx0XHRcdGVsLnN0eWxlLmRpc3BsYXkgPSBpc0hpZGRlbiA/ICdub25lJyA6ICcnO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRvbkNvbnRleHRNZW51OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdC8vIEZpbmQgdGhlIGVkaXRvciB2aWV3IGZvciB0aGlzIG1vZGVsIHRvIGdldCBjb250ZXh0IG1lbnUgZ3JvdXBzXG5cdFx0dmFyIGVkaXRvclZpZXcgPSB0aGlzLl9maW5kRWRpdG9yVmlldyggdGhpcy5tb2RlbCApO1xuXHRcdHZhciBncm91cHMgPSBbXTtcblxuXHRcdGlmICggZWRpdG9yVmlldyAmJiAnZnVuY3Rpb24nID09PSB0eXBlb2YgZWRpdG9yVmlldy5nZXRDb250ZXh0TWVudUdyb3VwcyApIHtcblx0XHRcdGdyb3VwcyA9IGVkaXRvclZpZXcuZ2V0Q29udGV4dE1lbnVHcm91cHMoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gRmFsbGJhY2s6IGJhc2ljIGVkaXQvZGVsZXRlIGFjdGlvbnNcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdGdyb3VwcyA9IFsge1xuXHRcdFx0XHRuYW1lOiAnbmF2aWdhdG9yJyxcblx0XHRcdFx0YWN0aW9uczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG5hbWU6ICdlZGl0Jyxcblx0XHRcdFx0XHRcdHRpdGxlOiAnRWRpdCAnICsgdGhpcy5tb2RlbC5nZXRUaXRsZSgpLFxuXHRcdFx0XHRcdFx0aWNvbjogJzxpIGNsYXNzPVwiZWljb24tZWRpdFwiPjwvaT4nLFxuXHRcdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRzZWxmLl9zZWxlY3RFbGVtZW50KCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRuYW1lOiAnZGVsZXRlJyxcblx0XHRcdFx0XHRcdHRpdGxlOiAnRGVsZXRlJyxcblx0XHRcdFx0XHRcdGljb246ICc8aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPicsXG5cdFx0XHRcdFx0XHRzZXBhcmF0b3I6ICdiZWZvcmUnLFxuXHRcdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRzZWxmLm1vZGVsLmRlc3Ryb3koKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdF1cblx0XHRcdH0gXTtcblx0XHR9XG5cblx0XHRpZiAoICEgZ3JvdXBzLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBCdWlsZCBmYWtlIGV2ZW50IHdpdGggcmVhbCBjb29yZGluYXRlcyBmb3IgdGhlIGNvbnRleHQgbWVudVxuXHRcdGV2ZW50LnJlYWxDbGllbnRYID0gZXZlbnQuY2xpZW50WDtcblx0XHRldmVudC5yZWFsQ2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLnRyaWdnZXIoICdjb250ZXh0LW1lbnU6b3BlbicsIHtcblx0XHRcdGV2ZW50OiBldmVudCxcblx0XHRcdHZpZXc6IGVkaXRvclZpZXcgfHwgdGhpcyxcblx0XHRcdGdyb3VwczogZ3JvdXBzXG5cdFx0fSApO1xuXHR9LFxuXG5cdC8vIC0tIEhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRfc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudElkID0gdGhpcy5tb2RlbC5nZXQoICdpZCcgKTtcblx0XHR2YXIgJGVsID0gZWxlbWVudG9yLiRwcmV2aWV3Q29udGVudHMuZmluZCggJy5lbGVtZW50b3ItZWxlbWVudC0nICsgZWxlbWVudElkICk7XG5cblx0XHRpZiAoICRlbC5sZW5ndGggKSB7XG5cdFx0XHQkZWxbMF0uc2Nyb2xsSW50b1ZpZXcoIHsgYmVoYXZpb3I6ICdzbW9vdGgnLCBibG9jazogJ2NlbnRlcicgfSApO1xuXHRcdH1cblx0fSxcblxuXHRfc2VsZWN0RWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRmluZCB0aGUgYWN0dWFsIGVkaXRvciB2aWV3IGluIHRoZSBpZnJhbWUgYW5kIHRyaWdnZXIgY2xpY2s6ZWRpdFxuXHRcdC8vIHNvIHRoYXQgdGhlIGVsZW1lbnQgZ2V0cyB0aGUgc2VsZWN0aW9uIG92ZXJsYXkgKyB0aGUgcGFuZWwgb3BlbnNcblx0XHR2YXIgZWRpdG9yVmlldyA9IHRoaXMuX2ZpbmRFZGl0b3JWaWV3KCB0aGlzLm1vZGVsICk7XG5cblx0XHRpZiAoIGVkaXRvclZpZXcgKSB7XG5cdFx0XHRlZGl0b3JWaWV3LnRyaWdnZXJNZXRob2QoICdjbGljazplZGl0JyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBGYWxsYmFjazogb3BlbiBwYW5lbCBkaXJlY3RseVxuXHRcdFx0ZWxlbWVudG9yLmdldFBhbmVsVmlldygpLnNldFBhZ2UoICdlZGl0b3InLCB0aGlzLm1vZGVsLmdldFRpdGxlKCksIHtcblx0XHRcdFx0bW9kZWw6IHRoaXMubW9kZWxcblx0XHRcdH0gKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gLS0gU3luYyB3aXRoIGVkaXRvciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdG9uRWxlbWVudHNDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHQvLyBEb24ndCByZS1yZW5kZXIgZHVyaW5nIG5hdmlnYXRvci1pbml0aWF0ZWQgZHJhZyAoRE9NIGlzIGFscmVhZHkgY29ycmVjdClcblx0XHRpZiAoIHRoaXMuX3N1cHByZXNzUmVmcmVzaCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblxuXHRvblNldHRpbmdzQ2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gVXBkYXRlIHRpdGxlIGlmIHNldHRpbmdzIGNoYW5nZWRcblx0XHRpZiAoIHRoaXMudWkudGl0bGUgJiYgdGhpcy51aS50aXRsZS5sZW5ndGggKSB7XG5cdFx0XHR0aGlzLnVpLnRpdGxlLnRleHQoIHRoaXMubW9kZWwuZ2V0VGl0bGUoKSApO1xuXHRcdH1cblx0fVxufSApO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE5hdmlnYXRvclJvb3RWaWV3IOKAlCBDb2xsZWN0aW9uVmlldyBmb3IgdG9wLWxldmVsIHNlY3Rpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuTmF2aWdhdG9yUm9vdFZpZXcgPSBNYXJpb25ldHRlLkNvbGxlY3Rpb25WaWV3LmV4dGVuZCgge1xuXHRjaGlsZFZpZXc6IE5hdmlnYXRvckVsZW1lbnRWaWV3LFxuXG5cdGNsYXNzTmFtZTogJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRzIGVsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnRzLS1yb290JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmNvbGxlY3Rpb24sICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy5vbkNvbGxlY3Rpb25DaGFuZ2VkICk7XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2luaXRTb3J0YWJsZSgpO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLiRlbC5zb3J0YWJsZSAmJiB0aGlzLiRlbC5zb3J0YWJsZSggJ2luc3RhbmNlJyApICkge1xuXHRcdFx0dGhpcy4kZWwuc29ydGFibGUoICdkZXN0cm95JyApO1xuXHRcdH1cblx0fSxcblxuXHRfaW5pdFNvcnRhYmxlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiRlbC5zb3J0YWJsZSgge1xuXHRcdFx0aXRlbXM6ICc+IC5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50Jyxcblx0XHRcdGhhbmRsZTogJz4gLmVsZW1lbnRvci1uYXZpZ2F0b3JfX2l0ZW0nLFxuXHRcdFx0cGxhY2Vob2xkZXI6ICdlbGVtZW50b3ItbmF2aWdhdG9yX19zb3J0YWJsZS1wbGFjZWhvbGRlcicsXG5cdFx0XHR0b2xlcmFuY2U6ICdwb2ludGVyJyxcblx0XHRcdGF4aXM6ICd5Jyxcblx0XHRcdGN1cnNvcjogJ21vdmUnLFxuXHRcdFx0Y29udGFpbm1lbnQ6ICcjZWxlbWVudG9yLW5hdmlnYXRvcicsXG5cdFx0XHRzdGFydDogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRcdFx0dWkuaXRlbS5hZGRDbGFzcyggJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLWRyYWdnaW5nJyApO1xuXHRcdFx0fSxcblx0XHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0XHRcdHVpLml0ZW0ucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50LS1kcmFnZ2luZycgKTtcblx0XHRcdFx0c2VsZi5fb25Tb3J0U3RvcCggZXZlbnQsIHVpICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdF9vblNvcnRTdG9wOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdHZhciAkaXRlbSA9IHVpLml0ZW07XG5cdFx0dmFyIG1vZGVsQ2lkID0gJGl0ZW0uYXR0ciggJ2RhdGEtbW9kZWwtY2lkJyApO1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5nZXQoIHsgY2lkOiBtb2RlbENpZCB9ICk7XG5cblx0XHRpZiAoICEgbW9kZWwgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG5ld0luZGV4ID0gJGl0ZW0ucGFyZW50KCkuY2hpbGRyZW4oICcuZWxlbWVudG9yLW5hdmlnYXRvcl9fZWxlbWVudCcgKS5pbmRleCggJGl0ZW0gKTtcblx0XHR2YXIgb2xkSW5kZXggPSB0aGlzLmNvbGxlY3Rpb24uaW5kZXhPZiggbW9kZWwgKTtcblxuXHRcdGlmICggb2xkSW5kZXggPT09IG5ld0luZGV4ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFVzZSB0aGUgc2FtZSBhcHByb2FjaCBhcyBzb3J0YWJsZS5qczogcmVtb3ZlICsgYWRkQ2hpbGRNb2RlbFxuXHRcdHZhciBzZWN0aW9uc1ZpZXcgPSBlbGVtZW50b3IuZ2V0UmVnaW9uKCAnc2VjdGlvbnMnICkuY3VycmVudFZpZXc7XG5cdFx0aWYgKCBzZWN0aW9uc1ZpZXcgKSB7XG5cdFx0XHR0aGlzLl9zdXBwcmVzc1JlZnJlc2ggPSB0cnVlO1xuXHRcdFx0c2VjdGlvbnNWaWV3LmNvbGxlY3Rpb24ucmVtb3ZlKCBtb2RlbCApO1xuXHRcdFx0c2VjdGlvbnNWaWV3LmFkZENoaWxkTW9kZWwoIG1vZGVsLCB7IGF0OiBuZXdJbmRleCB9ICk7XG5cdFx0XHR0aGlzLl9zdXBwcmVzc1JlZnJlc2ggPSBmYWxzZTtcblx0XHR9XG5cblx0XHRlbGVtZW50b3Iuc2V0RmxhZ0VkaXRvckNoYW5nZSggdHJ1ZSApO1xuXHR9LFxuXG5cdG9uQ29sbGVjdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5fc3VwcHJlc3NSZWZyZXNoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnJlbmRlcigpO1xuXHR9XG59ICk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gTmF2aWdhdG9yVmlldyDigJQgbWFpbiBsYXlvdXQgKGhlYWRlciArIHRyZWUgKyBmb290ZXIpXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuTmF2aWdhdG9yVmlldyA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItbmF2aWdhdG9yJyApLFxuXG5cdGVsOiAnI2VsZW1lbnRvci1uYXZpZ2F0b3InLFxuXG5cdHJlZ2lvbnM6IHtcblx0XHRlbGVtZW50czogJyNlbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50cydcblx0fSxcblxuXHR1aToge1xuXHRcdHRvZ2dsZUFsbDogJyNlbGVtZW50b3ItbmF2aWdhdG9yX190b2dnbGUtYWxsJyxcblx0XHRjbG9zZTogJyNlbGVtZW50b3ItbmF2aWdhdG9yX19jbG9zZScsXG5cdFx0aGVhZGVyOiAnI2VsZW1lbnRvci1uYXZpZ2F0b3JfX2hlYWRlcidcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgQHVpLnRvZ2dsZUFsbCc6ICdvblRvZ2dsZUFsbCcsXG5cdFx0J2NsaWNrIEB1aS5jbG9zZSc6ICdvbkNsb3NlJ1xuXHR9LFxuXG5cdF9hbGxFeHBhbmRlZDogZmFsc2UsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5saXN0ZW5UbyggZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvciwgJ25hdmlnYXRvcjp0b2dnbGUnLCB0aGlzLnRvZ2dsZSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5lZGl0b3IsICduYXZpZ2F0b3I6cmVmcmVzaCcsIHRoaXMucmVmcmVzaFRyZWUgKTtcblxuXHRcdC8vIExpc3RlbiBmb3IgZWRpdCBtb2RlIHN3aXRjaGVzIOKAlCBoaWRlIG5hdmlnYXRvciBpbiBwcmV2aWV3IG1vZGVcblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YUVkaXRNb2RlLCAnc3dpdGNoJywgdGhpcy5vbkVkaXRNb2RlU3dpdGNoICk7XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFNob3cgdGhlIHJvb3QgdHJlZVxuXHRcdHRoaXMucmVmcmVzaFRyZWUoKTtcblxuXHRcdC8vIE1ha2UgdGhlIHBhbmVsIGRyYWdnYWJsZSBieSB0aGUgaGVhZGVyXG5cdFx0dGhpcy4kZWwuZHJhZ2dhYmxlKCB7XG5cdFx0XHRoYW5kbGU6ICcjZWxlbWVudG9yLW5hdmlnYXRvcl9faGVhZGVyJyxcblx0XHRcdGNvbnRhaW5tZW50OiAnd2luZG93Jyxcblx0XHRcdGRpc3RhbmNlOiAxMFxuXHRcdH0gKTtcblxuXHRcdC8vIE1ha2UgdGhlIHBhbmVsIHJlc2l6YWJsZSBieSB0aGUgZm9vdGVyIChzb3V0aCBoYW5kbGUpXG5cdFx0aWYgKCAkLmZuLnJlc2l6YWJsZSApIHtcblx0XHRcdHRoaXMuJGVsLnJlc2l6YWJsZSgge1xuXHRcdFx0XHRoYW5kbGVzOiB7IHM6ICcjZWxlbWVudG9yLW5hdmlnYXRvcl9fZm9vdGVyJyB9LFxuXHRcdFx0XHRtaW5IZWlnaHQ6IDI1MFxuXHRcdFx0fSApO1xuXHRcdH1cblx0fSxcblxuXHRyZWZyZXNoVHJlZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZXRSZWdpb24oICdlbGVtZW50cycgKS5zaG93KCBuZXcgTmF2aWdhdG9yUm9vdFZpZXcoIHtcblx0XHRcdGNvbGxlY3Rpb246IGVsZW1lbnRvci5lbGVtZW50c1xuXHRcdH0gKSApO1xuXHR9LFxuXG5cdHRvZ2dsZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3ItbmF2aWdhdG9yLS1vcGVuJyApO1xuXHR9LFxuXG5cdHNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnZWxlbWVudG9yLW5hdmlnYXRvci0tb3BlbicgKTtcblx0fSxcblxuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci1uYXZpZ2F0b3ItLW9wZW4nICk7XG5cdH0sXG5cblx0b25Ub2dnbGVBbGw6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2FsbEV4cGFuZGVkID0gISB0aGlzLl9hbGxFeHBhbmRlZDtcblxuXHRcdHZhciBhY3Rpb24gPSB0aGlzLl9hbGxFeHBhbmRlZCA/ICdyZW1vdmVDbGFzcycgOiAnYWRkQ2xhc3MnO1xuXG5cdFx0dGhpcy4kZWwuZmluZCggJy5lbGVtZW50b3ItbmF2aWdhdG9yX19lbGVtZW50JyApWyBhY3Rpb24gXSggJ2VsZW1lbnRvci1uYXZpZ2F0b3JfX2VsZW1lbnQtLWNvbGxhcHNlZCcgKTtcblxuXHRcdC8vIFVwZGF0ZSBpY29uXG5cdFx0dGhpcy51aS50b2dnbGVBbGxcblx0XHRcdC50b2dnbGVDbGFzcyggJ2VpY29uLWV4cGFuZCcsICEgdGhpcy5fYWxsRXhwYW5kZWQgKVxuXHRcdFx0LnRvZ2dsZUNsYXNzKCAnZWljb24tY29sbGFwc2UnLCB0aGlzLl9hbGxFeHBhbmRlZCApO1xuXHR9LFxuXG5cdG9uQ2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaGlkZSgpO1xuXG5cdFx0Ly8gRGVhY3RpdmF0ZSB0aGUgdG9wYmFyIGJ1dHRvblxuXHRcdEJhY2tib25lLiQoICcjZWxlbWVudG9yLXRvcGJhci1uYXZpZ2F0b3InICkucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdH0sXG5cblx0b25FZGl0TW9kZVN3aXRjaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YUVkaXRNb2RlLnJlcXVlc3QoICdhY3RpdmVNb2RlJyApO1xuXG5cdFx0aWYgKCAncHJldmlldycgPT09IGFjdGl2ZU1vZGUgKSB7XG5cdFx0XHR0aGlzLmhpZGUoKTtcblx0XHR9XG5cdH1cbn0gKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnQg4oCUIGluaXQgZnVuY3Rpb24gKGNhbGxlZCBmcm9tIGVkaXRvci5qcylcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgbmF2aWdhdG9ySW5zdGFuY2UgPSBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0aW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIG5hdmlnYXRvckluc3RhbmNlICkge1xuXHRcdFx0bmF2aWdhdG9ySW5zdGFuY2UgPSBuZXcgTmF2aWdhdG9yVmlldygpO1xuXHRcdFx0bmF2aWdhdG9ySW5zdGFuY2UucmVuZGVyKCk7XG5cdFx0fVxuXHRcdHJldHVybiBuYXZpZ2F0b3JJbnN0YW5jZTtcblx0fSxcblxuXHRnZXRJbnN0YW5jZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG5hdmlnYXRvckluc3RhbmNlO1xuXHR9XG59O1xuIiwidmFyIFN0eWxlTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLXN0eWxlcy9tb2RlbHMvc3R5bGUnICk7XG5cbnZhciBTdHlsZUNvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRtb2RlbDogU3R5bGVNb2RlbFxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlQ29sbGVjdGlvbjtcbiIsInZhciBTdHlsZUxpYnJhcnlMYXlvdXRWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvbGF5b3V0JyApLFxuXHRTdHlsZUNvbGxlY3Rpb24gPSByZXF1aXJlKCAnZWxlbWVudG9yLXN0eWxlcy9jb2xsZWN0aW9ucy9zdHlsZXMnICksXG5cdFN0eWxlTGlicmFyeU1hbmFnZXI7XG5cblN0eWxlTGlicmFyeU1hbmFnZXIgPSBmdW5jdGlvbigpIHtcblx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdG1vZGFsLFxuXHRcdGRlbGV0ZURpYWxvZyxcblx0XHRsYXlvdXQsXG5cdFx0c3R5bGVzQ29sbGVjdGlvbjtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIENvbGxlY3Rpb24gaGVscGVyc1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHR2YXIgZW5zdXJlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISBzdHlsZXNDb2xsZWN0aW9uICkge1xuXHRcdFx0dmFyIGRhdGEgPSAoIGVsZW1lbnRvci5jb25maWcgJiYgZWxlbWVudG9yLmNvbmZpZy53aWRnZXRTdHlsZXMgKSB8fCBbXTtcblx0XHRcdHN0eWxlc0NvbGxlY3Rpb24gPSBuZXcgU3R5bGVDb2xsZWN0aW9uKCBkYXRhICk7XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuZ2V0U3R5bGVzQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdGVuc3VyZUNvbGxlY3Rpb24oKTtcblx0XHRyZXR1cm4gc3R5bGVzQ29sbGVjdGlvbjtcblx0fTtcblxuXHQvKipcblx0ICogUmV0dXJuIHN0eWxlcyBmaWx0ZXJlZCBieSB3aWRnZXQgdHlwZS5cblx0ICovXG5cdHRoaXMuZ2V0U3R5bGVzRm9yV2lkZ2V0ID0gZnVuY3Rpb24oIHdpZGdldFR5cGUgKSB7XG5cdFx0ZW5zdXJlQ29sbGVjdGlvbigpO1xuXHRcdHJldHVybiBzdHlsZXNDb2xsZWN0aW9uLmZpbHRlciggZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0cmV0dXJuIG1vZGVsLmdldCggJ3dpZGdldF90eXBlJyApID09PSB3aWRnZXRUeXBlO1xuXHRcdH0gKTtcblx0fTtcblxuXHQvKipcblx0ICogUmV0dXJuIHRoZSBkZWZhdWx0IHN0eWxlIGZvciBhIHdpZGdldCB0eXBlLCBvciBudWxsLlxuXHQgKi9cblx0dGhpcy5nZXREZWZhdWx0U3R5bGUgPSBmdW5jdGlvbiggd2lkZ2V0VHlwZSApIHtcblx0XHRlbnN1cmVDb2xsZWN0aW9uKCk7XG5cdFx0cmV0dXJuIHN0eWxlc0NvbGxlY3Rpb24uZmluZCggZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0cmV0dXJuIG1vZGVsLmdldCggJ3dpZGdldF90eXBlJyApID09PSB3aWRnZXRUeXBlICYmIG1vZGVsLmdldCggJ2lzX2RlZmF1bHQnICk7XG5cdFx0fSApIHx8IG51bGw7XG5cdH07XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vICBNb2RhbCBtYW5hZ2VtZW50XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHRoaXMuZ2V0TW9kYWwgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgbW9kYWwgKSB7XG5cdFx0XHRtb2RhbCA9IGVsZW1lbnRvci5kaWFsb2dzTWFuYWdlci5jcmVhdGVXaWRnZXQoICdlbGVtZW50b3ItbW9kYWwnLCB7XG5cdFx0XHRcdGlkOiAnZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktbW9kYWwnLFxuXHRcdFx0XHRjbG9zZUJ1dHRvbjogZmFsc2Vcblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0cmV0dXJuIG1vZGFsO1xuXHR9O1xuXG5cdHRoaXMuZ2V0TGF5b3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGxheW91dDtcblx0fTtcblxuXHR2YXIgaW5pdExheW91dCA9IGZ1bmN0aW9uKCkge1xuXHRcdGxheW91dCA9IG5ldyBTdHlsZUxpYnJhcnlMYXlvdXRWaWV3KCk7XG5cdH07XG5cblx0dGhpcy5zdGFydE1vZGFsID0gZnVuY3Rpb24oIG9uUmVhZHkgKSB7XG5cdFx0c2VsZi5nZXRNb2RhbCgpLnNob3coKTtcblxuXHRcdGlmICggISBsYXlvdXQgKSB7XG5cdFx0XHRpbml0TGF5b3V0KCk7XG5cdFx0fVxuXG5cdFx0bGF5b3V0LnNob3dMb2FkaW5nVmlldygpO1xuXG5cdFx0c2VsZi5yZXF1ZXN0U3R5bGVzKCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggb25SZWFkeSApIHtcblx0XHRcdFx0b25SZWFkeSgpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIEFKQVhcblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0dGhpcy5yZXF1ZXN0U3R5bGVzID0gZnVuY3Rpb24oIGNhbGxiYWNrLCBmb3JjZVVwZGF0ZSApIHtcblx0XHRpZiAoIHN0eWxlc0NvbGxlY3Rpb24gJiYgISBmb3JjZVVwZGF0ZSApIHtcblx0XHRcdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0ZWxlbWVudG9yLmFqYXguc2VuZCggJ0dldFdpZGdldFN0eWxlcycsIHtcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRzdHlsZXNDb2xsZWN0aW9uID0gbmV3IFN0eWxlQ29sbGVjdGlvbiggZGF0YSApO1xuXG5cdFx0XHRcdC8vIEtlZXAgY29uZmlnIGNhY2hlIGluIHN5bmNcblx0XHRcdFx0ZWxlbWVudG9yLmNvbmZpZy53aWRnZXRTdHlsZXMgPSBkYXRhO1xuXG5cdFx0XHRcdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fTtcblxuXHR0aGlzLnNhdmVTdHlsZSA9IGZ1bmN0aW9uKCB3aWRnZXRUeXBlLCBuYW1lLCBzZXR0aW5ncywgY2FsbGJhY2sgKSB7XG5cdFx0ZWxlbWVudG9yLmFqYXguc2VuZCggJ1NhdmVXaWRnZXRTdHlsZScsIHtcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0d2lkZ2V0X3R5cGU6IHdpZGdldFR5cGUsXG5cdFx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRcdHNldHRpbmdzOiBKU09OLnN0cmluZ2lmeSggc2V0dGluZ3MgKVxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRpZiAoICEgc3R5bGVzQ29sbGVjdGlvbiApIHtcblx0XHRcdFx0XHRzdHlsZXNDb2xsZWN0aW9uID0gbmV3IFN0eWxlQ29sbGVjdGlvbigpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHN0eWxlRGF0YSA9IHtcblx0XHRcdFx0XHRpZF93aWRnZXRfc3R5bGU6IGRhdGEuaWRfd2lkZ2V0X3N0eWxlLFxuXHRcdFx0XHRcdHdpZGdldF90eXBlOiBkYXRhLndpZGdldF90eXBlLFxuXHRcdFx0XHRcdG5hbWU6IGRhdGEubmFtZSxcblx0XHRcdFx0XHRzZXR0aW5nczogc2V0dGluZ3MsXG5cdFx0XHRcdFx0aXNfZGVmYXVsdDogZGF0YS5pc19kZWZhdWx0LFxuXHRcdFx0XHRcdGV4cG9ydF9saW5rOiBkYXRhLmV4cG9ydF9saW5rIHx8ICcnXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIG5ld01vZGVsID0gc3R5bGVzQ29sbGVjdGlvbi5hZGQoIHN0eWxlRGF0YSApO1xuXG5cdFx0XHRcdC8vIEFsc28gdXBkYXRlIHRoZSBjb25maWcgY2FjaGVcblx0XHRcdFx0aWYgKCAhIGVsZW1lbnRvci5jb25maWcud2lkZ2V0U3R5bGVzICkge1xuXHRcdFx0XHRcdGVsZW1lbnRvci5jb25maWcud2lkZ2V0U3R5bGVzID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxlbWVudG9yLmNvbmZpZy53aWRnZXRTdHlsZXMucHVzaCggc3R5bGVEYXRhICk7XG5cblx0XHRcdFx0aWYgKCBjYWxsYmFjayApIHtcblx0XHRcdFx0XHRjYWxsYmFjayggbmV3TW9kZWwgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIERlbGV0ZVxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHR0aGlzLmdldERlbGV0ZURpYWxvZyA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISBkZWxldGVEaWFsb2cgKSB7XG5cdFx0XHRkZWxldGVEaWFsb2cgPSBlbGVtZW50b3IuZGlhbG9nc01hbmFnZXIuY3JlYXRlV2lkZ2V0KCAnY29uZmlybScsIHtcblx0XHRcdFx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1kZWxldGUtZGlhbG9nJyxcblx0XHRcdFx0aGVhZGVyTWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RlbGV0ZV9zdHlsZScgKSxcblx0XHRcdFx0bWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RlbGV0ZV9zdHlsZV9jb25maXJtJyApLFxuXHRcdFx0XHRzdHJpbmdzOiB7XG5cdFx0XHRcdFx0Y29uZmlybTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RlbGV0ZScgKVxuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXHRcdHJldHVybiBkZWxldGVEaWFsb2c7XG5cdH07XG5cblx0dGhpcy5kZWxldGVTdHlsZSA9IGZ1bmN0aW9uKCBzdHlsZU1vZGVsICkge1xuXHRcdHZhciBkaWFsb2cgPSBzZWxmLmdldERlbGV0ZURpYWxvZygpO1xuXG5cdFx0ZGlhbG9nLm9uQ29uZmlybSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudG9yLmFqYXguc2VuZCggJ0RlbGV0ZVdpZGdldFN0eWxlJywge1xuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0aWRfd2lkZ2V0X3N0eWxlOiBzdHlsZU1vZGVsLmdldCggJ2lkX3dpZGdldF9zdHlsZScgKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvLyBSZW1vdmUgZnJvbSBjb25maWcgY2FjaGVcblx0XHRcdFx0XHRzZWxmLl9yZW1vdmVGcm9tQ29uZmlnQ2FjaGUoIHN0eWxlTW9kZWwuZ2V0KCAnaWRfd2lkZ2V0X3N0eWxlJyApICk7XG5cblx0XHRcdFx0XHRzdHlsZXNDb2xsZWN0aW9uLnJlbW92ZSggc3R5bGVNb2RlbCwgeyBzaWxlbnQ6IHRydWUgfSApO1xuXHRcdFx0XHRcdHNlbGYuc2hvd1N0eWxlcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fTtcblxuXHRcdGRpYWxvZy5zaG93KCk7XG5cdH07XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vICBTZXQgLyB1bnNldCBkZWZhdWx0XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHRoaXMudG9nZ2xlRGVmYXVsdCA9IGZ1bmN0aW9uKCBzdHlsZU1vZGVsICkge1xuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdTZXRXaWRnZXRTdHlsZURlZmF1bHQnLCB7XG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGlkX3dpZGdldF9zdHlsZTogc3R5bGVNb2RlbC5nZXQoICdpZF93aWRnZXRfc3R5bGUnIClcblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0dmFyIHdpZGdldFR5cGUgPSBzdHlsZU1vZGVsLmdldCggJ3dpZGdldF90eXBlJyApO1xuXG5cdFx0XHRcdC8vIFJlc2V0IGFsbCBkZWZhdWx0cyBmb3IgdGhpcyB3aWRnZXQgdHlwZSBpbiBjb2xsZWN0aW9uXG5cdFx0XHRcdHN0eWxlc0NvbGxlY3Rpb24uZWFjaCggZnVuY3Rpb24oIG0gKSB7XG5cdFx0XHRcdFx0aWYgKCBtLmdldCggJ3dpZGdldF90eXBlJyApID09PSB3aWRnZXRUeXBlICkge1xuXHRcdFx0XHRcdFx0bS5zZXQoICdpc19kZWZhdWx0JywgMCwgeyBzaWxlbnQ6IHRydWUgfSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdHN0eWxlTW9kZWwuc2V0KCAnaXNfZGVmYXVsdCcsIGRhdGEuaXNfZGVmYXVsdCApO1xuXG5cdFx0XHRcdC8vIFVwZGF0ZSBjb25maWcgY2FjaGVcblx0XHRcdFx0c2VsZi5fc3luY0NvbmZpZ0NhY2hlKCk7XG5cblx0XHRcdFx0Ly8gUmUtcmVuZGVyIGlmIG1vZGFsIGlzIG9wZW5cblx0XHRcdFx0aWYgKCBsYXlvdXQgKSB7XG5cdFx0XHRcdFx0c2VsZi5zaG93U3R5bGVzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ICk7XG5cdH07XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vICBBcHBseSBhIHN0eWxlIHRvIGEgd2lkZ2V0IG1vZGVsXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHRoaXMuYXBwbHlTdHlsZSA9IGZ1bmN0aW9uKCBzdHlsZU1vZGVsLCB0YXJnZXRXaWRnZXRNb2RlbCApIHtcblx0XHR2YXIgc2V0dGluZ3MgPSBzdHlsZU1vZGVsLmdldCggJ3NldHRpbmdzJyApO1xuXHRcdGlmICggISBzZXR0aW5ncyB8fCB0eXBlb2Ygc2V0dGluZ3MgIT09ICdvYmplY3QnICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciB0YXJnZXRTZXR0aW5ncyA9IHRhcmdldFdpZGdldE1vZGVsLmdldCggJ3NldHRpbmdzJyApO1xuXHRcdGlmICggISB0YXJnZXRTZXR0aW5ncyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBNZXJnZSBzdHlsZSBzZXR0aW5ncyBvbnRvIHRoZSB0YXJnZXQgd2lkZ2V0XG5cdFx0T2JqZWN0LmtleXMoIHNldHRpbmdzICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcblx0XHRcdC8vIFNraXAgc3lzdGVtIGtleXNcblx0XHRcdGlmICgga2V5ID09PSAnd2lkZ2V0VHlwZScgfHwga2V5ID09PSAnZWxUeXBlJyB8fCBrZXkgPT09ICdpc0lubmVyJyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dGFyZ2V0U2V0dGluZ3Muc2V0KCBrZXksIHNldHRpbmdzWyBrZXkgXSApO1xuXHRcdH0gKTtcblx0fTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIFZpZXcgZGlzcGxheVxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHR0aGlzLnNob3dTdHlsZXMgPSBmdW5jdGlvbigpIHtcblx0XHRsYXlvdXQuc2hvd1N0eWxlc1ZpZXcoIHN0eWxlc0NvbGxlY3Rpb24gKTtcblx0fTtcblxuXHR0aGlzLnNob3dTYXZlU3R5bGVWaWV3ID0gZnVuY3Rpb24oIHdpZGdldFR5cGUsIHNldHRpbmdzICkge1xuXHRcdGxheW91dC5zaG93U2F2ZVN0eWxlVmlldyggd2lkZ2V0VHlwZSwgc2V0dGluZ3MgKTtcblx0fTtcblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIENvbmZpZyBjYWNoZSBoZWxwZXJzXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHRoaXMuX3JlbW92ZUZyb21Db25maWdDYWNoZSA9IGZ1bmN0aW9uKCBpZCApIHtcblx0XHRpZiAoICEgZWxlbWVudG9yLmNvbmZpZy53aWRnZXRTdHlsZXMgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVsZW1lbnRvci5jb25maWcud2lkZ2V0U3R5bGVzID0gZWxlbWVudG9yLmNvbmZpZy53aWRnZXRTdHlsZXMuZmlsdGVyKCBmdW5jdGlvbiggcyApIHtcblx0XHRcdHJldHVybiBzLmlkX3dpZGdldF9zdHlsZSAhPT0gaWQ7XG5cdFx0fSApO1xuXHR9O1xuXG5cdHRoaXMuX3N5bmNDb25maWdDYWNoZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISBzdHlsZXNDb2xsZWN0aW9uICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbGVtZW50b3IuY29uZmlnLndpZGdldFN0eWxlcyA9IHN0eWxlc0NvbGxlY3Rpb24udG9KU09OKCk7XG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTdHlsZUxpYnJhcnlNYW5hZ2VyKCk7XG4iLCJ2YXIgU3R5bGVNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXHRkZWZhdWx0czoge1xuXHRcdGlkX3dpZGdldF9zdHlsZTogMCxcblx0XHR3aWRnZXRfdHlwZTogJycsXG5cdFx0bmFtZTogJycsXG5cdFx0c2V0dGluZ3M6IHt9LFxuXHRcdGlzX2RlZmF1bHQ6IDAsXG5cdFx0ZXhwb3J0X2xpbms6ICcnXG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsZU1vZGVsO1xuIiwidmFyIFN0eWxlTGlicmFyeUhlYWRlclZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXN0eWxlcy92aWV3cy9wYXJ0cy9oZWFkZXInICksXG5cdFN0eWxlTGlicmFyeUhlYWRlckxvZ29WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvaGVhZGVyLWxvZ28nICksXG5cdFN0eWxlTGlicmFyeUhlYWRlclNhdmVWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvaGVhZGVyLXNhdmUnICksXG5cdFN0eWxlTGlicmFyeUhlYWRlckxvYWRWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvaGVhZGVyLWxvYWQnICksXG5cdFN0eWxlTGlicmFyeUxvYWRpbmdWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvbG9hZGluZycgKSxcblx0U3R5bGVMaWJyYXJ5Q29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXN0eWxlcy92aWV3cy9wYXJ0cy9zdHlsZXMnICksXG5cdFN0eWxlTGlicmFyeVNhdmVWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvc2F2ZS1zdHlsZScgKSxcblx0U3R5bGVMaWJyYXJ5TG9hZFN0eWxlVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itc3R5bGVzL3ZpZXdzL3BhcnRzL2xvYWQtc3R5bGUnICksXG5cdFN0eWxlTGlicmFyeUxheW91dFZpZXc7XG5cblN0eWxlTGlicmFyeUxheW91dFZpZXcgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKCB7XG5cdGVsOiAnI2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LW1vZGFsJyxcblxuXHRyZWdpb25zOiB7XG5cdFx0bW9kYWxDb250ZW50OiAnLmRpYWxvZy1tZXNzYWdlJyxcblx0XHRtb2RhbEhlYWRlcjogJy5kaWFsb2ctd2lkZ2V0LWhlYWRlcidcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ21vZGFsSGVhZGVyJyApLnNob3coIG5ldyBTdHlsZUxpYnJhcnlIZWFkZXJWaWV3KCkgKTtcblx0fSxcblxuXHRnZXRIZWFkZXJWaWV3OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRSZWdpb24oICdtb2RhbEhlYWRlcicgKS5jdXJyZW50Vmlldztcblx0fSxcblxuXHRzaG93TG9hZGluZ1ZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2V0UmVnaW9uKCAnbW9kYWxDb250ZW50JyApLnNob3coIG5ldyBTdHlsZUxpYnJhcnlMb2FkaW5nVmlldygpICk7XG5cdH0sXG5cblx0c2hvd1N0eWxlc1ZpZXc6IGZ1bmN0aW9uKCBzdHlsZXNDb2xsZWN0aW9uICkge1xuXHRcdHRoaXMuZ2V0UmVnaW9uKCAnbW9kYWxDb250ZW50JyApLnNob3coIG5ldyBTdHlsZUxpYnJhcnlDb2xsZWN0aW9uVmlldygge1xuXHRcdFx0Y29sbGVjdGlvbjogc3R5bGVzQ29sbGVjdGlvblxuXHRcdH0gKSApO1xuXG5cdFx0dmFyIGhlYWRlclZpZXcgPSB0aGlzLmdldEhlYWRlclZpZXcoKTtcblx0XHRoZWFkZXJWaWV3LmxvZ29BcmVhLnNob3coIG5ldyBTdHlsZUxpYnJhcnlIZWFkZXJMb2dvVmlldygpICk7XG5cdFx0aGVhZGVyVmlldy50b29scy5zaG93KCBuZXcgU3R5bGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXcoKSApO1xuXHRcdGhlYWRlclZpZXcudG9vbHMyLnNob3coIG5ldyBTdHlsZUxpYnJhcnlIZWFkZXJMb2FkVmlldygpICk7XG5cdH0sXG5cblx0c2hvd1NhdmVTdHlsZVZpZXc6IGZ1bmN0aW9uKCB3aWRnZXRUeXBlLCBzZXR0aW5ncyApIHtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ21vZGFsQ29udGVudCcgKS5zaG93KCBuZXcgU3R5bGVMaWJyYXJ5U2F2ZVZpZXcoIHtcblx0XHRcdHdpZGdldFR5cGU6IHdpZGdldFR5cGUsXG5cdFx0XHRzZXR0aW5nczogc2V0dGluZ3Ncblx0XHR9ICkgKTtcblxuXHRcdHZhciBoZWFkZXJWaWV3ID0gdGhpcy5nZXRIZWFkZXJWaWV3KCk7XG5cdFx0aGVhZGVyVmlldy5sb2dvQXJlYS5zaG93KCBuZXcgU3R5bGVMaWJyYXJ5SGVhZGVyTG9nb1ZpZXcoKSApO1xuXHRcdGhlYWRlclZpZXcudG9vbHMucmVzZXQoKTtcblx0XHRoZWFkZXJWaWV3LnRvb2xzMi5zaG93KCBuZXcgU3R5bGVMaWJyYXJ5SGVhZGVyTG9hZFZpZXcoKSApO1xuXHR9LFxuXG5cdHNob3dMb2FkU3R5bGVWaWV3OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ21vZGFsQ29udGVudCcgKS5zaG93KCBuZXcgU3R5bGVMaWJyYXJ5TG9hZFN0eWxlVmlldygpICk7XG5cblx0XHR2YXIgaGVhZGVyVmlldyA9IHRoaXMuZ2V0SGVhZGVyVmlldygpO1xuXHRcdGhlYWRlclZpZXcubG9nb0FyZWEuc2hvdyggbmV3IFN0eWxlTGlicmFyeUhlYWRlckxvZ29WaWV3KCkgKTtcblx0XHRoZWFkZXJWaWV3LnRvb2xzLnNob3coIG5ldyBTdHlsZUxpYnJhcnlIZWFkZXJTYXZlVmlldygpICk7XG5cdFx0aGVhZGVyVmlldy50b29sczIucmVzZXQoKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUxheW91dFZpZXc7XG4iLCJ2YXIgU3R5bGVMaWJyYXJ5SGVhZGVyTG9hZFZpZXc7XG5cblN0eWxlTGlicmFyeUhlYWRlckxvYWRWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3Itc3R5bGUtbGlicmFyeS1oZWFkZXItbG9hZCcsXG5cblx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1oZWFkZXItbG9hZCcsXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLWl0ZW0nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuZ2V0TGF5b3V0KCkuc2hvd0xvYWRTdHlsZVZpZXcoKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUhlYWRlckxvYWRWaWV3O1xuIiwidmFyIFN0eWxlTGlicmFyeUhlYWRlckxvZ29WaWV3O1xuXG5TdHlsZUxpYnJhcnlIZWFkZXJMb2dvVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLWxvZ28nLFxuXG5cdGlkOiAnZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLWxvZ28nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuc2hvd1N0eWxlcygpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGVMaWJyYXJ5SGVhZGVyTG9nb1ZpZXc7XG4iLCJ2YXIgU3R5bGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXc7XG5cblN0eWxlTGlicmFyeUhlYWRlclNhdmVWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3Itc3R5bGUtbGlicmFyeS1oZWFkZXItc2F2ZScsXG5cblx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1oZWFkZXItc2F2ZScsXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLWl0ZW0nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuZ2V0TGF5b3V0KCkuc2hvd1NhdmVTdHlsZVZpZXcoICcnLCB7fSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXc7XG4iLCJ2YXIgU3R5bGVMaWJyYXJ5SGVhZGVyVmlldztcblxuU3R5bGVMaWJyYXJ5SGVhZGVyVmlldyA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1oZWFkZXInLFxuXG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyJyxcblxuXHRyZWdpb25zOiB7XG5cdFx0bG9nb0FyZWE6ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLWxvZ28tYXJlYScsXG5cdFx0dG9vbHM6ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLXRvb2xzJyxcblx0XHR0b29sczI6ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLXRvb2xzMicsXG5cdFx0bWVudUFyZWE6ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLW1lbnUtYXJlYSdcblx0fSxcblxuXHR1aToge1xuXHRcdGNsb3NlTW9kYWw6ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktaGVhZGVyLWNsb3NlLW1vZGFsJ1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayBAdWkuY2xvc2VNb2RhbCc6ICdvbkNsb3NlTW9kYWxDbGljaydcblx0fSxcblxuXHRvbkNsb3NlTW9kYWxDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5nZXRNb2RhbCgpLmhpZGUoKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUhlYWRlclZpZXc7XG4iLCJ2YXIgU3R5bGVMaWJyYXJ5TG9hZFZpZXc7XG5cblN0eWxlTGlicmFyeUxvYWRWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1sb2FkLXN0eWxlJyxcblxuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1zdHlsZS1saWJyYXJ5LWxvYWQtc3R5bGUnLFxuXG5cdHVpOiB7XG5cdFx0Zm9ybTogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1sb2FkLXN0eWxlLWZvcm0nLFxuXHRcdHN1Ym1pdEJ1dHRvbjogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1sb2FkLXN0eWxlLXN1Ym1pdCcsXG5cdFx0ZmlsZUlucHV0OiAnI2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LWxvYWQtc3R5bGUtZmlsZScsXG5cdFx0ZmlsZUlucHV0TmljZTogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1sb2FkLWJ0bi1maWxlJ1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdzdWJtaXQgQHVpLmZvcm0nOiAnb25Gb3JtU3VibWl0Jyxcblx0XHQnY2hhbmdlIEB1aS5maWxlSW5wdXQnOiAnb25GaWxlQ2hhbmdlJ1xuXHR9LFxuXG5cdG9uRmlsZUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0QmFja2JvbmUuJCggdGhpcy51aS5maWxlSW5wdXROaWNlICkudGV4dChcblx0XHRcdEJhY2tib25lLiQoIHRoaXMudWkuZmlsZUlucHV0IClbMF0uZmlsZXNbMF0ubmFtZVxuXHRcdCk7XG5cdH0sXG5cblx0b25Gb3JtU3VibWl0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHRoaXMudWkuc3VibWl0QnV0dG9uLmFkZENsYXNzKCAnZWxlbWVudG9yLWJ0bi1zdGF0ZScgKTtcblxuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdJbXBvcnRXaWRnZXRTdHlsZScsIHtcblx0XHRcdGRhdGE6IG5ldyBGb3JtRGF0YSggdGhpcy51aS5mb3JtWzBdICksXG5cdFx0XHRwcm9jZXNzRGF0YTogZmFsc2UsXG5cdFx0XHRjb250ZW50VHlwZTogZmFsc2UsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5nZXRTdHlsZXNDb2xsZWN0aW9uKCkuYWRkKCBkYXRhICk7XG5cdFx0XHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuX3N5bmNDb25maWdDYWNoZSgpO1xuXHRcdFx0XHRlbGVtZW50b3Iuc3R5bGVMaWJyYXJ5LnNob3dTdHlsZXMoKTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuc2hvd1N0eWxlcygpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUxvYWRWaWV3O1xuIiwidmFyIFN0eWxlTGlicmFyeUxvYWRpbmdWaWV3O1xuXG5TdHlsZUxpYnJhcnlMb2FkaW5nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdGlkOiAnZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktbG9hZGluZycsXG5cblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3Itc3R5bGUtbGlicmFyeS1sb2FkaW5nJ1xufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUxvYWRpbmdWaWV3O1xuIiwidmFyIFN0eWxlTGlicmFyeVNhdmVWaWV3O1xuXG5TdHlsZUxpYnJhcnlTYXZlVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdGlkOiAnZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktc2F2ZS1zdHlsZScsXG5cblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3Itc3R5bGUtbGlicmFyeS1zYXZlLXN0eWxlJyxcblxuXHR1aToge1xuXHRcdGZvcm06ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktc2F2ZS1zdHlsZS1mb3JtJyxcblx0XHRzdWJtaXRCdXR0b246ICcjZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktc2F2ZS1zdHlsZS1zdWJtaXQnLFxuXHRcdG5hbWVJbnB1dDogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1zYXZlLXN0eWxlLW5hbWUnLFxuXHRcdHdpZGdldFR5cGVJbnB1dDogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1zYXZlLXdpZGdldC10eXBlJyxcblx0XHRzZXR0aW5nc0lucHV0OiAnI2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXNhdmUtc2V0dGluZ3MnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J3N1Ym1pdCBAdWkuZm9ybSc6ICdvbkZvcm1TdWJtaXQnXG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB3aWRnZXRUeXBlID0gdGhpcy5nZXRPcHRpb24oICd3aWRnZXRUeXBlJyApIHx8ICcnO1xuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0T3B0aW9uKCAnc2V0dGluZ3MnICkgfHwge307XG5cblx0XHR0aGlzLnVpLndpZGdldFR5cGVJbnB1dC52YWwoIHdpZGdldFR5cGUgKTtcblx0XHR0aGlzLnVpLnNldHRpbmdzSW5wdXQudmFsKCBKU09OLnN0cmluZ2lmeSggc2V0dGluZ3MgKSApO1xuXHR9LFxuXG5cdG9uRm9ybVN1Ym1pdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5hbWUgPSB0aGlzLnVpLm5hbWVJbnB1dC52YWwoKS50cmltKCk7XG5cdFx0dmFyIHdpZGdldFR5cGUgPSB0aGlzLnVpLndpZGdldFR5cGVJbnB1dC52YWwoKTtcblx0XHR2YXIgc2V0dGluZ3MgPSB0aGlzLmdldE9wdGlvbiggJ3NldHRpbmdzJyApIHx8IHt9O1xuXG5cdFx0aWYgKCAhIG5hbWUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c2VsZi51aS5zdWJtaXRCdXR0b24uYWRkQ2xhc3MoICdlbGVtZW50b3ItYnRuLXN0YXRlJyApO1xuXG5cdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5zYXZlU3R5bGUoIHdpZGdldFR5cGUsIG5hbWUsIHNldHRpbmdzLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuc2hvd1N0eWxlcygpO1xuXHRcdH0gKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeVNhdmVWaWV3O1xuIiwidmFyIFN0eWxlSXRlbVZpZXc7XG5cblN0eWxlSXRlbVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXN0eWxlLWl0ZW0nLFxuXG5cdGNsYXNzTmFtZTogJ2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXN0eWxlLWl0ZW0nLFxuXG5cdHVpOiB7XG5cdFx0ZGVmYXVsdEJ0bjogJy5lbGVtZW50b3Itc3R5bGUtbGlicmFyeS1zdHlsZS1kZWZhdWx0LXRvZ2dsZScsXG5cdFx0ZGVsZXRlQnRuOiAnLmVsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXN0eWxlLWRlbGV0ZSdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgQHVpLmRlbGV0ZUJ0bic6ICdvbkRlbGV0ZUNsaWNrJyxcblx0XHQnY2xpY2sgQHVpLmRlZmF1bHRCdG4nOiAnb25EZWZhdWx0Q2xpY2snXG5cdH0sXG5cblx0bW9kZWxFdmVudHM6IHtcblx0XHQnY2hhbmdlOmlzX2RlZmF1bHQnOiAncmVuZGVyJ1xuXHR9LFxuXG5cdG9uRGVsZXRlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuZGVsZXRlU3R5bGUoIHRoaXMubW9kZWwgKTtcblx0fSxcblxuXHRvbkRlZmF1bHRDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS50b2dnbGVEZWZhdWx0KCB0aGlzLm1vZGVsICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsZUl0ZW1WaWV3O1xuIiwidmFyIFN0eWxlTGlicmFyeUVtcHR5VmlldztcblxuU3R5bGVMaWJyYXJ5RW1wdHlWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1zdHlsZXMtZW1wdHknLFxuXG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktc3R5bGVzLWVtcHR5J1xufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0eWxlTGlicmFyeUVtcHR5VmlldztcbiIsInZhciBTdHlsZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvc3R5bGUtaXRlbScgKSxcblx0U3R5bGVzRW1wdHlWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1zdHlsZXMvdmlld3MvcGFydHMvc3R5bGVzLWVtcHR5JyApLFxuXHRTdHlsZUxpYnJhcnlDb2xsZWN0aW9uVmlldztcblxuU3R5bGVMaWJyYXJ5Q29sbGVjdGlvblZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXN0eWxlLWxpYnJhcnktc3R5bGVzJyxcblxuXHRpZDogJ2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXN0eWxlcycsXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnI2VsZW1lbnRvci1zdHlsZS1saWJyYXJ5LXN0eWxlcy1jb250YWluZXInLFxuXG5cdGVtcHR5VmlldzogU3R5bGVzRW1wdHlWaWV3LFxuXG5cdGNoaWxkVmlldzogU3R5bGVJdGVtVmlldyxcblxuXHR1aToge1xuXHRcdGZpbHRlclNlbGVjdDogJyNlbGVtZW50b3Itc3R5bGUtbGlicmFyeS1maWx0ZXItd2lkZ2V0LXR5cGUnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NoYW5nZSBAdWkuZmlsdGVyU2VsZWN0JzogJ29uRmlsdGVyQ2hhbmdlJ1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9wb3B1bGF0ZVdpZGdldFR5cGVEcm9wZG93bigpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBCdWlsZCB0aGUgd2lkZ2V0IHR5cGUgZHJvcGRvd24gZnJvbSB0aGUgY29sbGVjdGlvbiBkYXRhLlxuXHQgKi9cblx0X3BvcHVsYXRlV2lkZ2V0VHlwZURyb3Bkb3duOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgJHNlbGVjdCA9IHRoaXMudWkuZmlsdGVyU2VsZWN0O1xuXHRcdHZhciB0eXBlcyA9IHt9O1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdHZhciB3dCA9IG1vZGVsLmdldCggJ3dpZGdldF90eXBlJyApO1xuXHRcdFx0aWYgKCB3dCAmJiAhIHR5cGVzWyB3dCBdICkge1xuXHRcdFx0XHR0eXBlc1sgd3QgXSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0dmFyIHNvcnRlZFR5cGVzID0gT2JqZWN0LmtleXMoIHR5cGVzICkuc29ydCgpO1xuXG5cdFx0c29ydGVkVHlwZXMuZm9yRWFjaCggZnVuY3Rpb24oIHd0ICkge1xuXHRcdFx0Ly8gVHJ5IHRvIGdldCBhIGh1bWFuLXJlYWRhYmxlIHRpdGxlIGZyb20gZWxlbWVudG9yIGNvbmZpZ1xuXHRcdFx0dmFyIHRpdGxlID0gd3Q7XG5cdFx0XHRpZiAoIGVsZW1lbnRvci5jb25maWcgJiYgZWxlbWVudG9yLmNvbmZpZy53aWRnZXRzICYmIGVsZW1lbnRvci5jb25maWcud2lkZ2V0c1sgd3QgXSApIHtcblx0XHRcdFx0dGl0bGUgPSBlbGVtZW50b3IuY29uZmlnLndpZGdldHNbIHd0IF0udGl0bGUgfHwgd3Q7XG5cdFx0XHR9XG5cdFx0XHQkc2VsZWN0LmFwcGVuZChcblx0XHRcdFx0QmFja2JvbmUuJCggJzxvcHRpb24+JyApLnZhbCggd3QgKS50ZXh0KCB0aXRsZSApXG5cdFx0XHQpO1xuXHRcdH0gKTtcblx0fSxcblxuXHRmaWx0ZXI6IGZ1bmN0aW9uKCBjaGlsZE1vZGVsICkge1xuXHRcdHZhciBmaWx0ZXJWYWx1ZSA9IHRoaXMuX2ZpbHRlcldpZGdldFR5cGU7XG5cblx0XHRpZiAoICEgZmlsdGVyVmFsdWUgKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gY2hpbGRNb2RlbC5nZXQoICd3aWRnZXRfdHlwZScgKSA9PT0gZmlsdGVyVmFsdWU7XG5cdH0sXG5cblx0b25GaWx0ZXJDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2ZpbHRlcldpZGdldFR5cGUgPSB0aGlzLnVpLmZpbHRlclNlbGVjdC52YWwoKTtcblx0XHR0aGlzLl9yZW5kZXJDaGlsZHJlbigpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3R5bGVMaWJyYXJ5Q29sbGVjdGlvblZpZXc7XG4iLCJ2YXIgVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVNb2RlbCA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL21vZGVscy90ZW1wbGF0ZScgKSxcblx0VGVtcGxhdGVMaWJyYXJ5Q29sbGVjdGlvbjtcblxuVGVtcGxhdGVMaWJyYXJ5Q29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKCB7XG5cdG1vZGVsOiBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZU1vZGVsXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5Q29sbGVjdGlvbjtcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlMYXlvdXRWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvdmlld3MvbGF5b3V0JyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlDb2xsZWN0aW9uID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvY29sbGVjdGlvbnMvdGVtcGxhdGVzJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlNYW5hZ2VyO1xuXG5UZW1wbGF0ZUxpYnJhcnlNYW5hZ2VyID0gZnVuY3Rpb24oKSB7XG5cdHZhciBzZWxmID0gdGhpcyxcblx0XHRtb2RhbCxcblx0XHRkZWxldGVEaWFsb2csXG5cdFx0ZXJyb3JEaWFsb2csXG5cdFx0bGF5b3V0LFxuXHRcdHRlbXBsYXRlc0NvbGxlY3Rpb247XG5cblx0dmFyIGluaXRMYXlvdXQgPSBmdW5jdGlvbigpIHtcblx0XHRsYXlvdXQgPSBuZXcgVGVtcGxhdGVMaWJyYXJ5TGF5b3V0VmlldygpO1xuXHR9O1xuXG5cdHRoaXMuZGVsZXRlVGVtcGxhdGUgPSBmdW5jdGlvbiggdGVtcGxhdGVNb2RlbCApIHtcblx0XHR2YXIgZGlhbG9nID0gc2VsZi5nZXREZWxldGVEaWFsb2coKTtcblxuXHRcdGRpYWxvZy5vbkNvbmZpcm0gPSBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdkZWxldGVUZW1wbGF0ZScsIHtcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHNvdXJjZTogdGVtcGxhdGVNb2RlbC5nZXQoICdzb3VyY2UnICksXG5cdFx0XHRcdFx0dGVtcGxhdGVfaWQ6IHRlbXBsYXRlTW9kZWwuZ2V0KCAndGVtcGxhdGVfaWQnIClcblx0XHRcdFx0fSxcblx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dGVtcGxhdGVzQ29sbGVjdGlvbi5yZW1vdmUoIHRlbXBsYXRlTW9kZWwsIHsgc2lsZW50OiB0cnVlIH0gKTtcblxuXHRcdFx0XHRcdHNlbGYuc2hvd1RlbXBsYXRlcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fTtcblxuXHRcdGRpYWxvZy5zaG93KCk7XG5cdH07XG5cblx0dGhpcy5pbXBvcnRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCB0ZW1wbGF0ZU1vZGVsICkge1xuXHRcdGxheW91dC5zaG93TG9hZGluZ1ZpZXcoKTtcblxuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdnZXRUZW1wbGF0ZUNvbnRlbnQnLCB7XG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHNvdXJjZTogdGVtcGxhdGVNb2RlbC5nZXQoICdzb3VyY2UnICksXG5cdFx0XHRcdHBvc3RfaWQ6IGVsZW1lbnRvci5jb25maWcucG9zdF9pZCxcblx0XHRcdFx0dGVtcGxhdGVfaWQ6IHRlbXBsYXRlTW9kZWwuZ2V0KCAndGVtcGxhdGVfaWQnIClcblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0c2VsZi5nZXRNb2RhbCgpLmhpZGUoKTtcblx0XHRcdFx0dmFyIG5ld2RhdGEgPSBzZWxmLmdlbmVyYXRlTmV3VGVtcGxhdGVJZHMoZGF0YSk7XG5cblx0XHRcdFx0ZWxlbWVudG9yLmdldFJlZ2lvbiggJ3NlY3Rpb25zJyApLmN1cnJlbnRWaWV3LmFkZENoaWxkTW9kZWwoIG5ld2RhdGEgKTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0XHRcdHNlbGYuc2hvd0Vycm9yRGlhbG9nKCBkYXRhLm1lc3NhZ2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH07XG5cblx0dGhpcy5nZW5lcmF0ZU5ld1RlbXBsYXRlSWRzID0gZnVuY3Rpb24oIGRhdGEgKSB7XG5cblx0XHR2YXIgbmV3Q29sbGVjdGlvbiA9IFtdO1xuXG5cdFx0ZGF0YS5mb3JFYWNoKCBmdW5jdGlvbiggbW9kZWwsIGluZGV4ICkge1xuXHRcdFx0bW9kZWwuaWQgPSBlbGVtZW50b3IuaGVscGVycy5nZXRVbmlxdWVJRCgpO1xuXHRcdFx0bmV3Q29sbGVjdGlvbltpbmRleF0gPSAgbW9kZWw7XG5cblx0XHRcdGlmKG1vZGVsLmVsZW1lbnRzKXtcblx0XHRcdFx0c2VsZi5nZW5lcmF0ZU5ld1RlbXBsYXRlSWRzKG1vZGVsLmVsZW1lbnRzKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gbmV3Q29sbGVjdGlvbjtcblxuXHR9O1xuXG5cblx0dGhpcy5nZXREZWxldGVEaWFsb2cgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgZGVsZXRlRGlhbG9nICkge1xuXHRcdFx0ZGVsZXRlRGlhbG9nID0gZWxlbWVudG9yLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2NvbmZpcm0nLCB7XG5cdFx0XHRcdGlkOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktZGVsZXRlLWRpYWxvZycsXG5cdFx0XHRcdGhlYWRlck1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdkZWxldGVfdGVtcGxhdGUnICksXG5cdFx0XHRcdG1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdkZWxldGVfdGVtcGxhdGVfY29uZmlybScgKSxcblx0XHRcdFx0c3RyaW5nczoge1xuXHRcdFx0XHRcdGNvbmZpcm06IGVsZW1lbnRvci50cmFuc2xhdGUoICdkZWxldGUnIClcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBkZWxldGVEaWFsb2c7XG5cdH07XG5cblx0dGhpcy5nZXRFcnJvckRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISBlcnJvckRpYWxvZyApIHtcblx0XHRcdGVycm9yRGlhbG9nID0gZWxlbWVudG9yLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2FsZXJ0Jywge1xuXHRcdFx0XHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWVycm9yLWRpYWxvZycsXG5cdFx0XHRcdGhlYWRlck1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdhbl9lcnJvcl9vY2N1cnJlZCcgKVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBlcnJvckRpYWxvZztcblx0fTtcblxuXHR0aGlzLmdldE1vZGFsID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCAhIG1vZGFsICkge1xuXHRcdFx0bW9kYWwgPSBlbGVtZW50b3IuZGlhbG9nc01hbmFnZXIuY3JlYXRlV2lkZ2V0KCAnZWxlbWVudG9yLW1vZGFsJywge1xuXHRcdFx0XHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LW1vZGFsJyxcblx0XHRcdFx0Y2xvc2VCdXR0b246IGZhbHNlXG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1vZGFsO1xuXHR9O1xuXG5cdHRoaXMuZ2V0TGF5b3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGxheW91dDtcblx0fTtcblxuXHR0aGlzLmdldFRlbXBsYXRlc0NvbGxlY3Rpb24gPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGVtcGxhdGVzQ29sbGVjdGlvbjtcblx0fTtcblxuXHR0aGlzLnJlcXVlc3RSZW1vdGVUZW1wbGF0ZXMgPSBmdW5jdGlvbiggY2FsbGJhY2ssIGZvcmNlVXBkYXRlICkge1xuXHRcdGlmICggdGVtcGxhdGVzQ29sbGVjdGlvbiAmJiAhIGZvcmNlVXBkYXRlICkge1xuXHRcdFx0aWYgKCBjYWxsYmFjayApIHtcblx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdHZXRUZW1wbGF0ZXMnLCB7XG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0dGVtcGxhdGVzQ29sbGVjdGlvbiA9IG5ldyBUZW1wbGF0ZUxpYnJhcnlDb2xsZWN0aW9uKCBkYXRhICk7XG5cblx0XHRcdFx0aWYgKCBjYWxsYmFjayApIHtcblx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9O1xuXG5cdHRoaXMuc3RhcnRNb2RhbCA9IGZ1bmN0aW9uKCBvbk1vZGFsUmVhZHkgKSB7XG5cdFx0c2VsZi5nZXRNb2RhbCgpLnNob3coKTtcblxuXHRcdHNlbGYuc2V0VGVtcGxhdGVzU291cmNlKCAnbG9jYWwnICk7XG5cblx0XHRpZiAoICEgbGF5b3V0ICkge1xuXHRcdFx0aW5pdExheW91dCgpO1xuXHRcdH1cblxuXHRcdGxheW91dC5zaG93TG9hZGluZ1ZpZXcoKTtcblxuXHRcdHNlbGYucmVxdWVzdFJlbW90ZVRlbXBsYXRlcyggZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIG9uTW9kYWxSZWFkeSApIHtcblx0XHRcdFx0b25Nb2RhbFJlYWR5KCk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9O1xuXG5cdHRoaXMuc2V0VGVtcGxhdGVzU291cmNlID0gZnVuY3Rpb24oIHNvdXJjZSwgdHJpZ2dlciApIHtcblx0XHR2YXIgY2hhbm5lbCA9IGVsZW1lbnRvci5jaGFubmVscy50ZW1wbGF0ZXM7XG5cblx0XHRjaGFubmVsLnJlcGx5KCAnZmlsdGVyOnNvdXJjZScsIHNvdXJjZSApO1xuXG5cdFx0aWYgKCB0cmlnZ2VyICkge1xuXHRcdFx0Y2hhbm5lbC50cmlnZ2VyKCAnZmlsdGVyOmNoYW5nZScgKTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5zaG93VGVtcGxhdGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0bGF5b3V0LnNob3dUZW1wbGF0ZXNWaWV3KCB0ZW1wbGF0ZXNDb2xsZWN0aW9uICk7XG5cdH07XG5cblx0dGhpcy5zaG93RXJyb3JEaWFsb2cgPSBmdW5jdGlvbiggZXJyb3JNZXNzYWdlICkge1xuXHRcdHNlbGYuZ2V0RXJyb3JEaWFsb2coKVxuXHRcdCAgICAuc2V0TWVzc2FnZSggZWxlbWVudG9yLnRyYW5zbGF0ZSggJ3RlbXBsYXRlc19yZXF1ZXN0X2Vycm9yJyApICsgJzxkaXYgaWQ9XCJlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1lcnJvci1pbmZvXCI+JyArIGVycm9yTWVzc2FnZSArICc8L2Rpdj4nIClcblx0XHQgICAgLnNob3coKTtcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFRlbXBsYXRlTGlicmFyeU1hbmFnZXIoKTtcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZU1vZGVsO1xuXG5UZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZU1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKCB7XG5cdGRlZmF1bHRzOiB7XG5cdFx0dGVtcGxhdGVfaWQ6IDAsXG5cdFx0bmFtZTogJycsXG5cdFx0dGl0bGU6ICcnLFxuXHRcdHNvdXJjZTogJycsXG5cdFx0dHlwZTogJycsXG5cdFx0YXV0aG9yOiAnJyxcblx0XHR0aHVtYm5haWw6ICcnLFxuXHRcdHVybDogJycsXG5cdFx0ZXhwb3J0X2xpbms6ICcnLFxuXHRcdGNhdGVnb3JpZXM6IFtdLFxuXHRcdGtleXdvcmRzOiBbXVxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVNb2RlbDtcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvdmlld3MvcGFydHMvaGVhZGVyJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2dvVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9sb2dvJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJTYXZlVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9zYXZlJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2FkVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9sb2FkJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJNZW51VmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9tZW51JyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJQcmV2aWV3VmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9wcmV2aWV3JyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlIZWFkZXJCYWNrVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2hlYWRlci1wYXJ0cy9iYWNrJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlMb2FkaW5nVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2xvYWRpbmcnICksXG5cdFRlbXBsYXRlTGlicmFyeUNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvdmlld3MvcGFydHMvdGVtcGxhdGVzJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlTYXZlVGVtcGxhdGVWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvdmlld3MvcGFydHMvc2F2ZS10ZW1wbGF0ZScgKSxcblx0VGVtcGxhdGVMaWJyYXJ5TG9hZFRlbXBsYXRlVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3BhcnRzL2xvYWQtdGVtcGxhdGUnICksXG5cdFRlbXBsYXRlTGlicmFyeVByZXZpZXdWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvdmlld3MvcGFydHMvcHJldmlldycgKSxcblx0VGVtcGxhdGVMaWJyYXJ5TGF5b3V0VmlldztcblxuVGVtcGxhdGVMaWJyYXJ5TGF5b3V0VmlldyA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoIHtcblx0ZWw6ICcjZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktbW9kYWwnLFxuXG5cdHJlZ2lvbnM6IHtcblx0XHRtb2RhbENvbnRlbnQ6ICcuZGlhbG9nLW1lc3NhZ2UnLFxuXHRcdG1vZGFsSGVhZGVyOiAnLmRpYWxvZy13aWRnZXQtaGVhZGVyJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2V0UmVnaW9uKCAnbW9kYWxIZWFkZXInICkuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUhlYWRlclZpZXcoKSApO1xuXHR9LFxuXG5cdGdldEhlYWRlclZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldFJlZ2lvbiggJ21vZGFsSGVhZGVyJyApLmN1cnJlbnRWaWV3O1xuXHR9LFxuXG5cdHNob3dMb2FkaW5nVmlldzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZXRSZWdpb24oICdtb2RhbENvbnRlbnQnICkuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUxvYWRpbmdWaWV3KCkgKTtcblx0fSxcblxuXHRzaG93VGVtcGxhdGVzVmlldzogZnVuY3Rpb24oIHRlbXBsYXRlc0NvbGxlY3Rpb24gKSB7XG5cdFx0dGhpcy5nZXRSZWdpb24oICdtb2RhbENvbnRlbnQnICkuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUNvbGxlY3Rpb25WaWV3KCB7XG5cdFx0XHRjb2xsZWN0aW9uOiB0ZW1wbGF0ZXNDb2xsZWN0aW9uXG5cdFx0fSApICk7XG5cblx0XHR2YXIgaGVhZGVyVmlldyA9IHRoaXMuZ2V0SGVhZGVyVmlldygpO1xuXG5cdFx0aGVhZGVyVmlldy50b29scy5zaG93KCBuZXcgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXcoKSApO1xuXHRcdGhlYWRlclZpZXcudG9vbHMyLnNob3coIG5ldyBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2FkVmlldygpICk7XG5cdFx0aGVhZGVyVmlldy5sb2dvQXJlYS5zaG93KCBuZXcgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyTG9nb1ZpZXcoKSApO1xuXHR9LFxuXG5cdHNob3dTYXZlVGVtcGxhdGVWaWV3OiBmdW5jdGlvbiggc2VjdGlvbklEICkge1xuXHRcdHRoaXMuZ2V0UmVnaW9uKCAnbW9kYWxDb250ZW50JyApLnNob3coIG5ldyBUZW1wbGF0ZUxpYnJhcnlTYXZlVGVtcGxhdGVWaWV3KCB7IHNlY3Rpb25JRDogc2VjdGlvbklEIH0gKSApO1xuXG5cdFx0dmFyIGhlYWRlclZpZXcgPSB0aGlzLmdldEhlYWRlclZpZXcoKTtcblxuXHRcdGhlYWRlclZpZXcudG9vbHMucmVzZXQoKTtcblx0XHRoZWFkZXJWaWV3LnRvb2xzMi5zaG93KCBuZXcgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyTG9hZFZpZXcoKSApO1xuXHRcdGhlYWRlclZpZXcubWVudUFyZWEuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUhlYWRlck1lbnVWaWV3KCkgKTtcblx0XHRoZWFkZXJWaWV3LmxvZ29BcmVhLnNob3coIG5ldyBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2dvVmlldygpICk7XG5cdH0sXG5cblx0c2hvd0xvYWRUZW1wbGF0ZVZpZXc6IGZ1bmN0aW9uKCBzZWN0aW9uSUQgKSB7XG5cdFx0dGhpcy5nZXRSZWdpb24oICdtb2RhbENvbnRlbnQnICkuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUxvYWRUZW1wbGF0ZVZpZXcoIHsgc2VjdGlvbklEOiBzZWN0aW9uSUQgfSApICk7XG5cblx0XHR2YXIgaGVhZGVyVmlldyA9IHRoaXMuZ2V0SGVhZGVyVmlldygpO1xuXG5cdFx0aGVhZGVyVmlldy50b29sczIucmVzZXQoKTtcblx0XHRoZWFkZXJWaWV3LnRvb2xzLnNob3coIG5ldyBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJTYXZlVmlldygpICk7XG5cdFx0aGVhZGVyVmlldy5tZW51QXJlYS5zaG93KCBuZXcgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyTWVudVZpZXcoKSApO1xuXHRcdGhlYWRlclZpZXcubG9nb0FyZWEuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUhlYWRlckxvZ29WaWV3KCkgKTtcblx0fSxcblxuXHRzaG93UHJldmlld1ZpZXc6IGZ1bmN0aW9uKCB0ZW1wbGF0ZU1vZGVsICkge1xuXHRcdHRoaXMuZ2V0UmVnaW9uKCAnbW9kYWxDb250ZW50JyApLnNob3coIG5ldyBUZW1wbGF0ZUxpYnJhcnlQcmV2aWV3Vmlldygge1xuXHRcdFx0dXJsOiB0ZW1wbGF0ZU1vZGVsLmdldCggJ3VybCcgKVxuXHRcdH0gKSApO1xuXG5cdFx0dmFyIGhlYWRlclZpZXcgPSB0aGlzLmdldEhlYWRlclZpZXcoKTtcblxuXHRcdGhlYWRlclZpZXcubWVudUFyZWEucmVzZXQoKTtcblxuXHRcdGhlYWRlclZpZXcudG9vbHMuc2hvdyggbmV3IFRlbXBsYXRlTGlicmFyeUhlYWRlclByZXZpZXdWaWV3KCB7XG5cdFx0XHRtb2RlbDogdGVtcGxhdGVNb2RlbFxuXHRcdH0gKSApO1xuXG5cdFx0aGVhZGVyVmlldy5sb2dvQXJlYS5zaG93KCBuZXcgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyQmFja1ZpZXcoKSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5TGF5b3V0VmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJCYWNrVmlldztcblxuVGVtcGxhdGVMaWJyYXJ5SGVhZGVyQmFja1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1iYWNrJyxcblxuXHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1wcmV2aWV3LWJhY2snLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc2hvd1RlbXBsYXRlcygpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5SGVhZGVyQmFja1ZpZXc7XG4iLCJ2YXIgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyTG9hZFZpZXc7XG5cblRlbXBsYXRlTGlicmFyeUhlYWRlckxvYWRWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItbG9hZCcsXG5cblx0aWQ6ICdlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItbG9hZCcsXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLWl0ZW0nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuZ2V0TGF5b3V0KCkuc2hvd0xvYWRUZW1wbGF0ZVZpZXcoKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlTGlicmFyeUhlYWRlckxvYWRWaWV3O1xuIiwidmFyIFRlbXBsYXRlTGlicmFyeUhlYWRlckxvZ29WaWV3O1xuXG5UZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2dvVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLWxvZ28nLFxuXG5cdGlkOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLWxvZ28nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdvbkNsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc2V0VGVtcGxhdGVzU291cmNlKCAnbG9jYWwnICk7XG5cdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zaG93VGVtcGxhdGVzKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJMb2dvVmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJNZW51VmlldztcblxuVGVtcGxhdGVMaWJyYXJ5SGVhZGVyTWVudVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHRvcHRpb25zOiB7XG5cdFx0YWN0aXZlQ2xhc3M6ICdlbGVtZW50b3ItYWN0aXZlJ1xuXHR9LFxuXG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLW1lbnUnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktaGVhZGVyLW1lbnUnLFxuXG5cdHVpOiB7XG5cdFx0bWVudUl0ZW1zOiAnLmVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LW1lbnUtaXRlbSdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgQHVpLm1lbnVJdGVtcyc6ICdvbk1lbnVJdGVtQ2xpY2snXG5cdH0sXG5cblx0JGFjdGl2ZUl0ZW06IG51bGwsXG5cblx0YWN0aXZhdGVNZW51SXRlbTogZnVuY3Rpb24oICRpdGVtICkge1xuXHRcdHZhciBhY3RpdmVDbGFzcyA9IHRoaXMuZ2V0T3B0aW9uKCAnYWN0aXZlQ2xhc3MnICk7XG5cblx0XHRpZiAoIHRoaXMuJGFjdGl2ZUl0ZW0gPT09ICRpdGVtICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggdGhpcy4kYWN0aXZlSXRlbSApIHtcblx0XHRcdHRoaXMuJGFjdGl2ZUl0ZW0ucmVtb3ZlQ2xhc3MoIGFjdGl2ZUNsYXNzICk7XG5cdFx0fVxuXG5cdFx0JGl0ZW0uYWRkQ2xhc3MoIGFjdGl2ZUNsYXNzICk7XG5cblx0XHR0aGlzLiRhY3RpdmVJdGVtID0gJGl0ZW07XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjdXJyZW50U291cmNlID0gZWxlbWVudG9yLmNoYW5uZWxzLnRlbXBsYXRlcy5yZXF1ZXN0KCAnZmlsdGVyOnNvdXJjZScgKSxcblx0XHRcdCRzb3VyY2VJdGVtID0gdGhpcy51aS5tZW51SXRlbXMuZmlsdGVyKCAnW2RhdGEtdGVtcGxhdGUtc291cmNlPVwiJyArIGN1cnJlbnRTb3VyY2UgKyAnXCJdJyApO1xuXG5cdFx0dGhpcy5hY3RpdmF0ZU1lbnVJdGVtKCAkc291cmNlSXRlbSApO1xuXHR9LFxuXG5cdG9uTWVudUl0ZW1DbGljazogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBpdGVtID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuXHRcdHRoaXMuYWN0aXZhdGVNZW51SXRlbSggQmFja2JvbmUuJCggaXRlbSApICk7XG5cblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnNldFRlbXBsYXRlc1NvdXJjZSggJ2xvY2FsJyk7XG5cdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zaG93VGVtcGxhdGVzKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJNZW51VmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJQcmV2aWV3VmlldztcblxuVGVtcGxhdGVMaWJyYXJ5SGVhZGVyUHJldmlld1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1wcmV2aWV3JyxcblxuXHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1wcmV2aWV3JyxcblxuXHR1aToge1xuXHRcdGluc2VydEJ1dHRvbjogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItcHJldmlldy1pbnNlcnQnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5pbnNlcnRCdXR0b24nOiAnb25JbnNlcnRCdXR0b25DbGljaydcblx0fSxcblxuXHRvbkluc2VydEJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLmltcG9ydFRlbXBsYXRlKCB0aGlzLm1vZGVsICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJQcmV2aWV3VmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlIZWFkZXJTYXZlVmlldztcblxuVGVtcGxhdGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1zYXZlJyxcblxuXHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlci1zYXZlJyxcblxuXHRjbGFzc05hbWU6ICdlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItaXRlbScsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ29uQ2xpY2snXG5cdH0sXG5cblx0b25DbGljazogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5nZXRMYXlvdXQoKS5zaG93U2F2ZVRlbXBsYXRlVmlldygpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5SGVhZGVyU2F2ZVZpZXc7XG4iLCJ2YXIgVGVtcGxhdGVMaWJyYXJ5SGVhZGVyVmlldztcblxuVGVtcGxhdGVMaWJyYXJ5SGVhZGVyVmlldyA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoIHtcblxuXHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWhlYWRlcicsXG5cblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXInLFxuXG5cdHJlZ2lvbnM6IHtcblx0XHRsb2dvQXJlYTogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItbG9nby1hcmVhJyxcblx0XHR0b29sczogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItdG9vbHMnLFxuXHRcdHRvb2xzMjogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItdG9vbHMyJyxcblx0XHRtZW51QXJlYTogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItbWVudS1hcmVhJ1xuXHR9LFxuXG5cdHVpOiB7XG5cdFx0Y2xvc2VNb2RhbDogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1oZWFkZXItY2xvc2UtbW9kYWwnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5jbG9zZU1vZGFsJzogJ29uQ2xvc2VNb2RhbENsaWNrJ1xuXHR9LFxuXG5cdG9uQ2xvc2VNb2RhbENsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLmdldE1vZGFsKCkuaGlkZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5SGVhZGVyVmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlMb2FkVGVtcGxhdGVWaWV3O1xuXG5UZW1wbGF0ZUxpYnJhcnlMb2FkVGVtcGxhdGVWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1sb2FkLXRlbXBsYXRlJyxcblxuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWxvYWQtdGVtcGxhdGUnLFxuXG5cdHVpOiB7XG5cdFx0Zm9ybTogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1sb2FkLXRlbXBsYXRlLWZvcm0nLFxuXHRcdHN1Ym1pdEJ1dHRvbjogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1sb2FkLXRlbXBsYXRlLXN1Ym1pdCcsXG5cdFx0ZmlsZUlucHV0OiAnI2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWxvYWQtdGVtcGxhdGUtZmlsZScsXG5cdFx0ZmlsZUlucHV0TmljZTogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1sb2FkLWJ0bi1maWxlJ1xuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdzdWJtaXQgQHVpLmZvcm0nOiAnb25Gb3JtU3VibWl0Jyxcblx0XHQnY2hhbmdlIEB1aS5maWxlSW5wdXQnOiAnb25GaWxlQ2hhbmdlJ1xuXHR9LFxuXG5cblx0dGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VjdGlvbklEOiB0aGlzLmdldE9wdGlvbiggJ3NlY3Rpb25JRCcgKVxuXHRcdH07XG5cdH0sXG5cblx0b25GaWxlQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHQkKHRoaXMudWkuZmlsZUlucHV0TmljZSkudGV4dCgkKHRoaXMudWkuZmlsZUlucHV0KVswXS5maWxlc1swXS5uYW1lKTtcblx0fSxcblxuXHRvbkZvcm1TdWJtaXQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy51aS5zdWJtaXRCdXR0b24uYWRkQ2xhc3MoICdlbGVtZW50b3ItYnRuLXN0YXRlJyApO1xuXG5cdFx0ZWxlbWVudG9yLmFqYXguc2VuZCggJ2ltcG9ydFRlbXBsYXRlJywge1xuXHRcdFx0ZGF0YTogbmV3IEZvcm1EYXRhKCB0aGlzLnVpLmZvcm1bIDAgXSApLFxuXHRcdFx0cHJvY2Vzc0RhdGE6IGZhbHNlLFxuXHRcdFx0Y29udGVudFR5cGU6IGZhbHNlLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0XHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuZ2V0VGVtcGxhdGVzQ29sbGVjdGlvbigpLmFkZCggZGF0YSApO1xuXG5cdFx0XHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc2V0VGVtcGxhdGVzU291cmNlKCAnbG9jYWwnICk7XG5cblx0XHRcdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zaG93VGVtcGxhdGVzKCk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnNob3dFcnJvckRpYWxvZyggZGF0YS5tZXNzYWdlICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5TG9hZFRlbXBsYXRlVmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlMb2FkaW5nVmlldztcblxuVGVtcGxhdGVMaWJyYXJ5TG9hZGluZ1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHRpZDogJ2VsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LWxvYWRpbmcnLFxuXG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktbG9hZGluZydcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlMb2FkaW5nVmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlQcmV2aWV3VmlldztcblxuVGVtcGxhdGVMaWJyYXJ5UHJldmlld1ZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LXByZXZpZXcnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktcHJldmlldycsXG5cblx0dWk6IHtcblx0XHRpZnJhbWU6ICc+IGlmcmFtZSdcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5pZnJhbWUuYXR0ciggJ3NyYycsIHRoaXMuZ2V0T3B0aW9uKCAndXJsJyApICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlQcmV2aWV3VmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlTYXZlVGVtcGxhdGVWaWV3O1xuXG5UZW1wbGF0ZUxpYnJhcnlTYXZlVGVtcGxhdGVWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1zYXZlLXRlbXBsYXRlJyxcblxuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LXNhdmUtdGVtcGxhdGUnLFxuXG5cdHVpOiB7XG5cdFx0Zm9ybTogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1zYXZlLXRlbXBsYXRlLWZvcm0nLFxuXHRcdHN1Ym1pdEJ1dHRvbjogJyNlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS1zYXZlLXRlbXBsYXRlLXN1Ym1pdCdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnc3VibWl0IEB1aS5mb3JtJzogJ29uRm9ybVN1Ym1pdCdcblx0fSxcblxuXHR0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWN0aW9uSUQ6IHRoaXMuZ2V0T3B0aW9uKCAnc2VjdGlvbklEJyApXG5cdFx0fTtcblx0fSxcblxuXHRvbkZvcm1TdWJtaXQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyIGZvcm1EYXRhID0gdGhpcy51aS5mb3JtLmVsZW1lbnRvclNlcmlhbGl6ZU9iamVjdCgpLFxuXHRcdFx0ZWxlbWVudHNEYXRhID0gZWxlbWVudG9yLmhlbHBlcnMuY2xvbmVPYmplY3QoIGVsZW1lbnRvci5lbGVtZW50cy50b0pTT04oKSApLFxuXHRcdFx0c2VjdGlvbklEID0gdGhpcy5nZXRPcHRpb24oICdzZWN0aW9uSUQnICksXG5cdFx0XHRzYXZlVHlwZSA9IHNlY3Rpb25JRCA/ICdzZWN0aW9uJyA6ICdwYWdlJztcblxuXHRcdGlmICggJ3NlY3Rpb24nID09PSBzYXZlVHlwZSApIHtcblx0XHRcdGVsZW1lbnRzRGF0YSA9IFsgXy5maW5kV2hlcmUoIGVsZW1lbnRzRGF0YSwgeyBpZDogc2VjdGlvbklEIH0gKSBdO1xuXHRcdH1cblxuXHRcdF8uZXh0ZW5kKCBmb3JtRGF0YSwge1xuXHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoIGVsZW1lbnRzRGF0YSApLFxuXHRcdFx0c291cmNlOiAnbG9jYWwnLFxuXHRcdFx0dHlwZTogc2F2ZVR5cGVcblx0XHR9ICk7XG5cblx0XHR0aGlzLnVpLnN1Ym1pdEJ1dHRvbi5hZGRDbGFzcyggJ2VsZW1lbnRvci1idG4tc3RhdGUnICk7XG5cblx0XHRlbGVtZW50b3IuYWpheC5zZW5kKCAnc2F2ZVRlbXBsYXRlJywge1xuXHRcdFx0ZGF0YTogZm9ybURhdGEsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5nZXRUZW1wbGF0ZXNDb2xsZWN0aW9uKCkuYWRkKCBkYXRhICk7XG5cblx0XHRcdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zZXRUZW1wbGF0ZXNTb3VyY2UoICdsb2NhbCcgKTtcblxuXHRcdFx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnNob3dUZW1wbGF0ZXMoKTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0XHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc2hvd0Vycm9yRGlhbG9nKCBkYXRhLm1lc3NhZ2UgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZUxpYnJhcnlTYXZlVGVtcGxhdGVWaWV3O1xuIiwidmFyIFRlbXBsYXRlTGlicmFyeVRlbXBsYXRlc0VtcHR5VmlldztcblxuVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVzRW1wdHlWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS10ZW1wbGF0ZXMtZW1wdHknLFxuXG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGVzLWVtcHR5J1xufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlTGlicmFyeVRlbXBsYXRlc0VtcHR5VmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZUxvY2FsVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItdGVtcGxhdGVzL3ZpZXdzL3RlbXBsYXRlL2xvY2FsJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZXNFbXB0eVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXRlbXBsYXRlcy92aWV3cy9wYXJ0cy90ZW1wbGF0ZXMtZW1wdHknICksXG5cdFRlbXBsYXRlTGlicmFyeUNvbGxlY3Rpb25WaWV3O1xuXG5UZW1wbGF0ZUxpYnJhcnlDb2xsZWN0aW9uVmlldyA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItdGVtcGxhdGUtbGlicmFyeS10ZW1wbGF0ZXMnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGVzJyxcblxuXHRjaGlsZFZpZXdDb250YWluZXI6ICcjZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGVzLWNvbnRhaW5lcicsXG5cblx0ZW1wdHlWaWV3OiBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZXNFbXB0eVZpZXcsXG5cblx0Z2V0Q2hpbGRWaWV3OiBmdW5jdGlvbiggY2hpbGRNb2RlbCApIHtcblx0XHRyZXR1cm4gVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVMb2NhbFZpZXc7XG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5saXN0ZW5UbyggZWxlbWVudG9yLmNoYW5uZWxzLnRlbXBsYXRlcywgJ2ZpbHRlcjpjaGFuZ2UnLCB0aGlzLl9yZW5kZXJDaGlsZHJlbiApO1xuXHR9LFxuXG5cdGZpbHRlckJ5TmFtZTogZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdHZhciBmaWx0ZXJWYWx1ZSA9IGVsZW1lbnRvci5jaGFubmVscy50ZW1wbGF0ZXMucmVxdWVzdCggJ2ZpbHRlcjp0ZXh0JyApO1xuXG5cdFx0aWYgKCAhIGZpbHRlclZhbHVlICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0ZmlsdGVyVmFsdWUgPSBmaWx0ZXJWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0aWYgKCBtb2RlbC5nZXQoICd0aXRsZScgKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoIGZpbHRlclZhbHVlICkgPj0gMCApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBfLmFueSggbW9kZWwuZ2V0KCAna2V5d29yZHMnICksIGZ1bmN0aW9uKCBrZXl3b3JkICkge1xuXHRcdFx0cmV0dXJuIGtleXdvcmQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCBmaWx0ZXJWYWx1ZSApID49IDA7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGZpbHRlckJ5U291cmNlOiBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0dmFyIGZpbHRlclZhbHVlID0gZWxlbWVudG9yLmNoYW5uZWxzLnRlbXBsYXRlcy5yZXF1ZXN0KCAnZmlsdGVyOnNvdXJjZScgKTtcblxuXHRcdGlmICggISBmaWx0ZXJWYWx1ZSApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmaWx0ZXJWYWx1ZSA9PT0gbW9kZWwuZ2V0KCAnc291cmNlJyApO1xuXHR9LFxuXG5cdGZpbHRlcjogZnVuY3Rpb24oIGNoaWxkTW9kZWwgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyQnlOYW1lKCBjaGlsZE1vZGVsICkgJiYgdGhpcy5maWx0ZXJCeVNvdXJjZSggY2hpbGRNb2RlbCApO1xuXHR9LFxuXG5cdG9uUmVuZGVyQ29sbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlzRW1wdHkgPSB0aGlzLmNoaWxkcmVuLmlzRW1wdHkoKTtcblxuXHRcdHRoaXMuJGNoaWxkVmlld0NvbnRhaW5lci5hdHRyKCAnZGF0YS10ZW1wbGF0ZS1zb3VyY2UnLCBpc0VtcHR5ID8gJ2VtcHR5JyA6IGVsZW1lbnRvci5jaGFubmVscy50ZW1wbGF0ZXMucmVxdWVzdCggJ2ZpbHRlcjpzb3VyY2UnICkgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlTGlicmFyeUNvbGxlY3Rpb25WaWV3O1xuIiwiXG5UZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGUgZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGUtJyArIHRoaXMubW9kZWwuZ2V0KCAnc291cmNlJyApO1xuXHR9LFxuXG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aW5zZXJ0QnV0dG9uOiAnLmVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LXRlbXBsYXRlLWluc2VydCcsXG5cdFx0XHRwcmV2aWV3QnV0dG9uOiAnLmVsZW1lbnRvci10ZW1wbGF0ZS1saWJyYXJ5LXRlbXBsYXRlLXByZXZpZXcnXG5cdFx0fTtcblx0fSxcblxuXHRldmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHQnY2xpY2sgQHVpLmluc2VydEJ1dHRvbic6ICdvbkluc2VydEJ1dHRvbkNsaWNrJyxcblx0XHRcdCdjbGljayBAdWkucHJldmlld0J1dHRvbic6ICdvblByZXZpZXdCdXR0b25DbGljaydcblx0XHR9O1xuXHR9LFxuXG5cdG9uSW5zZXJ0QnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuaW1wb3J0VGVtcGxhdGUoIHRoaXMubW9kZWwgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlTGlicmFyeVRlbXBsYXRlVmlldztcbiIsInZhciBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXRlbXBsYXRlcy92aWV3cy90ZW1wbGF0ZS9iYXNlJyApLFxuXHRUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZUxvY2FsVmlldztcblxuVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVMb2NhbFZpZXcgPSBUZW1wbGF0ZUxpYnJhcnlUZW1wbGF0ZVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGUtbG9jYWwnLFxuXG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5leHRlbmQoIFRlbXBsYXRlTGlicmFyeVRlbXBsYXRlVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApLCB7XG5cdFx0XHRkZWxldGVCdXR0b246ICcuZWxlbWVudG9yLXRlbXBsYXRlLWxpYnJhcnktdGVtcGxhdGUtZGVsZXRlJ1xuXHRcdH0gKTtcblx0fSxcblxuXHRldmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmV4dGVuZCggVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVWaWV3LnByb3RvdHlwZS5ldmVudHMuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApLCB7XG5cdFx0XHQnY2xpY2sgQHVpLmRlbGV0ZUJ1dHRvbic6ICdvbkRlbGV0ZUJ1dHRvbkNsaWNrJ1xuXHRcdH0gKTtcblx0fSxcblxuXHRvbkRlbGV0ZUJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLmRlbGV0ZVRlbXBsYXRlKCB0aGlzLm1vZGVsICk7XG5cdH0sXG5cblx0b25QcmV2aWV3QnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdG9wZW4oIHRoaXMubW9kZWwuZ2V0KCAndXJsJyApLCAnX2JsYW5rJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVMaWJyYXJ5VGVtcGxhdGVMb2NhbFZpZXc7XG4iLCIvKiBnbG9iYWwgRWxlbWVudG9yQ29uZmlnICovXG52YXIgQXBwO1xuXG4vKipcbiAqIElubGluZSBTVkcgaWNvbiByZW5kZXJpbmcgZm9yIGNvbnRlbnRfdGVtcGxhdGUgKHVuZGVyc2NvcmUuanMpIGNvbnRleHRzLlxuICpcbiAqIEljb25zIGFyZSBzdG9yZWQgYXMgSlNPTjogeyBsaWJyYXJ5LCB2YWx1ZSwgc3ZnS2V5IH0uXG4gKiAtIElmIHN2Z0tleSBpcyBwcmVzZW50LCBmZXRjaCB0aGUgU1ZHIGZpbGUgYW5kIGlubGluZSBpdCBzbyBDU1Mgc2l6ZS9jb2xvciBjb250cm9scyB3b3JrLlxuICogLSBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIGEgZm9udCBpY29uIDxpPiB0YWcuXG4gKlxuICogVGhlIHByZXZpZXcgbGl2ZXMgaW5zaWRlIGFuIGlmcmFtZSwgc28gYSBNdXRhdGlvbk9ic2VydmVyIGlzIGF0dGFjaGVkIHRvIGVhY2hcbiAqIGRvY3VtZW50IHJvb3QgKG1haW4gKyBpZnJhbWUpIHZpYSBlbGVtZW50b3JJY29uT2JzZXJ2ZSgpIHRvIGRldGVjdCBwbGFjZWhvbGRlcnNcbiAqIG9uY2UgTWFyaW9uZXR0ZSBpbnNlcnRzIHRoZSByZW5kZXJlZCB0ZW1wbGF0ZSBpbnRvIHRoZSBET00uXG4gKlxuICogVXNhZ2U6IHt7eyBlbGVtZW50b3JSZW5kZXJJY29uKHNldHRpbmdzLmljb24pIH19fVxuICovXG4oIGZ1bmN0aW9uKCkge1xuXHR2YXIgc3ZnQ2FjaGUgPSB7fTtcblx0dmFyIHNlbGVjdG9yID0gJy5lbGVtZW50b3ItaWNvbi1zdmdbZGF0YS1zdmcta2V5XTpub3QoW2RhdGEtc3ZnLWxvYWRlZF0pJztcblxuXHRmdW5jdGlvbiBzdmdCYXNlVXJsKCkge1xuXHRcdHJldHVybiAoIHdpbmRvdy5lbGVtZW50b3IgJiYgZWxlbWVudG9yLmNvbmZpZyAmJiBlbGVtZW50b3IuY29uZmlnLmFzc2V0c191cmwgfHwgJycgKSArICdkYXRhL3N2Zy1jYWNoZS8nO1xuXHR9XG5cblx0ZnVuY3Rpb24gbG9hZFN2ZyggZWwgKSB7XG5cdFx0dmFyIGtleSA9IGVsLmdldEF0dHJpYnV0ZSggJ2RhdGEtc3ZnLWtleScgKTtcblx0XHRlbC5zZXRBdHRyaWJ1dGUoICdkYXRhLXN2Zy1sb2FkZWQnLCAnMScgKTtcblxuXHRcdGlmICggc3ZnQ2FjaGVbIGtleSBdICkge1xuXHRcdFx0ZWwuaW5uZXJIVE1MID0gc3ZnQ2FjaGVbIGtleSBdO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHR4aHIub3BlbiggJ0dFVCcsIHN2Z0Jhc2VVcmwoKSArIGtleSArICcuc3ZnJywgdHJ1ZSApO1xuXHRcdHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggeGhyLnN0YXR1cyA9PT0gMjAwICYmIHhoci5yZXNwb25zZVRleHQuaW5kZXhPZiggJzxzdmcnICkgIT09IC0xICkge1xuXHRcdFx0XHRzdmdDYWNoZVsga2V5IF0gPSB4aHIucmVzcG9uc2VUZXh0O1xuXHRcdFx0XHRlbC5pbm5lckhUTUwgPSB4aHIucmVzcG9uc2VUZXh0O1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0eGhyLnNlbmQoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHByb2Nlc3NSb290KCByb290ICkge1xuXHRcdHZhciBlbHMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICk7XG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZWxzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0bG9hZFN2ZyggZWxzWyBpIF0gKTtcblx0XHR9XG5cdH1cblxuXHR3aW5kb3cuZWxlbWVudG9ySWNvbk9ic2VydmUgPSBmdW5jdGlvbiggcm9vdCApIHtcblx0XHRpZiAoICEgcm9vdCB8fCByb290Ll9zdmdPYnNlcnZlZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0cm9vdC5fc3ZnT2JzZXJ2ZWQgPSB0cnVlO1xuXG5cdFx0bmV3IE11dGF0aW9uT2JzZXJ2ZXIoIGZ1bmN0aW9uKCBtdXRhdGlvbnMgKSB7XG5cdFx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBtdXRhdGlvbnMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdHZhciBub2RlcyA9IG11dGF0aW9uc1sgaSBdLmFkZGVkTm9kZXM7XG5cdFx0XHRcdGZvciAoIHZhciBqID0gMDsgaiA8IG5vZGVzLmxlbmd0aDsgaisrICkge1xuXHRcdFx0XHRcdGlmICggbm9kZXNbIGogXS5ub2RlVHlwZSA9PT0gMSApIHtcblx0XHRcdFx0XHRcdHByb2Nlc3NSb290KCBub2Rlc1sgaiBdICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApLm9ic2VydmUoIHJvb3QsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0gKTtcblxuXHRcdHByb2Nlc3NSb290KCByb290ICk7XG5cdH07XG5cblx0ZWxlbWVudG9ySWNvbk9ic2VydmUoIGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICk7XG5cblx0d2luZG93LmVsZW1lbnRvclJlbmRlckljb24gPSBmdW5jdGlvbiggdmFsdWUsIGljb25UeXBlLCBzdmdNZWRpYSApIHtcblx0XHQvLyBDdXN0b20gU1ZHIG1vZGVcblx0XHRpZiAoIGljb25UeXBlID09PSAnc3ZnJyAmJiBzdmdNZWRpYSApIHtcblx0XHRcdHZhciBzdmdVcmwgPSAnJztcblx0XHRcdGlmICggdHlwZW9mIHN2Z01lZGlhID09PSAnb2JqZWN0JyAmJiBzdmdNZWRpYS51cmwgKSB7XG5cdFx0XHRcdHN2Z1VybCA9IHN2Z01lZGlhLnVybDtcblx0XHRcdH0gZWxzZSBpZiAoIHR5cGVvZiBzdmdNZWRpYSA9PT0gJ3N0cmluZycgJiYgc3ZnTWVkaWEubGVuZ3RoICkge1xuXHRcdFx0XHRzdmdVcmwgPSBzdmdNZWRpYTtcblx0XHRcdH1cblx0XHRcdGlmICggc3ZnVXJsICkge1xuXHRcdFx0XHRyZXR1cm4gJzxzcGFuIGNsYXNzPVwiZWxlbWVudG9yLWljb24tc3ZnIGVsZW1lbnRvci1pY29uLXN2Zy0tY3VzdG9tXCI+PGltZyBzcmM9XCInICsgc3ZnVXJsICsgJ1wiIGFsdD1cIlwiIC8+PC9zcGFuPic7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIHZhbHVlICkge1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblxuXHRcdHZhciBwYXJzZWQgPSB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdmFsdWUgOiBudWxsO1xuXG5cdFx0aWYgKCAhIHBhcnNlZCAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLmNoYXJBdCggMCApID09PSAneycgKSB7XG5cdFx0XHR0cnkgeyBwYXJzZWQgPSBKU09OLnBhcnNlKCB2YWx1ZSApOyB9IGNhdGNoICggZSApIHt9XG5cdFx0fVxuXG5cdFx0aWYgKCBwYXJzZWQgKSB7XG5cdFx0XHRpZiAoIHBhcnNlZC5zdmdLZXkgKSB7XG5cdFx0XHRcdHZhciBzYWZlS2V5ID0gcGFyc2VkLnN2Z0tleS5yZXBsYWNlKCAvW15hLXowLTlcXC1cXC9dL2csICcnICk7XG5cdFx0XHRcdGlmICggc2FmZUtleSApIHtcblx0XHRcdFx0XHRpZiAoIHN2Z0NhY2hlWyBzYWZlS2V5IF0gKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gJzxzcGFuIGNsYXNzPVwiZWxlbWVudG9yLWljb24tc3ZnXCI+JyArIHN2Z0NhY2hlWyBzYWZlS2V5IF0gKyAnPC9zcGFuPic7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiAnPHNwYW4gY2xhc3M9XCJlbGVtZW50b3ItaWNvbi1zdmdcIiBkYXRhLXN2Zy1rZXk9XCInICsgc2FmZUtleSArICdcIj48L3NwYW4+Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCBwYXJzZWQudmFsdWUgKSB7XG5cdFx0XHRcdHJldHVybiAnPGkgY2xhc3M9XCInICsgcGFyc2VkLnZhbHVlICsgJ1wiPjwvaT4nO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICggdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm4gJzxpIGNsYXNzPVwiJyArIHZhbHVlICsgJ1wiPjwvaT4nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnJztcblx0fTtcbn0gKSgpO1xuXG5NYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUucHJvdG90eXBlLmNvbXBpbGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKCByYXdUZW1wbGF0ZSwgb3B0aW9ucyApIHtcblx0b3B0aW9ucyA9IHtcblx0XHRldmFsdWF0ZTogLzwjKFtcXHNcXFNdKz8pIz4vZyxcblx0XHRpbnRlcnBvbGF0ZTogL1xce1xce1xceyhbXFxzXFxTXSs/KVxcfVxcfVxcfS9nLFxuXHRcdGVzY2FwZTogL1xce1xceyhbXlxcfV0rPylcXH1cXH0oPyFcXH0pL2dcblx0fTtcblxuXHRyZXR1cm4gXy50ZW1wbGF0ZSggcmF3VGVtcGxhdGUsIG9wdGlvbnMgKTtcbn07XG5cbkFwcCA9IE1hcmlvbmV0dGUuQXBwbGljYXRpb24uZXh0ZW5kKCB7XG5cdGhlbHBlcnM6IHJlcXVpcmUoICdlbGVtZW50b3ItdXRpbHMvaGVscGVycycgKSxcblx0c2NoZW1lczogcmVxdWlyZSggJ2VsZW1lbnRvci11dGlscy9zY2hlbWVzJyApLFxuXHRwcmVzZXRzRmFjdG9yeTogcmVxdWlyZSggJ2VsZW1lbnRvci11dGlscy9wcmVzZXRzLWZhY3RvcnknICksXG5cdG1vZGFsczogcmVxdWlyZSggJ2VsZW1lbnRvci11dGlscy9tb2RhbHMnICksXG5cdGludHJvZHVjdGlvbjogcmVxdWlyZSggJ2VsZW1lbnRvci11dGlscy9pbnRyb2R1Y3Rpb24nICksXG5cdHRlbXBsYXRlczogcmVxdWlyZSggJ2VsZW1lbnRvci10ZW1wbGF0ZXMvbWFuYWdlcicgKSxcblx0c3R5bGVMaWJyYXJ5OiByZXF1aXJlKCAnZWxlbWVudG9yLXN0eWxlcy9tYW5hZ2VyJyApLFxuXHRhamF4OiByZXF1aXJlKCAnZWxlbWVudG9yLXV0aWxzL2FqYXgnICksXG5cblx0Y2hhbm5lbHM6IHtcblx0XHRlZGl0b3I6IEJhY2tib25lLlJhZGlvLmNoYW5uZWwoICdFTEVNRU5UT1I6ZWRpdG9yJyApLFxuXHRcdGRhdGE6IEJhY2tib25lLlJhZGlvLmNoYW5uZWwoICdFTEVNRU5UT1I6ZGF0YScgKSxcblx0XHRwYW5lbEVsZW1lbnRzOiBCYWNrYm9uZS5SYWRpby5jaGFubmVsKCAnRUxFTUVOVE9SOnBhbmVsRWxlbWVudHMnICksXG5cdFx0ZGF0YUVkaXRNb2RlOiBCYWNrYm9uZS5SYWRpby5jaGFubmVsKCAnRUxFTUVOVE9SOmVkaXRtb2RlJyApLFxuXHRcdGRldmljZU1vZGU6IEJhY2tib25lLlJhZGlvLmNoYW5uZWwoICdFTEVNRU5UT1I6ZGV2aWNlTW9kZScgKSxcblx0XHR0ZW1wbGF0ZXM6IEJhY2tib25lLlJhZGlvLmNoYW5uZWwoICdFTEVNRU5UT1I6dGVtcGxhdGVzJyApXG5cdH0sXG5cblx0Ly8gUHJpdmF0ZSBNZW1iZXJzXG5cdF9jb250cm9sc0l0ZW1WaWV3OiBudWxsLFxuXG5cdF9kZWZhdWx0RGV2aWNlTW9kZTogJ2Rlc2t0b3AnLFxuXG5cdGdldEVsZW1lbnREYXRhOiBmdW5jdGlvbiggbW9kZWxFbGVtZW50ICkge1xuXHRcdHZhciBlbFR5cGUgPSBtb2RlbEVsZW1lbnQuZ2V0KCAnZWxUeXBlJyApO1xuXG5cdFx0aWYgKCAnd2lkZ2V0JyA9PT0gZWxUeXBlICkge1xuXHRcdFx0dmFyIHdpZGdldFR5cGUgPSBtb2RlbEVsZW1lbnQuZ2V0KCAnd2lkZ2V0VHlwZScgKTtcblxuXHRcdFx0aWYgKCAhIHRoaXMuY29uZmlnLndpZGdldHNbIHdpZGdldFR5cGUgXSApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcy5jb25maWcud2lkZ2V0c1sgd2lkZ2V0VHlwZSBdO1xuXHRcdH1cblxuXHRcdGlmICggISB0aGlzLmNvbmZpZy5lbGVtZW50c1sgZWxUeXBlIF0gKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnLmVsZW1lbnRzWyBlbFR5cGUgXTtcblx0fSxcblxuXHRnZXRFbGVtZW50Q29udHJvbHM6IGZ1bmN0aW9uKCBtb2RlbEVsZW1lbnQgKSB7XG5cdFx0dmFyIGVsZW1lbnREYXRhID0gdGhpcy5nZXRFbGVtZW50RGF0YSggbW9kZWxFbGVtZW50ICk7XG5cblx0XHRpZiAoICEgZWxlbWVudERhdGEgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dmFyIGVsVHlwZSA9IG1vZGVsRWxlbWVudC5nZXQoICdlbFR5cGUnICksXG5cdFx0XHRpc0lubmVyID0gbW9kZWxFbGVtZW50LmdldCggJ2lzSW5uZXInICk7XG5cblx0XHRpZiAoICd3aWRnZXQnID09PSBlbFR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudERhdGEuY29udHJvbHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF8uZmlsdGVyKCBlbGVtZW50RGF0YS5jb250cm9scywgZnVuY3Rpb24oIGNvbnRyb2xEYXRhICkge1xuXHRcdFx0cmV0dXJuICEgKCBpc0lubmVyICYmIGNvbnRyb2xEYXRhLmhpZGVfaW5faW5uZXIgfHwgISBpc0lubmVyICYmIGNvbnRyb2xEYXRhLmhpZGVfaW5fdG9wICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGdldENvbnRyb2xJdGVtVmlldzogZnVuY3Rpb24oIGNvbnRyb2xUeXBlICkge1xuXHRcdGlmICggbnVsbCA9PT0gdGhpcy5fY29udHJvbHNJdGVtVmlldyApIHtcblx0XHRcdHRoaXMuX2NvbnRyb2xzSXRlbVZpZXcgPSB7XG5cdFx0XHRcdGNvbG9yOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2NvbG9yJyApLFxuXHRcdFx0XHRkaW1lbnNpb25zOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2RpbWVuc2lvbnMnICksXG5cdFx0XHRcdGltYWdlX2RpbWVuc2lvbnM6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvaW1hZ2UtZGltZW5zaW9ucycgKSxcblx0XHRcdFx0bWVkaWE6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvbWVkaWEnICksXG5cdFx0XHRcdHNsaWRlcjogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9zbGlkZXInICksXG5cdFx0XHRcdHd5c2l3eWc6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvd3lzaXd5ZycgKSxcblx0XHRcdFx0YXV0b2NvbXBsZXRlX3Byb2R1Y3RzOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2F1dG9jb21wbGV0ZS1wcm9kdWN0cycgKSxcblx0XHRcdFx0YXV0b2NvbXBsZXRlX3Bvc3RzOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2F1dG9jb21wbGV0ZS1wb3N0cycgKSxcblx0XHRcdFx0Y2hvb3NlOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Nob29zZScgKSxcblx0XHRcdFx0dXJsOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL3VybCcgKSxcblx0XHRcdFx0Zm9udDogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9mb250JyApLFxuXHRcdFx0XHRzZWN0aW9uOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL3NlY3Rpb24nICksXG5cdFx0XHRcdHJlcGVhdGVyOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL3JlcGVhdGVyJyApLFxuXHRcdFx0XHR3cF93aWRnZXQ6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvd3Bfd2lkZ2V0JyApLFxuXHRcdFx0XHRpY29uOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2ljb24nICksXG5cdFx0XHRcdGdhbGxlcnk6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvZ2FsbGVyeScgKSxcblx0XHRcdFx0c2VsZWN0MjogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9zZWxlY3QyJyApLFxuXHRcdFx0XHRzZWxlY3Rfc29ydDogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9zZWxlY3Qtc29ydCcgKSxcblx0XHRcdFx0Ym94X3NoYWRvdzogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9ib3gtc2hhZG93JyApLFxuXHRcdFx0XHR0ZXh0X3NoYWRvdzogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy90ZXh0LXNoYWRvdycgKSxcblx0XHRcdFx0c3RydWN0dXJlOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL3N0cnVjdHVyZScgKSxcblx0XHRcdFx0YW5pbWF0aW9uOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2FuaW1hdGlvbicgKSxcblx0XHRcdFx0aG92ZXJfYW5pbWF0aW9uOiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2FuaW1hdGlvbicgKSxcblx0XHRcdFx0ZGF0ZXRpbWU6IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvZGF0ZXRpbWUnKSxcblx0XHRcdFx0Y29kZTogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9jb2RlJyApLFxuXHRcdFx0XHRwb3BvdmVyX3RvZ2dsZTogcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9wb3BvdmVyLXRvZ2dsZScgKVxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5jaGFubmVscy5lZGl0b3IudHJpZ2dlciggJ2VkaXRvcjpjb250cm9sczppbml0aWFsaXplJyApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9jb250cm9sc0l0ZW1WaWV3WyBjb250cm9sVHlwZSBdIHx8IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKTtcblx0fSxcblxuXHRnZXRQYW5lbFZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldFJlZ2lvbiggJ3BhbmVsJyApLmN1cnJlbnRWaWV3O1xuXHR9LFxuXG5cdGluaXRDb21wb25lbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmluaXREaWFsb2dzTWFuYWdlcigpO1xuXG5cdFx0dGhpcy5tb2RhbHMuaW5pdCgpO1xuXHRcdHRoaXMuYWpheC5pbml0KCk7XG5cblx0XHRjb25zdCBpbml0Q29udGV4dE1lbnUgPSByZXF1aXJlKFwiLi9jb21wb25lbnRzL2NvbnRleHQtbWVudVwiKTtcblx0XHRpbml0Q29udGV4dE1lbnUodGhpcyk7XG5cdH0sXG5cblx0aW5pdERpYWxvZ3NNYW5hZ2VyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRpYWxvZ3NNYW5hZ2VyID0gbmV3IERpYWxvZ3NNYW5hZ2VyLkluc3RhbmNlKCk7XG5cdH0sXG5cblx0aW5pdFByZXZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJHByZXZpZXdXcmFwcGVyID0gQmFja2JvbmUuJCggJyNlbGVtZW50b3ItcHJldmlldycgKTtcblxuXHRcdHRoaXMuJHByZXZpZXdSZXNwb25zaXZlV3JhcHBlciA9IEJhY2tib25lLiQoICcjZWxlbWVudG9yLXByZXZpZXctcmVzcG9uc2l2ZS13cmFwcGVyJyApO1xuXG5cdFx0dmFyIHByZXZpZXdJZnJhbWVJZCA9ICdlbGVtZW50b3ItcHJldmlldy1pZnJhbWUnO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHRoZSBpRnJhbWUgZG9lcyBub3QgZXhpc3QuXG5cdFx0aWYgKCAhIEJhY2tib25lLiQoICcjJyArIHByZXZpZXdJZnJhbWVJZCApLmxlbmd0aCApIHtcblx0XHRcdHZhciBwcmV2aWV3SUZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lmcmFtZScgKTtcblxuXHRcdFx0cHJldmlld0lGcmFtZS5pZCA9IHByZXZpZXdJZnJhbWVJZDtcblx0XHQgICAgcHJldmlld0lGcmFtZS5zcmMgPSB0aGlzLmNvbmZpZy5wcmV2aWV3X2xpbmsgKyAnJnRzPScgKyAoIG5ldyBEYXRlKCkuZ2V0VGltZSgpICk7XG5cblx0XHRcdHRoaXMuJHByZXZpZXdSZXNwb25zaXZlV3JhcHBlci5hcHBlbmQoIHByZXZpZXdJRnJhbWUgKTtcblx0XHR9XG5cblx0XHR0aGlzLiRwcmV2aWV3ID0gQmFja2JvbmUuJCggJyMnICsgcHJldmlld0lmcmFtZUlkICk7XG5cblx0XHR0aGlzLiRwcmV2aWV3Lm9uKCAnbG9hZCcsIF8uYmluZCggdGhpcy5vblByZXZpZXdMb2FkZWQsIHRoaXMgKSApO1xuXHR9LFxuXG5cdGluaXRGcm9udGVuZDogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yRnJvbnRlbmQuc2V0U2NvcGVXaW5kb3coIHRoaXMuJHByZXZpZXdbMF0uY29udGVudFdpbmRvdyApO1xuXG5cdFx0ZWxlbWVudG9yRnJvbnRlbmQuaW5pdCgpO1xuXHR9LFxuXG5cdG9uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdE5Qcm9ncmVzcy5zdGFydCgpO1xuXHRcdE5Qcm9ncmVzcy5pbmMoIDAuMiApO1xuXG5cdFx0dGhpcy5jb25maWcgPSBFbGVtZW50b3JDb25maWc7XG5cblx0XHRCYWNrYm9uZS5SYWRpby5ERUJVRyA9IGZhbHNlO1xuXHRcdEJhY2tib25lLlJhZGlvLnR1bmVJbiggJ0VMRU1FTlRPUicgKTtcblxuXHRcdHRoaXMuaW5pdENvbXBvbmVudHMoKTtcblxuXHRcdC8vIEluaXQgQmFzZSBlbGVtZW50cyBjb2xsZWN0aW9uIGZyb20gdGhlIHNlcnZlclxuXHRcdHZhciBFbGVtZW50TW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9lbGVtZW50JyApO1xuXG5cdFx0dGhpcy5lbGVtZW50cyA9IG5ldyBFbGVtZW50TW9kZWwuQ29sbGVjdGlvbiggdGhpcy5jb25maWcuZGF0YSApO1xuXG5cdFx0dGhpcy5pbml0UHJldmlldygpO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jaGFubmVscy5kYXRhRWRpdE1vZGUsICdzd2l0Y2gnLCB0aGlzLm9uRWRpdE1vZGVTd2l0Y2hlZCApO1xuXG5cdFx0dGhpcy5zZXRXb3JrU2F2ZXIoKTtcblxuXHRcdHRoaXMuaW5pdENsZWFyUGFnZURpYWxvZygpO1xuXHRcdHRoaXMuaW5pdExvc3RQYWdlRGlhbG9nKCk7XG5cdFx0dGhpcy5pbml0SWVFZGdlRGlhbG9nKCk7XG5cblx0fSxcblxuXHRvblByZXZpZXdMb2FkZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdE5Qcm9ncmVzcy5kb25lKCk7XG5cblx0XHR0aGlzLmluaXRGcm9udGVuZCgpO1xuXG5cdFx0dGhpcy4kcHJldmlld0NvbnRlbnRzID0gdGhpcy4kcHJldmlldy5jb250ZW50cygpO1xuXG5cdFx0Ly8gT2JzZXJ2ZSB0aGUgcHJldmlldyBpZnJhbWUgZm9yIFNWRyBpY29uIHBsYWNlaG9sZGVyc1xuXHRcdGVsZW1lbnRvckljb25PYnNlcnZlKCAoIHRoaXMuJHByZXZpZXdbMF0uY29udGVudERvY3VtZW50IHx8IHRoaXMuJHByZXZpZXdbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCApLmJvZHkgKTtcblxuXHRcdHZhciBTZWN0aW9uc0NvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9zZWN0aW9ucycgKSxcblx0XHRcdFBhbmVsTGF5b3V0VmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItbGF5b3V0cy9wYW5lbC9wYW5lbCcgKTtcblxuXHRcdHZhciAkcHJldmlld0VsZW1lbnRvckVsID0gdGhpcy4kcHJldmlld0NvbnRlbnRzLmZpbmQoICcjZWxlbWVudG9yJyApO1xuXG5cdFx0aWYgKCAhICRwcmV2aWV3RWxlbWVudG9yRWwubGVuZ3RoICkge1xuXHRcdFx0dGhpcy5vblByZXZpZXdFbE5vdEZvdW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGlmcmFtZVJlZ2lvbiA9IG5ldyBNYXJpb25ldHRlLlJlZ2lvbigge1xuXHRcdFx0Ly8gTWFrZSBzdXJlIHlvdSBnZXQgdGhlIERPTSBvYmplY3Qgb3V0IG9mIHRoZSBqUXVlcnkgb2JqZWN0XG5cdFx0XHRlbDogJHByZXZpZXdFbGVtZW50b3JFbFswXVxuXHRcdH0gKTtcblxuXHRcdHRoaXMuc2NoZW1lcy5pbml0KCk7XG5cdFx0dGhpcy5zY2hlbWVzLnByaW50U2NoZW1lc1N0eWxlKCk7XG5cblx0XHR0aGlzLiRwcmV2aWV3Q29udGVudHMub24oICdjbGljaycsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciAkdGFyZ2V0ID0gQmFja2JvbmUuJCggZXZlbnQudGFyZ2V0ICksXG5cdFx0XHRcdGVkaXRNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRhdGFFZGl0TW9kZS5yZXF1ZXN0KCAnYWN0aXZlTW9kZScgKSxcblx0XHRcdFx0aXNDbGlja0luc2lkZUVsZW1lbnRvciA9ICEhICR0YXJnZXQuY2xvc2VzdCggJyNlbGVtZW50b3InICkubGVuZ3RoLFxuXHRcdFx0XHRpc1RhcmdldEluc2lkZURvY3VtZW50ID0gdGhpcy5jb250YWlucyggJHRhcmdldFswXSApO1xuXG5cdFx0XHRpZiAoIGlzQ2xpY2tJbnNpZGVFbGVtZW50b3IgJiYgJ3ByZXZpZXcnICE9PSBlZGl0TW9kZSB8fCAhIGlzVGFyZ2V0SW5zaWRlRG9jdW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAkdGFyZ2V0LmNsb3Nlc3QoICdhJyApLmxlbmd0aCApIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAhIGlzQ2xpY2tJbnNpZGVFbGVtZW50b3IgKSB7XG5cdFx0XHRcdGVsZW1lbnRvci5nZXRQYW5lbFZpZXcoKS5zZXRQYWdlKCAnZWxlbWVudHMnICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHRcdC8qY29uc29sZS5sb2coIHRoaXMuJHByZXZpZXdDb250ZW50cyApO1xuXG5cdFx0Ly8gUmlnaHQtY2xpY2sgY29udGV4dCBtZW51IGhhbmRsaW5nIGluc2lkZSB0aGUgcHJldmlldyBpZnJhbWVcblx0XHR0aGlzLiRwcmV2aWV3Q29udGVudHMub24oICdjb250ZXh0bWVudScsIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdGNvbnNvbGUubG9nKCAnSVFJVCBDb250ZXh0TWVudTogbmF0aXZlIGNvbnRleHRtZW51IGV2ZW50IGRldGVjdGVkJywgZXZlbnQgKTtcblxuXHRcdFx0dmFyICR0YXJnZXQgPSBCYWNrYm9uZS4kKCBldmVudC50YXJnZXQgKSxcblx0XHRcdFx0aXNDbGlja0luc2lkZUVsZW1lbnRvciA9ICEhICR0YXJnZXQuY2xvc2VzdCggJyNlbGVtZW50b3InICkubGVuZ3RoLFxuXHRcdFx0XHRpc1RhcmdldEluc2lkZURvY3VtZW50ID0gdGhpcy5jb250YWlucyggJHRhcmdldFswXSApO1xuXG5cdFx0XHQvLyBJZ25vcmUgcmlnaHQtY2xpY2tzIGVuIGRlaG9ycyBkZSBsYSB6b25lIEVsZW1lbnRvciBvdSBob3JzIGR1IGRvY3VtZW50XG5cdFx0XHRpZiAoICEgaXNDbGlja0luc2lkZUVsZW1lbnRvciB8fCAhIGlzVGFyZ2V0SW5zaWRlRG9jdW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRW1ww6pjaGUgbGUgbWVudSBjb250ZXh0dWVsIG5hdGlmIGR1IG5hdmlnYXRldXJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdGNvbnNvbGUubG9nKCAnSVFJVCBDb250ZXh0TWVudTogbmF0aXZlIGNvbnRleHRtZW51IGNhcHR1cmVkIG9uJywgJHRhcmdldFswXSApO1xuXG5cdFx0XHQvLyBUT0RPOiByZXRyb3V2ZXIgbGEgdnVlIEJhY2tib25lL01hcmlvbmV0dGUgYXNzb2Npw6llIMOgIGwnw6lsw6ltZW50IGNsaXF1w6lcblx0XHRcdHZhciBjbGlja2VkVmlldyA9IG51bGw7XG5cblx0XHRcdC8vIETDqWNsZW5jaGVtZW50IGRlIGwnw6l2w6luZW1lbnQgaW50ZXJuZSBjb25zb21tw6kgcGFyIENvbnRleHRNZW51Vmlld1xuXHRcdFx0ZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvci50cmlnZ2VyKCAnY29udGV4dC1tZW51Om9wZW4nLCB7XG5cdFx0XHRcdGV2ZW50OiBldmVudCxcblx0XHRcdFx0dmlldzogY2xpY2tlZFZpZXcsXG5cdFx0XHRcdGdyb3VwczogW11cblx0XHRcdH0gKTtcblx0XHR9ICk7Ki9cblxuXHRcdHRoaXMuYWRkUmVnaW9ucygge1xuXHRcdFx0c2VjdGlvbnM6IGlmcmFtZVJlZ2lvbixcblx0XHRcdHBhbmVsOiAnI2VsZW1lbnRvci1wYW5lbCcsXG5cdFx0XHR0b3BCYXI6ICcjZWxlbWVudG9yLXRvcGJhcidcblx0XHR9ICk7XG5cblx0XHR0aGlzLmdldFJlZ2lvbiggJ3NlY3Rpb25zJyApLnNob3coIG5ldyBTZWN0aW9uc0NvbGxlY3Rpb25WaWV3KCB7XG5cdFx0XHRjb2xsZWN0aW9uOiB0aGlzLmVsZW1lbnRzXG5cdFx0fSApICk7XG5cblx0XHR0aGlzLmdldFJlZ2lvbiggJ3BhbmVsJyApLnNob3coIG5ldyBQYW5lbExheW91dFZpZXcoKSApO1xuXG5cdFx0dmFyIFRvcEJhckl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1sYXlvdXRzL3BhbmVsL3RvcGJhcicgKTtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ3RvcEJhcicgKS5zaG93KCBuZXcgVG9wQmFySXRlbVZpZXcoKSApO1xuXG5cdFx0Ly8gSW5pdCBOYXZpZ2F0b3Jcblx0XHR2YXIgbmF2aWdhdG9yID0gcmVxdWlyZSggJ2VsZW1lbnRvci1jb21wb25lbnRzL25hdmlnYXRvcicgKTtcblx0XHR0aGlzLm5hdmlnYXRvciA9IG5hdmlnYXRvci5pbml0KCk7XG5cblx0XHR0aGlzLiRwcmV2aWV3Q29udGVudHNcblx0XHQgICAgLmNoaWxkcmVuKCkgLy8gPGh0bWw+XG5cdFx0ICAgIC5hZGRDbGFzcyggJ2VsZW1lbnRvci1odG1sJyApXG5cdFx0ICAgIC5jaGlsZHJlbiggJ2JvZHknIClcblx0XHQgICAgLmFkZENsYXNzKCAnZWxlbWVudG9yLWVkaXRvci1hY3RpdmUnICk7XG5cblx0XHR0aGlzLnNldFJlc2l6YWJsZVBhbmVsKCk7XG5cblx0XHR0aGlzLmNoYW5nZURldmljZU1vZGUoIHRoaXMuX2RlZmF1bHREZXZpY2VNb2RlICk7XG5cblx0XHRCYWNrYm9uZS4kKCAnI2VsZW1lbnRvci1sb2FkaW5nJyApLmZhZGVPdXQoIDYwMCApO1xuXG5cdFx0Xy5kZWZlciggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3JGcm9udGVuZC5nZXRTY29wZVdpbmRvdygpLmpRdWVyeS5ob2xkUmVhZHkoIGZhbHNlICk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5lbnF1ZXVlVHlwb2dyYXBoeUZvbnRzKCk7XG5cblx0XHQvL3RoaXMuaW50cm9kdWN0aW9uLnN0YXJ0T25Mb2FkSW50cm9kdWN0aW9uKCk7IC8vIFRFTVAgUmVtb3ZlZFxuXG5cdFx0dGhpcy50cmlnZ2VyKCAncHJldmlldzpsb2FkZWQnICk7XG5cblx0XHR2YXIgYnJvd3NlclZlcnNpb24gPSB0aGlzLmRldGVjdElFKCk7XG5cblx0XHRpZiAoYnJvd3NlclZlcnNpb24gIT0gZmFsc2Upe1xuXHRcdFx0dGhpcy5nZXRJZUVkZ2VEaWFsb2coKS5zaG93KCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uRWRpdE1vZGVTd2l0Y2hlZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YUVkaXRNb2RlLnJlcXVlc3QoICdhY3RpdmVNb2RlJyApO1xuXG5cdFx0aWYgKCAncHJldmlldycgPT09IGFjdGl2ZU1vZGUgKSB7XG5cdFx0XHR0aGlzLmVudGVyUHJldmlld01vZGUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5leGl0UHJldmlld01vZGUoKTtcblx0XHR9XG5cdH0sXG5cblx0b25QcmV2aWV3RWxOb3RGb3VuZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRpYWxvZyA9IHRoaXMuZGlhbG9nc01hbmFnZXIuY3JlYXRlV2lkZ2V0KCAnY29uZmlybScsIHtcblx0XHRcdGlkOiAnZWxlbWVudG9yLWZhdGFsLWVycm9yLWRpYWxvZycsXG5cdFx0XHRoZWFkZXJNZXNzYWdlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAncHJldmlld19lbF9ub3RfZm91bmRfaGVhZGVyJyApLFxuXHRcdFx0bWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ3ByZXZpZXdfZWxfbm90X2ZvdW5kX21lc3NhZ2UnICksXG5cdFx0XHRwb3NpdGlvbjoge1xuXHRcdFx0XHRteTogJ2NlbnRlciBjZW50ZXInLFxuXHRcdFx0XHRhdDogJ2NlbnRlciBjZW50ZXInXG5cdFx0XHR9LFxuICAgICAgICAgICAgc3RyaW5nczoge1xuXHRcdFx0XHRjb25maXJtOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnbGVhcm5fbW9yZScgKSxcblx0XHRcdFx0Y2FuY2VsOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnZ29fYmFjaycgKVxuICAgICAgICAgICAgfSxcblx0XHRcdG9uQ29uZmlybTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdG9wZW4oIGVsZW1lbnRvci5jb25maWcubWFpbnRhbmNlX3VybF9zZXR0aW5ncywgJ19ibGFuaycgKTtcblx0XHRcdH0sXG5cdFx0XHRvbkNhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHBhcmVudC5oaXN0b3J5LmdvKCAtMSApO1xuXHRcdFx0fSxcblx0XHRcdGhpZGVPbkJ1dHRvbkNsaWNrOiBmYWxzZVxuXHRcdH0gKTtcblxuXHRcdGRpYWxvZy5zaG93KCk7XG5cdH0sXG5cblx0c2V0RmxhZ0VkaXRvckNoYW5nZTogZnVuY3Rpb24oIHN0YXR1cyApIHtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLnJlcGx5KCAnZWRpdG9yOmNoYW5nZWQnLCBzdGF0dXMgKTtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLnRyaWdnZXIoICdlZGl0b3I6Y2hhbmdlZCcsIHN0YXR1cyApO1xuXHR9LFxuXG5cdGlzRWRpdG9yQ2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICggdHJ1ZSA9PT0gZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvci5yZXF1ZXN0KCAnZWRpdG9yOmNoYW5nZWQnICkgKTtcblx0fSxcblxuXHRzZXRXb3JrU2F2ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdEJhY2tib25lLiQoIHdpbmRvdyApLm9uKCAnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIGVsZW1lbnRvci5pc0VkaXRvckNoYW5nZWQoKSApIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnRvci50cmFuc2xhdGUoICdiZWZvcmVfdW5sb2FkX2FsZXJ0JyApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRzZXRSZXNpemFibGVQYW5lbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0c2lkZSA9IGVsZW1lbnRvci5jb25maWcuaXNfcnRsID8gJ3JpZ2h0JyA6ICdsZWZ0JztcblxuXHRcdHNlbGYucGFuZWwuJGVsLnJlc2l6YWJsZSgge1xuXHRcdFx0aGFuZGxlczogZWxlbWVudG9yLmNvbmZpZy5pc19ydGwgPyAndycgOiAnZScsXG5cdFx0XHRtaW5XaWR0aDogMjAwLFxuXHRcdFx0bWF4V2lkdGg6IDUwMCxcblx0XHRcdHN0YXJ0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi4kcHJldmlld1dyYXBwZXJcblx0XHRcdFx0XHQuYWRkQ2xhc3MoICd1aS1yZXNpemFibGUtcmVzaXppbmcnIClcblx0XHRcdFx0XHQuY3NzKCAncG9pbnRlci1ldmVudHMnLCAnbm9uZScgKTtcblx0XHRcdH0sXG5cdFx0XHRzdG9wOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi4kcHJldmlld1dyYXBwZXJcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoICd1aS1yZXNpemFibGUtcmVzaXppbmcnIClcblx0XHRcdFx0XHQuY3NzKCAncG9pbnRlci1ldmVudHMnLCAnJyApO1xuXG5cdFx0XHRcdGVsZW1lbnRvci5jaGFubmVscy5kYXRhLnRyaWdnZXIoICdzY3JvbGxiYXI6dXBkYXRlJyApO1xuXHRcdFx0fSxcblx0XHRcdHJlc2l6ZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRcdFx0c2VsZi4kcHJldmlld1dyYXBwZXJcblx0XHRcdFx0XHQuY3NzKCBzaWRlLCB1aS5zaXplLndpZHRoICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdGVudGVyUHJldmlld01vZGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJHByZXZpZXdDb250ZW50c1xuXHRcdCAgICAuZmluZCggJ2JvZHknIClcblx0XHQgICAgLmFkZCggJ2JvZHknIClcblx0XHQgICAgLnJlbW92ZUNsYXNzKCAnZWxlbWVudG9yLWVkaXRvci1hY3RpdmUnIClcblx0XHQgICAgLmFkZENsYXNzKCAnZWxlbWVudG9yLWVkaXRvci1wcmV2aWV3JyApO1xuXG5cdFx0Ly8gSGFuZGxlIHBhbmVsIHJlc2l6ZVxuXHRcdHRoaXMuJHByZXZpZXdXcmFwcGVyLmNzcyggZWxlbWVudG9yLmNvbmZpZy5pc19ydGwgPyAncmlnaHQnIDogJ2xlZnQnLCAnJyApO1xuXG5cdFx0dGhpcy5wYW5lbC4kZWwuY3NzKCAnd2lkdGgnLCAnJyApO1xuXHR9LFxuXG5cdGV4aXRQcmV2aWV3TW9kZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kcHJldmlld0NvbnRlbnRzXG5cdFx0ICAgIC5maW5kKCAnYm9keScgKVxuXHRcdCAgICAuYWRkKCAnYm9keScgKVxuXHRcdCAgICAucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZWRpdG9yLXByZXZpZXcnIClcblx0XHQgICAgLmFkZENsYXNzKCAnZWxlbWVudG9yLWVkaXRvci1hY3RpdmUnICk7XG5cdH0sXG5cblx0c2F2ZUJ1aWxkZXI6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMgPSBfLmV4dGVuZCgge1xuXHRcdFx0cmV2aXNpb246ICdkcmFmdCcsXG5cdFx0XHRvblN1Y2Nlc3M6IG51bGxcblx0XHR9LCBvcHRpb25zICk7XG5cblx0XHROUHJvZ3Jlc3Muc3RhcnQoKTtcblxuXHRcdGxldCBlbGVtZW50cyA9IGVsZW1lbnRvci5lbGVtZW50cy50b0pTT04oKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRlbGVtZW50c1tpXSA9IHRoaXMuY2xlYW5FbXB0eVZhbHVlcyhlbGVtZW50c1tpXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuYWpheC5zZW5kKCAnU2F2ZUVkaXRvcicsIHtcblx0ICAgICAgICBkYXRhOiB7XG5cdFx0ICAgICAgICBwYWdlX2lkOiB0aGlzLmNvbmZpZy5wb3N0X2lkLFxuXHRcdFx0XHRpZF9sYW5nOiB0aGlzLmNvbmZpZy5pZF9sYW5nLFxuXHRcdFx0XHRuZXdfY29udGVudDogdGhpcy5jb25maWcubmV3X2NvbnRlbnQsXG5cdFx0XHRcdGNvbnRlbnRfdHlwZTogdGhpcy5jb25maWcuY29udGVudF90eXBlLFxuXHRcdFx0XHRwYWdlX3R5cGU6IHRoaXMuY29uZmlnLnBhZ2VfdHlwZSxcblx0XHQgICAgICAgIHJldmlzaW9uOiBvcHRpb25zLnJldmlzaW9uLFxuXHRcdCAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoIGVsZW1lbnRzIClcblx0ICAgICAgICB9LFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0XHRcdE5Qcm9ncmVzcy5kb25lKCk7XG5cblx0XHRcdFx0ZWxlbWVudG9yLnNldEZsYWdFZGl0b3JDaGFuZ2UoIGZhbHNlICk7XG5cblx0XHRcdFx0aWYgKCBfLmlzRnVuY3Rpb24oIG9wdGlvbnMub25TdWNjZXNzICkgKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vblN1Y2Nlc3MuY2FsbCggdGhpcywgZGF0YSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG4gICAgICAgIH0gKTtcblx0fSxcblxuXHRjbGVhbkVtcHR5VmFsdWVzOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnQmVmb3JlIGNsZWFuaW5nOicsIGVsZW1lbnQpO1xuXHRcdC8vZWxlbWVudCA9IHRoaXMuX2NsZWFuRW1wdHlEYXRhKGVsZW1lbnQpO1xuXHRcdC8vY29uc29sZS5sb2coJ0FmdGVyIGNsZWFuaW5nOicsIGVsZW1lbnQpO1xuXHRcdHJldHVybiBlbGVtZW50O1xuXHR9LFxuXG5cdF9jbGVhbkVtcHR5RGF0YTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdC8vIFNpIHRhYmxlYXUg4oaSIG5ldHRveWVyIGNoYXF1ZSBlbnRyw6llIHLDqWN1cnNpdmVtZW50IGV0IHN1cHByaW1lciBsZXMgZW50csOpZXMgdmlkZXNcblx0XHRpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0Y29uc3QgY2xlYW5lZEFycmF5ID0gZGF0YVxuXHRcdFx0XHQubWFwKGl0ZW0gPT4gdGhpcy5fY2xlYW5FbXB0eURhdGEoaXRlbSkpXG5cdFx0XHRcdC5maWx0ZXIoaXRlbSA9PiB7XG5cdFx0XHRcdFx0aWYgKGl0ZW0gPT09IG51bGwgfHwgaXRlbSA9PT0gdW5kZWZpbmVkIHx8IGl0ZW0gPT09ICcnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoaXRlbSkgJiYgaXRlbS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkoaXRlbSkgJiYgT2JqZWN0LmtleXMoaXRlbSkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gY2xlYW5lZEFycmF5O1xuXHRcdH1cblxuXHRcdC8vIFNpIG9iamV0IOKGkiBuZXR0b3llciBjaGFxdWUgY2zDqSByw6ljdXJzaXZlbWVudFxuXHRcdGlmIChkYXRhICYmIHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y29uc3QgY2xlYW5lZE9iaiA9IHt9O1xuXG5cdFx0XHRPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gdGhpcy5fY2xlYW5FbXB0eURhdGEoZGF0YVtrZXldKTtcblxuXHRcdFx0XHRjb25zdCBpc0VtcHR5ID1cblx0XHRcdFx0XHR2YWx1ZSA9PT0gbnVsbCB8fFxuXHRcdFx0XHRcdHZhbHVlID09PSB1bmRlZmluZWQgfHxcblx0XHRcdFx0XHR2YWx1ZSA9PT0gJycgfHxcblx0XHRcdFx0XHQoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB8fFxuXHRcdFx0XHRcdCh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoID09PSAwKTtcblxuXHRcdFx0XHRpZiAoIWlzRW1wdHkpIHtcblx0XHRcdFx0XHRjbGVhbmVkT2JqW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIFNpIGwnb2JqZXQgbmUgY29udGllbnQgcXUndW5lIHNldWxlIGNsw6kgJ3VuaXQnLCBvbiBsZSBjb25zaWTDqHJlIGNvbW1lIHZpZGVcblx0XHRcdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhjbGVhbmVkT2JqKTtcblx0XHRcdGlmIChrZXlzLmxlbmd0aCA9PT0gMSAmJiBrZXlzWzBdID09PSAndW5pdCcpIHtcblx0XHRcdFx0cmV0dXJuIHt9O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gY2xlYW5lZE9iajtcblx0XHR9XG5cblx0XHQvLyBWYWxldXIgcHJpbWl0aXZlIOKGkiByZXRvdXJuZXIgdGVsIHF1ZWxcblx0XHRyZXR1cm4gZGF0YTtcblx0fSxcblxuXHRjaGFuZ2VEZXZpY2VNb2RlOiBmdW5jdGlvbiggbmV3RGV2aWNlTW9kZSApIHtcblx0XHR2YXIgb2xkRGV2aWNlTW9kZSA9IHRoaXMuY2hhbm5lbHMuZGV2aWNlTW9kZS5yZXF1ZXN0KCAnY3VycmVudE1vZGUnICk7XG5cblx0XHRpZiAoIG9sZERldmljZU1vZGUgPT09IG5ld0RldmljZU1vZGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0QmFja2JvbmUuJCggJ2JvZHknIClcblx0XHRcdC5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci1kZXZpY2UtJyArIG9sZERldmljZU1vZGUgKVxuXHRcdFx0LmFkZENsYXNzKCAnZWxlbWVudG9yLWRldmljZS0nICsgbmV3RGV2aWNlTW9kZSApO1xuXG5cdFx0dGhpcy5jaGFubmVscy5kZXZpY2VNb2RlXG5cdFx0XHQucmVwbHkoICdwcmV2aW91c01vZGUnLCBvbGREZXZpY2VNb2RlIClcblx0XHRcdC5yZXBseSggJ2N1cnJlbnRNb2RlJywgbmV3RGV2aWNlTW9kZSApXG5cdFx0XHQudHJpZ2dlciggJ2NoYW5nZScgKTtcblxuXHRcdEJhY2tib25lLiQoIHdpbmRvdyApLnRyaWdnZXIoJ2NoYW5nZWREZXZpY2VNb2RlJyk7XG5cdH0sXG5cblx0aW5pdENsZWFyUGFnZURpYWxvZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0ZGlhbG9nO1xuXG5cdFx0c2VsZi5nZXRDbGVhclBhZ2VEaWFsb2cgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggZGlhbG9nICkge1xuXHRcdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdFx0fVxuXG5cdFx0XHRkaWFsb2cgPSB0aGlzLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2NvbmZpcm0nLCB7XG5cdFx0XHRcdGlkOiAnZWxlbWVudG9yLWNsZWFyLXBhZ2UtZGlhbG9nJyxcblx0XHRcdFx0aGVhZGVyTWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2NsZWFyX3BhZ2UnICksXG5cdFx0XHRcdG1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdkaWFsb2dfY29uZmlybV9jbGVhcl9wYWdlJyApLFxuXHRcdFx0XHRwb3NpdGlvbjoge1xuXHRcdFx0XHRcdG15OiAnY2VudGVyIGNlbnRlcicsXG5cdFx0XHRcdFx0YXQ6ICdjZW50ZXIgY2VudGVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNvbmZpcm06IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNlbGYuZ2V0UmVnaW9uKCAnc2VjdGlvbnMnICkuY3VycmVudFZpZXcuY29sbGVjdGlvbi5yZXNldCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdHJldHVybiBkaWFsb2c7XG5cdFx0fTtcblx0fSxcblxuXHRpbml0TG9zdFBhZ2VEaWFsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdGRpYWxvZztcblxuXHRcdHNlbGYuZ2V0TG9zdFBhZ2VEaWFsb2cgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggZGlhbG9nICkge1xuXHRcdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdFx0fVxuXG5cdFx0XHRkaWFsb2cgPSB0aGlzLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2NvbmZpcm0nLCB7XG5cdFx0XHRcdGlkOiAnZWxlbWVudG9yLWNsZWFyLXBhZ2UtZGlhbG9nJyxcblx0XHRcdFx0aGVhZGVyTWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2NoYW5nZXNfbG9zdCcgKSxcblx0XHRcdFx0bWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RpYWxvZ19jb25maXJtX2NoYW5nZXNfbG9zdCcgKSxcblx0XHRcdFx0cG9zaXRpb246IHtcblx0XHRcdFx0XHRteTogJ2NlbnRlciBjZW50ZXInLFxuXHRcdFx0XHRcdGF0OiAnY2VudGVyIGNlbnRlcidcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Db25maXJtOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRCYWNrYm9uZS4kKCAnI2VsZW1lbnRvci1sb2FkaW5nLCAjZWxlbWVudG9yLXByZXZpZXctbG9hZGluZycgKS5mYWRlSW4oIDYwMCApO1xuXHRcdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gIHNlbGYuYWRkVXJsUGFyYW0od2luZG93LmxvY2F0aW9uLmhyZWYsICdpZExhbmcnLCBpZF9sYW5nKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdH07XG5cdH0sXG5cblx0aW5pdEllRWRnZURpYWxvZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0ZGlhbG9nO1xuXG5cdFx0c2VsZi5nZXRJZUVkZ2VEaWFsb2cgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggZGlhbG9nICkge1xuXHRcdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdFx0fVxuXG5cdFx0XHRkaWFsb2cgPSB0aGlzLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2FsZXJ0Jywge1xuXHRcdFx0XHRpZDogJ2VsZW1lbnRvci1pZS1lZGdlLWRpYWxvZycsXG5cdFx0XHRcdGhlYWRlck1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdpZV9lZGdlX2Jyb3dzZXInICksXG5cdFx0XHRcdG1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdpZV9lZGdlX2Jyb3dzZXJfaW5mbycgKSxcblx0XHRcdFx0cG9zaXRpb246IHtcblx0XHRcdFx0XHRteTogJ2NlbnRlciBjZW50ZXInLFxuXHRcdFx0XHRcdGF0OiAnY2VudGVyIGNlbnRlcidcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Db25maXJtOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSBlbGVtZW50b3IuY29uZmlnLmVkaXRfcG9zdF9saW5rO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdHJldHVybiBkaWFsb2c7XG5cdFx0fTtcblx0fSxcblxuXHRjbGVhclBhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2V0Q2xlYXJQYWdlRGlhbG9nKCkuc2hvdygpO1xuXHR9LFxuXG5cdGNoYW5nZUxhbmd1YWdlOiBmdW5jdGlvbihpZF9sYW5nLCBpZ25vcmUpIHtcblxuXHRcdGlmICggZWxlbWVudG9yLmlzRWRpdG9yQ2hhbmdlZCgpICkge1xuXHRcdFx0c2VsZi5pZF9sYW5nID0gaWRfbGFuZztcblx0XHRcdHRoaXMuZ2V0TG9zdFBhZ2VEaWFsb2coKS5zaG93KCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdEJhY2tib25lLiQoICcjZWxlbWVudG9yLWxvYWRpbmcsICNlbGVtZW50b3ItcHJldmlldy1sb2FkaW5nJyApLmZhZGVJbiggNjAwICk7XG5cdFx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSB0aGlzLmFkZFVybFBhcmFtKHdpbmRvdy5sb2NhdGlvbi5ocmVmLCAnaWRMYW5nJywgaWRfbGFuZyk7XG5cblx0fSxcblxuXHRkZXRlY3RJRTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG5cblx0XHR2YXIgbXNpZSA9IHVhLmluZGV4T2YoJ01TSUUgJyk7XG5cdFx0aWYgKG1zaWUgPiAwKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKG1zaWUgKyA1LCB1YS5pbmRleE9mKCcuJywgbXNpZSkpLCAxMCk7XG5cdFx0fVxuXG5cdFx0dmFyIHRyaWRlbnQgPSB1YS5pbmRleE9mKCdUcmlkZW50LycpO1xuXHRcdGlmICh0cmlkZW50ID4gMCkge1xuXHRcdFx0dmFyIHJ2ID0gdWEuaW5kZXhPZigncnY6Jyk7XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKHJ2ICsgMywgdWEuaW5kZXhPZignLicsIHJ2KSksIDEwKTtcblx0XHR9XG5cblx0XHR2YXIgZWRnZSA9IHVhLmluZGV4T2YoJ0VkZ2UvJyk7XG5cdFx0aWYgKGVkZ2UgPiAwKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRhZGRVcmxQYXJhbTogZnVuY3Rpb24odXJsLCBwYXJhbSwgdmFsdWUpe1xuXHRcdHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpLCByZWdleCA9IC8oPzpcXD98JmFtcDt8JikrKFtePV0rKSg/Oj0oW14mXSopKSovZztcblx0XHR2YXIgbWF0Y2gsIHN0ciA9IFtdOyBhLmhyZWYgPSB1cmw7IHBhcmFtID0gZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtKTtcblxuXHRcdHdoaWxlIChtYXRjaCA9IHJlZ2V4LmV4ZWMoYS5zZWFyY2gpKXtcblx0XHRcdGlmIChwYXJhbSAhPSBtYXRjaFsxXSkgc3RyLnB1c2gobWF0Y2hbMV0rKG1hdGNoWzJdP1wiPVwiK21hdGNoWzJdOlwiXCIpKTtcblx0XHR9XG5cblx0XHRzdHIucHVzaChwYXJhbSsodmFsdWU/XCI9XCIrIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk6XCJcIikpO1xuXHRcdGEuc2VhcmNoID0gc3RyLmpvaW4oXCImXCIpO1xuXHRcdHJldHVybiBhLmhyZWY7XG5cdH0sXG5cblxuXG5cdGVucXVldWVUeXBvZ3JhcGh5Rm9udHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdHR5cG9ncmFwaHlTY2hlbWUgPSB0aGlzLnNjaGVtZXMuZ2V0U2NoZW1lKCAndHlwb2dyYXBoeScgKTtcblxuXHRcdF8uZWFjaCggdHlwb2dyYXBoeVNjaGVtZS5pdGVtcywgZnVuY3Rpb24oIGl0ZW0gKSB7XG5cdFx0XHRzZWxmLmhlbHBlcnMuZW5xdWV1ZUZvbnQoIGl0ZW0udmFsdWUuZm9udF9mYW1pbHkgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0dHJhbnNsYXRlOiBmdW5jdGlvbiggc3RyaW5nS2V5LCB0ZW1wbGF0ZUFyZ3MgKSB7XG5cdFx0dmFyIHN0cmluZyA9IHRoaXMuY29uZmlnLmkxOG5bIHN0cmluZ0tleSBdO1xuXG5cdFx0aWYgKCB1bmRlZmluZWQgPT09IHN0cmluZyApIHtcblx0XHRcdHN0cmluZyA9IHN0cmluZ0tleTtcblx0XHR9XG5cblx0XHRpZiAoIHRlbXBsYXRlQXJncyApIHtcblx0XHRcdHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKCAveyhcXGQrKX0vZywgZnVuY3Rpb24oIG1hdGNoLCBudW1iZXIgKSB7XG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQgIT09IHRlbXBsYXRlQXJnc1sgbnVtYmVyIF0gPyB0ZW1wbGF0ZUFyZ3NbIG51bWJlciBdIDogbWF0Y2g7XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHN0cmluZztcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICggd2luZG93LmVsZW1lbnRvciA9IG5ldyBBcHAoKSApLnN0YXJ0KCk7XG4iLCJ2YXIgRWRpdE1vZGVJdGVtVmlldztcblxuRWRpdE1vZGVJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLW1vZGUtc3dpdGNoZXItY29udGVudCcsXG5cblx0aWQ6ICdlbGVtZW50b3ItbW9kZS1zd2l0Y2hlci1pbm5lcicsXG5cblx0dWk6IHtcblx0XHRwcmV2aWV3QnV0dG9uOiAnI2VsZW1lbnRvci1tb2RlLXN3aXRjaGVyLXByZXZpZXctaW5wdXQnLFxuXHRcdHByZXZpZXdMYWJlbDogJyNlbGVtZW50b3ItbW9kZS1zd2l0Y2hlci1wcmV2aWV3Jyxcblx0XHRwcmV2aWV3TGFiZWxBMTF5OiAnI2VsZW1lbnRvci1tb2RlLXN3aXRjaGVyLXByZXZpZXcgLmVsZW1lbnRvci1zY3JlZW4tb25seSdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2hhbmdlIEB1aS5wcmV2aWV3QnV0dG9uJzogJ29uRWRpdE1vZGVDaGFuZ2UnXG5cdH0sXG5cblx0Z2V0Q3VycmVudE1vZGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnVpLnByZXZpZXdCdXR0b24uaXMoICc6Y2hlY2tlZCcgKSA/ICdwcmV2aWV3JyA6ICdlZGl0Jztcblx0fSxcblxuXHRzZXRNb2RlOiBmdW5jdGlvbiggbW9kZSApIHtcblx0XHR0aGlzLnVpLnByZXZpZXdCdXR0b24ucHJvcCggJ2NoZWNrZWQnLCAncHJldmlldycgPT09IG1vZGUgKTtcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vbkVkaXRNb2RlQ2hhbmdlKCk7XG5cdH0sXG5cblx0b25FZGl0TW9kZUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRhdGFFZGl0TW9kZSA9IGVsZW1lbnRvci5jaGFubmVscy5kYXRhRWRpdE1vZGUsXG5cdFx0XHRvbGRFZGl0TW9kZSA9IGRhdGFFZGl0TW9kZS5yZXF1ZXN0KCAnYWN0aXZlTW9kZScgKSxcblx0XHRcdGN1cnJlbnRNb2RlID0gdGhpcy5nZXRDdXJyZW50TW9kZSgpO1xuXG5cdFx0ZGF0YUVkaXRNb2RlLnJlcGx5KCAnYWN0aXZlTW9kZScsIGN1cnJlbnRNb2RlICk7XG5cblx0XHRpZiAoIGN1cnJlbnRNb2RlICE9PSBvbGRFZGl0TW9kZSApIHtcblx0XHRcdGRhdGFFZGl0TW9kZS50cmlnZ2VyKCAnc3dpdGNoJyApO1xuXG5cdFx0XHR2YXIgdGl0bGUgPSAncHJldmlldycgPT09IGN1cnJlbnRNb2RlID8gJ0JhY2sgdG8gRWRpdG9yJyA6ICdQcmV2aWV3JztcblxuXHRcdFx0dGhpcy51aS5wcmV2aWV3TGFiZWwuYXR0ciggJ3RpdGxlJywgdGl0bGUgKTtcblx0XHRcdHRoaXMudWkucHJldmlld0xhYmVsQTExeS50ZXh0KCB0aXRsZSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRNb2RlSXRlbVZpZXc7XG4iLCJ2YXIgUGFuZWxGb290ZXJJdGVtVmlldztcblxuUGFuZWxGb290ZXJJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLWZvb3Rlci1jb250ZW50JyxcblxuXHR0YWdOYW1lOiAnbmF2JyxcblxuXHRpZDogJ2VsZW1lbnRvci1wYW5lbC1mb290ZXItdG9vbHMnLFxuXG5cdHBvc3NpYmxlUm90YXRlTW9kZXM6IFsgJ3BvcnRyYWl0JywgJ2xhbmRzY2FwZScgXSxcblxuXHR1aToge1xuXHRcdG1lbnVCdXR0b25zOiAnLmVsZW1lbnRvci1wYW5lbC1mb290ZXItdG9vbCcsXG5cdFx0ZGV2aWNlTW9kZUljb246ICcjZWxlbWVudG9yLXBhbmVsLWZvb3Rlci1yZXNwb25zaXZlID4gaScsXG5cdFx0ZGV2aWNlTW9kZUJ1dHRvbnM6ICcjZWxlbWVudG9yLXBhbmVsLWZvb3Rlci1yZXNwb25zaXZlIC5lbGVtZW50b3ItcGFuZWwtZm9vdGVyLXN1Yi1tZW51LWl0ZW0nLFxuXHRcdGJ1dHRvblNhdmU6ICcjZWxlbWVudG9yLXBhbmVsLWZvb3Rlci1zYXZlJyxcblx0XHRidXR0b25TYXZlQnV0dG9uOiAnI2VsZW1lbnRvci1wYW5lbC1mb290ZXItc2F2ZSAuZWxlbWVudG9yLWJ0bicsXG5cdFx0YnV0dG9uUHVibGlzaDogJyNlbGVtZW50b3ItcGFuZWwtZm9vdGVyLXB1Ymxpc2gnLFxuXHRcdHdhdGNoVHV0b3JpYWw6ICcjZWxlbWVudG9yLXBhbmVsLWZvb3Rlci13YXRjaC10dXRvcmlhbCcsXG5cdFx0c2hvd1RlbXBsYXRlczogJyNlbGVtZW50b3ItcGFuZWwtZm9vdGVyLXRlbXBsYXRlcy1tb2RhbCcsXG5cdFx0c2F2ZVRlbXBsYXRlOiAnI2VsZW1lbnRvci1wYW5lbC1mb290ZXItc2F2ZS10ZW1wbGF0ZScsXG5cdFx0YnV0dG9uR29CYWNrb2ZmaWNlOiAnI2VsZW1lbnRvci1wYW5lbC1mb290ZXItdmlldy1lZGl0LXBhZ2UnLFxuXHR9LFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayBAdWkuZGV2aWNlTW9kZUJ1dHRvbnMnOiAnb25DbGlja1Jlc3BvbnNpdmVCdXR0b25zJyxcblx0XHQnY2xpY2sgQHVpLmJ1dHRvblNhdmUnOiAnb25DbGlja0J1dHRvblNhdmUnLFxuXHRcdCdjbGljayBAdWkuYnV0dG9uUHVibGlzaCc6ICdvbkNsaWNrQnV0dG9uUHVibGlzaCcsXG5cdFx0J2NsaWNrIEB1aS53YXRjaFR1dG9yaWFsJzogJ29uQ2xpY2tXYXRjaFR1dG9yaWFsJyxcblx0XHQnY2xpY2sgQHVpLnNob3dUZW1wbGF0ZXMnOiAnb25DbGlja1Nob3dUZW1wbGF0ZXMnLFxuXHRcdCdjbGljayBAdWkuYnV0dG9uR29CYWNrb2ZmaWNlJzogJ29uQ2xpY2tCdXR0b25Hb0JhY2tvZmZpY2UnLFxuXHRcdCdjbGljayBAdWkuc2F2ZVRlbXBsYXRlJzogJ29uQ2xpY2tTYXZlVGVtcGxhdGUnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5faW5pdERpYWxvZygpO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggZWxlbWVudG9yLmNoYW5uZWxzLmVkaXRvciwgJ2VkaXRvcjpjaGFuZ2VkJywgdGhpcy5vbkVkaXRvckNoYW5nZWQgKVxuXHRcdFx0Lmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSwgJ2NoYW5nZScsIHRoaXMub25EZXZpY2VNb2RlQ2hhbmdlICk7XG5cdH0sXG5cblx0X2luaXREaWFsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkaWFsb2c7XG5cblx0XHR0aGlzLmdldERpYWxvZyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCAhIGRpYWxvZyApIHtcblx0XHRcdFx0dmFyICQgPSBCYWNrYm9uZS4kLFxuXHRcdFx0XHRcdCRkaWFsb2dNZXNzYWdlID0gJCggJzxkaXY+Jywge1xuXHRcdFx0XHRcdFx0J2NsYXNzJzogJ2VsZW1lbnRvci1kaWFsb2ctbWVzc2FnZSdcblx0XHRcdFx0XHR9ICksXG5cdFx0XHRcdFx0JG1lc3NhZ2VJY29uID0gJCggJzxpPicsIHtcblx0XHRcdFx0XHRcdCdjbGFzcyc6ICdmYSBmYS1jaGVjay1jaXJjbGUnXG5cdFx0XHRcdFx0fSApLFxuXHRcdFx0XHRcdCRtZXNzYWdlVGV4dCA9ICQoICc8ZGl2PicsIHtcblx0XHRcdFx0XHRcdCdjbGFzcyc6ICdlbGVtZW50b3ItZGlhbG9nLW1lc3NhZ2UtdGV4dCdcblx0XHRcdFx0XHR9ICkudGV4dCggZWxlbWVudG9yLnRyYW5zbGF0ZSggJ3NhdmVkJyApICk7XG5cblx0XHRcdFx0JGRpYWxvZ01lc3NhZ2UuYXBwZW5kKCAkbWVzc2FnZUljb24sICRtZXNzYWdlVGV4dCApO1xuXG5cdFx0XHRcdGRpYWxvZyA9IGVsZW1lbnRvci5kaWFsb2dzTWFuYWdlci5jcmVhdGVXaWRnZXQoICdwb3B1cCcsIHtcblx0XHRcdFx0XHRoaWRlOiB7XG5cdFx0XHRcdFx0XHRkZWxheTogMTUwMFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdGRpYWxvZy5zZXRNZXNzYWdlKCAkZGlhbG9nTWVzc2FnZSApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdH07XG5cdH0sXG5cblx0X3B1Ymxpc2hCdWlsZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR2YXIgb3B0aW9ucyA9IHtcblx0XHRcdHJldmlzaW9uOiAncHVibGlzaCcsXG5cdFx0XHRvblN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLmdldERpYWxvZygpLnNob3coKTtcblxuXHRcdFx0XHRzZWxmLnVpLmJ1dHRvblNhdmVCdXR0b24ucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItYnRuLXN0YXRlJyApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRzZWxmLnVpLmJ1dHRvblNhdmVCdXR0b24uYWRkQ2xhc3MoICdlbGVtZW50b3ItYnRuLXN0YXRlJyApO1xuXG5cdFx0ZWxlbWVudG9yLnNhdmVCdWlsZGVyKCBvcHRpb25zICk7XG5cdH0sXG5cblx0X3NhdmVCdWlsZGVyRHJhZnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zYXZlQnVpbGRlcigpO1xuXHR9LFxuXG5cdGdldERldmljZU1vZGVCdXR0b246IGZ1bmN0aW9uKCBkZXZpY2VNb2RlICkge1xuXHRcdHJldHVybiB0aGlzLnVpLmRldmljZU1vZGVCdXR0b25zLmZpbHRlciggJ1tkYXRhLWRldmljZS1tb2RlPVwiJyArIGRldmljZU1vZGUgKyAnXCJdJyApO1xuXHR9LFxuXG5cdG9uUGFuZWxDbGljazogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkdGFyZ2V0ID0gQmFja2JvbmUuJCggZXZlbnQudGFyZ2V0ICksXG5cdFx0XHRpc0NsaWNrSW5zaWRlT2ZUb29sID0gJHRhcmdldC5jbG9zZXN0KCAnLmVsZW1lbnRvci1wYW5lbC1mb290ZXItc3ViLW1lbnUtd3JhcHBlcicgKS5sZW5ndGg7XG5cblx0XHRpZiAoIGlzQ2xpY2tJbnNpZGVPZlRvb2wgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyICR0b29sID0gJHRhcmdldC5jbG9zZXN0KCAnLmVsZW1lbnRvci1wYW5lbC1mb290ZXItdG9vbCcgKSxcblx0XHRcdGlzQ2xvc2VkVG9vbCA9ICR0b29sLmxlbmd0aCAmJiAhICR0b29sLmhhc0NsYXNzKCAnZWxlbWVudG9yLW9wZW4nICk7XG5cblx0XHR0aGlzLnVpLm1lbnVCdXR0b25zLnJlbW92ZUNsYXNzKCAnZWxlbWVudG9yLW9wZW4nICk7XG5cblx0XHRpZiAoIGlzQ2xvc2VkVG9vbCApIHtcblx0XHRcdCR0b29sLmFkZENsYXNzKCAnZWxlbWVudG9yLW9wZW4nICk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uRWRpdG9yQ2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5idXR0b25TYXZlLnRvZ2dsZUNsYXNzKCAnZWxlbWVudG9yLXNhdmUtYWN0aXZlJywgZWxlbWVudG9yLmlzRWRpdG9yQ2hhbmdlZCgpICk7XG5cdH0sXG5cblx0b25EZXZpY2VNb2RlQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcHJldmlvdXNEZXZpY2VNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGUucmVxdWVzdCggJ3ByZXZpb3VzTW9kZScgKSxcblx0XHRcdGN1cnJlbnREZXZpY2VNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGUucmVxdWVzdCggJ2N1cnJlbnRNb2RlJyApO1xuXG5cdFx0dGhpcy5nZXREZXZpY2VNb2RlQnV0dG9uKCBwcmV2aW91c0RldmljZU1vZGUgKS5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblxuXHRcdHRoaXMuZ2V0RGV2aWNlTW9kZUJ1dHRvbiggY3VycmVudERldmljZU1vZGUgKS5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblxuXHRcdC8vIENoYW5nZSB0aGUgZm9vdGVyIGljb25cblx0XHR0aGlzLnVpLmRldmljZU1vZGVJY29uLnJlbW92ZUNsYXNzKCAnZWljb24tZGV2aWNlLScgKyBwcmV2aW91c0RldmljZU1vZGUgKS5hZGRDbGFzcyggJ2VpY29uLWRldmljZS0nICsgY3VycmVudERldmljZU1vZGUgKTtcblx0fSxcblxuXHRvbkNsaWNrQnV0dG9uU2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fcHVibGlzaEJ1aWxkZXIoKTtcblx0fSxcblxuXHRvbkNsaWNrQnV0dG9uUHVibGlzaDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdC8vIFByZXZlbnQgY2xpY2sgb24gc2F2ZSBidXR0b25cblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHRoaXMuX3B1Ymxpc2hCdWlsZGVyKCk7XG5cdH0sXG5cblx0b25DbGlja1Jlc3BvbnNpdmVCdXR0b25zOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyICRjbGlja2VkQnV0dG9uID0gdGhpcy4kKCBldmVudC5jdXJyZW50VGFyZ2V0ICksXG5cdFx0XHRuZXdEZXZpY2VNb2RlID0gJGNsaWNrZWRCdXR0b24uZGF0YSggJ2RldmljZS1tb2RlJyApO1xuXG5cdFx0ZWxlbWVudG9yLmNoYW5nZURldmljZU1vZGUoIG5ld0RldmljZU1vZGUgKTtcblx0fSxcblxuXHRvbkNsaWNrV2F0Y2hUdXRvcmlhbDogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLmludHJvZHVjdGlvbi5zdGFydEludHJvZHVjdGlvbigpO1xuXHR9LFxuXG5cdG9uQ2xpY2tTaG93VGVtcGxhdGVzOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnN0YXJ0TW9kYWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zaG93VGVtcGxhdGVzKCk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdG9uQ2xpY2tTYXZlVGVtcGxhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc3RhcnRNb2RhbCggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3IudGVtcGxhdGVzLmdldExheW91dCgpLnNob3dTYXZlVGVtcGxhdGVWaWV3KCk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdG9uQ2xpY2tCdXR0b25Hb0JhY2tvZmZpY2U6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0d2luZG93LmxvY2F0aW9uID0gZWxlbWVudG9yLmNvbmZpZy5lZGl0X3Bvc3RfbGluaztcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0Xy5kZWZlciggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuJGVsLm9uKCAnY2xpY2snLCBfLmJpbmQoIHNlbGYub25QYW5lbENsaWNrLCBzZWxmICkgKTtcblx0XHR9ICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEZvb3Rlckl0ZW1WaWV3O1xuIiwidmFyIFBhbmVsSGVhZGVySXRlbVZpZXc7XG5cblBhbmVsSGVhZGVySXRlbVZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1wYW5lbC1oZWFkZXInLFxuXG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLWhlYWRlcicsXG5cblx0dWk6IHtcblx0XHRtZW51QnV0dG9uOiAnI2VsZW1lbnRvci1wYW5lbC1oZWFkZXItbWVudS1idXR0b24nLFxuXHRcdHRpdGxlOiAnI2VsZW1lbnRvci1wYW5lbC1oZWFkZXItdGl0bGUnLFxuXHRcdGFkZEJ1dHRvbjogJyNlbGVtZW50b3ItcGFuZWwtaGVhZGVyLWFkZC1idXR0b24nXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5hZGRCdXR0b24nOiAnb25DbGlja0FkZCcsXG5cdFx0J2NsaWNrIEB1aS5tZW51QnV0dG9uJzogJ29uQ2xpY2tNZW51J1xuXHR9LFxuXG5cdHNldFRpdGxlOiBmdW5jdGlvbiggdGl0bGUgKSB7XG5cdFx0dGhpcy51aS50aXRsZS5odG1sKCB0aXRsZSApO1xuXHR9LFxuXG5cdG9uQ2xpY2tBZGQ6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5nZXRQYW5lbFZpZXcoKS5zZXRQYWdlKCAnZWxlbWVudHMnICk7XG5cdH0sXG5cblx0b25DbGlja01lbnU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYW5lbCA9IGVsZW1lbnRvci5nZXRQYW5lbFZpZXcoKSxcblx0XHRcdGN1cnJlbnRQYW5lbFBhZ2VOYW1lID0gcGFuZWwuZ2V0Q3VycmVudFBhZ2VOYW1lKCksXG5cdFx0XHRuZXh0UGFnZSA9ICdtZW51JyA9PT0gY3VycmVudFBhbmVsUGFnZU5hbWUgPyAnZWxlbWVudHMnIDogJ21lbnUnO1xuXG5cdFx0cGFuZWwuc2V0UGFnZSggbmV4dFBhZ2UgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsSGVhZGVySXRlbVZpZXc7XG4iLCJ2YXIgSW5uZXJUYWJzQmVoYXZpb3IgPSByZXF1aXJlKCcuLi8uLi8uLi9iZWhhdmlvcnMvdGFicycpO1xuXG52YXIgRWRpdG9yQ29tcG9zaXRlVmlldyA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lZGl0b3ItY29udGVudCcgKSxcblxuXHRpZDogJ2VsZW1lbnRvci1wYW5lbC1wYWdlLWVkaXRvcicsXG5cblx0Y2xhc3Nlczoge1xuXHRcdHBvcG92ZXI6ICdlbGVtZW50b3ItY29udHJvbHMtcG9wb3Zlcidcblx0fSxcblxuXHRiZWhhdmlvcnM6IHtcblx0XHRIYW5kbGVJbm5lclRhYnM6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IElubmVyVGFic0JlaGF2aW9yXG5cdFx0fVxuXHR9LFxuXG5cdHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGVsZW1lbnREYXRhOiBlbGVtZW50b3IuZ2V0RWxlbWVudERhdGEoIHRoaXMubW9kZWwgKVxuXHRcdH07XG5cdH0sXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnZGl2LmVsZW1lbnRvci1jb250cm9scycsXG5cblx0bW9kZWxFdmVudHM6IHtcblx0XHQnZGVzdHJveSc6ICdvbk1vZGVsRGVzdHJveSdcblx0fSxcblxuXHR1aToge1xuXHRcdCd0YWJzJzogJy5lbGVtZW50b3ItdGFicy1jb250cm9scyBsaSdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgQHVpLnRhYnMgYSc6ICdvbkNsaWNrVGFiQ29udHJvbCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSwgJ2NoYW5nZScsIHRoaXMub25EZXZpY2VNb2RlQ2hhbmdlICk7XG5cdH0sXG5cblx0Z2V0Q2hpbGRWaWV3OiBmdW5jdGlvbiggaXRlbSApIHtcblx0XHR2YXIgY29udHJvbFR5cGUgPSBpdGVtLmdldCggJ3R5cGUnICk7XG5cdFx0cmV0dXJuIGVsZW1lbnRvci5nZXRDb250cm9sSXRlbVZpZXcoIGNvbnRyb2xUeXBlICk7XG5cdH0sXG5cblx0Y2hpbGRWaWV3T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGVsZW1lbnRTZXR0aW5nc01vZGVsOiB0aGlzLm1vZGVsLmdldCggJ3NldHRpbmdzJyApLFxuXHRcdFx0ZWxlbWVudEVkaXRTZXR0aW5nczogdGhpcy5tb2RlbC5nZXQoICdlZGl0U2V0dGluZ3MnIClcblx0XHR9O1xuXHR9LFxuXG5cdG9uRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nZXRPcHRpb24oICdlZGl0ZWRFbGVtZW50VmlldycgKS4kZWwucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZWxlbWVudC1lZGl0YWJsZScgKTtcblx0XHR0aGlzLm1vZGVsLnRyaWdnZXIoICdlZGl0b3I6Y2xvc2UnICk7XG5cblx0XHR0aGlzLnRyaWdnZXJNZXRob2QoICdlZGl0b3I6ZGVzdHJveScgKTtcblx0fSxcblxuXHRvbkJlZm9yZVJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRyb2xzID0gZWxlbWVudG9yLmdldEVsZW1lbnRDb250cm9scyggdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSApO1xuXG5cdFx0aWYgKCAhIGNvbnRyb2xzICkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCAnRWRpdG9yIGNvbnRyb2xzIG5vdCBmb3VuZCcgKTtcblx0XHR9XG5cblx0XHQvLyBDcmVhdGUgbmV3IGluc3RhbmNlIG9mIHRoYXQgY29sbGVjdGlvblxuXHRcdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCBjb250cm9scyApO1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldE9wdGlvbiggJ2VkaXRlZEVsZW1lbnRWaWV3JyApLiRlbC5hZGRDbGFzcyggJ2VsZW1lbnRvci1lbGVtZW50LWVkaXRhYmxlJyApO1xuXG5cdFx0Ly8gV3JhcCBzZWN0aW9uIGNvbnRyb2xzIGluIGEgY29udGFpbmVyXG5cdFx0dGhpcy53cmFwU2VjdGlvbnNDb250cm9scygpO1xuXG5cdFx0Ly8gSGFuZGxlIHBvcG92ZXJzXG5cdFx0dGhpcy5oYW5kbGVQb3BvdmVycygpO1xuXG5cdFx0Ly8gU2V0IHRoZSBmaXJzdCB0YWIgYXMgYWN0aXZlXG5cdFx0dGhpcy51aS50YWJzLmVxKCAwICkuZmluZCggJ2EnICkudHJpZ2dlciggJ2NsaWNrJyApO1xuXG5cdFx0Ly8gQ3JlYXRlIHRvb2x0aXAgb24gY29udHJvbHNcblx0XHR0aGlzLiQoICcudG9vbHRpcC10YXJnZXQnICkudGlwc3koIHtcblx0XHRcdGdyYXZpdHk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBgbmAgZm9yIGRvd24sIGBzYCBmb3IgdXBcblx0XHRcdFx0dmFyIGdyYXZpdHkgPSBCYWNrYm9uZS4kKCB0aGlzICkuZGF0YSggJ3Rvb2x0aXAtcG9zJyApO1xuXG5cdFx0XHRcdGlmICggdW5kZWZpbmVkICE9PSBncmF2aXR5ICkge1xuXHRcdFx0XHRcdHJldHVybiBncmF2aXR5O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiAnbic7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0aXRsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZSggJ2RhdGEtdG9vbHRpcCcgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fSxcblxuXHR3cmFwU2VjdGlvbnNDb250cm9sczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyICRjb250cm9sc0NvbnRhaW5lciA9IHRoaXMuJCggJ2Rpdi5lbGVtZW50b3ItY29udHJvbHMnICksXG5cdFx0XHQkc2VjdGlvbnMgPSAkY29udHJvbHNDb250YWluZXIuZmluZCggJz4gLmVsZW1lbnRvci1jb250cm9sLXR5cGUtc2VjdGlvbicgKTtcblxuXHRcdCRzZWN0aW9ucy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciAkc2VjdGlvbiA9IEJhY2tib25lLiQoIHRoaXMgKSxcblx0XHRcdFx0c2VjdGlvbk5hbWUgPSAkc2VjdGlvbi5maW5kKCAnW2RhdGEtY29sbGFwc2VfaWRdJyApLmRhdGEoICdjb2xsYXBzZV9pZCcgKSxcblx0XHRcdFx0JHdyYXBwZXIgPSBCYWNrYm9uZS4kKCAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1zZWN0aW9uLXdyYXBwZXIgZWxlbWVudG9yLXNlY3Rpb24td3JhcHBlci0nICsgc2VjdGlvbk5hbWUgKyAnXCI+PC9kaXY+JyApLFxuXHRcdFx0XHQkaGVhZGVyID0gQmFja2JvbmUuJCggJzxkaXYgY2xhc3M9XCJlbGVtZW50b3Itc2VjdGlvbi1oZWFkZXJcIj48L2Rpdj4nICksXG5cdFx0XHRcdCRjb250ZW50ID0gQmFja2JvbmUuJCggJzxkaXYgY2xhc3M9XCJlbGVtZW50b3Itc2VjdGlvbi1jb250ZW50XCI+PC9kaXY+JyApLFxuXHRcdFx0XHQkbmV4dENvbnRyb2xzID0gJHNlY3Rpb24ubmV4dFVudGlsKCAnLmVsZW1lbnRvci1jb250cm9sLXR5cGUtc2VjdGlvbicgKTtcblxuXHRcdFx0Ly8gSW5zZXJ0IHdyYXBwZXIgYmVmb3JlIHRoZSBzZWN0aW9uXG5cdFx0XHQkc2VjdGlvbi5iZWZvcmUoICR3cmFwcGVyICk7XG5cblx0XHRcdC8vIEJ1aWxkIHRoZSBzdHJ1Y3R1cmU6IHdyYXBwZXIgPiBoZWFkZXIgKyBjb250ZW50XG5cdFx0XHQkaGVhZGVyLmFwcGVuZCggJHNlY3Rpb24gKTtcblx0XHRcdCRjb250ZW50LmFwcGVuZCggJG5leHRDb250cm9scyApO1xuXHRcdFx0JHdyYXBwZXIuYXBwZW5kKCAkaGVhZGVyICk7XG5cdFx0XHQkd3JhcHBlci5hcHBlbmQoICRjb250ZW50ICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIYW5kbGUgcG9wb3ZlcnMuXG5cdCAqXG5cdCAqIEdyb3VwcyBjb250cm9scyB0aGF0IGJlbG9uZyB0byBhIHBvcG92ZXIgaW50byBhIGNvbnRhaW5lciBkaXYuXG5cdCAqL1xuXHRoYW5kbGVQb3BvdmVyczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0cG9wb3ZlclN0YXJ0ZWQgPSBmYWxzZSxcblx0XHRcdCRwb3BvdmVyO1xuXG5cdFx0c2VsZi5yZW1vdmVQb3BvdmVycygpO1xuXG5cdFx0c2VsZi5jaGlsZHJlbi5lYWNoKCBmdW5jdGlvbiggY2hpbGQgKSB7XG5cdFx0XHRpZiAoIHBvcG92ZXJTdGFydGVkICkge1xuXHRcdFx0XHQkcG9wb3Zlci5hcHBlbmQoIGNoaWxkLiRlbCApO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcG9wb3ZlciA9IGNoaWxkLm1vZGVsLmdldCggJ3BvcG92ZXInICk7XG5cblx0XHRcdGlmICggISBwb3BvdmVyICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggcG9wb3Zlci5zdGFydCApIHtcblx0XHRcdFx0cG9wb3ZlclN0YXJ0ZWQgPSB0cnVlO1xuXHRcdFx0XHQkcG9wb3ZlciA9IEJhY2tib25lLiQoICc8ZGl2PicsIHtcblx0XHRcdFx0XHQnY2xhc3MnOiBzZWxmLmNsYXNzZXMucG9wb3ZlclxuXHRcdFx0XHR9ICk7XG5cdFx0XHRcdGNoaWxkLiRlbC5iZWZvcmUoICRwb3BvdmVyICk7XG5cdFx0XHRcdCRwb3BvdmVyLmFwcGVuZCggY2hpbGQuJGVsICk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggcG9wb3Zlci5lbmQgKSB7XG5cdFx0XHRcdHBvcG92ZXJTdGFydGVkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgcG9wb3ZlcnMuXG5cdCAqXG5cdCAqIFJlbW92ZXMgYWxsIHBvcG92ZXIgY29udGFpbmVycyBmcm9tIHRoZSBET00uXG5cdCAqL1xuXHRyZW1vdmVQb3BvdmVyczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuZmluZCggJy4nICsgdGhpcy5jbGFzc2VzLnBvcG92ZXIgKS5yZW1vdmUoKTtcblx0fSxcblxuXHRvbk1vZGVsRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cm95KCk7XG5cdH0sXG5cblx0b25DbGlja1RhYkNvbnRyb2w6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dmFyICR0aGlzVGFiID0gdGhpcy4kKCBldmVudC50YXJnZXQgKTtcblxuXHRcdHRoaXMudWkudGFicy5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHQkdGhpc1RhYi5jbG9zZXN0KCAnbGknICkuYWRkQ2xhc3MoICdhY3RpdmUnICk7XG5cblx0XHR0aGlzLm1vZGVsLmdldCggJ3NldHRpbmdzJyApLnRyaWdnZXIoICdjb250cm9sOnN3aXRjaDp0YWInLCAkdGhpc1RhYi5kYXRhKCAndGFiJyApICk7XG5cblx0XHR0aGlzLm9wZW5GaXJzdFNlY3Rpb25JbkN1cnJlbnRUYWIoICR0aGlzVGFiLmRhdGEoICd0YWInICkgKTtcblx0fSxcblxuXHRvbkRldmljZU1vZGVDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHNlbGYuJGVsLnJlbW92ZUNsYXNzKCAnZWxlbWVudG9yLXJlc3BvbnNpdmUtc3dpdGNoZXJzLW9wZW4nICk7XG5cblx0XHQvLyBUaW1lb3V0IGFjY29yZGluZyB0byBwcmV2aWV3IHJlc2l6ZSBjc3MgYW5pbWF0aW9uIGR1cmF0aW9uXG5cdFx0c2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3IuJHByZXZpZXdDb250ZW50cy5maW5kKCAnaHRtbCwgYm9keScgKS5hbmltYXRlKCB7XG5cdFx0XHRcdHNjcm9sbFRvcDogc2VsZi5nZXRPcHRpb24oICdlZGl0ZWRFbGVtZW50VmlldycgKS4kZWwub2Zmc2V0KCkudG9wIC0gZWxlbWVudG9yLiRwcmV2aWV3WzBdLmNvbnRlbnRXaW5kb3cuaW5uZXJIZWlnaHQgLyAyXG5cdFx0XHR9ICk7XG5cdFx0fSwgNTAwICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE9wZW5zIHRoZSBmaXJzdCBzZWN0aW9uIGluIHRoZSBjdXJyZW50IHRhYi5cblx0ICovXG5cdG9wZW5GaXJzdFNlY3Rpb25JbkN1cnJlbnRUYWI6IGZ1bmN0aW9uKCBjdXJyZW50VGFiICkge1xuXHRcdHZhciBvcGVuZWRDbGFzcyA9ICdlbGVtZW50b3Itb3BlbicsXG5cdFx0XHRzZWxmID0gdGhpcyxcblxuXHRcdFx0Zmlyc3RTZWN0aW9uQ29udHJvbFZpZXcgPSB0aGlzLmNoaWxkcmVuLmZpbHRlciggZnVuY3Rpb24oIHZpZXcgKSB7XG5cdFx0XHRcdHJldHVybiAoICdzZWN0aW9uJyA9PT0gdmlldy5tb2RlbC5nZXQoICd0eXBlJyApICkgJiYgKCBjdXJyZW50VGFiID09PSB2aWV3Lm1vZGVsLmdldCggJ3RhYicgKSApO1xuXHRcdFx0fSApO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgZm91bmQgYW55IHNlY3Rpb24gY29udHJvbHNcblx0XHRpZiAoIF8uaXNFbXB0eSggZmlyc3RTZWN0aW9uQ29udHJvbFZpZXcgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBDbG9zZSBhbGwgc2VjdGlvbnMgZmlyc3Rcblx0XHRzZWxmLiQoICcuZWxlbWVudG9yLXNlY3Rpb24td3JhcHBlcicgKS5yZW1vdmVDbGFzcyggb3BlbmVkQ2xhc3MgKTtcblx0XHRzZWxmLiQoICcuZWxlbWVudG9yLWNvbnRyb2wuZWxlbWVudG9yLWNvbnRyb2wtdHlwZS1zZWN0aW9uIC5lbGVtZW50b3ItcGFuZWwtaGVhZGluZycgKS5yZW1vdmVDbGFzcyggb3BlbmVkQ2xhc3MgKTtcblxuXHRcdC8vIE9wZW4gdGhlIGZpcnN0IHNlY3Rpb25cblx0XHRmaXJzdFNlY3Rpb25Db250cm9sVmlldyA9IGZpcnN0U2VjdGlvbkNvbnRyb2xWaWV3WzBdO1xuXHRcdGZpcnN0U2VjdGlvbkNvbnRyb2xWaWV3LnVpLmhlYWRpbmcuYWRkQ2xhc3MoIG9wZW5lZENsYXNzICk7XG5cdFx0Zmlyc3RTZWN0aW9uQ29udHJvbFZpZXcuJGVsLmNsb3Nlc3QoICcuZWxlbWVudG9yLXNlY3Rpb24td3JhcHBlcicgKS5hZGRDbGFzcyggb3BlbmVkQ2xhc3MgKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld0NvbnRyb2xTZWN0aW9uQ2xpY2tlZDogZnVuY3Rpb24oIGNoaWxkVmlldyApIHtcblx0XHR2YXIgb3BlbmVkQ2xhc3MgPSAnZWxlbWVudG9yLW9wZW4nLFxuXHRcdFx0JHdyYXBwZXIgPSBjaGlsZFZpZXcuJGVsLmNsb3Nlc3QoICcuZWxlbWVudG9yLXNlY3Rpb24td3JhcHBlcicgKSxcblx0XHRcdGlzU2VjdGlvbk9wZW4gPSAkd3JhcHBlci5oYXNDbGFzcyggb3BlbmVkQ2xhc3MgKTtcblxuXHRcdC8vIENsb3NlIGFsbCBzZWN0aW9uc1xuXHRcdHRoaXMuJCggJy5lbGVtZW50b3Itc2VjdGlvbi13cmFwcGVyJyApLnJlbW92ZUNsYXNzKCBvcGVuZWRDbGFzcyApO1xuXHRcdHRoaXMuJCggJy5lbGVtZW50b3ItY29udHJvbC5lbGVtZW50b3ItY29udHJvbC10eXBlLXNlY3Rpb24gLmVsZW1lbnRvci1wYW5lbC1oZWFkaW5nJyApLnJlbW92ZUNsYXNzKCBvcGVuZWRDbGFzcyApO1xuXG5cdFx0Ly8gSWYgdGhlIGNsaWNrZWQgc2VjdGlvbiB3YXMgbm90IG9wZW4sIG9wZW4gaXRcblx0XHRpZiAoICEgaXNTZWN0aW9uT3BlbiApIHtcblx0XHRcdGNoaWxkVmlldy51aS5oZWFkaW5nLmFkZENsYXNzKCBvcGVuZWRDbGFzcyApO1xuXHRcdFx0JHdyYXBwZXIuYWRkQ2xhc3MoIG9wZW5lZENsYXNzICk7XG5cdFx0fVxuXG5cdFx0ZWxlbWVudG9yLmNoYW5uZWxzLmRhdGEudHJpZ2dlciggJ3Njcm9sbGJhcjp1cGRhdGUnICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3JDb21wb3NpdGVWaWV3O1xuIiwidmFyIFBhbmVsRWxlbWVudHNDYXRlZ29yeSA9IHJlcXVpcmUoICcuLi9tb2RlbHMvZWxlbWVudCcgKSxcblx0UGFuZWxFbGVtZW50c0NhdGVnb3JpZXNDb2xsZWN0aW9uO1xuXG5QYW5lbEVsZW1lbnRzQ2F0ZWdvcmllc0NvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRtb2RlbDogUGFuZWxFbGVtZW50c0NhdGVnb3J5XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c0NhdGVnb3JpZXNDb2xsZWN0aW9uO1xuIiwidmFyIFBhbmVsRWxlbWVudHNFbGVtZW50TW9kZWwgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2VsZW1lbnQnICksXG5cdFBhbmVsRWxlbWVudHNFbGVtZW50c0NvbGxlY3Rpb247XG5cblBhbmVsRWxlbWVudHNFbGVtZW50c0NvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRtb2RlbDogUGFuZWxFbGVtZW50c0VsZW1lbnRNb2RlbC8qLFxuXHRjb21wYXJhdG9yOiAndGl0bGUnKi9cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEVsZW1lbnRzRWxlbWVudHNDb2xsZWN0aW9uO1xuIiwidmFyIFBhbmVsRWxlbWVudHNDYXRlZ29yaWVzQ29sbGVjdGlvbiA9IHJlcXVpcmUoICcuL2NvbGxlY3Rpb25zL2NhdGVnb3JpZXMnICksXG5cdFBhbmVsRWxlbWVudHNFbGVtZW50c0NvbGxlY3Rpb24gPSByZXF1aXJlKCAnLi9jb2xsZWN0aW9ucy9lbGVtZW50cycgKSxcblx0UGFuZWxFbGVtZW50c0NhdGVnb3JpZXNWaWV3ID0gcmVxdWlyZSggJy4vdmlld3MvY2F0ZWdvcmllcycgKSxcblx0UGFuZWxFbGVtZW50c0VsZW1lbnRzVmlldyA9IHJlcXVpcmUoICcuL3ZpZXdzL2VsZW1lbnRzJyApLFxuXHRQYW5lbEVsZW1lbnRzU2VhcmNoVmlldyA9IHJlcXVpcmUoICcuL3ZpZXdzL3NlYXJjaCcgKSxcblx0UGFuZWxFbGVtZW50c0xhbmd1YWdlc2VsZWN0b3JWaWV3ID0gcmVxdWlyZSggJy4vdmlld3MvbGFuZ3VhZ2VzZWxlY3RvcicgKSxcblx0UGFuZWxFbGVtZW50c0xheW91dFZpZXc7XG5cblBhbmVsRWxlbWVudHNMYXlvdXRWaWV3ID0gTWFyaW9uZXR0ZS5MYXlvdXRWaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1wYW5lbC1lbGVtZW50cycsXG5cblx0cmVnaW9uczoge1xuXHRcdGVsZW1lbnRzOiAnI2VsZW1lbnRvci1wYW5lbC1lbGVtZW50cy13cmFwcGVyJyxcblx0XHRzZWFyY2g6ICcjZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzLXNlYXJjaC1hcmVhJyxcblx0XHRsYW5ndWFnZXNlbGVjdG9yOiAnI2VsZW1lbnRvci1wYW5lbC1lbGVtZW50cy1sYW5ndWFnZXNlbGVjdG9yLWFyZWEnXG5cdH0sXG5cblx0ZWxlbWVudHNDb2xsZWN0aW9uOiBudWxsLFxuXG5cdGNhdGVnb3JpZXNDb2xsZWN0aW9uOiBudWxsLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5wYW5lbEVsZW1lbnRzLCAnZWxlbWVudDpzZWxlY3RlZCcsIHRoaXMuZGVzdHJveSApO1xuXHR9LFxuXG5cdGluaXRFbGVtZW50c0NvbGxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbGVtZW50c0NvbGxlY3Rpb24gPSBuZXcgUGFuZWxFbGVtZW50c0VsZW1lbnRzQ29sbGVjdGlvbigpLFxuXHRcdFx0c2VjdGlvbkNvbmZpZyA9IGVsZW1lbnRvci5jb25maWcuZWxlbWVudHMuc2VjdGlvbjtcblxuXHRcdGVsZW1lbnRzQ29sbGVjdGlvbi5hZGQoIHtcblx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnaW5uZXJfc2VjdGlvbicgKSxcblx0XHRcdGVsVHlwZTogJ3NlY3Rpb24nLFxuXHRcdFx0Y2F0ZWdvcmllczogc2VjdGlvbkNvbmZpZy5jYXRlZ29yaWVzLFxuXHRcdFx0a2V5d29yZHM6IHNlY3Rpb25Db25maWcua2V5d29yZHMsXG5cdFx0XHRpY29uOiBzZWN0aW9uQ29uZmlnLmljb25cblx0XHR9ICk7XG5cblx0XHQvLyBUT0RPOiBDaGFuZ2UgdGhlIGFycmF5IGZyb20gc2VydmVyIHN5bnRheCwgYW5kIG5vIG5lZWQgZWFjaCBsb29wIGZvciBpbml0aWFsaXplXG5cdFx0Xy5lYWNoKCBlbGVtZW50b3IuY29uZmlnLndpZGdldHMsIGZ1bmN0aW9uKCBlbGVtZW50LCB3aWRnZXRUeXBlICkge1xuXHRcdFx0ZWxlbWVudHNDb2xsZWN0aW9uLmFkZCgge1xuXHRcdFx0XHR0aXRsZTogZWxlbWVudC50aXRsZSxcblx0XHRcdFx0ZWxUeXBlOiAnd2lkZ2V0Jyxcblx0XHRcdFx0Y2F0ZWdvcmllczogZWxlbWVudC5jYXRlZ29yaWVzLFxuXHRcdFx0XHRrZXl3b3JkczogZWxlbWVudC5rZXl3b3Jkcyxcblx0XHRcdFx0aWNvbjogZWxlbWVudC5pY29uLFxuXHRcdFx0XHR3aWRnZXRUeXBlOiB3aWRnZXRUeXBlXG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5lbGVtZW50c0NvbGxlY3Rpb24gPSBlbGVtZW50c0NvbGxlY3Rpb247XG5cdH0sXG5cblx0aW5pdENhdGVnb3JpZXNDb2xsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2F0ZWdvcmllcyA9IHt9O1xuXG5cdFx0dGhpcy5lbGVtZW50c0NvbGxlY3Rpb24uZWFjaCggZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRfLmVhY2goIGVsZW1lbnQuZ2V0KCAnY2F0ZWdvcmllcycgKSwgZnVuY3Rpb24oIGNhdGVnb3J5ICkge1xuXHRcdFx0XHRpZiAoICEgY2F0ZWdvcmllc1sgY2F0ZWdvcnkgXSApIHtcblx0XHRcdFx0XHRjYXRlZ29yaWVzWyBjYXRlZ29yeSBdID0gW107XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXRlZ29yaWVzWyBjYXRlZ29yeSBdLnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHR2YXIgY2F0ZWdvcmllc0NvbGxlY3Rpb24gPSBuZXcgUGFuZWxFbGVtZW50c0NhdGVnb3JpZXNDb2xsZWN0aW9uKCk7XG5cblx0XHRfLmVhY2goIGVsZW1lbnRvci5jb25maWcuZWxlbWVudHNfY2F0ZWdvcmllcywgZnVuY3Rpb24oIGNhdGVnb3J5Q29uZmlnLCBjYXRlZ29yeU5hbWUgKSB7XG5cdFx0XHRpZiAoICEgY2F0ZWdvcmllc1sgY2F0ZWdvcnlOYW1lIF0gKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y2F0ZWdvcmllc0NvbGxlY3Rpb24uYWRkKCB7XG5cdFx0XHRcdG5hbWU6IGNhdGVnb3J5TmFtZSxcblx0XHRcdFx0dGl0bGU6IGNhdGVnb3J5Q29uZmlnLnRpdGxlLFxuXHRcdFx0XHRpY29uOiBjYXRlZ29yeUNvbmZpZy5pY29uLFxuXHRcdFx0XHRpdGVtczogY2F0ZWdvcmllc1sgY2F0ZWdvcnlOYW1lIF1cblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLmNhdGVnb3JpZXNDb2xsZWN0aW9uID0gY2F0ZWdvcmllc0NvbGxlY3Rpb247XG5cdH0sXG5cblx0c2hvd0NhdGVnb3JpZXNWaWV3OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ2VsZW1lbnRzJyApLnNob3coIG5ldyBQYW5lbEVsZW1lbnRzQ2F0ZWdvcmllc1ZpZXcoIHsgY29sbGVjdGlvbjogdGhpcy5jYXRlZ29yaWVzQ29sbGVjdGlvbiB9ICkgKTtcblx0fSxcblxuXHRzaG93RWxlbWVudHNWaWV3OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldFJlZ2lvbiggJ2VsZW1lbnRzJyApLnNob3coIG5ldyBQYW5lbEVsZW1lbnRzRWxlbWVudHNWaWV3KCB7IGNvbGxlY3Rpb246IHRoaXMuZWxlbWVudHNDb2xsZWN0aW9uIH0gKSApO1xuXHR9LFxuXG5cdGNsZWFyU2VhcmNoSW5wdXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2V0Q2hpbGRWaWV3KCAnc2VhcmNoJyApLmNsZWFySW5wdXQoKTtcblx0fSxcblxuXHRjaGFuZ2VGaWx0ZXI6IGZ1bmN0aW9uKCBmaWx0ZXJWYWx1ZSApIHtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50c1xuXHRcdFx0LnJlcGx5KCAnZmlsdGVyOnZhbHVlJywgZmlsdGVyVmFsdWUgKVxuXHRcdFx0LnRyaWdnZXIoICdjaGFuZ2UnICk7XG5cdH0sXG5cblx0Y2xlYXJGaWx0ZXJzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNoYW5nZUZpbHRlciggbnVsbCApO1xuXHRcdHRoaXMuY2xlYXJTZWFyY2hJbnB1dCgpO1xuXHR9LFxuXG5cdG9uQ2hpbGR2aWV3Q2hpbGRyZW5SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlRWxlbWVudHNTY3JvbGxiYXIoKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld1NlYXJjaENoYW5nZUlucHV0OiBmdW5jdGlvbiggY2hpbGQgKSB7XG5cdFx0dmFyIHZhbHVlID0gY2hpbGQudWkuaW5wdXQudmFsKCk7XG5cblx0XHRpZiAoIF8uaXNFbXB0eSggdmFsdWUgKSApIHtcblx0XHRcdHRoaXMuc2hvd0NhdGVnb3JpZXNWaWV3KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvbGRWYWx1ZSA9IGVsZW1lbnRvci5jaGFubmVscy5wYW5lbEVsZW1lbnRzLnJlcXVlc3QoICdmaWx0ZXI6dmFsdWUnICk7XG5cblx0XHRcdGlmICggXy5pc0VtcHR5KCBvbGRWYWx1ZSApICkge1xuXHRcdFx0XHR0aGlzLnNob3dFbGVtZW50c1ZpZXcoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmNoYW5nZUZpbHRlciggdmFsdWUsICdzZWFyY2gnICk7XG5cdH0sXG5cblx0b25EZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cy5yZXBseSggJ2ZpbHRlcjp2YWx1ZScsIG51bGwgKTtcblx0fSxcblxuXHRvblNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWFyY2hSZWdpb24gPSB0aGlzLmdldFJlZ2lvbiggJ3NlYXJjaCcgKTtcblx0XHR2YXIgbGFuZ3VhZ2VzZWxlY3RvclJlZ2lvbiA9IHRoaXMuZ2V0UmVnaW9uKCAnbGFuZ3VhZ2VzZWxlY3RvcicgKTtcblxuXHRcdHRoaXMuaW5pdEVsZW1lbnRzQ29sbGVjdGlvbigpO1xuXHRcdHRoaXMuaW5pdENhdGVnb3JpZXNDb2xsZWN0aW9uKCk7XG5cdFx0dGhpcy5zaG93Q2F0ZWdvcmllc1ZpZXcoKTtcblxuXHRcdHNlYXJjaFJlZ2lvbi5zaG93KCBuZXcgUGFuZWxFbGVtZW50c1NlYXJjaFZpZXcoKSApO1xuXHRcdGxhbmd1YWdlc2VsZWN0b3JSZWdpb24uc2hvdyggbmV3IFBhbmVsRWxlbWVudHNMYW5ndWFnZXNlbGVjdG9yVmlldygpICk7XG5cdH0sXG5cblx0dXBkYXRlRWxlbWVudHNTY3JvbGxiYXI6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5jaGFubmVscy5kYXRhLnRyaWdnZXIoICdzY3JvbGxiYXI6dXBkYXRlJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c0xheW91dFZpZXc7XG4iLCJ2YXIgUGFuZWxFbGVtZW50c0VsZW1lbnRNb2RlbDtcblxuUGFuZWxFbGVtZW50c0VsZW1lbnRNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXHRkZWZhdWx0czoge1xuXHRcdHRpdGxlOiAnJyxcblx0XHRjYXRlZ29yaWVzOiBbXSxcblx0XHRrZXl3b3JkczogW10sXG5cdFx0aWNvbjogJycsXG5cdFx0ZWxUeXBlOiAnd2lkZ2V0Jyxcblx0XHR3aWRnZXRUeXBlOiAnJ1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c0VsZW1lbnRNb2RlbDtcbiIsInZhciBQYW5lbEVsZW1lbnRzQ2F0ZWdvcnlWaWV3ID0gcmVxdWlyZSggJy4vY2F0ZWdvcnknICksXG5cdFBhbmVsRWxlbWVudHNDYXRlZ29yaWVzVmlldztcblxuUGFuZWxFbGVtZW50c0NhdGVnb3JpZXNWaWV3ID0gTWFyaW9uZXR0ZS5Db2xsZWN0aW9uVmlldy5leHRlbmQoIHtcblx0Y2hpbGRWaWV3OiBQYW5lbEVsZW1lbnRzQ2F0ZWdvcnlWaWV3LFxuXG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzLWNhdGVnb3JpZXMnXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c0NhdGVnb3JpZXNWaWV3O1xuIiwidmFyIFBhbmVsRWxlbWVudHNFbGVtZW50VmlldyA9IHJlcXVpcmUoICcuL2VsZW1lbnQnICksXG5cdFBhbmVsRWxlbWVudHNFbGVtZW50c0NvbGxlY3Rpb24gPSByZXF1aXJlKCAnLi4vY29sbGVjdGlvbnMvZWxlbWVudHMnICksXG5cdFBhbmVsRWxlbWVudHNDYXRlZ29yeVZpZXc7XG5cblBhbmVsRWxlbWVudHNDYXRlZ29yeVZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzLWNhdGVnb3J5JyxcblxuXHRjbGFzc05hbWU6ICdlbGVtZW50b3ItcGFuZWwtY2F0ZWdvcnknLFxuXG5cdGNoaWxkVmlldzogUGFuZWxFbGVtZW50c0VsZW1lbnRWaWV3LFxuXG5cdGNoaWxkVmlld0NvbnRhaW5lcjogJy5wYW5lbC1lbGVtZW50cy1jYXRlZ29yeS1pdGVtcycsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb2xsZWN0aW9uID0gbmV3IFBhbmVsRWxlbWVudHNFbGVtZW50c0NvbGxlY3Rpb24oIHRoaXMubW9kZWwuZ2V0KCAnaXRlbXMnICkgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsRWxlbWVudHNDYXRlZ29yeVZpZXc7XG4iLCJ2YXIgUGFuZWxFbGVtZW50c0VsZW1lbnRWaWV3O1xuXG5QYW5lbEVsZW1lbnRzRWxlbWVudFZpZXcgPSBNYXJpb25ldHRlLkl0ZW1WaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1lbGVtZW50LWxpYnJhcnktZWxlbWVudCcsXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLWVsZW1lbnQtd3JhcHBlcicsXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJGVsLmh0bWw1RHJhZ2dhYmxlKCB7XG5cblx0XHRcdG9uRHJhZ1N0YXJ0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZWxlbWVudG9yLmNoYW5uZWxzLnBhbmVsRWxlbWVudHNcblx0XHRcdFx0XHQucmVwbHkoICdlbGVtZW50OnNlbGVjdGVkJywgc2VsZiApXG5cdFx0XHRcdFx0LnRyaWdnZXIoICdlbGVtZW50OmRyYWc6c3RhcnQnICk7XG5cdFx0XHR9LFxuXG5cdFx0XHRvbkRyYWdFbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cy50cmlnZ2VyKCAnZWxlbWVudDpkcmFnOmVuZCcgKTtcblx0XHRcdH0sXG5cblx0XHRcdGdyb3VwczogWyAnZWxlbWVudG9yLWVsZW1lbnQnIF1cblx0XHR9ICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEVsZW1lbnRzRWxlbWVudFZpZXc7XG4iLCJ2YXIgUGFuZWxFbGVtZW50c0VsZW1lbnRWaWV3ID0gcmVxdWlyZSggJy4vZWxlbWVudCcgKSxcblx0UGFuZWxFbGVtZW50c0VsZW1lbnRzVmlldztcblxuUGFuZWxFbGVtZW50c0VsZW1lbnRzVmlldyA9IE1hcmlvbmV0dGUuQ29sbGVjdGlvblZpZXcuZXh0ZW5kKCB7XG5cdGNoaWxkVmlldzogUGFuZWxFbGVtZW50c0VsZW1lbnRWaWV3LFxuXG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cywgJ2NoYW5nZScsIHRoaXMub25GaWx0ZXJDaGFuZ2VkICk7XG5cdH0sXG5cblx0ZmlsdGVyOiBmdW5jdGlvbiggY2hpbGRNb2RlbCApIHtcblx0XHR2YXIgZmlsdGVyVmFsdWUgPSBlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cy5yZXF1ZXN0KCAnZmlsdGVyOnZhbHVlJyApO1xuXG5cdFx0aWYgKCAhIGZpbHRlclZhbHVlICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF8uYW55KCBbICd0aXRsZScsICdrZXl3b3JkcycgXSwgZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gKCAtMSAhPT0gY2hpbGRNb2RlbC5nZXQoIHR5cGUgKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoIGZpbHRlclZhbHVlLnRvTG93ZXJDYXNlKCkgKSApO1xuXHRcdH0gKTtcblx0fSxcblxuXHRvbkZpbHRlckNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX3JlbmRlckNoaWxkcmVuKCk7XG5cdFx0dGhpcy50cmlnZ2VyTWV0aG9kKCAnY2hpbGRyZW46cmVuZGVyJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c0VsZW1lbnRzVmlldztcbiIsInZhciBQYW5lbEVsZW1lbnRzTGFuZ3VhZ2VzZWxlY3RvclZpZXc7XG5cblBhbmVsRWxlbWVudHNMYW5ndWFnZXNlbGVjdG9yVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLWVsZW1lbnQtbGFuZ3VhZ2VzZWxlY3RvcicsXG5cblx0aWQ6ICdlbGVtZW50b3ItcGFuZWwtZWxlbWVudHMtbGFuZ3VhZ2VzZWxlY3Rvci13cmFwcGVyJyxcblxuXHR1aToge1xuXHRcdHNlbGVjdDogJ3NlbGVjdCcsXG5cdFx0YnRuU2hvd0xhbmd1YWdlczogJyNlbGVtZW50b3ItcGFuZWwtZWxlbWVudHMtbGFuZ3VhZ2UtaW1wb3J0LWJ0bicsXG5cdFx0YnRuTGFuZ3VhZ2VJbXBvcnQ6ICcuZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzLWxhbmd1YWdlLWltcG9ydC1sbmcnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NoYW5nZSBAdWkuc2VsZWN0JzogJ29uU2VsZWN0Q2hhbmdlZCcsXG5cdFx0J2NsaWNrIEB1aS5idG5TaG93TGFuZ3VhZ2VzJzogJ29uU2hvd0xhbmd1YWdlc0NsaWNrJyxcblx0XHQnY2xpY2sgQHVpLmJ0bkxhbmd1YWdlSW1wb3J0JzogJ29uTGFuZ3VhZ2VJbXBvcnRDbGljaycsXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5pbml0SW1wb3J0TGFuZ3VhZ2VEaWFsb2coKTtcblx0fSxcblxuXHRvblNlbGVjdENoYW5nZWQ6IGZ1bmN0aW9uKCApIHtcblx0XHRpZiAoIWVsZW1lbnRvci5jaGFuZ2VMYW5ndWFnZSgkKHRoaXMudWkuc2VsZWN0KS52YWwoKSkpIHtcblx0XHRcdCQodGhpcy51aS5zZWxlY3QpLnZhbChlbGVtZW50b3IuY29uZmlnLmlkX2xhbmcpO1xuXHRcdH1cblx0fSxcblxuXHRvblNob3dMYW5ndWFnZXNDbGljazogZnVuY3Rpb24oICkge1xuXHRcdCQodGhpcy51aS5idG5TaG93TGFuZ3VhZ2VzKS5wYXJlbnQoKS50b2dnbGVDbGFzcygnZWxlbWVudG9yLW9wZW4nKTtcblx0fSxcblxuXHRpbml0SW1wb3J0TGFuZ3VhZ2VEaWFsb2c6IGZ1bmN0aW9uKCApIHtcblx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRkaWFsb2c7XG5cblxuXHRcdHNlbGYuZ2V0SW1wb3J0TGFuZ3VhZ2VEaWFsb2cgPSBmdW5jdGlvbihpZF9sYW5nKSB7XG5cdFx0XHRpZiAoIGRpYWxvZyApIHtcblx0XHRcdFx0cmV0dXJuIGRpYWxvZztcblx0XHRcdH1cblxuXHRcdFx0ZGlhbG9nID0gZWxlbWVudG9yLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2NvbmZpcm0nLCB7XG5cdFx0XHRcdGlkOiAnZWxlbWVudG9yLWltcG9ydC1sYW5ndWFnZS1kaWFsb2cnLFxuXHRcdFx0XHRoZWFkZXJNZXNzYWdlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnaW1wb3J0X2xhbmd1YWdlX2RpYWxvZ190aXRsZScgKSxcblx0XHRcdFx0bWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2ltcG9ydF9sYW5ndWFnZV9kaWFsb2dfbXNnJyApLFxuXHRcdFx0XHRwb3NpdGlvbjoge1xuXHRcdFx0XHRcdG15OiAnY2VudGVyIGNlbnRlcicsXG5cdFx0XHRcdFx0YXQ6ICdjZW50ZXIgY2VudGVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkNvbmZpcm06IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdEJhY2tib25lLiQoICcjZWxlbWVudG9yLWxvYWRpbmcsICNlbGVtZW50b3ItcHJldmlldy1sb2FkaW5nJyApLmZhZGVJbiggNjAwICk7XG5cdFx0XHRcdFx0ZWxlbWVudG9yLmdldFJlZ2lvbiggJ3NlY3Rpb25zJyApLmN1cnJlbnRWaWV3LmNvbGxlY3Rpb24ucmVzZXQoKTtcblxuXHRcdFx0XHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdnZXRMYW5ndWFnZUNvbnRlbnQnLCB7XG5cdFx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRcdGlkX2xhbmc6IGlkX2xhbmcsXG5cdFx0XHRcdFx0XHRcdHBhZ2VfdHlwZTogZWxlbWVudG9yLmNvbmZpZy5wYWdlX3R5cGUsXG5cdFx0XHRcdFx0XHRcdHBhZ2VfaWQ6IGVsZW1lbnRvci5jb25maWcucG9zdF9pZCxcblx0XHRcdFx0XHRcdFx0Y29udGVudF90eXBlOiBlbGVtZW50b3IuY29uZmlnLmNvbnRlbnRfdHlwZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0XHRcdFx0ZWxlbWVudG9yLmdldFJlZ2lvbiggJ3NlY3Rpb25zJyApLmN1cnJlbnRWaWV3LmFkZENoaWxkTW9kZWwoIGRhdGEgKTtcblx0XHRcdFx0XHRcdFx0QmFja2JvbmUuJCggJyNlbGVtZW50b3ItbG9hZGluZywgI2VsZW1lbnRvci1wcmV2aWV3LWxvYWRpbmcnICkuZmFkZU91dCggNjAwICk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHRyZXR1cm4gZGlhbG9nO1xuXHRcdH07XG5cdH0sXG5cblx0b25MYW5ndWFnZUltcG9ydENsaWNrOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRlbGVtZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dmFyIGlkX2xhbmcgPSAkKGVsZW1lbnQuY3VycmVudFRhcmdldCkuZGF0YSgnbGFuZ3VhZ2UnKTtcblx0XHR0aGlzLmdldEltcG9ydExhbmd1YWdlRGlhbG9nKGlkX2xhbmcpLnNob3coKTtcblxuXHR9LFxuXG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEVsZW1lbnRzTGFuZ3VhZ2VzZWxlY3RvclZpZXc7XG4iLCJ2YXIgUGFuZWxFbGVtZW50c1NlYXJjaFZpZXc7XG5cblBhbmVsRWxlbWVudHNTZWFyY2hWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItcGFuZWwtZWxlbWVudC1zZWFyY2gnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLWVsZW1lbnRzLXNlYXJjaC13cmFwcGVyJyxcblxuXHR1aToge1xuXHRcdGlucHV0OiAnaW5wdXQnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2tleXVwIEB1aS5pbnB1dCc6ICdvbklucHV0Q2hhbmdlZCdcblx0fSxcblxuXHRvbklucHV0Q2hhbmdlZDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBFU0NfS0VZID0gMjc7XG5cblx0XHRpZiAoIEVTQ19LRVkgPT09IGV2ZW50LmtleUNvZGUgKSB7XG5cdFx0XHR0aGlzLmNsZWFySW5wdXQoKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyaWdnZXJNZXRob2QoICdzZWFyY2g6Y2hhbmdlOmlucHV0JyApO1xuXHR9LFxuXG5cdGNsZWFySW5wdXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudWkuaW5wdXQudmFsKCAnJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxFbGVtZW50c1NlYXJjaFZpZXc7XG4iLCJ2YXIgUGFuZWxNZW51SXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL21lbnUvdmlld3MvaXRlbScgKSxcblx0UGFuZWxNZW51UGFnZVZpZXc7XG5cblBhbmVsTWVudVBhZ2VWaWV3ID0gTWFyaW9uZXR0ZS5Db2xsZWN0aW9uVmlldy5leHRlbmQoIHtcblx0aWQ6ICdlbGVtZW50b3ItcGFuZWwtcGFnZS1tZW51JyxcblxuXHRjaGlsZFZpZXc6IFBhbmVsTWVudUl0ZW1WaWV3LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCBbXG5cdFx0XHR7XG5cdFx0XHRcdGljb246ICdlcmFzZXInLFxuXHRcdFx0XHR0aXRsZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2NsZWFyX3BhZ2UnICksXG5cdFx0XHRcdGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRlbGVtZW50b3IuY2xlYXJQYWdlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGljb246ICdpbmZvLWNpcmNsZScsXG5cdFx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnYWJvdXRfZWxlbWVudG9yJyApLFxuXHRcdFx0XHR0eXBlOiAnbGluaycsXG5cdFx0XHRcdGxpbms6IGVsZW1lbnRvci5jb25maWcuZWxlbWVudG9yX3NpdGUsXG5cdFx0XHRcdG5ld1RhYjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0gKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld0NsaWNrOiBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdHZhciBtZW51SXRlbVR5cGUgPSBjaGlsZFZpZXcubW9kZWwuZ2V0KCAndHlwZScgKTtcblxuXHRcdHN3aXRjaCAoIG1lbnVJdGVtVHlwZSApIHtcblx0XHRcdGNhc2UgJ3BhZ2UnIDpcblx0XHRcdFx0dmFyIHBhZ2VOYW1lID0gY2hpbGRWaWV3Lm1vZGVsLmdldCggJ3BhZ2VOYW1lJyApLFxuXHRcdFx0XHRcdHBhZ2VUaXRsZSA9IGNoaWxkVmlldy5tb2RlbC5nZXQoICd0aXRsZScgKTtcblxuXHRcdFx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuc2V0UGFnZSggcGFnZU5hbWUsIHBhZ2VUaXRsZSApO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnbGluaycgOlxuXHRcdFx0XHR2YXIgbGluayA9IGNoaWxkVmlldy5tb2RlbC5nZXQoICdsaW5rJyApLFxuXHRcdFx0XHRcdGlzTmV3VGFiID0gY2hpbGRWaWV3Lm1vZGVsLmdldCggJ25ld1RhYicgKTtcblxuXHRcdFx0XHRpZiAoIGlzTmV3VGFiICkge1xuXHRcdFx0XHRcdG9wZW4oIGxpbmssICdfYmxhbmsnICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9IGNoaWxkVmlldy5tb2RlbC5nZXQoICdsaW5rJyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHZhciBjYWxsYmFjayA9IGNoaWxkVmlldy5tb2RlbC5nZXQoICdjYWxsYmFjaycgKTtcblxuXHRcdFx0XHRpZiAoIF8uaXNGdW5jdGlvbiggY2FsbGJhY2sgKSApIHtcblx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKCBjaGlsZFZpZXcgKTtcblx0XHRcdFx0fVxuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsTWVudVBhZ2VWaWV3O1xuIiwidmFyIFBhbmVsTWVudUl0ZW1WaWV3O1xuXG5QYW5lbE1lbnVJdGVtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLW1lbnUtaXRlbScsXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLXBhbmVsLW1lbnUtaXRlbScsXG5cblx0dHJpZ2dlcnM6IHtcblx0XHRjbGljazogJ2NsaWNrJ1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxNZW51SXRlbVZpZXc7XG4iLCJ2YXIgUGFuZWxSZXZpc2lvbnNQYWdlVmlldztcblxuUGFuZWxSZXZpc2lvbnNQYWdlVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLXBhZ2UtcmV2aXNpb25zJyxcblxuXHR0ZW1wbGF0ZTogJyN0bXBsLWVsZW1lbnRvci1wYW5lbC1yZXZpc2lvbnMnLFxuXG5cdHNlbGVjdGVkUmV2aXNpb25JZDogbnVsbCxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2sgLmVsZW1lbnRvci1yZXZpc2lvbi1hcHBseSc6ICdvbkNsaWNrQXBwbHknXG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubG9hZFJldmlzaW9ucygpO1xuXHR9LFxuXG5cdGxvYWRSZXZpc2lvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdGNvbmZpZyA9IGVsZW1lbnRvci5jb25maWcsXG5cdFx0XHQkID0gQmFja2JvbmUuJDtcblxuXHRcdCQuYWpheCgge1xuXHRcdFx0dXJsOiBjb25maWcuYWpheHVybCArICcmYWN0aW9uPUdldFJldmlzaW9ucycsXG5cdFx0XHR0eXBlOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGVudGl0eV90eXBlOiBjb25maWcucGFnZV90eXBlLFxuXHRcdFx0XHRlbnRpdHlfaWQ6IGNvbmZpZy5wb3N0X2lkXG5cdFx0XHR9LFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRpZiAoICEgcmVzcG9uc2Uuc3VjY2VzcyApIHtcblx0XHRcdFx0XHRzZWxmLnNob3dFcnJvcigpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWxmLnJlbmRlclJldmlzaW9uc0xpc3QoIHJlc3BvbnNlICk7XG5cdFx0XHR9LFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLnNob3dFcnJvcigpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRzaG93RXJyb3I6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0bXBsID0gTWFyaW9uZXR0ZS5UZW1wbGF0ZUNhY2hlLmdldCggJyN0bXBsLWVsZW1lbnRvci1wYW5lbC1yZXZpc2lvbnMtZXJyb3InICk7XG5cdFx0dGhpcy4kZWwuaHRtbCggdG1wbCgpICk7XG5cdH0sXG5cblx0cmVuZGVyUmV2aXNpb25zTGlzdDogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdHZhciAkID0gQmFja2JvbmUuJCxcblx0XHRcdHNlbGYgPSB0aGlzO1xuXG5cdFx0Ly8gUmVuZGVyIHRoZSBsaXN0IHdyYXBwZXJcblx0XHR2YXIgbGlzdFRtcGwgPSBNYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUuZ2V0KCAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLXJldmlzaW9ucy1saXN0JyApO1xuXHRcdHRoaXMuJGVsLmh0bWwoIGxpc3RUbXBsKCkgKTtcblxuXHRcdHZhciAkbGlzdCA9IHRoaXMuJGVsLmZpbmQoICcuZWxlbWVudG9yLXJldmlzaW9ucy1saXN0JyApO1xuXG5cdFx0Ly8gQXV0b3NhdmUgaXRlbVxuXHRcdGlmICggcmVzcG9uc2UuYXV0b3NhdmUgKSB7XG5cdFx0XHR2YXIgYXNFbXBOYW1lID0gcmVzcG9uc2UuYXV0b3NhdmUuZW1wbG95ZWVfbmFtZSB8fCAnU3lzdGVtJztcblx0XHRcdHZhciBhdXRvc2F2ZVRtcGwgPSBNYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUuZ2V0KCAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLXJldmlzaW9ucy1hdXRvc2F2ZScgKTtcblxuXHRcdFx0dmFyICRhdXRvc2F2ZSA9ICQoICc8ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXJldmlzaW9uLWl0ZW0gZWxlbWVudG9yLXJldmlzaW9uLWF1dG9zYXZlXCIgZGF0YS1yZXYtaWQ9XCJhdXRvc2F2ZVwiPjwvZGl2PicgKTtcblx0XHRcdCRhdXRvc2F2ZS5odG1sKCBhdXRvc2F2ZVRtcGwoIHtcblx0XHRcdFx0aW5pdGlhbDogYXNFbXBOYW1lLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdHRpbWVBZ286IHNlbGYuZ2V0VGltZUFnbyggcmVzcG9uc2UuYXV0b3NhdmUuYXV0b3NhdmVfYXQgKSxcblx0XHRcdFx0Zm9ybWF0dGVkRGF0ZTogc2VsZi5mb3JtYXREYXRlKCByZXNwb25zZS5hdXRvc2F2ZS5hdXRvc2F2ZV9hdCApLFxuXHRcdFx0XHRlbXBsb3llZU5hbWU6IHNlbGYuZXNjYXBlSHRtbCggYXNFbXBOYW1lIClcblx0XHRcdH0gKSApO1xuXHRcdFx0JGxpc3QuYXBwZW5kKCAkYXV0b3NhdmUgKTtcblx0XHR9XG5cblx0XHQvLyBFbXB0eSBzdGF0ZVxuXHRcdGlmICggcmVzcG9uc2UucmV2aXNpb25zLmxlbmd0aCA9PT0gMCAmJiAhIHJlc3BvbnNlLmF1dG9zYXZlICkge1xuXHRcdFx0dmFyIGVtcHR5VG1wbCA9IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItcGFuZWwtcmV2aXNpb25zLWVtcHR5JyApO1xuXHRcdFx0JGxpc3QuaHRtbCggZW1wdHlUbXBsKCkgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBSZXZpc2lvbiBpdGVtc1xuXHRcdHZhciBpdGVtVG1wbCA9IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItcGFuZWwtcmV2aXNpb25zLWl0ZW0nICk7XG5cblx0XHRyZXNwb25zZS5yZXZpc2lvbnMuZm9yRWFjaCggZnVuY3Rpb24oIHJldiwgaW5kZXggKSB7XG5cdFx0XHR2YXIgZW1wTmFtZSA9IHJldi5lbXBsb3llZV9uYW1lIHx8ICdTeXN0ZW0nO1xuXHRcdFx0dmFyIGlzQ3VycmVudCA9ICggaW5kZXggPT09IDAgKTtcblxuXHRcdFx0dmFyICRpdGVtID0gJCggJzxkaXYgY2xhc3M9XCJlbGVtZW50b3ItcmV2aXNpb24taXRlbVwiIGRhdGEtcmV2LWlkPVwiJyArIHJldi5pZCArICdcIj48L2Rpdj4nICk7XG5cblx0XHRcdGlmICggaXNDdXJyZW50ICkge1xuXHRcdFx0XHQkaXRlbS5hZGRDbGFzcyggJ2VsZW1lbnRvci1yZXZpc2lvbi1jdXJyZW50JyApO1xuXHRcdFx0fVxuXG5cdFx0XHQkaXRlbS5odG1sKCBpdGVtVG1wbCgge1xuXHRcdFx0XHRpZDogcmV2LmlkLFxuXHRcdFx0XHRpbml0aWFsOiBlbXBOYW1lLmNoYXJBdCggMCApLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdHRpbWVBZ286IHNlbGYuZ2V0VGltZUFnbyggcmV2LmNyZWF0ZWRfYXQgKSxcblx0XHRcdFx0Zm9ybWF0dGVkRGF0ZTogc2VsZi5mb3JtYXREYXRlKCByZXYuY3JlYXRlZF9hdCApLFxuXHRcdFx0XHRsYWJlbDogc2VsZi5lc2NhcGVIdG1sKCByZXYubGFiZWwgfHwgZWxlbWVudG9yLnRyYW5zbGF0ZSggJ3JldmlzaW9uc19yZXZpc2lvbicgKSApLFxuXHRcdFx0XHRlbXBsb3llZU5hbWU6IHNlbGYuZXNjYXBlSHRtbCggZW1wTmFtZSApLFxuXHRcdFx0XHRpc0N1cnJlbnQ6IGlzQ3VycmVudFxuXHRcdFx0fSApICk7XG5cblx0XHRcdCRsaXN0LmFwcGVuZCggJGl0ZW0gKTtcblx0XHR9ICk7XG5cblx0XHQvLyBCaW5kIGl0ZW0gY2xpY2sgZm9yIHNlbGVjdGlvblxuXHRcdHRoaXMuJGVsLm9uKCAnY2xpY2snLCAnLmVsZW1lbnRvci1yZXZpc2lvbi1pdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJGl0ZW0gPSAkKCB0aGlzICksXG5cdFx0XHRcdHJldklkID0gJGl0ZW0uZGF0YSggJ3Jldi1pZCcgKTtcblxuXHRcdFx0c2VsZi4kZWwuZmluZCggJy5lbGVtZW50b3ItcmV2aXNpb24taXRlbScgKS5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci1yZXZpc2lvbi1zZWxlY3RlZCcgKTtcblx0XHRcdCRpdGVtLmFkZENsYXNzKCAnZWxlbWVudG9yLXJldmlzaW9uLXNlbGVjdGVkJyApO1xuXHRcdFx0c2VsZi5zZWxlY3RlZFJldmlzaW9uSWQgPSByZXZJZDtcblxuXHRcdFx0c2VsZi4kZWwuZmluZCggJy5lbGVtZW50b3ItcmV2aXNpb24tYXBwbHknICkucHJvcCggJ2Rpc2FibGVkJywgZmFsc2UgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0b25DbGlja0FwcGx5OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5zZWxlY3RlZFJldmlzaW9uSWQgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0Y29uZmlnID0gZWxlbWVudG9yLmNvbmZpZyxcblx0XHRcdCQgPSBCYWNrYm9uZS4kO1xuXG5cdFx0Ly8gQXV0b3NhdmUgcmVzdG9yZVxuXHRcdGlmICggc2VsZi5zZWxlY3RlZFJldmlzaW9uSWQgPT09ICdhdXRvc2F2ZScgKSB7XG5cdFx0XHQkLmFqYXgoIHtcblx0XHRcdFx0dXJsOiBjb25maWcuYWpheHVybCArICcmYWN0aW9uPUdldEF1dG9zYXZlJyxcblx0XHRcdFx0dHlwZTogJ1BPU1QnLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0ZW50aXR5X3R5cGU6IGNvbmZpZy5wYWdlX3R5cGUsXG5cdFx0XHRcdFx0ZW50aXR5X2lkOiBjb25maWcucG9zdF9pZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG5cdFx0XHRcdFx0aWYgKCByZXNwb25zZS5zdWNjZXNzICYmIHJlc3BvbnNlLmNvbnRlbnQgKSB7XG5cdFx0XHRcdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZSggcmVzcG9uc2UuY29udGVudCApO1xuXHRcdFx0XHRcdFx0ZWxlbWVudG9yLmVsZW1lbnRzLnJlc2V0KCBwYXJzZWQgKTtcblx0XHRcdFx0XHRcdGVsZW1lbnRvci5zZXRGbGFnRWRpdG9yQ2hhbmdlKCB0cnVlICk7XG5cdFx0XHRcdFx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFJlZ3VsYXIgcmV2aXNpb24gcmVzdG9yZVxuXHRcdCQuYWpheCgge1xuXHRcdFx0dXJsOiBjb25maWcuYWpheHVybCArICcmYWN0aW9uPVJlc3RvcmVSZXZpc2lvbicsXG5cdFx0XHR0eXBlOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiB7IGlkX3JldmlzaW9uOiBzZWxmLnNlbGVjdGVkUmV2aXNpb25JZCB9LFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRpZiAoIHJlc3BvbnNlLnN1Y2Nlc3MgJiYgcmVzcG9uc2UuY29udGVudCApIHtcblx0XHRcdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZSggcmVzcG9uc2UuY29udGVudCApO1xuXHRcdFx0XHRcdGVsZW1lbnRvci5lbGVtZW50cy5yZXNldCggcGFyc2VkICk7XG5cdFx0XHRcdFx0ZWxlbWVudG9yLnNldEZsYWdFZGl0b3JDaGFuZ2UoIHRydWUgKTtcblx0XHRcdFx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdGdldFRpbWVBZ286IGZ1bmN0aW9uKCBkYXRlU3RyICkge1xuXHRcdHZhciBub3cgPSBuZXcgRGF0ZSgpLFxuXHRcdFx0ZGF0ZSA9IG5ldyBEYXRlKCBkYXRlU3RyLnJlcGxhY2UoICcgJywgJ1QnICkgKSxcblx0XHRcdGRpZmYgPSBNYXRoLmZsb29yKCAoIG5vdyAtIGRhdGUgKSAvIDEwMDAgKTtcblxuXHRcdGlmICggZGlmZiA8IDYwICkgeyByZXR1cm4gZGlmZiArICcgJyArIGVsZW1lbnRvci50cmFuc2xhdGUoICdyZXZpc2lvbnNfc2Vjb25kc19hZ28nICk7IH1cblx0XHRpZiAoIGRpZmYgPCAzNjAwICkgeyByZXR1cm4gTWF0aC5mbG9vciggZGlmZiAvIDYwICkgKyAnICcgKyBlbGVtZW50b3IudHJhbnNsYXRlKCAncmV2aXNpb25zX21pbl9hZ28nICk7IH1cblx0XHRpZiAoIGRpZmYgPCA4NjQwMCApIHsgcmV0dXJuIE1hdGguZmxvb3IoIGRpZmYgLyAzNjAwICkgKyAnICcgKyBlbGVtZW50b3IudHJhbnNsYXRlKCAncmV2aXNpb25zX2hvdXJzX2FnbycgKTsgfVxuXHRcdHJldHVybiBNYXRoLmZsb29yKCBkaWZmIC8gODY0MDAgKSArICcgJyArIGVsZW1lbnRvci50cmFuc2xhdGUoICdyZXZpc2lvbnNfZGF5c19hZ28nICk7XG5cdH0sXG5cblx0Zm9ybWF0RGF0ZTogZnVuY3Rpb24oIGRhdGVTdHIgKSB7XG5cdFx0dmFyIGQgPSBuZXcgRGF0ZSggZGF0ZVN0ci5yZXBsYWNlKCAnICcsICdUJyApICk7XG5cdFx0dmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXTtcblx0XHRyZXR1cm4gZC5nZXREYXRlKCkgKyAnICcgKyBtb250aHNbIGQuZ2V0TW9udGgoKSBdICsgJyBAICcgK1xuXHRcdFx0KCAnMCcgKyBkLmdldEhvdXJzKCkgKS5zbGljZSggLTIgKSArICc6JyArICggJzAnICsgZC5nZXRNaW51dGVzKCkgKS5zbGljZSggLTIgKTtcblx0fSxcblxuXHRlc2NhcGVIdG1sOiBmdW5jdGlvbiggc3RyICkge1xuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuXHRcdGRpdi50ZXh0Q29udGVudCA9IHN0cjtcblx0XHRyZXR1cm4gZGl2LmlubmVySFRNTDtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsUmV2aXNpb25zUGFnZVZpZXc7XG4iLCJ2YXIgUGFuZWxTY2hlbWVCYXNlVmlldztcblxuUGFuZWxTY2hlbWVCYXNlVmlldyA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoIHtcblx0aWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZWxlbWVudG9yLXBhbmVsLXNjaGVtZS0nICsgdGhpcy5nZXRUeXBlKCk7XG5cdH0sXG5cblx0Y2xhc3NOYW1lOiAnZWxlbWVudG9yLXBhbmVsLXNjaGVtZScsXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnLmVsZW1lbnRvci1wYW5lbC1zY2hlbWUtaXRlbXMnLFxuXG5cdGdldFRlbXBsYXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gTWFyaW9uZXR0ZS5UZW1wbGF0ZUNhY2hlLmdldCggJyN0bXBsLWVsZW1lbnRvci1wYW5lbC1zY2hlbWVzLScgKyB0aGlzLmdldFR5cGUoKSApO1xuXHR9LFxuXG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2F2ZUJ1dHRvbjogJy5lbGVtZW50b3ItcGFuZWwtc2NoZW1lLXNhdmUgLmVsZW1lbnRvci1idG4nLFxuXHRcdFx0ZGlzY2FyZEJ1dHRvbjogJy5lbGVtZW50b3ItcGFuZWwtc2NoZW1lLWRpc2NhcmQgLmVsZW1lbnRvci1idG4nLFxuXHRcdFx0cmVzZXRCdXR0b246ICcuZWxlbWVudG9yLXBhbmVsLXNjaGVtZS1yZXNldCAuZWxlbWVudG9yLWJ0bidcblx0XHR9O1xuXHR9LFxuXG5cdGV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdCdjbGljayBAdWkuc2F2ZUJ1dHRvbic6ICdzYXZlU2NoZW1lJyxcblx0XHRcdCdjbGljayBAdWkuZGlzY2FyZEJ1dHRvbic6ICdkaXNjYXJkU2NoZW1lJyxcblx0XHRcdCdjbGljayBAdWkucmVzZXRCdXR0b24nOiAnc2V0RGVmYXVsdFNjaGVtZSdcblx0XHR9O1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKTtcblxuXHRcdHRoaXMucmVzZXRTY2hlbWUoKTtcblx0fSxcblxuXHRnZXRUeXBlOiBmdW5jdGlvbigpIHt9LFxuXG5cdGdldFNjaGVtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGVsZW1lbnRvci5zY2hlbWVzLmdldFNjaGVtZSggdGhpcy5nZXRUeXBlKCkgKTtcblx0fSxcblxuXHRjaGFuZ2VDaGlsZHJlblVJVmFsdWVzOiBmdW5jdGlvbiggc2NoZW1lSXRlbXMgKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0Xy5lYWNoKCBzY2hlbWVJdGVtcywgZnVuY3Rpb24oIHZhbHVlLCBrZXkgKSB7XG5cdFx0XHR2YXIgbW9kZWwgPSBzZWxmLmNvbGxlY3Rpb24uZmluZFdoZXJlKCB7IGtleToga2V5IH0gKSxcblx0XHRcdFx0Y2hpbGRWaWV3ID0gc2VsZi5jaGlsZHJlbi5maW5kQnlNb2RlbENpZCggbW9kZWwuY2lkICk7XG5cblx0XHRcdGNoaWxkVmlldy5jaGFuZ2VVSVZhbHVlKCB2YWx1ZSApO1xuXHRcdH0gKTtcblx0fSxcblxuXHRkaXNjYXJkU2NoZW1lOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3Iuc2NoZW1lcy5yZXNldFNjaGVtZXMoIHRoaXMuZ2V0VHlwZSgpICk7XG5cblx0XHR0aGlzLnVpLnNhdmVCdXR0b24ucHJvcCggJ2Rpc2FibGVkJywgdHJ1ZSApO1xuXG5cdFx0dGhpcy5fcmVuZGVyQ2hpbGRyZW4oKTtcblx0fSxcblxuXHRzZXRTY2hlbWVWYWx1ZTogZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG5cdFx0ZWxlbWVudG9yLnNjaGVtZXMuc2V0U2NoZW1lVmFsdWUoIHRoaXMuZ2V0VHlwZSgpLCBrZXksIHZhbHVlICk7XG5cdH0sXG5cblx0c2F2ZVNjaGVtZTogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLnNjaGVtZXMuc2F2ZVNjaGVtZSggdGhpcy5nZXRUeXBlKCkgKTtcblxuXHRcdHRoaXMudWkuc2F2ZUJ1dHRvbi5wcm9wKCAnZGlzYWJsZWQnLCB0cnVlICk7XG5cblx0XHR0aGlzLnJlc2V0U2NoZW1lKCk7XG5cblx0XHR0aGlzLl9yZW5kZXJDaGlsZHJlbigpO1xuXHR9LFxuXG5cdHNldERlZmF1bHRTY2hlbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZWZhdWx0U2NoZW1lID0gZWxlbWVudG9yLmNvbmZpZy5kZWZhdWx0X3NjaGVtZXNbIHRoaXMuZ2V0VHlwZSgpIF0uaXRlbXM7XG5cblx0XHR0aGlzLmNoYW5nZUNoaWxkcmVuVUlWYWx1ZXMoIGRlZmF1bHRTY2hlbWUgKTtcblx0fSxcblxuXHRyZXNldEl0ZW1zOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm1vZGVsLnNldCggJ2l0ZW1zJywgdGhpcy5nZXRTY2hlbWUoKS5pdGVtcyApO1xuXHR9LFxuXG5cdHJlc2V0Q29sbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGl0ZW1zID0gdGhpcy5tb2RlbC5nZXQoICdpdGVtcycgKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCk7XG5cblx0XHRfLmVhY2goIGl0ZW1zLCBfLmJpbmQoIGZ1bmN0aW9uKCBpdGVtLCBrZXkgKSB7XG5cdFx0XHRpdGVtLnR5cGUgPSB0aGlzLmdldFR5cGUoKTtcblx0XHRcdGl0ZW0ua2V5ID0ga2V5O1xuXG5cdFx0XHR0aGlzLmNvbGxlY3Rpb24uYWRkKCBpdGVtICk7XG5cdFx0fSwgdGhpcyApICk7XG5cdH0sXG5cblx0cmVzZXRTY2hlbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVzZXRJdGVtcygpO1xuXHRcdHRoaXMucmVzZXRDb2xsZWN0aW9uKCk7XG5cdH0sXG5cblx0b25DaGlsZHZpZXdWYWx1ZUNoYW5nZTogZnVuY3Rpb24oIGNoaWxkVmlldywgbmV3VmFsdWUgKSB7XG5cdFx0dGhpcy51aS5zYXZlQnV0dG9uLnJlbW92ZVByb3AoICdkaXNhYmxlZCcgKTtcblxuXHRcdHRoaXMuc2V0U2NoZW1lVmFsdWUoIGNoaWxkVmlldy5tb2RlbC5nZXQoICdrZXknICksIG5ld1ZhbHVlICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbFNjaGVtZUJhc2VWaWV3O1xuIiwidmFyIFBhbmVsU2NoZW1lQmFzZVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL3NjaGVtZXMvYmFzZScgKSxcblx0UGFuZWxTY2hlbWVDb2xvcnNWaWV3O1xuXG5QYW5lbFNjaGVtZUNvbG9yc1ZpZXcgPSBQYW5lbFNjaGVtZUJhc2VWaWV3LmV4dGVuZCgge1xuXG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdWkgPSBQYW5lbFNjaGVtZUJhc2VWaWV3LnByb3RvdHlwZS51aS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHR1aS5zeXN0ZW1TY2hlbWVzID0gJy5lbGVtZW50b3ItcGFuZWwtc2NoZW1lLWNvbG9yLXN5c3RlbS1zY2hlbWUnO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGV2ZW50cyA9IFBhbmVsU2NoZW1lQmFzZVZpZXcucHJvdG90eXBlLmV2ZW50cy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRldmVudHNbICdjbGljayBAdWkuc3lzdGVtU2NoZW1lcycgXSA9ICdvblN5c3RlbVNjaGVtZUNsaWNrJztcblxuXHRcdHJldHVybiBldmVudHM7XG5cdH0sXG5cblx0Z2V0Q2hpbGRWaWV3OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gcmVxdWlyZSggJ2VsZW1lbnRvci1wYW5lbC9wYWdlcy9zY2hlbWVzL2l0ZW1zL2NvbG9yJyApO1xuXHR9LFxuXG5cdGdldFR5cGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnY29sb3InO1xuXHR9LFxuXG5cdG9uU3lzdGVtU2NoZW1lQ2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgJHNjaGVtZUNsaWNrZWQgPSBCYWNrYm9uZS4kKCBldmVudC5jdXJyZW50VGFyZ2V0ICksXG5cdFx0XHRzY2hlbWVOYW1lID0gJHNjaGVtZUNsaWNrZWQuZGF0YSggJ3NjaGVtZU5hbWUnICksXG5cdFx0XHRzY2hlbWUgPSBlbGVtZW50b3IuY29uZmlnLnN5c3RlbV9zY2hlbWVzLmNvbG9yWyBzY2hlbWVOYW1lIF0uaXRlbXM7XG5cblx0XHR0aGlzLmNoYW5nZUNoaWxkcmVuVUlWYWx1ZXMoIHNjaGVtZSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxTY2hlbWVDb2xvcnNWaWV3O1xuIiwidmFyIFBhbmVsU2NoZW1lRGlzYWJsZWRWaWV3O1xuXG5QYW5lbFNjaGVtZURpc2FibGVkVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLXNjaGVtZXMtZGlzYWJsZWQnLFxuXG5cdGRpc2FibGVkVGl0bGU6ICcnLFxuXG5cdHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRpc2FibGVkVGl0bGU6IHRoaXMuZGlzYWJsZWRUaXRsZVxuXHRcdH07XG5cdH0sXG5cblx0aWQ6ICdlbGVtZW50b3ItcGFuZWwtc2NoZW1lcy1kaXNhYmxlZCdcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbFNjaGVtZURpc2FibGVkVmlldztcbiIsInZhciBQYW5lbFNjaGVtZUl0ZW1WaWV3O1xuXG5QYW5lbFNjaGVtZUl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0Z2V0VGVtcGxhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBNYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUuZ2V0KCAnI3RtcGwtZWxlbWVudG9yLXBhbmVsLXNjaGVtZS0nICsgdGhpcy5tb2RlbC5nZXQoICd0eXBlJyApICsgJy1pdGVtJyApO1xuXHR9LFxuXG5cdGNsYXNzTmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdlbGVtZW50b3ItcGFuZWwtc2NoZW1lLWl0ZW0nO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxTY2hlbWVJdGVtVmlldztcbiIsInZhciBQYW5lbFNjaGVtZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1wYW5lbC9wYWdlcy9zY2hlbWVzL2l0ZW1zL2Jhc2UnICksXG5cdFBhbmVsU2NoZW1lQ29sb3JWaWV3O1xuXG5QYW5lbFNjaGVtZUNvbG9yVmlldyA9IFBhbmVsU2NoZW1lSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiB7XG5cdFx0aW5wdXQ6ICcuZWxlbWVudG9yLXBhbmVsLXNjaGVtZS1jb2xvci12YWx1ZSdcblx0fSxcblxuXHRjaGFuZ2VVSVZhbHVlOiBmdW5jdGlvbiggbmV3VmFsdWUgKSB7XG5cdFx0dGhpcy51aS5pbnB1dC53cENvbG9yUGlja2VyKCAnY29sb3InLCBuZXdWYWx1ZSApO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnVpLmlucHV0LndwQ29sb3JQaWNrZXIoICdpbnN0YW5jZScgKSApIHtcblx0XHRcdHRoaXMudWkuaW5wdXQud3BDb2xvclBpY2tlciggJ2Nsb3NlJyApO1xuXHRcdH1cblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5pbnB1dC53cENvbG9yUGlja2VyKCB7XG5cdFx0XHRjaGFuZ2U6IF8uYmluZCggZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHRcdFx0dGhpcy50cmlnZ2VyTWV0aG9kKCAndmFsdWU6Y2hhbmdlJywgdWkuY29sb3IudG9TdHJpbmcoKSApO1xuXHRcdFx0fSwgdGhpcyApXG5cdFx0fSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxTY2hlbWVDb2xvclZpZXc7XG4iLCJ2YXIgUGFuZWxTY2hlbWVJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItcGFuZWwvcGFnZXMvc2NoZW1lcy9pdGVtcy9iYXNlJyApLFxuXHRQYW5lbFNjaGVtZVR5cG9ncmFwaHlWaWV3O1xuXG5QYW5lbFNjaGVtZVR5cG9ncmFwaHlWaWV3ID0gUGFuZWxTY2hlbWVJdGVtVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFBhbmVsU2NoZW1lSXRlbVZpZXcucHJvdG90eXBlLmNsYXNzTmFtZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRyZXR1cm4gY2xhc3NlcyArICcgZWxlbWVudG9yLXBhbmVsLWJveCc7XG5cdH0sXG5cblx0dWk6IHtcblx0XHRoZWFkaW5nOiAnLmVsZW1lbnRvci1wYW5lbC1oZWFkaW5nJyxcblx0XHRhbGxGaWVsZHM6ICcuZWxlbWVudG9yLXBhbmVsLXNjaGVtZS10eXBvZ3JhcGh5LWl0ZW0tZmllbGQnLFxuXHRcdGlucHV0RmllbGRzOiAnaW5wdXQuZWxlbWVudG9yLXBhbmVsLXNjaGVtZS10eXBvZ3JhcGh5LWl0ZW0tZmllbGQnLFxuXHRcdHNlbGVjdEZpZWxkczogJ3NlbGVjdC5lbGVtZW50b3ItcGFuZWwtc2NoZW1lLXR5cG9ncmFwaHktaXRlbS1maWVsZCcsXG5cdFx0c2VsZWN0RmFtaWx5RmllbGRzOiAnc2VsZWN0LmVsZW1lbnRvci1wYW5lbC1zY2hlbWUtdHlwb2dyYXBoeS1pdGVtLWZpZWxkW25hbWU9XCJmb250X2ZhbWlseVwiXSdcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQnaW5wdXQgQHVpLmlucHV0RmllbGRzJzogJ29uRmllbGRDaGFuZ2UnLFxuXHRcdCdjaGFuZ2UgQHVpLnNlbGVjdEZpZWxkcyc6ICdvbkZpZWxkQ2hhbmdlJyxcblx0XHQnY2xpY2sgQHVpLmhlYWRpbmcnOiAndG9nZ2xlVmlzaWJpbGl0eSdcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy51aS5pbnB1dEZpZWxkcy5hZGQoIHRoaXMudWkuc2VsZWN0RmllbGRzICkuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJHRoaXMgPSBCYWNrYm9uZS4kKCB0aGlzICksXG5cdFx0XHRcdG5hbWUgPSAkdGhpcy5hdHRyKCAnbmFtZScgKSxcblx0XHRcdFx0dmFsdWUgPSBzZWxmLm1vZGVsLmdldCggJ3ZhbHVlJyApWyBuYW1lIF07XG5cblx0XHRcdCR0aGlzLnZhbCggdmFsdWUgKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLnVpLnNlbGVjdEZhbWlseUZpZWxkcy5zZWxlY3QyKCB7XG5cdFx0XHRkaXI6IGVsZW1lbnRvci5jb25maWcuaXNfcnRsID8gJ3J0bCcgOiAnbHRyJ1xuXHRcdH0gKTtcblx0fSxcblxuXHR0b2dnbGVWaXNpYmlsaXR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLmhlYWRpbmcudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3Itb3BlbicgKTtcblx0fSxcblxuXHRjaGFuZ2VVSVZhbHVlOiBmdW5jdGlvbiggbmV3VmFsdWUgKSB7XG5cdFx0dGhpcy51aS5hbGxGaWVsZHMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJHRoaXMgPSBCYWNrYm9uZS4kKCB0aGlzICksXG5cdFx0XHRcdHRoaXNOYW1lID0gJHRoaXMuYXR0ciggJ25hbWUnICksXG5cdFx0XHRcdG5ld0ZpZWxkVmFsdWUgPSBuZXdWYWx1ZVsgdGhpc05hbWUgXTtcblxuXHRcdFx0JHRoaXMudmFsKCBuZXdGaWVsZFZhbHVlICkudHJpZ2dlciggJ2NoYW5nZScgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0b25GaWVsZENoYW5nZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkc2VsZWN0ID0gdGhpcy4kKCBldmVudC5jdXJyZW50VGFyZ2V0ICksXG5cdFx0XHRjdXJyZW50VmFsdWUgPSBlbGVtZW50b3IuaGVscGVycy5jbG9uZU9iamVjdCggdGhpcy5tb2RlbC5nZXQoICd2YWx1ZScgKSApLFxuXHRcdFx0ZmllbGRLZXkgPSAkc2VsZWN0LmF0dHIoICduYW1lJyApO1xuXG5cdFx0Y3VycmVudFZhbHVlWyBmaWVsZEtleSBdID0gJHNlbGVjdC52YWwoKTtcblxuXHRcdGlmICggJ2ZvbnRfZmFtaWx5JyA9PT0gZmllbGRLZXkgJiYgISBfLmlzRW1wdHkoIGN1cnJlbnRWYWx1ZVsgZmllbGRLZXkgXSApICkge1xuXHRcdFx0ZWxlbWVudG9yLmhlbHBlcnMuZW5xdWV1ZUZvbnQoIGN1cnJlbnRWYWx1ZVsgZmllbGRLZXkgXSApO1xuXHRcdH1cblxuXHRcdHRoaXMudHJpZ2dlck1ldGhvZCggJ3ZhbHVlOmNoYW5nZScsIGN1cnJlbnRWYWx1ZSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxTY2hlbWVUeXBvZ3JhcGh5VmlldztcbiIsInZhciBQYW5lbFNjaGVtZUJhc2VWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1wYW5lbC9wYWdlcy9zY2hlbWVzL2Jhc2UnICksXG5cdFBhbmVsU2NoZW1lVHlwb2dyYXBoeVZpZXc7XG5cblBhbmVsU2NoZW1lVHlwb2dyYXBoeVZpZXcgPSBQYW5lbFNjaGVtZUJhc2VWaWV3LmV4dGVuZCgge1xuXG5cdGdldENoaWxkVmlldzogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHJlcXVpcmUoICdlbGVtZW50b3ItcGFuZWwvcGFnZXMvc2NoZW1lcy9pdGVtcy90eXBvZ3JhcGh5JyApO1xuXHR9LFxuXG5cdGdldFR5cGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndHlwb2dyYXBoeSc7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbFNjaGVtZVR5cG9ncmFwaHlWaWV3O1xuIiwidmFyIEVkaXRNb2RlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLWxheW91dHMvZWRpdC1tb2RlJyApLFxuXHRQYW5lbExheW91dFZpZXc7XG5cblBhbmVsTGF5b3V0VmlldyA9IE1hcmlvbmV0dGUuTGF5b3V0Vmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItcGFuZWwnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXBhbmVsLWlubmVyJyxcblxuXHRyZWdpb25zOiB7XG5cdFx0Y29udGVudDogJyNlbGVtZW50b3ItcGFuZWwtY29udGVudC13cmFwcGVyJyxcblx0XHRoZWFkZXI6ICcjZWxlbWVudG9yLXBhbmVsLWhlYWRlci13cmFwcGVyJyxcblx0XHRmb290ZXI6ICcjZWxlbWVudG9yLXBhbmVsLWZvb3RlcicsXG5cdFx0bW9kZVN3aXRjaGVyOiAnI2VsZW1lbnRvci1tb2RlLXN3aXRjaGVyJ1xuXHR9LFxuXG5cdHBhZ2VzOiB7fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdjbGljazphZGQnOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXHRcdH0sXG5cdFx0J2VkaXRvcjpkZXN0cm95JzogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNldFBhZ2UoICdlbGVtZW50cycgKTtcblx0XHR9XG5cdH0sXG5cblx0Y3VycmVudFBhZ2VOYW1lOiBudWxsLFxuXG5cdF9pc1Njcm9sbGJhckluaXRpYWxpemVkOiBmYWxzZSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmluaXRQYWdlcygpO1xuXHR9LFxuXG5cdGluaXRQYWdlczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhZ2VzID0ge1xuXHRcdFx0ZWxlbWVudHM6IHtcblx0XHRcdFx0dmlldzogcmVxdWlyZSggJ2VsZW1lbnRvci1wYW5lbC9wYWdlcy9lbGVtZW50cy9lbGVtZW50cycgKSxcblx0XHRcdFx0dGl0bGU6ICc8aW1nIHNyYz1cIicgKyBlbGVtZW50b3IuY29uZmlnLmFzc2V0c191cmwgKyAnaW1hZ2VzL2xvZ28tcGFuZWwuc3ZnXCI+J1xuXHRcdFx0fSxcblx0XHRcdGVkaXRvcjoge1xuXHRcdFx0XHR2aWV3OiByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL2VkaXRvcicgKVxuXHRcdFx0fSxcblx0XHRcdG1lbnU6IHtcblx0XHRcdFx0dmlldzogcmVxdWlyZSggJ2VsZW1lbnRvci1wYW5lbC9wYWdlcy9tZW51L21lbnUnICksXG5cdFx0XHRcdHRpdGxlOiAnPGltZyBzcmM9XCInICsgZWxlbWVudG9yLmNvbmZpZy5hc3NldHNfdXJsICsgJ2ltYWdlcy9sb2dvLXBhbmVsLnN2Z1wiPidcblx0XHRcdH0sXG5cdFx0XHRjb2xvclNjaGVtZToge1xuXHRcdFx0XHR2aWV3OiByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL3NjaGVtZXMvY29sb3JzJyApXG5cdFx0XHR9LFxuXHRcdFx0dHlwb2dyYXBoeVNjaGVtZToge1xuXHRcdFx0XHR2aWV3OiByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL3NjaGVtZXMvdHlwb2dyYXBoeScgKVxuXHRcdFx0fSxcblx0XHRcdHJldmlzaW9uczoge1xuXHRcdFx0XHR2aWV3OiByZXF1aXJlKCAnZWxlbWVudG9yLXBhbmVsL3BhZ2VzL3JldmlzaW9ucycgKSxcblx0XHRcdFx0dGl0bGU6ICdSZXZpc2lvbnMnXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBzY2hlbWVzVHlwZXMgPSBPYmplY3Qua2V5cyggZWxlbWVudG9yLnNjaGVtZXMuZ2V0U2NoZW1lcygpICksXG5cdFx0XHRkaXNhYmxlZFNjaGVtZXMgPSBfLmRpZmZlcmVuY2UoIHNjaGVtZXNUeXBlcywgZWxlbWVudG9yLnNjaGVtZXMuZ2V0RW5hYmxlZFNjaGVtZXNUeXBlcygpICk7XG5cblx0XHRfLmVhY2goIGRpc2FibGVkU2NoZW1lcywgZnVuY3Rpb24oIHNjaGVtZVR5cGUgKSB7XG5cdFx0XHR2YXIgc2NoZW1lICA9IGVsZW1lbnRvci5zY2hlbWVzLmdldFNjaGVtZSggc2NoZW1lVHlwZSApO1xuXG5cdFx0XHRwYWdlc1sgc2NoZW1lVHlwZSArICdTY2hlbWUnIF0udmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3ItcGFuZWwvcGFnZXMvc2NoZW1lcy9kaXNhYmxlZCcgKS5leHRlbmQoIHtcblx0XHRcdFx0ZGlzYWJsZWRUaXRsZTogc2NoZW1lLmRpc2FibGVkX3RpdGxlXG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5wYWdlcyA9IHBhZ2VzO1xuXHR9LFxuXG5cdGdldEhlYWRlclZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldENoaWxkVmlldyggJ2hlYWRlcicgKTtcblx0fSxcblxuXHRnZXRDdXJyZW50UGFnZU5hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1cnJlbnRQYWdlTmFtZTtcblx0fSxcblxuXHRnZXRDdXJyZW50UGFnZVZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldENoaWxkVmlldyggJ2NvbnRlbnQnICk7XG5cdH0sXG5cblx0c2V0UGFnZTogZnVuY3Rpb24oIHBhZ2UsIHRpdGxlLCB2aWV3T3B0aW9ucyApIHtcblx0XHR2YXIgcGFnZURhdGEgPSB0aGlzLnBhZ2VzWyBwYWdlIF07XG5cblx0XHRpZiAoICEgcGFnZURhdGEgKSB7XG5cdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoICdFbGVtZW50b3IgcGFuZWwgZG9lc25cXCd0IGhhdmUgcGFnZSBuYW1lZCBcXCcnICsgcGFnZSArICdcXCcnICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zaG93Q2hpbGRWaWV3KCAnY29udGVudCcsIG5ldyBwYWdlRGF0YS52aWV3KCB2aWV3T3B0aW9ucyApICk7XG5cblx0XHR0aGlzLmdldEhlYWRlclZpZXcoKS5zZXRUaXRsZSggdGl0bGUgfHwgcGFnZURhdGEudGl0bGUgKTtcblxuXHRcdHRoaXMuY3VycmVudFBhZ2VOYW1lID0gcGFnZTtcblx0fSxcblxuXHRvbkJlZm9yZVNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBQYW5lbEZvb3Rlckl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci1sYXlvdXRzL3BhbmVsL2Zvb3RlcicgKSxcblx0XHRcdFBhbmVsSGVhZGVySXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLWxheW91dHMvcGFuZWwvaGVhZGVyJyApO1xuXG5cdFx0Ly8gRWRpdCBNb2RlXG5cdFx0dGhpcy5zaG93Q2hpbGRWaWV3KCAnbW9kZVN3aXRjaGVyJywgbmV3IEVkaXRNb2RlSXRlbVZpZXcoKSApO1xuXG5cdFx0Ly8gSGVhZGVyXG5cdFx0dGhpcy5zaG93Q2hpbGRWaWV3KCAnaGVhZGVyJywgbmV3IFBhbmVsSGVhZGVySXRlbVZpZXcoKSApO1xuXG5cdFx0Ly8gRm9vdGVyXG5cdFx0dGhpcy5zaG93Q2hpbGRWaWV3KCAnZm9vdGVyJywgbmV3IFBhbmVsRm9vdGVySXRlbVZpZXcoKSApO1xuXG5cdFx0Ly8gQWRkZWQgRWRpdG9yIGV2ZW50c1xuXHRcdHRoaXMudXBkYXRlU2Nyb2xsYmFyID0gXy50aHJvdHRsZSggdGhpcy51cGRhdGVTY3JvbGxiYXIsIDEwMCApO1xuXG5cdFx0dGhpcy5nZXRSZWdpb24oICdjb250ZW50JyApXG5cdFx0XHQub24oICdiZWZvcmU6c2hvdycsIF8uYmluZCggdGhpcy5vbkVkaXRvckJlZm9yZVNob3csIHRoaXMgKSApXG5cdFx0XHQub24oICdlbXB0eScsIF8uYmluZCggdGhpcy5vbkVkaXRvckVtcHR5LCB0aGlzICkgKVxuXHRcdFx0Lm9uKCAnc2hvdycsIF8uYmluZCggdGhpcy51cGRhdGVTY3JvbGxiYXIsIHRoaXMgKSApO1xuXG5cdFx0Ly8gU2V0IGRlZmF1bHQgcGFnZSB0byBlbGVtZW50c1xuXHRcdHRoaXMuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggZWxlbWVudG9yLmNoYW5uZWxzLmRhdGEsICdzY3JvbGxiYXI6dXBkYXRlJywgdGhpcy51cGRhdGVTY3JvbGxiYXIgKTtcblx0fSxcblxuXHRvbkVkaXRvckJlZm9yZVNob3c6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZGVmZXIoIF8uYmluZCggdGhpcy51cGRhdGVTY3JvbGxiYXIsIHRoaXMgKSApO1xuXHR9LFxuXG5cdG9uRWRpdG9yRW1wdHk6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlU2Nyb2xsYmFyKCk7XG5cdH0sXG5cblx0dXBkYXRlU2Nyb2xsYmFyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgJHBhbmVsID0gdGhpcy5jb250ZW50LiRlbDtcblxuXHRcdGlmICggISB0aGlzLl9pc1Njcm9sbGJhckluaXRpYWxpemVkICkge1xuXHRcdFx0JHBhbmVsLnBlcmZlY3RTY3JvbGxiYXIoKTtcblx0XHRcdHRoaXMuX2lzU2Nyb2xsYmFySW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0JHBhbmVsLnBlcmZlY3RTY3JvbGxiYXIoICd1cGRhdGUnICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbExheW91dFZpZXc7XG4iLCJ2YXIgVG9wQmFySXRlbVZpZXc7XG5cblRvcEJhckl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6ICcjdG1wbC1lbGVtZW50b3ItdG9wYmFyLWNvbnRlbnQnLFxuXG5cdHRhZ05hbWU6ICduYXYnLFxuXG5cdGlkOiAnZWxlbWVudG9yLXRvcGJhci10b29scycsXG5cblx0dWk6IHtcblx0XHRleGl0OiAnI2VsZW1lbnRvci10b3BiYXItZXhpdCcsXG5cdFx0bG9nbzogJyNlbGVtZW50b3ItdG9wYmFyLWxvZ28nLFxuXHRcdHJldmlzaW9uczogJyNlbGVtZW50b3ItdG9wYmFyLXJldmlzaW9ucycsXG5cdFx0ZGV2aWNlQnV0dG9uczogJy5lbGVtZW50b3ItdG9wYmFyLWRldmljZS1idG4nLFxuXHRcdHRlbXBsYXRlczogJyNlbGVtZW50b3ItdG9wYmFyLXRlbXBsYXRlcycsXG5cdFx0c3R5bGVzOiAnI2VsZW1lbnRvci10b3BiYXItc3R5bGVzJyxcblx0XHRuYXZpZ2F0b3I6ICcjZWxlbWVudG9yLXRvcGJhci1uYXZpZ2F0b3InLFxuXHRcdGluc3BlY3Q6ICcjZWxlbWVudG9yLXRvcGJhci1pbnNwZWN0Jyxcblx0XHRwcmV2aWV3OiAnI2VsZW1lbnRvci10b3BiYXItcHJldmlldycsXG5cdFx0c2F2ZTogJyNlbGVtZW50b3ItdG9wYmFyLXNhdmUnLFxuXHRcdHNhdmVJY29uOiAnI2VsZW1lbnRvci10b3BiYXItc2F2ZSAuZWxlbWVudG9yLXRvcGJhci1zYXZlLWljb24nXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5leGl0JzogJ29uQ2xpY2tFeGl0Jyxcblx0XHQnY2xpY2sgQHVpLmxvZ28nOiAnb25DbGlja0xvZ28nLFxuXHRcdCdjbGljayBAdWkucmV2aXNpb25zJzogJ29uQ2xpY2tSZXZpc2lvbnMnLFxuXHRcdCdjbGljayBAdWkuZGV2aWNlQnV0dG9ucyc6ICdvbkNsaWNrRGV2aWNlQnV0dG9uJyxcblx0XHQnY2xpY2sgQHVpLnRlbXBsYXRlcyc6ICdvbkNsaWNrVGVtcGxhdGVzJyxcblx0XHQnY2xpY2sgQHVpLnN0eWxlcyc6ICdvbkNsaWNrU3R5bGVzJyxcblx0XHQnY2xpY2sgQHVpLm5hdmlnYXRvcic6ICdvbkNsaWNrTmF2aWdhdG9yJyxcblx0XHQnY2xpY2sgQHVpLmluc3BlY3QnOiAnb25DbGlja0luc3BlY3QnLFxuXHRcdCdjbGljayBAdWkucHJldmlldyc6ICdvbkNsaWNrUHJldmlldycsXG5cdFx0J2NsaWNrIEB1aS5zYXZlJzogJ29uQ2xpY2tTYXZlJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2luaXRTYXZlRGlhbG9nKCk7XG5cdFx0dGhpcy5faW5pdEF1dG9zYXZlKCk7XG5cblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLCAnZWRpdG9yOmNoYW5nZWQnLCB0aGlzLm9uRWRpdG9yQ2hhbmdlZCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlLCAnY2hhbmdlJywgdGhpcy5vbkRldmljZU1vZGVDaGFuZ2UgKTtcblx0fSxcblxuXHRfaW5pdFNhdmVEaWFsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkaWFsb2c7XG5cblx0XHR0aGlzLmdldFNhdmVEaWFsb2cgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggISBkaWFsb2cgKSB7XG5cdFx0XHRcdHZhciAkID0gQmFja2JvbmUuJCxcblx0XHRcdFx0XHQkZGlhbG9nTWVzc2FnZSA9ICQoICc8ZGl2PicsIHtcblx0XHRcdFx0XHRcdCdjbGFzcyc6ICdlbGVtZW50b3ItZGlhbG9nLW1lc3NhZ2UnXG5cdFx0XHRcdFx0fSApLFxuXHRcdFx0XHRcdCRtZXNzYWdlSWNvbiA9ICQoICc8aT4nLCB7XG5cdFx0XHRcdFx0XHQnY2xhc3MnOiAnZmEgZmEtY2hlY2stY2lyY2xlJ1xuXHRcdFx0XHRcdH0gKSxcblx0XHRcdFx0XHQkbWVzc2FnZVRleHQgPSAkKCAnPGRpdj4nLCB7XG5cdFx0XHRcdFx0XHQnY2xhc3MnOiAnZWxlbWVudG9yLWRpYWxvZy1tZXNzYWdlLXRleHQnXG5cdFx0XHRcdFx0fSApLnRleHQoIGVsZW1lbnRvci50cmFuc2xhdGUoICdzYXZlZCcgKSApO1xuXG5cdFx0XHRcdCRkaWFsb2dNZXNzYWdlLmFwcGVuZCggJG1lc3NhZ2VJY29uLCAkbWVzc2FnZVRleHQgKTtcblxuXHRcdFx0XHRkaWFsb2cgPSBlbGVtZW50b3IuZGlhbG9nc01hbmFnZXIuY3JlYXRlV2lkZ2V0KCAncG9wdXAnLCB7XG5cdFx0XHRcdFx0aGlkZToge1xuXHRcdFx0XHRcdFx0ZGVsYXk6IDE1MDBcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRkaWFsb2cuc2V0TWVzc2FnZSggJGRpYWxvZ01lc3NhZ2UgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGRpYWxvZztcblx0XHR9O1xuXHR9LFxuXG5cdF9pbml0QXV0b3NhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdC8vIEF1dG9zYXZlIGV2ZXJ5IDYwIHNlY29uZHMgd2hlbiB0aGVyZSBhcmUgdW5zYXZlZCBjaGFuZ2VzXG5cdFx0dGhpcy5fYXV0b3NhdmVJbnRlcnZhbCA9IHNldEludGVydmFsKCBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggZWxlbWVudG9yLmlzRWRpdG9yQ2hhbmdlZCgpICkge1xuXHRcdFx0XHRzZWxmLl9kb0F1dG9zYXZlKCk7XG5cdFx0XHR9XG5cdFx0fSwgNjAwMDAgKTtcblx0fSxcblxuXHRfZG9BdXRvc2F2ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbmZpZyA9IGVsZW1lbnRvci5jb25maWcsXG5cdFx0XHRkYXRhID0gZWxlbWVudG9yLmVsZW1lbnRzLnRvSlNPTigpO1xuXG5cdFx0aWYgKCAhIGRhdGEgfHwgISBkYXRhLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRCYWNrYm9uZS4kLmFqYXgoIHtcblx0XHRcdHVybDogY29uZmlnLmFqYXh1cmwgKyAnJmFjdGlvbj1TYXZlQXV0b3NhdmUnLFxuXHRcdFx0dHlwZTogJ1BPU1QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRlbnRpdHlfdHlwZTogY29uZmlnLnBhZ2VfdHlwZSxcblx0XHRcdFx0ZW50aXR5X2lkOiBjb25maWcucG9zdF9pZCxcblx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoIGRhdGEgKVxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRvbkNsaWNrRXhpdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCBlbGVtZW50b3IuaXNFZGl0b3JDaGFuZ2VkKCkgKSB7XG5cdFx0XHR2YXIgZGlhbG9nID0gZWxlbWVudG9yLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2NvbmZpcm0nLCB7XG5cdFx0XHRcdGhlYWRlck1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdjaGFuZ2VzX2xvc3QnICksXG5cdFx0XHRcdG1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdkaWFsb2dfY29uZmlybV9jaGFuZ2VzX2xvc3QnICksXG5cdFx0XHRcdHN0cmluZ3M6IHtcblx0XHRcdFx0XHRjb25maXJtOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnZ29fYmFjaycgKSxcblx0XHRcdFx0XHRjYW5jZWw6IGVsZW1lbnRvci50cmFuc2xhdGUoICdjYW5jZWwnIClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Db25maXJtOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSBlbGVtZW50b3IuY29uZmlnLmVkaXRfcG9zdF9saW5rO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0XHRkaWFsb2cuc2hvdygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSBlbGVtZW50b3IuY29uZmlnLmVkaXRfcG9zdF9saW5rO1xuXHRcdH1cblx0fSxcblxuXHRvbkNsaWNrTG9nbzogZnVuY3Rpb24oIGUgKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHdpbmRvdy5sb2NhdGlvbiA9IGVsZW1lbnRvci5jb25maWcuZWRpdF9wb3N0X2xpbms7XG5cdH0sXG5cblx0b25DbGlja1JldmlzaW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhbmVsID0gZWxlbWVudG9yLmdldFBhbmVsVmlldygpO1xuXHRcdGlmICggcGFuZWwuZ2V0Q3VycmVudFBhZ2VOYW1lKCkgPT09ICdyZXZpc2lvbnMnICkge1xuXHRcdFx0cGFuZWwuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYW5lbC5zZXRQYWdlKCAncmV2aXNpb25zJywgJ1JldmlzaW9ucycgKTtcblx0XHR9XG5cdH0sXG5cblx0b25DbGlja0RldmljZUJ1dHRvbjogZnVuY3Rpb24oIGUgKSB7XG5cdFx0dmFyIG5ld0RldmljZU1vZGUgPSBCYWNrYm9uZS4kKCBlLmN1cnJlbnRUYXJnZXQgKS5kYXRhKCAnZGV2aWNlLW1vZGUnICk7XG5cdFx0ZWxlbWVudG9yLmNoYW5nZURldmljZU1vZGUoIG5ld0RldmljZU1vZGUgKTtcblx0fSxcblxuXHRvbkNsaWNrTmF2aWdhdG9yOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLm5hdmlnYXRvci50b2dnbGVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZWRpdG9yLnRyaWdnZXIoICduYXZpZ2F0b3I6dG9nZ2xlJyApO1xuXHR9LFxuXG5cdG9uQ2xpY2tUZW1wbGF0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc3RhcnRNb2RhbCggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnNob3dUZW1wbGF0ZXMoKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0b25DbGlja1N0eWxlczogZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5zdGFydE1vZGFsKCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRvci5zdHlsZUxpYnJhcnkuc2hvd1N0eWxlcygpO1xuXHRcdH0gKTtcblx0fSxcblxuXHRvbkNsaWNrSW5zcGVjdDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gVG9nZ2xlIGluc3BlY3QgbW9kZSB2aWEgdGhlIHBhbmVsIGZvb3RlciAoZGVsZWdhdGVzIHRvIGV4aXN0aW5nIGxvZ2ljKVxuXHRcdHZhciAkaW5zcGVjdEJ0biA9IEJhY2tib25lLiQoICcjZWxlbWVudG9yLXBhbmVsLWZvb3Rlci1pbnNwZWN0JyApO1xuXHRcdGlmICggJGluc3BlY3RCdG4ubGVuZ3RoICkge1xuXHRcdFx0JGluc3BlY3RCdG4udHJpZ2dlciggJ2NsaWNrJyApO1xuXHRcdH1cblx0XHR0aGlzLnVpLmluc3BlY3QudG9nZ2xlQ2xhc3MoICdhY3RpdmUnICk7XG5cdH0sXG5cblx0b25DbGlja1ByZXZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdGNvbmZpZyA9IGVsZW1lbnRvci5jb25maWcsXG5cdFx0XHQkID0gQmFja2JvbmUuJDtcblxuXHRcdC8vIFN0ZXAgMTogYXV0b3NhdmUgY3VycmVudCBjb250ZW50XG5cdFx0dmFyIGRhdGEgPSBlbGVtZW50b3IuZWxlbWVudHMudG9KU09OKCk7XG5cdFx0aWYgKCAhIGRhdGEgfHwgISBkYXRhLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRzZWxmLnVpLnByZXZpZXcuYWRkQ2xhc3MoICdhY3RpdmUnICk7XG5cblx0XHQkLmFqYXgoIHtcblx0XHRcdHVybDogY29uZmlnLmFqYXh1cmwgKyAnJmFjdGlvbj1TYXZlQXV0b3NhdmUnLFxuXHRcdFx0dHlwZTogJ1BPU1QnLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRlbnRpdHlfdHlwZTogY29uZmlnLnBhZ2VfdHlwZSxcblx0XHRcdFx0ZW50aXR5X2lkOiBjb25maWcucG9zdF9pZCxcblx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoIGRhdGEgKVxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBTdGVwIDI6IGdldCB0aGUgZnJvbnQtb2ZmaWNlIHByZXZpZXcgVVJMXG5cdFx0XHRcdCQuYWpheCgge1xuXHRcdFx0XHRcdHVybDogY29uZmlnLmFqYXh1cmwgKyAnJmFjdGlvbj1HZXRQcmV2aWV3VXJsJyxcblx0XHRcdFx0XHR0eXBlOiAnUE9TVCcsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0cGFnZV90eXBlOiBjb25maWcucGFnZV90eXBlLFxuXHRcdFx0XHRcdFx0cGFnZV9pZDogY29uZmlnLnBvc3RfaWQsXG5cdFx0XHRcdFx0XHRjb250ZW50X3R5cGU6IGNvbmZpZy5jb250ZW50X3R5cGUsXG5cdFx0XHRcdFx0XHRpZF9sYW5nOiBjb25maWcuaWRfbGFuZ1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRcdFx0c2VsZi51aS5wcmV2aWV3LnJlbW92ZUNsYXNzKCAnYWN0aXZlJyApO1xuXHRcdFx0XHRcdFx0aWYgKCByZXNwb25zZS5zdWNjZXNzICYmIHJlc3BvbnNlLnVybCApIHtcblx0XHRcdFx0XHRcdFx0d2luZG93Lm9wZW4oIHJlc3BvbnNlLnVybCwgJ19ibGFuaycgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHNlbGYudWkucHJldmlldy5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdH0sXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbGYudWkucHJldmlldy5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblx0b25DbGlja1NhdmU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHNlbGYudWkuc2F2ZS5hZGRDbGFzcyggJ2VsZW1lbnRvci10b3BiYXItc2F2ZS1sb2FkaW5nJyApO1xuXG5cdFx0dmFyIG9wdGlvbnMgPSB7XG5cdFx0XHRyZXZpc2lvbjogJ3B1Ymxpc2gnLFxuXHRcdFx0b25TdWNjZXNzOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi5nZXRTYXZlRGlhbG9nKCkuc2hvdygpO1xuXHRcdFx0XHRzZWxmLnVpLnNhdmUucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItdG9wYmFyLXNhdmUtbG9hZGluZycgKTtcblxuXHRcdFx0XHQvLyBSZWZyZXNoIHJldmlzaW9ucyBwYW5lbCBpZiBjdXJyZW50bHkgZGlzcGxheWVkXG5cdFx0XHRcdHZhciBwYW5lbCA9IGVsZW1lbnRvci5nZXRQYW5lbFZpZXcoKTtcblx0XHRcdFx0aWYgKCBwYW5lbC5nZXRDdXJyZW50UGFnZU5hbWUoKSA9PT0gJ3JldmlzaW9ucycgKSB7XG5cdFx0XHRcdFx0cGFuZWwuc2V0UGFnZSggJ3JldmlzaW9ucycsICdSZXZpc2lvbnMnICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0ZWxlbWVudG9yLnNhdmVCdWlsZGVyKCBvcHRpb25zICk7XG5cdH0sXG5cblx0b25FZGl0b3JDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnNhdmUudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3ItdG9wYmFyLXNhdmUtYWN0aXZlJywgZWxlbWVudG9yLmlzRWRpdG9yQ2hhbmdlZCgpICk7XG5cdH0sXG5cblx0b25EZXZpY2VNb2RlQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcHJldmlvdXNEZXZpY2VNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGUucmVxdWVzdCggJ3ByZXZpb3VzTW9kZScgKSxcblx0XHRcdGN1cnJlbnREZXZpY2VNb2RlID0gZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGUucmVxdWVzdCggJ2N1cnJlbnRNb2RlJyApO1xuXG5cdFx0dGhpcy51aS5kZXZpY2VCdXR0b25zLmZpbHRlciggJ1tkYXRhLWRldmljZS1tb2RlPVwiJyArIHByZXZpb3VzRGV2aWNlTW9kZSArICdcIl0nICkucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0dGhpcy51aS5kZXZpY2VCdXR0b25zLmZpbHRlciggJ1tkYXRhLWRldmljZS1tb2RlPVwiJyArIGN1cnJlbnREZXZpY2VNb2RlICsgJ1wiXScgKS5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0fSxcblxuXHRvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5fYXV0b3NhdmVJbnRlcnZhbCApIHtcblx0XHRcdGNsZWFySW50ZXJ2YWwoIHRoaXMuX2F1dG9zYXZlSW50ZXJ2YWwgKTtcblx0XHR9XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3BCYXJJdGVtVmlldztcbiIsInZhciBCYXNlU2V0dGluZ3NNb2RlbDtcblxuQmFzZVNldHRpbmdzTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHR0aGlzLmNvbnRyb2xzID0gZWxlbWVudG9yLmdldEVsZW1lbnRDb250cm9scyggdGhpcyApO1xuXHRcdGlmICggISB0aGlzLmNvbnRyb2xzICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBhdHRycyA9IGRhdGEgfHwge30sXG5cdFx0XHRkZWZhdWx0cyA9IHt9O1xuXG5cdFx0Xy5lYWNoKCB0aGlzLmNvbnRyb2xzLCBmdW5jdGlvbiggZmllbGQgKSB7XG5cdFx0XHR2YXIgY29udHJvbCA9IGVsZW1lbnRvci5jb25maWcuY29udHJvbHNbIGZpZWxkLnR5cGUgXTtcblxuXHRcdFx0aWYgKCBfLmlzT2JqZWN0KCBjb250cm9sLmRlZmF1bHRfdmFsdWUgKSAgKSB7XG5cdFx0XHRcdGRlZmF1bHRzWyBmaWVsZC5uYW1lIF0gPSBfLmV4dGVuZCgge30sIGNvbnRyb2wuZGVmYXVsdF92YWx1ZSwgZmllbGRbJ2RlZmF1bHQnXSB8fCB7fSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVmYXVsdHNbIGZpZWxkLm5hbWUgXSA9IGZpZWxkWydkZWZhdWx0J10gfHwgY29udHJvbC5kZWZhdWx0X3ZhbHVlO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHRoaXMuZGVmYXVsdHMgPSBkZWZhdWx0cztcblxuXHRcdC8vIEFwcGx5IGRlZmF1bHQgc3R5bGUgd2hlbiBjcmVhdGluZyBhIG5ldyB3aWRnZXQgKGVtcHR5IHNldHRpbmdzKVxuXHRcdHZhciB3aWRnZXRUeXBlID0gYXR0cnMud2lkZ2V0VHlwZTtcblx0XHR2YXIgaXNOZXdXaWRnZXQgPSB3aWRnZXRUeXBlICYmIHRoaXMuX2NvdW50VXNlcktleXMoIGF0dHJzICkgPT09IDA7XG5cblx0XHRpZiAoIGlzTmV3V2lkZ2V0ICkge1xuXHRcdFx0dmFyIGRlZmF1bHRTdHlsZSA9IHRoaXMuX2ZpbmREZWZhdWx0U3R5bGUoIHdpZGdldFR5cGUgKTtcblxuXHRcdFx0aWYgKCBkZWZhdWx0U3R5bGUgKSB7XG5cdFx0XHRcdGF0dHJzID0gXy5kZWZhdWx0cygge30sIGRlZmF1bHRTdHlsZSwgZGVmYXVsdHMgKTtcblx0XHRcdFx0YXR0cnMud2lkZ2V0VHlwZSA9IHdpZGdldFR5cGU7XG5cdFx0XHRcdGlmICggZGF0YSAmJiBkYXRhLmVsVHlwZSApIHtcblx0XHRcdFx0XHRhdHRycy5lbFR5cGUgPSBkYXRhLmVsVHlwZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGRhdGEgJiYgZGF0YS5pc0lubmVyICkge1xuXHRcdFx0XHRcdGF0dHJzLmlzSW5uZXIgPSBkYXRhLmlzSW5uZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBUT0RPOiBDaGFuZ2UgbWV0aG9kIHRvIHJlY3Vyc2l2ZVxuXHRcdGF0dHJzID0gXy5kZWZhdWx0cygge30sIGF0dHJzLCBkZWZhdWx0cyApO1xuXG5cdFx0Xy5lYWNoKCB0aGlzLmNvbnRyb2xzLCBmdW5jdGlvbiggZmllbGQgKSB7XG5cdFx0XHRpZiAoICdyZXBlYXRlcicgPT09IGZpZWxkLnR5cGUgKSB7XG5cdFx0XHRcdGF0dHJzWyBmaWVsZC5uYW1lIF0gPSBuZXcgQmFja2JvbmUuQ29sbGVjdGlvbiggYXR0cnNbIGZpZWxkLm5hbWUgXSwge1xuXHRcdFx0XHRcdG1vZGVsOiBCYXNlU2V0dGluZ3NNb2RlbFxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5zZXQoIGF0dHJzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENvdW50IGtleXMgaW4gc2V0dGluZ3MgZGF0YSB0aGF0IGFyZSBub3Qgc3lzdGVtL21ldGEga2V5cy5cblx0ICogVXNlZCB0byBkZXRlY3QgaWYgYSB3aWRnZXQgd2FzIGp1c3QgY3JlYXRlZCAoZW1wdHkgdXNlciBzZXR0aW5ncykuXG5cdCAqL1xuXHRfY291bnRVc2VyS2V5czogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIG1ldGFLZXlzID0gWyAnd2lkZ2V0VHlwZScsICdlbFR5cGUnLCAnaXNJbm5lcicgXTtcblx0XHR2YXIgY291bnQgPSAwO1xuXG5cdFx0Xy5lYWNoKCBkYXRhLCBmdW5jdGlvbiggdmFsdWUsIGtleSApIHtcblx0XHRcdGlmICggISBfLmNvbnRhaW5zKCBtZXRhS2V5cywga2V5ICkgKSB7XG5cdFx0XHRcdGNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIGNvdW50O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBGaW5kIHRoZSBkZWZhdWx0IHN0eWxlIHNldHRpbmdzIGZvciBhIGdpdmVuIHdpZGdldCB0eXBlXG5cdCAqIGZyb20gdGhlIHdpZGdldFN0eWxlcyBjb25maWcgYXJyYXkuXG5cdCAqL1xuXHRfZmluZERlZmF1bHRTdHlsZTogZnVuY3Rpb24oIHdpZGdldFR5cGUgKSB7XG5cdFx0aWYgKCAhIGVsZW1lbnRvci5jb25maWcgfHwgISBlbGVtZW50b3IuY29uZmlnLndpZGdldFN0eWxlcyApIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdHZhciBzdHlsZXMgPSBlbGVtZW50b3IuY29uZmlnLndpZGdldFN0eWxlcztcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHN0eWxlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdGlmICggc3R5bGVzWyBpIF0ud2lkZ2V0X3R5cGUgPT09IHdpZGdldFR5cGUgJiYgc3R5bGVzWyBpIF0uaXNfZGVmYXVsdCApIHtcblx0XHRcdFx0cmV0dXJuIHN0eWxlc1sgaSBdLnNldHRpbmdzIHx8IG51bGw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblx0Z2V0Rm9udENvbnRyb2xzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5maWx0ZXIoIHRoaXMuY29udHJvbHMsIF8uYmluZCggZnVuY3Rpb24oIGNvbnRyb2wgKSB7XG5cdFx0XHRyZXR1cm4gJ2ZvbnQnID09PSBjb250cm9sLnR5cGU7XG5cdFx0fSwgdGhpcyApICk7XG5cdH0sXG5cblx0Z2V0U3R5bGVDb250cm9sczogZnVuY3Rpb24oIGNvbnRyb2xzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdGNvbnRyb2xzID0gY29udHJvbHMgfHwgc2VsZi5jb250cm9scztcblxuXHRcdHJldHVybiBfLmZpbHRlciggY29udHJvbHMsIGZ1bmN0aW9uKCBjb250cm9sICkge1xuXHRcdFx0aWYgKCBjb250cm9sLmZpZWxkcyApIHtcblx0XHRcdFx0Y29udHJvbC5zdHlsZUZpZWxkcyA9IHNlbGYuZ2V0U3R5bGVDb250cm9scyggY29udHJvbC5maWVsZHMgKTtcblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlbGYuaXNTdHlsZUNvbnRyb2woIGNvbnRyb2wubmFtZSwgY29udHJvbHMgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0aXNTdHlsZUNvbnRyb2w6IGZ1bmN0aW9uKCBhdHRyaWJ1dGUsIGNvbnRyb2xzICkge1xuXHRcdGNvbnRyb2xzID0gY29udHJvbHMgfHwgdGhpcy5jb250cm9scztcblxuXHRcdHZhciBjdXJyZW50Q29udHJvbCA9IF8uZmluZCggY29udHJvbHMsIGZ1bmN0aW9uKCBjb250cm9sICkge1xuXHRcdFx0cmV0dXJuIGF0dHJpYnV0ZSA9PT0gY29udHJvbC5uYW1lO1xuXHRcdH0gKTtcblxuXHRcdHJldHVybiBjdXJyZW50Q29udHJvbCAmJiAhIF8uaXNFbXB0eSggY3VycmVudENvbnRyb2wuc2VsZWN0b3JzICk7XG5cdH0sXG5cblx0Z2V0Q2xhc3NDb250cm9sczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZmlsdGVyKCB0aGlzLmNvbnRyb2xzLCBfLmJpbmQoIGZ1bmN0aW9uKCBjb250cm9sICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuaXNDbGFzc0NvbnRyb2woIGNvbnRyb2wubmFtZSApO1xuXHRcdH0sIHRoaXMgKSApO1xuXHR9LFxuXG5cdGlzQ2xhc3NDb250cm9sOiBmdW5jdGlvbiggYXR0cmlidXRlICkge1xuXHRcdHZhciBjdXJyZW50Q29udHJvbCA9IF8uZmluZCggdGhpcy5jb250cm9scywgZnVuY3Rpb24oIGNvbnRyb2wgKSB7XG5cdFx0XHRyZXR1cm4gYXR0cmlidXRlID09PSBjb250cm9sLm5hbWU7XG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIGN1cnJlbnRDb250cm9sICYmICEgXy5pc1VuZGVmaW5lZCggY3VycmVudENvbnRyb2wucHJlZml4X2NsYXNzICk7XG5cdH0sXG5cblx0Z2V0Q29udHJvbDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHJldHVybiBfLmZpbmQoIHRoaXMuY29udHJvbHMsIGZ1bmN0aW9uKCBjb250cm9sICkge1xuXHRcdFx0cmV0dXJuIGlkID09PSBjb250cm9sLm5hbWU7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGNsb25lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gbmV3IEJhc2VTZXR0aW5nc01vZGVsKCBlbGVtZW50b3IuaGVscGVycy5jbG9uZU9iamVjdCggdGhpcy5hdHRyaWJ1dGVzICkgKTtcblx0fSxcblxuXHR0b0pTT046IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIGRhdGEgPSBCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUudG9KU09OLmNhbGwoIHRoaXMgKTtcblxuXHRcdGRlbGV0ZSBkYXRhLndpZGdldFR5cGU7XG5cdFx0ZGVsZXRlIGRhdGEuZWxUeXBlO1xuXHRcdGRlbGV0ZSBkYXRhLmlzSW5uZXI7XG5cblx0XHRfLmVhY2goIGRhdGEsIGZ1bmN0aW9uKCBhdHRyaWJ1dGUsIGtleSApIHtcblx0XHRcdGlmICggYXR0cmlidXRlICYmIGF0dHJpYnV0ZS50b0pTT04gKSB7XG5cdFx0XHRcdGRhdGFbIGtleSBdID0gYXR0cmlidXRlLnRvSlNPTigpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHJldHVybiBkYXRhO1xuXHR9LFxuXG5cdHRvSlNPTkNsZWFuZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkYXRhID0gQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnRvSlNPTkNsZWFuZWQuY2FsbCggdGhpcyApO1xuXG5cdFx0ZGVsZXRlIGRhdGEud2lkZ2V0VHlwZTtcblx0XHRkZWxldGUgZGF0YS5lbFR5cGU7XG5cdFx0ZGVsZXRlIGRhdGEuaXNJbm5lcjtcblxuXHRcdC8vIHJlbW92ZSBlbXB0eSB2YWx1ZXNcblx0XHRkYXRhID0gdGhpcy5jbGVhbkVtcHR5VmFsdWVzKGRhdGEpO1xuXG5cblx0XHRjb25zb2xlLmxvZyhkYXRhKTtcblx0XHRfLmVhY2goIGRhdGEsIGZ1bmN0aW9uKCBhdHRyaWJ1dGUsIGtleSApIHtcblx0XHRcdGlmICggYXR0cmlidXRlICYmIGF0dHJpYnV0ZS50b0pTT04gKSB7XG5cdFx0XHRcdGRhdGFbIGtleSBdID0gYXR0cmlidXRlLnRvSlNPTigpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH0sXG5cblx0Y2xlYW5FbXB0eVZhbHVlczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdGZ1bmN0aW9uIGNsZWFuRW1wdHlWYWx1ZXMoZGF0YSkge1xuXHRcdFx0Ly8gU2kgdGFibGVhdSDihpIgbmV0dG95ZXIgY2hhcXVlIGVudHLDqWVcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG5cdFx0XHRcdGNvbnN0IGNsZWFuZWRBcnJheSA9IGRhdGFcblx0XHRcdFx0XHQubWFwKGl0ZW0gPT4gY2xlYW5FbXB0eVZhbHVlcyhpdGVtKSkgICAgICAgICAgIC8vIG5ldHRveWFnZSByw6ljdXJzaWZcblx0XHRcdFx0XHQuZmlsdGVyKGl0ZW0gPT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdXBwcmVzc2lvbiBkZXMgZW50csOpZXMgdmlkZXNcblx0XHRcdFx0XHRcdGl0ZW0gIT09IG51bGwgJiZcblx0XHRcdFx0XHRcdGl0ZW0gIT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHRcdFx0aXRlbSAhPT0gJycgJiZcblx0XHRcdFx0XHRcdCEodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmIE9iamVjdC5rZXlzKGl0ZW0pLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdHJldHVybiBjbGVhbmVkQXJyYXkubGVuZ3RoID4gMCA/IGNsZWFuZWRBcnJheSA6IFtdOyAgLy8gcmV0b3VybmUgdGFibGVhdSB2aWRlIHNpIHZpZGVcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2kgb2JqZXQg4oaSIG5ldHRveWVyIGNoYXF1ZSBjbMOpXG5cdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnICYmIGRhdGEgIT09IG51bGwpIHtcblx0XHRcdFx0Y29uc3QgY2xlYW5lZE9iaiA9IHt9O1xuXG5cdFx0XHRcdE9iamVjdC5rZXlzKGRhdGEpLmZvckVhY2goa2V5ID0+IHtcblx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IGNsZWFuRW1wdHlWYWx1ZXMoZGF0YVtrZXldKTtcblxuXHRcdFx0XHRcdGNvbnN0IGlzRW1wdHkgPVxuXHRcdFx0XHRcdFx0dmFsdWUgPT09IG51bGwgfHxcblx0XHRcdFx0XHRcdHZhbHVlID09PSB1bmRlZmluZWQgfHxcblx0XHRcdFx0XHRcdHZhbHVlID09PSAnJyB8fFxuXHRcdFx0XHRcdFx0KEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkgfHxcblx0XHRcdFx0XHRcdCh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoID09PSAwKTtcblxuXHRcdFx0XHRcdGlmICghaXNFbXB0eSkge1xuXHRcdFx0XHRcdFx0Y2xlYW5lZE9ialtrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gY2xlYW5lZE9iajtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVmFsZXVyIHByaW1pdGl2ZSDihpIgcmV0b3VybmVyIHRlbCBxdWVsXG5cdFx0XHRyZXR1cm4gZGF0YTtcblx0XHR9XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlU2V0dGluZ3NNb2RlbDsiLCJ2YXIgQmFzZVNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9iYXNlLXNldHRpbmdzJyApLFxuXHRDb2x1bW5TZXR0aW5nc01vZGVsO1xuXG5Db2x1bW5TZXR0aW5nc01vZGVsID0gQmFzZVNldHRpbmdzTW9kZWwuZXh0ZW5kKCB7XG5cdGRlZmF1bHRzOiB7XG5cdFx0X2lubGluZV9zaXplOiAnJyxcblx0XHRfY29sdW1uX3NpemU6IDEwMFxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sdW1uU2V0dGluZ3NNb2RlbDtcbiIsInZhciBCYXNlU2V0dGluZ3NNb2RlbCA9IHJlcXVpcmUoICdlbGVtZW50b3ItbW9kZWxzL2Jhc2Utc2V0dGluZ3MnICksXG5cdFdpZGdldFNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy93aWRnZXQtc2V0dGluZ3MnICksXG5cdENvbHVtblNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9jb2x1bW4tc2V0dGluZ3MnICksXG5cdFJvd1NldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9yb3ctc2V0dGluZ3MnICksXG5cdFNlY3Rpb25TZXR0aW5nc01vZGVsID0gcmVxdWlyZSggJ2VsZW1lbnRvci1tb2RlbHMvc2VjdGlvbi1zZXR0aW5ncycgKSxcblxuXHRFbGVtZW50TW9kZWwsXG5cdEVsZW1lbnRDb2xsZWN0aW9uO1xuXG5FbGVtZW50TW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblx0ZGVmYXVsdHM6IHtcblx0XHRpZDogJycsXG5cdFx0ZWxUeXBlOiAnJyxcblx0XHRpc0lubmVyOiBmYWxzZSxcblx0XHRzZXR0aW5nczoge30sXG5cdFx0ZGVmYXVsdEVkaXRTZXR0aW5nczoge31cblx0fSxcblxuXHRyZW1vdGVSZW5kZXI6IGZhbHNlLFxuXHRfaHRtbENhY2hlOiBudWxsLFxuXHRfanF1ZXJ5WGhyOiBudWxsLFxuXHRyZW5kZXJPbkxlYXZlOiBmYWxzZSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHR2YXIgZWxlbWVudHMgPSB0aGlzLmdldCggJ2VsZW1lbnRzJyApLFxuXHRcdFx0ZWxUeXBlID0gdGhpcy5nZXQoICdlbFR5cGUnICksXG5cdFx0XHRzZXR0aW5ncztcblxuXHRcdHZhciBzZXR0aW5nTW9kZWxzID0ge1xuXHRcdFx0d2lkZ2V0OiBXaWRnZXRTZXR0aW5nc01vZGVsLFxuXHRcdFx0Y29sdW1uOiBDb2x1bW5TZXR0aW5nc01vZGVsLFxuXHRcdFx0cm93OiBSb3dTZXR0aW5nc01vZGVsLFxuXHRcdFx0c2VjdGlvbjogU2VjdGlvblNldHRpbmdzTW9kZWxcblx0XHR9O1xuXG5cdFx0dmFyIFNldHRpbmdzTW9kZWwgPSBzZXR0aW5nTW9kZWxzWyBlbFR5cGUgXSB8fCBCYXNlU2V0dGluZ3NNb2RlbDtcblxuXHRcdHNldHRpbmdzID0gdGhpcy5nZXQoICdzZXR0aW5ncycgKSB8fCB7fTtcblx0XHRpZiAoICd3aWRnZXQnID09PSBlbFR5cGUgKSB7XG5cdFx0XHRzZXR0aW5ncy53aWRnZXRUeXBlID0gdGhpcy5nZXQoICd3aWRnZXRUeXBlJyApO1xuXHRcdH1cblxuXHRcdHNldHRpbmdzLmVsVHlwZSA9IGVsVHlwZTtcblx0XHRzZXR0aW5ncy5pc0lubmVyID0gdGhpcy5nZXQoICdpc0lubmVyJyApO1xuXG5cdFx0c2V0dGluZ3MgPSBuZXcgU2V0dGluZ3NNb2RlbCggc2V0dGluZ3MgKTtcblx0XHR0aGlzLnNldCggJ3NldHRpbmdzJywgc2V0dGluZ3MgKTtcblxuXHRcdHRoaXMuaW5pdEVkaXRTZXR0aW5ncygpO1xuXG5cdFx0aWYgKCB1bmRlZmluZWQgIT09IGVsZW1lbnRzICkge1xuXHRcdFx0dGhpcy5zZXQoICdlbGVtZW50cycsIG5ldyBFbGVtZW50Q29sbGVjdGlvbiggZWxlbWVudHMgKSApO1xuXHRcdH1cblxuXHRcdGlmICggJ3dpZGdldCcgPT09IHRoaXMuZ2V0KCAnZWxUeXBlJyApICkge1xuXHRcdFx0dGhpcy5yZW1vdGVSZW5kZXIgPSB0cnVlO1xuXHRcdFx0dGhpcy5zZXRIdG1sQ2FjaGUoIG9wdGlvbnMuaHRtbENhY2hlIHx8ICcnICk7XG5cdFx0fVxuXG5cdFx0Ly8gTm8gbmVlZCB0aGlzIHZhcmlhYmxlIGFueW1vcmVcblx0XHRkZWxldGUgb3B0aW9ucy5odG1sQ2FjaGU7XG5cblx0XHQvLyBNYWtlIGNhbGwgdG8gcmVtb3RlIHNlcnZlciBhcyB0aHJvdHRsZSBmdW5jdGlvblxuXHRcdHRoaXMucmVuZGVyUmVtb3RlU2VydmVyID0gXy50aHJvdHRsZSggdGhpcy5yZW5kZXJSZW1vdGVTZXJ2ZXIsIDEwMDAgKTtcblxuXHRcdHRoaXMub24oICdkZXN0cm95JywgdGhpcy5vbkRlc3Ryb3kgKTtcblx0XHR0aGlzLm9uKCAnZWRpdG9yOmNsb3NlJywgdGhpcy5vbkNsb3NlRWRpdG9yICk7XG5cdH0sXG5cblx0aW5pdEVkaXRTZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXQoICdlZGl0U2V0dGluZ3MnLCBuZXcgQmFja2JvbmUuTW9kZWwoIHRoaXMuZ2V0KCAnZGVmYXVsdEVkaXRTZXR0aW5ncycgKSApICk7XG5cdH0sXG5cblx0b25EZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHQvLyBDbGVhbiB0aGUgbWVtb3J5IGZvciBhbGwgdXNlIGluc3RhbmNlc1xuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0KCAnc2V0dGluZ3MnICksXG5cdFx0XHRlbGVtZW50cyA9IHRoaXMuZ2V0KCAnZWxlbWVudHMnICk7XG5cblx0XHRpZiAoIHVuZGVmaW5lZCAhPT0gZWxlbWVudHMgKSB7XG5cdFx0XHRfLmVhY2goIF8uY2xvbmUoIGVsZW1lbnRzLm1vZGVscyApLCBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0XHRcdG1vZGVsLmRlc3Ryb3koKTtcblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0c2V0dGluZ3MuZGVzdHJveSgpO1xuXHR9LFxuXG5cdG9uQ2xvc2VFZGl0b3I6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaW5pdEVkaXRTZXR0aW5ncygpO1xuXG5cdFx0aWYgKCB0aGlzLnJlbmRlck9uTGVhdmUgKSB7XG5cdFx0XHR0aGlzLnJlbmRlclJlbW90ZVNlcnZlcigpO1xuXHRcdH1cblx0fSxcblxuXHRzZXRTZXR0aW5nOiBmdW5jdGlvbigga2V5LCB2YWx1ZSwgdHJpZ2dlckNoYW5nZSApIHtcblx0XHR0cmlnZ2VyQ2hhbmdlID0gdHJpZ2dlckNoYW5nZSB8fCBmYWxzZTtcblxuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0KCAnc2V0dGluZ3MnICk7XG5cblx0XHRzZXR0aW5ncy5zZXQoIGtleSwgdmFsdWUgKTtcblxuXHRcdHRoaXMuc2V0KCAnc2V0dGluZ3MnLCBzZXR0aW5ncyApO1xuXG5cdFx0aWYgKCB0cmlnZ2VyQ2hhbmdlICkge1xuXHRcdFx0dGhpcy50cmlnZ2VyKCAnY2hhbmdlJywgdGhpcyApO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCAnY2hhbmdlOnNldHRpbmdzJywgdGhpcyApO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCAnY2hhbmdlOnNldHRpbmdzOicgKyBrZXksIHRoaXMgKTtcblx0XHR9XG5cdH0sXG5cblx0Z2V0U2V0dGluZzogZnVuY3Rpb24oIGtleSApIHtcblx0XHR2YXIgc2V0dGluZ3MgPSB0aGlzLmdldCggJ3NldHRpbmdzJyApO1xuXG5cdFx0aWYgKCB1bmRlZmluZWQgPT09IHNldHRpbmdzLmdldCgga2V5ICkgKSB7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNldHRpbmdzLmdldCgga2V5ICk7XG5cdH0sXG5cblx0c2V0SHRtbENhY2hlOiBmdW5jdGlvbiggaHRtbENhY2hlICkge1xuXHRcdHRoaXMuX2h0bWxDYWNoZSA9IGh0bWxDYWNoZTtcblx0fSxcblxuXHRnZXRIdG1sQ2FjaGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLl9odG1sQ2FjaGU7XG5cdH0sXG5cblx0Z2V0VGl0bGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbGVtZW50RGF0YSA9IGVsZW1lbnRvci5nZXRFbGVtZW50RGF0YSggdGhpcyApO1xuXG5cdFx0cmV0dXJuICggZWxlbWVudERhdGEgKSA/IGVsZW1lbnREYXRhLnRpdGxlIDogJ1Vua25vd24nO1xuXHR9LFxuXG5cdGdldEljb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbGVtZW50RGF0YSA9IGVsZW1lbnRvci5nZXRFbGVtZW50RGF0YSggdGhpcyApO1xuXG5cdFx0cmV0dXJuICggZWxlbWVudERhdGEgKSA/IGVsZW1lbnREYXRhLmljb24gOiAndW5rbm93bic7XG5cdH0sXG5cblx0cmVuZGVyUmVtb3RlU2VydmVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5yZW1vdGVSZW5kZXIgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXJPbkxlYXZlID0gZmFsc2U7XG5cblx0XHR0aGlzLnRyaWdnZXIoICdiZWZvcmU6cmVtb3RlOnJlbmRlcicgKTtcblxuXHRcdGlmICggdGhpcy5fanF1ZXJ5WGhyICYmIDQgIT09IHRoaXMuX2pxdWVyeVhociApIHtcblx0XHRcdHRoaXMuX2pxdWVyeVhoci5hYm9ydCgpO1xuXHRcdH1cblxuXHRcdHZhciBkYXRhID0gdGhpcy50b0pTT04oKTtcblxuXHRcdHRoaXMuX2pxdWVyeVhociA9IGVsZW1lbnRvci5hamF4LnNlbmQoICdyZW5kZXJXaWRnZXQnLCB7XG5cdFx0XHR1cmw6IGVsZW1lbnRvci5jb25maWcuYWpheEZyb250VXJsLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRwb3N0X2lkOiBlbGVtZW50b3IuY29uZmlnLnBvc3RfaWQsXG5cdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KCBkYXRhICksXG5cdFx0XHR9LFxuXHRcdFx0c3VjY2VzczogXy5iaW5kKCB0aGlzLm9uUmVtb3RlR2V0SHRtbCwgdGhpcyApXG5cdFx0fSApO1xuXHR9LFxuXG5cblxuXG5cdG9uUmVtb3RlR2V0SHRtbDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dGhpcy5zZXRIdG1sQ2FjaGUoIGRhdGEucmVuZGVyICk7XG5cdFx0dGhpcy50cmlnZ2VyKCAncmVtb3RlOnJlbmRlcicgKTtcblx0fSxcblxuXHRjbG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5ld01vZGVsID0gQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLmNsb25lLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRuZXdNb2RlbC5zZXQoICdpZCcsIGVsZW1lbnRvci5oZWxwZXJzLmdldFVuaXF1ZUlEKCkgKTtcblxuXHRcdG5ld01vZGVsLnNldEh0bWxDYWNoZSggdGhpcy5nZXRIdG1sQ2FjaGUoKSApO1xuXG5cdFx0dmFyIGVsZW1lbnRzID0gdGhpcy5nZXQoICdlbGVtZW50cycgKSxcblx0XHRcdHNldHRpbmdzID0gdGhpcy5nZXQoICdzZXR0aW5ncycgKTtcblxuXHRcdGlmICggISBfLmlzRW1wdHkoIGVsZW1lbnRzICkgKSB7XG5cdFx0XHRuZXdNb2RlbC5zZXQoICdlbGVtZW50cycsIGVsZW1lbnRzLmNsb25lKCkgKTtcblx0XHR9XG5cblx0XHRuZXdNb2RlbC5zZXQoICdzZXR0aW5ncycsIHNldHRpbmdzLmNsb25lKCkgKTtcblxuXHRcdHJldHVybiBuZXdNb2RlbDtcblx0fSxcblxuXHR0b0pTT046IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdG9wdGlvbnMgPSBfLmV4dGVuZCggeyBjb3B5SHRtbENhY2hlOiBmYWxzZSB9LCBvcHRpb25zICk7XG5cblx0XHQvLyBDYWxsIHBhcmVudCdzIHRvSlNPTiBtZXRob2Rcblx0XHR2YXIgZGF0YSA9IEJhY2tib25lLk1vZGVsLnByb3RvdHlwZS50b0pTT04uY2FsbCggdGhpcyApO1xuXG5cdFx0Xy5lYWNoKCBkYXRhLCBmdW5jdGlvbiggYXR0cmlidXRlLCBrZXkgKSB7XG5cdFx0XHRpZiAoIGF0dHJpYnV0ZSAmJiBhdHRyaWJ1dGUudG9KU09OICkge1xuXHRcdFx0XHRkYXRhWyBrZXkgXSA9IGF0dHJpYnV0ZS50b0pTT04oIG9wdGlvbnMgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRpZiAoIG9wdGlvbnMuY29weUh0bWxDYWNoZSApIHtcblx0XHRcdGRhdGEuaHRtbENhY2hlID0gdGhpcy5nZXRIdG1sQ2FjaGUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIGRhdGEuaHRtbENhY2hlO1xuXHRcdH1cblxuXHRcdHJldHVybiBkYXRhO1xuXHR9XG5cbn0gKTtcblxuRWxlbWVudENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRhZGQ6IGZ1bmN0aW9uKCBtb2RlbHMsIG9wdGlvbnMsIGlzQ29ycmVjdFNldCApIHtcblx0XHRpZiAoICggISBvcHRpb25zIHx8ICEgb3B0aW9ucy5zaWxlbnQgKSAmJiAhIGlzQ29ycmVjdFNldCApIHtcblx0XHRcdHRocm93ICdDYWxsIEVycm9yOiBBZGRpbmcgbW9kZWwgdG8gZWxlbWVudCBjb2xsZWN0aW9uIGlzIGFsbG93ZWQgb25seSBieSB0aGUgZGVkaWNhdGVkIGFkZENoaWxkTW9kZWwoKSBtZXRob2QuJztcblx0XHR9XG5cblx0XHRyZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuYWRkLmNhbGwoIHRoaXMsIG1vZGVscywgb3B0aW9ucyApO1xuXHR9LFxuXG5cdG1vZGVsOiBmdW5jdGlvbiggYXR0cnMsIG9wdGlvbnMgKSB7XG5cdFx0aWYgKCBhdHRycy5lbFR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gbmV3IEVsZW1lbnRNb2RlbCggYXR0cnMsIG9wdGlvbnMgKTtcblx0XHR9XG5cdFx0cmV0dXJuIG5ldyBCYWNrYm9uZS5Nb2RlbCggYXR0cnMsIG9wdGlvbnMgKTtcblx0fSxcblxuXHRjbG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRlbXBDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuY2xvbmUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApLFxuXHRcdFx0bmV3Q29sbGVjdGlvbiA9IG5ldyBFbGVtZW50Q29sbGVjdGlvbigpO1xuXG5cdFx0dGVtcENvbGxlY3Rpb24uZm9yRWFjaCggZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0bmV3Q29sbGVjdGlvbi5hZGQoIG1vZGVsLmNsb25lKCksIG51bGwsIHRydWUgKTtcblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gbmV3Q29sbGVjdGlvbjtcblx0fVxufSApO1xuXG5FbGVtZW50Q29sbGVjdGlvbi5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbnVsbDtcbn07XG5FbGVtZW50Q29sbGVjdGlvbi5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG51bGw7XG59O1xuRWxlbWVudENvbGxlY3Rpb24ucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG51bGw7XG59O1xuXG5FbGVtZW50TW9kZWwucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG51bGw7XG59O1xuRWxlbWVudE1vZGVsLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbnVsbDtcbn07XG5FbGVtZW50TW9kZWwucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG51bGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0TW9kZWw6IEVsZW1lbnRNb2RlbCxcblx0Q29sbGVjdGlvbjogRWxlbWVudENvbGxlY3Rpb25cbn07XG4iLCJ2YXIgQmFzZVNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9iYXNlLXNldHRpbmdzJyApLFxuXHRSb3dTZXR0aW5nc01vZGVsO1xuXG5Sb3dTZXR0aW5nc01vZGVsID0gQmFzZVNldHRpbmdzTW9kZWwuZXh0ZW5kKCB7XG5cdGRlZmF1bHRzOiB7fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1NldHRpbmdzTW9kZWw7XG4iLCJ2YXIgQmFzZVNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9iYXNlLXNldHRpbmdzJyApLFxuXHRTZWN0aW9uU2V0dGluZ3NNb2RlbDtcblxuU2VjdGlvblNldHRpbmdzTW9kZWwgPSBCYXNlU2V0dGluZ3NNb2RlbC5leHRlbmQoIHtcblx0ZGVmYXVsdHM6IHt9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VjdGlvblNldHRpbmdzTW9kZWw7XG4iLCJ2YXIgQmFzZVNldHRpbmdzTW9kZWwgPSByZXF1aXJlKCAnZWxlbWVudG9yLW1vZGVscy9iYXNlLXNldHRpbmdzJyApLFxuXHRXaWRnZXRTZXR0aW5nc01vZGVsO1xuXG5XaWRnZXRTZXR0aW5nc01vZGVsID0gQmFzZVNldHRpbmdzTW9kZWwuZXh0ZW5kKCB7XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBXaWRnZXRTZXR0aW5nc01vZGVsO1xuIiwiLy8gbW9kdWxlcy9pcWl0ZWxlbWVudG9yL3ZpZXdzL19kZXYvanMvZWRpdG9yL3V0aWxzL2NvbnRleHQtY2xpcGJvYXJkLmpzXG5cbmxldCBjbGlwYm9hcmQgPSB3aW5kb3cuaXFpdEVsZW1lbnRvckNsaXBib2FyZCB8fCBudWxsO1xuXG5mdW5jdGlvbiBzZXRDbGlwYm9hcmRGcm9tRWxlbWVudCggdmlldyApIHtcbiAgICBjb25zdCBtb2RlbCA9IHZpZXcubW9kZWw7XG5cbiAgICBjbGlwYm9hcmQgPSB7XG4gICAgICAgIHR5cGU6ICdlbGVtZW50JyxcbiAgICAgICAgZWxUeXBlOiBtb2RlbC5nZXQoICdlbFR5cGUnICksICAgICAgICAgIC8vIHNlY3Rpb24gLyBjb2x1bW4gLyB3aWRnZXRcbiAgICAgICAgd2lkZ2V0VHlwZTogbW9kZWwuZ2V0KCAnd2lkZ2V0VHlwZScgKSwgIC8vIHVuaXF1ZW1lbnQgcG91ciBsZXMgd2lkZ2V0c1xuICAgICAgICBkYXRhOiBtb2RlbC50b0pTT04oKSxcbiAgICB9O1xuXG4gICAgd2luZG93LmlxaXRFbGVtZW50b3JDbGlwYm9hcmQgPSBjbGlwYm9hcmQ7XG4gICAgcmV0dXJuIGNsaXBib2FyZDtcbn1cblxuZnVuY3Rpb24gZ2V0Q29weUFjdGlvbiggdmlldywgb3B0aW9ucyA9IHt9ICkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1jbGlwYm9hcmRcIj48L2k+JyxcbiAgICB9O1xuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMgKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6ICdjb3B5JyxcbiAgICAgICAgaWNvbjogc2V0dGluZ3MuaWNvbixcbiAgICAgICAgdGl0bGU6IGVsZW1lbnRvci50cmFuc2xhdGUgPyBlbGVtZW50b3IudHJhbnNsYXRlKCAnQ29weScgKSA6ICdDb3B5JyxcbiAgICAgICAgc2VwYXJhdG9yOiBzZXR0aW5ncy5zZXBhcmF0b3IsXG4gICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICBzZXRDbGlwYm9hcmRGcm9tRWxlbWVudCggdmlldyApO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0Q29weUFjdGlvbjsiLCIvKipcbiAqIFV0aWxzOiBwYXN0ZSBvbmx5IHN0eWxlLXJlbGF0ZWQgc2V0dGluZ3MgZnJvbSBvbmUgZWxlbWVudCB0byBhbm90aGVyLlxuICpcbiAqIFRoaXMgbW9kdWxlIGV4cG9zZXMgdHdvIGhlbHBlcnM6XG4gKiAtIGNhblBhc3RlU3R5bGVzKGNsaXBib2FyZE1vZGVsLCB0YXJnZXRNb2RlbClcbiAqIC0gcGFzdGVTdHlsZXMoY2xpcGJvYXJkTW9kZWwsIHRhcmdldE1vZGVsKVxuICpcbiAqIEJvdGggcGFyYW1ldGVycyBhcmUgZXhwZWN0ZWQgdG8gYmUgQmFja2JvbmUgbW9kZWxzIG9mIEVsZW1lbnRvci1saWtlIHdpZGdldHNcbiAqICh0aGUgc2FtZSB0eXBlIGFzIHRob3NlIHVzZWQgaW4gdGhlIGVkaXRvcikuXG4gKi9cblxuLyoqXG4gKiBUcnkgdG8gZ2V0IHRoZSBjb250cm9sIGRlZmluaXRpb25zIGZvciBhIGdpdmVuIGVsZW1lbnQgbW9kZWwuXG4gKiBUaGUgZXhhY3QgQVBJIG1heSB2YXJ5IGEgYml0IGRlcGVuZGluZyBvbiB0aGUgZm9yaywgc28gd2UgdHJ5XG4gKiBhIGZldyBjb21tb24gcGF0dGVybnMgYW5kIGZhbGwgYmFjayBzYWZlbHkuXG4gKlxuICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcbiAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH1cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udHJvbHNGcm9tTW9kZWwobW9kZWwpIHtcblx0aWYgKCFtb2RlbCB8fCB0eXBlb2YgbW9kZWwgIT09ICdvYmplY3QnKSB7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRsZXQgd2lkZ2V0VHlwZSA9IG51bGw7XG5cdGlmICh0eXBlb2YgbW9kZWwuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0d2lkZ2V0VHlwZSA9IG1vZGVsLmdldCgnd2lkZ2V0VHlwZScpO1xuXHR9XG5cblx0aWYgKFxuXHRcdHR5cGVvZiBlbGVtZW50b3IgIT09ICd1bmRlZmluZWQnICYmXG5cdFx0ZWxlbWVudG9yLmNvbmZpZyAmJlxuXHRcdGVsZW1lbnRvci5jb25maWcud2lkZ2V0cyAmJlxuXHRcdHdpZGdldFR5cGUgJiZcblx0XHRlbGVtZW50b3IuY29uZmlnLndpZGdldHNbd2lkZ2V0VHlwZV1cblx0KSB7XG5cdFx0Y29uc3Qgd2lkZ2V0Q29uZmlnID0gZWxlbWVudG9yLmNvbmZpZy53aWRnZXRzW3dpZGdldFR5cGVdO1xuXHRcdGlmICh3aWRnZXRDb25maWcgJiYgd2lkZ2V0Q29uZmlnLmNvbnRyb2xzICYmIHR5cGVvZiB3aWRnZXRDb25maWcuY29udHJvbHMgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXR1cm4gd2lkZ2V0Q29uZmlnLmNvbnRyb2xzO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdCBvZiBzZXR0aW5nIGtleXMgdGhhdCBiZWxvbmcgdG8gdGhlIFN0eWxlIHRhYlxuICogKG9yIHRvIGEgc2VjdGlvbiBjb25zaWRlcmVkIGFzIGEgc3R5bGUgc2VjdGlvbikuXG4gKlxuICogQHBhcmFtIHtCYWNrYm9uZS5Nb2RlbH0gbW9kZWxcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX0gQXJyYXkgb2Ygc2V0dGluZyBrZXlzXG4gKi9cbmZ1bmN0aW9uIGdldFN0eWxlQ29udHJvbHMobW9kZWwpIHtcblx0Y29uc3QgY29udHJvbHMgPSBnZXRDb250cm9sc0Zyb21Nb2RlbChtb2RlbCk7XG5cdGlmICghY29udHJvbHMpIHtcblx0XHRyZXR1cm4gW107XG5cdH1cblxuXHRyZXR1cm4gY29udHJvbHMuZmlsdGVyKChjb250cm9sKSA9PiB7XG5cdFx0aWYgKHR5cGVvZiBjb250cm9sICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmICggdW5kZWZpbmVkICE9PSBjb250cm9sLnN0eWxlX3RyYW5zZmVyICkge1xuXHRcdFx0cmV0dXJuIGNvbnRyb2wuc3R5bGVfdHJhbnNmZXI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICdjb250ZW50JyAhPT0gY29udHJvbC50YWIgfHwgY29udHJvbC5zZWxlY3RvcnMgfHwgY29udHJvbC5wcmVmaXhfY2xhc3M7XG5cdH0pO1xufVxuXG4vKipcbiAqIFBldGl0IGhlbHBlciBwb3VyIG5vcm1hbGlzZXIgbGVzIHNldHRpbmdzIGQndW4gbW9kw6hsZVxuICogKEJhY2tib25lIG1vZGVsIG91IHNpbXBsZSBvYmpldCkuXG4gKlxuICogQHBhcmFtIHthbnl9IHJhd1NldHRpbmdzXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTZXR0aW5ncyhyYXdTZXR0aW5ncykge1xuXHRpZiAoIXJhd1NldHRpbmdzKSB7XG5cdFx0cmV0dXJuIHt9O1xuXHR9XG5cblx0Ly8gQmFja2JvbmUgbW9kZWwgYXZlYyB0b0pTT04oKVxuXHRpZiAodHlwZW9mIHJhd1NldHRpbmdzLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiByYXdTZXR0aW5ncy50b0pTT04oKTtcblx0fVxuXG5cdC8vIETDqWrDoCB1biBvYmpldCBzaW1wbGVcblx0aWYgKHR5cGVvZiByYXdTZXR0aW5ncyA9PT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4gcmF3U2V0dGluZ3M7XG5cdH1cblxuXHRyZXR1cm4ge307XG59XG5cbi8qKlxuICogQ29sbGUgdW5pcXVlbWVudCBsZXMgc2V0dGluZ3MgbGnDqXMgYXUgU3R5bGUgZGVwdWlzIGNsaXBib2FyZE1vZGVsIHZlcnMgdGFyZ2V0TW9kZWwuXG4gKiBOZSBmYWl0IHJpZW4gc2kgbGVzIHByw6lyZXF1aXMgbmUgc29udCBwYXMgcmVtcGxpcy5cbiAqXG4gKiBAcGFyYW0ge0JhY2tib25lLk1vZGVsfSB0YXJnZXRNb2RlbFxuICovXG5mdW5jdGlvbiBwYXN0ZVN0eWxlcyh0YXJnZXRNb2RlbCkge1xuICAgIGNvbnN0IGNsaXBib2FyZE1vZGVsID0gd2luZG93LmlxaXRFbGVtZW50b3JDbGlwYm9hcmQ7XG5cdGlmICghY2xpcGJvYXJkTW9kZWwgfHwgIXRhcmdldE1vZGVsKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gQ2zDqXMgZGUgc3R5bGUgYmFzw6llcyBzdXIgbGEgZMOpZmluaXRpb24gZGVzIGNvbnRyb2xzIGRlIGxhIENJQkxFIDpcblx0Ly8gw6dhIMOpdml0ZSBkJ2Vzc2F5ZXIgZGUgc2V0dGVyIGRlcyBjbMOpcyBxdWkgbidleGlzdGVudCBwYXMgc3VyIGNlIHdpZGdldC5cblx0Y29uc3Qgc3R5bGVDb250cm9scyA9IGdldFN0eWxlQ29udHJvbHModGFyZ2V0TW9kZWwpO1xuXG5cdGlmICghc3R5bGVDb250cm9scy5sZW5ndGgpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBzb3VyY2VTZXR0aW5ncyA9IG5vcm1hbGl6ZVNldHRpbmdzKGNsaXBib2FyZE1vZGVsLmRhdGEuc2V0dGluZ3MpO1xuXHRjb25zdCBuZXdTdHlsZVNldHRpbmdzID0ge307XG5cblx0c3R5bGVDb250cm9scy5mb3JFYWNoKChjb250cm9sKSA9PiB7XG5cdFx0aWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2VTZXR0aW5ncywgY29udHJvbC5uYW1lKSkge1xuXHRcdFx0bmV3U3R5bGVTZXR0aW5nc1tjb250cm9sLm5hbWVdID0gc291cmNlU2V0dGluZ3NbY29udHJvbC5uYW1lXTtcblx0XHR9XG5cdH0pO1xuXG5cdGNvbnN0IHRhcmdldFNldHRpbmdzUmF3ID0gdGFyZ2V0TW9kZWwuZ2V0ICYmIHRhcmdldE1vZGVsLmdldCgnc2V0dGluZ3MnKTtcblx0Y29uc3QgdGFyZ2V0U2V0dGluZ3MgPSBub3JtYWxpemVTZXR0aW5ncyh0YXJnZXRTZXR0aW5nc1Jhdyk7XG5cblx0aWYgKCFPYmplY3Qua2V5cyhuZXdTdHlsZVNldHRpbmdzKS5sZW5ndGgpIHtcblx0XHQvLyBSaWVuIMOgIGNvbGxlclxuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIEZ1c2lvbiBkZXMgc2V0dGluZ3MgYWN0dWVscyBhdmVjIGxlcyBub3V2ZWF1eCBzdHlsZXNcblx0Y29uc3QgbWVyZ2VkU2V0dGluZ3MgPSAodHlwZW9mIF8gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBfLmV4dGVuZCA9PT0gJ2Z1bmN0aW9uJylcblx0XHQ/IF8uZXh0ZW5kKHt9LCB0YXJnZXRTZXR0aW5ncywgbmV3U3R5bGVTZXR0aW5ncylcblx0XHQ6IE9iamVjdC5hc3NpZ24oe30sIHRhcmdldFNldHRpbmdzLCBuZXdTdHlsZVNldHRpbmdzKTtcblxuXHQvLyBPbiBtZXQgw6Agam91ciBsZSBtb2TDqGxlIGNpYmxlLiBTZWxvbiB0b24gaW1wbMOpbWVudGF0aW9uLFxuXHQvLyB0dSBwZXV4IGF2b2lyIHVuIHNldFNldHRpbmcoKSBvdSBzaW1pbGFpcmUuXG5cdGlmICh0eXBlb2YgdGFyZ2V0U2V0dGluZ3NSYXcgPT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXRTZXR0aW5nc1Jhdy5zZXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBTaSBzZXR0aW5ncyBlc3QgdW4gQmFja2JvbmUgTW9kZWxcblx0XHRPYmplY3Qua2V5cyhtZXJnZWRTZXR0aW5ncykuZm9yRWFjaCgoc2V0dGluZ0tleSkgPT4ge1xuXHRcdFx0dGFyZ2V0U2V0dGluZ3NSYXcuc2V0KHNldHRpbmdLZXksIG1lcmdlZFNldHRpbmdzW3NldHRpbmdLZXldKTtcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgdGFyZ2V0TW9kZWwuc2V0U2V0dGluZ3MgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBDZXJ0YWluZXMgaW1wbMOpbWVudGF0aW9ucyBleHBvc2VudCB1bmUgQVBJIGTDqWRpw6llXG5cdFx0dGFyZ2V0TW9kZWwuc2V0U2V0dGluZ3MobWVyZ2VkU2V0dGluZ3MpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiB0YXJnZXRNb2RlbC5zZXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHQvLyBGYWxsYmFjayA6IG9uIHJlbXBsYWNlIGxlIGJsb2Mgc2V0dGluZ3MgY29tcGxldFxuXHRcdHRhcmdldE1vZGVsLnNldCgnc2V0dGluZ3MnLCBtZXJnZWRTZXR0aW5ncyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFzdFN0eWxlc0FjdGlvbiggdmlldywgb3B0aW9ucyA9IHt9ICkge1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1wYWludC1icnVzaFwiPjwvaT4nLFxuICAgIH07XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oIHt9LCBkZWZhdWx0cywgb3B0aW9ucyApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ3Bhc3RlX3N0eWxlcycsXG4gICAgICAgIGljb246IHNldHRpbmdzLmljb24sXG4gICAgICAgIHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSggJ1Bhc3RlIHN0eWxlcycgKSA6ICdDb3B5JyxcbiAgICAgICAgc2VwYXJhdG9yOiBzZXR0aW5ncy5zZXBhcmF0b3IsXG4gICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICBwYXN0ZVN0eWxlcyh2aWV3Lm1vZGVsKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG4vLyBFeHBvcnQgcGFyIGTDqWZhdXQgcHJhdGlxdWUgc2kgdHUgcHLDqWbDqHJlcyBpbXBvcnRlciB1biBzZXVsIG9iamV0LlxubW9kdWxlLmV4cG9ydHMgPSBnZXRQYXN0U3R5bGVzQWN0aW9uO1xuIiwidmFyIEFqYXg7XG5cbkFqYXggPSB7XG5cdGNvbmZpZzoge30sXG5cblx0aW5pdENvbmZpZzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb25maWcgPSB7XG5cdFx0XHRhamF4UGFyYW1zOiB7XG5cdFx0XHRcdHR5cGU6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBlbGVtZW50b3IuY29uZmlnLmFqYXh1cmwsXG5cdFx0XHRcdGRhdGE6IHt9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRpbml0OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmluaXRDb25maWcoKTtcblx0fSxcblxuXHRzZW5kOiBmdW5jdGlvbiggYWN0aW9uLCBvcHRpb25zICkge1xuXHRcdHZhciBhamF4UGFyYW1zID0gZWxlbWVudG9yLmhlbHBlcnMuY2xvbmVPYmplY3QoIHRoaXMuY29uZmlnLmFqYXhQYXJhbXMgKTtcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0QmFja2JvbmUuJC5leHRlbmQoIGFqYXhQYXJhbXMsIG9wdGlvbnMgKTtcblxuXG5cdFx0aWYgKCBhamF4UGFyYW1zLmRhdGEgaW5zdGFuY2VvZiBGb3JtRGF0YSApIHtcblx0XHRcdGFqYXhQYXJhbXMuZGF0YS5hcHBlbmQoICdhY3Rpb24nLCBhY3Rpb24gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWpheFBhcmFtcy5kYXRhLmFjdGlvbiA9IGFjdGlvbjtcblx0XHR9XG5cblx0XHR2YXIgc3VjY2Vzc0NhbGxiYWNrID0gYWpheFBhcmFtcy5zdWNjZXNzLFxuXHRcdFx0ZXJyb3JDYWxsYmFjayA9IGFqYXhQYXJhbXMuZXJyb3I7XG5cblx0XHRpZiAoIHN1Y2Nlc3NDYWxsYmFjayB8fCBlcnJvckNhbGxiYWNrICkge1xuXHRcdFx0YWpheFBhcmFtcy5zdWNjZXNzID0gZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRpZiAoIHJlc3BvbnNlLnN1Y2Nlc3MgJiYgc3VjY2Vzc0NhbGxiYWNrICkge1xuXHRcdFx0XHRcdHN1Y2Nlc3NDYWxsYmFjayggcmVzcG9uc2UuZGF0YSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCAoICEgcmVzcG9uc2Uuc3VjY2VzcyApICYmIGVycm9yQ2FsbGJhY2sgKSB7XG5cdFx0XHRcdFx0ZXJyb3JDYWxsYmFjayggcmVzcG9uc2UuZGF0YSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoIGVycm9yQ2FsbGJhY2sgKSB7XG5cdFx0XHRcdGFqYXhQYXJhbXMuZXJyb3IgPSBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0XHRlcnJvckNhbGxiYWNrKCBkYXRhICk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEJhY2tib25lLiQuYWpheCggYWpheFBhcmFtcyApO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXg7XG4iLCJ2YXIgaGVscGVycztcblxuaGVscGVycyA9IHtcblx0X2VucXVldWVkRm9udHM6IFtdLFxuXG5cdGVsZW1lbnRzSGllcmFyY2h5OiB7XG5cdFx0c2VjdGlvbjoge1xuXHRcdFx0Y29sdW1uOiB7XG5cdFx0XHRcdHdpZGdldDogbnVsbCxcblx0XHRcdFx0c2VjdGlvbjogbnVsbFxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRlbnF1ZXVlRm9udDogZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0aWYgKCAtMSAhPT0gdGhpcy5fZW5xdWV1ZWRGb250cy5pbmRleE9mKCBmb250ICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIGZvbnRUeXBlID0gZWxlbWVudG9yLmNvbmZpZy5jb250cm9scy5mb250LmZvbnRzWyBmb250IF0sXG5cdFx0XHRmb250VXJsO1xuXG5cdFx0c3dpdGNoICggZm9udFR5cGUgKSB7XG5cdFx0XHRjYXNlICdnb29nbGVmb250cycgOlxuXHRcdFx0XHRmb250VXJsID0gJ2h0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzP2ZhbWlseT0nICsgZm9udCArICc6MTAwLDEwMGl0YWxpYywyMDAsMjAwaXRhbGljLDMwMCwzMDBpdGFsaWMsNDAwLDQwMGl0YWxpYyw1MDAsNTAwaXRhbGljLDYwMCw2MDBpdGFsaWMsNzAwLDcwMGl0YWxpYyw4MDAsODAwaXRhbGljLDkwMCw5MDBpdGFsaWMnO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnZWFybHlhY2Nlc3MnIDpcblx0XHRcdFx0dmFyIGZvbnRMb3dlclN0cmluZyA9IGZvbnQucmVwbGFjZSggL1xccysvZywgJycgKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRmb250VXJsID0gJ2h0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vZWFybHlhY2Nlc3MvJyArIGZvbnRMb3dlclN0cmluZyArICcuY3NzJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIF8uaXNFbXB0eSggZm9udFVybCApICkge1xuXHRcdFx0ZWxlbWVudG9yLiRwcmV2aWV3Q29udGVudHMuZmluZCggJ2xpbms6bGFzdCcgKS5hZnRlciggJzxsaW5rIGhyZWY9XCInICsgZm9udFVybCArICdcIiByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCI+JyApO1xuXHRcdH1cblx0XHR0aGlzLl9lbnF1ZXVlZEZvbnRzLnB1c2goIGZvbnQgKTtcblx0fSxcblxuXHRnZXRFbGVtZW50Q2hpbGRUeXBlOiBmdW5jdGlvbiggZWxlbWVudFR5cGUsIGNvbnRhaW5lciApIHtcblx0XHRpZiAoICEgY29udGFpbmVyICkge1xuXHRcdFx0Y29udGFpbmVyID0gdGhpcy5lbGVtZW50c0hpZXJhcmNoeTtcblx0XHR9XG5cblx0XHRpZiAoIHVuZGVmaW5lZCAhPT0gY29udGFpbmVyWyBlbGVtZW50VHlwZSBdICkge1xuXG5cdFx0XHRpZiAoIEJhY2tib25lLiQuaXNQbGFpbk9iamVjdCggY29udGFpbmVyWyBlbGVtZW50VHlwZSBdICkgKSB7XG5cdFx0XHRcdHJldHVybiBPYmplY3Qua2V5cyggY29udGFpbmVyWyBlbGVtZW50VHlwZSBdICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdGZvciAoIHZhciB0eXBlIGluIGNvbnRhaW5lciApIHtcblxuXHRcdFx0aWYgKCAhIGNvbnRhaW5lci5oYXNPd25Qcm9wZXJ0eSggdHlwZSApICkge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAhIEJhY2tib25lLiQuaXNQbGFpbk9iamVjdCggY29udGFpbmVyWyB0eXBlIF0gKSApIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdHZhciByZXN1bHQgPSB0aGlzLmdldEVsZW1lbnRDaGlsZFR5cGUoIGVsZW1lbnRUeXBlLCBjb250YWluZXJbIHR5cGUgXSApO1xuXG5cdFx0XHRpZiAoIHJlc3VsdCApIHtcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXHRnZXRVbmlxdWVJRDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlkO1xuXG5cdFx0Ly8gVE9ETzogQ2hlY2sgY29uZmxpY3QgbW9kZWxzXG5cdFx0Ly93aGlsZSAoIHRydWUgKSB7XG5cdFx0XHRpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoIDM2ICkuc3Vic3RyKCAyLCA3ICk7XG5cdFx0XHQvL2lmICggMSA+ICQoICdsaS5pdGVtLWlkLScgKyBpZCApLmxlbmd0aCApIHtcblx0XHRcdFx0cmV0dXJuIGlkO1xuXHRcdFx0Ly99XG5cdFx0Ly99XG5cdH0sXG5cblx0c3RyaW5nUmVwbGFjZUFsbDogZnVuY3Rpb24oIHN0cmluZywgcmVwbGFjZXMgKSB7XG5cdFx0dmFyIHJlID0gbmV3IFJlZ0V4cCggT2JqZWN0LmtleXMoIHJlcGxhY2VzICkuam9pbiggJ3wnICksICdnaScgKTtcblxuXHRcdHJldHVybiBzdHJpbmcucmVwbGFjZSggcmUsIGZ1bmN0aW9uKCBtYXRjaGVkICkge1xuXHRcdFx0cmV0dXJuIHJlcGxhY2VzWyBtYXRjaGVkIF07XG5cdFx0fSApO1xuXHR9LFxuXG5cdGlzQ29udHJvbFZpc2libGU6IGZ1bmN0aW9uKCBjb250cm9sTW9kZWwsIGVsZW1lbnRTZXR0aW5nc01vZGVsICkge1xuXHRcdHZhciBjb25kaXRpb247XG5cblx0XHQvLyBUT0RPOiBCZXR0ZXIgd2F5IHRvIGdldCB0aGlzP1xuXHRcdGlmICggXy5pc0Z1bmN0aW9uKCBjb250cm9sTW9kZWwuZ2V0ICkgKSB7XG5cdFx0XHRjb25kaXRpb24gPSBjb250cm9sTW9kZWwuZ2V0KCAnY29uZGl0aW9uJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25kaXRpb24gPSBjb250cm9sTW9kZWwuY29uZGl0aW9uO1xuXHRcdH1cblxuXHRcdGlmICggXy5pc0VtcHR5KCBjb25kaXRpb24gKSApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHZhciBoYXNGaWVsZHMgPSBfLmZpbHRlciggY29uZGl0aW9uLCBmdW5jdGlvbiggY29uZGl0aW9uVmFsdWUsIGNvbmRpdGlvbk5hbWUgKSB7XG5cdFx0XHR2YXIgY29uZGl0aW9uTmFtZVBhcnRzID0gY29uZGl0aW9uTmFtZS5tYXRjaCggLyhbYS16XzAtOV0rKSg/OlxcWyhbYS16X10rKV0pPyghPykkL2kgKSxcblx0XHRcdFx0Y29uZGl0aW9uUmVhbE5hbWUgPSBjb25kaXRpb25OYW1lUGFydHNbMV0sXG5cdFx0XHRcdGNvbmRpdGlvblN1YktleSA9IGNvbmRpdGlvbk5hbWVQYXJ0c1syXSxcblx0XHRcdFx0aXNOZWdhdGl2ZUNvbmRpdGlvbiA9ICEhIGNvbmRpdGlvbk5hbWVQYXJ0c1szXSxcblx0XHRcdFx0Y29udHJvbFZhbHVlID0gZWxlbWVudFNldHRpbmdzTW9kZWwuZ2V0KCBjb25kaXRpb25SZWFsTmFtZSApO1xuXG5cdFx0XHRpZiAoIGNvbmRpdGlvblN1YktleSApIHtcblx0XHRcdFx0Y29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlWyBjb25kaXRpb25TdWJLZXkgXTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGlzQ29udGFpbnMgPSAoIF8uaXNBcnJheSggY29uZGl0aW9uVmFsdWUgKSApID8gXy5jb250YWlucyggY29uZGl0aW9uVmFsdWUsIGNvbnRyb2xWYWx1ZSApIDogY29uZGl0aW9uVmFsdWUgPT09IGNvbnRyb2xWYWx1ZTtcblxuXHRcdFx0cmV0dXJuIGlzTmVnYXRpdmVDb25kaXRpb24gPyBpc0NvbnRhaW5zIDogISBpc0NvbnRhaW5zO1xuXHRcdH0gKTtcblxuXHRcdHJldHVybiBfLmlzRW1wdHkoIGhhc0ZpZWxkcyApO1xuXHR9LFxuXG5cdGNsb25lT2JqZWN0OiBmdW5jdGlvbiggb2JqZWN0ICkge1xuXHRcdHJldHVybiBKU09OLnBhcnNlKCBKU09OLnN0cmluZ2lmeSggb2JqZWN0ICkgKTtcblx0fSxcblxuXHRnZXRZb3V0dWJlSURGcm9tVVJMOiBmdW5jdGlvbiggdXJsICkge1xuXHRcdHZhciB2aWRlb0lEUGFydHMgPSB1cmwubWF0Y2goIC9eLiooPzp5b3V0dS5iZVxcL3x2XFwvfGVcXC98dVxcL1xcdytcXC98ZW1iZWRcXC98dj0pKFteI1xcJlxcP10qKS4qLyApO1xuXG5cdFx0cmV0dXJuIHZpZGVvSURQYXJ0cyAmJiB2aWRlb0lEUGFydHNbMV07XG5cdH0sXG5cblx0ZGlzYWJsZUVsZW1lbnRFdmVudHM6IGZ1bmN0aW9uKCAkZWxlbWVudCApIHtcblx0XHQkZWxlbWVudC5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBjdXJyZW50UG9pbnRlckV2ZW50cyA9IHRoaXMuc3R5bGUucG9pbnRlckV2ZW50cztcblxuXHRcdFx0aWYgKCAnbm9uZScgPT09IGN1cnJlbnRQb2ludGVyRXZlbnRzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdEJhY2tib25lLiQoIHRoaXMgKVxuXHRcdFx0XHQuZGF0YSggJ2JhY2t1cC1wb2ludGVyLWV2ZW50cycsIGN1cnJlbnRQb2ludGVyRXZlbnRzIClcblx0XHRcdFx0LmNzcyggJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGVuYWJsZUVsZW1lbnRFdmVudHM6IGZ1bmN0aW9uKCAkZWxlbWVudCApIHtcblx0XHQkZWxlbWVudC5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciAkdGhpcyA9IEJhY2tib25lLiQoIHRoaXMgKSxcblx0XHRcdFx0YmFja3VwUG9pbnRlckV2ZW50cyA9ICR0aGlzLmRhdGEoICdiYWNrdXAtcG9pbnRlci1ldmVudHMnICk7XG5cblx0XHRcdGlmICggdW5kZWZpbmVkID09PSBiYWNrdXBQb2ludGVyRXZlbnRzICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdCR0aGlzXG5cdFx0XHRcdC5yZW1vdmVEYXRhKCAnYmFja3VwLXBvaW50ZXItZXZlbnRzJyApXG5cdFx0XHRcdC5jc3MoICdwb2ludGVyLWV2ZW50cycsIGJhY2t1cFBvaW50ZXJFdmVudHMgKTtcblx0XHR9ICk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGVscGVycztcbiIsInZhciBJbnRyb2R1Y3Rpb247XG5cbkludHJvZHVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgbW9kYWw7XG5cblx0dmFyIGluaXRNb2RhbCA9IGZ1bmN0aW9uKCkge1xuXHRcdG1vZGFsID0gZWxlbWVudG9yLmRpYWxvZ3NNYW5hZ2VyLmNyZWF0ZVdpZGdldCggJ2VsZW1lbnRvci1tb2RhbCcsIHtcblx0XHRcdGlkOiAnZWxlbWVudG9yLWludHJvZHVjdGlvbidcblx0XHR9ICk7XG5cblx0XHRtb2RhbC5vbiggJ2hpZGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdG1vZGFsLmdldEVsZW1lbnRzKCAnbWVzc2FnZScgKS5lbXB0eSgpOyAvLyBJbiBvcmRlciB0byBzdG9wIHRoZSB2aWRlb1xuXHRcdH0gKTtcblx0fTtcblxuXHR0aGlzLmdldFNldHRpbmdzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGVsZW1lbnRvci5jb25maWcuaW50cm9kdWN0aW9uO1xuXHR9O1xuXG5cdHRoaXMuZ2V0TW9kYWwgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgbW9kYWwgKSB7XG5cdFx0XHRpbml0TW9kYWwoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbW9kYWw7XG5cdH07XG5cblx0dGhpcy5zdGFydEludHJvZHVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0U2V0dGluZ3MoKTtcblxuXHRcdHRoaXMuZ2V0TW9kYWwoKVxuXHRcdCAgICAuc2V0SGVhZGVyTWVzc2FnZSggc2V0dGluZ3MudGl0bGUgKVxuXHRcdCAgICAuc2V0TWVzc2FnZSggc2V0dGluZ3MuY29udGVudCApXG5cdFx0ICAgIC5zaG93KCk7XG5cdH07XG5cblx0dGhpcy5zdGFydE9uTG9hZEludHJvZHVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0U2V0dGluZ3MoKTtcblxuXHRcdGlmICggISBzZXR0aW5ncy5pc191c2VyX3Nob3VsZF92aWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHNldFRpbWVvdXQoIF8uYmluZCggZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnN0YXJ0SW50cm9kdWN0aW9uKCk7XG5cdFx0fSwgdGhpcyApLCBzZXR0aW5ncy5kZWxheSApO1xuXHR9O1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBJbnRyb2R1Y3Rpb24oKTtcbiIsIi8qKlxuICogSFRNTDUgLSBEcmFnIGFuZCBEcm9wXG4gKi9cbjsoZnVuY3Rpb24oICQgKSB7XG5cblx0dmFyIGhhc0Z1bGxEYXRhVHJhbnNmZXJTdXBwb3J0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHRyeSB7XG5cdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCAndGVzdCcsICd0ZXN0JyApO1xuXG5cdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5jbGVhckRhdGEoICd0ZXN0JyApO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH07XG5cblx0dmFyIERyYWdnYWJsZSA9IGZ1bmN0aW9uKCB1c2VyU2V0dGluZ3MgKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0c2V0dGluZ3MgPSB7fSxcblx0XHRcdGVsZW1lbnRzQ2FjaGUgPSB7fSxcblx0XHRcdGRlZmF1bHRTZXR0aW5ncyA9IHtcblx0XHRcdFx0ZWxlbWVudDogJycsXG5cdFx0XHRcdGdyb3VwczogbnVsbCxcblx0XHRcdFx0b25EcmFnU3RhcnQ6IG51bGwsXG5cdFx0XHRcdG9uRHJhZ0VuZDogbnVsbFxuXHRcdFx0fTtcblxuXHRcdHZhciBpbml0U2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcblx0XHRcdCQuZXh0ZW5kKCB0cnVlLCBzZXR0aW5ncywgZGVmYXVsdFNldHRpbmdzLCB1c2VyU2V0dGluZ3MgKTtcblx0XHR9O1xuXG5cdFx0dmFyIGluaXRFbGVtZW50c0NhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50c0NhY2hlLiRlbGVtZW50ID0gJCggc2V0dGluZ3MuZWxlbWVudCApO1xuXHRcdH07XG5cblx0XHR2YXIgYnVpbGRFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudHNDYWNoZS4kZWxlbWVudC5hdHRyKCAnZHJhZ2dhYmxlJywgdHJ1ZSApO1xuXHRcdH07XG5cblx0XHR2YXIgb25EcmFnRW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0aWYgKCAkLmlzRnVuY3Rpb24oIHNldHRpbmdzLm9uRHJhZ0VuZCApICkge1xuXHRcdFx0XHRzZXR0aW5ncy5vbkRyYWdFbmQuY2FsbCggZWxlbWVudHNDYWNoZS4kZWxlbWVudCwgZXZlbnQsIHNlbGYgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIG9uRHJhZ1N0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGdyb3VwcyA9IHNldHRpbmdzLmdyb3VwcyB8fCBbXSxcblx0XHRcdFx0ZGF0YUNvbnRhaW5lciA9IHtcblx0XHRcdFx0XHRncm91cHM6IGdyb3Vwc1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRpZiAoIGhhc0Z1bGxEYXRhVHJhbnNmZXJTdXBwb3J0KCBldmVudCApICkge1xuXHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCBKU09OLnN0cmluZ2lmeSggZGF0YUNvbnRhaW5lciApLCB0cnVlICk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggJC5pc0Z1bmN0aW9uKCBzZXR0aW5ncy5vbkRyYWdTdGFydCApICkge1xuXHRcdFx0XHRzZXR0aW5ncy5vbkRyYWdTdGFydC5jYWxsKCBlbGVtZW50c0NhY2hlLiRlbGVtZW50LCBldmVudCwgc2VsZiApO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgYXR0YWNoRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50c0NhY2hlLiRlbGVtZW50XG5cdFx0XHRcdC5vbiggJ2RyYWdzdGFydCcsIG9uRHJhZ1N0YXJ0IClcblx0XHRcdFx0Lm9uKCAnZHJhZ2VuZCcsIG9uRHJhZ0VuZCApO1xuXHRcdH07XG5cblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aW5pdFNldHRpbmdzKCk7XG5cblx0XHRcdGluaXRFbGVtZW50c0NhY2hlKCk7XG5cblx0XHRcdGJ1aWxkRWxlbWVudHMoKTtcblxuXHRcdFx0YXR0YWNoRXZlbnRzKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudHNDYWNoZS4kZWxlbWVudC5vZmYoICdkcmFnc3RhcnQnLCBvbkRyYWdTdGFydCApO1xuXG5cdFx0XHRlbGVtZW50c0NhY2hlLiRlbGVtZW50LnJlbW92ZUF0dHIoICdkcmFnZ2FibGUnICk7XG5cdFx0fTtcblxuXHRcdGluaXQoKTtcblx0fTtcblxuXHR2YXIgRHJvcHBhYmxlID0gZnVuY3Rpb24oIHVzZXJTZXR0aW5ncyApIHtcblx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRzZXR0aW5ncyA9IHt9LFxuXHRcdFx0ZWxlbWVudHNDYWNoZSA9IHt9LFxuXHRcdFx0ZGVmYXVsdFNldHRpbmdzID0ge1xuXHRcdFx0XHRlbGVtZW50OiAnJyxcblx0XHRcdFx0aXRlbXM6ICc+Jyxcblx0XHRcdFx0aG9yaXpvbnRhbFNlbnNpdGl2aXR5OiAnMTAlJyxcblx0XHRcdFx0YXhpczogWyAndmVydGljYWwnLCAnaG9yaXpvbnRhbCcgXSxcblx0XHRcdFx0Z3JvdXBzOiBudWxsLFxuXHRcdFx0XHRpc0Ryb3BwaW5nQWxsb3dlZDogbnVsbCxcblx0XHRcdFx0b25EcmFnRW50ZXI6IG51bGwsXG5cdFx0XHRcdG9uRHJhZ2dpbmc6IG51bGwsXG5cdFx0XHRcdG9uRHJvcHBpbmc6IG51bGwsXG5cdFx0XHRcdG9uRHJhZ0xlYXZlOiBudWxsXG5cdFx0XHR9O1xuXG5cdFx0dmFyIGluaXRTZXR0aW5ncyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JC5leHRlbmQoIHNldHRpbmdzLCBkZWZhdWx0U2V0dGluZ3MsIHVzZXJTZXR0aW5ncyApO1xuXHRcdH07XG5cblx0XHR2YXIgaW5pdEVsZW1lbnRzQ2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRzQ2FjaGUuJGVsZW1lbnQgPSAkKCBzZXR0aW5ncy5lbGVtZW50ICk7XG5cdFx0fTtcblxuXHRcdHZhciBoYXNIb3Jpem9udGFsRGV0ZWN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gLTEgIT09IHNldHRpbmdzLmF4aXMuaW5kZXhPZiggJ2hvcml6b250YWwnICk7XG5cdFx0fTtcblxuXHRcdHZhciBoYXNWZXJ0aWNhbERldGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIC0xICE9PSBzZXR0aW5ncy5heGlzLmluZGV4T2YoICd2ZXJ0aWNhbCcgKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrSG9yaXpvbnRhbCA9IGZ1bmN0aW9uKCBvZmZzZXRYLCBlbGVtZW50V2lkdGggKSB7XG5cdFx0XHR2YXIgaXNQZXJjZW50VmFsdWUsXG5cdFx0XHRcdHNlbnNpdGl2aXR5O1xuXG5cdFx0XHRpZiAoICEgaGFzSG9yaXpvbnRhbERldGVjdGlvbigpICkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggISBoYXNWZXJ0aWNhbERldGVjdGlvbigpICkge1xuXHRcdFx0XHRyZXR1cm4gb2Zmc2V0WCA+IGVsZW1lbnRXaWR0aCAvIDIgPyAncmlnaHQnIDogJ2xlZnQnO1xuXHRcdFx0fVxuXG5cdFx0XHRzZW5zaXRpdml0eSA9IHNldHRpbmdzLmhvcml6b250YWxTZW5zaXRpdml0eS5tYXRjaCggL1xcZCsvICk7XG5cblx0XHRcdGlmICggISBzZW5zaXRpdml0eSApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRzZW5zaXRpdml0eSA9IHNlbnNpdGl2aXR5WyAwIF07XG5cblx0XHRcdGlzUGVyY2VudFZhbHVlID0gLyUkLy50ZXN0KCBzZXR0aW5ncy5ob3Jpem9udGFsU2Vuc2l0aXZpdHkgKTtcblxuXHRcdFx0aWYgKCBpc1BlcmNlbnRWYWx1ZSApIHtcblx0XHRcdFx0c2Vuc2l0aXZpdHkgPSBlbGVtZW50V2lkdGggLyBzZW5zaXRpdml0eTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBvZmZzZXRYID4gZWxlbWVudFdpZHRoIC0gc2Vuc2l0aXZpdHkgKSB7XG5cdFx0XHRcdHJldHVybiAncmlnaHQnO1xuXHRcdFx0fSBlbHNlIGlmICggb2Zmc2V0WCA8IHNlbnNpdGl2aXR5ICkge1xuXHRcdFx0XHRyZXR1cm4gJ2xlZnQnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHRcdHZhciBnZXRTaWRlID0gZnVuY3Rpb24oIGVsZW1lbnQsIGV2ZW50ICkge1xuXHRcdFx0dmFyICRlbGVtZW50LFxuXHRcdFx0XHR0aGlzSGVpZ2h0LFxuXHRcdFx0XHR0aGlzV2lkdGgsXG5cdFx0XHRcdHNpZGU7XG5cblx0XHRcdGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudDtcblxuXHRcdFx0JGVsZW1lbnQgPSAkKCBlbGVtZW50ICk7XG5cdFx0XHR0aGlzSGVpZ2h0ID0gJGVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcblx0XHRcdHRoaXNXaWR0aCA9ICRlbGVtZW50Lm91dGVyV2lkdGgoKTtcblxuXHRcdFx0aWYgKCBzaWRlID0gY2hlY2tIb3Jpem9udGFsKCBldmVudC5vZmZzZXRYLCB0aGlzV2lkdGggKSApIHtcblx0XHRcdFx0cmV0dXJuIHNpZGU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggISBoYXNWZXJ0aWNhbERldGVjdGlvbigpICkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggZXZlbnQub2Zmc2V0WSA+IHRoaXNIZWlnaHQgLyAyICkge1xuXHRcdFx0XHRzaWRlID0gJ2JvdHRvbSc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzaWRlID0gJ3RvcCc7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzaWRlO1xuXHRcdH07XG5cblx0XHR2YXIgaXNEcm9wcGluZ0FsbG93ZWQgPSBmdW5jdGlvbiggZWxlbWVudCwgc2lkZSwgZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YVRyYW5zZmVyVHlwZXMsXG5cdFx0XHRcdGRyYWdnYWJsZUdyb3Vwcyxcblx0XHRcdFx0aXNHcm91cE1hdGNoLFxuXHRcdFx0XHRpc0Ryb3BwaW5nQWxsb3dlZDtcblxuXHRcdFx0aWYgKCBzZXR0aW5ncy5ncm91cHMgJiYgaGFzRnVsbERhdGFUcmFuc2ZlclN1cHBvcnQoIGV2ZW50ICkgKSB7XG5cblx0XHRcdFx0ZGF0YVRyYW5zZmVyVHlwZXMgPSBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci50eXBlcztcblx0XHRcdFx0aXNHcm91cE1hdGNoID0gZmFsc2U7XG5cblx0XHRcdFx0ZGF0YVRyYW5zZmVyVHlwZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoIGRhdGFUcmFuc2ZlclR5cGVzICk7IC8vIENvbnZlcnQgdG8gYXJyYXksIHNpbmNlIEZpcmVmb3ggaG9sZCBoaW0gYXMgRE9NU3RyaW5nTGlzdFxuXG5cdFx0XHRcdGRhdGFUcmFuc2ZlclR5cGVzLmZvckVhY2goIGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRkcmFnZ2FibGVHcm91cHMgPSBKU09OLnBhcnNlKCB0eXBlICk7XG5cblx0XHRcdFx0XHRcdGlmICggISBkcmFnZ2FibGVHcm91cHMuZ3JvdXBzLnNsaWNlICkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHNldHRpbmdzLmdyb3Vwcy5mb3JFYWNoKCBmdW5jdGlvbiggZ3JvdXBOYW1lICkge1xuXG5cdFx0XHRcdFx0XHRcdGlmICggLTEgIT09IGRyYWdnYWJsZUdyb3Vwcy5ncm91cHMuaW5kZXhPZiggZ3JvdXBOYW1lICkgKSB7XG5cdFx0XHRcdFx0XHRcdFx0aXNHcm91cE1hdGNoID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7IC8vIHN0b3BzIHRoZSBmb3JFYWNoIGZyb20gZXh0cmEgbG9vcHNcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSApO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdGlmICggISBpc0dyb3VwTWF0Y2ggKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggJC5pc0Z1bmN0aW9uKCBzZXR0aW5ncy5pc0Ryb3BwaW5nQWxsb3dlZCApICkge1xuXG5cdFx0XHRcdGlzRHJvcHBpbmdBbGxvd2VkID0gc2V0dGluZ3MuaXNEcm9wcGluZ0FsbG93ZWQuY2FsbCggZWxlbWVudCwgc2lkZSwgZXZlbnQsIHNlbGYgKTtcblxuXHRcdFx0XHRpZiAoICEgaXNEcm9wcGluZ0FsbG93ZWQgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH07XG5cblx0XHR2YXIgb25EcmFnRW50ZXIgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRpZiAoIGV2ZW50LnRhcmdldCAhPT0gdGhpcyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBdm9pZCBpbnRlcm5hbCBlbGVtZW50cyBldmVudCBmaXJpbmdcblx0XHRcdCQoIHRoaXMgKS5jaGlsZHJlbigpLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgY3VycmVudFBvaW50ZXJFdmVudHMgPSB0aGlzLnN0eWxlLnBvaW50ZXJFdmVudHM7XG5cblx0XHRcdFx0aWYgKCAnbm9uZScgPT09IGN1cnJlbnRQb2ludGVyRXZlbnRzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQoIHRoaXMgKVxuXHRcdFx0XHRcdC5kYXRhKCAnYmFja3VwLXBvaW50ZXItZXZlbnRzJywgY3VycmVudFBvaW50ZXJFdmVudHMgKVxuXHRcdFx0XHRcdC5jc3MoICdwb2ludGVyLWV2ZW50cycsICdub25lJyApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHR2YXIgc2lkZSA9IGdldFNpZGUoIHRoaXMsIGV2ZW50ICk7XG5cblx0XHRcdGlmICggISBpc0Ryb3BwaW5nQWxsb3dlZCggdGhpcywgc2lkZSwgZXZlbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoICQuaXNGdW5jdGlvbiggc2V0dGluZ3Mub25EcmFnRW50ZXIgKSApIHtcblx0XHRcdFx0c2V0dGluZ3Mub25EcmFnRW50ZXIuY2FsbCggdGhpcywgc2lkZSwgZXZlbnQsIHNlbGYgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIG9uRHJhZ092ZXIgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgc2lkZSA9IGdldFNpZGUoIHRoaXMsIGV2ZW50ICk7XG5cblx0XHRcdGlmICggISBpc0Ryb3BwaW5nQWxsb3dlZCggdGhpcywgc2lkZSwgZXZlbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRpZiAoICQuaXNGdW5jdGlvbiggc2V0dGluZ3Mub25EcmFnZ2luZyApICkge1xuXHRcdFx0XHRzZXR0aW5ncy5vbkRyYWdnaW5nLmNhbGwoIHRoaXMsIHNpZGUsIGV2ZW50LCBzZWxmICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBvbkRyb3AgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgc2lkZSA9IGdldFNpZGUoIHRoaXMsIGV2ZW50ICk7XG5cblx0XHRcdGlmICggISBpc0Ryb3BwaW5nQWxsb3dlZCggdGhpcywgc2lkZSwgZXZlbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRpZiAoICQuaXNGdW5jdGlvbiggc2V0dGluZ3Mub25Ecm9wcGluZyApICkge1xuXHRcdFx0XHRzZXR0aW5ncy5vbkRyb3BwaW5nLmNhbGwoIHRoaXMsIHNpZGUsIGV2ZW50LCBzZWxmICk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBvbkRyYWdMZWF2ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdC8vIEF2b2lkIGludGVybmFsIGVsZW1lbnRzIGV2ZW50IGZpcmluZ1xuXHRcdFx0JCggdGhpcyApLmNoaWxkcmVuKCkuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciAkdGhpcyA9ICQoIHRoaXMgKSxcblx0XHRcdFx0XHRiYWNrdXBQb2ludGVyRXZlbnRzID0gJHRoaXMuZGF0YSggJ2JhY2t1cC1wb2ludGVyLWV2ZW50cycgKTtcblxuXHRcdFx0XHRpZiAoIHVuZGVmaW5lZCA9PT0gYmFja3VwUG9pbnRlckV2ZW50cyApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkdGhpc1xuXHRcdFx0XHRcdC5yZW1vdmVEYXRhKCAnYmFja3VwLXBvaW50ZXItZXZlbnRzJyApXG5cdFx0XHRcdFx0LmNzcyggJ3BvaW50ZXItZXZlbnRzJywgYmFja3VwUG9pbnRlckV2ZW50cyApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRpZiAoICQuaXNGdW5jdGlvbiggc2V0dGluZ3Mub25EcmFnTGVhdmUgKSApIHtcblx0XHRcdFx0c2V0dGluZ3Mub25EcmFnTGVhdmUuY2FsbCggdGhpcywgZXZlbnQsIHNlbGYgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIGF0dGFjaEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudHNDYWNoZS4kZWxlbWVudFxuXHRcdFx0XHQub24oICdkcmFnZW50ZXInLCBzZXR0aW5ncy5pdGVtcywgb25EcmFnRW50ZXIgKVxuXHRcdFx0XHQub24oICdkcmFnb3ZlcicsIHNldHRpbmdzLml0ZW1zLCBvbkRyYWdPdmVyIClcblx0XHRcdFx0Lm9uKCAnZHJvcCcsIHNldHRpbmdzLml0ZW1zLCBvbkRyb3AgKVxuXHRcdFx0XHQub24oICdkcmFnbGVhdmUgZHJvcCcsIHNldHRpbmdzLml0ZW1zLCBvbkRyYWdMZWF2ZSApO1xuXHRcdH07XG5cblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aW5pdFNldHRpbmdzKCk7XG5cblx0XHRcdGluaXRFbGVtZW50c0NhY2hlKCk7XG5cblx0XHRcdGF0dGFjaEV2ZW50cygpO1xuXHRcdH07XG5cblx0XHR0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRzQ2FjaGUuJGVsZW1lbnRcblx0XHRcdFx0Lm9mZiggJ2RyYWdlbnRlcicsIHNldHRpbmdzLml0ZW1zLCBvbkRyYWdFbnRlciApXG5cdFx0XHRcdC5vZmYoICdkcmFnb3ZlcicsIHNldHRpbmdzLml0ZW1zLCBvbkRyYWdPdmVyIClcblx0XHRcdFx0Lm9mZiggJ2Ryb3AnLCBzZXR0aW5ncy5pdGVtcywgb25Ecm9wIClcblx0XHRcdFx0Lm9mZiggJ2RyYWdsZWF2ZSBkcm9wJywgc2V0dGluZ3MuaXRlbXMsIG9uRHJhZ0xlYXZlICk7XG5cdFx0fTtcblxuXHRcdGluaXQoKTtcblx0fTtcblxuXHR2YXIgcGx1Z2lucyA9IHtcblx0XHRodG1sNURyYWdnYWJsZTogRHJhZ2dhYmxlLFxuXHRcdGh0bWw1RHJvcHBhYmxlOiBEcm9wcGFibGVcblx0fTtcblxuXHQkLmVhY2goIHBsdWdpbnMsIGZ1bmN0aW9uKCBwbHVnaW5OYW1lLCBQbHVnaW4gKSB7XG5cdFx0JC5mblsgcGx1Z2luTmFtZSBdID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGluc3RhbmNlID0gJC5kYXRhKCB0aGlzLCBwbHVnaW5OYW1lICksXG5cdFx0XHRcdFx0aGFzSW5zdGFuY2UgPSBpbnN0YW5jZSBpbnN0YW5jZW9mIFBsdWdpbjtcblxuXHRcdFx0XHRpZiAoIGhhc0luc3RhbmNlICkge1xuXG5cdFx0XHRcdFx0aWYgKCAnZGVzdHJveScgPT09IG9wdGlvbnMgKSB7XG5cblx0XHRcdFx0XHRcdGluc3RhbmNlLmRlc3Ryb3koKTtcblxuXHRcdFx0XHRcdFx0JC5yZW1vdmVEYXRhKCB0aGlzLCBwbHVnaW5OYW1lICk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0b3B0aW9ucy5lbGVtZW50ID0gdGhpcztcblxuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIHBsdWdpbk5hbWUsIG5ldyBQbHVnaW4oIG9wdGlvbnMgKSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXHR9ICk7XG59KSggalF1ZXJ5ICk7XG4iLCIvKiFcbiAqIGpRdWVyeSBTZXJpYWxpemUgT2JqZWN0IHYxLjAuMVxuICovXG4oZnVuY3Rpb24oICQgKSB7XG5cdCQuZm4uZWxlbWVudG9yU2VyaWFsaXplT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcmlhbGl6ZWRBcnJheSA9IHRoaXMuc2VyaWFsaXplQXJyYXkoKSxcblx0XHRcdGRhdGEgPSB7fTtcblxuXHRcdHZhciBwYXJzZU9iamVjdCA9IGZ1bmN0aW9uKCBkYXRhQ29udGFpbmVyLCBrZXksIHZhbHVlICkge1xuXHRcdFx0dmFyIGlzQXJyYXlLZXkgPSAvXlteXFxbXFxdXStcXFtdLy50ZXN0KCBrZXkgKSxcblx0XHRcdFx0aXNPYmplY3RLZXkgPSAvXlteXFxbXFxdXStcXFtbXlxcW1xcXV0rXS8udGVzdCgga2V5ICksXG5cdFx0XHRcdGtleU5hbWUgPSBrZXkucmVwbGFjZSggL1xcWy4qLywgJycgKTtcblxuXHRcdFx0aWYgKCBpc0FycmF5S2V5ICkge1xuXHRcdFx0XHRpZiAoICEgZGF0YUNvbnRhaW5lclsga2V5TmFtZSBdICkge1xuXHRcdFx0XHRcdGRhdGFDb250YWluZXJbIGtleU5hbWUgXSA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoICEgaXNPYmplY3RLZXkgKSB7XG5cdFx0XHRcdFx0aWYgKCBkYXRhQ29udGFpbmVyLnB1c2ggKSB7XG5cdFx0XHRcdFx0XHRkYXRhQ29udGFpbmVyLnB1c2goIHZhbHVlICk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFDb250YWluZXJbIGtleU5hbWUgXSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggISBkYXRhQ29udGFpbmVyWyBrZXlOYW1lIF0gKSB7XG5cdFx0XHRcdFx0ZGF0YUNvbnRhaW5lclsga2V5TmFtZSBdID0ge307XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dmFyIG5leHRLZXlzID0ga2V5Lm1hdGNoKCAvXFxbW15cXFtcXF1dKl0vZyApO1xuXG5cdFx0XHRuZXh0S2V5c1sgMCBdID0gbmV4dEtleXNbIDAgXS5yZXBsYWNlKCAvXFxbfF0vZywgJycgKTtcblxuXHRcdFx0cmV0dXJuIHBhcnNlT2JqZWN0KCBkYXRhQ29udGFpbmVyWyBrZXlOYW1lIF0sIG5leHRLZXlzLmpvaW4oICcnICksIHZhbHVlICk7XG5cdFx0fTtcblxuXHRcdCQuZWFjaCggc2VyaWFsaXplZEFycmF5LCBmdW5jdGlvbigpIHtcblx0XHRcdHBhcnNlT2JqZWN0KCBkYXRhLCB0aGlzLm5hbWUsIHRoaXMudmFsdWUgKTtcblx0XHR9ICk7XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH07XG59KSggalF1ZXJ5ICk7XG4iLCJ2YXIgTW9kYWxzO1xuXG5Nb2RhbHMgPSB7XG5cdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaW5pdE1vZGFsV2lkZ2V0VHlwZSgpO1xuXHR9LFxuXG5cdGluaXRNb2RhbFdpZGdldFR5cGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtb2RhbFByb3BlcnRpZXMgPSB7XG5cdFx0XHRnZXREZWZhdWx0U2V0dGluZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgc2V0dGluZ3MgPSBEaWFsb2dzTWFuYWdlci5nZXRXaWRnZXRUeXBlKCAnb3B0aW9ucycgKS5wcm90b3R5cGUuZ2V0RGVmYXVsdFNldHRpbmdzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdFx0XHRyZXR1cm4gXy5leHRlbmQoIHNldHRpbmdzLCB7XG5cdFx0XHRcdFx0cG9zaXRpb246IHtcblx0XHRcdFx0XHRcdG15OiAnY2VudGVyJyxcblx0XHRcdFx0XHRcdGF0OiAnY2VudGVyJ1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Y29udGVudFdpZHRoOiAnYXV0bycsXG5cdFx0XHRcdFx0Y29udGVudEhlaWdodDogJ2F1dG8nLFxuXHRcdFx0XHRcdGNsb3NlQnV0dG9uOiB0cnVlXG5cdFx0XHRcdH0gKTtcblx0XHRcdH0sXG5cdFx0XHRidWlsZFdpZGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdERpYWxvZ3NNYW5hZ2VyLmdldFdpZGdldFR5cGUoICdvcHRpb25zJyApLnByb3RvdHlwZS5idWlsZFdpZGdldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRcdFx0aWYgKCAhIHRoaXMuZ2V0U2V0dGluZ3MoICdjbG9zZUJ1dHRvbicgKSApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgJGNsb3NlQnV0dG9uID0gdGhpcy5hZGRFbGVtZW50KCAnY2xvc2VCdXR0b24nLCAnPGRpdj48aSBjbGFzcz1cImZhIGZhLXRpbWVzXCI+PC9pPjwvZGl2PicgKTtcblxuXHRcdFx0XHR0aGlzLmdldEVsZW1lbnRzKCAnd2lkZ2V0Q29udGVudCcgKS5wcmVwZW5kKCAkY2xvc2VCdXR0b24gKTtcblx0XHRcdH0sXG5cdFx0XHRhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAoIHRoaXMuZ2V0U2V0dGluZ3MoICdjbG9zZUJ1dHRvbicgKSApIHtcblx0XHRcdFx0XHR0aGlzLmdldEVsZW1lbnRzKCAnY2xvc2VCdXR0b24nICkub24oICdjbGljaycsIHRoaXMuaGlkZSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0b25SZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdERpYWxvZ3NNYW5hZ2VyLmdldFdpZGdldFR5cGUoICdvcHRpb25zJyApLnByb3RvdHlwZS5vblJlYWR5LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdFx0XHR2YXIgZWxlbWVudHMgPSB0aGlzLmdldEVsZW1lbnRzKCksXG5cdFx0XHRcdFx0c2V0dGluZ3MgPSB0aGlzLmdldFNldHRpbmdzKCk7XG5cblx0XHRcdFx0aWYgKCAnYXV0bycgIT09IHNldHRpbmdzLmNvbnRlbnRXaWR0aCApIHtcblx0XHRcdFx0XHRlbGVtZW50cy5tZXNzYWdlLndpZHRoKCBzZXR0aW5ncy5jb250ZW50V2lkdGggKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggJ2F1dG8nICE9PSBzZXR0aW5ncy5jb250ZW50SGVpZ2h0ICkge1xuXHRcdFx0XHRcdGVsZW1lbnRzLm1lc3NhZ2UuaGVpZ2h0KCBzZXR0aW5ncy5jb250ZW50SGVpZ2h0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0RGlhbG9nc01hbmFnZXIuYWRkV2lkZ2V0VHlwZSggJ2VsZW1lbnRvci1tb2RhbCcsIERpYWxvZ3NNYW5hZ2VyLmdldFdpZGdldFR5cGUoICdvcHRpb25zJyApLmV4dGVuZCggJ2VsZW1lbnRvci1tb2RhbCcsIG1vZGFsUHJvcGVydGllcyApICk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWxzO1xuIiwidmFyIHByZXNldHNGYWN0b3J5O1xuXG5wcmVzZXRzRmFjdG9yeSA9IHtcblxuXHRnZXRQcmVzZXRzRGljdGlvbmFyeTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdDExOiAxMDAgLyA5LFxuXHRcdFx0MTI6IDEwMCAvIDgsXG5cdFx0XHQxNDogMTAwIC8gNyxcblx0XHRcdDE2OiAxMDAgLyA2LFxuXHRcdFx0MzM6IDEwMCAvIDMsXG5cdFx0XHQ2NjogMiAvIDMgKiAxMDAsXG5cdFx0XHQ4MzogNSAvIDYgKiAxMDBcblx0XHR9O1xuXHR9LFxuXG5cdGdldEFic29sdXRlUHJlc2V0VmFsdWVzOiBmdW5jdGlvbiggcHJlc2V0ICkge1xuXHRcdHZhciBjbG9uZWRQcmVzZXQgPSBlbGVtZW50b3IuaGVscGVycy5jbG9uZU9iamVjdCggcHJlc2V0ICksXG5cdFx0XHRwcmVzZXREaWN0aW9uYXJ5ID0gdGhpcy5nZXRQcmVzZXRzRGljdGlvbmFyeSgpO1xuXG5cdFx0Xy5lYWNoKCBjbG9uZWRQcmVzZXQsIGZ1bmN0aW9uKCB1bml0VmFsdWUsIHVuaXRJbmRleCApIHtcblx0XHRcdGlmICggcHJlc2V0RGljdGlvbmFyeVsgdW5pdFZhbHVlIF0gKSB7XG5cdFx0XHRcdGNsb25lZFByZXNldFsgdW5pdEluZGV4IF0gPSBwcmVzZXREaWN0aW9uYXJ5WyB1bml0VmFsdWUgXTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gY2xvbmVkUHJlc2V0O1xuXHR9LFxuXG5cdGdldFByZXNldHM6IGZ1bmN0aW9uKCBjb2x1bW5zQ291bnQsIHByZXNldEluZGV4ICkge1xuXHRcdHZhciBwcmVzZXRzID0gZWxlbWVudG9yLmhlbHBlcnMuY2xvbmVPYmplY3QoIGVsZW1lbnRvci5jb25maWcuZWxlbWVudHMuc2VjdGlvbi5wcmVzZXRzICk7XG5cblx0XHRpZiAoIGNvbHVtbnNDb3VudCApIHtcblx0XHRcdHByZXNldHMgPSBwcmVzZXRzWyBjb2x1bW5zQ291bnQgXTtcblx0XHR9XG5cblx0XHRpZiAoIHByZXNldEluZGV4ICkge1xuXHRcdFx0cHJlc2V0cyA9IHByZXNldHNbIHByZXNldEluZGV4IF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHByZXNldHM7XG5cdH0sXG5cblx0Z2V0UHJlc2V0QnlTdHJ1Y3R1cmU6IGZ1bmN0aW9uKCBzdHJ1Y3R1cmUgKSB7XG5cdFx0dmFyIHBhcnNlZFN0cnVjdHVyZSA9IHRoaXMuZ2V0UGFyc2VkU3RydWN0dXJlKCBzdHJ1Y3R1cmUgKTtcblxuXHRcdHJldHVybiB0aGlzLmdldFByZXNldHMoIHBhcnNlZFN0cnVjdHVyZS5jb2x1bW5zQ291bnQsIHBhcnNlZFN0cnVjdHVyZS5wcmVzZXRJbmRleCApO1xuXHR9LFxuXG5cdGdldFBhcnNlZFN0cnVjdHVyZTogZnVuY3Rpb24oIHN0cnVjdHVyZSApIHtcblx0XHRzdHJ1Y3R1cmUgKz0gJyc7IC8vIE1ha2Ugc3VyZSB0aGlzIGlzIGEgc3RyaW5nXG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29sdW1uc0NvdW50OiBzdHJ1Y3R1cmUuc2xpY2UoIDAsIC0xICksXG5cdFx0XHRwcmVzZXRJbmRleDogc3RydWN0dXJlLnN1YnN0ciggLTEgKVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0UHJlc2V0U1ZHOiBmdW5jdGlvbiggcHJlc2V0LCBzdmdXaWR0aCwgc3ZnSGVpZ2h0LCBzZXBhcmF0b3JXaWR0aCApIHtcblx0XHRzdmdXaWR0aCA9IHN2Z1dpZHRoIHx8IDEwMDtcblx0XHRzdmdIZWlnaHQgPSBzdmdIZWlnaHQgfHwgNTA7XG5cdFx0c2VwYXJhdG9yV2lkdGggPSBzZXBhcmF0b3JXaWR0aCB8fCAyO1xuXG5cdFx0dmFyIGFic29sdXRlUHJlc2V0VmFsdWVzID0gdGhpcy5nZXRBYnNvbHV0ZVByZXNldFZhbHVlcyggcHJlc2V0ICksXG5cdFx0XHRwcmVzZXRTVkdQYXRoID0gdGhpcy5fZ2VuZXJhdGVQcmVzZXRTVkdQYXRoKCBhYnNvbHV0ZVByZXNldFZhbHVlcywgc3ZnV2lkdGgsIHN2Z0hlaWdodCwgc2VwYXJhdG9yV2lkdGggKTtcblxuXHRcdHJldHVybiB0aGlzLl9jcmVhdGVTVkdQcmVzZXQoIHByZXNldFNWR1BhdGgsIHN2Z1dpZHRoLCBzdmdIZWlnaHQgKTtcblx0fSxcblxuXHRfY3JlYXRlU1ZHUHJlc2V0OiBmdW5jdGlvbiggcHJlc2V0UGF0aCwgc3ZnV2lkdGgsIHN2Z0hlaWdodCApIHtcblx0XHR2YXIgc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJyApO1xuXG5cdFx0c3ZnLnNldEF0dHJpYnV0ZU5TKCAnaHR0cDovL3d3dy53My5vcmcvMjAwMC94bWxucy8nLCAneG1sbnM6eGxpbmsnLCAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycgKTtcblx0XHRzdmcuc2V0QXR0cmlidXRlKCAndmlld0JveCcsICcwIDAgJyArIHN2Z1dpZHRoICsgJyAnICsgc3ZnSGVpZ2h0ICk7XG5cblx0XHR2YXIgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3BhdGgnICk7XG5cblx0XHRwYXRoLnNldEF0dHJpYnV0ZSggJ2QnLCBwcmVzZXRQYXRoICk7XG5cblx0XHRzdmcuYXBwZW5kQ2hpbGQoIHBhdGggKTtcblxuXHRcdHJldHVybiBzdmc7XG5cdH0sXG5cblx0X2dlbmVyYXRlUHJlc2V0U1ZHUGF0aDogZnVuY3Rpb24oIHByZXNldCwgc3ZnV2lkdGgsIHN2Z0hlaWdodCwgc2VwYXJhdG9yV2lkdGggKSB7XG5cdFx0dmFyIERSQVdfU0laRSA9IHN2Z1dpZHRoIC0gc2VwYXJhdG9yV2lkdGggKiAoIHByZXNldC5sZW5ndGggLSAxICk7XG5cblx0XHR2YXIgeFBvaW50ZXIgPSAwLFxuXHRcdFx0ZE91dHB1dCA9ICcnO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgcHJlc2V0Lmxlbmd0aDsgaSsrICkge1xuXHRcdFx0aWYgKCBpICkge1xuXHRcdFx0XHRkT3V0cHV0ICs9ICcgJztcblx0XHRcdH1cblxuXHRcdFx0dmFyIGluY3JlbWVudCA9IHByZXNldFsgaSBdIC8gMTAwICogRFJBV19TSVpFO1xuXG5cdFx0XHR4UG9pbnRlciArPSBpbmNyZW1lbnQ7XG5cblx0XHRcdGRPdXRwdXQgKz0gJ00nICsgKCAreFBvaW50ZXIudG9GaXhlZCggNCApICkgKyAnLDAnO1xuXG5cdFx0XHRkT3V0cHV0ICs9ICdWJyArIHN2Z0hlaWdodDtcblxuXHRcdFx0ZE91dHB1dCArPSAnSCcgKyAoICsoIHhQb2ludGVyIC0gaW5jcmVtZW50ICkudG9GaXhlZCggNCApICk7XG5cblx0XHRcdGRPdXRwdXQgKz0gJ1YwWic7XG5cblx0XHRcdHhQb2ludGVyICs9IHNlcGFyYXRvcldpZHRoO1xuXHRcdH1cblxuXHRcdHJldHVybiBkT3V0cHV0O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHByZXNldHNGYWN0b3J5O1xuIiwidmFyIFNjaGVtZXM7XG5cblNjaGVtZXMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdHN0eWxlUnVsZXMgPSB7fSxcblx0XHRzY2hlbWVzID0ge30sXG5cdFx0c2V0dGluZ3MgPSB7XG5cdFx0XHRzZWxlY3RvcldyYXBwZXJQcmVmaXg6ICcuZWxlbWVudG9yLXdpZGdldC0nXG5cdFx0fSxcblx0XHRlbGVtZW50cyA9IHt9O1xuXG5cdHZhciBidWlsZFVJID0gZnVuY3Rpb24oKSB7XG5cdFx0ZWxlbWVudHMuJHByZXZpZXdIZWFkLmFwcGVuZCggZWxlbWVudHMuJHN0eWxlICk7XG5cdH07XG5cblx0dmFyIGluaXRFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRzLiRzdHlsZSA9IEJhY2tib25lLiQoICc8c3R5bGU+Jywge1xuXHRcdFx0aWQ6ICdlbGVtZW50b3Itc3R5bGUtc2NoZW1lJ1xuXHRcdH0pO1xuXG5cdFx0ZWxlbWVudHMuJHByZXZpZXdIZWFkID0gZWxlbWVudG9yLiRwcmV2aWV3Q29udGVudHMuZmluZCggJ2hlYWQnICk7XG5cdH07XG5cblx0dmFyIGluaXRTY2hlbWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0c2NoZW1lcyA9IGVsZW1lbnRvci5oZWxwZXJzLmNsb25lT2JqZWN0KCBlbGVtZW50b3IuY29uZmlnLnNjaGVtZXMuaXRlbXMgKTtcblx0fTtcblxuXHR2YXIgYWRkU3R5bGVSdWxlID0gZnVuY3Rpb24oIHNlbGVjdG9yLCBwcm9wZXJ0eSApIHtcblx0XHRpZiAoICEgc3R5bGVSdWxlc1sgc2VsZWN0b3IgXSApIHtcblx0XHRcdHN0eWxlUnVsZXNbIHNlbGVjdG9yIF0gPSBbXTtcblx0XHR9XG5cblx0XHRzdHlsZVJ1bGVzWyBzZWxlY3RvciBdLnB1c2goIHByb3BlcnR5ICk7XG5cdH07XG5cblx0dmFyIGZldGNoQ29udHJvbFN0eWxlcyA9IGZ1bmN0aW9uKCBjb250cm9sLCB3aWRnZXRUeXBlICkge1xuXHRcdF8uZWFjaCggY29udHJvbC5zZWxlY3RvcnMsIGZ1bmN0aW9uKCBjc3NQcm9wZXJ0eSwgc2VsZWN0b3IgKSB7XG5cdFx0XHR2YXIgY3VycmVudFNjaGVtZVZhbHVlID0gc2VsZi5nZXRTY2hlbWVWYWx1ZSggY29udHJvbC5zY2hlbWUudHlwZSwgY29udHJvbC5zY2hlbWUudmFsdWUsIGNvbnRyb2wuc2NoZW1lLmtleSApLFxuXHRcdFx0XHRvdXRwdXRTZWxlY3Rvcixcblx0XHRcdFx0b3V0cHV0Q3NzUHJvcGVydHk7XG5cblx0XHRcdGlmICggXy5pc0VtcHR5KCBjdXJyZW50U2NoZW1lVmFsdWUudmFsdWUgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRvdXRwdXRTZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoIC9cXHtcXHtXUkFQUEVSXFx9XFx9L2csIHNldHRpbmdzLnNlbGVjdG9yV3JhcHBlclByZWZpeCArIHdpZGdldFR5cGUgKTtcblx0XHRcdG91dHB1dENzc1Byb3BlcnR5ID0gZWxlbWVudG9yLmdldENvbnRyb2xJdGVtVmlldygpLnJlcGxhY2VTdHlsZVZhbHVlcyggY3NzUHJvcGVydHksIGN1cnJlbnRTY2hlbWVWYWx1ZS52YWx1ZSApO1xuXG5cdFx0XHRhZGRTdHlsZVJ1bGUoIG91dHB1dFNlbGVjdG9yLCBvdXRwdXRDc3NQcm9wZXJ0eSApO1xuXHRcdH0gKTtcblx0fTtcblxuXHR2YXIgZmV0Y2hXaWRnZXRDb250cm9sc1N0eWxlcyA9IGZ1bmN0aW9uKCB3aWRnZXQsIHdpZGdldFR5cGUgKSB7XG5cdFx0dmFyIHdpZGdldFNjaGVtZUNvbnRyb2xzID0gc2VsZi5nZXRXaWRnZXRTY2hlbWVDb250cm9scyggd2lkZ2V0ICk7XG5cblx0XHRfLmVhY2goIHdpZGdldFNjaGVtZUNvbnRyb2xzLCBmdW5jdGlvbiggY29udHJvbCApIHtcblx0XHRcdGZldGNoQ29udHJvbFN0eWxlcyggY29udHJvbCwgd2lkZ2V0VHlwZSApO1xuXHRcdH0gKTtcblx0fTtcblxuXHR2YXIgZmV0Y2hBbGxXaWRnZXRzU2NoZW1lc1N0eWxlID0gZnVuY3Rpb24oKSB7XG5cdFx0Xy5lYWNoKCBlbGVtZW50b3IuY29uZmlnLndpZGdldHMsIGZ1bmN0aW9uKCB3aWRnZXQsIHdpZGdldFR5cGUgKSB7XG5cdFx0XHRmZXRjaFdpZGdldENvbnRyb2xzU3R5bGVzKCAgd2lkZ2V0LCB3aWRnZXRUeXBlICApO1xuXHRcdH0gKTtcblx0fTtcblxuXHR2YXIgcGFyc2VTY2hlbWVTdHlsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzdHJpbmdPdXRwdXQgPSAnJztcblxuXHRcdF8uZWFjaCggc3R5bGVSdWxlcywgZnVuY3Rpb24oIHByb3BlcnRpZXMsIHNlbGVjdG9yICkge1xuXHRcdFx0c3RyaW5nT3V0cHV0ICs9IHNlbGVjdG9yICsgJ3snICsgcHJvcGVydGllcy5qb2luKCAnJyApICsgJ30nO1xuXHRcdH0gKTtcblxuXHRcdHJldHVybiBzdHJpbmdPdXRwdXQ7XG5cdH07XG5cblx0dmFyIHJlc2V0U3R5bGVSdWxlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdHN0eWxlUnVsZXMgPSB7fTtcblx0fTtcblxuXHR0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcblx0XHRpbml0RWxlbWVudHMoKTtcblx0XHRidWlsZFVJKCk7XG5cdFx0aW5pdFNjaGVtZXMoKTtcblxuXHRcdHJldHVybiBzZWxmO1xuXHR9O1xuXG5cdHRoaXMuZ2V0V2lkZ2V0U2NoZW1lQ29udHJvbHMgPSBmdW5jdGlvbiggd2lkZ2V0ICkge1xuXHRcdHJldHVybiBfLmZpbHRlciggd2lkZ2V0LmNvbnRyb2xzLCBmdW5jdGlvbiggY29udHJvbCApIHtcblx0XHRcdHJldHVybiBfLmlzT2JqZWN0KCBjb250cm9sLnNjaGVtZSApO1xuXHRcdH0gKTtcblx0fTtcblxuXHR0aGlzLmdldFNjaGVtZXMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2NoZW1lcztcblx0fTtcblxuXHR0aGlzLmdldEVuYWJsZWRTY2hlbWVzVHlwZXMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZWxlbWVudG9yLmNvbmZpZy5zY2hlbWVzLmVuYWJsZWRfc2NoZW1lcztcblx0fTtcblxuXHR0aGlzLmdldFNjaGVtZSA9IGZ1bmN0aW9uKCBzY2hlbWVUeXBlICkge1xuXHRcdHJldHVybiBzY2hlbWVzWyBzY2hlbWVUeXBlIF07XG5cdH07XG5cblx0dGhpcy5nZXRTY2hlbWVWYWx1ZSA9IGZ1bmN0aW9uKCBzY2hlbWVUeXBlLCB2YWx1ZSwga2V5ICkge1xuXHRcdGlmICggdGhpcy5nZXRFbmFibGVkU2NoZW1lc1R5cGVzKCkuaW5kZXhPZiggc2NoZW1lVHlwZSApIDwgMCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR2YXIgc2NoZW1lID0gc2VsZi5nZXRTY2hlbWUoIHNjaGVtZVR5cGUgKSxcblx0XHRcdHNjaGVtZVZhbHVlID0gc2NoZW1lLml0ZW1zWyB2YWx1ZSBdO1xuXG5cdFx0aWYgKCBrZXkgJiYgXy5pc09iamVjdCggc2NoZW1lVmFsdWUgKSApIHtcblx0XHRcdHZhciBjbG9uZWRTY2hlbWVWYWx1ZSA9IGVsZW1lbnRvci5oZWxwZXJzLmNsb25lT2JqZWN0KCBzY2hlbWVWYWx1ZSApO1xuXG5cdFx0XHRjbG9uZWRTY2hlbWVWYWx1ZS52YWx1ZSA9IHNjaGVtZVZhbHVlLnZhbHVlWyBrZXkgXTtcblxuXHRcdFx0cmV0dXJuIGNsb25lZFNjaGVtZVZhbHVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBzY2hlbWVWYWx1ZTtcblx0fTtcblxuXHR0aGlzLnByaW50U2NoZW1lc1N0eWxlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmVzZXRTdHlsZVJ1bGVzKCk7XG5cdFx0ZmV0Y2hBbGxXaWRnZXRzU2NoZW1lc1N0eWxlKCk7XG5cblx0XHRlbGVtZW50cy4kc3R5bGUudGV4dCggcGFyc2VTY2hlbWVTdHlsZSgpICk7XG5cdH07XG5cblx0dGhpcy5yZXNldFNjaGVtZXMgPSBmdW5jdGlvbiggc2NoZW1lTmFtZSApIHtcblx0XHRzY2hlbWVzWyBzY2hlbWVOYW1lIF0gPSBlbGVtZW50b3IuaGVscGVycy5jbG9uZU9iamVjdCggZWxlbWVudG9yLmNvbmZpZy5zY2hlbWVzLml0ZW1zWyBzY2hlbWVOYW1lIF0gKTtcblxuXHRcdHRoaXMub25TY2hlbWVDaGFuZ2UoKTtcblx0fTtcblxuXHR0aGlzLnNhdmVTY2hlbWUgPSBmdW5jdGlvbiggc2NoZW1lTmFtZSApIHtcblx0XHRlbGVtZW50b3IuY29uZmlnLnNjaGVtZXMuaXRlbXNbIHNjaGVtZU5hbWUgXS5pdGVtcyA9IGVsZW1lbnRvci5oZWxwZXJzLmNsb25lT2JqZWN0KCBzY2hlbWVzWyBzY2hlbWVOYW1lIF0uaXRlbXMgKTtcblxuXHRcdE5Qcm9ncmVzcy5zdGFydCgpO1xuXG5cdFx0ZWxlbWVudG9yLmFqYXguc2VuZCggJ2FwcGx5X3NjaGVtZScsIHtcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0c2NoZW1lX25hbWU6IHNjaGVtZU5hbWUsXG5cdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KCBzY2hlbWVzWyBzY2hlbWVOYW1lIF0uaXRlbXMgKVxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHROUHJvZ3Jlc3MuZG9uZSgpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fTtcblxuXHR0aGlzLnNldFNjaGVtZVZhbHVlID0gZnVuY3Rpb24oIHNjaGVtZU5hbWUsIGl0ZW1LZXksIHZhbHVlICkge1xuXHRcdHNjaGVtZXNbIHNjaGVtZU5hbWUgXS5pdGVtc1sgaXRlbUtleSBdLnZhbHVlID0gdmFsdWU7XG5cblx0XHR0aGlzLm9uU2NoZW1lQ2hhbmdlKCk7XG5cdH07XG5cblx0dGhpcy5vblNjaGVtZUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucHJpbnRTY2hlbWVzU3R5bGUoKTtcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNjaGVtZXMoKTtcbiIsIiggZnVuY3Rpb24oICQgKSB7XG5cblx0dmFyIFN0eWxlc2hlZXQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRydWxlcyA9IHt9LFxuXHRcdFx0ZGV2aWNlcyA9IHt9O1xuXG5cdFx0dmFyIGdldERldmljZU1heFZhbHVlID0gZnVuY3Rpb24oIGRldmljZU5hbWUgKSB7XG5cdFx0XHR2YXIgZGV2aWNlTmFtZXMgPSBPYmplY3Qua2V5cyggZGV2aWNlcyApLFxuXHRcdFx0XHRkZXZpY2VOYW1lSW5kZXggPSBkZXZpY2VOYW1lcy5pbmRleE9mKCBkZXZpY2VOYW1lICksXG5cdFx0XHRcdG5leHRJbmRleCA9IGRldmljZU5hbWVJbmRleCArIDE7XG5cblx0XHRcdGlmICggbmV4dEluZGV4ID49IGRldmljZU5hbWVzLmxlbmd0aCApIHtcblx0XHRcdFx0dGhyb3cgbmV3IFJhbmdlRXJyb3IoICdNYXggdmFsdWUgZm9yIHRoaXMgZGV2aWNlIGlzIG91dCBvZiByYW5nZS4nICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBkZXZpY2VzWyBkZXZpY2VOYW1lc1sgbmV4dEluZGV4IF0gXSAtIDE7XG5cdFx0fTtcblxuXHRcdHZhciBxdWVyeVRvSGFzaCA9IGZ1bmN0aW9uKCBxdWVyeSApIHtcblx0XHRcdHZhciBoYXNoID0gW107XG5cblx0XHRcdCQuZWFjaCggcXVlcnksIGZ1bmN0aW9uKCBlbmRQb2ludCApIHtcblx0XHRcdFx0aGFzaC5wdXNoKCBlbmRQb2ludCArICdfJyArIHRoaXMgKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0cmV0dXJuIGhhc2guam9pbiggJy0nICk7XG5cdFx0fTtcblxuXHRcdHZhciBoYXNoVG9RdWVyeSA9IGZ1bmN0aW9uKCBoYXNoICkge1xuXHRcdFx0dmFyIHF1ZXJ5ID0ge307XG5cblx0XHRcdGhhc2ggPSBoYXNoLnNwbGl0KCAnLScgKS5maWx0ZXIoIFN0cmluZyApO1xuXG5cdFx0XHRoYXNoLmZvckVhY2goIGZ1bmN0aW9uKCBzaW5nbGVRdWVyeSApIHtcblx0XHRcdFx0dmFyIHF1ZXJ5UGFydHMgPSBzaW5nbGVRdWVyeS5zcGxpdCggJ18nICksXG5cdFx0XHRcdFx0ZW5kUG9pbnQgPSBxdWVyeVBhcnRzWzBdLFxuXHRcdFx0XHRcdGRldmljZU5hbWUgPSBxdWVyeVBhcnRzWzFdO1xuXG5cdFx0XHRcdHF1ZXJ5WyBlbmRQb2ludCBdID0gJ21heCcgPT09IGVuZFBvaW50ID8gZ2V0RGV2aWNlTWF4VmFsdWUoIGRldmljZU5hbWUgKSA6IGRldmljZXNbIGRldmljZU5hbWUgXTtcblx0XHRcdH0gKTtcblxuXHRcdFx0cmV0dXJuIHF1ZXJ5O1xuXHRcdH07XG5cblx0XHR2YXIgYWRkUXVlcnlIYXNoID0gZnVuY3Rpb24oIHF1ZXJ5SGFzaCApIHtcblx0XHRcdHJ1bGVzWyBxdWVyeUhhc2ggXSA9IHt9O1xuXG5cdFx0XHR2YXIgaGFzaGVzID0gT2JqZWN0LmtleXMoIHJ1bGVzICk7XG5cblx0XHRcdGlmICggaGFzaGVzLmxlbmd0aCA8IDIgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU29ydCB0aGUgZGV2aWNlcyBmcm9tIG5hcnJvd2VzdCB0byB3aWRlc3Rcblx0XHRcdGhhc2hlcy5zb3J0KCBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRcdFx0aWYgKCAnYWxsJyA9PT0gYSApIHtcblx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoICdhbGwnID09PSBiICkge1xuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFRdWVyeSA9IGhhc2hUb1F1ZXJ5KCBhICksXG5cdFx0XHRcdFx0YlF1ZXJ5ID0gaGFzaFRvUXVlcnkoIGIgKTtcblxuXHRcdFx0XHRyZXR1cm4gYlF1ZXJ5Lm1heCAtIGFRdWVyeS5tYXg7XG5cdFx0XHR9ICk7XG5cblx0XHRcdHZhciBzb3J0ZWRSdWxlcyA9IHt9O1xuXG5cdFx0XHRoYXNoZXMuZm9yRWFjaCggZnVuY3Rpb24oIGRldmljZU5hbWUgKSB7XG5cdFx0XHRcdHNvcnRlZFJ1bGVzWyBkZXZpY2VOYW1lIF0gPSBydWxlc1sgZGV2aWNlTmFtZSBdO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRydWxlcyA9IHNvcnRlZFJ1bGVzO1xuXHRcdH07XG5cblx0XHR0aGlzLmFkZERldmljZSA9IGZ1bmN0aW9uKCBkZXZpY2VOYW1lLCBkZXZpY2VWYWx1ZSApIHtcblx0XHRcdGRldmljZXNbIGRldmljZU5hbWUgXSA9IGRldmljZVZhbHVlO1xuXG5cdFx0XHR2YXIgZGV2aWNlTmFtZXMgPSBPYmplY3Qua2V5cyggZGV2aWNlcyApO1xuXG5cdFx0XHRpZiAoIGRldmljZU5hbWVzLmxlbmd0aCA8IDIgKSB7XG5cdFx0XHRcdHJldHVybiBzZWxmO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTb3J0IHRoZSBkZXZpY2VzIGZyb20gbmFycm93ZXN0IHRvIHdpZGVzdFxuXHRcdFx0ZGV2aWNlTmFtZXMuc29ydCggZnVuY3Rpb24oIGEsIGIgKSB7XG5cdFx0XHRcdHJldHVybiBkZXZpY2VzWyBhIF0gLSBkZXZpY2VzWyBiIF07XG5cdFx0XHR9ICk7XG5cblx0XHRcdHZhciBzb3J0ZWREZXZpY2VzID0ge307XG5cblx0XHRcdGRldmljZU5hbWVzLmZvckVhY2goIGZ1bmN0aW9uKCBkZXZpY2VOYW1lICkge1xuXHRcdFx0XHRzb3J0ZWREZXZpY2VzWyBkZXZpY2VOYW1lIF0gPSBkZXZpY2VzWyBkZXZpY2VOYW1lIF07XG5cdFx0XHR9ICk7XG5cblx0XHRcdGRldmljZXMgPSBzb3J0ZWREZXZpY2VzO1xuXG5cdFx0XHRyZXR1cm4gc2VsZjtcblx0XHR9O1xuXG5cdFx0dmFyIGdldFF1ZXJ5SGFzaFN0eWxlRm9ybWF0ID0gZnVuY3Rpb24oIHF1ZXJ5SGFzaCApIHtcblx0XHRcdHZhciBxdWVyeSA9IGhhc2hUb1F1ZXJ5KCBxdWVyeUhhc2ggKSxcblx0XHRcdFx0c3R5bGVGb3JtYXQgPSBbXTtcblxuXHRcdFx0JC5lYWNoKCBxdWVyeSwgZnVuY3Rpb24oIGVuZFBvaW50ICkge1xuXHRcdFx0XHRzdHlsZUZvcm1hdC5wdXNoKCAnKCcgKyBlbmRQb2ludCArICctd2lkdGg6JyArIHRoaXMgKyAncHgpJyApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRyZXR1cm4gJ0BtZWRpYScgKyBzdHlsZUZvcm1hdC5qb2luKCAnIGFuZCAnICk7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkUnVsZXMgPSBmdW5jdGlvbiggc2VsZWN0b3IsIHN0eWxlUnVsZXMsIHF1ZXJ5ICkge1xuXHRcdFx0dmFyIHF1ZXJ5SGFzaCA9ICdhbGwnO1xuXG5cdFx0XHRpZiAoIHF1ZXJ5ICkge1xuXHRcdFx0XHRxdWVyeUhhc2ggPSBxdWVyeVRvSGFzaCggcXVlcnkgKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAhIHJ1bGVzWyBxdWVyeUhhc2ggXSApIHtcblx0XHRcdFx0YWRkUXVlcnlIYXNoKCBxdWVyeUhhc2ggKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCAhIHJ1bGVzWyBxdWVyeUhhc2ggXVsgc2VsZWN0b3IgXSApIHtcblx0XHRcdFx0cnVsZXNbIHF1ZXJ5SGFzaCBdWyBzZWxlY3RvciBdID0ge307XG5cdFx0XHR9XG5cblx0XHRcdGlmICggJ3N0cmluZycgPT09IHR5cGVvZiBzdHlsZVJ1bGVzICkge1xuXHRcdFx0XHRzdHlsZVJ1bGVzID0gc3R5bGVSdWxlcy5zcGxpdCggJzsnICkuZmlsdGVyKCBTdHJpbmcgKTtcblxuXHRcdFx0XHR2YXIgb3JkZXJlZFJ1bGVzID0ge307XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQkLmVhY2goIHN0eWxlUnVsZXMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5zcGxpdCggLzooLiopPy8gKTtcblx0XHRcdFx0XHRcdG9yZGVyZWRSdWxlc1sgcHJvcGVydHlbIDAgXS50cmltKCkgXSA9IHByb3BlcnR5WyAxIF0udHJpbSgpLnJlcGxhY2UoICc7JywgJycgKTtcblx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdH0gY2F0Y2ggKCBlcnJvciApIHsgLy8gQXQgbGVhc3Qgb25lIG9mIHRoZSBwcm9wZXJ0aWVzIGlzIGluY29ycmVjdFxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN0eWxlUnVsZXMgPSBvcmRlcmVkUnVsZXM7XG5cdFx0XHR9XG5cblx0XHRcdCQuZXh0ZW5kKCBydWxlc1sgcXVlcnlIYXNoIF1bIHNlbGVjdG9yIF0sIHN0eWxlUnVsZXMgKTtcblxuXHRcdFx0cmV0dXJuIHNlbGY7XG5cdFx0fTtcblxuXHRcdHRoaXMuZW1wdHkgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJ1bGVzID0ge307XG5cdFx0fTtcblxuXHRcdHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBzdHlsZVRleHQgPSAnJztcblxuXHRcdFx0JC5lYWNoKCBydWxlcywgZnVuY3Rpb24oIHF1ZXJ5SGFzaCApIHtcblx0XHRcdFx0dmFyIGRldmljZVRleHQgPSBTdHlsZXNoZWV0LnBhcnNlUnVsZXMoIHRoaXMgKTtcblxuXHRcdFx0XHRpZiAoICdhbGwnICE9PSBxdWVyeUhhc2ggKSB7XG5cdFx0XHRcdFx0ZGV2aWNlVGV4dCA9IGdldFF1ZXJ5SGFzaFN0eWxlRm9ybWF0KCBxdWVyeUhhc2ggKSArICd7JyArIGRldmljZVRleHQgKyAnfSc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdHlsZVRleHQgKz0gZGV2aWNlVGV4dDtcblx0XHRcdH0gKTtcblxuXHRcdFx0cmV0dXJuIHN0eWxlVGV4dDtcblx0XHR9O1xuXHR9O1xuXG5cdFN0eWxlc2hlZXQucGFyc2VSdWxlcyA9IGZ1bmN0aW9uKCBydWxlcyApIHtcblx0XHR2YXIgcGFyc2VkUnVsZXMgPSAnJztcblxuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBzZWxlY3RvciApIHtcblx0XHRcdHZhciBzZWxlY3RvckNvbnRlbnQgPSBTdHlsZXNoZWV0LnBhcnNlUHJvcGVydGllcyggdGhpcyApO1xuXG5cdFx0XHRpZiAoIHNlbGVjdG9yQ29udGVudCApIHtcblx0XHRcdFx0cGFyc2VkUnVsZXMgKz0gc2VsZWN0b3IgKyAneycgKyBzZWxlY3RvckNvbnRlbnQgKyAnfSc7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIHBhcnNlZFJ1bGVzO1xuXHR9O1xuXG5cdFN0eWxlc2hlZXQucGFyc2VQcm9wZXJ0aWVzID0gZnVuY3Rpb24oIHByb3BlcnRpZXMgKSB7XG5cdFx0dmFyIHBhcnNlZFByb3BlcnRpZXMgPSAnJztcblxuXHRcdCQuZWFjaCggcHJvcGVydGllcywgZnVuY3Rpb24oIHByb3BlcnR5S2V5ICkge1xuXHRcdFx0aWYgKCB0aGlzICkge1xuXHRcdFx0XHRwYXJzZWRQcm9wZXJ0aWVzICs9IHByb3BlcnR5S2V5ICsgJzonICsgdGhpcyArICc7Jztcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRyZXR1cm4gcGFyc2VkUHJvcGVydGllcztcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IFN0eWxlc2hlZXQ7XG59ICkoIGpRdWVyeSApO1xuIiwidmFyIEJhc2VTZXR0aW5nc01vZGVsID0gcmVxdWlyZSggJ2VsZW1lbnRvci1tb2RlbHMvYmFzZS1zZXR0aW5ncycgKSxcblx0U3R5bGVzaGVldCA9IHJlcXVpcmUoICdlbGVtZW50b3ItdXRpbHMvc3R5bGVzaGVldCcgKSxcblx0QmFzZUVsZW1lbnRWaWV3O1xuXG5CYXNlRWxlbWVudFZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKCB7XG5cdHRhZ05hbWU6ICdkaXYnLFxuXG5cdGlkOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRFbGVtZW50VW5pcXVlQ2xhc3MoKTtcblx0fSxcblxuXHRhdHRyaWJ1dGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9IHRoaXMubW9kZWwuZ2V0KCAnZWxUeXBlJyApO1xuXG5cdFx0aWYgKCAnd2lkZ2V0JyAgPT09IHR5cGUgKSB7XG5cdFx0XHR0eXBlID0gdGhpcy5tb2RlbC5nZXQoICd3aWRnZXRUeXBlJyApO1xuXHRcdH1cblx0XHRyZXR1cm4ge1xuXHRcdFx0J2RhdGEtZWxlbWVudF90eXBlJzogdHlwZVxuXHRcdH07XG5cdH0sXG5cblx0YmFzZUV2ZW50czoge30sXG5cblx0ZWxlbWVudEV2ZW50czoge30sXG5cblx0c3R5bGVzaGVldDogbnVsbCxcblx0JHN0eWxlc2hlZXRFbGVtZW50OiBudWxsLFxuXG5cdGdldEVsZW1lbnRUeXBlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tb2RlbC5nZXQoICdlbFR5cGUnICk7XG5cdH0sXG5cblx0Z2V0Q2hpbGRUeXBlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZWxlbWVudG9yLmhlbHBlcnMuZ2V0RWxlbWVudENoaWxkVHlwZSggdGhpcy5nZXRFbGVtZW50VHlwZSgpICk7XG5cdH0sXG5cblx0dGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZWxlbWVudE1vZGVsOiB0aGlzLm1vZGVsXG5cdFx0fTtcblx0fSxcblxuXHRldmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLmV4dGVuZCgge30sIHRoaXMuYmFzZUV2ZW50cywgdGhpcy5lbGVtZW50RXZlbnRzICk7XG5cdH0sXG5cblx0Z2V0VGVtcGxhdGVUeXBlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2pzJztcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvLyBncmFiIHRoZSBjaGlsZCBjb2xsZWN0aW9uIGZyb20gdGhlIHBhcmVudCBtb2RlbFxuXHRcdC8vIHNvIHRoYXQgd2UgY2FuIHJlbmRlciB0aGUgY29sbGVjdGlvbiBhcyBjaGlsZHJlblxuXHRcdC8vIG9mIHRoaXMgcGFyZW50IGVsZW1lbnRcblx0XHR0aGlzLmNvbGxlY3Rpb24gPSB0aGlzLm1vZGVsLmdldCggJ2VsZW1lbnRzJyApO1xuXG5cdFx0aWYgKCB0aGlzLmNvbGxlY3Rpb24gKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmNvbGxlY3Rpb24sICdhZGQgcmVtb3ZlIHJlc2V0JywgdGhpcy5vbkNvbGxlY3Rpb25DaGFuZ2VkLCB0aGlzICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSwgJ2NoYW5nZScsIHRoaXMub25TZXR0aW5nc0NoYW5nZWQsIHRoaXMgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLmdldCggJ2VkaXRTZXR0aW5ncycgKSwgJ2NoYW5nZScsIHRoaXMub25TZXR0aW5nc0NoYW5nZWQsIHRoaXMgKTtcblxuXHRcdHRoaXMub24oICdyZW5kZXInLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucmVuZGVyVUkoKTtcblx0XHRcdHRoaXMucnVuUmVhZHlUcmlnZ2VyKCk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5pbml0UmVtb3ZlRGlhbG9nKCk7XG5cblx0XHR0aGlzLmluaXRTdHlsZXNoZWV0KCk7XG5cdH0sXG5cblx0YWRkQ2hpbGRNb2RlbDogZnVuY3Rpb24oIG1vZGVsLCBvcHRpb25zICkge1xuXHRcdHJldHVybiB0aGlzLmNvbGxlY3Rpb24uYWRkKCBtb2RlbCwgb3B0aW9ucywgdHJ1ZSApO1xuXHR9LFxuXG5cdGlzQ29sbGVjdGlvbkZpbGxlZDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdGlzSW5uZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAhISB0aGlzLm1vZGVsLmdldCggJ2lzSW5uZXInICk7XG5cdH0sXG5cblx0aW5pdFJlbW92ZURpYWxvZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlbW92ZURpYWxvZztcblxuXHRcdHRoaXMuZ2V0UmVtb3ZlRGlhbG9nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICEgcmVtb3ZlRGlhbG9nICkge1xuXHRcdFx0XHR2YXIgZWxlbWVudFRpdGxlID0gdGhpcy5tb2RlbC5nZXRUaXRsZSgpO1xuXG5cdFx0XHRcdHJlbW92ZURpYWxvZyA9IGVsZW1lbnRvci5kaWFsb2dzTWFuYWdlci5jcmVhdGVXaWRnZXQoICdjb25maXJtJywge1xuXHRcdFx0XHRcdG1lc3NhZ2U6IGVsZW1lbnRvci50cmFuc2xhdGUoICdkaWFsb2dfY29uZmlybV9kZWxldGUnLCBbIGVsZW1lbnRUaXRsZS50b0xvd2VyQ2FzZSgpIF0gKSxcblx0XHRcdFx0XHRoZWFkZXJNZXNzYWdlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnZGVsZXRlX2VsZW1lbnQnLCBbIGVsZW1lbnRUaXRsZSBdICksXG5cdFx0XHRcdFx0c3RyaW5nczoge1xuXHRcdFx0XHRcdFx0Y29uZmlybTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RlbGV0ZScgKSxcblx0XHRcdFx0XHRcdGNhbmNlbDogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2NhbmNlbCcgKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGVmYXVsdE9wdGlvbjogJ2NvbmZpcm0nLFxuXHRcdFx0XHRcdG9uQ29uZmlybTogXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHRoaXMubW9kZWwuZGVzdHJveSgpO1xuXHRcdFx0XHRcdH0sIHRoaXMgKVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZW1vdmVEaWFsb2c7XG5cdFx0fTtcblx0fSxcblxuXHRpbml0U3R5bGVzaGVldDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zdHlsZXNoZWV0ID0gbmV3IFN0eWxlc2hlZXQoKTtcblxuXHRcdHZhciB2aWV3cG9ydEJyZWFrcG9pbnRzID0gZWxlbWVudG9yLmNvbmZpZy52aWV3cG9ydEJyZWFrcG9pbnRzO1xuXG5cdFx0dGhpcy5zdHlsZXNoZWV0XG5cdFx0XHQuYWRkRGV2aWNlKCAnbW9iaWxlJywgMCApXG5cdFx0XHQuYWRkRGV2aWNlKCAndGFibGV0Jywgdmlld3BvcnRCcmVha3BvaW50cy5tZCApXG5cdFx0XHQuYWRkRGV2aWNlKCAnZGVza3RvcCcsIHZpZXdwb3J0QnJlYWtwb2ludHMubGcgKTtcblx0fSxcblxuXHRlbnF1ZXVlRm9udHM6IGZ1bmN0aW9uKCkge1xuXHRcdF8uZWFjaCggdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKS5nZXRGb250Q29udHJvbHMoKSwgXy5iaW5kKCBmdW5jdGlvbiggY29udHJvbCApIHtcblx0XHRcdHZhciBmb250RmFtaWx5TmFtZSA9IHRoaXMubW9kZWwuZ2V0U2V0dGluZyggY29udHJvbC5uYW1lICk7XG5cdFx0XHRpZiAoIF8uaXNFbXB0eSggZm9udEZhbWlseU5hbWUgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaXNWaXNpYmxlID0gZWxlbWVudG9yLmhlbHBlcnMuaXNDb250cm9sVmlzaWJsZSggY29udHJvbCwgdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSApO1xuXHRcdFx0aWYgKCAhIGlzVmlzaWJsZSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRlbGVtZW50b3IuaGVscGVycy5lbnF1ZXVlRm9udCggZm9udEZhbWlseU5hbWUgKTtcblx0XHR9LCB0aGlzICkgKTtcblx0fSxcblxuXHRyZW5kZXJTdHlsZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdHNldHRpbmdzID0gc2VsZi5tb2RlbC5nZXQoICdzZXR0aW5ncycgKTtcblxuXHRcdHNlbGYuc3R5bGVzaGVldC5lbXB0eSgpO1xuXG5cdFx0c2VsZi5hZGRTdHlsZVJ1bGVzKCBzZXR0aW5ncy5nZXRTdHlsZUNvbnRyb2xzKCksIHNldHRpbmdzLmF0dHJpYnV0ZXMgKTtcblxuXG5cdFx0Lypcblx0XHQgXy5lYWNoKCBzZXR0aW5ncy5nZXRTdHlsZUNvbnRyb2xzKCksIGZ1bmN0aW9uKCBjb250cm9sICkge1xuXHRcdCB2YXIgY29udHJvbFZhbHVlID0gc2VsZi5tb2RlbC5nZXRTZXR0aW5nKCBjb250cm9sLm5hbWUgKTtcblxuXHRcdCBpZiAoICEgXy5pc051bWJlciggY29udHJvbFZhbHVlICkgJiYgXy5pc0VtcHR5KCBjb250cm9sVmFsdWUgKSApIHtcblx0XHQgcmV0dXJuO1xuXHRcdCB9XG5cblx0XHQgdmFyIGlzVmlzaWJsZSA9IGVsZW1lbnRvci5oZWxwZXJzLmlzQ29udHJvbFZpc2libGUoIGNvbnRyb2wsIHNlbGYubW9kZWwuZ2V0KCAnc2V0dGluZ3MnICkgKTtcblx0XHQgaWYgKCAhIGlzVmlzaWJsZSApIHtcblx0XHQgcmV0dXJuO1xuXHRcdCB9XG5cblx0XHQgXy5lYWNoKCBjb250cm9sLnNlbGVjdG9ycywgZnVuY3Rpb24oIGNzc1Byb3BlcnR5LCBzZWxlY3RvciApIHtcblx0XHQgdmFyIG91dHB1dFNlbGVjdG9yID0gc2VsZWN0b3IucmVwbGFjZSggL1xce1xce1dSQVBQRVJ9fS9nLCAnIycgKyBzZWxmLmdldEVsZW1lbnRVbmlxdWVDbGFzcygpICksXG5cdFx0IG91dHB1dENzc1Byb3BlcnR5ID0gZWxlbWVudG9yLmdldENvbnRyb2xJdGVtVmlldyggY29udHJvbC50eXBlICkucmVwbGFjZVN0eWxlVmFsdWVzKCBjc3NQcm9wZXJ0eSwgY29udHJvbFZhbHVlICksXG5cdFx0IHF1ZXJ5O1xuXG5cdFx0IGlmICggXy5pc0VtcHR5KCBvdXRwdXRDc3NQcm9wZXJ0eSApICkge1xuXHRcdCByZXR1cm47XG5cdFx0IH1cblxuXHRcdCBpZiAoIGNvbnRyb2wucmVzcG9uc2l2ZSAmJiAnZGVza3RvcCcgIT09IGNvbnRyb2wucmVzcG9uc2l2ZSApIHtcblx0XHQgcXVlcnkgPSB7IG1heDogY29udHJvbC5yZXNwb25zaXZlIH07XG5cdFx0IH1cblxuXHRcdCBzZWxmLnN0eWxlc2hlZXQuYWRkUnVsZXMoIG91dHB1dFNlbGVjdG9yLCBvdXRwdXRDc3NQcm9wZXJ0eSwgcXVlcnkgKTtcblx0XHQgfSApO1xuXHRcdCB9ICk7XG5cdFx0ICovXG5cblxuXG5cblx0XHRpZiAoICdjb2x1bW4nID09PSBzZWxmLm1vZGVsLmdldCggJ2VsVHlwZScgKSApIHtcblx0XHRcdHZhciBpbmxpbmVTaXplID0gc2VsZi5tb2RlbC5nZXRTZXR0aW5nKCAnX2lubGluZV9zaXplJyApO1xuXG5cdFx0XHRpZiAoICEgXy5pc0VtcHR5KCBpbmxpbmVTaXplICkgKSB7XG5cdFx0XHRcdHNlbGYuc3R5bGVzaGVldC5hZGRSdWxlcyggJyMnICsgc2VsZi5nZXRFbGVtZW50VW5pcXVlQ2xhc3MoKSwgeyB3aWR0aDogaW5saW5lU2l6ZSArICclJyB9LCB7IG1pbjogJ3RhYmxldCcgfSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHNlbGYuYWRkU3R5bGVUb0RvY3VtZW50KCk7XG5cblx0XHQvLyBSZW5kZXIgY3VzdG9tIENTU1xuXHRcdHNlbGYucmVuZGVyQ3VzdG9tQ1NTKCk7XG5cdH0sXG5cblx0cmVuZGVyQ3VzdG9tQ1NTOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY3VzdG9tQ1NTID0gdGhpcy5tb2RlbC5nZXRTZXR0aW5nKCAnX2N1c3RvbV9jc3MnICksXG5cdFx0XHRzdHlsZUlkID0gJ2VsZW1lbnRvci1zdHlsZS0nICsgdGhpcy5tb2RlbC5nZXQoICdpZCcgKSArICctY3VzdG9tJztcblxuXHRcdHZhciAkZXhpc3RpbmcgPSBlbGVtZW50b3IuJHByZXZpZXdDb250ZW50cy5maW5kKCAnIycgKyBzdHlsZUlkICk7XG5cblx0XHQvLyBTYW1lIHZpZXcg4oCUIHVwZGF0ZSBpbiBwbGFjZVxuXHRcdGlmICggJGV4aXN0aW5nLmxlbmd0aCAmJiB0aGlzLiRjdXN0b21DU1NFbGVtZW50ICYmICRleGlzdGluZ1swXSA9PT0gdGhpcy4kY3VzdG9tQ1NTRWxlbWVudFswXSApIHtcblx0XHRcdGlmICggXy5pc0VtcHR5KCBjdXN0b21DU1MgKSApIHtcblx0XHRcdFx0dGhpcy4kY3VzdG9tQ1NTRWxlbWVudC5yZW1vdmUoKTtcblx0XHRcdFx0dGhpcy4kY3VzdG9tQ1NTRWxlbWVudCA9IG51bGw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgc2VsZWN0b3IgPSAnLmVsZW1lbnRvci1lbGVtZW50LmVsZW1lbnRvci1lbGVtZW50LScgKyB0aGlzLm1vZGVsLmdldCggJ2lkJyApO1xuXHRcdFx0XHR0aGlzLiRjdXN0b21DU1NFbGVtZW50LnRleHQoIGN1c3RvbUNTUy5yZXBsYWNlKCAvc2VsZWN0b3IvZywgc2VsZWN0b3IgKSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIERpZmZlcmVudCB2aWV3IG93bnMgdGhlIGVsZW1lbnQg4oCUIGludmFsaWRhdGUgaXRzIHJlZmVyZW5jZVxuXHRcdGlmICggJGV4aXN0aW5nLmxlbmd0aCApIHtcblx0XHRcdCRleGlzdGluZy5yZW1vdmUoKTtcblx0XHR9XG5cblx0XHR0aGlzLiRjdXN0b21DU1NFbGVtZW50ID0gbnVsbDtcblxuXHRcdGlmICggXy5pc0VtcHR5KCBjdXN0b21DU1MgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc2VsZWN0b3IgPSAnLmVsZW1lbnRvci1lbGVtZW50LmVsZW1lbnRvci1lbGVtZW50LScgKyB0aGlzLm1vZGVsLmdldCggJ2lkJyApO1xuXHRcdGN1c3RvbUNTUyA9IGN1c3RvbUNTUy5yZXBsYWNlKCAvc2VsZWN0b3IvZywgc2VsZWN0b3IgKTtcblxuXHRcdHRoaXMuJGN1c3RvbUNTU0VsZW1lbnQgPSBCYWNrYm9uZS4kKCAnPHN0eWxlPicsIHsgaWQ6IHN0eWxlSWQgfSApO1xuXHRcdGVsZW1lbnRvci4kcHJldmlld0NvbnRlbnRzLmZpbmQoICdoZWFkJyApLmFwcGVuZCggdGhpcy4kY3VzdG9tQ1NTRWxlbWVudCApO1xuXHRcdHRoaXMuJGN1c3RvbUNTU0VsZW1lbnQudGV4dCggY3VzdG9tQ1NTICk7XG5cdH0sXG5cblx0YWRkU3R5bGVSdWxlczogZnVuY3Rpb24oIGNvbnRyb2xzLCB2YWx1ZXMsIHBsYWNlaG9sZGVycywgcmVwbGFjZW1lbnRzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHBsYWNlaG9sZGVycyA9IHBsYWNlaG9sZGVycyB8fCBbIC9cXHtcXHtXUkFQUEVSfX0vZyBdO1xuXG5cdFx0cmVwbGFjZW1lbnRzID0gcmVwbGFjZW1lbnRzIHx8IFsgJyMnICsgc2VsZi5nZXRFbGVtZW50VW5pcXVlQ2xhc3MoKSBdO1xuXG5cdFx0Xy5lYWNoKCBjb250cm9scywgZnVuY3Rpb24oIGNvbnRyb2wgKSB7XG5cblx0XHRcdGlmICggY29udHJvbC5zdHlsZUZpZWxkcyApIHtcblx0XHRcdFx0cGxhY2Vob2xkZXJzWzFdID0gJ3t7Q1VSUkVOVF9JVEVNfX0nO1xuXG5cdFx0XHRcdHZhbHVlc1sgY29udHJvbC5uYW1lIF0uZWFjaCggZnVuY3Rpb24oIGl0ZW1Nb2RlbCApIHtcblx0XHRcdFx0XHRyZXBsYWNlbWVudHNbMV0gPSAnLmVsZW1lbnRvci1yZXBlYXRlci1pdGVtLScgKyBpdGVtTW9kZWwuZ2V0KCAnX2lkJyApO1xuXG5cdFx0XHRcdFx0c2VsZi5hZGRTdHlsZVJ1bGVzKCBjb250cm9sLnN0eWxlRmllbGRzLCBpdGVtTW9kZWwuYXR0cmlidXRlcywgcGxhY2Vob2xkZXJzLCByZXBsYWNlbWVudHMgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3NlbGYuYWRkQ29udHJvbFN0eWxlUnVsZXMoIGNvbnRyb2wsIHZhbHVlcywgc2VsZi5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSwgcGxhY2Vob2xkZXJzLCByZXBsYWNlbWVudHMgKTtcblx0XHRcdHNlbGYuYWRkQ29udHJvbFN0eWxlUnVsZXMoIGNvbnRyb2wsIHZhbHVlcywgc2VsZi5tb2RlbC5nZXQoICdzZXR0aW5ncycgKS5jb250cm9scywgcGxhY2Vob2xkZXJzLCByZXBsYWNlbWVudHMgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0YWRkQ29udHJvbFN0eWxlUnVsZXM6IGZ1bmN0aW9uKCBjb250cm9sLCB2YWx1ZXMsIGNvbnRyb2xzU3RhY2ssIHBsYWNlaG9sZGVycywgcmVwbGFjZW1lbnRzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdEJhc2VFbGVtZW50Vmlldy5hZGRDb250cm9sU3R5bGVSdWxlcyggc2VsZi5zdHlsZXNoZWV0LCBjb250cm9sLCBjb250cm9sc1N0YWNrLCBmdW5jdGlvbiggY29udHJvbCApIHtcblx0XHRcdHJldHVybiBzZWxmLmdldFN0eWxlQ29udHJvbFZhbHVlKCBjb250cm9sLCB2YWx1ZXMgKTtcblx0XHR9LCBwbGFjZWhvbGRlcnMsIHJlcGxhY2VtZW50cyApO1xuXHR9LFxuXG5cdGdldFN0eWxlQ29udHJvbFZhbHVlOiBmdW5jdGlvbiggY29udHJvbCwgdmFsdWVzICkge1xuXHRcdHZhciB2YWx1ZSA9IHZhbHVlc1sgY29udHJvbC5uYW1lIF07XG5cblx0XHRpZiAoIGNvbnRyb2wuc2VsZWN0b3JzX2RpY3Rpb25hcnkgKSB7XG5cdFx0XHR2YWx1ZSA9IGNvbnRyb2wuc2VsZWN0b3JzX2RpY3Rpb25hcnlbIHZhbHVlIF0gfHwgdmFsdWU7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIF8uaXNOdW1iZXIoIHZhbHVlICkgJiYgXy5pc0VtcHR5KCB2YWx1ZSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBpc1Zpc2libGUgPSBlbGVtZW50b3IuaGVscGVycy5pc0NvbnRyb2xWaXNpYmxlKCBjb250cm9sLCB0aGlzLm1vZGVsLmdldCggJ3NldHRpbmdzJyApICk7XG5cdFx0aWYgKCAhIGlzVmlzaWJsZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gdmFsdWU7XG5cdH0sXG5cblxuXG5cdC8qXG5cblx0YWRkQ29udHJvbFN0eWxlUnVsZXM6IGZ1bmN0aW9uKCBjb250cm9sLCB2YWx1ZXMsIGNvbnRyb2xzU3RhY2ssIHBsYWNlaG9sZGVycywgcmVwbGFjZW1lbnRzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdHZhbHVlID0gdmFsdWVzWyBjb250cm9sLm5hbWUgXTtcblxuXHRcdGlmICggISBfLmlzTnVtYmVyKCB2YWx1ZSApICYmIF8uaXNFbXB0eSggdmFsdWUgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgaXNWaXNpYmxlID0gZWxlbWVudG9yLmhlbHBlcnMuaXNDb250cm9sVmlzaWJsZSggY29udHJvbCwgdGhpcy5tb2RlbC5nZXQoICdzZXR0aW5ncycgKSApO1xuXHRcdGlmICggISBpc1Zpc2libGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdF8uZWFjaCggY29udHJvbC5zZWxlY3RvcnMsIGZ1bmN0aW9uKCBjc3NQcm9wZXJ0eSwgc2VsZWN0b3IgKSB7XG5cblx0XHRcdHZhciBvdXRwdXRDc3NQcm9wZXJ0eSxcblx0XHRcdFx0cGFyc2VkVmFsdWUgPSAnJyxcblx0XHRcdFx0cGFyc2VyQ29udHJvbCxcblx0XHRcdFx0dmFsdWVUb0luc2VydCA9IHZhbHVlLFxuXHRcdFx0XHRxdWVyeTtcblxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRvdXRwdXRDc3NQcm9wZXJ0eSA9IGNzc1Byb3BlcnR5LnJlcGxhY2UoIC9cXHtcXHsoPzooW14ufV0rKVxcLik/KFtefV0qKX19L2csIGZ1bmN0aW9uKCBvcmlnaW5hbFBocmFzZSwgY29udHJvbE5hbWUsIHBsYWNlaG9sZGVyICkge1xuXG5cdFx0XHRcdFx0aWYgKCBjb250cm9sTmFtZSApIHtcblx0XHRcdFx0XHRcdHBhcnNlckNvbnRyb2wgPSBfLmZpbmRXaGVyZSggY29udHJvbHNTdGFjaywgeyBuYW1lOiBjb250cm9sTmFtZSB9ICk7XG5cblx0XHRcdFx0XHRcdHZhbHVlVG9JbnNlcnQgPSB2YWx1ZXMoIHBhcnNlckNvbnRyb2wgKTtcblxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coY29udHJvbE5hbWUpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2cob3JpZ2luYWxQaHJhc2UpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2cocGxhY2Vob2xkZXIpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2codmFsdWVUb0luc2VydCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cGFyc2VkVmFsdWUgPSBlbGVtZW50b3IuZ2V0Q29udHJvbEl0ZW1WaWV3KCBjb250cm9sLnR5cGUgKS5nZXRTdHlsZVZhbHVlKCBwbGFjZWhvbGRlci50b0xvd2VyQ2FzZSgpLCB2YWx1ZVRvSW5zZXJ0ICk7XG5cblxuXHRcdFx0XHRcdGlmICggJycgPT09IHBhcnNlZFZhbHVlICkge1xuXHRcdFx0XHRcdFx0dGhyb3cgJyc7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnNlZFZhbHVlO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9IGNhdGNoICggZSApIHtcblx0XHRcdFx0Y29uc29sZS5sb2coZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhvdXRwdXRDc3NQcm9wZXJ0eSk7XG5cblxuXHRcdHZhciBvdXRwdXRDc3NQcm9wZXJ0eSA9IGVsZW1lbnRvci5nZXRDb250cm9sSXRlbVZpZXcoIGNvbnRyb2wudHlwZSApLnJlcGxhY2VTdHlsZVZhbHVlcyggY3NzUHJvcGVydHksIHZhbHVlICk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKG91dHB1dENzc1Byb3BlcnR5KTtcblxuXG5cdFx0XHRpZiAoIF8uaXNFbXB0eSggb3V0cHV0Q3NzUHJvcGVydHkgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRfLmVhY2goIHBsYWNlaG9sZGVycywgZnVuY3Rpb24oIHBsYWNlaG9sZGVyLCBpbmRleCApIHtcblx0XHRcdFx0c2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKCBwbGFjZWhvbGRlciwgcmVwbGFjZW1lbnRzWyBpbmRleCBdICk7XG5cdFx0XHR9ICk7XG5cblx0XHRcdGlmICggY29udHJvbC5yZXNwb25zaXZlICYmICdkZXNrdG9wJyAhPT0gY29udHJvbC5yZXNwb25zaXZlICkge1xuXHRcdFx0XHRxdWVyeSA9IHsgbWF4OiBjb250cm9sLnJlc3BvbnNpdmUgfTtcblx0XHRcdH1cblxuXHRcdFx0c2VsZi5zdHlsZXNoZWV0LmFkZFJ1bGVzKCBzZWxlY3Rvciwgb3V0cHV0Q3NzUHJvcGVydHksIHF1ZXJ5ICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdCovXG5cblx0YWRkU3R5bGVUb0RvY3VtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3R5bGVUZXh0ID0gdGhpcy5zdHlsZXNoZWV0LnRvU3RyaW5nKCksXG5cdFx0XHRzdHlsZUlkID0gJ2VsZW1lbnRvci1zdHlsZS0nICsgdGhpcy5tb2RlbC5nZXQoICdpZCcgKTtcblxuXHRcdHZhciAkZXhpc3RpbmcgPSBlbGVtZW50b3IuJHByZXZpZXdDb250ZW50cy5maW5kKCAnIycgKyBzdHlsZUlkICk7XG5cblx0XHQvLyBTYW1lIHZpZXcgdXBkYXRpbmcgaXRzIG93biBzdHlsZXMg4oCUIHVwZGF0ZSB0ZXh0IGluIHBsYWNlXG5cdFx0aWYgKCAkZXhpc3RpbmcubGVuZ3RoICYmIHRoaXMuJHN0eWxlc2hlZXRFbGVtZW50ICYmICRleGlzdGluZ1swXSA9PT0gdGhpcy4kc3R5bGVzaGVldEVsZW1lbnRbMF0gKSB7XG5cdFx0XHRpZiAoIF8uaXNFbXB0eSggc3R5bGVUZXh0ICkgKSB7XG5cdFx0XHRcdHRoaXMuJHN0eWxlc2hlZXRFbGVtZW50LnJlbW92ZSgpO1xuXHRcdFx0XHR0aGlzLiRzdHlsZXNoZWV0RWxlbWVudCA9IG51bGw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiRzdHlsZXNoZWV0RWxlbWVudC50ZXh0KCBzdHlsZVRleHQgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBEaWZmZXJlbnQgdmlldyBvd25zIHRoZSA8c3R5bGU+IChkcmFnLWFuZC1kcm9wKSDigJQgcmVtb3ZlIGl0IHNvXG5cdFx0Ly8gdGhlIG9sZCB2aWV3J3MgY2FjaGVkIHJlZmVyZW5jZSBiZWNvbWVzIHN0YWxlIGFuZCBpdHNcblx0XHQvLyBvbkJlZm9yZURlc3Ryb3kgLnJlbW92ZSgpIHdpbGwgYmUgYSBuby1vcC5cblx0XHRpZiAoICRleGlzdGluZy5sZW5ndGggKSB7XG5cdFx0XHQkZXhpc3RpbmcucmVtb3ZlKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy4kc3R5bGVzaGVldEVsZW1lbnQgPSBudWxsO1xuXG5cdFx0aWYgKCBfLmlzRW1wdHkoIHN0eWxlVGV4dCApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuJHN0eWxlc2hlZXRFbGVtZW50ID0gQmFja2JvbmUuJCggJzxzdHlsZT4nLCB7IGlkOiBzdHlsZUlkIH0gKTtcblx0XHRlbGVtZW50b3IuJHByZXZpZXdDb250ZW50cy5maW5kKCAnaGVhZCcgKS5hcHBlbmQoIHRoaXMuJHN0eWxlc2hlZXRFbGVtZW50ICk7XG5cdFx0dGhpcy4kc3R5bGVzaGVldEVsZW1lbnQudGV4dCggc3R5bGVUZXh0ICk7XG5cdH0sXG5cblx0cmVuZGVyQ3VzdG9tQ2xhc3NlczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQWRkIGJhc2UgY2xhc3MgYW5kIHVuaXF1ZSBlbGVtZW50IGNsYXNzIChzYW1lIGFzIElEIGZvciBDU1Mgc2VsZWN0b3IgY29tcGF0aWJpbGl0eSlcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2VsZW1lbnRvci1lbGVtZW50JyApO1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCB0aGlzLmdldEVsZW1lbnRVbmlxdWVDbGFzcygpICk7XG5cblx0XHR2YXIgc2V0dGluZ3MgPSB0aGlzLm1vZGVsLmdldCggJ3NldHRpbmdzJyApO1xuXG5cdFx0Xy5lYWNoKCBzZXR0aW5ncy5hdHRyaWJ1dGVzLCBfLmJpbmQoIGZ1bmN0aW9uKCB2YWx1ZSwgYXR0cmlidXRlICkge1xuXHRcdFx0aWYgKCBzZXR0aW5ncy5pc0NsYXNzQ29udHJvbCggYXR0cmlidXRlICkgKSB7XG5cdFx0XHRcdHZhciBjdXJyZW50Q29udHJvbCA9IHNldHRpbmdzLmdldENvbnRyb2woIGF0dHJpYnV0ZSApO1xuXG5cdFx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCBjdXJyZW50Q29udHJvbC5wcmVmaXhfY2xhc3MgKyBzZXR0aW5ncy5wcmV2aW91cyggYXR0cmlidXRlICkgKTtcblxuXHRcdFx0XHR2YXIgaXNWaXNpYmxlID0gZWxlbWVudG9yLmhlbHBlcnMuaXNDb250cm9sVmlzaWJsZSggY3VycmVudENvbnRyb2wsIHRoaXMubW9kZWwuZ2V0KCAnc2V0dGluZ3MnICkgKTtcblxuXHRcdFx0XHRpZiAoIGlzVmlzaWJsZSAmJiAhIF8uaXNFbXB0eSggc2V0dGluZ3MuZ2V0KCBhdHRyaWJ1dGUgKSApICkge1xuXHRcdFx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCBjdXJyZW50Q29udHJvbC5wcmVmaXhfY2xhc3MgKyBzZXR0aW5ncy5nZXQoIGF0dHJpYnV0ZSApICk7XG5cdFx0XHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoIF8ucmVzdWx0KCB0aGlzLCAnY2xhc3NOYW1lJyApICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LCB0aGlzICkgKTtcblx0fSxcblxuXHRyZW5kZXJVSTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5yZW5kZXJTdHlsZXMoKTtcblx0XHR0aGlzLnJlbmRlckN1c3RvbUNsYXNzZXMoKTtcblx0XHR0aGlzLnJlbmRlckN1c3RvbUF0dHJpYnV0ZXMoKTtcblx0XHR0aGlzLmVucXVldWVGb250cygpO1xuXHR9LFxuXG5cdC8vIEF0dHJpYnV0ZXMgYmxhY2tsaXN0IChzYW1lIGFzIFBIUClcblx0X2F0dHJpYnV0ZXNCbGFja2xpc3Q6IFtcblx0XHQnaWQnLCAnY2xhc3MnLCAnZGF0YS1pZCcsICdkYXRhLXNldHRpbmdzJywgJ2RhdGEtZWxlbWVudF90eXBlJyxcblx0XHQnZGF0YS13aWRnZXRfdHlwZScsICdkYXRhLW1vZGVsLWNpZCdcblx0XSxcblxuXHQvLyBTdG9yZSBwcmV2aW91cyBjdXN0b20gYXR0cmlidXRlcyB0byByZW1vdmUgdGhlbSBvbiBjaGFuZ2Vcblx0X3ByZXZpb3VzQ3VzdG9tQXR0cmlidXRlczogW10sXG5cblx0cmVuZGVyQ3VzdG9tQXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0Y3VzdG9tQXR0cmlidXRlcyA9IHRoaXMubW9kZWwuZ2V0U2V0dGluZyggJ19jdXN0b21fYXR0cmlidXRlcycgKTtcblxuXHRcdC8vIFJlbW92ZSBwcmV2aW91cyBjdXN0b20gYXR0cmlidXRlc1xuXHRcdF8uZWFjaCggdGhpcy5fcHJldmlvdXNDdXN0b21BdHRyaWJ1dGVzLCBmdW5jdGlvbiggYXR0ck5hbWUgKSB7XG5cdFx0XHRzZWxmLiRlbC5yZW1vdmVBdHRyKCBhdHRyTmFtZSApO1xuXHRcdH0pO1xuXHRcdHRoaXMuX3ByZXZpb3VzQ3VzdG9tQXR0cmlidXRlcyA9IFtdO1xuXG5cdFx0aWYgKCBfLmlzRW1wdHkoIGN1c3RvbUF0dHJpYnV0ZXMgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBQYXJzZSBhdHRyaWJ1dGVzIChmb3JtYXQ6IGtleXx2YWx1ZSBwZXIgbGluZSlcblx0XHR2YXIgbGluZXMgPSBjdXN0b21BdHRyaWJ1dGVzLnNwbGl0KCAnXFxuJyApO1xuXG5cdFx0Xy5lYWNoKCBsaW5lcywgZnVuY3Rpb24oIGxpbmUgKSB7XG5cdFx0XHRsaW5lID0gbGluZS50cmltKCk7XG5cdFx0XHRpZiAoIF8uaXNFbXB0eSggbGluZSApICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoICd8JyApLFxuXHRcdFx0XHRhdHRyS2V5ID0gcGFydHNbMF0udHJpbSgpLnRvTG93ZXJDYXNlKCksXG5cdFx0XHRcdGF0dHJWYWx1ZSA9IHBhcnRzWzFdID8gcGFydHNbMV0udHJpbSgpIDogJyc7XG5cblx0XHRcdC8vIFZhbGlkYXRlIGF0dHJpYnV0ZSBuYW1lIChvbmx5IHZhbGlkIGNoYXJhY3RlcnMpXG5cdFx0XHRpZiAoICEgL15bYS16XVstX2EtejAtOV0qJC8udGVzdCggYXR0cktleSApICkge1xuXHRcdFx0XHR2YXIgbWF0Y2ggPSBhdHRyS2V5Lm1hdGNoKCAvWy1fYS16MC05XSsvICk7XG5cdFx0XHRcdGlmICggISBtYXRjaCApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0YXR0cktleSA9IG1hdGNoWzBdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBCbG9jayBkYW5nZXJvdXMgYXR0cmlidXRlcyAob24qIGV2ZW50cywgaHJlZilcblx0XHRcdGlmICggYXR0cktleSA9PT0gJ2hyZWYnIHx8IGF0dHJLZXkuaW5kZXhPZiggJ29uJyApID09PSAwICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIEJsb2NrIGJsYWNrbGlzdGVkIGF0dHJpYnV0ZXNcblx0XHRcdGlmICggXy5jb250YWlucyggc2VsZi5fYXR0cmlidXRlc0JsYWNrbGlzdCwgYXR0cktleSApICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGF0dHJpYnV0ZVxuXHRcdFx0c2VsZi4kZWwuYXR0ciggYXR0cktleSwgYXR0clZhbHVlICk7XG5cdFx0XHRzZWxmLl9wcmV2aW91c0N1c3RvbUF0dHJpYnV0ZXMucHVzaCggYXR0cktleSApO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJ1blJlYWR5VHJpZ2dlcjogZnVuY3Rpb24oKSB7XG5cdFx0Xy5kZWZlciggXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRvckZyb250ZW5kLmVsZW1lbnRzSGFuZGxlci5ydW5SZWFkeVRyaWdnZXIoIHRoaXMuJGVsICk7XG5cdFx0fSwgdGhpcyApICk7XG5cdH0sXG5cblx0Z2V0RWxlbWVudFVuaXF1ZUNsYXNzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VsZW1lbnRvci1lbGVtZW50LScgKyB0aGlzLm1vZGVsLmdldCggJ2lkJyApO1xuXHR9LFxuXG5cdG9uQ29sbGVjdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5zZXRGbGFnRWRpdG9yQ2hhbmdlKCB0cnVlICk7XG5cdH0sXG5cblx0b25TZXR0aW5nc0NoYW5nZWQ6IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcblx0XHRpZiAoIHRoaXMubW9kZWwuZ2V0KCAnZWRpdFNldHRpbmdzJyApICE9PSBzZXR0aW5ncyApIHtcblx0XHRcdC8vIENoYW5nZSBmbGFnIG9ubHkgaWYgc2VydmVyIHNldHRpbmdzIHdhcyBjaGFuZ2VkXG5cdFx0XHRlbGVtZW50b3Iuc2V0RmxhZ0VkaXRvckNoYW5nZSggdHJ1ZSApO1xuXHRcdH1cblxuXHRcdC8vIE1ha2Ugc3VyZSBpcyBjb3JyZWN0IG1vZGVsXG5cdFx0aWYgKCBzZXR0aW5ncyBpbnN0YW5jZW9mIEJhc2VTZXR0aW5nc01vZGVsICkge1xuXHRcdFx0dmFyIGlzQ29udGVudENoYW5nZWQgPSBmYWxzZTtcblxuXHRcdFx0Xy5lYWNoKCBzZXR0aW5ncy5jaGFuZ2VkQXR0cmlidXRlcygpLCBmdW5jdGlvbiggc2V0dGluZ1ZhbHVlLCBzZXR0aW5nS2V5ICkge1xuXHRcdFx0XHR2YXIgY29udHJvbCA9IHNldHRpbmdzLmdldENvbnRyb2woIHNldHRpbmdLZXkgKTtcblxuXHRcdFx0XHRpZiAoICEgY29udHJvbCApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIGNvbnRyb2wuZm9yY2VfcmVuZGVyIHx8ICEgc2V0dGluZ3MuaXNTdHlsZUNvbnRyb2woIHNldHRpbmdLZXkgKSAmJiAhIHNldHRpbmdzLmlzQ2xhc3NDb250cm9sKCBzZXR0aW5nS2V5ICkgKSB7XG5cdFx0XHRcdFx0aXNDb250ZW50Q2hhbmdlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0aWYgKCAhIGlzQ29udGVudENoYW5nZWQgKSB7XG5cdFx0XHRcdHRoaXMucmVuZGVyVUkoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlLXJlbmRlciB0aGUgdGVtcGxhdGVcblx0XHR2YXIgdGVtcGxhdGVUeXBlID0gdGhpcy5nZXRUZW1wbGF0ZVR5cGUoKTtcblxuXHRcdGlmICggJ2pzJyA9PT0gdGVtcGxhdGVUeXBlICkge1xuXHRcdFx0dGhpcy5tb2RlbC5zZXRIdG1sQ2FjaGUoKTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0XHR0aGlzLm1vZGVsLnJlbmRlck9uTGVhdmUgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm1vZGVsLnJlbmRlclJlbW90ZVNlcnZlcigpO1xuXHRcdH1cblx0fSxcblxuXHRvbkNsaWNrUmVtb3ZlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHRoaXMuZ2V0UmVtb3ZlRGlhbG9nKCkuc2hvdygpO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gUmVtb3ZlIGVsZW1lbnQgc3R5bGVzaGVldCBmcm9tIHRoZSBET01cblx0XHRpZiAoIHRoaXMuJHN0eWxlc2hlZXRFbGVtZW50ICkge1xuXHRcdFx0dGhpcy4kc3R5bGVzaGVldEVsZW1lbnQucmVtb3ZlKCk7XG5cdFx0XHR0aGlzLiRzdHlsZXNoZWV0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gUmVtb3ZlIGN1c3RvbSBDU1Mgc3R5bGUgZnJvbSB0aGUgRE9NXG5cdFx0aWYgKCB0aGlzLiRjdXN0b21DU1NFbGVtZW50ICkge1xuXHRcdFx0dGhpcy4kY3VzdG9tQ1NTRWxlbWVudC5yZW1vdmUoKTtcblx0XHRcdHRoaXMuJGN1c3RvbUNTU0VsZW1lbnQgPSBudWxsO1xuXHRcdH1cblx0fVxufSwge1xuXHRhZGRDb250cm9sU3R5bGVSdWxlczogZnVuY3Rpb24oIHN0eWxlc2hlZXQsIGNvbnRyb2wsIGNvbnRyb2xzU3RhY2ssIHZhbHVlQ2FsbGJhY2ssIHBsYWNlaG9sZGVycywgcmVwbGFjZW1lbnRzICkge1xuXHRcdHZhciB2YWx1ZSA9IHZhbHVlQ2FsbGJhY2soIGNvbnRyb2wgKTtcblxuXHRcdGlmICggdW5kZWZpbmVkID09PSB2YWx1ZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRfLmVhY2goIGNvbnRyb2wuc2VsZWN0b3JzLCBmdW5jdGlvbiggY3NzUHJvcGVydHksIHNlbGVjdG9yICkge1xuXG5cdFx0XHR2YXIgb3V0cHV0Q3NzUHJvcGVydHksXG5cdFx0XHRcdHF1ZXJ5O1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRvdXRwdXRDc3NQcm9wZXJ0eSA9IGNzc1Byb3BlcnR5LnJlcGxhY2UoIC9cXHtcXHsoPzooW14ufV0rKVxcLik/KFtefV0qKX19L2csIGZ1bmN0aW9uKCBvcmlnaW5hbFBocmFzZSwgY29udHJvbE5hbWUsIHBsYWNlaG9sZGVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VyQ29udHJvbCA9IGNvbnRyb2wsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVRvSW5zZXJ0ID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjb250cm9sTmFtZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlckNvbnRyb2wgPSBfLmZpbmRXaGVyZSggY29udHJvbHNTdGFjaywgeyBuYW1lOiBjb250cm9sTmFtZSB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlVG9JbnNlcnQgPSB2YWx1ZUNhbGxiYWNrKCBwYXJzZXJDb250cm9sICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VkVmFsdWUgPSBlbGVtZW50b3IuZ2V0Q29udHJvbEl0ZW1WaWV3KCBwYXJzZXJDb250cm9sLnR5cGUgKS5nZXRTdHlsZVZhbHVlKCBwbGFjZWhvbGRlci50b0xvd2VyQ2FzZSgpLCB2YWx1ZVRvSW5zZXJ0ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBpZiB2YWx1ZSBpcyBlbXB0eSwgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAnJyA9PT0gcGFyc2VkVmFsdWUgfHwgdW5kZWZpbmVkID09PSBwYXJzZWRWYWx1ZSB8fCBudWxsID09PSBwYXJzZWRWYWx1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93ICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblx0XHRcdFx0XHRpZiAoJ19fRU1QVFlfXycgPT09IHBhcnNlZFZhbHVlKSB7XG5cdFx0XHRcdFx0XHRwYXJzZWRWYWx1ZSA9ICcnO1xuXHRcdFx0XHRcdH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VkVmFsdWU7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICggXy5pc0VtcHR5KCBvdXRwdXRDc3NQcm9wZXJ0eSApICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cbiAgICAgICAgICAgIF8uZWFjaCggcGxhY2Vob2xkZXJzLCBmdW5jdGlvbiggcGxhY2Vob2xkZXIsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHZhciBwbGFjZWhvbGRlclBhdHRlcm4gPSBuZXcgUmVnRXhwKCBwbGFjZWhvbGRlciwgJ2cnICk7XG5cbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnJlcGxhY2UoIHBsYWNlaG9sZGVyUGF0dGVybiwgcmVwbGFjZW1lbnRzWyBpbmRleCBdICk7XG4gICAgICAgICAgICB9ICk7XG5cblx0XHRcdGlmICggY29udHJvbC5yZXNwb25zaXZlICYmICdkZXNrdG9wJyAhPT0gY29udHJvbC5yZXNwb25zaXZlICkge1xuXHRcdFx0XHRxdWVyeSA9IHsgbWF4OiBjb250cm9sLnJlc3BvbnNpdmUgfTtcblx0XHRcdH1cblxuXHRcdFx0c3R5bGVzaGVldC5hZGRSdWxlcyggc2VsZWN0b3IsIG91dHB1dENzc1Byb3BlcnR5LCBxdWVyeSApO1xuXHRcdH0gKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VFbGVtZW50VmlldzsiLCJ2YXIgQmFzZUVsZW1lbnRWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9iYXNlLWVsZW1lbnQnICksXG5cdEVsZW1lbnRFbXB0eVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2VsZW1lbnQtZW1wdHknICksXG5cdFdpZGdldFZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL3dpZGdldCcgKSxcblx0Q29sdW1uVmlldztcblxuQ29sdW1uVmlldyA9IEJhc2VFbGVtZW50Vmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItZWxlbWVudC1jb2x1bW4tY29udGVudCcgKSxcblxuXHRlbGVtZW50RXZlbnRzOiB7XG5cdFx0J2NsaWNrID4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItY29sdW1uLXNldHRpbmdzLWxpc3QgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1yZW1vdmUnOiAnb25DbGlja1JlbW92ZScsXG5cdFx0J2NsaWNrIEB1aS5saXN0VHJpZ2dlcnMnOiAnb25DbGlja1RyaWdnZXInXG5cdH0sXG5cblx0Z2V0Q2hpbGRWaWV3OiBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0aWYgKCAnc2VjdGlvbicgPT09IG1vZGVsLmdldCggJ2VsVHlwZScgKSApIHtcblx0XHRcdHJldHVybiByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL3NlY3Rpb24nICk7IC8vIFdlIG5lZWQgdG8gcmVxdWlyZSB0aGUgc2VjdGlvbiBkeW5hbWljYWxseVxuXHRcdH1cblxuXHRcdHJldHVybiBXaWRnZXRWaWV3O1xuXHR9LFxuXG5cdGVtcHR5VmlldzogRWxlbWVudEVtcHR5VmlldyxcblxuXHRjbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJ2VsZW1lbnRvci1jb2x1bW4nLFxuXHRcdFx0dHlwZSA9IHRoaXMuaXNJbm5lcigpID8gJ2lubmVyJyA6ICd0b3AnO1xuXG5cdFx0Y2xhc3NlcyArPSAnIGVsZW1lbnRvci0nICsgdHlwZSArICctY29sdW1uJztcblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9LFxuXG5cdGNoaWxkVmlld0NvbnRhaW5lcjogJz4gLmVsZW1lbnRvci1jb2x1bW4td3JhcCA+IC5lbGVtZW50b3Itd2lkZ2V0LXdyYXAnLFxuXG5cdHRyaWdnZXJzOiB7XG5cdFx0J2NsaWNrID4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItY29sdW1uLXNldHRpbmdzLWxpc3QgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1hZGQnOiAnY2xpY2s6bmV3Jyxcblx0XHQnY2xpY2sgPiAuZWxlbWVudG9yLWVsZW1lbnQtb3ZlcmxheSAuZWxlbWVudG9yLWVkaXRvci1jb2x1bW4tc2V0dGluZ3MtbGlzdCAuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LWVkaXQnOiAnY2xpY2s6ZWRpdCcsXG5cdFx0J2NsaWNrID4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItY29sdW1uLXNldHRpbmdzLWxpc3QgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC10cmlnZ2VyJzogJ2NsaWNrOmVkaXQnLFxuXHRcdCdjbGljayA+IC5lbGVtZW50b3ItZWxlbWVudC1vdmVybGF5IC5lbGVtZW50b3ItZWRpdG9yLWNvbHVtbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtZHVwbGljYXRlJzogJ2NsaWNrOmR1cGxpY2F0ZSdcblx0fSxcblxuXHR1aToge1xuXHRcdGNvbHVtblRpdGxlOiAnLmNvbHVtbi10aXRsZScsXG5cdFx0Y29sdW1uSW5uZXI6ICc+IC5lbGVtZW50b3ItY29sdW1uLXdyYXAnLFxuXHRcdGxpc3RUcmlnZ2VyczogJz4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC10cmlnZ2VyJ1xuXHR9LFxuXG5cdGJlaGF2aW9yczoge1xuXHRcdFNvcnRhYmxlOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9zb3J0YWJsZScgKSxcblx0XHRcdGVsQ2hpbGRUeXBlOiAnd2lkZ2V0J1xuXHRcdH0sXG5cdFx0UmVzaXphYmxlOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9yZXNpemFibGUnIClcblx0XHR9LFxuXHRcdEhhbmRsZUR1cGxpY2F0ZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvaGFuZGxlLWR1cGxpY2F0ZScgKVxuXHRcdH0sXG5cdFx0SGFuZGxlRWRpdG9yOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9oYW5kbGUtZWRpdG9yJyApXG5cdFx0fSxcblx0XHRIYW5kbGVFZGl0TW9kZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvaGFuZGxlLWVkaXQtbW9kZScgKVxuXHRcdH0sXG5cdFx0SGFuZGxlQWRkTW9kZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvZHVwbGljYXRlJyApXG5cdFx0fSxcblx0XHRIYW5kbGVFbGVtZW50c1JlbGF0aW9uOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9lbGVtZW50cy1yZWxhdGlvbicgKVxuXHRcdH0sXG5cdFx0Q29udGV4dE1lbnU6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IHJlcXVpcmUoICdlbGVtZW50b3ItYmVoYXZpb3JzL2NvbnRleHQtbWVudScgKVxuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRCYXNlRWxlbWVudFZpZXcucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggZWxlbWVudG9yLmNoYW5uZWxzLmRhdGEsICd3aWRnZXQ6ZHJhZzpzdGFydCcsIHRoaXMub25XaWRnZXREcmFnU3RhcnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZGF0YSwgJ3dpZGdldDpkcmFnOmVuZCcsIHRoaXMub25XaWRnZXREcmFnRW5kICk7XG5cdH0sXG5cblx0aXNEcm9wcGluZ0FsbG93ZWQ6IGZ1bmN0aW9uKCBzaWRlLCBldmVudCApIHtcblx0XHR2YXIgZWxlbWVudFZpZXcgPSBlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cy5yZXF1ZXN0KCAnZWxlbWVudDpzZWxlY3RlZCcgKSxcblx0XHRcdGVsVHlwZSA9IGVsZW1lbnRWaWV3Lm1vZGVsLmdldCggJ2VsVHlwZScgKTtcblxuXHRcdGlmICggJ3NlY3Rpb24nID09PSBlbFR5cGUgKSB7XG5cdFx0XHRyZXR1cm4gISB0aGlzLmlzSW5uZXIoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gJ3dpZGdldCcgPT09IGVsVHlwZTtcblx0fSxcblxuXHRjaGFuZ2VTaXplVUk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb2x1bW5TaXplID0gdGhpcy5tb2RlbC5nZXRTZXR0aW5nKCAnX2NvbHVtbl9zaXplJyApLFxuXHRcdFx0aW5saW5lU2l6ZSA9IHRoaXMubW9kZWwuZ2V0U2V0dGluZyggJ19pbmxpbmVfc2l6ZScgKSxcblx0XHRcdGNvbHVtblNpemVUaXRsZSA9IHBhcnNlRmxvYXQoIGlubGluZVNpemUgfHwgY29sdW1uU2l6ZSApLnRvRml4ZWQoIDEgKSArICclJztcblxuXHRcdHRoaXMuJGVsLmF0dHIoICdkYXRhLWNvbCcsIGNvbHVtblNpemUgKTtcblxuXHRcdHRoaXMudWkuY29sdW1uVGl0bGUuaHRtbCggY29sdW1uU2l6ZVRpdGxlICk7XG5cdH0sXG5cblx0Z2V0U29ydGFibGVPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29ubmVjdFdpdGg6ICcuZWxlbWVudG9yLXdpZGdldC13cmFwJyxcblx0XHRcdGl0ZW1zOiAnPiAuZWxlbWVudG9yLWVsZW1lbnQnXG5cdFx0fTtcblx0fSxcblxuXHQvLyBFdmVudHNcblx0b25Db2xsZWN0aW9uQ2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0QmFzZUVsZW1lbnRWaWV3LnByb3RvdHlwZS5vbkNvbGxlY3Rpb25DaGFuZ2VkLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHRoaXMuY2hhbmdlQ2hpbGRDb250YWluZXJDbGFzc2VzKCk7XG5cdH0sXG5cblx0Y2hhbmdlQ2hpbGRDb250YWluZXJDbGFzc2VzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZW1wdHlDbGFzcyA9ICdlbGVtZW50b3ItZWxlbWVudC1lbXB0eScsXG5cdFx0XHRwb3B1bGF0ZWRDbGFzcyA9ICdlbGVtZW50b3ItZWxlbWVudC1wb3B1bGF0ZWQnO1xuXG5cdFx0aWYgKCAhdGhpcy5jb2xsZWN0aW9uIHx8IHRoaXMuY29sbGVjdGlvbi5pc0VtcHR5KCkgKSB7XG5cdFx0XHR0aGlzLnVpLmNvbHVtbklubmVyLnJlbW92ZUNsYXNzKCBwb3B1bGF0ZWRDbGFzcyApLmFkZENsYXNzKCBlbXB0eUNsYXNzICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudWkuY29sdW1uSW5uZXIucmVtb3ZlQ2xhc3MoIGVtcHR5Q2xhc3MgKS5hZGRDbGFzcyggcG9wdWxhdGVkQ2xhc3MgKTtcblx0XHR9XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHNlbGYuY2hhbmdlQ2hpbGRDb250YWluZXJDbGFzc2VzKCk7XG5cdFx0c2VsZi5jaGFuZ2VTaXplVUkoKTtcblxuXHRcdHNlbGYuJGVsLmh0bWw1RHJvcHBhYmxlKCB7XG5cdFx0XHRpdGVtczogJyA+IC5lbGVtZW50b3ItY29sdW1uLXdyYXAgPiAuZWxlbWVudG9yLXdpZGdldC13cmFwID4gLmVsZW1lbnRvci1lbGVtZW50LCA+LmVsZW1lbnRvci1jb2x1bW4td3JhcCA+IC5lbGVtZW50b3Itd2lkZ2V0LXdyYXAgPiAuZWxlbWVudG9yLWVtcHR5LXZpZXcgPiAuZWxlbWVudG9yLWZpcnN0LWFkZCcsXG5cdFx0XHRheGlzOiBbICd2ZXJ0aWNhbCcgXSxcblx0XHRcdGdyb3VwczogWyAnZWxlbWVudG9yLWVsZW1lbnQnIF0sXG5cdFx0XHRpc0Ryb3BwaW5nQWxsb3dlZDogXy5iaW5kKCBzZWxmLmlzRHJvcHBpbmdBbGxvd2VkLCBzZWxmICksXG5cdFx0XHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbGYuJGVsLmFkZENsYXNzKCAnZWxlbWVudG9yLWRyYWdnaW5nLW9uLWNoaWxkJyApO1xuXHRcdFx0fSxcblx0XHRcdG9uRHJhZ2dpbmc6IGZ1bmN0aW9uKCBzaWRlLCBldmVudCApIHtcblx0XHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHRcdFx0aWYgKCB0aGlzLmRhdGFzZXQuc2lkZSAhPT0gc2lkZSApIHtcblx0XHRcdFx0XHRCYWNrYm9uZS4kKCB0aGlzICkuYXR0ciggJ2RhdGEtc2lkZScsIHNpZGUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9uRHJhZ0xlYXZlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi4kZWwucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZHJhZ2dpbmctb24tY2hpbGQnICk7XG5cblx0XHRcdFx0QmFja2JvbmUuJCggdGhpcyApLnJlbW92ZUF0dHIoICdkYXRhLXNpZGUnICk7XG5cdFx0XHR9LFxuXHRcdFx0b25Ecm9wcGluZzogZnVuY3Rpb24oIHNpZGUsIGV2ZW50ICkge1xuXHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdFx0XHR2YXIgZWxlbWVudFZpZXcgPSBlbGVtZW50b3IuY2hhbm5lbHMucGFuZWxFbGVtZW50cy5yZXF1ZXN0KCAnZWxlbWVudDpzZWxlY3RlZCcgKSxcblx0XHRcdFx0XHRuZXdJbmRleCA9IEJhY2tib25lLiQoIHRoaXMgKS5pbmRleCgpO1xuXG5cdFx0XHRcdGlmICggJ2JvdHRvbScgPT09IHNpZGUgKSB7XG5cdFx0XHRcdFx0bmV3SW5kZXgrKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBpdGVtRGF0YSA9IHtcblx0XHRcdFx0XHRpZDogZWxlbWVudG9yLmhlbHBlcnMuZ2V0VW5pcXVlSUQoKSxcblx0XHRcdFx0XHRlbFR5cGU6IGVsZW1lbnRWaWV3Lm1vZGVsLmdldCggJ2VsVHlwZScgKVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmICggJ3dpZGdldCcgPT09IGl0ZW1EYXRhLmVsVHlwZSApIHtcblx0XHRcdFx0XHRpdGVtRGF0YS53aWRnZXRUeXBlID0gZWxlbWVudFZpZXcubW9kZWwuZ2V0KCAnd2lkZ2V0VHlwZScgKTtcblx0XHRcdFx0fSBlbHNlIGlmICggJ3NlY3Rpb24nID09PSBpdGVtRGF0YS5lbFR5cGUgKSB7XG5cdFx0XHRcdFx0aXRlbURhdGEuZWxlbWVudHMgPSBbXTtcblx0XHRcdFx0XHRpdGVtRGF0YS5pc0lubmVyID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzZWxmLnRyaWdnZXJNZXRob2QoICdyZXF1ZXN0OmFkZCcsIGl0ZW1EYXRhLCB7IGF0OiBuZXdJbmRleCB9ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdG9uQ2xpY2tUcmlnZ2VyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHZhciAkdHJpZ2dlciA9IHRoaXMuJCggZXZlbnQuY3VycmVudFRhcmdldCApLFxuXHRcdFx0aXNUcmlnZ2VyQWN0aXZlID0gJHRyaWdnZXIuaGFzQ2xhc3MoICdlbGVtZW50b3ItYWN0aXZlJyApO1xuXG5cdFx0dGhpcy51aS5saXN0VHJpZ2dlcnMucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItYWN0aXZlJyApO1xuXG5cdFx0aWYgKCAhIGlzVHJpZ2dlckFjdGl2ZSApIHtcblx0XHRcdCR0cmlnZ2VyLmFkZENsYXNzKCAnZWxlbWVudG9yLWFjdGl2ZScgKTtcblx0XHR9XG5cdH0sXG5cblx0b25XaWRnZXREcmFnU3RhcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnZWxlbWVudG9yLWRyYWdnaW5nJyApO1xuXHR9LFxuXG5cdG9uV2lkZ2V0RHJhZ0VuZDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdlbGVtZW50b3ItZHJhZ2dpbmcnICk7XG5cdH0sXG5cblx0Z2V0Q29udGV4dE1lbnVHcm91cHMoKSB7XG5cdFx0Y29uc3QgZ3JvdXBzID0gW107XG5cblx0XHRjb25zdCAkc2V0dGluZ3MgPSB0aGlzLiRlbC5maW5kKFxuXHRcdFx0Jz4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1zZXR0aW5ncydcblx0XHQpO1xuXG5cdFx0aWYgKCRzZXR0aW5ncy5sZW5ndGgpIHtcblx0XHRcdGNvbnN0IGFjdGlvbnMgPSBbXTtcblxuXHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0bmFtZTogJ2VkaXQnLFxuXHRcdFx0XHR0aXRsZTogKGVsZW1lbnRvci50cmFuc2xhdGUgPyBlbGVtZW50b3IudHJhbnNsYXRlKCdFZGl0IENvbHVtbicpIDogJ0VkaXQgQ29sdW1uJyksXG5cdFx0XHRcdGljb246ICc8aSBjbGFzcz1cImVpY29uLWVkaXRcIj48L2k+Jyxcblx0XHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnRyaWdnZXJNZXRob2QoJ2NsaWNrOmVkaXQnKTtcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCAkZHVwbGljYXRlID0gJHNldHRpbmdzLmZpbmQoJy5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtZHVwbGljYXRlJyk7XG5cdFx0XHRjb25zdCAkcmVtb3ZlID0gJHNldHRpbmdzLmZpbmQoJy5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtcmVtb3ZlJyk7XG5cdFx0XHRjb25zdCAkYWRkID0gdGhpcy4kZWwuZmluZCgnLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1hZGQnKTtcblxuXHRcdFx0aWYgKCRkdXBsaWNhdGUubGVuZ3RoKSB7XG5cdFx0XHRcdGFjdGlvbnMucHVzaCh7XG5cdFx0XHRcdFx0bmFtZTogJ2R1cGxpY2F0ZScsXG5cdFx0XHRcdFx0aWNvbjogJzxpIGNsYXNzPVwiZmEgZmEtY29weVwiPjwvaT4nLFxuXHRcdFx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSgnRHVwbGljYXRlJykgOiAnRHVwbGljYXRlJyxcblx0XHRcdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0JGR1cGxpY2F0ZS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoJGFkZC5sZW5ndGgpIHtcblx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiAnYWRkJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1wbHVzXCI+PC9pPicsXG5cdFx0XHRcdFx0c2VwYXJhdG9yOiAnYmVmb3JlJyxcblx0XHRcdFx0XHR0aXRsZTogZWxlbWVudG9yLnRyYW5zbGF0ZSA/IGVsZW1lbnRvci50cmFuc2xhdGUoJ0FkZCBjb2x1bW4gYWZ0ZXInKSA6ICdBZGQgY29sdW1uIGFmdGVyJyxcblx0XHRcdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0JGFkZC50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoJHJlbW92ZS5sZW5ndGgpIHtcblx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiAnZGVsZXRlJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT4nLFxuXHRcdFx0XHRcdHNlcGFyYXRvcjogJ2JlZm9yZScsXG5cdFx0XHRcdFx0dGl0bGU6IGVsZW1lbnRvci50cmFuc2xhdGUgPyBlbGVtZW50b3IudHJhbnNsYXRlKCdEZWxldGUnKSA6ICdTdXBwcmltZXInLFxuXHRcdFx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHQkcmVtb3ZlLnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhY3Rpb25zLmxlbmd0aCkge1xuXHRcdFx0XHRncm91cHMucHVzaCh7XG5cdFx0XHRcdFx0bmFtZTogJ2VsZW1lbnQnLFxuXHRcdFx0XHRcdGFjdGlvbnMsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qLy8gSG9vayBwbHVzIHNww6ljaWZpcXVlIHBvdXIgbGVzIHdpZGdldHMsXG5cdFx0Ly8gY29tbWUgbGUgYGdldENvbnRleHRNZW51R3JvdXBzYCBkdSB3aWRnZXQgcHJvbW8gc3VyIGxlIGTDqXDDtHQgb2ZmaWNpZWwuXG5cdFx0aWYgKGVsZW1lbnRvci5ob29rcyAmJiBlbGVtZW50b3IuaG9va3MuYXBwbHlGaWx0ZXJzKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudG9yLmhvb2tzLmFwcGx5RmlsdGVycyhcblx0XHRcdFx0J2VsZW1lbnRzL3dpZGdldC9jb250ZXh0LW1lbnUvZ3JvdXBzJyxcblx0XHRcdFx0Z3JvdXBzLFxuXHRcdFx0XHR0aGlzLm1vZGVsXG5cdFx0XHQpO1xuXHRcdH0qL1xuXG5cdFx0cmV0dXJuIGdyb3Vwcztcblx0fSxcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xBbmltYXRpb25JdGVtVmlldztcblxuQ29udHJvbEFuaW1hdGlvbkl0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnNlbGVjdC5zZWxlY3QyKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sQW5pbWF0aW9uSXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcblx0Q29udHJvbEF1dG9jb21wbGV0ZVBvc3RzSXRlbVZpZXc7XG5cbkNvbnRyb2xBdXRvY29tcGxldGVQb3N0c0l0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblxuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2VhcmNoSW5wdXQgPSAnLmVsZW1lbnRvci1jb250cm9sLWF1dG9jb21wbGV0ZS1zZWFyY2gnO1xuXHRcdHVpLnNlbGVjdGVkT3B0aW9ucyA9ICcuZWxlbWVudG9yLWNvbnRyb2wtc2VsZWN0ZWQtb3B0aW9ucyc7XG5cdFx0dWkuc2VsZWN0ZWRQcmV2aWV3ID0gJy5lbGVtZW50b3ItY29udHJvbC1zZWxlY3RlZC1wcmV2aWV3Jztcblx0XHR1aS5idXR0b25Qb3N0UmVtb3ZlID0gJy5lbGVtZW50b3ItcG9zdC1yZW1vdmUnO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGNoaWxkRXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5idXR0b25Qb3N0UmVtb3ZlJzogJ29uQ2xpY2tQb3N0UmVtb3ZlJyxcblx0fSxcblxuXG5cdG9uU2hvdzogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0c2VsZi51aS5zZWxlY3RlZFByZXZpZXcuc29ydGFibGUoIHtcblx0XHQgICAgYXhpczogJ3knLFxuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblxuXHRcdCAgICAgICAgdmFyICRzZWxlY3RCb3ggPSAkKHNlbGYudWkuc2VsZWN0ZWRPcHRpb25zKS5lbXB0eSgpO1xuXG4gICAgICAgICAgICAgICAgJC5tYXAoJCh0aGlzKS5maW5kKCcuZWxlbWVudG9yLXBvc3QnKSwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNlbGVjdEJveC5hcHBlbmQoJzxvcHRpb24gdmFsdWU9XCInICsgJChlbCkuZGF0YSgncG9zdC1pZCcpICsgJ1wiIHNlbGVjdGVkPnA8L29wdGlvbj4nKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICRzZWxlY3RCb3gudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gKTtcblxuXHRcdHNlbGYuaW5zZXJ0UG9zdHModGhpcy5nZXRDb250cm9sVmFsdWUoKSk7XG5cblx0XHR2YXIgcF9hdXRvX3NldHRpbmdzID0ge1xuXHRcdFx0bWluQ2hhcnM6IDMsXG5cdFx0XHRhdXRvRmlsbDogdHJ1ZSxcblx0XHRcdG1heDogMjAsXG5cdFx0XHRtYXRjaENvbnRhaW5zOiB0cnVlLFxuXHRcdFx0bXVzdE1hdGNoOiB0cnVlLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdGV4dHJhUGFyYW1zOiB7XG5cdFx0XHRcdGZvcm1hdDogJ2pzb24nLFxuXHRcdFx0XHRleGNsdWRlSWRzOiBzZWxmLmdldFNlbGVjdGVkUG9zdHNJZHMoKSxcblx0XHRcdFx0YWN0aW9uOiAnU2VhcmNoUG9zdHMnXG5cdFx0XHR9LFxuXHRcdFx0cGFyc2U6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciBwYXJzZWQgPSBbXTtcblx0XHRcdFx0aWYgKGRhdGEgPT0gbnVsbClcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0cGFyc2VkW3BhcnNlZC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0ZGF0YTogZGF0YVtpXSxcblx0XHRcdFx0XHRcdHZhbHVlOiBkYXRhW2ldLm5hbWUsXG5cdFx0XHRcdFx0XHRyZXN1bHQ6IGRhdGFbaV0ubmFtZVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHBhcnNlZDtcblx0XHRcdH0sXG5cdFx0XHRmb3JtYXRJdGVtOiBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gJzxpbWcgc3JjPVwiJyArIGl0ZW0uaW1hZ2UgKyAnXCIgc3R5bGU9XCJ3aWR0aDogMzBweDsgbWF4LWhlaWdodDogMTAwJTsgbWFyZ2luLXJpZ2h0OiA1cHg7IGJvcmRlcjogMXB4IGRvdHRlZCAjY2VjZWNlOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XCIgLz4oSUQ6ICcgKyBpdGVtLmlkICsgJykgJyArIGl0ZW0ubmFtZTtcblx0XHRcdH0sXG5cdFx0XHRjYWNoZUxlbmd0aDogMCxcblx0XHR9O1xuXG5cdFx0JCh0aGlzLnVpLnNlYXJjaElucHV0KS5hdXRvY29tcGxldGUoRWxlbWVudG9yQ29uZmlnLmFqYXh1cmwsIHBfYXV0b19zZXR0aW5ncykucmVzdWx0KGZ1bmN0aW9uIChldmVudCwgZGF0YSwgZm9ybWF0dGVkKSB7XG5cdFx0XHRpZiAoZGF0YSA9PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRcdHZhciBvcHRpb25IdG1sID0gJzxvcHRpb24gdmFsdWU9XCInICsgZGF0YS5pZCArICdcIiBzZWxlY3RlZD4nICsgJyhJRDogJyArIGRhdGEuaWQrICcpICcgKyBkYXRhLm5hbWUgKyAnPC9vcHRpb24+Jztcblx0XHRcdHZhciBwcmV2aWV3SHRtbCA9ICc8ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXBvc3RcIiBkYXRhLXBvc3QtaWQ9XCInICsgZGF0YS5pZCArICdcIj48ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXJlcGVhdGVyLXJvdy1oYW5kbGUtc29ydGFibGVcIj48aSBjbGFzcz1cImZhIGZhLWVsbGlwc2lzLXZcIj48L2k+PC9kaXY+PGltZyBjbGFzcz1cImVsZW1lbnRvci1wb3N0LWltYWdlXCIgc3JjPVwiJyArIGRhdGEuaW1hZ2UgKyAnXCIgLz4nICtcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJlbGVtZW50b3ItcG9zdC1pbmZvXCI+PHNwYW4gY2xhc3M9XCJlbGVtZW50b3ItcG9zdC1yZWZlcmVuY2VcIj4oaWQ6ICcgKyBkYXRhLmlkICsgJyk8L3NwYW4+J1xuXHRcdFx0XHQrIGRhdGEubmFtZVxuXHRcdFx0XHQrICc8YnV0dG9uIGRhdGEtcG9zdC1pZD1cIicgKyBkYXRhLmlkICsgJ1wiIGNsYXNzPVwiZWxlbWVudG9yLXBvc3QtcmVtb3ZlIGVsZW1lbnRvci1wb3N0LXJlbW92ZTInICsgZGF0YS5pZCArICdcIj48aSBjbGFzcz1cImZhIGZhLXJlbW92ZVwiPjwvaT48L2J1dHRvbj48L2Rpdj48L2Rpdj4nO1xuXG5cdFx0XHRpZiAoJChzZWxmLnVpLnNlYXJjaElucHV0KS5hdHRyKCdkYXRhLXNpbmdsZScpKSB7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZE9wdGlvbnMpLmh0bWwob3B0aW9uSHRtbCk7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZFByZXZpZXcpLmh0bWwocHJldmlld0h0bWwpO1xuXHRcdFx0fSBlbHNle1xuXHRcdFx0XHQkKHNlbGYudWkuc2VsZWN0ZWRPcHRpb25zKS5hcHBlbmQob3B0aW9uSHRtbCk7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZFByZXZpZXcpLmFwcGVuZChwcmV2aWV3SHRtbCk7XG5cdFx0XHR9XG5cblxuXG5cdFx0XHQkKHNlbGYudWkuc2VhcmNoSW5wdXQpLnNldE9wdGlvbnMoe1xuXHRcdFx0XHRleHRyYVBhcmFtczoge1xuXHRcdFx0XHRcdGZvcm1hdDogJ2pzb24nLFxuXHRcdFx0XHRcdGV4Y2x1ZGVJZHMgOiBzZWxmLmdldFNlbGVjdGVkUG9zdHNJZHMoKSxcblx0XHRcdFx0XHRhY3Rpb246ICdTZWFyY2hQb3N0cydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZE9wdGlvbnMpLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0JCh0aGlzKS52YWwoJycpO1xuXG5cdFx0fSk7XG5cblx0fSxcblxuXHRvbkNsaWNrUG9zdFJlbW92ZTogZnVuY3Rpb24oZG9tRXZlbnQpIHtcblxuXHRcdHZhciAkcG9zdCA9ICQoZG9tRXZlbnQuY3VycmVudFRhcmdldCk7XG5cdFx0dmFyIHBvc3RJZCA9ICRwb3N0LmRhdGEoJ3Bvc3QtaWQnKTtcblxuXHRcdCRwb3N0LnBhcmVudHMoJy5lbGVtZW50b3ItcG9zdCcpLmZpcnN0KCkucmVtb3ZlKCk7XG5cblx0XHQkKHRoaXMudWkuc2VsZWN0ZWRPcHRpb25zKS5maW5kKCdvcHRpb25bdmFsdWU9JyArIHBvc3RJZCArJyBdJykucmVtb3ZlKCk7XG5cblx0XHQkKHRoaXMudWkuc2VhcmNoSW5wdXQpLnNldE9wdGlvbnMoe1xuXHRcdFx0ZXh0cmFQYXJhbXM6IHtcblx0XHRcdFx0Zm9ybWF0OiAnanNvbicsXG5cdFx0XHRcdGV4Y2x1ZGVJZHMgOiB0aGlzLmdldFNlbGVjdGVkUG9zdHNJZHMoKSxcblx0XHRcdFx0YWN0aW9uOiAnU2VhcmNoUG9zdHMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKHRoaXMudWkuc2VsZWN0ZWRPcHRpb25zKS50cmlnZ2VyKCdjaGFuZ2UnKTtcblxuXG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRQb3N0c0lkczogZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgaWRzID0gJCh0aGlzLnVpLnNlbGVjdGVkT3B0aW9ucykudmFsKCk7XG5cblx0XHRpZiAoXy5pc1VuZGVmaW5lZChpZHMpfHwgaWRzID09IG51bGwpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdHJldHVybiBpZHMudG9TdHJpbmcoKTtcblx0XHR9XG5cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXG5cdFx0JCh0aGlzLnVpLnNlYXJjaElucHV0KS51bmF1dG9jb21wbGV0ZSgpO1xuXG5cdH0sXG5cblx0aW5zZXJ0UG9zdHM6IGZ1bmN0aW9uKGlkcykge1xuXG5cdFx0aWYgKF8uaXNVbmRlZmluZWQoaWRzKXx8IGlkcyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHBvc3RzID0gbnVsbDtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRlbGVtZW50b3IuYWpheC5zZW5kKCAnR2V0UG9zdHMnLCB7XG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGlkczogaWRzLnRvU3RyaW5nKCksXG5cdFx0XHR9LFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRfLmVhY2goIGRhdGEsIGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZFByZXZpZXcpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1wb3N0XCIgZGF0YS1wb3N0LWlkPVwiJyArIGRhdGEuaWQgKyAnXCI+PGRpdiBjbGFzcz1cImVsZW1lbnRvci1yZXBlYXRlci1yb3ctaGFuZGxlLXNvcnRhYmxlXCI+PGkgY2xhc3M9XCJmYSBmYS1lbGxpcHNpcy12XCI+PC9pPjwvZGl2PjxpbWcgY2xhc3M9XCJlbGVtZW50b3ItcG9zdC1pbWFnZVwiIHNyYz1cIicgKyBkYXRhLmltYWdlICsgJ1wiIC8+JyArXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1wb3N0LWluZm9cIj48c3BhbiBjbGFzcz1cImVsZW1lbnRvci1wb3N0LXJlZmVyZW5jZVwiPihpZDogJyArIGRhdGEuaWQgKyAnKTwvc3Bhbj4nXG5cdFx0XHRcdFx0XHQrIGRhdGEubmFtZVxuXHRcdFx0XHRcdFx0KyAnPGJ1dHRvbiBkYXRhLXBvc3QtaWQ9XCInICsgZGF0YS5pZCArICdcIiBjbGFzcz1cImVsZW1lbnRvci1wb3N0LXJlbW92ZVwiPjxpIGNsYXNzPVwiZmEgZmEtcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPjwvZGl2PjwvZGl2PicpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdFx0cmV0dXJuIHBvc3RzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sQXV0b2NvbXBsZXRlUG9zdHNJdGVtVmlldztcblxuXG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcblx0Q29udHJvbEF1dG9jb21wbGV0ZVByb2R1Y3RzSXRlbVZpZXc7XG5cbkNvbnRyb2xBdXRvY29tcGxldGVQcm9kdWN0c0l0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblxuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2VhcmNoSW5wdXQgPSAnLmVsZW1lbnRvci1jb250cm9sLWF1dG9jb21wbGV0ZS1zZWFyY2gnO1xuXHRcdHVpLnNlbGVjdGVkT3B0aW9ucyA9ICcuZWxlbWVudG9yLWNvbnRyb2wtc2VsZWN0ZWQtb3B0aW9ucyc7XG5cdFx0dWkuc2VsZWN0ZWRQcmV2aWV3ID0gJy5lbGVtZW50b3ItY29udHJvbC1zZWxlY3RlZC1wcmV2aWV3Jztcblx0XHR1aS5idXR0b25Qcm9kdWN0UmVtb3ZlID0gJy5lbGVtZW50b3ItcHJvZHVjdC1yZW1vdmUnO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGNoaWxkRXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5idXR0b25Qcm9kdWN0UmVtb3ZlJzogJ29uQ2xpY2tQcm9kdWN0UmVtb3ZlJyxcblx0fSxcblxuXG5cdG9uU2hvdzogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0c2VsZi51aS5zZWxlY3RlZFByZXZpZXcuc29ydGFibGUoIHtcblx0XHQgICAgYXhpczogJ3knLFxuICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblxuXHRcdCAgICAgICAgdmFyICRzZWxlY3RCb3ggPSAkKHNlbGYudWkuc2VsZWN0ZWRPcHRpb25zKS5lbXB0eSgpO1xuXG4gICAgICAgICAgICAgICAgJC5tYXAoJCh0aGlzKS5maW5kKCcuZWxlbWVudG9yLXByb2R1Y3QnKSwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNlbGVjdEJveC5hcHBlbmQoJzxvcHRpb24gdmFsdWU9XCInICsgJChlbCkuZGF0YSgncHJvZHVjdC1pZCcpICsgJ1wiIHNlbGVjdGVkPnA8L29wdGlvbj4nKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICRzZWxlY3RCb3gudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gKTtcblxuXHRcdHNlbGYuaW5zZXJ0UHJvZHVjdHModGhpcy5nZXRDb250cm9sVmFsdWUoKSk7XG5cblx0XHR2YXIgcF9hdXRvX3NldHRpbmdzID0ge1xuXHRcdFx0bWluQ2hhcnM6IDMsXG5cdFx0XHRhdXRvRmlsbDogdHJ1ZSxcblx0XHRcdG1heDogMjAsXG5cdFx0XHRtYXRjaENvbnRhaW5zOiB0cnVlLFxuXHRcdFx0bXVzdE1hdGNoOiB0cnVlLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdGV4dHJhUGFyYW1zOiB7XG5cdFx0XHRcdGZvcm1hdDogJ2pzb24nLFxuXHRcdFx0XHRleGNsdWRlSWRzOiBzZWxmLmdldFNlbGVjdGVkUHJvZHVjdHNJZHMoKSxcblx0XHRcdFx0YWN0aW9uOiAnU2VhcmNoUHJvZHVjdHMnXG5cdFx0XHR9LFxuXHRcdFx0cGFyc2U6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdHZhciBwYXJzZWQgPSBbXTtcblx0XHRcdFx0aWYgKGRhdGEgPT0gbnVsbClcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0cGFyc2VkW3BhcnNlZC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0ZGF0YTogZGF0YVtpXSxcblx0XHRcdFx0XHRcdHZhbHVlOiBkYXRhW2ldLm5hbWUsXG5cdFx0XHRcdFx0XHRyZXN1bHQ6IGRhdGFbaV0ubmFtZVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHBhcnNlZDtcblx0XHRcdH0sXG5cdFx0XHRmb3JtYXRJdGVtOiBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gJzxpbWcgc3JjPVwiJyArIGl0ZW0uaW1hZ2UgKyAnXCIgc3R5bGU9XCJ3aWR0aDogMzBweDsgbWF4LWhlaWdodDogMTAwJTsgbWFyZ2luLXJpZ2h0OiA1cHg7IGJvcmRlcjogMXB4IGRvdHRlZCAjY2VjZWNlOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XCIgLz4oSUQ6ICcgKyBpdGVtLmlkICsgJykgJyArIGl0ZW0ubmFtZTtcblx0XHRcdH0sXG5cdFx0XHRjYWNoZUxlbmd0aDogMCxcblx0XHR9O1xuXG5cdFx0JCh0aGlzLnVpLnNlYXJjaElucHV0KS5hdXRvY29tcGxldGUoRWxlbWVudG9yQ29uZmlnLmFqYXh1cmwsIHBfYXV0b19zZXR0aW5ncykucmVzdWx0KGZ1bmN0aW9uIChldmVudCwgZGF0YSwgZm9ybWF0dGVkKSB7XG5cdFx0XHRpZiAoZGF0YSA9PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRcdHZhciBvcHRpb25IdG1sID0gJzxvcHRpb24gdmFsdWU9XCInICsgZGF0YS5pZCArICdcIiBzZWxlY3RlZD4nICsgJyhJRDogJyArIGRhdGEuaWQrICcpICcgKyBkYXRhLm5hbWUgKyAnPC9vcHRpb24+Jztcblx0XHRcdHZhciBwcmV2aWV3SHRtbCA9ICc8ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3RcIiBkYXRhLXByb2R1Y3QtaWQ9XCInICsgZGF0YS5pZCArICdcIj48ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXJlcGVhdGVyLXJvdy1oYW5kbGUtc29ydGFibGVcIj48aSBjbGFzcz1cImZhIGZhLWVsbGlwc2lzLXZcIj48L2k+PC9kaXY+PGltZyBjbGFzcz1cImVsZW1lbnRvci1wcm9kdWN0LWltYWdlXCIgc3JjPVwiJyArIGRhdGEuaW1hZ2UgKyAnXCIgLz4nICtcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJlbGVtZW50b3ItcHJvZHVjdC1pbmZvXCI+PHNwYW4gY2xhc3M9XCJlbGVtZW50b3ItcHJvZHVjdC1yZWZlcmVuY2VcIj4oaWQ6ICcgKyBkYXRhLmlkICsgJyk8L3NwYW4+J1xuXHRcdFx0XHQrIGRhdGEubmFtZVxuXHRcdFx0XHQrICc8YnV0dG9uIGRhdGEtcHJvZHVjdC1pZD1cIicgKyBkYXRhLmlkICsgJ1wiIGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3QtcmVtb3ZlIGVsZW1lbnRvci1wcm9kdWN0LXJlbW92ZTInICsgZGF0YS5pZCArICdcIj48aSBjbGFzcz1cImZhIGZhLXJlbW92ZVwiPjwvaT48L2J1dHRvbj48L2Rpdj48L2Rpdj4nO1xuXG5cdFx0XHRpZiAoJChzZWxmLnVpLnNlYXJjaElucHV0KS5hdHRyKCdkYXRhLXNpbmdsZScpKSB7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZE9wdGlvbnMpLmh0bWwob3B0aW9uSHRtbCk7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZFByZXZpZXcpLmh0bWwocHJldmlld0h0bWwpO1xuXHRcdFx0fSBlbHNle1xuXHRcdFx0XHQkKHNlbGYudWkuc2VsZWN0ZWRPcHRpb25zKS5hcHBlbmQob3B0aW9uSHRtbCk7XG5cdFx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZFByZXZpZXcpLmFwcGVuZChwcmV2aWV3SHRtbCk7XG5cdFx0XHR9XG5cblxuXG5cdFx0XHQkKHNlbGYudWkuc2VhcmNoSW5wdXQpLnNldE9wdGlvbnMoe1xuXHRcdFx0XHRleHRyYVBhcmFtczoge1xuXHRcdFx0XHRcdGZvcm1hdDogJ2pzb24nLFxuXHRcdFx0XHRcdGV4Y2x1ZGVJZHMgOiBzZWxmLmdldFNlbGVjdGVkUHJvZHVjdHNJZHMoKSxcblx0XHRcdFx0XHRhY3Rpb246ICdTZWFyY2hQcm9kdWN0cydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdCQoc2VsZi51aS5zZWxlY3RlZE9wdGlvbnMpLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0JCh0aGlzKS52YWwoJycpO1xuXG5cdFx0fSk7XG5cblx0fSxcblxuXHRvbkNsaWNrUHJvZHVjdFJlbW92ZTogZnVuY3Rpb24oZG9tRXZlbnQpIHtcblxuXHRcdHZhciAkcHJvZHVjdCA9ICQoZG9tRXZlbnQuY3VycmVudFRhcmdldCk7XG5cdFx0dmFyIHByb2R1Y3RJZCA9ICRwcm9kdWN0LmRhdGEoJ3Byb2R1Y3QtaWQnKTtcblxuXHRcdCRwcm9kdWN0LnBhcmVudHMoJy5lbGVtZW50b3ItcHJvZHVjdCcpLmZpcnN0KCkucmVtb3ZlKCk7XG5cblx0XHQkKHRoaXMudWkuc2VsZWN0ZWRPcHRpb25zKS5maW5kKCdvcHRpb25bdmFsdWU9JyArIHByb2R1Y3RJZCArJyBdJykucmVtb3ZlKCk7XG5cblx0XHQkKHRoaXMudWkuc2VhcmNoSW5wdXQpLnNldE9wdGlvbnMoe1xuXHRcdFx0ZXh0cmFQYXJhbXM6IHtcblx0XHRcdFx0Zm9ybWF0OiAnanNvbicsXG5cdFx0XHRcdGV4Y2x1ZGVJZHMgOiB0aGlzLmdldFNlbGVjdGVkUHJvZHVjdHNJZHMoKSxcblx0XHRcdFx0YWN0aW9uOiAnU2VhcmNoUHJvZHVjdHMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKHRoaXMudWkuc2VsZWN0ZWRPcHRpb25zKS50cmlnZ2VyKCdjaGFuZ2UnKTtcblxuXG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRQcm9kdWN0c0lkczogZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgaWRzID0gJCh0aGlzLnVpLnNlbGVjdGVkT3B0aW9ucykudmFsKCk7XG5cblx0XHRpZiAoXy5pc1VuZGVmaW5lZChpZHMpfHwgaWRzID09IG51bGwpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdHJldHVybiBpZHMudG9TdHJpbmcoKTtcblx0XHR9XG5cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXG5cdFx0JCh0aGlzLnVpLnNlYXJjaElucHV0KS51bmF1dG9jb21wbGV0ZSgpO1xuXG5cdH0sXG5cblx0aW5zZXJ0UHJvZHVjdHM6IGZ1bmN0aW9uKGlkcykge1xuXG5cdFx0aWYgKF8uaXNVbmRlZmluZWQoaWRzKXx8IGlkcyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHByb2R1Y3RzID0gbnVsbDtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRlbGVtZW50b3IuYWpheC5zZW5kKCAnR2V0UHJvZHVjdHMnLCB7XG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGlkczogaWRzLnRvU3RyaW5nKCksXG5cdFx0XHR9LFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRfLmVhY2goIGRhdGEsIGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRcdGRhdGEuaWQgPSBkYXRhLmlkX3Byb2R1Y3Q7XG5cdFx0XHRcdFx0JChzZWxmLnVpLnNlbGVjdGVkUHJldmlldykuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3RcIiBkYXRhLXByb2R1Y3QtaWQ9XCInICsgZGF0YS5pZCArICdcIj48ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXJlcGVhdGVyLXJvdy1oYW5kbGUtc29ydGFibGVcIj48aSBjbGFzcz1cImZhIGZhLWVsbGlwc2lzLXZcIj48L2k+PC9kaXY+PGltZyBjbGFzcz1cImVsZW1lbnRvci1wcm9kdWN0LWltYWdlXCIgc3JjPVwiJyArIGRhdGEuaW1hZ2UgKyAnXCIgLz4nICtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3QtaW5mb1wiPjxzcGFuIGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3QtcmVmZXJlbmNlXCI+KGlkOiAnICsgZGF0YS5pZCArICcpPC9zcGFuPidcblx0XHRcdFx0XHRcdCsgZGF0YS5uYW1lXG5cdFx0XHRcdFx0XHQrICc8YnV0dG9uIGRhdGEtcHJvZHVjdC1pZD1cIicgKyBkYXRhLmlkICsgJ1wiIGNsYXNzPVwiZWxlbWVudG9yLXByb2R1Y3QtcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYSBmYS1yZW1vdmVcIj48L2k+PC9idXR0b24+PC9kaXY+PC9kaXY+Jyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0XHRyZXR1cm4gcHJvZHVjdHM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xBdXRvY29tcGxldGVQcm9kdWN0c0l0ZW1WaWV3O1xuXG5cbiIsInZhciBDb250cm9sQmFzZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlJyApLFxuXHRDb250cm9sQmFzZU11bHRpcGxlSXRlbVZpZXc7XG5cbkNvbnRyb2xCYXNlTXVsdGlwbGVJdGVtVmlldyA9IENvbnRyb2xCYXNlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cblx0YXBwbHlTYXZlZFZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsdWVzID0gdGhpcy5nZXRDb250cm9sVmFsdWUoKSxcblx0XHRcdCRpbnB1dHMgPSB0aGlzLiQoICdbZGF0YS1zZXR0aW5nXScgKSxcblx0XHRcdHNlbGYgPSB0aGlzO1xuXG5cdFx0Xy5lYWNoKCB2YWx1ZXMsIGZ1bmN0aW9uKCB2YWx1ZSwga2V5ICkge1xuXHRcdFx0dmFyICRpbnB1dCA9ICRpbnB1dHMuZmlsdGVyKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGtleSA9PT0gdGhpcy5kYXRhc2V0LnNldHRpbmc7XG5cdFx0XHR9ICk7XG5cblx0XHRcdHNlbGYuc2V0SW5wdXRWYWx1ZSggJGlucHV0LCB2YWx1ZSApO1xuXHRcdH0gKTtcblx0fSxcblxuXHRnZXRDb250cm9sVmFsdWU6IGZ1bmN0aW9uKCBrZXkgKSB7XG5cdFx0dmFyIHZhbHVlcyA9IHRoaXMuZWxlbWVudFNldHRpbmdzTW9kZWwuZ2V0KCB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKTtcblxuXHRcdGlmICggISBCYWNrYm9uZS4kLmlzUGxhaW5PYmplY3QoIHZhbHVlcyApICkge1xuXHRcdFx0cmV0dXJuIHt9O1xuXHRcdH1cblxuXHRcdGlmICgga2V5ICkge1xuXHRcdFx0cmV0dXJuIHZhbHVlc1sga2V5IF0gfHwgJyc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGVsZW1lbnRvci5oZWxwZXJzLmNsb25lT2JqZWN0KCB2YWx1ZXMgKTtcblx0fSxcblxuXHRzZXRWYWx1ZTogZnVuY3Rpb24oIGtleSwgdmFsdWUgKSB7XG5cdFx0dmFyIHZhbHVlcyA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCk7XG5cblx0XHRpZiAoICdvYmplY3QnID09PSB0eXBlb2Yga2V5ICkge1xuXHRcdFx0Xy5lYWNoKCBrZXksIGZ1bmN0aW9uKCBpbnRlcm5hbFZhbHVlLCBpbnRlcm5hbEtleSApIHtcblx0XHRcdFx0dmFsdWVzWyBpbnRlcm5hbEtleSBdID0gaW50ZXJuYWxWYWx1ZTtcblx0XHRcdH0gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFsdWVzWyBrZXkgXSA9IHZhbHVlO1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0U2V0dGluZ3NNb2RlbCggdmFsdWVzICk7XG5cdH0sXG5cblx0dXBkYXRlRWxlbWVudE1vZGVsOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGlucHV0VmFsdWUgPSB0aGlzLmdldElucHV0VmFsdWUoIGV2ZW50LmN1cnJlbnRUYXJnZXQgKSxcblx0XHRcdGtleSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5zZXR0aW5nO1xuXG5cdFx0dGhpcy5zZXRWYWx1ZSgga2V5LCBpbnB1dFZhbHVlICk7XG5cdH1cbn0sIHtcblx0Ly8gU3RhdGljIG1ldGhvZHNcblx0cmVwbGFjZVN0eWxlVmFsdWVzOiBmdW5jdGlvbiggY3NzUHJvcGVydHksIGNvbnRyb2xWYWx1ZSApIHtcblx0XHRpZiAoICEgXy5pc09iamVjdCggY29udHJvbFZhbHVlICkgKSB7XG5cdFx0XHRyZXR1cm4gJyc7IC8vIGludmFsaWRcblx0XHR9XG5cblx0XHQvLyBUcnlpbmcgdG8gcmV0cmlldmUgd2hvbGUgdGhlIHJlbGF0ZWQgcHJvcGVydGllc1xuXHRcdC8vIGFjY29yZGluZyB0byB0aGUgc3RyaW5nIG1hdGNoZXMuXG5cdFx0Ly8gV2hlbiBvbmUgb2YgdGhlIHByb3BlcnRpZXMgaXMgZW1wdHksIGFib3J0aW5nXG5cdFx0Ly8gdGhlIGFjdGlvbiBhbmQgcmV0dXJuaW5nIGFuIGVtcHR5IHN0cmluZy5cblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGNzc1Byb3BlcnR5LnJlcGxhY2UoIC9cXHtcXHsoW0EtWl0rKX19L2csIGZ1bmN0aW9uKCBmdWxsTWF0Y2gsIHB1cmVNYXRjaCApIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gY29udHJvbFZhbHVlWyBwdXJlTWF0Y2gudG9Mb3dlckNhc2UoKSBdO1xuXG5cdFx0XHRcdC8vIFNraXAgaWYgdmFsdWUgaXMgZW1wdHksIHVuZGVmaW5lZCBvciBudWxsXG5cdFx0XHRcdGlmICggJycgPT09IHZhbHVlIHx8IHVuZGVmaW5lZCA9PT0gdmFsdWUgfHwgbnVsbCA9PT0gdmFsdWUgKSB7XG5cdFx0XHRcdFx0dGhyb3cgJyc7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9ICk7XG5cdFx0fSBjYXRjaCAoIGV4Y2VwdGlvbiApIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cdH0sXG5cdGdldFN0eWxlVmFsdWU6IGZ1bmN0aW9uKCBwbGFjZWhvbGRlciwgY29udHJvbFZhbHVlICkge1xuXHRcdGlmICggISBfLmlzT2JqZWN0KCBjb250cm9sVmFsdWUgKSApIHtcblx0XHRcdHJldHVybiAnJzsgLy8gaW52YWxpZFxuXHRcdH1cblxuXHRcdHZhciB2YWx1ZSA9IGNvbnRyb2xWYWx1ZVsgcGxhY2Vob2xkZXIgXTtcblxuXHRcdC8vIFJldHVybiBlbXB0eSBzdHJpbmcgaWYgdmFsdWUgaXMgdW5kZWZpbmVkIG9yIG51bGxcblx0XHRpZiAoIHVuZGVmaW5lZCA9PT0gdmFsdWUgfHwgbnVsbCA9PT0gdmFsdWUgKSB7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbHVlO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbEJhc2VNdWx0aXBsZUl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlTXVsdGlwbGVJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZS1tdWx0aXBsZScgKSxcblx0Q29udHJvbEJhc2VVbml0c0l0ZW1WaWV3O1xuXG5Db250cm9sQmFzZVVuaXRzSXRlbVZpZXcgPSBDb250cm9sQmFzZU11bHRpcGxlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cblx0Z2V0Q3VycmVudFJhbmdlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRVbml0UmFuZ2UoIHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAndW5pdCcgKSApO1xuXHR9LFxuXG5cdGdldFVuaXRSYW5nZTogZnVuY3Rpb24oIHVuaXQgKSB7XG5cdFx0dmFyIHJhbmdlcyA9IHRoaXMubW9kZWwuZ2V0KCAncmFuZ2UnICk7XG5cblx0XHRpZiAoICEgcmFuZ2VzIHx8ICEgcmFuZ2VzWyB1bml0IF0gKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJhbmdlc1sgdW5pdCBdO1xuXHR9XG59LCB7XG5cblx0Ly8gU3RhdGljIG1ldGhvZHNcblx0Z2V0U3R5bGVWYWx1ZSggcGxhY2Vob2xkZXIsIGNvbnRyb2xWYWx1ZSApIHtcblx0XHRsZXQgcmV0dXJuVmFsdWUgPSBDb250cm9sQmFzZU11bHRpcGxlSXRlbVZpZXcuZ2V0U3R5bGVWYWx1ZSggcGxhY2Vob2xkZXIsIGNvbnRyb2xWYWx1ZSApO1xuXG5cdFx0aWYgKCAndW5pdCcgPT09IHBsYWNlaG9sZGVyICYmICdjdXN0b20nID09PSByZXR1cm5WYWx1ZSApIHtcblx0XHRcdHJldHVyblZhbHVlID0gJ19fRU1QVFlfXyc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHR9LFxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xCYXNlVW5pdHNJdGVtVmlldztcbiIsInZhciBDb250cm9sQmFzZUl0ZW1WaWV3O1xuXG5Db250cm9sQmFzZUl0ZW1WaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlucHV0OiAnaW5wdXRbZGF0YS1zZXR0aW5nXVt0eXBlIT1cImNoZWNrYm94XCJdW3R5cGUhPVwicmFkaW9cIl0nLFxuXHRcdFx0Y2hlY2tib3g6ICdpbnB1dFtkYXRhLXNldHRpbmddW3R5cGU9XCJjaGVja2JveFwiXScsXG5cdFx0XHRyYWRpbzogJ2lucHV0W2RhdGEtc2V0dGluZ11bdHlwZT1cInJhZGlvXCJdJyxcblx0XHRcdHNlbGVjdDogJ3NlbGVjdFtkYXRhLXNldHRpbmddJyxcblx0XHRcdHRleHRhcmVhOiAndGV4dGFyZWFbZGF0YS1zZXR0aW5nXScsXG5cdFx0XHRjb250cm9sVGl0bGU6ICcuZWxlbWVudG9yLWNvbnRyb2wtdGl0bGUnLFxuXHRcdFx0cmVzcG9uc2l2ZVN3aXRjaGVyczogJy5lbGVtZW50b3ItcmVzcG9uc2l2ZS1zd2l0Y2hlcicsXG5cdFx0XHRzd2l0Y2hlckRlc2t0b3A6ICcuZWxlbWVudG9yLXJlc3BvbnNpdmUtc3dpdGNoZXItZGVza3RvcCdcblx0XHR9O1xuXHR9LFxuXG5cdGNsYXNzTmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gVE9ETzogQW55IGJldHRlciBjbGFzc2VzIGZvciB0aGF0P1xuXHRcdHZhciBjbGFzc2VzID0gJ2VsZW1lbnRvci1jb250cm9sIGVsZW1lbnRvci1jb250cm9sLScgKyB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKyAnIGVsZW1lbnRvci1jb250cm9sLXR5cGUtJyArIHRoaXMubW9kZWwuZ2V0KCAndHlwZScgKSxcblx0XHRcdG1vZGVsQ2xhc3NlcyA9IHRoaXMubW9kZWwuZ2V0KCAnY2xhc3NlcycgKSxcblx0XHRcdHJlc3BvbnNpdmVDb250cm9sID0gdGhpcy5tb2RlbC5nZXQoICdyZXNwb25zaXZlJyApO1xuXG5cdFx0aWYgKCAhIF8uaXNFbXB0eSggbW9kZWxDbGFzc2VzICkgKSB7XG5cdFx0XHRjbGFzc2VzICs9ICcgJyArIG1vZGVsQ2xhc3Nlcztcblx0XHR9XG5cblx0XHRpZiAoICEgXy5pc0VtcHR5KCB0aGlzLm1vZGVsLmdldCggJ3NlY3Rpb24nICkgKSApIHtcblx0XHRcdGNsYXNzZXMgKz0gJyBlbGVtZW50b3ItY29udHJvbC11bmRlci1zZWN0aW9uJztcblx0XHR9XG5cblx0XHRpZiAoICEgXy5pc0VtcHR5KCByZXNwb25zaXZlQ29udHJvbCApICkge1xuXHRcdFx0Y2xhc3NlcyArPSAnIGVsZW1lbnRvci1jb250cm9sLXJlc3BvbnNpdmUtJyArIHJlc3BvbnNpdmVDb250cm9sO1xuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9LFxuXG5cdGdldFRlbXBsYXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gTWFyaW9uZXR0ZS5UZW1wbGF0ZUNhY2hlLmdldCggJyN0bXBsLWVsZW1lbnRvci1jb250cm9sLScgKyB0aGlzLm1vZGVsLmdldCggJ3R5cGUnICkgKyAnLWNvbnRlbnQnICk7XG5cdH0sXG5cblx0dGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udHJvbERhdGEgPSB7XG5cdFx0XHRjb250cm9sVmFsdWU6IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCksXG5cdFx0XHRfY2lkOiB0aGlzLm1vZGVsLmNpZFxuXHRcdH07XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0YTogXy5leHRlbmQoIHt9LCB0aGlzLm1vZGVsLnRvSlNPTigpLCBjb250cm9sRGF0YSApXG5cdFx0fTtcblx0fSxcblxuXHRiYXNlRXZlbnRzOiB7XG5cdFx0J2lucHV0IEB1aS5pbnB1dCc6ICdvbkJhc2VJbnB1dENoYW5nZScsXG5cdFx0J2NoYW5nZSBAdWkuY2hlY2tib3gnOiAnb25CYXNlSW5wdXRDaGFuZ2UnLFxuXHRcdCdjaGFuZ2UgQHVpLnJhZGlvJzogJ29uQmFzZUlucHV0Q2hhbmdlJyxcblx0XHQnaW5wdXQgQHVpLnRleHRhcmVhJzogJ29uQmFzZUlucHV0Q2hhbmdlJyxcblx0XHQnY2hhbmdlIEB1aS5zZWxlY3QnOiAnb25CYXNlSW5wdXRDaGFuZ2UnLFxuXHRcdCdjbGljayBAdWkuc3dpdGNoZXJEZXNrdG9wJzogJ29uU3dpdGNoZXJEZXNrdG9wQ2xpY2snLFxuXHRcdCdjbGljayBAdWkucmVzcG9uc2l2ZVN3aXRjaGVycyc6ICdvblN3aXRjaGVyQ2xpY2snXG5cdH0sXG5cblx0Y2hpbGRFdmVudHM6IHt9LFxuXG5cdGV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8uZXh0ZW5kKCB7fSwgdGhpcy5iYXNlRXZlbnRzLCB0aGlzLmNoaWxkRXZlbnRzICk7XG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0dGhpcy5lbGVtZW50U2V0dGluZ3NNb2RlbCA9IG9wdGlvbnMuZWxlbWVudFNldHRpbmdzTW9kZWw7XG5cblx0XHR2YXIgY29udHJvbFR5cGUgPSB0aGlzLm1vZGVsLmdldCggJ3R5cGUnICksXG5cdFx0XHRjb250cm9sU2V0dGluZ3MgPSBCYWNrYm9uZS4kLmV4dGVuZCggdHJ1ZSwge30sIGVsZW1lbnRvci5jb25maWcuY29udHJvbHNbIGNvbnRyb2xUeXBlIF0sIHRoaXMubW9kZWwuYXR0cmlidXRlcyApO1xuXG5cdFx0dGhpcy5tb2RlbC5zZXQoIGNvbnRyb2xTZXR0aW5ncyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5lbGVtZW50U2V0dGluZ3NNb2RlbCwgJ2NoYW5nZScsIHRoaXMudG9nZ2xlQ29udHJvbFZpc2liaWxpdHkgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmVsZW1lbnRTZXR0aW5nc01vZGVsLCAnY29udHJvbDpzd2l0Y2g6dGFiJywgdGhpcy5vbkNvbnRyb2xTd2l0Y2hUYWIgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSwgJ2NoYW5nZScsIHRoaXMudG9nZ2xlQ29udHJvbFZpc2liaWxpdHkgKTtcblx0fSxcblxuXHRnZXRDb250cm9sVmFsdWU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVsZW1lbnRTZXR0aW5nc01vZGVsLmdldCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICk7XG5cdH0sXG5cblx0aXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWUgKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblx0c2V0VmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR0aGlzLnNldFNldHRpbmdzTW9kZWwoIHZhbHVlICk7XG5cdH0sXG5cblx0c2V0U2V0dGluZ3NNb2RlbDogZnVuY3Rpb24oIHZhbHVlICkge1xuXHRcdGlmICggdHJ1ZSAhPT0gdGhpcy5pc1ZhbGlkVmFsdWUoIHZhbHVlICkgKSB7XG5cdFx0XHR0aGlzLnRyaWdnZXJNZXRob2QoICdzZXR0aW5nczplcnJvcicgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVsZW1lbnRTZXR0aW5nc01vZGVsLnNldCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApLCB2YWx1ZSApO1xuXG5cdFx0dGhpcy50cmlnZ2VyTWV0aG9kKCAnc2V0dGluZ3M6Y2hhbmdlJyApO1xuXHR9LFxuXG5cdGFwcGx5U2F2ZWRWYWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRJbnB1dFZhbHVlKCAnW2RhdGEtc2V0dGluZz1cIicgKyB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKyAnXCJdJywgdGhpcy5nZXRDb250cm9sVmFsdWUoKSApO1xuXHR9LFxuXG5cdGdldEVkaXRTZXR0aW5nczogZnVuY3Rpb24oIHNldHRpbmcgKSB7XG5cdFx0dmFyIHNldHRpbmdzID0gdGhpcy5nZXRPcHRpb24oICdlbGVtZW50RWRpdFNldHRpbmdzJyApLnRvSlNPTigpO1xuXG5cdFx0aWYgKCBzZXR0aW5nICkge1xuXHRcdFx0cmV0dXJuIHNldHRpbmdzWyBzZXR0aW5nIF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9LFxuXG5cdHNldEVkaXRTZXR0aW5nOiBmdW5jdGlvbiggc2V0dGluZ0tleSwgc2V0dGluZ1ZhbHVlICkge1xuXHRcdHZhciBzZXR0aW5ncyA9IHRoaXMuZ2V0T3B0aW9uKCAnZWxlbWVudEVkaXRTZXR0aW5ncycgKTtcblxuXHRcdHNldHRpbmdzLnNldCggc2V0dGluZ0tleSwgc2V0dGluZ1ZhbHVlICk7XG5cdH0sXG5cblx0Z2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24oIGlucHV0ICkge1xuXHRcdHZhciAkaW5wdXQgPSB0aGlzLiQoIGlucHV0ICksXG5cdFx0XHRpbnB1dFZhbHVlID0gJGlucHV0LnZhbCgpLFxuXHRcdFx0aW5wdXRUeXBlID0gJGlucHV0LmF0dHIoICd0eXBlJyApO1xuXG5cdFx0aWYgKCAtMSAhPT0gWyAncmFkaW8nLCAnY2hlY2tib3gnIF0uaW5kZXhPZiggaW5wdXRUeXBlICkgKSB7XG5cdFx0XHRyZXR1cm4gJGlucHV0LnByb3AoICdjaGVja2VkJyApID8gaW5wdXRWYWx1ZSA6ICcnO1xuXHRcdH1cblxuXHRcdHJldHVybiBpbnB1dFZhbHVlO1xuXHR9LFxuXG5cdC8vIFRoaXMgbWV0aG9kIHVzZWQgaW5zaWRlIG9mIHJlcGVhdGVyXG5cdGdldEZpZWxkVGl0bGVWYWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0Q29udHJvbFZhbHVlKCk7XG5cdH0sXG5cblx0c2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24oIGlucHV0LCB2YWx1ZSApIHtcblx0XHR2YXIgJGlucHV0ID0gdGhpcy4kKCBpbnB1dCApLFxuXHRcdFx0aW5wdXRUeXBlID0gJGlucHV0LmF0dHIoICd0eXBlJyApO1xuXG5cdFx0aWYgKCAnY2hlY2tib3gnID09PSBpbnB1dFR5cGUgKSB7XG5cdFx0XHQkaW5wdXQucHJvcCggJ2NoZWNrZWQnLCAhISB2YWx1ZSApO1xuXHRcdH0gZWxzZSBpZiAoICdyYWRpbycgPT09IGlucHV0VHlwZSApIHtcblx0XHRcdCRpbnB1dC5maWx0ZXIoICdbdmFsdWU9XCInICsgdmFsdWUgKyAnXCJdJyApLnByb3AoICdjaGVja2VkJywgdHJ1ZSApO1xuXHRcdH0gZWxzZSBpZiAoICdzZWxlY3QyJyA9PT0gaW5wdXRUeXBlICkge1xuXHRcdFx0Ly8gZG9uJ3QgdG91Y2hcblx0XHR9IGVsc2Uge1xuXHRcdFx0JGlucHV0LnZhbCggdmFsdWUgKTtcblx0XHR9XG5cdH0sXG5cblx0b25TZXR0aW5nc0Vycm9yOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2VsZW1lbnRvci1lcnJvcicgKTtcblx0fSxcblxuXHRvblNldHRpbmdzQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci1lcnJvcicgKTtcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hcHBseVNhdmVkVmFsdWUoKTtcblxuXHRcdHZhciBsYXlvdXRUeXBlID0gdGhpcy5tb2RlbC5nZXQoICdsYWJlbF9ibG9jaycgKSA/ICdibG9jaycgOiAnaW5saW5lJyxcblx0XHRcdHNob3dMYWJlbCA9IHRoaXMubW9kZWwuZ2V0KCAnc2hvd19sYWJlbCcgKSxcblx0XHRcdGVsQ2xhc3NlcyA9ICdlbGVtZW50b3ItbGFiZWwtJyArIGxheW91dFR5cGU7XG5cblx0XHRlbENsYXNzZXMgKz0gJyBlbGVtZW50b3ItY29udHJvbC1zZXBhcmF0b3ItJyArIHRoaXMubW9kZWwuZ2V0KCAnc2VwYXJhdG9yJyApO1xuXG5cdFx0aWYgKCAhIHNob3dMYWJlbCApIHtcblx0XHRcdGVsQ2xhc3NlcyArPSAnIGVsZW1lbnRvci1jb250cm9sLWhpZGRlbi1sYWJlbCc7XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoIGVsQ2xhc3NlcyApO1xuXHRcdHRoaXMucmVuZGVyUmVzcG9uc2l2ZVN3aXRjaGVycygpO1xuXG5cdFx0dGhpcy50cmlnZ2VyTWV0aG9kKCAncmVhZHknICk7XG5cdFx0dGhpcy50b2dnbGVDb250cm9sVmlzaWJpbGl0eSgpO1xuXHR9LFxuXG5cdG9uQmFzZUlucHV0Q2hhbmdlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dGhpcy51cGRhdGVFbGVtZW50TW9kZWwoIGV2ZW50ICk7XG5cblx0XHR0aGlzLnRyaWdnZXJNZXRob2QoICdpbnB1dDpjaGFuZ2UnLCBldmVudCApO1xuXHR9LFxuXG5cdG9uU3dpdGNoZXJDbGljazogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBkZXZpY2UgPSBCYWNrYm9uZS4kKCBldmVudC5jdXJyZW50VGFyZ2V0ICkuZGF0YSggJ2RldmljZScgKTtcblxuXHRcdGVsZW1lbnRvci5jaGFuZ2VEZXZpY2VNb2RlKCBkZXZpY2UgKTtcblx0fSxcblxuXHRvblN3aXRjaGVyRGVza3RvcENsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuZ2V0Q3VycmVudFBhZ2VWaWV3KCkuJGVsLnRvZ2dsZUNsYXNzKCAnZWxlbWVudG9yLXJlc3BvbnNpdmUtc3dpdGNoZXJzLW9wZW4nICk7XG5cdH0sXG5cblx0cmVuZGVyUmVzcG9uc2l2ZVN3aXRjaGVyczogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCBfLmlzRW1wdHkoIHRoaXMubW9kZWwuZ2V0KCAncmVzcG9uc2l2ZScgKSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciB0ZW1wbGF0ZUh0bWwgPSBCYWNrYm9uZS4kKCAnI3RtcGwtZWxlbWVudG9yLWNvbnRyb2wtcmVzcG9uc2l2ZS1zd2l0Y2hlcnMnICkuaHRtbCgpO1xuXG5cdFx0dGhpcy51aS5jb250cm9sVGl0bGUuYWZ0ZXIoIHRlbXBsYXRlSHRtbCApO1xuXHR9LFxuXG5cdHRvZ2dsZUNvbnRyb2xWaXNpYmlsaXR5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaXNWaXNpYmxlID0gZWxlbWVudG9yLmhlbHBlcnMuaXNDb250cm9sVmlzaWJsZSggdGhpcy5tb2RlbCwgdGhpcy5lbGVtZW50U2V0dGluZ3NNb2RlbCApO1xuXG5cdFx0Ly8gVsOpcmlmaWVyIGF1c3NpIGxhIHZpc2liaWxpdMOpIHJlc3BvbnNpdmVcblx0XHR2YXIgcmVzcG9uc2l2ZUNvbnRyb2wgPSB0aGlzLm1vZGVsLmdldCggJ3Jlc3BvbnNpdmUnICk7XG5cdFx0aWYgKCBpc1Zpc2libGUgJiYgISBfLmlzRW1wdHkoIHJlc3BvbnNpdmVDb250cm9sICkgKSB7XG5cdFx0XHR2YXIgY3VycmVudERldmljZU1vZGUgPSBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZS5yZXF1ZXN0KCAnY3VycmVudE1vZGUnICk7XG5cdFx0XHRpc1Zpc2libGUgPSAoIHJlc3BvbnNpdmVDb250cm9sID09PSBjdXJyZW50RGV2aWNlTW9kZSApO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnZWxlbWVudG9yLWhpZGRlbi1jb250cm9sJywgISBpc1Zpc2libGUgKTtcblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZGF0YS50cmlnZ2VyKCAnc2Nyb2xsYmFyOnVwZGF0ZScgKTtcblx0fSxcblxuXHRvbkNvbnRyb2xTd2l0Y2hUYWI6IGZ1bmN0aW9uKCBhY3RpdmVUYWIgKSB7XG5cdFx0dmFyIGlzQWN0aXZlVGFiID0gKCBhY3RpdmVUYWIgPT09IHRoaXMubW9kZWwuZ2V0KCAndGFiJyApICk7XG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3ItYWN0aXZlLXRhYicsIGlzQWN0aXZlVGFiICk7XG5cblx0XHQvLyBJZiB0aGlzIGlzIGEgc2VjdGlvbiBjb250cm9sLCBwcm9wYWdhdGUgdGhlIGNsYXNzIHRvIHRoZSB3cmFwcGVyXG5cdFx0aWYgKCAnc2VjdGlvbicgPT09IHRoaXMubW9kZWwuZ2V0KCAndHlwZScgKSApIHtcblx0XHRcdHZhciAkd3JhcHBlciA9IHRoaXMuJGVsLmNsb3Nlc3QoICcuZWxlbWVudG9yLXNlY3Rpb24td3JhcHBlcicgKTtcblx0XHRcdGlmICggJHdyYXBwZXIubGVuZ3RoICkge1xuXHRcdFx0XHQkd3JhcHBlci50b2dnbGVDbGFzcyggJ2VsZW1lbnRvci1hY3RpdmUtdGFiJywgaXNBY3RpdmVUYWIgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRlbGVtZW50b3IuY2hhbm5lbHMuZGF0YS50cmlnZ2VyKCAnc2Nyb2xsYmFyOnVwZGF0ZScgKTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHt9LFxuXG5cdHVwZGF0ZUVsZW1lbnRNb2RlbDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHRoaXMuc2V0VmFsdWUoIHRoaXMuZ2V0SW5wdXRWYWx1ZSggZXZlbnQuY3VycmVudFRhcmdldCApICk7XG5cdH1cbn0sIHtcblx0Ly8gU3RhdGljIG1ldGhvZHNcblx0cmVwbGFjZVN0eWxlVmFsdWVzOiBmdW5jdGlvbiggY3NzUHJvcGVydHksIGNvbnRyb2xWYWx1ZSApIHtcblx0XHR2YXIgcmVwbGFjZUFycmF5ID0geyAnXFx7XFx7VkFMVUVcXH1cXH0nOiBjb250cm9sVmFsdWUgfTtcblxuXHRcdHJldHVybiBlbGVtZW50b3IuaGVscGVycy5zdHJpbmdSZXBsYWNlQWxsKCBjc3NQcm9wZXJ0eSwgcmVwbGFjZUFycmF5ICk7XG5cdH0sXG5cdGdldFN0eWxlVmFsdWU6IGZ1bmN0aW9uKCBwbGFjZWhvbGRlciwgY29udHJvbFZhbHVlICkge1xuXHRcdHJldHVybiBjb250cm9sVmFsdWU7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sQmFzZUl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZS1tdWx0aXBsZScgKSxcblx0Q29udHJvbEJveFNoYWRvd0l0ZW1WaWV3O1xuXG5Db250cm9sQm94U2hhZG93SXRlbVZpZXcgPSBDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdWkgPSBDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcucHJvdG90eXBlLnVpLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHVpLnNsaWRlcnMgPSAnLmVsZW1lbnRvci1zbGlkZXInO1xuXHRcdHVpLmNvbG9ycyA9ICcuZWxlbWVudG9yLWJveC1zaGFkb3ctY29sb3ItcGlja2VyJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdzbGlkZSBAdWkuc2xpZGVycyc6ICdvblNsaWRlQ2hhbmdlJ1xuXHR9LFxuXG5cdGluaXRTbGlkZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSgpO1xuXG5cdFx0dGhpcy51aS5zbGlkZXJzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICRzbGlkZXIgPSBCYWNrYm9uZS4kKCB0aGlzICksXG5cdFx0XHRcdCRpbnB1dCA9ICRzbGlkZXIubmV4dCggJy5lbGVtZW50b3Itc2xpZGVyLWlucHV0JyApLmZpbmQoICdpbnB1dCcgKTtcblxuXHRcdFx0JHNsaWRlci5zbGlkZXIoIHtcblx0XHRcdFx0dmFsdWU6IHZhbHVlWyB0aGlzLmRhdGFzZXQuaW5wdXQgXSxcblx0XHRcdFx0bWluOiArJGlucHV0LmF0dHIoICdtaW4nICksXG5cdFx0XHRcdG1heDogKyRpbnB1dC5hdHRyKCAnbWF4JyApXG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGluaXRDb2xvcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMudWkuY29sb3JzLndwQ29sb3JQaWNrZXIoIHtcblx0XHRcdGNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciAkdGhpcyA9IEJhY2tib25lLiQoIHRoaXMgKSxcblx0XHRcdFx0XHR0eXBlID0gJHRoaXMuZGF0YSggJ3NldHRpbmcnICk7XG5cblx0XHRcdFx0c2VsZi5zZXRWYWx1ZSggdHlwZSwgJHRoaXMud3BDb2xvclBpY2tlciggJ2NvbG9yJyApICk7XG5cdFx0XHR9LFxuXG5cdFx0XHRjbGVhcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbGYuc2V0VmFsdWUoIHRoaXMuZGF0YXNldC5zZXR0aW5nLCAnJyApO1xuXHRcdFx0fSxcblxuXHRcdFx0d2lkdGg6IDI1MVxuXHRcdH0gKTtcblx0fSxcblxuXHRvbklucHV0Q2hhbmdlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIHR5cGUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2V0dGluZyxcblx0XHRcdCRzbGlkZXIgPSB0aGlzLnVpLnNsaWRlcnMuZmlsdGVyKCAnW2RhdGEtaW5wdXQ9XCInICsgdHlwZSArICdcIl0nICk7XG5cblx0XHQkc2xpZGVyLnNsaWRlciggJ3ZhbHVlJywgdGhpcy5nZXRDb250cm9sVmFsdWUoIHR5cGUgKSApO1xuXHR9LFxuXG5cdG9uUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaW5pdFNsaWRlcnMoKTtcblx0XHR0aGlzLmluaXRDb2xvcnMoKTtcblx0fSxcblxuXHRvblNsaWRlQ2hhbmdlOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdHZhciB0eXBlID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LmlucHV0LFxuXHRcdFx0JGlucHV0ID0gdGhpcy51aS5pbnB1dC5maWx0ZXIoICdbZGF0YS1zZXR0aW5nPVwiJyArIHR5cGUgKyAnXCJdJyApO1xuXG5cdFx0JGlucHV0LnZhbCggdWkudmFsdWUgKTtcblx0XHR0aGlzLnNldFZhbHVlKCB0eXBlLCB1aS52YWx1ZSApO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5jb2xvcnMuZWFjaCggZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgJGNvbG9yID0gQmFja2JvbmUuJCggdGhpcyApO1xuXG5cdFx0XHRpZiAoICRjb2xvci53cENvbG9yUGlja2VyKCAnaW5zdGFuY2UnICkgKSB7XG5cdFx0XHRcdCRjb2xvci53cENvbG9yUGlja2VyKCAnY2xvc2UnICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0dGhpcy4kZWwucmVtb3ZlKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sQm94U2hhZG93SXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcblx0Q29udHJvbENob29zZUl0ZW1WaWV3O1xuXG5Db250cm9sQ2hvb3NlSXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuaW5wdXRzID0gJ1t0eXBlPVwicmFkaW9cIl0nO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGNoaWxkRXZlbnRzOiB7XG5cdFx0J21vdXNlZG93biBsYWJlbCc6ICdvbk1vdXNlRG93bkxhYmVsJyxcblx0XHQnY2xpY2sgQHVpLmlucHV0cyc6ICdvbkNsaWNrSW5wdXQnLFxuXHRcdCdjaGFuZ2UgQHVpLmlucHV0cyc6ICd1cGRhdGVFbGVtZW50TW9kZWwnXG5cdH0sXG5cblx0b25Nb3VzZURvd25MYWJlbDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciAkY2xpY2tlZExhYmVsID0gdGhpcy4kKCBldmVudC5jdXJyZW50VGFyZ2V0ICksXG5cdFx0XHQkc2VsZWN0ZWRJbnB1dCA9IHRoaXMuJCggJyMnICsgJGNsaWNrZWRMYWJlbC5hdHRyKCAnZm9yJyApICk7XG5cblx0XHQkc2VsZWN0ZWRJbnB1dC5kYXRhKCAnY2hlY2tlZCcsICRzZWxlY3RlZElucHV0LnByb3AoICdjaGVja2VkJyApICk7XG5cdH0sXG5cblx0b25DbGlja0lucHV0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCAhIHRoaXMubW9kZWwuZ2V0KCAndG9nZ2xlJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciAkc2VsZWN0ZWRJbnB1dCA9IHRoaXMuJCggZXZlbnQuY3VycmVudFRhcmdldCApO1xuXG5cdFx0aWYgKCAkc2VsZWN0ZWRJbnB1dC5kYXRhKCAnY2hlY2tlZCcgKSApIHtcblx0XHRcdCRzZWxlY3RlZElucHV0LnByb3AoICdjaGVja2VkJywgZmFsc2UgKS50cmlnZ2VyKCAnY2hhbmdlJyApO1xuXHRcdH1cblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Q29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUub25SZW5kZXIuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dmFyIGN1cnJlbnRWYWx1ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCk7XG5cblx0XHRpZiAoIGN1cnJlbnRWYWx1ZSApIHtcblx0XHRcdHRoaXMudWkuaW5wdXRzLmZpbHRlciggJ1t2YWx1ZT1cIicgKyBjdXJyZW50VmFsdWUgKyAnXCJdJyApLnByb3AoICdjaGVja2VkJywgdHJ1ZSApO1xuXHRcdH0gZWxzZSBpZiAoICEgdGhpcy5tb2RlbC5nZXQoICd0b2dnbGUnICkgKSB7XG5cdFx0XHR0aGlzLnVpLmlucHV0cy5maXJzdCgpLnByb3AoICdjaGVja2VkJywgdHJ1ZSApLnRyaWdnZXIoICdjaGFuZ2UnICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbENob29zZUl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xDb2RlSXRlbVZpZXc7XG5cbkNvbnRyb2xDb2RlSXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuZWRpdG9yID0gJy5lbGVtZW50b3ItY29kZS1lZGl0b3InO1xuXHRcdHVpLnRleHRhcmVhID0gJy5lbGVtZW50b3ItY29kZS1lZGl0b3ItdmFsdWUnO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGVkaXRvcjogbnVsbCxcblx0bWFya2VySWRzOiBbXSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRpZiAoIHR5cGVvZiBhY2UgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBlZGl0b3JFbGVtZW50ID0gdGhpcy51aS5lZGl0b3JbMF07XG5cdFx0dmFyIG1vZGUgPSB0aGlzLnVpLmVkaXRvci5kYXRhKCAnbW9kZScgKSB8fCAnY3NzJztcblxuXHRcdHRoaXMuZWRpdG9yID0gYWNlLmVkaXQoIGVkaXRvckVsZW1lbnQgKTtcblx0XHR0aGlzLmVkaXRvci5zZXRUaGVtZSggJ2FjZS90aGVtZS90b21vcnJvdycgKTtcblx0XHR0aGlzLmVkaXRvci5zZXNzaW9uLnNldE1vZGUoICdhY2UvbW9kZS8nICsgbW9kZSApO1xuXHRcdHRoaXMuZWRpdG9yLnNldE9wdGlvbnMoIHtcblx0XHRcdG1pbkxpbmVzOiA4LFxuXHRcdFx0bWF4TGluZXM6IDIwLFxuXHRcdFx0c2hvd1ByaW50TWFyZ2luOiBmYWxzZSxcblx0XHRcdGZvbnRTaXplOiAxMixcblx0XHRcdGVuYWJsZUJhc2ljQXV0b2NvbXBsZXRpb246IHRydWUsXG5cdFx0XHRlbmFibGVMaXZlQXV0b2NvbXBsZXRpb246IHRydWVcblx0XHR9KTtcblxuXHRcdC8vIEFkZCBjdXN0b20gY29tcGxldGVyIGZvciBcInNlbGVjdG9yXCIga2V5d29yZFxuXHRcdHRoaXMuYWRkU2VsZWN0b3JDb21wbGV0ZXIoKTtcblxuXHRcdC8vIFNldCBpbml0aWFsIHZhbHVlXG5cdFx0dmFyIGluaXRpYWxWYWx1ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCkgfHwgJyc7XG5cdFx0dGhpcy5lZGl0b3Iuc2V0VmFsdWUoIGluaXRpYWxWYWx1ZSwgLTEgKTtcblxuXHRcdC8vIEhpZ2hsaWdodCBcInNlbGVjdG9yXCIga2V5d29yZFxuXHRcdHRoaXMuaGlnaGxpZ2h0U2VsZWN0b3IoKTtcblxuXHRcdC8vIExpc3RlbiBmb3IgY2hhbmdlc1xuXHRcdHRoaXMuZWRpdG9yLnNlc3Npb24ub24oICdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNlbGYuc2V0VmFsdWUoIHNlbGYuZWRpdG9yLmdldFZhbHVlKCkgKTtcblx0XHRcdHNlbGYuaGlnaGxpZ2h0U2VsZWN0b3IoKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0YWRkU2VsZWN0b3JDb21wbGV0ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdHlwZW9mIGFjZS5yZXF1aXJlICE9PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBsYW5nVG9vbHMgPSBhY2UucmVxdWlyZSggJ2FjZS9leHQvbGFuZ3VhZ2VfdG9vbHMnICk7XG5cdFx0aWYgKCAhIGxhbmdUb29scyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgc2VsZWN0b3JDb21wbGV0ZXIgPSB7XG5cdFx0XHRnZXRDb21wbGV0aW9uczogZnVuY3Rpb24oIGVkaXRvciwgc2Vzc2lvbiwgcG9zLCBwcmVmaXgsIGNhbGxiYWNrICkge1xuXHRcdFx0XHRjYWxsYmFjayggbnVsbCwgW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNhcHRpb246ICdzZWxlY3RvcicsXG5cdFx0XHRcdFx0XHR2YWx1ZTogJ3NlbGVjdG9yJyxcblx0XHRcdFx0XHRcdG1ldGE6ICdXcmFwcGVyJyxcblx0XHRcdFx0XHRcdHNjb3JlOiAxXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0bGFuZ1Rvb2xzLmFkZENvbXBsZXRlciggc2VsZWN0b3JDb21wbGV0ZXIgKTtcblx0fSxcblxuXHRoaWdobGlnaHRTZWxlY3RvcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBzZXNzaW9uID0gdGhpcy5lZGl0b3Iuc2Vzc2lvbjtcblx0XHR2YXIgUmFuZ2UgPSBhY2UucmVxdWlyZSggJ2FjZS9yYW5nZScgKS5SYW5nZTtcblxuXHRcdC8vIFJlbW92ZSBwcmV2aW91cyBtYXJrZXJzXG5cdFx0dGhpcy5tYXJrZXJJZHMuZm9yRWFjaCggZnVuY3Rpb24oIGlkICkge1xuXHRcdFx0c2Vzc2lvbi5yZW1vdmVNYXJrZXIoIGlkICk7XG5cdFx0fSk7XG5cdFx0dGhpcy5tYXJrZXJJZHMgPSBbXTtcblxuXHRcdC8vIEZpbmQgYW5kIGhpZ2hsaWdodCBhbGwgXCJzZWxlY3RvclwiIG9jY3VycmVuY2VzXG5cdFx0dmFyIGNvbnRlbnQgPSBzZXNzaW9uLmdldFZhbHVlKCk7XG5cdFx0dmFyIHJlZ2V4ID0gL1xcYnNlbGVjdG9yXFxiL2c7XG5cdFx0dmFyIG1hdGNoO1xuXG5cdFx0d2hpbGUgKCAoIG1hdGNoID0gcmVnZXguZXhlYyggY29udGVudCApICkgIT09IG51bGwgKSB7XG5cdFx0XHR2YXIgc3RhcnRQb3MgPSBzZXNzaW9uLmRvYy5pbmRleFRvUG9zaXRpb24oIG1hdGNoLmluZGV4ICk7XG5cdFx0XHR2YXIgZW5kUG9zID0gc2Vzc2lvbi5kb2MuaW5kZXhUb1Bvc2l0aW9uKCBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCApO1xuXHRcdFx0dmFyIHJhbmdlID0gbmV3IFJhbmdlKCBzdGFydFBvcy5yb3csIHN0YXJ0UG9zLmNvbHVtbiwgZW5kUG9zLnJvdywgZW5kUG9zLmNvbHVtbiApO1xuXG5cdFx0XHR2YXIgbWFya2VySWQgPSBzZXNzaW9uLmFkZE1hcmtlciggcmFuZ2UsICdhY2Vfc2VsZWN0b3JfaGlnaGxpZ2h0JywgJ3RleHQnLCB0cnVlICk7XG5cdFx0XHRzZWxmLm1hcmtlcklkcy5wdXNoKCBtYXJrZXJJZCApO1xuXHRcdH1cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5lZGl0b3IgKSB7XG5cdFx0XHR0aGlzLmVkaXRvci5kZXN0cm95KCk7XG5cdFx0XHR0aGlzLmVkaXRvciA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cdGFwcGx5U2F2ZWRWYWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmVkaXRvciApIHtcblx0XHRcdHZhciB2YWx1ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCkgfHwgJyc7XG5cdFx0XHRpZiAoIHRoaXMuZWRpdG9yLmdldFZhbHVlKCkgIT09IHZhbHVlICkge1xuXHRcdFx0XHR0aGlzLmVkaXRvci5zZXRWYWx1ZSggdmFsdWUsIC0xICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbENvZGVJdGVtVmlldztcbiIsInZhciBDb250cm9sQmFzZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlJyApLFxuXHRDb250cm9sQ29sb3JJdGVtVmlldztcblxuQ29udHJvbENvbG9ySXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkucGlja2VyID0gJy5jb2xvci1waWNrZXItaGV4JztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnBpY2tlci53cENvbG9yUGlja2VyKCB7XG5cdFx0XHRjaGFuZ2U6IF8uYmluZCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUoIHRoaXMudWkucGlja2VyLndwQ29sb3JQaWNrZXIoICdjb2xvcicgKSApO1xuXHRcdFx0fSwgdGhpcyApLFxuXG5cdFx0XHRjbGVhcjogXy5iaW5kKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSggJycgKTtcblx0XHRcdH0sIHRoaXMgKSxcblxuXHRcdFx0d2lkdGg6IDI1MVxuXHRcdH0gKS53cENvbG9yUGlja2VyKCAnaW5zdGFuY2UnIClcblx0XHRcdC53cmFwLmZpbmQoICc+IC53cC1waWNrZXItaW5wdXQtd3JhcCA+IC53cC1jb2xvci1waWNrZXInIClcblx0XHRcdC5yZW1vdmVBdHRyKCAnbWF4bGVuZ3RoJyApO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnVpLnBpY2tlci53cENvbG9yUGlja2VyKCAnaW5zdGFuY2UnICkgKSB7XG5cdFx0XHR0aGlzLnVpLnBpY2tlci53cENvbG9yUGlja2VyKCAnY2xvc2UnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLnJlbW92ZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbENvbG9ySXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcbiAgICBDb250cm9sRGF0ZVRpbWVJdGVtVmlldztcblxuQ29udHJvbERhdGVUaW1lSXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuICAgIHVpOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB1aS5waWNrZXIgPSAnLmRhdGV0aW1lcGlja2VyJztcblxuICAgICAgICByZXR1cm4gdWk7XG4gICAgfSxcblxuICAgIG9uUmVhZHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnVpLnBpY2tlcik7XG5cbiAgICAgICAgdGhpcy51aS5waWNrZXIuZGF0ZXRpbWVwaWNrZXIoe1xuICAgICAgICAgICAgcHJldlRleHQ6ICcnLFxuICAgICAgICAgICAgbmV4dFRleHQ6ICcnLFxuICAgICAgICAgICAgZGF0ZUZvcm1hdDogJ3l5LW1tLWRkJyxcbiAgICAgICAgICAgIGN1cnJlbnRUZXh0OiBkYXRlVGltZVBpY2tlckwxMG4uY3VycmVudFRleHQsXG4gICAgICAgICAgICBjbG9zZVRleHQ6IGRhdGVUaW1lUGlja2VyTDEwbi5jbG9zZVRleHQsXG4gICAgICAgICAgICBhbXBtOiBmYWxzZSxcbiAgICAgICAgICAgIGFtTmFtZXM6IFsnQU0nLCAnQSddLFxuICAgICAgICAgICAgcG1OYW1lczogWydQTScsICdQJ10sXG4gICAgICAgICAgICB0aW1lRm9ybWF0OiAnaGg6bW06c3MgdHQnLFxuICAgICAgICAgICAgdGltZVN1ZmZpeDogJycsXG4gICAgICAgICAgICB0aW1lT25seVRpdGxlOiBkYXRlVGltZVBpY2tlckwxMG4udGltZU9ubHlUaXRsZSxcbiAgICAgICAgICAgIHRpbWVUZXh0OiBkYXRlVGltZVBpY2tlckwxMG4udGltZVRleHQsXG4gICAgICAgICAgICBob3VyVGV4dDogZGF0ZVRpbWVQaWNrZXJMMTBuLmhvdXJUZXh0LFxuICAgICAgICAgICAgbWludXRlVGV4dDogZGF0ZVRpbWVQaWNrZXJMMTBuLm1pbnV0ZVRleHQsXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGlja2VyID0gdGhpcy51aSAmJiB0aGlzLnVpLnBpY2tlciA/IHRoaXMudWkucGlja2VyIDogbnVsbDtcblxuICAgICAgICBpZiAocGlja2VyICYmIHBpY2tlci5sZW5ndGggJiYgcGlja2VyLmRhdGEoJ2RhdGV0aW1lcGlja2VyJykpIHtcbiAgICAgICAgICAgIHBpY2tlci5kYXRldGltZXBpY2tlcignZGVzdHJveScpO1xuICAgICAgICB9XG4gICAgfVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xEYXRlVGltZUl0ZW1WaWV3OyIsInZhciBDb250cm9sQmFzZVVuaXRzSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UtdW5pdHMnICksXG5cdENvbnRyb2xEaW1lbnNpb25zSXRlbVZpZXc7XG5cbkNvbnRyb2xEaW1lbnNpb25zSXRlbVZpZXcgPSBDb250cm9sQmFzZVVuaXRzSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdWkgPSBDb250cm9sQmFzZVVuaXRzSXRlbVZpZXcucHJvdG90eXBlLnVpLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHVpLmNvbnRyb2xzID0gJy5lbGVtZW50b3ItY29udHJvbC1kaW1lbnNpb24gPiBpbnB1dDplbmFibGVkJztcblx0XHR1aS5saW5rID0gJ2J1dHRvbi5lbGVtZW50b3ItbGluay1kaW1lbnNpb25zJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdjbGljayBAdWkubGluayc6ICdvbkxpbmtEaW1lbnNpb25zQ2xpY2tlZCdcblx0fSxcblxuXHRkZWZhdWx0RGltZW5zaW9uVmFsdWU6IDAsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Q29udHJvbEJhc2VVbml0c0l0ZW1WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdC8vIFRPRE86IE5lZWQgdG8gYmUgaW4gaGVscGVycywgYW5kIG5vdCBpbiB2YXJpYWJsZVxuXHRcdHRoaXMubW9kZWwuc2V0KCAnYWxsb3dlZF9kaW1lbnNpb25zJywgdGhpcy5maWx0ZXJEaW1lbnNpb25zKCB0aGlzLm1vZGVsLmdldCggJ2FsbG93ZWRfZGltZW5zaW9ucycgKSApICk7XG5cdH0sXG5cblx0Z2V0UG9zc2libGVEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0J3RvcCcsXG5cdFx0XHQncmlnaHQnLFxuXHRcdFx0J2JvdHRvbScsXG5cdFx0XHQnbGVmdCdcblx0XHRdO1xuXHR9LFxuXG5cdGZpbHRlckRpbWVuc2lvbnM6IGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0ZmlsdGVyID0gZmlsdGVyIHx8ICdhbGwnO1xuXG5cdFx0dmFyIGRpbWVuc2lvbnMgPSB0aGlzLmdldFBvc3NpYmxlRGltZW5zaW9ucygpO1xuXG5cdFx0aWYgKCAnYWxsJyA9PT0gZmlsdGVyICkge1xuXHRcdFx0cmV0dXJuIGRpbWVuc2lvbnM7XG5cdFx0fVxuXG5cdFx0aWYgKCAhIF8uaXNBcnJheSggZmlsdGVyICkgKSB7XG5cdFx0XHRpZiAoICdob3Jpem9udGFsJyA9PT0gZmlsdGVyICkge1xuXHRcdFx0XHRmaWx0ZXIgPSBbICdyaWdodCcsICdsZWZ0JyBdO1xuXHRcdFx0fSBlbHNlIGlmICggJ3ZlcnRpY2FsJyA9PT0gZmlsdGVyICkge1xuXHRcdFx0XHRmaWx0ZXIgPSBbICd0b3AnLCAnYm90dG9tJyBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmaWx0ZXI7XG5cdH0sXG5cblx0b25SZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGN1cnJlbnRWYWx1ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCk7XG5cblx0XHRpZiAoICEgdGhpcy5pc0xpbmtlZERpbWVuc2lvbnMoKSApIHtcblx0XHRcdHRoaXMudWkubGluay5hZGRDbGFzcyggJ3VubGlua2VkJyApO1xuXG5cdFx0XHR0aGlzLnVpLmNvbnRyb2xzLmVhY2goIF8uYmluZCggZnVuY3Rpb24oIGluZGV4LCBlbGVtZW50ICkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBjdXJyZW50VmFsdWVbIGVsZW1lbnQuZGF0YXNldC5zZXR0aW5nIF07XG5cblx0XHRcdFx0aWYgKCBfLmlzRW1wdHkoIHZhbHVlICkgKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB0aGlzLmRlZmF1bHREaW1lbnNpb25WYWx1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuJCggZWxlbWVudCApLnZhbCggdmFsdWUgKTtcblx0XHRcdH0sIHRoaXMgKSApO1xuXHRcdH1cblxuXHRcdHRoaXMuZmlsbEVtcHR5RGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdHVwZGF0ZURpbWVuc2lvbnNWYWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGN1cnJlbnRWYWx1ZSA9IHt9LFxuXHRcdFx0ZGltZW5zaW9ucyA9IHRoaXMuZ2V0UG9zc2libGVEaW1lbnNpb25zKCksXG5cdFx0XHQkY29udHJvbHMgPSB0aGlzLnVpLmNvbnRyb2xzO1xuXG5cdFx0ZGltZW5zaW9ucy5mb3JFYWNoKCBfLmJpbmQoIGZ1bmN0aW9uKCBkaW1lbnNpb24gKSB7XG5cdFx0XHR2YXIgJGVsZW1lbnQgPSAkY29udHJvbHMuZmlsdGVyKCAnW2RhdGEtc2V0dGluZz1cIicgKyBkaW1lbnNpb24gKyAnXCJdJyApO1xuXG5cdFx0XHRjdXJyZW50VmFsdWVbIGRpbWVuc2lvbiBdID0gJGVsZW1lbnQubGVuZ3RoID8gJGVsZW1lbnQudmFsKCkgOiB0aGlzLmRlZmF1bHREaW1lbnNpb25WYWx1ZTtcblx0XHR9LCB0aGlzICkgKTtcblxuXHRcdHRoaXMuc2V0VmFsdWUoIGN1cnJlbnRWYWx1ZSApO1xuXHR9LFxuXG5cdGZpbGxFbXB0eURpbWVuc2lvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkaW1lbnNpb25zID0gdGhpcy5nZXRQb3NzaWJsZURpbWVuc2lvbnMoKSxcblx0XHRcdGFsbG93ZWREaW1lbnNpb25zID0gdGhpcy5tb2RlbC5nZXQoICdhbGxvd2VkX2RpbWVuc2lvbnMnICksXG5cdFx0XHQkY29udHJvbHMgPSB0aGlzLnVpLmNvbnRyb2xzO1xuXG5cdFx0aWYgKCB0aGlzLmlzTGlua2VkRGltZW5zaW9ucygpICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGRpbWVuc2lvbnMuZm9yRWFjaCggXy5iaW5kKCBmdW5jdGlvbiggZGltZW5zaW9uICkge1xuXHRcdFx0dmFyICRlbGVtZW50ID0gJGNvbnRyb2xzLmZpbHRlciggJ1tkYXRhLXNldHRpbmc9XCInICsgZGltZW5zaW9uICsgJ1wiXScgKSxcblx0XHRcdFx0aXNBbGxvd2VkRGltZW5zaW9uID0gLTEgIT09IF8uaW5kZXhPZiggYWxsb3dlZERpbWVuc2lvbnMsIGRpbWVuc2lvbiApO1xuXG5cdFx0XHRpZiAoIGlzQWxsb3dlZERpbWVuc2lvbiAmJiAkZWxlbWVudC5sZW5ndGggJiYgXy5pc0VtcHR5KCAkZWxlbWVudC52YWwoKSApICkge1xuXHRcdFx0XHQkZWxlbWVudC52YWwoIHRoaXMuZGVmYXVsdERpbWVuc2lvblZhbHVlICk7XG5cdFx0XHR9XG5cblx0XHR9LCB0aGlzICkgKTtcblx0fSxcblxuXHR1cGRhdGVEaW1lbnNpb25zOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZpbGxFbXB0eURpbWVuc2lvbnMoKTtcblx0XHR0aGlzLnVwZGF0ZURpbWVuc2lvbnNWYWx1ZSgpO1xuXHR9LFxuXG5cdHJlc2V0RGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5jb250cm9scy52YWwoICcnICk7XG5cblx0XHR0aGlzLnVwZGF0ZURpbWVuc2lvbnNWYWx1ZSgpO1xuXHR9LFxuXG5cdG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgaW5wdXRTZXR0aW5nID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQuc2V0dGluZztcblxuXHRcdGlmICggJ3VuaXQnID09PSBpbnB1dFNldHRpbmcgKSB7XG5cdFx0XHR0aGlzLnJlc2V0RGltZW5zaW9ucygpO1xuXHRcdH1cblxuXHRcdGlmICggISBfLmNvbnRhaW5zKCB0aGlzLmdldFBvc3NpYmxlRGltZW5zaW9ucygpLCBpbnB1dFNldHRpbmcgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuaXNMaW5rZWREaW1lbnNpb25zKCkgKSB7XG5cdFx0XHR2YXIgJHRoaXNDb250cm9sID0gdGhpcy4kKCBldmVudC50YXJnZXQgKTtcblxuXHRcdFx0dGhpcy51aS5jb250cm9scy52YWwoICR0aGlzQ29udHJvbC52YWwoKSApO1xuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdG9uTGlua0RpbWVuc2lvbnNDbGlja2VkOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdHRoaXMudWkubGluay50b2dnbGVDbGFzcyggJ3VubGlua2VkJyApO1xuXG5cdFx0dGhpcy5zZXRWYWx1ZSggJ2lzTGlua2VkJywgISB0aGlzLnVpLmxpbmsuaGFzQ2xhc3MoICd1bmxpbmtlZCcgKSApO1xuXG5cdFx0aWYgKCB0aGlzLmlzTGlua2VkRGltZW5zaW9ucygpICkge1xuXHRcdFx0Ly8gU2V0IGFsbCBjb250cm9scyB2YWx1ZSBmcm9tIHRoZSBmaXJzdCBjb250cm9sLlxuXHRcdFx0dGhpcy51aS5jb250cm9scy52YWwoIHRoaXMudWkuY29udHJvbHMuZXEoIDAgKS52YWwoKSApO1xuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlRGltZW5zaW9ucygpO1xuXHR9LFxuXG5cdGlzTGlua2VkRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAnaXNMaW5rZWQnICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sRGltZW5zaW9uc0l0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xGb250SXRlbVZpZXc7XG5cbkNvbnRyb2xGb250SXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnNlbGVjdC5zZWxlY3QyKCB7XG5cdFx0XHRkaXI6IGVsZW1lbnRvci5jb25maWcuaXNfcnRsID8gJ3J0bCcgOiAnbHRyJ1xuXHRcdH0gKTtcblx0fSxcblxuXHR0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBoZWxwZXJzID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudGVtcGxhdGVIZWxwZXJzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdGhlbHBlcnMuZ2V0Rm9udHNCeUdyb3VwcyA9IF8uYmluZCggZnVuY3Rpb24oIGdyb3VwcyApIHtcblx0XHRcdHZhciBmb250cyA9IHRoaXMubW9kZWwuZ2V0KCAnZm9udHMnICksXG5cdFx0XHRcdGZpbHRlcmVkRm9udHMgPSB7fTtcblxuXHRcdFx0Xy5lYWNoKCBmb250cywgZnVuY3Rpb24oIGZvbnRUeXBlLCBmb250TmFtZSApIHtcblx0XHRcdFx0aWYgKCBfLmlzQXJyYXkoIGdyb3VwcyApICYmIF8uY29udGFpbnMoIGdyb3VwcywgZm9udFR5cGUgKSB8fCBmb250VHlwZSA9PT0gZ3JvdXBzICkge1xuXHRcdFx0XHRcdGZpbHRlcmVkRm9udHNbIGZvbnROYW1lIF0gPSBmb250VHlwZTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXG5cdFx0XHRyZXR1cm4gZmlsdGVyZWRGb250cztcblx0XHR9LCB0aGlzICk7XG5cblx0XHRyZXR1cm4gaGVscGVycztcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xGb250SXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcblx0Q29udHJvbE1lZGlhSXRlbVZpZXc7XG5cbkNvbnRyb2xNZWRpYUl0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xCYXNlSXRlbVZpZXcucHJvdG90eXBlLnVpLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHVpLmFkZEltYWdlcyA9ICcuZWxlbWVudG9yLWNvbnRyb2wtZ2FsbGVyeS1hZGQnO1xuXHRcdHVpLmNsZWFyR2FsbGVyeSA9ICcuZWxlbWVudG9yLWNvbnRyb2wtZ2FsbGVyeS1jbGVhcic7XG5cdFx0dWkuZ2FsbGVyeVRodW1ibmFpbHMgPSAnLmVsZW1lbnRvci1jb250cm9sLWdhbGxlcnktdGh1bWJuYWlscyc7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0Y2hpbGRFdmVudHM6IHtcblx0XHQnY2xpY2sgQHVpLmFkZEltYWdlcyc6ICdvbkFkZEltYWdlc0NsaWNrJyxcblx0XHQnY2xpY2sgQHVpLmNsZWFyR2FsbGVyeSc6ICdvbkNsZWFyR2FsbGVyeUNsaWNrJyxcblx0XHQnY2xpY2sgQHVpLmdhbGxlcnlUaHVtYm5haWxzJzogJ29uR2FsbGVyeVRodW1ibmFpbHNDbGljaydcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGFzSW1hZ2VzID0gdGhpcy5oYXNJbWFnZXMoKTtcblxuXHRcdHRoaXMuJGVsXG5cdFx0ICAgIC50b2dnbGVDbGFzcyggJ2VsZW1lbnRvci1nYWxsZXJ5LWhhcy1pbWFnZXMnLCBoYXNJbWFnZXMgKVxuXHRcdCAgICAudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3ItZ2FsbGVyeS1lbXB0eScsICEgaGFzSW1hZ2VzICk7XG5cblx0XHR0aGlzLmluaXRSZW1vdmVEaWFsb2coKTtcblx0fSxcblxuXHRoYXNJbWFnZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAhISB0aGlzLmdldENvbnRyb2xWYWx1ZSgpLmxlbmd0aDtcblx0fSxcblxuXHRvcGVuRnJhbWU6IGZ1bmN0aW9uKCBhY3Rpb24gKSB7XG5cdFx0dGhpcy5pbml0RnJhbWUoIGFjdGlvbiApO1xuXG5cdFx0dGhpcy5mcmFtZS5vcGVuKCk7XG5cdH0sXG5cblx0aW5pdEZyYW1lOiBmdW5jdGlvbiggYWN0aW9uICkge1xuXHRcdHZhciBmcmFtZVN0YXRlcyA9IHtcblx0XHRcdGNyZWF0ZTogJ2dhbGxlcnknLFxuXHRcdFx0YWRkOiAnZ2FsbGVyeS1saWJyYXJ5Jyxcblx0XHRcdGVkaXQ6ICdnYWxsZXJ5LWVkaXQnXG5cdFx0fTtcblxuXHRcdHZhciBvcHRpb25zID0ge1xuXHRcdFx0ZnJhbWU6ICAncG9zdCcsXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHN0YXRlOiBmcmFtZVN0YXRlc1sgYWN0aW9uIF0sXG5cdFx0XHRidXR0b246IHtcblx0XHRcdFx0dGV4dDogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2luc2VydF9tZWRpYScgKVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoIHRoaXMuaGFzSW1hZ2VzKCkgKSB7XG5cdFx0XHRvcHRpb25zLnNlbGVjdGlvbiA9IHRoaXMuZmV0Y2hTZWxlY3Rpb24oKTtcblx0XHR9XG5cblx0XHR0aGlzLmZyYW1lID0gd3AubWVkaWEoIG9wdGlvbnMgKTtcblxuXHRcdC8vIFdoZW4gYSBmaWxlIGlzIHNlbGVjdGVkLCBydW4gYSBjYWxsYmFjay5cblx0XHR0aGlzLmZyYW1lLm9uKCB7XG5cdFx0XHQndXBkYXRlJzogdGhpcy5zZWxlY3QsXG5cdFx0XHQnbWVudTpyZW5kZXI6ZGVmYXVsdCc6IHRoaXMubWVudVJlbmRlcixcblx0XHRcdCdjb250ZW50OnJlbmRlcjpicm93c2UnOiB0aGlzLmdhbGxlcnlTZXR0aW5nc1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblxuXHRtZW51UmVuZGVyOiBmdW5jdGlvbiggdmlldyApIHtcblx0XHR2aWV3LnVuc2V0KCAnaW5zZXJ0JyApO1xuXHRcdHZpZXcudW5zZXQoICdmZWF0dXJlZC1pbWFnZScgKTtcblx0fSxcblxuXHRnYWxsZXJ5U2V0dGluZ3M6IGZ1bmN0aW9uKCBicm93c2VyICkge1xuXHRcdGJyb3dzZXIuc2lkZWJhci5vbiggJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRicm93c2VyLnNpZGViYXIudW5zZXQoICdnYWxsZXJ5JyApO1xuXHRcdH0gKTtcblx0fSxcblxuXHRmZXRjaFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGF0dGFjaG1lbnRzID0gd3AubWVkaWEucXVlcnkoIHtcblx0XHRcdG9yZGVyYnk6ICdwb3N0X19pbicsXG5cdFx0XHRvcmRlcjogJ0FTQycsXG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0cGVyUGFnZTogLTEsXG5cdFx0XHRwb3N0X19pbjogXy5wbHVjayggdGhpcy5nZXRDb250cm9sVmFsdWUoKSwgJ2lkJyApXG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIG5ldyB3cC5tZWRpYS5tb2RlbC5TZWxlY3Rpb24oIGF0dGFjaG1lbnRzLm1vZGVscywge1xuXHRcdFx0cHJvcHM6IGF0dGFjaG1lbnRzLnByb3BzLnRvSlNPTigpLFxuXHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHR9ICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxiYWNrIGhhbmRsZXIgZm9yIHdoZW4gYW4gYXR0YWNobWVudCBpcyBzZWxlY3RlZCBpbiB0aGUgbWVkaWEgbW9kYWwuXG5cdCAqIEdldHMgdGhlIHNlbGVjdGVkIGltYWdlIGluZm9ybWF0aW9uLCBhbmQgc2V0cyBpdCB3aXRoaW4gdGhlIGNvbnRyb2wuXG5cdCAqL1xuXHRzZWxlY3Q6IGZ1bmN0aW9uKCBzZWxlY3Rpb24gKSB7XG5cdFx0dmFyIGltYWdlcyA9IFtdO1xuXG5cdFx0c2VsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBpbWFnZSApIHtcblx0XHRcdGltYWdlcy5wdXNoKCB7XG5cdFx0XHRcdGlkOiBpbWFnZS5nZXQoICdpZCcgKSxcblx0XHRcdFx0dXJsOiBpbWFnZS5nZXQoICd1cmwnIClcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLnNldFZhbHVlKCBpbWFnZXMgKTtcblxuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0b25CZWZvcmVEZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZnJhbWUgKSB7XG5cdFx0XHR0aGlzLmZyYW1lLm9mZigpO1xuXHRcdH1cblxuXHRcdHRoaXMuJGVsLnJlbW92ZSgpO1xuXHR9LFxuXG5cdHJlc2V0R2FsbGVyeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRWYWx1ZSggJycgKTtcblxuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0aW5pdFJlbW92ZURpYWxvZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlbW92ZURpYWxvZztcblxuXHRcdHRoaXMuZ2V0UmVtb3ZlRGlhbG9nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICEgcmVtb3ZlRGlhbG9nICkge1xuXHRcdFx0XHRyZW1vdmVEaWFsb2cgPSBlbGVtZW50b3IuZGlhbG9nc01hbmFnZXIuY3JlYXRlV2lkZ2V0KCAnY29uZmlybScsIHtcblx0XHRcdFx0XHRtZXNzYWdlOiBlbGVtZW50b3IudHJhbnNsYXRlKCAnZGlhbG9nX2NvbmZpcm1fZ2FsbGVyeV9kZWxldGUnICksXG5cdFx0XHRcdFx0aGVhZGVyTWVzc2FnZTogZWxlbWVudG9yLnRyYW5zbGF0ZSggJ2RlbGV0ZV9nYWxsZXJ5JyApLFxuXHRcdFx0XHRcdHN0cmluZ3M6IHtcblx0XHRcdFx0XHRcdGNvbmZpcm06IGVsZW1lbnRvci50cmFuc2xhdGUoICdkZWxldGUnICksXG5cdFx0XHRcdFx0XHRjYW5jZWw6IGVsZW1lbnRvci50cmFuc2xhdGUoICdjYW5jZWwnIClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGRlZmF1bHRPcHRpb246ICdjb25maXJtJyxcblx0XHRcdFx0XHRvbkNvbmZpcm06IF8uYmluZCggdGhpcy5yZXNldEdhbGxlcnksIHRoaXMgKVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZW1vdmVEaWFsb2c7XG5cdFx0fTtcblx0fSxcblxuXHRvbkFkZEltYWdlc0NsaWNrOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9wZW5GcmFtZSggdGhpcy5oYXNJbWFnZXMoKSA/ICdhZGQnIDogJ2NyZWF0ZScgKTtcblx0fSxcblxuXHRvbkNsZWFyR2FsbGVyeUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldFJlbW92ZURpYWxvZygpLnNob3coKTtcblx0fSxcblxuXHRvbkdhbGxlcnlUaHVtYm5haWxzQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMub3BlbkZyYW1lKCAnZWRpdCcgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xNZWRpYUl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xJY29uSXRlbVZpZXc7XG5cbi8vIFNoYXJlZCBjYWNoZXMgYWNyb3NzIGFsbCBpY29uIGNvbnRyb2wgaW5zdGFuY2VzIChyZXBlYXRlciByb3dzLCBldGMuKVxudmFyIF9tYW5pZmVzdENhY2hlID0ge307XG52YXIgX2xvYWRlZENzcyA9IHt9O1xudmFyIF9zdmdDYWNoZSA9IHt9O1xuXG5Db250cm9sSWNvbkl0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblxuXHRfY3VycmVudExpYnJhcnk6IG51bGwsXG5cdF9hbGxJY29uczogW10sXG5cdF9maWx0ZXJlZEljb25zOiBbXSxcblx0X3JlbmRlck9mZnNldDogMCxcblx0X0JBVENIX1NJWkU6IDYwLFxuXHRfcGFuZWxPcGVuOiBmYWxzZSxcblx0X2xpYnJhcmllczogbnVsbCxcblx0X291dHNpZGVDbGlja0hhbmRsZXI6IG51bGwsXG5cblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYXJlbnRVaSA9IENvbnRyb2xCYXNlSXRlbVZpZXcucHJvdG90eXBlLnVpO1xuXHRcdGlmICggdHlwZW9mIHBhcmVudFVpID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0cGFyZW50VWkgPSBwYXJlbnRVaS5jYWxsKCB0aGlzICk7XG5cdFx0fVxuXHRcdHJldHVybiBfLmV4dGVuZCgge30sIHBhcmVudFVpLCB7XG5cdFx0XHRwaWNrZXI6ICcuZWxlbWVudG9yLWljb24tcGlja2VyJyxcblx0XHRcdHByZXZpZXc6ICcuZWxlbWVudG9yLWljb24tcGlja2VyLXByZXZpZXcnLFxuXHRcdFx0cHJldmlld0ljb246ICcuZWxlbWVudG9yLWljb24tcGlja2VyLXByZXZpZXctaWNvbicsXG5cdFx0XHRwcmV2aWV3TGFiZWw6ICcuZWxlbWVudG9yLWljb24tcGlja2VyLXByZXZpZXctbGFiZWwnLFxuXHRcdFx0Y2xlYXJCdG46ICcuZWxlbWVudG9yLWljb24tcGlja2VyLWNsZWFyJyxcblx0XHRcdHBhbmVsOiAnLmVsZW1lbnRvci1pY29uLXBpY2tlci1wYW5lbCcsXG5cdFx0XHR0YWJzOiAnLmVsZW1lbnRvci1pY29uLXBpY2tlci10YWJzJyxcblx0XHRcdHNlYXJjaElucHV0OiAnLmVsZW1lbnRvci1pY29uLXBpY2tlci1zZWFyY2ggaW5wdXQnLFxuXHRcdFx0Z3JpZDogJy5lbGVtZW50b3ItaWNvbi1waWNrZXItZ3JpZCdcblx0XHR9ICk7XG5cdH0sXG5cblx0ZXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5leHRlbmQoIENvbnRyb2xCYXNlSXRlbVZpZXcucHJvdG90eXBlLmV2ZW50cy5hcHBseSggdGhpcywgYXJndW1lbnRzICksIHtcblx0XHRcdCdjbGljayAuZWxlbWVudG9yLWljb24tcGlja2VyLXByZXZpZXcnOiAnb25Ub2dnbGVQYW5lbCcsXG5cdFx0XHQnY2xpY2sgLmVsZW1lbnRvci1pY29uLXBpY2tlci1jbGVhcic6ICdvbkNsZWFySWNvbicsXG5cdFx0XHQnaW5wdXQgLmVsZW1lbnRvci1pY29uLXBpY2tlci1zZWFyY2ggaW5wdXQnOiAnb25TZWFyY2hJbnB1dCcsXG5cdFx0XHQnY2xpY2sgLmVsZW1lbnRvci1pY29uLXBpY2tlci10YWInOiAnb25UYWJDbGljaycsXG5cdFx0XHQnY2xpY2sgLmVsZW1lbnRvci1pY29uLXBpY2tlci1pdGVtJzogJ29uSWNvbkNsaWNrJ1xuXHRcdH0gKTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9saWJyYXJpZXMgPSB0aGlzLm1vZGVsLmdldCggJ2xpYnJhcmllcycgKSB8fCB7fTtcblx0XHR2YXIga2V5cyA9IF8ua2V5cyggdGhpcy5fbGlicmFyaWVzICk7XG5cdFx0dGhpcy5fY3VycmVudExpYnJhcnkgPSBrZXlzWzBdIHx8IG51bGw7XG5cblx0XHQvLyBCdWlsZCB0YWJzIG9ubHkgaWYgbXVsdGlwbGUgbGlicmFyaWVzXG5cdFx0aWYgKCBrZXlzLmxlbmd0aCA+IDEgKSB7XG5cdFx0XHR0aGlzLl9yZW5kZXJUYWJzKCBrZXlzICk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzdG9yZSBwcmV2aWV3IGZyb20gZXhpc3RpbmcgdmFsdWVcblx0XHR0aGlzLl9yZXN0b3JlUHJldmlldygpO1xuXG5cdFx0Ly8gTG9hZCBmaXJzdCBsaWJyYXJ5IG1hbmlmZXN0XG5cdFx0aWYgKCB0aGlzLl9jdXJyZW50TGlicmFyeSApIHtcblx0XHRcdHRoaXMuX2xvYWRNYW5pZmVzdCggdGhpcy5fY3VycmVudExpYnJhcnkgKTtcblx0XHR9XG5cblx0XHQvLyBJbmZpbml0ZSBzY3JvbGxcblx0XHR0aGlzLnVpLmdyaWQub24oICdzY3JvbGwnLCBfLmJpbmQoIHRoaXMuX29uR3JpZFNjcm9sbCwgdGhpcyApICk7XG5cdH0sXG5cblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cdC8vIFRhYnNcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0X3JlbmRlclRhYnM6IGZ1bmN0aW9uKCBrZXlzICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgJHRhYnMgPSB0aGlzLnVpLnRhYnM7XG5cdFx0JHRhYnMuZW1wdHkoKTtcblxuXHRcdF8uZWFjaCgga2V5cywgZnVuY3Rpb24oIGtleSApIHtcblx0XHRcdHZhciBsaWIgPSBzZWxmLl9saWJyYXJpZXNbIGtleSBdO1xuXHRcdFx0dmFyICR0YWIgPSBCYWNrYm9uZS4kKCAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1pY29uLXBpY2tlci10YWJcIiAvPicgKVxuXHRcdFx0XHQuYXR0ciggJ2RhdGEtbGlicmFyeScsIGtleSApXG5cdFx0XHRcdC50ZXh0KCBsaWIubGFiZWwgKTtcblxuXHRcdFx0aWYgKCBrZXkgPT09IHNlbGYuX2N1cnJlbnRMaWJyYXJ5ICkge1xuXHRcdFx0XHQkdGFiLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdFx0fVxuXHRcdFx0JHRhYnMuYXBwZW5kKCAkdGFiICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdG9uVGFiQ2xpY2s6IGZ1bmN0aW9uKCBlICkge1xuXHRcdHZhciAkdGFiID0gQmFja2JvbmUuJCggZS5jdXJyZW50VGFyZ2V0ICk7XG5cdFx0dmFyIGtleSA9ICR0YWIuZGF0YSggJ2xpYnJhcnknICk7XG5cblx0XHRpZiAoIGtleSA9PT0gdGhpcy5fY3VycmVudExpYnJhcnkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy51aS50YWJzLmZpbmQoICcuZWxlbWVudG9yLWljb24tcGlja2VyLXRhYicgKS5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHQkdGFiLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXG5cdFx0dGhpcy5fY3VycmVudExpYnJhcnkgPSBrZXk7XG5cdFx0dGhpcy51aS5zZWFyY2hJbnB1dC52YWwoICcnICk7XG5cdFx0dGhpcy5fbG9hZE1hbmlmZXN0KCBrZXkgKTtcblx0fSxcblxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblx0Ly8gUGFuZWwgdG9nZ2xlXG5cdC8vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5cdG9uVG9nZ2xlUGFuZWw6IGZ1bmN0aW9uKCBlICkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0aWYgKCB0aGlzLl9wYW5lbE9wZW4gKSB7XG5cdFx0XHR0aGlzLl9jbG9zZVBhbmVsKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX29wZW5QYW5lbCgpO1xuXHRcdH1cblx0fSxcblxuXHRfb3BlblBhbmVsOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnBhbmVsLnNob3coKTtcblx0XHR0aGlzLl9wYW5lbE9wZW4gPSB0cnVlO1xuXHRcdHRoaXMudWkuc2VhcmNoSW5wdXQuZm9jdXMoKTtcblxuXHRcdC8vIENsb3NlIG9uIGNsaWNrIG91dHNpZGVcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5fb3V0c2lkZUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKCBlICkge1xuXHRcdFx0aWYgKCAhIEJhY2tib25lLiQoIGUudGFyZ2V0ICkuY2xvc2VzdCggJy5lbGVtZW50b3ItaWNvbi1waWNrZXInICkubGVuZ3RoICkge1xuXHRcdFx0XHRzZWxmLl9jbG9zZVBhbmVsKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdF8uZGVmZXIoIGZ1bmN0aW9uKCkge1xuXHRcdFx0QmFja2JvbmUuJCggZG9jdW1lbnQgKS5vbiggJ2NsaWNrLmljb25QaWNrZXInLCBzZWxmLl9vdXRzaWRlQ2xpY2tIYW5kbGVyICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdF9jbG9zZVBhbmVsOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLnBhbmVsLmhpZGUoKTtcblx0XHR0aGlzLl9wYW5lbE9wZW4gPSBmYWxzZTtcblx0XHRCYWNrYm9uZS4kKCBkb2N1bWVudCApLm9mZiggJ2NsaWNrLmljb25QaWNrZXInICk7XG5cdH0sXG5cblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cdC8vIE1hbmlmZXN0IGxvYWRpbmdcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0X2xvYWRNYW5pZmVzdDogZnVuY3Rpb24oIGtleSApIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIGxpYiA9IHRoaXMuX2xpYnJhcmllc1sga2V5IF07XG5cblx0XHRpZiAoICEgbGliICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENoZWNrIGNhY2hlXG5cdFx0aWYgKCBfbWFuaWZlc3RDYWNoZVsga2V5IF0gKSB7XG5cdFx0XHRzZWxmLl9vbk1hbmlmZXN0TG9hZGVkKCBrZXksIF9tYW5pZmVzdENhY2hlWyBrZXkgXSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNob3cgbG9hZGluZyBzdGF0ZVxuXHRcdHRoaXMudWkuZ3JpZC5odG1sKCAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1pY29uLXBpY2tlci1sb2FkaW5nXCI+TG9hZGluZy4uLjwvZGl2PicgKTtcblxuXHRcdHZhciB1cmwgPSBlbGVtZW50b3IuY29uZmlnLmFzc2V0c191cmwgKyAnZGF0YS9pY29uLW1hbmlmZXN0cy8nICsgbGliLm1hbmlmZXN0O1xuXG5cdFx0QmFja2JvbmUuJC5nZXRKU09OKCB1cmwgKVxuXHRcdFx0LmRvbmUoIGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRfbWFuaWZlc3RDYWNoZVsga2V5IF0gPSBkYXRhO1xuXHRcdFx0XHRzZWxmLl9vbk1hbmlmZXN0TG9hZGVkKCBrZXksIGRhdGEgKTtcblx0XHRcdH0gKVxuXHRcdFx0LmZhaWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLnVpLmdyaWQuaHRtbCggJzxkaXYgY2xhc3M9XCJlbGVtZW50b3ItaWNvbi1waWNrZXItZW1wdHlcIj5GYWlsZWQgdG8gbG9hZCBpY29uczwvZGl2PicgKTtcblx0XHRcdH0gKTtcblx0fSxcblxuXHRfb25NYW5pZmVzdExvYWRlZDogZnVuY3Rpb24oIGtleSwgZGF0YSApIHtcblx0XHQvLyBMb2FkIENETiBDU1MgZm9yIGZvbnQgcHJldmlldyBpbiBlZGl0b3Jcblx0XHRpZiAoIGRhdGEuY2RuQ3NzICkge1xuXHRcdFx0dGhpcy5fbG9hZExpYnJhcnlDc3MoIGtleSwgZGF0YS5jZG5Dc3MgKTtcblx0XHR9XG5cblx0XHR0aGlzLl9hbGxJY29ucyA9IGRhdGEuaWNvbnMgfHwgW107XG5cdFx0dGhpcy5fcmVuZGVyR3JpZCgpO1xuXHR9LFxuXG5cdF9sb2FkTGlicmFyeUNzczogZnVuY3Rpb24oIGtleSwgdXJsICkge1xuXHRcdGlmICggX2xvYWRlZENzc1sga2V5IF0gKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdF9sb2FkZWRDc3NbIGtleSBdID0gdHJ1ZTtcblxuXHRcdHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2xpbmsnICk7XG5cdFx0bGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG5cdFx0bGluay5ocmVmID0gdXJsO1xuXHRcdGxpbmsuaWQgPSAnaXFpdC1pY29uLWxpYi0nICsga2V5O1xuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoIGxpbmsgKTtcblx0fSxcblxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblx0Ly8gR3JpZCByZW5kZXJpbmdcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0X3JlbmRlckdyaWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudWkuZ3JpZC5lbXB0eSgpLnNjcm9sbFRvcCggMCApO1xuXHRcdHRoaXMuX3JlbmRlck9mZnNldCA9IDA7XG5cblx0XHR2YXIgdGVybSA9ICggdGhpcy51aS5zZWFyY2hJbnB1dC52YWwoKSB8fCAnJyApLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG5cdFx0aWYgKCB0ZXJtICkge1xuXHRcdFx0dGhpcy5fZmlsdGVyZWRJY29ucyA9IF8uZmlsdGVyKCB0aGlzLl9hbGxJY29ucywgZnVuY3Rpb24oIGljb24gKSB7XG5cdFx0XHRcdHJldHVybiBpY29uLm4uaW5kZXhPZiggdGVybSApICE9PSAtMTtcblx0XHRcdH0gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fZmlsdGVyZWRJY29ucyA9IHRoaXMuX2FsbEljb25zO1xuXHRcdH1cblxuXHRcdGlmICggISB0aGlzLl9maWx0ZXJlZEljb25zLmxlbmd0aCApIHtcblx0XHRcdHZhciBub1Jlc3VsdFRleHQgPSB0aGlzLnVpLnBpY2tlci5kYXRhKCAnbm8tcmVzdWx0JyApIHx8ICdObyBpY29ucyBmb3VuZCc7XG5cdFx0XHR0aGlzLnVpLmdyaWQuaHRtbCggJzxkaXYgY2xhc3M9XCJlbGVtZW50b3ItaWNvbi1waWNrZXItZW1wdHlcIj4nICsgbm9SZXN1bHRUZXh0ICsgJzwvZGl2PicgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9yZW5kZXJCYXRjaCgpO1xuXHR9LFxuXG5cdF9yZW5kZXJCYXRjaDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJhdGNoID0gdGhpcy5fZmlsdGVyZWRJY29ucy5zbGljZSggdGhpcy5fcmVuZGVyT2Zmc2V0LCB0aGlzLl9yZW5kZXJPZmZzZXQgKyB0aGlzLl9CQVRDSF9TSVpFICk7XG5cblx0XHRpZiAoICEgYmF0Y2gubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBjdXJyZW50VmFsdWUgPSB0aGlzLl9nZXRDdXJyZW50SWNvbkNsYXNzKCk7XG5cdFx0dmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG5cdFx0Xy5lYWNoKCBiYXRjaCwgZnVuY3Rpb24oIGljb24gKSB7XG5cdFx0XHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcblx0XHRcdGRpdi5jbGFzc05hbWUgPSAnZWxlbWVudG9yLWljb24tcGlja2VyLWl0ZW0nO1xuXHRcdFx0aWYgKCBpY29uLmMgPT09IGN1cnJlbnRWYWx1ZSApIHtcblx0XHRcdFx0ZGl2LmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcblx0XHRcdH1cblx0XHRcdGRpdi5zZXRBdHRyaWJ1dGUoICdkYXRhLWNsYXNzJywgaWNvbi5jICk7XG5cdFx0XHRkaXYuc2V0QXR0cmlidXRlKCAnZGF0YS1zdHlsZScsIGljb24ucyApO1xuXHRcdFx0ZGl2LnNldEF0dHJpYnV0ZSggJ2RhdGEtbmFtZScsIGljb24ubiApO1xuXHRcdFx0ZGl2LnRpdGxlID0gaWNvbi5uO1xuXG5cdFx0XHR2YXIgaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpJyApO1xuXHRcdFx0aS5jbGFzc05hbWUgPSBpY29uLmM7XG5cdFx0XHRkaXYuYXBwZW5kQ2hpbGQoIGkgKTtcblxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGRpdiApO1xuXHRcdH0gKTtcblxuXHRcdHRoaXMudWkuZ3JpZFswXS5hcHBlbmRDaGlsZCggZnJhZ21lbnQgKTtcblx0XHR0aGlzLl9yZW5kZXJPZmZzZXQgKz0gYmF0Y2gubGVuZ3RoO1xuXHR9LFxuXG5cdF9vbkdyaWRTY3JvbGw6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbCA9IHRoaXMudWkuZ3JpZFswXTtcblx0XHRpZiAoIGVsLnNjcm9sbFRvcCArIGVsLmNsaWVudEhlaWdodCA+PSBlbC5zY3JvbGxIZWlnaHQgLSA0MCApIHtcblx0XHRcdHRoaXMuX3JlbmRlckJhdGNoKCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXHQvLyBTZWFyY2hcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0b25TZWFyY2hJbnB1dDogXy5kZWJvdW5jZSggZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fcmVuZGVyR3JpZCgpO1xuXHR9LCAyMDAgKSxcblxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblx0Ly8gSWNvbiBzZWxlY3Rpb24gJiBTVkcgZmV0Y2hcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0b25JY29uQ2xpY2s6IGZ1bmN0aW9uKCBlICkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0dmFyICRpdGVtID0gQmFja2JvbmUuJCggZS5jdXJyZW50VGFyZ2V0ICk7XG5cdFx0dmFyIGljb25DbGFzcyA9ICRpdGVtLmF0dHIoICdkYXRhLWNsYXNzJyApO1xuXHRcdHZhciBzdHlsZSA9ICRpdGVtLmF0dHIoICdkYXRhLXN0eWxlJyApO1xuXHRcdHZhciBuYW1lID0gJGl0ZW0uYXR0ciggJ2RhdGEtbmFtZScgKTtcblx0XHR2YXIgbGlicmFyeSA9IHRoaXMuX2N1cnJlbnRMaWJyYXJ5O1xuXG5cdFx0Ly8gVmlzdWFsIGZlZWRiYWNrXG5cdFx0dGhpcy51aS5ncmlkLmZpbmQoICcuc2VsZWN0ZWQnICkucmVtb3ZlQ2xhc3MoICdzZWxlY3RlZCcgKTtcblx0XHQkaXRlbS5hZGRDbGFzcyggJ3NlbGVjdGVkJyApO1xuXG5cdFx0Ly8gVXBkYXRlIHByZXZpZXcgaW1tZWRpYXRlbHkgKHVzaW5nIGZvbnQgaWNvbilcblx0XHR0aGlzLl91cGRhdGVQcmV2aWV3KCBpY29uQ2xhc3MsIG5hbWUgKTtcblxuXHRcdC8vIEZldGNoIFNWRywgc2F2ZSB0byBkaXNrLCB0aGVuIHN0b3JlIG9ubHkgdGhlIGtleVxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLl9mZXRjaFN2ZyggbGlicmFyeSwgc3R5bGUsIG5hbWUsIGZ1bmN0aW9uKCBzdmcgKSB7XG5cdFx0XHRpZiAoIHN2ZyApIHtcblx0XHRcdFx0c2VsZi5fc2F2ZVN2Z1RvRGlzayggbGlicmFyeSwgc3R5bGUsIG5hbWUsIHN2ZywgZnVuY3Rpb24oIHN2Z0tleSApIHtcblx0XHRcdFx0XHR2YXIgbmV3VmFsdWUgPSBKU09OLnN0cmluZ2lmeSgge1xuXHRcdFx0XHRcdFx0bGlicmFyeTogbGlicmFyeSxcblx0XHRcdFx0XHRcdHZhbHVlOiBpY29uQ2xhc3MsXG5cdFx0XHRcdFx0XHRzdmdLZXk6IHN2Z0tleSB8fCAnJ1xuXHRcdFx0XHRcdH0gKTtcblxuXHRcdFx0XHRcdHNlbGYudWkuaW5wdXQudmFsKCBuZXdWYWx1ZSApLnRyaWdnZXIoICdpbnB1dCcgKTtcblx0XHRcdFx0XHRzZWxmLnNldFZhbHVlKCBuZXdWYWx1ZSApO1xuXHRcdFx0XHRcdHNlbGYuX2Nsb3NlUGFuZWwoKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIG5ld1ZhbHVlID0gSlNPTi5zdHJpbmdpZnkoIHtcblx0XHRcdFx0XHRsaWJyYXJ5OiBsaWJyYXJ5LFxuXHRcdFx0XHRcdHZhbHVlOiBpY29uQ2xhc3Ncblx0XHRcdFx0fSApO1xuXG5cdFx0XHRcdHNlbGYudWkuaW5wdXQudmFsKCBuZXdWYWx1ZSApLnRyaWdnZXIoICdpbnB1dCcgKTtcblx0XHRcdFx0c2VsZi5zZXRWYWx1ZSggbmV3VmFsdWUgKTtcblx0XHRcdFx0c2VsZi5fY2xvc2VQYW5lbCgpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRfZmV0Y2hTdmc6IGZ1bmN0aW9uKCBsaWJyYXJ5LCBzdHlsZSwgbmFtZSwgY2FsbGJhY2sgKSB7XG5cdFx0dmFyIGNhY2hlS2V5ID0gbGlicmFyeSArICcvJyArIHN0eWxlICsgJy8nICsgbmFtZTtcblxuXHRcdGlmICggX3N2Z0NhY2hlWyBjYWNoZUtleSBdICkge1xuXHRcdFx0Y2FsbGJhY2soIF9zdmdDYWNoZVsgY2FjaGVLZXkgXSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBtYW5pZmVzdCA9IF9tYW5pZmVzdENhY2hlWyBsaWJyYXJ5IF07XG5cdFx0aWYgKCAhIG1hbmlmZXN0IHx8ICEgbWFuaWZlc3QuY2RuU3ZnQmFzZSApIHtcblx0XHRcdGNhbGxiYWNrKCAnJyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEJ1aWxkIFNWRyBVUkwgYmFzZWQgb24gbGlicmFyeSB0eXBlXG5cdFx0dmFyIHN2Z1VybDtcblx0XHRpZiAoIGxpYnJhcnkgPT09ICdiaScgKSB7XG5cdFx0XHQvLyBCb290c3RyYXAgSWNvbnM6IG5vIHN0eWxlIHN1YmZvbGRlclxuXHRcdFx0c3ZnVXJsID0gbWFuaWZlc3QuY2RuU3ZnQmFzZSArICcvJyArIG5hbWUgKyAnLnN2Zyc7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEZBICYgUGhvc3Bob3I6IHN0eWxlIHN1YmZvbGRlclxuXHRcdFx0c3ZnVXJsID0gbWFuaWZlc3QuY2RuU3ZnQmFzZSArICcvJyArIHN0eWxlICsgJy8nICsgbmFtZSArICcuc3ZnJztcblx0XHR9XG5cblx0XHRCYWNrYm9uZS4kLmdldCggc3ZnVXJsIClcblx0XHRcdC5kb25lKCBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRcdFx0dmFyIHN2Zztcblx0XHRcdFx0aWYgKCB0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRcdFx0c3ZnID0gZGF0YTtcblx0XHRcdFx0fSBlbHNlIGlmICggZGF0YSAmJiBkYXRhLmRvY3VtZW50RWxlbWVudCApIHtcblx0XHRcdFx0XHRzdmcgPSBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKCBkYXRhLmRvY3VtZW50RWxlbWVudCApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN2ZyA9ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF9zdmdDYWNoZVsgY2FjaGVLZXkgXSA9IHN2Zztcblx0XHRcdFx0Y2FsbGJhY2soIHN2ZyApO1xuXHRcdFx0fSApXG5cdFx0XHQuZmFpbCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhbGxiYWNrKCAnJyApO1xuXHRcdFx0fSApO1xuXHR9LFxuXG5cdF9zYXZlU3ZnVG9EaXNrOiBmdW5jdGlvbiggbGlicmFyeSwgc3R5bGUsIG5hbWUsIHN2ZywgY2FsbGJhY2sgKSB7XG5cdFx0dmFyIGNhY2hlS2V5ID0gbGlicmFyeSArICcvJyArIHN0eWxlICsgJy8nICsgbmFtZTtcblxuXHRcdC8vIEFscmVhZHkgc2F2ZWQgaW4gdGhpcyBzZXNzaW9uXG5cdFx0aWYgKCBfc3ZnQ2FjaGVbICdfX3NhdmVkX18nICsgY2FjaGVLZXkgXSApIHtcblx0XHRcdGNhbGxiYWNrKCBjYWNoZUtleSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdTYXZlU3ZnSWNvbicsIHtcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0bGlicmFyeTogbGlicmFyeSxcblx0XHRcdFx0c3R5bGU6IHN0eWxlLFxuXHRcdFx0XHRuYW1lOiBuYW1lLFxuXHRcdFx0XHRzdmc6IHN2Z1xuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRfc3ZnQ2FjaGVbICdfX3NhdmVkX18nICsgY2FjaGVLZXkgXSA9IHRydWU7XG5cdFx0XHRcdGNhbGxiYWNrKCBkYXRhICYmIGRhdGEuc3ZnS2V5ID8gZGF0YS5zdmdLZXkgOiBjYWNoZUtleSApO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gRmFsbGJhY2s6IHVzZSB0aGUgY29tcHV0ZWQga2V5IGV2ZW4gaWYgc2F2ZSBmYWlsZWRcblx0XHRcdFx0Y2FsbGJhY2soIGNhY2hlS2V5ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdC8vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXHQvLyBDbGVhclxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuXHRvbkNsZWFySWNvbjogZnVuY3Rpb24oIGUgKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR0aGlzLnVpLmlucHV0LnZhbCggJycgKS50cmlnZ2VyKCAnaW5wdXQnICk7XG5cdFx0dGhpcy5zZXRWYWx1ZSggJycgKTtcblx0XHR0aGlzLnVpLnByZXZpZXdJY29uLmVtcHR5KCk7XG5cdFx0dGhpcy51aS5wcmV2aWV3TGFiZWwudGV4dChcblx0XHRcdHRoaXMuJCggJy5lbGVtZW50b3ItaWNvbi1waWNrZXItcHJldmlldy1sYWJlbCcgKS5maXJzdCgpLmRhdGEoICdkZWZhdWx0JyApIHx8ICdTZWxlY3QgSWNvbidcblx0XHQpO1xuXHRcdHRoaXMudWkuY2xlYXJCdG4uaGlkZSgpO1xuXHRcdHRoaXMudWkuZ3JpZC5maW5kKCAnLnNlbGVjdGVkJyApLnJlbW92ZUNsYXNzKCAnc2VsZWN0ZWQnICk7XG5cdH0sXG5cblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cdC8vIFZhbHVlIG1hbmFnZW1lbnRcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0c2V0VmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR0aGlzLnNldFNldHRpbmdzTW9kZWwoIHZhbHVlICk7XG5cdH0sXG5cblx0YXBwbHlTYXZlZFZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSgpO1xuXHRcdHRoaXMuJCggJ2lucHV0W2RhdGEtc2V0dGluZ10nICkudmFsKCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSggdmFsdWUgKSApO1xuXHRcdHRoaXMuX3Jlc3RvcmVQcmV2aWV3KCk7XG5cdH0sXG5cblx0X3Jlc3RvcmVQcmV2aWV3OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSgpO1xuXHRcdGlmICggISB2YWx1ZSApIHtcblx0XHRcdHRoaXMudWkuY2xlYXJCdG4uaGlkZSgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBpY29uQ2xhc3MgPSB0aGlzLl9nZXRDdXJyZW50SWNvbkNsYXNzKCk7XG5cdFx0aWYgKCBpY29uQ2xhc3MgKSB7XG5cdFx0XHR0aGlzLl91cGRhdGVQcmV2aWV3KCBpY29uQ2xhc3MsIGljb25DbGFzcy5yZXBsYWNlKCAvXihmYS1cXHcrXFxzK2ZhLXxiaVxccytiaS18cGhcXHMrcGgtKS8sICcnICkgKTtcblx0XHR9XG5cdH0sXG5cblx0X2dldEN1cnJlbnRJY29uQ2xhc3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2YWx1ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCk7XG5cdFx0aWYgKCAhIHZhbHVlICkge1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblxuXHRcdGlmICggdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZS52YWx1ZSApIHtcblx0XHRcdHJldHVybiB2YWx1ZS52YWx1ZTtcblx0XHR9XG5cblx0XHRpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZSggdmFsdWUgKTtcblx0XHRcdFx0aWYgKCBwYXJzZWQgJiYgcGFyc2VkLnZhbHVlICkge1xuXHRcdFx0XHRcdHJldHVybiBwYXJzZWQudmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKCBlICkge1xuXHRcdFx0XHQvLyBMZWdhY3kgc3RyaW5nIHZhbHVlXG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gJyc7XG5cdH0sXG5cblx0X3VwZGF0ZVByZXZpZXc6IGZ1bmN0aW9uKCBpY29uQ2xhc3MsIGxhYmVsICkge1xuXHRcdHRoaXMudWkucHJldmlld0ljb24uaHRtbCggJzxpIGNsYXNzPVwiJyArIGljb25DbGFzcyArICdcIj48L2k+JyApO1xuXHRcdHRoaXMudWkucHJldmlld0xhYmVsLnRleHQoIGxhYmVsICk7XG5cdFx0dGhpcy51aS5jbGVhckJ0bi5zaG93KCk7XG5cdH0sXG5cblx0Z2V0RmllbGRUaXRsZVZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaWNvbkNsYXNzID0gdGhpcy5fZ2V0Q3VycmVudEljb25DbGFzcygpO1xuXHRcdHJldHVybiBpY29uQ2xhc3MgPyBpY29uQ2xhc3MucmVwbGFjZSggL14oZmEtXFx3K1xccytmYS18YmlcXHMrYmktfHBoXFxzK3BoLSkvLCAnJyApIDogJyc7XG5cdH0sXG5cblx0b25CZWZvcmVEZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLmdyaWQub2ZmKCAnc2Nyb2xsJyApO1xuXHRcdEJhY2tib25lLiQoIGRvY3VtZW50ICkub2ZmKCAnY2xpY2suaWNvblBpY2tlcicgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xJY29uSXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbE11bHRpcGxlQmFzZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlLW11bHRpcGxlJyApLFxuXHRDb250cm9sSW1hZ2VEaW1lbnNpb25zSXRlbVZpZXc7XG5cbkNvbnRyb2xJbWFnZURpbWVuc2lvbnNJdGVtVmlldyA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpbnB1dFdpZHRoOiAnaW5wdXRbZGF0YS1zZXR0aW5nPVwid2lkdGhcIl0nLFxuXHRcdFx0aW5wdXRIZWlnaHQ6ICdpbnB1dFtkYXRhLXNldHRpbmc9XCJoZWlnaHRcIl0nLFxuXG5cdFx0XHRidG5BcHBseTogJ2J1dHRvbi5lbGVtZW50b3ItaW1hZ2UtZGltZW5zaW9ucy1hcHBseS1idXR0b24nXG5cdFx0fTtcblx0fSxcblxuXHQvLyBPdmVycmlkZSB0aGUgYmFzZSBldmVudHNcblx0YmFzZUV2ZW50czoge1xuXHRcdCdjbGljayBAdWkuYnRuQXBwbHknOiAnb25BcHBseUNsaWNrZWQnXG5cdH0sXG5cblx0b25BcHBseUNsaWNrZWQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy5zZXRWYWx1ZSgge1xuXHRcdFx0d2lkdGg6IHRoaXMudWkuaW5wdXRXaWR0aC52YWwoKSxcblx0XHRcdGhlaWdodDogdGhpcy51aS5pbnB1dEhlaWdodC52YWwoKVxuXHRcdH0gKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xJbWFnZURpbWVuc2lvbnNJdGVtVmlldztcbiIsInZhciBDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UtbXVsdGlwbGUnICksXG5cdENvbnRyb2xNZWRpYUl0ZW1WaWV3O1xuXG5Db250cm9sTWVkaWFJdGVtVmlldyA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuY29udHJvbE1lZGlhID0gJy5lbGVtZW50b3ItY29udHJvbC1tZWRpYSc7XG5cdFx0dWkuZnJhbWVPcGVuZXJzID0gJy5lbGVtZW50b3ItY29udHJvbC1tZWRpYS11cGxvYWQtYnV0dG9uLCAuZWxlbWVudG9yLWNvbnRyb2wtbWVkaWEtaW1hZ2UnO1xuXHRcdHVpLmRlbGV0ZUJ1dHRvbiA9ICcuZWxlbWVudG9yLWNvbnRyb2wtbWVkaWEtZGVsZXRlJztcblx0XHR1aS5maWxlRmllbGQgPSAnLmVsZW1lbnRvci1jb250cm9sLW1lZGlhLWZpZWxkJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdjbGljayBAdWkuZnJhbWVPcGVuZXJzJzogJ29wZW5GcmFtZScsXG5cdFx0J2NsaWNrIEB1aS5kZWxldGVCdXR0b24nOiAnZGVsZXRlSW1hZ2UnLFxuXHRcdCdpbnB1dCBAdWkuZmlsZUZpZWxkJzogJ3NlbGVjdCdcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIF8uaXNFbXB0eSggdGhpcy5nZXRDb250cm9sVmFsdWUoICd1cmwnICkgKSApIHtcblx0XHRcdHRoaXMudWkuY29udHJvbE1lZGlhLmFkZENsYXNzKCAnbWVkaWEtZW1wdHknICk7XG5cdFx0fSBlbHNle1xuXHRcdFx0dmFyIGF0dGFjaG1lbnQgPSB0aGlzLnVpLmZpbGVGaWVsZC52YWwoKTtcblxuXHRcdFx0aWYgKCBhdHRhY2htZW50KSB7XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0XHRcdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgd2lkdGggPSB0aGlzLndpZHRoO1xuXHRcdFx0XHRcdHZhciAgaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG5cdFx0XHRcdFx0c2VsZi5zZXRWYWx1ZSgge1xuXHRcdFx0XHRcdFx0dXJsOiBhdHRhY2htZW50LFxuXHRcdFx0XHRcdFx0aWQ6IDEsXG5cdFx0XHRcdFx0XHR3aWR0aDogd2lkdGgsXG5cdFx0XHRcdFx0XHRoZWlnaHQ6IGhlaWdodCxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0aW1nLnNyYyA9IGF0dGFjaG1lbnQ7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdG9wZW5GcmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0b3BlblBzRmlsZU1hbmFnZXIoJ2VsZW1lbnRvci1jb250cm9sLW1lZGlhLWZpZWxkLScgKyB0aGlzLm1vZGVsLmNpZCwgMSk7XG5cdH0sXG5cblx0ZGVsZXRlSW1hZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0VmFsdWUoIHtcblx0XHRcdHVybDogJycsXG5cdFx0XHR3aWR0aDogJycsXG5cdFx0XHRoZWlnaHQ6ICcnLFxuXHRcdFx0aWQ6ICcnXG5cdFx0fSApO1xuXG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblxuXHRzZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhdHRhY2htZW50ID0gdGhpcy51aS5maWxlRmllbGQudmFsKCk7XG5cblx0XHRpZiAoIGF0dGFjaG1lbnQpIHtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgd2lkdGggPSB0aGlzLndpZHRoO1xuXHRcdFx0XHR2YXIgIGhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuXHRcdFx0XHRzZWxmLnNldFZhbHVlKCB7XG5cdFx0XHRcdFx0dXJsOiBhdHRhY2htZW50LFxuXHRcdFx0XHRcdGlkOiAxLFxuXHRcdFx0XHRcdHdpZHRoOiB3aWR0aCxcblx0XHRcdFx0XHRoZWlnaHQ6IGhlaWdodCxcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHNlbGYucmVuZGVyKCk7XG5cdFx0XHRcdHNlbGYudWkuZmlsZUZpZWxkLnZhbChhdHRhY2htZW50KTtcblx0XHRcdH07XG5cblx0XHRcdGltZy5zcmMgPSBhdHRhY2htZW50O1xuXHRcdH1cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbE1lZGlhSXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VWaWV3ID0gcmVxdWlyZSggJy4vYmFzZScgKTtcblxudmFyIENvbnRyb2xQb3BvdmVyVG9nZ2xlVmlldyA9IENvbnRyb2xCYXNlVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xCYXNlVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkudG9nZ2xlQnV0dG9uID0gJy5lbGVtZW50b3ItY29udHJvbC1wb3BvdmVyLXRvZ2dsZS10b2dnbGUnO1xuXHRcdHVpLnRvZ2dsZUJ1dHRvbkxhYmVsID0gJy5lbGVtZW50b3ItY29udHJvbC1wb3BvdmVyLXRvZ2dsZS10b2dnbGUtbGFiZWwnO1xuXHRcdHVpLnJlc2V0QnV0dG9uID0gJy5lbGVtZW50b3ItY29udHJvbC1wb3BvdmVyLXRvZ2dsZS1yZXNldC1sYWJlbCc7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0ZXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5leHRlbmQoIENvbnRyb2xCYXNlVmlldy5wcm90b3R5cGUuZXZlbnRzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKSwge1xuXHRcdFx0J2NoYW5nZSBAdWkudG9nZ2xlQnV0dG9uJzogJ29uVG9nZ2xlQ2hhbmdlJyxcblx0XHRcdCdjbGljayBAdWkudG9nZ2xlQnV0dG9uTGFiZWwnOiAnb25Ub2dnbGVMYWJlbENsaWNrJyxcblx0XHRcdCdjbGljayBAdWkucmVzZXRCdXR0b24nOiAnb25SZXNldENsaWNrJ1xuXHRcdH0gKTtcblx0fSxcblxuXHRvblRvZ2dsZUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZhbHVlID0gdGhpcy51aS50b2dnbGVCdXR0b24uZmlsdGVyKCAnOmNoZWNrZWQnICkudmFsKCk7XG5cdFx0dGhpcy5zZXRWYWx1ZSggdmFsdWUgKTtcblx0XHR0aGlzLnRvZ2dsZVBvcG92ZXIoICEhIHZhbHVlICk7XG5cblx0XHRjb25zb2xlLmxvZyggJ1BvcG92ZXIgdG9nZ2xlIGNoYW5nZWQgdG8gdmFsdWU6JywgdmFsdWUgKTtcblx0fSxcblxuXHRvblRvZ2dsZUxhYmVsQ2xpY2s6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRjb25zdCAkcG9wb3ZlciA9IHRoaXMuJGVsLm5leHQoJy5lbGVtZW50b3ItY29udHJvbHMtcG9wb3ZlcicpO1xuXHRcdHRoaXMudG9nZ2xlUG9wb3ZlciggISRwb3BvdmVyLmhhc0NsYXNzKCAnZWxlbWVudG9yLW9wZW4nICkgKTtcblxuXHRcdGNvbnNvbGUubG9nKCAnUG9wb3ZlciB0b2dnbGVkIHZpYSBsYWJlbCBjbGljay4nICk7XG5cdH0sXG5cblx0b25SZXNldENsaWNrOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnJlc2V0UG9wb3ZlckNvbnRyb2xzKCk7XG5cdH0sXG5cblx0dG9nZ2xlUG9wb3ZlcjogZnVuY3Rpb24oIHNob3cgKSB7XG5cdFx0Y29uc3QgJHBvcG92ZXIgPSB0aGlzLiRlbC5uZXh0KCcuZWxlbWVudG9yLWNvbnRyb2xzLXBvcG92ZXInKTtcblx0XHRjb25zb2xlLmxvZyggdGhpcy4kZWwsICRwb3BvdmVyICk7XG5cblx0XHRpZiAoICEgJHBvcG92ZXIubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdCRwb3BvdmVyLnRvZ2dsZUNsYXNzKCAnZWxlbWVudG9yLW9wZW4nLCBzaG93ICk7XG5cblx0XHQvLyBNYW5hZ2Ugb3V0c2lkZSBjbGljayBsaXN0ZW5lclxuXHRcdGlmICggc2hvdyApIHtcblx0XHRcdHRoaXMuYWRkT3V0c2lkZUNsaWNrTGlzdGVuZXIoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5yZW1vdmVPdXRzaWRlQ2xpY2tMaXN0ZW5lcigpO1xuXHRcdH1cblx0fSxcblxuXHRhZGRPdXRzaWRlQ2xpY2tMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0Ly8gQXZvaWQgZHVwbGljYXRlc1xuXHRcdHRoaXMucmVtb3ZlT3V0c2lkZUNsaWNrTGlzdGVuZXIoKTtcblxuXHRcdHRoaXMub3V0c2lkZUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciAkdGFyZ2V0ID0gQmFja2JvbmUuJCggZXZlbnQudGFyZ2V0ICksXG5cdFx0XHRcdCRwb3BvdmVyID0gc2VsZi4kZWwubmV4dCggJy5lbGVtZW50b3ItY29udHJvbHMtcG9wb3ZlcicgKTtcblxuXHRcdFx0Ly8gSWYgY2xpY2sgaXMgbm90IG9uIHRvZ2dsZSBjb250cm9sIGFuZCBub3QgaW5zaWRlIHBvcG92ZXJcblx0XHRcdGlmICggISAkdGFyZ2V0LmNsb3Nlc3QoIHNlbGYuJGVsICkubGVuZ3RoICYmXG5cdFx0XHRcdCAhICR0YXJnZXQuY2xvc2VzdCggJHBvcG92ZXIgKS5sZW5ndGggKSB7XG5cdFx0XHRcdC8vIENsb3NlIHRoZSBwb3BvdmVyXG5cdFx0XHRcdHNlbGYudG9nZ2xlUG9wb3ZlciggZmFsc2UgKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gVXNlIG5hbWVzcGFjZWQgZXZlbnQgdG8gYXZvaWQgY29uZmxpY3RzXG5cdFx0QmFja2JvbmUuJCggZG9jdW1lbnQgKS5vbiggJ2NsaWNrLnBvcG92ZXJUb2dnbGUnICsgdGhpcy5jaWQsIHRoaXMub3V0c2lkZUNsaWNrSGFuZGxlciApO1xuXHR9LFxuXG5cdHJlbW92ZU91dHNpZGVDbGlja0xpc3RlbmVyOiBmdW5jdGlvbigpIHtcblx0XHRCYWNrYm9uZS4kKCBkb2N1bWVudCApLm9mZiggJ2NsaWNrLnBvcG92ZXJUb2dnbGUnICsgdGhpcy5jaWQgKTtcblx0fSxcblxuXHRvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVtb3ZlT3V0c2lkZUNsaWNrTGlzdGVuZXIoKTtcblx0fSxcblxuXHRyZXNldFBvcG92ZXJDb250cm9sczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRWYWx1ZSggJycgKTtcblx0XHR0aGlzLnVpLnRvZ2dsZUJ1dHRvbi5maWx0ZXIoICdbdmFsdWU9XCJcIl0nICkucHJvcCggJ2NoZWNrZWQnLCB0cnVlICk7XG5cdFx0dGhpcy51aS50b2dnbGVCdXR0b24uZmlsdGVyKCAnW3ZhbHVlIT1cIlwiXScgKS5wcm9wKCAnY2hlY2tlZCcsIGZhbHNlICk7XG5cdFx0dGhpcy50b2dnbGVQb3BvdmVyKCBmYWxzZSApO1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRvZ2dsZVBvcG92ZXIoIGZhbHNlICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sUG9wb3ZlclRvZ2dsZVZpZXc7IiwidmFyIFJlcGVhdGVyUm93VmlldztcblxuUmVwZWF0ZXJSb3dWaWV3ID0gTWFyaW9uZXR0ZS5Db21wb3NpdGVWaWV3LmV4dGVuZCgge1xuXHR0ZW1wbGF0ZTogTWFyaW9uZXR0ZS5UZW1wbGF0ZUNhY2hlLmdldCggJyN0bXBsLWVsZW1lbnRvci1yZXBlYXRlci1yb3cnICksXG5cblx0Y2xhc3NOYW1lOiAncmVwZWF0ZXItZmllbGRzJyxcblxuXHR1aToge1xuXHRcdGR1cGxpY2F0ZUJ1dHRvbjogJy5lbGVtZW50b3ItcmVwZWF0ZXItdG9vbC1kdXBsaWNhdGUnLFxuXHRcdGVkaXRCdXR0b246ICcuZWxlbWVudG9yLXJlcGVhdGVyLXRvb2wtZWRpdCcsXG5cdFx0cmVtb3ZlQnV0dG9uOiAnLmVsZW1lbnRvci1yZXBlYXRlci10b29sLXJlbW92ZScsXG5cdFx0aXRlbVRpdGxlOiAnLmVsZW1lbnRvci1yZXBlYXRlci1yb3ctaXRlbS10aXRsZSdcblx0fSxcblxuXHR0cmlnZ2Vyczoge1xuXHRcdCdjbGljayBAdWkucmVtb3ZlQnV0dG9uJzogJ2NsaWNrOnJlbW92ZScsXG5cdFx0J2NsaWNrIEB1aS5kdXBsaWNhdGVCdXR0b24nOiAnY2xpY2s6ZHVwbGljYXRlJyxcblx0XHQnY2xpY2sgQHVpLml0ZW1UaXRsZSc6ICdjbGljazplZGl0J1xuXHR9LFxuXG5cdHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGl0ZW1JbmRleDogdGhpcy5nZXRPcHRpb24oICdpdGVtSW5kZXgnIClcblx0XHR9O1xuXHR9LFxuXG5cdGNoaWxkVmlld0NvbnRhaW5lcjogJy5lbGVtZW50b3ItcmVwZWF0ZXItcm93LWNvbnRyb2xzJyxcblxuXHRnZXRDaGlsZFZpZXc6IGZ1bmN0aW9uKCBpdGVtICkge1xuXHRcdHZhciBjb250cm9sVHlwZSA9IGl0ZW0uZ2V0KCAndHlwZScgKTtcblx0XHRyZXR1cm4gZWxlbWVudG9yLmdldENvbnRyb2xJdGVtVmlldyggY29udHJvbFR5cGUgKTtcblx0fSxcblxuXHRjaGlsZFZpZXdPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZWxlbWVudFNldHRpbmdzTW9kZWw6IHRoaXMubW9kZWxcblx0XHR9O1xuXHR9LFxuXG5cdHVwZGF0ZUluZGV4OiBmdW5jdGlvbiggbmV3SW5kZXggKSB7XG5cdFx0dGhpcy5pdGVtSW5kZXggPSBuZXdJbmRleDtcblx0XHR0aGlzLnNldFRpdGxlKCk7XG5cdH0sXG5cblx0c2V0VGl0bGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0aXRsZUZpZWxkID0gdGhpcy5nZXRPcHRpb24oICd0aXRsZUZpZWxkJyApLFxuXHRcdFx0dGl0bGU7XG5cblx0XHRpZiAoIHRpdGxlRmllbGQgKSB7XG5cdFx0XHR2YXIgY2hhbmdlckNvbnRyb2xNb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5maW5kKCB7IG5hbWU6IHRpdGxlRmllbGQgfSApLFxuXHRcdFx0XHRjaGFuZ2VyQ29udHJvbFZpZXcgPSB0aGlzLmNoaWxkcmVuLmZpbmRCeU1vZGVsQ2lkKCBjaGFuZ2VyQ29udHJvbE1vZGVsLmNpZCApO1xuXG5cdFx0XHR0aXRsZSA9IGNoYW5nZXJDb250cm9sVmlldy5nZXRGaWVsZFRpdGxlVmFsdWUoKTtcblx0XHR9XG5cblx0XHRpZiAoICEgdGl0bGUgKSB7XG5cdFx0XHR0aXRsZSA9IGVsZW1lbnRvci50cmFuc2xhdGUoICdJdGVtICN7MH0nLCBbIHRoaXMuZ2V0T3B0aW9uKCAnaXRlbUluZGV4JyApIF0gKTtcblx0XHR9XG5cblx0XHR0aGlzLnVpLml0ZW1UaXRsZS50ZXh0KCB0aXRsZSApO1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdHRoaXMuZWxlbWVudFNldHRpbmdzTW9kZWwgPSBvcHRpb25zLmVsZW1lbnRTZXR0aW5nc01vZGVsO1xuXG5cdFx0dGhpcy5pdGVtSW5kZXggPSAwO1xuXG5cdFx0Ly8gQ29sbGVjdGlvbiBmb3IgQ29udHJvbHMgbGlzdFxuXHRcdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBCYWNrYm9uZS5Db2xsZWN0aW9uKCBvcHRpb25zLmNvbnRyb2xGaWVsZHMgKTtcblxuXHRcdGlmICggb3B0aW9ucy50aXRsZUZpZWxkICkge1xuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2NoYW5nZTonICsgb3B0aW9ucy50aXRsZUZpZWxkLCB0aGlzLnNldFRpdGxlICk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNldFRpdGxlKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXBlYXRlclJvd1ZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZScgKSxcblx0UmVwZWF0ZXJSb3dWaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9yZXBlYXRlci1yb3cnICksXG5cdENvbnRyb2xSZXBlYXRlckl0ZW1WaWV3O1xuXG5Db250cm9sUmVwZWF0ZXJJdGVtVmlldyA9IENvbnRyb2xCYXNlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiB7XG5cdFx0YnRuQWRkUm93OiAnLmVsZW1lbnRvci1yZXBlYXRlci1hZGQnLFxuXHRcdGZpZWxkQ29udGFpbmVyOiAnLmVsZW1lbnRvci1yZXBlYXRlci1maWVsZHMnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5idG5BZGRSb3cnOiAnb25CdXR0b25BZGRSb3dDbGljaycsXG5cdFx0J3NvcnRzdGFydCBAdWkuZmllbGRDb250YWluZXInOiAnb25Tb3J0U3RhcnQnLFxuXHRcdCdzb3J0dXBkYXRlIEB1aS5maWVsZENvbnRhaW5lcic6ICdvblNvcnRVcGRhdGUnXG5cdH0sXG5cblx0Y2hpbGRWaWV3OiBSZXBlYXRlclJvd1ZpZXcsXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnLmVsZW1lbnRvci1yZXBlYXRlci1maWVsZHMnLFxuXG5cdHRlbXBsYXRlSGVscGVyczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRhdGE6IF8uZXh0ZW5kKCB7fSwgdGhpcy5tb2RlbC50b0pTT04oKSwgeyBjb250cm9sVmFsdWU6IFtdIH0gKVxuXHRcdH07XG5cdH0sXG5cblx0Y2hpbGRWaWV3T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbnRyb2xGaWVsZHM6IHRoaXMubW9kZWwuZ2V0KCAnZmllbGRzJyApLFxuXHRcdFx0dGl0bGVGaWVsZDogdGhpcy5tb2RlbC5nZXQoICd0aXRsZV9maWVsZCcgKVxuXHRcdH07XG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0Q29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHR0aGlzLmNvbGxlY3Rpb24gPSB0aGlzLmVsZW1lbnRTZXR0aW5nc01vZGVsLmdldCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICk7XG5cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmNvbGxlY3Rpb24sICdjaGFuZ2UgYWRkIHJlbW92ZSByZXNldCcsIHRoaXMub25Db2xsZWN0aW9uQ2hhbmdlZCwgdGhpcyApO1xuXHR9LFxuXG5cdGVkaXRSb3c6IGZ1bmN0aW9uKCByb3dWaWV3ICkge1xuXHRcdGlmICggdGhpcy5jdXJyZW50RWRpdGFibGVDaGlsZCApIHtcblx0XHRcdHRoaXMuY3VycmVudEVkaXRhYmxlQ2hpbGQuZ2V0Q2hpbGRWaWV3Q29udGFpbmVyKCB0aGlzLmN1cnJlbnRFZGl0YWJsZUNoaWxkICkucmVtb3ZlQ2xhc3MoICdlZGl0YWJsZScgKTtcblxuXHRcdFx0dmFyIHNvcnRlZFJvd1ZpZXcgPSB0aGlzLmN1cnJlbnRFZGl0YWJsZUNoaWxkLFxuXHRcdFx0XHRyb3dDb250cm9scyA9IHNvcnRlZFJvd1ZpZXcuY2hpbGRyZW4uX3ZpZXdzO1xuXG5cdFx0XHRqUXVlcnkuZWFjaCggcm93Q29udHJvbHMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAoICd3eXNpd3lnJyA9PT0gdGhpcy5tb2RlbC5nZXQoICd0eXBlJyApICkge1xuXHRcdFx0XHRcdHRpbnltY2UuRWRpdG9yTWFuYWdlci5leGVjQ29tbWFuZCggJ21jZVJlbW92ZUVkaXRvcicsIHRydWUsIHRoaXMuZWRpdG9ySUQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cblx0XHRpZiAoIHRoaXMuY3VycmVudEVkaXRhYmxlQ2hpbGQgPT09IHJvd1ZpZXcgKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jdXJyZW50RWRpdGFibGVDaGlsZDtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyb3dWaWV3LmdldENoaWxkVmlld0NvbnRhaW5lciggcm93VmlldyApLmFkZENsYXNzKCAnZWRpdGFibGUnICk7XG5cblx0XHR0aGlzLmN1cnJlbnRFZGl0YWJsZUNoaWxkID0gcm93VmlldztcblxuXG5cdFx0dmFyIHNvcnRlZFJvd1ZpZXcgPSB0aGlzLmN1cnJlbnRFZGl0YWJsZUNoaWxkLFxuXHRcdFx0cm93Q29udHJvbHMgPSBzb3J0ZWRSb3dWaWV3LmNoaWxkcmVuLl92aWV3cztcblxuXHRcdGpRdWVyeS5lYWNoKCByb3dDb250cm9scywgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICd3eXNpd3lnJyA9PT0gdGhpcy5tb2RlbC5nZXQoICd0eXBlJyApICkge1xuXHRcdFx0XHR0aW55bWNlLkVkaXRvck1hbmFnZXIuZXhlY0NvbW1hbmQoICdtY2VSZW1vdmVFZGl0b3InLCB0cnVlLCB0aGlzLmVkaXRvcklEKTtcblx0XHRcdFx0dGlueW1jZS5FZGl0b3JNYW5hZ2VyLmV4ZWNDb21tYW5kKCdtY2VBZGRFZGl0b3InLCBmYWxzZSwgdGhpcy5lZGl0b3JJRCk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0dGhpcy51cGRhdGVBY3RpdmVSb3coKTtcblx0fSxcblxuXHR0b2dnbGVNaW5Sb3dzQ2xhc3M6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB0aGlzLm1vZGVsLmdldCggJ3ByZXZlbnRfZW1wdHknICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy4kZWwudG9nZ2xlQ2xhc3MoICdlbGVtZW50b3ItcmVwZWF0ZXItaGFzLW1pbmltdW0tcm93cycsIDEgPj0gdGhpcy5jb2xsZWN0aW9uLmxlbmd0aCApO1xuXHR9LFxuXG5cdHVwZGF0ZUFjdGl2ZVJvdzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGl2ZUl0ZW1JbmRleCA9IDA7XG5cblxuXHRcdGlmICggdGhpcy5jdXJyZW50RWRpdGFibGVDaGlsZCApIHtcblx0XHRcdGFjdGl2ZUl0ZW1JbmRleCA9IHRoaXMuY3VycmVudEVkaXRhYmxlQ2hpbGQuaXRlbUluZGV4O1xuXHRcdH1cblxuXHRcdHRoaXMuc2V0RWRpdFNldHRpbmcoICdhY3RpdmVJdGVtSW5kZXgnLCBhY3RpdmVJdGVtSW5kZXggKTtcblx0fSxcblxuXHR1cGRhdGVDaGlsZEluZGV4ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY2hpbGRyZW4uZWFjaCggXy5iaW5kKCBmdW5jdGlvbiggdmlldyApIHtcblx0XHRcdHZpZXcudXBkYXRlSW5kZXgoIHRoaXMuY29sbGVjdGlvbi5pbmRleE9mKCB2aWV3Lm1vZGVsICkgKyAxICk7XG5cdFx0fSwgdGhpcyApICk7XG5cdH0sXG5cblx0b25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudWkuZmllbGRDb250YWluZXIuc29ydGFibGUoIHsgYXhpczogJ3knIH0gKTtcblxuXHRcdHRoaXMudG9nZ2xlTWluUm93c0NsYXNzKCk7XG5cdH0sXG5cblx0b25Tb3J0U3RhcnQ6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0dWkuaXRlbS5kYXRhKCAnb2xkSW5kZXgnLCB1aS5pdGVtLmluZGV4KCkgKTtcblx0fSxcblxuXHRvblNvcnRVcGRhdGU6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cdFx0dmFyIG9sZEluZGV4ID0gdWkuaXRlbS5kYXRhKCAnb2xkSW5kZXgnICksXG5cdFx0XHRtb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5hdCggb2xkSW5kZXggKSxcblx0XHRcdG5ld0luZGV4ID0gdWkuaXRlbS5pbmRleCgpO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLnJlbW92ZSggbW9kZWwgKTtcblx0XHR0aGlzLmNvbGxlY3Rpb24uYWRkKCBtb2RlbCwgeyBhdDogbmV3SW5kZXggfSApO1xuXHR9LFxuXG5cdG9uQWRkQ2hpbGQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlQ2hpbGRJbmRleGVzKCk7XG5cdFx0dGhpcy51cGRhdGVBY3RpdmVSb3coKTtcblx0fSxcblxuXHRvblJlbW92ZUNoaWxkOiBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdGlmICggY2hpbGRWaWV3ID09PSB0aGlzLmN1cnJlbnRFZGl0YWJsZUNoaWxkICkge1xuXHRcdFx0ZGVsZXRlIHRoaXMuY3VycmVudEVkaXRhYmxlQ2hpbGQ7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVDaGlsZEluZGV4ZXMoKTtcblx0XHR0aGlzLnVwZGF0ZUFjdGl2ZVJvdygpO1xuXHR9LFxuXG5cdG9uQ29sbGVjdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZWxlbWVudFNldHRpbmdzTW9kZWwudHJpZ2dlciggJ2NoYW5nZScgKTtcblxuXHRcdHRoaXMudG9nZ2xlTWluUm93c0NsYXNzKCk7XG5cdH0sXG5cblx0b25CdXR0b25BZGRSb3dDbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRlZmF1bHRzID0ge307XG5cdFx0Xy5lYWNoKCB0aGlzLm1vZGVsLmdldCggJ2ZpZWxkcycgKSwgZnVuY3Rpb24oIGZpZWxkICkge1xuXHRcdFx0ZGVmYXVsdHNbIGZpZWxkLm5hbWUgXSA9IGZpZWxkWydkZWZhdWx0J107XG5cdFx0fSApO1xuXG5cdFx0dmFyIG5ld01vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmFkZCggZGVmYXVsdHMgKSxcblx0XHRcdG5ld0NoaWxkVmlldyA9IHRoaXMuY2hpbGRyZW4uZmluZEJ5TW9kZWwoIG5ld01vZGVsICk7XG5cblx0XHR0aGlzLmVkaXRSb3coIG5ld0NoaWxkVmlldyApO1xuXHR9LFxuXG5cdG9uQ2hpbGR2aWV3Q2xpY2tSZW1vdmU6IGZ1bmN0aW9uKCBjaGlsZFZpZXcgKSB7XG5cdFx0Y2hpbGRWaWV3Lm1vZGVsLmRlc3Ryb3koKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld0NsaWNrRHVwbGljYXRlOiBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdHRoaXMuY29sbGVjdGlvbi5hZGQoIGNoaWxkVmlldy5tb2RlbC5jbG9uZSgpLCB7IGF0OiBjaGlsZFZpZXcuaXRlbUluZGV4IH0gKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld0NsaWNrRWRpdDogZnVuY3Rpb24oIGNoaWxkVmlldyApIHtcblx0XHR0aGlzLmVkaXRSb3coIGNoaWxkVmlldyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbFJlcGVhdGVySXRlbVZpZXc7XG4iLCJ2YXIgQ29udHJvbEJhc2VJdGVtVmlldyA9IHJlcXVpcmUoJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlJyksXG4gICAgQ29udHJvbFNlY3Rpb25JdGVtVmlldztcblxuQ29udHJvbFNlY3Rpb25JdGVtVmlldyA9IENvbnRyb2xCYXNlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdWkgPSBDb250cm9sQmFzZUl0ZW1WaWV3LnByb3RvdHlwZS51aS5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHR1aS5oZWFkaW5nID0gJy5lbGVtZW50b3ItcGFuZWwtaGVhZGluZyc7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0dHJpZ2dlcnM6IHtcblx0XHQnY2xpY2snOiAnY29udHJvbDpzZWN0aW9uOmNsaWNrZWQnXG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sU2VjdGlvbkl0ZW1WaWV3O1xuIiwiLy8gQXR0ZW50aW9uOiBETyBOT1QgdXNlIHRoaXMgY29udHJvbCBzaW5jZSBpdCBoYXMgYnVnc1xuLy8gVE9ETzogVGhpcyBjb250cm9sIGlzIHVudXNlZFxudmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xTZWxlY3RTb3J0SXRlbVZpZXc7XG5cbkNvbnRyb2xTZWxlY3RTb3J0SXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2VsZWN0ID0gJy5lbGVtZW50b3Itc2VsZWN0LXNvcnQnO1xuXHRcdHVpLnNlbGVjdGVkT3B0aW9ucyA9ICcuZWxlbWVudG9yLXNlbGVjdC1zb3J0LXNlbGVjdG9yJztcblx0XHR1aS5zZWxlY3RlZFByZXZpZXcgPSAnLmVsZW1lbnRvci1jb250cm9sLXNlbGVjdGVkLXByZXZpZXcnO1xuXHRcdHVpLmJ1dHRvbkFkZCA9ICcuZWxlbWVudG9yLXZhbHVlLWFkZCc7XG5cdFx0dWkuYnV0dG9uUmVtb3ZlID0gJy5lbGVtZW50b3Itc2VsZWN0ZWQtdmFsdWUtcmVtb3ZlJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdjbGljayBAdWkuYnV0dG9uUmVtb3ZlJzogJ29uQ2xpY2tSZW1vdmUnLFxuXHRcdCdjbGljayBAdWkuYnV0dG9uQWRkJzogJ29uQ2xpY2tBZGQnLFxuXHR9LFxuXG5cdG9uUmVhZHk6IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy51aS5zZWxlY3RlZFByZXZpZXcuc29ydGFibGUoIHtcblx0XHRcdGF4aXM6ICd5Jyxcblx0XHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCwgdWkgKSB7XG5cblx0XHRcdFx0dmFyICRzZWxlY3RCb3ggPSAkKHNlbGYudWkuc2VsZWN0KS5lbXB0eSgpO1xuXG5cdFx0XHRcdCQubWFwKCQodGhpcykuZmluZCgnLmVsZW1lbnRvci1zZWxlY3RlZC12YWx1ZS1wcmV2aWV3JyksIGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRcdFx0JHNlbGVjdEJveC5hcHBlbmQoJzxvcHRpb24gdmFsdWU9XCInICsgJChlbCkuZGF0YSgndmFsdWUtaWQnKSArICdcIiBzZWxlY3RlZD4nKyAkKGVsKS5kYXRhKCd2YWx1ZS10ZXh0JykgKyc8L29wdGlvbj4nKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNlbGVjdEJveC50cmlnZ2VyKCdjaGFuZ2UnKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0fSxcblxuXHRvbkNsaWNrUmVtb3ZlOiBmdW5jdGlvbihkb21FdmVudCkge1xuXG5cdFx0dmFyICRlbGVtZW50ID0gJChkb21FdmVudC5jdXJyZW50VGFyZ2V0KTtcblx0XHR2YXIgaWQgPSAkZWxlbWVudC5kYXRhKCd2YWx1ZS1pZCcpO1xuXHRcdCRlbGVtZW50LnBhcmVudHMoJy5lbGVtZW50b3Itc2VsZWN0ZWQtdmFsdWUtcHJldmlldycpLmZpcnN0KCkucmVtb3ZlKCk7XG5cdFx0JCh0aGlzLnVpLnNlbGVjdCkuZmluZCgnb3B0aW9uW3ZhbHVlPScgKyBpZCArJyBdJykucmVtb3ZlKCkucHJvcChcInNlbGVjdGVkXCIsIGZhbHNlKTtcblx0XHQkKHRoaXMudWkuc2VsZWN0ZWRPcHRpb25zKS5maW5kKCdvcHRpb25bdmFsdWU9JyArIGlkICsnIF0nKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKS5yZW1vdmVDbGFzcygnaGlkZGVuLW9wdGlvbicpO1xuXG5cdFx0JCh0aGlzLnVpLnNlbGVjdCkudHJpZ2dlcignY2hhbmdlJyk7XG5cblx0fSxcblxuXHRvbkNsaWNrQWRkOiBmdW5jdGlvbihkb21FdmVudCkge1xuXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0JCh0aGlzLnVpLnNlbGVjdGVkT3B0aW9ucykuZmluZCgnOnNlbGVjdGVkJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdCRvcHRpb24gPSAkKCB0aGlzICk7XG5cblx0XHRcdGlmKCRvcHRpb24gLnByb3AoJ2Rpc2FibGVkJykgPT0gdHJ1ZSl7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdCRvcHRpb25DbG9uZSA9ICRvcHRpb24uY2xvbmUoKS5wcm9wKFwic2VsZWN0ZWRcIiwgdHJ1ZSk7XG5cblxuXHRcdFx0JG9wdGlvbi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXG5cdFx0XHRpZigkKHNlbGYudWkuc2VsZWN0ZWRPcHRpb25zKS5kYXRhKCdyZW1vdmUnKSl7XG5cdFx0XHRcdCRvcHRpb24uYWRkQ2xhc3MoJ2hpZGRlbi1vcHRpb24nKTtcblx0XHRcdH1cblxuXHRcdFx0JG9wdGlvbkNsb25lLmFwcGVuZFRvKHNlbGYudWkuc2VsZWN0KTtcblx0XHRcdHZhciBpZCA9ICQodGhpcykudmFsKCk7XG5cdFx0XHR2YXIgdGV4dCA9ICQodGhpcykudGV4dCgpO1xuXG5cdFx0XHQkKHNlbGYudWkuc2VsZWN0ZWRQcmV2aWV3KS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJlbGVtZW50b3Itc2VsZWN0ZWQtdmFsdWUtcHJldmlld1wiIGRhdGEtdmFsdWUtdGV4dD1cIicgKyB0ZXh0ICsgJ1wiIGRhdGEtdmFsdWUtaWQ9XCInICsgaWQgICsgJ1wiPjxkaXYgY2xhc3M9XCJlbGVtZW50b3ItcmVwZWF0ZXItcm93LWhhbmRsZS1zb3J0YWJsZVwiPjxpIGNsYXNzPVwiZmEgZmEtZWxsaXBzaXMtdlwiPjwvaT48L2Rpdj4nICtcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJzZWxlY3RlZC12YWx1ZS1wcmV2aWV3LWluZm9cIj4nXG5cdFx0XHRcdCsgdGV4dFxuXHRcdFx0XHQrICc8YnV0dG9uIGRhdGEtdmFsdWUtaWQ9XCInICsgaWQgKyAnXCIgZGF0YS12YWx1ZS10ZXh0PVwiJyArIHRleHQgKyAnXCIgY2xhc3M9XCJlbGVtZW50b3Itc2VsZWN0ZWQtdmFsdWUtcmVtb3ZlIHNlbGVjdGVkLXZhbHVlLXJlbW92ZScgKyBpZCArICdcIj48aSBjbGFzcz1cImZhIGZhLXJlbW92ZVwiPjwvaT48L2J1dHRvbj48L2Rpdj48L2Rpdj4nKTtcblx0XHR9KTtcblxuXHRcdCQodGhpcy51aS5zZWxlY3QpLnRyaWdnZXIoJ2NoYW5nZScpO1xuXG5cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXG5cdFx0dGhpcy4kZWwucmVtb3ZlKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sU2VsZWN0U29ydEl0ZW1WaWV3O1xuIiwiLy8gQXR0ZW50aW9uOiBETyBOT1QgdXNlIHRoaXMgY29udHJvbCBzaW5jZSBpdCBoYXMgYnVnc1xuLy8gVE9ETzogVGhpcyBjb250cm9sIGlzIHVudXNlZFxudmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xTZWxlY3QySXRlbVZpZXc7XG5cbkNvbnRyb2xTZWxlY3QySXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2VsZWN0ID0gJy5lbGVtZW50b3Itc2VsZWN0Mic7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0b25SZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG9wdGlvbnMgPSB7XG5cdFx0XHRhbGxvd0NsZWFyOiB0cnVlXG5cdFx0fTtcblxuXHRcdHRoaXMudWkuc2VsZWN0LnNlbGVjdDIoIG9wdGlvbnMgKTtcblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy51aS5zZWxlY3QuZGF0YSggJ3NlbGVjdDInICkgKSB7XG5cdFx0XHR0aGlzLnVpLnNlbGVjdC5zZWxlY3QyKCAnZGVzdHJveScgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwucmVtb3ZlKCk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sU2VsZWN0Mkl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlVW5pdHNJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZS11bml0cycgKSxcblx0Q29udHJvbFNsaWRlckl0ZW1WaWV3O1xuXG5Db250cm9sU2xpZGVySXRlbVZpZXcgPSBDb250cm9sQmFzZVVuaXRzSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHVpOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdWkgPSBDb250cm9sQmFzZVVuaXRzSXRlbVZpZXcucHJvdG90eXBlLnVpLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHVpLnNsaWRlciA9ICcuZWxlbWVudG9yLXNsaWRlcic7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0Y2hpbGRFdmVudHM6IHtcblx0XHQnc2xpZGUgQHVpLnNsaWRlcic6ICdvblNsaWRlQ2hhbmdlJ1xuXHR9LFxuXG5cdF9pc0N1c3RvbVVuaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnY3VzdG9tJyA9PT0gdGhpcy5nZXRDb250cm9sVmFsdWUoICd1bml0JyApO1xuXHR9LFxuXG5cdF9zZXRJbnB1dE1vZGU6IGZ1bmN0aW9uKCBpc0N1c3RvbSApIHtcblx0XHR0aGlzLnVpLmlucHV0LmF0dHIoICd0eXBlJywgaXNDdXN0b20gPyAndGV4dCcgOiAnbnVtYmVyJyApO1xuXG5cdFx0aWYgKCBpc0N1c3RvbSApIHtcblx0XHRcdHRoaXMudWkuaW5wdXQucmVtb3ZlQXR0ciggJ21pbicgKS5yZW1vdmVBdHRyKCAnbWF4JyApLnJlbW92ZUF0dHIoICdzdGVwJyApO1xuXHRcdH1cblx0fSxcblxuXHRfYXBwbHlOdW1iZXJDb25zdHJhaW50czogZnVuY3Rpb24oIHVuaXRSYW5nZSApIHtcblx0XHQvLyBqUXVlcnkgMy41LjE6IMOpdml0ZXIgYXR0cihvYmplY3QpIChwZXV0IHRocm93IHNpIHVuZSB2YWxldXIgbidlc3QgcGFzIHVuZSBzdHJpbmcpXG5cdFx0Ly8gdW5pdFJhbmdlIHZpZW50IHR5cGlxdWVtZW50IGRlIGdldEN1cnJlbnRSYW5nZSgpOiB7IG1pbiwgbWF4LCBzdGVwIH1cblx0XHR0aGlzLnVpLmlucHV0XG5cdFx0XHQucmVtb3ZlQXR0ciggJ21pbicgKVxuXHRcdFx0LnJlbW92ZUF0dHIoICdtYXgnIClcblx0XHRcdC5yZW1vdmVBdHRyKCAnc3RlcCcgKTtcblxuXHRcdGlmICggdW5pdFJhbmdlICYmIG51bGwgIT0gdW5pdFJhbmdlLm1pbiApIHtcblx0XHRcdHRoaXMudWkuaW5wdXQuYXR0ciggJ21pbicsIHVuaXRSYW5nZS5taW4gKTtcblx0XHR9XG5cdFx0aWYgKCB1bml0UmFuZ2UgJiYgbnVsbCAhPSB1bml0UmFuZ2UubWF4ICkge1xuXHRcdFx0dGhpcy51aS5pbnB1dC5hdHRyKCAnbWF4JywgdW5pdFJhbmdlLm1heCApO1xuXHRcdH1cblx0XHRpZiAoIHVuaXRSYW5nZSAmJiBudWxsICE9IHVuaXRSYW5nZS5zdGVwICkge1xuXHRcdFx0dGhpcy51aS5pbnB1dC5hdHRyKCAnc3RlcCcsIHVuaXRSYW5nZS5zdGVwICk7XG5cdFx0fVxuXHR9LFxuXG5cdF9kZXN0cm95U2xpZGVySWZOZWVkZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGpRdWVyeSBVSSBzbGlkZXI6IMOpdml0ZXIgZXhjZXB0aW9ucyBzaSBwYXMgaW5pdGlhbGlzw6kuXG5cdFx0aWYgKCB0aGlzLnVpLnNsaWRlciAmJiB0aGlzLnVpLnNsaWRlci5sZW5ndGggJiYgdGhpcy51aS5zbGlkZXIuaGFzQ2xhc3MoICd1aS1zbGlkZXInICkgKSB7XG5cdFx0XHR0aGlzLnVpLnNsaWRlci5zbGlkZXIoICdkZXN0cm95JyApO1xuXHRcdH1cblx0fSxcblxuXHRfdXBkYXRlVW5pdHNVSTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlzQ3VzdG9tID0gdGhpcy5faXNDdXN0b21Vbml0KCk7XG5cblx0XHR0aGlzLl9zZXRJbnB1dE1vZGUoIGlzQ3VzdG9tICk7XG5cblx0XHRpZiAoIGlzQ3VzdG9tICkge1xuXHRcdFx0dGhpcy5fZGVzdHJveVNsaWRlcklmTmVlZGVkKCk7XG5cdFx0XHR0aGlzLnVpLnNsaWRlci5oaWRlKCk7XG5cdFx0XHR2YXIgc2l6ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAnc2l6ZScgKTtcblx0XHRcdHRoaXMudWkuaW5wdXQudmFsKCBzaXplICk7XG5cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLnVpLnNsaWRlci5zaG93KCk7XG5cdFx0dGhpcy5pbml0U2xpZGVyKCk7XG5cdH0sXG5cblx0aW5pdFNsaWRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gTmUgcGFzIGluaXRpYWxpc2VyIGxlIHNsaWRlciBzaSBvbiBlc3QgZW4gXCJjdXN0b21cIi5cblx0XHRpZiAoIHRoaXMuX2lzQ3VzdG9tVW5pdCgpICkge1xuXHRcdFx0Ly8gRW4gY3VzdG9tLCBvbiBsYWlzc2UgbCdpbnB1dCB0ZWwgcXVlbCAodGV4dGUgbGlicmUpLlxuXHRcdFx0dGhpcy5fc2V0SW5wdXRNb2RlKCB0cnVlICk7XG5cdFx0XHR0aGlzLnVpLnNsaWRlci5oaWRlKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHNpemUgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSggJ3NpemUnICksXG5cdFx0XHR1bml0UmFuZ2UgPSB0aGlzLmdldEN1cnJlbnRSYW5nZSgpO1xuXG5cdFx0dGhpcy5fc2V0SW5wdXRNb2RlKCBmYWxzZSApO1xuXHRcdHRoaXMuX2FwcGx5TnVtYmVyQ29uc3RyYWludHMoIHVuaXRSYW5nZSApO1xuXG5cdFx0LyovLyBOb3JtYWxpc2VyIHNpemUgcG91ciBsZSBzbGlkZXIgKGpRdWVyeSBVSSBhdHRlbmQgdW4gbm9tYnJlKS5cblx0XHRpZiAoICcnID09PSBzaXplIHx8IG51bGwgPT0gc2l6ZSApIHtcblx0XHRcdHNpemUgPSB1bml0UmFuZ2UgJiYgbnVsbCAhPSB1bml0UmFuZ2UubWluID8gdW5pdFJhbmdlLm1pbiA6IDA7XG5cdFx0fVxuXHRcdHNpemUgPSBOdW1iZXIoIHNpemUgKTtcblx0XHRpZiAoIGlzTmFOKCBzaXplICkgKSB7XG5cdFx0XHRzaXplID0gdW5pdFJhbmdlICYmIG51bGwgIT0gdW5pdFJhbmdlLm1pbiA/IE51bWJlciggdW5pdFJhbmdlLm1pbiApIDogMDtcblx0XHR9Ki9cblxuXHRcdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgc2xpZGVyIHdpdGggc2l6ZTonLCBzaXplLCB0aGlzLnVpLmlucHV0KTtcblxuXG5cblx0XHR0aGlzLnVpLmlucHV0LnZhbCggc2l6ZSApO1xuXG5cdFx0dGhpcy5fZGVzdHJveVNsaWRlcklmTmVlZGVkKCk7XG5cblx0XHR0aGlzLnVpLnNsaWRlci5zbGlkZXIoIF8uZXh0ZW5kKCB7fSwgdW5pdFJhbmdlLCB7IHZhbHVlOiBzaXplIH0gKSApO1xuXHR9LFxuXG5cdHJlc2V0U2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRWYWx1ZSggJ3NpemUnLCAnJyApO1xuXHRcdHRoaXMuaW5pdFNsaWRlcigpO1xuXHR9LFxuXG5cdG9uUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX3VwZGF0ZVVuaXRzVUkoKTtcblx0fSxcblxuXHRvblNsaWRlQ2hhbmdlOiBmdW5jdGlvbiggZXZlbnQsIHVpICkge1xuXHRcdHRoaXMuc2V0VmFsdWUoICdzaXplJywgdWkudmFsdWUgKTtcblxuXHRcdHRoaXMudWkuaW5wdXQudmFsKCB1aS52YWx1ZSApO1xuXHR9LFxuXG5cdG9uSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZGF0YUNoYW5nZWQgPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuc2V0dGluZztcblxuXHRcdGlmICggJ3NpemUnID09PSBkYXRhQ2hhbmdlZCApIHtcblx0XHRcdGlmICggdGhpcy5faXNDdXN0b21Vbml0KCkgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRXZpdGVyIGQnZW52b3llciB1bmUgc3RyaW5nIHZpZGUgLyBub24tbnVtw6lyaXF1ZSBhdSBzbGlkZXIuXG5cdFx0XHR2YXIgdiA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAnc2l6ZScgKTtcblx0XHRcdHYgPSBOdW1iZXIoIHYgKTtcblx0XHRcdGlmICggaXNOYU4oIHYgKSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnVpLnNsaWRlci5zbGlkZXIoICd2YWx1ZScsIHYgKTtcblx0XHR9IGVsc2UgaWYgKCAndW5pdCcgPT09IGRhdGFDaGFuZ2VkICkge1xuXHRcdFx0Ly8gU2kgb24gcmVwYXNzZSBzdXIgdW5lIHVuaXTDqSBudW3DqXJpcXVlLCBsYSB2YWxldXIgZG9pdCDDqnRyZSB1biBlbnRpZXIgXCJwdXJcIi5cblx0XHRcdC8vIHBhcnNlSW50IHN1ZmZpdDogc2kgXCIxMnB4XCIvXCIxMi41XCIgPT4gbWlzbWF0Y2ggPT4gb24gdmlkZS5cblx0XHRcdGlmICggISB0aGlzLl9pc0N1c3RvbVVuaXQoKSApIHtcblx0XHRcdFx0Y29uc3QgcmF3U2l6ZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCdzaXplJyk7XG5cdFx0XHRcdGlmICggbnVsbCAhPSByYXdTaXplICYmICcnICE9PSByYXdTaXplICkge1xuXHRcdFx0XHRcdGNvbnN0IHRyaW1tZWQgPSBTdHJpbmcoIHJhd1NpemUgKS50cmltKCk7XG5cdFx0XHRcdFx0Y29uc3QgcGFyc2VkID0gcGFyc2VJbnQoIHRyaW1tZWQsIDEwICk7XG5cdFx0XHRcdFx0aWYgKCBpc05hTiggcGFyc2VkICkgfHwgU3RyaW5nKCBwYXJzZWQgKSAhPT0gdHJpbW1lZCApIHtcblx0XHRcdFx0XHRcdHRoaXMuc2V0VmFsdWUoICdzaXplJywgJycgKTtcblx0XHRcdFx0XHRcdGlmICggdGhpcy51aSAmJiB0aGlzLnVpLmlucHV0ICYmIHRoaXMudWkuaW5wdXQubGVuZ3RoICkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVpLmlucHV0LnZhbCggJycgKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fdXBkYXRlVW5pdHNVSSgpO1xuXHRcdH1cblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2Rlc3Ryb3lTbGlkZXJJZk5lZWRlZCgpO1xuXHRcdHRoaXMuJGVsLnJlbW92ZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbFNsaWRlckl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UnICksXG5cdENvbnRyb2xTdHJ1Y3R1cmVJdGVtVmlldztcblxuQ29udHJvbFN0cnVjdHVyZUl0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xCYXNlSXRlbVZpZXcucHJvdG90eXBlLnVpLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHVpLnJlc2V0U3RydWN0dXJlID0gJy5lbGVtZW50b3ItY29udHJvbC1zdHJ1Y3R1cmUtcmVzZXQnO1xuXG5cdFx0cmV0dXJuIHVpO1xuXHR9LFxuXG5cdGNoaWxkRXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5yZXNldFN0cnVjdHVyZSc6ICdvblJlc2V0U3RydWN0dXJlQ2xpY2snXG5cdH0sXG5cblx0dGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGVscGVycyA9IENvbnRyb2xCYXNlSXRlbVZpZXcucHJvdG90eXBlLnRlbXBsYXRlSGVscGVycy5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cblx0XHRoZWxwZXJzLmdldE1vcmVQcmVzZXRzID0gXy5iaW5kKCB0aGlzLmdldE1vcmVQcmVzZXRzLCB0aGlzICk7XG5cblx0XHRyZXR1cm4gaGVscGVycztcblx0fSxcblxuXHRnZXRDdXJyZW50RWRpdGVkU2VjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGVkaXRvciA9IGVsZW1lbnRvci5nZXRQYW5lbFZpZXcoKS5nZXRDdXJyZW50UGFnZVZpZXcoKTtcblxuXHRcdHJldHVybiBlZGl0b3IuZ2V0T3B0aW9uKCAnZWRpdGVkRWxlbWVudFZpZXcnICk7XG5cdH0sXG5cblx0Z2V0TW9yZVByZXNldHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYXJzZWRTdHJ1Y3R1cmUgPSBlbGVtZW50b3IucHJlc2V0c0ZhY3RvcnkuZ2V0UGFyc2VkU3RydWN0dXJlKCB0aGlzLmdldENvbnRyb2xWYWx1ZSgpICk7XG5cblx0XHRyZXR1cm4gZWxlbWVudG9yLnByZXNldHNGYWN0b3J5LmdldFByZXNldHMoIHBhcnNlZFN0cnVjdHVyZS5jb2x1bW5zQ291bnQgKTtcblx0fSxcblxuXHRvbklucHV0Q2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldEN1cnJlbnRFZGl0ZWRTZWN0aW9uKCkucmVkZWZpbmVMYXlvdXQoKTtcblxuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0b25SZXNldFN0cnVjdHVyZUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdldEN1cnJlbnRFZGl0ZWRTZWN0aW9uKCkucmVzZXRDb2x1bW5zQ3VzdG9tU2l6ZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbFN0cnVjdHVyZUl0ZW1WaWV3O1xuIiwidmFyIENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29udHJvbHMvYmFzZS1tdWx0aXBsZScgKSxcblx0Q29udHJvbFRleHRTaGFkb3dJdGVtVmlldztcblxuQ29udHJvbFRleHRTaGFkb3dJdGVtVmlldyA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5leHRlbmQoIHtcblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2xpZGVycyA9ICcuZWxlbWVudG9yLXNsaWRlcic7XG5cdFx0dWkuY29sb3JzID0gJy5lbGVtZW50b3ItdGV4dC1zaGFkb3ctY29sb3ItcGlja2VyJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdzbGlkZSBAdWkuc2xpZGVycyc6ICdvblNsaWRlQ2hhbmdlJ1xuXHR9LFxuXG5cdGluaXRTbGlkZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsdWUgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSgpO1xuXG5cdFx0dGhpcy51aS5zbGlkZXJzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICRzbGlkZXIgPSBCYWNrYm9uZS4kKCB0aGlzICksXG5cdFx0XHRcdCRpbnB1dCA9ICRzbGlkZXIubmV4dCggJy5lbGVtZW50b3Itc2xpZGVyLWlucHV0JyApLmZpbmQoICdpbnB1dCcgKTtcblxuXHRcdFx0JHNsaWRlci5zbGlkZXIoIHtcblx0XHRcdFx0dmFsdWU6IHZhbHVlWyB0aGlzLmRhdGFzZXQuaW5wdXQgXSxcblx0XHRcdFx0bWluOiArJGlucHV0LmF0dHIoICdtaW4nICksXG5cdFx0XHRcdG1heDogKyRpbnB1dC5hdHRyKCAnbWF4JyApXG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdGluaXRDb2xvcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLnVpLmNvbG9ycy53cENvbG9yUGlja2VyKCB7XG5cdFx0XHRjaGFuZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgJHRoaXMgPSBCYWNrYm9uZS4kKCB0aGlzICksXG5cdFx0XHRcdFx0dHlwZSA9ICR0aGlzLmRhdGEoICdzZXR0aW5nJyApO1xuXG5cdFx0XHRcdHNlbGYuc2V0VmFsdWUoIHR5cGUsICR0aGlzLndwQ29sb3JQaWNrZXIoICdjb2xvcicgKSApO1xuXHRcdFx0fSxcblxuXHRcdFx0Y2xlYXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLnNldFZhbHVlKCB0aGlzLmRhdGFzZXQuc2V0dGluZywgJycgKTtcblx0XHRcdH0sXG5cblx0XHRcdHdpZHRoOiAyNTFcblx0XHR9ICk7XG5cdH0sXG5cblx0b25JbnB1dENoYW5nZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciB0eXBlID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LnNldHRpbmcsXG5cdFx0XHQkc2xpZGVyID0gdGhpcy51aS5zbGlkZXJzLmZpbHRlciggJ1tkYXRhLWlucHV0PVwiJyArIHR5cGUgKyAnXCJdJyApO1xuXG5cdFx0JHNsaWRlci5zbGlkZXIoICd2YWx1ZScsIHRoaXMuZ2V0Q29udHJvbFZhbHVlKCB0eXBlICkgKTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmluaXRTbGlkZXJzKCk7XG5cdFx0dGhpcy5pbml0Q29sb3JzKCk7XG5cdH0sXG5cblx0b25TbGlkZUNoYW5nZTogZnVuY3Rpb24oIGV2ZW50LCB1aSApIHtcblx0XHR2YXIgdHlwZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pbnB1dCxcblx0XHRcdCRpbnB1dCA9IHRoaXMudWkuaW5wdXQuZmlsdGVyKCAnW2RhdGEtc2V0dGluZz1cIicgKyB0eXBlICsgJ1wiXScgKTtcblxuXHRcdCRpbnB1dC52YWwoIHVpLnZhbHVlICk7XG5cdFx0dGhpcy5zZXRWYWx1ZSggdHlwZSwgdWkudmFsdWUgKTtcblx0fSxcblxuXHRvbkJlZm9yZURlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudWkuY29sb3JzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICRjb2xvciA9IEJhY2tib25lLiQoIHRoaXMgKTtcblxuXHRcdFx0aWYgKCAkY29sb3Iud3BDb2xvclBpY2tlciggJ2luc3RhbmNlJyApICkge1xuXHRcdFx0XHQkY29sb3Iud3BDb2xvclBpY2tlciggJ2Nsb3NlJyApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblxuXHRcdHRoaXMuJGVsLnJlbW92ZSgpO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbFRleHRTaGFkb3dJdGVtVmlldztcbiIsInZhciBDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2NvbnRyb2xzL2Jhc2UtbXVsdGlwbGUnICksXG5cdENvbnRyb2xVcmxJdGVtVmlldztcblxudmFyIF9zZWFyY2hDYWNoZSA9IHt9O1xuXG5Db250cm9sVXJsSXRlbVZpZXcgPSBDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcuZXh0ZW5kKCB7XG5cblx0X2Ryb3Bkb3duT3BlbjogZmFsc2UsXG5cdF9zZWFyY2hYaHI6IG51bGwsXG5cdF9lbnRpdHlNb2RlOiBmYWxzZSxcblx0X291dHNpZGVDbGlja0hhbmRsZXI6IG51bGwsXG5cblx0dWk6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1aSA9IENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuc2VhcmNoSW5wdXQgPSAnLmVsZW1lbnRvci1jb250cm9sLXVybC1zZWFyY2gnO1xuXHRcdHVpLmRyb3Bkb3duID0gJy5lbGVtZW50b3ItY29udHJvbC11cmwtZHJvcGRvd24nO1xuXHRcdHVpLmlucHV0V3JhcCA9ICcuZWxlbWVudG9yLWNvbnRyb2wtdXJsLWlucHV0LXdyYXAnO1xuXHRcdHVpLmVudGl0eVByZXZpZXcgPSAnLmVsZW1lbnRvci1jb250cm9sLXVybC1lbnRpdHktcHJldmlldyc7XG5cdFx0dWkuZW50aXR5VHlwZSA9ICcuZWxlbWVudG9yLWNvbnRyb2wtdXJsLWVudGl0eS10eXBlJztcblx0XHR1aS5lbnRpdHlMYWJlbCA9ICcuZWxlbWVudG9yLWNvbnRyb2wtdXJsLWVudGl0eS1sYWJlbCc7XG5cdFx0dWkuZW50aXR5Q2xlYXIgPSAnLmVsZW1lbnRvci1jb250cm9sLXVybC1lbnRpdHktY2xlYXInO1xuXHRcdHVpLmJ0bkV4dGVybmFsID0gJ2J1dHRvbi5lbGVtZW50b3ItY29udHJvbC11cmwtdGFyZ2V0Jztcblx0XHR1aS5mcmFtZU9wZW5lcnMgPSAnLmVsZW1lbnRvci1jb250cm9sLXVybC1tZWRpYSc7XG5cblx0XHRyZXR1cm4gdWk7XG5cdH0sXG5cblx0ZXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5leHRlbmQoIENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5wcm90b3R5cGUuZXZlbnRzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKSwge1xuXHRcdFx0J2lucHV0IC5lbGVtZW50b3ItY29udHJvbC11cmwtc2VhcmNoJzogJ29uU2VhcmNoSW5wdXQnLFxuXHRcdFx0J2ZvY3VzIC5lbGVtZW50b3ItY29udHJvbC11cmwtc2VhcmNoJzogJ29uU2VhcmNoRm9jdXMnLFxuXHRcdFx0J2tleWRvd24gLmVsZW1lbnRvci1jb250cm9sLXVybC1zZWFyY2gnOiAnb25TZWFyY2hLZXlkb3duJyxcblx0XHRcdCdjbGljayAuZWxlbWVudG9yLWNvbnRyb2wtdXJsLWVudGl0eS1jbGVhcic6ICdvbkVudGl0eUNsZWFyJyxcblx0XHRcdCdjbGljayAuZWxlbWVudG9yLWNvbnRyb2wtdXJsLXRhcmdldCc6ICdvbkV4dGVybmFsQ2xpY2tlZCcsXG5cdFx0XHQnY2xpY2sgLmVsZW1lbnRvci1jb250cm9sLXVybC1tZWRpYSc6ICdvcGVuRnJhbWUnLFxuXHRcdFx0J2NsaWNrIC5lbGVtZW50b3ItY29udHJvbC11cmwtZHJvcGRvd24taXRlbSc6ICdvbkRyb3Bkb3duSXRlbUNsaWNrJ1xuXHRcdH0gKTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAnaXNfZXh0ZXJuYWwnICkgKSB7XG5cdFx0XHR0aGlzLnVpLmJ0bkV4dGVybmFsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH1cblxuXHRcdHRoaXMuX3Jlc3RvcmVFbnRpdHlQcmV2aWV3KCk7XG5cdH0sXG5cblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cdC8vIEVudGl0eSBwcmV2aWV3ICh3aGVuIGFuIGVudGl0eSBpcyBzZWxlY3RlZClcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0X3Jlc3RvcmVFbnRpdHlQcmV2aWV3OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAndHlwZScgKTtcblx0XHR2YXIgbGFiZWwgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSggJ2xhYmVsJyApO1xuXG5cdFx0aWYgKCB0eXBlICYmIHR5cGUgIT09ICdjdXN0b20nICYmIGxhYmVsICkge1xuXHRcdFx0dGhpcy5fc2hvd0VudGl0eVByZXZpZXcoIHR5cGUsIGxhYmVsICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX2hpZGVFbnRpdHlQcmV2aWV3KCk7XG5cdFx0fVxuXHR9LFxuXG5cdF9zaG93RW50aXR5UHJldmlldzogZnVuY3Rpb24oIHR5cGUsIGxhYmVsICkge1xuXHRcdHRoaXMuX2VudGl0eU1vZGUgPSB0cnVlO1xuXHRcdHRoaXMudWkuZW50aXR5VHlwZS50ZXh0KCB0aGlzLl9nZXRUeXBlTGFiZWwoIHR5cGUgKSApO1xuXHRcdHRoaXMudWkuZW50aXR5TGFiZWwudGV4dCggbGFiZWwgKTtcblx0XHR0aGlzLnVpLmVudGl0eVByZXZpZXcuc2hvdygpO1xuXHRcdHRoaXMudWkuaW5wdXRXcmFwLmhpZGUoKTtcblx0fSxcblxuXHRfaGlkZUVudGl0eVByZXZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2VudGl0eU1vZGUgPSBmYWxzZTtcblx0XHR0aGlzLnVpLmVudGl0eVByZXZpZXcuaGlkZSgpO1xuXHRcdHRoaXMudWkuaW5wdXRXcmFwLnNob3coKTtcblx0fSxcblxuXHRfZ2V0VHlwZUxhYmVsOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHR2YXIgbGFiZWxzID0ge1xuXHRcdFx0J2NhdGVnb3J5JzogJ0NhdGVnb3J5Jyxcblx0XHRcdCdjbXMnOiAnQ01TJyxcblx0XHRcdCdtYW51ZmFjdHVyZXInOiAnQnJhbmQnLFxuXHRcdFx0J3N1cHBsaWVyJzogJ1N1cHBsaWVyJ1xuXHRcdH07XG5cdFx0cmV0dXJuIGxhYmVsc1sgdHlwZSBdIHx8IHR5cGU7XG5cdH0sXG5cblx0b25FbnRpdHlDbGVhcjogZnVuY3Rpb24oIGUgKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHR0aGlzLnNldFZhbHVlKCB7XG5cdFx0XHR0eXBlOiAnJyxcblx0XHRcdGlkOiAnJyxcblx0XHRcdHVybDogJycsXG5cdFx0XHRsYWJlbDogJydcblx0XHR9ICk7XG5cblx0XHR0aGlzLl9oaWRlRW50aXR5UHJldmlldygpO1xuXHRcdHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCAnJyApLmZvY3VzKCk7XG5cdH0sXG5cblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cdC8vIFNlYXJjaCAmIGRyb3Bkb3duXG5cdC8vIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5cdG9uU2VhcmNoRm9jdXM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2YWwgPSAoIHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCkgfHwgJycgKS50cmltKCk7XG5cdFx0aWYgKCB2YWwubGVuZ3RoID49IDIgKSB7XG5cdFx0XHR0aGlzLl9kb1NlYXJjaCggdmFsICk7XG5cdFx0fVxuXHR9LFxuXG5cdG9uU2VhcmNoSW5wdXQ6IF8uZGVib3VuY2UoIGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2YWwgPSAoIHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCkgfHwgJycgKS50cmltKCk7XG5cblx0XHRpZiAoIHZhbC5sZW5ndGggPCAyICkge1xuXHRcdFx0dGhpcy5fY2xvc2VEcm9wZG93bigpO1xuXG5cdFx0XHQvLyBUcmVhdCBhcyBjdXN0b20gVVJMIG9uIGJsdXIvY2hhbmdlXG5cdFx0XHR0aGlzLnNldFZhbHVlKCB7XG5cdFx0XHRcdHR5cGU6ICdjdXN0b20nLFxuXHRcdFx0XHRpZDogJycsXG5cdFx0XHRcdHVybDogdmFsLFxuXHRcdFx0XHRsYWJlbDogJydcblx0XHRcdH0gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBJZiBpdCBsb29rcyBsaWtlIGEgVVJMLCBzZXQgYXMgY3VzdG9tIGltbWVkaWF0ZWx5XG5cdFx0aWYgKCB0aGlzLl9sb29rc0xpa2VVcmwoIHZhbCApICkge1xuXHRcdFx0dGhpcy5zZXRWYWx1ZSgge1xuXHRcdFx0XHR0eXBlOiAnY3VzdG9tJyxcblx0XHRcdFx0aWQ6ICcnLFxuXHRcdFx0XHR1cmw6IHZhbCxcblx0XHRcdFx0bGFiZWw6ICcnXG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fZG9TZWFyY2goIHZhbCApO1xuXHR9LCAzMDAgKSxcblxuXHRvblNlYXJjaEtleWRvd246IGZ1bmN0aW9uKCBlICkge1xuXHRcdC8vIEVzY2FwZSBjbG9zZXMgZHJvcGRvd25cblx0XHRpZiAoIGUua2V5Q29kZSA9PT0gMjcgKSB7XG5cdFx0XHR0aGlzLl9jbG9zZURyb3Bkb3duKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gRW50ZXIgb24gYSBjdXN0b20gVVJMXG5cdFx0aWYgKCBlLmtleUNvZGUgPT09IDEzICkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5fY2xvc2VEcm9wZG93bigpO1xuXG5cdFx0XHR2YXIgdmFsID0gKCB0aGlzLnVpLnNlYXJjaElucHV0LnZhbCgpIHx8ICcnICkudHJpbSgpO1xuXHRcdFx0aWYgKCB2YWwgKSB7XG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUoIHtcblx0XHRcdFx0XHR0eXBlOiAnY3VzdG9tJyxcblx0XHRcdFx0XHRpZDogJycsXG5cdFx0XHRcdFx0dXJsOiB2YWwsXG5cdFx0XHRcdFx0bGFiZWw6ICcnXG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0X2xvb2tzTGlrZVVybDogZnVuY3Rpb24oIHN0ciApIHtcblx0XHRyZXR1cm4gL14oaHR0cHM/OlxcL1xcL3xcXC98I3xtYWlsdG86fHRlbDopLy50ZXN0KCBzdHIgKTtcblx0fSxcblxuXHRfZG9TZWFyY2g6IGZ1bmN0aW9uKCB0ZXJtICkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdC8vIENhbmNlbCBwcmV2aW91cyByZXF1ZXN0XG5cdFx0aWYgKCB0aGlzLl9zZWFyY2hYaHIgKSB7XG5cdFx0XHR0aGlzLl9zZWFyY2hYaHIuYWJvcnQoKTtcblx0XHRcdHRoaXMuX3NlYXJjaFhociA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hlY2sgY2FjaGVcblx0XHR2YXIgY2FjaGVLZXkgPSB0ZXJtLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCBfc2VhcmNoQ2FjaGVbIGNhY2hlS2V5IF0gKSB7XG5cdFx0XHRzZWxmLl9yZW5kZXJEcm9wZG93biggX3NlYXJjaENhY2hlWyBjYWNoZUtleSBdLCB0ZXJtICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gU2hvdyBsb2FkaW5nXG5cdFx0dGhpcy51aS5kcm9wZG93bi5odG1sKCAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1jb250cm9sLXVybC1kcm9wZG93bi1sb2FkaW5nXCI+Li4uPC9kaXY+JyApLnNob3coKTtcblx0XHR0aGlzLl9kcm9wZG93bk9wZW4gPSB0cnVlO1xuXHRcdHRoaXMuX2JpbmRPdXRzaWRlQ2xpY2soKTtcblxuXHRcdHRoaXMuX3NlYXJjaFhociA9IGVsZW1lbnRvci5hamF4LnNlbmQoICdTZWFyY2hFbnRpdGllcycsIHtcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0cTogdGVybVxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHRzZWxmLl9zZWFyY2hYaHIgPSBudWxsO1xuXHRcdFx0XHRfc2VhcmNoQ2FjaGVbIGNhY2hlS2V5IF0gPSBkYXRhIHx8IFtdO1xuXHRcdFx0XHRzZWxmLl9yZW5kZXJEcm9wZG93biggZGF0YSB8fCBbXSwgdGVybSApO1xuXHRcdFx0fSxcblx0XHRcdGVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2VsZi5fc2VhcmNoWGhyID0gbnVsbDtcblx0XHRcdFx0c2VsZi5fY2xvc2VEcm9wZG93bigpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHRfcmVuZGVyRHJvcGRvd246IGZ1bmN0aW9uKCByZXN1bHRzLCB0ZXJtICkge1xuXHRcdHZhciAkZHJvcGRvd24gPSB0aGlzLnVpLmRyb3Bkb3duO1xuXHRcdCRkcm9wZG93bi5lbXB0eSgpO1xuXG5cdFx0aWYgKCAhIHJlc3VsdHMubGVuZ3RoICkge1xuXHRcdFx0dmFyIG5vUmVzdWx0ID0gdGhpcy51aS5zZWFyY2hJbnB1dC5kYXRhKCAnbm8tcmVzdWx0JyApIHx8ICdObyByZXN1bHRzJztcblx0XHRcdCRkcm9wZG93bi5odG1sKCAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci1jb250cm9sLXVybC1kcm9wZG93bi1lbXB0eVwiPicgKyBub1Jlc3VsdCArICc8L2Rpdj4nICk7XG5cdFx0XHQkZHJvcGRvd24uc2hvdygpO1xuXHRcdFx0dGhpcy5fZHJvcGRvd25PcGVuID0gdHJ1ZTtcblx0XHRcdHRoaXMuX2JpbmRPdXRzaWRlQ2xpY2soKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cblx0XHRfLmVhY2goIHJlc3VsdHMsIGZ1bmN0aW9uKCBpdGVtICkge1xuXHRcdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cdFx0XHRkaXYuY2xhc3NOYW1lID0gJ2VsZW1lbnRvci1jb250cm9sLXVybC1kcm9wZG93bi1pdGVtJztcblx0XHRcdGRpdi5zZXRBdHRyaWJ1dGUoICdkYXRhLXR5cGUnLCBpdGVtLnR5cGUgKTtcblx0XHRcdGRpdi5zZXRBdHRyaWJ1dGUoICdkYXRhLWlkJywgaXRlbS5pZCApO1xuXHRcdFx0ZGl2LnNldEF0dHJpYnV0ZSggJ2RhdGEtbGFiZWwnLCBpdGVtLm5hbWUgKTtcblxuXHRcdFx0dmFyIHR5cGVTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0XHR0eXBlU3Bhbi5jbGFzc05hbWUgPSAnZWxlbWVudG9yLWNvbnRyb2wtdXJsLWRyb3Bkb3duLWl0ZW0tdHlwZSc7XG5cdFx0XHR0eXBlU3Bhbi50ZXh0Q29udGVudCA9IGl0ZW0udHlwZV9sYWJlbDtcblx0XHRcdGRpdi5hcHBlbmRDaGlsZCggdHlwZVNwYW4gKTtcblxuXHRcdFx0dmFyIG5hbWVTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XG5cdFx0XHRuYW1lU3Bhbi5jbGFzc05hbWUgPSAnZWxlbWVudG9yLWNvbnRyb2wtdXJsLWRyb3Bkb3duLWl0ZW0tbmFtZSc7XG5cdFx0XHRuYW1lU3Bhbi50ZXh0Q29udGVudCA9IGl0ZW0ubmFtZTtcblx0XHRcdGRpdi5hcHBlbmRDaGlsZCggbmFtZVNwYW4gKTtcblxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGRpdiApO1xuXHRcdH0gKTtcblxuXHRcdCRkcm9wZG93blswXS5hcHBlbmRDaGlsZCggZnJhZ21lbnQgKTtcblx0XHQkZHJvcGRvd24uc2hvdygpO1xuXHRcdHRoaXMuX2Ryb3Bkb3duT3BlbiA9IHRydWU7XG5cdFx0dGhpcy5fYmluZE91dHNpZGVDbGljaygpO1xuXHR9LFxuXG5cdG9uRHJvcGRvd25JdGVtQ2xpY2s6IGZ1bmN0aW9uKCBlICkge1xuXHRcdHZhciAkaXRlbSA9IEJhY2tib25lLiQoIGUuY3VycmVudFRhcmdldCApO1xuXHRcdHZhciB0eXBlID0gJGl0ZW0uYXR0ciggJ2RhdGEtdHlwZScgKTtcblx0XHR2YXIgaWQgPSAkaXRlbS5hdHRyKCAnZGF0YS1pZCcgKTtcblx0XHR2YXIgbGFiZWwgPSAkaXRlbS5hdHRyKCAnZGF0YS1sYWJlbCcgKTtcblxuXHRcdHRoaXMuc2V0VmFsdWUoIHtcblx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRpZDogaWQsXG5cdFx0XHR1cmw6ICcnLFxuXHRcdFx0bGFiZWw6IGxhYmVsXG5cdFx0fSApO1xuXG5cdFx0dGhpcy5fc2hvd0VudGl0eVByZXZpZXcoIHR5cGUsIGxhYmVsICk7XG5cdFx0dGhpcy5fY2xvc2VEcm9wZG93bigpO1xuXHR9LFxuXG5cdF9jbG9zZURyb3Bkb3duOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVpLmRyb3Bkb3duLmhpZGUoKS5lbXB0eSgpO1xuXHRcdHRoaXMuX2Ryb3Bkb3duT3BlbiA9IGZhbHNlO1xuXHRcdHRoaXMuX3VuYmluZE91dHNpZGVDbGljaygpO1xuXHR9LFxuXG5cdF9iaW5kT3V0c2lkZUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuX291dHNpZGVDbGlja0hhbmRsZXIgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLl9vdXRzaWRlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oIGUgKSB7XG5cdFx0XHRpZiAoICEgQmFja2JvbmUuJCggZS50YXJnZXQgKS5jbG9zZXN0KCAnLmVsZW1lbnRvci1jb250cm9sLXVybC1pbnB1dC13cmFwJyApLmxlbmd0aCApIHtcblx0XHRcdFx0c2VsZi5fY2xvc2VEcm9wZG93bigpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0Xy5kZWZlciggZnVuY3Rpb24oKSB7XG5cdFx0XHRCYWNrYm9uZS4kKCBkb2N1bWVudCApLm9uKCAnY2xpY2sudXJsU2VhcmNoJywgc2VsZi5fb3V0c2lkZUNsaWNrSGFuZGxlciApO1xuXHRcdH0gKTtcblx0fSxcblxuXHRfdW5iaW5kT3V0c2lkZUNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuX291dHNpZGVDbGlja0hhbmRsZXIgKSB7XG5cdFx0XHRCYWNrYm9uZS4kKCBkb2N1bWVudCApLm9mZiggJ2NsaWNrLnVybFNlYXJjaCcsIHRoaXMuX291dHNpZGVDbGlja0hhbmRsZXIgKTtcblx0XHRcdHRoaXMuX291dHNpZGVDbGlja0hhbmRsZXIgPSBudWxsO1xuXHRcdH1cblx0fSxcblxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblx0Ly8gRXh0ZXJuYWwgJiBNZWRpYSAoa2VlcCBleGlzdGluZyBiZWhhdmlvcilcblx0Ly8g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cblx0b3BlbkZyYW1lOiBmdW5jdGlvbigpIHtcblx0XHRvcGVuUHNGaWxlTWFuYWdlciggJ2VsZW1lbnRvci1jb250cm9sLXVybC1maWVsZC0nICsgdGhpcy5tb2RlbC5jaWQsIDIgKTtcblx0fSxcblxuXHRvbkV4dGVybmFsQ2xpY2tlZDogZnVuY3Rpb24oIGUgKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMudWkuYnRuRXh0ZXJuYWwudG9nZ2xlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0dGhpcy5zZXRWYWx1ZSggJ2lzX2V4dGVybmFsJywgdGhpcy5pc0V4dGVybmFsKCkgKTtcblx0fSxcblxuXHRpc0V4dGVybmFsOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy51aS5idG5FeHRlcm5hbC5oYXNDbGFzcyggJ2FjdGl2ZScgKTtcblx0fSxcblxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblx0Ly8gVmFsdWUgbWFuYWdlbWVudFxuXHQvLyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuXHRhcHBseVNhdmVkVmFsdWU6IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRyb2xNdWx0aXBsZUJhc2VJdGVtVmlldy5wcm90b3R5cGUuYXBwbHlTYXZlZFZhbHVlLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuXHRcdHZhciB1cmwgPSB0aGlzLmdldENvbnRyb2xWYWx1ZSggJ3VybCcgKTtcblx0XHR2YXIgdHlwZSA9IHRoaXMuZ2V0Q29udHJvbFZhbHVlKCAndHlwZScgKTtcblxuXHRcdC8vIElmIGVudGl0eSBtb2RlLCBkb24ndCBzaG93IFVSTCBpbiBpbnB1dFxuXHRcdGlmICggdHlwZSAmJiB0eXBlICE9PSAnY3VzdG9tJyApIHtcblx0XHRcdHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCAnJyApO1xuXHRcdH0gZWxzZSBpZiAoIHVybCApIHtcblx0XHRcdHRoaXMudWkuc2VhcmNoSW5wdXQudmFsKCB1cmwgKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gT3ZlcnJpZGUgdG8gaGFuZGxlIGN1c3RvbSBVUkwgY2hhbmdlcyBmcm9tIHRoZSBpbnB1dFxuXHR1cGRhdGVFbGVtZW50TW9kZWw6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIga2V5ID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LnNldHRpbmc7XG5cblx0XHRpZiAoIGtleSA9PT0gJ3VybCcgKSB7XG5cdFx0XHR2YXIgdmFsID0gdGhpcy5nZXRJbnB1dFZhbHVlKCBldmVudC5jdXJyZW50VGFyZ2V0ICk7XG5cblx0XHRcdC8vIE9ubHkgdXBkYXRlIGlmIG5vdCBpbiBlbnRpdHkgbW9kZVxuXHRcdFx0aWYgKCAhIHRoaXMuX2VudGl0eU1vZGUgKSB7XG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUoIHtcblx0XHRcdFx0XHR0eXBlOiAnY3VzdG9tJyxcblx0XHRcdFx0XHRpZDogJycsXG5cdFx0XHRcdFx0dXJsOiB2YWwsXG5cdFx0XHRcdFx0bGFiZWw6ICcnXG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRDb250cm9sTXVsdGlwbGVCYXNlSXRlbVZpZXcucHJvdG90eXBlLnVwZGF0ZUVsZW1lbnRNb2RlbC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0b25CZWZvcmVEZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl91bmJpbmRPdXRzaWRlQ2xpY2soKTtcblx0XHRpZiAoIHRoaXMuX3NlYXJjaFhociApIHtcblx0XHRcdHRoaXMuX3NlYXJjaFhoci5hYm9ydCgpO1xuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xVcmxJdGVtVmlldztcbiIsInZhciBDb250cm9sQmFzZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlJyApLFxuXHRDb250cm9sV1BXaWRnZXRJdGVtVmlldztcblxuQ29udHJvbFdQV2lkZ2V0SXRlbVZpZXcgPSBDb250cm9sQmFzZUl0ZW1WaWV3LmV4dGVuZCgge1xuXHR1aTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVpID0gQ29udHJvbEJhc2VJdGVtVmlldy5wcm90b3R5cGUudWkuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dWkuZm9ybSA9ICdmb3JtJztcblx0XHR1aS5sb2FkaW5nID0gJy53cC13aWRnZXQtZm9ybS1sb2FkaW5nJztcblxuXHRcdHJldHVybiB1aTtcblx0fSxcblxuXHRldmVudHM6IHtcblx0XHQna2V5dXAgQHVpLmZvcm0gOmlucHV0JzogJ29uRm9ybUNoYW5nZWQnLFxuXHRcdCdjaGFuZ2UgQHVpLmZvcm0gOmlucHV0JzogJ29uRm9ybUNoYW5nZWQnXG5cdH0sXG5cblx0b25Gb3JtQ2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlkQmFzZSA9ICd3aWRnZXQtJyArIHRoaXMubW9kZWwuZ2V0KCAnaWRfYmFzZScgKSxcblx0XHRcdHNldHRpbmdzID0gdGhpcy51aS5mb3JtLmVsZW1lbnRvclNlcmlhbGl6ZU9iamVjdCgpWyBpZEJhc2UgXS5SRVBMQUNFX1RPX0lEO1xuXG5cdFx0dGhpcy5zZXRWYWx1ZSggc2V0dGluZ3MgKTtcblx0fSxcblxuXHRvblJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHQvKlxuXHRcdGVsZW1lbnRvci5hamF4LnNlbmQoICdlZGl0b3JfZ2V0X3dwX3dpZGdldF9mb3JtJywge1xuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHR3aWRnZXRfdHlwZTogdGhpcy5tb2RlbC5nZXQoICd3aWRnZXQnICksXG5cdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KCB0aGlzLmVsZW1lbnRTZXR0aW5nc01vZGVsLnRvSlNPTigpIClcblx0XHRcdH0sXG5cdFx0XHRzdWNjZXNzOiBfLmJpbmQoIGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0XHR0aGlzLnVpLmZvcm0uaHRtbCggZGF0YSApO1xuXHRcdFx0fSwgdGhpcyApXG5cdFx0fSApO1xuXHRcdCovXG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sV1BXaWRnZXRJdGVtVmlldztcbiIsInZhciBDb250cm9sQmFzZUl0ZW1WaWV3ID0gcmVxdWlyZSggJ2VsZW1lbnRvci12aWV3cy9jb250cm9scy9iYXNlJyApLFxuXHRDb250cm9sV3lzaXd5Z0l0ZW1WaWV3O1xuXG5Db250cm9sV3lzaXd5Z0l0ZW1WaWV3ID0gQ29udHJvbEJhc2VJdGVtVmlldy5leHRlbmQoIHtcblxuXHRjaGlsZEV2ZW50czoge1xuXHRcdCdrZXl1cCB0ZXh0YXJlYS5lbGVtZW50b3Itd3AtZWRpdG9yJzogJ3VwZGF0ZUVsZW1lbnRNb2RlbCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRDb250cm9sQmFzZUl0ZW1WaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLmVkaXRvcklEID0gJ2VsZW1lbnRvcndwZWRpdG9yJyArIHRoaXMuY2lkO1xuXG5cdH0sXG5cdFxuXHRhdHRhY2hFbENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlZGl0b3JUZW1wbGF0ZSA9IGVsZW1lbnRvci5jb25maWcud3BfZWRpdG9yLnJlcGxhY2UoIC9lbGVtZW50b3J3cGVkaXRvci9nLCB0aGlzLmVkaXRvcklEICkucmVwbGFjZSggJyUlRURJVE9SQ09OVEVOVCUlJywgdGhpcy5nZXRDb250cm9sVmFsdWUoKSApO1xuXG5cdFx0dGhpcy4kZWwuaHRtbCggZWRpdG9yVGVtcGxhdGUgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdG9uU2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0dGlueW1jZS5FZGl0b3JNYW5hZ2VyLmV4ZWNDb21tYW5kKCdtY2VBZGRFZGl0b3InLCBmYWxzZSwgdGhpcy5lZGl0b3JJRCk7XG5cdH0sXG5cblx0b25CZWZvcmVEZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aW55bWNlLkVkaXRvck1hbmFnZXIuZXhlY0NvbW1hbmQoICdtY2VSZW1vdmVFZGl0b3InLCB0cnVlLCB0aGlzLmVkaXRvcklEKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xXeXNpd3lnSXRlbVZpZXc7XG4iLCJ2YXIgRWxlbWVudEVtcHR5VmlldztcblxuRWxlbWVudEVtcHR5VmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiAnI3RtcGwtZWxlbWVudG9yLWVtcHR5LXByZXZpZXcnLFxuXG5cdGNsYXNzTmFtZTogJ2VsZW1lbnRvci1lbXB0eS12aWV3JyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnb25DbGlja0FkZCdcblx0fSxcblxuXHRvbkNsaWNrQWRkOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IuZ2V0UGFuZWxWaWV3KCkuc2V0UGFnZSggJ2VsZW1lbnRzJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudEVtcHR5VmlldztcbiIsInZhciBCYXNlRWxlbWVudFZpZXcgPSByZXF1aXJlKCAnZWxlbWVudG9yLXZpZXdzL2Jhc2UtZWxlbWVudCcgKSxcblx0Q29sdW1uVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvY29sdW1uJyApLFxuXHRTZWN0aW9uVmlldztcblxuU2VjdGlvblZpZXcgPSBCYXNlRWxlbWVudFZpZXcuZXh0ZW5kKCB7XG5cdHRlbXBsYXRlOiBNYXJpb25ldHRlLlRlbXBsYXRlQ2FjaGUuZ2V0KCAnI3RtcGwtZWxlbWVudG9yLWVsZW1lbnQtc2VjdGlvbi1jb250ZW50JyApLFxuXG5cdGNoaWxkVmlldzogQ29sdW1uVmlldyxcblxuXHRjbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJ2VsZW1lbnRvci1zZWN0aW9uJyxcblx0XHRcdHR5cGUgPSB0aGlzLmlzSW5uZXIoKSA/ICdpbm5lcicgOiAndG9wJztcblxuXHRcdGNsYXNzZXMgKz0gJyBlbGVtZW50b3ItJyArIHR5cGUgKyAnLXNlY3Rpb24nO1xuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH0sXG5cblx0dGFnTmFtZTogJ3NlY3Rpb24nLFxuXG5cdGNoaWxkVmlld0NvbnRhaW5lcjogJz4gLmVsZW1lbnRvci1jb250YWluZXIgPiAuZWxlbWVudG9yLXJvdycsXG5cblx0dHJpZ2dlcnM6IHtcblx0XHQnY2xpY2sgLmVsZW1lbnRvci1lZGl0b3Itc2VjdGlvbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtZWRpdCc6ICdjbGljazplZGl0Jyxcblx0XHQnY2xpY2sgLmVsZW1lbnRvci1lZGl0b3Itc2VjdGlvbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtdHJpZ2dlcic6ICdjbGljazplZGl0Jyxcblx0XHQnY2xpY2sgLmVsZW1lbnRvci1lZGl0b3Itc2VjdGlvbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtZHVwbGljYXRlJzogJ2NsaWNrOmR1cGxpY2F0ZSdcblx0fSxcblxuXHRlbGVtZW50RXZlbnRzOiB7XG5cdFx0J2NsaWNrIC5lbGVtZW50b3ItZWRpdG9yLXNlY3Rpb24tc2V0dGluZ3MtbGlzdCAuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LXJlbW92ZSc6ICdvbkNsaWNrUmVtb3ZlJyxcblx0XHQnY2xpY2sgLmVsZW1lbnRvci1lZGl0b3Itc2VjdGlvbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtc2F2ZSc6ICdvbkNsaWNrU2F2ZSdcblx0fSxcblxuXHRiZWhhdmlvcnM6IHtcblx0XHRTb3J0YWJsZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvc29ydGFibGUnICksXG5cdFx0XHRlbENoaWxkVHlwZTogJ2NvbHVtbidcblx0XHR9LFxuXHRcdEhhbmRsZUR1cGxpY2F0ZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvaGFuZGxlLWR1cGxpY2F0ZScgKVxuXHRcdH0sXG5cdFx0SGFuZGxlRWRpdG9yOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9oYW5kbGUtZWRpdG9yJyApXG5cdFx0fSxcblx0XHRIYW5kbGVFZGl0TW9kZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvaGFuZGxlLWVkaXQtbW9kZScgKVxuXHRcdH0sXG5cdFx0SGFuZGxlQWRkTW9kZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvZHVwbGljYXRlJyApXG5cdFx0fSxcblx0XHRIYW5kbGVFbGVtZW50c1JlbGF0aW9uOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9lbGVtZW50cy1yZWxhdGlvbicgKVxuXHRcdH0sXG5cdFx0Q29udGV4dE1lbnU6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IHJlcXVpcmUoICdlbGVtZW50b3ItYmVoYXZpb3JzL2NvbnRleHQtbWVudScgKVxuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRCYXNlRWxlbWVudFZpZXcucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jb2xsZWN0aW9uLCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMuX2NoZWNrSXNGdWxsICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jb2xsZWN0aW9uLCAncmVtb3ZlJywgdGhpcy5vbkNvbGxlY3Rpb25SZW1vdmUgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnY2hhbmdlOnNldHRpbmdzOnN0cnVjdHVyZScsIHRoaXMub25TdHJ1Y3R1cmVDaGFuZ2VkICk7XG5cdH0sXG5cblx0YWRkRW1wdHlDb2x1bW46IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkQ2hpbGRNb2RlbCgge1xuXHRcdFx0aWQ6IGVsZW1lbnRvci5oZWxwZXJzLmdldFVuaXF1ZUlEKCksXG5cdFx0XHRlbFR5cGU6ICdjb2x1bW4nLFxuXHRcdFx0c2V0dGluZ3M6IHt9LFxuXHRcdFx0ZWxlbWVudHM6IFtdXG5cdFx0fSApO1xuXHR9LFxuXG5cdGFkZENoaWxkTW9kZWw6IGZ1bmN0aW9uKCBtb2RlbCwgb3B0aW9ucyApIHtcblx0XHR2YXIgaXNNb2RlbEluc3RhbmNlID0gbW9kZWwgaW5zdGFuY2VvZiBCYWNrYm9uZS5Nb2RlbCxcblx0XHRcdGlzSW5uZXIgPSB0aGlzLmlzSW5uZXIoKTtcblxuXHRcdGlmICggaXNNb2RlbEluc3RhbmNlICkge1xuXHRcdFx0bW9kZWwuc2V0KCAnaXNJbm5lcicsIGlzSW5uZXIgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW9kZWwuaXNJbm5lciA9IGlzSW5uZXI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEJhc2VFbGVtZW50Vmlldy5wcm90b3R5cGUuYWRkQ2hpbGRNb2RlbC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH0sXG5cblx0Z2V0U29ydGFibGVPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VjdGlvbkNvbm5lY3RDbGFzcyA9IHRoaXMuaXNJbm5lcigpID8gJy5lbGVtZW50b3ItaW5uZXItc2VjdGlvbicgOiAnLmVsZW1lbnRvci10b3Atc2VjdGlvbic7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29ubmVjdFdpdGg6IHNlY3Rpb25Db25uZWN0Q2xhc3MgKyAnID4gLmVsZW1lbnRvci1jb250YWluZXIgPiAuZWxlbWVudG9yLXJvdycsXG5cdFx0XHRoYW5kbGU6ICc+IC5lbGVtZW50b3ItZWxlbWVudC1vdmVybGF5IC5lbGVtZW50b3ItZWRpdG9yLWNvbHVtbi1zZXR0aW5ncy1saXN0IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtdHJpZ2dlcicsXG5cdFx0XHRpdGVtczogJz4gLmVsZW1lbnRvci1jb2x1bW4nXG5cdFx0fTtcblx0fSxcblxuXHRnZXRDb2x1bW5QZXJjZW50U2l6ZTogZnVuY3Rpb24oIGVsZW1lbnQsIHNpemUgKSB7XG5cdFx0cmV0dXJuIHNpemUgLyBlbGVtZW50LnBhcmVudCgpLndpZHRoKCkgKiAxMDA7XG5cdH0sXG5cblx0Z2V0RGVmYXVsdFN0cnVjdHVyZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY29sbGVjdGlvbi5sZW5ndGggKyAnMCc7XG5cdH0sXG5cblx0Z2V0U3RydWN0dXJlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tb2RlbC5nZXRTZXR0aW5nKCAnc3RydWN0dXJlJyApO1xuXHR9LFxuXG5cdHNldFN0cnVjdHVyZTogZnVuY3Rpb24oIHN0cnVjdHVyZSApIHtcblx0XHR2YXIgcGFyc2VkU3RydWN0dXJlID0gZWxlbWVudG9yLnByZXNldHNGYWN0b3J5LmdldFBhcnNlZFN0cnVjdHVyZSggc3RydWN0dXJlICk7XG5cblx0XHRpZiAoICtwYXJzZWRTdHJ1Y3R1cmUuY29sdW1uc0NvdW50ICE9PSB0aGlzLmNvbGxlY3Rpb24ubGVuZ3RoICkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvciggJ1RoZSBwcm92aWRlZCBzdHJ1Y3R1cmUgZG9lc25cXCd0IG1hdGNoIHRoZSBjb2x1bW5zIGNvdW50LicgKTtcblx0XHR9XG5cblx0XHR0aGlzLm1vZGVsLnNldFNldHRpbmcoICdzdHJ1Y3R1cmUnLCBzdHJ1Y3R1cmUsIHRydWUgKTtcblx0fSxcblxuXHRyZWRlZmluZUxheW91dDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHByZXNldCA9IGVsZW1lbnRvci5wcmVzZXRzRmFjdG9yeS5nZXRQcmVzZXRCeVN0cnVjdHVyZSggdGhpcy5nZXRTdHJ1Y3R1cmUoKSApO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCwgaW5kZXggKSB7XG5cdFx0XHRtb2RlbC5zZXRTZXR0aW5nKCAnX2NvbHVtbl9zaXplJywgcHJlc2V0LnByZXNldFsgaW5kZXggXSApO1xuXHRcdFx0bW9kZWwuc2V0U2V0dGluZyggJ19pbmxpbmVfc2l6ZScsIG51bGwgKTtcblx0XHR9ICk7XG5cblx0XHR0aGlzLmNoaWxkcmVuLmludm9rZSggJ2NoYW5nZVNpemVVSScgKTtcblx0fSxcblxuXHRyZXNldExheW91dDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRTdHJ1Y3R1cmUoIHRoaXMuZ2V0RGVmYXVsdFN0cnVjdHVyZSgpICk7XG5cdH0sXG5cblx0cmVzZXRDb2x1bW5zQ3VzdG9tU2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb2xsZWN0aW9uLmVhY2goIGZ1bmN0aW9uKCBtb2RlbCApIHtcblx0XHRcdG1vZGVsLnNldFNldHRpbmcoICdfaW5saW5lX3NpemUnLCBudWxsICk7XG5cdFx0fSApO1xuXG5cdFx0dGhpcy5jaGlsZHJlbi5pbnZva2UoICdjaGFuZ2VTaXplVUknICk7XG5cdH0sXG5cblx0aXNDb2xsZWN0aW9uRmlsbGVkOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgTUFYX1NJWkUgPSAxMCxcblx0XHRcdGNvbHVtbnNDb3VudCA9IHRoaXMuY29sbGVjdGlvbi5sZW5ndGg7XG5cblx0XHRyZXR1cm4gKCBNQVhfU0laRSA8PSBjb2x1bW5zQ291bnQgKTtcblx0fSxcblxuXHRfY2hlY2tJc0Z1bGw6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnRvZ2dsZUNsYXNzKCAnZWxlbWVudG9yLXNlY3Rpb24tZmlsbGVkJywgdGhpcy5pc0NvbGxlY3Rpb25GaWxsZWQoKSApO1xuXHR9LFxuXG5cdF9jaGVja0lzRW1wdHk6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggISB0aGlzLmNvbGxlY3Rpb24ubGVuZ3RoICkge1xuXHRcdFx0dGhpcy5hZGRFbXB0eUNvbHVtbigpO1xuXHRcdH1cblx0fSxcblxuXHRnZXROZXh0Q29sdW1uOiBmdW5jdGlvbiggY29sdW1uVmlldyApIHtcblx0XHR2YXIgbW9kZWxJbmRleCA9IHRoaXMuY29sbGVjdGlvbi5pbmRleE9mKCBjb2x1bW5WaWV3Lm1vZGVsICksXG5cdFx0XHRuZXh0TW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24uYXQoIG1vZGVsSW5kZXggKyAxICk7XG5cblx0XHRyZXR1cm4gdGhpcy5jaGlsZHJlbi5maW5kQnlNb2RlbENpZCggbmV4dE1vZGVsLmNpZCApO1xuXHR9LFxuXG5cdG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLl9jaGVja0lzRW1wdHkoKTtcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fY2hlY2tJc0Z1bGwoKTtcblx0fSxcblxuXHRvbkFkZENoaWxkOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICEgdGhpcy5pc0J1ZmZlcmluZyApIHtcblx0XHRcdC8vIFJlc2V0IHRoZSBsYXlvdXQganVzdCB3aGVuIHdlIGhhdmUgcmVhbGx5IGFkZC9yZW1vdmUgZWxlbWVudC5cblx0XHRcdHRoaXMucmVzZXRMYXlvdXQoKTtcblx0XHR9XG5cdH0sXG5cblx0b25Db2xsZWN0aW9uUmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHQvLyBJZiBpdCdzIHRoZSBsYXN0IGNvbHVtbiwgcGxlYXNlIGNyZWF0ZSBuZXcgb25lLlxuXHRcdHRoaXMuX2NoZWNrSXNFbXB0eSgpO1xuXG5cdFx0dGhpcy5yZXNldExheW91dCgpO1xuXHR9LFxuXG5cdG9uQ2hpbGR2aWV3UmVxdWVzdFJlc2l6ZVN0YXJ0OiBmdW5jdGlvbiggY2hpbGRWaWV3ICkge1xuXHRcdHZhciBuZXh0Q2hpbGRWaWV3ID0gdGhpcy5nZXROZXh0Q29sdW1uKCBjaGlsZFZpZXcgKTtcblxuXHRcdGlmICggISBuZXh0Q2hpbGRWaWV3ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciAkaWZyYW1lcyA9IGNoaWxkVmlldy4kZWwuZmluZCggJ2lmcmFtZScgKS5hZGQoIG5leHRDaGlsZFZpZXcuJGVsLmZpbmQoICdpZnJhbWUnICkgKTtcblxuXHRcdGVsZW1lbnRvci5oZWxwZXJzLmRpc2FibGVFbGVtZW50RXZlbnRzKCAkaWZyYW1lcyApO1xuXHR9LFxuXG5cdG9uQ2hpbGR2aWV3UmVxdWVzdFJlc2l6ZVN0b3A6IGZ1bmN0aW9uKCBjaGlsZFZpZXcgKSB7XG5cdFx0dmFyIG5leHRDaGlsZFZpZXcgPSB0aGlzLmdldE5leHRDb2x1bW4oIGNoaWxkVmlldyApO1xuXG5cdFx0aWYgKCAhIG5leHRDaGlsZFZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyICRpZnJhbWVzID0gY2hpbGRWaWV3LiRlbC5maW5kKCAnaWZyYW1lJyApLmFkZCggbmV4dENoaWxkVmlldy4kZWwuZmluZCggJ2lmcmFtZScgKSApO1xuXG5cdFx0ZWxlbWVudG9yLmhlbHBlcnMuZW5hYmxlRWxlbWVudEV2ZW50cyggJGlmcmFtZXMgKTtcblx0fSxcblxuXHRvbkNoaWxkdmlld1JlcXVlc3RSZXNpemU6IGZ1bmN0aW9uKCBjaGlsZFZpZXcsIHVpICkge1xuXHRcdC8vIEdldCBjdXJyZW50IGNvbHVtbiBkZXRhaWxzXG5cdFx0dmFyIGN1cnJlbnRTaXplID0gY2hpbGRWaWV3Lm1vZGVsLmdldFNldHRpbmcoICdfaW5saW5lX3NpemUnICk7XG5cblx0XHRpZiAoICEgY3VycmVudFNpemUgKSB7XG5cdFx0XHRjdXJyZW50U2l6ZSA9IHRoaXMuZ2V0Q29sdW1uUGVyY2VudFNpemUoIHVpLmVsZW1lbnQsIHVpLm9yaWdpbmFsU2l6ZS53aWR0aCApO1xuXHRcdH1cblxuXHRcdHZhciBuZXdTaXplID0gdGhpcy5nZXRDb2x1bW5QZXJjZW50U2l6ZSggdWkuZWxlbWVudCwgdWkuc2l6ZS53aWR0aCApLFxuXHRcdFx0ZGlmZmVyZW5jZSA9IG5ld1NpemUgLSBjdXJyZW50U2l6ZTtcblxuXHRcdHVpLmVsZW1lbnQuY3NzKCB7XG5cdFx0XHQvL3dpZHRoOiBjdXJyZW50U2l6ZSArICclJyxcblx0XHRcdHdpZHRoOiAnJyxcblx0XHRcdGxlZnQ6ICdpbml0aWFsJyAvLyBGaXggZm9yIFJUTCByZXNpemluZ1xuXHRcdH0gKTtcblxuXHRcdC8vIEdldCBuZXh0IGNvbHVtbiBkZXRhaWxzXG5cdFx0dmFyIG5leHRDaGlsZFZpZXcgPSB0aGlzLmdldE5leHRDb2x1bW4oIGNoaWxkVmlldyApO1xuXG5cdFx0aWYgKCAhIG5leHRDaGlsZFZpZXcgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIE1JTklNVU1fQ09MVU1OX1NJWkUgPSAxMCxcblxuXHRcdFx0JG5leHRFbGVtZW50ID0gbmV4dENoaWxkVmlldy4kZWwsXG5cdFx0XHRuZXh0RWxlbWVudEN1cnJlbnRTaXplID0gdGhpcy5nZXRDb2x1bW5QZXJjZW50U2l6ZSggJG5leHRFbGVtZW50LCAkbmV4dEVsZW1lbnQud2lkdGgoKSApLFxuXHRcdFx0bmV4dEVsZW1lbnROZXdTaXplID0gbmV4dEVsZW1lbnRDdXJyZW50U2l6ZSAtIGRpZmZlcmVuY2U7XG5cblx0XHRpZiAoIG5ld1NpemUgPCBNSU5JTVVNX0NPTFVNTl9TSVpFIHx8IG5ld1NpemUgPiAxMDAgfHwgISBkaWZmZXJlbmNlIHx8IG5leHRFbGVtZW50TmV3U2l6ZSA8IE1JTklNVU1fQ09MVU1OX1NJWkUgfHwgbmV4dEVsZW1lbnROZXdTaXplID4gMTAwICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNldCB0aGUgY3VycmVudCBjb2x1bW4gc2l6ZVxuXHRcdGNoaWxkVmlldy5tb2RlbC5zZXRTZXR0aW5nKCAnX2lubGluZV9zaXplJywgbmV3U2l6ZS50b0ZpeGVkKCAzICkgKTtcblx0XHRjaGlsZFZpZXcuY2hhbmdlU2l6ZVVJKCk7XG5cblx0XHQvLyBTZXQgdGhlIG5leHQgY29sdW1uIHNpemVcblx0XHRuZXh0Q2hpbGRWaWV3Lm1vZGVsLnNldFNldHRpbmcoICdfaW5saW5lX3NpemUnLCBuZXh0RWxlbWVudE5ld1NpemUudG9GaXhlZCggMyApICk7XG5cdFx0bmV4dENoaWxkVmlldy5jaGFuZ2VTaXplVUkoKTtcblx0fSxcblxuXHRvblN0cnVjdHVyZUNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVkZWZpbmVMYXlvdXQoKTtcblx0fSxcblxuXHRvbkNsaWNrU2F2ZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR2YXIgc2VjdGlvbklEID0gdGhpcy5tb2RlbC5nZXQoICdpZCcgKTtcblxuXHRcdGVsZW1lbnRvci50ZW1wbGF0ZXMuc3RhcnRNb2RhbCggZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50b3IudGVtcGxhdGVzLmdldExheW91dCgpLnNob3dTYXZlVGVtcGxhdGVWaWV3KCBzZWN0aW9uSUQgKTtcblx0XHR9ICk7XG5cdH0sXG5cblx0Z2V0Q29udGV4dE1lbnVHcm91cHMoKSB7XG5cdFx0Y29uc3QgZ3JvdXBzID0gW107XG5cblx0XHRjb25zdCAkc2V0dGluZ3MgPSB0aGlzLiRlbC5maW5kKFxuXHRcdFx0Jz4gLmVsZW1lbnRvci1lbGVtZW50LW92ZXJsYXkgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1zZXR0aW5ncydcblx0XHQpO1xuXG5cdFx0aWYgKCRzZXR0aW5ncy5sZW5ndGgpIHtcblx0XHRcdGNvbnN0IGFjdGlvbnMgPSBbXTtcblx0XHRcdGFjdGlvbnMucHVzaCh7XG5cdFx0XHRcdG5hbWU6ICdlZGl0Jyxcblx0XHRcdFx0dGl0bGU6IChlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSgnRWRpdCBTZWN0aW9uJykgOiAnRWRpdCBTZWN0aW9uJyksXG5cdFx0XHRcdGljb246ICc8aSBjbGFzcz1cImVpY29uLWVkaXRcIj48L2k+Jyxcblx0XHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnRyaWdnZXJNZXRob2QoJ2NsaWNrOmVkaXQnKTtcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCAkZHVwbGljYXRlID0gJHNldHRpbmdzLmZpbmQoJy5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtZHVwbGljYXRlJyk7XG5cdFx0XHRjb25zdCAkcmVtb3ZlID0gJHNldHRpbmdzLmZpbmQoJy5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtcmVtb3ZlJyk7XG5cdFx0XHRjb25zdCAkdGVtcGxhdGUgPSB0aGlzLiRlbC5maW5kKCcuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LXNhdmUnKTtcblxuXHRcdFx0aWYgKCRkdXBsaWNhdGUubGVuZ3RoKSB7XG5cdFx0XHRcdGFjdGlvbnMucHVzaCh7XG5cdFx0XHRcdFx0bmFtZTogJ2R1cGxpY2F0ZScsXG5cdFx0XHRcdFx0aWNvbjogJzxpIGNsYXNzPVwiZmEgZmEtY29weVwiPjwvaT4nLFxuXHRcdFx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSgnRHVwbGljYXRlJykgOiAnRHVwbGljYXRlJyxcblx0XHRcdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0JGR1cGxpY2F0ZS50cmlnZ2VyKCdjbGljaycpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoJHRlbXBsYXRlLmxlbmd0aCkge1xuXHRcdFx0XHRhY3Rpb25zLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6ICdzYXZlLWFzLXRlbXBsYXRlJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1zYXZlXCI+PC9pPicsXG5cdFx0XHRcdFx0c2VwYXJhdG9yOiAnYmVmb3JlJyxcblx0XHRcdFx0XHR0aXRsZTogZWxlbWVudG9yLnRyYW5zbGF0ZSA/IGVsZW1lbnRvci50cmFuc2xhdGUoJ1NhdmUgYXMgVGVtcGxhdGUnKSA6ICdTYXZlIGFzIFRlbXBsYXRlJyxcblx0XHRcdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0JHRlbXBsYXRlLnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICgkcmVtb3ZlLmxlbmd0aCkge1xuXHRcdFx0XHRhY3Rpb25zLnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6ICdkZWxldGUnLFxuXHRcdFx0XHRcdGljb246ICc8aSBjbGFzcz1cImZhIGZhLXRyYXNoXCI+PC9pPicsXG5cdFx0XHRcdFx0c2VwYXJhdG9yOiAnYmVmb3JlJyxcblx0XHRcdFx0XHR0aXRsZTogZWxlbWVudG9yLnRyYW5zbGF0ZSA/IGVsZW1lbnRvci50cmFuc2xhdGUoJ0RlbGV0ZScpIDogJ1N1cHByaW1lcicsXG5cdFx0XHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdCRyZW1vdmUudHJpZ2dlcignY2xpY2snKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGFjdGlvbnMubGVuZ3RoKSB7XG5cdFx0XHRcdGdyb3Vwcy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiAnZWxlbWVudCcsXG5cdFx0XHRcdFx0YWN0aW9ucyxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGdyb3Vwcztcblx0fSxcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWN0aW9uVmlldztcbiIsInZhciBTZWN0aW9uVmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3Mvc2VjdGlvbicgKSxcblx0U2VjdGlvbnNDb2xsZWN0aW9uVmlldztcblxuU2VjdGlvbnNDb2xsZWN0aW9uVmlldyA9IE1hcmlvbmV0dGUuQ29tcG9zaXRlVmlldy5leHRlbmQoIHtcblx0dGVtcGxhdGU6IE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItcHJldmlldycgKSxcblxuXHRpZDogJ2VsZW1lbnRvci1pbm5lcicsXG5cblx0Y2hpbGRWaWV3Q29udGFpbmVyOiAnI2VsZW1lbnRvci1zZWN0aW9uLXdyYXAnLFxuXG5cdGNoaWxkVmlldzogU2VjdGlvblZpZXcsXG5cblx0dWk6IHtcblx0XHRhZGRTZWN0aW9uQXJlYTogJyNlbGVtZW50b3ItYWRkLXNlY3Rpb24nLFxuXHRcdGFkZE5ld1NlY3Rpb246ICcjZWxlbWVudG9yLWFkZC1uZXctc2VjdGlvbicsXG5cdFx0Y2xvc2VQcmVzZXRzSWNvbjogJyNlbGVtZW50b3Itc2VsZWN0LXByZXNldC1jbG9zZScsXG5cdFx0YWRkU2VjdGlvbkJ1dHRvbjogJyNlbGVtZW50b3ItYWRkLXNlY3Rpb24tYnV0dG9uJyxcblx0XHRhZGRUZW1wbGF0ZUJ1dHRvbjogJyNlbGVtZW50b3ItYWRkLXRlbXBsYXRlLWJ1dHRvbicsXG5cdFx0c2VsZWN0UHJlc2V0OiAnI2VsZW1lbnRvci1zZWxlY3QtcHJlc2V0Jyxcblx0XHRwcmVzZXRzOiAnLmVsZW1lbnRvci1wcmVzZXQnXG5cdH0sXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrIEB1aS5hZGRTZWN0aW9uQnV0dG9uJzogJ29uQWRkU2VjdGlvbkJ1dHRvbkNsaWNrJyxcblx0XHQnY2xpY2sgQHVpLmFkZFRlbXBsYXRlQnV0dG9uJzogJ29uQWRkVGVtcGxhdGVCdXR0b25DbGljaycsXG5cdFx0J2NsaWNrIEB1aS5jbG9zZVByZXNldHNJY29uJzogJ2Nsb3NlU2VsZWN0UHJlc2V0cycsXG5cdFx0J2NsaWNrIEB1aS5wcmVzZXRzJzogJ29uUHJlc2V0U2VsZWN0ZWQnXG5cdH0sXG5cblx0YmVoYXZpb3JzOiB7XG5cdFx0U29ydGFibGU6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IHJlcXVpcmUoICdlbGVtZW50b3ItYmVoYXZpb3JzL3NvcnRhYmxlJyApLFxuXHRcdFx0ZWxDaGlsZFR5cGU6ICdzZWN0aW9uJ1xuXHRcdH0sXG5cdFx0SGFuZGxlRHVwbGljYXRlOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9oYW5kbGUtZHVwbGljYXRlJyApXG5cdFx0fSxcblx0XHRIYW5kbGVBZGQ6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IHJlcXVpcmUoICdlbGVtZW50b3ItYmVoYXZpb3JzL2R1cGxpY2F0ZScgKVxuXHRcdH0sXG5cdFx0SGFuZGxlRWxlbWVudHNSZWxhdGlvbjoge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvZWxlbWVudHMtcmVsYXRpb24nIClcblx0XHR9XG5cdH0sXG5cblx0Z2V0U29ydGFibGVPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aGFuZGxlOiAnPiAuZWxlbWVudG9yLWVsZW1lbnQtb3ZlcmxheSAuZWxlbWVudG9yLWVkaXRvci1zZWN0aW9uLXNldHRpbmdzLWxpc3QgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC10cmlnZ2VyJyxcblx0XHRcdGl0ZW1zOiAnPiAuZWxlbWVudG9yLXNlY3Rpb24nXG5cdFx0fTtcblx0fSxcblxuXHRnZXRDaGlsZFR5cGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBbICdzZWN0aW9uJyBdO1xuXHR9LFxuXG5cdGlzQ29sbGVjdGlvbkZpbGxlZDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXNcblx0XHRcdC5saXN0ZW5UbyggdGhpcy5jb2xsZWN0aW9uLCAnYWRkIHJlbW92ZSByZXNldCcsIHRoaXMub25Db2xsZWN0aW9uQ2hhbmdlZCApXG5cdFx0XHQubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5wYW5lbEVsZW1lbnRzLCAnZWxlbWVudDpkcmFnOnN0YXJ0JywgdGhpcy5vblBhbmVsRWxlbWVudERyYWdTdGFydCApXG5cdFx0XHQubGlzdGVuVG8oIGVsZW1lbnRvci5jaGFubmVscy5wYW5lbEVsZW1lbnRzLCAnZWxlbWVudDpkcmFnOmVuZCcsIHRoaXMub25QYW5lbEVsZW1lbnREcmFnRW5kICk7XG5cdH0sXG5cblx0YWRkQ2hpbGRNb2RlbDogZnVuY3Rpb24oIG1vZGVsLCBvcHRpb25zICkge1xuXHRcdHJldHVybiB0aGlzLmNvbGxlY3Rpb24uYWRkKCBtb2RlbCwgb3B0aW9ucywgdHJ1ZSApO1xuXHR9LFxuXG5cdGFkZFNlY3Rpb246IGZ1bmN0aW9uKCBwcm9wZXJ0aWVzICkge1xuXHRcdHZhciBuZXdTZWN0aW9uID0ge1xuXHRcdFx0aWQ6IGVsZW1lbnRvci5oZWxwZXJzLmdldFVuaXF1ZUlEKCksXG5cdFx0XHRlbFR5cGU6ICdzZWN0aW9uJyxcblx0XHRcdHNldHRpbmdzOiB7fSxcblx0XHRcdGVsZW1lbnRzOiBbXVxuXHRcdH07XG5cblx0XHRpZiAoIHByb3BlcnRpZXMgKSB7XG5cdFx0XHRfLmV4dGVuZCggbmV3U2VjdGlvbiwgcHJvcGVydGllcyApO1xuXHRcdH1cblxuXHRcdHZhciBuZXdNb2RlbCA9IHRoaXMuYWRkQ2hpbGRNb2RlbCggbmV3U2VjdGlvbiApO1xuXG5cdFx0cmV0dXJuIHRoaXMuY2hpbGRyZW4uZmluZEJ5TW9kZWxDaWQoIG5ld01vZGVsLmNpZCApO1xuXHR9LFxuXG5cdGNsb3NlU2VsZWN0UHJlc2V0czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5hZGROZXdTZWN0aW9uLnNob3coKTtcblx0XHR0aGlzLnVpLnNlbGVjdFByZXNldC5oaWRlKCk7XG5cdH0sXG5cblx0Zml4QmxhbmtQYWdlT2Zmc2V0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VjdGlvbkhhbmRsZUhlaWdodCA9IDI3LFxuXHRcdFx0ZWxUb3BPZmZzZXQgPSB0aGlzLiRlbC5vZmZzZXQoKS50b3AsXG5cdFx0XHRlbFRvcE9mZnNldFJhbmdlID0gc2VjdGlvbkhhbmRsZUhlaWdodCAtIGVsVG9wT2Zmc2V0O1xuXG5cdFx0aWYgKCAwIDwgZWxUb3BPZmZzZXRSYW5nZSApIHtcblx0XHRcdHZhciAkc3R5bGUgPSBCYWNrYm9uZS4kKCAnPHN0eWxlPicgKS50ZXh0KCAnLmVsZW1lbnRvci1lZGl0b3ItYWN0aXZlICNlbGVtZW50b3ItaW5uZXJ7bWFyZ2luLXRvcDogJyArIGVsVG9wT2Zmc2V0UmFuZ2UgKyAncHh9JyApO1xuXG5cdFx0XHRlbGVtZW50b3IuJHByZXZpZXdDb250ZW50cy5jaGlsZHJlbigpLmNoaWxkcmVuKCAnaGVhZCcgKS5hcHBlbmQoICRzdHlsZSApO1xuXHRcdH1cblx0fSxcblxuXHRvbkFkZFNlY3Rpb25CdXR0b25DbGljazogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51aS5hZGROZXdTZWN0aW9uLmhpZGUoKTtcblx0XHR0aGlzLnVpLnNlbGVjdFByZXNldC5zaG93KCk7XG5cdH0sXG5cblx0b25BZGRUZW1wbGF0ZUJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IudGVtcGxhdGVzLnN0YXJ0TW9kYWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudG9yLnRlbXBsYXRlcy5zaG93VGVtcGxhdGVzKCk7XG5cdFx0fSApO1xuXHR9LFxuXG5cdG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRzZWxmLnVpLmFkZFNlY3Rpb25BcmVhLmh0bWw1RHJvcHBhYmxlKCB7XG5cdFx0XHRheGlzOiBbICd2ZXJ0aWNhbCcgXSxcblx0XHRcdGdyb3VwczogWyAnZWxlbWVudG9yLWVsZW1lbnQnIF0sXG5cdFx0XHRvbkRyYWdFbnRlcjogZnVuY3Rpb24oIHNpZGUgKSB7XG5cdFx0XHRcdHNlbGYudWkuYWRkU2VjdGlvbkFyZWEuYXR0ciggJ2RhdGEtc2lkZScsIHNpZGUgKTtcblx0XHRcdH0sXG5cdFx0XHRvbkRyYWdMZWF2ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbGYudWkuYWRkU2VjdGlvbkFyZWEucmVtb3ZlQXR0ciggJ2RhdGEtc2lkZScgKTtcblx0XHRcdH0sXG5cdFx0XHRvbkRyb3BwaW5nOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGVsZW1lbnRWaWV3ID0gZWxlbWVudG9yLmNoYW5uZWxzLnBhbmVsRWxlbWVudHMucmVxdWVzdCggJ2VsZW1lbnQ6c2VsZWN0ZWQnICksXG5cdFx0XHRcdFx0bmV3U2VjdGlvbiA9IHNlbGYuYWRkU2VjdGlvbigpLFxuXHRcdFx0XHRcdGVsVHlwZSA9IGVsZW1lbnRWaWV3Lm1vZGVsLmdldCggJ2VsVHlwZScgKTtcblxuXHRcdFx0XHR2YXIgZWxlbWVudERhdGEgPSB7XG5cdFx0XHRcdFx0aWQ6IGVsZW1lbnRvci5oZWxwZXJzLmdldFVuaXF1ZUlEKCksXG5cdFx0XHRcdFx0ZWxUeXBlOiBlbFR5cGVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAoICd3aWRnZXQnID09PSBlbFR5cGUgKSB7XG5cdFx0XHRcdFx0ZWxlbWVudERhdGEud2lkZ2V0VHlwZSA9IGVsZW1lbnRWaWV3Lm1vZGVsLmdldCggJ3dpZGdldFR5cGUnICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZWxlbWVudERhdGEuZWxlbWVudHMgPSBbXTtcblx0XHRcdFx0XHRlbGVtZW50RGF0YS5pc0lubmVyID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG5ld1NlY3Rpb24udHJpZ2dlck1ldGhvZCggJ3JlcXVlc3Q6YWRkJywgZWxlbWVudERhdGEgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cblx0XHRfLmRlZmVyKCBfLmJpbmQoIHNlbGYuZml4QmxhbmtQYWdlT2Zmc2V0LCB0aGlzICkgKTtcblx0fSxcblxuXHRvbkNvbGxlY3Rpb25DaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3Iuc2V0RmxhZ0VkaXRvckNoYW5nZSggdHJ1ZSApO1xuXHR9LFxuXG5cdG9uUHJlc2V0U2VsZWN0ZWQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR0aGlzLmNsb3NlU2VsZWN0UHJlc2V0cygpO1xuXG5cdFx0dmFyIHNlbGVjdGVkU3RydWN0dXJlID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LnN0cnVjdHVyZSxcblx0XHRcdHBhcnNlZFN0cnVjdHVyZSA9IGVsZW1lbnRvci5wcmVzZXRzRmFjdG9yeS5nZXRQYXJzZWRTdHJ1Y3R1cmUoIHNlbGVjdGVkU3RydWN0dXJlICksXG5cdFx0XHRlbGVtZW50cyA9IFtdLFxuXHRcdFx0bG9vcEluZGV4O1xuXG5cdFx0Zm9yICggbG9vcEluZGV4ID0gMDsgbG9vcEluZGV4IDwgcGFyc2VkU3RydWN0dXJlLmNvbHVtbnNDb3VudDsgbG9vcEluZGV4KysgKSB7XG5cdFx0XHRlbGVtZW50cy5wdXNoKCB7XG5cdFx0XHRcdGlkOiBlbGVtZW50b3IuaGVscGVycy5nZXRVbmlxdWVJRCgpLFxuXHRcdFx0XHRlbFR5cGU6ICdjb2x1bW4nLFxuXHRcdFx0XHRzZXR0aW5nczoge30sXG5cdFx0XHRcdGVsZW1lbnRzOiBbXVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHZhciBuZXdTZWN0aW9uID0gdGhpcy5hZGRTZWN0aW9uKCB7IGVsZW1lbnRzOiBlbGVtZW50cyB9ICk7XG5cblx0XHRuZXdTZWN0aW9uLnNldFN0cnVjdHVyZSggc2VsZWN0ZWRTdHJ1Y3R1cmUgKTtcblx0XHRuZXdTZWN0aW9uLnJlZGVmaW5lTGF5b3V0KCk7XG5cdH0sXG5cblx0b25QYW5lbEVsZW1lbnREcmFnU3RhcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdGVsZW1lbnRvci5oZWxwZXJzLmRpc2FibGVFbGVtZW50RXZlbnRzKCB0aGlzLiRlbC5maW5kKCAnaWZyYW1lJyApICk7XG5cdH0sXG5cblx0b25QYW5lbEVsZW1lbnREcmFnRW5kOiBmdW5jdGlvbigpIHtcblx0XHRlbGVtZW50b3IuaGVscGVycy5lbmFibGVFbGVtZW50RXZlbnRzKCB0aGlzLiRlbC5maW5kKCAnaWZyYW1lJyApICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWN0aW9uc0NvbGxlY3Rpb25WaWV3O1xuIiwidmFyIEJhc2VFbGVtZW50VmlldyA9IHJlcXVpcmUoICdlbGVtZW50b3Itdmlld3MvYmFzZS1lbGVtZW50JyApLFxuXHRXaWRnZXRWaWV3O1xuXG5XaWRnZXRWaWV3ID0gQmFzZUVsZW1lbnRWaWV3LmV4dGVuZCgge1xuXHRfdGVtcGxhdGVUeXBlOiBudWxsLFxuXG5cdGdldFRlbXBsYXRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoICdyZW1vdGUnICE9PSB0aGlzLmdldFRlbXBsYXRlVHlwZSgpICkge1xuXHRcdFx0cmV0dXJuIE1hcmlvbmV0dGUuVGVtcGxhdGVDYWNoZS5nZXQoICcjdG1wbC1lbGVtZW50b3ItJyArIHRoaXMubW9kZWwuZ2V0KCAnZWxUeXBlJyApICsgJy0nICsgdGhpcy5tb2RlbC5nZXQoICd3aWRnZXRUeXBlJyApICsgJy1jb250ZW50JyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gXy50ZW1wbGF0ZSggJycgKTtcblx0XHR9XG5cdH0sXG5cblx0Y2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VsZW1lbnRvci13aWRnZXQgZWxlbWVudG9yLXdpZGdldC0nICsgdGhpcy5tb2RlbC5nZXQoICd3aWRnZXRUeXBlJyApO1xuXHR9LFxuXG5cdG1vZGVsRXZlbnRzOiB7XG5cdFx0J2JlZm9yZTpyZW1vdGU6cmVuZGVyJzogJ29uTW9kZWxCZWZvcmVSZW1vdGVSZW5kZXInLFxuXHRcdCdyZW1vdGU6cmVuZGVyJzogJ29uTW9kZWxSZW1vdGVSZW5kZXInXG5cdH0sXG5cblx0dHJpZ2dlcnM6IHtcblx0XHQnY2xpY2snOiB7XG5cdFx0XHRldmVudDogJ2NsaWNrOmVkaXQnLFxuXHRcdFx0c3RvcFByb3BhZ2F0aW9uOiBmYWxzZVxuXHRcdH0sXG5cdFx0J2NsaWNrID4gLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1zZXR0aW5ncyAuZWxlbWVudG9yLWVkaXRvci1hZGQtZWxlbWVudCc6ICdjbGljazphZGQnLFxuXHRcdCdjbGljayA+IC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtc2V0dGluZ3MgLmVsZW1lbnRvci1lZGl0b3ItZWxlbWVudC1kdXBsaWNhdGUnOiAnY2xpY2s6ZHVwbGljYXRlJ1xuXHR9LFxuXG5cdGVsZW1lbnRFdmVudHM6IHtcblx0XHQnY2xpY2sgPiAuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LXNldHRpbmdzIC5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtcmVtb3ZlJzogJ29uQ2xpY2tSZW1vdmUnXG5cdH0sXG5cblx0YmVoYXZpb3JzOiB7XG5cdFx0SGFuZGxlRWRpdG9yOiB7XG5cdFx0XHRiZWhhdmlvckNsYXNzOiByZXF1aXJlKCAnZWxlbWVudG9yLWJlaGF2aW9ycy9oYW5kbGUtZWRpdG9yJyApXG5cdFx0fSxcblx0XHRIYW5kbGVFZGl0TW9kZToge1xuXHRcdFx0YmVoYXZpb3JDbGFzczogcmVxdWlyZSggJ2VsZW1lbnRvci1iZWhhdmlvcnMvaGFuZGxlLWVkaXQtbW9kZScgKVxuXHRcdH0sXG5cdFx0Q29udGV4dE1lbnU6IHtcblx0XHRcdGJlaGF2aW9yQ2xhc3M6IHJlcXVpcmUoICdlbGVtZW50b3ItYmVoYXZpb3JzL2NvbnRleHQtbWVudScgKVxuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRCYXNlRWxlbWVudFZpZXcucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG5cdFx0aWYgKCAncmVtb3RlJyA9PT0gdGhpcy5nZXRUZW1wbGF0ZVR5cGUoKSAmJiAgISB0aGlzLm1vZGVsLmdldEh0bWxDYWNoZSgpICkge1xuXHRcdFx0dGhpcy5tb2RlbC5yZW5kZXJSZW1vdGVTZXJ2ZXIoKTtcblx0XHR9XG5cdH0sXG5cblx0Z2V0VGVtcGxhdGVUeXBlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIG51bGwgPT09IHRoaXMuX3RlbXBsYXRlVHlwZSApIHtcblx0XHRcdHZhciAkdGVtcGxhdGUgPSBCYWNrYm9uZS4kKCAnI3RtcGwtZWxlbWVudG9yLScgKyB0aGlzLm1vZGVsLmdldCggJ2VsVHlwZScgKSArICctJyArIHRoaXMubW9kZWwuZ2V0KCAnd2lkZ2V0VHlwZScgKSArICctY29udGVudCcgKTtcblxuXHRcdFx0aWYgKCAwID09PSAkdGVtcGxhdGUubGVuZ3RoICkge1xuXHRcdFx0XHR0aGlzLl90ZW1wbGF0ZVR5cGUgPSAncmVtb3RlJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3RlbXBsYXRlVHlwZSA9ICdqcyc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX3RlbXBsYXRlVHlwZTtcblx0fSxcblxuXHRvbk1vZGVsQmVmb3JlUmVtb3RlUmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2VsZW1lbnRvci1sb2FkaW5nJyApO1xuXHR9LFxuXG5cdG9uQmVmb3JlRGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gUGFyZW50IGhhbmRsZXMgJHN0eWxlc2hlZXRFbGVtZW50IGFuZCAkY3VzdG9tQ1NTRWxlbWVudCBjbGVhbnVwXG5cdFx0QmFzZUVsZW1lbnRWaWV3LnByb3RvdHlwZS5vbkJlZm9yZURlc3Ryb3kuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9LFxuXG5cdG9uTW9kZWxSZW1vdGVSZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5pc0Rlc3Ryb3llZCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci1sb2FkaW5nJyApO1xuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0YXR0YWNoRWxDb250ZW50OiBmdW5jdGlvbiggaHRtbCApIHtcblx0XHR2YXIgaHRtbENhY2hlID0gdGhpcy5tb2RlbC5nZXRIdG1sQ2FjaGUoKTtcblxuXHRcdGlmICggaHRtbENhY2hlICkge1xuXHRcdFx0aHRtbCA9IGh0bWxDYWNoZTtcblx0XHR9XG5cblx0XHQvL3RoaXMuJGVsLmh0bWwoIGh0bWwgKTtcblx0XHRfLmRlZmVyKCBfLmJpbmQoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudG9yRnJvbnRlbmQuZ2V0U2NvcGVXaW5kb3coKS5qUXVlcnkoICcjJyArIHRoaXMuZ2V0RWxlbWVudFVuaXF1ZUNsYXNzKCkgKS5odG1sKCBodG1sICk7XG5cdFx0fSwgdGhpcyApICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRvblJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0c2VsZi4kZWxcblx0XHRcdC5yZW1vdmVDbGFzcyggJ2VsZW1lbnRvci13aWRnZXQtZW1wdHknIClcblx0XHRcdC5jaGlsZHJlbiggJy5lbGVtZW50b3Itd2lkZ2V0LWVtcHR5LWljb24nIClcblx0XHRcdC5yZW1vdmUoKTtcblxuXHRcdC8vc2VsZi4kZWwuaW1hZ2VzTG9hZGVkKCkuYWx3YXlzKCBmdW5jdGlvbigpIHtcblxuXHRcdC8vc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vXHRpZiAoIDEgPiBzZWxmLiRlbC5oZWlnaHQoKSApIHtcblx0XHRcdFx0XHQvL1x0c2VsZi4kZWwuYWRkQ2xhc3MoICdlbGVtZW50b3Itd2lkZ2V0LWVtcHR5JyApO1xuXG5cdFx0XHRcdFx0Ly8gVE9ETzogUkVNT1ZFIFRISVMgISFcblx0XHRcdFx0XHQvLyBURU1QIENPRElORyAhIVxuXHRcdFx0XHRcdC8vXHRzZWxmLiRlbC5hcHBlbmQoICc8aSBjbGFzcz1cImVsZW1lbnRvci13aWRnZXQtZW1wdHktaWNvbiBlaWNvbi0nICsgc2VsZi5tb2RlbC5nZXRJY29uKCkgKyAnXCI+PC9pPicgKTtcblx0XHRcdFx0XHQvL1x0fVxuXHRcdFx0XHQvL30sIDIwMCApO1xuXHRcdFx0Ly8gSXMgZWxlbWVudCBlbXB0eT9cblx0XHQvL30gKTtcblx0fSxcblx0Z2V0Q29udGV4dE1lbnVHcm91cHMoKSB7XG5cdFx0Y29uc3QgZ3JvdXBzID0gW107XG5cblx0XHRjb25zdCAkc2V0dGluZ3MgPSB0aGlzLiRlbC5maW5kKFxuXHRcdFx0Jy5lbGVtZW50b3ItZWRpdG9yLWVsZW1lbnQtc2V0dGluZ3MnXG5cdFx0KTtcblxuXHRcdGlmICgkc2V0dGluZ3MubGVuZ3RoKSB7XG5cdFx0XHRjb25zdCBhY3Rpb25zID0gW107XG5cblx0XHRcdGNvbnN0IGVsZW1lbnRUaXRsZSA9ICRzZXR0aW5ncy5hdHRyKCdkYXRhLXRpdGxlJykgfHwgJ1dpZGdldCc7XG5cblx0XHRcdGFjdGlvbnMucHVzaCh7XG5cdFx0XHQgICAgbmFtZTogJ2VkaXQnLFxuXHRcdFx0ICAgIHRpdGxlOiAoZWxlbWVudG9yLnRyYW5zbGF0ZSA/IGVsZW1lbnRvci50cmFuc2xhdGUoJ0VkaXQnKSA6ICdFZGl0JykgKyAnICcgKyBlbGVtZW50VGl0bGUsXG5cdFx0XHQgICAgaWNvbjogJzxpIGNsYXNzPVwiZWljb24tZWRpdFwiPjwvaT4nLFxuXHRcdFx0ICAgIGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHQgICAgICAgIHRoaXMudHJpZ2dlck1ldGhvZCgnY2xpY2s6ZWRpdCcpO1xuXHRcdFx0ICAgIH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgJGR1cGxpY2F0ZSA9ICRzZXR0aW5ncy5maW5kKCcuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LWR1cGxpY2F0ZScpO1xuXHRcdFx0Y29uc3QgJHJlbW92ZSA9ICRzZXR0aW5ncy5maW5kKCcuZWxlbWVudG9yLWVkaXRvci1lbGVtZW50LXJlbW92ZScpO1xuXG5cdFx0XHRpZiAoJGR1cGxpY2F0ZS5sZW5ndGgpIHtcblx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiAnZHVwbGljYXRlJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1jb3B5XCI+PC9pPicsXG5cdFx0XHRcdFx0dGl0bGU6IGVsZW1lbnRvci50cmFuc2xhdGUgPyBlbGVtZW50b3IudHJhbnNsYXRlKCdEdXBsaWNhdGUnKSA6ICdEdXBsaWNhdGUnLFxuXHRcdFx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHQkZHVwbGljYXRlLnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGFjdGlvbnMucHVzaChcblx0XHRcdFx0cmVxdWlyZSggJ2VsZW1lbnRvci11dGlscy9hY3Rpb25zL2NvcHknICkoIHRoaXMsIHtcblx0XHRcdFx0XHRzZXBhcmF0b3I6ICdiZWZvcmUnLFxuXHRcdFx0XHR9KVxuXHRcdFx0KTtcblxuXHRcdFx0YWN0aW9ucy5wdXNoKFxuXHRcdFx0XHRyZXF1aXJlKCAnZWxlbWVudG9yLXV0aWxzL2FjdGlvbnMvcGFzdGUtc3R5bGVzJyApKCB0aGlzKVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gLS0tIFN0eWxlIExpYnJhcnkgYWN0aW9ucyAtLS1cblx0XHRcdHZhciB3aWRnZXRWaWV3ID0gdGhpcztcblx0XHRcdHZhciB3aWRnZXRUeXBlID0gdGhpcy5tb2RlbC5nZXQoICd3aWRnZXRUeXBlJyApO1xuXG5cdFx0XHQvLyBcIlNhdmUgc3R5bGVzIGFzLi4uXCJcblx0XHRcdGFjdGlvbnMucHVzaCgge1xuXHRcdFx0XHRuYW1lOiAnc2F2ZV9zdHlsZV9hcycsXG5cdFx0XHRcdGljb246ICc8aSBjbGFzcz1cImZhIGZhLWZsb3BweS1vXCI+PC9pPicsXG5cdFx0XHRcdHNlcGFyYXRvcjogJ2JlZm9yZScsXG5cdFx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSggJ3NhdmVfc3R5bGVfYXMnICkgOiAnU2F2ZSBzdHlsZXMgYXMuLi4nLFxuXHRcdFx0XHRjYWxsYmFjazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyIHNldHRpbmdzTW9kZWwgPSB3aWRnZXRWaWV3Lm1vZGVsLmdldCggJ3NldHRpbmdzJyApO1xuXHRcdFx0XHRcdHZhciBzZXR0aW5ncyA9IHNldHRpbmdzTW9kZWwgJiYgdHlwZW9mIHNldHRpbmdzTW9kZWwudG9KU09OID09PSAnZnVuY3Rpb24nXG5cdFx0XHRcdFx0XHQ/IHNldHRpbmdzTW9kZWwudG9KU09OKClcblx0XHRcdFx0XHRcdDoge307XG5cblx0XHRcdFx0XHRlbGVtZW50b3Iuc3R5bGVMaWJyYXJ5LnN0YXJ0TW9kYWwoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5zaG93U2F2ZVN0eWxlVmlldyggd2lkZ2V0VHlwZSwgc2V0dGluZ3MgKTtcblx0XHRcdFx0XHR9ICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblxuXHRcdFx0Ly8gXCJVc2Ugc3R5bGVcIiDigJQgbGlzdCBhdmFpbGFibGUgc3R5bGVzIGZvciB0aGlzIHdpZGdldCB0eXBlXG5cdFx0XHR2YXIgd2lkZ2V0U3R5bGVzID0gZWxlbWVudG9yLnN0eWxlTGlicmFyeS5nZXRTdHlsZXNGb3JXaWRnZXQoIHdpZGdldFR5cGUgKTtcblxuXHRcdFx0aWYgKCB3aWRnZXRTdHlsZXMubGVuZ3RoICkge1xuXHRcdFx0XHR3aWRnZXRTdHlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHN0eWxlTW9kZWwsIGluZGV4ICkge1xuXHRcdFx0XHRcdHZhciBzdHlsZU5hbWUgPSBzdHlsZU1vZGVsLmdldCggJ25hbWUnICk7XG5cdFx0XHRcdFx0dmFyIGlzRGVmYXVsdCA9IHN0eWxlTW9kZWwuZ2V0KCAnaXNfZGVmYXVsdCcgKTtcblxuXHRcdFx0XHRcdGFjdGlvbnMucHVzaCgge1xuXHRcdFx0XHRcdFx0bmFtZTogJ3VzZV9zdHlsZV8nICsgc3R5bGVNb2RlbC5nZXQoICdpZF93aWRnZXRfc3R5bGUnICksXG5cdFx0XHRcdFx0XHRpY29uOiBpc0RlZmF1bHRcblx0XHRcdFx0XHRcdFx0PyAnPGkgY2xhc3M9XCJmYSBmYS1zdGFyXCI+PC9pPidcblx0XHRcdFx0XHRcdFx0OiAnPGkgY2xhc3M9XCJmYSBmYS1wYWludC1icnVzaFwiPjwvaT4nLFxuXHRcdFx0XHRcdFx0dGl0bGU6IHN0eWxlTmFtZSxcblx0XHRcdFx0XHRcdGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0ZWxlbWVudG9yLnN0eWxlTGlicmFyeS5hcHBseVN0eWxlKCBzdHlsZU1vZGVsLCB3aWRnZXRWaWV3Lm1vZGVsICk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSApO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhY3Rpb25zLnB1c2goIHtcblx0XHRcdFx0XHRuYW1lOiAnbm9fc3R5bGVzJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS1wYWludC1icnVzaFwiPjwvaT4nLFxuXHRcdFx0XHRcdHRpdGxlOiBlbGVtZW50b3IudHJhbnNsYXRlID8gZWxlbWVudG9yLnRyYW5zbGF0ZSggJ25vX3N0eWxlc19mb3Jfd2lkZ2V0JyApIDogJ05vIHNhdmVkIHN0eWxlcycsXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uKCkge31cblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoJHJlbW92ZS5sZW5ndGgpIHtcblx0XHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0XHRuYW1lOiAnZGVsZXRlJyxcblx0XHRcdFx0XHRpY29uOiAnPGkgY2xhc3M9XCJmYSBmYS10cmFzaFwiPjwvaT4nLFxuXHRcdFx0XHRcdHNlcGFyYXRvcjogJ2JlZm9yZScsXG5cdFx0XHRcdFx0dGl0bGU6IGVsZW1lbnRvci50cmFuc2xhdGUgPyBlbGVtZW50b3IudHJhbnNsYXRlKCdEZWxldGUnKSA6ICdTdXBwcmltZXInLFxuXHRcdFx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHQkcmVtb3ZlLnRyaWdnZXIoJ2NsaWNrJyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhY3Rpb25zLmxlbmd0aCkge1xuXHRcdFx0XHRncm91cHMucHVzaCh7XG5cdFx0XHRcdFx0bmFtZTogJ2VsZW1lbnQnLFxuXHRcdFx0XHRcdGFjdGlvbnMsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBncm91cHM7XG5cdH0sXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gV2lkZ2V0VmlldztcbiJdfQ==
