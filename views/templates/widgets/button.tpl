{if isset($button) && is_array($button)}
    {assign var='text' value=$button.text}
    {assign var='link' value=$button.link}
    {assign var='button_classes' value=$button.button_classes}
    {assign var='wrapper_classes' value=$button.wrapper_classes}
    {assign var='icon' value=$button.icon}
    {assign var='button_tag' value=$button.button_tag}
{/if}
<div class="{if !empty($wrapper_classes)}{$wrapper_classes}{/if}">
    <{$button_tag} class="{if !empty($button_classes)}{$button_classes}{/if}"{if !empty($link.url)} href="{$link.url}"{if !empty($link.url)} target="_blank"{/if}{/if}>
        {if !empty($icon)}
            <i class="{$icon}"></i>
        {/if}
        <span class="elementor-button-text">{$text}</span>
    </{$button_tag}>
</div>