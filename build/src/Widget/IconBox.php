<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class IconBox extends WidgetBase
{
    public function getId(): string
    {
        return 'icon-box';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Icon Box');
    }

    public function getIcon(): string
    {
        return 'icon-box';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_icon',
            [
                'label' => Translater::get()->l('Icon Box'),
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
                'label' => Translater::get()->l('Choose Icon'),
                'type' => ControlManager::ICON,
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
            'title_text',
            [
                'label' => Translater::get()->l('Title & Description'),
                'type' => ControlManager::TEXT,
                'default' => Translater::get()->l('This is the heading'),
                'placeholder' => Translater::get()->l('Your Title'),
                'section' => 'section_icon',
                'label_block' => true,
            ]
        );

        $this->addControl(
            'description_text',
            [
                'label' => '',
                'type' => ControlManager::WYSIWYG,
                'default' => '<p>' . Translater::get()->l('I am text block. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.') . '</p>',
                'title' => Translater::get()->l('Input icon text here'),
                'section' => 'section_icon',
                'separator' => 'none',
                'show_label' => false,
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link to'),
                'type' => ControlManager::URL,
                'placeholder' => Translater::get()->l('http://your-link.com'),
                'section' => 'section_icon',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'position',
            [
                'label' => Translater::get()->l('Icon Position'),
                'type' => ControlManager::CHOOSE,
                'default' => 'top',
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'top' => [
                        'title' => Translater::get()->l('Top'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'prefix_class' => 'elementor-position-',
                'section' => 'section_icon',
                'toggle' => false,
            ]
        );

        $this->addControl(
            'title_size',
            [
                'label' => Translater::get()->l('Title HTML Tag'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'h1' => Translater::get()->l('H1'),
                    'h2' => Translater::get()->l('H2'),
                    'h3' => Translater::get()->l('H3'),
                    'h4' => Translater::get()->l('H4'),
                    'h5' => Translater::get()->l('H5'),
                    'h6' => Translater::get()->l('H6'),
                    'div' => Translater::get()->l('div'),
                    'span' => Translater::get()->l('span'),
                    'p' => Translater::get()->l('p'),
                ],
                'default' => 'h3',
                'section' => 'section_icon',
            ]
        );

        $this->addControl(
            'section_style_icon',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Icon'),
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
            'icon_space',
            [
                'label' => Translater::get()->l('Icon Spacing'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_icon',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}}.elementor-position-right .elementor-icon-box-icon' => 'margin-left: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-left .elementor-icon-box-icon' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-top .elementor-icon-box-icon' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'icon_size',
            [
                'label' => Translater::get()->l('Icon Size'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'section' => 'section_style_icon',
                'tab' => self::TAB_STYLE,
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

        $this->addControl(
            'section_style_content',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'text_align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
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
                    'justify' => [
                        'title' => Translater::get()->l('Justified'),
                        'icon' => 'fa fa-align-justify',
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-wrapper' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'content_vertical_alignment',
            [
                'label' => Translater::get()->l('Vertical Alignment'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'top' => Translater::get()->l('Top'),
                    'middle' => Translater::get()->l('Middle'),
                    'bottom' => Translater::get()->l('Bottom'),
                ],
                'default' => 'top',
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'prefix_class' => 'elementor-vertical-align-',
            ]
        );

        $this->addControl(
            'heading_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            'title_bottom_space',
            [
                'label' => Translater::get()->l('Title Spacing'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Title Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->addControl(
            'heading_description',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'description_color',
            [
                'label' => Translater::get()->l('Description Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $this->addRenderAttribute('icon', 'class', ['elementor-icon', 'elementor-animation-' . $instance['hover_animation']]);

        $icon_tag = 'span';

        if (!empty($instance['link']['url'])) {
            $this->addRenderAttribute('link', 'href', $instance['link']['url']);
            $icon_tag = 'a';

            if (!empty($instance['link']['is_external'])) {
                $this->addRenderAttribute('link', 'target', '_blank');
                $this->addRenderAttribute('link', 'rel', 'noopener noreferrer');
            }
        }

        $icon_attributes = $this->getRenderAttributeString('icon');
        $link_attributes = $this->getRenderAttributeString('link');
        ?>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <<?php echo implode(' ', [$icon_tag, $icon_attributes, $link_attributes]); ?>>
                <?php echo IconHelper::renderIcon($instance['icon']); ?>
            </<?php echo $icon_tag; ?>>
        </div>
        <div class="elementor-icon-box-content">
        <<?php echo $instance['title_size']; ?> class="elementor-icon-box-title">
        <<?php echo implode(' ', [$icon_tag, $link_attributes]); ?>><?php echo $instance['title_text']; ?></<?php echo $icon_tag; ?>>
        </<?php echo $instance['title_size']; ?>>
        <div class="elementor-icon-box-description"><?php echo $instance['description_text']; ?></div>
        </div>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <# var link = settings.link && settings.link.url ? 'href="' + settings.link.url + '"' : '',
        iconTag = link ? 'a' : 'span'; #>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <{{{ iconTag + ' ' + link }}} class="elementor-icon elementor-animation-{{ settings.hover_animation }}">
                {{{ elementorRenderIcon(settings.icon) }}}
            </
            {{{ iconTag }}}>
        </div>
        <div class="elementor-icon-box-content">
            <{{{ settings.title_size }}} class="elementor-icon-box-title">
            <{{{ iconTag + ' ' + link }}}>{{{ settings.title_text }}}
        </{{{ iconTag }}}>
        </{{{ settings.title_size }}}>
        <div class="elementor-icon-box-description">{{{ settings.description_text }}}</div>
        </div>
        </div>
        <?php
    }
}
