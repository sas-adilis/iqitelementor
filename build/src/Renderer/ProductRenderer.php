<?php

namespace IqitElementor\Renderer;

class ProductRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayProductElementor\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content.tpl';
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $content = '';
        $productId = (int) $configuration['smarty']->tpl_vars['product']->value['id'];
        $idShop = (int) $this->context->shop->id;
        $id = \IqitElementorProduct::getIdByProduct($productId, $idShop);

        if ($id) {
            $layout = new \IqitElementorProduct($id, $this->context->language->id, $idShop);

            if (\Validate::isLoadedObject($layout)) {
                $content = $this->resolveAndRender($layout, $previewMode);
            }
        }

        return ['content' => $content, 'options' => []];
    }
}
