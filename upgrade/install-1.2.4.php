<?php
/**
 * 2007-2015 IQIT-COMMERCE.COM
 *
 * NOTICE OF LICENSE
 *
 * @author    IQIT-COMMERCE.COM <support@iqit-commerce.com>
 * @copyright 2007-2015 IQIT-COMMERCE.COM
 * @license   GNU General Public License version 2
 *
 * You can not resell or redistribute this software.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_2_4($object)
{
    $object->registerHook('displayYbcBlogElementor');

    $tableExists = Db::getInstance()->getValue('
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = \'' . _DB_NAME_ . '\' 
    AND table_name = \'' . _DB_PREFIX_ . 'ybc_blog_post_lang\'
    ');

    if ($tableExists) {
        Db::getInstance()->execute('
                ALTER TABLE `' . _DB_PREFIX_ . 'ybc_blog_post_lang`
                MODIFY `description` LONGTEXT
            ');
    }

    return true;
}
