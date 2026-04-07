<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Core\Plugin;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Repeater extends ControlBase
{
    public function getType(): string
    {
        return 'repeater';
    }

    protected function getDefaultSettings(): array
    {
        return [
            'prevent_empty' => true,
        ];
    }

    public function getValue(array $control, array $instance): array
    {
        $value = parent::getValue($control, $instance);

        if (!empty($value)) {
            foreach ($value as &$item) {
                foreach ($control['fields'] as $field) {
                    $control_obj = Plugin::instance()->controlsManager->getControl($field['type']);
                    if (!$control_obj) {
                        continue;
                    }

                    $item[$field['name']] = $control_obj->getValue($field, $item);
                }
            }
        }

        return $value;
    }

    public function contentTemplate(): void
    {
        ?>
        <label>
            <span class="elementor-control-title">{{{ data.label }}}</span>
        </label>
        <div class="elementor-repeater-fields"></div>
        <div class="elementor-button-wrapper">
            <button class="elementor-button elementor-repeater-add"><span class="eicon-plus"></span><?php echo Translater::get()->l('Add Item'); ?></button>
        </div>
        <?php
    }
}
