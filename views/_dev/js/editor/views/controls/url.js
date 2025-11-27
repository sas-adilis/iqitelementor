var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlUrlItemView;

ControlUrlItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.btnExternal = 'button.elementor-control-url-target';
		ui.frameOpeners = '.elementor-control-url-media';

		return ui;
	},

	// Override the base events
	childEvents: {
		'click @ui.btnExternal': 'onExternalClicked',
		'click @ui.frameOpeners': 'openFrame',
	},

	onReady: function() {
		if ( this.getControlValue( 'is_external' ) ) {
			this.ui.btnExternal.addClass( 'active' );
		}
	},

	openFrame: function() {
		openPsFileManager('elementor-control-url-field-' + this.model.cid, 2);
	},

	onExternalClicked: function( event ) {
		event.preventDefault();

		this.ui.btnExternal.toggleClass( 'active' );
		this.setValue( 'is_external', this.isExternal() );
	},

	isExternal: function() {
		return this.ui.btnExternal.hasClass( 'active' );
	}
} );

module.exports = ControlUrlItemView;
