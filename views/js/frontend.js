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

},{"elementor-frontend/elements-handler":1,"elementor-frontend/handlers/accordion":3,"elementor-frontend/handlers/alert":4,"elementor-frontend/handlers/counter":5,"elementor-frontend/handlers/global":6,"elementor-frontend/handlers/lottie":7,"elementor-frontend/handlers/prestashop-contactform":8,"elementor-frontend/handlers/prestashop-search":9,"elementor-frontend/handlers/progress":10,"elementor-frontend/handlers/section":11,"elementor-frontend/handlers/swiper":12,"elementor-frontend/handlers/table-of-contents":13,"elementor-frontend/handlers/tabs":14,"elementor-frontend/handlers/toggle":15,"elementor-frontend/handlers/video":16}],3:[function(require,module,exports){
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

ElementsHandler.addHandler('.elementor-toc', function () {
    var $toc = $(this);
    var el = $toc[0];

    var headingTags = (el.getAttribute('data-headings') || 'h2').split(',');
    var containerSelector = el.getAttribute('data-container') || '';
    var hierarchical = el.getAttribute('data-hierarchical') === '1';
    var listTag = el.getAttribute('data-list-tag') || 'ul';
    var noHeadingsMessage = el.getAttribute('data-no-headings-message') || '';

    var $body = $toc.find('.elementor-toc__body');
    if (!$body.length) {
        return;
    }

    // Scope
    var scope = containerSelector ? document.querySelector(containerSelector) : document;
    if (!scope) {
        scope = document;
    }

    // Find headings (exclude those inside the widget itself)
    var selector = headingTags.join(',');
    var allHeadings = scope.querySelectorAll(selector);
    var headings = [];
    for (var i = 0; i < allHeadings.length; i++) {
        if (!el.contains(allHeadings[i])) {
            headings.push(allHeadings[i]);
        }
    }

    if (headings.length === 0) {
        $body.html(
            noHeadingsMessage
                ? '<div class="elementor-toc__no-headings">' + escapeHtml(noHeadingsMessage) + '</div>'
                : ''
        );
        return;
    }

    // Ensure each heading has an id
    for (var j = 0; j < headings.length; j++) {
        if (!headings[j].id) {
            headings[j].id = 'toc-heading-' + j;
        }
    }

    // Build list
    var html = hierarchical
        ? buildHierarchicalList(headings, listTag, headingTags)
        : buildFlatList(headings, listTag);

    $body.html(html);

    // Collapse / Expand
    setupToggle($toc);

    // Smooth scroll
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

    // Active tracking
    setupActiveTracking($toc, headings);
});

/* ------------------------------------------------------------------
 *  List builders
 * ------------------------------------------------------------------ */

function buildFlatList(headings, tag) {
    var html = '<' + tag + ' class="elementor-toc__list-wrapper">';
    for (var i = 0; i < headings.length; i++) {
        html += buildListItem(headings[i]) + '</li>';
    }
    html += '</' + tag + '>';
    return html;
}

function buildHierarchicalList(headings, tag, allowedTags) {
    var weightMap = {};
    var sortedTags = allowedTags.slice().sort();
    for (var t = 0; t < sortedTags.length; t++) {
        weightMap[sortedTags[t].toLowerCase()] = t + 1;
    }

    var html = '';
    var stack = [];

    for (var i = 0; i < headings.length; i++) {
        var tagName = headings[i].tagName.toLowerCase();
        var level = weightMap[tagName] || 1;

        if (stack.length === 0) {
            html += '<' + tag + ' class="elementor-toc__list-wrapper">';
            stack.push(level);
        } else if (level > stack[stack.length - 1]) {
            while (stack.length < level) {
                html += '<' + tag + ' class="elementor-toc__list-wrapper">';
                stack.push(stack[stack.length - 1] + 1);
            }
        } else if (level < stack[stack.length - 1]) {
            while (stack.length > 0 && stack[stack.length - 1] > level) {
                html += '</li></' + tag + '>';
                stack.pop();
            }
            html += '</li>';
        } else {
            html += '</li>';
        }

        html += buildListItem(headings[i]);
    }

    while (stack.length > 0) {
        html += '</li></' + tag + '>';
        stack.pop();
    }

    return html;
}

function buildListItem(heading) {
    var text = heading.textContent || heading.innerText || '';
    return '<li class="elementor-toc__list-item" data-target-id="' + heading.id + '">'
        + '<a href="#' + heading.id + '" class="elementor-toc__list-item-text">'
        + escapeHtml(text.trim())
        + '</a>';
}

/* ------------------------------------------------------------------
 *  Toggle (collapse / expand)
 * ------------------------------------------------------------------ */

function setupToggle($toc) {
    var $btnExpand = $toc.find('.elementor-toc__toggle-button--expand');
    var $btnCollapse = $toc.find('.elementor-toc__toggle-button--collapse');

    if (!$btnExpand.length && !$btnCollapse.length) {
        return;
    }

    var el = $toc[0];
    var minimizedOn = '';
    if (el.classList.contains('elementor-toc--minimized-on-mobile')) {
        minimizedOn = 'mobile';
    } else if (el.classList.contains('elementor-toc--minimized-on-tablet')) {
        minimizedOn = 'tablet';
    } else if (el.classList.contains('elementor-toc--minimized-on-desktop')) {
        minimizedOn = 'desktop';
    }

    // Initial state based on breakpoint
    var w = window.innerWidth;
    var shouldMinimize = false;
    if (minimizedOn === 'mobile' && w < 768) {
        shouldMinimize = true;
    } else if (minimizedOn === 'tablet' && w < 1024) {
        shouldMinimize = true;
    } else if (minimizedOn === 'desktop') {
        shouldMinimize = true;
    }

    if (shouldMinimize) {
        $toc.addClass('elementor-toc--collapsed');
    }

    function toggle() {
        $toc.toggleClass('elementor-toc--collapsed');
    }

    $btnExpand.add($btnCollapse).on('click', toggle);
    $btnExpand.add($btnCollapse).on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });
}

/* ------------------------------------------------------------------
 *  Active heading tracking
 * ------------------------------------------------------------------ */

function setupActiveTracking($toc, headings) {
    if (!headings.length) {
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

        for (var i = headings.length - 1; i >= 0; i--) {
            if (headings[i].getBoundingClientRect().top + window.pageYOffset - offset <= scrollY) {
                activeIndex = i;
                break;
            }
        }

        $items.removeClass('elementor-toc__list-item--active');

        if (activeIndex >= 0 && activeIndex < $items.length) {
            $items.eq(activeIndex).addClass('elementor-toc__list-item--active');
        }
    }

    $(window).on('scroll.iqitToc', onScroll);
    updateActive();
}

