{assign var='widget_id' value=uniqid('toc_')}
{assign var='tags_json' value=','|implode:$headings_by_tags}
{assign var='list_tag' value=($marker_view == 'numbers') ? 'ol' : 'ul'}
<div class="elementor-toc elementor-toc--marker-{$marker_view}{if $hierarchical_view} elementor-toc--hierarchical{/if}"
     data-widget-type="table-of-contents"
     data-headings="{$tags_json|escape:'htmlall':'UTF-8'}"
     data-container="{$container|escape:'htmlall':'UTF-8'}"
     data-hierarchical="{$hierarchical_view|intval}"
     data-list-tag="{$list_tag}"
     data-no-headings-message="{$no_headings_message|escape:'htmlall':'UTF-8'}"
>
    <div class="elementor-toc__header">
        <{$html_tag} class="elementor-toc__header-title">
            {$title|escape:'htmlall':'UTF-8'}
        </{$html_tag}>
    </div>
    <div class="elementor-toc__body" id="{$widget_id}">
        <div class="elementor-toc__spinner-container">
            <i class="elementor-toc__spinner fa fa-spinner fa-spin" aria-hidden="true"></i>
        </div>
    </div>
</div>
