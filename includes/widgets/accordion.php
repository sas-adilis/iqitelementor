<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
}

class Widget_Accordion extends Widget_Base
{
    /*
    |--------------------------------------------------------------------------
    | IDENTIFICATION
    |--------------------------------------------------------------------------
    */

    public function get_id()
    {
        return 'accordion';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Accordion', 'elementor');
    }

    public function get_icon()
    {
        return 'accordion';
    }

    /*
    |--------------------------------------------------------------------------
    | CONTROLS REGISTRATION
    |--------------------------------------------------------------------------
    */

    protected function _register_controls()
    {
        $this->register_content_controls();
        $this->register_options_controls();
        $this->register_style_title_controls();
        $this->register_style_content_controls();
        $this->register_style_border_controls();
    }

    /*
    |--------------------------------------------------------------------------
    | CONTENT SECTION
    |--------------------------------------------------------------------------
    */

    private function register_content_controls()
    {
        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Accordion', 'elementor'),
            ]
        );

        $this->add_control(
            'tabs',
            [
                'label' => \IqitElementorTranslater::get()->l('Accordion Items', 'elementor'),
                'type' => Controls_Manager::REPEATER,
                'default' => [
                    [
                        'tab_title' => \IqitElementorTranslater::get()->l('Accordion #1', 'elementor'),
                        'tab_content' => \IqitElementorTranslater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                    [
                        'tab_title' => \IqitElementorTranslater::get()->l('Accordion #2', 'elementor'),
                        'tab_content' => \IqitElementorTranslater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => \IqitElementorTranslater::get()->l('Title & Content', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'default' => \IqitElementorTranslater::get()->l('Accordion Title', 'elementor'),
                        'label_block' => true,
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                        'type' => Controls_Manager::WYSIWYG,
                        'default' => \IqitElementorTranslater::get()->l('Accordion Content', 'elementor'),
                        'show_label' => false,
                    ],
                ],
                'title_field' => 'tab_title',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->end_controls_section();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS SECTION
    |--------------------------------------------------------------------------
    */

    private function register_options_controls()
    {
        $this->start_controls_section(
            'section_options',
            [
                'label' => \IqitElementorTranslater::get()->l('Options', 'elementor'),
            ]
        );

        $this->add_control(
            'active_first',
            [
                'label' => \IqitElementorTranslater::get()->l('Active first tab', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 1,
                'options' => [
                    1 => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                    0 => \IqitElementorTranslater::get()->l('No', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'faq',
            [
                'label' => \IqitElementorTranslater::get()->l('Faq schema', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                    '' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                ],
                'description' => \IqitElementorTranslater::get()->l('If enabled it will add FAQ rich snippet schema data for google', 'elementor'),
            ]
        );

        $this->add_control(
            'icon_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Alignment', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => \IqitElementorHelper::is_rtl() ? 'right' : 'left',
                'options' => [
                    'left' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                    'right' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
                ],
            ]
        );

        $this->end_controls_section();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - TITLE SECTION
    |--------------------------------------------------------------------------
    */

    private function register_style_title_controls()
    {
        $this->start_controls_section(
            'section_style_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('title_style_tabs');

        // Normal Tab
        $this->start_controls_tab(
            'title_style_normal',
            [
                'label' => \IqitElementorTranslater::get()->l('Normal', 'elementor'),
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button.collapsed' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_control(
            'title_background',
            [
                'label' => \IqitElementorTranslater::get()->l('Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button.collapsed' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        // Active Tab
        $this->start_controls_tab(
            'title_style_active',
            [
                'label' => \IqitElementorTranslater::get()->l('Active', 'elementor'),
            ]
        );

        $this->add_control(
            'title_active_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button:not(.collapsed)' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
            ]
        );

        $this->add_control(
            'title_active_background',
            [
                'label' => \IqitElementorTranslater::get()->l('Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button:not(.collapsed)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .accordion .accordion-button',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
                'separator' => 'before',
            ]
        );

        $this->end_controls_section();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - CONTENT SECTION
    |--------------------------------------------------------------------------
    */

    private function register_style_content_controls()
    {
        $this->start_controls_section(
            'section_style_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'content_background_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-body' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'content_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-body' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'content_typography',
                'label' => \IqitElementorTranslater::get()->l('Content Typography', 'elementor'),
                'selector' => '{{WRAPPER}} .accordion .accordion-body',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );

        $this->end_controls_section();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - BORDER SECTION
    |--------------------------------------------------------------------------
    */

    private function register_style_border_controls()
    {
        $this->start_controls_section(
            'section_style_border',
            [
                'label' => \IqitElementorTranslater::get()->l('Border', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'border_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-item' => 'border-width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .accordion .accordion-button' => 'border-width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .accordion .accordion-body' => 'border-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-item' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .accordion .accordion-button' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .accordion .accordion-body' => 'border-top-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS PARSING
    |--------------------------------------------------------------------------
    */

    public function parse_options($optionsSource, $preview = false): array
    {
        return [
            'faq' => $optionsSource['faq'] == 'yes',
            'active_first' => $optionsSource['active_first'] == 1,
            'tabs' => $optionsSource['tabs'],
            'icon_align' => $optionsSource['icon_align'],
        ];
    }
}