/**
 * farmLoadingPage.ts
 *
 * Exports a self-contained HTML string that renders an animated farm scene.
 * Used in DashboardPage to populate a new browser tab while the PDF report
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;background:linear-gradient(180deg,#0f172a 0%,#052e16 60%,#14532d 100%);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:#fff;}

    /* Sky stars */
    .stars{position:fixed;top:0;left:0;width:100%;height:50%;pointer-events:none;}
    .star{position:absolute;border-radius:50%;background:#fff;animation:twinkle 2s ease-in-out infinite;}
    @keyframes twinkle{0%,100%{opacity:.2;transform:scale(1);}50%{opacity:1;transform:scale(1.4);}}

    /* Sun */
    .sun{width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#fde68a,#f59e0b);box-shadow:0 0 40px 20px rgba(251,191,36,.4);animation:rise 3s ease-out forwards, pulse-sun 4s 3s ease-in-out infinite;}
    @keyframes rise{from{transform:translateY(60px);opacity:0;}to{transform:translateY(0);opacity:1;}}
    @keyframes pulse-sun{0%,100%{box-shadow:0 0 40px 20px rgba(251,191,36,.4);}50%{box-shadow:0 0 60px 30px rgba(251,191,36,.6);}}

    /* Clouds */
    .cloud{position:absolute;background:#e2e8f0;border-radius:50px;opacity:.85;animation:drift linear infinite;}
    .cloud::before,.cloud::after{content:'';position:absolute;background:#e2e8f0;border-radius:50%;}
    .cloud-1{width:120px;height:38px;top:18%;left:-140px;animation-duration:18s;}
    .cloud-1::before{width:60px;height:50px;top:-20px;left:15px;}
    .cloud-1::after{width:40px;height:35px;top:-10px;left:55px;}
    .cloud-2{width:90px;height:28px;top:28%;left:-120px;animation-duration:24s;animation-delay:6s;opacity:.6;}
    .cloud-2::before{width:45px;height:38px;top:-16px;left:10px;}
    .cloud-2::after{width:30px;height:26px;top:-8px;left:42px;}
    @keyframes drift{from{transform:translateX(-160px);}to{transform:translateX(110vw);}}

    /* Ground / field */
    .ground{position:fixed;bottom:0;left:0;width:100%;height:140px;background:linear-gradient(180deg,#15803d,#14532d);border-radius:60% 60% 0 0 / 30px 30px 0 0;}
    .ground-line{position:fixed;bottom:0;left:0;width:100%;height:40px;background:#052e16;}

    /* Wheat rows */
    .wheat-row{display:flex;gap:18px;position:fixed;bottom:100px;}
    .stalk{display:flex;flex-direction:column;align-items:center;gap:2px;animation:sway 2.5s ease-in-out infinite;}
    .stalk:nth-child(odd){animation-delay:.4s;}
    .stalk:nth-child(even){animation-delay:.8s;}
    @keyframes sway{0%,100%{transform:rotate(-4deg);}50%{transform:rotate(4deg);}}
    .stalk-stem{width:3px;height:36px;background:#86efac;border-radius:2px;}
    .stalk-head{width:10px;height:22px;background:#fbbf24;border-radius:5px 5px 2px 2px;}

    /* Tractor */
    .tractor-wrap{position:fixed;bottom:108px;animation:drive 6s ease-in-out infinite alternate;}
    @keyframes drive{from{left:5%;}to{left:75%;}}
    .tractor-svg{width:90px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5));}

    /* Card */
    .card{background:rgba(15,23,42,.7);border:1px solid rgba(16,185,129,.25);border-radius:24px;padding:40px 48px;max-width:480px;width:90%;text-align:center;backdrop-filter:blur(16px);box-shadow:0 8px 48px rgba(0,0,0,.4);}
    .logo{font-size:13px;font-weight:700;letter-spacing:.12em;color:#34d399;text-transform:uppercase;margin-bottom:16px;}
    h1{font-size:22px;font-weight:700;color:#f0fdf4;margin-bottom:8px;}
    .sub{font-size:13px;color:#86efac;margin-bottom:28px;}

    /* Dots loader */
    .dots{display:flex;gap:10px;justify-content:center;margin-bottom:28px;}
    .dot{width:12px;height:12px;border-radius:50%;background:#10b981;animation:bounce-dot 1.2s ease-in-out infinite;}
    .dot:nth-child(2){animation-delay:.2s;}
    .dot:nth-child(3){animation-delay:.4s;}
    @keyframes bounce-dot{0%,80%,100%{transform:scale(0.7);opacity:.5;}40%{transform:scale(1.3);opacity:1;}}

    /* Fact box */
    .fact-box{border-radius:14px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);padding:14px 18px;font-size:12px;color:#fde68a;line-height:1.6;}
    .fact-label{font-weight:700;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  </style>
</head>
<body>
  <!-- Stars -->
  <div class="stars" id="stars"></div>

  <!-- Sun -->
  <div style="position:fixed;top:60px;" class="sun"></div>

  <!-- Clouds -->
  <div class="cloud cloud-1"></div>
  <div class="cloud cloud-2"></div>

  <!-- Ground -->
  <div class="ground"></div>
  <div class="ground-line"></div>

  <!-- Wheat field -->
  <div class="wheat-row" id="wheat"></div>

  <!-- Tractor -->
  <div class="tractor-wrap" id="tractor">
    <svg class="tractor-svg" viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <rect x="30" y="25" width="60" height="28" rx="5" fill="#16a34a"/>
      <!-- Cab -->
      <rect x="70" y="12" width="28" height="24" rx="4" fill="#15803d"/>
      <rect x="73" y="15" width="22" height="14" rx="2" fill="#7dd3fc" opacity=".8"/>
      <!-- Exhaust -->
      <rect x="62" y="8" width="5" height="18" rx="2" fill="#374151"/>
      <!-- Front wheel -->
      <circle cx="40" cy="54" r="14" fill="#1c1917" stroke="#4ade80" stroke-width="3"/>
      <circle cx="40" cy="54" r="6" fill="#374151"/>
      <!-- Rear wheel -->
      <circle cx="88" cy="54" r="10" fill="#1c1917" stroke="#4ade80" stroke-width="3"/>
      <circle cx="88" cy="54" r="4" fill="#374151"/>
      <!-- Hitch -->
      <rect x="20" y="40" width="14" height="5" rx="2" fill="#374151"/>
    </svg>
  </div>

  <!-- Main card -->
  <div class="card">
    <div class="logo">🌾 Smart Farm Intelligence Platform</div>
    <h1>Generating Your Report</h1>
    <div class="sub">Harvesting insights from your field data\u2026</div>
    <div class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
    <div class="fact-box">
      <div class="fact-label">💡 Did You Know?</div>
      <div id="fact">Healthy soil contains over 1 billion microorganisms per gram — each playing a role in crop nutrition.</div>
    </div>
  </div>

  <script>
    // Generate stars
    const starsEl = document.getElementById('stars');
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2.5 + 1;
      s.style.cssText = 'width:'+size+'px;height:'+size+'px;top:'+Math.random()*100+'%;left:'+Math.random()*100+'%;animation-delay:'+Math.random()*3+'s;animation-duration:'+(2+Math.random()*2)+'s';
      starsEl.appendChild(s);
    }

    // Wheat stalks
    const wheatEl = document.getElementById('wheat');
    for (let i = 0; i < Math.floor(window.innerWidth / 30); i++) {
      wheatEl.innerHTML += '<div class="stalk"><div class="stalk-head"></div><div class="stalk-stem"></div></div>';
    }
    wheatEl.style.left = '0';
    wheatEl.style.width = '100%';
    wheatEl.style.justifyContent = 'center';

    // Rotating agronomy facts
    const facts = [
      'Healthy soil contains over 1 billion microorganisms per gram.',
      'Drip irrigation can save up to 50% more water than traditional methods.',
      'Crop rotation can increase yield by up to 25% over monoculture.',
      'Smart sensors can predict crop yield up to 3 weeks in advance.',
      '60% of crop losses can be prevented with early pest & disease alerts.',
      'Nitrogen fixation by legumes can replace up to 300 kg/ha of fertilizer.',
    ];
    let fi = 0;
    setInterval(() => {
      fi = (fi + 1) % facts.length;
      document.getElementById('fact').textContent = facts[fi];
    }, 4000);
  </script>
</body>
</html>`;
}
