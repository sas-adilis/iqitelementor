<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\Helper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class BoxShadow extends ControlBaseMultiple
{
    public function getType(): string
    {
        return 'box_shadow';
    }

    public function getDefaultValue(): array
    {
        return [
            'horizontal' => 0,
            'vertical' => 0,
            'blur' => 10,
            'spread' => 0,
            'inset' => '',
            'color' => 'rgba(0,0,0,0.5)',
        ];
    }

    public function getSliders(): array
    {
        return [
            ['label' => Translater::get()->l('Blur'), 'type' => 'blur', 'min' => 0, 'max' => 100],
            ['label' => Translater::get()->l('Spread'), 'type' => 'spread', 'min' => 0, 'max' => 100],
            ['label' => Translater::get()->l('Horizontal'), 'type' => 'horizontal', 'min' => -100, 'max' => 100],
            ['label' => Translater::get()->l('Vertical'), 'type' => 'vertical', 'min' => -100, 'max' => 100],
        ];
    }

    public function contentTemplate(): void
    {
        ?>
		<#
		var defaultColorValue = '';

		if ( data.default.color ) {
			if ( '#' !== data.default.color.substring( 0, 1 ) ) {
				defaultColorValue = '#' + data.default.color;
			} else {
				defaultColorValue = data.default.color;
			}

			defaultColorValue = ' data-default-color=' + defaultColorValue; // Quotes added automatically.
		}
		#>
		<div class="elementor-control-field">
			<label class="elementor-control-title"><?php echo Translater::get()->l('Color'); ?></label>
			<div class="elementor-control-input-wrapper">
				<input data-setting="color" class="elementor-box-shadow-color-picker" type="text" maxlength="7" placeholder="<?php Helper::escAttr('Hex Value'); ?>" data-alpha="true"{{{ defaultColorValue }}} />
			</div>
		</div>
		<?php foreach ($this->getSliders() as $slider) { ?>
			<div class="elementor-box-shadow-slider">
				<label class="elementor-control-title"><?php echo $slider['label']; ?></label>
				<div class="elementor-control-input-wrapper">
					<div class="elementor-slider" data-input="<?php echo $slider['type']; ?>"></div>
					<div class="elementor-slider-input">
						<input type="number" min="<?php echo $slider['min']; ?>" max="<?php echo $slider['max']; ?>" step="{{ data.step }}" data-setting="<?php echo $slider['type']; ?>"/>
					</div>
				</div>
			</div>
		<?php } ?>
		<?php
    }
}
