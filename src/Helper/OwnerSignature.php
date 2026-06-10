<?php

namespace IqitElementor\Helper;

/**
 * Wrap/unwrap helper for the iqitelementor JSON payload.
 *
 * The current iqitelementor module persists the editor JSON inside a small
 * envelope so that any consumer can detect whether the layout was authored
 * by this module:
 *
 *   {
 *       "_iqit_signature": { "owner": "iqitelementor", "version": "1.4.5" },
 *       "elements":        [ ...original layout array... ]
 *   }
 *
 * The legacy iqitelementor_legacy module persists the layout as a bare array
 * of sections at the top level (no envelope). Callers therefore use:
 *
 *   - hasSignature($decoded) → it's our payload, unwrap and proceed
 *   - else → fall back to FormatDetector::isLegacy on the (already-bare) array
 *
 * The envelope lives only in the persistence layer: the editor and renderer
 * consume the bare elements array via unwrap(). Save handlers re-wrap before
 * persisting via wrap().
 */
class OwnerSignature
{
    public const KEY = '_iqit_signature';
    public const OWNER = 'iqitelementor';

    /**
     * Wrap a bare elements array into the signed envelope.
     *
     * @param array<mixed, mixed> $elements
     * @return array{_iqit_signature: array{owner: string, version: string}, elements: array<mixed, mixed>}
     */
    public static function wrap(array $elements, string $version): array
    {
        return [
            self::KEY => [
                'owner' => self::OWNER,
                'version' => $version,
            ],
            'elements' => $elements,
        ];
    }

    /**
     * Wrap a JSON string. Decodes, wraps, re-encodes. If the string is already
     * wrapped, the version is refreshed but elements are left untouched.
     */
    public static function wrapJson(string $json, string $version): string
    {
        if ($json === '') {
            return $json;
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            return $json;
        }

        $elements = self::unwrap($decoded);
        $wrapped = self::wrap($elements, $version);

        $reencoded = json_encode($wrapped, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $reencoded === false ? $json : $reencoded;
    }

    /**
     * Decode a JSON string and return the bare elements array as JSON. Useful
     * for endpoints that hand the layout back to the editor — the editor only
     * understands the bare array, not the envelope.
     */
    public static function unwrapJson(string $json): string
    {
        if ($json === '') {
            return $json;
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded) || !self::hasSignature($decoded)) {
            return $json;
        }

        $reencoded = json_encode(self::unwrap($decoded), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $reencoded === false ? $json : $reencoded;
    }

    /**
     * Return the bare elements array. Accepts either the envelope or a legacy
     * bare array; this is a no-op for inputs that were never wrapped.
     *
     * @param mixed $payload
     * @return array<mixed, mixed>
     */
    public static function unwrap($payload): array
    {
        if (!is_array($payload)) {
            return [];
        }

        if (self::hasSignature($payload)) {
            return isset($payload['elements']) && is_array($payload['elements'])
                ? $payload['elements']
                : [];
        }

        return $payload;
    }

    /**
     * @param mixed $payload
     */
    public static function hasSignature($payload): bool
    {
        if (!is_array($payload) || !isset($payload[self::KEY]) || !is_array($payload[self::KEY])) {
            return false;
        }

        $sig = $payload[self::KEY];
        return isset($sig['owner']) && $sig['owner'] === self::OWNER;
    }

    /**
     * @param mixed $payload
     * @return array{owner: string, version: string}|null
     */
    public static function getSignature($payload): ?array
    {
        if (!self::hasSignature($payload)) {
            return null;
        }

        $sig = $payload[self::KEY];
        return [
            'owner' => (string) $sig['owner'],
            'version' => isset($sig['version']) ? (string) $sig['version'] : '',
        ];
    }

    /**
     * Resolve the current iqitelementor module version.
     */
    public static function currentVersion(): string
    {
        $module = \Module::getInstanceByName('iqitelementor');
        if ($module && isset($module->version)) {
            return (string) $module->version;
        }

        return '';
    }
}
