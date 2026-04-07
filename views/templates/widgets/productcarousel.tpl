{assign var='widget_type' value='product'}
{extends file="module:iqitelementor/views/templates/widgets/slider.tpl"}
{block name='slides'}
    {foreach from=$products item=product}
        <div class="swiper-slide">
            {include file="catalog/_partials/miniatures/product.tpl" product=$product carousel=true}
        </div>
    {/foreach}
{/block}