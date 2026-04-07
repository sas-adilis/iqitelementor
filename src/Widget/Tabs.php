<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Tabs extends WidgetBase
{
    public function getId(): string
    {
        return 'tabs';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Tabs');
    }

    public function getIcon(): string
    {
        return 'tabs';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('Tabs'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'tabs',
            [
                'label' => Translater::get()->l('Tabs Items'),
                'type' => ControlManager::REPEATER,
                'section' => 'section_title',
                'default' => [
                    [
                        'tab_title' => Translater::get()->l('Tab #1'),
                        'tab_content' => Translater::get()->l('I am tab content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                    [
                        'tab_title' => Translater::get()->l('Tab #2'),
                        'tab_content' => Translater::get()->l('I am tab content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => Translater::get()->l('Title & Content'),
                        'type' => ControlManager::TEXT,
                        'default' => Translater::get()->l('Tab Title'),
                        'placeholder' => Translater::get()->l('Tab Title'),
                        'label_block' => true,
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => Translater::get()->l('Content'),
                        'default' => Translater::get()->l('Tab Content'),
                        'placeholder' => Translater::get()->l('Tab Content'),
                        'type' => ControlManager::WYSIWYG,
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
                'section' => 'section_title',
            ]
        );

        $this->addControl(
            'section_title_style',
            [
                'label' => Translater::get()->l('Tabs Style'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'position',
            [
                'label' => Translater::get()->l('Position'),
                'type' => ControlManager::SELECT,
                'tab' => self::TAB_STYLE,
                'default' => 'left',
                'section' => 'section_title_style',
                'options' => [
                    'left' => Translater::get()->l('Left'),
                    'center' => Translater::get()->l('Center'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .nav-tabs' => 'justify-content:  {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'border_color',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .nav-tabs .nav-link.active, .nav-tabs .nav-link:hover, .nav-tabs .nav-link:focus' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'tab_color',
            [
                'label' => Translater::get()->l('Title Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-title' => 'color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'tab_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .nav-tabs .nav-link',
            ]
        );

        $this->addControl(
            'section_tab_content',
            [
                'label' => Translater::get()->l('Tab Content'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'content_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_tab_content',
                'selectors' => [
                    '{{WRAPPER}} .elementor-tab-content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'content_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_tab_content',
                'selector' => '{{WRAPPER}} .elementor-tab-content',
            ]
        );
    }

    /*protected function render( $instance = [] ) {
        ?>
        <div class="elementor-tabs tabs">
            <?php $counter = 1; ?>
            <ul class="nav nav-tabs">
                <?php foreach ( $instance['tabs'] as $item ) : ?>
                    <li class="nav-item"><a class="nav-link elementor-tab-title"  data-tab="<?php echo $counter; ?>" ><?php echo $item['tab_title']; ?></a></li>
                <?php
                    $counter++;
                endforeach; ?>
            </ul>

            <?php $counter = 1; ?>
            <div class="elementor-tabs-content-wrapper tab-content">
                <?php foreach ( $instance['tabs'] as $item ) : ?>
                    <div data-tab="<?php echo $counter; ?>" class="elementor-tab-content tab-pane"><?php echo $this->parseTextEditor( $item['tab_content'], $item ); ?></div>
                <?php
                    $counter++;
                endforeach; ?>
            </div>
        </div>
        <?php
    }*/

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        return [
            'tabs' => $optionsSource['tabs'],
        ];
    }

    /*protected function contentTemplate() {
        ?>
        <div class="elementor-tabs tabs" data-active-tab="{{ editSettings.activeItemIndex ? editSettings.activeItemIndex : 0 }}">
            <#
            if ( settings.tabs ) {
                var counter = 1; #>
                <ul class="nav nav-tabs">
                    <#
                    _.each( settings.tabs, function( item ) { #>

                        <li class="nav-item"><a class="nav-link elementor-tab-title" data-tab="{{ counter }}">{{{ item.tab_title }}}</a></li>
                    <#
                        counter++;
                    } ); #>
                </ul>

                <# counter = 1; #>
                <div class="elementor-tabs-content-wrapper tab-content">
                    <#
                    _.each( settings.tabs, function( item ) { #>
                        <div class="elementor-tab-content tab-pane" data-tab="{{ counter }}">{{{ item.tab_content }}}</div>
                    <#
                    counter++;
                    } ); #>
                </div>
            <# } #>
        </div>
        <?php
    }*/
}
