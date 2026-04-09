<?php

namespace IqitElementor\Core;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Editor
{
    public function isEditMode(): bool
    {
        $controller = \Tools::getValue('controller');
        $action = \Tools::getValue('action');

        // Admin editor page
        if ($controller === 'AdminIqitElementorEditor') {
            return true;
        }

        // Front widget preview/render (AJAX from editor)
        if ($controller === 'Widget' && in_array($action, ['widgetPreview', 'renderWidget'], true)) {
            return true;
        }

        // Fallback: admin controller context (PS 8 Symfony routing)
        $context = \Context::getContext();
        if (isset($context->controller->controller_name)
            && $context->controller->controller_name === 'AdminIqitElementorEditor') {
            return true;
        }

        return false;
    }

    public function printPanelHtml(): void
    {
        $editorPath = _PS_MODULE_DIR_ . 'iqitelementor/views/templates/editor/';
        include $editorPath . 'editor-wrapper.php';
        include $editorPath . 'panel.php';
        include $editorPath . 'panel-elements.php';
        include $editorPath . 'repeater.php';
        include $editorPath . 'navigator.php';
        include $editorPath . 'templates.php';
        include $editorPath . 'styles.php';

        Plugin::instance()->controlsManager->renderControls();
        Plugin::instance()->widgetsManager->renderWidgetsContent();
        Plugin::instance()->elementsManager->renderElementsContent();
    }
}
