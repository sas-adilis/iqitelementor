{assign var='widget_id' value=uniqid('toc_')}
{assign var='list_tag' value=($marker_view == 'numbers') ? 'ol' : 'ul'}
<div class="elementor-toc elementor-toc--marker-{$marker_view}"
     data-widget-type="table-of-contents"
     data-list-tag="{$list_tag}"
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
