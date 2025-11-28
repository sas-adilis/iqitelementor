var ControlBaseItemView = require( 'elementor-views/controls/base' ),
    ControlDateTimeItemView;

ControlDateTimeItemView = ControlBaseItemView.extend( {
    ui: function() {
        var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );
        ui.picker = '.datetimepicker';

        return ui;
    },

    onReady: function() {
        console.log(this.ui.picker);

        this.ui.picker.datetimepicker({
            prevText: '',
            nextText: '',
            dateFormat: 'yy-mm-dd',
            currentText: dateTimePickerL10n.currentText,
            closeText: dateTimePickerL10n.closeText,
            ampm: false,
            amNames: ['AM', 'A'],
            pmNames: ['PM', 'P'],
            timeFormat: 'hh:mm:ss tt',
            timeSuffix: '',
            timeOnlyTitle: dateTimePickerL10n.timeOnlyTitle,
            timeText: dateTimePickerL10n.timeText,
            hourText: dateTimePickerL10n.hourText,
            minuteText: dateTimePickerL10n.minuteText,
        });
    },

    onBeforeDestroy: function() {
        var picker = this.ui && this.ui.picker ? this.ui.picker : null;

        if (picker && picker.length && picker.data('datetimepicker')) {
            picker.datetimepicker('destroy');
        }
    }
} );

module.exports = ControlDateTimeItemView;