<?php

namespace IqitElementor\Renderer;

class CmsRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayCMSDisputeInformation\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content_cms.tpl';
    }

    public function buildCacheId(string $hookName, array $configuration): string
    {
        $cmsId = (int) $configuration['smarty']->tpl_vars['cms']->value['id'];

        return 'iqitelementor|' . $hookName . '|' . $cmsId;
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $cmsContent = $configuration['smarty']->tpl_vars['cms']->value['content'];
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $cmsContent);
        $stripped = str_replace(["\r\n", "\n", "\r"], '', (string) $stripped);

        $decoded = json_decode($stripped, true);

        // @TODO TEMP DEBUG — remove after diagnosis
        \PrestaShopLogger::addLog('iqitelementor: CMS hook fired, json_last_error=' . json_last_error(), 1);

        if (json_last_error() === JSON_ERROR_NONE) {
            \PrestaShopLogger::addLog('iqitelementor: JSON OK, starting getFrontend', 1);
            $content = $this->renderFrontend((array) $decoded);
            \PrestaShopLogger::addLog('iqitelementor: getFrontend completed, content length=' . strlen($content), 1);

            return ['content' => $content, 'options' => ['elementor' => true]];
        }

        \PrestaShopLogger::addLog(
            'iqitelementor: JSON FAILED: ' . json_last_error_msg() . ' | raw=' . substr($stripped, 0, 200),
            3
        );

        return ['content' => $cmsContent, 'options' => ['elementor' => false]];
    }
}
