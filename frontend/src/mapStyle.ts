export const mapStyle: any = {
  version: 8,
  name: 'Dark Fish',
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
        'raster-saturation': -0.8,
        'raster-brightness-min': 0.15,
        'raster-brightness-max': 0.4,
        'raster-contrast': 0.3,
        'raster-hue-rotate': 160
      }
    }
  ]
}
