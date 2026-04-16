<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Handles both plain "content" pages (IqitElementorContent direct id)
 * and the "brand" variant where the page is resolved from manufacturer id.
 */
class ContentTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'content';
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
            'label' => $module->l('Add extendend content with Elementor - Visual Page Builder', 'ContentTarget'),
            'pageId' => $pageId,
            'contentType' => 'brand',
            'target' => '_blank',
            'fallback' => $module->l(' Save brand first to enable page builder', 'ContentTarget'),
        ]];
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        if ($contentType === 'brand') {
            $hookId = \Hook::getIdByName('displayManufacturerElementor');
            $id = \IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);
            $page = $id
                ? new \IqitElementorContent($id, $idLang)
                : new \IqitElementorContent();

            $editLink = \Context::getContext()->link->getAdminLink('AdminManufacturers')
                . '&id_manufacturer=' . $pageId . '&updatemanufacturer=1';
        } else {
            $page = new \IqitElementorContent($pageId, $idLang);
            $editLink = \Context::getContext()->link->getAdminLink('AdminIqitElementorContent')
                . '&id_elementor=' . $pageId . '&updateiqit_elementor_content';
        }

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => json_decode($page->data, true),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        if ($contentType === 'brand') {
            $hookId = \Hook::getIdByName('displayManufacturerElementor');
            $id = \IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);

            if ($id) {
                $content = new \IqitElementorContent($id);
                $content->autosave_content = null;
                $content->autosave_at = null;
                $content->data[$idLang] = $data;
                $content->update(true);
            } else {
                $content = new \IqitElementorContent(null);
                $content->data = '';
                $content->id_object = $pageId;
                $content->hook = $hookId;
                $content->active = 1;
                $content->title = 'brand-' . $pageId;

                if ($content->add(true, true)) {
                    $new = new \IqitElementorContent($content->id, $idLang);
                    $new->autosave_content = null;
                    $new->autosave_at = null;
                    $new->data = $data;
                    $new->update(true);
                }
            }
        } else {
            $content = new \IqitElementorContent($pageId);
            $content->autosave_content = null;
            $content->autosave_at = null;
            $content->data[$idLang] = $data;
            $content->update(true);
        }

        return (int) $content->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang)
    {
        if ($contentType === 'brand') {
            $hookId = \Hook::getIdByName('displayManufacturerElementor');
            $id = \IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);
            if (!$id) {
                return null;
            }
            $source = new \IqitElementorContent($id, $idLang);
        } else {
            $source = new \IqitElementorContent($pageId, $idLang);
        }

        return json_decode($source->data, true);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $context = \Context::getContext();

        if ($contentType === 'brand') {
            $url = $context->link->getManufacturerLink($pageId, null, $idLang);
        } else {
            // Generic hook content — open homepage as fallback.
            $url = $context->link->getPageLink('index', true, $idLang);
        }

        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        return $pageId;
    }
}
