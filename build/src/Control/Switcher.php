<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Switcher extends ControlBase
{
    public function getType(): string
    {
        return 'switcher';
    }

    public function contentTemplate(): void
    {
        ob_start(); ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<label class="elementor-switch">
					<input type="checkbox" data-setting="{{ data.name }}" class="elementor-switch-input" value="{{ data.return_value }}">
					<span class="elementor-switch-label" data-on="{{ data.label_on }}" data-off="{{ data.label_off }}"></span>
					<span class="elementor-switch-handle"></span>
				</label>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php ob_end_flush();
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_off' => '',
            'label_on' => '',
            'return_value' => 'yes',
        ];
    }
}
