<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Icon extends WidgetBase
{
    public function getId(): string
    {
        return 'icon';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Icon');
    }

    public function getIcon(): string
    {
        return 'favorite';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_icon',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::SELECT,
                'section' => 'section_icon',
                'options' => [
                    'default' => Translater::get()->l('Default'),
                    'stacked' => Translater::get()->l('Stacked'),
                    'framed' => Translater::get()->l('Framed'),
                ],
                'default' => 'default',
                'prefix_class' => 'elementor-view-',
            ]
        );

        $this->addControl(
            'icon',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => 'fa fa-star',
                'section' => 'section_icon',
            ]
        );

        $this->addControl(
            'shape',
            [
                'label' => Translater::get()->l('Shape'),
                'type' => ControlManager::SELECT,
                'section' => 'section_icon',
                'options' => [
                    'circle' => Translater::get()->l('Circle'),
                    'square' => Translater::get()->l('Square'),
                ],
                'default' => 'circle',
                'condition' => [
                    'view!' => 'default',
                ],
                'prefix_class' => 'elementor-shape-',
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link'),
                'type' => ControlManager::URL,
                'placeholder' => 'http://your-link.com',
                'section' => 'section_icon',
            ]
        );

        $this->addResponsiveControl(
            'align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'section' => 'section_icon',
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
                'default' => 'center',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-wrapper' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'section_style_icon',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'primary_color',
            [
                'label' => Translater::get()->l('Primary Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon, {{WRAPPER}}.elementor-view-default .elementor-icon' => 'color: {{VALUE}}; border-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon svg, {{WRAPPER}}.elementor-view-default .elementor-icon svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'secondary_color',
            [
                'label' => Translater::get()->l('Secondary Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'default' => '',
                'condition' => [
                    'view!' => 'default',
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon' => 'color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'size',
            [
                'label' => Translater::get()->l('Icon Size'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-icon svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'icon_padding',
            [
                'label' => Translater::get()->l('Icon Padding'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'padding: {{SIZE}}{{UNIT}};',
                ],
                'default' => [
                    'size' => 1.5,
                    'unit' => 'em',
                ],
                'range' => [
                    'em' => [
                        'min' => 0,
                    ],
                ],
                'condition' => [
                    'view!' => 'default',
                ],
            ]
        );

        $this->addControl(
            'rotate',
            [
                'label' => Translater::get()->l('Icon Rotate'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 0,
                    'unit' => 'deg',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon i' => 'transform: rotate({{SIZE}}{{UNIT}});',
                ],
            ]
        );

        $this->addControl(
            'border_width',
            [
                'label' => Translater::get()->l('Border Width'),
                'type' => ControlManager::DIMENSIONS,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'view' => 'framed',
                ],
            ]
        );

        $this->addControl(
            'border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'view!' => 'default',
                ],
            ]
        );

        $this->addControl(
            'section_hover',
            [
                'label' => Translater::get()->l('Icon Hover'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'hover_primary_color',
            [
                'label' => Translater::get()->l('Primary Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover, {{WRAPPER}}.elementor-view-default .elementor-icon:hover' => 'color: {{VALUE}}; border-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover svg, {{WRAPPER}}.elementor-view-default .elementor-icon:hover svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'hover_secondary_color',
            [
                'label' => Translater::get()->l('Secondary Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
                'default' => '',
                'condition' => [
                    'view!' => 'default',
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover' => 'color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'hover_animation',
            [
                'label' => Translater::get()->l('Animation'),
                'type' => ControlManager::HOVER_ANIMATION,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $this->addRenderAttribute('wrapper', 'class', 'elementor-icon-wrapper');

        $this->addRenderAttribute('icon-wrapper', 'class', 'elementor-icon');

        if (!empty($instance['hover_animation'])) {
            $this->addRenderAttribute('icon-wrapper', 'class', 'elementor-animation-' . $instance['hover_animation']);
        }

        $icon_tag = 'div';

        if (!empty($instance['link']['url'])) {
            $this->addRenderAttribute('icon-wrapper', 'href', $instance['link']['url']);
            $icon_tag = 'a';

            if (!empty($instance['link']['is_external'])) {
                $this->addRenderAttribute('icon-wrapper', 'target', '_blank');
                $this->addRenderAttribute('icon-wrapper', 'rel', 'noopener noreferrer');
            }
        }

        ?>
    <div <?php echo $this->getRenderAttributeString('wrapper'); ?>>
        <<?php echo $icon_tag . ' ' . $this->getRenderAttributeString('icon-wrapper'); ?>>
        <?php echo IconHelper::renderIcon($instance['icon']); ?>
        </<?php echo $icon_tag; ?>>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <# var link = settings.link.url ? 'href="' + settings.link.url + '"' : '',
        iconTag = link ? 'a' : 'div'; #>
        <div class="elementor-icon-wrapper">
            <{{{ iconTag }}} class="elementor-icon elementor-animation-{{ settings.hover_animation }}" {{{ link }}}>
            {{{ elementorRenderIcon(settings.icon) }}}
        </{{{ iconTag }}}>
        </div>
        <?php
    }
}
