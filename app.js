(() => {
  document.documentElement.classList.add('js');
  const config = window.SITE_CONFIG || {};
  const hasBackend = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
  const sb = hasBackend ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;
  const categories = {pc:'تصاميم PC',mobile:'تصاميم الموبايل',gifts:'هدايا مخصصة',banners:'بنرات وصور رومات',static:'تصاميم ثابتة'};
  const PRICES={pc:'$10',mobile:'$5',gifts:'$15',banners:'حسب الطلب',static:'حسب الطلب'};
  const priceOf=item=>PRICES[item.category]||item.price||'';
  const MAX_FILES=10;
  const PAGE=matchMedia('(max-width:760px)').matches?6:12;
  const state = {items:[],ads:[],reviews:[],filter:'all',rating:0,user:null,limit:PAGE};
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
    if(type.startsWith('video/')) return preview?`<video data-src="${url}" muted loop playsinline preload="none"></video>`:`<video src="${url}" controls autoplay playsinline></video>`;
    return `<img src="${url}" alt="${escapeHTML(item.title)}" loading="lazy" decoding="async" />`;
  };
  // Previews load/play only while on screen (keeps the page light on phones)
  const vidOn=v=>{if(!v.getAttribute('src')&&v.dataset.src)v.src=v.dataset.src;const p=v.play();if(p&&p.catch)p.catch(()=>{})};
  const vidOff=v=>{v.pause();if(v.getAttribute('src')){v.removeAttribute('src');v.load()}};
  const vidIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(en=>en.isIntersecting?vidOn(en.target):vidOff(en.target)),{rootMargin:'120px'}):null;
  const watchVideos=()=>{if(vidIO)vidIO.disconnect();document.querySelectorAll('video[data-src]').forEach(v=>{if(v.closest('.flow-card,.ad-item'))return;vidIO?vidIO.observe(v):vidOn(v)})};
  const card = (item, latest=false) => `<article class="work-card" data-id="${escapeHTML(item.id)}" tabindex="0" role="button" aria-label="عرض ${escapeHTML(item.title)}"><div class="work-media">${latest&&isNew(item)?'<span class="new-tag">NEW / جديد</span>':''}${formatMedia(item,true)}</div><div class="work-meta"><div>${item.title?`<div class="work-title">${escapeHTML(item.title)}</div>`:''}<div class="work-category">${escapeHTML(categories[item.category]||'تصميم')}</div></div><div class="work-price">${escapeHTML(priceOf(item))}</div></div></article>`;
  const renderItems = () => {
    renderFlow();
    const activeItems=state.items.filter(i=>!isNew(i));
    const latest=state.items.filter(isNew).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    $('#latestGrid').innerHTML=latest.length?latest.map(i=>card(i,true)).join(''):'<div class="empty-state">ماكو أعمال جديدة حالياً — قريباً نضيف تصاميم جديدة.</div>';
    const filtered=activeItems.filter(i=>state.filter==='all'||i.category===state.filter).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    $('#galleryGrid').innerHTML=filtered.length?filtered.slice(0,state.limit).map(i=>card(i)).join(''):'<div class="empty-state">ماكو أعمال بهذا القسم حالياً.</div>';
    const more=$('#loadMore');more.classList.toggle('hidden',filtered.length<=state.limit);more.textContent=`عرض المزيد (${filtered.length-state.limit})`;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
    watchVideos();
    document.querySelectorAll('.work-card').forEach(el=>{el.addEventListener('click',()=>openItem(el.dataset.id));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openItem(el.dataset.id)}})});
  };
  const openItem = id => {const item=state.items.find(i=>String(i.id)===String(id));if(!item)return;$('#modalContent').innerHTML=formatMedia(item,false);$('#modalCaption').textContent=`${item.title?item.title+' — ':''}${categories[item.category]||'تصميم'} ${priceOf(item)}`;$('#designModal').classList.add('open');$('#designModal').setAttribute('aria-hidden','false')};
  const closeModal=()=>{$('#designModal').classList.remove('open');$('#designModal').setAttribute('aria-hidden','true');$('#modalContent').innerHTML=''};
  // ---- hero 3D flow
  const flow={items:[],active:0,timer:null,built:'',moved:false,ready:false};
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
      const v=el.querySelector('video[data-src]');if(v){if(flow.ready&&flow.visible!==false&&a<=1){if(!v.getAttribute('src')){v.preload=a===0?'auto':'metadata';v.src=v.dataset.src}if(a===0){const p=v.play();if(p&&p.catch)p.catch(()=>{})}else v.pause()}else vidOff(v)}
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
    // start hero videos only after the page finished loading, so text/buttons/ad appear first
    const flowReady=()=>setTimeout(()=>{flow.ready=true;flowLayout()},400);
    if(document.readyState==='complete')flowReady();else window.addEventListener('load',flowReady);
    if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(en=>{flow.visible=en.isIntersecting;flowLayout()})).observe(box);
  })();
  const demoItems=[
    {id:'demo-1',title:'',category:'pc',price:'$10',display:'PC',created_at:new Date(Date.now()-2*86400000).toISOString(),is_new:false},
    {id:'demo-2',title:'',category:'mobile',price:'$5',display:'MOBILE',created_at:new Date(Date.now()-4*86400000).toISOString(),is_new:false},
    {id:'demo-3',title:'',category:'gifts',price:'$15',display:'GIFT',created_at:new Date(Date.now()-6*86400000).toISOString(),is_new:false},
    {id:'demo-4',title:'',category:'banners',price:'حسب التصميم',display:'BANNER',created_at:new Date(Date.now()-8*86400000).toISOString(),is_new:false},
    {id:'demo-5',title:'',category:'static',price:'حسب التصميم',display:'STATIC',created_at:new Date(Date.now()-9*86400000).toISOString(),is_new:false}
  ];
  const loadItems=async()=>{if(!sb){state.items=demoItems;renderItems();return}try{const {data,error}=await sb.from('designs').select('*').order('created_at',{ascending:false});if(error)throw error;state.items=data||[];renderItems();renderAdminDesigns()}catch(e){console.error(e);state.items=demoItems;renderItems();toast('تعذر تحميل الأعمال. تحقق من إعداد قاعدة البيانات.')}};
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
  const renderAdminDesigns=()=>{const box=$('#adminDesignList');if(!box)return;if(!state.user){box.innerHTML='<p class="admin-empty">سجّل الدخول لإدارة الأعمال.</p>';return}if(!state.items.length){box.innerHTML='<p class="admin-empty">ماكو أعمال مرفوعة حالياً.</p>';return}box.innerHTML=state.items.map(item=>`<div class="admin-design-row"><div class="admin-design-info"><strong>${escapeHTML(item.title||'تصميم بدون عنوان')}</strong><small>${escapeHTML(categories[item.category]||'تصميم')} · ${item.file_type==='youtube'?'YouTube':(String(item.file_type||'').startsWith('video/')?'فيديو':'صورة')}</small></div><button class="admin-delete" type="button" data-delete-id="${escapeHTML(item.id)}" aria-label="حذف التصميم">حذف 🗑️</button></div>`).join('')};
  // ---- rotating ad slot (replaces hero title while at least one active ad exists)
  const ad={items:[],i:0,timer:null,built:''};
  const safeLink=u=>/^https?:\/\//i.test(u||'')?u:'';
  const adMedia=a=>{const url=escapeHTML(a.media_url);return String(a.file_type||'').startsWith('video/')?`<video data-src="${url}" muted loop playsinline preload="none"></video>`:`<img src="${url}" alt="إعلان" />`};
  const adGo=n=>{const els=[...document.querySelectorAll('#adTrack .ad-item')];if(!els.length)return;ad.i=((n%els.length)+els.length)%els.length;els.forEach((el,k)=>{const on=k===ad.i;el.classList.toggle('on',on);const v=el.querySelector('video');if(v){if(on){if(!v.getAttribute('src'))v.src=v.dataset.src;try{v.currentTime=0}catch(_){}const p=v.play();if(p&&p.catch)p.catch(()=>{})}else vidOff(v)}});document.querySelectorAll('#adDots button').forEach((d,k)=>d.classList.toggle('on',k===ad.i))};
  const adPlay=()=>{clearInterval(ad.timer);if(matchMedia('(prefers-reduced-motion: reduce)').matches||ad.items.length<2)return;ad.timer=setInterval(()=>adGo(ad.i+1),10000)};
  const renderAds=()=>{
    const list=state.ads.filter(a=>a.active&&a.media_url).sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    $('#adSlot').classList.toggle('hidden',!list.length);$('#heroCopy').classList.toggle('hidden',list.length>0);
    const key=list.map(a=>a.id+a.media_url+(a.link_url||'')).join('|');if(key===ad.built)return;ad.built=key;ad.items=list;ad.i=0;clearInterval(ad.timer);
    if(!list.length){$('#adTrack').innerHTML='';$('#adDots').innerHTML='';return}
    $('#adTrack').innerHTML=list.map(a=>{const l=safeLink(a.link_url),inner=adMedia(a);return l?`<a class="ad-item" href="${escapeHTML(l)}" target="_blank" rel="noopener sponsored">${inner}</a>`:`<div class="ad-item">${inner}</div>`}).join('');
    $('#adDots').innerHTML=list.length>1?list.map((_,k)=>`<button type="button" data-k="${k}" aria-label="إعلان ${k+1}"></button>`).join(''):'';
    adGo(0);adPlay();
  };
  $('#adDots').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;adGo(Number(b.dataset.k));adPlay()});
  const renderAdminAds=()=>{const box=$('#adminAdList');if(!box)return;if(!state.user){box.innerHTML='';return}if(!state.ads.length){box.innerHTML='<p class="admin-empty">ماكو إعلانات حالياً — الموقع يعرض العنوان الأساسي.</p>';return}box.innerHTML=state.ads.map(a=>{const vid=String(a.file_type||'').startsWith('video/');const url=escapeHTML(a.media_url);return `<div class="admin-design-row"><div class="admin-design-info"><strong>${vid?'🎬 فيديو':'🖼️ صورة'} · ${a.active?'ظاهر':'مخفي'}</strong><small dir="ltr">${escapeHTML(a.link_url||'بدون رابط')}</small></div><div class="admin-row-actions"><button class="admin-toggle${a.active?'':' off'}" type="button" data-ad-toggle="${escapeHTML(a.id)}">${a.active?'إخفاء':'إظهار'}</button><button class="admin-delete" type="button" data-ad-delete="${escapeHTML(a.id)}" aria-label="حذف الإعلان">🗑️</button></div></div>`}).join('')};
  const loadAds=async()=>{if(!sb){state.ads=[];renderAds();return}try{const {data,error}=await sb.from('ads').select('*').order('created_at',{ascending:true});if(error)throw error;state.ads=data||[]}catch(e){console.warn('ads table not ready',e);state.ads=[]}renderAds();renderAdminAds()};
  const setAdmin=logged=>{$('#loginForm').classList.toggle('hidden',logged);$('#adminTools').classList.toggle('hidden',!logged);$('#adminStatus').textContent=logged?'تم تسجيل الدخول. ارفع تصميمك أو أدر أعمالك من الأسفل.':(hasBackend?'سجّل دخولك بحساب الإدارة لإضافة أعمال.':'الموقع يعمل بوضع المعاينة. إعداد Supabase مطلوب لرفع أعمال حقيقية وإظهارها للجميع.');renderAdminDesigns();renderAdminAds()};
  $('#adminDesignList').addEventListener('click',async e=>{const btn=e.target.closest('[data-delete-id]');if(!btn)return;if(!state.user){toast('سجّل الدخول أولاً');return}const item=state.items.find(x=>String(x.id)===btn.dataset.deleteId);if(!item)return;if(!confirm(`متأكد تريد حذف «${item.title||'هذا التصميم'}» نهائياً؟`))return;btn.disabled=true;btn.textContent='جارٍ الحذف…';try{if(item.storage_path){const {error:storageError}=await sb.storage.from('design-assets').remove([item.storage_path]);if(storageError)throw storageError}const {error}=await sb.from('designs').delete().eq('id',item.id);if(error)throw error;await loadItems();renderAdminDesigns();toast('تم حذف التصميم بنجاح')}catch(err){console.error(err);btn.disabled=false;btn.textContent='حذف 🗑️';toast('فشل الحذف: '+(err.message||'تحقق من الصلاحيات'))}});
  const updatePrice=()=>{$('#designPriceShow').textContent=PRICES[$('#designCategory').value]||'—'};
  const updateFileHint=()=>{const n=$('#designFile').files.length;$('#fileCount').textContent=n?`تم اختيار ${n} من ${MAX_FILES} ملفات.`:'ما تم اختيار ملفات.'};
  $('#designCategory').addEventListener('change',updatePrice);updatePrice();
  $('#designFile').addEventListener('change',()=>{if($('#designFile').files.length>MAX_FILES){$('#designFile').value='';toast(`الحد الأقصى ${MAX_FILES} ملفات بالمرة الوحدة، اختار أقل`)}updateFileHint()});
  if(!hasBackend){setAdmin(false);$('#loginForm').addEventListener('submit',e=>{e.preventDefault();toast('ربط Supabase مطلوب لتفعيل لوحة الإدارة')});$('#uploadForm').addEventListener('submit',e=>{e.preventDefault();toast('رفع الأعمال يحتاج ربط قاعدة البيانات')});$('#adForm').addEventListener('submit',e=>{e.preventDefault();toast('الإعلانات تحتاج ربط قاعدة البيانات')})}
  else{
    sb.auth.getSession().then(({data})=>{state.user=data.session?.user||null;setAdmin(Boolean(state.user))});sb.auth.onAuthStateChange((_event,session)=>{state.user=session?.user||null;setAdmin(Boolean(state.user))});
    $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('#adminEmail').value,password:$('#adminPassword').value});if(error)toast('فشل تسجيل الدخول: '+error.message);else toast('تم تسجيل الدخول')});
    $('#logoutButton').addEventListener('click',async()=>{await sb.auth.signOut();toast('تم تسجيل الخروج')});
    const ytRow=(category,price,url,fresh,title)=>({title,category,price,url,file_type:'youtube',storage_path:null,is_new:fresh,created_at:new Date().toISOString()});
    $('#uploadForm').addEventListener('submit',async e=>{
      e.preventDefault();if(!state.user){toast('سجّل الدخول أولاً');return}
      const btn=$('#uploadBtn'),category=$('#designCategory').value,price=PRICES[category]||'',fresh=$('#designIsNew').checked;
      const resetForm=()=>{e.target.reset();$('#designCategory').value=category;updateFileHint();updatePrice()};
      const ytRaw=$('#designYoutube').value.trim();
      if(ytRaw){
        if(!ytId(ytRaw)){toast('رابط يوتيوب غير صحيح');return}
        const {error}=await sb.from('designs').insert(ytRow(category,price,ytRaw,fresh,$('#designTitle').value.trim()));
        if(error){toast('فشل حفظ التصميم: '+error.message);return}
        resetForm();await loadItems();toast('تمت إضافة التصميم للموقع');return;
      }
      const files=[...$('#designFile').files];
      if(!files.length){toast('حط رابط يوتيوب أو اختار ملفات');return}
      if(files.length>MAX_FILES){toast(`الحد الأقصى ${MAX_FILES} ملفات بالمرة الوحدة`);return}
      const title=files.length===1?$('#designTitle').value.trim():'';
      btn.disabled=true;let ok=0;const failed=[];
      for(let k=0;k<files.length;k++){
        const file=files[k];btn.textContent=`جاري رفع ${k+1} من ${files.length}…`;
        const safe=file.name.replace(/[^\w.\-]/g,'_'),path=`${Date.now()}-${k}-${safe}`;
        const {data:up,error:upErr}=await sb.storage.from('design-assets').upload(path,file,{cacheControl:'3600',upsert:false});
        if(upErr){failed.push(file.name);console.error(upErr);continue}
        const {data:pub}=sb.storage.from('design-assets').getPublicUrl(up.path);
        const row={title,category,price,url:pub.publicUrl,file_type:file.type,storage_path:up.path,is_new:fresh,created_at:new Date().toISOString()};
        const {error}=await sb.from('designs').insert(row);
        if(error){await sb.storage.from('design-assets').remove([up.path]);failed.push(file.name);console.error(error);continue}
        ok++;
      }
      btn.disabled=false;btn.textContent='رفع التصميم';
      if(ok)resetForm();await loadItems();
      toast(failed.length?`تم رفع ${ok} وفشل ${failed.length}: ${failed.slice(0,2).join('، ')}`:(ok>1?`تمت إضافة ${ok} تصاميم للموقع`:'تمت إضافة التصميم للموقع'));
    });
    // ads admin
    $('#adForm').addEventListener('submit',async e=>{
      e.preventDefault();if(!state.user){toast('سجّل الدخول أولاً');return}
      const file=$('#adFile').files[0];if(!file){toast('اختار صورة أو فيديو للإعلان');return}
      const link=$('#adLink').value.trim();if(link&&!safeLink(link)){toast('الرابط لازم يبدأ بـ https://');return}
      const btn=$('#adBtn');btn.disabled=true;btn.textContent='جاري رفع الإعلان…';
      try{
        const safe=file.name.replace(/[^\w.\-]/g,'_'),path=`ads/${Date.now()}-${safe}`;
        const {data:up,error:upErr}=await sb.storage.from('design-assets').upload(path,file,{cacheControl:'3600',upsert:false});if(upErr)throw upErr;
        const {data:pub}=sb.storage.from('design-assets').getPublicUrl(up.path);
        const {error}=await sb.from('ads').insert({media_url:pub.publicUrl,file_type:file.type,link_url:link,storage_path:up.path,active:true});
        if(error){await sb.storage.from('design-assets').remove([up.path]);throw error}
        e.target.reset();await loadAds();toast('تمت إضافة الإعلان');
      }catch(err){console.error(err);toast('فشل إضافة الإعلان: '+(err.message||'تأكد من تشغيل ملف SQL الجديد'))}
      btn.disabled=false;btn.textContent='إضافة الإعلان';
    });
    $('#adminAdList').addEventListener('click',async e=>{
      const t=e.target.closest('[data-ad-toggle]'),d=e.target.closest('[data-ad-delete]');if(!t&&!d)return;if(!state.user){toast('سجّل الدخول أولاً');return}
      const id=(t||d).dataset.adToggle||(t||d).dataset.adDelete,a=state.ads.find(x=>String(x.id)===String(id));if(!a)return;
      try{
        if(t){const {error}=await sb.from('ads').update({active:!a.active}).eq('id',a.id);if(error)throw error;toast(a.active?'تم إخفاء الإعلان':'تم إظهار الإعلان')}
        else{if(!confirm('متأكد تريد حذف هذا الإعلان نهائياً؟'))return;if(a.storage_path){const {error:se}=await sb.storage.from('design-assets').remove([a.storage_path]);if(se)throw se}const {error}=await sb.from('ads').delete().eq('id',a.id);if(error)throw error;toast('تم حذف الإعلان')}
        await loadAds();
      }catch(err){console.error(err);toast('فشلت العملية: '+(err.message||'تحقق من الصلاحيات'))}
    });
  }
  const watch=()=>{const els=document.querySelectorAll('.reveal:not(.in)');if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.12});els.forEach(e=>io.observe(e))};
  watch();
  loadItems();loadReviews();loadAds();
})();
