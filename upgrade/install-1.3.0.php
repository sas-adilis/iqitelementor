<?php

require_once _PS_MODULE_DIR_ . 'iqitelementor/src/IqitElementorMigration.php';

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_3_0($object): bool
{
    // Contrôles simples
    IqitElementorMigration::register_control_rename('heading', 'title', 'heading_text');
    IqitElementorMigration::register_control_rename('heading', 'header_size', 'heading_tag');
    IqitElementorMigration::register_control_rename('heading', 'link', 'heading_link');
    IqitElementorMigration::register_control_rename('heading', 'size', 'heading_size');
    IqitElementorMigration::register_control_rename('heading', 'header_style', 'heading_style');
    IqitElementorMigration::register_control_rename('heading', 'align', 'heading_align');
    IqitElementorMigration::register_control_rename('heading', 'title_color', 'heading_color');

    // Group control: typography (sous-champs)
    IqitElementorMigration::register_control_rename('heading', 'typography_typography', 'heading_typography_typography');
    IqitElementorMigration::register_control_rename('heading', 'typography_font_size', 'heading_typography_font_size');
    IqitElementorMigration::register_control_rename('heading', 'typography_font_family', 'heading_typography_font_family');
    IqitElementorMigration::register_control_rename('heading', 'typography_font_family_custom', 'heading_typography_font_family_custom');
    IqitElementorMigration::register_control_rename('heading', 'typography_font_weight', 'heading_typography_font_weight');
    IqitElementorMigration::register_control_rename('heading', 'typography_text_transform', 'heading_typography_text_transform');
    IqitElementorMigration::register_control_rename('heading', 'typography_font_style', 'heading_typography_font_style');
    IqitElementorMigration::register_control_rename('heading', 'typography_text_decoration', 'heading_typography_text_decoration');
    IqitElementorMigration::register_control_rename('heading', 'typography_line_height', 'heading_typography_line_height');
    IqitElementorMigration::register_control_rename('heading', 'typography_letter_spacing', 'heading_typography_letter_spacing');

    // Group control: text_shadow (sous-champs)
    IqitElementorMigration::register_control_rename('heading', 'text_shadow_text_shadow_type', 'heading_text_shadow_text_shadow_type');
    IqitElementorMigration::register_control_rename('heading', 'text_shadow_text_shadow', 'heading_text_shadow_text_shadow');

    IqitElementorMigration::apply_migrations();

    return true;
}
