<{$wrapper_tag}
class="{$wrapper_class|escape:'html':'UTF-8'}"
{if $wrapper_href} href="{$wrapper_href|escape:'html':'UTF-8'}"{/if}
{if $wrapper_target} target="{$wrapper_target|escape:'html':'UTF-8'}"{/if}
{if $wrapper_rel} rel="{$wrapper_rel|escape:'html':'UTF-8'}"{/if}
>

    {if $has_bg_image}
        <figure class="elementor-cta-bg-wrapper">
            <img src="{$bg_image_url|escape:'html':'UTF-8'}" alt="" class="elementor-cta-bg elementor-bg" />
        </figure>
    {/if}

    <div class="elementor-cta-content">
        {if $title}
            <{$title_tag} class="elementor-cta-title elementor-content-item">
            {$title nofilter}
            </{$title_tag}>
        {/if}

        {if $description_text}
            <div class="elementor-cta-description elementor-content-item">
                {$description_text nofilter}
            </div>
        {/if}

        {if !empty($button.text)}
            <div class="elementor-cta-button-wrapper elementor-content-item">
                {include file="module:iqitelementor/views/templates/widgets/button.tpl" button=$button}
            </div>
        {/if}
    </div>
</{$wrapper_tag}>