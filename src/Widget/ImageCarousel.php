<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageCarousel extends WidgetBase
{
    public function getId(): string
    {
        return 'image-carousel';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Image Carousel');
    }

    public function getIcon(): string
    {
        return 'slider-push';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_image_carousel',
            [
                'label' => Translater::get()->l('Images list'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'images_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [],
                'section' => 'section_image_carousel',
                'fields' => [
                    [
                        'name' => 'text',
                        'label' => Translater::get()->l('Image alt'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('Image alt'),
                        'default' => Translater::get()->l('Image alt'),
                    ],
                    [
                        'name' => 'image',
                        'label' => Translater::get()->l('Choose Image'),
                        'type' => ControlManager::MEDIA,
                        'placeholder' => Translater::get()->l('Image'),
                        'label_block' => true,
                        'default' => [
                            'url' => Utils::getPlaceholderImageSrc(),
                        ],
                    ],
                    [
                        'name' => 'link',
                        'label' => Translater::get()->l('Link'),
                        'type' => ControlManager::URL,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('http://your-link.com'),
                    ],
                ],
                'title_field' => 'text',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_image_carousel',
            ]
        );

        $this->addControl(
            'section_additional_options',
            [
                'label' => Translater::get()->l('Carousel settings'),
                'type' => ControlManager::SECTION,
            ]
        );

        $slides_to_show = range(1, 10);
        $slides_to_show = array_combine($slides_to_show, $slides_to_show);

        $this->addResponsiveControl(
            'slides_to_show',
            [
                'label' => Translater::get()->l('Slides to Show'),
                'type' => ControlManager::SELECT,
                'default' => '3',
                'section' => 'section_additional_options',
                'options' => $slides_to_show,
            ]
        );

        $this->addControl(
            'image_stretch',
            [
                'label' => Translater::get()->l('Image Stretch'),
                'type' => ControlManager::SELECT,
                'default' => 'no',
                'section' => 'section_additional_options',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
            ]
        );
        $this->addControl(
            'image_lazy',
            [
                'label' => Translater::get()->l('Lazy load'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
            ]
        );

        $this->addControl(
            'navigation',
            [
                'label' => Translater::get()->l('Navigation'),
                'type' => ControlManager::SELECT,
                'default' => 'both',
                'section' => 'section_additional_options',
                'options' => [
                    'both' => Translater::get()->l('Arrows and Dots'),
                    'arrows' => Translater::get()->l('Arrows'),
                    'dots' => Translater::get()->l('Dots'),
                    'none' => Translater::get()->l('None'),
                ],
            ]
        );

        $this->addControl(
            'autoplay',
            [
                'label' => Translater::get()->l('Autoplay'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'yes' => Translater::get()->l('Yes'),
                    'no' => Translater::get()->l('No'),
                ],
            ]
        );
        $this->addControl(
            'pause_on_hover',
            [
                'label' => Translater::get()->l('Pause on hover'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'condition' => [
                    'autoplay' => 'yes',
                ],
                'options' => [
                    'yes' => Translater::get()->l('Yes'),
                    'no' => Translater::get()->l('No'),
                ],
            ]
        );

        $this->addControl(
            'autoplay_speed',
            [
                'label' => Translater::get()->l('Autoplay Speed'),
                'type' => ControlManager::NUMBER,
                'default' => 5000,
                'condition' => [
                    'autoplay' => 'yes',
                ],
                'section' => 'section_additional_options',
            ]
        );

        $this->addControl(
            'infinite',
            [
                'label' => Translater::get()->l('Infinite Loop'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'section' => 'section_additional_options',
                'options' => [
                    'yes' => Translater::get()->l('Yes'),
                    'no' => Translater::get()->l('No'),
                ],
            ]
        );

        $this->addControl(
            'effect',
            [
                'label' => Translater::get()->l('Effect'),
                'type' => ControlManager::SELECT,
                'default' => 'slide',
                'section' => 'section_additional_options',
                'options' => [
                    'slide' => Translater::get()->l('Slide'),
                    'fade' => Translater::get()->l('Fade'),
                ],
                'condition' => [
                    'slides_to_show' => '1',
                ],
            ]
        );

        $this->addControl(
            'speed',
            [
                'label' => Translater::get()->l('Animation Speed'),
                'type' => ControlManager::NUMBER,
                'default' => 500,
                'section' => 'section_additional_options',
            ]
        );

        $this->addControl(
            'section_style_navigation',
            [
                'label' => Translater::get()->l('Navigation'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'navigation' => ['arrows', 'dots', 'both'],
                ],
            ]
        );

        $this->addControl(
            'heading_style_arrows',
            [
                'label' => Translater::get()->l('Arrows'),
                'type' => ControlManager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'separator' => 'before',
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->addControl(
            'arrows_position',
            [
                'label' => Translater::get()->l('Arrows Position'),
                'type' => ControlManager::SELECT,
                'default' => 'inside',
                'section' => 'section_style_navigation',
                'tab' => self::TAB_STYLE,
                'options' => [
                    'inside' => Translater::get()->l('Inside'),
                    'outside' => Translater::get()->l('Outside'),
                ],
                'condition' => [
                    'navigation' => ['arrows', 'both'],
                ],
            ]
        );

        $this->addControl(
            'arrows_size',
            [
                'label' => Translater::get()->l('Arrows Size'),
                'type' => ControlManager::SLIDER,
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

        $this->addControl(
            'arrows_color',
            [
                'label' => Translater::get()->l('Arrows Color'),
                'type' => ControlManager::COLOR,
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

        $this->addControl(
            'arrows_bg_color',
            [
                'label' => Translater::get()->l('Arrows background'),
                'type' => ControlManager::COLOR,
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

        $this->addControl(
            'heading_style_dots',
            [
                'label' => Translater::get()->l('Dots'),
                'type' => ControlManager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'separator' => 'before',
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->addControl(
            'dots_position',
            [
                'label' => Translater::get()->l('Dots Position'),
                'type' => ControlManager::SELECT,
                'default' => 'outside',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_navigation',
                'options' => [
                    'outside' => Translater::get()->l('Outside'),
                    'inside' => Translater::get()->l('Inside'),
                ],
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
            ]
        );

        $this->addControl(
            'dots_size',
            [
                'label' => Translater::get()->l('Dots Size'),
                'type' => ControlManager::SLIDER,
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

        $this->addControl(
            'dots_color',
            [
                'label' => Translater::get()->l('Dots Color'),
                'type' => ControlManager::COLOR,
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

        $this->addControl(
            'section_style_image',
            [
                'label' => Translater::get()->l('Image'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'image_spacing',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SELECT,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'custom' => Translater::get()->l('Custom'),
                ],
                'default' => '',
                'condition' => [
                    'slides_to_show!' => '1',
                ],
            ]
        );

        $this->addControl(
            'image_spacing_custom',
            [
                'label' => Translater::get()->l('Image Spacing'),
                'type' => ControlManager::SLIDER,
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

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'image_border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'selector' => '{{WRAPPER}} .swiper-slide-image',
            ]
        );

        $this->addControl(
            'image_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        if (empty($instance['images_list'])) {
            return;
        }

        $slides = [];

        foreach ($instance['images_list'] as $item) {
            $image_url = $item['image']['url'];
            $image_width = $item['image']['width'] ? 'width="' . Helper::absint($item['image']['width']) . '"' : '';
            $image_height = $item['image']['height'] ? 'height="' . Helper::absint($item['image']['height']) . '"' : '';
            $image_placeholder = '';

            if ('yes' === $instance['image_lazy']) {
                $image_html = '<img class="swiper-slide-image" ' . $image_width . ' ' . $image_height . '  loading="lazy" src="' . Helper::escAttr(Helper::getImage($image_url)) . '" alt="' . Helper::escAttr($item['text']) . '" />';
            } else {
                $image_html = '<img class="swiper-slide-image" ' . $image_width . ' ' . $image_height . ' src="' . Helper::escAttr(Helper::getImage($image_url)) . '" alt="' . Helper::escAttr($item['text']) . '" />';
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
            'slidesToShow' => Helper::absint($instance['slides_to_show']),
            'slidesToShowTablet' => Helper::absint($instance['slides_to_show_tablet']),
            'slidesToShowMobile' => Helper::absint($instance['slides_to_show_mobile']),
            'autoplaySpeed' => Helper::absint($instance['autoplay_speed']),
            'autoplay' => ('yes' === $instance['autoplay']),
            'loop' => ('yes' === $instance['infinite']),
            'disableOnInteraction' => ('yes' === $instance['pause_on_hover']),
            'speed' => Helper::absint($instance['speed']),
            'lazy' => ('yes' === $instance['image_lazy']),
            'arrows' => $show_arrows,
            'dots' => $show_dots,
            'fade' => ($is_slideshow && ('fade' === $instance['effect']) ? true : false),
        ];

        $carousel_classes = ['elementor-image-carousel'];

        $cls_fix_classes[] = 'swiper-cls-fix';
        $cls_fix_classes[] = 'desktop-swiper-cls-fix-' . Helper::absint($instance['slides_to_show']);
        $cls_fix_classes[] = 'tablet-swiper-cls-fix-' . Helper::absint($instance['slides_to_show_tablet']);
        $cls_fix_classes[] = 'mobile-swiper-cls-fix-' . Helper::absint($instance['slides_to_show_mobile']);

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

    protected function contentTemplate(): void
    {
    }
}
