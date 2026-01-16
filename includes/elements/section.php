<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
}

class Element_Section extends Element_Base
{
    private static $presets = [];

    public function get_id()
    {
        return 'section';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Section');
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
                ['preset' => [33, 66]],
                ['preset' => [66, 33]],
            ],
            3 => [
                ['preset' => [25, 25, 50]],
                ['preset' => [50, 25, 25]],
                ['preset' => [25, 50, 25]],
                ['preset' => [16, 66, 16]],
            ],
        ];

        foreach (range(1, 10) as $columns_count) {
            self::$presets[$columns_count] = [['preset' => []]];

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
        $this->_register_layout_controls();
        $this->_register_background_controls();
        $this->_register_background_overlay_controls();
        $this->_register_border_controls();
        $this->_register_typography_controls();
        $this->_register_advanced_controls();
        $this->_register_responsive_controls();
    }

    /**
     * Register structure section controls.
     */
    private function _register_structure_controls()
    {
        $this->add_control(
            'structure',
            [
                'label' => \IqitElementorTranslater::get()->l('Structure'),
                'type' => Controls_Manager::STRUCTURE,
                'default' => '10',
            ]
        );
    }

    /**
     * Register layout section controls.
     */
    private function _register_layout_controls()
    {
        $this->start_controls_section(
            'section_layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Layout'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        // 1. Columns Gap
        $this->add_control(
            'gap',
            [
                'label' => \IqitElementorTranslater::get()->l('Columns Gap'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'no' => \IqitElementorTranslater::get()->l('No Gap'),
                    'narrow' => \IqitElementorTranslater::get()->l('Narrow'),
                    'default' => \IqitElementorTranslater::get()->l('Default'),
                    'extended' => \IqitElementorTranslater::get()->l('Extended'),
                    'wide' => \IqitElementorTranslater::get()->l('Wide'),
                    'wider' => \IqitElementorTranslater::get()->l('Wider'),
                ],
            ]
        );

        // 3. Content Width
        $this->add_control(
            'heading_dimensions',
            [
                'label' => \IqitElementorTranslater::get()->l('Dimensions'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Width'),
                'type' => Controls_Manager::SELECT,
                'default' => 'boxed',
                'options' => [
                    'boxed' => \IqitElementorTranslater::get()->l('Boxed'),
                    'full_width' => \IqitElementorTranslater::get()->l('Full Width'),
                ],
                'prefix_class' => 'elementor-section-',
            ]
        );

        $this->add_control(
            'content_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Width (px)'),
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
            ]
        );

        $this->add_control(
            'stretch_section',
            [
                'label' => \IqitElementorTranslater::get()->l('Stretch Section'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'return_value' => 'section-stretched',
                'prefix_class' => 'elementor-',
                'force_render' => true,
                'hide_in_inner' => true,
                'description' => \IqitElementorTranslater::get()->l('Stretch the section to the full width of the page.'),
            ]
        );

        // 4. Height - Top level sections
        $this->add_control(
            'height',
            [
                'label' => \IqitElementorTranslater::get()->l('Height'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default'),
                    'full' => \IqitElementorTranslater::get()->l('Fit To Screen'),
                    'min-height' => \IqitElementorTranslater::get()->l('Min Height'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_inner' => true,
            ]
        );

        $this->add_responsive_control(
            'custom_height',
            [
                'label' => \IqitElementorTranslater::get()->l('Minimum Height'),
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

        // 5. Height - Inner sections
        $this->add_control(
            'heading_height_inner',
            [
                'label' => \IqitElementorTranslater::get()->l('Height'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
                'hide_in_top' => true,
            ]
        );

        $this->add_control(
            'height_inner',
            [
                'label' => \IqitElementorTranslater::get()->l('Height'),
                'type' => Controls_Manager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Default'),
                    'min-height' => \IqitElementorTranslater::get()->l('Min Height'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_top' => true,
                'show_label' => false,
            ]
        );

        $this->add_control(
            'custom_height_inner',
            [
                'label' => \IqitElementorTranslater::get()->l('Minimum Height'),
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

        // 6. Vertical Alignment
        $this->add_control(
            'heading_alignment',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'column_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Vertical Align'),
                'type' => Controls_Manager::SELECT,
                'default' => 'middle',
                'options' => [
                    'top' => \IqitElementorTranslater::get()->l('Top'),
                    'middle' => \IqitElementorTranslater::get()->l('Middle'),
                    'bottom' => \IqitElementorTranslater::get()->l('Bottom'),
                    'space-between' => \IqitElementorTranslater::get()->l('Space between'),
                    'space-around' => \IqitElementorTranslater::get()->l('Space around'),
                    'space-evenly' => \IqitElementorTranslater::get()->l('Space evenly'),

                ],
                'prefix_class' => 'elementor-section-items-',
                'condition' => [
                    'height' => ['full', 'min-height'],
                ],
                'description' => \IqitElementorTranslater::get()->l('How columns are aligned vertically.'),
            ]
        );

        $this->add_control(
            'content_position',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Align'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default'),
                    'top' => \IqitElementorTranslater::get()->l('Top'),
                    'middle' => \IqitElementorTranslater::get()->l('Middle'),
                    'bottom' => \IqitElementorTranslater::get()->l('Bottom'),
                ],
                'prefix_class' => 'elementor-section-content-',
                'description' => \IqitElementorTranslater::get()->l('How content is aligned inside columns.'),
            ]
        );

        $this->_register_structure_controls();

        $this->end_controls_section();
    }

    /**
     * Register background section controls.
     */
    private function _register_background_controls()
    {
        $this->start_controls_section(
            'section_background',
            [
                'label' => \IqitElementorTranslater::get()->l('Background'),
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
    }

    /**
     * Register background overlay section controls.
     */
    private function _register_background_overlay_controls()
    {
        $this->start_controls_section(
            'background_overlay_section',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Overlay'),
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
                'label' => \IqitElementorTranslater::get()->l('Opacity'),
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
    }

    /**
     * Register border section controls.
     */
    private function _register_border_controls()
    {
        $this->start_controls_section(
            'section_border',
            [
                'label' => \IqitElementorTranslater::get()->l('Border'),
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
                'label' => \IqitElementorTranslater::get()->l('Border Radius'),
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
    }

    /**
     * Register typography section controls.
     */
    private function _register_typography_controls()
    {
        $this->start_controls_section(
            'section_typo',
            [
                'label' => \IqitElementorTranslater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'heading_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Heading Color'),
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
                'label' => \IqitElementorTranslater::get()->l('Text Color'),
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
                'label' => \IqitElementorTranslater::get()->l('Link Color'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container a' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'color_link_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Link Hover Color'),
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
                'label' => \IqitElementorTranslater::get()->l('Text Align'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorTranslater::get()->l('Center'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'text-align: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Register advanced section controls.
     */
    private function _register_advanced_controls()
    {
        $this->start_controls_section(
            'section_advanced',
            [
                'label' => \IqitElementorTranslater::get()->l('Advanced'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_responsive_control(
            'margin',
            [
                'label' => \IqitElementorTranslater::get()->l('Margin'),
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
                'label' => \IqitElementorTranslater::get()->l('Padding'),
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
                'label' => \IqitElementorTranslater::get()->l('Entrance Animation'),
                'type' => Controls_Manager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'label_block' => true,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'animation_duration',
            [
                'label' => \IqitElementorTranslater::get()->l('Animation Duration'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    'slow' => \IqitElementorTranslater::get()->l('Slow'),
                    '' => \IqitElementorTranslater::get()->l('Normal'),
                    'fast' => \IqitElementorTranslater::get()->l('Fast'),
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
                'label' => \IqitElementorTranslater::get()->l('CSS Classes'),
                'type' => Controls_Manager::TEXT,
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
                'title' => \IqitElementorTranslater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class'),
                'separator' => 'before',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Register responsive section controls.
     */
    private function _register_responsive_controls()
    {
        $this->start_controls_section(
            '_section_responsive',
            [
                'label' => \IqitElementorTranslater::get()->l('Responsive'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        // Column Order
        $this->add_control(
            'heading_column_order',
            [
                'label' => \IqitElementorTranslater::get()->l('Column Order'),
                'type' => Controls_Manager::HEADING,
            ]
        );

        $this->add_control(
            'reverse_order_tablet',
            [
                'label' => \IqitElementorTranslater::get()->l('Reverse Columns (Tablet)'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'return_value' => 'reverse-tablet',
            ]
        );

        $this->add_control(
            'reverse_order_mobile',
            [
                'label' => \IqitElementorTranslater::get()->l('Reverse Columns (Mobile)'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Yes'),
                'label_off' => \IqitElementorTranslater::get()->l('No'),
                'return_value' => 'reverse-mobile',
            ]
        );

        // Visibility
        $this->add_control(
            'heading_visibility',
            [
                'label' => \IqitElementorTranslater::get()->l('Visibility'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'responsive_description',
            [
                'raw' => \IqitElementorTranslater::get()->l('The visibility settings will only take effect on the live page, not in the editor.'),
                'type' => Controls_Manager::RAW_HTML,
                'classes' => 'elementor-control-descriptor',
            ]
        );

        $this->add_control(
            'hide_desktop',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Desktop'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide'),
                'label_off' => \IqitElementorTranslater::get()->l('Show'),
                'return_value' => 'hidden-desktop',
            ]
        );

        $this->add_control(
            'hide_tablet',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Tablet'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide'),
                'label_off' => \IqitElementorTranslater::get()->l('Show'),
                'return_value' => 'hidden-tablet',
            ]
        );

        $this->add_control(
            'hide_mobile',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Mobile'),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => \IqitElementorTranslater::get()->l('Hide'),
                'label_off' => \IqitElementorTranslater::get()->l('Show'),
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
                <ul class="elementor-editor-element-settings-list elementor-editor-section-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Drag Section'); ?>">
                            <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Section'); ?></span>
                            <i class="fa fa-grip-lines"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Duplicate'); ?>">
                            <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Duplicate Section'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-save">
                        <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Save'); ?>">
                            <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Save to Library'); ?></span>
                            <i class="fa fa-floppy-o"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Remove'); ?>">
                            <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Remove Section'); ?></span>
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
        <div class="elementor-background-video-container">
            <# if ( 'youtube'===settings.background_video_type ) { #>
                <# if ( videoID ) { #>
                <div class="elementor-background-video" data-video-id="{{ videoID }}"></div>
                <# } #>
            <# } else if ( settings.background_video_link_h && settings.background_video_link_h.url ) { #>
            <video class="elementor-background-video" src="{{ settings.background_video_link_h.url }}" autoplay loop muted></video>
            <# } #>
        </div>
        <# } #>
        <# } if ( -1 !== [ 'classic', 'gradient' ].indexOf( settings.background_overlay_background ) ) { #>
        <div class="elementor-background-overlay"></div>
        <# } #>
        <div class="elementor-container elementor-column-gap-{{ settings.gap }}" <# if ( settings.get_render_attribute_string ) { #>{{{ settings.get_render_attribute_string( 'wrapper' ) }}} <# } #>>
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
                            <div class="elementor-background-video-fallback elementor-hidden-desktop"></div>
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

        <div class="elementor-container elementor-column-gap-<?php echo \IqitElementorHelper::esc_attr($instance['gap']); ?>">
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
