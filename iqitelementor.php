<?php
/**
 * 2017 IQIT-COMMERCE.COM
 *
 * NOTICE OF LICENSE
 *
 * @author    IQIT-COMMERCE.COM <support@iqit-commerce.com>
 * @copyright 2017 IQIT-COMMERCE.COM
 * @license   GNU General Public License version 2
 *
 * You can not resell or redistribute this software.
 */

use IqitElementor\BackOffice\EditorContext;
use IqitElementor\BackOffice\GridIntegration;
use IqitElementor\Cache\RenderCache;
use IqitElementor\Core\Plugin;
use IqitElementor\Editor\EditorTargetRegistry;
use IqitElementor\Helper\OutputHelper;
use IqitElementor\Contract\ContentRendererInterface;
use IqitElementor\Core\HookRegistrar;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Renderer\BlogRenderer;
use IqitElementor\Renderer\CategoryRenderer;
use IqitElementor\Renderer\CmsRenderer;
use IqitElementor\Renderer\HomeRenderer;
use IqitElementor\Renderer\HookContentRenderer;
use IqitElementor\Renderer\ManufacturerRenderer;
use IqitElementor\Renderer\ProductRenderer;
use PrestaShop\PrestaShop\Core\Module\WidgetInterface;

if (!defined('_PS_VERSION_')) {
    exit;
}

if (!defined('ELEMENTOR_ABSPATH')) {
    define('ELEMENTOR_ABSPATH', _PS_MODULE_DIR_ . 'iqitelementor');
}

require_once __DIR__ . '/vendor/autoload.php';

class IqitElementor extends Module implements WidgetInterface
{
    public const INSTALL_SQL_FILE = '/sql/install.sql';

    /** @var bool Whether the current request is a front-office preview of autosave content */
    private $previewMode = false;

    /** @var ContentRendererInterface[]|null */
    private $contentRenderers;

    /** @var EditorContext|null */
    private $editorContext;

    /** @var GridIntegration|null */
    private $gridIntegration;

    public function __construct()
    {
        $this->name = 'iqitelementor';
        $this->tab = 'front_office_features';
        $this->version = '1.4.5';
        $this->author = 'IQIT-COMMERCE.COM';
        $this->bootstrap = true;
        $this->controllers = ['preview', 'widget', 'landing'];

        parent::__construct();

        $this->displayName = $this->trans('IQITELEMENTOR - drag&drop front-end page builder', [], 'Modules.Iqitelementor.Admin');
        $this->description = $this->trans('Flexible page builder based on Wordpress Elementor plugin by POJO.me', [], 'Modules.Iqitelementor.Admin');
    }

    public function install($withFixtures = true)
    {
        if (Shop::isFeatureActive()) {
            Shop::setContext(Shop::CONTEXT_ALL);
        }

        $parentInstalled = Module::isInstalled($this->name) ? true : parent::install();

        $result = $parentInstalled
            && HookRegistrar::registerAll($this)
            && $this->installTab()
            && $this->installSQL();

        if (!$result) {
            return false;
        }

        Configuration::updateValue('IQITELEMENTOR_REVISION_LIMIT', 20);
        Configuration::updateValue('IQITELEMENTOR_RENDER_CACHE', 1);

        if ($withFixtures) {
            return $this->installFixtures();
        }

        return true;
    }

    public function isUsingNewTranslationSystem()
    {
        return false;
    }

