<?php
namespace IqitElementor\Core;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

class Utils
{
    public static function getPlaceholderImageSrc(): string
    {
        return \ELEMENTOR_ASSETS_URL . 'images/placeholder.png';
    }

    /**
     * @return string|false
     */
    public static function getYoutubeIdFromUrl(string $url)
    {
        preg_match('/^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/', $url, $video_id_parts);

        if (empty($video_id_parts[1])) {
            return false;
        }

        return $video_id_parts[1];
    }
}
