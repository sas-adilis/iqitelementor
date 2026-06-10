<?php

namespace IqitElementor\Element;
use IqitElementor\Base\ElementBase;
use IqitElementor\Control\Group\Background;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\AdvancedControlsTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Column extends ElementBase
{
    use AdvancedControlsTrait;
    public function getId(): string
    {
        return 'column';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Column');
    }

    public function getIcon(): string
    {
        return 'columns';
    }

    protected function registerControls(): void
    {

        // Section Layout.
        $this->startControlsSection(
            'layout',
            [
                'label' => Translater::get()->l('Layout'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        $this->addResponsiveControl(
            'width_behavior',
            [
                'label' => Translater::get()->l('Width Behavior'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'auto' => Translater::get()->l('Auto'),
                    'dynamic' => Translater::get()->l('Dynamic'),
                ],
                'prefix_class' => 'col%s-behavior-',
            ]
        );

        $this->addResponsiveControl(
            'width',
            [
                'label' => Translater::get()->l('Column Width') . ' (%)',
                'type' => ControlManager::NUMBER,
                'min' => 2,
                'max' => 100,
                'selectors' => [
                    '{{WRAPPER}}' => 'width: {{VALUE}}%',
                ],
                'condition' => [
                    'width_behavior' => '',
                ],
            ]
        );

        /*$this->addResponsiveControl(
            'align',
            [
                'label' => Translater::get()->l('Horizontal Align'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'flex-start' => Translater::get()->l('Start'),
                    'center' => Translater::get()->l('Center'),
                    'flex-end' => Translater::get()->l('End'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-column > .elementor-column-wrap > .elementor-widget-wrap' => 'align-items: {{VALUE}}',
                ],
            ]
        );*/

        $this->addControl(
            'layout_vertical',
            [
                'label' => Translater::get()->l('Vertical behavior'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            'align_vertical',
            [
                'label' => Translater::get()->l('Vertical Align'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'flex-start' => Translater::get()->l('Start'),
                    'center' => Translater::get()->l('Center'),
                    'flex-end' => Translater::get()->l('End'),
                    'stretch' => Translater::get()->l('Stretch'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-column > .elementor-column-wrap > .elementor-widget-wrap' => 'align-content: {{VALUE}}',
                ],
            ]
        );

        $this->addResponsiveControl(
            'row_gap',
            [
                'label' => Translater::get()->l('Widgets Space') . ' (px)',
                'type' => ControlManager::NUMBER,
                'placeholder' => 10,
                'selectors' => [
                    // Need the full path for exclude the inner section
                    '{{WRAPPER}} > .elementor-column-wrap > .elementor-widget-wrap' => 'row-gap: {{VALUE}}px',
                ],
            ]
        );

        $this->addControl(
            'layout_horizontal',
            [
                'label' => Translater::get()->l('Horizontal behavior'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            'align_horizontal',
            [
                'label' => Translater::get()->l('Horizontal Align'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'flex-start' => Translater::get()->l('Start'),
                    'center' => Translater::get()->l('Center'),
                    'flex-end' => Translater::get()->l('End'),
                    'space-between' => Translater::get()->l('Space Between'),
                    'space-around' => Translater::get()->l('Space Around'),
                    'space-evenly' => Translater::get()->l('Space Evenly'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-column > .elementor-column-wrap > .elementor-widget-wrap' => 'justify-content: {{VALUE}}',
                ],
            ]
        );

        $this->addResponsiveControl(
            'column_gap',
            [
                'label' => Translater::get()->l('Widgets Space') . ' (px)',
                'type' => ControlManager::NUMBER,
                'placeholder' => 20,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-column-wrap > .elementor-widget-wrap' => 'column-gap: {{VALUE}}px',
                ],
            ]
        );

        $this->endControlsSection();

        $this->addControl(
            'section_style',
            [
                'label' => Translater::get()->l('Background & Border'),
                'tab' => self::TAB_STYLE,
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addGroupControl(
            Background::getType(),
            [
                'name' => 'background',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} > .elementor-column-wrap',
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'border',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'selector' => '{{WRAPPER}} > .elementor-element-populated',
            ]
        );

        $this->addResponsiveControl(
            'border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => 'box_shadow',
                'section' => 'section_style',
                'tab' => self::TAB_STYLE,
                'selector' => '{{WRAPPER}} > .elementor-element-populated',
            ]
        );

        // Section Typography
        $this->addControl(
            'section_typo',
            [
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'heading_color',
            [
                'label' => Translater::get()->l('Heading Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_typo',
            ]
        );

        $this->addControl(
            'color_text',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'color_link',
            [
                'label' => Translater::get()->l('Link Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated a' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'color_link_hover',
            [
                'label' => Translater::get()->l('Link Hover Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_typo',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-element-populated a:hover' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'text_align',
            [
                'label' => Translater::get()->l('Text Align'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_typo',
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
                    '{{WRAPPER}} > .elementor-element-populated' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        // Section Advanced
        $this->addControl(
            'section_advanced',
            [
                'label' => Translater::get()->l('Advanced'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addResponsiveControl(
            'margin',
            [
                'label' => Translater::get()->l('Margin'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'animation',
            [
                'label' => Translater::get()->l('Entrance Animation'),
                'type' => ControlManager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'tab' => self::TAB_ADVANCED,
                'label_block' => true,
                'section' => 'section_advanced',
            ]
        );

        $this->addControl(
            'animation_duration',
            [
                'label' => Translater::get()->l('Animation Duration'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    'slow' => Translater::get()->l('Slow'),
                    '' => Translater::get()->l('Normal'),
                    'fast' => Translater::get()->l('Fast'),
                ],
                'prefix_class' => 'animated-',
                'tab' => self::TAB_ADVANCED,
                'section' => 'section_advanced',
                'condition' => [
                    'animation!' => '',
                ],
            ]
        );

        $this->addControl(
            'css_classes',
            [
                'label' => Translater::get()->l('CSS Classes'),
                'type' => ControlManager::TEXT,
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
                'title' => Translater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class'),
            ]
        );

        $this->addControl(
            'z_index',
            [
                'label' => Translater::get()->l('Z-index'),
                'type' => ControlManager::NUMBER,
                'min' => 0,
                'default' => '',
                'section' => 'section_advanced',
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} > .elementor-element-populated' => 'z-index: {{VALUE}};',
                ],
            ]
        );

        // Section Responsive
        $this->addControl(
            'section_responsive',
            [
                'label' => Translater::get()->l('Responsive'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addControl(
            'hide_desktop',
            [
                'label' => Translater::get()->l('Hide On Desktop'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'section' => 'section_responsive',
                'tab' => self::TAB_ADVANCED,
                'return_value' => 'hidden-desktop',
            ]
        );

        $this->addControl(
            'hide_tablet',
            [
                'label' => Translater::get()->l('Hide On Tablet'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'section' => 'section_responsive',
                'tab' => self::TAB_ADVANCED,
                'return_value' => 'hidden-tablet',
            ]
        );

        $this->addControl(
            'hide_mobile',
            [
                'label' => Translater::get()->l('Hide On Mobile'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'section' => 'section_responsive',
                'tab' => self::TAB_ADVANCED,
                'return_value' => 'hidden-phone',
            ]
        );

        $this->registerCustomAttributesControls(self::TAB_ADVANCED);
        $this->registerCustomCssControls(self::TAB_ADVANCED);
    }

    protected function renderSettings(): void
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="column-title"></div>
            <div class="elementor-editor-element-settings elementor-editor-column-settings">
                <ul class="elementor-editor-element-settings-list elementor-editor-column-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php echo Translater::get()->l('Drag Column'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Column'); ?></span>
                            <i class="fa fa-columns"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo Translater::get()->l('Duplicate Column'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-add">
                        <a href="#" title="<?php echo Translater::get()->l('Add New Column'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Add'); ?></span>
                            <i class="fa fa-plus"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo Translater::get()->l('Remove Column'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Remove'); ?></span>
                            <i class="fa fa-times"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php
    }

    protected function contentTemplate(): void
    {
        ?>
        <div class="elementor-column-wrap">
            <div class="elementor-widget-wrap"></div>
        </div>
        <?php
    }

    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
        $column_type = !empty($element_data['isInner']) ? 'inner' : 'top';

        $this->addRenderAttribute('wrapper', 'class', [
            'elementor-column',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-col-' . $instance['_column_size'],
            'elementor-' . $column_type . '-column',
        ]);

        $this->applyCustomAttributes($instance);

        foreach ($this->getClassControls() as $control) {
            if (empty($instance[$control['name']])) {
                continue;
            }

            if (!$this->isControlVisible($instance, $control)) {
                continue;
            }

            $this->addRenderAttribute('wrapper', 'class', $control['prefix_class'] . $instance[$control['name']]);
        }

        if (!empty($instance['animation'])) {
            $this->addRenderAttribute('wrapper', 'data-animation', $instance['animation']);
        }

        $this->addRenderAttribute('wrapper', 'data-element_type', $this->getId());

        // Rend le CSS personnalisé en mode éditeur
        if (Plugin::instance()->editor->isEditMode()) {
            $this->renderCustomCss($instance, $element_id);
        }
        ?>
        <div <?php echo $this->getRenderAttributeString('wrapper'); ?>>
        <div class="elementor-column-wrap<?php if (!empty($element_data['elements'])) {
        echo ' elementor-element-populated';
    } ?>">
        <div class="elementor-widget-wrap">
        <?php
    }

    public function afterRender(array $instance, string $element_id, array $element_data = []): void
    {
        ?>
        </div>
        </div>
        </div>
        <?php
    }
}
