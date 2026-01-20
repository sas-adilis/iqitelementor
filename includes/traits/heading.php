<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

trait IqitElementorHeadingTrait
{
    /**
     * Section Content - Texte et configuration du titre
     *
     * @param string $sectionId ID de la section
     * @param array $condition Conditions d'affichage
     * @param array $exclude_controls Contrôles à exclure ('heading_text', 'heading_tag', 'heading_link')
     */
    protected function register_heading_controls(string $sectionId = 'section_heading_content', array $condition = [], array $exclude_controls = []): void
    {
        if (!in_array('heading_text', $exclude_controls)) {
            $this->add_control(
                'heading_text',
                [
                    'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                    'type' => Controls_Manager::TEXTAREA,
                    'placeholder' => \IqitElementorTranslater::get()->l('Enter your title', 'elementor'),
                    'default' => \IqitElementorTranslater::get()->l('This is heading element', 'elementor'),
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
                    'description' => \IqitElementorTranslater::get()->l('Choose the HTML tag for SEO. Use H1 for main title, H2-H6 for subtitles.', 'elementor'),
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
                    'placeholder' => \IqitElementorTranslater::get()->l('https://your-link.com', 'elementor'),
                    'default' => [
                        'url' => '',
                    ],
                    'description' => \IqitElementorTranslater::get()->l('Leave empty if title should not be clickable.', 'elementor'),
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
    protected function register_heading_styles(string $sectionId = 'section_heading_style', array $condition = [], array $exclude_controls = []): void
    {
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
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
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
                    'tab' => self::TAB_STYLE,
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
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        // --- Groupe : Typography ---
        $this->add_control(
            'heading_typography_label',
            [
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

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

        if (!in_array('heading_color', $exclude_controls)) {
            $this->add_control(
                'heading_color',
                [
                    'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
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

    /**
     * Construit les options de rendu du heading
     *
     * @param array $settings Paramètres du widget
     * @return array Options formatées pour le rendu
     */
    protected function build_heading_options(array $settings): array
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
            'link' => [
                'url' => $settings['heading_link']['url'] ?? null,
                'is_external' => $settings['heading_link']['is_external'] ?? null,
                'nofollow' => $settings['heading_link']['nofollow'] ?? null,
            ]
        ];
    }
}
