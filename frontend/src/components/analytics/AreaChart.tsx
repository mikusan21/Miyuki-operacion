import React, { useMemo } from 'react';
import styles from './Analytics.module.css';

export default function AreaChart({ data = [] }) {
  const w = 900;
  const h = 160;
  const padding = 8;

  const { pathD, areaD } = useMemo(() => {
    if (!data || data.length === 0) return { pathD: '', areaD: '' };
    const max = Math.max(...data);
    const step = (w - padding * 2) / Math.max(1, data.length - 1);
    const points = data.map((v, i) => {
      const x = padding + i * step;
      const y = padding + (1 - v / max) * (h - padding * 2);
      return { x, y };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const areaD =
      `${pathD} L ${padding + (data.length - 1) * step} ${h - padding} L ${padding} ${h - padding} Z`;
    return { pathD, areaD };
  }, [data, w, h, padding]);

  return (
    <svg className={styles.areaSvg} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0a66ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0a66ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {areaD && <path d={areaD} fill="url(#areaGrad)" />}
      {pathD && <path d={pathD} stroke="#0a66ff" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}