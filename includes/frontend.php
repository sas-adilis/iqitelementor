<?php
/**
 * IqitElementor Frontend
 *
 * Handles the frontend rendering and CSS generation for Elementor elements.
 */

namespace Elementor;

use Exception;
use IqitElementorHelper;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
}

class Frontend
{
    /**
     * Google fonts to enqueue.
     *
     * @var array
     */
    private $google_fonts = [];

    /**
     * Google Early Access fonts to enqueue.
     *
     * @var array
     */
    private $google_early_access_fonts = [];

    /**
     * Column widths for responsive layout.
     *
     * @var array
     */
    private $column_widths = [];

    /**
     * Custom CSS collected from elements.
     *
     * @var array
     */
    private $custom_css = [];

    /**
     * Stylesheet object.
     *
     * @var Stylesheet|null
     */
    private $stylesheet;

    /**
     * Element data.
     *
     * @var array
     */
    private $data = [];

    /**
     * Frontend constructor.
     *
     * @param array|null $data Element data
     */
    public function __construct($data)
    {
        if (empty($data)) {
            return;
        }

        $this->data = $data;
        $this->init();
        $this->print_css();
        $this->apply_builder_in_content();
    }

    /**
     * Initialize the frontend.
     *
     * @return void
     */
    public function init()
    {
        $this->_init_stylesheet();
    }

    /**
     * Print the generated CSS.
     *
     * @return void
     */
    public function print_css()
    {
        $container_width = IqitElementorHelper::absint(IqitElementorHelper::get_option('elementor_container_width'));

        if (!empty($container_width)) {
            $this->stylesheet->add_rules(
                '.elementor-section.elementor-section-boxed > .elementor-container',
                'max-width:' . $container_width . 'px'
            );
        }

        foreach ($this->data as $section) {
            $this->_parse_style_item($section);
        }

        $css_code = (string) $this->stylesheet;

        if (!empty($this->column_widths)) {
            $css_code .= '@media (min-width: 768px) {' . implode('', $this->column_widths) . '}';
        }

        if (!empty($this->custom_css)) {
            $css_code .= implode('', $this->custom_css);
        }

        if (empty($css_code)) {
            return;
        }

        echo '<style class="elementor-frontend-stylesheet">' . $css_code . '</style>';

        $this->_enqueue_fonts();
    }

    /**
     * Apply the builder content.
     *
     * @return void
     */
    public function apply_builder_in_content()
    {
        ?>
        <div class="elementor">
            <?php foreach ($this->data as $section) { ?>
                <?php $this->_print_section($section); ?>
            <?php } ?>
        </div>
        <?php
    }

    /**
     * Add control rules for CSS generation.
     *
     * @param string $element_unique_class The unique element class
     * @param array $control The control configuration
     * @param callable $value_callback Callback to get control value
     * @param array $controls_stack All available controls
     * @param mixed $control_value The control value
     *
     * @return void
     */
    public function add_control_rules($element_unique_class, array $control, callable $value_callback, array $controls_stack, $control_value)
    {
        if (null === $control_value || empty($control['selectors'])) {
            return;
        }

        foreach ($control['selectors'] as $selector => $css_property) {
            $output_selector = str_replace('{{WRAPPER}}', $element_unique_class, $selector);

            try {
                $output_css_property = $this->_parse_control_css_property(
                    $css_property,
                    $control,
                    $value_callback,
                    $controls_stack,
                    $control_value
                );
            } catch (Exception $e) {
                return;
            }

            if (!$output_css_property) {
                continue;
            }

            $device = !empty($control['responsive']) ? $control['responsive'] : Element_Base::RESPONSIVE_DESKTOP;
            $this->stylesheet->add_rules($output_selector, $output_css_property, $device);
        }
    }

    /**
     * Parse property placeholder for CSS value.
     *
     * @param array $control The control configuration
     * @param mixed $value The current value
     * @param array $controls_stack All available controls
     * @param callable $value_callback Callback to get control value
     * @param string $placeholder The placeholder to parse
     * @param string|null $parser_control_name Optional control name for parsing
     *
     * @return string The parsed value
     */
    public function parse_property_placeholder(array $control, $value, array $controls_stack, callable $value_callback, $placeholder, $parser_control_name = null)
    {
        if ($parser_control_name) {
            $control = $controls_stack[$parser_control_name];
            $value = call_user_func($value_callback, $control);
        }

        $control_obj = PluginElementor::instance()->controls_manager->get_control($control['type']);
        $parsed_value = (string) $control_obj->get_style_value($placeholder, $value);

        if ($control['name'] === 'background_image') {
            $parsed_value = IqitElementorHelper::getImage($parsed_value);
        }

        return $parsed_value;
    }

