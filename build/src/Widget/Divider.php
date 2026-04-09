<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Divider extends WidgetBase
{
    public function getId(): string
    {
        return 'divider';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Divider');
    }

    public function getIcon(): string
    {
        return 'divider';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_divider',
            [
                'label' => Translater::get()->l('Divider'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'style',
            [
                'label' => Translater::get()->l('Style'),
                'type' => ControlManager::SELECT,
                'section' => 'section_divider',
                'options' => [
                    'solid' => Translater::get()->l('Solid'),
                    'double' => Translater::get()->l('Double'),
                    'dotted' => Translater::get()->l('Dotted'),
                    'dashed' => Translater::get()->l('Dashed'),
                ],
                'default' => 'solid',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'border-top-style: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'weight',
            [
                'label' => Translater::get()->l('Weight'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_divider',
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 10,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'border-top-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_divider',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'border-top-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'width',
            [
                'label' => Translater::get()->l('Widtdddh'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 100,
                    'unit' => '%',
                ],
                'range' => [
                    'px' => ['min' => 1, 'max' => 900,],
                    '%' => ['min' => 1, 'max' => 100,],
                ],
                'size_units' => ['px', '%'],
                'section' => 'section_divider',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'section' => 'section_divider',
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Center'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'gap',
            [
                'label' => Translater::get()->l('Gap'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 2,
                        'max' => 50,
                    ],
                ],
                'section' => 'section_divider',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider' => 'padding-top: {{SIZE}}{{UNIT}}; padding-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_divider',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        ?>
        <div class="elementor-divider">
            <span class="elementor-divider-separator"></span>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <div class="elementor-divider">
            <span class="elementor-divider-separator"></span>
        </div>
        <?php
    }
}
