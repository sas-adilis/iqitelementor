<?php

namespace Elementor;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly

class Controls_Manager
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

    public const WP_WIDGET = 'wp_widget';

    public const URL = 'url';
    public const REPEATER = 'repeater';
    public const ICON = 'icon';
    public const GALLERY = 'gallery';
    public const STRUCTURE = 'structure';
    public const SELECT2 = 'select2';
    public const BOX_SHADOW = 'box_shadow';
    public const ANIMATION = 'animation';
    public const HOVER_ANIMATION = 'hover_animation';
    public const TEXT_SHADOW = 'text_shadow';

    /**
     * @var Control_Base[]
     */
    private $_controls = [];

    /**
     * @var Group_Control_Base[]
     */
    private $_group_controls = [];

    /**
     * @since 1.0.0
     */
    public function register_controls()
    {
        include 'controls/base.php';
        include 'controls/base-multiple.php';
        include 'controls/base-units.php';

        $available_controls = [
            self::TEXT,
            self::NUMBER,
            self::TEXTAREA,
            self::SELECT,
            self::SELECT_BIG,
            self::SELECT_SORT,
            self::AUTOCOMPLETE_PRODUCTS,
            self::AUTOCOMPLETE_POSTS,
            self::MODULES,
            self::CHECKBOX,
            self::SWITCHER,
            self::CHECKBOX_LIST,
            self::DATETIME,

            self::HIDDEN,
            self::HEADING,
            self::RAW_HTML,
            self::SECTION,
            self::DIVIDER,

            self::COLOR,
            self::MEDIA,
            self::SLIDER,
            self::DIMENSIONS,
            self::CHOOSE,
            self::WYSIWYG,
            self::CODE,
            self::FONT,
            self::IMAGE_DIMENSIONS,

            self::WP_WIDGET,

            self::URL,
            self::REPEATER,
            self::ICON,
            self::GALLERY,
            self::STRUCTURE,
            self::SELECT2,
            self::BOX_SHADOW,
            self::TEXT_SHADOW,
            self::ANIMATION,
            self::HOVER_ANIMATION,

            self::TABS,
            self::TAB,
        ];

        foreach ($available_controls as $control_id) {
            $control_filename = str_replace('_', '-', $control_id);
            $control_filename = "controls/{$control_filename}.php";
            include $control_filename;

            $class_name = __NAMESPACE__ . '\Control_' . ucwords($control_id);
            $this->register_control($control_id, $class_name);
        }

        // Group Controls
        include ELEMENTOR_PATH . 'includes/interfaces/group-control.php';
        include 'controls/groups/base.php';

        include 'controls/groups/background.php';
        include 'controls/groups/border.php';
        include 'controls/groups/typography.php';
        include 'controls/groups/image-size.php';
        include 'controls/groups/box-shadow.php';
        include 'controls/groups/image.php';
        include 'controls/groups/text-shadow.php';

        $this->_group_controls['background'] = new Group_Control_Background();
        $this->_group_controls['border'] = new Group_Control_Border();
        $this->_group_controls['typography'] = new Group_Control_Typography();
        $this->_group_controls['image-size'] = new Group_Control_Image_Size();
        $this->_group_controls['box-shadow'] = new Group_Control_Box_Shadow();
        $this->_group_controls['image'] = new Group_Control_Image();
        $this->_group_controls['text-shadow'] = new Group_Control_Text_Shadow();
    }

    /**
     * @param $control_id
     * @param $class_name
     *
     * @return bool|string
     * @since 1.0.0
     *
     */
    public function register_control($control_id, $class_name)
    {
        if (!class_exists($class_name)) {
            return \IqitElementorHelper::triggerError(sprintf('element_class_name_not_exists: %s', $class_name));
        }
        $instance_control = new $class_name();

        if (!$instance_control instanceof Control_Base) {
            return \IqitElementorHelper::triggerError('wrong_instance_control');
        }
        $this->_controls[$control_id] = $instance_control;

        return true;
    }

    /**
     * @param $control_id
     *
     * @return bool
     * @since 1.0.0
     *
     */
    public function unregister_control($control_id)
    {
        if (!isset($this->_controls[$control_id])) {
            return false;
        }
        unset($this->_controls[$control_id]);

        return true;
    }

    /**
     * @return Control_Base[]
     * @since 1.0.0
     *
     */
    public function get_controls()
    {
        return $this->_controls;
    }

    /**
     * @param $control_id
     *
     * @return bool|Control_Base
     * @since 1.0.0
     *
     */
    public function get_control($control_id)
    {
        $controls = $this->get_controls();

        return isset($controls[$control_id]) ? $controls[$control_id] : false;
    }

    /**
     * @return array
     * @since 1.0.0
     *
     */
    public function get_controls_data()
    {
        $controls_data = [];

        foreach ($this->get_controls() as $name => $control) {
            $controls_data[$name] = $control->get_settings();
            $controls_data[$name]['default_value'] = $control->get_default_value();
        }

        return $controls_data;
    }

    /**
     * @return void
     * @since 1.0.0
     *
     */
    public function render_controls()
    {
        foreach ($this->get_controls() as $control) {
            $control->print_template();
        }
    }

    /**
     * @return Group_Control_Base[]
     * @since 1.0.0
     *
     */
    public function get_group_controls()
    {
        return $this->_group_controls;
    }

    /**
     * @return void
     * @since 1.0.0
     *
     */
    public function enqueue_control_scripts()
    {
        foreach ($this->get_controls() as $control) {
            $control->enqueue();
        }
    }

    /**
     * Controls_Manager constructor.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->register_controls();
    }
}
