(() => {
  document.documentElement.classList.add('js');
  const config = window.SITE_CONFIG || {};
  const hasBackend = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
  const sb = hasBackend ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;
  const categories = {pc:'تصاميم PC',mobile:'تصاميم الموبايل',gifts:'هدايا مخصصة',banners:'بنرات وصور رومات',static:'تصاميم ثابتة'};
  const PAGE=12;
  const state = {items:[],reviews:[],filter:'all',rating:0,user:null,limit:PAGE};
  const $ = (s)=>document.querySelector(s);
  const escapeHTML = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (message) => {const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2800)};
  const isNew = item => item.is_new && item.created_at && (Date.now()-new Date(item.created_at).getTime()) < 72*60*60*1000;
  const ytId = u => { const m=String(u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/); return m?m[1]:null };
  const formatMedia = (item, preview=false) => {
    if((item.file_type||'')==='youtube'){
      const id=ytId(item.url); if(!id) return `<div class="placeholder-art"><div class="avatar"><i></i></div></div>`;
      if(preview) return `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${escapeHTML(item.title||'')}" loading="lazy" /><span class="yt-play" aria-hidden="true">&#9654;</span>`;
      const vertical=String(item.url).includes('/shorts/');
      return `<iframe class="yt-frame${vertical?' vertical':''}" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="${escapeHTML(item.title||'تصميم')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
    if(!item.url) return `<div class="placeholder-art"><div class="avatar"><i></i></div><span class="tag">${escapeHTML(item.display||'ZH')}</span></div>`;
    const url=escapeHTML(item.url),type=(item.file_type||'').toLowerCase();
    if(type.startsWith('video/')) return `<video src="${url}" ${preview?'muted autoplay loop playsinline':'controls'}></video>`;
    return `<img src="${url}" alt="${escapeHTML(item.title)}" loading="lazy" />`;
  };
  const card = (item, latest=false) => `<article class="work-card" data-id="${escapeHTML(item.id)}" tabindex="0" role="button" aria-label="عرض ${escapeHTML(item.title)}"><div class="work-media">${latest&&isNew(item)?'<span class="new-tag">NEW / جديد</span>':''}${formatMedia(item,true)}</div><div class="work-meta"><div>${item.title?`<div class="work-title">${escapeHTML(item.title)}</div>`:''}<div class="work-category">${escapeHTML(categories[item.category]||'تصميم')}</div></div><div class="work-price">${escapeHTML(item.price||'')}</div></div></article>`;
  const renderItems = () => {
    renderFlow();
    const activeItems=state.items.filter(i=>!isNew(i));
    const latest=state.items.filter(isNew).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    $('#latestGrid').innerHTML=latest.length?latest.map(i=>card(i,true)).join(''):'<div class="empty-state">ماكو أعمال جديدة حالياً — قريباً نضيف تصاميم جديدة.</div>';
    const filtered=activeItems.filter(i=>state.filter==='all'||i.category===state.filter).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    $('#galleryGrid').innerHTML=filtered.length?filtered.slice(0,state.limit).map(i=>card(i)).join(''):'<div class="empty-state">ماكو أعمال بهذا القسم حالياً.</div>';
    const more=$('#loadMore');more.classList.toggle('hidden',filtered.length<=state.limit);more.textContent=`عرض المزيد (${filtered.length-state.limit})`;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
    document.querySelectorAll('.work-card').forEach(el=>{el.addEventListener('click',()=>openItem(el.dataset.id));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openItem(el.dataset.id)}})});
  };
  const openItem = id => {const item=state.items.find(i=>String(i.id)===String(id));if(!item)return;$('#modalContent').innerHTML=formatMedia(item,false);$('#modalCaption').textContent=`${item.title?item.title+' — ':''}${categories[item.category]||'تصميم'} ${item.price||''}`;$('#designModal').classList.add('open');$('#designModal').setAttribute('aria-hidden','false')};
  const closeModal=()=>{$('#designModal').classList.remove('open');$('#designModal').setAttribute('aria-hidden','true');$('#modalContent').innerHTML=''};
  // ---- hero 3D flow
  const flow={items:[],active:0,timer:null,built:'',moved:false};
  const flowLayout=()=>{
    const cards=[...document.querySelectorAll('#flowTrack .flow-card')],n=cards.length;if(!n)return;
    const w=cards[0].offsetWidth,step=w*0.66,reach=Math.min(2,Math.floor(n/2));
    cards.forEach((el,i)=>{
      let off=((i-flow.active)%n+n)%n;if(off>n/2)off-=n;
      const a=Math.abs(off),show=a<=reach;
      el.style.transform=`translateX(${off*step}px) translateZ(${-a*130}px) rotateY(${-off*40}deg)`;
      el.style.opacity=show?String(1-a*.3):'0';el.style.pointerEvents=show?'auto':'none';
      el.style.zIndex=String(50-a);el.style.filter=a?`brightness(${1-a*.22})`:'none';
      el.classList.toggle('is-active',off===0);el.dataset.off=off;
    });
    document.querySelectorAll('#flowDots button').forEach((d,i)=>d.classList.toggle('on',i===flow.active));
  };
  const flowGo=d=>{const n=flow.items.length;if(!n)return;flow.active=((flow.active+d)%n+n)%n;flowLayout()};
  const flowPlay=()=>{clearInterval(flow.timer);if(matchMedia('(prefers-reduced-motion: reduce)').matches||flow.items.length<2)return;flow.timer=setInterval(()=>flowGo(1),3400)};
  const renderFlow=()=>{
    const items=state.items.slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,9);
    const key=items.map(i=>i.id).join(',');if(key===flow.built)return;flow.built=key;flow.items=items;flow.active=0;
    $('#flowTrack').innerHTML=items.map(i=>`<div class="flow-card" data-id="${escapeHTML(i.id)}" role="button" tabindex="0" aria-label="عرض التصميم">${formatMedia(i,true)}</div>`).join('');
    $('#flowDots').innerHTML=items.map((_,i)=>`<button type="button" data-i="${i}" aria-label="تصميم ${i+1}"></button>`).join('');
    flowLayout();flowPlay();
  };
  (()=>{
    const box=$('#heroFlow');let x0=null;
    $('#flowPrev').addEventListener('click',()=>{flowGo(-1);flowPlay()});
    $('#flowNext').addEventListener('click',()=>{flowGo(1);flowPlay()});
    $('#flowDots').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;flow.active=Number(b.dataset.i);flowLayout();flowPlay()});
    box.addEventListener('click',e=>{if(flow.moved){flow.moved=false;return}const c=e.target.closest('.flow-card');if(!c)return;if(c.dataset.off==='0')openItem(c.dataset.id);else{const i=[...c.parentNode.children].indexOf(c);flow.active=i;flowLayout();flowPlay()}});
    box.addEventListener('pointerdown',e=>{x0=e.clientX;flow.moved=false});
    box.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>45){flow.moved=true;flowGo(dx<0?1:-1);flowPlay()}});
    box.addEventListener('pointerleave',()=>{x0=null});
    box.addEventListener('mouseenter',()=>clearInterval(flow.timer));box.addEventListener('mouseleave',flowPlay);
    window.addEventListener('resize',flowLayout);
  })();
  const demoItems=[
    {id:'demo-1',title:'',category:'pc',price:'$10',display:'PC',created_at:new Date(Date.now()-2*86400000).toISOString(),is_new:false},
    {id:'demo-2',title:'',category:'mobile',price:'$5',display:'MOBILE',created_at:new Date(Date.now()-4*86400000).toISOString(),is_new:false},
    {id:'demo-3',title:'',category:'gifts',price:'$15',display:'GIFT',created_at:new Date(Date.now()-6*86400000).toISOString(),is_new:false},
    {id:'demo-4',title:'',category:'banners',price:'حسب التصميم',display:'BANNER',created_at:new Date(Date.now()-8*86400000).toISOString(),is_new:false},
    {id:'demo-5',title:'',category:'static',price:'حسب التصميم',display:'STATIC',created_at:new Date(Date.now()-9*86400000).toISOString(),is_new:false}
  ];
  const loadItems=async()=>{if(!sb){state.items=demoItems;renderItems();return}try{const {data,error}=await sb.from('designs').select('*').order('created_at',{ascending:false});if(error)throw error;state.items=data||[];renderItems()}catch(e){console.error(e);state.items=demoItems;renderItems();toast('تعذر تحميل الأعمال. تحقق من إعداد قاعدة البيانات.')}};
  const renderReviews=()=>{const list=state.reviews;const avg=list.length?list.reduce((sum,r)=>sum+r.rating,0)/list.length:0;$('#averageRating').textContent=list.length?avg.toFixed(1):'—';$('#summaryStars').textContent=list.length?'★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg)):'☆☆☆☆☆';$('#reviewCount').textContent=list.length?`${list.length} تقييم`:'بانتظار أول تقييم';$('#reviewList').innerHTML=list.slice(0,6).map(r=>`<article class="review-card"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><p>${escapeHTML(r.comment||'')}</p><strong>${escapeHTML(r.name||'عميل')}</strong></article>`).join('')};
  const loadReviews=async()=>{if(!sb){state.reviews=JSON.parse(localStorage.getItem('motion_demo_reviews')||'[]');renderReviews();return}try{const {data,error}=await sb.from('reviews').select('*').order('created_at',{ascending:false});if(error)throw error;state.reviews=data||[];renderReviews()}catch(e){console.error(e);state.reviews=[];renderReviews()}};
  $('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.filter=b.dataset.filter;state.limit=PAGE;renderItems()});
  $('#loadMore').addEventListener('click',()=>{state.limit+=PAGE;renderItems()});
  $('#starPicker').addEventListener('click',e=>{const b=e.target.closest('[data-star]');if(!b)return;state.rating=Number(b.dataset.star);$('#starPicker').querySelectorAll('button').forEach(x=>x.classList.toggle('selected',Number(x.dataset.star)<=state.rating));$('#starPicker').querySelectorAll('button').forEach(x=>x.textContent=Number(x.dataset.star)<=state.rating?'★':'☆')});
  $('#reviewForm').addEventListener('submit',async e=>{e.preventDefault();if(!state.rating){toast('اختار عدد النجوم أولاً');return}const review={name:$('#reviewName').value.trim()||'عميل',rating:state.rating,comment:$('#reviewComment').value.trim()};if(sb){const {error}=await sb.from('reviews').insert(review);if(error){toast('ما قدرنا نحفظ التقييم، حاول مرة ثانية');return}await loadReviews()}else{state.reviews.unshift({...review,id:Date.now(),created_at:new Date().toISOString()});localStorage.setItem('motion_demo_reviews',JSON.stringify(state.reviews));renderReviews();toast('تم حفظ التقييم محلياً للتجربة — مو ظاهر للزوار الآخرين')}e.target.reset();state.rating=0;$('#starPicker').querySelectorAll('button').forEach(x=>{x.textContent='☆';x.classList.remove('selected')})});
  $('#modalClose').addEventListener('click',closeModal);$('#designModal').addEventListener('click',e=>{if(e.target===$('#designModal'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  $('#menuToggle').addEventListener('click',()=>{const o=$('#mainNav').classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(o))});document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>$('.main-nav').classList.remove('open')));
  $('#year').textContent=new Date().getFullYear();
  // Admin UI: Supabase Auth is required to upload and manage public gallery assets.
  const panel=$('#adminPanel');
  $('#adminTrigger').addEventListener('click',()=>{panel.classList.toggle('open');panel.setAttribute('aria-hidden',String(!panel.classList.contains('open')))});
  $('#adminClose').addEventListener('click',()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true')});
  const setAdmin=logged=>{$('#loginForm').classList.toggle('hidden',logged);$('#uploadForm').classList.toggle('hidden',!logged);$('#adminStatus').textContent=logged?'تم تسجيل الدخول. ارفع تصميمك من النموذج أدناه.':(hasBackend?'سجّل دخولك بحساب الإدارة لإضافة أعمال.':'الموقع يعمل بوضع المعاينة. إعداد Supabase مطلوب لرفع أعمال حقيقية وإظهارها للجميع.')};
  if(!hasBackend){setAdmin(false);$('#loginForm').addEventListener('submit',e=>{e.preventDefault();toast('ربط Supabase مطلوب لتفعيل لوحة الإدارة')});$('#uploadForm').addEventListener('submit',e=>{e.preventDefault();toast('رفع الأعمال يحتاج ربط قاعدة البيانات')})}
  else{
    sb.auth.getSession().then(({data})=>{state.user=data.session?.user||null;setAdmin(Boolean(state.user))});sb.auth.onAuthStateChange((_event,session)=>{state.user=session?.user||null;setAdmin(Boolean(state.user))});
    $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('#adminEmail').value,password:$('#adminPassword').value});if(error)toast('فشل تسجيل الدخول: '+error.message);else toast('تم تسجيل الدخول')});
    $('#logoutButton').addEventListener('click',async()=>{await sb.auth.signOut();toast('تم تسجيل الخروج')});
    $('#uploadForm').addEventListener('submit',async e=>{e.preventDefault();if(!state.user){toast('سجّل الدخول أولاً');return}const ytRaw=$('#designYoutube').value.trim();if(ytRaw){if(!ytId(ytRaw)){toast('رابط يوتيوب غير صحيح');return}const ytRow={title:$('#designTitle').value.trim(),category:$('#designCategory').value,price:$('#designPrice').value.trim(),url:ytRaw,file_type:'youtube',storage_path:null,is_new:$('#designIsNew').checked,created_at:new Date().toISOString()};const {error:ytErr}=await sb.from('designs').insert(ytRow);if(ytErr){toast('فشل حفظ التصميم: '+ytErr.message);return}e.target.reset();$('#designIsNew').checked=true;await loadItems();toast('تمت إضافة التصميم للموقع');return}const file=$('#designFile').files[0];if(!file){toast('حط رابط يوتيوب أو اختار ملف');return}const safe=file.name.replace(/[^\w.\-]/g,'_');const path=`${Date.now()}-${safe}`;toast('جاري رفع الملف…');const {data:up,error:upErr}=await sb.storage.from('design-assets').upload(path,file,{cacheControl:'3600',upsert:false});if(upErr){toast('فشل رفع الملف: '+upErr.message);return}const {data:pub}=sb.storage.from('design-assets').getPublicUrl(up.path);const fresh=$('#designIsNew').checked;const row={title:$('#designTitle').value.trim(),category:$('#designCategory').value,price:$('#designPrice').value.trim(),url:pub.publicUrl,file_type:file.type,storage_path:up.path,is_new:fresh,created_at:new Date().toISOString()};const {error}=await sb.from('designs').insert(row);if(error){await sb.storage.from('design-assets').remove([up.path]);toast('فشل حفظ بيانات التصميم: '+error.message);return}e.target.reset();$('#designIsNew').checked=true;await loadItems();toast('تمت إضافة التصميم للموقع')});
  }
  const watch=()=>{const els=document.querySelectorAll('.reveal:not(.in)');if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.12});els.forEach(e=>io.observe(e))};
  watch();
  loadItems();loadReviews();
})();
