import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'sites';

async function loadSite() {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
        showError();
        return;
    }

    try {
        const { data: site, error: dbError } = await supabase
            .from('sites')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (dbError || !site) {
            showError();
            return;
        }

        const mainFilePath = `${slug}/${site.main_file}`;

        const { data: fileData, error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .download(mainFilePath);

        if (storageError) {
            showError();
            return;
        }

        const htmlContent = await fileData.text();

        const modifiedHtml = modifyHtmlPaths(htmlContent, slug);

        const iframe = document.getElementById('siteFrame');
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        iframeDoc.open();
        iframeDoc.write(modifiedHtml);
        iframeDoc.close();

        document.getElementById('loadingScreen').style.display = 'none';
        iframe.classList.add('loaded');

        document.title = site.main_file.replace('.html', '') || 'Hosted Site';

    } catch (error) {
        console.error('Error loading site:', error);
        showError();
    }
}

function modifyHtmlPaths(html, slug) {
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${slug}/`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const elements = tempDiv.querySelectorAll('[src], [href]');
    elements.forEach(el => {
        if (el.hasAttribute('src')) {
            const src = el.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
                el.setAttribute('src', baseUrl + src.replace(/^\.?\//, ''));
            }
        }
        if (el.hasAttribute('href')) {
            const href = el.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('data:') && !href.startsWith('mailto:')) {
                if (href.endsWith('.css') || href.endsWith('.ico')) {
                    el.setAttribute('href', baseUrl + href.replace(/^\.?\//, ''));
                }
            }
        }
    });

    let modifiedHtml = tempDiv.innerHTML;

    modifiedHtml = modifiedHtml.replace(
        /<style[^>]*>([\s\S]*?)<\/style>/gi,
        (match, cssContent) => {
            const modifiedCss = cssContent.replace(
                /url\(['"]?(?!http|\/\/|data:)([^'")\s]+)['"]?\)/gi,
                (match, url) => `url('${baseUrl}${url.replace(/^\.?\//, '')}')`
            );
            return match.replace(cssContent, modifiedCss);
        }
    );

    modifiedHtml = modifiedHtml.replace(
        /<script[^>]*>([\s\S]*?)<\/script>/gi,
        (match, jsContent) => {
            if (match.includes('src=')) {
                return match;
            }
            return match;
        }
    );

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <base href="${baseUrl}">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            ${modifiedHtml}
        </body>
        </html>
    `;
}

function showError() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'flex';
}

loadSite();
