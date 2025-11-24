<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Menu_Anchor extends Widget_Base
{
    public function get_id()
    {
        return 'menu-anchor';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Menu anchor', 'elementor');
    }

    public function get_icon()
    {
        return 'anchor';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorWpHelper::__('Anchor', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'anchor',
            [
                'label' => 'The ID of Menu Anchor.',
                'type' => Controls_Manager::TEXT,
                'default' => '',
                'placeholder' => \IqitElementorWpHelper::__('For Example: About', 'elementor'),
                'description' => \IqitElementorWpHelper::__('This ID will be the CSS ID you will have to use in your own page, Without #. Make sure that ID is unique per page', 'elementor'),
                'section' => 'section_title',
                'label_block' => true,
            ]
        );

        $this->add_control(
            'anchor_note',
            [
                'raw' => \IqitElementorWpHelper::__('Note: The ID link ONLY accepts these chars: `A-Z, a-z, 0-9, _ , -', 'elementor'),
                'type' => Controls_Manager::RAW_HTML,
                'section' => 'section_title',
                'classes' => 'elementor-control-descriptor elementor-panel-alert elementor-panel-alert-warning',
            ]
        );
    }

    protected function render($instance = [])
    {
        if ($instance['anchor']) {
            echo '<div class="elementor-menu-anchor" id="' . $instance['anchor'] . '"></div>';
        }
    }

    protected function content_template()
    {
        ?>
        <div class="elementor-menu-anchor"{{{ settings.anchor ? ' id="' + settings.anchor + '"' : '' }}}></div>
		<?php
    }
}
