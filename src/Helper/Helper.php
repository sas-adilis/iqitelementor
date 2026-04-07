<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

if (!defined('ELEMENTOR_ABSPATH')) {
    define('ELEMENTOR_ABSPATH', \_PS_MODULE_DIR_ . 'iqitelementor');
}

define('ELEMENTOR_ASSETS_URL', \_MODULE_DIR_ . 'iqitelementor/views/');

use PrestaShop\PrestaShop\Adapter\Image\ImageRetriever;
use PrestaShop\PrestaShop\Adapter\Presenter\Product\ProductListingPresenter;
use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;
use PrestaShop\PrestaShop\Adapter\Product\ProductColorsRetriever;

class Helper
{
    public static function escAttr($text): string
    {
        return \Tools::safeOutput($text);
    }

    public static function getProduct($id)
    {
        $productSource = self::getProductsByIds($id);

        if (isset($productSource[0])) {
            $product['name'] = $productSource[0]['name'];
            $product['price'] = $productSource[0]['price'];
            $product['url'] = $productSource[0]['url'];
            $product['cover'] = $productSource[0]['cover']['bySize']['small_default'];

            return $product;
        }
    }

    public static function renderIqitElementorWidget(string $name, array $options): string
    {
        $module = \Module::getInstanceByName('iqitelementor');

        return $module->renderIqitElementorWidget($name, $options);
    }

    public static function renderIqitElementorWidgetPreview(string $name, array $options): string
    {
        $module = \Module::getInstanceByName('iqitelementor');

        return $module->renderIqitElementorWidget($name, $options, true);
    }

    public static function parseArgs($args, $defaults = ''): array
    {
        if (is_object($args)) {
            $r = get_object_vars($args);
        } elseif (is_array($args)) {
            $r = &$args;
        } else {
            parse_str($args, $r);
        }

        if (is_array($defaults)) {
            return array_merge($defaults, $r);
        }

        return $r;
    }

    public static function sendJsonSuccess($data = null): void
    {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        $response = ['success' => true];
        if (isset($data)) {
            $response['data'] = $data;
        }
        exit(json_encode($response));
    }

    /**
     * @return \IqitElementor\Base\WidgetBase|false
     */
    public static function getElementorWidgetInstanceByName(string $name)
    {
        return \IqitElementor\Core\Plugin::instance()->widgetsManager->getWidget($name);
    }

    public static function absint($maybeint): int
    {
        return abs(intval($maybeint));
    }

    public static function isRtl(): bool
    {
        if (\Context::getContext()->language->is_rtl) {
            return true;
        }

        return false;
    }

    public static function doingItWrong(string $function, string $message, ?string $version = null): void
    {
        throw new \PrestaShopException($function . ' - ' . $message . ($version ? ' - ' . $version : ''));
    }

    public static function triggerError(string $message): void
    {
        throw new \PrestaShopException($message);
    }

    /**
     * Sanitize a comma-separated string of hex color values.
     */
    public static function cleanStringOfColors(string $colors): string
    {
        if (empty($colors)) {
            return '';
        }

        $parts = explode(',', $colors);
        $clean = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (preg_match('/^#?[0-9a-fA-F]{3,8}$/', $part)) {
                $clean[] = (strpos($part, '#') === 0) ? $part : '#' . $part;
            }
        }

