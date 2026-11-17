'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function FormMasuk() {
  const router = useRouter();
  const kembali = useSearchParams().get('kembali') ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false)
  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setGalat(null);
    try {
      const r = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });
      if (r?.error) {
        setGalat('Nama pengguna atau kata sandi tidak cocok.');
        return;
      }
      router.push(kembali);
      router.refresh();
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      <main className="lg-wrap">
        <section className="lg-kiri">
          <Ombak />
          <div className="lg-glow lg-glow-a" />
          <div className="lg-glow lg-glow-b" />
          <header className="lg-brand">
            <div className="lg-logo-box">
              <img
                src="https://bojonegorokab.go.id/portal/assets/img/logo-kabupaten.png"
                alt="Logo Kabupaten Bojonegoro"
              />
            </div>
            <div className="lg-brand-text">
              <b>
                Dinas Pekerjaan Umum Bina Marga dan Penataan Ruang
              </b>
              <span>Pemerintah Kabupaten Bojonegoro</span>
            </div>
          </header>

          <div className="lg-hero">
            <div className="lg-eyebrow">
              <span className="lg-eyebrow-dot" />
              Web Geographic Information System (WebGIS)
            </div>

            <h1>
              Bidang Tanah Terdampak
              <strong>Rencana Pembangunan Trase Jalan</strong>
            </h1>

            <p className="lg-hero-sub">
              Platform pendataan bidang tanah terdampak dari rencana pembangunan
              <strong> Jalur Lingkar Selatan Kabupaten Bojonegoro.</strong>
            </p>

            <div className="lg-angka">
              <div className="lg-stat">
                <span className="lg-stat-icon">
                  <IconRoad />
                </span>
                <div>
                  <b>19,0 <small>km</small></b>
                  <span>Panjang Trase</span>
                </div>
              </div>

              <div className="lg-stat">
                <span className="lg-stat-icon teal">
                  <IconWidth />
                </span>
                <div>
                  <b>26 <small>m</small></b>
                  <span>Lebar ROW</span>
                </div>
              </div>

              <div className="lg-stat">
                <span className="lg-stat-icon gold">
                  <IconParcel />
                </span>
                <div>
                  <b>±672</b>
                  <span>Bidang Terdampak</span>
                </div>
              </div>
            </div>
          </div>

          <Ilustrasi />

          <div className="lg-meta">
            <span>
              <i className="lg-live-dot" />
              DPPT · BOJONEGORO 2026
            </span>
          </div>

          <div className="lg-kaki">
            <span>© 2026 Dinas PUBIMAPR Kabupaten Bojonegoro</span>
          </div>
        </section>
        <section className="lg-kanan">
          <div className="lg-form-shell">
            <div className="lg-form-topline">
              <span className="lg-secure">
                <IconShield />
                Akses Terproteksi
              </span>

              <span className="lg-version">v1.0</span>
            </div>

            <form className="lg-kartu" onSubmit={kirim}>
              <div className="lg-form-heading">
                <div className="lg-login-icon">
                  <IconLogin />
                </div>

                <div>
                  <span className="lg-kode">PORTAL INTERNAL</span>
                  <h2>SELAMAT DATANG</h2>
                </div>
              </div>

              {galat && (
                <div className="lg-galat" role="alert">
                  <span className="lg-alert-icon">
                    <IconAlert />
                  </span>
                  <div>
                    <b>Login tidak berhasil</b>
                    <span>{galat}</span>
                  </div>
                </div>
              )}

              <div className="lg-field">
                <label htmlFor="u">
                  Nama pengguna
                  <span>Wajib diisi</span>
                </label>

                <div className={`lg-input ${username ? 'is-filled' : ''}`}>
                  <span className="lg-input-icon">
                    <IconUser />
                  </span>

                  <input
                    id="u"
                    name="username"
                    type="text"
                    value={username}
                    autoComplete="username"
                    placeholder="Masukkan nama pengguna"
                    required
                    onChange={(e) => setUsername(e.target.value)}
                  />

                  {username && (
                    <span className="lg-check">
                      <IconCheck />
                    </span>
                  )}
                </div>
              </div>

              <div className="lg-field">
                <div className="lg-label-row">
                  <label htmlFor="p">
                    Kata sandi
                    <span>Wajib diisi</span>
                  </label>
                </div>

                <div className={`lg-input ${password ? 'is-filled' : ''}`}>
                  <span className="lg-input-icon">
                    <IconLock />
                  </span>

                  <input
                    id="p"
                    name="password"
                    type={lihat ? 'text' : 'password'}
                    value={password}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="lg-lihat"
                    onClick={() => setLihat((v) => !v)}
                    aria-label={
                      lihat
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                  >
                    {lihat ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div className="lg-form-options">
                <span>
                  <IconShieldMini />
                  Akses WebGIS hanya diperuntukkan bagi pengguna terdaftar.
                </span>
              </div>

              <button className="lg-masuk" disabled={sibuk}>
                <span className="lg-masuk-inner">
                  {sibuk ? (
                    <>
                      <span className="lg-spinner" />
                      Memverifikasi akun...
                    </>
                  ) : (
                    <>
                      Masuk ke WebGIS
                      <IconArrow />
                    </>
                  )}
                </span>
              </button>

              <div className="lg-divider">
                <span>atau</span>
              </div>

              <div className="lg-info">
                <div className="lg-info-icon">
                  <IconInfo />
                </div>

                <div>
                  <b>Belum memiliki akun?</b>
                  <p>
                    Akun dibuat oleh pengelola WebGIS sesuai penugasan.
                    <a href="mailto:dpubimapr@bojonegorokab.go.id">Hubungi Dinas PUBIMAPR</a>
                  </p>
                </div>
              </div>

              <div className="lg-security">
                <IconShield />
                <span>
                  Data dan akses WebGIS diperuntukkan bagi kepentingan
                  kedinasan.
                </span>
              </div>
            </form>

            <div className="lg-form-footer">
              <span>Dinas PUBIMAPR Kabupaten Bojonegoro</span>
              <span className="lg-footer-separator">•</span>
              <span>Jalur Lingkar Selatan</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ================================================================
   SVG DECORATION
================================================================ */

function Ombak() {
  return (
    <svg
      className="lg-ombak"
      viewBox="0 0 800 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B7C9D9" stopOpacity=".7" />
          <stop offset=".55" stopColor="#B7C9D9" stopOpacity=".3" />
          <stop offset="1" stopColor="#B7C9D9" stopOpacity=".55" />
        </linearGradient>
      </defs>

      <g fill="none" stroke="url(#waveFade)" strokeWidth="1.2">
        {Array.from({ length: 15 }, (_, i) => {
          const y = 42 + i * 61;
          let d = `M -40 ${y}`;

          for (let x = 0; x <= 840; x += 70) {
            d += ` Q ${x + 35} ${y + (i % 2 ? 23 : -23)} ${x + 70} ${y}`;
          }

          return (
            <path
              key={i}
              d={d}
              opacity={i % 4 === 0 ? 0.65 : 0.32}
            />
          );
        })}
      </g>
    </svg>
  );
}

function Ilustrasi() {
  const WARNA_BIDANG = [
    '#B7D8CC',
    '#C9E0D7',
    '#E7C982',
    '#DFA77C',
    '#B7D8CC',
    '#D98C8C',
  ];

  const bidang = [
    '8,34 88,22 103,91 15,100',
    '88,22 174,30 166,96 103,91',
    '174,30 255,18 268,90 166,96',
    '255,18 350,34 337,102 268,90',
    '350,34 438,20 455,96 337,102',
    '438,20 535,31 552,100 455,96',
    '535,31 645,17 655,92 552,100',
    '15,165 105,157 118,225 20,232',
    '105,157 205,160 214,222 118,225',
    '205,160 300,151 315,218 214,222',
    '300,151 405,160 414,226 315,218',
    '405,160 510,151 525,219 414,226',
    '510,151 645,160 650,228 525,219',
  ];

  return (
    <div className="lg-gambar">
      <div className="lg-map-label">
        <span className="lg-map-pin">
          <IconMap />
        </span>
        KORIDOR TRASE &amp; BIDANG TANAH
      </div>

      <svg
        viewBox="0 0 660 245"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Ilustrasi bidang tanah dan koridor trase jalan"
      >
        <defs>
          <linearGradient id="roadGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#174A7E" stopOpacity=".02" />
            <stop offset=".5" stopColor="#174A7E" stopOpacity=".18" />
            <stop offset="1" stopColor="#174A7E" stopOpacity=".02" />
          </linearGradient>
        </defs>

        {bidang.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill={WARNA_BIDANG[i % WARNA_BIDANG.length]}
            fillOpacity="0.60"
            stroke="#7891A5"
            strokeWidth="1"
          />
        ))}

        {/* Detail bidang */}
        <g
          fill="none"
          stroke="#7891A5"
          strokeWidth=".65"
          opacity=".34"
        >
          <path d="M45 39l4 39M128 38l7 48M210 32l8 49M292 42l-3 43M383 34l8 51M476 34l5 53M574 29l7 52" />
          <path d="M54 173l5 42M151 168l4 47M246 165l7 45M347 170l2 45M453 164l6 48M567 170l4 46" />
          <path d="M25 65h62M188 61h62M364 58h67M535 56h76" />
        </g>

        {/* Koridor ROW */}
        <path
          d="M -20 108 C 110 94, 205 121, 320 105 S 520 94, 680 112"
          fill="none"
          stroke="url(#roadGlow)"
          strokeWidth="42"
        />

        {/* Batas ROW */}
        <path
          d="M -20 91 C 110 77, 205 104, 320 88 S 520 77, 680 95"
          fill="none"
          stroke="#174A7E"
          strokeWidth="1.5"
          strokeDasharray="7 5"
          opacity=".72"
        />

        <path
          d="M -20 125 C 110 111, 205 138, 320 122 S 520 111, 680 129"
          fill="none"
          stroke="#174A7E"
          strokeWidth="1.5"
          strokeDasharray="7 5"
          opacity=".72"
        />

        {/* Jalan */}
        <path
          d="M -20 108 C 110 94, 205 121, 320 105 S 520 94, 680 112"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="25"
        />

        <path
          d="M -20 108 C 110 94, 205 121, 320 105 S 520 94, 680 112"
          fill="none"
          stroke="#174A7E"
          strokeWidth="2.5"
        />

        {/* Patok survey */}
        {[105, 245, 390, 535].map((x) => (
          <g key={x}>
            <circle
              cx={x}
              cy="105"
              r="5.4"
              fill="#FFFFFF"
              stroke="#174A7E"
              strokeWidth="2"
            />
            <circle cx={x} cy="105" r="2" fill="#174A7E" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ================================================================
   ICONS
================================================================ */

function IconRoad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 21l3-18M16 21l-3-18" />
      <path d="M12 6v3M12 12v3M12 18v2" />
    </svg>
  );
}

function IconWidth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4" />
    </svg>
  );
}

function IconParcel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
      <path d="M4 12l8 4.5 8-4.5M4 16l8 4.5 8-4.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8" />
      <path d="M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.9 2.3-2.4 3.6M6.3 6.7C4 8.2 3 10.2 3 12c0 2 4 7 9 7 1.2 0 2.3-.2 3.3-.6" />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 17v2.2A1.8 1.8 0 006.8 21h10.4a1.8 1.8 0 001.8-1.8V17" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconShieldMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2v.1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4 4L19 7" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 7l5 5-5 5" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5v.2" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export default function Masuk() {
  return (
    <Suspense fallback={<div className="lg-wrap" />}>
      <FormMasuk />
    </Suspense>
  );
}
