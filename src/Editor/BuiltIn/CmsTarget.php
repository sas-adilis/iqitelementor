<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Stores CMS Elementor JSON in the dedicated `iqit_elementor_content` table
 * (keyed by `id_object = id_cms` and `hook = 'displayCMSDisputeInformation'`),
 * NOT in `cms_lang.content`.
 *
 * Why a dedicated table: cf. ManufacturerTarget — the native content column
 * is `TYPE_HTML` with `validate => isCleanHtml`, so any save through the BO
 * standard form routes through HTMLPurifier and TinyMCE re-serialisation,
 * both of which corrupt Elementor JSON.
 */
class CmsTarget extends EditorTarget
{
    private const HOOK_NAME = 'displayCMSDisputeInformation';

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
            $content->object_type = 'cms';
            $content->hook = (string) $hookId;
            $content->title = '';
            $content->active = 1;
        }
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
            // Wire to every shop so the front render can find it.
            $shopIds = \Shop::getShops(true, null, true);
            if (!is_array($shopIds) || empty($shopIds)) {
                $shopIds = array((int) \Configuration::get('PS_SHOP_DEFAULT'));
            }
            foreach ($shopIds as $shopId) {
                \Db::getInstance()->insert('iqit_elementor_content_shop', array(
                    'id_elementor' => (int) $content->id,
                    'id_shop' => (int) $shopId,
                ), false, true, \Db::INSERT_IGNORE);
            }
        }

        return $pageId;
    }

    public function loadLanguageContent(int $pageId, string $contentType, int $idLang): ?array
    {
        return $this->loadElementorData($pageId, $idLang);
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
     * @return array|null Decoded Elementor data (bare array or wrapped envelope)
     *                    for the given CMS page/language, or null if absent.
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
