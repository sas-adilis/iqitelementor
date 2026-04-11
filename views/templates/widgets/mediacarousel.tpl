{assign var='widget_type' value='media'}
{extends file="module:iqitelementor/views/templates/widgets/slider.tpl"}
{block name='slides'}
    {foreach from=$slides item=slide}
        <div class="swiper-slide">
            <div class="media-card">
                {if !empty($slide.image)}
                    <div class="media-card__image">
                        {if !empty($slide.link_url)}
                            <a href="{$slide.link_url|escape:'htmlall':'UTF-8'}"{if !empty($slide.link_attributes)}{$slide.link_attributes nofilter}{/if}>
                        {/if}
                        <img src="{$slide.image}" loading="lazy" alt="{$slide.title|escape:'htmlall':'UTF-8'}"{if !empty($slide.image_width)} width="{$slide.image_width}"{/if}{if !empty($slide.image_height)} height="{$slide.image_height}"{/if} />
                        {if !empty($slide.link_url)}
                            </a>
                        {/if}
                    </div>
                {/if}
                <div class="media-card__body">
                    {if !empty($slide.title)}
                        <h4 class="media-card__title">{$slide.title|escape:'htmlall':'UTF-8'}</h4>
                    {/if}
                    {if !empty($slide.content)}
                        <div class="media-card__content">{$slide.content|escape:'htmlall':'UTF-8'}</div>
                    {/if}
                    {if !empty($slide.link_url) && !empty($slide.link_text)}
                        <a class="media-card__link" href="{$slide.link_url|escape:'htmlall':'UTF-8'}"{if !empty($slide.link_attributes)}{$slide.link_attributes nofilter}{/if}>{$slide.link_text|escape:'htmlall':'UTF-8'}</a>
                    {/if}
                </div>
            </div>
        </div>
    {/foreach}
{/block}