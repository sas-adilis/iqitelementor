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
            // Display
            'displayHome',
            'displayHeader',
            'displayBackOfficeHeader',
            'displayManufacturerElementor',
            'displayCMSDisputeInformation',
            'displayProductElementor',
            'displayCategoryElementor',
            'displayBlogElementor',

            // Dispatch
            'actionDispatcher',
            'moduleRoutes',

            // CMS purifier dance (saving Elementor JSON through CMS content)
            'actionObjectCmsUpdateBefore',
            'actionObjectCmsUpdateAfter',

            // DB cleanup on entity deletion (Elementor layouts live in dedicated tables)
            'actionObjectProductDeleteAfter',
            'actionObjectManufacturerDeleteAfter',
            'actionObjectCategoryDeleteAfter',

            // Product duplication helper
            'actionProductAdd',

            // Misc
            'isJustElementor',
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
        $contentHooks = self::getContentHookNames();
        $registered = self::getRegistered((int) $module->id, (int) \Context::getContext()->shop->id);

        foreach ($registered as $hook) {
            $name = $hook['name'];

            if (in_array($name, $usedHooks)) {
                $module->registerHook($name);
            } elseif (in_array($name, $contentHooks)) {
                // User-defined hook bound to an IqitElementorContent row —
                // keep the registration, otherwise the content stops rendering.
            } else {
                $module->unregisterHook($name);
            }

            $key = array_search($name, $usedHooks);
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
     * Hook names referenced by IqitElementorContent rows, excluding the
     * widget sentinel (rendered via {widget} tag, never greffed).
     *
     * @return string[]
     */
    private static function getContentHookNames(): array
    {
        $sql = 'SELECT DISTINCT h.name
            FROM ' . \_DB_PREFIX_ . 'iqit_elementor_content c
            INNER JOIN ' . \_DB_PREFIX_ . 'hook h ON (h.id_hook = c.hook)
            WHERE h.name <> "' . \pSQL(\IqitElementorContent::WIDGET_HOOK_NAME) . '"';

        $rows = \Db::getInstance()->executeS($sql);
        if (!$rows) {
            return [];
        }

        return array_column($rows, 'name');
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
