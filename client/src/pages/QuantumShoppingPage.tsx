import { useState, useEffect } from "react";
import { ExternalLink, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QS_CATEGORIES=[
  {label:'Electronics',emoji:'📱',color:'#6366f1'},{label:'Home & Garden',emoji:'🏡',color:'#22c55e'},
  {label:'Health & Fitness',emoji:'💪',color:'#f43f5e'},{label:'Gaming',emoji:'🎮',color:'#8b5cf6'},
  {label:'Books',emoji:'📚',color:'#f59e0b'},{label:'Beauty & Personal Care',emoji:'✨',color:'#ec4899'},
  {label:'Sports & Outdoors',emoji:'🏃',color:'#14b8a6'},{label:'Smart Home',emoji:'🏠',color:'#06b6d4'},
  {label:'Clothing & Fashion',emoji:'👕',color:'#a855f7'},{label:'Photography',emoji:'📷',color:'#3b82f6'},
  {label:'Automotive',emoji:'🚗',color:'#f97316'},{label:'Toys & Games',emoji:'🎯',color:'#84cc16'},
];
const QS_RETAILERS=[
  {key:'amazon',label:'Amazon',color:'#f59e0b',bg:'#f59e0b15'},
  {key:'walmart',label:'Walmart',color:'#3b82f6',bg:'#3b82f615'},
  {key:'ebay',label:'eBay',color:'#a855f7',bg:'#a855f715'},
  {key:'target',label:'Target',color:'#ef4444',bg:'#ef444415'},
  {key:'bestbuy',label:'Best Buy',color:'#eab308',bg:'#eab30815'},
  {key:'google',label:'Google Shopping',color:'#22c55e',bg:'#22c55e15'},
];

export default function QuantumShoppingPage(){
  const [view,setView]=useState<'home'|'product'|'category'>('home');
  const [products,setProducts]=useState<any[]>([]);
  const [selectedProduct,setSelectedProduct]=useState<any>(null);
  const [productFull,setProductFull]=useState<any>(null);
  const [selectedCategory,setSelectedCategory]=useState('');
  const [categoryProducts,setCategoryProducts]=useState<any[]>([]);
  const [searchInput,setSearchInput]=useState('');
  const [searchResults,setSearchResults]=useState<any[]|null>(null);
  const [loading,setLoading]=useState(true);
  const [productLoading,setProductLoading]=useState(false);
  const [engineStatus,setEngineStatus]=useState<any>(null);
  const [hiveStatus,setHiveStatus]=useState<any>(null);
  const {toast}=useToast();

  useEffect(()=>{
    fetch('/api/products').then(r=>r.json()).then(setProducts).catch(()=>{}).finally(()=>setLoading(false));
    const fetchEngine=()=>{
      fetch('/api/products/engine-status').then(r=>r.json()).then(setEngineStatus).catch(()=>{});
      fetch('/api/hive/status').then(r=>r.json()).then(setHiveStatus).catch(()=>{});
    };
    fetchEngine();
    const id=setInterval(fetchEngine,12000);
    return ()=>clearInterval(id);
  },[]);

  const openCategory=async(cat:string)=>{
    setSelectedCategory(cat);setView('category');setLoading(true);
    const r=await fetch('/api/products/category/'+encodeURIComponent(cat)).then(r=>r.json()).catch(()=>[]);
    setCategoryProducts(r);setLoading(false);
  };

  const openProduct=async(p:any)=>{
    setSelectedProduct(p);setView('product');setProductLoading(true);
    const r=await fetch('/api/products/'+p.slug).then(r=>r.json()).catch(()=>({product:null}));
    setProductFull(r.product||p);setProductLoading(false);
  };

  const doSearch=async()=>{
    if(!searchInput.trim())return;
    setLoading(true);
    const r=await fetch('/api/products/search?q='+encodeURIComponent(searchInput)).then(r=>r.json()).catch(()=>[]);
    setSearchResults(r);setLoading(false);
  };

  const enginePct=engineStatus&&engineStatus.total>0?Math.round((engineStatus.generated/engineStatus.total)*100):0;
  const displayProducts=searchResults!==null?searchResults:(products.length?products:[]);

  const ProductCard=({p}:{p:any})=>{
    const cat=QS_CATEGORIES.find(c=>c.label===p.category);
    const color=cat?.color||'#6366f1';
    const emoji=cat?.emoji||'🛍️';
    const isNew=p.generated&&p.generatedAt&&(Date.now()-new Date(p.generatedAt).getTime())<7200000;
    return(
      <button onClick={()=>openProduct(p)} data-testid={`product-card-${p.slug}`}
        className="group text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:border-lime-500/30 hover:bg-white/[0.04] transition-all overflow-hidden">
        <div className="relative w-full h-36 flex items-center justify-center overflow-hidden"
          style={{background:`radial-gradient(ellipse at center,${color}28 0%,${color}08 55%,transparent 100%),linear-gradient(135deg,#07071a 0%,#0e0e28 100%)`}}>
          <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:`radial-gradient(circle at 25% 25%,${color}22 0%,transparent 55%)`}}/>
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,0.03) 24px,rgba(255,255,255,0.03) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,0.03) 24px,rgba(255,255,255,0.03) 25px)'}}/>
          <span className="text-6xl select-none relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          {isNew&&<div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase" style={{background:`${color}25`,color,border:`1px solid ${color}50`}}>NEW</div>}
          <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white/50 bg-black/50 backdrop-blur-sm border border-white/5">{p.brand||'—'}</div>
          <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{background:'linear-gradient(to top,rgba(7,7,26,0.85),transparent)'}}/>
        </div>
        <div className="p-3.5">
          <div className="text-white/90 font-bold text-sm mb-1 line-clamp-2 leading-snug">{p.name}</div>
          {p.priceRange?<div className="text-lime-400 font-black text-sm">{p.priceRange}</div>:<div className="text-white/20 text-[9px]">View details →</div>}
          <div className="mt-2 text-white/25 text-[9px] px-2 py-0.5 rounded-full bg-white/5 inline-block">{p.category}</div>
        </div>
      </button>
    );
  };

  if(view==='product'&&selectedProduct){
    const p=productFull||selectedProduct;
    return(
      <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#051005)'}}>
        <div className="px-4 pt-6 pb-2 max-w-4xl mx-auto">
          <button onClick={()=>{setView('home');setProductFull(null);}} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-4"><ChevronLeft size={14}/>Back to Store</button>
          {productLoading?(
            <div className="text-white/30 text-sm text-center py-20">Loading product intelligence...</div>
          ):(
            <div className="space-y-5">
              <div className="rounded-2xl border border-lime-500/20 bg-lime-950/10 overflow-hidden">
                {(()=>{
                  const cat=QS_CATEGORIES.find(c=>c.label===p.category);
                  const color=cat?.color||'#6366f1';
                  const emoji=cat?.emoji||'🛍️';
                  return(
                    <div className="relative w-full h-52 flex items-center justify-center overflow-hidden"
                      style={{background:`radial-gradient(ellipse at 40% 35%,${color}40 0%,${color}10 55%,transparent 100%),linear-gradient(160deg,#06061a 0%,#0c0c25 60%,#07100a 100%)`}}>
                      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:`radial-gradient(circle at 70% 25%,${color}20 0%,transparent 50%),radial-gradient(circle at 15% 75%,${color}12 0%,transparent 45%)`}}/>
                      <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 32px,rgba(255,255,255,0.04) 32px,rgba(255,255,255,0.04) 33px),repeating-linear-gradient(90deg,transparent,transparent 32px,rgba(255,255,255,0.04) 32px,rgba(255,255,255,0.04) 33px)'}}/>
                      <span className="text-8xl select-none relative z-10 drop-shadow-2xl">{emoji}</span>
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 bg-black/50 backdrop-blur-sm border border-white/10">{p.category}</div>
                        {p.subcategory&&<div className="px-2.5 py-1 rounded-full text-[10px] text-white/40 bg-black/30 border border-white/5">{p.subcategory}</div>}
                      </div>
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-black/50 backdrop-blur-sm border border-white/10" style={{color}}>{p.brand}</div>
                      <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none" style={{background:'linear-gradient(to top,rgba(6,6,26,0.9),transparent)'}}/>
                    </div>
                  );
                })()}
                <div className="p-6 pt-4">
                  <h1 className="text-white font-black text-2xl mb-1.5">{p.name}</h1>
                  {p.priceRange&&<div className="text-lime-400 font-black text-xl mb-3">{p.priceRange}</div>}
                  <p className="text-white/60 text-sm leading-relaxed">{p.summary}</p>
                  {p.rating&&<div className="flex items-center gap-2 mt-3"><span className="text-yellow-400 font-bold text-sm">{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5-Math.round(p.rating))}</span><span className="text-white/30 text-xs">{p.rating}/5 rating</span></div>}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3"><span className="text-white font-black text-sm">🛒 Buy From</span><div className="flex-1 h-px bg-white/5"/></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QS_RETAILERS.map(r=>{
                    const url=p.retailerLinks?.[r.key];
                    if(!url)return null;
                    return(
                      <a key={r.key} href={url} target="_blank" rel="noopener noreferrer" data-testid={`retailer-link-${r.key}`}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                        style={{background:r.bg,border:`1px solid ${r.color}30`,color:r.color}}>
                        <ExternalLink size={13}/>{r.label}
                      </a>
                    );
                  })}
                </div>
              </div>
              {p.keyFeatures?.length>0&&(
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">⚡ Key Features</div>
                  <ul className="space-y-2">
                    {p.keyFeatures.map((f:string,i:number)=>(
                      <li key={i} className="flex items-start gap-2 text-white/70 text-sm"><span className="text-lime-400 mt-0.5">✓</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.description&&(
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">📖 About This Product</div>
                  <p className="text-white/60 text-sm leading-relaxed">{p.description}</p>
                </div>
              )}
              {(p.pros?.length>0||p.cons?.length>0)&&(
                <div className="grid sm:grid-cols-2 gap-4">
                  {p.pros?.length>0&&<div className="rounded-2xl border border-green-500/20 bg-green-950/10 p-4"><div className="text-green-400 font-black text-sm mb-2">👍 Pros</div><ul className="space-y-1">{p.pros.map((pr:string,i:number)=><li key={i} className="text-white/60 text-xs flex gap-2"><span className="text-green-400">+</span>{pr}</li>)}</ul></div>}
                  {p.cons?.length>0&&<div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-4"><div className="text-red-400 font-black text-sm mb-2">👎 Cons</div><ul className="space-y-1">{p.cons.map((cn:string,i:number)=><li key={i} className="text-white/60 text-xs flex gap-2"><span className="text-red-400">−</span>{cn}</li>)}</ul></div>}
                </div>
              )}
              {p.specs&&Object.keys(p.specs).length>0&&(
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">📐 Specifications</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(p.specs).map(([k,v]:any)=>(
                      <div key={k} className="text-xs"><span className="text-white/30">{k}:</span><span className="text-white/70 ml-1">{v}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {p.idealFor?.length>0&&(
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="text-white font-black text-sm mb-3">🎯 Ideal For</div>
                  <div className="flex flex-wrap gap-2">{p.idealFor.map((u:string,i:number)=><span key={i} className="px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-300 text-xs">{u}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if(view==='category'){
    return(
      <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#051005)'}}>
        <div className="px-4 pt-6 pb-10 max-w-6xl mx-auto">
          <button onClick={()=>{setView('home');setCategoryProducts([]);}} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-4"><ChevronLeft size={14}/>All Categories</button>
          <div className="text-white font-black text-xl mb-5">{selectedCategory}</div>
          {loading?(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({length:8}).map((_,i)=><div key={i} className="h-36 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"/>)}
            </div>
          ):categoryProducts.length===0?(
            <div className="text-center text-white/30 py-16"><div className="text-4xl mb-3">🔍</div><div className="text-sm">No products in this category yet</div></div>
          ):(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryProducts.map((p:any)=><ProductCard key={p.slug} p={p}/>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return(
    <div className="flex-1 overflow-auto" style={{background:'linear-gradient(180deg,#020010,#051005)'}}>
      <div className="px-4 pt-6 pb-10 max-w-6xl mx-auto space-y-8">
        {/* Engine status bar */}
        {engineStatus&&(
          <div className="rounded-2xl border border-lime-500/15 bg-lime-950/5 p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Quantum Product Engine</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-lime-400 transition-all" style={{width:`${enginePct}%`}}/>
                </div>
                <span className="text-lime-400 text-xs font-black">{enginePct}%</span>
              </div>
              <div className="text-white/20 text-[9px] mt-1">{(engineStatus.generated||0).toLocaleString()} / {(engineStatus.total||0).toLocaleString()} products indexed</div>
            </div>
            {hiveStatus&&(
              <div className="text-right">
                <div className="text-white/20 text-[9px]">Hive Knowledge</div>
                <div className="text-white/50 text-xs font-bold">{(hiveStatus.memory?.total||0).toLocaleString()} nodes</div>
              </div>
            )}
          </div>
        )}
        {/* Search */}
        <div className="flex gap-2">
          <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doSearch()}
            placeholder="Search any product, brand, or category..."
            data-testid="input-product-search"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-lime-500/30 focus:bg-white/[0.05] transition-all"/>
          <button onClick={doSearch} data-testid="btn-product-search"
            className="px-5 py-3 rounded-2xl font-black text-sm text-black bg-lime-400 hover:bg-lime-300 transition-colors">Search</button>
          {searchResults!==null&&<button onClick={()=>{setSearchResults(null);setSearchInput('');}} className="px-4 py-3 rounded-2xl text-white/40 hover:text-white text-xs border border-white/10 hover:border-white/20 transition-all">Clear</button>}
        </div>
        {/* Categories */}
        <div>
          <div className="flex items-center gap-2 mb-4"><span className="text-white font-black text-sm">🗂️ Shop by Category</span><div className="flex-1 h-px bg-white/5"/></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {QS_CATEGORIES.map(cat=>(
              <button key={cat.label} onClick={()=>openCategory(cat.label)} data-testid={`qs-cat-${cat.label.replace(/\s+/g,'-').toLowerCase()}`}
                className="group p-3 rounded-2xl bg-white/[0.025] border border-white/8 hover:border-white/20 hover:bg-white/[0.05] transition-all text-center">
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-white/60 font-bold text-[10px] leading-tight">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
        {/* Products grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white font-black text-sm">{searchResults!==null?`🔍 Results for "${searchInput}"`:loading?'⏳ Loading Products...':'🔥 AI-Indexed Products'}</span>
            <div className="flex-1 h-px bg-white/5"/>
            {displayProducts.length>0&&<span className="text-white/20 text-[9px]">{displayProducts.length} products</span>}
          </div>
          {loading&&!searchResults?(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({length:8}).map((_,i)=>(
                <div key={i} className="h-36 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"/>
              ))}
            </div>
          ):displayProducts.length===0?(
            <div className="text-center text-white/30 py-16">
              <div className="text-4xl mb-3">🛒</div>
              <div className="text-sm mb-2">{searchResults!==null?'No products found — try a different search':'Engine is warming up. Products are being indexed...'}</div>
              <div className="text-xs text-white/15">Check back shortly — the engine generates ~1 product every 5 seconds</div>
            </div>
          ):(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayProducts.map((p:any)=><ProductCard key={p.slug} p={p}/>)}
            </div>
          )}
        </div>
        <div className="text-center rounded-2xl border border-white/5 bg-white/[0.015] p-6">
          <div className="text-white/30 font-black text-xs tracking-wider uppercase mb-1">Quantum Affiliate Router</div>
          <p className="text-white/15 text-[10px]">Every retailer link is tracked. As affiliate programs are added, every click retroactively earns commissions — no rebuild needed.</p>
        </div>
      </div>
    </div>
  );
}