    public function hookDisplayBackOfficeHeader($params)
    {
        $this->context->controller->addCSS($this->_path . 'views/css/backoffice.css');

        $controllerName = $this->context->controller->controller_name ?? '';
        $idLang = (int) $this->context->language->id;

        // Ask every registered EditorTarget (built-in + third-party) which
        // "Edit with Elementor" buttons it wants on the current admin page.
        // Each target owns its own pageId resolution and URL building.
        $placements = EditorTargetRegistry::collectBoButtons($controllerName, $idLang);
        if (!empty($placements)) {
            Media::addJsDef([
                'iqitElementorBoPlacements' => $placements,
            ]);
            $this->context->controller->addJS($this->_path . 'views/js/bo-button-injector.js');
        }

        // Legacy EditorContext is still used for:
        //   - the category inline template (button + justElementor switcher)
        //   - the hideEditor / categoryLayout behaviours inside backoffice.js
        // The rest of the BO button injection moved to EditorTargetRegistry.
        $editorCtx = $this->getEditorContext();
        $boCtx = $editorCtx->buildContext($controllerName);

        if (empty($boCtx['enabled'])) {
            return;
        }

        $editorUrl = $editorCtx->buildEditorUrl(
            (string) $boCtx['pageType'],
            (string) $boCtx['contentType'],
            (int) $boCtx['newContent'],
            (int) $boCtx['idPage'],
            $idLang
        );

        $this->context->controller->addJS($this->_path . 'views/js/backoffice.js');

        Media::addJsDef([
            'onlyElementor' => (array) $boCtx['onlyElementor'],
            'elementorAjaxUrl' => $this->context->link->getAdminLink('AdminIqitElementor') . '&ajax=1',
        ]);

        $this->context->smarty->assign([
            'urlElementor' => $editorUrl,
            'onlyElementor' => (array) $boCtx['onlyElementor'],
            'pageType' => (string) $boCtx['pageType'],
            'justElementorCategory' => (bool) $boCtx['justElementorCategory'],
            'idPage' => (int) $boCtx['idPage'],
        ]);

        return $this->fetch(_PS_MODULE_DIR_ . '/' . $this->name . '/views/templates/hook/backoffice_header.tpl');
    }

    public function hookActionCmsPageGridDefinitionModifier(array $params): void
    {
        $this->getGridIntegration()->addCmsGridColumn($params);
    }

    public function hookActionCmsPageGridDataModifier(array $params): void
    {
        $this->getGridIntegration()->populateCmsGridColumn($params);
    }

    public function hookActionAdminSimpleBlogPostsListingFieldsModifier(array $params): void
    {
        $this->getGridIntegration()->addBlogListColumn($params);
    }

    public function uninstall()
    {
        Configuration::deleteByName('IQITELEMENTOR_REVISION_LIMIT');
        Configuration::deleteByName('IQITELEMENTOR_RENDER_CACHE');

        return $this->uninstallTab()
            && $this->uninstallSQL()
            && parent::uninstall();
    }

    /**
     * Preserve data on module reset (reset = uninstall + install)
     * Run the install process without loading fixtures.
     */
    public function reset()
    {
        return $this->install(false);
    }

    private function uninstallSQL(): bool
    {
        $sqlFile = dirname(__FILE__) . '/sql/uninstall.sql';
        if (!file_exists($sqlFile) || !$sql = file_get_contents($sqlFile)) {
            return true;
        }
        $sql = str_replace('PREFIX', _DB_PREFIX_, $sql);
        $sql = preg_split("/;\s*[\r\n]+/", trim($sql));
        foreach ($sql as $query) {
            $query = trim($query);
            if (!empty($query)) {
                Db::getInstance()->execute($query);
            }
        }

        return true;
    }

    public function hookModuleRoutes()
    {
        return [
            'module-iqitelementor-landing' => [
                'rule' => 'landing/{rewrite}',
                'keywords' => [
                    'rewrite' => [
                        'regexp' => '[_a-zA-Z0-9\pL\pS-]*',
                        'param' => 'rewrite',
                    ],
                ],
                'controller' => 'landing',
                'params' => [
                    'fc' => 'module',
                    'module' => 'iqitelementor',
                ],
            ],
        ];
    }

    /**
     * Registers the `{iqit_render content=$foo}` Smarty function as soon as
     * the front controller is dispatched, so templates (theme or any module)
     * can turn Elementor JSON fields into rendered HTML with content-addressed
     * caching. Hooked on actionDispatcher rather than displayHeader so the
     * plugin is available even on templates that don't call {hook h='displayHeader'}.
     *
     * @param array $params
     */
    public function hookActionDispatcher($params)
    {
        if (!isset($this->context->smarty) || !is_object($this->context->smarty)) {
            return;
        }

        // Smarty throws on double registration — guard against hook re-entry.
        $registered = $this->context->smarty->registered_plugins ?? [];
        if (isset($registered['function']['iqit_render'])) {
            return;
        }

        $this->context->smarty->registerPlugin('function', 'iqit_render', [$this, 'smartyRenderElementor']);
    }

