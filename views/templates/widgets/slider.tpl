{if !isset($widget_type)}{assign var='widget_type' value='unknow'}{/if}
<div class="elementor-{$widget_type}">
    <div class="elementor-{$widget_type}-carousel-wrapper swiper-overflow swiper-arrows-{$arrows_position}">
        <div class="swiper-container swiper elementor-brands-carousel" data-slider_options='{$carousel_options|@json_encode nofilter}'>
            <div class="swiper-wrapper">
                {block name='slides'}
                {/block}
            </div>
        </div>
    </div>
</div>