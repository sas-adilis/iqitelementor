var ControlMultipleBaseItemView = require( 'elementor-views/controls/base-multiple' ),
	ControlMediaItemView;

ControlMediaItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.controlMedia = '.elementor-control-media';
		ui.frameOpeners = '.elementor-control-media-upload-button, .elementor-control-media-image';
		ui.deleteButton = '.elementor-control-media-delete';
		ui.fileField = '.elementor-control-media-field';

		return ui;
	},

	childEvents: {
		'click @ui.frameOpeners': 'openFrame',
		'click @ui.deleteButton': 'deleteImage',
		'input @ui.fileField': 'select'
	},

	onReady: function() {
		if ( _.isEmpty( this.getControlValue( 'url' ) ) ) {
			this.ui.controlMedia.addClass( 'media-empty' );
		} else{
			var attachment = this.ui.fileField.val();

			if ( attachment) {
				var img = new Image();
				var self = this;

				img.onload = function() {
					var width = this.width;
					var  height = this.height;
					self.setValue( {
						url: attachment,
						id: 1,
						width: width,
						height: height,
					});
				};
				img.src = attachment;
			}
		}
	},

	openFrame: function() {
		openPsFileManager('elementor-control-media-field-' + this.model.cid, 1);
	},

	deleteImage: function() {
		this.setValue( {
			url: '',
			width: '',
			height: '',
			id: ''
		} );

		this.render();
	},

	select: function() {
		var attachment = this.ui.fileField.val();

		if ( attachment) {
			var img = new Image();
			var self = this;

			img.onload = function() {
				var width = this.width;
				var  height = this.height;
				self.setValue( {
					url: attachment,
					id: 1,
					width: width,
					height: height,
				});
				self.render();
				self.ui.fileField.val(attachment);
			};

			img.src = attachment;
		}
	},

	onBeforeDestroy: function() {
		this.$el.remove();
	}
} );

module.exports = ControlMediaItemView;
