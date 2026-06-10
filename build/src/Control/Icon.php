<?php
namespace IqitElementor\Control;

use IqitElementor\Base\ControlBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Icon extends ControlBase
{
    public function getType(): string
    {
        return 'icon';
    }

    protected function getDefaultSettings(): array
    {
        $enabled = IconHelper::getEnabledLibraries();
        $allLibraries = IconHelper::getAllLibraries();

        $libraries = [];
        foreach ($enabled as $key) {
            if (isset($allLibraries[$key])) {
                $libraries[$key] = $allLibraries[$key];
            }
        }

        return [
            'libraries' => $libraries,
            'label_block' => true,
        ];
    }

    public function contentTemplate(): void
    {
        $selectText = Translater::get()->l('Select Icon');
        $searchText = Translater::get()->l('Search icons...');
        $noResultText = Translater::get()->l('No icons found');
        ?>
        <div class="elementor-control-field">
            <# if ( data.label ) { #>
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <# } #>
            <div class="elementor-control-input-wrapper">
                <input type="hidden" data-setting="{{ data.name }}" />
                <div class="elementor-icon-picker" data-no-result="<?php echo $noResultText; ?>">
                    <div class="elementor-icon-picker-preview">
                        <span class="elementor-icon-picker-preview-icon"></span>
                        <span class="elementor-icon-picker-preview-label"><?php echo $selectText; ?></span>
                        <button class="elementor-icon-picker-clear" type="button">&times;</button>
                    </div>
                    <div class="elementor-icon-picker-panel" style="display:none;">
                        <div class="elementor-icon-picker-tabs"></div>
                        <div class="elementor-icon-picker-search">
                            <input type="text" placeholder="<?php echo $searchText; ?>" />
                        </div>
                        <div class="elementor-icon-picker-grid"></div>
                    </div>
                </div>
            </div>
        </div>
        <# if ( data.description ) { #>
        <div class="elementor-control-description">{{{ data.description }}}</div>
        <# } #>
        <?php
    }
}
