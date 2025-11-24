<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

abstract class Scheme_Base implements Scheme_Interface
{
    public function get_scheme_value()
    {
        $scheme_values = $this->get_default_scheme();

        return $scheme_values;
    }

    public function get_scheme()
    {
        $schemes = [];

        foreach ($this->get_scheme_titles() as $scheme_key => $scheme_title) {
            $schemes[$scheme_key] = [
                'title' => $scheme_title,
                'value' => $this->get_scheme_value()[$scheme_key],
            ];
        }

        return $schemes;
    }
}
