{assign var=random_id value=uniqid()}
<div class="accordion" id="accordion_{$random_id}" data-active-first="{$active_first|intval}" {if $faq}itemscope itemtype="https://schema.org/FAQPage"{/if}>
    {foreach from=$tabs item=$item key=$key}
        <div class="accordion-item" {if $faq}itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"{/if}>
            <h2 class="accordion-header accordion-icon-{$icon_align}">
                <button{if $faq} itemprop="name"{/if} class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_{$random_id}_{$key}" aria-expanded="{if $active_first && $key == 0}true{else}false{/if}" aria-controls="accordion_{$random_id}_{$key}">
                    {$item.tab_title}
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