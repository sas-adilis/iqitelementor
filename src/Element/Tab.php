<?php

namespace IqitElementor\Element;

use IqitElementor\Base\ElementBase;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\AdvancedControlsTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

/**
 * Individual tab inside a Tabs container.
 * Acts as a drop zone — its elements[] holds widgets and inner sections.
 */
class Tab extends ElementBase
{
    use AdvancedControlsTrait;

    public function getId(): string
    {
        return 'tab';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Tab');
    }

    public function getIcon(): string
    {
        return 'folder';
    }

    protected function registerControls(): void
    {
        $this->startControlsSection(
            'tab_content',
            [
                'label' => Translater::get()->l('Tab'),
                'tab' => self::TAB_CONTENT,
            ]
        );

        $this->addControl(
            'tab_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::TEXT,
                'default' => Translater::get()->l('Tab Title'),
                'label_block' => true,
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            'tab_advanced',
            [
                'label' => Translater::get()->l('Advanced'),
                'tab' => self::TAB_ADVANCED,
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
            <div class="tab-title"></div>
            <div class="elementor-editor-element-settings elementor-editor-tab-settings">
                <ul class="elementor-editor-element-settings-list elementor-editor-tab-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo Translater::get()->l('Duplicate Tab'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-add">
                        <a href="#" title="<?php echo Translater::get()->l('Add New Tab'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Add'); ?></span>
                            <i class="fa fa-plus"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo Translater::get()->l('Remove Tab'); ?>">
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
        <div class="elementor-tab-content-wrap">
            <div class="elementor-widget-wrap"></div>
        </div>
        <?php
    }

    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
        $tabs_id = isset($element_data['_tabs_id']) ? $element_data['_tabs_id'] : '';
        $index = isset($element_data['_index']) ? (int) $element_data['_index'] : 0;
        $is_active = 0 === $index;

        $this->addRenderAttribute('wrapper', 'class', [
            'elementor-tab-content',
            'elementor-element',
            'elementor-element-' . $element_id,
            $is_active ? 'elementor-tab-active' : '',
        ]);

        $this->addRenderAttribute('wrapper', 'data-element_type', $this->getId());
        $this->addRenderAttribute('wrapper', 'data-tab-index', (string) $index);
        $this->addRenderAttribute('wrapper', 'id', 'elementor-tab-pane-' . $tabs_id . '-' . $index);
        $this->addRenderAttribute('wrapper', 'role', 'tabpanel');
        $this->addRenderAttribute('wrapper', 'aria-labelledby', 'elementor-tab-title-' . $tabs_id . '-' . $index);

        if (!empty($instance['css_classes'])) {
            $this->addRenderAttribute('wrapper', 'class', $instance['css_classes']);
        }

        $this->applyCustomAttributes($instance);

        if (Plugin::instance()->editor->isEditMode()) {
            $this->renderCustomCss($instance, $element_id);
        }
        ?>
        <div <?php echo $this->getRenderAttributeString('wrapper'); ?>>
            <div class="elementor-widget-wrap">
        <?php
    }

    public function afterRender(array $instance, string $element_id, array $element_data = []): void
    {
        ?>
            </div>
        </div>
        <?php
    }
}
