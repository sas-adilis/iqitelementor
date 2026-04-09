<?php

namespace IqitElementor\Base;

use IqitElementor\Helper\Helper;
use IqitElementor\Helper\OutputHelper;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;
use IqitElementor\Core\Plugin;
use IqitElementor\Control\Group\Background;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\Typography;
use IqitElementor\Control\Group\ImageSize;
use IqitElementor\Control\Group\BoxShadow;
use IqitElementor\Control\Group\TextShadow;
use IqitElementor\Control\Group\Image;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

abstract class ElementBase
{
    public const TAB_CONTENT = 'content';
    public const TAB_STYLE = 'style';
    public const TAB_ADVANCED = 'advanced';
    public const TAB_RESPONSIVE = 'responsive';
    public const TAB_LAYOUT = 'layout';

    public const RESPONSIVE_DESKTOP = 'desktop';
    public const RESPONSIVE_TABLET = 'tablet';
    public const RESPONSIVE_MOBILE = 'mobile';

    /** @var array|null */
    private static $_available_tabs_controls;

    /** @var array<string, array> */
    private $controls = [];

    /** @var array<string, string> */
    private $tabsControls = [];

    /** @var array<string, array> */
    private $renderAttributes = [];

    /**
     * Holds the current section while render a set of controls sections
     *
     * @var array|null
     */
    private $currentSection;

    /**
     * Current tab.
     *
     * Holds the current tab while inserting a set of controls tabs.
     *
     * @var array|null
     */
    private $current_tab;

    /**
     * Current popover.
     *
     * Holds the current popover while inserting a set of controls.
     *
     * @var array|null
     */
    private $current_popover;

    abstract public function getId(): string;

    abstract public function getTitle(): string;

    abstract protected function registerControls(): void;

    // TODO: Need to change this to abstract type
    // abstract protected function render( $instance );
    public function beforeRender(array $instance, string $element_id, array $element_data = []): void
    {
    }

    protected function render(array $instance): void
    {
    }

    public function afterRender(array $instance, string $element_id, array $element_data = []): void
    {
    }

    abstract protected function contentTemplate(): void;

    /**
     * @return string|array
     */
    public function getKeywords()
    {
        return '';
    }

    /**
     * @return string[]
     */
    public function getCategories(): array
    {
        return ['basic'];
    }

    private static function getAvailableTabsControls(): array
    {
        if (!self::$_available_tabs_controls) {
            self::$_available_tabs_controls = [
                self::TAB_CONTENT => Translater::get()->l('Content'),
                self::TAB_STYLE => Translater::get()->l('Style'),
                self::TAB_ADVANCED => Translater::get()->l('Advanced'),
                self::TAB_RESPONSIVE => Translater::get()->l('Responsive'),
                self::TAB_LAYOUT => Translater::get()->l('Layout'),
            ];
        }

        return self::$_available_tabs_controls;
    }

    public function getTabsControls(): array
    {
        return $this->tabsControls;
    }

    public function getType(): string
    {
        return 'element';
    }

    public function getIcon(): string
    {
        return 'columns';
    }

    protected function renderSettings(): void
    {
        ?>
        <div class="elementor-element-overlay">
            <div class="elementor-editor-element-settings elementor-editor-<?php echo Helper::escAttr($this->getType()); ?>-settings elementor-editor-<?php echo Helper::escAttr($this->getId()); ?>-settings">
                <ul class="elementor-editor-element-settings-list">
                    <li class="elementor-editor-element-setting elementor-editor-element-add">
                        <a href="#" title="<?php echo Translater::get()->l('Add Widget'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Add'); ?></span>
                            <i class="fa fa-plus"></i>
                        </a>
                    </li>
                    <?php /* Temp removing for better UI
                    <li class="elementor-editor-element-setting elementor-editor-element-edit">
                        <a href="#" title="<?php echo Translater::get()->l( 'Edit Widget', 'elementor' ); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l( 'Edit', 'elementor' ); ?></span>
                            <i class="fa fa-pencil"></i>
                        </a>
                    </li>
                    */ ?>
                    <li class="elementor-editor-element-setting elementor-editor-element-duplicate">
                        <a href="#" title="<?php echo Translater::get()->l('Duplicate Widget'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Duplicate'); ?></span>
                            <i class="fa fa-copy"></i>
                        </a>
                    </li>
                    <li class="elementor-editor-element-setting elementor-editor-element-remove">
                        <a href="#" title="<?php echo Translater::get()->l('Remove Widget'); ?>">
                            <span class="elementor-screen-only"><?php echo Translater::get()->l('Remove'); ?></span>
                            <i class="fa fa-trash-o"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php
    }

