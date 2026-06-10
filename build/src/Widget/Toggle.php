<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Toggle extends WidgetBase
{
    public function getId(): string
    {
        return 'toggle';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Toggle');
    }

    public function getIcon(): string
    {
        return 'toggle';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('Toggle'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'tabs',
            [
                'label' => Translater::get()->l('Toggle Items'),
                'type' => ControlManager::REPEATER,
                'section' => 'section_title',
                'default' => [
                    [
                        'tab_title' => Translater::get()->l('Toggle #1'),
                        'tab_content' => Translater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                    [
                        'tab_title' => Translater::get()->l('Toggle #2'),
                        'tab_content' => Translater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => Translater::get()->l('Title & Content'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'default' => Translater::get()->l('Toggle Title'),
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => Translater::get()->l('Content'),
                        'type' => ControlManager::WYSIWYG,
                        'default' => Translater::get()->l('Toggle Content'),
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
                'label' => Translater::get()->l('Toggle'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
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
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'border-width: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'border-width: {{SIZE}}{{UNIT}};',
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
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'title_background',
            [
                'label' => Translater::get()->l('Title Background'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Title Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'tab_active_color',
            [
                'label' => Translater::get()->l('Active Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title.active' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'label' => Translater::get()->l('Title Typography'),
                'name' => 'title_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-toggle .elementor-toggle-title',
            ]
        );

        $this->addControl(
            'content_background_color',
            [
                'label' => Translater::get()->l('Content Background'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'content_color',
            [
                'label' => Translater::get()->l('Content Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'content_typography',
                'label' => 'Content Typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-toggle .elementor-toggle-content',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        ?>
		<div class="elementor-toggle">
			<?php $counter = 1; ?>
			<?php foreach ($instance['tabs'] as $item) { ?>
				<div class="elementor-toggle-title" data-tab="<?php echo $counter; ?>">
					<span class="elementor-toggle-icon">
						<i class="fa"></i>
					</span>
					<?php echo $item['tab_title']; ?>
				</div>
				<div class="elementor-toggle-content" data-tab="<?php echo $counter; ?>"><?php echo $this->parseTextEditor($item['tab_content'], $item); ?></div>
			<?php
                ++$counter;
			} ?>
		</div>
		<?php
    }

    protected function contentTemplate(): void
    {
        ?>
		<div class="elementor-toggle">
			<#
			if ( settings.tabs ) {
				var counter = 1;
				_.each(settings.tabs, function( item ) { #>
					<div class="elementor-toggle-title" data-tab="{{ counter }}">
						<span class="elementor-toggle-icon">
						<i class="fa"></i>
					</span>
						{{{ item.tab_title }}}
					</div>
					<div class="elementor-toggle-content" data-tab="{{ counter }}">{{{ item.tab_content }}}</div>
				<#
					counter++;
				} );
			} #>
		</div>
		<?php
    }
}
