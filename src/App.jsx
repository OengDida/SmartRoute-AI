import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, BatteryCharging, Bike, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Fuel, Gauge, Github, Info, LocateFixed, Leaf, Map as MapIcon, MapPin, Navigation, PlugZap, Route, Search, ShieldAlert, Sparkles, Truck, Zap } from 'lucide-react'
import MapView from './components/MapView'
import { searchGasStationsAlongRoute, searchGooglePlaces } from './googleMaps'
import { vehicleGroups } from './data/vehicles'
import { provinces, stations } from './data/places'
import { defaultRates } from './data/rates'
import { fmt, haversine, money, nearestOnRoute } from './utils'

const cx=(...x)=>x.filter(Boolean).join(' ')
// OSRM returns car-profile times with no traffic; scale by vehicle type for realistic estimates
const timeFactor={ev:1.15,hybrid:1.15,gasoline:1.15,diesel:1.25,motorbike:1.4}
const fmtTime=m=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`
const categoryIcons={ev:Zap,hybrid:Leaf,gasoline:CarFront,diesel:Truck,motorbike:Bike}
const kmLine=(a,b)=>haversine(a,b)
function Panel({children,className=''}){return <div className={cx('glass rounded-2xl border border-white/10 shadow-2xl',className)}>{children}</div>}
function Pill({children,active,onClick}){return <button onClick={onClick} className={cx('rounded-full px-3 py-2 text-xs font-semibold transition',active?'bg-emeraldx text-ink':'bg-white/5 text-slate-300 hover:bg-white/10')}>{children}</button>}
function Field({label,children}){return <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>}
function Select({value,onChange,children}){return <div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="field w-full appearance-none pr-9">{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-400"/></div>}
function PlaceSearch({label,value,placeholder,onPick,action}){
  const [q,setQ]=useState('')
  const [open,setOpen]=useState(false)
  const [found,setFound]=useState([])
  const [status,setStatus]=useState('idle')
  const [searchError,setSearchError]=useState('')
  const [searched,setSearched]=useState('')
  const term=q.trim()
  const search=async()=>{
    if(term.length<2||status==='loading')return
    setStatus('loading')
    try{
      const data=await searchGooglePlaces(term)
      setFound(data)
      setSearchError('')
      setSearched(term);setStatus('done')
    }catch(error){setSearchError(error?.message||'Google Places request failed.');setStatus('error')}
  }
  const pick=p=>{onPick(p);setOpen(false);setQ('');setFound([]);setSearched('');setStatus('idle')}
  const showFound=status==='done'&&searched===term
  const item='block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5'
  return <div className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex gap-2"><div className="relative min-w-0 flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/><input className="field w-full !pl-9" value={open?q:value} placeholder={open&&value?value:placeholder} onFocus={()=>{setOpen(true);setQ('')}} onBlur={()=>setOpen(false)} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search()}else if(e.key==='Escape')e.target.blur()}} autoComplete="off"/></div>{action}</div>
    {open&&<div onMouseDown={e=>e.preventDefault()} className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {term.length>=2&&!showFound&&<button onClick={search} disabled={status==='loading'} className={cx(item,'font-bold text-emeraldx')}>{status==='loading'?'Searching…':`Search all places for “${term}”`}</button>}
      {showFound&&found.length>0&&<div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Google Maps places in Cambodia</div>}
      {showFound&&found.map((f,i)=><button key={i} onClick={()=>pick(f)} className={item}><div className="font-semibold">{f.name}</div><div className="mt-0.5 truncate text-[10px] text-slate-500">{f.detail}</div></button>)}
      {showFound&&!found.length&&<div className="px-3 py-3 text-[11px] text-slate-400">No places found. Try a different spelling or a nearby town.</div>}
      {status==='error'&&<div className="px-3 py-3 text-[11px] leading-5 text-rose-300">Google Places search failed: {searchError} Check that Places API (New) is enabled for this key and that the key allows this website referrer.</div>}
      {term.length<2&&<div className="px-3 py-2 text-[10px] text-slate-500">Search Google Maps for a town, business, road, hotel or landmark.</div>}
    </div>}
  </div>
}
const repo='https://github.com/OengDida/SmartRoute-AI'
function FooterCol({title,children}){return <div><div className="mb-2 text-sm font-bold text-white">{title}</div><ul className="space-y-0.5">{children}</ul></div>}
function FLink({href,onClick,external,children}){return <li><a href={href} onClick={onClick?e=>{e.preventDefault();onClick()}:undefined} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} className="text-sm leading-6 text-slate-400 transition hover:text-emeraldx">{children}</a></li>}
function FText({children}){return <li className="text-sm leading-6 text-slate-500">{children}</li>}
function Welcome({onStart,onRoute}){return <main className="welcome min-h-screen overflow-hidden px-5 text-white">
  <div className="absolute inset-0 bg-grid opacity-30"/>
  <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col">
    <header className="flex items-center gap-3 py-7"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-11 w-11 object-contain [filter:drop-shadow(0_0_12px_rgba(32,214,154,0.35))]"/><div><div className="text-xl font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[10px] uppercase tracking-[.24em] text-slate-500">Cambodia mobility intelligence</div></div></header>
    <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr]">
      <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emeraldx/25 bg-emeraldx/10 px-4 py-2 text-xs font-semibold text-emeraldx"><Sparkles size={14}/> Built for Cambodia's highways</div>
        <h1 className="text-5xl font-black leading-[1.06] tracking-tight sm:text-7xl">Every kilometer.<br/><span className="text-emeraldx">Smarter.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">AI-Powered Multi-Fuel Highway & Range Planner for Cambodia. Prevent dead-zones, find EV chargers & gas pumps, and optimize trip costs in KHR & USD.</p>
        <div className="mt-9 flex flex-wrap gap-3"><button onClick={onStart} className="flex items-center gap-3 rounded-xl bg-emeraldx px-6 py-4 font-extrabold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-emerald-300">Launch SmartRoute AI <ArrowRight size={18}/></button><div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400"><ShieldAlert size={16} className="text-amberx"/> Plan ahead. Arrive prepared.</div></div>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6"><div><div className="text-2xl font-black">25+</div><div className="text-xs text-slate-500">Station pins</div></div><div><div className="text-2xl font-black">5</div><div className="text-xs text-slate-500">Powertrains</div></div><div><div className="text-2xl font-black">៛ / $</div><div className="text-xs text-slate-500">Dual currency</div></div></div>
      </div>
      <div className="relative hidden lg:block"><div className="absolute -inset-10 rounded-full bg-emeraldx/10 blur-3xl"/><div className="relative rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold">Live route preview</span><span className="rounded-full bg-emeraldx/10 px-3 py-1 text-[10px] font-bold text-emeraldx">CAMBODIA</span></div>
        <div className="map-art relative h-[390px] overflow-hidden rounded-2xl border border-white/10"><svg viewBox="0 0 500 390" className="h-full w-full"><path d="M40 70 C130 120 110 170 180 195 S260 235 270 315 S370 340 440 280" fill="none" stroke="#20d69a" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round"/><path d="M15 290 C120 245 160 280 220 210 S350 120 480 145" fill="none" stroke="#334d46" strokeWidth="2"/><path d="M60 40 L440 350 M30 200 L470 60 M120 0 L390 390" stroke="#203a32" strokeWidth="1"/><circle cx="40" cy="70" r="10" fill="#20d69a"/><circle cx="440" cy="280" r="10" fill="#f7b84b"/><circle cx="260" cy="230" r="7" fill="#53b7ff"/><circle cx="270" cy="315" r="7" fill="#b69cff"/></svg><div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Phnom Penh</div><div className="text-slate-400">Origin</div></div><div className="absolute bottom-5 right-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Siem Reap</div><div className="text-slate-400">Destination</div></div><div className="absolute bottom-5 left-5 rounded-xl bg-blue-400/15 px-3 py-2 text-xs text-blue-200">⚡ Charging stop</div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/5 p-3"><Route size={16} className="mx-auto mb-2 text-emeraldx"/><b className="text-sm">Route</b><p className="text-[10px] text-slate-500">OSRM powered</p></div><div className="rounded-xl bg-white/5 p-3"><BatteryCharging size={16} className="mx-auto mb-2 text-blue-300"/><b className="text-sm">Range</b><p className="text-[10px] text-slate-500">Dead-zone alerts</p></div><div className="rounded-xl bg-white/5 p-3"><CircleDollarSign size={16} className="mx-auto mb-2 text-amberx"/><b className="text-sm">Cost</b><p className="text-[10px] text-slate-500">KHR + USD</p></div></div>
      </div></div>
    </section>
    <footer className="border-t border-white/10 pt-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div><div className="flex items-center gap-3"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-9 w-9 object-contain"/><div className="text-lg font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div></div><p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">Highway range and trip-cost planning for Cambodia. Plan ahead. Arrive prepared.</p><div className="mt-6 flex gap-3"><a href={repo} target="_blank" rel="noopener noreferrer" aria-label="SmartRoute AI on GitHub" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-emeraldx/50 hover:text-emeraldx"><Github size={18}/></a></div></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <FooterCol title="Planner"><FLink href="/vehicle" onClick={onStart}>Launch SmartRoute AI</FLink><FLink href="/vehicle" onClick={onStart}>Vehicle profile</FLink><FLink href="/route" onClick={onRoute}>Map &amp; route</FLink></FooterCol>
          <FooterCol title="Powertrains"><FText>Electric</FText><FText>Hybrid</FText><FText>Gasoline</FText><FText>Diesel</FText><FText>Motorbike</FText></FooterCol>
          <FooterCol title="Data &amp; maps"><FLink href="https://developers.google.com/maps/documentation/javascript" external>Google Maps &amp; Places</FLink><FLink href="https://project-osrm.org" external>OSRM routing</FLink><FLink href={repo+'/blob/main/src/data/places.js'} external>Station data</FLink></FooterCol>
          <FooterCol title="Project"><FLink href={repo} external>GitHub</FLink><FLink href={repo+'/issues'} external>Report an issue</FLink><FLink href="/sitemap.xml" external>Sitemap</FLink></FooterCol>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 py-6 text-[11px] leading-5 text-slate-500"><span>© 2026 SmartRoute AI · Cambodia trip intelligence</span><span className="max-w-xl sm:text-right">Estimates only. Station data is a curated dataset, not a live directory. Verify fuel and charger availability before you travel.</span></div>
    </footer>
  </div>
</main>}
function Setup({onBack,onGenerate,config,setConfig}) {
  const group=vehicleGroups.find(g=>g.id===config.category)
  const selected=group?.items.find(v=>v.id===config.model)
  const set=(key,value)=>setConfig(p=>({...p,[key]:value}))
  useEffect(()=>{if(!config.modified&&selected)setConfig(p=>({...p,energy:selected.energy,capacity:selected.capacity,consumption:selected.consumption,model:selected.id}))},[config.category,config.model,config.modified])
  const Icon=categoryIcons[config.category]||CarFront
  return <div className="min-h-screen bg-ink px-4 py-6 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <button onClick={onBack} className="mb-7 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back</button>
    <div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emeraldx">Step 02 / Vehicle profile</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">What are you driving?</h1><p className="mt-2 text-slate-400">We'll use your vehicle's real-world efficiency to estimate range and trip costs.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5 sm:p-7"><h2 className="mb-4 font-bold">2A. Select powertrain</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{vehicleGroups.map(g=>{const I=categoryIcons[g.id];return <button key={g.id} onClick={()=>setConfig(p=>({...p,category:g.id,model:'',energy:g.items[0].energy,...(p.modified?{}:{capacity:'',consumption:''})}))} className={cx('rounded-xl border p-4 text-left transition',config.category===g.id?'border-emeraldx bg-emeraldx/10 shadow-glow':'border-white/10 bg-white/[.025] hover:bg-white/5')}><I size={22} className={config.category===g.id?'text-emeraldx':'text-slate-400'}/><div className="mt-3 text-sm font-bold">{g.label}</div><div className="mt-1 text-[11px] text-slate-500">{g.items.length} presets</div></button>})}</div>
      <div className="my-7 border-t border-white/10"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">2B. Vehicle configuration</h2><div className="flex rounded-xl bg-black/20 p-1"><button onClick={()=>setConfig(p=>({...p,modified:false,...(p.model?{}:{capacity:'',consumption:''})}))} className={cx('rounded-lg px-4 py-2 text-xs font-bold',!config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Stock</button><button onClick={()=>set('modified',true)} className={cx('rounded-lg px-4 py-2 text-xs font-bold',config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Modified</button></div></div>
      {!config.modified?<div className="mt-5 space-y-4">{!group?<p className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-400">Select a powertrain above, then choose your vehicle.</p>:<Field label="Choose your vehicle"><Select value={config.model} onChange={v=>{const item=group.items.find(x=>x.id===v);setConfig(p=>({...p,model:v,energy:item.energy,capacity:item.capacity,consumption:item.consumption}))}}><option value="" disabled>Choose your vehicle</option>{group.items.map(v=><option value={v.id} key={v.id}>{v.name} — {v.note}</option>)}</Select></Field>}{selected&&<div className="rounded-xl border border-emeraldx/15 bg-emeraldx/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emeraldx"><Icon size={17}/>{selected?.name}</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[10px] uppercase text-slate-500">Capacity</div><b>{config.capacity} {config.energy==='electric'?'kWh':'L'}</b></div><div><div className="text-[10px] uppercase text-slate-500">Consumption</div><b>{config.consumption} {config.energy==='electric'?'kWh':'L'}/100km</b></div></div></div>}</div>
      :<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Fuel / energy type"><Select value={config.energy} onChange={v=>set('energy',v)}><option value="" disabled>Choose type</option><option value="gasoline">Regular gasoline 92</option><option value="diesel">Diesel</option><option value="electric">Electric (kWh)</option></Select></Field><Field label={`Consumption (${config.energy==='electric'?'kWh':'L'}/100km)`}><input className="field w-full" type="number" min="0.1" step=".1" value={config.consumption} onChange={e=>set('consumption',e.target.value===''?'':Number(e.target.value))}/></Field><Field label={`Tank / battery capacity (${config.energy==='electric'?'kWh':'L'})`}><input className="field w-full" type="number" min="1" step=".1" value={config.capacity} onChange={e=>set('capacity',e.target.value===''?'':Number(e.target.value))}/></Field><Field label="Custom vehicle name"><input className="field w-full" value={config.customName} onChange={e=>set('customName',e.target.value)} placeholder="e.g. My modified pickup"/></Field></div>}
      <div className="mt-7 rounded-xl bg-black/20 p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold">Current {config.energy==='electric'?'battery':config.energy?'fuel':'battery / fuel'} level</label><span className="text-xl font-black text-emeraldx">{config.level}%</span></div><input type="range" min="5" max="100" step="1" value={config.level} onChange={e=>set('level',Number(e.target.value))} className="mt-4 w-full accent-emerald-400"/><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Nearly empty</span><span>Full tank</span></div></div>
      <button onClick={onGenerate} disabled={!config.capacity||!config.consumption||config.capacity<=0||config.consumption<=0||(!config.modified&&!config.model)||(config.modified&&!config.energy)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-4 font-extrabold text-ink transition hover:bg-emerald-300 disabled:opacity-40">Generate Map & Route <ArrowRight size={18}/></button>
      </Panel>
      <div className="space-y-4"><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-emeraldx"><Gauge size={18}/><b>Range snapshot</b></div><div className="text-4xl font-black">{config.capacity>0&&config.consumption>0?Math.round(config.capacity*config.level/100/(config.consumption/100)):'—'}<span className="ml-1 text-base font-semibold text-slate-400">km</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Estimated remaining range at {config.level}% based on the entered consumption rate. Actual range varies with speed, load, terrain and weather.</p></Panel><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-amberx"><Info size={18}/><b>Before you hit the road</b></div><ul className="space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Verify your actual fuel or battery capacity.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Keep a safety buffer for traffic and detours.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Check station status before relying on a charger.</li></ul></Panel><div className="rounded-xl border border-white/10 p-4 text-xs leading-5 text-slate-500">Demo defaults are estimates, not certified manufacturer test figures. You can customize your consumption and rates later.</div></div>
    </div></div></div>
}
function TripPlanner({config,onChangeVehicle}) {
  const [originName,setOriginName]=useState('')
  const [destinationName,setDestinationName]=useState('')
  const [origin,setOrigin]=useState(null)
  const [destination,setDestination]=useState(null)
  const [route,setRoute]=useState([])
  const [distance,setDistance]=useState(0)
  const [baseDuration,setDuration]=useState(0)
  const [routeStatus,setRouteStatus]=useState('Choose an origin and destination')
  const [filter,setFilter]=useState('all')
  const [rates,setRates]=useState(defaultRates)
  const [showRates,setShowRates]=useState(false)
  const [prompt,setPrompt]=useState('')
  const [mapClickMode,setMapClickMode]=useState(null)
  const [routeError,setRouteError]=useState(false)
  const [showStations,setShowStations]=useState(false)
  const [googleStations,setGoogleStations]=useState(null)
  const [stationSearch,setStationSearch]=useState({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
  const [locating,setLocating]=useState(false)
  const [showLeft,setShowLeft]=useState(true)
  const [showRight,setShowRight]=useState(true)
  const [locNote,setLocNote]=useState('')
  const vehicleName=config.modified?(config.customName||'Custom vehicle'):(vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)?.name||'Vehicle')
  const isEV=config.energy==='electric'
  const consumption=config.consumption||1
  const duration=baseDuration*(timeFactor[config.category]||1.15)
  const currentRange=config.capacity*(config.level/100)/(consumption/100)
  const rangePoint=useMemo(()=>{
    if(!route.length||distance<=currentRange)return null
    const fraction=Math.min(.98,currentRange/distance)
    const index=Math.max(0,Math.min(route.length-1,Math.floor(fraction*(route.length-1))))
    const p=route[index]
    return p?{lat:p[1],lng:p[0]}:null
  },[route,distance,currentRange])
  const alongStations=useMemo(()=>stations.map(s=>({...s,routeMeta:nearestOnRoute(s,route)})).filter(s=>s.routeMeta.along<distance+1).sort((a,b)=>a.routeMeta.along-b.routeMeta.along),[route,distance])
  const findRouteGasStations=async()=>{
    setFilter('gas');setShowStations(true);setGoogleStations([])
    setStationSearch({status:'loading',progress:0,total:0,count:0,error:'',failedAreas:0})
    try{
      const result=await searchGasStationsAlongRoute(routePoints,(progress,total,count)=>setStationSearch(s=>({...s,progress,total,count})))
      setGoogleStations(result.places)
      setStationSearch({status:'done',progress:result.sampleCount,total:result.sampleCount,count:result.places.length,error:'',failedAreas:result.failedAreas})
    }catch(error){
      setStationSearch(s=>({...s,status:'error',error:error?.message||'Google Places request failed.'}))
    }
  }
  const suitable=alongStations.filter(s=>isEV?s.type!=='gas_only':s.type!=='ev_only')
  const recommended=suitable.filter(s=>s.routeMeta.along>0&&s.routeMeta.along<Math.min(distance,currentRange*0.85+15)).slice(0,3)
  const need=distance*consumption/100
  const costRate=isEV?rates.ev:config.energy==='diesel'?rates.diesel:rates.gasoline
  const totalCost=need*costRate
  const gasCost=distance*6.8/100*rates.gasoline
  const evCost=distance*14.4/100*rates.ev
  const save=Math.abs(gasCost-evCost)
  const lowRange=distance>currentRange
  const routePoints=route.length?route:[]
  const calculate=async(a=origin,b=destination)=>{
    if(!a||!b)return
    setGoogleStations(null)
    setStationSearch({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
    setRouteStatus('Calculating route…');setRouteError(false)
    try{
      const url=`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
      const res=await fetch(url)
      if(!res.ok)throw new Error('OSRM unavailable')
      const data=await res.json()
      if(data.code!=='Ok'||!data.routes?.length)throw new Error('No route')
      const r=data.routes[0]
      setRoute(r.geometry.coordinates);setDistance(r.distance/1000);setDuration(r.duration/60);setRouteStatus('OSRM driving route');setRouteError(false)
    }catch{
      const d=kmLine(a,b)*1.22
      setRoute([[a.lng,a.lat],[b.lng,b.lat]]);setDistance(d);setDuration(d/65*60);setRouteStatus('Straight-line estimate · OSRM unavailable');setRouteError(true)
    }
  }
  useEffect(()=>{calculate(origin,destination)},[])
  const pickOrigin=pl=>{setOriginName(pl.name);setOrigin(pl);calculate(pl,destination)}
  const pickDestination=pl=>{setDestinationName(pl.name);setDestination(pl);calculate(origin,pl)}
  const isMobile=()=>window.matchMedia('(max-width:1023px)').matches
  const togglePin=which=>{
    if(mapClickMode===which){setMapClickMode(null);if(isMobile())setShowLeft(true);return}
    setMapClickMode(which)
    if(isMobile())setShowLeft(false)
  }
  const handleMapClick=p=>{
    if(!mapClickMode)return
    const nearest=provinces.map(x=>({...x,d:kmLine(x,p)})).sort((a,b)=>a.d-b.d)[0]
    const pin={lat:p.lat,lng:p.lng,name:`Map pin near ${nearest.name}`}
    if(mapClickMode==='origin'){setOrigin(pin);setOriginName('Custom map pin');calculate(pin,destination)}
    else{setDestination(pin);setDestinationName('Custom map pin');calculate(origin,pin)}
    setMapClickMode(null)
    if(isMobile())setShowLeft(true)
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
        const pin={lat,lng,name:`Current location (near ${nearest.name})`}
        setOrigin(pin);setOriginName('Current location');setMapClickMode(null)
        setLocNote(inCambodia?`Origin set to your location, near ${nearest.name}.`:'Your location appears to be outside Cambodia. Routes and stations may not be useful.')
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
    if(lowRange){
      const stop=recommended[0]
      return stop?`${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}% and the destination is ${Math.round(distance-currentRange)} km beyond that. Plan a stop at ${stop.name} (${stop.road}) before reaching the estimated range limit. Confirm the connector and live availability before departure.`:`Your estimated range (${Math.round(currentRange)} km) is shorter than this ${Math.round(distance)} km trip. No compatible station pin was found close to the displayed route corridor. Add a safety stop and verify local options before leaving.`
    }
    return `${vehicleName} has an estimated ${Math.round(currentRange-distance)} km of range remaining on arrival. The current ${Math.round(distance)} km route appears achievable without a planned refuel stop, assuming the entered efficiency and normal conditions. Keep a reserve for detours.`
  }
  const chips=['Compare EV vs Gas cost','Find 24/7 stops only','Eco-driving tip']
  const chipAction=t=>{setPrompt(t);if(t==='Find 24/7 stops only')setShowStations(true)}
  const sidePanels=<>
        <Panel className="p-4"><div className="text-xs font-extrabold">Route overview</div><div className="mt-3 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emeraldx"/><div className="text-xs font-semibold">{origin?origin.name:'Choose origin'}</div></div><div className="ml-1 my-1 h-5 border-l border-dashed border-slate-600"/><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amberx"/><div className="text-xs font-semibold">{destination?destination.name:'Choose destination'}</div></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><div><div className="text-[10px] text-slate-500">Distance</div><b>{fmt(distance)} km</b></div><div><div className="text-[10px] text-slate-500">ETA</div><b>{fmtTime(duration)}</b></div></div></Panel>
        <Panel className="p-4"><div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Activity size={15} className="text-emeraldx"/> Range & dead-zone monitor</div><div className="flex items-end justify-between"><span className="text-[10px] text-slate-500">Estimated remaining range</span><b className={lowRange?'text-rose-300':'text-emeraldx'}>{fmt(currentRange)} km</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={cx('h-full rounded-full',lowRange?'bg-rose-400':'bg-emeraldx')} style={{width:`${Math.min(100,distance/currentRange*100)}%`}}/></div><div className="mt-2 text-[10px] leading-4 text-slate-400">{!origin||!destination?'Choose an origin and destination to check range.':lowRange?'Range limit falls before destination.':'Estimated range covers the route.'}</div></Panel>
        <Panel className="p-4"><div className="mb-3 text-xs font-extrabold">Pit-stop itinerary</div><div className="space-y-3"><div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-emeraldx"/><div><b className="text-xs">{origin?origin.name:'Choose origin'}</b><div className="text-[10px] text-slate-500">Start journey</div></div></div>{recommended.map(s=><div key={s.id} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-300"/><div><b className="text-xs">{s.name}</b><div className="text-[10px] text-slate-500">Approx. route progress · {s.road}</div></div></div>)}{lowRange&&!recommended.length&&<div className="rounded-lg bg-rose-400/10 p-2 text-[10px] text-rose-200">No compatible stop confidently identified. Plan an alternate stop.</div>}<div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-amberx"/><div><b className="text-xs">{destination?destination.name:'Choose destination'}</b><div className="text-[10px] text-slate-500">Destination</div></div></div></div></Panel>
        <div className="rounded-xl border border-white/10 bg-ink/85 p-3 text-[10px] leading-4 text-slate-400 backdrop-blur"><Info size={13} className="mb-1 text-amberx"/> Route and travel time from OSRM are estimates. Use “Pin (choose on map)” under origin or destination to place a custom pin.</div></>
  return <div className="relative h-[100dvh] min-h-[480px] w-full overflow-hidden bg-slate-950 text-white lg:min-h-[720px]">
    <div className={cx('absolute inset-0',mapClickMode&&'pick-mode')}><MapView origin={origin} destination={destination} route={routePoints} stations={googleStations??stations} filter={filter} onMapClick={handleMapClick} rangePoint={rangePoint}/></div>
    <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-r from-ink/35 via-transparent to-transparent"/>
    <div className="pointer-events-none absolute left-1 top-4 z-[500] flex items-center gap-2"><button onClick={onChangeVehicle} aria-label="Back to vehicle profile" className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 text-xs font-bold shadow-xl backdrop-blur transition hover:border-emeraldx/50 hover:text-emeraldx"><ArrowLeft size={16}/> Back</button><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 py-2 shadow-xl backdrop-blur"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-8 w-8 object-contain"/><div className="hidden sm:block"><div className="text-sm font-black">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[9px] uppercase tracking-widest text-slate-500">Cambodia trip planner</div></div></div></div>
    <div className="pointer-events-none absolute right-1 top-4 z-[500] flex gap-2 lg:hidden"><button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide menu and show map':'Show menu'} className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 text-xs font-bold shadow-xl backdrop-blur hover:border-emeraldx/50">{showLeft?<><MapIcon size={16}/> Map</>:<><Route size={16}/> Plan</>}</button></div>
    <div className="absolute bottom-1 left-1 right-1 top-[76px] z-[500] flex items-end justify-between gap-4 pointer-events-none lg:items-start">
      <div className={cx('pointer-events-auto max-h-full w-full overflow-y-auto lg:max-w-[390px] [direction:rtl] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',!showLeft&&'hidden')}><div className="flex flex-col gap-3 [direction:ltr]">
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="text-sm font-extrabold">Plan your journey</div><span className="rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold uppercase text-emeraldx">Step 03 / Route</span></div>
          <PlaceSearch label="Origin" value={originName} placeholder="Search a place in Cambodia" onPick={pickOrigin} action={pinButton('origin')}/>
          <button onClick={useCurrentLocation} disabled={locating} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emeraldx/30 bg-emeraldx/5 py-2.5 text-xs font-bold text-emeraldx transition hover:bg-emeraldx/10 disabled:opacity-60"><LocateFixed size={15} className={locating?'animate-pulse':''}/>{locating?'Locating…':'Use current location'}</button>
          {locNote&&<div className="mt-2 text-[10px] leading-4 text-slate-400">{locNote}</div>}
          
          <div className="mt-4"><PlaceSearch label="Destination" value={destinationName} placeholder="Search a place in Cambodia" onPick={pickDestination} action={pinButton('destination')}/></div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-3"><div><div className="text-[10px] uppercase text-slate-500">Vehicle</div><div className="mt-1 text-xs font-bold">{vehicleName}</div></div><div className="text-right"><div className="text-[10px] uppercase text-slate-500">Current level</div><div className="mt-1 text-sm font-black text-emeraldx">{config.level}%</div></div></div>
          <button onClick={()=>calculate()} disabled={!origin||!destination} className="disabled:opacity-40 mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-3 text-xs font-extrabold text-ink hover:bg-emerald-300"><Navigation size={15}/> Recalculate route</button>
          <div className="mt-2 text-center text-[10px] text-slate-500">{routeStatus}</div>
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-emeraldx"/><div className="text-sm font-extrabold">SmartRoute AI Co-Pilot</div><span className="ml-auto rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold text-emeraldx">RULE-BASED</span></div>
          <p className="text-xs leading-5 text-slate-300">{recommendation()}</p>
          {lowRange&&<div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[11px] leading-4 text-rose-200"><ShieldAlert size={16} className="shrink-0"/> Range warning: estimated range is shorter than the trip. Do not depart without a confirmed stop.</div>}
          <div className="mt-3 flex flex-wrap gap-2">{chips.map(c=><button key={c} onClick={()=>chipAction(c)} className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300 hover:border-emeraldx/40 hover:text-emeraldx">{c}</button>)}</div>
          {prompt&&<div className="mt-3 rounded-lg bg-white/5 p-3 text-[11px] leading-5 text-slate-300">{prompt==='Compare EV vs Gas cost'?`For this distance, illustrative EV cost is ${money(evCost,rates.usdToKhr)} versus gasoline at ${money(gasCost,rates.usdToKhr)}. Estimated difference: ${money(save,rates.usdToKhr)}.`:prompt==='Find 24/7 stops only'?'Station list opened below. Filter for compatible fuel or connectors and confirm the location before travel.':'Eco tip: maintain a steady highway speed, avoid hard acceleration, check tire pressure and reduce unnecessary cargo.'}</div>}
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><CircleDollarSign size={16} className="text-amberx"/> Trip cost estimate</div><button onClick={()=>setShowRates(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showRates?'Close':'Edit rates'}</button></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Distance</div><div className="mt-1 text-lg font-black">{fmt(distance)} <small className="text-xs text-slate-400">km</small></div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Drive time</div><div className="mt-1 text-lg font-black">{fmtTime(duration)}</div></div></div>
          <div className="mt-2 rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Estimated {isEV?'energy':'fuel'} required</span><span>{isEV?'kWh':'L'}</span></div><div className="mt-1 text-xl font-black">{need.toFixed(1)} <small className="text-xs font-medium text-slate-400">{isEV?'kWh':'L'}</small></div></div>
          <div className="mt-2 flex items-end justify-between rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div><div className="text-[10px] text-amberx/80">Estimated trip cost</div><div className="mt-1 text-xl font-black">{money(totalCost,rates.usdToKhr).split(' · ')[0]}</div><div className="text-xs text-slate-400">{money(totalCost,rates.usdToKhr).split(' · ')[1]}</div></div><div className="text-right text-[10px] text-slate-500">{isEV?'DC fast-charge tariff':config.energy==='diesel'?'Diesel tariff':'Gasoline tariff'}<br/>{fmt(costRate)} ៛ / {isEV?'kWh':'L'}</div></div>
          <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">EV vs gasoline benchmark</span><span className="font-bold text-emeraldx">{evCost<=gasCost?'EV saves':'Gas saves'} {money(save,rates.usdToKhr)}</span></div>
          {showRates&&<div className="mt-4 space-y-3 border-t border-white/10 pt-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable reference tariffs (KHR)</div>{[['gasoline','Regular gasoline / L'],['diesel','Diesel / L'],['ev','EV DC fast charge / kWh'],['usdToKhr','USD → KHR']].map(([k,l])=><label key={k} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">{l}<input className="field w-28 py-2 text-right" type="number" value={rates[k]} onChange={e=>setRates(p=>({...p,[k]:Number(e.target.value)}))}/></label>)}<div className="text-[9px] leading-4 text-slate-500">Fuel schedule reference: 11–21 Nov 2026. EV DC rate reference: effective 1 Oct 2025. Edit to match the current pump or charger price.</div></div>}
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><MapPin size={16} className="text-emeraldx"/> Station finder</div><button onClick={()=>setShowStations(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showStations?'Hide list':'View stations'}</button></div>
          <div className="flex flex-wrap gap-1.5">{[['all','All Stations'],['ev','EV Chargers'],['gas','Gas Pumps'],['hybrid','Hybrid Hubs']].map(([id,l])=><Pill key={id} active={filter===id} onClick={()=>setFilter(id)}>{l}</Pill>)}</div>
          <button onClick={findRouteGasStations} disabled={stationSearch.status==='loading'||routePoints.length<2} className="mt-3 flex w-full items-center justify-center rounded-xl bg-emeraldx py-2.5 text-xs font-extrabold text-ink hover:bg-emerald-300 disabled:opacity-60">{stationSearch.status==='loading'?`Searching ${stationSearch.progress}/${stationSearch.total} route areas…`:'Find gas stations along this route'}</button>
          {stationSearch.status==='loading'&&<div className="mt-2 text-[10px] text-slate-400">Searching Google Places within 25 km of points along the route. Found {stationSearch.count} so far…</div>}
          {stationSearch.status==='error'&&<div className="mt-2 rounded-lg bg-rose-400/10 p-2 text-[10px] leading-4 text-rose-200">Google Places search failed: {stationSearch.error} Confirm Places API (New) is enabled and the key is allowed to use it.</div>}
          {stationSearch.status==='done'&&<div className="mt-2 text-[10px] leading-4 text-slate-400">Found {stationSearch.count} unique Google Places results{stationSearch.failedAreas?`; ${stationSearch.failedAreas} route-area searches failed`:''}. Each route area returns up to 20 matches, so this may miss stations, especially in dense areas.</div>}
          {showStations&&<div className="mt-3 max-h-64 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{googleStations===null?alongStations.filter(s=>filter==='all'||(filter==='ev'&&s.type!=='gas_only')||(filter==='gas'&&s.type!=='ev_only')||(filter==='hybrid'&&s.type==='hybrid_hub')).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className="text-[9px] text-emeraldx">{s.road}</span></div><div className="mt-1 text-[10px] text-slate-500">{s.brand} · {s.hours} · {s.connectors.join(', ')||'Fuel'}</div></div>):googleStations.map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b>{s.status==='CLOSED_PERMANENTLY'&&<span className="text-[9px] text-rose-300">Permanently closed</span>}</div><div className="mt-1 text-[10px] text-slate-400">{s.detail||'Address not provided'}</div><a className="mt-1 inline-block text-[10px] font-bold text-emeraldx hover:underline" href={s.mapsUrl} target="_blank" rel="noopener noreferrer">View on Google Maps ↗</a></div>)}</div>}
          <div className="mt-3 text-[9px] leading-4 text-slate-500">Google Places searches a 25 km corridor around sampled points on the current route. Listings may be incomplete or out of date, and each request is limited to 20 results. Check station details on Google Maps. Searches may incur Google Maps Platform charges.</div>
        </Panel>
      <div className="flex flex-col gap-3 lg:hidden">{sidePanels}</div></div></div>
      <div className={cx('pointer-events-auto ml-auto hidden max-h-full w-[290px] flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',showRight&&'lg:flex')}>{sidePanels}
      </div>
    </div>
    <button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide left menu':'Show left menu'} title={showLeft?'Hide menu':'Show menu'} style={{left:showLeft?'min(404px, calc(100vw - 44px))':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showLeft?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}</button>
    <button onClick={()=>setShowRight(x=>!x)} aria-label={showRight?'Hide right menu':'Show right menu'} title={showRight?'Hide menu':'Show menu'} style={{right:showRight?'304px':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showRight?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button>
    {mapClickMode&&<div className="absolute left-1/2 top-[76px] z-[600] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-xl border border-emeraldx/40 bg-ink/95 px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur"><MapPin size={15} className="text-emeraldx"/>Tap the map to set {mapClickMode}<button onClick={()=>togglePin(mapClickMode)} className="text-slate-400 hover:text-white">Cancel</button></div>}
    {routeError&&<div className="absolute left-2 right-2 top-[76px] z-[600] max-w-xs lg:left-auto lg:bottom-4 lg:right-4 lg:top-auto rounded-xl border border-amberx/30 bg-ink/95 p-3 text-[10px] text-amberx shadow-xl">OSRM could not be reached. Showing a straight-line distance estimate with a road-distance factor.</div>}
  </div>
}
const paths=['/','/vehicle','/route']
const stepFromPath=()=>{
  const clean=window.location.pathname.replace(/\/+$/,'')||'/'
  const i=paths.indexOf(clean)
  return i===-1?0:i
}
export default function App(){
  const [step,setStepState]=useState(stepFromPath)
  const [config,setConfig]=useState({category:'',model:'',modified:false,energy:'',capacity:'',consumption:'',level:100,customName:''})
  const setStep=next=>{
    const target=paths[next]
    if(window.location.pathname!==target)window.history.pushState({step:next},'',target)
    setStepState(next)
    window.scrollTo(0,0)
  }
  useEffect(()=>{
    // Normalize unknown paths (e.g. /foo) back to the root URL
    const known=paths.includes(window.location.pathname.replace(/\/+$/,'')||'/')
    if(!known)window.history.replaceState({step:0},'','/')
    const onPop=()=>setStepState(stepFromPath())
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[])
  useEffect(()=>{
    // /route needs a vehicle: send direct visits back to the vehicle profile
    if(step===2&&!(config.capacity>0&&config.consumption>0)){window.history.replaceState({step:1},'','/vehicle');setStepState(1)}
  },[step,config.capacity,config.consumption])
  useEffect(()=>{
    const titles=['SmartRoute AI — Cambodia Trip Planner','Vehicle profile · SmartRoute AI','Map & Route · SmartRoute AI']
    document.title=titles[step]
  },[step])
  return step===0?<Welcome onStart={()=>setStep(1)} onRoute={()=>setStep(2)}/>:step===1?<Setup onBack={()=>setStep(0)} onGenerate={()=>setStep(2)} config={config} setConfig={setConfig}/>:<TripPlanner config={config} onChangeVehicle={()=>setStep(1)}/>
}
