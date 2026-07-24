import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type L from "leaflet";
import { useAppStore } from "../../store/useAppStore";
import type { DataFeed } from "../../data/types";
import type { Provenance } from "../../data/adapters/types";
import { BANGKOK_CENTER, BANGKOK_ZOOM } from "./MapPanel";

const FEED_SCORE: Record<Provenance | DataFeed, number> = {
  live: 100,
  cache: 68,
  cached: 68,
  backup: 55,
  sim: 40,
  modeled: 40,
};

function HealthMeter({
  label,
  pct,
  tone,
}: {
  label: string;
  pct: number;
  tone: "cyan" | "coral" | "amber";
}) {
  const color =
    tone === "coral"
      ? "bg-hud-coral"
      : tone === "amber"
        ? "bg-hud-amber"
        : "bg-hud-cyan";
  return (
    <div className="flex items-center gap-2">
      <span className="label-tech hidden sm:inline">{label}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10 sm:w-20">
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out-expo`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="data-value text-xs text-hud-text">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export default function Footer({ mapRef }: { mapRef: React.RefObject<L.Map> }) {
  const feeds = useAppStore((s) => s.feeds);
  const stations = useAppStore((s) => s.stations);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const storm = useAppStore((s) => s.storm);
  const activityLog = useAppStore((s) => s.activityLog);
  const selectStation = useAppStore((s) => s.selectStation);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const systemHealth = useMemo(() => {
    const scores = Object.values(feeds).map((f) => FEED_SCORE[f]);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [feeds]);

  const networkLoad = useMemo(() => {
    const total = stations.reduce((a, s) => a + s.capacity_cms, 0);
    const active = stations
      .filter((s) => s.pumping)
      .reduce((a, s) => a + s.capacity_cms, 0);
    return total ? (active / total) * 100 : 0;
  }, [stations]);

  const riskStations = stations.filter((s) => s.status === "risk");
  const alertCount = riskStations.length + (storm ? 1 : 0);

  return (
    <footer className="relative z-[1100] flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-hud-edge bg-hud-panelSolid/95 px-3 py-2 backdrop-blur">
      <HealthMeter
        label="สถานะระบบ"
        pct={systemHealth}
        tone={systemHealth < 60 ? "amber" : "cyan"}
      />
      <HealthMeter
        label="ภาระเครือข่าย"
        pct={networkLoad}
        tone={networkLoad > 70 ? "coral" : networkLoad > 0 ? "amber" : "cyan"}
      />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setMode(mode === "confirm" ? "semi" : "confirm")}
          aria-pressed={mode === "confirm"}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            mode === "confirm"
              ? "border-hud-cyan/50 bg-hud-cyan/15 text-hud-cyan"
              : "border-hud-edge text-hud-dim hover:text-hud-text"
          }`}
          title="สลับเป็นโหมดยืนยันด้วยตนเองทุกคำสั่ง"
        >
          🕹️ Manual Override
        </button>

        <div className="relative">
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            aria-expanded={alertsOpen}
            className={`relative rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              alertCount > 0
                ? "border-hud-coral/50 bg-hud-coral/15 text-hud-coral"
                : "border-hud-edge text-hud-dim hover:text-hud-text"
            }`}
          >
            🔔 Alerts
            {alertCount > 0 && (
              <span className="data-value ml-1.5 rounded-full bg-hud-coral px-1.5 text-[10px] text-slate-900">
                {alertCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div className="glass-panel absolute bottom-full right-0 mb-2 w-72 overflow-hidden shadow-2xl">
              <div className="label-tech-lit border-b border-hud-edge px-3 py-2">
                การแจ้งเตือนที่ใช้งานอยู่
              </div>
              <ul className="max-h-56 space-y-1 overflow-y-auto p-2 panel-scroll">
                {alertCount === 0 && (
                  <li className="px-2 py-4 text-center text-xs text-hud-dim">
                    ไม่มีการแจ้งเตือนขณะนี้
                  </li>
                )}
                {storm && (
                  <li className="rounded-md bg-hud-coral/10 px-2 py-1.5 text-xs text-hud-coral">
                    ⛈️ พายุฝนจำลองกำลังปกคลุมทั้งเมือง
                  </li>
                )}
                {riskStations.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => {
                        selectStation(s.id);
                        setAlertsOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-hud-text transition hover:bg-white/5"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="data-value shrink-0 text-hud-coral">
                        {s.level.toFixed(0)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() =>
            mapRef.current?.flyTo(BANGKOK_CENTER, BANGKOK_ZOOM, { duration: 1 })
          }
          className="rounded-full border border-hud-edge px-3 py-1.5 text-xs font-bold text-hud-dim transition hover:text-hud-text"
        >
          🗺️ Map View
        </button>

        <button
          onClick={() => setReportsOpen(true)}
          className="rounded-full border border-hud-edge px-3 py-1.5 text-xs font-bold text-hud-dim transition hover:text-hud-text"
        >
          📋 Reports
        </button>
      </div>

      {reportsOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[1300] grid place-items-center bg-black/60 p-4"
            onClick={() => setReportsOpen(false)}
          >
            <div
              className="glass-panel flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hud-edge px-4 py-3">
                <h2 className="label-tech-lit text-sm">รายงานสรุปเซสชัน</h2>
                <button
                  onClick={() => setReportsOpen(false)}
                  aria-label="ปิดรายงาน"
                  className="text-hud-dim hover:text-hud-text"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
                {[
                  ["สถานีในระบบ", stations.length],
                  ["กำลังระบาย", stations.filter((s) => s.pumping).length],
                  ["สถานะเสี่ยงสูง", riskStations.length],
                  ["เหตุการณ์บันทึก", activityLog.length],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="rounded-lg border border-hud-edge bg-black/20 px-2.5 py-2 text-center"
                  >
                    <div className="data-value text-lg font-bold text-hud-cyan">
                      {value}
                    </div>
                    <div className="label-tech mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto border-t border-hud-edge p-4 panel-scroll">
                <h3 className="label-tech mb-2">บันทึกการปฏิบัติการทั้งหมด</h3>
                <ul className="space-y-1 text-xs">
                  {activityLog.length === 0 && (
                    <li className="text-hud-dim">ยังไม่มีเหตุการณ์</li>
                  )}
                  {activityLog.map((e) => (
                    <li key={e.id} className="flex gap-2">
                      <span className="data-value shrink-0 text-hud-dim">
                        {e.time}
                      </span>
                      <span className="text-hud-text/85">{e.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </footer>
  );
}
