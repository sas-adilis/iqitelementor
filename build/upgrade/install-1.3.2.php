<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Renames the editor admin controller tab from IqitElementorEditor
 * to AdminIqitElementorEditor in ps_tab, ps_authorization_role and ps_access.
 */
function upgrade_module_1_3_2($object)
{
    $oldName = 'IqitElementorEditor';
    $newName = 'AdminIqitElementorEditor';
    $oldSlug = Tools::strtoupper($oldName);
    $newSlug = Tools::strtoupper($newName);

    // 1. Update ps_tab
    $id_tab = (int) Tab::getIdFromClassName($oldName);
    if ($id_tab) {
        $tab = new Tab($id_tab);
        $tab->class_name = $newName;
        $tab->update();
    }

    // 2. Update ps_authorization_role slugs
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
