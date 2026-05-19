import { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { MessageSquare, Users } from 'lucide-react';
import { updateDoc, doc, arrayUnion, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { analyzeFeedbackSentiment } from '../services/ai';

export default function FeedbackClientPlayer({ leadId, reviewerId, url, uploadedAssets }: { leadId: string, reviewerId?: string, url?: string, uploadedAssets?: any[] }) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const getCleanUrl = (rawUrl?: string, assets?: any[]) => {
    if (assets && assets.length > 0) return assets[assets.length - 1].url;
    if (!rawUrl) {
       return "https://player.vimeo.com/video/1192000101";
    }
    if (rawUrl.trim().startsWith('<iframe')) {
      const srcMatch = rawUrl.match(/src="([^"]+)"/);
      if (srcMatch) return srcMatch[1];
    }
    return rawUrl;
  };

  const parsedUrl = getCleanUrl(url, uploadedAssets);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [duration, setDuration] = useState(0);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [remoteUsers, setRemoteUsers] = useState(0);
  
  const isLocalUpdate = useRef(false);
  const [actorId] = useState(() => reviewerId ? `reviewer_${reviewerId}` : `client_${Math.random().toString(36).substr(2, 9)}`);

  const syncState = useCallback((playing: boolean, time: number) => {
    isLocalUpdate.current = true;
    setDoc(doc(db, 'leads', leadId, 'session', 'active'), {
       isPlaying: playing,
       currentTime: time,
       updatedAt: serverTimestamp(),
       updatedBy: actorId
    }, { merge: true }).then(() => {
       setTimeout(() => { isLocalUpdate.current = false; }, 500);
    }).catch(e => console.error(e));
  }, [leadId, actorId]);

  const handleStartComment = useCallback(() => {
    setIsPlaying(false);
    syncState(false, currentTime);
    setCommenting(true);
  }, [currentTime, syncState]);

  useEffect(() => {
    const handleEvent = () => handleStartComment();
    window.addEventListener('ADD_TIMELINE_FEEDBACK', handleEvent);
    
    // Sync session presence
    const sessionRef = doc(db, 'leads', leadId, 'session', 'active');
    
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
       if (snap.exists()) {
          const data = snap.data();
          // Update remote count simple naive way: if updated recently, someone is there.
          const isRecent = data.updatedAt?.toDate && (Date.now() - data.updatedAt.toDate().getTime() < 10000);
          setRemoteUsers(isRecent && data.updatedBy !== actorId ? 1 : 0);

          if (data.updatedBy !== actorId && !isLocalUpdate.current) {
             if (playerRef.current) {
                 if (Math.abs(playerRef.current.getCurrentTime() - data.currentTime) > 1) {
                     playerRef.current.seekTo(data.currentTime);
                 }
                 // Not syncing play/pause directly automatically as iframes can be blocky about it, 
                 // but we'll reflect the state loosely
             }
          }
       }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('ADD_TIMELINE_FEEDBACK', handleEvent);
    };
  }, [leadId, actorId, syncState, handleStartComment]);

  const handlePlay = () => {
    setIsPlaying(true);
    syncState(true, playerRef.current?.getCurrentTime() || 0);
    if (!hasLoggedPlay && !window.location.search.includes('preview')) {
        setHasLoggedPlay(true);
        try {
            updateDoc(doc(db, 'leads', leadId), {
                telemetryEvents: arrayUnion({ type: 'VIDEO_PLAY', timestamp: new Date(), detail: `Client started playback at ${new Date().toLocaleTimeString()}` })
            }).catch(() => {});
// eslint-disable-next-line no-empty
        } catch {}
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    syncState(false, playerRef.current?.getCurrentTime() || 0);
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const sentiment = await analyzeFeedbackSentiment(commentText);
      await updateDoc(doc(db, 'leads', leadId), {
        feedback: arrayUnion({
          text: commentText,
          timestampPin: formatTime(currentTime),
          timestamp: new Date().toISOString(),
          type: reviewerId ? 'reviewer' : 'client',
          sentiment
        })
      });
      toast.success("Feedback submitted!");
      setCommentText('');
      setCommenting(false);
      
      // Briefly pause everyone so they see the comment
      syncState(false, currentTime);
    } catch {
      toast.error("Failed to submit feedback.");
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#000000] flex flex-col items-center justify-center relative group">
      {remoteUsers > 0 && (
         <div className="absolute top-4 right-4 z-50 bg-white/20 text-white/80 border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 animate-pulse backdrop-blur-md shadow-[0_4px_24px_rgba(255,255,255,0.15)] pointer-events-none">
            <Users size={12} />
            {reviewerId ? 'Client is watching live' : 'Editor is watching live'}
         </div>
      )}
      
      {/* Add Feedback button floats at top left so it doesn't block the video controls */}
      <div className="absolute top-4 left-4 z-50">
        <button onClick={handleStartComment} className="flex items-center gap-2 bg-black/60 hover:bg-black/80 border border-white/[0.1] px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-[0.1em] text-white shadow-xl backdrop-blur-md">
          <MessageSquare size={14} /> Add Note at {formatTime(currentTime)}
        </button>
      </div>
      
      <div className="w-full h-full relative z-10 pointer-events-auto">
        <Player
          ref={playerRef}
          url={parsedUrl}
          width="100%"
          height="100%"
          controls={true}
          playing={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onDuration={(d) => setDuration(d)}
          style={{ backgroundColor: 'black' }}
        />
      </div>

      {commenting && (
        <div className="absolute bottom-16 left-4 right-4 bg-[#000000]/90 border border-white/20 p-4 rounded-2xl flex items-start gap-4 z-50 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="text-zinc-100 font-mono text-xs font-bold bg-white/10 px-2 py-1 rounded shrink-0">
            {formatTime(currentTime)}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input 
               autoFocus
               type="text" 
               placeholder="Type your feedback here..." 
               className="w-full bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-white/60 font-body"
               value={commentText}
               onChange={e => setCommentText(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && submitComment()}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setCommenting(false)} className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono px-3 py-1 hover:text-white">Cancel</button>
              <button onClick={submitComment} className="text-[10px] bg-[var(--brand-primary)] text-white uppercase tracking-[0.1em] font-mono font-bold px-4 py-1.5 rounded-sm shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]">Send Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
