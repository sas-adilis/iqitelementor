/* global $, elementorFrontendConfig */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('[data-element_type="video"]', function () {
    var $widget = $(this);
    var $imageOverlay = $widget.find('.elementor-custom-embed-image-overlay');
    var $videoModalBtn = $widget.find('.elementor-video-open-modal').first();
    var $videoModal = $widget.find('.elementor-video-modal').first();
    var $video = $widget.find('.elementor-video').first();
    var $videoFrame = $widget.find('iframe');

    if ($imageOverlay.length) {
        $imageOverlay.on('click', function () {
            $imageOverlay.remove();

            if ($video.length) {
                $video[0].play();
                return;
            }

            if ($videoFrame.length) {
                var src = $videoFrame[0].src;
                $videoFrame[0].src = src.replace('autoplay=0', 'autoplay=1');
            }
        });
    }

    if (!$videoModalBtn.length) {
        return;
    }

    $videoModalBtn.on('click', function () {
        if ($video.length) {
            $video[0].play();
            return;
        }

        if ($videoFrame.length) {
            var src = $videoFrame[0].src;
            $videoFrame[0].src = src.replace('autoplay=0', 'autoplay=1');
        }
    });

    $videoModal.on('hide.bs.modal', function () {
        if ($video.length) {
            $video[0].pause();
            return;
        }

        if ($videoFrame.length) {
            var src = $videoFrame[0].src;
            $videoFrame[0].src = src.replace('autoplay=1', 'autoplay=0');
        }
    });
});
