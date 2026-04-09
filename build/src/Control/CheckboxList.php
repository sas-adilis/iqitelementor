<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class CheckboxList extends ControlBaseMultiple
{
    public function getType(): string
    {
        return 'checkbox_list';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<# _.each( data.options, function( option_title, option_value ) { #>
					<div>
						<label class="elementor-control-title">
							<input type="checkbox" data-setting="{{ option_value }}" />
							<span>{{{ option_title }}}</span>
						</label>
					</div>
				<# } ); #>
			</div>
		</div>
		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
