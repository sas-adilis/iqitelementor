<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Element_Section extends Element_Base
{
    use IqitElementorCarouselTrait;

    private static $presets = [];

    public function get_id()
    {
        return 'section';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Section', 'elementor');
    }

    public function get_icon()
    {
        return 'columns';
    }

    public static function get_presets($columns_count = null, $preset_index = null)
    {
        if (!self::$presets) {
            self::init_presets();
        }

        $presets = self::$presets;

        if (null !== $columns_count) {
            $presets = $presets[$columns_count];
        }

        if (null !== $preset_index) {
            $presets = $presets[$preset_index];
        }

        return $presets;
    }

    public static function init_presets()
    {
        $additional_presets = [
            2 => [
                [
                    'preset' => [33, 66],
                ],
                [
                    'preset' => [66, 33],
                ],
            ],
            3 => [
                [
                    'preset' => [25, 25, 50],
                ],
                [
                    'preset' => [50, 25, 25],
                ],
                [
                    'preset' => [25, 50, 25],
                ],
                [
                    'preset' => [16, 66, 16],
                ],
            ],
        ];

        foreach (range(1, 10) as $columns_count) {
            self::$presets[$columns_count] = [
                [
                    'preset' => [],
                ],
            ];

            $preset_unit = floor(1 / $columns_count * 100);

            for ($i = 0; $i < $columns_count; ++$i) {
                self::$presets[$columns_count][0]['preset'][] = $preset_unit;
            }

            if (!empty($additional_presets[$columns_count])) {
                self::$presets[$columns_count] = array_merge(self::$presets[$columns_count], $additional_presets[$columns_count]);
            }

            foreach (self::$presets[$columns_count] as $preset_index => &$preset) {
                $preset['key'] = $columns_count . $preset_index;
            }
        }
    }

    public function get_data()
    {
        $data = parent::get_data();

        $data['presets'] = self::get_presets();

        return $data;
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Layout', 'elementor'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        $this->add_control(
            'stretch_section',
            [
                'label' => \IqitElementorTranslater::get()->l('Stretch Section', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'section-stretched',
                'prefix_class' => 'elementor-',
                'force_render' => true,
                'hide_in_inner' => true,
                'description' => \IqitElementorTranslater::get()->l('Stretch the section to the full width of the page using JS.', 'elementor') . sprintf(' <a href="%s" target="_blank">%s</a>', 'https://go.elementor.com/stretch-section/', \IqitElementorTranslater::get()->l('Learn more.', 'elementor')),
            ]
        );

        $this->add_control(
            'layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Width', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'boxed',
                'options' => [
                    'boxed' => \IqitElementorTranslater::get()->l('Boxed', 'elementor'),
                    'full_width' => \IqitElementorTranslater::get()->l('Full Width', 'elementor'),
                ],
                'prefix_class' => 'elementor-section-',
            ]
        );

        $this->add_control(
            'content_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 500,
                        'max' => 1600,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'layout' => ['boxed'],
                ],
                'show_label' => false,
                'separator' => 'none',
            ]
        );

        $this->add_control(
            'gap',
            [
                'label' => \IqitElementorTranslater::get()->l('Columns Gap', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'no' => \IqitElementorTranslater::get()->l('No Gap', 'elementor'),
                    'narrow' => \IqitElementorTranslater::get()->l('Narrow', 'elementor'),
                    'extended' => \IqitElementorTranslater::get()->l('Extended', 'elementor'),
                    'wide' => \IqitElementorTranslater::get()->l('Wide', 'elementor'),
                    'wider' => \IqitElementorTranslater::get()->l('Wider', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'height',
            [
                'label' => \IqitElementorTranslater::get()->l('Height', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'full' => \IqitElementorTranslater::get()->l('Fit To Screen', 'elementor'),
                    'min-height' => \IqitElementorTranslater::get()->l('Min Height', 'elementor'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_inner' => true,
            ]
        );

        $this->add_responsive_control(
            'custom_height',
            [
                'label' => \IqitElementorTranslater::get()->l('Minimum Height', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'default' => [
                    'size' => 400,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1440,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'height' => ['min-height'],
                ],
                'hide_in_inner' => true,
            ]
        );

        $this->add_control(
            'height_inner',
            [
                'label' => \IqitElementorTranslater::get()->l('Height', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'min-height' => \IqitElementorTranslater::get()->l('Min Height', 'elementor'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_top' => true,
            ]
        );

        $this->add_control(
            'custom_height_inner',
            [
                'label' => \IqitElementorTranslater::get()->l('Minimum Height', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'default' => [
                    'size' => 400,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1440,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'height_inner' => ['min-height'],
                ],
                'hide_in_top' => true,
            ]
        );

        $this->add_control(
            'column_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Column Position', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'middle',
                'options' => [
                    'stretch' => \IqitElementorTranslater::get()->l('Stretch', 'elementor'),
                    'top' => \IqitElementorTranslater::get()->l('Top', 'elementor'),
                    'middle' => \IqitElementorTranslater::get()->l('Middle', 'elementor'),
                    'bottom' => \IqitElementorTranslater::get()->l('Bottom', 'elementor'),
                ],
                'prefix_class' => 'elementor-section-items-',
                'condition' => [
                    'height' => ['full', 'min-height'],
                ],
            ]
        );

        $this->add_control(
            'content_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Position', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'top' => \IqitElementorTranslater::get()->l('Top', 'elementor'),
                    'middle' => \IqitElementorTranslater::get()->l('Middle', 'elementor'),
                    'bottom' => \IqitElementorTranslater::get()->l('Bottom', 'elementor'),
                ],
                'prefix_class' => 'elementor-section-content-',
            ]
        );


        $this->add_control(
            'slider_section',
            [
                'label' => \IqitElementorTranslater::get()->l('As slider', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'section-slidered',
                'prefix_class' => 'elementor-',
                'force_render' => true,
                'hide_in_inner' => true,
                'description' => \IqitElementorTranslater::get()->l('Section will be showed as slider/carousel on frontend. On backed it wll be showed as normal section with one column per row for easier editing and yellow border', 'elementor'),
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            'section_slider_settings',
            [
                'label' => \IqitElementorTranslater::get()->l('Slider Settings', 'elementor'),
                'tab' => self::TAB_LAYOUT,
                'condition' => [
                    'slider_section' => 'section-slidered',
                ],
            ]
        );

        $this->register_carousel_controls('section_slider_settings', [
            'slider_section' => 'section-slidered',
        ]);

        $this->add_control(
            'structure',
            [
                'label' => \IqitElementorTranslater::get()->l('Structure', 'elementor'),
                'type' => Controls_Manager::STRUCTURE,
                'default' => '10',
                'condition' => [
                    'slider_section!' => 'section-slidered',
                ],
            ]
        );

        $this->end_controls_section();

        // Section background
        $this->start_controls_section(
            'section_background',
            [
                'label' => \IqitElementorTranslater::get()->l('Background', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'background',
                'types' => ['classic', 'gradient', 'video'],
            ]
        );

        $this->end_controls_section();

        // Background Overlay
        $this->start_controls_section(
            'background_overlay_section',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Overlay', 'elementor'),
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'background_background' => ['classic', 'gradient', 'video'],
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'background_overlay',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} > .elementor-background-overlay',
                'condition' => [
                    'background_background' => ['classic', 'gradient', 'video'],
                ],
            ]
        );

        $this->add_control(
            'background_overlay_opacity',
            [
                'label' => \IqitElementorTranslater::get()->l('Opacity (%)', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'default' => [
                    'size' => .5,
                ],
                'range' => [
                    'px' => [
                        'max' => 1,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-background-overlay' => 'opacity: {{SIZE}};',
                ],
                'condition' => [
                    'background_overlay_background' => ['classic', 'gradient'],
                ],
            ]
        );

        $this->end_controls_section();

        // Section border
        $this->start_controls_section(
            'section_border',
            [
                'label' => \IqitElementorTranslater::get()->l('Border', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'border',
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}}, {{WRAPPER}} > .elementor-background-overlay' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'box_shadow',
            ]
        );

        $this->end_controls_section();

        // Section Typography
        $this->start_controls_section(
            'section_typo',
            [
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'heading_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Heading Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container .elementor-heading-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'color_text',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'color_link',
            [
                'label' => \IqitElementorTranslater::get()->l('Link Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container a' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_typo',
            ]
        );

        $this->add_control(
            'color_link_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Link Hover Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container a:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'text_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Align', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
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
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Section Advanced
        $this->start_controls_section(
            'section_carousel_styles',
            [
                'label' => \IqitElementorTranslater::get()->l('Carousel', 'elementor'),
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'slider_section' => 'section-slidered',
                ],
            ]
        );

        $this->register_carousel_styles('section_carousel_styles', [
            'slider_section' => 'section-slidered',
        ]);

        $this->end_controls_section();

        // Section Advanced
        $this->start_controls_section(
            'section_advanced',
            [
                'label' => \IqitElementorTranslater::get()->l('Advanced', 'elementor'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_responsive_control(
            'margin',
            [
                'label' => \IqitElementorTranslater::get()->l('Margin', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'allowed_dimensions' => 'vertical',
                'placeholder' => [
                    'top' => '',
                    'right' => 'auto',
                    'bottom' => '',
                    'left' => 'auto',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'margin-top: {{TOP}}{{UNIT}}; margin-bottom: {{BOTTOM}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Padding', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}}' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'animation',
            [
                'label' => \IqitElementorTranslater::get()->l('Entrance Animation', 'elementor'),
                'type' => Controls_Manager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'label_block' => true,
            ]
        );

        $this->add_control(
            'animation_duration',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation Duration', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    'slow' => \IqitElementorTranslater::get()->l('Slow', 'elementor'),
                    '' => \IqitElementorTranslater::get()->l('Normal', 'elementor'),
                    'fast' => \IqitElementorTranslater::get()->l('Fast', 'elementor'),
                ],
                'prefix_class' => 'animated-',
                'condition' => [
                    'animation!' => '',
                ],
            ]
        );

        $this->add_control(
            'css_classes',
            [
                'label' => \IqitElementorTranslater::get()->l('CSS Classes', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
                'title' => \IqitElementorTranslater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class', 'elementor'),
            ]
        );

        $this->end_controls_section();

        // Section Responsive
        $this->start_controls_section(
            '_section_responsive',
            [
                'label' => \IqitElementorTranslater::get()->l('Responsive', 'elementor'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'reverse_order_tablet',
            [
                'label' => \IqitElementorTranslater::get()->l('Reverse Columns (Tablet)', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'reverse-tablet',
                'description' => \IqitElementorTranslater::get()->l('Reverse column order - When on tablet, the column order is reversed, so the last column appears on top and vice versa.', 'elementor'),
            ]
        );



        $this->add_control(
            'reverse_order_mobile',
            [
                'label' => \IqitElementorTranslater::get()->l('Reverse Columns (Mobile)', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Yes', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'return_value' => 'reverse-mobile',
                'description' => \IqitElementorTranslater::get()->l('Reverse column order - When on mobile, the column order is reversed, so the last column appears on top and vice versa.', 'elementor'),
            ]
        );

        $this->add_control(
            'heading_visibility',
            [
                'label' => \IqitElementorTranslater::get()->l('Visibility', 'elementor'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'responsive_description',
            [
                'raw' => \IqitElementorTranslater::get()->l('Attention: The display settings (show/hide for mobile, tablet or desktop) will only take effect once you are on the preview or live page, and not while you\'re in editing mode in Elementor.', 'elementor'),
                'type' => Controls_Manager::RAW_HTML,
                'classes' => 'elementor-control-descriptor',
            ]
        );

        $this->add_control(
            'hide_desktop',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Desktop', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                'return_value' => 'hidden-desktop',
            ]
        );

        $this->add_control(
            'hide_tablet',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Tablet', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                'return_value' => 'hidden-tablet',
            ]
        );

        $this->add_control(
            'hide_mobile',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Mobile', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                'label_off' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                'return_value' => 'hidden-phone',
            ]
        );

        $this->end_controls_section();
    }

    protected function render_settings()
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="section-title"></div>
            <div class="elementor-editor-element-settings elementor-editor-section-settings">
                <ul class="elementor-editor-element-settings-list  elementor-editor-section-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Drag Section', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Section', 'elementor'); ?></span>
                            <i class="fa fa-grip-lines"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Duplicate', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Duplicate Section', 'elementor'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-save">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Save', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Save to Library', 'elementor'); ?></span>
                            <i class="fa fa-floppy-o"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Remove', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Remove Section', 'elementor'); ?></span>
                            <i class="fa fa-times"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php
    }

    protected function content_template()
    {
        ?>
        <# if ( 'video'===settings.background_background ) { var videoLink=settings.background_video_link; if ( videoLink ) { var videoID=elementor.helpers.getYoutubeIDFromURL( settings.background_video_link ); #>

        <div class="elementor-background-video-container ">
            <# if ( 'youtube'===settings.background_video_type ) { #>
            <# if ( videoID ) { #>
            <div class="elementor-background-video" data-video-id="{{ videoID }}"></div>
            <# } #>
            <# } else if ( settings.background_video_link_h && settings.background_video_link_h.url ) { #>
            <video class="elementor-background-video" src="{{ settings.background_video_link_h.url }}" autoplay loop muted></video>
            <# } #>
        </div>
        <# }#>


        <# } if ( -1 !==[ 'classic' , 'gradient' ].indexOf( settings.background_overlay_background ) ) { #>
        <div class="elementor-background-overlay"></div>
        <# } #>
        <div class="elementor-container elementor-column-gap-{{ settings.gap }}" <# if ( settings.get_render_attribute_string ) { #>{{{ settings.get_render_attribute_string( 'wrapper' ) }}} <# } #> >
        <div class="elementor-row"></div>
        </div>
        <?php
    }

    public function before_render($instance, $element_id, $element_data = [])
    {
        $section_type = !empty($element_data['isInner']) ? 'inner' : 'top';

        $this->add_render_attribute('wrapper', 'class', [
            'elementor-section',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-' . $section_type . '-section',
        ]);

        foreach ($this->get_class_controls() as $control) {
            if (empty($instance[$control['name']])) {
                continue;
            }

            if (!$this->is_control_visible($instance, $control)) {
                continue;
            }

            $this->add_render_attribute('wrapper', 'class', $control['prefix_class'] . $instance[$control['name']]);
        }

        if (!empty($instance['animation'])) {
            $this->add_render_attribute('wrapper', 'data-animation', $instance['animation']);
        }

        $this->add_render_attribute('wrapper', 'data-element_type', $this->get_id());
        ?>
        <div <?php echo $this->get_render_attribute_string('wrapper'); ?>>
        <?php
        if ('video' === $instance['background_background']) {
            if ($instance['background_video_link']) {
                $video_id = UtilsElementor::get_youtube_id_from_url($instance['background_video_link']);
                ?>
                <div class="elementor-background-video-container">
                    <?php if ('youtube' === $instance['background_video_type']) { ?>
                        <?php if ($video_id) { ?>
                            <div class="elementor-background-video-fallback elementor-hidden-desktop "></div>
                            <div class="elementor-background-video" data-video-id="<?php echo $video_id; ?>"></div>
                        <?php } ?>
                    <?php } else { ?>
                        <?php if (!empty($instance['background_video_link_h']['url'])) { ?>
                            <video class="elementor-background-video elementor-html5-video" src="<?php echo $instance['background_video_link_h']['url']; ?>" autoplay loop muted playsinline></video>
                        <?php } ?>
                    <?php } ?>
                </div>
            <?php }
        }

        if (in_array($instance['background_overlay_background'], ['classic', 'gradient'])) { ?>
            <div class="elementor-background-overlay"></div>
        <?php } ?>


        <div class="elementor-container  elementor-column-gap-<?php echo \IqitElementorHelper::esc_attr($instance['gap']); ?>">
        <div class="elementor-row">
        <?php
    }

    public function after_render($instance, $element_id, $element_data = [])
    {
        ?>
        </div>
        </div>
        </div>
        <?php
    }

    public function before_render_column($instance, $element_id, $element_data = [])
    {
    }

    public function after_render_column($instance, $element_id, $element_data = [])
    {
    }
}
