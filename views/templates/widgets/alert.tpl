<div class="elementor-alert alert alert-{$alert_type}{if $show_dismiss} alert-dismissible fade show{/if}" role="alert">
    {if !empty($alert_title)}
        <strong class="elementor-alert-title">{$alert_title}</strong>
    {/if}
    {if !empty($alert_description)}
        <div class="elementor-alert-description">{$alert_description}</div>
    {/if}

    {if $show_dismiss}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="{l s='Close' mod='iqitelementor'}"></button>
    {/if}
</div>