<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseUnits;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Slider extends ControlBaseUnits
{
    public function getType(): string
    {
        return 'slider';
    }

    public function getDefaultValue(): array
    {
        return array_merge(parent::getDefaultValue(), [
            'size' => '',
        ]);
    }

    protected function getDefaultSettings(): array
    {
        return array_merge(parent::getDefaultSettings(), [
            'label_block' => true,
        ]);
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<?php $this->printUnitsTemplate(); ?>
			<div class="elementor-control-input-wrapper">
				<div class="elementor-slider"></div>
				<div class="elementor-slider-input">
					<input type="number" min="{{ data.min }}" max="{{ data.max }}" step="{{ data.step }}" data-setting="size" />
				</div>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
