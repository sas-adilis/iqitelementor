<?php

namespace IqitElementor\Traits;

use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Control\Group\Border;
if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

trait ButtonTrait
{
    /**
     * Enregistre les contrôles liés au carousel sur la section donnée
     */
    protected function registerButtonControls(string $sectionId = 'section_button_options', array $condition = [], array $exclude_controls = []): void
    {

        if (!in_array('button_type', $exclude_controls)) {
            $this->addControl(
                'button_type',
                [
                    'label' => Translater::get()->l('Type'),
                    'type' => ControlManager::SELECT,
                    'default' => 'secondary',
                    'section' => $sectionId,
                    'condition' => $condition,
                    'options' => [
                        'primary' => Translater::get()->l('Primary'),
                        'secondary' => Translater::get()->l('Secondary'),
                        'info' => Translater::get()->l('Info'),
                        'success' => Translater::get()->l('Success'),
                        'warning' => Translater::get()->l('Warning'),
                        'danger' => Translater::get()->l('Danger'),
                        'light' => Translater::get()->l('Light'),
                        'dark' => Translater::get()->l('Dark'),
                        'link' => Translater::get()->l('Link'),
                    ],
                ]
            );
        }


        if (!in_array('button_outline', $exclude_controls)) {
            $this->addControl(
                'button_outline',
                [
                    'label' => Translater::get()->l('Outline mode'),
                    'type' => ControlManager::SWITCHER,
                    'default' => '',
                    'label_on' => Translater::get()->l('Yes'),
                    'label_off' => Translater::get()->l('No'),
                    'force_render' => true,
                    'hide_in_inner' => true,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }


        if (!in_array('button_text', $exclude_controls)) {
            $this->addControl(
                'button_text',
                [
                    'label' => Translater::get()->l('Text'),
                    'type' => ControlManager::TEXT,
                    'default' => Translater::get()->l('Click me'),
                    'placeholder' => Translater::get()->l('Click me'),
                    'section' => $sectionId,
                    'condition' => $condition,
                    'save_empty_value' => true,
                ]
            );
        }

        if (!in_array('button_link', $exclude_controls)) {
            $this->addControl(
                'button_link',
                [
                    'label' => Translater::get()->l('Link'),
                    'type' => ControlManager::URL,
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
            $this->addResponsiveControl(
                'button_align',
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
                    'force_render' => true,
                    'label_block' => false,
                    'default' => '',
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('button_size', $exclude_controls)) {
            $this->addControl(
                'button_size',
                [
                    'label' => Translater::get()->l('Size'),
                    'type' => ControlManager::CHOOSE,
                    'default' => 'default',
                    'options' => [
                        'xs' => ['title' => Translater::get()->l('XS')],
                        'sm' => ['title' => Translater::get()->l('SM')],
                        'default' => ['title' => Translater::get()->l('M')],
                        'lg' => ['title' => Translater::get()->l('L')],
                        'xl' => ['title' => Translater::get()->l('XL')],
                    ],
                    'label_block' => false,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('button_icon', $exclude_controls)) {
            $this->addControl(
                'button_icon',
                [
                    'label' => Translater::get()->l('Icon'),
                    'type' => ControlManager::ICON,
                    'label_block' => true,
                    'default' => '',
                    'section' => 'section_button',
                ]
            );
        }

        if (!in_array('button_icon_align', $exclude_controls)) {
            $this->addControl(
                'button_icon_align',
                [
                    'label' => Translater::get()->l('Icon Position'),
                    'type' => ControlManager::SELECT,
                    'default' => 'left',
                    'options' => [
                        'left' => Translater::get()->l('Before'),
                        'right' => Translater::get()->l('After'),
                    ],
                    'condition' => [
                        'icon!' => '',
                    ],
                    'section' => 'section_button',
                ]
            );
        }

        if (!in_array('button_icon_size', $exclude_controls)) {
            $this->addResponsiveControl(
                'button_icon_size',
                [
                    'label' => Translater::get()->l('Icon Size'),
                    'type' => ControlManager::SLIDER,
                    'default' => ['size' => 24, 'unit' => 'px'],
                    'range' => [
                        'px' => [
                            'min' => 8,
                            'max' => 100,
                        ],
                    ],
                    'condition' => [
                        'button_icon!' => '',
                    ],
                    'selectors' => [
                        '{{WRAPPER}} .elementor-btn-icon' => 'font-size: {{SIZE}}{{UNIT}};',
                        '{{WRAPPER}} .elementor-btn-icon svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                    ],
                    'section' => 'section_button',
                ]
            );
        }

        if (!in_array('button_icon_indent', $exclude_controls)) {
            $this->addControl(
                'button_icon_indent',
                [
                    'label' => Translater::get()->l('Icon Spacing'),
                    'type' => ControlManager::SLIDER,
                    'range' => [
                        'px' => [
                            'max' => 50,
                        ],
                    ],
                    'condition' => [
                        'button_icon!' => '',
                    ],
                    'selectors' => [
                        '{{WRAPPER}} .elementor-btn .elementor-align-icon-right' => 'margin-left: {{SIZE}}{{UNIT}};',
                        '{{WRAPPER}} .elementor-btn .elementor-align-icon-left' => 'margin-right: {{SIZE}}{{UNIT}};',
                    ],
                    'section' => 'section_button',
                ]
            );
        }
    }

    protected function registerButtonStyles(string $sectionId = 'section_button_styles', array $condition = []): void
    {
        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'button_typography',
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selector' => '{{WRAPPER}} .elementor-btn-text',
            ]
        );


        $this->addControl(
            'button_border_heading',
            [
                'label' => Translater::get()->l('Border'),
                'type' => ControlManager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'button_border',
                'label' => Translater::get()->l('Border'),
                'tab' => self::TAB_STYLE,
                'placeholder' => '1px',
                'default' => '1px',
                'section' => $sectionId,
                'condition' => $condition,
                'selector' => '{{WRAPPER}} .elementor-btn',
            ]
        );

        $this->addControl(
            'button_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'button_colors_heading',
            [
                'label' => Translater::get()->l('Colors'),
                'type' => ControlManager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->startControlsTabs('button_colors_tabs', [
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);
        $this->startControlsTab('button_colors_normal', [
            'label' => Translater::get()->l('Normal'),
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);

        $this->addControl(
            'button_text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'button_background_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->endControlsTab();
        $this->startControlsTab('button_colors_hover', [
            'label' => Translater::get()->l('Hover'),
            'tab' => self::TAB_STYLE,
            'section' => $sectionId,
            'condition' => $condition,
        ]);

        $this->addControl(
            'button_text_color_hover',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'button_background_color_hover',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-btn:hover' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'button_border_color_hover',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
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

        $this->endControlsTab();
        $this->endControlsTabs();
    }

    protected function buildButtonOptions(array $settings): array
    {
        $button_classes = ['elementor-btn', 'btn'];
        $wrapper_classes = ['elementor-btn-wrapper'];

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


        $buttonIconHtml = '';
        if (!empty($settings['button_icon'])) {
            $buttonIconHtml = IconHelper::renderIcon($settings['button_icon']);
        }

        return [
            'button_text' => $settings['button_text'],
            'button_icon' => $settings['button_icon'] ?? null,
            'button_icon_html' => $buttonIconHtml,
            'button_icon_align' => $settings['button_icon_align'] ?? 'left',
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
