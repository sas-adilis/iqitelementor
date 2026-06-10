<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Core\Fonts;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Font extends ControlBase
{
    public function getType(): string
    {
        return 'font';
    }

    protected function getDefaultSettings(): array
    {
        return [
            'fonts' => Fonts::getFonts(),
        ];
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<select class="elementor-control-font-family" data-setting="{{ data.name }}">
					<option value=""><?php echo Translater::get()->l('Default'); ?></option>
					<option value="custom"><?php echo Translater::get()->l('Custom'); ?></option>
					<optgroup label="<?php echo Translater::get()->l('System'); ?>">
						<# _.each( getFontsByGroups( 'system' ), function( fontType, fontName ) { #>
						<option value="{{ fontName }}">{{{ fontName }}}</option>
						<# } ); #>
					</optgroup>
					<optgroup label="<?php echo Translater::get()->l('Google'); ?>">
						<# _.each( getFontsByGroups( [ 'googlefonts', 'earlyaccess' ] ), function( fontType, fontName ) { #>
						<option value="{{ fontName }}">{{{ fontName }}}</option>
						<# } ); #>
					</optgroup>
				</select>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
