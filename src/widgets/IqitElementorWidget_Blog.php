<?php
/**
 * 2007-2015 PrestaShop
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2015 PrestaShop SA
 * @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Class ElementorWidget_Blog
 */
class IqitElementorWidget_Blog
{
    /**
     * @var int
     */
    public $id_base;

    /**
     * @var string widget name
     */
    public $name;
    /**
     * @var string widget icon
     */
    public $icon;
    public $context;

    protected $spacer_size = '2';

    public $status = 1;

    public $editMode = false;

    public function __construct()
    {
        if (!Module::isEnabled('ph_simpleblog')) {
            $this->status = 0;

            return;
        }

        $this->name = IqitElementorWpHelper::__('Blog posts', 'elementor');
        $this->id_base = 'Blog';
        $this->icon = 'post-list';
        $this->context = Context::getContext();

        if (isset($this->context->controller->controller_name) && $this->context->controller->controller_name == 'IqitElementorEditor') {
            $this->editMode = true;
        }
    }

    public function getForm()
    {
        $slidesToShow = range(1, 12);
        $slidesToShow = array_combine($slidesToShow, $slidesToShow);

        $slidesToShowG = [
            12 => 1,
            6 => 2,
            4 => 3,
            3 => 4,
            2 => 6,
            1 => 12,
        ];

        $postsSourceOptions['ms'] = IqitElementorWpHelper::__('Manual selection', 'elementor');
        $postsSourceOptions['lp'] = IqitElementorWpHelper::__('Latest posts', 'elementor');
        $postsSourceOptions['fp'] = IqitElementorWpHelper::__('Featured posts', 'elementor');

        $available_categories = SimpleBlogCategory::getCategories($this->context->language->id, true, false);
        $available_categories_list = [];

        foreach ($available_categories as $key => &$category) {
            if (!$category['is_child']) {
                $category['name'] = 'Category: ' . $category['name'];
                $available_categories_list[] = $category;
                if (isset($category['childrens']) && $category['childrens']) {
                    foreach ($category['childrens'] as $subcat) {
                        $subcatArr = [
                            'name' => '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Category: ' . $subcat['name'],
                            'id' => $subcat['id_simpleblog_category'],
                            'is_child' => 0,
                        ];
                        $available_categories_list[] = $subcatArr;
                    }
                }
            }
        }

        foreach ($available_categories_list as $category) {
            $postsSourceOptions['cat_' . $category['id']] = $category['name'];
        }

        return [
            'section_pswidget_options' => [
                'label' => IqitElementorWpHelper::__('Widget settings', 'elementor'),
                'type' => 'section',
            ],
            'posts_source' => [
                'label' => IqitElementorWpHelper::__('Posts source', 'elementor'),
                'type' => 'select',
                'default' => 'lp',
                'label_block' => true,
                'section' => 'section_pswidget_options',
                'options' => $postsSourceOptions,
            ],
            'posts_ids' => [
                'label' => IqitElementorWpHelper::__('Search for posts', 'elementor'),
                'placeholder' => IqitElementorWpHelper::__('Post title', 'elementor'),
                'type' => 'autocomplete_posts',
                'label_block' => true,
                'condition' => [
                    'posts_source' => ['ms'],
                ],
                'section' => 'section_pswidget_options',
            ],
            'posts_limit' => [
                'label' => IqitElementorWpHelper::__('Limit', 'elementor'),
                'type' => 'number',
                'default' => '10',
                'min' => '1',
                'section' => 'section_pswidget_options',
            ],
            'view' => [
                'label' => IqitElementorWpHelper::__('View', 'elementor'),
                'type' => 'select',
                'default' => 'grid',
                'condition' => [
                    'view!' => 'default',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'carousel' => IqitElementorWpHelper::__('Carousel', 'elementor'),
                    'grid' => IqitElementorWpHelper::__('Grid', 'elementor'),
                ],
            ],
            'slides_to_show' => [
                'responsive' => true,
                'label' => IqitElementorWpHelper::__('Show per line', 'elementor'),
                'type' => 'select',
                'default' => '6',
                'label_block' => true,
                'section' => 'section_pswidget_options',
                'options' => $slidesToShow,
                'condition' => [
                    'view' => 'carousel',
                ],
            ],
            'slides_to_show_g' => [
                'responsive' => true,
                'label' => IqitElementorWpHelper::__('Show per line', 'elementor'),
                'type' => 'select',
                'default' => '3',
                'label_block' => true,
                'section' => 'section_pswidget_options',
                'options' => $slidesToShowG,
                'condition' => [
                    'view' => 'grid',
                ],
            ],
            'navigation' => [
                'label' => IqitElementorWpHelper::__('Navigation', 'elementor'),
                'type' => 'select',
                'default' => 'both',
                'condition' => [
                    'view' => 'carousel',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'both' => IqitElementorWpHelper::__('Arrows and Dots', 'elementor'),
                    'arrows' => IqitElementorWpHelper::__('Arrows', 'elementor'),
                    'dots' => IqitElementorWpHelper::__('Dots', 'elementor'),
                    'none' => IqitElementorWpHelper::__('None', 'elementor'),
                ],
            ],
            'autoplay' => [
                'label' => IqitElementorWpHelper::__('Autoplay', 'elementor'),
                'type' => 'select',
                'default' => 'no',
                'condition' => [
                    'view' => 'carousel',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'yes' => IqitElementorWpHelper::__('Yes', 'elementor'),
                    'no' => IqitElementorWpHelper::__('No', 'elementor'),
                ],
            ],
            'autoplay_speed' => [
                'label' => IqitElementorWpHelper::__('Autoplay Speed', 'elementor'),
                'type' => 'number',
                'default' => 5000,
                'section' => 'section_pswidget_options',
                'condition' => [
                    'view' => 'carousel',
                    'autoplay' => 'yes',
                ],
            ],
            'pause_on_hover' => [
                'label' => IqitElementorWpHelper::__('Pause on Hover', 'elementor'),
                'type' => 'select',
                'default' => 'yes',
                'condition' => [
                    'view' => 'carousel',
                    'autoplay' => 'yes',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'yes' => IqitElementorWpHelper::__('Yes', 'elementor'),
                    'no' => IqitElementorWpHelper::__('No', 'elementor'),
                ],
            ],
            'section_style_navigation' => [
                'label' => IqitElementorWpHelper::__('Navigation', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'arrows_color' => [
                'label' => IqitElementorWpHelper::__('Arrows Color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'color: {{VALUE}};',
                ],
            ],
            'arrows_bg_color' => [
                'label' => IqitElementorWpHelper::__('Arrows background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .elementor-swiper-button' => 'background: {{VALUE}};',
                ],
            ],
            'dots_color' => [
                'label' => IqitElementorWpHelper::__('Dots color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'condition' => [
                    'navigation' => ['dots', 'both'],
                ],
                'selectors' => [
                    '{{WRAPPER}} .swiper-pagination-bullet' => 'background: {{VALUE}};',
                ],
            ],
            'section_style_post' => [
                'label' => IqitElementorWpHelper::__('Post', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'post_margin' => [
                'label' => IqitElementorWpHelper::__('Box spacing', 'elementor'),
                'type' => 'slider',
                'tab' => 'style',
                'section' => 'section_style_post',
                'default' => [
                    'size' => 1,
                    'unit' => 'rem',
                ],
                'range' => [
                    'rem' => [
                        'min' => 0,
                        'max' => 4,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .simpleblog-posts-column' => 'padding:  {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .simpleblog-posts' => 'margin: 0 -{{SIZE}}{{UNIT}};',
                ],
            ],
            'post_padding' => [
                'label' => IqitElementorWpHelper::__('Box padding', 'elementor'),
                'type' => 'slider',
                'tab' => 'style',
                'section' => 'section_style_post',
                'default' => [
                    'size' => 0,
                    'unit' => 'rem',
                ],
                'range' => [
                    'rem' => [
                        'min' => 0,
                        'max' => 4,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .post-item' => 'padding: {{SIZE}}{{UNIT}};',
                ],
            ],
            'post_bg_color' => [
                'label' => IqitElementorWpHelper::__('Background color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post',
                'selectors' => [
                    '{{WRAPPER}} .post-item' => 'background: {{VALUE}};',
                ],
            ],
            'post_title_color' => [
                'label' => IqitElementorWpHelper::__('Title color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post',
                'selectors' => [
                    '{{WRAPPER}} .post-title a' => 'color: {{VALUE}};',
                ],
            ],
            'post_text_color' => [
                'label' => IqitElementorWpHelper::__('Text color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post',
                'selectors' => [
                    '{{WRAPPER}} .post-item' => 'color: {{VALUE}};',
                ],
            ],
            'border' => [
                'group_type_control' => 'border',
                'name' => 'post_border',
                'label' => IqitElementorWpHelper::__('Border', 'elementor'),
                'tab' => 'style',
                'placeholder' => '1px',
                'default' => '1px',
                'section' => 'section_style_post',
                'selector' => '{{WRAPPER}} .post-item',
            ],
            'box-shadow' => [
                'group_type_control' => 'box-shadow',
                'name' => 'post_box_shadow',
                'label' => IqitElementorWpHelper::__('Box shadow', 'elementor'),
                'tab' => 'style',
                'placeholder' => '1px',
                'default' => '1px',
                'section' => 'section_style_post',
                'selector' => '{{WRAPPER}} .post-item',
            ],
            'section_style_post_h' => [
                'label' => IqitElementorWpHelper::__('Post - hover', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'post_bg_color_h' => [
                'label' => IqitElementorWpHelper::__('Product box bg color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post_h',
                'selectors' => [
                    '{{WRAPPER}} .post-item:hover' => 'background: {{VALUE}};',
                ],
            ],
            'post_title_color_h' => [
                'label' => IqitElementorWpHelper::__('Title color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post_h',
                'selectors' => [
                    '{{WRAPPER}} .post-item:hover .post-title a' => 'color: {{VALUE}};',
                ],
            ],
            'post_text_color_h' => [
                'label' => IqitElementorWpHelper::__('Text color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post_h',
                'selectors' => [
                    '{{WRAPPER}} .post-item:hover' => 'color: {{VALUE}};',
                ],
            ],
            'border_h' => [
                'label' => IqitElementorWpHelper::__('Border color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_post_h',
                'selectors' => [
                    '{{WRAPPER}} .post-item:hover' => 'border-color: {{VALUE}};',
                ],
            ],
            'box-shadow_h' => [
                'group_type_control' => 'box-shadow',
                'name' => 'product_box_shadow_h',
                'label' => IqitElementorWpHelper::__('Box shadow', 'elementor'),
                'tab' => 'style',
                'placeholder' => '1px',
                'default' => '1px',
                'section' => 'section_style_post_h',
                'selector' => '{{WRAPPER}} .post-item:hover',
            ],
        ];
    }

    public function parse_options($optionsSource, $preview = false)
    {
        $options = [];
        $classes = [''];

        $source = $optionsSource['posts_source'];

        if ($source == 'lp') {
            $posts = $this->preparePosts((int) $optionsSource['posts_limit']);
        } elseif ($source == 'fp') {
            $posts = $this->preparePosts((int) $optionsSource['posts_limit'], null, true);
        } elseif ($source == 'ms') {
            $posts = $this->preparePosts((int) $optionsSource['posts_limit'], null, false, true, $optionsSource['posts_ids']);
        } else {
            $source = str_replace('cat_', '', $source);

            $posts = $this->preparePosts((int) $optionsSource['posts_limit'], $source);
        }

        if ($optionsSource['view'] == 'carousel') {
            $show_dots = in_array($optionsSource['navigation'], ['dots', 'both']);
            $show_arrows = in_array($optionsSource['navigation'], ['arrows', 'both']);

            $classes[] = 'swiper-cls-fix';
            $classes[] = 'desktop-swiper-cls-fix-' . IqitElementorWpHelper::absint($optionsSource['slides_to_show']);
            $classes[] = 'tablet-swiper-cls-fix-' . IqitElementorWpHelper::absint($optionsSource['slides_to_show_tablet']);
            $classes[] = 'mobile-swiper-cls-fix-' . IqitElementorWpHelper::absint($optionsSource['slides_to_show_mobile']);

            $options = [
                'slidesToShow' => IqitElementorWpHelper::absint($optionsSource['slides_to_show']),
                'slidesToShowTablet' => IqitElementorWpHelper::absint($optionsSource['slides_to_show_tablet']),
                'slidesToShowMobile' => IqitElementorWpHelper::absint($optionsSource['slides_to_show_mobile']),
                'autoplaySpeed' => IqitElementorWpHelper::absint($optionsSource['autoplay_speed']),
                'autoplay' => ('yes' === $optionsSource['autoplay']),
                'disableOnInteraction' => ('yes' === $optionsSource['pause_on_hover']),
                'arrows' => $show_arrows,
                'dots' => $show_dots,
            ];
        } elseif ($optionsSource['view'] == 'grid') {
            $classes[] = 'posts-grid';
            $options = [
                'gridClasses' => 'col-' . $optionsSource['slides_to_show_g_mobile'] . ' col-md-' . $optionsSource['slides_to_show_g_tablet'] . ' col-lg-' . $optionsSource['slides_to_show_g'],
            ];
        }

        return [
            'blogLayout' => 'elementor',
            'columns' => 2,
            'is_category' => false,
            'isWarehouse' => true,
            'posts' => $posts,
            'view' => $optionsSource['view'],
            'options' => $options,
            'classes' => implode(' ', $classes),
            'PH_BLOG_DISPLAY_DATE' => Configuration::get('PH_BLOG_DISPLAY_DATE'),
            'PH_BLOG_DATEFORMAT' => Configuration::get('PH_BLOG_DATEFORMAT'),
            'PH_BLOG_DISPLAY_MORE' => Configuration::get('PH_BLOG_DISPLAY_MORE'),
            'PH_BLOG_DISPLAY_CATEGORY' => Configuration::get('PH_BLOG_DISPLAY_CATEGORY'),
            'PH_BLOG_DISPLAY_THUMBNAIL' => Configuration::get('PH_BLOG_DISPLAY_THUMBNAIL'),
            'PH_BLOG_DISPLAY_DESCRIPTION' => Configuration::get('PH_BLOG_DISPLAY_DESCRIPTION'),
        ];
    }

    public function preparePosts($nb = 10, $cat = null, $featured = false, $selected = false, $ids = [])
    {
        if (!Module::isEnabled('ph_simpleblog')) {
            return false;
        }

        $id_lang = (int) $this->context->language->id;

        if ($selected) {
            $posts = SimpleBlogPost::getPosts($id_lang, 30, null, null, true, 'IN-LIST', false, null, false, false, null, 'IN', $ids);
        } else {
            $posts = SimpleBlogPost::getPosts($id_lang, $nb, $cat, null, true, 'sbp.date_add', 'DESC', null, $featured);
        }

        return $posts;
    }
}
