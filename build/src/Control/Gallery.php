<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Gallery extends ControlBase
{
    public function getType(): string
    {
        return 'gallery';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<div class="elementor-control-input-wrapper">
				<# if ( data.description ) { #>
				<div class="elementor-control-description">{{{ data.description }}}</div>
				<# } #>
				<div class="elementor-control-media">
					<div class="elementor-control-gallery-status">
						<span class="elementor-control-gallery-status-title">
							<# if ( data.controlValue.length ) {
								print( elementor.translate( 'gallery_images_selected', [ data.controlValue.length ] ) );
							} else { #>
								<?php echo Translater::get()->l('No Images Selected'); ?>
							<# } #>
						</span>
						<span class="elementor-control-gallery-clear">(<?php echo Translater::get()->l('Clear'); ?>)</span>
					</div>
					<div class="elementor-control-gallery-thumbnails">
						<# _.each( data.controlValue, function( image ) { #>
							<div class="elementor-control-gallery-thumbnail" style="background-image: url({{ image.url }})"></div>
						<# } ); #>
					</div>
					<button class="elementor-btn elementor-control-gallery-add"><?php echo Translater::get()->l('+ Add Images'); ?></button>
				</div>
			</div>
		</div>
		<?php
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'separator' => 'none',
        ];
    }

    public function getDefaultValue(): array
    {
        return [];
    }
}
