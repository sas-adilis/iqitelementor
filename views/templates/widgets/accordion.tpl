{assign var=random_id value=uniqid()}
<div class="accordion accordion-style-{$border_style}{if $icon_type != 'default'} accordion-custom-icon accordion-icon-type-{$icon_type}{/if}" id="accordion_{$random_id}" data-active-first="{$active_first|intval}" {if $faq}itemscope itemtype="https://schema.org/FAQPage"{/if}>
    {foreach from=$tabs item=$item key=$key}
        <div class="accordion-item" {if $faq}itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"{/if}>
            <h2 class="accordion-header accordion-icon-{$icon_align}">
                <button{if $faq} itemprop="name"{/if} class="accordion-button{if !$active_first || $key > 0} collapsed{/if}" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_{$random_id}_{$key}" aria-expanded="{if $active_first && $key == 0}true{else}false{/if}" aria-controls="accordion_{$random_id}_{$key}">
                    {if $icon_type == 'plus_minus'}
                        <span class="accordion-icon accordion-icon-{$icon_align}">
                            <span class="accordion-icon-open">+</span>
                            <span class="accordion-icon-close">&minus;</span>
                        </span>
                    {elseif $icon_type == 'custom'}
                        <span class="accordion-icon accordion-icon-{$icon_align}">
                            <span class="accordion-icon-open">{$icon_open_html nofilter}</span>
                            <span class="accordion-icon-close">{$icon_close_html nofilter}</span>
                        </span>
                    {/if}
                    <span class="accordion-button-text">{$item.tab_title}</span>
                </button>
            </h2>
            <div id="accordion_{$random_id}_{$key}" class="accordion-collapse collapse {if $active_first && $key == 0}show{/if}" data-bs-parent="#accordion_{$random_id}"{if $faq} itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"{/if}>
                <div class="accordion-body"{if $faq} itemprop="text"{/if}>
                    {$item.tab_content nofilter}
                </div>
            </div>
        </div>
    {/foreach}
</div>