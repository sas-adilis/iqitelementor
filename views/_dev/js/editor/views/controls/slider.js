var ControlBaseUnitsItemView = require( 'elementor-views/controls/base-units' ),
	ControlSliderItemView;

ControlSliderItemView = ControlBaseUnitsItemView.extend( {
	ui: function() {
		var ui = ControlBaseUnitsItemView.prototype.ui.apply( this, arguments );

		ui.slider = '.elementor-slider';

		return ui;
	},

	childEvents: {
		'slide @ui.slider': 'onSlideChange'
	},

	_isCustomUnit: function() {
		return 'custom' === this.getControlValue( 'unit' );
	},

	_setInputMode: function( isCustom ) {
		this.ui.input.attr( 'type', isCustom ? 'text' : 'number' );

		if ( isCustom ) {
			this.ui.input.removeAttr( 'min' ).removeAttr( 'max' ).removeAttr( 'step' );
		}
	},

	_applyNumberConstraints: function( unitRange ) {
		// jQuery 3.5.1: éviter attr(object) (peut throw si une valeur n'est pas une string)
		// unitRange vient typiquement de getCurrentRange(): { min, max, step }
		this.ui.input
			.removeAttr( 'min' )
			.removeAttr( 'max' )
			.removeAttr( 'step' );

		if ( unitRange && null != unitRange.min ) {
			this.ui.input.attr( 'min', unitRange.min );
		}
		if ( unitRange && null != unitRange.max ) {
			this.ui.input.attr( 'max', unitRange.max );
		}
		if ( unitRange && null != unitRange.step ) {
			this.ui.input.attr( 'step', unitRange.step );
		}
	},

	_destroySliderIfNeeded: function() {
		// jQuery UI slider: éviter exceptions si pas initialisé.
		if ( this.ui.slider && this.ui.slider.length && this.ui.slider.hasClass( 'ui-slider' ) ) {
			this.ui.slider.slider( 'destroy' );
		}
	},

	_updateUnitsUI: function() {
		var isCustom = this._isCustomUnit();

		this._setInputMode( isCustom );

		if ( isCustom ) {
			this._destroySliderIfNeeded();
			this.ui.slider.hide();
			return;
		}

		this.ui.slider.show();
		this.initSlider();
	},

	initSlider: function() {
		// Ne pas initialiser le slider si on est en "custom".
		if ( this._isCustomUnit() ) {
			// En custom, on laisse l'input tel quel (texte libre).
			this._setInputMode( true );
			this.ui.slider.hide();
			return;
		}

		var size = this.getControlValue( 'size' ),
			unitRange = this.getCurrentRange();

		this._setInputMode( false );
		this._applyNumberConstraints( unitRange );

		/*// Normaliser size pour le slider (jQuery UI attend un nombre).
		if ( '' === size || null == size ) {
			size = unitRange && null != unitRange.min ? unitRange.min : 0;
		}
		size = Number( size );
		if ( isNaN( size ) ) {
			size = unitRange && null != unitRange.min ? Number( unitRange.min ) : 0;
		}*/

		this.ui.input.val( size );

		this._destroySliderIfNeeded();

		this.ui.slider.slider( _.extend( {}, unitRange, { value: size } ) );
	},

	resetSize: function() {
		this.setValue( 'size', '' );

		this.initSlider();
	},

	onReady: function() {
		this._updateUnitsUI();
	},

	onSlideChange: function( event, ui ) {
		this.setValue( 'size', ui.value );

		this.ui.input.val( ui.value );
	},

	onInputChange: function( event ) {
		var dataChanged = event.currentTarget.dataset.setting;

		if ( 'size' === dataChanged ) {
			if ( this._isCustomUnit() ) {
				return;
			}

			// Eviter d'envoyer une string vide / non-numérique au slider.
			var v = this.getControlValue( 'size' );
			v = Number( v );
			if ( isNaN( v ) ) {
				return;
			}

			this.ui.slider.slider( 'value', v );
		} else if ( 'unit' === dataChanged ) {
			// Si on repasse sur une unité numérique, la valeur doit être un entier "pur".
			// parseInt suffit: si "12px"/"12.5" => mismatch => on vide.
			if ( ! this._isCustomUnit() ) {
				const rawSize = this.getControlValue('size');
				if ( null != rawSize && '' !== rawSize ) {
					const trimmed = String( rawSize ).trim();
					const parsed = parseInt( trimmed, 10 );
					if ( isNaN( parsed ) || String( parsed ) !== trimmed ) {
						this.setValue( 'size', '' );
						if ( this.ui && this.ui.input && this.ui.input.length ) {
							this.ui.input.val( '' );
						}
					}
				}
			}

			this._updateUnitsUI();
		}
	},

	onBeforeDestroy: function() {
		this._destroySliderIfNeeded();
		this.$el.remove();
	}
} );

module.exports = ControlSliderItemView;
