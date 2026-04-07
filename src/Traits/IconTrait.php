<?php

namespace IqitElementor\Traits;

use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;
if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

/**
 * Trait réutilisable pour ajouter un icon picker avec ses contrôles de style.
 *
 * Usage basique dans un widget :
 *   use IconTrait;
 *   $this->registerIconContentControls('section_content');
 *   $this->registerIconStyleControls('section_style_icon');
 *
 * Avec préfixe (pour plusieurs icônes dans le même widget) :
 *   $this->registerIconContentControls('section_content', [], 'badge_');
 *   $this->registerIconStyleControls('section_style_badge', [], 'badge_');
 *
 * Rendu :
 *   echo $this->renderIconFromSettings($instance, 'icon');
 *   echo $this->renderIconFromSettings($instance, 'badge_icon');
 */
trait IconTrait
{
    /**
     * Register the icon picker control and optional view/shape controls.
     *
     * @param string $sectionId  Section to attach controls to
     * @param array  $condition  Extra visibility conditions
     * @param string $prefix     Control name prefix (empty for default 'icon')
     * @param array  $exclude    Control names to skip: 'icon', 'view', 'shape'
     * @param string $default    Default icon value
     */
    protected function registerIconContentControls(
        string $sectionId = 'section_icon',
        array $condition = [],
        string $prefix = '',
        array $exclude = [],
        string $default = ''
    ): void {
        $p = $prefix;

        if (!in_array('icon', $exclude)) {
            $this->addControl(
                $p . 'icon',
                [
                    'label' => Translater::get()->l('Icon'),
                    'type' => ControlManager::ICON,
                    'label_block' => true,
                    'default' => $default,
                    'section' => $sectionId,
                    'condition' => $condition,
                ]
            );
        }

        if (!in_array('view', $exclude)) {
            $this->addControl(
                $p . 'view',
                [
                    'label' => Translater::get()->l('View'),
                    'type' => ControlManager::SELECT,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'options' => [
                        'default' => Translater::get()->l('Default'),
                        'stacked' => Translater::get()->l('Stacked'),
                        'framed' => Translater::get()->l('Framed'),
                    ],
                    'default' => 'default',
                    'prefix_class' => 'elementor-view-',
                ]
            );
        }

        if (!in_array('shape', $exclude)) {
            $shapeCondition = array_merge($condition, [$p . 'view!' => 'default']);
            $this->addControl(
                $p . 'shape',
                [
                    'label' => Translater::get()->l('Shape'),
                    'type' => ControlManager::SELECT,
                    'section' => $sectionId,
                    'options' => [
                        'circle' => Translater::get()->l('Circle'),
                        'square' => Translater::get()->l('Square'),
                    ],
                    'default' => 'circle',
                    'condition' => $shapeCondition,
                    'prefix_class' => 'elementor-shape-',
                ]
            );
        }
    }

