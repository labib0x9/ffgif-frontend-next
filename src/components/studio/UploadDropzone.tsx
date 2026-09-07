"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Film,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes, formatDuration } from "@/lib/utils";
import { api, MAX_UPLOAD_BYTES } from "@/lib/api";
import { LastUploadMetadata } from "@/types";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/errors";

export interface UploadDropzoneProps {
  onVideoReady: (videoData: {
    uploadKey: string;
    filename: string;
    streamUrl: string;
    duration: number;
    file?: File;
  }) => void;
}

export function UploadDropzone({ onVideoReady }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<LastUploadMetadata | null>(null);
  const [isLoadingLast, setIsLoadingLast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    // Check if there is a last uploaded video
    const fetchLast = async () => {
      try {
        const last = await api.getLastUpload();
        if (last && last.key) {
          setLastUpload(last);
        }
      } catch {
        // ignore if none exists
      }
    };
    fetchLast();
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Client-side validations
    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isExtValid = ["mp4", "mov", "webm", "avi"].includes(ext || "");

    if (!validTypes.includes(file.type) && !isExtValid) {
      toastError("Invalid Format", "Please upload a supported video file (.mp4, .mov, .webm, .avi).");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toastError(
        "File Too Large",
        `Video size (${formatBytes(file.size)}) exceeds the maximum limit of ${formatBytes(
          MAX_UPLOAD_BYTES
        )}.`
      );
      return;
    }

    // Step 1: Request presigned PUT URL
    setUploadProgress(0);
    setProcessingStatus("Generating secure upload URL...");

    try {
      const presigned = await api.createUpload(file.name);
      const uploadKey = presigned.key;

      // Step 2: Direct-to-MinIO PUT upload with progress tracking
      setProcessingStatus("Uploading video directly to storage...");
      await api.uploadToPresignedUrl(presigned.upload_url, file, (percent) => {
        setUploadProgress(percent);
      });

      // Step 3: Poll status until "ok"
      setProcessingStatus("Processing & indexing video...");
      await api.pollUploadStatus(uploadKey);

      // Step 4: Retrieve stream URL or fallback to local object URL
      let streamUrl = "";
      try {
        const streamRes = await api.getStreamUrl(uploadKey);
        streamUrl = streamRes.url;
      } catch {
        streamUrl = URL.createObjectURL(file);
      }

      // Read duration
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = streamUrl || URL.createObjectURL(file);
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration || 10;
        toastSuccess("Video Ready!", `${file.name} uploaded successfully.`);
        onVideoReady({
          uploadKey,
          filename: file.name,
          streamUrl: streamUrl || tempVideo.src,
          duration,
          file,
        });
      };
      tempVideo.onerror = () => {
        // Fallback default duration
        onVideoReady({
          uploadKey,
          filename: file.name,
          streamUrl: streamUrl || URL.createObjectURL(file),
          duration: 15,
          file,
        });
      };
    } catch (err: any) {
      setUploadProgress(null);
      setProcessingStatus(null);
      toastError("Upload Failed", getApiErrorMessage(err, "Could not complete video upload."));
    }
  };

  const handleLoadLastUpload = async () => {
    if (!lastUpload) return;
    setIsLoadingLast(true);
    try {
      const streamRes = await api.getStreamUrl(lastUpload.key);
      toastSuccess("Video Loaded", `Loaded last session video: ${lastUpload.filename}`);
      onVideoReady({
        uploadKey: lastUpload.key,
        filename: lastUpload.filename,
        streamUrl: streamRes.url,
        duration: lastUpload.duration_sec || 10,
      });
    } catch (err: any) {
      toastError("Error Loading Video", getApiErrorMessage(err, "Could not load stream URL for last video."));
    } finally {
      setIsLoadingLast(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="space-y-6">
      {/* Last Upload Quick Banner */}
      {lastUpload && !isUploading && (
        <div className="p-4 rounded-2xl bg-surface-100/90 border border-indigo-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Previous Session Video
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-white/5 text-slate-400">
                  {formatDuration(lastUpload.duration_sec)}
                </span>
              </div>
              <p className="text-sm font-bold text-white truncate max-w-sm">
                {lastUpload.filename}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleLoadLastUpload}
            isLoading={isLoadingLast}
            leftIcon={<Play className="w-3.5 h-3.5" />}
            className="shrink-0 w-full sm:w-auto"
          >
            Load This Video
          </Button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-indigo-400 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20"
            : "border-white/15 bg-surface-100/70 hover:border-indigo-500/50 hover:bg-surface-100/90"
        } ${isUploading ? "pointer-events-none opacity-90" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.webm,.avi,video/mp4,video/quicktime,video/webm,video/x-msvideo"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {isUploading ? (
          <div className="max-w-md mx-auto space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-indigo-500/30">
              <div className="w-full h-full bg-surface-200 rounded-[14px] flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-indigo-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Uploading to Cloud Storage
              </h3>
              <p className="text-xs text-slate-400">{processingStatus}</p>
            </div>

            <ProgressBar
              progress={uploadProgress}
              isIndeterminate={uploadProgress === 100}
              color="indigo"
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-5">
            <div className="w-18 h-18 rounded-3xl bg-surface-50 border border-white/10 flex items-center justify-center mx-auto shadow-xl shadow-black/40 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-9 h-9 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Drop your video here or{" "}
                <span className="text-indigo-400 hover:underline">browse files</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct high-speed presigned upload to MinIO storage. Max 200MB.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {["MP4", "MOV", "WEBM", "AVI"].map((format) => (
                <span
                  key={format}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/5 text-slate-300 border border-white/5"
                >
                  .{format.toLowerCase()}
                </span>
              ))}
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Up to 60s recommended</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
