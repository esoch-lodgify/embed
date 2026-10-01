/*!
 * ==========================================================================
 * LODGIFY — Tag der Deutschen Einheit 2026
 * Geo + language targeted TOP BAR and EXIT-INTENT POPUP (German)
 * ==========================================================================
 * One self-contained file, same behaviour as the US / Canada script.
 *
 *   <script src="https://YOUR-CDN/einheit-2026.js" defer></script>
 *
 * ARTWORK
 *   The photo is wired to the Webflow CDN URL in CONFIG.photoUrl. The -50%
 *   tag is inlined, so that one file is the only external asset.
 *   It is served as AVIF, which every current browser reads but Safari below
 *   16.4 and Edge below 121 do not. Those visitors get the panel with no
 *   photo behind it — readable, not as intended. If that matters, upload a
 *   JPG alongside it and swap CONFIG.photoUrl for CONFIG.photoSet, which
 *   is commented out directly beneath it.
 *
 * >> ONE THING TO DECIDE BEFORE THIS GOES LIVE <<
 *
 *   CONFIG.requireGermanPage — currently TRUE, so the banner only shows
 *      on the German site. Everything here is German and the CTA lands on
 *      /de/tag-der-deutschen-einheit-promo/, so a German visitor reading the
 *      English site sees nothing. Set it to false if you want reach over
 *      language match. See CONFIG.lang for how a German page is recognised.
 *
 * WHO SEES WHAT
 *   Germany, German pages   -> bar + popup
 *   Everywhere else         -> nothing renders at all
 *   Austria and Switzerland are NOT included. Add 'AT','CH' to
 *   CONFIG.countries if this campaign is meant to cover them — the holiday
 *   is German, but "Support auf Deutsch" is not, so that is a content call.
 *
 * QA HELPERS (query string, no code changes needed)
 *   ?ldgeo=DE      force a country
 *   ?ldlang=de     force the page language
 *   ?ldexit=1      open the popup immediately, skip the exit trigger
 *   ?ldreset=1     clear the dismissed flags and the cached country
 *
 * COPY AND DATES
 *   CONFIG.deadline drives the countdown and the auto-hide. The visible
 *   strings ("Endet am Montag, 5. Oktober / 23:59 Uhr MESZ") are plain text
 *   in MARKUP. Change both together or they will disagree.
 * ==========================================================================
 */

