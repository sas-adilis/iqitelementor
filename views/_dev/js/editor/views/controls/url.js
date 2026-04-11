var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlUrlItemView;

var _searchCache = {};
var MIN_SEARCH_CHARS = 3;

ControlUrlItemView = ControlMultipleBaseItemView.extend( {

	_dropdownOpen: false,
	_searchXhr: null,
	_entityMode: false,
	_outsideClickHandler: null,
	_typeLabels: null,
	_optionsOpen: false,

	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.field = '.elementor-control-field';
		ui.searchInput = '.elementor-control-url-search';
		ui.dropdown = '.elementor-control-url-dropdown';
		ui.dropdownResults = '.elementor-control-url-dropdown-results';
		ui.dropdownLoading = '.elementor-control-url-dropdown-loading';
		ui.dropdownEmpty = '.elementor-control-url-dropdown-empty';
		ui.inputWrap = '.elementor-control-url-input-wrap';
		ui.entityPreview = '.elementor-control-url-entity-preview';
		ui.entityType = '.elementor-control-url-entity-type';
		ui.entityLabel = '.elementor-control-url-entity-label';
		ui.entityClear = '.elementor-control-url-entity-clear';
		ui.btnOptions = 'button.elementor-control-url-options';
		ui.optionsPanel = '.elementor-control-url-options-inline';
		ui.optionInputs = '.elementor-control-url-option';
		ui.frameOpeners = '.elementor-control-url-media';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'input .elementor-control-url-search': 'onSearchInput',
			'focus .elementor-control-url-search': 'onSearchFocus',
			'keydown .elementor-control-url-search': 'onSearchKeydown',
			'click .elementor-control-url-entity-clear': 'onEntityClear',
			'click .elementor-control-url-options': 'onOptionsToggle',
			'click .elementor-control-url-media': 'openFrame',
			'click .elementor-control-url-dropdown-item': 'onDropdownItemClick',
			'change .elementor-control-url-option[type="checkbox"]': 'onOptionCheckboxChange',
			'input .elementor-control-url-option-text': 'onOptionTextInput'
		} );
	},

	onReady: function() {
		this._typeLabels = this._readTypeLabels();
		this._syncOptionsUi();
		this._restoreEntityPreview();
	},

	// ──────────────────────────────────────
	// Entity preview (when an entity is selected)
	// ──────────────────────────────────────

	_readTypeLabels: function() {
		var raw = this.ui.field.attr( 'data-type-labels' );
		if ( ! raw ) {
			return {};
		}
		try {
			return JSON.parse( raw );
		} catch ( err ) {
			return {};
		}
	},

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
		this.ui.entityPreview.prop( 'hidden', false );
		this.ui.inputWrap.prop( 'hidden', true );
	},

	_hideEntityPreview: function() {
		this._entityMode = false;
		this.ui.entityPreview.prop( 'hidden', true );
		this.ui.inputWrap.prop( 'hidden', false );
	},

	_getTypeLabel: function( type ) {
		// Prefer the value stored on the link (translated server-side when
		// the entity was picked). Fallback to the map injected on the field.
		var stored = this.getControlValue( 'type_label' );
		if ( stored ) {
			return stored;
		}
		if ( this._typeLabels && this._typeLabels[ type ] ) {
			return this._typeLabels[ type ];
		}
		return type;
	},

	onEntityClear: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue( {
			type: '',
			id: '',
			url: '',
			label: '',
			type_label: ''
		} );

		this._hideEntityPreview();
		this.ui.searchInput.val( '' ).focus();
	},

	// ──────────────────────────────────────
	// Search & dropdown
	// ──────────────────────────────────────

	onSearchFocus: function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();
		if ( val.length >= MIN_SEARCH_CHARS ) {
			this._doSearch( val );
		}
	},

	onSearchInput: _.debounce( function() {
		var val = ( this.ui.searchInput.val() || '' ).trim();

		if ( val.length < MIN_SEARCH_CHARS ) {
			this._closeDropdown();

			// Treat as custom URL on blur/change
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: '',
				type_label: ''
			} );
			return;
		}

		// If it looks like a URL, set as custom immediately
		if ( this._looksLikeUrl( val ) ) {
			this.setValue( {
				type: 'custom',
				id: '',
				url: val,
				label: '',
				type_label: ''
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
					label: '',
					type_label: ''
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
			self._renderDropdown( _searchCache[ cacheKey ] );
			return;
		}

		this._showDropdownState( 'loading' );

		this._searchXhr = elementor.ajax.send( 'SearchEntities', {
			data: {
				q: term
			},
			success: function( data ) {
				self._searchXhr = null;
				_searchCache[ cacheKey ] = data || [];
				self._renderDropdown( data || [] );
			},
			error: function() {
				self._searchXhr = null;
				self._closeDropdown();
			}
		} );
	},

	_showDropdownState: function( state ) {
		this.ui.dropdownResults.empty();
		this.ui.dropdownLoading.prop( 'hidden', state !== 'loading' );
		this.ui.dropdownEmpty.prop( 'hidden', state !== 'empty' );
		this.ui.dropdown.prop( 'hidden', false );
		this._dropdownOpen = true;
		this._bindOutsideClick();
	},

	_renderDropdown: function( results ) {
		if ( ! results.length ) {
			this._showDropdownState( 'empty' );
			return;
		}

		this.ui.dropdownLoading.prop( 'hidden', true );
		this.ui.dropdownEmpty.prop( 'hidden', true );

		var $results = this.ui.dropdownResults;
		$results.empty();

		var fragment = document.createDocumentFragment();

		_.each( results, function( item ) {
			var div = document.createElement( 'div' );
			div.className = 'elementor-control-url-dropdown-item';
			div.setAttribute( 'data-type', item.type );
			div.setAttribute( 'data-id', item.id );
			div.setAttribute( 'data-label', item.name );
			div.setAttribute( 'data-type-label', item.type_label || '' );
			if ( item.url ) {
				div.setAttribute( 'data-url', item.url );
			}

			var nameSpan = document.createElement( 'span' );
			nameSpan.className = 'elementor-control-url-dropdown-item-name';
			nameSpan.textContent = item.name;
			div.appendChild( nameSpan );

			var typeSpan = document.createElement( 'span' );
			typeSpan.className = 'elementor-control-url-dropdown-item-type';
			typeSpan.textContent = item.type_label;
			div.appendChild( typeSpan );

			fragment.appendChild( div );
		} );

		$results[0].appendChild( fragment );
		this.ui.dropdown.prop( 'hidden', false );
		this._dropdownOpen = true;
		this._bindOutsideClick();
	},

	onDropdownItemClick: function( e ) {
		var $item = Backbone.$( e.currentTarget );
		var type = $item.attr( 'data-type' );
		var id = $item.attr( 'data-id' );
		var label = $item.attr( 'data-label' );
		var typeLabel = $item.attr( 'data-type-label' ) || '';
		var url = $item.attr( 'data-url' ) || '';

		this.setValue( {
			type: type,
			id: id,
			url: url,
			label: label,
			type_label: typeLabel
		} );

		this._showEntityPreview( type, label );
		this._closeDropdown();
	},

	_closeDropdown: function() {
		this.ui.dropdown.prop( 'hidden', true );
		this.ui.dropdownResults.empty();
		this.ui.dropdownLoading.prop( 'hidden', true );
		this.ui.dropdownEmpty.prop( 'hidden', true );
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
	// Inline options (target / nofollow / custom attrs / custom id)
	// ──────────────────────────────────────

	_syncOptionsUi: function() {
		var self = this;
		this.ui.optionInputs.each( function() {
			var $input = Backbone.$( this );
			var key = $input.attr( 'data-option' );
			var val = self.getControlValue( key );
			if ( $input.attr( 'type' ) === 'checkbox' ) {
				$input.prop( 'checked', !! val );
			} else {
				$input.val( val || '' );
			}
		} );
		this._updateOptionsButtonState();
	},

	_updateOptionsButtonState: function() {
		var hasValue = !! ( this.getControlValue( 'is_external' )
			|| this.getControlValue( 'nofollow' )
			|| this.getControlValue( 'custom_attributes' ) );
		this.ui.btnOptions.toggleClass( 'active', hasValue );
	},

	onOptionsToggle: function( e ) {
		e.preventDefault();
		e.stopPropagation();
		this._optionsOpen = ! this._optionsOpen;
		this.ui.optionsPanel.prop( 'hidden', ! this._optionsOpen );
		this.ui.btnOptions.toggleClass( 'is-open', this._optionsOpen );
	},

	onOptionCheckboxChange: function( e ) {
		var $input = Backbone.$( e.currentTarget );
		var key = $input.attr( 'data-option' );
		this.setValue( key, $input.is( ':checked' ) ? 'yes' : '' );
		this._updateOptionsButtonState();
	},

	onOptionTextInput: _.debounce( function( e ) {
		var $input = Backbone.$( e.currentTarget );
		var key = $input.attr( 'data-option' );
		this.setValue( key, $input.val() );
		this._updateOptionsButtonState();
	}, 200 ),

	// ──────────────────────────────────────
	// Media (keep existing behavior)
	// ──────────────────────────────────────

	openFrame: function() {
		openPsFileManager( 'elementor-control-url-field-' + this.model.cid, 2 );
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
					label: '',
					type_label: ''
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
