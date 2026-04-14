<?php

namespace IqitElementor\Renderer;

use IqitElementor\Cache\RenderCache;
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
     * Render an already-decoded Elementor layout array through the frontend
     * engine, wrapped in the content-addressed cache keyed by the raw JSON.
     *
     * @param string $rawJson Raw JSON string (used as cache key).
     * @param array<mixed, mixed> $decoded JSON-decoded layout.
     */
    protected function renderFrontend(string $rawJson, array $decoded): string
    {
        return RenderCache::remember($rawJson, function () use ($decoded) {
            return OutputHelper::capture(function () use ($decoded) {
                Plugin::instance()->getFrontend($decoded);
            });
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

        $decoded = (array) json_decode($rawData, true);

        return $this->renderFrontend($rawData, $decoded);
    }
}
