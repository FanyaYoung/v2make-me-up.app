import React, { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import * as htmlToImage from "html-to-image"

// Paste from user; duplicates preserved and order kept
const RAW = `
Skin HEX
#1A0D00
#1A0D00
#1A0D00
#1A0D00
#1A0D00
#1A0D00
#1A0D00
#1A0D00
#1E0F00
#1E0F00
#1E0F00
#1E0F00
#1E0F00
#1E0F00
#1E0F00
#1E0F00
#260701
#260701
#260701
#260701
#260701
#260701
#260701
#260701
#3B2219
#3B2219
#3B2219
#3B2219
#3B2219
#3B2219
#3B2219
#3B2219
#3C2004
#3C2004
#3C2004
#3C2004
#3C2004
#3C2004
#3C2004
#3C2004
#3C2E28
#3C2E28
#3C2E28
#3C2E28
#3C2E28
#3C2E28
#3C2E28
#3C2E28
#3D0C02
#3D0C02
#3D0C02
#3D0C02
#3D0C02
#3D0C02
#3D0C02
#3D0C02
#4F2903
#4F2903
#4F2903
#4F2903
#4F2903
#4F2903
#4F2903
#4F2903
#6D3800
#6D3800
#6D3800
#6D3800
#6D3800
#6D3800
#6D3800
#6D3800
#6F4F1D
#6F4F1D
#6F4F1D
#6F4F1D
#6F4F1D
#6F4F1D
#6F4F1D
#6F4F1D
#7C501A
#7C501A
#7C501A
#7C501A
#7C501A
#7C501A
#7C501A
#7C501A
#843722
#843722
#843722
#843722
#843722
#843722
#843722
#843722
#85646D
#85646D
#85646D
#85646D
#85646D
#85646D
#85646D
#85646D
#876127
#876127
#876127
#876127
#876127
#876127
#876127
#876127
#87675A
#87675A
#87675A
#87675A
#87675A
#87675A
#87675A
#87675A
#8D5524
#8D5524
#8D5524
#8D5524
#8D5524
#8D5524
#8D5524
#8D5524
#926A2D
#926A2D
#926A2D
#926A2D
#926A2D
#926A2D
#926A2D
#926A2D
#9C7248
#9C7248
#9C7248
#9C7248
#9C7248
#9C7248
#9C7248
#9C7248
#A16E4B
#A16E4B
#A16E4B
#A16E4B
#A16E4B
#A16E4B
#A16E4B
#A16E4B
#A77D7B
#A77D7B
#A77D7B
#A77D7B
#A77D7B
#A77D7B
#A77D7B
#A77D7B
#AF6E51
#AF6E51
#AF6E51
#AF6E51
#AF6E51
#AF6E51
#AF6E51
#AF6E51
#B48A78
#B48A78
#B48A78
#B48A78
#B48A78
#B48A78
#B48A78
#B48A78
#BD8966
#BD8966
#BD8966
#BD8966
#BD8966
#BD8966
#BD8966
#BD8966
#C19484
#C19484
#C19484
#C19484
#C19484
#C19484
#C19484
#C19484
#C68642
#C68642
#C68642
#C68642
#C68642
#C68642
#C68642
#C68642
#C69076
#C69076
#C69076
#C69076
#C69076
#C69076
#C69076
#C69076
#C69876
#C69876
#C69876
#C69876
#C69876
#C69876
#C69876
#C69876
#CB9F78
#CB9F78
#CB9F78
#CB9F78
#CB9F78
#CB9F78
#CB9F78
#CB9F78
#D2A469
#D2A469
#D2A469
#D2A469
#D2A469
#D2A469
#D2A469
#D2A469
#D2A784
#D2A784
#D2A784
#D2A784
#D2A784
#D2A784
#D2A784
#D2A784
#D39972
#D39972
#D39972
#D39972
#D39972
#D39972
#D39972
#D39972
#D4AA78
#D4AA78
#D4AA78
#D4AA78
#D4AA78
#D4AA78
#D4AA78
#D4AA78
#D6AE71
#D6AE71
#D6AE71
#D6AE71
#D6AE71
#D6AE71
#D6AE71
#D6AE71
#D89965
#D89965
#D89965
#D89965
#D89965
#D89965
#D89965
#D89965
#D89D5F
#D89D5F
#D89D5F
#D89D5F
#D89D5F
#D89D5F
#D89D5F
#D89D5F
#D9AD8A
#D9AD8A
#D9AD8A
#D9AD8A
#D9AD8A
#D9AD8A
#D9AD8A
#D9AD8A
#DFB796
#DFB796
#DFB796
#DFB796
#DFB796
#DFB796
#DFB796
#DFB796
#E0AC69
#E0AC69
#E0AC69
#E0AC69
#E0AC69
#E0AC69
#E0AC69
#E0AC69
#E0B792
#E0B792
#E0B792
#E0B792
#E0B792
#E0B792
#E0B792
#E0B792
#E1B571
#E1B571
#E1B571
#E1B571
#E1B571
#E1B571
#E1B571
#E1B571
#EAC086
#EAC086
#EAC086
#EAC086
#EAC086
#EAC086
#EAC086
#EAC086
#EBAB7F
#EBAB7F
#EBAB7F
#EBAB7F
#EBAB7F
#EBAB7F
#EBAB7F
#EBAB7F
#ECC3A3
#ECC3A3
#ECC3A3
#ECC3A3
#ECC3A3
#ECC3A3
#ECC3A3
#ECC3A3
#F1C27D
#F1C27D
#F1C27D
#F1C27D
#F1C27D
#F1C27D
#F1C27D
#F1C27D
#F7C19B
#F7C19B
#F7C19B
#F7C19B
#F7C19B
#F7C19B
#F7C19B
#F7C19B
#FBE5BA
#FBE5BA
#FBE5BA
#FBE5BA
#FBE5BA
#FBE5BA
#FBE5BA
#FBE5BA
#FDDCB4
#FDDCB4
#FDDCB4
#FDDCB4
#FDDCB4
#FDDCB4
#FDDCB4
#FDDCB4
#FDF1CB
#FDF1CB
#FDF1CB
#FDF1CB
#FDF1CB
#FDF1CB
#FDF1CB
#FDF1CB
#FDF5E2
#FDF5E2
#FDF5E2
#FDF5E2
#FDF5E2
#FDF5E2
#FDF5E2
#FDF5E2
#FFCD94
#FFCD94
#FFCD94
#FFCD94
#FFCD94
#FFCD94
#FFCD94
#FFCD94
#FFD6A4
#FFD6A4
#FFD6A4
#FFD6A4
#FFD6A4
#FFD6A4
#FFD6A4
#FFD6A4
#FFDBAC
#FFDBAC
#FFDBAC
#FFDBAC
#FFDBAC
#FFDBAC
#FFDBAC
#FFDBAC
#FFE0BD
#FFE0BD
#FFE0BD
#FFE0BD
#FFE0BD
#FFE0BD
#FFE0BD
#FFE0BD
#FFE7D1
#FFE7D1
#FFE7D1
#FFE7D1
#FFE7D1
#FFE7D1
#FFE7D1
#FFE7D1
`;

function useHexList() {
  return useMemo(() => {
    return RAW.split(/\s+/)
      .filter((s) => /^#[0-9A-Fa-f]{6}$/.test(s))
      .map((s) => s.toUpperCase());
  }, []);
}

export default function SkinHexSwatches() {
  const hexes = useHexList();
  const ref = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadJpg() {
    if (!ref.current) return;
    setDownloading(true);
    try {
      // toJpeg keeps text crisp; white background for print-friendly
      const dataUrl = await htmlToImage.toJpeg(ref.current, { quality: 0.95, backgroundColor: "#FFFFFF" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "SkinHEX_Swatches.jpg";
      link.click();
    } catch (e) {
      console.error(e);
      alert("Couldn't create JPG in-browser. You can still screenshot or print this view.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-6 w-full flex flex-col items-center gap-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Skin HEX — Color Samples</CardTitle>
          <Button onClick={downloadJpg} disabled={downloading} className="text-sm">
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Preparing…" : "Download JPG"}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Render area to export */}
          <div ref={ref} className="bg-white">
            <div className="grid grid-cols-[260px_1fr] gap-x-4 px-4 pb-2 text-sm font-medium text-gray-700">
              <div>Sample</div>
              <div>HEX</div>
            </div>
            <div className="px-4 pb-4">
              {hexes.map((hx, i) => (
                <div key={`${hx}-${i}`} className="grid grid-cols-[260px_1fr] gap-x-4 items-center h-10">
                  <div className="h-8 w-full rounded-md border border-gray-200 flex items-center px-3" style={{ backgroundColor: hx }}>
                    <span className="text-xs font-semibold" style={{ color: getReadableTextColor(hx) }}>{hx}</span>
                  </div>
                  <div className="text-sm">{hx}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-500">Tip: You can also use your browser’s Print → "Save as PDF" to capture the full list.</p>
    </div>
  );
}

function getReadableTextColor(hex: string) {
  try {
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    const f = (c: number) => (c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
    const R = f(r), G = f(g), B = f(b);
    const L = 0.2126*R + 0.7152*G + 0.0722*B;
    return L > 0.55 ? "#000000" : "#FFFFFF";
  } catch {
    return "#000000";
  }
}
