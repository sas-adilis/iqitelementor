<?php

namespace IqitElementor\Widget;

use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Plugin;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class TocAnchor extends WidgetBase
{
    public function getId(): string
    {
        return 'toc-anchor';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Content Anchor');
    }

    public function getIcon(): string
    {
        return 'anchor';
    }

    protected function registerControls(): void
    {
        $this->startControlsSection(
            'section_anchor',
            [
                'label' => Translater::get()->l('Content Anchor'),
            ]
        );

        $this->addControl(
            'toc_title',
            [
                'label' => Translater::get()->l('Title'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => Translater::get()->l('Section title displayed in the Table of Contents'),
                'description' => Translater::get()->l('This label will appear in the Table of Contents widget.'),
                'label_block' => true,
            ]
        );

        $this->addControl(
            'anchor_id',
            [
                'label' => Translater::get()->l('Custom ID'),
                'type' => ControlManager::TEXT,
                'default' => '',
                'placeholder' => Translater::get()->l('Auto-generated from title if left empty'),
                'description' => Translater::get()->l('Leave empty to auto-generate. Allowed chars: A-Z, a-z, 0-9, _, -. Must be unique on the page.'),
                'label_block' => true,
            ]
        );

        $this->endControlsSection();
    }

    public function parseOptions(array $optionsSource, bool $preview = false): array
    {
        $title = isset($optionsSource['toc_title']) ? trim((string) $optionsSource['toc_title']) : '';
        $rawId = isset($optionsSource['anchor_id']) ? trim((string) $optionsSource['anchor_id']) : '';

        $anchorId = $rawId !== ''
            ? preg_replace('/[^A-Za-z0-9_-]/', '', $rawId)
            : \Tools::str2url($title);

        if ($anchorId === '' && $title !== '') {
            $anchorId = 'toc-anchor-' . substr(md5($title), 0, 8);
        }

        return [
            'toc_title' => $title,
            'anchor_id' => $anchorId,
        ];
    }

    protected function render(array $instance = []): void
    {
        $parsed = $this->parseOptions($instance);
        $title = isset($parsed['toc_title']) ? (string) $parsed['toc_title'] : '';
        $anchorId = isset($parsed['anchor_id']) ? (string) $parsed['anchor_id'] : '';

        if ($title === '' || $anchorId === '') {
            if (Plugin::instance()->editor->isEditMode()) {
                echo '<div class="elementor-toc-anchor elementor-toc-anchor--placeholder">'
                    . htmlspecialchars(Translater::get()->l('Content Anchor — set a title'), ENT_QUOTES, 'UTF-8')
                    . '</div>';
            }
            return;
        }

        $idAttr = Helper::escAttr($anchorId);
        $titleAttr = Helper::escAttr($title);

        if (Plugin::instance()->editor->isEditMode()) {
            echo '<div class="elementor-toc-anchor elementor-toc-anchor--editor"'
                . ' id="' . $idAttr . '"'
                . ' data-toc-title="' . $titleAttr . '">'
                . '<i class="fa fa-anchor" aria-hidden="true"></i> '
                . htmlspecialchars($title, ENT_QUOTES, 'UTF-8')
                . ' <span class="elementor-toc-anchor__id">#' . $idAttr . '</span>'
                . '</div>';
            return;
        }

        echo '<div class="elementor-toc-anchor"'
            . ' id="' . $idAttr . '"'
            . ' data-toc-title="' . $titleAttr . '"'
            . ' aria-hidden="true"></div>';
    }

    protected function contentTemplate(): void
    {
        ?>
        <# var title = (settings.toc_title || '').toString().trim(); #>
        <# var rawId = (settings.anchor_id || '').toString().trim(); #>
        <# var anchorId = rawId ? rawId.replace(/[^A-Za-z0-9_-]/g, '') : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); #>
        <# if (!title || !anchorId) { #>
            <div class="elementor-toc-anchor elementor-toc-anchor--placeholder">
                <?php echo htmlspecialchars(Translater::get()->l('Content Anchor — set a title'), ENT_QUOTES, 'UTF-8'); ?>
            </div>
        <# } else { #>
            <div class="elementor-toc-anchor elementor-toc-anchor--editor" id="{{ anchorId }}" data-toc-title="{{ title }}">
                <i class="fa fa-anchor" aria-hidden="true"></i> {{{ title }}} <span class="elementor-toc-anchor__id">#{{ anchorId }}</span>
            </div>
        <# } #>
        <?php
    }
}
