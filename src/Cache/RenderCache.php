<?php

namespace IqitElementor\Cache;

/**
 * Filesystem cache for Elementor-rendered HTML.
 *
 * Two cache layouts coexist:
 *
 *  - **Anonymous (content-addressed):** key = md5($content), path sharded on
 *    the first two hex chars. Identical content across entities dedupes to
 *    a single file. Self-invalidating by construction — when content changes
 *    the hash changes, the new read misses, a new file is written, and the
 *    old file is orphaned but never read again. No explicit invalidation
 *    needed; stale files just accumulate until a full flush reclaims disk.
 *
 *  - **Scoped (entity-addressed):** key = (entity_type, entity_id,
 *    content_type, id_lang), path = `scoped/{entity_type}/{entity_id}/
 *    {content_type}_{id_lang}.html`. One file per (entity, content type,
 *    language). Writing overwrites the previous render for that scope.
 *    Precise invalidation via `forget()` after the underlying content
 *    changes — required, because unlike the anonymous layout a stale file
 *    at the same path would be read back on the next hit.
 *
 * Callers that know the entity they render for should pass a scope to
 * `remember()` so `forget()` can surgically drop that entry on save. Ad-hoc
 * callers (e.g. `{iqit_render content=$foo}` without scope hints) fall back
 * to the anonymous layout, which is also correct.
 */
class RenderCache
{
    public static function remember(string $content, callable $render, array $scope = []): string
    {
        if ($content === '') {
            return '';
        }

        if (!self::isEnabled()) {
            return (string) $render();
        }

        $path = self::resolvePath($content, $scope);

        $cached = self::readPath($path);
        if ($cached !== null) {
            return $cached;
        }

        $html = (string) $render();
        self::writePath($path, $html);

        return $html;
    }

    /**
     * Whether the render cache is enabled. Controlled by the
     * `IQITELEMENTOR_RENDER_CACHE` module configuration (default: enabled).
     */
    public static function isEnabled(): bool
    {
        $value = \Configuration::get('IQITELEMENTOR_RENDER_CACHE');

        return $value === false || (int) $value === 1;
    }

    /**
     * Drop a single scoped cache entry (one entity, one content type, one
     * language). No-op when the file does not exist. Anonymous entries are
     * self-invalidating and are not affected by this call.
     */
    public static function forget(string $entityType, int $entityId, string $contentType = '', int $idLang = 0): bool
    {
        $entityType = self::sanitizeSegment($entityType);
        if ($entityType === '' || $entityId <= 0) {
            return false;
        }

        $root = _PS_CACHE_DIR_ . 'iqitelementor/render/scoped/' . $entityType . '/' . $entityId;

        if ($contentType === '' && $idLang === 0) {
            if (is_dir($root)) {
                \Tools::deleteDirectory($root, true);

                return true;
            }

            return false;
        }

        $file = $root . '/' . self::scopedFilename($contentType, $idLang);
        if (is_file($file)) {
            return (bool) @unlink($file);
        }

        return false;
    }

    /**
     * Wipe the entire render cache directory (scoped + anonymous). Useful
     * after a widget code change that affects the rendering pipeline or
     * when the cache is toggled off.
     */
    public static function flush(): void
    {
        $root = _PS_CACHE_DIR_ . 'iqitelementor/render/';
        if (is_dir($root)) {
            \Tools::deleteDirectory($root, false);
        }
    }

    private static function resolvePath(string $content, array $scope): string
    {
        $entityType = isset($scope['entity_type']) ? self::sanitizeSegment((string) $scope['entity_type']) : '';
        $entityId = isset($scope['entity_id']) ? (int) $scope['entity_id'] : 0;
        $idLang = isset($scope['id_lang']) ? (int) $scope['id_lang'] : 0;
        $contentType = isset($scope['content_type']) ? (string) $scope['content_type'] : '';

        if ($entityType !== '' && $entityId > 0 && $idLang > 0) {
            return _PS_CACHE_DIR_ . 'iqitelementor/render/scoped/'
                . $entityType . '/' . $entityId . '/'
                . self::scopedFilename($contentType, $idLang);
        }

        $hash = md5($content);

        return _PS_CACHE_DIR_ . 'iqitelementor/render/anon/' . substr($hash, 0, 2) . '/' . $hash . '.html';
    }

    private static function scopedFilename(string $contentType, int $idLang): string
    {
        $contentType = self::sanitizeSegment($contentType);
        if ($contentType === '') {
            $contentType = 'default';
        }

        return $contentType . '_' . $idLang . '.html';
    }

    private static function sanitizeSegment(string $segment): string
    {
        return (string) preg_replace('/[^a-zA-Z0-9_-]/', '', $segment);
    }

    private static function readPath(string $path): ?string
    {
        if (!is_file($path)) {
            return null;
        }
        $data = @file_get_contents($path);

        return $data !== false ? $data : null;
    }

    private static function writePath(string $path, string $html): void
    {
        $dir = dirname($path);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return;
        }
        @file_put_contents($path, $html);
    }
}
