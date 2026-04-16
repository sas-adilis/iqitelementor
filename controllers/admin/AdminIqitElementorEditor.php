<?php

use IqitElementor\Cache\RenderCache;
use IqitElementor\Core\Plugin;
use IqitElementor\Core\Responsive;
use IqitElementor\Editor\EditorTargetRegistry;
use IqitElementor\Enum\EntityType;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\IconHelper;
use IqitElementor\Helper\SmartLinkHelper;
use IqitElementor\Manager\RevisionManager;

if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminIqitElementorEditorController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        $this->display_header = false;
        parent::__construct();
        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'AdminIqitElementorEditor';
    }

    public function initContent()
    {
        $this->setMedia();
        $this->initHeader();

        ob_start();
        Plugin::instance()->editor->printPanelHtml();
        $output = ob_get_contents();
        ob_end_clean();

        $pageId = (int) Tools::getValue('pageId');
        $pageType = Tools::getValue('pageType');
        $contentType = Tools::getValue('contentType');
        $newContent = Tools::getValue('newContent');
        $idLang = (int) Tools::getValue('idLang');

        if (!$idLang) {
            $idLang = (int) Configuration::get('PS_LANG_DEFAULT');
        }

        $languages = $this->context->controller->getLanguages();
        $elementorData = '';
        $editedPage = null;
        $editedPageLink = null;

        $target = EditorTargetRegistry::get((string) $pageType);
        if ($target !== null) {
            $loaded = $target->loadEditorContent($pageId, (string) $contentType, $idLang);
            $editedPage = $loaded['entity'] ?? null;
            $editedPageLink = $loaded['editLink'] ?? null;
            $elementorData = $loaded['data'] ?? '';
        }

        if (!$editedPageLink) {
            // Unknown page type or target failed to resolve — back to dashboard.
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminDashboard'));
        }

        $previewLink = $this->context->link->getModuleLink('iqitelementor', 'Preview', [
            'iqit_fronteditor_token' => $this->module->getFrontEditorToken(),
            'admin_webpath' => $this->context->controller->admin_webpath,
            'elementor_page_type' => $pageType,
            'id_employee' => is_object($this->context->employee) ? (int) $this->context->employee->id
                : Tools::getValue('id_employee'),
        ], true);

        Media::addJsDef(
            ['ElementorConfig' => [
                'ajaxurl' => $this->context->link->getAdminLink('AdminIqitElementorEditor') . '&ajax=1',
                'ajaxFrontUrl' => Context::getContext()->link->getModuleLink('iqitelementor', 'Widget', [
                    'iqit_fronteditor_token' => $this->module->getFrontEditorToken(),
                    'id_employee' => is_object(Context::getContext()->employee) ? (int) Context::getContext()->employee->id
                        : Tools::getValue('id_employee'),
                    'ajax' => 1,
                    'action' => 'widgetPreview',
                ], true),
                'preview_link' => $previewLink,
                'elements_categories' => Plugin::instance()->elementsManager->getCategories(),
                'controls' => Plugin::instance()->controlsManager->getControlsData(),
                'elements' => Plugin::instance()->elementsManager->getRegisterElementsData(),
                'widgets' => Plugin::instance()->widgetsManager->getRegisteredWidgetsData((string) $pageType),
                'schemes' => [
                    'items' => [
                        'typography' => [
                            'items' => [
                                '1' => ['value' => ['font_family' => '', 'font_weight' => '']],
                                '2' => ['value' => ['font_family' => '', 'font_weight' => '']],
                                '3' => ['value' => ['font_family' => '', 'font_weight' => '']],
                                '4' => ['value' => ['font_family' => '', 'font_weight' => '']],
                            ],
                        ],
                        'color' => [
                            'items' => [
                                '1' => ['value' => ''],
                                '2' => ['value' => ''],
                                '3' => ['value' => ''],
                                '4' => ['value' => ''],
                            ],
                        ],
                    ],
                    'enabled_schemes' => [],
                ],
                'default_schemes' => [
                    'typography' => [
                        'items' => [
                            '1' => ['value' => ['font_family' => '', 'font_weight' => '']],
                            '2' => ['value' => ['font_family' => '', 'font_weight' => '']],
                            '3' => ['value' => ['font_family' => '', 'font_weight' => '']],
                            '4' => ['value' => ['font_family' => '', 'font_weight' => '']],
                        ],
                    ],
                    'color' => [
                        'items' => [
                            '1' => ['value' => ''],
                            '2' => ['value' => ''],
                            '3' => ['value' => ''],
                            '4' => ['value' => ''],
                        ],
                    ],
                ],
                'system_schemes' => '',
                'wp_editor' => '<div class="wp-core-ui wp-editor-wrap html-active" id="wp-elementorwpeditor-wrap"><div class="wp-editor-container" id="wp-elementorwpeditor-editor-container"><textarea class="elementor-wp-editor wp-editor-area" cols="40" id="elementorwpeditor" name="elementorwpeditor" rows="15">%%EDITORCONTENT%%</textarea></div></div> ',
                'post_id' => $pageId,
                'page_type' => $pageType,
                'languages' => $languages,
                'id_lang' => $idLang,
                'content_type' => $contentType,
                'new_content' => $newContent,
                'post_permalink' => '',
                'edit_post_link' => $editedPageLink,
                'elementor_site' => 'https://go.elementor.com/about-elementor/',
                'help_the_content_url' => 'http://iqit-commerce.com/xdocs/warehouse-theme-documentation/#iqitelementor',
                'maintance_url_settings' => $this->context->link->getAdminLink('AdminMaintenance'),
                'assets_url' => $this->module->getPathUri() . 'views/',
                'data' => $elementorData,
                'isRtl' => (bool) $this->context->language->is_rtl,
                'introduction' => Plugin::instance()->getCurrentIntroduction(),
                'viewportBreakpoints' => Responsive::getBreakpoints(),
                'widgetStyles' => $this->loadWidgetStyles(),
                'i18n' => [
                    'elementor' => $this->module->getTranslator()->trans('Elementor', [], 'Modules.Iqitelementor.Admin'),
                    'dialog_confirm_delete' => $this->module->getTranslator()->trans('Are you sure you want to delete this', [], 'Modules.Iqitelementor.Admin') . ' {0}?',
                    'dialog_user_taken_over' => '{0} ' . $this->module->getTranslator()->trans('has taken over and is currently editing. Do you want to take over this page editing?', [], 'Modules.Iqitelementor.Admin'),
                    'delete' => $this->module->getTranslator()->trans('Delete', [], 'Modules.Iqitelementor.Admin'),
                    'cancel' => $this->module->getTranslator()->trans('Cancel', [], 'Modules.Iqitelementor.Admin'),
                    'delete_element' => $this->module->getTranslator()->trans('Delete', [], 'Modules.Iqitelementor.Admin') . ' {0}',
                    'take_over' => $this->module->getTranslator()->trans('Take Over', [], 'Modules.Iqitelementor.Admin'),
                    'go_back' => $this->module->getTranslator()->trans('Go Back', [], 'Modules.Iqitelementor.Admin'),
                    'saved' => $this->module->getTranslator()->trans('Saved', [], 'Modules.Iqitelementor.Admin'),
                    'before_unload_alert' => $this->module->getTranslator()->trans('Please note: All unsaved changes will be lost.', [], 'Modules.Iqitelementor.Admin'),
                    'edit_element' => $this->module->getTranslator()->trans('Edit', [], 'Modules.Iqitelementor.Admin') . ' {0}',
                    'global_colors' => $this->module->getTranslator()->trans('Global Colors', [], 'Modules.Iqitelementor.Admin'),
                    'global_fonts' => $this->module->getTranslator()->trans('Global Fonts', [], 'Modules.Iqitelementor.Admin'),
                    'about_elementor' => $this->module->getTranslator()->trans('About Elementor', [], 'Modules.Iqitelementor.Admin'),
                    'clear_page' => $this->module->getTranslator()->trans('Delete all content', [], 'Modules.Iqitelementor.Admin'),
                    'dialog_confirm_clear_page' => $this->module->getTranslator()->trans('Are you shure you want delete all content?', [], 'Modules.Iqitelementor.Admin'),
                    'changes_lost' => $this->module->getTranslator()->trans('You have unsaved changes!', [], 'Modules.Iqitelementor.Admin'),
                    'dialog_confirm_changes_lost' => $this->module->getTranslator()->trans('Please return and save, otherwise your changes will be lost.', [], 'Modules.Iqitelementor.Admin'),
                    'import_language_dialog_title' => $this->module->getTranslator()->trans('Erase content and import', [], 'Modules.Iqitelementor.Admin'),
                    'import_language_dialog_msg' => $this->module->getTranslator()->trans('Please confirm that you want to erase content of this page and import content of other language', [], 'Modules.Iqitelementor.Admin'),
                    'inner_section' => $this->module->getTranslator()->trans('Columns', [], 'Modules.Iqitelementor.Admin'),
                    'dialog_confirm_gallery_delete' => $this->module->getTranslator()->trans('Are you sure you want to reset this gallery?', [], 'Modules.Iqitelementor.Admin'),
                    'delete_gallery' => $this->module->getTranslator()->trans('Reset Gallery', [], 'Modules.Iqitelementor.Admin'),
                    'gallery_images_selected' => '{0}' . $this->module->getTranslator()->trans('Images Selected', [], 'Modules.Iqitelementor.Admin'),
                    'insert_media' => $this->module->getTranslator()->trans('Insert Media', [], 'Modules.Iqitelementor.Admin'),
                    'preview_el_not_found_header' => $this->module->getTranslator()->trans('Preview not found', [], 'Modules.Iqitelementor.Admin'),
                    'preview_el_not_found_message' => $this->module->getTranslator()->trans('Make sure you added own ip in Maintenance settings (Backoffice > shop parameters > general > maintenance)', [], 'Modules.Iqitelementor.Admin'),
                    'learn_more' => $this->module->getTranslator()->trans('Learn more', [], 'Modules.Iqitelementor.Admin'),
                    'ie_edge_browser' => $this->module->getTranslator()->trans('Builder do not support IE/Edge browsers', [], 'Modules.Iqitelementor.Admin'),
                    'ie_edge_browser_info' => $this->module->getTranslator()->trans('Please edit your layout in different browser, like Chrome, Firefox, Opera or Safari', [], 'Modules.Iqitelementor.Admin'),
                    'an_error_occurred' => $this->module->getTranslator()->trans('An error occurred', [], 'Modules.Iqitelementor.Admin'),
                    'templates_request_error' => $this->module->getTranslator()->trans('The following error occurred when processing the request:', [], 'Modules.Iqitelementor.Admin'),
                    'save_your_template' => $this->module->getTranslator()->trans('Save Your {0} to Library', [], 'Modules.Iqitelementor.Admin'),
                    'load_your_template' => $this->module->getTranslator()->trans('Load your template from file', [], 'Modules.Iqitelementor.Admin'),
                    'page' => $this->module->getTranslator()->trans('Page', [], 'Modules.Iqitelementor.Admin'),
                    'section' => $this->module->getTranslator()->trans('Section', [], 'Modules.Iqitelementor.Admin'),
                    'delete_template' => $this->module->getTranslator()->trans('Delete Template', [], 'Modules.Iqitelementor.Admin'),
                    'delete_template_confirm' => $this->module->getTranslator()->trans('Are you sure you want to delete this template?', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_apply' => $this->module->getTranslator()->trans('Apply', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_label' => $this->module->getTranslator()->trans('revisions', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_error_loading' => $this->module->getTranslator()->trans('Error loading revisions.', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_no_revisions' => $this->module->getTranslator()->trans('No revisions yet.', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_autosave_by' => $this->module->getTranslator()->trans('Autosave by', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_revision' => $this->module->getTranslator()->trans('Revision', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_by' => $this->module->getTranslator()->trans('by', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_seconds_ago' => $this->module->getTranslator()->trans('seconds ago', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_min_ago' => $this->module->getTranslator()->trans('min ago', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_hours_ago' => $this->module->getTranslator()->trans('hours ago', [], 'Modules.Iqitelementor.Admin'),
                    'revisions_days_ago' => $this->module->getTranslator()->trans('days ago', [], 'Modules.Iqitelementor.Admin'),
                    'save_style_as' => $this->module->getTranslator()->trans('Save styles as...', [], 'Modules.Iqitelementor.Admin'),
                    'use_style' => $this->module->getTranslator()->trans('Use style', [], 'Modules.Iqitelementor.Admin'),
                    'style_saved' => $this->module->getTranslator()->trans('Style saved', [], 'Modules.Iqitelementor.Admin'),
                    'style_applied' => $this->module->getTranslator()->trans('Style applied', [], 'Modules.Iqitelementor.Admin'),
                    'style_deleted' => $this->module->getTranslator()->trans('Style deleted', [], 'Modules.Iqitelementor.Admin'),
                    'style_set_default' => $this->module->getTranslator()->trans('Default updated', [], 'Modules.Iqitelementor.Admin'),
                    'styles_library' => $this->module->getTranslator()->trans('Styles Library', [], 'Modules.Iqitelementor.Admin'),
                    'no_styles_yet' => $this->module->getTranslator()->trans('No saved styles yet', [], 'Modules.Iqitelementor.Admin'),
                    'no_styles_desc' => $this->module->getTranslator()->trans('Right-click any widget and choose "Save styles as..." to save reusable styles.', [], 'Modules.Iqitelementor.Admin'),
                    'enter_style_name' => $this->module->getTranslator()->trans('Enter style name', [], 'Modules.Iqitelementor.Admin'),
                    'save_style' => $this->module->getTranslator()->trans('Save style', [], 'Modules.Iqitelementor.Admin'),
                    'delete_style' => $this->module->getTranslator()->trans('Delete Style', [], 'Modules.Iqitelementor.Admin'),
                    'delete_style_confirm' => $this->module->getTranslator()->trans('Are you sure you want to delete this style?', [], 'Modules.Iqitelementor.Admin'),
                    'set_as_default' => $this->module->getTranslator()->trans('Set as default', [], 'Modules.Iqitelementor.Admin'),
                    'unset_default' => $this->module->getTranslator()->trans('Unset default', [], 'Modules.Iqitelementor.Admin'),
                    'apply' => $this->module->getTranslator()->trans('Apply', [], 'Modules.Iqitelementor.Admin'),
                    'no_styles_for_widget' => $this->module->getTranslator()->trans('No saved styles for this widget', [], 'Modules.Iqitelementor.Admin'),
                ],
            ]]);

        Media::addJsDef(
            ['wpColorPickerL10n' => [
                'clear' => $this->module->getTranslator()->trans('Clear', [], 'Modules.Iqitelementor.Admin'),
                'defaultString' => $this->module->getTranslator()->trans('Default', [], 'Modules.Iqitelementor.Admin'),
                'pick' => $this->module->getTranslator()->trans('Pick a color', [], 'Modules.Iqitelementor.Admin'),
                'current' => $this->module->getTranslator()->trans('Current color', [], 'Modules.Iqitelementor.Admin'),
            ]]);

        $this->context->smarty->assign([
            'js_def_vars' => Media::getJsDef(),
            'js_files' => array_unique($this->js_files),
            'css_files' => $this->css_files,
        ]);

        $this->context->smarty->assign([
            'baseDir' => __PS_BASE_URI__ . basename(_PS_ADMIN_DIR_) . '/',
            'pluginContent' => $output,
        ]);

        header('Content-Type: text/html; charset=utf-8');
        echo $this->context->smarty->fetch(
            _PS_MODULE_DIR_ . 'iqitelementor/views/templates/admin/adminiqitelementor.tpl'
        );
        exit;
    }

    public function setMedia($isNewTheme = false)
    {
        /*$is_177 = (version_compare(_PS_VERSION_, '1.7.7.0', '>=') === true) ? true : false;

        if ($is_177) {
            $this->addJs(_PS_JS_DIR_ . 'jquery/jquery-3.7.1.min.js');
            $this->addJs(_PS_JS_DIR_ . 'jquery/jquery-migrate-3.4.0.min.js');
        }*/

        $this->addJs(_PS_JS_DIR_ . 'jquery/jquery-3.5.1.min.js');
        $this->addJs(_PS_JS_DIR_ . 'jquery/jquery-migrate-3.1.0.min.js');
        $this->addJs(_PS_JS_DIR_ . 'jquery/jquery.browser-0.1.0.min.js');
        $this->addJs(_PS_JS_DIR_ . 'jquery/jquery.live-polyfill-1.1.2.min.js');

        $this->addJS(_PS_JS_DIR_ . 'tiny_mce/tinymce.min.js');
        $this->addJqueryPlugin(['fancybox', 'autocomplete']);
        $this->addJqueryUI(['ui.datepicker']);

        $this->addCSS([
            __PS_BASE_URI__ . $this->admin_webpath . '/themes/' . $this->bo_theme . '/css/admin-theme.css',
            __PS_BASE_URI__ . $this->admin_webpath . '/themes/' . $this->bo_theme . '/public/theme.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/font-awesome/css/font-awesome.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/select2/css/select2.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/eicons/css/elementor-icons.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/color-picker/color-picker.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/css/editor.css',
            _MODULE_DIR_ . 'iqitelementor/views/css/editor-inspect.css',
        ]);

        $this->addJS([
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/core.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/widget.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/mouse.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/sortable.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/resizable.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/position.min.js?ver=1.11.4"',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/draggable.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/ui/slider.min.js?ver=1.11.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery/jquery.ui.touch-punch.js?ver=0.2.2',
            _MODULE_DIR_ . 'iqitelementor/views/lib/color-picker/iris.min.js?ver=1.0.7',
            _MODULE_DIR_ . 'iqitelementor/views/lib/color-picker/color-picker.min.js?ver=4.6.1',
            _MODULE_DIR_ . 'iqitelementor/views/lib/color-picker/wp-color-picker-alpha.js?ver=1.1',
            _MODULE_DIR_ . 'iqitelementor/views/lib/waypoints/waypoints-for-editor.js?ver=2.0.2',
            _MODULE_DIR_ . 'iqitelementor/views/lib/imagesloaded/imagesloaded.min.js?ver=4.1.0',
            _MODULE_DIR_ . 'iqitelementor/views/lib/lazyload/lazyload.transpiled.min.js',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery-numerator/jquery-numerator.min.js?ver=0.2.0',
            _MODULE_DIR_ . 'iqitelementor/views/lib/swiper/swiper-bundle.min.js',
            _MODULE_DIR_ . 'iqitelementor/views/lib/underscore/underscore-min.js',
            _MODULE_DIR_ . 'iqitelementor/views/lib/backbone/backbone-min.js',
            _MODULE_DIR_ . 'iqitelementor/views/lib/backbone/backbone.marionette.js?ver=2.4.5',
            _MODULE_DIR_ . 'iqitelementor/views/lib/backbone/backbone.radio.min.js?ver=1.0.4',
            _MODULE_DIR_ . 'iqitelementor/views/lib/perfect-scrollbar/perfect-scrollbar.jquery.min.js?ver=0.6.12',
            _MODULE_DIR_ . 'iqitelementor/views/lib/jquery-easing/jquery-easing.min.js?ver=1.3.2',
            _MODULE_DIR_ . 'iqitelementor/views/lib/nprogress/nprogress.js?ver=0.2.0',
            _MODULE_DIR_ . 'iqitelementor/views/lib/tipsy/tipsy.min.js?ver=1.0.0',
            _MODULE_DIR_ . 'iqitelementor/views/lib/ps-helper/ps-helper.js',
            _MODULE_DIR_ . 'iqitelementor/views/lib/dialog/dialog.js?ver=3.0.0',
            _MODULE_DIR_ . 'iqitelementor/views/lib/select2/js/select2.min.js?ver=4.0.2',
            _MODULE_DIR_ . 'iqitelementor/views/js/frontend.js?ver=0.9.3',
            _MODULE_DIR_ . 'iqitelementor/views/js/editor.js?ver=0.9.3',
            'https://cdn.jsdelivr.net/npm/ace-builds@1.43.5/src-min-noconflict/ace.min.js',
            'https://cdn.jsdelivr.net/npm/ace-builds@1.43.5/src-min-noconflict/mode-css.min.js',
            'https://cdn.jsdelivr.net/npm/ace-builds@1.43.5/src-min-noconflict/theme-tomorrow.min.js',
            'https://cdn.jsdelivr.net/npm/ace-builds@1.43.5/src-min-noconflict/ext-language_tools.min.js',
        ]);

        $base_url = Tools::getHttpHost(true);  // DON'T TOUCH (base url (only domain) of site (without final /)).
        $base_url = Configuration::get('PS_SSL_ENABLED') && Configuration::get('PS_SSL_ENABLED_EVERYWHERE') ? $base_url : str_replace('https', 'http', $base_url);

        Media::addJsDef([
            'elementorFrontendConfig' => [
                'isEditMode' => 1,
                'stretchedSectionContainer' => '',
                'isRtl' => (bool) $this->context->language->is_rtl,
                'ajax_csfr_token_url' => $this->context->link->getModuleLink($this->module->name, 'Actions', ['process' => 'handleCsfrToken', 'ajax' => 1], true),
                'iqitBaseUrl' => Tools::safeOutput($base_url),
                'iqitElementorColorPalette' => Helper::stringToArrayOfColors(Configuration::get('IQIT_ELEMENT_COLORS')),
            ],
            'dateTimePickerL10n' => []
        ]);

        Hook::exec('actionAdminControllerSetMedia');
    }

    public function display()
    {
    }

    public function ajaxProcessRenderWidget(): void
    {
        Plugin::instance()->widgetsManager->ajaxRenderWidget();
        exit;
    }

    public function ajaxProcessSaveSvgIcon(): void
    {
        header('Content-Type: application/json');

        $library = Tools::getValue('library');
        $style = Tools::getValue('style');
        $name = Tools::getValue('name');
        $svg = Tools::getValue('svg');

        $svgKey = IconHelper::saveSvgToDisk($library, $style, $name, $svg);

        if ($svgKey) {
            exit(json_encode([
                'success' => true,
                'data' => ['svgKey' => $svgKey],
            ]));
        }

        exit(json_encode([
            'success' => false,
        ]));
    }

    public function ajaxProcessSearchEntities(): void
    {
        header('Content-Type: application/json');

        $query = Tools::getValue('q', '');
        if (empty($query) || Tools::strlen($query) < 2) {
            exit(json_encode([
                'success' => true,
                'data' => [],
            ]));
        }

        $idLang = (int) $this->context->language->id;
        $idShop = (int) $this->context->shop->id;

        $results = SmartLinkHelper::searchEntities($query, $idLang, $idShop);

        exit(json_encode([
            'success' => true,
            'data' => $results,
        ]));
    }

    public function ajaxProcessSaveEditor(): void
    {
        header('Content-Type: application/json');

        $pageId = (int) Tools::getValue('page_id');
        $pageType = Tools::getValue('page_type');
        $contentType = Tools::getValue('content_type');
        $newContent = Tools::getValue('new_content');
        $data = $this->getJsonValue('data');
        $idLang = (int) Tools::getValue('id_lang');

        $revisionEntityType = $pageType;
        $revisionEntityId = $pageId;

        $target = EditorTargetRegistry::get((string) $pageType);
        if ($target !== null) {
            $revisionEntityId = $target->saveContent($pageId, (string) $contentType, $idLang, $data);
        }

        // Save revision and clear autosave on manual save
        if ($revisionEntityId && $data) {
            $revisionManager = new RevisionManager();
            $revisionManager->save($revisionEntityType, $revisionEntityId, $data);
            $revisionManager->clearAutosave($revisionEntityType, $revisionEntityId);
        }

        // Content changed → drop the scoped render cache entry for this
        // (entity, content type, language) so the next front request
        // re-renders the HTML from the new JSON. Anonymous (content-hashed)
        // cache entries are self-invalidating and not affected.
        RenderCache::forget((string) $pageType, $pageId, (string) $contentType, $idLang);

        $return = [
            'success' => true,
        ];

        exit(json_encode($return));
    }

    /**
     * AJAX: periodic autosave from the editor.
     */
    public function ajaxProcessSaveAutosave(): void
    {
        header('Content-Type: application/json');

        $entityType = Tools::getValue('entity_type');
        $pageId = (int) Tools::getValue('entity_id');
        $content = $this->getJsonValue('data');

        if (!$entityType || !$pageId || !$content) {
            exit(json_encode(['success' => false, 'error' => 'Missing parameters']));
        }

        // Resolve the native entity ID from the page ID used by the editor
        $entityId = $this->resolveEntityId($entityType, $pageId);
        if (!$entityId) {
            exit(json_encode(['success' => false, 'error' => 'Entity not found']));
        }

        $revisionManager = new RevisionManager();
        $revisionManager->saveAutosave($entityType, $entityId, $content);

        exit(json_encode(['success' => true]));
    }

    /**
     * AJAX: get autosave info for an entity.
     */
    public function ajaxProcessGetAutosave(): void
    {
        header('Content-Type: application/json');

        $entityType = Tools::getValue('entity_type');
        $pageId = (int) Tools::getValue('entity_id');

        if (!$entityType || !$pageId) {
            exit(json_encode(['success' => false, 'error' => 'Missing parameters']));
        }

        $entityId = $this->resolveEntityId($entityType, $pageId);
        if (!$entityId) {
            exit(json_encode(['success' => false, 'error' => 'Entity not found']));
        }

        $revisionManager = new RevisionManager();
        $info = $revisionManager->getAutosaveInfo($entityType, $entityId);

        exit(json_encode([
            'success' => true,
            'has_autosave' => $info !== null,
            'autosave_at' => $info !== null ? $info['autosave_at'] : null,
            'content' => $info !== null ? $info['content'] : null,
        ]));
    }

    /**
     * AJAX: clear (dismiss) the autosave for an entity.
     */
    public function ajaxProcessClearAutosave(): void
    {
        header('Content-Type: application/json');

        $entityType = Tools::getValue('entity_type');
        $pageId = (int) Tools::getValue('entity_id');

        if (!$entityType || !$pageId) {
            exit(json_encode(['success' => false, 'error' => 'Missing parameters']));
        }

        $entityId = $this->resolveEntityId($entityType, $pageId);
        if (!$entityId) {
            exit(json_encode(['success' => true]));
        }

        $revisionManager = new RevisionManager();
        $revisionManager->clearAutosave($entityType, $entityId);

        exit(json_encode(['success' => true]));
    }

    /**
     * AJAX: list revisions for an entity.
     */
    public function ajaxProcessGetRevisions(): void
    {
        header('Content-Type: application/json');

        $entityType = Tools::getValue('entity_type');
        $pageId = (int) Tools::getValue('entity_id');

        if (!$entityType || !$pageId) {
            exit(json_encode(['success' => false, 'error' => 'Missing parameters']));
        }

        $entityId = $this->resolveEntityId($entityType, $pageId);
        if (!$entityId) {
            exit(json_encode(['success' => true, 'revisions' => [], 'count' => 0, 'limit' => 20, 'autosave' => null]));
        }

        $revisionManager = new RevisionManager();
        $revisions = $revisionManager->getForEntity($entityType, $entityId);
        $limit = $revisionManager->getLimit();
        $count = count($revisions);

        $list = [];
        foreach ($revisions as $revision) {
            $list[] = [
                'id' => (int) $revision->id,
                'created_at' => $revision->created_at,
                'label' => $revision->label,
                'id_employee' => (int) $revision->id_employee,
                'employee_name' => $revision->employee_name,
            ];
        }

        // Autosave info
        $autosave = null;
        $autosaveInfo = $revisionManager->getAutosaveInfo($entityType, $entityId);
        if ($autosaveInfo !== null) {
            $employeeName = '';
            $context = \Context::getContext();
            if (is_object($context->employee) && $context->employee->id) {
                $employeeName = $context->employee->firstname . ' ' . $context->employee->lastname;
            }
            $autosave = [
                'autosave_at' => $autosaveInfo['autosave_at'],
                'employee_name' => $employeeName,
            ];
        }

        exit(json_encode([
            'success' => true,
            'revisions' => $list,
            'count' => $count,
            'limit' => $limit,
            'autosave' => $autosave,
        ]));
    }

    /**
     * AJAX: get the content of a specific revision.
     */
    public function ajaxProcessGetRevisionContent(): void
    {
        header('Content-Type: application/json');

        $idRevision = (int) Tools::getValue('id_revision');
        if (!$idRevision) {
            exit(json_encode(['success' => false, 'error' => 'Missing id_revision']));
        }

        $revisionManager = new RevisionManager();
        $content = $revisionManager->getRevisionContent($idRevision);

        if ($content === null) {
            exit(json_encode(['success' => false, 'error' => 'Revision not found']));
        }

        exit(json_encode([
            'success' => true,
            'content' => $content,
        ]));
    }

    /**
     * AJAX: restore a revision (returns content to load in editor).
     */
    public function ajaxProcessRestoreRevision(): void
    {
        header('Content-Type: application/json');

        $idRevision = (int) Tools::getValue('id_revision');
        if (!$idRevision) {
            exit(json_encode(['success' => false, 'error' => 'Missing id_revision']));
        }

        $revisionManager = new RevisionManager();
        $content = $revisionManager->getRevisionContent($idRevision);

        if ($content === null) {
            exit(json_encode(['success' => false, 'error' => 'Revision not found']));
        }

        exit(json_encode([
            'success' => true,
            'content' => $content,
        ]));
    }

    /**
     * AJAX: delete a single revision.
     */
    public function ajaxProcessDeleteRevision(): void
    {
        header('Content-Type: application/json');

        $idRevision = (int) Tools::getValue('id_revision');
        if (!$idRevision) {
            exit(json_encode(['success' => false, 'error' => 'Missing id_revision']));
        }

        $revisionManager = new RevisionManager();
        $success = $revisionManager->delete($idRevision);

        exit(json_encode(['success' => $success]));
    }

    /**
     * AJAX: build the front-office preview URL for the entity being edited.
     * The caller must autosave before opening this URL.
     */
    public function ajaxProcessGetPreviewUrl(): void
    {
        header('Content-Type: application/json');

        $pageType = Tools::getValue('page_type');
        $pageId = (int) Tools::getValue('page_id');
        $contentType = Tools::getValue('content_type');
        $idLang = (int) Tools::getValue('id_lang');

        if (!$idLang) {
            $idLang = (int) $this->context->language->id;
        }

        $previewToken = $this->module->getPreviewToken();
        $previewParams = [
            'iqit_preview' => 1,
            'iqit_preview_token' => $previewToken,
        ];

        $frontUrl = '';

        $target = EditorTargetRegistry::get((string) $pageType);
        if ($target !== null) {
            $frontUrl = $target->getPreviewUrl($pageId, (string) $contentType, $idLang, $previewParams);
        }

        if ($frontUrl === '') {
            $frontUrl = $this->context->link->getPageLink('index', true, $idLang, $previewParams);
        }

        exit(json_encode([
            'success' => true,
            'url' => $frontUrl,
        ]));
    }

    public function ajaxProcessGetLanguageContent(): void
    {
        header('Content-Type: application/json');

        $pageId = (int) Tools::getValue('page_id');
        $pageType = Tools::getValue('page_type');
        $contentType = Tools::getValue('content_type');
        $idLang = (int) Tools::getValue('id_lang');
        $data = null;

        $target = EditorTargetRegistry::get((string) $pageType);
        if ($target !== null) {
            $data = $target->loadLanguageContent($pageId, (string) $contentType, $idLang);
        }

        $return = [
            'success' => true,
            'data' => $data,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessGetTemplates(): void
    {
        header('Content-Type: application/json');

        $templatesSource = IqitElementorTemplate::getTemplates();
        $templates = [];

        foreach ($templatesSource as $index => $template) {
            $templates[$index] = [
                'template_id' => $template['id_template'],
                'source' => 'local',
                'title' => $template['title'],
                'export_link' => $this->context->link->getAdminLink($this->name, true) . '&ajax=1&action=ExportTemplate&templateId=' . $template['id_template'],
                'url' => $this->getTemplatePreviewLink($template['id_template']),
            ];
        }

        $return = [
            'success' => true,
            'data' => $templates,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessSaveTemplate(): void
    {
        header('Content-Type: application/json');
        $title = Tools::getValue('title');
        $data = $this->getJsonValue('data');
        $template = new IqitElementorTemplate();
        $template->title = $title;
        $template->data = $data;
        $template->add();

        $templateInfo = [
            'template_id' => $template->id,
            'source' => 'local',
            'title' => $title,
            'export_link' => $this->context->link->getAdminLink($this->name, true) . '&ajax=1&action=ExportTemplate&templateId=' . $template->id,
            'url' => $this->getTemplatePreviewLink($template->id),
        ];

        $return = [
            'success' => true,
            'data' => $templateInfo,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessDeleteTemplate(): void
    {
        header('Content-Type: application/json');
        $templateId = (int) Tools::getValue('template_id');
        $template = new IqitElementorTemplate($templateId);
        $template->delete();

        $return = [
            'success' => true,
            'data' => true,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessGetTemplateContent(): void
    {
        header('Content-Type: application/json');

        $templateId = (int) Tools::getValue('template_id');
        $template = new IqitElementorTemplate($templateId);

        $return = [
            'success' => true,
            'data' => json_decode($template->data, true),
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessExportTemplate(): void
    {
        $templateId = (int) Tools::getValue('templateId');
        $template = new IqitElementorTemplate($templateId);

        $content = [
            'title' => $template->title,
            'data' => $template->data,
        ];

        header('Content-disposition: attachment; filename=iqitelementor_template_id_' . $template->id . '.json');
        header('Content-type: application/json');
        echo json_encode($content);
        exit;
    }

    public function ajaxProcessImportTemplate(): void
    {
        header('Content-Type: application/json');

        $return = [
            'error' => true,
            'data' => [
                'message' => $this->module->getTranslator()->trans('Problem with file', [], 'Modules.Iqitelementor.Admin'),
            ],
        ];

        if (isset($_FILES['file'], $_FILES['file']['tmp_name'])) {
            $templateSource = json_decode(Tools::file_get_contents($_FILES['file']['tmp_name']));
            $template = new IqitElementorTemplate();
            if (isset($templateSource->title)) {
                $template->title = $templateSource->title;
                $template->data = $templateSource->data;
                $template->add();

                $templateInfo = [
                    'template_id' => $template->id,
                    'source' => 'local',
                    'title' => $templateSource->title,
                    'export_link' => $this->context->link->getAdminLink($this->name, true) . '&ajax=1&action=ExportTemplate&templateId=' . $template->id,
                    'url' => $this->getTemplatePreviewLink($template->id),
                ];

                $return = [
                    'success' => true,
                    'data' => $templateInfo,
                ];
            }
        }
        exit(json_encode($return));
    }

    public function ajaxProcessGetProducts()
    {
        header('Content-Type: application/json');

        $product_ids = Tools::getValue('ids');

        if (!$product_ids) {
            $return = [
                'success' => true,
                'data' => '',
            ];
            exit(json_encode($return));
        }

        $product_ids_array = explode(',', $product_ids);

        $id_shop = (int) $this->context->shop->id;
        $id_lang = (int) $this->context->language->id;

        $sql = 'SELECT p.`id_product`, product_shop.`id_product`,
				    pl.`name`, pl.`link_rewrite`,
					image_shop.`id_image` id_image
				FROM  `' . _DB_PREFIX_ . 'product` p 
				' . Shop::addSqlAssociation('product', 'p') . '
				LEFT JOIN `' . _DB_PREFIX_ . 'product_lang` pl ON (
					p.`id_product` = pl.`id_product`
					AND pl.`id_lang` = ' . (int) $id_lang . Shop::addSqlRestrictionOnLang('pl') . '
				)
				LEFT JOIN `' . _DB_PREFIX_ . 'image_shop` image_shop
					ON (image_shop.`id_product` = p.`id_product` AND image_shop.cover=1 AND image_shop.id_shop=' . (int) $id_shop . ')
	  
				WHERE p.id_product IN (' . implode(',', array_map('intval', $product_ids_array)) . ')' . '
				ORDER BY FIELD(product_shop.id_product, ' . implode(',', array_map('intval', $product_ids_array)) . ')';
        if (!$results = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql)) {
            return false;
        }

        foreach ($results as &$result) {
            $result['image'] = str_replace('http://', Tools::getShopProtocol(), $this->context->link->getImageLink($result['link_rewrite'], $result['id_image'], ImageType::getFormattedName('small')));
        }

        $return = [
            'success' => true,
            'data' => $results,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessSearchProducts(): void
    {
        $query = Tools::getValue('q', false);
        if (!$query or $query == '' or Tools::strlen($query) < 1) {
            exit;
        }
        if ($pos = strpos($query, ' (ref:')) {
            $query = Tools::substr($query, 0, $pos);
        }
        $excludeIds = Tools::getValue('excludeIds', false);
        if ($excludeIds && $excludeIds != 'NaN') {
            $excludeIds = implode(',', array_map('intval', explode(',', $excludeIds)));
        } else {
            $excludeIds = '';
        }
        $excludeVirtuals = false;
        $exclude_packs = false;
        $context = Context::getContext();
        $sql = 'SELECT p.`id_product`, pl.`link_rewrite`, p.`reference`, pl.`name`, image.`id_image` id_image, il.`legend`, p.`cache_default_attribute`
        FROM `' . _DB_PREFIX_ . 'product` p
        ' . Shop::addSqlAssociation('product', 'p') . '
        LEFT JOIN `' . _DB_PREFIX_ . 'product_lang` pl ON (pl.id_product = p.id_product AND pl.id_lang = ' . (int) $context->language->id . Shop::addSqlRestrictionOnLang('pl') . ')
        LEFT JOIN `' . _DB_PREFIX_ . 'image` image
        ON (image.`id_product` = p.`id_product` AND image.cover=1)
        LEFT JOIN `' . _DB_PREFIX_ . 'image_lang` il ON (image.`id_image` = il.`id_image` AND il.`id_lang` = ' . (int) $context->language->id . ')
        WHERE (pl.name LIKE \'%' . pSQL($query) . '%\' OR p.reference LIKE \'%' . pSQL($query) . '%\') AND p.`active` = 1'
            . (!empty($excludeIds) ? ' AND p.id_product NOT IN (' . $excludeIds . ') ' : ' ')
            . ($excludeVirtuals ? 'AND NOT EXISTS (SELECT 1 FROM `' . _DB_PREFIX_ . 'product_download` pd WHERE (pd.id_product = p.id_product))' : '')
            . ($exclude_packs ? 'AND (p.cache_is_pack IS NULL OR p.cache_is_pack = 0)' : '')
            . ' GROUP BY p.id_product';

        $items = Db::getInstance()->executeS($sql);

        if ($items) {
            $results = [];
            foreach ($items as $item) {
                $product = [
                    'id' => (int) $item['id_product'],
                    'name' => $item['name'],
                    'ref' => (!empty($item['reference']) ? $item['reference'] : ''),
                    'image' => str_replace('http://', Tools::getShopProtocol(), $context->link->getImageLink($item['link_rewrite'], $item['id_image'], ImageType::getFormattedName('small'))),
                ];
                array_push($results, $product);
            }
            $results = array_values($results);
            exit(json_encode($results));
        } else {
            exit(json_encode(new stdClass()));
        }
    }

    public function ajaxProcessGetPosts(): void
    {
        header('Content-Type: application/json');

        $post_ids = Tools::getValue('ids');

        if (!$post_ids) {
            $return = [
                'success' => true,
                'data' => '',
            ];
            exit(json_encode($return));
        }
        $context = Context::getContext();
        $post_ids_array = explode(',', $post_ids);

        $posts = SimpleBlogPost::getPosts($context->language->id, 30, null, null, true, 'IN-LIST', false, null, false, false, null, 'IN', $post_ids_array);

        $results = [];
        foreach ($posts as $item) {
            $product = [
                'id' => (int) $item['id_simpleblog_post'],
                'name' => $item['title'],
                'ref' => '',
                'image' => (isset($item['banner_thumb'])) ? $item['banner_thumb'] : '',
            ];
            array_push($results, $product);
        }
        $results = array_values($results);

        $return = [
            'success' => true,
            'data' => $results,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessSearchPosts(): void
    {
        $query = Tools::getValue('q', false);
        if (!$query or $query == '' or Tools::strlen($query) < 1) {
            exit;
        }
        if ($pos = strpos($query, ' (ref:')) {
            $query = Tools::substr($query, 0, $pos);
        }
        $excludeIds = Tools::getValue('excludeIds', false);
        if ($excludeIds && $excludeIds != 'NaN') {
            $excludeIds = implode(',', array_map('intval', explode(',', $excludeIds)));
        } else {
            $excludeIds = '';
        }

        $context = Context::getContext();
        $sql_param_search = pSQL(Search::getSearchParamFromWord($query));
        $result[] = Db::getInstance()->executeS('
                  SELECT p.id_simpleblog_post
                    FROM `' . _DB_PREFIX_ . 'simpleblog_post` p
                    LEFT JOIN `' . _DB_PREFIX_ . 'simpleblog_post_lang` pl
                    ON p.`id_simpleblog_post` = pl.`id_simpleblog_post`
                    LEFT JOIN `' . _DB_PREFIX_ . 'simpleblog_post_shop` ps
                    ON p.`id_simpleblog_post` = ps.`id_simpleblog_post`
                    LEFT OUTER JOIN `' . _DB_PREFIX_ . 'simpleblog_post_tag` pt
                    ON p.`id_simpleblog_post` = pt.`id_simpleblog_post`
                    LEFT OUTER JOIN `' . _DB_PREFIX_ . 'simpleblog_tag` t
                    ON pt.`id_simpleblog_tag` = t.`id_simpleblog_tag`
                    AND t.`id_lang` = ' . (int) $context->language->id . '
                    WHERE (pl.`title` LIKE \'%' . $sql_param_search . '\'
                    OR t.`name` LIKE \'%' . $sql_param_search . '\')
                    AND `active` = 1
                    AND pl.`id_lang` = ' . (int) $context->language->id . '
                    AND ps.`id_shop` = ' . (int) $context->shop->id . '
                    GROUP BY p.`id_simpleblog_post`
                    ORDER BY p.`date_add` DESC
                ');

        foreach ($result as $select) {
            foreach ($select as $post) {
                $posts[$post['id_simpleblog_post']] = $post['id_simpleblog_post'];
            }
        }

        if (!empty($posts)) {
            $posts = SimpleBlogPost::getPosts($context->language->id, 10, null, null, true, 'sbp.date_add', 'DESC', null, false, false, null, 'IN', $posts);

            $results = [];
            foreach ($posts as $item) {
                $product = [
                    'id' => (int) $item['id_simpleblog_post'],
                    'name' => $item['title'],
                    'ref' => '',
                    'image' => (isset($item['banner_thumb'])) ? $item['banner_thumb'] : '',
                ];
                array_push($results, $product);
            }
            $results = array_values($results);

            exit(json_encode($results));
        } else {
            exit(json_encode(new stdClass()));
        }
    }

    // ---------------------------------------------------------------
    //  Widget Styles Library
    // ---------------------------------------------------------------

    /**
     * Return all saved widget styles for the current shop.
     */
    public function ajaxProcessGetWidgetStyles(): void
    {
        exit(json_encode(['success' => true, 'data' => $this->loadWidgetStyles()]));
    }

    /**
     * Save a named widget style.
     * First style for a widget type is automatically set as default.
     */
    public function ajaxProcessSaveWidgetStyle(): void
    {
        $widgetType = Tools::getValue('widget_type');
        $name = Tools::getValue('name');
        $settings = Tools::getValue('settings');

        if (!$widgetType || !$name || !$settings) {
            exit(json_encode(['success' => false, 'data' => 'Missing parameters']));
        }

        $idShop = (int) $this->context->shop->id;
        $now = date('Y-m-d H:i:s');

        // Check if this is the first style for this widget type → auto-default
        $existing = Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'iqit_elementor_widget_style`'
            . ' WHERE `id_shop` = ' . $idShop
            . ' AND `widget_type` = \'' . pSQL($widgetType) . '\''
        );
        $isDefault = ((int) $existing === 0) ? 1 : 0;

        $result = Db::getInstance()->insert('iqit_elementor_widget_style', [
            'id_shop' => $idShop,
            'widget_type' => pSQL($widgetType),
            'name' => pSQL($name),
            'settings' => pSQL($settings, true),
            'is_default' => $isDefault,
            'date_add' => $now,
            'date_upd' => $now,
        ]);

        $insertId = (int) Db::getInstance()->Insert_ID();

        exit(json_encode([
            'success' => (bool) $result,
            'data' => [
                'id_widget_style' => $insertId,
                'widget_type' => $widgetType,
                'name' => $name,
                'is_default' => $isDefault,
                'export_link' => $this->context->link->getAdminLink($this->name, true)
                    . '&ajax=1&action=ExportWidgetStyle&id_widget_style=' . $insertId,
            ],
        ]));
    }

    /**
     * Delete a widget style by ID.
     */
    public function ajaxProcessDeleteWidgetStyle(): void
    {
        $id = (int) Tools::getValue('id_widget_style');

        if (!$id) {
            exit(json_encode(['success' => false, 'data' => 'Missing id']));
        }

        $idShop = (int) $this->context->shop->id;

        $result = Db::getInstance()->delete(
            'iqit_elementor_widget_style',
            '`id_widget_style` = ' . $id . ' AND `id_shop` = ' . $idShop
        );

        exit(json_encode(['success' => (bool) $result]));
    }

    /**
     * Toggle a widget style as the default for its widget type.
     * Only one default per widget_type per shop.
     */
    public function ajaxProcessSetWidgetStyleDefault(): void
    {
        $id = (int) Tools::getValue('id_widget_style');

        if (!$id) {
            exit(json_encode(['success' => false, 'data' => 'Missing id']));
        }

        $idShop = (int) $this->context->shop->id;
        $db = Db::getInstance();
        $table = _DB_PREFIX_ . 'iqit_elementor_widget_style';

        // Get the widget_type for this style
        $row = $db->getRow(
            'SELECT `widget_type`, `is_default` FROM `' . bqSQL($table) . '`'
            . ' WHERE `id_widget_style` = ' . $id . ' AND `id_shop` = ' . $idShop
        );

        if (!$row) {
            exit(json_encode(['success' => false, 'data' => 'Style not found']));
        }

        $widgetType = $row['widget_type'];
        $wasDefault = (int) $row['is_default'];

        // Reset all defaults for this widget type
        $db->execute(
            'UPDATE `' . bqSQL($table) . '` SET `is_default` = 0'
            . ' WHERE `id_shop` = ' . $idShop
            . ' AND `widget_type` = \'' . pSQL($widgetType) . '\''
        );

        // Toggle: if it was already default, leave it unset; otherwise set it
        $newDefault = $wasDefault ? 0 : 1;

        if ($newDefault) {
            $db->execute(
                'UPDATE `' . bqSQL($table) . '` SET `is_default` = 1'
                . ' WHERE `id_widget_style` = ' . $id
            );
        }

        exit(json_encode(['success' => true, 'data' => ['is_default' => $newDefault]]));
    }

    /**
     * Export a widget style as a JSON file download.
     */
    public function ajaxProcessExportWidgetStyle(): void
    {
        $id = (int) Tools::getValue('id_widget_style');
        $idShop = (int) $this->context->shop->id;

        $row = Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . 'iqit_elementor_widget_style`'
            . ' WHERE `id_widget_style` = ' . $id . ' AND `id_shop` = ' . $idShop
        );

        if (!$row) {
            exit;
        }

        $content = [
            'name' => $row['name'],
            'widget_type' => $row['widget_type'],
            'settings' => $row['settings'],
        ];

        header('Content-disposition: attachment; filename=iqitelementor_style_' . $id . '.json');
        header('Content-type: application/json');
        echo json_encode($content);
        exit;
    }

    /**
     * Import a widget style from an uploaded JSON file.
     */
    public function ajaxProcessImportWidgetStyle(): void
    {
        header('Content-Type: application/json');

        $error = [
            'error' => true,
            'data' => ['message' => $this->module->getTranslator()->trans('Problem with file', [], 'Modules.Iqitelementor.Admin')],
        ];

        if (!isset($_FILES['file'], $_FILES['file']['tmp_name'])) {
            exit(json_encode($error));
        }

        $source = json_decode(Tools::file_get_contents($_FILES['file']['tmp_name']), true);

        if (!$source || !isset($source['name'], $source['widget_type'], $source['settings'])) {
            exit(json_encode($error));
        }

        $idShop = (int) $this->context->shop->id;
        $now = date('Y-m-d H:i:s');
        $settings = is_string($source['settings']) ? $source['settings'] : json_encode($source['settings']);

        // Check first style → auto default
        $existing = Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'iqit_elementor_widget_style`'
            . ' WHERE `id_shop` = ' . $idShop
            . ' AND `widget_type` = \'' . pSQL($source['widget_type']) . '\''
        );
        $isDefault = ((int) $existing === 0) ? 1 : 0;

        Db::getInstance()->insert('iqit_elementor_widget_style', [
            'id_shop' => $idShop,
            'widget_type' => pSQL($source['widget_type']),
            'name' => pSQL($source['name']),
            'settings' => pSQL($settings, true),
            'is_default' => $isDefault,
            'date_add' => $now,
            'date_upd' => $now,
        ]);

        $insertId = (int) Db::getInstance()->Insert_ID();

        exit(json_encode([
            'success' => true,
            'data' => [
                'id_widget_style' => $insertId,
                'widget_type' => $source['widget_type'],
                'name' => $source['name'],
                'is_default' => $isDefault,
                'export_link' => $this->context->link->getAdminLink($this->name, true)
                    . '&ajax=1&action=ExportWidgetStyle&id_widget_style=' . $insertId,
            ],
        ]));
    }

    public function getTemplatePreviewLink($templateId): string
    {
        return $previewLink = $this->context->link->getModuleLink('iqitelementor', 'Preview', [
            'iqit_fronteditor_token' => $this->module->getFrontEditorToken(),
            'admin_webpath' => $this->context->controller->admin_webpath,
            'template_id' => $templateId,
            'id_employee' => is_object($this->context->employee) ? (int) $this->context->employee->id
                : Tools::getValue('id_employee'),
        ], true);
    }

    public static function getJsonValue($key, $default_value = false)
    {
        if (!isset($key) || empty($key) || !is_string($key)) {
            return false;
        }

        if (getenv('kernel.environment') === 'test' && self::$request instanceof Request) {
            $value = self::$request->request->get($key, self::$request->query->get($key, $default_value));
        } else {
            $value = (isset($_POST[$key]) ? $_POST[$key] : (isset($_GET[$key]) ? $_GET[$key] : $default_value));
        }

        if (is_string($value)) {
            return urldecode(preg_replace('/((\%5C0+)|(\%00+))/i', '', urlencode($value)));
        }

        return $value;
    }

    /**
     * Load all saved widget styles for the current shop.
     *
     * @return array List of style records
     */
    private function loadWidgetStyles(): array
    {
        $idShop = (int) $this->context->shop->id;
        $tableName = _DB_PREFIX_ . 'iqit_elementor_widget_style';

        try {
            $rows = Db::getInstance()->executeS(
                'SELECT `id_widget_style`, `widget_type`, `name`, `settings`, `is_default`'
                . ' FROM `' . bqSQL($tableName) . '`'
                . ' WHERE `id_shop` = ' . $idShop
                . ' ORDER BY `widget_type`, `name`'
            );
        } catch (\Exception $e) {
            return [];
        }

        if (!$rows) {
            return [];
        }

        $styles = [];
        foreach ($rows as $row) {
            $decoded = json_decode($row['settings'], true);
            $styles[] = [
                'id_widget_style' => (int) $row['id_widget_style'],
                'widget_type' => $row['widget_type'],
                'name' => $row['name'],
                'settings' => is_array($decoded) ? $decoded : [],
                'is_default' => (int) $row['is_default'],
                'export_link' => $this->context->link->getAdminLink($this->name, true)
                    . '&ajax=1&action=ExportWidgetStyle&id_widget_style=' . (int) $row['id_widget_style'],
            ];
        }

        return $styles;
    }

    /**
     * Resolve the native revisions table primary key from the editor's pageId.
     *
     * Delegated to the matching EditorTargetInterface when one is registered
     * for `$entityType`. Types with no registered target (e.g. 'template')
     * fall back to using the pageId as-is.
     *
     * @return int Resolved entity ID, or 0 if not found
     */
    private function resolveEntityId(string $entityType, int $pageId): int
    {
        $target = EditorTargetRegistry::get($entityType);
        if ($target !== null) {
            return $target->resolveRevisionEntityId($pageId, (string) Tools::getValue('content_type'));
        }

        return $pageId;
    }
}
