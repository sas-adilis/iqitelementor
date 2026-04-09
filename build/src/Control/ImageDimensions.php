<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageDimensions extends ControlBaseMultiple
{
    public function getType(): string
    {
        return 'image_dimensions';
    }

    public function getDefaultValue(): array
    {
        return [
            'width' => '',
            'height' => '',
        ];
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'show_label' => false,
        ];
    }

    public function contentTemplate(): void
    {
        ?>
		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<div class="elementor-image-dimensions-field">
					<input type="text" data-setting="width" />
					<div class="elementor-image-dimensions-field-description"><?php echo Translater::get()->l('Width'); ?></div>
				</div>
				<div class="elementor-image-dimensions-separator">x</div>
				<div class="elementor-image-dimensions-field">
					<input type="text" data-setting="height" />
					<div class="elementor-image-dimensions-field-description"><?php echo Translater::get()->l('Height'); ?></div>
				</div>
				<button class="elementor-btn elementor-btn-success elementor-image-dimensions-apply-button"><?php echo Translater::get()->l('Apply'); ?></button>
			</div>
		</div>
		<?php
    }
}
