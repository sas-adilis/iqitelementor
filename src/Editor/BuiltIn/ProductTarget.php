<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

class ProductTarget extends EditorTarget
{
    public function getPageType(): string
    {
        return 'product';
    }

    public function getBoButtons(string $controllerName, int $idLang): array
    {
        if ($controllerName !== 'AdminProducts') {
            return [];
        }

        $pageId = (int) $this->getRequestAttribute('id');
        if (!$pageId) {
            $pageId = (int) $this->getRequestAttribute('productId');
        }

        $t = \Context::getContext()->getTranslator();
        $label = $t->trans('Add extendend content with Elementor - Visual Page Builder', [], 'Modules.Iqitelementor.Admin');
        $fallback = $t->trans(' Save product first to enable page builder', [], 'Modules.Iqitelementor.Admin');

        $common = [
            'label' => $label,
            'pageId' => $pageId,
            'target' => '_blank',
            'fallback' => $fallback,
        ];

        return [
            array_merge($common, ['fieldSelector' => '#product_description_description']),
            array_merge($common, ['fieldSelector' => '#features']),
        ];
    }

    public function loadEditorContent(int $pageId, string $contentType, int $idLang): array
    {
        $id = \IqitElementorProduct::getIdByProduct($pageId);
        $page = $id
            ? new \IqitElementorProduct($id, $idLang)
            : new \IqitElementorProduct();

        $editLink = \Context::getContext()->link->getAdminLink('AdminProducts')
            . '&id_product=' . $pageId . '&addproduct=1';

        return [
            'entity' => $page,
            'editLink' => $editLink,
            'data' => json_decode($page->data, true),
        ];
    }

    public function saveContent(int $pageId, string $contentType, int $idLang, $data): int
    {
        $id = \IqitElementorProduct::getIdByProduct($pageId);

        if ($id) {
            $product = new \IqitElementorProduct($id);
            $product->autosave_content = null;
            $product->autosave_at = null;
            $product->data[$idLang] = $data;
            $product->update();
        } else {
            $product = new \IqitElementorProduct(null);
            $product->data = '';
            $product->id_product = $pageId;

            if ($product->add()) {
                $new = new \IqitElementorProduct($product->id, $idLang);
                $new->autosave_content = null;
                $new->autosave_at = null;
                $new->data = $data;
                $new->update();
            }
        }

        return (int) $product->id;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang)
    {
        $id = \IqitElementorProduct::getIdByProduct($pageId);
        if (!$id) {
            return null;
        }

        $source = new \IqitElementorProduct($id, $idLang);

        return json_decode($source->data, true);
    }

    public function getPreviewUrl(int $pageId, string $contentType, int $idLang, array $previewParams): string
    {
        $url = \Context::getContext()->link->getProductLink($pageId, null, null, null, $idLang);
        $url .= (strpos($url, '?') !== false ? '&' : '?') . http_build_query($previewParams);

        return $url;
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        $id = \IqitElementorProduct::getIdByProduct($pageId);

        return $id ? (int) $id : 0;
    }
}
