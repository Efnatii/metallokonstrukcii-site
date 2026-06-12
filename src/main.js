(function () {
  document.documentElement.classList.add('js');

  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const officePoint = encodeURIComponent('30.425277,59.879804');

  const defaults = {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl: 'https://b2e-metallokonstrukcii.example/',
    phone: '+79650578270',
    phoneDisplay: '+7 (965) 057-82-70',
    phoneHref: 'tel:+79650578270',
    workHours: 'Пн-Пт 09:00 - 18:00',
    email: 'zakaz@b2energy.ru',
    emailHref: 'mailto:zakaz@b2energy.ru',
    maxUrl: 'https://max.ru/u/f9LHodD0cOIq9CnGVeR2XIVeHPu_GpeOl3tdE_eGIeC3kbz6i8FikJr_4IM',
    address: defaultAddress,
    yandexMapUrl: 'https://yandex.ru/maps/-/CPSAzCMe',
    yandexMapEmbedUrl: `https://yandex.ru/map-widget/v1/?ll=${officePoint}&mode=whatshere&whatshere%5Bpoint%5D=${officePoint}&whatshere%5Bzoom%5D=17&z=17`,
    rbcProfileUrl: 'https://companies.rbc.ru/amp/ogrn/1247800091098/',
    rusprofileUrl: 'https://www.rusprofile.ru/id/1247800091098',
    catalogUrl: './assets/documents/b2e-metallokonstrukcii-catalog.pdf',
    leadEndpoint: '/api/leads',
    statsEndpoint: '/api/stats'
  };

  const config = { ...defaults, ...(window.B2E_CONFIG || {}) };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setupAdaptiveEffects() {
    const root = document.documentElement;
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const getCoreCount = () => navigator.hardwareConcurrency || 4;
    const getMemory = () => navigator.deviceMemory || 4;
    let lockedByRuntime = false;

    const setEffectsMode = (rich, reason) => {
      root.classList.toggle('effects-rich', rich);
      root.classList.toggle('effects-reduced', !rich);
      root.dataset.effectsMode = rich ? 'rich' : 'reduced';
      root.dataset.effectsReason = reason;
    };

    const prefersReducedMotion = () => Boolean(motionQuery?.matches);
    const hasLimitedConnection = () => {
      const effectiveType = connection?.effectiveType || '';

      return Boolean(connection?.saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
    };

    const getHardwareTier = () => {
      const cores = getCoreCount();
      const memory = getMemory();

      if (cores <= 2 || memory <= 2) {
        return 'low';
      }

      if (cores <= 4 || memory <= 4) {
        return 'balanced';
      }

      return 'high';
    };

    const getStaticMode = () => {
      if (prefersReducedMotion()) {
        return { rich: false, reason: 'reduced-motion' };
      }

      if (hasLimitedConnection()) {
        return { rich: false, reason: 'limited-connection' };
      }

      const tier = getHardwareTier();

      if (tier === 'low') {
        return { rich: false, reason: 'low-hardware' };
      }

      return { rich: true, reason: `${tier}-hardware` };
    };

    const applyStaticMode = () => {
      if (lockedByRuntime) {
        return;
      }

      const mode = getStaticMode();
      setEffectsMode(mode.rich, mode.reason);
    };

    const sampleFramePacing = () => {
      if (!root.classList.contains('effects-rich')) {
        return;
      }

      const samples = [];
      let previous = performance.now();

      const measure = (now) => {
        samples.push(now - previous);
        previous = now;

        if (samples.length < 44) {
          window.requestAnimationFrame(measure);
          return;
        }

        const slowFrames = samples.filter((duration) => duration > 24).length;
        const averageFrame = samples.reduce((sum, duration) => sum + duration, 0) / samples.length;

        if (slowFrames > 12 || averageFrame > 22) {
          lockedByRuntime = true;
          setEffectsMode(false, 'frame-pacing');
        } else {
          setEffectsMode(true, 'frame-pacing-ok');
        }
      };

      window.requestAnimationFrame(measure);
    };

    const resetAdaptiveMode = () => {
      lockedByRuntime = false;
      applyStaticMode();

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(sampleFramePacing, { timeout: 1800 });
      } else {
        window.setTimeout(sampleFramePacing, 900);
      }
    };

    applyStaticMode();

    if ('PerformanceObserver' in window) {
      try {
        let longTaskCount = 0;
        const observer = new PerformanceObserver((list) => {
          if (!root.classList.contains('effects-rich')) {
            return;
          }

          const entries = list.getEntries();
          longTaskCount += entries.filter((entry) => entry.duration > 180).length;

          if (entries.some((entry) => entry.duration > 320) || longTaskCount >= 2) {
            lockedByRuntime = true;
            setEffectsMode(false, 'long-task');
            observer.disconnect();
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
        window.setTimeout(() => observer.disconnect(), 15000);
      } catch {
        // The longtask entry type is not supported in every browser.
      }
    }

    motionQuery?.addEventListener?.('change', resetAdaptiveMode);
    connection?.addEventListener?.('change', resetAdaptiveMode);
    resetAdaptiveMode();
  }

  function formatPhoneDisplay(value) {
    const digits = String(value).replace(/\D/g, '');
    const normalized = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits;

    if (normalized.length === 11 && normalized.startsWith('7')) {
      return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
    }

    if (normalized.length === 10) {
      return `+7 (${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 8)}-${normalized.slice(8, 10)}`;
    }

    return String(value);
  }

  config.phoneDisplay = formatPhoneDisplay(config.phoneDisplay || config.phone);

  function applyConfig() {
    $$('[data-config-text]').forEach((node) => {
      const key = node.dataset.configText;
      if (config[key]) {
        node.textContent = config[key];
      }
    });

    $$('[data-config-href]').forEach((node) => {
      const key = node.dataset.configHref;
      if (config[key]) {
        node.setAttribute('href', config[key]);
      }
    });

    $$('[data-config-src]').forEach((node) => {
      const key = node.dataset.configSrc;
      if (config[key]) {
        if (node.dataset.mapLazy === 'true') {
          node.dataset.resolvedSrc = config[key];
        } else {
          node.setAttribute('src', config[key]);
        }
      }
    });

    const canonical = $('link[rel="canonical"]');
    if (canonical && config.siteUrl) {
      canonical.setAttribute('href', config.siteUrl);
    }
  }

  function setupDesktopStage() {
    const shell = $('[data-site-stage-shell]');
    const stage = $('[data-site-stage]');
    const root = document.documentElement;
    const desktopQuery = window.matchMedia('(min-width: 1121px)');
    const designWidth = 1519;
    const maxUpscale = 1.32;
    let frameRequest = 0;
    let anchorScrollTimer = 0;
    let anchorScrollSequence = 0;
    const anchorScrollTimeouts = new Set();

    if (!shell || !stage) {
      return;
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const getScale = () => window.innerWidth / designWidth;

    const syncStage = () => {
      frameRequest = 0;

      if (!desktopQuery.matches) {
        root.classList.remove('site-stage-active');
        root.style.removeProperty('--site-stage-scale');
        root.style.removeProperty('--site-stage-offset-x');
        root.style.removeProperty('--site-stage-height');
        root.style.removeProperty('--site-stage-width');
        root.style.removeProperty('--site-action-offset');
        shell.style.removeProperty('height');
        return;
      }

      const widthScale = Math.min(maxUpscale, getScale());
      const currentScale = Number(root.style.getPropertyValue('--site-stage-scale')) || 1;
      const header = $('.site-header', stage);
      const hero = $('.hero', stage);
      const firstScreenHeight = [header, hero].reduce((height, node) => {
        if (!node) {
          return height;
        }

        return height + (node.getBoundingClientRect().height / currentScale);
      }, 0);
      const heightScale = firstScreenHeight > 0
        ? Math.max(0.6, window.innerHeight / firstScreenHeight)
        : widthScale;
      const scale = Math.min(widthScale, heightScale);
      const stageWidth = Math.ceil(window.innerWidth / scale);

      root.classList.add('site-stage-active');
      root.style.setProperty('--site-stage-scale', scale.toFixed(6));
      root.style.setProperty('--site-stage-offset-x', '0px');
      root.style.setProperty('--site-stage-width', `${stageWidth}px`);
      root.style.setProperty('--site-action-offset', `${Math.max(14, 22 * scale).toFixed(2)}px`);

      const scaledHeight = Math.ceil(stage.scrollHeight * scale);

      root.style.setProperty('--site-stage-height', `${scaledHeight}px`);
      shell.style.height = `${scaledHeight}px`;
    };

    const scheduleSync = () => {
      if (!frameRequest) {
        frameRequest = window.requestAnimationFrame(syncStage);
      }
    };

    const getHashTarget = (hash) => {
      if (!hash || hash === '#') {
        return null;
      }

      const id = decodeURIComponent(hash.slice(1));
      return document.getElementById(id);
    };

    const getAnchorOffset = (target) => {
      if (!target || target.matches('.site-header')) {
        return 0;
      }

      const header = $('.site-header');
      const headerHeight = header?.getBoundingClientRect().height || 0;

      return Math.ceil(headerHeight);
    };

    const getTargetTransformY = (target) => {
      const transform = getComputedStyle(target).transform;

      if (!transform || transform === 'none') {
        return 0;
      }

      const stageScale = root.classList.contains('site-stage-active')
        ? Number(root.style.getPropertyValue('--site-stage-scale')) || 1
        : 1;

      try {
        return new DOMMatrixReadOnly(transform).m42 * stageScale;
      } catch {
        const matrix = transform.match(/^matrix\(([^)]+)\)$/);

        if (!matrix) {
          return 0;
        }

        const values = matrix[1].split(',').map((value) => Number(value.trim()));

        return (values[5] || 0) * stageScale;
      }
    };

    const getHashScrollTop = (target) => {
      if (target.matches('.site-header')) {
        return 0;
      }

      const targetTop = target.getBoundingClientRect().top - getTargetTransformY(target);
      const rawTop = window.scrollY + targetTop - getAnchorOffset(target);
      const scrollingElement = document.scrollingElement || document.documentElement;
      const maxTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);

      return Math.min(maxTop, Math.max(0, Math.round(rawTop)));
    };

    const clearAnchorScrollTimers = () => {
      window.clearTimeout(anchorScrollTimer);
      anchorScrollTimeouts.forEach((timer) => window.clearTimeout(timer));
      anchorScrollTimeouts.clear();
    };

    const finishAnchorScroll = () => {
      clearAnchorScrollTimers();
      root.dataset.anchorScrolling = 'false';
    };

    const cancelAnchorScroll = () => {
      anchorScrollSequence += 1;
      window.scrollTo({
        top: window.scrollY,
        behavior: 'auto'
      });
      finishAnchorScroll();
    };

    const finishAnchorScrollWhenSettled = (sequence, timeout = 2600) => {
      const startedAt = performance.now();
      let previousY = window.scrollY;
      let stableFrames = 0;

      const tick = (now) => {
        if (anchorScrollSequence !== sequence) {
          return;
        }

        const currentY = window.scrollY;
        const isStable = Math.abs(currentY - previousY) <= 0.5;
        stableFrames = isStable ? stableFrames + 1 : 0;
        previousY = currentY;

        if ((stableFrames >= 10 && now - startedAt > 220) || now - startedAt >= timeout) {
          finishAnchorScroll();
          return;
        }

        window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    };

    const alignHashScroll = (hash) => {
      const target = getHashTarget(hash);
      if (!target) {
        return false;
      }

      syncStage();
      $('.site-header')?.classList.remove('is-hidden');

      const top = getHashScrollTop(target);

      window.scrollTo({
        top,
        behavior: 'auto'
      });
      return true;
    };

    const settleHashScroll = (hash, delays) => {
      clearAnchorScrollTimers();
      const sequence = ++anchorScrollSequence;

      delays.forEach((delay) => {
        const timer = window.setTimeout(() => {
          anchorScrollTimeouts.delete(timer);
          if (anchorScrollSequence === sequence && window.location.hash === hash) {
            alignHashScroll(hash);
          }
        }, delay);
        anchorScrollTimeouts.add(timer);
      });
      anchorScrollTimer = window.setTimeout(() => {
        if (anchorScrollSequence === sequence) {
          finishAnchorScroll();
        }
      }, Math.max(...delays, 0) + 80);
    };

    const scrollToHash = (hash, behavior = 'auto') => {
      const target = getHashTarget(hash);
      if (!target) {
        return false;
      }

      syncStage();
      root.dataset.anchorScrolling = 'true';
      $('.site-header')?.classList.remove('is-hidden');

      window.scrollTo({
        top: getHashScrollTop(target),
        behavior
      });

      if (behavior === 'smooth') {
        clearAnchorScrollTimers();
        const sequence = ++anchorScrollSequence;
        finishAnchorScrollWhenSettled(sequence);
      } else {
        settleHashScroll(hash, [0, 80, 220]);
      }

      return true;
    };

    const correctCurrentHash = () => {
      if (!window.location.hash) {
        return;
      }

      scrollToHash(window.location.hash, 'auto');
    };

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) {
        return;
      }

      const clickTarget = event.target instanceof Element ? event.target : event.target?.parentElement;
      const link = clickTarget?.closest('a[href^="#"]');

      if (!link) {
        return;
      }

      const hash = link.getAttribute('href');

      if (!getHashTarget(hash)) {
        return;
      }

      event.preventDefault();
      history.pushState(null, '', hash);
      scrollToHash(hash, 'smooth');

      if (event.detail > 0 && link instanceof HTMLElement) {
        link.blur();
      }
    });

    const cancelAnchorScrollOnUserIntent = (event) => {
      if (root.dataset.anchorScrolling !== 'true') {
        return;
      }

      if (event.type === 'keydown') {
        const scrollKeys = ['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '];

        if (!scrollKeys.includes(event.key)) {
          return;
        }
      }

      cancelAnchorScroll();
    };

    window.addEventListener('hashchange', correctCurrentHash);
    window.addEventListener('wheel', cancelAnchorScrollOnUserIntent, { capture: true, passive: true });
    window.addEventListener('touchstart', cancelAnchorScrollOnUserIntent, { capture: true, passive: true });
    window.addEventListener('touchmove', cancelAnchorScrollOnUserIntent, { capture: true, passive: true });
    window.addEventListener('keydown', cancelAnchorScrollOnUserIntent, true);
    window.addEventListener('resize', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);
    desktopQuery.addEventListener?.('change', scheduleSync);
    window.addEventListener('load', () => {
      scheduleSync();
      if (window.location.hash) {
        [0, 80, 180, 360, 720, 1200].forEach((delay) => {
          window.setTimeout(correctCurrentHash, delay);
        });
      }
    });

    $$('img').forEach((image) => {
      if (!image.complete) {
        image.addEventListener('load', scheduleSync, { once: true });
        image.addEventListener('error', scheduleSync, { once: true });
      }
    });

    document.fonts?.ready.then(scheduleSync).catch(() => {});
    syncStage();

    if (window.location.hash) {
      window.requestAnimationFrame(correctCurrentHash);
    }
  }

  function setupNavigation() {
    const navToggle = $('.nav-toggle');
    const nav = $('.site-nav');
    const actions = $('.header-actions');

    navToggle?.addEventListener('click', () => {
      const isOpen = nav?.classList.toggle('is-open');
      actions?.classList.toggle('is-open', Boolean(isOpen));
      navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    });

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        nav?.classList.remove('is-open');
        actions?.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupHeaderReveal() {
    const root = document.documentElement;
    const header = $('.site-header');
    const navToggle = $('.nav-toggle');
    const nav = $('.site-nav');
    const actions = $('.header-actions');

    if (!header) {
      return;
    }

    let lastScrollY = Math.max(0, window.scrollY);
    let frameRequest = 0;

    const isMenuOpen = () =>
      nav?.classList.contains('is-open') ||
      actions?.classList.contains('is-open') ||
      navToggle?.getAttribute('aria-expanded') === 'true';

    const showHeader = () => {
      header.classList.remove('is-hidden');
    };

    const syncHeader = () => {
      frameRequest = 0;

      const currentScrollY = Math.max(0, window.scrollY);
      const delta = currentScrollY - lastScrollY;
      const hideAfter = Math.max(96, header.offsetHeight + 16);

      if (
        root.dataset.anchorScrolling === 'true' ||
        root.classList.contains('production-tour-active') ||
        currentScrollY <= 4 ||
        isMenuOpen() ||
        header.contains(document.activeElement)
      ) {
        showHeader();
      } else if (delta > 8 && currentScrollY > hideAfter) {
        header.classList.add('is-hidden');
      } else if (delta < -8) {
        showHeader();
      }

      lastScrollY = currentScrollY;
    };

    const scheduleSync = () => {
      if (!frameRequest) {
        frameRequest = window.requestAnimationFrame(syncHeader);
      }
    };

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', () => {
      showHeader();
      lastScrollY = Math.max(0, window.scrollY);
    });
    header.addEventListener('focusin', showHeader);
    navToggle?.addEventListener('click', () => window.requestAnimationFrame(showHeader));
    syncHeader();
  }

  const visitStatsFormatter = new Intl.NumberFormat('ru-RU');

  function getMoscowDateKey(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const part = (type) => parts.find((item) => item.type === type)?.value || '';

      return `${part('year')}-${part('month')}-${part('day')}`;
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  function toVisitCount(value) {
    const count = Number(value);

    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }

  function normalizeVisitStats(value = {}) {
    return {
      today: toVisitCount(value.today),
      week: toVisitCount(value.week),
      month: toVisitCount(value.month),
      allTime: toVisitCount(value.allTime)
    };
  }

  function setVisitStats(stats) {
    const root = $('[data-visit-stats]');

    if (!root) {
      return;
    }

    const normalized = normalizeVisitStats(stats);

    $$('[data-visit-stat]', root).forEach((node) => {
      const key = node.dataset.visitStat;

      node.textContent = visitStatsFormatter.format(normalized[key] || 0);
    });
    root.setAttribute('aria-busy', 'false');
  }

  function setVisitStatsUnavailable() {
    const root = $('[data-visit-stats]');

    if (!root) {
      return;
    }

    $$('[data-visit-stat]', root).forEach((node) => {
      node.textContent = '-';
    });
    root.setAttribute('aria-busy', 'false');
    root.setAttribute('data-visit-stats-state', 'unavailable');
  }

  function canUseSessionStorage() {
    try {
      const key = 'b2eVisitStatsSessionTest';
      window.sessionStorage.setItem(key, '1');
      window.sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function shouldRecordVisit(todayKey) {
    if (!canUseSessionStorage()) {
      return true;
    }

    return window.sessionStorage.getItem(`b2eVisitRecorded:${todayKey}`) !== '1';
  }

  function markVisitRecorded(todayKey) {
    if (!canUseSessionStorage()) {
      return;
    }

    window.sessionStorage.setItem(`b2eVisitRecorded:${todayKey}`, '1');
  }

  function resolveStatsEndpoint() {
    const fallbackEndpoint = config.leadEndpoint ? `${config.leadEndpoint.replace(/\/$/, '')}/stats` : '';
    const endpoint = config.statsEndpoint || fallbackEndpoint;

    if (!endpoint) {
      return '';
    }

    try {
      return new URL(endpoint, window.location.href).href.replace(/\/$/, '');
    } catch {
      return '';
    }
  }

  async function readRemoteVisitStats(endpoint, record) {
    const response = await fetch(record ? `${endpoint}/visit` : endpoint, {
      method: record ? 'POST' : 'GET',
      headers: record ? { 'Content-Type': 'application/json' } : undefined
    });

    if (!response.ok) {
      throw new Error(`Stats endpoint responded ${response.status}`);
    }

    const payload = await response.json();
    const stats = payload.stats || payload;

    if (!stats || typeof stats !== 'object') {
      throw new Error('Stats endpoint returned an invalid payload');
    }

    return normalizeVisitStats(stats);
  }

  async function setupVisitStats() {
    const root = $('[data-visit-stats]');

    if (!root) {
      return;
    }

    const todayKey = getMoscowDateKey();
    const record = shouldRecordVisit(todayKey);
    const endpoint = resolveStatsEndpoint();

    if (endpoint) {
      try {
        const remoteStats = await readRemoteVisitStats(endpoint, record);

        setVisitStats(remoteStats);
        markVisitRecorded(todayKey);
        return;
      } catch (error) {
        // Static previews may not expose stats endpoints; fall back quietly.
      }
    }

    setVisitStatsUnavailable();
  }

  function setupFaqAccordion() {
    const root = $('#faq');

    if (!root) {
      return;
    }

    const items = $$('details.faq-item', root);

    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) {
          return;
        }

        items.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      });
    });
  }

  function setupModal() {
    const modal = $('#leadModal');
    const form = $('#leadForm');
    const close = $('.modal-close', modal);
    const successTemplate = $('#successTemplate');

    if (!modal || !form) {
      return;
    }

    const originalFormHtml = form.innerHTML;
    let isSubmitting = false;
    const syncModalLock = () => {
      document.body.classList.toggle('modal-open', Boolean(modal.open));
    };

    const isValidContact = (value) => {
      const contact = String(value || '').trim();
      const digits = contact.replace(/\D/g, '');
      const looksLikePhone = /^\+?[\d\s().-]{7,}$/.test(contact) && digits.length >= 7;
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

      return looksLikePhone || looksLikeEmail;
    };

    const setSubmitDisabled = (disabled) => {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = disabled;
      }
    };

    const showFormError = (message) => {
      const status = $('.form-status', form);
      if (status) {
        status.textContent = message;
      }
    };

    const readLeadError = async (response) => {
      try {
        const payload = await response.clone().json();
        if (payload?.error === 'Valid phone or email is required' || payload?.error === 'Valid phone is required') {
          return 'Укажите корректный телефон или email.';
        }
      } catch {
        // Ignore non-JSON error responses and use a generic message below.
      }

      return 'Не удалось отправить заявку. Проверьте контакт и попробуйте еще раз.';
    };

    const restoreForm = () => {
      if (!form.elements.namedItem('name')) {
        form.innerHTML = originalFormHtml;
      }

      isSubmitting = false;
      setSubmitDisabled(false);

      const status = $('.form-status', form);
      if (status) {
        status.textContent = '';
      }
    };

    const openModal = (options = {}) => {
      const modalOptions = typeof options === 'string' ? { objectType: options } : options;
      const objectType = String(modalOptions.objectType || '').trim();
      const message = String(modalOptions.message || '').trim();

      restoreForm();

      if (objectType && form.elements.objectType) {
        form.elements.objectType.value = objectType;
      }

      if (message && form.elements.message) {
        form.elements.message.value = message;
      }

      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', '');
      }

      syncModalLock();
      setTimeout(() => form.elements.name.focus(), 80);
    };

    const closeModal = () => {
      modal.close?.();
      modal.removeAttribute('open');
      syncModalLock();
    };

    $$('.callback-trigger').forEach((button) => {
      button.addEventListener('click', () => {
        const typeFromButton = button.dataset.objectType;
        openModal(typeFromButton);
      });
    });

    $$('[data-product-lead-trigger]').forEach((card) => {
      card.addEventListener('click', () => {
        const productName = $('h3', card)?.textContent.trim();
        if (!productName) {
          return;
        }

        openModal({
          objectType: productName,
          message: productName
        });
      });
    });

    close?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    modal.addEventListener('close', syncModalLock);
    modal.addEventListener('cancel', syncModalLock);
    window.addEventListener('pageshow', syncModalLock);
    syncModalLock();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = $('.form-status', form);
      if (status) {
        status.textContent = 'Отправляем заявку...';
      }

      const formData = new FormData(form);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        objectType: String(formData.get('objectType') || '').trim(),
        message: String(formData.get('message') || '').trim(),
        page: window.location.href,
        createdAt: new Date().toISOString()
      };

      try {
        if (isSubmitting) {
          return;
        }

        if (!isValidContact(payload.phone)) {
          showFormError('Укажите корректный телефон или email.');
          form.elements.phone.focus();
          return;
        }

        if (!config.leadEndpoint) {
          showFormError('Не настроена автоматическая отправка заявки. Позвоните нам по телефону в контактах.');
          return;
        }

        isSubmitting = true;
        setSubmitDisabled(true);

        const response = await fetch(config.leadEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const message = await readLeadError(response);
          console.error(new Error(`Endpoint responded ${response.status}`));
          showFormError(message);
          return;
        }

        if (successTemplate) {
          form.replaceChildren(successTemplate.content.cloneNode(true));
        }
      } catch (error) {
        showFormError('Не удалось отправить заявку. Проверьте соединение и попробуйте еще раз.');
        console.error(error);
      } finally {
        isSubmitting = false;
        setSubmitDisabled(false);
      }
    });
  }

  function setupFloatingActions() {
    const actions = $('.floating-actions');
    const phone = $('.phone-float');
    const max = $('.max-float');
    const expandPhone = () => phone?.classList.add('is-expanded');
    const collapsePhone = () => phone?.classList.remove('is-expanded');

    actions?.classList.add('is-max-pending');
    phone?.addEventListener('mouseenter', expandPhone);
    phone?.addEventListener('mouseleave', collapsePhone);
    phone?.addEventListener('focus', expandPhone);
    phone?.addEventListener('blur', collapsePhone);
    setTimeout(() => phone?.classList.add('is-visible'), 5000);
    setTimeout(() => {
      actions?.classList.remove('is-max-pending');
      max?.classList.add('is-visible');
    }, 10000);
    setTimeout(() => {
      expandPhone();
      setTimeout(collapsePhone, 10000);
    }, 25000);
  }

  function setupReveal() {
    const items = $$('.reveal');

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px 180px 0px',
        threshold: 0.01
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  const leafletAssets = {
    css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    script: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  };
  let leafletLoadPromise = null;

  function loadLeafletAssets() {
    if (window.L) {
      return Promise.resolve(window.L);
    }

    if (leafletLoadPromise) {
      return leafletLoadPromise;
    }

    leafletLoadPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${leafletAssets.css}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = leafletAssets.css;
        document.head.append(link);
      }

      const resolveWhenReady = () => {
        if (window.L) {
          resolve(window.L);
        } else {
          reject(new Error('Leaflet loaded without exposing window.L'));
        }
      };

      const existingScript = document.querySelector(`script[src="${leafletAssets.script}"]`);

      if (existingScript) {
        existingScript.addEventListener('load', resolveWhenReady, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = leafletAssets.script;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', resolveWhenReady, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });

    return leafletLoadPromise;
  }

  function setupLocationMap() {
    const mapNode = $('[data-locations-map]');
    const externalLinks = $$('[data-location-map-link]');
    const fallbackLink = $('[data-map-fallback-link]');
    const status = $('[data-map-status]');
    const wrap = mapNode?.closest('.map-wrap');
    const cards = $$('.location-card');
    const buttons = $$('.location-card button[data-map-lat][data-map-lng]');

    if (!mapNode || !buttons.length) {
      return;
    }

    const escapeHtml = (value) =>
      String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const isMapPoint = ([lat, lng]) =>
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180;

    const readBounds = (value) => {
      if (!value) {
        return null;
      }

      const points = value.split(';').map((point) => point.split(',').map(Number));
      const isValid = points.length === 2 && points.every(isMapPoint);

      return isValid ? points : null;
    };

    const readPolygons = (value) => {
      if (!value) {
        return [];
      }

      return value
        .split('|')
        .map((polygon) =>
          polygon
            .split(';')
            .map((point) => point.split(',').map(Number))
            .filter(isMapPoint)
        )
        .filter((polygon) => polygon.length >= 3);
    };

    const readGeoJsonUrl = (value) => {
      if (!value) {
        return '';
      }

      return new URL(value, document.baseURI).href;
    };

    const boundsFromPolygons = (polygons) => {
      const points = polygons.flat();

      if (!points.length) {
        return null;
      }

      const lats = points.map(([lat]) => lat);
      const lngs = points.map(([, lng]) => lng);

      return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ];
    };

    const readLocation = (button) => {
      const lat = Number(button.dataset.mapLat);
      const lng = Number(button.dataset.mapLng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      const polygons = readPolygons(button.dataset.mapPolygons);

      return {
        key: button.dataset.mapKey || button.dataset.mapName || `${lat},${lng}`,
        lat,
        lng,
        zoom: Number(button.dataset.mapZoom) || 13,
        name: button.dataset.mapName || button.textContent.trim(),
        kind: button.dataset.mapKind || 'Площадка',
        url: button.dataset.mapUrl || config.yandexMapUrl,
        coverage: button.dataset.mapCoverage === 'true',
        geojsonUrl: readGeoJsonUrl(button.dataset.mapGeojson),
        polygons,
        bounds: readBounds(button.dataset.mapBounds) || boundsFromPolygons(polygons)
      };
    };

    const setLinks = (location) => {
      if (location.url) {
        externalLinks.forEach((link) => link.setAttribute('href', location.url));
      }

      if (fallbackLink && location.url) {
        fallbackLink.setAttribute('href', location.url);
      }
    };

    const showMapStatus = () => {
      if (status) {
        status.hidden = false;
      }

      wrap?.classList.add('is-map-error');
    };

    const hideMapStatus = () => {
      if (status) {
        status.hidden = true;
      }

      wrap?.classList.remove('is-map-error');
    };

    const iconAsset = (name) => new URL(`./assets/icons/${name}`, document.baseURI).href;
    const createMarkerHtml = (active = false) => {
      const name = active ? 'map-marker-active' : 'map-marker';
      return `<img src="${iconAsset(`${name}.png`)}" srcset="${iconAsset(`${name}.png`)} 1x, ${iconAsset(`${name}@2x.png`)} 2x, ${iconAsset(`${name}@3x.png`)} 3x" width="30" height="42" alt="">`;
    };

    const createIcon = (active = false) =>
      window.L.divIcon({
        className: 'b2e-map-marker',
        html: createMarkerHtml(active),
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -38]
      });

    const locations = buttons
      .map((button) => ({ button, location: readLocation(button) }))
      .filter((item) => item.location);
    const activeItem =
      locations.find((item) => item.button.closest('.location-card')?.classList.contains('is-active')) ||
      locations[0];

    if (!activeItem) {
      return;
    }

    let map = null;
    const markers = new Map();
    let coverageLayer = null;
    let coverageItem = null;
    let coverageLoadPromise = null;
    let loadCoverageLayer = async () => coverageLayer;

    const initializeMap = () => {
      if (map) {
        return;
      }

      if (!window.L) {
        showMapStatus();
        return;
      }

      const start = activeItem.location;
      map = window.L.map(mapNode, {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView([start.lat, start.lng], start.zoom);
      map.attributionControl.setPrefix(false);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      locations.forEach(({ button, location }) => {
        if (location.coverage) {
          return;
        }

        const marker = window.L.marker([location.lat, location.lng], {
          icon: createIcon(location.key === start.key),
          title: `${location.kind}: ${location.name}`
        })
          .addTo(map)
          .bindPopup(
            `<strong>${escapeHtml(location.name)}</strong><span>${escapeHtml(location.kind)}</span>`
          );

        marker.on('click', () => activate(button, { move: false }));
        markers.set(location.key, marker);
      });

      coverageItem = locations.find(
        (item) => item.location.coverage && (item.location.geojsonUrl || item.location.polygons.length)
      );

      if (coverageItem) {
        const coverageStyle = {
          color: '#ffc400',
          weight: 2,
          opacity: .9,
          fillColor: '#ffc400',
          fillOpacity: .12
        };
        const coveragePopup = `<strong>${escapeHtml(coverageItem.location.kind)}</strong><span>${escapeHtml(coverageItem.location.name)}</span>`;
        const bindCoverageLayer = (layer) => {
          layer.bindPopup(coveragePopup);
          layer.on('click', () => activate(coverageItem.button, { move: false }));
          return layer;
        };
        const makePolygonLayer = () =>
          window.L.featureGroup(
            coverageItem.location.polygons.map((polygon) => window.L.polygon(polygon, coverageStyle))
          );

        loadCoverageLayer = async () => {
          if (coverageLayer || !coverageItem) {
            return coverageLayer;
          }

          if (!coverageItem.location.geojsonUrl) {
            coverageLayer = bindCoverageLayer(makePolygonLayer());
            return coverageLayer;
          }

          if (!coverageLoadPromise) {
            coverageLoadPromise = fetch(coverageItem.location.geojsonUrl)
              .then((response) => {
                if (!response.ok) {
                  throw new Error(`Coverage GeoJSON returned ${response.status}`);
                }

                return response.json();
              })
              .then((geojson) => {
                coverageLayer = bindCoverageLayer(window.L.geoJSON(geojson, { style: coverageStyle }));
                return coverageLayer;
              })
              .catch(() => {
                showMapStatus();
                return null;
              });
          }

          return coverageLoadPromise;
        };

        if (!coverageItem.location.geojsonUrl) {
          coverageLayer = bindCoverageLayer(makePolygonLayer());
        } else {
          coverageItem.button.addEventListener('pointerenter', () => void loadCoverageLayer(), { once: true });
          coverageItem.button.addEventListener('focus', () => void loadCoverageLayer(), { once: true });
        }
      }

      hideMapStatus();
      setTimeout(() => map.invalidateSize(), 100);
    };

    const activate = (button, options = {}) => {
      const { move = true, openPopup = true } = options;
      const location = readLocation(button);
      const card = button.closest('.location-card');

      if (!location) {
        return;
      }

      cards.forEach((item) => item.classList.remove('is-active'));
      buttons.forEach((item) => item.setAttribute('aria-pressed', 'false'));
      card?.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
      setLinks(location);
      mapNode.dataset.activeMapKey = location.key;
      mapNode.dataset.activeMapMode = location.coverage ? 'coverage' : 'point';

      if (map) {
        const isCoverage = Boolean(location.coverage && (location.bounds || location.geojsonUrl || coverageLayer));

        if (coverageLayer) {
          if (isCoverage && !map.hasLayer(coverageLayer)) {
            coverageLayer.addTo(map);
          }

          if (!isCoverage && map.hasLayer(coverageLayer)) {
            coverageLayer.remove();
          }
        }

        if (isCoverage && !coverageLayer) {
          void loadCoverageLayer().then((layer) => {
            if (!layer || mapNode.dataset.activeMapKey !== location.key) {
              return;
            }

            if (!map.hasLayer(layer)) {
              layer.addTo(map);
            }

            map.fitBounds(layer.getBounds(), { padding: [26, 26], animate: true });

            if (openPopup) {
              layer.openPopup(window.L.latLng(location.lat, location.lng));
            }
          });
        }

        if (move) {
          if (isCoverage) {
            const fitTarget = coverageLayer?.getBounds?.() || location.bounds;
            if (fitTarget) {
              map.fitBounds(fitTarget, { padding: [26, 26], animate: true });
            }
          } else {
            map.setView([location.lat, location.lng], location.zoom, { animate: true });
          }
        }

        markers.forEach((marker, key) => marker.setIcon(createIcon(key === location.key)));
        const marker = markers.get(location.key);

        if (marker && openPopup) {
          marker.openPopup();
        } else if (isCoverage && coverageLayer && openPopup) {
          coverageLayer.openPopup(window.L.latLng(location.lat, location.lng));
        }
      }
    };

    const activateCurrentLocation = () => {
      const currentButton =
        buttons.find((button) => button.getAttribute('aria-pressed') === 'true') ||
        activeItem.button;

      activate(currentButton, {
        move: currentButton !== activeItem.button,
        openPopup: false
      });
    };

    const requestMap = () => {
      if (map || mapNode.dataset.mapState === 'loading') {
        return;
      }

      mapNode.dataset.mapState = 'loading';
      void loadLeafletAssets()
        .then(() => {
          initializeMap();
          mapNode.dataset.mapState = map ? 'ready' : 'error';
          activateCurrentLocation();
        })
        .catch(() => {
          leafletLoadPromise = null;
          mapNode.dataset.mapState = 'error';
          showMapStatus();
        });
    };

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        requestMap();
        activate(button);
      });
    });

    activate(activeItem.button, { move: false, openPopup: false });
    mapNode.addEventListener('pointerenter', requestMap, { once: true });
    mapNode.addEventListener('focusin', requestMap, { once: true });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            requestMap();
          }
        },
        { rootMargin: '360px 0px', threshold: 0.01 }
      );

      observer.observe(wrap || mapNode);
    } else {
      window.setTimeout(requestMap, 0);
    }
  }

  function setupProductionTour() {
    const trigger = $('[data-production-tour-trigger]');
    const hint = $('[data-production-tour-hint]');
    let tourRun = 0;
    let isTourActive = false;
    let cancelArmedAt = 0;
    let suppressClickUntil = 0;

    if (!trigger) {
      return;
    }

    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const waitWhileCurrent = async (duration, currentRun) => {
      const startedAt = Date.now();

      while (currentRun === tourRun && Date.now() - startedAt < duration) {
        await wait(Math.min(80, duration - (Date.now() - startedAt)));
      }

      return currentRun === tourRun;
    };

    const clearHighlights = () => {
      $$('.is-tour-highlight').forEach((node) => node.classList.remove('is-tour-highlight'));
    };

    const getVisibleBand = () => {
      const header = $('.site-header');
      header?.classList.remove('is-hidden');

      const headerHeight = header?.getBoundingClientRect().height || 0;
      const topPadding = window.innerWidth <= 760 ? 14 : 18;
      const bottomPadding = window.innerWidth <= 760 ? 96 : 78;
      const top = Math.ceil(headerHeight + topPadding);
      const bottom = Math.max(top + 180, window.innerHeight - bottomPadding);

      return {
        top,
        bottom,
        height: Math.max(180, bottom - top)
      };
    };

    const getMaxScrollTop = () => {
      const scrollingElement = document.scrollingElement || document.documentElement;

      return Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
    };

    const clampScrollTop = (top) => Math.min(getMaxScrollTop(), Math.max(0, Math.round(top)));

    const waitForScrollSettled = (currentRun, timeout = 1700) => new Promise((resolve) => {
      const startedAt = Date.now();
      let previousY = window.scrollY;
      let stableFrames = 0;

      const tick = () => {
        if (currentRun !== tourRun) {
          resolve();
          return;
        }

        const currentY = window.scrollY;
        const isStable = Math.abs(currentY - previousY) <= 0.5;

        stableFrames = isStable ? stableFrames + 1 : 0;
        previousY = currentY;

        if (stableFrames >= 8 || Date.now() - startedAt >= timeout) {
          resolve();
          return;
        }

        window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    });

    const scrollToPosition = async (top, currentRun = tourRun) => {
      $('.site-header')?.classList.remove('is-hidden');
      window.scrollTo({
        top: clampScrollTop(top),
        behavior: 'smooth'
      });

      await waitForScrollSettled(currentRun);
      await waitWhileCurrent(80, currentRun);
    };

    const scrollToNode = async (node, block = 'start', currentRun = tourRun) => {
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const band = getVisibleBand();
      const nodeTop = window.scrollY + rect.top;
      const nodeBottom = window.scrollY + rect.bottom;
      let top = nodeTop - band.top;

      if (block === 'center' && rect.height < band.height) {
        top = nodeTop - band.top - ((band.height - rect.height) / 2);
      } else if (block === 'end') {
        top = nodeBottom - band.bottom;
      } else if (block === 'nearest') {
        if (rect.top >= band.top && rect.bottom <= band.bottom) {
          return;
        }

        top = rect.height > band.height || rect.top < band.top
          ? nodeTop - band.top
          : nodeBottom - band.bottom;
      }

      await scrollToPosition(top, currentRun);
    };

    const showNodeExtent = async (node, currentRun = tourRun, options = {}) => {
      if (!node || currentRun !== tourRun) {
        return false;
      }

      if (!await waitWhileCurrent(options.pause || 620, currentRun)) {
        return false;
      }

      const updatedRect = node.getBoundingClientRect();
      const band = getVisibleBand();
      const shouldShowBottom = updatedRect.height > band.height + 24;

      if (shouldShowBottom) {
        await scrollToNode(node, 'end', currentRun);

        if (!await waitWhileCurrent(options.pause || 620, currentRun)) {
          return false;
        }
      }

      return currentRun === tourRun;
    };

    const ensureVisible = async (node, currentRun) => {
      await scrollToNode(node, 'nearest', currentRun);
    };

    const setHash = (hash) => {
      if (hash && window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    };

    const highlightNode = async (node, currentRun, options = {}) => {
      if (!node || currentRun !== tourRun) {
        return false;
      }

      node.classList.add('is-visible');
      options.beforeHighlight?.();

      if (currentRun !== tourRun) {
        return false;
      }

      clearHighlights();

      if (options.showExtent) {
        await scrollToNode(node, options.scrollMode || 'start', currentRun);

        if (currentRun !== tourRun) {
          return false;
        }

        const shouldContinue = await showNodeExtent(node, currentRun, {
          pause: options.duration || 1050
        });

        return shouldContinue;
      }

      if (options.ensureItemVisible !== false) {
        await scrollToNode(node, options.scrollMode || 'nearest', currentRun);
      }

      if (currentRun !== tourRun) {
        return false;
      }

      await waitWhileCurrent(options.duration || 1050, currentRun);

      return currentRun === tourRun;
    };

    const resolveTourItems = (definitions, sectionNode) => {
      const list = typeof definitions === 'function' ? definitions(sectionNode) : definitions;

      return (list || []).flatMap((definition) => {
        if (definition instanceof Element) {
          return [{ node: definition }];
        }

        if (definition?.target === 'section') {
          return [{ ...definition, node: sectionNode }];
        }

        if (typeof definition?.node === 'function') {
          return [{ ...definition, node: definition.node(sectionNode) }].filter((item) => item.node);
        }

        if (definition?.node instanceof Element) {
          return [definition];
        }

        if (!definition?.selector) {
          return [];
        }

        const root = definition.global ? document : sectionNode;
        const nodes = definition.all
          ? $$(definition.selector, root)
          : [$(definition.selector, root)].filter(Boolean);

        return nodes.map((node) => ({ ...definition, node }));
      });
    };

    const runGroup = async ({
      hash,
      section,
      items,
      sectionPause = 260,
      introSelector
    }, currentRun) => {
      const sectionNode = $(section);

      if (!sectionNode || currentRun !== tourRun) {
        return false;
      }

      const introNode = introSelector ? $(introSelector, sectionNode) || sectionNode : sectionNode;

      setHash(hash);
      await scrollToNode(introNode, 'start', currentRun);

      if (!await waitWhileCurrent(sectionPause, currentRun)) {
        return false;
      }

      for (const item of resolveTourItems(items, sectionNode)) {
        const shouldContinue = await highlightNode(item.node, currentRun, {
          beforeHighlight: () => item.beforeHighlight?.(item.node),
          duration: item.duration,
          ensureItemVisible: item.ensureItemVisible,
          scrollMode: item.scrollMode,
          showExtent: item.showExtent
        });

        if (!shouldContinue) {
          return false;
        }
      }

      return true;
    };

    const stopTourUi = () => {
      isTourActive = false;
      clearHighlights();
      document.documentElement.classList.remove('production-tour-active');
      if (hint) {
        hint.hidden = true;
      }
      document.removeEventListener('pointerdown', handleTourCancel, true);
      document.removeEventListener('keydown', handleTourCancel, true);
      window.removeEventListener('wheel', handleTourCancel, true);
      window.removeEventListener('touchstart', handleTourCancel, true);
      window.removeEventListener('touchmove', handleTourCancel, true);
    };

    function suppressTourClick(event) {
      if (Date.now() > suppressClickUntil) {
        document.removeEventListener('click', suppressTourClick, true);
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    }

    const cancelTour = (event) => {
      if (!isTourActive) {
        return;
      }

      if (event?.type === 'pointerdown' || event?.type === 'touchstart' || event?.type === 'touchmove') {
        suppressClickUntil = Date.now() + 360;
        document.addEventListener('click', suppressTourClick, true);

        if (event.cancelable) {
          event.preventDefault();
        }

        event.stopImmediatePropagation?.();
      }

      tourRun += 1;
      window.scrollTo({ top: window.scrollY, behavior: 'auto' });
      stopTourUi();
    };

    function handleTourCancel(event) {
      if (!isTourActive || Date.now() < cancelArmedAt) {
        return;
      }

      if (event.type === 'keydown') {
        if (event.key !== 'Escape') {
          return;
        }

        event.preventDefault();
      }

      cancelTour(event);
    }

    const startTourUi = () => {
      isTourActive = true;
      cancelArmedAt = Date.now() + 180;
      $('.site-header')?.classList.remove('is-hidden');
      document.documentElement.classList.add('production-tour-active');
      if (hint) {
        hint.hidden = false;
      }
      document.addEventListener('pointerdown', handleTourCancel, true);
      document.addEventListener('keydown', handleTourCancel, true);
      window.addEventListener('wheel', handleTourCancel, { capture: true, passive: true });
      window.addEventListener('touchstart', handleTourCancel, { capture: true, passive: true });
      window.addEventListener('touchmove', handleTourCancel, { capture: true, passive: true });
    };

    const runTour = async () => {
      const currentRun = ++tourRun;
      clearHighlights();
      startTourUi();

      const groups = [
        {
          hash: '#company',
          section: '#company',
          introSelector: '.company-map-panel',
          sectionPause: 420,
          items: [
            { selector: '.company-map-panel', duration: 980, showExtent: true },
            { selector: '.company-flow-capabilities', duration: 980, showExtent: true },
            { selector: '.company-flow-route', duration: 980, showExtent: true }
          ]
        },
        {
          hash: '#proof',
          section: '#proof',
          introSelector: '.projects-showcase-head',
          sectionPause: 360,
          items: [
            { selector: '.projects-showcase', duration: 980, showExtent: true },
            { selector: '.trust-docs', duration: 920, showExtent: true }
          ]
        },
        {
          hash: '#clients',
          section: '#clients',
          introSelector: '.section-head',
          items: [
            { selector: '.clients-grid', duration: 1050, showExtent: true }
          ]
        },
        {
          hash: '#contacts',
          section: '#contacts',
          introSelector: '.map-head',
          sectionPause: 320,
          items: [
            { selector: '.map-column', duration: 880, showExtent: true },
            {
              selector: '.location-card',
              all: true,
              duration: 520,
              scrollMode: 'nearest',
              beforeHighlight: (item) => {
                item.querySelector('button')?.click();
              }
            },
            { selector: '.contact-card', duration: 920, showExtent: true }
          ]
        },
        {
          hash: '#footer',
          section: '#footer',
          sectionPause: 260,
          items: [
            { target: 'section', duration: 1100, showExtent: true }
          ]
        }
      ];

      for (const group of groups) {
        const shouldContinue = await runGroup(group, currentRun);

        if (!shouldContinue) {
          break;
        }

        if (!await waitWhileCurrent(220, currentRun)) {
          break;
        }
      }

      if (currentRun === tourRun) {
        stopTourUi();
      }
    };

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      void runTour();
    });
  }

  setupAdaptiveEffects();
  applyConfig();
  void setupVisitStats();
  setupDesktopStage();
  setupNavigation();
  setupHeaderReveal();
  setupFaqAccordion();
  setupModal();
  setupFloatingActions();
  setupReveal();
  setupLocationMap();
  setupProductionTour();
})();
