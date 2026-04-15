{assign var='widget_type' value='image-carousel'}
{extends file="module:iqitelementor/views/templates/widgets/slider.tpl"}
{block name='slides'}
    {foreach from=$slides item=slide}
        <div class="swiper-slide{if $image_stretch} swiper-image-stretch{/if}">
            <div class="swiper-slide-inner">
                {if !empty($slide.link_url)}
                <a href="{$slide.link_url|escape:'html':'UTF-8'}"{if !empty($slide.link_attributes)}{$slide.link_attributes nofilter}{/if}>
                {/if}
                <img class="swiper-slide-image"
                     src="{$slide.image|escape:'html':'UTF-8'}"
                     alt="{$slide.alt|escape:'html':'UTF-8'}"
                     {if $slide.image_width} width="{$slide.image_width}"{/if}
                     {if $slide.image_height} height="{$slide.image_height}"{/if}
                     {if $slide.lazy} loading="lazy"{/if} />
                {if !empty($slide.link_url)}
                </a>
                {/if}
            </div>
        </div>
    {/foreach}
{/block}
