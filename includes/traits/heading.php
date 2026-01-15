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
                    'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                    'show_label' => false,
                    'type' => Controls_Manager::TEXTAREA,
                    'placeholder' => \IqitElementorTranslater::get()->l('Enter your title', 'elementor'),
                    'default' => \IqitElementorTranslater::get()->l('This is heading element', 'elementor'),
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_link', $exclude_controls)) {
            $this->add_control(
                'heading_link',
                [
                    'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
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
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_tag', $exclude_controls)) {
            $this->add_control(
                'heading_tag',
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
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_style', $exclude_controls)) {
            $this->add_control(
                'heading_style',
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
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_align', $exclude_controls)) {
            $this->add_responsive_control(
                'heading_align',
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
                    'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
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
