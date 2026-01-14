<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Button extends Widget_Base
{
    use IqitElementorButtonTrait;

    public function get_id()
    {
        return 'button';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Button', 'elementor');
    }

    public function get_icon()
    {
        return 'button';
    }

    public static function get_button_sizes()
    {
        return [
            'sm' => \IqitElementorWpHelper::__('Small', 'elementor'),
            'default' => \IqitElementorWpHelper::__('Default', 'elementor'),
            'lg' => \IqitElementorWpHelper::__('Large', 'elementor'),
        ];
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorWpHelper::__('Button', 'elementor'),
            ]
        );

        $this->register_button_controls('section_content');
        $this->end_controls_section();

        $this->start_controls_section(
            'section_styles',
            [
                'label' => \IqitElementorWpHelper::__('Button', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->register_button_styles('section_styles');
        $this->end_controls_section();

    }

    public function parse_options($optionsSource, $preview = false)
    {
        return $this->build_button_options($optionsSource);
    }
}
