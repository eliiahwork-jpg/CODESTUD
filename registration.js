// СтудРадар — registration flow modal (shared across pages)
(function() {
  'use strict';

  // ========================================================
  // 1. INJECT MODAL HTML
  // ========================================================
  var html = ''
    + '<div class="reg-modal" id="reg-modal" hidden>'
    +   '<div class="reg-overlay" data-close></div>'
    +   '<div class="reg-card" role="dialog" aria-modal="true" aria-label="Регистрация">'
    +     '<button class="reg-close" type="button" data-close aria-label="Закрыть">'
    +       '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    +     '</button>'
    +     '<div class="reg-progress" id="reg-progress"></div>'
    +     '<div class="reg-body" id="reg-body"></div>'
    +   '</div>'
    + '</div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstElementChild);

  var modal    = document.getElementById('reg-modal');
  var body     = document.getElementById('reg-body');
  var progress = document.getElementById('reg-progress');

  // ========================================================
  // 2. STATE
  // ========================================================
  var state = {
    role: null,         // 'student' | 'employer'
    step: 0,            // 0 = role pick, then 1..N
    data: {}            // collected form values
  };

  var STUDENT_STEPS = [
    { id: 'role',     title: 'Зарегистрироваться',                   subtitle: 'Выберите, кем вы хотите стать на платформе' },
    { id: 'account',  title: 'Создайте аккаунт',                     subtitle: 'Эти данные понадобятся для входа' },
    { id: 'personal', title: 'Расскажите о себе',                    subtitle: 'Так заказчики увидят, кто будет работать над задачами' },
    { id: 'study',    title: 'Где вы учитесь?',                      subtitle: 'Студенческий статус — ваше главное преимущество' },
    { id: 'docs',     title: 'Подтверждение студенческого',          subtitle: 'Загрузите фото или скан студенческого билета — это поможет нам подтвердить статус' },
    { id: 'success',  title: '',                                     subtitle: '' }
  ];

  var EMPLOYER_STEPS = [
    { id: 'role',     title: 'Зарегистрироваться',                   subtitle: 'Выберите, кем вы хотите стать на платформе' },
    { id: 'account',  title: 'Создайте аккаунт',                     subtitle: 'Эти данные понадобятся для входа' },
    { id: 'company',  title: 'Компания',                             subtitle: 'Расскажите о бизнесе, чтобы студенты знали, с кем работают' },
    { id: 'contact',  title: 'Контактное лицо',                      subtitle: 'Кто будет общаться со студентами от лица компании' },
    { id: 'success',  title: '',                                     subtitle: '' }
  ];

  function flow() { return state.role === 'employer' ? EMPLOYER_STEPS : STUDENT_STEPS; }

  // ========================================================
  // 3. PUBLIC API & TRIGGERS
  // ========================================================
  function open() {
    state = { role: null, step: 0, data: {} };
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ modal.classList.add('is-open'); });
    render();
  }
  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function(){ modal.setAttribute('hidden', ''); }, 220);
  }

  // Wire up every "Войти" button on the page
  document.addEventListener('click', function(e) {
    var loginBtn = e.target.closest('.btn-login');
    if (loginBtn) {
      e.preventDefault();
      open();
      return;
    }
    // close on overlay / X
    if (e.target.closest('[data-close]')) { close(); return; }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
  });

  // ========================================================
  // 4. RENDER
  // ========================================================
  function render() {
    var steps = flow();
    var current = steps[state.step];
    renderProgress(steps, state.step, !!current && current.id === 'success');
    body.classList.remove('reg-body--enter');
    void body.offsetWidth;
    body.classList.add('reg-body--enter');
    body.innerHTML = renderStep(current);
    bindStep(current);
  }

  function renderProgress(steps, idx, isSuccess) {
    if (isSuccess) { progress.innerHTML = ''; return; }
    // skip the role-pick step from the visual count
    var visible = steps.slice(1).filter(function(s){ return s.id !== 'success'; });
    var visibleIdx = idx - 1; // 0-based among visible
    if (idx === 0) { progress.innerHTML = ''; return; }
    var dots = '';
    for (var i = 0; i < visible.length; i++) {
      var stateCls = i < visibleIdx ? 'done' : (i === visibleIdx ? 'active' : '');
      dots += '<div class="reg-step ' + stateCls + '">'
        + '<div class="reg-step-dot">' + (i < visibleIdx
          ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.8 9 10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : (i + 1)) + '</div>'
        + (i < visible.length - 1 ? '<div class="reg-step-line"></div>' : '')
        + '</div>';
    }
    progress.innerHTML = '<div class="reg-steps">' + dots + '</div>';
  }

  function renderStep(s) {
    if (!s) return '';
    if (s.id === 'success') return renderSuccess();
    var head = ''
      + '<div class="reg-head">'
      +   '<h2 class="reg-title">' + s.title + '</h2>'
      +   (s.subtitle ? '<p class="reg-subtitle">' + s.subtitle + '</p>' : '')
      + '</div>';
    if (s.id === 'role')      return head + renderRole();
    if (s.id === 'account')   return head + renderAccount();
    if (s.id === 'personal')  return head + renderPersonal();
    if (s.id === 'study')     return head + renderStudy();
    if (s.id === 'docs')      return head + renderDocs();
    if (s.id === 'company')   return head + renderCompany();
    if (s.id === 'contact')   return head + renderContact();
    return '';
  }

  // ---------- step bodies ----------
  function renderRole() {
    return ''
      + '<div class="reg-roles">'
      +   '<button type="button" class="reg-role" data-role="student">'
      +     '<div class="reg-role-icon">'
      +       '<svg viewBox="0 0 48 48" fill="none">'
      +         '<path d="M24 8 L40 16 L24 24 L8 16 Z" fill="#1153B5"/>'
      +         '<path d="M14 19 V27 C14 30 18 32 24 32 C30 32 34 30 34 27 V19" stroke="#1153B5" stroke-width="2.5" stroke-linecap="round"/>'
      +         '<path d="M40 16 V26" stroke="#1153B5" stroke-width="2.5" stroke-linecap="round"/>'
      +       '</svg>'
      +     '</div>'
      +     '<div class="reg-role-text">'
      +       '<div class="reg-role-title">Я студент</div>'
      +       '<div class="reg-role-desc">Хочу зарабатывать и набирать опыт по своей специальности</div>'
      +     '</div>'
      +     '<svg class="reg-role-arrow" viewBox="0 0 20 20" fill="none"><path d="M7 4 L13 10 L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      +   '</button>'
      +   '<button type="button" class="reg-role" data-role="employer">'
      +     '<div class="reg-role-icon reg-role-icon--orange">'
      +       '<svg viewBox="0 0 48 48" fill="none">'
      +         '<rect x="10" y="14" width="28" height="26" rx="3" fill="#DD5444"/>'
      +         '<rect x="18" y="8" width="12" height="8" rx="1.5" stroke="#DD5444" stroke-width="2.5" fill="none"/>'
      +         '<rect x="20" y="22" width="8" height="6" rx="1" fill="white"/>'
      +       '</svg>'
      +     '</div>'
      +     '<div class="reg-role-text">'
      +       '<div class="reg-role-title">Я заказчик</div>'
      +       '<div class="reg-role-desc">Ищу студентов для разовых задач и регулярных проектов</div>'
      +     '</div>'
      +     '<svg class="reg-role-arrow" viewBox="0 0 20 20" fill="none"><path d="M7 4 L13 10 L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      +   '</button>'
      + '</div>'
      + '<div class="reg-already">Уже есть аккаунт? <a href="#" data-action="signin">Войти</a></div>';
  }

  function renderAccount() {
    var d = state.data;
    return ''
      + '<form class="reg-form" data-form>'
      +   field('email',     'Email',         'email',    'you@example.com',    d.email)
      +   field('phone',     'Телефон',       'tel',      '+7 (___) ___-__-__', d.phone)
      +   field('password',  'Пароль',        'password', 'Минимум 8 символов', d.password)
      +   field('password2', 'Повторите пароль', 'password', '',                d.password2)
      +   actions(true)
      + '</form>';
  }

  function renderPersonal() {
    var d = state.data;
    return ''
      + '<form class="reg-form" data-form>'
      +   '<div class="reg-row">'
      +     field('firstName', 'Имя',     'text', 'Мария',   d.firstName)
      +     field('lastName',  'Фамилия', 'text', 'Иванова', d.lastName)
      +   '</div>'
      +   '<div class="reg-row">'
      +     field('birthdate', 'Дата рождения', 'date', '', d.birthdate)
      +     selectField('city', 'Город', d.city, ['Ханты-Мансийск', 'Тюмень', 'Екатеринбург', 'Москва', 'Санкт-Петербург', 'Другой'])
      +   '</div>'
      +   actions(true)
      + '</form>';
  }

  function renderStudy() {
    var d = state.data;
    return ''
      + '<form class="reg-form" data-form>'
      +   selectField('uni',     'Университет', d.uni, ['Югорский государственный университет (ЮГУ)', 'Тюменский государственный университет (ТюмГУ)', 'Уральский федеральный университет (УрФУ)', 'Другой'])
      +   field('faculty',  'Факультет', 'text', 'Лингвистика. Перевод и переводоведение', d.faculty)
      +   selectField('year', 'Курс', d.year, ['1 курс', '2 курс', '3 курс', '4 курс', '5 курс', '6 курс', 'Магистратура', 'Аспирантура'])
      +   actions(true)
      + '</form>';
  }

  function renderDocs() {
    var d = state.data;
    var hasFile = !!d.studentIdImage;
    return ''
      + '<form class="reg-form" data-form>'
      +   '<div class="reg-upload ' + (hasFile ? 'has-file' : '') + '" id="reg-upload">'
      +     (hasFile
        ? '<div class="reg-upload-preview">'
        +   '<img src="' + d.studentIdImage + '" alt="Студенческий билет"/>'
        +   '<div class="reg-upload-info">'
        +     '<div class="reg-upload-name">' + (d.studentIdName || 'студенческий.jpg') + '</div>'
        +     '<button type="button" class="reg-upload-remove" data-remove>Удалить</button>'
        +   '</div>'
        + '</div>'
        : '<svg class="reg-upload-icon" viewBox="0 0 48 48" fill="none">'
        + '<path d="M24 32 V14 M16 22 L24 14 L32 22" stroke="#1153B5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M10 30 V36 C10 37.1 10.9 38 12 38 H36 C37.1 38 38 37.1 38 36 V30" stroke="#1153B5" stroke-width="2.5" stroke-linecap="round"/>'
        + '</svg>'
        + '<div class="reg-upload-title">Перетащите файл сюда</div>'
        + '<div class="reg-upload-or">или <label class="reg-upload-pick">выберите на компьютере<input type="file" accept="image/*" id="reg-file" hidden/></label></div>'
        + '<div class="reg-upload-hint">JPG, PNG, до 10 МБ. Должны быть видны ФИО, серия, номер и подпись</div>'
      )
      +   '</div>'
      +   actions(true)
      + '</form>';
  }

  function renderCompany() {
    var d = state.data;
    return ''
      + '<form class="reg-form" data-form>'
      +   field('companyName', 'Название компании или ИП',  'text', 'ООО «Югра-Экспо»',     d.companyName)
      +   selectField('industry', 'Сфера деятельности', d.industry, ['IT и разработка', 'Маркетинг и реклама', 'Розничная торговля', 'Образование', 'Event-индустрия', 'HoReCa', 'Производство', 'Другое'])
      +   field('inn',         'ИНН (необязательно)',           'text', '7710140679',            d.inn)
      +   actions(true)
      + '</form>';
  }

  function renderContact() {
    var d = state.data;
    return ''
      + '<form class="reg-form" data-form>'
      +   '<div class="reg-row">'
      +     field('firstName', 'Имя',     'text', 'Анна',   d.firstName)
      +     field('lastName',  'Фамилия', 'text', 'Петрова', d.lastName)
      +   '</div>'
      +   field('position',  'Должность', 'text', 'HR-менеджер', d.position)
      +   '<label class="reg-check">'
      +     '<input type="checkbox" name="terms" ' + (d.terms ? 'checked' : '') + '/>'
      +     '<span>Я согласен с <a href="#" target="_blank">политикой обработки персональных данных</a> и <a href="#" target="_blank">пользовательским соглашением</a></span>'
      +   '</label>'
      +   actions(true)
      + '</form>';
  }

  function renderSuccess() {
    var name = state.data.firstName || (state.role === 'employer' ? 'Партнёр' : 'Студент');
    var heading = state.role === 'employer' ? 'Заявка отправлена!' : 'Регистрация прошла успешно!';
    var sub = state.role === 'employer'
      ? 'Мы проверим компанию в течение рабочего дня и пришлём подтверждение на почту.'
      : 'Мы отправили письмо для подтверждения почты. Документы проверим в течение 24 часов.';
    return ''
      + '<div class="reg-success">'
      +   '<div class="reg-success-anim">'
      +     '<span class="reg-success-pulse"></span>'
      +     '<span class="reg-success-pulse reg-success-pulse--2"></span>'
      +     '<svg class="reg-success-icon" viewBox="0 0 80 80" fill="none">'
      +       '<circle class="reg-success-circle" cx="40" cy="40" r="36" stroke="#1153B5" stroke-width="4"/>'
      +       '<path class="reg-success-check" d="M24 42 L36 54 L58 30" stroke="#1153B5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
      +     '</svg>'
      +   '</div>'
      +   '<h2 class="reg-success-title">' + heading + '</h2>'
      +   '<p class="reg-success-sub">' + name + ', ' + sub + '</p>'
      +   '<button type="button" class="btn btn-accent reg-success-btn" data-finish>'
      +     (state.role === 'employer' ? 'На главную' : 'В личный кабинет')
      +     '<svg class="btn-arrow" viewBox="0 0 44 16" fill="none"><polygon points="0,0 8,8 0,16"/><polygon points="14,0 22,8 14,16"/><polygon points="28,0 36,8 28,16"/></svg>'
      +   '</button>'
      + '</div>';
  }

  // ---------- form helpers ----------
  function field(name, label, type, placeholder, value) {
    return ''
      + '<div class="reg-field">'
      +   '<label class="reg-label" for="rf-' + name + '">' + label + '</label>'
      +   '<input class="reg-input" id="rf-' + name + '" name="' + name + '" type="' + type + '" placeholder="' + (placeholder || '') + '" value="' + (value || '') + '"/>'
      +   '<span class="reg-error" data-error-for="' + name + '"></span>'
      + '</div>';
  }
  function selectField(name, label, value, options) {
    var opts = '<option value="" disabled ' + (!value ? 'selected' : '') + '>Выберите…</option>';
    for (var i = 0; i < options.length; i++) {
      var v = options[i];
      opts += '<option value="' + v + '"' + (v === value ? ' selected' : '') + '>' + v + '</option>';
    }
    return ''
      + '<div class="reg-field">'
      +   '<label class="reg-label" for="rf-' + name + '">' + label + '</label>'
      +   '<div class="reg-select-wrap">'
      +     '<select class="reg-input reg-select" id="rf-' + name + '" name="' + name + '">' + opts + '</select>'
      +     '<svg class="reg-select-caret" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      +   '</div>'
      +   '<span class="reg-error" data-error-for="' + name + '"></span>'
      + '</div>';
  }
  function actions(showBack) {
    return ''
      + '<div class="reg-actions">'
      +   (showBack
        ? '<button type="button" class="reg-btn reg-btn--ghost" data-back>Назад</button>'
        : '<span></span>')
      +   '<button type="submit" class="reg-btn reg-btn--primary" data-next>Дальше'
      +     '<svg viewBox="0 0 20 20" fill="none"><path d="M5 10 H15 M11 6 L15 10 L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      +   '</button>'
      + '</div>';
  }

  // ========================================================
  // 5. STEP BINDINGS & VALIDATION
  // ========================================================
  function bindStep(s) {
    if (!s) return;
    if (s.id === 'role') {
      body.querySelectorAll('.reg-role').forEach(function(btn) {
        btn.addEventListener('click', function() {
          state.role = btn.dataset.role;
          state.step = 1;
          render();
        });
      });
      var signin = body.querySelector('[data-action="signin"]');
      if (signin) signin.addEventListener('click', function(e){
        e.preventDefault();
        try { localStorage.setItem('studradar_session', JSON.stringify({role: 'student'})); } catch(_e) {}
        window.location.href = 'catalog.html';
      });
      return;
    }
    if (s.id === 'success') {
      var fin = body.querySelector('[data-finish]');
      if (fin) fin.addEventListener('click', function() {
        try { localStorage.setItem('studradar_session', JSON.stringify({role: state.role})); } catch(_e) {}
        var dest = state.role === 'employer' ? 'index.html' : 'catalog.html';
        close();
        setTimeout(function(){ window.location.href = dest; }, 220);
      });
      return;
    }

    var form = body.querySelector('[data-form]');
    if (!form) return;

    var back = body.querySelector('[data-back]');
    if (back) back.addEventListener('click', function() {
      collect(form);
      state.step = Math.max(0, state.step - 1);
      // when going back to role, clear role to allow change
      if (state.step === 0) state.role = null;
      render();
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      collect(form);
      var errs = validate(s.id);
      if (Object.keys(errs).length) { showErrors(errs); return; }
      state.step += 1;
      render();
    });

    // file upload bindings
    if (s.id === 'docs') bindDocs();
  }

  function collect(form) {
    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function(el) {
      if (el.type === 'file') return;
      if (el.type === 'checkbox') state.data[el.name] = el.checked;
      else state.data[el.name] = el.value.trim();
    });
  }

  function validate(stepId) {
    var d = state.data;
    var errs = {};
    if (stepId === 'account') {
      if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Введите корректный email';
      if (!d.phone || d.phone.replace(/\D/g, '').length < 10) errs.phone = 'Введите телефон';
      if (!d.password || d.password.length < 8) errs.password = 'Минимум 8 символов';
      if (d.password !== d.password2) errs.password2 = 'Пароли не совпадают';
    } else if (stepId === 'personal') {
      if (!d.firstName) errs.firstName = 'Введите имя';
      if (!d.lastName)  errs.lastName  = 'Введите фамилию';
      if (!d.birthdate) errs.birthdate = 'Укажите дату рождения';
      if (!d.city)      errs.city      = 'Выберите город';
    } else if (stepId === 'study') {
      if (!d.uni)     errs.uni     = 'Выберите университет';
      if (!d.faculty) errs.faculty = 'Введите факультет';
      if (!d.year)    errs.year    = 'Выберите курс';
    } else if (stepId === 'docs') {
      if (!d.studentIdImage) errs.upload = 'Загрузите фото студенческого билета';
    } else if (stepId === 'company') {
      if (!d.companyName) errs.companyName = 'Введите название';
      if (!d.industry)    errs.industry    = 'Выберите сферу';
    } else if (stepId === 'contact') {
      if (!d.firstName) errs.firstName = 'Введите имя';
      if (!d.lastName)  errs.lastName  = 'Введите фамилию';
      if (!d.position)  errs.position  = 'Введите должность';
      if (!d.terms)     errs.terms     = 'Нужно согласие с правилами';
    }
    return errs;
  }

  function showErrors(errs) {
    body.querySelectorAll('.reg-error').forEach(function(el){ el.textContent = ''; el.classList.remove('show'); });
    body.querySelectorAll('.reg-input, .reg-check').forEach(function(el){ el.classList.remove('has-error'); });
    Object.keys(errs).forEach(function(name) {
      var msg = errs[name];
      var slot = body.querySelector('[data-error-for="' + name + '"]');
      if (slot) { slot.textContent = msg; slot.classList.add('show'); }
      var input = body.querySelector('[name="' + name + '"]');
      if (input) input.classList.add('has-error');
      if (name === 'upload') {
        var up = body.querySelector('#reg-upload');
        if (up) up.classList.add('has-error');
        var notice = document.createElement('div');
        notice.className = 'reg-upload-error';
        notice.textContent = msg;
        var existing = body.querySelector('.reg-upload-error');
        if (existing) existing.remove();
        body.querySelector('.reg-form').insertBefore(notice, body.querySelector('.reg-actions'));
      }
      if (name === 'terms') {
        var label = body.querySelector('.reg-check');
        if (label) label.classList.add('has-error');
      }
    });
  }

  // ---------- file upload ----------
  function bindDocs() {
    var dropzone = body.querySelector('#reg-upload');
    var fileInput = body.querySelector('#reg-file');

    function readFile(file) {
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        alert('Можно загружать только изображения (JPG, PNG)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой (макс 10 МБ)');
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        state.data.studentIdImage = e.target.result;
        state.data.studentIdName = file.name;
        render(); // re-render docs step with preview
      };
      reader.readAsDataURL(file);
    }

    if (fileInput) {
      fileInput.addEventListener('change', function(e) {
        readFile(e.target.files && e.target.files[0]);
      });
    }
    if (dropzone) {
      ['dragenter','dragover'].forEach(function(ev) {
        dropzone.addEventListener(ev, function(e) {
          e.preventDefault(); e.stopPropagation();
          dropzone.classList.add('drag');
        });
      });
      ['dragleave','drop'].forEach(function(ev) {
        dropzone.addEventListener(ev, function(e) {
          e.preventDefault(); e.stopPropagation();
          dropzone.classList.remove('drag');
        });
      });
      dropzone.addEventListener('drop', function(e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        readFile(f);
      });
    }
    var rm = body.querySelector('[data-remove]');
    if (rm) rm.addEventListener('click', function() {
      delete state.data.studentIdImage;
      delete state.data.studentIdName;
      render();
    });
  }

})();
