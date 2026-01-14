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
 * Class ElementorWidget_Links
 */
class IqitElementorWidget_Links
{
    /**
     * @var int
     */
    public $id_base;

    private $db;
    private $shop;
    private $db_prefix;
    public $context;
    private $link;
    private $language;
    protected $pattern = '/^([A-Z_]*_)[a-zA-Z0-9-]+/';

    /**
     * @var string widget name
     */
    public $name;
    /**
     * @var string widget icon
     */
    public $icon;

    public $status = 1;
    public $editMode = false;

    public function __construct()
    {
        $this->name = IqitElementorWpHelper::__('Links list', 'elementor');
        $this->id_base = 'Links';
        $this->icon = 'bullet-list';

        $this->context = Context::getContext();

        $this->db = Db::getInstance();
        $this->shop = $this->context->shop;
        $this->db_prefix = $this->db->getPrefix();
        $this->link = new Link();
        $this->language = $this->context->language;

        if (isset($this->context->controller->controller_name) && $this->context->controller->controller_name == 'IqitElementorEditor') {
            $this->editMode = true;
        }
    }

    public function getForm()
    {
        $selectOptions = [];

        if ($this->editMode) {
            $category_tree = $this->getCategories();
            $cms_tree = $this->getCmsPages();
            $static_pages = $this->getStaticPages();

            $selectOptions['select_categories'] = ['name' => '--------- ' . IqitElementorWpHelper::__('Categories', 'elementor') . ' ---------', 'selectable' => false];
            $selectOptions = array_merge($selectOptions, $this->buildSelectTreeCategories($category_tree));

            $selectOptions['select_brands'] = ['name' => '--------- ' . IqitElementorWpHelper::__('CMS pages', 'elementor') . ' ---------', 'selectable' => false];
            $selectOptions = array_merge($selectOptions, $this->buildSelectTreeCms($cms_tree));

            $selectOptions['select_static'] = ['name' => '--------- ' . IqitElementorWpHelper::__('Static pages', 'elementor') . ' ---------', 'selectable' => false];
            $selectOptions = array_merge($selectOptions, $this->buildSelectTreeStatic($static_pages));
        }

        return [
            'section_pswidget_options' => [
                'label' => IqitElementorWpHelper::__('Widget settings', 'elementor'),
                'type' => 'section',
            ],
            'title' => [
                'label' => IqitElementorWpHelper::__('Title', 'elementor'),
                'type' => 'text',
                'default' => 'Title',
                'section' => 'section_pswidget_options',
            ],
            'link' => [
                'label' => IqitElementorWpHelper::__('Title link', 'elementor'),
                'type' => 'url',
                'label_block' => true,
                'section' => 'section_pswidget_options',
                'placeholder' => IqitElementorWpHelper::__('http://your-link.com', 'elementor'),
            ],
            'link_list' => [
                'label' => IqitElementorWpHelper::__('Select links', 'elementor'),
                'type' => 'select_sort',
                'default' => '0',
                'label_block' => true,
                'multiple' => true,
                'remove' => false,
                'section' => 'section_pswidget_options',
                'options' => $selectOptions,
            ],
            'section_style_title' => [
                'label' => IqitElementorWpHelper::__('Title', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'title_style' => [
                'section' => 'section_style_title',
                'label' => IqitElementorWpHelper::__('Inherit from global', 'elementor'),
                'type' => 'select',
                'options' => [
                    'none' => IqitElementorWpHelper::__('None', 'elementor'),
                    'block-title' => IqitElementorWpHelper::__('Block title', 'elementor'),
                ],
                'default' => 'none',
                'tab' => 'style',
            ],
            'title_color' => [
                'label' => IqitElementorWpHelper::__('Title Color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_title',
                'selectors' => [
                    '{{WRAPPER}} .elementor-block-title' => 'color: {{VALUE}};',
                ],
            ],
            'title_typo' => [
                'group_type_control' => 'typography',
                'name' => 'typography_label',
                'tab' => 'style',
                'section' => 'section_style_title',
                'selector' => '{{WRAPPER}} .elementor-block-title',
            ],
            'section_style_navigation' => [
                'label' => IqitElementorWpHelper::__('Text', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'text_color' => [
                'label' => IqitElementorWpHelper::__('Text Color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .block-content, {{WRAPPER}} .block-content a, {{WRAPPER}} .block-content a:link' => 'color: {{VALUE}} !important;',
                ],
            ],
            'text_hover_color' => [
                'label' => IqitElementorWpHelper::__('Text hover', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'selectors' => [
                    '{{WRAPPER}} .block-content a:hover' => 'color: {{VALUE}} !important;',
                ],
            ],
            'text_typo' => [
                'group_type_control' => 'typography',
                'name' => 'typography_text',
                'tab' => 'style',
                'section' => 'section_style_navigation',
                'selector' => '{{WRAPPER}} .block-content',
            ],
        ];
    }

    public function parse_options($optionsSource, $preview = false)
    {
        $selectedLinks = $optionsSource['link_list'];
        $widgetOptions = [];
        $widgetOptions['links'] = [];
        $widgetOptions['title'] = $optionsSource['title'];
        $widgetOptions['link'] = $optionsSource['link'];
        $widgetOptions['title_style'] = $optionsSource['title_style'];

        if (is_array($selectedLinks)) {
            foreach ($selectedLinks as $link) {
                preg_match($this->pattern, $link, $values);
                $id = substr($link, strlen($values[1]), strlen($link));

                switch (substr($link, 0, strlen($values[1]))) {
                    case 'CAT_':
                        $widgetOptions['links'][] = $this->makeCategoryLink((int) $id);
                        break;
                    case 'CMS_':
                        $widgetOptions['links'][] = $this->makeCmsPageLink((int) $id);
                        break;
                    case 'CMC_':
                        $widgetOptions['links'][] = $this->makeCmsCategoryLink((int) $id);
                        break;
                    case 'STA_':
                        $widgetOptions['links'][] = $this->makeStaticLink($id);
                        break;
                }
            }
        }

        return $widgetOptions;
    }

    public function buildSelectTreeStatic($optionsSource)
    {
        $array = [];

        foreach ($optionsSource as $static) {
            foreach ($static['pages'] as $option) {
                $array['STA_' . $option['id_cms']] = ['name' => $option['title'], 'selectable' => true];
            }
        }

        return $array;
    }

    public function buildSelectTreeCategories($optionsSource, $depth = 0, $prefix = '')
    {
        $array = [];
        $spacer = '';
        $depthSpacer = (int) $depth - 2;

        if ($depthSpacer > 0) {
            $spacer = str_repeat('&nbsp;', 2 * $depthSpacer);
        }

        foreach ($optionsSource as $option) {
            if ($option['level_depth'] > 1) {
                $array['CAT_' . $option['id_category']] = ['name' => $spacer . $option['name'], 'selectable' => true];
            }

            if (isset($option['children'])) {
                $array = array_merge($array, $this->buildSelectTreeCategories($option['children'], $depth + 1));
            }
        }

        return $array;
    }

    public function buildSelectTreeCms($optionsSource, $depth = 0, $prefix = '')
    {
        $array = [];

        $spacer = str_repeat('&nbsp;', 2 * $depth);

        foreach ($optionsSource as $option) {
            $array['CMC_' . $option['id_cms_category']] = ['name' => $spacer . $option['name'], 'selectable' => true];
            ++$depth;
            $spacer = str_repeat('&nbsp;', 2 * $depth);

            foreach ($option['pages'] as $page) {
                $array['CMS_' . $page['id_cms']] = ['name' => $spacer . $page['title'], 'selectable' => true];
            }

            if (isset($option['children'])) {
                $array = array_merge($array, $this->buildSelectTreeCategories($option['children'], $depth));
            }
        }

        return $array;
    }

    public function getStaticPages($id_lang = null)
    {
        $statics = [];
        $pages = [];
        $staticPages = [
            'prices-drop',
            'new-products',
            'best-sales',
            'manufacturer',
            'supplier',
            'contact',
            'sitemap',
            'stores',
            'authentication',
            'my-account',
            'identity',
            'history',
            'addresses',
            'guest-tracking',
        ];

        foreach ($staticPages as $staticPage) {
            $meta = Meta::getMetaByPage($staticPage, ($id_lang) ? (int) $id_lang : (int) Context::getContext()->language->id);
            if ($meta) {
                $statics[] = [
                    'id_cms' => $staticPage,
                    'title' => $meta['title'],
                ];
            }
        }

        $pages[]['pages'] = $statics;

        return $pages;
    }

    public function getCmsPages($id_lang = null)
    {
        $id_lang = (int) (($id_lang) ?: Context::getContext()->language->id);
        $this->shop->id = (int) $this->shop->id;
        $categories = "SELECT  cc.`id_cms_category`,
                        ccl.`name`,
                        ccl.`description`,
                        ccl.`link_rewrite`,
                        cc.`id_parent`,
                        cc.`level_depth`,
                        NULL as pages
            FROM {$this->db_prefix}cms_category cc
            INNER JOIN {$this->db_prefix}cms_category_lang ccl
                ON (cc.`id_cms_category` = ccl.`id_cms_category`)
            INNER JOIN {$this->db_prefix}cms_category_shop ccs
                ON (cc.`id_cms_category` = ccs.`id_cms_category`)
            WHERE `active` = 1
                AND ccl.`id_lang`= $id_lang
                AND ccs.`id_shop`= {$this->shop->id} AND ccl.`id_shop` = {$this->shop->id}
        ";
        $pages = $this->db->executeS($categories);
        foreach ($pages as &$category) {
            $category['pages']
                = $this->db->executeS("SELECT c.`id_cms`,
                        c.`position`,
                        cl.`meta_title` as title,
                        cl.`meta_description` as description,
                        cl.`link_rewrite`
                    FROM {$this->db_prefix}cms c
                    INNER JOIN {$this->db_prefix}cms_lang cl
                        ON (c.`id_cms` = cl.`id_cms`)
                    INNER JOIN {$this->db_prefix}cms_shop cs
                        ON (c.`id_cms` = cs.`id_cms`)
                    WHERE c.`active` = 1
                        AND c.`id_cms_category` = {$category['id_cms_category']}
                        AND cl.`id_lang` = $id_lang
                        AND cs.`id_shop` = {$this->shop->id} AND cl.`id_shop` = {$this->shop->id}
                ");
        }

        return $pages;
    }

    public function getCategories($id_lang = null)
    {
        $id_lang = (int) (($id_lang) ?: Context::getContext()->language->id);
        $catSource = $this->customGetNestedCategories($this->shop->id, null, (int) $id_lang, false);

        return $this->buildCategoryTree($catSource, $parentId = 0);
    }

    public function buildCategoryTree(array &$elements, $parentId = 0)
    {
        $branch = [];

        foreach ($elements as $element) {
            if ($element['id_parent'] == $parentId) {
                $children = $this->buildCategoryTree($elements, $element['id_category']);
                if ($children) {
                    $element['children'] = $children;
                }
                $branch[$element['id_category']] = $element;
                unset($elements[$element['id_category']]);
            }
        }

        return $branch;
    }

    public function customGetNestedCategories($shop_id, $root_category = null, $id_lang = false, $active = false, $groups = null, $use_shop_restriction = true, $sql_filter = '', $sql_sort = '', $sql_limit = '')
    {
        if (isset($root_category) && !Validate::isInt($root_category)) {
            exit(Tools::displayError());
        }

        if (!Validate::isBool($active)) {
            exit(Tools::displayError());
        }

        if (isset($groups) && Group::isFeatureActive() && !is_array($groups)) {
            $groups = (array) $groups;
        }

        $cache_id = 'Category::getNestedCategories_' . md5((int) $shop_id . (int) $root_category . (int) $id_lang . (int) $active . (int) $active
                . (isset($groups) && Group::isFeatureActive() ? implode('', $groups) : ''));

        if (!Cache::isStored($cache_id)) {
            $result = Db::getInstance()->executeS('
							SELECT c.*, cl.*
				FROM `' . _DB_PREFIX_ . 'category` c
				INNER JOIN `' . _DB_PREFIX_ . 'category_shop` category_shop ON (category_shop.`id_category` = c.`id_category` AND category_shop.`id_shop` = "' . (int) $shop_id . '")
				LEFT JOIN `' . _DB_PREFIX_ . 'category_lang` cl ON (c.`id_category` = cl.`id_category` AND cl.`id_shop` = "' . (int) $shop_id . '")
				WHERE 1 ' . $sql_filter . ' ' . ($id_lang ? 'AND cl.`id_lang` = ' . (int) $id_lang : '') . '
				' . ($active ? ' AND (c.`active` = 1 OR c.`is_root_category` = 1)' : '') . '
				' . (isset($groups) && Group::isFeatureActive() ? ' AND cg.`id_group` IN (' . implode(',', $groups) . ')' : '') . '
				' . (!$id_lang || (isset($groups) && Group::isFeatureActive()) ? ' GROUP BY c.`id_category`' : '') . '
				' . ($sql_sort != '' ? $sql_sort : ' ORDER BY c.`level_depth` ASC') . '
				' . ($sql_sort == '' && $use_shop_restriction ? ', category_shop.`position` ASC' : '') . '
				' . ($sql_limit != '' ? $sql_limit : '')
            );

            $categories = [];
            $buff = [];

            foreach ($result as $row) {
                $current = &$buff[$row['id_category']];
                $current = $row;

                if ($row['id_parent'] == 0) {
                    $categories[$row['id_category']] = &$current;
                } else {
                    $buff[$row['id_parent']]['children'][$row['id_category']] = &$current;
                }
            }

            Cache::store($cache_id, $categories);
        }

        return Cache::retrieve($cache_id);
    }

    private function makeCategoryLink($id)
    {
        $cmsLink = [];

        $cat = new Category((int) $id);

        if (null !== $cat->id) {
            $cmsLink = [
                'title' => $cat->name[(int) $this->language->id],
                'description' => $cat->meta_description[(int) $this->language->id],
                'url' => $cat->getLink(),
            ];
        }

        return $cmsLink;
    }

    private function makeCmsPageLink($cmsId)
    {
        $cmsLink = [];

        $cms = new CMS((int) $cmsId);
        if (null !== $cms->id) {
            $cmsLink = [
                'title' => $cms->meta_title[(int) $this->language->id],
                'description' => $cms->meta_description[(int) $this->language->id],
                'url' => $this->link->getCMSLink($cms),
            ];
        }

        return $cmsLink;
    }

    private function makeCmsCategoryLink($cmsId)
    {
        $cmsLink = [];

        $cms = new CMSCategory((int) $cmsId);
        if (null !== $cms->id) {
            $cmsLink = [
                'title' => $cms->name[(int) $this->language->id],
                'description' => $cms->meta_description[(int) $this->language->id],
                'url' => $this->link->getCMSCategoryLink($cms),
            ];
        }

        return $cmsLink;
    }

    private function makeStaticLink($staticId)
    {
        $staticLink = [];

        $meta = Meta::getMetaByPage($staticId, (int) $this->language->id);
        $staticLink = [
            'title' => $meta['title'],
            'description' => $meta['description'],
            'url' => $this->link->getPageLink($staticId, true),
        ];

        return $staticLink;
    }
}
