<?php

namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Trait pour les contrôles avancés (Custom CSS et Custom Attributes)
 *
 * Permet d'ajouter du CSS personnalisé et des attributs HTML sur les éléments.
 */
trait IqitElementorAdvancedControlsTrait
{
    /**
     * Liste noire des attributs non autorisés
     *
     * @var array
     */
    private static $attributes_blacklist = [
        'id',
        'class',
        'data-id',
        'data-settings',
        'data-element_type',
        'data-widget_type',
        'data-model-cid',
    ];

    /**
     * Enregistre les contrôles pour le CSS personnalisé
     *
     * @param string $tab Onglet où ajouter la section
     */
    protected function register_custom_css_controls(string $tab = 'advanced'): void
    {
        $this->start_controls_section(
            '_section_custom_css',
            [
                'label' => \IqitElementorTranslater::get()->l('Custom CSS'),
                'tab' => $tab,
            ]
        );

        $this->add_control(
            '_custom_css_title',
            [
                'raw' => \IqitElementorTranslater::get()->l('Add your own custom CSS here'),
                'type' => Controls_Manager::RAW_HTML,
            ]
        );

        $this->add_control(
            '_custom_css',
            [
                'type' => Controls_Manager::CODE,
                'label' => \IqitElementorTranslater::get()->l('Custom CSS'),
                'language' => 'css',
                'render_type' => 'ui',
                'show_label' => false,
                'separator' => 'none',
                'description' => \IqitElementorTranslater::get()->l('Use "selector" to target wrapper element.'),
            ]
        );

        $this->add_control(
            '_custom_css_description',
            [
                'raw' => '<pre>/* '.\IqitElementorTranslater::get()->l('For main element') . " */\n" .
                    'selector { color: red; }' . "\n/* " .
                    \IqitElementorTranslater::get()->l('For child element') . " */\n" .
                    'selector .child { margin: 10px; }' . '</pre>',
                'type' => Controls_Manager::RAW_HTML,
                'content_classes' => 'elementor-descriptor',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Enregistre les contrôles pour les attributs personnalisés
     *
     * @param string $tab Onglet où ajouter la section
     */
    protected function register_custom_attributes_controls(string $tab = 'advanced'): void
    {
        $this->start_controls_section(
            '_section_custom_attributes',
            [
                'label' => \IqitElementorTranslater::get()->l('Attributes'),
                'tab' => $tab,
            ]
        );

        $this->add_control(
            '_custom_attributes',
            [
                'label' => \IqitElementorTranslater::get()->l('Custom Attributes'),
                'type' => Controls_Manager::TEXTAREA,
                'placeholder' => 'data-custom|value',
                'description' => sprintf(
                    \IqitElementorTranslater::get()->l('Set custom attributes for the wrapper element. Each attribute on a separate line. Separate key from value using %s character.'),
                    '<code>|</code>'
                ),
                'classes' => 'elementor-control-direction-ltr',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Parse les attributs personnalisés depuis une chaîne
     *
     * Format attendu : "key|value" sur chaque ligne
     * Filtre les attributs dangereux (événements JS, href, etc.)
     *
     * @param string $attributes_string Chaîne d'attributs
     * @param string $delimiter Délimiteur entre les attributs (par défaut: nouvelle ligne)
     * @return array Tableau associatif [attribut => valeur]
     */
    protected static function parseCustomAttributes(string $attributes_string, string $delimiter = "\n"): array
    {
        if (empty($attributes_string)) {
            return [];
        }

        $attributes = explode($delimiter, $attributes_string);
        $result = [];

        foreach ($attributes as $attribute) {
            $attribute = trim($attribute);

            if (empty($attribute)) {
                continue;
            }

            $attr_key_value = explode('|', $attribute, 2);
            $attr_key = mb_strtolower(trim($attr_key_value[0]));

            // Nettoie le nom de l'attribut (garde uniquement les caractères valides)
            if (!preg_match('/^[a-z][-_a-z0-9]*$/', $attr_key)) {
                preg_match('/[-_a-z0-9]+/', $attr_key, $attr_key_matches);

                if (empty($attr_key_matches[0])) {
                    continue;
                }

                $attr_key = $attr_key_matches[0];
            }

            // Refuse les attributs dangereux : événements JS (on*) et href
            if ($attr_key === 'href' || strpos($attr_key, 'on') === 0) {
                continue;
            }

            // Refuse les attributs de la liste noire
            if (in_array($attr_key, self::$attributes_blacklist, true)) {
                continue;
            }

            $attr_value = isset($attr_key_value[1]) ? trim($attr_key_value[1]) : '';
            $result[$attr_key] = $attr_value;
        }

        return $result;
    }

    /**
     * Applique les attributs personnalisés sur le wrapper
     *
     * @param array $settings Paramètres de l'élément
     */
    protected function applyCustomAttributes(array $settings): void
    {
        if (empty($settings['_custom_attributes'])) {
            return;
        }

        $attributes = self::parseCustomAttributes($settings['_custom_attributes']);

        foreach ($attributes as $attribute => $value) {
            $this->add_render_attribute('wrapper', $attribute, $value);
        }
    }

    /**
     * Génère le CSS personnalisé pour l'élément
     *
     * @param array $settings Paramètres de l'élément
     * @param string $element_id ID unique de l'élément
     * @return string CSS généré ou chaîne vide
     */
    protected function generateCustomCss(array $settings, string $element_id): string
    {
        if (empty($settings['_custom_css'])) {
            return '';
        }

        $css = trim($settings['_custom_css']);

        if (empty($css)) {
            return '';
        }

        // Remplace le placeholder "selector" par le sélecteur unique de l'élément
        $unique_selector = '.elementor-element-' . $element_id;
        return str_replace('selector', $unique_selector, $css);
    }

    /**
     * Rend le CSS personnalisé dans une balise style
     *
     * @param array $settings Paramètres de l'élément
     * @param string $element_id ID unique de l'élément
     */
    protected function renderCustomCss(array $settings, string $element_id): void
    {
        $css = $this->generateCustomCss($settings, $element_id);

        if (empty($css)) {
            return;
        }

        echo '<style>' . $css . '</style>';
    }
}
