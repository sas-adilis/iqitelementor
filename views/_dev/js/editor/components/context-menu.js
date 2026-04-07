var ContextMenuView = Marionette.ItemView.extend( {
    tagName: 'div',
    className: 'iqit-context-menu',
    template: false, // On gère le HTML à la main

    ui: {
        list: '.iqit-context-menu-list'
    },

    events: {
        'click .iqit-context-menu-item': 'onItemClick'
    },

    initialize: function() {
        // Vue Marionette => même logique que Backbone.View, mais plus cohérente avec le reste
        this.context = null;

        this.$el.html( '<ul class="iqit-context-menu-list"></ul>' );
        Backbone.$( 'body' ).append( this.el );
        this.hide();

        // On écoute un channel de l’éditeur
        if ( elementor.channels && elementor.channels.editor ) {
            this.listenTo( elementor.channels.editor, 'context-menu:open', this.onOpen );
            this.listenTo( elementor.channels.editor, 'context-menu:close', this.hide.bind( this ) );
        }
    },

    onOpen: function( payload ) {
        var event  = payload.event,
            view   = payload.view,
            groups = payload.groups,
            menuX = event.realClientX,
            menuY = event.realClientY
        ;

        this.context = { event: event, view: view, groups: groups };
        this.renderMenu();

        // Positionner en fixed puis vérifier les limites de l'écran
        this.$el.css( {
            left: menuX,
            top: menuY,
            position: 'fixed'
        } ).show();

        // Empêcher le menu de sortir de l'écran
        var menuWidth = this.$el.outerWidth(),
            menuHeight = this.$el.outerHeight(),
            winWidth = Backbone.$(window).width(),
            winHeight = Backbone.$(window).height();

        if (menuX + menuWidth > winWidth) {
            menuX = winWidth - menuWidth - 5;
        }
        if (menuY + menuHeight > winHeight) {
            menuY = winHeight - menuHeight - 5;
        }

        this.$el.css({ left: menuX, top: menuY });
    },

    hide: function() {
        this.$el.hide();
        this.context = null;
    },

    renderMenu: function() {
        var $list = this.$( '.iqit-context-menu-list' );
        $list.empty();

        if ( ! this.context || ! this.context.groups ) {
            return;
        }


        this.context.groups.forEach( function( group ) {
            ( group.actions || [] ).forEach( function( action ) {

                // Ajouter un séparateur avant si demandé
                if (action.separator === 'before') {
                    $list.append('<li class="iqit-context-menu-separator"></li>');
                }

                var $item = Backbone.$('<li class="iqit-context-menu-item" />')
                    .attr('data-action', action.name)
                    .data('actionData', action);

                // Construire contenu avec icône si fournie
                var text = action.title || action.name;
                var iconHtml = action.icon ? '<span class="iqit-context-menu-icon">' + action.icon + '</span>' : '';

                $item.html(iconHtml + '<span class="iqit-context-menu-label">' + text + '</span>');

                $list.append( $item );
            } );
        } );
    },


    onItemClick: function( event ) {
        event.stopPropagation();

        var $item   = this.$( event.currentTarget ),
            action  = $item.data( 'actionData' ),
            context = this.context;

        if ( action && 'function' === typeof action.callback ) {
            action.callback( context );
        }

        this.hide();
    }
} );


let singletonInstance = null;

module.exports = function initContextMenu() {
    if (!singletonInstance) {
        singletonInstance = new ContextMenuView();
    }
}