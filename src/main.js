(function () {
  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const officePoint = encodeURIComponent('30.4230533,59.8864045');

  const defaults = {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl: 'https://efnatii.github.io/metallokonstrukcii-site/',
    phone: '+79650578270',
    phoneDisplay: '+7 965 057 82 70',
    phoneHref: 'tel:+79650578270',
    email: 'zakaz@b2energy.ru',
    emailHref: 'mailto:zakaz@b2energy.ru',
    maxUrl: 'https://max.ru/',
    address: defaultAddress,
    yandexMapUrl: `https://yandex.ru/maps/?ll=${officePoint}&mode=whatshere&whatshere%5Bpoint%5D=${officePoint}&whatshere%5Bzoom%5D=16&z=16`,
    yandexMapEmbedUrl: `https://yandex.ru/map-widget/v1/?ll=${officePoint}&mode=whatshere&whatshere%5Bpoint%5D=${officePoint}&whatshere%5Bzoom%5D=16&z=16`,
    leadEndpoint: ''
  };

  const config = { ...defaults, ...(window.B2E_CONFIG || {}) };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

  function getCalculatorValues(form) {
    const field = (name) => form.elements.namedItem(name);
    const length = Number(field('length')?.value) || 0;
    const width = Number(field('width')?.value) || 0;
    const height = Number(field('height')?.value) || 0;
    const crane = Boolean(field('crane')?.checked);
    const coefficient = height >= 10 ? (crane ? 0.09 : 0.08) : crane ? 0.065 : 0.05;
    const tonnage = length * width * height * coefficient;

    return { length, width, height, crane, coefficient, tonnage };
  }

  function formatTonnage(value) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded} т` : `${rounded.toFixed(1)} т`;
  }

  function setupCalculator() {
    const form = $('#tonnageCalculator');
    const result = $('#calcResult');

    if (!form || !result) {
      return;
    }

    const update = () => {
      const values = getCalculatorValues(form);
      result.innerHTML = `
        <span>Ориентировочный тоннаж</span>
        <strong>${formatTonnage(values.tonnage)}</strong>
        <small>Коэффициент ${String(values.coefficient).replace('.', ',')}</small>
      `;
    };

    form.addEventListener('input', update);
    update();
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

    const restoreForm = () => {
      if (!form.elements.namedItem('name')) {
        form.innerHTML = originalFormHtml;
      }

      const status = $('.form-status', form);
      if (status) {
        status.textContent = '';
      }
    };

    const openModal = (objectType, source) => {
      restoreForm();

      if (objectType) {
        form.elements.objectType.value = objectType;
      }

      if (source) {
        form.elements.source.value = source;
      }

      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', '');
      }

      document.body.classList.add('modal-open');
      setTimeout(() => form.elements.name.focus(), 80);
    };

    const closeModal = () => {
      modal.close?.();
      modal.removeAttribute('open');
      document.body.classList.remove('modal-open');
    };

    $$('.callback-trigger').forEach((button) => {
      button.addEventListener('click', () => {
        const typeFromButton = button.dataset.objectType;
        const calcForm = $('#tonnageCalculator');
        let source = '';

        if (typeFromButton === 'Расчет тоннажа' && calcForm) {
          const values = getCalculatorValues(calcForm);
          source = `calculator: ${values.length}x${values.width}x${values.height}, crane=${values.crane}, coefficient=${values.coefficient}, result=${formatTonnage(values.tonnage)}`;
        }

        openModal(typeFromButton, source);
      });
    });

    close?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));

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
        source: String(formData.get('source') || 'callback').trim(),
        page: window.location.href,
        createdAt: new Date().toISOString()
      };

      const openMailFallback = () => {
        const subject = encodeURIComponent(`Заявка с сайта B2E: ${payload.objectType}`);
        const body = encodeURIComponent(
          `Имя: ${payload.name}\nТелефон: ${payload.phone}\nТип объекта: ${payload.objectType}\nИсточник: ${payload.source}\nСтраница: ${payload.page}`
        );
        window.location.href = `${config.emailHref}?subject=${subject}&body=${body}`;
      };

      try {
        let sentAutomatically = false;

        if (config.leadEndpoint) {
          try {
            const response = await fetch(config.leadEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            sentAutomatically = response.ok;

            if (!response.ok) {
              console.error(new Error(`Endpoint responded ${response.status}`));
            }
          } catch (endpointError) {
            console.error(endpointError);
          }
        }

        if (!sentAutomatically) {
          openMailFallback();
        }

        if (successTemplate) {
          form.replaceChildren(successTemplate.content.cloneNode(true));
        }
      } catch (error) {
        if (status) {
          status.textContent =
            'Не удалось отправить автоматически. Позвоните нам или отправьте письмо на почту, указанную в контактах.';
        }
        console.error(error);
      }
    });
  }

  function setupFloatingActions() {
    const phone = $('.phone-float');
    const max = $('.max-float');

    setTimeout(() => phone?.classList.add('is-visible'), 5000);
    setTimeout(() => max?.classList.add('is-visible'), 10000);
    setTimeout(() => {
      phone?.classList.add('is-expanded');
      setTimeout(() => phone?.classList.remove('is-expanded'), 10000);
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

  function isIframeBlank(iframe) {
    try {
      const href = iframe.contentWindow?.location.href;
      return !href || href === 'about:blank';
    } catch {
      return false;
    }
  }

  function verifyMapFrame(iframe, wrap) {
    if (!iframe || !wrap) {
      return;
    }

    if (isIframeBlank(iframe)) {
      wrap.classList.remove('is-loaded');
      wrap.classList.add('is-unavailable');
      return;
    }

    wrap.classList.remove('is-unavailable');
    wrap.classList.add('is-loaded');
  }

  function setupLazyMap() {
    const iframe = $('[data-map-lazy="true"]');
    const wrap = iframe?.closest('.map-wrap');

    if (!iframe) {
      return;
    }

    let loaded = false;

    iframe.addEventListener('load', () => {
      loaded = true;
      setTimeout(() => verifyMapFrame(iframe, wrap), 500);
    });

    setTimeout(() => {
      if (!loaded || isIframeBlank(iframe)) {
        wrap?.classList.add('is-unavailable');
      }
    }, 2500);

    setTimeout(() => verifyMapFrame(iframe, wrap), 9000);

    const loadMap = () => {
      const src = iframe.dataset.resolvedSrc || config[iframe.dataset.configSrc];
      if (src && !iframe.getAttribute('src')) {
        iframe.setAttribute('src', src);
      }
    };

    if (!('IntersectionObserver' in window)) {
      loadMap();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMap();
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(iframe);
  }

  function setupLocationMap() {
    const iframe = $('[data-map-lazy="true"]');
    const externalLink = $('[data-location-map-link]');
    const fallbackLink = $('[data-map-fallback-link]');
    const wrap = iframe?.closest('.map-wrap');
    const cards = $$('.location-card');
    const buttons = $$('.location-card button[data-map-src]');
    const previewPins = $$('.map-pin[data-preview-pin]');

    if (!iframe || !buttons.length) {
      return;
    }

    const activate = (button, options = {}) => {
      const { load = false } = options;
      const card = button.closest('.location-card');

      cards.forEach((item) => item.classList.remove('is-active'));
      buttons.forEach((item) => item.setAttribute('aria-pressed', 'false'));
      card?.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');

      if (button.dataset.mapKey) {
        previewPins.forEach((pin) => pin.classList.toggle('is-active', pin.dataset.previewPin === button.dataset.mapKey));
      }

      if (button.dataset.mapTitle) {
        iframe.setAttribute('title', button.dataset.mapTitle);
      }

      if (button.dataset.mapSrc) {
        iframe.dataset.resolvedSrc = button.dataset.mapSrc;

        if (load || iframe.getAttribute('src')) {
          wrap?.classList.remove('is-loaded');
          wrap?.classList.add('is-unavailable');
          iframe.setAttribute('src', button.dataset.mapSrc);
          setTimeout(() => {
            if (iframe.getAttribute('src') === button.dataset.mapSrc) {
              verifyMapFrame(iframe, wrap);
            }
          }, 2500);
          setTimeout(() => {
            if (iframe.getAttribute('src') === button.dataset.mapSrc) {
              verifyMapFrame(iframe, wrap);
            }
          }, 9000);
        }
      }

      if (externalLink && button.dataset.mapUrl) {
        externalLink.setAttribute('href', button.dataset.mapUrl);
      }

      if (fallbackLink && button.dataset.mapUrl) {
        fallbackLink.setAttribute('href', button.dataset.mapUrl);
      }
    };

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => activate(button, { load: true }));
    });

    const activeButton = $('.location-card.is-active button[data-map-src]');
    if (activeButton) {
      activate(activeButton);
    }
  }

  applyConfig();
  setupNavigation();
  setupCalculator();
  setupModal();
  setupFloatingActions();
  setupReveal();
  setupLocationMap();
  setupLazyMap();
})();
