/* ===== Tailwind Config ===== */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                navy: "#0f172a",
                violet: "#8b5cf6",
                emerald: "#10b981",
                cyan: "#06b6d4"
            }
        }
    }
};

/* ===== App Logic ===== */
const STORAGE_KEYS = {
    lessons: "studyhub_lessons",
    tasks: "studyhub_tasks",
    theme: "studyhub_theme",
    sessions: "studyhub_sessions",
    focusMinutes: "studyhub_focus_minutes",
    quote: "studyhub_quote"
};

let lessons = JSON.parse(localStorage.getItem(STORAGE_KEYS.lessons) || "[]");
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || "[]");

let completedSessions = Number(localStorage.getItem(STORAGE_KEYS.sessions) || 0);
let totalFocusMinutes = Number(localStorage.getItem(STORAGE_KEYS.focusMinutes) || 0);

let timerMode = "focus";
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;
let sessionNumber = completedSessions + 1;

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const quotes = [
    "النجاح لا يحتاج أن تكون الأفضل، بل يحتاج أن تستمر.",
    "كل دقيقة مذاكرة اليوم تقربك من النتيجة التي تريدها.",
    "لا تنتظر الحافز، ابدأ وسيأتي الحافز أثناء العمل.",
    "خطوة صغيرة كل يوم تصنع فرقاً كبيراً مع الوقت.",
    "ركز على ما تستطيع إنجازه الآن، وليس على كل شيء مرة واحدة.",
    "مستقبلك يُبنى من العادات الصغيرة التي تفعلها اليوم.",
    "المذاكرة ليست سباقاً، المهم أن تستمر حتى النهاية.",
    "أغلق المشتتات، افتح كتابك، وابدأ بأول صفحة."
];

const prayerNames = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
};

let prayerTimes = {
    Fajr: "04:00",
    Sunrise: "05:30",
    Dhuhr: "12:00",
    Asr: "15:30",
    Maghrib: "18:30",
    Isha: "20:00"
};

function saveData() {
    localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lessons));
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.sessions, completedSessions);
    localStorage.setItem(STORAGE_KEYS.focusMinutes, totalFocusMinutes);
}

function formatDate() {
    const now = new Date();

    return now.toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateDate() {
    document.getElementById("currentDate").textContent = formatDate();
}

function scrollToSection(id) {
    const element = document.getElementById(id);

    if (element) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function toggleTheme() {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    localStorage.setItem(STORAGE_KEYS.theme, isLight ? "light" : "dark");

    const icon = document.getElementById("themeIcon");

    icon.setAttribute("data-lucide", isLight ? "moon" : "sun");

    lucide.createIcons();
}

function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);

    if (theme === "light") {
        document.body.classList.add("light");

        const icon = document.getElementById("themeIcon");

        if (icon) {
            icon.setAttribute("data-lucide", "moon");
        }
    }
}

function openScheduleModal(id = null) {
    const modal = document.getElementById("scheduleModal");

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    if (id) {
        const lesson = lessons.find(item => item.id === id);

        if (!lesson) {
            return;
        }

        document.getElementById("scheduleModalTitle").textContent = "تعديل الدرس";
        document.getElementById("editingLessonId").value = lesson.id;
        document.getElementById("lessonName").value = lesson.name;
        document.getElementById("lessonTime").value = lesson.time;
        document.getElementById("lessonType").value = lesson.type;
        document.getElementById("lessonReminder").value = lesson.reminder;
    } else {
        document.getElementById("scheduleModalTitle").textContent = "إضافة درس";
        document.getElementById("editingLessonId").value = "";
        document.getElementById("lessonName").value = "";
        document.getElementById("lessonTime").value = "";
        document.getElementById("lessonType").value = "study";
        document.getElementById("lessonReminder").value = "10";
    }
}

