var TemplateLibraryHeaderLoadView;

TemplateLibraryHeaderLoadView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-template-library-header-load',

	id: 'elementor-template-library-header-load',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.templates.getLayout().showLoadTemplateView();
	}
} );

module.exports = TemplateLibraryHeaderLoadView;
