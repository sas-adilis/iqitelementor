<?php

namespace IqitElementor\Base;

use IqitElementor\Helper\Helper;
use IqitElementor\Helper\OutputHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Plugin;
use IqitElementor\Traits\AdvancedControlsTrait;
use IqitElementor\Control\Group\Background;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\BoxShadow;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class WidgetBase extends ElementBase
{
    use AdvancedControlsTrait;
    public function getType(): string
    {
        return 'widget';
    }

    public function getIcon(): string
    {
        return 'font';
    }

    /**
     * Restrict a widget to one or more editor page types (e.g. `['store']`).
     *
     * Empty array (default) means the widget is available on every page type.
     * Rendering is never affected — the filter only controls visibility in
     * the editor panel so irrelevant widgets don't clutter the palette.
     *
     * @return string[]
     */
    public function getSupportedPageTypes(): array
    {
        return [];
    }

    public function parseTextEditor(string $content, array $instance = []): string
    {
        return $content;
    }

    protected function afterRegisterControls(): void
    {
        parent::afterRegisterControls();

        $this->startControlsSection(
            '_section_style',
            [
                'label' => Translater::get()->l('Layout'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addResponsiveControl(
            '_margin',
            [
                'label' => Translater::get()->l('Margin'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_ADVANCED,
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            '_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%'],
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            '_element_width',
            [
                'label' => Translater::get()->l('Width'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'auto' => Translater::get()->l('Inline') . ' (auto)',
                    'initial' => Translater::get()->l('Custom'),
                ],
                'selectors_dictionary' => [
                    'auto' => 'width: auto; display: inline-block;',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => '{{VALUE}}',
                ],
            ]
        );

        $this->addResponsiveControl(
            '_element_custom_width',
            [
                'label' => Translater::get()->l('Custom Width'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 1000,
                        'step' => 1,
                    ],
                ],
                'condition' => [
                    '_element_width' => 'initial',
                ],
                'device_args' => [
                    'tablet' => [
                        'condition' => [
                            '_element_width_tablet' => 'initial',
                        ],
                    ],
                    'mobile' => [
                        'condition' => [
                            '_element_width_mobile' => 'initial',
                        ],
                    ],
                ],
                'size_units' => ['px', '%', 'vw'],
                'selectors' => [
                    '{{WRAPPER}}' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            '_element_max_width',
            [
                'label' => Translater::get()->l('Max Width'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 1000,
                        'step' => 1,
                    ],
                ],
                'device_args' => [
                    'tablet' => [
                        'condition' => [
                            '_element_width_tablet' => 'initial',
                        ],
                    ],
                    'mobile' => [
                        'condition' => [
                            '_element_width_mobile' => 'initial',
                        ],
                    ],
                ],
                'size_units' => ['px', '%', 'vw'],
                'selectors' => [
                    '{{WRAPPER}}' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            '_flex_order',
            [
                'label' => Translater::get()->l('Order'),
                'type' => ControlManager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'start' => [
                        'title' => Translater::get()->l('Start'),
                        'icon' => 'eicon-v-align-top',
                    ],
                    'end' => [
                        'title' => Translater::get()->l('End'),
                        'icon' => 'eicon-v-align-bottom',
                    ],
                    'custom' => [
                        'title' => Translater::get()->l('Custom'),
                        'icon' => 'eicon-ellipsis-v',
                    ],
                ],
                'selectors_dictionary' => [
                    'start' => 'order: -99999;',
                    'end' => 'order: 99999;',
                    'custom' => '',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => '{{VALUE}}',
                ],
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            '_flex_order_custom',
            [
                'label' => Translater::get()->l('Custom Order'),
                'type' => ControlManager::NUMBER,
                'condition' => [
                    '_flex_order' => 'custom',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'order: {{VALUE}};',
                ],
            ]
        );



        $this->addControl(
            '_z_index',
            [
                'label' => Translater::get()->l('Z-index'),
                'type' => ControlManager::NUMBER,
                'min' => 0,
                'default' => '',
                'section' => '_section_style',
                'tab' => self::TAB_ADVANCED,
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}}' => 'z-index: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            '_element_id',
            [
                'label' => Translater::get()->l('CSS ID'),
                'type' => ControlManager::TEXT,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'title' => Translater::get()->l('Add your custom id WITHOUT the Pound key. e.g: my-id'),
                'style_transfer' => false,
            ]
        );

        $this->addControl(
            '_css_classes',
            [
                'label' => Translater::get()->l('CSS Classes'),
                'type' => ControlManager::TEXT,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_style',
                'default' => '',
                'prefix_class' => '',
                'label_block' => false,
                'title' => Translater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class'),
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            '_section_animation_entrance',
            [
                'label' => Translater::get()->l('Entrance Animation'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );



        $this->addControl(
            '_animation',
            [
                'label' => Translater::get()->l('Entrance Animation'),
                'type' => ControlManager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'tab' => self::TAB_ADVANCED,
                'label_block' => true,
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
                'condition' => [
                    '_animation!' => '',
                ],
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            '_section_advanced_style',
            [
                'label' => Translater::get()->l('Advanced Style'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addGroupControl(
            Background::getType(),
            [
                'name' => '_background',
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->addControl(
            '_section_border',
            [
                'label' => Translater::get()->l('Border'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => '_border',
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->addResponsiveControl(
            '_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_background',
                'selectors' => [
                    '{{WRAPPER}} .elementor-widget-container' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            '_section_box_shadow',
            [
                'label' => Translater::get()->l('Box shadow'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => '_box_shadow',
                'section' => '_section_background',
                'tab' => self::TAB_ADVANCED,
                'selector' => '{{WRAPPER}} .elementor-widget-container',
            ]
        );

        $this->addControl(
            '_section_responsive',
            [
                'label' => Translater::get()->l('Responsive'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_ADVANCED,
            ]
        );

        $this->addControl(
            'responsive_description',
            [
                'raw' => Translater::get()->l('Attention: The display settings (show/hide for mobile, tablet or desktop) will only take effect once you are on the preview or live page, and not while you\'re in editing mode in Elementor.'),
                'type' => ControlManager::RAW_HTML,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'classes' => 'elementor-control-descriptor',
            ]
        );

        $this->addControl(
            'hide_desktop',
            [
                'label' => Translater::get()->l('Hide On Desktop'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-desktop',
            ]
        );

        $this->addControl(
            'hide_tablet',
            [
                'label' => Translater::get()->l('Hide On Tablet'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-tablet',
            ]
        );

        $this->addControl(
            'hide_mobile',
            [
                'label' => Translater::get()->l('Hide On Mobile'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_ADVANCED,
                'section' => '_section_responsive',
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => 'Hide',
                'label_off' => 'Show',
                'return_value' => 'hidden-phone',
            ]
        );

        $this->endControlsSection();

        // Custom Attributes
        $this->registerCustomAttributesControls(self::TAB_ADVANCED);

        // Custom CSS
        $this->registerCustomCssControls(self::TAB_ADVANCED);
    }

    final public function printTemplate(): void
    {
        $contentTemplate = OutputHelper::capture(function () {
            $this->contentTemplate();
        });

        if (empty($contentTemplate)) {
            return;
        }
        ?>
        <script type="text/html" id="tmpl-elementor-<?php echo $this->getType(); ?>-<?php echo Helper::escAttr($this->getId()); ?>-content">
            <?php $this->renderSettings(); ?>
            <div class="elementor-widget-container">
                <?php echo $contentTemplate; ?>
            </div>
        </script>
        <?php
    }

    public function renderContent(array $instance): void
    {
        if (Plugin::instance()->editor->isEditMode()) {
            $this->renderSettings();
        }
        ?>
        <div class="elementor-widget-container">
            <?php
        echo OutputHelper::capture(function () use ($instance) {
            $this->render($instance);
        });
        ?>
        </div>
        <?php
    }

    public function renderPlainContent(array $instance = []): void
    {
        $this->renderContent($instance);
    }

    protected function renderSettings(): void
    {
        ?>
        <div class="elementor-editor-element-settings elementor-editor-<?php echo Helper::escAttr($this->getType()); ?>-settings elementor-editor-<?php echo Helper::escAttr($this->getId()); ?>-settings" data-title="<?php echo Helper::escAttr($this->getTitle()); ?>">
            <ul class="elementor-editor-element-settings-list">
                <li class="elementor-editor-element-setting elementor-editor-element-edit">
                    <a href="#" title="<?php echo Translater::get()->l('Edit'); ?>">
                        <span class="elementor-screen-only"><?php echo Translater::get()->l('Edit'); ?></span>
                        <i class="fa fa-pencil"></i>
                    </a>
                </li>
                <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                    <a href="#" title="<?php echo Translater::get()->l('Duplicate'); ?>">
                        <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate'); ?></span>
                        <i class="fa fa-copy"></i>
                    </a>
                </li>
                <li class="elementor-editor-element-setting elementor-editor-element-remove">
                    <a href="#" title="<?php echo Translater::get()->l('Remove'); ?>">
                        <span class="elementor-screen-only"><?php echo Translater::get()->l('Remove'); ?></span>
                        <i class="fa fa-times"></i>
                    </a>
                </li>
            </ul>
        </div>
        <?php
    }

    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
        $this->addRenderAttribute('wrapper', 'class', [
            'elementor-widget',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-widget-' . $this->getId(),
        ]);

        foreach ($this->getClassControls() as $control) {
            if (empty($instance[$control['name']])) {
                continue;
            }

            if (!$this->isControlVisible($instance, $control)) {
                continue;
            }

            $this->addRenderAttribute('wrapper', 'class', $control['prefix_class'] . $instance[$control['name']]);
        }

        if (!empty($instance['_animation'])) {
            $this->addRenderAttribute('wrapper', 'data-animation', $instance['_animation']);
        }

        // Applique les attributs personnalisés
        $this->applyCustomAttributes($instance);

        $this->addRenderAttribute('wrapper', 'data-element_type', $this->getId());

        // Rend le CSS personnalisé en mode éditeur (en frontend, c'est géré par Frontend::collectCustomCss)
        if (Plugin::instance()->editor->isEditMode()) {
            $this->renderCustomCss($instance, $element_id);
        }
        ?>
    <div <?php echo $this->getRenderAttributeString('wrapper'); ?>>
        <?php
    }

    public function afterRender(array $instance, string $element_id, array $element_data = []): void
    {
        ?>
    </div>
    <?php
    }

    protected function render(array $instance = []): void
    {
        $options = $this->getParseValues($instance);
        if (Plugin::instance()->editor->isEditMode()) {
            echo Helper::renderIqitElementorWidgetPreview($this->getId(), $options);
        } else {
            echo Helper::renderIqitElementorWidget($this->getId(), $options);
        }
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        return $optionsSource;
    }

    protected function contentTemplate(): void
    {
        // TODO: Implement contentTemplate() method.
    }
}
