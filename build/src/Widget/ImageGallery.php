<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageGallery extends WidgetBase
{
    public function getId(): string
    {
        return 'image-gallery';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Image Gallery');
    }

    public function getIcon(): string
    {
        return 'gallery-grid';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_gallery',
            [
                'label' => Translater::get()->l('Image Gallery'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'images_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [],
                'section' => 'section_gallery',
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

        $gallery_columns = range(1, 10);
        $gallery_columns = array_combine($gallery_columns, $gallery_columns);

        $this->addControl(
            'gallery_columns',
            [
                'label' => Translater::get()->l('Columns'),
                'type' => ControlManager::SELECT,
                'default' => 4,
                'options' => $gallery_columns,
                'section' => 'section_gallery',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_gallery',
            ]
        );

        $this->addControl(
            'section_gallery_images',
            [
                'label' => Translater::get()->l('Images'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'image_spacing',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SELECT,
                'section' => 'section_gallery_images',
                'tab' => self::TAB_STYLE,
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'custom' => Translater::get()->l('Custom'),
                ],
                'prefix_class' => 'gallery-spacing-',
                'default' => '',
            ]
        );

        $columns_margin = Helper::isRtl() ? '0 0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}};' : '0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}} 0;';
        $columns_padding = Helper::isRtl() ? '0 0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}};' : '0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}} 0;';

        $this->addControl(
            'image_spacing_custom',
            [
                'label' => Translater::get()->l('Image Spacing'),
                'type' => ControlManager::SLIDER,
                'section' => 'section_gallery_images',
                'tab' => self::TAB_STYLE,
                'show_label' => false,
                'range' => [
                    'px' => [
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'size' => 15,
                ],
                'selectors' => [
                    '{{WRAPPER}} .gallery-item' => 'padding:' . $columns_padding,
                    '{{WRAPPER}} .gallery' => 'margin: ' . $columns_margin,
                ],
                'condition' => [
                    'image_spacing' => 'custom',
                ],
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'image_border',
                'label' => Translater::get()->l('Image Border'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_gallery_images',
                'selector' => '{{WRAPPER}} .gallery-item img',
            ]
        );

        $this->addControl(
            'image_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_gallery_images',
                'selectors' => [
                    '{{WRAPPER}} .gallery-item img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'section_caption',
            [
                'label' => Translater::get()->l('Caption'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'gallery_display_caption',
            [
                'label' => Translater::get()->l('Display'),
                'type' => ControlManager::SELECT,
                'section' => 'section_caption',
                'tab' => self::TAB_STYLE,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('Show'),
                    'none' => Translater::get()->l('Hide'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .gallery-item .gallery-caption' => 'display: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_caption',
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
                    'justify' => [
                        'title' => Translater::get()->l('Justified'),
                        'icon' => 'fa fa-align-justify',
                    ],
                ],
                'default' => 'center',
                'selectors' => [
                    '{{WRAPPER}} .gallery-item .gallery-caption' => 'text-align: {{VALUE}};',
                ],
                'condition' => [
                    'gallery_display_caption' => '',
                ],
            ]
        );

        $this->addControl(
            'text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_caption',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .gallery-item .gallery-caption' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'gallery_display_caption' => '',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'typography',
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_caption',
                'selector' => '{{WRAPPER}} .gallery-item .gallery-caption',
                'condition' => [
                    'gallery_display_caption' => '',
                ],
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        return;
    }

    protected function contentTemplate(): void
    {
    }
}
