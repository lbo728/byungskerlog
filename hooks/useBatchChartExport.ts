"use client";

import { useCallback, useState } from "react";
import JSZip from "jszip";
import FileSaver from "file-saver";
import type { ChartExportHandle, ExportScale, ExportAspectRatio } from "@/components/charts/ChartExportWrapper";

interface ChartRef {
  name: string;
  ref: React.RefObject<ChartExportHandle | null>;
}

export function useBatchChartExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportAllChartsAsZip = useCallback(
    async (chartRefs: ChartRef[], scale: ExportScale = 2, aspectRatio: ExportAspectRatio = "horizontal") => {
      setIsExporting(true);

      try {
        const zip = new JSZip();
        const timestamp = new Date().toISOString().slice(0, 10);
        const ratioSuffix = aspectRatio === "horizontal" ? "h" : aspectRatio === "vertical" ? "v" : "sq";

        for (const { name, ref } of chartRefs) {
          if (!ref.current) continue;

          const blob = await ref.current.exportChart(scale, aspectRatio);
          if (blob) {
            zip.file(`${name}-${ratioSuffix}-${timestamp}.png`, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(zipBlob, `byungskerlog-charts-${ratioSuffix}-${timestamp}.zip`);
      } catch (error) {
        console.error("Batch export failed:", error);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportAllChartsAsZip, isExporting };
}
