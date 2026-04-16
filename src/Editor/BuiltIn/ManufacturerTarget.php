<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Stores Elementor JSON directly in the native manufacturer description field,
 * exactly like CmsTarget stores it in CMS content.
 */
class ManufacturerTarget extends EditorTarget
{
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
            'data' => $this->decodeEditorJson($page->description),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        if ($data === '[]') {
            $data = '';
        }

        $manufacturer = new \Manufacturer($pageId);
        $manufacturer->description[$idLang] = $data;
        $manufacturer->update();

        return (int) $manufacturer->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang)
    {
        $source = new \Manufacturer($pageId, $idLang);

        return $this->decodeEditorJson($source->description);
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
     * @param mixed $raw
     * @return array|null
     */
    private function decodeEditorJson($raw)
    {
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', (string) $raw);
        $stripped = str_replace(["\r", "\n"], '', $stripped);

        $decoded = json_decode($stripped, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return $decoded;
    }
}
