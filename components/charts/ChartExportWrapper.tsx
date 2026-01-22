"use client";

import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { toPng } from "html-to-image";
import FileSaver from "file-saver";
import { Button } from "@/components/ui/Button";
import { Download, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";

export type ExportScale = 1 | 2 | 3;

export interface ChartExportHandle {
  exportChart: () => Promise<Blob | null>;
}

interface ChartExportWrapperProps {
  children: React.ReactNode;
  filename: string;
  title: string;
  scale?: ExportScale;
  showExportButton?: boolean;
  analysisText?: string;
  onAnalysisTextChange?: (text: string) => void;
  showAnalysisInput?: boolean;
}

export const ChartExportWrapper = forwardRef<ChartExportHandle, ChartExportWrapperProps>(
  (
    {
      children,
      filename,
      title,
      scale = 2,
      showExportButton = true,
      analysisText = "",
      onAnalysisTextChange,
      showAnalysisInput = false,
    },
    ref
  ) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const exportChart = useCallback(async (): Promise<Blob | null> => {
      if (!chartRef.current) return null;

      try {
        const dataUrl = await toPng(chartRef.current, {
          quality: 1.0,
          pixelRatio: scale,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });

        const response = await fetch(dataUrl);
        return await response.blob();
      } catch (error) {
        console.error("Chart export failed:", error);
        return null;
      }
    }, [scale]);

    const handleExport = useCallback(async () => {
      setIsExporting(true);
      try {
        const blob = await exportChart();
        if (blob) {
          const timestamp = new Date().toISOString().slice(0, 10);
          FileSaver.saveAs(blob, `${filename}-${timestamp}.png`);
        }
      } finally {
        setIsExporting(false);
      }
    }, [exportChart, filename]);

    useImperativeHandle(ref, () => ({
      exportChart,
    }));

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

        <div ref={chartRef} className="chart-export-content bg-white rounded-lg p-4">
          {children}

          {showAnalysisInput && analysisText && (
            <div className="chart-analysis-text mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisText}</p>
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
