/* P.H. Works moving card gallery. Shared by index.html and projects.html.
   PHWSpiral.projects()  -> Promise of [{id,title,sub,img}] from the same projects data as projects.html
   PHWSpiral.mount(host, items, opts) -> {destroy()}
   items: {id,title,sub,img,href?}   opts: {big:true, onOpen:function(item)} */
(function(){
var css=
'.spiral{position:relative;margin-top:28px;overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none}'+
'.spiral.drag{cursor:grabbing}'+
'.sp-track{display:flex;width:max-content;will-change:transform}'+
'.sp-card{position:relative;flex:none;display:block;padding:0;border:0;background:#223a4f;border-radius:14px;overflow:hidden;cursor:pointer;color:#fff;text-decoration:none;font:inherit;text-align:left}'+
'.sp-card img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}'+
'.sp-cap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;background:linear-gradient(180deg,rgba(5,12,20,0) 40%,rgba(5,12,20,.92));opacity:0;transition:opacity .25s}'+
'@media(hover:hover){.sp-card:hover .sp-cap{opacity:1}}'+
'.sp-card:focus-visible{outline:3px solid #ff8a4c;outline-offset:2px}'+
'.sp-card:focus-visible .sp-cap{opacity:1}'+
'.sp-nm{font:700 20px/1.15 "Archivo",Arial,sans-serif}'+
'.sp-sb{font-size:14px;color:#d3dee7;margin-top:4px}'+
'.sp-go{margin-top:10px;font-weight:600;font-size:14px;color:#ff9a62}'+
'.sp-btn{position:absolute;top:50%;z-index:5;width:46px;height:46px;margin-top:-23px;border:0;border-radius:50%;background:rgba(5,12,20,.65);color:#fff;font-size:24px;line-height:1;cursor:pointer}'+
'.sp-btn:hover{background:#d14a05}.sp-btn.l{left:10px}.sp-btn.r{right:10px}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

function projects(){
  if(typeof PHW_SUPABASE_URL==='undefined'||PHW_SUPABASE_URL.indexOf('YOUR-')>-1)return Promise.reject(new Error('no config'));
  var U=PHW_SUPABASE_URL;
  return fetch(U+'/rest/v1/projects?published=eq.true&order=created_at.desc&select=*,project_photos(*)',{headers:{apikey:PHW_SUPABASE_KEY,Authorization:'Bearer '+PHW_SUPABASE_KEY}})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
    .then(function(rows){
      return rows.map(function(p){
        var pics=(p.project_photos||[]).slice().sort(function(a,b){return a.created_at<b.created_at?-1:1});
        return{id:p.id,title:p.title,sub:[p.category,p.subtype].filter(Boolean).join(' \u00b7 '),img:pics[0]?U+'/storage/v1/object/public/project-photos/'+pics[0].path:''};
      }).filter(function(i){return i.img});
    });
}

function mount(host,items,o){
  o=o||{};host.innerHTML='';
  if(!items.length)return{destroy:function(){}};
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var track=el('div','sp-track'),pos=0,setW=0,speed=0,base=reduce?0:34,hover=false,drag=false,moved=false,raf=0,last=0;
  var bl=el('button','sp-btn l','\u2039'),br=el('button','sp-btn r','\u203a');
  bl.type=br.type='button';bl.setAttribute('aria-label','Previous');br.setAttribute('aria-label','Next');
  bl.addEventListener('click',function(){speed-=800});br.addEventListener('click',function(){speed+=800});
  function card(it,cw,ch){
    var c=o.onOpen||!it.href?el('button','sp-card'):el('a','sp-card');
    if(c.tagName==='BUTTON')c.type='button';else c.href=it.href;
    c.style.width=cw+'px';c.style.height=ch+'px';
    var im=document.createElement('img');im.src=it.img;im.alt=it.title||'';im.draggable=false;c.appendChild(im);
    var cap=el('span','sp-cap');cap.appendChild(el('span','sp-nm',it.title||''));
    if(it.sub)cap.appendChild(el('span','sp-sb',it.sub));
    cap.appendChild(el('span','sp-go','View project'));c.appendChild(cap);
    c.addEventListener('click',function(e){
      if(moved){e.preventDefault();return}
      if(o.onOpen){e.preventDefault();o.onOpen(it)}
    });
    return c;
  }
  function build(){
    var w=host.clientWidth||800,gap=20;
    var cw=Math.round(Math.max(o.big?250:200,Math.min(o.big?400:300,w*(o.big?.34:.26))));
    var ch=Math.round(cw*1.25),unit=cw+gap;
    var reps=Math.max(1,Math.ceil(w/(items.length*unit)));
    var set=[];for(var r=0;r<reps;r++)set=set.concat(items);
    setW=set.length*unit;
    track.innerHTML='';track.style.gap=gap+'px';
    set.concat(set).forEach(function(it){track.appendChild(card(it,cw,ch))});
    host.style.height=ch+'px';
  }
  function paint(){track.style.transform='translate3d('+(-pos)+'px,0,0)'}
  function tick(t){
    var dt=Math.min(.05,(t-last)/1000||0);last=t;
    var r=host.getBoundingClientRect();
    if(r.bottom>0&&r.top<window.innerHeight&&!document.hidden){
      if(!drag){speed+=(((hover)?0:base)-speed)*Math.min(1,dt*3);pos+=speed*dt}
      if(setW)pos=((pos%setW)+setW)%setW;
      paint();
    }
    raf=requestAnimationFrame(tick);
  }
  var sx=0,sp0=0,down=false;
  function pd(e){if(e.target.closest&&e.target.closest('.sp-btn'))return;down=true;moved=false;sx=e.clientX;sp0=pos}
  function pm(e){
    if(!down)return;var dx=e.clientX-sx;
    if(Math.abs(dx)>6&&!drag){drag=true;moved=true;host.classList.add('drag')}
    if(drag){pos=sp0-dx;speed=0}
  }
  function pu(){if(!down)return;down=false;if(drag){drag=false;host.classList.remove('drag');setTimeout(function(){moved=false},0)}}
  function me(e){if(e.pointerType==='mouse')hover=true}
  function ml(){hover=false}
  host.appendChild(track);host.appendChild(bl);host.appendChild(br);
  host.addEventListener('pointerdown',pd);window.addEventListener('pointermove',pm);window.addEventListener('pointerup',pu);window.addEventListener('pointercancel',pu);
  host.addEventListener('pointerenter',me);host.addEventListener('pointerleave',ml);
  var rt=0;function rs(){clearTimeout(rt);rt=setTimeout(function(){build()},150)}
  window.addEventListener('resize',rs);
  build();paint();raf=requestAnimationFrame(tick);
  return{destroy:function(){
    cancelAnimationFrame(raf);clearTimeout(rt);
    host.removeEventListener('pointerdown',pd);window.removeEventListener('pointermove',pm);window.removeEventListener('pointerup',pu);window.removeEventListener('pointercancel',pu);
    host.removeEventListener('pointerenter',me);host.removeEventListener('pointerleave',ml);window.removeEventListener('resize',rs);
    host.innerHTML='';
  }};
}
window.PHWSpiral={mount:mount,projects:projects};
})();
