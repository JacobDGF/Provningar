import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { STATUS_TONES, StatusKey, getExamStatus } from '../lib/examStatusColor';

/**
 * One pin colour per status, from the same table the cards read.
 *
 * Every pin used to be Leaflet's blue teardrop except the open ones, so a map
 * of forty listings answered "where" and nothing else — you had to open each
 * one to find out whether it was bookable. Built once at module scope: a
 * divIcon per status rather than per marker.
 */
const statusIcons: Record<StatusKey, L.DivIcon> = Object.fromEntries(
  (Object.keys(STATUS_TONES) as StatusKey[]).map((key) => [
    key,
    L.divIcon({
      className: '',
      html:
        `<div style="width:24px;height:24px;border-radius:9999px;background:${STATUS_TONES[key].pin};` +
        `border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    }),
  ]),
) as Record<StatusKey, L.DivIcon>;

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563EB;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface MapViewProps {
  exams: Exam[];
  className?: string;
}

export function MapView({ exams, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const { userLocation, setShowingExamDetail } = useStore();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [62.0, 15.0],
      zoom: 5,
      // Bottom-right: the status legend floats along the top of this view, and
      // top-left zoom buttons sat underneath it.
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap-bidragsgivare',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points: L.LatLngExpression[] = [];

    exams.forEach((exam) => {
      const status = getExamStatus(exam);
      const marker = L.marker([exam.lat, exam.lng], {
        icon: statusIcons[status.tone.key],
        title: `${exam.course} — ${status.label}`,
      });
      marker.bindPopup(`
        <div style="font-family: -apple-system, sans-serif; min-width: 180px;">
          <p style="margin:0 0 4px; display:inline-block; background:${status.tone.pin}; color:white; font-size:11px; font-weight:700; padding:2px 8px; border-radius:9999px;">${escapeHtml(status.label)}</p>
          <p style="margin:0 0 2px; font-weight:700; font-size:13px;">${escapeHtml(exam.course)}</p>
          <p style="margin:0 0 8px; font-size:12px; color:#57544C;">${escapeHtml(exam.schoolName)} · ${escapeHtml(exam.city)}</p>
          <button id="open-${exam.id}" style="background:#0088B0;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;width:100%;">Visa detaljer</button>
        </div>
      `);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`open-${exam.id}`);
        btn?.addEventListener('click', () => setShowingExamDetail(exam.id), { once: true });
      });
      marker.addTo(layer);
      points.push([exam.lat, exam.lng]);
    });

    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindTooltip('Din plats', { permanent: false })
        .addTo(layer);
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 12 });
    }
  }, [exams, userLocation, setShowingExamDetail]);

  return <div ref={containerRef} className={className ?? 'w-full h-full'} />;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
