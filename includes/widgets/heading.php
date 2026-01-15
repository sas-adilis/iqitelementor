<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Heading extends Widget_Base
{
    public function get_id()
    {
        return 'heading';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Heading', 'elementor');
    }

    public function get_icon()
    {
        return 't-letter';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::TEXTAREA,
                'placeholder' => \IqitElementorTranslater::get()->l('Enter your title', 'elementor'),
                'default' => \IqitElementorTranslater::get()->l('This is heading element', 'elementor'),
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'http://your-link.com',
                'default' => [
                    'url' => '',
                ],
                'section' => 'section_title',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'size',
            [
                'label' => \IqitElementorTranslater::get()->l('Size', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'small' => \IqitElementorTranslater::get()->l('Small', 'elementor'),
                    'medium' => \IqitElementorTranslater::get()->l('Medium', 'elementor'),
                    'large' => \IqitElementorTranslater::get()->l('Large', 'elementor'),
                    'xl' => \IqitElementorTranslater::get()->l('XL', 'elementor'),
                    'xxl' => \IqitElementorTranslater::get()->l('XXL', 'elementor'),
                ],
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'header_size',
            [
                'label' => \IqitElementorTranslater::get()->l('HTML Tag', 'elementor'),
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
                'default' => 'h2',
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'header_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Inherit from global', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'none' => \IqitElementorTranslater::get()->l('None', 'elementor'),
                    'page-title' => \IqitElementorTranslater::get()->l('Page title', 'elementor'),
                    'section-title' => \IqitElementorTranslater::get()->l('Section title', 'elementor'),
                    'block-title' => \IqitElementorTranslater::get()->l('Block title', 'elementor'),
                ],
                'default' => 'none',
                'section' => 'section_title',
            ]
        );

        $this->add_responsive_control(
            'align',
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
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}' => 'text-align: {{VALUE}};',
                ],
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'section_title_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title, {{WRAPPER}} .elementor-heading-title a' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-heading-title',
            ]
        );
    }

    protected function render($instance = [])
    {
        if (empty($instance['title'])) {
            return;
        }

        $this->add_render_attribute('heading', 'class', 'elementor-heading-title');

        if (!empty($instance['size'])) {
            $this->add_render_attribute('heading', 'class', 'elementor-size-' . $instance['size']);
        }

        if (!empty($instance['header_style'])) {
            $this->add_render_attribute('heading', 'class', $instance['header_style']);
        }

        if (!empty($instance['link']['url'])) {
            $this->add_render_attribute('url', 'href', $instance['link']['url']);
            if ($instance['link']['is_external']) {
                $this->add_render_attribute('url', 'target', '_blank');
                $this->add_render_attribute('url', 'rel', 'noopener noreferrer');
            }
            $url = sprintf('<a %1$s>%2$s</a>', $this->get_render_attribute_string('url'), $instance['title']);

            $title_html = sprintf('<%1$s %2$s>%3$s</%1$s>', $instance['header_size'], $this->get_render_attribute_string('heading'), $url);
        } else {
            $title_html = sprintf('<%1$s %2$s>%3$s</%1$s>', $instance['header_size'], $this->get_render_attribute_string('heading'), '<span>' . $instance['title'] . '</span>');
        }

        echo $title_html;
    }

    protected function content_template()
    {
        ?>
        <#
        if ( '' !== settings.title ) {
        var title_html = '<' + settings.header_size  + ' class="elementor-heading-title elementor-size-' + settings.size + ' ' +  settings.header_style + '"><span>' + settings.title + '</span></' + settings.header_size + '>';
        }

        if ( settings.link && '' !== settings.link.url ) {
        var title_html = '<' + settings.header_size  + ' class="elementor-heading-title elementor-size-' + settings.size + ' ' +  settings.header_style + '"><a href="' + settings.link.url + '"><span>' + title_html + '</span></a></' + settings.header_size + '>';
        }

        print( title_html );
        #>
        <?php
    }
}
