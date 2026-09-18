// ─────────────────────────────────────────────
// frea — real document generators for seed content
// ─────────────────────────────────────────────
//
// Produces genuinely valid files in each format frea accepts, so the seed
// catalogue exercises the real upload/download path rather than pretending to.
// Everything here is demo content and is wiped by `npm run reset:launch`.

import JSZip from 'jszip';

// ─── Markdown ───────────────────────────────────────────

export function makeMarkdown({ title, subtitle, author, university, bullets }) {
  return `# ${title}

*${subtitle}*

**By ${author}** · ${university} · shared on frea

---

## What's inside

${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

---

## How to use this

Work through one section at a time rather than reading it end to end. Most of the
value is in the worked examples — copy them, break them, and rebuild them in your
own words. That is what makes it stick.

If something here doesn't land, book a free 20-minute call with ${author.split(' ')[0]}
on frea and ask directly. That's what the calls are for.

---

*Shared free on frea — peer mentoring for UK university students.*
`;
}

// ─── LaTeX ──────────────────────────────────────────────

export function makeLatex({ title, subtitle, author, university, bullets }) {
  const esc = (s) => String(s).replace(/([&%$#_{}])/g, '\\$1');
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=2.2cm]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\title{${esc(title)}}
\\author{${esc(author)} \\\\ \\small ${esc(university)}}
\\date{Shared on frea}

\\begin{document}
\\maketitle

\\begin{abstract}
${esc(subtitle)}
\\end{abstract}

\\section*{What's inside}
\\begin{enumerate}[itemsep=4pt]
${bullets.map(b => `  \\item ${esc(b)}`).join('\n')}
\\end{enumerate}

\\section*{How to use this}
Work through one section at a time rather than reading end to end. Most of the value
sits in the worked examples: copy them, break them, then rebuild them in your own
words. That is what makes the material stick.

\\vspace{1em}
\\noindent If something here does not land, book a free 20-minute call with
${esc(author.split(' ')[0])} on frea and ask directly.

\\vfill
\\noindent\\rule{\\textwidth}{0.4pt}\\\\
\\small Shared free on frea --- peer mentoring for UK university students.

\\end{document}
`;
}

// ─── PDF ────────────────────────────────────────────────
//
// Hand-built minimal PDF 1.4. No dependency: a PDF is a handful of numbered
// objects plus a byte-offset table, and we only need text on a page.

export function makePdf({ title, subtitle, author, university, bullets }) {
  // PDF string literals escape backslash and both parens.
  const esc = (s) => String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // WinAnsi has no smart punctuation; fold it to ASCII.
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '');

  const wrap = (text, max) => {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > max) {
        if (line) lines.push(line.trim());
        line = w;
      } else {
        line = (line + ' ' + w).trim();
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  };

  // Build the content stream: a sequence of positioned text runs.
  const runs = [];
  let y = 780;
  const push = (text, size, font, gap) => {
    runs.push(`BT /${font} ${size} Tf 60 ${y} Td (${esc(text)}) Tj ET`);
    y -= gap;
  };

  push(title, 20, 'F2', 26);
  for (const l of wrap(subtitle, 68)) push(l, 11, 'F1', 15);
  y -= 6;
  push(`${author}  -  ${university}`, 10, 'F1', 26);

  push("What's inside", 14, 'F2', 20);
  bullets.forEach((b, i) => {
    const lines = wrap(`${i + 1}. ${b}`, 72);
    lines.forEach((l, idx) => push(idx === 0 ? l : `   ${l}`, 11, 'F1', 15));
    y -= 4;
  });

  y -= 10;
  push('How to use this', 14, 'F2', 20);
  for (const l of wrap('Work through one section at a time rather than reading end to end. Most of the value is in the worked examples: copy them, break them, and rebuild them in your own words.', 74)) {
    push(l, 11, 'F1', 15);
  }
  y -= 10;
  for (const l of wrap(`If something here does not land, book a free 20-minute call with ${author.split(' ')[0]} on frea and ask directly.`, 74)) {
    push(l, 11, 'F1', 15);
  }

  y -= 16;
  push('Shared free on frea - peer mentoring for UK university students.', 9, 'F1', 0);

  const stream = runs.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
      + '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  ];

  // Assemble, tracking byte offsets for the xref table.
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

// ─── PPTX ───────────────────────────────────────────────
//
// An Office Open XML package: a zip of XML parts. This builds the minimum set
// PowerPoint, Keynote and Google Slides will all open.

export async function makePptx({ title, subtitle, author, university, bullets }) {
  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const zip = new JSZip();
  const slideCount = 2;

  zip.file('[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
${Array.from({ length: slideCount }, (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n')}
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`);

  zip.folder('_rels').file('.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  zip.folder('ppt').file('presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>
${Array.from({ length: slideCount }, (_, i) =>
      `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n')}
</p:sldIdLst>
<p:sldSz cx="12192000" cy="6858000"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

  zip.folder('ppt').folder('_rels').file('presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${Array.from({ length: slideCount }, (_, i) =>
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${slideCount + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`);

  // A text box shape.
  const shape = (id, name, x, y, cx, cy, paragraphs) => `
<p:sp>
<p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
<p:txBody><a:bodyPr wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>
${paragraphs}
</p:txBody>
</p:sp>`;

  const para = (text, size, bold = 0, bullet = false) => `
<a:p>${bullet ? '<a:pPr marL="285750" indent="-285750"><a:buChar char="&#8226;"/></a:pPr>' : '<a:pPr><a:buNone/></a:pPr>'}
<a:r><a:rPr lang="en-GB" sz="${size}" b="${bold}" dirty="0"/><a:t>${esc(text)}</a:t></a:r></a:p>`;

  const slideXml = (body) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
${body}
</p:spTree></p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sld>`;

  const slides = [
    slideXml(
      shape(2, 'Title', 838200, 1900000, 10515600, 2000000,
        para(title, 4000, 1) + para(subtitle, 1800)) +
      shape(3, 'Byline', 838200, 4200000, 10515600, 600000,
        para(`${author} · ${university} · shared on frea`, 1400))
    ),
    slideXml(
      shape(2, 'Heading', 838200, 700000, 10515600, 900000,
        para("What's inside", 3200, 1)) +
      shape(3, 'Body', 838200, 1800000, 10515600, 4000000,
        bullets.map(b => para(b, 1800, 0, true)).join(''))
    )
  ];

  const slidesFolder = zip.folder('ppt').folder('slides');
  slides.forEach((xml, i) => slidesFolder.file(`slide${i + 1}.xml`, xml));

  const slideRels = slidesFolder.folder('_rels');
  slides.forEach((_, i) => slideRels.file(`slide${i + 1}.xml.rels`,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`));

  zip.folder('ppt').folder('slideLayouts').file('slideLayout1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);

  zip.folder('ppt').folder('slideLayouts').folder('_rels').file('slideLayout1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

  zip.folder('ppt').folder('slideMasters').file('slideMaster1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);

  zip.folder('ppt').folder('slideMasters').folder('_rels').file('slideMaster1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

  const colour = (name, val) => `<a:${name}><a:srgbClr val="${val}"/></a:${name}>`;
  zip.folder('ppt').folder('theme').file('theme1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="frea">
<a:themeElements>
<a:clrScheme name="frea">
${colour('dk1', '171717')}${colour('lt1', 'FDFBF9')}${colour('dk2', '2B1A07')}${colour('lt2', 'F7EFE9')}
${colour('accent1', 'FF6F1E')}${colour('accent2', '3B82F6')}${colour('accent3', '22C55E')}
${colour('accent4', 'FF66CF')}${colour('accent5', 'CE500A')}${colour('accent6', 'BEBCBB')}
${colour('hlink', 'FF6F1E')}${colour('folHlink', 'CE500A')}
</a:clrScheme>
<a:fontScheme name="frea">
<a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
</a:fontScheme>
<a:fmtScheme name="frea">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements>
</a:theme>`);

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
