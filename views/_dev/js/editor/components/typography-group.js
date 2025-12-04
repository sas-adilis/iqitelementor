// Regroupe tous les controls d'un Group_Control_Typography
// dans un wrapper .iqit-typography-group

var TypographyGroup = function () {
    var $ = Backbone.$;

    var TYPO_SUFFIXES = [
        '_typography',
        '_font_size',
        '_font_family',
        '_font_family_custom',
        '_font_weight',
        '_text_transform',
        '_font_style',
        '_font_decoration',
        '_line_height',
        '_letter_spacing'
    ];

    function getGroupKey(setting) {
        if (!setting) {
            return null;
        }

        for (var i = 0; i < TYPO_SUFFIXES.length; i++) {
            var suffix = TYPO_SUFFIXES[i];

            if (setting.length > suffix.length &&
                setting.slice(-suffix.length) === suffix) {
                // "title_typography_font_size" → "title_typography"
                return setting.slice(0, setting.length - suffix.length);
            }
        }

        return null;
    }

    function groupControlsInScope($scope) {
        if (!$scope || !$scope.length) {
            return;
        }

        console.log('Grouping typography controls in scope:', $scope);
        console.log($scope.find('.elementor-group-control-typography'));

        var groups = {};


        $scope.find('.elementor-control').each(function () {
            var $control = $(this);
            var setting = $control.data('setting');

            var key = getGroupKey(setting);

            console.log('Control setting:', setting, '→ group key:', key);

            if (!key) {
                return;
            }

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push($control);
        });

        console.log(groups);

        _.each(groups, function (controls, key) {
            if (!controls.length) {
                return;
            }

            // déjà wrap ?
            if (controls[0].closest('.iqit-typography-group').length) {
                return;
            }

            var $wrapper = $('<div class="iqit-typography-group" data-typography-group="' + key + '"></div>');

            controls[0].before($wrapper);

            for (var i = 0; i < controls.length; i++) {
                $wrapper.append(controls[i]);
            }
        });
    }

    function runForCurrentPanel() {
        if (!window.elementor || !elementor.getPanelView) {
            return;
        }

        var panelView = elementor.getPanelView();

        if (!panelView || !panelView.$el) {
            return;
        }

        // editor page = là où sont les controls du widget
        var $scope = panelView.$el;

        // Évite de traiter plusieurs fois le même panel
        if ($scope.attr('data-iqit-typography-grouped')) {
            return;
        }
        $scope.attr('data-iqit-typography-grouped', true);

        groupControlsInScope($scope);
    }

    function bindEvents() {
        // 1) Quand l’éditeur est prêt
        if (elementor && elementor.on) {
            elementor.on('preview:loaded', function () {
                console.log('preview:loaded');
                runForCurrentPanel();
            });
        }

       // this.listenTo( elementor.channels.panelElements, 'element:selected', this.destroy );

        // Quand on sélectionne un élément et que son panel s’ouvre
        if (elementor.channels && elementor.channels.panelElements) {
            elementor.channels.panelElements.on('element:selected', function () {
                console.log('element:selected');
                runForCurrentPanel();
            });
        }
    }

    bindEvents();
};

let singletonInstance = null;

module.exports = function initTypographyGroup() {
    if (!singletonInstance) {
        singletonInstance = new TypographyGroup();
    }
};