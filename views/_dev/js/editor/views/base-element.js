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
		var styleText = this.stylesheet.toString();

		if ( _.isEmpty( styleText ) && ! this.$stylesheetElement ) {
			return;
		}

		if ( ! this.$stylesheetElement ) {
			this.createStylesheetElement();
		}

		this.$stylesheetElement.text( styleText );
	},

	createStylesheetElement: function() {
		this.$stylesheetElement = Backbone.$( '<style>', { id: 'elementor-style-' + this.model.cid } );

		elementor.$previewContents.find( 'head' ).append( this.$stylesheetElement );
	},

	renderCustomClasses: function() {
		this.$el.addClass( 'elementor-element' );

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
		this.enqueueFonts();
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


                    if ( '' === parsedValue ) {
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