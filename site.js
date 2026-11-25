(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* mobile menu */
const menu=$('.menu'),nav=$('nav');
if(menu&&nav)menu.addEventListener('click',()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o);menu.textContent=o?'Close':'Menu';});

/* reveal on scroll */
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12}):null;
$$('.rise').forEach(el=>io?io.observe(el):el.classList.add('in'));

/* storyboard: shots light up one after another, like a film playing */
$$('.shots').forEach(strip=>{
  const shots=$$('.shot',strip);if(!shots.length)return;
  const dur=1800;strip.style.setProperty('--dur',dur+'ms');
  let i=-1,timer=0,running=false;
  function next(){
    if(i>=0){shots[i].classList.remove('active');shots[i].classList.add('seen');}
    i++;
    if(i>=shots.length){timer=setTimeout(()=>{shots.forEach(s=>s.classList.remove('seen'));i=-1;next();},1200);return;}
    shots[i].classList.add('active');timer=setTimeout(next,dur);
  }
  if(reduce){shots.forEach(s=>s.classList.add('seen'));return;}
  const so=new IntersectionObserver(([e])=>{
    if(e.isIntersecting&&!running){running=true;next();}
    else if(!e.isIntersecting&&running){running=false;clearTimeout(timer);}
  },{threshold:.35});
  so.observe(strip);
});

/* sample films: play if the file exists, otherwise keep the poster shot */
$$('video[data-src]').forEach(v=>{
  v.addEventListener('loadeddata',()=>{v.hidden=false;v.play().catch(()=>{});},{once:true});
  v.addEventListener('error',()=>{v.remove();},{once:true});
  v.hidden=true;v.preload='auto';v.src=v.dataset.src;
});

/* 3D floor plan on a blueprint */
const plan=$('#plan');
if(plan){
  const fit=$('#fit'),fig=$('#figure');
  const el=(cls,css,vars)=>{const d=document.createElement('div');d.className=cls;Object.assign(d.style,css);if(vars)for(const k in vars)d.style.setProperty(k,vars[k]);plan.appendChild(d);return d;};
  const px=v=>v+'px';
  [['Living',0,0,240,170],['Kitchen',240,0,160,110],['',240,110,80,80],['Bath',320,110,80,80],['Bed 1',0,170,170,130],['Bed 2',170,170,150,130],['Balcony',320,190,80,110]]
   .forEach(([n,x,y,w,h])=>{const r=el('room',{left:px(x),top:px(y),width:px(w),height:px(h)});if(n)r.innerHTML='<b>'+n+'</b>';});
  function box(x,y,w,d,h,prog,extra=''){const S='var('+prog+',1)';
    el('f fh'+extra,{left:px(x),top:px(y+d-h),width:px(w),height:px(h)},{'--s':S});
    el('f fh'+extra,{left:px(x),top:px(y-h),width:px(w),height:px(h)},{'--s':S});
    el('f fv'+extra,{left:px(x+w-h),top:px(y),width:px(h),height:px(d)},{'--s':S});
    el('f fv'+extra,{left:px(x-h),top:px(y),width:px(h),height:px(d)},{'--s':S});
    el('top'+extra,{left:px(x),top:px(y),width:px(w),height:px(d)},{'--h':h,'--t':S});}
  const H=58,T=6;
  [[0,0,400,0],[400,0,400,300],[0,300,400,300],[0,0,0,300],[240,0,240,60],[290,110,400,110],[320,140,320,190],
   [0,170,110,170],[150,170,210,170],[250,170,320,170],[170,170,170,300],[320,190,400,190],[320,230,320,300]]
   .forEach(([x1,y1,x2,y2])=>{y1===y2?box(Math.min(x1,x2)-T/2,y1-T/2,Math.abs(x2-x1)+T,T,H,'--wp'):box(x1-T/2,Math.min(y1,y2)-T/2,T,Math.abs(y2-y1)+T,H,'--wp');});
  [[18,22,118,38,14],[60,86,54,30,8],[252,10,136,26,18],[20,196,92,82,12],[188,204,96,74,12],[334,124,46,24,10]]
   .forEach(([x,y,w,d,h])=>box(x,y,w,d,h,'--fp',' fp'));
  const cl=v=>Math.max(0,Math.min(1,v)),ez=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function set(p){const s=plan.style;s.setProperty('--r',ez(cl(p/.45)));s.setProperty('--wp',ez(cl((p-.35)/.4)));s.setProperty('--fp',ez(cl((p-.7)/.3)));}
  function fitIt(){const sc=Math.min(1.7,(fig.clientWidth-48)/560,(fig.clientHeight-150)/380);fit.style.transform='scale('+sc+')';}
  let raf=0,t0=0;
  function build(){cancelAnimationFrame(raf);if(reduce){set(1);return;}t0=performance.now();
    const step=t=>{const e=t-t0,p=cl(e/3200);set(p);
      if(p>=1)plan.style.setProperty('--drift',(Math.sin((e-3200)/2600)*5).toFixed(2)+'deg');
      raf=requestAnimationFrame(step);};raf=requestAnimationFrame(step);}
  set(0);fitIt();addEventListener('resize',fitIt);build();
  const rp=$('#replay');if(rp)rp.addEventListener('click',build);
}

/* contact form: ?type=Developer preselects; Netlify stores submissions */
const form=$('#form');
if(form){
  const t=new URLSearchParams(location.search).get('type'),sel=$('#f-type');
  if(t&&sel&&[...sel.options].some(o=>o.value===t))sel.value=t;
  const status=$('#status');
  form.addEventListener('submit',async e=>{e.preventDefault();
    if(!form.reportValidity())return;
    status.textContent='Sending…';
    try{const r=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});
      if(!r.ok)throw 0;form.reset();status.textContent="Sent. We'll reply on WhatsApp within a day.";}
    catch{status.textContent="Couldn't send right now. Message us on WhatsApp at +91 98344 37383.";}
  });
}
})();
