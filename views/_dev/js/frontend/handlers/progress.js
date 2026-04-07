/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-progress-bar', function () {
    var $bar = $(this);

    $bar.waypoint(function () {
        $bar.css('width', $bar.data('max') + '%');
    }, {offset: '90%'});
});
