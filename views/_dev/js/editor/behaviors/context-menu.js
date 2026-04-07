const ContextMenuBehavior = Marionette.Behavior.extend({
    events: {
        // On écoute le clic droit sur la vue entière (tu peux restreindre si besoin)
        'contextmenu': 'onContextMenu',
        'click': 'onClick',
        'keydown': 'onKeyDown',
    },

    onClick(event) {
        if (Backbone.$(event.target).closest('.iqit-context-menu').length) {
            return;
        }
        // Trigger global pour fermer
        if (elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.trigger('context-menu:close');
        }
    },

    onKeyDown(event) {
        if (event.key === 'Escape' || event.keyCode === 27) {
            if (elementor.channels && elementor.channels.editor) {
                elementor.channels.editor.trigger('context-menu:close');
            }
        }
    },

    onContextMenu(event) {

        event.preventDefault();
        event.stopPropagation();

        const view = this.view;

        if (typeof view.getContextMenuGroups !== 'function') {
            return;
        }
        // Groupes propres à la vue
        let groups = view.getContextMenuGroups() || [];

        if (!groups.length) {
            return;
        }

        let coords = {
            clientX: event.clientX,
            clientY: event.clientY,
        };

        // Translater les coordonnées de l'iframe vers la fenêtre parente
        // Les vues Marionette tournent dans le contexte parent mais gèrent
        // des éléments dans l'iframe — window.frameElement est donc null.
        // On récupère l'iframe via elementor.$preview ou via le target de l'événement.
        var iframeEl = null;

        if (elementor && elementor.$preview && elementor.$preview.length) {
            iframeEl = elementor.$preview[0];
        } else if (event.target && event.target.ownerDocument && event.target.ownerDocument.defaultView) {
            var iframeWin = event.target.ownerDocument.defaultView;
            if (iframeWin.frameElement) {
                iframeEl = iframeWin.frameElement;
            }
        }

        if (iframeEl) {
            var iframeRect = iframeEl.getBoundingClientRect();
            coords = {
                clientX: event.clientX + iframeRect.left,
                clientY: event.clientY + iframeRect.top,
            };
        }

        event.realClientX = coords.clientX;
        event.realClientY = coords.clientY;

        // On délègue l’affichage au manager via le channel editor
        if (elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.trigger('context-menu:open', {
                event,
                view,
                groups,
            });
        }
    },
});

module.exports = ContextMenuBehavior;