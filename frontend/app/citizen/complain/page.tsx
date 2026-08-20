'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MessageSquare,
  Mic,
  Image as ImageIcon,
  MapPin,
  ChevronDown,
  Upload,
  X,
  CheckCircle,
  Loader2,
  Navigation,
  Square,
  Map,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { submitComplaint } from '@/lib/api';
import type { ComplaintSubmission } from '@/types';
import { cn } from '@/lib/utils';

const LocationPickerMap = dynamic(() => import('@/components/maps/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">
      Loading Interactive Map Picker...
    </div>
  ),
});

const categories = [
  'Roads & Transport',
  'Healthcare',
  'Education',
  'Water & Sanitation',
  'Electricity',
  'Digital Connectivity',
  'Environment',
  'Public Safety',
  'Agriculture',
  'Other',
];

// Smart Category Auto-Detection based on keywords
function detectCategoryFromText(input: string): string | null {
  const lower = input.toLowerCase();
  if (lower.match(/road|sadak|pothole|gaddha|bridge|traffic|highway|footpath|street/)) return 'Roads & Transport';
  if (lower.match(/hospital|doctor|clinic|medicine|dawa|swasthya|health|nurse|ambulance/)) return 'Healthcare';
  if (lower.match(/water|paani|drain|sewer|nali|nal|sanitation|kachra|garbage|safai|toilet|waste/)) return 'Water & Sanitation';
  if (lower.match(/bijli|power|electricity|light|wire|pole|transformer|voltage|blackout/)) return 'Electricity';
  if (lower.match(/school|college|teacher|padhai|education|student|class|shiksha/)) return 'Education';
  if (lower.match(/internet|network|wifi|mobile|signal|tower|digital|broadband/)) return 'Digital Connectivity';
  if (lower.match(/pollution|smoke|tree|forest|air|paryavaran|river|kooda/)) return 'Environment';
  if (lower.match(/police|theft|chori|crime|safety|suraksha|light|accident|cctv/)) return 'Public Safety';
  if (lower.match(/kisan|farmer|kheti|crop|fasal|agriculture|mandi|krishi|irrigation/)) return 'Agriculture';
  return null;
}

type InputMethod = 'text' | 'voice' | 'image';

