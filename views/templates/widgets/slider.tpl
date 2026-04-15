{if !isset($widget_type)}{assign var='widget_type' value='unknow'}{/if}
{if !isset($dots_position)}{assign var='dots_position' value='below'}{/if}
<div class="elementor-{$widget_type}">
    <div class="elementor-{$widget_type}-carousel-wrapper swiper-overflow swiper-arrows-{$arrows_position} swiper-dots-{$dots_position}">
        <div class="swiper-container swiper swiper-elementor{if !empty($is_auto_mode)} swiper-elementor-auto{/if}" data-swiper-options='{$carousel_options|@json_encode nofilter}'>
            <div class="swiper-wrapper">
                {block name='slides'}
                {/block}
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