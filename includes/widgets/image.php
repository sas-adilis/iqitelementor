<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Image extends Widget_Base
{
    public function get_id()
    {
        return 'image';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Image', 'elementor');
    }

    public function get_icon()
    {
        return 'image';
    }

    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_image',
            [
                'label' => \IqitElementorWpHelper::__('Image', 'elementor'),
            ]
        );

        $this->add_group_control(
            Group_Control_Image::get_type(),
            [
                'name' => 'image',
            ]
        );

        /*$this->add_control(
            'image',
            [
                'label' => \IqitElementorWpHelper::__('Choose Image', 'elementor'),
                'type' => Controls_Manager::MEDIA,
                'default' => [
                    'url' => UtilsElementor::get_placeholder_image_src(),
                ],
                'section' => 'section_image',
            ]
        );

        /*$this->add_control(
            'image_lazy',
            [
                'label' => \IqitElementorWpHelper::__('Lazy load', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'yes',
                'section' => 'section_image',
                'description' => \IqitElementorWpHelper::__('If your widget is above the fold lazy load should be disabled', 'elementor'),
                'options' => [
                    'no' => \IqitElementorWpHelper::__('No', 'elementor'),
                    'yes' => \IqitElementorWpHelper::__('Yes', 'elementor'),
                ],
            ]
        );*/

        $this->add_responsive_control(
            'align',
            [
                'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => \IqitElementorWpHelper::__('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorWpHelper::__('Center', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorWpHelper::__('Right', 'elementor'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'default' => 'center',
                'selectors' => [
                    '{{WRAPPER}}' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'link_to',
            [
                'label' => \IqitElementorWpHelper::__('Link to', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'none',
                'options' => [
                    'none' => \IqitElementorWpHelper::__('None', 'elementor'),
                    'file' => \IqitElementorWpHelper::__('Media File', 'elementor'),
                    'custom' => \IqitElementorWpHelper::__('Custom URL', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'link',
            [
                'label' => \IqitElementorWpHelper::__('Link to', 'elementor'),
                'type' => Controls_Manager::URL,
                'placeholder' => \IqitElementorWpHelper::__('http://your-link.com', 'elementor'),
                'condition' => [
                    'link_to' => 'custom',
                ],
                'show_label' => false,
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorWpHelper::__('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->end_controls_section();

        /**
         * Style: Dimensions
         */
        $this->start_controls_section(
            'section_style_image_dimensions',
            [
                'label' => \IqitElementorWpHelper::__('Dimensions', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
            'width',
            [
                'label' => \IqitElementorWpHelper::__('Width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_responsive_control(
            'max_width',
            [
                'label' => \IqitElementorWpHelper::__('Max width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_responsive_control(
            'height',
            [
                'label' => \IqitElementorWpHelper::__('Height', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_responsive_control(
            'image_position',
            [
                'label' => \IqitElementorWpHelper::__('Image position', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'options' => [
                    'center center' => \IqitElementorWpHelper::_x('Center Center', 'Image position', 'elementor'),
                    'center left' => \IqitElementorWpHelper::_x('Center Left', 'Image position', 'elementor'),
                    'center right' => \IqitElementorWpHelper::_x('Center Right', 'Image position', 'elementor'),
                    'top center' => \IqitElementorWpHelper::_x('Top Center', 'Image position', 'elementor'),
                    'top left' => \IqitElementorWpHelper::_x('Top Left', 'Image position', 'elementor'),
                    'top right' => \IqitElementorWpHelper::_x('Top Right', 'Image position', 'elementor'),
                    'bottom center' => \IqitElementorWpHelper::_x('Bottom Center', 'Image position', 'elementor'),
                    'bottom left' => \IqitElementorWpHelper::_x('Bottom Left', 'Image position', 'elementor'),
                    'bottom right' => \IqitElementorWpHelper::_x('Bottom Right', 'Image position', 'elementor'),
                ],
                'default' => 'center center',
                'description' => \IqitElementorWpHelper::__('Select which part of the image stays visible when it’s cropped (cover)', 'elementor'),
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'object-position: {{VALUE}};',
                ],
            ]
        );

        $this->end_controls_section();

        /**
         * Style: Apparence
         */
        $this->start_controls_section(
            'section_style_image_appearance',
            [
                'label' => \IqitElementorWpHelper::__('Appearance', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->start_controls_tabs('image', [
        ]);
        $this->start_controls_tab('image_normal', [
            'label' => \IqitElementorWpHelper::__('Normal'),
        ]);

        $this->add_control(
            'opacity',
            [
                'label' => \IqitElementorWpHelper::__('Opacity', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->end_controls_tab();
        $this->start_controls_tab('image_hover', [
            'label' => \IqitElementorWpHelper::__('Hover'),
        ]);

        $this->add_control(
            'opacity_hover',
            [
                'label' => \IqitElementorWpHelper::__('Opacity', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->end_controls_tab();
        $this->end_controls_tabs();

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'label' => \IqitElementorWpHelper::__('Image Border', 'elementor'),
                'selector' => '{{WRAPPER}} .elementor-image img',
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'image_border_radius',
            [
                'label' => \IqitElementorWpHelper::__('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'image_box_shadow',
                'selector' => '{{WRAPPER}} .elementor-image img',
            ]
        );

        $this->end_controls_section();

        /**
         * Nouvelle section: Animations au survol (Style tab)
         */
        $this->start_controls_section(
            'section_style_image_hover_animation',
            [
                'label' => \IqitElementorWpHelper::__('Hover Animation', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'hover_animation',
            [
                'label' => \IqitElementorWpHelper::__('Hover Animation', 'elementor'),
                'type' => Controls_Manager::HOVER_ANIMATION,
            ]
        );

        // Optionnel mais utile: applique la transition aussi hors hover (sinon la durée ne s'applique qu'en :hover)
        $this->add_control(
            'hover_animation_transition_property',
            [
                'label' => \IqitElementorWpHelper::__('Transition Property', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'transform',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image img' => 'transition-property: {{VALUE}};',
                ],
                'condition' => [
                    'hover_animation!' => '',
                ],
            ]
        );

        $this->add_control(
            'hover_animation_duration',
            [
                'label' => \IqitElementorWpHelper::__('Animation Duration (ms)'),
                'type' => Controls_Manager::SLIDER,
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

        $this->end_controls_section();
    }

    protected function render($instance = [])
    {
        if (empty($instance['image_settings']['url'])) {
            return;
        }

        $image_class_html = !empty($instance['hover_animation']) ? ' class="elementor-animation-' . $instance['hover_animation'] . '"' : '';

        $image_width = $instance['image_settings']['width'] ? 'width="' . \IqitElementorWpHelper::absint($instance['image_settings']['width']) . '"' : '';
        $image_height = $instance['image_settings']['height'] ? 'height="' . \IqitElementorWpHelper::absint($instance['image_settings']['height']) . '"' : '';

        if ('yes' === $instance['image_lazy']) {
            $lazyload_tag = 'loading="lazy" ';
        } else {
            $lazyload_tag = '';
        }

        $image_html = sprintf(
                '<figure><img %s src="%s" %s %s alt="%s"%s /></figure>',
                $lazyload_tag,
                \IqitElementorWpHelper::esc_attr(\IqitElementorWpHelper::getImage($instance['image_settings']['url'])),
                $image_width,
                $image_height,
                \IqitElementorWpHelper::esc_attr($instance['image_alt']),
                $image_class_html
        );

        $link = $this->get_link_url($instance);
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

    protected function content_template()
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

    private function get_link_url($instance)
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
