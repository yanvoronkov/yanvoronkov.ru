/**
 * Ян Воронков — Дизайн & Разработка цифровых продуктов
 * Основной скрипт интерактивности лендинга
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initCurrentYear();
  initPortfolioFilter();
  initContactForm();
  initPaymentAccordion();
  initTimelineProgress();
  initDocModals();
});

/**
 * Инициализация и управление темой оформления (светлая/темная)
 */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('theme-toggle-sun');
  const moonIcon = document.getElementById('theme-toggle-moon');

  if (!themeToggle || !sunIcon || !moonIcon) return;

  // Функция для установки темы
  const setTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
      localStorage.setItem('theme', 'light');
    }
    
    // Перерисовываем капчу с новой темой оформления
    if (typeof renderTurnstile === 'function') {
      renderTurnstile();
    }
  };

  // Проверка сохраненной темы или системных предпочтений
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

  // Слушатель клика по кнопке переключения
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(!isDark);
  });
}

/**
 * Управление мобильным навигационным меню
 */
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!mobileMenuBtn || !mobileMenu) return;

  // Открытие/закрытие меню по клику на бургер
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  // Закрытие меню при клике на любой из пунктов навигации
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

/**
 * Динамическая установка текущего года в футере
 */
function initCurrentYear() {
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

/**
 * Фильтрация портфолио по категориям (Дизайн, Разработка, Все)
 */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length === 0 || projectCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Сброс активного класса со всех кнопок
      filterBtns.forEach(b => {
        b.classList.remove('bg-brand-indigo', 'text-white');
        b.classList.add('text-neutral-600', 'dark:text-neutral-400');
      });

      // Установка активного класса на нажатую кнопку
      btn.classList.add('bg-brand-indigo', 'text-white');
      btn.classList.remove('text-neutral-600', 'dark:text-neutral-400');

      const filter = btn.dataset.filter;

      // Фильтрация карточек проектов с плавной анимацией прозрачности
      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          // Небольшой таймаут для плавного появления
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          // Скрытие элемента после завершения перехода
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/**
 * Валидация и обработка формы контактов с отправкой на бэкенд
 */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  const submitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('form-name');
    const contactInput = document.getElementById('form-contact');
    const descInput = document.getElementById('form-desc');

    if (!nameInput || !contactInput || !descInput) return;

    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    const desc = descInput.value.trim();

    if (!name || !contact || !desc) {
      showToast('Пожалуйста, заполните все обязательные поля.', false);
      return;
    }

    // Блокируем кнопку отправки и меняем текст
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    // Указываем, что отправка инициирована пользователем
    isFormSubmitting = true;

    // Запускаем невидимую проверку Cloudflare Turnstile
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.execute(turnstileWidgetId);
    } else {
      // Если капча не загрузилась, пытаемся отправить напрямую
      sendContactForm('');
    }
  });
}

/**
 * Фактическая отправка данных на бэкенд после успешной верификации капчи
 */
async function sendContactForm(token) {
  const contactForm = document.getElementById('contact-form');
  const submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
  if (!contactForm || !submitBtn) return;

  const nameInput = document.getElementById('form-name');
  const contactInput = document.getElementById('form-contact');
  const descInput = document.getElementById('form-desc');

  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();
  const desc = descInput.value.trim();

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, contact, desc, 'cf-turnstile-response': token })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      openModal(document.getElementById('modal-success'));
      contactForm.reset();
    } else {
      throw new Error(result.message || 'Ошибка сервера при отправке.');
    }
  } catch (err) {
    console.error('Ошибка отправки формы:', err);
    showToast(err.message || 'Не удалось отправить заявку. Попробуйте еще раз.', false);
  } finally {
    // Всегда сбрасываем флаг отправки после завершения запроса
    isFormSubmitting = false;
    
    // Сбрасываем виджет капчи, чтобы токен обновился для следующей отправки
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
    // Разблокируем кнопку отправки
    submitBtn.disabled = false;
    submitBtn.textContent = 'Отправить заявку';
  }
}

/**
 * Отображение кастомного тост-уведомления
 * @param {string} text - Текст сообщения
 * @param {boolean} success - Статус успешности операции
 */
