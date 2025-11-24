<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminIqitElementorController extends ModuleAdminController
{
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
        $test = [];
        $test[0] = [
            'id' => 0,
            'name' => $this->module->getTranslator()->trans('No results were found for your search.', [], 'Modules.Iqitelementor.Admin'),
        ];

        // instagram generator url
        $urlInsagramConnect = $this->context->link->getAdminLink('AdminIqitElementor') . '&instagamIntegration=1';
        $urlInsagramRemove = $this->context->link->getAdminLink('AdminIqitElementor') . '&instagamTokenRemove=1';

        // instagram profile
        $instagramToken = Configuration::get('iqit_elementor_inst_token');
        $instagramUsername = Configuration::get('iqit_elementor_inst_username');
        $instagramExpDate = date('Y-m-d', (int) Configuration::get('iqit_elementor_inst_token_exp'));

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

                    'iqit_elementor_instagram_connect' => [
                        'title' => $this->module->getTranslator()->trans('Instagram account', [], 'Modules.Iqitelementor.Admin'),
                        'type' => 'instagram_connect',
                        'url' => $urlInsagramConnect,
                        'token' => $instagramToken,
                        'username' => $instagramUsername,
                        'urlRemove' => $urlInsagramRemove,
                        'instagramExpDate' => $instagramExpDate,
                    ],
                ],
                'submit' => ['title' => $this->module->getTranslator()->trans('Save', [], 'Modules.Iqitelementor.Admin')],
            ],
        ];

        $this->fields_list = [
            'id_iqit_elementor_landing' => ['title' => $this->module->getTranslator()->trans('ID', [], 'Modules.Iqitelementor.Admin'), 'align' => 'center', 'class' => 'fixed-width-xs'],
            'title' => ['title' => $this->module->getTranslator()->trans('Name', [], 'Modules.Iqitelementor.Admin'), 'width' => 'auto'],
        ];

        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'IqitElementor';
    }

    public function setMedia($isNewTheme = false)
    {
        parent::setMedia($isNewTheme);
    }

    public function init()
    {
        if (Tools::getValue('instagamTokenRemove')) {
            $this->removeInstagramProfile();
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminIqitElementor'));
        }

        if (Tools::isSubmit('edit' . $this->className)) {
            $this->display = 'edit';
        } elseif (Tools::isSubmit('addiqit_elementor_landing')) {
            $this->display = 'add';
        }

        parent::init();
    }

    private function makeApiRequest($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function addInstagramProfile($accessToken)
    {
        // Endpoint do pobrania danych użytkownika
        $userInfoEndpoint = 'https://graph.instagram.com/v22.0/me?fields=user_id,username&id&access_token=' . $accessToken;

        // Wywołanie API
        $userInfoResponse = $this->makeApiRequest($userInfoEndpoint);
        if (!$userInfoResponse || !isset($userInfoResponse['user_id'], $userInfoResponse['username'])) {
            $this->errors[] = 'Nie udało się pobrać danych użytkownika Instagrama.';

            return;
        }

        // Pobranie danych z odpowiedzi
        $userId = $userInfoResponse['user_id'];
        $username = $userInfoResponse['username'];

        // Opcjonalne odświeżenie tokena
        $refreshEndpoint = 'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' . $accessToken;
        $refreshResponse = $this->makeApiRequest($refreshEndpoint);
        if (!$refreshResponse || !isset($refreshResponse['access_token'], $refreshResponse['expires_in'])) {
            $this->errors[] = new Exception('Nie udało się odświeżyć tokena.');

            return;
        }

        // Aktualizacja tokena i daty jego wygaśnięcia
        $newAccessToken = $refreshResponse['access_token'];
        $expiresIn = $refreshResponse['expires_in']; // W sekundach

        // Zapis do bazy danych
        Configuration::updateValue('iqit_elementor_inst_token', $newAccessToken);
        Configuration::updateValue('iqit_elementor_inst_username', $username);
        Configuration::updateValue('iqit_elementor_inst_user_id', $userId);
        Configuration::updateValue('iqit_elementor_inst_token_exp', IqitElementor::instaTokenExpirationDate($expiresIn));

        Tools::redirectAdmin($this->context->link->getAdminLink('AdminIqitElementor'));
    }

    public function removeInstagramProfile()
    {
        Configuration::deleteByName('iqit_elementor_inst_token');
        Configuration::deleteByName('iqit_elementor_inst_token_exp');
        Configuration::deleteByName('iqit_elementor_inst_username');
        Configuration::deleteByName('iqit_elementor_inst_user_id');
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
            $returnObject = $this->processSave();
            if (!$returnObject) {
                return false;
            }
            Tools::redirectAdmin($this->context->link->getAdminLink('Admin' . $this->name) . '&id_iqit_elementor_landing=' . $returnObject->id . '&updateiqit_elementor_landing');
        }

        if (Tools::isSubmit('submitInstagramConnect')) {
            $instagramToken = Tools::getValue('iqit_elementor_inst_token');
            if ($instagramToken) {
                $this->addInstagramProfile($instagramToken);
            } else {
                $this->errors[] = Tools::displayError('Please fill instagram access token first');
            }
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
            $url = $this->context->link->getAdminLink('IqitElementorEditor') . '&pageType=landing&pageId=' . $landing->id;
        } else {
            $url = false;
        }

        $this->fields_form[0]['form'] = [
            'legend' => [
                'title' => isset($landing->id) ? $this->module->getTranslator()->trans('Edit layout.', [], 'Modules.Iqitelementor.Admin') : $this->module->getTranslator()->trans('New layout', [], 'Modules.Iqitelementor.Admin'),
                'icon' => isset($landing->id) ? 'icon-edit' : 'icon-plus-square',
            ],
            'input' => [
                [
                    'type' => 'hidden',
                    'name' => 'id_iqit_elementor_landing',
                ],
                [
                    'type' => 'text',
                    'label' => $this->module->getTranslator()->trans('Title of layout', [], 'Modules.Iqitelementor.Admin'),
                    'name' => 'title',
                    'required' => true,
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
            $helper->currentIndex = AdminController::$currentIndex . '&id_iqit_link_block=' . $landing->id;
            $helper->submit_action = 'submitEdit' . $this->className;
        } else {
            $helper->submit_action = 'submitAdd' . $this->className;
        }

        $helper->fields_value = (array) $landing;
        $helper->fields_value['id_shop'] = $this->context->shop->id;

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
        $this->toolbar_title[] = $this->module->getTranslator()->trans('Homepage layouts', [], 'Modules.Iqitelementor.Admin');
    }

    public function ajaxProcessCategoryLayout()
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