    /**
     * Initialize the stylesheet with breakpoints.
     *
     * @return void
     */
    private function _init_stylesheet()
    {
        $this->stylesheet = new Stylesheet();

        $breakpoints = Responsive::get_breakpoints();
        $this->stylesheet
            ->add_device('tablet', $breakpoints['lg'] - 1)
            ->add_device('mobile', $breakpoints['md'] - 1);
    }

    /**
     * Enqueue fonts (Google and Early Access).
     *
     * @return void
     */
    private function _enqueue_fonts()
    {
        if (!empty($this->google_fonts)) {
            $fonts = [];
            foreach ($this->google_fonts as $font) {
                $fonts[] = str_replace(' ', '+', $font) . ':100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic';
            }
            printf(
                '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=%s&display=swap">',
                implode('|', $fonts)
            );
            $this->google_fonts = [];
        }

        if (!empty($this->google_early_access_fonts)) {
            foreach ($this->google_early_access_fonts as $current_font) {
                printf(
                    '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/earlyaccess/%s.css">',
                    strtolower(str_replace(' ', '', $current_font))
                );
            }
            $this->google_early_access_fonts = [];
        }
    }

    /**
     * Add a font to the enqueue list.
     *
     * @param string $font The font name
     *
     * @return void
     */
    private function _add_enqueue_font($font)
    {
        switch (Fonts::get_font_type($font)) {
            case Fonts::GOOGLE:
                if (!in_array($font, $this->google_fonts, true)) {
                    $this->google_fonts[] = $font;
                }
                break;

            case Fonts::EARLYACCESS:
                if (!in_array($font, $this->google_early_access_fonts, true)) {
                    $this->google_early_access_fonts[] = $font;
                }
                break;
        }
    }

    /**
     * Parse style item recursively.
     *
     * @param array $element The element data
     *
     * @return void
     */
    private function _parse_style_item(array $element)
    {
        $element_obj = $this->_get_element_object($element);

        if (!$element_obj) {
            return;
        }

        $values = $element['settings'];
        $element_instance = $element_obj->get_parse_values($element['settings']);
        $element_unique_class = '.elementor-element.elementor-element-' . $element['id'];

        $this->_handle_column_width($element_obj, $element_instance, $element_unique_class);
        $this->_process_style_controls($element_obj, $element_instance, $element_unique_class, $values);
        $this->_collect_custom_css($element_instance, $element['id']);

        // Recursively process child elements
        if (!empty($element['elements'])) {
            foreach ($element['elements'] as $child_element) {
                $this->_parse_style_item($child_element);
            }
        }
    }

    /**
     * Collect custom CSS from element settings.
     *
     * @param array $element_instance The element instance
     * @param string $element_id The element ID
     *
     * @return void
     */
    private function _collect_custom_css(array $element_instance, string $element_id): void
    {
        if (empty($element_instance['_custom_css'])) {
            return;
        }

        $css = trim($element_instance['_custom_css']);

        if (empty($css)) {
            return;
        }

        // Replace "selector" placeholder with the unique element selector
        $unique_selector = '.elementor-element-' . $element_id;
        $this->custom_css[] = str_replace('selector', $unique_selector, $css);
    }

    /**
     * Get the element object based on element type.
     *
     * @param array $element The element data
     *
     * @return Element_Base|Widget_Base|false|null The element object or null
     */
    private function _get_element_object(array $element)
    {
        if ('widget' === $element['elType']) {
            return PluginElementor::instance()->widgets_manager->get_widget($element['widgetType']);
        }

        return PluginElementor::instance()->elements_manager->get_element($element['elType']);
    }

