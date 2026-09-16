export const mapStyle: any = {
  version: 8,
  name: 'Fish Map Dark',
  sources: {
    'dark': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'dark',
      type: 'raster',
      source: 'dark',
      paint: {
        'raster-saturation': -0.1,
        'raster-brightness-min': 0.5,
        'raster-brightness-max': 0.85
      }
    }
  ]
}

export const BARANOVICHI: [number, number] = [26.01, 53.13]