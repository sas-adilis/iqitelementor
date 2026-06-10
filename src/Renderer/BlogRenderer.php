<?php

namespace IqitElementor\Renderer;

class BlogRenderer extends AbstractContentRenderer
{
    private const HOOK_NAME = 'displayBlogElementor';

    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayBlogElementor\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content_cms.tpl';
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $postId = 0;
        if (isset($configuration['smarty']->tpl_vars['post'])) {
            $post = $configuration['smarty']->tpl_vars['post']->value;
            if (is_object($post) && isset($post->id_simpleblog_post)) {
                $postId = (int) $post->id_simpleblog_post;
            } elseif (is_object($post) && isset($post->id)) {
                $postId = (int) $post->id;
            } elseif (is_array($post) && isset($post['id_simpleblog_post'])) {
                $postId = (int) $post['id_simpleblog_post'];
            } elseif (is_array($post) && isset($post['id'])) {
                $postId = (int) $post['id'];
            }
        }

        if ($postId <= 0) {
            return ['content' => '', 'options' => []];
        }

        $rawData = $this->loadRawElementorData($postId);
        if ($rawData === '') {
            return ['content' => '', 'options' => []];
        }

        $decoded = json_decode($rawData, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return ['content' => '', 'options' => []];
        }

        $content = $this->renderFrontend($rawData, $decoded);

        return ['content' => $content, 'options' => ['elementor' => true]];
    }

    private function loadRawElementorData(int $postId): string
    {
        $hookId = (int) \Hook::getIdByName(self::HOOK_NAME);
        if (!$hookId) {
            return '';
        }

        $idElementor = (int) \IqitElementorContent::getIdByObjectAndHook($hookId, $postId);
        if (!$idElementor) {
            return '';
        }

        $idLang = (int) $this->context->language->id;
        $content = new \IqitElementorContent($idElementor, $idLang);
        if (!\Validate::isLoadedObject($content)) {
            return '';
        }

        if (is_array($content->data)) {
            return isset($content->data[$idLang]) ? (string) $content->data[$idLang] : '';
        }

        return (string) $content->data;
    }
}
