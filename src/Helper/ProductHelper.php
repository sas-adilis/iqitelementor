<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

use PrestaShop\PrestaShop\Adapter\Image\ImageRetriever;
use PrestaShop\PrestaShop\Adapter\Presenter\Product\ProductListingPresenter;
use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;
use PrestaShop\PrestaShop\Adapter\Product\ProductColorsRetriever;

class ProductHelper
{
    /** @var \Context */
    private $context;

    /** @var int */
    private $idLang;

    /** @var int */
    private $idShop;

    /** @var ProductListingPresenter|null */
    private $presenter;

    /** @var \PrestaShop\PrestaShop\Core\Product\ProductPresentationSettings|null */
    private $presentationSettings;

    /** @var ProductHelper|null */
    private static $instance;

    private function __construct()
    {
        $this->context = \Context::getContext();
        $this->idLang = (int) $this->context->language->id;
        $this->idShop = (int) $this->context->shop->id;
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    // ------------------------------------------------------------------
    //  Presentation
    // ------------------------------------------------------------------

    /**
     * @param array $products Raw product rows
     * @return array Presented products ready for Smarty
     */
    public function presentProducts(array $products): array
    {
        if (empty($products)) {
            return [];
        }

        $this->initPresenter();

        $presented = [];
        foreach ($products as $product) {
            $presented[] = $this->presenter->present(
                $this->presentationSettings,
                \Product::getProductProperties($this->idLang, $product, $this->context),
                $this->context->language
            );
        }

        return $presented;
    }

    private function initPresenter(): void
    {
        if ($this->presenter !== null) {
            return;
        }

        $factory = new \ProductPresenterFactory($this->context);
        $this->presentationSettings = $factory->getPresentationSettings();

        $this->presenter = new ProductListingPresenter(
            new ImageRetriever($this->context->link),
            $this->context->link,
            new PriceFormatter(),
            new ProductColorsRetriever(),
            $this->context->getTranslator()
        );
    }

    // ------------------------------------------------------------------
    //  Product listings
    // ------------------------------------------------------------------

    public function getNewProducts(int $limit = 8, string $orderBy = 'date_add', string $orderDir = 'DESC', bool $excludeOutOfStock = false): array
    {
        $nbDays = (int) (\Validate::isUnsignedInt(\Configuration::get('PS_NB_DAYS_NEW_PRODUCT'))
            ? \Configuration::get('PS_NB_DAYS_NEW_PRODUCT') : 20);

        $sql = $this->baseQuery();
        $sql->where('DATEDIFF(product_shop.`date_add`, DATE_SUB("' . pSQL(date('Y-m-d'))
            . ' 00:00:00", INTERVAL ' . $nbDays . ' DAY)) > 0');

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $this->applyOrderBy($sql, $orderBy, $orderDir);
        $sql->limit($limit);

        return $this->executeAndPresent($sql);
    }

    /**
     * @param int $days Number of days to look back (0 = all time)
     */
    public function getBestSales(int $limit = 8, string $orderBy = 'quantity', string $orderDir = 'DESC', int $days = 0, bool $excludeOutOfStock = false): array
    {
        $sql = $this->baseQuery();
        $sql->select('SUM(od.product_quantity) AS sales_quantity');
        $sql->innerJoin('order_detail', 'od', 'od.product_id = p.id_product');
        $sql->innerJoin('orders', 'o', 'o.id_order = od.id_order');
        $sql->where('o.valid = 1');

        if ($days > 0) {
            $sql->where('o.date_add >= DATE_SUB(NOW(), INTERVAL ' . (int) $days . ' DAY)');
        }

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $sql->groupBy('p.id_product');

        // 'position' n'a pas de sens sur un classement de meilleures ventes et
        // casserait la requête (product_shop.position n'existe pas) : on le
        // remappe vers le tri par quantité vendue, qui EST la position réelle.
        if ($orderBy === 'position') {
            $orderBy = 'quantity';
        }

        $orderBy = $this->sanitizeOrderBy($orderBy, [
            'quantity', 'date_add', 'name', 'price',
        ], 'quantity');
        $orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';

        if ($orderBy === 'quantity') {
            $sql->orderBy('sales_quantity ' . $orderDir);
        } else {
            $this->applyOrderBy($sql, $orderBy, $orderDir);
        }

        $sql->limit($limit);

        return $this->executeAndPresent($sql);
    }

    public function getPricesDrop(int $limit = 8, string $orderBy = 'date_add', string $orderDir = 'DESC', bool $excludeOutOfStock = false): array
    {
        $ids = \Product::_getProductIdByDate(
            date('Y-m-d 00:00:00'),
            date('Y-m-d 23:59:59'),
            $this->context
        );

        if (empty($ids)) {
            return [];
        }

        $productIds = implode(',', array_map('intval', array_column($ids, 'id_product')));

        $sql = $this->baseQuery();
        $sql->where('p.`id_product` IN (' . $productIds . ')');
        $sql->where('product_shop.`show_price` = 1');

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $this->applyOrderBy($sql, $orderBy, $orderDir);
        $sql->limit($limit);

        return $this->executeAndPresent($sql);
    }

    public function getProductsByCategory(int $idCategory, int $limit = 8, string $orderBy = 'date_add', string $orderDir = 'DESC', bool $excludeOutOfStock = false): array
    {
        if ($idCategory < 1) {
            return [];
        }

        $sql = $this->baseQuery();
        $sql->innerJoin('category_product', 'cp', 'cp.id_product = p.id_product');
        $sql->where('cp.`id_category` = ' . $idCategory);

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $this->applyOrderBy($sql, $orderBy, $orderDir);
        $sql->limit($limit);

        return $this->executeAndPresent($sql);
    }

    public function getProductsByManufacturer(int $idManufacturer, int $limit = 8, string $orderBy = 'date_add', string $orderDir = 'DESC', bool $excludeOutOfStock = false): array
    {
        if ($idManufacturer < 1) {
            return [];
        }

        $sql = $this->baseQuery();
        $sql->where('p.`id_manufacturer` = ' . $idManufacturer);

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $this->applyOrderBy($sql, $orderBy, $orderDir);
        $sql->limit($limit);

        return $this->executeAndPresent($sql);
    }

    /**
     * @param int[] $ids
     */
    public function getProductsByIds(array $ids, bool $excludeOutOfStock = false): array
    {
        $ids = array_filter(array_map('intval', $ids));
        if (empty($ids)) {
            return [];
        }

        $productIds = implode(',', $ids);

        $sql = $this->baseQuery();
        $sql->where('p.`id_product` IN (' . $productIds . ')');

        if ($excludeOutOfStock) {
            $sql->where('IFNULL(stock.quantity, 0) > 0');
        }

        $sql->orderBy('FIELD(p.id_product, ' . $productIds . ')');

        return $this->executeAndPresent($sql);
    }

    public function getFeaturedProducts(int $limit = 8, string $orderBy = 'date_add', string $orderDir = 'DESC', bool $excludeOutOfStock = false): array
    {
        $homeCategory = (int) \Configuration::get('PS_HOME_CATEGORY');

        return $this->getProductsByCategory($homeCategory, $limit, $orderBy, $orderDir, $excludeOutOfStock);
    }

    // ------------------------------------------------------------------
    //  Base query builder
    // ------------------------------------------------------------------

    private function baseQuery(): \DbQuery
    {
        $nbDays = (int) (\Validate::isUnsignedInt(\Configuration::get('PS_NB_DAYS_NEW_PRODUCT'))
            ? \Configuration::get('PS_NB_DAYS_NEW_PRODUCT') : 20);

        $sql = new \DbQuery();

        $sql->select('p.*, product_shop.*, stock.out_of_stock, IFNULL(stock.quantity, 0) AS quantity');
        $sql->select('pl.`description`, pl.`description_short`, pl.`link_rewrite`');
        $sql->select('pl.`meta_description`, pl.`meta_title`, pl.`name`, pl.`available_now`, pl.`available_later`');
        $sql->select('image_shop.`id_image`, il.`legend`, m.`name` AS manufacturer_name');
        $sql->select('cl.`name` AS category_default');
        $sql->select('IFNULL(product_attribute_shop.id_product_attribute, 0) AS id_product_attribute');
        $sql->select('DATEDIFF(product_shop.`date_add`, DATE_SUB("' . pSQL(date('Y-m-d'))
            . ' 00:00:00", INTERVAL ' . $nbDays . ' DAY)) > 0 AS new');

        $sql->from('product', 'p');
        $sql->innerJoin('product_shop', 'product_shop',
            'product_shop.id_product = p.id_product AND product_shop.id_shop = ' . $this->idShop);
        $sql->leftJoin('product_attribute_shop', 'product_attribute_shop',
            'p.id_product = product_attribute_shop.id_product AND product_attribute_shop.default_on = 1 AND product_attribute_shop.id_shop = ' . $this->idShop);
        $sql->leftJoin('product_lang', 'pl',
            'p.id_product = pl.id_product AND pl.id_lang = ' . $this->idLang . \Shop::addSqlRestrictionOnLang('pl'));
        $sql->leftJoin('category_lang', 'cl',
            'product_shop.id_category_default = cl.id_category AND cl.id_lang = ' . $this->idLang . \Shop::addSqlRestrictionOnLang('cl'));
        $sql->leftJoin('image_shop', 'image_shop',
            'image_shop.id_product = p.id_product AND image_shop.cover = 1 AND image_shop.id_shop = ' . $this->idShop);
        $sql->leftJoin('image_lang', 'il',
            'image_shop.id_image = il.id_image AND il.id_lang = ' . $this->idLang);
        $sql->leftJoin('manufacturer', 'm', 'p.id_manufacturer = m.id_manufacturer');
        $sql->leftJoin('stock_available', 'stock',
            'stock.id_product = p.id_product AND stock.id_product_attribute = 0'
            . \StockAvailable::addSqlShopRestriction(null, null, 'stock'));

        $sql->where('product_shop.`active` = 1');
        $sql->where('product_shop.`visibility` IN ("both", "catalog")');

        return $sql;
    }

    // ------------------------------------------------------------------
    //  Internal helpers
    // ------------------------------------------------------------------

    private function executeAndPresent(\DbQuery $sql): array
    {
        $result = \Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);

        if (!is_array($result) || empty($result)) {
            return [];
        }

        foreach ($result as &$row) {
            $row['id_product_attribute'] = \Product::getDefaultAttribute((int) $row['id_product']);
        }

        $products = \Product::getProductsProperties($this->idLang, $result);

        return $this->presentProducts($products);
    }

    private function applyOrderBy(\DbQuery $sql, string $orderBy, string $orderDir): void
    {
        $orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';

        switch ($orderBy) {
            case 'name':
                $sql->orderBy('pl.`name` ' . $orderDir);
                break;
            case 'price':
                $sql->orderBy('product_shop.`price` ' . $orderDir);
                break;
            case 'position':
                $sql->orderBy('product_shop.`position` ' . $orderDir);
                break;
            case 'rand':
                $sql->orderBy('RAND()');
                break;
            case 'date_add':
            default:
                $sql->orderBy('p.`date_add` ' . $orderDir);
                break;
        }
    }

    /**
     * @param string $value
     * @param string[] $allowed
     * @param string $default
     * @return string
     */
    private function sanitizeOrderBy(string $value, array $allowed, string $default): string
    {
        return in_array($value, $allowed, true) ? $value : $default;
    }
}
