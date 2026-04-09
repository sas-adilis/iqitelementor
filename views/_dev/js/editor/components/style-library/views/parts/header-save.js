var StyleLibraryHeaderSaveView;

StyleLibraryHeaderSaveView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-header-save',

	id: 'elementor-style-library-header-save',

	className: 'elementor-template-library-header-item',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		elementor.styleLibrary.getLayout().showSaveStyleView( '', {} );
	}
} );

module.exports = StyleLibraryHeaderSaveView;
