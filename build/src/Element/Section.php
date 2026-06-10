<?php

namespace IqitElementor\Element;
use IqitElementor\Base\ElementBase;
use IqitElementor\Control\Group\Background;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Core\Plugin;
use IqitElementor\Core\Utils;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\AdvancedControlsTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Section extends ElementBase
{
    use AdvancedControlsTrait;
    private static $presets = [];

    public function getId(): string
    {
        return 'section';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Section');
    }

    public function getIcon(): string
    {
        return 'columns';
    }

    public static function getPresets(?int $columns_count = null, ?int $preset_index = null): array
    {
        if (!self::$presets) {
            self::initPresets();
        }

        $presets = self::$presets;

        if (null !== $columns_count) {
            $presets = $presets[$columns_count];
        }

        if (null !== $preset_index) {
            $presets = $presets[$preset_index];
        }

        return $presets;
    }

    public static function initPresets(): void
    {
        $additional_presets = [
            2 => [
                ['preset' => [33, 66]],
                ['preset' => [66, 33]],
            ],
            3 => [
                ['preset' => [25, 25, 50]],
                ['preset' => [50, 25, 25]],
                ['preset' => [25, 50, 25]],
                ['preset' => [16, 66, 16]],
            ],
        ];

        foreach (range(1, 10) as $columns_count) {
            self::$presets[$columns_count] = [['preset' => []]];

            $preset_unit = floor(1 / $columns_count * 100);

            for ($i = 0; $i < $columns_count; ++$i) {
                self::$presets[$columns_count][0]['preset'][] = $preset_unit;
            }

            if (!empty($additional_presets[$columns_count])) {
                self::$presets[$columns_count] = array_merge(self::$presets[$columns_count], $additional_presets[$columns_count]);
            }

            foreach (self::$presets[$columns_count] as $preset_index => &$preset) {
                $preset['key'] = $columns_count . $preset_index;
            }
        }
    }

    public function getData(): array
    {
        $data = parent::getData();
        $data['presets'] = self::getPresets();

        return $data;
    }

    protected function registerControls(): void
    {
        $this->registerLayoutControls();
        $this->registerBackgroundControls();
        $this->registerBackgroundOverlayControls();
        $this->registerBorderControls();
        $this->registerTypographyControls();
        $this->registerAdvancedControls();
        $this->registerResponsiveControls();
        $this->registerCustomAttributesControls(self::TAB_ADVANCED);
        $this->registerCustomCssControls(self::TAB_ADVANCED);
    }

    /**
     * Register structure section controls.
     */
    private function registerStructureControls(): void
    {
        $this->addControl(
            'structure',
            [
                'label' => Translater::get()->l('Structure'),
                'type' => ControlManager::HIDDEN,
                'default' => '10',
            ]
        );
    }

    /**
     * Register layout section controls.
     */
    private function registerLayoutControls(): void
    {
        $this->startControlsSection(
            'section_layout',
            [
                'label' => Translater::get()->l('Layout'),
                'tab' => self::TAB_LAYOUT,
            ]
        );

        // 1. Columns Gap
        $this->addControl(
            'gap',
            [
                'label' => Translater::get()->l('Columns Gap'),
                'type' => ControlManager::SELECT,
                'default' => 'default',
                'options' => [
                    'no' => Translater::get()->l('No Gap'),
                    'narrow' => Translater::get()->l('Narrow'),
                    'default' => Translater::get()->l('Default'),
                    'extended' => Translater::get()->l('Extended'),
                    'wide' => Translater::get()->l('Wide'),
                    'wider' => Translater::get()->l('Wider'),
                ],
            ]
        );

        // 3. Content Width
        $this->addControl(
            'heading_dimensions',
            [
                'label' => Translater::get()->l('Dimensions'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'layout',
            [
                'label' => Translater::get()->l('Content Width'),
                'type' => ControlManager::SELECT,
                'default' => 'boxed',
                'options' => [
                    'boxed' => Translater::get()->l('Boxed'),
                    'full_width' => Translater::get()->l('Full Width'),
                ],
                'prefix_class' => 'elementor-section-',
            ]
        );

        $this->addControl(
            'content_width',
            [
                'label' => Translater::get()->l('Width (px)'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 500,
                        'max' => 1600,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'max-width: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'layout' => ['boxed'],
                ],
            ]
        );

        $this->addControl(
            'stretch_section',
            [
                'label' => Translater::get()->l('Stretch Section'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'section-stretched',
                'prefix_class' => 'elementor-',
                'force_render' => true,
                'hide_in_inner' => true,
                'description' => Translater::get()->l('Stretch the section to the full width of the page.'),
            ]
        );

        // 4. Height - Top level sections
        $this->addControl(
            'height',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => Translater::get()->l('Default'),
                    'full' => Translater::get()->l('Fit To Screen'),
                    'min-height' => Translater::get()->l('Min Height'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_inner' => true,
            ]
        );

        $this->addResponsiveControl(
            'custom_height',
            [
                'label' => Translater::get()->l('Minimum Height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 400,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1440,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'height' => ['min-height'],
                ],
                'hide_in_inner' => true,
            ]
        );

        // 5. Height - Inner sections
        $this->addControl(
            'heading_height_inner',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'hide_in_top' => true,
            ]
        );

        $this->addControl(
            'height_inner',
            [
                'label' => Translater::get()->l('Height'),
                'type' => ControlManager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => Translater::get()->l('Default'),
                    'min-height' => Translater::get()->l('Min Height'),
                ],
                'prefix_class' => 'elementor-section-height-',
                'hide_in_top' => true,
                'show_label' => false,
            ]
        );

        $this->addControl(
            'custom_height_inner',
            [
                'label' => Translater::get()->l('Minimum Height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 400,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1440,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'height_inner' => ['min-height'],
                ],
                'hide_in_top' => true,
            ]
        );

        // 6. Vertical Alignment
        $this->addControl(
            'heading_alignment',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'column_position',
            [
                'label' => Translater::get()->l('Vertical Align'),
                'type' => ControlManager::SELECT,
                'default' => 'middle',
                'options' => [
                    'top' => Translater::get()->l('Top'),
                    'middle' => Translater::get()->l('Middle'),
                    'bottom' => Translater::get()->l('Bottom'),
                    'space-between' => Translater::get()->l('Space between'),
                    'space-around' => Translater::get()->l('Space around'),
                    'space-evenly' => Translater::get()->l('Space evenly'),

                ],
                'prefix_class' => 'elementor-section-items-',
                'condition' => [
                    'height' => ['full', 'min-height'],
                ],
                'description' => Translater::get()->l('How columns are aligned vertically.'),
            ]
        );

        $this->addControl(
            'content_position',
            [
                'label' => Translater::get()->l('Content Align'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'top' => Translater::get()->l('Top'),
                    'middle' => Translater::get()->l('Middle'),
                    'bottom' => Translater::get()->l('Bottom'),
                ],
                'prefix_class' => 'elementor-section-content-',
                'description' => Translater::get()->l('How content is aligned inside columns.'),
            ]
        );

        $this->registerStructureControls();

        $this->endControlsSection();
    }

    /**
     * Register background section controls.
     */
    private function registerBackgroundControls(): void
    {
        $this->startControlsSection(
            'section_background',
            [
                'label' => Translater::get()->l('Background'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addGroupControl(
            Background::getType(),
            [
                'name' => 'background',
                'types' => ['classic', 'gradient', 'video'],
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Register background overlay section controls.
     */
    private function registerBackgroundOverlayControls(): void
    {
        $this->startControlsSection(
            'background_overlay_section',
            [
                'label' => Translater::get()->l('Background Overlay'),
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'background_background' => ['classic', 'gradient', 'video'],
                ],
            ]
        );

        $this->addGroupControl(
            Background::getType(),
            [
                'name' => 'background_overlay',
                'types' => ['classic', 'gradient'],
                'selector' => '{{WRAPPER}} > .elementor-background-overlay',
                'condition' => [
                    'background_background' => ['classic', 'gradient', 'video'],
                ],
            ]
        );

        $this->addControl(
            'background_overlay_opacity',
            [
                'label' => Translater::get()->l('Opacity'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => .5,
                ],
                'range' => [
                    'px' => [
                        'max' => 1,
                        'step' => 0.01,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-background-overlay' => 'opacity: {{SIZE}};',
                ],
                'condition' => [
                    'background_overlay_background' => ['classic', 'gradient'],
                ],
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Register border section controls.
     */
    private function registerBorderControls(): void
    {
        $this->startControlsSection(
            'section_border',
            [
                'label' => Translater::get()->l('Border'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addGroupControl(
            Border::getType(),
            [
                'name' => 'border',
            ]
        );

        $this->addControl(
            'border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}}, {{WRAPPER}} > .elementor-background-overlay' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => 'box_shadow',
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Register typography section controls.
     */
    private function registerTypographyControls(): void
    {
        $this->startControlsSection(
            'section_typo',
            [
                'label' => Translater::get()->l('Typography'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'heading_color',
            [
                'label' => Translater::get()->l('Heading Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container .elementor-heading-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'color_text',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'color_link',
            [
                'label' => Translater::get()->l('Link Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container a' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'color_link_hover',
            [
                'label' => Translater::get()->l('Link Hover Color'),
                'type' => ControlManager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container a:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'text_align',
            [
                'label' => Translater::get()->l('Text Align'),
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
                ],
                'selectors' => [
                    '{{WRAPPER}} > .elementor-container' => 'text-align: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Register advanced section controls.
     */
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
                'allowed_dimensions' => 'vertical',
                'placeholder' => [
                    'top' => '',
                    'right' => 'auto',
                    'bottom' => '',
                    'left' => 'auto',
                ],
                'selectors' => [
                    '{{WRAPPER}}' => 'margin-top: {{TOP}}{{UNIT}}; margin-bottom: {{BOTTOM}}{{UNIT}};',
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
            'animation',
            [
                'label' => Translater::get()->l('Entrance Animation'),
                'type' => ControlManager::ANIMATION,
                'default' => '',
                'prefix_class' => 'animated ',
                'label_block' => true,
                'separator' => 'before',
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
                'default' => '',
                'prefix_class' => '',
                'label_block' => true,
                'title' => Translater::get()->l('Add your custom class WITHOUT the dot. e.g: my-class'),
                'separator' => 'before',
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Register responsive section controls.
     */
    private function registerResponsiveControls(): void
    {
        $this->startControlsSection(
            '_section_responsive',
            [
                'label' => Translater::get()->l('Responsive'),
                'tab' => self::TAB_ADVANCED,
            ]
        );

        // Column Order
        $this->addControl(
            'heading_column_order',
            [
                'label' => Translater::get()->l('Column Order'),
                'type' => ControlManager::HEADING,
            ]
        );

        $this->addControl(
            'reverse_order_tablet',
            [
                'label' => Translater::get()->l('Reverse Columns (Tablet)'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'reverse-tablet',
            ]
        );

        $this->addControl(
            'reverse_order_mobile',
            [
                'label' => Translater::get()->l('Reverse Columns (Mobile)'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'return_value' => 'reverse-mobile',
            ]
        );

        // Visibility
        $this->addControl(
            'heading_visibility',
            [
                'label' => Translater::get()->l('Visibility'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'responsive_description',
            [
                'raw' => Translater::get()->l('The visibility settings will only take effect on the live page, not in the editor.'),
                'type' => ControlManager::RAW_HTML,
                'classes' => 'elementor-control-descriptor',
            ]
        );

        $this->addControl(
            'hide_desktop',
            [
                'label' => Translater::get()->l('Hide On Desktop'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'prefix_class' => 'elementor-',
                'label_on' => Translater::get()->l('Hide'),
                'label_off' => Translater::get()->l('Show'),
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
                'label_on' => Translater::get()->l('Hide'),
                'label_off' => Translater::get()->l('Show'),
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
                'label_on' => Translater::get()->l('Hide'),
                'label_off' => Translater::get()->l('Show'),
                'return_value' => 'hidden-phone',
            ]
        );

        $this->endControlsSection();
    }

    protected function renderSettings(): void
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="section-title"></div>
            <div class="elementor-editor-element-settings elementor-editor-section-settings">
                <ul class="elementor-editor-element-settings-list elementor-editor-section-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-trigger">
                        <a href="#" title="<?php echo Translater::get()->l('Drag Section'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Section'); ?></span>
                            <i class="fa fa-grip-lines"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo Translater::get()->l('Duplicate'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate Section'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-save">
                        <a href="#" title="<?php echo Translater::get()->l('Save'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Save to Library'); ?></span>
                            <i class="fa fa-floppy-o"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo Translater::get()->l('Remove'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Remove Section'); ?></span>
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
        <# if ( 'video'===settings.background_background ) { var videoLink=settings.background_video_link; if ( videoLink ) { var videoID=elementor.helpers.getYoutubeIDFromURL( settings.background_video_link ); #>
        <div class="elementor-background-video-container">
            <# if ( 'youtube'===settings.background_video_type ) { #>
                <# if ( videoID ) { #>
                <div class="elementor-background-video" data-video-id="{{ videoID }}"></div>
                <# } #>
            <# } else if ( settings.background_video_link_h && settings.background_video_link_h.url ) { #>
            <video class="elementor-background-video" src="{{ settings.background_video_link_h.url }}" autoplay loop muted></video>
            <# } #>
        </div>
        <# } #>
        <# } if ( -1 !== [ 'classic', 'gradient' ].indexOf( settings.background_overlay_background ) ) { #>
        <div class="elementor-background-overlay"></div>
        <# } #>
        <div class="elementor-container elementor-column-gap-{{ settings.gap }}" <# if ( settings.getRenderAttributeString ) { #>{{{ settings.getRenderAttributeString( 'wrapper' ) }}} <# } #>>
            <div class="elementor-row"></div>
        </div>
        <?php
    }

    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
        $section_type = !empty($element_data['isInner']) ? 'inner' : 'top';

        $this->addRenderAttribute('wrapper', 'class', [
            'elementor-section',
            'elementor-element',
            'elementor-element-' . $element_id,
            'elementor-' . $section_type . '-section',
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
        <?php
        if ('video' === $instance['background_background']) {
            if ($instance['background_video_link']) {
                $video_id = Utils::getYoutubeIdFromUrl($instance['background_video_link']);
                ?>
                <div class="elementor-background-video-container">
                    <?php if ('youtube' === $instance['background_video_type']) { ?>
                        <?php if ($video_id) { ?>
                            <div class="elementor-background-video-fallback elementor-hidden-desktop"></div>
                            <div class="elementor-background-video" data-video-id="<?php echo $video_id; ?>"></div>
                        <?php } ?>
                    <?php } else { ?>
                        <?php if (!empty($instance['background_video_link_h']['url'])) { ?>
                            <video class="elementor-background-video elementor-html5-video" src="<?php echo $instance['background_video_link_h']['url']; ?>" autoplay loop muted playsinline></video>
                        <?php } ?>
                    <?php } ?>
                </div>
            <?php }
        }

        if (in_array($instance['background_overlay_background'], ['classic', 'gradient'])) { ?>
            <div class="elementor-background-overlay"></div>
        <?php } ?>

        <div class="elementor-container elementor-column-gap-<?php echo Helper::escAttr($instance['gap']); ?>">
            <div class="elementor-row">
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

    public function beforeRenderColumn(array $instance, string $element_id, array $element_data = []): void
    {
    }

    public function afterRenderColumn(array $instance, string $element_id, array $element_data = []): void
    {
    }
}
