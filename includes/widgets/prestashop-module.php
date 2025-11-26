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

namespace Elementor;
if (!defined('_PS_VERSION_')) {
    exit;
}

use Context;
use Db;
use Hook;
use IqitElementorWpHelper;
use Module;
use PrestaShop\PrestaShop\Core\Module\WidgetInterface;
use Shop;
use Validate;
use PrestaShopException;

/**
 * Class ElementorWidget_Modules
 */
class Widget_Prestashop_module extends Widget_Base
{

    /**
     * @var Context
     */
    public $context;

    public function get_id(): string
    {
        return 'prestashop_module';
    }

    public function get_title()
    {
        return IqitElementorWpHelper::__('Module', 'elementor');
    }

    public function get_icon(): string
    {
        return 'puzzle-piece';
    }

    public function get_categories(): array
    {
        return ['prestashop'];
    }

    protected function _register_controls()
    {
        $availableHooks = [];

        // Only compute available modules in editor context
        $availableModules = [];
        $this->context = Context::getContext();

        if (isset($this->context->controller->controller_name) && $this->context->controller->controller_name == 'IqitElementorEditor') {
            $availableModules = $this->getAvailableModules();
            $availableHooks = $this->getAvailableHooks();
        }

        $this->start_controls_section(
            'section_pswidget_options',
            [
                'label' => IqitElementorWpHelper::__('Widget settings', 'elementor'),
            ]
        );

        $this->add_control(
            'module',
            [
                'label' => IqitElementorWpHelper::__('Module', 'elementor'),
                'type' => Controls_Manager::SELECT,
                'label_block' => true,
                'default' => '0',
                'description' => IqitElementorWpHelper::__('This widget is only for advanced users. Some of modules may base on id etc. Issues related with this widget are not supported.', 'elementor'),
                'options' => $availableModules,
            ]
        );

        $this->add_control(
            'hook',
            [
                'label' => IqitElementorWpHelper::__('Hook', 'elementor'),
                'type' => Controls_Manager::SELECT2,
                'default' => 'displayHome',
                'label_block' => true,
                'description' => IqitElementorWpHelper::__('Make sure module support hook you selected.', 'elementor'),
                'options' => $availableHooks,
            ]
        );

        $this->end_controls_section();
    }

    public function render($instance = [])
    {

        if (empty($instance['module'])) {
            return;
        }

        $hook = !empty($instance['hook']) ? $instance['hook'] : 'displayHome';
        $module = $instance['module'];

        $content = $this->execModule($hook, [], $module, $this->context->shop->id);

        if (!empty($content)) {
            echo $content;
        }
    }

    public function parseOptions($optionsSource, $preview = false)
    {
        if (!$optionsSource['module']) {
            return [
                'content' => '',
            ];
        }

        $content = $this->execModule($optionsSource['hook'], [], $optionsSource['module'], $this->context->shop->id);

        return [
            'content' => $content,
        ];
    }

