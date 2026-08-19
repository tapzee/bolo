"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, Reorder, useDragControls, DragControls } from "motion/react";
import type { PlayerRef } from "@remotion/player";
import {
  AlertTriangle,
  Download,
  Edit3,
  Film,
  Languages,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  GripHorizontal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  DEFAULT_STYLE_ID,
  INDIAN_LANGUAGES,
  WORLD_LANGUAGES,
  VIDEO_FPS,
  canvasForSource,
  formatDuration,
  getStyleDefaults,
  isResolutionAllowed,
  isStyleId,
  lowConfidenceIndices,
  msToFrames,
  languageForScript,
  scriptAppliesTo,
  scriptForLanguage,
  type CaptionScript,
  type CaptionStyleConfig,
  type CaptionWord,
  type StyleId,
  type ExportResolution,
} from "@/core";
import { buildCaptionPages } from "@/remotion/captions/build-pages";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Section } from "@/components/studio/StyleControls";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CaptionLines } from "@/components/editor/CaptionLines";
import {
  CropToolbar,
  cropCanvas,
  type CropMode,
} from "@/components/editor/CropToolbar";
import { TemplatesPanel } from "@/components/editor/TemplatesPanel";
import { TextPanel } from "@/components/editor/TextPanel";
import { CaptionDragLayer } from "@/components/editor/CaptionDragLayer";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { TransportBar } from "@/components/editor/TransportBar";
import { WordInspector } from "@/components/editor/WordInspector";
import {
  WordTimeline,
  type TimelineMode,
} from "@/components/editor/WordTimeline";
import { ExportPanel } from "@/components/export/ExportPanel";
import {
  exportDimensions,
  resolutionAvailability,
  supportsWebCodecs,
} from "@/lib/export/capabilities";
import { useVideoExport } from "@/lib/export/use-video-export";
import { useCredits } from "@/lib/credits/use-credits";
import { downloadSrt } from "@/lib/export/srt";
import { useCaptionEditor } from "@/lib/editor/use-caption-editor";
import { useCaptionPipeline } from "@/lib/media/use-caption-pipeline";
import { probeVideo } from "@/lib/media/probe-video";
import { useAutosave } from "@/lib/storage/use-autosave";
import type { ProjectSnapshot } from "@/lib/storage/project-store";
import { cacheVideo, projectIdForFile } from "@/lib/storage/video-cache";
import { storeForUser } from "@/lib/firebase/project-store";
import { useAuth } from "@/lib/firebase/auth-context";
import type { LanguageCode } from "@/lib/elevenlabs/types";
import { Dropzone } from "./Dropzone";
import { PipelineProgress } from "./PipelineProgress";
import { RecentProjects } from "./RecentProjects";

const PlayerStage = dynamic(() => import("@/components/studio/PlayerStage"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse rounded-2xl bg-surface-inset ring-hairline" />
  ),
});

/** Quick picks. The full catalogue lives in the dropdown beneath them. */
const QUICK_LANGUAGES: readonly SegmentedOption<LanguageCode>[] = [
  { value: "hi", label: "Hindi", hint: "Hindi script (अपना)" },
  { value: "hinglish" as LanguageCode, label: "Hinglish", hint: "English script (apna)" },
  { value: "en", label: "English", hint: "English-only speech" },
  { value: "auto", label: "Auto", hint: "Let the model detect it" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableRail({ id, as, className, style, initial, animate, transition, children }: any) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      as={as}
      className={className}
      style={style}
      dragListener={false}
      dragControls={controls}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {typeof children === "function" ? children(controls) : children}
    </Reorder.Item>
  );
}

