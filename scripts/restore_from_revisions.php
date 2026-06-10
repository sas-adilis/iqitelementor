<?php
/**
 * Restore Elementor content from the latest revision.
 *
 * For every row in `iqit_elementor_content`, look up the most recent entry
 * in `iqit_elementor_revision` matching (entity_type = object_type,
 * entity_id = id_object), and overwrite `iqit_elementor_content_lang.data`
 * with the revision's content (across every existing lang/shop pair).
 *
 * Use case: roll back to the last user-saved version after a botched
 * migration, an editor crash, or a manual SQL accident.
 *
 * Run from CLI at the PrestaShop root:
 *   php modules/iqitelementor/scripts/restore_from_revisions.php
 *
 * Or via browser (logged-in employee or with a shared secret):
 *   /modules/iqitelementor/scripts/restore_from_revisions.php?secret=XYZ
 *
 * Modes:
 *   --dry-run  (default) report only, do NOT write the DB
 *   --apply    write the revisions back to iqit_elementor_content_lang
 *   --verbose  print the revision id + created_at + first 80 chars of content
 *   --only=manufacturer,cms,blog
 *              restrict to specific object_type values (csv, defaults to all)
 *
 * Exit codes:
 *   0 — no errors
 *   1 — environment / bootstrap error
 */

// ---------- CLI / web bootstrap ----------------------------------------------

$cli = (php_sapi_name() === 'cli');
$argv = $cli ? (array) $argv : array();

$dryRun = !in_array('--apply', $argv, true);
$verbose = in_array('--verbose', $argv, true);

$onlyTypes = array();
foreach ($argv as $arg) {
    if (strpos($arg, '--only=') === 0) {
        $onlyTypes = array_filter(array_map('trim', explode(',', substr($arg, 7))));
    }
}

if (!$cli) {
    $secret = isset($_GET['secret']) ? (string) $_GET['secret'] : '';
    $expected = getenv('IQIT_RESTORE_SECRET');
    if ($expected === false || $expected === '' || !hash_equals($expected, $secret)) {
        http_response_code(403);
        exit('Forbidden');
    }
    $dryRun = !isset($_GET['apply']);
    $verbose = isset($_GET['verbose']);
    if (isset($_GET['only'])) {
        $onlyTypes = array_filter(array_map('trim', explode(',', (string) $_GET['only'])));
    }
    header('Content-Type: text/plain; charset=utf-8');
}

$root = realpath(__DIR__ . '/../../..');
if (!$root || !is_file($root . '/config/config.inc.php')) {
    fwrite(STDERR, "Cannot locate PrestaShop config.inc.php from " . __DIR__ . "\n");
    exit(1);
}
require_once $root . '/config/config.inc.php';

// ---------- Main -------------------------------------------------------------

$db = Db::getInstance();
$prefix = _DB_PREFIX_;

println("== Restore Elementor content from latest revisions ==");
println("Mode: " . ($dryRun ? "DRY-RUN (no writes)" : "APPLY"));
if (!empty($onlyTypes)) {
    println("Filter object_type: " . implode(', ', $onlyTypes));
}
println("");

// 1. Collect every (id_elementor, id_object, object_type) we need to inspect.
$contentRows = $db->executeS(
    'SELECT `id_elementor`, `id_object`, `object_type` '
    . 'FROM `' . $prefix . 'iqit_elementor_content` '
    . 'WHERE `id_object` > 0 AND `object_type` != ""'
);

if (!is_array($contentRows) || empty($contentRows)) {
    println("No iqit_elementor_content rows with id_object + object_type. Nothing to do.");
    exit(0);
}

$stats = array(
    'scanned' => 0,
    'filtered' => 0,
    'no_revision' => 0,
    'restored' => 0,
    'lang_rows_updated' => 0,
);

$skipped = array();

