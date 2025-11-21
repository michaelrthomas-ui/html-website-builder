import{a as p}from"./index-Ss7HALal.js";const u=void 0,y="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw",h=p(u,y),f="sites";async function g(){const o=window.location.pathname.split("/"),s=o[o.length-1];if(!s){l();return}try{const{data:r,error:n}=await h.from("sites").select("*").eq("slug",s).maybeSingle();if(n||!r){l();return}const m=`${s}/${r.main_file}`,{data:i,error:e}=await h.storage.from(f).download(m);if(e){l();return}const t=await i.text(),d=b(t,s),c=document.getElementById("siteFrame"),a=c.contentDocument||c.contentWindow.document;a.open(),a.write(d),a.close(),document.getElementById("loadingScreen").style.display="none",c.classList.add("loaded"),document.title=r.main_file.replace(".html","")||"Hosted Site"}catch(r){console.error("Error loading site:",r),l()}}function b(o,s){const r=`${u}/storage/v1/object/public/${f}/${s}/`,n=document.createElement("div");n.innerHTML=o,n.querySelectorAll("[src], [href]").forEach(e=>{if(e.hasAttribute("src")){const t=e.getAttribute("src");t&&!t.startsWith("http")&&!t.startsWith("//")&&!t.startsWith("data:")&&e.setAttribute("src",r+t.replace(/^\.?\//,""))}if(e.hasAttribute("href")){const t=e.getAttribute("href");t&&!t.startsWith("http")&&!t.startsWith("//")&&!t.startsWith("#")&&!t.startsWith("data:")&&!t.startsWith("mailto:")&&(t.endsWith(".css")||t.endsWith(".ico"))&&e.setAttribute("href",r+t.replace(/^\.?\//,""))}});let i=n.innerHTML;return i=i.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi,(e,t)=>{const d=t.replace(/url\(['"]?(?!http|\/\/|data:)([^'")\s]+)['"]?\)/gi,(c,a)=>`url('${r}${a.replace(/^\.?\//,"")}')`);return e.replace(t,d)}),i=i.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi,(e,t)=>(e.includes("src="),e)),`
        <!DOCTYPE html>
        <html>
        <head>
            <base href="${r}">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            ${i}
        </body>
        </html>
    `}function l(){document.getElementById("loadingScreen").style.display="none",document.getElementById("errorScreen").style.display="flex"}g();
