<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBaseMultiple;
use IqitElementor\Helper\SmartLinkHelper;
use IqitElementor\Helper\Translater;

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
            'nofollow' => '',
            'custom_attributes' => '',
            'label' => '',
            'type_label' => '',
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
        $optionsText = Translater::get()->l('Link options');
        $newTabText = Translater::get()->l('Open in new tab');
        $nofollowText = Translater::get()->l('Add nofollow');
        $attrsText = Translater::get()->l('Custom attributes');
        $attrsPlaceholder = Translater::get()->l('key|value, key|value');
        $mediaText = Translater::get()->l('Media link');
        $noResultText = Translater::get()->l('No results');
        $typeLabelsJson = htmlspecialchars(json_encode(SmartLinkHelper::getTypeLabels()), ENT_QUOTES, 'UTF-8');
        ?>
        <div class="elementor-control-field" data-type-labels="<?php echo $typeLabelsJson; ?>">
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper elementor-control-url-wrapper">

                <div class="elementor-control-url-entity-preview" hidden>
                    <span class="elementor-control-url-entity-badge">
                        <button class="elementor-control-url-entity-clear" type="button">&times;</button>
                        <span class="elementor-control-url-entity-label"></span>
                        <span class="elementor-control-url-entity-type"></span>
                    </span>
                </div>

                <div class="elementor-control-url-input-wrap">
                    <input type="text"
                           class="elementor-control-url-search"
                           data-setting="url"
                           placeholder="<?php echo $searchText; ?>"
                           autocomplete="off"
                           id="elementor-control-url-field-{{ data._cid }}" />
                    <div class="elementor-control-url-dropdown" hidden>
                        <div class="elementor-control-url-dropdown-loading" hidden>...</div>
                        <div class="elementor-control-url-dropdown-empty" hidden><?php echo $noResultText; ?></div>
                        <div class="elementor-control-url-dropdown-results"></div>
                    </div>
                </div>

                <button class="elementor-control-url-options tooltip-target"
                        type="button"
                        data-tooltip="<?php echo $optionsText; ?>"
                        title="<?php echo $optionsText; ?>">
                    <span class="elementor-control-url-external"><i class="fa fa-cog"></i></span>
                </button>

                <button class="elementor-control-url-media tooltip-target"
                        type="button"
                        data-tooltip="<?php echo $mediaText; ?>"
                        title="<?php echo $mediaText; ?>">
                    <span class="elementor-control-url-external"><i class="fa fa-paperclip"></i></span>
                </button>
            </div>

            <div class="elementor-control-url-options-inline" hidden>
                <div class="elementor-control-url-option-row">
                    <label>
                        <input type="checkbox" class="elementor-control-url-option" data-option="is_external" />
                        <span><?php echo $newTabText; ?></span>
                    </label>
                </div>
                <div class="elementor-control-url-option-row">
                    <label>
                        <input type="checkbox" class="elementor-control-url-option" data-option="nofollow" />
                        <span><?php echo $nofollowText; ?></span>
                    </label>
                </div>
                <div class="elementor-control-url-option-row">
                    <label class="elementor-control-url-option-label"><?php echo $attrsText; ?></label>
                    <input type="text"
                           class="elementor-control-url-option elementor-control-url-option-text"
                           data-option="custom_attributes"
                           placeholder="<?php echo $attrsPlaceholder; ?>" />
                </div>
            </div>
        </div>
        <# if ( data.description ) { #>
        <div class="elementor-control-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}