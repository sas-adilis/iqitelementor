<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Control_Code extends Control_Base
{
    public function get_type()
    {
        return 'code';
    }

    public function content_template()
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper elementor-control-code-wrapper">
				<div class="elementor-code-editor" data-mode="{{ data.language || 'css' }}"></div>
				<textarea class="elementor-code-editor-value" data-setting="{{ data.name }}" style="display:none;"></textarea>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }

    protected function get_default_settings(): array
    {
        return [
            'label_block' => true,
            'language' => 'css',
            'rows' => 10,
        ];
    }
}
