/* --- js/main.js (Версия 4.0: Auto-Fix & Smart Login) --- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQRFK5GgW3EBJSOaKcAO-3taurs-sKUrQ",
  authDomain: "trehsotniki-base.firebaseapp.com",
  projectId: "trehsotniki-base",
  storageBucket: "trehsotniki-base.firebasestorage.app",
  messagingSenderId: "539981219404",
  appId: "1:539981219404:web:2d5824c2f8d44d4a0e16e9",
  measurementId: "G-C2HM2K9S5W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ГЛАВНЫЙ МОЗГ: СЛЕЖЕНИЕ ЗА ВХОДОМ ---
onAuthStateChanged(auth, async (user) => {
    const authBlock = document.querySelector('.auth-buttons');
    
    if (user) {
        console.log("Вход выполнен:", user.email);
        const docRef = doc(db, "users", user.uid);
        
        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // ВАРИАНТ А: У игрока есть профиль -> Грузим его
                const userData = docSnap.data();
                renderProfile(authBlock, userData.nickname);
                updateGold(userData.gold);
            } else {
                // ВАРИАНТ Б (ЛЕЧЕНИЕ): Вход есть, а профиля нет -> Создаем новый
                console.warn("Профиль не найден! Создаю запись восстановления...");
                
                // Делаем ник из почты (все, что до @)
                const autoNick = user.email.split('@')[0];
                
                const defaultData = {
                    nickname: autoNick,
                    email: user.email,
                    gold: 1000,
                    xp: 0,
                    regDate: new Date().toISOString()
                };
                
                // Сохраняем в базу
                await setDoc(docRef, defaultData);
                
                // Показываем интерфейс
                renderProfile(authBlock, autoNick);
                updateGold(1000);
                alert("Профиль восстановлен! Вам начислено 1000 золота.");
            }
        } catch (error) {
            console.error("Ошибка базы данных:", error);
        }
    } else {
        // Если игрок не вошел -> Рисуем кнопки
        if (authBlock) {
            authBlock.innerHTML = `
                <button class="login-btn-ghost" onclick="openModal('login')">ВХОД</button>
                <button class="reg-btn-modern" onclick="openModal('register')">РЕГИСТРАЦИЯ</button>
            `;
        }
    }
});

// Вспомогательная функция рисования профиля
function renderProfile(container, nickname) {
    if (container) {
        container.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="text-align:right; line-height:1.2;">
                    <div style="font-size:10px; color:#888; font-weight:700;">КОМАНДИР</div>
                    <div style="color:var(--accent); font-family:'Orbitron'; font-size:14px;">${nickname}</div>
                </div>
                <div style="width:35px; height:35px; background:#333; border-radius:50%; border:1px solid #555; background-image:url('img/gold_ico.jpg'); background-size:cover;"></div>
                <button onclick="window.logoutUser()" style="background:none; border:none; color:#555; cursor:pointer; font-size:18px; margin-left:5px;" title="Выйти">✕</button>
            </div>
        `;
    }
}

function updateGold(amount) {
    // Ищем счетчик золота в шапке (первый stat > span)
    const goldEl = document.querySelector('.stat span');
    if(goldEl) goldEl.innerText = amount.toLocaleString();
}

// --- ЛОГИКА САЙТА И ФОРМ ---
document.addEventListener("DOMContentLoaded", function() {
    
    if (!document.getElementById('auth-modal')) createModalHTML();
    initAnimations();

    const modal = document.getElementById('auth-modal');
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // ВХОД
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formLogin.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;

            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert("Вход выполнен! Перезагрузка систем...");
                    window.location.reload(); // Перезагружаем для надежности
                })
                .catch((error) => {
                    console.error(error);
                    alert("Ошибка: Проверьте Email и Пароль.");
                });
        });
    }

    // РЕГИСТРАЦИЯ
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formRegister.querySelectorAll('input');
            const nickname = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;

            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    await setDoc(doc(db, "users", user.uid), {
                        nickname: nickname,
                        email: email,
                        gold: 1000,
                        xp: 0,
                        regDate: new Date().toISOString()
                    });
                    alert("Аккаунт создан! Вход выполняется...");
                    window.location.reload();
                })
                .catch((error) => {
                    alert("Ошибка регистрации: " + error.message);
                });
        });
    }
});

// Глобальные функции для кнопок в HTML
window.openModal = function(mode) {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('open');
        window.switchTab(mode);
    }
};

window.closeModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
};

window.logoutUser = function() {
    if(confirm("Покинуть расположение части?")) {
        signOut(auth).then(() => location.reload());
    }
};

window.switchTab = function(mode) {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (mode === 'login') {
        if(formLogin) formLogin.classList.add('active');
        if(formRegister) formRegister.classList.remove('active');
        if(tabLogin) tabLogin.classList.add('active');
        if(tabRegister) tabRegister.classList.remove('active');
    } else {
        if(formLogin) formLogin.classList.remove('active');
        if(formRegister) formRegister.classList.add('active');
        if(tabLogin) tabLogin.classList.remove('active');
        if(tabRegister) tabRegister.classList.add('active');
    }
};

function createModalHTML() {} // Оставляем пустым, т.к. HTML уже вставлен в файлы
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