    /**
     * Handle column width for responsive layout.
     *
     * @param Element_Base|Widget_Base $element_obj The element object
     * @param array $element_instance The element instance
     * @param string $element_unique_class The unique class
     *
     * @return void
     */
    private function _handle_column_width($element_obj, array $element_instance, $element_unique_class)
    {
        if ('column' === $element_obj->get_id() && !empty($element_instance['_inline_size'])) {
            $this->column_widths[] = $element_unique_class . '{width:' . $element_instance['_inline_size'] . '%;}';
        }
    }

    /**
     * Process style controls for an element.
     *
     * @param Element_Base|Widget_Base $element_obj The element object
     * @param array $element_instance The element instance
     * @param string $element_unique_class The unique class
     * @param array $values The raw values
     *
     * @return void
     */
    private function _process_style_controls($element_obj, array $element_instance, $element_unique_class, array $values)
    {
        foreach ($element_obj->get_style_controls() as $control) {
            if (!isset($element_instance[$control['name']])) {
                continue;
            }

            $control_value = $element_instance[$control['name']];

            if (!is_numeric($control_value) && !is_float($control_value) && empty($control_value)) {
                continue;
            }

            $control_obj = PluginElementor::instance()->controls_manager->get_control($control['type']);

            if (!$control_obj) {
                continue;
            }

            if (!$element_obj->is_control_visible($element_instance, $control)) {
                continue;
            }

            if (Controls_Manager::FONT === $control_obj->get_type()) {
                $this->_add_enqueue_font($control_value);
            }

            $this->add_control_rules(
                $element_unique_class,
                $control,
                function ($control) use ($values) {
                    return $this->_get_style_control_value($control, $values);
                },
                $element_obj->get_controls_for_css(),
                $this->_get_style_control_value($control, $values)
            );
        }
    }

    /**
     * Parse the CSS property with placeholder replacement.
     *
     * @param string $css_property The CSS property string
     * @param array $control The control configuration
     * @param callable $value_callback Callback to get control value
     * @param array $controls_stack All available controls
     * @param mixed $value The control value
     *
     * @return string The parsed CSS property
     *
     * @throws Exception When placeholder cannot be resolved
     */
    private function _parse_control_css_property($css_property, array $control, callable $value_callback, array $controls_stack, $value)
    {
        // Regex pattern to match placeholders like {{VALUE}}, {{SIZE.unit}}, {{VALUE || fallback}}
        $pattern = '/\{\{(?:([^.}]+)\.)?([^}|]*)(?: *\|\| *(?:([^.}]+)\.)?([^}]*) *)?}}/';

        return preg_replace_callback(
            $pattern,
            function ($matches) use ($control, $value_callback, $controls_stack, $value) {
                return $this->_resolve_placeholder($matches, $control, $value_callback, $controls_stack, $value);
            },
            $css_property
        );
    }

    /**
     * Resolve a placeholder match to its value.
     *
     * @param array $matches Regex matches
     * @param array $control The control configuration
     * @param callable $value_callback Callback to get control value
     * @param array $controls_stack All available controls
     * @param mixed $value The control value
     *
     * @return string The resolved value
     *
     * @throws Exception When placeholder cannot be resolved
     */
    private function _resolve_placeholder(array $matches, array $control, callable $value_callback, array $controls_stack, $value)
    {
        $external_control_name = $matches[1] ?? '';
        $property = $matches[2] ?? '';
        $fallback_control_name = $matches[3] ?? '';
        $fallback_value = $matches[4] ?? '';

        $external_control_missing = $external_control_name && !isset($controls_stack[$external_control_name]);

        $parser_control = $control;
        $value_to_insert = $value;

        // Handle external control reference (e.g., {{SIZE.unit}})
        if (!empty($external_control_name) && !$external_control_missing) {
            $parser_control = $controls_stack[$external_control_name];
            $value_to_insert = call_user_func($value_callback, $parser_control);
        }

        $control_obj = PluginElementor::instance()->controls_manager->get_control($parser_control['type']);
        $parsed_value = (string) $control_obj->get_style_value(strtolower($property), $value_to_insert);

        // Handle fallback value (e.g., {{VALUE || 'default'}})
        if ('' === $parsed_value && !empty($fallback_value)) {
            $parsed_value = $this->_resolve_fallback_value(
                $fallback_value,
                $fallback_control_name,
                $control,
                $value,
                $controls_stack,
                $value_callback
            );
        }

        // No value resolved
        if ('' === $parsed_value) {
            if ($external_control_missing) {
                return '';
            }
            throw new Exception('Cannot resolve placeholder');
        }

        // Handle background image special case
        if ($parser_control['name'] === 'background_image') {
            $parsed_value = IqitElementorHelper::getImage($parsed_value);
        }

        // Handle empty placeholder
        if ('__EMPTY__' === $parsed_value) {
            $parsed_value = '';
        }

        return $parsed_value;
    }

