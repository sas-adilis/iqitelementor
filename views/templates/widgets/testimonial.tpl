{extends file="module:iqitelementor/views/templates/widgets/slider.tpl"}
{block name='slides'}
    {foreach from=$testimonials_list item=testimonial}
        <div class="swiper-slide">
            <div class="elementor-testimonial-wrapper">
                {if $testimonial.content}
                <div class="elementor-testimonial-content">
                    {$testimonial.content nofilter}
                </div>
                {/if}
                {if $testimonial.content}
                <div class="elementor-testimonial-name">
                    {$testimonial.name nofilter}
                </div>
                {/if}
            </div>
        </div>
    {/foreach}
{/block}