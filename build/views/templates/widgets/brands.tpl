{assign var='widget_type' value='brands'}

{if empty($brands)}
{elseif $view == 'grid'}
    <div class="elementor-{$widget_type} elementor-{$widget_type}-grid{if !empty($alignment)} text-{$alignment}{/if}">
        <div class="row">
            {foreach from=$brands item=brand name=brand_list}
                <div class="col-{$columns.mobile} col-md-{$columns.tablet} col-lg-{$columns.desktop}">
                    <a href="{$brand['link']}" class="elementor-brand-item">
                        <img
                            src="{$brand['image']['url']}"
                            alt="{$brand['name']|escape:'html':'UTF-8'}"
                            loading="lazy"
                            {if !empty($brand['image']['width'])}width="{$brand['image']['width']}"{/if}
                            {if !empty($brand['image']['height'])}height="{$brand['image']['height']}"{/if}
                        />
                    </a>
                </div>
            {/foreach}
        </div>
    </div>
{else}
    <div class="elementor-{$widget_type}{if !empty($alignment)} text-{$alignment}{/if}">
        <div class="elementor-{$widget_type}-carousel-wrapper swiper-overflow swiper-arrows-{$arrows_position} swiper-dots-{$dots_position}">
            <div class="swiper-container swiper swiper-elementor{if !empty($is_auto_mode)} swiper-elementor-auto{/if}" data-swiper-options='{$carousel_options|@json_encode nofilter}'>
                <div class="swiper-wrapper">
                    {foreach from=$brands item=brand name=brand_list}
                        <div class="swiper-slide">
                            <a href="{$brand['link']}" class="elementor-brand-item">
                                <img
                                    src="{$brand['image']['url']}"
                                    loading="lazy"
                                    alt="{$brand['name']|escape:'html':'UTF-8'}"
                                    {if !empty($brand['image']['width'])}width="{$brand['image']['width']}"{/if}
                                    {if !empty($brand['image']['height'])}height="{$brand['image']['height']}"{/if}
                                    class="swiper-lazy"
                                />
                            </a>
                        </div>
                    {/foreach}
                </div>
                <div class="swiper-bottom gap-2">
                    <div class="swiper-scrollbar flex-grow-1"></div>
                    <div class="hstack swiper-navigation">
                        <div class="swiper-button-prev">{if isset($arrow_prev_html) && $arrow_prev_html}{$arrow_prev_html nofilter}{/if}</div>
                        <div class="swiper-button-next">{if isset($arrow_next_html) && $arrow_next_html}{$arrow_next_html nofilter}{/if}</div>
                    </div>
                </div>
                <div class="swiper-pagination"></div>
            </div>
        </div>
    </div>
{/if}
