<?php

namespace IqitElementor\BackOffice;

/**
 * Adds Elementor columns to back-office listing grids (CMS pages, blog posts).
 */
class GridIntegration
{
    /** @var \Context */
    private $context;

    /** @var string */
    private $modulePath;

    public function __construct(\Context $context, string $modulePath)
    {
        $this->context = $context;
        $this->modulePath = $modulePath;
    }

    /**
     * Add an "Elementor" HTML column definition to the CMS pages grid.
     */
    public function addCmsGridColumn(array $params): void
    {
        /** @var \PrestaShop\PrestaShop\Core\Grid\Definition\GridDefinitionInterface $definition */
        $definition = $params['definition'];

        $definition->getColumns()->addBefore(
            'actions',
            (new \PrestaShop\PrestaShop\Core\Grid\Column\Type\Common\HtmlColumn('elementor_link'))
                ->setName('Elementor')
                ->setOptions([
                    'field' => 'elementor_link',
                    'clickable' => false,
                    'sortable' => false,
                ])
        );
    }

    /**
     * Populate the "Elementor" column with an icon linking to the editor.
     */
    public function populateCmsGridColumn(array &$params): void
    {
        $baseUrl = $this->context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=cms&contentType=default&newContent=0&idLang='
            . (int) $this->context->language->id;
        $logoUrl = $this->modulePath . 'logo.png';

        $records = $params['data']->getRecords()->all();

        foreach ($records as &$record) {
            $url = $baseUrl . '&pageId=' . (int) $record['id_cms'];
            $record['elementor_link'] = '<a href="' . htmlspecialchars($url) . '" '
                . 'title="Edit with Elementor" class="elementor-grid-link">'
                . '<img src="' . htmlspecialchars($logoUrl) . '" alt="Elementor" class="elementor-grid-logo">'
                . '</a>';
        }
        unset($record);

        $params['data'] = new \PrestaShop\PrestaShop\Core\Grid\Data\GridData(
            new \PrestaShop\PrestaShop\Core\Grid\Record\RecordCollection($records),
            $params['data']->getRecordsTotal(),
            $params['data']->getQuery()
        );
    }

    /**
     * Add an "Elementor" column to the AdminSimpleBlogPosts legacy list.
     */
    public function addBlogListColumn(array &$params): void
    {
        if (!isset($params['fields']) || !is_array($params['fields'])) {
            return;
        }

        $params['fields']['elementor_link'] = [
            'title' => 'Elementor',
            'align' => 'center',
            'class' => 'fixed-width-sm',
            'search' => false,
            'orderby' => false,
            'callback' => 'renderBlogListElementorIcon',
            'callback_object' => $this,
        ];
    }

    /**
     * Callback used by the AdminSimpleBlogPosts HelperList for the Elementor column.
     *
     * @param mixed $value
     * @param array $tr
     */
    public function renderBlogListElementorIcon($value, $tr): string
    {
        $id = isset($tr['id_simpleblog_post']) ? (int) $tr['id_simpleblog_post'] : 0;
        if (!$id) {
            return '';
        }

        $url = $this->context->link->getAdminLink('AdminIqitElementorEditor')
            . '&pageType=blog&contentType=default&newContent=0'
            . '&idLang=' . (int) $this->context->language->id
            . '&pageId=' . $id;

        $logoUrl = $this->modulePath . 'logo.png';

        return '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" '
            . 'title="Edit with Elementor" class="elementor-grid-link">'
            . '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES, 'UTF-8') . '" alt="Elementor" class="elementor-grid-logo" style="width:20px;height:20px;">'
            . '</a>';
    }
}
