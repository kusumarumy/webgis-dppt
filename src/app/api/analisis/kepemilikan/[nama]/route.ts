import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  try {
    const { nama } = await params;

    const namaBersih = nama?.trim();

    if (!namaBersih) {
      return NextResponse.json(
        { error: 'Nama pemilik tidak valid.' },
        { status: 400 }
      );
    }

    const bidang = await query<{
      id: string;
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
    }>(
      `
      SELECT
        id,
        fid,
        nib,

        nama_milik,
        nik_milik,

        NULL::varchar AS nama_sewa,
        NULL::varchar AS nik_sewa,

        kecamatan,
        kelurahan,

        luas_tnh,

        l_dampak AS luas_terdampak_m2,
        l_sisa AS luas_sisa_m2,

        dampak_tnh,
        penggunaan,
        sta_tnh
      FROM public.bidang_tanah
      WHERE TRIM(nama_milik) = $1
      ORDER BY nib ASC
      `,
      [namaBersih]
    );

    const totalLuas = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_tnh) || 0),
      0
    );

    const totalLuasTerdampak = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_terdampak_m2) || 0),
      0
    );

    const totalLuasSisa = bidang.reduce(
      (total, b) =>
        total + (Number(b.luas_sisa_m2) || 0),
      0
    );

    const jumlahBidangTerdampak =
      bidang.filter(
        (b) =>
          Number(b.luas_terdampak_m2) > 0
      ).length;

    return NextResponse.json({
      pemilik: {
        nama: namaBersih,
      },

      ringkasan: {
        jumlahBidang: bidang.length,
        totalLuas,
        totalLuasTerdampak,
        totalLuasSisa,
        jumlahBidangTerdampak,
      },

      bidang,
    });

  } catch (error) {
    console.error(
      'GET /api/analisis/kepemilikan/[nama] ERROR:',
      error
    );

    return NextResponse.json(
      {
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
