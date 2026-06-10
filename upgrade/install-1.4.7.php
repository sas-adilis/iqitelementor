<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.4.7 — Move Manufacturer / CMS / Blog Elementor JSON OUT of native
 * `TYPE_HTML` columns back into the dedicated `iqit_elementor_content`
 * storage.
 *
 * Why: PrestaShop 8's BO standard form attaches TinyMCE to those fields
 * (via the `autoload_rte` class) and TinyMCE re-serialises the iframe DOM
 * on form submit, mangling JSON-as-HTML (`\"` → `\&quot;`, paragraph
 * splits, etc.). HTMLPurifier (when active) does the same on the server.
 * Both pipelines are unavoidable on a `TYPE_HTML` + `validate => isCleanHtml`
 * column. Moving the JSON to a dedicated `longtext` column avoids the
 * entire chain.
 *
 * The upgrade migrates three native columns:
 *   - manufacturer_lang.description     → hook = displayManufacturerElementor
 *   - cms_lang.content                  → hook = displayCMSDisputeInformation
 *   - simpleblog_post_lang.content      → hook = displayBlogElementor
 *
 * For each row whose value contains the Elementor `"elType"` discriminator
 * we (a) try to repair already-mangled bytes via the same passes as
 * `scripts/repair_manufacturer_descriptions.php`, (b) write the result into
 * `iqit_elementor_content_lang.data`, and (c) empty the source column.
 *
 * Idempotent: re-running on already-migrated content is a no-op (source
 * columns are empty so nothing matches the discriminator).
 */
function upgrade_module_1_4_7($module)
{
    $migrations = array(
        'displayManufacturerElementor' => array(
            'table' => 'manufacturer_lang',
            'pk' => 'id_manufacturer',
            'column' => 'description',
        ),
        'displayCMSDisputeInformation' => array(
            'table' => 'cms_lang',
            'pk' => 'id_cms',
            'column' => 'content',
        ),
        'displayBlogElementor' => array(
            'table' => 'simpleblog_post_lang',
            'pk' => 'id_simpleblog_post',
            'column' => 'content',
        ),
    );

    foreach ($migrations as $hookName => $config) {
        _iqitelementor_147_migrate_table($module, $hookName, $config);
    }

    return true;
}

