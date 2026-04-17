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

		// Check if a style with same name + widget type already exists
		var existing = elementor.styleLibrary.findStyleByName( widgetType, name );

		if ( existing ) {
			var dialog = elementor.dialogsManager.createWidget( 'confirm', {
				headerMessage: elementor.translate( 'style_replace_title' ),
				message: elementor.translate( 'style_replace_confirm' ),
				strings: {
					confirm: elementor.translate( 'style_replace_yes' ),
					cancel: elementor.translate( 'cancel' )
				},
				onConfirm: function() {
					self._doSave( widgetType, name, settings, existing.get( 'id_widget_style' ) );
				}
			} );
			dialog.show();
		} else {
			self._doSave( widgetType, name, settings );
		}
	},

	_doSave: function( widgetType, name, settings, replaceId ) {
		var self = this;

		self.ui.submitButton.addClass( 'elementor-btn-state' );

		elementor.styleLibrary.saveStyle( widgetType, name, settings, function() {
			self.ui.submitButton.removeClass( 'elementor-btn-state' );
			elementor.showToast( elementor.translate( 'style_saved' ), 'success' );
			elementor.styleLibrary.showStyles();
		}, function() {
			self.ui.submitButton.removeClass( 'elementor-btn-state' );
			elementor.showToast( elementor.translate( 'an_error_occurred' ), 'error' );
		}, replaceId );
	}
} );

module.exports = StyleLibrarySaveView;
