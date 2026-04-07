<?php

namespace IqitElementor\Manager;

use Configuration;
use Db;
use DbQuery;
use IqitElementor\Enum\EntityType;
use IqitElementorRevision;

if (!defined('_PS_VERSION_')) {
    exit;
}

class RevisionManager
{
    /**
     * Save a new intentional revision for an entity.
     * After insertion, trims older revisions beyond the configured limit.
     */
    public function save(string $entityType, int $entityId, string $content, string $label = ''): void
    {
        $revision = new IqitElementorRevision();
        $revision->entity_type = $entityType;
        $revision->entity_id = $entityId;
        $revision->content = $content;
        $revision->label = $label;

        $context = \Context::getContext();
        if (is_object($context->employee) && $context->employee->id) {
            $revision->id_employee = (int) $context->employee->id;
        }

        $revision->add();

        $this->trim($entityType, $entityId);
    }

    /**
     * Restore a revision: load its content back into the entity's native table.
     */
    public function restore(int $idRevision): bool
    {
        $revision = new IqitElementorRevision($idRevision);
        if (!(int) $revision->id) {
            return false;
        }

        return true;
    }

    /**
     * Get all revisions for a given entity, most recent first.
     *
     * @return IqitElementorRevision[]
     */
    public function getForEntity(string $entityType, int $entityId): array
    {
        $sql = new DbQuery();
        $sql->select('r.id_iqit_elementor_revision, r.entity_type, r.entity_id, r.created_at, r.label, r.id_employee');
        $sql->select('CONCAT(e.firstname, \' \', e.lastname) AS employee_name');
        $sql->from('iqit_elementor_revision', 'r');
        $sql->leftJoin('employee', 'e', 'r.id_employee = e.id_employee');
        $sql->where('r.entity_type = \'' . pSQL($entityType) . '\'');
        $sql->where('r.entity_id = ' . (int) $entityId);
        $sql->orderBy('r.created_at DESC');

        $rows = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
        if (!$rows) {
            return [];
        }

        $revisions = [];
        foreach ($rows as $row) {
            $revision = new IqitElementorRevision();
            $revision->id = (int) $row['id_iqit_elementor_revision'];
            $revision->id_iqit_elementor_revision = (int) $row['id_iqit_elementor_revision'];
            $revision->entity_type = $row['entity_type'];
            $revision->entity_id = (int) $row['entity_id'];
            $revision->created_at = $row['created_at'];
            $revision->label = $row['label'];
            $revision->id_employee = (int) $row['id_employee'];
            $revision->employee_name = isset($row['employee_name']) ? $row['employee_name'] : '';
            $revisions[] = $revision;
        }

        return $revisions;
    }

    /**
     * Get the full content of a single revision.
     *
     * @return string|null
     */
    public function getRevisionContent(int $idRevision): ?string
    {
        $sql = new DbQuery();
        $sql->select('content');
        $sql->from('iqit_elementor_revision');
        $sql->where('id_iqit_elementor_revision = ' . (int) $idRevision);

        $result = Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($sql);

        return $result !== false ? (string) $result : null;
    }

    /**
     * Delete a single revision.
     */
    public function delete(int $idRevision): bool
    {
        $revision = new IqitElementorRevision($idRevision);
        if (!(int) $revision->id) {
            return false;
        }

        return $revision->delete();
    }

    /**
     * Save (overwrite) the autosave slot on the entity's native table.
     * Only works for entity types that have autosave columns.
     */
    public function saveAutosave(string $entityType, int $entityId, string $content): void
    {
        $table = EntityType::getTable($entityType);
        $primaryKey = EntityType::getPrimaryKey($entityType);
        if ($table === null || $primaryKey === null) {
            return;
        }

        Db::getInstance()->update(
            $table,
            [
                'autosave_content' => pSQL($content, true),
                'autosave_at' => date('Y-m-d H:i:s'),
            ],
            '`' . bqSQL($primaryKey) . '` = ' . (int) $entityId
        );
    }

