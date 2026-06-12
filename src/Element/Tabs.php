<?php

namespace IqitElementor\Element;

use IqitElementor\Base\ElementBase;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\Typography;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\AdvancedControlsTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

/**
 * Tabs container.
 * Elements[] holds Tab children — each Tab is itself a drop zone.
 */
class Tabs extends ElementBase
{
    use AdvancedControlsTrait;

    public function getId(): string
    {
        return 'tabs';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Tabs');
    }

    public function getIcon(): string
    {
        return 'folder-open';
    }

    protected function registerControls(): void
    {
        $this->registerLayoutControls();
        $this->registerTitleStyleControls();
        $this->registerContentStyleControls();
        $this->registerAdvancedControls();
    }

    private function registerLayoutControls(): void
    {
        $this->startControlsSection(
            'tabs_layout',
            [
                'label' => Translater::get()->l('Layout'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        $this->addControl(
            'orientation',
            [
                'label' => Translater::get()->l('Orientation'),
                'type' => ControlManager::SELECT,
                'default' => 'horizontal',
                'options' => [
                    'horizontal' => Translater::get()->l('Horizontal'),
                    'vertical' => Translater::get()->l('Vertical'),
                ],
                'prefix_class' => 'elementor-tabs-view-',
            ]
        );

        $this->addResponsiveControl(
            'title_align',
            [
                'label' => Translater::get()->l('Titles Alignment'),
                'type' => ControlManager::SELECT,
                'default' => 'left',
                'options' => [
                    'left' => Translater::get()->l('Left'),
                    'center' => Translater::get()->l('Center'),
                    'right' => Translater::get()->l('Right'),
                    'stretch' => Translater::get()->l('Stretch'),
                    'space-between' => Translater::get()->l('Space Between'),
                    'space-around' => Translater::get()->l('Space Around'),
                    'space-evenly' => Translater::get()->l('Space Evenly'),
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-view-horizontal .elementor-tabs-nav' => 'justify-content: {{VALUE}};',
                ],
                'selectors_dictionary' => [
                    'left' => 'flex-start',
                    'right' => 'flex-end',
                    'center' => 'center',
                    'stretch' => 'flex-start',
                    'space-between' => 'space-between',
                    'space-around' => 'space-around',
                    'space-evenly' => 'space-evenly',
                ],
                'condition' => [
                    'orientation' => 'horizontal',
                ],
            ]
        );

        // Hidden helper: when stretch is selected, give children flex:1 to actually fill the row.
        $this->addResponsiveControl(
            'title_align_stretch_helper',
            [
                'type' => ControlManager::HIDDEN,
                'default' => '1',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-view-horizontal .elementor-tabs-nav > .elementor-tab-title' => 'flex: {{VALUE}};',
                ],
                'condition' => [
                    'orientation' => 'horizontal',
                    'title_align' => 'stretch',
                ],
            ]
        );

        $this->addResponsiveControl(
            'titles_gap',
            [
                'label' => Translater::get()->l('Gap between tabs'),
                'type' => ControlManager::SLIDER,
                'size_units' => ['px'],
                'range' => [
                    'px' => ['min' => 0, 'max' => 100, 'step' => 1],
                ],
                'default' => ['size' => 0, 'unit' => 'px'],
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'vertical_width',
            [
                'label' => Translater::get()->l('Titles Column Width (%)'),
                'type' => ControlManager::NUMBER,
                'min' => 10,
                'max' => 80,
                'default' => 25,
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-view-vertical .elementor-tabs-nav' => 'flex: 0 0 {{VALUE}}%; max-width: {{VALUE}}%;',
                ],
                'condition' => [
                    'orientation' => 'vertical',
                ],
            ]
        );

        $this->addControl(
            'panel_tabs',
            [
                'label' => Translater::get()->l('Tabs'),
                'type' => ControlManager::REPEATER,
                'separator' => 'before',
                'default' => [
                    ['tab_title' => Translater::get()->l('Tab #1')],
                    ['tab_title' => Translater::get()->l('Tab #2')],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => Translater::get()->l('Title'),
                        'type' => ControlManager::TEXT,
                        'default' => Translater::get()->l('Tab Title'),
                        'label_block' => true,
                    ],
                ],
                'title_field' => 'tab_title',
            ]
        );

        $this->endControlsSection();
    }

    private function registerTitleStyleControls(): void
    {
        $this->startControlsSection(
            'tabs_title_style',
            [
                'label' => Translater::get()->l('Tabs Titles'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->startControlsTabs('title_style_tabs');

        // Normal Tab
        $this->startControlsTab(
            'title_style_normal',
            [
                'label' => Translater::get()->l('Normal'),
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'default' => '#556068',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_bg',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'default' => '#d5dadf',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'title_border',
                'selector' => '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title',
                'separator' => 'before',
            ]
        );

        $this->endControlsTab();

        // Active Tab
        $this->startControlsTab(
            'title_style_active',
            [
                'label' => Translater::get()->l('Active'),
            ]
        );

        $this->addControl(
            'title_active_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'default' => '#9b0a46',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title.elementor-active' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_active_bg',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'default' => '#ffffff',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title.elementor-active' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'title_active_border',
                'selector' => '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title.elementor-active',
                'separator' => 'before',
            ]
        );

        $this->endControlsTab();

        $this->endControlsTabs();

        $this->addGroupControl(
            Typography::getType(),
            [
                'label' => Translater::get()->l('Typography'),
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-nav > .elementor-tab-title',
                'separator' => 'before',
            ]
        );

        $this->endControlsSection();
    }

    private function registerContentStyleControls(): void
    {
        $this->startControlsSection(
            'tabs_content_style',
            [
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'content_bg',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-content' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'content_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-content > .elementor-tab-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'content_border',
                'selector' => '{{WRAPPER}}.elementor-tabs-wrapper.elementor-tabs-wrapper > .elementor-tabs > .elementor-tabs-content',
                'separator' => 'before',
            ]
        );

        $this->endControlsSection();
    }

    private function registerAdvancedControls(): void
    {
        $this->startControlsSection(
            'section_advanced',
            [
                'label' => Translater::get()->l('Advanced'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addResponsiveControl(
            'margin',
            [
                'label' => Translater::get()->l('Margin'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}}' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'selectors' => [
                    '{{WRAPPER}}' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'css_classes',
            [
                'label' => Translater::get()->l('CSS Classes'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
            ]
        );

        $this->endControlsSection();

        $this->registerCustomAttributesControls(self::TAB_ADVANCED);
        $this->registerCustomCssControls(self::TAB_ADVANCED);
    }

    protected function renderSettings(): void
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="elementor-editor-element-settings elementor-editor-tabs-settings">
                <ul class="elementor-editor-element-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php echo Translater::get()->l('Drag Tabs'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Tabs'); ?></span>
                            <i class="fa fa-grip-lines"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo Translater::get()->l('Duplicate Tabs'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo Translater::get()->l('Remove Tabs'); ?>">
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
        <div class="elementor-tabs">
            <ul class="elementor-tabs-nav" role="tablist"></ul>
            <div class="elementor-tabs-content"></div>
        </div>
        <?php
    }

    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
        $this->addRenderAttribute('wrapper', 'class', [
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-tabs-wrapper',
        ]);

        $this->addRenderAttribute('wrapper', 'data-element_type', $this->getId());

        if (!empty($instance['css_classes'])) {
            $this->addRenderAttribute('wrapper', 'class', $instance['css_classes']);
        }

        foreach ($this->getClassControls() as $control) {
            if (empty($instance[$control['name']])) {
                continue;
            }
            if (!$this->isControlVisible($instance, $control)) {
                continue;
            }
            $this->addRenderAttribute('wrapper', 'class', $control['prefix_class'] . $instance[$control['name']]);
        }

        $this->applyCustomAttributes($instance);

        if (Plugin::instance()->editor->isEditMode()) {
            $this->renderCustomCss($instance, $element_id);
        }
        ?>
        <div <?php echo $this->getRenderAttributeString('wrapper'); ?>>
            <div class="elementor-tabs" data-tabs-id="<?php echo Helper::escAttr($element_id); ?>">
        <?php
    }

    public function afterRender(array $instance, string $element_id, array $element_data = []): void
    {
        ?>
            </div>
        </div>
        <?php
    }

    /**
     * Render the nav bar (tab titles) from tab children.
     *
     * @param array<int, array> $tab_children
     */
    public function renderNav(array $tab_children, string $tabs_id): void
    {
        ?>
        <ul class="elementor-tabs-nav" role="tablist">
        <?php
        foreach ($tab_children as $index => $tab_data) {
            $tab_obj = Plugin::instance()->elementsManager->getElement('tab');
            if (!$tab_obj) {
                continue;
            }
            $tab_instance = $tab_obj->getParseValues(isset($tab_data['settings']) ? $tab_data['settings'] : []);
            $title = isset($tab_instance['tab_title']) ? $tab_instance['tab_title'] : '';
            $active = 0 === $index ? ' elementor-active' : '';
            $pane_id = 'elementor-tab-pane-' . $tabs_id . '-' . $index;
            $title_id = 'elementor-tab-title-' . $tabs_id . '-' . $index;
            ?>
            <li class="elementor-tab-title<?php echo $active; ?>"
                id="<?php echo Helper::escAttr($title_id); ?>"
                role="tab"
                aria-controls="<?php echo Helper::escAttr($pane_id); ?>"
                aria-selected="<?php echo 0 === $index ? 'true' : 'false'; ?>"
                data-tab="<?php echo (int) $index; ?>">
                <span><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></span>
            </li>
        <?php
        }
        ?>
        </ul>
        <div class="elementor-tabs-content">
        <?php
    }

    public function afterRenderContent(): void
    {
        ?>
        </div>
        <?php
    }
}
