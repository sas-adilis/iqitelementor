<?php
namespace Elementor;

if (!defined('_PS_VERSION_')) {
    exit;
}

class Widget_Countdown extends Widget_Base
{
    /**
     * @var \Context
     */
    protected $context;

    protected $_default_countdown_labels = [];

    public function __construct($data = [], $args = null)
    {
        $this->context = \Context::getContext();
        parent::__construct($data, $args);
    }

    public function get_id()
    {
        return 'countdown';
    }

    public function get_title()
    {
        return \IqitElementorWpHelper::__('Countdown', 'elementor');
    }

    public function get_icon()
    {
        return 'countdown';
    }

    public function get_keywords()
    {
        return ['countdown', 'number', 'timer', 'time', 'date'];
    }

    /**
     * Controls
     */
    protected function _register_controls()
    {
        // SECTION : Countdown (contenu)
        $this->add_control(
            'section_countdown',
            [
                'label' => \IqitElementorWpHelper::__('Countdown', 'elementor'),
                'type' => 'section',
            ]
        );

        $this->add_control(
            'due_date',
            [
                'label' => \IqitElementorWpHelper::__('Due Date', 'elementor'),
                'type' => Controls_Manager::DATETIME,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => date('Y-m-d H:i', strtotime('+1 month')),
                'section' => 'section_countdown',
            ]
        );

        // Unités à afficher
        $this->add_control(
            'show_days',
            [
                'label' => \IqitElementorWpHelper::__('Days', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'show_hours',
            [
                'label' => \IqitElementorWpHelper::__('Hours', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'show_minutes',
            [
                'label' => \IqitElementorWpHelper::__('Minutes', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'show_seconds',
            [
                'label' => \IqitElementorWpHelper::__('Seconds', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        // Affichage des labels + labels custom
        $this->add_control(
            'show_labels',
            [
                'label' => \IqitElementorWpHelper::__('Show Label', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Show', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('Hide', 'elementor'),
                'default' => 'yes',
                'separator' => 'before',
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'custom_labels',
            [
                'label' => \IqitElementorWpHelper::__('Custom Labels', 'elementor'),
                'type' => 'switcher',
                'label_on' => \IqitElementorWpHelper::__('Yes', 'elementor'),
                'label_off' => \IqitElementorWpHelper::__('No', 'elementor'),
                'default' => '',
                'condition' => [
                    'show_labels!' => '',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'label_days',
            [
                'label' => \IqitElementorWpHelper::__('Days', 'elementor'),
                'type' => 'text',
                'default' => \IqitElementorWpHelper::__('Days', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Days', 'elementor'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_days' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'label_hours',
            [
                'label' => \IqitElementorWpHelper::__('Hours', 'elementor'),
                'type' => 'text',
                'default' => \IqitElementorWpHelper::__('Hours', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Hours', 'elementor'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_hours' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'label_minutes',
            [
                'label' => \IqitElementorWpHelper::__('Minutes', 'elementor'),
                'type' => 'text',
                'default' => \IqitElementorWpHelper::__('Minutes', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Minutes', 'elementor'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_minutes' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->add_control(
            'label_seconds',
            [
                'label' => \IqitElementorWpHelper::__('Seconds', 'elementor'),
                'type' => 'text',
                'default' => \IqitElementorWpHelper::__('Seconds', 'elementor'),
                'placeholder' => \IqitElementorWpHelper::__('Seconds', 'elementor'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_seconds' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );
    }

    /**
     * Helpers
     */
    protected function getDefaultCountdownLabels()
    {
        if (!$this->_default_countdown_labels) {
            $this->_default_countdown_labels = [
                'label_days' => \IqitElementorWpHelper::__('Days', 'elementor'),
                'label_hours' => \IqitElementorWpHelper::__('Hours', 'elementor'),
                'label_minutes' => \IqitElementorWpHelper::__('Minutes', 'elementor'),
                'label_seconds' => \IqitElementorWpHelper::__('Seconds', 'elementor'),
            ];
        }

        return $this->_default_countdown_labels;
    }

    protected function renderCountdownItem(&$settings, $label_key, $part_class): string
    {
        $string = '<div class="elementor-countdown-item">'
            . '<span class="elementor-countdown-digits ' . $part_class . '"></span>';

        if (!empty($settings['show_labels'])) {
            $default_labels = $this->getDefaultCountdownLabels();
            $label = (!empty($settings['custom_labels']) && !empty($settings[$label_key]))
                ? $settings[$label_key]
                : $default_labels[$label_key];
            $string .= ' <span class="elementor-countdown-label">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</span>';
        }

        $string .= '</div>';

        return $string;
    }

    protected function getStrftime(&$settings): string
    {
        $string = '';

        if (!empty($settings['show_days'])) {
            $string .= $this->renderCountdownItem($settings, 'label_days', 'elementor-countdown-days');
        }
        if (!empty($settings['show_hours'])) {
            $string .= $this->renderCountdownItem($settings, 'label_hours', 'elementor-countdown-hours');
        }
        if (!empty($settings['show_minutes'])) {
            $string .= $this->renderCountdownItem($settings, 'label_minutes', 'elementor-countdown-minutes');
        }
        if (!empty($settings['show_seconds'])) {
            $string .= $this->renderCountdownItem($settings, 'label_seconds', 'elementor-countdown-seconds');
        }

        return $string;
    }

    /**
     * Rendu front + éditeur
     *
     * @param array $instance
     */
    protected function render($instance = [])
    {
        $settings = $instance;

        // Data pour le JS
        $date = !empty($settings['due_date']) ? strtotime($settings['due_date']) : 0;
        ?>
        <div class="elementor-countdown-wrapper"
             data-date="<?php echo (int) $date; ?>">
            <?php echo $this->getStrftime($settings); ?>
        </div>
        <?php
    }

    public function render_plain_content($instance = [])
    {
    }
}
