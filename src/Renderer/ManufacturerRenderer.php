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
        $content = '';
        $manufacturerId = (int) $configuration['manufacturerId'];
        $idShop = (int) $this->context->shop->id;
        $hookId = (int) \Hook::getIdByName($hookName);
        $id = \IqitElementorContent::getIdByObjectAndHook($hookId, $manufacturerId, $idShop);

        if ($id) {
            $layout = new \IqitElementorContent($id, $this->context->language->id, $idShop);

            if (\Validate::isLoadedObject($layout)) {
                $content = $this->resolveAndRender($layout, $previewMode);
            }
        }

        return ['content' => $content, 'options' => ['elementor' => false]];
    }
}
