<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Spacer extends WidgetBase
{
    public function getId(): string
    {
        return 'spacer';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Spacer');
    }

    public function getIcon(): string
    {
        return 'spacer';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_spacer',
            [
                'label' => Translater::get()->l('Spacer'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addResponsiveControl(
            'space',
            [
                'label' => Translater::get()->l('Space (PX)'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_spacer',
                'default' => [
                    'size' => 50,
                ],
                'range' => [
                    'px' => [
                        'min' => 10,
                        'max' => 600,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-spacer-inner' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_spacer',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        ?>
		<div class="elementor-spacer">
			<div class="elementor-spacer-inner"></div>
		</div>
		<?php
    }

    protected function contentTemplate(): void
    {
        ?>
		<div class="elementor-spacer">
			<div class="elementor-spacer-inner"></div>
		</div>
		<?php
    }
}
