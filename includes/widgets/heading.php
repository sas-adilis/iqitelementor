<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
}

require_once ELEMENTOR_PATH . 'includes/traits/heading.php';

class Widget_Heading extends Widget_Base
{
    use IqitElementorHeadingTrait;

    public function get_id(): string
    {
        return 'heading';
    }

    public function get_title(): string
    {
        return \IqitElementorTranslater::get()->l('Heading', 'elementor');
    }

    public function get_icon(): string
    {
        return 't-letter';
    }

    protected function _register_controls()
    {
        $this->register_content_section();
        $this->register_style_section();
    }

    /**
     * Section Contenu - Texte et configuration du titre
     */
    protected function register_content_section()
    {
        $this->start_controls_section(
            'section_content',
            [
                'label' => \IqitElementorTranslater::get()->l('Content', 'elementor'),
            ]
        );

        $this->register_heading_controls('section_content');

        $this->add_control(
            'view',
            [
                'type' => Controls_Manager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Section Style - Personnalisation visuelle
     */
    protected function register_style_section()
    {
        $this->start_controls_section(
            'section_title_style',
            [
                'label' => \IqitElementorTranslater::get()->l('Title style', 'elementor'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->register_heading_styles('section_title_style');

        $this->end_controls_section();
    }

    /**
     * Rendu frontend du widget
     */
    protected function render($instance = [])
    {
        if (empty($instance['heading_text'])) {
            return;
        }

        $heading_options = $this->build_heading_options($instance);

        $this->add_render_attribute('heading', 'class', $heading_options['classes']);

        $tag = $heading_options['tag'];
        $title_content = '<span>' . $heading_options['text'] . '</span>';

        if (!empty($heading_options['link']['url'])) {
            $this->add_render_attribute('url', 'href', $heading_options['link']['url']);

            if (!empty($heading_options['link']['is_external'])) {
                $this->add_render_attribute('url', 'target', '_blank');
                $this->add_render_attribute('url', 'rel', 'noopener noreferrer');
            }

            if (!empty($heading_options['link']['nofollow'])) {
                $this->add_render_attribute('url', 'rel', 'nofollow');
            }

            $title_content = sprintf(
                '<a %s>%s</a>',
                $this->get_render_attribute_string('url'),
                $heading_options['text']
            );
        }

        printf(
            '<%1$s %2$s>%3$s</%1$s>',
            $tag,
            $this->get_render_attribute_string('heading'),
            $title_content
        );
    }

    /**
     * Template JavaScript pour l'apercu en temps reel
     */
    protected function content_template()
    {
        ?>
        <#
        if ('' === settings.heading_text) {
            return;
        }

        var tag = settings.heading_tag || 'h2';
        var sizeClass = settings.heading_size ? 'elementor-size-' + settings.heading_size : '';
        var styleClass = (settings.heading_style && settings.heading_style !== 'none') ? settings.heading_style : '';
        var classes = ['elementor-heading-title', sizeClass, styleClass].filter(Boolean).join(' ');

        var titleContent = '<span>' + settings.heading_text + '</span>';

        if (settings.heading_link && settings.heading_link.url) {
            var target = settings.heading_link.is_external ? ' target="_blank"' : '';
            var rel = settings.heading_link.is_external ? ' rel="noopener noreferrer"' : '';
            titleContent = '<a href="' + settings.heading_link.url + '"' + target + rel + '>' + settings.heading_text + '</a>';
        }
        #>
        <{{{ tag }}} class="{{{ classes }}}">{{{ titleContent }}}</{{{ tag }}}>
        <?php
    }
}
