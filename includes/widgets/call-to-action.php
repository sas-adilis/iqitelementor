<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) exit; // Exit if accessed directly

class Widget_Call_to_action extends Widget_Base
{
    use IqitElementorButtonTrait;

    public function get_id()
    {
        return 'call_to_action';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Call to Action', 'elementor');
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

        /**
         * TAB CONTENT – Section principale CTA
         */
        $this->start_controls_section(
            'section_cta',
            [
                'label' => \IqitElementorWpHelper::__('Call to Action', 'elementor'),
                'tab' => self::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => \IqitElementorWpHelper::__('Link', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Apply Link On', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'box' => \IqitElementorWpHelper::__('Whole Box', 'elementor'),
                    'button' => \IqitElementorWpHelper::__('Button Only', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Skin', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'classic' => \IqitElementorWpHelper::__('Classic', 'elementor'),
                    'cover' => \IqitElementorWpHelper::__('Cover', 'elementor'),
                ],
                'default' => 'classic',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'bg_image',
            [
                'label' => \IqitElementorWpHelper::__('Image', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Image Position', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'left' => ['title' => \IqitElementorWpHelper::__('Left', 'elementor'), 'icon' => 'eicon-h-align-left',],
                    'above' => ['title' => \IqitElementorWpHelper::__('Above', 'elementor'), 'icon' => 'eicon-v-align-top',],
                    'right' => ['title' => \IqitElementorWpHelper::__('Right', 'elementor'), 'icon' => 'eicon-h-align-right',],
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
                'label' => \IqitElementorWpHelper::__('Min Width', 'elementor'),
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
                    'bg_image[url]!' => '',
                    'layout' => ['left', 'right'],
                ],
            ]
        );

        $this->add_responsive_control(
            'image_min_height',
            [
                'label' => \IqitElementorWpHelper::__('Min height', 'elementor'),
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
                    'layout' => ['above'],
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                'tab' => self::TAB_CONTENT,
            ]
        );


        $this->add_control(
            'title',
            [
                'label' => \IqitElementorWpHelper::__('Title & description', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'default' => \IqitElementorWpHelper::__('This is the heading', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Your title', 'elementor'),
                'label_block' => true,
                'section' => 'section_content',
                'save_empty_value' => true,
            ]
        );

        $this->add_control(
            'description_text',
            [
                'label' => null,
                'type' => Controls_Manager::TEXTAREA,
                'default' => \IqitElementorWpHelper::__('I am text block. Click edit button to change this text.', 'elementor'),
                'section' => 'section_content',
                'save_empty_value' => true,
            ]
        );

        $this->add_control(
            'title_tag',
            [
                'label' => \IqitElementorWpHelper::__('Title HTML Tag', 'elementor'),
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
                'default' => 'div',
                'section' => 'section_content',
            ]
        );

        $this->add_control(
            'section_button',
            [
                'label' => \IqitElementorWpHelper::__('Button', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'section' => 'section_content',
                'separator' => 'before',
            ]
        );

        $this->registerButtonControls('section_content', [], ['align', 'link']);

        $this->end_controls_section();


        /**
         * TAB STYLE – Box
         */
        $this->start_controls_section(
            'section_style_box',
            [
                'label' => \IqitElementorWpHelper::__('Box', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'min_height',
            [
                'label' => \IqitElementorWpHelper::__('Min Height'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => ['min' => 100, 'max' => 1000,],
                    'vh' => ['min' => 10, 'max' => 100,],
                ],
                'size_units' => ['px', 'vh'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->add_responsive_control(
            'content_text_align',
            [
                'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => \IqitElementorWpHelper::__('Left', 'elementor'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorWpHelper::__('Center', 'elementor'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorWpHelper::__('Right', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Vertical Position'),
                'type' => Controls_Manager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'top' => ['title' => \IqitElementorWpHelper::__('Top'), 'icon' => 'eicon-v-align-top',],
                    'middle' => ['title' => \IqitElementorWpHelper::__('Middle'), 'icon' => 'eicon-v-align-middle',],
                    'bottom' => ['title' => \IqitElementorWpHelper::__('Bottom'), 'icon' => 'eicon-v-align-bottom',],
                ],
                'prefix_class' => 'elementor-cta-valign-',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->add_responsive_control(
            'box_padding',
            [
                'label' => \IqitElementorWpHelper::__('Padding', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        // Title
        $this->add_control(
            'heading_title_style',
            [
                'label' => \IqitElementorWpHelper::__('Title', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-cta-title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
            ]
        );

        $this->add_responsive_control(
            'title_spacing',
            [
                'label' => \IqitElementorWpHelper::__('Spacing'),
                'type' => Controls_Manager::SLIDER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-title:not(:last-child)' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'title!' => '',
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
            ]
        );

        // Description
        $this->add_control(
            'heading_description_style',
            [
                'label' => \IqitElementorWpHelper::__('Description', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Spacing'),
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
                'label' => \IqitElementorWpHelper::__('Colors', 'elementor'),
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
            'label' => \IqitElementorWpHelper::__('Normal'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorWpHelper::__('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-title' => 'color: {{VALUE}};',
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
                'label' => \IqitElementorWpHelper::__('Description color', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta' => 'background-color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->end_controls_tab();
        $this->start_controls_tab('colors_hover', [
            'label' => \IqitElementorWpHelper::__('Hover'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->add_control(
            'title_color_hover',
            [
                'label' => \IqitElementorWpHelper::__('Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta-title' => 'color: {{VALUE}};',
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
                'label' => \IqitElementorWpHelper::__('Description color', 'elementor'),
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
                'label' => \IqitElementorWpHelper::__('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta' => 'background-color: {{VALUE}};',
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
                'label' => \IqitElementorWpHelper::__('Button', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerButtonStyles('section_style_button');

        $this->end_controls_section();

        $this->start_controls_section(
            'section_style_hover_effects',
            [
                'label' => \IqitElementorWpHelper::__('Hover Effects'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'content_hover_heading',
            [
                'type' => Controls_Manager::HEADING,
                'label' => \IqitElementorWpHelper::__('Content'),
                'condition' => [
                    'skin' => 'cover',
                ],
            ]
        );

        $this->add_control(
            'content_animation',
            [
                'label' => \IqitElementorWpHelper::__('Hover Animation'),
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
                'label' => \IqitElementorWpHelper::__('Animation'),
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
                'label' => \IqitElementorWpHelper::__('Animation Duration'),
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
                'label' => \IqitElementorWpHelper::__('Sequenced Animation'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => \IqitElementorWpHelper::__('On'),
                'label_off' => \IqitElementorWpHelper::__('Off'),
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
                'label' => \IqitElementorWpHelper::__('Background')
            ]
        );

        $this->add_control(
            'transformation',
            [
                'label' => \IqitElementorWpHelper::__('Hover Animation'),
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

    public function parseOptions($optionsSource, $preview = false): array
    {
        // $optionsSource is expected to be the widget settings (similar to get_settings_for_display())
        // Basic options
        $skin = !empty($optionsSource['skin']) ? $optionsSource['skin'] : 'classic';
        $layout = !empty($optionsSource['layout']) ? $optionsSource['layout'] : 'left';

        $hasLink = !empty($optionsSource['link']['url']);
        $linkClick = !empty($optionsSource['link_click']) ? $optionsSource['link_click'] : 'button';

        $buttonText = !empty($optionsSource['button']) ? $optionsSource['button'] : '';
        $hasButton = $buttonText !== '';

        // Wrapper tag & attributes
        $wrapperTag = 'div';
        $wrapperHref = null;
        $wrapperTarget = null;
        $wrapperRel = null;

        if ($hasLink && ('box' === $linkClick || !$hasButton)) {
            $wrapperTag = 'a';
            $wrapperHref = $optionsSource['link']['url'];

            if (!empty($optionsSource['link']['is_external'])) {
                $wrapperTarget = '_blank';
                $wrapperRel = 'noopener noreferrer';
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
            $bgImageUrl = \IqitElementorWpHelper::getImage($optionsSource['bg_image']['url']);
        }

        // Content fields
        $title = !empty($optionsSource['title']) ? $optionsSource['title'] : '';
        $titleTag = !empty($optionsSource['title_tag']) ? $optionsSource['title_tag'] : 'div';
        $description = !empty($optionsSource['description_text']) ? $optionsSource['description_text'] : '';

        $optionsSource['link'] = null;
        $buttonOptions = $this->buildButtonOptions($optionsSource);

        return [

            // Wrapper
            'wrapper_tag' => $wrapperTag,
            'wrapper_href' => $wrapperHref,
            'wrapper_target' => $wrapperTarget,
            'wrapper_rel' => $wrapperRel,
            'wrapper_class' => $wrapperClass,

            // Background image
            'has_bg_image' => $hasBgImage,
            'bg_image_url' => $bgImageUrl,

            // Content
            'title' => $title,
            'title_tag' => $titleTag,
            'description_text' => $description,

            // Button
            'button' => $buttonOptions
        ];
    }
}