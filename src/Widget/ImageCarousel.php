<?php
namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Core\Utils;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\LinkAttributesHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\CarouselTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageCarousel extends WidgetBase
{
    use CarouselTrait;

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
        // ===== CONTENT: Images =====
        $this->startControlsSection(
            'section_image_carousel',
            [
                'label' => Translater::get()->l('Images list'),
            ]
        );

        $this->addControl(
            'images_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [],
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
            'image_lazy',
            [
                'label' => Translater::get()->l('Lazy load'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'yes',
                'default' => 'yes',
            ]
        );

        $this->addControl(
            'image_stretch',
            [
                'label' => Translater::get()->l('Image Stretch'),
                'description' => Translater::get()->l('Force images to fill the slide width.'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'yes',
                'default' => '',
            ]
        );

        $this->endControlsSection();

        // ===== CONTENT: Carousel =====
        $this->startControlsSection(
            'section_carousel_options',
            [
                'label' => Translater::get()->l('Carousel'),
            ]
        );

        $this->registerCarouselControls('section_carousel_options', [], [
            'slides_to_show' => 3,
            'slides_to_show_tablet' => 2,
            'slides_to_show_mobile' => 1,
        ]);

        $this->endControlsSection();

        // ===== STYLE: Image =====
        $this->startControlsSection(
            'section_style_image',
            [
                'label' => Translater::get()->l('Image'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'image_border',
                'selector' => '{{WRAPPER}} .swiper-slide-image',
            ]
        );

        $this->addControl(
            'image_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->endControlsSection();

        // ===== STYLE: Carousel =====
        $this->startControlsSection(
            'section_carousel_styles',
            [
                'label' => Translater::get()->l('Carousel'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerCarouselStyles('section_carousel_styles');

        $this->endControlsSection();
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        $slides = [];
        if (!empty($optionsSource['images_list'])) {
            $lazy = isset($optionsSource['image_lazy']) && 'yes' === $optionsSource['image_lazy'];
            foreach ($optionsSource['images_list'] as $item) {
                $imageUrl = !empty($item['image']['url']) ? $item['image']['url'] : '';
                if ($imageUrl === '') {
                    continue;
                }

                $linkUrl = !empty($item['link']['url']) ? $item['link']['url'] : '';
                $linkAttributes = !empty($item['link'])
                    ? LinkAttributesHelper::getAttributesHtml($item['link'])
                    : '';

                $slides[] = [
                    'image' => Helper::getImage($imageUrl),
                    'image_width' => !empty($item['image']['width']) ? (int) $item['image']['width'] : '',
                    'image_height' => !empty($item['image']['height']) ? (int) $item['image']['height'] : '',
                    'alt' => isset($item['text']) ? (string) $item['text'] : '',
                    'lazy' => $lazy,
                    'link_url' => $linkUrl,
                    'link_attributes' => $linkAttributes,
                ];
            }
        }

        $widgetOptions = [
            'slides' => $slides,
            'image_stretch' => isset($optionsSource['image_stretch']) && 'yes' === $optionsSource['image_stretch'],
        ];

        return array_merge(
            $widgetOptions,
            $this->buildCarouselOptions($optionsSource)
        );
    }

    public function getTemplatePath(): string
    {
        return 'module:iqitelementor/views/templates/widgets/imagecarousel.tpl';
    }

    protected function contentTemplate(): void
    {
    }
}
