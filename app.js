// ==========================================
// 1. APP STATE VARIABLES
// ==========================================
let streakCount = Number(localStorage.getItem('cyber_streak')) || 0;
let lastLoginDate = localStorage.getItem('cyber_last_login') || '';
let totalCoins = Number(localStorage.getItem('cyber_coins')) || 0;
let dailyEarned = Number(localStorage.getItem('cyber_daily')) || 0;
let pendingPurchases = [];
const DAILY_LIMIT = 50;

let tasks = [
    { name: "Matematika darsini qilish" },
    { name: "Ingliz tili so'zlarini yodlash" }
];
let historyLog = [];
let savedTheme = localStorage.getItem('cyber_theme') || 'theme-cyan';
let currentRole = localStorage.getItem('ukasi_role') || null;

let userProfiles = {
    admin: { name: "Nurislom", avatar: "N", pass: "admin123" },
    student: { name: "Habibulloh", avatar: "H", pass: "uka123" }
};

const marketItems = [
    { name: "1 Soat Telefon o'ynash", price: 150, img: "https://root-nation.com/wp-content/uploads/2025/08/mobile-gaming-01.jpg" },
    { name: "Shokolad (Snickers)", price: 200, img: "https://i.pinimg.com/736x/08/fb/1d/08fb1d6d350acdb31389d9f054397d65.jpg" },
    { name: "10 000 so'm pul", price: 250, img: "https://i.pinimg.com/1200x/62/36/c1/6236c197307853afd309e907b13d5bd7.jpg" },
    { name: "Kino ko'rish", price: 300, img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80" },
    { name: "O'qish uchun blaknot", price: 400, img: "https://i.pinimg.com/1200x/cd/62/57/cd62570d4e4dcfa086f5bd3b6a625d03.jpg" },
    { name: "Chiroyli bakal", price: 500, img: "https://i.pinimg.com/736x/e6/57/c8/e657c8501495207175114edb9e08b79c.jpg" },
    { name: "Choy va qahva ichish uchun termos", price: 600, img: "https://i.pinimg.com/736x/04/73/1a/04731a9b355b5847ca8d86c1fc00c592.jpg" },
    { name: "Rasmli futbolka", price: 700, img: "https://i.pinimg.com/1200x/b1/73/dc/b173dc6ecbf363108b0ac2152b6b56a3.jpg" },
    { name: "Sport uchun krasofka", price: 1100, img: "https://i.pinimg.com/736x/ea/10/ca/ea10ca7d49174ea966c313b9de5a4c4c.jpg" },
    { name: "Futbol uchun butsi", price: 1500, img: "https://i.pinimg.com/1200x/dc/57/77/dc577765716080fb6f525a93d1a7aa57.jpg" },
    { name: "Club formasi", price: 1700, img: "https://i.pinimg.com/736x/11/e6/a3/11e6a3ac2248a7b1c106e1a4293bf3b6.jpg" },
    { name: "Novey Z550", price: 2300, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjS6idLmRNRePLDax7jwatXk-Nq7PWf9YNrOXryyMnuQ&s=10" },
    { name: "Maktab uchun sumka", price: 2500, img: "https://i.pinimg.com/736x/81/87/7d/81877d320a17d5c65ccba038a7d42b47.jpg" },
    { name: "100$ pul", price: 20000, img: "https://i.pinimg.com/1200x/fd/80/0c/fd800cfa4ce8d8ea4f871a2f3a0c425d.jpg" },
    { name: "Telefon", price: 50000, img: "https://i.pinimg.com/736x/c7/aa/89/c7aa899b2d7a2abaa2fd040f5d8eae51.jpg" },
    { name: "O'qish va ish uchun notebook", price: 100000, img: "https://i.pinimg.com/1200x/7b/95/f9/7b95f93f51ab9fd5507c94ff4950a8eb.jpg" }
];

document.body.className = savedTheme;
let weeklyChartInstance = null;

// ==========================================
// 2. FIREBASE & LOCALSTORAGE SYNC
// ==========================================
async function loadDataFromFirebase() {
    if (!window.db || !window.dbGet || !window.dbRef) {
        updateUIWithoutSaving();
        if (currentRole) setupRoleUI();
        return;
    }

    try {
        const snapshot = await window.dbGet(window.dbRef(window.db, 'cyberdesk_data'));

        if (snapshot && snapshot.exists()) {
            const data = snapshot.val();
            totalCoins = data.coins !== undefined ? Number(data.coins) : totalCoins;
            dailyEarned = data.daily !== undefined ? Number(data.daily) : dailyEarned;
            tasks = Array.isArray(data.tasks) ? data.tasks : tasks;
            historyLog = Array.isArray(data.history) ? data.history : [];
            userProfiles = data.profiles || userProfiles;
            savedTheme = data.theme || savedTheme;
            document.body.className = savedTheme;
            streakCount = data.streak !== undefined ? Number(data.streak) : streakCount;
            lastLoginDate = data.lastLogin || lastLoginDate;
            pendingPurchases = Array.isArray(data.pending) ? data.pending : [];
        }
    } catch (error) {
        console.error("Firebase'dan yuklashda xatolik:", error);
    }

    updateUIWithoutSaving();
    if (currentRole) setupRoleUI();
}

function saveDataToFirebase() {
    localStorage.setItem('cyber_coins', totalCoins);
    localStorage.setItem('cyber_daily', dailyEarned);
    localStorage.setItem('cyber_theme', savedTheme);

    if (!window.db || !window.dbSet || !window.dbRef) return;

    window.dbSet(window.dbRef(window.db, 'cyberdesk_data'), {
        coins: totalCoins,
        daily: dailyEarned,
        tasks: tasks,
        history: historyLog,
        profiles: userProfiles,
        theme: savedTheme,
        streak: streakCount,
        lastLogin: lastLoginDate,
        pending: pendingPurchases
    }).then(() => {
        console.log("Firebase'ga muvaffaqiyatli saqlandi!");
    }).catch(error => {
        console.error("Firebase saqlash xatosi:", error);
        showToast("Bazaga saqlashda xatolik yuz berdi", "error");
    });
}

// ==========================================
// 3. AUTHENTICATION & UI SETUP
// ==========================================
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');

function checkAuth() {
    if (!loginScreen || !appContainer) return;
    if (currentRole === 'admin' || currentRole === 'student') {
        loginScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        setupRoleUI();
    } else {
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

function togglePasswordVisibility(fieldId, iconElement) {
    const inputField = document.getElementById(fieldId);
    if (!inputField) return;
    if (inputField.type === "password") {
        inputField.type = "text";
        if (iconElement) iconElement.textContent = "🙈";
    } else {
        inputField.type = "password";
        if (iconElement) iconElement.textContent = "👁";
    }
}

function checkStudentStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (lastLoginDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastLoginDate === yesterdayStr) {
        streakCount += 1;
    } else {
        streakCount = 1;
    }

    lastLoginDate = today;
    localStorage.setItem('cyber_streak', streakCount);
    localStorage.setItem('cyber_last_login', lastLoginDate);
    saveDataToFirebase();
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const passInput = document.getElementById('login-password');
        const errorText = document.getElementById('login-error');
        const pass = passInput ? passInput.value.trim() : '';

        if (pass === userProfiles.admin.pass) {
            currentRole = 'admin';
            localStorage.setItem('ukasi_role', 'admin');
            checkStudentStreak();
            if (errorText) errorText.textContent = '';
            if (passInput) passInput.value = '';
            checkAuth();
            showToast("Admin rejimi yoqildi!", "success");
        } else if (pass === userProfiles.student.pass) {
            currentRole = 'student';
            localStorage.setItem('ukasi_role', 'student');
            if (errorText) errorText.textContent = '';
            if (passInput) passInput.value = '';
            checkAuth();
            showToast("O'quvchi rejimi yoqildi!", "success");
        } else {
            if (errorText) errorText.textContent = "Parol noto'g'ri!";
        }
    });
}

function logout() {
    currentRole = null;
    localStorage.removeItem('ukasi_role');
    checkAuth();
    showToast("Tizimdan chiqildi", "info");
}

function setupRoleUI() {
    if (!currentRole) return;
    checkAutoDailyReset();
    const adminPanel = document.getElementById('admin-task-panel');
    const welcomeTitle = document.getElementById('welcome-title');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const resetDayBtn = document.getElementById('reset-day-btn');
    const profileName = document.getElementById('profile-name');
    const profileRole = document.getElementById('profile-role');

    const profile = userProfiles[currentRole];
    if (!profile) return;

    if (profileName) profileName.textContent = profile.name;
    if (profileRole) profileRole.textContent = currentRole === 'admin' ? "Admin" : "O'quvchi";

    renderProfileAvatar();

    if (currentRole === 'admin') {
        if (adminPanel) adminPanel.style.display = 'block';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'block';
        if (resetDayBtn) resetDayBtn.style.display = 'block';
        if (welcomeTitle) welcomeTitle.textContent = `[ XUSH KELIBSIZ, ${profile.name.toUpperCase()}! ]`;
    } else {
        if (adminPanel) adminPanel.style.display = 'none';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        if (resetDayBtn) resetDayBtn.style.display = 'none';
        if (welcomeTitle) welcomeTitle.textContent = `[ SALOM, ${profile.name.toUpperCase()}! ]`;
    }

    updateUIWithoutSaving();
    renderTasks();
    renderMarket();
    renderHistory();
    renderPendingPurchases();
    renderWeeklyStats();
}

// ==========================================
// 4. PROFILE AVATAR & MODAL MANAGEMENT
// ==========================================
function renderProfileAvatar() {
    if (!currentRole || !userProfiles[currentRole]) return;

    const currentProfile = userProfiles[currentRole];
    
    // Rasm bo'lsa rasmni, bo'lmasa harfni tayyorlaymiz
    const innerHTML = currentProfile.customAvatar 
        ? `<img src="${currentProfile.customAvatar}">`
        : `<span>${currentProfile.avatar || "👤"}</span>`;

    // Admin va O'quvchi avatarlarini bir xil yangilaymiz
    const avatarIds = ['profile-avatar', 'modal-avatar-preview', 'sidebar-profile-avatar'];
    avatarIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = innerHTML;
            // Bir xil class biriktiramiz
            el.className = 'profile-avatar-box';
        }
    });
}

function uploadProfileImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast("Rasm hajmi 5MB dan kichik bo'lishi kerak!", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 200;
            ctx.drawImage(img, 0, 0, 200, 200);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            if (!userProfiles[currentRole]) return;
            userProfiles[currentRole].customAvatar = compressedBase64;

            renderProfileAvatar();
            saveDataToFirebase();
            showToast("Profil rasmi yangilandi!", "success");
        };
    };
    reader.readAsDataURL(file);
}

function removeProfileImage() {
    if (userProfiles[currentRole]) {
        delete userProfiles[currentRole].customAvatar;
        renderProfileAvatar();
        saveDataToFirebase();
        showToast("Profil rasmi o'chirildi", "info");
    }
}

function openProfileModal() {
    const profile = userProfiles[currentRole];
    if (!profile) return;

    const modalName = document.getElementById('modal-profile-name');
    const modalRole = document.getElementById('modal-profile-role');
    const modalTasks = document.getElementById('modal-total-tasks');
    const modalCoins = document.getElementById('modal-total-coins');
    const editName = document.getElementById('edit-name-input');
    const editAvatar = document.getElementById('edit-avatar-input');
    const editPass = document.getElementById('new-password-input');
    const modal = document.getElementById('profile-modal');

    if (modalName) modalName.textContent = profile.name;
    if (modalRole) modalRole.textContent = currentRole === 'admin' ? "Admin" : "O'quvchi";
    if (modalTasks) modalTasks.textContent = `${tasks.length} ta`;
    if (modalCoins) modalCoins.textContent = `${totalCoins} 💰`;

    if (editName) editName.value = profile.name || '';
    if (editAvatar) editAvatar.value = profile.avatar || '';
    if (editPass) editPass.value = '';

    renderProfileAvatar();

    if (modal) modal.style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
}

