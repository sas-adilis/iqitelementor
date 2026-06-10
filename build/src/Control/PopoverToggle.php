<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

/**
 * Elementor popover toggle control.
 *
 * A base control for creating a popover toggle control. Displays a toggle
 * button to open and close a popover.
 */
class PopoverToggle extends ControlBase
{
    /**
     * Get popover toggle control type.
     *
     * @return string Control type.
     */
    public function getType(): string
    {
        return 'popover_toggle';
    }

    /**
     * Get popover toggle control default settings.
     *
     * @return array Control default settings.
     */
    protected function getDefaultSettings(): array
    {
        return [
            'return_value' => 'yes',
            'label_block' => false,
        ];
    }

    /**
     * Render popover toggle control output in the editor.
     *
     * Used to generate the control HTML in the editor using Underscore JS
     * template.
     */
    public function contentTemplate(): void
    {
        ?>
        <div class="elementor-control-field">
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper">
                <input id="elementor-control-popover-toggle-{{ data._cid }}-custom" class="elementor-control-popover-toggle-toggle" type="radio" name="elementor-choose-{{ data.name }}-{{ data._cid }}" value="{{ data.return_value }}">
                <label class="elementor-control-popover-toggle-toggle-label" for="elementor-control-popover-toggle-{{ data._cid }}-custom">
                    <i class="eicon-edit" aria-hidden="true"></i>
                    <span class="elementor-screen-only"><?php echo Translater::get()->l('Edit'); ?></span>
                </label>
                <input id="elementor-control-popover-toggle-{{ data._cid }}-default" type="radio" name="elementor-choose-{{ data.name }}-{{ data._cid }}" value="">
                <label class="elementor-control-popover-toggle-reset-label tooltip-target" for="elementor-control-popover-toggle-{{ data._cid }}-default" data-tooltip="<?php echo Translater::get()->l('Back to default'); ?>" data-tooltip-pos="s">
                    <i class="fa fa-repeat" aria-hidden="true"></i>
                    <span class="elementor-screen-only"><?php echo Translater::get()->l('Back to default'); ?></span>
                </label>
            </div>
        </div>
        <?php
    }
}