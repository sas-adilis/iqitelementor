var ControlBaseItemView = require( 'elementor-views/controls/base' );

var ControlTabItemView = ControlBaseItemView.extend({
    childEvents: {
        'control:tab:clicked': 'onChildViewControlTabClicked'
    },

    onChildViewControlTabClicked: function (childView) {
        console.log('control:tab:clicked');

        var closedClass = 'elementor-tab-close';
        var activeClass = 'elementor-tab-active';

        var clickedTabName = childView.model.get('name');
        var tabsWrapperId = childView.model.get('tabs_wrapper');


        // Tous les “frères” Tab dans ce wrapper
        var siblingTabs = this.view.children.filter(function (view) {
            return view.model.get('type') === 'tab' &&
                view.model.get('tabs_wrapper') === tabsWrapperId;
        });

        // Liste des noms de tabs de ce wrapper
        var tabNames = _.map(siblingTabs, function (view) {
            return view.model.get('name');
        });

        // Tous les controls qui appartiennent à l'un de ces tabs (via inner_tab)
        var childrenUnderTab = this.view.children.filter(function (view) {
            return _.contains(tabNames, view.model.get('inner_tab'));
        });

        console.log('childrenUnderTab', childrenUnderTab);

        // Retire l'état actif de toutes les tabs de ce wrapper
        _.each(siblingTabs, function (view) {
            view.$el.removeClass(activeClass);
        });

        // Active la tab cliquée
        childView.$el.addClass(activeClass);

        // Affiche / masque les controls en fonction de inner_tab
        _.each(childrenUnderTab, function (view) {
            if (view.model.get('inner_tab') === clickedTabName) {
                view.$el.removeClass(closedClass);
            } else {
                view.$el.addClass(closedClass);
            }
        });

        elementor.getPanelView().updateScrollbar();
    }
});

module.exports = ControlTabItemView;