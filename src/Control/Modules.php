<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Modules extends ControlBase
{
    public function getType(): string
    {
        return 'modules';
    }

    public function contentTemplate(): void
    {
        ?>
		<# if ( data.description ) { #>
			<div class="elementor-control-description">{{{ data.description }}}</div>
			<# } #>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<select data-setting="{{ data.name }}">
					<option value="0"><?php echo Translater::get()->l('Select module'); ?></option>
					<# _.each( data.options, function( module ) { #>
						<option value="{{ module.name }}">{{{ module.name }}}</option>
						<# } ); #>
				</select>
			</div>
		</div>
		<div class="elementor-control-field">
			<label class="elementor-control-title"><?php echo Translater::get()->l('Hook'); ?></label>
			<div class="elementor-control-input-wrapper">
				<input type="text" class="elementor-control-autocomplete-search" placeholder="{{ data.placeholder }}" />
			</div>
		</div>
		<?php
    }
}
