<?php
/**
 * Repair Store descriptions corrupted by HTMLPurifier.
 *
 * Run from CLI at the PrestaShop root:
 *   php modules/iqitelementor/scripts/repair_store_descriptions.php
 *
 * Or via browser (logged-in employee with admin rights):
 *   /modules/iqitelementor/scripts/repair_store_descriptions.php?secret=XYZ
 *
 * Modes:
 *   --dry-run  (default) report only, do NOT write the DB
 *   --apply    write the repaired JSON back to store_lang.description
 *   --verbose  print full before/after for each broken row
 *
 * Repairs attempted, in order:
 *   1. Strip <p>/</p> tags everywhere + drop real newlines / carriage
 *      returns. Also kills HTMLPurifier-injected boolean-attribute spam
 *      on `<p>` (e.g. `<p right="">`, `<p left="">`).
 *   2. Replace `\&quot;` → `\"` (HTMLPurifier double-encoding artifact),
 *      handling the three bracketing variants: `"\&quot;`, `\&quot;"`,
 *      and standalone `\&quot;`.
 *   3. Re-escape unescaped `"` inside HTML attribute values embedded in
 *      JSON string literals. Three corruption shapes (A both raw,
 *      B open-escaped/close-raw, C open-raw/close-escaped) are each
 *      detected separately. Each pattern accepts `\X` escape sequences
 *      inside the value so attributes left in a mixed state by Pass 2
 *      (e.g. `style="0border-radius: 12px\";"`) get fully repaired.
 *
 * Anything still failing json_decode after the 3 passes is reported as
 * needs-manual and left untouched.
 */

const REPAIR_VERSION = '1.2';

// ---------- Bootstrap PrestaShop -----------------------------------------------
$cli = (php_sapi_name() === 'cli');
$argv = $cli ? $argv : [];

$dryRun = !in_array('--apply', $argv, true);
$verbose = in_array('--verbose', $argv, true);

if (!$cli) {
    // Web mode — require a secret to avoid drive-by execution.
    $secret = isset($_GET['secret']) ? (string) $_GET['secret'] : '';
    $expected = getenv('IQIT_REPAIR_SECRET');
    if ($expected === false || $expected === '' || !hash_equals($expected, $secret)) {
        http_response_code(403);
        exit('Forbidden');
    }
    $dryRun = !isset($_GET['apply']);
    $verbose = isset($_GET['verbose']);
    header('Content-Type: text/plain; charset=utf-8');
}

$root = realpath(__DIR__ . '/../../..');
if (!$root || !is_file($root . '/config/config.inc.php')) {
    fwrite(STDERR, "Cannot locate PrestaShop config.inc.php from " . __DIR__ . "\n");
    exit(1);
}
require_once $root . '/config/config.inc.php';

// ---------- Main ---------------------------------------------------------------
$db = Db::getInstance();
$prefix = _DB_PREFIX_;

$rows = $db->executeS(
    'SELECT `id_store`, `id_lang`, `description` '
    . 'FROM `' . $prefix . 'store_lang` '
    . "WHERE `description` IS NOT NULL AND `description` != ''"
);

$stats = [
    'scanned' => 0,
    'not_json' => 0,
    'already_valid' => 0,
    'repaired' => 0,
    'unrepairable' => 0,
];

$unrepairable = [];

println("== Repair Store descriptions (v" . REPAIR_VERSION . ") ==");
println("Mode: " . ($dryRun ? "DRY-RUN (no writes)" : "APPLY"));
println("Rows in store_lang with non-empty description: " . count($rows ?: []));
println("");

