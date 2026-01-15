<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Image_Carousel extends Widget_Base
{
    public function get_id()
    {
        return 'image-carousel';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Image Carousel', 'elementor');
    }

    public function get_icon()
    {
        return 'slider-push';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_image_carousel',
            [
                'label' => \IqitElementorTranslater::get()->l('Images list', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'images_list',
            [
                'label' => '',
                'type' => Controls_Manager::REPEATER,
                'default' => [],
                'section' => 'section_image_carousel',
                'fields' => [
                    [
                        'name' => 'text',
                        'label' => \IqitElementorTranslater::get()->l('Image alt', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'label_block' => true,
                        'placeholder' => \IqitElementorTranslater::get()->l('Image alt', 'elementor'),
                        'default' => \IqitElementorTranslater::get()->l('Image alt', 'elementor'),
                    ],
                    [
                        'name' => 'image',
                        'label' => \IqitElementorTranslater::get()->l('Choose Image', 'elementor'),
                        'type' => Controls_Manager::MEDIA,
                        'placeholder' => \IqitElementorTranslater::get()->l('Image', 'elementor'),
                        'label_block' => true,
                        'default' => [
                            'url' => UtilsElementor::get_placeholder_image_src(),
                        ],
                    ],
                    [
                        'name' => 'link',
                        'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
                        'type' => Controls_Manager::URL,
                        'label_block' => true,
                        'placeholder' => \IqitElementorTranslater::get()->l('http://your-link.com', 'elementor'),
                    ],
                ],
                'title_field' => 'text',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_image_carousel',
            ]
        );

        $this->add_control(
            'section_additional_options',
            [
                'label' => \IqitElementorTranslater::get()->l('Carousel settings', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $slides_to_show = range(1, 10);
        $slides_to_show = array_combine($slides_to_show, $slides_to_show);

        $this->add_responsive_control(
            'slides_to_show',
            [
                'label' => \IqitElementorTranslater::get()->l('Slides to Show', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '3',
                'section' => 'section_additional_options',
                'options' => $slides_to_show,
            ]
        );

        $this->add_control(
            'image_stretch',
            [
                'label' => \IqitElementorTranslater::get()->l('Image Stretch', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'no',
                'section' => 'section_additional_options',
                'options' => [
                    'no' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                ],
            ]
        );
        $this->add_control(
            'image_lazy',
            [
                'label' => \IqitElementorTranslater::get()->l('Lazy load', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'no' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'navigation',
            [
                'label' => \IqitElementorTranslater::get()->l('Navigation', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'both',
                'section' => 'section_additional_options',
                'options' => [
                    'both' => \IqitElementorTranslater::get()->l('Arrows and Dots', 'elementor'),
                    'arrows' => \IqitElementorTranslater::get()->l('Arrows', 'elementor'),
                    'dots' => \IqitElementorTranslater::get()->l('Dots', 'elementor'),
                    'none' => \IqitElementorTranslater::get()->l('None', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'autoplay',
            [
                'label' => \IqitElementorTranslater::get()->l('Autoplay', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                    'no' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                ],
            ]
        );
        $this->add_control(
            'pause_on_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Pause on hover', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'condition' => [
                    'autoplay' => 'yes',
                ],
                'options' => [
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                    'no' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'autoplay_speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Autoplay Speed', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 5000,
                'condition' => [
                    'autoplay' => 'yes',
                ],
                'section' => 'section_additional_options',
            ]
        );

        $this->add_control(
            'infinite',
            [
                'label' => \IqitElementorTranslater::get()->l('Infinite Loop', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'yes' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                    'no' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'effect',
            [
                'label' => \IqitElementorTranslater::get()->l('Effect', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'slide',
                'section' => 'section_additional_options',
                'options' => [
                    'slide' => \IqitElementorTranslater::get()->l('Slide', 'elementor'),
                    'fade' => \IqitElementorTranslater::get()->l('Fade', 'elementor'),
                ],
                'condition' => [
                    'slides_to_show' => '1',
                ],
            ]
        );

        $this->add_control(
            'speed',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation Speed', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'default' => 500,
                'section' => 'section_additional_options',
            ]
        );

        $this->add_control(
            'section_style_navigation',
            [
                'label' => \IqitElementorTranslater::get()->l('Navigation', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'navigation' => ['arrows', 'dots', 'both'],
                ],
            ]
        );

        $this->add_control(
            'heading_style_arrows',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'separator' => 'before',
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->add_control(
            'arrows_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows Position', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'inside',
                'section' => 'section_style_navigation',
                'tab' => self::TAB_STYLE,
                'options' => [
                    'inside' => \IqitElementorTranslater::get()->l('Inside', 'elementor'),
                    'outside' => \IqitElementorTranslater::get()->l('Outside', 'elementor'),
                ],
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->add_control(
            'arrows_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows Size', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'section' => 'section_style_navigation',
                'tab' => self::TAB_STYLE,
                'range' => [
                    'px' => [
                        'min' => 20,
                        'max' => 60,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button:after' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->add_control(
            'arrows_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->add_control(
            'arrows_bg_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Arrows background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'background: {{VALUE}};',
                ],
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->add_control(
            'heading_style_dots',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'separator' => 'before',
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->add_control(
            'dots_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots Position', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'outside',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'options' => [
                    'outside' => \IqitElementorTranslater::get()->l('Outside', 'elementor'),
                    'inside' => \IqitElementorTranslater::get()->l('Inside', 'elementor'),
                ],
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->add_control(
            'dots_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots Size', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'range' => [
                    'px' => [
                        'min' => 3,
                        'max' => 30,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination-bullet' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->add_control(
            'dots_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Dots Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-pagination .swiper-pagination-bullet' => 'background: {{VALUE}};',
                ],
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->add_control(
            'section_style_image',
            [
                'label' => \IqitElementorTranslater::get()->l('Image', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'image_spacing',
            [
                'label' => \IqitElementorTranslater::get()->l('Spacing', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'custom' => \IqitElementorTranslater::get()->l('Custom', 'elementor'),
                ],
                'default' => '',
                'condition' => [
                    'slides_to_show!' => '1',
                ],
            ]
        );

        $this->add_control(
            'image_spacing_custom',
            [
                'label' => \IqitElementorTranslater::get()->l('Image Spacing', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'range' => [
                    'px' => [
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'size' => 20,
                ],
                'show_label' => false,
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-carousel-wrapper' => 'margin-left: -{{SIZE}}{{UNIT}}; margin-right: -{{SIZE}}{{UNIT}}; padding-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .swiper-slide-inner' => 'padding: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'image_spacing' => 'custom',
                    'slides_to_show!' => '1',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'selector' => '{{WRAPPER}} .swiper-slide-image',
            ]
        );

        $this->add_control(
            'image_border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
    }

    protected function render($instance = [])
    {
        if (empty($instance['images_list'])) {
            return;
        }

        $slides = [];

        foreach ($instance['images_list'] as $item) {
            $image_url = $item['image']['url'];
            $image_width = $item['image']['width'] ? 'width="' . \IqitElementorHelper::absint($item['image']['width']) . '"' : '';
            $image_height = $item['image']['height'] ? 'height="' . \IqitElementorHelper::absint($item['image']['height']) . '"' : '';
            $image_placeholder = '';

            if ('yes' === $instance['image_lazy']) {
                $image_html = '<img class="swiper-slide-image" ' . $image_width . ' ' . $image_height . '  loading="lazy" src="' . \IqitElementorHelper::esc_attr(\IqitElementorHelper::getImage($image_url)) . '" alt="' . \IqitElementorHelper::esc_attr($item['text']) . '" />';
            } else {
                $image_html = '<img class="swiper-slide-image" ' . $image_width . ' ' . $image_height . ' src="' . \IqitElementorHelper::esc_attr(\IqitElementorHelper::getImage($image_url)) . '" alt="' . \IqitElementorHelper::esc_attr($item['text']) . '" />';
            }

            if (!empty($item['link']['url'])) {
                $target = $item['link']['is_external'] ? ' target="_blank" rel="noopener noreferrer"' : '';

                $image_html = sprintf('<a href="%s"%s>%s</a>', $item['link']['url'], $target, $image_html);
            }

            $slides[] = '<div class="swiper-slide"><div class="swiper-slide-inner">' . $image_html . '</div></div>';
        }

        if (empty($slides)) {
            return;
        }

        $is_slideshow = '1' === $instance['slides_to_show'];
        $show_dots = in_array($instance['navigation'], ['dots', 'both']);
        $show_arrows = in_array($instance['navigation'], ['arrows', 'both']);

        $swiper_options = [
            'slidesToShow' => \IqitElementorHelper::absint($instance['slides_to_show']),
            'slidesToShowTablet' => \IqitElementorHelper::absint($instance['slides_to_show_tablet']),
            'slidesToShowMobile' => \IqitElementorHelper::absint($instance['slides_to_show_mobile']),
            'autoplaySpeed' => \IqitElementorHelper::absint($instance['autoplay_speed']),
            'autoplay' => ('yes' === $instance['autoplay']),
            'loop' => ('yes' === $instance['infinite']),
            'disableOnInteraction' => ('yes' === $instance['pause_on_hover']),
            'speed' => \IqitElementorHelper::absint($instance['speed']),
            'lazy' => ('yes' === $instance['image_lazy']),
            'arrows' => $show_arrows,
            'dots' => $show_dots,
            'fade' => ($is_slideshow && ('fade' === $instance['effect']) ? true : false),
        ];

        $carousel_classes = ['elementor-image-carousel'];

        $cls_fix_classes[] = 'swiper-cls-fix';
        $cls_fix_classes[] = 'desktop-swiper-cls-fix-' . \IqitElementorHelper::absint($instance['slides_to_show']);
        $cls_fix_classes[] = 'tablet-swiper-cls-fix-' . \IqitElementorHelper::absint($instance['slides_to_show_tablet']);
        $cls_fix_classes[] = 'mobile-swiper-cls-fix-' . \IqitElementorHelper::absint($instance['slides_to_show_mobile']);

        if ($show_arrows) {
            $carousel_classes[] = 'swiper-arrows-' . $instance['arrows_position'];
        }

        if ('yes' === $instance['image_stretch']) {
            $carousel_classes[] = 'swiper-image-stretch';
        }
        ?>
		<div class="elementor-image-carousel-wrapper"  >
			<div class="<?php echo implode(' ', $carousel_classes); ?> swiper  <?php echo implode(' ', $cls_fix_classes); ?>" data-slider_options='<?php echo json_encode($swiper_options); ?>'>
                <div class="swiper-wrapper">
				<?php echo implode('', $slides); ?>
                </div>
                <?php if ($show_dots) { ?>
                    <div class="swiper-pagination elementor-swiper-pagination swiper-dots-<?php echo $instance['dots_position']; ?>"></div>
                <?php } ?>
                <?php if ($show_arrows) { ?>
                    <div class="swiper-button-prev swiper-button elementor-swiper-button elementor-swiper-button-prev"></div>
                    <div class="swiper-button-next swiper-button elementor-swiper-button elementor-swiper-button-next"></div>
                <?php } ?>
			</div>
		</div>
	<?php
    }

    protected function content_template()
    {
    }
}
