<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Classe de migration pour les contrôles Elementor
 *
 * Permet de migrer automatiquement les noms de contrôles dépréciés
 * dans les contenus JSON Elementor stockés en base de données.
 *
 * Utilisation dans un fichier de mise à jour :
 * ```php
 * IqitElementorMigration::register_control_rename('heading', 'size', 'heading_size');
 * IqitElementorMigration::register_control_rename('heading', 'title', 'heading_text');
 * IqitElementorMigration::apply_migrations();
 * ```
 */
class IqitElementorMigration
{
    /**
     * Registre des remplacements de contrôles
     * Structure : ['widget_type' => ['old_name' => 'new_name', ...], ...]
     */
    private static array $control_renames = [];

    /**
     * Configuration des tables contenant du contenu Elementor
     * Structure : [
     *     'table_name' => [
     *         'content_column' => 'nom_colonne_json',
     *         'primary_keys' => ['col1', 'col2'],
     *     ]
     * ]
     */
    private static array $tables_config = [
        'iqit_elementor_category_lang' => [
            'content_column' => 'data',
            'primary_keys' => ['id_elementor', 'id_lang'],
        ],
        'iqit_elementor_content_lang' => [
            'content_column' => 'data',
            'primary_keys' => ['id_elementor', 'id_lang'],
        ],
        'iqit_elementor_landing_lang' => [
            'content_column' => 'data',
            'primary_keys' => ['id_iqit_elementor_landing', 'id_lang'],
        ],
        'iqit_elementor_template' => [
            'content_column' => 'data',
            'primary_keys' => ['id_template'],
        ],
        'cms_lang' => [
            'content_column' => 'content',
            'primary_keys' => ['id_cms', 'id_lang', 'id_shop'],
        ],
    ];

    /**
     * Enregistre un remplacement de nom de contrôle pour un widget
     *
     * @param string $widget_type Type du widget (ex: 'heading', 'button')
     * @param string $old_name Ancien nom du contrôle
     * @param string $new_name Nouveau nom du contrôle
     */
    public static function register_control_rename(string $widget_type, string $old_name, string $new_name): void
    {
        if (!isset(self::$control_renames[$widget_type])) {
            self::$control_renames[$widget_type] = [];
        }

        self::$control_renames[$widget_type][$old_name] = $new_name;
    }

    /**
     * Enregistre plusieurs remplacements de noms de contrôles pour un widget
     *
     * @param string $widget_type Type du widget
     * @param array $renames Tableau associatif ['old_name' => 'new_name', ...]
     */
    public static function register_control_renames(string $widget_type, array $renames): void
    {
        foreach ($renames as $old_name => $new_name) {
            self::register_control_rename($widget_type, $old_name, $new_name);
        }
    }

    /**
     * Réinitialise le registre des remplacements
     */
    public static function clear_renames(): void
    {
        self::$control_renames = [];
    }

    /**
     * Retourne le registre actuel des remplacements
     *
     * @return array
     */
    public static function get_renames(): array
    {
        return self::$control_renames;
    }

    /**
     * Vérifie si une table existe en base de données
     *
     * @param string $table_name Nom de la table (sans préfixe)
     * @return bool
     */
    private static function table_exists(string $table_name): bool
    {
        $full_table_name = _DB_PREFIX_ . $table_name;
        $sql = 'SHOW TABLES LIKE \'' . pSQL($full_table_name) . '\'';
        $result = Db::getInstance()->executeS($sql);

        return !empty($result);
    }

    /**
     * Vérifie si le contenu est un JSON Elementor valide
     *
     * @param string $content Contenu à vérifier
     * @return bool
     */
    private static function is_elementor_json(string $content): bool
    {
        $content = trim($content);

        if (empty($content)) {
            return false;
        }

        if ($content[0] !== '[' && $content[0] !== '{') {
            return false;
        }

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return false;
        }

