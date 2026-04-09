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
                {if $testimonial.name}
                <div class="elementor-testimonial-name">
                    {$testimonial.name nofilter}
                    {if $show_notes}
                        <div class="elementor-testimonial-note">
                            {for $i=1 to 5}
                            <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 0L9.875 5L15 5.75L11.25 9.625L12.125 15L7.5 12.375L2.875 15L3.75 9.625L0 5.75L5.25 5L7.5 0Z" fill="{if $testimonial.note >= $i}currentColor{else}transparent{/if}"></path>
                                <path d="M7.5 0L9.875 5L15 5.75L11.25 9.625L12.125 15L7.5 12.375L2.875 15L3.75 9.625L0 5.75L5.25 5L7.5 0Z" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"></path>
                            </svg>
                            {/for}
                        </div>
                    {/if}
                </div>
                {/if}
            </div>
        </div>
    {/foreach}
{/block}