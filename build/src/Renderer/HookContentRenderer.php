<?php

namespace IqitElementor\Renderer;

/**
 * Catch-all renderer for generic display hooks.
 *
 * Must be registered last in the renderer chain, as it matches any hook
 * starting with "display".
 */
class HookContentRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^display.*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content_content.tpl';
    }

    public function buildCacheId(string $hookName, array $configuration): string
    {
        return 'iqitelementor|' . $hookName;
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $content = '';
        $idHook = (int) \Hook::getIdByName($hookName);
        $rows = \IqitElementorContent::getByHook($idHook);

        if (is_array($rows)) {
            foreach ($rows as $row) {
                $layout = new \IqitElementorContent((int) $row['id_elementor'], $this->context->language->id);

                if (\Validate::isLoadedObject($layout)) {
                    $content .= $this->resolveAndRender($layout, $previewMode);
                }
            }
        }

        return ['content' => $content, 'options' => []];
    }
}
