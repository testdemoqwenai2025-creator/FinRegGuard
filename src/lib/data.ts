/**
 * Data URL helper — supports BOTH dev/server mode and GitHub Pages static export.
 *
 * - In dev/standalone server mode (NEXT_PUBLIC_STATIC_BUILD != 'true'):
 *     dataUrl('regulations')  →  '/api/regulations'
 * - In static export mode (NEXT_PUBLIC_STATIC_BUILD === 'true'):
 *     dataUrl('regulations')  →  '/FinRegGTP.BoT/data/regulations.json'
 *
 * The basePath (NEXT_PUBLIC_BASE_PATH) is auto-prefixed for static builds
 * so that GitHub Pages at https://<user>.github.io/FinRegGTP.BoT/ resolves correctly.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_BUILD === 'true'

/**
 * Build a fetch URL for a named data endpoint.
 * Pass an optional subpath (e.g. 'audit', 'audit?limit=8') — for static mode
 * the query string is stripped since we serve flat JSON files.
 */
export function dataUrl(endpoint: string): string {
  const cleanName = endpoint.split('?')[0].replace(/^\/+|\/+$/g, '')
  if (IS_STATIC) {
    return `${BASE_PATH}/data/${cleanName}.json`
  }
  return `${BASE_PATH}/api/${endpoint}`
}

export const IS_STATIC_BUILD = IS_STATIC
export const BASE_PATH_PREFIX = BASE_PATH
