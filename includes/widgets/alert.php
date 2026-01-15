<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Alert extends Widget_Base
{
    public function get_id()
    {
        return 'alert';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Alert', 'elementor');
    }

    public function get_icon()
    {
        return 'alert';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_alert',
            [
                'label' => \IqitElementorTranslater::get()->l('Alert', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'alert_type',
            [
                'label' => \IqitElementorTranslater::get()->l('Type', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'info',
                'section' => 'section_alert',
                'options' => [
                    'primary' => \IqitElementorTranslater::get()->l('Primary', 'elementor'),
                    'secondary' => \IqitElementorTranslater::get()->l('Secondary', 'elementor'),
                    'info' => \IqitElementorTranslater::get()->l('Info', 'elementor'),
                    'success' => \IqitElementorTranslater::get()->l('Success', 'elementor'),
                    'warning' => \IqitElementorTranslater::get()->l('Warning', 'elementor'),
                    'danger' => \IqitElementorTranslater::get()->l('Danger', 'elementor'),
                    'light' => \IqitElementorTranslater::get()->l('Light', 'elementor'),
                    'dark' => \IqitElementorTranslater::get()->l('Dark', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'alert_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title & Description', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => \IqitElementorTranslater::get()->l('Your Title', 'elementor'),
                'default' => \IqitElementorTranslater::get()->l('This is Alert', 'elementor'),
                'label_block' => true,
                'section' => 'section_alert',
            ]
        );

        $this->add_control(
            'alert_description',
            [
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                'type' => Controls_Manager::TEXTAREA,
                'placeholder' => \IqitElementorTranslater::get()->l('Your Description', 'elementor'),
                'default' => \IqitElementorTranslater::get()->l('I am description. Click edit button to change this text.', 'elementor'),
                'separator' => 'none',
                'section' => 'section_alert',
                'show_label' => false,
            ]
        );

        $this->add_control(
            'show_dismiss',
            [
                'label' => \IqitElementorTranslater::get()->l('Dismiss Button', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'show',
                'section' => 'section_alert',
                'options' => [
                    'show' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                    'hide' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_alert',
            ]
        );

        $this->add_control(
            'section_type',
            [
                'label' => \IqitElementorTranslater::get()->l('Alert Type', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'background',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_type',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'border_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_type',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'alert_title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selector' => '{{WRAPPER}} .elementor-alert-title',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
            ]
        );

        $this->add_control(
            'section_description',
            [
                'label' => \IqitElementorTranslater::get()->l('Description', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'description_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_description',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert-description' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'alert_description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_description',
                'selector' => '{{WRAPPER}} .elementor-alert-description',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    /*protected function render($instance = [])
    {
        if (empty($instance['alert_title']) && empty($instance['alert_description'])) {
            return;
        }

        if (!empty($instance['alert_type'])) {
            $this->add_render_attribute('wrapper', 'class', 'elementor-alert alert alert-' . $instance['alert_type']);
        }

        echo '<div ' . $this->get_render_attribute_string('wrapper') . ' role="alert">';
        $html = sprintf('<span class="elementor-alert-title">%1$s</span>', $instance['alert_title']);

        if (!empty($instance['alert_description'])) {
            $html .= sprintf('<span class="elementor-alert-description">%s</span>', $instance['alert_description']);
        }

        if (!empty($instance['show_dismiss']) && 'show' === $instance['show_dismiss']) {
            $html .= '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
        }

        $html .= '</div>';

        echo $html;
    }*/

    public function parse_options($optionsSource, $preview = false)
    {
        return $optionsSource;
    }
}
