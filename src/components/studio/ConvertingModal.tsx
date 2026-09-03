"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConversionStatus } from "@/types";
import { Flame, CheckCircle2 } from "lucide-react";

export interface ConvertingModalProps {
  isOpen: boolean;
  status: ConversionStatus;
  progress?: number;
  onCancel: () => void;
}

export function ConvertingModal({
  isOpen,
  status,
  progress = 0,
  onCancel,
}: ConvertingModalProps) {
  const getStatusDetails = () => {
    switch (status) {
      case "queued":
        return {
          title: "Job Queued in RabbitMQ",
          description: "Waiting for worker allocation in conversion pipeline...",
          step: 1,
        };
      case "converting":
        return {
          title: "Rendering GIF via FFmpeg",
          description: "Generating 256-color palette & high-FPS frames...",
          step: 2,
        };
      case "completed":
        return {
          title: "Conversion Completed!",
          description: "Finalizing GIF output and indexing in your library...",
          step: 3,
        };
      default:
        return {
          title: "Processing...",
          description: "Please hold on while FFgif engine processes your clip.",
          step: 1,
        };
    }
  };

  const { title, description, step } = getStatusDetails();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="md" showCloseButton={false}>
      <div className="text-center py-6 px-2 space-y-6">
        {/* Animated Visual Ring */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 animate-spin-slow opacity-60 blur-md" />
          <div className="relative w-20 h-20 rounded-full bg-surface-200 border border-white/10 flex items-center justify-center shadow-2xl">
            {status === "completed" ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-in zoom-in" />
            ) : (
              <Flame className="w-10 h-10 text-indigo-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Steps Pipeline Visualizer */}
        <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-2">
          {[
            { num: 1, name: "Queued" },
            { num: 2, name: "Converting" },
            { num: 3, name: "Done" },
          ].map((item) => {
            const isCurrent = step === item.num;
            const isDone = step > item.num;
            return (
              <div
                key={item.num}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/20"
                    : isDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-surface-50 border-white/5 text-slate-500"
                }`}
              >
                <span className="text-[10px] font-mono font-bold block">STEP 0{item.num}</span>
                <span className="text-xs font-semibold">{item.name}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="max-w-sm mx-auto pt-2">
          <ProgressBar
            progress={progress || (status === "queued" ? 25 : status === "converting" ? 75 : 100)}
            isIndeterminate={status !== "completed"}
            color="indigo"
            showPercent={false}
          />
        </div>

        {/* Cancel Button */}
        {status !== "completed" && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-white"
            >
              Cancel Conversion
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
