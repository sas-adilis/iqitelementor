/* global elementorFrontendConfig, jQuery, $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

// Load all handlers (each one self-registers via ElementsHandler.addHandler)
require('elementor-frontend/handlers/swiper');
require('elementor-frontend/handlers/global');
require('elementor-frontend/handlers/accordion');
require('elementor-frontend/handlers/alert');
require('elementor-frontend/handlers/counter');
require('elementor-frontend/handlers/tabs');
require('elementor-frontend/handlers/toggle');
require('elementor-frontend/handlers/progress');
require('elementor-frontend/handlers/video');
require('elementor-frontend/handlers/section');
require('elementor-frontend/handlers/lottie');
require('elementor-frontend/handlers/prestashop-search');
require('elementor-frontend/handlers/prestashop-contactform');
require('elementor-frontend/handlers/table-of-contents');

// YouTube API loader (used by section background video)
var isYTInserted = false;

function onYoutubeApiReady(callback) {
    if (!isYTInserted) {
        isYTInserted = true;
        var script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        var first = document.getElementsByTagName('script')[0];
        if (first && first.parentNode) {
            first.parentNode.insertBefore(script, first);
        }
    }

    if (window.YT && YT.loaded) {
        callback(YT);
    } else {
        setTimeout(function () {
            onYoutubeApiReady(callback);
        }, 350);
    }
}

// Backward compatibility — some templates/editor code reference window.elementorFrontend
window.elementorFrontend = {
    config: window.elementorFrontendConfig || {},
    isEditMode: function () {
        return !!(window.elementorFrontendConfig && window.elementorFrontendConfig.isEditMode);
    },
    getScopeWindow: function () {
        return this._scopeWindow || window;
    },
    setScopeWindow: function (scopeWindow) {
        this._scopeWindow = scopeWindow;
    },
    init: function () {
        this.config = window.elementorFrontendConfig || {};
    },
    elementsHandler: ElementsHandler,
    utils: {
        onYoutubeApiReady: onYoutubeApiReady
    },
    throttle: function (func, wait) {
        var timeout, context, args, result, previous = 0;

        var later = function () {
            previous = Date.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) {
                context = args = null;
            }
        };

        return function () {
            var now = Date.now(),
                remaining = wait - (now - previous);

            context = this;
            args = arguments;

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) {
                    context = args = null;
                }
            } else if (!timeout) {
                timeout = setTimeout(later, remaining);
            }

            return result;
        };
    }
};
