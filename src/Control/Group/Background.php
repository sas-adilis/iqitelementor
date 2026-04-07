<?php

namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Background extends GroupControlBase
{
    public static function getType(): string
    {
        return 'background';
    }

    protected function getChildDefaultArgs(): array
    {
        return [
            'types' => ['classic'],
        ];
    }

    protected function getControlsInternal(array $args): array
    {
        $available_types = [
            'classic' => [
                'title' => Translater::get()->l('Classic', 'Background Control'),
                'icon' => 'fa fa-paint-brush',
            ],
            'gradient' => [
                'title' => Translater::get()->l('Gradient', 'Background Control'),
                'icon' => 'fa fa-barcode',
            ],
            'video' => [
                'title' => Translater::get()->l('Background Video', 'Background Control'),
                'icon' => 'fa fa-video-camera',
            ],
        ];

        $choose_types = [
            'none' => [
                'title' => Translater::get()->l('None', 'Background Control'),
                'icon' => 'fa fa-ban',
            ],
        ];

        foreach ($args['types'] as $type) {
            if (isset($available_types[$type])) {
                $choose_types[$type] = $available_types[$type];
            }
        }

        $controls = [];

        $controls['background'] = [
            'label' => Translater::get()->l('Background Type', 'Background Control'),
            'type' => ControlManager::CHOOSE,
            'default' => $args['default'],
            'options' => $choose_types,
            'label_block' => true,
        ];

        // Background:color
        if (in_array('classic', $args['types'])) {
            $controls['color'] = [
                'label' => Translater::get()->l('Color', 'Background Control'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'tab' => $args['tab'],
                'title' => Translater::get()->l('Background Color', 'Background Control'),
                'selectors' => [
                    $args['selector'] => 'background-color: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic', 'gradient'],
                ],
            ];

            if (in_array('gradient', $args['types'])) {
                $controls['color_stop'] = [
                    'label' => Translater::get()->l('Location', 'Background Control'),
                    'type' => ControlManager::SLIDER,
                    'size_units' => ['%'],
                    'default' => [
                        'unit' => '%',
                        'size' => 0,
                    ],
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['color_b'] = [
                    'label' => Translater::get()->l('Second Color', 'Background Control'),
                    'type' => ControlManager::COLOR,
                    'default' => 'transparent',
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['color_b_stop'] = [
                    'label' => Translater::get()->l('Location', 'Background Control'),
                    'type' => ControlManager::SLIDER,
                    'size_units' => ['%'],
                    'default' => [
                        'unit' => '%',
                        'size' => 100,
                    ],
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['gradient_type'] = [
                    'label' => Translater::get()->l('Type', 'Background Control'),
                    'type' => ControlManager::SELECT,
                    'options' => [
                        'linear' => Translater::get()->l('Linear', 'Background Control'),
                        'radial' => Translater::get()->l('Radial', 'Background Control'),
                    ],
                    'default' => 'linear',
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['gradient_angle'] = [
                    'label' => Translater::get()->l('Angle', 'Background Control'),
                    'type' => ControlManager::SLIDER,
                    'size_units' => ['deg'],
                    'default' => [
                        'unit' => 'deg',
                        'size' => 180,
                    ],
                    'range' => [
                        'deg' => [
                            'step' => 10,
                        ],
                    ],
                    'selectors' => [
                        $args['selector'] => 'background-image: linear-gradient({{SIZE}}{{UNIT}}, {{color.VALUE}} {{color_stop.SIZE}}{{color_stop.UNIT}}, {{color_b.VALUE}} {{color_b_stop.SIZE}}{{color_b_stop.UNIT}})',
                    ],
                    'condition' => [
                        'background' => ['gradient'],
                        'gradient_type' => 'linear',
                    ],
                ];
                $controls['gradient_position'] = [
                    'label' => Translater::get()->l('Position', 'Background Control'),
                    'type' => ControlManager::SELECT,
                    'options' => [
                        'center center' => Translater::get()->l('Center Center', 'Background Control'),
                        'center left' => Translater::get()->l('Center Left', 'Background Control'),
                        'center right' => Translater::get()->l('Center Right', 'Background Control'),
                        'top center' => Translater::get()->l('Top Center', 'Background Control'),
                        'top left' => Translater::get()->l('Top Left', 'Background Control'),
                        'top right' => Translater::get()->l('Top Right', 'Background Control'),
                        'bottom center' => Translater::get()->l('Bottom Center', 'Background Control'),
                        'bottom left' => Translater::get()->l('Bottom Left', 'Background Control'),
                        'bottom right' => Translater::get()->l('Bottom Right', 'Background Control'),
                    ],
                    'default' => 'center center',
                    'selectors' => [
                        $args['selector'] => 'background-image: radial-gradient(at {{VALUE}}, {{color.VALUE}} {{color_stop.SIZE}}{{color_stop.UNIT}}, {{color_b.VALUE}} {{color_b_stop.SIZE}}{{color_b_stop.UNIT}})',
                    ],
                    'condition' => [
                        'background' => ['gradient'],
                        'gradient_type' => 'radial',
                    ],
                ];
            }
        }
        // End Background:color

        // Background:image
        if (in_array('classic', $args['types'])) {
            $controls['image'] = [
                'label' => Translater::get()->l('Image', 'Background Control'),
                'type' => ControlManager::MEDIA,
                'title' => Translater::get()->l('Background Image', 'Background Control'),
                'selectors' => [
                    $args['selector'] => 'background-image: url("{{URL}}");',
                ],
                'condition' => [
                    'background' => ['classic'],
                ],
            ];

            $controls['position'] = [
                'label' => Translater::get()->l('Position', 'Background Control'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('None', 'Background Control'),
                    'top left' => Translater::get()->l('Top Left', 'Background Control'),
                    'top center' => Translater::get()->l('Top Center', 'Background Control'),
                    'top right' => Translater::get()->l('Top Right', 'Background Control'),
                    'center left' => Translater::get()->l('Center Left', 'Background Control'),
                    'center center' => Translater::get()->l('Center Center', 'Background Control'),
                    'center right' => Translater::get()->l('Center Right', 'Background Control'),
                    'bottom left' => Translater::get()->l('Bottom Left', 'Background Control'),
                    'bottom center' => Translater::get()->l('Bottom Center', 'Background Control'),
                    'bottom right' => Translater::get()->l('Bottom Right', 'Background Control'),
                ],
                'selectors' => [
                    $args['selector'] => 'background-position: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic'],
                    'image[url]!' => '',
                ],
            ];

            $controls['attachment'] = [
                'label' => Translater::get()->l('Attachment', 'Background Control'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('None', 'Background Control'),
                    'scroll' => Translater::get()->l('Scroll', 'Background Control'),
                    'fixed' => Translater::get()->l('Fixed', 'Background Control'),
                ],
                'selectors' => [
                    $args['selector'] => 'background-attachment: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic'],
                    'image[url]!' => '',
                ],
            ];

            $controls['repeat'] = [
                'label' => Translater::get()->l('Repeat', 'Background Control'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('None', 'Background Control'),
                    'no-repeat' => Translater::get()->l('No-repeat', 'Background Control'),
                    'repeat' => Translater::get()->l('Repeat', 'Background Control'),
                    'repeat-x' => Translater::get()->l('Repeat-x', 'Background Control'),
                    'repeat-y' => Translater::get()->l('Repeat-y', 'Background Control'),
                ],
                'selectors' => [
                    $args['selector'] => 'background-repeat: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic'],
                    'image[url]!' => '',
                ],
            ];

            $controls['size'] = [
                'label' => Translater::get()->l('Size', 'Background Control'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('None', 'Background Control'),
                    'auto' => Translater::get()->l('Auto', 'Background Control'),
                    'cover' => Translater::get()->l('Cover', 'Background Control'),
                    'contain' => Translater::get()->l('Contain', 'Background Control'),
                ],
                'selectors' => [
                    $args['selector'] => 'background-size: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic'],
                    'image[url]!' => '',
                ],
            ];
        }
        // End Background:image

        // Background:video

        $controls['video_type']
            = [
            'label' => Translater::get()->l('Video Type'),
            'type' => ControlManager::SELECT,
            'section' => 'section_video',
            'default' => 'youtube',
            'options' => [
                'youtube' => Translater::get()->l('YouTube'),
                'hosted' => Translater::get()->l('HTML5 Video'),
            ],
        ];

        $controls['video_link'] = [
            'label' => Translater::get()->l('Video Link', 'Background Control'),
            'type' => ControlManager::TEXT,
            'placeholder' => 'https://www.youtube.com/watch?v=9uOETcuFjbE',
            'description' => Translater::get()->l('Insert YouTube link'),
            'label_block' => true,
            'default' => '',
            'condition' => [
                'background' => ['video'],
                'video_type' => ['youtube'],
            ],
        ];

        $controls['video_link_h'] = [
            'label' => Translater::get()->l('Mp4 video Link', 'Background Control'),
            'type' => ControlManager::URL,
            'placeholder' => '',
            'description' => Translater::get()->l('video file (mp4 is recommended)'),
            'label_block' => true,
            'show_external' => false,
            'default' => '',
            'condition' => [
                'background' => ['video'],
                'video_type' => ['hosted'],
            ],
        ];

        $controls['video_fallback'] = [
            'label' => Translater::get()->l('Background Fallback', 'Background Control'),
            'description' => Translater::get()->l('This cover image will replace the background video on mobile or tablet.'),
            'type' => ControlManager::MEDIA,
            'label_block' => true,
            'condition' => [
                'background' => ['video'],
            ],
            'selectors' => [
                $args['selector'] . ' .elementor-background-video-fallback' => 'background: url("{{URL}}") 50% 50%; background-size: cover;',
            ],
        ];
        // End Background:video

        return $controls;
    }
}
