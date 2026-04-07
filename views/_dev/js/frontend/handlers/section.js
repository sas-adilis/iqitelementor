/* global $, elementorFrontend */

/**
 * Background video handler for sections.
 * The slider-section part is now handled by the centralized swiper.js handler.
 */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-background-video-container', function () {
    var $container = $(this);
    var $video = $container.children('.elementor-background-video');

    if (!$video.length) {
        return;
    }

    var videoID = $video.data('video-id');
    var isYTVideo = false;
    var player;

    function calcVideoSize() {
        var containerWidth = $container.outerWidth();
        var containerHeight = $container.outerHeight();
        var aspectRatio = 16 / 9;
        var ratioWidth = containerWidth / aspectRatio;
        var ratioHeight = containerHeight * aspectRatio;
        var isWidthFixed = containerWidth / containerHeight > aspectRatio;

        return {
            width: isWidthFixed ? containerWidth : ratioHeight,
            height: isWidthFixed ? ratioWidth : containerHeight
        };
    }

    function changeVideoSize() {
        var $target = isYTVideo ? $(player.getIframe()) : $video;
        var size = calcVideoSize();
        $target.width(size.width).height(size.height);
    }

    if (videoID) {
        // YouTube background video
        isYTVideo = true;

        if (typeof elementorFrontend !== 'undefined' && elementorFrontend.utils) {
            elementorFrontend.utils.onYoutubeApiReady(function (YT) {
                setTimeout(function () {
                    player = new YT.Player($video[0], {
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

                    $(window).on('resize', changeVideoSize);
                }, 1);
            });
        }
    } else {
        // Hosted video
        $video.one('canplay', changeVideoSize);
    }
});
