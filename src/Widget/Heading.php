<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\HeadingTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Heading extends WidgetBase
{
    use HeadingTrait;

    public function getId(): string
    {
        return 'heading';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Heading');
    }

    public function getIcon(): string
    {
        return 't-letter';
    }

    protected function registerControls(): void
    {
        $this->registerContentSection();
        $this->registerStyleSection();
    }

    /**
     * Section Contenu - Texte et configuration du titre
     */
    protected function registerContentSection(): void
    {
        $this->startControlsSection(
            'section_content',
            [
                'label' => Translater::get()->l('Content'),
            ]
        );

        $this->registerHeadingControls('section_content');

        $this->addControl(
            'view',
            [
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Section Style - Personnalisation visuelle
     */
    protected function registerStyleSection(): void
    {
        $this->startControlsSection(
            'section_title_style',
            [
                'label' => Translater::get()->l('Title style'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerHeadingStyles('section_title_style');

        $this->endControlsSection();
    }

    /**
     * Rendu frontend du widget
     */
    protected function render(array $instance = []): void
    {
        if (empty($instance['heading_text'])) {
            return;
        }

        $heading_options = $this->buildHeadingOptions($instance);

        $this->addRenderAttribute('heading', 'class', $heading_options['classes']);

        $tag = $heading_options['tag'];
        $title_content = '<span>' . nl2br($heading_options['text']) . '</span>';

        if (!empty($heading_options['link']['url'])) {
            $this->addRenderAttribute('url', 'href', $heading_options['link']['url']);

            if (!empty($heading_options['link']['is_external'])) {
                $this->addRenderAttribute('url', 'target', '_blank');
                $this->addRenderAttribute('url', 'rel', 'noopener noreferrer');
            }

            if (!empty($heading_options['link']['nofollow'])) {
                $this->addRenderAttribute('url', 'rel', 'nofollow');
            }

            $title_content = sprintf(
                '<a %s>%s</a>',
                $this->getRenderAttributeString('url'),
                nl2br($heading_options['text'])
            );
        }

        printf(
            '<%1$s %2$s>%3$s</%1$s>',
            $tag,
            $this->getRenderAttributeString('heading'),
            $title_content
        );
    }

    /**
     * Template JavaScript pour l'apercu en temps reel
     */
    protected function contentTemplate(): void
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

        var headingText = settings.heading_text.replace(/\n/g, '<br>');
        var titleContent = '<span>' + headingText + '</span>';

        if (settings.heading_link && settings.heading_link.url) {
            var target = settings.heading_link.is_external ? ' target="_blank"' : '';
            var rel = settings.heading_link.is_external ? ' rel="noopener noreferrer"' : '';
            titleContent = '<a href="' + settings.heading_link.url + '"' + target + rel + '>' + headingText + '</a>';
        }
        #>
        <{{{ tag }}} class="{{{ classes }}}">{{{ titleContent }}}</{{{ tag }}}>
        <?php
    }
}
