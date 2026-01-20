<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

abstract class Group_Control_Base implements Group_Control_Interface
{
    private $_args = [];

    /**
     * Options for the group control.
     *
     * @var array|null
     */
    private $options;

    public function __construct()
    {
        $this->_init();
    }

    public function get_controls_prefix()
    {
        return $this->get_args()['name'] . '_';
    }

    public function get_base_group_classes()
    {
        return 'elementor-group-control-' . static::get_type() . ' elementor-group-control';
    }

    /**
     * @param Element_Base $element
     * @param $user_args
     */
    final public function add_controls($element, $user_args)
    {
        $this->_init_args($user_args);

        // Filter witch controls to display
        $filtered_controls = $this->_filter_controls();

        // Add prefixes to all control conditions
        $filtered_controls = $this->add_prefixes($filtered_controls);

        // Check if popover is enabled
        if ($this->get_options('popover')) {
            $this->start_popover($element);
        }

        foreach ($filtered_controls as $control_id => $control_args) {
            // Add the global group args to the control
            $control_args = $this->_add_group_args_to_control($control_id, $control_args);

            // Register the control
            $id = $this->get_controls_prefix() . $control_id;

            if (!empty($control_args['responsive'])) {
                unset($control_args['responsive']);

                $element->add_responsive_control($id, $control_args);
            } else {
                $element->add_control($id, $control_args);
            }
        }

        if ($this->get_options('popover')) {
            $element->end_popover();
        }
    }

    final public function get_args()
    {
        return $this->_args;
    }

    protected function _init()
    {
    }

    protected function _get_child_default_args()
    {
        return [];
    }

    abstract protected function _get_controls($args);

    /**
     * Get default options for the group control.
     * Override in child classes to customize.
     *
     * @return array
     */
    protected function get_default_options()
    {
        return [];
    }

    /**
     * Initialize options.
     */
    private function init_options()
    {
        $default_options = [
            'popover' => false,
        ];

        $this->options = array_replace_recursive($default_options, $this->get_default_options());
    }

    /**
     * Get options.
     *
     * @param string|null $option Option name.
     * @return mixed
     */
    final public function get_options($option = null)
    {
        if (null === $this->options) {
            $this->init_options();
        }

        if ($option) {
            if (isset($this->options[$option])) {
                return $this->options[$option];
            }
            return null;
        }

        return $this->options;
    }

    /**
     * Start popover for the group control.
     * Adds a popover toggle control first.
     *
     * @param Element_Base $element
     */
    private function start_popover($element)
    {
        $popover_options = $this->get_options('popover');
        $settings = $this->get_args();

        if (!empty($settings['label'])) {
            $label = $settings['label'];
        } elseif (!empty($popover_options['starter_title'])) {
            $label = $popover_options['starter_title'];
        } else {
            $label = '';
        }

        $control_params = [
            'type' => Controls_Manager::POPOVER_TOGGLE,
            'label' => $label,
            'return_value' => $popover_options['starter_value'] ?? 'yes',
        ];

        if (!empty($popover_options['settings'])) {
            $control_params = array_replace_recursive($control_params, $popover_options['settings']);
        }

        // Handle conditions
        foreach (['condition', 'conditions'] as $key) {
            if (!empty($settings[$key])) {
                $control_params[$key] = $settings[$key];
            }
        }

        $control_params['tab'] = $settings['tab'] ?? Element_Base::TAB_CONTENT;
        $control_params['section'] = $settings['section'] ?? '';

        $starter_name = $popover_options['starter_name'] ?? 'popover_toggle';

        // Add popover toggle control
        $element->add_control($this->get_controls_prefix() . $starter_name, $control_params);

        // Start the popover
        $element->start_popover();
    }

    private function _get_default_args()
    {
        return [
            'section' => '',
            'default' => '',
            'selector' => '{{WRAPPER}}',
            'tab' => Element_Base::TAB_CONTENT,
            'fields' => 'all',
        ];
    }

    private function _init_args($args)
    {
        $this->_args = array_merge($this->_get_default_args(), $this->_get_child_default_args(), $args);
    }

    private function _filter_controls()
    {
        $args = $this->get_args();

        $controls = $this->_get_controls($args);

        // Prepare fields (add popover condition)
        $controls = $this->prepare_fields($controls);

        if (!is_array($args['fields'])) {
            return $controls;
        }

        $filtered_controls = array_intersect_key($controls, array_flip($args['fields']));

        // Include all condition depended controls
        foreach ($filtered_controls as $control) {
            if (empty($control['condition'])) {
                continue;
            }

            $depended_controls = array_intersect_key($controls, $control['condition']);
            $filtered_controls = array_merge($filtered_controls, $depended_controls);
            $filtered_controls = array_intersect_key($controls, $filtered_controls);
        }

        return $filtered_controls;
    }

    /**
     * Prepare fields by adding popover conditions.
     *
     * @param array $fields
     * @return array
     */
    protected function prepare_fields($fields)
    {
        $popover_options = $this->get_options('popover');

        if (!$popover_options) {
            return $fields;
        }

        $popover_name = $popover_options['starter_name'] ?? 'popover_toggle';

        foreach ($fields as $field_key => &$field) {
            // Skip the popover toggle control itself
            if ($field_key === $popover_name) {
                continue;
            }

            // Add condition: field is visible only when popover toggle is not empty
            if (!isset($field['condition'])) {
                $field['condition'] = [];
            }
            $field['condition'][$popover_name . '!'] = '';
        }

        return $fields;
    }

    private function add_conditions_prefix($control)
    {
        $prefixed_condition_keys = array_map(
            function ($key) {
                return $this->get_controls_prefix() . $key;
            },
            array_keys($control['condition'])
        );
        $control['condition'] = array_combine(
            $prefixed_condition_keys,
            $control['condition']
        );

        return $control;
    }

    private function add_selectors_prefix($control)
    {
        foreach ($control['selectors'] as &$selector) {
            $selector = preg_replace_callback('/(?:\{\{)\K[^.}]+(?=\.[^}]*}})/', function ($matches) {
                return $this->get_controls_prefix() . $matches[0];
            }, $selector);
        }

        return $control;
    }

    private function add_prefixes($controls)
    {
        foreach ($controls as &$control) {
            if (!empty($control['condition'])) {
                $control = $this->add_conditions_prefix($control);
            }
            if (!empty($control['selectors'])) {
                $control = $this->add_selectors_prefix($control);
            }
        }

        return $controls;
    }

    protected function _add_group_args_to_control($control_id, $control_args)
    {
        $args = $this->get_args();

        $control_args['tab'] = $args['tab'];
        $control_args['section'] = $args['section'];
        $control_args['classes'] = $this->get_base_group_classes() . ' elementor-group-control-' . $control_id;

        if (!empty($args['condition'])) {
            if (empty($control_args['condition'])) {
                $control_args['condition'] = [];
            }

            $control_args['condition'] += $args['condition'];
        }

        return $control_args;
    }
}
