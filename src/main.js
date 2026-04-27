(function () {
  const defaultAddress = 'Санкт-Петербург, ул. Седова, 57, лит. В, помещ. 11-Н, ком. 3';
  const officePoint = encodeURIComponent('30.425277,59.879804');

  const defaults = {
    siteName: 'ООО B2E - производство металлоконструкций',
    siteUrl: 'https://efnatii.github.io/metallokonstrukcii-site/',
    phone: '+79650578270',
    phoneDisplay: '+7 (965) 057-82-70',
    phoneHref: 'tel:+79650578270',
    workHours: 'Пн-Пт 09:00 - 18:00',
    email: 'zakaz@b2energy.ru',
    emailHref: 'mailto:zakaz@b2energy.ru',
    maxUrl: 'https://max.ru/',
    address: defaultAddress,
    yandexMapUrl: `https://yandex.ru/maps/?ll=${officePoint}&mode=whatshere&whatshere%5Bpoint%5D=${officePoint}&whatshere%5Bzoom%5D=17&z=17`,
    yandexMapEmbedUrl: `https://yandex.ru/map-widget/v1/?ll=${officePoint}&mode=whatshere&whatshere%5Bpoint%5D=${officePoint}&whatshere%5Bzoom%5D=17&z=17`,
    leadEndpoint: ''
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
    const actions = $('.floating-actions');
    const phone = $('.phone-float');
    const max = $('.max-float');

    actions?.classList.add('is-max-pending');
    setTimeout(() => phone?.classList.add('is-visible'), 5000);
    setTimeout(() => {
      actions?.classList.remove('is-max-pending');
      max?.classList.add('is-visible');
    }, 10000);
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

    const readLocation = (button) => {
      const lat = Number(button.dataset.mapLat);
      const lng = Number(button.dataset.mapLng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      return {
        key: button.dataset.mapKey || button.dataset.mapName || `${lat},${lng}`,
        lat,
        lng,
        zoom: Number(button.dataset.mapZoom) || 13,
        name: button.dataset.mapName || button.textContent.trim(),
        kind: button.dataset.mapKind || 'Площадка',
        url: button.dataset.mapUrl || config.yandexMapUrl
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

      if (map) {
        if (move) {
          map.setView([location.lat, location.lng], location.zoom, { animate: true });
        }

        markers.forEach((marker, key) => marker.setIcon(createIcon(key === location.key)));
        const marker = markers.get(location.key);

        if (marker && openPopup) {
          marker.openPopup();
        }
      }
    };

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => activate(button));
    });

    activate(activeItem.button, { move: false });
  }

  applyConfig();
  setupNavigation();
  setupCalculator();
  setupModal();
  setupFloatingActions();
  setupReveal();
  setupLocationMap();
})();
