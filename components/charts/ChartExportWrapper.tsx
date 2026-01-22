"use client";

import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { toPng } from "html-to-image";
import FileSaver from "file-saver";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { useTheme } from "@/components/common/ThemeProvider";

export type ExportScale = 1 | 2 | 3;
export type ExportAspectRatio = "horizontal" | "vertical" | "square";

export interface ChartExportHandle {
  exportChart: () => Promise<Blob | null>;
}

interface ChartExportWrapperProps {
  children: React.ReactNode;
  filename: string;
  title: string;
  scale?: ExportScale;
  aspectRatio?: ExportAspectRatio;
  showExportButton?: boolean;
  analysisText?: string;
  onAnalysisTextChange?: (text: string) => void;
  showAnalysisInput?: boolean;
}

const ASPECT_RATIO_LABELS: Record<ExportAspectRatio, string> = {
  horizontal: "가로형 (16:9)",
  vertical: "세로형 (9:16)",
  square: "정방형 (1:1)",
};

export const ChartExportWrapper = forwardRef<ChartExportHandle, ChartExportWrapperProps>(
  (
    {
      children,
      filename,
      title,
      scale = 2,
      aspectRatio = "horizontal",
      showExportButton = true,
      analysisText = "",
      onAnalysisTextChange,
      showAnalysisInput = false,
    },
    ref
  ) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const { theme } = useTheme();

    const backgroundColor = theme === "dark" ? "#0a0a0a" : "#ffffff";
    const textColor = theme === "dark" ? "#fafafa" : "#0a0a0a";

    const exportChart = useCallback(async (): Promise<Blob | null> => {
      if (!chartRef.current) return null;

      try {
        const dataUrl = await toPng(chartRef.current, {
          quality: 1.0,
          pixelRatio: scale,
          cacheBust: true,
          backgroundColor,
        });

        const response = await fetch(dataUrl);
        return await response.blob();
      } catch (error) {
        console.error("Chart export failed:", error);
        return null;
      }
    }, [scale, backgroundColor]);

    const handleExport = useCallback(async () => {
      setIsExporting(true);
      try {
        const blob = await exportChart();
        if (blob) {
          const timestamp = new Date().toISOString().slice(0, 10);
          const ratioSuffix = aspectRatio === "horizontal" ? "h" : aspectRatio === "vertical" ? "v" : "sq";
          FileSaver.saveAs(blob, `${filename}-${ratioSuffix}-${timestamp}.png`);
        }
      } finally {
        setIsExporting(false);
      }
    }, [exportChart, filename, aspectRatio]);

    useImperativeHandle(ref, () => ({
      exportChart,
    }));

    const aspectRatioClass =
      aspectRatio === "horizontal" ? "aspect-video" : aspectRatio === "vertical" ? "aspect-[9/16]" : "aspect-square";

    return (
      <div className="chart-export-wrapper space-y-4">
        <div className="chart-export-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showExportButton && (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? "내보내는 중..." : "PNG 저장"}
            </Button>
          )}
        </div>

        <div
          ref={chartRef}
          className={`chart-export-content rounded-lg p-4 ${aspectRatioClass} flex flex-col justify-center`}
          style={{ backgroundColor, color: textColor }}
        >
          <div className="chart-export-children flex-1 min-h-0">{children}</div>

          {showAnalysisInput && analysisText && (
            <div className="chart-analysis-text mt-4 pt-4 border-t border-current/20">
              <p className="text-sm opacity-70 whitespace-pre-wrap">{analysisText}</p>
            </div>
          )}
        </div>

        {showAnalysisInput && onAnalysisTextChange && (
          <div className="chart-analysis-input">
            <label className="text-sm font-medium mb-2 block">분석 글 (이미지에 포함됨)</label>
            <Textarea
              placeholder="차트에 대한 분석이나 설명을 입력하세요..."
              value={analysisText}
              onChange={(e) => onAnalysisTextChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}
      </div>
    );
  }
);

ChartExportWrapper.displayName = "ChartExportWrapper";
