{if isset($button) && is_array($button)}
    {assign var='button_text' value=$button.button_text}
    {assign var='button_link' value=$button.button_link}
    {assign var='button_classes' value=$button.button_classes}
    {assign var='wrapper_classes' value=$button.wrapper_classes}
    {assign var='button_icon' value=$button.button_icon}
    {assign var='button_tag' value=$button.button_tag}
{/if}
<div class="{if !empty($wrapper_classes)}{$wrapper_classes}{/if}">
    <{$button_tag} class="{if !empty($button_classes)}{$button_classes}{/if}"{if !empty($button_link.url)} href="{$button_link.url}"{if !empty($button_link.is_external) && $button_link.is_external} target="_blank"{/if}{/if}>
        {if !empty($button_icon)}
            <i class="{$button_icon}"></i>
        {/if}
        <span class="elementor-button-text">{$button_text}</span>
    </{$button_tag}>
</div>