<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminIqitElementorContentController extends ModuleAdminController
{
    use \IqitElementor\Traits\AdminControllerTrait;

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

        if ($this->initMultishopContent()) {
            return;
        }

        parent::initContent();
    }

    public function postProcess()
    {
        if (Tools::isSubmit('submit' . $this->className)) {
            // Validate custom hook before save
            if (Tools::getValue('hook') === 'custom') {
                $customHookName = trim(Tools::getValue('custom_hook_name'));
                if (empty($customHookName)) {
                    $this->errors[] = $this->module->getTranslator()->trans('Please enter a custom hook name.', [], 'Modules.Iqitelementor.Admin');

                    return false;
                }
            }

            if (Tools::getValue('submitEdit' . $this->className)) {
                if (Validate::isLoadedObject($object = $this->loadObject())) {
                    $this->module->clearHookCache($object->hook);
                }
            }
            $returnObject = $this->processSave();
            if (!$returnObject) {
                return false;
            }
            $idHook = (int) $returnObject->hook;
            $hook_name = Hook::getNameById($idHook);
            if (!Hook::isModuleRegisteredOnHook($this->module, $hook_name, $this->context->shop->id)) {
                Hook::registerHook($this->module, $hook_name);
            }

            $this->module->clearHookCache($idHook);

            Tools::redirectAdmin($this->context->link->getAdminLink('Admin' . $this->name) . '&id_elementor=' . $returnObject->id . '&updateiqit_elementor_content');
        }

        return parent::postProcess();
    }

    /**
     * @param ObjectModel $object
     * @param string|null $table
     */
    protected function copyFromPost(&$object, $table = null): void
    {
        parent::copyFromPost($object, $table);

        // Resolve custom hook name to a hook ID
        if ($object->hook === 'custom') {
            $customHookName = trim(Tools::getValue('custom_hook_name'));
            $idHook = Hook::getIdByName($customHookName);
            if (!$idHook) {
                $hookObj = new Hook();
                $hookObj->name = $customHookName;
                $hookObj->title = $customHookName;
                $hookObj->add();
                $idHook = (int) $hookObj->id;
            }
            $object->hook = (int) $idHook;
        }

        // Clear autosave fields not managed by this form
        $object->autosave_content = null;
        $object->autosave_at = null;
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
            $url = $this->context->link->getAdminLink('AdminIqitElementorEditor') . '&pageType=content&pageId=' . $landing->id;
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
                    'class' => 'chosen',
                    'required' => true,
                    'options' => [
                        'query' => $this->getHookOptionsWithCustom(),
                        'id' => 'id',
                        'name' => 'name',
                    ],
                ],
                [
                    'type' => 'text',
                    'label' => $this->module->getTranslator()->trans('Custom hook name', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'custom_hook_name',
                    'desc' => $this->module->getTranslator()->trans('Enter the name of the hook (e.g. displayMyCustomHook)', [], 'Modules.Iqitelementor.Admin'),
                    'form_group_class' => 'custom-hook-field',
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
        $helper->fields_value['custom_hook_name'] = '';

        // If the current hook is not in the selectable list, treat it as custom
        if ($landing->id && $landing->hook) {
            $selectableIds = array_column(IqitElementorContent::getSelectableHooks(), 'id');
            if (!in_array($landing->hook, $selectableIds)) {
                $helper->fields_value['hook'] = 'custom';
                $helper->fields_value['custom_hook_name'] = Hook::getNameById((int) $landing->hook);
            }
        }

        if ($landing->id) {
            $helper->fields_value['id_elementor'] = $landing->id;
        }

        $formHtml = $helper->generateForm($this->fields_form);

        // Append revision panel and autosave banner
        if ($landing->id) {
            $formHtml .= $this->renderRevisionPanel(
                \IqitElementor\Enum\EntityType::CONTENT,
                (int) $landing->id
            );
        }

        return $formHtml;
    }

    public function initToolBarTitle()
    {
        $this->toolbar_title[] = $this->module->getTranslator()->trans('Content on hooks', [], 'Modules.Iqitelementor.Admin');
    }

    /**
     * @return array
     */
    private function getHookOptionsWithCustom(): array
    {
        $hooks = IqitElementorContent::getSelectableHooks();

        $hooks[] = [
            'id' => 'custom',
            'name' => '— ' . $this->module->getTranslator()->trans('Custom hook', [], 'Modules.Iqitelementor.Admin') . ' —',
        ];

        return $hooks;
    }

    /**
     * @param object $object
     *
     * @throws PrestaShopDatabaseException
     */
    protected function afterAdd($object): void
    {
        \IqitElementor\Core\HookRegistrar::synchronize($this->module);
    }

    /**
     * @param object $object
     *
     * @throws PrestaShopDatabaseException
     */
    protected function afterUpdate($object): void
    {
        \IqitElementor\Core\HookRegistrar::synchronize($this->module);
    }
}
