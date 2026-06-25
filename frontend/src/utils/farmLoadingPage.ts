/**
 * farmLoadingPage.ts
 *
 * Exports a self-contained HTML string that renders an animated farm scene.
 * Used in AnalyticsPage to populate a new browser tab while the PDF report
 * is being generated, keeping the user entertained with agriculture facts
 * and animations instead of a blank/plain-text page.
 *
 * Usage:
 *   import { getFarmLoadingHTML } from "../utils/farmLoadingPage";
 *   newTab.document.write(getFarmLoadingHTML());
 *   newTab.document.close();
 */
export function getFarmLoadingHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Generating Smart Farm Report\u2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      background: radial-gradient(circle at top, rgba(110,231,183,0.15), transparent 45%), linear-gradient(180deg, #08111f 0%, #0f172a 45%, #111827 100%);
      min-height: 100vh;
      color: #f8fafc;
      overflow: hidden;
    }

    /* Mock App Shell Layout */
    .app-layout {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    
    .sidebar {
      width: 288px;
      background: #022c22; /* bg-emerald-950 */
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    
    @media (max-width: 768px) {
      .sidebar {
        display: none; /* Hide on mobile to match responsive sidebar */
      }
    }
    
    .sidebar-header {
      height: 64px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      padding: 0 24px;
    }
    
    .sidebar-toggle {
      height: 32px;
      width: 32px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #34d399;
      margin-right: 12px;
    }
    
    .sidebar-logo {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    
    .sidebar-menu {
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 500;
      text-decoration: none;
      font-size: 14px;
    }
    
    .sidebar-item.active {
      background: rgba(16, 185, 129, 0.2); /* bg-emerald-500/20 */
      color: #6ee7b7; /* text-emerald-300 */
    }
    
    .sidebar-icon {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2;
    }
    
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    
    .navbar {
      height: 64px;
      background: rgba(15, 23, 42, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }
    
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-left: auto;
    }
    
    .navbar-info {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(30, 41, 59, 0.5);
      padding: 6px 16px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }
    
    .navbar-user {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #047857; /* emerald-700 */
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #fff;
    }

    .content-viewport {
      flex: 1;
      padding: 24px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Blurred Background Dashboard Content */
    .mock-dashboard {
      flex: 1;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .mock-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mock-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 12px;
    }

    .mock-tab {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
    }

    .mock-tab.active {
      background: #10b981;
      color: #000;
    }

    .mock-card {
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(15, 23, 42, 0.4);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Overlay container */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 17, 0.7); /* slate-950/70 */
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Loading Card (Square box in center) */
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      border-radius: 24px;
      border: 1px solid rgba(16, 185, 129, 0.2);
      background: rgba(15, 23, 42, 0.9);
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      max-width: 448px;
      width: 90%;
      text-align: center;
    }
    
    .logo-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .12em;
      color: #34d399;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .icon-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
    }
    
    .icon-sun {
      width: 40px;
      height: 40px;
      color: #fbbf24;
      animation: spin 8s linear infinite;
    }
    .icon-cloud-sun {
      width: 32px;
      height: 32px;
      color: #38bdf8;
      animation: bounce 2s ease-in-out infinite;
    }
    .icon-leaf {
      width: 32px;
      height: 32px;
      color: #34d399;
      animation: pulse 2s ease-in-out infinite;
    }
    .icon-sprout {
      width: 40px;
      height: 40px;
      color: #10b981;
      animation: bounce 1.6s ease-in-out infinite 0.3s;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    /* Tractor Track */
    .track {
      position: relative;
      width: 100%;
      height: 56px;
      border-radius: 12px;
      background: rgba(6, 78, 59, 0.4); /* bg-emerald-950/40 */
      border: 1px solid rgba(6, 95, 70, 0.3); /* border-emerald-800/30 */
      overflow: hidden;
      display: flex;
      align-items: flex-end;
    }
    .ground-line {
      position: absolute;
      bottom: 12px;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(6, 95, 70, 0.4);
    }
    .tractor-container {
      position: absolute;
      bottom: 12px;
      width: 36px;
      height: 36px;
      transition: transform 50ms linear;
    }
    .tractor-icon {
      width: 36px;
      height: 36px;
      color: #34d399;
    }

    /* Message */
    .message {
      text-align: center;
      color: #6ee7b7;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.025em;
      min-height: 20px;
    }

    /* Dots */
    .dots {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      animation: bounce-dot 1.2s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce-dot {
      0%, 80%, 100% { transform: translateY(0) scale(0.7); opacity: 0.5; }
      40% { transform: translateY(-6px) scale(1.3); opacity: 1; }
    }

    /* Fact Box */
    .fact-box {
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.08); /* bg-amber-900/20 */
      border: 1px solid rgba(245, 158, 11, 0.2); /* border-amber-500/20 */
      padding: 12px 16px;
      text-align: center;
      width: 100%;
    }
    .fact-text {
      font-size: 12px;
      color: #fde68a;
      font-weight: 500;
      line-height: 1.625;
    }
  </style>
</head>
<body>
  <!-- Background Layout Structure mimicking the Smart Farm app -->
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-toggle">
          <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </div>
        <span class="sidebar-logo">Smart Farm</span>
      </div>
      <div class="sidebar-menu">
        <div class="sidebar-item">
          <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          <span>Home</span>
        </div>
        <div class="sidebar-item">
          <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M1 6v14l6-4 6 4 8-4V2l-8 4-6-4z"></path></svg>
          <span>Map</span>
        </div>
        <div class="sidebar-item active">
          <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg>
          <span>Analytics</span>
        </div>
        <div class="sidebar-item">
          <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"></path></svg>
          <span>Branches</span>
        </div>
      </div>
    </aside>

    <!-- Main Viewport -->
    <div class="main-area">
      <!-- Navbar -->
      <header class="navbar">
        <div class="navbar-right">
          <div class="navbar-info">
            <span style="color:#34d399">📍 Field Location</span>
            <span style="color:#94a3b8">|</span>
            <span>72°F ☀️</span>
          </div>
          <div class="navbar-user">SF</div>
        </div>
      </header>

      <!-- Dashboard Mock Content -->
      <main class="content-viewport">
        <div class="mock-dashboard">
          <div class="mock-title-row">
            <h2 style="font-size:24px;font-weight:600;">Field Analytics</h2>
          </div>
          <div class="mock-tabs">
            <div class="mock-tab">Overview</div>
            <div class="mock-tab">Crop Health</div>
            <div class="mock-tab mock-tab active">Agronomy Recs</div>
          </div>
          <div class="mock-card">
            <div>
              <h3 style="font-size:16px;font-weight:600;margin-bottom:4px;">Agronomy Recommendations Report</h3>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);">Generating unified PDF report containing crop recommendations and weather alerts...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Loading Animation Overlay (Matches parent page LoadingFarmAnimation exactly) -->
  <div class="overlay">
    <div class="card">
      <div class="logo-text">🌾 Smart Farm Platform</div>
      <!-- Top icon row -->
      <div class="icon-row">
        <!-- Sun SVG -->
        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>
        <!-- CloudSun SVG -->
        <svg class="icon-cloud-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"></path>
          <path d="M15.9 16A5.5 5.5 0 0 0 17 11.5 5.5 5.5 0 0 0 11.5 6 5.5 5.5 0 0 0 6 11.5 5.5 5.5 0 0 0 7.1 16"></path>
          <path d="M8.3 16a3.5 3.5 0 0 1-1.3-6.8 3.5 3.5 0 0 1 6.8 1.3 3.5 3.5 0 0 1-1.3 6.8"></path>
        </svg>
        <!-- Leaf SVG -->
        <svg class="icon-leaf" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z"></path>
          <path d="M9 22v-4H5"></path>
        </svg>
        <!-- Sprout SVG -->
        <svg class="icon-sprout" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 20h10M10 20c0-3.5 1-6 2-10s2-1.5 4-3c-1.5 1.5-1.5 3.5-3 5.5s-2 4-3 7.5"></path>
          <path d="M14 20c0-3-1.5-4.5-3.5-6.5S7 11 7 8c3 0 4.5 1.5 6.5 3.5s2 3 2.5 6"></path>
        </svg>
      </div>

      <!-- Tractor Track -->
      <div class="track">
        <div class="ground-line"></div>
        <div class="tractor-container" id="tractor">
          <!-- Tractor SVG -->
          <svg class="tractor-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 17h5a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-1.124A2.5 2.5 0 0 0 16 7h-3v4H7.5A2.5 2.5 0 0 0 5 8.5V7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.124A2.5 2.5 0 0 0 6 15h3M14 17h-4"></path>
            <circle cx="6" cy="15" r="2.5"></circle>
            <circle cx="16" cy="15" r="2.5"></circle>
          </svg>
        </div>
      </div>

      <!-- Status message -->
      <div class="message" id="message">Analyzing field soil data...</div>

      <!-- Pulsing dots -->
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <!-- Did you know fact -->
      <div class="fact-box">
        <div class="fact-text" id="fact">🌾 Healthy soil contains billions of microbes per gram.</div>
      </div>
    </div>
  </div>

  <script>
    const MESSAGES = [
      "Analyzing field soil data...",
      "Computing crop suitability scores...",
      "Calculating fertilizer recommendations...",
      "Building irrigation plan...",
      "Finalizing your agronomy report...",
      "Almost done — harvesting insights...",
    ];

    const AGRONOMY_FACTS = [
      "🌾 Healthy soil contains billions of microbes per gram.",
      "💧 Drip irrigation can save up to 50% more water.",
      "🌱 Crop rotation replenishes essential soil nutrients.",
      "☀️ Smart sensors can predict yield 3 weeks in advance.",
      "🐛 60% of crop losses can be prevented with early pest alerts.",
    ];

    let msgIndex = 0;
    let factIndex = 0;
    let tractorPos = 0;
    let tractorDir = 1;

    // Cycle messages
    setInterval(() => {
      msgIndex = (msgIndex + 1) % MESSAGES.length;
      document.getElementById('message').textContent = MESSAGES[msgIndex];
    }, 3500);

    // Cycle facts
    setInterval(() => {
      factIndex = (factIndex + 1) % AGRONOMY_FACTS.length;
      document.getElementById('fact').textContent = AGRONOMY_FACTS[factIndex];
    }, 4500);

    // Animate tractor
    const tractorEl = document.getElementById('tractor');
    setInterval(() => {
      tractorPos += tractorDir * 1.5;
      if (tractorPos >= 90) {
        tractorDir = -1;
      } else if (tractorPos <= 10) {
        tractorDir = 1;
      }
      tractorEl.style.left = tractorPos + '%';
      tractorEl.style.transform = 'translateX(-50%) scaleX(' + (tractorDir === -1 ? -1 : 1) + ')';
    }, 50);
  </script>
</body>
</html>`;
}
