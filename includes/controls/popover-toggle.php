<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

/**
 * Elementor popover toggle control.
 *
 * A base control for creating a popover toggle control. Displays a toggle
 * button to open and close a popover.
 */
class Control_Popover_Toggle extends Control_Base
{
    /**
     * Get popover toggle control type.
     *
     * @return string Control type.
     */
    public function get_type()
    {
        return 'popover_toggle';
    }

    /**
     * Get popover toggle control default settings.
     *
     * @return array Control default settings.
     */
    protected function get_default_settings()
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
    public function content_template()
    {
        $control_uid = $this->get_control_uid();
        ?>
        <div class="elementor-control-field">
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper">
                <input id="<?php echo $control_uid; ?>-custom" class="elementor-control-popover-toggle-toggle" type="radio" name="elementor-choose-{{ data.name }}-{{ data._cid }}" value="{{ data.return_value }}">
                <label class="elementor-control-popover-toggle-toggle-label" for="<?php echo $control_uid; ?>-custom">
                    <i class="eicon-edit" aria-hidden="true"></i>
                    <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Edit', 'elementor'); ?></span>
                </label>
                <input id="<?php echo $control_uid; ?>-default" type="radio" name="elementor-choose-{{ data.name }}-{{ data._cid }}" value="">
                <label class="elementor-control-popover-toggle-reset-label tooltip-target" for="<?php echo $control_uid; ?>-default" data-tooltip="<?php echo \IqitElementorTranslater::get()->l('Back to default', 'elementor'); ?>" data-tooltip-pos="s">
                    <i class="fa fa-repeat" aria-hidden="true"></i>
                    <span class="elementor-screen-only"><?php echo \IqitElementorTranslater::get()->l('Back to default', 'elementor'); ?></span>
                </label>
            </div>
        </div>
        <?php
    }

    /**
     * Get control unique ID.
     *
     * @return string Control UID.
     */
    protected function get_control_uid()
    {
        return 'elementor-control-popover-toggle-' . uniqid();
    }
}
