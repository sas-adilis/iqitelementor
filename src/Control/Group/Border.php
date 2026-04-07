<?php
namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Border extends GroupControlBase
{
    public static function getType(): string
    {
        return 'border';
    }

    protected function getControlsInternal(array $args): array
    {
        $controls = [];

        $property = 'border';
        if (isset($args['property']) && ($args['property'] == 'outline')) {
            $property = 'outline';
        }

        $controls['border'] = [
            'label' => Translater::get()->l('Border Type', 'Border Control'),
            'type' => ControlManager::SELECT,
            'options' => [
                '' => Translater::get()->l('None'),
                'solid' => Translater::get()->l('Solid', 'Border Control'),
                'double' => Translater::get()->l('Double', 'Border Control'),
                'dotted' => Translater::get()->l('Dotted', 'Border Control'),
                'dashed' => Translater::get()->l('Dashed', 'Border Control'),
            ],
            'selectors' => [
                $args['selector'] => $property . '-style: {{VALUE}};',
            ],
        ];

        if (isset($args['separator']) && $args['separator']) {
            $controls['border']['separator'] = $args['separator'];
        }

        $controls['color'] = [
            'label' => Translater::get()->l('Border color', 'Border Control'),
            'type' => ControlManager::COLOR,
            'default' => '',
            'tab' => $args['tab'],
            'selectors' => [
                $args['selector'] => $property . '-color: {{VALUE}};',
            ],
            'condition' => [
                'border!' => '',
            ],
        ];

        $controls['width'] = [
            'label' => Translater::get()->l('Border width', 'Border Control'),
            'type' => ControlManager::DIMENSIONS,
            'responsive' => true,
            'selectors' => [
                $args['selector'] => $property . '-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
            ],
            'condition' => [
                'border!' => '',
            ],
        ];

        return $controls;
    }
}
