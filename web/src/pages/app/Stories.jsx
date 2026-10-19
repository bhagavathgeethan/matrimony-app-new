import React, { useEffect, useState } from 'react';
import { Heart, Clock, Check, X } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Empty } from '../../components/ui';
import { Select } from '../../components/Select';
import { t } from '@shared/i18n';

const STATUS = {
  pending_partner: ['Waiting for your partner', 'gold'],
  pending_review: ['With the 3Knot team', 'gold'],
  published: ['Published', 'success'],
  rejected: ['Not published', 'neutral'],
};

// Share how you met (both partners confirm; the team publishes)
export function StoriesPage() {
  const { conversations, stories, loadStories, submitStory, respondStory, withdrawStory } = useStore();
  const accepted = conversations.filter((conv) => conv.status === 'accepted' && !conv.isFormerMember);
  const [conversationId, setConversationId] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await submitStory({ conversationId, title: title.trim(), story: story.trim() });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setTitle('');
    setStory('');
    setConversationId('');
  };

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('Success stories')}</span>
        <h1 className="h1">{t('Found each other on 3Knot?')}</h1>
        <span className="small muted">{t('Share your story. Your partner confirms first, then our team publishes it on the 3Knot home page — first names only.')}</span>
      </div>

      {stories.length > 0 && (
        <div className="stack">
          {stories.map((s) => (
            <div key={s.id} className="card stack" style={{ '--gap': '10px' }}>
              <div className="row between">
                <span className="h3">{s.title}</span>
                <Badge tone={STATUS[s.status][1]}>{t(STATUS[s.status][0])}</Badge>
              </div>
              <span className="small muted">{s.names}</span>
              <p className="details-text">{s.story}</p>
              <div className="row" style={{ '--gap': '8px' }}>
                {s.needsMyConfirmation && (
                  <>
                    <Button size="sm" icon={Check} onClick={() => respondStory(s.id, true)}>{t('Confirm')}</Button>
                    <Button size="sm" variant="secondary" icon={X} onClick={() => respondStory(s.id, false)}>{t('Decline')}</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => withdrawStory(s.id)}>{t('Withdraw')}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length === 0 ? (
        <Empty icon={Heart} title={t('Stories can be shared once you’ve both accepted interest')} />
      ) : (
        <form className="card stack" onSubmit={send}>
          <span className="label">{t('Share a new story')}</span>
          <Select value={conversationId} onChange={setConversationId} aria-label={t('Partner')} placeholder={t('Who did you meet?')}
            options={accepted.map((c) => [c.id, c.candidateName])} />
          <input className="input" placeholder={t('A title, e.g. “Matched on roots, married in Madurai”')} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t('Title')} />
          <textarea className="input" rows={6} maxLength={1500} placeholder={t('How did you meet? What made you click?')} value={story} onChange={(e) => setStory(e.target.value)} aria-label={t('Story')} />
          {error && <span className="error-text">{error}</span>}
          <Button type="submit" icon={Heart} loading={busy} disabled={!conversationId || !title.trim() || !story.trim() || busy}>{t('Send to your partner to confirm')}</Button>
          <span className="row tiny muted" style={{ '--gap': '6px' }}><Clock size={12} />{' '}{t('Either of you can withdraw it at any time.')}</span>
        </form>
      )}
    </div>
  );
}
