<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Testimonial extends Widget_Base
{

    use IqitElementorCarouselTrait;

    public function get_id(): string
    {
        return 'testimonial';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Testimonial', 'elementor');
    }

    public function get_icon(): string
    {
        return 'testimonial-carousel';
    }

    protected function _register_controls()
    {


        $this->start_controls_section(
            'section_testimonial',
            [
                'label' => \IqitElementorWpHelper::__('Testimonial', 'elementor'),
            ]
        );

        $this->add_control(
            'testimonials_list',
            [
                'label' => '',
                'type' => Controls_Manager::REPEATER,
                'default' => [],
                'fields' => [
                    [
                        'name' => 'name',
                        'label' => \IqitElementorWpHelper::__('Name', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'default' => 'John Doe',
                    ],
                    [
                        'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                        'type' => Controls_Manager::WYSIWYG,
                        'rows' => '10',
                        'name' => 'content',
                        'default' => 'Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.',
                    ],
                    [
                        'label' => \IqitElementorWpHelper::__('Note', 'elementor'),
                        'type' => Controls_Manager::SELECT,
                        'name' => 'note',
                        'options' => [
                            '5' => '5 ' . \IqitElementorWpHelper::__('Stars', 'elementor'),
                            '4' => '4 ' . \IqitElementorWpHelper::__('Stars', 'elementor'),
                            '3' => '3 ' . \IqitElementorWpHelper::__('Stars', 'elementor'),
                            '2' => '2 ' . \IqitElementorWpHelper::__('Stars', 'elementor'),
                            '1' => '1 ' . \IqitElementorWpHelper::__('Star', 'elementor'),
                        ],
                        'default' => '5',
                    ]
                ],
                'title_field' => 'name',
            ]
        );

        $this->add_control(
            'testimonial_notes',
            [
                'label' => \IqitElementorWpHelper::__('Show Notes', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'testimonial_alignment',
            [
                'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'default' => 'center',
                'section' => 'section_additional_options',
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
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_carousel_options',
            [
                'label' => \IqitElementorWpHelper::__('Carousel', 'elementor'),
            ]
        );

        $this->register_carousel_controls('section_carousel_options', [], ['slides_to_show' => 1]);

        $this->end_controls_section();

        // Box
        $this->start_controls_section(
            'section_style_testimonial_box',
            [
                'label' => \IqitElementorWpHelper::__('Testimonial box', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'note_color',
            [
                'label' => \IqitElementorWpHelper::__('Note Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
                'separator' => 'after',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-name svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'background_color',
            [
                'label' => \IqitElementorWpHelper::__('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
                'separator' => 'after',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'testimonial_border',
                'label' => \IqitElementorWpHelper::__('Border', 'elementor'),
                'selector' => '{{WRAPPER}} .elementor-testimonial-wrapper',
            ]
        );

        $this->add_control(
            'testimonial_border_radius',
            [
                'label' => \IqitElementorWpHelper::__('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'testimonial_padding',
            [
                'label' => \IqitElementorWpHelper::__('Box padding', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'testimonial_margin',
            [
                'label' => \IqitElementorWpHelper::__('Box Margin', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'testimonial_box_shadow',
                'section' => 'section_style_testimonial_box',
                'selector' => '{{WRAPPER}} .elementor-testimonial-wrapper',
            ]
        );

        $this->end_controls_section();

        // Content
        $this->start_controls_section(
            'section_style_content',
            [
                'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'section_style_content_content',
            [
                'label' => \IqitElementorWpHelper::__('Content', 'elementor'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_control(
            'content_content_color',
            [
                'label' => \IqitElementorWpHelper::__('Content Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'content_typography',
                'label' => \IqitElementorWpHelper::__('Typography', 'elementor'),
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
                'selector' => '{{WRAPPER}} .elementor-testimonial-content',
            ]
        );

        $this->add_control(
            'section_style_content_name',
            [
                'label' => \IqitElementorWpHelper::__('Name', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'name_text_color',
            [
                'label' => \IqitElementorWpHelper::__('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-name' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'name_typography',
                'label' => \IqitElementorWpHelper::__('Typography', 'elementor'),
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_testimonial_name',
                'selector' => '{{WRAPPER}} .elementor-testimonial-name',
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_carousel_styles',
            [
                'label' => \IqitElementorWpHelper::__('Carousel', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE
            ]
        );

        $this->register_carousel_styles('section_carousel_styles');

        $this->end_controls_section();
    }
/*
    protected function render($instance = [])
    {
        if (empty($instance['testimonials_list'])) {
            return;
        }

        $is_slideshow = '1' === $instance['slides_to_show'];
        $show_dots = in_array($instance['navigation'], ['dots', 'both']);
        $show_arrows = in_array($instance['navigation'], ['arrows', 'both']);

        $swiper_options = [
            'slidesToShow' => \IqitElementorWpHelper::absint($instance['slides_to_show']),
            'autoplaySpeed' => \IqitElementorWpHelper::absint($instance['autoplay_speed']),
            'autoplay' => ('yes' === $instance['autoplay']),
            'loop' => ('yes' === $instance['infinite']),
            'disableOnInteraction' => ('yes' === $instance['pause_on_hover']),
            'speed' => \IqitElementorWpHelper::absint($instance['speed']),
            'arrows' => $show_arrows,
            'dots' => $show_dots,
            'fade' => ($is_slideshow && ('fade' === $instance['effect']) ? true : false),
        ];

        $carousel_classes = ['elementor-testimonial-carousel'];

        $cls_fix_classes[] = 'swiper-cls-fix';
        $cls_fix_classes[] = 'desktop-swiper-cls-fix-' . \IqitElementorWpHelper::absint($instance['slides_to_show']);
        $cls_fix_classes[] = 'tablet-swiper-cls-fix-' . ((1 == \IqitElementorWpHelper::absint($instance['slides_to_show'])) ? 1 : 2);
        $cls_fix_classes[] = 'mobile-swiper-cls-fix-1';

        $testimonial_alignment = $instance['testimonial_alignment'] ? ' elementor-testimonial-text-align-' . $instance['testimonial_alignment'] : '';
        $testimonial_image_position = $instance['testimonial_image_position'] ? ' elementor-testimonial-image-position-' . $instance['testimonial_image_position'] : '';
        ?>

        <div class="elementor-testimonial-carousel-wrapper swiper-overflow swiper-arrows-<?php echo $instance['arrows_position']; ?>">
            <div class="<?php echo implode(' ', $carousel_classes); ?> swiper swiper-container  <?php echo implode(' ', $cls_fix_classes); ?>" data-slider_options='<?php echo json_encode($swiper_options); ?>'>
                <div class="swiper-wrapper">
                    <?php foreach ($instance['testimonials_list'] as $item) { ?>
                        <div class="swiper-slide">
                            <div class="swiper-slide-inner">
                                <?php
                                $has_image = false;
                                if ('' !== $item['image']['url']) {
                                    $image_url = $item['image']['url'];
                                    $image_width = $item['image']['width'] ? 'width="' . \IqitElementorWpHelper::absint($item['image']['width']) . '"' : '';
                                    $image_height = $item['image']['height'] ? 'height="' . \IqitElementorWpHelper::absint($item['image']['height']) . '"' : '';
                                    $has_image = ' elementor-has-image';
                                }
                                ?>

                                <div class="elementor-testimonial-wrapper<?php echo $testimonial_alignment; ?>">

                                    <?php if (isset($image_url) && $instance['testimonial_image_position'] == 'top') { ?>
                                        <div class="elementor-testimonial-meta<?php if ($has_image) {
                                            echo $has_image;
                                        } ?><?php echo $testimonial_image_position; ?>">
                                            <div class="elementor-testimonial-image">
                                                <img src="<?php echo \IqitElementorWpHelper::esc_attr($image_url); ?>" <?php echo $image_width . ' ' . $image_height; ?> alt="<?php echo \IqitElementorWpHelper::esc_attr(Control_Media::get_image_alt($item['image'])); ?>"/>
                                            </div>
                                        </div>
                                    <?php } ?>

                                    <?php if (!empty($item['content'])) { ?>
                                        <div class="elementor-testimonial-content">
                                            <?php echo $this->parse_text_editor($item['content'], $item); ?>
                                        </div>
                                    <?php } ?>

                                    <div class="elementor-testimonial-meta<?php if ($has_image) {
                                        echo $has_image;
                                    } ?><?php echo $testimonial_image_position; ?>">
                                        <div class="elementor-testimonial-meta-inner">
                                            <?php if (isset($image_url) && $instance['testimonial_image_position'] == 'aside') { ?>
                                                <div class="elementor-testimonial-image">
                                                    <img src="<?php echo \IqitElementorWpHelper::esc_attr($image_url); ?>" <?php echo $image_width . ' ' . $image_height; ?> alt="<?php echo \IqitElementorWpHelper::esc_attr(Control_Media::get_image_alt($item['image'])); ?>"/>
                                                </div>
                                            <?php } ?>

                                            <div class="elementor-testimonial-details">
                                                <?php if (!empty($item['name'])) { ?>
                                                    <div class="elementor-testimonial-name">
                                                        <?php echo $item['name']; ?>
                                                    </div>
                                                <?php } ?>

                                                <?php if (!empty($item['job'])) { ?>
                                                    <div class="elementor-testimonial-job">
                                                        <?php echo $item['job']; ?>
                                                    </div>
                                                <?php } ?>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php
                    } ?>
                </div>
                <?php if ($show_dots) { ?>
                    <div class="swiper-pagination elementor-swiper-pagination swiper-dots-outside"></div>
                <?php } ?>
            </div>
            <?php if ($show_arrows) { ?>
                <div class="swiper-button-prev swiper-button elementor-swiper-button elementor-swiper-button-prev"></div>
                <div class="swiper-button-next swiper-button elementor-swiper-button elementor-swiper-button-next"></div>
            <?php } ?>
        </div>
    <?php }*/

    protected function content_template()
    {
    }

    public function parseOptions($optionsSource, $preview = false): array
    {
        if (empty($optionsSource['testimonials_list'])) {
            return [];
        }

        $testimonial_alignment = $optionsSource['testimonial_alignment'] ? ' elementor-testimonial-text-align-' . $optionsSource['testimonial_alignment'] : '';
        $testimonials_list = $optionsSource['testimonials_list'];

        return array_merge(
            [
                'testimonial_alignment' => $testimonial_alignment,
                'testimonials_list' => $testimonials_list,
                'show_notes' => isset($optionsSource['testimonial_notes']) && 'yes' === $optionsSource['testimonial_notes'],
                'note_color' => $optionsSource['note_color'] ?? '#000000',
            ],
            $this->build_carousel_options($optionsSource)
        );
    }
}
