{if isset($heading) && is_array($heading)}
    {assign var='heading_text' value=$heading.text}
    {assign var='heading_link' value=$heading.link}
    {assign var='heading_classes' value=$heading.classes}
    {assign var='heading_tag' value=$heading.tag}
{/if}
<{$heading_tag} class="{if !empty($heading_classes)}{$heading_classes}{/if}">
    <span>{$heading_text}</span>
</{$heading_tag}>