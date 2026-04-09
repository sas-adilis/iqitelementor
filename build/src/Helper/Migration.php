<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

/**
 * Classe de migration pour les controles Elementor
 *
 * Permet de migrer automatiquement les noms de controles deprecies
 * dans les contenus JSON Elementor stockes en base de donnees.
 *
 * Utilisation dans un fichier de mise a jour :
 * ```php
 * Migration::registerControlRename('heading', 'size', 'heading_size');
 * Migration::registerControlRename('heading', 'title', 'heading_text');
 * Migration::applyMigrations();
 * ```
 */
class Migration
{
    /**
     * Registre des remplacements de controles
     * Structure : ['widget_type' => ['old_name' => 'new_name', ...], ...]
     */
    /** @var array */
    private static $control_renames = [];

    /**
     * Configuration des tables contenant du contenu Elementor
     * Structure : [
     *     'table_name' => [
     *         'content_column' => 'nom_colonne_json',
     *         'primary_keys' => ['col1', 'col2'],
     *     ]
     * ]
     */
    /** @var array */
    private static $tables_config = [
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
     * Enregistre un remplacement de nom de controle pour un widget
     *
     * @param string $widget_type Type du widget (ex: 'heading', 'button')
     * @param string $old_name Ancien nom du controle
     * @param string $new_name Nouveau nom du controle
     */
    public static function registerControlRename(string $widget_type, string $old_name, string $new_name): void
    {
        if (!isset(self::$control_renames[$widget_type])) {
            self::$control_renames[$widget_type] = [];
        }

        self::$control_renames[$widget_type][$old_name] = $new_name;
    }

    /**
     * Enregistre plusieurs remplacements de noms de controles pour un widget
     *
     * @param string $widget_type Type du widget
     * @param array $renames Tableau associatif ['old_name' => 'new_name', ...]
     */
    public static function registerControlRenames(string $widget_type, array $renames): void
    {
        foreach ($renames as $old_name => $new_name) {
            self::registerControlRename($widget_type, $old_name, $new_name);
        }
    }

    /**
     * Verifie si une table existe en base de donnees
     *
     * @param string $table_name Nom de la table (sans prefixe)
     */
    private static function tableExists(string $table_name): bool
    {
        $full_table_name = \_DB_PREFIX_ . $table_name;
        $sql = 'SHOW TABLES LIKE \'' . pSQL($full_table_name) . '\'';
        $result = \Db::getInstance()->executeS($sql);

        return !empty($result);
    }

    /**
     * Verifie si le contenu est un JSON Elementor valide
     *
     * @param string $content Contenu a verifier
     */
    private static function isElementorJson(string $content): bool
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

        return self::containsElementorStructure($data);
    }

    /**
     * Verifie recursivement si la structure contient des elements Elementor
     *
     * @param array $data Donnees JSON decodees
     */
    private static function containsElementorStructure(array $data): bool
    {
        if (isset($data['widgetType']) || isset($data['elType']) || isset($data['elements'])) {
            return true;
        }

        foreach ($data as $item) {
            if (is_array($item)) {
                if (self::containsElementorStructure($item)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Applique les migrations sur tous les contenus Elementor en base
     *
     * @return array Resultat de la migration par table
     */
    public static function applyMigrations(): array
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
            if (!self::tableExists($table_name)) {
                continue;
            }

            $table_result = self::migrateTable($table_name, $config);
            $result['tables'][$table_name] = $table_result;
            $result['total_success'] += $table_result['success'];
            $result['total_errors'] += count($table_result['errors']);
        }

        return $result;
    }

    /**
     * Migre une table specifique
     *
     * @param string $table_name Nom de la table (sans prefixe)
     * @param array $config Configuration de la table
     * @return array Resultat ['success' => int, 'skipped' => int, 'errors' => array]
     */
    private static function migrateTable(string $table_name, array $config): array
    {
        $result = [
            'success' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        $content_column = $config['content_column'];
        $primary_keys = $config['primary_keys'];

        $sql = 'SELECT * FROM `' . \_DB_PREFIX_ . bqSQL($table_name) . '`';
        $rows = \Db::getInstance()->executeS($sql);

        if (empty($rows)) {
            return $result;
        }

        foreach ($rows as $row) {
            $content = $row[$content_column] ?? '';

            if (!self::isElementorJson($content)) {
                $result['skipped']++;
                continue;
            }

            try {
                $migrated = self::migrateRow($table_name, $row, $config);
                if ($migrated) {
                    $result['success']++;
                } else {
                    $result['skipped']++;
                }
            } catch (\Exception $e) {
                $pk_values = array_map(function ($key) use ($row) {
                    return isset($row[$key]) ? $row[$key] : 'null';
                }, $primary_keys);
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
     * @param array $row Donnees de la ligne
     * @param array $config Configuration de la table
     * @return bool True si modifie et sauvegarde
     */
    private static function migrateRow(string $table_name, array $row, array $config): bool
    {
        $content_column = $config['content_column'];
        $primary_keys = $config['primary_keys'];
        $content = $row[$content_column];

        $json_data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($json_data)) {
            return false;
        }

        $modified = false;
        $migrated_data = self::migrateElements($json_data, $modified);

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

        return \Db::getInstance()->update(
            bqSQL($table_name),
            [$content_column => pSQL($new_content, true)],
            implode(' AND ', $where_conditions)
        );
    }

    /**
     * Parcourt et migre recursivement les elements Elementor
     *
     * @param array $elements Tableau d'elements ou structure Elementor
     * @param bool &$modified Reference indiquant si des modifications ont ete faites
     * @return array Elements migres
     */
    private static function migrateElements(array $elements, bool &$modified): array
    {
        foreach ($elements as $key => &$element) {
            if (!is_array($element)) {
                continue;
            }

            if (isset($element['widgetType']) && isset($element['settings'])) {
                $widget_type = $element['widgetType'];

                if (isset(self::$control_renames[$widget_type])) {
                    $element['settings'] = self::migrateSettings(
                        $element['settings'],
                        self::$control_renames[$widget_type],
                        $modified
                    );
                }
            }

            if (isset($element['elements']) && is_array($element['elements'])) {
                $element['elements'] = self::migrateElements($element['elements'], $modified);
            }

            if (is_array($element) && !isset($element['widgetType'])) {
                $element = self::migrateElements($element, $modified);
            }
        }

        return $elements;
    }

    /**
     * Migre les settings d'un widget en appliquant les remplacements de noms
     *
     * @param array $settings Settings du widget
     * @param array $renames Remplacements a appliquer ['old' => 'new']
     * @param bool &$modified Reference indiquant si des modifications ont ete faites
     * @return array Settings migres
     */
    private static function migrateSettings(array $settings, array $renames, bool &$modified): array
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

}
