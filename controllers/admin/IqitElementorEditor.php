<?php
use Elementor\PluginElementor;
use Elementor\Responsive;

if (!defined('_PS_VERSION_')) {
    exit;
}

require_once _PS_MODULE_DIR_ . '/iqitelementor/src/IqitElementorHelper.php';
require_once dirname(__FILE__) . '/../../includes/plugin-elementor.php';

class IqitElementorEditorController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        $this->display_header = false;
        parent::__construct();
        if (!$this->module->active) {
            Tools::redirectAdmin($this->context->link->getAdminLink('AdminHome'));
        }
        $this->name = 'IqitElementorEditor';
    }

    public function renderView()
    {
    }

    public function initContent()
    {
        $this->setMedia();
        $this->initHeader();

        ob_start();
        PluginElementor::instance()->editor->print_panel_html();
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

        switch ($pageType) {
            case 'landing':
                $editedPage = new IqitElementorLanding($pageId, $idLang);
                $editedPageLink = $this->context->link->getAdminLink('AdminIqitElementor') . '&id_page=' . $pageId . '&updateiqit_elementor_landing';
                $elementorData = json_decode($editedPage->data, true);
                break;
            case 'cms':
                $editedPage = new CMS($pageId, $idLang);
                $editedPageLink = $this->context->link->getAdminLink('AdminCmsContent') . '&id_cms=' . $pageId . '&updatecms';

                $strippedCms = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $editedPage->content);
                $strippedCms = str_replace(["\r", "\n"], '', $strippedCms);
                $content = json_decode($strippedCms, true);

                if (json_last_error() == JSON_ERROR_NONE) {
                    $elementorData = $content;
                }
                break;
            case 'blog':
                $editedPage = new SimpleBlogPost($pageId, $idLang);
                $editedPageLink = $this->context->link->getAdminLink('AdminSimpleBlogPosts') . '&id_simpleblog_post=' . $pageId . '&updatesimpleblog_post';

                $strippedCms = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $editedPage->content);
                $strippedCms = str_replace(["\r", "\n"], '', $strippedCms);
                $content = json_decode($strippedCms, true);

                if (json_last_error() == JSON_ERROR_NONE) {
                    $elementorData = $content;
                }
                break;
            case 'category':
                $id = IqitElementorCategory::getIdByCategory($pageId);

                if ($id) {
                    $editedPage = new IqitElementorCategory($id, $idLang);
                } else {
                    $editedPage = new IqitElementorCategory();
                }

                $editedPageLink = $this->context->link->getAdminLink('AdminCategories') . '&id_category=' . $pageId . '&updatecategory=1';
                $elementorData = json_decode($editedPage->data, true);
                break;
            case 'content':
                if ($contentType == 'brand') {
                    $hookId = Hook::getIdByName('displayManufacturerElementor');
                    $id = IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);

                    if ($id) {
                        $editedPage = new IqitElementorContent($id, $idLang);
                    } else {
                        $editedPage = new IqitElementorContent();
                    }

                    $editedPageLink = $this->context->link->getAdminLink('AdminManufacturers') . '&id_manufacturer=' . $pageId . '&updatemanufacturer=1';
                    $elementorData = json_decode($editedPage->data, true);
                } else {
                    $editedPage = new IqitElementorContent($pageId, $idLang);
                    $editedPageLink = $this->context->link->getAdminLink('AdminIqitElementorContent') . '&id_elementor=' . $pageId . '&updateiqit_elementor_content';
                    $elementorData = json_decode($editedPage->data, true);
                }
                break;
            case 'product':
                $id = IqitElementorProduct::getIdByProduct($pageId);

                if ($id) {
                    $editedPage = new IqitElementorProduct($id, $idLang);
                } else {
                    $editedPage = new IqitElementorProduct();
                }

                $editedPageLink = $this->context->link->getAdminLink('AdminProducts') . '&id_product=' . $pageId . '&addproduct=1';
                $elementorData = json_decode($editedPage->data, true);
                break;
        }

        if (!isset($editedPageLink)) {
            // redirect to dashboard if something wrong
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
                'ajaxurl' => $this->context->link->getAdminLink('IqitElementorEditor') . '&ajax=1',
                'ajaxFrontUrl' => Context::getContext()->link->getModuleLink('iqitelementor', 'Widget', [
                    'iqit_fronteditor_token' => $this->module->getFrontEditorToken(),
                    'id_employee' => is_object(Context::getContext()->employee) ? (int) Context::getContext()->employee->id
                        : Tools::getValue('id_employee'),
                    'ajax' => 1,
                    'action' => 'widgetPreview',
                ], true),
                'preview_link' => $previewLink,
                'elements_categories' => PluginElementor::instance()->elements_manager->get_categories(),
                'controls' => PluginElementor::instance()->controls_manager->get_controls_data(),
                'elements' => PluginElementor::instance()->elements_manager->get_register_elements_data(),
                'widgets' => PluginElementor::instance()->widgets_manager->get_registered_widgets_data(),
                'schemes' => [
                    'items' => PluginElementor::instance()->schemes_manager->get_registered_schemes_data(),
                    'enabled_schemes' => [],
                ],
                'default_schemes' => PluginElementor::instance()->schemes_manager->get_schemes_defaults(),
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
                'is_rtl' => (bool) $this->context->language->is_rtl,
                'introduction' => PluginElementor::instance()->get_current_introduction(),
                'viewportBreakpoints' => Responsive::get_breakpoints(),
                'i18n' => [
                    'elementor' => $this->module->getTranslator()->trans('Elementor', [], 'Modules.Iqitelementor.Admin'),
                    'dialog_confirm_delete' => $this->module->getTranslator()->trans('Are you sure you want to remove this?', [], 'Modules.Iqitelementor.Admin') . ' {0}',
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

        /*$this->addCSS([
            _PS_JS_DIR_ . 'jquery/plugins/timepicker/jquery-ui-timepicker-addon.css',
        ]);*/

        $this->addCSS([
            __PS_BASE_URI__ . $this->admin_webpath . '/themes/' . $this->bo_theme . '/css/admin-theme.css',
            __PS_BASE_URI__ . $this->admin_webpath . '/themes/' . $this->bo_theme . '/public/theme.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/font-awesome/css/font-awesome.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/select2/css/select2.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/eicons/css/elementor-icons.css',
            _MODULE_DIR_ . 'iqitelementor/views/lib/color-picker/color-picker.min.css',
            _MODULE_DIR_ . 'iqitelementor/views/css/editor.css',
        ]);

        $this->addJS([
            _PS_JS_DIR_ . 'jquery/plugins/timepicker/jquery-ui-timepicker-addon.js',
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
            _MODULE_DIR_ . 'iqitelementor/views/lib/instagram-lite-master/instagramLite.min.js',
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
            _MODULE_DIR_ . 'iqitelementor/views/js/navigator.js?ver=0.9.3',
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
                'is_rtl' => (bool) $this->context->language->is_rtl,
                'instagramToken' => Configuration::get('iqit_elementor_inst_token'),
                'ajax_csfr_token_url' => $this->context->link->getModuleLink($this->module->name, 'Actions', ['process' => 'handleCsfrToken', 'ajax' => 1], true),
                'iqitBaseUrl' => Tools::safeOutput($base_url),
                'iqitElementorColorPalette' => IqitElementorHelper::stringToArrayOfColors(Configuration::get('IQIT_ELEMENT_COLORS')),
            ],
            'dateTimePickerL10n' => [
                'currentText' => $this->l('Now'),
                'closeText' => $this->l('Done'),
                'timeOnlyTitle' => $this->l('Choose Time'),
                'timeText' => $this->l('Time'),
                'hourText' => $this->l('Hour'),
                'minuteText' => $this->l('Minute'),
            ]
        ]);

        Hook::exec('actionAdminControllerSetMedia');
    }

    public function display()
    {
    }

    public function ajaxProcessRenderWidget()
    {
        PluginElementor::instance()->widgets_manager->ajax_render_widget();
        exit;
    }

    public function ajaxProcessSaveEditor()
    {
        header('Content-Type: application/json');

        $pageId = (int) Tools::getValue('page_id');
        $pageType = Tools::getValue('page_type');
        $contentType = Tools::getValue('content_type');
        $newContent = Tools::getValue('new_content');
        $data = $this->getJsonValue('data');
        $idLang = (int) Tools::getValue('id_lang');

        switch ($pageType) {
            case 'landing':
                $landing = new IqitElementorLanding($pageId, $idLang);
                $landing->data = $data;
                $landing->update();
                $this->module->clearHomeCache();
                break;
            case 'cms':
                if ($data == '[]') {
                    $data = '';
                }
                $cms = new CMS($pageId);
                $cms->content[$idLang] = $data;
                $cms->update();
                break;
            case 'blog':
                $blogPost = new SimpleBlogPost($pageId);
                $blogPost->content[$idLang] = $data;
                $blogPost->update();
                break;
            case 'category':
                $id = IqitElementorCategory::getIdByCategory($pageId);
                if ($id) {
                    $category = new IqitElementorCategory($id);
                    $category->data[$idLang] = $data;
                    $category->update();
                } else {
                    $category = new IqitElementorCategory(null);
                    $category->id_category = (int) $pageId;
                    $category->data = '';
                    $add = $category->add();

                    if ($add) {
                        $categoryNew = new IqitElementorCategory($category->id, $idLang);
                        $categoryNew->data = $data;
                        $categoryNew->update();
                    }
                }
                $this->module->clearCategoryCache($pageId);
                break;
            case 'content':
                if ($contentType == 'brand') {
                    $hookId = Hook::getIdByName('displayManufacturerElementor');
                    $id = IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);
                    if ($id) {
                        $landing = new IqitElementorContent($id);
                        $landing->data[$idLang] = $data;
                        $landing->update();
                    } else {
                        $landing = new IqitElementorContent(null);
                        $landing->data = '';
                        $landing->id_object = (int) $pageId;
                        $landing->hook = $hookId;
                        $landing->active = 1;
                        $landing->title = 'brand-' . $pageId;
                        $add = $landing->add();

                        if ($add) {
                            $landingNew = new IqitElementorContent($landing->id, $idLang);
                            $landingNew->data = $data;
                            $landingNew->update();
                        }
                    }
                } else {
                    $landing = new IqitElementorContent($pageId);
                    $landing->data[$idLang] = $data;
                    $landing->update();
                }
                $this->module->clearHookCache($landing->hook);
                break;
            case 'product':
                $id = IqitElementorProduct::getIdByProduct($pageId);
                if ($id) {
                    $product = new IqitElementorProduct($id);
                    $product->data[$idLang] = $data;
                    $product->update();
                } else {
                    $product = new IqitElementorProduct(null);
                    $product->data = '';
                    $product->id_product = (int) $pageId;
                    $add = $product->add();

                    if ($add) {
                        $productNew = new IqitElementorProduct($product->id, $idLang);
                        $productNew->data = $data;
                        $productNew->update();
                    }
                }
                $this->module->clearProductCache($pageId);
                break;
        }

        $return = [
            'success' => true,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessGetLanguageContent()
    {
        header('Content-Type: application/json');

        $pageId = (int) Tools::getValue('page_id');
        $pageType = Tools::getValue('page_type');
        $contentType = Tools::getValue('content_type');
        $idLang = Tools::getValue('id_lang');
        $data = '';

        switch ($pageType) {
            case 'landing':
                $source = new IqitElementorLanding($pageId, $idLang);
                $data = json_decode($source->data, true);
                break;
            case 'cms':
                $source = new CMS($pageId, $idLang);
                $strippedCms = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $source->content);
                $strippedCms = str_replace(["\r", "\n"], '', $strippedCms);
                $content = json_decode($strippedCms, true);

                if (json_last_error() == JSON_ERROR_NONE) {
                    $data = $content;
                }
                break;
            case 'blog':
                $source = new SimpleBlogPost($pageId, $idLang);
                $strippedCms = preg_replace('/^<p[^>]*>(.*)<\/p[^>]*>/is', '$1', $source->content);
                $strippedCms = str_replace(["\r", "\n"], '', $strippedCms);
                $content = json_decode($strippedCms, true);

                if (json_last_error() == JSON_ERROR_NONE) {
                    $data = $content;
                }
                break;
            case 'category':
                $id = IqitElementorCategory::getIdByCategory($pageId);
                if ($id) {
                    $source = new IqitElementorCategory($id, $idLang);
                    $data = json_decode($source->data, true);
                } else {
                    $data = json_decode('', true);
                }
                break;
            case 'content':
                if ($contentType == 'brand') {
                    $hookId = Hook::getIdByName('displayManufacturerElementor');
                    $id = IqitElementorContent::getIdByObjectAndHook($hookId, $pageId);

                    if ($id) {
                        $source = new IqitElementorContent($id, $idLang);
                        $data = json_decode($source->data, true);
                    } else {
                        $data = json_decode('', true);
                    }
                } else {
                    $source = new IqitElementorContent($pageId, $idLang);
                    $data = json_decode($source->data, true);
                }
                break;
            case 'product':
                $id = IqitElementorProduct::getIdByProduct($pageId);
                if ($id) {
                    $source = new IqitElementorProduct($id, $idLang);
                    $data = json_decode($source->data, true);
                } else {
                    $data = json_decode('', true);
                }
                break;
        }

        $return = [
            'success' => true,
            'data' => $data,
        ];

        exit(json_encode($return));
    }

    public function ajaxProcessGetTemplates()
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

    public function ajaxProcessSaveTemplate()
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

    public function ajaxProcessDeleteTemplate()
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

    public function ajaxProcessGetTemplateContent()
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

    public function ajaxProcessExportTemplate()
    {
        $templateId = (int) Tools::getValue('templateId');
        $template = new IqitElementorTemplate($templateId);

        $content = [
            'title' => $template->title,
            'data' => $template->data,
        ];

        header('Content-disposition: attachment; filename=iqitelementor_template_id_' . $template->id . '.json');
        header('Content-type: application/json');
        print_r(json_encode($content));
        exit;
    }

    public function ajaxProcessImportTemplate()
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

    public function ajaxProcessSearchProducts()
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

    public function ajaxProcessGetPosts()
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

    public function ajaxProcessSearchPosts()
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
        $sql_param_search = Search::getSearchParamFromWord($query);
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

    public function getTemplatePreviewLink($templateId)
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
}
