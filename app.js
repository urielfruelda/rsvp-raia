function getEndpoint() {
  return String(window?.RSVP_CONFIG?.endpoint || "").trim();
}

function setStatus(el, message, kind) {
  el.textContent = message;
  el.classList.remove("statusOk", "statusErr");
  if (kind === "ok") el.classList.add("statusOk");
  if (kind === "err") el.classList.add("statusErr");
}

function serializeForm(form) {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) {
    payload[key] = String(value ?? "").trim();
  }
  payload.timestamp = new Date().toISOString();
  return payload;
}

function validate(payload) {
  if (!payload.guestName) return "Please enter the guest name.";
  if (!payload.attending) return "Please choose whether you will attend.";
  if (payload.attending === "yes") {
    if (!payload.guestAttendees) return "Please enter the names of guests attending.";
    if (!payload.guestCount || parseInt(payload.guestCount) < 1) return "Please enter the number of guests attending.";
  }
  return null;
}

async function submitRSVP(payload) {
  const endpoint = getEndpoint();
  if (!endpoint) {
    throw new Error(
      "RSVP endpoint is not configured yet. We'll connect Google Sheets next.",
    );
  }

  const body = new URLSearchParams(payload).toString();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status}).`);
  }

  return res;
}

document.addEventListener("DOMContentLoaded", () => {

  // ── Audio setup ────────────────────────────────────────────────────────────
  const audio = new Audio("./assets/birthday.mp3");
  audio.loop = true;
  audio.volume = 0;

  const fadeAudio = (targetVol, durationMs, onDone) => {
    const steps = 40;
    const interval = durationMs / steps;
    const delta = (targetVol - audio.volume) / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      audio.volume = Math.min(1, Math.max(0, parseFloat((audio.volume + delta).toFixed(4))));
      if (step >= steps) {
        clearInterval(t);
        audio.volume = targetVol;
        if (targetVol === 0) audio.pause();
        if (typeof onDone === "function") onDone();
      }
    }, interval);
  };

  // ── Tap to Begin splash ────────────────────────────────────────────────────
  const tapStyle = document.createElement("style");
  tapStyle.textContent = `
    @keyframes tapPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 14px 36px rgba(240,123,176,0.28); }
      50% { transform: scale(1.05); box-shadow: 0 20px 50px rgba(240,123,176,0.45); }
    }
    @keyframes splashFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #tapSplash { animation: splashFadeIn 600ms ease forwards; }
  `;
  document.head.appendChild(tapStyle);

  const splash = document.createElement("div");
  splash.id = "tapSplash";
  splash.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: grid; place-items: center; padding: 24px;
    background:
      radial-gradient(1200px 900px at 25% 10%, rgba(255,179,214,0.6), transparent 60%),
      radial-gradient(900px 700px at 90% 15%, rgba(123,97,255,0.22), transparent 58%),
      linear-gradient(180deg, #fff6fb, #ffffff 70%);
  `;
  splash.innerHTML = `
    <div style="text-align:center;">
      <div style="font-family:'Great Vibes',Georgia,serif; font-size: clamp(52px,10vw,72px); color: rgba(240,123,176,0.95); line-height:1.1;">Raia Brielle</div>
      <div style="font-family:Fraunces,Georgia,serif; font-size: clamp(16px,4vw,22px); font-weight:700; color: rgba(28,20,38,0.72); margin-top: 6px; letter-spacing:-0.01em;">1st Birthday &amp; Dedication</div>
      <div style="margin-top: 10px; font-size: clamp(12px,3vw,14px); color: rgba(28,20,38,0.45); letter-spacing:0.1em; text-transform:uppercase;">June 13, 2026</div>
      <div style="margin-top: 36px;">
        <button id="tapBtn" style="
          border: none; border-radius: 999px;
          padding: 18px 44px;
          font-weight: 800; font-size: clamp(14px,3.5vw,17px);
          letter-spacing: 0.06em;
          color: white; cursor: pointer;
          background: linear-gradient(105deg, rgba(240,123,176,0.95), rgba(123,97,255,0.88));
          box-shadow: 0 14px 36px rgba(240,123,176,0.28);
          animation: tapPulse 1.8s ease-in-out infinite;
        ">Tap to Begin 🎀</button>
      </div>
      <div style="margin-top: 16px; font-size: 12px; color: rgba(28,20,38,0.4); letter-spacing:0.08em; text-transform:uppercase;">🔊 Turn sound on for the full experience</div>
    </div>
  `;
  document.body.appendChild(splash);

  // Mute button (hidden until audio starts)
  const muteBtn = document.createElement("button");
  muteBtn.id = "muteBtn";
  muteBtn.setAttribute("aria-label", "Toggle music");
  muteBtn.textContent = "🔊";
  muteBtn.style.cssText = `
    position: fixed; bottom: 18px; right: 18px;
    z-index: 9990;
    width: 44px; height: 44px;
    border-radius: 999px;
    border: 1.5px solid rgba(240,123,176,0.3);
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(10px);
    cursor: pointer;
    font-size: 18px;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(28,20,38,0.1);
    transition: transform 160ms ease, box-shadow 160ms ease;
  `;
  muteBtn.addEventListener("mouseenter", () => muteBtn.style.transform = "scale(1.08)");
  muteBtn.addEventListener("mouseleave", () => muteBtn.style.transform = "scale(1)");
  document.body.appendChild(muteBtn);

  let muted = false;
  let preMuteVol = 0.55;

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    if (muted) {
      preMuteVol = audio.volume > 0 ? audio.volume : preMuteVol;
      fadeAudio(0, 400);
      muteBtn.textContent = "🔇";
    } else {
      audio.play().catch(() => {});
      fadeAudio(preMuteVol, 400);
      muteBtn.textContent = "🔊";
    }
  });

  // Tap handler — starts everything
  document.getElementById("tapBtn").addEventListener("click", () => {
    // Fade out splash
    splash.style.transition = "opacity 500ms ease";
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 500);

    // Start music, fade in
    audio.play().catch(() => {});
    fadeAudio(0.55, 2000);

    // Show mute button after a moment
    setTimeout(() => {
      muteBtn.style.display = "flex";
    }, 1800);

    // ── START the month intro after splash fades ──────────────────────────
    setTimeout(() => {
      if (monthIntro) {
        monthIntro.classList.add("isActive");
        monthIntro.setAttribute("aria-hidden", "false");
      }
    }, 400);
  });

  // ── Best-effort deterrents ──────────────────────────────────────────────────
  document.addEventListener("contextmenu", (e) => {
    if (e.target?.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target?.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("keydown", (e) => {
    const key = String(e.key || "").toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    if (ctrlOrCmd && (key === "s" || key === "p")) e.preventDefault();
  });

  // Watermark overlay
  const wm = document.querySelector(".wmOverlay");
  if (wm) {
    wm.setAttribute("data-wm", "Raia Brielle • Private Invitation");
  }

  // Screenshot warning
  const ssWarning = document.getElementById("ssWarning");
  let ssTimer = null;
  const triggerSSWarning = () => {
    document.body.classList.add("privacyBlur");
    if (ssWarning) ssWarning.classList.add("isActive");
    window.clearTimeout(ssTimer);
    ssTimer = window.setTimeout(() => {
      if (ssWarning) ssWarning.classList.remove("isActive");
      document.body.classList.remove("privacyBlur");
    }, 1600);
  };

  // Mobile notice
  const mobileNotice = document.getElementById("mobileNotice");
  const mobileNoticeBtn = document.getElementById("mobileNoticeBtn");
  const dismissed = localStorage.getItem("mobile_notice_dismissed") === "1";
  if (dismissed && mobileNotice) mobileNotice.style.display = "none";
  if (mobileNoticeBtn && mobileNotice) {
    mobileNoticeBtn.addEventListener("click", () => {
      localStorage.setItem("mobile_notice_dismissed", "1");
      mobileNotice.style.display = "none";
    });
  }

  document.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen" || e.key === "PrtScr") triggerSSWarning();
  });

  document.addEventListener("keydown", (e) => {
    const key = String(e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === "3" || key === "4")) triggerSSWarning();
    if (e.shiftKey && key === "s" && (e.metaKey || e.ctrlKey)) triggerSSWarning();
  });

  // Privacy blur on focus loss
  const setPrivacyBlur = (on) => document.body.classList.toggle("privacyBlur", Boolean(on));
  window.addEventListener("blur", () => setPrivacyBlur(true));
  window.addEventListener("focus", () => setPrivacyBlur(false));
  document.addEventListener("visibilitychange", () => setPrivacyBlur(document.hidden));

  // ── Petals / Blossoms / Twinkles ─────────────────────────────────────────────
  document.querySelectorAll(".petal").forEach((p) => {
    p.style.setProperty("--drift", `${(Math.random() * 140 - 70).toFixed(1)}px`);
    p.style.setProperty("--scale", (0.8 + Math.random() * 0.8).toFixed(2));
    p.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
  });

  document.querySelectorAll(".blossom").forEach((b) => {
    b.style.setProperty("--bDrift", `${(Math.random() * 180 - 90).toFixed(1)}px`);
    b.style.setProperty("--bScale", (0.85 + Math.random() * 0.9).toFixed(2));
    b.style.animationDelay = `${(Math.random() * 5).toFixed(2)}s`;
  });

  document.querySelectorAll(".twinkle").forEach((t) => {
    t.style.animationDelay = `${(Math.random() * 2.8).toFixed(2)}s`;
  });

  // ── Month intro slideshow ─────────────────────────────────────────────────────
  const monthIntro        = document.getElementById("monthIntro");
  const monthNumber       = document.getElementById("monthNumber");
  const monthLine         = document.getElementById("monthLine");
  const monthBar          = document.getElementById("monthBar");
  const monthPhoto        = document.getElementById("monthPhoto");
  const monthPhotoNext    = document.getElementById("monthPhotoNext");
  const monthPhotoShimmer = document.getElementById("monthPhotoShimmer");

  if (monthIntro && monthNumber && monthLine && monthBar && monthPhoto && monthPhotoNext) {
    const monthPhotoWrap = monthPhoto.closest(".monthIntroPhotoWrap") || monthPhoto.parentElement;

    const lines = [
      "Little moments, big love.",
      "Tiny toes, huge joy.",
      "Giggles are getting louder.",
      "Cuddles are the best.",
      "So much sweetness.",
      "Growing strong every day.",
      "Smiles that melt hearts.",
      "More laughter, more love.",
      "Curious little explorer.",
      "Almost there…",
      "One more month to go…",
      "Happy 1st Birthday, Raia Brielle!",
    ];

    const photos = Array.from({ length: 12 }, (_, i) =>
      `./assets/month-${String(i + 1).padStart(2, "0")}.jpg`
    );

    const stepMs      = 800;  // slightly slower so each photo is visible
    const finalHoldMs = 10000;
    let m        = 1;
    let swapping = false;

    // ── Month 12 celebration ───────────────────────────────────────────────
    const showMonth12Celebration = () => {
      const old = monthIntro.querySelector(".month12Cel");
      if (old) old.remove();

      const cel = document.createElement("div");
      cel.className = "month12Cel";
      cel.style.cssText = `
        margin: 14px auto 0;
        width: min(440px, 100%);
        height: 260px;
        border-radius: 20px;
        border: 1px solid rgba(240,123,176,0.25);
        overflow: hidden;
        position: relative;
        background: linear-gradient(160deg, rgba(255,232,243,0.9), rgba(220,207,246,0.85), rgba(195,235,215,0.8));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        animation: month12In 600ms cubic-bezier(0.2,0.9,0.2,1) both;
      `;

      if (!document.getElementById("m12kf")) {
        const s = document.createElement("style");
        s.id = "m12kf";
        s.textContent = `
          @keyframes month12In { from { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.04); } to { transform: scale(1); opacity: 1; } }
          @keyframes m12pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
          @keyframes m12hb { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes m12confFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) rotate(540deg); opacity: 0; } }
          @keyframes m12ballRise { 0% { opacity: 0.9; transform: translateY(0) translateX(0); } 100% { opacity: 0; transform: translateY(-320px) translateX(var(--dx,30px)); } }
        `;
        document.head.appendChild(s);
      }

      // Confetti
      const confLayer = document.createElement("div");
      confLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
      const confColors = ["#f07bb0","#7b61ff","#3aa86b","#ffcc66","#60a5fa"];
      for (let i = 0; i < 28; i++) {
        const p = document.createElement("div");
        const dur   = (2 + Math.random() * 2).toFixed(2);
        const delay = (Math.random() * 2.5).toFixed(2);
        p.style.cssText = `
          position:absolute; top:-14px; left:${Math.random() * 100}%;
          width:${8 + Math.random() * 6}px; height:${5 + Math.random() * 5}px;
          border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
          background:${confColors[i % confColors.length]};
          opacity:0;
          animation: m12confFall ${dur}s linear ${delay}s infinite;
        `;
        confLayer.appendChild(p);
      }
      cel.appendChild(confLayer);

      // Balloons
      const balLayer = document.createElement("div");
      balLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
      ["🎈","🎉","🌸","🎀","🎊"].forEach((em, i) => {
        const b = document.createElement("div");
        const dur   = (4 + Math.random() * 3).toFixed(2);
        const delay = (i * 0.8).toFixed(2);
        const dx    = (Math.random() * 60 - 30).toFixed(1);
        b.style.cssText = `
          position:absolute; bottom:-50px; left:${10 + i * 18}%;
          font-size:30px;
          animation: m12ballRise ${dur}s ease-in ${delay}s infinite;
          --dx:${dx}px;
        `;
        b.textContent = em;
        balLayer.appendChild(b);
      });
      cel.appendChild(balLayer);

      // Content
      const content = document.createElement("div");
      content.style.cssText = "position:relative;z-index:5;";
      content.innerHTML = `
        <div style="font-family:Fraunces,Georgia,serif;font-size:110px;font-weight:700;line-height:1;background:linear-gradient(135deg,#f07bb0,#7b61ff,#3aa86b);-webkit-background-clip:text;background-clip:text;color:transparent;animation:m12pulse 2s ease-in-out infinite;">12</div>
        <div style="font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:700;color:rgba(168,40,64,0.9);margin-top:4px;">Happy 1st Birthday,</div>
        <div style="font-family:'Great Vibes',Georgia,serif;font-size:40px;color:rgba(240,123,176,0.95);margin-top:2px;">Raia Brielle!</div>
        <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;font-size:24px;">
          ${["🎀","🌸","💜","🌸","🎀"].map((e, i) => `<span style="display:inline-block;animation:m12hb 1.5s ease-in-out ${(i * 0.2).toFixed(1)}s infinite;">${e}</span>`).join("")}
        </div>
      `;
      cel.appendChild(content);

      const monthIntroCard = monthIntro.querySelector(".monthIntroCard");
      if (monthIntroCard) {
        monthIntroCard.insertBefore(cel, monthPhotoWrap ? monthPhotoWrap.nextSibling : null);
      }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    const render = (month) => {
      monthNumber.textContent = String(month);
      monthLine.textContent = lines[Math.max(0, Math.min(lines.length - 1, month - 1))];
      monthBar.style.width = `${Math.round((month / 12) * 100)}%`;
      const labelEl = monthIntro.querySelector(".monthIntroLabel");
      if (labelEl) labelEl.textContent = month === 1 ? "month" : "months";

      monthNumber.classList.remove("isBumping");
      void monthNumber.offsetWidth;
      monthNumber.classList.add("isBumping");

      if (month === 12) {
        if (monthPhotoWrap) monthPhotoWrap.style.display = "none";
        showMonth12Celebration();
        return;
      }

      const src = photos[Math.max(0, Math.min(photos.length - 1, month - 1))];
      if (monthPhotoWrap) {
        monthPhotoWrap.style.display = "";
        monthPhotoWrap.style.setProperty("--monthBg", `url("${src}")`);
      }
      if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "1";

      swapping = true;
      if (monthPhotoWrap) monthPhotoWrap.classList.add("isSwapping");
      monthPhotoNext.src = src;
    };

    const markPhotoReady = () => {
      if (!swapping) return;
      monthPhoto.src = monthPhotoNext.src;
      monthPhotoNext.src = "";
      swapping = false;
      if (monthPhotoWrap) {
        monthPhotoWrap.classList.remove("isSwapping");
        monthPhotoWrap.classList.add("isReady");
      }
      if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "0";
    };

    monthPhotoNext.addEventListener("load", markPhotoReady);
    monthPhotoNext.addEventListener("error", () => {
      swapping = false;
      if (monthPhotoWrap) monthPhotoWrap.classList.add("isReady");
      if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "0";
    });

    // Preload all photos
    photos.forEach((src) => { const img = new Image(); img.src = src; });

    render(1);
    if (monthPhoto.complete && monthPhoto.naturalWidth > 0) {
      if (monthPhotoWrap) monthPhotoWrap.classList.add("isReady");
      if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "0";
    } else {
      monthPhoto.addEventListener("load", () => {
        if (monthPhotoWrap) monthPhotoWrap.classList.add("isReady");
        if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "0";
      }, { once: true });
    }

    const tick = () => {
      m += 1;
      render(m);
      if (m < 12) {
        window.setTimeout(tick, stepMs);
      } else {
        // Month 12 — hold 10s, then fade music + exit intro
        window.setTimeout(() => {
          monthIntro.classList.add("isLeaving");
          fadeAudio(0, 1400);
          window.setTimeout(() => {
            monthIntro.classList.remove("isActive", "isLeaving");
            monthIntro.setAttribute("aria-hidden", "true");
            // Fade music back in for main page
            audio.play().catch(() => {});
            fadeAudio(0.55, 1800);
          }, 360);
        }, finalHoldMs);
      }
    };

    // Tick starts only after isActive is added (triggered by tap button above)
    // We watch for isActive via a small poll so the timing is clean
    const waitForActive = () => {
      if (monthIntro.classList.contains("isActive")) {
        window.setTimeout(tick, stepMs);
      } else {
        window.setTimeout(waitForActive, 100);
      }
    };
    waitForActive();
  }

  // ── Hero slideshow ─────────────────────────────────────────────────────────────
  const photoCard  = document.querySelector(".photoCard");
  const heroSlideA = document.getElementById("heroSlideA");
  const heroSlideB = document.getElementById("heroSlideB");
  const heroBg     = document.querySelector(".heroSlideshow");

  if (photoCard && heroSlideA && heroSlideB) {
    const photos = Array.from({ length: 12 }, (_, i) =>
      `./assets/month-${String(i + 1).padStart(2, "0")}.jpg`
    );

    photos.forEach((src) => { const img = new Image(); img.src = src; });

    let idx      = 0;
    let active   = "A";
    let swapping = false;
    const slideMs = 2200;

    const setReady = () => {
      photoCard.classList.add("isReady");
      photoCard.classList.remove("isLoading");
    };

    const setBg = (src) => {
      if (heroBg) heroBg.style.setProperty("--heroBg", `url("${src}")`);
    };

    const showFirst = () => {
      heroSlideA.src = photos[0];
      setBg(photos[0]);
      if (heroSlideA.complete && heroSlideA.naturalWidth > 0) setReady();
      else heroSlideA.addEventListener("load", setReady, { once: true });
    };

    const crossfadeTo = (src, done) => {
      if (swapping) return;
      swapping = true;
      const nextEl = active === "A" ? heroSlideB : heroSlideA;
      const curEl  = active === "A" ? heroSlideA : heroSlideB;

      nextEl.style.opacity = "0";
      nextEl.src = src;
      setBg(src);

      const onLoad = () => {
        nextEl.style.opacity = "1";
        curEl.style.opacity  = "0";
        active   = active === "A" ? "B" : "A";
        swapping = false;
        if (typeof done === "function") done();
      };

      const onError = () => {
        swapping = false;
        if (typeof done === "function") done();
      };

      if (nextEl.complete && nextEl.naturalWidth > 0) onLoad();
      else {
        nextEl.addEventListener("load",  onLoad,  { once: true });
        nextEl.addEventListener("error", onError, { once: true });
      }
    };

    heroSlideA.style.opacity = "1";
    heroSlideB.style.opacity = "0";
    showFirst();

    const advance = () => {
      idx = (idx + 1) % photos.length;
      crossfadeTo(photos[idx], () => window.setTimeout(advance, slideMs));
    };
    window.setTimeout(advance, slideMs);
  }

  // ── RSVP modal ─────────────────────────────────────────────────────────────────
  const rsvpJumpBtn  = document.getElementById("rsvpJumpBtn");
  const rsvpOpenBtn  = document.getElementById("rsvpOpenBtn");
  const rsvpModal    = document.getElementById("rsvpModal");
  const rsvpCloseBtn = document.getElementById("rsvpCloseBtn");
  const rsvpEnvelope = document.getElementById("rsvpEnvelope");
  const rsvpHearts   = document.getElementById("rsvpHearts");

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const openRsvpModal = async () => {
    if (!rsvpModal) return;
    document.body.classList.add("modalOpen");

    const burstHearts = () => {
      if (!rsvpHearts) return;
      rsvpHearts.innerHTML = "";
      const count = 16;
      for (let i = 0; i < count; i++) {
        const h = document.createElement("span");
        h.className = "rsvpHeart" + (i % 4 === 0 ? " isSmall" : "");
        const hx    = (Math.random() * 260 - 130).toFixed(1);
        const hr    = (Math.random() * 40  -  20).toFixed(1);
        const delay = (680 + Math.random() * 360).toFixed(0);
        const dur   = (820 + Math.random() * 500).toFixed(0);
        h.style.setProperty("--hx",   `${hx}px`);
        h.style.setProperty("--hr",   `${hr}deg`);
        h.style.setProperty("--hDur", `${dur}ms`);
        h.style.animationDelay = `${delay}ms`;
        rsvpHearts.appendChild(h);
      }
      window.setTimeout(() => {
        if (rsvpHearts) rsvpHearts.innerHTML = "";
      }, 2200);
    };

    if (rsvpEnvelope && !prefersReducedMotion) {
      rsvpEnvelope.classList.add("isActive");
      burstHearts();
      await new Promise((r) => window.setTimeout(r, 1600));
      rsvpEnvelope.classList.remove("isActive");
    }

    rsvpModal.classList.add("isOpen");
    rsvpModal.setAttribute("aria-hidden", "false");

    const first = rsvpModal.querySelector('input[name="guestName"]');
    if (first) window.setTimeout(() => first.focus(), 200);
  };

  const closeRsvpModal = () => {
    if (!rsvpModal) return;
    rsvpModal.classList.remove("isOpen");
    rsvpModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modalOpen");
  };

  if (rsvpJumpBtn)  rsvpJumpBtn.addEventListener("click", openRsvpModal);
  if (rsvpOpenBtn)  rsvpOpenBtn.addEventListener("click", openRsvpModal);
  if (rsvpCloseBtn) rsvpCloseBtn.addEventListener("click", closeRsvpModal);

  rsvpModal?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeRsvpModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeRsvpModal();
  });

  // ── Form ───────────────────────────────────────────────────────────────────────
  const form      = document.getElementById("rsvpForm");
  const status    = document.getElementById("status");   // ✅ FIXED typo
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !status || !submitBtn) return;

  // ── Countdown ─────────────────────────────────────────────────────────────────
  const countdownEl = document.getElementById("countdownTime");
  if (countdownEl) {
    const target = new Date(2026, 5, 13, 10, 0, 0, 0);
    const pad2 = (n) => String(n).padStart(2, "0");
    const tickCountdown = () => {
      const diff  = Math.max(0, target.getTime() - Date.now());
      const sec   = Math.floor(diff / 1000);
      const days  = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const mins  = Math.floor((sec % 3600) / 60);
      const secs  = sec % 60;
      countdownEl.textContent = `${days}:${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
    };
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus(status, "", null);

    const payload = serializeForm(form);
    const error   = validate(payload);
    if (error) {
      setStatus(status, error, "err");
      return;
    }

    submitBtn.disabled = true;
    setStatus(status, "Sending your RSVP…", null);

    try {
      await submitRSVP(payload);
      form.reset();
      setStatus(status, "🎉 Thank you! Your RSVP was saved.", "ok");
      window.setTimeout(() => {
        closeRsvpModal();
        setStatus(status, "", null);
      }, 1200);
    } catch (err) {
      setStatus(status, err?.message || "Something went wrong.", "err");
    } finally {
      submitBtn.disabled = false;
    }
  });
});