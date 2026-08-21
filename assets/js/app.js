/* ============================================================
   Chatoria — Interaktion
   Kein Framework, keine Abhaengigkeit, kein Scroll-Jacking.
   Alles was hier passiert, ist Zustandswechsel per Klasse;
   die Bewegung selbst liegt im Stylesheet. Ohne JavaScript
   ist die Seite vollstaendig lesbar — der Beobachter setzt
   nur Endzustaende, die im CSS ohnehin die Vorgabe sind.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Eintritt: .beobachten bekommt .ist-da ---------- */
  function beobachte(elemente, optionen, einmalig) {
    if (!('IntersectionObserver' in window)) {
      elemente.forEach(function (el) { el.classList.add('ist-da'); });
      return null;
    }
    var b = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('ist-da');
        if (einmalig !== false) b.unobserve(e.target);
      });
    }, optionen || { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    elemente.forEach(function (el) { b.observe(el); });
    return b;
  }

  if (REDUCED) {
    $$('.beobachten, .tritt-ein, .marker').forEach(function (el) { el.classList.add('ist-da'); });
  } else {
    beobachte($$('.beobachten'));
    beobachte($$('.tritt-ein'), { rootMargin: '0px 0px -8% 0px', threshold: 0.2 });
    var marker = $('#marker');
    if (marker) beobachte([marker], { threshold: 1 });
  }

  /* ---------- Kolumnentitel ---------- */
  var kolumne = $('#kolumne');
  var titelkopf = $('#titelkopf');
  var titelFeld = $('#kolumnentitel');
  var balken = $('#fortschritt');

  if (kolumne && titelkopf && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      kolumne.classList.toggle('ist-da', !e[0].isIntersecting);
    }, { threshold: 0 }).observe(titelkopf);
  }

  /* Der laufende Titel folgt der Sektion, die gerade gelesen wird.
     Quelle ist derselbe Beobachter-Mechanismus, kein Scroll-Listener. */
  var sektionen = $$('[data-kolumne]');
  if (titelFeld && sektionen.length && 'IntersectionObserver' in window) {
    var aktuell = '';
    var setzeTitel = function (text) {
      if (text === aktuell) return;
      aktuell = text;
      if (REDUCED) { titelFeld.innerHTML = '<span>' + text + '</span>'; return; }
      titelFeld.classList.add('wechselt');
      window.setTimeout(function () {
        titelFeld.innerHTML = '<span>' + text + '</span>';
        titelFeld.classList.remove('wechselt');
      }, 240);
    };
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) setzeTitel(e.target.getAttribute('data-kolumne'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sektionen.forEach(function (s) { beob.observe(s); });
  }

  /* Lesefortschritt — ein einziger passiver Listener, gedrosselt
     ueber requestAnimationFrame. */
  if (balken) {
    var laeuft = false;
    var messe = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
      balken.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      laeuft = false;
    };
    window.addEventListener('scroll', function () {
      if (laeuft) return;
      laeuft = true;
      window.requestAnimationFrame(messe);
    }, { passive: true });
    messe();
  }

  /* ---------- Inhaltsverzeichnis ---------- */
  var dialog = $('#verzeichnis');
  var auf = $('#verzeichnis-auf');
  var zu = $('#verzeichnis-zu');

  if (dialog && auf && typeof dialog.showModal === 'function') {
    var oeffne = function () {
      dialog.showModal();
      document.body.classList.add('is-locked');
    };
    var schliesse = function () {
      dialog.close();
    };
    auf.addEventListener('click', oeffne);
    if (zu) zu.addEventListener('click', schliesse);
    /* Fokus zurueck auf den Ausloeser, egal wie geschlossen wurde. */
    dialog.addEventListener('close', function () {
      document.body.classList.remove('is-locked');
      auf.focus();
    });
    /* Klick auf den Hintergrund schliesst. */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) schliesse();
    });
    $$('a', dialog).forEach(function (a) {
      a.addEventListener('click', schliesse);
    });
  } else if (auf) {
    /* Ohne <dialog>-Unterstuetzung fuehrt der Knopf zum Seitenanfang
       statt ins Leere. */
    auf.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Selbstcheck ---------- */
  var check = $('#check');
  var ergebnis = $('#check-ergebnis');

  if (check && ergebnis) {
    var kaesten = $$('input[type="checkbox"]', check);
    var texte = [
      'Noch nichts angekreuzt. Die Liste allein ist schon eine Bestandsaufnahme.',
      'Ein Punkt. Das ist normal und schnell behoben.',
      'Zwei Punkte. Meistens hängt das zusammen – und lässt sich zusammen lösen.',
      'Drei Punkte. Ab hier lohnt sich ein Plan mehr als ein weiterer Versuch nebenbei.',
      'Vier Punkte. Der Kanal läuft nebenher mit, statt für Sie zu arbeiten.',
      'Fünf Punkte. Das ist kein Motivationsproblem, sondern ein Zuständigkeitsproblem.',
      'Sechs Punkte. Damit sind Sie in guter Gesellschaft – genau hier fangen wir üblicherweise an.'
    ];
    var werte = function () {
      var n = kaesten.filter(function (k) { return k.checked; }).length;
      ergebnis.textContent = texte[n];
    };
    kaesten.forEach(function (k) { k.addEventListener('change', werte); });
  }
})();
