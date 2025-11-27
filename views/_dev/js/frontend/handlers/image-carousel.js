module.exports = function( $ ) {
	var $carousel = $( this ).find( '.elementor-image-carousel' );
	if ( ! $carousel.length ) {
		return;
	}
	var savedOptions = $carousel.data( 'slider_options' ),
		swiperOptions = {
		touchEventsTarget: 'container',
		loop: savedOptions.loop,
		speed: savedOptions.speed,
		watchOverflow: true,
		watchSlidesProgress: true,
		watchSlidesVisibility: true,
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
	if(savedOptions.fade){
		swiperOptions.effect = 'fade';
		swiperOptions.fadeEffect = {
			crossFade: true
		};
	}
	if(savedOptions.dots){

		swiperOptions.pagination = {
			el: $carousel.find('.swiper-pagination').first()[0],
				clickable: true,
		};
	}
	if(savedOptions.arrows){
		swiperOptions.navigation = {
			nextEl: $carousel.find('.swiper-button-next').first()[0],
			prevEl: $carousel.find('.swiper-button-prev').first()[0],
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
