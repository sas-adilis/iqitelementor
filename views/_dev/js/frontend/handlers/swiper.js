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
