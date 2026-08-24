import CMS from 'decap-cms-app';
import React, { useRef, useState } from 'react';

declare global {
  interface Window {
    __GALLERY_CMS_CONFIG__?: Record<string, unknown>;
  }
}

function getToken() {
  try { return JSON.parse(localStorage.getItem('netlify-cms-user') || '{}')?.token || ''; } catch { return ''; }
}

function R2ImageControl({ value, onChange, forID, classNameWrapper }: any) {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const upload = async (file: File) => { setBusy(true); setError(''); try { const form = new FormData(); form.set('file', file); form.set('folder', 'products'); const response = await fetch('/api/upload', { method: 'POST', headers: { authorization: 'Bearer ' + getToken() }, body: form }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Upload failed.'); onChange(result.url); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); } finally { setBusy(false); } };
  return React.createElement('div', { className: classNameWrapper }, React.createElement('input', { id: forID, type: 'file', accept: 'image/*', ref: input, disabled: busy, onChange: (e: any) => e.target.files?.[0] && upload(e.target.files[0]) }), value && React.createElement('img', { src: value, alt: '', style: { display: 'block', maxWidth: 240, maxHeight: 180, objectFit: 'cover', marginTop: 8 } }), busy && React.createElement('small', null, 'Uploading…'), error && React.createElement('small', { style: { color: '#c33' } }, error));
}
CMS.registerWidget('r2-image', R2ImageControl as any);
CMS.init({ config: window.__GALLERY_CMS_CONFIG__ as any });
