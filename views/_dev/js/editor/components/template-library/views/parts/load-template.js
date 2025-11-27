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

		this.ui.submitButton.addClass( 'elementor-button-state' );

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
