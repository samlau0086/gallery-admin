import CMS from 'decap-cms-app';

declare global {
  interface Window {
    __GALLERY_CMS_CONFIG__?: Record<string, unknown>;
  }
}

CMS.init({ config: window.__GALLERY_CMS_CONFIG__ as any });
