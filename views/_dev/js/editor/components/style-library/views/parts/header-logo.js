var StyleLibraryHeaderLogoView;

StyleLibraryHeaderLogoView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-logo',

	id: 'elementor-style-library-header-logo',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.showStyles();
	}
} );

module.exports = StyleLibraryHeaderLogoView;