        return implode(',', $clean);
    }

    /**
     * Convert a comma-separated string of hex colors to an array.
     */
    public static function stringToArrayOfColors(string $colors): array
    {
        if (empty($colors)) {
            return [];
        }

        $parts = explode(',', $colors);
        $result = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (!empty($part)) {
                $result[] = $part;
            }
        }

        return $result;
    }

    public static function getOption(string $option, $default = false)
    {
        return \Configuration::get('iqitelementor_' . $option, null, null, null, $default);
    }

    public static function getImage(string $image = ''): string
    {
        if (\Validate::isAbsoluteUrl($image)) {
            return $image;
        } else {
            $http = \Tools::getCurrentUrlProtocolPrefix();
            return $http . \Tools::getMediaServer($image) . $image;
        }
    }

    public static function getProductsByIds($ids)
    {

        if (!is_array($ids)) {
            return;
        }
        if (empty($ids)) {
            return;
        }

        $context = \Context::getContext();

        $products = self::getProductsInfoByIds($ids, $context->language->id, $context);

        $presenterFactory = new \ProductPresenterFactory($context);
        $presentationSettings = $presenterFactory->getPresentationSettings();

        $presenter = new ProductListingPresenter(
            new ImageRetriever(
                $context->link
            ),
            $context->link,
            new PriceFormatter(),
            new ProductColorsRetriever(),
            $context->getTranslator()
        );

        if (is_array($products)) {
            foreach ($products as &$product) {
                $product = $presenter->present(
                    $presentationSettings,
                    \Product::getProductProperties($context->language->id, $product, $context),
                    $context->language
                );
            }
            unset($product);
        }

        return $products;
    }

    public static function getProductsInfoByIds(array $ids, int $id_lang, \Context $context, bool $active = true)
    {
        $product_ids = join(',', array_map('intval', $ids));

        $id_shop = (int)$context->shop->id;

        $sql = 'SELECT p.*, product_shop.*, stock.out_of_stock, IFNULL(stock.quantity, 0) as quantity, pl.`description`, pl.`description_short`, pl.`link_rewrite`,
					pl.`meta_description`, pl.`meta_title`, pl.`name`, pl.`available_now`, pl.`available_later`,
					image_shop.`id_image` id_image, il.`legend`, m.`name` as manufacturer_name, cl.`name` AS category_default, IFNULL(product_attribute_shop.id_product_attribute, 0) id_product_attribute,
					DATEDIFF(
						p.`date_add`,
						DATE_SUB(
							"' . date('Y-m-d') . ' 00:00:00",
							INTERVAL ' . (\Validate::isUnsignedInt(\Configuration::get('PS_NB_DAYS_NEW_PRODUCT')) ? \Configuration::get('PS_NB_DAYS_NEW_PRODUCT') : 20) . ' DAY
						)
					) > 0 AS new
				FROM  `' . \_DB_PREFIX_ . 'product` p
				' . \Shop::addSqlAssociation('product', 'p') . '
				LEFT JOIN `' . \_DB_PREFIX_ . 'product_attribute_shop` product_attribute_shop
					ON (p.`id_product` = product_attribute_shop.`id_product` AND product_attribute_shop.`default_on` = 1 AND product_attribute_shop.id_shop=' . (int)$id_shop . ')
				LEFT JOIN `' . \_DB_PREFIX_ . 'product_lang` pl ON (
					p.`id_product` = pl.`id_product`
					AND pl.`id_lang` = ' . (int)$id_lang . \Shop::addSqlRestrictionOnLang('pl') . '
				)
				LEFT JOIN `' . \_DB_PREFIX_ . 'category_lang` cl ON (
					product_shop.`id_category_default` = cl.`id_category`
					AND cl.`id_lang` = ' . (int)$id_lang . \Shop::addSqlRestrictionOnLang('cl') . '
				)
				LEFT JOIN `' . \_DB_PREFIX_ . 'image_shop` image_shop
					ON (image_shop.`id_product` = p.`id_product` AND image_shop.cover=1 AND image_shop.id_shop=' . (int)$id_shop . ')
				LEFT JOIN `' . \_DB_PREFIX_ . 'image_lang` il ON (image_shop.`id_image` = il.`id_image` AND il.`id_lang` = ' . (int)$id_lang . ')
				LEFT JOIN `' . \_DB_PREFIX_ . 'manufacturer` m ON (p.`id_manufacturer`= m.`id_manufacturer`)
				' . \Product::sqlStock('p', 0) . '
				WHERE p.id_product IN (' . $product_ids . ')'
            . ($active ? ' AND product_shop.`active` = 1 AND product_shop.`visibility` != \'none\'' : '') . '
				ORDER BY FIELD(product_shop.id_product, ' . $product_ids . ')
				';
        if (!$result = \Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql)) {
            return false;
        }
        foreach ($result as &$row) {
            $row['id_product_attribute'] = \Product::getDefaultAttribute((int)$row['id_product']);
        }

        return \Product::getProductsProperties($id_lang, $result);
    }

}
