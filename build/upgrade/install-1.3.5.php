<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Register the AdminSimpleBlogPosts listing fields modifier hook,
 * used to inject the "Edit with Elementor" icon column in the blog posts list.
 */
function upgrade_module_1_3_5($object)
{
    return $object->registerHook('actionAdminSimpleBlogPostsListingFieldsModifier');
}
