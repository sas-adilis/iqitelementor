<?php
namespace IqitElementor\Core;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Stylesheet
{
    /** @var array<string, array<string, array<string, string>>> */
    private $rules = [];

    /** @var array<string, string|int> */
    private $devices = [];

    public static function parseRules(array $rules): string
    {
        $parsed_rules = '';

        foreach ($rules as $selector => $properties) {
            $selector_content = self::parseProperties($properties);

            if ($selector_content) {
                $parsed_rules .= $selector . '{' . $selector_content . '}';
            }
        }

        return $parsed_rules;
    }

    public static function parseProperties(array $properties): string
    {
        $parsed_properties = '';

        foreach ($properties as $property_key => $property_value) {
            if ('' !== $property_value) {
                $parsed_properties .= $property_key . ':' . $property_value . ';';
            }
        }

        return $parsed_properties;
    }

    /**
     * @param string|int $device_max_point
     * @return $this
     */
    public function addDevice(string $device_name, $device_max_point): self
    {
        $this->devices[$device_name] = $device_max_point;

        return $this;
    }

    /**
     * @param array|string $rules
     * @return $this
     */
    public function addRules(string $selector, $rules, string $device = 'desktop'): self
    {
        if (!isset($this->rules[$device][$selector])) {
            $this->rules[$device][$selector] = [];
        }

        if (is_string($rules)) {
            $rules = array_filter(explode(';', $rules));

            $ordered_rules = [];

            foreach ($rules as $rule) {
                $property = explode(':', $rule, 2);

                if (count($property) < 2) {
                    return $this;
                }

                $ordered_rules[trim($property[0])] = trim($property[1], ' ;');
            }

            $rules = $ordered_rules;
        }

        $this->rules[$device][$selector] = array_merge($this->rules[$device][$selector], $rules);

        return $this;
    }

    public function __toString(): string
    {
        $style_text = '';

        if (isset($this->rules['desktop'])) {
            $device_text = self::parseRules($this->rules['desktop']);
            $style_text .= $device_text;
        }
        if (isset($this->rules['tablet'])) {
            $device_text = self::parseRules($this->rules['tablet']);
            $device_text = '@media(max-width: ' . $this->devices['tablet'] . 'px){' . $device_text . '}';
            $style_text .= $device_text;
        }
        if (isset($this->rules['mobile'])) {
            $device_text = self::parseRules($this->rules['mobile']);
            $device_text = '@media(max-width: ' . $this->devices['mobile'] . 'px){' . $device_text . '}';
            $style_text .= $device_text;
        }

        return $style_text;
    }
}
