<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class SmartLinkHelper
{
    /**
     * Translated labels for each entity type (used in search results and
     * rebuilt in the editor UI when an entity is restored).
     *
     * @return array<string, string>
     */
    public static function getTypeLabels(): array
    {
        $t = Translater::get();
        return [
            'category' => $t->l('Category'),
            'cms' => $t->l('CMS page'),
            'cms_category' => $t->l('CMS category'),
            'manufacturer' => $t->l('Brand'),
            'supplier' => $t->l('Supplier'),
            'page' => $t->l('Page'),
            'sb_post' => $t->l('Blog post'),
            'sb_category' => $t->l('Blog category'),
        ];
    }

    /**
     * Resolve a smart link value to a real URL.
     *
     * Accepts the control value array (from the URL control) and returns
     * a resolved URL string. For entity types (category, cms, manufacturer,
     * supplier), the URL is generated dynamically so it stays valid even
     * if the entity's friendly URL changes.
     *
     * @param array|string $linkValue
     * @return string The resolved URL (empty string if unresolvable)
     */
    public static function resolve($linkValue): string
    {
        if (empty($linkValue)) {
            return '';
        }

        if (is_string($linkValue)) {
            return $linkValue;
        }

        if (!is_array($linkValue)) {
            return '';
        }

        $type = isset($linkValue['type']) ? $linkValue['type'] : '';
        $id = isset($linkValue['id']) ? (int) $linkValue['id'] : 0;
        $url = isset($linkValue['url']) ? $linkValue['url'] : '';

        // No type or custom: return the raw URL
        if (empty($type) || $type === 'custom' || empty($id)) {
            return $url;
        }

        $context = \Context::getContext();
        $idLang = (int) $context->language->id;
        $idShop = (int) $context->shop->id;
        $link = $context->link;

        switch ($type) {
            case 'category':
                return $link->getCategoryLink($id, null, $idLang);

            case 'cms':
                return $link->getCMSLink($id, null, null, $idLang);

            case 'cms_category':
                return $link->getCMSCategoryLink($id, null, $idLang);

            case 'manufacturer':
                return $link->getManufacturerLink($id, null, $idLang);

            case 'supplier':
                return $link->getSupplierLink($id, null, $idLang);

            case 'page':
                $pageName = isset($linkValue['url']) ? $linkValue['url'] : '';
                if ($pageName) {
                    return $link->getPageLink($pageName, true, $idLang);
                }
                return '';

            case 'sb_post':
                if (!\Module::isInstalled('ph_simpleblog')) {
                    return '';
                }
                $row = \Db::getInstance()->getRow(
                    'SELECT p.link_rewrite, c.link_rewrite AS category_rewrite
                     FROM `' . _DB_PREFIX_ . 'simpleblog_post_lang` p
                     INNER JOIN `' . _DB_PREFIX_ . 'simpleblog_post` sp ON sp.id_simpleblog_post = p.id_simpleblog_post
                     INNER JOIN `' . _DB_PREFIX_ . 'simpleblog_category_lang` c
                         ON c.id_simpleblog_category = sp.id_simpleblog_category AND c.id_lang = p.id_lang
                     WHERE p.id_simpleblog_post = ' . (int) $id . ' AND p.id_lang = ' . (int) $idLang
                );
                if (!$row) {
                    return '';
                }
                return $link->getModuleLink('ph_simpleblog', 'single', [
                    'rewrite' => $row['link_rewrite'],
                    'sb_category' => $row['category_rewrite'],
                ], null, $idLang);

            case 'sb_category':
                if (!\Module::isInstalled('ph_simpleblog')) {
                    return '';
                }
                $rewrite = \Db::getInstance()->getValue(
                    'SELECT link_rewrite FROM `' . _DB_PREFIX_ . 'simpleblog_category_lang`
                     WHERE id_simpleblog_category = ' . (int) $id . ' AND id_lang = ' . (int) $idLang
                );
                if (!$rewrite) {
                    return '';
                }
                return $link->getModuleLink('ph_simpleblog', 'category', [
                    'sb_category' => $rewrite,
                ], null, $idLang);

            default:
                return $url;
        }
    }

    /**
     * Search across entity types for the autocomplete.
     *
     */
    public static function searchEntities(string $query, int $idLang, int $idShop, int $limit = 20): array
    {
        $results = [];
        $query = pSQL($query);

        if (empty($query)) {
            return $results;
        }

        $typeLabels = self::getTypeLabels();

        // Categories
        $sql = new \DbQuery();
        $sql->select('c.id_category AS id, cl.name');
        $sql->from('category', 'c');
        $sql->innerJoin('category_lang', 'cl', 'c.id_category = cl.id_category AND cl.id_lang = ' . (int) $idLang . ' AND cl.id_shop = ' . (int) $idShop);
        $sql->innerJoin('category_shop', 'cs', 'c.id_category = cs.id_category AND cs.id_shop = ' . (int) $idShop);
        $sql->where('c.active = 1');
        $sql->where('cl.name LIKE \'%' . $query . '%\'');
        $sql->orderBy('cl.name ASC');
        $sql->limit((int) $limit);
        $categories = \Db::getInstance()->executeS($sql);

        if ($categories) {
            foreach ($categories as $row) {
                $results[] = [
                    'type' => 'category',
                    'type_label' => $typeLabels['category'],
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        // CMS pages
        $sql = new \DbQuery();
        $sql->select('c.id_cms AS id, cl.meta_title AS name');
        $sql->from('cms', 'c');
        $sql->innerJoin('cms_lang', 'cl', 'c.id_cms = cl.id_cms AND cl.id_lang = ' . (int) $idLang . ' AND cl.id_shop = ' . (int) $idShop);
        $sql->innerJoin('cms_shop', 'cs', 'c.id_cms = cs.id_cms AND cs.id_shop = ' . (int) $idShop);
        $sql->where('c.active = 1');
        $sql->where('cl.meta_title LIKE \'%' . $query . '%\'');
        $sql->orderBy('cl.meta_title ASC');
        $sql->limit((int) $limit);
        $cmsPages = \Db::getInstance()->executeS($sql);

        if ($cmsPages) {
            foreach ($cmsPages as $row) {
                $results[] = [
                    'type' => 'cms',
                    'type_label' => $typeLabels['cms'],
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        // Manufacturers
        $sql = new \DbQuery();
        $sql->select('m.id_manufacturer AS id, m.name');
        $sql->from('manufacturer', 'm');
        $sql->innerJoin('manufacturer_shop', 'ms', 'm.id_manufacturer = ms.id_manufacturer AND ms.id_shop = ' . (int) $idShop);
        $sql->where('m.active = 1');
        $sql->where('m.name LIKE \'%' . $query . '%\'');
        $sql->orderBy('m.name ASC');
        $sql->limit((int) $limit);
        $manufacturers = \Db::getInstance()->executeS($sql);

        if ($manufacturers) {
            foreach ($manufacturers as $row) {
                $results[] = [
                    'type' => 'manufacturer',
                    'type_label' => $typeLabels['manufacturer'],
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        // Suppliers
        $sql = new \DbQuery();
        $sql->select('s.id_supplier AS id, s.name');
        $sql->from('supplier', 's');
        $sql->innerJoin('supplier_shop', 'ss', 's.id_supplier = ss.id_supplier AND ss.id_shop = ' . (int) $idShop);
        $sql->where('s.active = 1');
        $sql->where('s.name LIKE \'%' . $query . '%\'');
        $sql->orderBy('s.name ASC');
        $sql->limit((int) $limit);
        $suppliers = \Db::getInstance()->executeS($sql);

        if ($suppliers) {
            foreach ($suppliers as $row) {
                $results[] = [
                    'type' => 'supplier',
                    'type_label' => $typeLabels['supplier'],
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        // CMS categories
        $sql = new \DbQuery();
        $sql->select('c.id_cms_category AS id, cl.name');
        $sql->from('cms_category', 'c');
        $sql->innerJoin('cms_category_lang', 'cl', 'c.id_cms_category = cl.id_cms_category AND cl.id_lang = ' . (int) $idLang . ' AND cl.id_shop = ' . (int) $idShop);
        $sql->innerJoin('cms_category_shop', 'cs', 'c.id_cms_category = cs.id_cms_category AND cs.id_shop = ' . (int) $idShop);
        $sql->where('c.active = 1');
        $sql->where('cl.name LIKE \'%' . $query . '%\'');
        $sql->orderBy('cl.name ASC');
        $sql->limit((int) $limit);
        $cmsCategories = \Db::getInstance()->executeS($sql);

        if ($cmsCategories) {
            foreach ($cmsCategories as $row) {
                $results[] = [
                    'type' => 'cms_category',
                    'type_label' => $typeLabels['cms_category'],
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        // Native pages (meta)
        $sql = new \DbQuery();
        $sql->select('m.id_meta AS id, m.page, ml.title');
        $sql->from('meta', 'm');
        $sql->innerJoin('meta_lang', 'ml', 'm.id_meta = ml.id_meta AND ml.id_lang = ' . (int) $idLang . ' AND ml.id_shop = ' . (int) $idShop);
        $sql->where('(ml.title LIKE \'%' . $query . '%\' OR m.page LIKE \'%' . $query . '%\')');
        $sql->orderBy('ml.title ASC');
        $sql->limit((int) $limit);
        $pages = \Db::getInstance()->executeS($sql);

        if ($pages) {
            foreach ($pages as $row) {
                $name = !empty($row['title']) ? $row['title'] : $row['page'];
                $results[] = [
                    'type' => 'page',
                    'type_label' => $typeLabels['page'],
                    'id' => (int) $row['id'],
                    // The meta id is useless for getPageLink — store the page name in url
                    'url' => $row['page'],
                    'name' => $name,
                ];
            }
        }

        // ph_simpleblog posts & categories (if installed)
        if (\Module::isInstalled('ph_simpleblog')) {
            $sql = new \DbQuery();
            $sql->select('p.id_simpleblog_post AS id, pl.title AS name');
            $sql->from('simpleblog_post', 'p');
            $sql->innerJoin('simpleblog_post_lang', 'pl', 'p.id_simpleblog_post = pl.id_simpleblog_post AND pl.id_lang = ' . (int) $idLang);
            $sql->innerJoin('simpleblog_post_shop', 'ps', 'p.id_simpleblog_post = ps.id_simpleblog_post AND ps.id_shop = ' . (int) $idShop);
            $sql->where('p.active = 1');
            $sql->where('pl.title LIKE \'%' . $query . '%\'');
            $sql->orderBy('pl.title ASC');
            $sql->limit((int) $limit);
            $sbPosts = \Db::getInstance()->executeS($sql);

            if ($sbPosts) {
                foreach ($sbPosts as $row) {
                    $results[] = [
                        'type' => 'sb_post',
                        'type_label' => $typeLabels['sb_post'],
                        'id' => (int) $row['id'],
                        'name' => $row['name'],
                    ];
                }
            }

            $sql = new \DbQuery();
            $sql->select('c.id_simpleblog_category AS id, cl.name');
            $sql->from('simpleblog_category', 'c');
            $sql->innerJoin('simpleblog_category_lang', 'cl', 'c.id_simpleblog_category = cl.id_simpleblog_category AND cl.id_lang = ' . (int) $idLang);
            $sql->innerJoin('simpleblog_category_shop', 'cs', 'c.id_simpleblog_category = cs.id_simpleblog_category AND cs.id_shop = ' . (int) $idShop);
            $sql->where('c.active = 1');
            $sql->where('cl.name LIKE \'%' . $query . '%\'');
            $sql->orderBy('cl.name ASC');
            $sql->limit((int) $limit);
            $sbCategories = \Db::getInstance()->executeS($sql);

            if ($sbCategories) {
                foreach ($sbCategories as $row) {
                    $results[] = [
                        'type' => 'sb_category',
                        'type_label' => $typeLabels['sb_category'],
                        'id' => (int) $row['id'],
                        'name' => $row['name'],
                    ];
                }
            }
        }

        return $results;
    }
}
