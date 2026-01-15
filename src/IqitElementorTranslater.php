<?php
/**
 * 2024 Adilis.
 * Manage returns and exchanges easily and quickly
 *
 * @author Adilis <contact@adilis.fr>
 * @copyright 2024 SAS Adilis
 * @license http://www.adilis.fr
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorTranslater
{
    /**
     * @var self|null
     */
    protected static $instance;

    public static function get()
    {
        return static::getInstance();
    }

    public static function getInstance()
    {
        if (!static::$instance) {
            static::$instance = new static();
        }

        return static::$instance;
    }

    /**
     * @throws \Exception
     */
    public function l($string, $source = null, $locale = null)
    {
        // temp fix for translations
        $source = $locale = null;

        if ($source === null) {
            $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1);
            $source = basename($backtrace[0]['file'] ?? '', '.php');
        }


        return \Translate::getModuleTranslation('iqitelementor', $string, $source, null, false, $locale);
    }
}
