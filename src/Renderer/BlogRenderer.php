<?php

namespace IqitElementor\Renderer;

class BlogRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayBlogElementor\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content_cms.tpl';
    }

    public function buildCacheId(string $hookName, array $configuration): string
    {
        $blogId = (int) $configuration['smarty']->tpl_vars['post']->value->id_simpleblog_post;

        return 'iqitelementor|' . $hookName . '|' . $blogId;
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $blogContent = $configuration['smarty']->tpl_vars['post']->value->content;
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $blogContent);
        $stripped = str_replace(["\r", "\n"], '', (string) $stripped);

        $decoded = json_decode($stripped, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            $content = $this->renderFrontend((array) $decoded);

            return ['content' => $content, 'options' => ['elementor' => true]];
        }

        return ['content' => $blogContent, 'options' => ['elementor' => false]];
    }
}
