<?php

namespace IqitElementor\Renderer;

class ManufacturerRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayManufacturerElementor\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content_cms.tpl';
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $description = '';

        if (isset($configuration['smarty']->tpl_vars['manufacturer'])) {
            $description = $configuration['smarty']->tpl_vars['manufacturer']->value['description'];
        }

        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', (string) $description);
        $stripped = str_replace(["\r\n", "\n", "\r"], '', $stripped);

        $decoded = json_decode($stripped, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $this->renderFrontend($stripped, (array) $decoded);

            return ['content' => $content, 'options' => ['elementor' => true]];
        }

        return ['content' => $description, 'options' => ['elementor' => false]];
    }
}
