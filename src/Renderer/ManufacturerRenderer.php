<?php

namespace IqitElementor\Renderer;

class ManufacturerRenderer extends AbstractContentRenderer
{
    private const HOOK_NAME = 'displayManufacturerElementor';

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
        $manufacturerId = 0;
        if (isset($configuration['smarty']->tpl_vars['manufacturer'])) {
            $manufacturer = $configuration['smarty']->tpl_vars['manufacturer']->value;
            if (is_array($manufacturer) && isset($manufacturer['id'])) {
                $manufacturerId = (int) $manufacturer['id'];
            } elseif (is_object($manufacturer) && isset($manufacturer->id)) {
                $manufacturerId = (int) $manufacturer->id;
            }
        }

        if ($manufacturerId <= 0) {
            return ['content' => '', 'options' => []];
        }

        $rawData = $this->loadRawElementorData($manufacturerId);
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

    /**
     * Read the raw Elementor JSON for this manufacturer/language directly
     * from the dedicated `iqit_elementor_content` storage (bypasses the
     * native description field, which used to corrupt the JSON via
     * HTMLPurifier and TinyMCE round-trips).
     */
    private function loadRawElementorData(int $manufacturerId): string
    {
        $hookId = (int) \Hook::getIdByName(self::HOOK_NAME);
        if (!$hookId) {
            return '';
        }

        $idElementor = (int) \IqitElementorContent::getIdByObjectAndHook($hookId, $manufacturerId);
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
