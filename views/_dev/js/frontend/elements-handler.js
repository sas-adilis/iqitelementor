var registeredSelectorHandlers = [];

var EH_DEBUG = false;

function ehLog() {
    if (!EH_DEBUG || typeof console === 'undefined' || typeof console.log !== 'function') {
        return;
    }
    console.log.apply(console, ['[ElementsHandler]'].concat([].slice.call(arguments)));
}

function hashSelector(str) {
    str = String(str || '');
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
}

var ElementsHandler = {
    _runHandlerOnElement: function ($element, handler, debugLabel, runKey) {
        var element = $element[0];
        ehLog('runHandler: start', {debugLabel: debugLabel, runKey: runKey, element: element});

        if (!element || typeof handler !== 'function') {
            ehLog('runHandler: aborted (no element or invalid handler)', {debugLabel: debugLabel, runKey: runKey});
            return;
        }

        var key = runKey ? String(runKey) : '';
        var doneAttr = key ? ('data-eh-done-' + key) : '';
        var pendingAttr = key ? ('data-eh-pending-' + key) : '';

        if (key) {
            if (element.hasAttribute(doneAttr) || element.hasAttribute(pendingAttr)) {
                ehLog('runHandler: skipped (already done/pending)', {debugLabel: debugLabel, runKey: runKey});
                return;
            }
            element.setAttribute(pendingAttr, '1');
            ehLog('runHandler: marked pending', {pendingAttr: pendingAttr, element: element});
        }

        var isEditMode = !!(window.elementorFrontendConfig && window.elementorFrontendConfig.isEditMode);

        if ('IntersectionObserver' in window && !isEditMode) {
            var observer = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        ehLog('[IO] intersecting -> will execute', {debugLabel: debugLabel, element: element});
                        if (key) {
                            element.removeAttribute(pendingAttr);
                            element.setAttribute(doneAttr, '1');
                        }
                        requestAnimationFrame(function () {
                            ehLog('runHandler: EXECUTE handler', {debugLabel: debugLabel, element: element});
                            handler.call($element, $);
                        });
                        obs.disconnect();
                    }
                });
            }, {
                root: null,
                threshold: 0.1
            });

            ehLog('runHandler: IntersectionObserver observe()', {debugLabel: debugLabel, element: element});
            observer.observe(element);
        } else {
            ehLog('runHandler: no IntersectionObserver -> immediate path', {debugLabel: debugLabel, element: element});
            if (key) {
                element.removeAttribute(pendingAttr);
                element.setAttribute(doneAttr, '1');
            }
            requestAnimationFrame(function () {
                ehLog('runHandler: EXECUTE handler', {debugLabel: debugLabel, element: element});
                handler.call($element, $);
            });
        }
    },

    _scheduleRerun: function ($scope) {
        if (typeof $ === 'undefined') {
            return;
        }
        ehLog('scheduleRerun: requested', {scope: $scope && $scope.length ? $scope.get(0) : null});

        var self = this;
        clearTimeout(this._rerunDebounceTimer);
        this._rerunDebounceTimer = setTimeout(function () {
            ehLog('scheduleRerun: timer fired');
            requestAnimationFrame(function () {
                ehLog('scheduleRerun: RAF -> runReadyTrigger');
                self.runReadyTrigger($scope && $scope.length ? $scope : $(document));
            });
        }, 0);
    },

    _startTemporaryMutationObserver: function (durationMs, $scope) {
        if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
            return;
        }
        if (!document.body) {
            return;
        }

        durationMs = durationMs || 1500;

        var self = this;
        var now = Date.now();
        var endAt = now + Math.max(0, durationMs | 0);
        self._mutationObserverEndAt = Math.max(self._mutationObserverEndAt || 0, endAt);

        if (self._mutationObserver) {
            ehLog('mutationObserver: already running -> extend window', {endAt: self._mutationObserverEndAt});
            return;
        }

        self._mutationObserver = new MutationObserver(function () {
            ehLog('mutationObserver: DOM mutated -> schedule rerun');
            self._scheduleRerun($scope && $scope.length ? $scope : $(document));
        });

        try {
            self._mutationObserver.observe(document.body, {childList: true, subtree: true});
            ehLog('mutationObserver: STARTED', {durationMs: durationMs, endAt: self._mutationObserverEndAt});
        } catch (e) {
            self._mutationObserver = null;
            return;
        }

        var stopLater = function () {
            if (!self._mutationObserver) {
                return;
            }
            if (Date.now() < (self._mutationObserverEndAt || 0)) {
                clearTimeout(self._mutationObserverStopTimer);
                self._mutationObserverStopTimer = setTimeout(stopLater, 100);
                return;
            }
            try {
                ehLog('mutationObserver: STOPPING');
                self._mutationObserver.disconnect();
            } catch (e) {
                // no-op
            }
            self._mutationObserver = null;
            ehLog('mutationObserver: STOPPED');
        };

        stopLater();
    },

    addHandler: function (selector, callback) {
        if (!selector || typeof callback !== 'function') {
            return;
        }

        registeredSelectorHandlers.push({
            selector: selector,
            callback: callback
        });

        if (typeof $ !== 'undefined') {
            var self = this;
            var runKey = hashSelector(selector);
            $(selector).each(function () {
                self._runHandlerOnElement($(this), callback, selector, runKey);
            });
        }
    },

    runReadyTrigger: function ($scope) {
        if (!$scope || !$scope.length) {
            return;
        }

        if (!registeredSelectorHandlers.length) {
            return;
        }

        ehLog('runReadyTrigger: start', {scope: $scope.get(0), handlersCount: registeredSelectorHandlers.length});

        var self = this;
        registeredSelectorHandlers.forEach(function (entry) {
            if (!entry.selector || typeof entry.callback !== 'function') {
                return;
            }
            ehLog('runReadyTrigger: apply selector', {selector: entry.selector});

            var runKey = hashSelector(entry.selector);

            if ($scope.is(entry.selector)) {
                self._runHandlerOnElement($scope, entry.callback, entry.selector, runKey);
            }

            $scope.find(entry.selector).each(function () {
                self._runHandlerOnElement($(this), entry.callback, entry.selector, runKey);
            });
        });
    },

    bindPrestaShopEvents: function () {
        if (this._psEventsBound) {
            return;
        }
        this._psEventsBound = true;
        ehLog('bindPrestaShopEvents: bound');

        if (typeof prestashop === 'undefined' || !prestashop || typeof prestashop.on !== 'function') {
            return;
        }

        var self = this;
        var rerun = function () {
            if (typeof $ === 'undefined') {
                return;
            }
            self._scheduleRerun($(document));
            self._startTemporaryMutationObserver(1500, $(document));
        };

        [
            'updateCart',
            'updatedCart',
            'changedCheckoutStep',
            'updateProductList',
            'updateFacets',
            'updatedProduct'
        ].forEach(function (evt) {
            prestashop.on(evt, function (e) {
                ehLog('prestashop event:', evt, e && e.reason ? {reason: e.reason} : e);
                rerun();
            });
        });
    }
};

// Auto-boot on page load (front office only, NOT in edit mode)
if (typeof window !== 'undefined') {
    var boot = function () {
        // Don't initialize in edit mode - the editor handles elements itself
        if (window.elementorFrontendConfig && window.elementorFrontendConfig.isEditMode) {
            return;
        }

        ehLog('boot: start (DOMContentLoaded)');
        try {
            ehLog('boot: bindPrestaShopEvents');
            ElementsHandler.bindPrestaShopEvents();
            if (typeof $ !== 'undefined') {
                requestAnimationFrame(function () {
                    ehLog('boot: initial RAF -> runReadyTrigger');
                    ElementsHandler.runReadyTrigger($(document));
                });
            }
        } catch (e) {
            // no-op
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}

module.exports = ElementsHandler;
