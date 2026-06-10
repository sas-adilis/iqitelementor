<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Code extends ControlBase
{
    public function getType(): string
    {
        return 'code';
    }

    public function contentTemplate(): void
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

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'language' => 'css',
            'rows' => 10,
        ];
    }
}
