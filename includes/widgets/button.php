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
        return \IqitElementorTranslater::get()->l('Button');
    }

    public function get_icon()
    {
        return 'button';
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Button'),
            ]
        );

        $this->register_button_controls('section_content');
        $this->end_controls_section();

        $this->start_controls_section(
            'section_styles',
            [
                'label' => \IqitElementorTranslater::get()->l('Button'),
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
