<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class HoverAnimation extends ControlBase
{
    private static $_animations;

    public function getType(): string
    {
        return 'hover_animation';
    }

    public static function getAnimations(): array
    {
        if (is_null(self::$_animations)) {
            self::$_animations = [
                'grow' => 'Grow',
                'shrink' => 'Shrink',
                'pulse' => 'Pulse',
                'pulse-grow' => 'Pulse Grow',
                'pulse-shrink' => 'Pulse Shrink',
                'push' => 'Push',
                'pop' => 'Pop',
                'bounce-in' => 'Bounce In',
                'bounce-out' => 'Bounce Out',
                'rotate' => 'Rotate',
                'grow-rotate' => 'Grow Rotate',
                'fade-out-20' => 'Fade-out 20%',
                'float' => 'Float',
                'sink' => 'Sink',
                'bob' => 'Bob',
                'hang' => 'Hang',
                'skew' => 'Skew',
                'skew-forward' => 'Skew Forward',
                'skew-backward' => 'Skew Backward',
                'wobble-vertical' => 'Wobble Vertical',
                'wobble-horizontal' => 'Wobble Horizontal',
                'wobble-to-bottom-right' => 'Wobble To Bottom Right',
                'wobble-to-top-right' => 'Wobble To Top Right',
                'wobble-top' => 'Wobble Top',
                'wobble-bottom' => 'Wobble Bottom',
                'wobble-skew' => 'Wobble Skew',
                'buzz' => 'Buzz',
                'buzz-out' => 'Buzz Out',
            ];
        }

        return self::$_animations;
    }

    public function contentTemplate(): void
    {
        ?>
		<div class="elementor-control-field">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper">
				<select data-setting="{{ data.name }}">
					<option value=""><?php echo Translater::get()->l('None'); ?></option>
					<?php foreach (self::getAnimations() as $animation_name => $animation_title) { ?>
						<option value="<?php echo $animation_name; ?>"><?php echo $animation_title; ?></option>
					<?php } ?>
				</select>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
        ];
    }
}
