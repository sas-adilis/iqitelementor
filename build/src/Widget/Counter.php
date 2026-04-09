<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Counter extends WidgetBase
{
    public function getId(): string
    {
        return 'counter';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Counter');
    }

    public function getIcon(): string
    {
        return 'counter';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_counter',
            [
                'label' => Translater::get()->l('Counter'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'starting_number',
            [
                'label' => Translater::get()->l('Starting Number'),
                'type' => ControlManager::NUMBER,
                'min' => 0,
                'default' => 0,
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'ending_number',
            [
                'label' => Translater::get()->l('Ending Number'),
                'type' => ControlManager::NUMBER,
                'min' => 1,
                'default' => 100,
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'prefix',
            [
                'label' => Translater::get()->l('Number Prefix'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => 1,
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'suffix',
            [
                'label' => Translater::get()->l('Number Suffix'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => Translater::get()->l('Plus'),
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'duration',
            [
                'label' => Translater::get()->l('Animation Duration'),
                'type' => ControlManager::NUMBER,
                'default' => 2000,
                'min' => 100,
                'step' => 100,
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::TEXT,
                'label_block' => true,
                'default' => Translater::get()->l('Cool Number'),
                'placeholder' => Translater::get()->l('Cool Number'),
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_counter',
            ]
        );

        $this->addControl(
            'section_number',
            [
                'label' => Translater::get()->l('Number'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'number_color',
            [
                'label' => Translater::get()->l('Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_number',
                'selectors' => [
                    '{{WRAPPER}} .elementor-counter-number-wrapper' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'typography_number',
                'tab' => self::TAB_STYLE,
                'section' => 'section_number',
                'selector' => '{{WRAPPER}} .elementor-counter-number-wrapper',
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
                    '{{WRAPPER}} .elementor-counter-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'typography_title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selector' => '{{WRAPPER}} .elementor-counter-title',
            ]
        );

        $this->addResponsiveControl(
            'title_gap',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 15,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selectors' => [
                    '{{WRAPPER}} .elementor-counter-title' => 'margin-top: {{SIZE}}{{UNIT}};',
                ],
            ]
        );
    }

    protected function contentTemplate(): void
    {
        ?>
		<div class="elementor-counter">
			<div class="elementor-counter-number-wrapper">
				<#
				var prefix = '',
					suffix = '';

				if ( settings.prefix ) {
					prefix = '<span class="elementor-counter-number-prefix">' + settings.prefix + '</span>';
				}

				var duration = '<span class="elementor-counter-number" data-duration="' + settings.duration + '" data-to_value="' + settings.ending_number + '">' + settings.starting_number + '</span>';

				if ( settings.suffix ) {
					suffix = '<span class="elementor-counter-number-suffix">' + settings.suffix + '</span>';
				}

				print( prefix + duration + suffix );
				#>
			</div>
			<# if ( settings.title ) { #>
				<div class="elementor-counter-title">{{{ settings.title }}}</div>
			<# } #>
		</div>
		<?php
    }

    public function render(array $instance = []): void
    {
        ?>
		<div class="elementor-counter">
			<div class="elementor-counter-number-wrapper">
				<?php
                $prefix = $suffix = '';

        if ($instance['prefix']) {
            $prefix = '<span class="elementor-counter-number-prefix">' . $instance['prefix'] . '</span>';
        }

        $duration = '<span class="elementor-counter-number" data-duration="' . $instance['duration'] . '" data-to_value="' . $instance['ending_number'] . '">' . $instance['starting_number'] . '</span>';

        if ($instance['suffix']) {
            $suffix = '<span class="elementor-counter-number-suffix">' . $instance['suffix'] . '</span>';
        }

        echo $prefix . $duration . $suffix;
        ?>
			</div>
			<?php if ($instance['title']) { ?>
				<div class="elementor-counter-title"><?php echo $instance['title']; ?></div>
			<?php } ?>
		</div>
		<?php
    }
}
