import React, { FC } from 'react';
import styles from './Analytics.module.css';

interface BarItem {
  category: string;
  value: number;
}

interface VerticalBarsProps {
  items?: BarItem[];
}

const VerticalBars: FC<VerticalBarsProps> = ({ items = [] }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={styles.vBars}>
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100);
        return (
          <div className={styles.vBarColumn} key={it.category}>
            <div className={styles.vBarInner}>
              <div className={styles.vBarFill} style={{ height: `${pct}%` }} />
            </div>
            <div className={styles.vBarLabel}>{it.category}</div>
          </div>
        );
      })}
    </div>
  );
};

export default VerticalBars;