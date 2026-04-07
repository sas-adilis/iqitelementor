<?php

namespace IqitElementor\BackOffice;

/**
 * Builds the back-office context needed by the Elementor editor button.
 *
 * Determines which admin controllers support Elementor, resolves page IDs,
 * and constructs the editor URL.
 */
class EditorContext
{
    /** @var \Context */
    private $context;

    public function __construct(\Context $context)
    {
        $this->context = $context;
    }

    /**
     * Build the full BO context for a given admin controller.
     *
     * @return array{enabled: bool, pageType?: string, contentType?: string, newContent?: int, idPage?: int, onlyElementor?: array, justElementorCategory?: bool}
     */
    public function buildContext(string $controllerName): array
    {
        $cfgs = $this->getControllersConfig();
        if (!isset($cfgs[$controllerName])) {
            return ['enabled' => false];
        }

        $cfg = $cfgs[$controllerName];

        if (!$this->matchesConfig($cfg)) {
            return ['enabled' => false];
        }

        $idPage = $this->resolvePageId($cfg);
        $pageType = (string) ($cfg['pageType'] ?? 'default');
        $contentType = (string) ($cfg['contentType'] ?? 'default');
        $newContent = (int) ($cfg['newContent'] ?? 0);

        $onlyElementor = [];
        if (!empty($cfg['only_elementor_from']) && $idPage) {
            if ($cfg['only_elementor_from'] === 'cms') {
                $cms = new \CMS((int) $idPage);
                if (\Validate::isLoadedObject($cms) && is_array($cms->content)) {
                    $onlyElementor = $this->computeOnlyElementorFlags($cms->content);
                }
            } elseif ($cfg['only_elementor_from'] === 'simpleblog') {
                $post = new \SimpleBlogPost((int) $idPage);
                if (\Validate::isLoadedObject($post) && is_array($post->content)) {
                    $onlyElementor = $this->computeOnlyElementorFlags($post->content);
                }
            }
        }

        $justElementorCategory = false;
        if (!empty($cfg['just_elementor_category']) && $idPage) {
            $justElementorCategory = (bool) \IqitElementorCategory::isJustElementor((int) $idPage);
        }

        return [
            'enabled' => true,
            'pageType' => $pageType,
            'contentType' => $contentType,
            'newContent' => $newContent,
            'idPage' => (int) $idPage,
            'onlyElementor' => (array) $onlyElementor,
            'justElementorCategory' => (bool) $justElementorCategory,
        ];
    }

    /**
     * Build the URL to open the Elementor editor for a given page.
     */
    public function buildEditorUrl(string $pageType, string $contentType, int $newContent, int $pageId, int $idLang): string
    {
        if (!$pageId && !$newContent) {
            return '';
        }

        return $this->context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=' . $pageType
            . '&contentType=' . $contentType
            . '&newContent=' . (int) $newContent
            . '&pageId=' . (int) $pageId
            . '&idLang=' . (int) $idLang;
    }

    /**
     * Declare which BO controllers support Elementor.
     *
     * To add a new screen:
     * - Add an entry in this array (controller_name)
     * - Define pageType / contentType
     * - Specify the id source (Symfony attrs or GET param)
     */
    private function getControllersConfig(): array
    {
        return [
            'AdminCmsContent' => [
                'pageType' => 'cms',
                'contentType' => 'default',
                'id_attr_keys' => ['cmsPageId'],
                'only_elementor_from' => 'cms',
            ],
            'AdminSimpleBlogPosts' => [
                'pageType' => 'blog',
                'contentType' => 'default',
                'id_param' => 'id_simpleblog_post',
                'only_elementor_from' => 'simpleblog',
            ],
            'AdminCategories' => [
                'pageType' => 'category',
                'contentType' => 'default',
                'id_attr_keys' => ['categoryId'],
                'just_elementor_category' => true,
            ],
            'AdminManufacturers' => [
                'pageType' => 'content',
                'contentType' => 'brand',
                'id_attr_keys' => ['manufacturerId'],
            ],
            'AdminProducts' => [
                'pageType' => 'product',
                'contentType' => 'default',
                'id_attr_keys' => ['id', 'productId'],
            ],
            'AdminModules' => [
                'pageType' => 'content',
                'contentType' => 'iqitadditionaltabs',
                'id_param' => 'id_iqitadditionaltab',
                'when_get' => [
                    'configure' => 'iqitadditionaltabs',
                ],
                'when_get_any_keys' => ['updateiqitadditionaltabs', 'addiqitadditionaltabs'],
            ],
        ];
    }

    /**
     * Check whether the current request matches the activation conditions of a config entry.
     */
    private function matchesConfig(array $cfg): bool
    {
        if (!empty($cfg['when_get']) && is_array($cfg['when_get'])) {
            foreach ($cfg['when_get'] as $key => $expected) {
                $val = \Tools::getValue($key, null);

                if ($expected === true) {
                    if ($val === null || $val === '' || $val === false) {
                        return false;
                    }
                    continue;
                }

                if ((string) $val !== (string) $expected) {
                    return false;
                }
            }
        }

        if (!empty($cfg['when_get_any_keys']) && is_array($cfg['when_get_any_keys'])) {
            $ok = false;
            foreach ($cfg['when_get_any_keys'] as $key) {
                $val = \Tools::getValue((string) $key, null);
                if (!($val === null || $val === '' || $val === false)) {
                    $ok = true;
                    break;
                }
            }
            if (!$ok) {
                return false;
            }
        }

        return true;
    }

    private function resolvePageId(array $cfg): int
    {
        if (!empty($cfg['id_param'])) {
            return (int) \Tools::getValue($cfg['id_param']);
        }

        $request = $this->getSymfonyRequest();
        if (!$request) {
            return 0;
        }

        $keys = !empty($cfg['id_attr_keys']) && is_array($cfg['id_attr_keys']) ? $cfg['id_attr_keys'] : [];
        foreach ($keys as $k) {
            $v = (int) $request->attributes->get($k);
            if ($v) {
                return $v;
            }
        }

        return 0;
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Request|null
     */
    private function getSymfonyRequest()
    {
        if (!isset($GLOBALS['kernel'])) {
            return null;
        }

        try {
            $request = $GLOBALS['kernel']->getContainer()->get('request_stack')->getCurrentRequest();
        } catch (\Exception $e) {
            return null;
        }

        return $request;
    }

    /**
     * @return array<int|string, int>
     */
    private function computeOnlyElementorFlags(array $contentByLang): array
    {
        $onlyElementor = [];

        foreach ($contentByLang as $key => $contentLang) {
            $onlyElementor[$key] = $this->isElementorJsonContent((string) $contentLang) ? 1 : 0;
        }

        return $onlyElementor;
    }

    private function isElementorJsonContent(string $html): bool
    {
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $html);
        $stripped = str_replace(["\r\n", "\n", "\r"], '', (string) $stripped);

        $decoded = json_decode($stripped, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        return !empty($decoded);
    }
}
