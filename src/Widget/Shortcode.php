<?php

namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('_PS_VERSION_')) { throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly'); }

/**
 * Shortcode widget pour ta version d'Elementor.
 */
class Shortcode extends WidgetBase
{

    /**
     * Identifiant technique du widget.
     */
    public function getId(): string
    {
        return 'shortcode';
    }

    /**
     * Titre affiché dans la liste des widgets.
     */
    public function getTitle(): string
    {
        // Remplace par ton helper de traduction si tu en as un ($this->l(), etc.)
        return Translater::get()->l('Shortcode');
    }

    /**
     * Icône dans le panneau Elementor.
     */
    public function getIcon(): string
    {
        return 'shortcode';
    }

    /**
     * Mots-clés pour la recherche de widget.
     */
    public function getKeywords(): array
    {
        return ['shortcode', 'code', 'hook'];
    }

    /**
     * Enregistre les contrôles du widget.
     *
     * (Nouvelle signature : registerControls() au lieu de _registerControls())
     */
    protected function registerControls(): void
    {
        $this->startControlsSection(
            'section_shortcode',
            [
                'label' => Translater::get()->l('Shortcode'),
            ]
        );

        $this->addControl(
            'shortcode',
            [
                'label' => Translater::get()->l('Enter your shortcode'),
                'type' => ControlManager::TEXTAREA, // ou Controls_Manager selon ta version
                'dynamic' => [
                    'active' => true,
                ],
                'placeholder' => "{hook h='displayShortcode'}",
            ]
        );

        $this->endControlsSection();
    }

    /**
     * Rendu frontend (éditeur / live).
     */
    public function render(array $instance = []): void
    {
        $shortcode = $instance['shortcode'] ?? '';
        echo \Context::getContext()->smarty->fetch('string:' . $shortcode);
    }
}