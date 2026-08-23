let totalCoins = Number(localStorage.getItem('cyber_coins')) || 0;
let dailyEarned = Number(localStorage.getItem('cyber_daily')) || 0;
const DAILY_LIMIT = 50;

let tasks = [
    { name: "Matematika darsini qilish" },
    { name: "Ingliz tili so'zlarini yodlash" }
];
let historyLog = [];

let savedTheme = 'theme-cyan';
document.body.className = savedTheme;

let currentRole = localStorage.getItem('ukasi_role') || null;

let userProfiles = {
    admin: { name: "Nurislom", avatar: "N", pass: "admin123" },
    student: { name: "Habibulloh", avatar: "H", pass: "uka123" }
};

const marketItems = [
    { name: "1 Soat Kompyuter o'yini", price: 30, img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80" },
    { name: "Shokolad (Snickers)", price: 15, img: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=300&q=80" },
    { name: "Kino ko'rish", price: 50, img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80" }
];

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');

async function loadDataFromFirebase() {
    if (!window.db) return;
    try {
        // .once() yoki get() orqali to'g'ridan-to'g'ri bazadan oxirgi ma'lumotni olamiz
        const snapshot = await window.dbGet(window.dbRef(window.db, 'cyberdesk_data'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            totalCoins = data.coins !== undefined ? data.coins : 0;
            dailyEarned = data.daily !== undefined ? data.daily : 0;
            tasks = data.tasks || tasks;
            historyLog = data.history || [];
            userProfiles = data.profiles || userProfiles;
            savedTheme = data.theme || 'theme-cyan';
            document.body.className = savedTheme;
        }
    } catch (error) {
        console.error("Ma'lumotni olishda xatolik:", error);
    }
    updateUIWithoutSaving();
    if (currentRole) setupRoleUI();
}

// FIREBASE'GA MA'LUMOTLARNI SAQLASH
function saveDataToFirebase() {
    if (!window.db) {
        console.error("Firebase ma'lumotlar bazasi topilmadi!");
        return;
    }
    window.dbSet(window.dbRef(window.db, 'cyberdesk_data'), {
        coins: totalCoins,
        daily: dailyEarned,
        tasks: tasks,
        history: historyLog,
        profiles: userProfiles,
        theme: savedTheme
    }).then(() => {
        console.log("Ma'lumot Firebase'ga muvaffaqiyatli saqlandi!");
    }).catch(error => {
        console.error("Saqlashda xatolik:", error);
        showToast("Bazaga saqlashda xatolik: " + error.message, "error");
    });
}

function checkAuth() {
    if (currentRole === 'admin' || currentRole === 'student') {
        loginScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        setupRoleUI();
    } else {
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

// Parolni ko'rsatish / yashirish funksiyasi
function togglePasswordVisibility(fieldId, iconElement) {
    const inputField = document.getElementById(fieldId);
    if (inputField.type === "password") {
        inputField.type = "text";
        iconElement.textContent = "🙈";
    } else {
        inputField.type = "password";
        iconElement.textContent = "👁️";
    }
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('login-password').value.trim();
    const errorText = document.getElementById('login-error');

    if (pass === userProfiles.admin.pass) {
        currentRole = 'admin';
        localStorage.setItem('ukasi_role', 'admin');
        errorText.textContent = '';
        document.getElementById('login-password').value = '';
        checkAuth();
        showToast("Admin rejimi yoqildi!", "success");
    } else if (pass === userProfiles.student.pass) {
        currentRole = 'student';
        localStorage.setItem('ukasi_role', 'student');
        errorText.textContent = '';
        document.getElementById('login-password').value = '';
        checkAuth();
        showToast("O'quvchi rejimi yoqildi!", "success");
    } else {
        errorText.textContent = "Parol noto'g'ri!";
    }
});

function logout() {
    currentRole = null;
    localStorage.removeItem('ukasi_role');
    checkAuth();
    showToast("Tizimdan chiqildi", "info");
}

function setupRoleUI() {
    const adminPanel = document.getElementById('admin-task-panel');
    const welcomeTitle = document.getElementById('welcome-title');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const resetDayBtn = document.getElementById('reset-day-btn');
    const profile = userProfiles[currentRole];

    document.getElementById('profile-name').textContent = profile.name;
    document.getElementById('profile-role').textContent = currentRole === 'admin' ? "Admin" : "O'quvchi";
    document.getElementById('profile-avatar').textContent = profile.avatar;

    if (currentRole === 'admin') {
        adminPanel.style.display = 'block';
        clearHistoryBtn.style.display = 'block';
        resetDayBtn.style.display = 'block';
        welcomeTitle.textContent = `[ XUSH KELIBSIZ, ${profile.name.toUpperCase()}! ]`;
    } else {
        adminPanel.style.display = 'none';
        clearHistoryBtn.style.display = 'none';
        resetDayBtn.style.display = 'none';
        welcomeTitle.textContent = `[ SALOM, ${profile.name.toUpperCase()}! ]`;
    }

    updateUIWithoutSaving();
    renderTasks();
    renderMarket();
    renderHistory();
}

function openProfileModal() {
    const profile = userProfiles[currentRole];
    document.getElementById('modal-profile-name').textContent = profile.name;
    document.getElementById('modal-profile-role').textContent = currentRole === 'admin' ? "Admin" : "O'quvchi";
    document.getElementById('modal-avatar-preview').textContent = profile.avatar;
    document.getElementById('modal-total-tasks').textContent = `${tasks.length} ta`;
    document.getElementById('modal-total-coins').textContent = `${totalCoins} 💰`;

    document.getElementById('edit-name-input').value = profile.name;
    document.getElementById('edit-avatar-input').value = profile.avatar;
    document.getElementById('new-password-input').value = '';

    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function saveAllProfileChanges() {
    const newName = document.getElementById('edit-name-input').value.trim();
    const newAvatar = document.getElementById('edit-avatar-input').value.trim();
    const newPass = document.getElementById('new-password-input').value.trim();

    if (!newName) {
        showToast("Ismni bo'sh qoldirib bo'lmaydi!", "error");
        return;
    }
    if (!newAvatar) {
        showToast("Belgi kiritilmadi!", "error");
        return;
    }

    userProfiles[currentRole].name = newName;
    userProfiles[currentRole].avatar = newAvatar;

    if (newPass !== "") {
        if (newPass.length < 4) {
            showToast("Parol kamida 4 ta belgidan iborat bo'lsin!", "error");
            return;
        }
        userProfiles[currentRole].pass = newPass;
    }

    saveDataToFirebase();
    setupRoleUI();
    closeProfileModal();
    showToast("Profil ma'lumotlari yangilandi!", "success");
}

function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Ekranni yangilash va bazaga saqlash
function updateUI() {
    document.getElementById('total-coins').textContent = `${totalCoins} 💰`;
    document.getElementById('daily-earned').textContent = dailyEarned;
    document.getElementById('market-balance').textContent = totalCoins;
    
    saveDataToFirebase(); // Faqat amal bajarilganda saqlanadi
}

// Faqat ekranni yangilash (bazaga yozmasdan)
function updateUIWithoutSaving() {
    document.getElementById('total-coins').textContent = `${totalCoins} 💰`;
    document.getElementById('daily-earned').textContent = dailyEarned;
    document.getElementById('market-balance').textContent = totalCoins;
    
    // Brauzerning o'zida ham zaxiralab turamiz
    localStorage.setItem('cyber_coins', totalCoins);
    localStorage.setItem('cyber_daily', dailyEarned);
}

function renderTasks() {
    const taskContainer = document.getElementById('tasks-list');
    taskContainer.innerHTML = '';

    if (tasks.length === 0) {
        taskContainer.innerHTML = '<p style="color: #888;">Hozircha darslar mavjud emas...</p>';
        return;
    }

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        if (currentRole === 'admin') {
            li.innerHTML = `
                <span>>_ ${task.name}</span>
                <div class="task-actions">
                    <input type="number" id="coin-input-${index}" placeholder="Coin">
                    <button class="cyber-btn primary-btn" onclick="giveCoin(${index}, '${task.name}')">+</button>
                    <button class="cyber-btn danger-btn" onclick="takeCoin(${index}, '${task.name}')">-</button>
                    <button class="cyber-btn danger-btn" onclick="deleteTask(${index})">X</button>
                </div>
            `;
        } else {
            li.innerHTML = `
                <span>>_ ${task.name}</span>
                <span style="color: var(--accent-color); font-size: 13px;">[ VAZIFA ]</span>
            `;
        }
        taskContainer.appendChild(li);
    });
}

function renderMarket() {
    const marketContainer = document.getElementById('market-list');
    marketContainer.innerHTML = ''; 

    marketItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'market-card';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="market-info">
                <h4>${item.name}</h4>
                <p>${item.price} 💰</p>
                <button class="cyber-btn primary-btn" onclick="buyItem(${index})">SOTIB OLISH</button>
            </div>
        `;
        marketContainer.appendChild(div);
    });
}

function renderHistory() {
    const historyContainer = document.getElementById('history-list');
    historyContainer.innerHTML = '';

    if (historyLog.length === 0) {
        historyContainer.innerHTML = '<p style="color: #888;">Hozircha tarix bo\'sh...</p>';
        return;
    }

    historyLog.slice().reverse().forEach(log => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span>${log.text}</span>
            <span style="font-weight: bold; color: ${log.color};">${log.amount}</span>
        `;
        historyContainer.appendChild(li);
    });
}

const addTaskBtn = document.getElementById('add-task-btn');
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
        const taskInput = document.getElementById('task-input');
        const taskName = taskInput.value.trim();

        if (taskName !== '') {
            tasks.push({ name: taskName });
            taskInput.value = ''; 
            updateUI();
            renderTasks();
            showToast("Dars qo'shildi!", "success");
        } else {
            showToast("Dars nomini kiriting!", "error");
        }
    });
}

