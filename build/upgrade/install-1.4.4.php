<?php

if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * 1.4.4 introduces a content-addressed filesystem cache
 * (IqitElementor\Cache\RenderCache) that replaces the legacy per-entity
 * Smarty cache wrappers and all the `clearXxxCache()` methods that used
 * to be triggered from a handful of `actionObjectXxxUpdate/Add/Delete`
 * hooks.
 *
 * As a result this upgrade:
 *
 *   - registers `actionDispatcher` so the `{iqit_render content=$foo}`
 *     Smarty function can be installed as soon as dispatch starts;
 *   - unregisters the obsolete cache-only hooks on shops that were
 *     previously subscribed to them.
 */
function upgrade_module_1_4_4($module)
{
    $module->registerHook('actionDispatcher');

    $obsoleteHooks = [
        'actionObjectCmsDeleteAfter',
        'actionObjectSimpleBlogPostUpdateAfter',
        'actionObjectSimpleBlogPostAddAfter',
        'actionObjectManufacturerUpdateAfter',
        'actionObjectManufacturerAddAfter',
        'actionObjectProductUpdateAfter',
        'actionObjectProductAddAfter',
    ];

    foreach ($obsoleteHooks as $hook) {
        $module->unregisterHook($hook);
    }

    return true;
}
