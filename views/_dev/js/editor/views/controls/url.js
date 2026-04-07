var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlUrlItemView;

var _searchCache = {};

ControlUrlItemView = ControlMultipleBaseItemView.extend( {

	_dropdownOpen: false,
	_searchXhr: null,
	_entityMode: false,
	_outsideClickHandler: null,

	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.searchInput = '.elementor-control-url-search';
		ui.dropdown = '.elementor-control-url-dropdown';
		ui.inputWrap = '.elementor-control-url-input-wrap';
		ui.entityPreview = '.elementor-control-url-entity-preview';
		ui.entityType = '.elementor-control-url-entity-type';
		ui.entityLabel = '.elementor-control-url-entity-label';
		ui.entityClear = '.elementor-control-url-entity-clear';
		ui.btnExternal = 'button.elementor-control-url-target';
		ui.frameOpeners = '.elementor-control-url-media';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'input .elementor-control-url-search': 'onSearchInput',
			'focus .elementor-control-url-search': 'onSearchFocus',
			'keydown .elementor-control-url-search': 'onSearchKeydown',
			'click .elementor-control-url-entity-clear': 'onEntityClear',
			'click .elementor-control-url-target': 'onExternalClicked',
			'click .elementor-control-url-media': 'openFrame',
			'click .elementor-control-url-dropdown-item': 'onDropdownItemClick'
		} );
	},

	onReady: function() {
		if ( this.getControlValue( 'is_external' ) ) {
			this.ui.btnExternal.addClass( 'active' );
		}

		this._restoreEntityPreview();
	},

	// ──────────────────────────────────────
	// Entity preview (when an entity is selected)
	// ──────────────────────────────────────

	_restoreEntityPreview: function() {
		var type = this.getControlValue( 'type' );
		var label = this.getControlValue( 'label' );

		if ( type && type !== 'custom' && label ) {
			this._showEntityPreview( type, label );
		} else {
			this._hideEntityPreview();
		}
	},

	_showEntityPreview: function( type, label ) {
		this._entityMode = true;
		this.ui.entityType.text( this._getTypeLabel( type ) );
		this.ui.entityLabel.text( label );
		this.ui.entityPreview.show();
		this.ui.inputWrap.hide();
	},

	_hideEntityPreview: function() {
		this._entityMode = false;
		this.ui.entityPreview.hide();
		this.ui.inputWrap.show();
	},

	_getTypeLabel: function( type ) {
		var labels = {
			'category': 'Category',
			'cms': 'CMS',
			'manufacturer': 'Brand',
			'supplier': 'Supplier'
		};
		return labels[ type ] || type;
	},

	onEntityClear: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue( {
			type: '',
			id: '',
			url: '',
			label: ''
		} );

		this._hideEntityPreview();
		this.ui.searchInput.val( '' ).focus();
	},

	// ──────────────────────────────────────
	// Search & dropdown
	// ──────────────────────────────────────

	onSearchFocus: function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();
		if ( val.length >= 2 ) {
			this._doSearch( val );
		}
	},

	onSearchInput: _.debounce( function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();

		if ( val.length < 2 ) {
			this._closeDropdown();

			// Treat as custom URL on blur/change
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: ''
			} );
			return;
		}

		// If it looks like a URL, set as custom immediately
		if ( this._looksLikeUrl( val ) ) {
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: ''
			} );
		}

		this._doSearch( val );
	}, 300 ),

	onSearchKeydown: function( e ) {
		// Escape closes dropdown
		if ( e.keyCode === 27 ) {
			this._closeDropdown();
			return;
		}

		// Enter on a custom URL
		if ( e.keyCode === 13 ) {
			e.preventDefault();
			this._closeDropdown();

			var val = ( this.ui.searchInput.val() || '' ).trim();
			if ( val ) {
				this.setValue( {
					type: 'custom',
					id: '',
					url: val,
					label: ''
				} );
			}
		}
	},

	_looksLikeUrl: function( str ) {
		return /^(https?:\/\/|\/|#|mailto:|tel:)/.test( str );
	},

	_doSearch: function( term ) {
		var self = this;

		// Cancel previous request
		if ( this._searchXhr ) {
			this._searchXhr.abort();
			this._searchXhr = null;
		}

		// Check cache
		var cacheKey = term.toLowerCase();
		if ( _searchCache[ cacheKey ] ) {
			self._renderDropdown( _searchCache[ cacheKey ], term );
			return;
		}

		// Show loading
		this.ui.dropdown.html( '<div class="elementor-control-url-dropdown-loading">...</div>' ).show();
		this._dropdownOpen = true;
		this._bindOutsideClick();

		this._searchXhr = elementor.ajax.send( 'SearchEntities', {
			data: {
				q: term
			},
			success: function( data ) {
				self._searchXhr = null;
				_searchCache[ cacheKey ] = data || [];
				self._renderDropdown( data || [], term );
			},
			error: function() {
				self._searchXhr = null;
				self._closeDropdown();
			}
		} );
	},

	_renderDropdown: function( results, term ) {
		var $dropdown = this.ui.dropdown;
		$dropdown.empty();

		if ( ! results.length ) {
			var noResult = this.ui.searchInput.data( 'no-result' ) || 'No results';
			$dropdown.html( '<div class="elementor-control-url-dropdown-empty">' + noResult + '</div>' );
			$dropdown.show();
			this._dropdownOpen = true;
			this._bindOutsideClick();
			return;
		}

		var fragment = document.createDocumentFragment();

		_.each( results, function( item ) {
			var div = document.createElement( 'div' );
			div.className = 'elementor-control-url-dropdown-item';
			div.setAttribute( 'data-type', item.type );
			div.setAttribute( 'data-id', item.id );
			div.setAttribute( 'data-label', item.name );

			var typeSpan = document.createElement( 'span' );
			typeSpan.className = 'elementor-control-url-dropdown-item-type';
			typeSpan.textContent = item.type_label;
			div.appendChild( typeSpan );

			var nameSpan = document.createElement( 'span' );
			nameSpan.className = 'elementor-control-url-dropdown-item-name';
			nameSpan.textContent = item.name;
			div.appendChild( nameSpan );

			fragment.appendChild( div );
		} );

		$dropdown[0].appendChild( fragment );
		$dropdown.show();
		this._dropdownOpen = true;
		this._bindOutsideClick();
	},

	onDropdownItemClick: function( e ) {
		var $item = Backbone.$( e.currentTarget );
		var type = $item.attr( 'data-type' );
		var id = $item.attr( 'data-id' );
		var label = $item.attr( 'data-label' );

		this.setValue( {
			type: type,
			id: id,
			url: '',
			label: label
		} );

		this._showEntityPreview( type, label );
		this._closeDropdown();
	},

	_closeDropdown: function() {
		this.ui.dropdown.hide().empty();
		this._dropdownOpen = false;
		this._unbindOutsideClick();
	},

	_bindOutsideClick: function() {
		if ( this._outsideClickHandler ) {
			return;
		}
		var self = this;
		this._outsideClickHandler = function( e ) {
			if ( ! Backbone.$( e.target ).closest( '.elementor-control-url-input-wrap' ).length ) {
				self._closeDropdown();
			}
		};
		_.defer( function() {
			Backbone.$( document ).on( 'click.urlSearch', self._outsideClickHandler );
		} );
	},

	_unbindOutsideClick: function() {
		if ( this._outsideClickHandler ) {
			Backbone.$( document ).off( 'click.urlSearch', this._outsideClickHandler );
			this._outsideClickHandler = null;
		}
	},

	// ──────────────────────────────────────
	// External & Media (keep existing behavior)
	// ──────────────────────────────────────

	openFrame: function() {
		openPsFileManager( 'elementor-control-url-field-' + this.model.cid, 2 );
	},

	onExternalClicked: function( e ) {
		e.preventDefault();
		this.ui.btnExternal.toggleClass( 'active' );
		this.setValue( 'is_external', this.isExternal() );
	},

	isExternal: function() {
		return this.ui.btnExternal.hasClass( 'active' );
	},

	// ──────────────────────────────────────
	// Value management
	// ──────────────────────────────────────

	applySavedValue: function() {
		ControlMultipleBaseItemView.prototype.applySavedValue.apply( this, arguments );

		var url = this.getControlValue( 'url' );
		var type = this.getControlValue( 'type' );

		// If entity mode, don't show URL in input
		if ( type && type !== 'custom' ) {
			this.ui.searchInput.val( '' );
		} else if ( url ) {
			this.ui.searchInput.val( url );
		}
	},

	// Override to handle custom URL changes from the input
	updateElementModel: function( event ) {
		var key = event.currentTarget.dataset.setting;

		if ( key === 'url' ) {
			var val = this.getInputValue( event.currentTarget );

			// Only update if not in entity mode
			if ( ! this._entityMode ) {
				this.setValue( {
					type: 'custom',
					id: '',
					url: val,
					label: ''
				} );
			}
			return;
		}

		ControlMultipleBaseItemView.prototype.updateElementModel.apply( this, arguments );
	},

	onBeforeDestroy: function() {
		this._unbindOutsideClick();
		if ( this._searchXhr ) {
			this._searchXhr.abort();
		}
	}
} );

module.exports = ControlUrlItemView;
