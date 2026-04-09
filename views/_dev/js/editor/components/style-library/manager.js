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
