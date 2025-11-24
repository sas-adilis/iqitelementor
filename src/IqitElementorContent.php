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

class IqitElementorContent extends ObjectModel
{
    public $id;
    public $id_shop;
    public $id_elementor;
    public $id_object;
    public $title;
    public $hook;
    public $active;

    // Lang fields
    public $data;

    /**
     * @see ObjectModel::$definition
     */
    public static $definition = [
        'table' => 'iqit_elementor_content',
        'primary' => 'id_elementor',
        'multilang' => true,
        'multilang_shop' => true,
        'fields' => [
            'id_object' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedInt'],
            'title' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 255],
            'hook' => ['type' => self::TYPE_STRING, 'validate' => 'isHookName', 'required' => true],
            'active' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedInt'],
            // Lang fields
            'data' => ['type' => self::TYPE_HTML,  'lang' => true, 'validate' => 'isJson'],
        ],
    ];

    public function __construct($id = null, $id_lang = null, $id_shop = null)
    {
        Shop::addTableAssociation('iqit_elementor_content', ['type' => 'shop']);
        Shop::addTableAssociation('iqit_elementor_content_lang', ['type' => 'fk_shop']);
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

    public static function getSelectableHooks()
    {
        $usableHooks = ['displayBanner', 'displayHeaderLeft', 'displayProductAfterTabs', 'displayShoppingCartFooter', 'displayHeaderCategory', 'displayAboveMobileMenu', 'displayBelowMobileMenu',
            'displayFooterProduct', 'displayAboveProductsTabs', 'displayMyAccountDashboard', 'displayCheckoutFooter', 'displayShoppingCart', 'displayFooter', 'displayFooterBefore', 'displayFooterAfter',
            'displayLeftColumn', 'displayRightColumn',  'displayWrapperTopInContainer', 'displayWrapperTop',  'displayWrapperBottom', 'displayWrapperBottomInContainer',
            'displayCartAjaxInfoModal', 'displayCartAjaxInfoBlock', 'displayTop', 'displayHeaderTop', 'displayNotFound',
            'displayReassurance', 'displayRightColumnProduct', 'displayAfterProductThumbs2',  'displayProductAdditionalInfo',  'displayBelowHeader', 'displayBelowProductsCategory', 'displayCustomerLoginFormAfter'];

        $sql = 'SELECT h.id_hook as id, h.name as name
                FROM ' . _DB_PREFIX_ . "hook h
                WHERE (lower(h.`name`) LIKE 'display%')
                ORDER BY h.name ASC
            ";
        $hooks = Db::getInstance()->executeS($sql);

        foreach ($hooks as $key => $hook) {
            if (preg_match('/admin/i', $hook['name'])
                || preg_match('/backoffice/i', $hook['name'])) {
                unset($hooks[$key]);
            } else {
                if (!in_array($hook['name'], $usableHooks)) {
                    unset($hooks[$key]);
                }
            }
        }

        return $hooks;
    }

    public static function getCountByIdHook($id_hook)
    {
        $sql = 'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'iqit_elementor_content
                    WHERE `hook` = ' . (int) $id_hook;

        return Db::getInstance()->getValue($sql);
    }

    public static function getByHook($hook, $id_shop = null)
    {
        if (!Validate::isUnsignedInt($hook)) {
            return;
        }

        if ($id_shop) {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_content c LEFT JOIN ' . _DB_PREFIX_ . 'iqit_elementor_content_shop s ON c.id_elementor = s.id_elementor WHERE c.active = 1 AND c.hook = ' . (int) $hook . ' AND s.id_shop = ' . (int) $id_shop;
        } else {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_content c WHERE c.active = 1 AND c.hook = ' . (int) $hook;
        }

        $return = Db::getInstance()->executeS($sql);

        return $return;
    }

    public static function getIdByObjectAndHook($hook, $idObject, $id_shop = null)
    {
        if (!Validate::isUnsignedInt($hook)) {
            return;
        }

        if ($id_shop) {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_content c LEFT JOIN ' . _DB_PREFIX_ . 'iqit_elementor_content_shop s ON c.id_elementor = s.id_elementor WHERE c.id_object = ' . $idObject . ' AND c.hook = ' . (int) $hook . ' AND s.id_shop = ' . (int) $id_shop;
        } else {
            $sql = 'SELECT c.id_elementor FROM ' . _DB_PREFIX_ . 'iqit_elementor_content c WHERE c.id_object = ' . $idObject . ' AND c.hook = ' . (int) $hook;
        }

        $return = Db::getInstance()->getValue($sql);

        return $return;
    }

    public static function deleteElement($idElementor)
    {
        if (!Validate::isUnsignedInt($idElementor)) {
            return;
        }
        Db::getInstance()->delete('iqit_elementor_content', 'id_elementor = ' . (int) $idElementor);
        Db::getInstance()->delete('iqit_elementor_content_lang', 'id_elementor = ' . (int) $idElementor);
        Db::getInstance()->delete('iqit_elementor_content_shop', 'id_elementor = ' . (int) $idElementor);
    }
}
