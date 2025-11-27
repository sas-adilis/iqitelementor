module.exports = function( $ ) {
	var $this = $( this ),
		$imageOverlay = $this.find( '.elementor-custom-embed-image-overlay' ),
		$videoModalBtn = $this.find( '.elementor-video-open-modal' ).first(),
		$videoModal = $this.find( '.elementor-video-modal' ).first(),
		$video =  $this.find( '.elementor-video' ).first(),
		$videoFrame = $this.find( 'iframe' );



	if ( $imageOverlay.length ) {

		$imageOverlay.on( 'click', function() {
			$imageOverlay.remove();

			if ( $video.length ) {
				$video[ 0 ].play();

				return;
			}


			var newSourceUrl = $videoFrame[0].src;
			// Remove old autoplay if exists
			newSourceUrl = newSourceUrl.replace( 'autoplay=0', 'autoplay=1' );
			$videoFrame[0].src = newSourceUrl;
		} );
	}

	if ( ! $videoModalBtn.length ) {
		return;
	}


	$videoModalBtn.on( 'click', function() {

		if ( $video.length ) {
			$video[ 0 ].play();

			return;
		}


		var newSourceUrl = $videoFrame[0].src;
		// Remove old autoplay if exists
		newSourceUrl = newSourceUrl.replace( 'autoplay=0', 'autoplay=1' );
		$videoFrame[0].src = newSourceUrl;
	} );


	$videoModal.on('hide.bs.modal', function () {

		if ( $video.length ) {
			$video[ 0 ].pause();

			return;
		}

		var newSourceUrl = $videoFrame[0].src;
		// Remove old autoplay if exists
		newSourceUrl = newSourceUrl.replace( 'autoplay=1', 'autoplay=0' );
		$videoFrame[0].src = newSourceUrl;
	});


};
