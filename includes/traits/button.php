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
    protected function registerButtonControls(string $sectionId = 'section_button_options', array $condition = [], $exclude_controls = []): void
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


        if (!in_array('text', $exclude_controls)) {
            $this->add_control(
                'text',
                [
                    'label' => \IqitElementorWpHelper::__('Text', 'elementor'),
                    'type' => Controls_Manager::TEXT,
                    'default' => \IqitElementorWpHelper::__('Click me', 'elementor'),
                    'placeholder' => \IqitElementorWpHelper::__('Click me', 'elementor'),
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('link', $exclude_controls)) {
            $this->add_control(
                'link',
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

        if (!in_array('align', $exclude_controls)) {
            $this->add_responsive_control(
                'align',
                [
                    'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                    'type' => Controls_Manager::CHOOSE,
                    'options' => [
                        'left' => [
                            'title' => \IqitElementorWpHelper::__('Left', 'elementor'),
                            'icon' => 'align-left',
                        ],
                        'center' => [
                            'title' => \IqitElementorWpHelper::__('Center', 'elementor'),
                            'icon' => 'align-center',
                        ],
                        'right' => [
                            'title' => \IqitElementorWpHelper::__('Right', 'elementor'),
                            'icon' => 'align-right',
                        ],
                        'justify' => [
                            'title' => \IqitElementorWpHelper::__('Justified', 'elementor'),
                            'icon' => 'align-justify',
                        ],
                    ],
                    'prefix_class' => 'elementor%s-align-',
                    'force_render' => true,
                    'default' => '',
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('outline', $exclude_controls)) {
            $this->add_control(
                'outline',
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

        if (!in_array('size', $exclude_controls)) {
            $this->add_control(
                'size',
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
    }

    protected function registerButtonStyles(string $sectionId = 'section_button_styles', array $condition = []): void
    {
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'label' => \IqitElementorWpHelper::__('Typography', 'elementor'),
                'scheme' => Scheme_Typography::TYPOGRAPHY_4,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selector' => '{{WRAPPER}} .elementor-btn',
            ]
        );

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
            'background_color',
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
                'name' => 'border',
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
            'border_radius',
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
            'button_hover_heading',
            [
                'label' => \IqitElementorWpHelper::__('Hover', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'hover_color',
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
            'button_background_hover_color',
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
            'button_hover_border_color',
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
    }

    protected function buildButtonOptions(array $settings): array
    {
        return [
            'size' => $settings['size'],
            'button_type' => $settings['button_type'],
            'outline' => $settings['outline'] == 'yes',
            'hover_animation' => $settings['hover_animation'],
            'link' => [
                'url' => $settings['link']['url'],
                'is_external' => $settings['link']['is_external'],
                'nofollow' => $settings['link']['nofollow'],
            ]
        ];
    }
}
