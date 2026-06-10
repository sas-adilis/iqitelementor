<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Add id_employee column to revision table.
 */
function upgrade_module_1_4_1($object)
{
    $db = Db::getInstance();
    $table = _DB_PREFIX_ . 'iqit_elementor_revision';

    $exists = $db->executeS(
        'SHOW COLUMNS FROM `' . bqSQL($table) . '` LIKE \'id_employee\''
    );

    if (!empty($exists)) {
        return true;
    }

    return $db->execute(
        'ALTER TABLE `' . bqSQL($table) . '` '
        . 'ADD COLUMN `id_employee` INT(10) UNSIGNED NOT NULL DEFAULT 0'
    );
}
