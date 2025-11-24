<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Html extends Widget_Base
{
    public function get_id()
    {
        return 'html';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('HTML', 'elementor');
    }

    public function get_icon()
    {
        return 'code';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorWpHelper::__('HTML Code', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'html',
            [
                'label' => '',
                'type' => Controls_Manager::TEXTAREA,
                'default' => '',
                'description' => \IqitElementorWpHelper::__('DO NOT use it for CSS or JS codes. Only clean HTML will work. For more advance code please use "custom tpl" widget', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Enter your embed code here', 'elementor'),
                'section' => 'section_title',
                'show_label' => false,
            ]
        );
    }

    protected function render($instance = [])
    {
        echo $instance['html'];
    }

    protected function content_template()
    {
        ?>
		{{{ settings.html }}}
		<?php
    }
}
