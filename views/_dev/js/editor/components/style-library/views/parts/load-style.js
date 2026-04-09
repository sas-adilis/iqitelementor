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
