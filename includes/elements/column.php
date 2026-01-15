<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Element_Column extends Element_Base
{
    public function get_id()
    {
        return 'column';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Column', 'elementor');
    }

    public function get_icon()
    {
        return 'columns';
    }

    private function add_width_controls(string $device = null)
    {
        $this->add_control(
            'width_auto'.($device ? "_$device" : ''),
            [
                'label' => \IqitElementorTranslater::get()->l('Auto Width'),
                'type' => Controls_Manager::SWITCHER,
                'description' => \IqitElementorTranslater::get()->l('Column width will be defined by its content width.'),
                /*'selectors' => [
                    '{{WRAPPER}}' => 'width: auto !important; flex: 0 0 auto;',
                ],*/
                'prefix_class' => 'col'.($device ? "-$device" : '').'-auto-',
                'condition' => [
                    'width_dynamic'.($device ? "_$device" : '').'!' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'width_dynamic'.($device ? "_$device" : ''),
            [
                'label' => \IqitElementorTranslater::get()->l('Dynamic Width'),
                'type' => Controls_Manager::SWITCHER,
                'description' => \IqitElementorTranslater::get()->l('The column will fill the remaining space in the row.'),
                /*'selectors' => [
                    '{{WRAPPER}}' => 'width: 100% !important; max-width: 100%; flex: 1 0 0; min-width: 0;',
                ],*/
                'prefix_class' => 'col'.($device ? "-$device" : '').'-dynamic-',
                'condition' => [
                    'width_auto'.($device ? "_$device" : '').'!' => 'yes',
                ],
            ]
        );

        $this->add_control(
            'width'.($device ? "_$device" : ''),
            [
                'label' => \IqitElementorTranslater::get()->l('Column Width') . ' (%)',
                'type' => Controls_Manager::NUMBER,
                'min' => 2,
                'max' => 98,
                'required' => true,
                'device_args' => [
                    'tablet' => [
                        'max' => 100,
                        'required' => false,
                    ],
                    'mobile' => [
                        'max' => 100,
                        'required' => false,
                    ],
                ],
                'min_affected_device' => [
                    'desktop' => 'tablet',
                    'tablet'=> 'tablet',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'width: {{VALUE}}%',
                ],
                'condition' => [
                    'width_auto'.($device ? "_$device" : '').'!' => 'yes',
                    'width_dynamic'.($device ? "_$device" : '').'!' => 'yes',
                ],
            ]
        );
    }

    protected function _register_controls()
    {

        // Section Layout.
        $this->start_controls_section(
            'layout',
            [
                'label' => \IqitElementorTranslater::get()->l('Layout'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        $this->start_controls_tabs('column_size_tabs');

        $this->start_controls_tab('column_size_desktop_tab', ['label' => \IqitElementorTranslater::get()->l('Desktop')]);
        $this->add_width_controls();
        $this->end_controls_tab();

        $this->start_controls_tab('column_size_tablet_tab', ['label' => \IqitElementorTranslater::get()->l('Tablet')]);
        $this->add_width_controls('tablet');
        $this->end_controls_tab();

        $this->start_controls_tab('column_size_mobile_tab', ['label' => \IqitElementorTranslater::get()->l('Mobile')]);
        $this->add_width_controls('mobile');
        $this->end_controls_tab();

        $this->end_controls_tabs();

        /*$this->add_responsive_control(
            'align',
            [
                'label' => \IqitElementorTranslater::get()->l('Horizontal Align'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default'),
                    'flex-start' => \IqitElementorTranslater::get()->l('Start'),
                    'center' => \IqitElementorTranslater::get()->l('Center'),
                    'flex-end' => \IqitElementorTranslater::get()->l('End'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-column > .elementor-column-wrap > .elementor-widget-wrap' => 'align-items: {{VALUE}}',
                ],
            ]
        );*/

        $this->add_control(
            'layout_vertical',
            [
                'label' => \IqitElementorTranslater::get()->l('Vertical behavior'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            'row_gap',
            [
                'label' => \IqitElementorTranslater::get()->l('Widgets Space') . ' (px)',
                'type' => Controls_Manager::NUMBER,
                'placeholder' => 20,
                'selectors' => [
                    // Need the full path for exclude the inner section
                    '{{WRAPPER}} > .elementor-column-wrap > .elementor-widget-wrap' => 'row-gap: {{VALUE}}px',
                ],
            ]
        );

        $this->add_control(
            'layout_horizontal',
            [
                'label' => \IqitElementorTranslater::get()->l('Horizontal behavior'),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => \IqitElementorTranslater::get()->l('Horizontal Align'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default'),
                    'flex-start' => \IqitElementorTranslater::get()->l('Start'),
                    'center' => \IqitElementorTranslater::get()->l('Center'),
                    'flex-end' => \IqitElementorTranslater::get()->l('End'),
                    'space-between' => \IqitElementorTranslater::get()->l('Space Between'),
                    'space-around' => \IqitElementorTranslater::get()->l('Space Around'),
                    'space-evenly' => \IqitElementorTranslater::get()->l('Space Evenly'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-column > .elementor-column-wrap > .elementor-widget-wrap' => 'justify-content: {{VALUE}}',
                ],
            ]
        );

        $this->add_responsive_control(
            'column_gap',
            [
                'label' => \IqitElementorTranslater::get()->l('Widgets Space') . ' (px)',
                'type' => Controls_Manager::NUMBER,
                'placeholder' => 20,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-column-wrap > .elementor-widget-wrap' => 'column-gap: {{VALUE}}px',
                ],
            ]
        );

        $this->end_controls_section();

        $this->add_control(
            'section_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Background & Border', 'elementor'),
                'tab' => self::TAB_STYLE,
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'background',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} > .elementor-column-wrap',
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'selector' => '{{WRAPPER}} > .elementor-element-populated',
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'box_shadow',
                'section' => 'section_style',
                'tab' => self::TAB_STYLE,
                'selector' => '{{WRAPPER}} > .elementor-element-populated',
            ]
        );

        // Section Typography
        $this->add_control(
            'section_typo',
            [
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'tab' => self::TAB_STYLE,
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'heading_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Heading Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_typo',
            ]
        );

        $this->add_control(
            'color_text',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'color_link',
            [
                'label' => \IqitElementorTranslater::get()->l('Link Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated a' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'color_link_hover',
            [
                'label' => \IqitElementorTranslater::get()->l('Link Hover Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated a:hover' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'text_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Align', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_typo',
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
                    '{{WRAPPER}} > .elementor-element-populated' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        // Section Advanced
        $this->add_control(
            'section_advanced',
            [
                'label' => \IqitElementorTranslater::get()->l('Advanced', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_responsive_control(
            'margin',
            [
                'label' => \IqitElementorTranslater::get()->l('Margin', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Padding', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
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
                'tab' => self::TAB_ADVANCED,
                'label_block' => true,
                'section' => 'section_advanced',
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
                'tab' => self::TAB_ADVANCED,
                'section' => 'section_advanced',
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
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
                'title' => \IqitElementorTranslater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class', 'elementor'),
            ]
        );

        $this->add_control(
            'z_index',
            [
                'label' => \IqitElementorTranslater::get()->l('Z-index', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'min' => 0,
                'default' => '',
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'z-index: {{VALUE}};',
                ],
            ]
        );

        // Section Responsive
        $this->add_control(
            'section_responsive',
            [
                'label' => \IqitElementorTranslater::get()->l('Responsive', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $responsive_points = [
            'screen_sm' => [
                'title' => \IqitElementorTranslater::get()->l('Mobile Width', 'elementor'),
                'class_prefix' => 'elementor-sm-',
                'classes' => '',
                'description' => '',
            ],
            'screen_md' => [
                'title' => \IqitElementorTranslater::get()->l('Tablet Width', 'elementor'),
                'class_prefix' => 'elementor-md-',
                'classes' => '',
                'description' => '',
            ],
        ];

        foreach ($responsive_points as $point_name => $point_data) {
            $this->add_control(
                $point_name,
                [
                    'label' => $point_data['title'],
                    'type' => Controls_Manager::SELECT,
                    'section' => 'section_responsive',
                    'default' => 'default',
                    'options' => [
                        'default' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                        'custom' => \IqitElementorTranslater::get()->l('Custom', 'elementor'),
                    ],
                    'tab' => self::TAB_ADVANCED,
                    'description' => $point_data['description'],
                    'classes' => $point_data['classes'],
                ]
            );

            $this->add_control(
                $point_name . '_width',
                [
                    'label' => \IqitElementorTranslater::get()->l('Column Width', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'section' => 'section_responsive',
                    'options' => [
                        '10' => '10%',
                        '11' => '11%',
                        '12' => '12%',
                        '14' => '14%',
                        '16' => '16%',
                        '20' => '20%',
                        '25' => '25%',
                        '30' => '30%',
                        '33' => '33%',
                        '40' => '40%',
                        '50' => '50%',
                        '60' => '60%',
                        '66' => '66%',
                        '70' => '70%',
                        '75' => '75%',
                        '80' => '80%',
                        '83' => '83%',
                        '90' => '90%',
                        '100' => '100%',
                    ],
                    'default' => '100',
                    'tab' => self::TAB_ADVANCED,
                    'condition' => [
                        $point_name => ['custom'],
                    ],
                    'prefix_class' => $point_data['class_prefix'],
                ]
            );
        }
    }

    protected function render_settings()
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="column-title"></div>
            <div class="elementor-editor-element-settings elementor-editor-column-settings">
                <ul class="elementor-editor-element-settings-list elementor-editor-column-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Drag Column', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Column', 'elementor'); ?></span>
                            <i class="fa fa-columns"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Duplicate Column', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Duplicate', 'elementor'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-add">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Add New Column', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Add', 'elementor'); ?></span>
                            <i class="fa fa-plus"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php \IqitElementorTranslater::get()->l('Remove Column', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorTranslater::get()->l('Remove', 'elementor'); ?></span>
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
        <div class="elementor-column-wrap">
            <div class="elementor-widget-wrap"></div>
        </div>
        <?php
    }

    public function before_render($instance, $element_id, $element_data = [])
    {
        $column_type = !empty($element_data['isInner']) ? 'inner' : 'top';

        $this->add_render_attribute('wrapper', 'class', [
            'elementor-column',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-col-' . $instance['_column_size'],
            'elementor-' . $column_type . '-column',
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
        <div class="elementor-column-wrap<?php if (!empty($element_data['elements'])) {
        echo ' elementor-element-populated';
    } ?>">
        <div class="elementor-widget-wrap">
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
}
