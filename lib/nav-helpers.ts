/**
 * Determine if a navigation item is active based on the current pathname.
 * Home items match "/" or "/dashboard" exactly.
 * Other items match when pathname starts with the item's href.
 */
export function isNavItemActive(
  itemHref: string,
  isHome: boolean,
  pathname: string,
): boolean {
  if (isHome) {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname.startsWith(itemHref);
}
