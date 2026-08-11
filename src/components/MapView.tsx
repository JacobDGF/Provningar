import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { isOpenForRegistration } from '../lib/examStatus';

// Leaflet's default marker icons resolve to relative paths that break under
// a bundler — bundle the actual image assets via Vite instead so the map
// works offline/self-contained with no external CDN dependency at runtime.

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const openIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:9999px;background:#2F8457;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

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
      zoomControl: true,
    });
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
      const icon = isOpenForRegistration(exam) ? openIcon : defaultIcon;
      const marker = L.marker([exam.lat, exam.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: -apple-system, sans-serif; min-width: 180px;">
          <p style="margin:0 0 2px; font-weight:700; font-size:13px;">${escapeHtml(exam.course)}</p>
          <p style="margin:0 0 8px; font-size:12px; color:#57544C;">${escapeHtml(exam.schoolName)} · ${escapeHtml(exam.city)}</p>
          <button id="open-${exam.id}" style="background:#CC785C;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;width:100%;">Visa detaljer</button>
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
