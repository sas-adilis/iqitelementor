/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-alert-dismiss', function () {
    $(this).on('click', function () {
        $(this).parent().fadeOut();
    });
});
