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
