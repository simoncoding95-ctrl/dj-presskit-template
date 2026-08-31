/* Carrousels (défilement, drag, clavier, compteur) + apparition au scroll. */
(function () {
  "use strict";

  document.querySelectorAll("[data-reel]").forEach(function (root) {
    var track = root.querySelector(".reel");
    var prev = root.querySelector('[data-dir="-1"]');
    var next = root.querySelector('[data-dir="1"]');
    var count = root.querySelector(".reel__count");
    var thumb = root.querySelector(".reel__thumb");
    var items = track.children;
    if (!items.length) return;

    function step() {
      var first = items[0].getBoundingClientRect();
      var gap = parseFloat(getComputedStyle(track).columnGap || 14) || 14;
      return first.width + gap;
    }

    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      var index = Math.min(items.length, Math.round(track.scrollLeft / step()) + 1);
      if (count) count.textContent = pad(index) + " / " + pad(items.length);
      if (thumb) {
        var ratio = track.clientWidth / track.scrollWidth;
        thumb.style.width = Math.max(ratio * 100, 8) + "%";
        thumb.style.transform = "translateX(" + (max > 0 ? (track.scrollLeft / max) * ((1 / Math.max(ratio, 0.08) - 1) * 100) : 0) + "%)";
      }
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    [prev, next].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        track.scrollBy({ left: step() * Number(btn.dataset.dir), behavior: "smooth" });
      });
    });

    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      track.scrollBy({ left: step() * (e.key === "ArrowRight" ? 1 : -1), behavior: "smooth" });
    });

    // Glisser à la souris — le tactile est déjà géré nativement.
    var down = false, startX = 0, startScroll = 0, moved = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      moved = e.clientX - startX;
      track.scrollLeft = startScroll - moved;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      track.classList.remove("is-dragging");
      // Recale sur l'élément le plus proche.
      track.scrollTo({ left: Math.round(track.scrollLeft / step()) * step(), behavior: "smooth" });
    });
    track.addEventListener("click", function (e) {
      if (Math.abs(moved) > 6) e.preventDefault();
    }, true);

    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  targets.forEach(function (el) { io.observe(el); });
})();
