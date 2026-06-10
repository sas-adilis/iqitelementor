<?php

namespace IqitElementor\Renderer;

use IqitElementor\Cache\RenderCache;
use IqitElementor\Contract\ContentRendererInterface;
use IqitElementor\Core\Plugin;
use IqitElementor\Helper\FormatDetector;
use IqitElementor\Helper\OutputHelper;
use IqitElementor\Helper\OwnerSignature;

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
        // Owner signature wins: any payload the current module persisted is
        // unambiguously ours. Fall through to legacy detection only when the
        // envelope is absent (legacy bare-array layouts).
        if (!OwnerSignature::hasSignature($decoded) && FormatDetector::isLegacy($decoded)) {
            return '';
        }

        $elements = OwnerSignature::unwrap($decoded);

        return RenderCache::remember($rawJson, function () use ($elements) {
            return OutputHelper::capture(function () use ($elements) {
                Plugin::instance()->getFrontend($elements);
            });
        });
    }

    /**
     * Public entry point to render a single layout object (used by widget-tag
     * rendering where there's no enclosing hook iteration).
     *
     * @param \ObjectModel $layout
     */
    public function renderSingleLayout($layout, bool $previewMode): string
    {
        return $this->resolveAndRender($layout, $previewMode);
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
