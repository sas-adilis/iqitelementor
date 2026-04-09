var StyleLibraryHeaderView;

StyleLibraryHeaderView = Marionette.LayoutView.extend( {
	id: 'elementor-style-library-header',

	template: '#tmpl-elementor-style-library-header',

	regions: {
		logoArea: '#elementor-style-library-header-logo-area',
		tools: '#elementor-style-library-header-tools',
		tools2: '#elementor-style-library-header-tools2',
		menuArea: '#elementor-style-library-header-menu-area'
	},

	ui: {
		closeModal: '#elementor-style-library-header-close-modal'
	},

	events: {
		'click @ui.closeModal': 'onCloseModalClick'
	},

	onCloseModalClick: function() {
		elementor.styleLibrary.getModal().hide();
	}
} );

module.exports = StyleLibraryHeaderView;