function deleteTask(index) {
    tasks.splice(index, 1);
    updateUI();
    renderTasks();
    showToast("Dars o'chirildi", "info");
}

function giveCoin(index, taskName) {
    const inputField = document.getElementById(`coin-input-${index}`);
    const amount = parseInt(inputField.value);

    if (isNaN(amount) || amount <= 0) {
        showToast("To'g'ri raqam kiriting!", "error");
        return;
    }

    if (dailyEarned + amount > DAILY_LIMIT) {
        showToast(`Limit! Qolgan limit: ${DAILY_LIMIT - dailyEarned}`, "error");
        return;
    }

    totalCoins += amount;
    dailyEarned += amount;
    inputField.value = ''; 

    historyLog.push({
        text: `Dars bajarildi: "${taskName}"`,
        amount: `+${amount} 💰`,
        color: "#00ff66"
    });

    updateUI();
    renderHistory();
    showToast(`${amount} coin qo'shildi.`, "success");
}

function takeCoin(index, taskName) {
    const inputField = document.getElementById(`coin-input-${index}`);
    const amount = parseInt(inputField.value);

    if (isNaN(amount) || amount <= 0) {
        showToast("To'g'ri raqam kiriting!", "error");
        return;
    }

    if (totalCoins - amount < 0) {
        showToast("Coinlar 0 dan pastga tushmaydi!", "error");
        return;
    }

    totalCoins -= amount;
    inputField.value = ''; 

    historyLog.push({
        text: `Jazo olindi: "${taskName}"`,
        amount: `-${amount} 💰`,
        color: "#ff0055"
    });

    updateUI();
    renderHistory();
    showToast(`${amount} coin olib tashlandi.`, "error");
}

