<?php

use IqitElementor\Core\Plugin;
use IqitElementor\Helper\OutputHelper;

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorLandingModuleFrontController extends ModuleFrontController
{
    /** @var IqitElementorLanding */
    private $landing;

    public function setMedia()
    {
        parent::setMedia();
        $this->module->registerCssFiles();
        $this->module->registerJSFiles();
    }

    public function init()
    {
        parent::init();

        $rewrite = Tools::getValue('rewrite');
        if (!$rewrite) {
            Tools::redirect('index.php?controller=404');
        }

        $idLang = (int) $this->context->language->id;
        $idShop = (int) $this->context->shop->id;
        $idLanding = IqitElementorLanding::getIdByRewrite($rewrite, $idLang, $idShop);

        if (!$idLanding) {
            Tools::redirect('index.php?controller=404');
        }

        $this->landing = new IqitElementorLanding($idLanding, $idLang);

        if (!Validate::isLoadedObject($this->landing) || !$this->landing->active) {
            Tools::redirect('index.php?controller=404');
        }

        // 301 redirect to homepage if this landing is the active HP layout
        if ($this->landing->isHomepage()) {
            $homeUrl = $this->context->link->getPageLink('index', true);
            header('HTTP/1.1 301 Moved Permanently');
            header('Location: ' . $homeUrl);
            exit;
        }
    }

    public function initContent()
    {
        parent::initContent();

        $rawData = $this->module->isPreviewMode() && !empty($this->landing->autosave_content)
            ? $this->landing->autosave_content
            : $this->landing->data;
        $layoutData = (array) json_decode($rawData, true);
        $content = OutputHelper::capture(function () use ($layoutData) {
            Plugin::instance()->getFrontend($layoutData);
        });

        $this->context->smarty->assign([
            'content' => $content,
            'landing' => $this->landing,
        ]);

        $this->setTemplate('module:iqitelementor/views/templates/front/landing.tpl');
    }

    public function getTemplateVarPage()
    {
        $page = parent::getTemplateVarPage();

        $idLang = (int) $this->context->language->id;

        // SEO meta
        $metaTitle = is_array($this->landing->meta_title)
            ? $this->landing->meta_title[$idLang]
            : $this->landing->meta_title;
        $metaDescription = is_array($this->landing->meta_description)
            ? $this->landing->meta_description[$idLang]
            : $this->landing->meta_description;

        if ($metaTitle) {
            $page['meta']['title'] = $metaTitle;
        } elseif ($this->landing->title) {
            $page['meta']['title'] = $this->landing->title;
        }

        if ($metaDescription) {
            $page['meta']['description'] = $metaDescription;
        }

        $page['body_classes']['elementor-body'] = true;
        $page['body_classes']['elementor-landing-body'] = true;

        return $page;
    }

    public function getCanonicalURL()
    {
        return $this->landing->getLink((int) $this->context->language->id);
    }
}
