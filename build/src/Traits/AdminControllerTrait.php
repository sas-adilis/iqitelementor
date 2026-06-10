<?php

namespace IqitElementor\Traits;

use IqitElementor\Enum\EntityType;
use IqitElementor\Manager\RevisionManager;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

trait AdminControllerTrait
{
    protected function buildHelper(): \HelperForm
    {
        $helper = new \HelperForm();

        $helper->module = $this->module;
        $helper->override_folder = 'iqitelementor/';
        $helper->identifier = $this->className;
        $helper->token = \Tools::getAdminTokenLite('Admin' . $this->name);
        $helper->languages = $this->_languages;
        $helper->currentIndex = $this->context->link->getAdminLink('Admin' . $this->name);
        $helper->default_form_language = $this->default_form_language;
        $helper->allow_employee_form_lang = $this->allow_employee_form_lang;
        $helper->toolbar_scroll = true;
        $helper->toolbar_btn = $this->initToolbar();

        return $helper;
    }

    protected function getWarningMultishopHtml(): string
    {
        if (\Shop::getContext() == \Shop::CONTEXT_GROUP || \Shop::getContext() == \Shop::CONTEXT_ALL) {
            return '<p class="alert alert-warning">'
                . $this->l('You cannot manage module from a "All Shops" or a "Group Shop" context, select directly the shop you want to edit')
                . '</p>';
        }

        return '';
    }

    protected function initMultishopContent(): bool
    {
        if (\Shop::getContext() == \Shop::CONTEXT_GROUP || \Shop::getContext() == \Shop::CONTEXT_ALL) {
            $this->context->smarty->assign([
                'content' => $this->getWarningMultishopHtml(),
            ]);

            return true;
        }

        return false;
    }

