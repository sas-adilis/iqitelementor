<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Category back-office integration is handled by the legacy inline template
 * (`tmpl-btn-edit-with-elementor-category` in backoffice_header.tpl) because
 * it also injects the `justElementor` switcher next to the button. The
 * button itself is therefore not declared here — this target only exposes
 * editor dispatch.
 */
class CategoryTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'category';
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $id = \IqitElementorCategory::getIdByCategory($pageId);
        $page = $id
            ? new \IqitElementorCategory($id, $idLang)
            : new \IqitElementorCategory();

        $editLink = \Context::getContext()->link->getAdminLink('AdminCategories')
            . '&id_category=' . $pageId . '&updatecategory=1';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => json_decode($page->data, true),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        $id = \IqitElementorCategory::getIdByCategory($pageId);

        if ($id) {
            $category = new \IqitElementorCategory($id);
            $category->autosave_content = null;
            $category->autosave_at = null;
            $category->data[$idLang] = $data;
            $category->update();
        } else {
            $category = new \IqitElementorCategory(null);
            $category->id_category = $pageId;
            $category->data = '';

            if ($category->add()) {
                $new = new \IqitElementorCategory($category->id, $idLang);
                $new->autosave_content = null;
                $new->autosave_at = null;
                $new->data = $data;
                $new->update();
            }
        }

        return (int) $category->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang)
    {
        $id = \IqitElementorCategory::getIdByCategory($pageId);
        if (!$id) {
            return null;
        }

        $source = new \IqitElementorCategory($id, $idLang);

        return json_decode($source->data, true);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $url = \Context::getContext()->link->getCategoryLink($pageId, null, $idLang);
        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        $id = \IqitElementorCategory::getIdByCategory($pageId);

        return $id ? (int) $id : 0;
    }
}
