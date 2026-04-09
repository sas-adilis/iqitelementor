var StyleItemView = require( 'elementor-styles/views/parts/style-item' ),
	StylesEmptyView = require( 'elementor-styles/views/parts/styles-empty' ),
	StyleLibraryCollectionView;

StyleLibraryCollectionView = Marionette.CompositeView.extend( {
	template: '#tmpl-elementor-style-library-styles',

	id: 'elementor-style-library-styles',

	childViewContainer: '#elementor-style-library-styles-container',

	emptyView: StylesEmptyView,

	childView: StyleItemView,

	ui: {
		filterSelect: '#elementor-style-library-filter-widget-type'
	},

	events: {
		'change @ui.filterSelect': 'onFilterChange'
	},

	onRender: function() {
		this._populateWidgetTypeDropdown();
	},

	/**
	 * Build the widget type dropdown from the collection data.
	 */
	_populateWidgetTypeDropdown: function() {
		var $select = this.ui.filterSelect;
		var types = {};

		this.collection.each( function( model ) {
			var wt = model.get( 'widget_type' );
			if ( wt && ! types[ wt ] ) {
				types[ wt ] = true;
			}
		} );

		var sortedTypes = Object.keys( types ).sort();

		sortedTypes.forEach( function( wt ) {
			// Try to get a human-readable title from elementor config
			var title = wt;
			if ( elementor.config && elementor.config.widgets && elementor.config.widgets[ wt ] ) {
				title = elementor.config.widgets[ wt ].title || wt;
			}
			$select.append(
				Backbone.$( '<option>' ).val( wt ).text( title )
			);
		} );
	},

	filter: function( childModel ) {
		var filterValue = this._filterWidgetType;

		if ( ! filterValue ) {
			return true;
		}

		return childModel.get( 'widget_type' ) === filterValue;
	},

	onFilterChange: function() {
		this._filterWidgetType = this.ui.filterSelect.val();
		this._renderChildren();
	}
} );

module.exports = StyleLibraryCollectionView;
