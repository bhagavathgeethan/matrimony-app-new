import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, ChevronLeft, Lightbulb, MessageCircle, ShieldCheck, Video, Phone, Heart, CheckCheck, Check, Inbox } from 'lucide-react';
import { useStore, calls } from '../../store';
import { Avatar, Badge, Button, cx } from '../../components/ui';
import { CandidateModal, InterestStatusNote, SafetyActions } from '../../components/candidate';
import { VoiceRecorderButton, VoiceNote, ContactShare } from '../../components/premium';
import { t, formatTime } from '@shared/i18n';

export function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    conversations, threadMessages, candidates, activeThreadId, openThreadById, sendMessageInThread, acceptInterest, declineInterest, user,
  } = useStore();
  const [text, setText] = useState('');
  const [tab, setTab] = useState('chats');
  const [busy, setBusy] = useState(null);
  const [callError, setCallError] = useState(null);
  const [viewing, setViewing] = useState(null); // the other person's full profile
  const bodyRef = useRef(null);

  // The URL decides which thread is open
  useEffect(() => {
    if (conversationId && conversationId !== activeThreadId) openThreadById(conversationId, { navigate: false });
  }, [conversationId, activeThreadId, openThreadById]);

  const thread = conversations.find((conv) => conv.id === conversationId);
  const messages = threadMessages[conversationId] || [];
  const candidate = candidates.find((c) => c.id === thread?.candidateId);
  const requests = conversations.filter((conv) => conv.needsMyResponse);
  const chats = conversations.filter((conv) => !conv.needsMyResponse);
  const shown = tab === 'requests' ? requests : chats;
  const lastMine = [...messages].reverse().find((m) => m.sender === 'me');

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, conversationId]);
  useEffect(() => {
    if (thread?.needsMyResponse) setTab('requests');
  }, [thread?.needsMyResponse]);

  const send = (e, value = text) => {
    e?.preventDefault();
    if (!value.trim()) return;
    sendMessageInThread(conversationId, value);
    setText('');
  };
  const respond = async (accept) => {
    setBusy(accept ? 'accept' : 'decline');
    if (accept) await acceptInterest(conversationId);
    else {
      await declineInterest(conversationId);
      navigate('/messages');
    }
    setBusy(null);
  };
  const startCall = async (kind) => {
    setCallError(null);
    const res = await calls.start({ conversationId, peer: { id: thread.candidateId, name: thread.candidateName }, kind });
    if (!res.ok) setCallError(res.error);
  };

  const canChat = thread && !thread.isFormerMember && thread.canMessage;
  const waiting = thread?.status === 'requested' && thread.requestedByMe;

  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 1240 }}>
      <div className={cx('messages-layout', conversationId && 'has-thread')}>
        <div className="thread-list">
          <div style={{ padding: '18px 16px 6px' }} className="row between">
            <h1 className="h2">{t('Messages')}</h1>
            {conversations.some((conv) => conv.unread) && (
              <Badge tone="accent">{t('{n} new', { n: conversations.filter((conv) => conv.unread).length })}</Badge>
            )}
          </div>
          <div className="tabs" style={{ margin: '0 12px 6px' }} role="tablist">
            <button role="tab" aria-selected={tab === 'chats'} className={cx('tab', tab === 'chats' && 'active')} onClick={() => setTab('chats')}>{t('Chats')}</button>
            <button role="tab" aria-selected={tab === 'requests'} className={cx('tab', tab === 'requests' && 'active')} onClick={() => setTab('requests')}>
              {t('Requests')}{requests.length > 0 && <span className="filter-count" style={{ marginLeft: 6 }}>{requests.length}</span>}
            </button>
          </div>
          {shown.length === 0 && (
            <div className="empty small">
              {tab === 'requests' ? <Inbox size={26} color="var(--gold)" /> : <MessageCircle size={26} color="var(--gold)" />}
              {tab === 'requests' ? t('No interest requests waiting.') : t('No conversations yet. Express interest from Matches.')}
            </div>
          )}
          {shown.map((conv) => (
            <button key={conv.id} className={cx('thread-item', conv.id === conversationId && 'active')} onClick={() => navigate(`/messages/${conv.id}`)}>
              <Avatar src={conv.candidatePhoto} name={conv.candidateName} size={48} />
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="row between">
                  <span className="h3">{conv.isSuper && conv.needsMyResponse ? '⭐ ' : ''}{conv.candidateName}</span>
                  <span className="tiny muted">{t(conv.lastMessageTime || '')}</span>
                </span>
                <span className="small" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: conv.unread ? 'var(--text)' : 'var(--text-2)', fontWeight: conv.unread ? 700 : 500 }}>
                  {conv.needsMyResponse
                    ? (conv.lastMessage ? t('Interested in you — “{message}”', { message: conv.lastMessage }) : t('Interested in you'))
                    : conv.status === 'requested'
                      ? t('Interest sent · waiting')
                      : conv.status === 'declined' ? t('Not available') : conv.lastMessage || t('Say hello — no messages yet')}
                </span>
              </span>
              {conv.unread && conv.id !== conversationId && <span className="unread-count">{conv.unreadCount}</span>}
            </button>
          ))}
        </div>

        <section className="thread">
          {!thread ? (
            <div className="empty" style={{ margin: 'auto' }}>
              <MessageCircle size={30} color="var(--gold)" />
              <div className="h3">{conversationId ? t('Loading conversation…') : t('Pick a conversation')}</div>
              <span className="small">{t('Your chats are private — never visible on a family dashboard.')}</span>
            </div>
          ) : (
            <>
              <header className="thread-head">
                <button className="icon-btn" onClick={() => navigate('/messages')} aria-label={t('Back to conversations')}><ChevronLeft size={18} /></button>
                <button
                  type="button"
                  className="thread-who grow"
                  disabled={thread.isFormerMember}
                  title={t('Full profile')}
                  onClick={() => setViewing({ id: thread.candidateId, firstName: thread.candidateName, age: thread.candidateAge, city: thread.candidateCity })}
                >
                  <Avatar src={thread.candidatePhoto} name={thread.candidateName} size={42} />
                  <div className="grow">
                    <div className="h3">{thread.candidateName}{thread.candidateAge ? `, ${thread.candidateAge}` : ''}</div>
                    <div className="tiny accent" style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {thread.overlapScore != null ? t('{overlapScore}% aligned', { overlapScore: thread.overlapScore }) : t('3Knot')}{thread.candidateCity ? ` · ${thread.candidateCity}` : ''}
                    </div>
                  </div>
                </button>
                {thread.sharedWithParentStatus && <Badge tone="success">{t(thread.sharedWithParentStatus)}</Badge>}
                {thread.status === 'accepted' && !thread.isFormerMember && (
                  <>
                    <button className="icon-btn" onClick={() => startCall('audio')} aria-label={t('Voice call {candidateName}', { candidateName: thread.candidateName })}><Phone size={17} /></button>
                    <button className="icon-btn soft" onClick={() => startCall('video')} aria-label={t('Video call {candidateName}', { candidateName: thread.candidateName })}><Video size={17} /></button>
                  </>
                )}
              </header>
              {callError && <div className="call-error small">{callError}</div>}

              <div className="thread-body" ref={bodyRef}>
                <span className="badge neutral" style={{ alignSelf: 'center' }}>{t(thread.matchedDaysAgo)}</span>
                {thread.needsMyResponse && (
                  <div className="request-card">
                    <Heart size={18} color="var(--accent)" />
                    <div className="grow">
                      <div className="h3">{t('{name} is interested in you', { name: thread.candidateName })}</div>
                      <div className="small muted">{t('Accept to chat, see each other’s photos and video call. Declining is private.')}</div>
                    </div>
                    <Button variant="secondary" size="sm" loading={busy === 'decline'} disabled={!!busy} onClick={() => respond(false)}>{t('Decline')}</Button>
                    <Button size="sm" icon={Heart} loading={busy === 'accept'} disabled={!!busy} onClick={() => respond(true)}>{t('Accept')}</Button>
                  </div>
                )}
                {thread.status === 'accepted' && messages.length < 4 && thread.conversationPrompts?.length > 0 && (
                  <div className="opener" style={{ maxWidth: 560, alignSelf: 'center' }}>
                    <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} />{' '}{t('Conversation starters')}</span>
                    <div className="row wrap" style={{ '--gap': '6px' }}>
                      {thread.conversationPrompts.map((p) => (
                        <button key={p} type="button" className="chip sm" onClick={() => setText(t(p))}>{t(p)}</button>
                      ))}
                    </div>
                  </div>
                )}
                {thread.status !== 'accepted' && candidate?.suggestedOpener && thread.requestedByMe && messages.length === 0 && (
                  <div className="opener" style={{ maxWidth: 520, alignSelf: 'center' }}>
                    <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} />{' '}{t('Suggested opener')}</span>
                    <span style={{ fontWeight: 650 }}>{t(candidate.suggestedOpener)}</span>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cx('bubble', m.sender)}>
                    {m.kind === 'voice' ? <VoiceNote message={m} /> : <span>{m.text}</span>}
                    <span className="bubble-time">
                      {m.failed ? t('Not sent — {reason}', { reason: m.error || t('try again') }) : m.pending ? t('Sending…') : (m.createdAt ? formatTime(m.createdAt) : m.timestamp)}
                      {m.id === lastMine?.id && m.seen !== undefined && (
                        <span className="row" style={{ '--gap': '3px', display: 'inline-flex', marginLeft: 6 }}>
                          {m.seen ? <CheckCheck size={13} /> : <Check size={13} />}{m.seen ? t('Seen') : t('Delivered')}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                <span className="row tiny muted" style={{ alignSelf: 'center', '--gap': '6px', marginTop: 8 }}>
                  <ShieldCheck size={13} color="var(--success)" />{' '}{t('Chats are never visible on a family dashboard.')}
                </span>
                {thread.status === 'accepted' && !thread.isFormerMember && <ContactShare thread={thread} />}
                {thread.candidateId && (
                  <div style={{ alignSelf: 'center' }}>
                    <SafetyActions member={{ id: thread.candidateId, firstName: thread.candidateName }} onDone={() => navigate('/messages')} />
                  </div>
                )}
              </div>

              {thread.isFormerMember ? (
                <div className="composer small muted" style={{ justifyContent: 'center' }}>
                  {t('This member has left 3Knot. Your conversation is kept for you.')}
                </div>
              ) : canChat ? (
                <form className="composer" onSubmit={send}>
                  {thread.status === 'accepted' && <VoiceRecorderButton conversationId={thread.id} />}
                  <input className="input" placeholder={thread.needsMyResponse ? t('Reply to accept…') : t('Write a message…')} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
                  <button className="send-btn" type="submit" disabled={!text.trim()} aria-label={t('Send')}><ArrowUp size={20} strokeWidth={2.6} /></button>
                </form>
              ) : (
                <div className="composer small muted" style={{ justifyContent: 'center' }}>
                  <InterestStatusNote thread={thread} />
                  {!waiting && thread.status !== 'declined' && t('You can’t message this member.')}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {!user?.planFeatures?.includes('readReceipts') && thread?.status === 'accepted' && <span className="tiny muted" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>{t('3Knot Plus shows when your messages have been read.')}</span>}
      {viewing && <CandidateModal candidate={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
