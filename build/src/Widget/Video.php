<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Video extends WidgetBase
{
    protected $currentInstance = [];

    public function getId(): string
    {
        return 'video';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Video');
    }

    public function getIcon(): string
    {
        return 'youtube';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_video',
            [
                'label' => Translater::get()->l('Video'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'video_type',
            [
                'label' => Translater::get()->l('Video Type'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'default' => 'youtube',
                'options' => [
                    'youtube' => Translater::get()->l('YouTube'),
                    // 'youtube_nocookie' => Translater::get()->l( 'YouTube without cookies', 'elementor' ),
                    'vimeo' => Translater::get()->l('Vimeo'),
                    'hosted' => Translater::get()->l('HTML5 Video'),
                ],
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link'),
                'type' => ControlManager::TEXT,
                'section' => 'section_video',
                'placeholder' => Translater::get()->l('Enter your YouTube link'),
                'default' => 'https://www.youtube.com/watch?v=9uOETcuFjbE',
                'label_block' => true,
                'condition' => [
                    'video_type' => 'youtube',
                ],
            ]
        );

        $this->addControl(
            'vimeo_link',
            [
                'label' => Translater::get()->l('Vimeo Link'),
                'type' => ControlManager::TEXT,
                'section' => 'section_video',
                'placeholder' => Translater::get()->l('Enter your Vimeo link'),
                'default' => 'https://vimeo.com/170933924',
                'label_block' => true,

                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'hosted_link',
            [
                'label' => Translater::get()->l('Link'),
                'type' => ControlManager::URL,
                'section' => 'section_video',
                'placeholder' => Translater::get()->l('Enter your video link'),
                'default' => '',
                'label_block' => true,
                'show_external' => false,
                'condition' => [
                    'video_type' => 'hosted',
                ],
            ]
        );

        $this->addControl(
            'aspect_ratio',
            [
                'label' => Translater::get()->l('Aspect Ratio'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    '169' => '16:9',
                    '43' => '4:3',
                    '32' => '3:2',
                    'auto' => 'auto',
                ],
                'default' => '169',
                'prefix_class' => 'elementor-aspect-ratio-',
            ]
        );

        $this->addControl(
            'heading_youtube',
            [
                'label' => Translater::get()->l('Video Options'),
                'type' => ControlManager::HEADING,
                'section' => 'section_video',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'in_modal',
            [
                'label' => Translater::get()->l('In modal'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'default' => 'no',
            ]
        );

        // STYLE TAB
        $this->addControl(
            'section_style',
            [
                'label' => Translater::get()->l('Modal trigger'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'in_modal' => 'yes',
                ],
            ]
        );

        $this->addControl(
            'shape_size',
            [
                'label' => Translater::get()->l('Shape height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 80,
                ],
                'range' => [
                    'px' => [
                        'min' => 16,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-video-open-modal i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
            ]
        );

        $this->addControl(
            'modal_play_color',
            [
                'label' => Translater::get()->l('Play Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-video-open-modal' => 'color: {{VALUE}};',
                ],
                'condition' => [
                    'in_modal' => 'yes',
                ],
            ]
        );

        $this->addControl(
            'modal_play_align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Center'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'default' => 'center',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'condition' => [
                    'in_modal' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        // Hosted
        $this->addControl(
            'ht_autoplay',
            [
                'label' => Translater::get()->l('Autoplay'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes (and muted)'),
                ],
                'condition' => [
                    'video_type' => 'hosted',
                ],
                'default' => 'no',
            ]
        );

        $this->addControl(
            'ht_controls',
            [
                'label' => Translater::get()->l('Controls'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'condition' => [
                    'video_type' => 'hosted',
                ],
                'default' => 'no',
            ]
        );

        $this->addControl(
            'ht_loop',
            [
                'label' => Translater::get()->l('Loop'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'condition' => [
                    'video_type' => 'hosted',
                ],
                'default' => 'no',
            ]
        );

        $this->addControl(
            'ht_muted',
            [
                'label' => Translater::get()->l('Muted'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'condition' => [
                    'video_type' => 'hosted',
                    'ht_autoplay' => 'no',
                ],
                'default' => 'no',
            ]
        );

        // YouTube
        $this->addControl(
            'yt_autoplay',
            [
                'label' => Translater::get()->l('Autoplay'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'condition' => [
                    'video_type' => 'youtube',
                ],
                'default' => 'no',
            ]
        );

        $this->addControl(
            'yt_loop',
            [
                'label' => Translater::get()->l('Loop'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'condition' => [
                    'video_type' => 'youtube',
                ],
                'default' => 'no',
            ]
        );

        $this->addControl(
            'yt_rel',
            [
                'label' => Translater::get()->l('Suggested Videos'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('Hide'),
                    'yes' => Translater::get()->l('Show'),
                ],
                'default' => 'no',
                'condition' => [
                    'video_type' => 'youtube',
                ],
            ]
        );

        $this->addControl(
            'yt_controls',
            [
                'label' => Translater::get()->l('Player Control'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'yes' => Translater::get()->l('Show'),
                    'no' => Translater::get()->l('Hide'),
                ],
                'default' => 'yes',
                'condition' => [
                    'video_type' => 'youtube',
                ],
            ]
        );

        // Vimeo
        $this->addControl(
            'vimeo_autoplay',
            [
                'label' => Translater::get()->l('Autoplay'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'default' => 'no',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'vimeo_loop',
            [
                'label' => Translater::get()->l('Loop'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
                'default' => 'no',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'vimeo_title',
            [
                'label' => Translater::get()->l('Intro Title'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'yes' => Translater::get()->l('Show'),
                    'no' => Translater::get()->l('Hide'),
                ],
                'default' => 'yes',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'vimeo_portrait',
            [
                'label' => Translater::get()->l('Intro Portrait'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'yes' => Translater::get()->l('Show'),
                    'no' => Translater::get()->l('Hide'),
                ],
                'default' => 'yes',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'vimeo_byline',
            [
                'label' => Translater::get()->l('Intro Byline'),
                'type' => ControlManager::SELECT,
                'section' => 'section_video',
                'options' => [
                    'yes' => Translater::get()->l('Show'),
                    'no' => Translater::get()->l('Hide'),
                ],
                'default' => 'yes',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'vimeo_color',
            [
                'label' => Translater::get()->l('Controls Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_video',
                'default' => '',
                'condition' => [
                    'video_type' => 'vimeo',
                ],
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'section' => 'section_video',
                'default' => 'youtube',
            ]
        );

        $this->addControl(
            'section_image_overlay',
            [
                'label' => Translater::get()->l('Image Overlay'),
                'type' => ControlManager::SECTION,
                'condition' => [
                    'in_modal' => 'no',
                ],
            ]
        );

        $this->addControl(
            'show_image_overlay',
            [
                'label' => Translater::get()->l('Image Overlay'),
                'type' => ControlManager::SELECT,
                'default' => 'no',
                'options' => [
                    'no' => Translater::get()->l('Hide'),
                    'yes' => Translater::get()->l('Show'),
                ],
                'condition' => [
                    'in_modal' => 'no',
                ],
                'section' => 'section_image_overlay',
            ]
        );

        $this->addControl(
            'image_overlay',
            [
                'label' => Translater::get()->l('Image'),
                'type' => ControlManager::MEDIA,
                'default' => [
                    'url' => Utils::getPlaceholderImageSrc(),
                ],
                'section' => 'section_image_overlay',
                'condition' => [
                    'show_image_overlay' => 'yes',
                    'in_modal' => 'no',
                ],
            ]
        );

        $this->addControl(
            'show_play_icon',
            [
                'label' => Translater::get()->l('Play Icon'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'options' => [
                    'yes' => Translater::get()->l('Yes'),
                    'no' => Translater::get()->l('No'),
                ],
                'section' => 'section_image_overlay',
                'condition' => [
                    'show_image_overlay' => 'yes',
                    'image_overlay[url]!' => '',
                ],
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $this->currentInstance = $instance;

        if ('hosted' !== $instance['video_type']) {
            $video_link = 'youtube' === $instance['video_type'] ? $instance['link'] : $instance['vimeo_link'];
            if (empty($video_link)) {
                return;
            }
            $video_html = $this->videoParser($video_link, $this->getEmbedSettings());
        } else {
            $video_html = $this->getHostedVideoHtml($instance['hosted_link']['url'], $this->getEmbedSettings());
        }

        if ($video_html) { ?>
            <?php if ($instance['in_modal'] === 'yes') { ?>

                <button class="elementor-video-open-modal" data-bs-toggle="modal"
                        data-bs-target="#elementor-video-modal-<?php echo isset($instance['id_widget_instance']) ? $instance['id_widget_instance'] : '';
                        ?>">
                    <i class="fa fa-play-circle"></i>
                </button>


                <div class="modal fade elementor-video-modal" id="elementor-video-modal-<?php echo isset($instance['id_widget_instance']) ? $instance['id_widget_instance'] : '';
                ?>">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <span class="modal-title"></span>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <?php echo $video_html; ?>
                            </div>
                        </div>
                    </div>
                </div>


            <?php } else { ?>
                <div class="elementor-video-wrapper">
                    <?php
                    echo $video_html;

                    if ($this->hasImageOverlay()) { ?>
                        <div class="elementor-custom-embed-image-overlay" style="background-image: url(<?php echo $this->currentInstance['image_overlay']['url']; ?>);">
                            <?php if ('yes' === $this->currentInstance['show_play_icon']) { ?>
                                <div class="elementor-custom-embed-play">
                                    <i class="fa fa-play-circle"></i>
                                </div>
                            <?php } ?>
                        </div>
                    <?php } ?>
                </div>
            <?php }
        }
    }

    protected function getHostedVideoHtml(string $url, array $settings, int $wdth = 320, int $hth = 320): ?string
    {
        if (empty($url)) {
            return null;
        }
        $params = '';

        if (isset($settings['autoplay']) && $settings['autoplay']) {
            $params .= 'autoplay muted ';
        } else {
            if ($settings['muted']) {
                $params .= 'muted ';
            }
        }
        if ($settings['controls']) {
            $params .= 'controls ';
        }
        if ($settings['loop']) {
            $params .= 'loop ';
        }

        $html = '<video class="elementor-video" src="' . $url . '" ' . $params . ' playsinline></video>';

        return $html;
    }

    protected function videoParser(string $url, array $settings, int $wdth = 320, int $hth = 320): string
    {
        $params = '';
        $iframe = '';
        if (strpos($url, 'youtube.com') !== false) {
            if (strpos($url, '/shorts/') !== false) {
                $parts = explode('/shorts/', $url);

                $subparts = explode('?', $parts[1]);
                $video_id = $subparts[0];
            } elseif (strpos($url, 'v=') !== false) {
                $step1 = explode('v=', $url);

                $step2 = explode('&', $step1[1]);
                $video_id = $step2[0];
            } else {
                $video_id = '';
            }

            if (isset($settings['autoplay']) && $settings['autoplay']) {
                $params .= '?autoplay=1';
                $params .= '&mute=1';
            } else {
                $params .= '?autoplay=0';
            }
            if ($settings['loop']) {
                $params .= '&loop=1&playlist=' . $video_id;
            }
            if (!$settings['rel']) {
                $params .= '&rel=0';
            }
            if (!$settings['controls']) {
                $params .= '&controls=0';
            }

            $iframe = '<iframe width="' . $wdth . '" height="' . $hth . '" src="https://www.youtube.com/embed/' . $video_id . $params . '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
        } elseif (strpos($url, 'vimeo') !== false) {
            if (isset($settings['autoplay']) && $settings['autoplay']) {
                $params .= '?autoplay=1';
            } else {
                $params .= '?autoplay=0';
            }
            if ($settings['loop']) {
                $params .= '&loop=1';
            }
            if (!$settings['title']) {
                $params .= '&title=0';
            }
            if (!$settings['portrait']) {
                $params .= '&portrait=0';
            }
            if (!$settings['byline']) {
                $params .= '&byline=0';
            }
            if ($settings['color'] != '') {
                $params .= '&color=' . $settings['color'];
            }
            $id = preg_replace("/[^\/]+[^0-9]|(\/)/", '', rtrim($url, '/'));
            $embedurl = 'https://player.vimeo.com/video/' . $id;
            $iframe = '<iframe src="' . $embedurl . $params . '"  width="' . $wdth . '" height="' . $hth . '"  frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        }

        return $iframe;
    }

    public function getEmbedSettings(): array
    {
        $params = [];

        if ('youtube' === $this->currentInstance['video_type']) {
            $youtube_options = ['autoplay', 'loop', 'rel', 'controls'];

            foreach ($youtube_options as $option) {
                if ('autoplay' === $option && $this->allowAutoplay()) {
                    continue;
                }

                $value = ('yes' === $this->currentInstance['yt_' . $option]) ? '1' : '0';
                $params[$option] = $value;
            }

            $params['wmode'] = 'opaque';
        }

        if ('vimeo' === $this->currentInstance['video_type']) {
            $vimeo_options = ['autoplay', 'loop', 'title', 'portrait', 'byline'];

            foreach ($vimeo_options as $option) {
                if ('autoplay' === $option && $this->allowAutoplay()) {
                    continue;
                }

                $value = ('yes' === $this->currentInstance['vimeo_' . $option]) ? '1' : '0';
                $params[$option] = $value;
            }

            $params['color'] = str_replace('#', '', $this->currentInstance['vimeo_color']);
            $params['autopause'] = '0';
        }
        if ('hosted' === $this->currentInstance['video_type']) {
            $vimeo_options = ['autoplay', 'controls', 'muted', 'loop'];

            foreach ($vimeo_options as $option) {
                if ('autoplay' === $option && $this->allowAutoplay()) {
                    continue;
                }

                $value = ('yes' === $this->currentInstance['ht_' . $option]) ? '1' : '0';
                $params[$option] = $value;
            }

            $params['color'] = str_replace('#', '', $this->currentInstance['vimeo_color']);
        }

        return $params;
    }

    protected function allowAutoplay(): bool
    {
        return !empty($this->currentInstance['image_overlay']['url']) && 'yes' === $this->currentInstance['show_image_overlay'] || ('yes' === $this->currentInstance['in_modal']);
    }

    protected function hasImageOverlay(): bool
    {
        return !empty($this->currentInstance['image_overlay']['url']) && 'yes' === $this->currentInstance['show_image_overlay'];
    }

    protected function contentTemplate(): void
    {
    }
}