function saveAllProfileChanges() {
    const editName = document.getElementById('edit-name-input');
    const editAvatar = document.getElementById('edit-avatar-input');
    const editPass = document.getElementById('new-password-input');

    const newName = editName ? editName.value.trim() : '';
    const newAvatar = editAvatar ? editAvatar.value.trim() : '';
    const newPass = editPass ? editPass.value.trim() : '';

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

// ==========================================
// 5. UTILITY & UI UPDATES
// ==========================================
function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateUI() {
    updateUIWithoutSaving();
    saveDataToFirebase();
}

function updateUIWithoutSaving() {
    const coinsEl = document.getElementById('total-coins');
    const dailyEl = document.getElementById('daily-earned');
    const mktBalanceEl = document.getElementById('market-balance');
    const streakEl = document.getElementById('user-streak');

    if (coinsEl) coinsEl.textContent = `${totalCoins} 💰`;
    if (dailyEl) dailyEl.textContent = dailyEarned;
    if (mktBalanceEl) mktBalanceEl.textContent = totalCoins;
    if (streakEl) streakEl.textContent = `🔥 ${streakCount} kun`;

    localStorage.setItem('cyber_coins', totalCoins);
    localStorage.setItem('cyber_daily', dailyEarned);
}

// ==========================================
// 6. TASKS & COIN OPERATIONS
// ==========================================
function renderTasks() {
    const taskContainer = document.getElementById('tasks-list');
    if (!taskContainer) return;
    taskContainer.innerHTML = '';

    if (tasks.length === 0) {
        taskContainer.innerHTML = '<p style="color: #888;">Hozircha darslar mavjud emas...</p>';
        return;
    }

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';

        if (currentRole === 'admin') {
            const safeTaskName = task.name.replace(/'/g, "\\'");
            li.innerHTML = `
                <span>>_ ${task.name}</span>
                <div class="task-actions">
                    <input type="number" id="coin-input-${index}" placeholder="Coin">
                    <button class="cyber-btn primary-btn" onclick="giveCoin(${index}, '${safeTaskName}')">+</button>
                    <button class="cyber-btn danger-btn" onclick="takeCoin(${index}, '${safeTaskName}')">-</button>
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

const addTaskBtn = document.getElementById('add-task-btn');
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
        const taskInput = document.getElementById('task-input');
        const taskName = taskInput ? taskInput.value.trim() : '';

        if (taskName !== '') {
            tasks.push({ name: taskName });
            if (taskInput) taskInput.value = '';
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
    const amount = inputField ? parseInt(inputField.value) : NaN;

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
    if (inputField) inputField.value = '';

    historyLog.push({
        text: `Dars bajarildi: "${taskName}"`,
        amount: `+${amount} 💰`,
        color: "#00ff66"
    });

    updateUI();
    renderHistory();
    showToast(`${amount} coin qo'shildi.`, "success");
    playCoinSound();
    triggerConfetti();
}

function takeCoin(index, taskName) {
    const inputField = document.getElementById(`coin-input-${index}`);
    const amount = inputField ? parseInt(inputField.value) : NaN;

    if (isNaN(amount) || amount <= 0) {
        showToast("To'g'ri raqam kiriting!", "error");
        return;
    }

    if (totalCoins - amount < 0) {
        showToast("Coinlar 0 dan pastga tushmaydi!", "error");
        return;
    }

    totalCoins -= amount;
    if (inputField) inputField.value = '';

    historyLog.push({
        text: `Jazo olindi: "${taskName}"`,
        amount: `-${amount} 💰`,
        color: "#ff0055"
    });

    updateUI();
    renderHistory();
    showToast(`${amount} coin olib tashlandi.`, "error");
}

// ==========================================
// 7. MARKET & PENDING PURCHASES
// ==========================================
function renderMarket() {
    const marketContainer = document.getElementById('market-list');
    if (!marketContainer) return;
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

function buyItem(index) {
    const item = marketItems[index];
    if (!item) return;

    if (totalCoins < item.price) {
        showToast("Coin yetarli emas!", "error");
        return;
    }

    const newRequest = {
        id: Date.now(),
        itemName: item.name,
        price: item.price,
        img: item.img,
        date: new Date().toLocaleTimeString().slice(0, 5)
    };

    pendingPurchases.push(newRequest);
    saveDataToFirebase();
    renderPendingPurchases();
    showToast(`"${item.name}" uchun so'rov adminga yuborildi!`, "info");
}

function approvePurchase(id) {
    const reqIndex = pendingPurchases.findIndex(p => p.id === id);
    if (reqIndex === -1) return;
    const item = pendingPurchases[reqIndex];

    if (totalCoins < item.price) {
        showToast("Ukangizda coin yetmay qoldi!", "error");
        return;
    }

    totalCoins -= item.price;
    historyLog.push({
        text: `Marketdan xarid (Tasdiqlandi): "${item.itemName}"`,
        amount: `-${item.price} 💰`,
        color: "#ff0055"
    });

    pendingPurchases.splice(reqIndex, 1);

    playCoinSound();
    triggerConfetti();
    updateUI();
    renderHistory();
    renderPendingPurchases();
    showToast(`"${item.itemName}" xaridi tasdiqlandi!`, "success");
}

function rejectPurchase(id) {
    const reqIndex = pendingPurchases.findIndex(p => p.id === id);
    if (reqIndex === -1) return;
    const item = pendingPurchases[reqIndex];

    pendingPurchases.splice(reqIndex, 1);
    saveDataToFirebase();
    renderPendingPurchases();
    showToast(`"${item.itemName}" so'rovi rad etildi.`, "info");
}

function renderPendingPurchases() {
    const container = document.getElementById('pending-list');
    const panel = document.getElementById('pending-purchases-panel');
    if (!container || !panel) return;

    if (currentRole !== 'admin' || pendingPurchases.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    container.innerHTML = '';

    pendingPurchases.forEach(req => {
        const card = document.createElement('div');
        card.className = 'history-item';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.marginBottom = '10px';

        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${req.img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
                <div>
                    <strong>${req.itemName}</strong>
                    <div style="font-size:12px; color:#888;">Narxi: ${req.price} 💰 | Soat: ${req.date}</div>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="cyber-btn primary-btn" onclick="approvePurchase(${req.id})">✅ Tasdiqlash</button>
                <button class="cyber-btn danger-btn" onclick="rejectPurchase(${req.id})">❌ Rad etish</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 8. HISTORY & STATS
// ==========================================
function renderHistory() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;
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

function renderWeeklyStats() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx || typeof Chart === 'undefined') return;

    // Bugungi kun va sanani aniqlash
    const now = new Date();
    const dayIndex = (now.getDay() + 6) % 7; // Dush=0, Sesh=1, ..., Yak=6
    const formattedDate = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Haftalik massivni shakllantirish (bugungi kunga dailyEarned ni qo'yish)
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    weeklyData[dayIndex] = dailyEarned;

    // Sarlavhaga bugungi sanani ko'rsatish (agar subtitle elementi bo'lsa)
    const subTitleEl = document.querySelector('#view-dashboard p');
    if (subTitleEl) {
        subTitleEl.textContent = `Oxirgi 7 kundagi natijalaringiz (Bugun: ${formattedDate})`;
    }

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
            datasets: [{
                label: 'Topilgan Coinlar',
                data: weeklyData,
                backgroundColor: '#00e5ff',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: DAILY_LIMIT,
                    ticks: {
                        stepSize: 10,
                        color: '#888'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#888' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================
// 9. RESET, THEMING & NAVIGATION
// ==========================================
const clearHistoryBtn = document.getElementById('clear-history-btn');
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        showCyberConfirm("TARIXNI TOZALASH", "Barcha tarix tozalanib ketishini tasdiqlaysizmi?", () => {
            historyLog = [];
            updateUI();
            renderHistory();
            showToast("Tarix tozalandi", "info");
        });
    });
}

const resetDayBtn = document.getElementById('reset-day-btn');
if (resetDayBtn) {
    resetDayBtn.addEventListener('click', () => {
        showCyberConfirm("YANGI KUN", "Yangi kunni boshlamoqchimisiz? Bugungi limit noldan boshlanadi.", () => {
            dailyEarned = 0;
            updateUI();
            showToast("Yangi kun boshlandi!", "info");
        });
    });
}

function checkAutoDailyReset() {
    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('cyber_last_reset') || '';

    if (lastReset !== today) {
        dailyEarned = 0;
        localStorage.setItem('cyber_daily', 0);
        localStorage.setItem('cyber_last_reset', today);
        saveDataToFirebase();
    }
}

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
    [btnDashboard, btnMarket, btnHistory].forEach(b => b && b.classList.remove('active'));
    [viewDashboard, viewMarket, viewHistory].forEach(v => v && v.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.classList.add('active');
}

if (btnDashboard && viewDashboard) {
    btnDashboard.addEventListener('click', () => switchView(btnDashboard, viewDashboard));
}
if (btnMarket && viewMarket) {
    btnMarket.addEventListener('click', () => switchView(btnMarket, viewMarket));
}
if (btnHistory && viewHistory) {
    btnHistory.addEventListener('click', () => {
        switchView(btnHistory, viewHistory);
        renderHistory();
    });
}

// ==========================================
// 10. MODALS, EFFECTS & INITIAL LOAD
// ==========================================
function showCyberConfirm(title, text, onYes) {
    const modal = document.getElementById('cyber-confirm-modal');
    const titleEl = document.getElementById('cyber-confirm-title');
    const textEl = document.getElementById('cyber-confirm-text');
    const yesBtn = document.getElementById('cyber-confirm-yes');
    const noBtn = document.getElementById('cyber-confirm-no');

    if (!modal || !yesBtn || !noBtn) {
        if (confirm(text)) onYes();
        return;
    }

    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
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

    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function playCoinSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
        console.log("Audio xatosi:", e);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

window.addEventListener('load', async () => {
    await loadDataFromFirebase();
    checkAuth();
});

// Profil rasmini o'chirish funksiyasi
function removeProfileAvatar() {
    // 1. Agar foydalanuvchi ma'lumotlari mavjud bo'lsa, avatarUrl ni olib tashlaymiz
    if (typeof currentUser !== 'undefined' && currentUser) {
        currentUser.avatarUrl = null;
        
        // Agar localStorage ishlatilsa
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Agar Firebase bazasiga saqlanadigan bo'lsa (foydalanuvchi ma'lumotlarini yangilash)
        if (typeof db !== 'undefined' && currentUser.uid) {
            dbSet(dbRef(db, 'users/' + currentUser.uid + '/avatarUrl'), null);
        }
    }

    // 2. Interfeysdagi avatarlarni yangilash (bosh harf yoki emojiga qaytarish)
    if (typeof updateAllAvatars === 'function') {
        updateAllAvatars();
    } else {
        // Agar maxsus funksiya bo'lmasa, sahifani yangilab yuborish ham mumkin
        location.reload();
    }

    // 3. Xabar berish
    if (typeof showToast === 'function') {
        showToast("Profil rasmi o'chirildi!", "success");
    }
}