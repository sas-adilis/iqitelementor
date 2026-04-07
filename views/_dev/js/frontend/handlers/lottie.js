/* global $, LottieInteractivity */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.lottie-animation', function () {
    var $player = $(this);

    if ($player.data('play') !== 'scroll') {
        return;
    }

    var offset = $player.data('offset') / 100;
    var container = $player.data('container') === 'body' ? 'body' : null;

    document.addEventListener('lottieLoaded', function () {
        if (typeof LottieInteractivity === 'undefined') {
            return;
        }

        LottieInteractivity.create({
            mode: 'scroll',
            player: $player[0],
            container: container,
            actions: [
                {
                    visibility: [offset, 1],
                    type: 'seek',
                    frames: [0, '100%']
                }
            ]
        });
    });
});
