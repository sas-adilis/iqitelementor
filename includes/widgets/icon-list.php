<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Icon_list extends Widget_Base
{
    public function get_id()
    {
        return 'icon-list';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Icon List', 'elementor');
    }

    public function get_icon()
    {
        return 'bullet-list';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_icon',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon List', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'icon_list',
            [
                'label' => '',
                'type' => Controls_Manager::REPEATER,
                'default' => [
                    [
                        'text' => \IqitElementorTranslater::get()->l('List Item #1', 'elementor'),
                        'icon' => 'fa fa-check',
                    ],
                    [
                        'text' => \IqitElementorTranslater::get()->l('List Item #2', 'elementor'),
                        'icon' => 'fa fa-times',
                    ],
                    [
                        'text' => \IqitElementorTranslater::get()->l('List Item #3', 'elementor'),
                        'icon' => 'fa fa-dot-circle-o',
                    ],
                ],
                'section' => 'section_icon',
                'fields' => [
                    [
                        'name' => 'text',
                        'label' => \IqitElementorTranslater::get()->l('Text', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'label_block' => true,
                        'placeholder' => \IqitElementorTranslater::get()->l('List Item', 'elementor'),
                        'default' => \IqitElementorTranslater::get()->l('List Item', 'elementor'),
                    ],
                    [
                        'name' => 'icon',
                        'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                        'type' => Controls_Manager::ICON,
                        'label_block' => true,
                        'default' => 'fa fa-check',
                    ],
                    [
                        'name' => 'link',
                        'label' => \IqitElementorTranslater::get()->l('Link', 'elementor'),
                        'type' => Controls_Manager::URL,
                        'label_block' => true,
                        'placeholder' => \IqitElementorTranslater::get()->l('http://your-link.com', 'elementor'),
                    ],
                ],
                'title_field' => 'text',
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
            'section_icon_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'icon_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-icon i' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_control(
            'icon_size',
            [
                'label' => \IqitElementorTranslater::get()->l('Icon Size', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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
                ],
            ]
        );

        $this->add_responsive_control(
            'icon_align',
            [
                'label' => \IqitElementorTranslater::get()->l('Alignment', 'elementor'),
                'type' => Controls_Manager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
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
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-items' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'section_text_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Text', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'text_indent',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Indent', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'range' => [
                    'px' => [
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-text' => \IqitElementorHelper::is_rtl() ? 'padding-right: {{SIZE}}{{UNIT}};' : 'padding-left: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-list-text' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_2,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'icon_typography',
                'label' => \IqitElementorTranslater::get()->l('Typography', 'elementor'),
                'tab' => self::TAB_STYLE,
                'section' => 'section_text_style',
                'selector' => '{{WRAPPER}} .elementor-icon-list-text',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    protected function render($instance = [])
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
							<i class="<?php echo \IqitElementorHelper::esc_attr($item['icon']); ?>"></i>
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

    protected function content_template()
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
							<i class="{{ item.icon }}"></i>
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
