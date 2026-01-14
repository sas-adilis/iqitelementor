<{$wrapper_tag}
class="{$wrapper_class|escape:'html':'UTF-8'}"
{if $wrapper_tag == 'a' && $has_link}
    href="{$link.url|escape:'html':'UTF-8'}"
    {if $link.is_external} target="_blank"{/if}
    {if $link.nofollow|default:false} rel="nofollow"{/if}
{/if}
>

    {if $has_bg_image}
        {if $link_click == 'button' && $wrapper_tag != 'a'}
           <a class="elementor-cta-bg-wrapper" href="{$link.url|escape:'html':'UTF-8'}" {if $link.is_external} target="_blank"{/if} {if $link.nofollow|default:false} rel="nofollow"{/if}>
        {else}
            <figure class="elementor-cta-bg-wrapper">
        {/if}
            <img src="{$bg_image_url|escape:'html':'UTF-8'}" alt="" class="elementor-cta-bg elementor-bg" />
        {if $link_click == 'button' && $wrapper_tag != 'a'}
            </a>
        {else}
            </figure>
        {/if}
    {/if}

    <div class="elementor-cta-content">
        {if !empty($heading.text)}
            <div class="elementor-cta-heading-wrapper elementor-content-item">
                {include file="module:iqitelementor/views/templates/widgets/heading.tpl" heading=$heading}
            </div>
        {/if}

        {if $description_text}
            <div class="elementor-cta-description elementor-content-item">
                {$description_text nofilter}
            </div>
        {/if}

        {if !empty($button.button_text)}
            <div class="elementor-cta-button-wrapper elementor-content-item">
                {include file="module:iqitelementor/views/templates/widgets/button.tpl" button=$button}
            </div>
        {/if}
    </div>
</{$wrapper_tag}>