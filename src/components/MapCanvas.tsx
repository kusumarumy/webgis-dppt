'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, {
  Map as MLMap,
  Popup
} from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useApp, type Basemap } from '@/store/useApp';

import {
  LAYERS,
  DTM
} from './layers';

const pmtiles = new Protocol();
let protokolTerpasang = false;

class AppScaleControl extends maplibregl.ScaleControl {
  private element: HTMLElement | null = null;
  onAdd(map: MLMap) {
    this.element = super.onAdd(map);
    return this.element;
  }
  getElement() {
    return this.element;
  }
}

const TRASEG_URL =
  'https://raw.githubusercontent.com/kusumarumy/sipetak-bojonegoro/main/data/wgs84/traseg.geojson';

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const url = value.trim();

  if (!url) {
    return null;
  }

  if (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('/')
  ) {
    return url;
  }

  return null;
}

export default function MapCanvas() {
const ref =
  useRef<HTMLDivElement>(null);

const mapRef =
  useRef<MLMap | null>(null);

const scaleSlotRef =
  useRef<HTMLDivElement>(null);

const popupRef =
  useRef<Popup | null>(null);
const terpilihRef =
  useRef<string | number | null>(null);
  const analisisRef =
    useRef<(string | number)[]>([]);
  const layerLoadingDimintaRef =
    useRef<Set<string>>(new Set());
  const [infoPeta, setInfoPeta] =
    useState({
      lon: 0,
      lat: 0,
      zoom: 0,
      pitch: 0,
      bearing: 0
    });
  const [layerLoading, setLayerLoading] =
    useState<string[]>([]);
  const [orthoLoading, setOrthoLoading] =
  useState(false);
  const orthoLoadingTimerRef =
  useRef<ReturnType<typeof setTimeout> | null>(null);

const orthoRequestRef =
  useRef(0);
  const [bangunanTerpilih, setBangunanTerpilih] =
    useState<Record<string, any> | null>(null);
const {
  basemap,
  dtm,
  layerAktif,
  tema,
  filterBidang,
  pilihBidang,
  beriPesan
} = useApp();
 const sourceLayerIds =
    new Set(
      LAYERS.map(
        (layer) => layer.id
      )
    );

  const selesaiLoadingLayer = (
    sourceId: string
  ) => {
    if (
      !sourceLayerIds.has(
        sourceId
      )
    ) {
      return;
    }

    layerLoadingDimintaRef.current.delete(
      sourceId
    );

    setLayerLoading(
      (prev) =>
        prev.filter(
          (id) =>
            id !== sourceId
        )
    );
  };

  const cekSumberSelesai = (
    sourceId: string
  ) => {
    requestAnimationFrame(
      () => {
        if (
          !mapRef.current ||
          !layerLoadingDimintaRef.current.has(
            sourceId
          )
        ) {
          return;
        }

        if (
          mapRef.current.isSourceLoaded(
            sourceId
          )
        ) {
          selesaiLoadingLayer(
            sourceId
          );
        }
      }
    );
  };
  useEffect(() => {
    const handleAnalisisBidang = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          ids?: (string | number)[];
        }>;

      const ids =
        customEvent.detail?.ids ?? [];

      for (
        const id
        of analisisRef.current
      ) {
        mapRef.current?.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: false
          }
        );
      }

      analisisRef.current = [];

      const map =
        mapRef.current;

      if (
        !map ||
        ids.length === 0
      ) {
        return;
      }
      for (
        const id
        of ids
      ) {
        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: true
          }
        );
      }
      analisisRef.current = ids;
    };
    window.addEventListener(
      'analisis-bidang',
      handleAnalisisBidang
    );
    return () => {
      window.removeEventListener(
        'analisis-bidang',
        handleAnalisisBidang
      );
    };
  }, []);

  useEffect(() => {
    const handleResetAnalisis = () => {
      const map = mapRef.current;
      popupRef.current?.remove();
      popupRef.current = null;
      if (map) {
        for (const id of analisisRef.current) {
          map.setFeatureState(
            {
              source: 'bidang',
              id
            },
            {
              analisis: false
            }
          );
        }
        if (terpilihRef.current !== null) {
          map.setFeatureState(
            {
              source: 'bidang',
              id: terpilihRef.current
            },
            {
              sel: false
            }
          );
        }
      }

      analisisRef.current = [];
      terpilihRef.current = null;
      setBangunanTerpilih(null);
    };
    window.addEventListener(
      'reset-analisis-bidang',
      handleResetAnalisis
    );
    return () => {
      window.removeEventListener(
        'reset-analisis-bidang',
        handleResetAnalisis
      );
    };
  }, []);

  useEffect(() => {
    const handleResetPilihanBidang = () => {
      const map = mapRef.current;
      if (
        map &&
        terpilihRef.current !== null
      ) {
        map.setFeatureState(
          {
            source: 'bidang',
            id: terpilihRef.current
          },
          {
            sel: false
          }
        );
      }
      terpilihRef.current = null;
      setBangunanTerpilih(null);
      popupRef.current?.remove();
      popupRef.current = null;
    };
    window.addEventListener(
      'reset-pilihan-bidang',
      handleResetPilihanBidang
    );
    return () => {
      window.removeEventListener(
        'reset-pilihan-bidang',
        handleResetPilihanBidang
      );
    };
  }, []);

  useEffect(() => {
    const handleFokusBidang = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          id?: string | number;
        }>;
      const id =
        customEvent.detail?.id;
      const map =
        mapRef.current;
      if (
        id === undefined ||
        !map
      ) {
        return;
      }
      const fokus = () => {
        if (!map.isStyleLoaded()) {
          return;
        }
        if (!map.getSource('bidang')) {
          return;
        }
        const features =
          map.querySourceFeatures(
            'bidang'
          );
        const feature =
          features.find(
            (f) =>
              String(f.id) ===
              String(id)
          );
        if (!feature) {
          console.warn(
            'Bidang tidak ditemukan di source:',
            id
          );
          return;
        }
        if (
          feature.id !== undefined
        ) {
          sorot(
            map,
            feature.id
          );
        }

        const bounds =
          new maplibregl.LngLatBounds();

        const tambahKoordinat = (
          coords: any
        ) => {
          if (
            !Array.isArray(coords)
          ) {
            return;
          }

          if (
            coords.length >= 2 &&
            typeof coords[0] ===
              'number' &&
            typeof coords[1] ===
              'number'
          ) {
            bounds.extend(
              coords as [
                number,
                number
              ]
            );

            return;
          }

          for (
            const c of coords
          ) {
            tambahKoordinat(c);
          }
        };

        const geometry =
          feature.geometry as any;

        if (
          geometry?.coordinates
        ) {
          tambahKoordinat(
            geometry.coordinates
          );
        }

        if (
          bounds.isEmpty()
        ) {
          return;
        }

        map.fitBounds(
          bounds,
          {
            padding: {
              top: 170,
              bottom: 120,
              left: 470,
              right: 430
            },
            duration: 900,
            maxZoom: 18
          }
        );
      };

      if (
        map.isStyleLoaded()
      ) {
        fokus();
      } else {
        map.once(
          'load',
          fokus
        );
      }
    };

    window.addEventListener(
      'fokus-bidang',
      handleFokusBidang
    );

    return () => {
      window.removeEventListener(
        'fokus-bidang',
        handleFokusBidang
      );
    };
  }, []);

  useEffect(() => {
    if (
      !ref.current ||
      mapRef.current
    ) {
      return;
    }
    if (!protokolTerpasang) {
      maplibregl.addProtocol(
        'pmtiles',
        pmtiles.tile
      );

      protokolTerpasang = true;
    }

    const sources: any = {
      'esri-streets': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri'
      },

      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri'
      },

      'google-hybrid': {
        type: 'raster',
        tiles: [
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: '© Google'
      },

      'google-streets': {
        type: 'raster',
        tiles: [
          'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: '© Google'
      },

      opentopo: {
        type: 'raster',
        tiles: [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 17,
        attribution:
          '© OpenTopoMap (CC-BY-SA)'
      }
    };

    sources.ortho = {
      type: 'raster',
      tiles: [
        'https://dppt-bojonegoro.ruli-andaru.workers.dev/orthophoto/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      minzoom: 10,
      maxzoom: 21,
      attribution:
        'Orthophoto DPPT Bojonegoro 2026'
    };

if (DTM.trace) {
  sources.dtm = {
    type: 'raster-dem',
    tiles: [DTM.trace],
    tileSize: 256,
    encoding: 'terrarium',
    minzoom: 17,
    maxzoom: 17
  };
}

if (DTM.aws) {
  sources.dtm_aws = {
    type: 'raster-dem',
    tiles: [DTM.aws],
    tileSize: 256,
    encoding: 'terrarium',
    minzoom: 0,
    maxzoom: 15
  };
}


    const layersAwal: any[] = [
      {
        id: 'bg',
        type: 'background',

        paint: {
          'background-color':
            '#0E1720'
        }
      },

      {
        id: 'bm-esri-streets',
        type: 'raster',
        source: 'esri-streets',

        layout: {
          visibility:
            basemap ===
            'esri-streets'
              ? 'visible'
              : 'none'
        },

        paint: {
          'raster-saturation':
            -0.5
        }
      },

      {
        id: 'bm-esri',
        type: 'raster',
        source: 'esri',

        layout: {
          visibility:
            basemap === 'esri'
              ? 'visible'
              : 'none'
        }
      },

      {
        id: 'bm-google-hybrid',
        type: 'raster',
        source:
          'google-hybrid',

        layout: {
          visibility:
            basemap ===
            'google-hybrid'
              ? 'visible'
              : 'none'
        }
      },

      {
        id: 'bm-google-streets',
        type: 'raster',
        source:
          'google-streets',

        layout: {
          visibility:
            basemap ===
            'google-streets'
              ? 'visible'
              : 'none'
        }
      },

      {
        id: 'bm-opentopo',
        type: 'raster',
        source: 'opentopo',

        layout: {
          visibility:
            basemap ===
            'opentopo'
              ? 'visible'
              : 'none'
        }
      }
    ];

    layersAwal.push({
      id: 'bm-ortho',
      type: 'raster',
      source: 'ortho',

      layout: {
        visibility:
          basemap === 'ortho'
            ? 'visible'
            : 'none'
      }
    });

    const map =
      new maplibregl.Map({
        container: ref.current,
        center: [
          111.879,
          -7.168
        ],
        zoom: 12.4,
        bearing: 18,
        maxPitch: 75,
        attributionControl:
          false,
        style: {
          version: 8,
          glyphs:
            'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          sources,
          layers:
            layersAwal
        }
      });

    mapRef.current = map;

    const mulaiLoadingLayer = (
      sourceId: string
    ) => {
      if (
        !sourceLayerIds.has(
          sourceId
        )
      ) {
        return;
      }

      if (
        !layerLoadingDimintaRef.current.has(
          sourceId
        )
      ) {
        return;
      }

      const layer =
        LAYERS.find(
          (l) =>
            l.id === sourceId
        );

      if (!layer) {
        return;
      }

      setLayerLoading(
        (prev) =>
          prev.includes(sourceId)
            ? prev
            : [
                ...prev,
                sourceId
              ]
      );
    };

    const cekSumberSelesai = (
      sourceId: string
    ) => {
      requestAnimationFrame(
        () => {
          if (
            !mapRef.current ||
            !layerLoadingDimintaRef.current.has(
              sourceId
            )
          ) {
            return;
          }

          if (
            mapRef.current.isSourceLoaded(
              sourceId
            )
          ) {
            selesaiLoadingLayer(
              sourceId
            );
          }
        }
      );
    };

    const handleSourceLoading = (
      e: any
    ) => {
      const sourceId =
        e?.sourceId;

      if (!sourceId) {
        return;
      }

      mulaiLoadingLayer(
        sourceId
      );
    };

    const handleSourceData = (
      e: any
    ) => {
      const sourceId =
        e?.sourceId;

      if (!sourceId) {
        return;
      }

      if (
        e.isSourceLoaded
      ) {
        selesaiLoadingLayer(
          sourceId
        );
      }
    };

    const handleMapError = (
      e: any
    ) => {
      const sourceId =
        e?.error?.sourceId ??
        e?.sourceId;

      if (
        sourceId &&
        sourceLayerIds.has(
          sourceId
        )
      ) {
        selesaiLoadingLayer(
          sourceId
        );
      }
    };

    map.on(
      'sourcedataloading',
      handleSourceLoading
    );

    map.on(
      'sourcedata',
      handleSourceData
    );

    map.on(
      'error',
      handleMapError
    );

    const perbaruiInfoPeta =
      () => {
        const center =
          map.getCenter();

        setInfoPeta({
          lon: center.lng,
          lat: center.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing:
            map.getBearing()
        });
      };

    map.on(
      'move',
      perbaruiInfoPeta
    );

    map.on(
      'zoom',
      perbaruiInfoPeta
    );

    map.on(
      'rotate',
      perbaruiInfoPeta
    );

    map.on(
      'pitch',
      perbaruiInfoPeta
    );

    perbaruiInfoPeta();

    const resizeObserver =
      new ResizeObserver(
        () => {
          map.resize();
        }
      );

    resizeObserver.observe(
      ref.current
    );

map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true
  }),
  'top-right'
);

const scaleControl =
  new AppScaleControl({
    maxWidth: 100,
    unit: 'metric'
  });

map.addControl(
  scaleControl,
  'bottom-right'
);

const scaleElement =
  scaleControl.getElement();

if (
  scaleElement &&
  scaleSlotRef.current
) {
  scaleSlotRef.current.appendChild(
    scaleElement
  );
}

map.addControl(
  new maplibregl.AttributionControl({
    compact: true
  }),
  'bottom-left'
);
    map.on(
      'load',
      () => {

        for (
          const L
          of LAYERS
        ) {
          if (
            L.id === 'bidang'
          ) {
            continue;
          }
map.addSource(
  L.id,
  {
    type: 'geojson',
    data:
      L.id === 'traseg'
        ? TRASEG_URL
        : `/api/layers/${L.sumber}`
  }
);
          const vis =
            layerAktif[L.id]
              ? 'visible'
              : 'none';

          if (
            L.tipe === 'fill'
          ) {

            map.addLayer({
              id: L.id,

              type: 'fill',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {
                'fill-color':
                  L.warna,

                'fill-opacity':
                  L.opasitas ??
                  0.45
              }
            });

            map.addLayer({
              id:
                L.id + '-ln',

              type: 'line',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {
                'line-color':
                  L.warna,

                'line-width': 1.2,

                'line-opacity':
                  0.85
              }
            });

          } else if (
            L.tipe === 'line'
          ) {

            map.addLayer({
              id: L.id,

              type: 'line',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {
                'line-color':
                  L.warna,

                'line-width':
                  L.lebar ?? 2,

                'line-opacity':
                  L.opasitas ?? 1,

                ...(L.dash
                  ? {
                      'line-dasharray':
                        L.dash
                    }
                  : {})
              }
            });

          } else {

            map.addLayer({
              id: L.id,

              type: 'circle',

              source: L.id,

              layout: {
                visibility: vis
              },

              paint: {
                'circle-radius':
                  4,

                'circle-color':
                  L.warna,

                'circle-stroke-width':
                  1.5,

                'circle-stroke-color':
                  '#0E1720'
              }
            });
          }
        }

        if (
          map.getSource(
            'traseg'
          ) &&
          map.getLayer(
            'traseg'
          )
        ) {

          map.addLayer(
            {
              id:
                'traseg_halo',

              type: 'line',

              source:
                'traseg',

              layout: {
                visibility:
                  layerAktif.traseg
                    ? 'visible'
                    : 'none'
              },

              paint: {
                'line-color':
                  '#FFFFFF',

                'line-width': [
                  '+',

                  [
                    'coalesce',

                    [
                      'to-number',

                      LAYERS.find(
                        (l) =>
                          l.id ===
                          'traseg'
                      )?.lebar ??
                        4
                    ],

                    4
                  ],

                  4
                ],

                'line-opacity':
                  0.95
              }
            },

            'traseg'
          );
        }

        map.addSource(
          'bidang',
          {
            type: 'geojson',

            data: '/api/bidang',

            promoteId: 'fid'
          }
        );

        map.addLayer({
          id: 'bidang',

          type: 'fill',

          source: 'bidang',

          paint: {
'fill-color': [
  'case',
  ['boolean', ['feature-state', 'analisis'], false],
  '#00E5FF',
  ['boolean', ['feature-state', 'sel'], false],
  '#FFD600',
  '#8df2ff'
],

            'fill-opacity': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              0.88,

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              0.92,

              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              0.95,
              [
                'boolean',
                [
                  'feature-state',
                  'hov'
                ],
                false
              ],

              0.74,
              0.90
            ]
          }
        });

        posisikanTraseDiBawahLayerData(map);

        map.addLayer({
          id: 'bidang-ln',

          type: 'line',

          source: 'bidang',

          paint: {
            'line-color': [
              'case',
              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              '#00E5FF',

              // Filter
              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              '#FFFFFF',
              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              '#FFFFFF',
              'rgba(14,23,32,.45)'
            ],

            'line-width': [
              'case',
              [
                'boolean',
                [
                  'feature-state',
                  'analisis'
                ],
                false
              ],

              2.5,
              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              2.2,
              [
                'boolean',
                [
                  'feature-state',
                  'sel'
                ],
                false
              ],

              3,
              0.6
            ],

            'line-opacity': [
              'case',

              [
                'boolean',
                [
                  'feature-state',
                  'filter'
                ],
                false
              ],

              1,

              0.65
            ]
          }
        });

        map.addLayer({
          id: 'bidang-lb',

          type: 'symbol',

          source: 'bidang',

          minzoom: 13,

          layout: {
            visibility: 'none',

            'text-field': [
              'to-string',
              [
                'get',
                'nib'
              ]
            ],

            'text-size': 12,

            'text-anchor': 'center',

            'text-allow-overlap': true,

            'text-ignore-placement': true
          },

          paint: {
            'text-color':
              '#1E2733',

            'text-halo-color':
              'rgba(255,255,255,.9)',

            'text-halo-width': 1.1
          }
        });

        map.addLayer({
          id:
            'bidang-filter',

          type: 'fill',

          source: 'bidang',

          filter: [
            '==',
            [
              'get',
              '__filter_never_match__'
            ],
            '__never__'
          ],

          paint: {
            'fill-color':
              '#FF1744',

            'fill-opacity':
              0.30
          }
        });

        map.addLayer({
          id:
            'bidang-filter-ln',

          type: 'line',

          source: 'bidang',

          filter: [
            '==',
            [
              'get',
              '__filter_never_match__'
            ],
            '__never__'
          ],

          paint: {
            'line-color':
              '#FF1744',

            'line-width': 3,

            'line-opacity': 1
          }
        });

        // Bangunan berada di atas bidang tanah.
        // Style layer lain tetap tidak diubah.
        posisikanBangunanDiAtasBidang(map);

        warnaiTema(map);

        pasangInteraksi(map);
      }
    );

    map.on(
      'error',
      (e) => {
        console.warn(
          'MapLibre:',
          e.error?.message ?? e
        );
      }
    );

    return () => {
      resizeObserver.disconnect();

      map.off(
        'sourcedataloading',
        handleSourceLoading
      );

      map.off(
        'sourcedata',
        handleSourceData
      );

      map.off(
        'error',
        handleMapError
      );

      layerLoadingDimintaRef.current.clear();
      setLayerLoading([]);

      popupRef.current?.remove();

      for (
        const id
        of analisisRef.current
      ) {
        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            analisis: false
          }
        );
      }

      analisisRef.current = [];

      map.remove();

      mapRef.current = null;
    };
  }, []);

  function pasangInteraksi(
    map: MLMap
  ) {
    let hov:
      | string
      | number
      | null = null;

    // =====================================================
    // HOVER BIDANG TANAH
    // =====================================================
    map.on(
      'mousemove',
      'bidang',
      (e) => {
        map.getCanvas()
          .style.cursor =
          'pointer';

        const id =
          e.features?.[0]?.id;

        if (
          id === undefined
        ) {
          return;
        }

        if (
          hov !== null
        ) {
          map.setFeatureState(
            {
              source: 'bidang',
              id: hov
            },
            {
              hov: false
            }
          );
        }

        hov = id;

        map.setFeatureState(
          {
            source: 'bidang',
            id
          },
          {
            hov: true
          }
        );
      }
    );

    map.on(
      'mouseleave',
      'bidang',
      () => {
        map.getCanvas()
          .style.cursor = '';

        if (
          hov !== null
        ) {
          map.setFeatureState(
            {
              source: 'bidang',
              id: hov
            },
            {
              hov: false
            }
          );
        }

        hov = null;
      }
    );

    // =====================================================
    // KLIK BIDANG TANAH
    // Style dan perilaku kartu bidang tetap seperti sekarang.
    // =====================================================
    map.on(
      'click',
      'bidang',
      (e) => {
        const f =
          e.features?.[0];

        if (!f) {
          return;
        }

        const p =
          f.properties as any;

        popupRef.current?.remove();

        const el =
          document.createElement(
            'div'
          );

        el.className = 'pop';

el.innerHTML = `
<div class="ph">
  <div class="id">
    ${escapeHtml(
      p.nib ?? 'NIB tidak tersedia'
    )}
  </div>

  <div class="nm">
    ${escapeHtml(
      p.nama_milik ?? 'Nama pemilik tidak tersedia'
    )}
  </div>
</div>

<div class="pb">

  <div>
    <span>
      Luas bidang
    </span>

    <b>
      ${escapeHtml(fmt(p.luas_tnh))} m²
    </b>
  </div>

  <div>
    <span>
      Penggunaan
    </span>

    <b style="font-family:var(--f-body)">
      ${escapeHtml(
        p.penggunaan ?? '—'
      )}
    </b>
  </div>

</div>

<button>
  Buka kartu bidang
</button>
`;

        el
          .querySelector(
            'button'
          )!
          .addEventListener(
            'click',
            () => {
              setBangunanTerpilih(null);

              pilihBidang(
                p.fid
              );

              if (
                f.id !== undefined
              ) {
                sorot(
                  map,
                  f.id
                );
              }

              popupRef.current?.remove();
            }
          );

        const fotoEl =
          el.querySelector(
            'img'
          );

        if (fotoEl) {
          fotoEl.addEventListener(
            'error',
            () => {
              (fotoEl.parentElement as HTMLElement | null)
                ?.style.setProperty(
                  'display',
                  'none'
                );
            }
          );
        }

        popupRef.current =
          new maplibregl.Popup({
            closeButton: true,
            offset: 12,
            maxWidth: 'none'
          })
            .setLngLat(
              e.lngLat
            )
            .setDOMContent(el)
            .addTo(map);
      }
    );

    // =====================================================
    // BANGUNAN
    // Klik bangunan membuka popup khusus bangunan.
    // Bangunan berada di atas bidang sehingga event ini
    // tetap bisa menangkap klik pada footprint bangunan.
    // =====================================================
    map.on(
      'mouseenter',
      'bangunan',
      () => {
        map.getCanvas()
          .style.cursor =
          'pointer';
      }
    );

    map.on(
      'mouseleave',
      'bangunan',
      () => {
        map.getCanvas()
          .style.cursor = '';
      }
    );

    map.on(
      'click',
      'bangunan',
      (e) => {
        const f =
          e.features?.[0];

        if (!f) {
          return;
        }

        const p =
          (f.properties ?? {}) as Record<string, any>;

        popupRef.current?.remove();
        popupRef.current = null;

        // Pastikan kartu bidang yang mungkin sedang terbuka ikut ditutup.
        pilihBidang(null);
        setBangunanTerpilih(p);
      }
    );
  }

  function sorot(
    map: MLMap,
    fid: string | number
  ) {
    if (
      terpilihRef.current !==
      null
    ) {
      map.setFeatureState(
        {
          source: 'bidang',

          id:
            terpilihRef.current
        },
        {
          sel: false
        }
      );
    }

    terpilihRef.current =
      fid;

    map.setFeatureState(
      {
        source: 'bidang',

        id: fid
      },
      {
        sel: true
      }
    );
  }

