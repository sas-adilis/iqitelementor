<?php
namespace IqitElementor\Core;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

use IqitElementor\Helper\Helper;

class Responsive
{
    public const BREAKPOINT_OPTION_PREFIX = 'elementor_viewport_';

    /** @var array<string, int> */
    private static $_default_breakpoints = [
        'xs' => 0,
        'sm' => 576,
        'md' => 768,
        'lg' => 992,
        'xl' => 1200,
    ];

    /** @var string[] */
    private static $_editable_breakpoints_keys = [
        'md',
        'lg',
    ];

    public static function getDefaultBreakpoints(): array
    {
        return self::$_default_breakpoints;
    }

    public static function getEditableBreakpoints(): array
    {
        return array_intersect_key(self::getBreakpoints(), array_flip(self::$_editable_breakpoints_keys));
    }

    public static function getBreakpoints(): array
    {
        return array_reduce(array_keys(self::$_default_breakpoints), function ($new_array, $breakpoint_key) {
            if (!in_array($breakpoint_key, self::$_editable_breakpoints_keys)) {
                $new_array[$breakpoint_key] = self::$_default_breakpoints[$breakpoint_key];
            } else {
                $saved_option = Helper::getOption(self::BREAKPOINT_OPTION_PREFIX . $breakpoint_key);
                $new_array[$breakpoint_key] = $saved_option ? (int) $saved_option : self::$_default_breakpoints[$breakpoint_key];
            }

            return $new_array;
        }, []);
    }
}
