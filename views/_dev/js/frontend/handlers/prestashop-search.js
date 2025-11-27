module.exports = function( $ ) {
    var $searchWidget = $( this ).find( '.search-widget-autocomplete' );
    if ( ! $searchWidget.length ) {
        return;
    }

    if (elementorFrontendConfig.isEditMode) {
        return;
    }
    
    let $searchBox = $searchWidget.find('input[type=text]');
    let searchURL = $searchWidget.attr('data-search-controller-url');
    var initAutocomplete = prestashop.blocksearch.initAutocomplete || function ($searchWidget, $searchBox, searchURL) {};

    initAutocomplete($searchWidget, $searchBox, searchURL);

};
