module.exports = function ($) {
    var $this = $(this);
    var $contactFormWrapper = $this.find('.elementor-contactform-wrapper');

    if (!$contactFormWrapper.length) {
        return;
    }

    $.ajax({
        url: elementorFrontendConfig.ajax_csfr_token_url,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function(resp){
            $contactFormWrapper.find('.js-csfr-token').replaceWith($(resp.preview));
        }
    });

    $contactFormWrapper.on("submit", ".js-elementor-contact-form", function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);
        $.ajax({
            url: $(this).attr('action'),
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function(resp){
                $contactFormWrapper.find('.js-elementor-contact-norifcation-wrapper').replaceWith($(resp.preview).find('.js-elementor-contact-norifcation-wrapper'));
            }
        });
    });
};
