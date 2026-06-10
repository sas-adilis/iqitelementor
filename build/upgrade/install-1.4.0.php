<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Revision system and autosave columns.
 */
function upgrade_module_1_4_0($object)
{
    $db = Db::getInstance();

    // 1. Create revision table
    $sql = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'iqit_elementor_revision` (
        `id_iqit_elementor_revision` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        `entity_type`                VARCHAR(50)      NOT NULL,
        `entity_id`                  INT(10) UNSIGNED NOT NULL,
        `content`                    LONGTEXT         NOT NULL,
        `created_at`                 DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `label`                      VARCHAR(255)     NOT NULL DEFAULT \'\',
        `id_employee`                INT(10) UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (`id_iqit_elementor_revision`),
        KEY `idx_entity_date` (`entity_type`, `entity_id`, `created_at`)
    ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4';

    if (!$db->execute($sql)) {
        return false;
    }

    // 2. Add autosave columns to each content table
    $tables = [
        'iqit_elementor_landing',
        'iqit_elementor_template',
        'iqit_elementor_content',
        'iqit_elementor_category',
        'iqit_elementor_product',
    ];

    foreach ($tables as $table) {
        $fullTable = _DB_PREFIX_ . $table;

        // Check if column already exists to avoid errors on re-run
        $exists = $db->executeS(
            'SHOW COLUMNS FROM `' . bqSQL($fullTable) . '` LIKE \'autosave_content\''
        );
        if (!empty($exists)) {
            continue;
        }

        $alter = 'ALTER TABLE `' . bqSQL($fullTable) . '` '
            . 'ADD COLUMN `autosave_content` LONGTEXT NULL DEFAULT NULL, '
            . 'ADD COLUMN `autosave_at` DATETIME NULL DEFAULT NULL';

        if (!$db->execute($alter)) {
            return false;
        }
    }

    // 3. Register configuration
    if (Configuration::get('IQITELEMENTOR_REVISION_LIMIT') === false) {
        Configuration::updateValue('IQITELEMENTOR_REVISION_LIMIT', 20);
    }

    return true;
}
