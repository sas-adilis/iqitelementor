var StyleModel = Backbone.Model.extend( {
	defaults: {
		id_widget_style: 0,
		widget_type: '',
		name: '',
		settings: {},
		is_default: 0,
		export_link: ''
	}
} );

module.exports = StyleModel;
