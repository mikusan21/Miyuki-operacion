import React from 'react';
import styles from './Analytics.module.css';

type DataItem = { label: string; value: number };

type Props = {
  data: DataItem[];
};

const CycleBars: React.FC<Props> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={styles.cycleBars}>
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 96);
        return (
          <div key={d.label} className={styles.cycleBarItem}>
            <div className={styles.cycleBarBar} style={{ height: `${pct}px` }} />
            <div className={styles.cycleBarLabel}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default CycleBars;