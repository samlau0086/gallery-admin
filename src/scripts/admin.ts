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

const maxProductImages = 20;
const uploadImage = async (file: File) => {
  const form = new FormData(); form.set('file', file); form.set('folder', 'products');
  const response = await fetch('/api/upload', { method: 'POST', headers: { authorization: 'Bearer ' + getToken() }, body: form });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Upload failed.'); return result.url;
};
const asArray = (value: any) => value?.toJS?.() ?? (Array.isArray(value) ? value : []);
const dropEvents = (handler: (files: FileList) => void) => ({
  onDragEnter: (event: React.DragEvent) => event.preventDefault(),
  onDragOver: (event: React.DragEvent) => event.preventDefault(),
  onDrop: (event: React.DragEvent) => { event.preventDefault(); handler(event.dataTransfer.files); },
});

function R2ImageControl({ value, onChange, forID, classNameWrapper }: any) {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const upload = async (file?: File) => { if (!file) return; setBusy(true); setError(''); try { onChange(await uploadImage(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); } finally { setBusy(false); } };
  return React.createElement('div', { className: classNameWrapper + ' r2-upload' }, React.createElement('input', { id: forID, type: 'file', accept: 'image/*', ref: input, hidden: true, disabled: busy, onChange: (event: any) => upload(event.target.files?.[0]) }), React.createElement('button', { type: 'button', className: 'r2-dropzone', disabled: busy, onClick: () => input.current?.click(), ...dropEvents(files => upload(files[0])) }, busy ? 'Uploading…' : 'Drop image here or choose file'), value && React.createElement('img', { src: value, alt: '', className: 'r2-upload-cover' }), error && React.createElement('small', { className: 'r2-upload-error' }, error));
}
function R2MediaControl({ value, onChange, forID, classNameWrapper }: any) {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const media = asArray(value);
  const upload = async (files: FileList | File[]) => {
    const selected = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, maxProductImages - media.length);
    if (!selected.length) { setError(media.length >= maxProductImages ? 'A product can have up to 20 images.' : 'Choose image files to upload.'); return; }
    setBusy(true); setError(''); try { const urls = await Promise.all(selected.map(uploadImage)); onChange([...media, ...urls.map(url => ({ url, type: 'image' }))]); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); } finally { setBusy(false); }
  };
  const previews = media.map((item: any, index: number) => React.createElement(
    'div',
    { className: 'r2-media-item', key: item.url + index },
    item.type === 'video' ? React.createElement('span', null, 'Video') : React.createElement('img', { src: item.url, alt: '' }),
    React.createElement('button', { type: 'button', 'aria-label': 'Remove media', onClick: () => onChange(media.filter((_: any, itemIndex: number) => itemIndex !== index)) }, '×'),
  ));
  return React.createElement(
    'div',
    { className: classNameWrapper + ' r2-upload' },
    React.createElement('input', { id: forID, type: 'file', accept: 'image/*', multiple: true, ref: input, hidden: true, disabled: busy, onChange: (event: any) => upload(event.target.files || []) }),
    React.createElement('button', { type: 'button', className: 'r2-dropzone', disabled: busy || media.length >= maxProductImages, onClick: () => input.current?.click(), ...dropEvents(upload) }, busy ? 'Uploading…' : 'Drop product images here or choose files (up to 20)'),
    React.createElement('div', { className: 'r2-media-grid' }, previews),
    error && React.createElement('small', { className: 'r2-upload-error' }, error),
  );
}
CMS.registerWidget('r2-image', R2ImageControl as any);
CMS.registerWidget('r2-media', R2MediaControl as any);
CMS.init({ config: window.__GALLERY_CMS_CONFIG__ as any });
