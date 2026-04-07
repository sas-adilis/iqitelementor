<?php
namespace IqitElementor\Base;

use IqitElementor\Contract\GroupControlInterface;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class GroupControlBase implements GroupControlInterface
{
    /** @var array */
    private $args = [];

    /**
     * Options for the group control.
     *
     * @var array|null
     */
    private $options;

    public function __construct()
    {
        $this->init();
    }

    public function getControlsPrefix(): string
    {
        return $this->getArgs()['name'] . '_';
    }

    public function getBaseGroupClasses(): string
    {
        return 'elementor-group-control-' . static::getType() . ' elementor-group-control';
    }

    final public function addControls(ElementBase $element, array $user_args): void
    {
        $this->initArgs($user_args);

        // Filter witch controls to display
        $filtered_controls = $this->filterControls();

        // Add prefixes to all control conditions
        $filtered_controls = $this->addPrefixes($filtered_controls);

        // Check if popover is enabled
        if ($this->getOptions('popover')) {
            $this->startPopover($element);
        }

        foreach ($filtered_controls as $control_id => $control_args) {
            // Add the global group args to the control
            $control_args = $this->addGroupArgsToControl($control_id, $control_args);

            // Register the control
            $id = $this->getControlsPrefix() . $control_id;

            if (!empty($control_args['responsive'])) {
                unset($control_args['responsive']);

                $element->addResponsiveControl($id, $control_args);
            } else {
                $element->addControl($id, $control_args);
            }
        }

        if ($this->getOptions('popover')) {
            $element->endPopover();
        }
    }

    final public function getArgs(): array
    {
        return $this->args;
    }

    protected function init(): void
    {
    }

    protected function getChildDefaultArgs(): array
    {
        return [];
    }

    abstract protected function getControlsInternal(array $args): array;

    /**
     * Get default options for the group control.
     * Override in child classes to customize.
     */
    protected function getDefaultOptions(): array
    {
        return [];
    }

    private function initOptions(): void
    {
        $default_options = [
            'popover' => false,
        ];

        $this->options = array_replace_recursive($default_options, $this->getDefaultOptions());
    }

    /**
     * @return mixed
     */
    final public function getOptions(?string $option = null)
    {
        if (null === $this->options) {
            $this->initOptions();
        }

        if ($option) {
            if (isset($this->options[$option])) {
                return $this->options[$option];
            }
            return null;
        }

        return $this->options;
    }

    private function startPopover(ElementBase $element): void
    {
        $popover_options = $this->getOptions('popover');
        $settings = $this->getArgs();

        if (!empty($settings['label'])) {
            $label = $settings['label'];
        } elseif (!empty($popover_options['starter_title'])) {
            $label = $popover_options['starter_title'];
        } else {
            $label = '';
        }

        $control_params = [
            'type' => ControlManager::POPOVER_TOGGLE,
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

        $control_params['tab'] = $settings['tab'] ?? ElementBase::TAB_CONTENT;
        $control_params['section'] = $settings['section'] ?? '';

        $starter_name = $popover_options['starter_name'] ?? 'popover_toggle';

        // Add popover toggle control
        $element->addControl($this->getControlsPrefix() . $starter_name, $control_params);

        // Start the popover
        $element->startPopover();
    }

    private function getDefaultArgs(): array
    {
        return [
            'section' => '',
            'default' => '',
            'selector' => '{{WRAPPER}}',
            'tab' => ElementBase::TAB_CONTENT,
            'fields' => 'all',
        ];
    }

    private function initArgs(array $args): void
    {
        $this->args = array_merge($this->getDefaultArgs(), $this->getChildDefaultArgs(), $args);
    }

    private function filterControls(): array
    {
        $args = $this->getArgs();

        $controls = $this->getControlsInternal($args);

        // Prepare fields (add popover condition)
        $controls = $this->prepareFields($controls);

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

    protected function prepareFields(array $fields): array
    {
        $popover_options = $this->getOptions('popover');

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

    private function addConditionsPrefix(array $control): array
    {
        $prefixed_condition_keys = array_map(
            function ($key) {
                return $this->getControlsPrefix() . $key;
            },
            array_keys($control['condition'])
        );
        $control['condition'] = array_combine(
            $prefixed_condition_keys,
            $control['condition']
        );

        return $control;
    }

    private function addSelectorsPrefix(array $control): array
    {
        foreach ($control['selectors'] as &$selector) {
            $selector = preg_replace_callback('/(?:\{\{)\K[^.}]+(?=\.[^}]*}})/', function ($matches) {
                return $this->getControlsPrefix() . $matches[0];
            }, $selector);
        }

        return $control;
    }

    private function addPrefixes(array $controls): array
    {
        foreach ($controls as &$control) {
            if (!empty($control['condition'])) {
                $control = $this->addConditionsPrefix($control);
            }
            if (!empty($control['selectors'])) {
                $control = $this->addSelectorsPrefix($control);
            }
        }

        return $controls;
    }

    protected function addGroupArgsToControl(string $control_id, array $control_args): array
    {
        $args = $this->getArgs();

        $control_args['tab'] = $args['tab'];
        $control_args['section'] = $args['section'];
        $control_args['classes'] = $this->getBaseGroupClasses() . ' elementor-group-control-' . $control_id;

        if (!empty($args['condition'])) {
            if (empty($control_args['condition'])) {
                $control_args['condition'] = [];
            }

            $control_args['condition'] += $args['condition'];
        }

        return $control_args;
    }
}
