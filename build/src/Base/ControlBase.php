<?php
namespace IqitElementor\Base;

use IqitElementor\Helper\Helper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class ControlBase
{
    /** @var array */
    private $baseSettings = [
        'separator' => 'default',
        'label_block' => false,
        'show_label' => true,
    ];

    /** @var array */
    private $settings = [];

    abstract public function contentTemplate(): void;

    abstract public function getType(): string;

    protected function getDefaultSettings(): array
    {
        return [];
    }

    /**
     * @return mixed
     */
    public function getDefaultValue()
    {
        return '';
    }

    /**
     * @return mixed
     */
    public function getValue(array $control, array $instance)
    {
        if (!isset($control['default'])) {
            $control['default'] = $this->getDefaultValue();
        }

        if (!isset($instance[$control['name']])) {
            return $control['default'];
        }

        return $instance[$control['name']];
    }

    public function getReplaceStyleValues(string $css_property, $control_value): string
    {
        return str_replace('{{VALUE}}', $control_value, $css_property);
    }

    /**
     * @param mixed $control_value
     * @return mixed
     */
    public function getStyleValue(string $css_property, $control_value)
    {
        return $control_value;
    }

    /**
     * @return mixed
     */
    final public function getSettings(?string $setting_key = null)
    {
        if ($setting_key) {
            if (isset($this->settings[$setting_key])) {
                return $this->settings[$setting_key];
            }

            return null;
        }

        return $this->settings;
    }

    final public function printTemplate(): void
    {
        ?>
		<script type="text/html" id="tmpl-elementor-control-<?php echo Helper::escAttr($this->getType()); ?>-content">
			<div class="elementor-control-content">
				<?php $this->contentTemplate(); ?>
			</div>
		</script>
		<?php
    }

    public function __construct()
    {
        $this->settings = Helper::parseArgs($this->getDefaultSettings(), $this->baseSettings);
    }
}
