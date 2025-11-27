module.exports = function ($) {
    var $carousels = $(this).find('.elementor-products-carousel');
    if (elementorFrontendConfig.isEditMode) {
        $(this).find('img[data-src]').each(function() {
            $(this).attr('src', $(this).data('src'));
        });
    }
    if (!$carousels.length) {
        return;
    }



    $carousels.each(function() {
        let $carousel = $(this);

        var savedOptions = $carousel.data('slider_options'),
            swiperOptions = {
                touchEventsTarget: 'container',
                watchOverflow: true,
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                lazy : {
                    checkInView: true,
                    loadedClass: 'loaded'
                },
                slidesPerView: savedOptions.slidesToShowMobile,
                slidesPerGroup: savedOptions.slidesToShowMobile,
                grid: {
                    fill: 'row',
                    rows: savedOptions.itemsPerColumn
                },
                breakpoints: {
                    768: {
                        slidesPerView: savedOptions.slidesToShowTablet,
                        slidesPerGroup: savedOptions.slidesToShowTablet,
                        grid: {
                            fill: 'row',
                            rows: savedOptions.itemsPerColumn
                        }
                    },
                    992: {
                        slidesPerView:  savedOptions.slidesToShow,
                        slidesPerGroup: savedOptions.slidesToShow,
                        grid: {
                            fill: 'row',
                            rows: savedOptions.itemsPerColumn
                        }
                    }
                }
            };

        if(savedOptions.autoplay){
            swiperOptions.autoplay = {
                delay: 4500,
                disableOnInteraction: true,
            };
        }
        if(savedOptions.dots){
            swiperOptions.pagination = {
                el: $carousel.parent().find('.swiper-pagination').first()[0],
                clickable: true,
            };
        }
        if(savedOptions.arrows){
            swiperOptions.navigation = {
                nextEl: $carousel.parent().find('.elementor-swiper-button-next').first()[0],
                prevEl: $carousel.parent().find('.elementor-swiper-button-prev').first()[0],
            };
        }

        var swiperInstance = new Swiper($carousel[0], swiperOptions);

        if(savedOptions.autoplay){
            $carousel.mouseenter(function() {
                swiperInstance.autoplay.stop();
            });
            $carousel.mouseleave(function() {
                swiperInstance.autoplay.start();
            });
        }

    });






};
