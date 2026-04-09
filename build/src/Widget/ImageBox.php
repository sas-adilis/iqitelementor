<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\Typography as GroupTypography;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageBox extends WidgetBase
{
    public function getId(): string
    {
        return 'image-box';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Image Box');
    }

    public function getIcon(): string
    {
        return 'image-box';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_image',
            [
                'label' => Translater::get()->l('Image Box'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'image',
            [
                'label' => Translater::get()->l('Choose Image'),
                'type' => ControlManager::MEDIA,
                'default' => [
                    'url' => Utils::getPlaceholderImageSrc(),
                ],
                'section' => 'section_image',
            ]
        );

        $this->addControl(
            'image_lazy',
            [
                'label' => Translater::get()->l('Lazy load'),
                'type' => ControlManager::SELECT,
                'default' => 'yes',
                'section' => 'section_image',
                'description' => Translater::get()->l('If your widget is above the fold lazy load should be disabled'),
                'options' => [
                    'no' => Translater::get()->l('No'),
                    'yes' => Translater::get()->l('Yes'),
                ],
            ]
        );

        $this->addControl(
            'caption',
            [
                'label' => Translater::get()->l('Alt text'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => Translater::get()->l('Enter your Alt about the image'),
                'title' => Translater::get()->l('Input image Alt here'),
                'section' => 'section_image',
            ]
        );

        $this->addControl(
            'title_text',
            [
                'label' => Translater::get()->l('Title & Description'),
                'type' => ControlManager::TEXT,
                'default' => Translater::get()->l('This is the heading'),
                'placeholder' => Translater::get()->l('Your Title'),
                'section' => 'section_image',
                'label_block' => true,
            ]
        );

        $this->addControl(
            'description_text',
            [
                'show_label' => false,
                'label' => Translater::get()->l('Content'),
                'type' => ControlManager::WYSIWYG,
                'default' => '<p>' . Translater::get()->l('I am text block. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.') . '</p>',
                'section' => 'section_image',
            ]
        );

        $this->addControl(
            'link',
            [
                'label' => Translater::get()->l('Link to'),
                'type' => ControlManager::URL,
                'placeholder' => Translater::get()->l('http://your-link.com'),
                'section' => 'section_image',
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'position',
            [
                'label' => Translater::get()->l('Image Position'),
                'type' => ControlManager::CHOOSE,
                'default' => 'top',
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'top' => [
                        'title' => Translater::get()->l('Top'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'prefix_class' => 'elementor-position-',
                'toggle' => false,
                'section' => 'section_image',
            ]
        );

        $this->addControl(
            'title_size',
            [
                'label' => Translater::get()->l('Title HTML Tag'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'h1' => Translater::get()->l('H1'),
                    'h2' => Translater::get()->l('H2'),
                    'h3' => Translater::get()->l('H3'),
                    'h4' => Translater::get()->l('H4'),
                    'h5' => Translater::get()->l('H5'),
                    'h6' => Translater::get()->l('H6'),
                    'div' => Translater::get()->l('div'),
                    'span' => Translater::get()->l('span'),
                    'p' => Translater::get()->l('p'),
                ],
                'default' => 'h3',
                'section' => 'section_image',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_content',
            ]
        );

        $this->addControl(
            'section_style_image',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Image'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'image_space',
            [
                'label' => Translater::get()->l('Image Spacing'),
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
                'section' => 'section_style_image',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}}.elementor-position-right .elementor-image-box-img' => 'margin-left: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-left .elementor-image-box-img' => 'margin-right: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}}.elementor-position-top .elementor-image-box-img' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'image_size',
            [
                'label' => Translater::get()->l('Image Size'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 30,
                    'unit' => '%',
                ],
                'size_units' => ['%'],
                'range' => [
                    '%' => [
                        'min' => 5,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_image',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-wrapper .elementor-image-box-img' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'image_opacity',
            [
                'label' => Translater::get()->l('Opacity (%)'),
                'type' => ControlManager::SLIDER,
                'default' => [
                    'size' => 1,
                ],
                'range' => [
                    'px' => [
                        'max' => 1,
                        'min' => 0.10,
                        'step' => 0.01,
                    ],
                ],
                'section' => 'section_style_image',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-wrapper .elementor-image-box-img img' => 'opacity: {{SIZE}};',
                ],
            ]
        );

        $this->addControl(
            'hover_animation',
            [
                'label' => Translater::get()->l('Animation'),
                'type' => ControlManager::HOVER_ANIMATION,
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_image',
            ]
        );

        $this->addControl(
            'section_style_content',
            [
                'type' => ControlManager::SECTION,
                'label' => Translater::get()->l('Content'),
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addResponsiveControl(
            'text_align',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => ControlManager::CHOOSE,
                'options' => [
                    'left' => [
                        'title' => Translater::get()->l('Left'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => Translater::get()->l('Center'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => Translater::get()->l('Right'),
                        'icon' => 'fa fa-align-right',
                    ],
                    'justify' => [
                        'title' => Translater::get()->l('Justified'),
                        'icon' => 'fa fa-align-justify',
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-wrapper' => 'text-align: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'content_vertical_alignment',
            [
                'label' => Translater::get()->l('Vertical Alignment'),
                'type' => ControlManager::SELECT,
                'options' => [
                    'top' => Translater::get()->l('Top'),
                    'middle' => Translater::get()->l('Middle'),
                    'bottom' => Translater::get()->l('Bottom'),
                ],
                'default' => 'top',
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'prefix_class' => 'elementor-vertical-align-',
            ]
        );

        $this->addControl(
            'heading_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addResponsiveControl(
            'title_bottom_space',
            [
                'label' => Translater::get()->l('Title Spacing'),
                'type' => ControlManager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-title' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'title_color',
            [
                'label' => Translater::get()->l('Title Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-content .elementor-image-box-title' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'title_typography',
                'selector' => '{{WRAPPER}} .elementor-image-box-content .elementor-image-box-title',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );

        $this->addControl(
            'heading_description',
            [
                'label' => Translater::get()->l('Description'),
                'type' => ControlManager::HEADING,
                'section' => 'section_style_content',
                'tab' => self::TAB_STYLE,
                'separator' => 'before',
            ]
        );

        $this->addControl(
            'description_color',
            [
                'label' => Translater::get()->l('Description Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-image-box-content .elementor-image-box-description' => 'color: {{VALUE}};',
                ],
                'section' => 'section_style_content',
            ]
        );

        $this->addGroupControl(
            GroupTypography::getType(),
            [
                'name' => 'description_typography',
                'selector' => '{{WRAPPER}} .elementor-image-box-content .elementor-image-box-description',
                'tab' => self::TAB_STYLE,
                'section' => 'section_style_content',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        $has_content = !empty($instance['title_text']) || !empty($instance['description_text']);

        $html = '<div class="elementor-image-box-wrapper">';

        if (!empty($instance['image']['url'])) {
            $this->addRenderAttribute('image', 'src', Helper::getImage($instance['image']['url']));
            $this->addRenderAttribute('image', 'alt', Helper::escAttr($instance['caption']));

            if ($instance['hover_animation']) {
                $this->addRenderAttribute('image', 'class', 'elementor-animation-' . $instance['hover_animation']);
            }

            $image_width = $instance['image']['width'] ? 'width="' . Helper::absint($instance['image']['width']) . '"' : '';
            $image_height = $instance['image']['height'] ? 'height="' . Helper::absint($instance['image']['height']) . '"' : '';

            if ('yes' === $instance['image_lazy']) {
                $lazyload_tag = 'loading="lazy" ';
            } else {
                $lazyload_tag = '';
            }

            $image_html = '<img ' . $lazyload_tag . ' ' . $image_width . ' ' . $image_height . ' ' . $this->getRenderAttributeString('image') . '>';

            if (!empty($instance['link']['url'])) {
                $target = '';
                if (!empty($instance['link']['is_external'])) {
                    $target = ' target="_blank" rel="noopener noreferrer"';
                }
                $image_html = sprintf('<a href="%s"%s>%s</a>', $instance['link']['url'], $target, $image_html);
            }

            $html .= '<figure class="elementor-image-box-img">' . $image_html . '</figure>';
        }

        if ($has_content) {
            $html .= '<div class="elementor-image-box-content">';

            if (!empty($instance['title_text'])) {
                $title_html = $instance['title_text'];

                if (!empty($instance['link']['url'])) {
                    $target = '';

                    if (!empty($instance['link']['is_external'])) {
                        $target = ' target="_blank" rel="noopener noreferrer"';
                    }

                    $title_html = sprintf('<a href="%s"%s>%s</a>', $instance['link']['url'], $target, $title_html);
                }

                $html .= sprintf('<%1$s class="elementor-image-box-title">%2$s</%1$s>', $instance['title_size'], $title_html);
            }

            if (!empty($instance['description_text'])) {
                $html .= sprintf('<div class="elementor-image-box-description">%s</div>', $instance['description_text']);
            }

            $html .= '</div>';
        }

        $html .= '</div>';

        echo $html;
    }

    protected function contentTemplate(): void
    {
        ?>
        <#
        var html = '
        <div class="elementor-image-box-wrapper">';

            if ( settings.image.url ) {
            var imageHtml = '<img src="' + settings.image.url + '" loading="lazy" alt="' + settings.caption + '" class="elementor-animation-' + settings.hover_animation + '"/>';

            if ( settings.link.url ) {
            imageHtml = '<a href="' + settings.link.url + '">' + imageHtml + '</a>';
            }

            html += '
            <figure class="elementor-image-box-img">' + imageHtml + '</figure>
            ';
            }

            var hasContent = !! ( settings.title_text || settings.description_text );

            if ( hasContent ) {
            html += '
            <div class="elementor-image-box-content">';

                if ( settings.title_text ) {
                var title_html = settings.title_text;

                if ( settings.link.url ) {
                title_html = '<a href="' + settings.link.url + '">' + title_html + '</a>';
                }

                html += '<' + settings.title_size + ' class="elementor-image-box-title">' + title_html + '
            </
            ' + settings.title_size + '>';
            }

            if ( settings.description_text ) {
            html += '
            <div class="elementor-image-box-description">' + settings.description_text + '</div>
            ';
            }

            html += '
        </div>';
        }

        html += '</div>';

        print( html );
        #>
        <?php
    }
}
