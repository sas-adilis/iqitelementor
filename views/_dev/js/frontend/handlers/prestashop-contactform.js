/* global $, elementorFrontendConfig */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-contactform-wrapper', function () {
    var $wrapper = $(this);

    if (typeof elementorFrontendConfig === 'undefined' || !elementorFrontendConfig.ajax_csfr_token_url) {
        return;
    }

    // Load CSRF token
    $.ajax({
        url: elementorFrontendConfig.ajax_csfr_token_url,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (resp) {
            $wrapper.find('.js-csfr-token').replaceWith($(resp.preview));
        }
    });

    // Handle form submission via AJAX
    $wrapper.on('submit', '.js-elementor-contact-form', function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);

        $.ajax({
            url: $(this).attr('action'),
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function (resp) {
                $wrapper.find('.js-elementor-contact-norifcation-wrapper')
                    .replaceWith($(resp.preview).find('.js-elementor-contact-norifcation-wrapper'));
            }
        });
    });
});