function showToast(text, success = true) {
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');

  if (!toast || !toastText) return;

  toastText.textContent = text;
  
  if (success) {
    toast.classList.remove('bg-red-500');
    toast.classList.add('bg-brand-emerald');
  } else {
    toast.classList.remove('bg-brand-emerald');
    toast.classList.add('bg-red-500');
  }

  // Появление тоста
  toast.classList.remove('translate-y-20', 'opacity-0');
  
  // Автоматическое скрытие через 4 секунды
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 4000);
}

/**
 * Инициализация и управление аккордеоном способов оплаты
 */
function initPaymentAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector('.accordion-icon');

      if (!content || !icon) return;

      const isOpen = content.classList.contains('active');

      // Закрываем все остальные открытые элементы
      accordionHeaders.forEach(otherHeader => {
        if (otherHeader !== header) {
          const otherContent = otherHeader.nextElementSibling;
          const otherIcon = otherHeader.querySelector('.accordion-icon');
          if (otherContent && otherIcon) {
            otherContent.classList.remove('active');
            otherIcon.classList.remove('active');
            otherContent.style.maxHeight = null;
          }
        }
      });

      // Переключаем текущий элемент
      if (!isOpen) {
        content.classList.add('active');
        icon.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.classList.remove('active');
        icon.classList.remove('active');
        content.style.maxHeight = null;
      }
    });
  });
}

/**
 * Анимация линии прогресса таймлайна и подсветка точек при прокрутке
 */
/**
 * Анимация линии прогресса таймлайна и подсветка точек при прокрутке
 */
function initTimelineProgress() {
  const container = document.getElementById('timeline-container');
  const line = document.getElementById('timeline-line');
  const progress = document.getElementById('timeline-progress');
  const dots = document.querySelectorAll('.timeline-dot');

  if (!container || !line || !progress || dots.length < 2) return;

  function updateTimeline() {
    const containerRect = container.getBoundingClientRect();
    const firstDotRect = dots[0].getBoundingClientRect();
    const lastDotRect = dots[dots.length - 1].getBoundingClientRect();

    // 1. Динамическое выравнивание начала и конца линии по центрам кружков
    const lineTop = (firstDotRect.top + firstDotRect.height / 2) - containerRect.top;
    const lineHeight = (lastDotRect.top + lastDotRect.height / 2) - (firstDotRect.top + firstDotRect.height / 2);

    // Устанавливаем положение контейнера линии относительно контейнера таймлайна
    line.style.top = `${lineTop}px`;
    line.style.height = `${lineHeight}px`;

    // 2. Вычисление прогресса прокрутки линии
    const windowHeight = window.innerHeight;
    const startPoint = windowHeight * 0.65; // Линия начинает заполняться на этой высоте экрана
    const endPoint = windowHeight * 0.35;   // И заканчивает на этой

    // Положение начала линии на экране
    const lineScreenTop = firstDotRect.top + firstDotRect.height / 2;
    const entryProgress = startPoint - lineScreenTop;

    let percent = (entryProgress / lineHeight) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    progress.style.height = `${percent}%`;

    // 3. Подсветка кружков-точек, надписей "ШАГ X" и карточек
    const stepRows = document.querySelectorAll('.timeline-step-row');
    stepRows.forEach((row, idx) => {
      const dot = row.querySelector('.timeline-dot');
      const stepText = row.querySelector('.timeline-step-text');
      const cards = row.querySelectorAll('.timeline-card');

      if (!dot) return;

      const dotRect = dot.getBoundingClientRect();
      const firstDotCenter = firstDotRect.top + firstDotRect.height / 2;
      const dotTopOffset = dotRect.top - firstDotCenter;
      const thresholdPercent = (dotTopOffset / lineHeight) * 100;

      // Шаг 1 подсвечивается сразу, остальные — как только линия касается их верхнего края
      const isActive = idx === 0 ? (percent >= 0) : (percent >= thresholdPercent);

      if (isActive) {
        dot.classList.add('border-brand-violet', 'text-brand-violet', 'scale-105');
        dot.classList.remove('border-neutral-300', 'dark:border-neutral-700', 'text-neutral-400');

        if (stepText) {
          stepText.classList.add('text-brand-indigo', 'dark:text-brand-indigo', 'scale-105');
          stepText.classList.remove('text-neutral-400');
        }

        cards.forEach(card => {
          card.classList.add('active-card');
          card.classList.remove('border-light-border', 'dark:border-dark-border');
        });
      } else {
        dot.classList.remove('border-brand-violet', 'text-brand-violet', 'scale-105');
        dot.classList.add('border-neutral-300', 'dark:border-neutral-700', 'text-neutral-400');

        if (stepText) {
          stepText.classList.remove('text-brand-indigo', 'dark:text-brand-indigo', 'scale-105');
          stepText.classList.add('text-neutral-400');
        }

        cards.forEach(card => {
          card.classList.remove('active-card');
          card.classList.add('border-light-border', 'dark:border-dark-border');
        });
      }
    });
  }

  // Запуск при прокрутке, загрузке и изменении размеров окна
  window.addEventListener('scroll', updateTimeline);
  window.addEventListener('resize', updateTimeline);
  
  // Небольшая задержка, чтобы элементы успели отрисоваться на экране для точного позиционирования
  setTimeout(updateTimeline, 100);
}

