<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Registers CMS grid hooks to display an Elementor column in the CMS pages listing.
 */
function upgrade_module_1_3_1($object)
{
    return $object->registerHook('actionCmsPageGridDefinitionModifier')
        && $object->registerHook('actionCmsPageGridDataModifier');
}
