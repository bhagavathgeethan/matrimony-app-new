// Another member's photos: a strip of thumbnails in their profile, and a full-screen viewer to swipe through
// them. Blurred copies (before mutual interest) stay blurred here too — the server only ever sends those.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { Portal } from '../common/Portal';
import { useBackHandler } from '../../services/backButton';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

export const PhotoViewer = ({ photos, start = 0, blurred = false, onClose }) => {
  const [index, setIndex] = useState(start);
  const touchX = useRef(null);
  useBackHandler(onClose);
  const go = (step) => setIndex((i) => (i + step + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const many = photos.length > 1;
  return (
    <Portal>
      <View
        style={styles.viewer}
        onTouchStart={(e) => { touchX.current = e.nativeEvent.touches[0].pageX; }}
        onTouchEnd={(e) => {
          const dx = e.nativeEvent.changedTouches[0].pageX - (touchX.current ?? 0);
          if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <img src={photos[index]} alt={t('Photo {n}', { n: index + 1 })} style={imgStyle} draggable={false} />

        <View style={styles.top}>
          <Text style={styles.counter}>{index + 1} / {photos.length}</Text>
          <TouchableOpacity onPress={onClose} style={styles.roundBtn} accessibilityLabel={t('Close')}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {many && (
          <>
            <TouchableOpacity onPress={() => go(-1)} style={[styles.roundBtn, styles.side, { left: 12 }]} accessibilityLabel={t('Previous photo')}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => go(1)} style={[styles.roundBtn, styles.side, { right: 12 }]} accessibilityLabel={t('Next photo')}>
              <ChevronRight size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottom}>
          {blurred && (
            <View style={styles.lockPill}>
              <Lock size={12} color="#fff" />
              <Text style={styles.lockText}>{t('Photo reveals after mutual interest')}</Text>
            </View>
          )}
          {many && (
            <View style={styles.dots}>
              {photos.map((p, i) => <View key={p} style={[styles.dot, i === index && styles.dotOn]} />)}
            </View>
          )}
        </View>
      </View>
    </Portal>
  );
};

// Thumbnails at the top of their profile; tap one to open the viewer there
export const PhotoGallery = ({ candidate }) => {
  const photos = candidate.photos || [];
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.galleryHead}>
        <Text style={styles.galleryTitle}>{t('Photos')}</Text>
        <Text style={styles.galleryCount}>{photos.length === 1 ? t('1 photo') : t('{n} photos', { n: photos.length })}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {photos.map((p, i) => (
          <TouchableOpacity key={p} activeOpacity={0.85} onPress={() => setOpen(i)} style={styles.thumb} accessibilityLabel={t('Photo {n}', { n: i + 1 })}>
            <img src={p} alt="" style={thumbImg} draggable={false} />
            {candidate.photoBlurred && (
              <View style={styles.thumbLock}><Lock size={12} color="#fff" /></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {candidate.photoBlurred && <Text style={styles.note}>{t('Photo reveals after mutual interest')}</Text>}
      {open != null && <PhotoViewer photos={photos} start={open} blurred={candidate.photoBlurred} onClose={() => setOpen(null)} />}
    </View>
  );
};

const imgStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

const styles = StyleSheet.create({
  viewer: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, backgroundColor: '#0C0608' },
  top: { position: 'absolute', top: 14, left: 16, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700', color: '#fff' },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  side: { position: 'absolute', top: '50%', marginTop: -22 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center', gap: 12 },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  lockText: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '600', color: '#fff' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: '#fff' },
  galleryHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  galleryTitle: { fontFamily: fonts.sans, fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  galleryCount: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  thumb: { width: 108, height: 136, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.cardSecondary },
  thumbLock: { position: 'absolute', right: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  note: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
});
