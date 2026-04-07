<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class DateTime extends ControlBase
{
    public function getType(): string
    {
        return 'datetime';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<input type="text" class="tooltip-target datetimepicker" autocomplete="off" data-hex="true" data-tooltip="{{ data.title }}" title="{{ data.title }}" data-setting="{{ data.name }}" placeholder="{{ data.placeholder }}" />
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
