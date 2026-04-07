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
//# sourceMappingURL=frontend.js.map
