<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Accordion extends WidgetBase
{
    /*
    |--------------------------------------------------------------------------
    | IDENTIFICATION
    |--------------------------------------------------------------------------
    */

    public function getId(): string
    {
        return 'accordion';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Accordion');
    }

    public function getIcon(): string
    {
        return 'accordion';
    }

    /*
    |--------------------------------------------------------------------------
    | CONTROLS REGISTRATION
    |--------------------------------------------------------------------------
    */

    protected function registerControls(): void
    {
        $this->registerContentControls();
        $this->registerOptionsControls();
        $this->registerStyleTitleControls();
        $this->registerStyleContentControls();
        $this->registerStyleBorderControls();
    }

    /*
    |--------------------------------------------------------------------------
    | CONTENT SECTION
    |--------------------------------------------------------------------------
    */

    private function registerContentControls(): void
    {
        $this->startControlsSection(
            'section_content',
            [
                'label' => Translater::get()->l('Accordion'),
            ]
        );

        $this->addControl(
            'tabs',
            [
                'label' => Translater::get()->l('Accordion Items'),
                'type' => ControlManager::REPEATER,
                'default' => [
                    [
                        'tab_title' => Translater::get()->l('Accordion #1'),
                        'tab_content' => Translater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                    [
                        'tab_title' => Translater::get()->l('Accordion #2'),
                        'tab_content' => Translater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => Translater::get()->l('Title & Content'),
                        'type' => ControlManager::TEXT,
                        'default' => Translater::get()->l('Accordion Title'),
                        'label_block' => true,
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => Translater::get()->l('Content'),
                        'type' => ControlManager::WYSIWYG,
                        'default' => Translater::get()->l('Accordion Content'),
                        'show_label' => false,
                    ],
                ],
                'title_field' => 'tab_title',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS SECTION
    |--------------------------------------------------------------------------
    */

    private function registerOptionsControls(): void
    {
        $this->startControlsSection(
            'section_options',
            [
                'label' => Translater::get()->l('Options'),
            ]
        );

        $this->addControl(
            'active_first',
            [
                'label' => Translater::get()->l('Active first tab'),
                'type' => ControlManager::SELECT,
                'default' => 1,
                'options' => [
                    1 => Translater::get()->l('Yes'),
                    0 => Translater::get()->l('No'),
                ],
            ]
        );

        $this->addControl(
            'faq',
            [
                'label' => Translater::get()->l('Faq schema'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'options' => [
                    'yes' => Translater::get()->l('Yes'),
                    '' => Translater::get()->l('No'),
                ],
                'description' => Translater::get()->l('If enabled it will add FAQ rich snippet schema data for google'),
            ]
        );

        $this->addControl(
            'icon_align',
            [
                'label' => Translater::get()->l('Icon Alignment'),
                'type' => ControlManager::SELECT,
                'default' => Helper::isRtl() ? 'right' : 'left',
                'options' => [
                    'left' => Translater::get()->l('Left'),
                    'right' => Translater::get()->l('Right'),
                ],
            ]
        );

        $this->addControl(
            'icon_type',
            [
                'label' => Translater::get()->l('Icon Type'),
                'type' => ControlManager::SELECT,
                'default' => 'default',
                'options' => [
                    'default' => Translater::get()->l('Default (chevron)'),
                    'plus_minus' => Translater::get()->l('Plus / Minus'),
                    'custom' => Translater::get()->l('Custom icon'),
                ],
            ]
        );

        $this->addControl(
            'icon_open',
            [
                'label' => Translater::get()->l('Open Icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => '',
                'condition' => [
                    'icon_type' => 'custom',
                ],
            ]
        );

        $this->addControl(
            'icon_close',
            [
                'label' => Translater::get()->l('Close Icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => '',
                'condition' => [
                    'icon_type' => 'custom',
                ],
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - TITLE SECTION
    |--------------------------------------------------------------------------
    */

    private function registerStyleTitleControls(): void
    {
        $this->startControlsSection(
            'section_style_title',
            [
                'label' => Translater::get()->l('Title'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->startControlsTabs('title_style_tabs');

        // Normal Tab
        $this->startControlsTab(
            'title_style_normal',
            [
                'label' => Translater::get()->l('Normal'),
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button.collapsed' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_background',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button.collapsed' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->endControlsTab();

        // Active Tab
        $this->startControlsTab(
            'title_style_active',
            [
                'label' => Translater::get()->l('Active'),
            ]
        );

        $this->addControl(
            'title_active_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button:not(.collapsed)' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_active_background',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-button:not(.collapsed)' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->endControlsTab();

        $this->endControlsTabs();

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'label' => Translater::get()->l('Typography'),
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .accordion .accordion-button',
                'separator' => 'before',
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - CONTENT SECTION
    |--------------------------------------------------------------------------
    */

    private function registerStyleContentControls(): void
    {
        $this->startControlsSection(
            'section_style_content',
            [
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'content_background_color',
            [
                'label' => Translater::get()->l('Content Background'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-body' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'content_color',
            [
                'label' => Translater::get()->l('Content Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .accordion .accordion-body' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'content_typography',
                'label' => Translater::get()->l('Content Typography'),
                'selector' => '{{WRAPPER}} .accordion .accordion-body',
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE - BORDER SECTION
    |--------------------------------------------------------------------------
    */

    private function registerStyleBorderControls(): void
    {
        $this->startControlsSection(
            'section_style_border',
            [
                'label' => Translater::get()->l('Border'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'border_style',
            [
                'label' => Translater::get()->l('Style'),
                'type' => ControlManager::SELECT,
                'default' => 'boxed',
                'options' => [
                    'none' => Translater::get()->l('None'),
                    'boxed' => Translater::get()->l('Boxed'),
                    'separator' => Translater::get()->l('Separator'),
                ],
            ]
        );

        $this->addControl(
            'border_width',
            [
                'label' => Translater::get()->l('Border Width'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
                'condition' => [
                    'border_style!' => 'none',
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion.accordion-style-boxed .accordion-item' => 'border-width: {{SIZE}}{{UNIT}}; border-style: solid;',
                    '{{WRAPPER}} .accordion.accordion-style-separator .accordion-item' => 'border-top-width: {{SIZE}}{{UNIT}}; border-top-style: solid;',
                ],
            ]
        );

        $this->addControl(
            'border_color',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
                'condition' => [
                    'border_style!' => 'none',
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion.accordion-style-boxed .accordion-item' => 'border-color: {{VALUE}};',
                    '{{WRAPPER}} .accordion.accordion-style-boxed .accordion-button:not(.collapsed)' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .accordion.accordion-style-separator .accordion-item' => 'border-top-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'border_radius',
            [
                'label' => Translater::get()->l('Border radius'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 0,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 20,
                    ],
                ],
                'condition' => [
                    'border_style' => 'boxed',
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion.accordion-style-boxed .accordion-item' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'items_spacing',
            [
                'label' => Translater::get()->l('Items spacing'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 0,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 30,
                    ],
                ],
                'condition' => [
                    'border_style' => 'boxed',
                ],
                'selectors' => [
                    '{{WRAPPER}} .accordion.accordion-style-boxed' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS PARSING
    |--------------------------------------------------------------------------
    */

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        $iconType = $optionsSource['icon_type'] ?? 'default';
        $iconOpenHtml = '';
        $iconCloseHtml = '';

        if ($iconType === 'custom') {
            $iconOpenHtml = IconHelper::renderIcon($optionsSource['icon_open'] ?? '');
            $iconCloseHtml = IconHelper::renderIcon($optionsSource['icon_close'] ?? '');
        }

        return [
            'faq' => $optionsSource['faq'] == 'yes',
            'active_first' => $optionsSource['active_first'] == 1,
            'tabs' => $optionsSource['tabs'],
            'icon_align' => $optionsSource['icon_align'],
            'icon_type' => $iconType,
            'icon_open_html' => $iconOpenHtml,
            'icon_close_html' => $iconCloseHtml,
            'border_style' => $optionsSource['border_style'] ?? 'boxed',
        ];
    }
}