module.exports = function( $ ) {

    const $self = $( this );
	const $instagramWrapper = $self.find( '.elementor-instagram' );
    const $carousel = $self.find( '.elementor-instagram-carousel' );

	if ( ! $instagramWrapper.length ) {
		return;
	}

	const options = $instagramWrapper.data( 'options' );

    const init = function() {
        initTokenConnection();
    };

    const initTokenConnection = function() {

        if (elementorFrontendConfig.instagramToken == ''){
            return;
        }

        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '"': '&quot;',
            '': '&quot;',
            '>': '&gt;'
        };

        function replaceTag(tag) {
            return tagsToReplace[tag] || tag;
        }

        function safe_tags_replace(str) {
            return str.replace(/[&<>"']/g, replaceTag);
        }


        let html = "<div class='swiper-slide il-item "+ options.class + "'><div class='il-item-inner'>";
        html += '<a href="{{link}}" class="instagram-{{type}}" rel="noopener" target="_blank" title="{{caption}}">';
        html += '<img loading="lazy" src="{{image}}" alt="{{caption}}" class="il-photo__img" width="" height="" />';
        html += '</a>';
        html += "</div></div>";

        const optionsPlugin = {
            'target': $instagramWrapper[0],
            'accessToken': elementorFrontendConfig.instagramToken,
            'template': html,
            /*
             'transform': function(item) {
                item.model.image  = item.link + 'media/?size=' + options.image_size_token;
                return item;
            },
             */
            'limit': parseInt(options.limit_token),
            'success': function(response) {
                response.data.forEach(function(i){
                    var cleanCaption = safe_tags_replace(i.caption);
                    i.caption = cleanCaption
                });
            },
            'after': function(){
                if ( ! $carousel.length ) {
                    return;
                }
                initSwiper();
            }
        };

        const feed = new Instafeed(optionsPlugin);
        feed.run();

    };

    const initSwiper = function() {
        const savedOptions = $carousel.data( 'slider_options' ),
            swiperOptions = {
                touchEventsTarget: 'container',
                loop: savedOptions.loop,
                loopAddBlankSlides: false,
                watchOverflow: true,
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                slidesPerView: savedOptions.slidesToShowMobile,
                slidesPerGroup: savedOptions.slidesToShowMobile,
                speed: savedOptions.speed,
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
                el: $self.find('.swiper-pagination').first()[0],
                clickable: true,
            };
        }
        if(savedOptions.arrows){
            swiperOptions.navigation = {
                nextEl: $self.find('.elementor-swiper-button-next').first()[0],
                prevEl: $self.find('.elementor-swiper-button-prev').first()[0],
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

    init();

};
