import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Exam } from '../types';
import { STATUS_TONES, StatusKey, getExamStatus } from '../lib/examStatusColor';

/** The two colours that mean "you can act on this today". */
const BOOKABLE: ReadonlySet<StatusKey> = new Set<StatusKey>(['open', 'closing']);

interface HeroMapProps {
  exams: Exam[];
  onCityClick?: (city: string) => void;
  className?: string;
}

/** Compact, city-aggregated map for the Discover hero — one circle per city
    sized by its real exam count, CARTO Light tiles for the editorial/
    newsprint look. The detailed per-exam map lives in MapView (Kartvy toggle). */
export function HeroMap({ exams, onCityClick, className }: HeroMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [59.0, 15.2],
      zoom: 5,
      scrollWheelZoom: false,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
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

    const byCity = new Map<string, { count: number; open: number; lat: number; lng: number }>();
    exams.forEach((e) => {
      const bookable = BOOKABLE.has(getExamStatus(e).tone.key);
      const cur = byCity.get(e.city);
      if (cur) {
        cur.count += 1;
        cur.open += bookable ? 1 : 0;
      } else {
        byCity.set(e.city, { count: 1, open: bookable ? 1 : 0, lat: e.lat, lng: e.lng });
      }
    });

    byCity.forEach((c, city) => {
      // A city you can book something in today is green; one where everything
      // is full, closed or undated is grey. The overview map's job is to say
      // where to look first, and size alone said "biggest", not "openest".
      const tone = c.open > 0 ? STATUS_TONES.open : STATUS_TONES.closed;
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: 6 + Math.sqrt(c.count) * 1.7,
        color: tone.pin,
        weight: 1.5,
        fillColor: tone.pin,
        fillOpacity: c.open > 0 ? 0.55 : 0.3,
      }).addTo(layer);
      marker.bindPopup(
        `<strong style="font-size:15px;">${escapeHtml(city)}</strong><br>${c.count} prövningstillfällen<br>` +
          `<span style="color:${tone.pin};font-weight:700;">${c.open > 0 ? `${c.open} går att boka nu` : 'Inget öppet just nu'}</span><br>` +
          `<a href="#" data-city="${escapeHtml(city)}" style="color:#006786;">Se alla i ${escapeHtml(city)} →</a>`,
      );
      marker.on('popupopen', () => {
        const link = document.querySelector(`a[data-city="${CSS.escape(city)}"]`);
        link?.addEventListener(
          'click',
          (ev) => {
            ev.preventDefault();
            onCityClick?.(city);
          },
          { once: true },
        );
      });
    });
  }, [exams, onCityClick]);

  return <div ref={containerRef} className={className ?? 'w-full h-full'} />;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
