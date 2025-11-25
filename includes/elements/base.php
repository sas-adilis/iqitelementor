<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

abstract class Element_Base
{
    public const TAB_CONTENT = 'content';
    public const TAB_STYLE = 'style';
    public const TAB_ADVANCED = 'advanced';
    public const TAB_RESPONSIVE = 'responsive';
    public const TAB_LAYOUT = 'layout';

    public const RESPONSIVE_DESKTOP = 'desktop';
    public const RESPONSIVE_TABLET = 'tablet';
    public const RESPONSIVE_MOBILE = 'mobile';

    private static $_available_tabs_controls;

    private $_controls = [];
    private $_tabs_controls = [];

    private $_render_attributes = [];

    /**
     * Holds the current section while render a set of controls sections
     *
     * @var array|null
     */
    private $_current_section;

    /**
     * Current tab.
     *
     * Holds the current tab while inserting a set of controls tabs.
     *
     * @var array|null
     */
    private $current_tab;

    abstract public function get_id();

    abstract public function get_title();

    abstract protected function _register_controls();

    // TODO: Need to change this to abstract type
    // abstract protected function render( $instance );
    public function before_render($instance, $element_id, $element_data = [])
    {
    }

    protected function render($instance)
    {
    }

    public function after_render($instance, $element_id, $element_data = [])
    {
    }

    abstract protected function content_template();

    public function get_keywords()
    {
        return '';
    }

    public function get_categories()
    {
        return ['basic'];
    }

    private static function _get_available_tabs_controls()
    {
        if (!self::$_available_tabs_controls) {
            self::$_available_tabs_controls = [
                self::TAB_CONTENT => \IqitElementorWpHelper::__('Content', 'elementor'),
                self::TAB_STYLE => \IqitElementorWpHelper::__('Style', 'elementor'),
                self::TAB_ADVANCED => \IqitElementorWpHelper::__('Advanced', 'elementor'),
                self::TAB_RESPONSIVE => \IqitElementorWpHelper::__('Responsive', 'elementor'),
                self::TAB_LAYOUT => \IqitElementorWpHelper::__('Layout', 'elementor'),
            ];
        }

        return self::$_available_tabs_controls;
    }

    public function get_tabs_controls()
    {
        return $this->_tabs_controls;
    }

    public function get_type()
    {
        return 'element';
    }

    public function get_icon()
    {
        return 'columns';
    }

