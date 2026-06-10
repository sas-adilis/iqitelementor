<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;
use IqitElementor\Traits\ButtonTrait;
use IqitElementor\Traits\HeadingTrait;

if (!defined('ELEMENTOR_ABSPATH')) { throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly'); }

class CallToAction extends WidgetBase
{
    use ButtonTrait;
    use HeadingTrait;

    public function getId(): string
    {
        return 'call_to_action';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Call to Action');
    }

    public function getIcon(): string
    {
        return 'image-rollover';
    }

    public function getKeywords(): array
    {
        return ['cta', 'call', 'action', 'banner'];
    }

    /**
     * Tous les contrôles (sans tags dynamiques)
     */
    protected function registerControls(): void
    {
        $this->registerContentControls();
        $this->registerStyleControls();
    }

    /**
     * Register content-related controls (TAB CONTENT).
     */
    protected function registerContentControls(): void
    {
        /**
         * TAB CONTENT – Section principale CTA
         */
        $this->startControlsSection(
            'section_cta',
            [
                'label' => Translater::get()->l('Call to Action'),
                'tab' => self::TAB_CONTENT,
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link'),
                'type' => ControlManager::URL,
                'placeholder' => 'http://your-link.com',
                'default' => [
                    'url' => '#',
                ]
            ]
        );

        $this->addControl(
            'link_click',
            [
                'label' => Translater::get()->l('Apply Link On'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'box' => Translater::get()->l('Whole Box'),
                    'button' => Translater::get()->l('Button Only'),
                ],
                'default' => 'button',
                'condition' => [
                    'button!' => '',
                    'link[url]!' => '',
                ],
            ]
        );

        $this->addControl(
            'skin',
            [
                'label' => Translater::get()->l('Skin'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'classic' => Translater::get()->l('Classic'),
                    'cover' => Translater::get()->l('Cover'),
                ],
                'default' => 'classic',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'bg_image',
            [
                'label' => Translater::get()->l('Image'),
                'type' => ControlManager::MEDIA,
                'default' => [
                    'url' => Utils::getPlaceholderImageSrc(),
                ],
            ]
        );

        /**
         * Layout (position image / contenu)
         */
        $this->addResponsiveControl(
            'layout',
            [
                'label' => Translater::get()->l('Image Position'),
                'type' => ControlManager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'left' => ['title' => Translater::get()->l('Left'), 'icon' => 'eicon-h-align-left',],
                    'above' => ['title' => Translater::get()->l('Above'), 'icon' => 'eicon-v-align-top',],
                    'right' => ['title' => Translater::get()->l('Right'), 'icon' => 'eicon-h-align-right',],
                ],
                'default' => 'left',
                'prefix_class' => 'elementor-cta%s-layout-image-',
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => '',
                ],
            ]
        );

        $this->addResponsiveControl(
            'image_min_width',
            [
                'label' => Translater::get()->l('Min Width'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => ['min' => 0, 'max' => 500,],
                    '%' => ['min' => 0, 'max' => 100,],
                ],
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper' => 'min-width: {{SIZE}}{{UNIT}}',
                ],
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => ''
                ],
            ]
        );

        $this->addResponsiveControl(
            'image_min_height',
            [
                'label' => Translater::get()->l('Min height'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => ['min' => 0, 'max' => 500,],
                    '%' => ['min' => 0, 'max' => 100,],
                ],
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => '',
                ],
            ]
        );

        $this->endControlsSection();

        $this->startControlsSection(
            'section_content',
            [
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_CONTENT,
            ]
        );


        $this->addControl(
            'section_heading',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );


        $this->registerHeadingControls('section_content', [], ['heading_link']);

        $this->addControl(
            'section_description',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'description_text',
            [
                'label' => null,
                'type' => ControlManager::WYSIWYG,
                'default' => Translater::get()->l('I am text block. Click edit button to change this text.'),
                'section' => 'section_content',
                'save_empty_value' => true,
            ]
        );

        $this->addControl(
            'section_button',
            [
                'label' => Translater::get()->l('Button'),
                'type' => ControlManager::HEADING,
                'section' => 'section_content',
                'separator' => 'before',
            ]
        );

        $this->registerButtonControls('section_content', [], ['button_link']);

        $this->endControlsSection();
    }

    /**
     * Register style-related controls (TAB STYLE).
     */
    protected function registerStyleControls(): void
    {
        /**
         * TAB STYLE – Box
         */
        $this->startControlsSection(
            'section_style_box',
            [
                'label' => Translater::get()->l('Box'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'min_height',
            [
                'label' => Translater::get()->l('Min Height'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => ['min' => 100, 'max' => 1000,],
                    'vh' => ['min' => 10, 'max' => 100,],
                ],
                'size_units' => ['px', 'vh'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta' => 'min-height: {{SIZE}}{{UNIT}}',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->addResponsiveControl(
            'image_height',
            [
                'label' => Translater::get()->l('Image Height'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => ['min' => 0, 'max' => 1000],
                    'vh' => ['min' => 0, 'max' => 100],
                ],
                'size_units' => ['px', 'vh'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper' => 'height: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-cta-bg-wrapper img.elementor-cta-bg' => 'height: 100%;',
                ],
                'condition' => [
                    'skin' => 'classic',
                    'bg_image[url]!' => '',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->addResponsiveControl(
            'image_fit',
            [
                'label' => Translater::get()->l('Object Fit'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'cover' => Translater::get()->l('Cover'),
                    'contain' => Translater::get()->l('Contain'),
                    'fill' => Translater::get()->l('Fill'),
                    'none' => Translater::get()->l('None'),
                    'scale-down' => Translater::get()->l('Scale Down'),
                ],
                'default' => 'cover',
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper img.elementor-cta-bg' => 'object-fit: {{VALUE}};',
                ],
                'condition' => [
                    'bg_image[url]!' => '',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->addResponsiveControl(
            'image_position',
            [
                'label' => Translater::get()->l('Object Position'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'center center' => Translater::get()->l('Center Center'),
                    'center left' => Translater::get()->l('Center Left'),
                    'center right' => Translater::get()->l('Center Right'),
                    'top center' => Translater::get()->l('Top Center'),
                    'top left' => Translater::get()->l('Top Left'),
                    'top right' => Translater::get()->l('Top Right'),
                    'bottom center' => Translater::get()->l('Bottom Center'),
                    'bottom left' => Translater::get()->l('Bottom Left'),
                    'bottom right' => Translater::get()->l('Bottom Right'),
                ],
                'default' => 'center center',
                'description' => Translater::get()->l('Select which part of the image stays visible when it\'s cropped (cover)'),
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-bg-wrapper img.elementor-cta-bg' => 'object-position: {{VALUE}};',
                ],
                'condition' => [
                    'bg_image[url]!' => '',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->addResponsiveControl(
            'content_text_align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'eicon-text-align-left',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Center'),
                        'icon' => 'eicon-text-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'eicon-text-align-right',
                    ],
                ],
                'label_block' => false,
                'default' => 'left',
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'text-align: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );


        $this->addControl(
            'vertical_position',
            [
                'label' => Translater::get()->l('Vertical Position'),
                'type' => ControlManager::CHOOSE,
                'label_block' => false,
                'options' => [
                    'top' => ['title' => Translater::get()->l('Top'), 'icon' => 'eicon-v-align-top',],
                    'middle' => ['title' => Translater::get()->l('Middle'), 'icon' => 'eicon-v-align-middle',],
                    'bottom' => ['title' => Translater::get()->l('Bottom'), 'icon' => 'eicon-v-align-bottom',],
                ],
                'prefix_class' => 'elementor-cta-valign-',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->addResponsiveControl(
            'box_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em', '%', 'rem'],
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_box',
            ]
        );

        $this->endControlsSection();

        /**
         * TAB STYLE – Content
         */
        $this->startControlsSection(
            'section_style_content',
            [
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        // Description
        $this->addControl(
            'heading_heading_style',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::HEADING,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'heading_text!' => '',
                ],
            ]
        );


        $this->registerHeadingStyles('section_style_content', [], ['heading_color']);

        $this->addResponsiveControl(
            'heading_spacing',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SLIDER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-content-item:not(:last-child) .elementor-heading-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'heading_text!' => '',
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
            ]
        );

        // Description
        $this->addControl(
            'heading_description_style',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-cta-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->addResponsiveControl(
            'description_spacing',
            [
                'label' => Translater::get()->l('Spacing'),
                'type' => ControlManager::SLIDER,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-description:not(:last-child)' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'description_text!' => '',
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'heading_colors_style',
            [
                'label' => Translater::get()->l('Colors'),
                'type' => ControlManager::HEADING,
                'separator' => 'before',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->startControlsTabs('color_tabs', [
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);
        $this->startControlsTab('colors_normal', [
            'label' => Translater::get()->l('Normal'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->addControl(
            'heading_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->addControl(
            'description_color',
            [
                'label' => Translater::get()->l('Description color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-description' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->addControl(
            'box_background_color',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .elementor-cta-content' => 'background-color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->endControlsTab();
        $this->startControlsTab('colors_hover', [
            'label' => Translater::get()->l('Hover'),
            'tab' => self::TAB_STYLE,
            'section' => 'section_style_content',
        ]);


        $this->addControl(
            'title_color_hover',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-heading-title' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->addControl(
            'description_color_hover',
            [
                'label' => Translater::get()->l('Description color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta-description' => 'color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
                'condition' => [
                    'description_text!' => '',
                ],
            ]
        );

        $this->addControl(
            'box_background_color_hover',
            [
                'label' => Translater::get()->l('Background Color'),
                'type' => ControlManager::COLOR,
                'selectors' => [
                    '{{WRAPPER}}:hover .elementor-cta-content' => 'background-color: {{VALUE}};',
                ],
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );
        $this->endControlsTab();
        $this->endControlsTabs();

        $this->endControlsSection();

        /**
         * TAB STYLE – Button
         */
        $this->startControlsSection(
            'section_style_button',
            [
                'label' => Translater::get()->l('Button'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->registerButtonStyles('section_style_button');

        $this->endControlsSection();

        $this->startControlsSection(
            'section_style_hover_effects',
            [
                'label' => Translater::get()->l('Hover Effects'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'content_hover_heading',
            [
                'type' => ControlManager::HEADING,
                'label' => Translater::get()->l('Content'),
                'condition' => [
                    'skin' => 'cover',
                ],
            ]
        );

        $this->addControl(
            'content_animation',
            [
                'label' => Translater::get()->l('Hover Animation'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => 'None',
                    'enter-from-right' => 'Slide In Right',
                    'enter-from-left' => 'Slide In Left',
                    'enter-from-top' => 'Slide In Up',
                    'enter-from-bottom' => 'Slide In Down',
                    'enter-zoom-in' => 'Zoom In',
                    'enter-zoom-out' => 'Zoom Out',
                    'fade-in' => 'Fade In',
                    'grow' => 'Grow',
                    'shrink' => 'Shrink',
                    'move-right' => 'Move Right',
                    'move-left' => 'Move Left',
                    'move-up' => 'Move Up',
                    'move-down' => 'Move Down',
                    'exit-to-right' => 'Slide Out Right',
                    'exit-to-left' => 'Slide Out Left',
                    'exit-to-top' => 'Slide Out Up',
                    'exit-to-bottom' => 'Slide Out Down',
                    'exit-zoom-in' => 'Zoom In',
                    'exit-zoom-out' => 'Zoom Out',
                    'fade-out' => 'Fade Out',
                ],
                'default' => 'grow',
                'condition' => [
                    'skin' => 'cover',
                ],
            ]
        );

        /*
         * Add class 'elementor-animated-content' to widget when assigned content animation
         */
        $this->addControl(
            'animation_class',
            [
                'label' => Translater::get()->l('Animation'),
                'type' => ControlManager::HIDDEN,
                'default' => 'animated-content',
                'prefix_class' => 'elementor-',
                'condition' => [
                    'content_animation!' => '',
                ],
            ]
        );

        $this->addControl(
            'content_animation_duration',
            [
                'label' => Translater::get()->l('Animation Duration'),
                'type' => ControlManager::SLIDER,
                'render_type' => 'template',
                'default' => [
                    'size' => 1000,
                ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 3000,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-content-item' => 'transition-duration: {{SIZE}}ms',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(2)' => 'transition-delay: calc({{SIZE}}ms / 3)',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(3)' => 'transition-delay: calc(({{SIZE}}ms / 3) * 2)',
                    '{{WRAPPER}}.elementor-cta--sequenced-animation .elementor-content-item:nth-child(4)' => 'transition-delay: calc(({{SIZE}}ms / 3) * 3)',
                ],
                'condition' => [
                    'content_animation!' => '',
                    'skin' => 'cover',
                ],
            ]
        );

        $this->addControl(
            'sequenced_animation',
            [
                'label' => Translater::get()->l('Sequenced Animation'),
                'type' => ControlManager::SWITCHER,
                'label_on' => Translater::get()->l('On'),
                'label_off' => Translater::get()->l('Off'),
                'return_value' => 'elementor-cta--sequenced-animation',
                'prefix_class' => '',
                'condition' => [
                    'content_animation!' => '',
                    'skin' => 'cover',
                ],
                'separator' => 'after',
            ]
        );

        $this->addControl(
            'background_hover_heading',
            [
                'type' => ControlManager::HEADING,
                'label' => Translater::get()->l('Background')
            ]
        );

        $this->addControl(
            'transformation',
            [
                'label' => Translater::get()->l('Hover Animation'),
                'type' => ControlManager::SELECT,
                'options' => [
                    '' => 'None',
                    'zoom-in' => 'Zoom In',
                    'zoom-out' => 'Zoom Out',
                    'move-left' => 'Move Left',
                    'move-right' => 'Move Right',
                    'move-up' => 'Move Up',
                    'move-down' => 'Move Down',
                ],
                'default' => 'zoom-in',
                'prefix_class' => 'elementor-bg-transform elementor-bg-transform-',
            ]
        );

        $this->endControlsSection();
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        // $optionsSource is expected to be the widget settings (similar to get_settings_for_display())
        // Basic options
        $skin = !empty($optionsSource['skin']) ? $optionsSource['skin'] : 'classic';
        $layout = !empty($optionsSource['layout']) ? $optionsSource['layout'] : 'left';

        $hasLink = !empty($optionsSource['link']['url']) && $optionsSource['link']['url'] !== '#';
        $linkClick = !empty($optionsSource['link_click']) ? $optionsSource['link_click'] : 'button';

        $buttonText = !empty($optionsSource['button_text']) ? $optionsSource['button_text'] : '';
        $hasButton = $buttonText !== '';

        // Wrapper tag & attributes
        $wrapperTag = 'div';
        if ($hasLink) {
            if ('box' === $linkClick || !$hasButton) {
                $wrapperTag = 'a';
            }
        }

        // CSS classes
        $wrapperClass = sprintf(
            'elementor-cta elementor-cta-skin-%s elementor-cta-layout-%s',
            $skin,
            $layout
        );

        // Background image
        $hasBgImage = !empty($optionsSource['bg_image']['url']);
        $bgImageUrl = '';
        if ($hasBgImage) {
            $bgImageUrl = Helper::getImage($optionsSource['bg_image']['url']);
        }

        // Content fields
        $description = !empty($optionsSource['description_text']) ? $optionsSource['description_text'] : '';

        if ($hasLink && $hasButton && $linkClick === 'button') {
            $optionsSource['button_link'] = $optionsSource['link'];
        }

        $buttonOptions = $this->buildButtonOptions($optionsSource);
        $headingOptions = $this->buildHeadingOptions($optionsSource);

        return [

            // Wrapper
            'wrapper_tag' => $wrapperTag,
            'wrapper_class' => $wrapperClass,

            'link_click' => $linkClick,
            'has_link' => $hasLink,
            'link' => $optionsSource['link'] ?? [],

            // Background image
            'has_bg_image' => $hasBgImage,
            'bg_image_url' => $bgImageUrl,

            // Content
            'heading' => $headingOptions,
            'description_text' => $description,

            // Button
            'button' => $buttonOptions
        ];
    }
}