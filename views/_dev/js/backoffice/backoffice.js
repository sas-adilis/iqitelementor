var iqitElementorButton;

document.addEventListener("DOMContentLoaded", function (event) {

    $(document).ready(function () {


        iqitElementorButton = (function () {

            var $wrapperCms = $('form[name="cms_page"]').first().find('.form-wrapper').first();
                $wrapperProduct = $('#features, #product_description_description'),
                $wrapperBlog = $('#elementor-button-blog-wrapper'),
                $wrapperCategory = $('form[name="category"], form[name="root_category"]').first().find('.form-wrapper').first();
                $wrapperBrand = $('form[name="manufacturer"]').first().find('#manufacturer_description'),
                $btnTemplate = $('#tmpl-btn-edit-with-elementor'),
                $btnTemplateProduct = $('#tmpl-btn-edit-with-elementor-product'),
                $btnTemplateBlog = $('#tmpl-btn-edit-with-elementor-blog'),
                $btnTemplateCategory = $('#tmpl-btn-edit-with-elementor-category'),
                $btnTemplateBrand = $('#tmpl-btn-edit-with-elementor-brand');

            function init() {
                $wrapperCms.prepend($btnTemplate.html());
                $wrapperProduct.prepend($btnTemplateProduct.html());
                $wrapperBlog.prepend($btnTemplateBlog.html());
                $wrapperCategory.prepend($btnTemplateCategory.html());
                $wrapperBrand.append($btnTemplateBrand.html());

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

                    if (elementorPageType == 'category') {
                        var $form = $('form[name="category"], form[name="root_category"]').first();
                        $form.submit(function (event) {
                            $.ajax({
                                type: 'POST',
                                url: elementorAjaxUrl,
                                data: {
                                    action: 'categoryLayout',
                                    categoryId: $form.find("input[name='idPageElementor']").val(),
                                    justElementor: $form.find("input[name='justElementor']:checked").val()
                                },
                                success: function (resp) {
                                },
                                error: function () {
                                    console.log("error");
                                }
                            });

                        });

                    }
                }

            }

            return {init: init};

        })();

        iqitElementorButton.init();


    });

});