    protected function render_settings()
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="elementor-editor-element-settings elementor-editor-<?php echo \IqitElementorWpHelper::esc_attr($this->get_type()); ?>-settings elementor-editor-<?php echo \IqitElementorWpHelper::esc_attr($this->get_id()); ?>-settings">
                <ul class="elementor-editor-element-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-add">
                        <a href="#" title="<?php \IqitElementorWpHelper::_e('Add Widget', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorWpHelper::_e('Add', 'elementor'); ?></span>
                            <i class="fa fa-plus"></i>
                        </a>
                    </li>
                    <?php /* Temp removing for better UI
                    <li class="elementor-editor-element-setting elementor-editor-element-edit">
                        <a href="#" title="<?php \IqitElementorWpHelper::_e( 'Edit Widget', 'elementor' ); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorWpHelper::_e( 'Edit', 'elementor' ); ?></span>
                            <i class="fa fa-pencil"></i>
                        </a>
                    </li>
                    */ ?>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php \IqitElementorWpHelper::_e('Duplicate Widget', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorWpHelper::_e('Duplicate', 'elementor'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php \IqitElementorWpHelper::_e('Remove Widget', 'elementor'); ?>">
                            <span class="elementor-screen-only"><?php \IqitElementorWpHelper::_e('Remove', 'elementor'); ?></span>
                            <i class="fa fa-trash-o"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php
    }

    public function add_group_control($group_name, $args = [])
    {
        switch ($group_name) {
            case 'background':
                $control = new Group_Control_Background();
                $control->add_controls($this, $args);

                return;
            case 'border':
                $control = new Group_Control_Border();
                $control->add_controls($this, $args);

                return;
            case 'typography':
                $control = new Group_Control_Typography();
                $control->add_controls($this, $args);

                return;
            case 'image-size':
                $control = new Group_Control_Image_Size();
                $control->add_controls($this, $args);

                return;
            case 'box-shadow':
                $control = new Group_Control_Box_Shadow();
                $control->add_controls($this, $args);

                return;

            case 'image':
                $control = new Group_Control_Image();
                $control->add_controls($this, $args);

                return;
        }
    }

    public function add_responsive_control($id, $args = [])
    {
        // Desktop
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '');
        }

        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['desktop'];
        }

        $control_args['responsive'] = self::RESPONSIVE_DESKTOP;
        $this->add_control(
            $id,
            $control_args
        );

        // Tablet
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '-' . self::RESPONSIVE_TABLET);
        }
        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['tablet'];
        }

        $control_args['responsive'] = self::RESPONSIVE_TABLET;
        $this->add_control(
            $id . '_tablet',
            $control_args
        );

        // Mobile
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '-' . self::RESPONSIVE_MOBILE);
        }

        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['mobile'];
        }

        $control_args['responsive'] = self::RESPONSIVE_MOBILE;
        $this->add_control(
            $id . '_mobile',
            $control_args
        );
    }

    /**
     * Helper method to get std value on all items.
     *
     * @return array default std's
     */
    protected function _get_default_values()
    {
        $defaults = [];

        foreach ($this->get_controls() as $control) {
            $defaults[$control['name']] = $control['default'];
        }

        return $defaults;
    }

    public function get_parse_values($instance = [])
    {
        foreach ($this->get_controls() as $control) {
            $control_obj = PluginElementor::instance()->controls_manager->get_control($control['type']);
            if (!$control_obj) {
                continue;
            }

            $instance[$control['name']] = $control_obj->get_value($control, $instance);
        }

        return $instance;
    }

    public function get_data()
    {
        return [
            'title' => $this->get_title(),
            'controls' => $this->get_controls(),
            'tabs_controls' => $this->get_tabs_controls(),
            'categories' => $this->get_categories(),
            'keywords' => $this->get_keywords(),
            'icon' => $this->get_icon(),
        ];
    }

    public function add_control($id, $args)
    {
        $default_args = [
            'default' => '',
            'type' => Controls_Manager::TEXT,
            'tab' => self::TAB_CONTENT,
            'save_empty_value' => false
        ];

        $args['name'] = $id;
        $args = array_merge($default_args, $args);

        if (isset($this->_controls[$id])) {
            \IqitElementorWpHelper::_doing_it_wrong(__CLASS__ . '::' . __FUNCTION__, 'Cannot redeclare control with same name. - ' . $id, '1.0.0');

            return false;
        }

        if (!in_array($args['type'], [Controls_Manager::SECTION, Controls_Manager::WP_WIDGET])) {
            if (null !== $this->_current_section) {
                $args = array_merge($args, $this->_current_section);
            } elseif (empty($args['section'])) {
                \IqitElementorWpHelper::_doing_it_wrong(__CLASS__ . '::' . __FUNCTION__ . ': Cannot add a control outside a section (use `start_controls_section`).');
            }
        }

        // If we are currently inside a tabs wrapper / tab, attach inner_tab & tabs_wrapper
        if (null !== $this->current_tab
            && !empty($this->current_tab['inner_tab'])
            && !in_array($args['type'], [Controls_Manager::TABS, Controls_Manager::TAB], true)
        ) {
            // The control belongs to the currently open inner tab
            $args['inner_tab'] = $this->current_tab['inner_tab'];
            $args['tabs_wrapper'] = $this->current_tab['tabs_wrapper'];
        }

        $available_tabs = $this->_get_available_tabs_controls();
        if (!isset($available_tabs[$args['tab']])) {
            $args['tab'] = $default_args['tab'];
        }
        $this->_tabs_controls[$args['tab']] = $available_tabs[$args['tab']];

        $this->_controls[$id] = array_merge($default_args, $args);

        return true;
    }

    public function remove_control($id)
    {
        unset($this->_controls[$id]);
    }

    public function get_controls()
    {
        return array_values($this->_controls);
    }

    public function get_controls_for_css()
    {
        return $this->_controls;
    }

    public function get_style_controls()
    {
        return array_filter($this->get_controls(), function ($control) {
            return !empty($control['selectors']);
        });
    }

    public function get_class_controls()
    {
        return array_filter($this->get_controls(), function ($control) {
            return isset($control['prefix_class']);
        });
    }

    public function is_control_visible($element_instance, $control)
    {
        if (empty($control['condition'])) {
            return true;
        }

        foreach ($control['condition'] as $condition_key => $condition_value) {
            preg_match('/([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i', $condition_key, $condition_key_parts);

            $pure_condition_key = $condition_key_parts[1];
            $condition_sub_key = $condition_key_parts[2];
            $is_negative_condition = (bool)$condition_key_parts[3];

            if (!isset($element_instance[$pure_condition_key])) {
                \IqitElementorWpHelper::triggerError(
                    sprintf(
                        'Condition key "%s" not found in element instance in control %s.',
                        $pure_condition_key,
                        $control['name']
                    )
                );
            }

            $instance_value = $element_instance[$pure_condition_key];

            if ($condition_sub_key) {
                if (!isset($instance_value[$condition_sub_key])) {
                    return false;
                }

                $instance_value = $instance_value[$condition_sub_key];
            }

            $is_contains = is_array($condition_value) ? in_array($instance_value, $condition_value) : $instance_value === $condition_value;

            if ($is_negative_condition && $is_contains || !$is_negative_condition && !$is_contains) {
                return false;
            }
        }

        return true;
    }

    protected function _before_register_controls()
    {
    }

    protected function _after_register_controls()
    {
    }

    public function add_render_attribute($element, $key, $value)
    {
        if (empty($this->_render_attributes[$element][$key])) {
            $this->_render_attributes[$element][$key] = [];
        }

        $this->_render_attributes[$element][$key] = array_merge($this->_render_attributes[$element][$key], (array)$value);
    }

    public function get_render_attribute_string($element)
    {
        if (empty($this->_render_attributes[$element])) {
            return '';
        }

        $render_attributes = $this->_render_attributes[$element];

        $attributes = [];
        foreach ($render_attributes as $attribute_key => $attribute_values) {
            $attributes[] = sprintf('%s="%s"', $attribute_key, \IqitElementorWpHelper::esc_attr(implode(' ', $attribute_values)));
        }

        unset($this->_render_attributes[$element]);

        return implode(' ', $attributes);
    }

    public function print_template()
    {
        ob_start();
        $this->content_template();
        $content_template = ob_get_clean();

        if (empty($content_template)) {
            return;
        }
        ?>
        <script type="text/html" id="tmpl-elementor-<?php echo $this->get_type(); ?>-<?php echo \IqitElementorWpHelper::esc_attr($this->get_id()); ?>-content">
            <?php $this->render_settings(); ?>
            <?php echo $content_template; ?>
        </script>
        <?php
    }

    public function start_controls_section($id, $args)
    {
        $args['type'] = Controls_Manager::SECTION;

        $this->add_control($id, $args);

        if (null !== $this->_current_section) {
            exit(sprintf('Elementor: You can\'t start a section before the end of the previous section: `%s`', $this->_current_section['section']));
        }

        $this->_current_section = [
            'section' => $id,
            'tab' => $this->_controls[$id]['tab'],
        ];
    }

    public function end_controls_section()
    {
        $this->_current_section = null;
    }

    public function __construct($args = [])
    {
        $this->_before_register_controls();
        $this->_register_controls();
        $this->_after_register_controls();
    }

    public function get_current_tab()
    {
        return $this->current_tab;
    }

    public function start_controls_tab($tab_id, $args)
    {
        if (!empty($this->current_tab['inner_tab'])) {
            exit(sprintf('Elementor: You can\'t start a tab before the end of the previous tab "%s".', $this->current_tab['inner_tab'])); // XSS ok.
        }

        $args['type'] = Controls_Manager::TAB;
        $args['tabs_wrapper'] = $this->current_tab['tabs_wrapper'];

        $this->add_control($tab_id, $args);

        $this->current_tab['inner_tab'] = $tab_id;

        /*if ($this->injection_point) {
            $this->injection_point['tab']['inner_tab'] = $this->current_tab['inner_tab'];
        }*/
    }

    public function start_controls_tabs($tabs_id, array $args = [])
    {
        if (null !== $this->current_tab) {
            exit(sprintf('Elementor: You can\'t start tabs before the end of the previous tabs "%s".', $this->current_tab['tabs_wrapper'])); // XSS ok.
        }

        $args['type'] = Controls_Manager::TABS;

        $this->add_control($tabs_id, $args);

        $this->current_tab = ['tabs_wrapper' => $tabs_id,];

        foreach (['condition', 'conditions'] as $key) {
            if (!empty($args[$key])) {
                $this->current_tab[$key] = $args[$key];
            }
        }

        /*if ($this->injection_point) {
            $this->injection_point['tab'] = $this->current_tab;
        }*/
    }


    public function end_controls_tabs()
    {
        $this->current_tab = null;
    }

    public function end_controls_tab()
    {
        unset($this->current_tab['inner_tab']);
    }

}