function closeScheduleModal() {
    const modal = document.getElementById("scheduleModal");

    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function saveLesson() {
    const name = document.getElementById("lessonName").value.trim();
    const time = document.getElementById("lessonTime").value;
    const type = document.getElementById("lessonType").value;
    const reminder = Number(document.getElementById("lessonReminder").value);
    const editingId = document.getElementById("editingLessonId").value;

    if (!name || !time) {
        showToast("من فضلك أدخل اسم الدرس والوقت.", "error");
        return;
    }

    if (editingId) {
        const index = lessons.findIndex(item => item.id === Number(editingId));

        if (index !== -1) {
            lessons[index] = {
                ...lessons[index],
                name,
                time,
                type,
                reminder
            };
        }

        showToast("تم تعديل الدرس بنجاح.");
    } else {
        lessons.push({
            id: Date.now(),
            name,
            time,
            type,
            reminder,
            notified: false
        });

        showToast("تمت إضافة الدرس.");
    }

    lessons.sort((a, b) => a.time.localeCompare(b.time));

    saveData();
    renderLessons();
    updateDashboard();
    closeScheduleModal();
}

function deleteLesson(id) {
    lessons = lessons.filter(item => item.id !== id);

    saveData();
    renderLessons();
    updateDashboard();

    showToast("تم حذف الدرس.");
}

function renderLessons() {
    const container = document.getElementById("scheduleList");
    const empty = document.getElementById("emptySchedule");

    container.innerHTML = "";

    if (!lessons.length) {
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    lessons.forEach(lesson => {

        const typeData = {
            study: {
                label: "مذاكرة",
                icon: "book-open",
                color: "violet"
            },

            lesson: {
                label: "درس",
                icon: "graduation-cap",
                color: "cyan"
            },

            exam: {
                label: "اختبار",
                icon: "file-check-2",
                color: "red"
            },

            review: {
                label: "مراجعة",
                icon: "refresh-cw",
                color: "emerald"
            }
        };

        const data = typeData[lesson.type] || typeData.study;

        const item = document.createElement("div");

        item.className = "glass rounded-2xl p-4 flex items-center gap-4 glass-hover";

        item.innerHTML = `
            <div class="w-14 h-14 rounded-2xl bg-${data.color}-500/10 flex items-center justify-center shrink-0">
                <i data-lucide="${data.icon}" class="w-6 h-6 text-${data.color}-300"></i>
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-bold truncate">${escapeHTML(lesson.name)}</h3>
                    <span class="text-[10px] px-2 py-1 rounded-full bg-white/5 opacity-60">
                        ${data.label}
                    </span>
                </div>

                <div class="flex items-center gap-2 mt-2 text-xs opacity-50">
                    <i data-lucide="clock-3" class="w-3.5 h-3.5"></i>
                    ${lesson.time}
                    <span>•</span>
                    تنبيه قبل ${lesson.reminder} دقيقة
                </div>
            </div>

            <div class="flex items-center gap-1">
                <button onclick="openScheduleModal(${lesson.id})" class="w-9 h-9 rounded-xl glass flex items-center justify-center hover:text-violet-300">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>

                <button onclick="deleteLesson(${lesson.id})" class="w-9 h-9 rounded-xl glass flex items-center justify-center hover:text-red-300">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        container.appendChild(item);
    });

    lucide.createIcons();
}

function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (!text) {
        return;
    }

    tasks.unshift({
        id: Date.now(),
        text,
        completed: false
    });

    input.value = "";

    saveData();
    renderTasks();
    updateDashboard();

    showToast("تمت إضافة المهمة.");
}

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveData();
    renderTasks();
    updateDashboard();

    if (task.completed) {
        showToast("ممتاز! تم إنجاز المهمة.");
    }
}

function deleteTask(id) {
    tasks = tasks.filter(item => item.id !== id);

    saveData();
    renderTasks();
    updateDashboard();
}

function renderTasks() {
    const container = document.getElementById("taskList");
    const deepContainer = document.getElementById("deepTasks");

    container.innerHTML = "";
    deepContainer.innerHTML = "";

    if (!tasks.length) {
        container.innerHTML = `
            <div class="md:col-span-2 text-center py-8 opacity-50">
                <i data-lucide="clipboard-list" class="w-10 h-10 mx-auto mb-3"></i>
                <p>لا توجد مهام حالياً</p>
            </div>
        `;

        deepContainer.innerHTML = `
            <p class="text-white/40 text-sm text-center py-8">
                لا توجد مهام حالياً
            </p>
        `;

        lucide.createIcons();
        return;
    }

    tasks.forEach(task => {

        const element = document.createElement("div");

        element.className = "task-item glass rounded-2xl p-4 flex items-center gap-3";

        element.innerHTML = `
            <button
                onclick="toggleTask(${task.id})"
                class="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center shrink-0 ${
                    task.completed ? "bg-emerald-500 border-emerald-500" : ""
                }">

                ${task.completed
                    ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>'
                    : ''
                }

            </button>

            <span class="flex-1 ${task.completed ? "task-complete" : ""}">
                ${escapeHTML(task.text)}
            </span>

            <button onclick="deleteTask(${task.id})" class="opacity-40 hover:opacity-100 hover:text-red-300">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        `;

        container.appendChild(element);

        const deepElement = document.createElement("div");

        deepElement.className = "flex items-center gap-3 bg-white/5 p-3 rounded-xl";

        deepElement.innerHTML = `
            <button
                onclick="toggleTask(${task.id})"
                class="w-6 h-6 rounded-lg border border-white/20 flex items-center justify-center ${
                    task.completed ? "bg-emerald-500 border-emerald-500" : ""
                }">

                ${task.completed
                    ? '<i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>'
                    : ''
                }

            </button>

            <span class="text-sm flex-1 ${
                task.completed ? "line-through opacity-40" : ""
            }">
                ${escapeHTML(task.text)}
            </span>
        `;

        deepContainer.appendChild(deepElement);
    });

    lucide.createIcons();
}

function updateDashboard() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    document.getElementById("taskCount").textContent =
        `${completedTasks} / ${totalTasks}`;

    const percentage =
        totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100);

    document.getElementById("taskProgress").style.width = percentage + "%";

    document.getElementById("lessonCount").textContent = lessons.length;
    document.getElementById("completedCount").textContent = completedTasks;
    document.getElementById("sessionCount").textContent = completedSessions;

    const hours = totalFocusMinutes / 60;

    document.getElementById("focusHours").textContent =
        hours >= 10
            ? hours.toFixed(0) + "h"
            : hours.toFixed(1) + "h";

    const focusScore = Math.min(
        100,
        Math.round(
            (completedSessions * 10) +
            (completedTasks * 3)
        )
    );

    document.getElementById("focusScore").textContent =
        focusScore + "%";

    document.getElementById("focusScoreBar").style.width =
        focusScore + "%";

    const next = getNextLesson();

    document.getElementById("nextLessonMini").textContent =
        next
            ? `${next.time} — ${next.name}`
            : "لا يوجد";
}

function getNextLesson() {
    if (!lessons.length) {
        return null;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const upcoming = lessons
        .map(lesson => {
            const [hours, minutes] = lesson.time.split(":").map(Number);

            return {
                ...lesson,
                minutes: hours * 60 + minutes
            };
        })
        .filter(lesson => lesson.minutes >= currentMinutes)
        .sort((a, b) => a.minutes - b.minutes);

    return upcoming[0] || null;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    const formatted =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    document.getElementById("timerDisplay").textContent = formatted;
    document.getElementById("miniTimer").textContent = formatted;
    document.getElementById("deepTimerDisplay").textContent = formatted;

    document.getElementById("timerMode").textContent =
        timerMode === "focus"
            ? "وقت المذاكرة"
            : "وقت الاستراحة";

    document.getElementById("deepTimerMode").textContent =
        timerMode === "focus"
            ? "وقت المذاكرة"
            : "وقت الاستراحة";

    document.getElementById("progressCircle").style.stroke =
        timerMode === "focus"
            ? "#8b5cf6"
            : "#10b981";

    const total =
        timerMode === "focus"
            ? FOCUS_SECONDS
            : BREAK_SECONDS;

    const progress = timerSeconds / total;

    const circumference = 678.58;

    const offset =
        circumference * (1 - progress);

    document.getElementById("progressCircle").style.strokeDashoffset =
        offset;

    document.getElementById("sessionLabel").textContent =
        `Session ${sessionNumber}`;
}

function toggleTimer() {
    if (timerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    timerRunning = true;

    document.getElementById("timerStartButton").innerHTML = `
        <i data-lucide="pause" class="w-5 h-5"></i>
        إيقاف
    `;

    document.getElementById("deepStartText").textContent = "إيقاف";

    document.getElementById("currentSubject").textContent =
        document.getElementById("timerSubject").value;

    lucide.createIcons();

    timerInterval = setInterval(() => {

        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            completeTimerMode();
        }

    }, 1000);
}

function pauseTimer() {
    timerRunning = false;

    clearInterval(timerInterval);

    document.getElementById("timerStartButton").innerHTML = `
        <i data-lucide="play" class="w-5 h-5"></i>
        استئناف
    `;

    document.getElementById("deepStartText").textContent = "استئناف";

    lucide.createIcons();
}

function resetTimer() {
    pauseTimer();

    timerMode = "focus";
    timerSeconds = FOCUS_SECONDS;

    updateTimerDisplay();

    document.getElementById("timerStartButton").innerHTML = `
        <i data-lucide="play" class="w-5 h-5"></i>
        ابدأ
    `;

    document.getElementById("deepStartText").textContent = "ابدأ";

    lucide.createIcons();
}

function skipTimerMode() {
    pauseTimer();

    timerMode =
        timerMode === "focus"
            ? "break"
            : "focus";

    timerSeconds =
        timerMode === "focus"
            ? FOCUS_SECONDS
            : BREAK_SECONDS;

    updateTimerDisplay();
}

function completeTimerMode() {
    pauseTimer();

    playNotificationSound();

    if (timerMode === "focus") {
        completedSessions++;
        totalFocusMinutes += 25;
        sessionNumber++;

        saveData();
        updateDashboard();

        showToast("أحسنت! انتهت جلسة المذاكرة. خذ استراحة قصيرة.", "success");

        timerMode = "break";
        timerSeconds = BREAK_SECONDS;
    } else {
        showToast("انتهت الاستراحة. جاهز لجلسة جديدة؟", "success");

        timerMode = "focus";
        timerSeconds = FOCUS_SECONDS;
    }

    updateTimerDisplay();

    if (Notification.permission === "granted") {
        new Notification(
            timerMode === "break"
                ? "Study Hub — وقت الاستراحة"
                : "Study Hub — وقت المذاكرة",
            {
                body:
                    timerMode === "break"
                        ? "أحسنت! خذ استراحة قصيرة."
                        : "انتهت الاستراحة. لنبدأ جلسة تركيز جديدة!"
            }
        );
    }
}

function playNotificationSound() {
    try {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        const context = new AudioContext();

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.frequency.value = 660;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0.0001,
            context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.18,
            context.currentTime + 0.03
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + 0.7
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.7);
    } catch (error) {
        console.log("Audio unavailable.");
    }
}

function calcInput(value) {
    const display = document.getElementById("calcDisplay");

    if (display.value === "0") {
        display.value = "";
    }

    display.value += value;
}

function calcClear() {
    document.getElementById("calcDisplay").value = "0";
}

function calcResult() {
    const display = document.getElementById("calcDisplay");

    try {
        const expression = display.value;

        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
            throw new Error("Invalid");
        }

        const result = Function(
            `"use strict"; return (${expression})`
        )();

        if (!Number.isFinite(result)) {
            throw new Error("Invalid");
        }

        display.value = result;
    } catch {
        display.value = "Error";

        setTimeout(() => {
            display.value = "0";
        }, 900);
    }
}

function calculateGrade() {
    const score =
        Number(document.getElementById("scoreInput").value);

    const total =
        Number(document.getElementById("totalInput").value);

    if (
        !Number.isFinite(score) ||
        !Number.isFinite(total) ||
        total <= 0 ||
        score < 0
    ) {
        showToast("أدخل الدرجات بشكل صحيح.", "error");
        return;
    }

    const percentage =
        Math.min(100, (score / total) * 100);

    let grade = "";

    if (percentage >= 90) {
        grade = "ممتاز";
    } else if (percentage >= 80) {
        grade = "جيد جداً";
    } else if (percentage >= 70) {
        grade = "جيد";
    } else if (percentage >= 60) {
        grade = "مقبول";
    } else {
        grade = "يحتاج إلى تحسين";
    }

    document.getElementById("percentageResult").textContent =
        percentage.toFixed(1) + "%";

    document.getElementById("gradeResult").textContent =
        grade;
}

function newQuote() {
    const quote =
        quotes[Math.floor(Math.random() * quotes.length)];

    document.getElementById("quoteText").textContent =
        quote;

    localStorage.setItem(
        STORAGE_KEYS.quote,
        quote
    );
}

function loadQuote() {
    const saved =
        localStorage.getItem(STORAGE_KEYS.quote);

    if (saved) {
        document.getElementById("quoteText").textContent =
            saved;
    }
}

async function copyQuote() {
    const quote =
        document.getElementById("quoteText").textContent;

    try {
        await navigator.clipboard.writeText(quote);

        showToast("تم نسخ النص.");
    } catch {
        showToast("لم يتمكن المتصفح من النسخ.", "error");
    }
}

async function shareQuote() {
    const quote =
        document.getElementById("quoteText").textContent;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Study Hub",
                text: quote
            });
        } catch {}
    } else {
        await copyQuote();
    }
}

async function requestNotifications() {
    if (!("Notification" in window)) {
        showToast("المتصفح لا يدعم الإشعارات.", "error");
        return;
    }

    const permission =
        await Notification.requestPermission();

    if (permission === "granted") {
        showToast("تم تفعيل الإشعارات بنجاح.", "success");

        new Notification("Study Hub", {
            body: "سيتم تنبيهك قبل الدروس ومواعيد الصلاة."
        });

        document
            .getElementById("notificationButton")
            .classList.add("notification-dot");
    } else {
        showToast("لم يتم السماح بالإشعارات.", "error");
    }
}

async function loadPrayerTimes() {
    const city =
        document.getElementById("citySelect").value;

    try {
        const today = new Date();

        const date =
            `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        const response =
            await fetch(
                `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=Egypt&method=5`
            );

        const data = await response.json();

        if (
            data &&
            data.data &&
            data.data.timings
        ) {
            prayerTimes = {
                Fajr: data.data.timings.Fajr,
                Sunrise: data.data.timings.Sunrise,
                Dhuhr: data.data.timings.Dhuhr,
                Asr: data.data.timings.Asr,
                Maghrib: data.data.timings.Maghrib,
                Isha: data.data.timings.Isha
            };
        }
    } catch {
        prayerTimes = {
            Fajr: "04:00",
            Sunrise: "05:30",
            Dhuhr: "12:00",
            Asr: "15:30",
            Maghrib: "18:30",
            Isha: "20:00"
        };

        showToast(
            "تعذر جلب مواقيت الصلاة، تم استخدام أوقات افتراضية.",
            "error"
        );
    }

    renderPrayerTimes();
}

