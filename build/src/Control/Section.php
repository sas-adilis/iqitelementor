<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Section extends ControlBase
{
    public function getType(): string
    {
        return 'section';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-panel-heading">
			<div class="elementor-panel-heading-toggle elementor-section-toggle" data-collapse_id="{{ data.name }}">
				<i class="fa"></i>
			</div>
			<div class="elementor-panel-heading-title elementor-section-title">{{{ data.label }}}</div>
		</div>
		<?php
    }

    protected function getDefaultSettings(): array
    {
        return [
            'separator' => 'none',
        ];
    }
}