    /**
     * Register icon style controls: colors, size, padding, rotate, border, hover.
     *
     * @param string $sectionId       Style section ID
     * @param array  $condition       Extra visibility conditions
     * @param string $prefix          Control name prefix
     * @param array  $exclude         Control names to skip
     * @param string $iconSelector    CSS selector for the icon wrapper (relative to {{WRAPPER}})
     * @param bool   $withHover       Include hover color controls
     * @param bool   $withViewModes   Include stacked/framed color logic
     */
    protected function registerIconStyleControls(
        string $sectionId = 'section_style_icon',
        array $condition = [],
        string $prefix = '',
        array $exclude = [],
        string $iconSelector = '.elementor-icon',
        bool $withHover = true,
        bool $withViewModes = true
    ): void {
        $p = $prefix;
        $w = '{{WRAPPER}}';
        $sel = $w . ' ' . $iconSelector;

        // ── Primary Color ──
        if (!in_array('primary_color', $exclude)) {
            $selectors = [];
            if ($withViewModes) {
                $selectors[$w . '.elementor-view-stacked ' . $iconSelector] = 'background-color: {{VALUE}};';
                $selectors[$w . '.elementor-view-framed ' . $iconSelector . ', ' . $w . '.elementor-view-default ' . $iconSelector] = 'color: {{VALUE}}; border-color: {{VALUE}};';
                $selectors[$w . '.elementor-view-framed ' . $iconSelector . ' svg, ' . $w . '.elementor-view-default ' . $iconSelector . ' svg'] = 'fill: {{VALUE}};';
            } else {
                $selectors[$sel] = 'color: {{VALUE}};';
                $selectors[$sel . ' svg'] = 'fill: {{VALUE}};';
            }

            $control = [
                'label' => Translater::get()->l('Primary Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => $sectionId,
                'default' => '',
                'condition' => $condition,
                'selectors' => $selectors,
            ];

            $this->addControl($p . 'primary_color', $control);
        }

        // ── Secondary Color (stacked/framed only) ──
        if ($withViewModes && !in_array('secondary_color', $exclude)) {
            $this->addControl(
                $p . 'secondary_color',
                [
                    'label' => Translater::get()->l('Secondary Color'),
                    'type' => ControlManager::COLOR,
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'default' => '',
                    'condition' => array_merge($condition, [$p . 'view!' => 'default']),
                    'selectors' => [
                        $w . '.elementor-view-framed ' . $iconSelector => 'background-color: {{VALUE}};',
                        $w . '.elementor-view-stacked ' . $iconSelector => 'color: {{VALUE}};',
                        $w . '.elementor-view-stacked ' . $iconSelector . ' svg' => 'fill: {{VALUE}};',
                    ],
                ]
            );
        }

        // ── Size ──
        if (!in_array('size', $exclude)) {
            $this->addControl(
                $p . 'icon_size',
                [
                    'label' => Translater::get()->l('Icon Size'),
                    'type' => ControlManager::SLIDER,
                    'default' => [
                        'size' => 24,
                    ],
                    'range' => [
                        'px' => ['min' => 6, 'max' => 300],
                    ],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selectors' => [
                        $sel . ' i' => 'font-size: {{SIZE}}{{UNIT}};',
                        $sel . ' svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                    ],
                ]
            );
        }

        // ── Padding ──
        if (!in_array('padding', $exclude)) {
            $paddingCondition = $withViewModes
                ? array_merge($condition, [$p . 'view!' => 'default'])
                : $condition;

            $this->addControl(
                $p . 'icon_padding',
                [
                    'label' => Translater::get()->l('Icon Padding'),
                    'type' => ControlManager::SLIDER,
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $paddingCondition,
                    'selectors' => [
                        $sel => 'padding: {{SIZE}}{{UNIT}};',
                    ],
                    'default' => [
                        'size' => 1.5,
                        'unit' => 'em',
                    ],
                    'range' => [
                        'em' => ['min' => 0],
                    ],
                ]
            );
        }

        // ── Rotate ──
        if (!in_array('rotate', $exclude)) {
            $this->addControl(
                $p . 'rotate',
                [
                    'label' => Translater::get()->l('Icon Rotate'),
                    'type' => ControlManager::SLIDER,
                    'default' => ['size' => 0, 'unit' => 'deg'],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => $condition,
                    'selectors' => [
                        $sel . ' i, ' . $sel . ' svg' => 'transform: rotate({{SIZE}}{{UNIT}});',
                    ],
                ]
            );
        }

        // ── Border Width (framed) ──
        if ($withViewModes && !in_array('border_width', $exclude)) {
            $this->addControl(
                $p . 'border_width',
                [
                    'label' => Translater::get()->l('Border Width'),
                    'type' => ControlManager::DIMENSIONS,
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => array_merge($condition, [$p . 'view' => 'framed']),
                    'selectors' => [
                        $sel => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    ],
                ]
            );
        }

        // ── Border Radius ──
        if ($withViewModes && !in_array('border_radius', $exclude)) {
            $this->addControl(
                $p . 'border_radius',
                [
                    'label' => Translater::get()->l('Border Radius'),
                    'type' => ControlManager::DIMENSIONS,
                    'size_units' => ['px', '%'],
                    'tab' => self::TAB_STYLE,
                    'section' => $sectionId,
                    'condition' => array_merge($condition, [$p . 'view!' => 'default']),
                    'selectors' => [
                        $sel => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    ],
                ]
            );
        }

        // ── Hover ──
        if ($withHover) {
            $this->registerIconHoverControls($sectionId, $condition, $prefix, $exclude, $iconSelector, $withViewModes);
        }
    }

    /**
     * Register hover color controls for icons.
     */
    private function registerIconHoverControls(string $sectionId, array $condition, string $prefix, array $exclude, string $iconSelector, bool $withViewModes): void
    {
        $p = $prefix;
        $w = '{{WRAPPER}}';

        $hoverSectionId = $p . 'section_icon_hover';

        $this->addControl(
            $hoverSectionId,
            [
                'label' => Translater::get()->l('Icon Hover'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        // ── Hover Primary Color ──
        if (!in_array('hover_primary_color', $exclude)) {
            $selectors = [];
            if ($withViewModes) {
                $selectors[$w . '.elementor-view-stacked ' . $iconSelector . ':hover'] = 'background-color: {{VALUE}};';
                $selectors[$w . '.elementor-view-framed ' . $iconSelector . ':hover, ' . $w . '.elementor-view-default ' . $iconSelector . ':hover'] = 'color: {{VALUE}}; border-color: {{VALUE}};';
                $selectors[$w . '.elementor-view-framed ' . $iconSelector . ':hover svg, ' . $w . '.elementor-view-default ' . $iconSelector . ':hover svg'] = 'fill: {{VALUE}};';
            } else {
                $selectors[$w . ' ' . $iconSelector . ':hover'] = 'color: {{VALUE}};';
                $selectors[$w . ' ' . $iconSelector . ':hover svg'] = 'fill: {{VALUE}};';
            }

            $this->addControl(
                $p . 'hover_primary_color',
                [
                    'label' => Translater::get()->l('Primary Color'),
                    'type' => ControlManager::COLOR,
                    'tab' => self::TAB_STYLE,
                    'section' => $hoverSectionId,
                    'default' => '',
                    'condition' => $condition,
                    'selectors' => $selectors,
                ]
            );
        }

        // ── Hover Secondary Color ──
        if ($withViewModes && !in_array('hover_secondary_color', $exclude)) {
            $this->addControl(
                $p . 'hover_secondary_color',
                [
                    'label' => Translater::get()->l('Secondary Color'),
                    'type' => ControlManager::COLOR,
                    'tab' => self::TAB_STYLE,
                    'section' => $hoverSectionId,
                    'default' => '',
                    'condition' => array_merge($condition, [$p . 'view!' => 'default']),
                    'selectors' => [
                        $w . '.elementor-view-framed ' . $iconSelector . ':hover' => 'background-color: {{VALUE}};',
                        $w . '.elementor-view-stacked ' . $iconSelector . ':hover' => 'color: {{VALUE}};',
                        $w . '.elementor-view-stacked ' . $iconSelector . ':hover svg' => 'fill: {{VALUE}};',
                    ],
                ]
            );
        }

        // ── Hover Animation ──
        if (!in_array('hover_animation', $exclude)) {
            $this->addControl(
                $p . 'hover_animation',
                [
                    'label' => Translater::get()->l('Animation'),
                    'type' => ControlManager::HOVER_ANIMATION,
                    'tab' => self::TAB_STYLE,
                    'section' => $hoverSectionId,
                    'condition' => $condition,
                ]
            );
        }
    }

    // ──────────────────────────────────────
    // Rendering helpers
    // ──────────────────────────────────────

    /**
     * Render an icon from widget settings.
     *
     * @param array  $instance  Widget settings
     * @param string $key       Setting key (e.g. 'icon', 'badge_icon')
     * @param array  $attrs     Extra HTML attributes
     */
    protected function renderIconFromSettings(array $instance, string $key = 'icon', array $attrs = []): string
    {
        if (empty($instance[$key])) {
            return '';
        }
        return IconHelper::renderIcon($instance[$key], $attrs);
    }

    /**
     * Get the JS expression for rendering an icon in contentTemplate.
     * Returns a string to be used inside {{{ }}} in underscore templates.
     *
     * @param string $settingsPath  JS expression (e.g. 'settings.icon', 'item.icon')
     */
    protected static function getIconTemplateExpression(string $settingsPath = 'settings.icon'): string
    {
        return 'elementorRenderIcon(' . $settingsPath . ')';
    }
}
