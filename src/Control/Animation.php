<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Animation extends ControlBase
{
    private static $_animations;

    public function getType(): string
    {
        return 'animation';
    }

    public static function getAnimations(): array
    {
        if (is_null(self::$_animations)) {
            self::$_animations = [
                'Fading' => [
                    'fadeIn' => 'Fade In',
                    'fadeInDown' => 'Fade In Down',
                    'fadeInLeft' => 'Fade In Left',
                    'fadeInRight' => 'Fade In Right',
                    'fadeInUp' => 'Fade In Up',
                ],
                'Zooming' => [
                    'zoomIn' => 'Zoom In',
                    'zoomInDown' => 'Zoom In Down',
                    'zoomInLeft' => 'Zoom In Left',
                    'zoomInRight' => 'Zoom In Right',
                    'zoomInUp' => 'Zoom In Up',
                ],
                'Bouncing' => [
                    'bounceIn' => 'Bounce In',
                    'bounceInDown' => 'Bounce In Down',
                    'bounceInLeft' => 'Bounce In Left',
                    'bounceInRight' => 'Bounce In Right',
                    'bounceInUp' => 'Bounce In Up',
                ],
                'Sliding' => [
                    'slideInDown' => 'Slide In Down',
                    'slideInLeft' => 'Slide In Left',
                    'slideInRight' => 'Slide In Right',
                    'slideInUp' => 'Slide In Up',
                ],
                'Rotating' => [
                    'rotateIn' => 'Rotate In',
                    'rotateInDownLeft' => 'Rotate In Down Left',
                    'rotateInDownRight' => 'Rotate In Down Right',
                    'rotateInUpLeft' => 'Rotate In Up Left',
                    'rotateInUpRight' => 'Rotate In Up Right',
                ],
                'Attention Seekers' => [
                    'bounce' => 'Bounce',
                    'flash' => 'Flash',
                    'pulse' => 'Pulse',
                    'rubberBand' => 'Rubber Band',
                    'shake' => 'Shake',
                    'headShake' => 'Head Shake',
                    'swing' => 'Swing',
                    'tada' => 'Tada',
                    'wobble' => 'Wobble',
                    'jello' => 'Jello',
                ],
                'Light Speed' => [
                    'lightSpeedIn' => 'Light Speed In',
                ],
                'Specials' => [
                    'rollIn' => 'Roll In',
                ],
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
					<?php foreach (self::getAnimations() as $animations_group_name => $animations_group) { ?>
						<optgroup label="<?php echo $animations_group_name; ?>">
							<?php foreach ($animations_group as $animation_name => $animation_title) { ?>
								<option value="<?php echo $animation_name; ?>"><?php echo $animation_title; ?></option>
							<?php } ?>
						</optgroup>
					<?php } ?>
				</select>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-description">{{{ data.description }}}</div>
		<# } #>
		<?php
    }
}
