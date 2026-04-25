(function () {
  const defaults = {
    siteName: 'ООО В2е - производство металлоконструкций',
    siteUrl: 'https://efnatii.github.io/metallokonstrukcii-site/',
    phone: '+79650578270',
    phoneDisplay: '+7 965 057 82 70',
    phoneHref: 'tel:+79650578270',
    email: 'zakaz@b2energy.ru',
    emailHref: 'mailto:zakaz@b2energy.ru',
    maxUrl: 'https://max.ru/',
    address: 'Санкт-Петербург, ул. Седова, 57, лит. В',
    yandexMapUrl: 'https://yandex.ru/maps/',
    yandexMapEmbedUrl: 'https://yandex.ru/map-widget/v1/?text=Седова%2057&z=15',
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

  function injectStructuredData() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'LocalBusiness'],
      name: 'ООО В2е',
      legalName: 'ООО В2е',
      url: config.siteUrl,
      email: config.email,
      telephone: config.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Санкт-Петербург',
        streetAddress: config.address,
        addressCountry: 'RU'
      },
      areaServed: ['СЗФО', 'ЦФО'],
      makesOffer: [
        'Строительные металлоконструкции',
        'Закладные детали',
        'Лестницы металлические',
        'Навесы',
        'Ворота',
        'Резервуары',
        'Арочные конструкции',
        'Нестандартные конструкции',
        'Монтаж металлоконструкций',
        'Резка металла',
        'Гибка металла',
        'Металлообработка',
        'Порошковая окраска'
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.append(script);
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

      try {
        if (config.leadEndpoint) {
          const response = await fetch(config.leadEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Endpoint responded ${response.status}`);
          }
        } else {
          const subject = encodeURIComponent(`Заявка с сайта В2е: ${payload.objectType}`);
          const body = encodeURIComponent(
            `Имя: ${payload.name}\nТелефон: ${payload.phone}\nТип объекта: ${payload.objectType}\nИсточник: ${payload.source}\nСтраница: ${payload.page}`
          );
          window.location.href = `${config.emailHref}?subject=${subject}&body=${body}`;
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

  function setupLazyMap() {
    const iframe = $('[data-map-lazy="true"]');

    if (!iframe) {
      return;
    }

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

  applyConfig();
  injectStructuredData();
  setupNavigation();
  setupCalculator();
  setupModal();
  setupFloatingActions();
  setupReveal();
  setupLazyMap();
})();
