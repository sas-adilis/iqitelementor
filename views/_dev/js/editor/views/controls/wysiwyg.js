var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlWysiwygItemView;

ControlWysiwygItemView = ControlBaseItemView.extend( {

	childEvents: {
		'keyup textarea.elementor-wp-editor': 'updateElementModel'
	},

	initialize: function() {
		ControlBaseItemView.prototype.initialize.apply( this, arguments );
		this.editorID = 'elementorwpeditor' + this.cid;

	},
	
	attachElContent: function() {
		var editorTemplate = elementor.config.wp_editor.replace( /elementorwpeditor/g, this.editorID ).replace( '%%EDITORCONTENT%%', this.getControlValue() );

		this.$el.html( editorTemplate );

		return this;
	},

	onShow: function() {
		tinymce.EditorManager.execCommand('mceAddEditor', false, this.editorID);
	},

	onBeforeDestroy: function() {
		tinymce.EditorManager.execCommand( 'mceRemoveEditor', true, this.editorID);
	}
} );

module.exports = ControlWysiwygItemView;
