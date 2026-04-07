/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-tabs', function () {
    var $tabs = $(this);
    var defaultActiveTab = $tabs.data('active-tab') || 1;
    var $tabsTitles = $tabs.find('.elementor-tab-title');
    var $tabsContents = $tabs.find('.elementor-tab-content');
    var $active, $content;

    function activateTab(tabIndex) {
        if ($active) {
            $active.removeClass('active');
            $content.removeClass('active');
        }

        $active = $tabsTitles.filter('[data-tab="' + tabIndex + '"]');
        $active.addClass('active');
        $content = $tabsContents.filter('[data-tab="' + tabIndex + '"]');
        $content.addClass('active');
    }

    activateTab(defaultActiveTab);

    $tabsTitles.on('click', function () {
        activateTab(this.dataset.tab);
    });
});
