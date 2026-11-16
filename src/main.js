import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import { t } from './i18n/index.js';

// The server can supply these settings at runtime (see clientConfigPlugin in
// build/vite.js). Each one uses the runtime value when present, else the value
// built into the bundle. The Vite boundary exposes only undefined, null, or a
// validated URL for Photon.
async function runtimeClientConfig() {
  try {
    const response = await fetch('/api/client-config', { cache: 'no-store' });
    if (!response.ok) return {};
    const body = await response.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

const pick = (runtimeValue, buildValue) =>
  typeof runtimeValue === 'string' && runtimeValue !== ''
    ? runtimeValue
    : buildValue;

export let application;

runtimeClientConfig()
  .then((config) => {
    // undefined stays undefined (no setting), null disables Photon.
    const photonSetting =
      config.photonUrl !== undefined
        ? config.photonUrl
        : import.meta.env.PHOTON_URL;
    application = createStandaloneApplication({
      googleApiKey: pick(config.googleApiKey, import.meta.env.GOOGLE_MAPS_API_KEY),
      cesiumToken: pick(config.cesiumToken, import.meta.env.CESIUM_ION_TOKEN),
      mapillaryToken: pick(
        config.mapillaryToken,
        import.meta.env.MAPILLARY_CLIENT_TOKEN,
      ),
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