useEffect(() => {
  const map = mapRef.current;

  if (!map) {
    return;
  }

  const basemapLayers: {
    id: string;
    basemap: Basemap;
  }[] = [
    {
      id: 'bm-esri-streets',
      basemap: 'esri-streets'
    },
    {
      id: 'bm-esri',
      basemap: 'esri'
    },
    {
      id: 'bm-google-hybrid',
      basemap: 'google-hybrid'
    },
    {
      id: 'bm-google-streets',
      basemap: 'google-streets'
    },
    {
      id: 'bm-opentopo',
      basemap: 'opentopo'
    },
    {
      id: 'bm-ortho',
      basemap: 'ortho'
    }
  ];

  const requestId =
    ++orthoRequestRef.current;

  if (orthoLoadingTimerRef.current) {
    clearTimeout(
      orthoLoadingTimerRef.current
    );

    orthoLoadingTimerRef.current = null;
  }

  const requestMasihAktif = () => {
    return (
      requestId ===
        orthoRequestRef.current &&
      mapRef.current === map
    );
  };

  const tutupLoadingOrtho = () => {
    if (!requestMasihAktif()) {
      return;
    }

    if (orthoLoadingTimerRef.current) {
      clearTimeout(
        orthoLoadingTimerRef.current
      );
    }

    /*
     * Delay kecil supaya loading tidak berkedip
     * ketika tile selesai sangat cepat.
     */
    orthoLoadingTimerRef.current =
      setTimeout(() => {
        if (
          requestMasihAktif() &&
          basemap === 'ortho'
        ) {
          setOrthoLoading(false);
        }
      }, 350);
  };

  const cekOrthoSelesai = () => {
    if (!requestMasihAktif()) {
      return;
    }

    if (basemap !== 'ortho') {
      return;
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    /*
     * Source sudah selesai dimuat.
     */
    if (
      map.isSourceLoaded('ortho')
    ) {
      tutupLoadingOrtho();
    }
  };

  const handleOrthoSourceData = (
    e: any
  ) => {
    if (!requestMasihAktif()) {
      return;
    }

    if (
      basemap !== 'ortho'
    ) {
      return;
    }

    if (
      e?.sourceId !== 'ortho'
    ) {
      return;
    }

    /*
     * MapLibre akan mengirim sourcedata
     * beberapa kali. Hanya tutup loading
     * ketika source benar-benar selesai.
     */
    if (
      e?.isSourceLoaded === true ||
      map.isSourceLoaded('ortho')
    ) {
      tutupLoadingOrtho();
    }
  };

  const handleMapIdle = () => {
    cekOrthoSelesai();
  };

  const terapkanBasemap = () => {
    if (!requestMasihAktif()) {
      return;
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    const sedangOrtho =
      basemap === 'ortho';

    /*
     * Aktifkan indikator loading hanya
     * ketika user memilih orthophoto.
     */
    setOrthoLoading(
      sedangOrtho
    );

    for (
      const item of basemapLayers
    ) {
      if (
        !map.getLayer(item.id)
      ) {
        continue;
      }

      let visible =
        item.basemap === basemap;

      /*
       * Saat orthophoto aktif:
       *
       * Esri tetap menjadi basemap
       * di bawah orthophoto.
       */
      if (
        sedangOrtho &&
        item.basemap === 'esri'
      ) {
        visible = true;
      }

      map.setLayoutProperty(
        item.id,
        'visibility',
        visible
          ? 'visible'
          : 'none'
      );
    }

    if (!sedangOrtho) {
      /*
       * Tidak perlu menunggu source ortho.
       */
      map.off(
        'sourcedata',
        handleOrthoSourceData
      );

      map.off(
        'idle',
        handleMapIdle
      );

      return;
    }

    /*
     * Pastikan listener dipasang hanya sekali
     * untuk request basemap saat ini.
     */
    map.off(
      'sourcedata',
      handleOrthoSourceData
    );

    map.off(
      'idle',
      handleMapIdle
    );

    map.on(
      'sourcedata',
      handleOrthoSourceData
    );

    map.on(
      'idle',
      handleMapIdle
    );

    /*
     * Tunggu dua frame agar visibility layer
     * sudah benar-benar diterapkan MapLibre.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!requestMasihAktif()) {
          return;
        }

        cekOrthoSelesai();
      });
    });
  };

  if (
    map.isStyleLoaded()
  ) {
    terapkanBasemap();
  } else {
    map.once(
      'load',
      terapkanBasemap
    );
  }

  return () => {
    map.off(
      'load',
      terapkanBasemap
    );

    map.off(
      'sourcedata',
      handleOrthoSourceData
    );

    map.off(
      'idle',
      handleMapIdle
    );

    if (
      orthoLoadingTimerRef.current
    ) {
      clearTimeout(
        orthoLoadingTimerRef.current
      );

      orthoLoadingTimerRef.current =
        null;
    }
  };
}, [basemap]);
  
  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const terapkanDTM =
      () => {
        if (
          !map.isStyleLoaded()
        ) {
          return;
        }

        if (
          dtm === 'off'
        ) {
          map.setTerrain(
            null
          );


          map.easeTo({
            pitch: 0,
            duration: 850
          });

          return;
        }

const src =
  dtm === 'trace'
    ? 'dtm'
    : 'dtm_aws';

const urlDTM =
  dtm === 'trace'
    ? DTM.trace
    : DTM.aws;

if (!urlDTM) {
  map.setTerrain(null);

  beriPesan(
    `DTM ${
      dtm === 'trace'
        ? 'Rencana Trace'
        : 'AWS'
    } belum tersedia.`
  );

  return;
}

if (!map.getSource(src)) {
  console.warn(
    'Source DTM tidak ditemukan:',
    src
  );

  map.setTerrain(null);

  beriPesan(
    `Source ${
      dtm === 'trace'
        ? 'DTM Rencana Trace'
        : 'DTM AWS'
    } belum tersedia.`
  );

  return;
}

map.setTerrain(null);

map.setTerrain({
  source: src,
  exaggeration: 1
});

        map.easeTo({
          pitch: 52,
          duration: 850
        });
      };

    if (
      map.isStyleLoaded()
    ) {
      terapkanDTM();
    } else {
      map.once(
        'load',
        terapkanDTM
      );
    }

    return () => {
      map.off(
        'load',
        terapkanDTM
      );
    };
  }, [dtm]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const perbaruiLabelNomor = () => {
      if (
        !map.isStyleLoaded() ||
        !map.getLayer('bidang-lb')
      ) {
        return;
      }

      const zoom = map.getZoom();

      map.setLayoutProperty(
        'bidang-lb',
        'visibility',
        zoom >= 15
          ? 'visible'
          : 'none'
      );
    };

    if (map.isStyleLoaded()) {
      perbaruiLabelNomor();
    } else {
      map.once(
        'load',
        perbaruiLabelNomor
      );
    }

    map.on(
      'zoom',
      perbaruiLabelNomor
    );

    return () => {
      map.off(
        'zoom',
        perbaruiLabelNomor
      );
    };
  }, []);

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map?.isStyleLoaded()
    ) {
      return;
    }

    for (
      const L
      of LAYERS
    ) {
      const aktif =
        !!layerAktif[L.id];

      const v =
        aktif
          ? 'visible'
          : 'none';

      if (
        map.getLayer(
          L.id
        )
      ) {
        map.setLayoutProperty(
          L.id,
          'visibility',
          v
        );
      }

      if (
        map.getLayer(
          L.id + '-ln'
        )
      ) {
        map.setLayoutProperty(
          L.id + '-ln',
          'visibility',
          v
        );
      }

if (aktif) {
  layerLoadingDimintaRef.current.add(
    L.id
  );

  if (
    map.isSourceLoaded(
      L.id
    )
  ) {
    selesaiLoadingLayer(
      L.id
    );
  } else {
    cekSumberSelesai(
      L.id
    );
  }
} else {
        layerLoadingDimintaRef.current.delete(
          L.id
        );

        setLayerLoading(
          (prev) =>
            prev.filter(
              (id) =>
                id !== L.id
            )
        );
      }
    }

    if (
      map.getLayer(
        'traseg'
      )
    ) {
      map.setLayoutProperty(
        'traseg',
        'visibility',

        layerAktif.traseg
          ? 'visible'
          : 'none'
      );
    }

    if (
      map.getLayer(
        'traseg_halo'
      )
    ) {
      map.setLayoutProperty(
        'traseg_halo',
        'visibility',

        layerAktif.traseg
          ? 'visible'
          : 'none'
      );
    }

    posisikanTraseDiBawahLayerData(map);
    posisikanBangunanDiAtasBidang(map);
  }, [
    layerAktif
  ]);

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const terapkanFilter =
      () => {
        if (
          !map.getLayer(
            'bidang-filter'
          ) ||
          !map.getLayer(
            'bidang-filter-ln'
          )
        ) {
          return;
        }

        const expression =
          ekspresiFilterBidang(
            filterBidang
          );

        map.setFilter(
          'bidang-filter',
          expression
        );

        map.setFilter(
          'bidang-filter-ln',
          expression
        );
      };

    if (
      map.isStyleLoaded()
    ) {
      terapkanFilter();
    } else {
      map.once(
        'load',
        terapkanFilter
      );
    }

    return () => {
      map.off(
        'load',
        terapkanFilter
      );
    };
  }, [
    filterBidang
  ]);


  useEffect(() => {
    const map =
      mapRef.current;

    if (
      map?.isStyleLoaded()
    ) {
      warnaiTema(map);
    }
  }, [
    tema
  ]);

return (
  <div
    ref={ref}
    className="canvas"
  >
{orthoLoading && (
  <div className="layer-loading ortho-loading">
    <div className="ortho-spinner" />

    <strong className="layer-loading-title">
      MEMUAT ORTHOPHOTO
    </strong>

    <div className="layer-loading-text">
      Menyiapkan citra orthophoto...
    </div>
  </div>
)}
    {layerLoading.length > 0 && (
      <div className="layer-loading">
        <strong className="layer-loading-title">
          MEMUAT LAYER
        </strong>

        <div className="layer-loading-text">
          {(() => {
            const namaLayer =
              layerLoading
                .map(
                  (id) =>
                    LAYERS.find(
                      (layer) =>
                        layer.id === id
                    )?.nama
                )
                .filter(Boolean) as string[];

            if (
              namaLayer.length === 0
            ) {
              return 'Layer sedang dimuat...';
            }

            let daftarLayer = '';

            if (
              namaLayer.length === 1
            ) {
              daftarLayer =
                namaLayer[0];
            } else if (
              namaLayer.length === 2
            ) {
              daftarLayer =
                `${namaLayer[0]} dan ${namaLayer[1]}`;
            } else {
              daftarLayer =
                namaLayer
                  .slice(0, -1)
                  .join(', ') +
                ', dan ' +
                namaLayer[
                  namaLayer.length - 1
                ];
            }

            return `${daftarLayer} sedang dimuat...`;
          })()}
        </div>
      </div>
    )}

    {bangunanTerpilih && (
      <aside
        className="kartu open kb-modern kb-bangunan-modern"
        aria-label="Kartu bangunan"
        style={{
          position: 'fixed',
          top: 120,
          right: 24,
          left: 'auto',
          bottom: 24,
          width: 'min(430px, calc(100vw - 48px))',
          maxWidth: '430px',
          height: 'auto',
          maxHeight: 'calc(100vh - 144px)',
          zIndex: 9999,
          transform: 'none',
          margin: 0,
        }}
      >
        <header className="kb-header">
          <div className="kb-header-top">
            <button
              className="kb-close"
              type="button"
              onClick={() => setBangunanTerpilih(null)}
              aria-label="Tutup kartu bangunan"
            >
              ×
            </button>

            <div className="kb-title">
              <span className="kb-eyebrow">
                Informasi bangunan
              </span>
            </div>

            <span className="kb-status status-draft">
              Bangunan
            </span>
          </div>
        </header>

        <div
          className="kb-scroll kb-bangunan-scroll"
          style={{ fontSize: 14 }}
        >
          {(() => {
            const foto = safeImageUrl(
              bangunanTerpilih.foto_bgn
            );

            return (
              <>
                {foto && (
                  <div
                    style={{
                      marginBottom: 10,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid var(--kb-line)',
                      background: 'var(--kb-bg)',
                    }}
                  >
                    <img
                      src={foto}
                      alt="Foto bangunan"
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: 220,
                        objectFit: 'cover',
                      }}
                      onError={(event) => {
                        event.currentTarget.parentElement?.remove();
                      }}
                    />
                  </div>
                )}

                <section className="kb-section">
                  <div className="kb-section-head">
                    <h3 style={{ fontSize: 17 }}>Informasi bangunan</h3>
                    <p>
                      Identitas dan data bangunan hasil inventarisasi
                    </p>
                  </div>

                  <div className="kb-grid two">
                    <div className="kb-field">
                      <label>FID</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {bangunanTerpilih.fid ?? '—'}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>ID</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {bangunanTerpilih.id ?? '—'}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Jenis bangunan</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {bangunanTerpilih.jenis_bgn ?? '—'}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Fungsi bangunan</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {bangunanTerpilih.fungsi_bgn ?? '—'}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Jumlah bangunan</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {fmt(bangunanTerpilih.jml_bgn)}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Jumlah lantai</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {fmt(bangunanTerpilih.jml_lnt)}
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Luas bangunan</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {fmt(bangunanTerpilih.luas_bgn)} m²
                      </div>
                    </div>

                    <div className="kb-field">
                      <label>Tanggal update</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {formatTanggal(bangunanTerpilih.date_updt)}
                      </div>
                    </div>
                  </div>

                  <div
                    className="kb-field"
                    style={{ marginTop: 10 }}
                  >
                    <label>Alamat bangunan</label>
                    <div className="kb-value">
                      {bangunanTerpilih.alamat_bgn ?? '—'}
                    </div>
                  </div>

                  <div
                    className="kb-field"
                    style={{ marginTop: 10 }}
                  >
                    <label>Update</label>
                    <div className="kb-value">
                      {bangunanTerpilih.update ?? '—'}
                    </div>
                  </div>

                  {!foto && bangunanTerpilih.foto_bgn && (
                    <div
                      className="kb-field"
                      style={{ marginTop: 10 }}
                    >
                      <label>Foto bangunan</label>
                      <div
                        className="kb-value"
                        style={{ fontSize: 14 }}
                      >
                        {bangunanTerpilih.foto_bgn}
                      </div>
                    </div>
                  )}
                </section>
              </>
            );
          })()}
        </div>
      </aside>
    )}

    <div className="map-bottom-right">

      <div
        ref={scaleSlotRef}
        className="map-scale-slot"
      />

      <div className="map-info">
        <span>
          Lon{' '}
          {infoPeta.lon.toFixed(5)}
        </span>

        <span>
          Lat{' '}
          {infoPeta.lat.toFixed(5)}
        </span>

        <span>
          Zoom{' '}
          {infoPeta.zoom.toFixed(1)}
        </span>

        <span>
          Kemiringan{' '}
          {infoPeta.pitch.toFixed(0)}
          °
        </span>

        <span>
          Arah{' '}
          {infoPeta.bearing.toFixed(0)}
          °
        </span>
      </div>

    </div>
  </div>
);
}

const ekspresiFilterBidang = (
  filter: {
    status: string[];
    kecamatan: string[];
    kelurahan: string[];
    tipehak: string[];
    penggunaan: string[];
  }
): any => {
  const kondisi: any[] =
    ['all'];

  const tambahFilter = (
    property: string,
    values: string[]
  ) => {
    if (
      !values.length
    ) {
      return;
    }

    kondisi.push([
      'match',
      ['get', property],
      ...values.flatMap(
        (value) => [
          value,
          true
        ]
      ),
      false
    ]);
  };

  tambahFilter(
    'status',
    filter.status
  );

  tambahFilter(
    'kecamatan',
    filter.kecamatan
  );

  tambahFilter(
    'kelurahan',
    filter.kelurahan
  );

  tambahFilter(
    'tipehak',
    filter.tipehak
  );

  tambahFilter(
    'penggunaan',
    filter.penggunaan
  );

  if (
    kondisi.length === 1
  ) {
    return [
      '==',
      [
        'get',
        '__filter_never_match__'
      ],
      '__never__'
    ];
  }

  return kondisi;
};

function escapeHtml(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTanggal(
  value: unknown
) {
  if (!value) {
    return '—';
  }

  const text = String(value);
  const date = new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}

const fmt = (
  n: number | null
) =>
  (n ?? 0).toLocaleString(
    'id-ID'
  );

function posisikanBangunanDiAtasBidang(
  map: MLMap
) {
  if (
    !map.getLayer('bangunan') ||
    !map.getLayer('bangunan-ln') ||
    !map.getLayer('bidang')
  ) {
    return;
  }

  // Bangunan berada di atas seluruh layer bidang tanah.
  // Tidak mengubah warna, opacity, atau style layer lain.
  const target =
    map.getLayer('bidang-filter-ln')
      ? 'bidang-filter-ln'
      : map.getLayer('bidang-filter')
        ? 'bidang-filter'
        : map.getLayer('bidang-lb')
          ? 'bidang-lb'
          : map.getLayer('bidang-ln')
            ? 'bidang-ln'
            : 'bidang';

  map.moveLayer(
    'bangunan',
    target
  );

  map.moveLayer(
    'bangunan-ln',
    target
  );
}

function posisikanTraseDiBawahLayerData(
  map: MLMap
) {
  if (
    !map.getLayer('traseg_halo') ||
    !map.getLayer('traseg')
  ) {
    return;
  }

  // Trase berada di atas basemap, tetapi di bawah seluruh layer data.
  const layerPertama = LAYERS.find(
    (L) =>
      L.id !== 'traseg' &&
      map.getLayer(L.id)
  )?.id;

  const target =
    layerPertama ??
    (map.getLayer('bidang')
      ? 'bidang'
      : undefined);

  if (!target) {
    return;
  }

  map.moveLayer(
    'traseg_halo',
    target
  );

  map.moveLayer(
    'traseg',
    target
  );
}

function warnaiTema(
  map: MLMap
) {
  const gelap =
    document.documentElement
      .dataset.theme ===
    'dark';

  map.setPaintProperty(
    'bg',
    'background-color',
    gelap
      ? '#0E1720'
      : '#E7EBF3'
  );

  map.setPaintProperty(
    'bm-esri-streets',
    'raster-brightness-max',
    gelap
      ? 0.84
      : 1
  );

  if (
    map.getLayer(
      'bidang-ln'
    )
  ) {
    map.setPaintProperty(
      'bidang-ln',
      'line-color',
      [
        'case',

        [
          'boolean',
          [
            'feature-state',
            'analisis'
          ],
          false
        ],

        '#00E5FF',

        [
          'boolean',
          [
            'feature-state',
            'sel'
          ],
          false
        ],

        '#A51F35',

        gelap
          ? 'rgba(14,23,32,.85)'
          : 'rgba(30,39,51,.5)'
      ]
    );
  }

  if (
    map.getLayer(
      'bidang-lb'
    )
  ) {
    map.setPaintProperty(
      'bidang-lb',
      'text-color',

      gelap
        ? '#0E1720'
        : '#1E2733'
    );

    map.setPaintProperty(
      'bidang-lb',
      'text-halo-color',
      'rgba(255,255,255,.9)'
    );
  }
}
