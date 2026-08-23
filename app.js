// ================= ASOSIY O'ZGARUVCHILAR VA HOLAT =================
let currentUser = {
    name: "Nurislom Norqobilov",
    role: "Ustoz",
    coins: parseInt(localStorage.getItem('user_coins')) || 0,
    dailyLimit: parseInt(localStorage.getItem('user_limit')) || 0,
    maxLimit: 50
};

// Standart yoki saqlangan parol (Asl parol: "1234")
let currentPassword = localStorage.getItem('user_password') || "1234";

// ================= DASTUR ISHGA TUSHGANDA =================
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    updateUI();
    loadTasks();
    loadHistory();
});

// ================= AUTENTIFIKASIYA (PAROL TEKSHIRISH) =================
function checkAuth() {
    const isAuth = sessionStorage.getItem("is_authenticated");
    const loginScreen = document.getElementById("login-screen");
    
    if (loginScreen) {
        if (isAuth === "true") {
            loginScreen.style.display = "none";
        } else {
            loginScreen.style.display = "flex";
        }
    }
}

function login() {
    const passwordInput = document.getElementById("login-password");
    const errorText = document.getElementById("login-error");
    
    if (!passwordInput) return;

    if (passwordInput.value === currentPassword) {
        sessionStorage.setItem("is_authenticated", "true");
        const loginScreen = document.getElementById("login-screen");
        if (loginScreen) loginScreen.style.display = "none";
        showToast("Tizimga muvaffaqiyatli kirdingiz!", "success");
        passwordInput.value = "";
        if (errorText) errorText.textContent = "";
    } else {
        if (errorText) errorText.textContent = "Parol noto'g'ri! Qaytadan urinib ko'ring.";
        showToast("Parol noto'g'ri!", "error");
    }
}

function logout() {
    sessionStorage.removeItem("is_authenticated");
    location.reload();
}

// ================= PAROLNI O'ZGARTIRISH =================
function changePassword() {
    const oldPassInput = document.getElementById("old-password");
    const newPassInput = document.getElementById("new-password");

    if (!oldPassInput || !newPassInput) return;

    if (oldPassInput.value === currentPassword) {
        if (newPassInput.value.trim().length > 0) {
            currentPassword = newPassInput.value;
            localStorage.setItem('user_password', currentPassword);
            showToast("Parol muvaffaqiyatli o'zgartirildi va saqlandi!", "success");
            oldPassInput.value = "";
            newPassInput.value = "";
            closeModal('settings-modal');
        } else {
            showToast("Yangi parol bo'sh bo'lishi mumkin emas!", "error");
        }
    } else {
        showToast("Eski parol noto'g'ri kiritildi!", "error");
    }
}

// ================= SAHifalarni ALMASHTIRISH (NAVIGATSIYA) =================
function switchView(viewId, btnElement) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (btnElement) {
        btnElement.classList.add('active');
    }

    // Mobil menyuni yopish
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
}

// ================= INTERFEYsni YANGILASH =================
function updateUI() {
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = currentUser.name);
    document.querySelectorAll('.user-role-display').forEach(el => el.textContent = currentUser.role);
    
    const coinElements = document.querySelectorAll('.user-coins-display');
    coinElements.forEach(el => el.textContent = currentUser.coins);

    const limitElements = document.querySelectorAll('.user-limit-display');
    limitElements.forEach(el => el.textContent = `${currentUser.dailyLimit} / ${currentUser.maxLimit}`);

    localStorage.setItem('user_coins', currentUser.coins);
    localStorage.setItem('user_limit', currentUser.dailyLimit);
}

// ================= DARSLAR VA VAZIFALAR =================
let tasks = JSON.parse(localStorage.getItem('cyber_tasks')) || [];

function addTask() {
    const input = document.getElementById("new-task-input");
    if (!input || input.value.trim() === "") {
        showToast("Dars nomini kiriting!", "error");
        return;
    }

    const newTask = {
        id: Date.now(),
        name: input.value,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    input.value = "";
    showToast("Yangi dars qo'shildi!", "success");
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    showToast("Dars o'chirildi", "info");
}

function saveTasks() {
    localStorage.setItem('cyber_tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
}

function renderTasks() {
    const listContainer = document.getElementById("tasks-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    if (tasks.length === 0) {
        listContainer.innerHTML = "<p style='color: #8892b0; text-align: center; padding: 20px;'>Hozircha darslar mavjud emas.</p>";
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";
        li.innerHTML = `
            <span>${task.name}</span>
            <div class="task-actions">
                <button class="cyber-btn danger-btn" onclick="deleteTask(${task.id})">O'chirish</button>
            </div>
        `;
        listContainer.appendChild(li);
    });
}

// ================= TARIX (HISTORY) =================
let historyList = JSON.parse(localStorage.getItem('cyber_history')) || [];

function addHistory(text) {
    const date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
    historyList.unshift({ text, date });
    localStorage.setItem('cyber_history', JSON.stringify(historyList));
    loadHistory();
}

function loadHistory() {
    const container = document.getElementById("history-list");
    if (!container) return;

    container.innerHTML = "";
    if (historyList.length === 0) {
        container.innerHTML = "<p style='color: #8892b0; text-align: center; padding: 20px;'>Tarix bo'sh.</p>";
        return;
    }

    historyList.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `<span>${item.text}</span> <span style="font-size: 11px; color: #8892b0;">${item.date}</span>`;
        container.appendChild(div);
    });
}

// ================= MODALLARNI BOSHQARISH =================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// ================= MOBIL MENYU =================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.toggle("active");
    if (overlay) overlay.classList.toggle("active");
}

// ================= TOAST XABARLAR =================
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}