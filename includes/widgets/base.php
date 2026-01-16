<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

abstract class Widget_Base extends Element_Base
{
    public function get_type()
    {
        return 'widget';
    }

    public function get_icon()
    {
        return 'font';
    }

    public function get_short_title()
    {
        return $this->get_title();
    }

    public function parse_text_editor($content, $instance = [])
    {
        return $content;
    }

    protected function _after_register_controls()
    {
        parent::_after_register_controls();

        $this->start_controls_section(
            '_section_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Layout', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_responsive_control(
            '_margin',
            [
                'label' => \IqitElementorTranslater::get()->l('Margin', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            '_padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Padding', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            '_element_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Width'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default'),
                    'auto' => \IqitElementorTranslater::get()->l('Inline') . ' (auto)',
                    'initial' => \IqitElementorTranslater::get()->l('Custom'),
                ]
            ]
        );

        $this->add_responsive_control(
            '_element_custom_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Custom Width'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 1000,
                        'step' => 1,
                    ],
                ],
                'condition' => [
                    '_element_width' => 'initial',
                ],
                'device_args' => [
                    'tablet' => [
                        'condition' => [
                            '_element_width_tablet' => 'initial',
                        ],
                    ],
                    'mobile' => [
                        'condition' => [
                            '_element_width_mobile' => 'initial',
                        ],
                    ],
                ],
                'size_units' => ['px', '%', 'vw'],
                'selectors' => [
                    '{{WRAPPER}}' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            '_element_max_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Max Width'),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 1000,
                        'step' => 1,
                    ],
                ],
                'device_args' => [
                    'tablet' => [
                        'condition' => [
                            '_element_width_tablet' => 'initial',
                        ],
                    ],
                    'mobile' => [
                        'condition' => [
                            '_element_width_mobile' => 'initial',
                        ],
                    ],
                ],
                'size_units' => ['px', '%', 'vw'],
                'selectors' => [
                    '{{WRAPPER}}' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            '_flex_order',
            [
                'label' => \IqitElementorTranslater::get()->l('Order'),
                'type' => Controls_Manager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'start' => [
                        'title' => \IqitElementorTranslater::get()->l('Start'),
                        'icon' => 'eicon-v-align-top',
                    ],
                    'end' => [
                        'title' => \IqitElementorTranslater::get()->l('End'),
                        'icon' => 'eicon-v-align-bottom',
                    ],
                    'custom' => [
                        'title' => \IqitElementorTranslater::get()->l('Custom'),
                        'icon' => 'eicon-ellipsis-v',
                    ],
                ],
                'selectors_dictionary' => [
                    'start' => 'order: -99999;',
                    'end' => 'order: 99999;',
                    'custom' => '',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => '{{VALUE}}',
                ],
                'separator' => 'before',
            ]
        );

        $this->add_responsive_control(
            '_flex_order_custom',
            [
                'label' => \IqitElementorTranslater::get()->l('Custom Order'),
                'type' => Controls_Manager::NUMBER,
                'condition' => [
                    '_flex_order' => 'custom',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'order: {{VALUE}};',
                ],
            ]
        );



        $this->add_control(
            '_z_index',
            [
                'label' => \IqitElementorTranslater::get()->l('Z-index', 'elementor'),
                'type' => Controls_Manager::NUMBER,
                'min' => 0,
                'default' => '',
                'section' => '_section_style',
                'tab' => self::TAB_ADVANCED,
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}}' => 'z-index: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            '_element_id',
            [
                'label' => \IqitElementorTranslater::get()->l('CSS ID'),
                'type' => Controls_Manager::TEXT,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'title' => \IqitElementorTranslater::get()->l('Add your custom id WITHOUT the Pound key. e.g: my-id'),
                'style_transfer' => false,
            ]
        );

        $this->add_control(
            '_css_classes',
            [
                'label' => \IqitElementorTranslater::get()->l('CSS Classes', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'default' => '',
                'prefix_class' => '',
                'label_block' => false,
                'title' => \IqitElementorTranslater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class', 'elementor'),
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            '_section_animation_entrance',
            [
                'label' => \IqitElementorTranslater::get()->l('Entrance Animation', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );



        $this->add_control(
            '_animation',
            [
                'label' => \IqitElementorTranslater::get()->l('Entrance Animation', 'elementor'),
                'type' => Controls_Manager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'tab' => self::TAB_ADVANCED,
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
                'tab' => self::TAB_ADVANCED,
                'condition' => [
                    '_animation!' => '',
                ],
            ]
        );

        $this->end_controls_section();

        $this->start_controls_section(
            '_section_advanced_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Advanced Style', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => '_background',
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->add_control(
            '_section_border',
            [
                'label' => \IqitElementorTranslater::get()->l('Border', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => '_border',
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->add_responsive_control(
            '_border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            '_section_box_shadow',
            [
                'label' => \IqitElementorTranslater::get()->l('Box shadow', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => '_box_shadow',
                'section' => '_section_background',
                'tab' => self::TAB_ADVANCED,
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->add_control(
            '_section_responsive',
            [
                'label' => \IqitElementorTranslater::get()->l('Responsive', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->add_control(
            'responsive_description',
            [
                'raw' => \IqitElementorTranslater::get()->l('Attention: The display settings (show/hide for mobile, tablet or desktop) will only take effect once you are on the preview or live page, and not while you\'re in editing mode in Elementor.', 'elementor'),
                'type' => Controls_Manager::RAW_HTML,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'classes' => 'elementor-control-descriptor',
            ]
        );

        $this->add_control(
            'hide_desktop',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Desktop', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-desktop',
            ]
        );

        $this->add_control(
            'hide_tablet',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Tablet', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-tablet',
            ]
        );

        $this->add_control(
            'hide_mobile',
            [
                'label' => \IqitElementorTranslater::get()->l('Hide On Mobile', 'elementor'),
                'type' => Controls_Manager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-phone',
            ]
        );
    }

    final public function print_template()
    {
        ob_start();
        $this->content_template();
        $content_template = ob_get_clean();

        if (empty($content_template)) {
            return;
        }
        ?>
        <script type="text/html" id="tmpl-elementor-<?php echo $this->get_type(); ?>-<?php echo \IqitElementorHelper::esc_attr($this->get_id()); ?>-content">
            <?php $this->render_settings(); ?>
            <div class="elementor-widget-container">
                <?php echo $content_template; ?>
            </div>
        </script>
        <?php
    }

    public function render_content($instance)
    {
        if (PluginElementor::instance()->editor->is_edit_mode()) {
            $this->render_settings();
        }
        ?>
        <div class="elementor-widget-container">
            <?php
            ob_start();
        $this->render($instance);
        $content = ob_get_clean();

        echo $content;
        ?>
        </div>
        <?php
    }

    public function render_plain_content($instance = [])
    {
        $this->render_content($instance);
    }

    protected function render_settings()
    {
        ?>
        <div class="elementor-editor-element-settings elementor-editor-<?php echo \IqitElementorHelper::esc_attr($this->get_type()); ?>-settings elementor-editor-<?php echo \IqitElementorHelper::esc_attr($this->get_id()); ?>-settings" data-title="<?php echo \IqitElementorHelper::esc_attr($this->get_title()); ?>">
            <ul class="elementor-editor-element-settings-list">
                <li class="elementor-editor-element-setting elementor-editor-element-edit">
                    <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Edit', 'elementor'); ?>">
                        <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Edit', 'elementor'); ?></span>
                        <i class="fa fa-pencil"></i>
                    </a>
                </li>
                <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                    <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Duplicate', 'elementor'); ?>">
                        <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Duplicate', 'elementor'); ?></span>
                        <i class="fa fa-copy"></i>
                    </a>
                </li>
                <li class="elementor-editor-element-setting elementor-editor-element-remove">
                    <a href="#" title="<?php echo \IqitElementorTranslater::get()->l('Remove', 'elementor'); ?>">
                        <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Remove', 'elementor'); ?></span>
                        <i class="fa fa-times"></i>
                    </a>
                </li>
            </ul>
        </div>
        <?php
    }

    public function before_render($instance, $element_id, $element_data = [])
    {
        $this->add_render_attribute('wrapper', 'class', [
            'elementor-widget',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-widget-' . $this->get_id(),
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

        if (!empty($instance['_animation'])) {
            $this->add_render_attribute('wrapper', 'data-animation', $instance['_animation']);
        }

        $this->add_render_attribute('wrapper', 'data-element_type', $this->get_id());
        ?>
    <div <?php echo $this->get_render_attribute_string('wrapper'); ?>>
        <?php
    }

    public function after_render($instance, $element_id, $element_data = [])
    {
        ?>
    </div>
    <?php
    }

    protected function render($instance = [])
    {
        $options = $this->get_parse_values($instance);
        if (PluginElementor::instance()->editor->is_edit_mode()) {
            echo \IqitElementorHelper::renderIqitElementorWidgetPreview($this->get_id(), $options);
        } else {
            echo \IqitElementorHelper::renderIqitElementorWidget($this->get_id(), $options);
        }
    }

    public function parse_options($optionsSource, $preview = false)
    {
        return $optionsSource;
    }

    protected function content_template()
    {
        // TODO: Implement content_template() method.
    }
}