    public function hookDisplayHeader()
    {
        //   $this->context->controller->requireAssets(array('font-awesome'));
        $this->registerCssFiles();
        $this->registerJSFiles();

        Media::addJsDef(
            ['elementorFrontendConfig' => [
                'isEditMode' => '',
                'stretchedSectionContainer' => '',
                'isRtl' => (bool)$this->context->language->is_rtl,
                'ajax_csfr_token_url' => $this->context->link->getModuleLink($this->name, 'Actions', ['process' => 'handleCsfrToken', 'ajax' => 1], true),
            ]]);
    }

    /**
     * Check if the current front request is in autosave preview mode.
     * Evaluated lazily from request params — no dependency on hook execution order.
     */
    public function isPreviewMode(): bool
    {

        if ($this->previewMode) {
            return true;
        }

        if (Tools::getValue('iqit_preview') && Tools::getValue('iqit_preview_token')) {
            $token = Tools::getValue('iqit_preview_token');
            if ($token === $this->getPreviewToken()) {
                $this->previewMode = true;
            }
        }

        return $this->previewMode;
    }

    /**
     * Generate a HMAC token for front-office preview.
     * Valid for the current employee session.
     */
    public function getPreviewToken(): string
    {
        return Tools::hash('iqit_preview_' . $this->name . '_' . $this->getEmployeeId());
    }

    public function registerCssFiles(): void
    {
        // Core Elementor frontend styles
        $this->context->controller->registerStylesheet(
            'modules-' . $this->name . '-style',
            'modules/' . $this->name . '/views/css/frontend.css',
            [
                'media' => 'all',
                'priority' => 150,
            ]
        );

    }

    public function registerJSFiles(): void
    {
        // Swiper — can be disabled if the theme already provides it
        $loadSwiper = Configuration::get('IQIT_ELEMENTOR_LOAD_SWIPER');
        if ($loadSwiper === false || $loadSwiper) {
            $this->context->controller->registerJavascript(
                'modules' . $this->name . '-swiper',
                'modules/' . $this->name . '/views/lib/swiper/swiper-bundle.min.js',
                ['position' => 'bottom', 'priority' => 140]
            );
        }

        $this->context->controller->registerJavascript('modules' . $this->name . '-waypoints', 'modules/' . $this->name . '/views/lib/waypoints/waypoints.min.js', ['position' => 'bottom', 'priority' => 150]);
        $this->context->controller->registerJavascript('modules' . $this->name . '-jquery-numerator', 'modules/' . $this->name . '/views/lib/jquery-numerator/jquery-numerator.min.js', ['position' => 'bottom', 'priority' => 150]);

        $this->context->controller->registerJavascript('modules' . $this->name . '-script', 'modules/' . $this->name . '/views/js/frontend.js', ['position' => 'bottom', 'priority' => 150]);
    }

    public function installTab(): bool
    {
        // editor
        $tab = new Tab();
        $tab->active = 0;
        $tab->class_name = 'AdminIqitElementorEditor';
        $tab->name = [];
        foreach (Language::getLanguages(true) as $lang) {
            $tab->name[$lang['id_lang']] = 'AdminIqitElementorEditor';
        }
        $tab->id_parent = (int)Tab::getIdFromClassName('AdminParentThemes');
        $tab->module = $this->name;
        $tab->add();

        // parent
        $tab = new Tab();
        $tab->active = 1;
        $tab->class_name = 'AdminParentIqitElementor';
        $tab->name = [];
        foreach (Language::getLanguages(true) as $lang) {
            $tab->name[$lang['id_lang']] = 'IqitElementor - Page builder';
        }
        $tab->id_parent = (int)Tab::getIdFromClassName('AdminParentThemes');
        $tab->module = $this->name;
        $tab->add();
        $parentId = $tab->id;

        // homepage
        $tab = new Tab();
        $tab->active = 1;
        $tab->class_name = 'AdminIqitElementor';
        $tab->name = [];
        foreach (Language::getLanguages(true) as $lang) {
            $tab->name[$lang['id_lang']] = 'Landing pages';
        }
        $tab->id_parent = $parentId;
        $tab->module = $this->name;
        $tab->add();

        // content
        $tab = new Tab();
        $tab->active = 1;
        $tab->class_name = 'AdminIqitElementorContent';
        $tab->name = [];
        foreach (Language::getLanguages(true) as $lang) {
            $tab->name[$lang['id_lang']] = 'Content on hooks';
        }
        $tab->id_parent = $parentId;
        $tab->module = $this->name;
        $tab->add();

        return true;
    }

