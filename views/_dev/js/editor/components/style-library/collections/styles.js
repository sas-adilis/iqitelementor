var StyleModel = require( 'elementor-styles/models/style' );

var StyleCollection = Backbone.Collection.extend( {
	model: StyleModel
} );

module.exports = StyleCollection;
