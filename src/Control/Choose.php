<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Choose extends ControlBase
{
    public function getType(): string
    {
        return 'choose';
    }

    public function contentTemplate(): void
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

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'toggle' => true,
        ];
    }
}
