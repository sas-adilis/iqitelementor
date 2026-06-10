<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class MenuAnchor extends WidgetBase
{
    public function getId(): string
    {
        return 'menu-anchor';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Menu anchor');
    }

    public function getIcon(): string
    {
        return 'anchor';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('Anchor'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'anchor',
            [
                'label' => 'The ID of Menu Anchor.',
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => Translater::get()->l('For Example: About'),
                'description' => Translater::get()->l('This ID will be the CSS ID you will have to use in your own page, Without #. Make sure that ID is unique per page'),
                'section' => 'section_title',
                'label_block' => true,
            ]
        );

        $this->addControl(
            'anchor_note',
            [
                'raw' => Translater::get()->l('Note: The ID link ONLY accepts these chars: `A-Z, a-z, 0-9, _ , -'),
                'type' => ControlManager::RAW_HTML,
                'section' => 'section_title',
                'classes' => 'elementor-control-descriptor elementor-panel-alert elementor-panel-alert-warning',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        if ($instance['anchor']) {
            echo '<div class="elementor-menu-anchor" id="' . $instance['anchor'] . '"></div>';
        }
    }

    protected function contentTemplate(): void
    {
        ?>
        <div class="elementor-menu-anchor"{{{ settings.anchor ? ' id="' + settings.anchor + '"' : '' }}}></div>
		<?php
    }
}
