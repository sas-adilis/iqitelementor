<?php

require_once _PS_MODULE_DIR_ . 'iqitelementor/src/IqitElementorMigration.php';

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_3_0($object): bool
{
    IqitElementorMigration::register_control_rename('heading', 'title', 'heading_text');
    IqitElementorMigration::register_control_rename('heading', 'header_size', 'heading_tag');
    IqitElementorMigration::register_control_rename('heading', 'link', 'heading_link');
    IqitElementorMigration::register_control_rename('heading', 'size', 'heading_size');
    IqitElementorMigration::register_control_rename('heading', 'header_style', 'heading_style');
    IqitElementorMigration::register_control_rename('heading', 'align', 'heading_align');
    IqitElementorMigration::register_control_rename('heading', 'title_color', 'heading_color');
    IqitElementorMigration::register_control_rename('heading', 'typography', 'heading_typography');
    IqitElementorMigration::register_control_rename('heading', 'text_shadow', 'heading_text_shadow');
    IqitElementorMigration::apply_migrations();
    return true;
}
