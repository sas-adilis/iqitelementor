<?php

namespace IqitElementor\Contract;

/**
 * Contract for front-office content renderers.
 *
 * Each implementation handles a specific hook type (home, CMS, product, etc.)
 * and knows how to load data, resolve templates, and produce rendered HTML.
 */
interface ContentRendererInterface
{
    /**
     * Whether this renderer handles the given hook name.
     */
    public function supports(string $hookName): bool;

    /**
     * Template file name relative to views/templates/hook/.
     */
    public function getTemplateFile(): string;

    /**
     * Render content for the given hook. Returned HTML is already cached
     * at the Elementor level via IqitElementor\Cache\RenderCache, no outer
     * Smarty cache wrapping is needed.
     *
     * @return array{content: string, options: array}
     */
    public function render(string $hookName, array $configuration, bool $previewMode): array;
}
