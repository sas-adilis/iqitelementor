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
