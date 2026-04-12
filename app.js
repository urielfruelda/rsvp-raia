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
    if (!payload.guestAttendees) {
      return "Please enter the guest names attending.";
    }
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

  // ✅ Send as URL-encoded form data — avoids CORS preflight with Google Apps Script
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
  // Best-effort deterrents (not a true protection)
  document.addEventListener("contextmenu", (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("dragstart", (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("keydown", (e) => {
    // Block common save shortcuts (users can still bypass)
    const key = String(e.key || "").toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    if (ctrlOrCmd && (key === "s" || key === "p")) e.preventDefault();
  });

  // Watermark overlay (deterrent; cannot block screenshots)
  const wm = document.querySelector(".wmOverlay");
  if (wm) {
    wm.setAttribute("data-wm", "Raia Brielle • Private Invitation");
  }

  // Best-effort screenshot shortcut warning (desktop only; not reliable on phones)
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

  // Mobile warning banner (always visible on phones; dismissible)
  const mobileNotice = document.getElementById("mobileNotice");
  const mobileNoticeBtn = document.getElementById("mobileNoticeBtn");
  const dismissed = localStorage.getItem("mobile_notice_dismissed") === "1";
  if (dismissed && mobileNotice) {
    mobileNotice.style.display = "none";
  }
  if (mobileNoticeBtn && mobileNotice) {
    mobileNoticeBtn.addEventListener("click", () => {
      localStorage.setItem("mobile_notice_dismissed", "1");
      mobileNotice.style.display = "none";
    });
  }

  document.addEventListener("keyup", (e) => {
    // PrintScreen (Windows), often reports as "PrintScreen" or "PrtScr"
    if (e.key === "PrintScreen" || e.key === "PrtScr") triggerSSWarning();
  });

  document.addEventListener("keydown", (e) => {
    // Mac screenshot shortcuts: Cmd+Shift+3 / Cmd+Shift+4
    const key = String(e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === "3" || key === "4")) {
      triggerSSWarning();
    }
    // Windows snip tool: Win+Shift+S (Win key often not detectable; still try)
    if (e.shiftKey && key === "s" && (e.metaKey || e.ctrlKey)) {
      triggerSSWarning();
    }
  });

  // Best-effort privacy blur when page loses focus (not screenshot-proof)
  const setPrivacyBlur = (on) => {
    document.body.classList.toggle("privacyBlur", Boolean(on));
  };

  window.addEventListener("blur", () => setPrivacyBlur(true));
  window.addEventListener("focus", () => setPrivacyBlur(false));
  document.addEventListener("visibilitychange", () => {
    setPrivacyBlur(document.hidden);
  });

  // Randomize petal drift a bit so it feels organic
  const petals = document.querySelectorAll(".petal");
  for (const p of petals) {
    const drift = (Math.random() * 140 - 70).toFixed(1);
    const scale = (0.8 + Math.random() * 0.8).toFixed(2);
    const delay = (Math.random() * 3).toFixed(2);
    p.style.setProperty("--drift", `${drift}px`);
    p.style.setProperty("--scale", scale);
    p.style.animationDelay = `${delay}s`;
  }

  // Randomize blossoms so they feel organic
  const blossoms = document.querySelectorAll(".blossom");
  for (const b of blossoms) {
    const drift = (Math.random() * 180 - 90).toFixed(1);
    const scale = (0.85 + Math.random() * 0.9).toFixed(2);
    const delay = (Math.random() * 5).toFixed(2);
    b.style.setProperty("--bDrift", `${drift}px`);
    b.style.setProperty("--bScale", scale);
    b.style.animationDelay = `${delay}s`;
  }

  // Stagger twinkles
  const twinkles = document.querySelectorAll(".twinkle");
  for (const t of twinkles) {
    const delay = (Math.random() * 2.8).toFixed(2);
    t.style.animationDelay = `${delay}s`;
  }

  // Month intro: 1 → 11 months, then 12 months (birthday), then reveal page
  const monthIntro = document.getElementById("monthIntro");
  const monthNumber = document.getElementById("monthNumber");
  const monthLine = document.getElementById("monthLine");
  const monthBar = document.getElementById("monthBar");
  const monthPhoto = document.getElementById("monthPhoto");
  const monthPhotoNext = document.getElementById("monthPhotoNext");
  const monthPhotoShimmer = document.getElementById("monthPhotoShimmer");
  if (monthIntro && monthNumber && monthLine && monthBar && monthPhoto && monthPhotoNext) {
    const monthPhotoWrap =
      monthPhoto.closest(".monthIntroPhotoWrap") || monthPhoto.parentElement;

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

    const photos = [
      "./assets/month-01.jpg",
      "./assets/month-02.jpg",
      "./assets/month-03.jpg",
      "./assets/month-04.jpg",
      "./assets/month-05.jpg",
      "./assets/month-06.jpg",
      "./assets/month-07.jpg",
      "./assets/month-08.jpg",
      "./assets/month-09.jpg",
      "./assets/month-10.jpg",
      "./assets/month-11.jpg",
      "./assets/month-12.jpg",
    ];

    const stepMs = 260;
    const finalHoldMs = 1100;
    let m = 1;
    let swapping = false;

    const render = (month) => {
      monthNumber.textContent = String(month);
      monthLine.textContent = lines[Math.max(0, Math.min(lines.length - 1, month - 1))];
      monthBar.style.width = `${Math.round((month / 12) * 100)}%`;
      const labelEl = monthIntro.querySelector(".monthIntroLabel");
      if (labelEl) labelEl.textContent = month === 1 ? "month" : "months";

      const src = photos[Math.max(0, Math.min(photos.length - 1, month - 1))];
      monthNumber.classList.remove("isBumping");
      // restart bump animation
      void monthNumber.offsetWidth;
      monthNumber.classList.add("isBumping");

      if (monthPhotoWrap) monthPhotoWrap.style.setProperty("--monthBg", `url("${src}")`);
      if (monthPhotoShimmer) monthPhotoShimmer.style.opacity = "1";

      // Crossfade swap: load into "next", then fade swap
      swapping = true;
      if (monthPhotoWrap) monthPhotoWrap.classList.add("isSwapping");
      monthPhotoNext.src = src;
    };

    const markPhotoReady = () => {
      if (!swapping) return;
      // Swap sources: move next -> current, clear next
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

    // Preload images so the month slideshow feels instant
    for (const src of photos) {
      const img = new Image();
      img.src = src;
    }

    render(1);
    // If month-01 is already cached, show it immediately
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
        window.setTimeout(() => {
          monthIntro.classList.add("isLeaving");
          window.setTimeout(() => {
            monthIntro.classList.remove("isActive", "isLeaving");
            monthIntro.setAttribute("aria-hidden", "true");
          }, 360);
        }, finalHoldMs);
      }
    };

    window.setTimeout(tick, stepMs);
  }

  // Hero slideshow: month 1 → 12 (loops)
  const photoCard = document.querySelector(".photoCard");
  const heroSlideA = document.getElementById("heroSlideA");
  const heroSlideB = document.getElementById("heroSlideB");
  const heroBg = document.querySelector(".heroSlideshow");
  if (photoCard && heroSlideA && heroSlideB) {
    const photos = [
      "./assets/month-01.jpg",
      "./assets/month-02.jpg",
      "./assets/month-03.jpg",
      "./assets/month-04.jpg",
      "./assets/month-05.jpg",
      "./assets/month-06.jpg",
      "./assets/month-07.jpg",
      "./assets/month-08.jpg",
      "./assets/month-09.jpg",
      "./assets/month-10.jpg",
      "./assets/month-11.jpg",
      "./assets/month-12.jpg",
    ];

    // Preload in background
    for (const src of photos) {
      const img = new Image();
      img.src = src;
    }

    let idx = 0;
    let active = "A";
    let swapping = false;
    const slideMs = 2200;

    const setReady = () => {
      photoCard.classList.add("isReady");
      photoCard.classList.remove("isLoading");
    };

    const setBg = (src) => {
      if (!heroBg) return;
      heroBg.style.setProperty("--heroBg", `url("${src}")`);
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
      const curEl = active === "A" ? heroSlideA : heroSlideB;

      nextEl.style.opacity = "0";
      nextEl.src = src;
      setBg(src);

      const onLoad = () => {
        // Crossfade
        nextEl.style.opacity = "1";
        curEl.style.opacity = "0";
        active = active === "A" ? "B" : "A";
        swapping = false;
        if (typeof done === "function") done();
      };

      const onError = () => {
        swapping = false;
        if (typeof done === "function") done();
      };

      if (nextEl.complete && nextEl.naturalWidth > 0) onLoad();
      else {
        nextEl.addEventListener("load", onLoad, { once: true });
        nextEl.addEventListener("error", onError, { once: true });
      }
    };

    // Initialize
    heroSlideA.style.opacity = "1";
    heroSlideB.style.opacity = "0";
    showFirst();

    // Loop (single timer chain; never overlaps)
    const advance = () => {
      idx = (idx + 1) % photos.length;
      crossfadeTo(photos[idx], () => {
        window.setTimeout(advance, slideMs);
      });
    };
    window.setTimeout(advance, slideMs);
  }

  // Smooth jump to RSVP
  const rsvpJumpBtn = document.getElementById("rsvpJumpBtn");
  const rsvpOpenBtn = document.getElementById("rsvpOpenBtn");
  const rsvpModal = document.getElementById("rsvpModal");
  const rsvpCloseBtn = document.getElementById("rsvpCloseBtn");
  const rsvpEnvelope = document.getElementById("rsvpEnvelope");
  const rsvpHearts = document.getElementById("rsvpHearts");

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)")?.matches;

  const openRsvpModal = async () => {
    if (!rsvpModal) return;
    document.body.classList.add("modalOpen");

    const burstHearts = () => {
      if (!rsvpHearts) return;
      rsvpHearts.innerHTML = "";
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const h = document.createElement("span");
        h.className = "rsvpHeart" + (i % 3 === 0 ? " isSmall" : "");
        const hx = (Math.random() * 180 - 90).toFixed(1);
        const hr = (Math.random() * 26 - 13).toFixed(1);
        const delay = (Math.random() * 160).toFixed(0);
        const dur = (860 + Math.random() * 420).toFixed(0);
        h.style.setProperty("--hx", `${hx}px`);
        h.style.setProperty("--hr", `${hr}deg`);
        h.style.setProperty("--hDur", `${dur}ms`);
        h.style.animationDelay = `${delay}ms`;
        rsvpHearts.appendChild(h);
      }
      // cleanup a bit later
      window.setTimeout(() => {
        if (rsvpHearts) rsvpHearts.innerHTML = "";
      }, 1600);
    };

    // Envelope animation (best-effort)
    if (rsvpEnvelope && !prefersReducedMotion) {
      rsvpEnvelope.classList.add("isActive");
      burstHearts();
      await new Promise((r) => window.setTimeout(r, 900));
      rsvpEnvelope.classList.remove("isActive");
    }

    rsvpModal.classList.add("isOpen");
    rsvpModal.setAttribute("aria-hidden", "false");

    // focus first input
    const first = rsvpModal.querySelector('input[name="guestName"]');
    if (first) first.focus();
  };

  const closeRsvpModal = () => {
    if (!rsvpModal) return;
    rsvpModal.classList.remove("isOpen");
    rsvpModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modalOpen");
  };

  if (rsvpJumpBtn) rsvpJumpBtn.addEventListener("click", openRsvpModal);
  if (rsvpOpenBtn) rsvpOpenBtn.addEventListener("click", openRsvpModal);
  if (rsvpCloseBtn) rsvpCloseBtn.addEventListener("click", closeRsvpModal);

  if (rsvpModal) {
    rsvpModal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === "true") closeRsvpModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeRsvpModal();
  });

  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !status || !submitBtn) return;

  // Countdown to event (June 13, 2026 10:00 AM local time)
  const countdownEl = document.getElementById("countdownTime");
  if (countdownEl) {
    const target = new Date(2026, 5, 13, 10, 0, 0, 0); // months are 0-based (June = 5)
    const pad2 = (n) => String(n).padStart(2, "0");
    const tickCountdown = () => {
      const now = new Date();
      let diff = Math.max(0, target.getTime() - now.getTime());
      const sec = Math.floor(diff / 1000);
      const days = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = sec % 60;
      countdownEl.textContent = `${days}:${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
    };
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus(status, "", null);

    const payload = serializeForm(form);
    const error = validate(payload);
    if (error) {
      setStatus(status, error, "err");
      return;
    }

    submitBtn.disabled = true;
    setStatus(status, "Sending your RSVP…", null);

    try {
      await submitRSVP(payload);
      form.reset();
      setStatus(status, "Thank you! Your RSVP was saved.", "ok");
      // close a moment after success so user sees confirmation
      window.setTimeout(() => {
        closeRsvpModal();
        setStatus(status, "", null);
      }, 900);
    } catch (err) {
      setStatus(status, err?.message || "Something went wrong.", "err");
    } finally {
      submitBtn.disabled = false;
    }
  });
});

