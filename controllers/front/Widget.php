<?php
use Elementor\PluginElementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorWidgetModuleFrontController extends ModuleFrontController
{
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

    public function getLayout()
    {
    }

    public function display()
    {
    }

    public function getTemplateVarPage()
    {
    }

    public function displayAjaxRenderWidget()
    {
        if (!Tools::getValue('iqit_fronteditor_token') || !(Tools::getValue('iqit_fronteditor_token') == $this->module->getFrontEditorToken()) || !Tools::getIsset('id_employee') || !$this->module->checkEnvironment()) {
            Tools::redirect('index.php');
        }

        PluginElementor::instance()->widgets_manager->ajax_render_widget();
        exit;
    }

    protected function displayMaintenancePage()
    {
        return;
    }
}
