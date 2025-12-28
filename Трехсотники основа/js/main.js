/* --- js/main.js (Версия: Авто-сборка) --- */

document.addEventListener("DOMContentLoaded", function() {
    console.log("Запуск скрипта Trehsotniki...");

    // 1. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ОКНА (Если его нет)
    if (!document.getElementById('auth-modal')) {
        console.log("Окно не найдено. Создаю его программно...");
        
        var modalHTML = `
        <div id="auth-modal" class="modal-overlay">
            <div class="modal-window">
                <button class="close-modal" onclick="closeModal()">✕</button>
                <div class="modal-tabs">
                    <button id="tab-login" class="active" onclick="switchTab('login')">ВХОД</button>
                    <button id="tab-register" onclick="switchTab('register')">РЕГИСТРАЦИЯ</button>
                </div>
                <form id="form-login" class="auth-form active">
                    <div class="input-group"><label>ПОЗЫВНОЙ</label><input type="text" placeholder="Никнейм"></div>
                    <div class="input-group"><label>ПАРОЛЬ</label><input type="password" placeholder="••••••••"></div>
                    <button type="submit" class="submit-btn">ВОЙТИ</button>
                </form>
                <form id="form-register" class="auth-form">
                    <div class="input-group"><label>НОВЫЙ ПОЗЫВНОЙ</label><input type="text" placeholder="Никнейм"></div>
                    <div class="input-group"><label>EMAIL</label><input type="email" placeholder="mail@example.com"></div>
                    <div class="input-group"><label>ПАРОЛЬ</label><input type="password" placeholder="••••••••"></div>
                    <button type="submit" class="submit-btn">СОЗДАТЬ</button>
                </form>
            </div>
        </div>`;

        // Вставляем этот код перед закрывающим тегом body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. ЗАПУСК АНИМАЦИЙ ПРИ СКРОЛЛЕ
    var observerOptions = { threshold: 0.1 };
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(function(el) {
        observer.observe(el);
    });

    // 3. ЗАКРЫТИЕ ПО КЛИКУ НА ФОН
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }

    // 4. БЛОКИРОВКА ПЕРЕЗАГРУЗКИ (Чтобы страница не прыгала)
    var forms = document.querySelectorAll('.auth-form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Запрос отправлен в штаб!');
            closeModal();
        });
    });
});

/* --- ФУНКЦИИ УПРАВЛЕНИЯ (СНАРУЖИ, ЧТОБЫ КНОПКИ ИХ ВИДЕЛИ) --- */

function openModal(mode) {
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('open');
        switchTab(mode);
    } else {
        console.error("Критическая ошибка: Окно не создалось!");
    }
}

function closeModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
}

function switchTab(mode) {
    var formLogin = document.getElementById('form-login');
    var formRegister = document.getElementById('form-register');
    var tabLogin = document.getElementById('tab-login');
    var tabRegister = document.getElementById('tab-register');

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
}