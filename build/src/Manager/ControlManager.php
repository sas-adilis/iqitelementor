<?php

namespace IqitElementor\Manager;

use IqitElementor\Base\ControlBase;
use IqitElementor\Base\GroupControlBase;
use IqitElementor\Helper\Helper;
use IqitElementor\Control\Animation;
use IqitElementor\Control\AutocompletePosts;
use IqitElementor\Control\AutocompleteProducts;
use IqitElementor\Control\BoxShadow;
use IqitElementor\Control\Checkbox;
use IqitElementor\Control\CheckboxList;
use IqitElementor\Control\Choose;
use IqitElementor\Control\Code;
use IqitElementor\Control\Color;
use IqitElementor\Control\ColorHover;
use IqitElementor\Control\DateTime;
use IqitElementor\Control\Dimensions;
use IqitElementor\Control\Divider;
use IqitElementor\Control\Font;
use IqitElementor\Control\Gallery;
use IqitElementor\Control\Heading;
use IqitElementor\Control\Hidden;
use IqitElementor\Control\HoverAnimation;
use IqitElementor\Control\Icon;
use IqitElementor\Control\ImageDimensions;
use IqitElementor\Control\Media;
use IqitElementor\Control\Modules;
use IqitElementor\Control\Number;
use IqitElementor\Control\PopoverToggle;
use IqitElementor\Control\RawHtml;
use IqitElementor\Control\Repeater;
use IqitElementor\Control\Section;
use IqitElementor\Control\Select;
use IqitElementor\Control\Select2;
use IqitElementor\Control\SelectBig;
use IqitElementor\Control\SelectSort;
use IqitElementor\Control\Slider;
use IqitElementor\Control\Switcher;
use IqitElementor\Control\Tab;
use IqitElementor\Control\Tabs;
use IqitElementor\Control\Text;
use IqitElementor\Control\TextShadow;
use IqitElementor\Control\Textarea;
use IqitElementor\Control\URL;
use IqitElementor\Control\Wysiwyg;
use IqitElementor\Control\Group\Background;
use IqitElementor\Control\Group\Border;
use IqitElementor\Control\Group\Typography;
use IqitElementor\Control\Group\ImageSize;
use IqitElementor\Control\Group\BoxShadow as GroupBoxShadow;
use IqitElementor\Control\Group\Image;
use IqitElementor\Control\Group\TextShadow as GroupTextShadow;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class ControlManager
{
    public const TEXT = 'text';
    public const NUMBER = 'number';
    public const TEXTAREA = 'textarea';
    public const SELECT = 'select';
    public const SELECT_BIG = 'select_big';
    public const SELECT_SORT = 'select_sort';
    public const AUTOCOMPLETE_PRODUCTS = 'autocomplete_products';
    public const AUTOCOMPLETE_POSTS = 'autocomplete_posts';
    public const MODULES = 'modules';
    public const CHECKBOX = 'checkbox';
    public const SWITCHER = 'switcher';
    public const CHECKBOX_LIST = 'checkbox_list';
    public const DATETIME = 'datetime';

    public const HIDDEN = 'hidden';
    public const HEADING = 'heading';
    public const RAW_HTML = 'raw_html';
    public const SECTION = 'section';
    public const DIVIDER = 'divider';

    public const COLOR = 'color';
    public const MEDIA = 'media';
    public const SLIDER = 'slider';
    public const DIMENSIONS = 'dimensions';
    public const CHOOSE = 'choose';
    public const WYSIWYG = 'wysiwyg';
    public const CODE = 'code';
    public const FONT = 'font';
    public const IMAGE_DIMENSIONS = 'image_dimensions';
    public const TAB = 'tab';
    public const TABS = 'tabs';

    public const URL = 'url';
    public const REPEATER = 'repeater';
    public const ICON = 'icon';
    public const GALLERY = 'gallery';
    public const SELECT2 = 'select2';
    public const BOX_SHADOW = 'box_shadow';
    public const ANIMATION = 'animation';
    public const HOVER_ANIMATION = 'hover_animation';
    public const TEXT_SHADOW = 'text_shadow';
    public const POPOVER_TOGGLE = 'popover_toggle';

    /**
     * @var ControlBase[]
     */
    private $controls = [];

    /**
     * @var GroupControlBase[]
     */
    private $groupControls = [];

    /**
     * Maps control type constants to their class names.
     *
     * @var array<string, string>
     */
    private static $controlMap = [
        self::TEXT => Text::class,
        self::NUMBER => Number::class,
        self::TEXTAREA => Textarea::class,
        self::SELECT => Select::class,
        self::SELECT_BIG => SelectBig::class,
        self::SELECT_SORT => SelectSort::class,
        self::AUTOCOMPLETE_PRODUCTS => AutocompleteProducts::class,
        self::AUTOCOMPLETE_POSTS => AutocompletePosts::class,
        self::MODULES => Modules::class,
        self::CHECKBOX => Checkbox::class,
        self::SWITCHER => Switcher::class,
        self::CHECKBOX_LIST => CheckboxList::class,
        self::DATETIME => DateTime::class,
        self::HIDDEN => Hidden::class,
        self::HEADING => Heading::class,
        self::RAW_HTML => RawHtml::class,
        self::SECTION => Section::class,
        self::DIVIDER => Divider::class,
        self::COLOR => Color::class,
        self::MEDIA => Media::class,
        self::SLIDER => Slider::class,
        self::DIMENSIONS => Dimensions::class,
        self::CHOOSE => Choose::class,
        self::WYSIWYG => Wysiwyg::class,
        self::CODE => Code::class,
        self::FONT => Font::class,
        self::IMAGE_DIMENSIONS => ImageDimensions::class,
        self::URL => URL::class,
        self::REPEATER => Repeater::class,
        self::ICON => Icon::class,
        self::GALLERY => Gallery::class,
        self::SELECT2 => Select2::class,
        self::BOX_SHADOW => BoxShadow::class,
        self::TEXT_SHADOW => TextShadow::class,
        self::ANIMATION => Animation::class,
        self::HOVER_ANIMATION => HoverAnimation::class,
        self::TABS => Tabs::class,
        self::TAB => Tab::class,
        self::POPOVER_TOGGLE => PopoverToggle::class,
    ];

    public function registerControls(): void
    {
        foreach (self::$controlMap as $control_id => $class_name) {
            $this->registerControl($control_id, $class_name);
        }

        // Group Controls
        $this->groupControls['background'] = new Background();
        $this->groupControls['border'] = new Border();
        $this->groupControls['typography'] = new Typography();
        $this->groupControls['image-size'] = new ImageSize();
        $this->groupControls['box-shadow'] = new GroupBoxShadow();
        $this->groupControls['image'] = new Image();
        $this->groupControls['text-shadow'] = new GroupTextShadow();
    }

    public function registerControl(string $control_id, string $class_name): bool
    {
        if (!class_exists($class_name)) {
            Helper::triggerError(sprintf('element_class_name_not_exists: %s', $class_name));
        }
        $instance_control = new $class_name();

        if (!$instance_control instanceof ControlBase) {
            Helper::triggerError('wrong_instance_control');
        }
        $this->controls[$control_id] = $instance_control;

        return true;
    }

    public function unregisterControl(string $control_id): bool
    {
        if (!isset($this->controls[$control_id])) {
            return false;
        }
        unset($this->controls[$control_id]);

        return true;
    }

    /**
     * @return ControlBase[]
     */
    public function getControls(): array
    {
        return $this->controls;
    }

    /**
     * @return ControlBase|false
     */
    public function getControl(string $control_id)
    {
        $controls = $this->getControls();

        return isset($controls[$control_id]) ? $controls[$control_id] : false;
    }

    public function getControlsData(): array
    {
        $controls_data = [];

        foreach ($this->getControls() as $name => $control) {
            $controls_data[$name] = $control->getSettings();
            $controls_data[$name]['default_value'] = $control->getDefaultValue();
        }

        return $controls_data;
    }

    public function renderControls(): void
    {
        foreach ($this->getControls() as $control) {
            $control->printTemplate();
        }
    }

    /**
     * @return GroupControlBase[]
     */
    public function getGroupControls(): array
    {
        return $this->groupControls;
    }

    public function __construct()
    {
        $this->registerControls();
    }
}
