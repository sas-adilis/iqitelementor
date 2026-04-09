<?php

namespace IqitElementor\Traits;

use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

trait CarouselTrait
{
    /**
     * Retourne les valeurs par défaut du carousel
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
            'scrollbar' => '',
            'scrollbar_hide' => '',
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
    protected function registerCarouselControls(string $sectionId = 'section_pswidget_options', array $condition = [], array $default_params = []): void
    {
        $defaults = array_merge(self::getCarouselDefaults(), $default_params);
        $slides_options = array_combine(range(1, 12), range(1, 12));

        // ===== GROUPE : AFFICHAGE DES SLIDES =====
        $this->addControl(
            'slides_heading',
            [
                'label' => Translater::get()->l('Slides'),
                'type' => ControlManager::HEADING,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'slides_auto_width',
            [
                'label' => Translater::get()->l('Auto width'),
                'description' => Translater::get()->l('Each slide takes its natural width instead of a fixed number.'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'return_value' => 'yes',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'slides_to_show',
            [
                'label' => Translater::get()->l('Visible slides'),
                'description' => Translater::get()->l('Number of slides visible at the same time. Use decimal values (e.g. 2.5) for peek effect.'),
                'type' => ControlManager::NUMBER,
                'default' => $defaults['slides_to_show'],
                'min' => 1,
                'max' => 12,
                'step' => 0.1,
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['slides_auto_width!' => 'yes']
                ),
            ]
        );

        $this->addResponsiveControl(
            'slides_per_page',
            [
                'label' => Translater::get()->l('Slides to scroll'),
                'description' => Translater::get()->l('Number of slides to move on each navigation action.'),
                'type' => ControlManager::SELECT,
                'default' => $defaults['slides_per_page'],
                'section' => $sectionId,
                'options' => $slides_options,
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'space_between',
            [
                'label' => Translater::get()->l('Space between'),
                'description' => Translater::get()->l('Gap between slides in pixels.'),
                'type' => ControlManager::SLIDER,
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

        $this->addControl(
            'centered_slides',
            [
                'label' => Translater::get()->l('Centered slides'),
                'description' => Translater::get()->l('Active slide will be centered, useful for peek effect.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['centered_slides'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        // ===== GROUPE : NAVIGATION =====
        $this->addControl(
            'navigation_heading',
            [
                'label' => Translater::get()->l('Navigation'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'arrows',
            [
                'label' => Translater::get()->l('Arrows'),
                'description' => Translater::get()->l('Previous/Next navigation arrows.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['arrows'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'dots',
            [
                'label' => Translater::get()->l('Pagination dots'),
                'description' => Translater::get()->l('Bullet indicators at the bottom.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['dots'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'scrollbar',
            [
                'label' => Translater::get()->l('Scrollbar'),
                'description' => Translater::get()->l('Draggable scrollbar navigation.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['scrollbar'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'scrollbar_hide',
            [
                'label' => Translater::get()->l('Hide on idle'),
                'description' => Translater::get()->l('Auto-hide scrollbar when not interacting.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['scrollbar_hide'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'condition' => array_merge(
                    $condition,
                    ['scrollbar' => 'yes']
                ),
            ]
        );

        // ===== GROUPE : LECTURE AUTOMATIQUE =====
        $this->addControl(
            'additional_options_heading',
            [
                'label' => Translater::get()->l('Autoplay'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'autoplay',
            [
                'label' => Translater::get()->l('Enable autoplay'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'yes',
                'section' => $sectionId,
                'default' => $defaults['autoplay'],
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'autoplay_speed',
            [
                'label' => Translater::get()->l('Interval'),
                'description' => Translater::get()->l('Time between slides in milliseconds.'),
                'type' => ControlManager::NUMBER,
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

        $this->addControl(
            'pause_on_hover',
            [
                'label' => Translater::get()->l('Pause on hover'),
                'description' => Translater::get()->l('Pause autoplay when mouse is over the carousel.'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
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
        $this->addControl(
            'behavior_heading',
            [
                'label' => Translater::get()->l('Behavior'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->addResponsiveControl(
            'loop',
            [
                'label' => Translater::get()->l('Infinite loop'),
                'description' => Translater::get()->l('Loop back to the first slide after the last.'),
                'type' => ControlManager::SWITCHER,
                'default' => $defaults['loop'],
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'direction',
            [
                'label' => Translater::get()->l('Direction'),
                'description' => Translater::get()->l('Autoplay and initial slide direction.'),
                'type' => ControlManager::SELECT,
                'default' => $defaults['direction'],
                'section' => $sectionId,
                'options' => [
                    'left' => Translater::get()->l('Left to Right'),
                    'right' => Translater::get()->l('Right to Left'),
                ],
                'condition' => $condition,
            ]
        );

        $this->addControl(
            'animation_speed',
            [
                'label' => Translater::get()->l('Transition speed'),
                'description' => Translater::get()->l('Animation duration in milliseconds.'),
                'type' => ControlManager::NUMBER,
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
    protected function registerCarouselStyles(string $sectionId = 'section_pswidget_options', array $condition = [], array $default_params = []): void
    {
        $defaults = array_merge(self::getCarouselDefaults(), $default_params);
        // ===== GROUPE : FLÈCHES =====
        // Pas de condition sur les toggles responsive (arrows, dots, scrollbar)
        // pour les styles : le système de conditions ne supporte que le AND entre clés,
        // impossible d'exprimer "arrows=yes OU arrows_tablet=yes OU arrows_mobile=yes".
        // Les styles sont toujours visibles et n'ont d'effet que si la feature est active.
        $arrowsCondition = $condition;
        $dotsCondition = $condition;
        $scrollbarCondition = $condition;

        $this->addControl(
            'arrows_style_heading',
            [
                'label' => Translater::get()->l('Arrows'),
                'type' => ControlManager::HEADING,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $arrowsCondition,
            ]
        );

        $this->addControl(
            'arrows_position',
            [
                'label' => Translater::get()->l('Position'),
                'type' => ControlManager::SELECT,
                'default' => $defaults['arrows_position'],
                'tab' => 'style',
                'section' => $sectionId,
                'options' => [
                    'sides' => Translater::get()->l('Sides (center)'),
                    'top-right' => Translater::get()->l('Top right'),
                    'top-left' => Translater::get()->l('Top left'),
                    'bottom-right' => Translater::get()->l('Bottom right'),
                    'bottom-left' => Translater::get()->l('Bottom left'),
                    'bottom-center' => Translater::get()->l('Bottom center'),
                ],
                'condition' => $arrowsCondition,
            ]
        );

        $this->addControl(
            'arrows_type',
            [
                'label' => Translater::get()->l('Arrow type'),
                'type' => ControlManager::SELECT,
                'default' => 'default',
                'tab' => 'style',
                'section' => $sectionId,
                'options' => [
                    'default' => Translater::get()->l('Default'),
                    'custom' => Translater::get()->l('Custom icon'),
                ],
                'condition' => $arrowsCondition,
            ]
        );

        $this->addControl(
            'arrow_prev_icon',
            [
                'label' => Translater::get()->l('Previous icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => '',
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $arrowsCondition,
                    ['arrows_type' => 'custom']
                ),
            ]
        );

        $this->addControl(
            'arrow_next_icon',
            [
                'label' => Translater::get()->l('Next icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => '',
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => array_merge(
                    $arrowsCondition,
                    ['arrows_type' => 'custom']
                ),
            ]
        );

        $this->addControl(
            'arrows_size',
            [
                'label' => Translater::get()->l('Size'),
                'type' => ControlManager::SLIDER,
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
                'condition' => $arrowsCondition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button, {{WRAPPER}} .swiper-button-prev, {{WRAPPER}} .swiper-button-next' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-swiper-button svg, {{WRAPPER}} .swiper-button-prev svg, {{WRAPPER}} .swiper-button-next svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'arrows_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $arrowsCondition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button, {{WRAPPER}} .swiper-button-prev, {{WRAPPER}} .swiper-button-next' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-swiper-button svg, {{WRAPPER}} .swiper-button-prev svg, {{WRAPPER}} .swiper-button-next svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'arrows_bg_color',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $arrowsCondition,
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button, {{WRAPPER}} .swiper-button-prev, {{WRAPPER}} .swiper-button-next' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        // ===== GROUPE : PAGINATION (DOTS) =====
        $this->addControl(
            'dots_style_heading',
            [
                'label' => Translater::get()->l('Pagination dots'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $dotsCondition,
            ]
        );

        $this->addControl(
            'dots_position',
            [
                'label' => Translater::get()->l('Position'),
                'type' => ControlManager::SELECT,
                'default' => $defaults['dots_position'],
                'tab' => 'style',
                'section' => $sectionId,
                'options' => [
                    'below' => Translater::get()->l('Below (centered)'),
                    'vertical-right' => Translater::get()->l('Right side (vertical)'),
                    'vertical-left' => Translater::get()->l('Left side (vertical)'),
                ],
                'condition' => $dotsCondition,
            ]
        );

        $this->addControl(
            'dots_size',
            [
                'label' => Translater::get()->l('Size'),
                'type' => ControlManager::SLIDER,
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
                'condition' => $dotsCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'dots_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $dotsCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet' => '--swiper-pagination-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'dots_inactive_color',
            [
                'label' => Translater::get()->l('Inactive color'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $dotsCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination .swiper-pagination-bullet:not(.swiper-pagination-bullet-active)' => 'background-color: {{VALUE}};',
                ],
            ]
        );
        $this->addControl(
            'dots_active_width',
            [
                'label' => Translater::get()->l('Active dot width'),
                'type' => ControlManager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 4,
                        'max' => 40,
                        'step' => 1,
                    ],
                ],
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $dotsCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination-horizontal .swiper-pagination-bullet-active' => 'width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .swiper-pagination-vertical .swiper-pagination-bullet-active' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // ===== GROUPE : SCROLLBAR =====
        $this->addControl(
            'scrollbar_style_heading',
            [
                'label' => Translater::get()->l('Scrollbar'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $scrollbarCondition,
            ]
        );

        $this->addControl(
            'scrollbar_height',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 2,
                        'max' => 20,
                        'step' => 1,
                    ],
                ],
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $scrollbarCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-scrollbar' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'scrollbar_track_color',
            [
                'label' => Translater::get()->l('Track color'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $scrollbarCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-scrollbar' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'scrollbar_drag_color',
            [
                'label' => Translater::get()->l('Drag color'),
                'type' => ControlManager::COLOR,
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $scrollbarCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-scrollbar .swiper-scrollbar-drag' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'scrollbar_border_radius',
            [
                'label' => Translater::get()->l('Border radius'),
                'type' => ControlManager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 20,
                        'step' => 1,
                    ],
                ],
                'tab' => 'style',
                'section' => $sectionId,
                'condition' => $scrollbarCondition,
                'selectors' => [
                    '{{WRAPPER}} .swiper-scrollbar' => 'border-radius: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .swiper-scrollbar .swiper-scrollbar-drag' => 'border-radius: {{SIZE}}{{UNIT}};',
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
    protected function buildCarouselOptions(array $settings): array
    {
        $defaults = self::getCarouselDefaults();

        $arrowPrevHtml = '';
        $arrowNextHtml = '';
        $arrowsType = $settings['arrows_type'] ?? 'default';

        if ($arrowsType === 'custom') {
            $arrowPrevHtml = IconHelper::renderIcon($settings['arrow_prev_icon'] ?? '');
            $arrowNextHtml = IconHelper::renderIcon($settings['arrow_next_icon'] ?? '');
        }

        return [
            'arrows_position' => $settings['arrows_position'] ?? $defaults['arrows_position'],
            'arrows_type' => $arrowsType,
            'arrow_prev_html' => $arrowPrevHtml,
            'arrow_next_html' => $arrowNextHtml,
            'dots_position' => $settings['dots_position'] ?? $defaults['dots_position'],
            'carousel_options' => [
                'autoplay' => ('yes' === ($settings['autoplay'] ?? $defaults['autoplay'])),
                'slidesToShow' => ($settings['slides_auto_width'] ?? '') === 'yes' ? 'auto' : (float) ($settings['slides_to_show'] ?? $defaults['slides_to_show']),
                'slidesToShowTablet' => ($settings['slides_auto_width'] ?? '') === 'yes' ? 'auto' : (float) ($settings['slides_to_show_tablet'] ?? $defaults['slides_to_show_tablet']),
                'slidesToShowMobile' => ($settings['slides_auto_width'] ?? '') === 'yes' ? 'auto' : (float) ($settings['slides_to_show_mobile'] ?? $defaults['slides_to_show_mobile']),
                'slidesPerPageToShow' => Helper::absint($settings['slides_per_page'] ?? $defaults['slides_per_page']),
                'slidesPerPageToShowTablet' => Helper::absint($settings['slides_per_page_tablet'] ?? $defaults['slides_per_page']),
                'slidesPerPageToShowMobile' => Helper::absint($settings['slides_per_page_mobile'] ?? $defaults['slides_per_page']),
                'spaceBetween' => Helper::absint($settings['space_between']['size'] ?? $defaults['space_between']),
                'spaceBetweenTablet' => Helper::absint($settings['space_between_tablet']['size'] ?? $settings['space_between']['size'] ?? $defaults['space_between']),
                'spaceBetweenMobile' => Helper::absint($settings['space_between_mobile']['size'] ?? $settings['space_between']['size'] ?? $defaults['space_between']),
                'centeredSlides' => ($settings['centered_slides'] ?? $defaults['centered_slides']) === 'yes',
                'arrows' => ($settings['arrows'] ?? $defaults['arrows']) === 'yes',
                'arrowsTablet' => ($settings['arrows_tablet'] ?? $settings['arrows'] ?? $defaults['arrows']) === 'yes',
                'arrowsMobile' => ($settings['arrows_mobile'] ?? $defaults['arrows']) === 'yes',
                'dots' => ($settings['dots'] ?? $defaults['dots']) === 'yes',
                'dotsTablet' => ($settings['dots_tablet'] ?? $settings['dots'] ?? $defaults['dots']) === 'yes',
                'dotsMobile' => ($settings['dots_mobile'] ?? $settings['dots'] ?? $defaults['dots']) === 'yes',
                'scrollbar' => ($settings['scrollbar'] ?? $defaults['scrollbar']) === 'yes',
                'scrollbarTablet' => ($settings['scrollbar_tablet'] ?? $settings['scrollbar'] ?? $defaults['scrollbar']) === 'yes',
                'scrollbarMobile' => ($settings['scrollbar_mobile'] ?? $settings['scrollbar'] ?? $defaults['scrollbar']) === 'yes',
                'scrollbarHide' => ($settings['scrollbar_hide'] ?? $defaults['scrollbar_hide']) === 'yes',
                'loop' => ($settings['loop'] ?? $defaults['loop']) === 'yes',
                'loopTablet' => ($settings['loop_tablet'] ?? $settings['loop'] ?? $defaults['loop']) === 'yes',
                'loopMobile' => ($settings['loop_mobile'] ?? $settings['loop'] ?? $defaults['loop']) === 'yes',
                'autoplaySpeed' => Helper::absint($settings['autoplay_speed'] ?? $defaults['autoplay_speed']),
                'animationSpeed' => Helper::absint($settings['animation_speed'] ?? $defaults['animation_speed']),
                'pauseOnHover' => ($settings['pause_on_hover'] ?? $defaults['pause_on_hover']) === 'yes',
                'direction' => $settings['direction'] ?? $defaults['direction'],
                'addIcons' => ($arrowsType !== 'custom'),
            ],
        ];
    }
}
