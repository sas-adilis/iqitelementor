var ControlBaseView = require( './base' );

var ControlPopoverToggleView = ControlBaseView.extend( {
	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		ui.toggleButton = '.elementor-control-popover-toggle-toggle';
		ui.toggleButtonLabel = '.elementor-control-popover-toggle-toggle-label';
		ui.resetButton = '.elementor-control-popover-toggle-reset-label';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseView.prototype.events.apply( this, arguments ), {
			'change @ui.toggleButton': 'onToggleChange',
			'click @ui.toggleButtonLabel': 'onToggleLabelClick',
			'click @ui.resetButton': 'onResetClick'
		} );
	},

	onToggleChange: function() {
		var value = this.ui.toggleButton.filter( ':checked' ).val();
		this.setValue( value );
		this.togglePopover( !! value );

		console.log( 'Popover toggle changed to value:', value );
	},

	onToggleLabelClick: function( event ) {
		const $popover = this.$el.next('.elementor-controls-popover');
		this.togglePopover( !$popover.hasClass( 'elementor-open' ) );

		console.log( 'Popover toggled via label click.' );
	},

	onResetClick: function( event ) {
		event.preventDefault();
		this.resetPopoverControls();
	},

	togglePopover: function( show ) {
		const $popover = this.$el.next('.elementor-controls-popover');
		console.log( this.$el, $popover );

		if ( ! $popover.length ) {
			return;
		}

		$popover.toggleClass( 'elementor-open', show );

		// Manage outside click listener
		if ( show ) {
			this.addOutsideClickListener();
		} else {
			this.removeOutsideClickListener();
		}
	},

	addOutsideClickListener: function() {
		var self = this;

		// Avoid duplicates
		this.removeOutsideClickListener();

		this.outsideClickHandler = function( event ) {
			var $target = Backbone.$( event.target ),
				$popover = self.$el.next( '.elementor-controls-popover' );

			// If click is not on toggle control and not inside popover
			if ( ! $target.closest( self.$el ).length &&
				 ! $target.closest( $popover ).length ) {
				// Close the popover
				self.togglePopover( false );
			}
		};

		// Use namespaced event to avoid conflicts
		Backbone.$( document ).on( 'click.popoverToggle' + this.cid, this.outsideClickHandler );
	},

	removeOutsideClickListener: function() {
		Backbone.$( document ).off( 'click.popoverToggle' + this.cid );
	},

	onDestroy: function() {
		this.removeOutsideClickListener();
	},

	resetPopoverControls: function() {
		this.setValue( '' );
		this.ui.toggleButton.filter( '[value=""]' ).prop( 'checked', true );
		this.ui.toggleButton.filter( '[value!=""]' ).prop( 'checked', false );
		this.togglePopover( false );
	},

	onRender: function() {
		this.togglePopover( false );
	}
} );

module.exports = ControlPopoverToggleView;