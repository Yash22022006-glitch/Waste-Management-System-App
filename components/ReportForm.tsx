import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Send, X, Trash2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Bin } from '../types';

interface ReportFormProps {
  bins: Bin[];
  onSubmit: (issue: string, binId?: string, location?: { lat: number; lng: number }, imageUrl?: string) => void;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ bins, onSubmit, isLoading, error, success }) => {
  const [issue, setIssue] = useState<string>('');
  const [selectedBinId, setSelectedBinId] = useState<string>('');
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleGetLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUseCurrentLocation(true);
        },
        (err) => {
          console.error("Error getting location:", err);
          setLocationError(`Geolocation error: ${err.message}`);
          setUseCurrentLocation(false);
          setCurrentLocation(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setUseCurrentLocation(false);
      setCurrentLocation(null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(`Failed to access camera: ${err.message || 'Permission denied.'}`);
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let reportLocation: { lat: number; lng: number } | undefined = undefined;
    if (useCurrentLocation && currentLocation) {
      reportLocation = currentLocation;
    } else if (selectedBinId) {
        const selectedBin = bins.find(b => b.id === selectedBinId);
        if (selectedBin) {
            reportLocation = selectedBin.location;
        }
    }

    onSubmit(issue, selectedBinId || undefined, reportLocation, photo || undefined);
    if (success) {
      setIssue('');
      setSelectedBinId('');
      setUseCurrentLocation(false);
      setCurrentLocation(null);
      setLocationError(null);
      setPhoto(null);
      stopCamera();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-6 max-w-lg mx-auto mb-10"
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className="bg-primary-100 p-2.5 rounded-2xl text-primary-600">
          <FileText size={24} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Report Issue</h2>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-2xl border border-red-100">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center space-x-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
          <CheckCircle2 size={18} />
          <p>Report submitted successfully!</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="issue" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
          Description
        </label>
        <textarea
          id="issue"
          name="issue"
          rows={3}
          required
          className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent transition-all text-sm"
          placeholder="What's the problem? (e.g. overflowing, damaged)"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          disabled={isLoading}
        ></textarea>
      </div>

      <div className="space-y-2">
        <label htmlFor="binId" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
          Related Bin (Optional)
        </label>
        <select
          id="binId"
          name="binId"
          className="block w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent transition-all text-sm appearance-none"
          value={selectedBinId}
          onChange={(e) => setSelectedBinId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a Bin</option>
          {bins.map((bin) => (
            <option key={bin.id} value={bin.id}>
              {bin.serialNumber} (Fill: {bin.fillLevel}%)
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${useCurrentLocation ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Use Location</p>
            <p className="text-[10px] text-gray-500 uppercase font-medium">Auto-detect position</p>
          </div>
        </div>
        <input
          id="useCurrentLocation"
          name="useCurrentLocation"
          type="checkbox"
          className="h-6 w-6 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500"
          checked={useCurrentLocation}
          onChange={(e) => {
            setUseCurrentLocation(e.target.checked);
            if (e.target.checked && !currentLocation) {
              handleGetLocation();
            } else if (!e.target.checked) {
                setCurrentLocation(null);
                setLocationError(null);
            }
          }}
          disabled={isLoading}
        />
      </div>
      
      {locationError && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-1">{locationError}</p>
      )}

      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
          Photo Evidence
        </label>
        
        {!photo && !isCameraActive && (
          <button
            type="button"
            onClick={startCamera}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all"
          >
            <Camera size={24} />
            <span className="font-bold text-sm">Open Camera</span>
          </button>
        )}

        {isCameraActive && (
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-inner">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline></video>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 px-4">
              <button
                type="button"
                onClick={takePhoto}
                className="bg-white text-gray-900 p-4 rounded-full shadow-xl active:scale-90 transition-transform"
              >
                <Camera size={24} />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="bg-red-500 text-white p-4 rounded-full shadow-xl active:scale-90 transition-transform"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        {photo && (
          <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-lg">
            <img src={photo} alt="Evidence" className="w-full h-auto" />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white p-2 rounded-xl hover:bg-black/70 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center space-x-2 py-4 bg-primary-600 text-white rounded-2xl text-base font-black hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary-200"
        disabled={isLoading || issue.trim() === ''}
      >
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <Send size={18} />
            <span>Submit Report</span>
          </>
        )}
      </button>
    </motion.form>
  );
};

export default ReportForm;