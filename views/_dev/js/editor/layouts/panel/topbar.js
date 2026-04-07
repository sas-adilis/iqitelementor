var TopBarItemView;

TopBarItemView = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-topbar-content',

	tagName: 'nav',

	id: 'elementor-topbar-tools',

	ui: {
		exit: '#elementor-topbar-exit',
		logo: '#elementor-topbar-logo',
		revisions: '#elementor-topbar-revisions',
		deviceButtons: '.elementor-topbar-device-btn',
		templates: '#elementor-topbar-templates',
		navigator: '#elementor-topbar-navigator',
		inspect: '#elementor-topbar-inspect',
		preview: '#elementor-topbar-preview',
		save: '#elementor-topbar-save',
		saveIcon: '#elementor-topbar-save .elementor-topbar-save-icon'
	},

	events: {
		'click @ui.exit': 'onClickExit',
		'click @ui.logo': 'onClickLogo',
		'click @ui.revisions': 'onClickRevisions',
		'click @ui.deviceButtons': 'onClickDeviceButton',
		'click @ui.templates': 'onClickTemplates',
		'click @ui.navigator': 'onClickNavigator',
		'click @ui.inspect': 'onClickInspect',
		'click @ui.preview': 'onClickPreview',
		'click @ui.save': 'onClickSave'
	},

	initialize: function() {
		this._initSaveDialog();
		this._initAutosave();

		this.listenTo( elementor.channels.editor, 'editor:changed', this.onEditorChanged );
		this.listenTo( elementor.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	_initSaveDialog: function() {
		var dialog;

		this.getSaveDialog = function() {
			if ( ! dialog ) {
				var $ = Backbone.$,
					$dialogMessage = $( '<div>', {
						'class': 'elementor-dialog-message'
					} ),
					$messageIcon = $( '<i>', {
						'class': 'fa fa-check-circle'
					} ),
					$messageText = $( '<div>', {
						'class': 'elementor-dialog-message-text'
					} ).text( elementor.translate( 'saved' ) );

				$dialogMessage.append( $messageIcon, $messageText );

				dialog = elementor.dialogsManager.createWidget( 'popup', {
					hide: {
						delay: 1500
					}
				} );

				dialog.setMessage( $dialogMessage );
			}

			return dialog;
		};
	},

	_initAutosave: function() {
		var self = this;

		// Autosave every 60 seconds when there are unsaved changes
		this._autosaveInterval = setInterval( function() {
			if ( elementor.isEditorChanged() ) {
				self._doAutosave();
			}
		}, 60000 );
	},

	_doAutosave: function() {
		var config = elementor.config,
			data = elementor.elements.toJSON();

		if ( ! data || ! data.length ) {
			return;
		}

		Backbone.$.ajax( {
			url: config.ajaxurl + '&action=SaveAutosave',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id,
				data: JSON.stringify( data )
			}
		} );
	},

	onClickExit: function() {
		if ( elementor.isEditorChanged() ) {
			var dialog = elementor.dialogsManager.createWidget( 'confirm', {
				headerMessage: elementor.translate( 'changes_lost' ),
				message: elementor.translate( 'dialog_confirm_changes_lost' ),
				strings: {
					confirm: elementor.translate( 'go_back' ),
					cancel: elementor.translate( 'cancel' )
				},
				onConfirm: function() {
					window.location = elementor.config.edit_post_link;
				}
			} );
			dialog.show();
		} else {
			window.location = elementor.config.edit_post_link;
		}
	},

	onClickLogo: function( e ) {
		e.preventDefault();
		window.location = elementor.config.edit_post_link;
	},

	onClickRevisions: function() {
		var panel = elementor.getPanelView();
		if ( panel.getCurrentPageName() === 'revisions' ) {
			panel.setPage( 'elements' );
		} else {
			panel.setPage( 'revisions', 'Revisions' );
		}
	},

	onClickDeviceButton: function( e ) {
		var newDeviceMode = Backbone.$( e.currentTarget ).data( 'device-mode' );
		elementor.changeDeviceMode( newDeviceMode );
	},

	onClickNavigator: function() {
		this.ui.navigator.toggleClass( 'active' );
		elementor.channels.editor.trigger( 'navigator:toggle' );
	},

	onClickTemplates: function() {
		elementor.templates.startModal( function() {
			elementor.templates.showTemplates();
		} );
	},

	onClickInspect: function() {
		// Toggle inspect mode via the panel footer (delegates to existing logic)
		var $inspectBtn = Backbone.$( '#elementor-panel-footer-inspect' );
		if ( $inspectBtn.length ) {
			$inspectBtn.trigger( 'click' );
		}
		this.ui.inspect.toggleClass( 'active' );
	},

	onClickPreview: function() {
		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		// Step 1: autosave current content
		var data = elementor.elements.toJSON();
		if ( ! data || ! data.length ) {
			return;
		}

		self.ui.preview.addClass( 'active' );

		$.ajax( {
			url: config.ajaxurl + '&action=SaveAutosave',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id,
				data: JSON.stringify( data )
			},
			success: function() {
				// Step 2: get the front-office preview URL
				$.ajax( {
					url: config.ajaxurl + '&action=GetPreviewUrl',
					type: 'POST',
					data: {
						page_type: config.page_type,
						page_id: config.post_id,
						content_type: config.content_type,
						id_lang: config.id_lang
					},
					success: function( response ) {
						self.ui.preview.removeClass( 'active' );
						if ( response.success && response.url ) {
							window.open( response.url, '_blank' );
						}
					},
					error: function() {
						self.ui.preview.removeClass( 'active' );
					}
				} );
			},
			error: function() {
				self.ui.preview.removeClass( 'active' );
			}
		} );
	},

	onClickSave: function() {
		var self = this;

		self.ui.save.addClass( 'elementor-topbar-save-loading' );

		var options = {
			revision: 'publish',
			onSuccess: function() {
				self.getSaveDialog().show();
				self.ui.save.removeClass( 'elementor-topbar-save-loading' );

				// Refresh revisions panel if currently displayed
				var panel = elementor.getPanelView();
				if ( panel.getCurrentPageName() === 'revisions' ) {
					panel.setPage( 'revisions', 'Revisions' );
				}
			}
		};

		elementor.saveBuilder( options );
	},

	onEditorChanged: function() {
		this.ui.save.toggleClass( 'elementor-topbar-save-active', elementor.isEditorChanged() );
	},

	onDeviceModeChange: function() {
		var previousDeviceMode = elementor.channels.deviceMode.request( 'previousMode' ),
			currentDeviceMode = elementor.channels.deviceMode.request( 'currentMode' );

		this.ui.deviceButtons.filter( '[data-device-mode="' + previousDeviceMode + '"]' ).removeClass( 'active' );
		this.ui.deviceButtons.filter( '[data-device-mode="' + currentDeviceMode + '"]' ).addClass( 'active' );
	},

	onDestroy: function() {
		if ( this._autosaveInterval ) {
			clearInterval( this._autosaveInterval );
		}
	}
} );

module.exports = TopBarItemView;
