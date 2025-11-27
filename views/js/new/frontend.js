(function ($) {
    'use strict';

    /**
     * ElementsHandler
     * Routeur qui lie un type d’élément (data-element_type) à son handler JS.
     */
    function ElementsHandler($) {
        var registeredHandlers = {};
        var registeredGlobalHandlers = [];

        function runGlobalHandlers($scope) {
            $.each(registeredGlobalHandlers, function () {
                this.call($scope, $);
            });
        }

        this.addHandler = function (widgetType, callback) {
            registeredHandlers[widgetType] = callback;
        };

        this.addGlobalHandler = function (callback) {
            registeredGlobalHandlers.push(callback);
        };

        this.runReadyTrigger = function ($scope) {
            var elementType = $scope.data('element_type');

            if (!elementType) {
                return;
            }

            // Handlers globaux (animations, etc.)
            runGlobalHandlers($scope);

            // Handler spécifique au type
            if (!registeredHandlers[elementType]) {
                return;
            }

            var handler = registeredHandlers[elementType];
            var element = $scope[0];

            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function (entries, obs) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            handler.call($scope, $);
                            obs.disconnect();
                        }
                    });
                }, {
                    root: null,
                    threshold: 0.1
                });

                observer.observe(element);
            } else {
                handler.call($scope, $);
            }
        };
    }

    /**
     * Utils
     * Utilitaires utilisés par elementorFrontend (YouTube API).
     */
    function Utils($) {
        var self = this;
        var isYTInserted = false;

        function insertYTApi() {
            isYTInserted = true;
            $('script:first').before($('<script>', {src: 'https://www.youtube.com/iframe_api'}));
        }

        this.onYoutubeApiReady = function (callback) {
            if (!isYTInserted) {
                insertYTApi();
            }

            if (window.YT && YT.loaded) {
                callback(YT);
            } else {
                setTimeout(function () {
                    self.onYoutubeApiReady(callback);
                }, 350);
            }
        };
    }

    /******************************************************************
     * HANDLERS PAR data-element_type
     ******************************************************************/

    // Handler for data-element_type="accordion"
    function handlerAccordion($) {
        var $this = $(this);
        var $accordionDiv = $this.find('.elementor-accordion');
        var defaultActiveSection = $accordionDiv.data('active-section');
        var activeFirst = $accordionDiv.data('active-first');
        var $accordionTitles = $this.find('.elementor-accordion-title');

        if (!defaultActiveSection) {
            defaultActiveSection = 1;
        }

        function activateSection(sectionIndex) {
            var $activeTitle = $accordionTitles.filter('.active');
            var $requestedTitle = $accordionTitles.filter('[data-section="' + sectionIndex + '"]');
            var isRequestedActive = $requestedTitle.hasClass('active');

            $activeTitle
                .removeClass('active')
                .next()
                .slideUp();

            if (!isRequestedActive) {
                $requestedTitle
                    .addClass('active')
                    .next()
                    .slideDown();
            }
        }

        if (activeFirst) {
            activateSection(defaultActiveSection);
        }

        $accordionTitles.on('click', function () {
            activateSection(this.dataset.section);
        });
    }

    // Handler for data-element_type="alert"
    function handlerAlert($) {
        $(this)
            .find('.elementor-alert-dismiss')
            .on('click', function () {
                $(this).parent().fadeOut();
            });
    }

    // Handler for data-element_type="counter"
    function handlerCounter($) {
        var $number = $(this).find('.elementor-counter-number');

        $number.waypoint(function () {
            $number.numerator({
                duration: $number.data('duration')
            });
        }, {offset: '90%'});
    }

    // Handler global (tous les .elementor-element)
    function handlerGlobal() {
        if (elementorFrontend.isEditMode()) {
            return;
        }

        var $element = this;
        var animation = $element.data('animation');

        if (!animation) {
            return;
        }

        $element.addClass('elementor-invisible').removeClass(animation);

        $element.waypoint(function () {
            $element.removeClass('elementor-invisible').addClass(animation);
        }, {offset: '90%'});
    }

    // Handler for data-element_type="image-carousel"
    function handlerImageCarousel($) {
        var $carousel = $(this).find('.elementor-image-carousel');
        if (!$carousel.length) {
            return;
        }

        var savedOptions = $carousel.data('slider_options');
        var swiperOptions = {
            touchEventsTarget: 'container',
            loop: savedOptions.loop,
            speed: savedOptions.speed,
            watchOverflow: true,
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            slidesPerView: savedOptions.slidesToShowMobile || 2,
            slidesPerGroup: savedOptions.slidesToShowMobile || 2,
            breakpoints: {
                768: {
                    slidesPerView: savedOptions.slidesToShowTablet,
                    slidesPerGroup: savedOptions.slidesToShowTablet
                },
                992: {
                    slidesPerView: savedOptions.slidesToShow,
                    slidesPerGroup: savedOptions.slidesToShow
                }
            }
        };

        if (savedOptions.autoplay) {
            swiperOptions.autoplay = {
                delay: savedOptions.autoplaySpeed,
                disableOnInteraction: savedOptions.disableOnInteraction
            };
        }

        if (savedOptions.fade) {
            swiperOptions.effect = 'fade';
            swiperOptions.fadeEffect = {crossFade: true};
        }

        if (savedOptions.dots) {
            swiperOptions.pagination = {
                el: $carousel.find('.swiper-pagination').first()[0],
                clickable: true
            };
        }

        if (savedOptions.arrows) {
            swiperOptions.navigation = {
                nextEl: $carousel.find('.swiper-button-next').first()[0],
                prevEl: $carousel.find('.swiper-button-prev').first()[0]
            };
        }

        var swiperInstance = new Swiper($carousel[0], swiperOptions);

        if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
            $carousel.on('mouseenter', function () {
                swiperInstance.autoplay.stop();
            });
            $carousel.on('mouseleave', function () {
                swiperInstance.autoplay.start();
            });
        }
    }

    // Handler for data-element_type="instagram"
    function handlerInstagram($) {
        var $self = $(this);
        var $instagramWrapper = $self.find('.elementor-instagram');
        var $carousel = $self.find('.elementor-instagram-carousel');

        if (!$instagramWrapper.length) {
            return;
        }

        var options = $instagramWrapper.data('options');

        function initSwiper() {
            if (!$carousel.length) {
                return;
            }

            var savedOptions = $carousel.data('slider_options');
            var swiperOptions = {
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
                        slidesPerGroup: savedOptions.slidesToShowTablet
                    },
                    992: {
                        slidesPerView: savedOptions.slidesToShow,
                        slidesPerGroup: savedOptions.slidesToShow
                    }
                }
            };

            if (savedOptions.autoplay) {
                swiperOptions.autoplay = {
                    delay: savedOptions.autoplaySpeed,
                    disableOnInteraction: savedOptions.disableOnInteraction
                };
            }

            if (savedOptions.dots) {
                swiperOptions.pagination = {
                    el: $self.find('.swiper-pagination').first()[0],
                    clickable: true
                };
            }

            if (savedOptions.arrows) {
                swiperOptions.navigation = {
                    nextEl: $self.find('.elementor-swiper-button-next').first()[0],
                    prevEl: $self.find('.elementor-swiper-button-prev').first()[0]
                };
            }

            var swiperInstance = new Swiper($carousel[0], swiperOptions);

            if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
                $carousel.on('mouseenter', function () {
                    swiperInstance.autoplay.stop();
                });
                $carousel.on('mouseleave', function () {
                    swiperInstance.autoplay.start();
                });
            }
        }

        function initTokenConnection() {
            if (elementorFrontendConfig.instagramToken === '') {
                return;
            }

            var tagsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '"': '&quot;',
                "'": '&quot;',
                '>': '&gt;'
            };

            function replaceTag(tag) {
                return tagsToReplace[tag] || tag;
            }

            function safeTagsReplace(str) {
                return str.replace(/[&<>"']/g, replaceTag);
            }

            var html = "<div class='swiper-slide il-item " + options.class + "'><div class='il-item-inner'>";
            html += '<a href="{{link}}" class="instagram-{{type}}" rel="noopener" target="_blank" title="{{caption}}">';
            html += '<img loading="lazy" src="{{image}}" alt="{{caption}}" class="il-photo__img" />';
            html += '</a>';
            html += '</div></div>';

            var optionsPlugin = {
                target: $instagramWrapper[0],
                accessToken: elementorFrontendConfig.instagramToken,
                template: html,
                limit: parseInt(options.limit_token, 10),
                success: function (response) {
                    response.data.forEach(function (item) {
                        item.caption = safeTagsReplace(item.caption || '');
                    });
                },
                after: function () {
                    initSwiper();
                }
            };

            var feed = new Instafeed(optionsPlugin);
            feed.run();
        }

        (function init() {
            initTokenConnection();
        }());
    }


    // Handler for data-element_type="prestashop-widget-Blog"
    function handlerPsBlog($) {
        var $carousel = $(this).find('.elementor-blog-carousel');
        if (!$carousel.length) {
            return;
        }

        var savedOptions = $carousel.data('slider_options');
        var swiperOptions = {
            touchEventsTarget: 'container',
            watchOverflow: true,
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            lazy: {
                loadPrevNext: true,
                checkInView: true
            },
            slidesPerView: savedOptions.slidesToShowMobile,
            slidesPerGroup: savedOptions.slidesToShowMobile,
            breakpoints: {
                768: {
                    slidesPerView: savedOptions.slidesToShowTablet,
                    slidesPerGroup: savedOptions.slidesToShowTablet
                },
                992: {
                    slidesPerView: savedOptions.slidesToShow,
                    slidesPerGroup: savedOptions.slidesToShow
                }
            }
        };

        if (savedOptions.autoplay) {
            swiperOptions.autoplay = {
                delay: savedOptions.autoplaySpeed,
                disableOnInteraction: savedOptions.disableOnInteraction
            };
        }

        if (savedOptions.dots) {
            swiperOptions.pagination = {
                el: $(this).find('.swiper-pagination').first()[0],
                clickable: true
            };
        }

        if (savedOptions.arrows) {
            swiperOptions.navigation = {
                nextEl: $(this).find('.elementor-swiper-button-next').first()[0],
                prevEl: $(this).find('.elementor-swiper-button-prev').first()[0]
            };
        }

        var swiperInstance = new Swiper($carousel[0], swiperOptions);

        if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
            $carousel.on('mouseenter', function () {
                swiperInstance.autoplay.stop();
            });
            $carousel.on('mouseleave', function () {
                swiperInstance.autoplay.start();
            });
        }
    }

    // Handler for data-element_type="prestashop-widget-Brands"
    function handlerPsBrands($) {
        var $carousel = $(this).find('.elementor-brands-carousel');
        if (!$carousel.length) {
            return;
        }

        var savedOptions = $carousel.data('slider_options');
        var swiperOptions = {
            touchEventsTarget: 'container',
            watchOverflow: true,
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            lazy: {
                loadPrevNext: true,
                checkInView: true
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
                    slidesPerView: savedOptions.slidesToShow,
                    slidesPerGroup: savedOptions.slidesToShow,
                    grid: {
                        fill: 'row',
                        rows: savedOptions.itemsPerColumn
                    }
                }
            }
        };

        if (savedOptions.autoplay) {
            swiperOptions.autoplay = {delay: 4500};
        }

        if (savedOptions.dots) {
            swiperOptions.pagination = {
                el: $(this).find('.swiper-pagination').first()[0],
                clickable: true
            };
        }

        if (savedOptions.arrows) {
            swiperOptions.navigation = {
                nextEl: $(this).find('.elementor-swiper-button-next').first()[0],
                prevEl: $(this).find('.elementor-swiper-button-prev').first()[0]
            };
        }

        var swiperInstance = new Swiper($carousel[0], swiperOptions);

        if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
            $carousel.on('mouseenter', function () {
                swiperInstance.autoplay.stop();
            });
            $carousel.on('mouseleave', function () {
                swiperInstance.autoplay.start();
            });
        }
    }

    // Handler for data-element_type="prestashop-widget-ContactForm"
    function handlerPsContactForm($) {
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
            success: function (resp) {
                $contactFormWrapper.find('.js-csfr-token').replaceWith($(resp.preview));
            }
        });

        $contactFormWrapper.on('submit', '.js-elementor-contact-form', function (e) {
            e.preventDefault();
            var formData = new FormData($(this)[0]);

            $.ajax({
                url: $(this).attr('action'),
                data: formData,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function (resp) {
                    $contactFormWrapper
                        .find('.js-elementor-contact-norifcation-wrapper')
                        .replaceWith($(resp.preview).find('.js-elementor-contact-norifcation-wrapper'));
                }
            });
        });
    }

    function initSwiperFromElement($element) {
        var savedOptions = $element.data('slider_options') || {};
        var swiperOptions = {
            modules: [
                Pagination, Scrollbar
            ],

            watchOverflow: false,
            //watchSlidesProgress: true,
            /*lazy: {
                checkInView: true,
                loadedClass: 'loaded'
            },*/
            slidesPerView: savedOptions.slidesToShowMobile ?? 2.15,
            slidesPerGroup: savedOptions.slidesToShowMobile ?? 2,
            grid: {
                fill: 'row',
                rows: savedOptions.itemsPerColumn || 1
            },
            breakpoints: {
                768: {
                    slidesPerView: savedOptions.slidesToShowTablet ?? 2,
                    slidesPerGroup: savedOptions.slidesToShowTablet ?? 2,
                    grid: {
                        fill: 'row',
                        rows: savedOptions.itemsPerColumn || 1
                    }
                },
                992: {
                    slidesPerView: savedOptions.slidesToShow ?? 5.15,
                    slidesPerGroup: savedOptions.slidesToShow ?? 1,
                    grid: {
                        fill: 'row',
                        rows: savedOptions.itemsPerColumn ?? 1
                    }
                }
            }
        };

        if (savedOptions.autoplay) {
            swiperOptions.autoplay = {
                delay: 4500,
                disableOnInteraction: true
            };
        }

        if (savedOptions.dots) {
            swiperOptions.pagination = {
                el: $element.find('.swiper-pagination').first()[0],
                clickable: true
            };
        }

        if (savedOptions.arrows) {
            swiperOptions.navigation = {
                nextEl: $element.find('.elementor-swiper-button-next').first()[0],
                prevEl: $element.find('.elementor-swiper-button-prev').first()[0]
            };
        }

        var swiperInstance = new Swiper($element[0], swiperOptions);

        if (savedOptions.autoplay) {
            $element.on('mouseenter', function () {
                swiperInstance.autoplay.stop();
            });
            $element.on('mouseleave', function () {
                swiperInstance.autoplay.start();
            });
        }
    }

    // Handler for data-element_type="prestashop-widget-ProductsList"
    function handlerPsProductsList($) {
        var $scope = $(this);
        var $carousel = $scope.find('.elementor-products-carousel');

        if (elementorFrontendConfig.isEditMode) {
            $scope.find('img[data-src]').each(function () {
                $(this).attr('src', $(this).data('src'));
            });
        }

        if (!$carousel.length) {
            return;
        }

        initSwiperFromElement($carousel)
    }

    // Handler for data-element_type="prestashop-widget-ProductsListTabs"
    function handlerPsProductsListTabs($) {
        var $scope = $(this);

        console.log($scope);
        var $carousels = $scope.find('.elementor-products-carousel');

        if (elementorFrontendConfig.isEditMode) {
            $scope.find('img[data-src]').each(function () {
                $(this).attr('src', $(this).data('src'));
            });
        }

        if (!$carousels.length) {
            return;
        }

        $carousels.each(function () {
            var $carousel = $(this);
            var savedOptions = $carousel.data('slider_options');
            var swiperOptions = {
                touchEventsTarget: 'container',
                watchOverflow: true,
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                lazy: {
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
                        slidesPerView: savedOptions.slidesToShow,
                        slidesPerGroup: savedOptions.slidesToShow,
                        grid: {
                            fill: 'row',
                            rows: savedOptions.itemsPerColumn
                        }
                    }
                }
            };

            if (savedOptions.autoplay) {
                swiperOptions.autoplay = {
                    delay: 4500,
                    disableOnInteraction: true
                };
            }

            if (savedOptions.dots) {
                swiperOptions.pagination = {
                    el: $carousel.parent().find('.swiper-pagination').first()[0],
                    clickable: true
                };
            }

            if (savedOptions.arrows) {
                swiperOptions.navigation = {
                    nextEl: $carousel.parent().find('.elementor-swiper-button-next').first()[0],
                    prevEl: $carousel.parent().find('.elementor-swiper-button-prev').first()[0]
                };
            }

            var swiperInstance = new Swiper($carousel[0], swiperOptions);

            if (savedOptions.autoplay) {
                $carousel.on('mouseenter', function () {
                    swiperInstance.autoplay.stop();
                });
                $carousel.on('mouseleave', function () {
                    swiperInstance.autoplay.start();
                });
            }
        });
    }

    // Handler for data-element_type="prestashop-widget-Search"
    function handlerPsSearch($) {
        var $searchWidget = $(this).find('.search-widget-autocomplete');
        if (!$searchWidget.length) {
            return;
        }

        if (elementorFrontendConfig.isEditMode) {
            return;
        }

        var $searchBox = $searchWidget.find('input[type=text]');
        var searchURL = $searchWidget.attr('data-search-controller-url');
        var initAutocomplete = prestashop.blocksearch.initAutocomplete || function () {
        };

        initAutocomplete($searchWidget, $searchBox, searchURL);
    }

    // Handler for data-element_type="progress"
    function handlerProgress($) {
        var $progressbar = $(this).find('.elementor-progress-bar');

        $progressbar.waypoint(function () {
            $progressbar.css('width', $progressbar.data('max') + '%');
        }, {offset: '90%'});
    }

    // Handler for data-element_type="section"
    function handlerSection($) {
        var $scope = this;

        // BackgroundVideo
        (function initBackgroundVideo() {
            var $backgroundVideoContainer = $scope.find('.elementor-background-video-container');
            if (!$backgroundVideoContainer.length) {
                return;
            }

            var player;
            var isYTVideo = false;
            var $backgroundVideo = $backgroundVideoContainer.children('.elementor-background-video');

            function calcVideosSize() {
                var containerWidth = $backgroundVideoContainer.outerWidth();
                var containerHeight = $backgroundVideoContainer.outerHeight();
                var aspectRatioArray = '16:9'.split(':');
                var aspectRatio = aspectRatioArray[0] / aspectRatioArray[1];
                var ratioWidth = containerWidth / aspectRatio;
                var ratioHeight = containerHeight * aspectRatio;
                var isWidthFixed = containerWidth / containerHeight > aspectRatio;

                return {
                    width: isWidthFixed ? containerWidth : ratioHeight,
                    height: isWidthFixed ? ratioWidth : containerHeight
                };
            }

            function changeVideoSize() {
                var $video = isYTVideo ? $(player.getIframe()) : $backgroundVideo;
                var size = calcVideosSize();
                $video.width(size.width).height(size.height);
            }

            function prepareYTVideo(YT, videoID) {
                player = new YT.Player($backgroundVideo[0], {
                    videoId: videoID,
                    events: {
                        onReady: function () {
                            player.mute();
                            changeVideoSize();
                            player.playVideo();
                        },
                        onStateChange: function (event) {
                            if (event.data === YT.PlayerState.ENDED) {
                                player.seekTo(0);
                            }
                        }
                    },
                    playerVars: {
                        controls: 0,
                        autoplay: 1,
                        mute: 1,
                        showinfo: 0
                    }
                });

                $(elementorFrontend.getScopeWindow()).on('resize', changeVideoSize);
            }

            var videoID = $backgroundVideo.data('video-id');

            if (videoID) {
                isYTVideo = true;
                elementorFrontend.utils.onYoutubeApiReady(function (YT) {
                    setTimeout(function () {
                        prepareYTVideo(YT, videoID);
                    }, 1);
                });
            } else {
                $backgroundVideo.one('canplay', changeVideoSize);
            }
        }());

        // SliderSection
        (function initSliderSection() {
            var $sliderSectionContainer = $scope.find('.elementor-swiper-section');
            if (!$sliderSectionContainer.length) {
                return;
            }

            var savedOptions = $sliderSectionContainer.data('slider_options');
            var swiperOptions = {
                touchEventsTarget: 'container',
                speed: 500,
                slidesPerView: 1,
                slidesPerGroup: 1
            };

            if (!savedOptions.allowTouchMove) {
                swiperOptions.allowTouchMove = false;
            }
            if (savedOptions.autoplay) {
                swiperOptions.autoplay = {
                    delay: savedOptions.autoplaySpeed,
                    disableOnInteraction: savedOptions.disableOnInteraction
                };
            }
            if (savedOptions.fade) {
                swiperOptions.effect = 'fade';
                swiperOptions.fadeEffect = {crossFade: true};
            }
            if (savedOptions.dots) {
                swiperOptions.pagination = {
                    el: '.swiper-pagination',
                    clickable: true
                };
            }
            if (savedOptions.arrows) {
                swiperOptions.navigation = {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                };
            }

            var swiperInstance = new Swiper($sliderSectionContainer[0], swiperOptions);

            if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
                $sliderSectionContainer.on('mouseenter', function () {
                    swiperInstance.autoplay.stop();
                });
                $sliderSectionContainer.on('mouseleave', function () {
                    swiperInstance.autoplay.start();
                });
            }
        }());
    }

    // Handler for data-element_type="tabs"
    function handlerTabs($) {
        var $scope = $(this);
        var defaultActiveTab = $scope.find('.elementor-tabs').data('active-tab');
        var $tabsTitles = $scope.find('.elementor-tab-title');
        var $tabs = $scope.find('.elementor-tab-content');
        var $active;
        var $content;

        if (!defaultActiveTab) {
            defaultActiveTab = 1;
        }

        function activateTab(tabIndex) {
            if ($active) {
                $active.removeClass('active');
                $content.removeClass('active');
            }

            $active = $tabsTitles.filter('[data-tab="' + tabIndex + '"]');
            $content = $tabs.filter('[data-tab="' + tabIndex + '"]');

            $active.addClass('active');
            $content.addClass('active');
        }

        activateTab(defaultActiveTab);

        $tabsTitles.on('click', function () {
            activateTab(this.dataset.tab);
        });
    }

    // Handler for data-element_type="testimonial"
    function handlerTestimonial($) {
        var $carousel = $(this).find('.elementor-testimonial-carousel');
        if (!$carousel.length) {
            return;
        }

        var savedOptions = $carousel.data('slider_options');
        var tabletSlides = savedOptions.slidesToShow === 1 ? 1 : 2;

        var swiperOptions = {
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
                    slidesPerGroup: tabletSlides
                },
                992: {
                    slidesPerView: savedOptions.slidesToShow,
                    slidesPerGroup: savedOptions.slidesToShow
                }
            }
        };

        if (savedOptions.autoplay) {
            swiperOptions.autoplay = {
                delay: savedOptions.autoplaySpeed,
                disableOnInteraction: savedOptions.disableOnInteraction
            };
        }
        if (savedOptions.fade) {
            swiperOptions.effect = 'fade';
            swiperOptions.fadeEffect = {crossFade: true};
        }
        if (savedOptions.dots) {
            swiperOptions.pagination = {
                el: $(this).find('.swiper-pagination').first()[0],
                clickable: true
            };
        }
        if (savedOptions.arrows) {
            swiperOptions.navigation = {
                nextEl: $(this).find('.elementor-swiper-button-next').first()[0],
                prevEl: $(this).find('.elementor-swiper-button-prev').first()[0]
            };
        }

        var swiperInstance = new Swiper($carousel[0], swiperOptions);

        if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
            $carousel.on('mouseenter', function () {
                swiperInstance.autoplay.stop();
            });
            $carousel.on('mouseleave', function () {
                swiperInstance.autoplay.start();
            });
        }
    }

    // Handler for data-element_type="toggle"
    function handlerToggle($) {
        var $toggleTitles = $(this).find('.elementor-toggle-title');

        $toggleTitles.on('click', function () {
            var $active = $(this);
            var $content = $active.next();

            if ($active.hasClass('active')) {
                $active.removeClass('active');
                $content.slideUp();
            } else {
                $active.addClass('active');
                $content.slideDown();
            }
        });
    }

    // Handler for data-element_type="video"
    function handlerVideo($) {
        var $scope = $(this);
        var $imageOverlay = $scope.find('.elementor-custom-embed-image-overlay');
        var $videoModalBtn = $scope.find('.elementor-video-open-modal').first();
        var $videoModal = $scope.find('.elementor-video-modal').first();
        var $video = $scope.find('.elementor-video').first();
        var $videoFrame = $scope.find('iframe');

        function enableAutoplay() {
            if ($video.length) {
                $video[0].play();
                return;
            }

            var newSourceUrl = $videoFrame[0].src.replace('autoplay=0', 'autoplay=1');
            $videoFrame[0].src = newSourceUrl;
        }

        function disableAutoplay() {
            if ($video.length) {
                $video[0].pause();
                return;
            }

            var newSourceUrl = $videoFrame[0].src.replace('autoplay=1', 'autoplay=0');
            $videoFrame[0].src = newSourceUrl;
        }

        if ($imageOverlay.length) {
            $imageOverlay.on('click', function () {
                $imageOverlay.remove();
                enableAutoplay();
            });
        }

        if ($videoModalBtn.length) {
            $videoModalBtn.on('click', enableAutoplay);
        }

        $videoModal.on('hide.bs.modal', disableAutoplay);
    }

    /******************************************************************
     * ElementorFrontend (sans Browserify)
     ******************************************************************/

    function ElementorFrontend() {
        var self = this;
        var scopeWindow = window;

        this.config = elementorFrontendConfig || {};
        this.elementsHandler = new ElementsHandler($);
        this.utils = new Utils($);

        this.getScopeWindow = function () {
            return scopeWindow;
        };

        this.setScopeWindow = function (w) {
            scopeWindow = w;
        };

        this.isEditMode = function () {
            return !!self.config.isEditMode;
        };

        // Basé sur _.throttle
        this.throttle = function (func, wait) {
            var timeout;
            var context;
            var args;
            var result;
            var previous = 0;

            function later() {
                previous = Date.now();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout) {
                    context = args = null;
                }
            }

            return function () {
                var now = Date.now();
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;

                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) {
                        context = args = null;
                    }
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }

                return result;
            };
        };

        function addGlobalHandlers() {
            self.elementsHandler.addGlobalHandler(handlerGlobal);
        }

        function addElementsHandlers() {
            var elementsDefaultHandlers = {
                //accordion: handlerAccordion,
                alert: handlerAlert,
                counter: handlerCounter,
                'image-carousel': handlerImageCarousel,
                instagram: handlerInstagram,
                testimonial: handlerTestimonial,
                progress: handlerProgress,
                section: handlerSection,
                tabs: handlerTabs,
                'prestashop-widget-Blog': handlerPsBlog,
                'prestashop-widget-ProductsList': handlerPsProductsList,
                'prestashop-widget-ProductsListTabs': handlerPsProductsListTabs,
                'prestashop-widget-Brands': handlerPsBrands,
                'prestashop-widget-Search': handlerPsSearch,
                'prestashop-widget-ContactForm': handlerPsContactForm,
                toggle: handlerToggle,
                video: handlerVideo
            };

            $.each(elementsDefaultHandlers, function (elementName, callback) {
                self.elementsHandler.addHandler(elementName, callback);
            });
        }

        function runElementsHandlers() {
            $('.elementor-element').each(function () {
                self.elementsHandler.runReadyTrigger($(this));
            });
        }

        this.init = function () {
            addGlobalHandlers();
            addElementsHandlers();
            runElementsHandlers();
        };
    }

    // Expose global
    window.elementorFrontend = new ElementorFrontend();

    $(function () {
        if (!elementorFrontend.isEditMode()) {
            elementorFrontend.init();
        }
    });

}(jQuery));