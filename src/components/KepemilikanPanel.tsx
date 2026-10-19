'use client';

import { useEffect, useMemo, useState } from 'react';

type Pemilik = {
  nama: string;
  jumlah_bidang: number;
};

type BidangKepemilikan = {
  id: number;
  fid: string | number | null;
  bidang_id: string | null;
  nib: string | null;

  nama_milik: string | null;
  nik_milik: string | null;

  nama_sewa: string | null;
  nik_sewa: string | null;

  kecamatan: string | null;
  kelurahan: string | null;

  luas_tnh: number | null;
  luas_terdampak_m2: number | null;
  luas_sisa_m2: number | null;

  dampak_tnh: string | null;
  penggunaan: string | null;
  sta_tnh: string | null;
};

type Props = {
  onClose: () => void;
};

export default function KepemilikanPanel({
  onClose,
}: Props) {
  const [pemilik, setPemilik] = useState<Pemilik[]>([]);
  const [namaAktif, setNamaAktif] = useState('');
  const [dropdownPemilik, setDropdownPemilik] =
    useState(false);
  const [bidang, setBidang] = useState<
    BidangKepemilikan[]
  >([]);

  const [memuatPemilik, setMemuatPemilik] =
    useState(true);

  const [memuatBidang, setMemuatBidang] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let aktif = true;

    async function muatPemilik() {
      try {
        setMemuatPemilik(true);
        setError(null);

        const res = await fetch(
          '/api/analisis/kepemilikan/pemilik',
          {
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          throw new Error(
            'Gagal mengambil daftar pemilik.'
          );
        }

        const data = await res.json();

        if (!aktif) return;

        setPemilik(
          Array.isArray(data)
            ? data
            : data.pemilik ?? []
        );
      } catch (err) {
        if (!aktif) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data pemilik.'
        );
      } finally {
        if (aktif) {
          setMemuatPemilik(false);
        }
      }
    }

    muatPemilik();

    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    let aktif = true;

    if (!namaAktif) {
      setBidang([]);
      setMemuatBidang(false);
      return;
    }

    async function muatBidang() {
      try {
        setMemuatBidang(true);
        setError(null);

        const res = await fetch(
          `/api/analisis/kepemilikan/${encodeURIComponent(
            namaAktif
          )}`,
          {
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          throw new Error(
            'Gagal mengambil data bidang.'
          );
        }

        const data = await res.json();

        if (!aktif) return;

        setBidang(
          Array.isArray(data)
            ? data
            : data.bidang ?? []
        );
      } catch (err) {
        if (!aktif) return;

        setBidang([]);

        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil data bidang.'
        );
      } finally {
        if (aktif) {
          setMemuatBidang(false);
        }
      }
    }

    muatBidang();

    return () => {
      aktif = false;
    };
  }, [namaAktif]);

useEffect(() => {
  const ids = bidang
    .map((b) => b.fid)
    .filter(
      (id): id is string | number =>
        id !== null &&
        id !== undefined &&
        id !== ''
    );

  window.dispatchEvent(
    new CustomEvent('analisis-bidang', {
      detail: { ids },
    })
  );
}, [bidang]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent('reset-analisis-bidang')
      );
    };
  }, []);

  const pemilikAktif = useMemo(
    () =>
      pemilik.find(
        (p) => p.nama === namaAktif
      ) ?? null,
    [pemilik, namaAktif]
  );

  const totalLuas = useMemo(
    () =>
      bidang.reduce(
        (total, b) =>
          total + (Number(b.luas_tnh) || 0),
        0
      ),
    [bidang]
  );

  const totalTerdampak = useMemo(
    () =>
      bidang.reduce(
        (total, b) =>
          total +
          (Number(b.luas_terdampak_m2) || 0),
        0
      ),
    [bidang]
  );

  const totalSisa = useMemo(
    () =>
      bidang.reduce(
        (total, b) =>
          total +
          (Number(b.luas_sisa_m2) || 0),
        0
      ),
    [bidang]
  );

  const jumlahTerdampak = useMemo(
    () =>
      bidang.filter(
        (b) =>
          (Number(b.luas_terdampak_m2) || 0) > 0
      ).length,
    [bidang]
  );

  function formatLuas(value: number) {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
    }).format(value);
  }

function fokusBidang(
  fid: string | number | null
) {
  if (fid === null || fid === '') return;

  window.dispatchEvent(
    new CustomEvent('fokus-bidang', {
      detail: { id: fid },
    })
  );
}

