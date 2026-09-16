export const mapStyle: any = {
  version: 8,
  name: 'Fish Map Dark',
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -0.3,
        'raster-brightness-min': 0.55,
        'raster-brightness-max': 0.85,
        'raster-contrast': 0.1
      }
    }
  ]
}

export const BARANOVICHI: [number, number] = [26.01, 53.13]