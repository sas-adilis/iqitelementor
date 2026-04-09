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