export function CreateFlow() {
  const { state, start, cancel, reset, restore, retryTranscription } =
    useCaptionPipeline();
  const [restoreFailed, setRestoreFailed] = useState(false);
  /**
   * Captured the moment a restore fails, so re-dropping the clip can reattach
   * it to the existing project instead of starting a brand new one. Without
   * this, the file that comes back out of the dropzone has a fresh
   * `lastModified` (browsers don't preserve it across every re-download or
   * re-share), so it can never be trusted to reproduce the original project id.
   */
  const pendingRestoreRef = useRef<{
    projectId: string;
    title: string;
    words: readonly CaptionWord[];
    styleConfig: CaptionStyleConfig;
  } | null>(null);
  const { user } = useAuth();
  // Latin by default: Hinglish captions are what most reels here actually want,
  // and Devanagari is one dropdown away for the people who want it.
  const [language, setLanguage] = useState<LanguageCode>("hinglish");
  const [styleId, setStyleId] = useState<StyleId>(DEFAULT_STYLE_ID);
  const [overrides, setOverrides] = useState<Partial<CaptionStyleConfig>>({});
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("word");
  const [resolution, setResolution] = useState<ExportResolution>("1080p");
  const [crop, setCrop] = useState<CropMode>("original");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"styles" | "word" | "export">("styles");
  const [columnOrder, setColumnOrder] = useState(["styles", "script", "video"]);

  // The Player lives behind a dynamic import, so it does not exist on first
  // render. Held in state rather than a ref so effects depending on it re-run
  // the moment it mounts.
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      void stageContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.5, Math.round((z + 0.25) * 100) / 100));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageContainerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const editor = useCaptionEditor(state.words);

  const config = useMemo<CaptionStyleConfig>(() => {
    // Defensive check: if styleId is undefined or invalid (e.g. stale local storage or bad import)
    const validStyleId = isStyleId(styleId) ? styleId : "bold-yellow";
    return { ...getStyleDefaults(validStyleId), ...overrides };
  }, [styleId, overrides]);

  const applyTemplate = useCallback(
    (next: CaptionStyleConfig, appliedId: string | null) => {
      setStyleId(next.styleId);
      setOverrides(next);
      setTemplateId(appliedId);
    },
    [],
  );

  const patch = useCallback((next: Partial<CaptionStyleConfig>) => {
    setOverrides((prev) => ({ ...prev, ...next }));
  }, []);

  const previewWords = useDeferredValue(editor.words);
  const previewConfig = useDeferredValue(config);

  const pages = useMemo(
    () =>
      buildCaptionPages(previewWords, {
        styleId: previewConfig.styleId,
        combineWithinMs: previewConfig.combineWithinMs,
        maxWordsPerPage: previewConfig.maxWordsPerPage,
        linesPerPage: previewConfig.linesPerPage,
        fontSizePx: previewConfig.fontSizePx,
        letterSpacingPx: previewConfig.letterSpacingPx,
        wordGapPx: previewConfig.wordGapPx,
        lineHeight: previewConfig.lineHeight,
        maxLineWidthPct: previewConfig.maxLineWidthPct,
        maxBlockHeightPct: previewConfig.maxBlockHeightPct,
        annotationSizeRatio: previewConfig.annotationSizeRatio,
      }),
    [
      previewWords,
      previewConfig.styleId,
      previewConfig.combineWithinMs,
      previewConfig.maxWordsPerPage,
      previewConfig.linesPerPage,
      previewConfig.fontSizePx,
      previewConfig.letterSpacingPx,
      previewConfig.wordGapPx,
      previewConfig.lineHeight,
      previewConfig.maxLineWidthPct,
      previewConfig.maxBlockHeightPct,
      previewConfig.annotationSizeRatio,
    ],
  );

  const canvas = useMemo(() => {
    if (state.video === null) return { width: 1080, height: 1920 };
    const natural = canvasForSource(
      { width: state.video.width, height: state.video.height },
      "1080p",
    );
    return cropCanvas(natural, crop);
  }, [state.video, crop]);

  const snapshot = useMemo<ProjectSnapshot | null>(
    () =>
      state.stage === "ready" && state.video
        ? {
            // MUST be `projectIdForFile` — it is the same key the video cache
            // is written under, and reopening a project looks the video up by
            // the project id. Any other scheme silently breaks restore.
            id: state.file
              ? projectIdForFile(state.file)
              : "untitled-project",
            title: state.file ? state.file.name : "Untitled video",
            words: editor.words,
            styleConfig: config,
            durationSeconds: state.video.durationSeconds,
            sourceWidth: state.video.width,
            sourceHeight: state.video.height,
            updatedAt: Date.now(),
          }
        : null,
    [
      state.stage,
      state.video,
      state.file,
      editor.words,
      config,
    ],
  );

  const autosave = useAutosave(snapshot, state.stage === "ready");

  /**
   * Keeps `?project=<id>` in the address bar once a project is open.
   *
   * Nothing wrote this before: dropping and transcribing a clip left the URL
   * at a bare `/create`, so refreshing — or closing the tab and reopening it —
   * landed back on the empty upload screen with no idea a project existed,
   * rather than on the restore path below. `replaceState` rather than a
   * router navigation: this must not remount the editor or re-run the restore
   * effect, only make the current session bookmarkable/refreshable.
   */
  useEffect(() => {
    if (typeof window === "undefined" || snapshot === null) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("project") === snapshot.id) return;
    params.set("project", snapshot.id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [snapshot]);

  /**
   * Loads a saved project by id — shared by the `?project=` URL restore below
   * and by clicking a Recent Projects card directly (see `handleOpenProject`).
   */
  const openProject = useCallback(
    async (projectId: string) => {
      const store = storeForUser(user?.uid ?? null);
      const saved = await store.load(projectId);
      if (saved === null) {
        setRestoreFailed(true);
        return;
      }

      const ok = await restore(projectId, saved.words, saved.title);
      if (!ok) {
        // Captions survived but the cached video did not — browsers evict
        // IndexedDB under storage pressure. Ask for the file rather than
        // showing an editor with no footage. Kept around so the dropzone
        // below can reattach the re-dropped clip to this exact project
        // instead of starting a fresh, untranscribed one.
        pendingRestoreRef.current = {
          projectId,
          title: saved.title,
          words: saved.words,
          styleConfig: saved.styleConfig,
        };
        setRestoreFailed(true);
        return;
      }

      setOverrides(saved.styleConfig);
      setStyleId(isStyleId(saved.styleConfig.styleId) ? saved.styleConfig.styleId : "bold-yellow");
    },
    [restore, user?.uid],
  );

  /**
   * Reopens a project when arriving at `/create?project=<id>`.
   *
   * Runs once: `startedRestore` guards it because `restore` sets pipeline state,
   * which re-renders this component, which would otherwise restart the restore
   * in a loop.
   */
  const startedRestore = useRef(false);

  useEffect(() => {
    if (startedRestore.current) return;
    if (typeof window === "undefined") return;

    const projectId = new URLSearchParams(window.location.search).get("project");
    if (projectId === null) return;

    startedRestore.current = true;
    void openProject(projectId);
  }, [openProject]);

  /**
   * Handles a Recent Projects card click.
   *
   * Not a plain `<Link>` navigation: Recent Projects renders inside this same
   * `/create` route, so changing only the `?project=` query string does not
   * remount `CreateFlow` — the mount-only effect above never re-runs, and the
   * URL change alone loads nothing. This calls `openProject` directly instead,
   * and still pushes the URL so the address bar and back button stay correct.
   */
  const handleOpenProject = useCallback(
    (projectId: string) => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("project", projectId);
        window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
      }
      startedRestore.current = true;
      void openProject(projectId);
    },
    [openProject],
  );

  const durationInFrames = useMemo(
    () =>
      state.video === null ? 1 : Math.round(state.video.durationSeconds * VIDEO_FPS),
    [state.video],
  );
  const durationMs = useMemo(
    () => (state.video === null ? 1000 : Math.round(state.video.durationSeconds * 1000)),
    [state.video],
  );

  const seekMs = useCallback(
    (targetMs: number) => {
      const p = player;
      if (p !== null && typeof p.seekTo === "function") {
        p.seekTo(msToFrames(targetMs, VIDEO_FPS));
      }
    },
    [player],
  );

  const weakWords = useMemo(
    () => lowConfidenceIndices(editor.words),
    [editor.words],
  );

  const [capabilities, setCapabilities] = useState<{
    webcodecs: boolean;
    tiers: Record<ExportResolution, { allowed: boolean; reason: string | null }>;
  } | null>(null);

  useEffect(() => {
    setCapabilities({
      webcodecs: supportsWebCodecs(),
      tiers: {
        "720p": { allowed: resolutionAvailability("720p").allowed, reason: resolutionAvailability("720p").reason },
        "1080p": { allowed: resolutionAvailability("1080p").allowed, reason: resolutionAvailability("1080p").reason },
        "4k": { allowed: resolutionAvailability("4k").allowed, reason: resolutionAvailability("4k").reason },
      },
    });
  }, []);

  const sourceSize = useMemo(
    () =>
      state.video === null
        ? null
        : { width: state.video.width, height: state.video.height },
    [state.video],
  );

  const { entitlements } = useCredits();

  // Auto-clamp resolution if it exceeds the account's plan entitlement
  useEffect(() => {
    if (!isResolutionAllowed(resolution, entitlements.maxResolution)) {
      setResolution(entitlements.maxResolution);
    }
  }, [resolution, entitlements.maxResolution]);

  const exportState = useVideoExport({
    file: state.file,
    pages,
    config,
    source: sourceSize,
    resolution,
    watermark: !entitlements.watermarkFree,
  });

  // Smart behavior: When selecting a word, jump to it in playback and auto-open Word Edit tab
  const selectWord = useCallback(
    (index: number) => {
      editor.setSelected(index);
      const word = editor.words[index];
      if (word !== undefined) seekMs(word.startMs);
      setRightTab("word");
    },
    [editor, seekMs],
  );

  const handleFile = useCallback(
    (file: File) => {
      void start(file, language);
    },
    [start, language],
  );

  /**
   * Dropzone handler used while `restoreFailed` is showing.
   *
   * The banner promises the re-dropped clip won't be re-transcribed and won't
   * spend credits — so, unlike `handleFile`, this never calls `start`. It
   * caches the file under the *original* project id (its own `lastModified`
   * can't be trusted to reproduce that id — see `pendingRestoreRef`) and then
   * goes through the same `restore` used on a normal reopen, dropping the
   * saved words and style straight back in.
   */
  const handleRestoreFile = useCallback(
    (file: File) => {
      const pending = pendingRestoreRef.current;
      if (pending === null) {
        handleFile(file);
        return;
      }

      void (async () => {
        let video;
        try {
          video = await probeVideo(file);
        } catch {
          // Not a readable video — let the normal pipeline surface the error.
          handleFile(file);
          return;
        }
        URL.revokeObjectURL(video.objectUrl);

        await cacheVideo({
          id: pending.projectId,
          blob: file,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
          width: video.width,
          height: video.height,
          durationSeconds: video.durationSeconds,
          savedAt: Date.now(),
        });

        const ok = await restore(pending.projectId, pending.words, pending.title);
        if (!ok) {
          handleFile(file);
          return;
        }

        setOverrides(pending.styleConfig);
        setStyleId(
          isStyleId(pending.styleConfig.styleId) ? pending.styleConfig.styleId : "bold-yellow",
        );
        pendingRestoreRef.current = null;
        setRestoreFailed(false);
      })();
    },
    [handleFile, restore],
  );

  /* ===========================================================================
   * IDLE / UPLOAD ONBOARDING SCREEN (Redesigned 2-Column SaaS Grid)
   * =========================================================================== */
  if (state.stage === "idle") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Hero Value Proposition & Privacy Guarantees */}
          <div className="space-y-6 text-center lg:col-span-6 lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand shadow-sm">
              <Sparkles className="size-3.5 fill-brand/20" />
              <span>Next-Gen Video Styling & AI Captions</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12]">
              Supercharge Your Reels in <span className="text-brand">Seconds</span>
            </h1>

            <p className="text-base font-normal leading-relaxed text-muted-foreground sm:text-lg">
              Generate accurate word-level Hindi, Hinglish, and English subtitles. Customize with 50+ viral kinetic styles without ever sending heavy video files to a server.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-2 text-left sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-3 rounded-2xl border bg-card/60 p-3.5 shadow-sm transition-all hover:bg-card">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand font-bold">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Zero Video File Uploads</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your video never leaves your browser. Local rendering ensures instant speed and 100% data privacy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border bg-card/60 p-3.5 shadow-sm transition-all hover:bg-card">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand font-bold">
                  <Palette className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">50+ Viral Reels Templates</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose from Captik neon glows, Hormozi animations, kinetic Hinglish typography, and custom brand swatches.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Structured Step-by-Step Upload Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border bg-card/95 p-6 shadow-xl sm:p-8 space-y-7">
              <div className="space-y-1 text-center sm:text-left border-b pb-4 border-border/50">
                <h2 className="text-xl font-bold text-foreground">Create Video Captions</h2>
                <p className="text-xs text-muted-foreground">Follow these 2 quick steps to initialize your studio workspace.</p>
              </div>

              {/* Step 1: Language Picker */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-brand-foreground">1</span>
                    <span>Spoken Audio Language</span>
                  </label>
                  <Languages className="size-4 text-muted-foreground" />
                </div>

                <Segmented
                  options={QUICK_LANGUAGES}
                  value={
                    QUICK_LANGUAGES.some((option) => option.value === language)
                      ? language
                      : "hi"
                  }
                  onChange={setLanguage}
                  layoutId="language-pill"
                  label="Spoken language"
                />

                {/*
                  "hinglish" is deliberately absent from this list — it is a
                  script, not a dialect, and the picker below owns it. Passing
                  it as the value would render an empty trigger, since Radix
                  only falls back to the placeholder when the value is blank.
                */}
                <Select
                  value={language === "hinglish" ? "" : language}
                  onValueChange={setLanguage}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-background">
                    <SelectValue placeholder="More dialects & languages…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="auto">Auto-detect speech</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Indian languages</SelectLabel>
                      {INDIAN_LANGUAGES.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          <span className="font-medium">{option.label}</span>
                          {option.native ? (
                            <span className="ml-2 text-muted-foreground text-[11px]">
                              {option.native}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Other languages</SelectLabel>
                      {WORLD_LANGUAGES.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          <span className="font-medium">{option.label}</span>
                          {option.native ? (
                            <span className="ml-2 text-muted-foreground text-[11px]">
                              {option.native}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/*
                  Script picker. Only rendered for Hindi audio — there is no
                  Latin/Devanagari choice to make about a Tamil or Spanish clip,
                  and a control that does nothing is worse than a missing one.
                */}
                {scriptAppliesTo(language) ? (
                  <div className="space-y-1.5 pt-0.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Caption script
                    </label>
                    <Select
                      value={scriptForLanguage(language)}
                      onValueChange={(next) =>
                        setLanguage(languageForScript(next as CaptionScript))
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latin">
                          <span className="font-medium">Hinglish (Latin)</span>
                          <span className="ml-2 text-muted-foreground text-[11px]">
                            kya kar rahe ho
                          </span>
                        </SelectItem>
                        <SelectItem value="devanagari">
                          <span className="font-medium">Hindi (Devanagari)</span>
                          <span className="ml-2 text-muted-foreground text-[11px]">
                            क्या कर रहे हो
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {/* Step 2: Video Dropzone */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-extrabold text-brand-foreground">2</span>
                    <span>Drop Video Clip</span>
                  </label>
                  <Film className="size-4 text-muted-foreground" />
                </div>
                {/* Reopening a project whose cached video the browser has
                    evicted. The captions are safe — only the footage is gone —
                    so say exactly that instead of silently showing an empty
                    dropzone the user will read as lost work. */}
                {restoreFailed ? (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    <span>
                      Your captions and styling for this project are saved, but
                      the video itself is no longer cached in this browser. Drop
                      the same clip back in to carry on — nothing will be
                      re-transcribed and no credits are used.
                    </span>
                  </div>
                ) : null}

                <Dropzone onFile={restoreFailed ? handleRestoreFile : handleFile} />
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 border border-success/30 px-3 py-2.5 text-center text-xs text-foreground font-medium">
                <ShieldCheck className="size-4 text-success shrink-0" />
                <span>100% Client-side AI: Your raw video is never sent over the internet.</span>
              </div>
            </div>
          </div>
        </div>

        <RecentProjects onOpen={handleOpenProject} />
      </div>
    );
  }

  /* ===========================================================================
   * PIPELINE PROCESSING SCREEN
   * =========================================================================== */
  if (state.stage !== "ready") {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 lg:py-24">
        <PipelineProgress
          state={state}
          onCancel={cancel}
          onRetry={reset}
          onResume={() => void retryTranscription()}
        />
      </div>
    );
  }

  /* ===========================================================================
   * READY / STUDIO EDITOR WORKSPACE
   * =========================================================================== */
  const selectedWord =
    editor.selected === null ? undefined : editor.words[editor.selected];

  const allowedResolutions = (["720p", "1080p", "4k"] as const).filter(
    (tier) => capabilities?.tiers[tier]?.allowed ?? true,
  );

  return (
    <>
      <EditorTopBar
        title={state.file?.name ?? "Untitled Project"}
        durationSeconds={state.video?.durationSeconds ?? 0}
        resolution={resolution}
        onResolutionChange={setResolution}
        allowedResolutions={allowedResolutions}
        maxResolution={entitlements.maxResolution}
        saveStatus={autosave.status}
        saveError={autosave.error}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onDownloadSrt={() => downloadSrt(pages, state.file?.name ?? "captions")}
        onExport={() => void exportState.start()}
        exporting={exportState.phase === "exporting"}
        watermark={!entitlements.watermarkFree}
      />

      <Reorder.Group axis="x" values={columnOrder} onReorder={setColumnOrder} className="mx-auto flex w-full max-w-[1850px] flex-row overflow-x-auto gap-6 px-4 py-6 xl:px-6">
        {columnOrder.map((col) => {
          if (col === "script") return (
        /* =====================================================================
         * LEFT RAIL: SCRIPT & TIMELINE CONSOLE
         * ===================================================================== */
        <SortableRail key="script" id="script" as="aside" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="w-[280px] xl:w-[330px] shrink-0 min-w-0">
          {(dragControls: DragControls) => (
            <div className="rounded-2xl border bg-card/70 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5 border-border/50">
                <h2 className="text-xs font-bold tracking-wide text-foreground uppercase flex items-center gap-1.5">
                  <GripHorizontal onPointerDown={(e) => dragControls.start(e)} className="size-3.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors" />
                <Edit3 className="size-3.5 text-brand" />
                <span className="cursor-grab active:cursor-grabbing">Script & Captions</span>
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                {pages.length} pages
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground/80 leading-normal">
              Click any word below to jump to its timestamp or edit its exact spelling, line break, and highlight color.
            </p>

            <div className="space-y-2 pr-1">
              <CaptionLines
                pages={pages}
                words={editor.words}
                selectedIndex={editor.selected}
                onSelectWord={selectWord}
                onSetText={editor.actions.setText}
                onSplitAt={editor.actions.splitAt}
                accentColor={config.accentColor}
              />
            </div>
          </div>
          )}
        </SortableRail>
          );

          if (col === "video") return (
            <SortableRail key="video" id="video" as="div" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="w-auto flex-1 min-w-[320px] flex flex-col items-center gap-5 sticky top-20 z-30 pt-0 self-start" style={{ ["--stage-h" as string]: "clamp(240px, 45vh, 520px)" }}>
              {(dragControls: DragControls) => (
                <>
          {/* Top Video Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-2.5 shadow-2xl relative z-40"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal onPointerDown={(e) => dragControls.start(e)} className="size-4 text-white/40 hover:text-white/80 cursor-grab active:cursor-grabbing transition-colors" />
              <CropToolbar mode={crop} onChange={setCrop} canvas={canvas} />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleFullscreen}
                className="group flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-[11px] font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-inset ring-white/10"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen Preview (F)"}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-3.5 text-emerald-400/70 transition-colors group-hover:text-emerald-400" />
                ) : (
                  <Maximize2 className="size-3.5 text-emerald-400/70 transition-colors group-hover:text-emerald-400" />
                )}
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>

              <button
                onClick={reset}
                className="group flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-[11px] font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-inset ring-white/10"
                title="Replace current video clip"
              >
                <RotateCcw className="size-3.5 text-amber-400/70 transition-transform duration-300 group-hover:-rotate-90 group-hover:text-amber-400" />
                <span>Switch Video</span>
              </button>
            </div>
          </motion.div>

          {/* Video Stage Container (wraps preview frame & transport bar in fullscreen) */}
          <div
            ref={stageContainerRef}
            className={cn(
              "w-full flex flex-col items-center gap-4 transition-all relative",
              isFullscreen && "fixed inset-0 z-50 h-screen w-screen bg-black/95 p-4 flex flex-col items-center justify-between backdrop-blur-xl",
            )}
          >
            {/* Ambient Glow */}
            {!isFullscreen && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand/20 blur-[80px] rounded-full pointer-events-none -z-10" />
            )}

            {/* Video Preview Frame */}
            <div
              className="relative max-w-full rounded-[24px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 bg-black flex items-center justify-center ring-1 ring-white/5"
              style={{
                aspectRatio: `${canvas.width} / ${canvas.height}`,
                width: isFullscreen
                  ? `calc((100vh - 120px) * ${canvas.width / canvas.height})`
                  : `calc(var(--stage-h) * ${canvas.width / canvas.height})`,
                maxHeight: isFullscreen ? "calc(100vh - 120px)" : "var(--stage-h)",
              }}
            >
              {/* Zoom Scaled Stage */}
              <div
                className="relative w-full h-full transition-transform duration-150 ease-out"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                <ErrorBoundary label="Preview">
                  <PlayerStage
                    playerRef={setPlayer}
                    pages={pages}
                    config={previewConfig}
                    canvasWidth={canvas.width}
                    canvasHeight={canvas.height}
                    durationInFrames={durationInFrames}
                    videoSrc={state.video?.objectUrl ?? null}
                    controls={false}
                  />
                </ErrorBoundary>

                <CaptionDragLayer
                  config={config}
                  enabled
                  onMove={(horizontalOffsetPct, verticalOffsetPct) =>
                    patch({ horizontalOffsetPct, verticalOffsetPct })
                  }
                  onResize={({ fontSizePx, maxLineWidthPct }) =>
                    patch({ fontSizePx, maxLineWidthPct })
                  }
                />
              </div>

              {/* Grid & Safe Zone Guide Overlay */}
              {showGrid ? (
                <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                  {/* 3x3 Rule of thirds grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20 flex items-center justify-center">
                      {/* Center Crosshair */}
                      <div className="relative size-4">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-400/80 -translate-y-1/2 shadow-xs" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-400/80 -translate-x-1/2 shadow-xs" />
                      </div>
                    </div>
                    <div className="border-b border-white/20" />
                    <div className="border-r border-white/20" />
                    <div className="border-r border-white/20" />
                    <div />
                  </div>

                  {/* Social Media Safe Zone */}
                  <div className="absolute inset-x-[8%] top-[12%] bottom-[16%] rounded-lg border border-dashed border-amber-400/50 bg-amber-400/[0.03]">
                    <span className="absolute top-1 left-2 font-mono text-[9px] font-bold tracking-wider text-amber-400 uppercase">
                      Safe Zone (Reels / Shorts)
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Floating Quick Fullscreen overlay button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                className="absolute top-3 right-3 z-30 flex size-8 items-center justify-center rounded-lg bg-black/60 text-white/90 shadow-md backdrop-blur-md transition-all hover:bg-black/85 hover:scale-105 active:scale-95"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>
            </div>

            {/* Transport playback buttons & seek bar */}
            <div className={cn("w-full", isFullscreen && "max-w-2xl pb-2")}>
              <TransportBar
                player={player}
                durationInFrames={durationInFrames}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                showGrid={showGrid}
                onToggleGrid={toggleGrid}
              />
            </div>
          </div>

          {/* Timeline Deck Card */}
          <div className="w-full rounded-2xl border bg-card/80 p-4 shadow-sm space-y-3">
            <div className="flex w-full items-center justify-between gap-3 border-b pb-2 border-border/50 text-xs text-muted-foreground">
              <span className="font-medium text-foreground flex items-center gap-2">
                <span>{editor.words.length} words</span>
                <span>·</span>
                <span>{pages.length} pages</span>
                <span>·</span>
                <span className="font-mono">{state.video ? formatDuration(state.video.durationSeconds) : ""}</span>
              </span>
              {weakWords.length > 0 ? (
                <span className="rounded bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-warning flex items-center gap-1">
                  ⚠️ {weakWords.length} low-confidence words to verify
                </span>
              ) : null}
            </div>

            <WordTimeline
              words={editor.words}
              pages={pages}
              selectedIndex={editor.selected}
              onSelect={selectWord}
              onRetime={editor.actions.setTiming}
              onSeekMs={seekMs}
              durationMs={durationMs}
              player={player}
              peaks={state.peaks}
              mode={timelineMode}
              onModeChange={setTimelineMode}
            />
          </div>
                </>
              )}
            </SortableRail>
          );

          if (col === "styles") return (
            <SortableRail key="styles" id="styles" as="aside" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} className="w-[360px] xl:w-[400px] shrink-0 min-w-0 space-y-4">
              {(dragControls: DragControls) => (
                <>
          <div className="rounded-2xl border bg-card/80 p-4 shadow-sm space-y-5">
            
            {/* 3-Tab Main Navigation Inspector */}
            <div className="flex items-center gap-2 mb-3">
              <GripHorizontal onPointerDown={(e) => dragControls.start(e)} className="size-4 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors shrink-0" />
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1 cursor-grab active:cursor-grabbing">Editor Tools</div>
            </div>
            <div className="flex gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
              {[
                { id: "styles", label: "Styles & Design", icon: <Palette className="size-3.5" /> },
                { id: "word", label: "Word Edit", icon: <Edit3 className="size-3.5" />, activeBadge: selectedWord !== undefined },
                { id: "export", label: "Export & Render", icon: <Download className="size-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={rightTab === tab.id}
                  onClick={() =>
                    setRightTab(tab.id as "styles" | "word" | "export")
                  }
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 transition-all",
                    rightTab === tab.id
                      ? "bg-background text-foreground shadow-sm font-bold ring-1 ring-border/50"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                  )}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                  {tab.activeBadge && rightTab !== tab.id ? (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-brand animate-pulse" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {/* TAB 1: STYLES & DESIGN */}
                {rightTab === "styles" && (
                  <motion.div
                    key="styles"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <TemplatesPanel
                      config={config}
                      activeTemplateId={templateId}
                      onApply={applyTemplate}
                      patch={patch}
                    />
                    
                    {/* The raw motion-engine picker used to sit here. Removed: every
                        template already carries its engine, so exposing the five
                        engines separately gave two competing ways to change the
                        same thing and made the rail twice as long. */}
                    <div className="border-t border-border/50 pt-4">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <TextPanel config={config} patch={patch} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: WORD EDIT INSPECTOR */}
                {rightTab === "word" && (
                  <motion.div
                    key="word"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {selectedWord !== undefined && editor.selected !== null ? (
                      <Section title="Word Properties" hint={`Editing word #${editor.selected + 1} in your timeline`}>
                        <WordInspector
                          word={selectedWord}
                          index={editor.selected}
                          totalWords={editor.words.length}
                          onSetText={editor.actions.setText}
                          onSetColor={editor.actions.setColor}
                          onSetEmphasis={editor.actions.setEmphasis}
                          onSetRole={editor.actions.setRole}
                          onSplit={editor.actions.splitAt}
                          onMerge={editor.actions.mergeAt}
                          onClearBreak={editor.actions.clearBreak}
                          onDelete={editor.actions.remove}
                          onInsertAfter={editor.actions.insertAfter}
                        />
                      </Section>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/40 py-12 px-6 text-center text-muted-foreground">
                        <Edit3 className="size-8 text-muted-foreground/30" />
                        <p className="font-bold text-foreground text-sm">No Word Selected</p>
                        <p className="text-xs leading-relaxed max-w-[240px]">
                          Click any word on the left script panel or on the bottom audio timeline to alter its spelling, color, timing, and line breaks.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: EXPORT & RENDER SETTINGS */}
                {rightTab === "export" && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {state.file !== null && sourceSize !== null ? (
                      <>
                        <div className="space-y-3">
                          <h3 className="font-bold text-xs tracking-wide text-foreground uppercase flex items-center gap-1.5">
                            <Download className="size-3.5 text-brand" />
                            <span>Video Export & Quality</span>
                          </h3>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            Select your preferred render resolution and export directly using local hardware encoding.
                          </p>
                          <div className="rounded-xl border bg-background/50 p-3">
                            <ExportPanel
                              resolution={resolution}
                              onResolutionChange={setResolution}
                              availability={capabilities?.tiers ?? null}
                              webcodecsSupported={capabilities?.webcodecs ?? true}
                              dimensions={exportDimensions(sourceSize, resolution)}
                              sourceHeight={sourceSize.height}
                              watermark={!entitlements.watermarkFree}
                              maxResolution={entitlements.maxResolution}
                              exportState={exportState}
                            />
                          </div>
                        </div>

                        <div className="border-t pt-5 border-border/50 space-y-3">
                          <h3 className="font-bold text-xs tracking-wide text-foreground uppercase flex items-center gap-1.5">
                            <Layers className="size-3.5 text-brand" />
                            <span>SubRip (.srt) File</span>
                          </h3>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            Download standard `.srt` subtitles with exact word-level timing for Premiere Pro, CapCut, or direct social uploading.
                          </p>
                          <button
                            type="button"
                            onClick={() => downloadSrt(pages, state.file?.name ?? "captions")}
                            className="w-full rounded-xl border border-border bg-background py-2 text-xs font-bold text-foreground shadow-sm transition-all hover:bg-accent hover:border-border-strong"
                          >
                            Download .srt Subtitle File
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        Video file metadata loading...
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Security Reassurance Card */}
          <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[11px] leading-relaxed text-foreground shadow-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success font-bold" />
            <div>
              <strong className="font-bold">100% Private & Secure:</strong> Your video remained in this browser. Only{" "}
              <span className="font-mono font-semibold">{(state.audioBytes / 1024).toFixed(0)}KB</span> of extracted audio was sent for transcription.
            </div>
          </div>
                </>
              )}
            </SortableRail>
          );
          return null;
        })}
      </Reorder.Group>
    </>
  );
}
