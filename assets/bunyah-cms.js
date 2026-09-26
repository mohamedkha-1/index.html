
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL="https://zzcxqsaitkgjlwtowsih.supabase.co";
const SUPABASE_KEY="sb_publishable_p-6AleErfPt8you1wp5vKA_amxtI9pb";
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

function setMeta(name,value,attr="name"){
  if(!value)return;
  let el=document.head.querySelector(`meta[${attr}="${name}"]`);
  if(!el){el=document.createElement("meta");el.setAttribute(attr,name);document.head.appendChild(el)}
  el.setAttribute("content",value);
}
function setCanonical(url){
  if(!url)return;
  let el=document.head.querySelector('link[rel="canonical"]');
  if(!el){el=document.createElement("link");el.rel="canonical";document.head.appendChild(el)}
  el.href=url;
}
function normalizeSaudi(v){
  let d=String(v||"").replace(/\D/g,"");
  if(d.startsWith("00966"))d=d.slice(2);
  if(d.startsWith("05"))d="966"+d.slice(1);
  else if(d.startsWith("5")&&d.length===9)d="966"+d;
  return d;
}
function applyContent(rows){
  for(const item of (rows||[])){
    if(!item.selector)continue;
    let el=null;
    try{el=document.querySelector(item.selector)}catch(_){continue}
    if(!el)continue;
    const value=item.value??"";
    if(item.apply_to==="src")el.setAttribute("src",value);
    else if(item.apply_to==="href")el.setAttribute("href",value);
    else if(item.apply_to==="alt")el.setAttribute("alt",value);
    else if(item.apply_to==="leading_text"){
      const tn=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if(tn)tn.nodeValue=value;
    }else el.textContent=value;
  }
}
function applySettings(rows){
  const s=Object.fromEntries((rows||[]).map(x=>[x.key,x.value]));
  if(s.seo_title)document.title=s.seo_title;
  setMeta("description",s.seo_description);setMeta("keywords",s.seo_keywords);setMeta("robots",s.robots_content||"index,follow");
  setCanonical(s.seo_canonical);
  setMeta("google-site-verification",s.google_site_verification);
  setMeta("msvalidate.01",s.bing_site_verification);

  const phone=normalizeSaudi(s.site_phone),wa=normalizeSaudi(s.site_whatsapp);
  const phoneBtn=$(".floating-contact.phone"),waBtn=$(".floating-contact.whatsapp");
  if(phoneBtn&&phone)phoneBtn.href="tel:+"+phone;
  if(waBtn&&wa)waBtn.href="https://wa.me/"+wa;

  const socials=$$(".social-links a");
  if(socials[0]&&s.social_x)socials[0].href=s.social_x;
  if(socials[1]&&s.social_instagram)socials[1].href=s.social_instagram;
  if(socials[2]&&s.social_linkedin)socials[2].href=s.social_linkedin;

  const footerCopy=$(".footer-copy");
  if(footerCopy&&(s.site_phone||s.site_email)){
    let box=$("#cmsContactValues");
    if(!box){box=document.createElement("div");box.id="cmsContactValues";box.style.cssText="display:flex;gap:12px;flex-wrap:wrap;justify-content:flex-end;margin-top:4px";footerCopy.appendChild(box)}
    box.innerHTML="";
    if(s.site_phone){const a=document.createElement("a");a.href="tel:+"+phone;a.dir="ltr";a.textContent=s.site_phone;box.appendChild(a)}
    if(s.site_email){const a=document.createElement("a");a.href="mailto:"+s.site_email;a.textContent=s.site_email;box.appendChild(a)}
  }

  if(/^G-[A-Z0-9]+$/i.test(s.ga4_measurement_id||""))loadGA4(s.ga4_measurement_id.trim());
  if(/^GTM-[A-Z0-9]+$/i.test(s.gtm_container_id||""))loadGTM(s.gtm_container_id.trim());
}
function loadGA4(id){
  if(window.__bunyahGA4)return;window.__bunyahGA4=true;
  const sc=document.createElement("script");sc.async=true;sc.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);document.head.appendChild(sc);
  window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config",id);
}
function loadGTM(id){
  if(window.__bunyahGTM)return;window.__bunyahGTM=true;
  window.dataLayer=window.dataLayer||[];window.dataLayer.push({"gtm.start":Date.now(),event:"gtm.js"});
  const sc=document.createElement("script");sc.async=true;sc.src="https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(id);document.head.appendChild(sc);
  const ns=document.createElement("noscript");ns.innerHTML='<iframe src="https://www.googletagmanager.com/ns.html?id='+id+'" height="0" width="0" style="display:none;visibility:hidden"></iframe>';document.body.prepend(ns);
}
async function loadCMS(){
  const [{data:content},{data:settings}]=await Promise.all([
    sb.from("cms_content").select("key,value,selector,apply_to").eq("published",true),
    sb.from("cms_settings").select("key,value").eq("is_public",true)
  ]);
  if(content)applyContent(content);
  if(settings)applySettings(settings);
}
function getFormValues(form){
  const selects=$$("select",form), q=new URLSearchParams(location.search);
  return {
    name:form.querySelector('input[placeholder="الاسم الكامل"]')?.value||"",
    phone:form.querySelector('input[placeholder="05xxxxxxxx"]')?.value||"",
    project_type:selects[0]?.value||"",
    city:form.querySelector('input[value="الرياض"]')?.value||"",
    project_stage:selects[1]?.value||"",
    external_files_url:form.querySelector(".optional-link input")?.value||"",
    source:"website",
    landing_page:location.href,
    referrer:document.referrer||"",
    utm_source:q.get("utm_source")||"",
    utm_medium:q.get("utm_medium")||"",
    utm_campaign:q.get("utm_campaign")||"",
    utm_content:q.get("utm_content")||"",
    utm_term:q.get("utm_term")||"",
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"",
    locale:navigator.language||"",
    website:""
  };
}
async function submitForm(e){
  e.preventDefault();e.stopImmediatePropagation();
  const form=e.currentTarget,msg=$("#formMsg"),btn=form.querySelector('button[type="submit"]'),fileInput=$("#projectFiles");
  if(btn){btn.disabled=true;btn.textContent="جاري الإرسال..."}if(msg)msg.textContent="";
  try{
    const files=[...(fileInput?.files||[])];
    if(files.length>8)throw new Error("الحد الأقصى 8 ملفات");
    if(files.some(f=>f.size>20*1024*1024))throw new Error("الحد الأقصى لكل ملف 20MB");
    const body=getFormValues(form);
    body.files=files.map(f=>({name:f.name,type:f.type||"application/octet-stream",size:f.size}));
    const res=await fetch(SUPABASE_URL+"/functions/v1/submit-request",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
      body:JSON.stringify(body)
    });
    const out=await res.json();
    if(!res.ok||out.error)throw new Error(out.error||"تعذر إرسال الطلب");
    let uploadFailed=false;
    for(let i=0;i<(out.uploads||[]).length;i++){
      const u=out.uploads[i],f=files[i];if(!u||!f)continue;
      const {error}=await sb.storage.from("bunyah-request-files").uploadToSignedUrl(u.path,u.token,f,{contentType:f.type||"application/octet-stream"});
      if(error){console.error(error);uploadFailed=true}
    }
    form.reset();const city=form.querySelector('input[value="الرياض"]');if(city)city.value="الرياض";if($("#fileNames"))$("#fileNames").textContent="اختر ملفًا أو أكثر";
    if(msg)msg.textContent=uploadFailed?"وصل طلبك بنجاح، لكن تعذر رفع أحد الملفات. يمكن إرسال رابطه في خانة رابط الملفات.":"وصلتنا معلومات مشروعك. سيتواصل معك فريق بُنية لاستكمال المراجعة الأولية.";
    window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"project_form_submit",request_id:out.request_id});
  }catch(err){
    console.error(err);if(msg)msg.textContent=err.message||"تعذر إرسال الطلب حاليًا. حاول مرة أخرى.";
  }finally{if(btn){btn.disabled=false;btn.textContent="أرسل مشروعك للمراجعة"}}
}
function wireForm(){
  const form=$("section#contact form.form");if(!form)return;
  form.addEventListener("submit",submitForm,true);
}
loadCMS();wireForm();
