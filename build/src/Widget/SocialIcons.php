<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class SocialIcons extends WidgetBase
{
    public function getId(): string
    {
        return 'social-icons';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Social Icons');
    }

    public function getIcon(): string
    {
        return 'social-icons';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_social_icon',
            [
                'label' => Translater::get()->l('Social Icons'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'social_icon_list',
            [
                'label' => Translater::get()->l('Social Icons'),
                'type' => ControlManager::REPEATER,
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
                        'label' => Translater::get()->l('Icon'),
                        'type' => ControlManager::ICON,
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
                        'label' => Translater::get()->l('Link'),
                        'type' => ControlManager::URL,
                        'label_block' => true,
                        'default' => [
                            'url' => '',
                            'is_external' => 'true',
                        ],
                        'placeholder' => Translater::get()->l('http://your-link.com'),
                    ],
                ],
                'title_field' => 'social',
            ]
        );

        $this->addControl(
            'shape',
            [
                'label' => Translater::get()->l('Shape'),
                'type' => ControlManager::SELECT,
                'section' => 'section_social_icon',
                'default' => 'rounded',
                'options' => [
                    'rounded' => Translater::get()->l('Rounded'),
                    'square' => Translater::get()->l('Square'),
                    'circle' => Translater::get()->l('Circle'),
                ],
                'prefix_class' => 'elementor-shape-',
            ]
        );

        $this->addResponsiveControl(
            'align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'section' => 'section_social_icon',
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
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_icon',
            ]
        );

        $this->addControl(
            'section_social_style',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'icon_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::SELECT,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'default' => 'default',
                'options' => [
                    'default' => Translater::get()->l('Official Color'),
                    'custom' => Translater::get()->l('Custom'),
                ],
            ]
        );

        $this->addControl(
            'icon_primary_color',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
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

        $this->addControl(
            'icon_secondary_color',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}} .elementor-social-icon' => 'color: {{VALUE}} !important;',
                ],
            ]
        );

        $this->addControl(
            'icon_size',
            [
                'label' => Translater::get()->l('Icon Size'),
                'type' => ControlManager::SLIDER,
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

        $this->addControl(
            'icon_padding',
            [
                'label' => Translater::get()->l('Icon Padding'),
                'type' => ControlManager::SLIDER,
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

        $icon_spacing = Helper::isRtl() ? 'margin-left: {{SIZE}}{{UNIT}};' : 'margin-right: {{SIZE}}{{UNIT}};';

        $this->addControl(
            'icon_spacing',
            [
                'label' => Translater::get()->l('Icon Spacing'),
                'type' => ControlManager::SLIDER,
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

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'image_border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'selector' => '{{WRAPPER}} .elementor-social-icon',
            ]
        );

        $this->addControl(
            'border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_social_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        ?>
        <div class="elementor-social-icons-wrapper">
            <?php foreach ($instance['social_icon_list'] as $item) {
                $iconData = IconHelper::decodeIconValue($item['social']);
                $social = preg_replace('/^(fa-brands\s+fa-|bi\s+bi-|ph\s+ph-)/', '', $iconData['value']);
                $target = $item['link']['is_external'] ? ' target="_blank" rel="noopener noreferrer"' : '';
                ?>
                <a class="elementor-icon elementor-social-icon elementor-social-icon-<?php echo Helper::escAttr($social); ?>" href="<?php echo Helper::escAttr($item['link']['url']); ?>"<?php echo $target; ?>>
                    <?php echo IconHelper::renderIcon($item['social']); ?>
                </a>
            <?php } ?>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <div class="elementor-social-icons-wrapper">
            <# _.each( settings.social_icon_list, function( item ) {
            var link = item.link ? item.link.url : '',
            socialVal = item.social,
            social = '';
            try { var _p = JSON.parse(socialVal); socialVal = _p.value || socialVal; } catch(e) {}
            social = socialVal.replace( /^(fa-brands\s+fa-|bi\s+bi-|ph\s+ph-)/, '' ); #>
            <a class="elementor-icon elementor-social-icon elementor-social-icon-{{ social }}" href="{{ link }}">
                {{{ elementorRenderIcon(item.social) }}}
            </a>
            <# } ); #>
        </div>
        <?php
    }
}
