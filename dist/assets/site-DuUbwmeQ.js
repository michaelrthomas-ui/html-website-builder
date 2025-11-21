import{a as p}from"./index-Ss7HALal.js";const u=void 0,y=void 0,h=p(u,y),f="sites";async function g(){const o=window.location.pathname.split("/"),i=o[o.length-1];if(!i){l();return}try{const{data:r,error:n}=await h.from("sites").select("*").eq("slug",i).maybeSingle();if(n||!r){l();return}const m=`${i}/${r.main_file}`,{data:s,error:e}=await h.storage.from(f).download(m);if(e){l();return}const t=await s.text(),d=b(t,i),c=document.getElementById("siteFrame"),a=c.contentDocument||c.contentWindow.document;a.open(),a.write(d),a.close(),document.getElementById("loadingScreen").style.display="none",c.classList.add("loaded"),document.title=r.main_file.replace(".html","")||"Hosted Site"}catch(r){console.error("Error loading site:",r),l()}}function b(o,i){const r=`${u}/storage/v1/object/public/${f}/${i}/`,n=document.createElement("div");n.innerHTML=o,n.querySelectorAll("[src], [href]").forEach(e=>{if(e.hasAttribute("src")){const t=e.getAttribute("src");t&&!t.startsWith("http")&&!t.startsWith("//")&&!t.startsWith("data:")&&e.setAttribute("src",r+t.replace(/^\.?\//,""))}if(e.hasAttribute("href")){const t=e.getAttribute("href");t&&!t.startsWith("http")&&!t.startsWith("//")&&!t.startsWith("#")&&!t.startsWith("data:")&&!t.startsWith("mailto:")&&(t.endsWith(".css")||t.endsWith(".ico"))&&e.setAttribute("href",r+t.replace(/^\.?\//,""))}});let s=n.innerHTML;return s=s.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi,(e,t)=>{const d=t.replace(/url\(['"]?(?!http|\/\/|data:)([^'")\s]+)['"]?\)/gi,(c,a)=>`url('${r}${a.replace(/^\.?\//,"")}')`);return e.replace(t,d)}),s=s.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi,(e,t)=>(e.includes("src="),e)),`
        <!DOCTYPE html>
        <html>
        <head>
            <base href="${r}">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            ${s}
        </body>
        </html>
    `}function l(){document.getElementById("loadingScreen").style.display="none",document.getElementById("errorScreen").style.display="flex"}g();
