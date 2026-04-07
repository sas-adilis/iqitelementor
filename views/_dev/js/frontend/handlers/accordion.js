/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-accordion', function () {
    var $accordion = $(this);
    var defaultActiveSection = $accordion.data('active-section') || 1;
    var activeFirst = $accordion.data('active-first');
    var $titles = $accordion.find('.elementor-accordion-title');

    function activateSection(sectionIndex) {
        var $active = $titles.filter('.active');
        var $requested = $titles.filter('[data-section="' + sectionIndex + '"]');
        var isRequestedActive = $requested.hasClass('active');

        $active.removeClass('active').next().slideUp();

        if (!isRequestedActive) {
            $requested.addClass('active').next().slideDown();
        }
    }

    if (activeFirst) {
        activateSection(defaultActiveSection);
    }

    $titles.on('click', function () {
        activateSection(this.dataset.section);
    });
});
