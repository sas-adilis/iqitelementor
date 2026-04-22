<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\IconHelper;
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
            'heading_icon',
            [
                'label' => Translater::get()->l('Icon'),
                'type' => ControlManager::ICON,
                'label_block' => true,
                'default' => '',
                'section' => 'section_content',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'heading_icon_position',
            [
                'label' => Translater::get()->l('Icon position'),
                'type' => ControlManager::SELECT,
                'default' => 'before',
                'options' => [
                    'before' => Translater::get()->l('Before text'),
                    'after' => Translater::get()->l('After text'),
                ],
                'section' => 'section_content',
                'condition' => [
                    'heading_icon!' => '',
                ],
            ]
        );

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

        $this->startControlsSection(
            'section_heading_icon_style',
            [
                'label' => Translater::get()->l('Icon style'),
                'tab' => self::TAB_STYLE,
                'condition' => [
                    'heading_icon!' => '',
                ],
            ]
        );

        $this->addControl(
            'heading_icon_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_heading_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-icon, {{WRAPPER}} .elementor-heading-icon i' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .elementor-heading-icon svg' => 'fill: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'heading_icon_size',
            [
                'label' => Translater::get()->l('Size'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_heading_icon_style',
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => ['min' => 6, 'max' => 300],
                    'em' => ['min' => 0.1, 'max' => 20, 'step' => 0.1],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 28,
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-icon i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-heading-icon svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'heading_icon_valign',
            [
                'label' => Translater::get()->l('Vertical alignment'),
                'type' => ControlManager::CHOOSE,
                'tab' => self::TAB_STYLE,
                'section' => 'section_heading_icon_style',
                'options' => [
                    'flex-start' => [
                        'title' => Translater::get()->l('Top'),
                        'icon' => 'eicon-v-align-top',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Middle'),
                        'icon' => 'eicon-v-align-middle',
                    ],
                    'flex-end' => [
                        'title' => Translater::get()->l('Bottom'),
                        'icon' => 'eicon-v-align-bottom',
                    ],
                    'baseline' => [
                        'title' => Translater::get()->l('Baseline'),
                        'icon' => 'eicon-v-align-stretch',
                    ],
                ],
                'default' => 'center',
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title > span, {{WRAPPER}} .elementor-heading-title > a' => 'display: inline-flex; align-items: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'heading_icon_spacing',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_heading_icon_style',
                'size_units' => ['px', 'em'],
                'range' => [
                    'px' => ['min' => 0, 'max' => 60],
                    'em' => ['min' => 0, 'max' => 5, 'step' => 0.1],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 8,
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-icon' => 'display: inline-flex; vertical-align: middle;',
                    '{{WRAPPER}} .elementor-heading-icon--before' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-heading-icon--after' => 'margin-left: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

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

        $iconPosition = isset($instance['heading_icon_position']) ? $instance['heading_icon_position'] : 'before';

        $icon_html = '';
        if (!empty($instance['heading_icon'])) {
            $icon_html = '<span class="elementor-heading-icon elementor-heading-icon--' . $iconPosition . '">'
                . IconHelper::renderIcon($instance['heading_icon'])
                . '</span>';
        }

        $textHtml = nl2br($heading_options['text']);
        $innerText = $iconPosition === 'after'
            ? $textHtml . $icon_html
            : $icon_html . $textHtml;

        $title_content = '<span>' . $innerText . '</span>';

        if (!empty($heading_options['link']['url'])) {
            $this->addRenderAttribute('url', 'href', $heading_options['link']['url']);

            foreach (LinkAttributesHelper::getAttributesArray($heading_options['link']) as $attrKey => $attrValue) {
                $this->addRenderAttribute('url', $attrKey, $attrValue);
            }

            $title_content = sprintf(
                '<a %s>%s</a>',
                $this->getRenderAttributeString('url'),
                $innerText
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
        var iconPosition = settings.heading_icon_position || 'before';
        var iconHtml = settings.heading_icon
            ? '<span class="elementor-heading-icon elementor-heading-icon--' + iconPosition + '">' + elementorRenderIcon(settings.heading_icon) + '</span>'
            : '';
        var innerText = iconPosition === 'after'
            ? headingText + iconHtml
            : iconHtml + headingText;
        var titleContent = '<span>' + innerText + '</span>';

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

            titleContent = '<a href="' + _.escape(link.url) + '"' + attrs + '>' + innerText + '</a>';
        }
        #>
        <{{{ tag }}} class="{{{ classes }}}">{{{ titleContent }}}</{{{ tag }}}>
        <?php
    }
}
