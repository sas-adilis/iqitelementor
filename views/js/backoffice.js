(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var iqitElementorButton;

document.addEventListener("DOMContentLoaded", function (event) {

    $(document).ready(function () {


        iqitElementorButton = (function () {

            var $wrapperCms = $('form[name="cms_page"]').first().find('.form-wrapper').first();
                $wrapperProduct = $('#features, #product_description_description'),
                $wrapperBlog = $('#elementor-button-blog-wrapper'),
                $wrapperYbcBlog = $('.ybc_blogpost').first().find('.ybc-blog-tab-basic').first(),
                $wrapperCategory = $('form[name="category"], form[name="root_category"]').first().find('.form-wrapper').first();
                $wrapperBrand = $('form[name="manufacturer"]').first().find('#manufacturer_description'),
                $btnTemplate = $('#tmpl-btn-edit-with-elementor'),
                $btnTemplateProduct = $('#tmpl-btn-edit-with-elementor-product'),
                $btnTemplateBlog = $('#tmpl-btn-edit-with-elementor-blog'),
                $btnTemplateYbcBlog = $('#tmpl-btn-edit-with-elementor-ybc-blog'),
                $btnTemplateCategory = $('#tmpl-btn-edit-with-elementor-category'),
                $btnTemplateBrand = $('#tmpl-btn-edit-with-elementor-brand');

            function init() {
                $wrapperCms.prepend($btnTemplate.html());
                $wrapperProduct.prepend($btnTemplateProduct.html());
                $wrapperBlog.prepend($btnTemplateBlog.html());
                $wrapperYbcBlog.prepend($btnTemplateYbcBlog.html());
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
                    if (elementorPageType == 'ybcblog') {
                        var  hideEditor = false;
                        jQuery.each(onlyElementor, function(i, val) {
                            if(val){
                                hideEditor = true;
                            }
                        });
                        if (hideEditor){
                            $("[id^=description_]").first().parents('.ybc-form-group').last().hide();
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2JhY2tvZmZpY2UvYmFja29mZmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsInZhciBpcWl0RWxlbWVudG9yQnV0dG9uO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcblxuXG4gICAgICAgIGlxaXRFbGVtZW50b3JCdXR0b24gPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgJHdyYXBwZXJDbXMgPSAkKCdmb3JtW25hbWU9XCJjbXNfcGFnZVwiXScpLmZpcnN0KCkuZmluZCgnLmZvcm0td3JhcHBlcicpLmZpcnN0KCk7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXJQcm9kdWN0ID0gJCgnI2ZlYXR1cmVzLCAjcHJvZHVjdF9kZXNjcmlwdGlvbl9kZXNjcmlwdGlvbicpLFxuICAgICAgICAgICAgICAgICR3cmFwcGVyQmxvZyA9ICQoJyNlbGVtZW50b3ItYnV0dG9uLWJsb2ctd3JhcHBlcicpLFxuICAgICAgICAgICAgICAgICR3cmFwcGVyWWJjQmxvZyA9ICQoJy55YmNfYmxvZ3Bvc3QnKS5maXJzdCgpLmZpbmQoJy55YmMtYmxvZy10YWItYmFzaWMnKS5maXJzdCgpLFxuICAgICAgICAgICAgICAgICR3cmFwcGVyQ2F0ZWdvcnkgPSAkKCdmb3JtW25hbWU9XCJjYXRlZ29yeVwiXSwgZm9ybVtuYW1lPVwicm9vdF9jYXRlZ29yeVwiXScpLmZpcnN0KCkuZmluZCgnLmZvcm0td3JhcHBlcicpLmZpcnN0KCk7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXJCcmFuZCA9ICQoJ2Zvcm1bbmFtZT1cIm1hbnVmYWN0dXJlclwiXScpLmZpcnN0KCkuZmluZCgnI21hbnVmYWN0dXJlcl9kZXNjcmlwdGlvbicpLFxuICAgICAgICAgICAgICAgICRidG5UZW1wbGF0ZSA9ICQoJyN0bXBsLWJ0bi1lZGl0LXdpdGgtZWxlbWVudG9yJyksXG4gICAgICAgICAgICAgICAgJGJ0blRlbXBsYXRlUHJvZHVjdCA9ICQoJyN0bXBsLWJ0bi1lZGl0LXdpdGgtZWxlbWVudG9yLXByb2R1Y3QnKSxcbiAgICAgICAgICAgICAgICAkYnRuVGVtcGxhdGVCbG9nID0gJCgnI3RtcGwtYnRuLWVkaXQtd2l0aC1lbGVtZW50b3ItYmxvZycpLFxuICAgICAgICAgICAgICAgICRidG5UZW1wbGF0ZVliY0Jsb2cgPSAkKCcjdG1wbC1idG4tZWRpdC13aXRoLWVsZW1lbnRvci15YmMtYmxvZycpLFxuICAgICAgICAgICAgICAgICRidG5UZW1wbGF0ZUNhdGVnb3J5ID0gJCgnI3RtcGwtYnRuLWVkaXQtd2l0aC1lbGVtZW50b3ItY2F0ZWdvcnknKSxcbiAgICAgICAgICAgICAgICAkYnRuVGVtcGxhdGVCcmFuZCA9ICQoJyN0bXBsLWJ0bi1lZGl0LXdpdGgtZWxlbWVudG9yLWJyYW5kJyk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXJDbXMucHJlcGVuZCgkYnRuVGVtcGxhdGUuaHRtbCgpKTtcbiAgICAgICAgICAgICAgICAkd3JhcHBlclByb2R1Y3QucHJlcGVuZCgkYnRuVGVtcGxhdGVQcm9kdWN0Lmh0bWwoKSk7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXJCbG9nLnByZXBlbmQoJGJ0blRlbXBsYXRlQmxvZy5odG1sKCkpO1xuICAgICAgICAgICAgICAgICR3cmFwcGVyWWJjQmxvZy5wcmVwZW5kKCRidG5UZW1wbGF0ZVliY0Jsb2cuaHRtbCgpKTtcbiAgICAgICAgICAgICAgICAkd3JhcHBlckNhdGVnb3J5LnByZXBlbmQoJGJ0blRlbXBsYXRlQ2F0ZWdvcnkuaHRtbCgpKTtcbiAgICAgICAgICAgICAgICAkd3JhcHBlckJyYW5kLmFwcGVuZCgkYnRuVGVtcGxhdGVCcmFuZC5odG1sKCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50b3JQYWdlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudG9yUGFnZVR5cGUgPT0gJ2NtcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoaWRlRWRpdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChvbmx5RWxlbWVudG9yLCBmdW5jdGlvbiAoaSwgdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRlRWRpdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaWRlRWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0ICRjbXNQYWdlQ29udGVudCA9ICAkKFwiI2Ntc19wYWdlX2NvbnRlbnRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNtc1BhZ2VDb250ZW50LmZpcnN0KCkucGFyZW50cygnLmZvcm0tZ3JvdXAnKS5sYXN0KCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjbXNQYWdlQ29udGVudC5maW5kKCcuYXV0b2xvYWRfcnRlJykucmVtb3ZlQ2xhc3MoJ2F1dG9sb2FkX3J0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRvclBhZ2VUeXBlID09ICdibG9nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICBoaWRlRWRpdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChvbmx5RWxlbWVudG9yLCBmdW5jdGlvbihpLCB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZih2YWwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRlRWRpdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoaWRlRWRpdG9yKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKFwiW2lkXj1jb250ZW50X11cIikuZmlyc3QoKS5wYXJlbnRzKCcuZm9ybS1ncm91cCcpLmxhc3QoKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudG9yUGFnZVR5cGUgPT0gJ3liY2Jsb2cnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgIGhpZGVFZGl0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKG9ubHlFbGVtZW50b3IsIGZ1bmN0aW9uKGksIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHZhbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZGVFZGl0b3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhpZGVFZGl0b3Ipe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoXCJbaWRePWRlc2NyaXB0aW9uX11cIikuZmlyc3QoKS5wYXJlbnRzKCcueWJjLWZvcm0tZ3JvdXAnKS5sYXN0KCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRvclBhZ2VUeXBlID09ICdjYXRlZ29yeScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkZm9ybSA9ICQoJ2Zvcm1bbmFtZT1cImNhdGVnb3J5XCJdLCBmb3JtW25hbWU9XCJyb290X2NhdGVnb3J5XCJdJykuZmlyc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogZWxlbWVudG9yQWpheFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnY2F0ZWdvcnlMYXlvdXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnlJZDogJGZvcm0uZmluZChcImlucHV0W25hbWU9J2lkUGFnZUVsZW1lbnRvciddXCIpLnZhbCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdEVsZW1lbnRvcjogJGZvcm0uZmluZChcImlucHV0W25hbWU9J2p1c3RFbGVtZW50b3InXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtpbml0OiBpbml0fTtcblxuICAgICAgICB9KSgpO1xuXG4gICAgICAgIGlxaXRFbGVtZW50b3JCdXR0b24uaW5pdCgpO1xuXG5cbiAgICB9KTtcblxufSk7XG4iXX0=
