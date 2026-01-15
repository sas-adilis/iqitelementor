<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Control_Font extends Control_Base
{
    public function get_type()
    {
        return 'font';
    }

    protected function get_default_settings()
    {
        return [
            'fonts' => Fonts::get_fonts(),
        ];
    }

    public function content_template()
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<select class="elementor-control-font-family" data-setting="{{ data.name }}">
					<option value=""><?php \IqitElementorTranslater::get()->l('Default', 'elementor'); ?></option>
					<option value="custom"><?php \IqitElementorTranslater::get()->l('Custom', 'elementor'); ?></option>
					<optgroup label="<?php \IqitElementorTranslater::get()->l('System', 'elementor'); ?>">
						<# _.each( getFontsByGroups( 'system' ), function( fontType, fontName ) { #>
						<option value="{{ fontName }}">{{{ fontName }}}</option>
						<# } ); #>
					</optgroup>
					<optgroup label="<?php \IqitElementorTranslater::get()->l('Google', 'elementor'); ?>">
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
