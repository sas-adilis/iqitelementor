var PanelRevisionsPageView;

PanelRevisionsPageView = Marionette.ItemView.extend( {
	id: 'elementor-panel-page-revisions',

	template: '#tmpl-elementor-panel-revisions',

	ui: {
		items: '.elementor-revision-item',
		applyBtn: '.elementor-revision-apply',
		loadingSpinner: '.elementor-revisions-loading'
	},

	events: {
		'click @ui.applyBtn': 'onClickApply'
	},

	selectedRevisionId: null,

	onRender: function() {
		this.loadRevisions();
	},

	loadRevisions: function() {
		var self = this,
			config = elementor.config,
			$ = Backbone.$;

		self.$el.html(
			'<div class="elementor-revisions-loading" style="text-align:center;padding:40px 0;">' +
			'<i class="fa fa-spin fa-circle-o-notch" style="font-size:24px;color:#999;"></i>' +
			'</div>'
		);

		$.ajax( {
			url: config.ajaxurl + '&action=GetRevisions',
			type: 'POST',
			data: {
				entity_type: config.page_type,
				entity_id: config.post_id
			},
			success: function( response ) {
				if ( ! response.success ) {
					self.$el.html( '<p style="padding:20px;color:#999;">' + elementor.translate( 'revisions_error_loading' ) + '</p>' );
					return;
				}
				self.renderRevisionsList( response );
			},
			error: function() {
				self.$el.html( '<p style="padding:20px;color:#999;">' + elementor.translate( 'revisions_error_loading' ) + '</p>' );
			}
		} );
	},

	renderRevisionsList: function( response ) {
		var html = '',
			$ = Backbone.$,
			self = this;

		// Actions bar
		html += '<div class="elementor-revisions-actions">';
		html += '<button class="elementor-revision-apply elementor-btn elementor-btn-success" disabled>' + elementor.translate( 'revisions_apply' ) + '</button>';
		html += '</div>';

		// Counter
		html += '<div class="elementor-revisions-counter">';
		html += response.count + ' / ' + response.limit + ' ' + elementor.translate( 'revisions_label' );
		html += '</div>';

		html += '<div class="elementor-revisions-list">';

		// Autosave item (if available)
		if ( response.autosave ) {
			var asTimeAgo = self.getTimeAgo( response.autosave.autosave_at );
			var asEmpName = response.autosave.employee_name || 'System';
			var asInitial = asEmpName.charAt( 0 ).toUpperCase();

			html += '<div class="elementor-revision-item elementor-revision-autosave" data-rev-id="autosave">';
			html += '<div class="elementor-revision-avatar elementor-revision-avatar--autosave">' + asInitial + '</div>';
			html += '<div class="elementor-revision-meta">';
			html += '<div class="elementor-revision-date">' + asTimeAgo + ' (' + self.formatDate( response.autosave.autosave_at ) + ')</div>';
			html += '<div class="elementor-revision-author">' + elementor.translate( 'revisions_autosave_by' ) + ' ' + self.escapeHtml( asEmpName ) + '</div>';
			html += '</div>';
			html += '</div>';
		}

		if ( response.revisions.length === 0 && ! response.autosave ) {
			html += '<p class="elementor-revisions-empty">' + elementor.translate( 'revisions_no_revisions' ) + '</p>';
		}

		// Revision items
		response.revisions.forEach( function( rev, index ) {
			var timeAgo = self.getTimeAgo( rev.created_at );
			var label = rev.label || elementor.translate( 'revisions_revision' );
			var empName = rev.employee_name || 'System';
			var initial = empName.charAt( 0 ).toUpperCase();
			var isCurrent = ( index === 0 );
			var currentIcon = isCurrent ? '<span class="elementor-revision-current-icon"><i class="fa fa-check"></i></span>' : '';

			html += '<div class="elementor-revision-item' + ( isCurrent ? ' elementor-revision-current' : '' ) + '" data-rev-id="' + rev.id + '">';
			html += '<div class="elementor-revision-avatar">' + initial + '</div>';
			html += '<div class="elementor-revision-meta">';
			html += '<div class="elementor-revision-date">' + timeAgo + ' (' + self.formatDate( rev.created_at ) + ')</div>';
			html += '<div class="elementor-revision-author">' + self.escapeHtml( label ) + ' ' + elementor.translate( 'revisions_by' ) + ' ' + self.escapeHtml( empName ) + ' (#' + rev.id + ')</div>';
			html += '</div>';
			html += currentIcon;
			html += '</div>';
		} );

		html += '</div>';

		this.$el.html( html );

		// Bind item click for selection
		this.$el.on( 'click', '.elementor-revision-item', function() {
			var $item = $( this ),
				revId = $item.data( 'rev-id' );

			self.$el.find( '.elementor-revision-item' ).removeClass( 'elementor-revision-selected' );
			$item.addClass( 'elementor-revision-selected' );
			self.selectedRevisionId = revId;

			self.$el.find( '.elementor-revision-apply, .elementor-revision-discard' ).prop( 'disabled', false );
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
