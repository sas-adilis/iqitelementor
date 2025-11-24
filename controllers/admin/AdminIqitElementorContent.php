<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminIqitElementorContentController extends ModuleAdminController
{
    public $name;

    public function __construct()
    {
        $this->bootstrap = true;
        $this->className = 'IqitElementorContent';
        $this->table = 'iqit_elementor_content';

        $hookId = Hook::getIdByName('displayManufacturerElementor');

        $this->_where = 'AND a.`hook` != ' . (int) $hookId;

        $this->addRowAction('edit');
        $this->addRowAction('delete');
        parent::__construct();

        $this->_orderBy = 'id_elementor';
        $this->identifier = 'id_elementor';
        $test = [];
        $test[0] = [
            'id' => 0,
            'name' => $this->module->getTranslator()->trans('No results were found for your search.', [], 'Modules.Iqitelementor.Admin'),
        ];

        $this->fields_list = [
            'id_elementor' => ['title' => $this->module->getTranslator()->trans('ID', [], 'Modules.Iqitelementor.Admin'), 'align' => 'center', 'class' => 'fixed-width-xs'],
            'title' => ['title' => $this->module->getTranslator()->trans('Name', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto'],
            'hook' => ['title' => $this->module->getTranslator()->trans('Hook', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto', 'callback' => 'formatHook'],
            'active' => ['title' => $this->module->getTranslator()->trans('Active', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto', 'align' => 'center', 'type' => 'bool', 'class' => 'fixed-width-xs'],
        ];

        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'IqitElementorContent';
    }

    public static function formatHook($idHook)
    {
        return Hook::getNameById($idHook);
    }

    public function init()
    {
        if (Tools::isSubmit('edit' . $this->className)) {
            $this->display = 'edit';
        } elseif (Tools::isSubmit('addiqit_elementor_landing')) {
            $this->display = 'add';
        }

        parent::init();
    }

    public function initContent()
    {
        if (!$this->viewAccess()) {
            $this->errors[] = Tools::displayError('You do not have permission to view this.');

            return;
        }

        if (Shop::getContext() == Shop::CONTEXT_GROUP || Shop::getContext() == Shop::CONTEXT_ALL) {
            $this->context->smarty->assign([
                'content' => $this->getWarningMultishopHtml(),
            ]);

            return;
        }

        parent::initContent();
    }

    public function postProcess()
    {
        if (Tools::isSubmit('submit' . $this->className)) {
            if (Tools::getValue('submitEdit' . $this->className)) {
                if (Validate::isLoadedObject($object = $this->loadObject())) {
                    $this->module->clearHookCache($object->hook);
                }
            }
            $returnObject = $this->processSave();
            if (!$returnObject) {
                return false;
            }
            $idHook = (int) Tools::getValue('hook');
            $hook_name = Hook::getNameById($idHook);
            if (!Hook::isModuleRegisteredOnHook($this->module, $hook_name, $this->context->shop->id)) {
                Hook::registerHook($this->module, $hook_name);
            }

            $this->module->clearHookCache($idHook);

            Tools::redirectAdmin($this->context->link->getAdminLink('Admin' . $this->name) . '&id_elementor=' . $returnObject->id . '&updateiqit_elementor_content');
        }

        return parent::postProcess();
    }

    public function processDelete()
    {
        if (Validate::isLoadedObject($object = $this->loadObject())) {
            if (IqitElementorContent::getCountByIdHook((int) $object->hook) <= 1) {
                Hook::unregisterHook($this->module, Hook::getNameById((int) $object->hook));
            }
            $this->module->clearHookCache($object->hook);
        }

        return parent::processDelete();
    }

    public function renderForm()
    {
        $landing = new IqitElementorContent((int) Tools::getValue('id_elementor'));

        if ($landing->id) {
            $url = $this->context->link->getAdminLink('IqitElementorEditor') . '&pageType=content&pageId=' . $landing->id;
        } else {
            $url = false;
            $landing->active = 1;
        }

        $this->fields_form[0]['form'] = [
            'legend' => [
                'title' => isset($landing->id) ? $this->module->getTranslator()->trans('Edit layout.', [], 'Modules.Iqitelementor.Admin') : $this->module->getTranslator()->trans('New layout', [], 'Modules.Iqitelementor.Admin'),
                'icon' => isset($landing->id) ? 'icon-edit' : 'icon-plus-square',
            ],
            'input' => [
                [
                    'type' => 'hidden',
                    'name' => 'id_elementor',
                ],
                [
                    'type' => 'text',
                    'label' => $this->module->getTranslator()->trans('Title of layout', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'title',
                    'required' => true,
                ],
                [
                    'type' => 'select',
                    'label' => $this->module->getTranslator()->trans('Hook', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'hook',
                    'options' => [
                        'query' => IqitElementorContent::getSelectableHooks(),
                        'id' => 'id',
                        'name' => 'name',
                    ],
                ],
                [
                    'type' => 'switch',
                    'label' => $this->module->getTranslator()->trans('Status', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'active',
                    'is_bool' => true,
                    'values' => [
                        [
                            'id' => 'active_on',
                            'value' => true,
                            'label' => $this->module->getTranslator()->trans('Enabled', [], 'Modules.Iqitelementor.Admin'),
                        ],
                        [
                            'id' => 'active_off',
                            'value' => false,
                            'label' => $this->module->getTranslator()->trans('Disabled', [], 'Modules.Iqitelementor.Admin'),
                        ],
                    ],
                ],
                [
                    'type' => 'elementor_trigger',
                    'label' => $this->module->getTranslator()->trans('Title of layout', [], 'Modules.Iqitelementor.Admin'),
                    'url' => $url,
                ],
                [
                    'type' => 'hidden',
                    'name' => 'id_shop',
                ],
            ],
            'buttons' => [
                'cancelBlock' => [
                    'title' => $this->module->getTranslator()->trans('Cancel', [], 'Modules.Iqitelementor.Admin'),
                    'href' => (Tools::safeOutput(Tools::getValue('back', false)))
                        ?: $this->context->link->getAdminLink('Admin' . $this->name),
                    'icon' => 'process-icon-cancel',
                ],
            ],
            'submit' => [
                'name' => 'submit' . $this->className,
                'title' => $this->module->getTranslator()->trans('Save and stay', [], 'Modules.Iqitelementor.Admin'),
            ],
        ];

        if (Tools::getValue('title')) {
            $landing->title = Tools::getValue('title');
        }

        $helper = $this->buildHelper();
        if (isset($landing->id)) {
            $helper->currentIndex = AdminController::$currentIndex . '&id_elementor=' . $landing->id;
            $helper->submit_action = 'submitEdit' . $this->className;
        } else {
            $helper->submit_action = 'submitAdd' . $this->className;
        }

        $helper->fields_value = (array) $landing;
        $helper->fields_value['id_shop'] = $this->context->shop->id;
        if ($landing->id) {
            $helper->fields_value['id_elementor'] = $landing->id;
        }

        return $helper->generateForm($this->fields_form);
    }

    protected function buildHelper()
    {
        $helper = new HelperForm();

        $helper->module = $this->module;
        $helper->override_folder = 'iqitelementor/';
        $helper->identifier = $this->className;
        $helper->token = Tools::getAdminTokenLite('Admin' . $this->name);
        $helper->languages = $this->_languages;
        $helper->currentIndex = $this->context->link->getAdminLink('Admin' . $this->name);
        $helper->default_form_language = $this->default_form_language;
        $helper->allow_employee_form_lang = $this->allow_employee_form_lang;
        $helper->toolbar_scroll = true;
        $helper->toolbar_btn = $this->initToolbar();

        return $helper;
    }

    public function initToolBarTitle()
    {
        $this->toolbar_title[] = $this->module->getTranslator()->trans('Content on hooks', [], 'Modules.Iqitelementor.Admin');
    }

    protected function getWarningMultishopHtml()
    {
        if (Shop::getContext() == Shop::CONTEXT_GROUP || Shop::getContext() == Shop::CONTEXT_ALL) {
            return '<p class="alert alert-warning">'
            . $this->l('You cannot manage module from a "All Shops" or a "Group Shop" context, select directly the shop you want to edit')
            . '</p>';
        } else {
            return '';
        }
    }
}
