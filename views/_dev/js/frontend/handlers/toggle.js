/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-toggle-title', function () {
    var $title = $(this);

    $title.on('click', function () {
        var $content = $title.next();

        if ($title.hasClass('active')) {
            $title.removeClass('active');
            $content.slideUp();
        } else {
            $title.addClass('active');
            $content.slideDown();
        }
    });
});
