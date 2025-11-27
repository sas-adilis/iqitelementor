module.exports = function( $ ) {
	var $carousel = $( this ).find( '.elementor-testimonial-carousel' );
	if ( ! $carousel.length ) {
		return;
	}
	var savedOptions = $carousel.data( 'slider_options' ),
		tabletSlides = 1 === savedOptions.slidesToShow ? 1 : 2,
		swiperOptions = {
			touchEventsTarget: 'container',
			loop: savedOptions.loop,
			speed: savedOptions.speed,
			watchOverflow: true,
			watchSlidesProgress: true,
			watchSlidesVisibility: true,
			slidesPerView: 1,
			slidesPerGroup: 1,
			breakpoints: {
				768: {
					slidesPerView: tabletSlides,
					slidesPerGroup: tabletSlides,
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
