
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Square, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { SpeechRecognition } from '@/types';

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  onAudioSaved?: (audioUrl: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptReady, onAudioSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setTranscript("");
    setAudioUrl(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (onAudioSaved) {
          onAudioSaved(url);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start speech recognition
      initSpeechRecognition();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };
  
  const initSpeechRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Transcription Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsTranscribing(true);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setIsTranscribing(false);
      };
      
      recognition.onend = () => {
        setIsTranscribing(false);
        if (transcript) {
          onTranscriptReady(transcript);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      toast({
        title: "Transcription Error",
        description: "Could not initialize speech recognition.",
        variant: "destructive"
      });
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleSaveAudio = () => {
    if (audioUrl && transcript) {
      onTranscriptReady(transcript);
      if (onAudioSaved) {
        onAudioSaved(audioUrl);
      }
      toast({
        title: "Voice Note Saved",
        description: "Your voice note has been transcribed and saved."
      });
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioUrl) return;
    
    if (!audioPlayerRef.current) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="border p-4 rounded-md mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Voice Note</h3>
          <div className="flex items-center gap-2">
            {isRecording ? (
              <motion.div
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md text-xs font-medium flex items-center gap-1"
              >
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                RECORDING
              </motion.div>
            ) : audioUrl ? (
              <div className="text-sm font-medium text-green-600">Recording completed</div>
            ) : null}
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording && !audioUrl && (
            <Button 
              type="button"
              onClick={startRecording}
              size="sm"
              className="bg-assistant-primary"
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button 
              type="button"
              onClick={stopRecording}
              size="sm"
              variant="destructive"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          )}
          
          {audioUrl && (
            <>
              <Button
                type="button"
                onClick={toggleAudioPlayback}
                size="sm"
                variant="secondary"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                onClick={handleSaveAudio}
                size="sm"
                className="bg-assistant-primary"
              >
                <Save className="mr-2 h-4 w-4" />
                Use Transcription
              </Button>
            </>
          )}
        </div>
        
        {(isTranscribing || transcript) && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Transcription:</p>
            <div className="p-3 bg-muted/50 rounded-md text-sm max-h-32 overflow-y-auto">
              {transcript || (
                <span className="text-muted-foreground">
                  {isTranscribing ? "Listening..." : "No transcription yet"}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Hidden audio player for internal use */}
        {audioUrl && (
          <audio src={audioUrl} className="hidden" />
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