    public function addGroupControl(string $group_name, array $args = []): void
    {
        switch ($group_name) {
            case 'background':
                $control = new Background();
                $control->addControls($this, $args);

                return;
            case 'border':
                $control = new Border();
                $control->addControls($this, $args);

                return;
            case 'typography':
                $control = new Typography();
                $control->addControls($this, $args);

                return;
            case 'image-size':
                $control = new ImageSize();
                $control->addControls($this, $args);

                return;
            case 'box-shadow':
                $control = new BoxShadow();
                $control->addControls($this, $args);

                return;

            case 'text-shadow':
                $control = new TextShadow();
                $control->addControls($this, $args);

                return;

            case 'image':
                $control = new Image();
                $control->addControls($this, $args);

                return;
        }
    }

    public function addResponsiveControl(string $id, array $args = []): void
    {
        // Desktop
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '');
        }

        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['desktop'];
        }

        $control_args['responsive'] = self::RESPONSIVE_DESKTOP;

        if (!empty($args['condition'])) {
            $this->iqitValidateConditionKeys($args['condition'], $id);
        }

        $this->addControl(
            $id,
            $control_args
        );

        // Tablet
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '-' . self::RESPONSIVE_TABLET);
        }
        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['tablet'];
        }

        $control_args['responsive'] = self::RESPONSIVE_TABLET;

        if (!empty($args['condition'])) {
            $control_args['condition'] = $this->iqitBuildResponsiveCondition($args['condition'], self::RESPONSIVE_TABLET);
            $this->iqitValidateConditionKeys($control_args['condition'], $id . '_tablet');
        }

        $this->addControl(
            $id . '_tablet',
            $control_args
        );

        // Mobile
        $control_args = $args;

        if (!empty($args['prefix_class'])) {
            $control_args['prefix_class'] = sprintf($args['prefix_class'], '-' . self::RESPONSIVE_MOBILE);
        }

        if (!empty($args['responsive_default'])) {
            $control_args['default'] = $args['responsive_default']['mobile'];
        }

        $control_args['responsive'] = self::RESPONSIVE_MOBILE;

        if (!empty($args['condition'])) {
            $control_args['condition'] = $this->iqitBuildResponsiveCondition($args['condition'], self::RESPONSIVE_MOBILE);
            $this->iqitValidateConditionKeys($control_args['condition'], $id . '_mobile');
        }

        $this->addControl(
            $id . '_mobile',
            $control_args
        );
    }

    /**
     * Duplique une condition "desktop" vers le device demandé.
     * Pour chaque clé "field" (ou "field[sub]" ou "field!"), on tente:
     * - si un control "field_{device}" existe => on pointe dessus
     * - sinon on garde "field" (fallback)
     */
    protected function iqitBuildResponsiveCondition(array $conditions, string $device): array
    {
        $out = [];

        foreach ($conditions as $condition_key => $condition_value) {
            if (!is_string($condition_key)) {
                $out[$condition_key] = $condition_value;
                continue;
            }

            // key = field, field[sub], field!
            preg_match('/([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i', $condition_key, $parts);
            $field = $parts[1] ?? $condition_key;
            $sub = $parts[2] ?? null;
            $neg = $parts[3] ?? '';

            // Ne pas re-suffixer si déjà responsive
            $responsive_field = preg_match('/_(tablet|mobile)$/i', $field) ? $field : ($field . '_' . $device);

            // Si la version responsive n'existe pas, fallback sur la desktop
            if (!isset($this->controls[$responsive_field]) && isset($this->controls[$field])) {
                $responsive_field = $field;
            }

            $new_key = $responsive_field;
            if ($sub) {
                $new_key .= '[' . $sub . ']';
            }
            $new_key .= $neg;

            $out[$new_key] = $condition_value;
        }

        return $out;
    }

    /**
     * Valide que les clés référencées dans 'condition' existent dans les controls.
     * (accepte naturellement les variantes responsive *_tablet / *_mobile si elles existent)
     */
    protected function iqitValidateConditionKeys(array $conditions, string $control_id_for_error): void
    {
        foreach ($conditions as $condition_key => $condition_value) {
            if (!is_string($condition_key)) {
                continue;
            }

            preg_match('/([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i', $condition_key, $condition_key_parts);
            $pure_condition_key = $condition_key_parts[1] ?? $condition_key;

            if (!isset($this->controls[$pure_condition_key])) {
                Helper::triggerError(
                    sprintf(
                        'Condition key "%s" not found in element instance in control %s.',
                        $pure_condition_key,
                        $control_id_for_error
                    )
                );
            }
        }
    }

    /**
     * Helper method to get std value on all items.
     */
    protected function getDefaultValues(): array
    {
        $defaults = [];

        foreach ($this->getControls() as $control) {
            $defaults[$control['name']] = $control['default'];
        }

        return $defaults;
    }

    public function getParseValues(array $instance = []): array
    {
        foreach ($this->getControls() as $control) {
            $control_obj = Plugin::instance()->controlsManager->getControl($control['type']);
            if (!$control_obj) {
                continue;
            }

            $instance[$control['name']] = $control_obj->getValue($control, $instance);
        }

        return $instance;
    }

    public function getData(): array
    {
        return [
            'title' => $this->getTitle(),
            'controls' => $this->getControls(),
            'tabs_controls' => $this->getTabsControls(),
            'categories' => $this->getCategories(),
            'keywords' => $this->getKeywords(),
            'icon' => $this->getIcon(),
        ];
    }

    public function addControl(string $id, array $args): bool
    {
        $default_args = [
            'default' => '',
            'type' => ControlManager::TEXT,
            'tab' => self::TAB_CONTENT,
            'save_empty_value' => false
        ];

        $args['name'] = $id;
        $args = array_merge($default_args, $args);

        if (isset($this->controls[$id])) {
            Helper::doingItWrong(__CLASS__ . '::' . __FUNCTION__, 'Cannot redeclare control with same name. - ' . $id, '1.0.0');

            return false;
        }

        if ($args['type'] !== ControlManager::SECTION) {
            if (null !== $this->currentSection) {
                $args = array_merge($args, $this->currentSection);
            } elseif (empty($args['section'])) {
                Helper::doingItWrong(__CLASS__ . '::' . __FUNCTION__ . ': Cannot add a control outside a section (use `startControlsSection`).');
            }
        }

        // If we are currently inside a tabs wrapper / tab, attach inner_tab & tabs_wrapper
        if (null !== $this->current_tab
            && !empty($this->current_tab['inner_tab'])
            && !in_array($args['type'], [ControlManager::TABS, ControlManager::TAB], true)
        ) {
            // The control belongs to the currently open inner tab
            $args['inner_tab'] = $this->current_tab['inner_tab'];
            $args['tabs_wrapper'] = $this->current_tab['tabs_wrapper'];
        }

        $available_tabs = $this->getAvailableTabsControls();
        if (!isset($available_tabs[$args['tab']])) {
            $args['tab'] = $default_args['tab'];
        }
        $this->tabsControls[$args['tab']] = $available_tabs[$args['tab']];

        // Handle popover: if we're inside a popover and it hasn't been initialized,
        // mark this control as the start of the popover
        if ($this->current_popover && !$this->current_popover['initialized']) {
            $args['popover'] = [
                'start' => true,
            ];
            $this->current_popover['initialized'] = true;
        }

        $this->controls[$id] = array_merge($default_args, $args);

        return true;
    }

    public function updateControl(string $id, array $args): bool
    {
        if (!isset($this->controls[$id])) {
            Helper::doingItWrong(__CLASS__ . '::' . __FUNCTION__, 'Cannot update non-existing control. - ' . $id, '1.0.0');

            return false;
        }

        $this->controls[$id] = array_merge($this->controls[$id], $args);

        return true;
    }

    public function removeControl(string $id): void
    {
        unset($this->controls[$id]);
    }

    public function getControls(): array
    {
        return array_values($this->controls);
    }

    /**
     * @return array|null
     */
    public function getControl(string $id)
    {
        return $this->controls[$id] ?? null;
    }

    public function getControlsForCss(): array
    {
        return $this->controls;
    }

    public function getStyleControls(): array
    {
        return array_filter($this->getControls(), function ($control) {
            return !empty($control['selectors']);
        });
    }

    public function getClassControls(): array
    {
        return array_filter($this->getControls(), function ($control) {
            return isset($control['prefix_class']);
        });
    }

    public function isControlVisible(array $element_instance, array $control): bool
    {
        if (empty($control['condition'])) {
            return true;
        }

        foreach ($control['condition'] as $condition_key => $condition_value) {
            preg_match('/([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i', $condition_key, $condition_key_parts);

            $pure_condition_key = $condition_key_parts[1];
            $condition_sub_key = $condition_key_parts[2];
            $is_negative_condition = (bool)$condition_key_parts[3];

            if (!isset($element_instance[$pure_condition_key])) {
                Helper::triggerError(
                    sprintf(
                        'Condition key "%s" not found in element instance in control %s.',
                        $pure_condition_key,
                        $control['name']
                    )
                );
            }

            $instance_value = $element_instance[$pure_condition_key];

            if ($condition_sub_key) {
                if (!isset($instance_value[$condition_sub_key])) {
                    return false;
                }

                $instance_value = $instance_value[$condition_sub_key];
            }

            $is_contains = is_array($condition_value) ? in_array($instance_value, $condition_value) : $instance_value === $condition_value;

            if ($is_negative_condition && $is_contains || !$is_negative_condition && !$is_contains) {
                return false;
            }
        }

        return true;
    }

    protected function beforeRegisterControls(): void
    {
    }

    protected function afterRegisterControls(): void
    {
    }

    /**
     * @param string|array $value
     */
    public function addRenderAttribute(string $element, string $key, $value): void
    {
        if (empty($this->renderAttributes[$element][$key])) {
            $this->renderAttributes[$element][$key] = [];
        }

        $this->renderAttributes[$element][$key] = array_merge($this->renderAttributes[$element][$key], (array)$value);
    }

    public function getRenderAttributeString(string $element): string
    {
        if (empty($this->renderAttributes[$element])) {
            return '';
        }

        $render_attributes = $this->renderAttributes[$element];

        $attributes = [];
        foreach ($render_attributes as $attribute_key => $attribute_values) {
            $attributes[] = sprintf('%s="%s"', $attribute_key, Helper::escAttr(implode(' ', $attribute_values)));
        }

        unset($this->renderAttributes[$element]);

        return implode(' ', $attributes);
    }

    public function printTemplate(): void
    {
        $contentTemplate = OutputHelper::capture(function () {
            $this->contentTemplate();
        });

        if (empty($contentTemplate)) {
            return;
        }
        ?>
        <script type="text/html" id="tmpl-elementor-<?php echo $this->getType(); ?>-<?php echo Helper::escAttr($this->getId()); ?>-content">
            <?php $this->renderSettings(); ?>
            <?php echo $contentTemplate; ?>
        </script>
        <?php
    }

    public function startControlsSection(string $id, array $args): void
    {
        $args['type'] = ControlManager::SECTION;

        $this->addControl($id, $args);

        if (null !== $this->currentSection) {
            throw new \RuntimeException(sprintf('Elementor: You can\'t start a section before the end of the previous section: `%s`', $this->currentSection['section']));
        }

        $this->currentSection = [
            'section' => $id,
            'tab' => $this->controls[$id]['tab'],
        ];
    }

    public function endControlsSection(): void
    {
        $this->currentSection = null;
    }

    public function __construct(array $args = [])
    {
        $this->beforeRegisterControls();
        $this->registerControls();
        $this->afterRegisterControls();
    }

    /**
     * @return array|null
     */
    public function getCurrentTab()
    {
        return $this->current_tab;
    }

    public function startControlsTab(string $tab_id, array $args): void
    {
        if (!empty($this->current_tab['inner_tab'])) {
            throw new \RuntimeException(sprintf('Elementor: You can\'t start a tab before the end of the previous tab "%s".', $this->current_tab['inner_tab']));
        }

        $args['type'] = ControlManager::TAB;
        $args['tabs_wrapper'] = $this->current_tab['tabs_wrapper'];

        $this->addControl($tab_id, $args);

        $this->current_tab['inner_tab'] = $tab_id;

        /*if ($this->injection_point) {
            $this->injection_point['tab']['inner_tab'] = $this->current_tab['inner_tab'];
        }*/
    }

    public function startControlsTabs(string $tabs_id, array $args = []): void
    {
        if (null !== $this->current_tab) {
            throw new \RuntimeException(sprintf('Elementor: You can\'t start tabs before the end of the previous tabs "%s".', $this->current_tab['tabs_wrapper']));
        }

        $args['type'] = ControlManager::TABS;

        $this->addControl($tabs_id, $args);

        $this->current_tab = ['tabs_wrapper' => $tabs_id,];

        foreach (['condition', 'conditions'] as $key) {
            if (!empty($args[$key])) {
                $this->current_tab[$key] = $args[$key];
            }
        }

        /*if ($this->injection_point) {
            $this->injection_point['tab'] = $this->current_tab;
        }*/
    }


    public function endControlsTabs(): void
    {
        $this->current_tab = null;
    }

    public function endControlsTab(): void
    {
        unset($this->current_tab['inner_tab']);
    }

    /**
     * Start popover.
     *
     * Used to add a new set of controls in a popover. When you use this method,
     * all the registered controls from this point will be assigned to this
     * popover, until you close the popover using `endPopover()` method.
     *
     * This method should be used inside `registerControls()`.
     */
    final public function startPopover(): void
    {
        $this->current_popover = [
            'initialized' => false,
        ];
    }

    /**
     * End popover.
     *
     * Used to close an open popover. When you use this method it stops
     * assigning controls to the popover.
     *
     * This method should be used inside `registerControls()`.
     */
    final public function endPopover(): void
    {
        $this->current_popover = null;

        // Get the last control key
        $control_keys = array_keys($this->controls);
        if (empty($control_keys)) {
            return;
        }

        $last_control_key = end($control_keys);

        // Mark the last control as end of popover
        $this->controls[$last_control_key]['popover'] = array_merge(
            $this->controls[$last_control_key]['popover'] ?? [],
            ['end' => true]
        );
    }

    /**
     * @return array|null
     */
    public function getCurrentPopover()
    {
        return $this->current_popover;
    }

}
