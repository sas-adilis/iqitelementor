<?php
namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Typography extends GroupControlBase
{
    /** @var array|null */
    private static $_fields;

    public static function getType(): string
    {
        return 'typography';
    }

    /**
     * Get default options for typography group control.
     * Enables the popover with custom settings.
     */
    protected function getDefaultOptions(): array
    {
        return [
            'popover' => [
                'starter_name' => 'typography',
                'starter_title' => Translater::get()->l('Typography'),
                'starter_value' => 'custom',
                'settings' => [
                    'render_type' => 'ui',
                ],
            ],
        ];
    }

    public static function getFields(): array
    {
        if (null === self::$_fields) {
            self::initFields();
        }

        return self::$_fields;
    }

    private static function initFields(): void
    {
        $fields = [];

        $fields['font_size'] = [
            'label' => Translater::get()->l('Size'),
            'type' => ControlManager::SLIDER,
            'size_units' => ['px', 'em', 'rem'],
            'range' => [
                'px' => [
                    'min' => 1,
                    'max' => 200,
                ],
            ],
            'responsive' => true,
            'selector_value' => 'font-size: {{SIZE}}{{UNIT}}',
        ];


        $default_fonts = ', Sans-serif';

        $fields['font_family'] = [
            'label' => Translater::get()->l('Family'),
            'type' => ControlManager::FONT,
            'default' => '',
            'selector_value' => 'font-family: {{VALUE}}' . $default_fonts . ';',
        ];

        $fields['font_family_custom'] = [
            'label' => Translater::get()->l('Custom font family'),
            'type' => ControlManager::TEXT,
            'default' => '',
            'selector_value' => 'font-family: {{VALUE}}' . $default_fonts . ';',
        ];

        $typo_weight_options = ['' => Translater::get()->l('Default')];
        foreach (array_merge(['normal', 'bold'], range(100, 900, 100)) as $weight) {
            $typo_weight_options[$weight] = ucfirst($weight);
        }

        $fields['font_weight'] = [
            'label' => Translater::get()->l('Weight'),
            'type' => ControlManager::SELECT,
            'default' => '',
            'options' => $typo_weight_options,
        ];

        $fields['text_transform'] = [
            'label' => Translater::get()->l('Transform'),
            'type' => ControlManager::SELECT,
            'default' => '',
            'options' => [
                '' => Translater::get()->l('Default'),
                'none' => Translater::get()->l('None'),
                'uppercase' => Translater::get()->l('Uppercase'),
                'lowercase' => Translater::get()->l('Lowercase'),
                'capitalize' => Translater::get()->l('Capitalize'),
            ],
        ];

        $fields['font_style'] = [
            'label' => Translater::get()->l('Style'),
            'type' => ControlManager::SELECT,
            'default' => '',
            'options' => [
                '' => Translater::get()->l('Default'),
                'normal' => Translater::get()->l('Normal'),
                'italic' => Translater::get()->l('Italic'),
                'oblique' => Translater::get()->l('Oblique'),
            ],
        ];

        $fields['text_decoration'] = [
            'label' => Translater::get()->l('Decoration'),
            'type' => ControlManager::SELECT,
            'default' => '',
            'options' => [
                '' => Translater::get()->l('Default'),
                'underline' => Translater::get()->l('Underline'),
                'overline' => Translater::get()->l('Overline'),
                'line-through' => Translater::get()->l('Line through'),
                'none' => Translater::get()->l('None'),
            ],
        ];

        $fields['line_height'] = [
            'label' => Translater::get()->l('Line-Height'),
            'type' => ControlManager::SLIDER,
            'default' => [
                'unit' => 'em',
            ],
            'range' => [
                'px' => [
                    'min' => 1,
                ],
            ],
            'responsive' => true,
            'size_units' => ['px', 'em'],
            'selector_value' => 'line-height: {{SIZE}}{{UNIT}}',
        ];

        $fields['letter_spacing'] = [
            'label' => Translater::get()->l('Letter Spacing'),
            'type' => ControlManager::SLIDER,
            'range' => [
                'px' => [
                    'min' => -5,
                    'max' => 10,
                    'step' => 0.1,
                ],
            ],
            'responsive' => true,
            'selector_value' => 'letter-spacing: {{SIZE}}{{UNIT}}',
        ];

        self::$_fields = $fields;
    }

    protected function getControlsInternal(array $args): array
    {
        $controls = self::getFields();

        if (!empty($args['separator'])) {
            $controls['font_size']['separator'] = $args['separator'];
        }

        array_walk($controls, function (&$control, $control_name) use ($args) {
            $selector_value = !empty($control['selector_value']) ? $control['selector_value'] : str_replace('_', '-', $control_name) . ': {{VALUE}};';

            $control['selectors'] = [
                $args['selector'] => $selector_value,
            ];
        });

        // Special condition for custom font family
        $controls['font_family_custom']['condition'] = [
            'font_family' => ['custom'],
        ];

        return $controls;
    }

    protected function addGroupArgsToControl(string $control_id, array $control_args): array
    {
        $control_args = parent::addGroupArgsToControl($control_id, $control_args);

        return $control_args;
    }
}
