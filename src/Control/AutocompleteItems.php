<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

/**
 * Generic remote autocomplete control.
 *
 * Endpoint-driven and entity-agnostic: the consuming widget supplies the
 * search/get URLs (data-search-url / data-get-url), so this control can feed
 * any source (blog posts, lookbooks, …) without iqitelementor knowing about it.
 */
class AutocompleteItems extends ControlBase
{
    public function getType(): string
    {
        return 'autocomplete_items';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<input type="text" class="elementor-control-autocomplete-search" placeholder="{{ data.placeholder }}" data-search-url="{{ data.search_url }}" data-get-url="{{ data.get_url }}" <# if ( data.single ) { #> data-single="true" <# } #> />



				<div class="elementor-control-content elementor-selected-posts-wrapper">
						<div class="elementor-control-field">
							<label class="elementor-control-title"><# if ( data.selected_label ) { #>{{{ data.selected_label }}}<# } else { #><?php echo Translater::get()->l('Selected items'); ?><# } #></label>

							<div class="elementor-control-input-wrapper">

								<div class="elementor-control-selected-preview"></div>

								<select class="elementor-control-selected-options" multiple="multiple"  data-setting="{{ data.name }}">
									<# _.each( data.controlValue, function(posts) { #>
										<option value="{{ posts }}">{{{ posts }}}</option>
									<# } ); #>
								</select>
							</div>
						</div>

					</div>

			</div>
		</div>
		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
