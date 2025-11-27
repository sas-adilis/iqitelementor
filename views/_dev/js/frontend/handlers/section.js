var BackgroundVideo = function ($, $backgroundVideoContainer) {
	var player,
		elements = {},
		isYTVideo = false;

	var calcVideosSize = function () {
		var containerWidth = $backgroundVideoContainer.outerWidth(),
			containerHeight = $backgroundVideoContainer.outerHeight(),
			aspectRatioSetting = '16:9', //TEMP
			aspectRatioArray = aspectRatioSetting.split(':'),
			aspectRatio = aspectRatioArray[0] / aspectRatioArray[1],
			ratioWidth = containerWidth / aspectRatio,
			ratioHeight = containerHeight * aspectRatio,
			isWidthFixed = containerWidth / containerHeight > aspectRatio;

		return {
			width: isWidthFixed ? containerWidth : ratioHeight,
			height: isWidthFixed ? ratioWidth : containerHeight
		};
	};

	var changeVideoSize = function () {
		var $video = isYTVideo ? $(player.getIframe()) : elements.$backgroundVideo,
			size = calcVideosSize();

		$video.width(size.width).height(size.height);
	};

	var prepareYTVideo = function (YT, videoID) {
		player = new YT.Player(elements.$backgroundVideo[0], {
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
	};

	var initElements = function () {
		elements.$backgroundVideo = $backgroundVideoContainer.children('.elementor-background-video');
	};

	var run = function () {
		var videoID = elements.$backgroundVideo.data('video-id');

		if (videoID) {
			isYTVideo = true;

			elementorFrontend.utils.onYoutubeApiReady(function (YT) {
				setTimeout(function () {
					prepareYTVideo(YT, videoID);
				}, 1);
			});
		} else {
			elements.$backgroundVideo.one('canplay', changeVideoSize);
		}
	};

	var init = function () {
		initElements();
		run();
	};

	init();
};





var SliderSection = function ($, $sliderSectionContainer) {

	var run = function () {


		var savedOptions = $sliderSectionContainer.data('slider_options'),
			swiperOptions = {
				touchEventsTarget: 'container',
				speed: 500,
				slidesPerView: 1,
				slidesPerGroup: 1,
			};

		if (!savedOptions.allowTouchMove) {
			swiperOptions.allowTouchMove = false;
		}

		if (savedOptions.autoplay) {
			swiperOptions.autoplay = {
				delay: savedOptions.autoplaySpeed,
				disableOnInteraction: savedOptions.disableOnInteraction,
			};
		}

		if (savedOptions.fade) {
			swiperOptions.effect = 'fade';
			swiperOptions.fadeEffect = {
				crossFade: true
			};
		}
		if (savedOptions.dots) {
			swiperOptions.pagination = {
				el: '.swiper-pagination',
				clickable: true,
			};
		}
		if (savedOptions.arrows) {
			swiperOptions.navigation = {
				nextEl: '.swiper-button-next',
				prevEl: '.swiper-button-prev',
			};
		}

		var swiperInstance = new Swiper($sliderSectionContainer[0], swiperOptions);

		if (savedOptions.autoplay && savedOptions.disableOnInteraction) {
			$sliderSectionContainer.mouseenter(function () {
				swiperInstance.autoplay.stop();
			});
			$sliderSectionContainer.mouseleave(function () {
				swiperInstance.autoplay.start();
			});
		}

	};

	var init = function () {
		run();
	};

	init();
};


module.exports = function ($) {
	//new StretchedSection( $, this );

	var $backgroundVideoContainer = this.find('.elementor-background-video-container');

	if ($backgroundVideoContainer) {
		new BackgroundVideo($, $backgroundVideoContainer);
	}


	var $sliderSectionContainer = this.find('.elementor-swiper-section');

	if ($sliderSectionContainer.length) {
		new SliderSection($, $sliderSectionContainer);
	}
};
