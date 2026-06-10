<?php
namespace IqitElementor\Base;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class ControlBaseMultiple extends ControlBase
{
    public function getDefaultValue(): array
    {
        return [];
    }

    public function getValue(array $control, array $instance): array
    {
        $value = parent::getValue($control, $instance);

        if (empty($control['default'])) {
            $control['default'] = [];
        }

        if (!is_array($value)) {
            $value = [];
        }

        $control['default'] = array_merge(
            $this->getDefaultValue(),
            $control['default']
        );

        return array_merge(
            $control['default'],
            $value
        );
    }

    /**
     * @param mixed $control_value
     * @return mixed
     */
    public function getStyleValue(string $css_property, $control_value)
    {
        return $control_value[$css_property] ?? '';
    }

    /**
     * @param mixed $control_value
     */
    public function getReplaceStyleValues(string $css_property, $control_value): string
    {
        if (!is_array($control_value)) {
            return '';
        }

        // Trying to retrieve whole the related properties
        // according to the string matches.
        // When one of the properties is empty, aborting
        // the action and returning an empty string.
        try {
            return preg_replace_callback('/\{\{([A-Z]+)}}/', function ($matches) use ($control_value) {
                $value = $control_value[strtolower($matches[1])];

                if ('' === $value) {
                    throw new \Exception();
                }

                return $value;
            }, $css_property);
        } catch (\Exception $e) {
            return '';
        }
    }
}