function renderPrayerTimes() {
    const container =
        document.getElementById("prayerList");

    container.innerHTML = "";

    Object.entries(prayerTimes).forEach(
        ([key, time]) => {

            const row =
                document.createElement("div");

            row.className =
                "flex items-center justify-between p-3 rounded-2xl bg-white/5";

            row.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <i data-lucide="clock-4" class="w-4 h-4 text-emerald-300"></i>
                    </div>

                    <span class="text-sm font-bold">
                        ${prayerNames[key]}
                    </span>
                </div>

                <span class="font-black text-sm" dir="ltr">
                    ${cleanTime(time)}
                </span>
            `;

            container.appendChild(row);
        }
    );

    lucide.createIcons();
}

function cleanTime(time) {
    return String(time).split(" ")[0];
}

function checkNotifications() {
    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    lessons.forEach(lesson => {

        const [hours, minutes] =
            lesson.time.split(":").map(Number);

        const lessonMinutes =
            hours * 60 + minutes;

        const reminderTime =
            lessonMinutes - Number(lesson.reminder);

        if (
            currentMinutes === reminderTime &&
            !lesson.notified
        ) {
            new Notification("Study Hub — تذكير", {
                body:
                    `${lesson.name} الساعة ${lesson.time}`
            });

            lesson.notified = true;

            saveData();
        }
    });

    Object.entries(prayerTimes).forEach(
        ([key, time]) => {

            const cleaned =
                cleanTime(time);

            const parts =
                cleaned.split(":").map(Number);

            if (parts.length !== 2) {
                return;
            }

            const prayerMinutes =
                parts[0] * 60 + parts[1];

            if (
                currentMinutes === prayerMinutes
            ) {
                new Notification(
                    "Study Hub — وقت الصلاة",
                    {
                        body:
                            `حان الآن وقت صلاة ${prayerNames[key]}`
                    }
                );
            }
        }
    );
}

function toggleDeepWork() {
    const deepWork =
        document.getElementById("deepWork");

    deepWork.classList.toggle("hidden");

    document.body.classList.toggle(
        "overflow-hidden",
        !deepWork.classList.contains("hidden")
    );

    renderTasks();
    updateTimerDisplay();
}

function showToast(message, type = "default") {
    const container =
        document.getElementById("toastContainer");

    const toast =
        document.createElement("div");

    let icon = "info";

    if (type === "success") {
        icon = "check-circle-2";
    }

    if (type === "error") {
        icon = "alert-circle";
    }

    toast.className =
        "toast glass rounded-2xl px-4 py-3 min-w-[260px] flex items-center gap-3";

    toast.innerHTML = `
        <div class="w-9 h-9 rounded-xl ${
            type === "error"
                ? "bg-red-500/10 text-red-300"
                : "bg-violet-500/10 text-violet-300"
        } flex items-center justify-center">

            <i data-lucide="${icon}" class="w-4 h-4"></i>

        </div>

        <span class="text-sm font-bold">
            ${escapeHTML(message)}
        </span>
    `;

    container.appendChild(toast);

    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 2800);
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document
    .getElementById("timerSubject")
    .addEventListener("change", function() {
        document.getElementById("currentSubject").textContent =
            this.value;
    });

document.addEventListener("keydown", function(event) {

    if (
        event.key === "Escape" &&
        !document
            .getElementById("deepWork")
            .classList.contains("hidden")
    ) {
        toggleDeepWork();
    }

    if (
        event.code === "Space" &&
        event.target.tagName !== "INPUT" &&
        event.target.tagName !== "TEXTAREA"
    ) {
        event.preventDefault();
        toggleTimer();
    }
});

window.addEventListener("click", function(event) {
    const modal =
        document.getElementById("scheduleModal");

    if (
        event.target === modal
    ) {
        closeScheduleModal();
    }
});

function initialize() {
    loadTheme();
    updateDate();
    renderLessons();
    renderTasks();
    updateDashboard();
    loadQuote();
    renderPrayerTimes();
    updateTimerDisplay();

    lucide.createIcons();

    setInterval(
        checkNotifications,
        30000
    );

    setInterval(
        updateDate,
        60000
    );
}

initialize();
