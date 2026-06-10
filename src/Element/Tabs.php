<?php

namespace IqitElementor\Element;

use IqitElementor\Base\ElementBase;
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

        $this->addControl(
            'title_align',
            [
                'label' => Translater::get()->l('Titles Alignment'),
                'type' => ControlManager::CHOOSE,
                'default' => 'left',
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
                    'stretch' => [
                        'title' => Translater::get()->l('Stretch'),
                        'icon' => 'fa fa-arrows-h',
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}}.elementor-tabs-view-horizontal .elementor-tabs-nav' => 'justify-content: {{VALUE}};',
                ],
                'selectors_dictionary' => [
                    'left' => 'flex-start',
                    'right' => 'flex-end',
                    'center' => 'center',
                    'stretch' => 'stretch',
                ],
                'condition' => [
                    'orientation' => 'horizontal',
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

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Inactive Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_active_color',
            [
                'label' => Translater::get()->l('Active Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-title.elementor-active' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_bg',
            [
                'label' => Translater::get()->l('Inactive Background'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-title' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_active_bg',
            [
                'label' => Translater::get()->l('Active Background'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-title.elementor-active' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            Typography::getType(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-tab-title',
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
                    '{{WRAPPER}} .elementor-tabs-content' => 'background-color: {{VALUE}};',
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
                    '{{WRAPPER}} .elementor-tab-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
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
            $icon = isset($tab_instance['tab_icon']) ? $tab_instance['tab_icon'] : '';
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
                <?php if (!empty($icon)) { ?>
                    <i class="<?php echo Helper::escAttr($icon); ?>" aria-hidden="true"></i>
                <?php } ?>
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
