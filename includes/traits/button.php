<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

trait IqitElementorButtonTrait
{
    /**
     * Enregistre les contrôles liés au carousel sur la section donnée
     */
    protected function register_button_controls(string $sectionId = 'section_button_options', array $condition = [], $exclude_controls = []): void
    {

        if (!in_array('button_type', $exclude_controls)) {
            $this->add_control(
                'button_type',
                [
                    'label' => \IqitElementorWpHelper::__('Type', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'default' => 'secondary',
                    'section' => $sectionId,
                    'condition' => $condition,
                    'options' => [
                        'primary' => \IqitElementorWpHelper::__('Primary', 'elementor'),
                        'secondary' => \IqitElementorWpHelper::__('Secondary', 'elementor'),
                        'info' => \IqitElementorWpHelper::__('Info', 'elementor'),
                        'success' => \IqitElementorWpHelper::__('Success', 'elementor'),
                        'warning' => \IqitElementorWpHelper::__('Warning', 'elementor'),
                        'danger' => \IqitElementorWpHelper::__('Danger', 'elementor'),
                        'light' => \IqitElementorWpHelper::__('Light', 'elementor'),
                        'dark' => \IqitElementorWpHelper::__('Dark', 'elementor'),
                    ],
                ]
            );
        }


        if (!in_array('button_outline', $exclude_controls)) {
            $this->add_control(
                'button_outline',
                [
                    'label' => \IqitElementorWpHelper::__('Outline mode', 'elementor'),
                    'type' => Controls_Manager::SWITCHER,
                    'default' => '',
                    'label_on' => \IqitElementorWpHelper::__('Yes', 'elementor'),
                    'label_off' => \IqitElementorWpHelper::__('No', 'elementor'),
                    'force_render' => true,
                    'hide_in_inner' => true,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }


        if (!in_array('button_text', $exclude_controls)) {
            $this->add_control(
                'button_text',
                [
                    'label' => \IqitElementorWpHelper::__('Text', 'elementor'),
                    'type' => Controls_Manager::TEXT,
                    'default' => \IqitElementorWpHelper::__('Click me', 'elementor'),
                    'placeholder' => \IqitElementorWpHelper::__('Click me', 'elementor'),
                    'section' => $sectionId,
                    'condition' => $condition,
                    'save_empty_value' => true,
                ]
            );
        }

        if (!in_array('button_link', $exclude_controls)) {
            $this->add_control(
                'button_link',
                [
                    'label' => \IqitElementorWpHelper::__('Link', 'elementor'),
                    'type' => Controls_Manager::URL,
                    'placeholder' => 'http://your-link.com',
                    'default' => [
                        'url' => '#',
                    ],
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('button_align', $exclude_controls)) {
            $this->add_responsive_control(
                'button_align',
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
                    'force_render' => true,
                    'label_block' => false,
                    'default' => '',
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('button_size', $exclude_controls)) {
            $this->add_control(
                'button_size',
                [
                    'label' => \IqitElementorWpHelper::__('Size', 'elementor'),
                    'type' => Controls_Manager::CHOOSE,
                    'default' => 'default',
                    'options' => [
                        'xs' => ['title' => \IqitElementorWpHelper::__('XS', 'elementor')],
                        'sm' => ['title' => \IqitElementorWpHelper::__('SM', 'elementor')],
                        'default' => ['title' => \IqitElementorWpHelper::__('M', 'elementor')],
                        'lg' => ['title' => \IqitElementorWpHelper::__('L', 'elementor')],
                        'xl' => ['title' => \IqitElementorWpHelper::__('XL', 'elementor')],
                    ],
                    'label_block' => false,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('button_icon', $exclude_controls)) {
            $this->add_control(
                'button_icon',
                [
                    'label' => \IqitElementorWpHelper::__('Icon', 'elementor'),
                    'type' => Controls_Manager::ICON,
                    'label_block' => true,
                    'default' => '',
                    'section' => 'section_button',
                ]
            );
        }

        if (!in_array('button_icon_align', $exclude_controls)) {
            $this->add_control(
                'button_icon_align',
                [
                    'label' => \IqitElementorWpHelper::__('Icon Position', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'default' => 'left',
                    'options' => [
                        'left' => \IqitElementorWpHelper::__('Before', 'elementor'),
                        'right' => \IqitElementorWpHelper::__('After', 'elementor'),
                    ],
                    'condition' => [
                        'icon!' => '',
                    ],
                    'section' => 'section_button',
                ]
            );
        }

        if (!in_array('button_icon_indent', $exclude_controls)) {
            $this->add_control(
                'button_icon_indent',
                [
                    'label' => \IqitElementorWpHelper::__('Icon Spacing', 'elementor'),
                    'type' => Controls_Manager::SLIDER,
                    'range' => [
                        'px' => [
                            'max' => 50,
                        ],
                    ],
                    'condition' => [
                        'button_icon!' => '',
                    ],
                    'selectors' => [
                        '{{WRAPPER}} .elementor-button .elementor-align-icon-right' => 'margin-left: {{SIZE}}{{UNIT}};',
                        '{{WRAPPER}} .elementor-button .elementor-align-icon-left' => 'margin-right: {{SIZE}}{{UNIT}};',
                    ],
                    'section' => 'section_button',
                ]
            );
        }
    }

    protected function register_button_styles(string $sectionId = 'section_button_styles', array $condition = []): void
    {
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'button_typography',
                'label' => \IqitElementorWpHelper::__('Typography', 'elementor'),
                'scheme' => Scheme_Typography::TYPOGRAPHY_4,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selector' => '{{WRAPPER}} .elementor-btn',
            ]
        );


        $this->add_control(
            'button_border_heading',
            [
                'label' => \IqitElementorWpHelper::__('Border', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'button_border',
                'label' => \IqitElementorWpHelper::__('Border', 'elementor'),
                'tab' => self::TAB_STYLE,
                'placeholder' => '1px',
                'default' => '1px',
                'section' => $sectionId,
                'condition' => $condition,
                'selector' => '{{WRAPPER}} .elementor-btn',
            ]
        );

        $this->add_control(
            'button_border_radius',
            [
                'label' => \IqitElementorWpHelper::__('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'button_colors_heading',
            [
                'label' => \IqitElementorWpHelper::__('Colors', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->start_controls_tabs('button_colors_tabs', [
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);
        $this->start_controls_tab('button_colors_normal', [
            'label' => \IqitElementorWpHelper::__('Normal'),
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);

        $this->add_control(
            'button_text_color',
            [
                'label' => \IqitElementorWpHelper::__('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_background_color',
            [
                'label' => \IqitElementorWpHelper::__('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();
        $this->start_controls_tab('button_colors_hover', [
            'label' => \IqitElementorWpHelper::__('Hover'),
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);

        $this->add_control(
            'button_text_color_hover',
            [
                'label' => \IqitElementorWpHelper::__('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_background_color_hover',
            [
                'label' => \IqitElementorWpHelper::__('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'button_border_color_hover',
            [
                'label' => \IqitElementorWpHelper::__('Border Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => array_merge($condition, [
                    'border_border!' => '',
                ]),
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn:hover' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_tab();
        $this->end_controls_tabs();
    }

    protected function build_button_options(array $settings): array
    {
        $button_classes = ['elementor-btn', 'btn'];
        $wrapper_classes = ['elementor-button-wrapper'];

        $button_classes[] = sprintf('btn-%s%s',
            $settings['button_outline'] == 'yes' ? 'outline-' : '',
            $settings['button_type'] ?? 'secondary'
        );

        if ($settings['button_size'] && $settings['button_size'] !== 'default') {
            $button_classes[] = 'btn-' . $settings['button_size'];
        }

        if (!empty($settings['button_animation_hover'])) {
            $button_classes[] = ' elementor-animation-' . $settings['button_animation_hover'];
        }

        if (!empty($settings['button_icon'])) {
            $button_classes[] = ' elementor-align-icon-' . $settings['button_icon_align'];
        }

        $button_tag = 'button';
        if (!empty($settings['button_link']['url']) && $settings['button_link']['url'] !== '#') {
            $button_tag = 'a';
        }

        $align = $settings['button_align'] ?? '';
        if (!empty($align)) {
            $wrapper_classes[] = 'elementor-align-' . $align;
        }

        $align = $settings['button_align_tablet'] ?? '';
        if (!empty($align)) {
            $wrapper_classes[] = 'elementor-tablet-align-' . $align;
        }

        $align = $settings['button_align_mobile'] ?? '';
        if (!empty($align)) {
            $wrapper_classes[] = 'elementor-mobile-align-' . $align;
        }


        return [
            'button_text' => $settings['button_text'],
            'button_icon' => $settings['button_icon'] ?? null,
            'button_tag' => $button_tag,
            'wrapper_classes' => implode(' ', $wrapper_classes),
            'button_classes' => implode(' ', $button_classes),
            'button_link' => [
                'url' => $settings['button_link']['url'] ?? null,
                'is_external' => $settings['button_link']['is_external'] ?? null,
                'nofollow' => $settings['button_link']['nofollow'] ?? null,
            ]
        ];
    }
}
