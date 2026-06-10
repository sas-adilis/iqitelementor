<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Heading extends ControlBase
{
    public function getType(): string
    {
        return 'heading';
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
        ];
    }

    public function contentTemplate(): void
    {
        ?>
		<h3 class="elementor-control-title">{{ data.label }}</h3>
		<?php
    }
}
