<?php

use IqitElementor\Helper\Migration;

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_3_0($object): bool
{
    // Contrôles simples
    Migration::register_control_rename('heading', 'title', 'heading_text');
    Migration::register_control_rename('heading', 'header_size', 'heading_tag');
    Migration::register_control_rename('heading', 'link', 'heading_link');
    Migration::register_control_rename('heading', 'size', 'heading_size');
    Migration::register_control_rename('heading', 'header_style', 'heading_style');
    Migration::register_control_rename('heading', 'align', 'heading_align');
    Migration::register_control_rename('heading', 'title_color', 'heading_color');

    // Group control: typography (sous-champs)
    Migration::register_control_rename('heading', 'typography_typography', 'heading_typography_typography');
    Migration::register_control_rename('heading', 'typography_font_size', 'heading_typography_font_size');
    Migration::register_control_rename('heading', 'typography_font_family', 'heading_typography_font_family');
    Migration::register_control_rename('heading', 'typography_font_family_custom', 'heading_typography_font_family_custom');
    Migration::register_control_rename('heading', 'typography_font_weight', 'heading_typography_font_weight');
    Migration::register_control_rename('heading', 'typography_text_transform', 'heading_typography_text_transform');
    Migration::register_control_rename('heading', 'typography_font_style', 'heading_typography_font_style');
    Migration::register_control_rename('heading', 'typography_text_decoration', 'heading_typography_text_decoration');
    Migration::register_control_rename('heading', 'typography_line_height', 'heading_typography_line_height');
    Migration::register_control_rename('heading', 'typography_letter_spacing', 'heading_typography_letter_spacing');

    // Group control: text_shadow (sous-champs)
    Migration::register_control_rename('heading', 'text_shadow_text_shadow_type', 'heading_text_shadow_text_shadow_type');
    Migration::register_control_rename('heading', 'text_shadow_text_shadow', 'heading_text_shadow_text_shadow');

    Migration::apply_migrations();

    return true;
}
