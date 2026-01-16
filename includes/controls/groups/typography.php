<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Group_Control_Typography extends Group_Control_Base
{
    private static $_fields;

    private static $_scheme_fields_keys = ['font_family', 'font_weight'];

    public static function get_scheme_fields_keys(): array
    {
        return self::$_scheme_fields_keys;
    }

    public static function get_type(): string
    {
        return 'typography';
    }

    public static function get_fields()
    {
        if (null === self::$_fields) {
            self::_init_fields();
        }

        return self::$_fields;
    }

    private static function _init_fields()
    {
        $fields = [];

        $fields['font_size'] = [
            'label' => \IqitElementorTranslater::get()->l('Size'),
            'type' => Controls_Manager::SLIDER,
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
            'label' => \IqitElementorTranslater::get()->l('Family'),
            'type' => Controls_Manager::FONT,
            'default' => '',
            'selector_value' => 'font-family: {{VALUE}}' . $default_fonts . ';',
        ];

        $fields['font_family_custom'] = [
            'label' => \IqitElementorTranslater::get()->l('Custom font family'),
            'type' => Controls_Manager::TEXT,
            'default' => '',
            'selector_value' => 'font-family: {{VALUE}}' . $default_fonts . ';',
        ];

        $typo_weight_options = ['' => \IqitElementorTranslater::get()->l('Default', 'elementor')];
        foreach (array_merge(['normal', 'bold'], range(100, 900, 100)) as $weight) {
            $typo_weight_options[$weight] = ucfirst($weight);
        }

        $fields['font_weight'] = [
            'label' => \IqitElementorTranslater::get()->l('Weight'),
            'type' => Controls_Manager::SELECT,
            'default' => '',
            'options' => $typo_weight_options,
        ];

        $fields['text_transform'] = [
            'label' => \IqitElementorTranslater::get()->l('Transform'),
            'type' => Controls_Manager::SELECT,
            'default' => '',
            'options' => [
                '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                'uppercase' => \IqitElementorTranslater::get()->l('Uppercase'),
                'lowercase' => \IqitElementorTranslater::get()->l('Lowercase'),
                'capitalize' => \IqitElementorTranslater::get()->l('Capitalize'),
            ],
        ];

        $fields['font_style'] = [
            'label' => \IqitElementorTranslater::get()->l('Style'),
            'type' => Controls_Manager::SELECT,
            'default' => '',
            'options' => [
                '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                'normal' => \IqitElementorTranslater::get()->l('Normal'),
                'italic' => \IqitElementorTranslater::get()->l('Italic'),
                'oblique' => \IqitElementorTranslater::get()->l('Oblique'),
            ],
        ];

        $fields['text_decoration'] = [
            'label' => \IqitElementorTranslater::get()->l('Decoration'),
            'type' => Controls_Manager::SELECT,
            'default' => '',
            'options' => [
                '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                'underline' => \IqitElementorTranslater::get()->l('Underline'),
                'overline' => \IqitElementorTranslater::get()->l('Overline'),
                'line-through' => \IqitElementorTranslater::get()->l('Line through'),
                'none' => \IqitElementorTranslater::get()->l('None'),
            ],
        ];

        $fields['line_height'] = [
            'label' => \IqitElementorTranslater::get()->l('Line-Height'),
            'type' => Controls_Manager::SLIDER,
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
            'label' => \IqitElementorTranslater::get()->l('Letter Spacing'),
            'type' => Controls_Manager::SLIDER,
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

    protected function _get_controls($args)
    {
        $controls = self::get_fields();

        if (!empty($args['separator'])) {
            $controls['font_size']['separator'] = $args['separator'];
        }

        array_walk($controls, function (&$control, $control_name) use ($args) {
            $selector_value = !empty($control['selector_value']) ? $control['selector_value'] : str_replace('_', '-', $control_name) . ': {{VALUE}};';

            $control['selectors'] = [
                $args['selector'] => $selector_value,
            ];

            $control['condition'] = [
                'typography' => ['custom'],
            ];
        });

        $controls['font_family_custom']['condition'] = [
            'typography' => ['custom'],
            'font_family' => ['custom'],
        ];

        $typography_control = [
            'typography' => [
                'label' => \IqitElementorTranslater::get()->l('Typography'),
                'type' => Controls_Manager::CHOOSE,
                'default' => 'default',
                'label_block' => false,
                'options' => [
                    'default' => ['title' => \IqitElementorTranslater::get()->l('Default', 'elementor')],
                    'custom' => ['title' => \IqitElementorTranslater::get()->l('Custom', 'elementor')],
                ],
            ],
        ];

        return $typography_control + $controls;
    }

    protected function _add_group_args_to_control($control_id, $control_args)
    {
        $control_args = parent::_add_group_args_to_control($control_id, $control_args);

        $args = $this->get_args();

        if (in_array($control_id, self::get_scheme_fields_keys()) && !empty($args['scheme'])) {
            $control_args['scheme'] = [
                'type' => self::get_type(),
                'value' => $args['scheme'],
                'key' => $control_id,
            ];
        }

        return $control_args;
    }
}
