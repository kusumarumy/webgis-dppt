'use client';

import { create } from 'zustand';
import type { Bidang, StatusBidang } from '@/types';

export type Tema = 'auto' | 'light' | 'dark';

export type Basemap =
  | 'esri-streets'
  | 'esri'
  | 'ortho'
  | 'google-hybrid'
  | 'google-streets'
  | 'opentopo';

export type SumberDTM =
  | 'off'
  | 'trace'
  | 'aws';
export type PewarnaanBidang =
  | 'status'
  | 'penggunaan';
export type ModeAnalisis =
  | 'none'
  | 'kepemilikan';
export interface FilterBidang {
  status: string[];
  kecamatan: string[];
  kelurahan: string[];
  tipehak: string[];
  penggunaan: string[];
}

export const FILTER_KOSONG: FilterBidang = {
  status: [],
  kecamatan: [],
  kelurahan: [],
  tipehak: [],
  penggunaan: [],
};

interface AppState {
  tema: Tema;
  basemap: Basemap;
  dtm: SumberDTM;
  exag: number;
  pewarnaan: PewarnaanBidang;
  labelNomor: boolean;
  modeAnalisis: ModeAnalisis;
  layerAktif: Record<string, boolean>;
  filterBidang: FilterBidang;
  bidangTerpilih: string | null;
  kartu: Bidang | null;
  memuatKartu: boolean;
  pesan: string | null;
  setTema: (t: Tema) => void;
  setBasemap: (b: Basemap) => void;
  setDTM: (d: SumberDTM) => void;
  setExag: (n: number) => void;
  setPewarnaan: (p: PewarnaanBidang) => void;
  setLabelNomor: (v: boolean) => void;
  setModeAnalisis: (
    mode: ModeAnalisis
  ) => void;
  resetModeAnalisis: () => void;
  toggleLayer: (
    id: string,
    v: boolean
  ) => void;
  setFilterBidang: (
    filter: FilterBidang
  ) => void;
  resetFilterBidang: () => void;
  pilihBidang: (
    id: string | null
  ) => Promise<void>;
  muatUlangKartu: () => Promise<void>;
  setStatusLokal: (
    id: string,
    s: StatusBidang
  ) => void;
  beriPesan: (
    p: string | null
  ) => void;
}

export const useApp = create<AppState>(
  (set, get) => ({
    tema: 'auto',
    basemap: 'esri-streets',
    dtm: 'off',
    exag: 1.8,
    pewarnaan: 'penggunaan',
    labelNomor: false,
    modeAnalisis: 'none',
    layerAktif: {
      traseg: true,
      bidang: true,
      sawah: false,
      hutan: false,
      pemukiman: false,
      pemakaman: false,
      jalan: false,
      rel_kereta: false,
      sungai: false,
      kabel_sutet: false,
      tiang_sutet: false,
      pipa_exxon: false,
      pipa_gresem: false,
    },

    filterBidang: {
      ...FILTER_KOSONG,
    },

    bidangTerpilih: null,

    kartu: null,

    memuatKartu: false,

    pesan: null,

    setTema: (tema) => {

      localStorage.setItem(
        'dppt-tema',
        tema
      );

      const gelap =
        tema === 'dark' ||
        (
          tema === 'auto' &&
          matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches
        );

      document.documentElement.dataset.theme =
        gelap ? 'dark' : 'light';

      set({ tema });
    },
    setBasemap: (basemap) =>
      set({ basemap }),

    setDTM: (dtm) =>
      set({ dtm }),

    setExag: (exag) =>
      set({ exag }),

    setPewarnaan: (pewarnaan) =>
      set({ pewarnaan }),

    setLabelNomor: (labelNomor) =>
      set({ labelNomor }),

    setModeAnalisis: (modeAnalisis) =>
      set({
        modeAnalisis,
      }),

    resetModeAnalisis: () =>
      set({
        modeAnalisis: 'none',
      }),

    toggleLayer: (id, v) =>
      set((s) => ({
        layerAktif: {
          ...s.layerAktif,
          [id]: v,
        },
      })),

    /* =====================================================
       FILTER
       ===================================================== */

    setFilterBidang: (filter) =>
      set({
        filterBidang: {
          ...filter,
        },
      }),

    resetFilterBidang: () =>
      set({
        filterBidang: {
          ...FILTER_KOSONG,
        },
      }),

    /* =====================================================
       PILIH BIDANG
       ===================================================== */

    pilihBidang: async (id) => {

      if (!id) {

        set({
          bidangTerpilih: null,
          kartu: null,
        });

        return;
      }

      set({
        bidangTerpilih: id,
        memuatKartu: true,
      });

      try {

        const r =
          await fetch(
            `/api/bidang/${id}`
          );

        if (!r.ok) {

          throw new Error(
            await r.text()
          );

        }

        set({
          kartu: await r.json(),
          memuatKartu: false,
        });

      } catch (e: any) {

        set({
          memuatKartu: false,

          pesan:
            'Kartu bidang gagal dimuat. ' +
            e.message,
        });

      }
    },

    /* =====================================================
       MUAT ULANG KARTU
       ===================================================== */

    muatUlangKartu: async () => {

      const id =
        get().bidangTerpilih;

      if (id) {

        await get().pilihBidang(id);

      }

    },

    /* =====================================================
       STATUS LOKAL
       ===================================================== */

    setStatusLokal: (
      id,
      status
    ) =>
      set((s) =>
        s.kartu &&
        s.kartu.id === id
          ? {
              kartu: {
                ...s.kartu,
                status,
              },
            }
          : {}
      ),

    /* =====================================================
       PESAN
       ===================================================== */

    beriPesan: (pesan) =>
      set({ pesan }),

  })
);
