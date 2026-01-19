<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

trait IqitElementorCarouselTrait
{
    /**
     * Retourne les valeurs par défaut du carousel
     *
     * @return array
     */
    protected static function getCarouselDefaults(): array
    {
        return [
            'slides_to_show' => 4,
            'slides_to_show_tablet' => 3,
            'slides_to_show_mobile' => 2,
            'slides_per_page' => 1,
            'space_between' => 20,
            'centered_slides' => '',
            'arrows' => 'yes',
            'dots' => '',
            'autoplay' => 'yes',
            'autoplay_speed' => 5000,
            'pause_on_hover' => 'yes',
            'loop' => '',
            'direction' => 'left',
            'animation_speed' => 300,
            'arrows_position' => 'sides',
            'dots_position' => 'below',
        ];
    }

    /**
     * Enregistre les contrôles liés au carousel sur la section donnée
     *
     * @param string $sectionId ID de la section
     * @param array $condition Conditions d'affichage
     * @param array $default_params Valeurs par défaut personnalisées (fusionnées avec getCarouselDefaults())
     */
    protected function register_carousel_controls(string $sectionId = 'section_pswidget_options', array $condition = [], array $default_params = []): void
    {
        $defaults = array_merge(self::getCarouselDefaults(), $default_params);
        $slides_options = array_combine(range(1, 12), range(1, 12));

        // ===== GROUPE : AFFICHAGE DES SLIDES =====
        $this->add_control(
            'slides_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Slides'),
                'type' => Controls_Manager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'slides_to_show',
            [
                'label' => \IqitElementorTranslater::get()->l('Visible slides'),
                'description' => \IqitElementorTranslater::get()->l('Number of slides visible at the same time. Use decimal values (e.g. 2.5) for peek effect.'),
                'type' => Controls_Manager::NUMBER,
                'default' => $defaults['slides_to_show'],
                'min' => 1,
                'max' => 12,
                'step' => 0.1,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'slides_per_page',
            [
                'label' => \IqitElementorTranslater::get()->l('Slides to scroll'),
                'description' => \IqitElementorTranslater::get()->l('Number of slides to move on each navigation action.'),
                'type' => Controls_Manager::SELECT,
                'default' => $defaults['slides_per_page'],
                'section' => $sectionId,
                'options' => $slides_options,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'space_between',
            [
                'label' => \IqitElementorTranslater::get()->l('Space between'),
                'description' => \IqitElementorTranslater::get()->l('Gap between slides in pixels.'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                        'step' => 1,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => $defaults['space_between'],
                ],
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'centered_slides',
            [
                'label' => \IqitElementorTranslater::get()->l('Centered slides'),
                'description' => \IqitElementorTranslater::get()->l('Active slide will be centered, useful for peek effect.'),
                'type' => Controls_Manager::SWITCHER,
                'default' => $defaults['centered_slides'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        // ===== GROUPE : NAVIGATION =====
        $this->add_control(
            'navigation_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Navigation'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'arrows',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows'),
                'description' => \IqitElementorTranslater::get()->l('Previous/Next navigation arrows.'),
                'type' => Controls_Manager::SWITCHER,
                'default' => $defaults['arrows'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'dots',
            [
                'label' => \IqitElementorTranslater::get()->l('Pagination dots'),
                'description' => \IqitElementorTranslater::get()->l('Bullet indicators at the bottom.'),
                'type' => Controls_Manager::SWITCHER,
                'default' => $defaults['dots'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        // ===== GROUPE : LECTURE AUTOMATIQUE =====
        $this->add_control(
            'additional_options_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Autoplay'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'autoplay',
            [
                'label' => \IqitElementorTranslater::get()->l('Enable autoplay'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'return_value' => 'yes',
                'section' => $sectionId,
                'default' => $defaults['autoplay'],
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'autoplay_speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Interval'),
                'description' => \IqitElementorTranslater::get()->l('Time between slides in milliseconds.'),
                'type' => Controls_Manager::NUMBER,
                'default' => $defaults['autoplay_speed'],
                'min' => 500,
                'max' => 20000,
                'step' => 100,
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['autoplay' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'pause_on_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Pause on hover'),
                'description' => \IqitElementorTranslater::get()->l('Pause autoplay when mouse is over the carousel.'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'return_value' => 'yes',
                'section' => $sectionId,
                'default' => $defaults['pause_on_hover'],
                'condition' => array_merge(
                    $condition,
                    ['autoplay' => 'yes']
                ),
            ]
        );

        // ===== GROUPE : COMPORTEMENT =====
        $this->add_control(
            'behavior_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Behavior'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'loop',
            [
                'label' => \IqitElementorTranslater::get()->l('Infinite loop'),
                'description' => \IqitElementorTranslater::get()->l('Loop back to the first slide after the last.'),
                'type' => Controls_Manager::SWITCHER,
                'default' => $defaults['loop'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'direction',
            [
                'label' => \IqitElementorTranslater::get()->l('Direction'),
                'description' => \IqitElementorTranslater::get()->l('Autoplay and initial slide direction.'),
                'type' => Controls_Manager::SELECT,
                'default' => $defaults['direction'],
                'section' => $sectionId,
                'options' => [
                    'left' => \IqitElementorTranslater::get()->l('Left to Right'),
                    'right' => \IqitElementorTranslater::get()->l('Right to Left'),
                ],
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'animation_speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Transition speed'),
                'description' => \IqitElementorTranslater::get()->l('Animation duration in milliseconds.'),
                'type' => Controls_Manager::NUMBER,
                'default' => $defaults['animation_speed'],
                'min' => 100,
                'max' => 2000,
                'step' => 50,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

    }

    /**
     * Enregistre les contrôles de style du carousel
     *
     * @param string $sectionId ID de la section
     * @param array $condition Conditions d'affichage
     * @param array $default_params Valeurs par défaut personnalisées
     */
    protected function register_carousel_styles(string $sectionId = 'section_pswidget_options', array $condition = [], array $default_params = []): void
    {
        $defaults = array_merge(self::getCarouselDefaults(), $default_params);
        // ===== GROUPE : FLÈCHES =====
        $this->add_control(
            'arrows_style_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows'),
                'type' => Controls_Manager::HEADING,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'arrows_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Position'),
                'type' => Controls_Manager::SELECT,
                'default' => $defaults['arrows_position'],
                'tab' => 'style',
                'section' => $sectionId,
                'options' => [
                    'sides' => \IqitElementorTranslater::get()->l('Sides (center)'),
                    'top-right' => \IqitElementorTranslater::get()->l('Top right'),
                    'bottom-right' => \IqitElementorTranslater::get()->l('Bottom right'),
                    'bottom-center' => \IqitElementorTranslater::get()->l('Bottom center'),
                ],
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'arrows_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Size'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 16,
                        'max' => 60,
                        'step' => 1,
                    ],
                ],
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'arrows_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color'),
                'type' => Controls_Manager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'arrows_bg_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Background'),
                'type' => Controls_Manager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        // ===== GROUPE : PAGINATION (DOTS) =====
        $this->add_control(
            'dots_style_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Pagination dots'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['dots' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'dots_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Position'),
                'type' => Controls_Manager::SELECT,
                'default' => $defaults['dots_position'],
                'tab' => 'style',
                'section' => $sectionId,
                'options' => [
                    'below' => \IqitElementorTranslater::get()->l('Below carousel'),
                    'overlay' => \IqitElementorTranslater::get()->l('Overlay (bottom)'),
                ],
                'condition' => array_merge(
                    $condition,
                    ['dots' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'dots_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Size'),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 4,
                        'max' => 20,
                        'step' => 1,
                    ],
                ],
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['dots' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'dots_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color'),
                'type' => Controls_Manager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['dots' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet' => '--swiper-pagination-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'dots_inactive_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Inactive color'),
                'type' => Controls_Manager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['dots' => 'yes']
                ),
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet:not(.swiper-pagination-bullet-active)' => 'background-color: {{VALUE}};',
                ],
            ]
        );
    }

    /**
     * Construit les options du carousel pour le rendu
     *
     * @param array $settings Paramètres du widget
     * @return array Options formatées
     */
    protected function build_carousel_options(array $settings): array
    {
        $defaults = self::getCarouselDefaults();

        return [
            'arrows_position' => $settings['arrows_position'] ?? $defaults['arrows_position'],
            'dots_position' => $settings['dots_position'] ?? $defaults['dots_position'],
            'carousel_options' => [
                'autoplay' => ('yes' === ($settings['autoplay'] ?? $defaults['autoplay'])),
                'slidesToShow' => (float) ($settings['slides_to_show'] ?? $defaults['slides_to_show']),
                'slidesToShowTablet' => (float) ($settings['slides_to_show_tablet'] ?? $defaults['slides_to_show_tablet']),
                'slidesToShowMobile' => (float) ($settings['slides_to_show_mobile'] ?? $defaults['slides_to_show_mobile']),
                'slidesPerPageToShow' => \IqitElementorHelper::absint($settings['slides_per_page'] ?? $defaults['slides_per_page']),
                'slidesPerPageToShowTablet' => \IqitElementorHelper::absint($settings['slides_per_page_tablet'] ?? $defaults['slides_per_page']),
                'slidesPerPageToShowMobile' => \IqitElementorHelper::absint($settings['slides_per_page_mobile'] ?? $defaults['slides_per_page']),
                'spaceBetween' => \IqitElementorHelper::absint($settings['space_between']['size'] ?? $defaults['space_between']),
                'spaceBetweenTablet' => \IqitElementorHelper::absint($settings['space_between_tablet']['size'] ?? $settings['space_between']['size'] ?? $defaults['space_between']),
                'spaceBetweenMobile' => \IqitElementorHelper::absint($settings['space_between_mobile']['size'] ?? $settings['space_between']['size'] ?? $defaults['space_between']),
                'centeredSlides' => ($settings['centered_slides'] ?? $defaults['centered_slides']) === 'yes',
                'arrows' => ($settings['arrows'] ?? $defaults['arrows']) === 'yes',
                'arrowsTablet' => ($settings['arrows_tablet'] ?? $settings['arrows'] ?? $defaults['arrows']) === 'yes',
                'arrowsMobile' => ($settings['arrows_mobile'] ?? $defaults['arrows']) === 'yes',
                'dots' => ($settings['dots'] ?? $defaults['dots']) === 'yes',
                'dotsTablet' => ($settings['dots_tablet'] ?? $settings['dots'] ?? $defaults['dots']) === 'yes',
                'dotsMobile' => ($settings['dots_mobile'] ?? $settings['dots'] ?? $defaults['dots']) === 'yes',
                'loop' => ($settings['loop'] ?? $defaults['loop']) === 'yes',
                'loopTablet' => ($settings['loop_tablet'] ?? $settings['loop'] ?? $defaults['loop']) === 'yes',
                'loopMobile' => ($settings['loop_mobile'] ?? $settings['loop'] ?? $defaults['loop']) === 'yes',
                'autoplaySpeed' => \IqitElementorHelper::absint($settings['autoplay_speed'] ?? $defaults['autoplay_speed']),
                'animationSpeed' => \IqitElementorHelper::absint($settings['animation_speed'] ?? $defaults['animation_speed']),
                'pauseOnHover' => ($settings['pause_on_hover'] ?? $defaults['pause_on_hover']) === 'yes',
                'direction' => $settings['direction'] ?? $defaults['direction'],
            ],
        ];
    }
}
