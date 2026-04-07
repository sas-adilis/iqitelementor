var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlIconItemView;

// Shared caches across all icon control instances (repeater rows, etc.)
var _manifestCache = {};
var _loadedCss = {};
var _svgCache = {};

ControlIconItemView = ControlBaseItemView.extend( {

	_currentLibrary: null,
	_allIcons: [],
	_filteredIcons: [],
	_renderOffset: 0,
	_BATCH_SIZE: 60,
	_panelOpen: false,
	_libraries: null,
	_outsideClickHandler: null,

	ui: function() {
		var parentUi = ControlBaseItemView.prototype.ui;
		if ( typeof parentUi === 'function' ) {
			parentUi = parentUi.call( this );
		}
		return _.extend( {}, parentUi, {
			picker: '.elementor-icon-picker',
			preview: '.elementor-icon-picker-preview',
			previewIcon: '.elementor-icon-picker-preview-icon',
			previewLabel: '.elementor-icon-picker-preview-label',
			clearBtn: '.elementor-icon-picker-clear',
			panel: '.elementor-icon-picker-panel',
			tabs: '.elementor-icon-picker-tabs',
			searchInput: '.elementor-icon-picker-search input',
			grid: '.elementor-icon-picker-grid'
		} );
	},

	events: function() {
		return _.extend( ControlBaseItemView.prototype.events.apply( this, arguments ), {
			'click .elementor-icon-picker-preview': 'onTogglePanel',
			'click .elementor-icon-picker-clear': 'onClearIcon',
			'input .elementor-icon-picker-search input': 'onSearchInput',
			'click .elementor-icon-picker-tab': 'onTabClick',
			'click .elementor-icon-picker-item': 'onIconClick'
		} );
	},

	onReady: function() {
		this._libraries = this.model.get( 'libraries' ) || {};
		var keys = _.keys( this._libraries );
		this._currentLibrary = keys[0] || null;

		// Build tabs only if multiple libraries
		if ( keys.length > 1 ) {
			this._renderTabs( keys );
		}

		// Restore preview from existing value
		this._restorePreview();

		// Load first library manifest
		if ( this._currentLibrary ) {
			this._loadManifest( this._currentLibrary );
		}

		// Infinite scroll
		this.ui.grid.on( 'scroll', _.bind( this._onGridScroll, this ) );
	},

	// ──────────────────────────────────────
	// Tabs
	// ──────────────────────────────────────

	_renderTabs: function( keys ) {
		var self = this;
		var $tabs = this.ui.tabs;
		$tabs.empty();

		_.each( keys, function( key ) {
			var lib = self._libraries[ key ];
			var $tab = Backbone.$( '<div class="elementor-icon-picker-tab" />' )
				.attr( 'data-library', key )
				.text( lib.label );

			if ( key === self._currentLibrary ) {
				$tab.addClass( 'active' );
			}
			$tabs.append( $tab );
		} );
	},

	onTabClick: function( e ) {
		var $tab = Backbone.$( e.currentTarget );
		var key = $tab.data( 'library' );

		if ( key === this._currentLibrary ) {
			return;
		}

		this.ui.tabs.find( '.elementor-icon-picker-tab' ).removeClass( 'active' );
		$tab.addClass( 'active' );

		this._currentLibrary = key;
		this.ui.searchInput.val( '' );
		this._loadManifest( key );
	},

	// ──────────────────────────────────────
	// Panel toggle
	// ──────────────────────────────────────

	onTogglePanel: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		if ( this._panelOpen ) {
			this._closePanel();
		} else {
			this._openPanel();
		}
	},

	_openPanel: function() {
		this.ui.panel.show();
		this._panelOpen = true;
		this.ui.searchInput.focus();

		// Close on click outside
		var self = this;
		this._outsideClickHandler = function( e ) {
			if ( ! Backbone.$( e.target ).closest( '.elementor-icon-picker' ).length ) {
				self._closePanel();
			}
		};

		_.defer( function() {
			Backbone.$( document ).on( 'click.iconPicker', self._outsideClickHandler );
		} );
	},

	_closePanel: function() {
		this.ui.panel.hide();
		this._panelOpen = false;
		Backbone.$( document ).off( 'click.iconPicker' );
	},

	// ──────────────────────────────────────
	// Manifest loading
	// ──────────────────────────────────────

	_loadManifest: function( key ) {
		var self = this;
		var lib = this._libraries[ key ];

		if ( ! lib ) {
			return;
		}

		// Check cache
		if ( _manifestCache[ key ] ) {
			self._onManifestLoaded( key, _manifestCache[ key ] );
			return;
		}

		// Show loading state
		this.ui.grid.html( '<div class="elementor-icon-picker-loading">Loading...</div>' );

		var url = elementor.config.assets_url + 'data/icon-manifests/' + lib.manifest;

		Backbone.$.getJSON( url )
			.done( function( data ) {
				_manifestCache[ key ] = data;
				self._onManifestLoaded( key, data );
			} )
			.fail( function() {
				self.ui.grid.html( '<div class="elementor-icon-picker-empty">Failed to load icons</div>' );
			} );
	},

	_onManifestLoaded: function( key, data ) {
		// Load CDN CSS for font preview in editor
		if ( data.cdnCss ) {
			this._loadLibraryCss( key, data.cdnCss );
		}

		this._allIcons = data.icons || [];
		this._renderGrid();
	},

	_loadLibraryCss: function( key, url ) {
		if ( _loadedCss[ key ] ) {
			return;
		}
		_loadedCss[ key ] = true;

		var link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = url;
		link.id = 'iqit-icon-lib-' + key;
		document.head.appendChild( link );
	},

	// ──────────────────────────────────────
	// Grid rendering
	// ──────────────────────────────────────

	_renderGrid: function() {
		this.ui.grid.empty().scrollTop( 0 );
		this._renderOffset = 0;

		var term = ( this.ui.searchInput.val() || '' ).toLowerCase().trim();

		if ( term ) {
			this._filteredIcons = _.filter( this._allIcons, function( icon ) {
				return icon.n.indexOf( term ) !== -1;
			} );
		} else {
			this._filteredIcons = this._allIcons;
		}

		if ( ! this._filteredIcons.length ) {
			var noResultText = this.ui.picker.data( 'no-result' ) || 'No icons found';
			this.ui.grid.html( '<div class="elementor-icon-picker-empty">' + noResultText + '</div>' );
			return;
		}

		this._renderBatch();
	},

	_renderBatch: function() {
		var batch = this._filteredIcons.slice( this._renderOffset, this._renderOffset + this._BATCH_SIZE );

		if ( ! batch.length ) {
			return;
		}

		var currentValue = this._getCurrentIconClass();
		var fragment = document.createDocumentFragment();

		_.each( batch, function( icon ) {
			var div = document.createElement( 'div' );
			div.className = 'elementor-icon-picker-item';
			if ( icon.c === currentValue ) {
				div.className += ' selected';
			}
			div.setAttribute( 'data-class', icon.c );
			div.setAttribute( 'data-style', icon.s );
			div.setAttribute( 'data-name', icon.n );
			div.title = icon.n;

			var i = document.createElement( 'i' );
			i.className = icon.c;
			div.appendChild( i );

			fragment.appendChild( div );
		} );

		this.ui.grid[0].appendChild( fragment );
		this._renderOffset += batch.length;
	},

	_onGridScroll: function() {
		var el = this.ui.grid[0];
		if ( el.scrollTop + el.clientHeight >= el.scrollHeight - 40 ) {
			this._renderBatch();
		}
	},

	// ──────────────────────────────────────
	// Search
	// ──────────────────────────────────────

	onSearchInput: _.debounce( function() {
		this._renderGrid();
	}, 200 ),

	// ──────────────────────────────────────
	// Icon selection & SVG fetch
	// ──────────────────────────────────────

	onIconClick: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		var $item = Backbone.$( e.currentTarget );
		var iconClass = $item.attr( 'data-class' );
		var style = $item.attr( 'data-style' );
		var name = $item.attr( 'data-name' );
		var library = this._currentLibrary;

		// Visual feedback
		this.ui.grid.find( '.selected' ).removeClass( 'selected' );
		$item.addClass( 'selected' );

		// Update preview immediately (using font icon)
		this._updatePreview( iconClass, name );

		// Fetch SVG, save to disk, then store only the key
		var self = this;
		this._fetchSvg( library, style, name, function( svg ) {
			if ( svg ) {
				self._saveSvgToDisk( library, style, name, svg, function( svgKey ) {
					var newValue = JSON.stringify( {
						library: library,
						value: iconClass,
						svgKey: svgKey || ''
					} );

					self.ui.input.val( newValue ).trigger( 'input' );
					self.setValue( newValue );
					self._closePanel();
				} );
			} else {
				var newValue = JSON.stringify( {
					library: library,
					value: iconClass
				} );

				self.ui.input.val( newValue ).trigger( 'input' );
				self.setValue( newValue );
				self._closePanel();
			}
		} );
	},

	_fetchSvg: function( library, style, name, callback ) {
		var cacheKey = library + '/' + style + '/' + name;

		if ( _svgCache[ cacheKey ] ) {
			callback( _svgCache[ cacheKey ] );
			return;
		}

		var manifest = _manifestCache[ library ];
		if ( ! manifest || ! manifest.cdnSvgBase ) {
			callback( '' );
			return;
		}

		// Build SVG URL based on library type
		var svgUrl;
		if ( library === 'bi' ) {
			// Bootstrap Icons: no style subfolder
			svgUrl = manifest.cdnSvgBase + '/' + name + '.svg';
		} else {
			// FA & Phosphor: style subfolder
			svgUrl = manifest.cdnSvgBase + '/' + style + '/' + name + '.svg';
		}

		Backbone.$.get( svgUrl )
			.done( function( data ) {
				var svg;
				if ( typeof data === 'string' ) {
					svg = data;
				} else if ( data && data.documentElement ) {
					svg = new XMLSerializer().serializeToString( data.documentElement );
				} else {
					svg = '';
				}
				_svgCache[ cacheKey ] = svg;
				callback( svg );
			} )
			.fail( function() {
				callback( '' );
			} );
	},

	_saveSvgToDisk: function( library, style, name, svg, callback ) {
		var cacheKey = library + '/' + style + '/' + name;

		// Already saved in this session
		if ( _svgCache[ '__saved__' + cacheKey ] ) {
			callback( cacheKey );
			return;
		}

		elementor.ajax.send( 'SaveSvgIcon', {
			data: {
				library: library,
				style: style,
				name: name,
				svg: svg
			},
			success: function( data ) {
				_svgCache[ '__saved__' + cacheKey ] = true;
				callback( data && data.svgKey ? data.svgKey : cacheKey );
			},
			error: function() {
				// Fallback: use the computed key even if save failed
				callback( cacheKey );
			}
		} );
	},

	// ──────────────────────────────────────
	// Clear
	// ──────────────────────────────────────

	onClearIcon: function( e ) {
		e.preventDefault();
		e.stopPropagation();

		this.ui.input.val( '' ).trigger( 'input' );
		this.setValue( '' );
		this.ui.previewIcon.empty();
		this.ui.previewLabel.text(
			this.$( '.elementor-icon-picker-preview-label' ).first().data( 'default' ) || 'Select Icon'
		);
		this.ui.clearBtn.hide();
		this.ui.grid.find( '.selected' ).removeClass( 'selected' );
	},

	// ──────────────────────────────────────
	// Value management
	// ──────────────────────────────────────

	setValue: function( value ) {
		this.setSettingsModel( value );
	},

	applySavedValue: function() {
		var value = this.getControlValue();
		this.$( 'input[data-setting]' ).val( typeof value === 'string' ? value : JSON.stringify( value ) );
		this._restorePreview();
	},

	_restorePreview: function() {
		var value = this.getControlValue();
		if ( ! value ) {
			this.ui.clearBtn.hide();
			return;
		}

		var iconClass = this._getCurrentIconClass();
		if ( iconClass ) {
			this._updatePreview( iconClass, iconClass.replace( /^(fa-\w+\s+fa-|bi\s+bi-|ph\s+ph-)/, '' ) );
		}
	},

	_getCurrentIconClass: function() {
		var value = this.getControlValue();
		if ( ! value ) {
			return '';
		}

		if ( typeof value === 'object' && value !== null && value.value ) {
			return value.value;
		}

		if ( typeof value === 'string' ) {
			try {
				var parsed = JSON.parse( value );
				if ( parsed && parsed.value ) {
					return parsed.value;
				}
			} catch ( e ) {
				// Legacy string value
				return value;
			}
		}

		return '';
	},

	_updatePreview: function( iconClass, label ) {
		this.ui.previewIcon.html( '<i class="' + iconClass + '"></i>' );
		this.ui.previewLabel.text( label );
		this.ui.clearBtn.show();
	},

	getFieldTitleValue: function() {
		var iconClass = this._getCurrentIconClass();
		return iconClass ? iconClass.replace( /^(fa-\w+\s+fa-|bi\s+bi-|ph\s+ph-)/, '' ) : '';
	},

	onBeforeDestroy: function() {
		this.ui.grid.off( 'scroll' );
		Backbone.$( document ).off( 'click.iconPicker' );
	}
} );

module.exports = ControlIconItemView;
