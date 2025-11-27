module.exports = function( $ ) {

	var $number = $( this ).find(  '.elementor-counter-number' );

	$number.waypoint( function() {
		$number.numerator( {
			duration: $number.data( 'duration' )
		} );
	}, { offset: '90%' } );
};
