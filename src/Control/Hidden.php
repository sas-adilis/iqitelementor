<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Hidden extends ControlBase
{
    public function getType(): string
    {
        return 'hidden';
    }

    public function contentTemplate(): void
    {
        ?>
		<input type="hidden" data-setting="{{{ data.name }}}" />
		<?php
    }
}
