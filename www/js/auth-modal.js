// ================================================================
// AUTH MODULE — js/auth-modal.js
// Glassmorphism login/register modal — Firebase-ready
// ================================================================

// ---- State ---- (replace with firebase.auth().onAuthStateChanged later)
let isLoggedIn = false;
let currentUser = null;

// ----------------------------------------------------------------
// 1. Inject CSS (animations + component styles)
// ----------------------------------------------------------------
(function injectStyles() {
    const style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = `
        /* Overlay / card animations */
        @keyframes auth-fade-in    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes auth-fade-out   { from { opacity: 1 } to { opacity: 0 } }
        @keyframes auth-slide-up   { from { transform: translateY(52px); opacity: 0 }
                                      to   { transform: translateY(0);    opacity: 1 } }
        @keyframes auth-slide-down { from { transform: translateY(0);    opacity: 1 }
                                      to   { transform: translateY(52px); opacity: 0 } }

        #auth-overlay                    { animation: auth-fade-in  .35s ease; }
        #auth-overlay.leaving            { animation: auth-fade-out .30s ease forwards; }
        #auth-card                       { animation: auth-slide-up .45s cubic-bezier(0.34, 1.56, 0.64, 1); }
        #auth-overlay.leaving #auth-card { animation: auth-slide-down .30s ease forwards; }

        /* Inputs */
        .auth-input {
            display: block; width: 100%;
            background: rgba(255,255,255,0.10);
            border: 1px solid rgba(255,255,255,0.20);
            border-radius: 13px; padding: 13px 16px;
            color: #fff; font-size: 15px; outline: none;
            transition: border-color .2s, background .2s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.45); }
        .auth-input:focus { border-color: var(--accent); background: rgba(255,255,255,0.18); }

        /* Tabs */
        .auth-tab {
            flex: 1; padding: 8px 0; border-radius: 30px;
            font-size: 13px; font-weight: 700;
            color: rgba(255,255,255,0.50);
            cursor: pointer; transition: all .25s;
            background: transparent; border: none;
        }
        .auth-tab.active { background: var(--accent); color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.25); }

        /* Primary button */
        .auth-btn-primary {
            width: 100%; padding: 14px; border: none;
            border-radius: 14px; background: var(--accent);
            color: #fff; font-weight: 700; font-size: 14px;
            letter-spacing: .05em; text-transform: uppercase;
            cursor: pointer; transition: opacity .2s, transform .1s;
        }
        .auth-btn-primary:active { transform: scale(.97); opacity: .85; }

        /* Google button */
        .auth-btn-google {
            width: 100%; padding: 12px; border-radius: 14px;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.25);
            color: #fff; font-weight: 600; font-size: 14px;
            cursor: pointer; transition: background .2s, transform .1s;
            display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .auth-btn-google:active { transform: scale(.97); background: rgba(255,255,255,0.20); }

        /* Error messages */
        .auth-error { color: #ff6b6b; font-size: 12px; text-align: center; min-height: 16px; }

        /* ---- Toast ---- */
        #toast-container {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 9999; display: flex; flex-direction: column;
            align-items: center; gap: 8px; pointer-events: none;
        }
        @keyframes toast-in  { from { transform: translateY(-16px); opacity: 0 }
                                to   { transform: translateY(0);      opacity: 1 } }
        @keyframes toast-out { from { transform: translateY(0);      opacity: 1 }
                                to   { transform: translateY(-16px); opacity: 0 } }
        .toast {
            padding: 11px 22px; border-radius: 30px;
            font-size: 13px; font-weight: 600; color: #fff;
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            animation: toast-in .3s cubic-bezier(0.34, 1.56, 0.64, 1);
            white-space: nowrap; display: flex; align-items: center; gap: 8px;
        }
        .toast.success { background: rgba(0,201,80,0.92);  box-shadow: 0 4px 20px rgba(0,200,80,.35); }
        .toast.error   { background: rgba(255,59,48,0.92); box-shadow: 0 4px 20px rgba(255,59,48,.35); }
        .toast.info    { background: rgba(0,122,255,0.92); box-shadow: 0 4px 20px rgba(0,122,255,.35); }
        .toast.leaving { animation: toast-out .25s ease forwards; }
    `;
    document.head.appendChild(style);
})();

