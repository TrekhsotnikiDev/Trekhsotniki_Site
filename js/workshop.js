/* js/workshop.js - V13.4 FINAL STABLE (GITHUB READY) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWqbVh-eFA0A9uPgAf_q8fg4jP7rNnQDk",
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

let currentUser = null;
let userTanks = []; 
let currentNation = null;

const STARTER_TANKS = ['fiat', 'm1928', 't18_29', 't18', 'filler', 'st_pz_1', 'st_pz_2', 'ltr_k', 'ltr_r', 't2_29', 't1e1', 't1', 'mk1', 'mk1cs', 'mk2', 'mk3', 'nc31', 'nc27', 'ft', 'char_d1', 'otsu', 'type89', 'ko'];

// --- 1. ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ КНОПОК В HTML) ---
window.openModal = function(mode) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    const isLogin = mode === 'login';
    document.getElementById('form-login')?.classList.toggle('active', isLogin);
    document.getElementById('form-register')?.classList.toggle('active', !isLogin);
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin);
};

window.closeModal = function() {
    document.getElementById('auth-modal')?.classList.remove('open');
};

// --- 2. СИНХРОНИЗАЦИЯ АВТОРИЗАЦИИ (БЕЗ ДВОЙНОГО ЛОГИНА) ---
onAuthStateChanged(auth, (user) => {
    const authButtons = document.querySelector('.auth-buttons');
    if (user) {
        currentUser = user;
        const userRef = doc(db, "users", user.uid);

        onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                userTanks = data.tanks || [];
                
                // Валюта в реальном времени
                const goldEl = document.querySelector('.gold-stat span');
                const xpEl = document.querySelector('.xp-stat span');
                if(goldEl) goldEl.innerText = (data.gold || 0).toLocaleString();
                if(xpEl) xpEl.innerText = (data.xp || 0).toLocaleString();
                
                // Профиль (GitHub Fix: пути и оформление)
                if (authButtons) {
                    authButtons.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="location.href='profile.html'">
                            <div style="text-align:right; line-height:1.2;">
                                <div style="font-size:10px; color:#888; font-weight:700;">КОМАНДИР</div>
                                <div style="color:#ffbb33; font-family:'Orbitron'; font-size:14px;">${data.nickname || user.email.split('@')[0]}</div>
                            </div>
                            <div style="width:35px; height:35px; background:#333; border-radius:50%; border:1px solid #ff9d00; background-image:url('./img/gold_ico.jpg'); background-size:cover;"></div>
                        </div>`;
                }
                if (currentNation) renderTechTree(currentNation);
            }
        });
    } else {
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="login-btn-ghost" onclick="openModal('login')">ВХОД</button>
                <button class="reg-btn-modern" onclick="openModal('register')">РЕГИСТРАЦИЯ</button>`;
        }
    }
});

// --- 3. ОБРАБОТКА ФОРМ (ПРЕДОТВРАЩЕНИЕ ПЕРЕЗАГРУЗКИ) ---
document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formLogin.querySelectorAll('input');
            signInWithEmailAndPassword(auth, inputs[0].value, inputs[1].value)
                .then(() => closeModal())
                .catch(err => alert("Ошибка: " + err.message));
        });
    }

    const formReg = document.getElementById('form-register');
    if (formReg) {
        formReg.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formReg.querySelectorAll('input');
            const nick = inputs[0].value;
            const email = inputs[1].value;
            const pass = inputs[2].value;

            createUserWithEmailAndPassword(auth, email, pass)
                .then(async (u) => {
                    await setDoc(doc(db, "users", u.user.uid), {
                        nickname: nick, email: email, gold: 1000, xp: 500, tanks: STARTER_TANKS, regDate: new Date().toISOString()
                    });
                    closeModal();
                }).catch(err => alert("Ошибка: " + err.message));
        });
    }
});
// Далее идет ваша база данных FULL_DB и остальные функции...

// ==// === ТВОЯ ПОЛНАЯ БАЗА ДАННЫХ (UPDATED V13: С ОПИСАНИЕМ И ТТХ) ===
const FULL_DB = {
    'ussr': {
        // Легкие
        'fiat': { 
            name: 'Фиат-Ижорский', rank: 1, br: 1.0, cost: 0, class: 'light',
            desc: 'Легкий бронеавтомобиль на шасси Fiat, усиленный Ижорским заводом. Ранняя попытка создания мобильной огневой точки.',
            stats: { armor: '4-6 мм', gun: '7.62 мм Пулемет', engine: '45 л.с.' }
        },
        'm1928': { 
            name: 'M.1928', rank: 1, br: 1.0, cost: 250, class: 'light', req: 'fiat',
            desc: 'Экспериментальный прототип легкого танка поддержки пехоты. Отличается маневренностью, но слабым бронированием.',
            stats: { armor: '8-10 мм', gun: '37 мм Гочкис', engine: '60 л.с.' }
        },
        't18_29': { 
            name: 'Т-18 Обр. 1929', rank: 1, br: 1.0, cost: 300, class: 'light', req: 'm1928',
            desc: 'Модернизированная версия МС-1 (Т-18). Установлен более мощный двигатель и улучшенная башня.',
            stats: { armor: '16 мм', gun: '37 мм Гочкис', engine: '40 л.с.' }
        },
        't18': { 
            name: 'Т-18', rank: 1, br: 1.0, cost: 500, class: 'light', req: 't18_29',
            desc: 'Первый серийный советский танк собственной разработки. Создан на базе Renault FT-17.',
            stats: { armor: '16 мм', gun: '37 мм Гочкис', engine: '35 л.с.' }
        },
        // Средние
        'filler': { 
            name: 'Т-26 (обр.33)', rank: 1, br: 1.0, cost: 0, class: 'medium',
            desc: 'Самый массовый советский танк 30-х годов. Однобашенная версия с 45-мм пушкой 20К.',
            stats: { armor: '15 мм', gun: '45 мм 20К', engine: '90 л.с.' }
        },
        'filler2': { 
            name: 'Т-26 (обр.39)', rank: 1, br: 1.3, cost: 500, class: 'medium', req: 'filler',
            desc: 'Поздняя модификация Т-26 с конической башней и усиленным наклонным бронированием.',
            stats: { armor: '15-20 мм', gun: '45 мм 20К', engine: '97 л.с.' }
        },
        't12': { 
            name: 'Т-12', rank: 2, br: 2.1, cost: 1500, class: 'medium', req: 'filler2',
            desc: 'Экспериментальный маневренный танк. Предшественник Т-24. Отличается "этажной" компоновкой вооружения.',
            stats: { armor: '22 мм', gun: '45 мм обр.30', engine: '180 л.с.' }
        },
        't24': { 
            name: 'Т-24', rank: 2, br: 2.2, cost: 2500, class: 'medium', req: 't12',
            desc: 'Советский средний танк межвоенного периода. Обладал мощным для своего времени вооружением, но низкой надежностью.',
            stats: { armor: '20 мм', gun: '45 мм 20К', engine: '250 л.с.' }
        },
        // Тяжелые
        't35_1': { 
            name: 'Т-35-1', rank: 2, br: 2.4, cost: 4000, class: 'heavy',
            desc: 'Прототип легендарного пятибашенного монстра. Создан для прорыва укрепленных полос обороны.',
            stats: { armor: '20-30 мм', gun: '76 мм КТ-28', engine: '500 л.с.' }
        },
        't35_2': { 
            name: 'Т-35-2', rank: 2, br: 2.5, cost: 5500, class: 'heavy', req: 't35_1',
            desc: 'Вторая серийная версия. Улучшена система охлаждения и трансмиссия.',
            stats: { armor: '30 мм', gun: '76 мм КТ-28', engine: '500 л.с.' }
        },
        't35_a': { 
            name: 'Т-35-А', rank: 2, br: 2.7, cost: 7000, class: 'heavy', req: 't35_2',
            desc: 'Финальная версия "сухопутного линкора". Усиленные башни и экранирование ходовой части.',
            stats: { armor: '35-50 мм', gun: '76 мм КТ-28', engine: '580 л.с.' }
        },
        'kv1_l11': { 
            name: 'КВ-1 с Л-11', rank: 3, br: 3.0, cost: 12000, class: 'heavy', req: 't35_a',
            desc: 'Ранний КВ-1. Неуязвимая крепость для танков начала войны, вооруженная 76-мм пушкой Л-11.',
            stats: { armor: '75 мм', gun: '76 мм Л-11', engine: '500 л.с.' }
        },
        'kv1_zis': { 
            name: 'КВ-1 ЗиС-5', rank: 3, br: 3.1, cost: 18000, class: 'heavy', req: 'kv1_l11',
            desc: 'Экранированная версия КВ-1 с более мощной и надежной пушкой ЗиС-5.',
            stats: { armor: '100 мм', gun: '76 мм ЗиС-5', engine: '600 л.с.' }
        },
        'kv1s': { 
            name: 'КВ-1С', rank: 3, br: 3.3, cost: 25000, class: 'heavy', req: 'kv1_zis',
            desc: '"Скоростной" вариант КВ. Облегченная броня ради подвижности, новая литая башня.',
            stats: { armor: '60-82 мм', gun: '76 мм ЗиС-5', engine: '600 л.с.' }
        },
        'is1': { 
            name: 'ИС-1', rank: 3, br: 3.4, cost: 35000, class: 'heavy', req: 'kv1s',
            desc: 'Переходная модель к серии ИС. Башня от КВ-85, но корпус уже новой конструкции.',
            stats: { armor: '100-120 мм', gun: '85 мм Д-5Т', engine: '520 л.с.' }
        },
        'is2': { 
            name: 'ИС-2', rank: 3, br: 3.5, cost: 50000, class: 'heavy', req: 'is1',
            desc: 'Танк Победы. Мощнейшее 122-мм орудие, способное срывать башни немецким "Кошкам".',
            stats: { armor: '120 мм', gun: '122 мм Д-25Т', engine: '520 л.с.' }
        },
        'is3': { 
            name: 'ИС-3', rank: 3, br: 3.6, cost: 80000, class: 'heavy', req: 'is2',
            desc: 'Революционный дизайн с "Щучьим носом" и рикошетной башней. Участвовал в Параде Победы в Берлине.',
            stats: { armor: '110 мм (угол)', gun: '122 мм Д-25Т', engine: '520 л.с.' }
        },
        'is7': { 
            name: 'ИС-7', rank: 3, br: 3.9, cost: 150000, class: 'heavy', req: 'is3',
            desc: 'Вершина советского танкостроения 40-х. Могучая броня, 130-мм морское орудие и автомат заряжания.',
            stats: { armor: '150 мм', gun: '130 мм С-70', engine: '1050 л.с.' }
        },
        't35_prem': { 
            name: 'Т-35 (ПРЕМ)', rank: 1, br: 1.3, cost: 0, class: 'heavy', premium: true, longLine: true,
            desc: 'Парадная версия Т-35 в уникальном камуфляже. Легенда советской пропаганды.',
            stats: { armor: '30 мм', gun: '76 мм + 45 мм', engine: '500 л.с.' }
        }
    },
    'germany': {
        'st_pz_1': { 
            name: 'St. Pz. Ober I', rank: 1, br: 1.0, cost: 0, class: 'heavy',
            desc: 'Тяжелый штурмовой танк времен ПМВ. Медленная передвижная крепость.',
            stats: { armor: '30 мм', gun: '57 мм', engine: '200 л.с.' }
        },
        'st_pz_2': { 
            name: 'St. Pz. Ober II', rank: 1, br: 1.0, cost: 500, class: 'heavy', req: 'st_pz_1',
            desc: 'Улучшенная версия штурмового танка с усиленным лобовым листом.',
            stats: { armor: '40 мм', gun: '57 мм', engine: '220 л.с.' }
        },
        'dw1': { 
            name: 'D.W. I', rank: 2, br: 2.6, cost: 8000, class: 'heavy', req: 'st_pz_2',
            desc: 'Durchbruchswagen I. Экспериментальный танк прорыва, предок "Тигров".',
            stats: { armor: '50 мм', gun: '75 мм KwK 37', engine: '280 л.с.' }
        },
        'dw2': { 
            name: 'D.W. II', rank: 2, br: 2.9, cost: 10000, class: 'heavy', req: 'dw1',
            desc: 'Развитие идеи D.W.I. Усиленная ходовая часть и улучшенная башня.',
            stats: { armor: '50 мм', gun: '75 мм KwK 37', engine: '300 л.с.' }
        },
        'pz6': { 
            name: 'Pz. VI Tiger', rank: 3, br: 3.1, cost: 15000, class: 'heavy', req: 'dw2',
            desc: 'Легендарный "Тигр". Толстая броня и смертоносная пушка 8.8 см.',
            stats: { armor: '100 мм', gun: '88 мм KwK 36', engine: '650 л.с.' }
        },
        'pz6b': { 
            name: 'Pz. VI B', rank: 3, br: 3.2, cost: 20000, class: 'heavy', req: 'pz6',
            desc: 'Ранняя версия Королевского Тигра с башней Порше.',
            stats: { armor: '150 мм', gun: '88 мм KwK 43', engine: '700 л.с.' }
        },
        'pz6h1': { 
            name: 'Pz. VI H1', rank: 3, br: 3.3, cost: 30000, class: 'heavy', req: 'pz6b',
            desc: 'Модернизированный Тигр с командирской башенкой и фильтрами.',
            stats: { armor: '102 мм', gun: '88 мм KwK 36', engine: '700 л.с.' }
        },
        'pz6e': { 
            name: 'Pz. VI E', rank: 3, br: 3.4, cost: 45000, class: 'heavy', req: 'pz6h1',
            desc: 'Поздняя версия Тигра с циммеритом и стальными катками.',
            stats: { armor: '110 мм', gun: '88 мм KwK 36', engine: '700 л.с.' }
        },
        'tiger2': { 
            name: 'Tiger II (H)', rank: 3, br: 3.5, cost: 70000, class: 'heavy', req: 'pz6e',
            desc: 'Королевский Тигр с башней Хеншеля. Вершина немецкого серийного танкостроения.',
            stats: { armor: '185 мм', gun: '88 мм KwK 43', engine: '700 л.с.' }
        },
        'e100': { 
            name: 'E-100', rank: 3, br: 3.7, cost: 150000, class: 'heavy', req: 'tiger2',
            desc: 'Сверхтяжелый проект серии E. 140 тонн стали и 128-мм орудие.',
            stats: { armor: '200 мм', gun: '128 мм KwK 44', engine: '1200 л.с.' }
        },
        'gr_tr_1': { 
            name: 'Gr. Tr. I', rank: 2, br: 2.1, cost: 2500, class: 'medium',
            desc: 'Grosstraktor. Секретный проект Рейхсвера, созданный в обход Версальского договора.',
            stats: { armor: '14 мм', gun: '75 мм KwK 37', engine: '250 л.с.' }
        },
        'gr_tr_2': { 
            name: 'Gr. Tr. II', rank: 2, br: 2.3, cost: 4000, class: 'medium', req: 'gr_tr_1',
            desc: 'Улучшенная версия "Большого трактора" с усиленной подвеской.',
            stats: { armor: '20 мм', gun: '75 мм KwK 37', engine: '260 л.с.' }
        },
        'nb_fz': { 
            name: 'Nb. Fz.', rank: 2, br: 2.5, cost: 6000, class: 'medium', req: 'gr_tr_2',
            desc: 'Neubaufahrzeug. Трехбашенный танк пропаганды. Выглядит грозно, но броня слабая.',
            stats: { armor: '20 мм', gun: '75 мм + 37 мм', engine: '290 л.с.' }
        },
        'ltr_k': { 
            name: 'L. Tr. (K)', rank: 1, br: 1.0, cost: 0, class: 'light',
            desc: 'Leichttraktor Krupp. Ранний легкий танк с кормовым расположением башни.',
            stats: { armor: '14 мм', gun: '37 мм KwK 36', engine: '85 л.с.' }
        },
        'ltr_r': { 
            name: 'L. Tr. (R)', rank: 1, br: 1.0, cost: 500, class: 'light', req: 'ltr_k',
            desc: 'Версия от Rheinmetall. Отличается ходовой частью на пружинных рессорах.',
            stats: { armor: '14 мм', gun: '37 мм KwK 36', engine: '100 л.с.' }
        }
    },
    'usa': {
        't2_29': { 
            name: 'T2 1929', rank: 1, br: 1.0, cost: 0, class: 'light',
            desc: 'Экспериментальный легкий танк. Послужил базой для многих американских разработок.',
            stats: { armor: '15 мм', gun: '12.7 мм MG', engine: '250 л.с.' }
        },
        't1e1': { 
            name: 'T1E1', rank: 1, br: 1.0, cost: 400, class: 'light', req: 't2_29',
            desc: 'Легкий танк Каннингхэма. Отличается высокой скоростью, но картонной броней.',
            stats: { armor: '10 мм', gun: '37 мм M1', engine: '110 л.с.' }
        },
        't1': { 
            name: 'T1 Cunningham', rank: 1, br: 1.0, cost: 600, class: 'light', req: 't1e1',
            desc: 'Серийная версия T1. Основной легкий танк США конца 20-х.',
            stats: { armor: '12 мм', gun: '37 мм M1', engine: '120 л.с.' }
        },
        'm1928': { 
            name: 'M.1928', rank: 1, br: 1.0, cost: 800, class: 'light', req: 't1',
            desc: 'Модификация с улучшенной проходимостью.',
            stats: { armor: '15 мм', gun: '37 мм', engine: '130 л.с.' }
        },
        't1e5': { 
            name: 'T1E5', rank: 2, br: 2.1, cost: 2000, class: 'light', req: 'm1928',
            desc: 'Попытка установить более мощный двигатель на базу T1.',
            stats: { armor: '15 мм', gun: '37 мм Browning', engine: '150 л.с.' }
        },
        't2_med': { 
            name: 'T2 Medium', rank: 2, br: 2.2, cost: 3000, class: 'medium', req: 't1e5', longLine: true,
            desc: 'Средний танк 30-х годов. Прототип будущего М2. Множество пулеметных башенок.',
            stats: { armor: '22 мм', gun: '37 мм', engine: '220 л.с.' }
        },
        'm1_comb': { 
            name: 'M1 Combat Car', rank: 2, br: 2.4, cost: 4500, class: 'light', req: 't1e5',
            desc: 'Кавалерийский танк. Исключительно быстрая машина для разведки.',
            stats: { armor: '16 мм', gun: '12.7 мм M2', engine: '250 л.с.' }
        },
        'm1': { 
            name: 'M1 Light', rank: 2, br: 2.6, cost: 5500, class: 'light', req: 'm1_comb',
            desc: 'Ранний вариант легкого танка, предшественник Стюарта.',
            stats: { armor: '16 мм', gun: '37 мм', engine: '260 л.с.' }
        },
        't7': { 
            name: 'T7 Combat Car', rank: 2, br: 2.8, cost: 7000, class: 'light', req: 'm1',
            desc: 'Экспериментальная колесно-гусеничная машина.',
            stats: { armor: '15 мм', gun: '12.7 мм', engine: '200 л.с.' }
        },
        'm2': { 
            name: 'M2 Medium', rank: 3, br: 3.0, cost: 12000, class: 'medium', req: 't2_med',
            desc: 'Серийный средний танк с 37-мм пушкой и множеством пулеметов по периметру.',
            stats: { armor: '32 мм', gun: '37 мм M3', engine: '350 л.с.' }
        },
        'm3': { 
            name: 'M3 Lee', rank: 3, br: 3.1, cost: 18000, class: 'medium', req: 'm2',
            desc: 'Многобашенный танк. 75-мм гаубица в корпусе и 37-мм пушка в башне.',
            stats: { armor: '51 мм', gun: '75 мм M2 + 37 мм', engine: '400 л.с.' }
        },
        't1e1_h': { 
            name: 'T1E1 Heavy', rank: 3, br: 3.2, cost: 25000, class: 'heavy',
            desc: 'Ранний прототип тяжелого танка М6. Литой корпус и электрическая трансмиссия.',
            stats: { armor: '70 мм', gun: '76 мм + 37 мм', engine: '800 л.с.' }
        },
        'm6a1': { 
            name: 'M6A1', rank: 3, br: 3.4, cost: 35000, class: 'heavy', req: 't1e1_h',
            desc: 'Американский тяжеловес. Огромный силуэт, спаренная пушечная установка.',
            stats: { armor: '83 мм', gun: '76 мм M7', engine: '960 л.с.' }
        },
        't26e1': { 
            name: 'T26E1 Super Pershing', rank: 3, br: 3.6, cost: 50000, class: 'heavy', req: 'm6a1',
            desc: 'Першинг с длинноствольным орудием и дополнительной накладной броней от "Пантеры".',
            stats: { armor: '102 мм + экраны', gun: '90 мм T15E1', engine: '500 л.с.' }
        },
        't32': { 
            name: 'T32', rank: 3, br: 3.7, cost: 70000, class: 'heavy', req: 't26e1',
            desc: 'Тяжелый танк на базе Першинга с невероятно крепкой башней и мощным орудием.',
            stats: { armor: '298 мм (башня)', gun: '90 мм T15E2', engine: '770 л.с.' }
        },
        't29': { 
            name: 'T29', rank: 3, br: 3.8, cost: 90000, class: 'heavy', req: 't32',
            desc: 'Экспериментальный танк с огромной башней и 105-мм пушкой для борьбы с Тиграми.',
            stats: { armor: '279 мм (маска)', gun: '105 мм T5E1', engine: '770 л.с.' }
        },
        't30': { 
            name: 'T30', rank: 3, br: 3.9, cost: 120000, class: 'heavy', req: 't29',
            desc: 'Вариант T29 с чудовищным 155-мм орудием. Огромный урон, долгая перезарядка.',
            stats: { armor: '279 мм (маска)', gun: '155 мм T7', engine: '810 л.с.' }
        }
    },
    'uk': {
        'mk1': { 
            name: 'Medium Mk. I', rank: 1, br: 1.0, cost: 0, class: 'medium',
            desc: 'Первый в мире серийный танк с вращающейся башней и круговым обстрелом.',
            stats: { armor: '6-12 мм', gun: '47 мм 3-pdr', engine: '90 л.с.' }
        },
        'mk1cs': { 
            name: 'Mk. I CS', rank: 1, br: 1.0, cost: 400, class: 'medium', req: 'mk1',
            desc: 'Close Support (CS) версия с гаубицей для стрельбы фугасами.',
            stats: { armor: '12 мм', gun: '3.7-inch mortar', engine: '90 л.с.' }
        },
        'mk2': { 
            name: 'Medium Mk. II', rank: 1, br: 1.0, cost: 600, class: 'medium', req: 'mk1cs',
            desc: 'Доработанная версия Mk.I с измененной формой корпуса и улучшенной подвеской.',
            stats: { armor: '14 мм', gun: '47 мм 3-pdr', engine: '90 л.с.' }
        },
        'mk3': { 
            name: 'Medium Mk. III', rank: 1, br: 1.0, cost: 900, class: 'medium', req: 'mk2',
            desc: 'Трехбашенный средний танк. Предшественник крейсерских танков.',
            stats: { armor: '14 мм', gun: '47 мм 3-pdr', engine: '180 л.с.' }
        },
        'vic_a': { 
            name: 'Vickers Mk. E (A)', rank: 2, br: 2.1, cost: 2000, class: 'light',
            desc: 'Знаменитый "Виккерс 6-тонный". Двухбашенная пулеметная версия.',
            stats: { armor: '13 мм', gun: '2x .303 MG', engine: '80 л.с.' }
        },
        'vic_b': { 
            name: 'Vickers Mk. E (B)', rank: 2, br: 2.2, cost: 3000, class: 'light', req: 'vic_a',
            desc: 'Однобашенная версия с 47-мм пушкой. Послужила базой для Т-26 и 7TP.',
            stats: { armor: '13 мм', gun: '47 мм', engine: '80 л.с.' }
        },
        'a9': { 
            name: 'A9 Cruiser I', rank: 2, br: 2.5, cost: 4500, class: 'medium', req: 'mk3',
            desc: 'Первый крейсерский танк. Слабая броня, но много пулеметных башенок.',
            stats: { armor: '14 мм', gun: '40 мм 2-pdr', engine: '150 л.с.' }
        },
        'a10': { 
            name: 'A10 Cruiser II', rank: 2, br: 2.8, cost: 5500, class: 'medium', req: 'a9',
            desc: '"Тяжелый крейсер". Усиленное бронирование за счет снижения скорости.',
            stats: { armor: '30 мм', gun: '40 мм 2-pdr', engine: '150 л.с.' }
        },
        'a13': { 
            name: 'A13 Cruiser III', rank: 2, br: 2.9, cost: 7000, class: 'medium', req: 'a10', longLine: true,
            desc: 'Первый британский танк на подвеске Кристи. Очень быстрый и маневренный.',
            stats: { armor: '14 мм', gun: '40 мм 2-pdr', engine: '340 л.с.' }
        },
        'cruiser4': { 
            name: 'A13 Mk.II Cruiser IV', rank: 3, br: 3.1, cost: 12000, class: 'medium', req: 'a13',
            desc: 'Улучшенная версия A13 с накладной разнесенной броней на башне.',
            stats: { armor: '30 мм', gun: '40 мм 2-pdr', engine: '340 л.с.' }
        },
        'church1': { 
            name: 'Churchill I', rank: 3, br: 3.2, cost: 20000, class: 'heavy',
            desc: 'Пехотный танк. Толстая броня, 2-фунтовка в башне и гаубица в корпусе.',
            stats: { armor: '89 мм', gun: '40 мм + 76 мм', engine: '350 л.с.' }
        },
        'church3': { 
            name: 'Churchill III', rank: 3, br: 3.3, cost: 30000, class: 'heavy', req: 'church1',
            desc: 'Сварная башня и более мощное 6-фунтовое орудие. Медленный, но очень живучий.',
            stats: { armor: '89 мм', gun: '57 мм 6-pdr', engine: '350 л.с.' }
        },
        'church_avre': { 
            name: 'Churchill AVRE', rank: 3, br: 3.4, cost: 40000, class: 'heavy', req: 'church3',
            desc: 'Инженерный танк с 290-мм мортирой Petard. Стреляет "летающими урнами".',
            stats: { armor: '89 мм', gun: '290 мм Mortar', engine: '350 л.с.' }
        },
        'a43': { 
            name: 'A43 Black Prince', rank: 3, br: 3.5, cost: 55000, class: 'heavy', req: 'church_avre',
            desc: 'Сверхусиленный Черчилль с широким корпусом и пушкой 17-pdr.',
            stats: { armor: '152 мм', gun: '76 мм 17-pdr', engine: '350 л.с.' }
        },
        'a45': { 
            name: 'A45 Caernarvon', rank: 3, br: 3.6, cost: 70000, class: 'heavy', req: 'a43',
            desc: 'Прототип "Конкерора". Шасси от FV200 и башня от Центуриона.',
            stats: { armor: '130 мм', gun: '84 мм 20-pdr', engine: '800 л.с.' }
        },
        'a39': { 
            name: 'A39 Tortoise', rank: 3, br: 3.7, cost: 100000, class: 'td', req: 'a45',
            desc: 'Штурмовая САУ "Черепаха". Непробиваемая лобовая броня и скорострельная 32-фунтовка.',
            stats: { armor: '228 мм', gun: '94 мм 32-pdr', engine: '600 л.с.' }
        }
    },
    'france': {
        'nc31': { 
            name: 'Renault NC-31', rank: 1, br: 1.0, cost: 0, class: 'light',
            desc: 'Экспортная модификация FT-17 с улучшенной ходовой частью и скоростью.',
            stats: { armor: '16 мм', gun: '37 мм SA18', engine: '60 л.с.' }
        },
        'nc27': { 
            name: 'Renault NC-27', rank: 1, br: 1.0, cost: 400, class: 'light', req: 'nc31',
            desc: 'Дальнейшее развитие серии NC. Пытались продать Японии и Польше.',
            stats: { armor: '30 мм', gun: '37 мм SA18', engine: '60 л.с.' }
        },
        'ft': { 
            name: 'Renault FT', rank: 1, br: 1.0, cost: 600, class: 'light', req: 'nc27',
            desc: 'Легенда Первой мировой. Первый танк классической компоновки.',
            stats: { armor: '16 мм', gun: '37 мм SA18', engine: '39 л.с.' }
        },
        'char_d1': { 
            name: 'Char D1', rank: 1, br: 1.0, cost: 900, class: 'medium', req: 'ft',
            desc: 'Основной боевой танк Франции начала 30-х. Неплохая броня, но малая скорость.',
            stats: { armor: '30 мм', gun: '47 мм SA34', engine: '74 л.с.' }
        },
        'amr33': { 
            name: 'AMR 33', rank: 2, br: 2.3, cost: 2500, class: 'light', req: 'ft',
            desc: 'Легкий разведывательный танк. Очень быстрый, но картонный.',
            stats: { armor: '13 мм', gun: '7.5 мм MG', engine: '84 л.с.' }
        },
        'amx38': { 
            name: 'AMX 38', rank: 2, br: 2.9, cost: 9000, class: 'light', req: 'amr33', midLine: true,
            desc: 'Прототип легкого танка с рациональными углами наклона брони.',
            stats: { armor: '40 мм', gun: '37 мм SA38', engine: '130 л.с.' }
        },
        'd2': { 
            name: 'Char D2', rank: 2, br: 2.5, cost: 4000, class: 'medium', req: 'char_d1',
            desc: 'Развитие D1. Усиленная броня и более мощная 47-мм пушка SA35.',
            stats: { armor: '40 мм', gun: '47 мм SA35', engine: '150 л.с.' }
        },
        's35': { 
            name: 'SOMUA S35', rank: 2, br: 2.6, cost: 5500, class: 'medium', req: 'd2',
            desc: 'Лучший французский танк 1940 года. Отличная броня и подвижность, но одноместная башня.',
            stats: { armor: '47 мм', gun: '47 мм SA35', engine: '190 л.с.' }
        },
        'b1': { 
            name: 'Char B1 bis', rank: 2, br: 2.7, cost: 8000, class: 'heavy',
            desc: 'Символ французской мощи. Непробиваем для ранних немецких пушек. Гаубица 75-мм в корпусе.',
            stats: { armor: '60 мм', gun: '47 мм + 75 мм', engine: '307 л.с.' }
        },
        'r38': { 
            name: 'R 38', rank: 3, br: 3.0, cost: 12000, class: 'light', req: 'amx38',
            desc: 'Модификация R35 с новой длинноствольной пушкой для борьбы с танками.',
            stats: { armor: '40 мм', gun: '37 мм SA38', engine: '82 л.с.' }
        },
        's40': { 
            name: 'SOMUA S40', rank: 3, br: 3.1, cost: 15000, class: 'medium', req: 's35',
            desc: 'Улучшенная версия S35 с новой башней и сварным корпусом (проект).',
            stats: { armor: '60 мм', gun: '47 мм SA35', engine: '220 л.с.' }
        },
        'sarl42': { 
            name: 'SARL 42', rank: 3, br: 3.3, cost: 35000, class: 'medium', req: 's40',
            desc: 'Проект развития S40, разрабатываемый в тайне во время оккупации.',
            stats: { armor: '60 мм', gun: '75 мм SA44', engine: '230 л.с.' }
        },
        'fcm_f1': { 
            name: 'FCM F1', rank: 3, br: 3.2, cost: 25000, class: 'heavy', req: 'b1',
            desc: 'Гигантский двухбашенный сверхтяжелый танк для прорыва Линии Зигфрида.',
            stats: { armor: '100 мм', gun: '90 мм + 47 мм', engine: '700 л.с.' }
        },
        'fcm50t': { 
            name: 'FCM 50 t', rank: 3, br: 3.5, cost: 50000, class: 'heavy', req: 'fcm_f1',
            desc: 'Послевоенный проект "среднего" танка весом 50 тонн. Отличная динамика.',
            stats: { armor: '120 мм', gun: '90 мм/100 мм', engine: '1000 л.с.' }
        },
        'arl44_acl': { 
            name: 'ARL 44 ACL-1', rank: 3, br: 3.6, cost: 70000, class: 'heavy', req: 'fcm50t',
            desc: 'Ранний прототип ARL-44 с башней от американского TD и 75-мм пушкой.',
            stats: { armor: '60 мм', gun: '75 мм SA44', engine: '575 л.с.' }
        },
        'arl44': { 
            name: 'ARL 44', rank: 3, br: 3.7, cost: 100000, class: 'heavy', req: 'arl44_acl',
            desc: 'Серийный послевоенный тяж. Мощнейшая 90-мм пушка и 120 мм наклонной брони.',
            stats: { armor: '120 мм', gun: '90 мм DCA 45', engine: '575 л.с.' }
        }
    },
    'japan': {
        'otsu': { 
            name: 'Renault Otsu', rank: 1, br: 1.0, cost: 0, class: 'light',
            desc: 'Японская модернизация Renault NC-27. Усиленная броня и японский дизель.',
            stats: { armor: '22 мм', gun: '37 мм Sogekihu', engine: '75 л.с.' }
        },
        'type89': { 
            name: 'Type 89 I-Go', rank: 1, br: 1.0, cost: 400, class: 'medium', req: 'otsu',
            desc: 'Первый серийный японский средний танк. Вооружен 57-мм пушкой для поддержки пехоты.',
            stats: { armor: '17 мм', gun: '57 мм Type 90', engine: '120 л.с.' }
        },
        'ko': { 
            name: 'Renault Ko', rank: 1, br: 1.0, cost: 600, class: 'light', req: 'otsu',
            desc: 'Импортированный во Францию Renault FT-17 на службе Императорской армии.',
            stats: { armor: '16 мм', gun: '37 мм Puteaux', engine: '39 л.с.' }
        },
        'type91': { 
            name: 'Type 91 Heavy', rank: 2, br: 2.2, cost: 3000, class: 'heavy', req: 'type89',
            desc: 'Многобашенный тяжелый танк. Имеет пулеметные башни спереди и сзади.',
            stats: { armor: '20 мм', gun: '57 мм Type 90', engine: '224 л.с.' }
        },
        'type95': { 
            name: 'Type 95 Heavy', rank: 2, br: 2.5, cost: 5000, class: 'heavy', req: 'type91',
            desc: 'Укрупненная версия Type 91 с более мощным 70-мм орудием в главной башне.',
            stats: { armor: '35 мм', gun: '70 мм Type 94', engine: '290 л.с.' }
        },
        'type100': { 
            name: 'Type 100 O-I', rank: 3, br: 3.4, cost: 30000, class: 'heavy', req: 'type95',
            desc: 'Проект сверхтяжелого танка береговой обороны. Настоящий сухопутный крейсер.',
            stats: { armor: '150 мм', gun: '105 мм Type 92', engine: '1100 л.с.' }
        },
        'type2604': { 
            name: 'Type 4 Chi-To', rank: 3, br: 3.7, cost: 60000, class: 'heavy', req: 'type100',
            desc: 'Поздний японский танк, аналог Пантеры. Длинноствольная 75-мм пушка.',
            stats: { armor: '75 мм', gun: '75 мм Type 5', engine: '400 л.с.' }
        },
        'type2605': { 
            name: 'Type 5 Chi-Ri', rank: 3, br: 3.9, cost: 100000, class: 'heavy', req: 'type2604',
            desc: 'Огромный средний танк с автоматом заряжания и встроенной 37-мм пушкой в корпусе.',
            stats: { armor: '75 мм', gun: '75 мм Type 5 Autoloader', engine: '550 л.с.' }
        }
    }
};

// --- 5. ЛОГИКА ИНТЕРФЕЙСА ---
window.selectType = (type) => {
    if (type === 'ground') {
        screenType.style.display = 'none';
        screenNation.style.display = 'flex';
        renderNationButtons();
        backBtn.style.display = 'block';
        backBtn.onclick = () => {
            screenNation.style.display = 'none';
            screenType.style.display = 'flex';
            backBtn.style.display = 'none';
        };
    }
};

window.selectNation = (nationId) => {
    if (!FULL_DB[nationId]) return alert("Ветка в разработке!");
    currentNation = nationId;
    screenNation.style.display = 'none';
    screenTree.style.display = 'flex';
    backBtn.onclick = () => {
        closePanel();
        screenTree.style.display = 'none';
        screenNation.style.display = 'flex';
        currentNation = null;
    };
    renderTechTree(nationId);
};

function renderNationButtons() {
    const grid = document.querySelector('.nations-grid');
    if(!grid) return; grid.innerHTML = '';
    NATIONS_LIST.forEach(nat => {
        const btn = document.createElement('div');
        btn.className = 'nation-btn';
        btn.innerText = nat.name;
        btn.onclick = () => selectNation(nat.id);
        grid.appendChild(btn);
    });
}

function renderTechTree(nationId) {
    treeContainer.innerHTML = ''; 
    const tanks = FULL_DB[nationId];
    const headers = [{name:'ТЯЖЕЛЫЕ', col:1}, {name:'СРЕДНИЕ', col:2}, {name:'ЛЕГКИЕ', col:3}, {name:'ПТ-САУ', col:4}];
    headers.forEach(h => {
        const title = document.createElement('div');
        title.className = 'branch-title'; title.innerText = h.name;
        title.style.gridColumn = h.col; title.style.gridRow = 1; 
        treeContainer.appendChild(title);
    });

    const colMap = { 'heavy': 1, 'medium': 2, 'light': 3, 'td': 4 };
    Object.keys(colMap).forEach(cls => {
        const colIndex = colMap[cls];
        const branchTanks = Object.entries(tanks).filter(([_, t]) => t.class === cls);
        for (let r = 1; r <= 5; r++) { 
            let rankTanks = branchTanks.filter(([_, t]) => t.rank === r);
            rankTanks.sort((a, b) => (a[1].req === b[0] ? 1 : b[1].req === a[0] ? -1 : 0));
            const rankBlock = document.createElement('div');
            rankBlock.className = 'rank-block';
            rankBlock.style.gridColumn = colIndex;
            rankBlock.style.gridRow = r + 1; 
            let html = `<div class="rank-header">РАНГ ${toRoman(r)}</div><div class="rank-content">`;
            rankTanks.forEach(([id, t]) => { html += createCardHTML(id, t, tanks, r); });
            html += `</div>`;
            rankBlock.innerHTML = html;
            treeContainer.appendChild(rankBlock);
        }
    });
}

function createCardHTML(id, t, allTanks, rank) {
    const isUnlocked = userTanks.includes(id) || t.cost === 0;
    let canResearch = (rank === 1 && !t.req);
    if (!isUnlocked && t.req) canResearch = userTanks.includes(t.req);
    if (!isUnlocked && !t.req && rank > 1) {
        const prevRank = Object.entries(allTanks).filter(([_, tank]) => tank.rank === rank - 1);
        canResearch = prevRank.some(([pid, _]) => userTanks.includes(pid));
    }
    let status = isUnlocked ? 'unlocked' : (canResearch ? 'can-research' : 'locked');
    if (t.premium) status = 'premium';
    let arrowClass = '';
    const followers = Object.entries(allTanks).filter(([_, child]) => child.req === id && child.class === t.class);
    if (followers.length > 0) {
        arrowClass = followers.some(([_, child]) => child.rank === rank) ? 'has-arrow-short' : 'has-arrow-long';
    }
    if (t.longLine) arrowClass = 'has-arrow-mega';
    if (t.midLine) arrowClass = 'has-arrow-mid';

    return `
    <div class="br-row">
        <div class="br-label">${t.br.toFixed(1)}</div>
        <div id="tank-${id}" class="wt-card ${status} ${arrowClass}" onclick="openTankInfo('${id}')">
            <div class="card-visual"><div class="class-icon"></div><span>${t.name}</span></div>
        </div>
    </div>`;
}

window.openTankInfo = function(id) {
    let data = null;
    for (const nat in FULL_DB) { if (FULL_DB[nat][id]) { data = FULL_DB[nat][id]; break; } }
    if (!data) return;

    document.getElementById('panel-name').innerText = data.name;
    document.getElementById('panel-desc').innerText = data.desc || "Описание засекречено.";
    const classNames = { 'heavy': 'ТЯЖЕЛЫЙ ТАНК', 'medium': 'СРЕДНИЙ ТАНК', 'light': 'ЛЕГКИЙ ТАНК', 'td': 'ПТ-САУ' };
    document.getElementById('panel-class').innerText = classNames[data.class] || "ТЕХНИКА";
    
    const s = data.stats || {}; 
    document.getElementById('stat-armor').innerText = s.armor || "-";
    document.getElementById('stat-gun').innerText = s.gun || "-";
    document.getElementById('stat-engine').innerText = s.engine || "-";

    const parse = (str) => { 
        if(!str) return 0;
        const m = str.match(/(\d+)/g); 
        return m ? Math.max(...m.map(Number)) : 0; 
    };
    
    document.getElementById('bar-armor').style.width = Math.min(100, Math.max(5, (parse(s.armor)/300)*100)) + "%";
    document.getElementById('bar-gun').style.width = Math.min(100, Math.max(5, (parse(s.gun)/155)*100)) + "%";
    document.getElementById('bar-engine').style.width = Math.min(100, Math.max(5, (parse(s.engine)/1200)*100)) + "%";

    const buyBtn = document.getElementById('buy-btn');
    const priceLabel = document.getElementById('panel-price');
    const isOwned = userTanks.includes(id) || data.cost === 0;

    if (isOwned) {
        priceLabel.innerText = "ИЗУЧЕНО"; priceLabel.style.color = "#00C851";
        buyBtn.innerText = "В АНГАРЕ"; buyBtn.disabled = true; buyBtn.style.background = "#333";
    } else {
        priceLabel.innerText = data.cost.toLocaleString() + " XP"; priceLabel.style.color = "#ffbb33";
        buyBtn.innerText = "ИССЛЕДОВАТЬ"; buyBtn.disabled = false; buyBtn.style.background = "linear-gradient(90deg, #ff9d00, #ffbb33)";
        buyBtn.onclick = () => buyTank(id, data.cost, data.name);
    }
    document.getElementById('tank-panel').classList.add('open');
};

async function buyTank(id, cost, name) {
    if (!currentUser) return alert("Войдите!");
    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);
    const userData = snap.data();
    if (userData.xp >= cost) {
        await updateDoc(userRef, { xp: userData.xp - cost, tanks: arrayUnion(id) });
        alert(`Куплен: ${name}`);
    } else { alert("Не хватает опыта!"); }
}

window.closePanel = () => { 
    const p = document.getElementById('tank-panel'); 
    if(p) p.classList.remove('open'); 
};

document.addEventListener('keydown', (e) => { 
    if (e.key === "Escape") closePanel(); 
});

function toRoman(num) { return {1:'I',2:'II',3:'III',4:'IV',5:'V'}[num]; }






