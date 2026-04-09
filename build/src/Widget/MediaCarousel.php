<?php

namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\CarouselTrait;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class MediaCarousel extends WidgetBase
{
    use CarouselTrait;

    public function getId(): string
    {
        return 'media-carousel';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Media Carousel');
    }

    public function getIcon(): string
    {
        return 'slider-push';
    }

    public function getCategories(): array
    {
        return ['prestashop'];
    }

    protected function registerControls(): void
    {
        // ===== CONTENT: Slides =====
        $this->addControl(
            'section_slides',
            [
                'label' => Translater::get()->l('Slides'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'slides',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [],
                'section' => 'section_slides',
                'fields' => [
                    [
                        'name' => 'image',
                        'label' => Translater::get()->l('Image'),
                        'type' => ControlManager::MEDIA,
                        'label_block' => true,
                        'default' => [
                            'url' => Utils::getPlaceholderImageSrc(),
                        ],
                    ],
                    [
                        'name' => 'title',
                        'label' => Translater::get()->l('Title'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'default' => 'Slide title',
                    ],
                    [
                        'name' => 'content',
                        'label' => Translater::get()->l('Content'),
                        'type' => ControlManager::TEXTAREA,
                        'label_block' => true,
                        'default' => 'Slide description text',
                    ],
                    [
                        'name' => 'link',
                        'label' => Translater::get()->l('Link'),
                        'type' => ControlManager::URL,
                        'label_block' => true,
                        'placeholder' => 'http://your-link.com',
                    ],
                    [
                        'name' => 'link_text',
                        'label' => Translater::get()->l('Link text'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'default' => 'Read more',
                    ],
                ],
                'title_field' => 'title',
            ]
        );

        // ===== CONTENT: Carousel settings =====
        $this->addControl(
            'section_carousel_options',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->registerCarouselControls('section_carousel_options', [], [
            'slides_to_show' => 3,
            'slides_to_show_tablet' => 2,
            'slides_to_show_mobile' => 1,
        ]);

        // ===== STYLE: Card =====
        $this->addControl(
            'section_style_card',
            [
                'label' => Translater::get()->l('Card'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'text_alignment',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'default' => 'left',
                'section' => 'section_style_card',
                'tab' => 'style',
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
                'selectors' => [
                    '{{WRAPPER}} .media-card' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'card_background',
            [
                'label' => Translater::get()->l('Background color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'section' => 'section_style_card',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'card_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'section' => 'section_style_card',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'card_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_style_card',
                'tab' => 'style',
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .media-card' => 'border-radius: {{SIZE}}{{UNIT}}; overflow: hidden;',
                ],
            ]
        );

        // ===== STYLE: Image =====
        $this->addControl(
            'section_style_image',
            [
                'label' => Translater::get()->l('Image'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'image_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_style_image',
                'tab' => 'style',
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 200,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .media-card__image img' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'image_spacing',
            [
                'label' => Translater::get()->l('Spacing bottom'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_style_image',
                'tab' => 'style',
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 60,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .media-card__image' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // ===== STYLE: Title =====
        $this->addControl(
            'section_style_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'section' => 'section_style_title',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card__title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            'typography',
            [
                'name' => 'title_typography',
                'label' => Translater::get()->l('Typography'),
                'section' => 'section_style_title',
                'tab' => 'style',
                'selector' => '{{WRAPPER}} .media-card__title',
            ]
        );

        $this->addControl(
            'title_spacing',
            [
                'label' => Translater::get()->l('Spacing bottom'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_style_title',
                'tab' => 'style',
                'default' => [
                    'size' => 10,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 40,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .media-card__title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // ===== STYLE: Content =====
        $this->addControl(
            'section_style_content',
            [
                'label' => Translater::get()->l('Content'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'content_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'section' => 'section_style_content',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card__content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            'typography',
            [
                'name' => 'content_typography',
                'label' => Translater::get()->l('Typography'),
                'section' => 'section_style_content',
                'tab' => 'style',
                'selector' => '{{WRAPPER}} .media-card__content',
            ]
        );

        $this->addControl(
            'content_spacing',
            [
                'label' => Translater::get()->l('Spacing bottom'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_style_content',
                'tab' => 'style',
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 40,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .media-card__content' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        // ===== STYLE: Link =====
        $this->addControl(
            'section_style_link',
            [
                'label' => Translater::get()->l('Link'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'link_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'section' => 'section_style_link',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card__link' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'link_hover_color',
            [
                'label' => Translater::get()->l('Hover color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'section' => 'section_style_link',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .media-card__link:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            'typography',
            [
                'name' => 'link_typography',
                'label' => Translater::get()->l('Typography'),
                'section' => 'section_style_link',
                'tab' => 'style',
                'selector' => '{{WRAPPER}} .media-card__link',
            ]
        );

        // ===== STYLE: Carousel =====
        $this->addControl(
            'section_carousel_styles',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->registerCarouselStyles('section_carousel_styles');
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        $slides = [];
        if (!empty($optionsSource['slides'])) {
            foreach ($optionsSource['slides'] as $slide) {
                $linkUrl = '';
                $linkTarget = '_self';
                if (!empty($slide['link']['url'])) {
                    $linkUrl = $slide['link']['url'];
                }
                if (!empty($slide['link']['is_external'])) {
                    $linkTarget = '_blank';
                }

                $slides[] = [
                    'image' => !empty($slide['image']['url'])
                        ? Helper::getImage($slide['image']['url'])
                        : '',
                    'image_width' => !empty($slide['image']['width']) ? (int) $slide['image']['width'] : '',
                    'image_height' => !empty($slide['image']['height']) ? (int) $slide['image']['height'] : '',
                    'title' => isset($slide['title']) ? $slide['title'] : '',
                    'content' => isset($slide['content']) ? $slide['content'] : '',
                    'link_url' => $linkUrl,
                    'link_target' => $linkTarget,
                    'link_text' => isset($slide['link_text']) ? $slide['link_text'] : '',
                ];
            }
        }

        $widgetOptions = [
            'slides' => $slides,
        ];

        $widgetOptions = array_merge(
            $widgetOptions,
            $this->buildCarouselOptions($optionsSource)
        );

        return $widgetOptions;
    }

    public function getTemplatePath(): string
    {
        return 'module:iqitelementor/views/templates/widgets/mediacarousel.tpl';
    }
}