        return self::contains_elementor_structure($data);
    }

    /**
     * Vérifie récursivement si la structure contient des éléments Elementor
     *
     * @param array $data Données JSON décodées
     * @return bool
     */
    private static function contains_elementor_structure(array $data): bool
    {
        if (isset($data['widgetType']) || isset($data['elType']) || isset($data['elements'])) {
            return true;
        }

        foreach ($data as $item) {
            if (is_array($item)) {
                if (self::contains_elementor_structure($item)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Applique les migrations sur tous les contenus Elementor en base
     *
     * @return array Résultat de la migration par table
     */
    public static function apply_migrations(): array
    {
        $result = [
            'total_success' => 0,
            'total_errors' => 0,
            'tables' => [],
        ];

        if (empty(self::$control_renames)) {
            return $result;
        }

        foreach (self::$tables_config as $table_name => $config) {
            if (!self::table_exists($table_name)) {
                continue;
            }

            $table_result = self::migrate_table($table_name, $config);
            $result['tables'][$table_name] = $table_result;
            $result['total_success'] += $table_result['success'];
            $result['total_errors'] += count($table_result['errors']);
        }

        return $result;
    }

    /**
     * Migre une table spécifique
     *
     * @param string $table_name Nom de la table (sans préfixe)
     * @param array $config Configuration de la table
     * @return array Résultat ['success' => int, 'skipped' => int, 'errors' => array]
     */
    private static function migrate_table(string $table_name, array $config): array
    {
        $result = [
            'success' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $content_column = $config['content_column'];
        $primary_keys = $config['primary_keys'];

        $sql = 'SELECT * FROM `' . _DB_PREFIX_ . bqSQL($table_name) . '`';
        $rows = Db::getInstance()->executeS($sql);

        if (empty($rows)) {
            return $result;
        }

        foreach ($rows as $row) {
            $content = $row[$content_column] ?? '';

            if (!self::is_elementor_json($content)) {
                $result['skipped']++;
                continue;
            }

            try {
                $migrated = self::migrate_row($table_name, $row, $config);
                if ($migrated) {
                    $result['success']++;
                } else {
                    $result['skipped']++;
                }
            } catch (Exception $e) {
                $pk_values = array_map(fn($key) => $row[$key] ?? 'null', $primary_keys);
                $result['errors'][] = [
                    'primary_key' => implode('-', $pk_values),
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $result;
    }

    /**
     * Migre une ligne de contenu
     *
     * @param string $table_name Nom de la table
     * @param array $row Données de la ligne
     * @param array $config Configuration de la table
     * @return bool True si modifié et sauvegardé
     */
    private static function migrate_row(string $table_name, array $row, array $config): bool
    {
        $content_column = $config['content_column'];
        $primary_keys = $config['primary_keys'];
        $content = $row[$content_column];

        $json_data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($json_data)) {
            return false;
        }

        $modified = false;
        $migrated_data = self::migrate_elements($json_data, $modified);

        if (!$modified) {
            return false;
        }

        $new_content = json_encode($migrated_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $where_conditions = [];
        foreach ($primary_keys as $pk) {
            $value = $row[$pk];
            if (is_numeric($value)) {
                $where_conditions[] = '`' . bqSQL($pk) . '` = ' . (int) $value;
            } else {
                $where_conditions[] = '`' . bqSQL($pk) . '` = \'' . pSQL($value) . '\'';
            }
        }

        return Db::getInstance()->update(
            bqSQL($table_name),
            [$content_column => pSQL($new_content, true)],
            implode(' AND ', $where_conditions)
        );
    }

    /**
     * Parcourt et migre récursivement les éléments Elementor
     *
     * @param array $elements Tableau d'éléments ou structure Elementor
     * @param bool &$modified Référence indiquant si des modifications ont été faites
     * @return array Éléments migrés
     */
    private static function migrate_elements(array $elements, bool &$modified): array
    {
        foreach ($elements as $key => &$element) {
            if (!is_array($element)) {
                continue;
            }

            if (isset($element['widgetType']) && isset($element['settings'])) {
                $widget_type = $element['widgetType'];

                if (isset(self::$control_renames[$widget_type])) {
                    $element['settings'] = self::migrate_settings(
                        $element['settings'],
                        self::$control_renames[$widget_type],
                        $modified
                    );
                }
            }

            if (isset($element['elements']) && is_array($element['elements'])) {
                $element['elements'] = self::migrate_elements($element['elements'], $modified);
            }

            if (is_array($element) && !isset($element['widgetType'])) {
                $element = self::migrate_elements($element, $modified);
            }
        }

        return $elements;
    }

    /**
     * Migre les settings d'un widget en appliquant les remplacements de noms
     *
     * @param array $settings Settings du widget
     * @param array $renames Remplacements à appliquer ['old' => 'new']
     * @param bool &$modified Référence indiquant si des modifications ont été faites
     * @return array Settings migrés
     */
    private static function migrate_settings(array $settings, array $renames, bool &$modified): array
    {
        foreach ($renames as $old_name => $new_name) {
            if (array_key_exists($old_name, $settings) && !array_key_exists($new_name, $settings)) {
                $settings[$new_name] = $settings[$old_name];
                unset($settings[$old_name]);
                $modified = true;
            }

            foreach (['_tablet', '_mobile'] as $suffix) {
                $old_responsive = $old_name . $suffix;
                $new_responsive = $new_name . $suffix;

                if (array_key_exists($old_responsive, $settings) && !array_key_exists($new_responsive, $settings)) {
                    $settings[$new_responsive] = $settings[$old_responsive];
                    unset($settings[$old_responsive]);
                    $modified = true;
                }
            }
        }

        return $settings;
    }

    /**
     * Migre un contenu JSON Elementor (utilitaire pour tests ou usage direct)
     *
     * @param string $json_content Contenu JSON Elementor
     * @return string|false JSON migré ou false si pas un JSON Elementor valide
     */
    public static function migrate_json(string $json_content)
    {
        if (!self::is_elementor_json($json_content)) {
            return false;
        }

        $data = json_decode($json_content, true);
        $modified = false;
        $migrated = self::migrate_elements($data, $modified);

        if (!$modified) {
            return $json_content;
        }

        return json_encode($migrated, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Prévisualise les migrations sans les appliquer
     *
     * @return array Liste des modifications qui seraient effectuées par table
     */
    public static function preview_migrations(): array
    {
        $preview = [
            'total_changes' => 0,
            'tables' => [],
        ];

        if (empty(self::$control_renames)) {
            return $preview;
        }

        foreach (self::$tables_config as $table_name => $config) {
            if (!self::table_exists($table_name)) {
                continue;
            }

            $table_preview = self::preview_table($table_name, $config);
            if (!empty($table_preview)) {
                $preview['tables'][$table_name] = $table_preview;
                $preview['total_changes'] += count($table_preview);
            }
        }

        return $preview;
    }

    /**
     * Prévisualise les migrations pour une table
     *
     * @param string $table_name Nom de la table
     * @param array $config Configuration de la table
     * @return array Liste des changements
     */
    private static function preview_table(string $table_name, array $config): array
    {
        $changes = [];
        $content_column = $config['content_column'];
        $primary_keys = $config['primary_keys'];

        $sql = 'SELECT * FROM `' . _DB_PREFIX_ . bqSQL($table_name) . '`';
        $rows = Db::getInstance()->executeS($sql);

        if (empty($rows)) {
            return $changes;
        }

        foreach ($rows as $row) {
            $content = $row[$content_column] ?? '';

            if (!self::is_elementor_json($content)) {
                continue;
            }

            $json_data = json_decode($content, true);
            $row_changes = self::find_changes($json_data);

            if (!empty($row_changes)) {
                $pk_values = [];
                foreach ($primary_keys as $pk) {
                    $pk_values[$pk] = $row[$pk] ?? null;
                }

                $changes[] = [
                    'primary_key' => $pk_values,
                    'changes' => $row_changes,
                ];
            }
        }

        return $changes;
    }

    /**
     * Trouve les changements qui seraient appliqués sur une structure
     *
     * @param array $elements Structure Elementor
     * @return array Liste des changements
     */
    private static function find_changes(array $elements): array
    {
        $changes = [];

        foreach ($elements as $element) {
            if (!is_array($element)) {
                continue;
            }

            if (isset($element['widgetType']) && isset($element['settings'])) {
                $widget_type = $element['widgetType'];

                if (isset(self::$control_renames[$widget_type])) {
                    foreach (self::$control_renames[$widget_type] as $old_name => $new_name) {
                        if (array_key_exists($old_name, $element['settings'])) {
                            $changes[] = [
                                'widget' => $widget_type,
                                'old_control' => $old_name,
                                'new_control' => $new_name,
                            ];
                        }
                    }
                }
            }

            if (isset($element['elements']) && is_array($element['elements'])) {
                $changes = array_merge($changes, self::find_changes($element['elements']));
            }
        }

        return $changes;
    }

    /**
     * Retourne la configuration des tables
     *
     * @return array
     */
    public static function get_tables_config(): array
    {
        return self::$tables_config;
    }

    /**
     * Ajoute ou modifie la configuration d'une table
     *
     * @param string $table_name Nom de la table (sans préfixe)
     * @param string $content_column Colonne contenant le JSON
     * @param array $primary_keys Colonnes formant la clé primaire
     */
    public static function set_table_config(string $table_name, string $content_column, array $primary_keys): void
    {
        self::$tables_config[$table_name] = [
            'content_column' => $content_column,
            'primary_keys' => $primary_keys,
        ];
    }
}
