"use client";

import React, { useState, useRef } from "react";
import { UploadDropzone } from "@/components/studio/UploadDropzone";
import { VideoTrimmer } from "@/components/studio/VideoTrimmer";
import { ConversionSettings } from "@/components/studio/ConversionSettings";
import { ConvertingModal } from "@/components/studio/ConvertingModal";
import { GifResultViewer } from "@/components/studio/GifResultViewer";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ConversionStatus, GifItem } from "@/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function StudioPage() {
  const [videoData, setVideoData] = useState<{
    uploadKey: string;
    filename: string;
    streamUrl: string;
    duration: number;
  } | null>(null);

  // Conversion Parameters
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [fps, setFps] = useState(15);
  const [width, setWidth] = useState(480);
  const [loop, setLoop] = useState(true);

  // Conversion Polling State
  const [isConvertingModalOpen, setIsConvertingModalOpen] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>("queued");
  const [conversionProgress, setConversionProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Final Output
  const [convertedGif, setConvertedGif] = useState<GifItem | null>(null);

  const { refreshQuota } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleVideoReady = (data: {
    uploadKey: string;
    filename: string;
    streamUrl: string;
    duration: number;
  }) => {
    setVideoData(data);
    setStartTime(0);
    const initialEnd = Math.min(data.duration || 5, 5);
    setEndTime(parseFloat(initialEnd.toFixed(2)));
    setConvertedGif(null);
  };

  const handleStartConversion = async () => {
    if (!videoData) return;

    if (endTime <= startTime) {
      toastError("Invalid Range", "End time must be greater than start time.");
      return;
    }

    setIsConvertingModalOpen(true);
    setConversionStatus("queued");
    setConversionProgress(20);

    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Submit conversion job
      const job = await api.convert({
        upload_key: videoData.uploadKey,
        start_time: startTime,
        end_time: endTime,
        fps,
        width,
        loop,
      });

      // Step 2: Poll status
      const result = await api.pollConversion(job.job_id, {
        signal: abortControllerRef.current.signal,
        onStatus: (status, progress) => {
          setConversionStatus(status);
          if (progress) setConversionProgress(progress);
        },
      });

      if (result.status === "completed") {
        setConversionStatus("completed");
        setConversionProgress(100);

        const gifKey = result.gif_id || job.job_id;

        // Step 3: Fetch final GIF details to play the GIF directly
        let finalItem: GifItem;
        try {
          finalItem = await api.getGif(gifKey);
          if (!finalItem.url) {
            const dl = await api.getDownloadUrl(gifKey);
            finalItem.url = dl.url;
          }
        } catch {
          try {
            const dl = await api.getDownloadUrl(gifKey);
            finalItem = {
              key: gifKey,
              name: `${videoData.filename.replace(/\.[^/.]+$/, "")}.gif`,
              status: "public",
              url: dl.url,
              created_at: new Date().toISOString(),
            };
          } catch {
            finalItem = {
              key: gifKey,
              name: `${videoData.filename.replace(/\.[^/.]+$/, "")}.gif`,
              status: "public",
              url: "",
              created_at: new Date().toISOString(),
            };
          }
        }

        // Refresh quota in background
        refreshQuota();

        setTimeout(() => {
          setIsConvertingModalOpen(false);
          setConvertedGif(finalItem);
          toastSuccess("GIF Generated!", "Your video slice has been converted to GIF.");
        }, 600);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toastError("Conversion Cancelled", "Job polling was aborted.");
      } else {
        toastError("Conversion Failed", err?.error || "Error processing GIF conversion.");
      }
      setIsConvertingModalOpen(false);
    }
  };

  const handleCancelConversion = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsConvertingModalOpen(false);
  };

  const handleReset = () => {
    setVideoData(null);
    setConvertedGif(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb / Reset */}
      {videoData && !convertedGif && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Upload Different Video
          </Button>
          <div className="text-xs text-slate-400 font-mono">{videoData.filename}</div>
        </div>
      )}

      {/* Main Studio Stages */}
      {!videoData && !convertedGif ? (
        <UploadDropzone onVideoReady={handleVideoReady} />
      ) : convertedGif ? (
        <GifResultViewer
          gif={convertedGif}
          onReset={handleReset}
          onUpdateGif={(updated) => setConvertedGif(updated)}
        />
      ) : (
        <div className="space-y-6">
          <VideoTrimmer
            streamUrl={videoData.streamUrl}
            filename={videoData.filename}
            duration={videoData.duration}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
          />

          <ConversionSettings
            fps={fps}
            width={width}
            loop={loop}
            onFpsChange={setFps}
            onWidthChange={setWidth}
            onLoopChange={setLoop}
            onConvert={handleStartConversion}
            isConverting={isConvertingModalOpen}
          />
        </div>
      )}

      {/* Converting Polling Modal */}
      <ConvertingModal
        isOpen={isConvertingModalOpen}
        status={conversionStatus}
        progress={conversionProgress}
        onCancel={handleCancelConversion}
      />
    </div>
  );
}
