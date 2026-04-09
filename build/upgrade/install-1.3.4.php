<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Add SEO fields (meta_title, meta_description, link_rewrite) and active column to landing pages.
 * Register moduleRoutes hook. Rename tab to "Landing pages".
 */
function upgrade_module_1_3_4($object)
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    // Add active column to main table
    $db->execute(
        'ALTER TABLE `' . $prefix . 'iqit_elementor_landing` ADD COLUMN `active` tinyint(1) unsigned NOT NULL DEFAULT 1'
    );

    // Add SEO columns to lang table
    $db->execute(
        'ALTER TABLE `' . $prefix . 'iqit_elementor_landing_lang`
         ADD COLUMN `meta_title` varchar(255) DEFAULT NULL,
         ADD COLUMN `meta_description` varchar(512) DEFAULT NULL,
         ADD COLUMN `link_rewrite` varchar(128) DEFAULT NULL'
    );

    // Auto-generate link_rewrite from title for existing landing pages
    $landings = $db->executeS(
        'SELECT id_iqit_elementor_landing, title FROM `' . $prefix . 'iqit_elementor_landing`'
    );
    if (is_array($landings)) {
        foreach ($landings as $landing) {
            $rewrite = Tools::str2url($landing['title']);
            $db->execute(
                'UPDATE `' . $prefix . 'iqit_elementor_landing_lang`
                 SET `link_rewrite` = \'' . pSQL($rewrite) . '\'
                 WHERE `id_iqit_elementor_landing` = ' . (int) $landing['id_iqit_elementor_landing'] . '
                 AND (`link_rewrite` IS NULL OR `link_rewrite` = \'\')'
            );
        }
    }

    // Register moduleRoutes hook
    $object->registerHook('moduleRoutes');

    // Rename tab "Homepage/General options" → "Landing pages"
    $idTab = (int) Tab::getIdFromClassName('AdminIqitElementor');
    if ($idTab) {
        $tab = new Tab($idTab);
        $languages = Language::getLanguages(false);
        foreach ($languages as $lang) {
            $tab->name[$lang['id_lang']] = 'Landing pages';
        }
        $tab->save();
    }

    return true;
}
