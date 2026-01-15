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
            'label' => \IqitElementorTranslater::get()->l('Choose Image'),
            'type' => Controls_Manager::MEDIA,
            'default' => [
                'url' => UtilsElementor::get_placeholder_image_src(),
            ],
        ];

        $controls['lazy'] = [
            'label' => \IqitElementorTranslater::get()->l('Lazy load'),
            'type' => Controls_Manager::SELECT,
            'default' => 'lazy',
            'description' => \IqitElementorTranslater::get()->l('If your widget is above the fold lazy load should be disabled'),
            'options' => [
                'lazy' => \IqitElementorTranslater::get()->l('Lazy'),
                'eager' => \IqitElementorTranslater::get()->l('Eager'),
            ],
        ];

        $controls['alt'] = [
            'label' => \IqitElementorTranslater::get()->l('Alt text'),
            'type' => Controls_Manager::TEXT,
            'default' => '',
            'placeholder' => \IqitElementorTranslater::get()->l('Enter your Alt about the image'),
        ];

        return $controls;
    }
}