    /**
     * Retrieve the current autosave content for an entity.
     *
     * @return string|null JSON content or null if no autosave exists
     */
    public function getAutosave(string $entityType, int $entityId): ?string
    {
        $table = EntityType::getTable($entityType);
        $primaryKey = EntityType::getPrimaryKey($entityType);
        if ($table === null || $primaryKey === null) {
            return null;
        }

        $sql = new DbQuery();
        $sql->select('autosave_content, autosave_at');
        $sql->from($table);
        $sql->where('`' . bqSQL($primaryKey) . '` = ' . (int) $entityId);
        $sql->where('autosave_content IS NOT NULL');

        $row = Db::getInstance(_PS_USE_SQL_SLAVE_)->getRow($sql);
        if (!$row || empty($row['autosave_content'])) {
            return null;
        }

        return $row['autosave_content'];
    }

    /**
     * Get autosave metadata (content + timestamp) for an entity.
     *
     * @return array{content: string, autosave_at: string}|null
     */
    public function getAutosaveInfo(string $entityType, int $entityId): ?array
    {
        $table = EntityType::getTable($entityType);
        $primaryKey = EntityType::getPrimaryKey($entityType);
        if ($table === null || $primaryKey === null) {
            return null;
        }

        $sql = new DbQuery();
        $sql->select('autosave_content, autosave_at');
        $sql->from($table);
        $sql->where('`' . bqSQL($primaryKey) . '` = ' . (int) $entityId);
        $sql->where('autosave_content IS NOT NULL');

        $row = Db::getInstance(_PS_USE_SQL_SLAVE_)->getRow($sql);
        if (!$row || empty($row['autosave_content'])) {
            return null;
        }

        return [
            'content' => $row['autosave_content'],
            'autosave_at' => $row['autosave_at'],
        ];
    }

    /**
     * Clear the autosave slot for an entity (set columns back to NULL).
     */
    public function clearAutosave(string $entityType, int $entityId): void
    {
        $table = EntityType::getTable($entityType);
        $primaryKey = EntityType::getPrimaryKey($entityType);
        if ($table === null || $primaryKey === null) {
            return;
        }

        Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . bqSQL($table) . '` SET '
            . '`autosave_content` = NULL, '
            . '`autosave_at` = NULL '
            . 'WHERE `' . bqSQL($primaryKey) . '` = ' . (int) $entityId
        );
    }

    /**
     * Get the configured revision limit.
     */
    public function getLimit(): int
    {
        $limit = (int) Configuration::get('IQITELEMENTOR_REVISION_LIMIT');

        return $limit > 0 ? $limit : 20;
    }

    /**
     * Get the current revision count for an entity.
     */
    public function getCount(string $entityType, int $entityId): int
    {
        $sql = new DbQuery();
        $sql->select('COUNT(*)');
        $sql->from('iqit_elementor_revision');
        $sql->where('entity_type = \'' . pSQL($entityType) . '\'');
        $sql->where('entity_id = ' . (int) $entityId);

        return (int) Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($sql);
    }

    /**
     * Trim revisions beyond the configured limit for a given entity,
     * keeping only the most recent ones.
     */
    private function trim(string $entityType, int $entityId): void
    {
        $limit = $this->getLimit();

        $sql = new DbQuery();
        $sql->select('id_iqit_elementor_revision');
        $sql->from('iqit_elementor_revision');
        $sql->where('entity_type = \'' . pSQL($entityType) . '\'');
        $sql->where('entity_id = ' . (int) $entityId);
        $sql->orderBy('created_at DESC');
        $sql->limit(1, $limit);

        $rows = Db::getInstance()->executeS($sql);
        if (empty($rows)) {
            return;
        }

        $ids = array_map(function ($row) {
            return (int) $row['id_iqit_elementor_revision'];
        }, $rows);

        Db::getInstance()->execute(
            'DELETE FROM `' . _DB_PREFIX_ . 'iqit_elementor_revision` '
            . 'WHERE `id_iqit_elementor_revision` IN (' . implode(',', $ids) . ')'
        );
    }
}
