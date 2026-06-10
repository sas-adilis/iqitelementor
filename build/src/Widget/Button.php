<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Traits\ButtonTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Button extends WidgetBase
{
    use ButtonTrait;

    public function getId(): string
    {
        return 'button';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Button');
    }

    public function getIcon(): string
    {
        return 'button';
    }

    protected function registerControls(): void
    {
        $this->startControlsSection(
            'section_content',
            [
                'label' => Translater::get()->l('Button'),
            ]
        );

        $this->registerButtonControls('section_content');
        $this->endControlsSection();

        $this->startControlsSection(
            'section_styles',
            [
                'label' => Translater::get()->l('Button'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerButtonStyles('section_styles');
        $this->endControlsSection();

    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        return $this->buildButtonOptions($optionsSource);
    }
}
