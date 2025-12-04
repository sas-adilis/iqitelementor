<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Class ElementorWidget_Brands
 */
class Widget_Brands extends Widget_Base
{
    use IqitElementorCarouselTrait;

    public $context;

    public $status = 1;
    public $editMode = false;

    public function __construct($data = [], $args = null)
    {
        $this->context = \Context::getContext();

        if (isset($this->context->controller->controller_name)
            && $this->context->controller->controller_name == 'IqitElementorEditor') {
            $this->editMode = true;
        }

        parent::__construct($data, $args);
    }

    /**
     * Identifiant unique du widget côté Elementor
     */
    public function get_id()
    {
        return 'brands';
    }

    /**
     * Titre affiché dans la liste des widgets
     */
    public function get_title()
    {
        return \IqitElementorWpHelper::__('Brands logos', 'elementor');
    }

    /**
     * Icône Elementor (classe CSS)
     */
    public function get_icon()
    {
        return 'carousel';
    }

    /**
     * Catégories Elementor dans lesquelles apparaît le widget
     */
    public function get_categories()
    {
        return ['prestashop'];
    }

    /**
     * Enregistre les controls directement (sans passer par getForm())
     * (équivalent de ce que faisait l’ancien Widget_Prestashop)
     */
    protected function _register_controls()
    {
        // Préparation des valeurs pour les différents contrôles
        $slidesToShow = range(1, 6);
        $slidesToShow = array_combine($slidesToShow, $slidesToShow);
        $slidesToShow[12] = 12;

        $itemsPerColumn = range(1, 12);
        $itemsPerColumn = array_combine($itemsPerColumn, $itemsPerColumn);

        $brands = [];
        $imagesTypesOptions = [];

        if ($this->editMode) {
            $sortOrderSql = 'ASC';
            $orderBySql = 'name';

            $brands = \Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS(
                'SELECT m.*, ml.`description`, ml.`short_description` 
                FROM `' . _DB_PREFIX_ . 'manufacturer` m 
                LEFT JOIN `' . _DB_PREFIX_ . 'manufacturer_lang` ml ON (m.`id_manufacturer` = ml.`id_manufacturer` AND ml.`id_lang` = '
                . (int)$this->context->language->id . ') 
                LEFT OUTER JOIN `' . _DB_PREFIX_ . 'manufacturer_shop` ms ON (m.`id_manufacturer` = ms.`id_manufacturer` 
                AND ms.id_shop=' . (int)$this->context->shop->id . ') 
                WHERE m.`active` = 1 
                ORDER BY ' . pSQL($orderBySql) . ' ' . pSQL($sortOrderSql)
            );

            $imagesTypes = \ImageType::getImagesTypes('manufacturers');
            foreach ($imagesTypes as $imagesType) {
                $imagesTypesOptions[$imagesType['name']] = $imagesType['name'];
            }
        }

        $brandsOptions = [];
        $brandsSelect = [];
        $brandsOrder = [];

        $brandsSelect[0] = \IqitElementorWpHelper::__('Show all', 'elementor');
        $brandsSelect[1] = \IqitElementorWpHelper::__('Manual select', 'elementor');

        $brandsOrder[0] = \IqitElementorWpHelper::__('Default', 'elementor');
        $brandsOrder[1] = \IqitElementorWpHelper::__('Alphabetical', 'elementor');

        foreach ($brands as $brand) {
            $brandsOptions[$brand['id_manufacturer']] = ['name' => $brand['name'], 'selectable' => true];
        }

        // Section principale du widget
        $this->add_control(
            'section_pswidget_options',
            [
                'label' => \IqitElementorWpHelper::__('Widget settings', 'elementor'),
                'type' => 'section',
            ]
        );

        // Contrôles simples
        $this->add_control(
            'brand_select',
            [
                'label' => \IqitElementorWpHelper::__('Selection', 'elementor'),
                'type' => 'select',
                'default' => '0',
                'label_block' => true,
                'options' => $brandsSelect,
                'section' => 'section_pswidget_options',
            ]
        );

        $this->add_control(
            'brand_order',
            [
                'label' => \IqitElementorWpHelper::__('Order', 'elementor'),
                'type' => 'select',
                'default' => '0',
                'label_block' => true,
                'options' => $brandsOrder,
                'section' => 'section_pswidget_options',
                'condition' => [
                    'brand_select' => '0',
                ],
            ]
        );

        $this->add_control(
            'brand_list',
            [
                'label' => \IqitElementorWpHelper::__('Brands', 'elementor'),
                'type' => 'select_sort',
                'default' => '0',
                'label_block' => true,
                'multiple' => true,
                'section' => 'section_pswidget_options',
                'options' => $brandsOptions,
                'condition' => [
                    'brand_select' => '1',
                ],
            ]
        );

        $this->add_control(
            'image_format',
            [
                'label' => \IqitElementorWpHelper::__('Image format', 'elementor'),
                'type' => 'select',
                'default' => 'small_default',
                'section' => 'section_pswidget_options',
                'options' => $imagesTypesOptions,
            ]
        );

        $this->add_control(
            'view',
            [
                'label' => \IqitElementorWpHelper::__('View', 'elementor'),
                'type' => 'select',
                'default' => 'grid',
                'condition' => [
                    'view!' => 'default',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'carousel' => \IqitElementorWpHelper::__('Carousel', 'elementor'),
                    'grid' => \IqitElementorWpHelper::__('Grid', 'elementor'),
                ],
            ]
        );

        $this->add_control(
            'alignment',
            [
                'label' => \IqitElementorWpHelper::__('Alignment', 'elementor'),
                'type' => 'choose',
                'default' => '',
                'section' => 'section_pswidget_options',
                'options' => [
                    'left' => [
                        'title' => \IqitElementorWpHelper::__('Left', 'elementor'),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => \IqitElementorWpHelper::__('Center', 'elementor'),
                        'icon' => 'fa fa-align-center',
                    ],
                    'right' => [
                        'title' => \IqitElementorWpHelper::__('Right', 'elementor'),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
            ]
        );

        // Contrôles responsives et supplémentaires
        $this->add_responsive_control(
            'columns',
            [
                'label' => \IqitElementorWpHelper::__('Columns', 'elementor'),
                'type' => 'select',
                'default' => '3',
                'responsive' => true,
                'section' => 'section_pswidget_options',
                'options' => $slidesToShow,
                'condition' => [
                    'view' => 'grid',
                ],
            ]
        );

        $this->add_control(
            'items_per_column',
            [
                'label' => \IqitElementorWpHelper::__('Rows', 'elementor'),
                'type' => 'select',
                'default' => '2',
                'label_block' => true,
                'section' => 'section_pswidget_options',
                'options' => $itemsPerColumn,
                'condition' => [
                    'view' => 'grid',
                ],
            ]
        );

        $this->add_control(
            'section_carousel_options',
            [
                'label' => \IqitElementorWpHelper::__('Carousel', 'elementor'),
                'type' => 'section',
                'condition' => [
                    'view' => 'carousel',
                ],
            ]
        );

        $this->register_carousel_controls('section_carousel_options', [
            'view' => 'carousel',
        ]);

        $this->add_control(
            'section_carousel_styles',
            [
                'label' => \IqitElementorWpHelper::__('Carousel', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ]
        );

        $this->register_carousel_styles('section_carousel_styles', [
            'view' => 'carousel',
        ]);
    }

    public function parseOptions($optionsSource, $preview = false): array
    {
        $selectedBrands = $optionsSource['brand_list'];
        $brandsType = $optionsSource['brand_select'];
        $imageFormat = $optionsSource['image_format'];
        $imageType = \ImageType::getByNameNType($imageFormat, 'manufacturers');
        if (empty($imageType)) {
            throw new \PrestaShopException('Image type not found: ' . $imageFormat);
        }

        $brands = [];

        $widgetOptions = [];

        if ($brandsType == 0) {
            $allBrands = \Manufacturer::getManufacturers();
            foreach ($allBrands as $brand) {
                $fileExist = file_exists(_PS_MANU_IMG_DIR_ . $brand['id_manufacturer'] . '-' . $imageFormat . '.jpg');
                if ($fileExist) {
                    $brands[$brand['id_manufacturer']]['name'] = $brand['name'];
                    $brands[$brand['id_manufacturer']]['link'] = \Context::getContext()->link->getManufacturerLink(
                        $brand['id_manufacturer'],
                        $brand['link_rewrite']
                    );
                    $brands[$brand['id_manufacturer']]['id'] = $brand['id_manufacturer'];
                    $brands[$brand['id_manufacturer']]['image'] = [
                        'url' => \Context::getContext()->link->getManufacturerImageLink($brand['id_manufacturer'], $imageFormat),
                        'width' => $imageType['width'] ?? null,
                        'height' => $imageType['height'] ?? null,
                    ];
                }
            }

            if ($optionsSource['brand_order'] == 1) {
                uasort($brands, function ($a, $b) {
                    return strcmp($a['name'], $b['name']);
                });
            }
        }

        if ($brandsType == 1) {
            foreach ($selectedBrands as $brandID) {
                $brand = new \Manufacturer((int)$brandID);

                if (!Validate::isLoadedObject($brand)) {
                    continue;
                }

                $fileExist = file_exists(
                    _PS_MANU_IMG_DIR_ . $brand->id . '-'
                    . $imageFormat . '.jpg'
                );
                if ($fileExist) {
                    $brands[$brand->id]['name'] = $brand->name;
                    $brands[$brand->id]['link'] = \Context::getContext()->link->getManufacturerLink(
                        (int)$brand->id,
                        $brand->link_rewrite
                    );
                    $brands[$brand->id]['id'] = $brand->id;
                    $brands[$brand->id]['image'] = [
                        'url' => \Context::getContext()->link->getManufacturerImageLink($brand->id, $imageFormat),
                        'width' => $imageType['width'] ?? null,
                        'height' => $imageType['height'] ?? null,
                    ];
                }
            }
        }

        $widgetOptions['brands'] = $brands;

        if ($optionsSource['view'] == 'grid') {
            $widgetOptions['view'] = 'grid';
            $widgetOptions['columns'] = [
                'desktop' => $this->calculateGrid($optionsSource['columns']),
                'tablet' => $this->calculateGrid($optionsSource['columns_tablet']),
                'mobile' => $this->calculateGrid($optionsSource['columns_mobile']),
            ];
            $widgetOptions['itemsPerColumn'] = \IqitElementorWpHelper::absint($optionsSource['items_per_column']);
        }

        if ($optionsSource['view'] == 'carousel') {
            $widgetOptions = array_merge(
                $widgetOptions,
                $this->build_carousel_options($optionsSource)
            );
        }

        return $widgetOptions;
    }

    public function calculateGrid($nb)
    {
        if ($nb == 0) {
            $nb = 1;
        }

        if ($nb == 5) {
            $nb = 15;
        } else {
            $nb = (12 / $nb);
        }

        return $nb;
    }
}
