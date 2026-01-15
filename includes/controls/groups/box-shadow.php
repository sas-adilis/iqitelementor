<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Group_Control_Box_Shadow extends Group_Control_Base
{
    public static function get_type(): string
    {
        return 'box-shadow';
    }

    protected function _get_controls($args): array
    {
        $controls = [];

        $controls['box_shadow_type'] = [
            'label' => \IqitElementorTranslater::get()->l('Box Shadow'),
            'type' => Controls_Manager::SWITCHER,
            'options' => [
                '' => \IqitElementorTranslater::get()->l('No'),
                'outset' => \IqitElementorTranslater::get()->l('Yes'),
            ],
        ];

        $controls['box_shadow'] = [
            'label' => \IqitElementorTranslater::get()->l('Box Shadow'),
            'type' => Controls_Manager::BOX_SHADOW,
            'selectors' => [
                $args['selector'] => 'box-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{SPREAD}}px {{COLOR}};',
            ],
            'condition' => [
                'box_shadow_type!' => '',
            ],
        ];

        return $controls;
    }
}
