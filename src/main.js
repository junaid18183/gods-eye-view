import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import { t } from './i18n/index.js';

// The Vite boundary exposes only undefined, null, or a validated URL.
const photonSetting = import.meta.env.PHOTON_URL;

// The server can supply the Cesium ion token at runtime (see clientConfigPlugin
// in build/vite.js). Use it when present, else the value built into the bundle.
async function runtimeCesiumToken() {
  try {
    const response = await fetch('/api/client-config', { cache: 'no-store' });
    if (!response.ok) return '';
    const body = await response.json();
    return typeof body?.cesiumToken === 'string' ? body.cesiumToken : '';
  } catch {
    return '';
  }
}

export let application;

runtimeCesiumToken()
  .then((runtimeToken) => {
    application = createStandaloneApplication({
      googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
      cesiumToken: runtimeToken || import.meta.env.CESIUM_ION_TOKEN,
      geospatial:
        photonSetting === undefined
          ? {}
          : { endpoints: { photon: photonSetting } },
      allowQaRegistration: import.meta.env.DEV,
    });
    return application.start();
  })
  .catch((error) => {
    console.error("God's Eye View initialization failed:", error);
    const loaderStatus = document.querySelector(
      '#loading-screen .loader-status',
    );
    loaderStatus.textContent = t('Error: {message}', {
      message: describeError(error),
    });
    loaderStatus.style.color = '#ff4444';
  });
