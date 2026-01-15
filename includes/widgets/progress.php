<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Progress extends Widget_Base
{
    public function get_id()
    {
        return 'progress';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Progress Bar', 'elementor');
    }

    public function get_icon()
    {
        return 'skill-bar';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_progress',
            [
                'label' => \IqitElementorTranslater::get()->l('Progress Bar', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => \IqitElementorTranslater::get()->l('Enter your title', 'elementor'),
                'default' => \IqitElementorTranslater::get()->l('My Skill', 'elementor'),
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->add_control(
            'progress_type',
            [
                'label' => \IqitElementorTranslater::get()->l('Type', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'section' => 'section_progress',
                'options' => [
                    '' => \IqitElementorTranslater::get()->l('Default', 'elementor'),
                    'info' => \IqitElementorTranslater::get()->l('Info', 'elementor'),
                    'success' => \IqitElementorTranslater::get()->l('Success', 'elementor'),
                    'warning' => \IqitElementorTranslater::get()->l('Warning', 'elementor'),
                    'danger' => \IqitElementorTranslater::get()->l('Danger', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'percent',
            [
                'label' => \IqitElementorTranslater::get()->l('Percentage', 'elementor'),
                'type' => Controls_Manager::SLIDER,
                'default' => [
                    'size' => 50,
                    'unit' => '%',
                ],
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->add_control(
            'display_percentage',
            [
                'label' => \IqitElementorTranslater::get()->l('Display Percentage', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'default' => 'show',
                'section' => 'section_progress',
                'options' => [
                    'show' => \IqitElementorTranslater::get()->l('Show', 'elementor'),
                    'hide' => \IqitElementorTranslater::get()->l('Hide', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'inner_text',
            [
                'label' => \IqitElementorTranslater::get()->l('Inner Text', 'elementor'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => \IqitElementorTranslater::get()->l('e.g. Web Designer', 'elementor'),
                'default' => \IqitElementorTranslater::get()->l('Web Designer', 'elementor'),
                'label_block' => true,
                'section' => 'section_progress',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_progress',
            ]
        );

        $this->add_control(
            'section_progress_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Progress Bar', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'bar_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Bar Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-wrapper .elementor-progress-bar' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'bar_bg_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Bar Background Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-wrapper' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'bar_inline_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Inner Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_progress_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-progress-bar' => 'color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Title Style', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Text Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selectors' => [
                    '{{WRAPPER}} .elementor-title' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title',
                'selector' => '{{WRAPPER}} .elementor-title',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    protected function render($instance = [])
    {
        $html = '';

        $this->add_render_attribute('wrapper', 'class', 'elementor-progress-wrapper');

        if (!empty($instance['progress_type'])) {
            $this->add_render_attribute('wrapper', 'class', 'progress-' . $instance['progress_type']);
        }

        if (!empty($instance['title'])) {
            $html .= '<span class="elementor-title">' . $instance['title'] . '</span>';
        }

        $html .= '<div ' . $this->get_render_attribute_string('wrapper') . ' role="timer">';

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

    protected function content_template()
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
