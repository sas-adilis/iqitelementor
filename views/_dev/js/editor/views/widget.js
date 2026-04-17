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
			var styleFilter = require( 'elementor-utils/style-filter' );

			actions.push( {
				name: 'save_style_as',
				icon: '<i class="fa fa-floppy-o"></i>',
				separator: 'before',
				title: elementor.translate ? elementor.translate( 'save_style_as' ) : 'Save styles as...',
				callback: function() {
					var settingsModel = widgetView.model.get( 'settings' );
					var allSettings = settingsModel && typeof settingsModel.toJSON === 'function'
						? settingsModel.toJSON()
						: {};
					var settings = styleFilter.filterStyleSettings( widgetType, allSettings );

					elementor.styleLibrary.startModal( function() {
						elementor.styleLibrary.showSaveStyleView( widgetType, settings );
					} );
				}
			} );

			// "Apply style" — submenu with available styles for this widget type
			var widgetStyles = elementor.styleLibrary.getStylesForWidget( widgetType );

			if ( widgetStyles.length ) {
				var styleChildren = [];

				// Default first, then alphabetical
				widgetStyles.sort( function( a, b ) {
					var aDefault = a.get( 'is_default' ) ? 1 : 0;
					var bDefault = b.get( 'is_default' ) ? 1 : 0;
					if ( aDefault !== bDefault ) {
						return bDefault - aDefault;
					}
					return ( a.get( 'name' ) || '' ).localeCompare( b.get( 'name' ) || '' );
				} );

				widgetStyles.forEach( function( styleModel ) {
					var styleName = styleModel.get( 'name' );
					var isDefault = styleModel.get( 'is_default' );

					styleChildren.push( {
						name: 'use_style_' + styleModel.get( 'id_widget_style' ),
						icon: isDefault
							? '<i class="fa fa-star"></i>'
							: '<i class="fa fa-paint-brush"></i>',
						title: styleName,
						className: isDefault ? 'iqit-context-submenu-default' : '',
						callback: function() {
							elementor.styleLibrary.applyStyle( styleModel, widgetView.model );
						}
					} );
				} );

				actions.push( {
					name: 'apply_style',
					icon: '<i class="fa fa-paint-brush"></i>',
					title: elementor.translate ? elementor.translate( 'use_style' ) : 'Apply style',
					children: styleChildren
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
