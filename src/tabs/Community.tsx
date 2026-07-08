import { Heart, MessageCircle, Send, Plus, X, ChevronDown, ChevronUp, Users, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Post, PostKind } from '../types';

const KINDS: { value: PostKind; label: string; emoji: string; color: string }[] = [
  { value: 'fråga', label: 'Fråga', emoji: '❓', color: 'bg-brand-100 text-brand-700' },
  { value: 'tips', label: 'Tips', emoji: '💡', color: 'bg-amber-accent-50 text-amber-accent' },
  { value: 'diskussion', label: 'Diskussion', emoji: '💬', color: 'bg-sand text-ink-soft' },
  { value: 'seger', label: 'Seger', emoji: '🎉', color: 'bg-trust-50 text-trust-700' },
];

function kindMeta(kind?: PostKind) {
  return KINDS.find(k => k.value === kind);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d sedan`;
  if (hours > 0) return `${hours}h sedan`;
  if (mins > 0) return `${mins}m sedan`;
  return 'Nu nyss';
}

function PostCard({ post }: { post: Post }) {
  const { toggleLikePost, toggleLikeReply, addReply, currentUser, toggleFollow } = useStore();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const isLiked = post.likedBy.includes('me');
  const isFollowing = currentUser.following.includes(post.userId);
  const meta = kindMeta(post.kind);

  const submitReply = () => {
    if (!replyText.trim()) return;
    addReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplies(true);
    setShowReplyInput(false);
  };

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-line">
      {/* Author */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm">{post.userName}</span>
                {post.userId !== 'me' && (
                  <button
                    onClick={() => toggleFollow(post.userId)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isFollowing ? 'bg-sand text-ink-soft' : 'bg-brand-500 text-white'
                    }`}
                  >
                    {isFollowing ? 'Följer' : '+ Följ'}
                  </button>
                )}
              </div>
              <span className="text-ink-faint text-xs flex-shrink-0">{timeAgo(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {meta && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                  {meta.emoji} {meta.label}
                </span>
              )}
              {post.subject && (
                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{post.subject}</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-ink text-[15px] leading-relaxed mt-3">{post.content}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map(t => (
              <span key={t} className="text-brand-500 text-xs">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-line pt-3">
        <button onClick={() => toggleLikePost(post.id)} className="flex items-center gap-1.5 text-sm font-semibold active:scale-95 transition-transform">
          <Heart size={19} className={isLiked ? 'text-red-500 fill-red-500' : 'text-ink-faint'} />
          <span className={isLiked ? 'text-red-500' : 'text-ink-soft'}>{post.likes}</span>
        </button>
        <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <MessageCircle size={19} className="text-ink-faint" />
          {post.replies.length > 0 ? post.replies.length : 'Svara'}
        </button>
        <button onClick={() => setShowReplyInput(v => !v)} className="ml-auto text-brand-600 text-xs font-bold">
          {showReplyInput ? 'Avbryt' : 'Skriv svar'}
        </button>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="px-4 pb-3 flex gap-2">
          <img src={currentUser.avatar} alt="Du" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 flex gap-2 bg-sand rounded-xl px-3 py-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReply()}
              placeholder="Skriv ett svar..."
              className="flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            <button onClick={submitReply} disabled={!replyText.trim()}>
              <Send size={16} className={replyText.trim() ? 'text-brand-600' : 'text-ink-faint'} />
            </button>
          </div>
        </div>
      )}

      {/* Replies toggle */}
      {post.replies.length > 0 && (
        <button
          onClick={() => setShowReplies(v => !v)}
          className="w-full text-xs text-ink-soft font-semibold py-2 border-t border-line flex items-center justify-center gap-1"
        >
          {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showReplies ? 'Dölj svar' : `Visa ${post.replies.length} svar`}
        </button>
      )}

      {/* Replies */}
      {showReplies && post.replies.length > 0 && (
        <div className="border-t border-line bg-sand/60">
          {post.replies.map(reply => {
            const replyLiked = reply.likedBy.includes('me');
            return (
              <div key={reply.id} className="px-4 py-3 flex gap-2.5">
                <img src={reply.userAvatar} alt={reply.userName} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="bg-surface rounded-xl px-3 py-2 border border-line">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink">{reply.userName}</span>
                      <span className="text-ink-faint text-xs">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed">{reply.content}</p>
                  </div>
                  <button onClick={() => toggleLikeReply(post.id, reply.id)} className="flex items-center gap-1 mt-1 ml-2 text-xs">
                    <Heart size={13} className={replyLiked ? 'text-red-500 fill-red-500' : 'text-ink-faint'} />
                    <span className={replyLiked ? 'text-red-500' : 'text-ink-faint'}>{reply.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Community() {
  const { posts, addPost, currentUser, setShowingFaq } = useStore();
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newKind, setNewKind] = useState<PostKind>('fråga');
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTERS = ['all', 'fråga', 'tips', 'diskussion', 'seger'];

  const filteredPosts = posts.filter(p => activeFilter === 'all' || p.kind === activeFilter);

  const handlePost = () => {
    if (!newPost.trim()) return;
    addPost(newPost.trim(), newSubject || undefined, newKind);
    setNewPost('');
    setNewSubject('');
    setNewKind('fråga');
    setShowCompose(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface px-4 lg:px-8 pt-14 lg:pt-8 pb-4 sticky top-0 z-30 border-b border-line">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 lg:w-14 lg:h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-sm shadow-brand-200 flex-shrink-0">
                <Users size={22} className="text-white lg:w-7 lg:h-7" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-ink font-display">Community</h1>
                <p className="text-ink-soft text-sm lg:text-base">Fråga, dela tips & inspireras</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowingFaq(true)}
                aria-label="Vanliga frågor"
                className="w-10 h-10 bg-sand rounded-2xl flex items-center justify-center active:scale-90 hover:bg-line transition-colors lg:hidden"
              >
                <HelpCircle size={20} className="text-ink-soft" />
              </button>
              <button
                onClick={() => setShowCompose(true)}
                className="w-10 h-10 lg:w-12 lg:h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200 active:scale-90 hover:bg-brand-600 transition-colors"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Kind filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-colors ${
                  activeFilter === f ? 'bg-ink text-white' : 'bg-sand text-ink-soft hover:bg-line'
                }`}
              >
                {f === 'all' ? 'Allt' : `${kindMeta(f as PostKind)?.emoji} ${kindMeta(f as PostKind)?.label}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-8">
        <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-ink-faint">Inga inlägg i den här kategorin än.</div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center" onClick={() => setShowCompose(false)}>
          <div className="bg-cream w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl p-6 animate-sheet-up lg:max-h-[85vh] lg:overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink font-display">Nytt inlägg</h2>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 bg-sand rounded-full flex items-center justify-center">
                <X size={16} className="text-ink-soft" />
              </button>
            </div>

            {/* Kind picker */}
            <div className="flex gap-2 mb-4">
              {KINDS.map(k => (
                <button
                  key={k.value}
                  onClick={() => setNewKind(k.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    newKind === k.value ? 'bg-brand-500 text-white' : 'bg-surface text-ink-soft border border-line'
                  }`}
                >
                  {k.emoji} {k.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-4">
              <img src={currentUser.avatar} alt="Du" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Dela tips, ställ frågor eller berätta om dina erfarenheter..."
                className="flex-1 bg-surface border border-line rounded-2xl px-4 py-3 text-sm text-ink placeholder-ink-faint outline-none resize-none min-h-[100px]"
                autoFocus
              />
            </div>

            {/* Subject select */}
            <div className="mb-4">
              <p className="text-xs text-ink-soft font-semibold mb-2">Ämne (valfritt)</p>
              <div className="flex flex-wrap gap-2">
                {['Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik', 'Historia', 'Samhällskunskap', 'Psykologi'].map(s => (
                  <button
                    key={s}
                    onClick={() => setNewSubject(newSubject === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newSubject === s ? 'bg-brand-500 text-white' : 'bg-surface text-ink-soft border border-line'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={!newPost.trim()}
              className="w-full bg-brand-500 disabled:bg-sand disabled:text-ink-faint text-white font-bold py-4 rounded-2xl text-base transition-colors active:scale-98"
            >
              Publicera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
