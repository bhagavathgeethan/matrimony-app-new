// Another member's photos: a strip of thumbnails in their profile, and a full-screen viewer to step through
// them. Blurred copies (before mutual interest) stay blurred here too — the server only ever sends those.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { cx } from './ui';
import { t } from '@shared/i18n';

export function PhotoViewer({ photos, start = 0, blurred = false, onClose }) {
  const [index, setIndex] = useState(start);
  const touchX = useRef(null);
  const many = photos.length > 1;
  const go = (step) => setIndex((i) => (i + step + photos.length) % photos.length);

  // Captured on window so Escape closes only the viewer, not the profile modal underneath
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'ArrowRight' && many) { e.stopPropagation(); go(1); }
      if (e.key === 'ArrowLeft' && many) { e.stopPropagation(); go(-1); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return createPortal(
    <div
      className="photo-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={t('Photos')}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <img src={photos[index]} alt={t('Photo {n}', { n: index + 1 })} draggable={false} />
      <div className="photo-viewer-top">
        <span>{index + 1} / {photos.length}</span>
        <button type="button" className="photo-viewer-btn" onClick={onClose} aria-label={t('Close')}><X size={22} /></button>
      </div>
      {many && (
        <>
          <button type="button" className="photo-viewer-btn side prev" onClick={() => go(-1)} aria-label={t('Previous photo')}><ChevronLeft size={26} /></button>
          <button type="button" className="photo-viewer-btn side next" onClick={() => go(1)} aria-label={t('Next photo')}><ChevronRight size={26} /></button>
        </>
      )}
      <div className="photo-viewer-bottom">
        {blurred && <span className="photo-viewer-lock"><Lock size={12} />{t('Photo reveals after mutual interest')}</span>}
        {many && (
          <div className="photo-viewer-dots">
            {photos.map((p, i) => <button key={p} type="button" className={cx(i === index && 'on')} onClick={() => setIndex(i)} aria-label={t('Photo {n}', { n: i + 1 })} />)}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Thumbnails at the top of their profile; click one to open the viewer there
export function PhotoGallery({ candidate }) {
  const photos = candidate.photos || [];
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <span className="h3">{t('Photos')}</span>
        <span className="small muted">{photos.length === 1 ? t('1 photo') : t('{n} photos', { n: photos.length })}</span>
      </div>
      <div className="photo-strip">
        {photos.map((p, i) => (
          <button key={p} type="button" className="photo-thumb" onClick={() => setOpen(i)} aria-label={t('Photo {n}', { n: i + 1 })}>
            <img src={p} alt="" draggable={false} />
            {candidate.photoBlurred && <span className="photo-thumb-lock"><Lock size={12} /></span>}
          </button>
        ))}
      </div>
      {candidate.photoBlurred && <span className="small muted">{t('Photo reveals after mutual interest')}</span>}
      {open != null && <PhotoViewer photos={photos} start={open} blurred={candidate.photoBlurred} onClose={() => setOpen(null)} />}
    </div>
  );
}
