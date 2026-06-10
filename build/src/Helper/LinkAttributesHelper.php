<?php

namespace IqitElementor\Helper;

if (!defined('_PS_VERSION_')) {
    throw new \RuntimeException('iqitelementor: _PS_VERSION_ not defined — module not loaded properly');
}

class LinkAttributesHelper
{
    /**
     * Build an attributes array from a URL control value.
     *
     * Handles target/rel (from is_external + nofollow), custom id and
     * custom_attributes parsed from the "key|value, key|value" format.
     *
     * @param array|null $link
     * @return array<string, string>
     */
    public static function getAttributesArray($link): array
    {
        if (!is_array($link)) {
            return [];
        }

        $attributes = [];
        $relParts = [];

        if (!empty($link['is_external'])) {
            $attributes['target'] = '_blank';
            $relParts[] = 'noopener';
            $relParts[] = 'noreferrer';
        }

        if (!empty($link['nofollow'])) {
            $relParts[] = 'nofollow';
        }

        if (!empty($relParts)) {
            $attributes['rel'] = implode(' ', array_unique($relParts));
        }

        if (!empty($link['custom_attributes'])) {
            foreach (self::parseCustomAttributes((string) $link['custom_attributes']) as $key => $value) {
                if (!isset($attributes[$key])) {
                    $attributes[$key] = $value;
                }
            }
        }

        return $attributes;
    }

    /**
     * Serialize the attributes array to an HTML fragment (leading space).
     *
     * @param array|null $link
     * @return string
     */
    public static function getAttributesHtml($link): string
    {
        $out = '';
        foreach (self::getAttributesArray($link) as $key => $value) {
            $out .= ' ' . htmlspecialchars($key, ENT_QUOTES, 'UTF-8')
                . '="' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '"';
        }
        return $out;
    }

    /**
     * Parse a "key|value, key|value" string into an associative array.
     *
     * Keys are restricted to a safe subset (alphanum, dash, underscore, colon)
     * to prevent injecting arbitrary HTML attributes.
     *
     * @return array<string, string>
     */
    private static function parseCustomAttributes(string $raw): array
    {
        $result = [];
        if ($raw === '') {
            return $result;
        }

        $pairs = explode(',', $raw);
        foreach ($pairs as $pair) {
            $parts = explode('|', $pair, 2);
            if (count($parts) !== 2) {
                continue;
            }
            $key = trim($parts[0]);
            $value = trim($parts[1]);

            if ($key === '' || !preg_match('/^[A-Za-z_:][A-Za-z0-9_\-:.]*$/', $key)) {
                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }
}
