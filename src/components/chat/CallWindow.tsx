import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import AgoraRTC, { type IAgoraRTCClient, type IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { getAgoraToken } from "@/services/agora";

type CallState = "ringing" | "connected" | "ended";

interface CallWindowProps {
  callerName: string;
  callerInitial: string;
  mode: "video" | "voice";
  onEnd: () => void;
  compact?: boolean;
  channelName?: string;
  uid?: number;
}

export default function CallWindow({ callerName, callerInitial, mode, onEnd, compact = false, channelName = "internship-voice-call", uid = 1 }: CallWindowProps) {
  const [state, setState] = useState<CallState>("ringing");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Connecting…");
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localAudioContainerRef = useRef<HTMLDivElement | null>(null);

  const agoraUid = useMemo(() => uid || 1, [uid]);

  // Video calling isn't implemented yet — every call currently connects as
  // voice-only, regardless of how the meeting was scheduled. This flag just
  // controls the one-time notice shown to the user.
  const isVideoRequested = mode === "video";

  useEffect(() => {
    if (state === "connected") {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    const initCall = async () => {
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        setStatusMessage("Voice calling is unavailable in this environment");
        return;
      }

      try {
        const response = await getAgoraToken(channelName, agoraUid);
        if (!response.success || !response.token || !response.appId) {
          setStatusMessage(response.message || "Unable to start voice call");
          return;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (_user, mediaType) => {
          await client.subscribe(_user, mediaType);
          if (mediaType === "audio") {
            const remoteAudioTrack = _user.audioTrack;
            if (remoteAudioTrack) {
              remoteAudioTrack.play();
            }
          }
        });

        client.on("user-left", () => {
          if (!cancelled) {
            setStatusMessage("Remote user left");
          }
        });

        await client.join(response.appId, channelName, response.token, agoraUid);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        audioTrackRef.current = audioTrack;
        await client.publish(audioTrack);
        if (!cancelled) {
          setState("connected");
          setStatusMessage(isVideoRequested ? "Connected (voice only — video coming soon)" : "Connected");
        }
      } catch (error) {
        console.error("Agora voice call failed", error);
        if (!cancelled) {
          setStatusMessage("Unable to start voice call");
        }
      }
    };

    void initCall();

    return () => {
      cancelled = true;
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
      }
      if (clientRef.current) {
        void clientRef.current.leave();
      }
    };
  }, [agoraUid, channelName, isVideoRequested]);

  const handleEnd = () => {
    setState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioTrackRef.current) {
      audioTrackRef.current.close();
      audioTrackRef.current = null;
    }
    if (clientRef.current) {
      void clientRef.current.leave();
    }
    setTimeout(onEnd, 1200);
  };

  const toggleMute = async () => {
    if (!audioTrackRef.current) return;
    const nextMuted = !muted;
    audioTrackRef.current.setEnabled(!nextMuted);
    setMuted(nextMuted);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md",
      compact && "rounded-xl inset-auto bottom-20 right-6 w-80 h-[28rem] shadow-2xl border"
    )}>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className={cn(
          "rounded-full bg-primary/10 border-4 flex items-center justify-center font-bold text-primary transition-all",
          state === "ringing" ? "h-28 w-28 text-4xl border-primary/40 animate-pulse" : "h-24 w-24 text-3xl border-primary/20"
        )}>
          {callerInitial}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">{callerName}</h2>
          <p className="text-sm text-muted-foreground">
            {state === "ringing" && statusMessage}
            {state === "connected" && formatTime(elapsed)}
            {state === "ended" && "Call ended"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          {isVideoRequested ? "Voice Call (video coming soon)" : "Voice Call"}
        </div>

        {state !== "ended" && (
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant={muted ? "destructive" : "secondary"}
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={toggleMute}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={handleEnd}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
      <div ref={localAudioContainerRef} />
    </div>
  );
}