var StyleItemView;

StyleItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-style-library-style-item',

	className: 'elementor-style-library-style-item',

	ui: {
		defaultBtn: '.elementor-style-library-style-default-toggle',
		deleteBtn: '.elementor-style-library-style-delete'
	},

	events: {
		'click @ui.deleteBtn': 'onDeleteClick',
		'click @ui.defaultBtn': 'onDefaultClick'
	},

	modelEvents: {
		'change:is_default': 'render'
	},

	onDeleteClick: function() {
		elementor.styleLibrary.deleteStyle( this.model );
	},

	onDefaultClick: function() {
		elementor.styleLibrary.toggleDefault( this.model );
	}
} );

module.exports = StyleItemView;
