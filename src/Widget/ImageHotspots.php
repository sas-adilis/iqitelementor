<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\LinkAttributesHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Utils;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ImageHotspots extends WidgetBase
{
    public function getId(): string
    {
        return 'image-hotspots';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Image hotspots');
    }

    public function getIcon(): string
    {
        return 'bullet-list';
    }

    protected function registerControls(): void
    {
        $this->addControl(
            'section_image',
            [
                'label' => Translater::get()->l('Image'),
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
            'section_icon',
            [
                'label' => Translater::get()->l('Hotspots'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'icon_list',
            [
                'label' => '',
                'type' => ControlManager::REPEATER,
                'default' => [
                    [
                        'text' => Translater::get()->l('List Item #1'),
                        'icon' => 'fa fa-check',
                        'type' => 'product',
                        'left' => 10,
                        'top' => 10,
                    ],
                ],
                'section' => 'section_icon',
                'fields' => [
                    [
                        'name' => 'top',
                        'label' => Translater::get()->l('Position top'),
                        'type' => ControlManager::NUMBER,
                        'min' => 0,
                        'step' => 0.25,
                        'default' => 10,
                        'max' => 100,
                        'selectors' => [
                            '{{WRAPPER}} {{CURRENT_ITEM}} .elementor-hotspot' => 'top: {{VALUE}}%;',
                        ],
                    ],
                    [
                        'name' => 'left',
                        'label' => Translater::get()->l('Position Left'),
                        'type' => ControlManager::NUMBER,
                        'min' => 0,
                        'step' => 0.25,
                        'default' => 10,
                        'max' => 100,
                        'selectors' => [
                            '{{WRAPPER}} {{CURRENT_ITEM}} .elementor-hotspot' => 'left: {{VALUE}}%;',
                        ],
                    ],
                    [
                        'name' => 'type',
                        'label' => Translater::get()->l('Type'),
                        'type' => ControlManager::SELECT,
                        'default' => 'custom',
                        'options' => [
                            'custom' => Translater::get()->l('Custom text'),
                            'product' => Translater::get()->l('Product'),
                        ],
                    ],
                    [
                        'name' => 'text',
                        'label' => Translater::get()->l('Title'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('Hotspot'),
                        'default' => Translater::get()->l('Hotspot'),
                    ],
                    [
                        'name' => 'icon',
                        'label' => Translater::get()->l('Icon'),
                        'type' => ControlManager::ICON,
                        'label_block' => true,
                        'default' => 'fa fa-check',
                    ],
                    [
                        'name' => 'text_content',
                        'label' => Translater::get()->l('Text'),
                        'type' => ControlManager::TEXT,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('Lorem ipsum dolor sit amet'),
                        'default' => Translater::get()->l('Lorem ipsum dolor sit amet'),
                        'condition' => [
                            'type' => 'custom',
                        ],
                    ],
                    ['name' => 'products_ids',
                        'label' => Translater::get()->l('Search for product'),
                        'placeholder' => Translater::get()->l('Product name, id, ref'),
                        'single' => true,
                        'type' => 'autocomplete_products',
                        'label_block' => true,
                        'condition' => [
                            'type' => 'product',
                        ],
                    ],
                    [
                        'name' => 'link',
                        'label' => Translater::get()->l('Link'),
                        'type' => ControlManager::URL,
                        'label_block' => true,
                        'placeholder' => Translater::get()->l('http://your-link.com'),
                        'condition' => [
                            'type' => 'custom',
                        ],
                    ],
                    [
                        'name' => 'target',
                        'label' => Translater::get()->l('New window'),
                        'type' => ControlManager::SELECT,
                        'default' => '_blank',
                        'condition' => [
                            'type' => 'product',
                        ],
                        'options' => [
                            '_blank' => Translater::get()->l('Yes'),
                            '' => Translater::get()->l('No'),
                        ],
                    ],
                ],
                'title_field' => 'text',
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => ControlManager::HIDDEN,
                'default' => 'traditional',
                'section' => 'section_icon',
            ]
        );

        $this->addControl(
            'section_icon_style',
            [
                'label' => Translater::get()->l('Hotspot'),
                'type' => ControlManager::SECTION,
                'tab' => self::TAB_STYLE,
            ]
        );

        $this->addControl(
            'icon_size',
            [
                'label' => Translater::get()->l('Font Size'),
                'type' => ControlManager::SLIDER,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => [
                    'size' => 14,
                ],
                'range' => [
                    'px' => [
                        'min' => 6,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-hotspot' => 'font-size: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'icon_color',
            [
                'label' => Translater::get()->l('Color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-hotspot, {{WRAPPER}} .elementor-hotspot a' => 'color: {{VALUE}};',
                ],
            ]
        );
        $this->addControl(
            'icon_background',
            [
                'label' => Translater::get()->l('Background'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .elementor-hotspot' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'tooltip_content_color',
            [
                'label' => Translater::get()->l('Tooltip color'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .tooltip-inner' => 'color: {{VALUE}};',
                ],
            ]
        );
        $this->addControl(
            'tooltip_content_background',
            [
                'label' => Translater::get()->l('Tooltip background'),
                'type' => ControlManager::COLOR,
                'tab' => self::TAB_STYLE,
                'section' => 'section_icon_style',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .tooltip-inner' => 'background: {{VALUE}};',
                ],
            ]
        );

        $this->addGroupControl(
            BoxShadow::getType(),
            [
                'name' => 'tooltip_box_shadow',
                'section' => 'section_icon_style',
                'tab' => self::TAB_STYLE,
                'selector' => '{{WRAPPER}} .tooltip-inner',
            ]
        );
    }

    protected function render(array $instance = []): void
    {
        if (empty($instance['image']['url'])) {
            return;
        } ?>


		 <div  class="elementor-image-hotspots-wrapper">
		 <?php

        $has_caption = !empty($instance['caption']);
        $image_html = '<div class="elementor-hotspot-image' . (!empty($instance['shape']) ? ' elementor-image-shape-' . $instance['shape'] : '') . '">';
        $image_class_html = !empty($instance['hover_animation']) ? ' class="elementor-animation-' . $instance['hover_animation'] . '"' : '';
        $image_width = $instance['image']['width'] ? 'width="' . Helper::absint($instance['image']['width']) . '"' : '';
        $image_height = $instance['image']['height'] ? 'height="' . Helper::absint($instance['image']['height']) . '"' : '';

        if ('yes' === $instance['image_lazy']) {
            $lazyload_tag = 'loading="lazy" ';
        } else {
            $lazyload_tag = '';
        }

        $image_html .= sprintf('<img %s src="%s" %s %s alt="%s"%s />', $lazyload_tag, Helper::escAttr(Helper::getImage($instance['image']['url'])), $image_width, $image_height, Helper::escAttr($instance['caption']), $image_class_html);
        $image_html .= '</div>';
        echo $image_html;
        ?>
			 <div class="elementor-image-hotspots">
				 <?php foreach ($instance['icon_list'] as $item) { ?>

					 <?php
                    $tooltip = '';
				     $tooltipText = '';
				     $tooltipLink = $item['link']['url'];
				     $tooltipLinkTarget = '';

				     if ($item['type'] == 'custom') {
				         $tooltipText = htmlspecialchars($item['text_content']);
				         $tooltipLink = $item['link']['url'];
				         $tooltipLinkTarget = LinkAttributesHelper::getAttributesHtml($item['link']);
				     } else {
				         $product = Helper::getProduct($item['products_ids']);
				         if (!empty($product['name'])) {
				             $tooltipText = "<div class='row align-items-center list-small-gutters'>
								<div class='thumbnail-container col-4'><img src='" . $product['cover']['url'] . "' class='img-fluid' width='" . $product['cover']['width'] . "' height='" . $product['cover']['height'] . "'></div>
								<div class='product-description col'>
									<div class='product-title'>" . htmlspecialchars($product['name']) . "</div>
    								 <span class='product-price-hotspot'>" . $product['price'] . '</span>
							 	</div>
							 </div>';
				             $tooltipLink = $product['url'];
				         }
				         $tooltipLinkTarget = $item['target'] ? ' target="_blank" rel="noopener noreferrer"' : '';
				     }
				     if (isset($instance['id_widget_instance'])) {
				         if (!empty($tooltipText)) {
				             $tpl = "<div class='elementor-element elementor-element-" . $instance['id_widget_instance'] . " tooltip' role='tooltip'><div class='tooltip-inner tooltip-inner-hotspot'></div></div>";
				             $tooltip = 'data-toggle="tooltip" data-html="true" data-template="' . $tpl . '" title="' . $tooltipText . '"';
				         }
				     }
				     ?>

					 <div class="elementor-hotspot" style="top: <?php echo $item['top']; ?>%; left: <?php echo $item['left']; ?>%;"  <?php echo $tooltip; ?>>
						 <?php
				         if (!empty($tooltipLink)) {
				             echo '<a href="' . $tooltipLink . '"  ' . $tooltipLinkTarget . '>';
				         }

				     if ($item['icon']) { ?>
							 <span class="elementor-hotspot-icon">
							<?php echo IconHelper::renderIcon($item['icon']); ?>
						</span>
						 <?php } ?>
						 <span class="elementor-hotspot-text"><?php echo $item['text']; ?></span>
						 <?php
				     if (!empty($tooltipLink)) {
				         echo '</a>';
				     }
				     ?>
					 </div>
					 <?php
				 } ?>
			 </div>
		 </div>
		 <?php

    }

    protected function contentTemplate(): void
    {
        ?>
        <# if ( '' !== settings.image.url ) { #>
			<div class="elementor-image-hotspots-wrapper">
            <div class="elementor-hotspot-image{{ settings.shape ? ' elementor-image-shape-' + settings.shape : '' }}">
                <#
                var imgClass = '', image_html = '',
                    hasCaption = '' !== settings.caption,
                    image_html = '';

                if ( '' !== settings.hover_animation ) {
                    imgClass = 'elementor-animation-' + settings.hover_animation;
                }

                image_html = '<img src="' + settings.image.url + '" class="' + imgClass + '" alt="' + settings.caption + '" />';

                print( image_html );
                #>
            </div>
				<div class="elementor-image-hotspots">
					<#
						if ( settings.icon_list ) {
						_.each( settings.icon_list, function( item ) { #>
						<div class="elementor-hotspot" style="top: {{ item.top }}%; left: {{ item.left }}%;" >
							<# if ( item.link && item.link.url ) { #>
								<a href="{{ item.link.url }}">
									<# } #>
						<span class="elementor-hotspot-icon">
							{{{ elementorRenderIcon(item.icon) }}}
						</span>
										<span class="elementor-hotspot-text">{{{ item.text }}}</span>
										<# if ( item.link && item.link.url ) { #>
								</a>
								<# } #>
						</div>
						<#
							} );
							} #>
				</div>
			</div>
        <# } #>


        <?php
    }
}
