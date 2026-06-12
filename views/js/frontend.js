(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
/* global elementorFrontendConfig, jQuery, $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

// Load all handlers (each one self-registers via ElementsHandler.addHandler)
require('elementor-frontend/handlers/swiper');
require('elementor-frontend/handlers/global');
require('elementor-frontend/handlers/accordion');
require('elementor-frontend/handlers/alert');
require('elementor-frontend/handlers/counter');
require('elementor-frontend/handlers/tabs');
require('elementor-frontend/handlers/tabs-container');
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

},{"elementor-frontend/elements-handler":1,"elementor-frontend/handlers/accordion":3,"elementor-frontend/handlers/alert":4,"elementor-frontend/handlers/counter":5,"elementor-frontend/handlers/global":6,"elementor-frontend/handlers/lottie":7,"elementor-frontend/handlers/prestashop-contactform":8,"elementor-frontend/handlers/prestashop-search":9,"elementor-frontend/handlers/progress":10,"elementor-frontend/handlers/section":11,"elementor-frontend/handlers/swiper":12,"elementor-frontend/handlers/table-of-contents":13,"elementor-frontend/handlers/tabs":15,"elementor-frontend/handlers/tabs-container":14,"elementor-frontend/handlers/toggle":16,"elementor-frontend/handlers/video":17}],3:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-accordion', function () {
    var $accordion = $(this);
    var defaultActiveSection = $accordion.data('active-section') || 1;
    var activeFirst = $accordion.data('active-first');
    var $titles = $accordion.find('.elementor-accordion-title');

    function activateSection(sectionIndex) {
        var $active = $titles.filter('.active');
        var $requested = $titles.filter('[data-section="' + sectionIndex + '"]');
        var isRequestedActive = $requested.hasClass('active');

        $active.removeClass('active').next().slideUp();

        if (!isRequestedActive) {
            $requested.addClass('active').next().slideDown();
        }
    }

    if (activeFirst) {
        activateSection(defaultActiveSection);
    }

    $titles.on('click', function () {
        activateSection(this.dataset.section);
    });
});

},{"elementor-frontend/elements-handler":1}],4:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-alert-dismiss', function () {
    $(this).on('click', function () {
        $(this).parent().fadeOut();
    });
});

},{"elementor-frontend/elements-handler":1}],5:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-counter-number', function () {
    var $number = $(this);

    $number.waypoint(function () {
        $number.numerator({
            duration: $number.data('duration')
        });
    }, {offset: '90%'});
});

},{"elementor-frontend/elements-handler":1}],6:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-element[data-animation]', function () {
    var $element = $(this);
    var animation = $element.data('animation');

    if (!animation) {
        return;
    }

    $element.addClass('elementor-invisible').removeClass(animation);

    $element.waypoint(function () {
        $element.removeClass('elementor-invisible').addClass(animation);
    }, {offset: '90%'});
});

},{"elementor-frontend/elements-handler":1}],7:[function(require,module,exports){
/* global $, LottieInteractivity */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.lottie-animation', function () {
    var $player = $(this);

    if ($player.data('play') !== 'scroll') {
        return;
    }

    var offset = $player.data('offset') / 100;
    var container = $player.data('container') === 'body' ? 'body' : null;

    document.addEventListener('lottieLoaded', function () {
        if (typeof LottieInteractivity === 'undefined') {
            return;
        }

        LottieInteractivity.create({
            mode: 'scroll',
            player: $player[0],
            container: container,
            actions: [
                {
                    visibility: [offset, 1],
                    type: 'seek',
                    frames: [0, '100%']
                }
            ]
        });
    });
});

},{"elementor-frontend/elements-handler":1}],8:[function(require,module,exports){
/* global $, elementorFrontendConfig */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-contactform-wrapper', function () {
    var $wrapper = $(this);

    if (typeof elementorFrontendConfig === 'undefined' || !elementorFrontendConfig.ajax_csfr_token_url) {
        return;
    }

    // Load CSRF token
    $.ajax({
        url: elementorFrontendConfig.ajax_csfr_token_url,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (resp) {
            $wrapper.find('.js-csfr-token').replaceWith($(resp.preview));
        }
    });

    // Handle form submission via AJAX
    $wrapper.on('submit', '.js-elementor-contact-form', function (e) {
        e.preventDefault();
        var formData = new FormData($(this)[0]);

        $.ajax({
            url: $(this).attr('action'),
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function (resp) {
                $wrapper.find('.js-elementor-contact-norifcation-wrapper')
                    .replaceWith($(resp.preview).find('.js-elementor-contact-norifcation-wrapper'));
            }
        });
    });
});

},{"elementor-frontend/elements-handler":1}],9:[function(require,module,exports){
/* global $, prestashop */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.search-widget-autocomplete', function () {
    var $searchWidget = $(this);
    var $searchBox = $searchWidget.find('input[type=text]');
    var searchURL = $searchWidget.attr('data-search-controller-url');

    if (typeof prestashop === 'undefined' || !prestashop.blocksearch || !prestashop.blocksearch.initAutocomplete) {
        return;
    }

    prestashop.blocksearch.initAutocomplete($searchWidget, $searchBox, searchURL);
});

},{"elementor-frontend/elements-handler":1}],10:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-progress-bar', function () {
    var $bar = $(this);

    $bar.waypoint(function () {
        $bar.css('width', $bar.data('max') + '%');
    }, {offset: '90%'});
});

},{"elementor-frontend/elements-handler":1}],11:[function(require,module,exports){
/* global $, elementorFrontend */

/**
 * Background video handler for sections.
 * The slider-section part is now handled by the centralized swiper.js handler.
 */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-background-video-container', function () {
    var $container = $(this);
    var $video = $container.children('.elementor-background-video');

    if (!$video.length) {
        return;
    }

    var videoID = $video.data('video-id');
    var isYTVideo = false;
    var player;

    function calcVideoSize() {
        var containerWidth = $container.outerWidth();
        var containerHeight = $container.outerHeight();
        var aspectRatio = 16 / 9;
        var ratioWidth = containerWidth / aspectRatio;
        var ratioHeight = containerHeight * aspectRatio;
        var isWidthFixed = containerWidth / containerHeight > aspectRatio;

        return {
            width: isWidthFixed ? containerWidth : ratioHeight,
            height: isWidthFixed ? ratioWidth : containerHeight
        };
    }

    function changeVideoSize() {
        var $target = isYTVideo ? $(player.getIframe()) : $video;
        var size = calcVideoSize();
        $target.width(size.width).height(size.height);
    }

    if (videoID) {
        // YouTube background video
        isYTVideo = true;

        if (typeof elementorFrontend !== 'undefined' && elementorFrontend.utils) {
            elementorFrontend.utils.onYoutubeApiReady(function (YT) {
                setTimeout(function () {
                    player = new YT.Player($video[0], {
                        videoId: videoID,
                        events: {
                            onReady: function () {
                                player.mute();
                                changeVideoSize();
                                player.playVideo();
                            },
                            onStateChange: function (event) {
                                if (event.data === YT.PlayerState.ENDED) {
                                    player.seekTo(0);
                                }
                            }
                        },
                        playerVars: {
                            controls: 0,
                            autoplay: 1,
                            mute: 1,
                            showinfo: 0
                        }
                    });

                    $(window).on('resize', changeVideoSize);
                }, 1);
            });
        }
    } else {
        // Hosted video
        $video.one('canplay', changeVideoSize);
    }
});

},{"elementor-frontend/elements-handler":1}],12:[function(require,module,exports){
/* global Swiper, elementorFrontendConfig, $ */

/**
 * Centralized Swiper handler for ALL Elementor carousel types.
 *
 * Replaces the old per-widget carousel handlers:
 *   image-carousel, testimonial, prestashop-productlist,
 *   prestashop-productlisttabs, prestashop-brands, prestashop-blog,
 *   and the slider-section part of section.js
 *
 * Each carousel element stores its options in data-slider_options.
 * Navigation/pagination elements are searched in the closest widget wrapper.
 */

var ElementsHandler = require('elementor-frontend/elements-handler');

/** Set to true to enable Swiper debug logging in the console */
var SWIPER_DEBUG = true;

// When the theme provides Swiper core (not the bundle), modules must be passed
// explicitly. The theme exposes them on window.SwiperModules.
var SwiperModules = window.SwiperModules || null;

var SWIPER_SM_BREAKPOINT = 576;
var SWIPER_MD_BREAKPOINT = 768;
var SWIPER_LG_BREAKPOINT = 992;
var SWIPER_XL_BREAKPOINT = 1200;
var SWIPER_XXL_BREAKPOINT = 1400;
var SWIPER_BREAKPOINTS = ['XS', 'SM', 'MD', 'LG', 'XL', 'XXL'];
var SWIPER_LEGACY_BREAKPOINTS = ['Mobile', 'Tablet', 'Desktop'];

var CAROUSEL_SELECTORS = [
    '.swiper-elementor'
];

/**
 * Find the closest Elementor widget/element wrapper around the carousel.
 */
function getWidgetWrapper($carousel) {
    var $wrapper = $carousel.closest('.elementor-widget');
    if (!$wrapper.length) {
        $wrapper = $carousel.closest('.elementor-element');
    }
    if (!$wrapper.length) {
        $wrapper = $carousel.parent();
    }
    return $wrapper;
}

/**
 * Toggle arrow visibility when all slides are visible (both arrows disabled).
 */
function toggleArrows(swiperInstance) {
    if (!swiperInstance.navigation || !swiperInstance.navigation.nextEl || !swiperInstance.navigation.prevEl) {
        return;
    }

    var next = swiperInstance.navigation.nextEl;
    var prev = swiperInstance.navigation.prevEl;

    if (!next || !prev) {
        return;
    }

    var bothDisabled =
        next.classList.contains('swiper-button-disabled') &&
        prev.classList.contains('swiper-button-disabled');

    if (bothDisabled) {
        next.style.display = 'none';
        prev.style.display = 'none';
    } else {
        next.style.display = '';
        prev.style.display = '';
    }
}

/**
 * Helper: copy a Swiper option to breakpoint-suffixed variants
 * (XS/SM/MD/LG/XL/XXL + Mobile/Tablet/Desktop)
 */
function copyOptionToBreakpoints(options, key) {
    if (!options || typeof options !== 'object') return;
    if (typeof options[key] === 'undefined' || options[key] === null) return;

    var value = options[key];
    var suffixes = SWIPER_BREAKPOINTS.concat(SWIPER_LEGACY_BREAKPOINTS);

    for (var i = 0; i < suffixes.length; i++) {
        var targetKey = key + suffixes[i];
        if (typeof options[targetKey] === 'undefined' || options[targetKey] === null) {
            options[targetKey] = value;
        }
    }

    delete options[key];
}

/**
 * Helper: retro-compatibility (alias old option name -> new option name)
 */
function applyLegacyOption(options, legacyKey, newKey, includeResponsiveSuffixes) {
    if (!options || typeof options !== 'object') return;
    if (typeof includeResponsiveSuffixes === 'undefined') includeResponsiveSuffixes = true;

    var hasValue = function (v) { return !(typeof v === 'undefined' || v === null); };

    // Base key
    if (hasValue(options[legacyKey]) && !hasValue(options[newKey])) {
        options[newKey] = options[legacyKey];
    }
    delete options[legacyKey];

    if (!includeResponsiveSuffixes) return;

    // Suffix keys (XS/SM/MD/LG/XL/XXL + Mobile/Tablet/Desktop)
    var suffixes = SWIPER_BREAKPOINTS.concat(SWIPER_LEGACY_BREAKPOINTS);
    for (var i = 0; i < suffixes.length; i++) {
        var legacySuffixKey = legacyKey + suffixes[i];
        var newSuffixKey = newKey + suffixes[i];

        if (hasValue(options[legacySuffixKey])) {
            if (!hasValue(options[newSuffixKey])) {
                options[newSuffixKey] = options[legacySuffixKey];
            }

            delete options[legacySuffixKey];
        }
    }
}

function applyLegacyBreakPoints(options, key) {
    if (!options || typeof options !== 'object') return;
    var hasValue = function (v) { return !(typeof v === 'undefined' || v === null); };

    var mapping = {
        'Mobile': ['XS', 'SM'],
        'Tablet': ['MD'],
        'Desktop': ['LG', 'XL', 'XXL']
    };

    for (var i = 0; i < SWIPER_LEGACY_BREAKPOINTS.length; i++) {
        var suffix = SWIPER_LEGACY_BREAKPOINTS[i];
        var legacySuffixKey = key + suffix;
        var targets = mapping[suffix];

        for (var j = 0; j < targets.length; j++) {
            var newSuffixKey = key + targets[j];
            if (hasValue(options[legacySuffixKey])) {
                if (!hasValue(options[newSuffixKey])) {
                    options[newSuffixKey] = options[legacySuffixKey];
                }
            }
        }

        delete options[legacySuffixKey];
    }
}

/**
 * Main carousel initialization handler.
 */
function initCarousel() {
    var $carousel = $(this);
    var debugId = $carousel.closest('[data-id]').data('id') || $carousel.attr('class') || 'unknown';

    if (SWIPER_DEBUG) console.group('%c[Swiper] ' + debugId, 'color: #2196F3; font-weight: bold');
    if (SWIPER_DEBUG) console.log('Element:', $carousel[0]);

    if (typeof Swiper === 'undefined') {
        if (SWIPER_DEBUG) console.warn('Swiper library not loaded — aborting');
        if (SWIPER_DEBUG) console.groupEnd();
        return;
    }

    if (!$carousel.length) {
        if (SWIPER_DEBUG) console.warn('Carousel element not found — aborting');
        if (SWIPER_DEBUG) console.groupEnd();
        return;
    }

    // Handle arrows-outside layout
    if ($carousel.hasClass('arrows-outside') && !$carousel.parent().hasClass('swiper-arrows-wrapper')) {
        $carousel.wrap('<div class="swiper-arrows-wrapper"></div>');
        if ($carousel.find('.swiper-navigation').length) {
            $carousel.parent().append($carousel.find('.swiper-navigation'));
        }
    }

    // Handle lazy images in edit mode
    if (window.elementorFrontendConfig && elementorFrontendConfig.isEditMode) {
        $carousel.find('img[data-src]').each(function () {
            $(this).attr('src', $(this).data('src'));
        });
    }

    var savedOptions = $carousel.data('slider_options') || $carousel.data('swiper-options') || {};
    var $widget = getWidgetWrapper($carousel);

    if (SWIPER_DEBUG) console.log('Raw data-options:', JSON.parse(JSON.stringify(savedOptions)));
    if (SWIPER_DEBUG) console.log('Widget wrapper:', $widget[0]);
    if (SWIPER_DEBUG) console.log('Slides found:', $carousel.find('.swiper-slide').length);

    // Apply legacy option names
    applyLegacyOption(savedOptions, 'slidesToShow', 'slidesPerView');
    applyLegacyOption(savedOptions, 'slidesPerPage', 'slidesPerGroup');
    applyLegacyOption(savedOptions, 'dots', 'pagination');
    applyLegacyOption(savedOptions, 'arrows', 'navigation');

    // Apply legacy breakpoints (Mobile/Tablet/Desktop -> XS/SM/MD/LG/XL/XXL)
    applyLegacyBreakPoints(savedOptions, 'pagination');
    applyLegacyBreakPoints(savedOptions, 'navigation');
    applyLegacyBreakPoints(savedOptions, 'scrollbar');
    applyLegacyBreakPoints(savedOptions, 'spaceBetween');
    applyLegacyBreakPoints(savedOptions, 'slidesPerView');
    applyLegacyBreakPoints(savedOptions, 'slidesPerGroup');

    // Copy base options to all breakpoints
    copyOptionToBreakpoints(savedOptions, 'pagination');
    copyOptionToBreakpoints(savedOptions, 'navigation');
    copyOptionToBreakpoints(savedOptions, 'scrollbar');
    copyOptionToBreakpoints(savedOptions, 'spaceBetween');
    copyOptionToBreakpoints(savedOptions, 'slidesPerView');
    copyOptionToBreakpoints(savedOptions, 'slidesPerGroup');
    copyOptionToBreakpoints(savedOptions, 'loop');

    if (SWIPER_DEBUG) console.log('Normalized options (after legacy + breakpoint mapping):', JSON.parse(JSON.stringify(savedOptions)));

    var val = function (v, fallback) { return (v !== undefined && v !== null) ? v : fallback; };

    // Resolve DOM elements for navigation/pagination/scrollbar once
    var navPrevEl = (savedOptions.arrowsSelector && savedOptions.arrowsSelector[0]) || $carousel.find('.swiper-button-prev')[0];
    var navNextEl = (savedOptions.arrowsSelector && savedOptions.arrowsSelector[1]) || $carousel.find('.swiper-button-next')[0];
    var paginationEl = (savedOptions.paginationSelector && savedOptions.paginationSelector[0]) || $carousel.find('.swiper-pagination')[0];
    var scrollbarEl = (savedOptions.scrollbarSelector && savedOptions.scrollbarSelector[0]) || $carousel.find('.swiper-scrollbar')[0];

    var hasNavigation = !!(navPrevEl || navNextEl);
    var hasPagination = !!paginationEl;
    var hasScrollbar = !!scrollbarEl;

    // Navigation/pagination/scrollbar builders
    // Swiper 12: use false to skip module, or a config object to enable it (no 'enabled' key)
    var addIcons = savedOptions.addIcons !== undefined ? savedOptions.addIcons : true;

    var makeNavigation = function (enabled) {
        if (!enabled || !hasNavigation) return false;
        return {
            prevEl: navPrevEl,
            nextEl: navNextEl,
            addIcons: addIcons
        };
    };

    var makePagination = function (enabled) {
        if (!enabled || !hasPagination) return false;
        return {
            el: paginationEl,
            clickable: true
        };
    };

    var makeScrollbar = function (enabled) {
        if (!enabled || !hasScrollbar) return false;
        return {
            el: scrollbarEl
        };
    };

    // Build breakpoints first, then determine top-level module config
    var breakpointConfigs = {
        0: {
            loop: savedOptions.loopXS || false,
            spaceBetween: val(savedOptions.spaceBetweenXS, 8),
            slidesPerView: val(savedOptions.slidesPerViewXS, 2),
            slidesPerGroup: val(savedOptions.slidesPerGroupXS, 1)
        },
        576: {
            loop: savedOptions.loopSM || false,
            spaceBetween: val(savedOptions.spaceBetweenSM, 8),
            slidesPerView: val(savedOptions.slidesPerViewSM, 2),
            slidesPerGroup: val(savedOptions.slidesPerGroupSM, 1)
        },
        768: {
            loop: savedOptions.loopMD || false,
            spaceBetween: val(savedOptions.spaceBetweenMD, 15),
            slidesPerView: val(savedOptions.slidesPerViewMD, 3),
            slidesPerGroup: val(savedOptions.slidesPerGroupMD, 1)
        },
        992: {
            loop: savedOptions.loopLG || false,
            spaceBetween: val(savedOptions.spaceBetweenLG, 15),
            slidesPerView: val(savedOptions.slidesPerViewLG, 4),
            slidesPerGroup: val(savedOptions.slidesPerGroupLG, 1)
        },
        1200: {
            loop: savedOptions.loopXL || false,
            spaceBetween: val(savedOptions.spaceBetweenXL, 15),
            slidesPerView: val(savedOptions.slidesPerViewXL, 4),
            slidesPerGroup: val(savedOptions.slidesPerGroupXL, 1)
        },
        1400: {
            loop: savedOptions.loopXXL || false,
            spaceBetween: val(savedOptions.spaceBetweenXXL, 15),
            slidesPerView: val(savedOptions.slidesPerViewXXL, 5),
            slidesPerGroup: val(savedOptions.slidesPerGroupXXL, 1)
        }
    };

    // Check if ANY breakpoint enables navigation/pagination/scrollbar
    var bpNavKeys = ['navigationXS', 'navigationSM', 'navigationMD', 'navigationLG', 'navigationXL', 'navigationXXL'];
    var bpPagKeys = ['paginationXS', 'paginationSM', 'paginationMD', 'paginationLG', 'paginationXL', 'paginationXXL'];
    var bpScrKeys = ['scrollbarXS', 'scrollbarSM', 'scrollbarMD', 'scrollbarLG', 'scrollbarXL', 'scrollbarXXL'];

    var anyNavEnabled = false;
    var anyPagEnabled = false;
    var anyScrEnabled = false;

    for (var i = 0; i < bpNavKeys.length; i++) {
        if (savedOptions[bpNavKeys[i]]) anyNavEnabled = true;
        if (savedOptions[bpPagKeys[i]]) anyPagEnabled = true;
        if (savedOptions[bpScrKeys[i]]) anyScrEnabled = true;
    }

    // Only include modules in breakpoints that use them, and only when at least one BP needs it
    var bpKeys = [0, 576, 768, 992, 1200, 1400];
    var bpNavVals = [savedOptions.navigationXS, savedOptions.navigationSM, savedOptions.navigationMD, savedOptions.navigationLG, savedOptions.navigationXL, savedOptions.navigationXXL];
    var bpPagVals = [savedOptions.paginationXS, savedOptions.paginationSM, savedOptions.paginationMD, savedOptions.paginationLG, savedOptions.paginationXL, savedOptions.paginationXXL];
    var bpScrVals = [savedOptions.scrollbarXS, savedOptions.scrollbarSM, savedOptions.scrollbarMD, savedOptions.scrollbarLG, savedOptions.scrollbarXL, savedOptions.scrollbarXXL];

    for (var j = 0; j < bpKeys.length; j++) {
        if (anyNavEnabled) breakpointConfigs[bpKeys[j]].navigation = makeNavigation(bpNavVals[j]);
        if (anyPagEnabled) breakpointConfigs[bpKeys[j]].pagination = makePagination(bpPagVals[j]);
        if (anyScrEnabled) breakpointConfigs[bpKeys[j]].scrollbar = makeScrollbar(bpScrVals[j]);
    }

    // Responsive visibility classes: CSS shows navigation/pagination/scrollbar
    // only when the corresponding class is present on the carousel root.
    // - iq-has-*: static, at least one breakpoint enables the feature
    // - iq-*-on: dynamic, the CURRENT breakpoint enables the feature
    if (anyNavEnabled) $carousel.addClass('swiper-elementor-has-navigation');
    if (anyPagEnabled) $carousel.addClass('swiper-elementor-has-pagination');
    if (anyScrEnabled) $carousel.addClass('swiper-elementor-has-scrollbar');

    var suffixFromBp = function (bp) {
        bp = parseInt(bp, 10) || 0;
        if (bp >= 1400) return 'XXL';
        if (bp >= 1200) return 'XL';
        if (bp >= 992) return 'LG';
        if (bp >= 768) return 'MD';
        if (bp >= 576) return 'SM';
        return 'XS';
    };

    var updateResponsiveClasses = function (swiper) {
        var suffix = suffixFromBp(swiper && swiper.currentBreakpoint);
        $carousel
            .toggleClass('swiper-elementor-nav-on', !!savedOptions['navigation' + suffix])
            .toggleClass('swiper-elementor-pag-on', !!savedOptions['pagination' + suffix])
            .toggleClass('swiper-elementor-scr-on', !!savedOptions['scrollbar' + suffix]);
    };

    var isEditMode = !!(window.elementorFrontendConfig && elementorFrontendConfig.isEditMode);

    // Build the modules array when the theme provides Swiper core (not the bundle)
    var modules = [];
    if (SwiperModules) {
        if (SwiperModules.Navigation) modules.push(SwiperModules.Navigation);
        if (SwiperModules.Pagination) modules.push(SwiperModules.Pagination);
        if (SwiperModules.Scrollbar) modules.push(SwiperModules.Scrollbar);
        if (SwiperModules.Autoplay && savedOptions.autoplay) modules.push(SwiperModules.Autoplay);
        if (SwiperModules.Grid && savedOptions.itemsPerColumn && savedOptions.itemsPerColumn > 1) modules.push(SwiperModules.Grid);
        if (SwiperModules.EffectFade && savedOptions.fade) modules.push(SwiperModules.EffectFade);
    }

    var swiperOptions = {
        touchEventsTarget: 'container',
        watchOverflow: true,
        navigation: anyNavEnabled ? makeNavigation(true) : false,
        pagination: anyPagEnabled ? makePagination(true) : false,
        scrollbar: anyScrEnabled ? makeScrollbar(true) : false,
        speed: savedOptions.speed || 300,
        breakpoints: breakpointConfigs,
        on: {
            init: function () {
                updateResponsiveClasses(this);
                toggleArrows(this);
            },
            slideChange: function () {
                toggleArrows(this);
            },
            breakpoint: function () {
                updateResponsiveClasses(this);
                toggleArrows(this);
            }
        }
    };

    // Inject modules when using Swiper core (not the bundle)
    if (modules.length) {
        swiperOptions.modules = modules;
    }

    // Direction
    if (savedOptions.direction && (savedOptions.direction === 'vertical' || savedOptions.direction === 'horizontal')) {
        swiperOptions.direction = savedOptions.direction;
    }

    // Auto height
    if (savedOptions.autoHeight) {
        swiperOptions.autoHeight = true;
    }

    // Grid rows (products, brands)
    if (savedOptions.itemsPerColumn && savedOptions.itemsPerColumn > 1) {
        var gridConf = {fill: 'row', rows: savedOptions.itemsPerColumn};
        swiperOptions.grid = gridConf;
        if (swiperOptions.breakpoints[768]) swiperOptions.breakpoints[768].grid = gridConf;
        if (swiperOptions.breakpoints[992]) swiperOptions.breakpoints[992].grid = gridConf;
        if (swiperOptions.breakpoints[1200]) swiperOptions.breakpoints[1200].grid = gridConf;
        if (swiperOptions.breakpoints[1400]) swiperOptions.breakpoints[1400].grid = gridConf;
    }

    // Autoplay
    if (savedOptions.autoplay) {
        swiperOptions.autoplay = {
            delay: savedOptions.autoplaySpeed || 5000,
            pauseOnMouseEnter: savedOptions.pauseOnHover || false
        };
    }

    // Fade effect
    if (savedOptions.fade) {
        swiperOptions.effect = 'fade';
        swiperOptions.fadeEffect = {crossFade: true};
    }

    // Disable touch (section sliders)
    if (savedOptions.allowTouchMove === false) {
        swiperOptions.allowTouchMove = false;
    }

    // Initial slide
    if (savedOptions.initialSlide !== undefined && savedOptions.initialSlide !== null) {
        swiperOptions.initialSlide = parseInt(savedOptions.initialSlide, 10);
    }

    if (SWIPER_DEBUG) {
        console.log('Final Swiper config:', JSON.parse(JSON.stringify(swiperOptions, function (k, v) {
            // Skip DOM elements in navigation/pagination/scrollbar for cleaner output
            if (k === 'el' || k === 'nextEl' || k === 'prevEl') return v ? '[DOM element]' : null;
            return v;
        })));
        console.log('Navigation prevEl:', swiperOptions.navigation ? swiperOptions.navigation.prevEl : 'none');
        console.log('Navigation nextEl:', swiperOptions.navigation ? swiperOptions.navigation.nextEl : 'none');
        console.log('Pagination el:', swiperOptions.pagination ? swiperOptions.pagination.el : 'none');
    }


    var swiperInstance = new Swiper($carousel[0], swiperOptions);

    // Elementor editor: when user switches device preview mode, force swiper.update()
    // so breakpoints are re-evaluated against the new iframe width.
    // NOTE: this handler runs in the EDITOR window (not the iframe), so `window.elementor`
    // is directly accessible. The carousel DOM element lives in the iframe though, reachable
    // via $carousel[0].ownerDocument.defaultView.
    if (isEditMode) {
        var iframeWin = $carousel[0].ownerDocument && $carousel[0].ownerDocument.defaultView;

        // Root cause: Swiper's getBreakpoint() uses the global `matchMedia` from the
        // script's realm — i.e. the editor window, which stays desktop-sized.
        // We override it to use the IFRAME window's matchMedia, so breakpoints are
        // resolved against the preview viewport (which actually resizes with device mode).
        if (iframeWin && iframeWin !== window && typeof iframeWin.matchMedia === 'function') {
            swiperInstance.getBreakpoint = function (breakpoints, base, containerEl) {
                if (!breakpoints) return undefined;
                var list = Object.keys(breakpoints).map(function (p) {
                    if (typeof p === 'string' && p.indexOf('@') === 0) {
                        var minRatio = parseFloat(p.slice(1));
                        return { value: iframeWin.innerHeight * minRatio, point: p };
                    }
                    return { value: p, point: p };
                });
                list.sort(function (a, b) { return parseInt(a.value, 10) - parseInt(b.value, 10); });
                var currentBp;
                for (var i = 0; i < list.length; i++) {
                    var v = list[i].value;
                    if (base === 'window' || base === undefined) {
                        if (iframeWin.matchMedia('(min-width: ' + v + 'px)').matches) {
                            currentBp = list[i].point;
                        }
                    } else if (v <= containerEl.clientWidth) {
                        currentBp = list[i].point;
                    }
                }
                return currentBp || 'max';
            };
            if (SWIPER_DEBUG) console.log('[Swiper editor] ✓ getBreakpoint overridden to use iframe matchMedia');
        }

        var fireUpdate = function (source) {
            if (SWIPER_DEBUG) {
                console.group('%c[Swiper editor] device mode change (' + source + ')', 'color:#E91E63;font-weight:bold');
                console.log('Carousel:', debugId);
                console.log('iframe window.innerWidth:', iframeWin ? iframeWin.innerWidth : 'n/a');
                console.log('carousel container clientWidth:', $carousel[0].clientWidth);
                console.log('current slidesPerView:', swiperInstance ? swiperInstance.params.slidesPerView : 'n/a');
                console.log('current activeBreakpoint:', swiperInstance ? swiperInstance.currentBreakpoint : 'n/a');
                console.groupEnd();
            }
            if (!swiperInstance || swiperInstance.destroyed) return;
            setTimeout(function () {
                if (!swiperInstance || swiperInstance.destroyed) return;
                var before = {
                    width: swiperInstance.width,
                    slidesPerView: swiperInstance.params.slidesPerView,
                    breakpoint: swiperInstance.currentBreakpoint
                };
                // setBreakpoint() re-evaluates breakpoints against current window/container
                // width — update() alone does NOT trigger breakpoint re-evaluation.
                if (typeof swiperInstance.setBreakpoint === 'function') {
                    swiperInstance.setBreakpoint();
                }
                swiperInstance.update();
                if (SWIPER_DEBUG) {
                    console.group('%c[Swiper editor] update() called (' + source + ')', 'color:#4CAF50;font-weight:bold');
                    console.log('Carousel:', debugId);
                    console.log('iframe window.innerWidth:', iframeWin ? iframeWin.innerWidth : 'n/a');
                    console.log('carousel container clientWidth:', $carousel[0].clientWidth);
                    console.log('BEFORE:', before);
                    console.log('AFTER:', {
                        width: swiperInstance.width,
                        slidesPerView: swiperInstance.params.slidesPerView,
                        breakpoint: swiperInstance.currentBreakpoint
                    });
                    console.groupEnd();
                }
            }, 100);
        };

        // --- Diagnostic ---
        if (SWIPER_DEBUG) {
            console.group('%c[Swiper editor] binding diagnostics (' + debugId + ')', 'color:#FF9800;font-weight:bold');
            console.log('running in iframe?', window.parent !== window);
            console.log('iframeWin (from element):', !!iframeWin, iframeWin ? ('innerWidth=' + iframeWin.innerWidth) : '');
            console.log('window.elementor:', typeof window.elementor);
            console.log('window.elementor.channels:', window.elementor ? typeof window.elementor.channels : 'n/a');
            console.log('window.elementor.channels.deviceMode:', (window.elementor && window.elementor.channels) ? typeof window.elementor.channels.deviceMode : 'n/a');
            console.log('window.jQuery:', typeof window.jQuery);
            console.groupEnd();
        }

        // Strategy 1: Backbone.Radio channel (most reliable)
        try {
            if (window.elementor && window.elementor.channels && window.elementor.channels.deviceMode) {
                window.elementor.channels.deviceMode.on('change', function () {
                    fireUpdate('channel:deviceMode.change');
                });
                if (SWIPER_DEBUG) console.log('[Swiper editor] ✓ bound to elementor.channels.deviceMode change');
            } else if (SWIPER_DEBUG) {
                console.warn('[Swiper editor] ✗ elementor.channels.deviceMode not available');
            }
        } catch (e) {
            if (SWIPER_DEBUG) console.warn('[Swiper editor] ✗ channel bind failed:', e);
        }

        // Strategy 2: jQuery event on editor window
        try {
            if (window.jQuery) {
                window.jQuery(window).on('changedDeviceMode.iqitSwiper', function () {
                    fireUpdate('jquery:changedDeviceMode');
                });
                if (SWIPER_DEBUG) console.log('[Swiper editor] ✓ bound to window jQuery changedDeviceMode');
            } else if (SWIPER_DEBUG) {
                console.warn('[Swiper editor] ✗ jQuery not available');
            }
        } catch (e) {
            if (SWIPER_DEBUG) console.warn('[Swiper editor] ✗ jquery bind failed:', e);
        }

        // Strategy 3: resize event on the iframe window (where the carousel DOM lives)
        try {
            if (iframeWin && iframeWin !== window) {
                window.jQuery(iframeWin).on('resize.iqitSwiper', function () {
                    fireUpdate('iframeWin:resize');
                });
                if (SWIPER_DEBUG) console.log('[Swiper editor] ✓ bound to iframe window resize');
            }
        } catch (e) {
            if (SWIPER_DEBUG) console.warn('[Swiper editor] ✗ iframe resize bind failed:', e);
        }
    }

    if (SWIPER_DEBUG) {
        console.log('Swiper instance created');
        console.groupEnd();
    }
}

// Register the same handler for all carousel selectors
CAROUSEL_SELECTORS.forEach(function (selector) {
    ElementsHandler.addHandler(selector, initCarousel);
});

},{"elementor-frontend/elements-handler":1}],13:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

