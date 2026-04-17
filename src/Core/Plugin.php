<?php

namespace IqitElementor\Core;

use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Manager\ElementManager;
use IqitElementor\Manager\WidgetManager;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

/**
 * Main class plugin
 */
class Plugin
{
    /** @var self|null */
    private static $instance;

    /** @var ControlManager */
    public $controlsManager;

    /** @var ElementManager */
    public $elementsManager;

    /** @var WidgetManager */
    public $widgetsManager;

    /** @var Editor */
    public $editor;

    /** @var Frontend|null */
    public $frontend;

    /**
     * Disable unserializing of the class
     */
    public function __wakeup(): void
    {
        // Unserializing instances of the class is forbidden
        Helper::doingItWrong(__FUNCTION__, Translater::get()->l('Cheatin&#8217; huh?'), '1.0.0');
    }

    public static function instance(): self
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function getCurrentIntroduction(): array
    {
        return [
            'active' => true,
            'title' => '<div id="elementor-introduction-title">'
                . Translater::get()->l('Two Minute Tour Of Elementor')
                . '</div><div id="elementor-introduction-subtitle">'
                . Translater::get()->l('Watch this quick tour that gives you a basic understanding of how to use Elementor.')
                . '</div>',
            'content' => '<div class="elementor-video-wrapper"><iframe src="https://www.youtube.com/embed/6u45V2q1s4k?autoplay=1&rel=0&showinfo=0" frameborder="0" allowfullscreen></iframe></div>',
            'delay' => 2500,
            'version' => 1,
        ];
    }

    public function getFrontend(?array $data): void
    {
        $this->frontend = new Frontend($data);
    }

    private function __construct()
    {
        self::$instance = $this;

        $this->controlsManager = new ControlManager();
        $this->elementsManager = new ElementManager();
        $this->widgetsManager = new WidgetManager();
        $this->editor = new Editor();
    }
}
