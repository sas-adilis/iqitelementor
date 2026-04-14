<?php

namespace IqitElementor\Editor;

/**
 * An entity that can be edited with the iqitelementor page builder.
 *
 * A target bundles three concerns for one `pageType`:
 *
 *  - Editor dispatch — loading and persisting the Elementor JSON when the
 *    merchant opens/saves the editor (`loadEditorContent`, `saveContent`,
 *    `loadLanguageContent`, `getPreviewUrl`, `resolveRevisionEntityId`).
 *  - Back-office buttons — declaring which "Edit with Elementor" buttons
 *    should appear on which admin screens, under which fields
 *    (`getBoButtons`). Defaults to none.
 *  - URL building — the canonical `AdminIqitElementorEditor` URL is built
 *    by `buildEditorUrl()`; targets override it only when they need a
 *    non-standard URL.
 *
 * Built-in targets (landing, cms, blog, category, content, product) are
 * registered automatically by `EditorTargetRegistry::bootstrap()`. Third
 * parties contribute their own by listening to
 * `actionIqitElementorRegisterEditableTargets` and calling
 * `EditorTargetRegistry::register(new MyTarget())`.
 */
abstract class EditorTarget
{
    // ---------------------------------------------------------------------
    // Identity
    // ---------------------------------------------------------------------

    /**
     * Unique identifier used as the `pageType` query parameter in editor URLs.
     */
    abstract public function getPageType(): string;

    // ---------------------------------------------------------------------
    // Back-office buttons
    // ---------------------------------------------------------------------

    /**
     * Declare the "Edit with Elementor" buttons this target wants injected
     * into the given admin controller. Default: none.
     *
     * Each returned entry describes one button tied to one form field:
     *
     *   [
     *       'fieldSelector' => string,  // CSS selector of the field
     *       'label'         => string,  // already-translated label
     *       'pageId'        => int,     // 0 = not saved yet → show fallback
     *       'contentType'   => string,  // defaults to 'default'
     *       'newContent'    => int,     // defaults to 0
     *       'target'        => string,  // window target, defaults to ''
     *       'fallback'      => string,  // "save first" message
     *       'url'           => string,  // overrides buildEditorUrl() entirely
     *   ]
     *
     * Only `fieldSelector`, `label` and `pageId` are usually needed.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getBoButtons(string $controllerName, int $idLang): array
    {
        return [];
    }

    // ---------------------------------------------------------------------
    // URL builder
    // ---------------------------------------------------------------------

    /**
     * Build the canonical AdminIqitElementorEditor URL for this target.
     * Override in concrete targets only when you need a non-standard URL.
     */
    public function buildEditorUrl(int $pageId, string $contentType = 'default', int $idLang = 0, int $newContent = 0): string
    {
        $context = \Context::getContext();

        if ($idLang === 0) {
            $idLang = (int) $context->language->id;
        }

        return $context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=' . urlencode($this->getPageType())
            . '&contentType=' . urlencode($contentType)
            . '&newContent=' . $newContent
            . '&pageId=' . $pageId
            . '&idLang=' . $idLang;
    }

    // ---------------------------------------------------------------------
    // Editor dispatch (called by AdminIqitElementorEditorController)
    // ---------------------------------------------------------------------

    /**
     * @return array{entity: \ObjectModel|null, editLink: string, data: array|null}
     */
    abstract public function loadEditorContent(int $pageId, string $contentType, int $idLang): array;

    /**
     * @param mixed $data
     * @return int Primary key of the persisted entity (for the revision system)
     */
    abstract public function saveContent(int $pageId, string $contentType, int $idLang, $data): int;

    /**
     * @return array|null
     */
    abstract public function loadLanguageContent(int $pageId, string $contentType, int $idLang);

    /**
     * @param array<string, string|int> $previewParams
     */
    abstract public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string;

    abstract public function resolveRevisionEntityId(int $pageId, string $contentType): int;

    // ---------------------------------------------------------------------
    // Helpers available to concrete targets
    // ---------------------------------------------------------------------

    /**
     * Read a Symfony route attribute from the current request (useful when
     * resolving a page id from a back-office Symfony controller).
     */
    protected function getRequestAttribute(string $key): ?int
    {
        if (!isset($GLOBALS['kernel'])) {
            return null;
        }

        try {
            $request = $GLOBALS['kernel']->getContainer()->get('request_stack')->getCurrentRequest();
            if ($request === null) {
                return null;
            }
            $value = $request->attributes->get($key);
            return $value !== null ? (int) $value : null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