var ANCHOR_SELECTOR = '.elementor-toc-anchor[id][data-toc-title]';
var TOC_INIT_FLAG = 'data-toc-initialized';

function initToc(el) {
    if (!el || el.getAttribute(TOC_INIT_FLAG) === '1') {
        return;
    }
    el.setAttribute(TOC_INIT_FLAG, '1');

    var $toc = $(el);
    var $body = $toc.find('.elementor-toc__body');
    if (!$body.length) {
        return;
    }

    var trackingNamespace = '.iqitToc' + Math.random().toString(36).slice(2);

    function refresh() {
        var anchors = buildToc($toc, el, $body);
        setupActiveTracking($toc, anchors, trackingNamespace);
    }

    refresh();

    $toc.on('click', '.elementor-toc__list-item-text', function (e) {
        e.preventDefault();
        var href = $(this).attr('href');
        if (!href || href.charAt(0) !== '#') {
            return;
        }
        var target = document.getElementById(href.substring(1));
        if (!target) {
            return;
        }
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (history.pushState) {
            history.pushState(null, null, href);
        }
    });

    if (typeof MutationObserver === 'undefined') {
        return;
    }

    // Rebuild whenever anchors are added/removed/edited elsewhere in the page.
    // Cheap on the frontend (DOM is static after load) and necessary in the
    // Elementor editor iframe, where widgets are AJAX-rendered after the
    // initial scan.
    var rebuildTimer = null;
    var observer = new MutationObserver(function (mutations) {
        if (!document.body.contains(el)) {
            observer.disconnect();
            $(window).off(trackingNamespace);
            return;
        }
        var relevant = false;
        for (var i = 0; i < mutations.length; i++) {
            var target = mutations[i].target;
            if (!target || !el.contains(target)) {
                relevant = true;
                break;
            }
        }
        if (!relevant) {
            return;
        }
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(function () {
            if (!document.body.contains(el)) {
                observer.disconnect();
                $(window).off(trackingNamespace);
                return;
            }
            refresh();
        }, 250);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['id', 'data-toc-title']
    });
}

ElementsHandler.addHandler('.elementor-toc', function () {
    initToc(this instanceof Element ? this : this[0]);
});

