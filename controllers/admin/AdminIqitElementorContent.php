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

        $this->_select = '"" as elementor_link';

        $this->addRowAction('edit');
        $this->addRowAction('delete');
        parent::__construct();

        $this->_orderBy = 'id_elementor';
        $this->identifier = 'id_elementor';

        $this->fields_list = [
            'id_elementor' => ['title' => $this->module->getTranslator()->trans('ID', [], 'Modules.Iqitelementor.Admin'), 'align' => 'center', 'class' => 'fixed-width-xs'],
            'title' => ['title' => $this->module->getTranslator()->trans('Name', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto'],
            'hook' => ['title' => $this->module->getTranslator()->trans('Hook', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto', 'callback' => 'formatHook'],
            'active' => ['title' => $this->module->getTranslator()->trans('Active', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto', 'align' => 'center', 'type' => 'bool', 'class' => 'fixed-width-xs'],
            'elementor_link' => [
                'title' => 'Elementor',
                'align' => 'center',
                'class' => 'fixed-width-sm',
                'search' => false,
                'orderby' => false,
                'callback' => 'renderElementorGridIcon',
            ],
        ];

        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'IqitElementorContent';
    }

    public function renderElementorGridIcon($value, $row)
    {
        $id = isset($row['id_elementor']) ? (int) $row['id_elementor'] : 0;
        if (!$id) {
            return '';
        }

        $url = $this->context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=content&contentType=default&newContent=0'
            . '&idLang=' . (int) $this->context->language->id
            . '&pageId=' . $id;

        $logoUrl = _MODULE_DIR_ . 'iqitelementor/logo.png';

        return '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" '
            . 'title="' . htmlspecialchars($this->module->getTranslator()->trans('Edit with Elementor', [], 'Modules.Iqitelementor.Admin'), ENT_QUOTES, 'UTF-8') . '" '
            . 'class="elementor-grid-link">'
            . '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES, 'UTF-8') . '" alt="Elementor" class="elementor-grid-logo" style="width:20px;height:20px;">'
            . '</a>';
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

    /** @var int|null Hook ID before save, captured for edit so we can detect a hook change. */
    private $previousHookId;

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

            // Capture the previous hook ID before processSave overwrites it,
            // so afterUpdate() can detect a hook change and unregister the old one.
            if (Tools::getValue('submitEdit' . $this->className)) {
                if (Validate::isLoadedObject($object = $this->loadObject())) {
                    $this->previousHookId = (int) $object->hook;
                    $this->module->clearHookCache((int) $object->hook);
                }
            }

            $returnObject = $this->processSave();
            if (!$returnObject) {
                return false;
            }

            $this->ensureModuleHookedOn((int) $returnObject->hook);

            // Hook changed on edit: drop the module from the previous hook if
            // no other content is still bound to it, otherwise we'd keep
            // executing on a hook that has nothing to render.
            if ($this->previousHookId
                && $this->previousHookId !== (int) $returnObject->hook
                && IqitElementorContent::getCountByIdHook($this->previousHookId) === 0
            ) {
                try {
                    $previousHookName = Hook::getNameById($this->previousHookId);
                    if ($previousHookName) {
                        Hook::unregisterHook($this->module, $previousHookName);
                    }
                } catch (\Exception $e) {
                    // Hook deleted in the meantime — nothing to unregister.
                }
                $this->flushHookExecCaches();
            }

            $this->module->clearHookCache((int) $returnObject->hook);

            Tools::redirectAdmin($this->context->link->getAdminLink('Admin' . $this->name) . '&id_elementor=' . $returnObject->id . '&updateiqit_elementor_content');
        }

        return parent::postProcess();
    }

    /**
     * Register the module on the given hook (if not already) and invalidate
     * PrestaShop's hook caches so the new wiring takes effect on the next
     * front request without waiting for cache expiration.
     */
    private function ensureModuleHookedOn(int $idHook): void
    {
        if ($idHook <= 0) {
            return;
        }

        try {
            $hookName = Hook::getNameById($idHook);
        } catch (\Exception $e) {
            return;
        }

        if (!$hookName) {
            return;
        }

        // Widget sentinel: the content is rendered via {widget} from a
        // template, so the module must not be greffed on this virtual hook.
        if ($hookName === IqitElementorContent::WIDGET_HOOK_NAME) {
            return;
        }

        // The instance method is the canonical PS API and handles "already
        // registered" gracefully (skips duplicate inserts per shop).
        $this->module->registerHook($hookName);

        $this->flushHookExecCaches();
    }

    /**
     * Clean the PrestaShop hook caches that gate front execution. Without
     * this, a freshly-registered hook stays invisible until the static cache
     * is dropped (next process / cache TTL).
     */
    private function flushHookExecCaches(): void
    {
        Cache::clean('hook_module_list');
        Cache::clean(Hook::MODULE_LIST_BY_HOOK_KEY . '*');
        Cache::clean('hook_idsbyname');
        Cache::clean('hook_idsbyname_withalias');
        Cache::clean('active_hooks');
    }

    /**
     * @param ObjectModel $object
     * @param string|null $table
     */
    protected function copyFromPost(&$object, $table = null): void
    {
        parent::copyFromPost($object, $table);

        // Resolve "widget" sentinel and "custom" hook to a real hook ID
        if ($object->hook === 'widget') {
            $object->hook = (int) $this->resolveWidgetSentinelHookId();
        } elseif ($object->hook === 'custom') {
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
                try {
                    $hookName = Hook::getNameById((int) $object->hook);
                    if ($hookName) {
                        Hook::unregisterHook($this->module, $hookName);
                        $this->flushHookExecCaches();
                    }
                } catch (\Exception $e) {
                    // Hook missing — nothing to unregister.
                }
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
                    'type' => 'text',
                    'label' => $this->module->getTranslator()->trans('Widget tag', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'widget_tag',
                    'desc' => $this->module->getTranslator()->trans('Copy/paste this Smarty tag into any template to render this layout. Save the layout first to get an ID.', [], 'Modules.Iqitelementor.Admin'),
                    'form_group_class' => 'widget-tag-field',
                    'readonly' => true,
                    'class' => 'widget-tag-input',
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
        $helper->fields_value['widget_tag'] = $landing->id
            ? '{widget name="iqitelementor" id_content=' . (int) $landing->id . '}'
            : '';

        // If the current hook is the widget sentinel, pre-select "widget" in
        // the dropdown. Otherwise, if the hook isn't in the selectable list,
        // treat it as custom and surface its name.
        if ($landing->id && $landing->hook) {
            $currentHookName = '';
            try {
                $currentHookName = Hook::getNameById((int) $landing->hook);
            } catch (\Exception $e) {
                $currentHookName = '';
            }

            if ($currentHookName === IqitElementorContent::WIDGET_HOOK_NAME) {
                $helper->fields_value['hook'] = 'widget';
            } else {
                $selectableIds = array_column(IqitElementorContent::getSelectableHooks(), 'id');
                if (!in_array($landing->hook, $selectableIds)) {
                    $helper->fields_value['hook'] = 'custom';
                    $helper->fields_value['custom_hook_name'] = $currentHookName;
                }
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
            'id' => 'widget',
            'name' => '— ' . $this->module->getTranslator()->trans('Widget (no hook, render with {widget} tag)', [], 'Modules.Iqitelementor.Admin') . ' —',
        ];

        $hooks[] = [
            'id' => 'custom',
            'name' => '— ' . $this->module->getTranslator()->trans('Custom hook', [], 'Modules.Iqitelementor.Admin') . ' —',
        ];

        return $hooks;
    }

    /**
     * Resolve the sentinel hook ID for "widget" mode, creating the row in
     * ps_hook on first use so the FK in ps_iqit_elementor_content remains
     * valid. Module is never registered on this hook.
     */
    private function resolveWidgetSentinelHookId(): int
    {
        $idHook = (int) Hook::getIdByName(IqitElementorContent::WIDGET_HOOK_NAME);
        if ($idHook) {
            return $idHook;
        }

        $hookObj = new Hook();
        $hookObj->name = IqitElementorContent::WIDGET_HOOK_NAME;
        $hookObj->title = 'Iqitelementor virtual widget hook';
        $hookObj->add();

        return (int) $hookObj->id;
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
