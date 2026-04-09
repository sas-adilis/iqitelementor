<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class SmartLinkHelper
{
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

            case 'manufacturer':
                return $link->getManufacturerLink($id, null, $idLang);

            case 'supplier':
                return $link->getSupplierLink($id, null, $idLang);

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
                    'type_label' => 'Category',
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
                    'type_label' => 'CMS',
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
                    'type_label' => 'Brand',
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
                    'type_label' => 'Supplier',
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                ];
            }
        }

        return $results;
    }
}
