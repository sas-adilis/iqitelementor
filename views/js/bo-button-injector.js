/**
 * iqitelementor — central back-office button injector.
 *
 * Reads `window.iqitElementorBoPlacements` produced by
 * IqitElementor\BackOffice\EditorButton on the server side. Each entry is a
 * button declaration tied to a form field:
 *
 *   { id, fieldSelector, label, url, target, fallback }
 *
 * For every declaration, the injector looks up the field in the DOM, walks
 * up to its enclosing `.form-group` (or falls back to the field element
 * itself) and appends either a button or a "save first" alert below it.
 */
(function () {
    var defs = window.iqitElementorBoPlacements;
    if (!Array.isArray(defs) || defs.length === 0) {
        return;
    }

    var run = function () { defs.forEach(inject); };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

    function inject(def) {
        if (!def || !def.fieldSelector) {
            return;
        }

        var field = document.querySelector(def.fieldSelector);
        if (!field) {
            return;
        }

        var marker = 'data-iqit-btn-id';

        // Dedupe: skip if the same button has already been injected anywhere.
        if (document.querySelector('[' + marker + '="' + def.id + '"]')) {
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.setAttribute(marker, def.id);
        wrapper.style.marginTop = '8px';
        wrapper.innerHTML = def.url ? buildButton(def) : buildFallback(def);

        if (def.placement === 'after-field') {
            // Insert the wrapper right after the field element itself, so it
            // sits inside the field's own column instead of being pushed to
            // the bottom of the whole .form-group row.
            field.parentNode.insertBefore(wrapper, field.nextSibling);
        } else {
            var target = field.closest('.form-group') || field;
            target.appendChild(wrapper);
        }
    }

    function buildButton(def) {
        var targetAttr = def.target
            ? ' target="' + escapeHtml(def.target) + '" rel="noopener"'
            : '';

        return '<a href="' + escapeHtml(def.url) + '"'
            + ' class="m-b-2 m-r-1 btn pointer btn-edit-with-elementor"'
            + targetAttr + '>'
            + '<i class="icon-external-link"></i> '
            + escapeHtml(def.label)
            + '</a>';
    }

    function buildFallback(def) {
        var msg = def.fallback || 'Save first to enable page builder';
        return '<div class="alert alert-info"><p class="alert-text">'
            + escapeHtml(msg) + '</p></div>';
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(s == null ? '' : s)));
        return d.innerHTML;
    }
})();
