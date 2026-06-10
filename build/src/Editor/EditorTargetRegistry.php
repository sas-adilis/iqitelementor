<?php

namespace IqitElementor\Editor;

use IqitElementor\Editor\BuiltIn\BlogTarget;
use IqitElementor\Editor\BuiltIn\CategoryTarget;
use IqitElementor\Editor\BuiltIn\CmsTarget;
use IqitElementor\Editor\BuiltIn\ContentTarget;
use IqitElementor\Editor\BuiltIn\LandingTarget;
use IqitElementor\Editor\BuiltIn\ManufacturerTarget;
use IqitElementor\Editor\BuiltIn\ProductTarget;

/**
 * Process-wide registry of EditorTarget instances.
 *
 * Lazily-initialised: the first call to a lookup method registers the
 * built-in targets shipped by iqitelementor core, then fires the
 * `actionIqitElementorRegisterEditableTargets` hook so external modules
 * can contribute their own via ::register().
 *
 * Also provides `collectBoButtons()`, used by iqitelementor's
 * hookDisplayBackOfficeHeader to gather every back-office button every
 * target wants rendered on the current admin screen — each target brings
 * its own button declarations and the registry resolves URLs uniformly.
 */
class EditorTargetRegistry
{
    /** @var array<string, EditorTarget> */
    private static $targets = [];

    /** @var bool */
    private static $bootstrapped = false;

    public static function register(EditorTarget $target): void
    {
        self::$targets[$target->getPageType()] = $target;
    }

    public static function get(string $pageType): ?EditorTarget
    {
        self::bootstrap();

        return self::$targets[$pageType] ?? null;
    }

    /**
     * @return array<string, EditorTarget>
     */
    public static function all(): array
    {
        self::bootstrap();

        return self::$targets;
    }

    public static function reset(): void
    {
        self::$targets = [];
        self::$bootstrapped = false;
    }

    /**
     * Walk every registered target, ask it for back-office buttons that
     * apply to the given admin controller, normalise them into plain
     * arrays consumed by `bo-button-injector.js`.
     *
     * Each target is free to return zero, one or many buttons. The URL is
     * built by `EditorTarget::buildEditorUrl()` unless the target overrides
     * it or passes an explicit `url` in the button declaration.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function collectBoButtons(string $controllerName, int $idLang): array
    {
        $out = [];

        foreach (self::all() as $target) {
            $buttons = $target->getBoButtons($controllerName, $idLang);
            if (!is_array($buttons) || empty($buttons)) {
                continue;
            }

            foreach ($buttons as $btn) {
                $fieldSelector = (string) ($btn['fieldSelector'] ?? '');
                if ($fieldSelector === '') {
                    continue;
                }

                $pageId = (int) ($btn['pageId'] ?? 0);
                $contentType = (string) ($btn['contentType'] ?? 'default');
                $newContent = (int) ($btn['newContent'] ?? 0);

                // Let targets override URL entirely for oddball cases; else
                // build the canonical one (empty string when not saved yet).
                if (isset($btn['url'])) {
                    $url = (string) $btn['url'];
                } else {
                    $url = $pageId > 0
                        ? $target->buildEditorUrl($pageId, $contentType, $idLang, $newContent)
                        : '';
                }

                $out[] = [
                    'id' => md5($target->getPageType() . '|' . $fieldSelector . '|' . $url),
                    'fieldSelector' => $fieldSelector,
                    'label' => (string) ($btn['label'] ?? ''),
                    'url' => $url,
                    'target' => (string) ($btn['target'] ?? ''),
                    'fallback' => (string) ($btn['fallback'] ?? ''),
                    'placement' => (string) ($btn['placement'] ?? ''),
                ];
            }
        }

        return $out;
    }

    private static function bootstrap(): void
    {
        if (self::$bootstrapped) {
            return;
        }
        self::$bootstrapped = true;

        self::register(new LandingTarget());
        self::register(new CmsTarget());
        self::register(new BlogTarget());
        self::register(new CategoryTarget());
        self::register(new ContentTarget());
        self::register(new ManufacturerTarget());
        self::register(new ProductTarget());

        if (class_exists('\\Hook')) {
            \Hook::exec('actionIqitElementorRegisterEditableTargets', []);
        }
    }
}
