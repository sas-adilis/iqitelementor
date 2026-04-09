{assign var=random_id value=uniqid()}

<div class="elementor-tabs">
    <ul class="nav nav-tabs mb-3" id="tabs_{$random_id}" role="tablist">
        {foreach $tabs as $key => $tab}
            <li class="nav-item" role="presentation">
                <button class="nav-link{if $key == 0} active{/if}" id="tabs_{$random_id}_{$key}" data-bs-toggle="tab" data-bs-target="#tabs_{$random_id}_{$key}_pane" type="button" role="tab" aria-controls="tabs_{$random_id}_{$key}_pane" aria-selected="{if $key == 0}true{else}false{/if}">
                    {$tab.tab_title}
                </button>
            </li>
        {/foreach}
    </ul>
    <div class="tab-content">
        {foreach $tabs as $key => $tab}
            <div class="tab-pane fade{if $key == 0}  show active{/if}" id="tabs_{$random_id}_{$key}_pane" role="tabpanel" aria-labelledby="tabs_{$random_id}_{$key}" tabindex="0">
                {$tab.tab_content nofilter}
            </div>
        {/foreach}
    </div>
</div>