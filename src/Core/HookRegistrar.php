<?php

namespace IqitElementor\Core;

/**
 * Single source of truth for hook registration.
 *
 * Centralises the list of hooks used by the module and provides
 * methods to register them at install time or synchronise them
 * when the list evolves.
 */
class HookRegistrar
{
    /**
     * Complete list of hooks used by the module.
     *
     * @return string[]
     */
    public static function getHookList(): array
    {
        return [
            'displayHome',
            'displayBackOfficeHeader',
            'displayManufacturerElementor',
            'actionObjectCmsUpdateBefore',
            'actionObjectCmsUpdateAfter',
            'actionObjectSimpleBlogPostUpdateAfter',
            'actionObjectSimpleBlogPostAddAfter',
            'actionObjectCmsDeleteAfter',
            'actionObjectProductDeleteAfter',
            'displayCMSDisputeInformation',
            'displayProductElementor',
            'displayCategoryElementor',
            'actionObjectManufacturerUpdateAfter',
            'actionObjectManufacturerDeleteAfter',
            'actionObjectManufacturerAddAfter',
            'actionObjectProductUpdateAfter',
            'actionObjectProductAddAfter',
            'actionObjectCategoryDeleteAfter',
            'displayHeader',
            'moduleRoutes',
            'isJustElementor',
            'actionProductAdd',
            'actionCmsPageGridDefinitionModifier',
            'actionCmsPageGridDataModifier',
            'actionAdminSimpleBlogPostsListingFieldsModifier',
        ];
    }

    /**
     * Register all hooks during module installation.
     */
    public static function registerAll(\Module $module): bool
    {
        foreach (self::getHookList() as $hookName) {
            if (!$module->registerHook($hookName)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Synchronise registered hooks with the current list.
     *
     * Registers missing hooks and unregisters hooks that are
     * no longer in the list.
     *
     * @throws \PrestaShopDatabaseException
     */
    public static function synchronize(\Module $module): bool
    {
        $usedHooks = self::getHookList();
        $registered = self::getRegistered((int) $module->id, (int) \Context::getContext()->shop->id);

        foreach ($registered as $hook) {
            if (in_array($hook['name'], $usedHooks)) {
                $module->registerHook($hook['name']);
            } else {
                $module->unregisterHook($hook['name']);
            }
            $key = array_search($hook['name'], $usedHooks);
            if ($key !== false) {
                unset($usedHooks[$key]);
            }
        }

        foreach ($usedHooks as $hookName) {
            $module->registerHook($hookName);
        }

        return true;
    }

    /**
     * @return array<int, array{name: string}>
     *
     * @throws \PrestaShopDatabaseException
     */
    private static function getRegistered(int $moduleId, int $shopId): array
    {
        return \Db::getInstance()->executeS('
            SELECT DISTINCT(h.name)
            FROM ' . \_DB_PREFIX_ . 'hook_module hm
            INNER JOIN ' . \_DB_PREFIX_ . 'hook h ON (hm.id_hook = h.id_hook)
            WHERE hm.id_module = ' . $moduleId . '
            AND hm.id_shop = ' . $shopId
        );
    }
}
