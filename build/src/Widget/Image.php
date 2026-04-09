<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Control\Group\Image as GroupImage;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Image extends WidgetBase
{
    public function getId(): string
    {
        return 'image';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Image');
    }

    public function getIcon(): string
    {
        return 'image';
    }

    protected function registerControls(): void
    {
        $this->startControlsSection(
            'section_image',
            [
                'label' => Translater::get()->l('Image'),
            ]
        );

        $this->addGroupControl(
            GroupImage::getType(),
            [
                'name' => 'image',
            ]
        );

        $this->addResponsiveControl(
            'align',
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
                'selectors' => [
                    '{{WRAPPER}}' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'link_to',
            [
                'label' => Translater::get()->l('Link to'),
                'type' => ControlManager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => Translater::get()->l('None'),
                    'file' => Translater::get()->l('Media File'),
                    'custom' => Translater::get()->l('Custom URL'),
                ],
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link to'),
                'type' => ControlManager::URL,
                'placeholder' => Translater::get()->l('http://your-link.com'),
                'condition' => [
                    'link_to' => 'custom',
                ],
                'show_label' => false,
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->endControlsSection();

        /**
         * Style: Dimensions
         */
        $this->startControlsSection(
            'section_style_image_dimensions',
            [
                'label' => Translater::get()->l('Dimensions'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'width',
            [
                'label' => Translater::get()->l('Width'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'unit' => '%',
                ],
                'tablet_default' => [
                    'unit' => '%',
                ],
                'mobile_default' => [
                    'unit' => '%',
                ],
                'size_units' => ['%', 'px', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'max_width',
            [
                'label' => Translater::get()->l('Max width'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'unit' => '%',
                ],
                'tablet_default' => [
                    'unit' => '%',
                ],
                'mobile_default' => [
                    'unit' => '%',
                ],
                'size_units' => ['%', 'px', 'vw'],
                'range' => [
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vw' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'height',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'default' => [
                    'unit' => 'px',
                ],
                'tablet_default' => [
                    'unit' => 'px',
                ],
                'mobile_default' => [
                    'unit' => 'px',
                ],
                'size_units' => ['px', 'vh', 'custom'],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 1000,
                    ],
                    'vh' => [
                        'min' => 1,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'image_position',
            [
                'label' => Translater::get()->l('Object adaptation'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'center center' => Translater::get()->l('Center Center'),
                    'center left' => Translater::get()->l('Center Left'),
                    'center right' => Translater::get()->l('Center Right'),
                    'top center' => Translater::get()->l('Top Center'),
                    'top left' => Translater::get()->l('Top Left'),
                    'top right' => Translater::get()->l('Top Right'),
                    'bottom center' => Translater::get()->l('Bottom Center'),
                    'bottom left' => Translater::get()->l('Bottom Left'),
                    'bottom right' => Translater::get()->l('Bottom Right'),
                ],
                'default' => 'center center',
                'description' => Translater::get()->l('Select which part of the image stays visible when it’s cropped (cover)'),
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'object-position: {{VALUE}};',
                ],
            ]
        );

        $this->endControlsSection();

        /**
         * Style: Apparence
         */
        $this->startControlsSection(
            'section_style_image_appearance',
            [
                'label' => Translater::get()->l('Appearance'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->startControlsTabs('image', [
        ]);
        $this->startControlsTab('image_normal', [
            'label' => Translater::get()->l('Normal'),
        ]);

        $this->addControl(
            'opacity',
            [
                'label' => Translater::get()->l('Opacity'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'max' => 1,
                        'min' => 0.10,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'opacity: {{SIZE}};',
                ],
                'separator' => 'after',
            ]
        );

        $this->endControlsTab();
        $this->startControlsTab('image_hover', [
            'label' => Translater::get()->l('Hover'),
        ]);

        $this->addControl(
            'opacity_hover',
            [
                'label' => Translater::get()->l('Opacity'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'max' => 1,
                        'min' => 0.10,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-image img' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->endControlsTab();
        $this->endControlsTabs();

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'image_border',
                'label' => Translater::get()->l('Image Border'),
                'selector' => '{{WRAPPER}} .elementor-image img',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'image_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => 'image_box_shadow',
                'selector' => '{{WRAPPER}} .elementor-image img',
            ]
        );

        $this->endControlsSection();

        /**
         * Nouvelle section: Animations au survol (Style tab)
         */
        $this->startControlsSection(
            'section_style_image_hover_animation',
            [
                'label' => Translater::get()->l('Hover Animation'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'hover_animation',
            [
                'label' => Translater::get()->l('Hover Animation'),
                'type' => ControlManager::HOVER_ANIMATION,
            ]
        );

        // Optionnel mais utile: applique la transition aussi hors hover (sinon la durée ne s'applique qu'en :hover)
        $this->addControl(
            'hover_animation_transition_property',
            [
                'label' => Translater::get()->l('Transition Property'),
                'type' => ControlManager::HIDDEN,
                'default' => 'transform',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'transition-property: {{VALUE}};',
                ],
                'condition' => [
                    'hover_animation!' => '',
                ],
            ]
        );

        $this->addControl(
            'hover_animation_duration',
            [
                'label' => Translater::get()->l('Animation Duration (ms)'),
                'type' => ControlManager::SLIDER,
                'render_type' => 'template',
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10000,
                    ],
                ],
                'selectors' => [
                    // Appliqué sur l'état normal pour que l'entrée ET la sortie utilisent la même durée
                    '{{WRAPPER}} .elementor-image img' => 'transition-duration: {{SIZE}}ms',
                ],
                'condition' => [
                    'hover_animation!' => '',
                ],
            ]
        );

        $this->endControlsSection();
    }

    protected function render(array $instance = []): void
    {
        if (empty($instance['image_settings']['url'])) {
            return;
        }

        $image_class_html = !empty($instance['hover_animation']) ? ' class="elementor-animation-' . $instance['hover_animation'] . '"' : '';

        $image_width = $instance['image_settings']['width'] ? 'width="' . Helper::absint($instance['image_settings']['width']) . '"' : '';
        $image_height = $instance['image_settings']['height'] ? 'height="' . Helper::absint($instance['image_settings']['height']) . '"' : '';

        if ('yes' === $instance['image_lazy']) {
            $lazyload_tag = 'loading="lazy" ';
        } else {
            $lazyload_tag = '';
        }

        $image_html = sprintf(
                '<figure><img %s src="%s" %s %s alt="%s"%s /></figure>',
                $lazyload_tag,
                Helper::escAttr(Helper::getImage($instance['image_settings']['url'])),
                $image_width,
                $image_height,
                Helper::escAttr($instance['image_alt']),
                $image_class_html
        );

        $link = $this->getLinkUrl($instance);
        if ($link) {
            $target = '';
            if (!empty($link['is_external'])) {
                $target = ' target="_blank" rel="noopener noreferrer"';
            }
            $image_html = sprintf('<a href="%s"%s>%s</a>', $link['url'], $target, $image_html);
        }

        $image_html = '<div class="elementor-image' . (!empty($instance['shape']) ? ' elementor-image-shape-' . $instance['shape'] : '') . '">' . $image_html . '</div>';

        echo $image_html;
    }

    protected function contentTemplate(): void
    {
        ?>
        <# if ( settings.image_settings && '' !== settings.image_settings.url ) { #>
        <div class="elementor-image{{ settings.shape ? ' elementor-image-shape-' + settings.shape : '' }}">
            <#
            var imgClass = '', image_html = '',
            image_html = '';

            if ( '' !== settings.hover_animation ) {
            imgClass = 'elementor-animation-' + settings.hover_animation;
            }

            image_html = '<figure><img src="' + settings.image_settings.url + '" ' + (settings.image_settings.width ? 'width="' + settings.image_settings.width + '" ' : '') + (settings.image_settings.height ? 'height="' + settings.image_settings.height + '" ' : '') + ' class="' + imgClass + '" alt="' + settings.image_alt + '" /></figure>';

            var link_url;
            if ( 'custom' === settings.link_to ) {
            link_url = settings.link.url;
            }

            if ( 'file' === settings.link_to ) {
            link_url = settings.image.url;
            }

            if ( link_url ) {
            image_html = '<a href="' + link_url + '">' + image_html + '</a>';
            }


            print( image_html );
            #>
        </div>
        <# } #>
        <?php
    }

    /**
     * @return array|false
     */
    private function getLinkUrl(array $instance)
    {
        if ('none' === $instance['link_to']) {
            return false;
        }

        if ('custom' === $instance['link_to']) {
            if (empty($instance['link']['url'])) {
                return false;
            }

            return $instance['link'];
        }

        return [
            'url' => $instance['image']['url'],
        ];
    }
}
