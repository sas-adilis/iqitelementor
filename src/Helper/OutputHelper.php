<?php

namespace IqitElementor\Helper;

/**
 * Safe output buffering helper.
 * Prevents silent failures by catching errors and cleaning up buffers.
 */
class OutputHelper
{
    /** @var int */
    private static $bufferLevel = -1;

    /**
     * Capture the output of a callable with proper error handling.
     *
     * Catches both \Throwable (most PHP 7+ errors) and truly fatal errors
     * (OOM, segfault) via register_shutdown_function.
     */
    public static function capture(callable $callback): string
    {
        $level = ob_get_level();
        self::$bufferLevel = $level;

        // Register shutdown function to catch fatal errors that bypass try/catch
        register_shutdown_function([__CLASS__, 'handleShutdown']);

        ob_start();

        try {
            $callback();
            self::$bufferLevel = -1;
            return (string)ob_get_clean();
        } catch (\Throwable $e) {
            // Clean up any buffers opened during the callback
            while (ob_get_level() > $level) {
                ob_end_clean();
            }
            self::$bufferLevel = -1;

            if (defined('_PS_MODE_DEV_') && _PS_MODE_DEV_) {
                throw $e;
            }

            \PrestaShopLogger::addLog(
                'iqitelementor: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(),
                3
            );

            return '';
        }
    }

    /**
     * Shutdown handler — catches fatal errors that bypass try/catch.
     */
    public static function handleShutdown(): void
    {
        if (self::$bufferLevel < 0) {
            return;
        }

        $error = error_get_last();
        if ($error === null) {
            return;
        }

        // Only handle fatal error types
        $fatalTypes = E_ERROR | E_CORE_ERROR | E_COMPILE_ERROR | E_PARSE;
        if (!($error['type'] & $fatalTypes)) {
            return;
        }

        // Clean up any remaining buffers
        while (ob_get_level() > self::$bufferLevel) {
            ob_end_clean();
        }
        self::$bufferLevel = -1;

        // Output the error so it's visible
        echo '<div style="background:#c0392b;color:#fff;padding:15px;margin:10px;font-family:monospace;font-size:14px;border-radius:4px;">';
        echo '<strong>iqitelementor Fatal Error</strong><br>';
        echo htmlspecialchars($error['message']) . '<br>';
        echo '<small>' . htmlspecialchars($error['file']) . ':' . (int)$error['line'] . '</small>';
        echo '</div>';
    }
}