    public function getAvailableModules()
    {
        $excludeModules = ['ratingsproductlist', 'ph_simpleblog', 'themeinstallator', 'pluginadder',
            'iqitpluginadder', 'iqitelementor', 'iqitmegamenu', 'iqitcontentcreator', 'iqitcountdown', 'iqitpopup', 'iqitproducttags', 'iqitsizeguide',
            'iqitaddthisplugin', 'iqitblocksocial', 'iqitcontactpage', 'iqitcookielaw', 'iqitextendedproduct', 'iqitfreedeliverycount', 'iqitlinksmanager',
            'iqitproductsnav', 'iqitsocialslide', 'iqitthemeeditor', 'ps_mainmenu', 'ps_checkpayment', 'ps_currencyselector', 'ps_searchbar',
            'ps_facetedsearch', 'ps_languageselector', 'ps_shoppingcart', 'ps_customersignin',
            'pscleaner', 'revsliderprestashop', 'sekeywords', 'sendtoafriend', 'slidetopcontent', 'themeconfigurator', 'themeinstallator', 'trackingfront', 'watermark', 'videostab', 'yotpo', 'blocklayered', 'blocklayered_mod',
            'additionalproductstabs', 'addthisplugin', 'autoupgrade', 'sendtoafriend', 'bankwire', 'blockcart', 'blockcurrencies', 'blockcustomerprivacy', 'blocklanguages', 'blocksearch', 'blocksearch_mod', 'blocksharefb', 'blocktopmenu',
            'blockuserinfo', 'blockmyaccountfooter', 'carriercompare', 'cashondelivery', 'cheque', 'cookielaw', 'cronjobs', 'themeinstallator', 'crossselling', 'crossselling_mod', 'customcontactpage', 'dashactivity', 'dashgoals', 'dashproducts',
            'dashtrends', 'dateofdelivery', 'feeder', 'followup', 'gamification', 'ganalytics', 'gapi', 'graphnvd3', 'gridhtml', 'gsitemap', 'headerlinks', 'loyalty', 'mailalerts', 'manufacturertab', 'newsletter', 'onboarding', 'pagesnotfound', 'paypal', 'productcomments', 'productscategory',
            'productsmanufacturer', 'productsnavpn', 'producttooltip', 'referralprogram', 'statsbestcategories', 'statsbestcustomers', 'statsbestmanufacturers', 'statsbestproducts', 'statsbestsuppliers', 'statsbestvouchers', 'statscarrier', 'statscatalog', 'statscheckup',
            'statsdata', 'statsequipment', 'statsforecast', 'statslive', 'statsnewsletter', 'statsorigin', 'statspersonalinfos', 'statsproduct', 'statsregistrations', 'statssales', 'statssalesqty', 'statssearch', 'statsstock',
            'statsvisits', 'themeconfigurator', 'uecookie', 'blockwishlist', 'productpaymentlogos'];

        $modules = Db::getInstance()->executeS('
		SELECT m.id_module, m.name
		FROM `' . _DB_PREFIX_ . 'module` m
		' . Shop::addSqlAssociation('module', 'm') . '
	    WHERE m.`name` NOT IN (\'' . implode("','", $excludeModules) . '\') ');


        $modulesHook = [];
        $modulesHook[0] = IqitElementorWpHelper::__('Select module', 'elementor');
        foreach ($modules as $key => $module) {
            $moduleInstance = Module::getInstanceByName($module['name']);

            if (Validate::isLoadedObject($moduleInstance)) {
                $modulesHook[$module['name']] = $module['name'];
            }
        }

        return $modulesHook;
    }

    public function execModule($hook_name, $hook_args = [], $id_module = null, $id_shop = null)
    {
        // Check arguments validity
        if (!Validate::isHookName($hook_name)) {
            throw new PrestaShopException('Invalid id_module or hook_name');
        }

        // Check if hook exists
        if (!$id_hook = Hook::getIdByName($hook_name)) {
            return false;
        }

        // Store list of executed hooks on this page
        Hook::$executed_hooks[$id_hook] = $hook_name;
        $context = Context::getContext();
        if (!isset($hook_args['cookie']) || !$hook_args['cookie']) {
            $hook_args['cookie'] = $context->cookie;
        }
        if (!isset($hook_args['cart']) || !$hook_args['cart']) {
            $hook_args['cart'] = $context->cart;
        }

        $altern = 0;
        $output = '';

        $different_shop = false;

        if ($id_shop !== null && Validate::isUnsignedId($id_shop) && $id_shop != $context->shop->getContextShopID()) {
            $old_context = $context->shop->getContext();
            $old_shop = clone $context->shop;
            $shop = new Shop((int)$id_shop);
            if (Validate::isLoadedObject($shop)) {
                $context->shop = $shop;
                $context->shop->setContext(Shop::CONTEXT_SHOP, $shop->id);
                $different_shop = true;
            }
        }

        if (!($moduleInstance = Module::getInstanceByName($id_module))) {
            return false;
        }

        // Check which / if method is callable
        $hook_callable = is_callable([$moduleInstance, 'hook' . $hook_name]);

        if ($hook_callable) {
            $hook_args['altern'] = ++$altern;
            // Call hook method
            $display = Hook::coreCallHook($moduleInstance, 'hook' . $hook_name, $hook_args);
            $output .= $display;
        } elseif (Hook::isDisplayHookName($hook_name)) {
            if ($moduleInstance instanceof WidgetInterface) {
                try {
                    $display = Hook::coreRenderWidget($moduleInstance, $hook_name, $hook_args);
                } catch (Exception $e) {
                    $display = '';
                }
                $output .= $display;
            }
        }

        if ($different_shop) {
            $context->shop = $old_shop;
            $context->shop->setContext($old_context, $shop->id);
        }

        return $output;
    }

    private function getAvailableHooks()
    {
        $hooks = Db::getInstance()->executeS('
          SELECT name FROM '._DB_PREFIX_.'hook WHERE name LIKE "display%" 
        ');

        $result = [];
        foreach ($hooks as $hook) {
            $result[$hook['name']] = $hook['name'];
        }

        return $result;
    }
}
