<?php
/**
 * 2024 Adilis.
 * Manage returns and exchanges easily and quickly
 *
 * @author Adilis <contact@adilis.fr>
 * @copyright 2024 SAS Adilis
 * @license http://www.adilis.fr
 */

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class Translater
{
    /**
     * @var self|null
     */
    protected static $instance;

    public static function get(): self
    {
        return static::getInstance();
    }

    public static function getInstance(): self
    {
        if (!static::$instance) {
            static::$instance = new static();
        }

        return static::$instance;
    }

    /**
     * @throws \Exception
     */
    public function l(string $string, ?string $source = null, ?string $locale = null): string
    {
        // Always use the calling filename as source for consistent translation keys
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1);
        $source = basename($backtrace[0]['file'] ?? '', '.php');

        $translation = \Translate::getModuleTranslation('iqitelementor', $string, $source, null, false, $locale);
        return $translation ?: $string;
    }
}
