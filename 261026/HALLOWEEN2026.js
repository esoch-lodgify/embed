/*!
 * ==========================================================================
 * LODGIFY — Halloween promo 2026 (until 2 November)
 * North America: English and Canadian French TOP BAR and EXIT-INTENT POPUP
 * ==========================================================================
 * One design, two locales. The stylesheet and layout are shared; the copy,
 * the -50% tag artwork and the targeting are per locale (COPY and CONFIG
 * below). Same behaviour layer as the Toussaint script (TOUSSAINT2026.js).
 *
 *   <script src="https://YOUR-CDN/HALLOWEEN2026.js" defer></script>
 *
 * WHO SEES WHAT   (the page locale picks the variant, then the country gates it)
 *   English page + US or Canada   -> English bar + popup
 *   French page  + Canada         -> French bar + popup
 *   Any other combination         -> nothing renders
 *
 *   Phones, tablets, windows narrower than CONFIG.popupMinWidth (1024px)
 *                                 -> bar only; the exit popup never opens
 *
 *   The locale is checked before the country, so visitors on pages with no
 *   variant never trigger the Cloudflare lookup.
 *
 * ARTWORK
 *   The photo is shared; the tag is per locale. All three are hosted on
 *   Webflow's CDN (CONFIG.photoUrl, CONFIG.tagUrl), AVIF: every current browser
 *   decodes it; Safari below 16.4 and Edge below 121 do not, and those
 *   visitors get the panel with no photo behind it.
 *
 * COMPETING BANNER
 *   Inside the audience above, the host page's #sticky-banner-component is
 *   hidden (CONFIG.hideSelector) until the deadline. Outside it, nothing is
 *   touched.
 *
 * QA HELPERS (query string, no code changes needed)
 *   ?ldgeo=CA      force the country, no VPN needed
 *   ?ldlang=fr     force the page locale (fr | en)
 *   ?ldexit=1      open the popup immediately, skip the exit trigger
 *   ?ldreset=1     clear the dismissed bar and the closed popup
 *
 * COPY AND DATES
 *   CONFIG.deadline drives both countdowns and the auto-hide. The visible
 *   deadline text ("Mon, November 2 / 11:59 PM PT") and the tag artwork are
 *   fixed. Change them together or they will disagree.
 * ==========================================================================
 */
