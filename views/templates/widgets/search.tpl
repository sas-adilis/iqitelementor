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


<div class="elementor-search">
<div id="search_widget" class="search-widget {if isset($autocomplete) && $autocomplete} search-widget-autocomplete{/if}" data-search-controller-url="{url entity=index params=['fc' => 'module', 'module' => 'iqitsearch', 'controller' => 'searchiqit']}">
    <form method="get" action="{url entity=index params=['fc' => 'module', 'module' => 'iqitsearch', 'controller' => 'searchiqit']}">
        <input type="hidden" name="fc" value="module">
        <input type="hidden" name="module" value="iqitsearch">
        <input type="hidden" name="controller" value="searchiqit">
        <div class="input-group">
            <input type="text" name="s" value="" data-all-text="{l s='Show all results' mod='iqitelementor'}"
                   data-blog-text="{l s='Blog post' mod='iqitelementor'}"
                   data-product-text="{l s='Product' mod='iqitelementor'}"
                   data-brands-text="{l s='Brand' mod='iqitelementor'}"
                   placeholder="{$placeholder}" class="form-control form-search-control" />
            <button type="submit" class="search-btn">
                <i class="fa fa-search"></i>
            </button>
        </div>
    </form>
</div>
</div>



