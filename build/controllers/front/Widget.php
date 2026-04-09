<?php

use IqitElementor\Core\Plugin;

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorWidgetModuleFrontController extends ModuleFrontController
{
    /**
     * Intentionally empty — widget rendering does not require additional CSS/JS
     * beyond what the parent front controller already loads.
     */
    public function setMedia()
    {
    }

    public function initContent()
    {
        if (!Tools::getValue('iqit_fronteditor_token') || !(Tools::getValue('iqit_fronteditor_token') == $this->module->getFrontEditorToken()) || !Tools::getIsset('id_employee') || !$this->module->checkEnvironment()) {
            Tools::redirect('index.php');
        }

        $this->assignGeneralPurposeVariables();
    }

    /**
     * Intentionally empty — widget controller renders raw HTML via AJAX,
     * it does not use a Smarty layout template.
     */
    public function getLayout()
    {
    }

    /**
     * Intentionally empty — output is handled by displayAjaxRenderWidget()
     * which directly echoes the widget HTML.
     */
    public function display()
    {
    }

    /**
     * Intentionally empty — widget controller does not need page-level
     * template variables (breadcrumb, meta, etc.).
     */
    public function getTemplateVarPage()
    {
    }

    public function displayAjaxRenderWidget()
    {
        if (!Tools::getValue('iqit_fronteditor_token') || !(Tools::getValue('iqit_fronteditor_token') == $this->module->getFrontEditorToken()) || !Tools::getIsset('id_employee') || !$this->module->checkEnvironment()) {
            Tools::redirect('index.php');
        }

        Plugin::instance()->widgetsManager->ajaxRenderWidget();
        exit;
    }

    protected function displayMaintenancePage()
    {
        return;
    }
}