function resetAnalisis() {
  window.dispatchEvent(
    new CustomEvent('reset-analisis-bidang')
  );

  window.dispatchEvent(
    new CustomEvent('reset-pilihan-bidang')
  );

  setNamaAktif('');
  setBidang([]);
  setError(null);
  setDropdownPemilik(false);
}

  function IconKepemilikan() {
    return (
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.4-5 5.5-5s4.9 2 5.5 5" />
        <path d="M16 11a3 3 0 1 0-1.2-5.75" />
        <path d="M16 14c2.6.1 4.2 1.8 4.7 4.5" />
      </svg>
    );
  }

  return (
    <section className="panel panel-kepemilikan">
      <div className="panel-header">
        <div className="panel-header-main">
          <span className="panel-title-icon">
            <IconKepemilikan />
          </span>

          <div className="panel-header-text">
            <div className="panel-title">
              ANALISIS KEPEMILIKAN
            </div>

            <div className="panel-subtitle">
              Analisis bidang tanah berdasarkan nama pemilik
            </div>
          </div>
        </div>

        <button
          type="button"
          className="panel-close"
          onClick={() => {
            resetAnalisis();
            onClose();
          }}
          aria-label="Tutup"
        >
          ×
        </button>
      </div>

      <div className="panel-body">
        <div className="form-group">
          <div className="form-group-header">
            <label htmlFor="pilih-pemilik">
              Nama Pemilik
            </label>

            <button
              type="button"
              className="analysis-reset"
              onClick={resetAnalisis}
              disabled={!namaAktif}
            >
              ↻ Reset
            </button>
          </div>

          <div className="pemilik-dropdown">
            <button
              type="button"
              id="pilih-pemilik"
              className={`pemilik-dropdown-trigger ${
                dropdownPemilik ? 'is-open' : ''
              }`}
              onClick={() =>
                setDropdownPemilik((v) => !v)
              }
              disabled={pemilik.length === 0}
              aria-expanded={dropdownPemilik}
            >
              <span>
                {namaAktif
                  ? `${
                      pemilikAktif?.nama ||
                      namaAktif
                    } · ${
                      pemilikAktif?.jumlah_bidang ??
                      0
                    } bidang`
                  : memuatPemilik
                    ? 'Memuat pemilik...'
                    : pemilik.length === 0
                      ? 'Tidak ada pemilik'
                      : 'Pilih pemilik'}
              </span>

              <span className="pemilik-dropdown-arrow">
                ▾
              </span>
            </button>

            {dropdownPemilik &&
              pemilik.length > 0 && (
                <div className="pemilik-dropdown-menu">
                  <button
                    type="button"
                    className={`pemilik-option ${
                      !namaAktif ? 'active' : ''
                    }`}
                    onClick={resetAnalisis}
                  >
                    Pilih pemilik
                  </button>

                  {pemilik.map((p) => (
                    <button
                      type="button"
                      key={p.nama}
                      className={`pemilik-option ${
                        namaAktif === p.nama
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent(
                            'reset-analisis-bidang'
                          )
                        );

                        setNamaAktif(p.nama);
                        setBidang([]);
                        setDropdownPemilik(false);
                        setError(null);
                      }}
                    >
                      <span>
                        {p.nama ||
                          '(Nama tidak tersedia)'}
                      </span>

                      <small>
                        {p.jumlah_bidang} bidang
                      </small>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>

        {error && (
          <div className="panel-error">
            {error}
          </div>
        )}

        {pemilikAktif && (
          <>
            <div className="owner-card">
              <div className="owner-name">
                {pemilikAktif.nama ||
                  '(Nama tidak tersedia)'}
              </div>
            </div>

            <div className="analysis-stats">
              <div className="analysis-stat">
                <span>Jumlah bidang</span>
                <strong>
                  {bidang.length}
                </strong>
              </div>

              <div className="analysis-stat">
                <span>Total luas</span>
                <strong>
                  {formatLuas(totalLuas)} m²
                </strong>
              </div>

              <div className="analysis-stat">
                <span>Terdampak</span>
                <strong>
                  {formatLuas(
                    totalTerdampak
                  )}{' '}
                  m²
                </strong>
              </div>

              <div className="analysis-stat">
                <span>Bidang terdampak</span>
                <strong>
                  {jumlahTerdampak}
                </strong>
              </div>

              <div className="analysis-stat">
                <span>Luas sisa</span>
                <strong>
                  {formatLuas(totalSisa)} m²
                </strong>
              </div>
            </div>

            <div className="analysis-section-title">
              Daftar bidang
              <span>
                {memuatBidang
                  ? 'Memuat...'
                  : `${bidang.length} bidang`}
              </span>
            </div>

            <div className="analysis-list">
              {memuatBidang && (
                <div className="analysis-empty">
                  Memuat data bidang...
                </div>
              )}

              {!memuatBidang &&
                bidang.length === 0 && (
                  <div className="analysis-empty">
                    Tidak ada bidang untuk pemilik
                    ini.
                  </div>
                )}

              {!memuatBidang &&
                bidang.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="analysis-field"
                    onClick={() => fokusBidang(b.fid)}
                  >
                    <div className="analysis-field-top">
                      <strong>
                        {b.bidang_id ||
                          b.nib ||
                          `Bidang ${b.id}`}
                      </strong>

                      <span>
                        Lihat di peta →
                      </span>
                    </div>

                    <div className="analysis-field-location">
                      {[
                        b.kelurahan,
                        b.kecamatan,
                      ]
                        .filter(Boolean)
                        .join(' · ') ||
                        'Lokasi tidak tersedia'}
                    </div>

                    <div className="analysis-field-info">
                      <span>
                        Luas{' '}
                        {formatLuas(
                          Number(b.luas_tnh) || 0
                        )}{' '}
                        m²
                      </span>

                      <span>
                        Dampak{' '}
                        {formatLuas(
                          Number(
                            b.luas_terdampak_m2
                          ) || 0
                        )}{' '}
                        m²
                      </span>
                    </div>

                    {b.nama_sewa && (
                      <div className="analysis-field-renter">
                        Disewa oleh:{' '}
                        <strong>
                          {b.nama_sewa}
                        </strong>
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </>
        )}

        {!pemilikAktif &&
          !memuatPemilik &&
          !error && (
            <div className="analysis-empty">
              Pilih nama pemilik untuk melihat
              bidang yang dimiliki.
            </div>
          )}
      </div>
    </section>
  );
}
