<?php
/**
 * IqitElementor Frontend
 *
 * Handles the frontend rendering and CSS generation for Elementor elements.
 */

namespace IqitElementor\Core;

use Exception;
use IqitElementor\Helper\Helper;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Base\ElementBase;
use IqitElementor\Base\WidgetBase;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Frontend
{
    /**
     * Google fonts to enqueue.
     *
     * @var string[]
     */
    private $googleFonts = [];

    /**
     * Google Early Access fonts to enqueue.
     *
     * @var string[]
     */
    private $googleEarlyAccessFonts = [];

    /**
     * Column widths for responsive layout.
     *
     * @var string[]
     */
    private $columnWidths = [];

    /**
     * Custom CSS collected from elements.
     *
     * @var string[]
     */
    private $customCss = [];

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

    public function __construct(?array $data)
    {
        if (empty($data)) {
            return;
        }

        $this->data = $data;
        // @TODO TEMP DEBUG — remove after diagnosis
        \PrestaShopLogger::addLog('iqitelementor: Frontend BEFORE init, sections=' . count($data), 1);
        $this->init();
        \PrestaShopLogger::addLog('iqitelementor: Frontend AFTER init, BEFORE printCss', 1);
        $this->printCss();
        \PrestaShopLogger::addLog('iqitelementor: Frontend applyBuilderInContent start', 1);
        $this->applyBuilderInContent();
        \PrestaShopLogger::addLog('iqitelementor: Frontend constructor done', 1);
    }

    public function init(): void
    {
        $this->initStylesheet();
    }

    public function printCss(): void
    {
        // @TODO TEMP DEBUG — remove after diagnosis
        \PrestaShopLogger::addLog('iqitelementor: printCss entered', 1);

        $container_width = Helper::absint(Helper::getOption('elementor_container_width'));
        \PrestaShopLogger::addLog('iqitelementor: printCss container_width=' . $container_width, 1);

        if (!empty($container_width)) {
            $this->stylesheet->addRules(
                '.elementor-section.elementor-section-boxed > .elementor-container',
                'max-width:' . $container_width . 'px'
            );
        }

        foreach ($this->data as $section) {
            $this->parseStyleItem($section);
        }

        $css_code = (string) $this->stylesheet;

        if (!empty($this->columnWidths)) {
            $css_code .= '@media (min-width: 768px) {' . implode('', $this->columnWidths) . '}';
        }

        if (!empty($this->customCss)) {
            $css_code .= implode('', $this->customCss);
        }

        if (empty($css_code)) {
            return;
        }

        echo '<style class="elementor-frontend-stylesheet">' . $css_code . '</style>';

        $this->enqueueFonts();
    }

    public function applyBuilderInContent(): void
    {
        ?>
        <div class="elementor">
            <?php foreach ($this->data as $section) { ?>
                <?php $this->printSection($section); ?>
            <?php } ?>
        </div>
        <?php
    }

    /**
     * @param mixed $control_value
     */
    public function addControlRules(string $element_unique_class, array $control, callable $value_callback, array $controls_stack, $control_value): void
    {
        if (null === $control_value || empty($control['selectors'])) {
            return;
        }

        foreach ($control['selectors'] as $selector => $css_property) {
            $output_selector = str_replace('{{WRAPPER}}', $element_unique_class, $selector);

            try {
                $output_css_property = $this->parseControlCssProperty(
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

            $device = !empty($control['responsive']) ? $control['responsive'] : ElementBase::RESPONSIVE_DESKTOP;
            $this->stylesheet->addRules($output_selector, $output_css_property, $device);
        }
    }

    /**
     * @param mixed $value
     */
    public function parsePropertyPlaceholder(array $control, $value, array $controls_stack, callable $value_callback, string $placeholder, ?string $parser_control_name = null): string
    {
        if ($parser_control_name) {
            $control = $controls_stack[$parser_control_name];
            $value = call_user_func($value_callback, $control);
        }

        $control_obj = Plugin::instance()->controlsManager->getControl($control['type']);
        $parsed_value = (string) $control_obj->getStyleValue($placeholder, $value);

        if ($control['name'] === 'background_image') {
            $parsed_value = Helper::getImage($parsed_value);
        }

        return $parsed_value;
    }

    private function initStylesheet(): void
    {
        $this->stylesheet = new Stylesheet();

        $breakpoints = Responsive::getBreakpoints();
        $this->stylesheet
            ->addDevice('tablet', $breakpoints['lg'] - 1)
            ->addDevice('mobile', $breakpoints['md'] - 1);
    }

    private function enqueueFonts(): void
    {
        if (!empty($this->googleFonts)) {
            $fonts = [];
            foreach ($this->googleFonts as $font) {
                $fonts[] = str_replace(' ', '+', $font) . ':100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic';
            }
            printf(
                '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=%s&display=swap">',
                implode('|', $fonts)
            );
            $this->googleFonts = [];
        }

        if (!empty($this->googleEarlyAccessFonts)) {
            foreach ($this->googleEarlyAccessFonts as $current_font) {
                printf(
                    '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/earlyaccess/%s.css">',
                    strtolower(str_replace(' ', '', $current_font))
                );
            }
            $this->googleEarlyAccessFonts = [];
        }
    }

    private function addEnqueueFont(string $font): void
    {
        switch (Fonts::getFontType($font)) {
            case Fonts::GOOGLE:
                if (!in_array($font, $this->googleFonts, true)) {
                    $this->googleFonts[] = $font;
                }
                break;

            case Fonts::EARLYACCESS:
                if (!in_array($font, $this->googleEarlyAccessFonts, true)) {
                    $this->googleEarlyAccessFonts[] = $font;
                }
                break;
        }
    }

    private function parseStyleItem(array $element): void
    {
        // @TODO TEMP DEBUG — remove after diagnosis
        $elType = isset($element['elType']) ? $element['elType'] : '?';
        $widgetType = isset($element['widgetType']) ? $element['widgetType'] : '';
        $elId = isset($element['id']) ? $element['id'] : '?';
        \PrestaShopLogger::addLog('iqitelementor: parseStyleItem ' . $elType . ($widgetType ? ':' . $widgetType : '') . ' id=' . $elId, 1);

        $element_obj = $this->getElementObject($element);

        if (!$element_obj) {
            return;
        }

        $values = $element['settings'];
        $element_instance = $element_obj->getParseValues($element['settings']);
        $element_unique_class = '.elementor-element.elementor-element-' . $element['id'];

        $this->handleColumnWidth($element_obj, $element_instance, $element_unique_class);
        $this->processStyleControls($element_obj, $element_instance, $element_unique_class, $values);
        $this->collectCustomCss($element_instance, $element['id']);

        // Recursively process child elements
        if (!empty($element['elements'])) {
            foreach ($element['elements'] as $child_element) {
                $this->parseStyleItem($child_element);
            }
        }
    }

    private function collectCustomCss(array $element_instance, string $element_id): void
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
        $this->customCss[] = str_replace('selector', $unique_selector, $css);
    }

    /**
     * @return ElementBase|WidgetBase|false|null
     */
    private function getElementObject(array $element)
    {
        if ('widget' === $element['elType']) {
            return Plugin::instance()->widgetsManager->getWidget($element['widgetType']);
        }

        return Plugin::instance()->elementsManager->getElement($element['elType']);
    }

    /**
     * @param ElementBase|WidgetBase $element_obj
     */
    private function handleColumnWidth($element_obj, array $element_instance, string $element_unique_class): void
    {
        if ('column' === $element_obj->getId() && !empty($element_instance['_inline_size'])) {
            $this->columnWidths[] = $element_unique_class . '{width:' . $element_instance['_inline_size'] . '%;}';
        }
    }

    /**
     * @param ElementBase|WidgetBase $element_obj
     */
    private function processStyleControls($element_obj, array $element_instance, string $element_unique_class, array $values): void
    {
        foreach ($element_obj->getStyleControls() as $control) {
            if (!isset($element_instance[$control['name']])) {
                continue;
            }

            $control_value = $element_instance[$control['name']];

            if (!is_numeric($control_value) && !is_float($control_value) && empty($control_value)) {
                continue;
            }

            $control_obj = Plugin::instance()->controlsManager->getControl($control['type']);

            if (!$control_obj) {
                continue;
            }

            if (!$element_obj->isControlVisible($element_instance, $control)) {
                continue;
            }

            if (ControlManager::FONT === $control_obj->getType()) {
                $this->addEnqueueFont($control_value);
            }

            $this->addControlRules(
                $element_unique_class,
                $control,
                function ($control) use ($values) {
                    return $this->getStyleControlValue($control, $values);
                },
                $element_obj->getControlsForCss(),
                $this->getStyleControlValue($control, $values)
            );
        }
    }

    /**
     * @param mixed $value
     * @throws Exception When placeholder cannot be resolved
     */
    private function parseControlCssProperty(string $css_property, array $control, callable $value_callback, array $controls_stack, $value): string
    {
        // Regex pattern to match placeholders like {{VALUE}}, {{SIZE.unit}}, {{VALUE || fallback}}
        $pattern = '/\{\{(?:([^.}]+)\.)?([^}|]*)(?: *\|\| *(?:([^.}]+)\.)?([^}]*) *)?}}/';

        return preg_replace_callback(
            $pattern,
            function ($matches) use ($control, $value_callback, $controls_stack, $value) {
                return $this->resolvePlaceholder($matches, $control, $value_callback, $controls_stack, $value);
            },
            $css_property
        );
    }

    /**
     * @param mixed $value
     * @throws Exception When placeholder cannot be resolved
     */
    private function resolvePlaceholder(array $matches, array $control, callable $value_callback, array $controls_stack, $value): string
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

        $control_obj = Plugin::instance()->controlsManager->getControl($parser_control['type']);
        $parsed_value = (string) $control_obj->getStyleValue(strtolower($property), $value_to_insert);

        // Handle fallback value (e.g., {{VALUE || 'default'}})
        if ('' === $parsed_value && !empty($fallback_value)) {
            $parsed_value = $this->resolveFallbackValue(
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
            $parsed_value = Helper::getImage($parsed_value);
        }

        // Handle empty placeholder
        if ('__EMPTY__' === $parsed_value) {
            $parsed_value = '';
        }

        return $parsed_value;
    }

    /**
     * @param mixed $value
     */
    private function resolveFallbackValue(string $fallback_value, string $fallback_control_name, array $control, $value, array $controls_stack, callable $value_callback): string
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

        return $this->parsePropertyPlaceholder(
            $control,
            $value,
            $controls_stack,
            $value_callback,
            $fallback_value,
            $fallback_control_name
        );
    }

    /**
     * @return mixed
     */
    private function getStyleControlValue(array $control, array $values)
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

    private function printSection(array $section_data): void
    {
        $section_obj = Plugin::instance()->elementsManager->getElement('section');
        $instance = $section_obj->getParseValues($section_data['settings']);

        $section_obj->beforeRender($instance, $section_data['id'], $section_data);

        foreach ($section_data['elements'] as $column_data) {
            $section_obj->beforeRenderColumn($instance, $section_data['id'], $section_data);
            $this->printColumn($column_data);
            $section_obj->afterRenderColumn($instance, $section_data['id'], $section_data);
        }

        $section_obj->afterRender($instance, $section_data['id'], $section_data);
    }

    private function printColumn(array $column_data): void
    {
        $column_obj = Plugin::instance()->elementsManager->getElement('column');
        $instance = $column_obj->getParseValues($column_data['settings']);

        $column_obj->beforeRender($instance, $column_data['id'], $column_data);

        if (!empty($column_data['elements'])) {
            foreach ($column_data['elements'] as $widget_data) {
                if ('section' === $widget_data['elType']) {
                    $this->printSection($widget_data);
                } else {
                    $this->printWidget($widget_data);
                }
            }
        }

        $column_obj->afterRender($instance, $column_data['id'], $column_data);
    }

    private function printWidget(array $widget_data): void
    {
        // @TODO TEMP DEBUG — remove after diagnosis
        \PrestaShopLogger::addLog('iqitelementor: printWidget start: ' . ($widget_data['widgetType'] ?? 'unknown') . ' id=' . ($widget_data['id'] ?? '?'), 1);

        $widget_obj = Plugin::instance()->widgetsManager->getWidget($widget_data['widgetType']);

        if (false === $widget_obj) {
            \PrestaShopLogger::addLog('iqitelementor: widget not found: ' . ($widget_data['widgetType'] ?? 'unknown'), 2);
            return;
        }

        if (empty($widget_data['settings'])) {
            $widget_data['settings'] = [];
        }

        $instance = $widget_obj->getParseValues($widget_data['settings']);

        $widget_obj->beforeRender($instance, $widget_data['id'], $widget_data);
        $instance['id_widget_instance'] = $widget_data['id'];
        $widget_obj->renderContent($instance);
        $widget_obj->afterRender($instance, $widget_data['id'], $widget_data);
        \PrestaShopLogger::addLog('iqitelementor: printWidget done: ' . ($widget_data['widgetType'] ?? 'unknown'), 1);
    }
}
