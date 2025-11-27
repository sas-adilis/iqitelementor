module.exports = function( $ ) {
    var $carousel = $( this ).find( '.elementor-blog-carousel' );
    if ( ! $carousel.length ) {
        return;
    }

    var savedOptions = $carousel.data('slider_options'),
        swiperOptions = {
            touchEventsTarget: 'container',
            watchOverflow: true,
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            lazy : {
                loadPrevNext: true,
                checkInView: true,
            },
            slidesPerView: savedOptions.slidesToShowMobile,
            slidesPerGroup: savedOptions.slidesToShowMobile,
            breakpoints: {
                768: {
                    slidesPerView: savedOptions.slidesToShowTablet,
                    slidesPerGroup: savedOptions.slidesToShowTablet,
                },
                992: {
                    slidesPerView:  savedOptions.slidesToShow,
                    slidesPerGroup: savedOptions.slidesToShow,
                }
            }
        };

    if(savedOptions.autoplay){
        swiperOptions.autoplay = {
            delay: savedOptions.autoplaySpeed,
            disableOnInteraction: savedOptions.disableOnInteraction,
        };
    }
    if(savedOptions.dots){
        swiperOptions.pagination = {
            el: $( this ).find('.swiper-pagination').first()[0],
            clickable: true,
        };
    }
    if(savedOptions.arrows){
        swiperOptions.navigation = {
            nextEl: $( this ).find('.elementor-swiper-button-next').first()[0],
            prevEl: $( this ).find('.elementor-swiper-button-prev').first()[0],
        };
    }

    var swiperInstance = new Swiper($carousel[0], swiperOptions);

    if(savedOptions.autoplay && savedOptions.disableOnInteraction){
        $carousel.mouseenter(function() {
            swiperInstance.autoplay.stop();
        });
        $carousel.mouseleave(function() {
            swiperInstance.autoplay.start();
        });
    }
};
