<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class TextEditor extends WidgetBase
{
    public function getId(): string
    {
        return 'text-editor';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Text Editor');
    }

    public function getIcon(): string
    {
        return 'text';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_editor',
            [
                'label' => Translater::get()->l('Text Editor'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'editor',
            [
                'label' => '',
                'type' => ControlManager::WYSIWYG,
                'description' => Translater::get()->l('DO NOT use it for CSS or JS codes. Only clean HTML will work'),
                'default' => '<p>' . Translater::get()->l('I am text block. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.') . '</p>',
                'section' => 'section_editor',
            ]
        );

        $this->addControl(
            'section_style',
            [
                'label' => Translater::get()->l('Text Editor'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
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
                'selectors' => [
                    '{{WRAPPER}} .elementor-text-editor' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'typography',
                'section' => 'section_style',
                'tab' => self::TAB_STYLE,
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $instance['editor'] = $this->parseTextEditor($instance['editor'], $instance);
        ?>
        <div class="elementor-text-editor rte-content"><?php echo $instance['editor']; ?></div>
        <?php
    }

    public function renderPlainContent(array $instance = []): void
    {
        // In plain mode, render without shortcode
        echo $instance['editor'];
    }

    protected function contentTemplate(): void
    {
        ?>
        <div class="elementor-text-editor rte-content">{{{ settings.editor }}}</div>
        <?php
    }
}
