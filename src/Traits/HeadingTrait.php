<?php

namespace IqitElementor\Traits;

use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Control\Group\TextShadow;
if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

trait HeadingTrait
{
    /**
     * Section Content - Texte et configuration du titre
     *
     * @param string $sectionId ID de la section
     * @param array $condition Conditions d'affichage
     * @param array $exclude_controls Contrôles à exclure ('heading_text', 'heading_tag', 'heading_link')
     */
    protected function registerHeadingControls(string $sectionId = 'section_heading_content', array $condition = [], array $exclude_controls = []): void
    {
        if (!in_array('heading_text', $exclude_controls)) {
            $this->addControl(
                'heading_text',
                [
                    'label' => Translater::get()->l('Title'),
                    'type' => ControlManager::TEXTAREA,
                    'placeholder' => Translater::get()->l('Enter your title'),
                    'default' => Translater::get()->l('This is heading element'),
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_tag', $exclude_controls)) {
            $this->addControl(
                'heading_tag',
                [
                    'label' => Translater::get()->l('HTML Tag'),
                    'type' => ControlManager::SELECT,
                    'options' => [
                        'h1' => 'H1',
                        'h2' => 'H2',
                        'h3' => 'H3',
                        'h4' => 'H4',
                        'h5' => 'H5',
                        'h6' => 'H6',
                        'div' => 'div',
                        'span' => 'span',
                        'p' => 'p',
                    ],
                    'default' => 'h2',
                    'description' => Translater::get()->l('Choose the HTML tag for SEO. Use H1 for main title, H2-H6 for subtitles.'),
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_link', $exclude_controls)) {
            $this->addControl(
                'heading_link',
                [
                    'label' => Translater::get()->l('Link'),
                    'type' => ControlManager::URL,
                    'placeholder' => Translater::get()->l('https://your-link.com'),
                    'default' => [
                        'url' => '',
                    ],
                    'description' => Translater::get()->l('Leave empty if title should not be clickable.'),
                    'section' => $sectionId,
                    'condition' => $condition,
                    'separator' => 'before',
                ]
            );
        }
    }

    /**
     * Section Style - Personnalisation visuelle
     *
     * @param string $sectionId ID de la section
     * @param array $condition Conditions d'affichage
     * @param array $exclude_controls Contrôles à exclure ('heading_style', 'heading_size', 'heading_align', 'heading_typography', 'heading_color', 'heading_text_shadow')
     */
    protected function registerHeadingStyles(string $sectionId = 'section_heading_style', array $condition = [], array $exclude_controls = []): void
    {
        if (!in_array('heading_style', $exclude_controls)) {
            $this->addControl(
                'heading_style',
                [
                    'label' => Translater::get()->l('Inherit from global'),
                    'type' => ControlManager::SELECT,
                    'options' => [
                        'none' => Translater::get()->l('None'),
                        'page-title' => Translater::get()->l('Page title'),
                        'section-title' => Translater::get()->l('Section title'),
                        'block-title' => Translater::get()->l('Block title'),
                    ],
                    'default' => 'none',
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_size', $exclude_controls)) {
            $this->addControl(
                'heading_size',
                [
                    'label' => Translater::get()->l('Size'),
                    'type' => ControlManager::SELECT,
                    'default' => 'default',
                    'options' => [
                        'default' => Translater::get()->l('Default'),
                        'small' => Translater::get()->l('Small'),
                        'medium' => Translater::get()->l('Medium'),
                        'large' => Translater::get()->l('Large'),
                        'xl' => Translater::get()->l('XL'),
                        'xxl' => Translater::get()->l('XXL'),
                    ],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('heading_align', $exclude_controls)) {
            $this->addResponsiveControl(
                'heading_align',
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
                    'default' => '',
                    'selectors' => [
                        '{{WRAPPER}} .elementor-heading-title' => 'text-align: {{VALUE}};',
                    ],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        // --- Groupe : Typography ---
        $this->addControl(
            'heading_typography_label',
            [
                'label' => Translater::get()->l('Typography'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        if (!in_array('heading_typography', $exclude_controls)) {
            $this->addGroupControl(
                GroupTypography::getType(),
                [
                    'name' => 'heading_typography',
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selector' => '{{WRAPPER}} .elementor-heading-title',
                ]
            );
        }

        if (!in_array('heading_color', $exclude_controls)) {
            $this->addControl(
                'heading_color',
                [
                    'label' => Translater::get()->l('Color'),
                    'type' => ControlManager::COLOR,
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selectors' => [
                        '{{WRAPPER}} .elementor-heading-title, {{WRAPPER}} .elementor-heading-title a' => 'color: {{VALUE}};',
                    ],
                ]
            );
        }

        if (!in_array('heading_text_shadow', $exclude_controls)) {
            $this->addGroupControl(
                TextShadow::getType(),
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

    /**
     * Construit les options de rendu du heading
     *
     * @param array $settings Paramètres du widget
     * @return array Options formatées pour le rendu
     */
    protected function buildHeadingOptions(array $settings): array
    {
        $heading_classes = ['elementor-heading-title'];

        if (!empty($settings['heading_size'])) {
            $heading_classes[] = 'elementor-size-' . $settings['heading_size'];
        }

        if (!empty($settings['heading_style']) && $settings['heading_style'] !== 'none') {
            $heading_classes[] = $settings['heading_style'];
        }

        return [
            'text' => $settings['heading_text'] ?? '',
            'tag' => $settings['heading_tag'] ?? 'h2',
            'classes' => implode(' ', $heading_classes),
            'link' => $settings['heading_link'] ?? [],
        ];
    }
}
