<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Control_Choose extends Control_Base
{
    public function get_type()
    {
        return 'choose';
    }

    public function content_template()
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<div class="elementor-choices">
					<# _.each( data.options, function( options, value ) { #>
					<input id="elementor-choose-{{ data._cid + data.name + value }}" type="radio" name="elementor-choose-{{ data.name }}" value="{{ value }}">
					<label class="elementor-choices-label<# if ( options.icon ) { #> tooltip-target<# } #>"
					       for="elementor-choose-{{ data._cid + data.name + value }}"
					       <# if ( options.icon ) { #>
					           data-tooltip="{{ options.title }}" title="{{ options.title }}"
					       <# } #>
					>
					    <# if ( options.icon ) { #>
					        <i class="{{ options.icon }}"></i>
					    <# } else { #>
					        <span class="elementor-choices-text">{{ options.title }}</span>
					    <# } #>
					</label>
					<# } ); #>
				</div>
			</div>
		</div>

		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }

    protected function get_default_settings()
    {
        return [
            'label_block' => true,
            'toggle' => true,
        ];
    }
}
