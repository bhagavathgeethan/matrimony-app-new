import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Camera, ChevronLeft, Clock, ShieldCheck, RotateCw } from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/ui';
import { t } from '@shared/i18n';

// Selfie verification: reviewed by the 3Knot team against the profile photos
export function VerificationPage() {
  const { user, verification, loadVerification, submitVerification } = useStore();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef(null);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await submitVerification(file);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setFile(null);
  };

  const v = verification;
  const pending = v?.request?.status === 'pending';
  const rejected = v?.request?.status === 'rejected';
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to="/profile" className="row small muted" style={{ '--gap': '4px' }}><ChevronLeft size={15} />{' '}{t('Profile')}</Link>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('Trust')}</span>
        <h1 className="h1">{t('Get the verified badge')}</h1>
        <span className="small muted">{t('Take a clear selfie. Our team compares it with your profile photos — it’s never shown to anyone else and is deleted after review.')}</span>
      </div>

      {v?.verified || user?.verified ? (
        <div className="card row" style={{ '--gap': '14px' }}>
          <BadgeCheck size={34} color="var(--success)" />
          <div><div className="h2">{t('You’re verified')}</div><div className="small muted">{t('The badge shows on your profile and in search.')}</div></div>
        </div>
      ) : pending ? (
        <div className="card row" style={{ '--gap': '14px' }}>
          <Clock size={30} color="var(--gold)" />
          <div><div className="h2">{t('Selfie under review')}</div><div className="small muted">{t('Usually within a day. We’ll notify you.')}</div></div>
        </div>
      ) : (
        <div className="card stack">
          {rejected && (
            <div className="row small" style={{ '--gap': '8px', color: 'var(--accent)' }}>
              <RotateCw size={15} />{' '}{v.request.note ? t('Last attempt wasn’t approved: {reason}. Please try again.', { reason: v.request.note }) : t('Last attempt wasn’t approved. Please try again.')}
            </div>
          )}
          <ul className="small muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>{t('Face the camera in good light, no sunglasses or filters')}</li>
            <li>{t('Just you in the photo')}</li>
            <li>{t('Your profile needs at least one clear photo of you')}</li>
          </ul>
          {preview && <img src={preview} alt={t('Your selfie')} className="selfie-preview" />}
          <input ref={input} type="file" accept="image/*" capture="user" onChange={pick} style={{ display: 'none' }} aria-label={t('Selfie')} />
          {error && <span className="error-text">{error}</span>}
          <div className="row" style={{ '--gap': '10px' }}>
            <Button variant="secondary" icon={Camera} onClick={() => input.current?.click()}>{file ? t('Retake') : t('Take a selfie')}</Button>
            <Button icon={ShieldCheck} loading={busy} disabled={!file || busy} onClick={send}>{t('Submit for review')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
