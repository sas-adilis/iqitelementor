<{$wrapper_tag}
class="{$wrapper_class|escape:'html':'UTF-8'}"
{if $wrapper_href} href="{$wrapper_href|escape:'html':'UTF-8'}"{/if}
{if $wrapper_target} target="{$wrapper_target|escape:'html':'UTF-8'}"{/if}
{if $wrapper_rel} rel="{$wrapper_rel|escape:'html':'UTF-8'}"{/if}
>

{if $has_bg_image}
    <figure class="elementor-cta__bg-wrapper">
        <img src="{$bg_image_url|escape:'html':'UTF-8'}"
             alt=""
             class="elementor-cta__bg-image" />
    </figure>
{/if}

<div class="elementor-cta__inner">
    <div class="elementor-cta__content">

        {if $title}
        <{$title_tag} class="elementor-cta__title">
        {$title nofilter}
    </{$title_tag}>
    {/if}

    {if $description_text}
        <div class="elementor-cta__description">
            {$description_text nofilter}
        </div>
    {/if}

    {if $has_button && $button_text}
    <div class="elementor-cta__button-wrapper">
        <{$button_tag}
        class="{$button_class|escape:'html':'UTF-8'}"
        {if $button_href} href="{$button_href|escape:'html':'UTF-8'}"{/if}
        {if $button_target} target="{$button_target|escape:'html':'UTF-8'}"{/if}
        {if $button_rel} rel="{$button_rel|escape:'html':'UTF-8'}"{/if}
        >
        <span class="elementor-button-text">{$button_text nofilter}</span>
    </{$button_tag}>
</div>
{/if}

</div>
</div>
</{$wrapper_tag}>