<?php

namespace IqitElementor\Editor\BuiltIn;

use IqitElementor\Editor\EditorTarget;

/**
 * Stores SimpleBlogPost Elementor JSON in the dedicated `iqit_elementor_content`
 * table (keyed by `id_object = id_simpleblog_post` and
 * `hook = 'displayBlogElementor'`), NOT in `simpleblog_post.content`.
 *
 * Why a dedicated table: cf. ManufacturerTarget — the native content column
 * goes through HTMLPurifier and TinyMCE re-serialisation, both of which
 * corrupt Elementor JSON.
 */
class BlogTarget extends EditorTarget
{
    private const HOOK_NAME = 'displayBlogElementor';

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
            $content->object_type = 'blog';
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
        if (class_exists('SimpleBlogPost') && class_exists('SimpleBlogCategory')) {
            $post = new \SimpleBlogPost($pageId, $idLang);
            if (\Validate::isLoadedObject($post)) {
                $category = new \SimpleBlogCategory((int) $post->id_simpleblog_category, $idLang);
                $categoryRewrite = \Validate::isLoadedObject($category) ? $category->link_rewrite : '';

                return \Context::getContext()->link->getModuleLink(
                    'ph_simpleblog',
                    'single',
                    array_merge(
                        ['rewrite' => $post->link_rewrite, 'sb_category' => $categoryRewrite],
                        $previewParams
                    ),
                    null,
                    $idLang
                );
            }
        }

        return \Context::getContext()->link->getPageLink('index', true, $idLang, $previewParams);
    }

    public function resolveRevisionEntityId(int $pageId, string $contentType): int
    {
        return $pageId;
    }

    /**
     * @return array|null
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
