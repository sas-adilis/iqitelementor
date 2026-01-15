<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Divider extends Widget_Base
{
    public function get_id()
    {
        return 'divider';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Divider', 'elementor');
    }

    public function get_icon()
    {
        return 'divider';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_divider',
            [
                'label' => \IqitElementorTranslater::get()->l('Divider', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'style',
            [
                'label' => \IqitElementorTranslater::get()->l('Style', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_divider',
                'options' => [
                    'solid' => \IqitElementorTranslater::get()->l('Solid', 'elementor'),
                    'double' => \IqitElementorTranslater::get()->l('Double', 'elementor'),
                    'dotted' => \IqitElementorTranslater::get()->l('Dotted', 'elementor'),
                    'dashed' => \IqitElementorTranslater::get()->l('Dashed', 'elementor'),
                ],
                'default' => 'solid',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'border-top-style: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'weight',
            [
                'label' => \IqitElementorTranslater::get()->l('Weight', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'section' => 'section_divider',
                'default' => '',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider-separator' => 'border-top-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'width',
            [
                'label' => \IqitElementorTranslater::get()->l('Widtdddh', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_responsive_control(
            'align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'section' => 'section_divider',
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
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-divider' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'gap',
            [
                'label' => \IqitElementorTranslater::get()->l('Gap', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_divider',
            ]
        );
    }

    protected function render($instance = [])
    {
        ?>
        <div class="elementor-divider">
            <span class="elementor-divider-separator"></span>
        </div>
        <?php
    }

    protected function content_template()
    {
        ?>
        <div class="elementor-divider">
            <span class="elementor-divider-separator"></span>
        </div>
        <?php
    }
}
