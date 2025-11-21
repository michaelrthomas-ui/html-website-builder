import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'sites';
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const elements = {
    uploadBox: document.getElementById('uploadBox'),
    fileInput: document.getElementById('fileInput'),
    filePreview: document.getElementById('filePreview'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    uploadButton: document.getElementById('uploadButton'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    successSection: document.getElementById('successSection'),
    generatedUrl: document.getElementById('generatedUrl'),
    copyButton: document.getElementById('copyButton'),
    uploadAnother: document.getElementById('uploadAnother'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    tryAgain: document.getElementById('tryAgain')
};

let selectedFile = null;

async function initializeStorage() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: MAX_FILE_SIZE
        });
    }
}

function generateSlug() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showSection(section) {
    Object.values(elements).forEach(el => {
        if (el && el.classList && el.classList.contains('hidden')) {
            return;
        }
    });

    elements.filePreview.classList.add('hidden');
    elements.progressSection.classList.add('hidden');
    elements.successSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
    elements.uploadBox.classList.remove('hidden');

    if (section === 'preview') {
        elements.uploadBox.classList.add('hidden');
        elements.filePreview.classList.remove('hidden');
    } else if (section === 'progress') {
        elements.uploadBox.classList.add('hidden');
        elements.progressSection.classList.remove('hidden');
    } else if (section === 'success') {
        elements.uploadBox.classList.add('hidden');
        elements.successSection.classList.remove('hidden');
    } else if (section === 'error') {
        elements.uploadBox.classList.add('hidden');
        elements.errorSection.classList.remove('hidden');
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}

function handleFileSelect(file) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        showError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
        return;
    }

    const isHTML = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
    const isZIP = file.name.toLowerCase().endsWith('.zip');

    if (!isHTML && !isZIP) {
        showError('Please upload an HTML file or ZIP archive');
        return;
    }

    selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    showSection('preview');
}

async function findMainHtmlFile(zip) {
    const files = Object.keys(zip.files).filter(name =>
        !zip.files[name].dir &&
        (name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm'))
    );

    const indexFile = files.find(name =>
        name.toLowerCase().includes('index.html') || name.toLowerCase().includes('index.htm')
    );

    if (indexFile) return indexFile;
    if (files.length > 0) return files[0];

    throw new Error('No HTML files found in ZIP archive');
}

async function uploadZipFile(file, slug) {
    elements.progressText.textContent = 'Extracting ZIP file...';

    const zip = await JSZip.loadAsync(file);
    const mainFile = await findMainHtmlFile(zip);
    const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);

    elements.progressText.textContent = `Uploading ${files.length} files...`;

    let uploaded = 0;
    for (const fileName of files) {
        const fileData = await zip.files[fileName].async('blob');
        const filePath = `${slug}/${fileName}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileData, {
                contentType: getContentType(fileName),
                upsert: false
            });

        if (error) throw error;

        uploaded++;
        const progress = (uploaded / files.length) * 100;
        elements.progressFill.style.width = `${progress}%`;
    }

    return {
        mainFile,
        fileCount: files.length,
        totalSize: file.size
    };
}

async function uploadHtmlFile(file, slug) {
    elements.progressText.textContent = 'Uploading file...';

    const filePath = `${slug}/index.html`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            contentType: 'text/html',
            upsert: false
        });

    if (error) throw error;

    elements.progressFill.style.width = '100%';

    return {
        mainFile: 'index.html',
        fileCount: 1,
        totalSize: file.size
    };
}

function getContentType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const types = {
        'html': 'text/html',
        'htm': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'webp': 'image/webp',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'eot': 'application/vnd.ms-fontobject'
    };
    return types[ext] || 'application/octet-stream';
}

async function handleUpload() {
    if (!selectedFile) return;

    try {
        elements.uploadButton.disabled = true;
        showSection('progress');
        elements.progressFill.style.width = '0%';

        const slug = generateSlug();

        const isZIP = selectedFile.name.toLowerCase().endsWith('.zip');
        const uploadResult = isZIP
            ? await uploadZipFile(selectedFile, slug)
            : await uploadHtmlFile(selectedFile, slug);

        const { error: dbError } = await supabase
            .from('sites')
            .insert({
                slug: slug,
                main_file: uploadResult.mainFile,
                file_count: uploadResult.fileCount,
                total_size: uploadResult.totalSize
            });

        if (dbError) throw dbError;

        const siteUrl = `${window.location.origin}/site/${slug}`;
        elements.generatedUrl.value = siteUrl;
        showSection('success');

    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'Upload failed. Please try again.');
    } finally {
        elements.uploadButton.disabled = false;
    }
}

elements.uploadBox.addEventListener('click', () => {
    elements.fileInput.click();
});

elements.fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

elements.uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadBox.classList.add('drag-over');
});

elements.uploadBox.addEventListener('dragleave', () => {
    elements.uploadBox.classList.remove('drag-over');
});

elements.uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadBox.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files[0]);
});

elements.uploadButton.addEventListener('click', handleUpload);

elements.copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(elements.generatedUrl.value);
        elements.copyButton.textContent = 'Copied!';
        elements.copyButton.classList.add('copied');
        setTimeout(() => {
            elements.copyButton.textContent = 'Copy';
            elements.copyButton.classList.remove('copied');
        }, 2000);
    } catch (error) {
        console.error('Copy failed:', error);
    }
});

elements.uploadAnother.addEventListener('click', () => {
    selectedFile = null;
    elements.fileInput.value = '';
    showSection('upload');
});

elements.tryAgain.addEventListener('click', () => {
    selectedFile = null;
    elements.fileInput.value = '';
    showSection('upload');
});

initializeStorage();
