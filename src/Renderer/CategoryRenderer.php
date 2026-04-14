<?php

namespace IqitElementor\Renderer;

class CategoryRenderer extends AbstractContentRenderer
{
    public function supports(string $hookName): bool
    {
        return (bool) preg_match('/^displayCategoryElementor\d*$/', $hookName);
    }

    public function getTemplateFile(): string
    {
        return 'generated_content.tpl';
    }

    public function render(string $hookName, array $configuration, bool $previewMode): array
    {
        $content = '';
        $categoryId = (int) $configuration['smarty']->tpl_vars['category']->value['id'];
        $idShop = (int) $this->context->shop->id;
        $id = \IqitElementorCategory::getIdByCategory($categoryId, $idShop);

        if ($id) {
            $layout = new \IqitElementorCategory($id, $this->context->language->id, $idShop);

            if (\Validate::isLoadedObject($layout)) {
                $content = $this->resolveAndRender($layout, $previewMode);
            }
        }

        return ['content' => $content, 'options' => []];
    }
}
