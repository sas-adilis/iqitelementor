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
 * Elementor tab control.
 *
 * A base control for creating tab control. Displays a tab header for a set of
 * controls.
 *
 * Note: Do not use it directly, instead use: `$widget->startControlsTab()`
 * and in the end `$widget->endControlsTab()`.
 *
 * @since 1.0.0
 */
class Control_Tab extends Control_Base
{
    /**
     * Get tab control type.
     *
     * Retrieve the control type, in this case `tab`.
     *
     * @since 1.0.0
     *
     * @return string Control type
     */
    public function get_type()
    {
        return 'tab';
    }

    /**
     * Render tab control output in the editor.
     *
     * Used to generate the control HTML in the editor using Underscore JS
     * template. The variables for the class are available using `data` JS
     * object.
     *
     * @since 1.0.0
     */
    public function content_template()
    {
        ?>
            <div class="elementor-panel-tab-heading">
                {{{ data.label }}}
            </div>
        <?php
    }

    /**
     * Get tab control default settings.
     *
     * Retrieve the default settings of the tab control. Used to return the
     * default settings while initializing the tab control.
     *
     * @since 1.0.0
     *
     * @return array Control default settings
     */
    protected function get_default_settings()
    {
        return [
            'separator' => 'none',
        ];
    }
}
