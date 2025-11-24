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

<div class="elementor-products">

    {if $view == 'carousel_s' || $view == 'carousel'}
    <div class="swiper-container-wrapper swiper-overflow swiper-arrows-{$arrows_position}">
        <div class="products elementor-products-caÊrousel swiper-products-carousel swiper-container swiper  products-grid  {$cls_fix_classes}" data-slider_options='{$options|@json_encode nofilter}' {if $view == 'carousel_s' || $view == 'carousel'}data-element-type="products-carousel"{/if}>
            <div class="swiper-wrapper">
                {else}
                <div class="products row {if $view == 'list'}products-list{else}products-grid {/if}">
                    {/if}
                    {foreach from=$products item="product"}
                        {if $view == 'grid_s'}
                            {include file="catalog/_partials/miniatures/product-small.tpl" product=$product elementor=true nbMobile=$slidesToShow.mobile nbTablet=$slidesToShow.tablet nbDesktop=$slidesToShow.desktop}
                        {elseif $view == 'carousel_s'}
                            <div class="swiper-slide"> {include file="catalog/_partials/miniatures/product-small.tpl" product=$product elementor=true carousel=true } </div>
                        {elseif $view == 'grid'}
                            {include file="catalog/_partials/miniatures/product.tpl" product=$product elementor=true nbMobile=$slidesToShow.mobile nbTablet=$slidesToShow.tablet nbDesktop=$slidesToShow.desktop}
                        {elseif $view == 'list'}
                            {include file="catalog/_partials/miniatures/product-list.tpl" product=$product elementor=true}
                        {else}
                            <div class="swiper-slide"> {include file="catalog/_partials/miniatures/product.tpl" product=$product carousel=true} </div>
                        {/if}
                    {/foreach}
                    {if $view == 'carousel_s' || $view == 'carousel'}
                </div>
                {if $options.dots}
                    <div class="swiper-pagination elementor-swiper-pagination swiper-dots-outside"></div>
                {/if}
            </div>
            {if $options.arrows}
                <div class="swiper-button-prev swiper-button elementor-swiper-button elementor-swiper-button-prev"></div>
                <div class="swiper-button-next swiper-button elementor-swiper-button elementor-swiper-button-next"></div>
            {/if}
            {/if}
        </div>

    </div>
