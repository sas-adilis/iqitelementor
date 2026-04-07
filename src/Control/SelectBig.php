<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class SelectBig extends ControlBase
{
    public function getType(): string
    {
        return 'select_big';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<select data-setting="{{ data.name }}" 	<# if ( data.multiple ) { #> multiple <# } #>>
				<# _.each( data.options, function( option_title, option_value ) { #>
					<option value="{{ option_value }}">{{{ option_title }}}</option>
				<# } ); #>
				</select>
			</div>
		</div>
		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
