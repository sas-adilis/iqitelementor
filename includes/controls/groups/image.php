<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Group_Control_Image extends Group_Control_Base
{
    public static function get_type()
    {
        return 'image';
    }

    protected function _get_child_default_args()
    {
        return [
        ];
    }

    protected function _get_controls($args)
    {

        $controls = [];

        $controls['settings'] = [
            'label' => \IqitElementorWpHelper::__('Choose Image', 'elementor'),
            'type' => Controls_Manager::MEDIA,
            'default' => [
                'url' => UtilsElementor::get_placeholder_image_src(),
            ],
        ];

        $controls['lazy'] = [
            'label' => \IqitElementorWpHelper::__('Lazy load', 'elementor'),
            'type' => Controls_Manager::SELECT,
            'default' => 'lazy',
            'description' => \IqitElementorWpHelper::__('If your widget is above the fold lazy load should be disabled', 'elementor'),
            'options' => [
                'lazy' => \IqitElementorWpHelper::__('Lazy', 'elementor'),
                'eager' => \IqitElementorWpHelper::__('Eager', 'elementor'),
            ],
        ];

        $controls['alt'] = [
            'label' => \IqitElementorWpHelper::__('Alt text', 'elementor'),
            'type' => Controls_Manager::TEXT,
            'default' => '',
            'placeholder' => \IqitElementorWpHelper::__('Enter your Alt about the image', 'elementor'),
            'title' => \IqitElementorWpHelper::__('Input image Alt here', 'elementor'),
        ];

        return $controls;
    }
}
