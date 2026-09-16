import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle } from '../mapStyle'
import {
  ArrowLeft, Calendar, Anchor, MapPin, Fish, MessageSquare,
  Camera, Plus, X, Weight
} from 'lucide-react'

const FISH_LIST = [
  'Щука', 'Окунь', 'Судак', 'Сом', 'Карп', 'Карась', 'Лещ', 'Плотва',
  'Линь', 'Жерех', 'Голавль', 'Язь', 'Налим', 'Краснопёрка', 'Другой вид'
]

type CatchRow = { fish_name: string; custom_name: string; quantity: string; biggest_weight: string }

export default function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState('')
  const [lat, setLat] = useState<number>(0)
  const [lng, setLng] = useState<number>(0)
  const [waterBody, setWaterBody] = useState('')
  const [placeDesc, setPlaceDesc] = useState('')
  const [catches, setCatchRows] = useState<CatchRow[]>([])
  const [totalWeight, setTotalWeight] = useState('')
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<any[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [showMap, setShowMap] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    api.getRecord(Number(id)).then(r => {
      setDate(r.date)
      setLat(r.latitude)
      setLng(r.longitude)
      setWaterBody(r.water_body_name)
      setPlaceDesc(r.place_description || '')
      setTotalWeight(r.total_weight?.toString() || '')
      setComment(r.comment || '')
      setPhotos(r.photos || [])
      setCatchRows(
        (r.catch_items || []).map((c: any) => ({
          fish_name: FISH_LIST.includes(c.fish_name) ? c.fish_name : 'Другой вид',
          custom_name: FISH_LIST.includes(c.fish_name) ? '' : c.fish_name,
          quantity: c.quantity.toString(),
          biggest_weight: c.biggest_weight?.toString() || '',
        }))
      )
    }).catch(() => navigate('/history')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstanceRef.current) return
    import('maplibre-gl').then(mod => {
      const maplibregl = mod
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: mapStyle,
        center: [lng, lat],
        zoom: 10,
      })
      markerRef.current = new maplibregl.Marker({ color: '#20D879' }).setLngLat([lng, lat]).addTo(map)
      map.on('click', (e: any) => {
        setLat(e.lngLat.lat)
        setLng(e.lngLat.lng)
        markerRef.current.setLngLat([e.lngLat.lng, e.lngLat.lat])
      })
      mapInstanceRef.current = map
    })
  }, [showMap])

  const addCatch = () => setCatchRows([...catches, { fish_name: '', custom_name: '', quantity: '', biggest_weight: '' }])
  const removeCatch = (i: number) => setCatchRows(catches.filter((_, idx) => idx !== i))
  const updateCatch = (i: number, field: keyof CatchRow, val: string) => {
    const updated = [...catches]
    updated[i] = { ...updated[i], [field]: val }
    setCatchRows(updated)
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 10 - photos.length - newPhotos.length
    const toAdd = files.slice(0, remaining)
    setNewPhotos([...newPhotos, ...toAdd])
    toAdd.forEach(f => {
      const reader = new FileReader()
      reader.onload = () => setNewPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removeExistingPhoto = async (photoId: number) => {
    try {
      await api.deletePhoto(Number(id), photoId)
      setPhotos(photos.filter(p => p.id !== photoId))
    } catch {}
  }

  const removeNewPhoto = (i: number) => {
    setNewPhotos(newPhotos.filter((_, idx) => idx !== i))
    setNewPhotoPreviews(newPhotoPreviews.filter((_, idx) => idx !== i))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const catchItems = catches
        .filter(c => c.fish_name && c.quantity)
        .map(c => ({
          fish_name: c.fish_name === 'Другой вид' ? c.custom_name : c.fish_name,
          quantity: parseInt(c.quantity) || 0,
          biggest_weight: c.biggest_weight ? parseFloat(c.biggest_weight) : null,
        }))

      await api.updateRecord(Number(id), {
        date,
        water_body_name: waterBody,
        latitude: lat,
        longitude: lng,
        place_description: placeDesc || null,
        total_weight: totalWeight ? parseFloat(totalWeight) : null,
        comment: comment || null,
        catch_items: catchItems,
      })

      for (const photo of newPhotos) {
        try { await api.uploadPhoto(Number(id), photo) } catch {}
      }

      navigate(`/record/${id}`)
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 300 }} /></div>

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="back-header-title">Редактировать</h1>
      </div>

      <div className="input-group">
        <label className="input-label">
          <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Дата
        </label>
        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">
          <Anchor size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Водоём
        </label>
        <input className="input" value={waterBody} onChange={e => setWaterBody(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">
          <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Описание места
        </label>
        <textarea className="input" value={placeDesc} onChange={e => setPlaceDesc(e.target.value)} />
      </div>

      <button className="btn btn-outline" style={{ marginBottom: 12 }} onClick={() => setShowMap(!showMap)}>
        <MapPin size={16} /> {showMap ? 'Скрыть карту' : 'Изменить место на карте'}
      </button>

      {showMap && (
        <>
          <div ref={mapRef} className="map-container" style={{ height: 250 }} />
          <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </>
      )}

      <div className="section-title" style={{ marginTop: 20 }}>
        <Fish size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Улов
      </div>
      {catches.map((c, i) => (
        <div key={i} className="catch-row">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Рыба</label>
            <select className="input" value={c.fish_name} onChange={e => updateCatch(i, 'fish_name', e.target.value)}>
              <option value="">Выбрать</option>
              {FISH_LIST.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Кол-во</label>
            <input className="input" type="number" min="1" value={c.quantity} onChange={e => updateCatch(i, 'quantity', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Вес (кг)</label>
            <input className="input" type="number" step="0.1" min="0" value={c.biggest_weight} onChange={e => updateCatch(i, 'biggest_weight', e.target.value)} />
          </div>
          <button className="btn-icon" style={{ marginBottom: 0 }} onClick={() => removeCatch(i)}>
            <X size={16} />
          </button>
        </div>
      ))}
      {catches.some(c => c.fish_name === 'Другой вид') && (
        <div className="input-group">
          <label className="input-label">Название вида</label>
          <input className="input" value={catches.find(c => c.fish_name === 'Другой вид')?.custom_name || ''} onChange={e => {
            const idx = catches.findIndex(c => c.fish_name === 'Другой вид')
            if (idx >= 0) updateCatch(idx, 'custom_name', e.target.value)
          }} />
        </div>
      )}
      <button className="btn btn-ghost" onClick={addCatch} style={{ marginBottom: 16, width: 'auto' }}>
        <Plus size={16} /> Добавить рыбу
      </button>

      <div className="input-group">
        <label className="input-label">
          <Weight size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Общий вес (кг)
        </label>
        <input className="input" type="number" step="0.1" min="0" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">
          <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Комментарий
        </label>
        <textarea className="input" value={comment} onChange={e => setComment(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">
          <Camera size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Фотографии
        </label>
        <div className="photo-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-item">
              <img src={p.photo_url} alt="" />
              <button className="photo-delete" onClick={() => removeExistingPhoto(p.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
          {newPhotoPreviews.map((p, i) => (
            <div key={`new-${i}`} className="photo-item">
              <img src={p} alt="" />
              <button className="photo-delete" onClick={() => removeNewPhoto(i)}>
                <X size={12} />
              </button>
            </div>
          ))}
          {(photos.length + newPhotos.length) < 10 && (
            <div className="photo-add" onClick={() => fileRef.current?.click()}>
              <Camera size={24} />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

      <div className="btn-group">
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ fontSize: 16, padding: '16px 20px' }}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  )
}