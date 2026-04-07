<?php

namespace IqitElementor\Renderer;

class HomeRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayHome\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content.tpl';
    }

    public function buildCacheId(string $hookName, array $configuration): string
    {
        return 'iqitelementor|' . $hookName;
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $content = '';
        $layoutId = (int) \Configuration::get('iqit_homepage_layout');
        $layout = new \IqitElementorLanding($layoutId, $this->context->language->id);

        if (\Validate::isLoadedObject($layout)) {
            $content = $this->resolveAndRender($layout, $previewMode);
        }

        return ['content' => $content, 'options' => []];
    }
}
