<?php

namespace Elementor; // ➜ adapte si ta version utilise un autre namespace

defined('_PS_VERSION_') or exit;

/**
 * Shortcode widget pour ta version d'Elementor.
 */
class Widget_Shortcode extends Widget_Base
{

    /**
     * Identifiant technique du widget.
     */
    public function get_id()
    {
        return 'shortcode';
    }

    /**
     * Titre affiché dans la liste des widgets.
     */
    public function get_title()
    {
        // Remplace par ton helper de traduction si tu en as un ($this->l(), etc.)
        return \IqitElementorWpHelper::__('Shortcode');
    }

    /**
     * Icône dans le panneau Elementor.
     */
    public function get_icon()
    {
        return 'shortcode';
    }

    /**
     * Mots-clés pour la recherche de widget.
     */
    public function get_keywords()
    {
        return ['shortcode', 'code', 'hook'];
    }

    /**
     * Enregistre les contrôles du widget.
     *
     * (Nouvelle signature : register_controls() au lieu de _registerControls())
     */
    protected function _register_controls()
    {
        $this->start_controls_section(
            'section_shortcode',
            [
                'label' => \IqitElementorWpHelper::__('Shortcode'),
            ]
        );

        $this->add_control(
            'shortcode',
            [
                'label' => \IqitElementorWpHelper::__('Enter your shortcode'),
                'type' => Controls_Manager::TEXTAREA, // ou Controls_Manager selon ta version
                'dynamic' => [
                    'active' => true,
                ],
                'placeholder' => "{hook h='displayShortcode'}",
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Rendu frontend (éditeur / live).
     * @param array $instance
     */
    public function render($instance = [])
    {
        $shortcode = $instance['shortcode'] ?? '';
        echo \Context::getContext()->smarty->fetch('string:' . $shortcode);
    }
}