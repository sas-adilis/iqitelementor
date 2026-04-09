<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\SmartLinkHelper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class URL extends ControlBaseMultiple
{
    public function getType(): string
    {
        return 'url';
    }

    public function getDefaultValue(): array
    {
        return [
            'type' => '',
            'id' => '',
            'url' => '',
            'is_external' => '',
            'label' => '',
        ];
    }

    /**
     * Resolve entity URLs dynamically at render time.
     *
     * When the value contains a type+id (e.g. category #5), we resolve
     * the real URL via PrestaShop's Link class so that the URL stays
     * valid even if the merchant changes slugs.
     */
    public function getValue(array $control, array $instance): array
    {
        $value = parent::getValue($control, $instance);

        $type = isset($value['type']) ? $value['type'] : '';
        $id = isset($value['id']) ? (int) $value['id'] : 0;

        if ($type && $type !== 'custom' && $id) {
            $value['url'] = SmartLinkHelper::resolve($value);
        }

        return $value;
    }

    protected function getDefaultSettings(): array
    {
        return [
            'label_block' => true,
            'show_external' => true,
        ];
    }

    public function contentTemplate(): void
    {
        $searchText = Translater::get()->l('Search page or enter URL...');
        $newTabText = Translater::get()->l('Open in new tab');
        $mediaText = Translater::get()->l('Media link');
        $noResultText = Translater::get()->l('No results');
        ?>
        <div class="elementor-control-field elementor-control-url-external-{{{ data.show_external ? 'show' : 'hide' }}}">
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper elementor-control-url-wrapper">

                <div class="elementor-control-url-entity-preview" style="display:none;">
                    <span class="elementor-control-url-entity-type"></span>
                    <span class="elementor-control-url-entity-label"></span>
                    <button class="elementor-control-url-entity-clear" type="button">&times;</button>
                </div>

                <div class="elementor-control-url-input-wrap">
                    <input type="text"
                           class="elementor-control-url-search"
                           data-setting="url"
                           placeholder="<?php echo $searchText; ?>"
                           autocomplete="off"
                           id="elementor-control-url-field-{{ data._cid }}"
                           data-no-result="<?php echo $noResultText; ?>" />
                    <div class="elementor-control-url-dropdown" style="display:none;"></div>
                </div>

                <button class="elementor-control-url-target tooltip-target"
                        data-tooltip="<?php echo $newTabText; ?>"
                        title="<?php echo $newTabText; ?>">
                    <span class="elementor-control-url-external"><i class="fa fa-external-link"></i></span>
                </button>

                <button class="elementor-control-url-media tooltip-target"
                        data-tooltip="<?php echo $mediaText; ?>"
                        title="<?php echo $mediaText; ?>">
                    <span class="elementor-control-url-external"><i class="fa fa-paperclip"></i></span>
                </button>
            </div>
        </div>
        <# if ( data.description ) { #>
        <div class="elementor-control-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}