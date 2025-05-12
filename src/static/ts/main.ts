import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { showSection, showToast } from './utils.ts';

// Variabili globali
let activeCategoryFilter = 'all';
let currentPasswordId = null;

async function onLogin() {
	const masterPassword = document.getElementById("login-master-password") as HTMLInputElement;

	const passwordValue = masterPassword.value.trim();

	if (passwordValue.length  < 4) {
        showToast('La password master deve essere di almeno 4 caratteri', 'error');
        return;
	}

	await invoke('login', { password : passwordValue }).then((response) => {
		if (Boolean(response)) {
			showToast("Successfully logged in!", "success");
			showSection("dashboard-section");
		}
		else {
			showToast("Password is incorrect!", "error");
		}
	});
};

async function onRegister() {
	const masterPassword = document.getElementById("register-master-password") as HTMLInputElement;
  	const confirmMasterPassword = document.getElementById("register-confirm-master-password") as HTMLInputElement;

	const passwordValue = masterPassword.value.trim();
	const confirmValue = confirmMasterPassword.value.trim();

	if (passwordValue.length  < 4) {
        showToast('La password master deve essere di almeno 4 caratteri', 'error');
        return;
	}

  	if (passwordValue !== confirmValue) {
		showToast("Le password non coincidono", "error");
		return;
  	}

	await invoke('register', { password : passwordValue }).then((response) => {
		const type = String(response);
		if (type === "successfully-registered") {
			showToast('Registrazione avvenuta con successo', 'success');
			showSection("dashboard-section");
		}
		else if (type === "already-registered") {
			showToast('Utente già registrato', 'error');
			showSection("login-section");
		}
		else {
			showToast("Errore durante la registrazione", "error");
			showSection("register-section");
		}
	});
};

async function onAddPassword() {
	const title = document.getElementById('title') as HTMLInputElement;
	const username = document.getElementById('username') as HTMLInputElement;
	const password = document.getElementById('password') as HTMLInputElement;
	const url = document.getElementById('url') as HTMLInputElement;
	const category = document.getElementById('category') as HTMLSelectElement;
	const notes = document.getElementById('notes') as HTMLInputElement;
	const favorite = document.getElementById('is-favorite') as HTMLInputElement;

	const title_value = title.value.trim();
	const password_value = password.value.trim();

	if (title_value.length == 0) { 
		showToast("You must set a title to this password", "error"); 
		return;
	}
	if (password_value.length == 0) { 
		showToast("You must type a password to save", "error"); 
		return;
	}

	await invoke("new", { 
		title : title_value, 
		username : username.value, 
		password : password_value, 
		url : url.value, 
		category : category.value,
		notes : notes.value, 
		favorite : favorite.checked
	}).then((response) => {
		console.log(response);
	});
};

function openAddPasswordModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	const modalTitle = document.getElementById('modal-title') as HTMLElement;

	modalTitle.textContent = 'Aggiungi Password';
	currentPasswordId = null;

	const title = document.getElementById('title') as HTMLInputElement;
	const username = document.getElementById('username') as HTMLInputElement;
	const password = document.getElementById('password') as HTMLInputElement;
	const url = document.getElementById('url') as HTMLInputElement;
	const category = document.getElementById('category') as HTMLSelectElement;
	const notes = document.getElementById('notes') as HTMLInputElement;
	const isFavorite = document.getElementById('is-favorite') as HTMLInputElement;

	// Resetta il form
	title.value = '';
	username.value = '';
	password.value = '';
	url.value = '';
	category.value = '';
	notes.value = '';
	isFavorite.checked = false;
	
	passwordModal.classList.add('active');
};

function closeModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	passwordModal.classList.remove('active');
};

function renderPasswordList() {
};

async function init() {
	await invoke('is_registered', {}).then((count) => {
		showSection(count === 0 ? 'register-section' : 'login-section');
	});
}
  
window.addEventListener("DOMContentLoaded", () => {
  	const loginSection = document.getElementById("login-section") as HTMLElement;
  	const registerSection = document.getElementById("register-section") as HTMLElement;
  	//const dashboardSection = document.getElementById("dashboard-section") as HTMLElement;
	const categoryButtons = document.querySelectorAll('.category-btn');
	//const gotoRegisterButton = document.getElementById("goto-register-btn") as HTMLButtonElement;
	//const gotoLoginButton = document.getElementById("goto-login-btn") as HTMLButtonElement;
  	const registerButton = document.getElementById("register-btn") as HTMLButtonElement;
  	const loginButton = document.getElementById("login-btn") as HTMLButtonElement;
	const logoutButton = document.getElementById('logout-btn') as HTMLButtonElement;
	const addNewButton = document.getElementById("add-new-btn") as HTMLButtonElement;
	const savePasswordButton = document.getElementById("save-password") as HTMLButtonElement;
	const closeModalButton = document.querySelector('.close-modal') as HTMLButtonElement;

	addNewButton.addEventListener("click", openAddPasswordModal);
	savePasswordButton.addEventListener("click", onAddPassword)
	closeModalButton.addEventListener('click', closeModal);
  	registerButton.addEventListener("click", onRegister);
	loginButton.addEventListener("click", onLogin);
	//gotoRegisterButton.addEventListener("click", () => goto("Register"));
	//gotoLoginButton.addEventListener("click", () => goto("Login"));
	
	logoutButton.addEventListener('click', () => {
		showSection(loginSection)
    });

	categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategoryFilter = btn.getAttribute('data-category') || 'all';
            renderPasswordList();
        });
    });

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const passwordField = button.parentElement?.querySelector('input') as HTMLInputElement;

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordField.type = 'password';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });

	document.addEventListener("keydown", (event: KeyboardEvent) => {
    	if (event.key !== "Enter") return;
		event.preventDefault();

		if (registerSection.classList.contains("active-section")) onRegister();
		else if (loginSection.classList.contains("active-section")) onLogin();
	});

	init();
});