    public function uninstallTab(): bool
    {
        $id_tab = (int)Tab::getIdFromClassName('AdminIqitElementorEditor');
        if ($id_tab) {
            $tab = new Tab($id_tab);
            $tab->delete();
        }

        $id_tab = (int)Tab::getIdFromClassName('AdminIqitElementor');
        if ($id_tab) {
            $tab = new Tab($id_tab);
            $tab->delete();
        }

        $id_tab = (int)Tab::getIdFromClassName('AdminIqitElementorContent');
        if ($id_tab) {
            $tab = new Tab($id_tab);
            $tab->delete();
        }

        $id_tab = (int)Tab::getIdFromClassName('AdminParentIqitElementor');
        if ($id_tab) {
            $tab = new Tab($id_tab);
            $tab->delete();
        }

        return true;
    }

    public function installFixtures(): bool
    {
        $success = true;
        $templateSource = json_decode(Tools::file_get_contents(_PS_MODULE_DIR_ . 'iqitelementor/initial_homepage.json'));

        $shops = Shop::getShopsCollection();
        foreach ($shops as $shop) {
            $layout = new IqitElementorLanding();
            $layout->id_shop = (int)$shop->id;
            $layout->title = $this->l('Homepage layout #1');
            $layout->data = $templateSource->data;
            $layout->add();
        }

        Configuration::updateValue('iqit_homepage_layout', 1);
        Configuration::updateValue('iqit_elementor_cache', 0);
        Configuration::updateValue('IQIT_ELEMENTOR_LOAD_SWIPER', 1);
        Configuration::updateValue('iqitelementor_elementor_container_width', 1200);

        return $success;
    }

    public function getContent()
    {
        if (Tools::isSubmit('submit' . $this->name . 'Module')) {
            /* TODO: form validation * */
            if (!count($this->context->controller->errors)) {
                $colors = Tools::getValue('IQIT_ELEMENT_COLORS');
                Configuration::updateValue('IQIT_ELEMENT_COLORS', Helper::cleanStringOfColors($colors));
                Configuration::updateValue('IQIT_ELEMENTOR_LOAD_SWIPER', (int)Tools::getValue('IQIT_ELEMENTOR_LOAD_SWIPER'));

                $containerWidth = (int)Tools::getValue('iqitelementor_elementor_container_width');
                if ($containerWidth < 500) {
                    $containerWidth = 500;
                } elseif ($containerWidth > 1920) {
                    $containerWidth = 1920;
                }
                Configuration::updateValue('iqitelementor_elementor_container_width', $containerWidth);

                $iconLibraries = [];
                foreach (array_keys(IconHelper::getAllLibraries()) as $lib) {
                    if (Tools::getValue('IQIT_ELEMENTOR_ICON_LIBRARIES_' . $lib)) {
                        $iconLibraries[] = $lib;
                    }
                }
                if (empty($iconLibraries)) {
                    $iconLibraries = ['fa'];
                }
                Configuration::updateValue('IQIT_ELEMENTOR_ICON_LIBRARIES', json_encode($iconLibraries));

                $revisionLimit = (int)Tools::getValue('IQITELEMENTOR_REVISION_LIMIT');
                if ($revisionLimit < 1) {
                    $revisionLimit = 1;
                } elseif ($revisionLimit > 100) {
                    $revisionLimit = 100;
                }
                Configuration::updateValue('IQITELEMENTOR_REVISION_LIMIT', $revisionLimit);

                Configuration::updateValue('IQITELEMENTOR_RENDER_CACHE', (int) Tools::getValue('IQITELEMENTOR_RENDER_CACHE'));
                \IqitElementor\Cache\RenderCache::flush();

                $redirect_after = $this->context->link->getAdminLink('AdminModules', true);
                $redirect_after .= '&conf=4&configure=' . $this->name . '&module_name=' . $this->name;
                Tools::redirectAdmin($redirect_after);
            }
        }

        return $this->renderForm();
    }

