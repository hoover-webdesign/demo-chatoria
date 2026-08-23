/* ============================================================
   Chatoria — Interaktion
   Zwei Aufgaben: Eintrittsbewegung und Einwilligungsverwaltung.
   Kein Framework, keine externe Abhaengigkeit. Ohne JavaScript
   bleibt die Seite vollstaendig lesbar und bedienbar.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Eintrittsbewegung ---------- */
  var zuBeobachten = $$('.auf');
  if (REDUCED || !('IntersectionObserver' in window)) {
    zuBeobachten.forEach(function (el) { el.classList.add('da'); });
  } else {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('da');
        beob.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    zuBeobachten.forEach(function (el) { beob.observe(el); });
  }

  /* ============================================================
     Einwilligung
     Gespeichert wird ausschliesslich die Entscheidung selbst, und
     zwar im localStorage statt in einem Cookie. Das ist fuer den
     Betrieb der Seite erforderlich und damit nach § 25 Abs. 2
     TDDDG einwilligungsfrei. Es werden keine Daten uebertragen.
     ============================================================ */
  var SCHLUESSEL = 'chatoria.einwilligung';
  var banner = $('#consent');
  var jaKnopf = $('#consent-ja');
  var neinKnopf = $('#consent-nein');
  var neuKnopf = $('#consent-neu');

  function lies() {
    try {
      var w = window.localStorage.getItem(SCHLUESSEL);
      return w === 'ja' || w === 'nein' ? w : null;
    } catch (e) {
      /* Privater Modus oder gesperrter Speicher: dann gilt keine
         Einwilligung — externe Inhalte bleiben blockiert. */
      return null;
    }
  }

  function schreib(wert) {
    try { window.localStorage.setItem(SCHLUESSEL, wert); } catch (e) {}
  }

  function zeige(sichtbar) {
    if (!banner) return;
    if (sichtbar) {
      banner.hidden = false;
      /* Erst im naechsten Frame einblenden, damit die Bewegung greift. */
      window.requestAnimationFrame(function () {
        banner.setAttribute('data-offen', 'true');
      });
    } else {
      banner.setAttribute('data-offen', 'false');
      window.setTimeout(function () { banner.hidden = true; }, REDUCED ? 0 : 450);
    }
  }

  /* Externe Inhalte werden erst nach Einwilligung geladen: Platzhalter
     tragen die Zieladresse in data-src, nie im src-Attribut. Ohne
     Zustimmung wird nichts angefordert (Zwei-Klick-Prinzip). */
  function externeInhalteFreigeben() {
    $$('[data-extern]').forEach(function (halter) {
      var ziel = halter.getAttribute('data-extern');
      if (!ziel || halter.getAttribute('data-geladen') === 'ja') return;
      /* Nur https-Adressen zulassen — schuetzt davor, dass ueber ein
         manipuliertes Attribut javascript: oder data: eingeschleust wird. */
      if (ziel.slice(0, 8) !== 'https://') return;
      var rahmen = document.createElement('iframe');
      rahmen.src = ziel;
      rahmen.loading = 'lazy';
      rahmen.referrerPolicy = 'no-referrer';
      rahmen.title = halter.getAttribute('data-titel') || 'Externer Inhalt';
      rahmen.style.width = '100%';
      rahmen.style.border = '0';
      rahmen.style.height = halter.getAttribute('data-hoehe') || '420px';
      halter.textContent = '';
      halter.appendChild(rahmen);
      halter.setAttribute('data-geladen', 'ja');
    });
  }

  function anwenden(wert) {
    document.documentElement.setAttribute('data-einwilligung', wert);
    if (wert === 'ja') externeInhalteFreigeben();
  }

  if (banner && jaKnopf && neinKnopf) {
    var bisher = lies();
    if (bisher) {
      anwenden(bisher);
    } else {
      zeige(true);
    }

    jaKnopf.addEventListener('click', function () {
      schreib('ja'); anwenden('ja'); zeige(false);
    });
    neinKnopf.addEventListener('click', function () {
      schreib('nein'); anwenden('nein'); zeige(false);
    });
  }

  /* Widerruf und nachtraegliche Aenderung ueber den Fussbereich */
  if (neuKnopf) {
    neuKnopf.addEventListener('click', function () {
      zeige(true);
      if (neinKnopf) neinKnopf.focus();
    });
  }
})();
