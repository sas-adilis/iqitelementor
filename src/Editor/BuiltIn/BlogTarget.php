<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

class BlogTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'blog';
    }

    public function getBoButtons(string $controllerName, int $idLang): array
    {
        if ($controllerName !== 'AdminSimpleBlogPosts') {
            return [];
        }

        $pageId = (int) \Tools::getValue('id_simpleblog_post');
        $t = \Context::getContext()->getTranslator();

        return [[
            'fieldSelector' => '[id^="content_"]',
            'label' => $t->trans('Edit with Elementor - Visual Page Builder', [], 'Modules.Iqitelementor.Admin'),
            'pageId' => $pageId,
            'fallback' => $t->trans(' Save post first to enable page builder', [], 'Modules.Iqitelementor.Admin'),
        ]];
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $page = new \SimpleBlogPost($pageId, $idLang);
        $editLink = \Context::getContext()->link->getAdminLink('AdminSimpleBlogPosts')
            . '&id_simpleblog_post=' . $pageId . '&updatesimpleblog_post';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => $this->decodeEditorJson($page->content),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        $post = new \SimpleBlogPost($pageId);
        $post->content[$idLang] = $data;
        $post->update();

        return (int) $post->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang): ?array
    {
        $source = new \SimpleBlogPost($pageId, $idLang);

        return $this->decodeEditorJson($source->content);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        // Blog posts have no generic PS link builder — fall back to homepage.
        return \Context::getContext()->link->getPageLink('index', true, $idLang, $previewParams);
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
