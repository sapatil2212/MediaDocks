/**
 * Marks a page as never ad-eligible. Rendered by error and not-found screens;
 * the ad runtime tears down anything third-party when it appears.
 */
export function AdDenyMarker() {
  return <div data-ad-deny hidden />;
}
