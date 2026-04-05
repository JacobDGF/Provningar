import { Heart, MessageCircle, Send, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Post } from '../types';

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

  const submitReply = () => {
    if (!replyText.trim()) return;
    addReply(post.id, replyText.trim());
    setReplyText('');
    setShowReplies(true);
    setShowReplyInput(false);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Author */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 text-sm">{post.userName}</span>
                {post.userId !== 'me' && (
                  <button
                    onClick={() => toggleFollow(post.userId)}
                    className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isFollowing ? 'Följer' : 'Följ'}
                  </button>
                )}
              </div>
              <span className="text-gray-400 text-xs flex-shrink-0">{timeAgo(post.createdAt)}</span>
            </div>
            {post.subject && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{post.subject}</span>
            )}
          </div>
        </div>

        <p className="text-gray-800 text-sm leading-relaxed mt-3">{post.content}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map(t => (
              <span key={t} className="text-blue-500 text-xs">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-gray-50 pt-3">
        <button
          onClick={() => toggleLikePost(post.id)}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <Heart
            size={18}
            className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}
          />
          <span className={isLiked ? 'text-red-500' : 'text-gray-500'}>{post.likes}</span>
        </button>
        <button
          onClick={() => { setShowReplies(v => !v); }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500"
        >
          <MessageCircle size={18} className="text-gray-400" />
          {post.replies.length > 0 ? post.replies.length : 'Svara'}
        </button>
        <button
          onClick={() => setShowReplyInput(v => !v)}
          className="ml-auto text-blue-600 text-xs font-semibold"
        >
          {showReplyInput ? 'Avbryt' : 'Skriv svar'}
        </button>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="px-4 pb-3 flex gap-2">
          <img src={currentUser.avatar} alt="Du" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 flex gap-2 bg-gray-100 rounded-xl px-3 py-2">
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
              <Send size={16} className={replyText.trim() ? 'text-blue-600' : 'text-gray-300'} />
            </button>
          </div>
        </div>
      )}

      {/* Replies toggle */}
      {post.replies.length > 0 && (
        <button
          onClick={() => setShowReplies(v => !v)}
          className="w-full text-xs text-gray-500 font-medium py-2 border-t border-gray-50 flex items-center justify-center gap-1"
        >
          {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showReplies ? 'Dölj svar' : `Visa ${post.replies.length} svar`}
        </button>
      )}

      {/* Replies */}
      {showReplies && post.replies.length > 0 && (
        <div className="border-t border-gray-50 bg-gray-50">
          {post.replies.map(reply => {
            const replyLiked = reply.likedBy.includes('me');
            return (
              <div key={reply.id} className="px-4 py-3 flex gap-2.5">
                <img src={reply.userAvatar} alt={reply.userName} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-800">{reply.userName}</span>
                      <span className="text-gray-400 text-xs">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
                  </div>
                  <button
                    onClick={() => toggleLikeReply(post.id, reply.id)}
                    className="flex items-center gap-1 mt-1 ml-2 text-xs"
                  >
                    <Heart
                      size={13}
                      className={replyLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}
                    />
                    <span className={replyLiked ? 'text-red-500' : 'text-gray-400'}>{reply.likes}</span>
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
  const { posts, addPost, currentUser } = useStore();
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const SUBJECTS_FILTER = ['all', 'Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik'];

  const filteredPosts = posts.filter(p =>
    activeFilter === 'all' || p.subject === activeFilter
  );

  const handlePost = () => {
    if (!newPost.trim()) return;
    addPost(newPost.trim(), newSubject || undefined);
    setNewPost('');
    setNewSubject('');
    setShowCompose(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            <p className="text-gray-500 text-sm">Tips, frågor & erfarenheter</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Subject filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUBJECTS_FILTER.map(s => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {s === 'all' ? 'Alla ämnen' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Inga inlägg för det här ämnet än.
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCompose(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nytt inlägg</h2>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <img src={currentUser.avatar} alt="Du" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Dela tips, ställ frågor eller berätta om dina erfarenheter..."
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none min-h-[100px]"
                autoFocus
              />
            </div>

            {/* Subject select */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Ämne (valfritt)</p>
              <div className="flex flex-wrap gap-2">
                {['Matematik', 'Engelska', 'Svenska', 'Biologi', 'Kemi', 'Fysik', 'Historia', 'Samhällskunskap', 'Psykologi'].map(s => (
                  <button
                    key={s}
                    onClick={() => setNewSubject(newSubject === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      newSubject === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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
              className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors"
            >
              Publicera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
