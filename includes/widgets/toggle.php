<?php
namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Widget_Toggle extends Widget_Base
{
    public function get_id()
    {
        return 'toggle';
    }

    public function get_title()
    {
        return \IqitElementorTranslater::get()->l('Toggle', 'elementor');
    }

    public function get_icon()
    {
        return 'toggle';
    }

    protected function _register_controls()
    {
        $this->add_control(
            'section_title',
            [
                'label' => \IqitElementorTranslater::get()->l('Toggle', 'elementor'),
                'type' => Controls_Manager::SECTION,
            ]
        );

        $this->add_control(
            'tabs',
            [
                'label' => \IqitElementorTranslater::get()->l('Toggle Items', 'elementor'),
                'type' => Controls_Manager::REPEATER,
                'section' => 'section_title',
                'default' => [
                    [
                        'tab_title' => \IqitElementorTranslater::get()->l('Toggle #1', 'elementor'),
                        'tab_content' => \IqitElementorTranslater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                    [
                        'tab_title' => \IqitElementorTranslater::get()->l('Toggle #2', 'elementor'),
                        'tab_content' => \IqitElementorTranslater::get()->l('I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'elementor'),
                    ],
                ],
                'fields' => [
                    [
                        'name' => 'tab_title',
                        'label' => \IqitElementorTranslater::get()->l('Title & Content', 'elementor'),
                        'type' => Controls_Manager::TEXT,
                        'label_block' => true,
                        'default' => \IqitElementorTranslater::get()->l('Toggle Title', 'elementor'),
                    ],
                    [
                        'name' => 'tab_content',
                        'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
                        'type' => Controls_Manager::WYSIWYG,
                        'default' => \IqitElementorTranslater::get()->l('Toggle Content', 'elementor'),
                        'show_label' => false,
                    ],
                ],
                'title_field' => 'tab_title',
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorTranslater::get()->l('View', 'elementor'),
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_title',
            ]
        );

        $this->add_control(
            'section_title_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Toggle', 'elementor'),
                'type' => Controls_Manager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->add_control(
            'border_width',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Width', 'elementor'),
                'type' => Controls_Manager::SLIDER,
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

        $this->add_control(
            'border_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Border Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'border-bottom-color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'title_background',
            [
                'label' => \IqitElementorTranslater::get()->l('Title Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'title_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Title Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_1,
                ],
            ]
        );

        $this->add_control(
            'tab_active_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Active Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-title.active' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_4,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'label' => \IqitElementorTranslater::get()->l('Title Typography', 'elementor'),
                'name' => 'title_typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-toggle .elementor-toggle-title',
                'scheme' => Scheme_Typography::TYPOGRAPHY_1,
            ]
        );

        $this->add_control(
            'content_background_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Background', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'background-color: {{VALUE}};',
                ],
                'separator' => 'before',
            ]
        );

        $this->add_control(
            'content_color',
            [
                'label' => \IqitElementorTranslater::get()->l('Content Color', 'elementor'),
                'type' => Controls_Manager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selectors' => [
                    '{{WRAPPER}} .elementor-toggle .elementor-toggle-content' => 'color: {{VALUE}};',
                ],
                'scheme' => [
                    'type' => Scheme_Color::get_type(),
                    'value' => Scheme_Color::COLOR_3,
                ],
            ]
        );

        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'content_typography',
                'label' => 'Content Typography',
                'tab' => self::TAB_STYLE,
                'section' => 'section_title_style',
                'selector' => '{{WRAPPER}} .elementor-toggle .elementor-toggle-content',
                'scheme' => Scheme_Typography::TYPOGRAPHY_3,
            ]
        );
    }

    protected function render($instance = [])
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
				<div class="elementor-toggle-content" data-tab="<?php echo $counter; ?>"><?php echo $this->parse_text_editor($item['tab_content'], $item); ?></div>
			<?php
                ++$counter;
			} ?>
		</div>
		<?php
    }

    protected function content_template()
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
