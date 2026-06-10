{*
* 2007-2016 PrestaShop
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
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*}
<div class="elementor-links">
    <div class="block  block-links">

        {if $title}<h5 class="{$title_style} elementor-block-title">{if $link.url}<a href="{$link.url}" {if $link.is_external}target="_blank"{/if}>{/if}<span>{$title}</span>{if $link.url}</a>{/if}</h5>{/if}
        <div class="block-content">
            <ul>
                {foreach $links as $link}
                    {if isset($link.url) && isset($link.title)}
                        <li>
                            <a
                                    href="{$link.url}"
                                    {if isset($link.description)}title="{$link.description}"{/if}
                            >
                                {$link.title}
                            </a>
                        </li>
                    {/if}
                {/foreach}
            </ul>
        </div>
    </div>
</div>








