<?php

namespace IqitElementor\Cache;

/**
 * Content-addressed filesystem cache for Elementor-rendered HTML.
 *
 * The cache key is computed from the input content itself (md5 hash), so:
 *
 *   - Identical content always maps to the same file → cache hit is ~free.
 *   - Changed content maps to a new file → cache miss → render once, store.
 *
 * Invalidation is **implicit**: there is nothing to invalidate. Orphaned
 * files for old content versions simply stop being looked up. A periodic
 * cleanup via `Tools::deleteDirectory(...)` can reclaim the disk space
 * when wanted (e.g. after an Elementor widget code change that requires
 * every page to re-render).
 *
 * Files are sharded across two-letter subdirectories of `_PS_CACHE_DIR_`
 * so directory listings stay manageable on busy shops.
 */
class RenderCache
{
    /**
     * Fetch cached HTML for `$content` if it exists; otherwise invoke
     * `$render()` to produce the HTML, store it, and return it.
     *
     * @param string $content Raw input (typically Elementor JSON). Used
     *                        both as the cache key source and passed
     *                        unchanged to the renderer closure.
     * @param callable $render `function (): string` that produces the HTML
     *                         when the cache misses.
     */
    public static function remember(string $content, callable $render): string
    {
        if ($content === '') {
            return '';
        }

        $cached = self::read($content);
        if ($cached !== null) {
            return $cached;
        }

        $html = (string) $render();
        self::write($content, $html);

        return $html;
    }

    public static function read(string $content): ?string
    {
        $path = self::getPath($content);
        if (!is_file($path)) {
            return null;
        }
        $data = @file_get_contents($path);
        return $data !== false ? $data : null;
    }

    public static function write(string $content, string $html): void
    {
        $path = self::getPath($content);
        $dir = dirname($path);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return;
        }
        @file_put_contents($path, $html);
    }

    /**
     * Wipe the entire render cache directory. Useful after an Elementor
     * widget code change that affects the rendering pipeline.
     */
    public static function flush(): void
    {
        $root = _PS_CACHE_DIR_ . 'iqitelementor/render/';
        if (is_dir($root)) {
            \Tools::deleteDirectory($root, false);
        }
    }

    private static function getPath(string $content): string
    {
        $hash = md5($content);

        return _PS_CACHE_DIR_ . 'iqitelementor/render/' . substr($hash, 0, 2) . '/' . $hash . '.html';
    }
}
