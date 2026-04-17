/**
 * iqitelementor — toast notification system.
 *
 * Bundled at the end of editor.js via Grunt, this IIFE:
 *  - Injects minimal CSS for toast notifications
 *  - Wraps elementor.saveBuilder() to show toasts on success/error
 *  - Legacy popup dialogs removed from footer.js / topbar.js
 */
(function () {
    'use strict';

    // -- Toast container (CSS is in _toast.scss) -----------------------------

    var container = document.createElement('div');
    container.id = 'iqit-toast-container';
    document.body.appendChild(container);

    /**
     * Show a toast notification.
     *
     * @param {string} message
     * @param {'success'|'error'} type
     */
    function showToast(message, type) {
        var toast = document.createElement('div');
        toast.className = 'iqit-toast iqit-toast-' + (type || 'success');

        var icon = type === 'error' ? 'fa-times' : 'fa-check';
        toast.innerHTML =
            '<span class="iqit-toast-icon"><i class="fa ' + icon + '"></i></span>' +
            '<span>' + escapeHtml(message) + '</span>';

        container.appendChild(toast);

        // Trigger reflow then show
        void toast.offsetWidth;
        toast.classList.add('iqit-toast-visible');

        setTimeout(function () {
            toast.classList.remove('iqit-toast-visible');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(s == null ? '' : s)));
        return d.innerHTML;
    }

    // -- Monkey-patch saveBuilder & expose showToast ----------------------------

    var patched = false;

    var check = setInterval(function () {
        if (typeof elementor === 'undefined' || !elementor.saveBuilder || patched) {
            return;
        }

        patched = true;
        clearInterval(check);

        // Expose globally so other components can use it
        elementor.showToast = showToast;

        var origSaveBuilder = elementor.saveBuilder.bind(elementor);

        elementor.saveBuilder = function (options) {
            options = _.extend({
                revision: 'draft',
                onSuccess: null,
                onError: null
            }, options);

            // Wrap onSuccess to show a success toast
            var userOnSuccess = options.onSuccess;
            options.onSuccess = function (data) {
                showToast(elementor.translate('saved'), 'success');

                if (_.isFunction(userOnSuccess)) {
                    userOnSuccess.call(this, data);
                }
            };

            // Wrap onError to show an error toast.
            // ajax.js passes response.data to the error callback, so for
            // {"success":false,"data":{"error":"..."}} we receive the
            // inner data object here.
            var userOnError = options.onError;
            options.onError = function (data) {
                var msg = (data && data.error)
                    ? data.error
                    : elementor.translate('an_error_occurred');
                showToast(msg, 'error');

                if (_.isFunction(userOnError)) {
                    userOnError.call(this, data);
                }
            };

            // Call original — it returns a jQuery deferred
            var promise = origSaveBuilder(options);

            // Also catch jQuery-level failures (network errors, 302
            // redirects, timeouts) that never reach ajax.js callbacks.
            if (promise && promise.fail) {
                promise.fail(function (xhr) {
                    NProgress.done();
                    var msg;
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        msg = (resp.data && resp.data.error)
                            ? resp.data.error
                            : (resp.error || elementor.translate('an_error_occurred'));
                    } catch (e) {
                        msg = elementor.translate('an_error_occurred');
                    }
                    showToast(msg, 'error');
                });
            }

            return promise;
        };

    }, 200);
})();