/* ------------------------------------------------------------------
 *  Helper
 * ------------------------------------------------------------------ */

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

},{"elementor-frontend/elements-handler":1}],14:[function(require,module,exports){
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

},{"elementor-frontend/elements-handler":1}],15:[function(require,module,exports){
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

},{"elementor-frontend/elements-handler":1}],16:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2Zyb250ZW5kLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9hY2NvcmRpb24uanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL2FsZXJ0LmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9jb3VudGVyLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9nbG9iYWwuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL2xvdHRpZS5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvcHJlc3Rhc2hvcC1jb250YWN0Zm9ybS5qcyIsInZpZXdzL19kZXYvanMvZnJvbnRlbmQvaGFuZGxlcnMvcHJlc3Rhc2hvcC1zZWFyY2guanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL3Byb2dyZXNzLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9zZWN0aW9uLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy9zd2lwZXIuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL3RhYmxlLW9mLWNvbnRlbnRzLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy90YWJzLmpzIiwidmlld3MvX2Rldi9qcy9mcm9udGVuZC9oYW5kbGVycy90b2dnbGUuanMiLCJ2aWV3cy9fZGV2L2pzL2Zyb250ZW5kL2hhbmRsZXJzL3ZpZGVvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgcmVnaXN0ZXJlZFNlbGVjdG9ySGFuZGxlcnMgPSBbXTtcblxudmFyIEVIX0RFQlVHID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVoTG9nKCkge1xuICAgIGlmICghRUhfREVCVUcgfHwgdHlwZW9mIGNvbnNvbGUgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBjb25zb2xlLmxvZyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIFsnW0VsZW1lbnRzSGFuZGxlcl0nXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59XG5cbmZ1bmN0aW9uIGhhc2hTZWxlY3RvcihzdHIpIHtcbiAgICBzdHIgPSBTdHJpbmcoc3RyIHx8ICcnKTtcbiAgICB2YXIgaGFzaCA9IDUzODE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFzaCA9ICgoaGFzaCA8PCA1KSArIGhhc2gpICsgc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiAoaGFzaCA+Pj4gMCkudG9TdHJpbmcoMzYpO1xufVxuXG52YXIgRWxlbWVudHNIYW5kbGVyID0ge1xuICAgIF9ydW5IYW5kbGVyT25FbGVtZW50OiBmdW5jdGlvbiAoJGVsZW1lbnQsIGhhbmRsZXIsIGRlYnVnTGFiZWwsIHJ1bktleSkge1xuICAgICAgICB2YXIgZWxlbWVudCA9ICRlbGVtZW50WzBdO1xuICAgICAgICBlaExvZygncnVuSGFuZGxlcjogc3RhcnQnLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgcnVuS2V5OiBydW5LZXksIGVsZW1lbnQ6IGVsZW1lbnR9KTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwgdHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBhYm9ydGVkIChubyBlbGVtZW50IG9yIGludmFsaWQgaGFuZGxlciknLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgcnVuS2V5OiBydW5LZXl9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXkgPSBydW5LZXkgPyBTdHJpbmcocnVuS2V5KSA6ICcnO1xuICAgICAgICB2YXIgZG9uZUF0dHIgPSBrZXkgPyAoJ2RhdGEtZWgtZG9uZS0nICsga2V5KSA6ICcnO1xuICAgICAgICB2YXIgcGVuZGluZ0F0dHIgPSBrZXkgPyAoJ2RhdGEtZWgtcGVuZGluZy0nICsga2V5KSA6ICcnO1xuXG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShkb25lQXR0cikgfHwgZWxlbWVudC5oYXNBdHRyaWJ1dGUocGVuZGluZ0F0dHIpKSB7XG4gICAgICAgICAgICAgICAgZWhMb2coJ3J1bkhhbmRsZXI6IHNraXBwZWQgKGFscmVhZHkgZG9uZS9wZW5kaW5nKScsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBydW5LZXk6IHJ1bktleX0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKHBlbmRpbmdBdHRyLCAnMScpO1xuICAgICAgICAgICAgZWhMb2coJ3J1bkhhbmRsZXI6IG1hcmtlZCBwZW5kaW5nJywge3BlbmRpbmdBdHRyOiBwZW5kaW5nQXR0ciwgZWxlbWVudDogZWxlbWVudH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlzRWRpdE1vZGUgPSAhISh3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcgJiYgd2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnLmlzRWRpdE1vZGUpO1xuXG4gICAgICAgIGlmICgnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdyAmJiAhaXNFZGl0TW9kZSkge1xuICAgICAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChlbnRyaWVzLCBvYnMpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWhMb2coJ1tJT10gaW50ZXJzZWN0aW5nIC0+IHdpbGwgZXhlY3V0ZScsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBlbGVtZW50OiBlbGVtZW50fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUocGVuZGluZ0F0dHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGRvbmVBdHRyLCAnMScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlaExvZygncnVuSGFuZGxlcjogRVhFQ1VURSBoYW5kbGVyJywge2RlYnVnTGFiZWw6IGRlYnVnTGFiZWwsIGVsZW1lbnQ6IGVsZW1lbnR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwoJGVsZW1lbnQsICQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYnMuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDAuMVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciBvYnNlcnZlKCknLCB7ZGVidWdMYWJlbDogZGVidWdMYWJlbCwgZWxlbWVudDogZWxlbWVudH0pO1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVoTG9nKCdydW5IYW5kbGVyOiBubyBJbnRlcnNlY3Rpb25PYnNlcnZlciAtPiBpbW1lZGlhdGUgcGF0aCcsIHtkZWJ1Z0xhYmVsOiBkZWJ1Z0xhYmVsLCBlbGVtZW50OiBlbGVtZW50fSk7XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUocGVuZGluZ0F0dHIpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGRvbmVBdHRyLCAnMScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlaExvZygncnVuSGFuZGxlcjogRVhFQ1VURSBoYW5kbGVyJywge2RlYnVnTGFiZWw6IGRlYnVnTGFiZWwsIGVsZW1lbnQ6IGVsZW1lbnR9KTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwoJGVsZW1lbnQsICQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3NjaGVkdWxlUmVydW46IGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVoTG9nKCdzY2hlZHVsZVJlcnVuOiByZXF1ZXN0ZWQnLCB7c2NvcGU6ICRzY29wZSAmJiAkc2NvcGUubGVuZ3RoID8gJHNjb3BlLmdldCgwKSA6IG51bGx9KTtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZXJ1bkRlYm91bmNlVGltZXIpO1xuICAgICAgICB0aGlzLl9yZXJ1bkRlYm91bmNlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVoTG9nKCdzY2hlZHVsZVJlcnVuOiB0aW1lciBmaXJlZCcpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBlaExvZygnc2NoZWR1bGVSZXJ1bjogUkFGIC0+IHJ1blJlYWR5VHJpZ2dlcicpO1xuICAgICAgICAgICAgICAgIHNlbGYucnVuUmVhZHlUcmlnZ2VyKCRzY29wZSAmJiAkc2NvcGUubGVuZ3RoID8gJHNjb3BlIDogJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDApO1xuICAgIH0sXG5cbiAgICBfc3RhcnRUZW1wb3JhcnlNdXRhdGlvbk9ic2VydmVyOiBmdW5jdGlvbiAoZHVyYXRpb25NcywgJHNjb3BlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGR1cmF0aW9uTXMgPSBkdXJhdGlvbk1zIHx8IDE1MDA7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIGVuZEF0ID0gbm93ICsgTWF0aC5tYXgoMCwgZHVyYXRpb25NcyB8IDApO1xuICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyRW5kQXQgPSBNYXRoLm1heChzZWxmLl9tdXRhdGlvbk9ic2VydmVyRW5kQXQgfHwgMCwgZW5kQXQpO1xuXG4gICAgICAgIGlmIChzZWxmLl9tdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogYWxyZWFkeSBydW5uaW5nIC0+IGV4dGVuZCB3aW5kb3cnLCB7ZW5kQXQ6IHNlbGYuX211dGF0aW9uT2JzZXJ2ZXJFbmRBdH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5fbXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVoTG9nKCdtdXRhdGlvbk9ic2VydmVyOiBET00gbXV0YXRlZCAtPiBzY2hlZHVsZSByZXJ1bicpO1xuICAgICAgICAgICAgc2VsZi5fc2NoZWR1bGVSZXJ1bigkc2NvcGUgJiYgJHNjb3BlLmxlbmd0aCA/ICRzY29wZSA6ICQoZG9jdW1lbnQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlbGYuX211dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RBUlRFRCcsIHtkdXJhdGlvbk1zOiBkdXJhdGlvbk1zLCBlbmRBdDogc2VsZi5fbXV0YXRpb25PYnNlcnZlckVuZEF0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHNlbGYuX211dGF0aW9uT2JzZXJ2ZXIgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0b3BMYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5fbXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIDwgKHNlbGYuX211dGF0aW9uT2JzZXJ2ZXJFbmRBdCB8fCAwKSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9tdXRhdGlvbk9ic2VydmVyU3RvcFRpbWVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyU3RvcFRpbWVyID0gc2V0VGltZW91dChzdG9wTGF0ZXIsIDEwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RPUFBJTkcnKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBuby1vcFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5fbXV0YXRpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICAgICAgICBlaExvZygnbXV0YXRpb25PYnNlcnZlcjogU1RPUFBFRCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHN0b3BMYXRlcigpO1xuICAgIH0sXG5cbiAgICBhZGRIYW5kbGVyOiBmdW5jdGlvbiAoc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlcmVkU2VsZWN0b3JIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodHlwZW9mICQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgcnVuS2V5ID0gaGFzaFNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3J1bkhhbmRsZXJPbkVsZW1lbnQoJCh0aGlzKSwgY2FsbGJhY2ssIHNlbGVjdG9yLCBydW5LZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcnVuUmVhZHlUcmlnZ2VyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgIGlmICghJHNjb3BlIHx8ICEkc2NvcGUubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlZ2lzdGVyZWRTZWxlY3RvckhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZWhMb2coJ3J1blJlYWR5VHJpZ2dlcjogc3RhcnQnLCB7c2NvcGU6ICRzY29wZS5nZXQoMCksIGhhbmRsZXJzQ291bnQ6IHJlZ2lzdGVyZWRTZWxlY3RvckhhbmRsZXJzLmxlbmd0aH0pO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgcmVnaXN0ZXJlZFNlbGVjdG9ySGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgICAgIGlmICghZW50cnkuc2VsZWN0b3IgfHwgdHlwZW9mIGVudHJ5LmNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWhMb2coJ3J1blJlYWR5VHJpZ2dlcjogYXBwbHkgc2VsZWN0b3InLCB7c2VsZWN0b3I6IGVudHJ5LnNlbGVjdG9yfSk7XG5cbiAgICAgICAgICAgIHZhciBydW5LZXkgPSBoYXNoU2VsZWN0b3IoZW50cnkuc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmlzKGVudHJ5LnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3J1bkhhbmRsZXJPbkVsZW1lbnQoJHNjb3BlLCBlbnRyeS5jYWxsYmFjaywgZW50cnkuc2VsZWN0b3IsIHJ1bktleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzY29wZS5maW5kKGVudHJ5LnNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9ydW5IYW5kbGVyT25FbGVtZW50KCQodGhpcyksIGVudHJ5LmNhbGxiYWNrLCBlbnRyeS5zZWxlY3RvciwgcnVuS2V5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYmluZFByZXN0YVNob3BFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BzRXZlbnRzQm91bmQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wc0V2ZW50c0JvdW5kID0gdHJ1ZTtcbiAgICAgICAgZWhMb2coJ2JpbmRQcmVzdGFTaG9wRXZlbnRzOiBib3VuZCcpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgcHJlc3Rhc2hvcCA9PT0gJ3VuZGVmaW5lZCcgfHwgIXByZXN0YXNob3AgfHwgdHlwZW9mIHByZXN0YXNob3Aub24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlcnVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiAkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuX3NjaGVkdWxlUmVydW4oJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgc2VsZi5fc3RhcnRUZW1wb3JhcnlNdXRhdGlvbk9ic2VydmVyKDE1MDAsICQoZG9jdW1lbnQpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBbXG4gICAgICAgICAgICAndXBkYXRlQ2FydCcsXG4gICAgICAgICAgICAndXBkYXRlZENhcnQnLFxuICAgICAgICAgICAgJ2NoYW5nZWRDaGVja291dFN0ZXAnLFxuICAgICAgICAgICAgJ3VwZGF0ZVByb2R1Y3RMaXN0JyxcbiAgICAgICAgICAgICd1cGRhdGVGYWNldHMnLFxuICAgICAgICAgICAgJ3VwZGF0ZWRQcm9kdWN0J1xuICAgICAgICBdLmZvckVhY2goZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgcHJlc3Rhc2hvcC5vbihldnQsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZWhMb2coJ3ByZXN0YXNob3AgZXZlbnQ6JywgZXZ0LCBlICYmIGUucmVhc29uID8ge3JlYXNvbjogZS5yZWFzb259IDogZSk7XG4gICAgICAgICAgICAgICAgcmVydW4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG4vLyBBdXRvLWJvb3Qgb24gcGFnZSBsb2FkIChmcm9udCBvZmZpY2Ugb25seSwgTk9UIGluIGVkaXQgbW9kZSlcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBib290ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBEb24ndCBpbml0aWFsaXplIGluIGVkaXQgbW9kZSAtIHRoZSBlZGl0b3IgaGFuZGxlcyBlbGVtZW50cyBpdHNlbGZcbiAgICAgICAgaWYgKHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZyAmJiB3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcuaXNFZGl0TW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZWhMb2coJ2Jvb3Q6IHN0YXJ0IChET01Db250ZW50TG9hZGVkKScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZWhMb2coJ2Jvb3Q6IGJpbmRQcmVzdGFTaG9wRXZlbnRzJyk7XG4gICAgICAgICAgICBFbGVtZW50c0hhbmRsZXIuYmluZFByZXN0YVNob3BFdmVudHMoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlaExvZygnYm9vdDogaW5pdGlhbCBSQUYgLT4gcnVuUmVhZHlUcmlnZ2VyJyk7XG4gICAgICAgICAgICAgICAgICAgIEVsZW1lbnRzSGFuZGxlci5ydW5SZWFkeVRyaWdnZXIoJChkb2N1bWVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBuby1vcFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGJvb3QoKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudHNIYW5kbGVyO1xuIiwiLyogZ2xvYmFsIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnLCBqUXVlcnksICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbi8vIExvYWQgYWxsIGhhbmRsZXJzIChlYWNoIG9uZSBzZWxmLXJlZ2lzdGVycyB2aWEgRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIpXG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvc3dpcGVyJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvZ2xvYmFsJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvYWNjb3JkaW9uJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvYWxlcnQnKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9jb3VudGVyJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvdGFicycpO1xucmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2hhbmRsZXJzL3RvZ2dsZScpO1xucmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2hhbmRsZXJzL3Byb2dyZXNzJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvdmlkZW8nKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9zZWN0aW9uJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvbG90dGllJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvcHJlc3Rhc2hvcC1zZWFyY2gnKTtcbnJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9oYW5kbGVycy9wcmVzdGFzaG9wLWNvbnRhY3Rmb3JtJyk7XG5yZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvaGFuZGxlcnMvdGFibGUtb2YtY29udGVudHMnKTtcblxuLy8gWW91VHViZSBBUEkgbG9hZGVyICh1c2VkIGJ5IHNlY3Rpb24gYmFja2dyb3VuZCB2aWRlbylcbnZhciBpc1lUSW5zZXJ0ZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gb25Zb3V0dWJlQXBpUmVhZHkoY2FsbGJhY2spIHtcbiAgICBpZiAoIWlzWVRJbnNlcnRlZCkge1xuICAgICAgICBpc1lUSW5zZXJ0ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdC5zcmMgPSAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vaWZyYW1lX2FwaSc7XG4gICAgICAgIHZhciBmaXJzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXTtcbiAgICAgICAgaWYgKGZpcnN0ICYmIGZpcnN0LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGZpcnN0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHNjcmlwdCwgZmlyc3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHdpbmRvdy5ZVCAmJiBZVC5sb2FkZWQpIHtcbiAgICAgICAgY2FsbGJhY2soWVQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgb25Zb3V0dWJlQXBpUmVhZHkoY2FsbGJhY2spO1xuICAgICAgICB9LCAzNTApO1xuICAgIH1cbn1cblxuLy8gQmFja3dhcmQgY29tcGF0aWJpbGl0eSDigJQgc29tZSB0ZW1wbGF0ZXMvZWRpdG9yIGNvZGUgcmVmZXJlbmNlIHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZFxud2luZG93LmVsZW1lbnRvckZyb250ZW5kID0ge1xuICAgIGNvbmZpZzogd2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnIHx8IHt9LFxuICAgIGlzRWRpdE1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICEhKHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZyAmJiB3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcuaXNFZGl0TW9kZSk7XG4gICAgfSxcbiAgICBnZXRTY29wZVdpbmRvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2NvcGVXaW5kb3cgfHwgd2luZG93O1xuICAgIH0sXG4gICAgc2V0U2NvcGVXaW5kb3c6IGZ1bmN0aW9uIChzY29wZVdpbmRvdykge1xuICAgICAgICB0aGlzLl9zY29wZVdpbmRvdyA9IHNjb3BlV2luZG93O1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHdpbmRvdy5lbGVtZW50b3JGcm9udGVuZENvbmZpZyB8fCB7fTtcbiAgICB9LFxuICAgIGVsZW1lbnRzSGFuZGxlcjogRWxlbWVudHNIYW5kbGVyLFxuICAgIHV0aWxzOiB7XG4gICAgICAgIG9uWW91dHViZUFwaVJlYWR5OiBvbllvdXR1YmVBcGlSZWFkeVxuICAgIH0sXG4gICAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCB3YWl0KSB7XG4gICAgICAgIHZhciB0aW1lb3V0LCBjb250ZXh0LCBhcmdzLCByZXN1bHQsIHByZXZpb3VzID0gMDtcblxuICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcmV2aW91cyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuXG4gICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLWFjY29yZGlvbicsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGFjY29yZGlvbiA9ICQodGhpcyk7XG4gICAgdmFyIGRlZmF1bHRBY3RpdmVTZWN0aW9uID0gJGFjY29yZGlvbi5kYXRhKCdhY3RpdmUtc2VjdGlvbicpIHx8IDE7XG4gICAgdmFyIGFjdGl2ZUZpcnN0ID0gJGFjY29yZGlvbi5kYXRhKCdhY3RpdmUtZmlyc3QnKTtcbiAgICB2YXIgJHRpdGxlcyA9ICRhY2NvcmRpb24uZmluZCgnLmVsZW1lbnRvci1hY2NvcmRpb24tdGl0bGUnKTtcblxuICAgIGZ1bmN0aW9uIGFjdGl2YXRlU2VjdGlvbihzZWN0aW9uSW5kZXgpIHtcbiAgICAgICAgdmFyICRhY3RpdmUgPSAkdGl0bGVzLmZpbHRlcignLmFjdGl2ZScpO1xuICAgICAgICB2YXIgJHJlcXVlc3RlZCA9ICR0aXRsZXMuZmlsdGVyKCdbZGF0YS1zZWN0aW9uPVwiJyArIHNlY3Rpb25JbmRleCArICdcIl0nKTtcbiAgICAgICAgdmFyIGlzUmVxdWVzdGVkQWN0aXZlID0gJHJlcXVlc3RlZC5oYXNDbGFzcygnYWN0aXZlJyk7XG5cbiAgICAgICAgJGFjdGl2ZS5yZW1vdmVDbGFzcygnYWN0aXZlJykubmV4dCgpLnNsaWRlVXAoKTtcblxuICAgICAgICBpZiAoIWlzUmVxdWVzdGVkQWN0aXZlKSB7XG4gICAgICAgICAgICAkcmVxdWVzdGVkLmFkZENsYXNzKCdhY3RpdmUnKS5uZXh0KCkuc2xpZGVEb3duKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlRmlyc3QpIHtcbiAgICAgICAgYWN0aXZhdGVTZWN0aW9uKGRlZmF1bHRBY3RpdmVTZWN0aW9uKTtcbiAgICB9XG5cbiAgICAkdGl0bGVzLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYWN0aXZhdGVTZWN0aW9uKHRoaXMuZGF0YXNldC5zZWN0aW9uKTtcbiAgICB9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLWFsZXJ0LWRpc21pc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgJCh0aGlzKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmFkZU91dCgpO1xuICAgIH0pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItY291bnRlci1udW1iZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRudW1iZXIgPSAkKHRoaXMpO1xuXG4gICAgJG51bWJlci53YXlwb2ludChmdW5jdGlvbiAoKSB7XG4gICAgICAgICRudW1iZXIubnVtZXJhdG9yKHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiAkbnVtYmVyLmRhdGEoJ2R1cmF0aW9uJylcbiAgICAgICAgfSk7XG4gICAgfSwge29mZnNldDogJzkwJSd9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLWVsZW1lbnRbZGF0YS1hbmltYXRpb25dJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgdmFyIGFuaW1hdGlvbiA9ICRlbGVtZW50LmRhdGEoJ2FuaW1hdGlvbicpO1xuXG4gICAgaWYgKCFhbmltYXRpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICRlbGVtZW50LmFkZENsYXNzKCdlbGVtZW50b3ItaW52aXNpYmxlJykucmVtb3ZlQ2xhc3MoYW5pbWF0aW9uKTtcblxuICAgICRlbGVtZW50LndheXBvaW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2VsZW1lbnRvci1pbnZpc2libGUnKS5hZGRDbGFzcyhhbmltYXRpb24pO1xuICAgIH0sIHtvZmZzZXQ6ICc5MCUnfSk7XG59KTtcbiIsIi8qIGdsb2JhbCAkLCBMb3R0aWVJbnRlcmFjdGl2aXR5ICovXHJcblxyXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcclxuXHJcbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcubG90dGllLWFuaW1hdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkcGxheWVyID0gJCh0aGlzKTtcclxuXHJcbiAgICBpZiAoJHBsYXllci5kYXRhKCdwbGF5JykgIT09ICdzY3JvbGwnKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBvZmZzZXQgPSAkcGxheWVyLmRhdGEoJ29mZnNldCcpIC8gMTAwO1xyXG4gICAgdmFyIGNvbnRhaW5lciA9ICRwbGF5ZXIuZGF0YSgnY29udGFpbmVyJykgPT09ICdib2R5JyA/ICdib2R5JyA6IG51bGw7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbG90dGllTG9hZGVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgTG90dGllSW50ZXJhY3Rpdml0eSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgTG90dGllSW50ZXJhY3Rpdml0eS5jcmVhdGUoe1xyXG4gICAgICAgICAgICBtb2RlOiAnc2Nyb2xsJyxcclxuICAgICAgICAgICAgcGxheWVyOiAkcGxheWVyWzBdLFxyXG4gICAgICAgICAgICBjb250YWluZXI6IGNvbnRhaW5lcixcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IFtvZmZzZXQsIDFdLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzZWVrJyxcclxuICAgICAgICAgICAgICAgICAgICBmcmFtZXM6IFswLCAnMTAwJSddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuIiwiLyogZ2xvYmFsICQsIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignLmVsZW1lbnRvci1jb250YWN0Zm9ybS13cmFwcGVyJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkd3JhcHBlciA9ICQodGhpcyk7XG5cbiAgICBpZiAodHlwZW9mIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnID09PSAndW5kZWZpbmVkJyB8fCAhZWxlbWVudG9yRnJvbnRlbmRDb25maWcuYWpheF9jc2ZyX3Rva2VuX3VybCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTG9hZCBDU1JGIHRva2VuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBlbGVtZW50b3JGcm9udGVuZENvbmZpZy5hamF4X2NzZnJfdG9rZW5fdXJsLFxuICAgICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgJHdyYXBwZXIuZmluZCgnLmpzLWNzZnItdG9rZW4nKS5yZXBsYWNlV2l0aCgkKHJlc3AucHJldmlldykpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgZm9ybSBzdWJtaXNzaW9uIHZpYSBBSkFYXG4gICAgJHdyYXBwZXIub24oJ3N1Ym1pdCcsICcuanMtZWxlbWVudG9yLWNvbnRhY3QtZm9ybScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCQodGhpcylbMF0pO1xuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6ICQodGhpcykuYXR0cignYWN0aW9uJyksXG4gICAgICAgICAgICBkYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBmYWxzZSxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgJHdyYXBwZXIuZmluZCgnLmpzLWVsZW1lbnRvci1jb250YWN0LW5vcmlmY2F0aW9uLXdyYXBwZXInKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZVdpdGgoJChyZXNwLnByZXZpZXcpLmZpbmQoJy5qcy1lbGVtZW50b3ItY29udGFjdC1ub3JpZmNhdGlvbi13cmFwcGVyJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuIiwiLyogZ2xvYmFsICQsIHByZXN0YXNob3AgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuc2VhcmNoLXdpZGdldC1hdXRvY29tcGxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRzZWFyY2hXaWRnZXQgPSAkKHRoaXMpO1xuICAgIHZhciAkc2VhcmNoQm94ID0gJHNlYXJjaFdpZGdldC5maW5kKCdpbnB1dFt0eXBlPXRleHRdJyk7XG4gICAgdmFyIHNlYXJjaFVSTCA9ICRzZWFyY2hXaWRnZXQuYXR0cignZGF0YS1zZWFyY2gtY29udHJvbGxlci11cmwnKTtcblxuICAgIGlmICh0eXBlb2YgcHJlc3Rhc2hvcCA9PT0gJ3VuZGVmaW5lZCcgfHwgIXByZXN0YXNob3AuYmxvY2tzZWFyY2ggfHwgIXByZXN0YXNob3AuYmxvY2tzZWFyY2guaW5pdEF1dG9jb21wbGV0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJlc3Rhc2hvcC5ibG9ja3NlYXJjaC5pbml0QXV0b2NvbXBsZXRlKCRzZWFyY2hXaWRnZXQsICRzZWFyY2hCb3gsIHNlYXJjaFVSTCk7XG59KTtcbiIsIi8qIGdsb2JhbCAkICovXG5cbnZhciBFbGVtZW50c0hhbmRsZXIgPSByZXF1aXJlKCdlbGVtZW50b3ItZnJvbnRlbmQvZWxlbWVudHMtaGFuZGxlcicpO1xuXG5FbGVtZW50c0hhbmRsZXIuYWRkSGFuZGxlcignLmVsZW1lbnRvci1wcm9ncmVzcy1iYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICRiYXIgPSAkKHRoaXMpO1xuXG4gICAgJGJhci53YXlwb2ludChmdW5jdGlvbiAoKSB7XG4gICAgICAgICRiYXIuY3NzKCd3aWR0aCcsICRiYXIuZGF0YSgnbWF4JykgKyAnJScpO1xuICAgIH0sIHtvZmZzZXQ6ICc5MCUnfSk7XG59KTtcbiIsIi8qIGdsb2JhbCAkLCBlbGVtZW50b3JGcm9udGVuZCAqL1xuXG4vKipcbiAqIEJhY2tncm91bmQgdmlkZW8gaGFuZGxlciBmb3Igc2VjdGlvbnMuXG4gKiBUaGUgc2xpZGVyLXNlY3Rpb24gcGFydCBpcyBub3cgaGFuZGxlZCBieSB0aGUgY2VudHJhbGl6ZWQgc3dpcGVyLmpzIGhhbmRsZXIuXG4gKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLWJhY2tncm91bmQtdmlkZW8tY29udGFpbmVyJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkY29udGFpbmVyID0gJCh0aGlzKTtcbiAgICB2YXIgJHZpZGVvID0gJGNvbnRhaW5lci5jaGlsZHJlbignLmVsZW1lbnRvci1iYWNrZ3JvdW5kLXZpZGVvJyk7XG5cbiAgICBpZiAoISR2aWRlby5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB2aWRlb0lEID0gJHZpZGVvLmRhdGEoJ3ZpZGVvLWlkJyk7XG4gICAgdmFyIGlzWVRWaWRlbyA9IGZhbHNlO1xuICAgIHZhciBwbGF5ZXI7XG5cbiAgICBmdW5jdGlvbiBjYWxjVmlkZW9TaXplKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyV2lkdGggPSAkY29udGFpbmVyLm91dGVyV2lkdGgoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckhlaWdodCA9ICRjb250YWluZXIub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgdmFyIGFzcGVjdFJhdGlvID0gMTYgLyA5O1xuICAgICAgICB2YXIgcmF0aW9XaWR0aCA9IGNvbnRhaW5lcldpZHRoIC8gYXNwZWN0UmF0aW87XG4gICAgICAgIHZhciByYXRpb0hlaWdodCA9IGNvbnRhaW5lckhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICB2YXIgaXNXaWR0aEZpeGVkID0gY29udGFpbmVyV2lkdGggLyBjb250YWluZXJIZWlnaHQgPiBhc3BlY3RSYXRpbztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IGlzV2lkdGhGaXhlZCA/IGNvbnRhaW5lcldpZHRoIDogcmF0aW9IZWlnaHQsXG4gICAgICAgICAgICBoZWlnaHQ6IGlzV2lkdGhGaXhlZCA/IHJhdGlvV2lkdGggOiBjb250YWluZXJIZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VWaWRlb1NpemUoKSB7XG4gICAgICAgIHZhciAkdGFyZ2V0ID0gaXNZVFZpZGVvID8gJChwbGF5ZXIuZ2V0SWZyYW1lKCkpIDogJHZpZGVvO1xuICAgICAgICB2YXIgc2l6ZSA9IGNhbGNWaWRlb1NpemUoKTtcbiAgICAgICAgJHRhcmdldC53aWR0aChzaXplLndpZHRoKS5oZWlnaHQoc2l6ZS5oZWlnaHQpO1xuICAgIH1cblxuICAgIGlmICh2aWRlb0lEKSB7XG4gICAgICAgIC8vIFlvdVR1YmUgYmFja2dyb3VuZCB2aWRlb1xuICAgICAgICBpc1lUVmlkZW8gPSB0cnVlO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudG9yRnJvbnRlbmQgIT09ICd1bmRlZmluZWQnICYmIGVsZW1lbnRvckZyb250ZW5kLnV0aWxzKSB7XG4gICAgICAgICAgICBlbGVtZW50b3JGcm9udGVuZC51dGlscy5vbllvdXR1YmVBcGlSZWFkeShmdW5jdGlvbiAoWVQpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyID0gbmV3IFlULlBsYXllcigkdmlkZW9bMF0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvSWQ6IHZpZGVvSUQsXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblJlYWR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllci5tdXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZVZpZGVvU2l6ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXIucGxheVZpZGVvKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IFlULlBsYXllclN0YXRlLkVOREVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXIuc2Vla1RvKDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllclZhcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvcGxheTogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRlOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dpbmZvOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgY2hhbmdlVmlkZW9TaXplKTtcbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSG9zdGVkIHZpZGVvXG4gICAgICAgICR2aWRlby5vbmUoJ2NhbnBsYXknLCBjaGFuZ2VWaWRlb1NpemUpO1xuICAgIH1cbn0pO1xuIiwiLyogZ2xvYmFsIFN3aXBlciwgZWxlbWVudG9yRnJvbnRlbmRDb25maWcsICQgKi9cblxuLyoqXG4gKiBDZW50cmFsaXplZCBTd2lwZXIgaGFuZGxlciBmb3IgQUxMIEVsZW1lbnRvciBjYXJvdXNlbCB0eXBlcy5cbiAqXG4gKiBSZXBsYWNlcyB0aGUgb2xkIHBlci13aWRnZXQgY2Fyb3VzZWwgaGFuZGxlcnM6XG4gKiAgIGltYWdlLWNhcm91c2VsLCB0ZXN0aW1vbmlhbCwgcHJlc3Rhc2hvcC1wcm9kdWN0bGlzdCxcbiAqICAgcHJlc3Rhc2hvcC1wcm9kdWN0bGlzdHRhYnMsIHByZXN0YXNob3AtYnJhbmRzLCBwcmVzdGFzaG9wLWJsb2csXG4gKiAgIGFuZCB0aGUgc2xpZGVyLXNlY3Rpb24gcGFydCBvZiBzZWN0aW9uLmpzXG4gKlxuICogRWFjaCBjYXJvdXNlbCBlbGVtZW50IHN0b3JlcyBpdHMgb3B0aW9ucyBpbiBkYXRhLXNsaWRlcl9vcHRpb25zLlxuICogTmF2aWdhdGlvbi9wYWdpbmF0aW9uIGVsZW1lbnRzIGFyZSBzZWFyY2hlZCBpbiB0aGUgY2xvc2VzdCB3aWRnZXQgd3JhcHBlci5cbiAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuLyoqIFNldCB0byB0cnVlIHRvIGVuYWJsZSBTd2lwZXIgZGVidWcgbG9nZ2luZyBpbiB0aGUgY29uc29sZSAqL1xudmFyIFNXSVBFUl9ERUJVRyA9IHRydWU7XG5cbi8vIFdoZW4gdGhlIHRoZW1lIHByb3ZpZGVzIFN3aXBlciBjb3JlIChub3QgdGhlIGJ1bmRsZSksIG1vZHVsZXMgbXVzdCBiZSBwYXNzZWRcbi8vIGV4cGxpY2l0bHkuIFRoZSB0aGVtZSBleHBvc2VzIHRoZW0gb24gd2luZG93LlN3aXBlck1vZHVsZXMuXG52YXIgU3dpcGVyTW9kdWxlcyA9IHdpbmRvdy5Td2lwZXJNb2R1bGVzIHx8IG51bGw7XG5cbnZhciBTV0lQRVJfU01fQlJFQUtQT0lOVCA9IDU3NjtcbnZhciBTV0lQRVJfTURfQlJFQUtQT0lOVCA9IDc2ODtcbnZhciBTV0lQRVJfTEdfQlJFQUtQT0lOVCA9IDk5MjtcbnZhciBTV0lQRVJfWExfQlJFQUtQT0lOVCA9IDEyMDA7XG52YXIgU1dJUEVSX1hYTF9CUkVBS1BPSU5UID0gMTQwMDtcbnZhciBTV0lQRVJfQlJFQUtQT0lOVFMgPSBbJ1hTJywgJ1NNJywgJ01EJywgJ0xHJywgJ1hMJywgJ1hYTCddO1xudmFyIFNXSVBFUl9MRUdBQ1lfQlJFQUtQT0lOVFMgPSBbJ01vYmlsZScsICdUYWJsZXQnLCAnRGVza3RvcCddO1xuXG52YXIgQ0FST1VTRUxfU0VMRUNUT1JTID0gW1xuICAgICcuc3dpcGVyLWVsZW1lbnRvcidcbl07XG5cbi8qKlxuICogRmluZCB0aGUgY2xvc2VzdCBFbGVtZW50b3Igd2lkZ2V0L2VsZW1lbnQgd3JhcHBlciBhcm91bmQgdGhlIGNhcm91c2VsLlxuICovXG5mdW5jdGlvbiBnZXRXaWRnZXRXcmFwcGVyKCRjYXJvdXNlbCkge1xuICAgIHZhciAkd3JhcHBlciA9ICRjYXJvdXNlbC5jbG9zZXN0KCcuZWxlbWVudG9yLXdpZGdldCcpO1xuICAgIGlmICghJHdyYXBwZXIubGVuZ3RoKSB7XG4gICAgICAgICR3cmFwcGVyID0gJGNhcm91c2VsLmNsb3Nlc3QoJy5lbGVtZW50b3ItZWxlbWVudCcpO1xuICAgIH1cbiAgICBpZiAoISR3cmFwcGVyLmxlbmd0aCkge1xuICAgICAgICAkd3JhcHBlciA9ICRjYXJvdXNlbC5wYXJlbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuICR3cmFwcGVyO1xufVxuXG4vKipcbiAqIFRvZ2dsZSBhcnJvdyB2aXNpYmlsaXR5IHdoZW4gYWxsIHNsaWRlcyBhcmUgdmlzaWJsZSAoYm90aCBhcnJvd3MgZGlzYWJsZWQpLlxuICovXG5mdW5jdGlvbiB0b2dnbGVBcnJvd3Moc3dpcGVySW5zdGFuY2UpIHtcbiAgICBpZiAoIXN3aXBlckluc3RhbmNlLm5hdmlnYXRpb24gfHwgIXN3aXBlckluc3RhbmNlLm5hdmlnYXRpb24ubmV4dEVsIHx8ICFzd2lwZXJJbnN0YW5jZS5uYXZpZ2F0aW9uLnByZXZFbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5leHQgPSBzd2lwZXJJbnN0YW5jZS5uYXZpZ2F0aW9uLm5leHRFbDtcbiAgICB2YXIgcHJldiA9IHN3aXBlckluc3RhbmNlLm5hdmlnYXRpb24ucHJldkVsO1xuXG4gICAgaWYgKCFuZXh0IHx8ICFwcmV2KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYm90aERpc2FibGVkID1cbiAgICAgICAgbmV4dC5jbGFzc0xpc3QuY29udGFpbnMoJ3N3aXBlci1idXR0b24tZGlzYWJsZWQnKSAmJlxuICAgICAgICBwcmV2LmNsYXNzTGlzdC5jb250YWlucygnc3dpcGVyLWJ1dHRvbi1kaXNhYmxlZCcpO1xuXG4gICAgaWYgKGJvdGhEaXNhYmxlZCkge1xuICAgICAgICBuZXh0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHByZXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0LnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgcHJldi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIEhlbHBlcjogY29weSBhIFN3aXBlciBvcHRpb24gdG8gYnJlYWtwb2ludC1zdWZmaXhlZCB2YXJpYW50c1xuICogKFhTL1NNL01EL0xHL1hML1hYTCArIE1vYmlsZS9UYWJsZXQvRGVza3RvcClcbiAqL1xuZnVuY3Rpb24gY29weU9wdGlvblRvQnJlYWtwb2ludHMob3B0aW9ucywga2V5KSB7XG4gICAgaWYgKCFvcHRpb25zIHx8IHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc1trZXldID09PSAndW5kZWZpbmVkJyB8fCBvcHRpb25zW2tleV0gPT09IG51bGwpIHJldHVybjtcblxuICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNba2V5XTtcbiAgICB2YXIgc3VmZml4ZXMgPSBTV0lQRVJfQlJFQUtQT0lOVFMuY29uY2F0KFNXSVBFUl9MRUdBQ1lfQlJFQUtQT0lOVFMpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWZmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGFyZ2V0S2V5ID0ga2V5ICsgc3VmZml4ZXNbaV07XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1t0YXJnZXRLZXldID09PSAndW5kZWZpbmVkJyB8fCBvcHRpb25zW3RhcmdldEtleV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIG9wdGlvbnNbdGFyZ2V0S2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlIG9wdGlvbnNba2V5XTtcbn1cblxuLyoqXG4gKiBIZWxwZXI6IHJldHJvLWNvbXBhdGliaWxpdHkgKGFsaWFzIG9sZCBvcHRpb24gbmFtZSAtPiBuZXcgb3B0aW9uIG5hbWUpXG4gKi9cbmZ1bmN0aW9uIGFwcGx5TGVnYWN5T3B0aW9uKG9wdGlvbnMsIGxlZ2FjeUtleSwgbmV3S2V5LCBpbmNsdWRlUmVzcG9uc2l2ZVN1ZmZpeGVzKSB7XG4gICAgaWYgKCFvcHRpb25zIHx8IHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICAgIGlmICh0eXBlb2YgaW5jbHVkZVJlc3BvbnNpdmVTdWZmaXhlcyA9PT0gJ3VuZGVmaW5lZCcpIGluY2x1ZGVSZXNwb25zaXZlU3VmZml4ZXMgPSB0cnVlO1xuXG4gICAgdmFyIGhhc1ZhbHVlID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuICEodHlwZW9mIHYgPT09ICd1bmRlZmluZWQnIHx8IHYgPT09IG51bGwpOyB9O1xuXG4gICAgLy8gQmFzZSBrZXlcbiAgICBpZiAoaGFzVmFsdWUob3B0aW9uc1tsZWdhY3lLZXldKSAmJiAhaGFzVmFsdWUob3B0aW9uc1tuZXdLZXldKSkge1xuICAgICAgICBvcHRpb25zW25ld0tleV0gPSBvcHRpb25zW2xlZ2FjeUtleV07XG4gICAgfVxuICAgIGRlbGV0ZSBvcHRpb25zW2xlZ2FjeUtleV07XG5cbiAgICBpZiAoIWluY2x1ZGVSZXNwb25zaXZlU3VmZml4ZXMpIHJldHVybjtcblxuICAgIC8vIFN1ZmZpeCBrZXlzIChYUy9TTS9NRC9MRy9YTC9YWEwgKyBNb2JpbGUvVGFibGV0L0Rlc2t0b3ApXG4gICAgdmFyIHN1ZmZpeGVzID0gU1dJUEVSX0JSRUFLUE9JTlRTLmNvbmNhdChTV0lQRVJfTEVHQUNZX0JSRUFLUE9JTlRTKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1ZmZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBsZWdhY3lTdWZmaXhLZXkgPSBsZWdhY3lLZXkgKyBzdWZmaXhlc1tpXTtcbiAgICAgICAgdmFyIG5ld1N1ZmZpeEtleSA9IG5ld0tleSArIHN1ZmZpeGVzW2ldO1xuXG4gICAgICAgIGlmIChoYXNWYWx1ZShvcHRpb25zW2xlZ2FjeVN1ZmZpeEtleV0pKSB7XG4gICAgICAgICAgICBpZiAoIWhhc1ZhbHVlKG9wdGlvbnNbbmV3U3VmZml4S2V5XSkpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zW25ld1N1ZmZpeEtleV0gPSBvcHRpb25zW2xlZ2FjeVN1ZmZpeEtleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zW2xlZ2FjeVN1ZmZpeEtleV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMob3B0aW9ucywga2V5KSB7XG4gICAgaWYgKCFvcHRpb25zIHx8IHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICAgIHZhciBoYXNWYWx1ZSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiAhKHR5cGVvZiB2ID09PSAndW5kZWZpbmVkJyB8fCB2ID09PSBudWxsKTsgfTtcblxuICAgIHZhciBtYXBwaW5nID0ge1xuICAgICAgICAnTW9iaWxlJzogWydYUycsICdTTSddLFxuICAgICAgICAnVGFibGV0JzogWydNRCddLFxuICAgICAgICAnRGVza3RvcCc6IFsnTEcnLCAnWEwnLCAnWFhMJ11cbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBTV0lQRVJfTEVHQUNZX0JSRUFLUE9JTlRTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzdWZmaXggPSBTV0lQRVJfTEVHQUNZX0JSRUFLUE9JTlRTW2ldO1xuICAgICAgICB2YXIgbGVnYWN5U3VmZml4S2V5ID0ga2V5ICsgc3VmZml4O1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IG1hcHBpbmdbc3VmZml4XTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRhcmdldHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBuZXdTdWZmaXhLZXkgPSBrZXkgKyB0YXJnZXRzW2pdO1xuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlKG9wdGlvbnNbbGVnYWN5U3VmZml4S2V5XSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc1ZhbHVlKG9wdGlvbnNbbmV3U3VmZml4S2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uc1tuZXdTdWZmaXhLZXldID0gb3B0aW9uc1tsZWdhY3lTdWZmaXhLZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zW2xlZ2FjeVN1ZmZpeEtleV07XG4gICAgfVxufVxuXG4vKipcbiAqIE1haW4gY2Fyb3VzZWwgaW5pdGlhbGl6YXRpb24gaGFuZGxlci5cbiAqL1xuZnVuY3Rpb24gaW5pdENhcm91c2VsKCkge1xuICAgIHZhciAkY2Fyb3VzZWwgPSAkKHRoaXMpO1xuICAgIHZhciBkZWJ1Z0lkID0gJGNhcm91c2VsLmNsb3Nlc3QoJ1tkYXRhLWlkXScpLmRhdGEoJ2lkJykgfHwgJGNhcm91c2VsLmF0dHIoJ2NsYXNzJykgfHwgJ3Vua25vd24nO1xuXG4gICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5ncm91cCgnJWNbU3dpcGVyXSAnICsgZGVidWdJZCwgJ2NvbG9yOiAjMjE5NkYzOyBmb250LXdlaWdodDogYm9sZCcpO1xuICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdFbGVtZW50OicsICRjYXJvdXNlbFswXSk7XG5cbiAgICBpZiAodHlwZW9mIFN3aXBlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS53YXJuKCdTd2lwZXIgbGlicmFyeSBub3QgbG9hZGVkIOKAlCBhYm9ydGluZycpO1xuICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISRjYXJvdXNlbC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS53YXJuKCdDYXJvdXNlbCBlbGVtZW50IG5vdCBmb3VuZCDigJQgYWJvcnRpbmcnKTtcbiAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGFycm93cy1vdXRzaWRlIGxheW91dFxuICAgIGlmICgkY2Fyb3VzZWwuaGFzQ2xhc3MoJ2Fycm93cy1vdXRzaWRlJykgJiYgISRjYXJvdXNlbC5wYXJlbnQoKS5oYXNDbGFzcygnc3dpcGVyLWFycm93cy13cmFwcGVyJykpIHtcbiAgICAgICAgJGNhcm91c2VsLndyYXAoJzxkaXYgY2xhc3M9XCJzd2lwZXItYXJyb3dzLXdyYXBwZXJcIj48L2Rpdj4nKTtcbiAgICAgICAgaWYgKCRjYXJvdXNlbC5maW5kKCcuc3dpcGVyLW5hdmlnYXRpb24nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICRjYXJvdXNlbC5wYXJlbnQoKS5hcHBlbmQoJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItbmF2aWdhdGlvbicpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBsYXp5IGltYWdlcyBpbiBlZGl0IG1vZGVcbiAgICBpZiAod2luZG93LmVsZW1lbnRvckZyb250ZW5kQ29uZmlnICYmIGVsZW1lbnRvckZyb250ZW5kQ29uZmlnLmlzRWRpdE1vZGUpIHtcbiAgICAgICAgJGNhcm91c2VsLmZpbmQoJ2ltZ1tkYXRhLXNyY10nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykuYXR0cignc3JjJywgJCh0aGlzKS5kYXRhKCdzcmMnKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBzYXZlZE9wdGlvbnMgPSAkY2Fyb3VzZWwuZGF0YSgnc2xpZGVyX29wdGlvbnMnKSB8fCAkY2Fyb3VzZWwuZGF0YSgnc3dpcGVyLW9wdGlvbnMnKSB8fCB7fTtcbiAgICB2YXIgJHdpZGdldCA9IGdldFdpZGdldFdyYXBwZXIoJGNhcm91c2VsKTtcblxuICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdSYXcgZGF0YS1vcHRpb25zOicsIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2F2ZWRPcHRpb25zKSkpO1xuICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdXaWRnZXQgd3JhcHBlcjonLCAkd2lkZ2V0WzBdKTtcbiAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmxvZygnU2xpZGVzIGZvdW5kOicsICRjYXJvdXNlbC5maW5kKCcuc3dpcGVyLXNsaWRlJykubGVuZ3RoKTtcblxuICAgIC8vIEFwcGx5IGxlZ2FjeSBvcHRpb24gbmFtZXNcbiAgICBhcHBseUxlZ2FjeU9wdGlvbihzYXZlZE9wdGlvbnMsICdzbGlkZXNUb1Nob3cnLCAnc2xpZGVzUGVyVmlldycpO1xuICAgIGFwcGx5TGVnYWN5T3B0aW9uKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1BlclBhZ2UnLCAnc2xpZGVzUGVyR3JvdXAnKTtcbiAgICBhcHBseUxlZ2FjeU9wdGlvbihzYXZlZE9wdGlvbnMsICdkb3RzJywgJ3BhZ2luYXRpb24nKTtcbiAgICBhcHBseUxlZ2FjeU9wdGlvbihzYXZlZE9wdGlvbnMsICdhcnJvd3MnLCAnbmF2aWdhdGlvbicpO1xuXG4gICAgLy8gQXBwbHkgbGVnYWN5IGJyZWFrcG9pbnRzIChNb2JpbGUvVGFibGV0L0Rlc2t0b3AgLT4gWFMvU00vTUQvTEcvWEwvWFhMKVxuICAgIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMoc2F2ZWRPcHRpb25zLCAncGFnaW5hdGlvbicpO1xuICAgIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMoc2F2ZWRPcHRpb25zLCAnbmF2aWdhdGlvbicpO1xuICAgIGFwcGx5TGVnYWN5QnJlYWtQb2ludHMoc2F2ZWRPcHRpb25zLCAnc2Nyb2xsYmFyJyk7XG4gICAgYXBwbHlMZWdhY3lCcmVha1BvaW50cyhzYXZlZE9wdGlvbnMsICdzcGFjZUJldHdlZW4nKTtcbiAgICBhcHBseUxlZ2FjeUJyZWFrUG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1BlclZpZXcnKTtcbiAgICBhcHBseUxlZ2FjeUJyZWFrUG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1Blckdyb3VwJyk7XG5cbiAgICAvLyBDb3B5IGJhc2Ugb3B0aW9ucyB0byBhbGwgYnJlYWtwb2ludHNcbiAgICBjb3B5T3B0aW9uVG9CcmVha3BvaW50cyhzYXZlZE9wdGlvbnMsICdwYWdpbmF0aW9uJyk7XG4gICAgY29weU9wdGlvblRvQnJlYWtwb2ludHMoc2F2ZWRPcHRpb25zLCAnbmF2aWdhdGlvbicpO1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ3Njcm9sbGJhcicpO1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NwYWNlQmV0d2VlbicpO1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ3NsaWRlc1BlclZpZXcnKTtcbiAgICBjb3B5T3B0aW9uVG9CcmVha3BvaW50cyhzYXZlZE9wdGlvbnMsICdzbGlkZXNQZXJHcm91cCcpO1xuICAgIGNvcHlPcHRpb25Ub0JyZWFrcG9pbnRzKHNhdmVkT3B0aW9ucywgJ2xvb3AnKTtcblxuICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdOb3JtYWxpemVkIG9wdGlvbnMgKGFmdGVyIGxlZ2FjeSArIGJyZWFrcG9pbnQgbWFwcGluZyk6JywgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzYXZlZE9wdGlvbnMpKSk7XG5cbiAgICB2YXIgdmFsID0gZnVuY3Rpb24gKHYsIGZhbGxiYWNrKSB7IHJldHVybiAodiAhPT0gdW5kZWZpbmVkICYmIHYgIT09IG51bGwpID8gdiA6IGZhbGxiYWNrOyB9O1xuXG4gICAgLy8gUmVzb2x2ZSBET00gZWxlbWVudHMgZm9yIG5hdmlnYXRpb24vcGFnaW5hdGlvbi9zY3JvbGxiYXIgb25jZVxuICAgIHZhciBuYXZQcmV2RWwgPSAoc2F2ZWRPcHRpb25zLmFycm93c1NlbGVjdG9yICYmIHNhdmVkT3B0aW9ucy5hcnJvd3NTZWxlY3RvclswXSkgfHwgJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItYnV0dG9uLXByZXYnKVswXTtcbiAgICB2YXIgbmF2TmV4dEVsID0gKHNhdmVkT3B0aW9ucy5hcnJvd3NTZWxlY3RvciAmJiBzYXZlZE9wdGlvbnMuYXJyb3dzU2VsZWN0b3JbMV0pIHx8ICRjYXJvdXNlbC5maW5kKCcuc3dpcGVyLWJ1dHRvbi1uZXh0JylbMF07XG4gICAgdmFyIHBhZ2luYXRpb25FbCA9IChzYXZlZE9wdGlvbnMucGFnaW5hdGlvblNlbGVjdG9yICYmIHNhdmVkT3B0aW9ucy5wYWdpbmF0aW9uU2VsZWN0b3JbMF0pIHx8ICRjYXJvdXNlbC5maW5kKCcuc3dpcGVyLXBhZ2luYXRpb24nKVswXTtcbiAgICB2YXIgc2Nyb2xsYmFyRWwgPSAoc2F2ZWRPcHRpb25zLnNjcm9sbGJhclNlbGVjdG9yICYmIHNhdmVkT3B0aW9ucy5zY3JvbGxiYXJTZWxlY3RvclswXSkgfHwgJGNhcm91c2VsLmZpbmQoJy5zd2lwZXItc2Nyb2xsYmFyJylbMF07XG5cbiAgICB2YXIgaGFzTmF2aWdhdGlvbiA9ICEhKG5hdlByZXZFbCB8fCBuYXZOZXh0RWwpO1xuICAgIHZhciBoYXNQYWdpbmF0aW9uID0gISFwYWdpbmF0aW9uRWw7XG4gICAgdmFyIGhhc1Njcm9sbGJhciA9ICEhc2Nyb2xsYmFyRWw7XG5cbiAgICAvLyBOYXZpZ2F0aW9uL3BhZ2luYXRpb24vc2Nyb2xsYmFyIGJ1aWxkZXJzXG4gICAgLy8gU3dpcGVyIDEyOiB1c2UgZmFsc2UgdG8gc2tpcCBtb2R1bGUsIG9yIGEgY29uZmlnIG9iamVjdCB0byBlbmFibGUgaXQgKG5vICdlbmFibGVkJyBrZXkpXG4gICAgdmFyIGFkZEljb25zID0gc2F2ZWRPcHRpb25zLmFkZEljb25zICE9PSB1bmRlZmluZWQgPyBzYXZlZE9wdGlvbnMuYWRkSWNvbnMgOiB0cnVlO1xuXG4gICAgdmFyIG1ha2VOYXZpZ2F0aW9uID0gZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgaWYgKCFlbmFibGVkIHx8ICFoYXNOYXZpZ2F0aW9uKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcmV2RWw6IG5hdlByZXZFbCxcbiAgICAgICAgICAgIG5leHRFbDogbmF2TmV4dEVsLFxuICAgICAgICAgICAgYWRkSWNvbnM6IGFkZEljb25zXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBtYWtlUGFnaW5hdGlvbiA9IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgIGlmICghZW5hYmxlZCB8fCAhaGFzUGFnaW5hdGlvbikgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZWw6IHBhZ2luYXRpb25FbCxcbiAgICAgICAgICAgIGNsaWNrYWJsZTogdHJ1ZVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgbWFrZVNjcm9sbGJhciA9IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgIGlmICghZW5hYmxlZCB8fCAhaGFzU2Nyb2xsYmFyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbDogc2Nyb2xsYmFyRWxcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gQnVpbGQgYnJlYWtwb2ludHMgZmlyc3QsIHRoZW4gZGV0ZXJtaW5lIHRvcC1sZXZlbCBtb2R1bGUgY29uZmlnXG4gICAgdmFyIGJyZWFrcG9pbnRDb25maWdzID0ge1xuICAgICAgICAwOiB7XG4gICAgICAgICAgICBsb29wOiBzYXZlZE9wdGlvbnMubG9vcFhTIHx8IGZhbHNlLFxuICAgICAgICAgICAgc3BhY2VCZXR3ZWVuOiB2YWwoc2F2ZWRPcHRpb25zLnNwYWNlQmV0d2VlblhTLCA4KSxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyVmlld1hTLCAyKSxcbiAgICAgICAgICAgIHNsaWRlc1Blckdyb3VwOiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1Blckdyb3VwWFMsIDEpXG4gICAgICAgIH0sXG4gICAgICAgIDU3Njoge1xuICAgICAgICAgICAgbG9vcDogc2F2ZWRPcHRpb25zLmxvb3BTTSB8fCBmYWxzZSxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogdmFsKHNhdmVkT3B0aW9ucy5zcGFjZUJldHdlZW5TTSwgOCksXG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1BlclZpZXdTTSwgMiksXG4gICAgICAgICAgICBzbGlkZXNQZXJHcm91cDogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJHcm91cFNNLCAxKVxuICAgICAgICB9LFxuICAgICAgICA3Njg6IHtcbiAgICAgICAgICAgIGxvb3A6IHNhdmVkT3B0aW9ucy5sb29wTUQgfHwgZmFsc2UsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IHZhbChzYXZlZE9wdGlvbnMuc3BhY2VCZXR3ZWVuTUQsIDE1KSxcbiAgICAgICAgICAgIHNsaWRlc1BlclZpZXc6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyVmlld01ELCAzKSxcbiAgICAgICAgICAgIHNsaWRlc1Blckdyb3VwOiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1Blckdyb3VwTUQsIDEpXG4gICAgICAgIH0sXG4gICAgICAgIDk5Mjoge1xuICAgICAgICAgICAgbG9vcDogc2F2ZWRPcHRpb25zLmxvb3BMRyB8fCBmYWxzZSxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogdmFsKHNhdmVkT3B0aW9ucy5zcGFjZUJldHdlZW5MRywgMTUpLFxuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJWaWV3TEcsIDQpLFxuICAgICAgICAgICAgc2xpZGVzUGVyR3JvdXA6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyR3JvdXBMRywgMSlcbiAgICAgICAgfSxcbiAgICAgICAgMTIwMDoge1xuICAgICAgICAgICAgbG9vcDogc2F2ZWRPcHRpb25zLmxvb3BYTCB8fCBmYWxzZSxcbiAgICAgICAgICAgIHNwYWNlQmV0d2VlbjogdmFsKHNhdmVkT3B0aW9ucy5zcGFjZUJldHdlZW5YTCwgMTUpLFxuICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogdmFsKHNhdmVkT3B0aW9ucy5zbGlkZXNQZXJWaWV3WEwsIDQpLFxuICAgICAgICAgICAgc2xpZGVzUGVyR3JvdXA6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyR3JvdXBYTCwgMSlcbiAgICAgICAgfSxcbiAgICAgICAgMTQwMDoge1xuICAgICAgICAgICAgbG9vcDogc2F2ZWRPcHRpb25zLmxvb3BYWEwgfHwgZmFsc2UsXG4gICAgICAgICAgICBzcGFjZUJldHdlZW46IHZhbChzYXZlZE9wdGlvbnMuc3BhY2VCZXR3ZWVuWFhMLCAxNSksXG4gICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiB2YWwoc2F2ZWRPcHRpb25zLnNsaWRlc1BlclZpZXdYWEwsIDUpLFxuICAgICAgICAgICAgc2xpZGVzUGVyR3JvdXA6IHZhbChzYXZlZE9wdGlvbnMuc2xpZGVzUGVyR3JvdXBYWEwsIDEpXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgQU5ZIGJyZWFrcG9pbnQgZW5hYmxlcyBuYXZpZ2F0aW9uL3BhZ2luYXRpb24vc2Nyb2xsYmFyXG4gICAgdmFyIGJwTmF2S2V5cyA9IFsnbmF2aWdhdGlvblhTJywgJ25hdmlnYXRpb25TTScsICduYXZpZ2F0aW9uTUQnLCAnbmF2aWdhdGlvbkxHJywgJ25hdmlnYXRpb25YTCcsICduYXZpZ2F0aW9uWFhMJ107XG4gICAgdmFyIGJwUGFnS2V5cyA9IFsncGFnaW5hdGlvblhTJywgJ3BhZ2luYXRpb25TTScsICdwYWdpbmF0aW9uTUQnLCAncGFnaW5hdGlvbkxHJywgJ3BhZ2luYXRpb25YTCcsICdwYWdpbmF0aW9uWFhMJ107XG4gICAgdmFyIGJwU2NyS2V5cyA9IFsnc2Nyb2xsYmFyWFMnLCAnc2Nyb2xsYmFyU00nLCAnc2Nyb2xsYmFyTUQnLCAnc2Nyb2xsYmFyTEcnLCAnc2Nyb2xsYmFyWEwnLCAnc2Nyb2xsYmFyWFhMJ107XG5cbiAgICB2YXIgYW55TmF2RW5hYmxlZCA9IGZhbHNlO1xuICAgIHZhciBhbnlQYWdFbmFibGVkID0gZmFsc2U7XG4gICAgdmFyIGFueVNjckVuYWJsZWQgPSBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnBOYXZLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzYXZlZE9wdGlvbnNbYnBOYXZLZXlzW2ldXSkgYW55TmF2RW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChzYXZlZE9wdGlvbnNbYnBQYWdLZXlzW2ldXSkgYW55UGFnRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChzYXZlZE9wdGlvbnNbYnBTY3JLZXlzW2ldXSkgYW55U2NyRW5hYmxlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gT25seSBpbmNsdWRlIG1vZHVsZXMgaW4gYnJlYWtwb2ludHMgdGhhdCB1c2UgdGhlbSwgYW5kIG9ubHkgd2hlbiBhdCBsZWFzdCBvbmUgQlAgbmVlZHMgaXRcbiAgICB2YXIgYnBLZXlzID0gWzAsIDU3NiwgNzY4LCA5OTIsIDEyMDAsIDE0MDBdO1xuICAgIHZhciBicE5hdlZhbHMgPSBbc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25YUywgc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25TTSwgc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25NRCwgc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25MRywgc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25YTCwgc2F2ZWRPcHRpb25zLm5hdmlnYXRpb25YWExdO1xuICAgIHZhciBicFBhZ1ZhbHMgPSBbc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25YUywgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25TTSwgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25NRCwgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25MRywgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25YTCwgc2F2ZWRPcHRpb25zLnBhZ2luYXRpb25YWExdO1xuICAgIHZhciBicFNjclZhbHMgPSBbc2F2ZWRPcHRpb25zLnNjcm9sbGJhclhTLCBzYXZlZE9wdGlvbnMuc2Nyb2xsYmFyU00sIHNhdmVkT3B0aW9ucy5zY3JvbGxiYXJNRCwgc2F2ZWRPcHRpb25zLnNjcm9sbGJhckxHLCBzYXZlZE9wdGlvbnMuc2Nyb2xsYmFyWEwsIHNhdmVkT3B0aW9ucy5zY3JvbGxiYXJYWExdO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBicEtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGFueU5hdkVuYWJsZWQpIGJyZWFrcG9pbnRDb25maWdzW2JwS2V5c1tqXV0ubmF2aWdhdGlvbiA9IG1ha2VOYXZpZ2F0aW9uKGJwTmF2VmFsc1tqXSk7XG4gICAgICAgIGlmIChhbnlQYWdFbmFibGVkKSBicmVha3BvaW50Q29uZmlnc1ticEtleXNbal1dLnBhZ2luYXRpb24gPSBtYWtlUGFnaW5hdGlvbihicFBhZ1ZhbHNbal0pO1xuICAgICAgICBpZiAoYW55U2NyRW5hYmxlZCkgYnJlYWtwb2ludENvbmZpZ3NbYnBLZXlzW2pdXS5zY3JvbGxiYXIgPSBtYWtlU2Nyb2xsYmFyKGJwU2NyVmFsc1tqXSk7XG4gICAgfVxuXG4gICAgLy8gUmVzcG9uc2l2ZSB2aXNpYmlsaXR5IGNsYXNzZXM6IENTUyBzaG93cyBuYXZpZ2F0aW9uL3BhZ2luYXRpb24vc2Nyb2xsYmFyXG4gICAgLy8gb25seSB3aGVuIHRoZSBjb3JyZXNwb25kaW5nIGNsYXNzIGlzIHByZXNlbnQgb24gdGhlIGNhcm91c2VsIHJvb3QuXG4gICAgLy8gLSBpcS1oYXMtKjogc3RhdGljLCBhdCBsZWFzdCBvbmUgYnJlYWtwb2ludCBlbmFibGVzIHRoZSBmZWF0dXJlXG4gICAgLy8gLSBpcS0qLW9uOiBkeW5hbWljLCB0aGUgQ1VSUkVOVCBicmVha3BvaW50IGVuYWJsZXMgdGhlIGZlYXR1cmVcbiAgICBpZiAoYW55TmF2RW5hYmxlZCkgJGNhcm91c2VsLmFkZENsYXNzKCdzd2lwZXItZWxlbWVudG9yLWhhcy1uYXZpZ2F0aW9uJyk7XG4gICAgaWYgKGFueVBhZ0VuYWJsZWQpICRjYXJvdXNlbC5hZGRDbGFzcygnc3dpcGVyLWVsZW1lbnRvci1oYXMtcGFnaW5hdGlvbicpO1xuICAgIGlmIChhbnlTY3JFbmFibGVkKSAkY2Fyb3VzZWwuYWRkQ2xhc3MoJ3N3aXBlci1lbGVtZW50b3ItaGFzLXNjcm9sbGJhcicpO1xuXG4gICAgdmFyIHN1ZmZpeEZyb21CcCA9IGZ1bmN0aW9uIChicCkge1xuICAgICAgICBicCA9IHBhcnNlSW50KGJwLCAxMCkgfHwgMDtcbiAgICAgICAgaWYgKGJwID49IDE0MDApIHJldHVybiAnWFhMJztcbiAgICAgICAgaWYgKGJwID49IDEyMDApIHJldHVybiAnWEwnO1xuICAgICAgICBpZiAoYnAgPj0gOTkyKSByZXR1cm4gJ0xHJztcbiAgICAgICAgaWYgKGJwID49IDc2OCkgcmV0dXJuICdNRCc7XG4gICAgICAgIGlmIChicCA+PSA1NzYpIHJldHVybiAnU00nO1xuICAgICAgICByZXR1cm4gJ1hTJztcbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZVJlc3BvbnNpdmVDbGFzc2VzID0gZnVuY3Rpb24gKHN3aXBlcikge1xuICAgICAgICB2YXIgc3VmZml4ID0gc3VmZml4RnJvbUJwKHN3aXBlciAmJiBzd2lwZXIuY3VycmVudEJyZWFrcG9pbnQpO1xuICAgICAgICAkY2Fyb3VzZWxcbiAgICAgICAgICAgIC50b2dnbGVDbGFzcygnc3dpcGVyLWVsZW1lbnRvci1uYXYtb24nLCAhIXNhdmVkT3B0aW9uc1snbmF2aWdhdGlvbicgKyBzdWZmaXhdKVxuICAgICAgICAgICAgLnRvZ2dsZUNsYXNzKCdzd2lwZXItZWxlbWVudG9yLXBhZy1vbicsICEhc2F2ZWRPcHRpb25zWydwYWdpbmF0aW9uJyArIHN1ZmZpeF0pXG4gICAgICAgICAgICAudG9nZ2xlQ2xhc3MoJ3N3aXBlci1lbGVtZW50b3Itc2NyLW9uJywgISFzYXZlZE9wdGlvbnNbJ3Njcm9sbGJhcicgKyBzdWZmaXhdKTtcbiAgICB9O1xuXG4gICAgdmFyIGlzRWRpdE1vZGUgPSAhISh3aW5kb3cuZWxlbWVudG9yRnJvbnRlbmRDb25maWcgJiYgZWxlbWVudG9yRnJvbnRlbmRDb25maWcuaXNFZGl0TW9kZSk7XG5cbiAgICAvLyBCdWlsZCB0aGUgbW9kdWxlcyBhcnJheSB3aGVuIHRoZSB0aGVtZSBwcm92aWRlcyBTd2lwZXIgY29yZSAobm90IHRoZSBidW5kbGUpXG4gICAgdmFyIG1vZHVsZXMgPSBbXTtcbiAgICBpZiAoU3dpcGVyTW9kdWxlcykge1xuICAgICAgICBpZiAoU3dpcGVyTW9kdWxlcy5OYXZpZ2F0aW9uKSBtb2R1bGVzLnB1c2goU3dpcGVyTW9kdWxlcy5OYXZpZ2F0aW9uKTtcbiAgICAgICAgaWYgKFN3aXBlck1vZHVsZXMuUGFnaW5hdGlvbikgbW9kdWxlcy5wdXNoKFN3aXBlck1vZHVsZXMuUGFnaW5hdGlvbik7XG4gICAgICAgIGlmIChTd2lwZXJNb2R1bGVzLlNjcm9sbGJhcikgbW9kdWxlcy5wdXNoKFN3aXBlck1vZHVsZXMuU2Nyb2xsYmFyKTtcbiAgICAgICAgaWYgKFN3aXBlck1vZHVsZXMuQXV0b3BsYXkgJiYgc2F2ZWRPcHRpb25zLmF1dG9wbGF5KSBtb2R1bGVzLnB1c2goU3dpcGVyTW9kdWxlcy5BdXRvcGxheSk7XG4gICAgICAgIGlmIChTd2lwZXJNb2R1bGVzLkdyaWQgJiYgc2F2ZWRPcHRpb25zLml0ZW1zUGVyQ29sdW1uICYmIHNhdmVkT3B0aW9ucy5pdGVtc1BlckNvbHVtbiA+IDEpIG1vZHVsZXMucHVzaChTd2lwZXJNb2R1bGVzLkdyaWQpO1xuICAgICAgICBpZiAoU3dpcGVyTW9kdWxlcy5FZmZlY3RGYWRlICYmIHNhdmVkT3B0aW9ucy5mYWRlKSBtb2R1bGVzLnB1c2goU3dpcGVyTW9kdWxlcy5FZmZlY3RGYWRlKTtcbiAgICB9XG5cbiAgICB2YXIgc3dpcGVyT3B0aW9ucyA9IHtcbiAgICAgICAgdG91Y2hFdmVudHNUYXJnZXQ6ICdjb250YWluZXInLFxuICAgICAgICB3YXRjaE92ZXJmbG93OiB0cnVlLFxuICAgICAgICBuYXZpZ2F0aW9uOiBhbnlOYXZFbmFibGVkID8gbWFrZU5hdmlnYXRpb24odHJ1ZSkgOiBmYWxzZSxcbiAgICAgICAgcGFnaW5hdGlvbjogYW55UGFnRW5hYmxlZCA/IG1ha2VQYWdpbmF0aW9uKHRydWUpIDogZmFsc2UsXG4gICAgICAgIHNjcm9sbGJhcjogYW55U2NyRW5hYmxlZCA/IG1ha2VTY3JvbGxiYXIodHJ1ZSkgOiBmYWxzZSxcbiAgICAgICAgc3BlZWQ6IHNhdmVkT3B0aW9ucy5zcGVlZCB8fCAzMDAsXG4gICAgICAgIGJyZWFrcG9pbnRzOiBicmVha3BvaW50Q29uZmlncyxcbiAgICAgICAgb246IHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVSZXNwb25zaXZlQ2xhc3Nlcyh0aGlzKTtcbiAgICAgICAgICAgICAgICB0b2dnbGVBcnJvd3ModGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2xpZGVDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0b2dnbGVBcnJvd3ModGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnJlYWtwb2ludDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZVJlc3BvbnNpdmVDbGFzc2VzKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRvZ2dsZUFycm93cyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJbmplY3QgbW9kdWxlcyB3aGVuIHVzaW5nIFN3aXBlciBjb3JlIChub3QgdGhlIGJ1bmRsZSlcbiAgICBpZiAobW9kdWxlcy5sZW5ndGgpIHtcbiAgICAgICAgc3dpcGVyT3B0aW9ucy5tb2R1bGVzID0gbW9kdWxlcztcbiAgICB9XG5cbiAgICAvLyBEaXJlY3Rpb25cbiAgICBpZiAoc2F2ZWRPcHRpb25zLmRpcmVjdGlvbiAmJiAoc2F2ZWRPcHRpb25zLmRpcmVjdGlvbiA9PT0gJ3ZlcnRpY2FsJyB8fCBzYXZlZE9wdGlvbnMuZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcpKSB7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuZGlyZWN0aW9uID0gc2F2ZWRPcHRpb25zLmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICAvLyBBdXRvIGhlaWdodFxuICAgIGlmIChzYXZlZE9wdGlvbnMuYXV0b0hlaWdodCkge1xuICAgICAgICBzd2lwZXJPcHRpb25zLmF1dG9IZWlnaHQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEdyaWQgcm93cyAocHJvZHVjdHMsIGJyYW5kcylcbiAgICBpZiAoc2F2ZWRPcHRpb25zLml0ZW1zUGVyQ29sdW1uICYmIHNhdmVkT3B0aW9ucy5pdGVtc1BlckNvbHVtbiA+IDEpIHtcbiAgICAgICAgdmFyIGdyaWRDb25mID0ge2ZpbGw6ICdyb3cnLCByb3dzOiBzYXZlZE9wdGlvbnMuaXRlbXNQZXJDb2x1bW59O1xuICAgICAgICBzd2lwZXJPcHRpb25zLmdyaWQgPSBncmlkQ29uZjtcbiAgICAgICAgaWYgKHN3aXBlck9wdGlvbnMuYnJlYWtwb2ludHNbNzY4XSkgc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1s3NjhdLmdyaWQgPSBncmlkQ29uZjtcbiAgICAgICAgaWYgKHN3aXBlck9wdGlvbnMuYnJlYWtwb2ludHNbOTkyXSkgc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1s5OTJdLmdyaWQgPSBncmlkQ29uZjtcbiAgICAgICAgaWYgKHN3aXBlck9wdGlvbnMuYnJlYWtwb2ludHNbMTIwMF0pIHN3aXBlck9wdGlvbnMuYnJlYWtwb2ludHNbMTIwMF0uZ3JpZCA9IGdyaWRDb25mO1xuICAgICAgICBpZiAoc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1sxNDAwXSkgc3dpcGVyT3B0aW9ucy5icmVha3BvaW50c1sxNDAwXS5ncmlkID0gZ3JpZENvbmY7XG4gICAgfVxuXG4gICAgLy8gQXV0b3BsYXlcbiAgICBpZiAoc2F2ZWRPcHRpb25zLmF1dG9wbGF5KSB7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuYXV0b3BsYXkgPSB7XG4gICAgICAgICAgICBkZWxheTogc2F2ZWRPcHRpb25zLmF1dG9wbGF5U3BlZWQgfHwgNTAwMCxcbiAgICAgICAgICAgIHBhdXNlT25Nb3VzZUVudGVyOiBzYXZlZE9wdGlvbnMucGF1c2VPbkhvdmVyIHx8IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRmFkZSBlZmZlY3RcbiAgICBpZiAoc2F2ZWRPcHRpb25zLmZhZGUpIHtcbiAgICAgICAgc3dpcGVyT3B0aW9ucy5lZmZlY3QgPSAnZmFkZSc7XG4gICAgICAgIHN3aXBlck9wdGlvbnMuZmFkZUVmZmVjdCA9IHtjcm9zc0ZhZGU6IHRydWV9O1xuICAgIH1cblxuICAgIC8vIERpc2FibGUgdG91Y2ggKHNlY3Rpb24gc2xpZGVycylcbiAgICBpZiAoc2F2ZWRPcHRpb25zLmFsbG93VG91Y2hNb3ZlID09PSBmYWxzZSkge1xuICAgICAgICBzd2lwZXJPcHRpb25zLmFsbG93VG91Y2hNb3ZlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBzbGlkZVxuICAgIGlmIChzYXZlZE9wdGlvbnMuaW5pdGlhbFNsaWRlICE9PSB1bmRlZmluZWQgJiYgc2F2ZWRPcHRpb25zLmluaXRpYWxTbGlkZSAhPT0gbnVsbCkge1xuICAgICAgICBzd2lwZXJPcHRpb25zLmluaXRpYWxTbGlkZSA9IHBhcnNlSW50KHNhdmVkT3B0aW9ucy5pbml0aWFsU2xpZGUsIDEwKTtcbiAgICB9XG5cbiAgICBpZiAoU1dJUEVSX0RFQlVHKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGaW5hbCBTd2lwZXIgY29uZmlnOicsIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3dpcGVyT3B0aW9ucywgZnVuY3Rpb24gKGssIHYpIHtcbiAgICAgICAgICAgIC8vIFNraXAgRE9NIGVsZW1lbnRzIGluIG5hdmlnYXRpb24vcGFnaW5hdGlvbi9zY3JvbGxiYXIgZm9yIGNsZWFuZXIgb3V0cHV0XG4gICAgICAgICAgICBpZiAoayA9PT0gJ2VsJyB8fCBrID09PSAnbmV4dEVsJyB8fCBrID09PSAncHJldkVsJykgcmV0dXJuIHYgPyAnW0RPTSBlbGVtZW50XScgOiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0pKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdOYXZpZ2F0aW9uIHByZXZFbDonLCBzd2lwZXJPcHRpb25zLm5hdmlnYXRpb24gPyBzd2lwZXJPcHRpb25zLm5hdmlnYXRpb24ucHJldkVsIDogJ25vbmUnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ05hdmlnYXRpb24gbmV4dEVsOicsIHN3aXBlck9wdGlvbnMubmF2aWdhdGlvbiA/IHN3aXBlck9wdGlvbnMubmF2aWdhdGlvbi5uZXh0RWwgOiAnbm9uZScpO1xuICAgICAgICBjb25zb2xlLmxvZygnUGFnaW5hdGlvbiBlbDonLCBzd2lwZXJPcHRpb25zLnBhZ2luYXRpb24gPyBzd2lwZXJPcHRpb25zLnBhZ2luYXRpb24uZWwgOiAnbm9uZScpO1xuICAgIH1cblxuXG4gICAgdmFyIHN3aXBlckluc3RhbmNlID0gbmV3IFN3aXBlcigkY2Fyb3VzZWxbMF0sIHN3aXBlck9wdGlvbnMpO1xuXG4gICAgLy8gRWxlbWVudG9yIGVkaXRvcjogd2hlbiB1c2VyIHN3aXRjaGVzIGRldmljZSBwcmV2aWV3IG1vZGUsIGZvcmNlIHN3aXBlci51cGRhdGUoKVxuICAgIC8vIHNvIGJyZWFrcG9pbnRzIGFyZSByZS1ldmFsdWF0ZWQgYWdhaW5zdCB0aGUgbmV3IGlmcmFtZSB3aWR0aC5cbiAgICAvLyBOT1RFOiB0aGlzIGhhbmRsZXIgcnVucyBpbiB0aGUgRURJVE9SIHdpbmRvdyAobm90IHRoZSBpZnJhbWUpLCBzbyBgd2luZG93LmVsZW1lbnRvcmBcbiAgICAvLyBpcyBkaXJlY3RseSBhY2Nlc3NpYmxlLiBUaGUgY2Fyb3VzZWwgRE9NIGVsZW1lbnQgbGl2ZXMgaW4gdGhlIGlmcmFtZSB0aG91Z2gsIHJlYWNoYWJsZVxuICAgIC8vIHZpYSAkY2Fyb3VzZWxbMF0ub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5cbiAgICBpZiAoaXNFZGl0TW9kZSkge1xuICAgICAgICB2YXIgaWZyYW1lV2luID0gJGNhcm91c2VsWzBdLm93bmVyRG9jdW1lbnQgJiYgJGNhcm91c2VsWzBdLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG5cbiAgICAgICAgLy8gUm9vdCBjYXVzZTogU3dpcGVyJ3MgZ2V0QnJlYWtwb2ludCgpIHVzZXMgdGhlIGdsb2JhbCBgbWF0Y2hNZWRpYWAgZnJvbSB0aGVcbiAgICAgICAgLy8gc2NyaXB0J3MgcmVhbG0g4oCUIGkuZS4gdGhlIGVkaXRvciB3aW5kb3csIHdoaWNoIHN0YXlzIGRlc2t0b3Atc2l6ZWQuXG4gICAgICAgIC8vIFdlIG92ZXJyaWRlIGl0IHRvIHVzZSB0aGUgSUZSQU1FIHdpbmRvdydzIG1hdGNoTWVkaWEsIHNvIGJyZWFrcG9pbnRzIGFyZVxuICAgICAgICAvLyByZXNvbHZlZCBhZ2FpbnN0IHRoZSBwcmV2aWV3IHZpZXdwb3J0ICh3aGljaCBhY3R1YWxseSByZXNpemVzIHdpdGggZGV2aWNlIG1vZGUpLlxuICAgICAgICBpZiAoaWZyYW1lV2luICYmIGlmcmFtZVdpbiAhPT0gd2luZG93ICYmIHR5cGVvZiBpZnJhbWVXaW4ubWF0Y2hNZWRpYSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc3dpcGVySW5zdGFuY2UuZ2V0QnJlYWtwb2ludCA9IGZ1bmN0aW9uIChicmVha3BvaW50cywgYmFzZSwgY29udGFpbmVyRWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWJyZWFrcG9pbnRzKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gT2JqZWN0LmtleXMoYnJlYWtwb2ludHMpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHAgPT09ICdzdHJpbmcnICYmIHAuaW5kZXhPZignQCcpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWluUmF0aW8gPSBwYXJzZUZsb2F0KHAuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IGlmcmFtZVdpbi5pbm5lckhlaWdodCAqIG1pblJhdGlvLCBwb2ludDogcCB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBwLCBwb2ludDogcCB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxpc3Quc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gcGFyc2VJbnQoYS52YWx1ZSwgMTApIC0gcGFyc2VJbnQoYi52YWx1ZSwgMTApOyB9KTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEJwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGxpc3RbaV0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYXNlID09PSAnd2luZG93JyB8fCBiYXNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZnJhbWVXaW4ubWF0Y2hNZWRpYSgnKG1pbi13aWR0aDogJyArIHYgKyAncHgpJykubWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCcCA9IGxpc3RbaV0ucG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodiA8PSBjb250YWluZXJFbC5jbGllbnRXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEJwID0gbGlzdFtpXS5wb2ludDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudEJwIHx8ICdtYXgnO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUubG9nKCdbU3dpcGVyIGVkaXRvcl0g4pyTIGdldEJyZWFrcG9pbnQgb3ZlcnJpZGRlbiB0byB1c2UgaWZyYW1lIG1hdGNoTWVkaWEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaXJlVXBkYXRlID0gZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXAoJyVjW1N3aXBlciBlZGl0b3JdIGRldmljZSBtb2RlIGNoYW5nZSAoJyArIHNvdXJjZSArICcpJywgJ2NvbG9yOiNFOTFFNjM7Zm9udC13ZWlnaHQ6Ym9sZCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDYXJvdXNlbDonLCBkZWJ1Z0lkKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaWZyYW1lIHdpbmRvdy5pbm5lcldpZHRoOicsIGlmcmFtZVdpbiA/IGlmcmFtZVdpbi5pbm5lcldpZHRoIDogJ24vYScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjYXJvdXNlbCBjb250YWluZXIgY2xpZW50V2lkdGg6JywgJGNhcm91c2VsWzBdLmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY3VycmVudCBzbGlkZXNQZXJWaWV3OicsIHN3aXBlckluc3RhbmNlID8gc3dpcGVySW5zdGFuY2UucGFyYW1zLnNsaWRlc1BlclZpZXcgOiAnbi9hJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2N1cnJlbnQgYWN0aXZlQnJlYWtwb2ludDonLCBzd2lwZXJJbnN0YW5jZSA/IHN3aXBlckluc3RhbmNlLmN1cnJlbnRCcmVha3BvaW50IDogJ24vYScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3dpcGVySW5zdGFuY2UgfHwgc3dpcGVySW5zdGFuY2UuZGVzdHJveWVkKSByZXR1cm47XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXN3aXBlckluc3RhbmNlIHx8IHN3aXBlckluc3RhbmNlLmRlc3Ryb3llZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHZhciBiZWZvcmUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzd2lwZXJJbnN0YW5jZS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVzUGVyVmlldzogc3dpcGVySW5zdGFuY2UucGFyYW1zLnNsaWRlc1BlclZpZXcsXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IHN3aXBlckluc3RhbmNlLmN1cnJlbnRCcmVha3BvaW50XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzZXRCcmVha3BvaW50KCkgcmUtZXZhbHVhdGVzIGJyZWFrcG9pbnRzIGFnYWluc3QgY3VycmVudCB3aW5kb3cvY29udGFpbmVyXG4gICAgICAgICAgICAgICAgLy8gd2lkdGgg4oCUIHVwZGF0ZSgpIGFsb25lIGRvZXMgTk9UIHRyaWdnZXIgYnJlYWtwb2ludCByZS1ldmFsdWF0aW9uLlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3dpcGVySW5zdGFuY2Uuc2V0QnJlYWtwb2ludCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBzd2lwZXJJbnN0YW5jZS5zZXRCcmVha3BvaW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXBlckluc3RhbmNlLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5ncm91cCgnJWNbU3dpcGVyIGVkaXRvcl0gdXBkYXRlKCkgY2FsbGVkICgnICsgc291cmNlICsgJyknLCAnY29sb3I6IzRDQUY1MDtmb250LXdlaWdodDpib2xkJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDYXJvdXNlbDonLCBkZWJ1Z0lkKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2lmcmFtZSB3aW5kb3cuaW5uZXJXaWR0aDonLCBpZnJhbWVXaW4gPyBpZnJhbWVXaW4uaW5uZXJXaWR0aCA6ICduL2EnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nhcm91c2VsIGNvbnRhaW5lciBjbGllbnRXaWR0aDonLCAkY2Fyb3VzZWxbMF0uY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQkVGT1JFOicsIGJlZm9yZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBRlRFUjonLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogc3dpcGVySW5zdGFuY2Uud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXNQZXJWaWV3OiBzd2lwZXJJbnN0YW5jZS5wYXJhbXMuc2xpZGVzUGVyVmlldyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IHN3aXBlckluc3RhbmNlLmN1cnJlbnRCcmVha3BvaW50XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyAtLS0gRGlhZ25vc3RpYyAtLS1cbiAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICAgICAgY29uc29sZS5ncm91cCgnJWNbU3dpcGVyIGVkaXRvcl0gYmluZGluZyBkaWFnbm9zdGljcyAoJyArIGRlYnVnSWQgKyAnKScsICdjb2xvcjojRkY5ODAwO2ZvbnQtd2VpZ2h0OmJvbGQnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdydW5uaW5nIGluIGlmcmFtZT8nLCB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2lmcmFtZVdpbiAoZnJvbSBlbGVtZW50KTonLCAhIWlmcmFtZVdpbiwgaWZyYW1lV2luID8gKCdpbm5lcldpZHRoPScgKyBpZnJhbWVXaW4uaW5uZXJXaWR0aCkgOiAnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd2luZG93LmVsZW1lbnRvcjonLCB0eXBlb2Ygd2luZG93LmVsZW1lbnRvcik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd2luZG93LmVsZW1lbnRvci5jaGFubmVsczonLCB3aW5kb3cuZWxlbWVudG9yID8gdHlwZW9mIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMgOiAnbi9hJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd2luZG93LmVsZW1lbnRvci5jaGFubmVscy5kZXZpY2VNb2RlOicsICh3aW5kb3cuZWxlbWVudG9yICYmIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMpID8gdHlwZW9mIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSA6ICduL2EnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3aW5kb3cualF1ZXJ5OicsIHR5cGVvZiB3aW5kb3cualF1ZXJ5KTtcbiAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0cmF0ZWd5IDE6IEJhY2tib25lLlJhZGlvIGNoYW5uZWwgKG1vc3QgcmVsaWFibGUpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmVsZW1lbnRvciAmJiB3aW5kb3cuZWxlbWVudG9yLmNoYW5uZWxzICYmIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5lbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBmaXJlVXBkYXRlKCdjaGFubmVsOmRldmljZU1vZGUuY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKFNXSVBFUl9ERUJVRykgY29uc29sZS5sb2coJ1tTd2lwZXIgZWRpdG9yXSDinJMgYm91bmQgdG8gZWxlbWVudG9yLmNoYW5uZWxzLmRldmljZU1vZGUgY2hhbmdlJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW1N3aXBlciBlZGl0b3JdIOKclyBlbGVtZW50b3IuY2hhbm5lbHMuZGV2aWNlTW9kZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChTV0lQRVJfREVCVUcpIGNvbnNvbGUud2FybignW1N3aXBlciBlZGl0b3JdIOKclyBjaGFubmVsIGJpbmQgZmFpbGVkOicsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RyYXRlZ3kgMjogalF1ZXJ5IGV2ZW50IG9uIGVkaXRvciB3aW5kb3dcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cualF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmpRdWVyeSh3aW5kb3cpLm9uKCdjaGFuZ2VkRGV2aWNlTW9kZS5pcWl0U3dpcGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBmaXJlVXBkYXRlKCdqcXVlcnk6Y2hhbmdlZERldmljZU1vZGUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmxvZygnW1N3aXBlciBlZGl0b3JdIOKckyBib3VuZCB0byB3aW5kb3cgalF1ZXJ5IGNoYW5nZWREZXZpY2VNb2RlJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFNXSVBFUl9ERUJVRykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW1N3aXBlciBlZGl0b3JdIOKclyBqUXVlcnkgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLndhcm4oJ1tTd2lwZXIgZWRpdG9yXSDinJcganF1ZXJ5IGJpbmQgZmFpbGVkOicsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RyYXRlZ3kgMzogcmVzaXplIGV2ZW50IG9uIHRoZSBpZnJhbWUgd2luZG93ICh3aGVyZSB0aGUgY2Fyb3VzZWwgRE9NIGxpdmVzKVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGlmcmFtZVdpbiAmJiBpZnJhbWVXaW4gIT09IHdpbmRvdykge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5qUXVlcnkoaWZyYW1lV2luKS5vbigncmVzaXplLmlxaXRTd2lwZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcmVVcGRhdGUoJ2lmcmFtZVdpbjpyZXNpemUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLmxvZygnW1N3aXBlciBlZGl0b3JdIOKckyBib3VuZCB0byBpZnJhbWUgd2luZG93IHJlc2l6ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoU1dJUEVSX0RFQlVHKSBjb25zb2xlLndhcm4oJ1tTd2lwZXIgZWRpdG9yXSDinJcgaWZyYW1lIHJlc2l6ZSBiaW5kIGZhaWxlZDonLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTV0lQRVJfREVCVUcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1N3aXBlciBpbnN0YW5jZSBjcmVhdGVkJyk7XG4gICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICB9XG59XG5cbi8vIFJlZ2lzdGVyIHRoZSBzYW1lIGhhbmRsZXIgZm9yIGFsbCBjYXJvdXNlbCBzZWxlY3RvcnNcbkNBUk9VU0VMX1NFTEVDVE9SUy5mb3JFYWNoKGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgIEVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKHNlbGVjdG9yLCBpbml0Q2Fyb3VzZWwpO1xufSk7XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItdG9jJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdG9jID0gJCh0aGlzKTtcbiAgICB2YXIgZWwgPSAkdG9jWzBdO1xuXG4gICAgdmFyIGhlYWRpbmdUYWdzID0gKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1oZWFkaW5ncycpIHx8ICdoMicpLnNwbGl0KCcsJyk7XG4gICAgdmFyIGNvbnRhaW5lclNlbGVjdG9yID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbnRhaW5lcicpIHx8ICcnO1xuICAgIHZhciBoaWVyYXJjaGljYWwgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaGllcmFyY2hpY2FsJykgPT09ICcxJztcbiAgICB2YXIgbGlzdFRhZyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1saXN0LXRhZycpIHx8ICd1bCc7XG4gICAgdmFyIG5vSGVhZGluZ3NNZXNzYWdlID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW5vLWhlYWRpbmdzLW1lc3NhZ2UnKSB8fCAnJztcblxuICAgIHZhciAkYm9keSA9ICR0b2MuZmluZCgnLmVsZW1lbnRvci10b2NfX2JvZHknKTtcbiAgICBpZiAoISRib2R5Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2NvcGVcbiAgICB2YXIgc2NvcGUgPSBjb250YWluZXJTZWxlY3RvciA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyU2VsZWN0b3IpIDogZG9jdW1lbnQ7XG4gICAgaWYgKCFzY29wZSkge1xuICAgICAgICBzY29wZSA9IGRvY3VtZW50O1xuICAgIH1cblxuICAgIC8vIEZpbmQgaGVhZGluZ3MgKGV4Y2x1ZGUgdGhvc2UgaW5zaWRlIHRoZSB3aWRnZXQgaXRzZWxmKVxuICAgIHZhciBzZWxlY3RvciA9IGhlYWRpbmdUYWdzLmpvaW4oJywnKTtcbiAgICB2YXIgYWxsSGVhZGluZ3MgPSBzY29wZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICB2YXIgaGVhZGluZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbEhlYWRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghZWwuY29udGFpbnMoYWxsSGVhZGluZ3NbaV0pKSB7XG4gICAgICAgICAgICBoZWFkaW5ncy5wdXNoKGFsbEhlYWRpbmdzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoZWFkaW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgJGJvZHkuaHRtbChcbiAgICAgICAgICAgIG5vSGVhZGluZ3NNZXNzYWdlXG4gICAgICAgICAgICAgICAgPyAnPGRpdiBjbGFzcz1cImVsZW1lbnRvci10b2NfX25vLWhlYWRpbmdzXCI+JyArIGVzY2FwZUh0bWwobm9IZWFkaW5nc01lc3NhZ2UpICsgJzwvZGl2PidcbiAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgZWFjaCBoZWFkaW5nIGhhcyBhbiBpZFxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVhZGluZ3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCFoZWFkaW5nc1tqXS5pZCkge1xuICAgICAgICAgICAgaGVhZGluZ3Nbal0uaWQgPSAndG9jLWhlYWRpbmctJyArIGo7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBCdWlsZCBsaXN0XG4gICAgdmFyIGh0bWwgPSBoaWVyYXJjaGljYWxcbiAgICAgICAgPyBidWlsZEhpZXJhcmNoaWNhbExpc3QoaGVhZGluZ3MsIGxpc3RUYWcsIGhlYWRpbmdUYWdzKVxuICAgICAgICA6IGJ1aWxkRmxhdExpc3QoaGVhZGluZ3MsIGxpc3RUYWcpO1xuXG4gICAgJGJvZHkuaHRtbChodG1sKTtcblxuICAgIC8vIENvbGxhcHNlIC8gRXhwYW5kXG4gICAgc2V0dXBUb2dnbGUoJHRvYyk7XG5cbiAgICAvLyBTbW9vdGggc2Nyb2xsXG4gICAgJHRvYy5vbignY2xpY2snLCAnLmVsZW1lbnRvci10b2NfX2xpc3QtaXRlbS10ZXh0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgaHJlZiA9ICQodGhpcykuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYgfHwgaHJlZi5jaGFyQXQoMCkgIT09ICcjJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChocmVmLnN1YnN0cmluZygxKSk7XG4gICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9mZnNldCA9IDgwO1xuICAgICAgICB2YXIgdG9wID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArIHdpbmRvdy5wYWdlWU9mZnNldCAtIG9mZnNldDtcbiAgICAgICAgd2luZG93LnNjcm9sbFRvKHsgdG9wOiB0b3AsIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgICAgaWYgKGhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBocmVmKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQWN0aXZlIHRyYWNraW5nXG4gICAgc2V0dXBBY3RpdmVUcmFja2luZygkdG9jLCBoZWFkaW5ncyk7XG59KTtcblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgTGlzdCBidWlsZGVyc1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmZ1bmN0aW9uIGJ1aWxkRmxhdExpc3QoaGVhZGluZ3MsIHRhZykge1xuICAgIHZhciBodG1sID0gJzwnICsgdGFnICsgJyBjbGFzcz1cImVsZW1lbnRvci10b2NfX2xpc3Qtd3JhcHBlclwiPic7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoZWFkaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICBodG1sICs9IGJ1aWxkTGlzdEl0ZW0oaGVhZGluZ3NbaV0pICsgJzwvbGk+JztcbiAgICB9XG4gICAgaHRtbCArPSAnPC8nICsgdGFnICsgJz4nO1xuICAgIHJldHVybiBodG1sO1xufVxuXG5mdW5jdGlvbiBidWlsZEhpZXJhcmNoaWNhbExpc3QoaGVhZGluZ3MsIHRhZywgYWxsb3dlZFRhZ3MpIHtcbiAgICB2YXIgd2VpZ2h0TWFwID0ge307XG4gICAgdmFyIHNvcnRlZFRhZ3MgPSBhbGxvd2VkVGFncy5zbGljZSgpLnNvcnQoKTtcbiAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHNvcnRlZFRhZ3MubGVuZ3RoOyB0KyspIHtcbiAgICAgICAgd2VpZ2h0TWFwW3NvcnRlZFRhZ3NbdF0udG9Mb3dlckNhc2UoKV0gPSB0ICsgMTtcbiAgICB9XG5cbiAgICB2YXIgaHRtbCA9ICcnO1xuICAgIHZhciBzdGFjayA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoZWFkaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IGhlYWRpbmdzW2ldLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGxldmVsID0gd2VpZ2h0TWFwW3RhZ05hbWVdIHx8IDE7XG5cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaHRtbCArPSAnPCcgKyB0YWcgKyAnIGNsYXNzPVwiZWxlbWVudG9yLXRvY19fbGlzdC13cmFwcGVyXCI+JztcbiAgICAgICAgICAgIHN0YWNrLnB1c2gobGV2ZWwpO1xuICAgICAgICB9IGVsc2UgaWYgKGxldmVsID4gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPCBsZXZlbCkge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzwnICsgdGFnICsgJyBjbGFzcz1cImVsZW1lbnRvci10b2NfX2xpc3Qtd3JhcHBlclwiPic7XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChzdGFja1tzdGFjay5sZW5ndGggLSAxXSArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxldmVsIDwgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAwICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID4gbGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L2xpPjwvJyArIHRhZyArICc+JztcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGh0bWwgKz0gJzwvbGk+JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGh0bWwgKz0gJzwvbGk+JztcbiAgICAgICAgfVxuXG4gICAgICAgIGh0bWwgKz0gYnVpbGRMaXN0SXRlbShoZWFkaW5nc1tpXSk7XG4gICAgfVxuXG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaHRtbCArPSAnPC9saT48LycgKyB0YWcgKyAnPic7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cblxuICAgIHJldHVybiBodG1sO1xufVxuXG5mdW5jdGlvbiBidWlsZExpc3RJdGVtKGhlYWRpbmcpIHtcbiAgICB2YXIgdGV4dCA9IGhlYWRpbmcudGV4dENvbnRlbnQgfHwgaGVhZGluZy5pbm5lclRleHQgfHwgJyc7XG4gICAgcmV0dXJuICc8bGkgY2xhc3M9XCJlbGVtZW50b3ItdG9jX19saXN0LWl0ZW1cIiBkYXRhLXRhcmdldC1pZD1cIicgKyBoZWFkaW5nLmlkICsgJ1wiPidcbiAgICAgICAgKyAnPGEgaHJlZj1cIiMnICsgaGVhZGluZy5pZCArICdcIiBjbGFzcz1cImVsZW1lbnRvci10b2NfX2xpc3QtaXRlbS10ZXh0XCI+J1xuICAgICAgICArIGVzY2FwZUh0bWwodGV4dC50cmltKCkpXG4gICAgICAgICsgJzwvYT4nO1xufVxuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBUb2dnbGUgKGNvbGxhcHNlIC8gZXhwYW5kKVxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmZ1bmN0aW9uIHNldHVwVG9nZ2xlKCR0b2MpIHtcbiAgICB2YXIgJGJ0bkV4cGFuZCA9ICR0b2MuZmluZCgnLmVsZW1lbnRvci10b2NfX3RvZ2dsZS1idXR0b24tLWV4cGFuZCcpO1xuICAgIHZhciAkYnRuQ29sbGFwc2UgPSAkdG9jLmZpbmQoJy5lbGVtZW50b3ItdG9jX190b2dnbGUtYnV0dG9uLS1jb2xsYXBzZScpO1xuXG4gICAgaWYgKCEkYnRuRXhwYW5kLmxlbmd0aCAmJiAhJGJ0bkNvbGxhcHNlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGVsID0gJHRvY1swXTtcbiAgICB2YXIgbWluaW1pemVkT24gPSAnJztcbiAgICBpZiAoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdlbGVtZW50b3ItdG9jLS1taW5pbWl6ZWQtb24tbW9iaWxlJykpIHtcbiAgICAgICAgbWluaW1pemVkT24gPSAnbW9iaWxlJztcbiAgICB9IGVsc2UgaWYgKGVsLmNsYXNzTGlzdC5jb250YWlucygnZWxlbWVudG9yLXRvYy0tbWluaW1pemVkLW9uLXRhYmxldCcpKSB7XG4gICAgICAgIG1pbmltaXplZE9uID0gJ3RhYmxldCc7XG4gICAgfSBlbHNlIGlmIChlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2VsZW1lbnRvci10b2MtLW1pbmltaXplZC1vbi1kZXNrdG9wJykpIHtcbiAgICAgICAgbWluaW1pemVkT24gPSAnZGVza3RvcCc7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBzdGF0ZSBiYXNlZCBvbiBicmVha3BvaW50XG4gICAgdmFyIHcgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB2YXIgc2hvdWxkTWluaW1pemUgPSBmYWxzZTtcbiAgICBpZiAobWluaW1pemVkT24gPT09ICdtb2JpbGUnICYmIHcgPCA3NjgpIHtcbiAgICAgICAgc2hvdWxkTWluaW1pemUgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAobWluaW1pemVkT24gPT09ICd0YWJsZXQnICYmIHcgPCAxMDI0KSB7XG4gICAgICAgIHNob3VsZE1pbmltaXplID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG1pbmltaXplZE9uID09PSAnZGVza3RvcCcpIHtcbiAgICAgICAgc2hvdWxkTWluaW1pemUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRNaW5pbWl6ZSkge1xuICAgICAgICAkdG9jLmFkZENsYXNzKCdlbGVtZW50b3ItdG9jLS1jb2xsYXBzZWQnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b2dnbGUoKSB7XG4gICAgICAgICR0b2MudG9nZ2xlQ2xhc3MoJ2VsZW1lbnRvci10b2MtLWNvbGxhcHNlZCcpO1xuICAgIH1cblxuICAgICRidG5FeHBhbmQuYWRkKCRidG5Db2xsYXBzZSkub24oJ2NsaWNrJywgdG9nZ2xlKTtcbiAgICAkYnRuRXhwYW5kLmFkZCgkYnRuQ29sbGFwc2UpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInIHx8IGUua2V5ID09PSAnICcpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRvZ2dsZSgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIEFjdGl2ZSBoZWFkaW5nIHRyYWNraW5nXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuZnVuY3Rpb24gc2V0dXBBY3RpdmVUcmFja2luZygkdG9jLCBoZWFkaW5ncykge1xuICAgIGlmICghaGVhZGluZ3MubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgJGl0ZW1zID0gJHRvYy5maW5kKCcuZWxlbWVudG9yLXRvY19fbGlzdC1pdGVtJyk7XG4gICAgdmFyIG9mZnNldCA9IDEwMDtcbiAgICB2YXIgdGlja2luZyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gb25TY3JvbGwoKSB7XG4gICAgICAgIGlmICh0aWNraW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGlja2luZyA9IHRydWU7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aWNraW5nID0gZmFsc2U7XG4gICAgICAgICAgICB1cGRhdGVBY3RpdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlQWN0aXZlKCkge1xuICAgICAgICB2YXIgc2Nyb2xsWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgICAgdmFyIGFjdGl2ZUluZGV4ID0gLTE7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IGhlYWRpbmdzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBpZiAoaGVhZGluZ3NbaV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0IC0gb2Zmc2V0IDw9IHNjcm9sbFkpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkaXRlbXMucmVtb3ZlQ2xhc3MoJ2VsZW1lbnRvci10b2NfX2xpc3QtaXRlbS0tYWN0aXZlJyk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZUluZGV4ID49IDAgJiYgYWN0aXZlSW5kZXggPCAkaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAkaXRlbXMuZXEoYWN0aXZlSW5kZXgpLmFkZENsYXNzKCdlbGVtZW50b3ItdG9jX19saXN0LWl0ZW0tLWFjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwuaXFpdFRvYycsIG9uU2Nyb2xsKTtcbiAgICB1cGRhdGVBY3RpdmUoKTtcbn1cblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgSGVscGVyXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHtcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0cikpO1xuICAgIHJldHVybiBkaXYuaW5uZXJIVE1MO1xufVxuIiwiLyogZ2xvYmFsICQgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCcuZWxlbWVudG9yLXRhYnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0YWJzID0gJCh0aGlzKTtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZVRhYiA9ICR0YWJzLmRhdGEoJ2FjdGl2ZS10YWInKSB8fCAxO1xuICAgIHZhciAkdGFic1RpdGxlcyA9ICR0YWJzLmZpbmQoJy5lbGVtZW50b3ItdGFiLXRpdGxlJyk7XG4gICAgdmFyICR0YWJzQ29udGVudHMgPSAkdGFicy5maW5kKCcuZWxlbWVudG9yLXRhYi1jb250ZW50Jyk7XG4gICAgdmFyICRhY3RpdmUsICRjb250ZW50O1xuXG4gICAgZnVuY3Rpb24gYWN0aXZhdGVUYWIodGFiSW5kZXgpIHtcbiAgICAgICAgaWYgKCRhY3RpdmUpIHtcbiAgICAgICAgICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgJGNvbnRlbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGFjdGl2ZSA9ICR0YWJzVGl0bGVzLmZpbHRlcignW2RhdGEtdGFiPVwiJyArIHRhYkluZGV4ICsgJ1wiXScpO1xuICAgICAgICAkYWN0aXZlLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgJGNvbnRlbnQgPSAkdGFic0NvbnRlbnRzLmZpbHRlcignW2RhdGEtdGFiPVwiJyArIHRhYkluZGV4ICsgJ1wiXScpO1xuICAgICAgICAkY29udGVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfVxuXG4gICAgYWN0aXZhdGVUYWIoZGVmYXVsdEFjdGl2ZVRhYik7XG5cbiAgICAkdGFic1RpdGxlcy5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFjdGl2YXRlVGFiKHRoaXMuZGF0YXNldC50YWIpO1xuICAgIH0pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCAqL1xuXG52YXIgRWxlbWVudHNIYW5kbGVyID0gcmVxdWlyZSgnZWxlbWVudG9yLWZyb250ZW5kL2VsZW1lbnRzLWhhbmRsZXInKTtcblxuRWxlbWVudHNIYW5kbGVyLmFkZEhhbmRsZXIoJy5lbGVtZW50b3ItdG9nZ2xlLXRpdGxlJywgZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGl0bGUgPSAkKHRoaXMpO1xuXG4gICAgJHRpdGxlLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRjb250ZW50ID0gJHRpdGxlLm5leHQoKTtcblxuICAgICAgICBpZiAoJHRpdGxlLmhhc0NsYXNzKCdhY3RpdmUnKSkge1xuICAgICAgICAgICAgJHRpdGxlLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICRjb250ZW50LnNsaWRlVXAoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aXRsZS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkY29udGVudC5zbGlkZURvd24oKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iLCIvKiBnbG9iYWwgJCwgZWxlbWVudG9yRnJvbnRlbmRDb25maWcgKi9cblxudmFyIEVsZW1lbnRzSGFuZGxlciA9IHJlcXVpcmUoJ2VsZW1lbnRvci1mcm9udGVuZC9lbGVtZW50cy1oYW5kbGVyJyk7XG5cbkVsZW1lbnRzSGFuZGxlci5hZGRIYW5kbGVyKCdbZGF0YS1lbGVtZW50X3R5cGU9XCJ2aWRlb1wiXScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJHdpZGdldCA9ICQodGhpcyk7XG4gICAgdmFyICRpbWFnZU92ZXJsYXkgPSAkd2lkZ2V0LmZpbmQoJy5lbGVtZW50b3ItY3VzdG9tLWVtYmVkLWltYWdlLW92ZXJsYXknKTtcbiAgICB2YXIgJHZpZGVvTW9kYWxCdG4gPSAkd2lkZ2V0LmZpbmQoJy5lbGVtZW50b3ItdmlkZW8tb3Blbi1tb2RhbCcpLmZpcnN0KCk7XG4gICAgdmFyICR2aWRlb01vZGFsID0gJHdpZGdldC5maW5kKCcuZWxlbWVudG9yLXZpZGVvLW1vZGFsJykuZmlyc3QoKTtcbiAgICB2YXIgJHZpZGVvID0gJHdpZGdldC5maW5kKCcuZWxlbWVudG9yLXZpZGVvJykuZmlyc3QoKTtcbiAgICB2YXIgJHZpZGVvRnJhbWUgPSAkd2lkZ2V0LmZpbmQoJ2lmcmFtZScpO1xuXG4gICAgaWYgKCRpbWFnZU92ZXJsYXkubGVuZ3RoKSB7XG4gICAgICAgICRpbWFnZU92ZXJsYXkub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJGltYWdlT3ZlcmxheS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgaWYgKCR2aWRlby5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkdmlkZW9bMF0ucGxheSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCR2aWRlb0ZyYW1lLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBzcmMgPSAkdmlkZW9GcmFtZVswXS5zcmM7XG4gICAgICAgICAgICAgICAgJHZpZGVvRnJhbWVbMF0uc3JjID0gc3JjLnJlcGxhY2UoJ2F1dG9wbGF5PTAnLCAnYXV0b3BsYXk9MScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoISR2aWRlb01vZGFsQnRuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJHZpZGVvTW9kYWxCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHZpZGVvLmxlbmd0aCkge1xuICAgICAgICAgICAgJHZpZGVvWzBdLnBsYXkoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkdmlkZW9GcmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBzcmMgPSAkdmlkZW9GcmFtZVswXS5zcmM7XG4gICAgICAgICAgICAkdmlkZW9GcmFtZVswXS5zcmMgPSBzcmMucmVwbGFjZSgnYXV0b3BsYXk9MCcsICdhdXRvcGxheT0xJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICR2aWRlb01vZGFsLm9uKCdoaWRlLmJzLm1vZGFsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHZpZGVvLmxlbmd0aCkge1xuICAgICAgICAgICAgJHZpZGVvWzBdLnBhdXNlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJHZpZGVvRnJhbWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgc3JjID0gJHZpZGVvRnJhbWVbMF0uc3JjO1xuICAgICAgICAgICAgJHZpZGVvRnJhbWVbMF0uc3JjID0gc3JjLnJlcGxhY2UoJ2F1dG9wbGF5PTEnLCAnYXV0b3BsYXk9MCcpO1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcbiJdfQ==
