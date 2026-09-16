import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle, BARANOVICHI } from '../mapStyle'
import {
  ArrowLeft, MapPin, Calendar, Anchor, MessageSquare,
  Camera, Plus, X, Check, Weight
} from 'lucide-react'

const FISH_LIST = [
  'Щука', 'Окунь', 'Судак', 'Сом', 'Карп', 'Карась', 'Лещ', 'Плотва',
  'Линь', 'Жерех', 'Голавль', 'Язь', 'Налим', 'Краснопёрка', 'Другой вид'
]

type CatchRow = { fish_name: string; custom_name: string; quantity: string; biggest_weight: string }

export default function AddFishingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [waterBody, setWaterBody] = useState('')
  const [placeDesc, setPlaceDesc] = useState('')

  const [catches, setCatchRows] = useState<CatchRow[]>([
    { fish_name: '', custom_name: '', quantity: '', biggest_weight: '' }
  ])
  const [totalWeight, setTotalWeight] = useState('')

  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== 1 || !mapRef.current || mapInstanceRef.current) return
    initMap()
  }, [step])

  const initMap = async () => {
    const maplibregl = await import('maplibre-gl')

    const createMap = (center: [number, number], zoom: number) => {
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: mapStyle,
        center,
        zoom,
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('click', (e: any) => {
        const { lat: la, lng: lo } = e.lngLat
        setLat(la)
        setLng(lo)
        if (markerRef.current) {
          markerRef.current.setLngLat([lo, la])
        } else {
          markerRef.current = new maplibregl.Marker({ color: '#20D879' })
            .setLngLat([lo, la])
            .addTo(map)
        }
      })
      mapInstanceRef.current = map
    }

    // Try to center on user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userCenter: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          createMap(userCenter, 12)
          // Auto-place marker at user's position
          setTimeout(() => {
            if (mapInstanceRef.current) {
              markerRef.current = new maplibregl.Marker({ color: '#20D879' })
                .setLngLat(userCenter)
                .addTo(mapInstanceRef.current)
            }
          }, 300)
        },
        () => {
          createMap([lng || BARANOVICHI[0], lat || BARANOVICHI[1]], 6)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      createMap([lng || BARANOVICHI[0], lat || BARANOVICHI[1]], 6)
    }
  }

  const addCatch = () => {
    setCatchRows([...catches, { fish_name: '', custom_name: '', quantity: '', biggest_weight: '' }])
  }

  const removeCatch = (i: number) => {
    setCatchRows(catches.filter((_, idx) => idx !== i))
  }

  const updateCatch = (i: number, field: keyof CatchRow, val: string) => {
    const updated = [...catches]
    updated[i] = { ...updated[i], [field]: val }
    setCatchRows(updated)
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 10 - photos.length
    const toAdd = files.slice(0, remaining)
    setPhotos([...photos, ...toAdd])
    toAdd.forEach(f => {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(f)
    })
  }

  const removePhoto = (i: number) => {
    setPhotos(photos.filter((_, idx) => idx !== i))
    setPhotoPreviews(photoPreviews.filter((_, idx) => idx !== i))
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

      const record = await api.createRecord({
        date,
        water_body_name: waterBody,
        latitude: lat,
        longitude: lng,
        place_description: placeDesc || null,
        total_weight: totalWeight ? parseFloat(totalWeight) : null,
        comment: comment || null,
        catch_items: catchItems,
      })

      for (const photo of photos) {
        try { await api.uploadPhoto(record.id, photo) } catch {}
      }

      navigate(`/record/${record.id}`)
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const canNext = () => {
    if (step === 0) return !!date
    if (step === 1) return lat !== null && lng !== null
    if (step === 2) return !!waterBody.trim()
    if (step === 3) return true
    return true
  }

  const stepTitles = [
    'Где рыбачили?',
    'Выберите место',
    'Расскажите о рыбалке',
    'Что поймали?',
    'Сохраните момент',
  ]

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="back-header-title">{stepTitles[step] || 'Новая рыбалка'}</h1>
      </div>

      <div className="step-indicator">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>

      {/* STEP 0 — Date */}
      {step === 0 && (
        <div>
          <div className="input-group">
            <label className="input-label">
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Дата рыбалки
            </label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(1)}>
              Далее <span style={{ marginLeft: 4 }}>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — Map */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Нажмите на карту, чтобы отметить место рыбалки
          </p>
          <div ref={mapRef} className="map-container" style={{ height: 350 }} />
          {lat !== null && lng !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--accent)' }}>
              <MapPin size={14} /> {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          )}
          <div className="btn-group">
            <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(2)}>
              <Check size={18} /> Выбрать это место
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Info */}
      {step === 2 && (
        <div>
          <div className="input-group">
            <label className="input-label">
              <Anchor size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Название водоёма
            </label>
            <input className="input" placeholder="Например: Селецкое озеро" value={waterBody} onChange={e => setWaterBody(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">
              <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Описание места
            </label>
            <textarea className="input" placeholder="Например: стоял возле камыша, глубина около 3 метров" value={placeDesc} onChange={e => setPlaceDesc(e.target.value)} />
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(3)}>
              Далее <span style={{ marginLeft: 4 }}>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Catch */}
      {step === 3 && (
        <div>
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
                <input className="input" type="number" min="1" placeholder="0" value={c.quantity} onChange={e => updateCatch(i, 'quantity', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Макс. вес (кг)</label>
                <input className="input" type="number" step="0.1" min="0" placeholder="Самая крупная" value={c.biggest_weight} onChange={e => updateCatch(i, 'biggest_weight', e.target.value)} />
              </div>
              <button className="btn-icon" style={{ marginBottom: 0 }} onClick={() => removeCatch(i)}>
                <X size={16} />
              </button>
            </div>
          ))}

          {catches.some(c => c.fish_name === 'Другой вид') && (
            <div className="input-group">
              <label className="input-label">Название вида</label>
              <input className="input" placeholder="Введите название" value={catches.find(c => c.fish_name === 'Другой вид')?.custom_name || ''} onChange={e => {
                const idx = catches.findIndex(c => c.fish_name === 'Другой вид')
                if (idx >= 0) updateCatch(idx, 'custom_name', e.target.value)
              }} />
            </div>
          )}

          <button className="btn btn-ghost" onClick={addCatch} style={{ marginBottom: 16, width: 'auto', alignSelf: 'flex-start' }}>
            <Plus size={16} /> Добавить рыбу
          </button>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              Далее <span style={{ marginLeft: 4 }}>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Comment + Photos */}
      {step === 4 && (
        <div>
          <div className="input-group">
            <label className="input-label">
              <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Комментарий
            </label>
            <textarea className="input" placeholder="Приехал в 6 утра. Клевало хорошо..." value={comment} onChange={e => setComment(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Camera size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Фотографии (до 10)
            </label>
            <div className="photo-grid">
              {photoPreviews.map((p, i) => (
                <div key={i} className="photo-item">
                  <img src={p} alt="" />
                  <button className="photo-delete" onClick={() => removePhoto(i)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <div className="photo-add" onClick={() => fileRef.current?.click()}>
                  <Camera size={24} />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Weight size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Общий вес улова (кг)
            </label>
            <input className="input" type="number" step="0.1" min="0" placeholder="Например: 6.4" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <div className="btn-group">
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ fontSize: 16, padding: '16px 20px' }}>
              {saving ? 'Сохранение...' : 'Сохранить рыбалку'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}