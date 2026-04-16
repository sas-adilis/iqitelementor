var ControlBaseItemView = require( 'elementor-views/controls/base' ),
    ControlDateTimeItemView;

ControlDateTimeItemView = ControlBaseItemView.extend( {
    ui: function() {
        var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );
        ui.picker = '.datetimepicker';

        return ui;
    },

    onReady: function() {
        var self = this;

        this.ui.picker.datepicker({
            prevText: '',
            nextText: '',
            dateFormat: 'yy-mm-dd',
            onClose: function() {
                self.setValue( self.ui.picker.val() );
            }
        });
    },

    onBeforeDestroy: function() {
        var picker = this.ui && this.ui.picker ? this.ui.picker : null;

        if (picker && picker.length && picker.data('datepicker')) {
            picker.datepicker('destroy');
        }
    }
} );

module.exports = ControlDateTimeItemView;