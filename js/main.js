/* --- js/main.js (Версия 3.0: Firebase Connected) --- */

// 1. ИМПОРТ БИБЛИОТЕК (Google Servers)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. ТВОИ КЛЮЧИ ДОСТУПА
const firebaseConfig = {
  apiKey: "AIzaSyDNo6sI41rRfupv-aV33z037Sftn1tuUkM",
  authDomain: "trehsotniki-base.firebaseapp.com",
  projectId: "trehsotniki-base",
  storageBucket: "trehsotniki-base.firebasestorage.app",
  messagingSenderId: "539981219404",
  appId: "1:539981219404:web:2d5824c2f8d44d4a0e16e9",
  measurementId: "G-C2HM2K9S5W"
};

// 3. ЗАПУСК СИСТЕМЫ
console.log("Initialize Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. ОСНОВНАЯ ЛОГИКА САЙТА
document.addEventListener("DOMContentLoaded", function() {
    
    // Авто-создание окна, если его нет
    if (!document.getElementById('auth-modal')) {
        createModalHTML();
    }

    // Запуск анимаций
    initAnimations();

    // Закрытие окна по клику на фон
    const modal = document.getElementById('auth-modal');
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // --- ОБРАБОТКА ВХОДА (LOGIN) ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formLogin.querySelectorAll('input');
            const email = inputs[0].value; // Тут пользователь вводит Email (вместо Ника)
            const password = inputs[1].value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    alert("Вход выполнен! Загрузка профиля...");
                    closeModal();
                })
                .catch((error) => {
                    alert("Ошибка входа: " + error.message);
                });
        });
    }

    // --- ОБРАБОТКА РЕГИСТРАЦИИ (REGISTER) ---
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formRegister.querySelectorAll('input');
            const nickname = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;

            // Создаем аккаунт в Authentication
            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    
                    // Создаем запись в Базе Данных (Firestore)
                    await setDoc(doc(db, "users", user.uid), {
                        nickname: nickname,
                        email: email,
                        gold: 1000,  // Бонус новичка
                        xp: 0,
                        regDate: new Date().toISOString()
                    });

                    alert("Аккаунт создан! Командир " + nickname + " зачислен в штат.");
                    closeModal();
                })
                .catch((error) => {
                    alert("Ошибка регистрации: " + error.message);
                });
        });
    }
});

// 5. ГЛАВНЫЙ СЛЕЖЯЩИЙ (Слушает, вошел ли игрок)
onAuthStateChanged(auth, async (user) => {
    const authBlock = document.querySelector('.auth-buttons');
    
    if (user) {
        // Если пользователь вошел -> Качаем данные из базы
        console.log("User is logged in:", user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            // Обновляем шапку
            if (authBlock) {
                authBlock.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="text-align:right; line-height:1.2;">
                            <div style="font-size:10px; color:#888; font-weight:700;">КОМАНДИР</div>
                            <div style="color:var(--accent); font-family:'Orbitron'; font-size:14px;">${userData.nickname}</div>
                        </div>
                        <div style="width:35px; height:35px; background:#333; border-radius:50%; border:1px solid #555; background-image:url('img/gold_ico.jpg'); background-size:cover;"></div>
                        <button onclick="window.logoutUser()" style="background:none; border:none; color:#555; cursor:pointer; font-size:18px; margin-left:5px;" title="Выйти">✕</button>
                    </div>
                `;
            }
            // Обновляем статы в шапке (если есть элементы)
            const goldEl = document.querySelector('.stat span'); // Найдет первый span (золото)
            if(goldEl) goldEl.innerText = userData.gold.toLocaleString();
        }
    } else {
        // Если вышел -> Вернуть кнопки
        console.log("User is logged out");
        if (authBlock) {
            authBlock.innerHTML = `
                <button class="login-btn-ghost" onclick="openModal('login')">ВХОД</button>
                <button class="reg-btn-modern" onclick="openModal('register')">РЕГИСТРАЦИЯ</button>
            `;
        }
    }
});

// 6. ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ HTML КНОПОК)
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
    if(confirm("Выйти из аккаунта?")) {
        signOut(auth).then(() => {
            location.reload();
        });
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

// Функция создания HTML (резерв)
function createModalHTML() {
    // Тот же код модального окна, что и раньше, для подстраховки
    // (Но лучше, чтобы он был в HTML файлах, как мы уже сделали)
}

// Анимации
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}