/**
 * Вспомогательные функции открытия/закрытия модальных окон
 */
function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.classList.add('opacity-100', 'pointer-events-auto');
  
  const inner = modal.querySelector('.transform');
  if (inner) {
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }
  
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.classList.remove('opacity-100', 'pointer-events-auto');
  
  const inner = modal.querySelector('.transform');
  if (inner) {
    inner.classList.remove('scale-100');
    inner.classList.add('scale-95');
  }
  
  document.body.style.overflow = '';
}

/**
 * Управление модальными окнами документов (Договор оферты и Политика конфиденциальности)
 */
function initDocModals() {
  const modalOffer = document.getElementById('modal-offer');
  const modalPrivacy = document.getElementById('modal-privacy');
  const modalSuccess = document.getElementById('modal-success');
  
  const btnOpenOffer = document.getElementById('btn-open-offer');
  const btnOpenPrivacy = document.getElementById('btn-open-privacy');
  
  if (!modalOffer || !modalPrivacy) return;

  // Навешиваем открытие
  if (btnOpenOffer) {
    btnOpenOffer.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(modalOffer);
    });
  }
  if (btnOpenPrivacy) {
    btnOpenPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(modalPrivacy);
    });
  }

  // Навешиваем закрытие на все кнопки закрытия внутри всех модалок (включая окно успеха)
  const allModals = [modalOffer, modalPrivacy, modalSuccess].filter(Boolean);
  allModals.forEach(modal => {
    const closeBtns = modal.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => closeModal(modal));
    });

    // Закрытие при клике по оверлею (вне контента)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Закрытие по кнопке Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(modal => {
        if (modal.classList.contains('opacity-100')) {
          closeModal(modal);
        }
      });
    }
  });
}

// Глобальные переменные для управления виджетом Cloudflare Turnstile
let turnstileWidgetId = null;
let isFormSubmitting = false; // Флаг, предотвращающий ложный сабмит при фоновой проверке Turnstile

/**
 * Программный рендеринг виджета Cloudflare Turnstile с нужной темой
 */
function renderTurnstile() {
  const container = document.getElementById('turnstile-container');
  if (!container || !window.turnstile) return;

  const isDark = document.documentElement.classList.contains('dark');
  const sitekey = container.getAttribute('data-sitekey');

  try {
    // Если виджет уже был отрендерен, удаляем его
    if (turnstileWidgetId !== null) {
      window.turnstile.remove(turnstileWidgetId);
      turnstileWidgetId = null;
    }

    container.innerHTML = '';

    // Инициализируем виджет с соответствующей темой и невидимым размером
    turnstileWidgetId = window.turnstile.render('#turnstile-container', {
      sitekey: sitekey,
      theme: isDark ? 'dark' : 'light',
      size: 'invisible',
      callback: function(token) {
        // Капча успешно пройдена в фоне, отправляем данные ТОЛЬКО если пользователь нажал сабмит
        if (isFormSubmitting) {
          sendContactForm(token);
          isFormSubmitting = false;
        }
      },
      'error-callback': function() {
        showToast('Проверка безопасности не пройдена. Пожалуйста, попробуйте еще раз или обновите страницу.', false);
        
        isFormSubmitting = false; // Сбрасываем флаг при ошибке
        
        // Разблокируем кнопку отправки
        const contactForm = document.getElementById('contact-form');
        const submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить заявку';
        }
      }
    });
  } catch (e) {
    console.error('Ошибка при рендере Cloudflare Turnstile:', e);
  }
}

/**
 * Глобальный callback-слушатель, вызываемый скриптом Cloudflare при загрузке API
 */
window.onloadTurnstileCallback = function () {
  renderTurnstile();
};
