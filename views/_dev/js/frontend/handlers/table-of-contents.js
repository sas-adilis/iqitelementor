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
