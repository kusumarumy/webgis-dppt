import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const sesi = await auth();

  if (!sesi?.user) {
    return new NextResponse('Belum masuk', {
      status: 401,
    });
  }

  try {
    const [row] = await query<{ fc: any }>(`
      SELECT json_build_object(
        'type',
        'FeatureCollection',

        'features',
        COALESCE(
          json_agg(
            json_build_object(
              'type',
              'Feature',

              'id',
              f.id,

              'geometry',
              CASE
                WHEN f.geometry IS NOT NULL
                THEN ST_AsGeoJSON(f.geometry, 6)::json
                ELSE NULL
              END,

              'properties',

              jsonb_build_object(
                'id', f.id,
                'objectid', f.objectid,
                'kodewilaya', f.kodewilaya,
                'kode_bid', f.kode_bid,
                'fid', f.fid,
                'nib', f.nib
              )

              ||

              jsonb_build_object(
                'kecamatan', f.kecamatan,
                'kelurahan', f.kelurahan,
                'rt_rw', f.rt_rw
              )

              ||

              jsonb_build_object(
                'tipehak', f.tipehak,
                'tipeproduk', f.tipeproduk,
                'tahun', f.tahun,
                'surat_hak', f.surat_hak,
                'nomor_hak', f.nomor_hak,
                'beban_hak', f.beban_hak
              )

              ||

              jsonb_build_object(
                'luastertul', f.luastertul,
                'luaspeta', f.luaspeta,
                'luas_tnh', f.luas_tnh,
                'luas_atbt', f.luas_atbt,

                'luas_terdampak_m2',
                f.l_dampak,

                'luas_sisa_m2',
                f.l_sisa,

                'sumbergeom', f.sumbergeom,
                'shape_leng', f.shape_leng,
                'shape_area', f.shape_area
              )

              ||

              jsonb_build_object(
                'alatukur', f.alatukur,
                'metodukur', f.metodukur
              )

              ||

              jsonb_build_object(
                'penggunaan', f.penggunaan,
                'hub_tnh', f.hub_tnh,
                'kode_wwc', f.kode_wwc,
                'jenis_tnh', f.jenis_tnh,
                'ruang_atbt', f.ruang_atbt,
                'sta_tnh', f.sta_tnh,
                'dampak_tnh', f.dampak_tnh,
                'keterangan', f.keterangan
              )

              ||

              jsonb_build_object(
                'nama_milik', f.nama_milik,
                'ttl_milik', f.ttl_milik,
                'krja_milik', f.krja_milik,
                'almt_milik', f.almt_milik,
                'nik_milik', f.nik_milik,
                'nomor_hp', f.nomor_hp
              )

              ||

              jsonb_build_object(
                'jml_bgn', f.jml_bgn,
                'jenis_tnm', f.jenis_tnm,
                'jumlah_tnm', f.jumlah_tnm,
                'jenis_bnd', f.jenis_bnd,
                'jumlah_bnd', f.jumlah_bnd
              )

              ||

              jsonb_build_object(
                'date_updt', f.date_updt,
                'foto_tnh', f.foto_tnh,
                'foto_wwc', f.foto_wwc,
                'created_at', f.created_at
              )

              ||

              jsonb_build_object(
                'status', f.status,
                'catatan_supervisor', f.cat_spv,
                'diverifikasi_pada', f.verif_at
              )
            )
          ),
          '[]'::json
        )
      ) AS fc

      FROM public.bidang_tanah f
    `);

    return NextResponse.json(row.fc, {
      headers: {
        'Cache-Control': 'private, max-age=15',
      },
    });

  } catch (error) {
    console.error(
      'GET /api/bidang ERROR:',
      error
    );

    return NextResponse.json(
      {
        pesan: 'Gagal memuat daftar bidang',
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
