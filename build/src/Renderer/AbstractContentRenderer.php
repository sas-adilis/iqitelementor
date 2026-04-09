<?php

namespace IqitElementor\Renderer;

use IqitElementor\Contract\ContentRendererInterface;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\OutputHelper;

abstract class AbstractContentRenderer implements ContentRendererInterface
{
    /** @var \Context */
    protected $context;

    public function __construct(\Context $context)
    {
        $this->context = $context;
    }

    /**
     * Render an already-decoded Elementor layout array through the frontend engine.
     */
    protected function renderFrontend(array $layoutData): string
    {
        return OutputHelper::capture(function () use ($layoutData) {
            Plugin::instance()->getFrontend($layoutData);
        });
    }

    /**
     * Resolve raw JSON from a layout object (with preview/autosave support) and render.
     *
     * @param \ObjectModel $layout Layout with `data` and `autosave_content` properties
     */
    protected function resolveAndRender($layout, bool $previewMode): string
    {
        $rawData = $previewMode && !empty($layout->autosave_content)
            ? (string) $layout->autosave_content
            : (string) $layout->data;
        $layoutData = (array) json_decode($rawData, true);

        return $this->renderFrontend($layoutData);
    }
}
