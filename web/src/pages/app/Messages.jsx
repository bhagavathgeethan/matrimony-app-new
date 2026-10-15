import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, ChevronLeft, Lightbulb, MessageCircle, ShieldCheck, Video, Phone, Heart, CheckCheck, Check, Inbox } from 'lucide-react';
import { useStore, calls } from '../../store';
import { Avatar, Badge, Button, cx } from '../../components/ui';
import { InterestStatusNote, SafetyActions } from '../../components/candidate';
import { t } from '@shared/i18n';

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
  const bodyRef = useRef(null);

  // The URL decides which thread is open
  useEffect(() => {
    if (conversationId && conversationId !== activeThreadId) openThreadById(conversationId, { navigate: false });
  }, [conversationId, activeThreadId, openThreadById]);

  const thread = conversations.find((t) => t.id === conversationId);
  const messages = threadMessages[conversationId] || [];
  const candidate = candidates.find((c) => c.id === thread?.candidateId);
  const requests = conversations.filter((t) => t.needsMyResponse);
  const chats = conversations.filter((t) => !t.needsMyResponse);
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
            {conversations.some((t) => t.unread) && (
              <Badge tone="accent">{conversations.filter((t) => t.unread).length} new</Badge>
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
              {tab === 'requests' ? 'No interest requests waiting.' : 'No conversations yet. Express interest from Matches.'}
            </div>
          )}
          {shown.map((t) => (
            <button key={t.id} className={cx('thread-item', t.id === conversationId && 'active')} onClick={() => navigate(`/messages/${t.id}`)}>
              <Avatar src={t.candidatePhoto} name={t.candidateName} size={48} />
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="row between">
                  <span className="h3">{t.candidateName}</span>
                  <span className="tiny muted">{t.lastMessageTime || ''}</span>
                </span>
                <span className="small" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: t.unread ? 'var(--text)' : 'var(--text-2)', fontWeight: t.unread ? 700 : 500 }}>
                  {t.needsMyResponse
                    ? `Interested in you${t.lastMessage ? ` — “${t.lastMessage}”` : ''}`
                    : t.status === 'requested'
                      ? 'Interest sent · waiting'
                      : t.status === 'declined' ? 'Not available' : t.lastMessage || 'Say hello — no messages yet'}
                </span>
              </span>
              {t.unread && t.id !== conversationId && <span className="unread-count">{t.unreadCount}</span>}
            </button>
          ))}
        </div>

        <section className="thread">
          {!thread ? (
            <div className="empty" style={{ margin: 'auto' }}>
              <MessageCircle size={30} color="var(--gold)" />
              <div className="h3">{conversationId ? 'Loading conversation…' : 'Pick a conversation'}</div>
              <span className="small">Your chats are private — never visible on a family dashboard.</span>
            </div>
          ) : (
            <>
              <header className="thread-head">
                <button className="icon-btn" onClick={() => navigate('/messages')} aria-label="Back to conversations"><ChevronLeft size={18} /></button>
                <Avatar src={thread.candidatePhoto} name={thread.candidateName} size={42} />
                <div className="grow">
                  <div className="h3">{thread.candidateName}{thread.candidateAge ? `, ${thread.candidateAge}` : ''}</div>
                  <div className="tiny accent" style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {thread.overlapScore != null ? `${thread.overlapScore}% aligned` : 'Sangam'}{thread.candidateCity ? ` · ${thread.candidateCity}` : ''}
                  </div>
                </div>
                {thread.sharedWithParentStatus && <Badge tone="success">{thread.sharedWithParentStatus}</Badge>}
                {thread.status === 'accepted' && !thread.isFormerMember && (
                  <>
                    <button className="icon-btn" onClick={() => startCall('audio')} aria-label={`Voice call ${thread.candidateName}`}><Phone size={17} /></button>
                    <button className="icon-btn soft" onClick={() => startCall('video')} aria-label={`Video call ${thread.candidateName}`}><Video size={17} /></button>
                  </>
                )}
              </header>
              {callError && <div className="call-error small">{callError}</div>}

              <div className="thread-body" ref={bodyRef}>
                <span className="badge neutral" style={{ alignSelf: 'center' }}>{thread.matchedDaysAgo}</span>
                {thread.needsMyResponse && (
                  <div className="request-card">
                    <Heart size={18} color="var(--accent)" />
                    <div className="grow">
                      <div className="h3">{t('{name} is interested in you', { name: thread.candidateName })}</div>
                      <div className="small muted">Accept to chat, see each other’s photos and video call. Declining is private.</div>
                    </div>
                    <Button variant="secondary" size="sm" loading={busy === 'decline'} disabled={!!busy} onClick={() => respond(false)}>{t('Decline')}</Button>
                    <Button size="sm" icon={Heart} loading={busy === 'accept'} disabled={!!busy} onClick={() => respond(true)}>{t('Accept')}</Button>
                  </div>
                )}
                {thread.status === 'accepted' && messages.length < 4 && thread.conversationPrompts?.length > 0 && (
                  <div className="opener" style={{ maxWidth: 560, alignSelf: 'center' }}>
                    <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} /> Conversation starters</span>
                    <div className="row wrap" style={{ '--gap': '6px' }}>
                      {thread.conversationPrompts.map((p) => (
                        <button key={p} type="button" className="chip sm" onClick={() => setText(p)}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}
                {thread.status !== 'accepted' && candidate?.suggestedOpener && thread.requestedByMe && messages.length === 0 && (
                  <div className="opener" style={{ maxWidth: 520, alignSelf: 'center' }}>
                    <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} /> Suggested opener</span>
                    <span style={{ fontWeight: 650 }}>{candidate.suggestedOpener}</span>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cx('bubble', m.sender)}>
                    <span>{m.text}</span>
                    <span className="bubble-time">
                      {m.failed ? `Not sent — ${m.error || 'try again'}` : m.pending ? 'Sending…' : m.timestamp}
                      {m.id === lastMine?.id && m.seen !== undefined && (
                        <span className="row" style={{ '--gap': '3px', display: 'inline-flex', marginLeft: 6 }}>
                          {m.seen ? <CheckCheck size={13} /> : <Check size={13} />}{m.seen ? 'Seen' : 'Delivered'}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                <span className="row tiny muted" style={{ alignSelf: 'center', '--gap': '6px', marginTop: 8 }}>
                  <ShieldCheck size={13} color="var(--success)" /> Chats are never visible on a family dashboard.
                </span>
                {thread.candidateId && (
                  <div style={{ alignSelf: 'center' }}>
                    <SafetyActions member={{ id: thread.candidateId, firstName: thread.candidateName }} onDone={() => navigate('/messages')} />
                  </div>
                )}
              </div>

              {thread.isFormerMember ? (
                <div className="composer small muted" style={{ justifyContent: 'center' }}>
                  This member has left Sangam. Your conversation is kept for you.
                </div>
              ) : canChat ? (
                <form className="composer" onSubmit={send}>
                  <input className="input" placeholder={thread.needsMyResponse ? 'Reply to accept…' : 'Write a message…'} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
                  <button className="send-btn" type="submit" disabled={!text.trim()} aria-label="Send"><ArrowUp size={20} strokeWidth={2.6} /></button>
                </form>
              ) : (
                <div className="composer small muted" style={{ justifyContent: 'center' }}>
                  <InterestStatusNote thread={thread} />
                  {!waiting && thread.status !== 'declined' && 'You can’t message this member.'}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {user?.plan !== 'premium' && thread?.status === 'accepted' && <span className="tiny muted" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>Premium shows when your messages have been read.</span>}
    </div>
  );
}
