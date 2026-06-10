<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Helper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Color extends ControlBase
{
    public function getType(): string
    {
        return 'color';
    }

    public function contentTemplate(): void
    {
        ?>
		<# var defaultValue = '', dataAlpha = '';
			if ( data.default ) {
			if ( '#' !== data.default.substring( 0, 1 ) ) {
			defaultValue = '#' + data.default;
			} else {
			defaultValue = data.default;
			}
			defaultValue = ' data-default-color=' + defaultValue; // Quotes added automatically.
			}
			if ( data.alpha ) {
			dataAlpha = ' data-alpha=true';
			} #>
		<div class="elementor-control-field">
			<label class="elementor-control-title">
				<# if ( data.label ) { #>
					{{{ data.label }}}
					<# } #>
						<# if ( data.description ) { #>
							<span class="elementor-control-description">{{{ data.description }}}</span>
							<# } #>
			</label>
			<div class="elementor-control-input-wrapper">
				<input data-setting="{{ name }}" class="color-picker-hex" type="text" maxlength="7" placeholder="<?php Helper::escAttr('Hex Value'); ?>" {{ defaultValue }}{{ dataAlpha }} />
			</div>
		</div>
		<?php
    }

    protected function getDefaultSettings(): array
    {
        return [
            'alpha' => true,
        ];
    }
}
