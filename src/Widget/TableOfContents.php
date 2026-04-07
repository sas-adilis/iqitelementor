<?php

namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class TableOfContents extends WidgetBase
{
    /*
    |--------------------------------------------------------------------------
    | IDENTIFICATION
    |--------------------------------------------------------------------------
    */

    public function getId(): string
    {
        return 'table-of-contents';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Table of Contents');
    }

    public function getIcon(): string
    {
        return 'list-ul';
    }

    /*
    |--------------------------------------------------------------------------
    | CONTROLS REGISTRATION
    |--------------------------------------------------------------------------
    */

    protected function registerControls(): void
    {
        $this->registerContentControls();
        $this->registerAdditionalOptionsControls();
        $this->registerStyleBoxControls();
        $this->registerStyleHeaderControls();
        $this->registerStyleListControls();
    }

    /*
    |--------------------------------------------------------------------------
    | CONTENT — Table of Contents
    |--------------------------------------------------------------------------
    */

    private function registerContentControls(): void
    {
        $this->startControlsSection(
            'section_toc',
            [
                'label' => Translater::get()->l('Table of Contents'),
            ]
        );

        $this->addControl(
            'title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::TEXT,
                'default' => 'Table of Contents',
                'label_block' => true,
            ]
        );

        $this->addControl(
            'html_tag',
            [
                'label' => Translater::get()->l('HTML Tag'),
                'type' => ControlManager::SELECT,
                'default' => 'h4',
                'options' => [
                    'h2' => 'H2',
                    'h3' => 'H3',
                    'h4' => 'H4',
                    'h5' => 'H5',
                    'h6' => 'H6',
                    'div' => 'div',
                ],
            ]
        );

        $this->addControl(
            'headings_by_tags',
            [
                'label' => Translater::get()->l('Headings By Tags'),
                'type' => ControlManager::CHECKBOX_LIST,
                'default' => ['h2'],
                'options' => [
                    'h2' => 'H2',
                    'h3' => 'H3',
                    'h4' => 'H4',
                    'h5' => 'H5',
                    'h6' => 'H6',
                ],
            ]
        );

        $this->addControl(
            'container',
            [
                'label' => Translater::get()->l('Container'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => '.my-container',
                'description' => Translater::get()->l('This control limits the table of contents to heading elements under a specific container'),
                'label_block' => true,
            ]
        );

        $this->addControl(
            'marker_view',
            [
                'label' => Translater::get()->l('Marker View'),
                'type' => ControlManager::SELECT,
                'default' => 'bullets',
                'options' => [
                    'bullets' => Translater::get()->l('Bullets'),
                    'numbers' => Translater::get()->l('Numbers'),
                ],
            ]
        );

        $this->addControl(
            'no_headings_message',
            [
                'label' => Translater::get()->l('No Headings Found Message'),
                'type' => ControlManager::TEXT,
                'default' => 'No headings were found on this page.',
                'label_block' => true,
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | CONTENT — Additional Options
    |--------------------------------------------------------------------------
    */

    private function registerAdditionalOptionsControls(): void
    {
        $this->startControlsSection(
            'section_additional_options',
            [
                'label' => Translater::get()->l('Additional Options'),
            ]
        );

        $this->addControl(
            'minimize_box',
            [
                'label' => Translater::get()->l('Minimize Box'),
                'type' => ControlManager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->addControl(
            'expand_icon',
            [
                'label' => Translater::get()->l('Expand Icon'),
                'type' => ControlManager::ICON,
                'default' => 'fa fa-chevron-down',
                'label_block' => true,
                'condition' => [
                    'minimize_box' => 'yes',
                ],
            ]
        );

        $this->addControl(
            'collapse_icon',
            [
                'label' => Translater::get()->l('Collapse Icon'),
                'type' => ControlManager::ICON,
                'default' => 'fa fa-chevron-up',
                'label_block' => true,
                'condition' => [
                    'minimize_box' => 'yes',
                ],
            ]
        );

        $this->addControl(
            'minimized_on',
            [
                'label' => Translater::get()->l('Minimized On'),
                'type' => ControlManager::SELECT,
                'default' => 'tablet',
                'options' => [
                    'none' => Translater::get()->l('None'),
                    'mobile' => Translater::get()->l('Mobile (< 768px)'),
                    'tablet' => Translater::get()->l('Tablet (< 1024px)'),
                    'desktop' => Translater::get()->l('Always'),
                ],
                'condition' => [
                    'minimize_box' => 'yes',
                ],
            ]
        );

        $this->addControl(
            'hierarchical_view',
            [
                'label' => Translater::get()->l('Hierarchical View'),
                'type' => ControlManager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->addControl(
            'collapse_subitems',
            [
                'label' => Translater::get()->l('Collapse Subitems'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE — Box
    |--------------------------------------------------------------------------
    */

    private function registerStyleBoxControls(): void
    {
        $this->startControlsSection(
            'section_style_box',
            [
                'label' => Translater::get()->l('Box'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'background_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'border_color',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'toc_border_width',
            [
                'label' => Translater::get()->l('Border Width'),
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
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc' => 'border-width: {{SIZE}}{{UNIT}}; border-style: solid;',
                ],
            ]
        );

        $this->addResponsiveControl(
            'toc_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 0,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc' => 'border-radius: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'header_separator_width',
            [
                'label' => Translater::get()->l('Separator Width'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 2,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__header' => 'border-bottom-width: {{SIZE}}{{UNIT}}; border-bottom-style: solid;',
                ],
            ]
        );

        $this->addResponsiveControl(
            'toc_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 10,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 50,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__body' => 'padding: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'min_height',
            [
                'label' => Translater::get()->l('Min Height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 0,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1000,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__body' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE — Header
    |--------------------------------------------------------------------------
    */

    private function registerStyleHeaderControls(): void
    {
        $this->startControlsSection(
            'section_style_header',
            [
                'label' => Translater::get()->l('Header'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'header_text_align',
            [
                'label' => Translater::get()->l('Text Alignment'),
                'type' => ControlManager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Center'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__header' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'header_background_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__header' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'header_text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__header-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'header_typography',
                'selector' => '{{WRAPPER}} .elementor-toc__header-title',
            ]
        );

        $this->addControl(
            'toggle_button_color',
            [
                'label' => Translater::get()->l('Toggle Button Color'),
                'type' => ControlManager::COLOR,
                'separator' => 'before',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__toggle-button' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'heading_gap',
            [
                'label' => Translater::get()->l('Gap'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => '',
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__header' => 'gap: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->endControlsSection();
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE — List
    |--------------------------------------------------------------------------
    */

    private function registerStyleListControls(): void
    {
        $this->startControlsSection(
            'section_style_list',
            [
                'label' => Translater::get()->l('List'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'max_height',
            [
                'label' => Translater::get()->l('Max Height'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => '',
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1000,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__body' => 'max-height: {{SIZE}}{{UNIT}}; overflow-y: auto;',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'list_typography',
                'selector' => '{{WRAPPER}} .elementor-toc__list-item-text',
            ]
        );

        $this->addResponsiveControl(
            'list_indent',
            [
                'label' => Translater::get()->l('Indent'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => '',
                ],
                'size_units' => ['em', 'px'],
                'range' => [
                    'em' => [
                        'min' => 0,
                        'max' => 5,
                        'step' => 0.1,
                    ],
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-wrapper .elementor-toc__list-wrapper' => 'padding-left: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'list_spacing',
            [
                'label' => Translater::get()->l('Items Gap'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => '',
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 30,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item' => 'padding-top: calc({{SIZE}}{{UNIT}} / 2); padding-bottom: calc({{SIZE}}{{UNIT}} / 2);',
                ],
            ]
        );

        // Normal / Hover / Active tabs
        $this->startControlsTabs('list_style_tabs');

        // Normal
        $this->startControlsTab(
            'list_style_normal',
            [
                'label' => Translater::get()->l('Normal'),
            ]
        );

        $this->addControl(
            'item_text_color_normal',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'item_text_underline_normal',
            [
                'label' => Translater::get()->l('Underline'),
                'type' => ControlManager::SWITCHER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text' => 'text-decoration: underline;',
                ],
            ]
        );

        $this->endControlsTab();

        // Hover
        $this->startControlsTab(
            'list_style_hover',
            [
                'label' => Translater::get()->l('Hover'),
            ]
        );

        $this->addControl(
            'item_text_color_hover',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text:hover' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'item_text_underline_hover',
            [
                'label' => Translater::get()->l('Underline'),
                'type' => ControlManager::SWITCHER,
                'default' => 'yes',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text:hover' => 'text-decoration: underline;',
                ],
            ]
        );

        $this->endControlsTab();

        // Active
        $this->startControlsTab(
            'list_style_active',
            [
                'label' => Translater::get()->l('Active'),
            ]
        );

        $this->addControl(
            'item_text_color_active',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item--active > .elementor-toc__list-item-text' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'item_text_underline_active',
            [
                'label' => Translater::get()->l('Underline'),
                'type' => ControlManager::SWITCHER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item--active > .elementor-toc__list-item-text' => 'text-decoration: underline;',
                ],
            ]
        );

        $this->endControlsTab();
        $this->endControlsTabs();

        // Marker sub-heading
        $this->addControl(
            'marker_heading',
            [
                'label' => Translater::get()->l('Marker'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'marker_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text::before' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-toc__list-wrapper' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addResponsiveControl(
            'marker_size',
            [
                'label' => Translater::get()->l('Size'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => '',
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 30,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-toc__list-item-text::before' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'marker_view' => 'bullets',
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
        $headingsByTags = $optionsSource['headings_by_tags'] ?? ['h2'];
        if (is_string($headingsByTags)) {
            $headingsByTags = array_filter(explode(',', $headingsByTags));
        }
        if (empty($headingsByTags)) {
            $headingsByTags = ['h2'];
        }

        $expandIconHtml = IconHelper::renderIcon($optionsSource['expand_icon'] ?? 'fa fa-chevron-down');
        $collapseIconHtml = IconHelper::renderIcon($optionsSource['collapse_icon'] ?? 'fa fa-chevron-up');

        return [
            'title' => $optionsSource['title'] ?? 'Table of Contents',
            'html_tag' => $optionsSource['html_tag'] ?? 'h4',
            'headings_by_tags' => $headingsByTags,
            'container' => $optionsSource['container'] ?? '',
            'marker_view' => $optionsSource['marker_view'] ?? 'bullets',
            'no_headings_message' => $optionsSource['no_headings_message'] ?? 'No headings were found on this page.',
            'minimize_box' => ($optionsSource['minimize_box'] ?? '') === 'yes',
            'expand_icon_html' => $expandIconHtml,
            'collapse_icon_html' => $collapseIconHtml,
            'minimized_on' => $optionsSource['minimized_on'] ?? 'tablet',
            'hierarchical_view' => ($optionsSource['hierarchical_view'] ?? '') === 'yes',
            'collapse_subitems' => ($optionsSource['collapse_subitems'] ?? '') === 'yes',
        ];
    }
}
