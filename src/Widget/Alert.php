<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Alert extends WidgetBase
{
    public function getId(): string
    {
        return 'alert';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Alert');
    }

    public function getIcon(): string
    {
        return 'alert';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_alert',
            [
                'label' => Translater::get()->l('Alert'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'alert_type',
            [
                'label' => Translater::get()->l('Type'),
                'type' => ControlManager::SELECT,
                'default' => 'info',
                'section' => 'section_alert',
                'options' => [
                    'primary' => Translater::get()->l('Primary'),
                    'secondary' => Translater::get()->l('Secondary'),
                    'info' => Translater::get()->l('Info'),
                    'success' => Translater::get()->l('Success'),
                    'warning' => Translater::get()->l('Warning'),
                    'danger' => Translater::get()->l('Danger'),
                    'light' => Translater::get()->l('Light'),
                    'dark' => Translater::get()->l('Dark'),
                ],
            ]
        );

        $this->addControl(
            'alert_title',
            [
                'label' => Translater::get()->l('Title & Description'),
                'type' => ControlManager::TEXT,
                'placeholder' => Translater::get()->l('Your Title'),
                'default' => Translater::get()->l('This is Alert'),
                'label_block' => true,
                'section' => 'section_alert',
            ]
        );

        $this->addControl(
            'alert_description',
            [
                'label' => Translater::get()->l('Content'),
                'type' => ControlManager::TEXTAREA,
                'placeholder' => Translater::get()->l('Your Description'),
                'default' => Translater::get()->l('I am description. Click edit button to change this text.'),
                'separator' => 'none',
                'section' => 'section_alert',
                'show_label' => false,
            ]
        );

        $this->addControl(
            'show_dismiss',
            [
                'label' => Translater::get()->l('Dismiss Button'),
                'type' => ControlManager::SELECT,
                'default' => 'show',
                'section' => 'section_alert',
                'options' => [
                    'show' => Translater::get()->l('Show'),
                    'hide' => Translater::get()->l('Hide'),
                ],
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_alert',
            ]
        );

        $this->addControl(
            'section_type',
            [
                'label' => Translater::get()->l('Alert Type'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'background',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_type',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'border_color',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_type',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'alert_title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selector' => '{{WRAPPER}} .elementor-alert-title',
            ]
        );

        $this->addControl(
            'section_description',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'description_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_description',
                'selectors' => [
                    '{{WRAPPER}} .elementor-alert-description' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'alert_description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_description',
                'selector' => '{{WRAPPER}} .elementor-alert-description',
            ]
        );
    }

    /*protected function render(array $instance = []): void
    {
        if (empty($instance['alert_title']) && empty($instance['alert_description'])) {
            return;
        }

        if (!empty($instance['alert_type'])) {
            $this->addRenderAttribute('wrapper', 'class', 'elementor-alert alert alert-' . $instance['alert_type']);
        }

        echo '<div ' . $this->getRenderAttributeString('wrapper') . ' role="alert">';
        $html = sprintf('<span class="elementor-alert-title">%1$s</span>', $instance['alert_title']);

        if (!empty($instance['alert_description'])) {
            $html .= sprintf('<span class="elementor-alert-description">%s</span>', $instance['alert_description']);
        }

        if (!empty($instance['show_dismiss']) && 'show' === $instance['show_dismiss']) {
            $html .= '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
        }

        $html .= '</div>';

        echo $html;
    }*/

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        return $optionsSource;
    }
}
