import { homeCopy, projectCount } from '../i18n/home';
import { localeFromLang } from '../i18n/routes';

(function () {
      'use strict';
      var copy = homeCopy[localeFromLang(document.documentElement.lang)];

      var EMAIL = 'jean.ayala.viera@gmail.com';
      var MAILTO = 'mailto:' + EMAIL;
      var THREE = null;
      var gsap = null;
      var ScrollTrigger = null;

      /* The Pause control now carries an icon beside its wording, so the text
         lives in its own span and every relabel keeps the glyph intact. */
      var pauseLabel = document.getElementById('orb-pausa-label');
      function setPauseLabel(text) {
        if (pauseLabel) { pauseLabel.textContent = text; }
      }

      /* Mail composer only: the destination is the constant above, callers add at most an encoded query. */
      function openMailto(query) {
        var link = document.createElement('a');
        link.href = typeof query === 'string' && query.charAt(0) === '?' ? MAILTO + query : MAILTO;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      /* ── Project filters ─────────────────────────────────────────── */
      var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
      var projectCards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
      var counter = document.getElementById('projects-count');
      var filterToken = 0;
      var filterTimers = [];

      /* the decorative filter motion is only used while motion is on; the
         final hidden/visible state is always applied regardless, so a rapid
         toggle can never strand a card or hide content permanently */
      function motionOn() {
        return document.documentElement.classList.contains('motion-on');
      }

      /* the filter fades are GSAP-owned once the library is ready; until then
         the CSS classes carry the same short out/in rhythm */
      function gsapFilterReady() {
        return !!(gsap && document.documentElement.classList.contains('gsap-ready'));
      }

      function clearFilterTimers() {
        filterTimers.forEach(function (id) { window.clearTimeout(id); });
        filterTimers = [];
        if (gsapFilterReady()) { gsap.killTweensOf(projectCards); }
        projectCards.forEach(function (card) { card.classList.remove('proj-out'); });
      }

      function applyFilter(value) {
        filterToken += 1;
        var token = filterToken;
        clearFilterTimers();
        var animate = motionOn();
        /* T19: every entry is the same compact editorial row, so the filter no
           longer plans slots or assigns classes. It only decides which rows
           are visible; the same run token still guards the exit timers, so a
           rapid sequence of filter changes can never strand a row. */
        var visible = [];
        projectCards.forEach(function (card) {
          if (value === 'todos' || card.getAttribute('data-cat') === value) { visible.push(card); }
        });
        var total = visible.length;
        projectCards.forEach(function (card) {
          if (visible.indexOf(card) !== -1) {
            card.hidden = false;
            card.classList.remove('proj-out');
            if (animate) {
              if (gsapFilterReady()) {
                /* the run token above still guards a rapid sequence, so a stale
                   tween can never leave a visible row at zero opacity */
                gsap.killTweensOf(card);
                gsap.fromTo(card, { opacity: 0, y: 12 },
                  { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
              } else {
                card.classList.remove('proj-in');
                void card.offsetWidth;
                card.classList.add('proj-in');
              }
            } else if (gsapFilterReady()) {
              gsap.set(card, { opacity: 1, y: 0 });
            }
          } else if (card.hidden) {
            /* already hidden: nothing to animate */
          } else if (animate) {
            if (gsapFilterReady()) {
              gsap.killTweensOf(card);
              gsap.to(card, { opacity: 0, y: 10, duration: 0.2, ease: 'power1.out' });
            } else {
              card.classList.add('proj-out');
            }
            filterTimers.push(window.setTimeout(function () {
              if (token !== filterToken) { return; }
              card.hidden = true;
              card.classList.remove('proj-out');
              if (gsapFilterReady()) { gsap.set(card, { clearProps: 'opacity,transform' }); }
            }, 200));
          } else {
            /* reduced motion: the new grid appears at once, no fade */
            card.hidden = true;
          }
        });
        filterButtons.forEach(function (button) {
          button.setAttribute('aria-pressed', button.getAttribute('data-filter') === value ? 'true' : 'false');
        });
        if (counter) {
          counter.textContent = projectCount(total, copy);
        }
      }

      filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          applyFilter(button.getAttribute('data-filter'));
        });
      });
      if (filterButtons.length) { applyFilter('todos'); }

      /* ── Contact dialog ──────────────────────────────────────────── */
      var dialog = document.getElementById('contacto-dialog');
      var openButton = document.getElementById('abrir-contacto');
      var closeButton = document.getElementById('cerrar-contacto');
      var form = document.getElementById('contacto-form');
      var formStatus = document.getElementById('form-status');
      var lastFocused = null;

      if (dialog && typeof dialog.showModal === 'function') {
        if (openButton) {
          openButton.addEventListener('click', function () {
            lastFocused = document.activeElement;
            /* clear a stale status but keep whatever the visitor already typed */
            if (formStatus) { formStatus.textContent = ''; }
            dialog.showModal();
          });
        }
        if (closeButton) {
          closeButton.addEventListener('click', function () { dialog.close('cerrar'); });
        }
        dialog.addEventListener('close', function () {
          if (lastFocused && typeof lastFocused.focus === 'function') { lastFocused.focus(); }
        });
        dialog.addEventListener('click', function (event) {
          if (event.target === dialog) { dialog.close('backdrop'); }
        });
      } else if (openButton) {
        openButton.addEventListener('click', function () {
          openMailto();
        });
      }

      if (form) {
        /* Keep native constraints/focus, but never depend on the browser UI language.
           Clear custom errors before reading validity so corrections can recover. */
        var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
        function localizeValidity(field) {
          if (!field || typeof field.setCustomValidity !== 'function') { return; }
          field.setCustomValidity('');
          var validity = field.validity;
          var error = validity.valueMissing ? copy.requiredField
            : validity.typeMismatch ? copy.invalidEmail
            : validity.tooShort ? copy.tooShort.replace('{min}', String(field.minLength))
            : validity.tooLong ? copy.tooLong.replace('{max}', String(field.maxLength)) : '';
          field.setCustomValidity(error);
        }
        form.addEventListener('invalid', function (event) { localizeValidity(event.target); }, true);
        fields.forEach(function (field) {
          field.addEventListener('input', function () { localizeValidity(field); });
          field.addEventListener('change', function () { localizeValidity(field); });
        });
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          fields.forEach(localizeValidity);
          if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
            if (typeof form.reportValidity === 'function') { form.reportValidity(); }
            return;
          }
          var data = new FormData(form);
          var name = String(data.get('nombre') || '').trim();
          var from = String(data.get('correo') || '').trim();
          var subject = String(data.get('asunto') || '').trim() || copy.defaultSubject;
          var message = String(data.get('mensaje') || '').trim();
          /* whitespace alone satisfies `required`, so reject blank text fields explicitly */
          if (!name || !message) {
            if (formStatus) {
              formStatus.textContent = !name
                ? copy.blankName
                : copy.blankMessage;
            }
            var blankField = document.getElementById(!name ? 'f-nombre' : 'f-mensaje');
            if (blankField && typeof blankField.focus === 'function') { blankField.focus(); }
            return;
          }
          var body = copy.mailName + name + '\n' + copy.mailEmail + from + '\n\n' + message;
          if (formStatus) {
            formStatus.textContent = copy.openingMail;
          }
          openMailto('?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body));
        });
      }

      /* ── Copy email with fallback ────────────────────────────────── */
      var copyButton = document.getElementById('copiar-email');
      var copyStatus = document.getElementById('copy-status');

      function legacyCopy(text) {
        var helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.top = '-1000px';
        document.body.appendChild(helper);
        helper.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        document.body.removeChild(helper);
        return ok;
      }

      function reportCopy(ok) {
        if (!copyStatus) { return; }
        copyStatus.textContent = ok
          ? copy.copied.replace('{email}', EMAIL)
          : copy.copyFailed.replace('{email}', EMAIL);
      }

      if (copyButton) {
        copyButton.addEventListener('click', function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(EMAIL).then(
              function () { reportCopy(true); },
              function () { reportCopy(legacyCopy(EMAIL)); }
            );
          } else {
            reportCopy(legacyCopy(EMAIL));
          }
        });
      }

      /* ── Procedural smoke backdrop ───────────────────────────────── */
      /* A domain-warped noise field is painted pixel by pixel into a small
         canvas that the browser scales to the viewport: the smoke covers
         every section and keeps deforming instead of sliding a picture.
         All noise comes from a seeded integer hash — no image, no library.
         Cost is bounded by a capped internal resolution and a frame throttle.
         The loop stops on the Pause control,
         on a hidden tab, on a persisted pagehide, and holds one static frame
         under prefers-reduced-motion; a canvas failure restores the CSS veil
         without breaking the rest of the page. */
      var smokeActive = false;
      var smokeSyncControl = null;
      var smokeControlOwner = false;

      /* Palette colours are resolved from the tokens through a 1x1 canvas, so
         the smoke carries no hardcoded colour. Any probe failure returns null
         and the caller keeps the static fallback. */
      function readSmokePalette() {
        try {
          var probe = document.createElement('canvas');
          probe.width = 1;
          probe.height = 1;
          var probeContext = probe.getContext('2d');
          if (!probeContext || !probeContext.getImageData) { return null; }
          var rootStyles = getComputedStyle(document.documentElement);

          /* black sentinel: an unresolved token leaves the pixel black */
          function readToken(name) {
            var value = rootStyles.getPropertyValue(name).trim();
            if (!value) { return null; }
            probeContext.clearRect(0, 0, 1, 1);
            probeContext.fillStyle = 'rgb(0, 0, 0)';
            probeContext.fillStyle = value;
            probeContext.fillRect(0, 0, 1, 1);
            var pixel = probeContext.getImageData(0, 0, 1, 1).data;
            if (pixel[3] === 0 || pixel[0] + pixel[1] + pixel[2] === 0) { return null; }
            return [pixel[0], pixel[1], pixel[2]];
          }

          var fg = readToken('--atmosphere-high');
          var surface = readToken('--atmosphere-base');
          var neutral = readToken('--atmosphere-low');
          if (!fg || !surface || !neutral) { return null; }
          return {
            neutral: neutral,
            fg: fg,
            base: surface
          };
        } catch {
          return null;
        }
      }

      function setupSmoke(smokeCanvas) {
        var context = null;
        var palette = null;
        try {
          context = smokeCanvas.getContext('2d');
          if (context && context.createImageData && context.putImageData) {
            palette = readSmokePalette();
          }
        } catch {
          context = null;
        }
        if (!context || !palette) { return false; }

        var TILE = 96;            /* noise tile, wraps on both axes */
        var CELLS = 6;            /* hash cells per tile edge, 16 texels each */
        var OCTAVES = 5;          /* five octaves, down to a single texel */
        var SPAN = 8.4;           /* noise texels across the viewport width at the
                                     fold scale: one texel is roughly an eighth of
                                     the width, the current scale of the reference */
        /* T19: two currents, not one. Each axis is its own rotated, stretched
           sampling basis, so the field carries two discontinuous diagonal
           flows that cross and break apart instead of a single continuous
           drift. They still share the same three physical scales. */
        var CURRENT_A = -0.62;    /* radians: the primary diagonal current */
        var RUN_A = 2.1;          /* elongation along that axis */
        var CROSS_A = 0.64;       /* compression across it, so strands stay thin */
        var CURRENT_B = 0.58;     /* radians: the secondary counter-diagonal */
        var RUN_B = 1.7;          /* shorter, so the second current reads distinct */
        var CROSS_B = 0.72;       /* a little wider, so its folds are softer */
        var DRIFT_U = 0.23;       /* slow flow along the currents, texels/second */
        var DRIFT_V = -0.17;      /* upwards, so the smoke keeps rising */
        var MORPH = 0.22;         /* rad/s of the field's third-axis cycle */
        var WARP = 9.5;           /* fold-scale domain-warp strength, in texels */
        /* Original peak alpha; the dedicated palette adds only a restrained tint. */
        var ALPHA_MAX = 0.74;     /* peak before the Canvas2D opacity/scrim */
        /* Three sampling scales, one per physical scale of the reference: the
           envelope is the broad region that allows smoke at all, the fold is
           the mid-scale curl, and the filament is the fine strand inside it. */
        var ENV_SCALE = 0.33;
        var FOLD_SCALE = 0.9;
        var FINE_SCALE = 1.85;
        /* Internal resolution: bounded on the viewport's longest edge. T19
           raises the wide cap one step so the finer second current keeps its
           ridges, and trims the throttle to ~22fps to pay for the extra
           sampling, so the per-second cost stays inside the previous budget. */
        var MAX_EDGE = 384;
        var MAX_EDGE_NARROW = 248;
        var NARROW_VIEW = 760;    /* viewport width that picks the smaller cap */
        var MIN_EDGE = 56;
        var STATIC_TIME = 21.5;   /* the frame painted under reduced motion */

        /* ── noise: tileable 3D value noise from an integer hash ── */
        function hash(x, y, z) {
          var n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041);
          n = Math.imul(n ^ (n >>> 13), 1274126177);
          return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
        }

        function noise(x, y, z, period) {
          var xi = Math.floor(x);
          var yi = Math.floor(y);
          var zi = Math.floor(z);
          var fx = x - xi;
          var fy = y - yi;
          var fz = z - zi;
          var ux = fx * fx * (3 - 2 * fx);
          var uy = fy * fy * (3 - 2 * fy);
          var uz = fz * fz * (3 - 2 * fz);
          var x0 = ((xi % period) + period) % period;
          var y0 = ((yi % period) + period) % period;
          var x1 = x0 + 1 === period ? 0 : x0 + 1;
          var y1 = y0 + 1 === period ? 0 : y0 + 1;
          var z1 = zi + 1;
          var c000 = hash(x0, y0, zi);
          var c100 = hash(x1, y0, zi);
          var c010 = hash(x0, y1, zi);
          var c110 = hash(x1, y1, zi);
          var c001 = hash(x0, y0, z1);
          var c101 = hash(x1, y0, z1);
          var c011 = hash(x0, y1, z1);
          var c111 = hash(x1, y1, z1);
          var near0 = c000 + (c100 - c000) * ux;
          var near1 = c010 + (c110 - c010) * ux;
          var far0 = c001 + (c101 - c001) * ux;
          var far1 = c011 + (c111 - c011) * ux;
          var near = near0 + (near1 - near0) * uy;
          var far = far0 + (far1 - far0) * uy;
          return near + (far - near) * uz;
        }

        /* a smooth 0..1 step: used to gate the smoke, so whole regions stay at
           true black instead of being lifted by a diffuse veil */
        function smoothStep(edge0, edge1, value) {
          var t = (value - edge0) / (edge1 - edge0);
          if (t <= 0) { return 0; }
          if (t >= 1) { return 1; }
          return t * t * (3 - 2 * t);
        }

        /* one-dimensional value noise for the vertical density envelope. It
           opens and closes the currents irregularly down the page, so the
           field never reads as flat horizontal strips the way the earlier
           sine envelope did. */
        function rowNoise(t) {
          var i = Math.floor(t);
          var f = t - i;
          var a = hash(i, 91, 7);
          var b = hash(i + 1, 91, 7);
          var u = f * f * (3 - 2 * f);
          return a + (b - a) * u;
        }

        /* One z-slice of the field. Two slices at different z are two moments
           of the same noise, so cross-fading them deforms the smoke
           continuously instead of translating a frozen pattern. */
        function buildSlice(z) {
          var tile = new Float32Array(TILE * TILE);
          var cell = TILE / CELLS;
          var x, y, octave, amplitude, frequency, normalize, value;
          for (y = 0; y < TILE; y += 1) {
            for (x = 0; x < TILE; x += 1) {
              normalize = 0;
              amplitude = 0.5;
              value = 0;
              for (octave = 0; octave < OCTAVES; octave += 1) {
                frequency = 1 << octave;
                value += amplitude * noise(
                  (x / cell) * frequency,
                  (y / cell) * frequency,
                  z * (0.7 + octave * 0.35),
                  CELLS * frequency
                );
                normalize += amplitude;
                amplitude *= 0.5;
              }
              tile[y * TILE + x] = value / normalize;
            }
          }
          return tile;
        }

        /* bilinear sample of both z-slices, blended by morph: two moments of
           the same noise cross-fading, so the field deforms instead of
           sliding */
        function sampleField(x, y, morph) {
          var xi = Math.floor(x);
          var yi = Math.floor(y);
          var fx = x - xi;
          var fy = y - yi;
          var x0 = ((xi % TILE) + TILE) % TILE;
          var y0 = ((yi % TILE) + TILE) % TILE;
          var x1 = x0 + 1 === TILE ? 0 : x0 + 1;
          var y1 = y0 + 1 === TILE ? 0 : y0 + 1;
          var row0 = y0 * TILE;
          var row1 = y1 * TILE;
          var a = sliceA[row0 + x0];
          var b = sliceA[row0 + x1];
          var c = sliceA[row1 + x0];
          var d = sliceA[row1 + x1];
          var e = sliceB[row0 + x0];
          var f = sliceB[row0 + x1];
          var g = sliceB[row1 + x0];
          var h = sliceB[row1 + x1];
          var topA = a + (b - a) * fx;
          var botA = c + (d - c) * fx;
          var topB = e + (f - e) * fx;
          var botB = g + (h - g) * fx;
          var from = topA + (botA - topA) * fy;
          var to = topB + (botB - topB) * fy;
          return from + (to - from) * morph;
        }

        var sliceA = buildSlice(0);
        var sliceB = buildSlice(2.6);

        /* density ramp baked once, in the page's own greys: the darkest
           strands sit just above black and the crests reach white, so the
           whorls stay defined instead of washing into a soft grey field */
        var lutR = new Uint8Array(256);
        var lutG = new Uint8Array(256);
        var lutB = new Uint8Array(256);
        var lutA = new Uint8Array(256);
        var thin = [0, 0, 0];
        var dense = [0, 0, 0];
        for (var channel = 0; channel < 3; channel += 1) {
          thin[channel] = palette.base[channel] * 0.34;
          dense[channel] = palette.neutral[channel] + (palette.fg[channel] - palette.neutral[channel]) * 0.92;
        }
        for (var step = 0; step < 256; step += 1) {
          var level = step / 255;
          /* Keep low-density moving folds perceptible; zero density still
             has zero alpha, preserving black gaps rather than a uniform veil. */
          var tone = Math.pow(level, 0.65);
          var shape = 0.2 * level + 0.8 * Math.pow(level, 1.15);
          lutR[step] = thin[0] + (dense[0] - thin[0]) * tone;
          lutG[step] = thin[1] + (dense[1] - thin[1]) * tone;
          lutB[step] = thin[2] + (dense[2] - thin[2]) * tone;
          lutA[step] = 255 * ALPHA_MAX * shape;
        }

        var width = 0;
        var height = 0;
        var pixels = null;
        var bytes = null;
        var rowMask = null;
        var frameInterval = 1000 / 22;
        var frameId = 0;
        var resizeTimer = 0;
        var clock = STATIC_TIME;
        var lastStamp = 0;
        var broken = false;
        var userPaused = false;
        var visible = !document.hidden;
        var reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        var pauseControl = document.getElementById('orb-pausa');
        var listeners = [];

        function reduced() {
          return !!(reducedQuery && reducedQuery.matches);
        }

        function canRun() {
          return !broken && !userPaused && !reduced() && visible;
        }

        /* longest edge capped per viewport class, so the pixel cost stays
           bounded from phone to 4K */
        function resize() {
          var viewWidth = Math.max(1, Math.round(window.innerWidth || 1));
          var viewHeight = Math.max(1, Math.round(window.innerHeight || 1));
          var cap = viewWidth < NARROW_VIEW ? MAX_EDGE_NARROW : MAX_EDGE;
          var ratio = Math.min(1, cap / Math.max(viewWidth, viewHeight));
          var nextWidth = Math.max(MIN_EDGE, Math.round(viewWidth * ratio));
          var nextHeight = Math.max(MIN_EDGE, Math.round(viewHeight * ratio));
          if (nextWidth === width && nextHeight === height) { return; }
          width = nextWidth;
          height = nextHeight;
          smokeCanvas.width = width;
          smokeCanvas.height = height;
          pixels = null;
          try { pixels = context.createImageData(width, height); } catch { pixels = null; }
          if (!pixels || !pixels.data) { breakSmoke(); return; }
          bytes = pixels.data;
          rowMask = new Uint16Array(height);
          for (var y = 0; y < height; y += 1) {
            var position = height > 1 ? y / (height - 1) : 0;
            /* T15 replaces the smooth sine envelope with an irregular one: a
               low-frequency 1-D noise opens and closes the currents down the
               page, and a short edge falloff still keeps the nav and the
               footer on the darkest part of the field. The sine read as
               horizontal bands, which is exactly what this removes. */
            var edge = Math.min(1, position / 0.18) * Math.min(1, (1 - position) / 0.16);
            edge = Math.pow(Math.max(0, edge), 0.72);
            var envelope = 0.6 + 0.4 * rowNoise(position * 3.4 + 0.37);
            rowMask[y] = Math.round(255 * envelope * (0.84 + 0.16 * edge));
          }
        }

        function paint(time) {
          if (broken || !bytes || !width || !height) { return; }
          var morphNear = 0.5 - 0.5 * Math.cos(time * MORPH);
          var morphFar = 0.5 - 0.5 * Math.cos(time * MORPH * 0.62 + 0.9);
          var driftU = time * DRIFT_U;
          var driftV = time * DRIFT_V;
          /* the field breathes slowly: stretch and density drift on their own
             clocks, so the same curls change shape instead of repeating */
          var stretchU = SPAN * (1 + 0.12 * Math.sin(time * 0.047));
          var stretchV = SPAN * (height / width) * (1 - 0.09 * Math.sin(time * 0.033 + 1.2));
          var breathe = 0.9 + 0.1 * Math.sin(time * 0.029);
          /* The sampling basis is rotated onto the currents' diagonal and then
             stretched along it and compressed across it, so the field varies
             slowly along the flow and quickly across it. That is what turns a
             generic noise field into long, thin, irregular diagonal currents
             instead of rows, blobs or a uniform grey wash. */
          var cosA = Math.cos(CURRENT_A);
          var sinA = Math.sin(CURRENT_A);
          var runA = 1 / RUN_A;
          var cosB = Math.cos(CURRENT_B);
          var sinB = Math.sin(CURRENT_B);
          var runB = 1 / RUN_B;
          var x, y, pointer, u, v, mask, duA, dvA, duB, dvB, envA, envB, fineA, fineB, warpX, warpY, foldA, foldB, ridgeEnvA, ridgeFoldA, ridgeFineA, ridgeEnvB, ridgeFoldB, ridgeFineB, gateA, gateB, currentA, currentB, baseFold, baseSmoke, envelopes, density, level;
          pointer = 0;
          for (y = 0; y < height; y += 1) {
            v = (y / height) * stretchV + driftV;
            mask = rowMask[y];
            for (x = 0; x < width; x += 1) {
              u = (x / width) * stretchU + driftU;
              /* Two rotated, anisotropic bases: each current is stretched along
                 its own diagonal and compressed across it, so the field varies
                 slowly along the flow and quickly across it. */
              duA = (u * cosA - v * sinA) * runA;
              dvA = (u * sinA + v * cosA) * CROSS_A;
              duB = (u * cosB - v * sinB) * runB;
              dvB = (u * sinB + v * cosB) * CROSS_B;
              /* Current A: a broad envelope, a domain-warped mid-scale fold and
                 a fine strand. The envelope gates everything, so wherever it is
                 closed the field stays at true black. */
              envA = sampleField(duA * ENV_SCALE, dvA * ENV_SCALE, morphFar);
              fineA = sampleField(duA * FINE_SCALE, dvA * FINE_SCALE, morphNear);
              warpX = sampleField(duA * ENV_SCALE + 7, dvA * ENV_SCALE + 3, morphFar);
              warpY = sampleField(duA * ENV_SCALE - 5, dvA * ENV_SCALE + 4, morphNear);
              /* second-level domain warping folds the strands into curls */
              foldA = sampleField(
                duA * FOLD_SCALE + (warpX - 0.5) * WARP,
                dvA * FOLD_SCALE + (warpY - 0.5) * WARP,
                morphNear
              );
              /* Current B: its own offset envelope and folds, so the two flows
                 are discontinuous and can cross without reading as one field. */
              envB = sampleField(duB * ENV_SCALE + 11, dvB * ENV_SCALE - 8, morphFar);
              fineB = sampleField(duB * FINE_SCALE - 6, dvB * FINE_SCALE + 5, morphNear);
              foldB = sampleField(
                duB * FOLD_SCALE + (envB - 0.5) * WARP,
                dvB * FOLD_SCALE + (envA - 0.5) * WARP,
                morphFar
              );
              ridgeEnvA = 1 - Math.abs(envA * 2 - 1);
              ridgeFoldA = 1 - Math.abs(foldA * 2 - 1);
              ridgeFineA = 1 - Math.abs(fineA * 2 - 1);
              ridgeEnvB = 1 - Math.abs(envB * 2 - 1);
              ridgeFoldB = 1 - Math.abs(foldB * 2 - 1);
              ridgeFineB = 1 - Math.abs(fineB * 2 - 1);
              gateA = smoothStep(0.5, 0.88, envA);
              gateB = smoothStep(0.54, 0.9, envB);
              currentA = gateA * Math.pow(ridgeFoldA, 2.2) * (0.32 + 0.46 * ridgeEnvA);
              currentB = gateB * Math.pow(ridgeFoldB, 2.2) * (0.32 + 0.46 * ridgeEnvB);
              /* A moving fold base survives closed current envelopes. Its
                 own ridge gaps remain black; no extra noise samples or loop. */
              baseFold = Math.max(ridgeFoldA, ridgeFoldB);
              baseSmoke = smoothStep(0.48, 0.9, baseFold) *
                (0.16 + 0.18 * Math.max(ridgeFineA, ridgeFineB));
              envelopes = Math.max(gateA, gateB) * (0.045 + 0.06 * Math.max(ridgeEnvA, ridgeEnvB));
              density = Math.max(baseSmoke, Math.max(currentA, currentB) + envelopes);
              density = density > 1 ? 1 : density;
              level = density <= 0 ? 0 : (density * 255.99) | 0;
              bytes[pointer] = lutR[level];
              bytes[pointer + 1] = lutG[level];
              bytes[pointer + 2] = lutB[level];
              bytes[pointer + 3] = (lutA[level] * mask * breathe) >> 8;
              pointer += 4;
            }
          }
          try {
            context.putImageData(pixels, 0, 0);
          } catch {
            breakSmoke();
            return;
          }
        }

        function tick(stamp) {
          frameId = window.requestAnimationFrame(tick);
          if (!canRun()) { return; }
          if (!lastStamp) { lastStamp = stamp; return; }
          var elapsed = stamp - lastStamp;
          if (elapsed < frameInterval) { return; }
          lastStamp = stamp;
          /* the step is capped, so a restored or throttled tab never jumps */
          clock += Math.min(elapsed, 90) / 1000;
          paint(clock);
        }

        function start() {
          if (frameId || !canRun() || !window.requestAnimationFrame) { return; }
          lastStamp = 0;
          frameId = window.requestAnimationFrame(tick);
        }

        function stop() {
          if (frameId) {
            window.cancelAnimationFrame(frameId);
            frameId = 0;
          }
        }

        /* the shared Pause control is only relabelled here when the orb could
           not claim it; otherwise the orb owns its own wording */
        function syncControl() {
          if (!smokeControlOwner || !pauseControl) { return; }
          var still = reduced();
          var active = !userPaused && !still;
          pauseControl.disabled = still;
          setPauseLabel(still ? copy.reduced : (userPaused ? copy.resume : copy.pause));
          pauseControl.setAttribute('aria-pressed', active ? 'false' : 'true');
          pauseControl.setAttribute('aria-label', still
            ? copy.reducedBackground
            : (userPaused ? copy.backgroundPaused : copy.backgroundRunning));
        }

        function onPauseClick() {
          userPaused = !userPaused;
          if (userPaused) { stop(); } else { start(); }
          syncControl();
          /* D4: the owner updates its own pressed state first, then the shared
             switch is re-evaluated from it, so motion-on/off and the reveals
             never keep a stale class after a fallback pause */
          applyMotionState();
        }

        function onPreferenceChange() {
          if (reduced()) { stop(); paint(clock); } else { start(); }
          syncControl();
        }

        function onVisibilityChange() {
          visible = !document.hidden;
          if (visible) { start(); } else { stop(); }
        }

        /* one coalesced resize: the field repaints once, not per event */
        function onResize() {
          if (resizeTimer) { return; }
          resizeTimer = window.setTimeout(function () {
            resizeTimer = 0;
            resize();
            paint(clock);
          }, 150);
        }

        /* suspended, not torn down, when the page may return from the
           back/forward cache */
        function onPageHide(event) {
          objectInteractions.cancel();
          stop();
          if (event && event.persisted) { return; }
          teardown();
        }

        function onPageShow(event) {
          if (event && event.persisted) { start(); }
        }

        function listen(target, type, handler) {
          if (!target || !target.addEventListener) { return; }
          target.addEventListener(type, handler);
          listeners.push([target, type, handler]);
        }

        function teardown() {
          stop();
          if (resizeTimer) { window.clearTimeout(resizeTimer); resizeTimer = 0; }
          for (var i = 0; i < listeners.length; i += 1) {
            listeners[i][0].removeEventListener(listeners[i][1], listeners[i][2]);
          }
          listeners.length = 0;
        }

        function breakSmoke() {
          broken = true;
          smokeActive = false;
          stop();
          document.documentElement.classList.remove('smoke-active');
        }

        document.documentElement.classList.add('smoke-active');
        resize();
        paint(clock);
        if (broken) { return false; }
        smokeSyncControl = syncControl;
        if (pauseControl) { listen(pauseControl, 'click', onPauseClick); }
        listen(window, 'resize', onResize);
        listen(document, 'visibilitychange', onVisibilityChange);
        listen(window, 'pagehide', onPageHide);
        listen(window, 'pageshow', onPageShow);
        if (reducedQuery && reducedQuery.addEventListener) {
          listen(reducedQuery, 'change', onPreferenceChange);
        }
        if (!window.requestAnimationFrame) { userPaused = true; }
        start();
        return true;
      }

      var smokeCanvas = document.getElementById('smoke-canvas');

      /* Exclusive Canvas2D fallback. The original procedural smoke and the
         original point sphere only run when the shared WebGL scene could not
         start, so the page never keeps two ambient loops alive at once. */
      function startSmoke2D() {
        if (!smokeCanvas || smokeActive) { return; }
        /* a probe or canvas failure must never break the rest of the page */
        try {
          smokeActive = setupSmoke(smokeCanvas);
        } catch {
          smokeActive = false;
        }
      }

      /* T23: the scroll bridge starts only once the hero has begun to leave the
         viewport — its bottom edge crossing the viewport bottom — and completes
         as the hero is nearly gone. One geometry helper owns the scroll bounds
         so the shared ramp below and the ScrollTrigger numeric start/end can
         never drift apart. HERO_EXIT_SPAN is the ramp in viewport heights. */
      var HERO_EXIT_SPAN = 0.88;

      /* start is the document scroll position at which the hero's bottom edge
         reaches the viewport bottom, clamped to 0. The clamp keeps the sphere
         fully organised at scroll top on any viewport: when the hero is shorter
         than the window its bottom already sits above the viewport bottom, so an
         unclamped start would be negative and report a positive progress before
         the reader has scrolled at all. span is the ramp length in pixels. */
      function heroExitBounds(section) {
        var vh = window.innerHeight || 1;
        var span = vh * HERO_EXIT_SPAN;
        if (span < 1) { span = 1; }
        if (!section) { return { start: 0, span: span }; }
        var scrollY = window.scrollY || window.pageYOffset || 0;
        var rect = section.getBoundingClientRect();
        var start = rect.bottom + scrollY - vh;
        if (start < 0) { start = 0; }
        return { start: start, span: span };
      }

      function heroExitProgress(section) {
        if (!section) { return 0; }
        var bounds = heroExitBounds(section);
        var scrollY = window.scrollY || window.pageYOffset || 0;
        var t = (scrollY - bounds.start) / bounds.span;
        if (t <= 0) { return 0; }
        if (t >= 1) { return 1; }
        return t;
      }

      /* ── Particle sphere ──────────────────────────────────────────── */
      /* The hero visual owns an open particle sphere: a point cloud painted
         on the canvas, reusing the single shared loop, the Pause control,
         the reduced-motion hold, the visibility stop and the pagehide
         suspension instead of adding a second motion system. The body of the
         sphere is white depth over the black backdrop, tilted back and
         turning slowly; a few tiny lavender points carry the accent. */
      var canvas = document.getElementById('orb-canvas');
      var pauseButton = document.getElementById('orb-pausa');
      var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

      function setupOrb(ctx) {
        var rootStyles = getComputedStyle(document.documentElement);
        var COLOR_ACCENT = rootStyles.getPropertyValue('--accent').trim() || 'oklch(60.4% 0.293 310)';
        var COLOR_MUTED = rootStyles.getPropertyValue('--muted').trim() || 'oklch(83.5% 0.006 96)';
        var COLOR_FG = rootStyles.getPropertyValue('--fg').trim() || 'oklch(97.4% 0.01 92)';

        /* an even spherical distribution: the golden-angle spiral keeps the
           density uniform, so no ring or pole reads heavier than the rest.
           T17 adds three states on top of the same 460 points instead of
           adding points: a deterministic dispersal per point for the entry,
           a screen-space spring offset for the pointer and the tap, and a
           blended lattice target for the scroll bridge. */
        var COUNT = 460;
        var points = [];
        var dispX = new Float32Array(COUNT);
        var dispY = new Float32Array(COUNT);
        var offX = new Float32Array(COUNT);
        var offY = new Float32Array(COUNT);
        var velX = new Float32Array(COUNT);
        var velY = new Float32Array(COUNT);
        /* T19: a deterministic per-point size and luminance, so the cloud is
           made of varied bright white points instead of one uniform dot
           radius. Two integer hashes give a long-tail size distribution (most
           points small, a few noticeably larger) and a gentle luminance
           spread, with no random source. */
        var sizeSeed = new Float32Array(COUNT);
        var brightSeed = new Float32Array(COUNT);
        var index;
        for (index = 0; index < COUNT; index += 1) {
          var latitude = 1 - (index / (COUNT - 1)) * 2;
          var ring = Math.sqrt(Math.max(0, 1 - latitude * latitude));
          var angle = index * 2.399963229728653;
          points.push([Math.cos(angle) * ring, latitude, Math.sin(angle) * ring]);
          /* the entry unfolds from these offsets, so the assemble is
             reproducible and needs no random source */
          var spread = 0.6 + 0.4 * (((Math.imul(index, 2654435761) >>> 0) % 1024) / 1024);
          var bearing = index * 1.7;
          dispX[index] = Math.cos(bearing) * spread;
          dispY[index] = Math.sin(bearing * 1.31) * spread;
          var sizeRoll = ((Math.imul(index, 2246822519) >>> 0) % 1000) / 1000;
          sizeSeed[index] = 0.5 + sizeRoll * sizeRoll * 1.6;
          var brightRoll = ((Math.imul(index, 3266489917) >>> 0) % 1000) / 1000;
          brightSeed[index] = 0.62 + brightRoll * 0.5;
        }

        var width = 0;
        var height = 0;
        var spin = 0;
        var yaw = 0;
        var yawTarget = 0;
        var tilt = -0.18;
        var tiltTarget = -0.18;
        /* explicit user intent only: the reduced-motion preference is read
           separately, so a preference change never discards a user pause */
        var userPaused = false;
        var frameId = 0;
        var visible = !document.hidden;
        var disposed = false;
        var suspended = false;
        var touchTimeout = 0;
        var removers = [];

        /* Keep the exact registered references, including anonymous callbacks,
           so terminal pagehide releases every fallback-owned listener. */
        function listen(target, type, callback, options) {
          function guarded(event) {
            if (!disposed) { callback(event); }
          }
          target.addEventListener(type, guarded, options);
          removers.push(function () { target.removeEventListener(type, guarded, options); });
        }

        function dispose() {
          if (disposed) { return; }
          disposed = true;
          visible = false;
          stop();
          if (touchTimeout) { window.clearTimeout(touchTimeout); touchTimeout = 0; }
          removers.forEach(function (remove) { remove(); });
          removers.length = 0;
          orbInteractionRedraw = null;
          orbContextChange = null;
          orbPointerBridge = null;
        }

        /* entry: the dispersed points converge on the sphere over ENTER_MS,
           inside the 400–700 ms entry band */
        var ENTER_MS = 560;
        var entry = 0;
        /* pointer and tap state, in canvas CSS pixels */
        var pointerX = 0;
        var pointerY = 0;
        var pointerOn = false;
        var pulseT = -1;
        var pulseAge = 1;
        var pulseX = 0;
        var pulseY = 0;
        /* scroll bridge: 0 at the hero, GRID_MAX once the hero has left. The
           blend stays partial, so the sphere keeps its volume and silhouette
           while a lattice starts to read through it toward the work section. */
        var GRID_MAX = 0.45;
        var GRID_COLS = 20;
        var morph = 0;
        var morphTarget = 0;
        var lastStamp = 0;

        function resize() {
          if (disposed || suspended) { return; }
          var rect = canvas.getBoundingClientRect();
          var ratio = Math.min(window.devicePixelRatio || 1, 2);
          width = rect.width;
          height = rect.height;
          if (!width || !height) { return; }
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        /* One frame. `live` is true while the loop is running: only then do
           the entry, the springs and the scroll bridge advance. When the
           sphere is paused or reduced it renders one fully organised frame
           instead, so the readable state is always the assembled sphere. */
        function render(dt, live) {
          if (disposed || suspended || !width || !height) { return; }
          var assembling = live && entry < 1;
          var a = assembling ? entry : 1;
          var grid = live && !reduced() ? morph : 0;
          ctx.clearRect(0, 0, width, height);

          var centerX = width / 2;
          var centerY = height / 2;
          /* the sphere is larger and reaches further into the open space */
          var orbRadius = Math.min(width, height) * 0.46;

          /* T19: the canvas field is fully transparent. The earlier near-white
             radial glow was painted across the whole canvas with fillRect,
             which gave the borderless sphere a faint rectangular perceived
             area. Only the points (and their tiny accent halos) are painted
             now, so the field reads as points in open space, never a panel. */

          var manual = objectInteractions.objects.hero;
          var active = manual.hover || manual.focus;
          var rotation = spin + yaw + manual.yaw + (active ? 0.18 : 0);
          var cosR = Math.cos(rotation);
          var sinR = Math.sin(rotation);
          var manualTilt = tilt + manual.pitch - (active ? 0.12 : 0);
          var cosT = Math.cos(manualTilt);
          var sinT = Math.sin(manualTilt);

          /* the local pointer field and the tap wave, both in canvas pixels */
          var repR = orbRadius * 0.42;
          if (repR < 24) { repR = 24; }
          var repR2 = repR * repR;
          var pulseR = 0;
          var pulseStrength = 0;
          if (live && pulseT >= 0 && pulseAge < 1) {
            pulseR = orbRadius * (0.5 + pulseAge * 1.4);
            pulseStrength = (1 - pulseAge) * 3.2;
          }

          /* lattice geometry for the scroll bridge: the same points settle
             onto a sparse grid that spans the canvas, and neighbours inside a
             row are joined by hairlines whose weight follows the blend */
          var cols = GRID_COLS;
          var rows = Math.ceil(COUNT / cols);
          var cellW = width / (cols + 1);
          var cellH = height / (rows + 1);
          var lineAlpha = grid > 0.05 ? (grid - 0.05) * 0.5 : 0;
          /* the hairlines live in their own Path2D: the per-dot beginPath()
             calls of the dot pass below reset the context path, so a shared
             ctx path would be discarded and never stroked */
          var lattice = lineAlpha > 0 ? new Path2D() : null;

          for (var i = 0; i < COUNT; i += 1) {
            var point = points[i];
            var x = point[0] * cosR - point[2] * sinR;
            var z = point[0] * sinR + point[2] * cosR;
            var yt = point[1] * cosT - z * sinT;
            var zt = point[1] * sinT + z * cosT;
            var scale = 2.1 / (2.1 + zt);
            var depth = (zt + 1) / 2;
            /* the body stays bright white with the front points carrying most
               of the light; only a few points are the violet glints, and only
               those get a soft halo, so the accent reads as a spark */
            var highlight = i % 17 === 0;
            var dotX = centerX + x * orbRadius * scale;
            var dotY = centerY + yt * orbRadius * scale;

            /* the entry: the point starts pushed out along its own dispersal
               direction and lands on the sphere as the progress completes */
            if (assembling) {
              var away = (1 - a) * orbRadius * 1.15;
              dotX += dispX[i] * away;
              dotY += dispY[i] * away;
            }

            /* the scroll bridge: a partial blend from the projected point
               toward its lattice slot */
            var col = i % cols;
            var row = (i - col) / cols;
            var gx = cellW * (col + 1);
            var gy = cellH * (row + 1);
            dotX += (gx - dotX) * grid;
            dotY += (gy - dotY) * grid;

            /* pointer repulsion and the tap wave push the point out; the
               spring then pulls it home, so the displacement always returns */
            if (live) {
              if (pointerOn) {
                var px = dotX - pointerX;
                var py = dotY - pointerY;
                var pd2 = px * px + py * py;
                if (pd2 < repR2 && pd2 > 0.01) {
                  var pd = Math.sqrt(pd2);
                  var push = (1 - pd / repR) * 0.9 * dt;
                  velX[i] += (px / pd) * push;
                  velY[i] += (py / pd) * push;
                }
              }
              if (pulseStrength > 0) {
                var qx = dotX - pulseX;
                var qy = dotY - pulseY;
                var qd = Math.sqrt(qx * qx + qy * qy) || 1;
                if (qd < pulseR) {
                  var wave = (1 - qd / pulseR) * pulseStrength * dt;
                  velX[i] += (qx / qd) * wave;
                  velY[i] += (qy / qd) * wave;
                }
              }
              velX[i] += -offX[i] * 0.08 * dt;
              velY[i] += -offY[i] * 0.08 * dt;
              velX[i] *= 0.9;
              velY[i] *= 0.9;
              offX[i] += velX[i] * dt;
              offY[i] += velY[i] * dt;
            }
            dotX += offX[i];
            dotY += offY[i];

            /* add this row's hairline to the batched lattice path */
            if (lattice && col < cols - 1 && i + 1 < COUNT) {
              var j = i + 1;
              var np = points[j];
              var nx = np[0] * cosR - np[2] * sinR;
              var nz = np[0] * sinR + np[2] * cosR;
              var nyt = np[1] * cosT - nz * sinT;
              var nzt = np[1] * sinT + nz * cosT;
              var nScale = 2.1 / (2.1 + nzt);
              var nDotX = centerX + nx * orbRadius * nScale;
              var nDotY = centerY + nyt * orbRadius * nScale;
              if (assembling) {
                var nAway = (1 - a) * orbRadius * 1.15;
                nDotX += dispX[j] * nAway;
                nDotY += dispY[j] * nAway;
              }
              var nCol = j % cols;
              var nRow = (j - nCol) / cols;
              nDotX += (cellW * (nCol + 1) - nDotX) * grid + offX[j];
              nDotY += (cellH * (nRow + 1) - nDotY) * grid + offY[j];
              lattice.moveTo(dotX, dotY);
              lattice.lineTo(nDotX, nDotY);
            }

            /* T19: each point owns its size and its luminance, so the cloud
               reads as varied bright white points with real depth instead of
               one uniform dot; the accent glints stay rare. */
            var dotRadius = (highlight ? 1 : 1.3) * (0.45 + depth) * scale * sizeSeed[i];
            if (assembling) { dotRadius *= 0.45 + 0.55 * a; }

            if (highlight) {
              ctx.globalAlpha = Math.min(1, (0.06 + depth * 0.22) * (assembling ? a : 1));
              ctx.fillStyle = COLOR_ACCENT;
              ctx.beginPath();
              ctx.arc(dotX, dotY, dotRadius * 3.1, 0, 6.283185307179586);
              ctx.fill();
            }

            ctx.globalAlpha = Math.min(1, ((highlight ? 0.16 : 0.22) + depth * (highlight ? 0.34 : 0.78)) * brightSeed[i] * (assembling ? 0.25 + 0.75 * a : 1));
            ctx.fillStyle = highlight ? COLOR_ACCENT : COLOR_FG;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, 6.283185307179586);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          if (lattice) {
            ctx.strokeStyle = COLOR_MUTED;
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 1;
            ctx.stroke(lattice);
            ctx.globalAlpha = 1;
          }
        }

        function reduced() {
          return !!(motionQuery && motionQuery.matches);
        }

        function step(stamp) {
          if (!canRun()) { stop(); return; }
          frameId = window.requestAnimationFrame(step);
          var now = stamp || 0;
          var elapsed = lastStamp ? Math.min(now - lastStamp, 48) : 16.7;
          lastStamp = now;
          /* the step is expressed in 60 Hz frames and capped, so a throttled
             or restored tab never throws the springs */
          var dt = elapsed / 16.667;
          if (!(dt > 0)) { dt = 1; }
          var turn = Math.min(1, 0.055 * dt);

          /* a slow ambient rotation, plus the smoothed pointer turn */
          spin += 0.0032 * dt;
          yaw += (yawTarget - yaw) * turn;
          tilt += (tiltTarget - tilt) * turn;
          entry = Math.min(1, entry + elapsed / ENTER_MS);
          morph += (morphTarget - morph) * Math.min(1, 0.08 * dt);

          if (pulseT >= 0) {
            pulseAge = (now - pulseT) / 620;
            if (pulseAge >= 1) { pulseAge = 1; pulseT = -1; }
          } else {
            pulseAge = 1;
          }
          render(dt, true);
        }

        var orbContextLost = false;
        function canRun() {
          return !disposed && !suspended && !orbContextLost && !userPaused && !reduced() && visible;
        }

        function start() {
          if (frameId || !canRun() || !window.requestAnimationFrame) { return; }
          lastStamp = 0;
          frameId = window.requestAnimationFrame(step);
        }

        function stop() {
          if (frameId) {
            window.cancelAnimationFrame(frameId);
            frameId = 0;
          }
        }

        function syncButton() {
          if (reduced()) {
            pauseButton.disabled = true;
            setPauseLabel(copy.reduced);
            pauseButton.setAttribute('aria-pressed', 'true');
            pauseButton.setAttribute('aria-label', copy.reducedScene);
            return;
          }
          pauseButton.disabled = false;
          setPauseLabel(userPaused ? copy.resume : copy.pause);
          pauseButton.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
          pauseButton.setAttribute('aria-label', userPaused ? copy.scenePaused : copy.sceneRunning);
        }

        /* the scroll bridge: as the hero leaves the viewport the points begin
           to settle toward a lattice, and the blend reverses when the reader
           scrolls back. The mapping is partial on purpose, so the sphere stays
           the subject on the way down to the work section. */
        var heroSection = document.getElementById('inicio');

        function updateMorph() {
          if (disposed || suspended) { return; }
          if (reduced() || !heroSection) { morphTarget = 0; return; }
          /* the same hero-exit ramp the WebGL scene uses, so the two engines
             morph together and both reverse on scroll up */
          var t = heroExitProgress(heroSection);
          morphTarget = GRID_MAX * (t * t * (3 - 2 * t));
        }

        function applyMotionPreference() {
          if (disposed || suspended) { return; }
          /* reduced motion only holds the loop still; a preference change is
             never allowed to overwrite the user's explicit pause */
          stop();
          if (reduced()) {
            entry = 1;
            morph = 0;
            morphTarget = 0;
            pointerOn = false;
            pulseT = -1;
            pulseAge = 1;
          }
          syncButton();
          render(1, !reduced());
          start();
        }

        listen(pauseButton, 'click', function () {
          userPaused = !userPaused;
          if (userPaused) { stop(); } else { start(); }
          syncButton();
          /* pausing always lands on one fully organised frame */
          render(1, false);
          /* D4: the owner has refreshed aria-pressed, so the shared switch can
             now compute the real state instead of the stale one */
          applyMotionState();
        });

        function pointerPoint(event) {
          var rect = canvas.getBoundingClientRect();
          return { x: event.clientX - rect.left, y: event.clientY - rect.top, w: rect.width, h: rect.height };
        }

        /* The local figure target is the sole input owner. The decorative
           pointer-events:none canvas receives no duplicate event consumers. */
        orbPointerBridge = function (event, kind) {
          if (disposed) { return; }
          if (kind === 'leave') {
            pointerOn = false;
            yawTarget = 0;
            tiltTarget = -0.18;
          } else {
            if (suspended || orbContextLost || !visible) { return; }
            var local = pointerPoint(event);
            if (!local.w || !local.h) { return; }
            pointerX = local.x;
            pointerY = local.y;
            pointerOn = true;
            yawTarget = (local.x / local.w - 0.5) * 0.6;
            tiltTarget = -0.18 + (local.y / local.h - 0.5) * 0.45;
            if (kind === 'pulse' && canRun()) {
              pulseX = local.x;
              pulseY = local.y;
              pulseT = window.performance && window.performance.now ? window.performance.now() : Date.now();
              pulseAge = 0;
            }
          }
          /* Frozen animation still accepts explicit manipulation. Never start
             RAF or advance spin/entry/morph to answer a pointer event. */
          if (suspended || orbContextLost || !visible || document.hidden) { return; }
          if (frameId) { return; } /* the live frame owns assembly and springs */
          yaw = yawTarget;
          tilt = tiltTarget;
          render(1, false);
        };

        listen(document, 'visibilitychange', function () {
          visible = !document.hidden;
          if (visible) { start(); } else { stop(); }
        });

        /* the same suspension the smoke uses: a persisted page keeps the
           loop for the back/forward cache, a fresh load tears it down */
        listen(window, 'pagehide', function (event) {
          stop();
          /* BFCache retains listeners, but no queued callback may restart or
             draw until pageshow explicitly releases the suspension. */
          if (event && event.persisted) { suspended = true; return; }
          dispose();
        });
        listen(window, 'pageshow', function (event) {
          if (event && event.persisted) {
            suspended = false;
            visible = !document.hidden;
            resize();
            updateMorph();
            applyMotionPreference();
          }
        });

        if (motionQuery) {
          if (motionQuery.addEventListener) { listen(motionQuery, 'change', applyMotionPreference); }
          else if (motionQuery.addListener) {
            motionQuery.addListener(applyMotionPreference);
            removers.push(function () { motionQuery.removeListener(applyMotionPreference); });
          }
        }

        listen(window, 'resize', function () {
          resize();
          updateMorph();
          render(1, !!frameId);
        });
        listen(window, 'scroll', updateMorph, { passive: true });

        orbInteractionRedraw = function () {
          if (!disposed && !suspended && visible && !orbContextLost && !frameId) { render(1, false); }
        };
        orbContextChange = function (lost) {
          if (disposed) { return; }
          orbContextLost = lost;
          stop();
          if (!lost) { resize(); render(1, false); start(); }
        };
        resize();
        updateMorph();
        applyMotionPreference();
      }

      function startOrb2D() {
        if (!(canvas && canvas.getContext && pauseButton)) { return; }
        var orbCtx = null;
        try {
          orbCtx = canvas.getContext('2d');
        } catch {
          orbCtx = null;
        }
        if (orbCtx) {
          try {
            setupOrb(orbCtx);
          } catch {
            orbCtx = null;
          }
        }
        objectInteractions.setHeroAvailable(!!orbCtx);
        if (!orbCtx) {
          /* a failed sphere must never abort the menu or shared-motion
             setup that follows, and the smoke keeps the shared Pause control */
          canvas.hidden = true;
          if (smokeActive) {
            smokeControlOwner = true;
            if (smokeSyncControl) { smokeSyncControl(); }
          } else {
            pauseButton.disabled = true;
            setPauseLabel(copy.unavailable);
            pauseButton.setAttribute('aria-label', copy.unavailableLabel);
          }
        }
      }
      /* ── Mobile menu ─────────────────────────────────────────────── */
      var topnav = document.querySelector('.topnav');
      var navToggle = document.getElementById('nav-toggle');
      var primaryNav = document.getElementById('nav-principal');
      var navBackdrop = document.getElementById('nav-backdrop');

      /* the off-canvas panel only exists below 861px; on desktop the same nav
         is the ordinary visible one and is never made inactive */
      function isMobileNav() {
        return (window.innerWidth || 1024) <= 860;
      }

      function setPanelInactive(inactive) {
        if (!primaryNav) { return; }
        if (inactive && isMobileNav()) {
          primaryNav.setAttribute('inert', '');
          primaryNav.setAttribute('aria-hidden', 'true');
        } else {
          primaryNav.removeAttribute('inert');
          primaryNav.setAttribute('aria-hidden', 'false');
        }
      }

      function navIsOpen() {
        return !!(topnav && topnav.classList.contains('is-open'));
      }

      function closeNav(returnFocus) {
        if (!topnav || !navToggle) { return; }
        topnav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', copy.openMenu);
        if (navBackdrop) { navBackdrop.classList.remove('is-open'); }
        setPanelInactive(true);
        if (returnFocus) { navToggle.focus(); }
      }

      function openNav() {
        if (!topnav || !navToggle) { return; }
        topnav.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', copy.closeMenu);
        if (navBackdrop) { navBackdrop.classList.add('is-open'); }
        setPanelInactive(false);
        var firstLink = primaryNav ? primaryNav.querySelector('a') : null;
        if (firstLink) { firstLink.focus(); }
      }

      /* the open panel keeps the keyboard inside itself; Escape and a backdrop
         tap close it and hand focus back to the toggle */
      function trapNavFocus(event) {
        if (event.key !== 'Tab' || !navIsOpen() || !primaryNav) { return; }
        var focusables = primaryNav.querySelectorAll('a[href]');
        if (!focusables.length) { return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }

      if (topnav && navToggle) {
        navToggle.addEventListener('click', function () {
          if (navIsOpen()) { closeNav(true); } else { openNav(); }
        });
        if (navBackdrop) {
          navBackdrop.addEventListener('click', function () { closeNav(true); });
        }
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && navIsOpen()) { closeNav(true); return; }
          trapNavFocus(event);
        });
        if (primaryNav) {
          primaryNav.addEventListener('click', function (event) {
            if (event.target && event.target.closest && event.target.closest('a')) { closeNav(false); }
          });
        }
        document.addEventListener('click', function (event) {
          if (!navIsOpen()) { return; }
          var target = event.target;
          var inTopnav = target && target.closest && target.closest('.topnav');
          var onLink = target && target.closest && target.closest('a');
          /* a header link (the Contact action, the brand) navigates, so it must
             close the panel just like an outside click */
          if (inTopnav && !onLink) { return; }
          closeNav(false);
        });
        window.addEventListener('resize', function () {
          if (!isMobileNav() && navIsOpen()) { closeNav(false); }
          setPanelInactive(!navIsOpen());
        });
        setPanelInactive(true);
      }

      /* ── Active navigation (scroll-spy) ──────────────────────────── */
      /* The nav marks the section the reader is currently inside. The state
         travels in aria-current, so the marker is never colour-only, the
         links keep their ordinary anchors, and no scrolling is hijacked. */
      var navLinks = Array.prototype.slice.call(document.querySelectorAll('#nav-principal a[href^="#"]'));
      var navSections = [];
      navLinks.forEach(function (link) {
        var id = link.getAttribute('href');
        var target = id && id.length > 1 ? document.getElementById(id.slice(1)) : null;
        if (target) { navSections.push({ link: link, target: target }); }
      });

      var navActiveIndex = -1;
      var contactButton = document.querySelector('.btn-contact');

      /* the one lavender marker travels under the active item. Its position is
         written as two custom properties, so the CSS transition relocates it
         smoothly and a reduced-motion reader sees it jump instead. An item that
         is not rendered (the Contact link on desktop) leaves no marker. */
      function moveNavIndicator(index) {
        var navEl = document.getElementById('nav-principal');
        if (!navEl) { return; }
        var link = index >= 0 && navSections[index] ? navSections[index].link : null;
        if (!link) { navEl.classList.remove('has-ind'); return; }
        var linkRect = link.getBoundingClientRect();
        if (!linkRect.width) { navEl.classList.remove('has-ind'); return; }
        var navRect = navEl.getBoundingClientRect();
        navEl.style.setProperty('--ind-x', (linkRect.left - navRect.left) + 'px');
        navEl.style.setProperty('--ind-w', linkRect.width + 'px');
        navEl.classList.add('has-ind');
      }

      function setActiveNav(index) {
        navActiveIndex = index;
        navSections.forEach(function (entry, position) {
          if (position === index) { entry.link.setAttribute('aria-current', 'true'); }
          else { entry.link.removeAttribute('aria-current'); }
        });
        /* the Contact nav item lives in the mobile panel only, so on desktop
           the outlined action carries the active state instead of a missing
           indicator */
        var contactActive = false;
        navSections.forEach(function (entry, position) {
          if (position === index && entry.link.classList.contains('nav-contact-link')) { contactActive = true; }
        });
        if (contactButton) {
          if (contactActive) { contactButton.setAttribute('aria-current', 'true'); }
          else { contactButton.removeAttribute('aria-current'); }
        }
        moveNavIndicator(index);
      }

      window.addEventListener('resize', function () {
        if (navActiveIndex >= 0) { moveNavIndicator(navActiveIndex); }
      });

      if (navSections.length && 'IntersectionObserver' in window) {
        var navRatios = [];
        var navObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            navSections.forEach(function (section, position) {
              if (section.target === entry.target) { navRatios[position] = entry.intersectionRatio; }
            });
          });
          /* the most visible section owns the marker, so two sections in view
             at once never fight over it */
          var best = -1;
          navSections.forEach(function (_section, position) {
            var ratio = navRatios[position] || 0;
            if (ratio > 0 && (best < 0 || ratio > (navRatios[best] || 0))) { best = position; }
          });
          if (best >= 0) { setActiveNav(best); }
        }, { rootMargin: '-76px 0px -46% 0px', threshold: [0, 0.2, 0.45, 0.7, 1] });
        navSections.forEach(function (section) { navObserver.observe(section.target); });
      } else if (navSections.length) {
        /* no observer: the first item stays marked instead of no marker at all */
        setActiveNav(0);
      }

      /* ── Shared motion control ───────────────────────────────────── */
      /* One preference gates the ambient and reveal animation on the page:
         the coordinated entrance, the differentiated scroll reveals, the
         filter transition and both canvases. It mirrors
         prefers-reduced-motion and follows the existing Pause control. It
         does not gate hover or focus styling, which is CSS-only and stays
         active regardless. It never hides content: reveals stay visible
         unless motion is on, and pausing force-reveals anything pending. */
      var motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      var motionControl = document.getElementById('orb-pausa');
      var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
      var revealObserver = null;

      revealItems.forEach(function (item) {
        var delay = item.getAttribute('data-reveal-delay');
        if (delay) { item.style.setProperty('--reveal-delay', delay + 'ms'); }
      });

      function revealItem(item) {
        item.classList.add('is-revealed');
        if (revealObserver) { revealObserver.unobserve(item); }
      }

      function revealAll() {
        revealItems.forEach(revealItem);
      }

      function startReveals() {
        if (!revealItems.length) { return; }
        if (!('IntersectionObserver' in window)) { revealAll(); return; }
        if (!revealObserver) {
          revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) { revealItem(entry.target); }
            });
          }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        }
        revealItems.forEach(function (item) {
          if (item.classList.contains('is-revealed')) { return; }
          item.classList.add('js-reveal');
          revealObserver.observe(item);
        });
      }

      /* a focused control must never sit inside a still-hidden reveal, so
         keyboard navigation reveals its container immediately */
      document.addEventListener('focusin', function (event) {
        var node = event.target;
        while (node && node !== document) {
          if (node.hasAttribute && node.hasAttribute('data-reveal')) { revealItem(node); break; }
          node = node.parentNode;
        }
      });

      function motionAllowed() {
        if (motionPreference && motionPreference.matches) { return false; }
        if (motionControl && motionControl.disabled) { return false; }
        if (motionControl && motionControl.getAttribute('aria-pressed') === 'true') { return false; }
        return true;
      }

      var motionHooks = [];
      function onMotionChange(handler) {
        if (typeof handler === 'function') { motionHooks.push(handler); }
      }
      function notifyMotion(allowed) {
        for (var h = 0; h < motionHooks.length; h += 1) {
          /* one layer must never break another */
          try { motionHooks[h](allowed); } catch { /* isolated */ }
        }
      }

      function applyMotionState() {
        var root = document.documentElement;
        if (motionAllowed()) {
          root.classList.remove('motion-off');
          root.classList.add('motion-on');
          startReveals();
        } else {
          root.classList.remove('motion-on');
          root.classList.add('motion-off');
          revealAll();
        }
        /* the shared scene and the GSAP layer follow the same switch, live */
        notifyMotion(motionAllowed());
      }

      if (motionControl) {
        motionControl.addEventListener('click', function () {
          /* the canvas handlers run first and refresh aria-pressed */
          applyMotionState();
        });
      }
      if (motionPreference) {
        if (motionPreference.addEventListener) { motionPreference.addEventListener('change', applyMotionState); }
        else if (motionPreference.addListener) { motionPreference.addListener(applyMotionState); }
      }
      applyMotionState();

      /* ═══ T21: shared Three.js scene, GSAP choreography, progressive loader ═══
         Pinned npm libraries load asynchronously as local bundled chunks, only
         for the decorative layer: navigation, filters, dialog and copy are
         already live. Each library is guarded independently — missing GSAP
         never prevents Three from running, and missing Three never prevents
         CSS navigation, reveals and filters. If Three cannot start in time,
         the original Canvas2D smoke and sphere remain the exclusive engine. */

      var heroSectionEl = document.getElementById('inicio');
      var heroAnchorEl = document.getElementById('hero-orb-anchor');
      var contactAnchorEl = document.getElementById('contact-orb-anchor');
      var sceneCanvasEl = document.getElementById('scene-canvas');
      var figureCanvasEl = document.getElementById('figure-canvas');
      var sharedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      var scrollMorphProgress = -1;   /* >= 0 once ScrollTrigger owns the morph */
      var webglHandle = null;
      var engineDecided = false;
      var canvas2DStarted = false;
      var libraryTimeout = 0;
      var orbInteractionRedraw = null;
      var orbContextChange = null;
      var orbPointerBridge = null;
      var sceneLifetimeEnded = false;

      /* Capability identity is shared by input, geometry, state and placement. */
      var capabilities = [
        { key: 'interfaz', anchorId: 'cap-anchor-interfaces', phase: 0 },
        { key: 'servidor', anchorId: 'cap-anchor-servers', phase: 2.1 },
        { key: 'datos', anchorId: 'cap-anchor-data', phase: 4.2 },
        /* Near-frontal at clock zero; shared phase keeps shader and hit bounds aligned. */
        { key: 'cloud', anchorId: 'cap-anchor-cloud', phase: -0.9 }
      ];

      /* Nine explicit objects, one small local input owner. No canvas receives
         input and no anchor/form event is cancelled. The renderer reads these
         bounded angles directly; stand-in SVGs use the same state as CSS. */
      var objectInteractions = createObjectInteractions();
      function createObjectInteractions() {
        var objects = {};
        var removers = [];
        var redraw = null;
        var disposed = false;
        var suspended = false;
        var engineAvailable = true;
        var pointerBridge = null;
        var anchors = {
          hero: heroAnchorEl,
          contact: contactAnchorEl
        };
        capabilities.forEach(function (capability) {
          anchors[capability.key] = document.getElementById(capability.anchorId);
        });
        var planes = document.querySelectorAll('.blog-scene__plane');
        for (var b = 0; b < planes.length; b += 1) { anchors['book-' + b] = planes[b]; }

        function listen(target, type, handler, options) {
          if (!target) { return; }
          function guarded(event) { if (!disposed) { handler(event); } }
          target.addEventListener(type, guarded, options);
          removers.push(function () { target.removeEventListener(type, guarded, options); });
        }
        function available(object) {
          return object.ready && engineAvailable && !disposed && !suspended && !document.hidden &&
            (object.key !== 'contact' || window.innerWidth > 1100);
        }
        function notify(object) {
          var active = object.hover || object.focus;
          var anchor = anchors[object.key];
          if (anchor) {
            /* Focus feedback adds a small, defined orientation, not animation. */
            anchor.style.setProperty('--object-yaw', ((object.yaw + (active ? 0.18 : 0)) * 180 / Math.PI) + 'deg');
            anchor.style.setProperty('--object-pitch', ((object.pitch + (active ? -0.12 : 0)) * 180 / Math.PI) + 'deg');
            anchor.dataset.objectActive = String(active);
          }
          object.host.dataset.objectActive = String(active);
          if (!disposed && !suspended && !document.hidden) {
            if (redraw) { redraw(); }
            else if (object.key === 'hero' && orbInteractionRedraw) { orbInteractionRedraw(); }
          }
        }
        function turn(object, yaw, pitch) {
          var yawLimit = object.key === 'contact' ? 0.55 : 1.2;
          var pitchLimit = object.key === 'contact' ? 0.4 : 0.9;
          object.yaw = Math.max(-yawLimit, Math.min(yawLimit, yaw));
          object.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));
          notify(object);
        }
        function release(object) {
          var pointer = object.pointer;
          object.pointer = null;
          object.host.dataset.dragging = 'false';
          if (pointer && object.host.hasPointerCapture && object.host.hasPointerCapture(pointer.id)) {
            try { object.host.releasePointerCapture(pointer.id); } catch { /* already released */ }
          }
        }
        function cancelAll() {
          Object.keys(objects).forEach(function (key) {
            var object = objects[key];
            release(object);
            object.hover = false;
            object.focus = false;
            if (key === 'hero') { heroPointer(null, 'leave'); }
            notify(object);
          });
        }
        function heroPointer(event, kind) {
          var bridge = pointerBridge || orbPointerBridge;
          if (bridge && !disposed) { bridge(event, kind); }
        }
        function syncAvailability(object) {
          var enabled = available(object);
          object.host.hidden = !enabled;
          object.host.tabIndex = enabled ? 0 : -1;
          if (!enabled) {
            release(object);
            object.hover = object.focus = false;
          }
        }
        /* Bounds are local to the measured artwork, never a viewport input
           layer. Changing SVG orientation cannot move a placement anchor. */
        function setBounds(key, left, top, width, height) {
          var object = objects[key];
          if (!object || disposed) { return; }
          var rect = anchors[key].getBoundingClientRect();
          var x = Math.max(rect.left, left);
          var y = Math.max(rect.top, top);
          var right = Math.min(rect.right, left + width);
          var bottom = Math.min(rect.bottom, top + height);
          object.host.style.left = (x - rect.left) + 'px';
          object.host.style.top = (y - rect.top) + 'px';
          object.host.style.width = Math.max(0, right - x) + 'px';
          object.host.style.height = Math.max(0, bottom - y) + 'px';
          syncAvailability(object);
        }
        function fallbackBounds() {
          if (redraw || disposed) { return; }
          Object.keys(objects).forEach(function (key) {
            var rect = anchors[key].getBoundingClientRect();
            var width, height;
            if (key === 'hero') {
              width = height = Math.min(rect.width, rect.height) * 0.94;
            } else if (key === 'contact') {
              width = rect.width * 0.72; height = rect.height * 0.48;
            } else if (key.indexOf('book-') === 0) {
              width = rect.width * 0.85; height = rect.height * 0.86;
            } else {
              /* Inline SVGs use x=22..96 and y=15..87 in a 120x92 viewBox. */
              var scale = Math.min(rect.width / 120, rect.height / 92);
              width = 78 * scale; height = 76 * scale;
            }
            setBounds(key, rect.left + (rect.width - width) / 2,
              rect.top + (rect.height - height) / 2, width, height);
          });
        }
        var hosts = document.querySelectorAll('[data-object-target]');
        Array.prototype.forEach.call(hosts, function (host) {
          var key = host.dataset.objectTarget;
          var object = objects[key] = {
            key: key, host: host, yaw: 0, pitch: 0,
            hover: false, focus: false, pointer: null, ready: key !== 'hero'
          };
          syncAvailability(object);
          notify(object);
          listen(host, 'pointerdown', function (event) {
            if (event.pointerType === 'touch' && !event.isPrimary) {
              release(object); /* the browser owns multi-finger pinch zoom */
              if (key === 'hero') { heroPointer(null, 'leave'); }
              return;
            }
            if (!available(object) || object.pointer || !event.isPrimary || event.button !== 0) { return; }
            object.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY,
              yaw: object.yaw, pitch: object.pitch, moved: false, touch: event.pointerType === 'touch' };
            if (key === 'hero') { heroPointer(event, 'pulse'); }
            /* Touch capture waits for horizontal intent; native vertical pan
               and a second finger's pinch are never captured or cancelled. */
            if (!object.pointer.touch) {
              try { host.setPointerCapture(event.pointerId); }
              catch { release(object); }
            }
          });
          listen(host, 'pointermove', function (event) {
            if (!available(object) || event.isPrimary === false) { return; }
            if (key === 'hero') { heroPointer(event, 'move'); }
            var pointer = object.pointer;
            if (!pointer || pointer.id !== event.pointerId) { return; }
            var dx = event.clientX - pointer.x;
            var dy = event.clientY - pointer.y;
            if (!pointer.moved) {
              if (pointer.touch && Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) { release(object); return; }
              var intent = pointer.touch ? Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.25
                : Math.abs(dx) > 5 || Math.abs(dy) > 5;
              if (!intent) { return; }
              if (pointer.touch) {
                try { host.setPointerCapture(event.pointerId); }
                catch { release(object); return; }
              }
              pointer.moved = true;
              host.dataset.dragging = 'true';
            }
            turn(object, pointer.yaw + dx * 0.009, pointer.pitch + (pointer.touch ? 0 : dy * 0.009));
          }, { passive: true });
          listen(host, 'pointerup', function (event) {
            if (!object.pointer || object.pointer.id !== event.pointerId) { return; }
            release(object);
            if (event.pointerType === 'touch') {
              object.hover = false;
              if (key === 'hero') { heroPointer(null, 'leave'); }
              notify(object);
            }
          });
          function cancelPointer(event) {
            if (object.pointer && object.pointer.id === event.pointerId) {
              release(object);
              object.hover = false;
              if (key === 'hero') { heroPointer(null, 'leave'); }
              notify(object);
            }
          }
          listen(host, 'pointercancel', cancelPointer);
          listen(host, 'lostpointercapture', cancelPointer);
          listen(host, 'keydown', function (event) {
            if (!available(object) || document.activeElement !== host || event.altKey || event.ctrlKey || event.metaKey) { return; }
            var key = event.key;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape'].indexOf(key) === -1) { return; }
            event.preventDefault(); /* only the focused figure's six keys */
            release(object);
            if (key === 'Home' || key === 'Escape') {
              if (object.key === 'hero') { heroPointer(null, 'leave'); }
              turn(object, 0, 0); return;
            }
            turn(object, object.yaw + (key === 'ArrowLeft' ? -0.18 : key === 'ArrowRight' ? 0.18 : 0),
              object.pitch + (key === 'ArrowUp' ? -0.18 : key === 'ArrowDown' ? 0.18 : 0));
          });
          listen(host, 'pointerenter', function (event) {
            if (!available(object) || event.pointerType === 'touch') { return; }
            object.hover = true;
            if (key === 'hero') { heroPointer(event, 'move'); }
            notify(object);
          });
          listen(host, 'pointerleave', function () {
            object.hover = false;
            if (object.pointer && !object.pointer.moved) { release(object); }
            if (key === 'hero') { heroPointer(null, 'leave'); }
            notify(object);
          });
          listen(host, 'focus', function () { if (available(object)) { object.focus = true; notify(object); } });
          listen(host, 'blur', function () { object.focus = false; release(object); notify(object); });
        });
        listen(canvas, 'contextlost', function (event) {
          event.preventDefault(); /* local Canvas2D restoration, never document input */
          if (orbContextChange) { orbContextChange(true); }
          cancelAll();
          setHeroReady(false);
        });
        listen(canvas, 'contextrestored', function () {
          if (orbContextChange) { orbContextChange(false); setHeroReady(true); }
        });
        listen(document, 'visibilitychange', function () {
          if (document.hidden) { cancelAll(); }
          Object.keys(objects).forEach(function (key) { syncAvailability(objects[key]); });
        });
        listen(window, 'resize', function () {
          Object.keys(objects).forEach(function (key) { syncAvailability(objects[key]); });
          fallbackBounds();
        });
        listen(window, 'pagehide', function (event) {
          cancelAll();
          suspended = true;
          if (event.persisted) { return; }
          disposed = true;
          sceneLifetimeEnded = true;
          if (libraryTimeout) { window.clearTimeout(libraryTimeout); libraryTimeout = 0; }
          redraw = pointerBridge = null;
          orbPointerBridge = null;
          removers.forEach(function (remove) { remove(); });
          removers.length = 0;
        });
        listen(window, 'pageshow', function (event) {
          if (!event.persisted) { return; }
          suspended = false;
          Object.keys(objects).forEach(function (key) { syncAvailability(objects[key]); });
          fallbackBounds();
        });
        fallbackBounds();
        function setHeroReady(ready) {
          var hero = objects.hero;
          if (!hero || disposed) { return; }
          hero.ready = ready;
          syncAvailability(hero);
          if (!ready) { release(hero); }
          notify(hero);
        }
        return {
          objects: objects,
          cancel: cancelAll,
          setRedraw: function (callback) { if (!disposed) { redraw = callback; fallbackBounds(); } },
          setPointerBridge: function (callback) { if (!disposed) { pointerBridge = callback; } },
          setBounds: setBounds,
          setEngineAvailable: function (ready) {
            if (disposed) { return; }
            engineAvailable = ready;
            if (!ready) { cancelAll(); }
            Object.keys(objects).forEach(function (key) { syncAvailability(objects[key]); });
          },
          setHeroAvailable: setHeroReady
        };
      }

      function sharedMotionOff() {
        if (sharedMotionQuery && sharedMotionQuery.matches) { return true; }
        return document.documentElement.classList.contains('motion-off');
      }

      /* a token is resolved through a 1x1 canvas, exactly like the smoke probe:
         the oklch values in :root are never translated to a raw colour here */
      function resolveTokenRGB(name, fallback) {
        try {
          var probe = document.createElement('canvas');
          probe.width = 1;
          probe.height = 1;
          var probeCtx = probe.getContext('2d');
          if (!probeCtx) { return fallback; }
          var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
          if (!value) { return fallback; }
          probeCtx.clearRect(0, 0, 1, 1);
          probeCtx.fillStyle = 'rgb(0,0,0)';
          probeCtx.fillStyle = value;
          probeCtx.fillRect(0, 0, 1, 1);
          var px = probeCtx.getImageData(0, 0, 1, 1).data;
          if (px[3] === 0) { return fallback; }
          /* D5: a canvas that cannot parse the oklch() token keeps the black
             sentinel it was primed with. --fg, --muted and --accent are all
             intentionally non-black, so an all-black result is a failed probe
             and must return the caller's fallback instead of black. */
          if (px[0] === 0 && px[1] === 0 && px[2] === 0) { return fallback; }
          return [px[0] / 255, px[1] / 255, px[2] / 255];
        } catch {
          return fallback;
        }
      }

      function canUseWebGL() {
        if (!sceneCanvasEl) { return false; }
        try {
          var probe = document.createElement('canvas');
          return !!(window.WebGLRenderingContext &&
            (probe.getContext('webgl') || probe.getContext('experimental-webgl')));
        } catch {
          return false;
        }
      }

      /* ── header shrink, owned by the page and refined by GSAP ──
         D1: one scroll listener is registered here, unconditionally, and it
         only toggles the page state. Without GSAP or ScrollTrigger the
         `.is-condensed` class plus the CSS transition animate the 80→64 change;
         when GSAP is ready its hook replaces the class with a tweened inline
         state. The listener is never registered a second time. */
      var condensedState = null;
      var condensedHooks = [];
      var topnavEl = document.querySelector('.topnav');
      var topnavInnerEl = document.querySelector('.topnav-inner');

      function onCondensed(handler) {
        if (typeof handler === 'function') { condensedHooks.push(handler); }
      }

      function notifyCondensed(on) {
        for (var ch = 0; ch < condensedHooks.length; ch += 1) {
          /* one layer must never break another */
          try { condensedHooks[ch](on); } catch { /* isolated */ }
        }
      }

      function setCondensed(on) {
        if (condensedState === on) { return; }
        condensedState = on;
        /* the class is the CSS fallback only: once GSAP owns the geometry the
           class is dropped and the hook tweens the inline state instead */
        if (topnavEl && !document.documentElement.classList.contains('gsap-ready')) {
          topnavEl.classList.toggle('is-condensed', on);
        }
        notifyCondensed(on);
      }

      function readScrollY() {
        return window.pageYOffset || document.documentElement.scrollTop || 0;
      }

      window.addEventListener('scroll', function () {
        setCondensed(readScrollY() > 8);
      }, { passive: true });
      setCondensed(readScrollY() > 8);

      /* ── GLSL. Written for the classic WebGL1 pipeline that Three r160 still
         accepts on a WebGL2 context: attribute/varying/gl_FragColor, and every
         smoothstep edge ordered low→high so no implementation meets the
         undefined reversed-edge case. ── */
      var SMOKE_VERTEX = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\n');

      var SMOKE_FRAGMENT = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'uniform vec2 uResolution;',
        'uniform vec2 uSphere;',
        'uniform float uSphereRadius;',
        'uniform float uIntensity;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'float hash21(vec2 p) {',
        '  p = fract(p * vec2(123.34, 456.21));',
        '  p += dot(p, p + 45.32);',
        '  return fract(p.x * p.y);',
        '}',
        'float vnoise(vec2 p) {',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  float a = hash21(i);',
        '  float b = hash21(i + vec2(1.0, 0.0));',
        '  float c = hash21(i + vec2(0.0, 1.0));',
        '  float d = hash21(i + vec2(1.0, 1.0));',
        '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
        '}',
        'float fbm(vec2 p) {',
        '  float v = 0.0;',
        '  float amp = 0.5;',
        '  float norm = 0.0;',
        '  for (int i = 0; i < 4; i++) {',
        '    v += amp * vnoise(p);',
        '    norm += amp;',
        '    p *= 2.07;',
        '    amp *= 0.5;',
        '  }',
        '  return v / norm;',
        '}',
        'float current(vec2 p, float ang, float run, float crossv, float t, float off) {',
        '  float c = cos(ang);',
        '  float s = sin(ang);',
        '  vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c);',
        '  q = vec2(q.x / run, q.y * crossv);',
        '  vec2 warp = vec2(',
        '    fbm(q * 0.9 + vec2(off, t * 0.021)),',
        '    fbm(q * 0.9 + vec2(t * 0.016, off + 7.0))',
        '  );',
        '  float env = fbm(q + warp * 1.35 + vec2(off * 0.5, -t * 0.018));',
        '  float fold = fbm(q * 2.15 + warp * 1.15 + vec2(off + 3.0, t * 0.02));',
        '  float fine = fbm(q * 4.4 + vec2(-t * 0.03, off + 9.0));',
        '  float gate = smoothstep(0.46, 0.86, env);',
        '  float rEnv = 1.0 - abs(env * 2.0 - 1.0);',
        '  float rFold = 1.0 - abs(fold * 2.0 - 1.0);',
        '  float rFine = 1.0 - abs(fine * 2.0 - 1.0);',
        '  float base = smoothstep(0.48, 0.9, rFold) * (0.08 + 0.12 * rFine);',
        '  float filament = gate * pow(rFold, 2.2) * (0.32 + 0.46 * rEnv);',
        '  return max(base, filament);',
        '}',
        'void main() {',
        '  float aspect = uResolution.x / max(uResolution.y, 1.0);',
        '  vec2 p = vec2(vUv.x * aspect, vUv.y) * 3.1;',
        '  float a = current(p, -0.62, 2.1, 0.64, uTime, 0.0);',
        '  float b = current(p, 0.58, 1.7, 0.72, uTime, 11.0);',
        /* Bounded presence lift: multiply existing folds, never fill their
           zero-density gaps or replace the approved noise/warp/drift field. */
        '  float dens = clamp(max(a, b) * 1.18, 0.0, 1.0);',
        '  float radius = max(uSphereRadius, 0.02);',
        '  vec2 d = vec2((vUv.x - uSphere.x) * aspect, vUv.y - uSphere.y);',
        /* T25: the local mask is inverted. The sphere zone is quieter, not
           brighter, and the right-side cloud weight is removed, so the
           silhouette sits on a calm field while the texture grain survives
           (the quiet floor is not zero). T25 adds a gentle per-axis margin
           falloff on both axes as well, so the field no longer leaves isolated
           bright blobs at the viewport edges while a trace of texture still
           reaches the corners. Every smoothstep edge stays ordered low to
           high. */
        '  float nearSphere = 1.0 - smoothstep(radius * 0.45, radius * 1.8, length(d));',
        '  float quiet = mix(1.0, 0.26, nearSphere);',
        '  float edgeX = smoothstep(0.0, 0.06, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));',
        '  float edgeY = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.95, 1.0, vUv.y));',
        '  float mask = quiet * (0.88 + 0.12 * edgeX * edgeY);',
        /* Match the reading scrim inside smoke only, not over the figures.
           Ordered ramps preserve the calmer headline and footer zones. */
        '  float leftShade = 0.20 * (1.0 - smoothstep(0.0, 0.72, vUv.x));',
        '  float bottomShade = 0.13 * (1.0 - smoothstep(0.0, 0.2, vUv.y));',
        '  float readability = (1.0 - leftShade) * (1.0 - bottomShade);',
        '  float alpha = dens * mask * readability * uIntensity;',
        '  vec3 col = mix(uColorA, uColorB, pow(dens, 0.9));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n');

      var POINT_VERTEX = [
        'attribute float aSeed;',
        'attribute float aBright;',
        'attribute float aAccent;',
        'attribute vec2 aGrid;',
        'uniform float uTime;',
        'uniform float uAssembly;',
        'uniform float uMorph;',
        'uniform vec2 uCenter;',
        'uniform float uRadius;',
        'uniform float uAspect;',
        'uniform float uSizeScale;',
        'uniform vec2 uPointer;',
        'uniform float uRepel;',
        'uniform float uPulse;',
        'uniform vec2 uPulseCenter;',
        'uniform float uOpacity;',
        /* uRing selects the contact envelope without changing the hero sphere. */
        'uniform float uRing;',
        'uniform vec2 uTurn;',
        'uniform float uFeedback;',
        'varying float vAlpha;',
        'varying float vAccent;',
        'void main() {',
        '  float spin = uTime * 0.09 + uTurn.x + uFeedback * 0.18;',
        '  float tilt = 0.32 + sin(uTime * 0.11) * 0.16 + uTurn.y - uFeedback * 0.12;',
        /* Contact-only bounded yaw avoids an edge-on envelope at any clock.
           Keep projectedContactBounds in sync with this branch. */
        '  if (uRing > 0.5) {',
        '    spin = sin(uTime * 0.09) * 0.16 + uTurn.x + uFeedback * 0.18;',
        '    tilt = sin(uTime * 0.11) * 0.08 + uTurn.y - uFeedback * 0.12;',
        '  }',
        '  float cs = cos(spin);',
        '  float ss = sin(spin);',
        '  float ct = cos(tilt);',
        '  float st = sin(tilt);',
        '  vec3 p = position;',
        '  vec3 r1 = vec3(p.x * cs - p.z * ss, p.y, p.x * ss + p.z * cs);',
        '  vec3 rp = vec3(r1.x, r1.y * ct - r1.z * st, r1.y * st + r1.z * ct);',
        '  float weave = sin(aGrid.y * 3.14159 + uTime * 0.25) * 0.05;',
        '  vec3 lattice = vec3(aGrid.x * 1.16 + weave, aGrid.y * 1.16, 0.0);',
        '  vec3 q = mix(rp, lattice, uMorph);',

        /* Keep the shallow envelope volume out of the hero lattice morph. */
        '  if (uRing > 0.5) { q = rp; }',
        /* T23: near-front points are both larger and brighter. The perspective
           divide now shrinks the rear (the sign is flipped from the earlier
           `1.9 / (1.9 + z)`), which matches the `depth` ramp below instead of
           contradicting it. The entry scatter is radial — a small outward push
           from the sphere centre plus a tiny jitter — so the cloud still reads
           as a sphere volume from the first frame instead of a wide random
           spray. */
        '  float persp = 1.9 / (1.9 - q.z);',
        '  vec2 ndc = vec2(q.x * persp, q.y * persp);',
        '  float entry = 1.0 - uAssembly;',
        '  float ndcLen = length(ndc);',
        '  vec2 ndcDir = ndcLen > 0.0001 ? ndc / ndcLen : vec2(0.0, 1.0);',
        /* Contact enters from inside its reserved anchor, not the hero's
           outward scatter. Mirror this contraction/jitter in CPU hit bounds. */
        '  if (uRing > 0.5) {',
        '    ndc *= 1.0 - entry * 0.12;',
        '    ndc += vec2(cos(aSeed * 31.4), sin(aSeed * 27.1)) * entry * 0.015;',
        '  } else {',
        '    ndc += ndcDir * entry * 0.3;',
        '    ndc += vec2(cos(aSeed * 31.4), sin(aSeed * 27.1)) * entry * 0.05;',
        '  }',
        '  vec2 pos = uCenter + vec2(ndc.x * uRadius / uAspect, ndc.y * uRadius);',
        '  vec2 dpx = vec2((pos.x - uPointer.x) * uAspect, pos.y - uPointer.y);',
        '  float dl = length(dpx);',
        '  float infl = (1.0 - smoothstep(0.0, 0.42, dl)) * uRepel;',
        '  vec2 dir = dl > 0.0001 ? dpx / dl : vec2(0.0, 1.0);',
        '  pos += vec2(dir.x / uAspect, dir.y) * infl * 0.15;',
        '  vec2 ppx = vec2((pos.x - uPulseCenter.x) * uAspect, pos.y - uPulseCenter.y);',
        '  float pl = length(ppx);',
        '  float pin = (1.0 - smoothstep(0.0, 0.5, pl)) * uPulse;',
        '  vec2 pdir = pl > 0.0001 ? ppx / pl : vec2(0.0, 1.0);',
        '  pos += vec2(pdir.x / uAspect, pdir.y) * pin * 0.12;',
        '  gl_Position = vec4(pos, 0.0, 1.0);',
        /* D3: bounded depth. The earlier `(q.z * persp + 1.0) * 0.5` could fall
           below zero at the rear of the cloud, which the fragment clamp then
           turned into invisible points. (q.z + 1) * 0.5 stays inside 0..1 while
           keeping the varied luminance ramp and the perspective silhouette. */
        '  float depth = clamp((q.z + 1.0) * 0.5, 0.0, 1.0);',
        '  gl_PointSize = clamp((0.5 + depth * 1.7) * persp * aSeed * uSizeScale, 1.0, 7.0);',
        '  float baseline = mix(0.22 + depth * 0.78, 0.78 + depth * 0.22, uRing);',
        '  vAlpha = uOpacity * baseline * aBright * (0.6 + 0.4 * uAssembly);',
        '  vAccent = mix(aAccent, 1.0, uFeedback * 0.35);',
        '}'
      ].join('\n');

      var POINT_FRAGMENT = [
        'precision highp float;',
        'uniform vec3 uColorWhite;',
        'uniform vec3 uColorAccent;',
        'varying float vAlpha;',
        'varying float vAccent;',
        'void main() {',
        '  vec2 c = gl_PointCoord - vec2(0.5);',
        '  float r = length(c);',
        '  if (r > 0.5) { discard; }',
        '  float a = 1.0 - smoothstep(0.08, 0.5, r);',
        '  vec3 col = mix(uColorWhite, uColorAccent, vAccent);',
        '  gl_FragColor = vec4(col, a * clamp(vAlpha, 0.0, 1.0));',
        '}'
      ].join('\n');

      /* Nodes and edges share one 3D rotation and perspective projection.
         The frozen clock retains volume when paused or reduced; only placement
         changes on scroll, with no second transform or animation loop. */
      var NODE_TRANSFORM = [
        'uniform float uTime;',
        'uniform float uAssembly;',
        'uniform vec2 uCenter;',
        'uniform float uRadius;',
        'uniform float uAspect;',
        'uniform float uPhase;',
        'uniform vec2 uTurn;',
        'vec3 nodeRotation(vec3 local) {',
        '  float yaw = 0.35 + uPhase * 0.16 + sin(uTime * 0.18 + uPhase) * 0.28 + uTurn.x;',
        '  float tilt = -0.24 + sin(uTime * 0.13 + uPhase) * 0.16 + uTurn.y;',
        '  vec3 r = vec3(local.x * cos(yaw) + local.z * sin(yaw), local.y, -local.x * sin(yaw) + local.z * cos(yaw));',
        '  return vec3(r.x, r.y * cos(tilt) - r.z * sin(tilt), r.y * sin(tilt) + r.z * cos(tilt));',
        '}',
        'float nodePerspective(vec3 rotated) { return 2.4 / (2.4 - rotated.z); }',
        'vec2 nodePosition(vec3 rotated) {',
        '  vec2 ndc = rotated.xy * nodePerspective(rotated) * mix(1.25, 1.0, uAssembly);',
        '  return uCenter + vec2(ndc.x * uRadius / uAspect, ndc.y * uRadius);',
        '}'
      ].join('\n');

      var NODE_VERTEX = [
        'attribute float aSeed;',
        'attribute float aBright;',
        'uniform float uSizeScale;',
        'uniform float uPulse;',
        'uniform float uOpacity;',
        'varying float vAlpha;',
        NODE_TRANSFORM,
        'void main() {',
        '  vec3 rotated = nodeRotation(position);',
        '  float depth = clamp((rotated.z + 0.8) / 1.6, 0.0, 1.0);',
        '  gl_Position = vec4(nodePosition(rotated), 0.0, 1.0);',
        '  gl_PointSize = clamp((2.2 + depth * 2.0 + uPulse) * nodePerspective(rotated) * aSeed * uSizeScale, 3.0, 18.0);',
        '  vAlpha = uOpacity * (0.85 + 0.15 * depth) * (0.9 + 0.1 * aBright) * (0.85 + 0.15 * uAssembly);',
        '}'
      ].join('\n');

      /* Connections use the identical rotation/projection and interpolate
         depth luminance between endpoints, with a visible unpulsed baseline. */
      var NODE_LINE_VERTEX = [
        'uniform float uPulse;',
        'uniform float uOpacity;',
        'varying float vAlpha;',
        NODE_TRANSFORM,
        'void main() {',
        '  vec3 rotated = nodeRotation(position);',
        '  float depth = clamp((rotated.z + 0.8) / 1.6, 0.0, 1.0);',
        '  gl_Position = vec4(nodePosition(rotated), 0.0, 1.0);',
        '  vAlpha = uOpacity * (0.78 + 0.14 * depth + 0.08 * uPulse) * (0.85 + 0.15 * uAssembly);',
        '}'
      ].join('\n');

      var NODE_FRAGMENT = [
        'precision highp float;',
        'uniform vec3 uColorWhite;',
        'uniform vec3 uColorAccent;',
        'uniform float uPulse;',
        'varying float vAlpha;',
        'void main() {',
        '  vec2 c = gl_PointCoord - vec2(0.5);',
        '  float r = length(c);',
        '  if (r > 0.5) { discard; }',
        '  float a = 1.0 - smoothstep(0.1, 0.5, r);',
        /* the cluster sits between white and lavender and reaches the lavender
           end of that ramp when the group is hovered, focused or tapped */
        '  vec3 col = mix(uColorWhite, uColorAccent, clamp(0.45 + 0.55 * uPulse, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, a * clamp(vAlpha, 0.0, 1.0));',
        '}'
      ].join('\n');

      /* the connections cannot reuse the point fragment shader: gl_PointCoord is
         only defined for point primitives, so a line fragment that read it could
         discard every edge pixel. The edges take their colour from the same two
         colour uniforms and carry a flat alpha instead (F1). */
      var NODE_LINE_FRAGMENT = [
        'precision highp float;',
        'uniform vec3 uColorWhite;',
        'uniform vec3 uColorAccent;',
        'uniform float uPulse;',
        'varying float vAlpha;',
        'void main() {',
        '  vec3 col = mix(uColorWhite, uColorAccent, clamp(0.45 + 0.55 * uPulse, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, clamp(vAlpha, 0.0, 1.0));',
        '}'
      ].join('\n');

      /* Two transparent render targets, one scheduler. Only Capabilities and
         Contact use the root foreground target; smoke, hero and blog retain
         their original background scene and renderer settings. */
      function createSharedScene(THREE) {
        var renderer;
        var figureRenderer;
        if (!figureCanvasEl) { return null; }
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: sceneCanvasEl,
            alpha: true,
            antialias: false,
            premultipliedAlpha: false,
            powerPreference: 'high-performance'
          });
          figureRenderer = new THREE.WebGLRenderer({
            canvas: figureCanvasEl,
            alpha: true,
            antialias: false,
            premultipliedAlpha: true,
            powerPreference: 'high-performance'
          });
        } catch {
          if (renderer) { renderer.dispose(); }
          return null;
        }
        if (!renderer || !figureRenderer) { return null; }

        figureRenderer.setClearColor(0x000000, 0);
        var figureScene = new THREE.Scene();
        var haloMaterials = [];
        var haloGeometries = [];

        /* The foreground buffer is premultiplied end-to-end: shader output,
           material blending and browser compositing agree. Background settings
           remain untouched. */
        function figureFragment(fragment) {
          return fragment.replace(/gl_FragColor = vec4\(col, (.+)\);/,
            'float alpha = $1; gl_FragColor = vec4(col * alpha, alpha);');
        }

        /* Enlarged soft sprites extend beyond core geometry, not a brighter
           core-only pass. Additive blending stays on the figure target. */
        function addHalo(geometry, uniforms, vertex, fragment) {
          var haloVertex = vertex.replace('  vAlpha =',
            '  gl_PointSize = clamp(gl_PointSize * 3.4, 8.0, 48.0);\n  vAlpha =');
          var haloFragment = fragment.replace('float a = 1.0 - smoothstep(0.08, 0.5, r);',
            'float a = 0.18 * pow(1.0 - smoothstep(0.0, 0.5, r), 2.0);')
            .replace('float a = 1.0 - smoothstep(0.1, 0.5, r);',
              'float a = 0.18 * pow(1.0 - smoothstep(0.0, 0.5, r), 2.0);');
          var material = new THREE.ShaderMaterial({
            uniforms: uniforms, vertexShader: haloVertex, fragmentShader: figureFragment(haloFragment),
            transparent: true, depthTest: false, depthWrite: false,
            premultipliedAlpha: true, blending: THREE.AdditiveBlending
          });
          var halo = new THREE.Points(geometry, material);
          halo.frustumCulled = false;
          halo.renderOrder = 0;
          figureScene.add(halo);
          haloMaterials.push(material);
          return halo;
        }

        renderer.setClearColor(0x000000, 0);
        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        var white = resolveTokenRGB('--fg', [0.97, 0.97, 0.97]);
        var atmosphereLow = resolveTokenRGB('--atmosphere-low', [0.788235, 0.776471, 0.803922]);
        var atmosphereHigh = resolveTokenRGB('--atmosphere-high', [0.945098, 0.925490, 0.945098]);
        /* T25: the whole scene takes its single accent from --lavender, the
           exact value the user fixed, and the fallback is that same colour, so
           the sphere glints, the capability clusters, the page planes and the
           contact envelope share one accent and the scene still introduces no raw
           colour of its own. */
        var accent = resolveTokenRGB('--lavender', [0.769, 0.709, 0.992]);

        var smokeUniforms = {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uSphere: { value: new THREE.Vector2(0.65, 0.5) },
          uSphereRadius: { value: 0.3 },
          uIntensity: { value: 0.92 },
          uColorA: { value: new THREE.Vector3(atmosphereLow[0], atmosphereLow[1], atmosphereLow[2]) },
          uColorB: { value: new THREE.Vector3(atmosphereHigh[0], atmosphereHigh[1], atmosphereHigh[2]) }
        };
        var smokeMaterial = new THREE.ShaderMaterial({
          uniforms: smokeUniforms,
          vertexShader: SMOKE_VERTEX,
          fragmentShader: SMOKE_FRAGMENT,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          blending: THREE.NormalBlending
        });
        var smokeGeometry = new THREE.PlaneGeometry(2, 2);
        var smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smokeMesh.frustumCulled = false;
        smokeMesh.renderOrder = 0;
        scene.add(smokeMesh);

        /* point complexity and internal resolution drop together on a narrow
           viewport, so a phone never carries the desktop budget */
        var narrow = (window.innerWidth || 1024) < 760;
        var COUNT = narrow ? 420 : 900;
        var COLS = narrow ? 21 : 30;
        var positions = new Float32Array(COUNT * 3);
        var seeds = new Float32Array(COUNT);
        var brights = new Float32Array(COUNT);
        var accents = new Float32Array(COUNT);
        var grids = new Float32Array(COUNT * 2);
        var gridRows = Math.ceil(COUNT / COLS);
        for (var index = 0; index < COUNT; index += 1) {
          var latitude = 1 - (index / (COUNT - 1)) * 2;
          var ring = Math.sqrt(Math.max(0, 1 - latitude * latitude));
          var angle = index * 2.399963229728653;
          positions[index * 3] = Math.cos(angle) * ring;
          positions[index * 3 + 1] = latitude;
          positions[index * 3 + 2] = Math.sin(angle) * ring;
          var sizeRoll = ((Math.imul(index, 2246822519) >>> 0) % 1000) / 1000;
          seeds[index] = 0.5 + sizeRoll * sizeRoll * 1.6;
          var brightRoll = ((Math.imul(index, 3266489917) >>> 0) % 1000) / 1000;
          brights[index] = 0.62 + brightRoll * 0.5;
          accents[index] = (index % 17 === 0) ? 1 : 0;
          var col = index % COLS;
          var row = (index - col) / COLS;
          grids[index * 2] = COLS > 1 ? (col / (COLS - 1)) * 2 - 1 : 0;
          grids[index * 2 + 1] = gridRows > 1 ? 1 - (row / (gridRows - 1)) * 2 : 0;
        }
        var pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pointsGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        pointsGeometry.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
        pointsGeometry.setAttribute('aAccent', new THREE.BufferAttribute(accents, 1));
        pointsGeometry.setAttribute('aGrid', new THREE.BufferAttribute(grids, 2));

        function makeCloud() {
          var uniforms = {
            uTime: { value: 0 },
            uAssembly: { value: 0 },
            uMorph: { value: 0 },
            uCenter: { value: new THREE.Vector2(0, 0) },
            uRadius: { value: 0.35 },
            uAspect: { value: 1 },
            uSizeScale: { value: narrow ? 1.5 : 1.15 },
            uPointer: { value: new THREE.Vector2(-2, -2) },
            uRepel: { value: 0 },
            uPulse: { value: 0 },
            uPulseCenter: { value: new THREE.Vector2(0, 0) },
            uOpacity: { value: 0 },
            /* 0 keeps the hero sphere; 1 selects the contact envelope geometry. */
            uRing: { value: 0 },
            uTurn: { value: new THREE.Vector2(0, 0) },
            uFeedback: { value: 0 },
            uColorWhite: { value: new THREE.Vector3(white[0], white[1], white[2]) },
            uColorAccent: { value: new THREE.Vector3(accent[0], accent[1], accent[2]) }
          };
          var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: POINT_VERTEX,
            fragmentShader: POINT_FRAGMENT,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending
          });
          var cloud = new THREE.Points(pointsGeometry, material);
          cloud.frustumCulled = false;
          cloud.renderOrder = 1;
          scene.add(cloud);
          return { object: cloud, uniforms: uniforms, material: material };
        }

        var heroCloud = makeCloud();
        var contactCloud = makeCloud();
        /* Dense edge samples read as continuous luminous strokes in the existing
           cloud + halo pass. Two shallow faces and corner ribs give real depth;
           the slightly raised V is the envelope flap, not a central orb. */
        var envelopeVertices = [
          [-0.88, -0.56, 0.07], [0.88, -0.56, 0.07],
          [0.88, 0.56, 0.07], [-0.88, 0.56, 0.07],
          [-0.88, -0.56, -0.07], [0.88, -0.56, -0.07],
          [0.88, 0.56, -0.07], [-0.88, 0.56, -0.07],
          [0, -0.12, 0.1]
        ];
        var envelopeEdges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7], [3, 8], [8, 2]
        ];
        var envelopePositions = [], envelopeSeeds = [], envelopeBrights = [];
        var envelopeAccents = [], envelopeGrids = [];
        envelopeEdges.forEach(function (edge, edgeIndex) {
          var a = envelopeVertices[edge[0]], b = envelopeVertices[edge[1]];
          var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
          var samples = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / 0.018);
          for (var sample = 0; sample <= samples; sample += 1) {
            var t = sample / samples;
            envelopePositions.push(a[0] + dx * t, a[1] + dy * t, a[2] + dz * t);
            envelopeSeeds.push(0.95);
            envelopeBrights.push(edgeIndex >= 4 && edgeIndex < 8 ? 0.65 : 1);
            envelopeAccents.push(edgeIndex >= 12 ? 1 : 0);
            envelopeGrids.push(0, 0);
          }
        });
        var contactGeometry = new THREE.BufferGeometry();
        contactGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(envelopePositions), 3));
        contactGeometry.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(envelopeSeeds), 1));
        contactGeometry.setAttribute('aBright', new THREE.BufferAttribute(new Float32Array(envelopeBrights), 1));
        contactGeometry.setAttribute('aAccent', new THREE.BufferAttribute(new Float32Array(envelopeAccents), 1));
        contactGeometry.setAttribute('aGrid', new THREE.BufferAttribute(new Float32Array(envelopeGrids), 2));
        contactCloud.object.geometry = contactGeometry;
        contactCloud.uniforms.uRing.value = 1;
        contactCloud.material.fragmentShader = figureFragment(POINT_FRAGMENT);
        contactCloud.material.premultipliedAlpha = true;
        figureScene.add(contactCloud.object);
        var contactHalo = addHalo(contactGeometry, contactCloud.uniforms, POINT_VERTEX, POINT_FRAGMENT);

        /* Build each wire sculpture from explicit vertices and edge pairs.
           Points and edges share the same projection, including at rest. */
        function sculptureGeometry(vertices, edges, nodes) {
          var lines = [];
          edges.forEach(function (edge) {
            lines.push.apply(lines, vertices[edge[0]]);
            lines.push.apply(lines, vertices[edge[1]]);
          });
          var positions = [];
          var seeds = [];
          var brights = [];
          nodes.forEach(function (node) {
            positions.push.apply(positions, vertices[node]);
            seeds.push(0.65);
            brights.push(1);
          });
          var points = new THREE.BufferGeometry();
          points.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          points.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seeds), 1));
          points.setAttribute('aBright', new THREE.BufferAttribute(new Float32Array(brights), 1));
          var wire = new THREE.BufferGeometry();
          wire.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines), 3));
          return { points: points, wire: wire };
        }

        var frameVertices = [
          [-0.68, -0.48, 0.18], [0.68, -0.48, 0.18],
          [0.68, 0.48, 0.18], [-0.68, 0.48, 0.18],
          [-0.54, -0.36, -0.25], [0.54, -0.36, -0.25],
          [0.54, 0.6, -0.25], [-0.54, 0.6, -0.25],
          [-0.68, 0.24, 0.18], [0.68, 0.24, 0.18],
          [0, 0.12, 0.48], [-0.23, -0.16, 0.36],
          [0.23, -0.16, 0.36], [0, -0.04, -0.12]
        ];
        var frameEdges = [
          [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7], [8, 9],
          [10, 11], [11, 12], [12, 10], [10, 13], [11, 13], [12, 13]
        ];
        var serverVertices = [];
        var serverEdges = [];
        var serverNodes = [];
        for (var block = 0; block < 3; block += 1) {
          var base = serverVertices.length;
          var blockY = -0.48 + block * 0.43;
          serverVertices.push(
            [-0.56, blockY, 0.3], [0.56, blockY, 0.3],
            [0.56, blockY + 0.26, 0.3], [-0.56, blockY + 0.26, 0.3],
            [-0.56, blockY, -0.3], [0.56, blockY, -0.3],
            [0.56, blockY + 0.26, -0.3], [-0.56, blockY + 0.26, -0.3],
            [-0.38, blockY + 0.13, 0.3]
          );
          [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (edge) {
            serverEdges.push([base + edge[0], base + edge[1]]);
          });
          serverNodes.push(base + 8);
        }
        var dataVertices = [];
        var dataEdges = [];
        var dataNodes = [];
        for (var dataRing = 0; dataRing < 3; dataRing += 1) {
          for (var segment = 0; segment < 40; segment += 1) {
            var theta = segment / 40 * Math.PI * 2;
            var vertexIndex = dataVertices.length;
            dataVertices.push([Math.cos(theta) * 0.62, (dataRing - 1) * 0.4, Math.sin(theta) * 0.62]);
            dataEdges.push([vertexIndex, dataRing * 40 + (segment + 1) % 40]);
            if (segment % 10 === 0) {
              dataNodes.push(vertexIndex);
              if (dataRing > 0) { dataEdges.push([vertexIndex - 40, vertexIndex]); }
            }
          }
        }
        /* A lobed cloud outline on two depth planes, joined by sparse ribs.
           Cubic arcs keep it distinct from both the sphere and data cylinder. */
        var cloudArcs = [
          [[-0.48, -0.38], [-0.86, -0.38], [-0.92, 0.18], [-0.48, 0.2]],
          [[-0.48, 0.2], [-0.54, 0.76], [0.14, 0.88], [0.3, 0.34]],
          [[0.3, 0.34], [0.78, 0.62], [1.04, -0.3], [0.52, -0.38]],
          [[0.52, -0.38], [0.2, -0.4], [-0.2, -0.4], [-0.48, -0.38]]
        ];
        var cloudVertices = [], cloudEdges = [], cloudNodes = [];
        var cloudSegments = 12;
        var cloudRingSize = cloudArcs.length * cloudSegments;
        for (var cloudPlane = 0; cloudPlane < 2; cloudPlane += 1) {
          cloudArcs.forEach(function (arc, arcIndex) {
            for (var point = 0; point < cloudSegments; point += 1) {
              var t = point / cloudSegments, s = 1 - t;
              var x = s * s * s * arc[0][0] + 3 * s * s * t * arc[1][0] +
                3 * s * t * t * arc[2][0] + t * t * t * arc[3][0];
              var y = s * s * s * arc[0][1] + 3 * s * s * t * arc[1][1] +
                3 * s * t * t * arc[2][1] + t * t * t * arc[3][1];
              var index = cloudVertices.length;
              cloudVertices.push([x, y - 0.1, cloudPlane ? -0.24 : 0.24]);
              cloudEdges.push([index, cloudPlane * cloudRingSize + (arcIndex * cloudSegments + point + 1) % cloudRingSize]);
              if (point === 0 || point === 6) {
                if (cloudPlane) { cloudEdges.push([index - cloudRingSize, index]); }
                else { cloudNodes.push(index); }
              }
            }
          });
        }
        /* A small inner ridge gives the front lobe a readable wire surface. */
        var cloudRidge = cloudVertices.length;
        cloudVertices.push([-0.12, 0.02, 0.32]);
        cloudNodes.push(cloudRidge);
        [0, 12, 18, 24, 36].forEach(function (index) { cloudEdges.push([index, cloudRidge]); });
        var geometryByKey = {
          interfaz: sculptureGeometry(frameVertices, frameEdges, [10, 11, 12]),
          servidor: sculptureGeometry(serverVertices, serverEdges, serverNodes),
          datos: sculptureGeometry(dataVertices, dataEdges, dataNodes),
          cloud: sculptureGeometry(cloudVertices, cloudEdges, cloudNodes)
        };
        var capGeometries = capabilities.map(function (capability) { return geometryByKey[capability.key]; });

        var capClusters = [];
        for (var capIndex = 0; capIndex < capabilities.length; capIndex += 1) {
          var capUniforms = {
            uTime: { value: 0 },
            uAssembly: { value: 0 },
            uCenter: { value: new THREE.Vector2(0, 0) },
            uRadius: { value: 0.3 },
            uAspect: { value: 1 },
            uSizeScale: { value: narrow ? 2.6 : 2.1 },
            uPulse: { value: 0 },
            uPhase: { value: capabilities[capIndex].phase },
            uTurn: { value: new THREE.Vector2(0, 0) },
            uOpacity: { value: 0 },
            uColorWhite: { value: new THREE.Vector3(white[0], white[1], white[2]) },
            uColorAccent: { value: new THREE.Vector3(accent[0], accent[1], accent[2]) }
          };
          var capMaterial = new THREE.ShaderMaterial({
            uniforms: capUniforms,
            vertexShader: NODE_VERTEX,
            fragmentShader: figureFragment(NODE_FRAGMENT),
            premultipliedAlpha: true,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending
          });
          var capPoints = new THREE.Points(capGeometries[capIndex].points, capMaterial);
          capPoints.frustumCulled = false;
          capPoints.renderOrder = 1;
          figureScene.add(capPoints);

          var capLineMaterial = new THREE.ShaderMaterial({
            /* the lines share the cluster's own uniforms object and the same
               NODE_TRANSFORM chunk the nodes use, so the edges follow assembly,
               breathing and the group pulse with no second transform (F1) */
            uniforms: capUniforms,
            vertexShader: NODE_LINE_VERTEX,
            fragmentShader: figureFragment(NODE_LINE_FRAGMENT),
            premultipliedAlpha: true,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending
          });
          var capLines = new THREE.LineSegments(capGeometries[capIndex].wire, capLineMaterial);
          capLines.frustumCulled = false;
          capLines.renderOrder = 1;
          figureScene.add(capLines);

          /* Sample the existing wire edges for a bounded soft line halo.
             Geometry/projection of the redesigned core remains untouched. */
          var haloPositions = [];
          var wirePositions = capGeometries[capIndex].wire.getAttribute('position').array;
          for (var edgeStart = 0; edgeStart < wirePositions.length; edgeStart += 6) {
            var dx = wirePositions[edgeStart + 3] - wirePositions[edgeStart];
            var dy = wirePositions[edgeStart + 4] - wirePositions[edgeStart + 1];
            var dz = wirePositions[edgeStart + 5] - wirePositions[edgeStart + 2];
            var samples = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / 0.04));
            for (var sample = 0; sample <= samples; sample += 1) {
              var t = sample / samples;
              haloPositions.push(wirePositions[edgeStart] + dx * t,
                wirePositions[edgeStart + 1] + dy * t, wirePositions[edgeStart + 2] + dz * t);
            }
          }
          var haloGeometry = new THREE.BufferGeometry();
          var haloCount = haloPositions.length / 3;
          haloGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(haloPositions), 3));
          haloGeometry.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(haloCount).fill(0.65), 1));
          haloGeometry.setAttribute('aBright', new THREE.BufferAttribute(new Float32Array(haloCount).fill(1), 1));
          haloGeometries.push(haloGeometry);
          var capHalo = addHalo(haloGeometry, capUniforms, NODE_VERTEX, NODE_FRAGMENT);

          capClusters.push({
            halo: capHalo,
            key: capabilities[capIndex].key,
            anchor: document.getElementById(capabilities[capIndex].anchorId),
            points: capPoints,
            lines: capLines,
            uniforms: capUniforms,
            lineMaterial: capLineMaterial
          });
        }

        /* ── T25 blog page planes: one shared stack of three thin outlines per
           plane, one instance per article. Only the local figure target
           supplies hover, focused-keyboard and drag state. ── */
        var pageVertices = [];
        /* F3: the sheets are thin planes, not bare outlines, so every page also
           contributes a filled quad to one shared fill geometry */
        var pageFillVertices = [];
        for (var pageIndex = 0; pageIndex < 3; pageIndex += 1) {
          /* the three outlines of one stack step right and down, exactly like
             the inline SVG stand-in, so both engines read as one object */
          var pageOffsetX = pageIndex * 0.025;
          var pageOffsetY = pageIndex * 0.035;
          var pageZ = (pageIndex - 1) * 0.16;
          var pageX0 = -0.17 + pageOffsetX;
          var pageX1 = 0.17 + pageOffsetX;
          var pageY0 = -0.28 - pageOffsetY;
          var pageY1 = 0.28 - pageOffsetY;
          pageVertices.push(pageX0, pageY0, pageZ, pageX1, pageY0, pageZ);
          pageVertices.push(pageX1, pageY0, pageZ, pageX1, pageY1, pageZ);
          pageVertices.push(pageX1, pageY1, pageZ, pageX0, pageY1, pageZ);
          pageVertices.push(pageX0, pageY1, pageZ, pageX0, pageY0, pageZ);
          /* text lines and a folded corner make each sheet read as a written
             note; they share the sheet's depth so the hinge bends them too */
          for (var textLine = 0; textLine < 5; textLine += 1) {
            var lineY = pageY1 - 0.1 - textLine * 0.085;
            var lineEnd = textLine === 4 ? pageX0 + 0.14 : pageX1 - 0.05;
            pageVertices.push(pageX0 + 0.05, lineY, pageZ, lineEnd, lineY, pageZ);
          }
          pageVertices.push(pageX1 - 0.07, pageY1, pageZ, pageX1, pageY1 - 0.07, pageZ);
          pageVertices.push(pageX1 - 0.07, pageY1, pageZ, pageX1 - 0.07, pageY1 - 0.07, pageZ);
          pageVertices.push(pageX1 - 0.07, pageY1 - 0.07, pageZ, pageX1, pageY1 - 0.07, pageZ);
          pageFillVertices.push(pageX0, pageY0, pageZ, pageX1, pageY0, pageZ, pageX1, pageY1, pageZ);
          pageFillVertices.push(pageX0, pageY0, pageZ, pageX1, pageY1, pageZ, pageX0, pageY1, pageZ);
        }
        var pageGeometry = new THREE.BufferGeometry();
        pageGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pageVertices), 3));
        /* one shared fill geometry and one shared fill material serve all three
           page planes, so a fill can never drift from the outline it fills */
        var pageFillGeometry = new THREE.BufferGeometry();
        pageFillGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pageFillVertices), 3));
        /* Real sheet depth and a hinged fan share one projection for fill and
           outline. No stand-in group rotation can bypass the shader state. */
        var pageVertex = [
          NODE_TRANSFORM,
          'uniform float uPageOpen;',
          'varying float vDepth;',
          'void main() {',
          '  vec3 p = position;',
          '  float angle = p.z * uPageOpen * 2.8;',
          '  float hinge = p.x + 0.17;',
          '  p.x = -0.17 + hinge * cos(angle);',
          '  p.z += hinge * sin(angle);',
          '  p.y += position.z * uPageOpen * 0.3;',
          '  vec3 rotated = nodeRotation(p);',
          '  vDepth = clamp((rotated.z + 0.8) / 1.6, 0.0, 1.0);',
          '  gl_Position = vec4(nodePosition(rotated), 0.0, 1.0);',
          '}'
        ].join('\n');
        var pageFragment = [
          'uniform vec3 uColor;',
          'uniform float uOpacity;',
          'varying float vDepth;',
          'void main() { gl_FragColor = vec4(mix(min(uColor * 1.6, vec3(1.0)), vec3(0.74, 0.68, 1.0), 0.7), uOpacity * (0.6 + 0.4 * vDepth)); }'
        ].join('\n');
        function makePageMaterial(uniforms) {
          return new THREE.ShaderMaterial({
            uniforms: Object.assign({}, uniforms, { uOpacity: { value: 0 } }),
            vertexShader: pageVertex, fragmentShader: pageFragment,
            transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide
          });
        }
        var blogSceneEl = document.getElementById('blog-scene');
        var blogPages = [];
        for (var pageSlot = 0; pageSlot < document.querySelectorAll('.blog-scene__plane').length; pageSlot += 1) {
          var pageUniforms = {
            uTime: { value: 0 }, uAssembly: { value: 1 },
            uCenter: { value: new THREE.Vector2(0, 0) }, uRadius: { value: 0.1 },
            uAspect: { value: 1 }, uPhase: { value: pageSlot * 0.4 },
            uTurn: { value: new THREE.Vector2(0, 0) }, uPageOpen: { value: 0 },
            uColor: { value: new THREE.Vector3(accent[0], accent[1], accent[2]) }
          };
          var pageFillMaterial = makePageMaterial(pageUniforms);
          var pageMaterial = makePageMaterial(pageUniforms);
          var pageGroup = new THREE.Group();
          /* the fill is drawn first (renderOrder 0) and the outline after it
             (renderOrder 1), so a sheet never covers its own edge */
          var pageFill = new THREE.Mesh(pageFillGeometry, pageFillMaterial);
          pageFill.frustumCulled = false;
          pageFill.renderOrder = 0;
          pageGroup.add(pageFill);
          var pageLines = new THREE.LineSegments(pageGeometry, pageMaterial);
          pageLines.frustumCulled = false;
          pageLines.renderOrder = 1;
          pageGroup.add(pageLines);
          /* foreground layer like the skill caps and contact cloud: the smoke
             canvas sits under the section veil and would mute the notes */
          figureScene.add(pageGroup);
          blogPages.push({ group: pageGroup, uniforms: pageUniforms,
            fillMaterial: pageFillMaterial, lineMaterial: pageMaterial });
        }

        var state = {
          running: false,
          contextLost: false,
          disposed: false,
          frameId: 0,
          lastStamp: 0,
          clock: 0,
          assembly: 0,
          morph: 0,
          morphTarget: 0,
          repel: 0,
          repelV: 0,
          pointerX: -2,
          pointerY: -2,
          pointerGoalX: -2,
          pointerGoalY: -2,
          pointerOn: false,
          pointerYaw: 0,
          pointerTilt: 0,
          suspended: false,
          pulseT: -1,
          pulse: 0,
          pulseX: 0,
          pulseY: 0,
          heroOpacity: 0,
          contactOpacity: 0,
          /* T25 slot state: each decorative slot assembles as it enters the
             viewport and releases as it leaves, so nothing is drawn at zero
             opacity and no slot is ever half-organised on screen */
          contactAssembly: 0,
          contactTarget: 0,
          capOpacity: capabilities.map(function () { return 0; }),
          capTarget: capabilities.map(function () { return 0; }),
          capAssembly: capabilities.map(function () { return 0; }),
          capPulse: capabilities.map(function () { return 0; }),
          capPulseAt: capabilities.map(function () { return -1; }),
          blogOpacity: 0,
          width: 1,
          height: 1,
          frameInterval: 1000 / 30
        };

        var disposers = [];
        function listen(target, type, handler, options) {
          if (!target || !target.addEventListener) { return; }
          target.addEventListener(type, handler, options);
          disposers.push(function () { target.removeEventListener(type, handler, options); });
        }

        function resize() {
          var w = Math.max(1, Math.round(window.innerWidth || 1));
          var h = Math.max(1, Math.round(window.innerHeight || 1));
          state.width = w;
          state.height = h;
          var dprCap = narrow ? 1.2 : 1.4;
          var scale = narrow ? 0.62 : 0.72;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap) * scale);
          renderer.setSize(w, h, false);
          figureRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
          figureRenderer.setSize(w, h, false);
          smokeUniforms.uResolution.value.set(w, h);
        }

        /* T25: one reader for the decorative slots. It returns the centre in
           normalised device coordinates, the box size in CSS pixels and an
           opacity derived from how much of the box is inside the viewport, so
           every slot is viewport-aligned and releases itself when it leaves. */
        function slotBox(el) {
          var w = state.width;
          var h = state.height;
          var r = el.getBoundingClientRect();
          var visible = Math.min(r.bottom, h) - Math.max(r.top, 0);
          var ratio = r.height > 0 ? visible / r.height : 0;
          return {
            x: ((r.left + r.width / 2) / w) * 2 - 1,
            y: 1 - ((r.top + r.height / 2) / h) * 2,
            w: r.width,
            h: r.height,
            opacity: ratio > 0 ? Math.min(1, ratio * 1.35) : 0
          };
        }

        /* Mirror NODE_TRANSFORM and the book hinge, rather than raycasting
           untransformed CPU geometry. Include BOTH feedback states in the
           hull: entering a target cannot shrink it and oscillate hover. The
           anchors themselves never rotate. Bounds remain clipped to each
           art slot so no reading text/link becomes an input surface. */
        function projectedNodeBounds(key, vertices, centerX, centerY, radius, phase, assembly, book) {
          var input = objectInteractions.objects[key];
          var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (var feedback = 0; feedback <= 1; feedback += 1) {
            var yawAngle = 0.35 + phase * 0.16 + Math.sin(state.clock * 0.18 + phase) * 0.28 +
              input.yaw + feedback * (book ? 0.24 : 0.18);
            var tiltAngle = -0.24 + Math.sin(state.clock * 0.13 + phase) * 0.16 +
              input.pitch - feedback * (book ? 0.16 : 0.12);
            var cy = Math.cos(yawAngle), sy = Math.sin(yawAngle);
            var ct = Math.cos(tiltAngle), st = Math.sin(tiltAngle);
            for (var vertex = 0; vertex < vertices.length; vertex += 3) {
              var x = vertices[vertex], y = vertices[vertex + 1], z = vertices[vertex + 2];
              if (book) {
                var open = feedback ? 1 : 0.2;
                var angle = z * open * 2.8;
                var hinge = x + 0.17;
                x = -0.17 + hinge * Math.cos(angle);
                y += z * open * 0.3;
                z += hinge * Math.sin(angle);
              }
              var rx = x * cy + z * sy;
              var rz = -x * sy + z * cy;
              var ry = y * ct - rz * st;
              rz = y * st + rz * ct;
              var perspective = 2.4 / (2.4 - rz);
              var scale = radius * perspective * (1.25 - 0.25 * assembly);
              var px = centerX + rx * scale;
              var py = centerY - ry * scale;
              minX = Math.min(minX, px); maxX = Math.max(maxX, px);
              minY = Math.min(minY, py); maxY = Math.max(maxY, py);
            }
          }
          /* Six CSS pixels include nodes/edge softness, not a whole grid cell. */
          objectInteractions.setBounds(key, minX - 6, minY - 6, maxX - minX + 12, maxY - minY + 12);
        }

        /* Mirror the contact POINT_VERTEX projection, including entry scatter.
           Union both feedback states so hover cannot shrink its own hit box. */
        function projectedContactBounds(rect) {
          var input = objectInteractions.objects.contact;
          var radius = Math.min(rect.width, rect.height) * 0.4;
          var entry = 1 - state.contactAssembly;
          var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (var feedback = 0; feedback <= 1; feedback += 1) {
            var spin = Math.sin(state.clock * 0.09) * 0.16 + input.yaw + feedback * 0.18;
            var tilt = Math.sin(state.clock * 0.11) * 0.08 + input.pitch - feedback * 0.12;
            var cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
            for (var point = 0; point < envelopePositions.length; point += 3) {
              var x = envelopePositions[point], y = envelopePositions[point + 1], z = envelopePositions[point + 2];
              var rx = x * cs - z * ss, rz = x * ss + z * cs;
              var ry = y * ct - rz * st;
              rz = y * st + rz * ct;
              var perspective = 1.9 / (1.9 - rz);
              var nx = rx * perspective, ny = ry * perspective;
              nx = nx * (1 - entry * 0.12) + Math.cos(0.95 * 31.4) * entry * 0.015;
              ny = ny * (1 - entry * 0.12) + Math.sin(0.95 * 27.1) * entry * 0.015;
              var px = rect.left + rect.width / 2 + nx * radius;
              var py = rect.top + rect.height / 2 - ny * radius;
              minX = Math.min(minX, px); maxX = Math.max(maxX, px);
              minY = Math.min(minY, py); maxY = Math.max(maxY, py);
            }
          }
          objectInteractions.setBounds('contact', minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8);
        }

        /* The same slot measurements place artwork AND its local hit region. */
        function placeClouds() {
          var w = state.width;
          var h = state.height;
          var aspect = w / h;
          if (heroAnchorEl) {
            var hr = heroAnchorEl.getBoundingClientRect();
            var hx = ((hr.left + hr.width / 2) / w) * 2 - 1;
            var hy = 1 - ((hr.top + hr.height / 2) / h) * 2;
            heroCloud.uniforms.uCenter.value.set(hx, hy);
            heroCloud.uniforms.uRadius.value = (Math.min(hr.width, hr.height) * 0.46) / (h / 2);
            heroCloud.uniforms.uAspect.value = aspect;
            /* Unit sphere projection 1.9/(1.9-z) has silhouette radius
               1.9/sqrt(1.9^2-1), not a naive CPU raycast circle. Clip to
               the reserved hero art box; the exit lattice is not a giant
               alternate interaction surface. */
            var heroHitRadius = Math.min(hr.width, hr.height) * 0.46 * 1.176;
            objectInteractions.setBounds('hero', hr.left + hr.width / 2 - heroHitRadius,
              hr.top + hr.height / 2 - heroHitRadius, heroHitRadius * 2, heroHitRadius * 2);
            var visibleHeight = Math.min(hr.bottom, h) - Math.max(hr.top, 0);
            state.heroOpacity = visibleHeight > 0 ? Math.min(1, visibleHeight / (h * 0.3)) : 0;
            smokeUniforms.uSphere.value.set((hx + 1) * 0.5, (hy + 1) * 0.5);
            smokeUniforms.uSphereRadius.value = (Math.min(hr.width, hr.height) * 0.46) / h;
          }
          if (contactAnchorEl && (window.innerWidth || 1024) > 1100) {
            var cr = contactAnchorEl.getBoundingClientRect();
            var cx = ((cr.left + cr.width / 2) / w) * 2 - 1;
            var cy = 1 - ((cr.top + cr.height / 2) / h) * 2;
            contactCloud.uniforms.uCenter.value.set(cx, cy);
            contactCloud.uniforms.uRadius.value = (Math.min(cr.width, cr.height) * 0.4) / (h / 2);
            contactCloud.uniforms.uAspect.value = aspect;
            projectedContactBounds(cr);
            var contactVisible = Math.min(cr.bottom, h) - Math.max(cr.top, 0);
            state.contactOpacity = contactVisible > 0
              ? Math.min(1, contactVisible / Math.max(1, cr.height))
              : 0;
          } else {
            state.contactOpacity = 0;
          }

          /* T25 slots. Each is measured on every frame like the sphere, so the
             clusters stay aligned with their tiles, the page planes stay inside
             the blog header and the contact envelope stays beside the statement,
             clear of the heading and the action row. */
          for (var capSlot = 0; capSlot < capClusters.length; capSlot += 1) {
            var cluster = capClusters[capSlot];
            if (!cluster.anchor) {
              state.capOpacity[capSlot] = 0;
              state.capTarget[capSlot] = 0;
              continue;
            }
            var clusterBox = slotBox(cluster.anchor);
            cluster.uniforms.uCenter.value.set(clusterBox.x, clusterBox.y);
            cluster.uniforms.uRadius.value = (Math.min(clusterBox.w, clusterBox.h) * 0.55) / (h / 2);
            cluster.uniforms.uAspect.value = aspect;
            projectedNodeBounds(cluster.key,
              capGeometries[capSlot].wire.getAttribute('position').array,
              (clusterBox.x + 1) * w / 2, (1 - clusterBox.y) * h / 2,
              Math.min(clusterBox.w, clusterBox.h) * 0.55,
              cluster.uniforms.uPhase.value, state.capAssembly[capSlot], false);
            state.capOpacity[capSlot] = clusterBox.opacity;
            state.capTarget[capSlot] = clusterBox.opacity > 0.05 ? 1 : 0;
          }
          if (blogSceneEl) {
            var blogBox = slotBox(blogSceneEl);
            state.blogOpacity = blogBox.opacity;
            for (var blogSlot = 0; blogSlot < blogPages.length; blogSlot += 1) {
              var slotFraction = (blogSlot + 0.5) / blogPages.length - 0.5;
              var planeScale = (blogBox.h * 2.9) / h;
              blogPages[blogSlot].uniforms.uCenter.value.set(
                blogBox.x + slotFraction * blogBox.w * (2 / w), blogBox.y);
              blogPages[blogSlot].uniforms.uRadius.value = planeScale;
              blogPages[blogSlot].uniforms.uAspect.value = aspect;
              projectedNodeBounds('book-' + blogSlot, pageVertices,
                (blogBox.x + 1) * w / 2 + slotFraction * blogBox.w,
                (1 - blogBox.y) * h / 2, blogBox.h * 1.45, blogSlot * 0.4, 1, true);
            }
          } else {
            state.blogOpacity = 0;
          }
          state.contactTarget = state.contactOpacity > 0.05 ? 1 : 0;
        }

        /* hero → work: a partial, reversible sphere-to-trama blend. ScrollTrigger
           reports the progress when GSAP is present; otherwise the same value is
           derived from the hero box. Nothing is pinned and no scroll is taken. */
        function updateMorph() {
          if (sharedMotionOff()) { state.morphTarget = 0; return; }
          var raw;
          if (scrollMorphProgress >= 0) {
            raw = Math.min(1, Math.max(0, scrollMorphProgress));
          } else if (heroSectionEl) {
            raw = heroExitProgress(heroSectionEl);
          } else {
            raw = 0;
          }
          /* the same smoothstep and the same partial cap as the Canvas2D
             fallback, so both engines share one morph contract */
          raw = raw * raw * (3 - 2 * raw);
          state.morphTarget = raw * 0.45;
        }

        function applyUniforms() {
          var pointer = [state.pointerX, state.pointerY];
          var heroInput = objectInteractions.objects.hero;
          var contactInput = objectInteractions.objects.contact;
          heroCloud.uniforms.uTurn.value.set(heroInput.yaw + state.pointerYaw, heroInput.pitch + state.pointerTilt);
          contactCloud.uniforms.uTurn.value.set(contactInput.yaw, contactInput.pitch);
          heroCloud.uniforms.uFeedback.value = heroInput.hover || heroInput.focus ? 1 : 0;
          contactCloud.uniforms.uFeedback.value = contactInput.hover || contactInput.focus ? 1 : 0;
          heroCloud.uniforms.uTime.value = state.clock;
          contactCloud.uniforms.uTime.value = state.clock;
          smokeUniforms.uTime.value = state.clock;
          heroCloud.uniforms.uAssembly.value = state.assembly;
          /* the closing slot assembles from its own progress, so it organises
             itself when the section enters rather than inheriting the hero
             timing (T25) */
          contactCloud.uniforms.uAssembly.value = state.contactAssembly;
          contactCloud.uniforms.uRing.value = 1;
          heroCloud.uniforms.uMorph.value = state.morph;
          contactCloud.uniforms.uMorph.value = 0;
          heroCloud.uniforms.uOpacity.value = state.heroOpacity;
          contactCloud.uniforms.uOpacity.value = state.contactOpacity;
          heroCloud.uniforms.uPointer.value.set(pointer[0], pointer[1]);
          contactCloud.uniforms.uPointer.value.set(pointer[0], pointer[1]);
          heroCloud.uniforms.uRepel.value = state.repel;
          contactCloud.uniforms.uRepel.value = 0;
          heroCloud.uniforms.uPulse.value = state.pulse;
          contactCloud.uniforms.uPulse.value = 0;
          heroCloud.uniforms.uPulseCenter.value.set(state.pulseX, state.pulseY);

          /* T25 slots: visibility follows the measured box, so an off-screen
             slot costs nothing and a visible one is always fully drawn */
          heroCloud.object.visible = state.heroOpacity > 0.002;
          contactCloud.object.visible = state.contactOpacity > 0.002;
          contactHalo.visible = contactCloud.object.visible;
          for (var capDraw = 0; capDraw < capClusters.length; capDraw += 1) {
            var drawCluster = capClusters[capDraw];
            var clusterAlpha = state.capOpacity[capDraw];
            drawCluster.uniforms.uTime.value = state.clock;
            drawCluster.uniforms.uAssembly.value = state.capAssembly[capDraw];
            var capInput = objectInteractions.objects[drawCluster.key];
            var capActive = capInput.hover || capInput.focus;
            drawCluster.uniforms.uTurn.value.set(capInput.yaw + (capActive ? 0.18 : 0), capInput.pitch - (capActive ? 0.12 : 0));
            drawCluster.uniforms.uPulse.value = capActive ? 1 : state.capPulse[capDraw];
            drawCluster.uniforms.uOpacity.value = clusterAlpha;
            drawCluster.points.visible = clusterAlpha > 0.002;
            drawCluster.lines.visible = drawCluster.points.visible;
            drawCluster.halo.visible = drawCluster.points.visible;
          }
          for (var planeDraw = 0; planeDraw < blogPages.length; planeDraw += 1) {
            var book = blogPages[planeDraw];
            var manualBook = objectInteractions.objects['book-' + planeDraw];
            var activeBook = manualBook.hover || manualBook.focus;
            book.uniforms.uTime.value = state.clock;
            book.uniforms.uTurn.value.set(manualBook.yaw + (activeBook ? 0.24 : 0), manualBook.pitch - (activeBook ? 0.16 : 0));
            book.uniforms.uPageOpen.value = activeBook ? 1 : 0.5 + Math.sin(state.clock * 0.9 + planeDraw * 0.9) * 0.08;
            book.lineMaterial.uniforms.uOpacity.value = state.blogOpacity * (activeBook ? 1 : 0.92);
            book.fillMaterial.uniforms.uOpacity.value = state.blogOpacity * (activeBook ? 0.3 : 0.16);
            book.group.visible = state.blogOpacity > 0.002;
          }
        }

        function draw() {
          renderer.render(scene, camera);
          figureRenderer.render(figureScene, camera);
        }

        function renderOnce() {
          if (state.contextLost || state.disposed || state.suspended || document.hidden) { return; }
          placeClouds();
          applyUniforms();
          draw();
        }

        function frame(stamp) {
          if (!state.running) { state.frameId = 0; return; }
          state.frameId = window.requestAnimationFrame(frame);
          var now = stamp || 0;
          if (!state.lastStamp) { state.lastStamp = now; return; }
          var gap = now - state.lastStamp;
          if (gap < state.frameInterval) { return; }
          state.lastStamp = now;
          var step = Math.min(gap, 60);
          var dt = step / 16.667;
          var seconds = step / 1000;
          state.clock += seconds;
          /* T23: the assembly is brief — the sphere is organised in about
             0.6 s while the entry scatter keeps its volume recognizable */
          state.assembly = Math.min(1, state.assembly + seconds / 0.6);
          updateMorph();
          state.morph += (state.morphTarget - state.morph) * Math.min(1, 0.07 * dt);
          /* the repulsion influence eases in and springs back out, so the cloud
             always returns to its sphere when the pointer leaves */
          var repelTarget = (state.pointerOn && !sharedMotionOff()) ? 1 : 0;
          state.repelV += (repelTarget - state.repel) * 0.2 * dt;
          state.repelV *= 0.8;
          state.repel += state.repelV * dt;
          state.pointerX += (state.pointerGoalX - state.pointerX) * Math.min(1, 0.14 * dt);
          state.pointerY += (state.pointerGoalY - state.pointerY) * Math.min(1, 0.14 * dt);
          if (state.pulseT >= 0) {
            var age = (now - state.pulseT) / 650;
            if (age >= 1) { age = 1; state.pulseT = -1; }
            state.pulse = 1 - age;
          } else {
            state.pulse = 0;
          }
          /* T25: the capability clusters and the contact envelope assemble as
             their slot enters the viewport and release as it leaves */
          state.contactAssembly += (state.contactTarget - state.contactAssembly) * Math.min(1, 0.09 * dt);
          for (var slotStep = 0; slotStep < capClusters.length; slotStep += 1) {
            state.capAssembly[slotStep] += (state.capTarget[slotStep] - state.capAssembly[slotStep]) * Math.min(1, 0.09 * dt);
            var clusterPulseAt = state.capPulseAt[slotStep];
            if (clusterPulseAt >= 0) {
              var clusterPulseAge = (now - clusterPulseAt) / 700;
              if (clusterPulseAge >= 1) { clusterPulseAge = 1; state.capPulseAt[slotStep] = -1; }
              state.capPulse[slotStep] = 1 - clusterPulseAge;
            } else {
              state.capPulse[slotStep] = 0;
            }
          }
          renderOnce();
        }

        function start() {
          if (state.running || state.contextLost || state.disposed || state.suspended || document.hidden ||
              !window.requestAnimationFrame) { return; }
          state.running = true;
          state.lastStamp = 0;
          state.frameId = window.requestAnimationFrame(frame);
        }

        function stop() {
          state.running = false;
          if (state.frameId) {
            window.cancelAnimationFrame(state.frameId);
            state.frameId = 0;
          }
        }

        /* paused or reduced: one defined, already assembled frame is drawn and
           the loop is released, so reading is never delayed by the atmosphere */
        function setMotion(allowed) {
          if (allowed && !document.hidden) { start(); return; }
          state.assembly = 1;
          state.morph = 0;
          state.morphTarget = 0;
          state.repel = 0;
          state.repelV = 0;
          state.pointerOn = false;
          state.pulse = 0;
          state.pulseT = -1;
          /* T25: a paused or reduced page holds every slot fully assembled, and
             the measured box then decides which of them are on screen */
          state.contactAssembly = 1;
          for (var capStill = 0; capStill < capClusters.length; capStill += 1) {
            state.capAssembly[capStill] = 1;
            state.capPulse[capStill] = 0;
            state.capPulseAt[capStill] = -1;
          }
          stop();
          renderOnce();
        }

        function onVisibility() {
          if (document.hidden) { objectInteractions.cancel(); stop(); }
          else { renderOnce(); if (!sharedMotionOff()) { start(); } }
        }

        function onPageHide(event) {
          state.suspended = true;
          stop();
          if (event && event.persisted) { return; }
          dispose();
        }

        function onPageShow(event) {
          if (event && event.persisted) {
            state.suspended = false;
            resize();
            renderOnce();
            if (!sharedMotionOff()) { start(); }
          }
        }

        function onContextLost(event) {
          if (event && event.preventDefault) { event.preventDefault(); }
          state.contextLost = true;
          objectInteractions.cancel();
          objectInteractions.setEngineAvailable(false);
          stop();
          /* the CSS veil carries the page until the context returns; a second
             Canvas2D loop is deliberately not started, so no parallel RAF can
             exist beside the WebGL one */
          document.documentElement.classList.remove('webgl-active');
        }

        function onContextRestored() {
          state.contextLost = renderer.getContext().isContextLost() || figureRenderer.getContext().isContextLost();
          if (state.contextLost || state.disposed) { return; }
          document.documentElement.classList.add('webgl-active');
          objectInteractions.setEngineAvailable(true);
          resize();
          renderOnce();
          if (!sharedMotionOff()) { start(); }
        }

        function dispose() {
          objectInteractions.cancel();
          objectInteractions.setRedraw(null);
          objectInteractions.setPointerBridge(null);
          state.disposed = true;
          stop();
          for (var d = 0; d < disposers.length; d += 1) { disposers[d](); }
          disposers.length = 0;
          try {
            pointsGeometry.dispose();
            smokeGeometry.dispose();
            smokeMaterial.dispose();
            heroCloud.material.dispose();
            contactCloud.material.dispose();
            contactGeometry.dispose();
            capGeometries.forEach(function (geometry) {
              geometry.points.dispose();
              geometry.wire.dispose();
            });
            pageGeometry.dispose();
            pageFillGeometry.dispose();
            blogPages.forEach(function (book) {
              book.fillMaterial.dispose();
              book.lineMaterial.dispose();
            });
            for (var capDispose = 0; capDispose < capClusters.length; capDispose += 1) {
              capClusters[capDispose].points.material.dispose();
              capClusters[capDispose].lineMaterial.dispose();
            }
            haloMaterials.forEach(function (material) { material.dispose(); });
            haloGeometries.forEach(function (geometry) { geometry.dispose(); });
            figureRenderer.dispose();
            renderer.dispose();
          } catch { /* disposal at unload must never throw */ }
          document.documentElement.classList.remove('webgl-active');
        }

        resize();
        document.documentElement.classList.add('webgl-active');
        if (canvas) { canvas.hidden = true; }
        renderOnce();

        listen(window, 'resize', function () { resize(); renderOnce(); });
        listen(window, 'scroll', function () {
          /* A stopped RAF cannot upload placement/visibility uniforms. Draw
             explicitly at the frozen clock; never resume ambient motion. */
          if (!state.running && !document.hidden) { renderOnce(); }
        }, { passive: true });
        listen(document, 'visibilitychange', onVisibility);
        listen(window, 'pagehide', onPageHide);
        listen(window, 'pageshow', onPageShow);
        listen(sceneCanvasEl, 'webglcontextlost', onContextLost, false);
        listen(sceneCanvasEl, 'webglcontextrestored', onContextRestored, false);
        listen(figureCanvasEl, 'webglcontextlost', onContextLost, false);
        listen(figureCanvasEl, 'webglcontextrestored', onContextRestored, false);

        objectInteractions.setPointerBridge(function (event, kind) {
          if (state.disposed) { return; }
          if (kind === 'leave') {
            state.pointerOn = false;
            state.pointerGoalX = state.pointerGoalY = -2;
            state.pointerYaw = state.pointerTilt = 0;
          } else {
            if (state.contextLost || state.suspended || document.hidden) { return; }
            /* POINT_VERTEX uses viewport NDC; Canvas2D uses its own local
               pixels through the same controller bridge, never canvas events. */
            state.pointerGoalX = event.clientX / state.width * 2 - 1;
            state.pointerGoalY = 1 - event.clientY / state.height * 2;
            state.pointerOn = true;
            var rect = heroAnchorEl.getBoundingClientRect();
            state.pointerYaw = (event.clientX - rect.left - rect.width / 2) / Math.max(1, rect.width) * 0.6;
            state.pointerTilt = (event.clientY - rect.top - rect.height / 2) / Math.max(1, rect.height) * 0.45;
            if (kind === 'pulse' && state.running) {
              state.pulseX = state.pointerGoalX;
              state.pulseY = state.pointerGoalY;
              state.pulseT = window.performance && window.performance.now ? window.performance.now() : Date.now();
              state.pulse = 1;
            }
          }
          if (!state.running) {
            state.pointerX = state.pointerGoalX;
            state.pointerY = state.pointerGoalY;
          }
          renderOnce(); /* explicit redraw does not advance clock or start RAF */
        });
        objectInteractions.setRedraw(renderOnce);
        objectInteractions.setHeroAvailable(true);

        if (!sharedMotionOff()) { start(); }

        return { setMotion: setMotion, dispose: dispose, renderOnce: renderOnce };
      }

      /* the exclusive Canvas2D fallback starts at most once, whoever asks */
      function startCanvas2D() {
        if (canvas2DStarted || webglHandle) { return; }
        canvas2DStarted = true;
        startSmoke2D();
        startOrb2D();
      }

      /* ── GSAP choreography ── */
      var userPausedExplicitly = false;

      function syncEnginePauseControl() {
        if (!pauseButton) { return; }
        if (sharedMotionQuery && sharedMotionQuery.matches) {
          pauseButton.disabled = true;
          setPauseLabel(copy.reduced);
          pauseButton.setAttribute('aria-pressed', 'true');
          pauseButton.setAttribute('aria-label', copy.reducedScene);
          return;
        }
        pauseButton.disabled = false;
        setPauseLabel(userPausedExplicitly ? copy.resume : copy.pause);
        pauseButton.setAttribute('aria-pressed', userPausedExplicitly ? 'true' : 'false');
        pauseButton.setAttribute('aria-label', userPausedExplicitly ? copy.scenePaused : copy.sceneRunning);
      }

      function wireEnginePauseControl() {
        if (!pauseButton) { return; }
        pauseButton.addEventListener('click', function () {
          userPausedExplicitly = !userPausedExplicitly;
          /* the shared motion control reads this button back, so the state is
             refreshed here and the shared switch is re-evaluated right after */
          syncEnginePauseControl();
          applyMotionState();
        });
      }

      function bootGsap() {
        if (!gsap || !ScrollTrigger) { return false; }
        try { gsap.registerPlugin(ScrollTrigger); } catch { return false; }
        document.documentElement.classList.add('gsap-ready');

        /* GSAP owns the reveal choreography from here, so the CSS reveal path
           is released first: without this, an element could be animated twice */
        revealItems.forEach(function (el) {
          el.classList.remove('js-reveal');
          el.classList.add('is-revealed');
        });

        var touched = [];
        var triggers = [];

        function track(els) {
          var list = els && els.length !== undefined && typeof els !== 'string' ? els : [els];
          for (var t = 0; t < list.length; t += 1) { touched.push(list[t]); }
        }

        function clearAll() {
          for (var i = 0; i < triggers.length; i += 1) {
            if (triggers[i] && triggers[i].kill) { triggers[i].kill(); }
          }
          triggers = [];
          if (touched.length) {
            gsap.killTweensOf(touched);
            gsap.set(touched, { clearProps: 'opacity,transform' });
          }
          touched = [];
          var connectorSegs = document.querySelectorAll('.skills-connector span');
          if (connectorSegs.length) { gsap.set(connectorSegs, { clearProps: 'transform' }); }
          var lines = document.querySelectorAll('.row-underline');
          if (lines.length) { gsap.set(lines, { clearProps: 'transform' }); }
          var titleLines = document.querySelectorAll('[data-title-line]');
          if (titleLines.length) { gsap.set(titleLines, { clearProps: 'opacity,transform' }); }
          var primaries = document.querySelectorAll('.section-contact .btn-primary');
          if (primaries.length) { gsap.set(primaries, { clearProps: 'boxShadow' }); }
          if (topnavInnerEl) { gsap.set(topnavInnerEl, { clearProps: 'minHeight,paddingTop,paddingBottom' }); }
        }

        function buildAll() {
          if (!motionOkNow()) { return; }

          /* hero title: two deliberate lines, brief and precise */
          var titleLines = document.querySelectorAll('[data-title-line]');
          if (titleLines.length) {
            track(titleLines);
            gsap.from(titleLines, { opacity: 0, y: 26, duration: 0.62, stagger: 0.12, ease: 'power3.out' });
          }

          /* work band: one coordinated group, 560 ms with a 90 ms stagger */
          var workItems = Array.prototype.slice.call(document.querySelectorAll('.work-grid [data-reveal]'));
          if (workItems.length) {
            track(workItems);
            gsap.set(workItems, { opacity: 0, y: 28 });
            triggers.push(ScrollTrigger.create({
              trigger: '.work-grid',
              start: 'top 84%',
              once: true,
              onEnter: function () {
                gsap.to(workItems, { opacity: 1, y: 0, duration: 0.56, stagger: 0.09, ease: 'power2.out' });
              }
            }));
          }

          /* everything else in the page: the same reveal, one element at a time */
          var heroTitleEl = document.querySelector('[data-hero-title]');
          revealItems.forEach(function (el) {
            if (el.closest && (el.closest('.section-contact') || el.closest('.work-grid'))) { return; }
            if (heroTitleEl && el === heroTitleEl) { return; }
            var delay = parseFloat(el.getAttribute('data-reveal-delay') || '0');
            track(el);
            gsap.set(el, { opacity: 0, y: 24 });
            var tween = gsap.to(el, {
              opacity: 1, y: 0, duration: 0.58, ease: 'power2.out', paused: true,
              delay: Math.min(0.2, (isNaN(delay) ? 0 : delay) / 1000)
            });
            triggers.push(ScrollTrigger.create({
              trigger: el,
              start: 'top 86%',
              once: true,
              onEnter: function () { tween.play(); }
            }));
          });

          /* skills connector: one per-group segment drawn across the band, then
             the tile content follows, so the connection is revealed first */
          var connectorSegs = Array.prototype.slice.call(document.querySelectorAll('.skills-connector span'));
          if (connectorSegs.length) {
            var vertical = window.matchMedia && window.matchMedia('(max-width: 920px)').matches;
            track(connectorSegs);
            gsap.set(connectorSegs, vertical
              ? { scaleY: 0, transformOrigin: 'top center' }
              : { scaleX: 0, transformOrigin: 'left center' });
            triggers.push(ScrollTrigger.create({
              trigger: '.skills-band',
              start: 'top 88%',
              once: true,
              onEnter: function () {
                /* the axis is re-read here, so a resize across the breakpoint
                   before the band enters still draws the correct direction */
                var verticalNow = window.matchMedia && window.matchMedia('(max-width: 920px)').matches;
                gsap.set(connectorSegs, verticalNow
                  ? { scaleY: 0, scaleX: 1, transformOrigin: 'top center' }
                  : { scaleX: 0, scaleY: 1, transformOrigin: 'left center' });
                var vars = { duration: 0.5, stagger: 0.07, ease: 'power2.out' };
                if (verticalNow) { vars.scaleY = 1; } else { vars.scaleX = 1; }
                gsap.to(connectorSegs, vars);
              }
            }));
          }

          /* blog: a hairline under each dated title, a short minimal stagger */
          var lines = Array.prototype.slice.call(document.querySelectorAll('.row-underline'));
          if (lines.length) {
            track(lines);
            gsap.set(lines, { scaleX: 0, transformOrigin: 'left center' });
            triggers.push(ScrollTrigger.create({
              trigger: '#blog',
              start: 'top 80%',
              once: true,
              onEnter: function () {
                gsap.to(lines, { scaleX: 1, duration: 0.42, stagger: 0.06, ease: 'power2.out' });
              }
            }));
          }

          /* contact: one closing sequence, statement then ledger */
          var contactCta = document.querySelector('.section-contact .tile-cta');
          var contactPanel = document.querySelector('.section-contact .contact-panel');
          if (contactCta && contactPanel) {
            track([contactCta, contactPanel]);
            track(contactCta.children);
            track(contactPanel.children);
            gsap.set([contactCta, contactPanel], { opacity: 0, y: 22 });
            gsap.set(contactCta.children, { opacity: 0, y: 16 });
            gsap.set(contactPanel.children, { opacity: 0, y: 14 });
            triggers.push(ScrollTrigger.create({
              trigger: '.section-contact',
              start: 'top 78%',
              once: true,
              onEnter: function () {
                var tl = gsap.timeline();
                tl.to([contactCta, contactPanel], { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
                  .to(contactCta.children, { opacity: 1, y: 0, duration: 0.48, stagger: 0.08, ease: 'power2.out' }, 0.12)
                  .to(contactPanel.children, { opacity: 1, y: 0, duration: 0.44, stagger: 0.06, ease: 'power2.out' }, 0.28);
              }
            }));
          }

          /* T25: the closing primary action answers once with a bounded
             lavender pulse. The colour is resolved from --lavender, the same
             token the scene reads, so no raw colour is introduced here, and the
             tween finishes itself after a few cycles instead of pulsing
             forever. The library-free path gets the same idea from the CSS
             contactPulse rule, which is disabled once gsap-ready is set. */
          var contactPrimary = document.querySelector('.section-contact .btn-primary');
          if (contactPrimary) {
            var lavender = resolveTokenRGB('--lavender', [0.769, 0.709, 0.992]);
            var lavenderRgb = 'rgba(' + Math.round(lavender[0] * 255) + ',' +
              Math.round(lavender[1] * 255) + ',' + Math.round(lavender[2] * 255);
            track(contactPrimary);
            triggers.push(ScrollTrigger.create({
              trigger: '.section-contact',
              start: 'top 78%',
              once: true,
              onEnter: function () {
                gsap.fromTo(contactPrimary,
                  { boxShadow: lavenderRgb + ',0)' },
                  {
                    boxShadow: lavenderRgb + ',0.30) 0 0 0 7px',
                    duration: 0.45,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 3,
                    onComplete: function () { gsap.set(contactPrimary, { clearProps: 'boxShadow' }); }
                  });
              }
            }));
          }

          /* hero → work: ScrollTrigger now reports the morph progress. The
             numeric start/end come from the same heroExitBounds helper the
             Canvas2D and WebGL ramps use, so the trigger and the fallback ramp
             agree on any viewport; functions let ScrollTrigger re-read the
             clamped geometry on every refresh. Nothing is pinned and no scroll
             position is taken from the reader */
          if (heroSectionEl) {
            triggers.push(ScrollTrigger.create({
              trigger: heroSectionEl,
              start: function () { return heroExitBounds(heroSectionEl).start; },
              end: function () {
                var bounds = heroExitBounds(heroSectionEl);
                return bounds.start + bounds.span;
              },
              invalidateOnRefresh: true,
              onUpdate: function (self) { scrollMorphProgress = self.progress; },
              onLeave: function () { scrollMorphProgress = 1; },
              onLeaveBack: function () { scrollMorphProgress = 0; }
            }));
          }
        }

        function motionOkNow() {
          return !document.documentElement.classList.contains('motion-off');
        }

        /* ── header: the page owns the state (see the single listener above);
           GSAP only refines the 80→64 geometry while motion is allowed ── */
        onCondensed(function (on) {
          if (!topnavEl || !topnavInnerEl) { return; }
          /* the CSS fallback only condenses above 861px, so GSAP matches that:
             the mobile header never shrinks under the library path */
          var target = (window.innerWidth || 1024) > 860 ? on : false;
          if (!motionOkNow()) {
            /* reduced or paused: the change is applied at once, never tweened */
            gsap.set(topnavInnerEl, {
              minHeight: target ? 64 : 80,
              paddingTop: target ? 6 : 14,
              paddingBottom: target ? 6 : 14
            });
            return;
          }
          gsap.to(topnavInnerEl, {
            minHeight: target ? 64 : 80,
            paddingTop: target ? 6 : 14,
            paddingBottom: target ? 6 : 14,
            duration: 0.42,
            ease: 'power2.out',
            overwrite: true
          });
        });
        /* a resize across the 861px breakpoint re-applies the state, so the
           GSAP path and the CSS path agree after the viewport changes */
        window.addEventListener('resize', function () { notifyCondensed(condensedState === true); });
        /* GSAP takes the geometry over from the CSS class and reconciles the
           state the page already decided before the library arrived */
        if (topnavEl) { topnavEl.classList.remove('is-condensed'); }
        notifyCondensed(condensedState === true);

        /* ── magnetic inner label: only the label moves, never the control ── */
        var magnets = Array.prototype.slice.call(document.querySelectorAll('[data-magnet]'));
        magnets.forEach(function (inner) {
          var host = inner.closest ? inner.closest('a, button') : null;
          if (!host) { return; }
          var moveX = gsap.quickTo(inner, 'x', { duration: 0.32, ease: 'power3.out' });
          var moveY = gsap.quickTo(inner, 'y', { duration: 0.32, ease: 'power3.out' });
          host.addEventListener('pointermove', function (event) {
            if (!motionOkNow()) { return; }
            var rect = host.getBoundingClientRect();
            if (!rect.width || !rect.height) { return; }
            moveX(((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 6);
            moveY(((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 4);
          });
          host.addEventListener('pointerleave', function () { moveX(0); moveY(0); });
        });

        buildAll();
        /* the engine owns the Pause wording only while it is the running
           visual; the Canvas2D fallback keeps its own control sync */
        if (webglHandle) { syncEnginePauseControl(); }

        /* safety net: whatever happens to a trigger, a reveal that is already
           on screen is never left at zero opacity */
        window.setTimeout(function () {
          if (!motionOkNow()) { return; }
          var viewportHeight = window.innerHeight || 0;
          var candidates = document.querySelectorAll('[data-reveal]');
          for (var c = 0; c < candidates.length; c += 1) {
            var node = candidates[c];
            var rect = node.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < viewportHeight && getComputedStyle(node).opacity === '0') {
              gsap.set(node, { clearProps: 'opacity,transform' });
            }
          }
          var sequences = document.querySelectorAll('.tile-cta, .contact-panel');
          for (var s = 0; s < sequences.length; s += 1) {
            if (getComputedStyle(sequences[s]).opacity === '0') {
              gsap.set(sequences[s], { clearProps: 'opacity,transform' });
              gsap.set(sequences[s].children, { clearProps: 'opacity,transform' });
            }
          }
        }, 2200);

        /* the pause switch governs the choreography live, in both directions */
        onMotionChange(function (allowed) {
          if (allowed) { buildAll(); } else { clearAll(); notifyCondensed(condensedState === true); }
        });

        return true;
      }

      /* ── progressive loader and the single engine decision ── */
      function decideEngine() {
        if (engineDecided || sceneLifetimeEnded) { return; }
        engineDecided = true;
        if (libraryTimeout) { window.clearTimeout(libraryTimeout); libraryTimeout = 0; }
        if (THREE && canUseWebGL()) {
          try { webglHandle = createSharedScene(THREE); } catch { webglHandle = null; }
        }
        if (webglHandle) {
          wireEnginePauseControl();
          onMotionChange(function (allowed) {
            webglHandle.setMotion(allowed);
            syncEnginePauseControl();
          });
          webglHandle.setMotion(!sharedMotionOff());
        } else {
          /* no library or no GL context: the original 2D smoke and sphere run,
             and the page keeps working without either */
          startCanvas2D();
          if (pauseButton && !smokeActive) {
            pauseButton.disabled = true;
            setPauseLabel(copy.unavailable);
            pauseButton.setAttribute('aria-label', copy.unavailableLabel);
          }
        }
      }

      /* A late chunk must never replace the already-started Canvas2D engine. */
      libraryTimeout = window.setTimeout(function () { decideEngine(); }, 4000);
      import('three').then(function (module) {
        THREE = module.WebGLRenderer ? module : module.default;
        decideEngine();
      }).catch(function () { decideEngine(); });

      /* Both modules must resolve before choreography starts; registration in
         bootGsap precedes every trigger. Failure leaves the CSS path active. */
      Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(function (modules) {
        if (sceneLifetimeEnded) { return; }
        gsap = modules[0].gsap || modules[0].default;
        ScrollTrigger = modules[1].ScrollTrigger || modules[1].default;
        try { bootGsap(); } catch { /* CSS motion stands in */ }
      }).catch(function () { /* CSS navigation, reveals and filters stand in */ });

    })();
