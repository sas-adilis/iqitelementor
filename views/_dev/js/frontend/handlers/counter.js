/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-counter-number', function () {
    var $number = $(this);

    $number.waypoint(function () {
        $number.numerator({
            duration: $number.data('duration')
        });
    }, {offset: '90%'});
});
