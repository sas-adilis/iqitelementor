<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class IconList extends WidgetBase
{
    public function getId(): string
    {
        return 'icon-list';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Icon List');
    }

    public function getIcon(): string
    {
        return 'bullet-list';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_icon',
            [
                'label' => Translater::get()->l('Icon List'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'icon_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [
                    [
                        'text' => Translater::get()->l('List Item #1'),
                        'icon' => 'fa fa-check',
                    ],
                    [
                        'text' => Translater::get()->l('List Item #2'),
                        'icon' => 'fa fa-times',
                    ],
                    [
                        'text' => Translater::get()->l('List Item #3'),
                        'icon' => 'fa fa-dot-circle-o',
                    ],
                ],
                'section' => 'section_icon',
                'fields' => [
                    [
                        'name' => 'text',
                        'label' => Translater::get()->l('Text'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('List Item'),
                        'default' => Translater::get()->l('List Item'),
                    ],
                    [
                        'name' => 'icon',
                        'label' => Translater::get()->l('Icon'),
                        'type' => ControlManager::ICON,
                        'label_block' => true,
                        'default' => 'fa fa-check',
                    ],
                    [
                        'name' => 'link',
                        'label' => Translater::get()->l('Link'),
                        'type' => ControlManager::URL,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('http://your-link.com'),
                    ],
                ],
                'title_field' => 'text',
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
            'section_icon_style',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'icon_color',
            [
                'label' => Translater::get()->l('Icon Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-icon i' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-icon-list-icon svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'icon_size',
            [
                'label' => Translater::get()->l('Icon Size'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => [
                    'size' => 14,
                ],
                'range' => [
                    'px' => [
                        'min' => 6,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-icon' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-icon-list-icon svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'icon_align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
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
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-items' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'section_text_style',
            [
                'label' => Translater::get()->l('Text'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'text_indent',
            [
                'label' => Translater::get()->l('Text Indent'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'range' => [
                    'px' => [
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-text' => Helper::isRtl() ? 'padding-right: {{SIZE}}{{UNIT}};' : 'padding-left: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-text' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'icon_typography',
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'selector' => '{{WRAPPER}} .elementor-icon-list-text',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        ?>
        <ul class="elementor-icon-list-items">
            <?php foreach ($instance['icon_list'] as $item) { ?>
                <li class="elementor-icon-list-item">
                    <?php
                    if (!empty($item['link']['url'])) {
                        $target = $item['link']['is_external'] ? ' target="_blank" rel="noopener noreferrer"' : '';

                        echo '<a href="' . $item['link']['url'] . '"' . $target . '>';
                    }

                    if ($item['icon']) { ?>
                        <span class="elementor-icon-list-icon">
							<?php echo IconHelper::renderIcon($item['icon']); ?>
						</span>
                    <?php } ?>
                    <span class="elementor-icon-list-text"><?php echo $item['text']; ?></span>
                    <?php
                    if (!empty($item['link']['url'])) {
                        echo '</a>';
                    }
                    ?>
                </li>
                <?php
            } ?>
        </ul>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <ul class="elementor-icon-list-items">
            <#
            if ( settings.icon_list ) {
            _.each( settings.icon_list, function( item ) { #>
            <li class="elementor-icon-list-item">
                <# if ( item.link && item.link.url ) { #>
                <a href="{{ item.link.url }}">
                    <# } #>
                    <span class="elementor-icon-list-icon">
							{{{ elementorRenderIcon(item.icon) }}}
						</span>
                    <span class="elementor-icon-list-text">{{{ item.text }}}</span>
                    <# if ( item.link && item.link.url ) { #>
                </a>
                <# } #>
            </li>
            <#
            } );
            } #>
        </ul>
        <?php
    }
}
