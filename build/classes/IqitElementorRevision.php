<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorRevision extends ObjectModel
{
    /** @var int */
    public $id;

    /** @var int */
    public $id_iqit_elementor_revision;

    /** @var string */
    public $entity_type;

    /** @var int */
    public $entity_id;

    /** @var string */
    public $content;

    /** @var string */
    public $created_at;

    /** @var string */
    public $label = '';

    /** @var int */
    public $id_employee = 0;

    /** @var string Hydrated by RevisionManager, not persisted */
    public $employee_name = '';

    /**
     * @see ObjectModel::$definition
     */
    public static $definition = [
        'table' => 'iqit_elementor_revision',
        'primary' => 'id_iqit_elementor_revision',
        'multilang' => false,
        'fields' => [
            'entity_type' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'required' => true, 'size' => 50],
            'entity_id' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedId', 'required' => true],
            'content' => ['type' => self::TYPE_HTML, 'validate' => 'isJson', 'required' => true],
            'created_at' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
            'label' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 255],
            'id_employee' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedId'],
        ],
    ];

    /**
     * @param bool $auto_date
     * @param bool $null_values
     * @return bool
     */
    public function add($auto_date = true, $null_values = false)
    {
        if (empty($this->created_at)) {
            $this->created_at = date('Y-m-d H:i:s');
        }

        return parent::add($auto_date, $null_values);
    }
}