// In the Elementor editor iframe, widgets are inserted via AJAX after
// DOMContentLoaded — ElementsHandler.addHandler only catches elements present
// at JS load time, so a late-inserted TOC widget would never get initialized.
// Run an extra observer to catch them. Idempotent thanks to the init flag.
(function bootstrapLateTocs() {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
        return;
    }

    function scan(root) {
        if (!root) {
            return;
        }
        var nodes = root.querySelectorAll ? root.querySelectorAll('.elementor-toc') : [];
        for (var i = 0; i < nodes.length; i++) {
            initToc(nodes[i]);
        }
    }

    function start() {
        if (!document.body) {
            return;
        }
        scan(document);

        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                if (!added || !added.length) {
                    continue;
                }
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType !== 1) {
                        continue;
                    }
                    if (node.classList && node.classList.contains('elementor-toc')) {
                        initToc(node);
                    }
                    scan(node);
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();

function buildToc($toc, el, $body) {
    var listTag = el.getAttribute('data-list-tag') || 'ul';

    var raw = document.querySelectorAll(ANCHOR_SELECTOR);
    var anchors = [];
    for (var i = 0; i < raw.length; i++) {
        var node = raw[i];
        if (el.contains(node)) {
            continue;
        }
        var id = node.getAttribute('id');
        var title = node.getAttribute('data-toc-title');
        if (!id || !title) {
            continue;
        }
        anchors.push({ node: node, id: id, title: title });
    }

    if (anchors.length === 0) {
        $body.empty();
        return anchors;
    }

    $body.html(buildFlatList(anchors, listTag));
    return anchors;
}

function buildFlatList(anchors, tag) {
    var html = '<' + tag + ' class="elementor-toc__list-wrapper">';
    for (var i = 0; i < anchors.length; i++) {
        html += '<li class="elementor-toc__list-item" data-target-id="' + escapeHtml(anchors[i].id) + '">'
            + '<a href="#' + escapeHtml(anchors[i].id) + '" class="elementor-toc__list-item-text">'
            + escapeHtml(anchors[i].title)
            + '</a>'
            + '</li>';
    }
    html += '</' + tag + '>';
    return html;
}

function setupActiveTracking($toc, anchors, namespace) {
    var ns = namespace || '.iqitToc';

    // Always detach the previous listener so a rebuild doesn't accumulate them
    // and doesn't keep tracking against a stale anchor list.
    $(window).off(ns);

    if (!anchors.length) {
        $toc.find('.elementor-toc__list-item').removeClass('elementor-toc__list-item--active');
        return;
    }

    var $items = $toc.find('.elementor-toc__list-item');
    var offset = 100;
    var ticking = false;

    function onScroll() {
        if (ticking) {
            return;
        }
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            updateActive();
        });
    }

    function updateActive() {
        var scrollY = window.pageYOffset;
        var activeIndex = -1;

        for (var i = anchors.length - 1; i >= 0; i--) {
            if (anchors[i].node.getBoundingClientRect().top + window.pageYOffset - offset <= scrollY) {
                activeIndex = i;
                break;
            }
        }

        $items.removeClass('elementor-toc__list-item--active');

        if (activeIndex >= 0 && activeIndex < $items.length) {
            var $active = $items.eq(activeIndex);
            $active.addClass('elementor-toc__list-item--active');
            scrollActiveIntoView($toc, $active);
        }
    }

    function scrollActiveIntoView($tocEl, $active) {
        if (window.innerWidth >= 768) {
            return;
        }
        var body = $tocEl.find('.elementor-toc__body').get(0);
        var item = $active.get(0);
        if (!body || !item) {
            return;
        }
        var target = item.offsetLeft - (body.clientWidth - item.offsetWidth) / 2;
        body.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }

    $(window).on('scroll' + ns, onScroll);
    updateActive();
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

},{"elementor-frontend/elements-handler":1}],14:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('[data-element_type="tabs"]', function () {
    var $wrapper = $(this);
    var $nav = $wrapper.find('> .elementor-tabs > .elementor-tabs-nav').first();
    var $content = $wrapper.find('> .elementor-tabs > .elementor-tabs-content').first();

    if (!$nav.length || !$content.length) {
        return;
    }

    var $titles = $nav.children('.elementor-tab-title');
    var $panes = $content.children('.elementor-tab-content');

    function activate(index) {
        index = parseInt(index, 10) || 0;

        $titles.removeClass('elementor-active').attr('aria-selected', 'false');
        $panes.removeClass('elementor-tab-active');

        var $title = $titles.filter('[data-tab="' + index + '"]');
        var $pane = $panes.filter('[data-tab-index="' + index + '"]');

        $title.addClass('elementor-active').attr('aria-selected', 'true');
        $pane.addClass('elementor-tab-active');
    }

    // Activate first tab by default (server already marks it active, this is a safety net)
    if (!$titles.filter('.elementor-active').length) {
        activate(0);
    }

    $titles.on('click', function (event) {
        event.preventDefault();
        activate(this.dataset.tab);
    });

    $titles.on('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate(this.dataset.tab);
        }
    });
});

},{"elementor-frontend/elements-handler":1}],15:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-tabs', function () {
    var $tabs = $(this);
    var defaultActiveTab = $tabs.data('active-tab') || 1;
    var $tabsTitles = $tabs.find('.elementor-tab-title');
    var $tabsContents = $tabs.find('.elementor-tab-content');
    var $active, $content;

    function activateTab(tabIndex) {
        if ($active) {
            $active.removeClass('active');
            $content.removeClass('active');
        }

        $active = $tabsTitles.filter('[data-tab="' + tabIndex + '"]');
        $active.addClass('active');
        $content = $tabsContents.filter('[data-tab="' + tabIndex + '"]');
        $content.addClass('active');
    }

    activateTab(defaultActiveTab);

    $tabsTitles.on('click', function () {
        activateTab(this.dataset.tab);
    });
});

},{"elementor-frontend/elements-handler":1}],16:[function(require,module,exports){
/* global $ */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('.elementor-toggle-title', function () {
    var $title = $(this);

    $title.on('click', function () {
        var $content = $title.next();

        if ($title.hasClass('active')) {
            $title.removeClass('active');
            $content.slideUp();
        } else {
            $title.addClass('active');
            $content.slideDown();
        }
    });
});

},{"elementor-frontend/elements-handler":1}],17:[function(require,module,exports){
/* global $, elementorFrontendConfig */

var ElementsHandler = require('elementor-frontend/elements-handler');

ElementsHandler.addHandler('[data-element_type="video"]', function () {
    var $widget = $(this);
    var $imageOverlay = $widget.find('.elementor-custom-embed-image-overlay');
    var $videoModalBtn = $widget.find('.elementor-video-open-modal').first();
    var $videoModal = $widget.find('.elementor-video-modal').first();
    var $video = $widget.find('.elementor-video').first();
    var $videoFrame = $widget.find('iframe');

    if ($imageOverlay.length) {
        $imageOverlay.on('click', function () {
            $imageOverlay.remove();

            if ($video.length) {
                $video[0].play();
                return;
            }

            if ($videoFrame.length) {
                var src = $videoFrame[0].src;
                $videoFrame[0].src = src.replace('autoplay=0', 'autoplay=1');
            }
        });
    }

    if (!$videoModalBtn.length) {
        return;
    }

    $videoModalBtn.on('click', function () {
        if ($video.length) {
            $video[0].play();
            return;
        }

        if ($videoFrame.length) {
            var src = $videoFrame[0].src;
            $videoFrame[0].src = src.replace('autoplay=0', 'autoplay=1');
        }
    });

    $videoModal.on('hide.bs.modal', function () {
        if ($video.length) {
            $video[0].pause();
            return;
        }

        if ($videoFrame.length) {
            var src = $videoFrame[0].src;
            $videoFrame[0].src = src.replace('autoplay=1', 'autoplay=0');
        }
    });
});

},{"elementor-frontend/elements-handler":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2Zyb250ZW5kLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9hY2NvcmRpb24uanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL2FsZXJ0LmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9jb3VudGVyLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9nbG9iYWwuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL2xvdHRpZS5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvcHJlc3Rhc2hvcC1jb250YWN0Zm9ybS5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvcHJlc3Rhc2hvcC1zZWFyY2guanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL3Byb2dyZXNzLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9zZWN0aW9uLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9zd2lwZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL3RhYmxlLW9mLWNvbnRlbnRzLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy90YWJzLWNvbnRhaW5lci5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvdGFicy5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvdG9nZ2xlLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy92aWRlby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgcmVnaXN0ZXJlZFNlbGVjdG9ySGFuZGxlcnMgPSBbXTtcblxudmFyIEVIX0RFQlVHID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVoTG9nKCkge1xuICAgIGlmICghRUhfREVCVUcgfHwgdHlwZW9mIGNvbnNvbGUgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBjb25zb2xlLmxvZyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIFsnW0VsZW1lbnRzSGFuZGxlcl0nXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59XG5cbmZ1bmN0aW9uIGhhc2hTZWxlY3RvcihzdHIpIHtcbiAgICBzdHIgPSBTdHJpbmcoc3RyIHx8ICcnKTtcbiAgICB2YXIgaGFzaCA9IDUzODE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSArIGhhc2gpICsgc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiAoaGFzaCA+Pj4gMCkudG9TdHJpbmcoMzYpO1xufVxuXG52YXIgRWxlbWVudHNIYW5kbGVyID0ge1xuICAgIF9ydW5IYW5kbGVyT25FbGVtZW50OiBmdW5jdGlvbiAoJGVsZW1lbnQsIGhhbmRsZXIsIGRlYnVnTGFiZWwsIHJ1bktleSkge1xuICAgICAgICB2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuICAgICAgICBlaExvZygncnVuSGFuZGxlcjogc3RhcnQnLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgcnVuS2V5OiBydW5LZXksIGVsZW1lbnQ6IGVsZW1lbnR9KTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwgdHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBhYm9ydGVkIChubyBlbGVtZW50IG9yIGludmFsaWQgaGFuZGxlciknLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgcnVuS2V5OiBydW5LZXl9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXkgPSBydW5LZXkgPyBTdHJpbmcocnVuS2V5KSA6ICcnO1xuICAgICAgICB2YXIgZG9uZUF0dHIgPSBrZXkgPyAoJ2RhdGEtZWgtZG9uZS0nICsga2V5KSA6ICcnO1xuICAgICAgICB2YXIgcGVuZGluZ0F0dHIgPSBrZXkgPyAoJ2RhdGEtZWgtcGVuZGluZy0nICsga2V5KSA6ICcnO1xuXG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShkb25lQXR0cikgfHwgZWxlbWVudC5oYXNBdHRyaWJ1dGUocGVuZGluZ0F0dHIpKSB7XG4gICAgICAgICAgICAgICAgZWhMb2coJ3J1bkhhbmRsZXI6IHNraXBwZWQgKGFscmVhZHkgZG9uZS9wZW5kaW5nKScsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBydW5LZXk6IHJ1bktleX0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKHBlbmRpbmdBdHRyLCAnMScpO1xuICAgICAgICAgICAgZWhMb2coJ3J1bkhhbmRsZXI6IG1hcmtlZCBwZW5kaW5nJywge3BlbmRpbmdBdHRyOiBwZW5kaW5nQXR0ciwgZWxlbWVudDogZWxlbWVudH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlzRWRpdE1vZGUgPSAhISh3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcgJiYgd2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnLmlzRWRpdE1vZGUpO1xuXG4gICAgICAgIGlmICgnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdyAmJiAhaXNFZGl0TW9kZSkge1xuICAgICAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChlbnRyaWVzLCBvYnMpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWhMb2coJ1tJT10gaW50ZXJzZWN0aW5nIC0+IHdpbGwgZXhlY3V0ZScsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBlbGVtZW50OiBlbGVtZW50fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUocGVuZGluZ0F0dHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGRvbmVBdHRyLCAnMScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlaExvZygncnVuSGFuZGxlcjogRVhFQ1VURSBoYW5kbGVyJywge2RlYnVnTGFiZWw6IGRlYnVnTGFiZWwsIGVsZW1lbnQ6IGVsZW1lbnR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwoJGVsZW1lbnQsICQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYnMuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDAuMVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciBvYnNlcnZlKCknLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgZWxlbWVudDogZWxlbWVudH0pO1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBubyBJbnRlcnNlY3Rpb25PYnNlcnZlciAtPiBpbW1lZGlhdGUgcGF0aCcsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBlbGVtZW50OiBlbGVtZW50fSk7XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUocGVuZGluZ0F0dHIpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGRvbmVBdHRyLCAnMScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlaExvZygncnVuSGFuZGxlcjogRVhFQ1VURSBoYW5kbGVyJywge2RlYnVnTGFiZWw6IGRlYnVnTGFiZWwsIGVsZW1lbnQ6IGVsZW1lbnR9KTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwoJGVsZW1lbnQsICQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3NjaGVkdWxlUmVydW46IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVoTG9nKCdzY2hlZHVsZVJlcnVuOiByZXF1ZXN0ZWQnLCB7c2NvcGU6ICRzY29wZSAmJiAkc2NvcGUubGVuZ3RoID8gJHNjb3BlLmdldCgwKSA6IG51bGx9KTtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZXJ1bkRlYm91bmNlVGltZXIpO1xuICAgICAgICB0aGlzLl9yZXJ1bkRlYm91bmNlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVoTG9nKCdzY2hlZHVsZVJlcnVuOiB0aW1lciBmaXJlZCcpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlaExvZygnc2NoZWR1bGVSZXJ1bjogUkFGIC0+IHJ1blJlYWR5VHJpZ2dlcicpO1xuICAgICAgICAgICAgICAgIHNlbGYucnVuUmVhZHlUcmlnZ2VyKCRzY29wZSAmJiAkc2NvcGUubGVuZ3RoID8gJHNjb3BlIDogJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDApO1xuICAgIH0sXG5cbiAgICBfc3RhcnRUZW1wb3JhcnlNdXRhdGlvbk9ic2VydmVyOiBmdW5jdGlvbiAoZHVyYXRpb25NcywgJHNjb3BlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGR1cmF0aW9uTXMgPSBkdXJhdGlvbk1zIHx8IDE1MDA7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIGVuZEF0ID0gbm93ICsgTWF0aC5tYXgoMCwgZHVyYXRpb25NcyB8IDApO1xuICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyRW5kQXQgPSBNYXRoLm1heChzZWxmLl9tdXRhdGlvbk9ic2VydmVyRW5kQXQgfHwgMCwgZW5kQXQpO1xuXG4gICAgICAgIGlmIChzZWxmLl9tdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogYWxyZWFkeSBydW5uaW5nIC0+IGV4dGVuZCB3aW5kb3cnLCB7ZW5kQXQ6IHNlbGYuX211dGF0aW9uT2JzZXJ2ZXJFbmRBdH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5fbXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVoTG9nKCdtdXRhdGlvbk9ic2VydmVyOiBET00gbXV0YXRlZCAtPiBzY2hlZHVsZSByZXJ1bicpO1xuICAgICAgICAgICAgc2VsZi5fc2NoZWR1bGVSZXJ1bigkc2NvcGUgJiYgJHNjb3BlLmxlbmd0aCA/ICRzY29wZSA6ICQoZG9jdW1lbnQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlbGYuX211dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RBUlRFRCcsIHtkdXJhdGlvbk1zOiBkdXJhdGlvbk1zLCBlbmRBdDogc2VsZi5fbXV0YXRpb25PYnNlcnZlckVuZEF0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHNlbGYuX211dGF0aW9uT2JzZXJ2ZXIgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0b3BMYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5fbXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIDwgKHNlbGYuX211dGF0aW9uT2JzZXJ2ZXJFbmRBdCB8fCAwKSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9tdXRhdGlvbk9ic2VydmVyU3RvcFRpbWVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyU3RvcFRpbWVyID0gc2V0VGltZW91dChzdG9wTGF0ZXIsIDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RPUFBJTkcnKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBuby1vcFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5fbXV0YXRpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RPUFBFRCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHN0b3BMYXRlcigpO1xuICAgIH0sXG5cbiAgICBhZGRIYW5kbGVyOiBmdW5jdGlvbiAoc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlcmVkU2VsZWN0b3JIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodHlwZW9mICQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcnVuS2V5ID0gaGFzaFNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3J1bkhhbmRsZXJPbkVsZW1lbnQoJCh0aGlzKSwgY2FsbGJhY2ssIHNlbGVjdG9yLCBydW5LZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcnVuUmVhZHlUcmlnZ2VyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgIGlmICghJHNjb3BlIHx8ICEkc2NvcGUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlZ2lzdGVyZWRTZWxlY3RvckhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZWhMb2coJ3J1blJlYWR5VHJpZ2dlcjogc3RhcnQnLCB7c2NvcGU6ICRzY29wZS5nZXQoMCksIGhhbmRsZXJzQ291bnQ6IHJlZ2lzdGVyZWRTZWxlY3RvckhhbmRsZXJzLmxlbmd0aH0pO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgcmVnaXN0ZXJlZFNlbGVjdG9ySGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgICAgIGlmICghZW50cnkuc2VsZWN0b3IgfHwgdHlwZW9mIGVudHJ5LmNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWhMb2coJ3J1blJlYWR5VHJpZ2dlcjogYXBwbHkgc2VsZWN0b3InLCB7c2VsZWN0b3I6IGVudHJ5LnNlbGVjdG9yfSk7XG5cbiAgICAgICAgICAgIHZhciBydW5LZXkgPSBoYXNoU2VsZWN0b3IoZW50cnkuc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzKGVudHJ5LnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3J1bkhhbmRsZXJPbkVsZW1lbnQoJHNjb3BlLCBlbnRyeS5jYWxsYmFjaywgZW50cnkuc2VsZWN0b3IsIHJ1bktleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzY29wZS5maW5kKGVudHJ5LnNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9ydW5IYW5kbGVyT25FbGVtZW50KCQodGhpcyksIGVudHJ5LmNhbGxiYWNrLCBlbnRyeS5zZWxlY3RvciwgcnVuS2V5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYmluZFByZXN0YVNob3BFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BzRXZlbnRzQm91bmQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wc0V2ZW50c0JvdW5kID0gdHJ1ZTtcbiAgICAgICAgZWhMb2coJ2JpbmRQcmVzdGFTaG9wRXZlbnRzOiBib3VuZCcpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcHJlc3Rhc2hvcCA9PT0gJ3VuZGVmaW5lZCcgfHwgIXByZXN0YXNob3AgfHwgdHlwZW9mIHByZXN0YXNob3Aub24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlcnVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiAkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuX3NjaGVkdWxlUmVydW4oJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgc2VsZi5fc3RhcnRUZW1wb3JhcnlNdXRhdGlvbk9ic2VydmVyKDE1MDAsICQoZG9jdW1lbnQpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBbXG4gICAgICAgICAgICAndXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndXBkYXRlZENhcnQnLFxuICAgICAgICAgICAgJ2NoYW5nZWRDaGVja291dFN0ZXAnLFxuICAgICAgICAgICAgJ3VwZGF0ZVByb2R1Y3RMaXN0JyxcbiAgICAgICAgICAgICd1cGRhdGVGYWNldHMnLFxuICAgICAgICAgICAgJ3VwZGF0ZWRQcm9kdWN0J1xuICAgICAgICBdLmZvckVhY2goZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgcHJlc3Rhc2hvcC5vbihldnQsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZWhMb2coJ3ByZXN0YXNob3AgZXZlbnQ6JywgZXZ0LCBlICYmIGUucmVhc29uID8ge3JlYXNvbjogZS5yZWFzb259IDogZSk7XG4gICAgICAgICAgICAgICAgcmVydW4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG4vLyBBdXRvLWJvb3Qgb24gcGFnZSBsb2FkIChmcm9udCBvZmZpY2Ugb25seSwgTk9UIGluIGVkaXQgbW9kZSlcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBib290ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBEb24ndCBpbml0aWFsaXplIGluIGVkaXQgbW9kZSAtIHRoZSBlZGl0b3IgaGFuZGxlcyBlbGVtZW50cyBpdHNlbGZcbiAgICAgICAgaWYgKHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZyAmJiB3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcuaXNFZGl0TW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZWhMb2coJ2Jvb3Q6IHN0YXJ0IChET01Db250ZW50TG9hZGVkKScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZWhMb2coJ2Jvb3Q6IGJpbmRQcmVzdGFTaG9wRXZlbnRzJyk7XG4gICAgICAgICAgICBFbGVtZW50c0hhbmRsZXIuYmluZFByZXN0YVNob3BFdmVudHMoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlaExvZygnYm9vdDogaW5pdGlhbCBSQUYgLT4gcnVuUmVhZHlUcmlnZ2VyJyk7XG4gICAgICAgICAgICAgICAgICAgIEVsZW1lbnRzSGFuZGxlci5ydW5SZWFkeVRyaWdnZXIoJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBuby1vcFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGJvb3QoKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudHNIYW5kbGVyO1xuIiwiLyogZ2xvYmFsIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnLCBqUXVlcnksICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbi8vIExvYWQgYWxsIGhhbmRsZXJzIChlYWNoIG9uZSBzZWxmLXJlZ2lzdGVycyB2aWEgRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIpXG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvc3dpcGVyJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvZ2xvYmFsJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvYWNjb3JkaW9uJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvYWxlcnQnKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9jb3VudGVyJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvdGFicycpO1xucmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2hhbmRsZXJzL3RhYnMtY29udGFpbmVyJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvdG9nZ2xlJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvcHJvZ3Jlc3MnKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy92aWRlbycpO1xucmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2hhbmRsZXJzL3NlY3Rpb24nKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9sb3R0aWUnKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9wcmVzdGFzaG9wLXNlYXJjaCcpO1xucmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2hhbmRsZXJzL3ByZXN0YXNob3AtY29udGFjdGZvcm0nKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy90YWJsZS1vZi1jb250ZW50cycpO1xuXG4vLyBZb3VUdWJlIEFQSSBsb2FkZXIgKHVzZWQgYnkgc2VjdGlvbiBiYWNrZ3JvdW5kIHZpZGVvKVxudmFyIGlzWVRJbnNlcnRlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBvbllvdXR1YmVBcGlSZWFkeShjYWxsYmFjaykge1xuICAgIGlmICghaXNZVEluc2VydGVkKSB7XG4gICAgICAgIGlzWVRJbnNlcnRlZCA9IHRydWU7XG4gICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0LnNyYyA9ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9pZnJhbWVfYXBpJztcbiAgICAgICAgdmFyIGZpcnN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdO1xuICAgICAgICBpZiAoZmlyc3QgJiYgZmlyc3QucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgZmlyc3QucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0LCBmaXJzdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAod2luZG93LllUICYmIFlULmxvYWRlZCkge1xuICAgICAgICBjYWxsYmFjayhZVCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvbllvdXR1YmVBcGlSZWFkeShjYWxsYmFjayk7XG4gICAgICAgIH0sIDM1MCk7XG4gICAgfVxufVxuXG4vLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5IOKAlCBzb21lIHRlbXBsYXRlcy9lZGl0b3IgY29kZSByZWZlcmVuY2Ugd2luZG93LmVsZW1lbnRvckZyb250ZW5kXG53aW5kb3cuZWxlbWVudG9yRnJvbnRlbmQgPSB7XG4gICAgY29uZmlnOiB3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcgfHwge30sXG4gICAgaXNFZGl0TW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gISEod2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnICYmIHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZy5pc0VkaXRNb2RlKTtcbiAgICB9LFxuICAgIGdldFNjb3BlV2luZG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zY29wZVdpbmRvdyB8fCB3aW5kb3c7XG4gICAgfSxcbiAgICBzZXRTY29wZVdpbmRvdzogZnVuY3Rpb24gKHNjb3BlV2luZG93KSB7XG4gICAgICAgIHRoaXMuX3Njb3BlV2luZG93ID0gc2NvcGVXaW5kb3c7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gd2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnIHx8IHt9O1xuICAgIH0sXG4gICAgZWxlbWVudHNIYW5kbGVyOiBFbGVtZW50c0hhbmRsZXIsXG4gICAgdXRpbHM6IHtcbiAgICAgICAgb25Zb3V0dWJlQXBpUmVhZHk6IG9uWW91dHViZUFwaVJlYWR5XG4gICAgfSxcbiAgICB0aHJvdHRsZTogZnVuY3Rpb24gKGZ1bmMsIHdhaXQpIHtcbiAgICAgICAgdmFyIHRpbWVvdXQsIGNvbnRleHQsIGFyZ3MsIHJlc3VsdCwgcHJldmlvdXMgPSAwO1xuXG4gICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByZXZpb3VzID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG5cbiAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbn07XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItYWNjb3JkaW9uJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkYWNjb3JkaW9uID0gJCh0aGlzKTtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZVNlY3Rpb24gPSAkYWNjb3JkaW9uLmRhdGEoJ2FjdGl2ZS1zZWN0aW9uJykgfHwgMTtcbiAgICB2YXIgYWN0aXZlRmlyc3QgPSAkYWNjb3JkaW9uLmRhdGEoJ2FjdGl2ZS1maXJzdCcpO1xuICAgIHZhciAkdGl0bGVzID0gJGFjY29yZGlvbi5maW5kKCcuZWxlbWVudG9yLWFjY29yZGlvbi10aXRsZScpO1xuXG4gICAgZnVuY3Rpb24gYWN0aXZhdGVTZWN0aW9uKHNlY3Rpb25JbmRleCkge1xuICAgICAgICB2YXIgJGFjdGl2ZSA9ICR0aXRsZXMuZmlsdGVyKCcuYWN0aXZlJyk7XG4gICAgICAgIHZhciAkcmVxdWVzdGVkID0gJHRpdGxlcy5maWx0ZXIoJ1tkYXRhLXNlY3Rpb249XCInICsgc2VjdGlvbkluZGV4ICsgJ1wiXScpO1xuICAgICAgICB2YXIgaXNSZXF1ZXN0ZWRBY3RpdmUgPSAkcmVxdWVzdGVkLmhhc0NsYXNzKCdhY3RpdmUnKTtcblxuICAgICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdhY3RpdmUnKS5uZXh0KCkuc2xpZGVVcCgpO1xuXG4gICAgICAgIGlmICghaXNSZXF1ZXN0ZWRBY3RpdmUpIHtcbiAgICAgICAgICAgICRyZXF1ZXN0ZWQuYWRkQ2xhc3MoJ2FjdGl2ZScpLm5leHQoKS5zbGlkZURvd24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhY3RpdmVGaXJzdCkge1xuICAgICAgICBhY3RpdmF0ZVNlY3Rpb24oZGVmYXVsdEFjdGl2ZVNlY3Rpb24pO1xuICAgIH1cblxuICAgICR0aXRsZXMub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhY3RpdmF0ZVNlY3Rpb24odGhpcy5kYXRhc2V0LnNlY3Rpb24pO1xuICAgIH0pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItYWxlcnQtZGlzbWlzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5mYWRlT3V0KCk7XG4gICAgfSk7XG59KTtcbiIsIi8qIGdsb2JhbCAkICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignLmVsZW1lbnRvci1jb3VudGVyLW51bWJlcicsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJG51bWJlciA9ICQodGhpcyk7XG5cbiAgICAkbnVtYmVyLndheXBvaW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJG51bWJlci5udW1lcmF0b3Ioe1xuICAgICAgICAgICAgZHVyYXRpb246ICRudW1iZXIuZGF0YSgnZHVyYXRpb24nKVxuICAgICAgICB9KTtcbiAgICB9LCB7b2Zmc2V0OiAnOTAlJ30pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItZWxlbWVudFtkYXRhLWFuaW1hdGlvbl0nLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICB2YXIgYW5pbWF0aW9uID0gJGVsZW1lbnQuZGF0YSgnYW5pbWF0aW9uJyk7XG5cbiAgICBpZiAoIWFuaW1hdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJGVsZW1lbnQuYWRkQ2xhc3MoJ2VsZW1lbnRvci1pbnZpc2libGUnKS5yZW1vdmVDbGFzcyhhbmltYXRpb24pO1xuXG4gICAgJGVsZW1lbnQud2F5cG9pbnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcygnZWxlbWVudG9yLWludmlzaWJsZScpLmFkZENsYXNzKGFuaW1hdGlvbik7XG4gICAgfSwge29mZnNldDogJzkwJSd9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQsIExvdHRpZUludGVyYWN0aXZpdHkgKi9cclxuXHJcbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xyXG5cclxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5sb3R0aWUtYW5pbWF0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICRwbGF5ZXIgPSAkKHRoaXMpO1xyXG5cclxuICAgIGlmICgkcGxheWVyLmRhdGEoJ3BsYXknKSAhPT0gJ3Njcm9sbCcpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG9mZnNldCA9ICRwbGF5ZXIuZGF0YSgnb2Zmc2V0JykgLyAxMDA7XHJcbiAgICB2YXIgY29udGFpbmVyID0gJHBsYXllci5kYXRhKCdjb250YWluZXInKSA9PT0gJ2JvZHknID8gJ2JvZHknIDogbnVsbDtcclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdsb3R0aWVMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBMb3R0aWVJbnRlcmFjdGl2aXR5ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBMb3R0aWVJbnRlcmFjdGl2aXR5LmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIG1vZGU6ICdzY3JvbGwnLFxyXG4gICAgICAgICAgICBwbGF5ZXI6ICRwbGF5ZXJbMF0sXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogW29mZnNldCwgMV0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3NlZWsnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lczogWzAsICcxMDAlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCIvKiBnbG9iYWwgJCwgZWxlbWVudG9yRnJvbnRlbmRDb25maWcgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLWNvbnRhY3Rmb3JtLXdyYXBwZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR3cmFwcGVyID0gJCh0aGlzKTtcblxuICAgIGlmICh0eXBlb2YgZWxlbWVudG9yRnJvbnRlbmRDb25maWcgPT09ICd1bmRlZmluZWQnIHx8ICFlbGVtZW50b3JGcm9udGVuZENvbmZpZy5hamF4X2NzZnJfdG9rZW5fdXJsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBMb2FkIENTUkYgdG9rZW5cbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IGVsZW1lbnRvckZyb250ZW5kQ29uZmlnLmFqYXhfY3Nmcl90b2tlbl91cmwsXG4gICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAkd3JhcHBlci5maW5kKCcuanMtY3Nmci10b2tlbicpLnJlcGxhY2VXaXRoKCQocmVzcC5wcmV2aWV3KSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEhhbmRsZSBmb3JtIHN1Ym1pc3Npb24gdmlhIEFKQVhcbiAgICAkd3JhcHBlci5vbignc3VibWl0JywgJy5qcy1lbGVtZW50b3ItY29udGFjdC1mb3JtJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJCh0aGlzKVswXSk7XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogJCh0aGlzKS5hdHRyKCdhY3Rpb24nKSxcbiAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgICAgICAkd3JhcHBlci5maW5kKCcuanMtZWxlbWVudG9yLWNvbnRhY3Qtbm9yaWZjYXRpb24td3JhcHBlcicpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlV2l0aCgkKHJlc3AucHJldmlldykuZmluZCgnLmpzLWVsZW1lbnRvci1jb250YWN0LW5vcmlmY2F0aW9uLXdyYXBwZXInKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCwgcHJlc3Rhc2hvcCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5zZWFyY2gtd2lkZ2V0LWF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHNlYXJjaFdpZGdldCA9ICQodGhpcyk7XG4gICAgdmFyICRzZWFyY2hCb3ggPSAkc2VhcmNoV2lkZ2V0LmZpbmQoJ2lucHV0W3R5cGU9dGV4dF0nKTtcbiAgICB2YXIgc2VhcmNoVVJMID0gJHNlYXJjaFdpZGdldC5hdHRyKCdkYXRhLXNlYXJjaC1jb250cm9sbGVyLXVybCcpO1xuXG4gICAgaWYgKHR5cGVvZiBwcmVzdGFzaG9wID09PSAndW5kZWZpbmVkJyB8fCAhcHJlc3Rhc2hvcC5ibG9ja3NlYXJjaCB8fCAhcHJlc3Rhc2hvcC5ibG9ja3NlYXJjaC5pbml0QXV0b2NvbXBsZXRlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwcmVzdGFzaG9wLmJsb2Nrc2VhcmNoLmluaXRBdXRvY29tcGxldGUoJHNlYXJjaFdpZGdldCwgJHNlYXJjaEJveCwgc2VhcmNoVVJMKTtcbn0pO1xuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLXByb2dyZXNzLWJhcicsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGJhciA9ICQodGhpcyk7XG5cbiAgICAkYmFyLndheXBvaW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGJhci5jc3MoJ3dpZHRoJywgJGJhci5kYXRhKCdtYXgnKSArICclJyk7XG4gICAgfSwge29mZnNldDogJzkwJSd9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQsIGVsZW1lbnRvckZyb250ZW5kICovXG5cbi8qKlxuICogQmFja2dyb3VuZCB2aWRlbyBoYW5kbGVyIGZvciBzZWN0aW9ucy5cbiAqIFRoZSBzbGlkZXItc2VjdGlvbiBwYXJ0IGlzIG5vdyBoYW5kbGVkIGJ5IHRoZSBjZW50cmFsaXplZCBzd2lwZXIuanMgaGFuZGxlci5cbiAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItYmFja2dyb3VuZC12aWRlby1jb250YWluZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRjb250YWluZXIgPSAkKHRoaXMpO1xuICAgIHZhciAkdmlkZW8gPSAkY29udGFpbmVyLmNoaWxkcmVuKCcuZWxlbWVudG9yLWJhY2tncm91bmQtdmlkZW8nKTtcblxuICAgIGlmICghJHZpZGVvLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHZpZGVvSUQgPSAkdmlkZW8uZGF0YSgndmlkZW8taWQnKTtcbiAgICB2YXIgaXNZVFZpZGVvID0gZmFsc2U7XG4gICAgdmFyIHBsYXllcjtcblxuICAgIGZ1bmN0aW9uIGNhbGNWaWRlb1NpemUoKSB7XG4gICAgICAgIHZhciBjb250YWluZXJXaWR0aCA9ICRjb250YWluZXIub3V0ZXJXaWR0aCgpO1xuICAgICAgICB2YXIgY29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lci5vdXRlckhlaWdodCgpO1xuICAgICAgICB2YXIgYXNwZWN0UmF0aW8gPSAxNiAvIDk7XG4gICAgICAgIHZhciByYXRpb1dpZHRoID0gY29udGFpbmVyV2lkdGggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgdmFyIHJhdGlvSGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIHZhciBpc1dpZHRoRml4ZWQgPSBjb250YWluZXJXaWR0aCAvIGNvbnRhaW5lckhlaWdodCA+IGFzcGVjdFJhdGlvO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogaXNXaWR0aEZpeGVkID8gY29udGFpbmVyV2lkdGggOiByYXRpb0hlaWdodCxcbiAgICAgICAgICAgIGhlaWdodDogaXNXaWR0aEZpeGVkID8gcmF0aW9XaWR0aCA6IGNvbnRhaW5lckhlaWdodFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoYW5nZVZpZGVvU2l6ZSgpIHtcbiAgICAgICAgdmFyICR0YXJnZXQgPSBpc1lUVmlkZW8gPyAkKHBsYXllci5nZXRJZnJhbWUoKSkgOiAkdmlkZW87XG4gICAgICAgIHZhciBzaXplID0gY2FsY1ZpZGVvU2l6ZSgpO1xuICAgICAgICAkdGFyZ2V0LndpZHRoKHNpemUud2lkdGgpLmhlaWdodChzaXplLmhlaWdodCk7XG4gICAgfVxuXG4gICAgaWYgKHZpZGVvSUQpIHtcbiAgICAgICAgLy8gWW91VHViZSBiYWNrZ3JvdW5kIHZpZGVvXG4gICAgICAgIGlzWVRWaWRlbyA9IHRydWU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50b3JGcm9udGVuZCAhPT0gJ3VuZGVmaW5lZCcgJiYgZWxlbWVudG9yRnJvbnRlbmQudXRpbHMpIHtcbiAgICAgICAgICAgIGVsZW1lbnRvckZyb250ZW5kLnV0aWxzLm9uWW91dHViZUFwaVJlYWR5KGZ1bmN0aW9uIChZVCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXIgPSBuZXcgWVQuUGxheWVyKCR2aWRlb1swXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9JZDogdmlkZW9JRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyLm11dGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlVmlkZW9TaXplKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5wbGF5VmlkZW8oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU3RhdGVDaGFuZ2U6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gWVQuUGxheWVyU3RhdGUuRU5ERUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5zZWVrVG8oMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWVyVmFyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9wbGF5OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11dGU6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd2luZm86IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBjaGFuZ2VWaWRlb1NpemUpO1xuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBIb3N0ZWQgdmlkZW9cbiAgICAgICAgJHZpZGVvLm9uZSgnY2FucGxheScsIGNoYW5nZVZpZGVvU2l6ZSk7XG4gICAgfVxufSk7XG4iLCIvKiBnbG9iYWwgU3dpcGVyLCBlbGVtZW50b3JGcm9udGVuZENvbmZpZywgJCAqL1xuXG4vKipcbiAqIENlbnRyYWxpemVkIFN3aXBlciBoYW5kbGVyIGZvciBBTEwgRWxlbWVudG9yIGNhcm91c2VsIHR5cGVzLlxuICpcbiAqIFJlcGxhY2VzIHRoZSBvbGQgcGVyLXdpZGdldCBjYXJvdXNlbCBoYW5kbGVyczpcbiAqICAgaW1hZ2UtY2Fyb3VzZWwsIHRlc3RpbW9uaWFsLCBwcmVzdGFzaG9wLXByb2R1Y3RsaXN0LFxuICogICBwcmVzdGFzaG9wLXByb2R1Y3RsaXN0dGFicywgcHJlc3Rhc2hvcC1icmFuZHMsIHByZXN0YXNob3AtYmxvZyxcbiAqICAgYW5kIHRoZSBzbGlkZXItc2VjdGlvbiBwYXJ0IG9mIHNlY3Rpb24uanNcbiAqXG4gKiBFYWNoIGNhcm91c2VsIGVsZW1lbnQgc3RvcmVzIGl0cyBvcHRpb25zIGluIGRhdGEtc2xpZGVyX29wdGlvbnMuXG4gKiBOYXZpZ2F0aW9uL3BhZ2luYXRpb24gZWxlbWVudHMgYXJlIHNlYXJjaGVkIGluIHRoZSBjbG9zZXN0IHdpZGdldCB3cmFwcGVyLlxuICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG4vKiogU2V0IHRvIHRydWUgdG8gZW5hYmxlIFN3aXBlciBkZWJ1ZyBsb2dnaW5nIGluIHRoZSBjb25zb2xlICovXG52YXIgU1dJUEVSX0RFQlVHID0gdHJ1ZTtcblxuLy8gV2hlbiB0aGUgdGhlbWUgcHJvdmlkZXMgU3dpcGVyIGNvcmUgKG5vdCB0aGUgYnVuZGxlKSwgbW9kdWxlcyBtdXN0IGJlIHBhc3NlZFxuLy8gZXhwbGljaXRseS4gVGhlIHRoZW1lIGV4cG9zZXMgdGhlbSBvbiB3aW5kb3cuU3dpcGVyTW9kdWxlcy5cbnZhciBTd2lwZXJNb2R1bGVzID0gd2luZG93LlN3aXBlck1vZHVsZXMgfHwgbnVsbDtcblxudmFyIFNXSVBFUl9TTV9CUkVBS1BPSU5UID0gNTc2O1xudmFyIFNXSVBFUl9NRF9CUkVBS1BPSU5UID0gNzY4O1xudmFyIFNXSVBFUl9MR19CUkVBS1BPSU5UID0gOTkyO1xudmFyIFNXSVBFUl9YTF9CUkVBS1BPSU5UID0gMTIwMDtcbnZhciBTV0lQRVJfWFhMX0JSRUFLUE9JTlQgPSAxNDAwO1xudmFyIFNXSVBFUl9CUkVBS1BPSU5UUyA9IFsnWFMnLCAnU00nLCAnTUQnLCAnTEcnLCAnWEwnLCAnWFhMJ107XG52YXIgU1dJUEVSX0xFR0FDWV9CUkVBS1BPSU5UUyA9IFsnTW9iaWxlJywgJ1RhYmxldCcsICdEZXNrdG9wJ107XG5cbnZhciBDQVJPVVNFTF9TRUxFQ1RPUlMgPSBbXG4gICAgJy5zd2lwZXItZWxlbWVudG9yJ1xuXTtcblxuLyoqXG4gKiBGaW5kIHRoZSBjbG9zZXN0IEVsZW1lbnRvciB3aWRnZXQvZWxlbWVudCB3cmFwcGVyIGFyb3VuZCB0aGUgY2Fyb3VzZWwuXG4gKi9cbmZ1bmN0aW9uIGdldFdpZGdldFdyYXBwZXIoJGNhcm91c2VsKSB7XG4gICAgdmFyICR3cmFwcGVyID0gJGNhcm91c2VsLmNsb3Nlc3QoJy5lbGVtZW50b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCEkd3JhcHBlci5sZW5ndGgpIHtcbiAgICAgICAgJHdyYXBwZXIgPSAkY2Fyb3VzZWwuY2xvc2VzdCgnLmVsZW1lbnRvci1lbGVtZW50Jyk7XG4gICAgfVxuICAgIGlmICghJHdyYXBwZXIubGVuZ3RoKSB7XG4gICAgICAgICR3cmFwcGVyID0gJGNhcm91c2VsLnBhcmVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gJHdyYXBwZXI7XG59XG5cbi8qKlxuICogVG9nZ2xlIGFycm93IHZpc2liaWxpdHkgd2hlbiBhbGwgc2xpZGVzIGFyZSB2aXNpYmxlIChib3RoIGFycm93cyBkaXNhYmxlZCkuXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZUFycm93cyhzd2lwZXJJbnN0YW5jZSkge1xuICAgIGlmICghc3dpcGVySW5zdGFuY2UubmF2aWdhdGlvbiB8fCAhc3dpcGVySW5zdGFuY2UubmF2aWdhdGlvbi5uZXh0RWwgfHwgIXN3aXBlckluc3RhbmNlLm5hdmlnYXRpb24ucHJldkVsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbmV4dCA9IHN3aXBlckluc3RhbmNlLm5hdmlnYXRpb24ubmV4dEVsO1xuICAgIHZhciBwcmV2ID0gc3dpcGVySW5zdGFuY2UubmF2aWdhdGlvbi5wcmV2RWw7XG5cbiAgICBpZiAoIW5leHQgfHwgIXByZXYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBib3RoRGlzYWJsZWQgPVxuICAgICAgICBuZXh0LmNsYXNzTGlzdC5jb250YWlucygnc3dpcGVyLWJ1dHRvbi1kaXNhYmxlZCcpICYmXG4gICAgICAgIHByZXYuY2xhc3NMaXN0LmNvbnRhaW5zKCdzd2lwZXItYnV0dG9uLWRpc2FibGVkJyk7XG5cbiAgICBpZiAoYm90aERpc2FibGVkKSB7XG4gICAgICAgIG5leHQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgcHJldi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICBwcmV2LnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICB9XG59XG5cbi8qKlxuICogSGVscGVyOiBjb3B5IGEgU3dpcGVyIG9wdGlvbiB0byBicmVha3BvaW50LXN1ZmZpeGVkIHZhcmlhbnRzXG4gKiAoWFMvU00vTUQvTEcvWEwvWFhMICsgTW9iaWxlL1RhYmxldC9EZXNrdG9wKVxuICovXG5mdW5jdGlvbiBjb3B5T3B0aW9uVG9CcmVha3BvaW50cyhvcHRpb25zLCBrZXkpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnKSByZXR1cm47XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gPT09ICd1bmRlZmluZWQnIHx8IG9wdGlvbnNba2V5XSA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgdmFyIHZhbHVlID0gb3B0aW9uc1trZXldO1xuICAgIHZhciBzdWZmaXhlcyA9IFNXSVBFUl9CUkVBS1BPSU5UUy5jb25jYXQoU1dJUEVSX0xFR0FDWV9CUkVBS1BPSU5UUyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1ZmZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0YXJnZXRLZXkgPSBrZXkgKyBzdWZmaXhlc1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW3RhcmdldEtleV0gPT09ICd1bmRlZmluZWQnIHx8IG9wdGlvbnNbdGFyZ2V0S2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgb3B0aW9uc1t0YXJnZXRLZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUgb3B0aW9uc1trZXldO1xufVxuXG4vKipcbiAqIEhlbHBlcjogcmV0cm8tY29tcGF0aWJpbGl0eSAoYWxpYXMgb2xkIG9wdGlvbiBuYW1lIC0+IG5ldyBvcHRpb24gbmFtZSlcbiAqL1xuZnVuY3Rpb24gYXBwbHlMZWdhY3lPcHRpb24ob3B0aW9ucywgbGVnYWN5S2V5LCBuZXdLZXksIGluY2x1ZGVSZXNwb25zaXZlU3VmZml4ZXMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnKSByZXR1cm47XG4gICAgaWYgKHR5cGVvZiBpbmNsdWRlUmVzcG9uc2l2ZVN1ZmZpeGVzID09PSAndW5kZWZpbmVkJykgaW5jbHVkZVJlc3BvbnNpdmVTdWZmaXhlcyA9IHRydWU7XG5cbiAgICB2YXIgaGFzVmFsdWUgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gISh0eXBlb2YgdiA9PT0gJ3VuZGVmaW5lZCcgfHwgdiA9PT0gbnVsbCk7IH07XG5cbiAgICAvLyBCYXNlIGtleVxuICAgIGlmIChoYXNWYWx1ZShvcHRpb25zW2xlZ2FjeUtleV0pICYmICFoYXNWYWx1ZShvcHRpb25zW25ld0tleV0pKSB7XG4gICAgICAgIG9wdGlvbnNbbmV3S2V5XSA9IG9wdGlvbnNbbGVnYWN5S2V5XTtcbiAgICB9XG4gICAgZGVsZXRlIG9wdGlvbnNbbGVnYWN5S2V5XTtcblxuICAgIGlmICghaW5jbHVkZVJlc3BvbnNpdmVTdWZmaXhlcykgcmV0dXJuO1xuXG4gICAgLy8gU3VmZml4IGtleXMgKFhTL1NNL01EL0xHL1hML1hYTCArIE1vYmlsZS9UYWJsZXQvRGVza3RvcClcbiAgICB2YXIgc3VmZml4ZXMgPSBTV0lQRVJfQlJFQUtQT0lOVFMuY29uY2F0KFNXSVBFUl9MRUdBQ1lfQlJFQUtQT0lOVFMpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VmZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGxlZ2FjeVN1ZmZpeEtleSA9IGxlZ2FjeUtleSArIHN1ZmZpeGVzW2ldO1xuICAgICAgICB2YXIgbmV3U3VmZml4S2V5ID0gbmV3S2V5ICsgc3VmZml4ZXNbaV07XG5cbiAgICAgICAgaWYgKGhhc1ZhbHVlKG9wdGlvbnNbbGVnYWN5U3VmZml4S2V5XSkpIHtcbiAgICAgICAgICAgIGlmICghaGFzVmFsdWUob3B0aW9uc1tuZXdTdWZmaXhLZXldKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNbbmV3U3VmZml4S2V5XSA9IG9wdGlvbnNbbGVnYWN5U3VmZml4S2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZXRlIG9wdGlvbnNbbGVnYWN5U3VmZml4S2V5XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlMZWdhY3lCcmVha1BvaW50cyhvcHRpb25zLCBrZXkpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnKSByZXR1cm47XG4gICAgdmFyIGhhc1ZhbHVlID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuICEodHlwZW9mIHYgPT09ICd1bmRlZmluZWQnIHx8IHYgPT09IG51bGwpOyB9O1xuXG4gICAgdmFyIG1hcHBpbmcgPSB7XG4gICAgICAgICdNb2JpbGUnOiBbJ1hTJywgJ1NNJ10sXG4gICAgICAgICdUYWJsZXQnOiBbJ01EJ10sXG4gICAgICAgICdEZXNrdG9wJzogWydMRycsICdYTCcsICdYWEwnXVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFNXSVBFUl9MRUdBQ1lfQlJFQUtQT0lOVFMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN1ZmZpeCA9IFNXSVBFUl9MRUdBQ1lfQlJFQUtQT0lOVFNbaV07XG4gICAgICAgIHZhciBsZWdhY3lTdWZmaXhLZXkgPSBrZXkgKyBzdWZmaXg7XG4gICAgICAgIHZhciB0YXJnZXRzID0gbWFwcGluZ1tzdWZmaXhdO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGFyZ2V0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIG5ld1N1ZmZpeEtleSA9IGtleSArIHRhcmdldHNbal07XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWUob3B0aW9uc1tsZWdhY3lTdWZmaXhLZXldKSkge1xuICAgICAgICAgICAgICAgIGlmICghaGFzVmFsdWUob3B0aW9uc1tuZXdTdWZmaXhLZXldKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zW25ld1N1ZmZpeEtleV0gPSBvcHRpb25zW2xlZ2FjeVN1ZmZpeEtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIG9wdGlvbnNbbGVnYWN5U3VmZml4S2V5XTtcbiAgICB9XG59XG5cbi8qKlxuICogTWFpbiBjYXJvdXNlbCBpbml0aWFsaXphdGlvbiBoYW5kbGVyLlxuICovXG5mdW5jdGlvbiBpbml0Q2Fyb3VzZWwoKSB7XG4gICAgdmFyICRjYXJvdXNlbCA9ICQodGhpcyk7XG4gICAgdmFyIGRlYnVnSWQgPSAkY2Fyb3VzZWwuY2xvc2VzdCgnW2RhdGEtaWRdJykuZGF0YSgnaWQnKSB8fCAkY2Fyb3VzZWwuYXR0cignY2xhc3MnKSB8fCAndW5rbm93bic7XG5cbiAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmdyb3VwKCclY1tTd2lwZXJdICcgKyBkZWJ1Z0lkLCAnY29sb3I6ICMyMTk2RjM7IGZvbnQtd2VpZ2h0OiBib2xkJyk7XG4gICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ0VsZW1lbnQ6JywgJGNhcm91c2VsWzBdKTtcblxuICAgIGlmICh0eXBlb2YgU3dpcGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLndhcm4oJ1N3aXBlciBsaWJyYXJ5IG5vdCBsb2FkZWQg4oCUIGFib3J0aW5nJyk7XG4gICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghJGNhcm91c2VsLmxlbmd0aCkge1xuICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLndhcm4oJ0Nhcm91c2VsIGVsZW1lbnQgbm90IGZvdW5kIOKAlCBhYm9ydGluZycpO1xuICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgYXJyb3dzLW91dHNpZGUgbGF5b3V0XG4gICAgaWYgKCRjYXJvdXNlbC5oYXNDbGFzcygnYXJyb3dzLW91dHNpZGUnKSAmJiAhJGNhcm91c2VsLnBhcmVudCgpLmhhc0NsYXNzKCdzd2lwZXItYXJyb3dzLXdyYXBwZXInKSkge1xuICAgICAgICAkY2Fyb3VzZWwud3JhcCgnPGRpdiBjbGFzcz1cInN3aXBlci1hcnJvd3Mtd3JhcHBlclwiPjwvZGl2PicpO1xuICAgICAgICBpZiAoJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItbmF2aWdhdGlvbicpLmxlbmd0aCkge1xuICAgICAgICAgICAgJGNhcm91c2VsLnBhcmVudCgpLmFwcGVuZCgkY2Fyb3VzZWwuZmluZCgnLnN3aXBlci1uYXZpZ2F0aW9uJykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGxhenkgaW1hZ2VzIGluIGVkaXQgbW9kZVxuICAgIGlmICh3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcgJiYgZWxlbWVudG9yRnJvbnRlbmRDb25maWcuaXNFZGl0TW9kZSkge1xuICAgICAgICAkY2Fyb3VzZWwuZmluZCgnaW1nW2RhdGEtc3JjXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdzcmMnLCAkKHRoaXMpLmRhdGEoJ3NyYycpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHNhdmVkT3B0aW9ucyA9ICRjYXJvdXNlbC5kYXRhKCdzbGlkZXJfb3B0aW9ucycpIHx8ICRjYXJvdXNlbC5kYXRhKCdzd2lwZXItb3B0aW9ucycpIHx8IHt9O1xuICAgIHZhciAkd2lkZ2V0ID0gZ2V0V2lkZ2V0V3JhcHBlcigkY2Fyb3VzZWwpO1xuXG4gICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ1JhdyBkYXRhLW9wdGlvbnM6JywgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzYXZlZE9wdGlvbnMpKSk7XG4gICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ1dpZGdldCB3cmFwcGVyOicsICR3aWRnZXRbMF0pO1xuICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdTbGlkZXMgZm91bmQ6JywgJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItc2xpZGUnKS5sZW5ndGgpO1xuXG4gICAgLy8gQXBwbHkgbGVnYWN5IG9wdGlvbiBuYW1lc1xuICAgIGFwcGx5TGVnYWN5T3B0aW9uKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1RvU2hvdycsICdzbGlkZXNQZXJWaWV3Jyk7XG4gICAgYXBwbHlMZWdhY3lPcHRpb24oc2F2ZWRPcHRpb25zLCAnc2xpZGVzUGVyUGFnZScsICdzbGlkZXNQZXJHcm91cCcpO1xuICAgIGFwcGx5TGVnYWN5T3B0aW9uKHNhdmVkT3B0aW9ucywgJ2RvdHMnLCAncGFnaW5hdGlvbicpO1xuICAgIGFwcGx5TGVnYWN5T3B0aW9uKHNhdmVkT3B0aW9ucywgJ2Fycm93cycsICduYXZpZ2F0aW9uJyk7XG5cbiAgICAvLyBBcHBseSBsZWdhY3kgYnJlYWtwb2ludHMgKE1vYmlsZS9UYWJsZXQvRGVza3RvcCAtPiBYUy9TTS9NRC9MRy9YTC9YWEwpXG4gICAgYXBwbHlMZWdhY3lCcmVha1BvaW50cyhzYXZlZE9wdGlvbnMsICdwYWdpbmF0aW9uJyk7XG4gICAgYXBwbHlMZWdhY3lCcmVha1BvaW50cyhzYXZlZE9wdGlvbnMsICduYXZpZ2F0aW9uJyk7XG4gICAgYXBwbHlMZWdhY3lCcmVha1BvaW50cyhzYXZlZE9wdGlvbnMsICdzY3JvbGxiYXInKTtcbiAgICBhcHBseUxlZ2FjeUJyZWFrUG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NwYWNlQmV0d2VlbicpO1xuICAgIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMoc2F2ZWRPcHRpb25zLCAnc2xpZGVzUGVyVmlldycpO1xuICAgIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMoc2F2ZWRPcHRpb25zLCAnc2xpZGVzUGVyR3JvdXAnKTtcblxuICAgIC8vIENvcHkgYmFzZSBvcHRpb25zIHRvIGFsbCBicmVha3BvaW50c1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ3BhZ2luYXRpb24nKTtcbiAgICBjb3B5T3B0aW9uVG9CcmVha3BvaW50cyhzYXZlZE9wdGlvbnMsICduYXZpZ2F0aW9uJyk7XG4gICAgY29weU9wdGlvblRvQnJlYWtwb2ludHMoc2F2ZWRPcHRpb25zLCAnc2Nyb2xsYmFyJyk7XG4gICAgY29weU9wdGlvblRvQnJlYWtwb2ludHMoc2F2ZWRPcHRpb25zLCAnc3BhY2VCZXR3ZWVuJyk7XG4gICAgY29weU9wdGlvblRvQnJlYWtwb2ludHMoc2F2ZWRPcHRpb25zLCAnc2xpZGVzUGVyVmlldycpO1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1Blckdyb3VwJyk7XG4gICAgY29weU9wdGlvblRvQnJlYWtwb2ludHMoc2F2ZWRPcHRpb25zLCAnbG9vcCcpO1xuXG4gICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ05vcm1hbGl6ZWQgb3B0aW9ucyAoYWZ0ZXIgbGVnYWN5ICsgYnJlYWtwb2ludCBtYXBwaW5nKTonLCBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNhdmVkT3B0aW9ucykpKTtcblxuICAgIHZhciB2YWwgPSBmdW5jdGlvbiAodiwgZmFsbGJhY2spIHsgcmV0dXJuICh2ICE9PSB1bmRlZmluZWQgJiYgdiAhPT0gbnVsbCkgPyB2IDogZmFsbGJhY2s7IH07XG5cbiAgICAvLyBSZXNvbHZlIERPTSBlbGVtZW50cyBmb3IgbmF2aWdhdGlvbi9wYWdpbmF0aW9uL3Njcm9sbGJhciBvbmNlXG4gICAgdmFyIG5hdlByZXZFbCA9IChzYXZlZE9wdGlvbnMuYXJyb3dzU2VsZWN0b3IgJiYgc2F2ZWRPcHRpb25zLmFycm93c1NlbGVjdG9yWzBdKSB8fCAkY2Fyb3VzZWwuZmluZCgnLnN3aXBlci1idXR0b24tcHJldicpWzBdO1xuICAgIHZhciBuYXZOZXh0RWwgPSAoc2F2ZWRPcHRpb25zLmFycm93c1NlbGVjdG9yICYmIHNhdmVkT3B0aW9ucy5hcnJvd3NTZWxlY3RvclsxXSkgfHwgJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItYnV0dG9uLW5leHQnKVswXTtcbiAgICB2YXIgcGFnaW5hdGlvbkVsID0gKHNhdmVkT3B0aW9ucy5wYWdpbmF0aW9uU2VsZWN0b3IgJiYgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25TZWxlY3RvclswXSkgfHwgJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItcGFnaW5hdGlvbicpWzBdO1xuICAgIHZhciBzY3JvbGxiYXJFbCA9IChzYXZlZE9wdGlvbnMuc2Nyb2xsYmFyU2VsZWN0b3IgJiYgc2F2ZWRPcHRpb25zLnNjcm9sbGJhclNlbGVjdG9yWzBdKSB8fCAkY2Fyb3VzZWwuZmluZCgnLnN3aXBlci1zY3JvbGxiYXInKVswXTtcblxuICAgIHZhciBoYXNOYXZpZ2F0aW9uID0gISEobmF2UHJldkVsIHx8IG5hdk5leHRFbCk7XG4gICAgdmFyIGhhc1BhZ2luYXRpb24gPSAhIXBhZ2luYXRpb25FbDtcbiAgICB2YXIgaGFzU2Nyb2xsYmFyID0gISFzY3JvbGxiYXJFbDtcblxuICAgIC8vIE5hdmlnYXRpb24vcGFnaW5hdGlvbi9zY3JvbGxiYXIgYnVpbGRlcnNcbiAgICAvLyBTd2lwZXIgMTI6IHVzZSBmYWxzZSB0byBza2lwIG1vZHVsZSwgb3IgYSBjb25maWcgb2JqZWN0IHRvIGVuYWJsZSBpdCAobm8gJ2VuYWJsZWQnIGtleSlcbiAgICB2YXIgYWRkSWNvbnMgPSBzYXZlZE9wdGlvbnMuYWRkSWNvbnMgIT09IHVuZGVmaW5lZCA/IHNhdmVkT3B0aW9ucy5hZGRJY29ucyA6IHRydWU7XG5cbiAgICB2YXIgbWFrZU5hdmlnYXRpb24gPSBmdW5jdGlvbiAoZW5hYmxlZCkge1xuICAgICAgICBpZiAoIWVuYWJsZWQgfHwgIWhhc05hdmlnYXRpb24pIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZXZFbDogbmF2UHJldkVsLFxuICAgICAgICAgICAgbmV4dEVsOiBuYXZOZXh0RWwsXG4gICAgICAgICAgICBhZGRJY29uczogYWRkSWNvbnNcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIG1ha2VQYWdpbmF0aW9uID0gZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgaWYgKCFlbmFibGVkIHx8ICFoYXNQYWdpbmF0aW9uKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbDogcGFnaW5hdGlvbkVsLFxuICAgICAgICAgICAgY2xpY2thYmxlOiB0cnVlXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBtYWtlU2Nyb2xsYmFyID0gZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgaWYgKCFlbmFibGVkIHx8ICFoYXNTY3JvbGxiYXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVsOiBzY3JvbGxiYXJFbFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyBCdWlsZCBicmVha3BvaW50cyBmaXJzdCwgdGhlbiBkZXRlcm1pbmUgdG9wLWxldmVsIG1vZHVsZSBjb25maWdcbiAgICB2YXIgYnJlYWtwb2ludENvbmZpZ3MgPSB7XG4gICAgICAgIDA6IHtcbiAgICAgICAgICAgIGxvb3A6IHNhdmVkT3B0aW9ucy5sb29wWFMgfHwgZmFsc2UsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IHZhbChzYXZlZE9wdGlvbnMuc3BhY2VCZXR3ZWVuWFMsIDgpLFxuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJWaWV3WFMsIDIpLFxuICAgICAgICAgICAgc2xpZGVzUGVyR3JvdXA6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyR3JvdXBYUywgMSlcbiAgICAgICAgfSxcbiAgICAgICAgNTc2OiB7XG4gICAgICAgICAgICBsb29wOiBzYXZlZE9wdGlvbnMubG9vcFNNIHx8IGZhbHNlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiB2YWwoc2F2ZWRPcHRpb25zLnNwYWNlQmV0d2VlblNNLCA4KSxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyVmlld1NNLCAyKSxcbiAgICAgICAgICAgIHNsaWRlc1Blckdyb3VwOiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1Blckdyb3VwU00sIDEpXG4gICAgICAgIH0sXG4gICAgICAgIDc2ODoge1xuICAgICAgICAgICAgbG9vcDogc2F2ZWRPcHRpb25zLmxvb3BNRCB8fCBmYWxzZSxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogdmFsKHNhdmVkT3B0aW9ucy5zcGFjZUJldHdlZW5NRCwgMTUpLFxuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJWaWV3TUQsIDMpLFxuICAgICAgICAgICAgc2xpZGVzUGVyR3JvdXA6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyR3JvdXBNRCwgMSlcbiAgICAgICAgfSxcbiAgICAgICAgOTkyOiB7XG4gICAgICAgICAgICBsb29wOiBzYXZlZE9wdGlvbnMubG9vcExHIHx8IGZhbHNlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiB2YWwoc2F2ZWRPcHRpb25zLnNwYWNlQmV0d2VlbkxHLCAxNSksXG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1BlclZpZXdMRywgNCksXG4gICAgICAgICAgICBzbGlkZXNQZXJHcm91cDogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJHcm91cExHLCAxKVxuICAgICAgICB9LFxuICAgICAgICAxMjAwOiB7XG4gICAgICAgICAgICBsb29wOiBzYXZlZE9wdGlvbnMubG9vcFhMIHx8IGZhbHNlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiB2YWwoc2F2ZWRPcHRpb25zLnNwYWNlQmV0d2VlblhMLCAxNSksXG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1BlclZpZXdYTCwgNCksXG4gICAgICAgICAgICBzbGlkZXNQZXJHcm91cDogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJHcm91cFhMLCAxKVxuICAgICAgICB9LFxuICAgICAgICAxNDAwOiB7XG4gICAgICAgICAgICBsb29wOiBzYXZlZE9wdGlvbnMubG9vcFhYTCB8fCBmYWxzZSxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogdmFsKHNhdmVkT3B0aW9ucy5zcGFjZUJldHdlZW5YWEwsIDE1KSxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyVmlld1hYTCwgNSksXG4gICAgICAgICAgICBzbGlkZXNQZXJHcm91cDogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJHcm91cFhYTCwgMSlcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDaGVjayBpZiBBTlkgYnJlYWtwb2ludCBlbmFibGVzIG5hdmlnYXRpb24vcGFnaW5hdGlvbi9zY3JvbGxiYXJcbiAgICB2YXIgYnBOYXZLZXlzID0gWyduYXZpZ2F0aW9uWFMnLCAnbmF2aWdhdGlvblNNJywgJ25hdmlnYXRpb25NRCcsICduYXZpZ2F0aW9uTEcnLCAnbmF2aWdhdGlvblhMJywgJ25hdmlnYXRpb25YWEwnXTtcbiAgICB2YXIgYnBQYWdLZXlzID0gWydwYWdpbmF0aW9uWFMnLCAncGFnaW5hdGlvblNNJywgJ3BhZ2luYXRpb25NRCcsICdwYWdpbmF0aW9uTEcnLCAncGFnaW5hdGlvblhMJywgJ3BhZ2luYXRpb25YWEwnXTtcbiAgICB2YXIgYnBTY3JLZXlzID0gWydzY3JvbGxiYXJYUycsICdzY3JvbGxiYXJTTScsICdzY3JvbGxiYXJNRCcsICdzY3JvbGxiYXJMRycsICdzY3JvbGxiYXJYTCcsICdzY3JvbGxiYXJYWEwnXTtcblxuICAgIHZhciBhbnlOYXZFbmFibGVkID0gZmFsc2U7XG4gICAgdmFyIGFueVBhZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICB2YXIgYW55U2NyRW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBicE5hdktleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHNhdmVkT3B0aW9uc1ticE5hdktleXNbaV1dKSBhbnlOYXZFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHNhdmVkT3B0aW9uc1ticFBhZ0tleXNbaV1dKSBhbnlQYWdFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHNhdmVkT3B0aW9uc1ticFNjcktleXNbaV1dKSBhbnlTY3JFbmFibGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGluY2x1ZGUgbW9kdWxlcyBpbiBicmVha3BvaW50cyB0aGF0IHVzZSB0aGVtLCBhbmQgb25seSB3aGVuIGF0IGxlYXN0IG9uZSBCUCBuZWVkcyBpdFxuICAgIHZhciBicEtleXMgPSBbMCwgNTc2LCA3NjgsIDk5MiwgMTIwMCwgMTQwMF07XG4gICAgdmFyIGJwTmF2VmFscyA9IFtzYXZlZE9wdGlvbnMubmF2aWdhdGlvblhTLCBzYXZlZE9wdGlvbnMubmF2aWdhdGlvblNNLCBzYXZlZE9wdGlvbnMubmF2aWdhdGlvbk1ELCBzYXZlZE9wdGlvbnMubmF2aWdhdGlvbkxHLCBzYXZlZE9wdGlvbnMubmF2aWdhdGlvblhMLCBzYXZlZE9wdGlvbnMubmF2aWdhdGlvblhYTF07XG4gICAgdmFyIGJwUGFnVmFscyA9IFtzYXZlZE9wdGlvbnMucGFnaW5hdGlvblhTLCBzYXZlZE9wdGlvbnMucGFnaW5hdGlvblNNLCBzYXZlZE9wdGlvbnMucGFnaW5hdGlvbk1ELCBzYXZlZE9wdGlvbnMucGFnaW5hdGlvbkxHLCBzYXZlZE9wdGlvbnMucGFnaW5hdGlvblhMLCBzYXZlZE9wdGlvbnMucGFnaW5hdGlvblhYTF07XG4gICAgdmFyIGJwU2NyVmFscyA9IFtzYXZlZE9wdGlvbnMuc2Nyb2xsYmFyWFMsIHNhdmVkT3B0aW9ucy5zY3JvbGxiYXJTTSwgc2F2ZWRPcHRpb25zLnNjcm9sbGJhck1ELCBzYXZlZE9wdGlvbnMuc2Nyb2xsYmFyTEcsIHNhdmVkT3B0aW9ucy5zY3JvbGxiYXJYTCwgc2F2ZWRPcHRpb25zLnNjcm9sbGJhclhYTF07XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJwS2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoYW55TmF2RW5hYmxlZCkgYnJlYWtwb2ludENvbmZpZ3NbYnBLZXlzW2pdXS5uYXZpZ2F0aW9uID0gbWFrZU5hdmlnYXRpb24oYnBOYXZWYWxzW2pdKTtcbiAgICAgICAgaWYgKGFueVBhZ0VuYWJsZWQpIGJyZWFrcG9pbnRDb25maWdzW2JwS2V5c1tqXV0ucGFnaW5hdGlvbiA9IG1ha2VQYWdpbmF0aW9uKGJwUGFnVmFsc1tqXSk7XG4gICAgICAgIGlmIChhbnlTY3JFbmFibGVkKSBicmVha3BvaW50Q29uZmlnc1ticEtleXNbal1dLnNjcm9sbGJhciA9IG1ha2VTY3JvbGxiYXIoYnBTY3JWYWxzW2pdKTtcbiAgICB9XG5cbiAgICAvLyBSZXNwb25zaXZlIHZpc2liaWxpdHkgY2xhc3NlczogQ1NTIHNob3dzIG5hdmlnYXRpb24vcGFnaW5hdGlvbi9zY3JvbGxiYXJcbiAgICAvLyBvbmx5IHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgY2xhc3MgaXMgcHJlc2VudCBvbiB0aGUgY2Fyb3VzZWwgcm9vdC5cbiAgICAvLyAtIGlxLWhhcy0qOiBzdGF0aWMsIGF0IGxlYXN0IG9uZSBicmVha3BvaW50IGVuYWJsZXMgdGhlIGZlYXR1cmVcbiAgICAvLyAtIGlxLSotb246IGR5bmFtaWMsIHRoZSBDVVJSRU5UIGJyZWFrcG9pbnQgZW5hYmxlcyB0aGUgZmVhdHVyZVxuICAgIGlmIChhbnlOYXZFbmFibGVkKSAkY2Fyb3VzZWwuYWRkQ2xhc3MoJ3N3aXBlci1lbGVtZW50b3ItaGFzLW5hdmlnYXRpb24nKTtcbiAgICBpZiAoYW55UGFnRW5hYmxlZCkgJGNhcm91c2VsLmFkZENsYXNzKCdzd2lwZXItZWxlbWVudG9yLWhhcy1wYWdpbmF0aW9uJyk7XG4gICAgaWYgKGFueVNjckVuYWJsZWQpICRjYXJvdXNlbC5hZGRDbGFzcygnc3dpcGVyLWVsZW1lbnRvci1oYXMtc2Nyb2xsYmFyJyk7XG5cbiAgICB2YXIgc3VmZml4RnJvbUJwID0gZnVuY3Rpb24gKGJwKSB7XG4gICAgICAgIGJwID0gcGFyc2VJbnQoYnAsIDEwKSB8fCAwO1xuICAgICAgICBpZiAoYnAgPj0gMTQwMCkgcmV0dXJuICdYWEwnO1xuICAgICAgICBpZiAoYnAgPj0gMTIwMCkgcmV0dXJuICdYTCc7XG4gICAgICAgIGlmIChicCA+PSA5OTIpIHJldHVybiAnTEcnO1xuICAgICAgICBpZiAoYnAgPj0gNzY4KSByZXR1cm4gJ01EJztcbiAgICAgICAgaWYgKGJwID49IDU3NikgcmV0dXJuICdTTSc7XG4gICAgICAgIHJldHVybiAnWFMnO1xuICAgIH07XG5cbiAgICB2YXIgdXBkYXRlUmVzcG9uc2l2ZUNsYXNzZXMgPSBmdW5jdGlvbiAoc3dpcGVyKSB7XG4gICAgICAgIHZhciBzdWZmaXggPSBzdWZmaXhGcm9tQnAoc3dpcGVyICYmIHN3aXBlci5jdXJyZW50QnJlYWtwb2ludCk7XG4gICAgICAgICRjYXJvdXNlbFxuICAgICAgICAgICAgLnRvZ2dsZUNsYXNzKCdzd2lwZXItZWxlbWVudG9yLW5hdi1vbicsICEhc2F2ZWRPcHRpb25zWyduYXZpZ2F0aW9uJyArIHN1ZmZpeF0pXG4gICAgICAgICAgICAudG9nZ2xlQ2xhc3MoJ3N3aXBlci1lbGVtZW50b3ItcGFnLW9uJywgISFzYXZlZE9wdGlvbnNbJ3BhZ2luYXRpb24nICsgc3VmZml4XSlcbiAgICAgICAgICAgIC50b2dnbGVDbGFzcygnc3dpcGVyLWVsZW1lbnRvci1zY3Itb24nLCAhIXNhdmVkT3B0aW9uc1snc2Nyb2xsYmFyJyArIHN1ZmZpeF0pO1xuICAgIH07XG5cbiAgICB2YXIgaXNFZGl0TW9kZSA9ICEhKHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZyAmJiBlbGVtZW50b3JGcm9udGVuZENvbmZpZy5pc0VkaXRNb2RlKTtcblxuICAgIC8vIEJ1aWxkIHRoZSBtb2R1bGVzIGFycmF5IHdoZW4gdGhlIHRoZW1lIHByb3ZpZGVzIFN3aXBlciBjb3JlIChub3QgdGhlIGJ1bmRsZSlcbiAgICB2YXIgbW9kdWxlcyA9IFtdO1xuICAgIGlmIChTd2lwZXJNb2R1bGVzKSB7XG4gICAgICAgIGlmIChTd2lwZXJNb2R1bGVzLk5hdmlnYXRpb24pIG1vZHVsZXMucHVzaChTd2lwZXJNb2R1bGVzLk5hdmlnYXRpb24pO1xuICAgICAgICBpZiAoU3dpcGVyTW9kdWxlcy5QYWdpbmF0aW9uKSBtb2R1bGVzLnB1c2goU3dpcGVyTW9kdWxlcy5QYWdpbmF0aW9uKTtcbiAgICAgICAgaWYgKFN3aXBlck1vZHVsZXMuU2Nyb2xsYmFyKSBtb2R1bGVzLnB1c2goU3dpcGVyTW9kdWxlcy5TY3JvbGxiYXIpO1xuICAgICAgICBpZiAoU3dpcGVyTW9kdWxlcy5BdXRvcGxheSAmJiBzYXZlZE9wdGlvbnMuYXV0b3BsYXkpIG1vZHVsZXMucHVzaChTd2lwZXJNb2R1bGVzLkF1dG9wbGF5KTtcbiAgICAgICAgaWYgKFN3aXBlck1vZHVsZXMuR3JpZCAmJiBzYXZlZE9wdGlvbnMuaXRlbXNQZXJDb2x1bW4gJiYgc2F2ZWRPcHRpb25zLml0ZW1zUGVyQ29sdW1uID4gMSkgbW9kdWxlcy5wdXNoKFN3aXBlck1vZHVsZXMuR3JpZCk7XG4gICAgICAgIGlmIChTd2lwZXJNb2R1bGVzLkVmZmVjdEZhZGUgJiYgc2F2ZWRPcHRpb25zLmZhZGUpIG1vZHVsZXMucHVzaChTd2lwZXJNb2R1bGVzLkVmZmVjdEZhZGUpO1xuICAgIH1cblxuICAgIHZhciBzd2lwZXJPcHRpb25zID0ge1xuICAgICAgICB0b3VjaEV2ZW50c1RhcmdldDogJ2NvbnRhaW5lcicsXG4gICAgICAgIHdhdGNoT3ZlcmZsb3c6IHRydWUsXG4gICAgICAgIG5hdmlnYXRpb246IGFueU5hdkVuYWJsZWQgPyBtYWtlTmF2aWdhdGlvbih0cnVlKSA6IGZhbHNlLFxuICAgICAgICBwYWdpbmF0aW9uOiBhbnlQYWdFbmFibGVkID8gbWFrZVBhZ2luYXRpb24odHJ1ZSkgOiBmYWxzZSxcbiAgICAgICAgc2Nyb2xsYmFyOiBhbnlTY3JFbmFibGVkID8gbWFrZVNjcm9sbGJhcih0cnVlKSA6IGZhbHNlLFxuICAgICAgICBzcGVlZDogc2F2ZWRPcHRpb25zLnNwZWVkIHx8IDMwMCxcbiAgICAgICAgYnJlYWtwb2ludHM6IGJyZWFrcG9pbnRDb25maWdzLFxuICAgICAgICBvbjoge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZVJlc3BvbnNpdmVDbGFzc2VzKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRvZ2dsZUFycm93cyh0aGlzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzbGlkZUNoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRvZ2dsZUFycm93cyh0aGlzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBicmVha3BvaW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlUmVzcG9uc2l2ZUNsYXNzZXModGhpcyk7XG4gICAgICAgICAgICAgICAgdG9nZ2xlQXJyb3dzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEluamVjdCBtb2R1bGVzIHdoZW4gdXNpbmcgU3dpcGVyIGNvcmUgKG5vdCB0aGUgYnVuZGxlKVxuICAgIGlmIChtb2R1bGVzLmxlbmd0aCkge1xuICAgICAgICBzd2lwZXJPcHRpb25zLm1vZHVsZXMgPSBtb2R1bGVzO1xuICAgIH1cblxuICAgIC8vIERpcmVjdGlvblxuICAgIGlmIChzYXZlZE9wdGlvbnMuZGlyZWN0aW9uICYmIChzYXZlZE9wdGlvbnMuZGlyZWN0aW9uID09PSAndmVydGljYWwnIHx8IHNhdmVkT3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykpIHtcbiAgICAgICAgc3dpcGVyT3B0aW9ucy5kaXJlY3Rpb24gPSBzYXZlZE9wdGlvbnMuZGlyZWN0aW9uO1xuICAgIH1cblxuICAgIC8vIEF1dG8gaGVpZ2h0XG4gICAgaWYgKHNhdmVkT3B0aW9ucy5hdXRvSGVpZ2h0KSB7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuYXV0b0hlaWdodCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gR3JpZCByb3dzIChwcm9kdWN0cywgYnJhbmRzKVxuICAgIGlmIChzYXZlZE9wdGlvbnMuaXRlbXNQZXJDb2x1bW4gJiYgc2F2ZWRPcHRpb25zLml0ZW1zUGVyQ29sdW1uID4gMSkge1xuICAgICAgICB2YXIgZ3JpZENvbmYgPSB7ZmlsbDogJ3JvdycsIHJvd3M6IHNhdmVkT3B0aW9ucy5pdGVtc1BlckNvbHVtbn07XG4gICAgICAgIHN3aXBlck9wdGlvbnMuZ3JpZCA9IGdyaWRDb25mO1xuICAgICAgICBpZiAoc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1s3NjhdKSBzd2lwZXJPcHRpb25zLmJyZWFrcG9pbnRzWzc2OF0uZ3JpZCA9IGdyaWRDb25mO1xuICAgICAgICBpZiAoc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1s5OTJdKSBzd2lwZXJPcHRpb25zLmJyZWFrcG9pbnRzWzk5Ml0uZ3JpZCA9IGdyaWRDb25mO1xuICAgICAgICBpZiAoc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1sxMjAwXSkgc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1sxMjAwXS5ncmlkID0gZ3JpZENvbmY7XG4gICAgICAgIGlmIChzd2lwZXJPcHRpb25zLmJyZWFrcG9pbnRzWzE0MDBdKSBzd2lwZXJPcHRpb25zLmJyZWFrcG9pbnRzWzE0MDBdLmdyaWQgPSBncmlkQ29uZjtcbiAgICB9XG5cbiAgICAvLyBBdXRvcGxheVxuICAgIGlmIChzYXZlZE9wdGlvbnMuYXV0b3BsYXkpIHtcbiAgICAgICAgc3dpcGVyT3B0aW9ucy5hdXRvcGxheSA9IHtcbiAgICAgICAgICAgIGRlbGF5OiBzYXZlZE9wdGlvbnMuYXV0b3BsYXlTcGVlZCB8fCA1MDAwLFxuICAgICAgICAgICAgcGF1c2VPbk1vdXNlRW50ZXI6IHNhdmVkT3B0aW9ucy5wYXVzZU9uSG92ZXIgfHwgZmFsc2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGYWRlIGVmZmVjdFxuICAgIGlmIChzYXZlZE9wdGlvbnMuZmFkZSkge1xuICAgICAgICBzd2lwZXJPcHRpb25zLmVmZmVjdCA9ICdmYWRlJztcbiAgICAgICAgc3dpcGVyT3B0aW9ucy5mYWRlRWZmZWN0ID0ge2Nyb3NzRmFkZTogdHJ1ZX07XG4gICAgfVxuXG4gICAgLy8gRGlzYWJsZSB0b3VjaCAoc2VjdGlvbiBzbGlkZXJzKVxuICAgIGlmIChzYXZlZE9wdGlvbnMuYWxsb3dUb3VjaE1vdmUgPT09IGZhbHNlKSB7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuYWxsb3dUb3VjaE1vdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsIHNsaWRlXG4gICAgaWYgKHNhdmVkT3B0aW9ucy5pbml0aWFsU2xpZGUgIT09IHVuZGVmaW5lZCAmJiBzYXZlZE9wdGlvbnMuaW5pdGlhbFNsaWRlICE9PSBudWxsKSB7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuaW5pdGlhbFNsaWRlID0gcGFyc2VJbnQoc2F2ZWRPcHRpb25zLmluaXRpYWxTbGlkZSwgMTApO1xuICAgIH1cblxuICAgIGlmIChTV0lQRVJfREVCVUcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbmFsIFN3aXBlciBjb25maWc6JywgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzd2lwZXJPcHRpb25zLCBmdW5jdGlvbiAoaywgdikge1xuICAgICAgICAgICAgLy8gU2tpcCBET00gZWxlbWVudHMgaW4gbmF2aWdhdGlvbi9wYWdpbmF0aW9uL3Njcm9sbGJhciBmb3IgY2xlYW5lciBvdXRwdXRcbiAgICAgICAgICAgIGlmIChrID09PSAnZWwnIHx8IGsgPT09ICduZXh0RWwnIHx8IGsgPT09ICdwcmV2RWwnKSByZXR1cm4gdiA/ICdbRE9NIGVsZW1lbnRdJyA6IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSkpKTtcbiAgICAgICAgY29uc29sZS5sb2coJ05hdmlnYXRpb24gcHJldkVsOicsIHN3aXBlck9wdGlvbnMubmF2aWdhdGlvbiA/IHN3aXBlck9wdGlvbnMubmF2aWdhdGlvbi5wcmV2RWwgOiAnbm9uZScpO1xuICAgICAgICBjb25zb2xlLmxvZygnTmF2aWdhdGlvbiBuZXh0RWw6Jywgc3dpcGVyT3B0aW9ucy5uYXZpZ2F0aW9uID8gc3dpcGVyT3B0aW9ucy5uYXZpZ2F0aW9uLm5leHRFbCA6ICdub25lJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQYWdpbmF0aW9uIGVsOicsIHN3aXBlck9wdGlvbnMucGFnaW5hdGlvbiA/IHN3aXBlck9wdGlvbnMucGFnaW5hdGlvbi5lbCA6ICdub25lJyk7XG4gICAgfVxuXG5cbiAgICB2YXIgc3dpcGVySW5zdGFuY2UgPSBuZXcgU3dpcGVyKCRjYXJvdXNlbFswXSwgc3dpcGVyT3B0aW9ucyk7XG5cbiAgICAvLyBFbGVtZW50b3IgZWRpdG9yOiB3aGVuIHVzZXIgc3dpdGNoZXMgZGV2aWNlIHByZXZpZXcgbW9kZSwgZm9yY2Ugc3dpcGVyLnVwZGF0ZSgpXG4gICAgLy8gc28gYnJlYWtwb2ludHMgYXJlIHJlLWV2YWx1YXRlZCBhZ2FpbnN0IHRoZSBuZXcgaWZyYW1lIHdpZHRoLlxuICAgIC8vIE5PVEU6IHRoaXMgaGFuZGxlciBydW5zIGluIHRoZSBFRElUT1Igd2luZG93IChub3QgdGhlIGlmcmFtZSksIHNvIGB3aW5kb3cuZWxlbWVudG9yYFxuICAgIC8vIGlzIGRpcmVjdGx5IGFjY2Vzc2libGUuIFRoZSBjYXJvdXNlbCBET00gZWxlbWVudCBsaXZlcyBpbiB0aGUgaWZyYW1lIHRob3VnaCwgcmVhY2hhYmxlXG4gICAgLy8gdmlhICRjYXJvdXNlbFswXS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LlxuICAgIGlmIChpc0VkaXRNb2RlKSB7XG4gICAgICAgIHZhciBpZnJhbWVXaW4gPSAkY2Fyb3VzZWxbMF0ub3duZXJEb2N1bWVudCAmJiAkY2Fyb3VzZWxbMF0ub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcblxuICAgICAgICAvLyBSb290IGNhdXNlOiBTd2lwZXIncyBnZXRCcmVha3BvaW50KCkgdXNlcyB0aGUgZ2xvYmFsIGBtYXRjaE1lZGlhYCBmcm9tIHRoZVxuICAgICAgICAvLyBzY3JpcHQncyByZWFsbSDigJQgaS5lLiB0aGUgZWRpdG9yIHdpbmRvdywgd2hpY2ggc3RheXMgZGVza3RvcC1zaXplZC5cbiAgICAgICAgLy8gV2Ugb3ZlcnJpZGUgaXQgdG8gdXNlIHRoZSBJRlJBTUUgd2luZG93J3MgbWF0Y2hNZWRpYSwgc28gYnJlYWtwb2ludHMgYXJlXG4gICAgICAgIC8vIHJlc29sdmVkIGFnYWluc3QgdGhlIHByZXZpZXcgdmlld3BvcnQgKHdoaWNoIGFjdHVhbGx5IHJlc2l6ZXMgd2l0aCBkZXZpY2UgbW9kZSkuXG4gICAgICAgIGlmIChpZnJhbWVXaW4gJiYgaWZyYW1lV2luICE9PSB3aW5kb3cgJiYgdHlwZW9mIGlmcmFtZVdpbi5tYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzd2lwZXJJbnN0YW5jZS5nZXRCcmVha3BvaW50ID0gZnVuY3Rpb24gKGJyZWFrcG9pbnRzLCBiYXNlLCBjb250YWluZXJFbCkge1xuICAgICAgICAgICAgICAgIGlmICghYnJlYWtwb2ludHMpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBPYmplY3Qua2V5cyhicmVha3BvaW50cykubWFwKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcCA9PT0gJ3N0cmluZycgJiYgcC5pbmRleE9mKCdAJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaW5SYXRpbyA9IHBhcnNlRmxvYXQocC5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogaWZyYW1lV2luLmlubmVySGVpZ2h0ICogbWluUmF0aW8sIHBvaW50OiBwIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHAsIHBvaW50OiBwIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGlzdC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBwYXJzZUludChhLnZhbHVlLCAxMCkgLSBwYXJzZUludChiLnZhbHVlLCAxMCk7IH0pO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50QnA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gbGlzdFtpXS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhc2UgPT09ICd3aW5kb3cnIHx8IGJhc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlmcmFtZVdpbi5tYXRjaE1lZGlhKCcobWluLXdpZHRoOiAnICsgdiArICdweCknKS5tYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEJwID0gbGlzdFtpXS5wb2ludDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2IDw9IGNvbnRhaW5lckVsLmNsaWVudFdpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50QnAgPSBsaXN0W2ldLnBvaW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50QnAgfHwgJ21heCc7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ1tTd2lwZXIgZWRpdG9yXSDinJMgZ2V0QnJlYWtwb2ludCBvdmVycmlkZGVuIHRvIHVzZSBpZnJhbWUgbWF0Y2hNZWRpYScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpcmVVcGRhdGUgPSBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cCgnJWNbU3dpcGVyIGVkaXRvcl0gZGV2aWNlIG1vZGUgY2hhbmdlICgnICsgc291cmNlICsgJyknLCAnY29sb3I6I0U5MUU2Mztmb250LXdlaWdodDpib2xkJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Nhcm91c2VsOicsIGRlYnVnSWQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdpZnJhbWUgd2luZG93LmlubmVyV2lkdGg6JywgaWZyYW1lV2luID8gaWZyYW1lV2luLmlubmVyV2lkdGggOiAnbi9hJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nhcm91c2VsIGNvbnRhaW5lciBjbGllbnRXaWR0aDonLCAkY2Fyb3VzZWxbMF0uY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjdXJyZW50IHNsaWRlc1BlclZpZXc6Jywgc3dpcGVySW5zdGFuY2UgPyBzd2lwZXJJbnN0YW5jZS5wYXJhbXMuc2xpZGVzUGVyVmlldyA6ICduL2EnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY3VycmVudCBhY3RpdmVCcmVha3BvaW50OicsIHN3aXBlckluc3RhbmNlID8gc3dpcGVySW5zdGFuY2UuY3VycmVudEJyZWFrcG9pbnQgOiAnbi9hJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzd2lwZXJJbnN0YW5jZSB8fCBzd2lwZXJJbnN0YW5jZS5kZXN0cm95ZWQpIHJldHVybjtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghc3dpcGVySW5zdGFuY2UgfHwgc3dpcGVySW5zdGFuY2UuZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdmFyIGJlZm9yZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHN3aXBlckluc3RhbmNlLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiBzd2lwZXJJbnN0YW5jZS5wYXJhbXMuc2xpZGVzUGVyVmlldyxcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludDogc3dpcGVySW5zdGFuY2UuY3VycmVudEJyZWFrcG9pbnRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHNldEJyZWFrcG9pbnQoKSByZS1ldmFsdWF0ZXMgYnJlYWtwb2ludHMgYWdhaW5zdCBjdXJyZW50IHdpbmRvdy9jb250YWluZXJcbiAgICAgICAgICAgICAgICAvLyB3aWR0aCDigJQgdXBkYXRlKCkgYWxvbmUgZG9lcyBOT1QgdHJpZ2dlciBicmVha3BvaW50IHJlLWV2YWx1YXRpb24uXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzd2lwZXJJbnN0YW5jZS5zZXRCcmVha3BvaW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXBlckluc3RhbmNlLnNldEJyZWFrcG9pbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpcGVySW5zdGFuY2UudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwKCclY1tTd2lwZXIgZWRpdG9yXSB1cGRhdGUoKSBjYWxsZWQgKCcgKyBzb3VyY2UgKyAnKScsICdjb2xvcjojNENBRjUwO2ZvbnQtd2VpZ2h0OmJvbGQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Nhcm91c2VsOicsIGRlYnVnSWQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaWZyYW1lIHdpbmRvdy5pbm5lcldpZHRoOicsIGlmcmFtZVdpbiA/IGlmcmFtZVdpbi5pbm5lcldpZHRoIDogJ24vYScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY2Fyb3VzZWwgY29udGFpbmVyIGNsaWVudFdpZHRoOicsICRjYXJvdXNlbFswXS5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCRUZPUkU6JywgYmVmb3JlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FGVEVSOicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzd2lwZXJJbnN0YW5jZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IHN3aXBlckluc3RhbmNlLnBhcmFtcy5zbGlkZXNQZXJWaWV3LFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludDogc3dpcGVySW5zdGFuY2UuY3VycmVudEJyZWFrcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIC0tLSBEaWFnbm9zdGljIC0tLVxuICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSB7XG4gICAgICAgICAgICBjb25zb2xlLmdyb3VwKCclY1tTd2lwZXIgZWRpdG9yXSBiaW5kaW5nIGRpYWdub3N0aWNzICgnICsgZGVidWdJZCArICcpJywgJ2NvbG9yOiNGRjk4MDA7Zm9udC13ZWlnaHQ6Ym9sZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3J1bm5pbmcgaW4gaWZyYW1lPycsIHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaWZyYW1lV2luIChmcm9tIGVsZW1lbnQpOicsICEhaWZyYW1lV2luLCBpZnJhbWVXaW4gPyAoJ2lubmVyV2lkdGg9JyArIGlmcmFtZVdpbi5pbm5lcldpZHRoKSA6ICcnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZWxlbWVudG9yOicsIHR5cGVvZiB3aW5kb3cuZWxlbWVudG9yKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZWxlbWVudG9yLmNoYW5uZWxzOicsIHdpbmRvdy5lbGVtZW50b3IgPyB0eXBlb2Ygd2luZG93LmVsZW1lbnRvci5jaGFubmVscyA6ICduL2EnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3aW5kb3cuZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGU6JywgKHdpbmRvdy5lbGVtZW50b3IgJiYgd2luZG93LmVsZW1lbnRvci5jaGFubmVscykgPyB0eXBlb2Ygd2luZG93LmVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlIDogJ24vYScpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3dpbmRvdy5qUXVlcnk6JywgdHlwZW9mIHdpbmRvdy5qUXVlcnkpO1xuICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RyYXRlZ3kgMTogQmFja2JvbmUuUmFkaW8gY2hhbm5lbCAobW9zdCByZWxpYWJsZSlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuZWxlbWVudG9yICYmIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMgJiYgd2luZG93LmVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcmVVcGRhdGUoJ2NoYW5uZWw6ZGV2aWNlTW9kZS5jaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmxvZygnW1N3aXBlciBlZGl0b3JdIOKckyBib3VuZCB0byBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSBjaGFuZ2UnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU1dJUEVSX0RFQlVHKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbU3dpcGVyIGVkaXRvcl0g4pyXIGVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS53YXJuKCdbU3dpcGVyIGVkaXRvcl0g4pyXIGNoYW5uZWwgYmluZCBmYWlsZWQ6JywgZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdHJhdGVneSAyOiBqUXVlcnkgZXZlbnQgb24gZWRpdG9yIHdpbmRvd1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cualF1ZXJ5KHdpbmRvdykub24oJ2NoYW5nZWREZXZpY2VNb2RlLmlxaXRTd2lwZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcmVVcGRhdGUoJ2pxdWVyeTpjaGFuZ2VkRGV2aWNlTW9kZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdbU3dpcGVyIGVkaXRvcl0g4pyTIGJvdW5kIHRvIHdpbmRvdyBqUXVlcnkgY2hhbmdlZERldmljZU1vZGUnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU1dJUEVSX0RFQlVHKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbU3dpcGVyIGVkaXRvcl0g4pyXIGpRdWVyeSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUud2FybignW1N3aXBlciBlZGl0b3JdIOKclyBqcXVlcnkgYmluZCBmYWlsZWQ6JywgZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdHJhdGVneSAzOiByZXNpemUgZXZlbnQgb24gdGhlIGlmcmFtZSB3aW5kb3cgKHdoZXJlIHRoZSBjYXJvdXNlbCBET00gbGl2ZXMpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoaWZyYW1lV2luICYmIGlmcmFtZVdpbiAhPT0gd2luZG93KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmpRdWVyeShpZnJhbWVXaW4pLm9uKCdyZXNpemUuaXFpdFN3aXBlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyZVVwZGF0ZSgnaWZyYW1lV2luOnJlc2l6ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdbU3dpcGVyIGVkaXRvcl0g4pyTIGJvdW5kIHRvIGlmcmFtZSB3aW5kb3cgcmVzaXplJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUud2FybignW1N3aXBlciBlZGl0b3JdIOKclyBpZnJhbWUgcmVzaXplIGJpbmQgZmFpbGVkOicsIGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICBjb25zb2xlLmxvZygnU3dpcGVyIGluc3RhbmNlIGNyZWF0ZWQnKTtcbiAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIH1cbn1cblxuLy8gUmVnaXN0ZXIgdGhlIHNhbWUgaGFuZGxlciBmb3IgYWxsIGNhcm91c2VsIHNlbGVjdG9yc1xuQ0FST1VTRUxfU0VMRUNUT1JTLmZvckVhY2goZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoc2VsZWN0b3IsIGluaXRDYXJvdXNlbCk7XG59KTtcbiIsIi8qIGdsb2JhbCAkICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG52YXIgQU5DSE9SX1NFTEVDVE9SID0gJy5lbGVtZW50b3ItdG9jLWFuY2hvcltpZF1bZGF0YS10b2MtdGl0bGVdJztcbnZhciBUT0NfSU5JVF9GTEFHID0gJ2RhdGEtdG9jLWluaXRpYWxpemVkJztcblxuZnVuY3Rpb24gaW5pdFRvYyhlbCkge1xuICAgIGlmICghZWwgfHwgZWwuZ2V0QXR0cmlidXRlKFRPQ19JTklUX0ZMQUcpID09PSAnMScpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbC5zZXRBdHRyaWJ1dGUoVE9DX0lOSVRfRkxBRywgJzEnKTtcblxuICAgIHZhciAkdG9jID0gJChlbCk7XG4gICAgdmFyICRib2R5ID0gJHRvYy5maW5kKCcuZWxlbWVudG9yLXRvY19fYm9keScpO1xuICAgIGlmICghJGJvZHkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdHJhY2tpbmdOYW1lc3BhY2UgPSAnLmlxaXRUb2MnICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cbiAgICBmdW5jdGlvbiByZWZyZXNoKCkge1xuICAgICAgICB2YXIgYW5jaG9ycyA9IGJ1aWxkVG9jKCR0b2MsIGVsLCAkYm9keSk7XG4gICAgICAgIHNldHVwQWN0aXZlVHJhY2tpbmcoJHRvYywgYW5jaG9ycywgdHJhY2tpbmdOYW1lc3BhY2UpO1xuICAgIH1cblxuICAgIHJlZnJlc2goKTtcblxuICAgICR0b2Mub24oJ2NsaWNrJywgJy5lbGVtZW50b3ItdG9jX19saXN0LWl0ZW0tdGV4dCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGhyZWYgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmIHx8IGhyZWYuY2hhckF0KDApICE9PSAnIycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHJlZi5zdWJzdHJpbmcoMSkpO1xuICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvZmZzZXQgPSA4MDtcbiAgICAgICAgdmFyIHRvcCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQgLSBvZmZzZXQ7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbyh7IHRvcDogdG9wLCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICAgIGlmIChoaXN0b3J5LnB1c2hTdGF0ZSkge1xuICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgaHJlZik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlYnVpbGQgd2hlbmV2ZXIgYW5jaG9ycyBhcmUgYWRkZWQvcmVtb3ZlZC9lZGl0ZWQgZWxzZXdoZXJlIGluIHRoZSBwYWdlLlxuICAgIC8vIENoZWFwIG9uIHRoZSBmcm9udGVuZCAoRE9NIGlzIHN0YXRpYyBhZnRlciBsb2FkKSBhbmQgbmVjZXNzYXJ5IGluIHRoZVxuICAgIC8vIEVsZW1lbnRvciBlZGl0b3IgaWZyYW1lLCB3aGVyZSB3aWRnZXRzIGFyZSBBSkFYLXJlbmRlcmVkIGFmdGVyIHRoZVxuICAgIC8vIGluaXRpYWwgc2Nhbi5cbiAgICB2YXIgcmVidWlsZFRpbWVyID0gbnVsbDtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAobXV0YXRpb25zKSB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jb250YWlucyhlbCkpIHtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICQod2luZG93KS5vZmYodHJhY2tpbmdOYW1lc3BhY2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZWxldmFudCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBpZiAoIXRhcmdldCB8fCAhZWwuY29udGFpbnModGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJlbGV2YW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJlbGV2YW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlYnVpbGRUaW1lcik7XG4gICAgICAgIHJlYnVpbGRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGVsKSkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAkKHdpbmRvdykub2ZmKHRyYWNraW5nTmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIH0sIDI1MCk7XG4gICAgfSk7XG5cbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IFsnaWQnLCAnZGF0YS10b2MtdGl0bGUnXVxuICAgIH0pO1xufVxuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignLmVsZW1lbnRvci10b2MnLCBmdW5jdGlvbiAoKSB7XG4gICAgaW5pdFRvYyh0aGlzIGluc3RhbmNlb2YgRWxlbWVudCA/IHRoaXMgOiB0aGlzWzBdKTtcbn0pO1xuXG4vLyBJbiB0aGUgRWxlbWVudG9yIGVkaXRvciBpZnJhbWUsIHdpZGdldHMgYXJlIGluc2VydGVkIHZpYSBBSkFYIGFmdGVyXG4vLyBET01Db250ZW50TG9hZGVkIOKAlCBFbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlciBvbmx5IGNhdGNoZXMgZWxlbWVudHMgcHJlc2VudFxuLy8gYXQgSlMgbG9hZCB0aW1lLCBzbyBhIGxhdGUtaW5zZXJ0ZWQgVE9DIHdpZGdldCB3b3VsZCBuZXZlciBnZXQgaW5pdGlhbGl6ZWQuXG4vLyBSdW4gYW4gZXh0cmEgb2JzZXJ2ZXIgdG8gY2F0Y2ggdGhlbS4gSWRlbXBvdGVudCB0aGFua3MgdG8gdGhlIGluaXQgZmxhZy5cbihmdW5jdGlvbiBib290c3RyYXBMYXRlVG9jcygpIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuKHJvb3QpIHtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGVzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsID8gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuZWxlbWVudG9yLXRvYycpIDogW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGluaXRUb2Mobm9kZXNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmICghZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNjYW4oZG9jdW1lbnQpO1xuXG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChtdXRhdGlvbnMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFkZGVkID0gbXV0YXRpb25zW2ldLmFkZGVkTm9kZXM7XG4gICAgICAgICAgICAgICAgaWYgKCFhZGRlZCB8fCAhYWRkZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkZGVkLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gYWRkZWRbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jbGFzc0xpc3QgJiYgbm9kZS5jbGFzc0xpc3QuY29udGFpbnMoJ2VsZW1lbnRvci10b2MnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdFRvYyhub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY2FuKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBzdGFydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnQoKTtcbiAgICB9XG59KSgpO1xuXG5mdW5jdGlvbiBidWlsZFRvYygkdG9jLCBlbCwgJGJvZHkpIHtcbiAgICB2YXIgbGlzdFRhZyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1saXN0LXRhZycpIHx8ICd1bCc7XG5cbiAgICB2YXIgcmF3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChBTkNIT1JfU0VMRUNUT1IpO1xuICAgIHZhciBhbmNob3JzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYXcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSByYXdbaV07XG4gICAgICAgIGlmIChlbC5jb250YWlucyhub2RlKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICAgIHZhciB0aXRsZSA9IG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRvYy10aXRsZScpO1xuICAgICAgICBpZiAoIWlkIHx8ICF0aXRsZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYW5jaG9ycy5wdXNoKHsgbm9kZTogbm9kZSwgaWQ6IGlkLCB0aXRsZTogdGl0bGUgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFuY2hvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICRib2R5LmVtcHR5KCk7XG4gICAgICAgIHJldHVybiBhbmNob3JzO1xuICAgIH1cblxuICAgICRib2R5Lmh0bWwoYnVpbGRGbGF0TGlzdChhbmNob3JzLCBsaXN0VGFnKSk7XG4gICAgcmV0dXJuIGFuY2hvcnM7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkRmxhdExpc3QoYW5jaG9ycywgdGFnKSB7XG4gICAgdmFyIGh0bWwgPSAnPCcgKyB0YWcgKyAnIGNsYXNzPVwiZWxlbWVudG9yLXRvY19fbGlzdC13cmFwcGVyXCI+JztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuY2hvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaHRtbCArPSAnPGxpIGNsYXNzPVwiZWxlbWVudG9yLXRvY19fbGlzdC1pdGVtXCIgZGF0YS10YXJnZXQtaWQ9XCInICsgZXNjYXBlSHRtbChhbmNob3JzW2ldLmlkKSArICdcIj4nXG4gICAgICAgICAgICArICc8YSBocmVmPVwiIycgKyBlc2NhcGVIdG1sKGFuY2hvcnNbaV0uaWQpICsgJ1wiIGNsYXNzPVwiZWxlbWVudG9yLXRvY19fbGlzdC1pdGVtLXRleHRcIj4nXG4gICAgICAgICAgICArIGVzY2FwZUh0bWwoYW5jaG9yc1tpXS50aXRsZSlcbiAgICAgICAgICAgICsgJzwvYT4nXG4gICAgICAgICAgICArICc8L2xpPic7XG4gICAgfVxuICAgIGh0bWwgKz0gJzwvJyArIHRhZyArICc+JztcbiAgICByZXR1cm4gaHRtbDtcbn1cblxuZnVuY3Rpb24gc2V0dXBBY3RpdmVUcmFja2luZygkdG9jLCBhbmNob3JzLCBuYW1lc3BhY2UpIHtcbiAgICB2YXIgbnMgPSBuYW1lc3BhY2UgfHwgJy5pcWl0VG9jJztcblxuICAgIC8vIEFsd2F5cyBkZXRhY2ggdGhlIHByZXZpb3VzIGxpc3RlbmVyIHNvIGEgcmVidWlsZCBkb2Vzbid0IGFjY3VtdWxhdGUgdGhlbVxuICAgIC8vIGFuZCBkb2Vzbid0IGtlZXAgdHJhY2tpbmcgYWdhaW5zdCBhIHN0YWxlIGFuY2hvciBsaXN0LlxuICAgICQod2luZG93KS5vZmYobnMpO1xuXG4gICAgaWYgKCFhbmNob3JzLmxlbmd0aCkge1xuICAgICAgICAkdG9jLmZpbmQoJy5lbGVtZW50b3ItdG9jX19saXN0LWl0ZW0nKS5yZW1vdmVDbGFzcygnZWxlbWVudG9yLXRvY19fbGlzdC1pdGVtLS1hY3RpdmUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciAkaXRlbXMgPSAkdG9jLmZpbmQoJy5lbGVtZW50b3ItdG9jX19saXN0LWl0ZW0nKTtcbiAgICB2YXIgb2Zmc2V0ID0gMTAwO1xuICAgIHZhciB0aWNraW5nID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBvblNjcm9sbCgpIHtcbiAgICAgICAgaWYgKHRpY2tpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aWNraW5nID0gdHJ1ZTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpY2tpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHVwZGF0ZUFjdGl2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVBY3RpdmUoKSB7XG4gICAgICAgIHZhciBzY3JvbGxZID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICB2YXIgYWN0aXZlSW5kZXggPSAtMTtcblxuICAgICAgICBmb3IgKHZhciBpID0gYW5jaG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKGFuY2hvcnNbaV0ubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQgLSBvZmZzZXQgPD0gc2Nyb2xsWSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZUluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICRpdGVtcy5yZW1vdmVDbGFzcygnZWxlbWVudG9yLXRvY19fbGlzdC1pdGVtLS1hY3RpdmUnKTtcblxuICAgICAgICBpZiAoYWN0aXZlSW5kZXggPj0gMCAmJiBhY3RpdmVJbmRleCA8ICRpdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciAkYWN0aXZlID0gJGl0ZW1zLmVxKGFjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgICRhY3RpdmUuYWRkQ2xhc3MoJ2VsZW1lbnRvci10b2NfX2xpc3QtaXRlbS0tYWN0aXZlJyk7XG4gICAgICAgICAgICBzY3JvbGxBY3RpdmVJbnRvVmlldygkdG9jLCAkYWN0aXZlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjcm9sbEFjdGl2ZUludG9WaWV3KCR0b2NFbCwgJGFjdGl2ZSkge1xuICAgICAgICBpZiAod2luZG93LmlubmVyV2lkdGggPj0gNzY4KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJvZHkgPSAkdG9jRWwuZmluZCgnLmVsZW1lbnRvci10b2NfX2JvZHknKS5nZXQoMCk7XG4gICAgICAgIHZhciBpdGVtID0gJGFjdGl2ZS5nZXQoMCk7XG4gICAgICAgIGlmICghYm9keSB8fCAhaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0YXJnZXQgPSBpdGVtLm9mZnNldExlZnQgLSAoYm9keS5jbGllbnRXaWR0aCAtIGl0ZW0ub2Zmc2V0V2lkdGgpIC8gMjtcbiAgICAgICAgYm9keS5zY3JvbGxUbyh7IGxlZnQ6IE1hdGgubWF4KDAsIHRhcmdldCksIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICB9XG5cbiAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcgKyBucywgb25TY3JvbGwpO1xuICAgIHVwZGF0ZUFjdGl2ZSgpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHN0cikge1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3RyKSk7XG4gICAgcmV0dXJuIGRpdi5pbm5lckhUTUw7XG59XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJ1tkYXRhLWVsZW1lbnRfdHlwZT1cInRhYnNcIl0nLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR3cmFwcGVyID0gJCh0aGlzKTtcbiAgICB2YXIgJG5hdiA9ICR3cmFwcGVyLmZpbmQoJz4gLmVsZW1lbnRvci10YWJzID4gLmVsZW1lbnRvci10YWJzLW5hdicpLmZpcnN0KCk7XG4gICAgdmFyICRjb250ZW50ID0gJHdyYXBwZXIuZmluZCgnPiAuZWxlbWVudG9yLXRhYnMgPiAuZWxlbWVudG9yLXRhYnMtY29udGVudCcpLmZpcnN0KCk7XG5cbiAgICBpZiAoISRuYXYubGVuZ3RoIHx8ICEkY29udGVudC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciAkdGl0bGVzID0gJG5hdi5jaGlsZHJlbignLmVsZW1lbnRvci10YWItdGl0bGUnKTtcbiAgICB2YXIgJHBhbmVzID0gJGNvbnRlbnQuY2hpbGRyZW4oJy5lbGVtZW50b3ItdGFiLWNvbnRlbnQnKTtcblxuICAgIGZ1bmN0aW9uIGFjdGl2YXRlKGluZGV4KSB7XG4gICAgICAgIGluZGV4ID0gcGFyc2VJbnQoaW5kZXgsIDEwKSB8fCAwO1xuXG4gICAgICAgICR0aXRsZXMucmVtb3ZlQ2xhc3MoJ2VsZW1lbnRvci1hY3RpdmUnKS5hdHRyKCdhcmlhLXNlbGVjdGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICRwYW5lcy5yZW1vdmVDbGFzcygnZWxlbWVudG9yLXRhYi1hY3RpdmUnKTtcblxuICAgICAgICB2YXIgJHRpdGxlID0gJHRpdGxlcy5maWx0ZXIoJ1tkYXRhLXRhYj1cIicgKyBpbmRleCArICdcIl0nKTtcbiAgICAgICAgdmFyICRwYW5lID0gJHBhbmVzLmZpbHRlcignW2RhdGEtdGFiLWluZGV4PVwiJyArIGluZGV4ICsgJ1wiXScpO1xuXG4gICAgICAgICR0aXRsZS5hZGRDbGFzcygnZWxlbWVudG9yLWFjdGl2ZScpLmF0dHIoJ2FyaWEtc2VsZWN0ZWQnLCAndHJ1ZScpO1xuICAgICAgICAkcGFuZS5hZGRDbGFzcygnZWxlbWVudG9yLXRhYi1hY3RpdmUnKTtcbiAgICB9XG5cbiAgICAvLyBBY3RpdmF0ZSBmaXJzdCB0YWIgYnkgZGVmYXVsdCAoc2VydmVyIGFscmVhZHkgbWFya3MgaXQgYWN0aXZlLCB0aGlzIGlzIGEgc2FmZXR5IG5ldClcbiAgICBpZiAoISR0aXRsZXMuZmlsdGVyKCcuZWxlbWVudG9yLWFjdGl2ZScpLmxlbmd0aCkge1xuICAgICAgICBhY3RpdmF0ZSgwKTtcbiAgICB9XG5cbiAgICAkdGl0bGVzLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBhY3RpdmF0ZSh0aGlzLmRhdGFzZXQudGFiKTtcbiAgICB9KTtcblxuICAgICR0aXRsZXMub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJyB8fCBldmVudC5rZXkgPT09ICcgJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGFjdGl2YXRlKHRoaXMuZGF0YXNldC50YWIpO1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcbiIsIi8qIGdsb2JhbCAkICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignLmVsZW1lbnRvci10YWJzJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGFicyA9ICQodGhpcyk7XG4gICAgdmFyIGRlZmF1bHRBY3RpdmVUYWIgPSAkdGFicy5kYXRhKCdhY3RpdmUtdGFiJykgfHwgMTtcbiAgICB2YXIgJHRhYnNUaXRsZXMgPSAkdGFicy5maW5kKCcuZWxlbWVudG9yLXRhYi10aXRsZScpO1xuICAgIHZhciAkdGFic0NvbnRlbnRzID0gJHRhYnMuZmluZCgnLmVsZW1lbnRvci10YWItY29udGVudCcpO1xuICAgIHZhciAkYWN0aXZlLCAkY29udGVudDtcblxuICAgIGZ1bmN0aW9uIGFjdGl2YXRlVGFiKHRhYkluZGV4KSB7XG4gICAgICAgIGlmICgkYWN0aXZlKSB7XG4gICAgICAgICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICRjb250ZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgICRhY3RpdmUgPSAkdGFic1RpdGxlcy5maWx0ZXIoJ1tkYXRhLXRhYj1cIicgKyB0YWJJbmRleCArICdcIl0nKTtcbiAgICAgICAgJGFjdGl2ZS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICRjb250ZW50ID0gJHRhYnNDb250ZW50cy5maWx0ZXIoJ1tkYXRhLXRhYj1cIicgKyB0YWJJbmRleCArICdcIl0nKTtcbiAgICAgICAgJGNvbnRlbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH1cblxuICAgIGFjdGl2YXRlVGFiKGRlZmF1bHRBY3RpdmVUYWIpO1xuXG4gICAgJHRhYnNUaXRsZXMub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhY3RpdmF0ZVRhYih0aGlzLmRhdGFzZXQudGFiKTtcbiAgICB9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLXRvZ2dsZS10aXRsZScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHRpdGxlID0gJCh0aGlzKTtcblxuICAgICR0aXRsZS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkY29udGVudCA9ICR0aXRsZS5uZXh0KCk7XG5cbiAgICAgICAgaWYgKCR0aXRsZS5oYXNDbGFzcygnYWN0aXZlJykpIHtcbiAgICAgICAgICAgICR0aXRsZS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkY29udGVudC5zbGlkZVVwKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGl0bGUuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgJGNvbnRlbnQuc2xpZGVEb3duKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQsIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignW2RhdGEtZWxlbWVudF90eXBlPVwidmlkZW9cIl0nLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR3aWRnZXQgPSAkKHRoaXMpO1xuICAgIHZhciAkaW1hZ2VPdmVybGF5ID0gJHdpZGdldC5maW5kKCcuZWxlbWVudG9yLWN1c3RvbS1lbWJlZC1pbWFnZS1vdmVybGF5Jyk7XG4gICAgdmFyICR2aWRlb01vZGFsQnRuID0gJHdpZGdldC5maW5kKCcuZWxlbWVudG9yLXZpZGVvLW9wZW4tbW9kYWwnKS5maXJzdCgpO1xuICAgIHZhciAkdmlkZW9Nb2RhbCA9ICR3aWRnZXQuZmluZCgnLmVsZW1lbnRvci12aWRlby1tb2RhbCcpLmZpcnN0KCk7XG4gICAgdmFyICR2aWRlbyA9ICR3aWRnZXQuZmluZCgnLmVsZW1lbnRvci12aWRlbycpLmZpcnN0KCk7XG4gICAgdmFyICR2aWRlb0ZyYW1lID0gJHdpZGdldC5maW5kKCdpZnJhbWUnKTtcblxuICAgIGlmICgkaW1hZ2VPdmVybGF5Lmxlbmd0aCkge1xuICAgICAgICAkaW1hZ2VPdmVybGF5Lm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRpbWFnZU92ZXJsYXkucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIGlmICgkdmlkZW8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgJHZpZGVvWzBdLnBsYXkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkdmlkZW9GcmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JjID0gJHZpZGVvRnJhbWVbMF0uc3JjO1xuICAgICAgICAgICAgICAgICR2aWRlb0ZyYW1lWzBdLnNyYyA9IHNyYy5yZXBsYWNlKCdhdXRvcGxheT0wJywgJ2F1dG9wbGF5PTEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCEkdmlkZW9Nb2RhbEJ0bi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICR2aWRlb01vZGFsQnRuLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCR2aWRlby5sZW5ndGgpIHtcbiAgICAgICAgICAgICR2aWRlb1swXS5wbGF5KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHZpZGVvRnJhbWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgc3JjID0gJHZpZGVvRnJhbWVbMF0uc3JjO1xuICAgICAgICAgICAgJHZpZGVvRnJhbWVbMF0uc3JjID0gc3JjLnJlcGxhY2UoJ2F1dG9wbGF5PTAnLCAnYXV0b3BsYXk9MScpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkdmlkZW9Nb2RhbC5vbignaGlkZS5icy5tb2RhbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCR2aWRlby5sZW5ndGgpIHtcbiAgICAgICAgICAgICR2aWRlb1swXS5wYXVzZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCR2aWRlb0ZyYW1lLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHNyYyA9ICR2aWRlb0ZyYW1lWzBdLnNyYztcbiAgICAgICAgICAgICR2aWRlb0ZyYW1lWzBdLnNyYyA9IHNyYy5yZXBsYWNlKCdhdXRvcGxheT0xJywgJ2F1dG9wbGF5PTAnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iXX0=
