<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Image_Gallery extends Widget_Base
{
    public function get_id()
    {
        return 'image-gallery';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Image Gallery', 'elementor');
    }

    public function get_icon()
    {
        return 'gallery-grid';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_gallery',
            [
                'label' => \IqitElementorTranslater::get()->l('Image Gallery', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'images_list',
            [
                'label' => '',
                'type' => Controls_Manager::REPEATER,
                'default' => [],
                'section' => 'section_gallery',
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

        $gallery_columns = range(1, 10);
        $gallery_columns = array_combine($gallery_columns, $gallery_columns);

        $this->add_control(
            'gallery_columns',
            [
                'label' => \IqitElementorTranslater::get()->l('Columns', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 4,
                'options' => $gallery_columns,
                'section' => 'section_gallery',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_gallery',
            ]
        );

        $this->add_control(
            'section_gallery_images',
            [
                'label' => \IqitElementorTranslater::get()->l('Images', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'image_spacing',
            [
                'label' => \IqitElementorTranslater::get()->l('Spacing', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_gallery_images',
                'tab' => self::TAB_STYLE,
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'custom' => \IqitElementorTranslater::get()->l('Custom', 'elementor'),
                ],
                'prefix_class' => 'gallery-spacing-',
                'default' => '',
            ]
        );

        $columns_margin = \IqitElementorHelper::is_rtl() ? '0 0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}};' : '0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}} 0;';
        $columns_padding = \IqitElementorHelper::is_rtl() ? '0 0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}};' : '0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}} 0;';

        $this->add_control(
            'image_spacing_custom',
            [
                'label' => \IqitElementorTranslater::get()->l('Image Spacing', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'label' => \IqitElementorTranslater::get()->l('Image Border', 'elementor'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_gallery_images',
                'selector' => '{{WRAPPER}} .gallery-item img',
            ]
        );

        $this->add_control(
            'image_border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_gallery_images',
                'selectors' => [
                    '{{WRAPPER}} .gallery-item img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'section_caption',
            [
                'label' => \IqitElementorTranslater::get()->l('Caption', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'gallery_display_caption',
            [
                'label' => \IqitElementorTranslater::get()->l('Display', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_caption',
                'tab' => self::TAB_STYLE,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                    'none' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .gallery-item .gallery-caption' => 'display: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_caption',
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorTranslater::get()->l('Center', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
                        'icon' => 'fa fa-align-right',
                    ],
                    'justify' => [
                        'title' => \IqitElementorTranslater::get()->l('Justified', 'elementor'),
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

        $this->add_control(
            'text_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
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

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'scheme' => Scheme_Typography::TYPOGRAPHY_4,
                'tab' => self::TAB_STYLE,
                'section' => 'section_caption',
                'selector' => '{{WRAPPER}} .gallery-item .gallery-caption',
                'condition' => [
                    'gallery_display_caption' => '',
                ],
            ]
        );
    }

    protected function render($instance = [])
    {
        return;
    }

    protected function content_template()
    {
    }
}
