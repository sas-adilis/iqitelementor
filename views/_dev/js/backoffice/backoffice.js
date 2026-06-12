var iqitElementorButton;

document.addEventListener("DOMContentLoaded", function (event) {

    $(document).ready(function () {


        iqitElementorButton = (function () {

            function init() {
                if (typeof elementorPageType !== 'undefined') {

                    if (elementorPageType == 'cms') {
                        var hideEditor = false;
                        jQuery.each(onlyElementor, function (i, val) {
                            if (val) {
                                hideEditor = true;
                            }
                        });
                        if (hideEditor) {
                            let $cmsPageContent =  $("#cms_page_content");
                            $cmsPageContent.first().parents('.form-group').last().hide();
                            $cmsPageContent.find('.autoload_rte').removeClass('autoload_rte');
                        }
                    }

                    if (elementorPageType == 'blog') {
                        var  hideEditor = false;
                        jQuery.each(onlyElementor, function(i, val) {
                            if(val){
                                hideEditor = true;
                            }
                        });
                        if (hideEditor){
                            $("[id^=content_]").first().parents('.form-group').last().remove();
                        }
                    }

                }

            }

            return {init: init};

        })();

        iqitElementorButton.init();


    });

});
