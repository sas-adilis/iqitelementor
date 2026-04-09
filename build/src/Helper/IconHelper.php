<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class IconHelper
{
    /**
     * Render an icon value (new JSON format or legacy string).
     *
     * @param mixed $icon string (legacy) or JSON string / array (new format)
     */
    public static function renderIcon($icon, array $attrs = array()): string
    {
        if (empty($icon)) {
            return '';
        }

        $decoded = self::decodeIconValue($icon);
        // Try to resolve svgKey from library + value if missing
        $svgKey = !empty($decoded['svgKey']) ? $decoded['svgKey'] : '';
        if (empty($svgKey) && !empty($decoded['library']) && !empty($decoded['value'])) {
            $svgKey = self::buildSvgKeyFromValue($decoded['library'], $decoded['value']);
        }

        // SVG stored on disk or fetched from CDN
        if (!empty($svgKey)) {
            $svg = self::loadSvgFromDisk($svgKey);
            if ($svg) {
                $svg = self::sanitizeSvg($svg);
                $attrStr = self::buildAttrString($attrs);
                return '<span class="elementor-icon-svg"' . $attrStr . '>' . $svg . '</span>';
            }
        }

        // Legacy or fallback (no SVG available)
        if (!empty($decoded['value'])) {
            $attrStr = self::buildAttrString($attrs);
            return '<i class="' . Helper::escAttr($decoded['value']) . '"' . $attrStr . '></i>';
        }

        return '';
    }

    /**
     * Build a svgKey from library key and CSS class value.
     *
     * E.g. ("ph", "ph ph-arrow-circle-left") => "ph/regular/arrow-circle-left"
     *      ("fa", "fa-solid fa-arrow-right")  => "fa/solid/arrow-right"
     *      ("bi", "bi bi-house")              => "bi/regular/house"
     *
     * @param string $value CSS class string
     * @return string svgKey or empty string
     */
    private static function buildSvgKeyFromValue(string $library, string $value): string
    {
        $parts = preg_split('/\s+/', trim($value));

        if ($library === 'ph') {
            // Phosphor: "ph ph-arrow-circle-left" or "ph-bold ph-arrow-circle-left"
            $style = 'regular';
            $name = '';
            foreach ($parts as $part) {
                if (preg_match('/^ph-(bold|thin|light|fill|duotone)$/', $part, $m)) {
                    $style = $m[1];
                } elseif (strpos($part, 'ph-') === 0 && $part !== 'ph') {
                    $name = substr($part, 3);
                }
            }
            return $name ? $library . '/' . $style . '/' . $name : '';
        }

        if ($library === 'fa') {
            // Font Awesome: "fa-solid fa-arrow-right" or "fa-brands fa-github"
            $style = 'solid';
            $name = '';
            foreach ($parts as $part) {
                if (preg_match('/^fa-(solid|regular|brands|light|thin|duotone)$/', $part, $m)) {
                    $style = $m[1];
                } elseif (preg_match('/^fa-(.+)$/', $part, $m) && !in_array($m[1], array('solid', 'regular', 'brands', 'light', 'thin', 'duotone'))) {
                    $name = $m[1];
                }
            }
            return $name ? $library . '/' . $style . '/' . $name : '';
        }

        if ($library === 'bi') {
            // Bootstrap Icons: "bi bi-house"
            foreach ($parts as $part) {
                if (strpos($part, 'bi-') === 0) {
                    $name = substr($part, 3);
                    return $library . '/regular/' . $name;
                }
            }
        }

        return '';
    }

    /**
     * Decode an icon value into a normalized array.
     *
     * @param mixed $value
     * @return array with keys: library, value, svg (all may be empty)
     */
    public static function decodeIconValue($value): array
    {
        $default = array(
            'library' => '',
            'value' => '',
            'svgKey' => '',
        );

        if (empty($value)) {
            return $default;
        }

        // Already an array (post json_decode from DB)
        if (is_array($value)) {
            return array_merge($default, $value);
        }

        if (!is_string($value)) {
            return $default;
        }

        // New JSON format
        if (substr($value, 0, 1) === '{') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return array_merge($default, $decoded);
            }
        }

        // Legacy format: plain CSS class string
        return array(
            'library' => 'fa',
            'value' => $value,
            'svg' => '',
        );
    }

    /**
     * Get the list of enabled icon library keys from configuration.
     *
     * @return array e.g. ['fa', 'bi']
     */
    public static function getEnabledLibraries(): array
    {
        $val = \Configuration::get('IQIT_ELEMENTOR_ICON_LIBRARIES');
        if (empty($val)) {
            return array('fa');
        }
        $libs = json_decode($val, true);
        return is_array($libs) && !empty($libs) ? $libs : array('fa');
    }

    /**
     * Get all available library definitions.
     */
    public static function getAllLibraries(): array
    {
        return array(
            'fa' => array(
                'label' => 'Font Awesome',
                'manifest' => 'fontawesome.json',
            ),
            'bi' => array(
                'label' => 'Bootstrap Icons',
                'manifest' => 'bootstrap-icons.json',
            ),
            'ph' => array(
                'label' => 'Phosphor Icons',
                'manifest' => 'phosphor.json',
            ),
        );
    }

    /**
     * Load SVG content from disk cache.
     *
     * @param string $svgKey e.g. "fa/solid/address-book"
     * @return string|false SVG content or false if not found
     */
    public static function loadSvgFromDisk(string $svgKey)
    {
        // Sanitize key: only allow alphanumeric, hyphens, and slashes
        $svgKey = preg_replace('/[^a-z0-9\-\/]/', '', $svgKey);
        if (empty($svgKey) || strpos($svgKey, '..') !== false) {
            return false;
        }

        $filePath = \_PS_MODULE_DIR_ . 'iqitelementor/views/data/svg-cache/' . $svgKey . '.svg';
        if (is_file($filePath)) {
            return file_get_contents($filePath);
        }

        // Cache miss: try to fetch from CDN and save to disk
        $svg = self::fetchSvgFromCdn($svgKey);
        if ($svg) {
            $parts = explode('/', $svgKey);
            if (count($parts) === 3) {
                self::saveSvgToDisk($parts[0], $parts[1], $parts[2], $svg);
            } elseif (count($parts) === 2) {
                self::saveSvgToDisk($parts[0], '', $parts[1], $svg);
            }
            return self::sanitizeSvg($svg);
        }

        return false;
    }

    /**
     * Fetch SVG from CDN based on svgKey (e.g. "ph/regular/arrow-circle-left").
     *
     * @return string|false SVG content or false on failure
     */
    private static function fetchSvgFromCdn(string $svgKey)
    {
        $parts = explode('/', $svgKey);
        if (count($parts) < 2) {
            return false;
        }

        $library = $parts[0];
        $libraries = self::getAllLibraries();
        if (!isset($libraries[$library])) {
            return false;
        }

        $manifestFile = \_PS_MODULE_DIR_ . 'iqitelementor/views/data/icon-manifests/' . $libraries[$library]['manifest'];
        if (!is_file($manifestFile)) {
            return false;
        }

        $manifest = json_decode(file_get_contents($manifestFile), true);
        if (!$manifest || empty($manifest['cdnSvgBase'])) {
            return false;
        }

        $cdnBase = rtrim($manifest['cdnSvgBase'], '/');

        // Build URL: bi has no style subfolder, others do
        if (count($parts) === 3) {
            $svgUrl = $cdnBase . '/' . $parts[1] . '/' . $parts[2] . '.svg';
        } else {
            $svgUrl = $cdnBase . '/' . $parts[1] . '.svg';
        }

        $ctx = stream_context_create(array(
            'http' => array(
                'timeout' => 5,
                'ignore_errors' => true,
            ),
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
            ),
        ));

        try {
            $svg = file_get_contents($svgUrl, false, $ctx);
        } catch (\Exception $e) {
            \PrestaShopLogger::addLog(
                'IqitElementor: CDN icon fetch failed for ' . $svgKey . ' — ' . $e->getMessage(),
                2,
                null,
                'IqitElementor'
            );

            return false;
        }

        if ($svg && strpos($svg, '<svg') !== false) {
            return $svg;
        }

        return false;
    }

    /**
     * Save SVG content to disk cache.
     *
     * @param string $library e.g. "fa"
     * @param string $style e.g. "solid"
     * @param string $name e.g. "address-book"
     * @param string $svg SVG markup
     * @return string|false svgKey on success, false on failure
     */
    public static function saveSvgToDisk(string $library, string $style, string $name, string $svg)
    {
        $library = preg_replace('/[^a-z0-9\-]/', '', $library);
        $style = preg_replace('/[^a-z0-9\-]/', '', $style);
        $name = preg_replace('/[^a-z0-9\-]/', '', $name);

        if (empty($library) || empty($name) || empty($svg)) {
            return false;
        }

        $dir = \_PS_MODULE_DIR_ . 'iqitelementor/views/data/svg-cache/' . $library . '/' . $style;
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $filePath = $dir . '/' . $name . '.svg';
        if (file_put_contents($filePath, self::sanitizeSvg($svg)) !== false) {
            return $library . '/' . $style . '/' . $name;
        }

        return false;
    }

    /**
     * Sanitize SVG markup to prevent XSS.
     */
    private static function sanitizeSvg(string $svg): string
    {
        // Strip script tags
        $svg = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $svg);
        // Strip event handlers (onclick, onload, onerror, etc.)
        $svg = preg_replace('/\bon\w+\s*=/i', 'data-removed=', $svg);
        // Strip javascript: URIs
        $svg = preg_replace('/javascript\s*:/i', 'removed:', $svg);
        return $svg;
    }

    /**
     * Build an HTML attribute string from an array.
     */
    private static function buildAttrString(array $attrs): string
    {
        $str = '';
        foreach ($attrs as $key => $val) {
            $str .= ' ' . $key . '="' . Helper::escAttr($val) . '"';
        }
        return $str;
    }
}
