<?php
namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

trait IqitElementorCarouselTrait
{
    /**
     * Enregistre les contrôles liés au carousel sur la section donnée
     */
    protected function register_carousel_controls(string $sectionId = 'section_pswidget_options', array $condition = [], array $default_params = []): void
    {
        $slides = range(1, 12);
        $slidesToShowSlider = array_combine($slides, $slides);

        $this->add_responsive_control(
            'dots',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'arrows',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'scrollbar',
            [
                'label' => \IqitElementorTranslater::get()->l('Scrollbar', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'slides_to_show',
            [
                'label' => \IqitElementorTranslater::get()->l('Slides to show', 'elementor'),
                'type' => 'select',
                'default' => '5',
                'section' => $sectionId,
                'options' => $slidesToShowSlider,
                'condition' => $condition,
            ]
        );

        $this->add_responsive_control(
            'slides_per_page',
            [
                'label' => \IqitElementorTranslater::get()->l('Slides per scroll', 'elementor'),
                'type' => 'select',
                'default' => '5',
                'section' => $sectionId,
                'options' => $slidesToShowSlider,
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'additional_options_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Additional options', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => $sectionId,
            ]
        );

        $this->add_control(
            'autoplay',
            [
                'label' => \IqitElementorTranslater::get()->l('Autoplay', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'yes',
                'section' => $sectionId,
                'default' => 'yes',
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'pause_on_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Pause on mouseover', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'yes',
                'section' => $sectionId,
                'default' => 'yes',
                'condition' => array_merge(
                    $condition,
                    ['autoplay' => 'yes']
                ),
            ]
        );

        $this->add_control(
            'autoplay_speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Autoplay Speed (ms)', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 5000,
                'section' => $sectionId,
                'condition' => array_merge(
                    $condition,
                    ['autoplay' => 'yes']
                ),
            ]
        );

        $this->add_responsive_control(
            'loop',
            [
                'label' => \IqitElementorTranslater::get()->l('Loop', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'return_value' => 'yes',
                'section' => $sectionId,
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'animation_speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation Speed (ms)', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 300,
                'section' => $sectionId,
                'condition' => $condition,
            ]
        );

        $this->add_control(
            'direction',
            [
                'label' => \IqitElementorTranslater::get()->l('Direction', 'elementor'),
                'type' => 'select',
                'default' => 'left',
                'section' => $sectionId,
                'options' => [
                    'left' => \IqitElementorTranslater::get()->l('Left to Right', 'elementor'),
                    'right' => \IqitElementorTranslater::get()->l('Right to Left', 'elementor'),
                ],
                'condition' => $condition,
            ]
        );

        if (count($default_params)) {
            $controls = $this->get_controls();
            foreach ($controls as $control) {
                if (array_key_exists($control['name'], $default_params)) {
                    $this->update_control(
                        $control['name'],
                        [
                            'default' => $default_params[$control['name']],
                        ]
                    );
                }
            }
        }

    }

    protected function register_carousel_styles(string $sectionId = 'section_pswidget_options', array $condition = []): void
    {
        $this->add_control(
            'arrows_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows position', 'elementor'),
                'type' => 'select',
                'default' => 'middle',
                'tab' => 'style',
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'section' => $sectionId,
                'options' => [
                    'middle' => \IqitElementorTranslater::get()->l('Middle', 'elementor'),
                    'above' => \IqitElementorTranslater::get()->l('Above', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'arrows_position_top',
            [
                'label' => \IqitElementorTranslater::get()->l('Position top', 'elementor'),
                'type' => 'number',
                'default' => '-20',
                'min' => '-100',
                'tab' => 'style',
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes'],
                    ['arrows_position' => 'above']
                ),
                'section' => $sectionId,
                'selectors' => [
                    '{{WRAPPER}} .swiper-arrows-above .swiper-button' => 'top: {{VALUE}}px;',
                ],
            ]
        );

        $this->add_control(
            'arrows_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows Color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'section' => $sectionId,
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'arrows_bg_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'condition' => array_merge(
                    $condition,
                    ['arrows' => 'yes']
                ),
                'section' => $sectionId,
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'dots_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots color', 'elementor'),
                'type' => 'color',
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
    }

    protected function build_carousel_options(array $settings): array
    {
        return [
            'arrows_position' => $settings['arrows_position'] ?? 'middle',
            'carousel_options' => [
                'autoplay' => ('yes' === ($settings['autoplay'] ?? 'no')),
                'slidesToShow' => \IqitElementorHelper::absint($settings['slides_to_show'] ?? 4),
                'slidesToShowTablet' => \IqitElementorHelper::absint($settings['slides_to_show_tablet'] ?? 4),
                'slidesToShowMobile' => \IqitElementorHelper::absint($settings['slides_to_show_mobile'] ?? 4),
                'slidesPerPageToShow' => \IqitElementorHelper::absint($settings['slides_per_page'] ?? 4),
                'slidesPerPageToShowTablet' => \IqitElementorHelper::absint($settings['slides_per_page_tablet'] ?? 4),
                'slidesPerPageToShowMobile' => \IqitElementorHelper::absint($settings['slides_per_page_mobile'] ?? 4),
                'scrollbar' => ($settings['scrollbar'] ?? '') === 'yes',
                'scrollbarTablet' => ($settings['scrollbar'] ?? '') === 'yes',
                'scrollbarMobile' => ($settings['scrollbar'] ?? '') === 'yes',
                'arrows' => ($settings['arrows'] ?? '') === 'yes',
                'arrowsTablet' => ($settings['arrows_tablet'] ?? '') === 'yes',
                'arrowsMobile' => ($settings['arrows_mobile'] ?? '') === 'yes',
                'dots' => ($settings['dots'] ?? '') === 'yes',
                'dotsTablet' => ($settings['dots_tablet'] ?? '') === 'yes',
                'dotsMobile' => ($settings['dots_mobile'] ?? '') === 'yes',
                'loop' => ($settings['loop'] ?? '') === 'yes',
                'loopTablet' => ($settings['loop_tablet'] ?? '') === 'yes',
                'loopMobile' => ($settings['loop_mobile'] ?? '') === 'yes',
                'autoplaySpeed' => \IqitElementorHelper::absint($settings['autoplay_speed'] ?? 5000),
                'animationSpeed' => \IqitElementorHelper::absint($settings['animation_speed'] ?? 300),
                'pauseOnHover' => ($settings['pause_on_hover'] ?? '') === 'yes',
                'direction' => ($settings['direction'] ?? 'left'),
            ],
        ];
    }
}
