<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Social_Icons extends Widget_Base
{
    public function get_id()
    {
        return 'social-icons';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Social Icons', 'elementor');
    }

    public function get_icon()
    {
        return 'social-icons';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_social_icon',
            [
                'label' => \IqitElementorTranslater::get()->l('Social Icons', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'social_icon_list',
            [
                'label' => \IqitElementorTranslater::get()->l('Social Icons', 'elementor'),
                'type' => Controls_Manager::REPEATER,
                'default' => [
                    [
                        'social' => 'fa-brands fa-instagram',
                    ],
                    [
                        'social' => 'fa-brands fa-x-twitter',
                    ],
                    [
                        'social' => 'fa-brands fa-tiktok',
                    ],
                ],
                'section' => 'section_social_icon',
                'fields' => [
                    [
                        'name' => 'social',
                        'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                        'type' => Controls_Manager::ICON,
                        'label_block' => true,
                        'default' => 'fa fa-wordpress',
                        'include' => [
                            'fa-brands fa-behance',
                            'fa-brands fa-bitbucket',
                            'fa-brands fa-codepen',
                            'fa-brands fa-delicious',
                            'fa-brands fa-digg',
                            'fa-brands fa-dribbble',
                            'fa-brands fa-facebook',
                            'fa-brands fa-flickr',
                            'fa-brands fa-foursquare',
                            'fa-brands fa-github',
                            'fa-brands fa-instagram',
                            'fa-brands fa-jsfiddle',
                            'fa-brands fa-linkedin',
                            'fa-brands fa-medium',
                            'fa-brands fa-pinterest',
                            'fa-brands fa-product-hunt',
                            'fa-brands fa-reddit',
                            'fa-brands fa-snapchat',
                            'fa-brands fa-soundcloud',
                            'fa-brands fa-stack-overflow',
                            'fa-brands fa-tumblr',
                            'fa-brands fa-x-twitter',
                            'fa-brands fa-tiktok',
                            'fa-brands fa-vimeo',
                            'fa-brands fa-wordpress',
                            'fa-brands fa-youtube',
                        ],
                    ],
                    [
                        'name' => 'link',
                        'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
                        'type' => Controls_Manager::URL,
                        'label_block' => true,
                        'default' => [
                            'url' => '',
                            'is_external' => 'true',
                        ],
                        'placeholder' => \IqitElementorTranslater::get()->l('http://your-link.com', 'elementor'),
                    ],
                ],
                'title_field' => 'social',
            ]
        );

        $this->add_control(
            'shape',
            [
                'label' => \IqitElementorTranslater::get()->l('Shape', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'section' => 'section_social_icon',
                'default' => 'rounded',
                'options' => [
                    'rounded' => \IqitElementorTranslater::get()->l('Rounded', 'elementor'),
                    'square' => \IqitElementorTranslater::get()->l('Square', 'elementor'),
                    'circle' => \IqitElementorTranslater::get()->l('Circle', 'elementor'),
                ],
                'prefix_class' => 'elementor-shape-',
            ]
        );

        $this->add_responsive_control(
            'align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'section' => 'section_social_icon',
                'options' => [
                    'left' => [
                        'title' => \IqitElementorTranslater::get()->l('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorTranslater::get()->l('Center', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorTranslater::get()->l('Right', 'elementor'),
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
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_icon',
            ]
        );

        $this->add_control(
            'section_social_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Background Color', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'default' => 'default',
                'options' => [
                    'default' => \IqitElementorTranslater::get()->l('Official Color', 'elementor'),
                    'custom' => \IqitElementorTranslater::get()->l('Custom', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'icon_primary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'condition' => [
                    'icon_color' => 'custom',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'icon_secondary_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon' => 'color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->add_control(
            'icon_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Size', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon i' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'icon_padding',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Padding', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon' => 'padding: {{SIZE}}{{UNIT}};',
                ],
                'default' => [
                    'unit' => 'em',
                ],
                'range' => [
                    'em' => [
                        'min' => 0,
                    ],
                ],
            ]
        );

        $icon_spacing = \IqitElementorHelper::is_rtl() ? 'margin-left: {{SIZE}}{{UNIT}};' : 'margin-right: {{SIZE}}{{UNIT}};';

        $this->add_control(
            'icon_spacing',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Spacing', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon:not(:last-child)' => $icon_spacing,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Border::get_type(),
            [
                'name' => 'image_border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'selector' => '{{WRAPPER}} .elementor-social-icon',
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Radius', 'elementor'),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
    }

    protected function render($instance = [])
    {
        ?>
        <div class="elementor-social-icons-wrapper">
            <?php foreach ($instance['social_icon_list'] as $item) {
                $social = str_replace('fa-brands fa-', '', $item['social']);
                $target = $item['link']['is_external'] ? ' target="_blank" rel="noopener noreferrer"' : '';
                ?>
                <a class="elementor-icon elementor-social-icon elementor-social-icon-<?php echo \IqitElementorHelper::esc_attr($social); ?>" href="<?php echo \IqitElementorHelper::esc_attr($item['link']['url']); ?>"<?php echo $target; ?>>
                    <i class="<?php echo $item['social']; ?>"></i>
                </a>
            <?php } ?>
        </div>
        <?php
    }

    protected function content_template()
    {
        ?>
        <div class="elementor-social-icons-wrapper">
            <# _.each( settings.social_icon_list, function( item ) {
            var link = item.link ? item.link.url : '',
            social = item.social.replace( 'fa-brands fa-', '' ); #>
            <a class="elementor-icon elementor-social-icon elementor-social-icon-{{ social }}" href="{{ link }}">
                <i class="{{ item.social }}"></i>
            </a>
            <# } ); #>
        </div>
        <?php
    }
}
