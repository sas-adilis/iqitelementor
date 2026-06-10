<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.4.5 — Manufacturer content is now stored directly in
 * manufacturer_lang.description instead of a dedicated
 * iqit_elementor_content row.
 *
 * This upgrade:
 *   1. Copies existing Elementor JSON from iqit_elementor_content_lang.data
 *      into manufacturer_lang.description for every matching language.
 *   2. Deletes the now-obsolete iqit_elementor_content rows that were linked
 *      to the displayManufacturerElementor hook.
 */
function upgrade_module_1_4_5($module)
{
    $hookId = (int) Hook::getIdByName('displayManufacturerElementor');

    if (!$hookId) {
        return true;
    }

    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    // Step 1: Copy Elementor data into manufacturer_lang.description
    // for each (manufacturer, language) combination.
    // manufacturer_lang has no id_shop column — group by lang to avoid
    // duplicates when iqit_elementor_content_lang has multiple shop rows.
    $rows = $db->executeS(
        'SELECT c.`id_object` AS id_manufacturer, '
        . 'cl.`id_lang`, cl.`data` '
        . 'FROM `' . $prefix . 'iqit_elementor_content` c '
        . 'INNER JOIN `' . $prefix . 'iqit_elementor_content_lang` cl '
        . '  ON c.`id_elementor` = cl.`id_elementor` '
        . 'WHERE c.`hook` = ' . $hookId . ' '
        . '  AND cl.`data` IS NOT NULL '
        . '  AND cl.`data` != \'\' '
        . '  AND cl.`data` != \'[]\' '
        . 'GROUP BY c.`id_object`, cl.`id_lang`'
    );

    if (is_array($rows) && count($rows) > 0) {
        foreach ($rows as $row) {
            $db->execute(
                'UPDATE `' . $prefix . 'manufacturer_lang` '
                . 'SET `description` = \'' . pSQL($row['data'], true) . '\' '
                . 'WHERE `id_manufacturer` = ' . (int) $row['id_manufacturer'] . ' '
                . '  AND `id_lang` = ' . (int) $row['id_lang']
            );
        }
    }

    // Step 2: Delete the obsolete iqit_elementor_content rows for manufacturers.
    $elementorIds = $db->executeS(
        'SELECT `id_elementor` FROM `' . $prefix . 'iqit_elementor_content` '
        . 'WHERE `hook` = ' . $hookId
    );

    if (is_array($elementorIds) && count($elementorIds) > 0) {
        $ids = array_map(function ($r) {
            return (int) $r['id_elementor'];
        }, $elementorIds);
        $idList = implode(',', $ids);

        $db->execute('DELETE FROM `' . $prefix . 'iqit_elementor_content_lang` WHERE `id_elementor` IN (' . $idList . ')');
        $db->execute('DELETE FROM `' . $prefix . 'iqit_elementor_content_shop` WHERE `id_elementor` IN (' . $idList . ')');
        $db->execute('DELETE FROM `' . $prefix . 'iqit_elementor_content` WHERE `id_elementor` IN (' . $idList . ')');
    }

    return true;
}