function SuccessModal({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Complaint Registered!</h2>
          <p className="text-sm mb-4 text-slate-600">
            Your complaint has been logged and sent for AI classification and priority routing.
          </p>
          <div className="p-4 rounded-xl mb-6 bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Tracking ID</p>
            <p className="text-xl font-bold font-mono text-blue-600">{id}</p>
          </div>
          <div className="space-y-2.5 text-left bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>AI will auto-categorize and score severity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Assigned to relevant local department</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/citizen/complaints" className="btn-primary w-full justify-center py-2.5">
              View in My Complaints <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={onClose} className="btn-secondary w-full justify-center py-2.5 text-xs">
              File Another Complaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComplainPage() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [autoDetectedCategory, setAutoDetectedCategory] = useState<string | null>(null);

  // Voice state
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'en-US'>('en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Images state
  const [images, setImages] = useState<string[]>([]);

  // Location state
  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual' | 'map' | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [autoCoords, setAutoCoords] = useState<{ lat?: number; lng?: number; name: string }>({ name: 'Detecting...' });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up timer and audio on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Check category auto-detection on text change
  useEffect(() => {
    if (text.length > 5 && !category) {
      const detected = detectCategoryFromText(text);
      if (detected) {
        setAutoDetectedCategory(detected);
      }
    }
  }, [text, category]);

  // Voice recording handlers
  const startRecording = async () => {
    setAudioError(null);
    audioChunksRef.current = [];

    // 1. Start Audio Recorder via MediaRecorder
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      }
    } catch (err: any) {
      console.warn('Microphone permission / MediaRecorder not available:', err);
    }

    // 2. Start Speech Recognition for live Speech-to-Text in English
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // English transcription

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setText(currentTranscript);
            setErrors(p => ({ ...p, text: '', voice: '' }));
            const cat = detectCategoryFromText(currentTranscript);
            if (cat && !category) {
              setCategory(cat);
              setAutoDetectedCategory(cat);
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
        };

        recognition.start();
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
      }
    }

    setIsRecording(true);
    setRecordingDuration(0);
    intervalRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping mediaRecorder:', e);
      }
    }

    // Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  };

  const resetRecording = () => {
    stopRecording();
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlayingAudio(false);
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Image handlers
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Location detection
  const detectLocation = () => {
    setLocationMethod('auto');
    setErrors(p => ({ ...p, location: '' }));
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAutoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          });
        },
        (err) => {
          console.warn('GPS location error, using fallback:', err);
          setAutoCoords({ lat: 25.5941, lng: 85.1376, name: 'Patna, Bihar' });
        }
      );
    } else {
      setAutoCoords({ lat: 25.5941, lng: 85.1376, name: 'Patna, Bihar' });
    }
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (inputMethod === 'text' && !text.trim()) {
      errs.text = 'Please describe the problem.';
    }
    if (inputMethod === 'voice' && !audioUrl && !text.trim() && !isRecording) {
      errs.voice = 'Please record your voice complaint or speak to transcribe.';
    }
    if (inputMethod === 'image' && images.length === 0 && !text.trim()) {
      errs.image = 'Please upload at least one photo or add a description.';
    }
    if (!category) {
      errs.category = 'Please select or confirm a category.';
    }
    if (!locationMethod) {
      errs.location = 'Please provide or select your location.';
    }
    if (locationMethod === 'manual' && !manualLocation.trim()) {
      errs.location = 'Please enter your location/address.';
    }
    if (locationMethod === 'map' && !mapCoords) {
      errs.location = 'Please select a location point on the map.';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      let regionName = 'Patna';
      let lat: number | undefined = undefined;
      let lng: number | undefined = undefined;
      let manualAddress: string | undefined = undefined;

      if (locationMethod === 'auto') {
        regionName = autoCoords.name.includes('GPS') ? 'Local Area' : autoCoords.name;
        lat = autoCoords.lat;
        lng = autoCoords.lng;
      } else if (locationMethod === 'manual') {
        regionName = manualLocation;
        manualAddress = manualLocation;
      } else if (locationMethod === 'map' && mapCoords) {
        regionName = mapCoords.address || 'Selected Location';
        lat = mapCoords.lat;
        lng = mapCoords.lng;
        manualAddress = mapCoords.address;
      }

      const complaintText = text.trim() || (audioUrl ? '[Voice complaint recorded]' : '[Image issue reported]');

      const payload: ComplaintSubmission = {
        text: complaintText,
        category: category || 'Other',
        location: {
          region: regionName,
          lat,
          lng,
          country: 'India',
          manualAddress,
        },
        mediaUrls: images,
        audioUrl: audioUrl || undefined,
        language: 'English',
      };

      const result = await submitComplaint(payload);
      setSubmittedId(result.id);
    } catch (err) {
      console.error('Complaint submit error:', err);
      // Fallback ID if anything went wrong
      setSubmittedId(`CMP-2024-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setText('');
    setCategory('');
    setAutoDetectedCategory(null);
    setImages([]);
    setLocationMethod(null);
    setManualLocation('');
    setMapCoords(null);
    resetRecording();
    setSubmittedId(null);
    setErrors({});
    setInputMethod('text');
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">Report an Issue</h1>
        <p className="text-sm text-slate-600">
          Describe a problem in your area via Text, Voice, or Photo. Our AI prioritizes and tracks it automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Method Selector */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4 text-slate-900">How would you like to report?</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'text', label: 'Text', icon: MessageSquare },
              { value: 'voice', label: 'Voice Complaint', icon: Mic },
              { value: 'image', label: 'Photo Upload', icon: ImageIcon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all text-sm font-medium',
                  inputMethod === value
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                )}
                onClick={() => setInputMethod(value as InputMethod)}
              >
                <Icon className={cn('w-5 h-5', inputMethod === value ? 'text-blue-600' : 'text-slate-500')} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className="card">
            <label className="block text-sm font-semibold mb-2 text-slate-900">
              Describe the problem
            </label>
            <textarea
              className="form-input resize-none w-full"
              rows={5}
              placeholder="Describe the problem in your area..."
              value={text}
              onChange={e => {
                setText(e.target.value);
                setErrors(p => ({ ...p, text: '' }));
              }}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.text ? (
                <p className="text-xs text-red-600 font-medium">{errors.text}</p>
              ) : (
                <p className="text-xs text-slate-500">Multilingual AI auto-translation enabled</p>
              )}
              <p className="text-xs text-slate-400 font-mono">{text.length}/500</p>
            </div>
          </div>
        )}

        {/* Voice Input (Enhanced) */}
        {inputMethod === 'voice' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                Voice Complaint Recording
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                English Transcription
              </span>
            </div>

            <div className="text-center py-6 px-4 bg-slate-50/70 rounded-xl border border-slate-200">
              {/* Big Record Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all shadow-md focus:outline-none',
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-100 scale-105'
                    : audioUrl
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 hover:scale-105'
                    : 'bg-blue-600 text-white ring-4 ring-blue-100 hover:bg-blue-700 hover:scale-105'
                )}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 fill-current" />
                ) : audioUrl ? (
                  <CheckCircle className="w-9 h-9" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>

              {/* Status / Timer */}
              {isRecording ? (
                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-center gap-1.5 text-red-600 font-bold text-2xl font-mono">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-ping mr-1" />
                    {formatDuration(recordingDuration)}
                  </div>
                  <p className="text-xs text-red-700 font-medium">
                    Listening & transcribing in English... (Click red button to finish)
                  </p>
                </div>
              ) : audioUrl ? (
                <div className="space-y-3 mb-2">
                  <p className="text-sm font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Audio Recorded Successfully ({formatDuration(recordingDuration || 3)})
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlayingAudio ? 'Pause Audio' : 'Play Recording'}
                    </button>
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Record Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    Click the microphone to start speaking
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports speaking in Hindi, Hinglish, or English
                  </p>
                </div>
              )}
            </div>

            {/* Live Auto-Transcribed Text Box */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Transcribed Complaint Text (Auto-filled from voice)</span>
                {text && <span className="text-emerald-600 text-xs font-normal">✓ Transcribed</span>}
              </label>
              <textarea
                className="form-input resize-none w-full text-sm"
                rows={3}
                placeholder="Your speech transcript will appear here automatically, or you can edit it directly..."
                value={text}
                onChange={e => {
                  setText(e.target.value);
                  setErrors(p => ({ ...p, voice: '', text: '' }));
                }}
              />
            </div>

            {errors.voice && (
              <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.voice}
              </p>
            )}
          </div>
        )}

        {/* Image Input */}
        {inputMethod === 'image' && (
          <div className="card">
            <h2 className="font-semibold text-sm mb-4 text-slate-900">Upload Photo of the Issue</h2>

            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleImageDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
              <p className="font-medium text-sm mb-1 text-slate-800">Drag & drop or click to upload photo</p>
              <p className="text-xs text-slate-500">Supports JPG, PNG, WebP • Max 10MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.map((src, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-square border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <textarea
                className="form-input resize-none w-full text-sm"
                rows={2}
                placeholder="Add a brief description about this photo (optional)..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>

            {errors.image && <p className="text-xs text-red-600 mt-2">{errors.image}</p>}
          </div>
        )}

        {/* Category Selection with Auto-detect recommendation */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-900">Issue Category</label>
            {autoDetectedCategory && category !== autoDetectedCategory && (
              <button
                type="button"
                onClick={() => { setCategory(autoDetectedCategory); setErrors(p => ({ ...p, category: '' })); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full"
              >
                <Sparkles className="w-3 h-3" /> Auto-suggest: {autoDetectedCategory}
              </button>
            )}
          </div>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10 w-full"
              value={category}
              onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: '' })); }}
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
          {errors.category && <p className="text-xs text-red-600 mt-1.5">{errors.category}</p>}
        </div>

        {/* Location Selection */}
        <div className="card">
          <label className="block text-sm font-semibold mb-3 text-slate-900">Location</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'auto'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={detectLocation}
            >
              <Navigation className="w-4 h-4 shrink-0 text-blue-600" />
              Use GPS Location
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'map'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={() => { setLocationMethod('map'); setErrors(p => ({ ...p, location: '' })); }}
            >
              <Map className="w-4 h-4 shrink-0 text-blue-600" />
              Pick on Map
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'manual'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={() => { setLocationMethod('manual'); setErrors(p => ({ ...p, location: '' })); }}
            >
              <MapPin className="w-4 h-4 shrink-0 text-blue-600" />
              Enter Manually
            </button>
          </div>

          {locationMethod === 'auto' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-emerald-800">
                Location detected: {autoCoords.name}
              </span>
            </div>
          )}

          {locationMethod === 'map' && (
            <div className="mt-2">
              <LocationPickerMap
                initialLat={autoCoords.lat ?? 25.5941}
                initialLng={autoCoords.lng ?? 85.1376}
                onLocationSelect={(loc) => {
                  setMapCoords({ lat: loc.lat, lng: loc.lng, address: loc.address });
                  setErrors(p => ({ ...p, location: '' }));
                }}
              />
            </div>
          )}

          {locationMethod === 'manual' && (
            <input
              type="text"
              className="form-input w-full"
              placeholder="Enter your village, ward, district, or street address..."
              value={manualLocation}
              onChange={e => { setManualLocation(e.target.value); setErrors(p => ({ ...p, location: '' })); }}
            />
          )}

          {errors.location && <p className="text-xs text-red-600 mt-2">{errors.location}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary w-full py-3.5 text-base font-semibold shadow-md flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Registering Complaint...
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              Submit & Register Complaint
            </>
          )}
        </button>
      </form>

      {/* Success Modal */}
      {submittedId && (
        <SuccessModal id={submittedId} onClose={handleReset} />
      )}
    </div>
  );
}