// ----------------------------------------------------------------
// 2. Modal HTML template
// ----------------------------------------------------------------
function _buildModalHTML() {
    return `
<div id="auth-overlay"
     class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
     style="background: linear-gradient(160deg, rgba(8,8,25,.90) 0%, rgba(0,0,0,.80) 100%);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">

  <div id="auth-card"
       class="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-7 pb-10 sm:pb-7"
       style="background: rgba(255,255,255,.10);
              backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
              border: 1px solid rgba(255,255,255,.18);
              box-shadow: 0 24px 60px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.15);">

    <!-- Brand -->
    <div class="text-center mb-6">
      <div class="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-xl"
           style="background: var(--accent);">
        <i class="fas fa-calendar-alt text-white text-xl"></i>
      </div>
      <h2 class="text-xl font-black text-white tracking-tight">Minha Agenda Pro</h2>
      <p class="text-[10px] text-white/45 mt-0.5 uppercase tracking-widest">Sua agenda profissional</p>
    </div>

    <!-- Tabs -->
    <div class="flex bg-white/10 rounded-full p-1 mb-5 gap-1">
      <button class="auth-tab active" id="auth-tab-login"    onclick="switchAuthTab('login')">Entrar</button>
      <button class="auth-tab"        id="auth-tab-register" onclick="switchAuthTab('register')">Criar Conta</button>
    </div>

    <!-- Login form -->
    <div id="auth-form-login">
      <div class="space-y-3 mb-4">
        <input type="email"    id="auth-email"    class="auth-input" placeholder="E-mail"  autocomplete="email">
        <input type="password" id="auth-password" class="auth-input" placeholder="Senha"   autocomplete="current-password">
      </div>
      <p class="auth-error mb-3" id="auth-login-error"></p>
      <button class="auth-btn-primary" onclick="handleEmailLogin()">Entrar</button>
    </div>

    <!-- Register form -->
    <div id="auth-form-register" style="display:none">
      <div class="space-y-3 mb-4">
        <input type="email"    id="auth-reg-email"    class="auth-input" placeholder="E-mail"              autocomplete="email">
        <input type="password" id="auth-reg-password" class="auth-input" placeholder="Senha (mín. 6 car.)" autocomplete="new-password">
        <input type="password" id="auth-reg-confirm"  class="auth-input" placeholder="Confirmar senha"     autocomplete="new-password">
      </div>
      <p class="auth-error mb-3" id="auth-register-error"></p>
      <button class="auth-btn-primary" onclick="handleEmailRegister()">Criar Conta</button>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-3 my-5">
      <div class="flex-1 h-px" style="background: rgba(255,255,255,.15)"></div>
      <span class="text-white/40 text-xs font-semibold">ou</span>
      <div class="flex-1 h-px" style="background: rgba(255,255,255,.15)"></div>
    </div>

    <!-- Google -->
    <button class="auth-btn-google" onclick="handleGoogleLogin()">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908C16.658 14.082 17.64 11.774 17.64 9.2z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Entrar com Google
    </button>

    <p class="text-center text-white/30 text-[10px] mt-5">Seus dados ficam seguros e protegidos.</p>
  </div>
</div>`.trim();
}

// ----------------------------------------------------------------
// 3. Toast container (injected once)
// ----------------------------------------------------------------
function _buildToastContainer() {
    if (document.getElementById('toast-container')) return;
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
}

// ----------------------------------------------------------------
// 4. Show / hide modal
// ----------------------------------------------------------------
function showAuthModal() {
    const container = document.getElementById('auth-modal-container');
    if (!container) return;
    container.innerHTML = _buildModalHTML();
}

function hideAuthModal() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.classList.add('leaving');
    setTimeout(() => {
        const container = document.getElementById('auth-modal-container');
        if (container) container.innerHTML = '';
    }, 320);
}

// ----------------------------------------------------------------
// 5. Tab switcher
// ----------------------------------------------------------------
function switchAuthTab(mode) {
    const loginForm    = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const tabLogin     = document.getElementById('auth-tab-login');
    const tabRegister  = document.getElementById('auth-tab-register');
    const isLogin      = mode === 'login';

    loginForm.style.display    = isLogin ? '' : 'none';
    registerForm.style.display = isLogin ? 'none' : '';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
}

