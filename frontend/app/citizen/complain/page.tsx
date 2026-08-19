'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  MessageSquare,
  Mic,
  MicOff,
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

type InputMethod = 'text' | 'voice' | 'image';

function SuccessModal({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#DCFCE7' }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--primary)' }}>Complaint Submitted!</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Your complaint has been received and will be processed by our AI system.
          </p>
          <div className="p-3 rounded-lg mb-6" style={{ background: 'var(--background)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Your Complaint ID</p>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent)' }}>{id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              ✓ AI classification will complete in ~2 minutes<br />
              ✓ You will receive status updates automatically<br />
              ✓ Track progress in My Complaints
            </p>
          </div>
          <button onClick={onClose} className="btn-primary w-full mt-6">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComplainPage() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual' | 'map' | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    intervalRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHasRecording(true);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!text && inputMethod === 'text') errs.text = 'Please describe the issue.';
    if (!category) errs.category = 'Please select a category.';
    if (!locationMethod) errs.location = 'Please provide your location.';
    if (locationMethod === 'manual' && !manualLocation) errs.location = 'Please enter your location.';
    if (locationMethod === 'map' && !mapCoords) errs.location = 'Please pick a point on the map.';
    return errs;
  };

  const [autoCoords, setAutoCoords] = useState<{ lat?: number; lng?: number; name: string }>({ name: 'Detecting...' });

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
          console.warn('GPS location error, using default:', err);
          setAutoCoords({ lat: 26.7606, lng: 83.3732, name: 'Gorakhpur, Uttar Pradesh' });
        }
      );
    } else {
      setAutoCoords({ lat: 26.7606, lng: 83.3732, name: 'Gorakhpur, Uttar Pradesh' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
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
        regionName = mapCoords.address;
        lat = mapCoords.lat;
        lng = mapCoords.lng;
        manualAddress = mapCoords.address;
      }

      const payload: ComplaintSubmission = {
        text: text || '[Voice complaint recorded]',
        category,
        location: {
          region: regionName,
          lat,
          lng,
          country: 'India',
          manualAddress,
        },
        mediaUrls: images,
        language: 'en',
      };
      const result = await submitComplaint(payload);
      setSubmittedId(result.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setText('');
    setCategory('');
    setImages([]);
    setLocationMethod(null);
    setManualLocation('');
    setMapCoords(null);
    setHasRecording(false);
    setRecordingDuration(0);
    setSubmittedId(null);
    setErrors({});
    setInputMethod('text');
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary)' }}>Report an Issue</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Describe a problem in your area. Our AI will classify and prioritise your complaint automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Method Selector */}
        <div className="card">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--primary)' }}>How would you like to report?</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'text', label: 'Text', icon: MessageSquare },
              { value: 'voice', label: 'Voice', icon: Mic },
              { value: 'image', label: 'Image', icon: ImageIcon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all text-sm font-medium',
                  inputMethod === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-500'
                )}
                onClick={() => setInputMethod(value as InputMethod)}
                style={{ background: inputMethod === value ? '#EFF6FF' : undefined }}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className="card">
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--primary)' }}>
              Describe the problem
            </label>
            <textarea
              className="form-input resize-none"
              rows={5}
              placeholder="Describe the problem in your area... (You can write in any language)"
              value={text}
              onChange={e => { setText(e.target.value); setErrors(p => ({ ...p, text: '' })); }}
            />
            <div className="flex justify-between mt-2">
              {errors.text && <p className="text-xs text-red-600">{errors.text}</p>}
              <p className="text-xs ml-auto" style={{ color: 'var(--foreground-muted)' }}>{text.length}/500</p>
            </div>
          </div>
        )}

        {/* Voice Input */}
        {inputMethod === 'voice' && (
          <div className="card text-center py-8">
            <h2 className="font-semibold text-sm mb-6" style={{ color: 'var(--primary)' }}>Voice Complaint</h2>

            {!hasRecording ? (
              <>
                <div
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer transition-all',
                    isRecording
                      ? 'animate-pulse-ring'
                      : 'hover:scale-105'
                  )}
                  style={{ background: isRecording ? '#FEE2E2' : '#EFF6FF', border: `3px solid ${isRecording ? '#DC2626' : '#2563EB'}` }}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording
                    ? <Square className="w-8 h-8 text-red-600" />
                    : <Mic className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                  }
                </div>

                {isRecording && (
                  <div className="mb-4">
                    <p className="text-2xl font-mono font-bold text-red-600 mb-1">{formatDuration(recordingDuration)}</p>
                    <p className="text-sm text-red-500 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Recording...
                    </p>
                  </div>
                )}

                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  {isRecording ? 'Click to stop recording' : 'Click the microphone to start recording'}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--foreground-muted)' }}>Supports all languages • Will be auto-transcribed</p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: '#DCFCE7', border: '3px solid #16A34A' }}>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold" style={{ color: 'var(--primary)' }}>Recording saved ({formatDuration(recordingDuration)})</p>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-full w-3/4 rounded-full" style={{ background: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>{formatDuration(recordingDuration)}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => { setHasRecording(false); setRecordingDuration(0); }}
                >
                  Record again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Image Input */}
        {inputMethod === 'image' && (
          <div className="card">
            <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--primary)' }}>Upload Photo of the Issue</h2>

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
              <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--foreground-muted)' }} />
              <p className="font-medium text-sm mb-1" style={{ color: 'var(--foreground)' }}>Drag & drop or click to upload</p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Supports JPG, PNG, WebP • Max 10MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.map((src, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Also show text area for context */}
            <div className="mt-4">
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="Add a brief description (optional)..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Category */}
        <div className="card">
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--primary)' }}>Category</label>
          <div className="relative">
            <select
              className="form-input appearance-none pr-10"
              value={category}
              onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: '' })); }}
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }} />
          </div>
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
        </div>

        {/* Location */}
        <div className="card">
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--primary)' }}>Location</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'auto'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={detectLocation}
            >
              <Navigation className="w-4 h-4 shrink-0" />
              Use GPS Location
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'map'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={() => { setLocationMethod('map'); setErrors(p => ({ ...p, location: '' })); }}
            >
              <Map className="w-4 h-4 shrink-0 text-blue-600" />
              Select on Map
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-xs font-medium transition-all justify-center',
                locationMethod === 'manual'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-slate-200 hover:border-blue-300 text-slate-600'
              )}
              onClick={() => { setLocationMethod('manual'); setErrors(p => ({ ...p, location: '' })); }}
            >
              <MapPin className="w-4 h-4 shrink-0" />
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
              className="form-input"
              placeholder="Enter your village, district, or city..."
              value={manualLocation}
              onChange={e => { setManualLocation(e.target.value); setErrors(p => ({ ...p, location: '' })); }}
            />
          )}

          {errors.location && <p className="text-xs text-red-600 mt-2">{errors.location}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Submit Complaint
            </>
          )}
        </button>
      </form>

      {submittedId && (
        <SuccessModal id={submittedId} onClose={handleReset} />
      )}
    </div>
  );
}
