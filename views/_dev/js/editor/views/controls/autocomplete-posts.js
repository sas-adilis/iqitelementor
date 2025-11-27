var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlAutocompletePostsItemView;

ControlAutocompletePostsItemView = ControlBaseItemView.extend( {

	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.searchInput = '.elementor-control-autocomplete-search';
		ui.selectedOptions = '.elementor-control-selected-options';
		ui.selectedPreview = '.elementor-control-selected-preview';
		ui.buttonPostRemove = '.elementor-post-remove';

		return ui;
	},

	childEvents: {
		'click @ui.buttonPostRemove': 'onClickPostRemove',
	},


	onShow: function () {

		var self = this;

		self.ui.selectedPreview.sortable( {
		    axis: 'y',
            stop: function( event, ui ) {

		        var $selectBox = $(self.ui.selectedOptions).empty();

                $.map($(this).find('.elementor-post'), function(el) {
                    $selectBox.append('<option value="' + $(el).data('post-id') + '" selected>p</option>');
                });

                $selectBox.trigger('change');
            }
        } );

		self.insertPosts(this.getControlValue());

		var p_auto_settings = {
			minChars: 3,
			autoFill: true,
			max: 20,
			matchContains: true,
			mustMatch: true,
			dataType: 'json',
			extraParams: {
				format: 'json',
				excludeIds: self.getSelectedPostsIds(),
				action: 'SearchPosts'
			},
			parse: function (data) {
				var parsed = [];
				if (data == null)
					return true;
				for (var i = 0; i < data.length; i++) {
					parsed[parsed.length] = {
						data: data[i],
						value: data[i].name,
						result: data[i].name
					};
				}
				return parsed;
			},
			formatItem: function (item) {
				return '<img src="' + item.image + '" style="width: 30px; max-height: 100%; margin-right: 5px; border: 1px dotted #cecece; display: inline-block; vertical-align: middle;" />(ID: ' + item.id + ') ' + item.name;
			},
			cacheLength: 0,
		};

		$(this.ui.searchInput).autocomplete(ElementorConfig.ajaxurl, p_auto_settings).result(function (event, data, formatted) {
			if (data == null)
				return false;

			var optionHtml = '<option value="' + data.id + '" selected>' + '(ID: ' + data.id+ ') ' + data.name + '</option>';
			var previewHtml = '<div class="elementor-post" data-post-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-post-image" src="' + data.image + '" />' +
				'<div class="elementor-post-info"><span class="elementor-post-reference">(id: ' + data.id + ')</span>'
				+ data.name
				+ '<button data-post-id="' + data.id + '" class="elementor-post-remove elementor-post-remove2' + data.id + '"><i class="fa fa-remove"></i></button></div></div>';

			if ($(self.ui.searchInput).attr('data-single')) {
				$(self.ui.selectedOptions).html(optionHtml);
				$(self.ui.selectedPreview).html(previewHtml);
			} else{
				$(self.ui.selectedOptions).append(optionHtml);
				$(self.ui.selectedPreview).append(previewHtml);
			}



			$(self.ui.searchInput).setOptions({
				extraParams: {
					format: 'json',
					excludeIds : self.getSelectedPostsIds(),
					action: 'SearchPosts'
				}
			});

			$(self.ui.selectedOptions).trigger('change');
			$(this).val('');

		});

	},

	onClickPostRemove: function(domEvent) {

		var $post = $(domEvent.currentTarget);
		var postId = $post.data('post-id');

		$post.parents('.elementor-post').first().remove();

		$(this.ui.selectedOptions).find('option[value=' + postId +' ]').remove();

		$(this.ui.searchInput).setOptions({
			extraParams: {
				format: 'json',
				excludeIds : this.getSelectedPostsIds(),
				action: 'SearchPosts'
			}
		});

		$(this.ui.selectedOptions).trigger('change');


	},

	getSelectedPostsIds: function() {

		var ids = $(this.ui.selectedOptions).val();

		if (_.isUndefined(ids)|| ids == null) {
			return '';
		}
		else{
			return ids.toString();
		}

	},

	onBeforeDestroy: function() {

		$(this.ui.searchInput).unautocomplete();

	},

	insertPosts: function(ids) {

		if (_.isUndefined(ids)|| ids == null) {
			return;
		}

		var posts = null;
		var self = this;

		elementor.ajax.send( 'GetPosts', {
			data: {
				ids: ids.toString(),
			},
			success: function(data) {
				_.each( data, function( data ) {
					$(self.ui.selectedPreview).append('<div class="elementor-post" data-post-id="' + data.id + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div><img class="elementor-post-image" src="' + data.image + '" />' +
						'<div class="elementor-post-info"><span class="elementor-post-reference">(id: ' + data.id + ')</span>'
						+ data.name
						+ '<button data-post-id="' + data.id + '" class="elementor-post-remove"><i class="fa fa-remove"></i></button></div></div>');
				});
			}
		} );
		return posts;
	}

} );

module.exports = ControlAutocompletePostsItemView;


