<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Progress extends WidgetBase
{
    public function getId(): string
    {
        return 'progress';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Progress Bar');
    }

    public function getIcon(): string
    {
        return 'skill-bar';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_progress',
            [
                'label' => Translater::get()->l('Progress Bar'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::TEXT,
                'placeholder' => Translater::get()->l('Enter your title'),
                'default' => Translater::get()->l('My Skill'),
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->addControl(
            'progress_type',
            [
                'label' => Translater::get()->l('Type'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'section' => 'section_progress',
                'options' => [
                    '' => Translater::get()->l('Default'),
                    'info' => Translater::get()->l('Info'),
                    'success' => Translater::get()->l('Success'),
                    'warning' => Translater::get()->l('Warning'),
                    'danger' => Translater::get()->l('Danger'),
                ],
            ]
        );

        $this->addControl(
            'percent',
            [
                'label' => Translater::get()->l('Percentage'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 50,
                    'unit' => '%',
                ],
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->addControl(
            'display_percentage',
            [
                'label' => Translater::get()->l('Display Percentage'),
                'type' => ControlManager::SELECT,
                'default' => 'show',
                'section' => 'section_progress',
                'options' => [
                    'show' => Translater::get()->l('Show'),
                    'hide' => Translater::get()->l('Hide'),
                ],
            ]
        );

        $this->addControl(
            'inner_text',
            [
                'label' => Translater::get()->l('Inner Text'),
                'type' => ControlManager::TEXT,
                'placeholder' => Translater::get()->l('e.g. Web Designer'),
                'default' => Translater::get()->l('Web Designer'),
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_progress',
            ]
        );

        $this->addControl(
            'section_progress_style',
            [
                'label' => Translater::get()->l('Progress Bar'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'bar_color',
            [
                'label' => Translater::get()->l('Bar Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-wrapper .elementor-progress-bar' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'bar_bg_color',
            [
                'label' => Translater::get()->l('Bar Background Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-wrapper' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'bar_inline_color',
            [
                'label' => Translater::get()->l('Inner Text Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-bar' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'section_title',
            [
                'label' => Translater::get()->l('Title Style'),
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
                    '{{WRAPPER}} .elementor-title' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selector' => '{{WRAPPER}} .elementor-title',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $html = '';

        $this->addRenderAttribute('wrapper', 'class', 'elementor-progress-wrapper');

        if (!empty($instance['progress_type'])) {
            $this->addRenderAttribute('wrapper', 'class', 'progress-' . $instance['progress_type']);
        }

        if (!empty($instance['title'])) {
            $html .= '<span class="elementor-title">' . $instance['title'] . '</span>';
        }

        $html .= '<div ' . $this->getRenderAttributeString('wrapper') . ' role="timer">';

        $html .= '<div class="elementor-progress-bar" data-max="' . $instance['percent']['size'] . '">';

        if (!empty($instance['inner_text'])) {
            $data_inner = ' data-inner="' . $instance['inner_text'] . '"';
        } else {
            $data_inner = '';
        }

        $html .= '<span class="elementor-progress-text">' . $instance['inner_text'] . '</span>';

        if ('hide' !== $instance['display_percentage']) {
            $html .= '<span class="elementor-progress-percentage">' . $instance['percent']['size'] . '%</span>';
        }

        $html .= '</div></div>';

        echo $html;
    }

    protected function contentTemplate(): void
    {
        ?>
		<# if ( settings.title ) { #>
			<span class="elementor-title">{{{ settings.title }}}</span><#
				} #>
				<div class="elementor-progress-wrapper progress-{{ settings.progress_type }}" role="timer">
					<div class="elementor-progress-bar" data-max="{{ settings.percent.size }}">
						<span class="elementor-progress-text">{{{ settings.inner_text }}}</span>
						<# if ( 'hide' !== settings.display_percentage ) { #>
							<span class="elementor-progress-percentage">{{{ settings.percent.size }}}%</span>
							<# } #>
					</div>
				</div>
		<?php
    }
}
