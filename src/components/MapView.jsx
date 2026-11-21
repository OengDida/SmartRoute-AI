import { useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { googleMapsKey, loadGoogleMaps } from '../googleMaps'

export default function MapView({ origin, destination, route, stations = [], filter, onMapClick, rangePoint, initialLocation }) {
  const host = useRef(null)
  const map = useRef(null)
  const clickRef = useRef(onMapClick)
  const recenterRef = useRef(null)
  const [status, setStatus] = useState(googleMapsKey ? 'loading' : 'missing-key')
  const [loadError, setLoadError] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  useEffect(() => { clickRef.current = onMapClick }, [onMapClick])

  useEffect(() => {
    if (!googleMapsKey || !host.current) return
    let alive = true
    let instance
    const authFailure = () => {
      if (alive) {
        setLoadError('Google rejected the API key. Check that it is valid, billing is enabled, and Maps JavaScript API is allowed for this key and localhost referrer.')
        setStatus('error')
      }
    }
    window.gm_authFailure = authFailure
    loadGoogleMaps().then(async maps => {
      if (!alive) return
      const { Map } = await maps.importLibrary('maps')
      if (!alive) return
      instance = new Map(host.current, {
        center: { lat: 12.15, lng: 104.90 }, zoom: 7,
        mapTypeControl: true, streetViewControl: false, fullscreenControl: true,
        clickableIcons: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit.station.bus', stylers: [{ visibility: 'off' }] },
        ],
      })
      instance.addListener('click', event => {
        if (event.latLng) clickRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() })
      })
      map.current = instance
      setStatus('ready')
    }).catch(error => {
      if (alive) {
        setLoadError(error?.message || 'Google Maps JavaScript API could not be loaded. Check the browser console for Google Maps authorization errors.')
        setStatus('error')
      }
    })
    return () => { alive = false; map.current = null; if (window.gm_authFailure === authFailure) delete window.gm_authFailure }
  }, [])

  useEffect(() => {
    const instance = map.current
    const maps = window.google?.maps
    if (status !== 'ready' || !instance || !maps) return
    const markers = []
    let line
    const addPin = (point, title, color, label, icon) => {
      if (!point) return
      markers.push(new maps.Marker({
        map: instance, position: { lat: point.lat, lng: point.lng }, title,
        ...(label?{label: { text: label, color: '#071411', fontWeight: '700', fontSize: '11px' }}:{}),
        icon: icon || { path: maps.SymbolPath.CIRCLE, scale: 10, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      }))
    }
    if (!origin?.isCurrentLocation) addPin(origin, `Origin: ${origin?.name || ''}`, '#1B4332', 'A')
    addPin(destination, `Destination: ${destination?.name || ''}`, '#e53935', '', {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new maps.Size(32, 32),
      anchor: new maps.Point(16, 32),
    })
    const visibleStations = stations.filter(station => filter === 'all' || (filter === 'ev' && station.type !== 'gas_only') || (filter === 'gas' && station.type !== 'ev_only') || (filter === 'hybrid' && station.type === 'hybrid_hub'))
    visibleStations.forEach(station => addPin(
      station,
      `${station.name} · ${station.detail || 'Google Maps place'}`,
      station.type === 'ev_only' ? '#1B4332' : station.type === 'gas_only' ? '#A66A16' : '#2D6A4F',
      station.type === 'ev_only' ? '⚡' : station.type === 'gas_only' ? '⛽' : '•',
    ))
    addPin(rangePoint, 'Estimated range limit', '#ff647c', '!')
    if (route?.length > 1) line = new maps.Polyline({
      map: instance,
      path: route.map(([lng, lat]) => ({ lat, lng })),
      // `route` is the road-following path returned by Google Routes.
      // Keep segments on Google's projected road geometry (not great-circle
      // shortcuts) and use the familiar Google route blue.
      geodesic: false,
      strokeColor: '#4285F4', strokeOpacity: 0.96, strokeWeight: 6,
    })
    const points = [origin, destination].filter(Boolean)
    if (points.length === 2) {
      const bounds = new maps.LatLngBounds()
      points.forEach(point => bounds.extend({ lat: point.lat, lng: point.lng }))
      instance.fitBounds(bounds, { left: 430, right: 320, top: 90, bottom: 80 })
    } else if (points.length === 1) instance.panTo({ lat: points[0].lat, lng: points[0].lng })
    return () => { markers.forEach(marker => marker.setMap(null)); line?.setMap(null) }
  }, [origin, destination, route, stations, filter, rangePoint, status])

  useEffect(() => {
    const instance = map.current
    const maps = window.google?.maps
    if (status !== 'ready' || !instance || !maps) return

    let alive = true
    let watchId = null
    let animationFrame = null
    let displayPoint = null
    let latestPoint = null
    let displayAccuracy = 0
    let marker = null
    let accuracyCircle = null
    let hasAutoCentered = false
    let userInteracted = false

    const markUserInteraction = () => { userInteracted = true }
    const interactionEvents = ['pointerdown', 'touchstart', 'wheel', 'keydown']
    interactionEvents.forEach(type => host.current?.addEventListener(type, markUserInteraction, { passive: true }))

    const centerOn = point => {
      if (!alive) return
      instance.panTo({ lat: point.lat, lng: point.lng })
      instance.setZoom(16)
    }

    const describeError = error => {
      if (error?.code === 1) return 'Location access was denied. Allow it in browser settings to recenter.'
      if (error?.code === 2) return 'Your location is unavailable right now. Try again or choose an origin.'
      if (error?.code === 3) return 'Location timed out. Tap to try again.'
      return 'Could not get your location. Tap to try again.'
    }

    const updateLocation = (position, shouldRecenter = false) => {
      if (!alive) return
      const { latitude, longitude, accuracy } = position.coords
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return

      const target = { lat: latitude, lng: longitude }
      const targetAccuracy = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0
      latestPoint = target
      setLocationMessage('')
      setLocating(false)

      if (!marker) {
        accuracyCircle = new maps.Circle({
          map: instance,
          center: target,
          radius: targetAccuracy,
          strokeColor: '#4285F4',
          strokeOpacity: 0.24,
          strokeWeight: 1,
          fillColor: '#4285F4',
          fillOpacity: 0.16,
          clickable: false,
          zIndex: 1,
        })
        marker = new maps.Marker({
          map: instance,
          position: target,
          clickable: false,
          title: 'Your location',
          zIndex: 1000,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
        })
        displayPoint = target
        displayAccuracy = targetAccuracy
      } else {
        if (animationFrame !== null) cancelAnimationFrame(animationFrame)
        const start = displayPoint || target
        const startAccuracy = displayAccuracy
        const startedAt = performance.now()
        const duration = 420
        const animate = now => {
          if (!alive) return
          const progress = Math.min(1, (now - startedAt) / duration)
          const eased = 1 - (1 - progress) ** 3
          const point = {
            lat: start.lat + (target.lat - start.lat) * eased,
            lng: start.lng + (target.lng - start.lng) * eased,
          }
          const radius = startAccuracy + (targetAccuracy - startAccuracy) * eased
          marker.setPosition(point)
          accuracyCircle.setCenter(point)
          accuracyCircle.setRadius(radius)
          displayPoint = point
          displayAccuracy = radius
          if (progress < 1) animationFrame = requestAnimationFrame(animate)
          else animationFrame = null
        }
        animationFrame = requestAnimationFrame(animate)
      }

      if (shouldRecenter) {
        hasAutoCentered = true
        centerOn(target)
      } else if (!hasAutoCentered) {
        // Never let a late first fix override map navigation the user has started.
        hasAutoCentered = true
        if (!userInteracted) centerOn(target)
      }
    }

    const onLocationError = error => {
      if (!alive) return
      setLocating(false)
      setLocationMessage(describeError(error))
    }

    const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    const geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : null
    if (initialLocation) updateLocation({
      coords: {
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        accuracy: initialLocation.accuracy,
      },
    }, true)
    if (!geolocation) {
      if (!initialLocation) setLocationMessage('Location is not supported by this browser.')
    } else {
      if (!initialLocation) {
        setLocating(true)
        try {
          geolocation.getCurrentPosition(position => updateLocation(position), onLocationError, options)
        } catch {
          onLocationError(null)
        }
      }
      try {
        watchId = geolocation.watchPosition(position => updateLocation(position), onLocationError, options)
      } catch {
        if (!initialLocation) onLocationError(null)
      }
    }

    recenterRef.current = () => {
      if (!geolocation) {
        setLocationMessage('Location is not supported by this browser.')
        return
      }
      if (latestPoint) {
        setLocationMessage('')
        centerOn(latestPoint)
        return
      }
      setLocating(true)
      setLocationMessage('')
      try {
        geolocation.getCurrentPosition(
          position => updateLocation(position, true),
          onLocationError,
          { ...options, timeout: 15000, maximumAge: 0 },
        )
      } catch {
        onLocationError(null)
      }
    }

    return () => {
      alive = false
      if (watchId !== null) geolocation?.clearWatch(watchId)
      if (animationFrame !== null) cancelAnimationFrame(animationFrame)
      marker?.setMap(null)
      accuracyCircle?.setMap(null)
      interactionEvents.forEach(type => host.current?.removeEventListener(type, markUserInteraction))
      recenterRef.current = null
    }
  }, [status, initialLocation])

  return <div className="google-map relative h-full w-full">
    <div ref={host} className="h-full w-full" />
    {status === 'ready' && <>
      {locationMessage && <div role="status" className="absolute bottom-[76px] right-4 z-[650] max-w-[min(300px,calc(100vw-2rem))] rounded-xl border border-white/10 bg-ink/95 px-3 py-2 text-[10px] leading-4 text-slate-300 shadow-xl backdrop-blur">
        {locationMessage}
      </div>}
      <button
        type="button"
        onClick={() => recenterRef.current?.()}
        aria-label="Recenter map to your location"
        title="Recenter map to your location"
        className="absolute bottom-4 right-4 z-[650] flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-ink/95 text-blue-300 shadow-xl backdrop-blur transition hover:border-blue-300/50 hover:bg-slate-800 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
      >
        <LocateFixed size={19} className={locating ? 'animate-pulse' : ''} />
      </button>
    </>}
    {status !== 'ready' && <div className="absolute inset-0 grid place-items-center bg-slate-900/95 p-6 text-center text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-ink/95 p-6 shadow-xl">
        <div className="text-lg font-bold">{status === 'missing-key' ? 'Google Maps API key required' : status === 'error' ? 'Google Maps failed to load' : 'Loading Google Maps…'}</div>
        {status === 'missing-key' && <p className="mt-3 text-sm leading-6 text-slate-300">Enable Maps JavaScript API, Places API (New), and Routes API in Google Cloud. Enable Geocoding API for the address-search fallback. Add <code className="text-emeraldx">VITE_GOOGLE_MAPS_API_KEY=your_key</code> to <code className="text-emeraldx">.env.local</code> and restart Vite. Billing is required. On Vercel, add the same variable under Project Settings, Environment Variables and redeploy; restrict the key to your domain and enabled APIs.</p>}
        {status === 'error' && <p className="mt-3 text-sm leading-6 text-slate-300">{loadError || 'Check the API key, HTTP referrer restrictions, enabled APIs, billing, and network connection.'}</p>}
      </div>
    </div>}
  </div>
}
