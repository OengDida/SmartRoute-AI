import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, BatteryCharging, Bike, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, Layers, Maximize2, Minimize2, CircleDollarSign, Clock3, Fuel, Gauge, Github, Info, LocateFixed, Leaf, Map as MapIcon, MapPin, Moon, Navigation, PlugZap, Route, Search, ShieldAlert, Sun, Truck, Zap } from 'lucide-react'
import MapView from './components/MapView'
import { computeGoogleRoute, geocodeGoogleAddress, googleMapsErrorMessage, loadGoogleMaps, searchGooglePlaces, searchStationsAlongRoute } from './googleMaps'
import { vehicleGroups } from './data/vehicles'
import { provinces, stations } from './data/places'
import { defaultRates, exchangeRateApiUrl, fetchLatestExchangeRate, fetchLatestFuelPrices, fuelPricesApiUrl } from './data/rates'
import { fmt, haversine, money, nearestOnRoute } from './utils'

const cx=(...x)=>x.filter(Boolean).join(' ')
const fmtTime=m=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`
const categoryIcons={ev:Zap,hybrid:Leaf,gasoline:CarFront,diesel:Truck,motorbike:Bike}
const knownVehicleBrands=['Land Rover','Mercedes-Benz','Rolls-Royce','Aston Martin','Alfa Romeo','Great Wall','Leapmotor','SsangYong','Mitsubishi','Chevrolet','Volkswagen','Lamborghini','Porsche','Cadillac','Chrysler','Dodge','Subaru','Suzuki','Nissan','Renault','Peugeot','Citroen','Skoda','Toyota','Lexus','Hyundai','Honda','Kawasaki','Ferrari','Bentley','Genesis','Infiniti','Lincoln','Maserati','Hongqi','VinFast','Voltra','Yamaha','Yadea','Zontes','Bajaj','Keeway','Vespa','Kia','Ford','Jeep','BYD','GAC','MG','BMW','Audi','Tesla','Volvo','Geely','Zeekr','Chery','Jaecoo','Deepal','Avatr','XPeng','Xiaomi','Neta','Wuling','Denza','Mazda','Isuzu','RAM','Fiat','Mini','Acura','Polestar','Rivian','Lucid','Buick','GMC','INEOS','Jaguar','Aito','Bajaj','GPX','Hongqi','Kawasaki','Keeway','Li','MG','Voltra','Yadea','Yamaha','Zontes']
const vehicleBrand=name=>knownVehicleBrands.find(brand=>name.toLowerCase().startsWith(brand.toLowerCase())&&/[\s\d]/.test(name[brand.length]||' '))||name.split(' ')[0]
const brandLogoDomains={'Acura':'acura.com','Aito':'aito.auto','Alfa Romeo':'alfaromeo.com','Aston Martin':'astonmartin.com','Audi':'audi.com','Avatr':'avatr.com','Bajaj':'bajajauto.com','Bentley':'bentleymotors.com','BMW':'bmw.com','BYD':'byd.com','Buick':'buick.com','Cadillac':'cadillac.com','Changan':'changan.com.cn','Chery':'cheryinternational.com','Chevrolet':'chevrolet.com','Chrysler':'chrysler.com','Deepal':'deepal.com','Denza':'denza.com','Dodge':'dodge.com','Ferrari':'ferrari.com','Fiat':'fiat.com','Ford':'ford.com','GAC':'gac-motor.com','GMC':'gmc.com','GPX':'gpxmotor.com','Geely':'geely.com','Genesis':'genesis.com','GWM':'gwm-global.com','Honda':'honda.com','Hongqi':'hongqi-auto.com','Hyundai':'hyundai.com','INEOS':'ineosgrenadier.com','Infiniti':'infiniti.com','Isuzu':'isuzu.com','Jaecoo':'jaecoo.com','Jaguar':'jaguar.com','Jeep':'jeep.com','Kawasaki':'global.kawasaki.com','Keeway':'keeway.com','Kia':'kia.com','Land Rover':'landrover.com','Leapmotor':'leapmotor.com','Lexus':'lexus.com','Li':'lixiang.com','Lincoln':'lincoln.com','Lucid':'lucidmotors.com','MG':'mgmotor.com','Mazda':'mazda.com','Mercedes-Benz':'mercedes-benz.com','Mini':'mini.com','Mitsubishi':'mitsubishi-motors.com','Neta':'netaauto.com','Nissan':'nissan-global.com','Polestar':'polestar.com','Porsche':'porsche.com','RAM':'ramtrucks.com','Rivian':'rivian.com','Rolls-Royce':'rolls-roycemotorcars.com','Subaru':'subaru.com','Suzuki':'suzuki.com','Tesla':'tesla.com','Toyota':'toyota.com','Vespa':'vespa.com','VinFast':'vinfastauto.com','Voltra':'voltramotor.com','Volkswagen':'volkswagen.com','Volvo':'volvocars.com','Wuling':'wuling.com.cn','XPeng':'xpeng.com','Xiaomi':'xiaomi.com','Yadea':'yadea.com','Yamaha':'yamaha-motor.com','Zeekr':'zeekr.com','Zontes':'zontes.com'}
const brandLogoSlugs={'Acura':'acura','Alfa Romeo':'alfaromeo','Aston Martin':'astonmartin','Audi':'audi','Bajaj':'bajaj','Bentley':'bentley','BMW':'bmw','Buick':'buick','Cadillac':'cadillac','Chevrolet':'chevrolet','Chrysler':'chrysler','Dodge':'dodge','Ferrari':'ferrari','Ford':'ford','GMC':'gmc','GPX':'gpx','Honda':'honda','Hyundai':'hyundai','Infiniti':'infiniti','Jaguar':'jaguar','Jeep':'jeep','Kawasaki':'kawasaki','Keeway':'keeway','Kia':'kia','Land Rover':'landrover','Lexus':'lexus','Lincoln':'lincoln','Mazda':'mazda','Mercedes-Benz':'mercedesbenz','Mini':'mini','Mitsubishi':'mitsubishi','Nissan':'nissan','Porsche':'porsche','RAM':'ram','Rolls-Royce':'rollsroyce','Subaru':'subaru','Suzuki':'suzuki','Tesla':'tesla','Toyota':'toyota','Vespa':'vespa','Volkswagen':'volkswagen','Volvo':'volvo','Voltra':'voltra','Yadea':'yadea','Yamaha':'yamaha','Zontes':'zontes'}
const brandLogoUrls={
  'Aston Martin':'https://logos-world.net/wp-content/uploads/2021/03/Aston-Martin-Logo.png',
  Bajaj:'https://upload.wikimedia.org/wikipedia/commons/d/d0/Bajaj_auto_logo.svg',
  Cadillac:'https://thumb.wikimedia.org/wikipedia/en/thumb/6/66/Cadillac_logo_BW.svg/1920px-Cadillac_logo_BW.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  Changan:'https://commons.wikimedia.org/wiki/Special:FilePath/Changan_icon.svg',
  Chevrolet:'https://thumb.wikimedia.org/wikipedia/en/thumb/b/bd/Chevrolet_%28logo%29.svg/1920px-Chevrolet_%28logo%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  Chery:'https://upload.wikimedia.org/wikipedia/commons/b/b6/Chery_logo.svg',
  Chrysler:'https://upload.wikimedia.org/wikipedia/fr/b/b1/Chrysler_logo.png?utm_source=fr.wikipedia.org&utm_campaign=index&utm_content=original',
  Deepal:'https://upload.wikimedia.org/wikipedia/commons/c/c0/Deepal_global_logo.svg',
  Genesis:'https://logos-world.net/wp-content/uploads/2021/08/Genesis-Symbol.png',
  Dodge:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6PgB-Q-SVpV9YcIiFRUNZgbO6dNP0mCH69aghz3zIYP5o8jSl1m_FmSg&s=10',
  GPX:'https://images.seeklogo.com/logo-png/44/1/gpx-logo-png_seeklogo-449982.png',
  Fiat:'https://commons.wikimedia.org/wiki/Special:FilePath/FIAT_logo_coloured.svg',
  GWM:'https://commons.wikimedia.org/wiki/Special:FilePath/GWM_2025_logo.svg',
  Hongqi:'https://e-n-cars.ru/images/brands/hongqi_dark_694bf9a8cf49d.webp',
  Isuzu:'https://upload.wikimedia.org/wikipedia/commons/4/49/Isuzu.svg',
  Jaecoo:'https://upload.wikimedia.org/wikipedia/commons/4/4b/Jaecoo_wordmark.svg',
  Lincoln:'https://www.autobestkorea.com/upload/brand/2025/lincoln_motor_logomark-brandlogo.net_-512x512_1766010644_555.png',
  Lucid:'https://commons.wikimedia.org/wiki/Special:FilePath/Lucid_Motors_logo.svg',
  'Mercedes-Benz':'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/960px-Mercedes-Logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail',
  Mitsubishi:'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_logo.svg/3840px-Mitsubishi_logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail',
  Polestar:'https://commons.wikimedia.org/wiki/Special:FilePath/Polestar_logo_2020.svg',
  Porsche:'https://upload.wikimedia.org/wikipedia/commons/9/96/Newporschecrest.jpg?utm_source=simple.wikipedia.org&utm_campaign=index&utm_content=original',
  RAM:'https://upload.wikimedia.org/wikipedia/en/e/e8/Ramchryslerlogo.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original',
  Rivian:'https://commons.wikimedia.org/wiki/Special:FilePath/Rivian_company_logo.jpg',
  Voltra:'https://phnompenh.impacthub.net/wp-content/uploads/2024/05/Voltra.png',
  Wuling:'https://upload.wikimedia.org/wikipedia/commons/7/77/Wuling_logo.svg',
  Zontes:'https://motoa2.es/wp-content/uploads/logo-zontes-moto-a2.png'
}
const brandLogoUrl=brand=>{
  const slug=brandLogoSlugs[brand]||brand.toLowerCase().replace(/[^a-z0-9]/g,'')
  return `https://cdn.simpleicons.org/${slug}`
}
const kmLine=(a,b)=>haversine(a,b)
const stationFilters=[['all','All Stations'],['ev','EV Chargers'],['gas','Gas Pumps'],['hybrid','Hybrid Hubs']]
const filterLabel=id=>stationFilters.find(f=>f[0]===id)?.[1]||'Stations'
const searchLabel={all:'Find stations along this route',ev:'Find EV chargers along this route',gas:'Find gas stations along this route',hybrid:'Find hybrid hubs along this route'}
const matchesFilter=(s,f)=>f==='all'||(f==='ev'&&s.type!=='gas_only')||(f==='gas'&&s.type!=='ev_only')||(f==='hybrid'&&s.type==='hybrid_hub')
const typeBadge={ev_only:['EV','text-blue-300'],gas_only:['Gas','text-amberx'],hybrid_hub:['Hybrid hub','text-violet-300']}
function Panel({children,className=''}){return <div className={cx('glass rounded-xl border border-white/10 shadow-sm',className)}>{children}</div>}
function Pill({children,active,onClick}){return <button onClick={onClick} className={cx('rounded-full px-3 py-2 text-xs font-semibold transition',active?'bg-emeraldx text-ink':'bg-white/5 text-slate-300 hover:bg-white/10')}>{children}</button>}
function Field({label,children}){return <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>}
function Select({value,onChange,children}){return <div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="field w-full appearance-none pr-9">{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-400"/></div>}
function PlaceSearch({label,value,placeholder,onPick,action,bias}){
  const host=useRef(null)
  const widgetRef=useRef(null)
  const onPickRef=useRef(onPick)
  const valueRef=useRef(value)
  const biasRef=useRef(bias)
  const [mode,setMode]=useState('loading')
  const [error,setError]=useState('')
  const [fallbackQuery,setFallbackQuery]=useState(value||'')
  const [fallbackLoading,setFallbackLoading]=useState(false)

  onPickRef.current=onPick
  valueRef.current=value
  biasRef.current=bias

  useEffect(()=>{
    let alive=true
    let widget
    const onSelect=async event=>{
      try{
        const place=event.placePrediction?.toPlace()
        if(!place)throw new Error('Google did not return a place for that selection.')
        await place.fetchFields({fields:['displayName','formattedAddress','location']})
        const location=place.location
        if(!location)throw new Error('This place did not include a usable map location.')
        const lat=typeof location.lat==='function'?location.lat():location.lat
        const lng=typeof location.lng==='function'?location.lng():location.lng
        if(!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error('This place did not include usable coordinates.')
        const name=place.displayName||place.formattedAddress||'Google Maps place'
        const formattedAddress=place.formattedAddress||name
        setError('')
        setFallbackQuery(formattedAddress)
        onPickRef.current?.({lat,lng,name,formattedAddress,placeId:place.id,isCurrentLocation:false})
      }catch(selectionError){
        setError(googleMapsErrorMessage(selectionError,'Google Places'))
      }
    }
    const onWidgetError=()=>{
      if(!alive)return
      setError('Google place suggestions are unavailable. Check Places API access, billing, quota, and key restrictions, or enter a full address below.')
      setMode('fallback')
      widget?.removeEventListener('gmp-select',onSelect)
      widget?.removeEventListener('gmp-error',onWidgetError)
      widget?.remove()
      if(widgetRef.current===widget)widgetRef.current=null
    }

    loadGoogleMaps().then(async maps=>{
      const {PlaceAutocompleteElement}=await maps.importLibrary('places')
      if(!alive)return
      if(!PlaceAutocompleteElement)throw new Error('PlaceAutocompleteElement is unavailable in this Maps JavaScript API version.')
      widget=new PlaceAutocompleteElement({
        placeholder,
        value:valueRef.current||'',
        requestedRegion:'kh',
        description:`Search for a Google Maps place for ${label.toLowerCase()}.`,
      })
      widget.className='google-place-autocomplete'
      widget.value=valueRef.current||''
      widget.style.width='100%'
      widget.style.colorScheme='dark'
      widget.locationBias=biasRef.current?{center:{lat:biasRef.current.lat,lng:biasRef.current.lng},radius:25000}:undefined
      widget.addEventListener('gmp-select',onSelect)
      widget.addEventListener('gmp-error',onWidgetError)
      widgetRef.current=widget
      host.current?.replaceChildren(widget)
      setMode('widget')
      setError('')
    }).catch(loadError=>{
      if(!alive)return
      setMode('fallback')
      setError(`${googleMapsErrorMessage(loadError,'Google Places')} Enter a full address to use Google Geocoding as a fallback.`)
    })

    return()=>{
      alive=false
      widget?.removeEventListener('gmp-select',onSelect)
      widget?.removeEventListener('gmp-error',onWidgetError)
      widget?.remove()
      if(widgetRef.current===widget)widgetRef.current=null
    }
  },[label,placeholder])

  useEffect(()=>{
    if(widgetRef.current&&widgetRef.current.value!==(value||''))widgetRef.current.value=value||''
    setFallbackQuery(value||'')
  },[value])

  useEffect(()=>{
    if(widgetRef.current){
      widgetRef.current.locationBias=bias?{center:{lat:bias.lat,lng:bias.lng},radius:25000}:undefined
    }
  },[bias?.lat,bias?.lng])

  const searchFallback=async event=>{
    event.preventDefault()
    const query=fallbackQuery.trim()
    if(!query||fallbackLoading)return
    setFallbackLoading(true);setError('')
    try{
      const place=await geocodeGoogleAddress(query)
      setFallbackQuery(place.formattedAddress)
      onPickRef.current?.(place)
    }catch(geocodeError){
      setError(googleMapsErrorMessage(geocodeError,'Google Geocoding'))
    }finally{
      setFallbackLoading(false)
    }
  }

  return <div className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div ref={host} className={cx('w-full',mode!=='widget'&&'hidden')}/>
        {mode==='loading'&&<div className="field min-h-[42px] w-full truncate text-slate-500">{value||placeholder}</div>}
        {mode==='fallback'&&<form onSubmit={searchFallback} className="flex gap-2">
          <input className="field min-w-0 flex-1" aria-label={`${label} address`} value={fallbackQuery} onChange={event=>setFallbackQuery(event.target.value)} placeholder={placeholder} autoComplete="off"/>
          <button type="submit" disabled={fallbackLoading||!fallbackQuery.trim()} aria-label={`Find ${label.toLowerCase()} address`} title="Find address" className="flex h-[42px] w-11 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-slate-300 transition hover:border-emeraldx/50 hover:text-emeraldx disabled:opacity-50">
            <Search size={16} className={fallbackLoading?'animate-pulse':''}/>
          </button>
        </form>}
      </div>
      {action}
    </div>
    {error&&<div role="status" className="text-[10px] leading-4 text-amberx">{error}</div>}
  </div>
}

// Destination search from the supplied App.jsx: explicit Google Places
// text-search results scoped to Cambodia, rather than autocomplete suggestions.
function GoogleTextPlaceSearch({label,value,placeholder,onPick,action}){
  const [q,setQ]=useState(value||'')
  const [open,setOpen]=useState(false)
  const [found,setFound]=useState([])
  const [status,setStatus]=useState('idle')
  const [searchError,setSearchError]=useState('')
  const [searched,setSearched]=useState('')
  useEffect(()=>setQ(value||''),[value])
  const term=q.trim()
  const search=async()=>{
    if(term.length<2||status==='loading')return
    setStatus('loading')
    try{
      const data=await searchGooglePlaces(term)
      setFound(data)
      setSearchError('')
      setSearched(term)
      setStatus('done')
    }catch(error){
      setSearchError(googleMapsErrorMessage(error,'Google Places'))
      setStatus('error')
    }
  }
  // Live suggestions: query Google Places shortly after the person stops typing.
  useEffect(()=>{
    if(!open||term.length<2||searched===term)return
    let cancelled=false
    setStatus('loading')
    const timer=setTimeout(async()=>{
      try{
        const data=await searchGooglePlaces(term)
        if(cancelled)return
        setFound(data);setSearchError('');setSearched(term);setStatus('done')
      }catch(error){
        if(cancelled)return
        setSearchError(googleMapsErrorMessage(error,'Google Places'));setStatus('error')
      }
    },400)
    return ()=>{cancelled=true;clearTimeout(timer)}
  },[term,open])
  const pick=place=>{
    onPick(place)
    setOpen(false)
    setQ(place.formattedAddress||place.name||'')
    setFound([])
    setSearched('')
    setStatus('idle')
  }
  const showFound=status==='done'&&searched===term
  const item='block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5'
  return <div className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/>
        <input className="field w-full !pl-9" aria-label={label} value={q} placeholder={placeholder} onFocus={event=>{setOpen(true);event.currentTarget.select()}} onBlur={()=>setOpen(false)} onChange={event=>{setQ(event.target.value);setFound([]);setSearched('');setStatus('idle');setSearchError('')}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();search()}else if(event.key==='Escape')event.target.blur()}} autoComplete="off"/>
      </div>
      {action}
    </div>
    {open&&(term.length>=2||status==='error')&&<div onMouseDown={event=>event.preventDefault()} className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {term.length>=2&&status==='loading'&&<div className="px-3 py-3 text-[11px] text-slate-400">Searching Google Maps…</div>}
      {showFound&&found.length>0&&<div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Google Maps places in Cambodia</div>}
      {showFound&&found.map((place,index)=><button type="button" key={place.placeId||`${place.lat}:${place.lng}:${index}`} onClick={()=>pick(place)} className={item}><div className="font-semibold">{place.name}</div><div className="mt-0.5 truncate text-[10px] text-slate-500">{place.detail}</div></button>)}
      {showFound&&!found.length&&<div className="px-3 py-3 text-[11px] text-slate-400">No places found. Try a different spelling or a nearby town.</div>}
      {status==='error'&&<div role="status" className="px-3 py-3 text-[11px] leading-5 text-rose-300">Google Places search failed: {searchError}</div>}
    </div>}
  </div>
}
const repo='https://github.com/OengDida/SmartRoute-AI'
function FooterCol({title,children}){return <div><div className="mb-2 text-sm font-bold text-white">{title}</div><ul className="space-y-0.5">{children}</ul></div>}
function FLink({href,onClick,external,children}){return <li><a href={href} onClick={onClick?e=>{e.preventDefault();onClick()}:undefined} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} className="text-sm leading-6 text-slate-400 transition hover:text-emeraldx">{children}</a></li>}
function FText({children}){return <li className="text-sm leading-6 text-slate-500">{children}</li>}
function BrandHeader({theme,onToggleTheme,onHome,action,rightAction,className=''}){
  const nextTheme=theme==='light'?'dark':'light'
  return <header className={cx('app-header',className)}>
    {action}
    {onHome?<button type="button" onClick={onHome} className="brand-lockup text-left" aria-label="Return to SmartRoute AI home">
      <img src="/favicon.svg" alt="" className="brand-mark"/>
      <div><div className="brand-name">SmartRoute <span>AI</span></div><div className="brand-caption">Cambodia trip planner</div></div>
    </button>:<div className="brand-lockup">
      <img src="/favicon.svg" alt="" className="brand-mark"/>
      <div><div className="brand-name">SmartRoute <span>AI</span></div><div className="brand-caption">Cambodia trip planner</div></div>
    </div>}
    <div className="header-spacer"/>
    {rightAction}
    <button type="button" onClick={onToggleTheme} className="theme-toggle" aria-label={`Switch to ${nextTheme} mode`} aria-pressed={theme==='dark'} title={`Switch to ${nextTheme} mode`}>
      {theme==='light'?<Moon size={16}/>:<Sun size={16}/>}<span>{nextTheme==='dark'?'Dark':'Light'}</span>
    </button>
  </header>
}
function Welcome({onStart,onRoute,theme,onToggleTheme}){return <main className="welcome min-h-screen px-5">
  <div className="page-frame mx-auto flex min-h-screen max-w-6xl flex-col">
    <BrandHeader theme={theme} onToggleTheme={onToggleTheme} className="py-6"/>
    <section className="welcome-layout flex-1 py-8 sm:py-12">
      <div className="welcome-copy">
        <div className="eyebrow">CAMBODIA TRIP PLANNER</div>
        <h1>Plan around the road, the range, and the cost.</h1>
        <p className="welcome-description">Set up your vehicle, choose a starting point and destination, then review route distance, range, stops, and estimated trip cost.</p>
        <div className="welcome-actions">
          <button onClick={onStart} className="primary-action">Start a trip <ArrowRight size={17}/></button>
          <span className="welcome-note"><ShieldAlert size={16}/> Estimates only. Check conditions before departure.</span>
        </div>
      </div>
      <aside className="welcome-overview" aria-label="Trip planning steps">
        <div className="overview-heading"><span>TRIP SETUP</span><span>VEHICLE → ROUTE</span></div>
        <ol className="flow-list">
          <li><span className="flow-marker" aria-hidden="true"/><div><b>Vehicle profile</b><p>Choose a preset or enter your own figures.</p></div></li>
          <li><span className="flow-marker" aria-hidden="true"/><div><b>Location access</b><p>Set your current position for the map.</p></div></li>
          <li><span className="flow-marker" aria-hidden="true"/><div><b>Route and estimates</b><p>Review range, stations, distance, and cost.</p></div></li>
        </ol>
        <div className="overview-foot"><span>Five powertrains</span><span>KHR + USD estimates</span><span>Route-aware station search</span></div>
      </aside>
    </section>
    <footer className="welcome-footer border-t border-white/10 pt-8">
      <div className="footer-layout">
        <div><div className="footer-brand"><img src="/favicon.svg" alt=""/><div className="brand-name">SmartRoute <span>AI</span></div></div><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Highway range and trip-cost planning for Cambodia.</p><div className="mt-4 flex gap-3"><a href={repo} target="_blank" rel="noopener noreferrer" aria-label="SmartRoute AI on GitHub" className="footer-social"><Github size={18}/></a></div></div>
        <div className="footer-links">
          <FooterCol title="Planner"><FLink href="/vehicle" onClick={onStart}>Start a trip</FLink><FLink href="/vehicle" onClick={onStart}>Vehicle profile</FLink><FLink href="/route" onClick={onRoute}>Map &amp; route</FLink></FooterCol>
          <FooterCol title="Powertrains"><FText>Electric</FText><FText>Hybrid</FText><FText>Gasoline</FText><FText>Diesel</FText><FText>Motorbike</FText></FooterCol>
          <FooterCol title="Data &amp; maps"><FLink href="https://developers.google.com/maps/documentation/javascript" external>Google Maps &amp; Places</FLink><FLink href="https://developers.google.com/maps/documentation/javascript/routes/get-a-route" external>Google Routes</FLink><FLink href={repo+'/blob/main/src/data/places.js'} external>Station data</FLink></FooterCol>
          <FooterCol title="Project"><FLink href={repo} external>GitHub</FLink><FLink href={repo+'/issues'} external>Report an issue</FLink><FLink href="/sitemap.xml" external>Sitemap</FLink></FooterCol>
        </div>
      </div>
      <div className="footer-legal mt-8 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 py-5 text-[11px] leading-5 text-slate-500"><span>© 2026 SmartRoute AI · Cambodia trip planning</span><span className="max-w-xl sm:text-right">Estimates only. Station data is a curated dataset, not a live directory. Verify fuel and charger availability before you travel.</span></div>
    </footer>
  </div>
</main>}
function LocationGate({onSuccess,onBack,theme,onToggleTheme}) {
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [checkingPermission,setCheckingPermission]=useState(Boolean(navigator.permissions?.query))
  const [bypassGate,setBypassGate]=useState(false)
  const requestRef=useRef(null)
  const requestIdRef=useRef(0)

  const requestLocation=()=>{
    if(!navigator.geolocation){setLoading(false);setBypassGate(false);setError('unsupported');return}
    const requestId=++requestIdRef.current
    setLoading(true);setError('')
    try{
      navigator.geolocation.getCurrentPosition(position=>{
        if(requestId!==requestIdRef.current)return
        const {latitude:lat,longitude:lng,accuracy}=position.coords||{}
        if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180){
          setLoading(false);setError('unavailable');return
        }
        onSuccess({lat,lng,accuracy:Number.isFinite(accuracy)?Math.max(0,accuracy):0})
      },err=>{
        if(requestId!==requestIdRef.current)return
        setLoading(false);setBypassGate(false)
        setError(err?.code===1?'denied':err?.code===2?'unavailable':err?.code===3?'timeout':'unavailable')
      },{enableHighAccuracy:true,timeout:20000,maximumAge:0})
    }catch{
      if(requestId!==requestIdRef.current)return
      setLoading(false);setBypassGate(false);setError('unavailable')
    }
  }
  requestRef.current=requestLocation

  useEffect(()=>{
    let active=true
    if(!navigator.geolocation){setCheckingPermission(false);setError('unsupported');return()=>{active=false}}
    if(!navigator.permissions?.query){setCheckingPermission(false);return()=>{active=false}}
    navigator.permissions.query({name:'geolocation'}).then(permission=>{
      if(!active)return
      setCheckingPermission(false)
      if(permission.state==='granted'){
        setBypassGate(true)
        requestRef.current?.()
      }else if(permission.state==='denied')setError('denied')
    }).catch(()=>{if(active)setCheckingPermission(false)})
    return()=>{active=false;requestIdRef.current++}
  },[])

  if(checkingPermission||bypassGate)return <main className="location-screen grid min-h-[100dvh] place-items-center px-5 text-center"><div className="text-sm text-slate-400"><LocateFixed size={20} className="mx-auto mb-3 animate-pulse text-emeraldx"/>{checkingPermission?'Checking location access…':'Finding your location…'}</div></main>

  const errorCopy={
    denied:{
      title:'Location permission is blocked',
      body:'Allow location for this site from the lock or site-controls icon beside the address bar. Choose Location → Allow, then try again.',
    },
    unavailable:{
      title:'Your position is unavailable',
      body:'Check that device location services are on and that you have a clear GPS or network signal, then try again.',
    },
    timeout:{
      title:'Location request timed out',
      body:'We couldn’t get a GPS fix in time. Check your signal or device location settings, then try again.',
    },
    unsupported:{
      title:'Location isn’t supported here',
      body:'Use a browser and secure connection that support location services, then reload SmartRoute.',
    },
  }[error]

  return <main className="location-screen min-h-[100dvh] px-5 py-4 sm:px-8">
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-6xl flex-col">
    <BrandHeader theme={theme} onToggleTheme={onToggleTheme} className="py-3"/>
    <section className="grid flex-1 place-items-center py-8">
    <div className="relative w-full max-w-lg">
      <Panel className="p-6 text-center shadow-2xl sm:p-9">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emeraldx/20 bg-emeraldx/10 text-emeraldx shadow-glow"><MapPin size={25}/></div>
        <div className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-emeraldx">Location access · required to continue</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Enable your location to start</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300">SmartRoute uses your live location to find your starting point and center your trip map for route and cost planning.</p>

        {errorCopy&&<div role="alert" className="mt-6 rounded-xl border border-amberx/20 bg-amberx/5 p-4 text-left">
          <div className="flex items-start gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-amberx"/><div><div className="text-xs font-bold text-amberx">{errorCopy.title}</div><p className="mt-1 text-xs leading-5 text-slate-300">{errorCopy.body}</p></div></div>
          <button onClick={requestLocation} disabled={loading} className="mt-3 ml-7 text-xs font-bold text-emeraldx underline decoration-emeraldx/40 underline-offset-4 hover:text-emerald-300 disabled:opacity-50">Try Again</button>
        </div>}

        {loading&&<div role="status" className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><LocateFixed size={15} className="animate-pulse text-emeraldx"/>Finding your location…</div>}
        <button onClick={requestLocation} disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx px-5 py-4 text-sm font-extrabold text-ink shadow-glow transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-65">
          <LocateFixed size={17} className={loading?'animate-pulse':''}/>{loading?'Locating…':'Allow Location & Continue'}
        </button>
        <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"><ArrowLeft size={14}/>Back to SmartRoute</button>
        <p className="mt-4 text-[10px] leading-4 text-slate-500">Location is used to show your position on the trip map. You can change browser permissions any time.</p>
      </Panel>
      <div className="mt-5 text-center text-[10px] text-slate-500">Location is required to center the trip map.</div>
    </div></section></div>
  </main>
}
function Setup({onBack,onGenerate,config,setConfig,theme,onToggleTheme}) {
  const [vehicleSearch,setVehicleSearch]=useState('')
  const [selectedBrand,setSelectedBrand]=useState('')
  const [showAllBrands,setShowAllBrands]=useState(false)
  const group=vehicleGroups.find(g=>g.id===config.category)
  const brands=[...new Set(group?.items.map(v=>vehicleBrand(v.name))||[])].sort((a,b)=>a.localeCompare(b))
  const brandColumns=typeof window!=='undefined'&&window.matchMedia('(min-width: 640px)').matches?6:4
  const visibleBrands=showAllBrands?brands:brands.slice(0,brandColumns*2)
  const renderBrand=brand=><button type="button" key={brand} onClick={()=>setSelectedBrand(current=>current===brand?'':brand)} aria-pressed={selectedBrand===brand} className="group flex min-w-0 flex-col items-center gap-2 rounded-lg p-1 text-center"><span className={cx('relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 text-sm font-black',brand==='Genesis'?'bg-white text-slate-800':'bg-slate-100 text-slate-800')}><span>{brand.split(/\s+/).map(part=>part[0]).join('').slice(0,3)}</span>{brandLogoDomains[brand]&&<img src={brandLogoUrls[brand]||brandLogoUrl(brand)} alt={`${brand} logo`} loading="lazy" onLoad={event=>{event.currentTarget.previousElementSibling.style.display='none'}} onError={event=>{const img=event.currentTarget;if(!img.dataset.fallback&&!brandLogoUrls[brand]){img.dataset.fallback='true';img.src=`https://www.google.com/s2/favicons?domain=${brandLogoDomains[brand]}&sz=256`}else img.style.display='none'}} className={cx("absolute inset-0 m-auto object-contain",brand==="Dodge"?"h-14 w-14":brand==="Genesis"||brand==="Chrysler"?"h-13 w-13":"h-12 w-12")}/>}</span><span className={cx('w-full whitespace-normal break-words text-[11px] leading-tight',selectedBrand===brand?'text-emeraldx':'text-slate-300')}>{brand}</span></button>
  const vehicleOptions=group?.items.filter(v=>(!selectedBrand||vehicleBrand(v.name)===selectedBrand)&&`${v.name} ${v.note}`.toLowerCase().includes(vehicleSearch.trim().toLowerCase()))||[]
  const selected=group?.items.find(v=>v.id===config.model)
  const set=(key,value)=>setConfig(p=>({...p,[key]:value}))
  useEffect(()=>{if(!config.modified&&selected)setConfig(p=>({...p,energy:selected.energy,capacity:selected.capacity,consumption:selected.consumption,model:selected.id}))},[config.category,config.model,config.modified])
  const Icon=categoryIcons[config.category]||CarFront
  return <div className="vehicle-screen min-h-screen px-4 py-5 sm:px-8"><div className="mx-auto max-w-6xl">
    <BrandHeader theme={theme} onToggleTheme={onToggleTheme} className="mb-5 py-2"/>
    <button onClick={onBack} className="back-link mb-5 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back</button>
    <div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emeraldx">Step 02 / Vehicle profile</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">What are you driving?</h1><p className="mt-2 text-slate-400">We'll use your vehicle's real-world efficiency to estimate range and trip costs.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5 sm:p-7"><h2 className="mb-4 font-bold">2A. Select powertrain</h2><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{vehicleGroups.map(g=>{const I=categoryIcons[g.id];return <button key={g.id} onClick={()=>{setSelectedBrand('');setShowAllBrands(false);setConfig(p=>{const deselect=p.category===g.id;return {...p,category:deselect?'':g.id,model:'',energy:deselect?'':g.items[0].energy,...(deselect||!p.modified?{capacity:'',consumption:''}:{})}})}} className={cx('flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',config.category===g.id?'border-emeraldx bg-emeraldx/10':'border-white/10 bg-white/[.025] hover:bg-white/5')}><I size={18} className={config.category===g.id?'text-emeraldx':'text-slate-400'}/><div className="min-w-0 flex-1"><div className="text-sm font-bold">{g.label}</div><div className="text-[11px] text-slate-500">{g.items.length} presets</div></div>{config.category===g.id&&<Check size={15} className="text-emeraldx"/>}</button>})}</div>
      <div className="my-7 border-t border-white/10"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">2B. Vehicle configuration</h2><div className="flex rounded-xl bg-black/20 p-1"><button onClick={()=>setConfig(p=>({...p,modified:false,...(p.model?{}:{capacity:'',consumption:''})}))} className={cx('rounded-lg px-4 py-2 text-xs font-bold',!config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Stock</button><button onClick={()=>set('modified',true)} className={cx('rounded-lg px-4 py-2 text-xs font-bold',config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Modified</button></div></div>
      {!config.modified?<div className="mt-5 space-y-4">{!group?<p className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-400">Select a powertrain above, then choose your vehicle.</p>:<><div className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="mb-4 text-sm font-bold">Brand</div><div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6">{visibleBrands.map(renderBrand)}</div>{brands.length>brandColumns*2&&<button type="button" onClick={()=>setShowAllBrands(value=>!value)} className="mt-4 w-full rounded-lg bg-white/[.08] py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white">{showAllBrands?'Show Less':'View More'}</button>}</div><Field label="Search vehicles"><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/><input className="field w-full !pl-9" type="search" value={vehicleSearch} onChange={e=>setVehicleSearch(e.target.value)} placeholder="Search by make or model" autoComplete="off"/></div></Field><div className="-mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{vehicleOptions.length?vehicleOptions.map(v=><button type="button" key={v.id} onClick={()=>setConfig(p=>({...p,model:v.id,energy:v.energy,capacity:v.capacity,consumption:v.consumption}))} className={cx('block w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5',config.model===v.id&&'bg-emeraldx/10')}><span className="block text-xs font-semibold">{v.name}</span><span className="mt-0.5 block text-[10px] text-slate-500">{v.note}</span></button>):<div className="px-3 py-3 text-xs text-slate-500">No vehicles match “{vehicleSearch}”. Try another search.</div>}</div></>}{selected&&<div className="rounded-xl border border-emeraldx/15 bg-emeraldx/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emeraldx"><Icon size={17}/>{selected?.name}</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[10px] uppercase text-slate-500">Capacity</div><b>{config.capacity} {config.energy==='electric'?'kWh':'L'}</b></div><div><div className="text-[10px] uppercase text-slate-500">Consumption</div><b>{config.consumption} {config.energy==='electric'?'kWh':'L'}/100km</b></div></div></div>}</div>
      :<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Fuel / energy type"><Select value={config.energy} onChange={v=>set('energy',v)}><option value="" disabled>Choose type</option><option value="gasoline">Regular gasoline 92</option><option value="diesel">Diesel</option><option value="electric">Electric (kWh)</option></Select></Field><Field label={`Consumption (${config.energy==='electric'?'kWh':'L'}/100km)`}><input className="field w-full" type="number" min="0.1" step=".1" value={config.consumption} onChange={e=>set('consumption',e.target.value===''?'':Number(e.target.value))}/></Field><Field label={`Tank / battery capacity (${config.energy==='electric'?'kWh':'L'})`}><input className="field w-full" type="number" min="1" step=".1" value={config.capacity} onChange={e=>set('capacity',e.target.value===''?'':Number(e.target.value))}/></Field><Field label="Custom vehicle name"><input className="field w-full" value={config.customName} onChange={e=>set('customName',e.target.value)} placeholder="e.g. My modified pickup"/></Field></div>}
      <div className="mt-7 rounded-xl bg-black/20 p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold">Current {config.energy==='electric'?'battery':config.energy?'fuel':'battery / fuel'} level</label><span className="text-xl font-black text-emeraldx">{config.level}%</span></div><input type="range" min="5" max="100" step="1" value={config.level} onChange={e=>set('level',Number(e.target.value))} className="mt-4 w-full accent-emerald-400"/><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Nearly empty</span><span>Full tank</span></div></div>
      <button onClick={onGenerate} disabled={!config.capacity||!config.consumption||config.capacity<=0||config.consumption<=0||(!config.modified&&!config.model)||(config.modified&&!config.energy)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-4 font-extrabold text-ink transition hover:bg-emerald-300 disabled:opacity-40">Generate Map & Route <ArrowRight size={18}/></button>
      </Panel>
      <div className="space-y-4"><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-emeraldx"><Gauge size={18}/><b>Range snapshot</b></div><div className="text-4xl font-black">{config.capacity>0&&config.consumption>0?Math.round(config.capacity*config.level/100/(config.consumption/100)):'—'}<span className="ml-1 text-base font-semibold text-slate-400">km</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Estimated remaining range at {config.level}% based on the entered consumption rate. Actual range varies with speed, load, terrain and weather.</p></Panel><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-amberx"><Info size={18}/><b>Before you hit the road</b></div><ul className="space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Verify your actual fuel or battery capacity.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Keep a safety buffer for traffic and detours.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Check station status before relying on a charger.</li></ul></Panel><div className="rounded-xl border border-white/10 p-4 text-xs leading-5 text-slate-500">Demo defaults are estimates, not certified manufacturer test figures. You can customize your consumption and rates later.</div></div>
    </div></div></div>
}
const loadTripSnapshot=()=>{
  try{
    const saved=JSON.parse(sessionStorage.getItem('smartroute-trip')||'null')
    if(!saved)return null
    const validPoint=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)
    return {
      ...saved,
      origin:validPoint(saved.origin)?saved.origin:null,
      destination:validPoint(saved.destination)?saved.destination:null,
      route:Array.isArray(saved.route)?saved.route.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])):[],
    }
  }catch{return null}
}
function TripPlanner({config,onChangeVehicle,onHome,initialLocation,theme,onToggleTheme}) {
  const [savedTrip]=useState(loadTripSnapshot)
  const [mobileDrawerOpen,setMobileDrawerOpen]=useState(false)
  const [mapType,setMapType]=useState('roadmap')
  const plannerScreenRef=useRef(null)
  const [mapFullscreen,setMapFullscreen]=useState(false)
  useEffect(()=>{
    const syncFullscreen=()=>setMapFullscreen(document.fullscreenElement===plannerScreenRef.current)
    document.addEventListener('fullscreenchange',syncFullscreen)
    return ()=>document.removeEventListener('fullscreenchange',syncFullscreen)
  },[])
  const togglePlannerFullscreen=()=>{
    const screen=plannerScreenRef.current
    if(!screen)return
    const result=document.fullscreenElement===screen?document.exitFullscreen?.():screen.requestFullscreen?.()
    result?.catch?.(()=>{})
  }
  const [originName,setOriginName]=useState(()=>savedTrip?.originName||'')
  const [destinationName,setDestinationName]=useState(()=>savedTrip?.destinationName||'')
  const [origin,setOrigin]=useState(()=>savedTrip?.origin||null)
  const [destination,setDestination]=useState(()=>savedTrip?.destination||null)
  const [route,setRoute]=useState(()=>savedTrip?.route||[])
  const [routeChoices,setRouteChoices]=useState(()=>Array.isArray(savedTrip?.routeChoices)?savedTrip.routeChoices:[])
  const [selectedRouteIndex,setSelectedRouteIndex]=useState(()=>Number.isInteger(savedTrip?.selectedRouteIndex)?savedTrip.selectedRouteIndex:0)
  const hasGoogleRoute=route.length>1
  const [distance,setDistance]=useState(()=>Number.isFinite(savedTrip?.distance)?savedTrip.distance:0)
  const [duration,setDuration]=useState(()=>Number.isFinite(savedTrip?.duration)?savedTrip.duration:0)
  const [routeStatus,setRouteStatus]=useState(()=>savedTrip?.route?.length>1?'Google Routes · traffic-aware driving route':'Choose an origin and destination')
  const [filter,setFilter]=useState('all')
  const [rates,setRates]=useState(defaultRates)
  const [chargingMode,setChargingMode]=useState('dc-fast')
  const [showRates,setShowRates]=useState(false)
  const [fuelPriceSource,setFuelPriceSource]=useState({status:'loading',startDate:'',endDate:'',sourceUrl:''})
  const [exchangeRateSource,setExchangeRateSource]=useState({status:'loading',validDate:''})
  useEffect(()=>{
    const controller=new AbortController()
    fetchLatestFuelPrices(controller.signal)
      .then(prices=>{
        setRates(current=>({...current,gasoline:prices.gasoline,diesel:prices.diesel}))
        setFuelPriceSource({status:'live',startDate:prices.startDate,endDate:prices.endDate,sourceUrl:prices.sourceUrl})
      })
      .catch(error=>{
        if(error.name!=='AbortError')setFuelPriceSource({status:'fallback',startDate:'',endDate:'',sourceUrl:''})
      })
    fetchLatestExchangeRate(controller.signal)
      .then(exchange=>{
        setRates(current=>({...current,usdToKhr:exchange.rate}))
        setExchangeRateSource({status:'live',validDate:exchange.validDate})
      })
      .catch(error=>{
        if(error.name!=='AbortError')setExchangeRateSource({status:'fallback',validDate:''})
      })
    return ()=>controller.abort()
  },[])
  const [prompt,setPrompt]=useState('')
  const [mapClickMode,setMapClickMode]=useState(null)
  const [routeError,setRouteError]=useState('')
  const [showStations,setShowStations]=useState(false)
  const [googleStations,setGoogleStations]=useState(null)
  const [searchedFilter,setSearchedFilter]=useState('all')
  const [stationSearch,setStationSearch]=useState({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
  const [locating,setLocating]=useState(false)
  const [showLeft,setShowLeft]=useState(true)
  const [showRight,setShowRight]=useState(true)
  const [locNote,setLocNote]=useState('')
  const routeRequestRef=useRef(0)
  const vehicleName=config.modified?(config.customName||'Custom vehicle'):(vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)?.name||'Vehicle')
  const vehicle=vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)
  const isEV=config.energy==='electric'
  const isHybrid=config.category==='hybrid'&&!isEV
  const isPHEV=isHybrid&&Number.isFinite(vehicle?.electricConsumption)&&Number.isFinite(vehicle?.fuelOnlyConsumption)
  useEffect(()=>setChargingMode(isPHEV?'ac':'dc-fast'),[isPHEV])
  const comparisonFuelConsumption=6.8
  const comparisonElectricConsumption=14.4
  const consumption=config.consumption||1
  const currentRange=config.capacity*(config.level/100)/(consumption/100)
  const rangePoint=useMemo(()=>{
    if(!hasGoogleRoute||distance<=currentRange)return null
    const fraction=Math.min(.98,currentRange/distance)
    const index=Math.max(0,Math.min(route.length-1,Math.floor(fraction*(route.length-1))))
    const p=route[index]
    return p?{lat:p[1],lng:p[0]}:null
  },[route,hasGoogleRoute,distance,currentRange])
  const alongStations=useMemo(()=>stations.map(s=>({...s,routeMeta:nearestOnRoute(s,route)})).filter(s=>s.routeMeta.along<distance+1).sort((a,b)=>a.routeMeta.along-b.routeMeta.along),[route,distance])
  const findRouteStations=async()=>{
    setSearchedFilter(filter);setShowStations(true);setGoogleStations([])
    setStationSearch({status:'loading',progress:0,total:0,count:0,error:'',failedAreas:0})
    try{
      const result=await searchStationsAlongRoute(routePoints,filter,(progress,total,count)=>setStationSearch(s=>({...s,progress,total,count})))
      setGoogleStations(result.places)
      setStationSearch({status:'done',progress:result.sampleCount,total:result.sampleCount,count:result.places.length,error:result.error||'',failedAreas:result.failedAreas})
    }catch(error){
      setStationSearch(s=>({...s,status:'error',error:googleMapsErrorMessage(error,'Google Places')}))
    }
  }
  const suitable=alongStations.filter(s=>isEV?s.type!=='gas_only':s.type!=='ev_only')
  const recommended=suitable.filter(s=>s.routeMeta.along>0&&s.routeMeta.along<Math.min(distance,currentRange*0.85+15)).slice(0,3)
  const need=hasGoogleRoute?distance*consumption/100:0
  const electricRate=chargingMode==='ac'?rates.ac:chargingMode==='dc-superfast'?rates.evSuperFast:rates.ev
  const chargingModeLabel=chargingMode==='ac'?'AC charging':chargingMode==='dc-superfast'?'DC super-fast (>250 kW)':'DC fast (up to 250 kW)'
  const costRate=isEV?electricRate:config.energy==='diesel'?rates.diesel:rates.gasoline
  const totalCost=need*costRate
  const fuelOnlyConsumption=isPHEV?vehicle.fuelOnlyConsumption:comparisonFuelConsumption
  const electricOnlyConsumption=isPHEV?vehicle.electricConsumption:comparisonElectricConsumption
  const hybridFuelNeed=hasGoogleRoute?(isHybrid?distance*fuelOnlyConsumption/100:need):0
  const hybridElectricNeed=hasGoogleRoute&&isHybrid?distance*electricOnlyConsumption/100:0
  const hybridFuelCost=hybridFuelNeed*(config.energy==='diesel'?rates.diesel:rates.gasoline)
  const hybridElectricRate=electricRate
  const hybridElectricCost=hybridElectricNeed*hybridElectricRate
  const gasCost=hasGoogleRoute?distance*(isPHEV?vehicle.fuelOnlyConsumption:comparisonFuelConsumption)/100*rates.gasoline:0
  const evCost=hasGoogleRoute?distance*(isPHEV?vehicle.electricConsumption:comparisonElectricConsumption)/100*hybridElectricRate:0
  const save=Math.abs(gasCost-evCost)
  const lowRange=hasGoogleRoute&&distance>currentRange
  const routePoints=route.length?route:[]
  const [showAltRoutes,setShowAltRoutes]=useState(false)
  const calculate=async(a=origin,b=destination,revealAlt=false)=>{
    setShowAltRoutes(revealAlt)
    const requestId=++routeRequestRef.current
    if(!a||!b){
      setRoute([])
      setDistance(0);setDuration(0)
      setRouteStatus('Choose an origin and destination')
      setRouteError('')
      return
    }
    setGoogleStations(null)
    setStationSearch({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
    setRouteChoices([]);setSelectedRouteIndex(0)
    setRoute([])
    setDistance(0);setDuration(0)
    setRouteStatus('Calculating Google route…');setRouteError('')
    try{
      const result=await computeGoogleRoute(a,b)
      if(requestId!==routeRequestRef.current)return
      const choices=result.alternatives
      const recommendedIndex=Math.max(0,choices.findIndex(choice=>choice.label==='Recommended'))
      const selected=choices[recommendedIndex]
      setRouteChoices(choices);setSelectedRouteIndex(recommendedIndex)
      setRoute(selected.path)
      setDistance(selected.distanceMeters/1000)
      setDuration(selected.durationMillis/60000)
      setRouteStatus(`${choices.length} route${choices.length===1?'':'s'} available · Google Routes`)
      setRouteError('')
    }catch(error){
      if(requestId!==routeRequestRef.current)return
      setRoute([])
      setRouteChoices([]);setSelectedRouteIndex(0)
      setDistance(0);setDuration(0)
      setRouteStatus('Google route unavailable')
      setRouteError(`${googleMapsErrorMessage(error,'Google Routes')} No custom route or estimated distance/time was substituted.`)
    }
  }
  useEffect(()=>{
    if(savedTrip?.route?.length>1)return
    calculate(origin,destination)
  },[])
  useEffect(()=>{
    try{
      const saved={origin,destination,originName,destinationName,route,distance,duration,routeChoices,selectedRouteIndex}
      if(route.length>1||!sessionStorage.getItem('smartroute-trip'))sessionStorage.setItem('smartroute-trip',JSON.stringify(saved))
      else {
        const previous=JSON.parse(sessionStorage.getItem('smartroute-trip')||'null')
        const samePoint=(a,b)=>a&&b&&a.lat===b.lat&&a.lng===b.lng
        const sameTrip=samePoint(previous?.origin,origin)&&samePoint(previous?.destination,destination)
        sessionStorage.setItem('smartroute-trip',JSON.stringify({...saved,route:sameTrip?previous?.route||[]:[],distance:sameTrip?previous?.distance||0:0,duration:sameTrip?previous?.duration||0:0}))
      }
    }catch{}
  },[origin,destination,originName,destinationName,route,distance,duration,routeChoices,selectedRouteIndex])
  const selectRoute=index=>{
    const choice=routeChoices[index]
    if(!choice)return
    setSelectedRouteIndex(index);setRoute(choice.path)
    setDistance(choice.distanceMeters/1000);setDuration(choice.durationMillis/60000)
    setRouteStatus(`${choice.label} selected · Google Routes`)
  }
  const pickOrigin=pl=>{
    const selected={...pl,isCurrentLocation:false}
    setOriginName(pl.formattedAddress||pl.name)
    setOrigin(selected)
    calculate(selected,destination)
  }
  const pickDestination=pl=>{
    setDestinationName(pl.formattedAddress||pl.name)
    setDestination(pl)
    calculate(origin,pl)
  }
  const isMobile=()=>window.matchMedia('(max-width:1023px)').matches
  const isDrawerViewport=()=>window.matchMedia('(max-width:767px)').matches
  const togglePin=which=>{
    if(mapClickMode===which){
      setMapClickMode(null)
      if(isDrawerViewport())setMobileDrawerOpen(true)
      else if(isMobile())setShowLeft(true)
      return
    }
    setMapClickMode(which)
    if(isDrawerViewport())setMobileDrawerOpen(false)
    else if(isMobile())setShowLeft(false)
  }
  const handleMapClick=p=>{
    if(!mapClickMode)return
    const nearest=provinces.map(x=>({...x,d:kmLine(x,p)})).sort((a,b)=>a.d-b.d)[0]
    const pin={lat:p.lat,lng:p.lng,name:`Map pin near ${nearest.name}`}
    if(mapClickMode==='origin'){setOrigin(pin);setOriginName('Custom map pin');calculate(pin,destination)}
    else{setDestination(pin);setDestinationName('Custom map pin');calculate(origin,pin)}
    setMapClickMode(null)
    if(!isDrawerViewport()&&isMobile())setShowLeft(true)
  }
  const pinButton=which=><button onClick={()=>togglePin(which)} aria-label={mapClickMode===which?'Cancel pin on map':'Pin (choose on map)'} title="Pin (choose on map)" className={cx('flex w-11 shrink-0 items-center justify-center rounded-[10px] border transition',mapClickMode===which?'border-emeraldx bg-emeraldx text-ink':'border-white/10 bg-white/5 text-slate-300 hover:border-emeraldx/50 hover:text-emeraldx')}><MapPin size={18}/></button>
  const useCurrentLocation=()=>{
    if(!('geolocation' in navigator)){setLocNote('Location is not supported by this browser.');return}
    setLocating(true);setLocNote('')
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        const nearest=provinces.map(x=>({...x,d:kmLine(x,{lat,lng})})).sort((a,b)=>a.d-b.d)[0]
        const inCambodia=lat>=9.9&&lat<=14.8&&lng>=102.2&&lng<=107.8
        const pin={lat,lng,name:`Current location (near ${nearest.name})`,isCurrentLocation:true}
        setOrigin(pin);setOriginName('Current location');setMapClickMode(null)
        setLocNote(inCambodia?'':'Your location appears to be outside Cambodia. Routes and stations may not be useful.')
        setLocating(false)
        calculate(pin,destination)
      },
      err=>{
        setLocating(false)
        setLocNote(err.code===1?'Location permission denied. Allow location access in your browser settings and try again.':err.code===2?'Your location could not be determined. Try again or pick an origin manually.':'Location request timed out. Try again or pick an origin manually.')
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:60000}
    )
  }
  const recommendation=()=>{
    if(!origin||!destination)return `${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}%. Choose an origin and destination to check the route, range and suggested stops.`
    if(!hasGoogleRoute)return routeStatus==='Google route unavailable'
      ?'Google could not return a driving route. Check the Routes API configuration and try again; distance, travel time and trip cost are not estimated.'
      :'Waiting for Google Routes to return the driving route, distance and travel time.'
    if(lowRange){
      const stop=recommended[0]
      return stop?`${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}% and the destination is ${Math.round(distance-currentRange)} km beyond that. Plan a stop at ${stop.name} (${stop.road}) before reaching the estimated range limit. Confirm the connector and live availability before departure.`:`Your estimated range (${Math.round(currentRange)} km) is shorter than this ${Math.round(distance)} km trip. No compatible station pin was found close to the displayed route corridor. Add a safety stop and verify local options before leaving.`
    }
    return `${vehicleName} has an estimated ${Math.round(currentRange-distance)} km of range remaining on arrival. The current ${Math.round(distance)} km route appears achievable without a planned refuel stop, assuming the entered efficiency and normal conditions. Keep a reserve for detours.`
  }
  const chips=['Compare EV vs Gas cost','Find 24/7 stops only','Eco-driving tip']
  const chipAction=t=>{setPrompt(t);if(t==='Find 24/7 stops only')setShowStations(true)}
  const stationFinderPanel=<Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><MapPin size={16} className="text-emeraldx"/> Station finder</div><button onClick={()=>setShowStations(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showStations?'Hide list':'View stations'}</button></div>
          <div className="flex flex-wrap gap-1.5">{stationFilters.map(([id,l])=><Pill key={id} active={filter===id} onClick={()=>setFilter(id)}>{l}</Pill>)}</div>
          <button onClick={findRouteStations} disabled={stationSearch.status==='loading'||routePoints.length<2} className="mt-3 flex w-full items-center justify-center rounded-xl bg-emeraldx py-2.5 text-xs font-extrabold text-ink hover:bg-emerald-300 disabled:opacity-60">{stationSearch.status==='loading'?`Searching ${stationSearch.progress}/${stationSearch.total} route areas…`:searchLabel[filter]}</button>
          {stationSearch.status==='error'&&<div className="mt-2 rounded-lg bg-rose-400/10 p-2 text-[10px] leading-4 text-rose-200">Google Places search failed: {stationSearch.error} Check Places API (New), billing, quota, and key referrer restrictions.</div>}
    {stationSearch.status==='done'&&<div className="mt-2 text-[10px] leading-4 text-slate-400">Found {stationSearch.count} unique Google Places for “{filterLabel(searchedFilter)}” within 150 m of this route{stationSearch.failedAreas?`; ${stationSearch.failedAreas} route-area searches failed${stationSearch.error?`: ${stationSearch.error}`:''}`:''}. Results are searched along overlapping route segments, with up to 20 matches per segment.</div>}
          {stationSearch.status==='done'&&googleStations&&filter!==searchedFilter&&searchedFilter!=='all'&&searchedFilter!=='hybrid'&&<div className="mt-2 rounded-lg bg-amberx/10 p-2 text-[10px] leading-4 text-amberx">Route results were fetched for “{filterLabel(searchedFilter)}”. Press the search button to load “{filterLabel(filter)}”.</div>}
          {showStations&&<div className="mt-3 max-h-64 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{googleStations===null?alongStations.filter(s=>matchesFilter(s,filter)).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className="text-[9px] text-emeraldx">{s.road}</span></div><div className="mt-1 text-[10px] text-slate-500">{s.brand} · {s.hours} · {s.connectors.join(', ')||'Fuel'}</div></div>)
:googleStations.filter(s=>matchesFilter(s,filter)).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className={cx('text-[9px] font-bold',typeBadge[s.type]?.[1])}>{typeBadge[s.type]?.[0]}</span>{s.status==='CLOSED_PERMANENTLY'&&<span className="text-[9px] text-rose-300">Permanently closed</span>}</div><div className="mt-1 text-[10px] text-slate-400">{s.detail||'Address not provided'}</div><a className="mt-1 inline-block text-[10px] font-bold text-emeraldx hover:underline" href={s.mapsUrl} target="_blank" rel="noopener noreferrer">View on Google Maps ↗</a></div>)}</div>}
        </Panel>
  const routeOverviewPanel=<Panel className="p-4"><div className="text-xs font-extrabold">Route overview</div><div className="mt-3 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emeraldx"/><div className="text-xs font-semibold">{origin?origin.name:'Choose origin'}</div></div><div className="ml-1 my-1 h-5 border-l border-dashed border-slate-600"/><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amberx"/><div className="text-xs font-semibold">{destination?destination.name:'Choose destination'}</div></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><div><div className="text-[10px] text-slate-500">Google distance</div><b>{hasGoogleRoute?`${fmt(distance)} km`:'—'}</b></div><div><div className="text-[10px] text-slate-500">Google drive time</div><b>{hasGoogleRoute?fmtTime(duration):'—'}</b></div></div></Panel>
  const rangeMonitorPanel=<Panel className="p-4"><div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Activity size={15} className="text-emeraldx"/> Range & dead-zone monitor</div><div className="flex items-end justify-between"><span className="text-[10px] text-slate-500">Estimated remaining range</span><b className={lowRange?'text-rose-300':'text-emeraldx'}>{fmt(currentRange)} km</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={cx('h-full rounded-full',lowRange?'bg-rose-400':'bg-emeraldx')} style={{width:`${hasGoogleRoute&&currentRange>0?Math.min(100,distance/currentRange*100):0}%`}}/></div><div className="mt-2 text-[10px] leading-4 text-slate-400">{!origin||!destination?'Choose an origin and destination to check range.':!hasGoogleRoute?'Waiting for a Google driving route.':lowRange?'Range limit falls before destination.':'Estimated range covers the route.'}</div></Panel>
  const sidePanels=<>
        {stationFinderPanel}
        <div className="rounded-xl border border-white/10 bg-ink/85 p-3 text-[10px] leading-4 text-slate-400 backdrop-blur"><Info size={13} className="mb-1 text-amberx"/> Blue line, distance, and drive time come from Google Routes (traffic-aware when available). If Google cannot calculate a route, no substitute route or ETA is shown. Use “Pin (choose on map)” to set a custom waypoint.</div></>
  return <div ref={plannerScreenRef} className="planner-screen relative h-[100dvh] min-h-[480px] w-full overflow-hidden bg-slate-950 text-white lg:min-h-[720px]">
    <div className={cx('planner-map-layer absolute inset-0',mapClickMode&&'pick-mode')}><MapView origin={origin} destination={destination} route={routePoints} stations={googleStations??[]} filter={filter} onMapClick={handleMapClick} rangePoint={rangePoint} initialLocation={initialLocation} mapType={mapType} onMapTypeChange={setMapType}/></div>
    <BrandHeader theme={theme} onToggleTheme={onToggleTheme} onHome={onHome} className="planner-header" action={<button onClick={onChangeVehicle} aria-label="Back to vehicle profile" className="header-action"><ArrowLeft size={16}/><span>Vehicle</span></button>} rightAction={<>
      <button type="button" onClick={()=>setMapType(current=>current==='roadmap'?'hybrid':'roadmap')} aria-label={mapType==='roadmap'?'Switch to satellite map':'Switch to street map'} title={mapType==='roadmap'?'Satellite view':'Street view'} className="header-action desktop-map-layer-control"><Layers size={16}/><span>{mapType==='roadmap'?'Satellite':'Map'}</span></button>
      <button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide menu and show map':'Show menu'} className="mobile-plan-toggle"><span className="mobile-plan-label">{showLeft?'Map':'Plan'}</span>{showLeft?<MapIcon size={16}/>:<Route size={16}/>}</button>
    </>}/>
    <header className="mobile-map-header" aria-label="Route map controls">
      <button type="button" onClick={onChangeVehicle} aria-label="Back" className="mobile-map-control mobile-map-back"><ArrowLeft size={18}/><span>Back</span></button>
      <button type="button" onClick={onHome} className="mobile-map-brand" aria-label="Return to SmartRoute AI home"><img src="/favicon.svg" alt=""/><span>SmartRoute <b>AI</b></span></button>
      <button type="button" onClick={()=>setMapType(current=>current==='roadmap'?'hybrid':'roadmap')} aria-label={mapType==='roadmap'?'Switch to satellite map':'Switch to street map'} title={mapType==='roadmap'?'Satellite view':'Street view'} className="mobile-map-control mobile-map-layer"><Layers size={17}/><span>{mapType==='roadmap'?'Layers':'Map'}</span></button>
      <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme==='light'?'dark':'light'} mode`} aria-pressed={theme==='dark'} className="mobile-map-control mobile-map-theme">{theme==='light'?<Moon size={16}/>:<Sun size={16}/>}<span>{theme==='light'?'Dark':'Light'}</span></button>
    </header>
    <div data-drawer-open={mobileDrawerOpen} className="planner-controls-layer absolute bottom-1 left-1 right-1 top-[76px] z-[500] flex items-end justify-between gap-4 pointer-events-none lg:items-start">
      <button type="button" className="mobile-route-scrim" tabIndex={mobileDrawerOpen?0:-1} aria-hidden={!mobileDrawerOpen} aria-label="Close route planner drawer" onClick={()=>setMobileDrawerOpen(false)}/>
      <div id="mobile-route-drawer" data-open={mobileDrawerOpen} className={cx('planner-mobile-panel pointer-events-auto max-h-full w-full overflow-y-auto lg:max-w-[390px] [direction:rtl] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',!showLeft&&'left-panel-hidden')}>
        <div className="planner-mobile-drawer-header">
          <div className="planner-mobile-sheet-topline">
            <button type="button" onClick={onChangeVehicle} aria-label="Back to vehicle profile" className="mobile-map-control mobile-map-back mobile-drawer-back"><ArrowLeft size={17}/></button>
            <div className="planner-mobile-sheet-title"><span>Route planner</span><span className="planner-mobile-route-state">{hasGoogleRoute?`${fmt(distance)} km · ${fmtTime(duration)}`:routeStatus==='Choose an origin and destination'?'Set your route':routeStatus}</span></div>
          </div>
          <div className="planner-mobile-summary">
            <div className="planner-mobile-route-summary" title={`${origin?.name||'Choose origin'} to ${destination?.name||'Choose destination'}`}><span>{origin?.name||'Choose origin'}</span><ArrowRight size={13}/><span>{destination?.name||'Choose destination'}</span></div>
            <div className="planner-mobile-vehicle-summary"><span>{vehicleName}</span><span>· Level {config.level}%</span></div>
          </div>
        </div>
        <div className="planner-mobile-content flex flex-col gap-3 [direction:ltr]">
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="text-sm font-extrabold">Plan your journey</div><span className="rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold uppercase text-emeraldx">Step 03 / Route</span></div>
          <GoogleTextPlaceSearch label="Origin" value={originName} placeholder="Search a place in Cambodia" onPick={pickOrigin} action={pinButton('origin')}/>
          <button onClick={useCurrentLocation} disabled={locating} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emeraldx/30 bg-emeraldx/5 py-2.5 text-xs font-bold text-emeraldx transition hover:bg-emeraldx/10 disabled:opacity-60"><LocateFixed size={15} className={locating?'animate-pulse':''}/>{locating?'Locating…':'Use current location'}</button>
          {locNote&&<div className="mt-2 text-[10px] leading-4 text-slate-400">{locNote}</div>}

          <div className="mt-4"><GoogleTextPlaceSearch label="Destination" value={destinationName} placeholder="Search a place in Cambodia" onPick={pickDestination} action={pinButton('destination')}/></div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-3"><div><div className="text-[10px] uppercase text-slate-500">Vehicle</div><div className="mt-1 text-xs font-bold">{vehicleName}</div></div><div className="text-right"><div className="text-[10px] uppercase text-slate-500">Current level</div><div className="mt-1 text-sm font-black text-emeraldx">{config.level}%</div></div></div>
          <button onClick={()=>{calculate(origin,destination,true);setMobileDrawerOpen(false)}} disabled={!origin||!destination} className="disabled:opacity-40 mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-3 text-xs font-extrabold text-ink hover:bg-emerald-300"><Navigation size={15}/> Find alternative routes</button>
          <div className="mt-2 text-center text-[10px] text-slate-500">{routeStatus}</div>
          {showAltRoutes&&routeChoices.length>1&&<div className="mt-3 space-y-2" aria-label="Available routes">{routeChoices.map((choice,index)=><button type="button" key={`${choice.label}-${index}`} onClick={()=>selectRoute(index)} aria-pressed={selectedRouteIndex===index} className={cx('flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs transition',selectedRouteIndex===index?'border-emeraldx/50 bg-emeraldx/10':'border-white/10 bg-black/20 hover:border-white/20')}><span><b className={selectedRouteIndex===index?'text-emeraldx':'text-slate-200'}>{choice.label}</b><span className="mt-1 block text-[10px] text-slate-500">{fmt(choice.distanceMeters/1000)} km · {fmtTime(choice.durationMillis/60000)}</span></span>{selectedRouteIndex===index&&<Check size={15} className="text-emeraldx"/>}</button>)}</div>}
        </Panel>
        {routeOverviewPanel}
        {rangeMonitorPanel}
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><CircleDollarSign size={16} className="text-amberx"/> Trip cost estimate</div><button onClick={()=>setShowRates(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showRates?'Close':'Edit rates'}</button></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Google distance</div><div className="mt-1 text-lg font-black">{hasGoogleRoute?fmt(distance):'—'} <small className="text-xs text-slate-400">{hasGoogleRoute?'km':''}</small></div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Google drive time</div><div className="mt-1 text-lg font-black">{hasGoogleRoute?fmtTime(duration):'—'}</div></div></div>
          {(isEV||isHybrid)&&<label className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">Charging type<select className="field w-48 py-2" value={chargingMode} onChange={e=>setChargingMode(e.target.value)}><option value="ac">AC charging · {fmt(rates.ac)} ៛/kWh</option><option value="dc-fast">DC fast ≤250 kW · {fmt(rates.ev)} ៛/kWh</option><option value="dc-superfast">DC super-fast &gt;250 kW · {fmt(rates.evSuperFast)} ៛/kWh</option></select></label>}
          {isHybrid?<><div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Fuel-only estimate</span><span>L</span></div><div className="mt-1 text-xl font-black">{hasGoogleRoute?hybridFuelNeed.toFixed(1):'—'} <small className="text-xs font-medium text-slate-400">{hasGoogleRoute?'L':''}</small></div><div className="mt-1 text-[10px] text-slate-500">{isPHEV?'Vehicle rate':'Comparison'}: {fuelOnlyConsumption} L/100 km</div></div><div className="rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Electric-only estimate</span><span>kWh</span></div><div className="mt-1 text-xl font-black">{hasGoogleRoute?hybridElectricNeed.toFixed(1):'—'} <small className="text-xs font-medium text-slate-400">{hasGoogleRoute?'kWh':''}</small></div><div className="mt-1 text-[10px] text-slate-500">{isPHEV?'Vehicle rate':'Comparison'}: {electricOnlyConsumption} kWh/100 km</div></div></div>{isPHEV&&hasGoogleRoute&&distance>vehicle.range&&<div className="mt-2 rounded-lg border border-amberx/20 bg-amberx/10 p-2 text-[10px] leading-4 text-amberx">Trip exceeds this PHEV’s listed {fmt(vehicle.range)} km EV range by {fmt(distance-vehicle.range)} km. The electric-only estimate assumes the vehicle can be charged during the trip.</div>}</>:<div className="mt-2 rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Estimated {isEV?'energy':'fuel'} required</span><span>{isEV?'kWh':'L'}</span></div><div className="mt-1 text-xl font-black">{hasGoogleRoute?need.toFixed(1):'—'} <small className="text-xs font-medium text-slate-400">{hasGoogleRoute?(isEV?'kWh':'L'):''}</small></div></div>}
          {isHybrid?<div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div className="text-[10px] text-amberx/80">Estimated fuel-only trip cost</div><div className="mt-1 text-xl font-black">{hasGoogleRoute?money(hybridFuelCost,rates.usdToKhr).split(' · ')[0]:'—'}</div><div className="text-xs text-slate-400">{hasGoogleRoute?money(hybridFuelCost,rates.usdToKhr).split(' · ')[1]:''}</div><div className="mt-1 text-[10px] text-slate-500">Gasoline · {fmt(rates.gasoline)} ៛/L</div></div><div className="rounded-xl border border-blue-300/20 bg-blue-300/5 p-3"><div className="text-[10px] text-blue-200/80">Estimated electric-only trip cost</div><div className="mt-1 text-xl font-black">{hasGoogleRoute?money(hybridElectricCost,rates.usdToKhr).split(' · ')[0]:'—'}</div><div className="text-xs text-slate-400">{hasGoogleRoute?money(hybridElectricCost,rates.usdToKhr).split(' · ')[1]:''}</div><div className="mt-1 text-[10px] text-slate-500">{chargingModeLabel} · {fmt(hybridElectricRate)} ៛/kWh</div></div></div>:<div className="mt-2 flex items-end justify-between rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div><div className="text-[10px] text-amberx/80">Estimated trip cost</div><div className="mt-1 text-xl font-black">{hasGoogleRoute?money(totalCost,rates.usdToKhr).split(' · ')[0]:'—'}</div><div className="text-xs text-slate-400">{hasGoogleRoute?money(totalCost,rates.usdToKhr).split(' · ')[1]:''}</div></div><div className="text-right text-[10px] text-slate-500">{isEV?chargingModeLabel:config.energy==='diesel'?'Diesel tariff':'Gasoline tariff'}<br/>{fmt(costRate)} ៛ / {isEV?'kWh':'L'}</div></div>}
          <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">EV vs gasoline benchmark</span><span className="font-bold text-emeraldx">{hasGoogleRoute?<>{evCost<=gasCost?'EV saves':'Gas saves'} {money(save,rates.usdToKhr)}</>:'Google route required'}</span></div>
          {showRates&&<div className="mt-4 space-y-3 border-t border-white/10 pt-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable reference tariffs (KHR)</div>{[['gasoline','Regular gasoline / L'],['diesel','Diesel / L'],['ac','AC charging / kWh'],['ev','DC fast charging ≤250 kW / kWh'],['evSuperFast','DC super-fast charging >250 kW / kWh'],['usdToKhr','USD → KHR']].map(([k,l])=><label key={k} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">{l}<input className="field w-28 py-2 text-right" type="number" value={rates[k]} onChange={e=>setRates(p=>({...p,[k]:Number(e.target.value)}))}/></label>)}<div className="text-[9px] leading-4 text-slate-500">{fuelPriceSource.status==='loading'?'Loading the latest Cambodia fuel prices…':fuelPriceSource.status==='live'?<>Gasoline and diesel loaded from the MEF dataset for {fuelPriceSource.startDate}{fuelPriceSource.endDate?` to ${fuelPriceSource.endDate}`:''}. {fuelPriceSource.sourceUrl&&<a className="text-emeraldx underline" href={fuelPriceSource.sourceUrl} target="_blank" rel="noreferrer">Official price notice</a>}</>:'Could not load MEF fuel prices; showing the built-in reference rates.'} <a className="text-emeraldx underline" href={fuelPricesApiUrl} target="_blank" rel="noreferrer">Dataset API</a>. {exchangeRateSource.status==='live'?<>USD→KHR average from NBC, dated {exchangeRateSource.validDate}.</>:exchangeRateSource.status==='loading'?'Loading the latest NBC exchange rate.':'Could not load the NBC exchange rate; showing the built-in reference rate.'} <a className="text-emeraldx underline" href={exchangeRateApiUrl} target="_blank" rel="noreferrer">NBC real-time API</a>. Charging prices are editable; the selected charging type is used in EV and hybrid electric cost estimates.</div></div>}
        </Panel>

      <div className="flex flex-col gap-3 lg:hidden">{sidePanels}</div></div>
        <button type="button" className="mobile-route-drawer-tab" aria-controls="mobile-route-drawer" aria-expanded={mobileDrawerOpen} aria-label={mobileDrawerOpen?'Hide route planner':'Show route planner'} onClick={()=>setMobileDrawerOpen(value=>!value)}>
          {mobileDrawerOpen?<ChevronLeft size={20}/>:<ChevronRight size={20}/>}
        </button>
      </div>
      <div className={cx('pointer-events-auto ml-auto hidden max-h-full w-[290px] flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',showRight&&'lg:flex')}>{sidePanels}
      </div>
    </div>
    <button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide left menu':'Show left menu'} title={showLeft?'Hide menu':'Show menu'} style={{left:showLeft?'min(404px, calc(100vw - 44px))':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showLeft?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}</button>
    <button onClick={()=>setShowRight(x=>!x)} aria-label={showRight?'Hide right menu':'Show right menu'} title={showRight?'Hide menu':'Show menu'} style={{right:showRight?'304px':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showRight?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button>
    {mapClickMode&&<div className="mobile-map-notice absolute left-1/2 top-[76px] z-[600] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-xl border border-emeraldx/40 bg-ink/95 px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur"><MapPin size={15} className="text-emeraldx"/>Tap the map to set {mapClickMode}<button onClick={()=>togglePin(mapClickMode)} className="text-slate-400 hover:text-white">Cancel</button></div>}
    {routeError&&<div role="status" className="mobile-map-notice absolute left-2 right-2 top-[76px] z-[600] max-w-xs lg:left-auto lg:bottom-4 lg:right-[68px] lg:top-auto rounded-xl border border-amberx/30 bg-ink/95 p-3 text-[10px] leading-4 text-amberx shadow-xl">{routeError}</div>}
  </div>
}
const paths=['/','/vehicle','/location','/route']
const defaultVehicleConfig={category:'',model:'',modified:false,energy:'',capacity:'',consumption:'',level:100,customName:''}
const stepFromPath=()=>{
  const clean=window.location.pathname.replace(/\/+$/,'')||'/'
  const i=paths.indexOf(clean)
  return i===-1?0:i
}
export default function App(){
  const [step,setStepState]=useState(stepFromPath)
  const [theme,setTheme]=useState(()=>document.documentElement.dataset.theme||'light')
  const toggleTheme=()=>{
    const next=theme==='light'?'dark':'light'
    document.documentElement.dataset.theme=next
    document.documentElement.style.colorScheme=next
    try{localStorage.setItem('smartroute-theme',next)}catch{}
    setTheme(next)
  }
  useEffect(()=>{document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#1D2429':'#F4F6F4')},[theme])
  const [config,setConfig]=useState(defaultVehicleConfig)
  const [tripConfig,setTripConfig]=useState(()=>{
    try{return JSON.parse(sessionStorage.getItem('smartroute-vehicle-config')||'null')||defaultVehicleConfig}catch{return defaultVehicleConfig}
  })
  // Coordinates are deliberately session-only: a stored fix must never bypass
  // the mandatory permission gate on a fresh visit to the map.
  const [initialLocation,setInitialLocation]=useState(null)
  const hasTripConfig=tripConfig.capacity>0&&tripConfig.consumption>0
  const [gateBackStep,setGateBackStep]=useState(0)
  const locationCheckRef=useRef(false)
  const clearTripLocations=()=>{
    try{sessionStorage.removeItem('smartroute-trip')}catch{}
  }
  const setStep=next=>{
    const target=paths[next]
    if(step===3&&next!==3)clearTripLocations()
    if(step===1&&next!==1){
      setTripConfig(config)
      setConfig(defaultVehicleConfig)
    }
    if(window.location.pathname!==target)window.history.pushState({step:next},'',target)
    setStepState(next)
    window.scrollTo(0,0)
  }
  useEffect(()=>{
    // Normalize unknown paths (e.g. /foo) back to the root URL
    const known=paths.includes(window.location.pathname.replace(/\/+$/,'')||'/')
    if(!known)window.history.replaceState({step:0},'','/')
    const onPop=()=>{
      const next=stepFromPath()
      if(step===3&&next!==3)clearTripLocations()
      if(step===1&&next!==1){setTripConfig(config);setConfig(defaultVehicleConfig)}
      setStepState(next)
    }
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[step,config])
  useEffect(()=>{
    if(step!==3||initialLocation)return
    if(!hasTripConfig){
      if(window.location.pathname!=='/vehicle')window.history.replaceState({step:1},'','/vehicle')
      setStepState(1)
    }
  },[step,initialLocation,hasTripConfig])
  useEffect(()=>{
    try{sessionStorage.setItem('smartroute-vehicle-config',JSON.stringify(tripConfig))}catch{}
  },[tripConfig])
  useEffect(()=>{
    if(step!==3||initialLocation||locationCheckRef.current)return
    locationCheckRef.current=true
    let active=true
    const showLocationGate=()=>{
      if(!active)return
      locationCheckRef.current=false
      setGateBackStep(1)
      if(window.location.pathname!=='/location')window.history.replaceState({step:2},'','/location')
      setStepState(2)
    }
    const getLocation=()=>{
      if(!navigator.geolocation){showLocationGate();return}
      navigator.geolocation.getCurrentPosition(position=>{
        if(!active)return
        const {latitude:lat,longitude:lng,accuracy}=position.coords||{}
        if(Number.isFinite(lat)&&Number.isFinite(lng))setInitialLocation({lat,lng,accuracy:Number.isFinite(accuracy)?Math.max(0,accuracy):0})
      },error=>{
        if(error?.code===1)showLocationGate()
      },{enableHighAccuracy:true,timeout:20000,maximumAge:60000})
    }
    if(!navigator.permissions?.query){showLocationGate()}
    else navigator.permissions.query({name:'geolocation'}).then(permission=>{
      if(!active)return
      if(permission.state==='granted')getLocation()
      else showLocationGate()
    }).catch(showLocationGate)
    return()=>{active=false;locationCheckRef.current=false}
  },[step,initialLocation])
  useEffect(()=>{
    const titles=['SmartRoute AI — Cambodia Trip Planner','Vehicle profile · SmartRoute AI','Location access · SmartRoute AI','Map & Route · SmartRoute AI']
    const visibleStep=step
    document.title=titles[visibleStep]||titles[0]
  },[step,initialLocation])

  const goToMap=(backStep=1)=>{
    // Every route entry gets a fresh fix; previously acquired coordinates are
    // not an alternate path around the required location step.
    setGateBackStep(backStep)
    setStep(2)
  }
  const startSmartRoute=()=>{
    setInitialLocation(null)
    setTripConfig(defaultVehicleConfig)
    try{sessionStorage.removeItem('smartroute-vehicle-config')}catch{}
    setGateBackStep(0)
    setStep(1)
  }
  const continueToMap=()=>{
    setStep(3)
  }
  const finishLocation=location=>{
    setInitialLocation(location)
    // Continue with the vehicle profile captured when leaving setup.
    // The exact fix is handed to TripPlanner/MapView for the blue dot and center.
    setStep(hasTripConfig?3:1)
  }
  const visibleStep=step
  useEffect(()=>{
    const routeMode=visibleStep===3
    const routeRoots=[document.documentElement,document.body,document.getElementById('root')]
      .filter(Boolean)
    routeRoots.forEach(element=>element.classList.toggle('route-fullscreen',routeMode))
  },[visibleStep])
  return visibleStep===0
    ?<Welcome onStart={startSmartRoute} onRoute={()=>goToMap(0)} theme={theme} onToggleTheme={toggleTheme}/>
    :visibleStep===1
      ?<Setup onBack={()=>setStep(0)} onGenerate={continueToMap} config={config} setConfig={setConfig} theme={theme} onToggleTheme={toggleTheme}/>
      :visibleStep===2
        ?<LocationGate onSuccess={finishLocation} onBack={()=>setStep(gateBackStep)} theme={theme} onToggleTheme={toggleTheme}/>
        :<TripPlanner config={tripConfig} initialLocation={initialLocation} onChangeVehicle={()=>setStep(1)} onHome={()=>window.location.assign('/')} theme={theme} onToggleTheme={toggleTheme}/>
}
