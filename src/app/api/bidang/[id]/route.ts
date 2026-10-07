import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { query, transaksi } from "@/lib/db";
import { dapatMengubahAtribut } from "@/lib/rbac";
import type { StatusBidang } from "@/types";

type Ctx = {
  params: Promise<{ id: string }>;
};

const angkaOpsional = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === "") {
      return null;
    }

    const n = Number(value);

    return Number.isFinite(n) ? n : value;
  },
  z.number().nonnegative().nullable().optional()
);

const tahunOpsional = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === "") {
      return null;
    }

    const n = Number(value);

    return Number.isFinite(n) ? n : value;
  },
  z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
);

function terisi(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return true;
}
/* =========================================================
   GET DETAIL BIDANG
   GET /api/bidang/:id
   ========================================================= */

export async function GET(
  _req: Request,
  { params }: Ctx
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse("Belum masuk", {
      status: 401,
    });
  }

  const { id } = await params;

  try {
    const [b] = await query<any>(
      `
        SELECT
          id,
          objectid,
          kodewilaya,
          kecamatan,
          kelurahan,
          tipehak,
          tipeproduk,
          tahun,

          nib,

          luastertul,
          luaspeta,
          luas_tnh,

          l_dampak AS luas_terdampak_m2,
          l_sisa AS luas_sisa_m2,

          sumbergeom,

          alatukur,
          penggunaan,
          metodukur,

          shape_leng,
          shape_area,

          hub_tnh,
          kode_wwc,
          jenis_tnh,

          kode_bid,
          rt_rw,

          nama_milik,
          ttl_milik,
          krja_milik,
          almt_milik,
          nik_milik,

          nomor_hp,

          sta_tnh,
          surat_hak,
          nomor_hak,

          ruang_atbt,
          luas_atbt,

          jenis_tnm,
          jumlah_tnm,

          jenis_bnd,
          jumlah_bnd,

          beban_hak,
          dampak_tnh,
          jml_bgn,

          date_updt,
          foto_tnh,
          foto_wwc,

          keterangan,

          fid,

          status,

          cat_spv,
          verif_at,

          created_at

        FROM public.bidang_tanah
        WHERE fid = $1
      `,
      [id]
    );

    if (!b) {
      return new NextResponse(
        "Bidang tidak ditemukan",
        {
          status: 404,
        }
      );
    }


    /* =====================================================
       RIWAYAT AKSI
       ===================================================== */

    const hasilRiwayat = await query<any>(
      `
        SELECT
          al.id,
          al.aksi,
          al.kolom,
          al.nilai_lama,
          al.nilai_baru,
          al.pada,
          p.nama AS nama_pengguna

        FROM public.audit_log al

        LEFT JOIN public.pengguna p
          ON p.id = al.pengguna_id

        WHERE al.tabel = 'bidang_tanah'

          /*
           * audit_log.bidang_id bertipe character varying.
           *
           * Data baru memakai FID.
           * Data lama mungkin masih memakai id alfanumerik.
           *
           * Karena itu kita cek keduanya.
           */
          AND al.bidang_id IN (
            $1::text,
            $2::text
          )

        ORDER BY
          al.pada DESC,
          al.id DESC
      `,
      [
        String(b.fid),
        String(b.id),
      ]
    );


    /* =====================================================
       LAMPIRAN / FOTO
       ===================================================== */

    const hasilLampiran = await query<any>(
      `
        SELECT
          id,
          fid,
          kategori,
          object_key,
          nama_asli,
          mime,
          ukuran_byte,
          lat,
          lon,
          diambil_pada,
          diunggah_pada,
          sensitif

        FROM public.lampiran

        WHERE fid = $1

        ORDER BY
          diunggah_pada DESC,
          id DESC
      `,
      [b.fid]
    );


    /* =====================================================
       DATA BIDANG
       ===================================================== */

    const bidang = {
      id: String(b.fid),

      kode:
        b.kode_bid ??
        b.fid ??
        null,

      objectid: b.objectid,
      kodewilaya: b.kodewilaya,
      kode_bid: b.kode_bid,
      fid: b.fid,

      desa: b.kelurahan,
      kelurahan: b.kelurahan,
      kecamatan: b.kecamatan,
      rt_rw: b.rt_rw,

      luas_m2: b.luas_tnh,
      luas_tnh: b.luas_tnh,
      luastertul: b.luastertul,
      luaspeta: b.luaspeta,

      luas_terdampak_m2:
        b.luas_terdampak_m2,

      luas_sisa_m2:
        b.luas_sisa_m2,

      sumbergeom: b.sumbergeom,
      shape_leng: b.shape_leng,
      shape_area: b.shape_area,

      penggunaan: b.penggunaan,

      tipehak: b.tipehak,
      tipeproduk: b.tipeproduk,

      nib: b.nib,

      sta_tnh: b.sta_tnh,
      surat_hak: b.surat_hak,
      nomor_hak: b.nomor_hak,
      beban_hak: b.beban_hak,

      tahun: b.tahun,

      alatukur: b.alatukur,
      metodukur: b.metodukur,

      pemilik: b.nama_milik
        ? [
            {
              id: String(b.fid),
              urutan: 1,
              nama: b.nama_milik,
              ttl: b.ttl_milik,
              pekerjaan: b.krja_milik,
              alamat: b.almt_milik,
              nik: b.nik_milik,
              telepon: b.nomor_hp,
              hubungan: null,
              npwp: null,
              bank_nama: null,
              bank_rek: null,
            },
          ]
        : [],

      nama_milik: b.nama_milik,
      ttl_milik: b.ttl_milik,
      krja_milik: b.krja_milik,
      almt_milik: b.almt_milik,
      nik_milik: b.nik_milik,

      nomor_hp: b.nomor_hp,

      hub_tnh: b.hub_tnh,
      kode_wwc: b.kode_wwc,
      jenis_tnh: b.jenis_tnh,

      ruang_atbt: b.ruang_atbt,
      luas_atbt: b.luas_atbt,

      dampak_tnh: b.dampak_tnh,

      jml_bgn: b.jml_bgn,

      jenis_tnm: b.jenis_tnm,
      jumlah_tnm: b.jumlah_tnm,

      jenis_bnd: b.jenis_bnd,
      jumlah_bnd: b.jumlah_bnd,

      foto_tnh: b.foto_tnh,
      foto_wwc: b.foto_wwc,

      keterangan: b.keterangan,

      date_updt: b.date_updt,
      created_at: b.created_at,

      status: b.status,

      cat_spv: b.cat_spv,
      verif_at: b.verif_at,


      lampiran: hasilLampiran.map((l) => ({
        id: String(l.id),
        fid: l.fid,
        kategori: l.kategori,
        object_key: l.object_key,
        nama_asli: l.nama_asli,
        mime: l.mime,
        ukuran_byte: l.ukuran_byte,
        lat: l.lat,
        lon: l.lon,
        diambil_pada: l.diambil_pada,
        diunggah_pada: l.diunggah_pada,
        sensitif: l.sensitif,
      })),


      /* ===================================================
         RIWAYAT
         =================================================== */

      riwayat: hasilRiwayat.map((r) => ({
        id: r.id,
        aksi: r.aksi,
        kolom: r.kolom,
        nilai_lama: r.nilai_lama,
        nilai_baru: r.nilai_baru,
        pada: r.pada,
        nama_pengguna: r.nama_pengguna,
      })),
    };

    return NextResponse.json(bidang);

  } catch (error) {
    console.error(
      "GET /api/bidang/[id] ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan: "Gagal memuat data bidang",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
   SCHEMA UPDATE
   ========================================================= */

const SkemaUbah = z.object({
  kecamatan:
    z.string().max(120).nullish(),

  kelurahan:
    z.string().max(120).nullish(),

  rt_rw:
    z.string().max(120).nullish(),

  kodewilaya:
    z.string().max(120).nullish(),

  kode_bid:
    z.string().max(120).nullish(),

  tipehak:
    z.string().max(120).nullish(),

  tipeproduk:
    z.string().max(120).nullish(),

  nib:
    z.string().max(100).nullish(),

  tahun:
    tahunOpsional,

  surat_hak:
    z.string().max(160).nullish(),

  nomor_hak:
    z.string().max(160).nullish(),

  beban_hak:
    z.string().max(160).nullish(),

  penggunaan:
    z.string().max(120).nullish(),

  hub_tnh:
    z.string().max(120).nullish(),

  kode_wwc:
    z.string().max(120).nullish(),

  jenis_tnh:
    z.string().max(120).nullish(),

  sta_tnh:
    z.string().max(120).nullish(),

  dampak_tnh:
    z.string().max(160).nullish(),

  alatukur:
    z.string().max(120).nullish(),

  metodukur:
    z.string().max(120).nullish(),

  luas_tnh:
    angkaOpsional,

  luastertul:
    angkaOpsional,

  luaspeta:
    angkaOpsional,

  sumbergeom:
    angkaOpsional,

  shape_leng:
    angkaOpsional,

  shape_area:
    angkaOpsional,

  luas_atbt:
    z.string().max(120).nullish(),

  ruang_atbt:
    z.string().max(120).nullish(),

  luas_terdampak_m2:
    angkaOpsional,

  luas_sisa_m2:
    angkaOpsional,

  nama_milik:
    z.string().max(160).nullish(),

  ttl_milik:
    z.string().max(160).nullish(),

  krja_milik:
    z.string().max(120).nullish(),

  almt_milik:
    z.string().max(240).nullish(),

  nik_milik:
    z.string().max(32).nullish(),

  nomor_hp:
    z.string().max(40).nullish(),

  jenis_tnm:
    z.string().max(160).nullish(),

  jumlah_tnm:
    z.string().max(120).nullish(),

  jenis_bnd:
    z.string().max(160).nullish(),

  jumlah_bnd:
    z.string().max(120).nullish(),

  jml_bgn:
    z.string().max(120).nullish(),

  date_updt:
    z.string().nullish(),

  keterangan:
    z.string().max(1000).nullish(),

});


/* =========================================================
   MAP FIELD API → FIELD DATABASE
   ========================================================= */

const FIELD_DB: Record<string, string> = {
  kecamatan: "kecamatan",
  kelurahan: "kelurahan",
  rt_rw: "rt_rw",

  kodewilaya: "kodewilaya",
  kode_bid: "kode_bid",

  tipehak: "tipehak",
  tipeproduk: "tipeproduk",

  nib: "nib",
  tahun: "tahun",

  surat_hak: "surat_hak",
  nomor_hak: "nomor_hak",
  beban_hak: "beban_hak",

  penggunaan: "penggunaan",
  hub_tnh: "hub_tnh",
  kode_wwc: "kode_wwc",
  jenis_tnh: "jenis_tnh",
  sta_tnh: "sta_tnh",
  dampak_tnh: "dampak_tnh",

  alatukur: "alatukur",
  metodukur: "metodukur",

  luas_tnh: "luas_tnh",
  luastertul: "luastertul",
  luaspeta: "luaspeta",

  sumbergeom: "sumbergeom",
  shape_leng: "shape_leng",
  shape_area: "shape_area",

  luas_atbt: "luas_atbt",
  ruang_atbt: "ruang_atbt",

  luas_terdampak_m2: "l_dampak",
  luas_sisa_m2: "l_sisa",

  nama_milik: "nama_milik",
  ttl_milik: "ttl_milik",
  krja_milik: "krja_milik",
  almt_milik: "almt_milik",
  nik_milik: "nik_milik",

  nomor_hp: "nomor_hp",

  jenis_tnm: "jenis_tnm",
  jumlah_tnm: "jumlah_tnm",

  jenis_bnd: "jenis_bnd",
  jumlah_bnd: "jumlah_bnd",

  jml_bgn: "jml_bgn",

  date_updt: "date_updt",
  keterangan: "keterangan",

};


/* =========================================================
   PATCH UPDATE BIDANG
   ========================================================= */

export async function PATCH(
  req: Request,
  { params }: Ctx
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse("Belum masuk", {
      status: 401,
    });
  }

  const namaAkun =
    sesi.user.name ?? null;

  const ipAddress =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const { id } = await params;

  try {
    const [row] =
      await query<{
        fid: number;
        status: StatusBidang;
      }>(
        `
          SELECT
            fid,
            status
          FROM public.bidang_tanah
          WHERE fid = $1
        `,
        [id]
      );

    if (!row) {
      return new NextResponse(
        "Bidang tidak ditemukan",
        {
          status: 404,
        }
      );
    }

    if (
      !dapatMengubahAtribut(
        sesi.user.peran,
        row.status
      )
    ) {
      return new NextResponse(
        "Bidang terkunci untuk peran ini",
        {
          status: 403,
        }
      );
    }

    const parsed =
      SkemaUbah.safeParse(
        await req.json()
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          pesan: "Data tidak valid",
          detail:
            parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Ambil hanya field yang benar-benar
     * dikirim oleh frontend.
     */
    const isiApi = Object.entries(
      parsed.data
    ).filter(
      ([, value]) =>
        value !== undefined
    );

    if (!isiApi.length) {
      return NextResponse.json({
        ok: true,
      });
    }

    /*
     * Ubah nama field API menjadi
     * nama kolom PostgreSQL.
     */
    const isi = isiApi.map(
      ([kolom, nilai]) => {
        const kolomDb =
          FIELD_DB[kolom];

        if (!kolomDb) {
          throw new Error(
            `Kolom tidak diizinkan: ${kolom}`
          );
        }

        return [
          kolomDb,
          nilai,
          kolom,
        ] as const;
      }
    );

    let statusAkhir: StatusBidang = row.status;
    let lengkap = false;

    await transaksi(
      sesi.user.id,
      async (c) => {
        const hasilLama =
          await c.query<any>(
            `
              SELECT *
              FROM public.bidang_tanah
              WHERE fid = $1
              FOR UPDATE
            `,
            [id]
          );

        const lama =
          hasilLama.rows[0];

        if (!lama) {
          throw new Error(
            "Bidang tidak ditemukan"
          );
        }

        /*
         * Bangun SET menggunakan
         * nama kolom database.
         */
        const set = isi
          .map(
            ([kolomDb], index) =>
              `${kolomDb} = $${index + 2}`
          )
          .join(", ");

        const nilaiUpdate =
          isi.map(
            ([, nilai]) => nilai
          );

        await c.query(
          `
            UPDATE public.bidang_tanah
            SET ${set}
            WHERE fid = $1
          `,
          [
            id,
            ...nilaiUpdate,
          ]
        );

        /*
         * Ambil data terbaru setelah update.
         * Data ini digunakan untuk menentukan
         * apakah bidang sudah lengkap.
         */
        const hasilBaru =
          await c.query<{
            fid: number;
            nama_milik: string | null;
            nib: string | null;
            luas_tnh: number | null;
            luastertul: number | null;
            luaspeta: number | null;
            penggunaan: string | null;
            jml_bgn: string | null;
            status: StatusBidang;
          }>(
            `
              SELECT
                fid,
                nama_milik,
                nib,
                luas_tnh,
                luastertul,
                luaspeta,
                penggunaan,
                jml_bgn,
                status
              FROM public.bidang_tanah
              WHERE fid = $1
            `,
            [id]
          );

        const baru =
          hasilBaru.rows[0];

        if (!baru) {
          throw new Error(
            "Data bidang tidak ditemukan setelah diperbarui"
          );
        }

        /*
         * Cek kelengkapan data untuk pendata.
         *
         * Pendata tidak mengirim secara manual.
         * Jika data pada status draft/revisi sudah
         * lengkap, bidang otomatis masuk ke tahap
         * menunggu verifikasi.
         */
        statusAkhir = baru.status;

        if (
          sesi.user.peran === "pendata" &&
          (
            baru.status === "draft" ||
            baru.status === "revisi"
          )
        ) {
          const dataUtamaLengkap =
            terisi(baru.nama_milik) &&
            terisi(baru.nib) &&
            (
              terisi(baru.luas_tnh) ||
              terisi(baru.luastertul) ||
              terisi(baru.luaspeta)
            ) &&
            terisi(baru.penggunaan) &&
            terisi(baru.jml_bgn);

          const hasilLampiran =
            await c.query<{
              kategori: string;
            }>(
              `
                SELECT DISTINCT kategori
                FROM public.lampiran
                WHERE fid = $1
              `,
              [baru.fid]
            );

          const kategoriLampiran =
            new Set(
              hasilLampiran.rows.map(
                (r) => r.kategori
              )
            );

          const fotoLengkap =
            kategoriLampiran.has(
              "foto_bidang"
            ) &&
            kategoriLampiran.has(
              "foto_pemilik_petugas"
            );

          lengkap =
            dataUtamaLengkap &&
            fotoLengkap;

          if (lengkap) {
            await c.query(
              `
                UPDATE public.bidang_tanah
                SET
                  status = 'terkirim',
                  verif_at = NULL
                WHERE fid = $1
              `,
              [id]
            );

            statusAkhir = "terkirim";
          }
        }
        /*
         * Audit perubahan status otomatis.
         */
        if (
          statusAkhir !== lama.status
        ) {
          await c.query(
            `
              INSERT INTO public.audit_log (
                tabel,
                record_id,
                bidang_id,
                aksi,
                kolom,
                nilai_lama,
                nilai_baru,
                pengguna_id,
                nama_akun,
                ip_address,
                pada
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                NOW()
              )
            `,
            [
              "bidang_tanah",
              lama.fid,
              id,
              "UPDATE",
              "status",
              lama.status,
              statusAkhir,
              sesi.user.id,
              namaAkun,
              ipAddress,
            ]
          );
        }

        /*
         * Audit perubahan atribut.
         */
        for (
          const [
            kolomDb,
            nilaiBaru,
            kolomApi,
          ] of isi
        ) {
          const nilaiLama =
            lama[kolomDb];

          const lamaText =
            nilaiLama == null
              ? null
              : String(nilaiLama);

          const baruText =
            nilaiBaru == null
              ? null
              : String(nilaiBaru);

          if (
            lamaText === baruText
          ) {
            continue;
          }

          let aksi:
            | "INPUT"
            | "UPDATE"
            | "DELETE";

          const lamaKosong =
            lamaText == null ||
            lamaText.trim() === "";

          const baruKosong =
            baruText == null ||
            baruText.trim() === "";

          if (
            lamaKosong &&
            !baruKosong
          ) {
            aksi = "INPUT";
          } else if (
            !lamaKosong &&
            baruKosong
          ) {
            aksi = "DELETE";
          } else {
            aksi = "UPDATE";
          }

          await c.query(
            `
              INSERT INTO public.audit_log (
                tabel,
                record_id,
                bidang_id,
                aksi,
                kolom,
                nilai_lama,
                nilai_baru,
                pengguna_id,
                nama_akun,
                ip_address,
                pada
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                NOW()
              )
            `,
            [
              "bidang_tanah",
              lama.fid,
              id,
              aksi,
              kolomApi,
              lamaText,
              baruText,
              sesi.user.id,
              namaAkun,
              ipAddress,
            ]
          );
        }
      }
    );

    return NextResponse.json({
      ok: true,
      status: statusAkhir,
      lengkap,
    });

  } catch (error) {
    console.error(
      "PATCH /api/bidang/[id] ERROR:",
      error
    );

    return NextResponse.json(
      {
        pesan:
          "Gagal memperbarui bidang",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
