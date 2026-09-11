import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generateDocumentationPdf(outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: 'UAForge Comprehensive Technical Architecture & API Documentation',
        Author: 'UAForge Engineering Team',
        Subject: 'User-Agent Intelligence, Datasets, Consensus Scoring & API Reference',
        Keywords: 'User-Agent, Architecture, API, Confidence Scoring, Zero Duplicate',
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Helpers
    const primaryColor = '#059669'; // Emerald
    const darkNeutral = '#18181b'; // Zinc 900
    const bodyColor = '#27272a'; // Zinc 800
    const mutedColor = '#71717a'; // Zinc 500
    const cardBg = '#f4f4f5'; // Zinc 100

    function drawHeader(title: string, subtitle?: string) {
      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(title);
      if (subtitle) {
        doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text(subtitle, { lineGap: 6 });
      }
      doc.moveDown(0.8);
      // Underline bar
      const y = doc.y;
      doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, y).lineTo(545, y).stroke();
      doc.moveDown(0.8);
    }

    function drawSection(heading: string) {
      doc.moveDown(0.6);
      doc.fillColor(darkNeutral).fontSize(13).font('Helvetica-Bold').text(heading, { lineGap: 4 });
      doc.moveDown(0.2);
    }

    function drawSubSection(sub: string) {
      doc.moveDown(0.4);
      doc.fillColor(primaryColor).fontSize(10.5).font('Helvetica-Bold').text(sub);
      doc.moveDown(0.1);
    }

    function drawParagraph(text: string) {
      doc.fillColor(bodyColor).fontSize(9.5).font('Helvetica').text(text, {
        align: 'justify',
        lineGap: 3,
      });
      doc.moveDown(0.4);
    }

    function drawBullet(title: string, desc: string) {
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text(`•  ${title}: `, {
        continued: true,
      });
      doc.fillColor(bodyColor).font('Helvetica').text(desc, {
        lineGap: 2.5,
      });
      doc.moveDown(0.25);
    }

    function drawCodeBox(code: string) {
      const yStart = doc.y;
      doc.fillColor(cardBg).rect(50, yStart, 495, 45).fill();
      doc.strokeColor('#e4e4e7').lineWidth(1).rect(50, yStart, 495, 45).stroke();
      doc.fillColor('#0f172a').fontSize(8.5).font('Courier').text(code, 60, yStart + 8, {
        width: 475,
        lineGap: 2,
      });
      doc.y = yStart + 52;
      doc.moveDown(0.2);
    }

    // ==========================================
    // PAGE 1: TITLE & EXECUTIVE SUMMARY
    // ==========================================
    doc.fillColor(darkNeutral).fontSize(26).font('Helvetica-Bold').text('UAFORGE PLATFORM SPECIFICATION', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('System Architecture, Datasets, Consensus Engine & API Reference', { align: 'center' });
    doc.moveDown(0.4);
    doc.fillColor(mutedColor).fontSize(9).font('Helvetica').text('Production Grade User-Agent Research, Multi-Source Normalization, & Zero-Duplicate Guarantee', { align: 'center' });
    
    doc.moveDown(1.2);
    doc.strokeColor('#10b981').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    drawSection('1. Executive Project Overview');
    drawParagraph(
      'UAForge is a production-grade User-Agent intelligence, research, validation, and generation engine. Unlike naive generators that assemble arbitrary, synthetic substrings, UAForge operates on an absolute reality mandate: zero synthetic fabrication. Every User-Agent served by the platform originates from real-world telemetry feeds, public data consensuses, and validated browser distributions.'
    );
    drawParagraph(
      'The platform addresses the critical vulnerabilities in web scraping, automated testing, cybersecurity research, and anti-bot mitigation where synthetic or malformed User-Agents cause immediate CAPTCHA challenges, IP blocks, or request drops due to structural and architectural impossibilities.'
    );

    drawSection('2. Core Architectural Pillars');
    drawBullet('Zero Synthetic Fabrication', 'Eliminates randomized or fictitious version combinations. UAs must trace to concrete browser versions and genuine operating systems.');
    drawBullet('Multi-Source Consensus Engine', 'Cross-references strings across 4 distinct data sources: Local High-Confidence Corpus, Microlink HQ, Intoli Real-World Browser Feeds, and WhatIsMyBrowser Commercial API.');
    drawBullet('Zero-Duplicate Guarantee', 'Implements private client-isolated exclusion tracking via a dedicated PostgreSQL/SQLite ledger. Once a User-Agent is delivered to a client, it is never served to that client again.');
    drawBullet('Deterministic Confidence Matrix', 'Evaluates structural validity, OS-browser compatibility, parser completeness, device consistency, and source corroboration into a normalized 0-100 score.');
    drawBullet('Strict 0-39 Suspicious Quarantine', 'Aggressively flags and penalizes incompatible combinations (e.g., modern Safari on Windows) with explicit warning banners and exclusion from priority queues.');

    doc.addPage();

    // ==========================================
    // PAGE 2: SOURCE PROVIDERS & HARVESTING
    // ==========================================
    drawHeader('3. Source Providers & Data Ingestion Pipeline');
    
    drawParagraph(
      'UAForge unifies four specialized ingestion providers through an abstracted interface (UserAgentProvider). Ingested items are normalized, deduplicated by exact string hash, parsed for structural tokens, and stored in the primary database.'
    );

    drawSubSection('Provider 1: Local High-Confidence Verified Corpus (Internal DB)');
    drawParagraph(
      'A curated, seed repository of modern stable desktop, tablet, and mobile browsers (Chrome 120-132, Firefox 128-133, Safari 17-18, Edge 120-131) pre-tested against strict platform compatibility standards. Serves as the instant, ultra-low latency fallback baseline with zero network dependencies.'
    );

    drawSubSection('Provider 2: Microlink HQ Top User-Agents (microlinkhq/top-user-agents)');
    drawParagraph(
      'Aggregates high-traffic browser headers actively utilized across the web. The ingest pipeline streams directly from official GitHub raw endpoints (desktop.json, mobile.json, index.json) and Kikobeats crawler agents, backed by jsDelivr CDN fallbacks. It provides high-frequency real-world distribution data.'
    );

    drawSubSection('Provider 3: Intoli Real-World User-Agents (Intoli Dataset)');
    drawParagraph(
      'Derived from real browser visits across thousands of websites. Ingested via live GZIP streaming (user-agents.json.gz). Intoli data contains rich hardware metadata including deviceCategory, platform, viewport dimensions, and visit probability weights, allowing UAForge to prioritize high-frequency genuine web traffic.'
    );

    drawSubSection('Provider 4: WhatIsMyBrowser API (Commercial Parser & Verification)');
    drawParagraph(
      'Leveraged as an authoritative commercial verification layer. Communicates with api.whatismybrowser.com/api/v2/user_agent_parse. Validates software recognition, operating system flags, hardware types, and official authenticity consensus.'
    );

    drawSection('Automated Background Sync Worker');
    drawParagraph(
      'UAForge runs an automated daily synchronization worker (cron job) and supports on-demand manual triggers via POST /api/v1/sources/:id/sync. During synchronization, the pipeline runs a 5-step lifecycle: (1) Fetch raw strings, (2) Structural validation, (3) Parser extraction, (4) Compatibility audit, and (5) Upsert into the relational database with updated consensus counts.'
    );

    doc.addPage();

    // ==========================================
    // PAGE 3: CONFIDENCE SCORING & COMPATIBILITY
    // ==========================================
    drawHeader('4. Confidence Scoring Engine & Logic Matrix');

    drawParagraph(
      'The confidence score is a deterministic, transparent composite metric (0 to 100) calculated in ConfidenceService.ts. It evaluates both empirical corroboration (source presence) and intrinsic syntactic/compatibility characteristics.'
    );

    drawSubSection('Mathematical Weight Distribution');
    drawBullet('Base Single-Source Presence (+48 pts)', 'Awarded immediately if the User-Agent is discovered in at least one verified real-world source dataset.');
    drawBullet('Multi-Source Corroboration (+20 pts per source, max +40 pts)', 'Extra points awarded for each independent source that contains the string. Two sources = +20, three+ sources = +40.');
    drawBullet('Platform Compatibility Status (+16 pts / -30 to -65 pts)', 'Awarded if OS, browser, and hardware tokens align. If an impossible combination is detected (e.g. Safari on Windows), a severe -55 pt penalty is levied.');
    drawBullet('Parser Completeness (+14 pts)', 'Proportional to the percentage of standard tokens recognized (browser name, version, major version, OS name, OS version).');
    drawBullet('Device Consistency (+8 pts)', 'Validates that mobile OS (Android, iOS) aligns with mobile device flags, and desktop OS aligns with desktop flags.');
    drawBullet('Recency Bonus (+5 pts)', 'Awarded if the data source was verified within active synchronization windows.');

    drawSubSection('Confidence Score Tiers');
    drawBullet('90 – 100 (Very High Confidence)', 'Top-tier production grade. Multi-source verified, flawless platform compatibility, zero anomalies. Prioritized by default in generation APIs.');
    drawBullet('75 – 89 (High Confidence)', 'Robust real-world browser with full syntactic validity and proven distribution.');
    drawBullet('60 – 74 (Medium Confidence)', 'Valid User-Agent present in single data source or with minor legacy browser flags.');
    drawBullet('40 – 59 (Low Confidence)', 'Syntactically valid but rare or aging version distribution.');
    drawBullet('0 – 39 (Suspicious Range)', 'QUARANTINE ZONE. Contains impossible pairings, missing headers, or structural anomalies. High probability of immediate CAPTCHA or anti-bot challenge. Accompanied by critical visual warning banners.');

    drawSubSection('Deterministic Compatibility Rules (CompatibilityValidator.ts)');
    drawBullet('Safari on Windows/Android', 'Safari discontinued Windows support after v5.1.7 (2012). Any modern Safari (v6+) on Windows or Android is flagged as INCOMPATIBLE.');
    drawBullet('Internet Explorer on Mobile/Linux', 'IE was never released natively for Android, iOS, or modern Linux. Flagged as INCOMPATIBLE.');
    drawBullet('EdgeHTML on Mac/Linux', 'Edge versions < 79 were proprietary EdgeHTML (Windows only). Chromium Edge (79+) is valid across all OS.');
    drawBullet('Header Envelope & Parentheses', 'Must begin with Mozilla/ or Opera/ and maintain strictly balanced opening and closing parentheses.');

    doc.addPage();

    // ==========================================
    // PAGE 4: ZERO-DUPLICATE ARCHITECTURE
    // ==========================================
    drawHeader('5. Zero-Duplicate Delivery Guarantee');

    drawParagraph(
      'A primary pain point in automated workflows and testing is duplicate delivery, which leads to repeated sessions with the exact same fingerprint. UAForge solves this with a cryptographically tracked, client-isolated exclusion ledger.'
    );

    drawSubSection('Database Schema & State Tracking');
    drawParagraph(
      'A dedicated table `served_user_agents` records every transaction:'
    );
    drawCodeBox(
      'CREATE TABLE served_user_agents (\n' +
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
      '  client_id VARCHAR(100) NOT NULL,\n' +
      '  user_agent_id INTEGER NOT NULL REFERENCES user_agents(id),\n' +
      '  served_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
      '  UNIQUE(client_id, user_agent_id)\n' +
      ');'
    );

    drawSubSection('Query Execution Flow (Zero Overlap)');
    drawBullet('Client Identification', 'Requests transmit a client identifier via query param (?clientId=), header (x-client-id), or authenticated session token.');
    drawBullet('Dynamic SQL Exclusion', 'Database queries evaluate: `WHERE id NOT IN (SELECT user_agent_id FROM served_user_agents WHERE client_id = ?)` alongside platform, country, and confidence criteria.');
    drawBullet('Atomic Registration', 'Upon selection, delivered IDs are immediately inserted into `served_user_agents`. Consecutive batch calls guarantee 0% duplicate collision.');
    drawBullet('Audit & Reset APIs', 'Clients can view their total delivered count via GET /api/v1/generate/served-stats and purge their exclusion history with POST /api/v1/generate/reset-served.');

    doc.moveDown(0.8);
    drawSection('6. Multi-Platform Responsive Design Standards');
    drawParagraph(
      'The user interface is engineered for seamless operation on both Mobile Phones and Desktop PCs:'
    );
    drawBullet('Desktop Experience', 'Expansive 1280px container with live system telemetry, multi-column bento grids, and full data-table views.');
    drawBullet('Mobile Smartphone Experience', 'Thumb-accessible fixed bottom navigation bar (fixed bottom-0), smooth sliding hamburger drawer, adaptive card layouts replacing wide tables, and minimum 44px touch targets.');

    doc.addPage();

    // ==========================================
    // PAGE 5: COMPLETE REST API SPECIFICATION
    // ==========================================
    drawHeader('7. Complete REST API Reference');

    drawParagraph(
      'Base Endpoint: `/api/v1` (Accepts & returns JSON payloads).'
    );

    drawSubSection('1. Generate User-Agents: POST /api/v1/generate');
    drawParagraph('Generates zero-duplicate, real-world User-Agents based on targeting criteria:');
    drawCodeBox(
      '// Request Body\n' +
      '{\n' +
      '  "quantity": 5,                     // 1 to 50 (default: 1)\n' +
      '  "minimumConfidence": 80,           // 0 to 100 (default: 80)\n' +
      '  "platform": "Windows",             // Optional: Windows, macOS, Linux, Android, iOS\n' +
      '  "deviceType": "desktop",           // Optional: desktop, mobile, tablet\n' +
      '  "browser": "Chrome",               // Optional: Chrome, Firefox, Safari, Edge\n' +
      '  "country": "US",                   // Optional: US, GB, DE, JP, etc.\n' +
      '  "clientId": "client_abc_123"       // Private isolation ledger token\n' +
      '}'
    );

    drawSubSection('2. Zero-Duplicate Served Stats: GET /api/v1/generate/served-stats');
    drawParagraph('Query params: `?clientId=client_abc_123`');
    drawParagraph('Returns `{ "data": { "servedCount": 42, "lastServedAt": "2026-09-11T10:20:00Z" } }`.');

    drawSubSection('3. Reset Served Pool: POST /api/v1/generate/reset-served');
    drawParagraph('Payload: `{ "clientId": "client_abc_123" }`. Clears exclusion ledger so all records can be delivered again.');

    drawSubSection('4. Inspect & Analyze User-Agent: POST /api/v1/analyze');
    drawParagraph('Evaluates an arbitrary User-Agent string against the full compatibility and confidence rules:');
    drawCodeBox(
      '// Request Body: { "userAgent": "Mozilla/5.0 ... " }\n' +
      '// Returns: { score: 92, status: "Very High Confidence", \n' +
      '//           compatibility: { isValid: true, checksPassed: [...] },\n' +
      '//           warnings: [], breakdown: { baseSourceScore: 48, ... } }'
    );

    drawSubSection('5. System Health & Consensus: GET /api/v1/health');
    drawParagraph('Returns system status, database connection, uptime, and latency checks for all 4 providers.');

    drawSubSection('6. Trigger Source Synchronization: POST /api/v1/sources/:id/sync');
    drawParagraph('Triggers real-time synchronization for a specific source (`local`, `microlink`, `intoli`, `whatismybrowser`, or `all`).');

    drawSubSection('7. Generation History & Audit: GET /api/v1/history');
    drawParagraph('Returns historic generation batches, parameters used, timestamps, and delivered record counts.');

    // Final Footer Note on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text(
        `UAForge Technical Documentation  •  Page ${i + 1} of ${range.count}  •  Confidential & Proprietary`,
        50,
        780,
        { align: 'center', width: 495 }
      );
    }

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', (err) => reject(err));
  });
}
