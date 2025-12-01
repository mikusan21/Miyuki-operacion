import React from 'react';
import styles from './Analytics.module.css';

type Metric = {
  sede?: string;
  change?: string;
  plato?: string;
  usuario?: string;
};

type Props = {
  sedePopular?: Metric;
  platoPopular?: Metric;
  usuarioActivo?: Metric;
};

const KeyMetrics: React.FC<Props> = ({ sedePopular, platoPopular, usuarioActivo }) => {
  return (
    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <div className={styles.metricTitle}>Sede más popular</div>
        <div className={styles.metricMain}>{sedePopular?.sede}</div>
        <div className={styles.metricChange}>{sedePopular?.change}</div>
      </div>
      <div className={styles.metricCard}>
        <div className={styles.metricTitle}>Plato más pedido en todas las sedes</div>
        <div className={styles.metricMain}>{platoPopular?.plato}</div>
        <div className={styles.metricChange}>{platoPopular?.change}</div>
      </div>
      <div className={styles.metricCard}>
        <div className={styles.metricTitle}>Usuario más activo</div>
        <div className={styles.metricMain}>{usuarioActivo?.usuario}</div>
        <div className={styles.metricChange}>{usuarioActivo?.change}</div>
      </div>
    </div>
  );
};

export default KeyMetrics;