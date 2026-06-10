<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class GoogleMaps extends WidgetBase
{
    public function getId(): string
    {
        return 'google_maps';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Google Maps');
    }

    public function getIcon(): string
    {
        return 'google-maps';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_map',
            [
                'label' => Translater::get()->l('Map'),
                'type' => ControlManager::SECTION,
            ]
        );

        $default_address = Translater::get()->l('London Eye, London, United Kingdom');
        $this->addControl(
            'address',
            [
                'label' => Translater::get()->l('Address'),
                'type' => ControlManager::TEXT,
                'placeholder' => $default_address,
                'default' => $default_address,
                'label_block' => true,
                'section' => 'section_map',
            ]
        );

        $this->addControl(
            'zoom',
            [
                'label' => Translater::get()->l('Zoom Level'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 10,
                ],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 20,
                    ],
                ],
                'section' => 'section_map',
            ]
        );

        $this->addControl(
            'height',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 300,
                ],
                'range' => [
                    'px' => [
                        'min' => 40,
                        'max' => 1440,
                    ],
                ],
                'section' => 'section_map',
                'selectors' => [
                    '{{WRAPPER}} iframe' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'prevent_scroll',
            [
                'label' => Translater::get()->l('Prevent Scroll'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'section' => 'section_map',
                'selectors' => [
                    '{{WRAPPER}} iframe' => 'pointer-events: none;',
                ],
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_map',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        if (empty($instance['address'])) {
            return;
        }

        if (0 === Helper::absint($instance['zoom']['size'])) {
            $instance['zoom']['size'] = 10;
        }

        printf(
            '<div class="elementor-custom-embed"><iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=%s&amp;t=m&amp;z=%d&amp;output=embed&amp;iwloc=near"></iframe></div>',
            urlencode($instance['address']),
            Helper::absint($instance['zoom']['size'])
        );
    }

    protected function contentTemplate(): void
    {
    }
}
