<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Icon_box extends Widget_Base
{
    public function get_id()
    {
        return 'icon-box';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Icon Box', 'elementor');
    }

    public function get_icon()
    {
        return 'icon-box';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_icon',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Box', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_icon',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'stacked' => \IqitElementorTranslater::get()->l('Stacked', 'elementor'),
                    'framed' => \IqitElementorTranslater::get()->l('Framed', 'elementor'),
                ],
                'default' => 'default',
                'prefix_class' => 'elementor-view-',
            ]
        );

        $this->add_control(
            'icon',
            [
                'label' => \IqitElementorTranslater::get()->l('Choose Icon', 'elementor'),
                'type' => Controls_Manager::ICON,
                'default' => 'fa fa-star',
                'section' => 'section_icon',
            ]
        );

        $this->add_control(
            'shape',
            [
                'label' => \IqitElementorTranslater::get()->l('Shape', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_icon',
                'options' => [
                    'circle' => \IqitElementorTranslater::get()->l('Circle', 'elementor'),
                    'square' => \IqitElementorTranslater::get()->l('Square', 'elementor'),
                ],
                'default' => 'circle',
                'condition' => [
                    'view!' => 'default',
                ],
                'prefix_class' => 'elementor-shape-',
            ]
        );

        $this->add_control(
            'title_text',
            [
                'label' => \IqitElementorTranslater::get()->l('Title & Description', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'default' => \IqitElementorTranslater::get()->l('This is the heading', 'elementor'),
                'placeholder' => \IqitElementorTranslater::get()->l('Your Title', 'elementor'),
                'section' => 'section_icon',
                'label_block' => true,
            ]
        );

        $this->add_control(
            'description_text',
            [
                'label' => '',
                'type' => Controls_Manager::WYSIWYG,
                'default' => '<p>' . \IqitElementorTranslater::get()->l('I am text block. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor') . '</p>',
                'title' => \IqitElementorTranslater::get()->l('Input icon text here', 'elementor'),
                'section' => 'section_icon',
                'separator' => 'none',
                'show_label' => false,
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => \IqitElementorTranslater::get()->l('Link to', 'elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => \IqitElementorTranslater::get()->l('http://your-link.com', 'elementor'),
                'section' => 'section_icon',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'position',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Position', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'default' => 'top',
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'top' => [
                        'title' => \IqitElementorTranslater::get()->l('Top', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'prefix_class' => 'elementor-position-',
                'section' => 'section_icon',
                'toggle' => false,
            ]
        );

        $this->add_control(
            'title_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Title HTML Tag', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'h1' => \IqitElementorTranslater::get()->l('H1', 'elementor'),
                    'h2' => \IqitElementorTranslater::get()->l('H2', 'elementor'),
                    'h3' => \IqitElementorTranslater::get()->l('H3', 'elementor'),
                    'h4' => \IqitElementorTranslater::get()->l('H4', 'elementor'),
                    'h5' => \IqitElementorTranslater::get()->l('H5', 'elementor'),
                    'h6' => \IqitElementorTranslater::get()->l('H6', 'elementor'),
                    'div' => \IqitElementorTranslater::get()->l('div', 'elementor'),
                    'span' => \IqitElementorTranslater::get()->l('span', 'elementor'),
                    'p' => \IqitElementorTranslater::get()->l('p', 'elementor'),
                ],
                'default' => 'h3',
                'section' => 'section_icon',
            ]
        );

        $this->add_control(
            'section_style_icon',
            [
                'type' => Controls_Manager::SECTION,
                'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Primary Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon, {{WRAPPER}}.elementor-view-default .elementor-icon' => 'color: {{VALUE}}; border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'secondary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Secondary Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_icon',
                'default' => '',
                'condition' => [
                    'view!' => 'default',
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'icon_space',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Spacing', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'icon_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Size', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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
                ],
            ]
        );

        $this->add_control(
            'icon_padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Padding', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'rotate',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Rotate', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'border_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Width', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
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

        $this->add_control(
            'border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
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

        $this->add_control(
            'section_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Hover', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'hover_primary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Primary Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover, {{WRAPPER}}.elementor-view-default .elementor-icon:hover' => 'color: {{VALUE}}; border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'hover_secondary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Secondary Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
                'default' => '',
                'condition' => [
                    'view!' => 'default',
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-view-framed .elementor-icon:hover' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}}.elementor-view-stacked .elementor-icon:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'hover_animation',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation', 'elementor'),
                'type' => Controls_Manager::HOVER_ANIMATION,
                'tab' => self::TAB_STYLE,
                'section' => 'section_hover',
            ]
        );

        $this->add_control(
            'section_style_content',
            [
                'type' => Controls_Manager::SECTION,
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'text_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorTranslater::get()->l('Center', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
                        'icon' => 'fa fa-align-right',
                    ],
                    'justify' => [
                        'title' => \IqitElementorTranslater::get()->l('Justified', 'elementor'),
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

        $this->add_control(
            'content_vertical_alignment',
            [
                'label' => \IqitElementorTranslater::get()->l('Vertical Alignment', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'top' => \IqitElementorTranslater::get()->l('Top', 'elementor'),
                    'middle' => \IqitElementorTranslater::get()->l('Middle', 'elementor'),
                    'bottom' => \IqitElementorTranslater::get()->l('Bottom', 'elementor'),
                ],
                'default' => 'top',
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'prefix_class' => 'elementor-vertical-align-',
            ]
        );

        $this->add_control(
            'heading_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            'title_bottom_space',
            [
                'label' => \IqitElementorTranslater::get()->l('Title Spacing', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Title Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
            ]
        );

        $this->add_control(
            'heading_description',
            [
                'label' => \IqitElementorTranslater::get()->l('Description', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Description Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    protected function render($instance = [])
    {
        $this->add_render_attribute('icon', 'class', ['elementor-icon', 'elementor-animation-' . $instance['hover_animation']]);

        $icon_tag = 'span';

        if (!empty($instance['link']['url'])) {
            $this->add_render_attribute('link', 'href', $instance['link']['url']);
            $icon_tag = 'a';

            if (!empty($instance['link']['is_external'])) {
                $this->add_render_attribute('link', 'target', '_blank');
                $this->add_render_attribute('link', 'rel', 'noopener noreferrer');
            }
        }

        $this->add_render_attribute('i', 'class', $instance['icon']);

        $icon_attributes = $this->get_render_attribute_string('icon');
        $link_attributes = $this->get_render_attribute_string('link');
        ?>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <<?php echo implode(' ', [$icon_tag, $icon_attributes, $link_attributes]); ?>>
                <i <?php echo $this->get_render_attribute_string('i'); ?>></i>
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

    protected function content_template()
    {
        ?>
        <# var link = settings.link && settings.link.url ? 'href="' + settings.link.url + '"' : '',
        iconTag = link ? 'a' : 'span'; #>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <{{{ iconTag + ' ' + link }}} class="elementor-icon elementor-animation-{{ settings.hover_animation }}">
                <i class="{{ settings.icon }}"></i>
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