    /**
     * Render the autosave banner + revision panel HTML for a given entity.
     *
     * @return string HTML to append after the form
     */
    protected function renderRevisionPanel(string $entityType, int $entityId): string
    {
        if (!$entityId) {
            return '';
        }

        $revisionManager = new RevisionManager();
        $ajaxUrl = $this->context->link->getAdminLink('AdminIqitElementorEditor') . '&ajax=1';

        // Autosave banner
        $autosaveHtml = '';
        $autosaveInfo = $revisionManager->getAutosaveInfo($entityType, $entityId);
        if ($autosaveInfo !== null) {
            $autosaveDate = $autosaveInfo['autosave_at'];
            $autosaveHtml = '<div class="alert alert-warning iqit-autosave-banner" '
                . 'data-entity-type="' . htmlspecialchars($entityType, ENT_QUOTES, 'UTF-8') . '" '
                . 'data-entity-id="' . (int) $entityId . '">'
                . '<strong>' . $this->module->getTranslator()->trans('Autosave available', [], 'Modules.Iqitelementor.Admin') . '</strong> — '
                . sprintf(
                    $this->module->getTranslator()->trans('An automatic save from %s is available.', [], 'Modules.Iqitelementor.Admin'),
                    htmlspecialchars($autosaveDate, ENT_QUOTES, 'UTF-8')
                )
                . ' <button type="button" class="btn btn-warning btn-sm iqit-autosave-restore">'
                . $this->module->getTranslator()->trans('Restore', [], 'Modules.Iqitelementor.Admin')
                . '</button> '
                . '<button type="button" class="btn btn-default btn-sm iqit-autosave-dismiss">'
                . $this->module->getTranslator()->trans('Dismiss', [], 'Modules.Iqitelementor.Admin')
                . '</button>'
                . '</div>';
        }

        // Revision list
        $revisions = $revisionManager->getForEntity($entityType, $entityId);
        $count = count($revisions);
        $limit = $revisionManager->getLimit();

        $revisionRows = '';
        foreach ($revisions as $revision) {
            $label = $revision->label !== '' ? htmlspecialchars($revision->label, ENT_QUOTES, 'UTF-8') : '—';
            $revisionRows .= '<tr data-id="' . (int) $revision->id . '">'
                . '<td>' . htmlspecialchars($revision->created_at, ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td>' . $label . '</td>'
                . '<td class="text-right">'
                . '<button type="button" class="btn btn-default btn-xs iqit-revision-preview" data-id="' . (int) $revision->id . '">'
                . '<i class="icon-eye"></i> ' . $this->module->getTranslator()->trans('Preview', [], 'Modules.Iqitelementor.Admin')
                . '</button> '
                . '<button type="button" class="btn btn-danger btn-xs iqit-revision-delete" data-id="' . (int) $revision->id . '">'
                . '<i class="icon-trash"></i>'
                . '</button>'
                . '</td>'
                . '</tr>';
        }

        $revisionHtml = '<div class="panel iqit-revision-panel" '
            . 'data-entity-type="' . htmlspecialchars($entityType, ENT_QUOTES, 'UTF-8') . '" '
            . 'data-entity-id="' . (int) $entityId . '">'
            . '<div class="panel-heading">'
            . '<i class="icon-history"></i> '
            . $this->module->getTranslator()->trans('Revisions', [], 'Modules.Iqitelementor.Admin')
            . ' <span class="badge iqit-revision-counter">' . (int) $count . ' / ' . (int) $limit . '</span>'
            . '</div>';

        if ($count > 0) {
            $revisionHtml .= '<table class="table">'
                . '<thead><tr>'
                . '<th>' . $this->module->getTranslator()->trans('Date', [], 'Modules.Iqitelementor.Admin') . '</th>'
                . '<th>' . $this->module->getTranslator()->trans('Label', [], 'Modules.Iqitelementor.Admin') . '</th>'
                . '<th class="text-right">' . $this->module->getTranslator()->trans('Actions', [], 'Modules.Iqitelementor.Admin') . '</th>'
                . '</tr></thead>'
                . '<tbody>' . $revisionRows . '</tbody>'
                . '</table>';
        } else {
            $revisionHtml .= '<p class="text-muted" style="padding:10px;">'
                . $this->module->getTranslator()->trans('No revisions yet.', [], 'Modules.Iqitelementor.Admin')
                . '</p>';
        }

        $revisionHtml .= '</div>';

        // Inline JS for AJAX interactions
        $js = '<script type="text/javascript">'
            . '(function(){'
            . 'var ajaxUrl = ' . json_encode($ajaxUrl) . ';'
            . 'var entityType = ' . json_encode($entityType) . ';'
            . 'var entityId = ' . (int) $entityId . ';'
            . 'document.addEventListener("click", function(e){'
            . '  var t = e.target.closest ? e.target : e.target.parentElement;'
            . '  if(!t) return;'
            // Autosave dismiss
            . '  if(t.closest && t.closest(".iqit-autosave-dismiss")){'
            . '    e.preventDefault();'
            . '    var xhr = new XMLHttpRequest();'
            . '    xhr.open("POST", ajaxUrl + "&action=ClearAutosave");'
            . '    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");'
            . '    xhr.onload = function(){ if(xhr.status===200){ t.closest(".iqit-autosave-banner").style.display="none"; }};'
            . '    xhr.send("entity_type="+entityType+"&entity_id="+entityId);'
            . '  }'
            // Autosave restore — show content in a modal/alert
            . '  if(t.closest && t.closest(".iqit-autosave-restore")){'
            . '    e.preventDefault();'
            . '    var xhr = new XMLHttpRequest();'
            . '    xhr.open("POST", ajaxUrl + "&action=GetAutosave");'
            . '    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");'
            . '    xhr.onload = function(){'
            . '      if(xhr.status===200){'
            . '        var resp = JSON.parse(xhr.responseText);'
            . '        if(resp.success && resp.content){'
            . '          var dataField = document.querySelector("textarea[name^=data], input[name^=data]");'
            . '          if(dataField){ dataField.value = resp.content; }'
            . '          alert(' . json_encode($this->module->getTranslator()->trans('Autosave content restored. Please save the form to persist changes.', [], 'Modules.Iqitelementor.Admin')) . ');'
            . '          t.closest(".iqit-autosave-banner").style.display="none";'
            . '        }'
            . '      }'
            . '    };'
            . '    xhr.send("entity_type="+entityType+"&entity_id="+entityId);'
            . '  }'
            // Revision preview
            . '  if(t.closest && t.closest(".iqit-revision-preview")){'
            . '    e.preventDefault();'
            . '    var btn = t.closest(".iqit-revision-preview");'
            . '    var revId = btn.getAttribute("data-id");'
            . '    var xhr = new XMLHttpRequest();'
            . '    xhr.open("POST", ajaxUrl + "&action=GetRevisionContent");'
            . '    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");'
            . '    xhr.onload = function(){'
            . '      if(xhr.status===200){'
            . '        var resp = JSON.parse(xhr.responseText);'
            . '        if(resp.success && resp.content){'
            . '          var w = window.open("","_blank","width=800,height=600");'
            . '          w.document.write("<pre style=\"white-space:pre-wrap;word-break:break-all;\">" + resp.content.replace(/</g,"&lt;") + "</pre>");'
            . '          w.document.title = "Revision #" + revId;'
            . '        }'
            . '      }'
            . '    };'
            . '    xhr.send("id_revision="+revId);'
            . '  }'
            // Revision delete
            . '  if(t.closest && t.closest(".iqit-revision-delete")){'
            . '    e.preventDefault();'
            . '    if(!confirm(' . json_encode($this->module->getTranslator()->trans('Delete this revision?', [], 'Modules.Iqitelementor.Admin')) . ')) return;'
            . '    var btn = t.closest(".iqit-revision-delete");'
            . '    var revId = btn.getAttribute("data-id");'
            . '    var row = btn.closest("tr");'
            . '    var xhr = new XMLHttpRequest();'
            . '    xhr.open("POST", ajaxUrl + "&action=DeleteRevision");'
            . '    xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");'
            . '    xhr.onload = function(){'
            . '      if(xhr.status===200){'
            . '        var resp = JSON.parse(xhr.responseText);'
            . '        if(resp.success && row){ row.parentNode.removeChild(row); }'
            . '      }'
            . '    };'
            . '    xhr.send("id_revision="+revId);'
            . '  }'
            . '});'
            . '})();'
            . '</script>';

        return $autosaveHtml . $revisionHtml . $js;
    }
}
