<?php
namespace IqitElementor\Widget;
use IqitElementor\Base\WidgetBase;
use IqitElementor\Helper\Translater;
use IqitElementor\Manager\ControlManager;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class Countdown extends WidgetBase
{
    /**
     * @var \Context
     */
    protected $context;

    protected $defaultCountdownLabels = [];

    public function __construct($data = [], $args = null)
    {
        $this->context = \Context::getContext();
        parent::__construct($data, $args);
    }

    public function getId(): string
    {
        return 'countdown';
    }

    public function getTitle(): string
    {
        return Translater::get()->l('Countdown');
    }

    public function getIcon(): string
    {
        return 'countdown';
    }

    public function getKeywords(): array
    {
        return ['countdown', 'number', 'timer', 'time', 'date'];
    }

    /**
     * Controls
     */
    protected function registerControls(): void
    {
        // SECTION : Countdown (contenu)
        $this->addControl(
            'section_countdown',
            [
                'label' => Translater::get()->l('Countdown'),
                'type' => 'section',
            ]
        );

        $this->addControl(
            'due_date',
            [
                'label' => Translater::get()->l('Due Date'),
                'type' => ControlManager::DATETIME,
                'dynamic' => [
                    'active' => true,
                ],
                'default' => date('Y-m-d H:i', strtotime('+1 month')),
                'section' => 'section_countdown',
            ]
        );

        // Unités à afficher
        $this->addControl(
            'show_days',
            [
                'label' => Translater::get()->l('Days'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'show_hours',
            [
                'label' => Translater::get()->l('Hours'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'show_minutes',
            [
                'label' => Translater::get()->l('Minutes'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'show_seconds',
            [
                'label' => Translater::get()->l('Seconds'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'default' => 'yes',
                'section' => 'section_countdown',
            ]
        );

        // Affichage des labels + labels custom
        $this->addControl(
            'show_labels',
            [
                'label' => Translater::get()->l('Show Label'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Show'),
                'label_off' => Translater::get()->l('Hide'),
                'default' => 'yes',
                'separator' => 'before',
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'custom_labels',
            [
                'label' => Translater::get()->l('Custom Labels'),
                'type' => 'switcher',
                'label_on' => Translater::get()->l('Yes'),
                'label_off' => Translater::get()->l('No'),
                'default' => '',
                'condition' => [
                    'show_labels!' => '',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'label_days',
            [
                'label' => Translater::get()->l('Days'),
                'type' => 'text',
                'default' => Translater::get()->l('Days'),
                'placeholder' => Translater::get()->l('Days'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_days' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'label_hours',
            [
                'label' => Translater::get()->l('Hours'),
                'type' => 'text',
                'default' => Translater::get()->l('Hours'),
                'placeholder' => Translater::get()->l('Hours'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_hours' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'label_minutes',
            [
                'label' => Translater::get()->l('Minutes'),
                'type' => 'text',
                'default' => Translater::get()->l('Minutes'),
                'placeholder' => Translater::get()->l('Minutes'),
                'condition' => [
                    'show_labels!' => '',
                    'custom_labels!' => '',
                    'show_minutes' => 'yes',
                ],
                'section' => 'section_countdown',
            ]
        );

        $this->addControl(
            'label_seconds',
            [
                'label' => Translater::get()->l('Seconds'),
                'type' => 'text',
                'default' => Translater::get()->l('Seconds'),
                'placeholder' => Translater::get()->l('Seconds'),
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
    protected function getDefaultCountdownLabels(): array
    {
        if (!$this->defaultCountdownLabels) {
            $this->defaultCountdownLabels = [
                'label_days' => Translater::get()->l('Days'),
                'label_hours' => Translater::get()->l('Hours'),
                'label_minutes' => Translater::get()->l('Minutes'),
                'label_seconds' => Translater::get()->l('Seconds'),
            ];
        }

        return $this->defaultCountdownLabels;
    }

    protected function renderCountdownItem(array &$settings, string $label_key, string $part_class): string
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

    protected function getStrftime(array &$settings): string
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
     */
    protected function render(array $instance = []): void
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

    public function renderPlainContent(array $instance = []): void
    {
    }
}
