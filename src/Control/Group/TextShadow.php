<?php
/**
 * Creative Elements - live Theme & Page Builder
 *
 * @author    WebshopWorks, Elementor
 * @copyright 2019-2023 WebshopWorks.com & Elementor.com
 * @license   https://www.gnu.org/licenses/gpl-3.0.html
 */

namespace IqitElementor\Control\Group;

use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('_PS_VERSION_')) { throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly'); }

/**
 * Elementor text shadow control.
 *
 * A base control for creating text shadow control. Displays input fields to define
 * the text shadow including the horizontal shadow, vertical shadow, shadow blur and
 * shadow color.
 *
 * @since 1.6.0
 */
class TextShadow extends GroupControlBase
{

    public static function getType(): string
    {
        return 'text-shadow';
    }

    /**
     * Get default options for text shadow group control.
     * Enables the popover with custom settings.
     */
    protected function getDefaultOptions(): array
    {
        return [
            'popover' => [
                'starter_name' => 'text_shadow_type',
                'starter_title' => Translater::get()->l('Text Shadow'),
                'starter_value' => 'yes',
                'settings' => [
                    'render_type' => 'ui',
                ],
            ],
        ];
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
    protected function getControlsInternal(array $args): array
    {
        $controls = [];

        $controls['text_shadow'] = [
            'label' => Translater::get()->l('Text Shadow', 'Text Shadow Control'),
            'type' => ControlManager::TEXT_SHADOW,
            'selectors' => [
                $args['selector'] => 'text-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{COLOR}};',
            ],
        ];

        return $controls;
    }
}
