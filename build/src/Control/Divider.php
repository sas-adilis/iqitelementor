<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Divider extends ControlBase
{
    public function getType(): string
    {
        return 'divider';
    }

    public function contentTemplate(): void
    {
        ?>
		<hr />
		<?php
    }
}
