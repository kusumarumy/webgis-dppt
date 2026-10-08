'use client';

import { useEffect, useMemo, useState } from 'react';

type Bidang = {
  id?: string | number;
  kode_bid?: string;
  nama_milik?: string;
  status?: string;
  kelurahan?: string;
  kecamatan?: string;
  tipehak?: string;
  penggunaan?: string;
};

type Props = {
  onClose: () => void;
};

type StatistikItem = {
  label: string;
  jumlah: number;
};

function hitung(
  data: Bidang[],
  key: keyof Bidang
): StatistikItem[] {
  const map = new Map<string, number>();

  for (const item of data) {
    const value =
      String(item[key] ?? '').trim() ||
      'Tidak diketahui';

    map.set(
      value,
      (map.get(value) ?? 0) + 1
    );
  }

  return Array.from(map.entries())
    .map(([label, jumlah]) => ({
      label,
      jumlah,
    }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

function Donut({
  data,
  total,
  size = 116,
  centerText,
  centerSub = '',
  colors = [
    '#9F1239',
    '#E11D48',
    '#F59E0B',
    '#16A34A',
    '#64748B',
  ],
}: {
  data: StatistikItem[];
  total: number;
  size?: number;
  centerText?: string;
  centerSub?: string;
  colors?: string[];
}) {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  const validData = data.filter(
    (item) => item.jumlah > 0
  );

  return (
    <div
      className="stat-donut"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#EEF1F4"
          strokeWidth="12"
        />

        {validData.map((item, index) => {
          const percentage =
            total > 0
              ? item.jumlah / total
              : 0;

          const length =
            percentage * circumference;

          const offset = accumulated;

          accumulated += length;

          return (
            <circle
              key={item.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={
                colors[index % colors.length]
              }
              strokeWidth="12"
              strokeDasharray={`${length} ${
                circumference - length
              }`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
        })}
      </svg>

      <div className="stat-donut-center">
        <strong>
          {centerText ??
            total.toLocaleString('id-ID')}
        </strong>

        {centerSub && (
          <span>{centerSub}</span>
        )}
      </div>
    </div>
  );
}

function StatusDashboard({
  data,
  total,
}: {
  data: StatistikItem[];
  total: number;
}) {
  const verified =
    data.find(
      (item) =>
        item.label === 'Terverifikasi'
    )?.jumlah ?? 0;

  const verifiedPercent =
    total > 0
      ? Math.round(
          (verified / total) * 100
        )
      : 0;

  const colors = [
    '#9F1239',
    '#F59E0B',
    '#16A34A',
    '#E11D48',
  ];

  return (
    <div className="stat-progress">

      <div className="stat-progress-chart">

        <Donut
          data={data}
          total={total}
          size={105}
          centerText={`${verifiedPercent}%`}
          centerSub="verified"
          colors={colors}
        />

      </div>

      <div className="stat-progress-list">

        {data.map((item, index) => (
          <div
            className="stat-progress-row"
            key={item.label}
          >

            <div className="stat-progress-name">

              <span
                className="stat-status-dot"
                style={{
                  background:
                    colors[
                      index % colors.length
                    ],
                }}
              />

              <span>
                {item.label}
              </span>

            </div>

            <strong>
              {item.jumlah.toLocaleString(
                'id-ID'
              )}
            </strong>

          </div>
        ))}

      </div>

    </div>
  );
}

function Ranking({
  data,
  limit = 7,
  onBarClick,
}: {
  data: StatistikItem[];
  limit?: number;
  onBarClick?: (
    item: StatistikItem
  ) => void;
}) {
  const items = data.slice(0, limit);

  const max = Math.max(
    ...items.map(
      (item) => item.jumlah
    ),
    1
  );

  const barColors = [
    '#991B1B',
    '#B91C1C',
    '#C2410C',
    '#F97316',
    '#D97706',
    '#EAB308',
    '#FACC15',
  ];

  return (
    <div className="stat-vchart">

      <div className="stat-vchart-bars">

        {items.map((item, index) => {

          const height =
            (item.jumlah / max) * 100;

          return (
            <button
              type="button"
              className="stat-vchart-item"
              onClick={() =>
                onBarClick?.(item)
              }
              key={item.label}
              title={`Klik untuk melihat ${item.label}`}
            >

              <div className="stat-vchart-value">
                {item.jumlah.toLocaleString(
                  'id-ID'
                )}
              </div>

              <div className="stat-vchart-bar-area">

                <div
                  className="stat-vchart-bar"
                  style={{
                    height: `${height}%`,
                    background:
                      barColors[
                        index %
                          barColors.length
                      ],
                  }}
                />

              </div>

              <div
                className="stat-vchart-label"
                title={item.label}
              >
                {item.label}
              </div>

            </button>
          );
        })}

      </div>

    </div>
  );
}

function Composition({
  title,
  data,
  total,
}: {
  title: string;
  data: StatistikItem[];
  total: number;
}) {
  const colors = [
    '#9F1239',
    '#E11D48',
    '#F59E0B',
    '#16A34A',
    '#64748B',
  ];

  return (
    <section className="stat-composition">

      <div className="stat-small-title">
        {title}
      </div>

      <div className="stat-composition-chart">

        <Donut
          data={data}
          total={total}
          size={82}
          centerText={
            total.toLocaleString(
              'id-ID'
            )
          }
          centerSub="bidang"
          colors={colors}
        />

      </div>

      <div className="stat-legend">

        {data.slice(0, 4).map(
          (item, index) => (

            <div
              className="stat-legend-row"
              key={item.label}
            >

              <span
                className="stat-legend-dot"
                style={{
                  background:
                    colors[
                      index %
                        colors.length
                    ],
                }}
              />

              <span
                className="stat-legend-name"
                title={item.label}
              >
                {item.label}
              </span>

              <strong>
                {item.jumlah.toLocaleString(
                  'id-ID'
                )}
              </strong>

            </div>

          )
        )}

      </div>

    </section>
  );
}

export default function Statistika({
  onClose,
}: Props) {

  const [bidang, setBidang] =
    useState<Bidang[]>([]);

  const [memuat, setMemuat] =
    useState(true);
  const [selectedStat, setSelectedStat] =
    useState<{
      title: string;
      item: StatistikItem;
    } | null>(null);

  useEffect(() => {

    const ambilData = async () => {

      try {

        setMemuat(true);

        const response =
          await fetch('/api/bidang');

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const fc =
          await response.json();

const data: Bidang[] =
  (fc.features ?? []).map(
    (feature: any) => ({
      ...feature.properties,
      id:
        feature.id ??
        feature.properties?.id,
    })
  );

        setBidang(data);

      } catch (error) {

        console.error(
          'Gagal mengambil statistik:',
          error
        );

        setBidang([]);

      } finally {

        setMemuat(false);

      }
    };

    ambilData();

  }, []);

  const status = useMemo(() => {

    const values = [
      {
        label: 'Draft',
        key: 'draft',
      },
      {
        label: 'Menunggu',
        key: 'terkirim',
      },
      {
        label: 'Terverifikasi',
        key: 'terverifikasi',
      },
      {
        label: 'Revisi',
        key: 'revisi',
      },
    ];

    return values.map((item) => ({
      label: item.label,
      jumlah: bidang.filter(
        (b) =>
          b.status === item.key
      ).length,
    }));

  }, [bidang]);
  
  const kelurahan = useMemo(
    () =>
      hitung(
        bidang,
        'kelurahan'
      ).filter(
        (item) => item.label !== 'Tidak diketahui'
      ),
    [bidang]
  );

  const kecamatan = useMemo(
    () =>
      hitung(
        bidang,
        'kecamatan'
      ),
    [bidang]
  );

  const tipeHak = useMemo(
    () =>
      hitung(
        bidang,
        'tipehak'
      ),
    [bidang]
  );

  const penggunaan = useMemo(
    () =>
      hitung(
        bidang,
        'penggunaan'
      ),
    [bidang]
  );

  const total = bidang.length;

  const verified =
    status.find(
      (item) =>
        item.label ===
        'Terverifikasi'
    )?.jumlah ?? 0;

  const waiting =
    status.find(
      (item) =>
        item.label === 'Menunggu'
    )?.jumlah ?? 0;

  const revision =
    status.find(
      (item) =>
        item.label === 'Revisi'
    )?.jumlah ?? 0;

  const verifiedPercent =
    total > 0
      ? Math.round(
          (verified / total) * 100
        )
      : 0;


  const handleKelurahanClick = (
    item: StatistikItem
  ) => {
    setSelectedStat({
      title: 'Kelurahan',
      item,
    });
  };

  const handleKecamatanClick = (
    item: StatistikItem
  ) => {
    setSelectedStat({
      title: 'Kecamatan',
      item,
    });
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <aside className="statistik-flyout">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="statistik-head">

        <div className="statistik-heading">

          <div className="statistik-icon">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M4 19V10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M10 19V5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M16 19v-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M3 19h18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

            </svg>

          </div>

          <div>

            <div className="statistik-title">
              STATISTIKA
            </div>

            <div className="statistik-subtitle">
              Analisis Bidang Tanah Terdampak
            </div>

          </div>

        </div>

        <button
          type="button"
          className="statistik-close"
          onClick={onClose}
          aria-label="Tutup"
        >
          ×
        </button>

      </header>


      {/* =================================================
          LOADING
      ================================================= */}

      {memuat ? (

        <div className="statistik-loading">

          <span />

          Memuat...

        </div>

      ) : (

        <div className="statistik-body">

          {/* =================================================
              KPI
          ================================================= */}

          <section className="stat-kpi">

            <div className="stat-kpi-main">

              <span>
                BIDANG
              </span>

              <strong>
                {total.toLocaleString(
                  'id-ID'
                )}
              </strong>

            </div>

            <div className="stat-kpi-divider" />

            <div className="stat-kpi-item">

              <span>
                VERIFIED
              </span>

              <strong>
                {verifiedPercent}%
              </strong>

            </div>

            <div className="stat-kpi-divider" />

            <div className="stat-kpi-item">

              <span>
                MENUNGGU
              </span>

              <strong>
                {waiting.toLocaleString(
                  'id-ID'
                )}
              </strong>

            </div>

          </section>


          {/* =================================================
              PROGRES
          ================================================= */}

          <section className="stat-card">

            <div className="stat-card-title">
              PROGRES
            </div>

            <StatusDashboard
              data={status}
              total={total}
            />

          </section>
{/* =================================================
              KECAMATAN
          ================================================= */}

          <section className="stat-card">

            <div className="stat-card-title-row">

              <div className="stat-card-title">
                DISTRIBUSI KECAMATAN
              </div>

              <span>
                TOP 5
              </span>

            </div>

            <Ranking
              data={kecamatan}
              limit={7}
              onBarClick={
                handleKecamatanClick
              }
            />

          </section>

          {/* =================================================
              KELURAHAN
          ================================================= */}

          <section className="stat-card">

            <div className="stat-card-title-row">

              <div className="stat-card-title">
                DISTRIBUSI KELURAHAN
              </div>

              <span>
                TOP 7
              </span>

            </div>

            <Ranking
              data={kelurahan}
              limit={7}
              onBarClick={
                handleKelurahanClick
              }
            />

          </section>


          {/* =================================================
              KOMPOSISI
          ================================================= */}

          <div className="stat-composition-grid">

            <Composition
              title="TIPE HAK"
              data={tipeHak}
              total={total}
            />

            <Composition
              title="PENGGUNAAN"
              data={penggunaan}
              total={total}
            />

          </div>


          <div className="stat-footer">

            <div>
              <span>REVISI</span>

              <strong>
                {revision.toLocaleString(
                  'id-ID'
                )}
              </strong>
            </div>

            <div>
              <span>KECAMATAN</span>

              <strong>
                {kecamatan.length}
              </strong>
            </div>

            <div>
              <span>KELURAHAN</span>

              <strong>
                {kelurahan.length}
              </strong>
            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          POPUP ATRIBUT GRAFIK
          ===================================================== */}

      {selectedStat && (

        <div
          className="stat-chart-popup"
          role="dialog"
          aria-label="Detail statistik"
        >

          <div className="stat-chart-popup-head">

            <div>

              <div className="stat-chart-popup-kicker">
                DETAIL STATISTIK
              </div>

              <div className="stat-chart-popup-title">
                {selectedStat.title}
              </div>

            </div>

            <button
              type="button"
              className="stat-chart-popup-close"
              onClick={() =>
                setSelectedStat(null)
              }
              aria-label="Tutup detail"
            >
              ×
            </button>

          </div>


          <div className="stat-chart-popup-content">

            <div className="stat-chart-popup-label">
              {selectedStat.item.label}
            </div>

            <div className="stat-chart-popup-number">
              {selectedStat.item.jumlah.toLocaleString(
                'id-ID'
              )}
            </div>

            <div className="stat-chart-popup-caption">
              bidang tanah
            </div>

            <div className="stat-chart-popup-percent">

              {total > 0
                ? (
                    (selectedStat.item.jumlah /
                      total) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %

              <span>
                dari seluruh bidang
              </span>

            </div>

          </div>

        </div>

      )}

    </aside>
  );
}
