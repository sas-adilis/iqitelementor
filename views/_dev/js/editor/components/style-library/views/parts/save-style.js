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
