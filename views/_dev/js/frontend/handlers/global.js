/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-element[data-animation]', function () {
    var $element = $(this);
    var animation = $element.data('animation');

    if (!animation) {
        return;
    }

    $element.addClass('elementor-invisible').removeClass(animation);

    $element.waypoint(function () {
        $element.removeClass('elementor-invisible').addClass(animation);
    }, {offset: '90%'});
});