(function () {
  'use strict';

  /* =====================================================================
     1 · CONFIG
     Where a value is an { en, fr } object, the page locale picks the entry.
     ===================================================================== */
  var CONFIG = {
    // Background photo (shared) and the -50% tag (one per locale), on Webflow's CDN.
    photoUrl: 'https://cdn.prod.website-files.com/6a0183d56ceb2deec6fd2e8c/6acf7f3495e04308fd6e8752_Frame%202147233404.avif',
    tagUrl: {
      en: 'https://cdn.prod.website-files.com/6a0183d56ceb2deec6fd2e8c/6adf4fe73da555c4609cad52_halloween-2026-tag-en.avif',
      fr: 'https://cdn.prod.website-files.com/6a0183d56ceb2deec6fd2e8c/6adf4fe7124d1dbecd72bda9_halloween-2026-tag-fr.avif'
    },

    // Bar link, and the popup's button and arrow. Kept separate so the two
    // placements can be tagged differently. Identical values mean analytics
    // cannot tell them apart.
    ctaUrl:      { en: 'https://www.lodgify.com/halloween-promo/', fr: 'https://www.lodgify.com/halloween-promo/' },
    popupCtaUrl: { en: 'https://www.lodgify.com/halloween-promo/', fr: 'https://www.lodgify.com/halloween-promo/' },

    // Offer deadline. ISO 8601 with an explicit offset.
    // 23:59:59 on Monday 2 November 2026, Pacific time (PST = UTC-8; summer
    // time ends on 1 November).
    deadline: '2026-11-02T23:59:59-08:00',

    // --- targeting ---
    // BOTH gates must pass: the page locale has a variant AND the visitor's
    // country is on that variant's list.
    countries: {
      en: ['US', 'CA'],
      fr: ['CA']
    },

    // Country lookup, cached for 24h under the same key as the snippet
    // already on the site, so the two share one request.
    geoKey: 'geo_country',
    geoTTL: 864e5,
    geoEndpoint: 'https://www.cloudflare.com/cdn-cgi/trace',
    geoTimeout: 2500,
    setHtmlAttr: true,       // mirror onto <html data-country="..">

    // <html lang> decides the locale when present, which it is on
    // lodgify.com; a /xx/ path prefix is the fallback, no prefix means 'en'.
    useHtmlLang: true,

    // A competing banner on the host page. Hidden for everyone in this
    // campaign's audience (passes the locale and country gates, before the
    // deadline) and put back at the deadline. Anyone outside the audience
    // keeps it. '' disables.
    hideSelector: '#sticky-banner-component',

    // --- top bar ---
    showBar: true,
    barMode: 'push',         // 'push' | 'flow' | 'sticky' | 'fixed'
    barBleed: 5,             // lodgify.com's <body> carries 5px of padding
    fixedHeaderSelector: '', // set if auto-detection misses the navbar
    barCountNudge: 3,        // optical centring for the bar countdown; 0 disables
    barDismissDays: 1,

    // --- exit popup (desktop only) ---
    showPopup: true,
    popupMinWidth: 1024,     // viewport px; narrower windows and touch devices get no popup
    armDelay: 3000,          // don't arm the trigger for the first N ms
    exitMargin: 8,           // cursor Y at or below this counts as leaving
    lockScroll: true,

    // Popup stays closed for the rest of the browser session. The bar uses
    // barDismissDays instead. Different mechanisms on purpose. One campaign,
    // so both locales share the keys.
    popupSessionKey: 'ldg_halloween_popup_closed',
    barKey: 'ldg_halloween_bar_until',

    // Visual tweaks go here, not in the CSS blob below. Appended last, so
    // these rules win. Scope them to #ldgHalloweenModal or #ldgHalloweenBar.
    extraCSS: ''
  };


  /* =====================================================================
     2 · COPY  (markup verbatim from each locale's design file; the
     stylesheet is shared, with the French file's longer-language rules
     carried as that variant's extra CSS)
     ===================================================================== */
  var COPY = {
    en: {
      bar: `<div class="ldg ldg-bar" id="ldgHalloweenBar" data-ldg-countdown role="region" aria-label="Treat yourself to 50% off" lang="en">
  <div class="ldg-bar__in">
    <button class="ldg-bar__tag ldg-bar__tag--copy" type="button" data-ldg-copy="TREAT26"
      data-ldg-copied="Copied!" data-ldg-copy-fail="Copy failed" aria-label="Copy coupon code TREAT26">
      <span class="ldg-bar__tagtxt"><span class="ldg-bar__idle">Code: TREAT26</span><span class="ldg-bar__flash" data-ldg-copy-label aria-hidden="true">TREAT26</span></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0012.5 3H5.5A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15"/></svg>
    </button>

    <p class="ldg-bar__msg"><strong>Treat yourself to 50% off</strong><span class="ldg-bar__mcode"> — <span class="ldg-code">TREAT26</span></span></p>

    <a class="ldg-bar__cta" href="__CTA__">
      <span>Claim 50% off</span>
      <span class="ldg-bar__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
      </span>
    </a>

    <div class="ldg-count">
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">18</span><span class="ldg-count__lab">Days</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">16</span><span class="ldg-count__lab">Hours</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">22</span><span class="ldg-count__lab">Mins</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">29</span><span class="ldg-count__lab">Secs</span></div>
    </div>
  </div>

  <button class="ldg-bar__close" type="button" data-ldg-dismiss="bar" aria-label="Dismiss offer">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>`,
      modal: `<div class="ldg-overlay ldg-hide" id="ldgHalloweenModal" role="dialog" aria-modal="true" aria-label="Treat yourself to 50% off">
<!-- .ldg-modal__frame is the CSS container the breakpoints query, and
     data-ldg-popup is what the Custom CSS and the behaviour key off.
     Remove neither. -->
<div class="ldg ldg-modal__frame" data-ldg-popup lang="en">
  <div class="ldg-modal__box ldg-modal--panel">
    <div class="ldg-modal__bg" aria-hidden="true"></div>
    <div class="ldg-modal__panel" aria-hidden="true"></div>
    <div class="ldg-modal__scrim" aria-hidden="true"></div>

    <button class="ldg-modal__close" type="button" data-ldg-dismiss="modal" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>

    <div class="ldg-modal__logo"><svg viewBox="0 0 71 19" fill="currentColor" role="img" aria-label="Lodgify"><path d="M61.4287 18.6361H65.2264L70.9221 5.08969H66.4792L65.3642 10.4143C65.2859 10.8246 64.8161 10.845 64.719 10.3955L63.5444 5.08969H59.0624C57.2035 5.08969 56.6162 4.52278 56.6162 3.68024C56.6162 2.8377 57.1048 2.34909 57.927 2.34909C58.8854 2.34909 59.3756 3.11333 59.4727 3.876H63.2312C62.6643 1.38909 60.8242 0 58.1807 0C55.2647 0 53.4434 1.70387 53.4434 4.30666V5.08969H51.3292V8.26097H53.4434V15.0733H57.2802V8.27976H61.2141L60.0208 6.73249L62.8006 14.1525C62.9572 14.544 62.9368 14.9747 62.7818 15.3865L61.4318 18.6361H61.4287ZM48.5275 4.58072C49.76 4.58072 50.6417 3.81649 50.6417 2.72025C50.6417 1.624 49.7615 0.859767 48.5275 0.859767C47.2934 0.859767 46.4133 1.624 46.4133 2.72025C46.4133 3.81649 47.2934 4.58072 48.5275 4.58072ZM46.6091 15.0733H50.4459V5.08969H46.6091V15.0733ZM40.0316 12.0587C38.8774 12.0587 38.0349 11.2365 38.0349 10.0823C38.0349 8.92811 38.8759 8.10436 40.0316 8.10436C41.1874 8.10436 42.0283 8.92654 42.0283 10.0823C42.0283 11.238 41.1874 12.0587 40.0316 12.0587ZM35.2363 18.6361H39.8954C43.3016 18.6361 45.7477 16.3841 45.7477 13.2144V5.08969H41.9109V5.5783C41.9109 5.73491 41.7355 5.73491 41.5789 5.65661C40.6393 5.18679 39.9549 4.93309 38.9949 4.93309C36.1368 4.93309 34.552 7.26338 34.552 10.0228C34.552 13.0766 36.3138 14.6818 38.702 14.6818C39.7983 14.6818 40.6205 14.3498 41.6384 13.761C41.8921 13.6044 42.0879 13.7422 41.9908 13.9771C41.5601 14.9559 40.6408 15.4648 39.1719 15.4648H35.2379V18.6361H35.2363ZM28.0904 12.0587C26.9362 12.0587 26.0937 11.2365 26.0937 10.0823C26.0937 8.92811 26.9347 8.10436 28.0904 8.10436C29.2462 8.10436 30.0871 8.92654 30.0871 10.0823C30.0871 11.238 29.2462 12.0587 28.0904 12.0587ZM27.0145 15.2299C28.0513 15.2299 28.698 14.8979 29.6768 14.2903C29.8522 14.1728 30.0683 14.212 29.9697 14.4657L29.716 15.0733H33.8065V1.3703H29.9697V5.57987C29.9697 5.73648 29.7943 5.73648 29.6377 5.65817C28.7763 5.20715 28.1108 4.93465 27.132 4.93465C24.4509 4.93465 22.6108 6.95174 22.6108 10.0447C22.6108 13.1377 24.4697 15.2315 27.0145 15.2315V15.2299ZM16.4233 12.0587C15.2691 12.0587 14.4265 11.2365 14.4265 10.0823C14.4265 8.92811 15.2675 8.10436 16.4233 8.10436C17.579 8.10436 18.42 8.92654 18.42 10.0823C18.42 11.238 17.579 12.0587 16.4233 12.0587ZM16.4233 15.2299C19.6525 15.2299 21.9045 13.1158 21.9045 10.0807C21.9045 7.0457 19.6541 4.93152 16.4233 4.93152C13.1925 4.93152 10.9421 7.0457 10.9421 10.0807C10.9421 13.1158 13.1925 15.2299 16.4233 15.2299ZM2.48534 15.0733H10.0807V7.77079L2.6623 12.2732C2.38824 12.4486 2.05624 12.1761 2.19248 11.8629L6.46 1.3703H0V12.588C0 14.0366 1.03673 15.0749 2.48534 15.0749V15.0733Z"/></svg></div>

    <div class="ldg-modal__tag">
      <div class="ldg-tag" role="img" aria-label="50% off - Halloween Promo"></div>
    </div>

    <div class="ldg-modal__in">
      <h2 class="ldg-modal__h">Treat yourself<br>to 50% off</h2>

      <p class="ldg-modal__sub">Let the admin haunt someone else. Run your rental from one place at half price.</p>

      <div class="ldg-modal__row">
        <div class="ldg-swap">
          <a class="ldg-btn" href="__CTA_POPUP__">Claim 50% off</a>
          <a class="ldg-round" href="__CTA_POPUP__" aria-label="Claim 50% off">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="ldg-coupon">
          <span class="ldg-coupon__label">Code</span>
          <button class="ldg-coupon__code" type="button" data-ldg-copy="TREAT26"
            data-ldg-copied="Copied!" data-ldg-copy-fail="Copy failed" aria-label="Copy coupon code TREAT26">
            <span data-ldg-copy-label>TREAT26</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0012.5 3H5.5A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15"/></svg>
          </button>
        </div>
      </div>

      <p class="ldg-modal__fine">Use code <b class="ldg-code">TREAT26</b> at checkout. For new customers on yearly and bi-yearly Professional and Ultimate plans. <a href="https://use.lodgify.com/hubfs/Promos/New_Customers_Promo_TC.pdf" target="_blank" rel="noopener">T&amp;Cs apply</a>.</p>
    </div>

    <div class="ldg-timer">
      <span class="ldg-timer__lab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
        Offer ends in
      </span>
      <div class="ldg-count">
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">18</span><span class="ldg-count__lab">Days</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">16</span><span class="ldg-count__lab">Hours</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">22</span><span class="ldg-count__lab">Mins</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">29</span><span class="ldg-count__lab">Secs</span></div>
      </div>
      <span class="ldg-timer__rule" aria-hidden="true"></span>
      <p class="ldg-timer__ends">Ends <b>Mon, November 2</b><br class="ldg-brk"> 11:59 PM PT</p>
      <div class="ldg-timer__stack">
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21.5 9l-5 4.7 1.4 7L12 17.3 6.1 20.7l1.4-7L2.5 9l6.9-.4z"/></svg></span>
          <span><b>4.8/5</b> from 5,000+ reviews</span>
        </span>
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16.2 9"/></svg></span>
          <span>Built for hosts <b>in the US and Canada</b></span>
        </span>
      </div>
    </div>
  </div>
</div>
</div>`,
      css: ''
    },
    fr: {
      bar: `<div class="ldg ldg-bar" id="ldgHalloweenBar" data-ldg-countdown role="region" aria-label="Offrez-vous 50 % de rabais" lang="fr">
  <div class="ldg-bar__in">
    <button class="ldg-bar__tag ldg-bar__tag--copy" type="button" data-ldg-copy="TREAT26"
      data-ldg-copied="Copié !" data-ldg-copy-fail="Échec de la copie" aria-label="Copier le code TREAT26">
      <span class="ldg-bar__tagtxt"><span class="ldg-bar__idle">Code: TREAT26</span><span class="ldg-bar__flash" data-ldg-copy-label aria-hidden="true">TREAT26</span></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0012.5 3H5.5A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15"/></svg>
    </button>

    <p class="ldg-bar__msg"><strong>Offrez-vous 50 % de rabais</strong><span class="ldg-bar__mcode"> — <span class="ldg-code">TREAT26</span></span></p>

    <a class="ldg-bar__cta" href="__CTA__">
      <span>Profiter de 50&nbsp;% de rabais</span>
      <span class="ldg-bar__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
      </span>
    </a>

    <div class="ldg-count">
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">18</span><span class="ldg-count__lab">Jours</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">16</span><span class="ldg-count__lab">Heures</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">22</span><span class="ldg-count__lab">Min</span></div>
      <span class="ldg-bar__sep" aria-hidden="true">:</span>
      <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">29</span><span class="ldg-count__lab">Sec</span></div>
    </div>
  </div>

  <button class="ldg-bar__close" type="button" data-ldg-dismiss="bar" aria-label="Masquer l'offre">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
</div>`,
      modal: `<div class="ldg-overlay ldg-hide" id="ldgHalloweenModal" role="dialog" aria-modal="true" aria-label="Offrez-vous 50 % de rabais">
<!-- .ldg-modal__frame is the CSS container the breakpoints query, and
     data-ldg-popup is what the Custom CSS and the behaviour key off.
     Remove neither. -->
<div class="ldg ldg-modal__frame" data-ldg-popup lang="fr">
  <div class="ldg-modal__box ldg-modal--panel">
    <div class="ldg-modal__bg" aria-hidden="true"></div>
    <div class="ldg-modal__panel" aria-hidden="true"></div>
    <div class="ldg-modal__scrim" aria-hidden="true"></div>

    <button class="ldg-modal__close" type="button" data-ldg-dismiss="modal" aria-label="Fermer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>

    <div class="ldg-modal__logo"><svg viewBox="0 0 71 19" fill="currentColor" role="img" aria-label="Lodgify"><path d="M61.4287 18.6361H65.2264L70.9221 5.08969H66.4792L65.3642 10.4143C65.2859 10.8246 64.8161 10.845 64.719 10.3955L63.5444 5.08969H59.0624C57.2035 5.08969 56.6162 4.52278 56.6162 3.68024C56.6162 2.8377 57.1048 2.34909 57.927 2.34909C58.8854 2.34909 59.3756 3.11333 59.4727 3.876H63.2312C62.6643 1.38909 60.8242 0 58.1807 0C55.2647 0 53.4434 1.70387 53.4434 4.30666V5.08969H51.3292V8.26097H53.4434V15.0733H57.2802V8.27976H61.2141L60.0208 6.73249L62.8006 14.1525C62.9572 14.544 62.9368 14.9747 62.7818 15.3865L61.4318 18.6361H61.4287ZM48.5275 4.58072C49.76 4.58072 50.6417 3.81649 50.6417 2.72025C50.6417 1.624 49.7615 0.859767 48.5275 0.859767C47.2934 0.859767 46.4133 1.624 46.4133 2.72025C46.4133 3.81649 47.2934 4.58072 48.5275 4.58072ZM46.6091 15.0733H50.4459V5.08969H46.6091V15.0733ZM40.0316 12.0587C38.8774 12.0587 38.0349 11.2365 38.0349 10.0823C38.0349 8.92811 38.8759 8.10436 40.0316 8.10436C41.1874 8.10436 42.0283 8.92654 42.0283 10.0823C42.0283 11.238 41.1874 12.0587 40.0316 12.0587ZM35.2363 18.6361H39.8954C43.3016 18.6361 45.7477 16.3841 45.7477 13.2144V5.08969H41.9109V5.5783C41.9109 5.73491 41.7355 5.73491 41.5789 5.65661C40.6393 5.18679 39.9549 4.93309 38.9949 4.93309C36.1368 4.93309 34.552 7.26338 34.552 10.0228C34.552 13.0766 36.3138 14.6818 38.702 14.6818C39.7983 14.6818 40.6205 14.3498 41.6384 13.761C41.8921 13.6044 42.0879 13.7422 41.9908 13.9771C41.5601 14.9559 40.6408 15.4648 39.1719 15.4648H35.2379V18.6361H35.2363ZM28.0904 12.0587C26.9362 12.0587 26.0937 11.2365 26.0937 10.0823C26.0937 8.92811 26.9347 8.10436 28.0904 8.10436C29.2462 8.10436 30.0871 8.92654 30.0871 10.0823C30.0871 11.238 29.2462 12.0587 28.0904 12.0587ZM27.0145 15.2299C28.0513 15.2299 28.698 14.8979 29.6768 14.2903C29.8522 14.1728 30.0683 14.212 29.9697 14.4657L29.716 15.0733H33.8065V1.3703H29.9697V5.57987C29.9697 5.73648 29.7943 5.73648 29.6377 5.65817C28.7763 5.20715 28.1108 4.93465 27.132 4.93465C24.4509 4.93465 22.6108 6.95174 22.6108 10.0447C22.6108 13.1377 24.4697 15.2315 27.0145 15.2315V15.2299ZM16.4233 12.0587C15.2691 12.0587 14.4265 11.2365 14.4265 10.0823C14.4265 8.92811 15.2675 8.10436 16.4233 8.10436C17.579 8.10436 18.42 8.92654 18.42 10.0823C18.42 11.238 17.579 12.0587 16.4233 12.0587ZM16.4233 15.2299C19.6525 15.2299 21.9045 13.1158 21.9045 10.0807C21.9045 7.0457 19.6541 4.93152 16.4233 4.93152C13.1925 4.93152 10.9421 7.0457 10.9421 10.0807C10.9421 13.1158 13.1925 15.2299 16.4233 15.2299ZM2.48534 15.0733H10.0807V7.77079L2.6623 12.2732C2.38824 12.4486 2.05624 12.1761 2.19248 11.8629L6.46 1.3703H0V12.588C0 14.0366 1.03673 15.0749 2.48534 15.0749V15.0733Z"/></svg></div>

    <div class="ldg-modal__tag">
      <div class="ldg-tag" role="img" aria-label="50 % de rabais - Promo Halloween"></div>
    </div>

    <div class="ldg-modal__in">
      <h2 class="ldg-modal__h">Offrez-vous<br>50&nbsp;% de rabais</h2>

      <p class="ldg-modal__sub">R&eacute;servations, calendriers et messages aux voyageurs au m&ecirc;me endroit, &agrave; moiti&eacute; prix pour l&rsquo;Halloween.</p>

      <div class="ldg-modal__row">
        <div class="ldg-swap">
          <a class="ldg-btn" href="__CTA_POPUP__">Profiter de 50&nbsp;% de rabais</a>
          <a class="ldg-round" href="__CTA_POPUP__" aria-label="Profiter de 50&nbsp;% de rabais">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="ldg-coupon">
          <span class="ldg-coupon__label">Code</span>
          <button class="ldg-coupon__code" type="button" data-ldg-copy="TREAT26"
            data-ldg-copied="Copié !" data-ldg-copy-fail="Échec de la copie" aria-label="Copier le code TREAT26">
            <span data-ldg-copy-label>TREAT26</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0012.5 3H5.5A2.5 2.5 0 003 5.5v7A2.5 2.5 0 005.5 15"/></svg>
          </button>
        </div>
      </div>

      <p class="ldg-modal__fine">Code <b class="ldg-code">TREAT26</b> au paiement. Nouveaux clients, Plans Professional et Ultimate annuels ou bisannuels. <a href="https://use.lodgify.com/hubfs/Promos/New_Customers_Promo_TC.pdf" target="_blank" rel="noopener">Conditions applicables</a>.</p>
    </div>

    <div class="ldg-timer">
      <span class="ldg-timer__lab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
        Prend fin dans
      </span>
      <div class="ldg-count">
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="days">18</span><span class="ldg-count__lab">Jours</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="hours">16</span><span class="ldg-count__lab">Heures</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="minutes">22</span><span class="ldg-count__lab">Min</span></div>
        <div class="ldg-count__unit"><span class="ldg-count__num" data-unit="seconds">29</span><span class="ldg-count__lab">Sec</span></div>
      </div>
      <span class="ldg-timer__rule" aria-hidden="true"></span>
      <p class="ldg-timer__ends">Jusqu'au <b>lundi 2 novembre</b><br class="ldg-brk"> 23 h 59 HNP</p>
      <div class="ldg-timer__stack">
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6L21.5 9l-5 4.7 1.4 7L12 17.3 6.1 20.7l1.4-7L2.5 9l6.9-.4z"/></svg></span>
          <span><b>4,8/5</b> selon plus de 5&nbsp;000 avis</span>
        </span>
        <span class="ldg-chip">
          <span class="ldg-chip__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16.2 9"/></svg></span>
          <span>Con&ccedil;u pour les h&ocirc;tes <b>au Canada</b></span>
        </span>
      </div>
    </div>
  </div>
</div>
</div>`,
      css: `/* fr runs longer than English: the only design difference */
.ldg-modal__h{font-size:clamp(30px,3.2vw,40px)}
.ldg-modal__sub{max-width:40ch}
.ldg-timer{gap:16px;padding:15px 22px 15px 20px}
.ldg-modal__box .ldg-timer{left:16px;right:16px;bottom:18px}
`
    }
  };

  /* =====================================================================
     4 · STYLES
     ===================================================================== */
  var CSS = `
/* ---------- scoped reset, emitted BEFORE the component CSS ----------------
   Two passes at deliberately different strengths.
     1. :where(...) at zero specificity for box model leftovers.
     2. Exactly ONE class of specificity for everything inherited, with the tag
        list inside :where() so the tags add nothing. That calibration is the
        point: it outranks lodgify.com's bare h2/p/a/button rules (0,0,1) and
        loses to every component rule, which carry at least one class and come
        later in the file.
   Pass 2 is what keeps .ldg-modal__h white -- the heading sets no colour of
   its own, so the site's global h2 rule would otherwise win it. */
:where(#ldgHalloweenBar,#ldgHalloweenBar *,#ldgHalloweenModal,#ldgHalloweenModal *){
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
:where(#ldgHalloweenBar button,#ldgHalloweenModal button){cursor:pointer}
:where(#ldgHalloweenBar svg,#ldgHalloweenModal svg){display:block;flex:0 0 auto}

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
  /* supporting copy: the site's own body face (lodgify.com loads GT Maru),
     falling back to the kit's body stack wherever it is absent */
  --ldg-copy:"GT Maru",Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --ldg-photo:url("__PHOTO__");
  --ldg-tagimg:url("__TAG__");
  --ldg-panel-ar:1800 / 1042;
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
  display:block;width:226px;aspect-ratio:516 / 237;
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
/*__VARIANT_CSS__*/
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
/* Phones: one line no longer fits in GT Maru, so break after the date. */
@container (max-width:420px){
  .ldg-brk{display:inline}
  .ldg-modal__box .ldg-timer__ends{white-space:normal}
}

/* Supporting copy in the site face: subtitle, small print, deadline line, chips. */
.ldg-modal__sub,.ldg-modal__fine,.ldg-modal__box .ldg-timer__ends,.ldg-modal__box .ldg-chip{
  font-family:var(--ldg-copy)}

/* Desktop strip, sized for GT Maru and the longer languages: a compact
   countdown and 12px supporting lines keep the right-hand chip ~20px clear of
   the frame. Measured with a font wider than GT Maru, so there is headroom. */
@container (min-width:901px){
  .ldg-modal__box .ldg-count{gap:6px}
  .ldg-modal__box .ldg-count__unit{min-width:46px;padding:7px 6px 6px;border-radius:12px}
  .ldg-modal__box .ldg-count__num{font-size:22px}
  .ldg-modal__box .ldg-count__lab{margin-top:4px;font-size:8px}
  .ldg-modal__box .ldg-timer{gap:12px}
  .ldg-modal__box .ldg-timer__ends{font-size:12px}
  .ldg-modal__box .ldg-timer__stack{padding-left:16px;gap:7px}
  .ldg-modal__box .ldg-chip{font-size:12px;gap:8px}
  .ldg-modal__box .ldg-chip__ico{width:18px}
  .ldg-modal__box .ldg-chip__ico svg{width:17px;height:17px}
}

/* Overrides that must beat the breakpoints above. */
/* LODGIFY SHOWCASE - the two placements the OptinMonster block does not carry
   (the site-wide top bar). Loaded
   AFTER the popup stylesheet, which already defines the variables and every
   shared component. Real @media here, not @container: this is a real page.
   Every shared-component override is scoped to .ldg-bar so the
   popup stays governed only by its own container queries. */

/* ---------- 1 - top bar ---------- */
.ldg-bar{position:relative;width:100%;background:var(--ldg-yellow);color:var(--ldg-ink)}
.ldg-bar__in{position:relative;max-width:1400px;margin:0 auto;min-height:64px;
  display:flex;align-items:center;justify-content:center;gap:26px;padding:8px 56px;flex-wrap:wrap}
.ldg-bar__tag{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;
  padding:8px 16px 8px 13px;border-radius:999px;background:var(--ldg-ink);color:var(--ldg-yellow);
  font-family:var(--ldg-display);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.ldg-bar__tag svg{width:14px;height:14px}
/* With a coupon the tag is a copy button: "Code: X" + copy icon. Both states
   share one grid cell, so the pill keeps its width when it flashes. */
.ldg-bar__tag--copy{border:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;
  line-height:1.2;transition:background-color .18s ease,transform .18s ease}
.ldg-bar__tag--copy:hover{background:#34372c}
.ldg-bar__tag--copy:active{transform:scale(.97)}
.ldg-bar__tag--copy:focus-visible{outline:2px solid var(--ldg-ink);outline-offset:2px}
.ldg-bar__tag--copy svg{width:15px;height:15px;opacity:.85}
.ldg-bar__tagtxt{display:inline-grid}
.ldg-bar__idle,.ldg-bar__flash{grid-area:1/1;text-align:center}
.ldg-bar__flash{visibility:hidden}
.ldg-bar__tag--copy.is-copied .ldg-bar__idle{visibility:hidden}
.ldg-bar__tag--copy.is-copied .ldg-bar__flash{visibility:visible;animation:ldgPop .42s cubic-bezier(.2,1.5,.35,1)}
/* the code repeats in the sentence only where the tag is hidden (phones) */
.ldg-bar__mcode{display:none}
.ldg-bar__msg{font-family:var(--ldg-copy);font-size:16px;line-height:1.35;margin:0;color:var(--ldg-ink)}
.ldg-bar__msg strong{font-size:18px;font-weight:700}
.ldg-bar__msg .ldg-code{font-weight:700;color:var(--ldg-ink)}
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
  .ldg-bar__mcode{display:inline}
  .ldg-bar__msg{font-size:13.5px;text-align:left;flex:1 1 auto}
  .ldg-bar__cta{font-size:14px}
  .ldg-bar__cta span{display:none}
}

/* ---------- 3 - the overlay the popup sits in on a real page ----------
   OptinMonster supplies this in the campaign; here we supply our own. */
.ldg-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
  padding:24px;overflow:auto;background:rgba(10,12,8,.6);backdrop-filter:blur(3px)}

/* Change 2: top bar colour */
.ldg-bar{background:#EEF4FD}
/* Phones: compact bar with the copy tag (the bar's own 620px breakpoint). The popup is
   never built there, see CONFIG.popupMinWidth. */
@media (max-width:620px){
  .ldg-bar__in{gap:10px}
  .ldg-bar .ldg-bar__tag--copy{display:inline-flex;order:0;gap:6px;padding:7px 11px 7px 10px;
    font-size:11px;letter-spacing:.06em}
  .ldg-bar .ldg-bar__tag--copy svg{width:13px;height:13px}
  .ldg-bar__mcode{display:none}
  .ldg-bar__msg{font-size:13px;flex:1 1 0;min-width:0}
  .ldg-bar__msg strong{font-size:13.5px}
}

/* ---------- host-page hardening (emitted AFTER the component CSS) ---------- */
#ldgHalloweenModal .ldg-modal__fine a{text-decoration:underline}
/* the heading inherits its colour; state it outright so nothing can win it */
#ldgHalloweenModal .ldg-modal__h{color:var(--ldg-white)}

#ldgHalloweenModal.ldg-overlay{z-index:2147483000;overscroll-behavior:contain;
  align-items:safe center;justify-items:center}
html.ldg-scroll-lock{overflow:hidden !important}

/* The bar pulls itself out of the host body's padding. width must be auto:
   .ldg-bar ships width:100%, and a block box with an explicit width ignores
   its right margin, so a negative left margin alone would shift the box over
   and leave the right edge short. width:auto absorbs both margins. */
#ldgHalloweenBar[data-ldg-bar="push"],#ldgHalloweenBar[data-ldg-bar="flow"]{
  position:relative;z-index:2147482000;width:auto;
  margin:calc(var(--ldg-bar-bleed,0px) * -1) calc(var(--ldg-bar-bleed,0px) * -1) var(--ldg-bar-bleed,0px)}
#ldgHalloweenBar[data-ldg-bar="sticky"]{position:sticky;top:0;z-index:2147482000}
#ldgHalloweenBar[data-ldg-bar="fixed"]{position:fixed;top:0;left:0;right:0;z-index:2147482000}

/* Optical centring for the bar countdown. .ldg-count__num carries
   line-height:1, so the digits' ascenders spill above their line box while the
   label below keeps its descender space: the box centres, the ink sits high.
   Measured at 2.75px on the German bar, whose countdown markup and type sizes
   are identical to this one. Not re-measured against the Halloween design --
   set CONFIG.barCountNudge to 0 if it looks wrong. */
#ldgHalloweenBar .ldg-count{position:relative;top:var(--ldg-count-nudge,0px)}

@media (prefers-reduced-motion:reduce){
  #ldgHalloweenBar *,#ldgHalloweenModal *{transition:none !important;animation:none !important}
}
`;

  /* =====================================================================
     5 · Helpers
     ===================================================================== */
  var END = new Date(CONFIG.deadline).getTime();
  var LOCALE = null;   // 'en' | 'fr', set at boot
  var V = null;        // COPY[LOCALE]
  function pick(v) { return (v && typeof v === 'object') ? v[LOCALE] : v; }
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
     6 · Country, then locale
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

  function pageLocale() {
    var forced = (qs.get('ldlang') || '').toLowerCase();
    if (forced) return forced.slice(0, 2);

    if (CONFIG.useHtmlLang) {
      var l = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (l) return l.slice(0, 2);   // authoritative when present
    }
    // no lang attribute: fall back to a /xx/ path prefix; none means English
    var m = window.location.pathname.match(/^\/([a-z]{2})(-[a-z]{2})?(\/|$)/i);
    return m ? m[1].toLowerCase() : 'en';
  }

  /* ---------------------------------------------------------------------
     Pushing the page down for the bar

     The bar sits in normal flow, so ordinary content moves down on its own.
     What does not move is anything taken out of flow and pinned to the top of
     the viewport -- a fixed or sticky navbar -- which would otherwise sit on
     top of the bar. Those get their `top` offset by the bar's height,
     shrinking back to 0 as the bar scrolls away so no gap is left behind.
     --------------------------------------------------------------------- */
  function findPinned() {
    var nodes = [];
    try {
      if (CONFIG.fixedHeaderSelector) {
        nodes = document.querySelectorAll(CONFIG.fixedHeaderSelector);
      } else if (document.elementsFromPoint) {
        nodes = document.elementsFromPoint(Math.round(window.innerWidth / 2), 1) || [];
      }
    } catch (e) { return []; }
    var out = [];
    [].forEach.call(nodes, function (el) {
      if (!el || el === document.body || el === document.documentElement) return;
      var cs;
      try { cs = window.getComputedStyle(el); } catch (e) { return; }
      if (!cs || (cs.position !== 'fixed' && cs.position !== 'sticky')) return;
      if (Math.abs(parseFloat(cs.top) || 0) > 1) return;
      if (out.indexOf(el) === -1) out.push(el);
    });
    return out;
  }

  function pushPinned(bar, pinned) {
    if (!pinned.length) return null;
    var prev = pinned.map(function (el) { return el.style.top; });
    var height = 0, frame = null;
    var raf = window.requestAnimationFrame
      ? function (fn) { return window.requestAnimationFrame(fn); }
      : function (fn) { return setTimeout(fn, 16); };
    var unraf = window.cancelAnimationFrame
      ? function (id) { window.cancelAnimationFrame(id); }
      : function (id) { clearTimeout(id); };

    function apply() {
      frame = null;
      var offset = Math.max(0, height - (window.scrollY || 0));
      pinned.forEach(function (el) { el.style.top = offset + 'px'; });
    }
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

  /* =====================================================================
     7 · Render
     ===================================================================== */
  // Desktop = a hover-capable pointer AND a viewport at least popupMinWidth
  // wide. Touch devices have no exit intent to read, and a narrowed browser
  // window is treated the same as a tablet.
  function isDesktop() {
    var hoverNone = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
    return !hoverNone && window.innerWidth >= CONFIG.popupMinWidth;
  }

  function mount() {
    var style = document.createElement('style');
    style.id = 'ldg-halloween-css';
    style.textContent = CSS.replace('/*__VARIANT_CSS__*/', function () { return V.css; })
                          .replace('__PHOTO__', function () { return CONFIG.photoUrl; })
                          .replace('__TAG__', function () { return pick(CONFIG.tagUrl); })
      + (CONFIG.extraCSS ? '\n\n/* CONFIG.extraCSS */\n' + CONFIG.extraCSS : '');
    document.head.appendChild(style);

    // Clear the competing banner first, so the bar's push logic never sees it
    // as a pinned header. A stylesheet rather than an inline style, so it also
    // holds if the host renders the banner after this runs.
    if (CONFIG.hideSelector) {
      var hideStyle = document.createElement('style');
      hideStyle.id = style.id + '-hide';
      hideStyle.textContent = CONFIG.hideSelector + '{display:none !important}';
      document.head.appendChild(hideStyle);
      setTimeout(function () {
        if (hideStyle.parentNode) hideStyle.parentNode.removeChild(hideStyle);
      }, Math.max(0, Math.min(END - Date.now(), 2147483647)));
    }

    function build(html) {
      var host = document.createElement('div');
      host.innerHTML = html.split('__CTA__').join(pick(CONFIG.ctaUrl))
                           .split('__CTA_POPUP__').join(pick(CONFIG.popupCtaUrl) || pick(CONFIG.ctaUrl));
      return host.firstElementChild;
    }

    /* ---- top bar ---- */
    var bar = null;
    var unpush = null;
    if (CONFIG.showBar && !barDismissed()) {
      bar = build(V.bar);
      bar.setAttribute('data-ldg-bar', CONFIG.barMode);
      bar.style.setProperty('--ldg-bar-bleed', (CONFIG.barBleed || 0) + 'px');
      bar.style.setProperty('--ldg-count-nudge', (CONFIG.barCountNudge || 0) + 'px');
      var pinned = (CONFIG.barMode === 'push') ? findPinned() : [];
      document.body.insertBefore(bar, document.body.firstChild);
      if (CONFIG.barMode === 'push') unpush = pushPinned(bar, pinned);
    }

    /* ---- popup ---- */
    var modal = null;
    // Desktop only: phones and tablets get the bar and no popup.
    if (CONFIG.showPopup && isDesktop() && !popupClosed()) {
      modal = build(V.modal);
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
      if (!modal || modalOpen || popupClosed() || expired() || !isDesktop()) return;
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

    // An open popup does not survive the window being shrunk below desktop.
    // Silent close: it is not marked as dismissed for the session.
    if (modal) {
      window.addEventListener('resize', function () {
        if (modalOpen && !isDesktop()) closeModal(true);
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();     // backdrop only
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalOpen) closeModal();
      });
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
       Ported from the design file as-is. The per-locale strings live in
       data-ldg-copied / data-ldg-copy-fail on the buttons, so nothing is
       hardcoded here. The is-copied class drives the pill's grid swap in the
       bar, which is why the class is toggled off and reflowed before being
       re-added: without that the animation will not replay on a second click. */
    var copyTimers = new WeakMap();
    document.addEventListener('click', function (e) {
      if (!(e.target instanceof Element)) return;
      var btn = e.target.closest('[data-ldg-copy]');
      if (!btn) return;
      e.preventDefault();
      var code   = btn.getAttribute('data-ldg-copy');
      var okMsg  = btn.getAttribute('data-ldg-copied') || 'Copied!';
      var badMsg = btn.getAttribute('data-ldg-copy-fail') || 'Copy failed';
      var label  = btn.querySelector('[data-ldg-copy-label]');
      // remember the authored aria-label so it is restored in any language
      if (!btn.hasAttribute('data-ldg-aria')) btn.setAttribute('data-ldg-aria', btn.getAttribute('aria-label') || '');
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
          btn.setAttribute('aria-label', btn.getAttribute('data-ldg-aria'));
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

    function on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      listeners.push([target, type, fn, opts]);
    }
    function disarm() {
      armed = false;
      listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      listeners = [];
    }

    function onMouseOut(e) {
      if (!armed) return;
      if (e.clientY > CONFIG.exitMargin) return;   // not through the top edge
      if (e.relatedTarget || e.toElement) return;  // moved into another element
      openModal();
    }

    function arm() {
      if (!modal || popupClosed() || expired()) return;
      armed = true;
      on(document, 'mouseout', onMouseOut);
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
  if (document.getElementById('ldgHalloweenBar') || document.getElementById('ldgHalloweenModal')) return;
  LOCALE = pageLocale();
  V = COPY[LOCALE];
  if (!V) return;   // cheap gate first: no variant for this locale, no lookup

  resolveCountry().then(function (country) {
    if ((CONFIG.countries[LOCALE] || []).indexOf(country) === -1) return;
    ready(mount);
  });
})();
