// Attention: DO NOT use this control since it has bugs
// TODO: This control is unused
var ControlBaseItemView = require( 'elementor-views/controls/base' ),
	ControlSelectSortItemView;

ControlSelectSortItemView = ControlBaseItemView.extend( {
	ui: function() {
		var ui = ControlBaseItemView.prototype.ui.apply( this, arguments );

		ui.select = '.elementor-select-sort';
		ui.selectedOptions = '.elementor-select-sort-selector';
		ui.selectedPreview = '.elementor-control-selected-preview';
		ui.buttonAdd = '.elementor-value-add';
		ui.buttonRemove = '.elementor-selected-value-remove';

		return ui;
	},

	childEvents: {
		'click @ui.buttonRemove': 'onClickRemove',
		'click @ui.buttonAdd': 'onClickAdd',
	},

	onReady: function() {

		var self = this;

		this.ui.selectedPreview.sortable( {
			axis: 'y',
			stop: function( event, ui ) {

				var $selectBox = $(self.ui.select).empty();

				$.map($(this).find('.elementor-selected-value-preview'), function(el) {
					$selectBox.append('<option value="' + $(el).data('value-id') + '" selected>'+ $(el).data('value-text') +'</option>');
				});

				$selectBox.trigger('change');
			}
		} );

	},

	onClickRemove: function(domEvent) {

		var $element = $(domEvent.currentTarget);
		var id = $element.data('value-id');
		$element.parents('.elementor-selected-value-preview').first().remove();
		$(this.ui.select).find('option[value=' + id +' ]').remove().prop("selected", false);
		$(this.ui.selectedOptions).find('option[value=' + id +' ]').prop('disabled', false).removeClass('hidden-option');

		$(this.ui.select).trigger('change');

	},

	onClickAdd: function(domEvent) {

		var self = this;

		$(this.ui.selectedOptions).find(':selected').each(function() {
			$option = $( this );

			if($option .prop('disabled') == true){
				return;
			}
			$optionClone = $option.clone().prop("selected", true);


			$option.prop('disabled', true);

			if($(self.ui.selectedOptions).data('remove')){
				$option.addClass('hidden-option');
			}

			$optionClone.appendTo(self.ui.select);
			var id = $(this).val();
			var text = $(this).text();

			$(self.ui.selectedPreview).append('<div class="elementor-selected-value-preview" data-value-text="' + text + '" data-value-id="' + id  + '"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div>' +
				'<div class="selected-value-preview-info">'
				+ text
				+ '<button data-value-id="' + id + '" data-value-text="' + text + '" class="elementor-selected-value-remove selected-value-remove' + id + '"><i class="fa fa-remove"></i></button></div></div>');
		});

		$(this.ui.select).trigger('change');


	},

	onBeforeDestroy: function() {

		this.$el.remove();
	}
} );

module.exports = ControlSelectSortItemView;
