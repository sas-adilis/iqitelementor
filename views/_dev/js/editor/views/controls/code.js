var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlCodeItemView;

ControlCodeItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.editor = '.elementor-code-editor';
		ui.textarea = '.elementor-code-editor-value';

		return ui;
	},

	editor: null,
	markerIds: [],

	onReady: function() {
		var self = this;

		if ( typeof ace === 'undefined' ) {
			return;
		}

		var editorElement = this.ui.editor[0];
		var mode = this.ui.editor.data( 'mode' ) || 'css';

		this.editor = ace.edit( editorElement );
		this.editor.setTheme( 'ace/theme/tomorrow' );
		this.editor.session.setMode( 'ace/mode/' + mode );
		this.editor.setOptions( {
			minLines: 8,
			maxLines: 20,
			showPrintMargin: false,
			fontSize: 12,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true
		});

		// Add custom completer for "selector" keyword
		this.addSelectorCompleter();

		// Set initial value
		var initialValue = this.getControlValue() || '';
		this.editor.setValue( initialValue, -1 );

		// Highlight "selector" keyword
		this.highlightSelector();

		// Listen for changes
		this.editor.session.on( 'change', function() {
			self.setValue( self.editor.getValue() );
			self.highlightSelector();
		} );
	},

	addSelectorCompleter: function() {
		if ( typeof ace.require !== 'function' ) {
			return;
		}

		var langTools = ace.require( 'ace/ext/language_tools' );
		if ( ! langTools ) {
			return;
		}

		var selectorCompleter = {
			getCompletions: function( editor, session, pos, prefix, callback ) {
				callback( null, [
					{
						caption: 'selector',
						value: 'selector',
						meta: 'Wrapper',
						score: 1
					}
				]);
			}
		};

		langTools.addCompleter( selectorCompleter );
	},

	highlightSelector: function() {
		var self = this;
		var session = this.editor.session;
		var Range = ace.require( 'ace/range' ).Range;

		// Remove previous markers
		this.markerIds.forEach( function( id ) {
			session.removeMarker( id );
		});
		this.markerIds = [];

		// Find and highlight all "selector" occurrences
		var content = session.getValue();
		var regex = /\bselector\b/g;
		var match;

		while ( ( match = regex.exec( content ) ) !== null ) {
			var startPos = session.doc.indexToPosition( match.index );
			var endPos = session.doc.indexToPosition( match.index + match[0].length );
			var range = new Range( startPos.row, startPos.column, endPos.row, endPos.column );

			var markerId = session.addMarker( range, 'ace_selector_highlight', 'text', true );
			self.markerIds.push( markerId );
		}
	},

	onBeforeDestroy: function() {
		if ( this.editor ) {
			this.editor.destroy();
			this.editor = null;
		}
	},

	applySavedValue: function() {
		if ( this.editor ) {
			var value = this.getControlValue() || '';
			if ( this.editor.getValue() !== value ) {
				this.editor.setValue( value, -1 );
			}
		}
	}
} );

module.exports = ControlCodeItemView;
