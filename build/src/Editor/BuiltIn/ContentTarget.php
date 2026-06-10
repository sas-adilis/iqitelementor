<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Handles generic "content" pages (IqitElementorContent bound to hooks).
 */
class ContentTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'content';
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $page = new \IqitElementorContent($pageId, $idLang);
        $editLink = \Context::getContext()->link->getAdminLink('AdminIqitElementorContent')
            . '&id_elementor=' . $pageId . '&updateiqit_elementor_content';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => json_decode($page->data, true),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        $content = new \IqitElementorContent($pageId);
        $content->autosave_content = null;
        $content->autosave_at = null;
        $content->data[$idLang] = $data;
        $content->update(true);

        return (int) $content->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang): ?array
    {
        $source = new \IqitElementorContent($pageId, $idLang);

        return json_decode($source->data, true);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $url = \Context::getContext()->link->getPageLink('index', true, $idLang);
        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        return $pageId;
    }
}
