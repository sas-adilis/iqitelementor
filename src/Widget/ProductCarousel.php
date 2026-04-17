<?php

namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\ProductHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Traits\CarouselTrait;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ProductCarousel extends WidgetBase
{
    use CarouselTrait;

    public $context;
    public $editMode = false;

    public function __construct($data = [], $args = null)
    {
        $this->context = \Context::getContext();

        if (isset($this->context->controller->controller_name)
            && $this->context->controller->controller_name == 'AdminIqitElementorEditor') {
            $this->editMode = true;
        }

        parent::__construct($data, $args);
    }

    public function getId(): string
    {
        return 'product-carousel';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Product Carousel');
    }

    public function getIcon(): string
    {
        return 'carousel';
    }

    public function getCategories(): array
    {
        return [Translater::get()->l('Prestashop', 'elementor')];
    }

    protected function registerControls(): void
    {
        $categories = [];
        $manufacturers = [];

        if ($this->editMode) {
            $cats = \Category::getCategories($this->context->language->id, true, false);
            foreach ($cats as $cat) {
                $categories[(int) $cat['id_category']] = $cat['name'] . ' (ID: ' . $cat['id_category'] . ')';
            }

            $mans = \Manufacturer::getManufacturers(false, $this->context->language->id, true);
            if (is_array($mans)) {
                foreach ($mans as $man) {
                    $manufacturers[(int) $man['id_manufacturer']] = $man['name'];
                }
            }
        }

        // ===== CONTENT: Product source =====
        $this->addControl(
            'section_product_source',
            [
                'label' => Translater::get()->l('Product source'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->addControl(
            'listing',
            [
                'label' => Translater::get()->l('Product listing'),
                'type' => ControlManager::SELECT,
                'default' => 'new',
                'section' => 'section_product_source',
                'options' => [
                    'new' => Translater::get()->l('New products'),
                    'bestsellers' => Translater::get()->l('Best sellers'),
                    'pricesdrop' => Translater::get()->l('Prices drop'),
                    'featured' => Translater::get()->l('Featured (home category)'),
                    'category' => Translater::get()->l('From a category'),
                    'manufacturer' => Translater::get()->l('From a manufacturer'),
                    'products' => Translater::get()->l('Specific products'),
                ],
            ]
        );

        $this->addControl(
            'category_id',
            [
                'label' => Translater::get()->l('Category'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'section' => 'section_product_source',
                'options' => $categories,
                'condition' => [
                    'listing' => 'category',
                ],
            ]
        );

        $this->addControl(
            'manufacturer_id',
            [
                'label' => Translater::get()->l('Manufacturer'),
                'type' => ControlManager::SELECT,
                'default' => '',
                'section' => 'section_product_source',
                'options' => $manufacturers,
                'condition' => [
                    'listing' => 'manufacturer',
                ],
            ]
        );

        $this->addControl(
            'product_ids',
            [
                'label' => Translater::get()->l('Products'),
                'placeholder' => Translater::get()->l('Product name, id, ref'),
                'type' => ControlManager::AUTOCOMPLETE_PRODUCTS,
                'label_block' => true,
                'section' => 'section_product_source',
                'condition' => [
                    'listing' => 'products',
                ],
            ]
        );

        $this->addControl(
            'limit',
            [
                'label' => Translater::get()->l('Limit'),
                'type' => ControlManager::NUMBER,
                'default' => 8,
                'min' => 1,
                'max' => 50,
                'section' => 'section_product_source',
                'condition' => [
                    'listing!' => 'products',
                ],
            ]
        );

        $this->addControl(
            'order_by',
            [
                'label' => Translater::get()->l('Order by'),
                'type' => ControlManager::SELECT,
                'default' => 'date_add',
                'section' => 'section_product_source',
                'options' => [
                    'date_add' => Translater::get()->l('Date added'),
                    'name' => Translater::get()->l('Name'),
                    'price' => Translater::get()->l('Price'),
                    'position' => Translater::get()->l('Position'),
                    'rand' => Translater::get()->l('Random'),
                ],
                'condition' => [
                    'listing!' => 'products',
                ],
            ]
        );

        $this->addControl(
            'order_dir',
            [
                'label' => Translater::get()->l('Order direction'),
                'type' => ControlManager::SELECT,
                'default' => 'DESC',
                'section' => 'section_product_source',
                'options' => [
                    'ASC' => Translater::get()->l('Ascending'),
                    'DESC' => Translater::get()->l('Descending'),
                ],
                'condition' => [
                    'listing!' => 'products',
                    'order_by!' => 'rand',
                ],
            ]
        );

        $this->addControl(
            'bestsellers_days',
            [
                'label' => Translater::get()->l('Period (days)'),
                'description' => Translater::get()->l('Number of days to look back. 0 = all time.'),
                'type' => ControlManager::NUMBER,
                'default' => 0,
                'min' => 0,
                'max' => 365,
                'section' => 'section_product_source',
                'condition' => [
                    'listing' => 'bestsellers',
                ],
            ]
        );

        $this->addControl(
            'exclude_out_of_stock',
            [
                'label' => Translater::get()->l('Exclude out of stock'),
                'type' => ControlManager::SWITCHER,
                'default' => '',
                'section' => 'section_product_source',
            ]
        );

        // ===== CONTENT: Carousel settings =====
        $this->addControl(
            'section_carousel_options',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => ControlManager::SECTION,
            ]
        );

        $this->registerCarouselControls('section_carousel_options', [], [
            'slides_to_show' => 4,
            'slides_to_show_tablet' => 3,
            'slides_to_show_mobile' => 2,
        ]);

        // ===== STYLE: Product Box =====
        $this->addControl(
            'section_style_product',
            [
                'label' => Translater::get()->l('Product Box'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->addControl(
            'product_bg_color',
            [
                'label' => Translater::get()->l('Background color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_style_product',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide .product-miniature' => 'background-color: {{VALUE}};',
                ],
            ]
        );

        $this->addControl(
            'product_padding',
            [
                'label' => Translater::get()->l('Padding'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', 'em'],
                'section' => 'section_style_product',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide .product-miniature' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'product_border_radius',
            [
                'label' => Translater::get()->l('Border Radius'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'section' => 'section_style_product',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide .product-miniature' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->addControl(
            'product_border_width',
            [
                'label' => Translater::get()->l('Border Width'),
                'type' => ControlManager::DIMENSIONS,
                'size_units' => ['px'],
                'section' => 'section_style_product',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide .product-miniature' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}; border-style: solid;',
                ],
            ]
        );

        $this->addControl(
            'product_border_color',
            [
                'label' => Translater::get()->l('Border Color'),
                'type' => ControlManager::COLOR,
                'section' => 'section_style_product',
                'tab' => 'style',
                'selectors' => [
                    '{{WRAPPER}} .swiper-slide .product-miniature' => 'border-color: {{VALUE}};',
                ],
            ]
        );

        // ===== STYLE: Carousel =====
        $this->addControl(
            'section_carousel_styles',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => ControlManager::SECTION,
                'tab' => 'style',
            ]
        );

        $this->registerCarouselStyles('section_carousel_styles');
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        $listing = $optionsSource['listing'] ?? 'new';
        $limit = isset($optionsSource['limit']) ? (int) $optionsSource['limit'] : 8;
        $orderBy = $optionsSource['order_by'] ?? 'date_add';
        $orderDir = $optionsSource['order_dir'] ?? 'DESC';
        $excludeOos = !empty($optionsSource['exclude_out_of_stock']);

        if ($limit < 1) {
            $limit = 8;
        }

        $products = $this->getProductsByListing($listing, $limit, $orderBy, $orderDir, $optionsSource, $excludeOos);

        return array_merge(
            ['products' => $products],
            $this->buildCarouselOptions($optionsSource)
        );
    }

    protected function getProductsByListing(string $listing, int $limit, string $orderBy, string $orderDir, array $optionsSource, bool $excludeOos = false): array
    {
        $helper = ProductHelper::getInstance();

        switch ($listing) {
            case 'new':
                return $helper->getNewProducts($limit, $orderBy, $orderDir, $excludeOos);

            case 'bestsellers':
                $days = isset($optionsSource['bestsellers_days']) ? (int) $optionsSource['bestsellers_days'] : 0;
                return $helper->getBestSales($limit, $orderBy, $orderDir, $days, $excludeOos);

            case 'pricesdrop':
                return $helper->getPricesDrop($limit, $orderBy, $orderDir, $excludeOos);

            case 'featured':
                return $helper->getFeaturedProducts($limit, $orderBy, $orderDir, $excludeOos);

            case 'category':
                $catId = isset($optionsSource['category_id']) ? (int) $optionsSource['category_id'] : 0;
                return $helper->getProductsByCategory($catId, $limit, $orderBy, $orderDir, $excludeOos);

            case 'manufacturer':
                $manId = isset($optionsSource['manufacturer_id']) ? (int) $optionsSource['manufacturer_id'] : 0;
                return $helper->getProductsByManufacturer($manId, $limit, $orderBy, $orderDir, $excludeOos);

            case 'products':
                $productIds = isset($optionsSource['product_ids']) ? $optionsSource['product_ids'] : [];
                if (!is_array($productIds)) {
                    $productIds = array_filter(array_map('intval', explode(',', $productIds)));
                }
                return $helper->getProductsByIds($productIds, $excludeOos);

            default:
                return [];
        }
    }

    public function getTemplatePath(): string
    {
        return 'module:iqitelementor/views/templates/widgets/productcarousel.tpl';
    }
}
