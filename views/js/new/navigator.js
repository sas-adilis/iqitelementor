;(function ($, Backbone, Marionette, elementor) {

    'use strict';

    /**
     * Helpers pour construire l'arbre des éléments à afficher dans le Navigator
     */
    function getElementorRootCollection() {
        if (window.elementor && elementor.elements && elementor.elements.each) {
            return elementor.elements;
        }
        // Fallback éventuel si ta version expose un autre objet
        if (window.elementor && elementor.elementsModel && elementor.elementsModel.each) {
            return elementor.elementsModel;
        }
        return null;
    }

    function getNavigatorElementTitle(model) {
        var elType   = model.get('elType') || model.get('el_type') || '';
        var settings = model.get('settings') || {};

        if (settings.navigator_title) {
            return settings.navigator_title;
        }
        if (settings.admin_label) {
            return settings.admin_label;
        }

        if (elType === 'section') {
            return (elementor.translate && elementor.translate('section')) || 'Section';
        }

        if (elType === 'column') {
            return (elementor.translate && elementor.translate('column')) || 'Column';
        }

        if (elType === 'widget') {
            var widgetType = model.get('widgetType') || settings.widgetType || '';
            if (widgetType) {
                return widgetType.charAt(0).toUpperCase() + widgetType.slice(1);
            }
            return 'Widget';
        }

        return elType || 'Element';
    }

    function buildNavigatorNodes(collection) {
        var nodes = [];

        if (!collection || !collection.each) {
            return new Backbone.Collection();
        }

        collection.each(function (model) {
            var childrenCollection = model.get('elements');
            var childrenNodes      = buildNavigatorNodes(childrenCollection);

            nodes.push(new Backbone.Model({
                id: model.id,
                elType: model.get('elType') || model.get('el_type') || '',
                title: getNavigatorElementTitle(model),
                icon: '', // à adapter si tu veux gérer des icônes spécifiques
                children: childrenNodes
            }));
        });

        return new Backbone.Collection(nodes);
    }

    function buildNavigatorRootCollection() {
        var root = getElementorRootCollection();
        return buildNavigatorNodes(root);
    }

    /**
     * Vue "vide" quand il n’y a rien à afficher dans le navigator
     * Utilise le template #tmpl-elementor-navigator__root--empty
     */
    var NavigatorEmptyView = Marionette.ItemView.extend({
        template: '#tmpl-elementor-navigator__root--empty'
    });

    /**
     * Vue d’un élément dans le navigator (section/colonne/widget)
     * Supporte la récursivité via LayoutView et une région enfants.
     */
    var NavigatorElementView = Marionette.LayoutView.extend({
        // Utilise le template d’un élément avec sa zone enfants
        template: '#tmpl-elementor-navigator__elements',

        tagName: 'div',

        className: 'elementor-navigator__item-wrapper',

        regions: {
            childrenRegion: '.elementor-navigator__elements'
        },

        ui: {
            toggle: '.elementor-navigator__element__list-toggle',
            header: '.elementor-navigator__element__title',
            title: '.elementor-navigator__item-title'
        },

        events: {
            'click @ui.toggle': 'onToggleClick',
            'click @ui.header': 'onHeaderClick'
        },

        triggers: {
            'click': 'navigator:item:click'
        },

        templateHelpers: function () {
            var data   = this.model.toJSON();
            var title  = data.title || data.id || 'Element';
            var elType = data.elType || '';
            var icon   = data.icon || '';

            return {
                title: title,
                elType: elType,
                icon: icon
            };
        },
        initialize: function () {
            // état d’expansion initial : ouvert par défaut
            this.isCollapsed = false;
        },
        onShow: function () {
            var children = this.model.get('children');

            if (children && children.length) {
                this.childrenRegion.show(new NavigatorElementsView({
                    collection: children
                }));
            } else {
                this.childrenRegion.empty();
            }
        },
        onToggleClick: function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleCollapsed();
        },

        onHeaderClick: function (e) {
            // Permet de toggler en cliquant sur toute la ligne d’en-tête
            e.preventDefault();
            e.stopPropagation();

            var elementId = this.model && this.model.get('id');

            if (!elementId) {
                return;
            }

            // Récupère l'iframe du preview Elementor
            var $iframe = jQuery('#elementor-preview-iframe');

            if (!$iframe.length || !$iframe[0].contentWindow) {
                return;
            }

            var iframeWindow = $iframe[0].contentWindow;
            var iframeDoc = $iframe[0].contentDocument || iframeWindow.document;

            if (!iframeDoc) {
                return;
            }

            // Trouve l'élément dans le preview via son data-id
            var $target = jQuery(iframeDoc).find('#elementor-element-' + elementId).first();

            if (!$target.length) {
                return;
            }

            // Vérifie si l'élément est visible dans la fenêtre de l'iframe
            var rect = $target[0].getBoundingClientRect();
            var inView = rect.top >= 0 && rect.bottom <= iframeWindow.innerHeight;

            // Si l'élément n'est pas visible, on scroll jusqu'à lui
            if (!inView) {
                if (typeof $target[0].scrollIntoView === 'function') {
                    $target[0].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                } else {
                    // Fallback si scrollIntoView n'est pas disponible
                    var scrollTop = rect.top + iframeWindow.pageYOffset - (iframeWindow.innerHeight / 2);
                    iframeWindow.scrollTo(0, scrollTop);
                }
            }

            // Simule un "vrai" clic souris sur l'élément dans le preview afin qu'Elementor le sélectionne
            try {
                var rectCenterX = rect.left + (rect.width / 2);
                var rectCenterY = rect.top + (rect.height / 2);

                var eventOptions = {
                    bubbles: true,
                    cancelable: true,
                    view: iframeWindow,
                    clientX: rectCenterX,
                    clientY: rectCenterY
                };

                var mouseDown, mouseUp, clickEv;

                if (typeof iframeWindow.MouseEvent === 'function') {
                    mouseDown = new iframeWindow.MouseEvent('mousedown', eventOptions);
                    mouseUp   = new iframeWindow.MouseEvent('mouseup', eventOptions);
                    clickEv   = new iframeWindow.MouseEvent('click', eventOptions);
                } else {
                    mouseDown = iframeDoc.createEvent('MouseEvents');
                    mouseDown.initMouseEvent('mousedown', true, true, iframeWindow, 1,
                        rectCenterX, rectCenterY, rectCenterX, rectCenterY,
                        false, false, false, false, 0, null);

                    mouseUp = iframeDoc.createEvent('MouseEvents');
                    mouseUp.initMouseEvent('mouseup', true, true, iframeWindow, 1,
                        rectCenterX, rectCenterY, rectCenterX, rectCenterY,
                        false, false, false, false, 0, null);

                    clickEv = iframeDoc.createEvent('MouseEvents');
                    clickEv.initMouseEvent('click', true, true, iframeWindow, 1,
                        rectCenterX, rectCenterY, rectCenterX, rectCenterY,
                        false, false, false, false, 0, null);
                }

                $target[0].dispatchEvent(mouseDown);
                $target[0].dispatchEvent(mouseUp);
                $target[0].dispatchEvent(clickEv);
            } catch (err) {
                // Fallback au cas où : on utilise quand même un trigger simple
                $target.trigger('click');
            }

            // Optionnel : toggle le collapsed pour ouvrir/fermer les enfants au clic sur le header
            this.toggleCollapsed();
        },

        toggleCollapsed: function () {
            this.isCollapsed = !this.isCollapsed;
            this.updateCollapsedState();
        },

        updateCollapsedState: function () {
            var children = this.model.get('children');
            var hasChildren = children && children.length;

            // Si pas d’enfants, on s’assure que tout est ouvert
            if (!hasChildren) {
                this.$el.removeClass('elementor-navigator__item--collapsed');

                var childrenRegion = this.getRegion('childrenRegion');
                if (childrenRegion && childrenRegion.$el) {
                    childrenRegion.$el.show();
                }

                return;
            }

            var childrenRegion2 = this.getRegion('childrenRegion');

            if (this.isCollapsed) {
                this.$el.addClass('elementor-navigator__item--collapsed');
                if (childrenRegion2 && childrenRegion2.$el) {
                    childrenRegion2.$el.hide();
                }
            } else {
                this.$el.removeClass('elementor-navigator__item--collapsed');
                if (childrenRegion2 && childrenRegion2.$el) {
                    childrenRegion2.$el.show();
                }
            }
        }
    });

    /**
     * Vue liste récursive des éléments du navigator
     */
    var NavigatorElementsView = Marionette.CollectionView.extend({
        tagName: 'div',
        className: 'elementor-navigator__elements-list',
        childView: NavigatorElementView,

        initialize: function () {
            // Exemple : tu peux écouter des events ici si nécessaire
        },

        toggleList: function (expand) {
            // TODO : implémenter expand/collapse si tu ajoutes des sous-niveaux
        },

        activateMouseInteraction: function () {
            // TODO : hover, surlignage des éléments dans le preview, etc.
        },

        deactivateMouseInteraction: function () {
            // TODO
        }
    });

    /**
     * Layout principal du Navigator (fenêtre intérieure)
     * Utilise le template #tmpl-elementor-navigator
     */
    var NavigatorLayoutView = Marionette.LayoutView.extend({
        template: '#tmpl-elementor-navigator',

        id: 'elementor-navigator__inner',

        regions: {
            elements: '#elementor-navigator__elements'
        },

        ui: {
            close: '#elementor-navigator__close',
            toggleAll: '#elementor-navigator__toggle-all'
        },

        events: {
            'click @ui.close': 'onCloseClick',
            'click @ui.toggleAll': 'onToggleAllClick'
        },

        initialize: function () {
            // Tu peux passer une collection à l’init si tu veux :
            // this.collection = this.getOption('collection') || new Backbone.Collection();
        },

        onShow: function () {
            // Pour l’instant on affiche une collection vide
            var collection = this.getOption('collection') || new Backbone.Collection();
            this.elements.show(new NavigatorElementsView({ collection: collection }));
        },

        onCloseClick: function (e) {
            e.preventDefault();
            this.$el.closest('#elementor-navigator')
                .removeClass('elementor-navigator--open')
                .hide();
        },

        onToggleAllClick: function (e) {
            e.preventDefault();
            var $btn = this.ui.toggleAll;
            var state = $btn.data('elementor-action') || 'expand';
            var nextState = state === 'expand' ? 'collapse' : 'expand';

            $btn.data('elementor-action', nextState);

            // Change éventuellement les icônes ici
            // $btn.find('i').toggleClass('eicon-collapse eicon-expand');

            // Propage à la vue de liste
            if (this.elements.currentView && this.elements.currentView.toggleList) {
                this.elements.currentView.toggleList(state === 'expand');
            }
        },

        activateElementsMouseInteraction: function () {
            if (this.elements.currentView &&
                this.elements.currentView.activateMouseInteraction) {
                this.elements.currentView.activateMouseInteraction();
            }
        },

        deactivateElementsMouseInteraction: function () {
            if (this.elements.currentView &&
                this.elements.currentView.deactivateMouseInteraction) {
                this.elements.currentView.deactivateMouseInteraction();
            }
        }
    });

    /**
     * Region Navigator : gère la fenêtre, la position, la taille, drag/resize et storage
     */
    var NavigatorRegion = Marionette.Region.extend({
        storageKey: 'iqit_elementor_navigator',

        initialize: function () {
            Marionette.Region.prototype.initialize.apply(this, arguments);
            this.storageSizeKeys = ['top', 'left', 'width', 'height'];
        },

        showLayout: function (options) {
            options = options || {};
            this.show(new NavigatorLayoutView(options));
            this.makeDraggableResizable();
            this.restoreState();
        },

        getState: function () {
            try {
                var raw = window.localStorage.getItem(this.storageKey);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },

        saveState: function () {
            if (!this.$el || !this.$el.length) {
                return;
            }

            var pos = this.$el.position();
            var state = {
                top: pos.top,
                left: pos.left,
                width: this.$el.outerWidth(),
                height: this.$el.outerHeight()
            };

            try {
                window.localStorage.setItem(this.storageKey, JSON.stringify(state));
            } catch (e) {
                // ignore
            }
        },

        restoreState: function () {
            var state = this.getState();

            if (state) {
                this.$el.css({
                    top: state.top,
                    left: state.left,
                    width: state.width,
                    height: state.height
                });
            } else {
                this.$el.css({
                    top: '80px',
                    right: '40px'
                });
            }
        },

        makeDraggableResizable: function () {
            var self = this;
            var $el = this.$el;

            // Désactiver le menu contextuel
            $el.on('contextmenu', function (e) {
                e.preventDefault();
            });

            if ($.fn.draggable) {
                $el.draggable({
                    handle: '#elementor-navigator__header',
                    containment: 'window',
                    stop: function () {
                        self.saveState();
                    }
                });
            }


            if ($.fn.resizable) {
                $el.resizable({
                    handles: 's',
                    minWidth: 260,
                    minHeight: 200,
                    stop: function (event, ui) {
                        self.saveState();
                    }
                });
            } else if (window.console && console.warn) {
                console.warn('[Navigator] jQuery UI resizable is not available. The navigator window will not be resizable.');
            }
        }
    });

    /**
     * Manager Navigator : API simple côté global elementor.navigator
     */
    var NavigatorManager = function () {
        this.region = null;
    };

    NavigatorManager.prototype.init = function () {
        var $container = Backbone.$('#elementor-navigator');

        if (!$container.length) {
            $container = Backbone.$('<div>', {
                id: 'elementor-navigator',
                'class': 'elementor-navigator'
            }).appendTo(document.body);
        }

        this.region = new NavigatorRegion({ el: $container });
        this.region.showLayout({
            // On construit la collection à partir des éléments Elementor
            collection: buildNavigatorRootCollection()
        });
    };

    NavigatorManager.prototype.toggle = function () {
        if (!this.region) {
            this.init();
        }

        var $el = this.region.$el;
        var isOpen = $el.hasClass('elementor-navigator--open');

        if (isOpen) {
            $el.removeClass('elementor-navigator--open').hide();
        } else {
            $el.addClass('elementor-navigator--open').show();
        }
    };

    NavigatorManager.prototype.open = function () {
        if (!this.region) {
            this.init();
        }

        this.region.$el.addClass('elementor-navigator--open').show();
    };

    NavigatorManager.prototype.close = function () {
        if (!this.region) {
            return;
        }

        this.region.$el.removeClass('elementor-navigator--open').hide();
    };

    // Expose un objet global propre
    elementor.navigator = new NavigatorManager();

    /**
     * Helper : initialiser automatiquement le Navigator après le chargement du preview
     * (optionnel, tu peux aussi l’appeler manuellement depuis ton footer)
     */
    elementor.on('preview:loaded', function () {
        // Si tu veux qu’il ne se crée qu’au clic, commente cette ligne :
        // elementor.navigator.init();
    });

})(jQuery, Backbone, Marionette, window.elementor);