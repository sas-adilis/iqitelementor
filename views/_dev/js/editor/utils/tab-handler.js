var TabHandler = {
    init: function(view) {
        this.buildInnerTabs(view);
    },

    buildInnerTabs: function(parent) {
        var closedClass = 'elementor-tab-close',
            activeClass = 'elementor-tab-active',
            children   = parent.children.filter ? parent.children.filter.bind(parent.children) : null;

        if (!children) {
            console.warn('buildInnerTabs: parent.children does not support filter()', parent.children);
            return;
        }

        // 1) Wrapper "tabs" controls
        var tabsWrappers = parent.children.filter(function (view) {
            return view.model && view.model.get('type') === 'tabs';
        });

        _.each(tabsWrappers, function (wrapperView) {
            wrapperView.$el.find('.elementor-control-content').remove();
            var tabsWrapperId = wrapperView.model.get('name');

            var tabs = parent.children.filter(function (childView) {
                return childView.model
                    && childView.model.get('type') === 'tab'
                    && childView.model.get('tabs_wrapper') === tabsWrapperId;
            });

            _.each(tabs, function (tabView, index) {
                var tabId = tabView.model.get('name');

                tabView.$el
                    .off('click.iqiTab') // évite les doublons
                    .on('click.iqiTab', function (event) {
                        event.preventDefault();
                        // Fait remonter l'event vers le parent => childview:control:tab:clicked
                        tabView.triggerMethod('control:tab:clicked');
                    });

                // Attach the tab view under the wrapper
                if (typeof wrapperView._addChildView === 'function') {
                    wrapperView._addChildView(tabView);
                } else {
                    wrapperView.$el.append(tabView.$el);
                }

                // 3) All controls whose 'inner_tab' = this tab name
                var controlsUnderTab = parent.children.filter(function (controlView) {
                    return controlView.model && controlView.model.get('inner_tab') === tabId;
                });

                if (index === 0) {
                    // First tab is active
                    tabView.$el.addClass(activeClass);
                } else {
                    // Hide controls of non-active tabs
                    _.each(controlsUnderTab, function (controlView) {
                        controlView.$el.addClass(closedClass);
                    });
                }
            });
        });
    }
}

module.exports = TabHandler;