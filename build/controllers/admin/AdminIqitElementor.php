<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminIqitElementorController extends ModuleAdminController
{
    use \IqitElementor\Traits\AdminControllerTrait;

    public $name;

    public function __construct()
    {
        $this->bootstrap = true;
        $this->className = 'IqitElementorLanding';
        $this->table = 'iqit_elementor_landing';

        $this->addRowAction('edit');
        $this->addRowAction('delete');
        parent::__construct();

        $this->_where = 'AND a.`id_shop` = ' . (int) Context::getContext()->shop->id;
        $this->_orderBy = 'id_iqit_elementor_landing';
        $this->identifier = 'id_iqit_elementor_landing';
        $this->_select = '"" as elementor_link';
        $test = [];
        $test[0] = [
            'id' => 0,
            'name' => $this->module->getTranslator()->trans('No results were found for your search.', [], 'Modules.Iqitelementor.Admin'),
        ];

        $this->fields_options = [
            'general' => [
                'title' => $this->module->getTranslator()->trans('Settings', [], 'Modules.Iqitelementor.Admin'),
                'fields' => [
                    'iqit_homepage_layout' => [
                        'title' => $this->module->getTranslator()->trans('Homepage layout', [], 'Modules.Iqitelementor.Admin'),
                        'desc' => $this->module->getTranslator()->trans('Choose your homepage layout. You can create multiple layouts in list above. So you can change them fast when needed.', [], 'Modules.Iqitelementor.Admin'),
                        'cast' => 'intval',
                        'type' => 'select',
                        'list' => array_merge($test, IqitElementorLanding::getLandingPages()),
                        'identifier' => 'id',
                    ],
                    'iqit_elementor_cache' => [
                        'title' => $this->module->getTranslator()->trans('Autoclear cache', [], 'Modules.Iqitelementor.Admin'),
                        'desc' => $this->module->getTranslator()->trans('If enabled module cache will be cleared after product or manufacturer create/edit/delete. If not it will be only clearad when you edit layout.', [], 'Modules.Iqitelementor.Admin'),
                        'cast' => 'intval',
                        'type' => 'select',
                        'list' => [
                            [
                                'id' => '0',
                                'name' => $this->module->getTranslator()->trans('No', [], 'Modules.Iqitelementor.Admin'),
                            ],
                            [
                                'id' => '1',
                                'name' => $this->module->getTranslator()->trans('Yes', [], 'Modules.Iqitelementor.Admin'),
                            ],
                        ],
                        'identifier' => 'id',
                    ],
                ],
                'submit' => ['title' => $this->module->getTranslator()->trans('Save', [], 'Modules.Iqitelementor.Admin')],
            ],
        ];

        $this->fields_list = [
            'id_iqit_elementor_landing' => ['title' => $this->module->getTranslator()->trans('ID', [], 'Modules.Iqitelementor.Admin'), 'align' => 'center', 'class' => 'fixed-width-xs'],
            'title' => ['title' => $this->module->getTranslator()->trans('Name', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto'],
            'active' => ['title' => $this->module->getTranslator()->trans('Active', [], 'Modules.Iqitelementor.Admin'), 'align' => 'center', 'active' => 'status', 'type' => 'bool', 'class' => 'fixed-width-sm'],
            'elementor_link' => [
                'title' => 'Elementor',
                'align' => 'center',
                'class' => 'fixed-width-sm',
                'search' => false,
                'orderby' => false,
                'callback' => 'renderElementorGridIcon'
            ],
        ];

        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'IqitElementor';
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
            $id = (int) Tools::getValue('id_iqit_elementor_landing');
            $landing = new IqitElementorLanding($id);

            $landing->title = Tools::getValue('title');
            $landing->active = (int) Tools::getValue('active');
            $landing->id_shop = (int) $this->context->shop->id;

            $languages = Language::getLanguages(false);
            $idShop = (int) $this->context->shop->id;

            foreach ($languages as $lang) {
                $idLang = (int) $lang['id_lang'];

                $landing->data[$idLang] = Tools::getValue('data_' . $idLang);
                $landing->meta_title[$idLang] = Tools::getValue('meta_title_' . $idLang);
                $landing->meta_description[$idLang] = Tools::getValue('meta_description_' . $idLang);

                $linkRewrite = Tools::getValue('link_rewrite_' . $idLang);
                if (empty($linkRewrite)) {
                    $linkRewrite = Tools::str2url($landing->title);
                }
                if ($linkRewrite) {
                    $linkRewrite = IqitElementorLanding::getUniqueRewrite($linkRewrite, $idLang, $idShop, $id);
                }
                $landing->link_rewrite[$idLang] = $linkRewrite;
            }

            if ($landing->id) {
                $success = $landing->update();
            } else {
                $success = $landing->add();
            }

            if (!$success) {
                $this->errors[] = Tools::displayError('An error occurred while saving the landing page.');
                return false;
            }

            Tools::redirectAdmin(
                $this->context->link->getAdminLink('Admin' . $this->name)
                . '&id_iqit_elementor_landing=' . $landing->id
                . '&updateiqit_elementor_landing'
            );
        }

        if (Tools::isSubmit('submitOptions' . $this->table)) {
            $this->module->clearHomeCache();
        }

        return parent::postProcess();
    }

    public function renderForm()
    {
        $landing = new IqitElementorLanding((int) Tools::getValue('id_iqit_elementor_landing'));

        if ($landing->id) {
            $editorUrl = $this->context->link->getAdminLink('AdminIqitElementorEditor') . '&pageType=landing&pageId=' . $landing->id;
        } else {
            $editorUrl = false;
        }

        // Build front URL preview HTML
        $pageUrlHtml = '';
        if ($landing->id) {
            $idLang = (int) $this->context->language->id;
            $frontUrl = $landing->getLink($idLang);
            $isHomepage = $landing->isHomepage();
            $homeBadge = $isHomepage
                ? ' <span class="label label-info">'
                    . $this->module->getTranslator()->trans('Homepage — redirects to /', [], 'Modules.Iqitelementor.Admin')
                    . '</span>'
                : '';
            $pageUrlHtml = '<div class="form-group">'
                . '<a href="' . htmlspecialchars($frontUrl, ENT_QUOTES, 'UTF-8') . '" target="_blank" class="btn btn-default">'
                . '<i class="icon-external-link"></i> '
                . htmlspecialchars($frontUrl, ENT_QUOTES, 'UTF-8')
                . '</a>'
                . $homeBadge
                . '</div>';
        }

        // --- Form: General ---
        $generalInputs = [
            [
                'type' => 'hidden',
                'name' => 'id_iqit_elementor_landing',
            ],
            [
                'type' => 'text',
                'label' => $this->module->getTranslator()->trans('Title', [], 'Modules.Iqitelementor.Admin'),
                'name' => 'title',
                'required' => true,
            ],
            [
                'type' => 'switch',
                'label' => $this->module->getTranslator()->trans('Active', [], 'Modules.Iqitelementor.Admin'),
                'name' => 'active',
                'is_bool' => true,
                'values' => [
                    [
                        'id' => 'active_on',
                        'value' => 1,
                        'label' => $this->module->getTranslator()->trans('Yes', [], 'Modules.Iqitelementor.Admin'),
                    ],
                    [
                        'id' => 'active_off',
                        'value' => 0,
                        'label' => $this->module->getTranslator()->trans('No', [], 'Modules.Iqitelementor.Admin'),
                    ],
                ],
            ],
            [
                'type' => 'text',
                'label' => $this->module->getTranslator()->trans('Friendly URL', [], 'Modules.Iqitelementor.Admin'),
                'name' => 'link_rewrite',
                'lang' => true,
                'required' => true,
                'hint' => $this->module->getTranslator()->trans('Auto-generated from title if left empty.', [], 'Modules.Iqitelementor.Admin'),
            ],
        ];

        // Insert page URL after link_rewrite (only on edit)
        if ($landing->id && $pageUrlHtml) {
            $generalInputs[] = [
                'type' => 'html',
                'label' => $this->module->getTranslator()->trans('Page URL', [], 'Modules.Iqitelementor.Admin'),
                'name' => 'page_url_preview',
                'html_content' => $pageUrlHtml,
            ];
        }

        $generalInputs[] = [
            'type' => 'elementor_trigger',
            'label' => $this->module->getTranslator()->trans('Page content', [], 'Modules.Iqitelementor.Admin'),
            'url' => $editorUrl,
        ];

        $generalInputs[] = [
            'type' => 'hidden',
            'name' => 'id_shop',
        ];

        $this->fields_form[0]['form'] = [
            'legend' => [
                'title' => $landing->id
                    ? $this->module->getTranslator()->trans('Edit landing page', [], 'Modules.Iqitelementor.Admin')
                    : $this->module->getTranslator()->trans('New landing page', [], 'Modules.Iqitelementor.Admin'),
                'icon' => $landing->id ? 'icon-edit' : 'icon-plus-square',
            ],
            'input' => $generalInputs,
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

        // --- Form: SEO ---
        $this->fields_form[1]['form'] = [
            'legend' => [
                'title' => $this->module->getTranslator()->trans('SEO', [], 'Modules.Iqitelementor.Admin'),
                'icon' => 'icon-search',
            ],
            'input' => [
                [
                    'type' => 'text',
                    'label' => $this->module->getTranslator()->trans('Meta title', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'meta_title',
                    'lang' => true,
                    'hint' => $this->module->getTranslator()->trans('Displayed in browser tab and search results. Falls back to title if empty.', [], 'Modules.Iqitelementor.Admin'),
                ],
                [
                    'type' => 'textarea',
                    'label' => $this->module->getTranslator()->trans('Meta description', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'meta_description',
                    'lang' => true,
                    'hint' => $this->module->getTranslator()->trans('Displayed in search engine results.', [], 'Modules.Iqitelementor.Admin'),
                ],
            ],
        ];

        if (Tools::getValue('title')) {
            $landing->title = Tools::getValue('title');
        }

        $helper = $this->buildHelper();
        if (isset($landing->id)) {
            $helper->currentIndex = AdminController::$currentIndex . '&id_iqit_link_block=' . $landing->id;
            $helper->submit_action = 'submitEdit' . $this->className;
        } else {
            $helper->submit_action = 'submitAdd' . $this->className;
        }

        $helper->fields_value = (array) $landing;
        $helper->fields_value['id_shop'] = $this->context->shop->id;

        // Populate multilang field values
        $languages = Language::getLanguages(false);
        foreach ($languages as $lang) {
            $idLang = (int) $lang['id_lang'];
            $helper->fields_value['meta_title'][$idLang] = isset($landing->meta_title[$idLang]) ? $landing->meta_title[$idLang] : '';
            $helper->fields_value['meta_description'][$idLang] = isset($landing->meta_description[$idLang]) ? $landing->meta_description[$idLang] : '';
            $helper->fields_value['link_rewrite'][$idLang] = isset($landing->link_rewrite[$idLang]) ? $landing->link_rewrite[$idLang] : '';
        }

        $formHtml = $helper->generateForm($this->fields_form);

        // Append revision panel and autosave banner
        if ($landing->id) {
            $formHtml .= $this->renderRevisionPanel(
                \IqitElementor\Enum\EntityType::LANDING,
                (int) $landing->id
            );
        }

        return $formHtml;
    }

    public function initToolBarTitle()
    {
        $this->toolbar_title[] = $this->module->getTranslator()->trans('Landing pages', [], 'Modules.Iqitelementor.Admin');
    }

    public function renderElementorGridIcon($value, $row)
    {
        $id = isset($row['id_iqit_elementor_landing']) ? (int) $row['id_iqit_elementor_landing'] : 0;
        if (!$id) {
            return '';
        }

        $url = $this->context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=landing&contentType=default&newContent=0'
            . '&idLang=' . (int) $this->context->language->id
            . '&pageId=' . $id;

        $logoUrl = _MODULE_DIR_ . 'iqitelementor/logo.png';

        return '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" '
            . 'title="' . htmlspecialchars($this->module->getTranslator()->trans('Edit with Elementor', [], 'Modules.Iqitelementor.Admin'), ENT_QUOTES, 'UTF-8') . '" '
            . 'class="elementor-grid-link">'
            . '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES, 'UTF-8') . '" alt="Elementor" class="elementor-grid-logo" style="width:20px;height:20px;">'
            . '</a>';
    }

    public function ajaxProcessCategoryLayout(): void
    {
        header('Content-Type: application/json');
        $categoryId = (int) Tools::getValue('categoryId');
        $justElementor = (int) Tools::getValue('justElementor');

        IqitElementorCategory::setJustElementor($categoryId, $justElementor);

        $return = [
            'success' => true,
            'data' => true,
        ];

        exit(json_encode($return));
    }

}