foreach ($contentRows as $row) {
    $stats['scanned']++;

    $idElementor = (int) $row['id_elementor'];
    $idObject = (int) $row['id_object'];
    $objectType = (string) $row['object_type'];

    if (!empty($onlyTypes) && !in_array($objectType, $onlyTypes, true)) {
        $stats['filtered']++;
        continue;
    }

    // 2. Latest revision for this entity.
    $revision = $db->getRow(
        'SELECT `id_iqit_elementor_revision` AS id, `content`, `created_at`, `label` '
        . 'FROM `' . $prefix . 'iqit_elementor_revision` '
        . 'WHERE `entity_type` = "' . pSQL($objectType) . '" '
        . 'AND `entity_id` = ' . $idObject . ' '
        . 'ORDER BY `created_at` DESC, `id_iqit_elementor_revision` DESC'
    );

    if (!$revision || empty($revision['content'])) {
        $stats['no_revision']++;
        $skipped[] = sprintf('  - id_elementor=%d type=%s id_object=%d (no revision)', $idElementor, $objectType, $idObject);
        continue;
    }

    $content = (string) $revision['content'];

    println(sprintf(
        '[RESTORE] id_elementor=%d type=%s id_object=%d ← revision #%d (%s%s)',
        $idElementor,
        $objectType,
        $idObject,
        (int) $revision['id'],
        (string) $revision['created_at'],
        $revision['label'] !== '' ? ', label=' . $revision['label'] : ''
    ));
    if ($verbose) {
        println('  preview: ' . shorten($content, 200));
    }

    // 3. Find existing (lang, shop) pairs for this id_elementor and overwrite.
    $langRows = $db->executeS(
        'SELECT `id_lang`, `id_shop` '
        . 'FROM `' . $prefix . 'iqit_elementor_content_lang` '
        . 'WHERE `id_elementor` = ' . $idElementor
    );

    if (!is_array($langRows) || empty($langRows)) {
        // No lang row yet — create one for the default lang & shop so the
        // entity becomes renderable.
        $defaultLang = (int) Configuration::get('PS_LANG_DEFAULT');
        $defaultShop = (int) Configuration::get('PS_SHOP_DEFAULT');
        $langRows = array(
            array('id_lang' => $defaultLang, 'id_shop' => $defaultShop),
        );
    }

    if (!$dryRun) {
        foreach ($langRows as $langRow) {
            $idLang = (int) $langRow['id_lang'];
            $idShop = (int) $langRow['id_shop'];

            $exists = (int) $db->getValue(
                'SELECT 1 FROM `' . $prefix . 'iqit_elementor_content_lang` '
                . 'WHERE id_elementor = ' . $idElementor
                . ' AND id_lang = ' . $idLang
                . ' AND id_shop = ' . $idShop
            );

            if ($exists) {
                $db->update(
                    'iqit_elementor_content_lang',
                    array('data' => pSQL($content, true)),
                    'id_elementor = ' . $idElementor
                        . ' AND id_lang = ' . $idLang
                        . ' AND id_shop = ' . $idShop
                );
            } else {
                $db->insert(
                    'iqit_elementor_content_lang',
                    array(
                        'id_elementor' => $idElementor,
                        'id_lang' => $idLang,
                        'id_shop' => $idShop,
                        'data' => pSQL($content, true),
                    )
                );
            }
            $stats['lang_rows_updated']++;
        }
    } else {
        $stats['lang_rows_updated'] += count($langRows);
    }

    $stats['restored']++;
}

println('');
println('== Summary ==');
foreach ($stats as $k => $v) {
    println(sprintf('  %-20s %d', $k, $v));
}

if (!empty($skipped) && $verbose) {
    println('');
    println('Skipped (no revision found):');
    foreach ($skipped as $line) {
        println($line);
    }
}

if ($dryRun && $stats['restored'] > 0) {
    println('');
    println('Run again with --apply to persist the restoration.');
}

// ---------- Helpers ----------------------------------------------------------

function shorten($s, $n = 200)
{
    $s = preg_replace('/\s+/', ' ', (string) $s);

    return mb_strlen((string) $s) > $n ? mb_substr((string) $s, 0, $n) . '…' : (string) $s;
}

function println($line)
{
    echo $line . "\n";
}
