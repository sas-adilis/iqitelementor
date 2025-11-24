<div class="elementor-btn-wrapper{if !empty($align)} elementor-align-{$align}{/if}">
    <a class="elementor-btn btn btn-{if $outline}outline-{/if}{$button_type}{if $size != 'default'} btn-{$size}{/if}{if !empty($hover_animation)} elementor-animation-{$hover_animation}{/if}{if !empty($icon)} elementor-align-icon-{$icon_align}{/if}"{if !empty($link.url)} href="{$link.url}"{if !empty($link.url)} target="_blank"{/if}{/if}>
        {if !empty($icon)}
            <i class="{$icon}"></i>
        {/if}
        <span class="elementor-button-text">{$text}</span>
    </a>
</div>