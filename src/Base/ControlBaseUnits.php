<?php
namespace IqitElementor\Base;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class ControlBaseUnits extends ControlBaseMultiple
{
    public function getDefaultValue(): array
    {
        return [
            'unit' => 'px',
        ];
    }

    protected function getDefaultSettings(): array
    {
        return [
            'size_units' => ['px'],
            'range' => [
                'px' => [
                    'min' => 0,
                    'max' => 100,
                    'step' => 1,
                ],
                'em' => [
                    'min' => 0.1,
                    'max' => 10,
                    'step' => 0.1,
                ],
                'rem' => [
                    'min' => 0.1,
                    'max' => 10,
                    'step' => 0.1,
                ],
                '%' => [
                    'min' => 0,
                    'max' => 100,
                    'step' => 1,
                ],
                'deg' => [
                    'min' => 0,
                    'max' => 360,
                    'step' => 1,
                ],
            ],
        ];
    }

    protected function printUnitsTemplate(): void
    {
        ?>
		<# if ( data.size_units.length > 1 ) { #>
		<div class="elementor-units-choices">
			<# _.each( data.size_units, function( unit ) { #>
			<input id="elementor-choose-{{ data._cid + data.name + unit }}" type="radio" name="elementor-choose-{{ data.name }}" data-setting="unit" value="{{ unit }}">
			<label class="elementor-units-choices-label" for="elementor-choose-{{ data._cid + data.name + unit }}">{{{ unit }}}</label>
			<# } ); #>
		</div>
		<# } #>
		<?php
    }

    /**
     * @param mixed $control_value
     * @return mixed
     */
    public function getStyleValue(string $css_property, $control_value)
    {
        $return_value = parent::getStyleValue($css_property, $control_value);
        if ('unit' === $css_property && 'custom' === $return_value) {
            $return_value = '__EMPTY__';
        }

        return $return_value;
    }
}
