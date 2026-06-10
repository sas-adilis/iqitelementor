<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Replace widget_default table with widget_style table (multiple named styles).
 */
function upgrade_module_1_4_3($object)
{
    $db = Db::getInstance();

    // Drop old single-default table created in 1.4.2
    $db->execute(
        'DROP TABLE IF EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_widget_default`'
    );

    return $db->execute(
        'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_widget_style` (
            `id_widget_style` int(10) unsigned NOT NULL AUTO_INCREMENT,
            `id_shop` int(10) unsigned NOT NULL DEFAULT 1,
            `widget_type` varchar(128) NOT NULL,
            `name` varchar(255) NOT NULL,
            `settings` longtext NOT NULL,
            `is_default` tinyint(1) unsigned NOT NULL DEFAULT 0,
            `date_add` datetime NOT NULL,
            `date_upd` datetime NOT NULL,
            PRIMARY KEY (`id_widget_style`),
            KEY `idx_shop_widget` (`id_shop`, `widget_type`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4'
    );
}
