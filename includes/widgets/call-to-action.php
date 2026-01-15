<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) exit; // Exit if accessed directly

class Widget_Call_to_action extends Widget_Base
{
    use IqitElementorButtonTrait;
    use IqitElementorHeadingTrait;

    public function get_id()
    {
        return 'call_to_action';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Call to Action', 'elementor');
    }

    public function get_icon()
    {
        return 'image-rollover';
    }

    public function get_keywords()
    {
        return ['cta', 'call', 'action', 'banner'];
    }

    /**
     * Tous les contrôles (sans tags dynamiques)
     */
    protected function _register_controls()
    {
        $this->register_content_controls();
        $this->register_style_controls();
    }

    /**
     * Register content-related controls (TAB CONTENT).
     */
    protected function register_content_controls()
    {
        /**
         * TAB CONTENT – Section principale CTA
         */
        $this->start_controls_section(
            'section_cta',
            [
                'label' => \IqitElementorTranslater::get()->l('Call to Action', 'elementor'),
                'tab' => self::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => 'http://your-link.com',
                'default' => [
                    'url' => '#',
                ]
            ]
        );

        $this->add_control(
            'link_click',
            [
                'label' => \IqitElementorTranslater::get()->l('Apply Link On', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'box' => \IqitElementorTranslater::get()->l('Whole Box', 'elementor'),
                    'button' => \IqitElementorTranslater::get()->l('Button Only', 'elementor'),
                ],
                'default' => 'button',
                'condition' => [
                    'button!' => '',
                    'link[url]!' => '',
                ],
            ]
        );

        $this->add_control(
            'skin',
            [
                'label' => \IqitElementorTranslater::get()->l('Skin', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'classic' => \IqitElementorTranslater::get()->l('Classic', 'elementor'),
                    'cover' => \IqitElementorTranslater::get()->l('Cover', 'elementor'),
                ],
                'default' => 'classic',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'bg_image',
            [
                'label' => \IqitElementorTranslater::get()->l('Image', 'elementor'),
                'type' => Controls_Manager::MEDIA,
                'default' => [
                    'url' => UtilsElementor::get_placeholder_image_src(),
                ],
            ]
        );

        /**
         * Layout (position image / contenu)
         */
        $this->add_responsive_control(
            'layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Image Position', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'left' => ['title' => \IqitElementorTranslater::get()->l('Left', 'elementor'), 'icon' => 'eicon-h-align-left',],
                    'above' => ['title' => \IqitElementorTranslater::get()->l('Above', 'elementor'), 'icon' => 'eicon-v-align-top',],
                    'right' => ['title' => \IqitElementorTranslater::get()->l('Right', 'elementor'), 'icon' => 'eicon-h-align-right',],
                ],
                'default' => 'left',
                'prefix_class' => 'elementor-cta%s-layout-image-',
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'image_min_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Min Width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => ['min' => 0, 'max' => 500,],
                    '%' => ['min' => 0, 'max' => 100,],
                ],
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper' => 'min-width: {{SIZE}}{{UNIT}}',
                ],
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => ''
                ],
            ]
        );

        $this->add_responsive_control(
            'image_min_height',
            [
                'label' => \IqitElementorTranslater::get()->l('Min height', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => ['min' => 0, 'max' => 500,],
                    '%' => ['min' => 0, 'max' => 100,],
                ],
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => '',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                'tab' => self::TAB_CONTENT,
            ]
        );


        $this->add_control(
            'section_heading',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );


        $this->register_heading_controls('section_content', [], ['heading_link']);

        $this->add_control(
            'section_description',
            [
                'label' => \IqitElementorTranslater::get()->l('Description', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'description_text',
            [
                'label' => null,
                'type' => Controls_Manager::WYSIWYG,
                'default' => \IqitElementorTranslater::get()->l('I am text block. Click edit button to change this text.', 'elementor'),
                'section' => 'section_content',
                'save_empty_value' => true,
            ]
        );

        $this->add_control(
            'section_button',
            [
                'label' => \IqitElementorTranslater::get()->l('Button', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => 'section_content',
                'separator' => 'before',
            ]
        );

        $this->register_button_controls('section_content', [], ['button_link']);

        $this->end_controls_section();
    }

    /**
     * Register style-related controls (TAB STYLE).
     */
    protected function register_style_controls()
    {
        /**
         * TAB STYLE – Box
         */
        $this->start_controls_section(
            'section_style_box',
            [
                'label' => \IqitElementorTranslater::get()->l('Box', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'min_height',
            [
                'label' => \IqitElementorTranslater::get()->l('Min Height'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => ['min' => 100, 'max' => 1000,],
                    'vh' => ['min' => 10, 'max' => 100,],
                ],
                'size_units' => ['px', 'vh'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->add_responsive_control(
            'content_text_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorTranslater::get()->l('Center', 'elementor'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
                        'icon' => 'eicon-text-align-right',
                    ],
                ],
                'label_block' => false,
                'default' => 'left',
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'text-align: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );


        $this->add_control(
            'vertical_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Vertical Position'),
                'type' => Controls_Manager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'top' => ['title' => \IqitElementorTranslater::get()->l('Top'), 'icon' => 'eicon-v-align-top',],
                    'middle' => ['title' => \IqitElementorTranslater::get()->l('Middle'), 'icon' => 'eicon-v-align-middle',],
                    'bottom' => ['title' => \IqitElementorTranslater::get()->l('Bottom'), 'icon' => 'eicon-v-align-bottom',],
                ],
                'prefix_class' => 'elementor-cta-valign-',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->add_responsive_control(
            'box_padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Padding', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%', 'rem'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->end_controls_section();

        /**
         * TAB STYLE – Content
         */
        $this->start_controls_section(
            'section_style_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        // Description
        $this->add_control(
            'heading_heading_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'heading_text!' => '',
                ],
            ]
        );


        $this->register_heading_styles('section_style_content', [], ['heading_color']);

        $this->add_responsive_control(
            'heading_spacing',
            [
                'label' => \IqitElementorTranslater::get()->l('Spacing'),
                'type' => Controls_Manager::SLIDER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-content-item:not(:last-child) .elementor-heading-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'heading_text!' => '',
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
            ]
        );

        // Description
        $this->add_control(
            'heading_description_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Description', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-cta-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->add_responsive_control(
            'description_spacing',
            [
                'label' => \IqitElementorTranslater::get()->l('Spacing'),
                'type' => Controls_Manager::SLIDER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-description:not(:last-child)' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'description_text!' => '',
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'heading_colors_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Colors', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->start_controls_tabs('color_tabs', [
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);
        $this->start_controls_tab('colors_normal', [
            'label' => \IqitElementorTranslater::get()->l('Normal'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->add_control(
            'heading_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Description color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-description' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->add_control(
            'box_background_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'background-color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->end_controls_tab();
        $this->start_controls_tab('colors_hover', [
            'label' => \IqitElementorTranslater::get()->l('Hover'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->add_control(
            'title_color_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_control(
            'description_color_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Description color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta-description' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->add_control(
            'box_background_color_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta-content' => 'background-color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );
        $this->end_controls_tab();
        $this->end_controls_tabs();

        $this->end_controls_section();

        /**
         * TAB STYLE – Button
         */
        $this->start_controls_section(
            'section_style_button',
            [
                'label' => \IqitElementorTranslater::get()->l('Button', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->register_button_styles('section_style_button');

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_hover_effects',
            [
                'label' => \IqitElementorTranslater::get()->l('Hover Effects'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'content_hover_heading',
            [
                'type' => Controls_Manager::HEADING,
                'label' => \IqitElementorTranslater::get()->l('Content'),
                'condition' => [
                    'skin' => 'cover',
                ],
            ]
        );

        $this->add_control(
            'content_animation',
            [
                'label' => \IqitElementorTranslater::get()->l('Hover Animation'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => 'None',
                    'enter-from-right' => 'Slide In Right',
                    'enter-from-left' => 'Slide In Left',
                    'enter-from-top' => 'Slide In Up',
                    'enter-from-bottom' => 'Slide In Down',
                    'enter-zoom-in' => 'Zoom In',
                    'enter-zoom-out' => 'Zoom Out',
                    'fade-in' => 'Fade In',
                    'grow' => 'Grow',
                    'shrink' => 'Shrink',
                    'move-right' => 'Move Right',
                    'move-left' => 'Move Left',
                    'move-up' => 'Move Up',
                    'move-down' => 'Move Down',
                    'exit-to-right' => 'Slide Out Right',
                    'exit-to-left' => 'Slide Out Left',
                    'exit-to-top' => 'Slide Out Up',
                    'exit-to-bottom' => 'Slide Out Down',
                    'exit-zoom-in' => 'Zoom In',
                    'exit-zoom-out' => 'Zoom Out',
                    'fade-out' => 'Fade Out',
                ],
                'default' => 'grow',
                'condition' => [
                    'skin' => 'cover',
                ],
            ]
        );

        /*
         * Add class 'elementor-animated-content' to widget when assigned content animation
         */
        $this->add_control(
            'animation_class',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'animated-content',
                'prefix_class' => 'elementor-',
                'condition' => [
                    'content_animation!' => '',
                ],
            ]
        );

        $this->add_control(
            'content_animation_duration',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation Duration'),
                'type' => Controls_Manager::SLIDER,
                'render_type' => 'template',
                'default' => [
                    'size' => 1000,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 3000,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-content-item' => 'transition-duration: {{SIZE}}ms',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(2)' => 'transition-delay: calc({{SIZE}}ms / 3)',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(3)' => 'transition-delay: calc(({{SIZE}}ms / 3) * 2)',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(4)' => 'transition-delay: calc(({{SIZE}}ms / 3) * 3)',
                ],
                'condition' => [
                    'content_animation!' => '',
                    'skin' => 'cover',
                ],
            ]
        );

        $this->add_control(
            'sequenced_animation',
            [
                'label' => \IqitElementorTranslater::get()->l('Sequenced Animation'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => \IqitElementorTranslater::get()->l('On'),
                'label_off' => \IqitElementorTranslater::get()->l('Off'),
                'return_value' => 'elementor-cta--sequenced-animation',
                'prefix_class' => '',
                'condition' => [
                    'content_animation!' => '',
                    'skin' => 'cover',
                ],
                'separator' => 'after',
            ]
        );

        $this->add_control(
            'background_hover_heading',
            [
                'type' => Controls_Manager::HEADING,
                'label' => \IqitElementorTranslater::get()->l('Background')
            ]
        );

        $this->add_control(
            'transformation',
            [
                'label' => \IqitElementorTranslater::get()->l('Hover Animation'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => 'None',
                    'zoom-in' => 'Zoom In',
                    'zoom-out' => 'Zoom Out',
                    'move-left' => 'Move Left',
                    'move-right' => 'Move Right',
                    'move-up' => 'Move Up',
                    'move-down' => 'Move Down',
                ],
                'default' => 'zoom-in',
                'prefix_class' => 'elementor-bg-transform elementor-bg-transform-',
            ]
        );

        $this->end_controls_section();
    }

    public function parse_options($optionsSource, $preview = false): array
    {
        // $optionsSource is expected to be the widget settings (similar to get_settings_for_display())
        // Basic options
        $skin = !empty($optionsSource['skin']) ? $optionsSource['skin'] : 'classic';
        $layout = !empty($optionsSource['layout']) ? $optionsSource['layout'] : 'left';

        $hasLink = !empty($optionsSource['link']['url']) && $optionsSource['link']['url'] !== '#';
        $linkClick = !empty($optionsSource['link_click']) ? $optionsSource['link_click'] : 'button';

        $buttonText = !empty($optionsSource['button_text']) ? $optionsSource['button_text'] : '';
        $hasButton = $buttonText !== '';

        // Wrapper tag & attributes
        $wrapperTag = 'div';
        if ($hasLink) {
            if ('box' === $linkClick || !$hasButton) {
                $wrapperTag = 'a';
            }
        }

        // CSS classes
        $wrapperClass = sprintf(
            'elementor-cta elementor-cta-skin-%s elementor-cta-layout-%s',
            $skin,
            $layout
        );

        // Background image
        $hasBgImage = !empty($optionsSource['bg_image']['url']);
        $bgImageUrl = '';
        if ($hasBgImage) {
            $bgImageUrl = \IqitElementorHelper::getImage($optionsSource['bg_image']['url']);
        }

        // Content fields
        $description = !empty($optionsSource['description_text']) ? $optionsSource['description_text'] : '';

        if ($hasLink && $hasButton && $linkClick === 'button') {
            $optionsSource['button_link'] = $optionsSource['link'];
        }

        $buttonOptions = $this->build_button_options($optionsSource);
        $headingOptions = $this->build_heading_options($optionsSource);

        return [

            // Wrapper
            'wrapper_tag' => $wrapperTag,
            'wrapper_class' => $wrapperClass,

            'link_click' => $linkClick,
            'has_link' => $hasLink,
            'link' => $optionsSource['link'] ?? [],

            // Background image
            'has_bg_image' => $hasBgImage,
            'bg_image_url' => $bgImageUrl,

            // Content
            'heading' => $headingOptions,
            'description_text' => $description,

            // Button
            'button' => $buttonOptions
        ];
    }
}