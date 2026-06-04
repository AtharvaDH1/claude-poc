/** Sync logout across browser tabs (VAPT / session hygiene). */
export const AUTH_LOGOUT_CHANNEL = 'life-claims-logout-v1';

export function notifyOtherTabsLogout() {
  try {
    const bc = new BroadcastChannel(AUTH_LOGOUT_CHANNEL);
    bc.postMessage({ type: 'logout' });
    bc.close();
  } catch {
    // BroadcastChannel unsupported — ignore
  }
}
