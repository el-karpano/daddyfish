export const mapStyle: any = {
  version: 8,
  name: 'Fish Map',
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.2,
        'raster-brightness-min': 0.6,
        'raster-brightness-max': 0.9
      }
    }
  ]
}

export const BARANOVICHI: [number, number] = [26.01, 53.13]
