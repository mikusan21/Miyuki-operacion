import React from 'react';
import styles from './Analytics.module.css';

type Item = { label: string; value: number };

type Props = {
  items: Item[];
};

const HorizontalBars: React.FC<Props> = ({ items }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={styles.hBars}>
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100);
        return (
          <div key={it.label} className={styles.hBarRow}>
            <div className={styles.hBarLabel}>{it.label}</div>
            <div className={styles.hBarTrack}>
              <div className={styles.hBarFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.hBarValue}>{it.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default HorizontalBars;