<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

class CmsTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'cms';
    }

    public function getBoButtons(string $controllerName, int $idLang): array
    {
        if ($controllerName !== 'AdminCmsContent') {
            return [];
        }

        $pageId = (int) $this->getRequestAttribute('cmsPageId');
        $t = \Context::getContext()->getTranslator();

        return [[
            'fieldSelector' => '#cms_page_content',
            'label' => $t->trans('Edit with Elementor - Visual Page Builder', [], 'Modules.Iqitelementor.Admin'),
            'pageId' => $pageId,
            'fallback' => $t->trans(' Save page first to enable page builder', [], 'Modules.Iqitelementor.Admin'),
        ]];
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $page = new \CMS($pageId, $idLang);
        $editLink = \Context::getContext()->link->getAdminLink('AdminCmsContent')
            . '&id_cms=' . $pageId . '&updatecms';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => $this->decodeEditorJson($page->content),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        if ($data === '[]') {
            $data = '';
        }

        $cms = new \CMS($pageId);
        $cms->content[$idLang] = $data;
        $cms->update();

        return (int) $cms->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang): ?array
    {
        $source = new \CMS($pageId, $idLang);

        return $this->decodeEditorJson($source->content);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $url = \Context::getContext()->link->getCMSLink($pageId, null, null, $idLang);
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
