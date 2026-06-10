var BaseElementView = require( 'elementor-views/base-element' ),
	ElementEmptyView = require( 'elementor-views/element-empty' ),
	WidgetView = require( 'elementor-views/widget' ),
	TabView;

TabView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-elementor-element-tab-content' ),

	className: function() {
		return 'elementor-tab-content';
	},

	elementEvents: {
		'click > .elementor-element-overlay .elementor-editor-tab-settings-list .elementor-editor-element-remove': 'onClickRemove',
		'click > .elementor-element-overlay .elementor-editor-tab-settings-list .elementor-editor-element-duplicate': 'onClickDuplicate',
		'click > .elementor-element-overlay .elementor-editor-tab-settings-list .elementor-editor-element-add': 'onClickAddTab'
	},

	triggers: {
		'click > .elementor-element-overlay .elementor-editor-tab-settings-list .elementor-editor-element-edit': 'click:edit'
	},

	getChildView: function( model ) {
		if ( 'section' === model.get( 'elType' ) ) {
			return require( 'elementor-views/section' );
		}

		return WidgetView;
	},

	emptyView: ElementEmptyView,

	childViewContainer: '> .elementor-tab-content-wrap > .elementor-widget-wrap',

	behaviors: {
		Sortable: {
			behaviorClass: require( 'elementor-behaviors/sortable' ),
			elChildType: 'widget'
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

		// Re-render tabs nav when title/icon of this tab changes
		this.listenTo( this.model.get( 'settings' ), 'change:tab_title change:tab_icon', this.onTitleChanged );
	},

	onTitleChanged: function() {
		// Ask parent Tabs view to refresh nav
		if ( this.options && this.options.parentTabsView && _.isFunction( this.options.parentTabsView.renderNav ) ) {
			this.options.parentTabsView.renderNav();
		} else {
			// Fallback: walk up the DOM to find the .elementor-tabs-wrapper and trigger via event
			this.triggerMethod( 'tab:title:changed' );
		}
	},

	isDroppingAllowed: function() {
		var elementView = elementor.channels.panelElements.request( 'element:selected' ),
			elType = elementView.model.get( 'elType' );

		if ( 'section' === elType ) {
			return true;
		}

		return 'widget' === elType;
	},

	getSortableOptions: function() {
		return {
			connectWith: '.elementor-widget-wrap',
			items: '> .elementor-element'
		};
	},

	onWidgetDragStart: function() {
		this.$el.addClass( 'elementor-dragging' );
	},

	onWidgetDragEnd: function() {
		this.$el.removeClass( 'elementor-dragging' );
	},

	onClickAddTab: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		if ( this.options && this.options.parentTabsView && _.isFunction( this.options.parentTabsView.addEmptyTab ) ) {
			this.options.parentTabsView.addEmptyTab();
		}
	},

	onClickDuplicate: function( event ) {
		event.preventDefault();
		event.stopPropagation();
		this.triggerMethod( 'request:duplicate' );
	},

	onRender: function() {
		var self = this;

		self.$el.html5Droppable( {
			items: ' > .elementor-tab-content-wrap > .elementor-widget-wrap > .elementor-element, > .elementor-tab-content-wrap > .elementor-widget-wrap > .elementor-empty-view > .elementor-first-add',
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
	}
} );

module.exports = TabView;