function _iqitelementor_147_migrate_table($module, $hookName, $config)
{
    $db = Db::getInstance();
    $prefix = _DB_PREFIX_;

    // Skip silently when the source table doesn't exist (e.g. simpleblog
    // module not installed). SHOW TABLES is fast and avoids fatal errors.
    $exists = $db->executeS("SHOW TABLES LIKE '" . pSQL($prefix . $config['table']) . "'");
    if (!is_array($exists) || empty($exists)) {
        return;
    }

    $hookId = (int) Hook::getIdByName($hookName);
    if (!$hookId) {
        $module->registerHook($hookName);
        $hookId = (int) Hook::getIdByName($hookName);
        if (!$hookId) {
            return;
        }
    }

    $rows = $db->executeS(
        'SELECT `' . bqSQL($config['pk']) . '`, `id_lang`, `' . bqSQL($config['column']) . '` AS `value` '
        . 'FROM `' . $prefix . bqSQL($config['table']) . '` '
        . 'WHERE `' . bqSQL($config['column']) . "` IS NOT NULL "
        . 'AND `' . bqSQL($config['column']) . "` != ''"
    );

    if (!is_array($rows) || empty($rows)) {
        return;
    }

    $shopIds = Shop::getShops(true, null, true);
    if (!is_array($shopIds) || empty($shopIds)) {
        $shopIds = array((int) Configuration::get('PS_SHOP_DEFAULT'));
    }

    $touched = array();

    foreach ($rows as $row) {
        $idObject = (int) $row[$config['pk']];
        $idLang = (int) $row['id_lang'];
        $raw = (string) $row['value'];

        if (!_iqitelementor_147_looks_like_elementor($raw)) {
            continue;
        }

        $repaired = _iqitelementor_147_repair($raw);
        if ($repaired === null) {
            // Persist the still-broken bytes; the merchant will re-edit
            // through the editor. Better than dropping content silently.
            $repaired = $raw;
        }

        // Raw SQL path — bypasses ObjectModel validation entirely. The
        // IqitElementorContent class declares `autosave_at` (TYPE_DATE,
        // isDate) and `autosave_content` (TYPE_HTML, isJson) without
        // `allow_null`, which can trip the validator during a fresh add()
        // when those fields are null. We don't need any of that machinery
        // here — we just want bytes in the table.

        $idElementor = (int) Db::getInstance()->getValue(
            'SELECT id_elementor FROM `' . $prefix . 'iqit_elementor_content` '
            . 'WHERE id_object = ' . (int) $idObject
            . ' AND hook = "' . pSQL((string) $hookId) . '"'
        );

        if (!$idElementor) {
            $db->insert('iqit_elementor_content', array(
                'id_object' => (int) $idObject,
                'title' => '',
                'hook' => (string) $hookId,
                'active' => 1,
                'autosave_content' => array('type' => 'sql', 'value' => 'NULL'),
                'autosave_at' => array('type' => 'sql', 'value' => 'NULL'),
            ));
            $idElementor = (int) $db->Insert_ID();

            if ($idElementor <= 0) {
                continue;
            }

            foreach ($shopIds as $shopId) {
                $db->insert('iqit_elementor_content_shop', array(
                    'id_elementor' => $idElementor,
                    'id_shop' => (int) $shopId,
                ), false, true, Db::INSERT_IGNORE);
            }
        }

        // Upsert the lang row for every shop (multilang_shop = true on
        // IqitElementorContent — the same payload is duplicated per shop).
        foreach ($shopIds as $shopId) {
            $existing = (int) Db::getInstance()->getValue(
                'SELECT 1 FROM `' . $prefix . 'iqit_elementor_content_lang` '
                . 'WHERE id_elementor = ' . $idElementor
                . ' AND id_lang = ' . (int) $idLang
                . ' AND id_shop = ' . (int) $shopId
            );

            if ($existing) {
                $db->update('iqit_elementor_content_lang', array(
                    'data' => pSQL($repaired, true),
                ), 'id_elementor = ' . $idElementor
                    . ' AND id_lang = ' . (int) $idLang
                    . ' AND id_shop = ' . (int) $shopId);
            } else {
                $db->insert('iqit_elementor_content_lang', array(
                    'id_elementor' => $idElementor,
                    'id_lang' => (int) $idLang,
                    'id_shop' => (int) $shopId,
                    'data' => pSQL($repaired, true),
                ));
            }
        }

        $touched[$idObject][$idLang] = true;
    }

    foreach ($touched as $idObject => $langs) {
        foreach (array_keys($langs) as $idLang) {
            $db->update(
                $config['table'],
                array($config['column'] => ''),
                bqSQL($config['pk']) . ' = ' . (int) $idObject . ' AND id_lang = ' . (int) $idLang
            );
        }
    }
}

// ---------- helpers ----------------------------------------------------------

function _iqitelementor_147_looks_like_elementor($raw)
{
    $candidate = preg_replace('#</?p[^>]*>#i', '', (string) $raw);
    $candidate = trim((string) $candidate);
    if ($candidate === '' || ($candidate[0] !== '[' && $candidate[0] !== '{')) {
        return false;
    }

    return strpos($candidate, '"elType"') !== false;
}

function _iqitelementor_147_repair($raw)
{
    $current = preg_replace('#</?p[^>]*>#i', '', (string) $raw);
    $current = str_replace(array("\r\n", "\n", "\r"), '', (string) $current);
    $current = trim((string) $current);

    $decoded = json_decode($current, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $current;
    }

    foreach (array('"\\&quot;', '\\&quot;"', '\\&quot;') as $needle) {
        if (strpos($current, $needle) !== false) {
            $current = str_replace($needle, '\\"', $current);
        }
    }
    $decoded = json_decode($current, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $current;
    }

    $current = _iqitelementor_147_repair_attr_quotes($current);
    $decoded = json_decode($current, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $current;
    }

    return null;
}

function _iqitelementor_147_repair_attr_quotes($json)
{
    $json = (string) preg_replace_callback(
        '#(\s)([\w:-]+)=(?<!\\\\)"([^"\\\\]*)(?<!\\\\)"#',
        function ($m) { return $m[1] . $m[2] . '=\\"' . $m[3] . '\\"'; },
        $json
    );

    $json = (string) preg_replace_callback(
        '#(=\\\\")([^"\\\\]*)(?<!\\\\)"#',
        function ($m) { return $m[1] . $m[2] . '\\"'; },
        $json
    );

    $json = (string) preg_replace_callback(
        '#(=)(?<!\\\\)"([^"\\\\]*)(\\\\")#',
        function ($m) { return $m[1] . '\\"' . $m[2] . $m[3]; },
        $json
    );

    return $json;
}