foreach ((array) $rows as $row) {
    $stats['scanned']++;
    $idS = (int) $row['id_store'];
    $idL = (int) $row['id_lang'];
    $raw = (string) $row['description'];

    // Quick filter: only consider rows that look like Elementor JSON
    // (the description field also legitimately holds plain HTML for
    // stores that are not edited with Elementor).
    $candidate = preg_replace('#</?p[^>]*>#i', '', $raw);
    $candidate = trim((string) $candidate);
    if ($candidate === '' || ($candidate[0] !== '[' && $candidate[0] !== '{')) {
        $stats['not_json']++;
        continue;
    }

    // Try the simple/strict path first.
    $result = tryDecode($raw);
    if ($result['ok']) {
        $stats['already_valid']++;
        continue;
    }

    // Apply incremental repair passes; report which one finally fixed it.
    $result = repair($raw);
    if ($result['ok']) {
        $stats['repaired']++;
        println(sprintf(
            "[REPAIRED] store=%d lang=%d via passes: %s",
            $idS,
            $idL,
            implode('+', $result['passes'])
        ));
        if ($verbose) {
            println("  before (200): " . shorten($raw));
            println("  after  (200): " . shorten($result['repaired']));
        }
        if (!$dryRun) {
            $db->update(
                'store_lang',
                ['description' => pSQL($result['repaired'], true)],
                'id_store = ' . $idS . ' AND id_lang = ' . $idL
            );
        }
        continue;
    }

    $stats['unrepairable']++;
    $unrepairable[] = ['id_store' => $idS, 'id_lang' => $idL, 'error' => $result['error']];
    println(sprintf(
        "[NEEDS MANUAL] store=%d lang=%d — last json_error: %s",
        $idS,
        $idL,
        $result['error']
    ));
    if ($verbose) {
        println("  raw (300):         " . shorten($raw, 300));
        println("  post-passes (300): " . shorten($result['post_passes'] ?? '', 300));
    }

    // Always dump the full post-passes content for offline inspection.
    $dumpDir = sys_get_temp_dir() . '/iqit_repair_store_dumps';
    if (!is_dir($dumpDir)) {
        @mkdir($dumpDir, 0700, true);
    }
    $rawPath = $dumpDir . sprintf('/store_%d_lang_%d.raw.txt', $idS, $idL);
    $postPath = $dumpDir . sprintf('/store_%d_lang_%d.post_passes.txt', $idS, $idL);
    @file_put_contents($rawPath, $raw);
    @file_put_contents($postPath, $result['post_passes'] ?? '');
    println(sprintf("  dumped raw  → %s", $rawPath));
    println(sprintf("  dumped post → %s", $postPath));
}

println("");
println("== Summary ==");
foreach ($stats as $k => $v) {
    println(sprintf("  %-15s %d", $k, $v));
}

if ($stats['unrepairable'] > 0) {
    println("");
    println("Manual list (id_store, id_lang):");
    foreach ($unrepairable as $u) {
        println(sprintf("  - %d / %d  (%s)", $u['id_store'], $u['id_lang'], $u['error']));
    }
}

if ($dryRun && $stats['repaired'] > 0) {
    println("");
    println("Run again with --apply to write the repairs to the DB.");
}

// ---------- Helpers ------------------------------------------------------------

function tryDecode(string $raw): array
{
    $stripped = stripWrappers($raw);
    $decoded = json_decode($stripped, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return ['ok' => true, 'json' => $stripped];
    }

    return ['ok' => false, 'error' => json_last_error_msg()];
}

function stripWrappers(string $raw): string
{
    $s = preg_replace('#</?p[^>]*>#i', '', $raw);
    $s = str_replace(["\r\n", "\n", "\r"], '', (string) $s);

    return trim((string) $s);
}

function repair(string $raw): array
{
    $passes = [];
    $current = $raw;

    // Pass 1 — strip wrappers + newlines (always safe, baseline)
    $current = stripWrappers($current);
    $passes[] = 'strip';
    $r = json_decode($current, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($r)) {
        return ['ok' => true, 'repaired' => $current, 'passes' => $passes];
    }

    // Pass 2 — collapse the HTMLPurifier double-quote pattern.
    //
    // Purifier sees `\"...\"` inside the JSON and reformats it as if it were
    // an HTML attribute, leaving these byte sequences in the DB:
    //
    //   "\&quot;   (extra raw " before the original \", then &quot; for the ")
    //   \&quot;"   (mirror at the closing side)
    //   \&quot;    (standalone — when only one side was reformatted)
    //
    // All three must collapse to `\"` (a valid JSON-escaped double quote).
    // Order matters: handle the bracketing cases before the standalone one so
    // the extra raw `"` is removed in the same step.
    $changed = false;
    foreach (['"\\&quot;', '\\&quot;"', '\\&quot;'] as $needle) {
        if (strpos($current, $needle) !== false) {
            $current = str_replace($needle, '\\"', $current);
            $changed = true;
        }
    }
    if ($changed) {
        $passes[] = 'fix-quot';
        $r = json_decode($current, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($r)) {
            return ['ok' => true, 'repaired' => $current, 'passes' => $passes];
        }
    }

    // Pass 3 — re-escape unescaped `"` inside HTML attributes embedded in
    // JSON string values. Heuristic, conservative: only rewrites quotes that
    // are clearly part of `<tag attr="..."` patterns and are NOT already
    // preceded by a backslash.
    $repaired = repairUnescapedAttrQuotes($current);
    if ($repaired !== $current) {
        $current = $repaired;
        $passes[] = 'fix-attr-quotes';
        $r = json_decode($current, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($r)) {
            return ['ok' => true, 'repaired' => $current, 'passes' => $passes];
        }
    }

    return [
        'ok' => false,
        'error' => json_last_error_msg(),
        'passes' => $passes,
        'post_passes' => $current,
    ];
}

