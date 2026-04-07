<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Checkbox extends ControlBase
{
    public function getType(): string
    {
        return 'checkbox';
    }

    public function contentTemplate(): void
    {
        ?>
		<label class="elementor-control-title">
			<span>{{{ data.label }}}</span>
			<input type="checkbox" data-setting="{{ data.name }}" />
		</label>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
