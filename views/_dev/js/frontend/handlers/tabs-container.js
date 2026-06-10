/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('[data-element_type="tabs"]', function () {
    var $wrapper = $(this);
    var $nav = $wrapper.find('> .elementor-tabs > .elementor-tabs-nav').first();
    var $content = $wrapper.find('> .elementor-tabs > .elementor-tabs-content').first();

    if (!$nav.length || !$content.length) {
        return;
    }

    var $titles = $nav.children('.elementor-tab-title');
    var $panes = $content.children('.elementor-tab-content');

    function activate(index) {
        index = parseInt(index, 10) || 0;

        $titles.removeClass('elementor-active').attr('aria-selected', 'false');
        $panes.removeClass('elementor-tab-active');

        var $title = $titles.filter('[data-tab="' + index + '"]');
        var $pane = $panes.filter('[data-tab-index="' + index + '"]');

        $title.addClass('elementor-active').attr('aria-selected', 'true');
        $pane.addClass('elementor-tab-active');
    }

    // Activate first tab by default (server already marks it active, this is a safety net)
    if (!$titles.filter('.elementor-active').length) {
        activate(0);
    }

    $titles.on('click', function (event) {
        event.preventDefault();
        activate(this.dataset.tab);
    });

    $titles.on('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate(this.dataset.tab);
        }
    });
});
