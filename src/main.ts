import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';

// Variabili globali
let activeCategoryFilter = 'all';
let currentPasswordId = null;

function showToast(message : string, type = 'success') {
	const toastMessage = document.getElementById('toast-message') as HTMLInputElement | null;
	const toastIcon = document.getElementById('toast-icon');
	const toast = document.getElementById('toast');

	if (toastMessage) { toastMessage.textContent = message; }
	
	switch(type) {
		case 'success':
			if (toastIcon) { toastIcon.className = 'fas fa-check-circle'; }
			break;
		case 'warning':
			if (toastIcon) { toastIcon.className = 'fas fa-exclamation-circle'; }
			break;
		case 'error':
			if (toastIcon) { toastIcon.className = 'fas fa-times-circle'; }
			break;
	}
	
	// Mostra il toast
	toast?.classList.add('show');
	
	// Nascondi il toast dopo 5 secondi
	setTimeout(() => { toast?.classList.remove('show'); }, 5000);
};

async function onRegister() {
	const master_password = document.getElementById("register-master-password") as HTMLInputElement | null;
  	const confirm_master_password = document.getElementById("confirm-register-master-password") as HTMLInputElement | null;

	const password_value = master_password?.value.trim();
	const confirm_value = confirm_master_password?.value.trim();

	console.log(password_value, confirm_value);

	if (!password_value || password_value.length  < 4) {
        showToast('La password master deve essere di almeno 4 caratteri', 'error');
        return;
	}

  	if (password_value !== confirm_value) {
		showToast("Le password non coincidono", "error");
		return;
  	}

	await invoke('register', { password : password_value });
};

function openAddPasswordModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	const modalTitle = document.getElementById('modal-title') as HTMLElement;

	modalTitle.textContent = 'Aggiungi Password';
	currentPasswordId = null;

	console.log(currentPasswordId);

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
	category.value = 'websites';
	notes.value = '';
	isFavorite.checked = false;
	
	passwordModal.classList.add('active');
}

function closeModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	passwordModal.classList.remove('active');
}

function renderPasswordList() {

}

listen<string>('registered-successfully', () => {
	showToast('Registrazione avvenuta con successo', 'success');

	const register_section = document.getElementById("register-section");
	const dashboard_section = document.getElementById("dashboard-section");

	register_section?.classList.remove("active-section");
	register_section?.classList.add("inactive-section");

	dashboard_section?.classList.remove("inactive-section");
	dashboard_section?.classList.add("active-section");
});
  

window.addEventListener("DOMContentLoaded", () => {
  	const loginSection = document.getElementById("login-section") as HTMLElement;
  	const registerSection = document.getElementById("register-section");
  	const dashboardSection = document.getElementById("dashboard-section") as HTMLElement;
	const categoryButtons = document.querySelectorAll('.category-btn');
	const masterPasswordInput = document.getElementById('master-password') as HTMLInputElement;
  	const registerButton = document.getElementById("register-btn") as HTMLButtonElement;
  	const loginButton = document.getElementById("login-btn") as HTMLButtonElement;
	const logoutButton = document.getElementById('logout-btn') as HTMLButtonElement;
	const addNewButton = document.getElementById("add-new-btn") as HTMLButtonElement;
	const closeModalButton = document.querySelector('.close-modal') as HTMLButtonElement;


	addNewButton.addEventListener("click", openAddPasswordModal)
	closeModalButton.addEventListener('click', closeModal);
  	registerButton.addEventListener("click", onRegister);
	logoutButton.addEventListener('click', () => {
        dashboardSection.classList.remove('active-section');
        dashboardSection.classList.add('inactive-section');
        
        loginSection.classList.remove('inactive-section');
        loginSection.classList.add('active-section');
        
        masterPasswordInput.value = '';
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
            const passwordField = button.parentElement?.querySelector('input');

			if (!passwordField) return;

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

		if (registerSection?.classList.contains("active-section")) onRegister();
	});
});
