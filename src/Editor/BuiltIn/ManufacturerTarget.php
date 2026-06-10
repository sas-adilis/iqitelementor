<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Stores Manufacturer Elementor JSON in the dedicated `iqit_elementor_content`
 * table (keyed by `id_object = id_manufacturer` and `hook = 'displayManufacturerElementor'`),
 * NOT in `manufacturer_lang.description`.
 *
 * Why a dedicated table: the native description column is `TYPE_HTML` with
 * `validate => isCleanHtml`, which routes through HTMLPurifier on every
 * ObjectModel save. And the BO form attaches TinyMCE to the textarea, which
 * mangles JSON-as-HTML on form submit (`\"` → `\&quot;` inside attribute
 * values). Both pipelines corrupt the JSON. Using a dedicated, non-HTML
 * storage column avoids the entire chain — this is the same architecture
 * the legacy iqitelementor module used.
 */
class ManufacturerTarget extends EditorTarget
{
    private const HOOK_NAME = 'displayManufacturerElementor';

    public function getPageType(): string
    {
        return 'manufacturer';
    }

    public function getBoButtons(string $controllerName, int $idLang): array
    {
        if ($controllerName !== 'AdminManufacturers') {
            return [];
        }

        $pageId = (int) $this->getRequestAttribute('manufacturerId');
        $module = \Module::getInstanceByName('iqitelementor');

        return [[
            'fieldSelector' => '#manufacturer_description',
            'label' => $module->l('Edit with Elementor - Visual Page Builder', 'ManufacturerTarget'),
            'pageId' => $pageId,
            'target' => '_blank',
            'fallback' => $module->l(' Save brand first to enable page builder', 'ManufacturerTarget'),
        ]];
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $page = new \Manufacturer($pageId, $idLang);
        $editLink = \Context::getContext()->link->getAdminLink('AdminManufacturers')
            . '&id_manufacturer=' . $pageId . '&updatemanufacturer=1';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => $this->loadElementorData($pageId, $idLang),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        if ($data === '[]') {
            $data = '';
        }

        $hookId = $this->getHookId();
        if (!$hookId) {
            return $pageId;
        }

        $idElementor = (int) \IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);

        if ($idElementor) {
            $content = new \IqitElementorContent($idElementor);
        } else {
            $content = new \IqitElementorContent();
            $content->id_object = $pageId;
            $content->object_type = 'manufacturer';
            $content->hook = (string) $hookId;
            $content->title = '';
            $content->active = 1;
        }
        // Defensive null: ObjectModel validation can trip on TYPE_DATE +
        // isDate when the property is unset rather than explicitly null.
        $content->autosave_content = null;
        $content->autosave_at = null;

        if (!is_array($content->data)) {
            $content->data = array();
        }
        $content->data[$idLang] = (string) $data;

        if ($idElementor) {
            $content->update();
        } else {
            $content->add();
        }

        return $pageId;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang): ?array
    {
        return $this->loadElementorData($pageId, $idLang);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $url = \Context::getContext()->link->getManufacturerLink($pageId, null, $idLang);
        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        return $pageId;
    }

    /**
     * @return array|null Decoded Elementor data (bare array or wrapped envelope)
     *                    for the given manufacturer/language, or null if absent.
     */
    private function loadElementorData(int $pageId, int $idLang)
    {
        $hookId = $this->getHookId();
        if (!$hookId) {
            return null;
        }

        $idElementor = (int) \IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);
        if (!$idElementor) {
            return null;
        }

        $content = new \IqitElementorContent($idElementor, $idLang);
        if (!\Validate::isLoadedObject($content)) {
            return null;
        }

        $raw = is_array($content->data)
            ? (isset($content->data[$idLang]) ? (string) $content->data[$idLang] : '')
            : (string) $content->data;

        if ($raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return $decoded;
    }

    private function getHookId(): int
    {
        return (int) \Hook::getIdByName(self::HOOK_NAME);
    }
}