/**
 * Re-escape unescaped `"` inside HTML attribute values that live inside a
 * JSON string literal. Three corruption shapes are handled, all normalised
 * to `attr=\"value\"`:
 *
 *   A. attr="value"      both quotes raw (typical `underline=""`, plus the
 *                        many `<p border-box="" margin-top:="" 0px="" ...>`
 *                        spawned when HTMLPurifier explodes a style="..."
 *                        attribute into one boolean-attribute per CSS prop)
 *   B. attr=\"value"     open escaped, close raw (asymmetric, what was left
 *                        after Pass 2 collapsed `"\&quot;` → `\"` while the
 *                        closing `"` had no `\&quot;` to collapse)
 *   C. attr="value\"     open raw, close escaped (mirror of B)
 *
 * Patterns are matched per-attribute (not anchored to the tag opening) so
 * that a single tag with N corrupted attributes is fully repaired. Safety:
 *
 *   - Pattern A requires `\s` before the attribute name. In valid JSON,
 *     a raw `""` only appears between two strings (e.g. `{"a":"","b":""}`),
 *     where the `""` is preceded by `:` or `,` — never by whitespace, since
 *     Elementor JSON has no whitespace formatting. So no false positive on
 *     legitimate empty-string values.
 *   - The value bracket regex `(?:[^"\\\\]|\\\\.)*` accepts non-quote /
 *     non-backslash chars OR any `\X` escape sequence — needed to repair
 *     attributes whose value contains an already-escaped `\"` left behind
 *     by Pass 2 (e.g. `style="0border-radius: 12px\";"` after Pass 2
 *     collapsed a standalone `\&quot;`). Since `"` and `\` outside of an
 *     escape pair still terminate the match, we cannot swallow already-
 *     correct `\"...\"` pairs elsewhere in the JSON.
 *   - Pattern B/C anchor on `=\\"` or `\\"`, only present where Pass 2
 *     left an escaped quote → safe by construction.
 */
function repairUnescapedAttrQuotes(string $json): string
{
    // A. both raw — match per-attribute, not per-tag
    $json = (string) preg_replace_callback(
        '#(\s)([\w:-]+)=(?<!\\\\)"((?:[^"\\\\]|\\\\.)*)(?<!\\\\)"#',
        function ($m) {
            return $m[1] . $m[2] . '=\\"' . $m[3] . '\\"';
        },
        $json
    );

    // B. open escaped, close raw — NO escapes allowed in value, otherwise
    //    this pattern would gobble through subsequent already-escaped
    //    attributes (`\"\"` inside a value passes the `\\\\.` test) and
    //    eventually swallow the JSON-closing `"` of the surrounding string.
    $json = (string) preg_replace_callback(
        '#(=\\\\")([^"\\\\]*)(?<!\\\\)"#',
        function ($m) {
            return $m[1] . $m[2] . '\\"';
        },
        $json
    );

    // C. open raw, close escaped — same reasoning as B: keep value strict.
    $json = (string) preg_replace_callback(
        '#(=)(?<!\\\\)"([^"\\\\]*)(\\\\")#',
        function ($m) {
            return $m[1] . '\\"' . $m[2] . $m[3];
        },
        $json
    );

    return $json;
}

function shorten(string $s, int $n = 200): string
{
    $s = preg_replace('/\s+/', ' ', $s);

    return mb_strlen((string) $s) > $n ? mb_substr((string) $s, 0, $n) . '…' : (string) $s;
}

function println(string $line): void
{
    echo $line . "\n";
}
