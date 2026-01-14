var ControlBaseMultipleItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlBaseUnitsItemView;

ControlBaseUnitsItemView = ControlBaseMultipleItemView.extend( {

	getCurrentRange: function() {
		return this.getUnitRange( this.getControlValue( 'unit' ) );
	},

	getUnitRange: function( unit ) {
		var ranges = this.model.get( 'range' );

		if ( ! ranges || ! ranges[ unit ] ) {
			return false;
		}

		return ranges[ unit ];
	}
}, {

	// Static methods
	getStyleValue( placeholder, controlValue ) {
		let returnValue = ControlBaseMultipleItemView.getStyleValue( placeholder, controlValue );

		if ( 'unit' === placeholder && 'custom' === returnValue ) {
			returnValue = '__EMPTY__';
		}

		return returnValue;
	},
} );

module.exports = ControlBaseUnitsItemView;
