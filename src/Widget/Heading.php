<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\LinkAttributesHelper;
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

            foreach (LinkAttributesHelper::getAttributesArray($heading_options['link']) as $attrKey => $attrValue) {
                $this->addRenderAttribute('url', $attrKey, $attrValue);
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
            var link = settings.heading_link;
            var attrs = '';
            var relParts = [];

            if (link.is_external) {
                attrs += ' target="_blank"';
                relParts.push('noopener', 'noreferrer');
            }
            if (link.nofollow) {
                relParts.push('nofollow');
            }
            if (relParts.length) {
                attrs += ' rel="' + _.uniq(relParts).join(' ') + '"';
            }
            if (link.custom_attributes) {
                _.each(link.custom_attributes.split(','), function(pair) {
                    var parts = pair.split('|');
                    if (parts.length !== 2) return;
                    var key = parts[0].trim();
                    var val = parts[1].trim();
                    if (!/^[A-Za-z_:][A-Za-z0-9_\-:.]*$/.test(key)) return;
                    attrs += ' ' + key + '="' + _.escape(val) + '"';
                });
            }

            titleContent = '<a href="' + _.escape(link.url) + '"' + attrs + '>' + headingText + '</a>';
        }
        #>
        <{{{ tag }}} class="{{{ classes }}}">{{{ titleContent }}}</{{{ tag }}}>
        <?php
    }
}
