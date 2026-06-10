{if isset($button) && is_array($button)}
    {assign var='button_text' value=$button.button_text}
    {assign var='button_link' value=$button.button_link}
    {assign var='button_classes' value=$button.button_classes}
    {assign var='wrapper_classes' value=$button.wrapper_classes}
    {assign var='button_icon_html' value=$button.button_icon_html|default:''}
    {assign var='button_icon_align' value=$button.button_icon_align|default:'left'}
    {assign var='button_tag' value=$button.button_tag}
{/if}
<div class="{if !empty($wrapper_classes)}{$wrapper_classes}{/if}">
    <{$button_tag} class="{if !empty($button_classes)}{$button_classes}{/if}"{if !empty($button_link.url)} href="{$button_link.url}"{if !empty($button_link.attributes)}{$button_link.attributes nofilter}{/if}{/if}>
        {if !empty($button_icon_html) && $button_icon_align === 'left'}
            <span class="elementor-btn-icon elementor-align-icon-left">{$button_icon_html nofilter}</span>
        {/if}
        <span class="elementor-btn-text">{$button_text}</span>
        {if !empty($button_icon_html) && $button_icon_align === 'right'}
            <span class="elementor-btn-icon elementor-align-icon-right">{$button_icon_html nofilter}</span>
        {/if}
    </{$button_tag}>
</div>