<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Group_Control_Background extends Group_Control_Base
{
    public static function get_type()
    {
        return 'background';
    }

    protected function _get_child_default_args()
    {
        return [
            'types' => ['classic'],
        ];
    }

    protected function _get_controls($args)
    {
        $available_types = [
            'classic' => [
                'title' => \IqitElementorTranslater::get()->l('Classic', 'Background Control', 'elementor'),
                'icon' => 'fa fa-paint-brush',
            ],
            'gradient' => [
                'title' => \IqitElementorTranslater::get()->l('Gradient', 'Background Control', 'elementor'),
                'icon' => 'fa fa-barcode',
            ],
            'video' => [
                'title' => \IqitElementorTranslater::get()->l('Background Video', 'Background Control', 'elementor'),
                'icon' => 'fa fa-video-camera',
            ],
        ];

        $choose_types = [
            'none' => [
                'title' => \IqitElementorTranslater::get()->l('None', 'Background Control', 'elementor'),
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
            'label' => \IqitElementorTranslater::get()->l('Background Type', 'Background Control', 'elementor'),
            'type' => Controls_Manager::CHOOSE,
            'default' => $args['default'],
            'options' => $choose_types,
            'label_block' => true,
        ];

        // Background:color
        if (in_array('classic', $args['types'])) {
            $controls['color'] = [
                'label' => \IqitElementorTranslater::get()->l('Color', 'Background Control', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'tab' => $args['tab'],
                'title' => \IqitElementorTranslater::get()->l('Background Color', 'Background Control', 'elementor'),
                'selectors' => [
                    $args['selector'] => 'background-color: {{VALUE}};',
                ],
                'condition' => [
                    'background' => ['classic', 'gradient'],
                ],
            ];

            if (in_array('gradient', $args['types'])) {
                $controls['color_stop'] = [
                    'label' => \IqitElementorTranslater::get()->l('Location', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::SLIDER,
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
                    'label' => \IqitElementorTranslater::get()->l('Second Color', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::COLOR,
                    'default' => 'transparent',
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['color_b_stop'] = [
                    'label' => \IqitElementorTranslater::get()->l('Location', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::SLIDER,
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
                    'label' => \IqitElementorTranslater::get()->l('Type', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'options' => [
                        'linear' => \IqitElementorTranslater::get()->l('Linear', 'Background Control', 'elementor'),
                        'radial' => \IqitElementorTranslater::get()->l('Radial', 'Background Control', 'elementor'),
                    ],
                    'default' => 'linear',
                    'render_type' => 'ui',
                    'condition' => [
                        'background' => ['gradient'],
                    ],
                ];
                $controls['gradient_angle'] = [
                    'label' => \IqitElementorTranslater::get()->l('Angle', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::SLIDER,
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
                    'label' => \IqitElementorTranslater::get()->l('Position', 'Background Control', 'elementor'),
                    'type' => Controls_Manager::SELECT,
                    'options' => [
                        'center center' => \IqitElementorTranslater::get()->l('Center Center', 'Background Control', 'elementor'),
                        'center left' => \IqitElementorTranslater::get()->l('Center Left', 'Background Control', 'elementor'),
                        'center right' => \IqitElementorTranslater::get()->l('Center Right', 'Background Control', 'elementor'),
                        'top center' => \IqitElementorTranslater::get()->l('Top Center', 'Background Control', 'elementor'),
                        'top left' => \IqitElementorTranslater::get()->l('Top Left', 'Background Control', 'elementor'),
                        'top right' => \IqitElementorTranslater::get()->l('Top Right', 'Background Control', 'elementor'),
                        'bottom center' => \IqitElementorTranslater::get()->l('Bottom Center', 'Background Control', 'elementor'),
                        'bottom left' => \IqitElementorTranslater::get()->l('Bottom Left', 'Background Control', 'elementor'),
                        'bottom right' => \IqitElementorTranslater::get()->l('Bottom Right', 'Background Control', 'elementor'),
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
                'label' => \IqitElementorTranslater::get()->l('Image', 'Background Control', 'elementor'),
                'type' => Controls_Manager::MEDIA,
                'title' => \IqitElementorTranslater::get()->l('Background Image', 'Background Control', 'elementor'),
                'selectors' => [
                    $args['selector'] => 'background-image: url("{{URL}}");',
                ],
                'condition' => [
                    'background' => ['classic'],
                ],
            ];

            $controls['position'] = [
                'label' => \IqitElementorTranslater::get()->l('Position', 'Background Control', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('None', 'Background Control', 'elementor'),
                    'top left' => \IqitElementorTranslater::get()->l('Top Left', 'Background Control', 'elementor'),
                    'top center' => \IqitElementorTranslater::get()->l('Top Center', 'Background Control', 'elementor'),
                    'top right' => \IqitElementorTranslater::get()->l('Top Right', 'Background Control', 'elementor'),
                    'center left' => \IqitElementorTranslater::get()->l('Center Left', 'Background Control', 'elementor'),
                    'center center' => \IqitElementorTranslater::get()->l('Center Center', 'Background Control', 'elementor'),
                    'center right' => \IqitElementorTranslater::get()->l('Center Right', 'Background Control', 'elementor'),
                    'bottom left' => \IqitElementorTranslater::get()->l('Bottom Left', 'Background Control', 'elementor'),
                    'bottom center' => \IqitElementorTranslater::get()->l('Bottom Center', 'Background Control', 'elementor'),
                    'bottom right' => \IqitElementorTranslater::get()->l('Bottom Right', 'Background Control', 'elementor'),
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
                'label' => \IqitElementorTranslater::get()->l('Attachment', 'Background Control', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('None', 'Background Control', 'elementor'),
                    'scroll' => \IqitElementorTranslater::get()->l('Scroll', 'Background Control', 'elementor'),
                    'fixed' => \IqitElementorTranslater::get()->l('Fixed', 'Background Control', 'elementor'),
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
                'label' => \IqitElementorTranslater::get()->l('Repeat', 'Background Control', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('None', 'Background Control', 'elementor'),
                    'no-repeat' => \IqitElementorTranslater::get()->l('No-repeat', 'Background Control', 'elementor'),
                    'repeat' => \IqitElementorTranslater::get()->l('Repeat', 'Background Control', 'elementor'),
                    'repeat-x' => \IqitElementorTranslater::get()->l('Repeat-x', 'Background Control', 'elementor'),
                    'repeat-y' => \IqitElementorTranslater::get()->l('Repeat-y', 'Background Control', 'elementor'),
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
                'label' => \IqitElementorTranslater::get()->l('Size', 'Background Control', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('None', 'Background Control', 'elementor'),
                    'auto' => \IqitElementorTranslater::get()->l('Auto', 'Background Control', 'elementor'),
                    'cover' => \IqitElementorTranslater::get()->l('Cover', 'Background Control', 'elementor'),
                    'contain' => \IqitElementorTranslater::get()->l('Contain', 'Background Control', 'elementor'),
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
            'label' => \IqitElementorTranslater::get()->l('Video Type', 'elementor'),
            'type' => Controls_Manager::SELECT,
            'section' => 'section_video',
            'default' => 'youtube',
            'options' => [
                'youtube' => \IqitElementorTranslater::get()->l('YouTube', 'elementor'),
                'hosted' => \IqitElementorTranslater::get()->l('HTML5 Video', 'elementor'),
            ],
        ];

        $controls['video_link'] = [
            'label' => \IqitElementorTranslater::get()->l('Video Link', 'Background Control', 'elementor'),
            'type' => Controls_Manager::TEXT,
            'placeholder' => 'https://www.youtube.com/watch?v=9uOETcuFjbE',
            'description' => \IqitElementorTranslater::get()->l('Insert YouTube link', 'elementor'),
            'label_block' => true,
            'default' => '',
            'condition' => [
                'background' => ['video'],
                'video_type' => ['youtube'],
            ],
        ];

        $controls['video_link_h'] = [
            'label' => \IqitElementorTranslater::get()->l('Mp4 video Link', 'Background Control', 'elementor'),
            'type' => Controls_Manager::URL,
            'placeholder' => '',
            'description' => \IqitElementorTranslater::get()->l('video file (mp4 is recommended)', 'elementor'),
            'label_block' => true,
            'show_external' => false,
            'default' => '',
            'condition' => [
                'background' => ['video'],
                'video_type' => ['hosted'],
            ],
        ];

        $controls['video_fallback'] = [
            'label' => \IqitElementorTranslater::get()->l('Background Fallback', 'Background Control', 'elementor'),
            'description' => \IqitElementorTranslater::get()->l('This cover image will replace the background video on mobile or tablet.', 'elementor'),
            'type' => Controls_Manager::MEDIA,
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
