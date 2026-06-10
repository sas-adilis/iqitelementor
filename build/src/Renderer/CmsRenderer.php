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

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $cmsContent = $configuration['smarty']->tpl_vars['cms']->value['content'];
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $cmsContent);
        $stripped = str_replace(["\r\n", "\n", "\r"], '', (string) $stripped);

        $decoded = json_decode($stripped, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $this->renderFrontend($stripped, (array) $decoded);

            return ['content' => $content, 'options' => ['elementor' => true]];
        }

        return ['content' => $cmsContent, 'options' => ['elementor' => false]];
    }
}
