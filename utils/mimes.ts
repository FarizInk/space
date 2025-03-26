interface MimesObjectType {
    [key: string]: string;
}

export const extensionsToMimes: Record<string, string[]> = {
    // Image formats
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    gif: ["image/gif"],
    webp: ["image/webp"],
    bmp: ["image/bmp"],
    avif: ["image/avif"],
    ico: ["image/x-icon", "image/vnd.microsoft.icon"],
    tiff: ["image/tiff"],
    svg: ["image/svg+xml"],
    apng: ["image/apng"],
    heic: ["image/heic"],
    heif: ["image/heif"],

    // Audio formats
    mp3: ["audio/mpeg"],
    wav: ["audio/wav"],
    oga: ["audio/ogg"],
    aac: ["audio/aac"],
    weba: ["audio/webm"],
    midi: ["audio/midi", "audio/x-midi"],
    opus: ["audio/opus"],
    m4a: ["audio/x-m4a"],
    aiff: ["audio/aiff", "audio/x-aiff"],

    // Video formats
    mp4: ["video/mp4"],
    webm: ["video/webm"],
    ogv: ["video/ogg"],
    avi: ["video/x-msvideo"],
    mov: ["video/quicktime"],
    mpeg: ["video/mpeg"],
    mkv: ["video/x-matroska"],
    ts: ["video/mp2t"],
    "3gp": ["video/3gpp", "audio/3gpp"],
    "3g2": ["video/3gpp2", "audio/3gpp2"],

    // Documents
    pdf: ["application/pdf"],
    doc: ["application/msword"],
    docx: [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    xls: ["application/vnd.ms-excel"],
    xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ppt: ["application/vnd.ms-powerpoint"],
    pptx: [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    odt: ["application/vnd.oasis.opendocument.text"],
    odp: ["application/vnd.oasis.opendocument.presentation"],
    ods: ["application/vnd.oasis.opendocument.spreadsheet"],
    odg: ["application/vnd.oasis.opendocument.graphics"],
    rtf: ["application/rtf"],
    epub: ["application/epub+zip"],
    azw: ["application/vnd.amazon.ebook"],

    // Archives
    zip: ["application/zip"],
    rar: ["application/vnd.rar"],
    "7z": ["application/x-7z-compressed"],
    tar: ["application/x-tar"],
    gz: ["application/gzip"],
    bz: ["application/x-bzip"],
    bz2: ["application/x-bzip2"],
    arc: ["application/x-freearc"],
    iso: ["application/x-iso9660-image"],
    dmg: ["application/x-apple-diskimage"],

    // Code/Text
    js: ["text/javascript"],
    mjs: ["text/javascript"],
    json: ["application/json"],
    jsonld: ["application/ld+json"],
    xml: ["application/xml", "text/xml", "application/atom+xml"],
    css: ["text/css"],
    csv: ["text/csv"],
    html: ["text/html"],
    txt: ["text/plain"],
    md: ["text/markdown"],
    yaml: ["text/yaml"],
    vtt: ["text/vtt"],
    py: ["text/x-python"],
    sql: ["text/x-sql"],
    php: ["application/x-httpd-php"],
    sh: ["application/x-sh"],
    csh: ["application/x-csh"],

    // Fonts
    woff: ["font/woff"],
    woff2: ["font/woff2"],
    ttf: ["font/ttf"],
    otf: ["font/otf"],
    eot: ["application/vnd.ms-fontobject"],

    // System/Executables
    bin: ["application/octet-stream"],
    exe: ["application/x-msdownload"],
    dll: ["application/x-msdownload"],
    apk: ["application/vnd.android.package-archive"],
    deb: ["application/x-deb"],
    rpm: ["application/x-rpm"],
    mpkg: ["application/vnd.apple.installer+xml"],

    // Specialized formats
    cda: ["application/x-cdf"],
    vsd: ["application/vnd.visio"],
    xul: ["application/vnd.mozilla.xul+xml"],
    ps: ["application/postscript"],
    ai: ["application/illustrator"],
    blend: ["application/x-blender"],
    stl: ["model/stl", "application/sla"],
    gltf: ["model/gltf+json"],
    glb: ["model/gltf-binary"],
    pcap: ["application/vnd.tcpdump.pcap"],
    unitypackage: ["application/vnd.unity"],
    srt: ["application/x-subrip"],
    m3u8: ["application/vnd.apple.mpegurl", "application/x-mpegURL"],
};

// Build the MIME type map with priority extensions
export const mimes: MimesObjectType = {};

// First pass: Add all MIME types with priority to first-defined extensions
for (const [ext, types] of Object.entries(extensionsToMimes)) {
    for (const mimeType of types) {
        if (!mimes[mimeType]) {
            mimes[mimeType] = ext;
        }
    }
}

// Manual overrides for common preferences
mimes["image/jpeg"] = "jpg";
mimes["text/javascript"] = "js";
// mimes["video/mp4"] = "mp4";
// mimes["audio/mpeg"] = "mp3";
// mimes["application/xml"] = "xml";
// mimes["model/stl"] = "stl";
