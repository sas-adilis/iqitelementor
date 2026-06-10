<?php
/**
 * Creative Elements - live Theme & Page Builder
 *
 * @author    WebshopWorks, Elementor
 * @copyright 2019-2023 WebshopWorks.com & Elementor.com
 * @license   https://www.gnu.org/licenses/gpl-3.0.html
 */

namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\Helper;

if (!defined('_PS_VERSION_')) { throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly'); }

/**
 * Elementor text shadow control.
 *
 * A base control for creating text shadows control. Displays input fields for
 * horizontal shadow, vertical shadow, shadow blur and shadow color.
 *
 * @since 1.6.0
 */
class TextShadow extends ControlBaseMultiple
{
    /**
     * Get text shadow control type.
     *
     * Retrieve the control type, in this case `text_shadow`.
     *
     * @since 1.6.0
     *
     * @return string Control type
     */
    public function getType(): string
    {
        return 'text_shadow';
    }

    /**
     * Get text shadow control default values.
     *
     * Retrieve the default value of the text shadow control. Used to return the
     * default values while initializing the text shadow control.
     *
     * @since 1.6.0
     *
     * @return array Control default value
     */
    public function getDefaultValue(): array
    {
        return [
            'horizontal' => 0,
            'vertical' => 0,
            'blur' => 10,
            'color' => 'rgba(0,0,0,0.3)',
        ];
    }

    /**
     * Get text shadow control sliders.
     *
     * Retrieve the sliders of the text shadow control. Sliders are used while
     * rendering the control output in the editor.
     *
     * @since 1.6.0
     *
     * @return array Control sliders
     */
    public function getSliders(): array
    {
        return [
            ['label' => Translater::get()->l('Blur'), 'type' => 'blur', 'min' => 0, 'max' => 100],
            ['label' => Translater::get()->l('Horizontal'), 'type' => 'horizontal', 'min' => -100, 'max' => 100],
            ['label' => Translater::get()->l('Vertical'), 'type' => 'vertical', 'min' => -100, 'max' => 100],
        ];
    }

    /**
     * Render text shadow control output in the editor.
     *
     * Used to generate the control HTML in the editor using Underscore JS
     * template. The variables for the class are available using `data` JS
     * object.
     *
     * @since 1.6.0
     */
    public function contentTemplate(): void
    {
        ?>
        <#
        var defaultColorValue = '';

        if ( data.default.color ) {
        if ( '#' !== data.default.color.substring( 0, 1 ) ) {
        defaultColorValue = '#' + data.default.color;
        } else {
        defaultColorValue = data.default.color;
        }

        defaultColorValue = ' data-default-color=' + defaultColorValue; // Quotes added automatically.
        }
        #>
        <div class="elementor-shadow-box">
            <div class="elementor-control">
                <div class="elementor-control-field">
                    <label class="elementor-control-title"><?php echo Translater::get()->l('Color'); ?></label>
                    <div class="elementor-control-input-wrapper">
                        <input data-setting="color" class="elementor-text-shadow-color-picker" type="text" maxlength="7" placeholder="<?php Helper::escAttr('Hex Value'); ?>" data-alpha="true"{{{ defaultColorValue }}} />
                    </div>
                </div>
            </div>
            <div class="elementor-control elementor-control-type-slider elementor-label-block">
            <?php foreach ($this->getSliders() as $slider) { ?>
            <div class="elementor-control-field">
                <label class="elementor-control-title"><?php echo $slider['label']; ?></label>
                <div class="elementor-control-input-wrapper">
                    <div class="elementor-slider" data-input="<?php echo $slider['type']; ?>"></div>
                    <div class="elementor-slider-input">
                        <input type="number" min="<?php echo $slider['min']; ?>" max="<?php echo $slider['max']; ?>" step="{{ data.step }}" data-setting="<?php echo $slider['type']; ?>"/>
                    </div>
                </div>
            </div>
                    <?php } ?>
            </div>
        </div>
        <?php
    }
}