    private function renderForm(): string
    {
        $helper = new HelperForm();
        $helper->show_toolbar = false;
        $helper->table = $this->table;
        $helper->module = $this;
        $helper->default_form_language = $this->context->language->id;
        $helper->allow_employee_form_lang = Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG', 0);
        $helper->identifier = $this->identifier;
        $helper->submit_action = 'submit' . $this->name . 'Module';
        $helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false);
        $helper->currentIndex .= '&configure=' . $this->name . '&tab_module=' . $this->tab . '&module_name=' . $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');

        $helper->tpl_vars = [
            'languages' => $this->context->controller->getLanguages(),
            'id_language' => $this->context->language->id,
            'fields_value' => [
                'IQIT_ELEMENT_COLORS' => Tools::getValue('IQIT_ELEMENT_COLORS', Configuration::get('IQIT_ELEMENT_COLORS')),
                'IQIT_ELEMENTOR_LOAD_SWIPER' => (int)Tools::getValue('IQIT_ELEMENTOR_LOAD_SWIPER', Configuration::get('IQIT_ELEMENTOR_LOAD_SWIPER') !== false ? Configuration::get('IQIT_ELEMENTOR_LOAD_SWIPER') : 1),
                'iqitelementor_elementor_container_width' => (int)Tools::getValue('iqitelementor_elementor_container_width', Configuration::get('iqitelementor_elementor_container_width') !== false ? Configuration::get('iqitelementor_elementor_container_width') : 1200),
                'IQIT_ELEMENTOR_ICON_LIBRARIES_fa' => in_array('fa', IconHelper::getEnabledLibraries()),
                'IQIT_ELEMENTOR_ICON_LIBRARIES_bi' => in_array('bi', IconHelper::getEnabledLibraries()),
                'IQIT_ELEMENTOR_ICON_LIBRARIES_ph' => in_array('ph', IconHelper::getEnabledLibraries()),
                'IQITELEMENTOR_REVISION_LIMIT' => (int)Tools::getValue('IQITELEMENTOR_REVISION_LIMIT', Configuration::get('IQITELEMENTOR_REVISION_LIMIT') !== false ? Configuration::get('IQITELEMENTOR_REVISION_LIMIT') : 20),
                'IQITELEMENTOR_RENDER_CACHE' => (int)Tools::getValue('IQITELEMENTOR_RENDER_CACHE', Configuration::get('IQITELEMENTOR_RENDER_CACHE') !== false ? Configuration::get('IQITELEMENTOR_RENDER_CACHE') : 1),
            ],
        ];

