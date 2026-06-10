<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseUnits;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\Helper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Dimensions extends ControlBaseUnits
{
    public function getType(): string
    {
        return 'dimensions';
    }

    public function getDefaultValue(): array
    {
        return array_merge(parent::getDefaultValue(), [
            'top' => '',
            'right' => '',
            'bottom' => '',
            'left' => '',
            'isLinked' => true,
        ]);
    }

    protected function getDefaultSettings(): array
    {
        return array_merge(parent::getDefaultSettings(), [
            'label_block' => true,
            'allowed_dimensions' => 'all',
            'placeholder' => '',
        ]);
    }

    public function contentTemplate(): void
    {
        $dimensions = [
            'top' => Translater::get()->l('Top'),
            'right' => Translater::get()->l('Right'),
            'bottom' => Translater::get()->l('Bottom'),
            'left' => Translater::get()->l('Left'),
        ];
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<?php $this->printUnitsTemplate(); ?>
			<div class="elementor-control-input-wrapper">
				<ul class="elementor-control-dimensions">
					<?php foreach ($dimensions as $dimension_key => $dimension_title) { ?>
						<li class="elementor-control-dimension">
							<input type="number" data-setting="<?php echo Helper::escAttr($dimension_key); ?>"
							       placeholder="<#
						       if ( _.isObject( data.placeholder ) ) {
						        if ( ! _.isUndefined( data.placeholder.<?php echo $dimension_key; ?> ) ) {
						            print( data.placeholder.<?php echo $dimension_key; ?> );
						        }
						       } else {
						        print( data.placeholder );
						       } #>"
							<# if ( -1 === _.indexOf( allowed_dimensions, '<?php echo $dimension_key; ?>' ) ) { #>
								disabled
								<# } #>
									/>
									<span><?php echo $dimension_title; ?></span>
						</li>
					<?php } ?>
					<li>
						<button class="elementor-link-dimensions tooltip-target" data-tooltip="<?php echo Translater::get()->l('Link values together'); ?>">
							<span class="elementor-linked"><i class="fa fa-link"></i></span>
							<span class="elementor-unlinked"><i class="fa fa-chain-broken"></i></span>
						</button>
					</li>
				</ul>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