(function () {
  'use strict';

  /* =====================================================================
     1 · CONFIG
     ===================================================================== */
  var CONFIG = {
    // Hosted on Webflow's CDN. AVIF — see the note in the header.
    photoUrl: 'https://cdn.prod.website-files.com/6a0183d56ceb2deec6fd2e8c/6aba3800883d8825ca407678_einheit-2026-photo.avif',

    // Optional AVIF + JPG fallback. Upload a JPG, uncomment this, and the
    // browser picks whichever it can decode. Leave null to use photoUrl.
    photoSet: null,
    // photoSet: 'image-set(url("...einheit-2026-photo.avif") type("image/avif"),'
    //         + ' url("...einheit-2026-photo.jpg") type("image/jpeg"))',

    // Offer deadline. ISO 8601 with an explicit offset, so it is the same
    // instant for everyone regardless of their local clock.
    // 23:59:59 Uhr MESZ on 5 October 2026 (MESZ = UTC+2).
    deadline: '2026-10-05T23:59:59+02:00',

    // Countries that get the campaign. Anything else sees nothing.
    countries: ['DE'],

    // Only show on German-language pages. See the header note.
    requireGermanPage: true,

    // How a German page is recognised: URL path, then hostname, then <html lang>.
    // The CTA in this campaign points at lodgify.com/de/..., so the path rule
    // matches the site as it is built today.
    lang: {
      dePath: /^\/de(\/|$)/i,
      deHost: /^de\./i,
      useHtmlLang: true
    },

    // --- geo ---
    geoKey: 'geo_country',   // shared with the snippet already on the site
    geoTTL: 864e5,           // 24h
    geoEndpoint: 'https://www.cloudflare.com/cdn-cgi/trace',
    geoTimeout: 2500,
    setHtmlAttr: true,       // mirror onto <html data-country="..">

    // --- top bar ---
    showBar: true,
    // 'push'   bar sits in normal flow AND anything pinned to the top of the
    //          viewport (a fixed or sticky navbar) is offset by its height,
    //          so the nav moves down instead of covering the bar.
    // 'flow'   bar in normal flow, nothing else touched.
    // 'sticky' / 'fixed'  bar pinned itself; the page is not offset.
    barMode: 'push',

    // lodgify.com's <body> carries 5px of padding, which insets the bar and
    // shunts the nav around. The bar pulls itself out by this much on top,
    // left and right, and gives it back as bottom margin so everything below
    // keeps its original position. Set to 0 if the body padding ever goes.
    barBleed: 5,

    // Leave empty to auto-detect what is pinned to the top. If the nav is
    // missed or the wrong thing moves, put the nav's selector here, e.g.
    // fixedHeaderSelector: '.navbar_component',
    fixedHeaderSelector: '',
    barDismissDays: 7,       // the German set's own choice

    // --- exit popup ---
    showPopup: true,
    armDelay: 3000,          // don't arm the trigger for the first N ms
    exitMargin: 8,           // cursor Y at or below this counts as leaving
    mobileTrigger: 'scrollUp', // 'scrollUp' | 'timeout' | 'none'
    mobileTimeout: 25000,
    scrollUpVelocity: 900,   // px/sec upward flick that counts as an exit
    lockScroll: true,

    // Popup stays closed for the rest of the browser session (sessionStorage).
    // The bar uses barDismissDays instead. Different mechanisms on purpose.
    popupSessionKey: 'ldg_einheit_de_popup_closed',
    barKey: 'ldg_einheit_de_bar_until',

    loadFonts: false,        // true injects the Jost + Inter stylesheet

    // Visual tweaks go here, not in the CSS blob below. Appended last, so
    // these rules win. Scope them to #ldgDeModal or #ldgDeBar.
    extraCSS: ''
  };

  /* =====================================================================
     2 · ARTWORK
     The -50% tag is inlined (small). The photo is hosted — see CONFIG.
     ===================================================================== */
  var TAG = 'data:image/png;base64,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';

  /* =====================================================================
     3 · MARKUP  (verbatim from the design file)
     ===================================================================== */
  var BAR   = `<div class="ldg ldg-bar" id="ldgDeBar" data-ldg-countdown role="region" aria-label="Einheitlich sparen: 50 % Rabatt" lang="de">
  <div class="ldg-bar__in">
    <span class="ldg-bar__tag">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21.5 9l-5 4.7 1.4 7L12 17.3 6.1 20.7l1.4-7L2.5 9l6.9-.4z"/></svg>
      Zeitlich begrenzt
    </span>

    <p class="ldg-bar__msg"><strong>Einheitlich sparen: 50 % Rabatt</strong> — <span class="ldg-code">EINHEIT26</span></p>

    <a class="ldg-bar__cta" href="https://www.lodgify.com/de/tag-der-deutschen-einheit-promo/">
      <span>50 % Rabatt sichern</span>
      <span class="ldg-bar__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
      </span>
    </a>

    <div class="ldg-count">
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">07</span><span class="ldg-count__lab">Tage</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">14</span><span class="ldg-count__lab">Std.</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">51</span><span class="ldg-count__lab">Min.</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">04</span><span class="ldg-count__lab">Sek.</span></div>
    </div>
  </div>

  <button class="ldg-bar__close" type="button" data-ldg-dismiss="bar" aria-label="Angebot ausblenden">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>`;
  var MODAL = `<div class="ldg-overlay ldg-hide" id="ldgDeModal" role="dialog" aria-modal="true" aria-label="Einheitlich sparen: 50 % Rabatt">
<!-- .ldg-modal__frame is the CSS container the breakpoints query, and
     data-ldg-popup is what the Custom CSS and the behaviour key off.
     Remove neither. -->
<div class="ldg ldg-modal__frame" data-ldg-popup lang="de">
  <div class="ldg-modal__box ldg-modal--panel">
    <div class="ldg-modal__bg" aria-hidden="true"></div>
    <div class="ldg-modal__panel" aria-hidden="true"></div>
    <div class="ldg-modal__scrim" aria-hidden="true"></div>

    <button class="ldg-modal__close" type="button" data-ldg-dismiss="modal" aria-label="Schließen">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>

    <div class="ldg-modal__logo"><svg viewBox="0 0 71 19" fill="currentColor" role="img" aria-label="Lodgify"><path d="M61.4287 18.6361H65.2264L70.9221 5.08969H66.4792L65.3642 10.4143C65.2859 10.8246 64.8161 10.845 64.719 10.3955L63.5444 5.08969H59.0624C57.2035 5.08969 56.6162 4.52278 56.6162 3.68024C56.6162 2.8377 57.1048 2.34909 57.927 2.34909C58.8854 2.34909 59.3756 3.11333 59.4727 3.876H63.2312C62.6643 1.38909 60.8242 0 58.1807 0C55.2647 0 53.4434 1.70387 53.4434 4.30666V5.08969H51.3292V8.26097H53.4434V15.0733H57.2802V8.27976H61.2141L60.0208 6.73249L62.8006 14.1525C62.9572 14.544 62.9368 14.9747 62.7818 15.3865L61.4318 18.6361H61.4287ZM48.5275 4.58072C49.76 4.58072 50.6417 3.81649 50.6417 2.72025C50.6417 1.624 49.7615 0.859767 48.5275 0.859767C47.2934 0.859767 46.4133 1.624 46.4133 2.72025C46.4133 3.81649 47.2934 4.58072 48.5275 4.58072ZM46.6091 15.0733H50.4459V5.08969H46.6091V15.0733ZM40.0316 12.0587C38.8774 12.0587 38.0349 11.2365 38.0349 10.0823C38.0349 8.92811 38.8759 8.10436 40.0316 8.10436C41.1874 8.10436 42.0283 8.92654 42.0283 10.0823C42.0283 11.238 41.1874 12.0587 40.0316 12.0587ZM35.2363 18.6361H39.8954C43.3016 18.6361 45.7477 16.3841 45.7477 13.2144V5.08969H41.9109V5.5783C41.9109 5.73491 41.7355 5.73491 41.5789 5.65661C40.6393 5.18679 39.9549 4.93309 38.9949 4.93309C36.1368 4.93309 34.552 7.26338 34.552 10.0228C34.552 13.0766 36.3138 14.6818 38.702 14.6818C39.7983 14.6818 40.6205 14.3498 41.6384 13.761C41.8921 13.6044 42.0879 13.7422 41.9908 13.9771C41.5601 14.9559 40.6408 15.4648 39.1719 15.4648H35.2379V18.6361H35.2363ZM28.0904 12.0587C26.9362 12.0587 26.0937 11.2365 26.0937 10.0823C26.0937 8.92811 26.9347 8.10436 28.0904 8.10436C29.2462 8.10436 30.0871 8.92654 30.0871 10.0823C30.0871 11.238 29.2462 12.0587 28.0904 12.0587ZM27.0145 15.2299C28.0513 15.2299 28.698 14.8979 29.6768 14.2903C29.8522 14.1728 30.0683 14.212 29.9697 14.4657L29.716 15.0733H33.8065V1.3703H29.9697V5.57987C29.9697 5.73648 29.7943 5.73648 29.6377 5.65817C28.7763 5.20715 28.1108 4.93465 27.132 4.93465C24.4509 4.93465 22.6108 6.95174 22.6108 10.0447C22.6108 13.1377 24.4697 15.2315 27.0145 15.2315V15.2299ZM16.4233 12.0587C15.2691 12.0587 14.4265 11.2365 14.4265 10.0823C14.4265 8.92811 15.2675 8.10436 16.4233 8.10436C17.579 8.10436 18.42 8.92654 18.42 10.0823C18.42 11.238 17.579 12.0587 16.4233 12.0587ZM16.4233 15.2299C19.6525 15.2299 21.9045 13.1158 21.9045 10.0807C21.9045 7.0457 19.6541 4.93152 16.4233 4.93152C13.1925 4.93152 10.9421 7.0457 10.9421 10.0807C10.9421 13.1158 13.1925 15.2299 16.4233 15.2299ZM2.48534 15.0733H10.0807V7.77079L2.6623 12.2732C2.38824 12.4486 2.05624 12.1761 2.19248 11.8629L6.46 1.3703H0V12.588C0 14.0366 1.03673 15.0749 2.48534 15.0749V15.0733Z"/></svg></div>

    <div class="ldg-modal__tag">
      <div class="ldg-tag" role="img" aria-label="-50 % – 3. Oktober Sale"></div>
    </div>

    <div class="ldg-modal__in">
      <h2 class="ldg-modal__h">Einheitlich sparen:<br>50&nbsp;% Rabatt</h2>

      <p class="ldg-modal__sub">Weniger Aufwand, mehr Buchungen: Starten Sie jetzt zum Aktionspreis.</p>

      <div class="ldg-modal__row">
        <div class="ldg-swap">
          <a class="ldg-btn" href="https://www.lodgify.com/de/tag-der-deutschen-einheit-promo/">50 % Rabatt sichern</a>
          <a class="ldg-round" href="https://www.lodgify.com/de/tag-der-deutschen-einheit-promo/" aria-label="50 % Rabatt sichern">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="ldg-coupon">
          <span class="ldg-coupon__label">Code</span>
          <button class="ldg-coupon__code" type="button" data-ldg-copy="EINHEIT26"
            data-ldg-copied="Kopiert!" data-ldg-copy-fail="Kopieren fehlgeschlagen" aria-label="Code EINHEIT26 kopieren">
            <span data-ldg-copy-label>EINHEIT26</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0012.5 3H5.5A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15"/></svg>
          </button>
        </div>
      </div>

      <p class="ldg-modal__fine">Geben Sie beim Bezahlen den Code <b class="ldg-code">EINHEIT26</b> ein. Gilt nur für Jahresabos von Professional und Ultimate. Es gelten die <a href="https://589108.fs1.hubspotusercontent-na1.net/hubfs/589108/Promos/New_Customers_Promo_TC.pdf" target="_blank" rel="noopener">AGB</a>.</p>
    </div>

    <div class="ldg-timer">
      <span class="ldg-timer__lab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
        Angebot endet in
      </span>
      <div class="ldg-count">
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">07</span><span class="ldg-count__lab">Tage</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">14</span><span class="ldg-count__lab">Std.</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">51</span><span class="ldg-count__lab">Min.</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">04</span><span class="ldg-count__lab">Sek.</span></div>
      </div>
      <span class="ldg-timer__rule" aria-hidden="true"></span>
      <p class="ldg-timer__ends">Endet am <b>Montag, 5. Oktober</b><br class="ldg-brk"> 23:59 Uhr MESZ</p>
      <div class="ldg-timer__stack">
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21.5 9l-5 4.7 1.4 7L12 17.3 6.1 20.7l1.4-7L2.5 9l6.9-.4z"/></svg></span>
          <span><b>4,7/5</b> bei über 4.000 Bewertungen</span>
        </span>
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16.2 9"/></svg></span>
          <span>Support auf <b>Deutsch</b></span>
        </span>
      </div>
    </div>
  </div>
</div>
</div>`;

  /* =====================================================================
     4 · STYLES
     ===================================================================== */
  var CSS = `
/* ---------- scoped reset, emitted BEFORE the component CSS ----------------
   Two passes, deliberately at different strengths.

   1. :where(...) at zero specificity for box model and layout leftovers.
   2. Exactly ONE class of specificity for everything inherited, with the tag
      list inside :where() so the tags add nothing. That calibration is the
      whole point: it outranks the host site's bare h2/p/a/button rules
      (0,0,1), and loses to every component rule, which carry at least one
      class and come later in the file.

   Pass 2 is what keeps .ldg-modal__h white. The heading sets no colour of its
   own -- it inherits from .ldg-modal__box -- so lodgify.com's global h2 rule
   was winning and turning it dark. */
:where(#ldgDeBar,#ldgDeBar *,#ldgDeModal,#ldgDeModal *){
  box-sizing:border-box;min-width:0;outline:0;box-shadow:none;float:none;
  list-style:none;vertical-align:baseline;
}
.ldg-bar :where(h1,h2,h3,h4,h5,h6,p,a,b,i,em,strong,small,span,div,button,ul,ol,li,svg,img,figure),
.ldg-modal__frame :where(h1,h2,h3,h4,h5,h6,p,a,b,i,em,strong,small,span,div,button,ul,ol,li,svg,img,figure){
  margin:0;padding:0;border:0;background:none;border-radius:0;
  font-family:inherit;font-size:inherit;font-weight:inherit;font-style:inherit;
  line-height:inherit;letter-spacing:inherit;text-transform:none;
  color:inherit;text-align:left;text-decoration:none;
}
:where(#ldgDeBar button,#ldgDeModal button){cursor:pointer}
:where(#ldgDeBar svg,#ldgDeModal svg){display:block;flex:0 0 auto}


/* LODGIFY EXIT POPUP - locked design. Tokens and the two injection
   points are the only things meant to change. */
/* On the popup root, never :root -- see the skill. */
.ldg,[data-ldg-popup]{
  --ldg-yellow:#FFF65B;
  --ldg-yellow-deep:#F2E627;
  --ldg-ink:#141313;
  --ldg-white:#FFFFFF;
  --ldg-display:"RL Aqva","ITC Avant Garde Gothic",Jost,"Helvetica Neue",Arial,sans-serif;
  --ldg-body:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --ldg-photo:url("__PHOTO__");
  --ldg-tagimg:url("__TAG__");
  --ldg-panel-ar:1672 / 941;
}

/* Reflows on THIS box, not the viewport. Do not swap for media queries. */
.ldg-modal__frame{display:block;width:100%;container-type:inline-size}

.ldg *,.ldg *::before,.ldg *::after{box-sizing:border-box}
.ldg{font-family:var(--ldg-body);letter-spacing:-.2px;-webkit-font-smoothing:antialiased}
.ldg-hide{display:none !important}
.ldg :focus-visible{outline:3px solid var(--ldg-yellow);outline-offset:3px;border-radius:6px}

.ldg-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  padding:17px 30px;border:0;border-radius:999px;cursor:pointer;white-space:nowrap;
  font-family:var(--ldg-body);font-size:17px;font-weight:600;letter-spacing:-.2px;
  text-decoration:none;color:var(--ldg-ink);background:var(--ldg-yellow);
}
.ldg-round{
  border-radius:50%;background:var(--ldg-yellow);color:var(--ldg-ink);
  display:grid;place-items:center;flex:0 0 auto;text-decoration:none;
}
.ldg-round svg{width:20px;height:20px}

/* --ldg-rs (the arrow diameter) is the only number in the swap. */
.ldg-swap{
  --ldg-rs:58px;
  position:relative;display:inline-flex;align-items:center;
  padding-right:var(--ldg-rs);
}
.ldg-swap .ldg-btn{position:relative;z-index:2}
.ldg-swap .ldg-round{
  position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:1;
  width:var(--ldg-rs);height:var(--ldg-rs);
}
@media (hover:hover) and (pointer:fine){
  .ldg-swap .ldg-btn{
    transition:transform .42s cubic-bezier(.62,.04,.31,1),background-color .2s ease,box-shadow .2s ease;
  }
  .ldg-swap .ldg-round{
    transition:right .42s cubic-bezier(.62,.04,.31,1),background-color .2s ease,box-shadow .2s ease;
  }
  .ldg-swap:hover .ldg-btn,.ldg-swap:focus-within .ldg-btn{transform:translateX(var(--ldg-rs))}
  .ldg-swap:hover .ldg-round,.ldg-swap:focus-within .ldg-round{right:calc(100% - var(--ldg-rs))}
  .ldg-swap:hover .ldg-btn,.ldg-swap:hover .ldg-round{
    background:var(--ldg-yellow-deep);box-shadow:0 12px 26px rgba(0,0,0,.3);
  }
}

.ldg-coupon{
  display:inline-flex;align-items:stretch;border-radius:14px;overflow:hidden;
  background:rgba(255,255,255,.1);backdrop-filter:blur(6px);
  box-shadow:inset 0 0 0 1.5px rgba(255,246,91,.5);
}
.ldg-coupon__label{
  display:flex;align-items:center;padding:0 14px;font-size:10px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);
}
.ldg-coupon__code{
  display:flex;align-items:center;justify-content:center;gap:9px;padding:13px 17px;cursor:pointer;
  border:0;border-left:1.5px dashed rgba(255,246,91,.5);background:transparent;
  font-family:var(--ldg-display);font-size:19px;font-weight:700;letter-spacing:.06em;
  color:var(--ldg-yellow);transition:background-color .18s ease,transform .18s ease;
}
.ldg-coupon__code:hover{background:rgba(255,246,91,.14)}
.ldg-coupon__code svg{width:14px;height:14px;opacity:.75}

.ldg-coupon__code.is-copied{background:rgba(255,246,91,.22)}
.ldg-coupon__code.is-copied [data-ldg-copy-label]{animation:ldgPop .42s cubic-bezier(.2,1.5,.35,1)}
@keyframes ldgPop{
  0%{transform:scale(.82);opacity:.35}
  55%{transform:scale(1.06);opacity:1}
  100%{transform:scale(1);opacity:1}
}

/* Artwork, not CSS. drop-shadow so it follows the silhouette. */
.ldg-tag{
  display:block;width:226px;aspect-ratio:572 / 262;
  background:var(--ldg-tagimg) no-repeat center/contain;
  filter:drop-shadow(0 14px 26px rgba(0,0,0,.30));
}

.ldg-count{display:flex;align-items:flex-start;gap:8px}
.ldg-count__unit{display:flex;flex-direction:column;align-items:center;min-width:56px;
  padding:9px 8px 8px;border-radius:14px;background:rgba(255,246,91,.13);
  box-shadow:inset 0 0 0 1px rgba(255,246,91,.24)}
.ldg-count__num{font-family:var(--ldg-display);font-size:27px;font-weight:700;line-height:1;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--ldg-yellow)}
.ldg-count__lab{margin-top:5px;font-size:9px;font-weight:600;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(255,255,255,.68)}

.ldg-timer{
  position:absolute;z-index:5;display:flex;align-items:center;gap:20px;
  padding:15px 30px 15px 24px;border-radius:20px;
  background:rgba(14,16,12,.62);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.14);
}
.ldg-timer__lab{display:flex;align-items:center;gap:10px;flex:0 0 auto;
  font-family:var(--ldg-display);font-size:12px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ldg-white)}
.ldg-timer__lab svg{width:20px;height:20px;flex:0 0 auto}
.ldg-timer__rule{width:1px;height:34px;background:rgba(255,255,255,.16);flex:0 0 auto}
.ldg-timer__ends{margin:0;font-size:13px;line-height:1.35;color:rgba(255,255,255,.7);flex:0 0 auto}
.ldg-timer__ends b{color:var(--ldg-white);font-weight:600}
.ldg-timer__stack{display:flex;flex-direction:column;gap:8px;margin-left:auto;flex:0 0 auto}
.ldg-chip{display:flex;align-items:center;gap:10px;white-space:nowrap;
  font-size:13.5px;line-height:1.2;color:rgba(255,255,255,.75)}
.ldg-chip__ico{width:22px;display:flex;justify-content:center;flex:0 0 auto}
.ldg-chip__ico svg{width:20px;height:20px;color:var(--ldg-yellow)}
.ldg-chip b{color:var(--ldg-white);font-weight:600}

/* width:100% + max-width, never vw -- see the skill. */
.ldg-modal__box{
  position:relative;width:100%;max-width:980px;
  margin-inline:auto;min-height:548px;overflow:hidden;
  border-radius:28px;background:#1B1D16;color:var(--ldg-white);
  box-shadow:0 40px 90px rgba(0,0,0,.5);isolation:isolate;
}
.ldg-modal__bg{
  position:absolute;inset:0;z-index:0;
  background-image:var(--ldg-photo);background-size:cover;background-position:60% 50%;
}

.ldg-modal--panel .ldg-modal__bg{filter:blur(12px) brightness(.72) saturate(1.05);transform:scale(1.24)}
.ldg-modal__panel{
  position:absolute;top:0;bottom:0;right:0;left:auto;width:auto;
  aspect-ratio:var(--ldg-panel-ar,3 / 2);z-index:1;pointer-events:none;display:none;
  background-image:var(--ldg-photo);background-repeat:no-repeat;
  background-size:cover;background-position:center;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.55) 9%,#000 22%);
  mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.55) 9%,#000 22%);
}
.ldg-modal--panel .ldg-modal__panel{display:block}
.ldg-modal__scrim{
  position:absolute;inset:0;z-index:2;
  background:
    linear-gradient(96deg,rgba(10,12,8,.9) 0%,rgba(10,12,8,.76) 30%,rgba(10,12,8,.42) 55%,rgba(10,12,8,.08) 80%,rgba(10,12,8,0) 100%),
    linear-gradient(180deg,rgba(10,12,8,0) 55%,rgba(10,12,8,.55) 100%);
}

.ldg-modal--panel .ldg-modal__scrim{
  background:
    linear-gradient(96deg,rgba(10,12,8,.6) 0%,rgba(10,12,8,.46) 34%,rgba(10,12,8,.22) 60%,rgba(10,12,8,0) 84%),
    linear-gradient(180deg,rgba(10,12,8,0) 55%,rgba(10,12,8,.5) 100%);
}
.ldg-modal__logo{position:absolute;z-index:5;top:34px;left:44px}
.ldg-modal__logo svg{height:28px;width:auto;color:var(--ldg-yellow)}
.ldg-modal__tag{position:absolute;z-index:5;top:66px;right:36px;transform:scale(.8);
  transform-origin:top right}
.ldg-modal__in{position:relative;z-index:4;max-width:600px;padding:104px 0 0 44px}
.ldg-modal__h{font-family:var(--ldg-display);font-weight:700;text-transform:uppercase;
  font-size:clamp(32px,3.7vw,47px);line-height:1.0;letter-spacing:-.02em;margin:0;
  text-shadow:0 2px 18px rgba(0,0,0,.35)}
.ldg-modal__sub{margin:16px 0 0;max-width:33ch;font-size:16px;line-height:1.5;
  color:rgba(255,255,255,.84);text-shadow:0 1px 12px rgba(0,0,0,.4)}
.ldg-modal__sub b{color:var(--ldg-white);font-weight:600}
.ldg-modal__row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:26px}

.ldg-code{color:var(--ldg-yellow);font-weight:700;letter-spacing:.02em}
.ldg-modal__fine{margin:16px 0 0;max-width:none;font-size:12px;line-height:1.6;
  color:rgba(255,255,255,.62);text-shadow:0 1px 10px rgba(0,0,0,.45)}
.ldg-modal__fine a{color:rgba(255,255,255,.78)}
.ldg-modal__close{
  position:absolute;top:18px;right:18px;z-index:6;
  width:34px;height:34px;border:0;border-radius:50%;cursor:pointer;
  background:rgba(255,255,255,.16);color:var(--ldg-white);display:grid;place-items:center;
  backdrop-filter:blur(6px);
}
.ldg-modal__close:hover{background:rgba(255,255,255,.3)}
.ldg-modal__close svg{width:14px;height:14px}
.ldg-modal__box .ldg-timer{left:20px;right:20px;bottom:18px}
.ldg-modal__box .ldg-timer__stack{padding-left:20px;border-left:1px solid rgba(255,255,255,.16)}

/* Locale relief goes HERE, ahead of the breakpoints. */
/* de runs longer than English: the only design difference */
.ldg-modal__h{font-size:clamp(30px,3.2vw,40px)}
.ldg-modal__sub{max-width:40ch}
.ldg-timer{gap:16px;padding:15px 22px 15px 20px}
.ldg-modal__box .ldg-timer{left:16px;right:16px;bottom:18px}

@container (max-width:900px){
  .ldg-modal__box{min-height:0}
  .ldg-modal__logo{top:24px;left:24px}
  .ldg-modal__tag{top:62px;right:16px;transform:scale(.66);transform-origin:top right}
  .ldg-modal__in{max-width:none;padding:100px 24px 0}
  .ldg-modal__box .ldg-timer{position:relative;left:auto;right:auto;bottom:auto;
    margin:24px 16px 16px;flex-wrap:wrap;gap:14px 20px}
  .ldg-modal__box .ldg-timer__rule{display:none}
  .ldg-modal__box .ldg-timer__stack{margin-left:0;padding-left:0;border-left:0}
}
@container (max-width:720px){
  .ldg-modal__box{border-radius:20px}
  .ldg-modal__bg{background-position:88% 50%}

  .ldg-modal--panel .ldg-modal__bg{filter:none;transform:none}
  .ldg-modal--panel .ldg-modal__panel{display:none}
  .ldg-modal__scrim,.ldg-modal--panel .ldg-modal__scrim{
    background:
      linear-gradient(180deg,rgba(10,12,8,.76) 0%,rgba(10,12,8,.62) 44%,rgba(10,12,8,.8) 100%),
      linear-gradient(96deg,rgba(10,12,8,.42) 0%,rgba(10,12,8,.06) 100%);
  }
  .ldg-modal__logo{top:18px;left:18px}
  .ldg-modal__logo svg{height:23px}
  .ldg-modal__tag{top:14px;right:56px;transform:scale(.5)}
  .ldg-modal__in{padding:78px 18px 0}
  .ldg-modal__h{font-size:29px;line-height:1.05}
  .ldg-modal__sub{margin-top:11px;font-size:13px;line-height:1.45;max-width:none}
  .ldg-modal__row{margin-top:18px;gap:10px;flex-direction:column;align-items:stretch}
  .ldg-modal__fine{margin-top:13px;font-size:11px;max-width:none}
  .ldg-modal__box .ldg-timer{margin:18px 10px 10px;padding:14px 14px}
  .ldg-modal__close{top:12px;right:12px;width:30px;height:30px}

  .ldg-swap{--ldg-rs:50px;display:flex}
  .ldg-swap .ldg-btn{flex:1 1 auto;padding:15px 20px;font-size:16px}
  .ldg-round svg{width:18px;height:18px}
  .ldg-coupon{width:100%}
  .ldg-coupon__code{flex:1 1 auto;padding:12px 14px;font-size:18px}

  .ldg-timer{flex-wrap:wrap;gap:12px}
  .ldg-timer__rule{display:none}
  .ldg-timer__lab{width:100%;font-size:11px;letter-spacing:.14em}
  .ldg-timer .ldg-count{width:100%;gap:6px}
  .ldg-count__unit{flex:1 1 0;min-width:0;padding:6px 4px 6px}
  .ldg-count__num{font-size:21px}
  .ldg-count__lab{margin-top:3px;font-size:7.5px;letter-spacing:.08em}
  .ldg-timer__ends{width:100%;font-size:12px}
  .ldg-timer__stack,.ldg-modal__box .ldg-timer__stack{width:100%;margin-left:0;gap:7px;
    flex-direction:column;align-items:flex-start;padding-left:0;border-left:0;
    padding-top:11px;border-top:1px solid rgba(255,255,255,.14)}
  .ldg-chip{font-size:12.5px;gap:9px;white-space:normal}
  .ldg-chip__ico{width:18px}
  .ldg-chip__ico svg{width:17px;height:17px}

  .ldg-brk{display:none}
  .ldg-modal__box .ldg-timer__ends{white-space:nowrap}
}

/* Overrides that must beat the breakpoints above. */
/* LODGIFY SHOWCASE - the two placements the OptinMonster block does not carry
   (the site-wide top bar and the in-page hero), plus the page chrome. Loaded
   AFTER the popup stylesheet, which already defines the variables and every
   shared component. Real @media here, not @container: this is a real page.
   Every shared-component override is scoped to .ldg-bar / .ldg-shot so the
   popup stays governed only by its own container queries. */

/* The popup stylesheet puts the variables on .ldg, never :root, because :root
   can never match inside an OptinMonster campaign. On a real page the chrome
   and the demo button sit OUTSIDE .ldg, so mirror the brand tokens here or
   they fall back to unstyled defaults. */
:root{
  --ldg-yellow:#FFF65B;
  --ldg-yellow-deep:#F2E627;
  --ldg-ink:#141313;
  --ldg-white:#FFFFFF;
  --ldg-display:"RL Aqva","ITC Avant Garde Gothic",Jost,"Helvetica Neue",Arial,sans-serif;
  --ldg-body:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}

/* ---------- 1 - top bar ---------- */
.ldg-bar{position:relative;width:100%;background:var(--ldg-yellow);color:var(--ldg-ink)}
.ldg-bar__in{position:relative;max-width:1400px;margin:0 auto;min-height:64px;
  display:flex;align-items:center;justify-content:center;gap:26px;padding:8px 56px;flex-wrap:wrap}
.ldg-bar__tag{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;
  padding:5px 12px 5px 10px;border-radius:999px;background:var(--ldg-ink);color:var(--ldg-yellow);
  font-family:var(--ldg-display);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.ldg-bar__tag svg{width:11px;height:11px}
.ldg-bar__msg{font-size:16px;line-height:1.35;margin:0;color:var(--ldg-ink)}
.ldg-bar__msg strong{font-size:18px;font-weight:700}
.ldg-bar__msg .ldg-code{font-weight:700;color:var(--ldg-ink)}
.ldg-bar__msg a{color:var(--ldg-ink);opacity:.7;font-size:14px}
.ldg-bar__cta{display:inline-flex;align-items:center;gap:9px;flex:0 0 auto;
  font-size:16px;font-weight:600;color:var(--ldg-ink);text-decoration:none;white-space:nowrap}
.ldg-bar__cta span{border-bottom:1.5px solid transparent;transition:border-color .15s}
.ldg-bar__cta:hover span{border-bottom-color:var(--ldg-ink)}
.ldg-bar__arrow{width:26px;height:26px;border-radius:50%;background:var(--ldg-ink);
  display:grid;place-items:center;flex:0 0 auto}
.ldg-bar__arrow svg{width:13px;height:13px;color:var(--ldg-yellow)}
.ldg-bar .ldg-count{gap:5px}
.ldg-bar .ldg-count__unit{min-width:36px;padding:0;background:none;box-shadow:none}
.ldg-bar .ldg-count__num{font-size:21px;color:var(--ldg-ink)}
.ldg-bar .ldg-count__lab{font-size:9px;margin-top:3px;color:rgba(20,19,19,.62)}
.ldg-bar__sep{font-family:var(--ldg-display);font-size:19px;font-weight:700;opacity:.35;
  line-height:1.1;color:var(--ldg-ink)}
.ldg-bar__close{position:absolute;top:50%;right:16px;transform:translateY(-50%);
  width:26px;height:26px;border:0;border-radius:50%;cursor:pointer;
  background:rgba(20,19,19,.12);color:var(--ldg-ink);display:grid;place-items:center}
.ldg-bar__close:hover{background:rgba(20,19,19,.22)}
.ldg-bar__close svg{width:12px;height:12px}
@media (max-width:1120px){
  .ldg-bar__in{gap:14px;padding:12px 48px}
  .ldg-bar__msg{font-size:14px;text-align:center}
  .ldg-bar__msg strong{font-size:15px}
}
@media (max-width:620px){
  .ldg-bar__in{padding:11px 44px 11px 16px;gap:10px;justify-content:flex-start}
  .ldg-bar .ldg-count,.ldg-bar__tag{display:none}
  .ldg-bar__msg{font-size:13.5px;text-align:left;flex:1 1 auto}
  .ldg-bar__cta{font-size:14px}
  .ldg-bar__cta span{display:none}
}

/* ---------- 2 - hero ---------- */
.ldg-shot{
  position:relative;overflow:hidden;min-height:664px;border-radius:32px;
  background:#1B1D16;color:var(--ldg-white);isolation:isolate;
}
.ldg-shot__bg{
  position:absolute;inset:0;z-index:0;
  background-image:var(--ldg-photo);background-size:cover;background-position:50% 50%;
}
.ldg-shot--panel .ldg-shot__bg{filter:blur(12px) brightness(.72) saturate(1.05);transform:scale(1.24)}
.ldg-shot__panel{
  position:absolute;top:0;bottom:0;right:0;left:auto;width:auto;
  aspect-ratio:var(--ldg-panel-ar,3 / 2);z-index:1;pointer-events:none;display:none;
  background-image:var(--ldg-photo);background-repeat:no-repeat;
  background-size:cover;background-position:center;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.55) 9%,#000 22%);
  mask-image:linear-gradient(90deg,transparent 0,rgba(0,0,0,.55) 9%,#000 22%);
}
.ldg-shot--panel .ldg-shot__panel{display:block}
.ldg-shot__scrim{
  position:absolute;inset:0;z-index:2;
  background:
    linear-gradient(96deg,rgba(10,12,8,.9) 0%,rgba(10,12,8,.76) 30%,rgba(10,12,8,.42) 55%,rgba(10,12,8,.08) 80%,rgba(10,12,8,0) 100%),
    linear-gradient(180deg,rgba(10,12,8,0) 55%,rgba(10,12,8,.55) 100%);
}
.ldg-shot--panel .ldg-shot__scrim{
  background:
    linear-gradient(96deg,rgba(10,12,8,.6) 0%,rgba(10,12,8,.46) 34%,rgba(10,12,8,.22) 60%,rgba(10,12,8,0) 84%),
    linear-gradient(180deg,rgba(10,12,8,0) 55%,rgba(10,12,8,.5) 100%);
}
.ldg-shot__logo{position:absolute;z-index:5;top:42px;left:60px}
.ldg-shot__logo svg{height:32px;width:auto;color:var(--ldg-yellow)}
.ldg-shot__tag{position:absolute;z-index:5;top:36px;right:44px}
.ldg-shot__in{position:relative;z-index:4;max-width:700px;padding:126px 0 0 60px}
.ldg-shot__h{
  font-family:var(--ldg-display);font-weight:700;text-transform:uppercase;
  font-size:clamp(38px,4.1vw,58px);line-height:1.0;letter-spacing:-.02em;margin:0;
  text-shadow:0 2px 18px rgba(0,0,0,.35);
}
.ldg-shot__sub{
  margin:18px 0 0;max-width:40ch;font-size:18px;line-height:1.5;color:rgba(255,255,255,.84);
  text-shadow:0 1px 12px rgba(0,0,0,.4);
}
.ldg-shot__sub b{color:var(--ldg-white);font-weight:600}
.ldg-shot__actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:30px}
/* the fine print reads on one line on a wide hero and wraps below 720 */
.ldg-shot__fine{margin:18px 0 0;max-width:none;white-space:nowrap;font-size:12px;line-height:1.6;
  color:rgba(255,255,255,.6);text-shadow:0 1px 10px rgba(0,0,0,.45)}
.ldg-shot__fine a{color:rgba(255,255,255,.75)}
.ldg-shot__fine b{color:var(--ldg-yellow)}
.ldg-shot .ldg-timer{left:24px;right:24px;bottom:22px;justify-content:space-between;gap:16px}
.ldg-shot .ldg-timer__stack{flex-direction:row;align-items:center;gap:22px;margin-left:0}
.ldg-shot .ldg-timer__stack .ldg-chip + .ldg-chip{padding-left:22px;
  border-left:1px solid rgba(255,255,255,.16)}

@media (max-width:1180px){
  .ldg-shot{min-height:0}
  .ldg-shot__in{max-width:none;padding:118px 32px 0}
  .ldg-shot__logo{left:32px}
  .ldg-shot__tag{right:24px;transform:scale(.84);transform-origin:top right}
  .ldg-shot .ldg-timer{position:relative;left:auto;right:auto;bottom:auto;
    margin:30px 24px 24px;flex-wrap:wrap;gap:16px 22px}
  .ldg-shot .ldg-timer__rule{display:none}
  .ldg-shot .ldg-timer__stack{flex-direction:column;align-items:flex-start;gap:8px;margin-left:0}
  .ldg-shot .ldg-timer__stack .ldg-chip + .ldg-chip{padding-left:0;border-left:0}
}
@media (max-width:720px){
  .ldg-shot{border-radius:20px;min-height:0}
  .ldg-shot__bg{background-position:88% 50%}
  .ldg-shot--panel .ldg-shot__bg{filter:none;transform:none}
  .ldg-shot--panel .ldg-shot__panel{display:none}
  .ldg-shot__scrim,.ldg-shot--panel .ldg-shot__scrim{
    background:
      linear-gradient(180deg,rgba(10,12,8,.74) 0%,rgba(10,12,8,.6) 44%,rgba(10,12,8,.78) 100%),
      linear-gradient(96deg,rgba(10,12,8,.42) 0%,rgba(10,12,8,.06) 100%);
  }
  .ldg-shot__logo{top:20px;left:20px}
  .ldg-shot__logo svg{height:24px}
  .ldg-shot__tag{top:16px;right:14px;transform:scale(.52);transform-origin:top right}
  .ldg-shot__in{padding:86px 20px 0}
  .ldg-shot__h{font-size:31px;line-height:1.04}
  .ldg-shot__sub{margin-top:12px;font-size:15px;line-height:1.45;max-width:none}
  .ldg-shot__actions{margin-top:20px;gap:10px;align-items:stretch;flex-direction:column}
  .ldg-shot__fine{margin-top:14px;font-size:11px;line-height:1.55;white-space:normal}
  .ldg-shot .ldg-timer{margin:20px 12px 12px;padding:14px 14px;flex-wrap:wrap;gap:12px}

  .ldg-shot .ldg-swap{--ldg-rs:50px;display:flex}
  .ldg-shot .ldg-swap .ldg-btn{flex:1 1 auto;padding:15px 20px;font-size:16px}
  .ldg-shot .ldg-round svg{width:18px;height:18px}
  .ldg-shot .ldg-coupon{width:100%}
  .ldg-shot .ldg-coupon__code{flex:1 1 auto;padding:12px 14px;font-size:18px}

  .ldg-shot .ldg-timer__lab{width:100%;font-size:11px;letter-spacing:.14em}
  .ldg-shot .ldg-count{width:100%;gap:6px}
  .ldg-shot .ldg-count__unit{flex:1 1 0;min-width:0;padding:6px 4px 6px}
  .ldg-shot .ldg-count__num{font-size:21px}
  .ldg-shot .ldg-count__lab{margin-top:3px;font-size:7.5px;letter-spacing:.08em}
  .ldg-shot .ldg-timer__ends{width:100%;font-size:12px}
  .ldg-shot .ldg-timer__stack{width:100%;margin-left:0;gap:7px;
    flex-direction:column;align-items:flex-start;
    padding-top:11px;border-top:1px solid rgba(255,255,255,.14)}
  .ldg-shot .ldg-chip{font-size:12.5px;gap:9px;white-space:normal}
  .ldg-shot .ldg-chip__ico{width:18px}
  .ldg-shot .ldg-chip__ico svg{width:17px;height:17px}
}
@media (max-width:400px){
  .ldg-shot__h{font-size:28px}
  .ldg-shot__in{padding:80px 16px 0}
}

/* ---------- 3 - the overlay the popup sits in on a real page ----------
   OptinMonster supplies this in the campaign; here we supply our own. */
.ldg-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
  padding:24px;overflow:auto;background:rgba(10,12,8,.6);backdrop-filter:blur(3px)}

/* ---------- host-page hardening (emitted AFTER the component CSS) ---------- */
#ldgDeBar .ldg-bar__msg a,#ldgDeModal .ldg-modal__fine a{text-decoration:underline}
/* the heading inherits its colour; state it outright so nothing can win it */
#ldgDeModal .ldg-modal__h{color:var(--ldg-white)}

/* ---------- top bar countdown, optical centring ----------
   .ldg-bar__in centres on the flex box, and the box is centred correctly --
   but the ink inside it is not. .ldg-count__num carries line-height:1, so the
   digits' ascenders spill above their line box while the label underneath
   keeps its normal descender space. Measured against the pill, the message
   and the CTA (all landing on the bar's centre), the countdown's ink centre
   sits 2.75px high.
   Nudged with position, not margin or padding: under align-items:center a
   margin would be split in half by the alignment and a padding would grow the
   box and re-centre it, so neither moves the ink by the amount asked for.
   Bar only -- the popup timer has its own layout and centres fine. */
#ldgDeBar .ldg-count{position:relative;top:3px}

/* ---------- host-page hardening ---------- */
#ldgDeModal.ldg-overlay{z-index:2147483000;overscroll-behavior:contain;
  align-items:safe center;justify-items:center}
html.ldg-scroll-lock{overflow:hidden !important}
/* The bar pulls itself out of the host body's padding. width must be auto:
   .ldg-bar ships width:100%, and a block box with an explicit width ignores
   its right margin, so the negative left margin shifted it over but the right
   edge stayed 2x bleed short. width:auto absorbs both margins instead. */
#ldgDeBar[data-ldg-bar="push"],#ldgDeBar[data-ldg-bar="flow"]{
  position:relative;z-index:2147482000;width:auto;
  margin:calc(var(--ldg-bar-bleed,0px) * -1) calc(var(--ldg-bar-bleed,0px) * -1) var(--ldg-bar-bleed,0px)}
#ldgDeBar[data-ldg-bar="sticky"]{position:sticky;top:0;z-index:2147482000}
#ldgDeBar[data-ldg-bar="fixed"]{position:fixed;top:0;left:0;right:0;z-index:2147482000}

/* ---------- timer row, desktop band only -------------------------------
   The row needs about 1060px of frame to fit the German strings, but the
   design's own reflow does not start until the 900px container query. In
   between, .ldg-count is the only shrinkable item, so it squeezes below its
   248px min-content and the chips spill right over the .ldg-timer__rule and
   into "Endet am ...".
   Three rules, above 900px only: the countdown is fixed-size and never
   gives, and the review chips wrap inside their own column instead. The row
   does not gain a second line -- the stack stays where it is, just narrower.
   Below 900px none of this applies and the design reflows as authored. */
@container (min-width:901px){
  #ldgDeModal .ldg-timer .ldg-count{flex:0 0 auto}
  #ldgDeModal .ldg-timer__stack{flex:0 1 auto;min-width:0}
  #ldgDeModal .ldg-timer__stack .ldg-chip{white-space:normal}
}
@media (prefers-reduced-motion:reduce){
  #ldgDeBar *,#ldgDeModal *{transition:none !important;animation:none !important}
}

`;

  /* =====================================================================
     5 · Helpers
     ===================================================================== */
  var END = new Date(CONFIG.deadline).getTime();
  var qs  = new URLSearchParams(window.location.search);

  function ls(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) {}
    return null;
  }
  function lsDel(key) { try { window.localStorage.removeItem(key); } catch (e) {} }

  var memPopupClosed = false;
  function popupClosed() {
    if (memPopupClosed) return true;
    try { return window.sessionStorage.getItem(CONFIG.popupSessionKey) === '1'; }
    catch (e) { return false; }
  }
  function markPopupClosed() {
    memPopupClosed = true;
    try { window.sessionStorage.setItem(CONFIG.popupSessionKey, '1'); } catch (e) {}
  }

  function barDismissed() {
    var until = ls(CONFIG.barKey);
    return !!until && Number(until) > Date.now();
  }
  function markBarDismissed() {
    ls(CONFIG.barKey, String(Date.now() + CONFIG.barDismissDays * 864e5));
  }

  function expired() { return Date.now() >= END; }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  /* =====================================================================
     6 · Country + language
     ===================================================================== */
  function cachedCountry() {
    try {
      var o = JSON.parse(ls(CONFIG.geoKey) || 'null');
      return (o && (Date.now() - o.t < CONFIG.geoTTL)) ? o.c : null;
    } catch (e) { return null; }
  }

  function applyCountry(c) {
    if (CONFIG.setHtmlAttr) document.documentElement.setAttribute('data-country', c);
    return c;
  }

  function resolveCountry() {
    var forced = (qs.get('ldgeo') || '').toUpperCase();
    if (/^[A-Z]{2}$/.test(forced)) return Promise.resolve(applyCountry(forced));

    var hit = cachedCountry();
    if (hit) return Promise.resolve(applyCountry(hit));

    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, CONFIG.geoTimeout);

    return fetch(CONFIG.geoEndpoint, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.text(); })
      .then(function (t) {
        clearTimeout(timer);
        var c = (t.match(/loc=([A-Z]{2})/) || [])[1] || 'XX';
        ls(CONFIG.geoKey, JSON.stringify({ c: c, t: Date.now() }));
        return applyCountry(c);
      })
      .catch(function () { clearTimeout(timer); return applyCountry('XX'); });
  }

  function isGermanPage() {
    var forced = (qs.get('ldlang') || '').toLowerCase();
    if (forced) return forced.slice(0, 2) === 'de';
    if (CONFIG.lang.dePath.test(window.location.pathname)) return true;
    if (CONFIG.lang.deHost.test(window.location.hostname)) return true;
    if (CONFIG.lang.useHtmlLang) {
      var l = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (l.slice(0, 2) === 'de') return true;
    }
    return false;
  }

  /* =====================================================================
     7 · Render
     ===================================================================== */

  /* ---------------------------------------------------------------------
     Pushing the page down for the bar

     The bar sits in normal flow, so ordinary page content moves down on its
     own. What does not move is anything taken out of flow and pinned to the
     top of the viewport -- a fixed or sticky navbar -- which would otherwise
     sit on top of the bar. Those get their `top` offset by the bar's height,
     shrinking back to 0 as the bar scrolls away so no gap is left behind.
     --------------------------------------------------------------------- */
  function findPinned() {
    var nodes = [];
    try {
      if (CONFIG.fixedHeaderSelector) {
        nodes = document.querySelectorAll(CONFIG.fixedHeaderSelector);
      } else if (document.elementsFromPoint) {
        // whatever is actually painted at the very top edge, nothing broader
        nodes = document.elementsFromPoint(Math.round(window.innerWidth / 2), 1) || [];
      }
    } catch (e) { return []; }
    var out = [];
    [].forEach.call(nodes, function (el) {
      if (!el || el === document.body || el === document.documentElement) return;
      var cs;
      try { cs = window.getComputedStyle(el); } catch (e) { return; }
      if (!cs || (cs.position !== 'fixed' && cs.position !== 'sticky')) return;
      if (Math.abs(parseFloat(cs.top) || 0) > 1) return;   // not pinned to 0
      if (out.indexOf(el) === -1) out.push(el);
    });
    return out;
  }

  function pushPinned(bar, pinned) {
    if (!pinned.length) return null;
    var prev = pinned.map(function (el) { return el.style.top; });
    var height = 0, frame = null;

    function apply() {
      frame = null;
      var offset = Math.max(0, height - (window.scrollY || 0));
      pinned.forEach(function (el) { el.style.top = offset + 'px'; });
    }
    var raf = window.requestAnimationFrame
      ? function (fn) { return window.requestAnimationFrame(fn); }
      : function (fn) { return setTimeout(fn, 16); };
    var unraf = window.cancelAnimationFrame
      ? function (id) { window.cancelAnimationFrame(id); }
      : function (id) { clearTimeout(id); };
    function schedule() { if (frame === null) frame = raf(apply); }
    function measure() {
      height = bar.classList.contains('ldg-hide') ? 0 : bar.getBoundingClientRect().height;
      schedule();
    }

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    var ro = ('ResizeObserver' in window) ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(bar);

    return function restore() {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
      if (frame !== null) unraf(frame);
      pinned.forEach(function (el, i) { el.style.top = prev[i]; });
    };
  }

  function mount() {
    if (CONFIG.loadFonts) {
      var f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700' +
               '&family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(f);
    }

    var style = document.createElement('style');
    style.id = 'ldg-einheit-css';
    style.textContent = CSS
      .replace('url("__PHOTO__")', CONFIG.photoSet || 'url("' + CONFIG.photoUrl + '")')
      .replace('__TAG__', TAG)
      + (CONFIG.extraCSS ? '\n\n/* CONFIG.extraCSS */\n' + CONFIG.extraCSS : '');
    document.head.appendChild(style);

    function build(html) {
      var host = document.createElement('div');
      host.innerHTML = html;
      return host.firstElementChild;
    }

    /* ---- top bar ---- */
    var bar = null;
    var unpush = null;
    if (CONFIG.showBar && !barDismissed()) {
      bar = build(BAR);
      bar.setAttribute('data-ldg-bar', CONFIG.barMode);
      bar.style.setProperty('--ldg-bar-bleed', (CONFIG.barBleed || 0) + 'px');
      var pinned = (CONFIG.barMode === 'push') ? findPinned() : [];
      document.body.insertBefore(bar, document.body.firstChild);
      if (CONFIG.barMode === 'push') unpush = pushPinned(bar, pinned);
    }

    /* ---- popup ---- */
    var modal = null;
    if (CONFIG.showPopup && !popupClosed()) {
      modal = build(MODAL);
      document.body.appendChild(modal);
    }

    if (!bar && !modal) return;

    /* ---- countdown, shared by both ---- */
    var ticker = null;
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    function countdownRoots() {
      var out = [];
      if (bar && !bar.classList.contains('ldg-hide')) out.push(bar);
      if (modal && !modal.classList.contains('ldg-hide')) out.push(modal);
      return out;
    }

    function tick() {
      if (expired()) {
        if (bar) bar.classList.add('ldg-hide');
        if (modal) closeModal(true);
        stopTicker();
        return;
      }
      var s = Math.floor((END - Date.now()) / 1000);
      var vals = {
        days:    pad(Math.floor(s / 86400)),
        hours:   pad(Math.floor((s % 86400) / 3600)),
        minutes: pad(Math.floor((s % 3600) / 60)),
        seconds: pad(s % 60)
      };
      countdownRoots().forEach(function (root) {
        Object.keys(vals).forEach(function (u) {
          var el = root.querySelector('[data-unit="' + u + '"]');
          if (el && el.textContent !== vals[u]) el.textContent = vals[u];
        });
      });
    }
    function startTicker() { if (!ticker) { tick(); ticker = setInterval(tick, 1000); } }
    function stopTicker()  { if (ticker) { clearInterval(ticker); ticker = null; } }

    if (bar) startTicker();

    /* ---- open / close ---- */
    var lastFocus = null;
    var modalOpen = false;

    function openModal() {
      if (!modal || modalOpen || popupClosed() || expired()) return;
      modalOpen = true;
      lastFocus = document.activeElement;
      modal.classList.remove('ldg-hide');
      startTicker();
      tick();
      if (CONFIG.lockScroll) document.documentElement.classList.add('ldg-scroll-lock');
      var first = modal.querySelector('.ldg-modal__close');
      if (first) first.focus();
      disarm();
    }

    function closeModal(silent) {
      if (!modal) return;
      modalOpen = false;
      modal.classList.add('ldg-hide');
      if (CONFIG.lockScroll) document.documentElement.classList.remove('ldg-scroll-lock');
      if (!silent) {
        markPopupClosed();
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      if (!bar || bar.classList.contains('ldg-hide')) stopTicker();
      disarm();
    }

    function closeBar() {
      if (!bar) return;
      bar.classList.add('ldg-hide');
      if (unpush) { unpush(); unpush = null; }
      markBarDismissed();
      if (!modalOpen) stopTicker();
    }

    document.addEventListener('click', function (e) {
      if (!(e.target instanceof Element)) return;
      var btn = e.target.closest('[data-ldg-dismiss]');
      if (!btn) return;
      e.preventDefault();
      if (btn.getAttribute('data-ldg-dismiss') === 'bar') closeBar();
      else closeModal();
    });

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();     // backdrop only
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalOpen) closeModal();
      });
      // keep focus inside the dialog while it is open
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !modalOpen) return;
        var items = modal.querySelectorAll('a[href], button:not([disabled])');
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    /* ---- coupon copy ----
       The German markup carries its own strings in data-ldg-copied and
       data-ldg-copy-fail, so nothing is hardcoded here. */
    var copyTimers = new WeakMap();
    document.addEventListener('click', function (e) {
      if (!(e.target instanceof Element)) return;
      var btn = e.target.closest('[data-ldg-copy]');
      if (!btn) return;
      e.preventDefault();
      var code   = btn.getAttribute('data-ldg-copy');
      var okMsg  = btn.getAttribute('data-ldg-copied') || 'Kopiert!';
      var badMsg = btn.getAttribute('data-ldg-copy-fail') || 'Kopieren fehlgeschlagen';
      var label  = btn.querySelector('[data-ldg-copy-label]');
      var flash = function (msg) {
        if (!label) return;
        clearTimeout(copyTimers.get(btn));
        label.textContent = msg;
        btn.setAttribute('aria-label', msg);
        btn.classList.remove('is-copied');
        void btn.offsetWidth;
        btn.classList.add('is-copied');
        copyTimers.set(btn, setTimeout(function () {
          label.textContent = code;
          btn.setAttribute('aria-label', 'Code ' + code + ' kopieren');
          btn.classList.remove('is-copied');
        }, 1600));
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(
          function () { flash(okMsg); }, function () { flash(badMsg); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = code; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        var ok = false;
        try { ta.select(); ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        flash(ok ? okMsg : badMsg);
      }
    });

    /* ===================================================================
       8 · Exit intent
       =================================================================== */
    var armed = false;
    var listeners = [];
    var cleanups = [];

    function on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      listeners.push([target, type, fn, opts]);
    }
    function disarm() {
      armed = false;
      listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      cleanups.forEach(function (fn) { fn(); });
      listeners = [];
      cleanups = [];
    }

    function onMouseOut(e) {
      if (!armed) return;
      if (e.clientY > CONFIG.exitMargin) return;   // not through the top edge
      if (e.relatedTarget || e.toElement) return;  // moved into another element
      openModal();
    }

    function armScrollUp() {
      var lastY = window.scrollY, lastT = Date.now();
      on(window, 'scroll', function () {
        if (!armed) return;
        var y = window.scrollY, t = Date.now(), dt = (t - lastT) / 1000;
        if (dt > 0) {
          var v = (lastY - y) / dt;                // positive = scrolling up
          if (v > CONFIG.scrollUpVelocity && y < 320) openModal();
        }
        lastY = y; lastT = t;
      }, { passive: true });
    }

    function arm() {
      if (!modal || popupClosed() || expired()) return;
      armed = true;
      var touch = window.matchMedia('(hover: none)').matches;
      if (!touch) {
        on(document, 'mouseout', onMouseOut);
      } else if (CONFIG.mobileTrigger === 'scrollUp') {
        armScrollUp();
      } else if (CONFIG.mobileTrigger === 'timeout') {
        var to = setTimeout(function () { if (armed) openModal(); }, CONFIG.mobileTimeout);
        on(window, 'pagehide', function () { clearTimeout(to); });
        cleanups.push(function () { clearTimeout(to); });
      }
    }

    if (modal && qs.get('ldexit') === '1') { openModal(); return; }
    if (modal) setTimeout(arm, CONFIG.armDelay);
  }

  /* =====================================================================
     9 · Boot
     ===================================================================== */
  if (qs.get('ldreset') === '1') {
    memPopupClosed = false;
    try { window.sessionStorage.removeItem(CONFIG.popupSessionKey); } catch (e) {}
    lsDel(CONFIG.barKey);
    lsDel(CONFIG.geoKey);
  }

  if (expired()) return;
  if (document.getElementById('ldgDeBar') || document.getElementById('ldgDeModal')) return;
  if (CONFIG.requireGermanPage && !isGermanPage()) return;

  resolveCountry().then(function (country) {
    if (CONFIG.countries.indexOf(country) === -1) return;
    ready(mount);
  });
})();