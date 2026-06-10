<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Html extends WidgetBase
{
    public function getId(): string
    {
        return 'html';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('HTML');
    }

    public function getIcon(): string
    {
        return 'code';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('HTML Code'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'html',
            [
                'label' => '',
                'type' => ControlManager::TEXTAREA,
                'default' => '',
                'description' => Translater::get()->l('DO NOT use it for CSS or JS codes. Only clean HTML will work. For more advance code please use "custom tpl" widget'),
                'placeholder' => Translater::get()->l('Enter your embed code here'),
                'section' => 'section_title',
                'show_label' => false,
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        echo $instance['html'];
    }

    protected function contentTemplate(): void
    {
        ?>
		{{{ settings.html }}}
		<?php
    }
}
