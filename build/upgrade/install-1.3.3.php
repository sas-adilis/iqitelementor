<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Fix authorization roles after controller rename IqitElementorEditor → AdminIqitElementorEditor.
 */
function upgrade_module_1_3_3($object)
{
    $oldSlug = 'IQITELEMENTOREDITOR';
    $newSlug = 'ADMINIQITELEMENTOREDITOR';

    $suffixes = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    foreach ($suffixes as $suffix) {
        $oldRole = 'ROLE_MOD_TAB_' . $oldSlug . '_' . $suffix;
        $newRole = 'ROLE_MOD_TAB_' . $newSlug . '_' . $suffix;

        Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . 'authorization_role` SET `slug` = \'' . pSQL($newRole) . '\' WHERE `slug` = \'' . pSQL($oldRole) . '\''
        );
    }

    return true;
}
