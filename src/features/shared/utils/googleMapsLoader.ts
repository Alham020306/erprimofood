const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let loaderPromise: Promise<any> | null = null;

export const hasGoogleMapsApiKey = () => Boolean(GOOGLE_MAPS_API_KEY);

export const loadGoogleMaps = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loaderPromise) return loaderPromise;
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(null);

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => resolve((window as any).google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return loaderPromise;
};
