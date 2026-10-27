/**
 * ZenStudy - Minimal Android-style Study Companion
 * Features: To-Do with Year/Month filters, Timetable, Focus Timer, Ambient Audio, Wallpapers, Dark Mode & Date Range Replication
 */

(() => {
  'use strict';

  // ==========================================
  // 1. DATA STATE & LOCALSTORAGE
  // ==========================================
  const STORAGE_KEYS = {
    TASKS: 'zenstudy_tasks',
    TIMETABLE: 'zenstudy_timetable',
    BACKGROUND: 'zenstudy_bg_config',
    DARK_MODE: 'zenstudy_dark_mode',
    NOTES: 'zenstudy_notes',
    STATS: 'zenstudy_stats',
    TIMER_CONFIG: 'zenstudy_timer_config'
  };

  // Folder Wallpapers provided in background/
  const PRESET_WALLPAPERS = [
    { id: 'wp-iphone', name: 'Minimal Curve', file: 'Wallpaper Iphone.jpg' },
    { id: 'wp-std350', name: 'Minimal Modern', file: 'Standard350.jpg' },
    { id: 'wp-std', name: 'Vintage Bike', file: 'Standard.jpg' },
    { id: 'wp-iron', name: 'Eagle Tone', file: 'Pure Iron 🦅.jpg' },
    { id: 'wp-dl1', name: 'Monochrome', file: 'download (1).jpg' },
    { id: 'wp-533', name: 'Aesthetic Chill', file: '533113674655793767.jpg' },
    { id: 'wp-977', name: 'Night City', file: '977773769113317362.jpg' },
    { id: 'wp-350', name: 'Retro Study', file: '350858627237691307.jpg' },
    { id: 'wp-101', name: 'Dark Flow', file: '1016476578761657877.jpg' }
  ];

  // Default sample study tasks
  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      title: 'Review Calculus: Integration by Parts & Exercises',
      date: new Date().toISOString().split('T')[0],
      priority: 'high',
      tag: 'Mathematics',
      completed: false,
      subtasks: [
        { text: 'Read lecture notes page 45-60', completed: true },
        { text: 'Solve problem set 3', completed: false }
      ]
    },
    {
      id: 'task-2',
      title: 'Draft Chapter 2 for History Research Essay',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      tag: 'History',
      completed: false,
      subtasks: []
    },
    {
      id: 'task-3',
      title: 'Read Physics Optics Summary Sheet',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'low',
      tag: 'Physics',
      completed: false,
      subtasks: []
    }
  ];

  // Default sample weekly study timetable
  const DEFAULT_TIMETABLE = [
    { id: 'slot-1', day: '1', start: '09:00', end: '10:30', subject: 'Advanced Mathematics', room: 'Lecture Hall A' },
    { id: 'slot-2', day: '1', start: '11:00', end: '12:30', subject: 'Physics Laboratory', room: 'Lab 204' },
    { id: 'slot-3', day: '2', start: '10:00', end: '11:30', subject: 'Computer Science & Algorithms', room: 'Hall B' },
    { id: 'slot-4', day: '3', start: '09:00', end: '10:30', subject: 'Organic Chemistry', room: 'Room 102' },
    { id: 'slot-5', day: '4', start: '14:00', end: '15:30', subject: 'English Literature Seminar', room: 'Seminar 3' },
    { id: 'slot-6', day: '5', start: '11:00', end: '13:00', subject: 'Self-Study & Revision Block', room: 'Library Quiet Zone' }
  ];

  // State
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || DEFAULT_TASKS;
  let timetable = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMETABLE)) || DEFAULT_TIMETABLE;
  let isDarkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  let bgConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKGROUND)) || {
    type: 'solid',
    value: '#FBF9F4',
    overlayOpacity: 20
  };
  let stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS)) || {
    sessionsToday: 0,
    minutesToday: 0,
    completedTasksCount: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0]
  };
  let timerConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMER_CONFIG)) || {
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15
  };

  let deferredInstallPrompt = null;
  let currentTaskFilter = 'all';
  let currentTimetableDay = 'all';
  let editingTaskId = null;
  let tempSubtasks = [];

  // ==========================================
  // 2. DOM ELEMENTS
  // ==========================================
  const bgLayer = document.getElementById('bg-layer');
  const bgOverlay = document.getElementById('bg-overlay');
  const currentDateDisplay = document.getElementById('current-date-display');
  const btnInstallApp = document.getElementById('btn-install-app');
  const btnTriggerInstall = document.getElementById('btn-trigger-install');
  const btnHeaderTheme = document.getElementById('btn-header-theme');
  const btnThemeMode = document.getElementById('btn-theme-mode');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  const switchDarkMode = document.getElementById('switch-dark-mode');
  const btnQuickSound = document.getElementById('btn-quick-sound');
  const toastEl = document.getElementById('toast');

  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  // Tasks Elements
  const selectYear = document.getElementById('select-year');
  const selectMonth = document.getElementById('select-month');
  const btnQuickToday = document.getElementById('btn-quick-today');
  const filterChips = document.querySelectorAll('.chip');
  const taskSearchInput = document.getElementById('task-search-input');
  const tasksContainer = document.getElementById('tasks-container');
  const tasksEmptyState = document.getElementById('tasks-empty-state');
  const tasksProgressBar = document.getElementById('tasks-progress-bar');
  const progressStatText = document.getElementById('progress-stat-text');
  const streakCount = document.getElementById('streak-count');
  const btnOpenAddTask = document.getElementById('btn-open-add-task');

  // Task Modal Elements
  const modalTask = document.getElementById('modal-task');
  const formTask = document.getElementById('form-task');
  const taskModalTitle = document.getElementById('task-modal-title');
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title');
  const taskDateInput = document.getElementById('task-date');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskTagInput = document.getElementById('task-tag');
  const taskRepeatRangeCheck = document.getElementById('task-repeat-range-check');
  const taskDateRangeFields = document.getElementById('task-date-range-fields');
  const taskStartDateInput = document.getElementById('task-start-date');
  const taskEndDateInput = document.getElementById('task-end-date');
  const taskRangeHint = document.getElementById('task-range-hint');
  const taskRangeOptionBox = document.getElementById('task-range-option-box');
  const inputSubtaskItem = document.getElementById('input-subtask-item');
  const btnAddSubtaskItem = document.getElementById('btn-add-subtask-item');
  const modalSubtasksList = document.getElementById('modal-subtasks-list');

  // Duplicate Task Modal
  const modalDuplicateTask = document.getElementById('modal-duplicate-task');
  const dupTaskSourceId = document.getElementById('dup-task-source-id');
  const dupTaskTitlePreview = document.getElementById('dup-task-title-preview');
  const dupStartDate = document.getElementById('dup-start-date');
  const dupEndDate = document.getElementById('dup-end-date');
  const btnConfirmDuplicateTask = document.getElementById('btn-confirm-duplicate-task');

  // Timetable Elements
  const liveSubjectName = document.getElementById('live-subject-name');
  const liveSubjectTime = document.getElementById('live-subject-time');
  const timetableDaySelector = document.getElementById('timetable-day-selector');
  const timetableSlotsContainer = document.getElementById('timetable-slots-container');
  const timetableEmptyState = document.getElementById('timetable-empty-state');
  const btnAddTimetableSlot = document.getElementById('btn-add-timetable-slot');
  const modalTimetable = document.getElementById('modal-timetable');
  const formTimetable = document.getElementById('form-timetable');
  const btnPresetWeekdays = document.getElementById('btn-preset-weekdays');
  const btnPresetAllweek = document.getElementById('btn-preset-allweek');
  const btnPresetClear = document.getElementById('btn-preset-clear');

  // Focus Timer Elements
  const timerModeBtns = document.querySelectorAll('.timer-mode-btn');
  const timerProgressRing = document.getElementById('timer-progress-ring');
  const timerLabel = document.getElementById('timer-label');
  const timerTime = document.getElementById('timer-time');
  const timerSessionCount = document.getElementById('timer-session-count');
  const btnTimerPlay = document.getElementById('btn-timer-play');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const btnTimerSkip = document.getElementById('btn-timer-skip');
  const timerIconPlay = document.getElementById('timer-icon-play');
  const timerIconPause = document.getElementById('timer-icon-pause');
  const inputFocusTime = document.getElementById('input-focus-time');
  const inputShortBreak = document.getElementById('input-short-break');
  const inputLongBreak = document.getElementById('input-long-break');

  // Ambient Audio Elements
  const btnAmbientToggle = document.getElementById('btn-ambient-toggle');
  const ambientSoundChips = document.querySelectorAll('.sound-chip');
  const ambientVolume = document.getElementById('ambient-volume');
  const soundIconOff = document.getElementById('sound-icon-off');
  const soundIconOn = document.getElementById('sound-icon-on');

  // Stats Elements
  const statSessionsToday = document.getElementById('stat-sessions-today');
  const statMinutesToday = document.getElementById('stat-minutes-today');
  const statCompletedTasks = document.getElementById('stat-completed-tasks');

  // Notes Elements
  const studyScratchpad = document.getElementById('study-scratchpad');
  const notesWordCount = document.getElementById('notes-word-count');
  const btnClearNotes = document.getElementById('btn-clear-notes');
  const btnCopyNotes = document.getElementById('btn-copy-notes');

  // Settings / Wallpaper Elements
  const wallpapersGrid = document.getElementById('wallpapers-grid');
  const btnClearWallpaper = document.getElementById('btn-clear-wallpaper');
  const customBgInput = document.getElementById('custom-bg-input');
  const solidColorBtns = document.querySelectorAll('.solid-color-btn');
  const bgOverlaySlider = document.getElementById('bg-overlay-slider');
  const overlayValueDisplay = document.getElementById('overlay-value-display');
  const btnExportData = document.getElementById('btn-export-data');
  const importDataFile = document.getElementById('import-data-file');
  const modalInstall = document.getElementById('modal-install');
  const btnNativeInstallTrigger = document.getElementById('btn-native-install-trigger');

  // ==========================================
  // 3. INITIALIZATION
  // ==========================================
  function initApp() {
    updateDateDisplay();
    initDarkMode();
    initPWA();
    initBackgroundSettings();
    initYearMonthSelector();
    renderTasks();
    renderTimetable();
    initFocusTimer();
    initAmbientAudio();
    initScratchpad();
    updateStatsDisplay();
    startLiveTimetableWatcher();

    const todayStr = new Date().toISOString().split('T')[0];
    taskDateInput.value = todayStr;
    taskStartDateInput.value = todayStr;
    taskEndDateInput.value = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
  }

  function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2800);
  }

  // ==========================================
  // 4. DARK MODE SYSTEM
  // ==========================================
  function initDarkMode() {
    applyDarkModeState();

    btnThemeMode.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
      applyDarkModeState();
      applyBackgroundStyles();
      showToast(isDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
    });

    if (switchDarkMode) {
      switchDarkMode.addEventListener('change', () => {
        isDarkMode = switchDarkMode.checked;
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
        applyDarkModeState();
        applyBackgroundStyles();
        showToast(isDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
      });
    }
  }

  function applyDarkModeState() {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (switchDarkMode) switchDarkMode.checked = isDarkMode;

    if (isDarkMode) {
      iconSun.classList.remove('hidden');
      iconMoon.classList.add('hidden');
    } else {
      iconSun.classList.add('hidden');
      iconMoon.classList.remove('hidden');
    }
  }

  // ==========================================
  // 5. NAVIGATION SYSTEM
  // ==========================================
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      switchView(targetId);
    });
  });

  function switchView(targetViewId) {
    navItems.forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-target') === targetViewId);
    });

    viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === targetViewId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnHeaderTheme.addEventListener('click', () => {
    switchView('view-settings');
  });

  // Modal Close Handlers
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(modalId);
      if (targetModal) targetModal.classList.add('hidden');
    });
  });

  [modalTask, modalDuplicateTask, modalTimetable, modalInstall].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // ==========================================
  // 6. PROGRESSIVE WEB APP & INSTALLATION
  // ==========================================
  function initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.log('Service Worker failed:', err));
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      btnInstallApp.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      showToast('ZenStudy downloaded to home screen!');
      btnInstallApp.innerHTML = `<span>Installed</span>`;
    });

    const triggerInstallFlow = () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('Installing ZenStudy on your device...');
          }
          deferredInstallPrompt = null;
        });
      } else {
        modalInstall.classList.remove('hidden');
      }
    };

    btnInstallApp.addEventListener('click', triggerInstallFlow);
    btnTriggerInstall.addEventListener('click', triggerInstallFlow);
    btnNativeInstallTrigger.addEventListener('click', triggerInstallFlow);
  }

  // ==========================================
  // 7. BACKGROUND & WALLPAPER SYSTEM (FIXED & ENHANCED)
  // ==========================================
  function initBackgroundSettings() {
    wallpapersGrid.innerHTML = '';
    PRESET_WALLPAPERS.forEach(wp => {
      const btn = document.createElement('button');
      btn.className = 'wallpaper-thumb-btn';
      btn.title = wp.name;
      const encodedFile = encodeURIComponent(wp.file).replace(/%2F/g, '/');
      const imgPath = `./background/${encodedFile}`;

      if (bgConfig.type === 'folder' && bgConfig.value === imgPath) {
        btn.classList.add('active');
      }

      btn.innerHTML = `
        <img src="${imgPath}" alt="${wp.name}" loading="lazy">
        <span class="thumb-label">${wp.name}</span>
      `;

      btn.addEventListener('click', () => {
        setWallpaper('folder', imgPath);
      });

      wallpapersGrid.appendChild(btn);
    });

    // Remove Wallpaper / Clear button
    btnClearWallpaper.addEventListener('click', () => {
      setWallpaper('solid', isDarkMode ? '#121417' : '#FBF9F4');
      showToast('Wallpaper removed. Using minimal solid color.');
    });

    // Solid Color Buttons
    solidColorBtns.forEach(btn => {
      const color = btn.getAttribute('data-color');
      if (bgConfig.type === 'solid' && bgConfig.value === color) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        setWallpaper('solid', color);
      });
    });

    // Custom Image Upload
    customBgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setWallpaper('custom', event.target.result);
          showToast('Custom wallpaper applied!');
        };
        reader.readAsDataURL(file);
      }
    });

    // Overlay slider
    bgOverlaySlider.value = bgConfig.overlayOpacity !== undefined ? bgConfig.overlayOpacity : 20;
    overlayValueDisplay.textContent = `${bgOverlaySlider.value}%`;
    bgOverlaySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      bgConfig.overlayOpacity = val;
      overlayValueDisplay.textContent = `${val}%`;
      applyBackgroundStyles();
      saveBgConfig();
    });

    applyBackgroundStyles();
  }

  function setWallpaper(type, value) {
    bgConfig.type = type;
    bgConfig.value = value;
    applyBackgroundStyles();
    saveBgConfig();
    updateActiveWallpaperThumbnails();
    showToast(type === 'solid' ? 'Solid colour applied' : 'Wallpaper applied');
  }

  function applyBackgroundStyles() {
    const opacityDecimal = (bgConfig.overlayOpacity !== undefined ? bgConfig.overlayOpacity : 20) / 100;

    if (bgConfig.type === 'solid') {
      bgLayer.style.backgroundImage = 'none';
      bgLayer.style.backgroundColor = bgConfig.value;
      bgOverlay.style.backgroundColor = 'transparent';
    } else {
      bgLayer.style.backgroundColor = isDarkMode ? '#121417' : '#FBF9F4';
      bgLayer.style.backgroundImage = `url("${bgConfig.value}")`;
      
      // Tint overlay adapts according to theme
      if (isDarkMode) {
        bgOverlay.style.backgroundColor = `rgba(18, 20, 24, ${Math.max(0.35, opacityDecimal)})`;
      } else {
        bgOverlay.style.backgroundColor = `rgba(251, 249, 244, ${Math.max(0.2, opacityDecimal)})`;
      }
    }
  }

  function updateActiveWallpaperThumbnails() {
    document.querySelectorAll('.wallpaper-thumb-btn').forEach(btn => {
      const img = btn.querySelector('img');
      if (img && bgConfig.type === 'folder' && bgConfig.value.includes(img.getAttribute('src'))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    solidColorBtns.forEach(btn => {
      if (bgConfig.type === 'solid' && btn.getAttribute('data-color') === bgConfig.value) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function saveBgConfig() {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKGROUND, JSON.stringify(bgConfig));
    } catch (e) {
      console.warn('Could not store wallpaper in localStorage:', e);
    }
  }

  // ==========================================
  // 8. TO-DO LIST (MONTH & YEAR + DATE RANGE REPLICATION)
  // ==========================================
  function initYearMonthSelector() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    selectYear.innerHTML = '';
    for (let y = currentYear - 2; y <= currentYear + 4; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      selectYear.appendChild(opt);
    }

    selectMonth.value = String(currentMonth);

    selectYear.addEventListener('change', renderTasks);
    selectMonth.addEventListener('change', renderTasks);

    btnQuickToday.addEventListener('click', () => {
      selectYear.value = new Date().getFullYear();
      selectMonth.value = String(new Date().getMonth());
      currentTaskFilter = 'today';
      updateFilterChipUI();
      renderTasks();
      showToast('Showing today\'s tasks');
    });

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        currentTaskFilter = chip.getAttribute('data-filter');
        updateFilterChipUI();
        renderTasks();
      });
    });

    taskSearchInput.addEventListener('input', renderTasks);

    // Toggle Date Range in Add Task
    taskRepeatRangeCheck.addEventListener('change', () => {
      if (taskRepeatRangeCheck.checked) {
        taskDateRangeFields.classList.remove('hidden');
        taskRangeHint.classList.remove('hidden');
        taskStartDateInput.value = taskDateInput.value;
        const startD = new Date(taskDateInput.value);
        startD.setDate(startD.getDate() + 3);
        taskEndDateInput.value = startD.toISOString().split('T')[0];
      } else {
        taskDateRangeFields.classList.add('hidden');
        taskRangeHint.classList.add('hidden');
      }
    });
  }

  function updateFilterChipUI() {
    filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-filter') === currentTaskFilter);
    });
  }

  function renderTasks() {
    const selYear = selectYear.value;
    const selMonth = selectMonth.value;
    const query = taskSearchInput.value.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = tasks.filter(task => {
      const taskDate = new Date(task.date);
      const taskYear = taskDate.getFullYear();
      const taskMonth = taskDate.getMonth();

      if (selYear !== 'all' && taskYear !== parseInt(selYear, 10)) return false;
      if (selMonth !== 'all' && taskMonth !== parseInt(selMonth, 10)) return false;

      if (currentTaskFilter === 'today' && task.date !== todayStr) return false;
      if (currentTaskFilter === 'upcoming' && (task.date <= todayStr || task.completed)) return false;
      if (currentTaskFilter === 'high' && task.priority !== 'high') return false;
      if (currentTaskFilter === 'completed' && !task.completed) return false;

      if (query) {
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchTag = task.tag && task.tag.toLowerCase().includes(query);
        const matchSubtask = task.subtasks && task.subtasks.some(s => s.text.toLowerCase().includes(query));
        if (!matchTitle && !matchTag && !matchSubtask) return false;
      }

      return true;
    });

    // Sort: uncompleted first, then by date
    filtered.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.date.localeCompare(b.date);
      }
      return a.completed ? 1 : -1;
    });

    const totalCount = filtered.length;
    const completedCount = filtered.filter(t => t.completed).length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    tasksProgressBar.style.width = `${percent}%`;
    progressStatText.textContent = `${completedCount} / ${totalCount} completed (${percent}%)`;
    streakCount.textContent = stats.streak || 1;

    tasksContainer.innerHTML = '';
    if (filtered.length === 0) {
      tasksEmptyState.classList.remove('hidden');
    } else {
      tasksEmptyState.classList.add('hidden');

      filtered.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        item.id = `task-item-${task.id}`;

        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
          const completedSubs = task.subtasks.filter(s => s.completed).length;
          subtasksHtml = `
            <div class="task-subtasks-box">
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Checklist (${completedSubs}/${task.subtasks.length}):</span>
              ${task.subtasks.map((st, idx) => `
                <div class="subtask-item">
                  <span class="subtask-checkbox ${st.completed ? 'checked' : ''}" data-subtask-toggle="${task.id}:${idx}">
                    ${st.completed ? '✓' : ''}
                  </span>
                  <span>${escapeHTML(st.text)}</span>
                </div>
              `).join('')}
            </div>
          `;
        }

        const isToday = task.date === todayStr;
        const dateLabel = isToday ? 'Today' : task.date;

        item.innerHTML = `
          <div class="task-item-main">
            <button class="custom-checkbox ${task.completed ? 'checked' : ''}" data-toggle-id="${task.id}" aria-label="Toggle task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <div class="task-content">
              <div class="task-title">${escapeHTML(task.title)}</div>
              <div class="task-meta-row">
                <span class="badge badge-${task.priority}">${capitalize(task.priority)}</span>
                ${task.tag ? `<span class="badge badge-tag">${escapeHTML(task.tag)}</span>` : ''}
                <span class="badge-date">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  ${dateLabel}
                </span>
              </div>
            </div>
            <div class="task-actions">
              <!-- Copy / Duplicate to other days button -->
              <button class="icon-btn copy-btn" data-copy-id="${task.id}" title="Copy to other days / Date range">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button class="icon-btn" data-edit-id="${task.id}" title="Edit Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="icon-btn delete-btn" data-delete-id="${task.id}" title="Delete Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          ${subtasksHtml}
        `;

        tasksContainer.appendChild(item);
      });
    }

    attachTaskEventListeners();
  }

  function attachTaskEventListeners() {
    document.querySelectorAll('[data-toggle-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-id');
        toggleTaskCompletion(id);
      });
    });

    document.querySelectorAll('[data-subtask-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [taskId, subIdx] = btn.getAttribute('data-subtask-toggle').split(':');
        toggleSubtask(taskId, parseInt(subIdx, 10));
      });
    });

    // Copy / Duplicate task
    document.querySelectorAll('[data-copy-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-copy-id');
        openDuplicateTaskModal(id);
      });
    });

    document.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-id');
        openEditTaskModal(id);
      });
    });

    document.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-id');
        deleteTask(id);
      });
    });
  }

  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed) {
      stats.completedTasksCount = (stats.completedTasksCount || 0) + 1;
      checkStreak();
      showToast('Task completed! Great study focus 🌱');
    }
    saveTasks();
    saveStats();
    renderTasks();
    updateStatsDisplay();
  }

  function toggleSubtask(taskId, subIdx) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subIdx]) {
      task.subtasks[subIdx].completed = !task.subtasks[subIdx].completed;
      saveTasks();
      renderTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast('Task removed');
  }

  // Open Add Task Modal
  btnOpenAddTask.addEventListener('click', () => {
    editingTaskId = null;
    tempSubtasks = [];
    taskModalTitle.textContent = 'New Study Task';
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskPriorityInput.value = 'medium';
    taskTagInput.value = '';
    inputSubtaskItem.value = '';
    taskRepeatRangeCheck.checked = false;
    taskDateRangeFields.classList.add('hidden');
    taskRangeHint.classList.add('hidden');
    taskRangeOptionBox.classList.remove('hidden'); // allow range when adding new task
    renderModalSubtasks();

    const todayStr = new Date().toISOString().split('T')[0];
    taskDateInput.value = todayStr;
    taskStartDateInput.value = todayStr;
    const futureD = new Date();
    futureD.setDate(futureD.getDate() + 3);
    taskEndDateInput.value = futureD.toISOString().split('T')[0];

    modalTask.classList.remove('hidden');
    taskTitleInput.focus();
  });

  function openEditTaskModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    tempSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    taskModalTitle.textContent = 'Edit Study Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDateInput.value = task.date;
    taskPriorityInput.value = task.priority;
    taskTagInput.value = task.tag || '';
    inputSubtaskItem.value = '';
    taskRangeOptionBox.classList.add('hidden'); // hide range toggle on single edit
    renderModalSubtasks();
    modalTask.classList.remove('hidden');
  }

  // Duplicate Task to other days modal
  function openDuplicateTaskModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    dupTaskSourceId.value = task.id;
    dupTaskTitlePreview.textContent = `Copy: "${task.title}"`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
    dupStartDate.value = tomorrow;
    dupEndDate.value = nextWeek;
    modalDuplicateTask.classList.remove('hidden');
  }

  btnConfirmDuplicateTask.addEventListener('click', () => {
    const sourceId = dupTaskSourceId.value;
    const sourceTask = tasks.find(t => t.id === sourceId);
    if (!sourceTask) return;

    const start = dupStartDate.value;
    const end = dupEndDate.value;
    if (!start || !end) {
      alert('Please select both From Date and To Date');
      return;
    }

    const dateList = generateDateRange(start, end);
    if (dateList.length === 0) {
      alert('End date cannot be earlier than start date');
      return;
    }

    dateList.forEach(dStr => {
      // Create duplicate task on each day
      const cloned = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: sourceTask.title,
        date: dStr,
        priority: sourceTask.priority,
        tag: sourceTask.tag,
        completed: false,
        subtasks: sourceTask.subtasks ? JSON.parse(JSON.stringify(sourceTask.subtasks)) : []
      };
      tasks.push(cloned);
    });

    saveTasks();
    renderTasks();
    modalDuplicateTask.classList.add('hidden');
    showToast(`Task duplicated across ${dateList.length} days! 📅`);
  });

  // Adding subtasks inside modal
  btnAddSubtaskItem.addEventListener('click', addSubtaskToModal);
  inputSubtaskItem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtaskToModal();
    }
  });

  function addSubtaskToModal() {
    const text = inputSubtaskItem.value.trim();
    if (!text) return;
    tempSubtasks.push({ text: text, completed: false });
    inputSubtaskItem.value = '';
    renderModalSubtasks();
  }

  function renderModalSubtasks() {
    modalSubtasksList.innerHTML = '';
    tempSubtasks.forEach((st, idx) => {
      const chip = document.createElement('div');
      chip.className = 'subtask-chip-item';
      chip.innerHTML = `
        <span>• ${escapeHTML(st.text)}</span>
        <button type="button" class="subtask-remove-btn" data-rem-idx="${idx}">&times;</button>
      `;
      modalSubtasksList.appendChild(chip);
    });

    modalSubtasksList.querySelectorAll('[data-rem-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-rem-idx'), 10);
        tempSubtasks.splice(idx, 1);
        renderModalSubtasks();
      });
    });
  }

  // Handle Form Task Submit
  formTask.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const priority = taskPriorityInput.value;
    const tag = taskTagInput.value.trim();

    if (!title) return;

    if (editingTaskId) {
      const task = tasks.find(t => t.id === editingTaskId);
      if (task) {
        task.title = title;
        task.date = taskDateInput.value;
        task.priority = priority;
        task.tag = tag;
        task.subtasks = tempSubtasks;
      }
      showToast('Task updated');
    } else {
      // Check if repeat across date range is selected
      if (taskRepeatRangeCheck.checked) {
        const start = taskStartDateInput.value;
        const end = taskEndDateInput.value;
        const dates = generateDateRange(start, end);

        if (dates.length === 0) {
          alert('End date cannot be earlier than start date');
          return;
        }

        dates.forEach(dStr => {
          tasks.unshift({
            id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title: title,
            date: dStr,
            priority: priority,
            tag: tag,
            completed: false,
            subtasks: JSON.parse(JSON.stringify(tempSubtasks))
          });
        });
        showToast(`Task created across ${dates.length} days! 📅`);
      } else {
        const newTask = {
          id: 'task-' + Date.now(),
          title: title,
          date: taskDateInput.value,
          priority: priority,
          tag: tag,
          completed: false,
          subtasks: tempSubtasks
        };
        tasks.unshift(newTask);
        showToast('New study task created');
      }
    }

    saveTasks();
    renderTasks();
    modalTask.classList.add('hidden');
  });

  function generateDateRange(startStr, endStr) {
    const result = [];
    const curr = new Date(startStr);
    const end = new Date(endStr);
    if (curr > end) return [];

    while (curr <= end) {
      result.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return result;
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  // ==========================================
  // 9. TIMETABLE & LIVE SCHEDULE TRACKER
  // ==========================================
  function renderTimetable() {
    timetableDaySelector.querySelectorAll('.day-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-day') === currentTimetableDay);
    });

    const filteredSlots = timetable.filter(slot => {
      if (currentTimetableDay === 'all') return true;
      return slot.day === currentTimetableDay;
    });

    filteredSlots.sort((a, b) => a.start.localeCompare(b.start));

    timetableSlotsContainer.innerHTML = '';
    if (filteredSlots.length === 0) {
      timetableEmptyState.classList.remove('hidden');
    } else {
      timetableEmptyState.classList.add('hidden');

      const now = new Date();
      const currentDayNum = String(now.getDay());
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      filteredSlots.forEach(slot => {
        const [sH, sM] = slot.start.split(':').map(Number);
        const [eH, eM] = slot.end.split(':').map(Number);
        const startMin = sH * 60 + sM;
        const endMin = eH * 60 + eM;

        const isToday = slot.day === currentDayNum;
        const isCurrentNow = isToday && currentMinutes >= startMin && currentMinutes < endMin;

        const card = document.createElement('div');
        card.className = `timetable-card ${isCurrentNow ? 'active-slot' : ''}`;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        card.innerHTML = `
          <div class="slot-time-col">
            <span class="slot-day-tag">${dayNames[parseInt(slot.day, 10)]}</span>
            <span class="slot-time-start">${slot.start}</span>
            <span class="slot-time-end">to ${slot.end}</span>
          </div>
          <div class="slot-info-col">
            <div class="slot-title">${escapeHTML(slot.subject)}</div>
            ${slot.room ? `<div class="slot-room">${escapeHTML(slot.room)}</div>` : ''}
          </div>
          <div class="task-actions">
            <!-- Copy slot to other days -->
            <button class="icon-btn copy-btn" data-copy-slot="${slot.id}" title="Copy class to other days">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button class="icon-btn delete-btn" data-delete-slot="${slot.id}" title="Delete Slot">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        `;

        timetableSlotsContainer.appendChild(card);
      });
    }

    // Attach copy slot
    document.querySelectorAll('[data-copy-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-copy-slot');
        const slot = timetable.find(s => s.id === id);
        if (!slot) return;
        // Prompt to select day
        const targetDay = prompt(`Copy "${slot.subject}" to which day? (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun):`, '1');
        if (targetDay !== null && ['0', '1', '2', '3', '4', '5', '6'].includes(targetDay.trim())) {
          timetable.push({
            id: 'slot-' + Date.now(),
            subject: slot.subject,
            day: targetDay.trim(),
            start: slot.start,
            end: slot.end,
            room: slot.room
          });
          saveTimetable();
          renderTimetable();
          showToast('Schedule slot duplicated!');
        }
      });
    });

    document.querySelectorAll('[data-delete-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-slot');
        timetable = timetable.filter(s => s.id !== id);
        saveTimetable();
        renderTimetable();
        updateLiveScheduleStatus();
        showToast('Schedule slot deleted');
      });
    });

    updateLiveScheduleStatus();
  }

  timetableDaySelector.querySelectorAll('.day-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTimetableDay = btn.getAttribute('data-day');
      renderTimetable();
    });
  });

  btnAddTimetableSlot.addEventListener('click', () => {
    formTimetable.reset();
    document.getElementById('slot-id').value = '';
    // Uncheck all days
    document.querySelectorAll('input[name="slot-day-pick"]').forEach(cb => {
      cb.checked = (currentTimetableDay !== 'all' && cb.value === currentTimetableDay);
    });
    // If none checked, default to Monday
    if (!document.querySelector('input[name="slot-day-pick"]:checked')) {
      const mon = document.querySelector('input[name="slot-day-pick"][value="1"]');
      if (mon) mon.checked = true;
    }
    modalTimetable.classList.remove('hidden');
  });

  // Timetable quick presets
  btnPresetWeekdays.addEventListener('click', () => {
    document.querySelectorAll('input[name="slot-day-pick"]').forEach(cb => {
      cb.checked = ['1', '2', '3', '4', '5'].includes(cb.value);
    });
  });

  btnPresetAllweek.addEventListener('click', () => {
    document.querySelectorAll('input[name="slot-day-pick"]').forEach(cb => {
      cb.checked = true;
    });
  });

  btnPresetClear.addEventListener('click', () => {
    document.querySelectorAll('input[name="slot-day-pick"]').forEach(cb => {
      cb.checked = false;
    });
  });

  formTimetable.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('slot-subject').value.trim();
    const start = document.getElementById('slot-start').value;
    const end = document.getElementById('slot-end').value;
    const room = document.getElementById('slot-room').value.trim();

    const selectedDays = Array.from(document.querySelectorAll('input[name="slot-day-pick"]:checked')).map(cb => cb.value);

    if (!subject || !start || !end) return;
    if (selectedDays.length === 0) {
      alert('Please select at least one day for the schedule.');
      return;
    }

    selectedDays.forEach(dayVal => {
      timetable.push({
        id: 'slot-' + Date.now() + '-' + dayVal,
        subject,
        day: dayVal,
        start,
        end,
        room
      });
    });

    saveTimetable();
    renderTimetable();
    modalTimetable.classList.add('hidden');
    showToast(`Schedule saved for ${selectedDays.length} day(s)! 📅`);
  });

  function saveTimetable() {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
  }

  function startLiveTimetableWatcher() {
    updateLiveScheduleStatus();
    setInterval(updateLiveScheduleStatus, 15000);
  }

  function updateLiveScheduleStatus() {
    const now = new Date();
    const dayNum = String(now.getDay());
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const todaySlots = timetable.filter(s => s.day === dayNum);
    todaySlots.sort((a, b) => a.start.localeCompare(b.start));

    let activeSlot = null;
    let nextSlot = null;

    for (let slot of todaySlots) {
      const [sH, sM] = slot.start.split(':').map(Number);
      const [eH, eM] = slot.end.split(':').map(Number);
      const startMin = sH * 60 + sM;
      const endMin = eH * 60 + eM;

      if (currentMin >= startMin && currentMin < endMin) {
        activeSlot = slot;
        break;
      } else if (currentMin < startMin && !nextSlot) {
        nextSlot = slot;
      }
    }

    if (activeSlot) {
      liveSubjectName.textContent = activeSlot.subject;
      liveSubjectTime.textContent = `Ongoing now (${activeSlot.start} - ${activeSlot.end})${activeSlot.room ? ` • ${activeSlot.room}` : ''}`;
    } else if (nextSlot) {
      liveSubjectName.textContent = `Next Up: ${nextSlot.subject}`;
      liveSubjectTime.textContent = `Starts at ${nextSlot.start} (${nextSlot.room || 'Scheduled'})`;
    } else {
      liveSubjectName.textContent = 'No classes currently';
      liveSubjectTime.textContent = todaySlots.length > 0 ? 'All scheduled slots for today completed' : 'Free day — ideal for revision';
    }
  }

  // ==========================================
  // 10. FOCUS & POMODORO TIMER
  // ==========================================
  let timerMode = 'focus';
  let timerDurationSec = timerConfig.focusMin * 60;
  let timerRemainingSec = timerDurationSec;
  let timerInterval = null;
  let isTimerRunning = false;
  let completedSessionsCount = 0;

  function initFocusTimer() {
    inputFocusTime.value = timerConfig.focusMin;
    inputShortBreak.value = timerConfig.shortBreakMin;
    inputLongBreak.value = timerConfig.longBreakMin;

    timerModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timerMode = btn.getAttribute('data-mode');
        timerModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resetTimerState();
      });
    });

    btnTimerPlay.addEventListener('click', toggleTimer);
    btnTimerReset.addEventListener('click', resetTimerState);
    btnTimerSkip.addEventListener('click', skipTimer);

    [inputFocusTime, inputShortBreak, inputLongBreak].forEach(input => {
      input.addEventListener('change', () => {
        timerConfig.focusMin = parseInt(inputFocusTime.value, 10) || 25;
        timerConfig.shortBreakMin = parseInt(inputShortBreak.value, 10) || 5;
        timerConfig.longBreakMin = parseInt(inputLongBreak.value, 10) || 15;
        localStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify(timerConfig));
        resetTimerState();
        showToast('Timer intervals updated');
      });
    });

    updateTimerDisplay();
  }

  function resetTimerState() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerIconPlay.classList.remove('hidden');
    timerIconPause.classList.add('hidden');

    if (timerMode === 'focus') {
      timerDurationSec = timerConfig.focusMin * 60;
      timerLabel.textContent = 'FOCUS TIME';
    } else if (timerMode === 'shortBreak') {
      timerDurationSec = timerConfig.shortBreakMin * 60;
      timerLabel.textContent = 'SHORT BREAK';
    } else {
      timerDurationSec = timerConfig.longBreakMin * 60;
      timerLabel.textContent = 'LONG BREAK';
    }

    timerRemainingSec = timerDurationSec;
    updateTimerDisplay();
  }

  function toggleTimer() {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerIconPlay.classList.remove('hidden');
      timerIconPause.classList.add('hidden');
    } else {
      isTimerRunning = true;
      timerIconPlay.classList.add('hidden');
      timerIconPause.classList.remove('hidden');

      timerInterval = setInterval(() => {
        if (timerRemainingSec > 0) {
          timerRemainingSec--;
          updateTimerDisplay();
        } else {
          onTimerComplete();
        }
      }, 1000);
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerRemainingSec / 60);
    const secs = timerRemainingSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerTime.textContent = timeStr;

    const circumference = 2 * Math.PI * 115;
    const fraction = timerRemainingSec / timerDurationSec;
    const offset = circumference * (1 - fraction);
    timerProgressRing.style.strokeDashoffset = offset;

    document.title = isTimerRunning ? `(${timeStr}) ${timerLabel.textContent} • ZenStudy` : 'ZenStudy • Minimal Study Planner';
  }

  function skipTimer() {
    timerMode = (timerMode === 'focus') ? 'shortBreak' : 'focus';
    timerModeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === timerMode);
    });
    resetTimerState();
  }

  function onTimerComplete() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    playCompletionChime();

    if (timerMode === 'focus') {
      completedSessionsCount++;
      stats.sessionsToday = (stats.sessionsToday || 0) + 1;
      stats.minutesToday = (stats.minutesToday || 0) + timerConfig.focusMin;
      checkStreak();
      saveStats();
      updateStatsDisplay();

      timerSessionCount.textContent = `Completed ${completedSessionsCount} sessions`;
      showToast('Focus session complete! Time to take a healthy rest ✨');

      timerMode = (completedSessionsCount % 4 === 0) ? 'longBreak' : 'shortBreak';
    } else {
      showToast('Break finished! Ready to dive back in? 📚');
      timerMode = 'focus';
    }

    timerModeBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === timerMode);
    });
    resetTimerState();
  }

  function playCompletionChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playNote = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(587.33, now, 0.8);
      playNote(880, now + 0.25, 1.2);
    } catch (e) {
      console.warn('Audio chime could not play:', e);
    }
  }

  // ==========================================
  // 11. AMBIENT STUDY SOUND GENERATOR
  // ==========================================
  let audioContext = null;
  let ambientNoiseNode = null;
  let ambientGainNode = null;
  let isAmbientPlaying = false;
  let currentAmbientType = 'rain';

  function initAmbientAudio() {
    btnAmbientToggle.addEventListener('click', toggleAmbientSound);
    btnQuickSound.addEventListener('click', toggleAmbientSound);

    ambientSoundChips.forEach(chip => {
      chip.addEventListener('click', () => {
        currentAmbientType = chip.getAttribute('data-sound');
        ambientSoundChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (isAmbientPlaying) {
          startAmbientSound();
        }
      });
    });

    ambientVolume.addEventListener('input', (e) => {
      if (ambientGainNode) {
        ambientGainNode.gain.setValueAtTime(parseFloat(e.target.value), audioContext.currentTime);
      }
    });
  }

  function toggleAmbientSound() {
    if (isAmbientPlaying) {
      stopAmbientSound();
      btnAmbientToggle.textContent = 'Turn On';
      soundIconOff.classList.remove('hidden');
      soundIconOn.classList.add('hidden');
      showToast('Ambient audio paused');
    } else {
      startAmbientSound();
      btnAmbientToggle.textContent = 'Turn Off';
      soundIconOff.classList.add('hidden');
      soundIconOn.classList.remove('hidden');
      showToast(`Playing ambient: ${currentAmbientType}`);
    }
  }

  function startAmbientSound() {
    stopAmbientSound();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume();

    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (currentAmbientType === 'rain') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }
    } else if (currentAmbientType === 'breeze') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.08;
      }
    } else {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 0.5;
      }
    }

    ambientNoiseNode = audioContext.createBufferSource();
    ambientNoiseNode.buffer = noiseBuffer;
    ambientNoiseNode.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = currentAmbientType === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(currentAmbientType === 'rain' ? 800 : 450, audioContext.currentTime);

    ambientGainNode = audioContext.createGain();
    ambientGainNode.gain.setValueAtTime(parseFloat(ambientVolume.value), audioContext.currentTime);

    ambientNoiseNode.connect(filter);
    filter.connect(ambientGainNode);
    ambientGainNode.connect(audioContext.destination);

    ambientNoiseNode.start(0);
    isAmbientPlaying = true;
  }

  function stopAmbientSound() {
    if (ambientNoiseNode) {
      try {
        ambientNoiseNode.stop();
        ambientNoiseNode.disconnect();
      } catch (e) {}
      ambientNoiseNode = null;
    }
    isAmbientPlaying = false;
  }

  // ==========================================
  // 12. STUDY SCRATCHPAD & NOTES
  // ==========================================
  function initScratchpad() {
    const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES) || '';
    studyScratchpad.value = savedNotes;
    updateNotesCounter();

    studyScratchpad.addEventListener('input', () => {
      localStorage.setItem(STORAGE_KEYS.NOTES, studyScratchpad.value);
      updateNotesCounter();
    });

    btnClearNotes.addEventListener('click', () => {
      if (confirm('Clear the entire study scratchpad?')) {
        studyScratchpad.value = '';
        localStorage.setItem(STORAGE_KEYS.NOTES, '');
        updateNotesCounter();
        showToast('Scratchpad cleared');
      }
    });

    btnCopyNotes.addEventListener('click', () => {
      if (!studyScratchpad.value) return;
      navigator.clipboard.writeText(studyScratchpad.value).then(() => {
        showToast('Notes copied to clipboard!');
      });
    });
  }

  function updateNotesCounter() {
    const text = studyScratchpad.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = studyScratchpad.value.length;
    notesWordCount.textContent = `${words} words • ${chars} characters`;
  }

  // ==========================================
  // 13. STUDY STATS & STREAK
  // ==========================================
  function checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastActiveDate === yesterday) {
        stats.streak = (stats.streak || 1) + 1;
      } else {
        stats.streak = 1;
      }
      stats.lastActiveDate = today;
      stats.sessionsToday = 0;
      stats.minutesToday = 0;
    }
    saveStats();
  }

  function updateStatsDisplay() {
    statSessionsToday.textContent = stats.sessionsToday || 0;
    statMinutesToday.textContent = `${stats.minutesToday || 0}m`;
    statCompletedTasks.textContent = stats.completedTasksCount || 0;
    streakCount.textContent = stats.streak || 1;
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  // ==========================================
  // 14. DATA EXPORT & IMPORT
  // ==========================================
  btnExportData.addEventListener('click', () => {
    const fullBackup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      tasks,
      timetable,
      bgConfig,
      isDarkMode,
      notes: studyScratchpad.value,
      stats,
      timerConfig
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `zenstudy_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Data exported successfully!');
  });

  importDataFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.tasks) tasks = imported.tasks;
        if (imported.timetable) timetable = imported.timetable;
        if (imported.bgConfig) bgConfig = imported.bgConfig;
        if (imported.isDarkMode !== undefined) isDarkMode = imported.isDarkMode;
        if (imported.notes) studyScratchpad.value = imported.notes;
        if (imported.stats) stats = imported.stats;
        if (imported.timerConfig) timerConfig = imported.timerConfig;

        saveTasks();
        saveTimetable();
        saveBgConfig();
        saveStats();
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
        localStorage.setItem(STORAGE_KEYS.NOTES, studyScratchpad.value);
        localStorage.setItem(STORAGE_KEYS.TIMER_CONFIG, JSON.stringify(timerConfig));

        applyDarkModeState();
        applyBackgroundStyles();
        renderTasks();
        renderTimetable();
        updateStatsDisplay();
        updateNotesCounter();

        showToast('All data imported successfully!');
      } catch (err) {
        alert('Invalid backup file. Please select a valid ZenStudy JSON file.');
      }
    };
    reader.readAsText(file);
  });

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  initApp();
})();
