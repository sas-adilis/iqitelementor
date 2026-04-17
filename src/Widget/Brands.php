<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Traits\CarouselTrait;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

/**
 * Class ElementorWidget_Brands
 */
class Brands extends WidgetBase
{
    use CarouselTrait;

    /** @var \Context */
    public $context;

    /** @var int */
    public $status = 1;

    /** @var bool */
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

    /**
     * Identifiant unique du widget côté Elementor
     */
    public function getId(): string
    {
        return 'brands';
    }

    /**
     * Titre affiché dans la liste des widgets
     */
    public function getTitle(): string
    {
        return Translater::get()->l('Brands logos');
    }

    /**
     * Icône Elementor (classe CSS)
     */
    public function getIcon(): string
    {
        return 'carousel';
    }

    public function getCategories(): array
    {
        return [Translater::get()->l('Prestashop', 'elementor')];
    }

    /**
     * Enregistre les controls directement (sans passer par getForm())
     * (équivalent de ce que faisait l’ancien Widget_Prestashop)
     */
    protected function registerControls(): void
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
                FROM `' . \_DB_PREFIX_ . 'manufacturer` m 
                LEFT JOIN `' . \_DB_PREFIX_ . 'manufacturer_lang` ml ON (m.`id_manufacturer` = ml.`id_manufacturer` AND ml.`id_lang` = '
                . (int)$this->context->language->id . ') 
                LEFT OUTER JOIN `' . \_DB_PREFIX_ . 'manufacturer_shop` ms ON (m.`id_manufacturer` = ms.`id_manufacturer` 
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

        $brandsSelect[0] = Translater::get()->l('Show all');
        $brandsSelect[1] = Translater::get()->l('Manual select');

        $brandsOrder[0] = Translater::get()->l('Default');
        $brandsOrder[1] = Translater::get()->l('Alphabetical');

        foreach ($brands as $brand) {
            $brandsOptions[$brand['id_manufacturer']] = ['name' => $brand['name'], 'selectable' => true];
        }

        // Section principale du widget
        $this->addControl(
            'section_pswidget_options',
            [
                'label' => Translater::get()->l('Widget settings'),
                'type' => 'section',
            ]
        );

        // Contrôles simples
        $this->addControl(
            'brand_select',
            [
                'label' => Translater::get()->l('Selection'),
                'type' => 'select',
                'default' => '0',
                'label_block' => true,
                'options' => $brandsSelect,
                'section' => 'section_pswidget_options',
            ]
        );

        $this->addControl(
            'brand_order',
            [
                'label' => Translater::get()->l('Order'),
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

        $this->addControl(
            'brand_list',
            [
                'label' => Translater::get()->l('Brands'),
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

        $this->addControl(
            'image_format',
            [
                'label' => Translater::get()->l('Image format'),
                'type' => 'select',
                'default' => 'small_default',
                'section' => 'section_pswidget_options',
                'options' => $imagesTypesOptions,
            ]
        );

        $this->addControl(
            'view',
            [
                'label' => Translater::get()->l('View'),
                'type' => 'select',
                'default' => 'grid',
                'condition' => [
                    'view!' => 'default',
                ],
                'section' => 'section_pswidget_options',
                'options' => [
                    'carousel' => Translater::get()->l('Carousel'),
                    'grid' => Translater::get()->l('Grid'),
                ],
            ]
        );

        $this->addControl(
            'alignment',
            [
                'label' => Translater::get()->l('Alignment'),
                'type' => 'choose',
                'default' => '',
                'section' => 'section_pswidget_options',
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
                ],
            ]
        );

        // Contrôles responsives et supplémentaires
        $this->addResponsiveControl(
            'columns',
            [
                'label' => Translater::get()->l('Columns'),
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

        $this->addControl(
            'items_per_column',
            [
                'label' => Translater::get()->l('Rows'),
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

        $this->addControl(
            'section_carousel_options',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => 'section',
                'condition' => [
                    'view' => 'carousel',
                ],
            ]
        );

        $this->registerCarouselControls('section_carousel_options', [
            'view' => 'carousel',
        ]);

        $this->addControl(
            'section_carousel_styles',
            [
                'label' => Translater::get()->l('Carousel'),
                'type' => 'section',
                'tab' => 'style',
            ]
        );

        $this->registerCarouselStyles('section_carousel_styles', [
            'view' => 'carousel',
        ]);
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
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
            $widgetOptions['itemsPerColumn'] = Helper::absint($optionsSource['items_per_column']);
        }

        if ($optionsSource['view'] == 'carousel') {
            $widgetOptions = array_merge(
                $widgetOptions,
                $this->buildCarouselOptions($optionsSource)
            );
        }

        return $widgetOptions;
    }

    public function calculateGrid(int $nb): int
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