        return $helper->generateForm([
            [
                'form' => [
                    'tabs' => [
                        'settings' => $this->l('Settings'),
                    ],
                    'legend' => [
                        'title' => $this->l('Parameters'),
                        'icon' => 'icon-cogs',
                    ],
                    'input' => [
                        [
                            'type' => 'text',
                            'name' => 'IQIT_ELEMENT_COLORS',
                            'label' => $this->l('Predefined colors (comma separated, hex values)'),
                            'tab' => 'settings',
                            'required' => true,
                        ],
                        [
                            'type' => 'text',
                            'name' => 'iqitelementor_elementor_container_width',
                            'label' => $this->l('Default container width (px)'),
                            'desc' => $this->l('Default max-width applied to boxed sections when no custom width is set on the section itself. Accepted range: 500 - 1920.'),
                            'tab' => 'settings',
                            'class' => 'fixed-width-sm',
                            'suffix' => 'px',
                            'required' => true,
                        ],
                        [
                            'type' => 'switch',
                            'name' => 'IQIT_ELEMENTOR_LOAD_SWIPER',
                            'label' => $this->l('Load Swiper library'),
                            'desc' => $this->l('Disable this option if your theme already includes the Swiper library to avoid loading it twice.'),
                            'tab' => 'settings',
                            'is_bool' => true,
                            'values' => [
                                [
                                    'id' => 'IQIT_ELEMENTOR_LOAD_SWIPER_on',
                                    'value' => 1,
                                    'label' => $this->l('Yes'),
                                ],
                                [
                                    'id' => 'IQIT_ELEMENTOR_LOAD_SWIPER_off',
                                    'value' => 0,
                                    'label' => $this->l('No'),
                                ],
                            ],
                        ],
                        [
                            'type' => 'text',
                            'name' => 'IQITELEMENTOR_REVISION_LIMIT',
                            'label' => $this->l('Revision history limit'),
                            'desc' => $this->l('Maximum number of revisions kept per content entity. Accepted range: 1 - 100.'),
                            'tab' => 'settings',
                            'class' => 'fixed-width-sm',
                            'required' => true,
                        ],
                        [
                            'type' => 'switch',
                            'name' => 'IQITELEMENTOR_RENDER_CACHE',
                            'label' => $this->l('Render cache'),
                            'desc' => $this->l('Cache the rendered HTML of Elementor content on disk. Disable only for debugging — the cache is flushed automatically when content is saved.'),
                            'tab' => 'settings',
                            'is_bool' => true,
                            'values' => [
                                [
                                    'id' => 'IQITELEMENTOR_RENDER_CACHE_on',
                                    'value' => 1,
                                    'label' => $this->l('Yes'),
                                ],
                                [
                                    'id' => 'IQITELEMENTOR_RENDER_CACHE_off',
                                    'value' => 0,
                                    'label' => $this->l('No'),
                                ],
                            ],
                        ],
                        [
                            'type' => 'checkbox',
                            'name' => 'IQIT_ELEMENTOR_ICON_LIBRARIES',
                            'label' => $this->l('Icon libraries'),
                            'desc' => $this->l('Select which icon libraries are available in the editor icon picker.'),
                            'tab' => 'settings',
                            'values' => [
                                'query' => [
                                    ['id' => 'fa', 'name' => 'Font Awesome'],
                                    ['id' => 'bi', 'name' => 'Bootstrap Icons'],
                                    ['id' => 'ph', 'name' => 'Phosphor Icons'],
                                ],
                                'id' => 'id',
                                'name' => 'name',
                            ],
                        ],
                    ],
                    'submit' => [
                        'title' => $this->l('Save'),
                    ],
                ],
            ],
            /* TODO: build form * */
        ]);
    }

    public function renderIqitElementorWidget($name, $options, $preview = false): string
    {
        $widgetInstance = Helper::getElementorWidgetInstanceByName($name);
        if ($widgetInstance && method_exists($widgetInstance, 'getTemplatePath')) {
            $templatePath = $widgetInstance->getTemplatePath();
        } else {
            $templateFile = strtolower($name) . '.tpl';
            $templatePath = 'module:' . $this->name . '/views/templates/widgets/' . $templateFile;
        }

        $vars = $this->getIqitElementorWidgetVariables($name, $options, $preview);
        $smarty = clone $this->context->smarty;
        $smarty->clearAllAssign();
        $smarty->assign($vars);

        return $smarty->fetch($templatePath);
    }

    public function getIqitElementorWidgetVariables($name, $options = [], $preview = false): array
    {

        $widgetInstance = Helper::getElementorWidgetInstanceByName($name);
        if (!$widgetInstance) {
            return [];
        }


        return $widgetInstance->parseOptions($options, $preview);
    }

    /**
     * Clear the render cache after a hook-bound content is saved or deleted.
     *
     * @param int $idHook Hook ID (unused — full flush, because the anonymous
     *                     cache is content-addressed and cannot be narrowed by hook)
     */
    public function clearHookCache($idHook = 0)
    {
        RenderCache::flush();
    }

    public function renderWidget($hookName = null, array $configuration = [])
    {
        if ($hookName === null && isset($configuration['hook'])) {
            $hookName = $configuration['hook'];
        }

        $renderer = $this->resolveContentRenderer((string) $hookName);
        $templateFile = $renderer ? $renderer->getTemplateFile() : 'generated_content.tpl';
        $templatePath = 'module:' . $this->name . '/views/templates/hook/' . $templateFile;

        // No outer Smarty cache: the actual Elementor rendering is already
        // content-addressed and cached inside AbstractContentRenderer via
        // IqitElementor\Cache\RenderCache. The template wrapping is cheap
        // enough to run every time.
        $vars = $this->getWidgetVariables($hookName, $configuration);
        if (empty($vars['content'])) {
            return;
        }
        $this->smarty->assign($vars);

        return $this->fetch($templatePath);
    }

    /**
     * @throws PrestaShopDatabaseException
     * @throws PrestaShopException
     */
    public function getWidgetVariables($hookName = null, array $configuration = []): array
    {
        if ($hookName === null && isset($configuration['hook'])) {
            $hookName = $configuration['hook'];
        }

        $renderer = $this->resolveContentRenderer((string) $hookName);
        if (!$renderer) {
            return ['content' => '', 'options' => [], 'hook' => (string) $hookName];
        }

        $result = $renderer->render((string) $hookName, $configuration, $this->isPreviewMode());
        $result['hook'] = (string) $hookName;

        return $result;
    }

    /**
     * @return ContentRendererInterface[]
     */
    private function getContentRenderers(): array
    {
        if ($this->contentRenderers === null) {
            $ctx = $this->context;
            $this->contentRenderers = [
                new HomeRenderer($ctx),
                new CmsRenderer($ctx),
                new ProductRenderer($ctx),
                new CategoryRenderer($ctx),
                new BlogRenderer($ctx),
                new ManufacturerRenderer($ctx),
                new HookContentRenderer($ctx),
            ];
        }

        return $this->contentRenderers;
    }

    /**
     * @return ContentRendererInterface|null
     */
    private function resolveContentRenderer(string $hookName)
    {
        foreach ($this->getContentRenderers() as $renderer) {
            if ($renderer->supports($hookName)) {
                return $renderer;
            }
        }

        return null;
    }

    private function getEditorContext(): EditorContext
    {
        if ($this->editorContext === null) {
            $this->editorContext = new EditorContext($this->context);
        }

        return $this->editorContext;
    }

    private function getGridIntegration(): GridIntegration
    {
        if ($this->gridIntegration === null) {
            $this->gridIntegration = new GridIntegration($this->context, $this->_path);
        }

        return $this->gridIntegration;
    }

    public function checkEnvironment(): bool
    {
        $cookie = new Cookie('psAdmin', '', (int)Configuration::get('PS_COOKIE_LIFETIME_BO'));

        return isset($cookie->id_employee) && isset($cookie->passwd) && Employee::checkPassword($cookie->id_employee, $cookie->passwd);
    }

    public function getFrontEditorToken(): string
    {
        return Tools::hash($this->name . $this->getEmployeeId());
    }

    /**
     * Resolve the current employee ID.
     *
     * Tries the Context first (back-office), then falls back to the
     * psAdmin cookie (front-office preview on PS 8+/9 where the
     * employee is no longer loaded in the front context).
     */
    private function getEmployeeId(): int
    {
        $context = Context::getContext();
        if (isset($context->employee) && $context->employee instanceof Employee && $context->employee->id) {
            return (int) $context->employee->id;
        }

        $cookie = new Cookie('psAdmin', '', (int) Configuration::get('PS_COOKIE_LIFETIME_BO'));
        if (isset($cookie->id_employee) && $cookie->id_employee) {
            return (int) $cookie->id_employee;
        }

        return 0;
    }

    private function installSQL(): bool
    {
        if (!file_exists(dirname(__FILE__) . self::INSTALL_SQL_FILE)) {
            return false;
        } elseif (!$sql = file_get_contents(dirname(__FILE__) . self::INSTALL_SQL_FILE)) {
            return false;
        }
        $sql = str_replace(['PREFIX', 'ENGINE_TYPE'], [_DB_PREFIX_, _MYSQL_ENGINE_], $sql);
        $sql = preg_split("/;\s*[\r\n]+/", trim($sql));
        foreach ($sql as $query) {
            if (!Db::getInstance()->execute(trim($query))) {
                return false;
            }
        }

        unset($sql, $q, $replace);

        return true;
    }

    /**
     * Flag the HTML purifier OFF while a CMS page is saving, so Elementor
     * JSON content isn't purified out of the CMS `content` field.
     */
    public function hookActionObjectCmsUpdateBefore($params)
    {
        $pur = (int) Configuration::get('PS_USE_HTMLPURIFIER');
        Configuration::updateValue('PS_USE_HTMLPURIFIER_TMP', $pur);
        Configuration::updateValue('PS_USE_HTMLPURIFIER', 0);
    }

    /**
     * Restore the HTML purifier setting saved by hookActionObjectCmsUpdateBefore.
     */
    public function hookActionObjectCmsUpdateAfter($params)
    {
        $pur = (int) Configuration::get('PS_USE_HTMLPURIFIER_TMP');
        Configuration::updateValue('PS_USE_HTMLPURIFIER', $pur);
    }

    public function hookIsJustElementor($params)
    {
        return IqitElementorCategory::isJustElementor((int) $params['categoryId']);
    }

    /**
     * Drop the Elementor layout row associated with a deleted product.
     */
    public function hookActionObjectProductDeleteAfter($params)
    {
        if (!isset($params['object']->id)) {
            return;
        }

        IqitElementorProduct::deleteElement($params['object']->id);
    }

    /**
     * No cleanup needed for manufacturer delete — Elementor content is stored
     * directly in manufacturer_lang.description and deleted natively by PS.
     */

    /**
     * Drop the Elementor layout row associated with a deleted category.
     */
    public function hookActionObjectCategoryDeleteAfter($params)
    {
        if (!isset($params['object']->id)) {
            return;
        }

        IqitElementorCategory::deleteElement($params['object']->id);
    }

    public function hookActionProductAdd($params)
    {
        if (isset($params['id_product_old'])) {
            $idProductOld = (int)$params['id_product_old'];
            $idProduct = (int)$params['id_product'];

            $id = IqitElementorProduct::getIdByProduct($idProductOld);

            if ($id) {
                $elementor = new IqitElementorProduct($id);
                $elementor->id_product = $idProduct;
                $elementor->add();
            }
        }
    }

    /**
     * Smarty function: `{iqit_render content=$foo}`.
     *
     * Renders Elementor JSON content into HTML. Any field storing Elementor
     * JSON can be passed through this function from a template, regardless
     * of where the value comes from (Store, CMS, custom module, …) — no
     * pageType, no pageId, no target lookup needed.
     *
     * Caching strategy: content-addressed. The cache key is an md5 of the
     * raw input, so:
     *   - same content → same key → cache hit → ~free
     *   - changed content → new key → cache miss → re-render once
     * Invalidation is implicit: there is nothing to invalidate. Stale files
     * for old content versions are never read again; they can be cleaned up
     * with a periodic `rm -rf _PS_CACHE_DIR_/iqitelementor/render/` or after
     * an Elementor widget change that requires a full re-render.
     *
     * Content that is not valid Elementor JSON is returned as-is (so the
     * function is safe to use on any description field — if the merchant
     * hasn't built a layout yet, the plain text still shows through).
     *
     * @param array<string, mixed> $params
     * @return string
     */
    public function smartyRenderElementor(array $params, ?\Smarty_Internal_Template $smarty = null): string
    {
        $content = $params['content'] ?? '';
        if (is_array($content)) {
            // Multilang arrays sometimes land here — pick the current language.
            $idLang = (int) $this->context->language->id;
            $content = $content[$idLang] ?? reset($content);
        }
        $content = (string) $content;
        if ($content === '') {
            return '';
        }

        // Short-circuit: if the content is not Elementor JSON, return it
        // untouched so the function is safe on any description field.
        $stripped = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $content);
        $stripped = str_replace(["\r", "\n"], '', (string) $stripped);
        $decoded = json_decode($stripped, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded) || empty($decoded)) {
            return $content;
        }

        // Optional entity scope for precise cache invalidation on save.
        // When all four keys are provided the cache uses the scoped path;
        // otherwise it falls back to the self-invalidating anonymous one.
        $scope = [];
        if (isset($params['entity_type'], $params['entity_id'])) {
            $scope = [
                'entity_type' => (string) $params['entity_type'],
                'entity_id' => (int) $params['entity_id'],
                'content_type' => isset($params['content_type']) ? (string) $params['content_type'] : '',
                'id_lang' => isset($params['id_lang'])
                    ? (int) $params['id_lang']
                    : (int) $this->context->language->id,
            ];
        }

        return RenderCache::remember($stripped, function () use ($decoded) {
            return OutputHelper::capture(function () use ($decoded) {
                Plugin::instance()->getFrontend($decoded);
            });
        }, $scope);
    }

}
