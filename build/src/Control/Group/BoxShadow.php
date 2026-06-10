<?php
namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class BoxShadow extends GroupControlBase
{
    public static function getType(): string
    {
        return 'box-shadow';
    }

    protected function getControlsInternal(array $args): array
    {
        $controls = [];

        $controls['box_shadow_type'] = [
            'label' => Translater::get()->l('Box Shadow'),
            'type' => ControlManager::SWITCHER,
            'options' => [
                '' => Translater::get()->l('No'),
                'outset' => Translater::get()->l('Yes'),
            ],
        ];

        $controls['box_shadow'] = [
            'label' => Translater::get()->l('Box Shadow'),
            'type' => ControlManager::BOX_SHADOW,
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
