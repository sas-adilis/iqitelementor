<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\IconTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class IconBox extends WidgetBase
{
    use IconTrait;
    public function getId(): string
    {
        return 'icon-box';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Icon Box');
    }

    public function getIcon(): string
    {
        return 'icon-box';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_icon',
            [
                'label' => Translater::get()->l('Icon Box'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->registerIconContentControls('section_icon', [], '', [], 'fa fa-star');

        $this->addControl(
            'title_text',
            [
                'label' => Translater::get()->l('Title & Description'),
                'type' => ControlManager::TEXT,
                'default' => Translater::get()->l('This is the heading'),
                'placeholder' => Translater::get()->l('Your Title'),
                'section' => 'section_icon',
                'label_block' => true,
            ]
        );

        $this->addControl(
            'description_text',
            [
                'label' => '',
                'type' => ControlManager::WYSIWYG,
                'default' => '<p>' . Translater::get()->l('I am text block. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.') . '</p>',
                'title' => Translater::get()->l('Input icon text here'),
                'section' => 'section_icon',
                'separator' => 'none',
                'show_label' => false,
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link to'),
                'type' => ControlManager::URL,
                'placeholder' => Translater::get()->l('http://your-link.com'),
                'section' => 'section_icon',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'position',
            [
                'label' => Translater::get()->l('Icon Position'),
                'type' => ControlManager::CHOOSE,
                'default' => 'top',
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'top' => [
                        'title' => Translater::get()->l('Top'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'prefix_class' => 'elementor-position-',
                'section' => 'section_icon',
                'toggle' => false,
            ]
        );

        $this->addControl(
            'title_size',
            [
                'label' => Translater::get()->l('Title HTML Tag'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'h1' => Translater::get()->l('H1'),
                    'h2' => Translater::get()->l('H2'),
                    'h3' => Translater::get()->l('H3'),
                    'h4' => Translater::get()->l('H4'),
                    'h5' => Translater::get()->l('H5'),
                    'h6' => Translater::get()->l('H6'),
                    'div' => Translater::get()->l('div'),
                    'span' => Translater::get()->l('span'),
                    'p' => Translater::get()->l('p'),
                ],
                'default' => 'h3',
                'section' => 'section_icon',
            ]
        );

        $this->addControl(
            'section_style_icon',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Icon'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerIconStyleControls('section_style_icon');

        $this->addControl(
            'icon_space',
            [
                'label' => Translater::get()->l('Icon Spacing'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_icon',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}}.elementor-position-right .elementor-icon-box-icon' => 'margin-left: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-left .elementor-icon-box-icon' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-top .elementor-icon-box-icon' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'section_style_content',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'text_align',
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
                    'justify' => [
                        'title' => Translater::get()->l('Justified'),
                        'icon' => 'fa fa-align-justify',
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-wrapper' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'content_vertical_alignment',
            [
                'label' => Translater::get()->l('Vertical Alignment'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'top' => Translater::get()->l('Top'),
                    'middle' => Translater::get()->l('Middle'),
                    'bottom' => Translater::get()->l('Bottom'),
                ],
                'default' => 'top',
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'prefix_class' => 'elementor-vertical-align-',
            ]
        );

        $this->addControl(
            'heading_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            'title_bottom_space',
            [
                'label' => Translater::get()->l('Title Spacing'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Title Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->addControl(
            'heading_description',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'description_color',
            [
                'label' => Translater::get()->l('Description Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-icon-box-content .elementor-icon-box-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $this->addRenderAttribute('icon', 'class', ['elementor-icon', 'elementor-animation-' . $instance['hover_animation']]);

        $icon_tag = 'span';

        if (!empty($instance['link']['url'])) {
            $this->addRenderAttribute('link', 'href', $instance['link']['url']);
            $icon_tag = 'a';

            if (!empty($instance['link']['is_external'])) {
                $this->addRenderAttribute('link', 'target', '_blank');
                $this->addRenderAttribute('link', 'rel', 'noopener noreferrer');
            }
        }

        $icon_attributes = $this->getRenderAttributeString('icon');
        $link_attributes = $this->getRenderAttributeString('link');
        ?>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <<?php echo implode(' ', [$icon_tag, $icon_attributes, $link_attributes]); ?>>
                <?php echo $this->renderIconFromSettings($instance); ?>
            </<?php echo $icon_tag; ?>>
        </div>
        <div class="elementor-icon-box-content">
        <<?php echo $instance['title_size']; ?> class="elementor-icon-box-title">
        <<?php echo implode(' ', [$icon_tag, $link_attributes]); ?>><?php echo $instance['title_text']; ?></<?php echo $icon_tag; ?>>
        </<?php echo $instance['title_size']; ?>>
        <div class="elementor-icon-box-description"><?php echo $instance['description_text']; ?></div>
        </div>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <# var link = settings.link && settings.link.url ? 'href="' + settings.link.url + '"' : '',
        iconTag = link ? 'a' : 'span'; #>
        <div class="elementor-icon-box-wrapper">
            <div class="elementor-icon-box-icon">
                <{{{ iconTag + ' ' + link }}} class="elementor-icon elementor-animation-{{ settings.hover_animation }}">
                {{{ <?php echo static::getIconTemplateExpression(); ?> }}}
            </
            {{{ iconTag }}}>
        </div>
        <div class="elementor-icon-box-content">
            <{{{ settings.title_size }}} class="elementor-icon-box-title">
            <{{{ iconTag + ' ' + link }}}>{{{ settings.title_text }}}
        </{{{ iconTag }}}>
        </{{{ settings.title_size }}}>
        <div class="elementor-icon-box-description">{{{ settings.description_text }}}</div>
        </div>
        </div>
        <?php
    }
}
