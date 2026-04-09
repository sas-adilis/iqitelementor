<?php

namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Image extends GroupControlBase
{
    public static function getType(): string
    {
        return 'image';
    }

    protected function getChildDefaultArgs(): array
    {
        return [
        ];
    }

    protected function getControlsInternal(array $args): array
    {

        $controls = [];

        $controls['settings'] = [
            'label' => Translater::get()->l('Choose Image'),
            'type' => ControlManager::MEDIA,
            'default' => [
                'url' => Utils::getPlaceholderImageSrc(),
            ],
        ];

        $controls['lazy'] = [
            'label' => Translater::get()->l('Lazy load'),
            'type' => ControlManager::SELECT,
            'default' => 'lazy',
            'description' => Translater::get()->l('If your widget is above the fold lazy load should be disabled'),
            'options' => [
                'lazy' => Translater::get()->l('Lazy'),
                'eager' => Translater::get()->l('Eager'),
            ],
        ];

        $controls['alt'] = [
            'label' => Translater::get()->l('Alt text'),
            'type' => ControlManager::TEXT,
            'default' => '',
            'placeholder' => Translater::get()->l('Enter your Alt about the image'),
        ];

        return $controls;
    }
}