// ----------------------------------------------------------------
// 6. Auth handlers — Integrado com Firebase Auth Real
// ----------------------------------------------------------------
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth(); // Usa a instância do Firebase já inicializada no index.html
const googleProvider = new GoogleAuthProvider();
let pendingGoogleCredential = null;

onAuthStateChanged(auth, user => {
    if (user) {
        _onLoginSuccess(user);
        return;
    }

    isLoggedIn = false;
    currentUser = null;
    _updateHeaderUI();
    showAuthModal();
});

async function handleEmailLogin() {
    const email    = (document.getElementById('auth-email')?.value ?? '').trim();
    const password = document.getElementById('auth-password')?.value ?? '';
    const errorEl  = document.getElementById('auth-login-error');

    if (!email || !password)   { errorEl.textContent = 'Preencha e-mail e senha.'; return; }
    if (!_isValidEmail(email)) { errorEl.textContent = 'E-mail inválido.'; return; }
    if (password.length < 6)   { errorEl.textContent = 'Senha com mínimo de 6 caracteres.'; return; }
    errorEl.textContent = '';

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        errorEl.textContent = _firebaseErrorMsg(err.code);
    }
}

async function handleEmailRegister() {
    const email    = (document.getElementById('auth-reg-email')?.value ?? '').trim();
    const password = document.getElementById('auth-reg-password')?.value ?? '';
    const confirm  = document.getElementById('auth-reg-confirm')?.value ?? '';
    const errorEl  = document.getElementById('auth-register-error');

    if (!email || !password || !confirm) { errorEl.textContent = 'Preencha todos os campos.'; return; }
    if (!_isValidEmail(email))          { errorEl.textContent = 'E-mail inválido.'; return; }
    if (password.length < 6)            { errorEl.textContent = 'Senha com mínimo de 6 caracteres.'; return; }
    if (password !== confirm)           { errorEl.textContent = 'As senhas não coincidem.'; return; }
    errorEl.textContent = '';

    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
        errorEl.textContent = _firebaseErrorMsg(err.code);
    }
}

async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        if (err.code === 'auth/account-exists-with-different-credential') {
            pendingGoogleCredential = GoogleAuthProvider.credentialFromError(err);
            switchAuthTab('login');
            document.getElementById('auth-login-error').textContent =
                'Esta conta já existe. Entre com seu e-mail e senha para vincular o acesso pelo Google.';
            return;
        }

        console.error('Erro no login com Google:', err);
        showToast(_firebaseErrorMsg(err.code), 'error');
    }
}

// ----------------------------------------------------------------
// 7. Post-login / logout
// ----------------------------------------------------------------
function _onLoginSuccess(user) {
    isLoggedIn  = true;
    currentUser = user;
    hideAuthModal();
    _updateHeaderUI();
    showToast(`Bem-vindo(a), ${user.displayName || user.email}!`, 'success');
}

function logoutUser() {
    if (!confirm('Deseja sair da sua conta?')) return;
    signOut(auth).catch(error => showToast(_firebaseErrorMsg(error.code), 'error'));
}

function _updateHeaderUI() {
    const btn = document.getElementById('btn-logout');
    if (btn) btn.classList.toggle('hidden', !isLoggedIn);
}

// ----------------------------------------------------------------
// 8. Toast — global helper (reuse anywhere in the app)
// ----------------------------------------------------------------
function showToast(message, type = 'success', duration = 2800) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] ?? 'fa-info-circle'}"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 260);
    }, duration);
}

// ----------------------------------------------------------------
// 9. Utilities
// ----------------------------------------------------------------
function _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Reserved for Firebase error code mapping
function _firebaseErrorMsg(code) {
    const map = {
        'auth/user-not-found':    'Usuário não encontrado.',
        'auth/wrong-password':    'Senha incorreta.',
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/invalid-email':     'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    };
    return map[code] ?? 'Erro de autenticação. Tente novamente.';
}

// ----------------------------------------------------------------
// 10. Boot
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    _buildToastContainer();
});

Object.assign(window, {
    switchAuthTab,
    handleEmailLogin,
    handleEmailRegister,
    handleGoogleLogin,
    logoutUser,
});