function buyItem(index) {
    const item = marketItems[index];
    if (totalCoins >= item.price) {
        totalCoins -= item.price;
        historyLog.push({
            text: `Marketdan xarid: "${item.name}"`,
            amount: `-${item.price} 💰`,
            color: "#ff0055"
        });
        updateUI();
        renderHistory();
        showToast(`"${item.name}" sotib olindi!`, "success");
    } else {
        showToast("Coin yetarli emas!", "error");
    }
}

document.getElementById('clear-history-btn').addEventListener('click', () => {
    showCyberConfirm("TARIXNI TOZALASH", "Barcha tarix tozalanib ketishini tasdiqlaysizmi?", () => {
        historyLog = [];
        updateUI();
        renderHistory();
        showToast("Tarix tozalandi", "info");
    });
});

document.getElementById('reset-day-btn').addEventListener('click', () => {
    showCyberConfirm("YANGI KUN", "Yangi kunni boshlamoqchimisiz? Bugungi limit noldan boshlanadi.", () => {
        dailyEarned = 0;
        updateUI();
        showToast("Yangi kun boshlandi!", "info");
    });
});

function setTheme(themeName) {
    savedTheme = themeName;
    document.body.className = themeName;
    saveDataToFirebase();
    showToast("Mavzu o'zgartirildi!", "info");
}

const btnDashboard = document.getElementById('btn-dashboard');
const btnMarket = document.getElementById('btn-market');
const btnHistory = document.getElementById('btn-history');
const viewDashboard = document.getElementById('view-dashboard');
const viewMarket = document.getElementById('view-market');
const viewHistory = document.getElementById('view-history');

function switchView(activeBtn, activeView) {
    [btnDashboard, btnMarket, btnHistory].forEach(b => b.classList.remove('active'));
    [viewDashboard, viewMarket, viewHistory].forEach(v => v.classList.remove('active'));
    activeBtn.classList.add('active');
    activeView.classList.add('active');
}

btnDashboard.addEventListener('click', () => switchView(btnDashboard, viewDashboard));
btnMarket.addEventListener('click', () => switchView(btnMarket, viewMarket));
btnHistory.addEventListener('click', () => {
    switchView(btnHistory, viewHistory);
    renderHistory();
});

// Firebase to'liq yuklanib bo'lgachgina ma'lumotni o'qiymiz va ekranni ochamiz
window.addEventListener('load', async () => {
    await loadDataFromFirebase();
    checkAuth();
});
function showCyberConfirm(title, text, onYes) {
    const modal = document.getElementById('cyber-confirm-modal');
    const titleEl = document.getElementById('cyber-confirm-title');
    const textEl = document.getElementById('cyber-confirm-text');
    const yesBtn = document.getElementById('cyber-confirm-yes');
    const noBtn = document.getElementById('cyber-confirm-no');

    if (!modal) {
        if (confirm(text)) onYes();
        return;
    }

    titleEl.textContent = title;
    textEl.textContent = text;
    modal.style.display = 'flex';

    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);

    newYesBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        onYes();
    });

    newNoBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}