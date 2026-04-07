/* global $, prestashop */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.search-widget-autocomplete', function () {
    var $searchWidget = $(this);
    var $searchBox = $searchWidget.find('input[type=text]');
    var searchURL = $searchWidget.attr('data-search-controller-url');

    if (typeof prestashop === 'undefined' || !prestashop.blocksearch || !prestashop.blocksearch.initAutocomplete) {
        return;
    }

    prestashop.blocksearch.initAutocomplete($searchWidget, $searchBox, searchURL);
});
