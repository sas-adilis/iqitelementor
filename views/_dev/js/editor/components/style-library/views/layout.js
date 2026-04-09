var StyleLibraryHeaderView = require( 'elementor-styles/views/parts/header' ),
	StyleLibraryHeaderLogoView = require( 'elementor-styles/views/parts/header-logo' ),
	StyleLibraryHeaderSaveView = require( 'elementor-styles/views/parts/header-save' ),
	StyleLibraryHeaderLoadView = require( 'elementor-styles/views/parts/header-load' ),
	StyleLibraryLoadingView = require( 'elementor-styles/views/parts/loading' ),
	StyleLibraryCollectionView = require( 'elementor-styles/views/parts/styles' ),
	StyleLibrarySaveView = require( 'elementor-styles/views/parts/save-style' ),
	StyleLibraryLoadStyleView = require( 'elementor-styles/views/parts/load-style' ),
	StyleLibraryLayoutView;

StyleLibraryLayoutView = Marionette.LayoutView.extend( {
	el: '#elementor-style-library-modal',

	regions: {
		modalContent: '.dialog-message',
		modalHeader: '.dialog-widget-header'
	},

	initialize: function() {
		this.getRegion( 'modalHeader' ).show( new StyleLibraryHeaderView() );
	},

	getHeaderView: function() {
		return this.getRegion( 'modalHeader' ).currentView;
	},

	showLoadingView: function() {
		this.getRegion( 'modalContent' ).show( new StyleLibraryLoadingView() );
	},

	showStylesView: function( stylesCollection ) {
		this.getRegion( 'modalContent' ).show( new StyleLibraryCollectionView( {
			collection: stylesCollection
		} ) );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.show( new StyleLibraryHeaderSaveView() );
		headerView.tools2.show( new StyleLibraryHeaderLoadView() );
	},

	showSaveStyleView: function( widgetType, settings ) {
		this.getRegion( 'modalContent' ).show( new StyleLibrarySaveView( {
			widgetType: widgetType,
			settings: settings
		} ) );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.reset();
		headerView.tools2.show( new StyleLibraryHeaderLoadView() );
	},

	showLoadStyleView: function() {
		this.getRegion( 'modalContent' ).show( new StyleLibraryLoadStyleView() );

		var headerView = this.getHeaderView();
		headerView.logoArea.show( new StyleLibraryHeaderLogoView() );
		headerView.tools.show( new StyleLibraryHeaderSaveView() );
		headerView.tools2.reset();
	}
} );

module.exports = StyleLibraryLayoutView;
