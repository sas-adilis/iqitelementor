var InnerTabsBehavior = require('../../../behaviors/tabs');

var EditorCompositeView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-editor-content' ),

	id: 'elementor-panel-page-editor',

	classes: {
		popover: 'elementor-controls-popover'
	},

	behaviors: {
		HandleInnerTabs: {
			behaviorClass: InnerTabsBehavior
		}
	},

	templateHelpers: function() {
		return {
			elementData: elementor.getElementData( this.model )
		};
	},

	childViewContainer: 'div.elementor-controls',

	modelEvents: {
		'destroy': 'onModelDestroy'
	},

	ui: {
		'tabs': '.elementor-tabs-controls li'
	},

	events: {
		'click @ui.tabs a': 'onClickTabControl'
	},

	initialize: function() {
		this.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	getChildView: function( item ) {
		var controlType = item.get( 'type' );
		return elementor.getControlItemView( controlType );
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model.get( 'settings' ),
			elementEditSettings: this.model.get( 'editSettings' )
		};
	},

	onDestroy: function() {
		this.getOption( 'editedElementView' ).$el.removeClass( 'elementor-element-editable' );
		this.model.trigger( 'editor:close' );

		this.triggerMethod( 'editor:destroy' );
	},

	onBeforeRender: function() {
		var controls = elementor.getElementControls( this.model.get( 'settings' ) );

		if ( ! controls ) {
			throw new Error( 'Editor controls not found' );
		}

		// Create new instance of that collection
		this.collection = new Backbone.Collection( controls );
	},

	onRender: function() {
		this.getOption( 'editedElementView' ).$el.addClass( 'elementor-element-editable' );

		// Wrap section controls in a container
		this.wrapSectionsControls();

		// Handle popovers
		this.handlePopovers();

		// Set the first tab as active
		this.ui.tabs.eq( 0 ).find( 'a' ).trigger( 'click' );

		// Create tooltip on controls
		this.$( '.tooltip-target' ).tipsy( {
			gravity: function() {
				// `n` for down, `s` for up
				var gravity = Backbone.$( this ).data( 'tooltip-pos' );

				if ( undefined !== gravity ) {
					return gravity;
				} else {
					return 'n';
				}
			},
			title: function() {
				return this.getAttribute( 'data-tooltip' );
			}
		} );

	},

	wrapSectionsControls: function() {
		var $controlsContainer = this.$( 'div.elementor-controls' ),
			$sections = $controlsContainer.find( '> .elementor-control-type-section' );

		$sections.each( function() {
			var $section = Backbone.$( this ),
				sectionName = $section.find( '[data-collapse_id]' ).data( 'collapse_id' ),
				$wrapper = Backbone.$( '<div class="elementor-section-wrapper elementor-section-wrapper-' + sectionName + '"></div>' ),
				$header = Backbone.$( '<div class="elementor-section-header"></div>' ),
				$content = Backbone.$( '<div class="elementor-section-content"></div>' ),
				$nextControls = $section.nextUntil( '.elementor-control-type-section' );

			// Insert wrapper before the section
			$section.before( $wrapper );

			// Build the structure: wrapper > header + content
			$header.append( $section );
			$content.append( $nextControls );
			$wrapper.append( $header );
			$wrapper.append( $content );
		} );
	},

	/**
	 * Handle popovers.
	 *
	 * Groups controls that belong to a popover into a container div.
	 */
	handlePopovers: function() {
		var self = this,
			popoverStarted = false,
			$popover;

		self.removePopovers();

		self.children.each( function( child ) {
			if ( popoverStarted ) {
				$popover.append( child.$el );
			}

			var popover = child.model.get( 'popover' );

			if ( ! popover ) {
				return;
			}

			if ( popover.start ) {
				popoverStarted = true;
				$popover = Backbone.$( '<div>', {
					'class': self.classes.popover
				} );
				child.$el.before( $popover );
				$popover.append( child.$el );
			}

			if ( popover.end ) {
				popoverStarted = false;
			}
		} );
	},

	/**
	 * Remove popovers.
	 *
	 * Removes all popover containers from the DOM.
	 */
	removePopovers: function() {
		this.$el.find( '.' + this.classes.popover ).remove();
	},

	onModelDestroy: function() {
		this.destroy();
	},

	onClickTabControl: function( event ) {
		event.preventDefault();

		var $thisTab = this.$( event.target );

		this.ui.tabs.removeClass( 'active' );
		$thisTab.closest( 'li' ).addClass( 'active' );

		this.model.get( 'settings' ).trigger( 'control:switch:tab', $thisTab.data( 'tab' ) );

		this.openFirstSectionInCurrentTab( $thisTab.data( 'tab' ) );
	},

	onDeviceModeChange: function() {
		var self = this;

		self.$el.removeClass( 'elementor-responsive-switchers-open' );

		// Timeout according to preview resize css animation duration
		setTimeout( function() {
			elementor.$previewContents.find( 'html, body' ).animate( {
				scrollTop: self.getOption( 'editedElementView' ).$el.offset().top - elementor.$preview[0].contentWindow.innerHeight / 2
			} );
		}, 500 );
	},

	/**
	 * Opens the first section in the current tab.
	 */
	openFirstSectionInCurrentTab: function( currentTab ) {
		var openedClass = 'elementor-open',
			self = this,

			firstSectionControlView = this.children.filter( function( view ) {
				return ( 'section' === view.model.get( 'type' ) ) && ( currentTab === view.model.get( 'tab' ) );
			} );

		// Check if found any section controls
		if ( _.isEmpty( firstSectionControlView ) ) {
			return;
		}

		// Close all sections first
		self.$( '.elementor-section-wrapper' ).removeClass( openedClass );
		self.$( '.elementor-control.elementor-control-type-section .elementor-panel-heading' ).removeClass( openedClass );

		// Open the first section
		firstSectionControlView = firstSectionControlView[0];
		firstSectionControlView.ui.heading.addClass( openedClass );
		firstSectionControlView.$el.closest( '.elementor-section-wrapper' ).addClass( openedClass );
	},

	onChildviewControlSectionClicked: function( childView ) {
		var openedClass = 'elementor-open',
			$wrapper = childView.$el.closest( '.elementor-section-wrapper' ),
			isSectionOpen = $wrapper.hasClass( openedClass );

		// Close all sections
		this.$( '.elementor-section-wrapper' ).removeClass( openedClass );
		this.$( '.elementor-control.elementor-control-type-section .elementor-panel-heading' ).removeClass( openedClass );

		// If the clicked section was not open, open it
		if ( ! isSectionOpen ) {
			childView.ui.heading.addClass( openedClass );
			$wrapper.addClass( openedClass );
		}

		elementor.channels.data.trigger( 'scrollbar:update' );
	}
} );

module.exports = EditorCompositeView;
