<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.4.8 — Add the `object_type` discriminator column to
 * `iqit_elementor_content` and backfill existing rows.
 *
 * The column is a stable, human-readable label ("manufacturer", "cms",
 * "blog", "product", "category", "home", "content") that complements the
 * variable-by-install `hook` column (which stores the PrestaShop Hook ID
 * — an integer that differs from one PS install to another).
 *
 * Why both columns coexist:
 *   - `hook`        → consumed at render time to dispatch into the right
 *                     PrestaShop hook callback. Must match the live ID.
 *   - `object_type` → human-readable filter for migrations, reporting,
 *                     and inspection. Stable across installs.
 *
 * After this upgrade the application code (Targets / Renderers) writes
 * `object_type` automatically on every save.
 *
 * Idempotent: the schema check skips the ALTER TABLE if the column is
 * already present, and the backfill UPDATEs only rows whose `object_type`
 * is still empty.
 */
function upgrade_module_1_4_8($module)
{
    _iqitelementor_148_ensure_object_type_column();
    _iqitelementor_148_backfill_object_type();

    return true;
}

function _iqitelementor_148_ensure_object_type_column()
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    $columns = $db->executeS('SHOW COLUMNS FROM `' . $prefix . 'iqit_elementor_content` LIKE "object_type"');
    if (is_array($columns) && !empty($columns)) {
        return;
    }

    $db->execute(
        'ALTER TABLE `' . $prefix . 'iqit_elementor_content` '
        . 'ADD COLUMN `object_type` VARCHAR(64) NOT NULL DEFAULT "" AFTER `id_object`'
    );
}

function _iqitelementor_148_backfill_object_type()
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    $hookToType = array(
        'displayManufacturerElementor' => 'manufacturer',
        'displayCMSDisputeInformation' => 'cms',
        'displayBlogElementor' => 'blog',
        'displayProductElementor' => 'product',
        'displayCategoryElementor' => 'category',
        'displayHome' => 'home',
    );

    foreach ($hookToType as $hookName => $type) {
        $hookId = (int) Hook::getIdByName($hookName);
        if (!$hookId) {
            continue;
        }
        $db->execute(
            'UPDATE `' . $prefix . 'iqit_elementor_content` '
            . 'SET `object_type` = "' . pSQL($type) . '" '
            . 'WHERE `hook` = "' . (int) $hookId . '" '
            . 'AND (`object_type` = "" OR `object_type` IS NULL)'
        );
    }

    // Anything else hook-bound (custom hooks → "content" widget pages) gets
    // a default of "content" so the column is never empty for inspection.
    $db->execute(
        'UPDATE `' . $prefix . 'iqit_elementor_content` '
        . 'SET `object_type` = "content" '
        . 'WHERE `object_type` = "" OR `object_type` IS NULL'
    );
}
