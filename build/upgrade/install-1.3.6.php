<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Register the container width configuration option used as the default
 * max-width for boxed sections when no custom per-section width is defined.
 */
function upgrade_module_1_3_6($object)
{
    if (Configuration::get('iqitelementor_elementor_container_width') === false
        || Configuration::get('iqitelementor_elementor_container_width') === null
        || Configuration::get('iqitelementor_elementor_container_width') === '') {
        Configuration::updateValue('iqitelementor_elementor_container_width', 1200);
    }

    return true;
}
