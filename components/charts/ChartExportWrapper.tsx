"use client";

import { useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { toPng } from "html-to-image";
import FileSaver from "file-saver";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/common/ThemeProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";

export type ExportScale = 1 | 2 | 3;
export type ExportAspectRatio = "horizontal" | "vertical" | "square";

export interface ChartExportHandle {
  exportChart: (scale?: ExportScale, aspectRatio?: ExportAspectRatio) => Promise<Blob | null>;
}

interface ChartExportWrapperProps {
  children: React.ReactNode;
  filename: string;
  title: string;
  showExportButton?: boolean;
  onExportAll?: () => void;
  isExportingAll?: boolean;
}

const ASPECT_RATIOS: Record<ExportAspectRatio, number> = {
  horizontal: 16 / 9,
  vertical: 9 / 16,
  square: 1,
};

function fitToAspectRatio(dataUrl: string, aspectRatio: ExportAspectRatio, backgroundColor: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetRatio = ASPECT_RATIOS[aspectRatio];
      const imgRatio = img.width / img.height;

      let canvasWidth: number;
      let canvasHeight: number;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        canvasWidth = img.width;
        canvasHeight = img.width / targetRatio;
        offsetY = (canvasHeight - img.height) / 2;
      } else {
        canvasHeight = img.height;
        canvasWidth = img.height * targetRatio;
        offsetX = (canvasWidth - img.width) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/png",
        1.0
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export const ChartExportWrapper = forwardRef<ChartExportHandle, ChartExportWrapperProps>(
  ({ children, filename, title, showExportButton = true, onExportAll, isExportingAll = false }, ref) => {
    const captureRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScale, setSelectedScale] = useState<ExportScale>(2);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<ExportAspectRatio>("horizontal");
    const { theme } = useTheme();

    const backgroundColor = theme === "dark" ? "#0a0a0a" : "#ffffff";

    const exportChart = useCallback(
      async (
        scale: ExportScale = selectedScale,
        aspectRatio: ExportAspectRatio = selectedAspectRatio
      ): Promise<Blob | null> => {
        if (!captureRef.current) return null;

        try {
          const dataUrl = await toPng(captureRef.current, {
            quality: 1.0,
            pixelRatio: scale,
            cacheBust: true,
            backgroundColor,
            filter: (node) => {
              if (node instanceof Element && node.classList.contains("chart-export-button-group")) {
                return false;
              }
              return true;
            },
          });

          const blob = await fitToAspectRatio(dataUrl, aspectRatio, backgroundColor);
          return blob;
        } catch (error) {
          console.error("Chart export failed:", error);
          return null;
        }
      },
      [selectedScale, selectedAspectRatio, backgroundColor]
    );

    const handleExport = useCallback(async () => {
      setIsModalOpen(false);
      setIsExporting(true);
      try {
        const blob = await exportChart(selectedScale, selectedAspectRatio);
        if (blob) {
          const timestamp = new Date().toISOString().slice(0, 10);
          const ratioSuffix =
            selectedAspectRatio === "horizontal" ? "h" : selectedAspectRatio === "vertical" ? "v" : "sq";
          FileSaver.saveAs(blob, `${filename}-${ratioSuffix}-${timestamp}.png`);
        }
      } finally {
        setIsExporting(false);
      }
    }, [exportChart, filename, selectedScale, selectedAspectRatio]);

    const openExportModal = useCallback(() => {
      setIsModalOpen(true);
    }, []);

    useImperativeHandle(ref, () => ({
      exportChart,
    }));

    const isAnyExporting = isExporting || isExportingAll;

    return (
      <div className="chart-export-wrapper">
        <div ref={captureRef} className="chart-export-capture bg-background p-4">
          <div className="chart-export-header flex items-center justify-between mb-3 gap-2">
            <h2 className="chart-export-title text-base sm:text-lg font-semibold">{title}</h2>
            {showExportButton && (
              <div className="chart-export-button-group flex flex-shrink-0 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openExportModal}
                  disabled={isAnyExporting}
                  className="gap-1 rounded-r-none border-r-0"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isExporting ? "저장 중..." : "저장"}</span>
                </Button>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isAnyExporting} className="px-1.5 rounded-l-none">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem onClick={openExportModal} disabled={isAnyExporting}>
                      <Download className="h-4 w-4 mr-2" />
                      이미지 저장
                    </DropdownMenuItem>
                    {onExportAll && (
                      <DropdownMenuItem onClick={onExportAll} disabled={isAnyExporting}>
                        <Download className="h-4 w-4 mr-2" />
                        전체 저장
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="chart-export-content">{children}</div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[340px] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>이미지 저장 옵션</DialogTitle>
            </DialogHeader>
            <div className="export-options-form grid gap-4 py-4">
              <div className="export-option-scale">
                <label className="text-sm font-medium mb-2 block">해상도</label>
                <Select
                  value={selectedScale.toString()}
                  onValueChange={(v) => setSelectedScale(Number(v) as ExportScale)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">표준 (1x)</SelectItem>
                    <SelectItem value="2">고화질 (2x)</SelectItem>
                    <SelectItem value="3">초고화질 (3x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="export-option-aspect-ratio">
                <label className="text-sm font-medium mb-2 block">비율</label>
                <Select
                  value={selectedAspectRatio}
                  onValueChange={(v) => setSelectedAspectRatio(v as ExportAspectRatio)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">가로 (16:9)</SelectItem>
                    <SelectItem value="vertical">세로 (9:16)</SelectItem>
                    <SelectItem value="square">정방 (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

ChartExportWrapper.displayName = "ChartExportWrapper";
