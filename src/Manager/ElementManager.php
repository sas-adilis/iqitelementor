<?php

namespace IqitElementor\Manager;

use IqitElementor\Base\ElementBase;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ElementManager
{
    /**
     * @var ElementBase[]|null
     */
    protected $registeredElements;

    private function initElements(): void
    {
        $this->registeredElements = [];

        $this->registerElement('IqitElementor\\Element\\Column');
        $this->registerElement('IqitElementor\\Element\\Section');
    }

    public function getCategories(): array
    {
        $categories = [];

        foreach (Plugin::instance()->widgetsManager->getRegisteredWidgets() as $widget) {
            foreach ($widget->getCategories() as $title) {
                if (!isset($categories[$title])) {
                    $categories[$title] = ['title' => $title];
                }
            }
        }

        return $categories;
    }

    public function registerElement(string $element_class): bool
    {
        if (!class_exists($element_class)) {
            Helper::triggerError(sprintf('element_class_name_not_exists: %s', $element_class));
        }

        $element_instance = new $element_class();

        if (!$element_instance instanceof ElementBase) {
            Helper::triggerError('wrong_instance_element');
        }

        $this->registeredElements[$element_instance->getId()] = $element_instance;

        return true;
    }

    public function unregisterElement(string $id): bool
    {
        if (!isset($this->registeredElements[$id])) {
            return false;
        }
        unset($this->registeredElements[$id]);

        return true;
    }

    /**
     * @return ElementBase[]
     */
    public function getRegisteredElements(): array
    {
        if (is_null($this->registeredElements)) {
            $this->initElements();
        }

        return $this->registeredElements;
    }

    /**
     * @return ElementBase|false
     */
    public function getElement(string $id)
    {
        $elements = $this->getRegisteredElements();

        if (!isset($elements[$id])) {
            return false;
        }

        return $elements[$id];
    }

    public function getRegisterElementsData(): array
    {
        $data = [];
        foreach ($this->getRegisteredElements() as $element) {
            $data[$element->getId()] = $element->getData();
        }

        return $data;
    }

    public function renderElementsContent(): void
    {
        foreach ($this->getRegisteredElements() as $element) {
            $element->printTemplate();
        }
    }
}
