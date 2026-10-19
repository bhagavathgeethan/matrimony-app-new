import React from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/ui';
import { t } from '@shared/i18n';

export function NotFoundPage() {
  return (
    <div className="empty" style={{ minHeight: '100vh' }}>
      <LogoMark size={64} />
      <h1 className="h1">{t('Page not found')}</h1>
      <p className="lede">{t('The page you’re looking for doesn’t exist.')}</p>
      <Link to="/" className="btn btn-primary">{t('Go home')}</Link>
    </div>
  );
}
