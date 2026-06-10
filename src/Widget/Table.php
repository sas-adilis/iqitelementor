<?php

namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Table extends WidgetBase
{
    /** @var string */
    private const CELL_DELIMITER = '|';

    public function getId(): string
    {
        return 'table';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Table');
    }

    public function getIcon(): string
    {
        return 'table';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_table',
            [
                'label' => Translater::get()->l('Table'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'header_position',
            [
                'label' => Translater::get()->l('Header Position'),
                'type' => ControlManager::SELECT,
                'default' => 'top',
                'section' => 'section_table',
                'options' => [
                    'none' => Translater::get()->l('None'),
                    'top' => Translater::get()->l('Top'),
                    'bottom' => Translater::get()->l('Bottom'),
                    'left' => Translater::get()->l('Left'),
                    'right' => Translater::get()->l('Right'),
                ],
            ]
        );

        $this->addControl(
            'columns',
            [
                'label' => Translater::get()->l('Columns'),
                'type' => ControlManager::REPEATER,
                'section' => 'section_table',
                'fields' => [
                    [
                        'name' => 'header',
                        'label' => Translater::get()->l('Header'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'default' => Translater::get()->l('Column'),
                    ],
                    [
                        'name' => 'width',
                        'label' => Translater::get()->l('Width (%)'),
                        'type' => ControlManager::NUMBER,
                        'label_block' => true,
                        'min' => 0,
                        'max' => 100,
                        'step' => 1,
                        'description' => Translater::get()->l('Leave empty for automatic width.'),
                        'default' => '',
                    ],
                ],
                'title_field' => 'header',
                'default' => [
                    ['header' => Translater::get()->l('Size')],
                    ['header' => Translater::get()->l('Waist')],
                    ['header' => Translater::get()->l('Inseam')],
                ],
            ]
        );

        $this->addControl(
            'rows',
            [
                'label' => Translater::get()->l('Rows'),
                'type' => ControlManager::REPEATER,
                'section' => 'section_table',
                'fields' => [
                    [
                        'name' => 'cells',
                        'label' => Translater::get()->l('Cells'),
                        'type' => ControlManager::TEXTAREA,
                        'label_block' => true,
                        'description' => Translater::get()->l('Separate cells with the "|" character. Example: XS | 75 | 82'),
                        'default' => '',
                    ],
                    [
                        'name' => 'row_header',
                        'label' => Translater::get()->l('Row Header'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'description' => Translater::get()->l('Used only when Header Position is Left or Right.'),
                        'default' => '',
                    ],
                ],
                'title_field' => 'cells',
                'default' => [
                    ['cells' => 'XS | 75 | 82'],
                    ['cells' => 'S | 80 | 82'],
                    ['cells' => 'M | 85 | 82'],
                    ['cells' => 'L | 90 | 82'],
                    ['cells' => 'XL | 95 | 82'],
                    ['cells' => 'XXL | 100 | 82'],
                    ['cells' => 'XXXL | 105 | 82'],
                ],
            ]
        );

        $this->addControl(
            'responsive',
            [
                'label' => Translater::get()->l('Horizontal Scroll'),
                'description' => Translater::get()->l('Wrap the table in a horizontally scrollable container.'),
                'type' => ControlManager::SWITCHER,
                'section' => 'section_table',
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_table',
            ]
        );

        $this->addControl(
            'section_table_style',
            [
                'label' => Translater::get()->l('Table'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'text_align',
            [
                'label' => Translater::get()->l('Text Alignment'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'default' => 'center',
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
                'selectors' => [
                    '{{WRAPPER}} .elementor-table th' => 'text-align: {{VALUE}};',
                    '{{WRAPPER}} .elementor-table td' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'cell_padding',
            [
                'label' => Translater::get()->l('Cell Padding'),
                'type' => ControlManager::DIMENSIONS,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'size_units' => ['px', 'em', '%'],
                'default' => [
                    'top' => 12,
                    'right' => 16,
                    'bottom' => 12,
                    'left' => 16,
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table th' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-table td' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'show_row_border',
            [
                'label' => Translater::get()->l('Row Border'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'default' => 'yes',
                'return_value' => 'yes',
                'separator' => 'before',
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'show_last_row_border',
            [
                'label' => Translater::get()->l('Last Row Border'),
                'description' => Translater::get()->l('Show bottom border on the last row.'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'default' => 'yes',
                'return_value' => 'yes',
                'condition' => [
                    'show_row_border' => 'yes',
                ],
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'row_border_color',
            [
                'label' => Translater::get()->l('Row Border Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'default' => '#dddddd',
                'condition' => [
                    'show_row_border' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table.has-row-border tr' => 'border-color: {{VALUE}};',
                ],
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'row_border_width',
            [
                'label' => Translater::get()->l('Row Border Width'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'default' => ['size' => 1],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
                'condition' => [
                    'show_row_border' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table.has-row-border tbody tr' => 'border-bottom-width: {{SIZE}}{{UNIT}}; border-bottom-style: solid;',
                    '{{WRAPPER}} .elementor-table.has-row-border:not(.has-last-row-border) tbody tr:last-child' => 'border-bottom-width: 0;',
                ],
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'text_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-table td' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'text_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_table_style',
                'selector' => '{{WRAPPER}} .elementor-table td',
            ]
        );

        $this->addControl(
            'section_stripes',
            [
                'label' => Translater::get()->l('Striped Rows'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'stripe_rows',
            [
                'label' => Translater::get()->l('Striped Rows'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_stripes',
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );

        $this->addControl(
            'stripe_color',
            [
                'label' => Translater::get()->l('Stripe Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_stripes',
                'default' => '#f2f2f2',
                'condition' => [
                    'stripe_rows' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table.is-striped tbody tr:nth-child(even)' => 'background-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-table.is-striped tbody tr:nth-child(even) th' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'section_header_style',
            [
                'label' => Translater::get()->l('Header'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'header_text_color',
            [
                'label' => Translater::get()->l('Header Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-table th' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'header_bg_color',
            [
                'label' => Translater::get()->l('Header Background'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-table th' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'header_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'selector' => '{{WRAPPER}} .elementor-table th',
            ]
        );

        $this->addControl(
            'show_header_border',
            [
                'label' => Translater::get()->l('Header Border'),
                'type' => ControlManager::SWITCHER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'default' => 'yes',
                'return_value' => 'yes',
                'separator' => 'before',
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'header_border_color',
            [
                'label' => Translater::get()->l('Header Border Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'default' => '#dddddd',
                'condition' => [
                    'show_header_border' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table.has-header-border thead tr' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-table.has-header-border tfoot tr' => 'border-top-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-table.has-header-border.header-left th[scope="row"]' => 'border-right-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-table.has-header-border.header-right th[scope="row"]' => 'border-left-color: {{VALUE}};',
                ],
                'style_transfer' => true,
            ]
        );

        $this->addControl(
            'header_border_width',
            [
                'label' => Translater::get()->l('Header Border Width'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_header_style',
                'default' => ['size' => 1],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
                'condition' => [
                    'show_header_border' => 'yes',
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-table.has-header-border thead tr' => 'border-bottom-width: {{SIZE}}{{UNIT}}; border-bottom-style: solid;',
                    '{{WRAPPER}} .elementor-table.has-header-border tfoot tr' => 'border-top-width: {{SIZE}}{{UNIT}}; border-top-style: solid;',
                    '{{WRAPPER}} .elementor-table.has-header-border.header-left th[scope="row"]' => 'border-right-width: {{SIZE}}{{UNIT}}; border-right-style: solid;',
                    '{{WRAPPER}} .elementor-table.has-header-border.header-right th[scope="row"]' => 'border-left-width: {{SIZE}}{{UNIT}}; border-left-style: solid;',
                ],
                'style_transfer' => true,
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $columns = isset($instance['columns']) && is_array($instance['columns']) ? $instance['columns'] : [];
        $rows = isset($instance['rows']) && is_array($instance['rows']) ? $instance['rows'] : [];
        $headerPosition = isset($instance['header_position']) && $instance['header_position'] !== ''
            ? $instance['header_position']
            : 'top';
        $striped = isset($instance['stripe_rows']) && $instance['stripe_rows'] === 'yes';
        $responsive = !isset($instance['responsive']) || $instance['responsive'] === 'yes';
        $showRowBorder = !isset($instance['show_row_border']) || $instance['show_row_border'] === 'yes';
        $showLastRowBorder = !isset($instance['show_last_row_border']) || $instance['show_last_row_border'] === 'yes';
        $showHeaderBorder = !isset($instance['show_header_border']) || $instance['show_header_border'] === 'yes';

        $colCount = count($columns);
        if ($colCount === 0) {
            return;
        }

        $hasTopHeader = $headerPosition === 'top';
        $hasBottomHeader = $headerPosition === 'bottom';
        $hasSideHeader = $headerPosition === 'left' || $headerPosition === 'right';
        $headerOnRight = $headerPosition === 'right';

        $tableClasses = 'elementor-table header-' . $headerPosition;
        if ($striped) {
            $tableClasses .= ' is-striped';
        }
        if ($showRowBorder) {
            $tableClasses .= ' has-row-border';
            if ($showLastRowBorder) {
                $tableClasses .= ' has-last-row-border';
            }
        }
        if ($showHeaderBorder) {
            $tableClasses .= ' has-header-border';
        }

        $headerRow = '';
        if ($hasTopHeader || $hasBottomHeader) {
            $headerRow = '<tr>';
            foreach ($columns as $col) {
                $headerRow .= '<th>' . (isset($col['header']) ? $col['header'] : '') . '</th>';
            }
            $headerRow .= '</tr>';
        }

        if ($responsive) {
            echo '<div class="elementor-table-wrapper" style="overflow-x:auto;width:100%;">';
        }

        echo '<table class="' . Helper::escAttr($tableClasses) . '">';

        $colgroupHtml = '';
        $hasAnyWidth = false;
        foreach ($columns as $col) {
            if (isset($col['width']) && $col['width'] !== '' && $col['width'] !== null) {
                $hasAnyWidth = true;
                break;
            }
        }
        if ($hasAnyWidth) {
            $colgroupHtml .= '<colgroup>';
            if ($hasSideHeader && !$headerOnRight) {
                $colgroupHtml .= '<col>';
            }
            foreach ($columns as $col) {
                $w = isset($col['width']) ? $col['width'] : '';
                if ($w !== '' && $w !== null) {
                    $colgroupHtml .= '<col style="width: ' . Helper::escAttr((string) $w) . '%">';
                } else {
                    $colgroupHtml .= '<col>';
                }
            }
            if ($hasSideHeader && $headerOnRight) {
                $colgroupHtml .= '<col>';
            }
            $colgroupHtml .= '</colgroup>';
            echo $colgroupHtml;
        }

        if ($hasTopHeader) {
            echo '<thead>' . $headerRow . '</thead>';
        }

        echo '<tbody>';
        foreach ($rows as $row) {
            echo '<tr>';
            $rawCells = isset($row['cells']) ? $row['cells'] : '';
            $parts = $rawCells === '' ? [] : array_map('trim', explode(self::CELL_DELIMITER, $rawCells));
            $cellsHtml = '';
            for ($i = 0; $i < $colCount; $i++) {
                $value = isset($parts[$i]) ? $parts[$i] : '';
                $cellsHtml .= '<td>' . $value . '</td>';
            }
            if ($hasSideHeader) {
                $rowHeaderHtml = '<th scope="row">' . (isset($row['row_header']) ? $row['row_header'] : '') . '</th>';
                if ($headerOnRight) {
                    echo $cellsHtml . $rowHeaderHtml;
                } else {
                    echo $rowHeaderHtml . $cellsHtml;
                }
            } else {
                echo $cellsHtml;
            }
            echo '</tr>';
        }
        echo '</tbody>';

        if ($hasBottomHeader) {
            echo '<tfoot>' . $headerRow . '</tfoot>';
        }

        echo '</table>';

        if ($responsive) {
            echo '</div>';
        }
    }

    protected function contentTemplate(): void
    {
        ?>
        <#
        var columns = settings.columns || [];
        var rows = settings.rows || [];
        var headerPosition = settings.header_position || 'top';
        var striped = settings.stripe_rows === 'yes';
        var responsive = settings.responsive === 'yes';
        var showRowBorder = settings.show_row_border === 'yes';
        var showLastRowBorder = settings.show_last_row_border === 'yes';
        var showHeaderBorder = settings.show_header_border === 'yes';
        var colCount = columns.length;

        if ( colCount > 0 ) {
            var tableClasses = 'elementor-table header-' + headerPosition;
            if ( striped ) { tableClasses += ' is-striped'; }
            if ( showRowBorder ) {
                tableClasses += ' has-row-border';
                if ( showLastRowBorder ) { tableClasses += ' has-last-row-border'; }
            }
            if ( showHeaderBorder ) { tableClasses += ' has-header-border'; }

            var hasTopHeader = headerPosition === 'top';
            var hasBottomHeader = headerPosition === 'bottom';
            var hasSideHeader = headerPosition === 'left' || headerPosition === 'right';
            var headerOnRight = headerPosition === 'right';

            var colgroupHtml = '';
            var hasAnyWidth = _.some( columns, function( c ) { return c.width !== '' && c.width !== undefined && c.width !== null; });
            if ( hasAnyWidth ) {
                colgroupHtml = '<colgroup>';
                if ( hasSideHeader && ! headerOnRight ) { colgroupHtml += '<col>'; }
                _.each( columns, function( col ) {
                    if ( col.width !== '' && col.width !== undefined && col.width !== null ) {
                        colgroupHtml += '<col style="width: ' + col.width + '%">';
                    } else {
                        colgroupHtml += '<col>';
                    }
                });
                if ( hasSideHeader && headerOnRight ) { colgroupHtml += '<col>'; }
                colgroupHtml += '</colgroup>';
            }

            var headerRow = '';
            if ( hasTopHeader || hasBottomHeader ) {
                headerRow = '<tr>';
                _.each( columns, function( col ) {
                    headerRow += '<th>' + ( col.header || '' ) + '</th>';
                });
                headerRow += '</tr>';
            }

            var bodyRows = '';
            _.each( rows, function( row ) {
                var raw = row.cells || '';
                var parts = raw === '' ? [] : raw.split('|').map(function(s){ return s.trim(); });
                var cellsHtml = '';
                for ( var i = 0; i < colCount; i++ ) {
                    cellsHtml += '<td>' + ( parts[i] || '' ) + '</td>';
                }
                var rowHtml = '';
                if ( hasSideHeader ) {
                    var rowHeaderHtml = '<th scope="row">' + ( row.row_header || '' ) + '</th>';
                    rowHtml = headerOnRight ? ( cellsHtml + rowHeaderHtml ) : ( rowHeaderHtml + cellsHtml );
                } else {
                    rowHtml = cellsHtml;
                }
                bodyRows += '<tr>' + rowHtml + '</tr>';
            });
        #>
            <# if ( responsive ) { #>
            <div class="elementor-table-wrapper" style="overflow-x:auto;width:100%;">
            <# } #>
            <table class="{{ tableClasses }}">
                {{{ colgroupHtml }}}
                <# if ( hasTopHeader ) { #>
                    <thead>{{{ headerRow }}}</thead>
                <# } #>
                <tbody>{{{ bodyRows }}}</tbody>
                <# if ( hasBottomHeader ) { #>
                    <tfoot>{{{ headerRow }}}</tfoot>
                <# } #>
            </table>
            <# if ( responsive ) { #>
            </div>
            <# } #>
        <# } #>
        <?php
    }
}
