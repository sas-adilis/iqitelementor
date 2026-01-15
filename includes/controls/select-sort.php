<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Control_Select_Sort extends Control_Base
{
    public function get_type()
    {
        return 'select_sort';
    }

    public function get_default_settings()
    {
        return [
            'multiple' => false,
            'remove' => true,
        ];
    }

    public function content_template()
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>

			<select class="elementor-select-sort-selector" 	<# if ( data.multiple ) { #> multiple <# } #> <# if ( data.remove ) { #> data-remove="1" <# } #>>
					<# _.each( data.options, function( option_title, option_value ) {
						#>
						<option value="{{ option_value }}" <# if ( !option_title.selectable ) { #>  disabled class="title-option" <# } #>  <# if (_.contains(data.controlValue, option_value)){ #> disabled  <# if ( data.remove ) { #>  class="hidden-option"  <# } #> <# }  #> >{{{ option_title.name }}}</option>
						<#
							} ); #>
							</select>


		</div>
		<button class="elementor-button elementor-value-add"><i class="fa fa-angle-down"></i><?php \IqitElementorTranslater::get()->l('Select', 'elementor'); ?></button>

		<div class="elementor-control-field"><label class="elementor-control-title"><?php \IqitElementorTranslater::get()->l('Selected', 'elementor'); ?></label></div>
		<div class="elementor-control-field">
			<div class="elementor-control-selected-preview">
						<# _.each( data.controlValue, function(option_value) {
							if (!_.isEmpty(data.options[option_value])){#>
							<div class="elementor-selected-value-preview" data-value-text="{{{ data.options[option_value]  }}}" data-value-id="{{ option_value }}"><div class="elementor-repeater-row-handle-sortable"><i class="fa fa-ellipsis-v"></i></div>
								<div class="selected-value-preview-info">{{{ data.options[option_value].name  }}}<button data-value-id="{{ option_value }}" data-value-text="{{{ data.options[option_value].name  }}}" class="elementor-selected-value-remove selected-value-remove{{ option_value }}"><i class="fa fa-remove"></i></button></div></div>
							<# }} ); #>
			</div>


			<div class="elementor-control-input-wrapper elementor-control-type-select_sort">
				<select class="elementor-select-sort" data-setting="{{ data.name }}" 	<# if ( data.multiple ) { #> multiple <# } #>>
						<# _.each( data.controlValue, function(option_value) {
							if (!_.isEmpty(data.options[option_value])){
							#>
							<option value="{{ option_value }}">{{{ data.options[option_value].name}}}</option>
							<# }} ); #></select>
			</div>

		</div>



		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
			<# } #>
		<?php
    }
}
