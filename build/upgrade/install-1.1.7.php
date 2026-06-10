<?php
/**
 * 2007-2015 IQIT-COMMERCE.COM
 *
 * NOTICE OF LICENSE
 *
 * @author    IQIT-COMMERCE.COM <support@iqit-commerce.com>
 * @copyright 2007-2015 IQIT-COMMERCE.COM
 * @license   GNU General Public License version 2
 *
 * You can not resell or redistribute this software.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_1_7($object)
{
    $object->registerHook('displayManufacturerElementor');

    Db::getInstance()->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . "iqit_elementor_content` (
    `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
      `id_object` int(10) UNSIGNED NOT NULL DEFAULT 0,
      `title` varchar(255) NOT NULL DEFAULT '',
      `hook` varchar(255) NOT NULL DEFAULT '',
      `active` tinyint(1) unsigned NOT NULL,
      PRIMARY KEY (`id_elementor`, `id_object`)
    ) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4");

    Db::getInstance()->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_content_lang` (
    `id_elementor` int(10) UNSIGNED NOT NULL,
      `id_lang` int(10) UNSIGNED NOT NULL,
      `id_shop` int(10) unsigned NOT NULL,
      `data` longtext default NULL,
      PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)
    ) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4 ');

    Db::getInstance()->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_content_shop` (
    `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
      `id_shop` int(10) unsigned NOT NULL,
      PRIMARY KEY (`id_elementor`, `id_shop`)
    ) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4 ');

    $object->uninstallTab();
    $object->installTab();

    Db::getInstance()->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_category_shop` (
    `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
      `id_shop` int(10) unsigned NOT NULL,
      `just_elementor` int(10) UNSIGNED default NULL,
      PRIMARY KEY (`id_elementor`, `id_shop`)
    ) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4');

    Db::getInstance()->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_product_shop` (
    `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
      `id_shop` int(10) unsigned NOT NULL,
      PRIMARY KEY (`id_elementor`, `id_shop`)
    ) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4');

    Db::getInstance()->execute('ALTER TABLE `' . _DB_PREFIX_ . 'iqit_elementor_product_lang`
	ADD COLUMN `id_shop` int(10) unsigned NOT NULL');

    Db::getInstance()->execute('ALTER TABLE `' . _DB_PREFIX_ . 'iqit_elementor_product_lang`
	    DROP PRIMARY KEY, ADD PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)');

    Db::getInstance()->execute('ALTER TABLE `' . _DB_PREFIX_ . 'iqit_elementor_category_lang`
	ADD COLUMN `id_shop` int(10) unsigned NOT NULL');

    Db::getInstance()->execute('ALTER TABLE `' . _DB_PREFIX_ . 'iqit_elementor_category_lang`
	    DROP PRIMARY KEY, ADD PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)');

    $shops = Shop::getShopsCollection();
    // update data in elementor_product_shop
    $sql = new DbQuery();
    $sql->select('id_elementor');
    $sql->from('iqit_elementor_product', 'iel');
    $sqlResult = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
    foreach ($sqlResult as $p) {
        foreach ($shops as $shop) {
            Db::getInstance()->insert('iqit_elementor_product_shop', [
                'id_elementor' => (int) $p['id_elementor'],
                'id_shop' => (int) $shop->id,
            ]);
        }
    }

    // update data in elementor_category_shop
    $sql = new DbQuery();
    $sql->select('id_elementor, just_elementor');
    $sql->from('iqit_elementor_category', 'iel');
    $sqlResult = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
    foreach ($sqlResult as $p) {
        foreach ($shops as $shop) {
            Db::getInstance()->insert('iqit_elementor_category_shop', [
                'id_elementor' => (int) $p['id_elementor'],
                'id_shop' => (int) $shop->id,
                'just_elementor' => (int) $p['just_elementor'],
            ]);
        }
    }

    // update data in elementor_product_lang
    $sql = new DbQuery();
    $sql->select('*');
    $sql->from('iqit_elementor_product_lang', 'iel');
    $sqlResult = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
    foreach ($sqlResult as $p) {
        $i = 0;
        foreach ($shops as $key => $shop) {
            if ($i == 0) {
                Db::getInstance()->update('iqit_elementor_product_lang', [
                    'id_shop' => (int) $shop->id,
                ], 'id_elementor = ' . (int) $p['id_elementor'] . ' AND id_lang = ' . (int) $p['id_lang']);
            } else {
                Db::getInstance()->insert('iqit_elementor_product_lang', [
                    'id_elementor' => (int) $p['id_elementor'],
                    'id_shop' => (int) $shop->id,
                    'id_lang' => (int) $p['id_lang'],
                    'data' => $p['data'],
                ]);
            }
            ++$i;
        }
    }

    // update data in elementor_category_lang
    $sql = new DbQuery();
    $sql->select('*');
    $sql->from('iqit_elementor_category_lang', 'iel');
    $sqlResult = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
    foreach ($sqlResult as $p) {
        $i = 0;
        foreach ($shops as $key => $shop) {
            if ($i == 0) {
                Db::getInstance()->update('iqit_elementor_category_lang', [
                    'id_shop' => (int) $shop->id,
                ], 'id_elementor = ' . (int) $p['id_elementor'] . ' AND id_lang = ' . (int) $p['id_lang']);
            } else {
                Db::getInstance()->insert('iqit_elementor_category_lang', [
                    'id_elementor' => (int) $p['id_elementor'],
                    'id_shop' => (int) $shop->id,
                    'id_lang' => (int) $p['id_lang'],
                    'data' => $p['data'],
                ]);
            }
            ++$i;
        }
    }

    return true;
}
