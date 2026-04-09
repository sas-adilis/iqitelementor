<?php

namespace IqitElementor\Manager;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\OutputHelper;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class WidgetManager
{
    /**
     * @var WidgetBase[]|null
     */
    protected $registeredWidgets;

    private function initWidgets(): void
    {
        $widget_map = [
            'heading' => 'Heading',
            'image' => 'Image',
            'text-editor' => 'TextEditor',
            'video' => 'Video',
            'button' => 'Button',
            'call-to-action' => 'CallToAction',
            'divider' => 'Divider',
            'countdown' => 'Countdown',
            'spacer' => 'Spacer',
            'image-box' => 'ImageBox',
            // 'google-maps' => 'GoogleMaps',
            'menu-anchor' => 'MenuAnchor',
            'icon' => 'Icon',
            'icon-box' => 'IconBox',
            // 'image-gallery' => 'ImageGallery',
            'image-carousel' => 'ImageCarousel',
            'image-hotspots' => 'ImageHotspots',
            'icon-list' => 'IconList',
            'counter' => 'Counter',
            // 'progress' => 'Progress',
            'testimonial' => 'Testimonial',
            'tabs' => 'Tabs',
            'accordion' => 'Accordion',
            // 'toggle' => 'Toggle',
            // 'social-icons' => 'SocialIcons',
            'alert' => 'Alert',
            'html' => 'Html',
            'brands' => 'Brands',
            'prestashop-module' => 'PrestashopModule',
            'shortcode' => 'Shortcode',
            'media-carousel' => 'MediaCarousel',
            'product-carousel' => 'ProductCarousel',
            'table-of-contents' => 'TableOfContents',
        ];

        $this->registeredWidgets = [];
        foreach ($widget_map as $widget_id => $class_name) {
            $this->registerWidget('IqitElementor\\Widget\\' . $class_name);
        }

        \Hook::exec('actionRegisterElementorWidgets', ['widgets_manager' => $this]);
    }

    /**
     * @throws \PrestaShopException
     */
    public function registerWidget(string $widget_class, array $args = []): bool
    {
        if (!class_exists($widget_class)) {
            throw new \PrestaShopException(sprintf('Widget class not found: %s', $widget_class));
        }

        $widget_instance = new $widget_class($args);

        if (!$widget_instance instanceof WidgetBase) {
            throw new \PrestaShopException(sprintf('Widget class must extend WidgetBase: %s', $widget_class));
        }
        $this->registeredWidgets[$widget_instance->getId()] = $widget_instance;

        return true;
    }

    /**
     * @return WidgetBase[]
     */
    public function getRegisteredWidgets(): array
    {
        if (is_null($this->registeredWidgets)) {
            $this->initWidgets();
        }

        return $this->registeredWidgets;
    }

    /**
     * @return WidgetBase|false
     */
    public function getWidget(string $id)
    {
        $widgets = $this->getRegisteredWidgets();

        if (!isset($widgets[$id])) {
            return false;
        }

        return $widgets[$id];
    }

    public function getRegisteredWidgetsData(): array
    {
        $data = [];
        foreach ($this->getRegisteredWidgets() as $widget) {
            $data[$widget->getId()] = $widget->getData();
        }

        return $data;
    }

    public function ajaxRenderWidget(): void
    {
        $rawData = \Tools::getValue('data', '');
        $data = json_decode(html_entity_decode($rawData), true);
        $render_html = OutputHelper::capture(function () use ($data) {
            $widget = $this->getWidget($data['widgetType']);
            if (false !== $widget) {
                $data['settings'] = $widget->getParseValues($data['settings']);
                $widget->renderContent($data['settings']);
            }
        });

        Helper::sendJsonSuccess(
            [
                'render' => $render_html,
            ]
        );
    }

    public function renderWidgetsContent(): void
    {
        foreach ($this->getRegisteredWidgets() as $widget) {
            $widget->printTemplate();
        }
    }
}
