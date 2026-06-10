<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Wysiwyg extends ControlBase
{
    public function getType(): string
    {
        return 'wysiwyg';
    }

    public function contentTemplate(): void
    {
        ?>
		<label>
			<span class="elementor-control-title">{{{ data.label }}}</span>
			<textarea data-setting="{{ data.name }}"></textarea>
		</label>
		<?php
    }
}
