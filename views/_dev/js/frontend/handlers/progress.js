module.exports = function( $ ) {
	var $progressbar = $( this ).find( '.elementor-progress-bar' );

	$progressbar.waypoint( function() {
		$progressbar.css( 'width', $progressbar.data( 'max' ) + '%' )
	}, { offset: '90%' } );
};
