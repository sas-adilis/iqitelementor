<?php
/*
* 2007-2015 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2015 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

if (!defined('_PS_VERSION_')) {
    exit;
}

class IqitElementorLanding extends ObjectModel
{
    /** @var int */
    public $id;
    /** @var int */
    public $id_iqit_elementor_landing;
    /** @var int */
    public $id_shop;
    /** @var string */
    public $title;
    /** @var int */
    public $active = 1;
    // Lang fields
    /** @var string|array */
    public $text;
    /** @var string|array */
    public $data;
    /** @var string|array */
    public $meta_title;
    /** @var string|array */
    public $meta_description;
    /** @var string|array */
    public $link_rewrite;
    // Autosave
    /** @var string|null */
    public $autosave_content;
    /** @var string|null */
    public $autosave_at;

    /**
     * @see ObjectModel::$definition
     */
    public static $definition = [
        'table' => 'iqit_elementor_landing',
        'primary' => 'id_iqit_elementor_landing',
        'multilang' => true,
        'fields' => [
            'id_shop' => ['type' => self::TYPE_NOTHING, 'validate' => 'isUnsignedId'],
            'title' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 255],
            'active' => ['type' => self::TYPE_BOOL, 'validate' => 'isBool'],
            // Lang fields
            'data' => ['type' => self::TYPE_HTML, 'lang' => true, 'validate' => 'isJson'],
            'meta_title' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isCleanHtml', 'size' => 255],
            'meta_description' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isCleanHtml', 'size' => 512],
            'link_rewrite' => ['type' => self::TYPE_STRING, 'lang' => true, 'validate' => 'isLinkRewrite', 'size' => 128],
            'autosave_content' => ['type' => self::TYPE_HTML, 'validate' => 'isJson'],
            'autosave_at' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
        ],
    ];

    public static function getLandingPages(): array
    {
        $sql = new DbQuery();
        $sql->select('id_iqit_elementor_landing, title');
        $sql->from('iqit_elementor_landing', 'iel');
        $sql->where('iel.id_shop = ' . (int) Context::getContext()->shop->id);
        $sqlResult = Db::getInstance(_PS_USE_SQL_SLAVE_)->executeS($sql);
        $landingPages = [];
        foreach ($sqlResult as $p) {
            $landingPages[$p['id_iqit_elementor_landing']] = [
                'id' => $p['id_iqit_elementor_landing'],
                'name' => $p['title'],
            ];
        }

        return $landingPages;
    }

    /**
     * Get a landing page by its link_rewrite for a given language and shop.
     *
     * @return int Landing page ID or 0
     */
    public static function getIdByRewrite(string $rewrite, int $idLang, int $idShop): int
    {
        $sql = new DbQuery();
        $sql->select('iel.id_iqit_elementor_landing');
        $sql->from('iqit_elementor_landing', 'iel');
        $sql->innerJoin(
            'iqit_elementor_landing_lang',
            'iell',
            'iel.id_iqit_elementor_landing = iell.id_iqit_elementor_landing AND iell.id_lang = ' . (int) $idLang
        );
        $sql->where('iell.link_rewrite = \'' . pSQL($rewrite) . '\'');
        $sql->where('iel.id_shop = ' . (int) $idShop);
        $sql->where('iel.active = 1');

        return (int) Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($sql);
    }

    /**
     * Check if a link_rewrite already exists for another landing page.
     *
     * @param int $excludeId Landing page ID to exclude (for updates)
     */
    public static function rewriteExists(string $rewrite, int $idLang, int $idShop, int $excludeId = 0): bool
    {
        $sql = new DbQuery();
        $sql->select('iel.id_iqit_elementor_landing');
        $sql->from('iqit_elementor_landing', 'iel');
        $sql->innerJoin(
            'iqit_elementor_landing_lang',
            'iell',
            'iel.id_iqit_elementor_landing = iell.id_iqit_elementor_landing AND iell.id_lang = ' . (int) $idLang
        );
        $sql->where('iell.link_rewrite = \'' . pSQL($rewrite) . '\'');
        $sql->where('iel.id_shop = ' . (int) $idShop);
        if ($excludeId) {
            $sql->where('iel.id_iqit_elementor_landing != ' . (int) $excludeId);
        }

        return (bool) Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($sql);
    }

    /**
     * Generate a unique link_rewrite by appending a counter if needed.
     */
    public static function getUniqueRewrite(string $rewrite, int $idLang, int $idShop, int $excludeId = 0): string
    {
        $baseRewrite = preg_replace('/-\d+$/', '', $rewrite);
        $candidate = $baseRewrite;
        $i = 1;

        while (self::rewriteExists($candidate, $idLang, $idShop, $excludeId)) {
            $candidate = $baseRewrite . '-' . $i;
            $i++;
        }

        return $candidate;
    }

    /**
     * Check if this landing page is the current homepage layout.
     */
    public function isHomepage(): bool
    {
        return (int) Configuration::get('iqit_homepage_layout') === (int) $this->id;
    }

    /**
     * Get the public URL for this landing page.
     */
    public function getLink(?int $idLang = null): string
    {
        if (!$idLang) {
            $idLang = Context::getContext()->language->id;
        }

        $rewrite = is_array($this->link_rewrite) ? $this->link_rewrite[$idLang] : $this->link_rewrite;

        return Context::getContext()->link->getModuleLink(
            'iqitelementor',
            'landing',
            ['rewrite' => $rewrite],
            true,
            $idLang
        );
    }
}
