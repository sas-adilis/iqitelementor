<?php

namespace IqitElementor\Enum;

if (!defined('_PS_VERSION_')) {
    exit;
}

class EntityType
{
    const LANDING = 'landing';
    const TEMPLATE = 'template';
    const CONTENT = 'content';
    const CATEGORY = 'category';
    const PRODUCT = 'product';
    const CMS = 'cms';
    const BLOG = 'blog';

    /**
     * Entity types that have autosave columns on their native table.
     *
     * @return string[]
     */
    public static function getAutosaveTypes(): array
    {
        return [
            self::LANDING,
            self::TEMPLATE,
            self::CONTENT,
            self::CATEGORY,
            self::PRODUCT,
        ];
    }

    /**
     * Map entity type to its database table (without prefix).
     *
     * @return string|null
     */
    public static function getTable(string $type): ?string
    {
        $map = [
            self::LANDING => 'iqit_elementor_landing',
            self::TEMPLATE => 'iqit_elementor_template',
            self::CONTENT => 'iqit_elementor_content',
            self::CATEGORY => 'iqit_elementor_category',
            self::PRODUCT => 'iqit_elementor_product',
        ];

        return isset($map[$type]) ? $map[$type] : null;
    }

    /**
     * Map entity type to its primary key column.
     *
     * @return string|null
     */
    public static function getPrimaryKey(string $type): ?string
    {
        $map = [
            self::LANDING => 'id_iqit_elementor_landing',
            self::TEMPLATE => 'id_template',
            self::CONTENT => 'id_elementor',
            self::CATEGORY => 'id_elementor',
            self::PRODUCT => 'id_elementor',
        ];

        return isset($map[$type]) ? $map[$type] : null;
    }
}
