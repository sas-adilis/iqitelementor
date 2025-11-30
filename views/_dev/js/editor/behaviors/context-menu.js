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

        // Hook global façon Elementor : elements/context-menu/groups
        /*if (elementor && elementor.hooks && elementor.hooks.applyFilters) {
            groups = elementor.hooks.applyFilters(
                'elements/context-menu/groups',
                groups,
                view.model || null
            ) || groups;
        }*/

        if (!groups.length) {
            return;
        }

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