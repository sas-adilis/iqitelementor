<?php

namespace IqitElementor\Renderer;

class CmsRenderer extends AbstractContentRenderer
{
    private const HOOK_NAME = 'displayCMSDisputeInformation';

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
        $cmsId = 0;
        if (isset($configuration['smarty']->tpl_vars['cms'])) {
            $cms = $configuration['smarty']->tpl_vars['cms']->value;
            if (is_array($cms) && isset($cms['id'])) {
                $cmsId = (int) $cms['id'];
            } elseif (is_object($cms) && isset($cms->id)) {
                $cmsId = (int) $cms->id;
            }
        }

        if ($cmsId <= 0) {
            return ['content' => '', 'options' => []];
        }

        $rawData = $this->loadRawElementorData($cmsId);
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

    private function loadRawElementorData(int $cmsId): string
    {
        $hookId = (int) \Hook::getIdByName(self::HOOK_NAME);
        if (!$hookId) {
            return '';
        }

        $idElementor = (int) \IqitElementorContent::getIdByObjectAndHook($hookId, $cmsId);
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
