<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Accordion extends Widget_Base
{
    public function get_id()
    {
        return 'accordion';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Accordion', 'elementor');
    }

    public function get_icon()
    {
        return 'accordion';
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_title',
            [
                'label' => \IqitElementorWpHelper::__('Accordion', 'elementor'),
            ]
        );

        $this->add_control(
            'tabs',
            [
                'label' => \IqitElementorWpHelper::__('Accordion Items', 'elementor'),
                'type' => Controls_Manager::REPEATER,
                'default' => [
                    [
                        'tab_title' => \IqitElementorWpHelper::__('Accordion #1', 'elementor'),
                        'tab_content' => \IqitElementorWpHelper::__('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                    [
                        'tab_title' => \IqitElementorWpHelper::__('Accordion #2', 'elementor'),
                        'tab_content' => \IqitElementorWpHelper::__('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => \IqitElementorWpHelper::__('Title & Content', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'default' => \IqitElementorWpHelper::__('Accordion Title', 'elementor'),
                        'label_block' => true,
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                        'type' => Controls_Manager::WYSIWYG,
                        'default' => \IqitElementorWpHelper::__('Accordion Content', 'elementor'),
                        'show_label' => false,
                    ],
                ],
                'title_field' => 'tab_title',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorWpHelper::__('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->end_controls_section();

        $this->add_control(
            'section_options',
            [
                'label' => \IqitElementorWpHelper::__('Options', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );
        $this->add_control(
            'faq',
            [
                'label' => \IqitElementorWpHelper::__('Faq schema', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    'yes' => \IqitElementorWpHelper::__('Yes', 'elementor'),
                    '' => \IqitElementorWpHelper::__('No', 'elementor'),
                ],
                'description' => \IqitElementorWpHelper::__('If enabled it will add FAQ rich snippentt schema data for google', 'elementor'),
                'section' => 'section_options',
            ]
        );

        $this->start_controls_section(
            'section_title_style',
            [
                'label' => \IqitElementorWpHelper::__('Accordion', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'active_first',
            [
                'label' => \IqitElementorWpHelper::__('Active first tab', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 1,
                'options' => [
                    1 => \IqitElementorWpHelper::__('Yes', 'elementor'),
                    0 => \IqitElementorWpHelper::__('No', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'icon_align',
            [
                'label' => \IqitElementorWpHelper::__('Icon Alignment', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => \IqitElementorWpHelper::is_rtl() ? 'right' : 'left',
                'options' => [
                    'left' => \IqitElementorWpHelper::__('Left', 'elementor'),
                    'right' => \IqitElementorWpHelper::__('Right', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'border_width',
            [
                'label' => \IqitElementorWpHelper::__('Border Width', 'elementor'),
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
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-item' => 'border-width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-content' => 'border-width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-wrapper .elementor-accordion-title.active > span' => 'border-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => \IqitElementorWpHelper::__('Border Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-item' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-content' => 'border-top-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-wrapper .elementor-accordion-title.active > span' => 'border-bottom-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorWpHelper::__('Title Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-title' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'title_background',
            [
                'label' => \IqitElementorWpHelper::__('Title Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-title' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'tab_active_color',
            [
                'label' => \IqitElementorWpHelper::__('Active Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-title.active' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'label' => \IqitElementorWpHelper::__('Title Typography', 'elementor'),
                'name' => 'title_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-accordion .elementor-accordion-title',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
            ]
        );

        $this->add_control(
            'content_background_color',
            [
                'label' => \IqitElementorWpHelper::__('Content Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-content' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'content_color',
            [
                'label' => \IqitElementorWpHelper::__('Content Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-accordion .elementor-accordion-content' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
            ]
        );

        $this->end_controls_section();

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'content_typography',
                'label' => \IqitElementorWpHelper::__('Content Typography', 'elementor'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-accordion .elementor-accordion-content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    public function parse_options($optionsSource, $preview = false): array
    {
        return [
            'faq' => $optionsSource['faq'] == 'yes',
            'active_first' => $optionsSource['active_first'] == 'yes',
            'tabs' => $optionsSource['tabs'],
            'icon_align' => $optionsSource['icon_align'],
        ];
    }
}
