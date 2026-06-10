(function () {
  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const officePoint = encodeURIComponent('30.425277,59.879804');

  const defaults = {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl: 'https://metallb2e-site.pages.dev/',
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
    leadEndpoint: 'https://b2e-leads.zakaz-749.workers.dev',
    statsEndpoint: 'https://b2e-leads.zakaz-749.workers.dev/stats'
  };

  const config = { ...defaults, ...(window.B2E_CONFIG || {}) };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

      return Math.ceil(headerHeight + 16);
    };

    const scrollToHash = (hash, behavior = 'auto') => {
      const target = getHashTarget(hash);
      if (!target) {
        return false;
      }

      syncStage();
      $('.site-header')?.classList.remove('is-hidden');

      const rawTop =
        target.matches('.site-header')
          ? 0
          : window.scrollY + target.getBoundingClientRect().top - getAnchorOffset(target);
      const scrollingElement = document.scrollingElement || document.documentElement;
      const maxTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      const top = Math.min(maxTop, Math.max(0, Math.round(rawTop)));

      window.scrollTo({
        top,
        behavior
      });
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
    });

    window.addEventListener('hashchange', correctCurrentHash);
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

      if (currentScrollY <= 4 || isMenuOpen() || header.contains(document.activeElement)) {
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
      } catch {
        // Visit stats are non-critical; keep the public UI usable when the endpoint is offline locally.
      }
    }

    setVisitStatsUnavailable();
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

    const guidancePresets = {
      ready: {
        title: 'Есть КМ/КМД или ведомость',
        copy: 'Добавьте данные, по которым инженер сможет быстрее проверить объем, покрытие и производственный маршрут.',
        actions: [
          ['Состав комплекта', 'Исходники: есть КМ/КМД, спецификация или ведомость металла.'],
          ['Тоннаж и марки', 'Ориентир по тоннажу, маркам элементов и габаритам: нужно уточнить.'],
          ['Покрытие и срок', 'Покрытие, адрес объекта, желаемый срок и условия отгрузки: нужно уточнить.']
        ]
      },
      sketch: {
        title: 'Есть эскиз, фото или идея',
        copy: 'Зафиксируйте минимум вводных, чтобы инженер понял форму, функцию и ограничения конструкции.',
        actions: [
          ['Эскиз или фото', 'Исходники: есть эскиз, фото или пример похожей конструкции.'],
          ['Размеры', 'Габариты, высота, пролет, нагрузка или условия эксплуатации: нужно уточнить.'],
          ['Назначение', 'Назначение конструкции, материал, покрытие и место установки: нужно уточнить.']
        ]
      },
      site: {
        title: 'Нужен выезд или проверка объекта',
        copy: 'Помогает заранее оценить монтажные ограничения, доступ, подъем, упаковку и доставку.',
        actions: [
          ['Адрес объекта', 'Адрес объекта и удобное время для связи или выезда: нужно уточнить.'],
          ['Ограничения', 'Ограничения по доступу, высоте, подъему, существующим конструкциям и монтажу: нужно уточнить.'],
          ['Фото площадки', 'Фото площадки, места установки или подъезда можно подготовить для инженера.']
        ]
      },
      operation: {
        title: 'Нужна отдельная операция',
        copy: 'Для резки, гибки, обработки или окраски важны материал, размеры партии и требования к результату.',
        actions: [
          ['Материал', 'Материал, толщина, профиль или марка стали: нужно уточнить.'],
          ['Партия', 'Количество деталей, размеры партии и желаемый срок готовности: нужно уточнить.'],
          ['Требования', 'Требования к резке, гибке, обработке, покрытию или упаковке: нужно уточнить.']
        ]
      },
      general: {
        title: 'Что ускорит расчет',
        copy: 'Добавьте любые известные вводные. Если данных мало, инженер подскажет следующий шаг.',
        actions: [
          ['Исходники', 'Исходники: КМ/КМД, эскиз, фото или ведомость нужно уточнить.'],
          ['Объем', 'Габариты, тоннаж, материал и покрытие: нужно уточнить.'],
          ['Срок и адрес', 'Адрес объекта, желаемый срок и состав работ: нужно уточнить.']
        ]
      }
    };

    const objectGuidanceKeys = {
      'Расчет металлоконструкций': 'ready',
      'Строительные металлоконструкции': 'ready',
      'Закладные детали': 'ready',
      'Лестницы металлические': 'sketch',
      'Навесы': 'sketch',
      'Ворота': 'sketch',
      'Резервуары': 'sketch',
      'Арочные конструкции': 'ready',
      'Нестандартные конструкции': 'sketch',
      'Монтаж металлоконструкций': 'site',
      'Резка металла': 'operation',
      'Гибка металла': 'operation',
      'Металлообработка': 'operation',
      'Порошковая окраска': 'operation'
    };

    const normalizeText = (value) => String(value || '').toLocaleLowerCase('ru-RU');

    const resolveGuidanceKey = (objectType = '', message = '', explicitKey = '') => {
      if (explicitKey && guidancePresets[explicitKey]) {
        return explicitKey;
      }

      const text = normalizeText(`${objectType} ${message}`);

      if (objectGuidanceKeys[objectType]) {
        return objectGuidanceKeys[objectType];
      }

      if (text.includes('объект требует проверки') || text.includes('выезд') || text.includes('замер') || text.includes('монтажные ограничения')) {
        return 'site';
      }

      if (text.includes('неполные') || text.includes('эскиз') || text.includes('идея конструкции') || text.includes('фото')) {
        return 'sketch';
      }

      if (text.includes('км/кмд') || text.includes('ведомость')) {
        return 'ready';
      }

      return 'general';
    };

    const renderLeadGuidance = (guidanceKey = 'general') => {
      const guidance = $('[data-lead-guidance]', form);
      const title = $('[data-lead-guidance-title]', form);
      const copy = $('[data-lead-guidance-copy]', form);
      const actions = $('[data-lead-guidance-actions]', form);
      const preset = guidancePresets[guidanceKey] || guidancePresets.general;

      if (!guidance || !title || !copy || !actions) {
        return;
      }

      guidance.dataset.guidanceKey = guidanceKey;
      title.textContent = preset.title;
      copy.textContent = preset.copy;
      actions.replaceChildren(
        ...preset.actions.map(([label, insertText]) => {
          const button = document.createElement('button');
          button.className = 'lead-guidance-action';
          button.type = 'button';
          button.dataset.leadInsert = insertText;
          button.textContent = label;
          return button;
        })
      );
    };

    const appendLeadGuidance = (insertText) => {
      const message = form.elements.message;
      const text = String(insertText || '').trim();

      if (!message || !text) {
        return;
      }

      const current = message.value.trim();
      if (!current.includes(text)) {
        message.value = current ? `${current}\n${text}` : text;
      }

      message.focus();
      updateLeadReadiness();
      updateLeadBrief();
    };

    const readinessChecks = [
      {
        label: 'исходники',
        test: (text) => /км|кмд|эскиз|ведомост|спецификац|фото|чертеж/i.test(text)
      },
      {
        label: 'объем',
        test: (text) => /тонн|т\b|габарит|размер|высот|пролет|профил|количеств|парт/i.test(text)
      },
      {
        label: 'срок/адрес',
        test: (text) => /адрес|объект|срок|отгруз|достав|монтаж|выезд|площадк/i.test(text)
      }
    ];

    const nextStepByGuidance = {
      ready: {
        partial: 'Инженер проверит комплект, отметит недостающие данные и вернет вопросы до подготовки КП.',
        complete: 'Инженер проверит комплект, зафиксирует допущения и передаст задачу в расчет КП.'
      },
      sketch: {
        partial: 'Инженер уточнит реализуемость, габариты и ограничения, затем предложит расчетный маршрут.',
        complete: 'Инженер проверит реализуемость по эскизу и подготовит следующий шаг для КП.'
      },
      site: {
        partial: 'Инженер уточнит доступ, ограничения и необходимость выезда или входной проверки объекта.',
        complete: 'Инженер проверит монтажные ограничения и соберет КП с учетом объекта, доставки или выезда.'
      },
      operation: {
        partial: 'Инженер уточнит материал, партию и требования к операции, затем оценит производственный маршрут.',
        complete: 'Инженер проверит материал, партию и требования, затем передаст операцию в расчет.'
      },
      general: {
        partial: 'Инженер проверит вводные и подскажет, что нужно уточнить для КП.',
        complete: 'Инженер проверит вводные и передаст задачу в расчет КП.'
      }
    };

    function updateLeadReadiness() {
      const root = $('[data-lead-readiness]', form);
      const label = $('[data-lead-readiness-label]', form);
      const score = $('[data-lead-readiness-score]', form);
      const copy = $('[data-lead-readiness-copy]', form);
      const bar = $('[data-lead-readiness-bar]', form);
      const list = $('[data-lead-readiness-list]', form);
      const nextStep = $('[data-lead-next-step]', form);

      if (!root || !label || !score || !copy || !bar || !list || !nextStep) {
        return;
      }

      const message = String(form.elements.message?.value || '');
      const objectType = String(form.elements.objectType?.value || '');
      const checkText = `${objectType}\n${message}`;
      const states = readinessChecks.map((item) => ({ ...item, ready: item.test(checkText) }));
      const readyCount = states.filter((item) => item.ready).length;
      const percent = Math.max(1, readyCount) / states.length * 100;
      const guidanceKey = $('[data-lead-guidance]', form)?.dataset.guidanceKey || resolveGuidanceKey(objectType, message);
      const nextStepPreset = nextStepByGuidance[guidanceKey] || nextStepByGuidance.general;
      const status =
        readyCount === states.length
          ? ['Инженеру хватит для старта', 'Можно отправлять: ключевые вводные уже есть в заявке.']
          : readyCount === 2
            ? ['Почти готово', 'Остался один блок вводных. Если его нет, инженер уточнит после заявки.']
            : ['Стартовая заявка', 'Добавьте исходники, объем и срок, чтобы инженер быстрее подготовил КП.'];

      root.dataset.readiness = String(readyCount);
      label.textContent = status[0];
      score.textContent = `${readyCount}/${states.length}`;
      copy.textContent = status[1];
      bar.style.width = `${percent}%`;
      nextStep.textContent = readyCount === states.length ? nextStepPreset.complete : nextStepPreset.partial;
      list.replaceChildren(
        ...states.map((item) => {
          const node = document.createElement('li');
          node.classList.toggle('is-ready', item.ready);
          node.textContent = item.ready ? `${item.label} есть` : `${item.label} ?`;
          return node;
        })
      );
    }

    const buildLeadBrief = () => {
      const objectType = String(form.elements.objectType?.value || 'Общая заявка').trim();
      const name = String(form.elements.name?.value || '').trim();
      const contact = String(form.elements.phone?.value || '').trim();
      const message = String(form.elements.message?.value || '').trim();
      const readinessLabel = $('[data-lead-readiness-label]', form)?.textContent.trim() || 'Стартовая заявка';
      const readinessScore = $('[data-lead-readiness-score]', form)?.textContent.trim() || '0/3';
      const nextStep = $('[data-lead-next-step]', form)?.textContent.trim() || '';

      return [
        'Заявка на расчет B2E',
        `Тип проекта: ${objectType}`,
        name ? `Имя/компания: ${name}` : 'Имя/компания: нужно уточнить',
        contact ? `Контакт: ${contact}` : 'Контакт: нужно уточнить',
        `Готовность вводных: ${readinessLabel} (${readinessScore})`,
        nextStep ? `Следующий шаг: ${nextStep}` : '',
        '',
        'Задача:',
        message || 'Описание задачи нужно уточнить.',
        '',
        `Страница: ${window.location.href.split('#')[0]}`
      ].filter((line) => line !== '').join('\n');
    };

    const updateLeadBrief = (statusText = 'Бриф обновляется из выбранных вводных.') => {
      const emailLink = $('[data-lead-email-brief]', form);
      const briefText = $('[data-lead-brief-text]', form);
      const status = $('[data-lead-brief-status]', form);
      const brief = buildLeadBrief();
      const subject = encodeURIComponent(`Заявка на расчет B2E: ${form.elements.objectType?.value || 'металлоконструкции'}`);
      const body = encodeURIComponent(brief);

      if (emailLink) {
        emailLink.href = `mailto:${config.email}?subject=${subject}&body=${body}`;
      }

      if (briefText && briefText.value !== brief) {
        briefText.value = brief;
      }

      if (status) {
        status.textContent = statusText;
      }
    };

    const copyLeadBrief = async () => {
      const brief = buildLeadBrief();

      try {
        await navigator.clipboard?.writeText(brief);
        return 'copied';
      } catch {
        const buffer = $('[data-lead-brief-text]', form) || document.createElement('textarea');

        if (!buffer.isConnected) {
          buffer.value = brief;
          buffer.setAttribute('readonly', '');
          buffer.style.position = 'fixed';
          buffer.style.inset = '0 auto auto -9999px';
          buffer.style.opacity = '0';
          document.body.append(buffer);
        }

        buffer.focus();
        buffer.select();
        buffer.scrollTop = 0;

        try {
          return document.execCommand('copy') ? 'copied' : 'selected';
        } finally {
          if (!buffer.matches('[data-lead-brief-text]')) {
            buffer.remove();
          }
        }
      }
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

    const openModal = (objectType, message = '', guidanceKey = '') => {
      restoreForm();

      if (objectType && form.elements.objectType) {
        const objectTypeControl = form.elements.objectType;
        const hasOption = Array.from(objectTypeControl.options).some((option) => option.value === objectType);

        objectTypeControl.value = hasOption ? objectType : 'Общая заявка';
      }

      if (message && form.elements.message) {
        form.elements.message.value = message;
      }

      renderLeadGuidance(resolveGuidanceKey(form.elements.objectType?.value || objectType, message, guidanceKey));
      updateLeadReadiness();
      updateLeadBrief();

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
        const messageFromButton = button.dataset.prefillMessage || '';
        const guidanceFromButton = button.dataset.leadContext || '';
        openModal(typeFromButton, messageFromButton, guidanceFromButton);
      });
    });

    window.addEventListener('b2e:open-lead-modal', (event) => {
      openModal(event.detail?.objectType, event.detail?.message, event.detail?.guidanceKey);
    });

    form.addEventListener('change', (event) => {
      const target = event.target;

      if (target instanceof HTMLSelectElement && target.name === 'objectType') {
        renderLeadGuidance(resolveGuidanceKey(target.value, form.elements.message?.value || ''));
        updateLeadReadiness();
        updateLeadBrief();
      }
    });

    form.addEventListener('input', (event) => {
      const target = event.target;

      if (target instanceof HTMLTextAreaElement && target.name === 'message') {
        updateLeadReadiness();
        updateLeadBrief();
      }

      if (target instanceof HTMLInputElement && (target.name === 'name' || target.name === 'phone')) {
        updateLeadBrief();
      }
    });

    form.addEventListener('click', async (event) => {
      const copyButton = event.target instanceof Element ? event.target.closest('[data-lead-copy-brief]') : null;
      const insertButton = event.target instanceof Element ? event.target.closest('[data-lead-insert]') : null;

      if (copyButton) {
        const copyState = await copyLeadBrief();
        updateLeadBrief(
          copyState === 'copied'
            ? 'Бриф скопирован. Его можно отправить по email, MAX или в мессенджер.'
            : 'Бриф выделен в поле ниже. Нажмите Ctrl+C, если браузер не разрешил автокопирование.'
        );
        return;
      }

      if (!insertButton) {
        return;
      }

      appendLeadGuidance(insertButton.dataset.leadInsert);
    });

    renderLeadGuidance();
    updateLeadReadiness();
    updateLeadBrief();

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

  function setupQuoteBuilder() {
    const root = $('[data-quote-builder]');

    if (!root) {
      return;
    }

    const summary = $('[data-quote-summary]', root);
    const submit = $('[data-quote-submit]', root);
    const groups = $$('[data-quote-group]', root);

    const readSelections = () =>
      groups.reduce((acc, group) => {
        const active = $('.quote-option.is-active', group) || $('.quote-option', group);
        if (!active) {
          return acc;
        }

        acc[group.dataset.quoteGroup] = {
          value: active.dataset.quoteValue || active.textContent.trim(),
          label: active.dataset.quoteLabel || active.textContent.trim()
        };
        return acc;
      }, {});

    const buildMessage = () => {
      const selected = readSelections();

      return [
        `Сценарий: ${selected.scenario?.label || selected.scenario?.value || 'заказчик проекта'}.`,
        `Тип: ${selected.objectType?.label || selected.objectType?.value || 'металлоконструкции'}.`,
        `Исходные данные: ${selected.source?.label || selected.source?.value || 'требуется уточнение'}.`,
        `Ориентир по объему: ${selected.scale?.label || selected.scale?.value || 'нужно уточнить'}.`,
        `Нужно включить: ${selected.scope?.label || selected.scope?.value || 'изготовление'}.`,
        'Прошу связаться, уточнить недостающие данные и подготовить расчет.'
      ].join('\n');
    };

    const updateSummary = () => {
      if (summary) {
        summary.textContent = buildMessage().replace(/\n/g, ' ');
      }
    };

    const resolveQuoteGuidanceKey = (selected) => {
      const source = String(selected.source?.value || selected.source?.label || '').toLocaleLowerCase('ru-RU');

      if (source.includes('выезд')) {
        return 'site';
      }

      if (source.includes('эскиз')) {
        return 'sketch';
      }

      return 'ready';
    };

    root.addEventListener('click', (event) => {
      const option = event.target instanceof Element ? event.target.closest('.quote-option') : null;

      if (!option) {
        return;
      }

      const group = option.closest('[data-quote-group]');
      if (!group) {
        return;
      }

      $$('.quote-option', group).forEach((item) => {
        const isActive = item === option;

        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      updateSummary();
    });

    submit?.addEventListener('click', () => {
      const selected = readSelections();

      window.dispatchEvent(new CustomEvent('b2e:open-lead-modal', {
        detail: {
          objectType: selected.objectType?.value || 'Общая заявка',
          message: buildMessage(),
          guidanceKey: resolveQuoteGuidanceKey(selected)
        }
      }));
    });

    updateSummary();
  }

  function setupQuoteFactors() {
    const root = $('[data-quote-factors]');

    if (!root) {
      return;
    }

    const buttons = $$('[data-factor-value]', root);
    const count = $('[data-quote-factor-count]', root);
    const summary = $('[data-quote-factor-summary]', root);
    const list = $('[data-quote-factor-summary-list]', root);
    const submit = $('[data-quote-factor-submit]', root);

    const readActive = () => buttons.filter((button) => button.classList.contains('is-active'));
    const readFactor = (button) => ({
      label: button.dataset.factorLabel || button.textContent.trim(),
      line: button.dataset.factorLine || ''
    });

    const buildFactorMessage = () => {
      const selected = readActive().map(readFactor);
      const labels = selected.map((item) => item.label).join(', ');
      const lines = selected.map((item) => `- ${item.label}: ${item.line}`).join('\n');

      return [
        `Факторы КП: ${labels}.`,
        'Нужно подготовить расчет металлоконструкций и показать, как эти факторы влияют на цену, срок, состав работ и допущения.',
        'Что известно или нужно уточнить:',
        lines,
        'Прошу связаться, проверить достаточность вводных и зафиксировать следующий шаг для КП.'
      ].join('\n');
    };

    const updateFactors = () => {
      const selected = readActive().map(readFactor);

      if (count) {
        count.textContent = `${selected.length}/${buttons.length} факторов`;
      }

      if (summary) {
        const labels = selected.map((item) => item.label.toLocaleLowerCase('ru-RU'));
        summary.textContent =
          selected.length >= 4
            ? 'Инженер увидит не только объем, но и ограничения по производству, объекту и срокам.'
            : `${labels.join(', ')} уже дают основу для первичного КП.`;
      }

      if (list) {
        list.replaceChildren(
          ...selected.map((item) => {
            const node = document.createElement('li');
            node.textContent = item.line;
            return node;
          })
        );
      }
    };

    root.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-factor-value]') : null;

      if (!button) {
        return;
      }

      const isActive = button.classList.contains('is-active');
      if (isActive && readActive().length === 1) {
        return;
      }

      button.classList.toggle('is-active', !isActive);
      button.setAttribute('aria-pressed', String(!isActive));
      updateFactors();
    });

    submit?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('b2e:open-lead-modal', {
        detail: {
          objectType: 'Расчет металлоконструкций',
          message: buildFactorMessage(),
          guidanceKey: 'ready'
        }
      }));
    });

    updateFactors();
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
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));
  }

  function setupLocationMap() {
    const mapNode = $('[data-locations-map]');
    const externalLink = $('[data-location-map-link]');
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
      if (externalLink && location.url) {
        externalLink.setAttribute('href', location.url);
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

    if (window.L) {
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
              .catch((error) => {
                console.error(error);
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
    } else {
      showMapStatus();
    }

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

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => activate(button));
    });

    activate(activeItem.button, { move: false });
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

    const getScrollOffset = () => {
      const scale = Number(getComputedStyle(document.documentElement).getPropertyValue('--site-stage-scale')) || 1;
      const desktopOffset = 96 * scale;

      return document.documentElement.classList.contains('site-stage-active')
        ? desktopOffset
        : window.innerWidth <= 760
          ? 82
          : 96;
    };

    const waitForScrollTarget = (targetTop, currentRun, timeout = 1600) => new Promise((resolve) => {
      const startedAt = Date.now();
      let previousY = window.scrollY;
      let stableFrames = 0;

      const tick = () => {
        if (currentRun !== tourRun) {
          resolve();
          return;
        }

        const currentY = window.scrollY;
        const isNearTarget = Math.abs(currentY - targetTop) <= 2;
        const isStable = Math.abs(currentY - previousY) <= 0.5;

        stableFrames = isStable ? stableFrames + 1 : 0;
        previousY = currentY;

        if (isNearTarget || stableFrames >= 8 || Date.now() - startedAt >= timeout) {
          resolve();
          return;
        }

        window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    });

    const scrollToPosition = async (top, currentRun = tourRun) => {
      window.scrollTo({
        top,
        behavior: 'smooth'
      });

      await waitForScrollTarget(top, currentRun);
      await waitWhileCurrent(80, currentRun);
    };

    const scrollToNode = async (node, block = 'start', currentRun = tourRun) => {
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const scrollOffset = getScrollOffset();
      const centeredTop = window.scrollY + rect.top + (rect.height / 2) - (window.innerHeight / 2);
      const sectionTop = window.scrollY + rect.top - scrollOffset;
      const scrollingElement = document.scrollingElement || document.documentElement;
      const maxTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      const top = Math.min(maxTop, Math.max(0, Math.round(
        block === 'top'
          ? window.scrollY + rect.top
          : block === 'center'
          ? centeredTop
          : block === 'section'
            ? centeredTop
            : sectionTop
      )));

      await scrollToPosition(top, currentRun);
    };

    const scrollThroughNode = async (node, currentRun = tourRun, options = {}) => {
      if (!node || currentRun !== tourRun) {
        return false;
      }

      const scrollOffset = getScrollOffset();
      const scrollingElement = document.scrollingElement || document.documentElement;
      const maxTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      const rect = node.getBoundingClientRect();
      const top = Math.min(maxTop, Math.max(0, Math.round(window.scrollY + rect.top - scrollOffset)));

      await scrollToPosition(top, currentRun);

      if (!await waitWhileCurrent(options.pause || 620, currentRun)) {
        return false;
      }

      const updatedRect = node.getBoundingClientRect();
      const bottomTop = Math.min(maxTop, Math.max(top, Math.round(
        window.scrollY + updatedRect.bottom - window.innerHeight + Math.min(scrollOffset, 96)
      )));

      if (bottomTop > top + 24) {
        await scrollToPosition(bottomTop, currentRun);

        if (!await waitWhileCurrent(options.pause || 620, currentRun)) {
          return false;
        }
      }

      return currentRun === tourRun;
    };

    const ensureVisible = async (node, currentRun) => {
      const rect = node.getBoundingClientRect();

      if (rect.top < 120 || rect.bottom > window.innerHeight - 120) {
        await scrollToNode(node, 'center', currentRun);
      }
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
      node.classList.add('is-tour-highlight');
      if (options.ensureItemVisible !== false) {
        await ensureVisible(node, currentRun);
      }

      if (currentRun !== tourRun) {
        return false;
      }

      await waitWhileCurrent(options.duration || 1050, currentRun);

      if (currentRun === tourRun) {
        node.classList.remove('is-tour-highlight');
      }

      return currentRun === tourRun;
    };

    const runGroup = async ({
      hash,
      section,
      items,
      beforeItem,
      itemDuration = 1050,
      sectionPause = 260,
      scrollBlock = 'section',
      scrollTarget,
      showFullSection = false
    }, currentRun) => {
      const sectionNode = $(section);

      if (!sectionNode || currentRun !== tourRun) {
        return false;
      }

      const scrollNode = scrollTarget ? $(scrollTarget, sectionNode) || $(scrollTarget) || sectionNode : sectionNode;

      setHash(hash);
      await scrollToNode(scrollNode, scrollBlock, currentRun);

      if (!await waitWhileCurrent(sectionPause, currentRun)) {
        return false;
      }

      if (showFullSection) {
        const focusNode = items()[0] || scrollNode;

        focusNode.classList.add('is-visible');
        clearHighlights();
        focusNode.classList.add('is-tour-highlight');

        const shouldContinue = await scrollThroughNode(scrollNode, currentRun, {
          pause: itemDuration
        });

        if (currentRun === tourRun) {
          focusNode.classList.remove('is-tour-highlight');
        }

        return shouldContinue;
      }

      for (const item of items()) {
        const shouldContinue = await highlightNode(item, currentRun, {
          beforeHighlight: () => beforeItem?.(item),
          ensureItemVisible: false,
          duration: itemDuration
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
          hash: '#proof',
          section: '#proof',
          scrollTarget: '.projects-showcase',
          items: () => $$('.projects-showcase'),
          itemDuration: 1600,
          sectionPause: 520,
          showFullSection: true
        },
        {
          hash: '#clients',
          section: '#clients',
          items: () => $$('.clients-grid article'),
          itemDuration: 920
        },
        {
          hash: '#contacts',
          section: '#contacts',
          scrollTarget: '.map-column',
          items: () => $$('.location-card'),
          itemDuration: 920,
          sectionPause: 260,
          beforeItem: (item) => {
            item.querySelector('button')?.click();
          }
        },
        {
          hash: '#footer',
          section: '#footer',
          items: () => $$('.site-footer'),
          itemDuration: 1600,
          sectionPause: 260
        },
        {
          hash: '#company',
          section: '#company',
          items: () => [],
          sectionPause: 900,
          scrollBlock: 'top'
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

  applyConfig();
  void setupVisitStats();
  setupDesktopStage();
  setupNavigation();
  setupHeaderReveal();
  setupModal();
  setupQuoteBuilder();
  setupQuoteFactors();
  setupFloatingActions();
  setupReveal();
  setupLocationMap();
  setupProductionTour();
})();
