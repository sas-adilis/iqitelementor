var StyleLibraryHeaderLoadView;

StyleLibraryHeaderLoadView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-load',

	id: 'elementor-style-library-header-load',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.getLayout().showLoadStyleView();
	}
} );

module.exports = StyleLibraryHeaderLoadView;
