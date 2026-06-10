<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class RawHtml extends ControlBase
{
    public function getType(): string
    {
        return 'raw_html';
    }

    public function contentTemplate(): void
    {
        ?>
		<# if ( data.label ) { #>
		<span class="elementor-control-title">{{{ data.label }}}</span>
		<# } #>
		<div class="elementor-control-raw-html {{ data.classes }}">{{{ data.raw }}}</div>
		<?php
    }

    public function getDefaultSettings(): array
    {
        return [
            'classes' => '',
        ];
    }
}
