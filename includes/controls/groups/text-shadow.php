<?php
/**
 * Creative Elements - live Theme & Page Builder
 *
 * @author    WebshopWorks, Elementor
 * @copyright 2019-2023 WebshopWorks.com & Elementor.com
 * @license   https://www.gnu.org/licenses/gpl-3.0.html
 */

namespace Elementor;

defined('_PS_VERSION_') or exit;

/**
 * Elementor text shadow control.
 *
 * A base control for creating text shadow control. Displays input fields to define
 * the text shadow including the horizontal shadow, vertical shadow, shadow blur and
 * shadow color.
 *
 * @since 1.6.0
 */
class Group_Control_Text_Shadow extends Group_Control_Base
{

    public static function get_type(): string
    {
        return 'text-shadow';
    }

    /**
     * Init fields.
     *
     * Initialize text shadow control fields.
     *
     * @param $args * @return array Control fields
     *@since 1.6.0
     *
     */
    protected function _get_controls($args): array
    {
        $controls = [];


        $controls['text_shadow_type'] = [
            'label' => \IqitElementorTranslater::get()->l('Text Shadow', 'Text Shadow Control', 'elementor'),
            'type' => Controls_Manager::SWITCHER,
            'options' => [
                '' => \IqitElementorTranslater::get()->l('No', 'elementor'),
                'outset' => \IqitElementorTranslater::get()->l('Yes', 'Text Shadow Control', 'elementor'),
            ],
        ];

        $controls['text_shadow'] = [
            'label' => \IqitElementorTranslater::get()->l('Text Shadow', 'Text Shadow Control'),
            'type' => Controls_Manager::TEXT_SHADOW,
            'selectors' => [
                $args['selector'] => 'text-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{COLOR}};',
            ],
            'condition' => [
                'text_shadow_type!' => '',
            ],
        ];

        return $controls;
    }
}
