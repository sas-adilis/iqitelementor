<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Control\Media;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\CarouselTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Testimonial extends WidgetBase
{

    use CarouselTrait;

    public function getId(): string
    {
        return 'testimonial';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Testimonial');
    }

    public function getIcon(): string
    {
        return 'testimonial-carousel';
    }

    protected function registerControls(): void
    {


        $this->startControlsSection(
            'section_testimonial',
            [
                'label' => Translater::get()->l('Testimonial'),
            ]
        );

        $this->addControl(
            'testimonials_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [],
                'fields' => [
                    [
                        'name' => 'name',
                        'label' => Translater::get()->l('Name'),
                        'type' => ControlManager::TEXT,
                        'default' => 'John Doe',
                    ],
                    [
                        'label' => Translater::get()->l('Content'),
                        'type' => ControlManager::WYSIWYG,
                        'rows' => '10',
                        'name' => 'content',
                        'default' => 'Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.',
                    ],
                    [
                        'label' => Translater::get()->l('Note'),
                        'type' => ControlManager::SELECT,
                        'name' => 'note',
                        'options' => [
                            '5' => '5 ' . Translater::get()->l('Stars'),
                            '4' => '4 ' . Translater::get()->l('Stars'),
                            '3' => '3 ' . Translater::get()->l('Stars'),
                            '2' => '2 ' . Translater::get()->l('Stars'),
                            '1' => '1 ' . Translater::get()->l('Star'),
                        ],
                        'default' => '5',
                    ]
                ],
                'title_field' => 'name',
            ]
        );

        $this->addControl(
            'testimonial_notes',
            [
                'label' => Translater::get()->l('Show Notes'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->addControl(
            'testimonial_alignment',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'default' => 'center',
                'section' => 'section_additional_options',
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
                ],
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            'section_carousel_options',
            [
                'label' => Translater::get()->l('Carousel'),
            ]
        );

        $this->registerCarouselControls('section_carousel_options', [], ['slides_to_show' => 1]);

        $this->endControlsSection();

        // Box
        $this->startControlsSection(
            'section_style_testimonial_box',
            [
                'label' => Translater::get()->l('Testimonial box'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'note_color',
            [
                'label' => Translater::get()->l('Note Color'),
                'type' => ControlManager::COLOR,
                'separator' => 'after',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-name svg' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'background_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'separator' => 'after',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'testimonial_border',
                'label' => Translater::get()->l('Border'),
                'selector' => '{{WRAPPER}} .elementor-testimonial-wrapper',
            ]
        );

        $this->addControl(
            'testimonial_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'testimonial_padding',
            [
                'label' => Translater::get()->l('Box padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'testimonial_margin',
            [
                'label' => Translater::get()->l('Box Margin'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-wrapper' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => 'testimonial_box_shadow',
                'section' => 'section_style_testimonial_box',
                'selector' => '{{WRAPPER}} .elementor-testimonial-wrapper',
            ]
        );

        $this->endControlsSection();

        // Content
        $this->startControlsSection(
            'section_style_content',
            [
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'section_style_content_content',
            [
                'label' => Translater::get()->l('Content'),
                'type' => ControlManager::HEADING,
            ]
        );

        $this->addControl(
            'content_content_color',
            [
                'label' => Translater::get()->l('Content Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'content_typography',
                'label' => Translater::get()->l('Typography'),
                'selector' => '{{WRAPPER}} .elementor-testimonial-content',
            ]
        );

        $this->addControl(
            'section_style_content_name',
            [
                'label' => Translater::get()->l('Name'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'name_text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-testimonial-name' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'name_typography',
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_testimonial_name',
                'selector' => '{{WRAPPER}} .elementor-testimonial-name',
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            'section_carousel_styles',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE
            ]
        );

        $this->registerCarouselStyles('section_carousel_styles');

        $this->endControlsSection();
    }
/*
    protected function render(array $instance = []): void
    {
        if (empty($instance['testimonials_list'])) {
            return;
        }

        $is_slideshow = '1' === $instance['slides_to_show'];
        $show_dots = in_array($instance['navigation'], ['dots', 'both']);
        $show_arrows = in_array($instance['navigation'], ['arrows', 'both']);

        $swiper_options = [
            'slidesToShow' => Helper::absint($instance['slides_to_show']),
            'autoplaySpeed' => Helper::absint($instance['autoplay_speed']),
            'autoplay' => ('yes' === $instance['autoplay']),
            'loop' => ('yes' === $instance['infinite']),
            'disableOnInteraction' => ('yes' === $instance['pause_on_hover']),
            'speed' => Helper::absint($instance['speed']),
            'arrows' => $show_arrows,
            'dots' => $show_dots,
            'fade' => ($is_slideshow && ('fade' === $instance['effect']) ? true : false),
        ];

        $carousel_classes = ['elementor-testimonial-carousel'];

        $cls_fix_classes[] = 'swiper-cls-fix';
        $cls_fix_classes[] = 'desktop-swiper-cls-fix-' . Helper::absint($instance['slides_to_show']);
        $cls_fix_classes[] = 'tablet-swiper-cls-fix-' . ((1 == Helper::absint($instance['slides_to_show'])) ? 1 : 2);
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
                                    $image_width = $item['image']['width'] ? 'width="' . Helper::absint($item['image']['width']) . '"' : '';
                                    $image_height = $item['image']['height'] ? 'height="' . Helper::absint($item['image']['height']) . '"' : '';
                                    $has_image = ' elementor-has-image';
                                }
                                ?>

                                <div class="elementor-testimonial-wrapper<?php echo $testimonial_alignment; ?>">

                                    <?php if (isset($image_url) && $instance['testimonial_image_position'] == 'top') { ?>
                                        <div class="elementor-testimonial-meta<?php if ($has_image) {
                                            echo $has_image;
                                        } ?><?php echo $testimonial_image_position; ?>">
                                            <div class="elementor-testimonial-image">
                                                <img src="<?php echo Helper::escAttr($image_url); ?>" <?php echo $image_width . ' ' . $image_height; ?> alt="<?php echo Helper::escAttr(Media::getImageAlt($item['image'])); ?>"/>
                                            </div>
                                        </div>
                                    <?php } ?>

                                    <?php if (!empty($item['content'])) { ?>
                                        <div class="elementor-testimonial-content">
                                            <?php echo $this->parseTextEditor($item['content'], $item); ?>
                                        </div>
                                    <?php } ?>

                                    <div class="elementor-testimonial-meta<?php if ($has_image) {
                                        echo $has_image;
                                    } ?><?php echo $testimonial_image_position; ?>">
                                        <div class="elementor-testimonial-meta-inner">
                                            <?php if (isset($image_url) && $instance['testimonial_image_position'] == 'aside') { ?>
                                                <div class="elementor-testimonial-image">
                                                    <img src="<?php echo Helper::escAttr($image_url); ?>" <?php echo $image_width . ' ' . $image_height; ?> alt="<?php echo Helper::escAttr(Media::getImageAlt($item['image'])); ?>"/>
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

    protected function contentTemplate(): void
    {
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
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
            $this->buildCarouselOptions($optionsSource)
        );
    }
}
