module.exports = function( $ ) {

    var $lottiePlayer = $( this ).find( '.lottie-animation' );
    var offset =  $lottiePlayer.data('offset') / 100;
    var container =  null;

    if ($lottiePlayer.data('container') == 'body'){
        container = 'body';
    }

    if (elementorFrontendConfig.isEditMode) {
        if($lottiePlayer.data('play') == 'scroll'){
            window.frames[0].frameElement.contentWindow.lottieInteractivyBackofficeRun(offset, $lottiePlayer[0], container);
        }
    } else{
        if($lottiePlayer.data('play') == 'scroll'){
        document.addEventListener("lottieLoaded", function(e) {

            LottieInteractivity.create({
                mode:'scroll',
                player: $lottiePlayer[0],
                container: container,
                actions: [
                    {
                        visibility:[offset,1],
                        type: 'seek',
                        frames: [0, '100%']
                    }
                ]
            });

        });
        }
    }
};