    /**
     * Resolve a fallback value.
     *
     * @param string $fallback_value The fallback value
     * @param string $fallback_control_name Optional fallback control name
     * @param array $control The control configuration
     * @param mixed $value The control value
     * @param array $controls_stack All available controls
     * @param callable $value_callback Callback to get control value
     *
     * @return string The resolved fallback value
     */
    private function _resolve_fallback_value($fallback_value, $fallback_control_name, array $control, $value, array $controls_stack, callable $value_callback)
    {
        // Check if it's a string literal (e.g., 'default' or "default")
        if (preg_match('/^([\'"])(.*)\1$/', $fallback_value, $string_matches)) {
            return $string_matches[2];
        }

        if (is_numeric($fallback_value)) {
            return $fallback_value;
        }

        // It's a control reference
        if ($fallback_control_name && !isset($controls_stack[$fallback_control_name])) {
            return '';
        }

        return $this->parse_property_placeholder(
            $control,
            $value,
            $controls_stack,
            $value_callback,
            $fallback_value,
            $fallback_control_name
        );
    }

    /**
     * Get the style control value with dictionary lookup.
     *
     * @param array $control The control configuration
     * @param array $values The values array
     *
     * @return mixed The control value or null
     */
    private function _get_style_control_value(array $control, array $values)
    {
        if (!isset($values[$control['name']])) {
            return null;
        }

        $value = $values[$control['name']];

        // Apply selectors dictionary transformation
        if (isset($control['selectors_dictionary'][$value])) {
            $value = $control['selectors_dictionary'][$value];
        }

        if (!is_numeric($value) && !is_float($value) && empty($value)) {
            return null;
        }

        return $value;
    }

    /**
     * Print a section element.
     *
     * @param array $section_data The section data
     *
     * @return void
     */
    private function _print_section(array $section_data)
    {
        $section_obj = PluginElementor::instance()->elements_manager->get_element('section');
        $instance = $section_obj->get_parse_values($section_data['settings']);

        $section_obj->before_render($instance, $section_data['id'], $section_data);

        foreach ($section_data['elements'] as $column_data) {
            $section_obj->before_render_column($instance, $section_data['id'], $section_data);
            $this->_print_column($column_data);
            $section_obj->after_render_column($instance, $section_data['id'], $section_data);
        }

        $section_obj->after_render($instance, $section_data['id'], $section_data);
    }

    /**
     * Print a column element.
     *
     * @param array $column_data The column data
     *
     * @return void
     */
    private function _print_column(array $column_data)
    {
        $column_obj = PluginElementor::instance()->elements_manager->get_element('column');
        $instance = $column_obj->get_parse_values($column_data['settings']);

        $column_obj->before_render($instance, $column_data['id'], $column_data);

        if (!empty($column_data['elements'])) {
            foreach ($column_data['elements'] as $widget_data) {
                if ('section' === $widget_data['elType']) {
                    $this->_print_section($widget_data);
                } else {
                    $this->_print_widget($widget_data);
                }
            }
        }

        $column_obj->after_render($instance, $column_data['id'], $column_data);
    }

    /**
     * Print a widget element.
     *
     * @param array $widget_data The widget data
     *
     * @return void
     */
    private function _print_widget(array $widget_data)
    {
        $widget_obj = PluginElementor::instance()->widgets_manager->get_widget($widget_data['widgetType']);

        if (false === $widget_obj) {
            return;
        }

        if (empty($widget_data['settings'])) {
            $widget_data['settings'] = [];
        }

        $instance = $widget_obj->get_parse_values($widget_data['settings']);

        $widget_obj->before_render($instance, $widget_data['id'], $widget_data);
        $instance['id_widget_instance'] = $widget_data['id'];
        $widget_obj->render_content($instance);
        $widget_obj->after_render($instance, $widget_data['id'], $widget_data);
    }
}
