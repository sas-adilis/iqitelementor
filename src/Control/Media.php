<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Media extends ControlBaseMultiple
{
    public function getType(): string
    {
        return 'media';
    }

    public function getDefaultValue(): array
    {
        return [
            'url' => '',
            'id' => '',
            'width' => '',
            'height' => '',
        ];
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<div class="elementor-control-media">
					<div class="elementor-control-media-upload-button">
						<i class="fa fa-plus-circle"></i>
					</div>
					<div class="elementor-control-media-image-area">
						<div class="elementor-control-media-image" style="background-image: url({{ data.controlValue.url }});"></div>
						<div class="elementor-control-media-delete"><?php echo Translater::get()->l('Delete'); ?></div>
					</div>

				</div>
				<input type="text" id="elementor-control-media-field-{{ data._cid }}" class="elementor-control-media-field" value="{{ data.controlValue.url }}" />
                <input type="hidden" id="elementor-control-media-width-{{ data._cid }}" class="elementor-control-media-width" value="{{ data.controlValue.width }}" />
                <input type="hidden" id="elementor-control-media-height-{{ data._cid }}" class="elementor-control-media-width" value="{{ data.controlValue.height }}" />
			</div>
			<# if ( data.description ) { #>
				<div class="elementor-control-description">{{{ data.description }}}</div>
			<# } #>
			<input type="hidden" data-setting="{{ data.name }}" />
		</div>
		<?php
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'responsive' => true,
        ];
    }

    public static function getImageTitle(array $instance): string
    {
        return 'imagetitle';
    }

    public static function getImageAlt(array $instance): string
    {
        return 'imagealt';
    }
}
