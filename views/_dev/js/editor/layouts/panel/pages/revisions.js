var PanelRevisionsPageView;

PanelRevisionsPageView = Marionette.ItemView.extend( {
	id: 'elementor-panel-page-revisions',

	template: '#tmpl-elementor-panel-revisions',

	selectedRevisionId: null,

	events: {
		'click .elementor-revision-apply': 'onClickApply'
	},

	onRender: function() {
		this.loadRevisions();
	},

	loadRevisions: function() {
		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		$.ajax( {
			url: config.ajaxurl + '&action=GetRevisions',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id
			},
			success: function( response ) {
				if ( ! response.success ) {
					self.showError();
					return;
				}
				self.renderRevisionsList( response );
			},
			error: function() {
				self.showError();
			}
		} );
	},

	showError: function() {
		var tmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-error' );
		this.$el.html( tmpl() );
	},

	renderRevisionsList: function( response ) {
		var $ = Backbone.$,
			self = this;

		// Render the list wrapper
		var listTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-list' );
		this.$el.html( listTmpl() );

		var $list = this.$el.find( '.elementor-revisions-list' );

		// Autosave item
		if ( response.autosave ) {
			var asEmpName = response.autosave.employee_name || 'System';
			var autosaveTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-autosave' );

			var $autosave = $( '<div class="elementor-revision-item elementor-revision-autosave" data-rev-id="autosave"></div>' );
			$autosave.html( autosaveTmpl( {
				initial: asEmpName.charAt( 0 ).toUpperCase(),
				timeAgo: self.getTimeAgo( response.autosave.autosave_at ),
				formattedDate: self.formatDate( response.autosave.autosave_at ),
				employeeName: self.escapeHtml( asEmpName )
			} ) );
			$list.append( $autosave );
		}

		// Empty state
		if ( response.revisions.length === 0 && ! response.autosave ) {
			var emptyTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-empty' );
			$list.html( emptyTmpl() );
			return;
		}

		// Revision items
		var itemTmpl = Marionette.TemplateCache.get( '#tmpl-elementor-panel-revisions-item' );

		response.revisions.forEach( function( rev, index ) {
			var empName = rev.employee_name || 'System';
			var isCurrent = ( index === 0 );

			var $item = $( '<div class="elementor-revision-item" data-rev-id="' + rev.id + '"></div>' );

			if ( isCurrent ) {
				$item.addClass( 'elementor-revision-current' );
			}

			$item.html( itemTmpl( {
				id: rev.id,
				initial: empName.charAt( 0 ).toUpperCase(),
				timeAgo: self.getTimeAgo( rev.created_at ),
				formattedDate: self.formatDate( rev.created_at ),
				label: self.escapeHtml( rev.label || elementor.translate( 'revisions_revision' ) ),
				employeeName: self.escapeHtml( empName ),
				isCurrent: isCurrent
			} ) );

			$list.append( $item );
		} );

		// Bind item click for selection
		this.$el.on( 'click', '.elementor-revision-item', function() {
			var $item = $( this ),
				revId = $item.data( 'rev-id' );

			self.$el.find( '.elementor-revision-item' ).removeClass( 'elementor-revision-selected' );
			$item.addClass( 'elementor-revision-selected' );
			self.selectedRevisionId = revId;

			self.$el.find( '.elementor-revision-apply' ).prop( 'disabled', false );
		} );
	},

	onClickApply: function() {
		if ( ! this.selectedRevisionId ) {
			return;
		}

		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		// Autosave restore
		if ( self.selectedRevisionId === 'autosave' ) {
			$.ajax( {
				url: config.ajaxurl + '&action=GetAutosave',
				type: 'POST',
				data: {
					entity_type: config.page_type,
					entity_id: config.post_id
				},
				success: function( response ) {
					if ( response.success && response.content ) {
						var parsed = JSON.parse( response.content );
						elementor.elements.reset( parsed );
						elementor.setFlagEditorChange( true );
						elementor.getPanelView().setPage( 'elements' );
					}
				}
			} );
			return;
		}

		// Regular revision restore
		$.ajax( {
			url: config.ajaxurl + '&action=RestoreRevision',
			type: 'POST',
			data: { id_revision: self.selectedRevisionId },
			success: function( response ) {
				if ( response.success && response.content ) {
					var parsed = JSON.parse( response.content );
					elementor.elements.reset( parsed );
					elementor.setFlagEditorChange( true );
					elementor.getPanelView().setPage( 'elements' );
				}
			}
		} );
	},

	getTimeAgo: function( dateStr ) {
		var now = new Date(),
			date = new Date( dateStr.replace( ' ', 'T' ) ),
			diff = Math.floor( ( now - date ) / 1000 );

		if ( diff < 60 ) { return diff + ' ' + elementor.translate( 'revisions_seconds_ago' ); }
		if ( diff < 3600 ) { return Math.floor( diff / 60 ) + ' ' + elementor.translate( 'revisions_min_ago' ); }
		if ( diff < 86400 ) { return Math.floor( diff / 3600 ) + ' ' + elementor.translate( 'revisions_hours_ago' ); }
		return Math.floor( diff / 86400 ) + ' ' + elementor.translate( 'revisions_days_ago' );
	},

	formatDate: function( dateStr ) {
		var d = new Date( dateStr.replace( ' ', 'T' ) );
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return d.getDate() + ' ' + months[ d.getMonth() ] + ' @ ' +
			( '0' + d.getHours() ).slice( -2 ) + ':' + ( '0' + d.getMinutes() ).slice( -2 );
	},

	escapeHtml: function( str ) {
		var div = document.createElement( 'div' );
		div.textContent = str;
		return div.innerHTML;
	}
} );

module.exports = PanelRevisionsPageView;
