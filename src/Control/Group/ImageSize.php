<?php
namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageSize extends GroupControlBase
{
    public static function getType(): string
    {
        return 'image-size';
    }

    protected function getChildDefaultArgs(): array
    {
        return [
            'include' => [],
            'exclude' => [],
        ];
    }

    private function getImageSizes(): array
    {
        $image_sizes = [];

        return $image_sizes;
    }

    protected function getControlsInternal(array $args): array
    {
        $controls = [];

        $image_sizes = $this->getImageSizes();

        // Get the first item for default value
        $default_value = array_keys($image_sizes);
        $default_value = array_shift($default_value);

        $controls['size'] = [
            'label' => Translater::get()->l('Image Size', 'Image Size Control'),
            'type' => ControlManager::SELECT,
            'options' => $image_sizes,
            'default' => $default_value,
        ];

        if (isset($image_sizes['custom'])) {
            $controls['custom_dimension'] = [
                'label' => Translater::get()->l('Image Dimension', 'Image Size Control'),
                'type' => ControlManager::IMAGE_DIMENSIONS,
                'description' => Translater::get()->l('You can crop the original image size to any custom size. You can also set a single value for height or width in order to keep the original size ratio.'),
                'condition' => [
                    'size' => ['custom'],
                ],
                'separator' => 'none',
            ];
        }

        return $controls;
    }

    public static function getAttachmentImageSrc(int $attachment_id, string $group_name, array $instance): string
    {
        return '';
    }
}
