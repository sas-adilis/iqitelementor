<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Landing pages are managed through iqitelementor's own AdminIqitElementor
 * back-office screen (custom layout builder), not through a PrestaShop form
 * with a text field. No BO button is exposed here because the "Edit with
 * Elementor" entry point lives in the landing list directly.
 */
class LandingTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'landing';
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $page = new \IqitElementorLanding($pageId, $idLang);
        $editLink = \Context::getContext()->link->getAdminLink('AdminIqitElementor')
            . '&id_page=' . $pageId . '&updateiqit_elementor_landing';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => json_decode($page->data, true),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        $landing = new \IqitElementorLanding($pageId, $idLang);
        $landing->autosave_content = null;
        $landing->autosave_at = null;
        $landing->data = $data;
        $landing->update();

        return (int) $landing->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang)
    {
        $source = new \IqitElementorLanding($pageId, $idLang);

        return json_decode($source->data, true);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $landing = new \IqitElementorLanding($pageId, $idLang);
        if (!\Validate::isLoadedObject($landing)) {
            return '';
        }

        $context = \Context::getContext();
        if ($landing->isHomepage()) {
            return $context->link->getPageLink('index', true, $idLang, $previewParams);
        }

        $url = $landing->getLink($idLang);
        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        return $pageId;
    }
}
