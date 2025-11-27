var InnerTabsBehavior = Marionette.Behavior.extend({

    onRenderCollection: function () {
        this.handleInnerTabs(this.view);
    },

    handleInnerTabs: function (parent) {
        var closedClass = 'elementor-tab-close',
            activeClass = 'elementor-tab-active';

        var tabsWrappers = parent.children.filter(function (view) {
            return view.model.get('type') === 'tabs';
        });

        _.each(tabsWrappers, function (wrapperView) {
            wrapperView.$el.find('.elementor-control-content').remove();

            var tabsWrapperId = wrapperView.model.get('name');

            var tabs = parent.children.filter(function (childView) {
                return childView.model.get('type') === 'tab' &&
                    childView.model.get('tabs_wrapper') === tabsWrapperId;
            });

            _.each(tabs, function (tabView, index) {

                wrapperView._addChildView(tabView);

                var tabId = tabView.model.get('name');

                tabView.$el
                    .off('click.iqiTab')
                    .on('click.iqiTab', function (event) {
                        event.preventDefault();
                        tabView.triggerMethod('control:tab:clicked');
                    });

                var controlsUnderTab = parent.children.filter(function (controlView) {
                    return controlView.model.get('inner_tab') === tabId;
                });

                if (index === 0) {
                    tabView.$el.addClass(activeClass);
                } else {
                    _.each(controlsUnderTab, function (controlView) {
                        controlView.$el.addClass(closedClass);
                    });
                }
            });
        });
    },

    onChildviewControlTabClicked: function (childView) {
        var closedClass = 'elementor-tab-close';
        var activeClass = 'elementor-tab-active';

        var clickedTabName = childView.model.get('name');
        var tabsWrapperId = childView.model.get('tabs_wrapper');

        var siblingTabs = this.view.children.filter(function (view) {
            return view.model.get('type') === 'tab' &&
                view.model.get('tabs_wrapper') === tabsWrapperId;
        });

        var tabNames = _.map(siblingTabs, function (view) {
            return view.model.get('name');
        });

        var childrenUnderTab = this.view.children.filter(function (view) {
            return _.contains(tabNames, view.model.get('inner_tab'));
        });

        _.each(siblingTabs, function (view) {
            view.$el.removeClass(activeClass);
        });

        childView.$el.addClass(activeClass);

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

module.exports = InnerTabsBehavior;