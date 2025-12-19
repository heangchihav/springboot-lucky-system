(function () {
    const form = document.getElementById('loginForm');
    const errorBox = document.getElementById('loginError');
    const btn = document.getElementById('loginButton');

    if (!form) {
        return;
    }

    function getOrCreateDeviceId() {
        const key = 'device_id';
        let id = localStorage.getItem(key);
        if (!id) {
            if (window.crypto && crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                id = 'dev-' + Math.random().toString(16).slice(2) + '-' + Date.now();
            }
            localStorage.setItem(key, id);
        }
        return id;
    }

    function showError(message) {
        if (!errorBox) {
            return;
        }
        errorBox.textContent = message;
        errorBox.style.display = 'block';
    }

    function clearError() {
        if (!errorBox) {
            return;
        }
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }

    function setBusy(isBusy) {
        if (!btn) {
            return;
        }
        btn.disabled = isBusy;
        btn.textContent = isBusy ? 'Signing in...' : 'Login';
    }

    async function doLogin() {
        clearError();
        setBusy(true);

        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const username = usernameEl ? usernameEl.value : '';
        const password = passwordEl ? passwordEl.value : '';
        const deviceId = getOrCreateDeviceId();

        const controller = new AbortController();
        const timeoutId = window.setTimeout(function () {
            controller.abort();
        }, 15000);

        try {
            const resp = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password, deviceId }),
                signal: controller.signal
            });

            window.clearTimeout(timeoutId);

            if (resp.ok) {
                window.location.href = '/profile';
                return;
            }

            let msg = 'Login failed';
            try {
                const data = await resp.json();
                if (data && data.error) msg = data.error;
                if (data && data.message) msg = data.message;
            } catch (err) {
                // ignore JSON parse errors
            }
            showError(msg);
        } catch (err) {
            window.clearTimeout(timeoutId);
            if (err && (err.name === 'AbortError')) {
                showError('Login request timed out. Please try again.');
            } else {
                showError('Network error. Please try again.');
            }
        } finally {
            setBusy(false);
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        void doLogin();
    });

    if (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            void doLogin();
        });
    }
})();
