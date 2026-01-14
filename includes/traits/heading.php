<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

trait IqitElementorHeadingTrait
{
    /**
     * Enregistre les contrôles liés au carousel sur la section donnée
     */
    protected function register_heading_controls(string $sectionId = 'section_button_options', array $condition = [], $exclude_controls = []): void
    {

        if (!in_array('heading_text', $exclude_controls)) {
            $this->add_control(
                'heading_text',
                [
                    'label' => \IqitElementorWpHelper::__('Title', 'elementor'),
                    'show_label' => false,
                    'type' => Controls_Manager::TEXTAREA,
                    'placeholder' => \IqitElementorWpHelper::__('Enter your title', 'elementor'),
                    'default' => \IqitElementorWpHelper::__('This is heading element', 'elementor'),
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_link', $exclude_controls)) {
            $this->add_control(
                'heading_link',
                [
                    'label' => \IqitElementorWpHelper::__('Link', 'elementor'),
                    'type' => Controls_Manager::URL,
                    'placeholder' => 'http://your-link.com',
                    'default' => [
                        'url' => '',
                    ],
                    'section' => $sectionId,
                    'condition' => $condition,
                    'separator' => 'before',
                ]
            );
        }

        if (!in_array('heading_size', $exclude_controls)) {
            $this->add_control(
                'heading_size',
                [
                    'label' => \IqitElementorWpHelper::__('Size', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'default' => 'default',
                    'options' => [
                        'default' => \IqitElementorWpHelper::__('Default', 'elementor'),
                        'small' => \IqitElementorWpHelper::__('Small', 'elementor'),
                        'medium' => \IqitElementorWpHelper::__('Medium', 'elementor'),
                        'large' => \IqitElementorWpHelper::__('Large', 'elementor'),
                        'xl' => \IqitElementorWpHelper::__('XL', 'elementor'),
                        'xxl' => \IqitElementorWpHelper::__('XXL', 'elementor'),
                    ],
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_tag', $exclude_controls)) {
            $this->add_control(
                'heading_tag',
                [
                    'label' => \IqitElementorWpHelper::__('HTML Tag', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'options' => [
                        'h1' => \IqitElementorWpHelper::__('H1', 'elementor'),
                        'h2' => \IqitElementorWpHelper::__('H2', 'elementor'),
                        'h3' => \IqitElementorWpHelper::__('H3', 'elementor'),
                        'h4' => \IqitElementorWpHelper::__('H4', 'elementor'),
                        'h5' => \IqitElementorWpHelper::__('H5', 'elementor'),
                        'h6' => \IqitElementorWpHelper::__('H6', 'elementor'),
                        'div' => \IqitElementorWpHelper::__('div', 'elementor'),
                        'span' => \IqitElementorWpHelper::__('span', 'elementor'),
                        'p' => \IqitElementorWpHelper::__('p', 'elementor'),
                    ],
                    'default' => 'h2',
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_style', $exclude_controls)) {
            $this->add_control(
                'heading_style',
                [
                    'label' => \IqitElementorWpHelper::__('Inherit from global', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'options' => [
                        'none' => \IqitElementorWpHelper::__('None', 'elementor'),
                        'page-title' => \IqitElementorWpHelper::__('Page title', 'elementor'),
                        'section-title' => \IqitElementorWpHelper::__('Section title', 'elementor'),
                        'block-title' => \IqitElementorWpHelper::__('Block title', 'elementor'),
                    ],
                    'default' => 'none',
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_align', $exclude_controls)) {
            $this->add_responsive_control(
                'heading_align',
                [
                    'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                    'type' => Controls_Manager::CHOOSE,
                    'options' => [
                        'left' => [
                            'title' => \IqitElementorWpHelper::__('Left', 'elementor'),
                            'icon' => 'fa fa-align-left',
                        ],
                        'center' => [
                            'title' => \IqitElementorWpHelper::__('Center', 'elementor'),
                            'icon' => 'fa fa-align-center',
                        ],
                        'right' => [
                            'title' => \IqitElementorWpHelper::__('Right', 'elementor'),
                            'icon' => 'fa fa-align-right',
                        ],
                        'justify' => [
                            'title' => \IqitElementorWpHelper::__('Justified', 'elementor'),
                            'icon' => 'fa fa-align-justify',
                        ],
                    ],
                    'default' => '',
                    'selectors' => [
                        '{{WRAPPER}} .elementor-heading-title' => 'text-align: {{VALUE}};',
                    ],
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

    }

    protected function register_heading_styles(string $sectionId = 'section_button_styles', array $condition = [], array $exclude_controls = []): void
    {
        if (!in_array('heading_color', $exclude_controls)) {
            $this->add_control(
                'heading_color',
                [
                    'label' => \IqitElementorWpHelper::__('Text Color', 'elementor'),
                    'type' => Controls_Manager::COLOR,
                    'scheme' => [
                        'type' => Scheme_Color::get_type(),
                        'value' => Scheme_Color::COLOR_1,
                    ],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selectors' => [
                        '{{WRAPPER}} .elementor-heading-title, {{WRAPPER}} .elementor-heading-title a' => 'color: {{VALUE}};',
                    ],
                ]
            );
        }

        if (!in_array('heading_typography', $exclude_controls)) {
            $this->add_group_control(
                Group_Control_Typography::get_type(),
                [
                    'name' => 'heading_typography',
                    'scheme' => Scheme_Typography::TYPOGRAPHY_1,
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selector' => '{{WRAPPER}} .elementor-heading-title',
                ]
            );
        }

        if (!in_array('heading_text_shadow', $exclude_controls)) {
            $this->add_group_control(
                Group_Control_Text_Shadow::get_type(),
                [
                    'name' => 'heading_text_shadow',
                    'selector' => '{{WRAPPER}} .elementor-heading-title',
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }
    }

    protected function build_heading_options(array $settings): array
    {
        $heading_classes = ['elementor-heading-title'];

        if (!empty($settings['heading_size'])) {
            $heading_classes[] = 'elementor-size-' . $settings['heading_size'];
        }

        if (!empty($settings['heading_style'])) {
            $heading_classes[] = $settings['heading_style'];
        }

        return [
            'text' => $settings['heading_text'],
            'tag' => $settings['heading_tag'],
            'classes' => implode(' ', $heading_classes),
            'link' => [
                'url' => $settings['link']['url'] ?? null,
                'is_external' => $settings['link']['is_external'] ?? null,
                'nofollow' => $settings['link']['nofollow'] ?? null,
            ]
        ];
    }
}
