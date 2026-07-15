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

  contactForm.addEventListener('submit', async (event) => {
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
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, contact, desc })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(`Спасибо, ${name}! Заявка успешно отправлена.`);
        contactForm.reset();
      } else {
        throw new Error(result.message || 'Ошибка сервера при отправке.');
      }
    } catch (err) {
      console.error('Ошибка отправки формы:', err);
      showToast(err.message || 'Не удалось отправить заявку. Попробуйте еще раз.', false);
    } finally {
      // Разблокируем кнопку
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
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
