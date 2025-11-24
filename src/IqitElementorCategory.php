<?php
/*
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
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2015 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

class IqitElementorCategory extends ObjectModel
{
    public $id;
    public $id_shop;
    public $id_elementor;
    public $id_category;
    public $just_elementor;

    // Lang fields
    public $data;

    /**
     * @see ObjectModel::$definition
     */
    public static $definition = [
        'table' => 'iqit_elementor_category',
        'primary' => 'id_elementor',
        'multilang' => true,
        'multilang_shop' => true,
        'fields' => [
            'id_category' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedInt', 'required' => true],
            'just_elementor' => ['type' => self::TYPE_INT,  'shop' => true],
            // Lang fields
            'data' => ['type' => self::TYPE_HTML,  'lang' => true, 'validate' => 'isJson'],
        ],
    ];

    public function __construct($id = null, $id_lang = null, $id_shop = null)
    {
        Shop::addTableAssociation('iqit_elementor_category', ['type' => 'shop']);
        Shop::addTableAssociation('iqit_elementor_category_lang', ['type' => 'fk_shop']);
        parent::__construct($id, $id_lang, $id_shop);
    }

    public function add($auto_date = true, $null_values = false)
    {
        $return = parent::add($auto_date, $null_values);

        return $return;
    }

    public function update($null_values = false, $position = false)
    {
        $return = parent::update($null_values);

        return $return;
    }

    public static function getIdByCategory($idCategory, $id_shop = null)
    {
        if (!Validate::isUnsignedInt($idCategory)) {
            return;
        }

        if ($id_shop) {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_category c LEFT JOIN ' . _DB_PREFIX_ . 'iqit_elementor_category_shop s ON c.id_elementor = s.id_elementor WHERE c.id_category = ' . (int) $idCategory . ' AND s.id_shop = ' . (int) $id_shop;
        } else {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_category c WHERE c.id_category = ' . (int) $idCategory;
        }

        $return = Db::getInstance()->getValue($sql);

        return $return;
    }

    public static function isJustElementor($idCategory)
    {
        if (!Validate::isUnsignedInt($idCategory)) {
            return;
        }

        $id = IqitElementorCategory::getIdByCategory($idCategory);
        $layoutObject = new IqitElementorCategory($id);

        return $layoutObject->just_elementor;
    }

    public static function setJustElementor($idCategory, $justElementor)
    {
        if (!Validate::isUnsignedInt($idCategory)) {
            return;
        }
        if (!Validate::isUnsignedInt($justElementor)) {
            return;
        }

        $id = IqitElementorCategory::getIdByCategory($idCategory);
        $layoutObject = new IqitElementorCategory($id);

        $layoutObject->just_elementor = $justElementor;
        $layoutObject->update();

        return true;
    }

    public static function deleteElement($idCategory)
    {
        if (!Validate::isUnsignedInt($idCategory)) {
            return;
        }
        $id = self::getIdByCategory($idCategory);
        if ($id) {
            Db::getInstance()->delete('iqit_elementor_category', 'id_elementor = ' . (int) $id);
            Db::getInstance()->delete('iqit_elementor_category_lang', 'id_elementor = ' . (int) $id);
            Db::getInstance()->delete('iqit_elementor_category_shop', 'id_elementor = ' . (int) $id);
        }
    }
}
