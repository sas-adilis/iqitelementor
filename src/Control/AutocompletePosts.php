<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class AutocompletePosts extends ControlBase
{
    public function getType(): string
    {
        return 'autocomplete_posts';
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<input type="text" class="elementor-control-autocomplete-search" placeholder="{{ data.placeholder }}" <# if ( data.single ) { #> data-single="true" <# } #> />



				<div class="elementor-control-content elementor-selected-posts-wrapper">
						<div class="elementor-control-field">
							<label class="elementor-control-title"> <# if ( data.single ) { #> <?php echo Translater::get()->l('Selected posts'); ?><# } else { #> <?php echo Translater::get()->l('Selected posts'); ?><# } #></label>

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
