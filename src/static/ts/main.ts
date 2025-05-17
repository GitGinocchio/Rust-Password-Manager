import { invoke } from "@tauri-apps/api/core";
//import { listen } from '@tauri-apps/api/event';
import { showSection, showToast, Credential, Category } from './utils.ts';

// Variabili globali
let activeCategoryFilter = 'all';
//let currentPasswordId = null;

async function onLogin() {
	const masterPassword = document.getElementById("login-master-password") as HTMLInputElement;

	const passwordValue = masterPassword.value.trim();

	if (passwordValue.length  < 4) {
        showToast('La password master deve essere di almeno 4 caratteri', 'error');
        return;
	}

	await invoke('login', { password : passwordValue }).then((response) => {
		console.log(response);
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
	const passwordModal = document.getElementById('password-modal') as HTMLElement;

	const title = document.getElementById('title') as HTMLInputElement;
	const username = document.getElementById('username') as HTMLInputElement;
	const email = document.getElementById('email') as HTMLInputElement;
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

	const id = passwordModal.getAttribute('data-id');
	let data : { title: string; username: string; email: string; password: string; url: string; category: string; notes: string; favorite: boolean; id?: number; } = { 
		title : title_value, 
		username : username.value,
		email: email.value,
		password : password_value, 
		url : url.value, 
		category : category.value,
		notes : notes.value, 
		favorite : favorite.checked
	}

	if (id !== null) data.id = parseInt(id);


	await invoke("new", data).then(async (response) => {
		if (Boolean(response)) {
			showToast("Credentials saved successfully", "success");
			await fetchCredentials();
		}
		else {
			showToast("An error occurred while saving your credentials", "error");
		}
		passwordModal.classList.remove('active');
	});
};

function openAddPasswordModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	const modalTitle = document.getElementById('modal-title') as HTMLElement;

	modalTitle.textContent = 'Aggiungi Password';
	passwordModal.removeAttribute('data-id');
	//currentPasswordId = null;

	const title = document.getElementById('title') as HTMLInputElement;
	const username = document.getElementById('username') as HTMLInputElement;
	const email = document.getElementById('email') as HTMLInputElement;
	const password = document.getElementById('password') as HTMLInputElement;
	const url = document.getElementById('url') as HTMLInputElement;
	const category = document.getElementById('category') as HTMLSelectElement;
	const notes = document.getElementById('notes') as HTMLInputElement;
	const isFavorite = document.getElementById('is-favorite') as HTMLInputElement;

	// Resetta il form
	title.value = '';
	username.value = '';
	email.value = '';
	password.value = '';
	url.value = '';
	category.value = '';
	notes.value = '';
	isFavorite.checked = false;
	
	passwordModal.classList.add('active');
};

async function openEditPasswordModal(element : HTMLElement) {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	const modalTitle = document.getElementById('modal-title') as HTMLElement;

	modalTitle.textContent = 'Modifica Password';

	const id = parseInt(String(element.dataset.id));

	passwordModal.setAttribute('data-id', id.toString());

	const title = ["null", "undefined"].includes(String(element.dataset.title)) ? '' : String(element.dataset.title);
	const username = ["null", "undefined"].includes(String(element.dataset.username)) ? '' : String(element.dataset.username);
	const email = ["null", "undefined"].includes(String(element.dataset.email)) ? '' : String(element.dataset.email);
	const url = ["null", "undefined"].includes(String(element.dataset.url)) ? '' : String(element.dataset.url);
	const notes = ["null", "undefined"].includes(String(element.dataset.notes)) ? '' : String(element.dataset.notes);
	const category = ["null", "undefined"].includes(String(element.dataset.category)) ? '' : String(element.dataset.category);
	const favorites = element.dataset.favorites === 'true' ? true : false;

	const titleElement = document.getElementById('title') as HTMLInputElement;
	const usernameElement = document.getElementById("username") as HTMLInputElement;
	const emailElement = document.getElementById("email") as HTMLInputElement;
	const urlElement = document.getElementById("url") as HTMLInputElement;
	const notesElement = document.getElementById("notes") as HTMLInputElement;
	const categoryElement = document.getElementById("category") as HTMLInputElement;
	const favoritesElement = document.getElementById("is-favorite") as HTMLInputElement;
	const passwordElement = document.getElementById("password") as HTMLInputElement;

	await invoke('get_password', { id : id }).then((response) => {
		passwordElement.value = String(response);
	}).catch((error) => showToast(String(error), 'error'));

	titleElement.value = title;
	usernameElement.value = username;
	emailElement.value = email;
	urlElement.value = url;
	notesElement.value = notes;
	categoryElement.value = category;
	favoritesElement.checked = favorites;

	// Apri il modal
	passwordModal.classList.add('active');
};

async function copyPassword(id : Number) {
	await invoke("get_password", { id : id }).then((response) => {
		navigator.clipboard.writeText(String(response)).then(() => {
			showToast('Password copiata negli appunti!', 'success');
		}).catch(() => {
			showToast('Impossibile copiare la password', 'error');
		});
	});
}

function closeModal() {
	const passwordModal = document.getElementById('password-modal') as HTMLElement;
	passwordModal.classList.remove('active');
};

// Funzione per impostare/rimuovere password preferita
async function toggleFavorite(id : Number, isFavorite: Boolean) {
	await invoke("set_favorite", { id : id, favorite: isFavorite }).then(async (response) => {
		if (response != null) {
			showToast(String(response), 'error');
			return;
		}
		
		await fetchCredentials();
		
		showToast(!isFavorite ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti','success')
	});
}

// Funzione per eliminare una password
async function deletePassword(id : Number) {
	await invoke("delete_password",  { id : id }).then(async (response) => {
		if (!["true", "false"].includes(String(response))) {
			showToast(String(response), 'error');
			return;
		}

		await fetchCredentials()
		showToast('Password eliminata con successo', 'success');
	});
}

// Aggiungi eventi interattivi agli elementi della lista password
function attachPasswordItemEvents() {
	// Toggle menu contestuale
	document.querySelectorAll('.action-menu-toggle').forEach(toggle => {
		toggle.addEventListener('click', e => {
			e.stopPropagation();
			
			// Chiudi tutti gli altri menu aperti
			document.querySelectorAll('.context-menu.active').forEach(menu => {
				if (menu !== toggle.nextElementSibling) {
					menu.classList.remove('active');
				}
			});
			
			// Attiva/disattiva questo menu
			if (toggle.nextElementSibling) toggle.nextElementSibling.classList.toggle('active');
		});
	});
	
	// Chiudi menu contestuale quando clicchi altrove nella pagina
	document.addEventListener('click', () => {
		document.querySelectorAll('.context-menu.active').forEach(menu => {
			menu.classList.remove('active');
		});
	});

	// Mostra password
	document.querySelectorAll('.show-password-btn').forEach(btn => {
		btn.addEventListener('click',async () => {
			const closestItem = btn.closest('.password-item') as HTMLElement;
			const closestField = btn.closest('.password-field') as HTMLElement;
			const passwordDots = closestField.querySelector('.password-dots') as HTMLElement;
			const id = parseInt(String(closestItem.dataset.id));

			if (passwordDots.textContent == '••••••••••') {
				await invoke("get_password", { id : id }).then((response) => {
					passwordDots.textContent = String(response);
				});
				btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
			} else {
				passwordDots.textContent = '••••••••••';
				btn.innerHTML = '<i class="fas fa-eye"></i>';
			}
		});
	});

	// Copia Password
	document.querySelectorAll('.copy-password-btn').forEach(btn => {
		btn.addEventListener('click',async () => {
			const closestItem = btn.closest('.password-item') as HTMLElement;
			const id = parseInt(String(closestItem.dataset.id));
			
			await copyPassword(id);

			const originalIcon = btn.innerHTML;
			btn.innerHTML = '<i class="fas fa-check"></i>';
			setTimeout(() => { btn.innerHTML = originalIcon; }, 1000);
		});
	});

	// Modifica password
	document.querySelectorAll('.edit-password-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const closest = btn.closest('.password-item') as HTMLElement;
			//const id = parseInt(String(closest.dataset.id));
			openEditPasswordModal(closest);
		});
	});

	// Elimina password
	document.querySelectorAll('.delete-password-btn').forEach(btn => {
		btn.addEventListener('click',async () => {
			const closest = btn.closest('.password-item') as HTMLElement;
			const id = parseInt(String(closest.dataset.id));
			await deletePassword(id);
		});
	});

	// Toggle preferiti
	document.querySelectorAll('.toggle-favorite-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const closest = btn.closest('.password-item') as HTMLElement;
			const id = parseInt(String(closest.dataset.id));
			const favorites = closest.dataset.favorites == 'true' ? true : false;
			toggleFavorite(id, favorites);
		});
	});
}

async function fetchCredentials() {
	await invoke('get_credentials', {}).then((response) => {
		const passwordList = document.getElementById('password-list') as HTMLElement;
		const searchInput = document.getElementById('search-input') as HTMLInputElement;
		const emptyState = document.getElementById('empty-state') as HTMLElement;

		let credentials : Credential[] = JSON.parse(String(response));

		if (credentials.length > 0) {
			emptyState.style.display = 'none';
		}

        if (activeCategoryFilter !== 'all') {
            if (activeCategoryFilter === 'favorites') {
                credentials = credentials.filter(credential => credential.favorites);
            } else {
                credentials = credentials.filter(credential => credential.category === activeCategoryFilter);
            }
        }

        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            credentials = credentials.filter(p => 
                p.title.toLowerCase().includes(searchTerm) || 
                (p.username && p.username.toLowerCase().includes(searchTerm)) ||
				(p.email && p.email.toLowerCase().includes(searchTerm)) ||
				(p.notes && p.notes.toLowerCase().includes(searchTerm)) ||
                (p.url && p.url.toLowerCase().includes(searchTerm))
            );
        }

		if (credentials.length > 0) {
			emptyState.style.display = 'none';
		}
		else {
            passwordList.innerHTML = '';
            emptyState.style.display = 'flex';
            if (searchTerm || activeCategoryFilter !== 'all') {
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>Nessuna password trovata</h3>
                    <p>Nessuna corrispondenza per i filtri selezionati</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-lock"></i>
                    <h3>Nessuna password salvata</h3>
                    <p>Aggiungi la tua prima password utilizzando il pulsante "Nuovo"</p>
                `;
            }
            return;
        }

		passwordList.innerHTML = credentials.map(credential => `
            <div class="password-item" 
				data-id="${credential.id}" 
				data-favorites="${credential.favorites}" 
				data-title="${credential.title}"
				data-url="${credential.url}"
				data-username="${credential.username}"
				data-email="${credential.email}"
				data-notes="${credential.notes}"
				data-category="${credential.category}"
			>
                ${credential.favorites ? '<div class="favorite-badge"><i class="fas fa-star"></i></div>' : ''}
                
                <div class="password-icon">
                    <i class="fas fa-${credential.url !== null ? 'globe' : 'mobile-alt'}"></i>
                </div>
                
                <h3 class="password-title">${credential.title}</h3>
				${credential.url ? `<div class="password-info"><b>Url</b>: ${credential.url}</div>` : ''}
                ${credential.username ? `<div class="password-info"><b>Username</b>: ${credential.username}</div>` : ''}
				${credential.email ? `<div class="password-info"><b>Email</b>: ${credential.email}</div>` : ''}
				${credential.notes ? `<div class="password-info" title="${credential.notes}"><b>Notes</b>: ${credential.notes}</div>` : ''}
                
                <div class="password-field">
                    <div class="password-dots">••••••••••</div>
                    <div class="password-actions">
                        <button class="password-action-btn show-password-btn" title="Mostra Password">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="password-action-btn copy-password-btn" title="Copia Password">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="password-item-footer">
                    <div class="password-category">
                        <i class="fas fa-tag"></i>
                        <span>${credential.category !== null ? credential.category : "Generic"}</span>
                    </div>
                    
                    <div class="password-actions-menu">
                        <button class="password-action-btn action-menu-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        
                        <div class="context-menu">
                            <button class="context-menu-item edit-password-btn">
                                <i class="fas fa-edit"></i>
                                <span>Modifica</span>
                            </button>
                            <button class="context-menu-item toggle-favorite-btn">
                                <i class="fas fa-${credential.favorites ? 'star-half-alt' : 'star'}"></i>
                                <span>${credential.favorites ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}</span>
                            </button>
                            <button class="context-menu-item delete-password-btn">
                                <i class="fas fa-trash-alt"></i>
                                <span>Elimina</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
	});

	await invoke('get_categories', {}).then((response) => {
		const categoriesList = document.getElementById('categories') as HTMLElement;

		const categories : Category[] = JSON.parse(String(response));

		const activeCategory = categoriesList.querySelector('.active') as HTMLElement;
		const activeCategoryName = activeCategory ? activeCategory.dataset.category : 'all';

		categoriesList.innerHTML = `
			<button class="category-btn ${ "all" === activeCategoryName ? "active" : ""}" data-category="all"><i class="fas fa-layer-group"></i><span>Tutti</span></button>
			<button class="category-btn ${ "favorites" === activeCategoryName ? "active" : ""}" data-category="favorites"><i class="fas fa-star"></i><span>Preferiti</span></button>
		` + categories.map((category) =>`
			<button class="category-btn ${ category.name === activeCategoryName ? "active" : ""}" data-category="${category.name}"><i class="fas fa-tag"></i><span>${category.name}</span></button>
		`).join('');

		const categoryButtons = document.querySelectorAll('.category-btn');

		categoryButtons.forEach(btn => {
			btn.addEventListener('click',async () => {
				categoryButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				activeCategoryFilter = btn.getAttribute('data-category') || 'all';
				await fetchCredentials();
			});
    	});
	});

	attachPasswordItemEvents();
}

async function init() {
	await invoke('is_registered', {}).then(async (count) => {
		showSection(count === 0 ? 'register-section' : 'login-section');

		if (count !== 0) {
			await fetchCredentials();
		}
	});
}
  
window.addEventListener("DOMContentLoaded", () => {
  	const loginSection = document.getElementById("login-section") as HTMLElement;
  	const registerSection = document.getElementById("register-section") as HTMLElement;
  	//const dashboardSection = document.getElementById("dashboard-section") as HTMLElement;
	//const categoryButtons = document.querySelectorAll('.category-btn');
	//const gotoRegisterButton = document.getElementById("goto-register-btn") as HTMLButtonElement;
	//const gotoLoginButton = document.getElementById("goto-login-btn") as HTMLButtonElement;
  	const registerButton = document.getElementById("register-btn") as HTMLButtonElement;
  	const loginButton = document.getElementById("login-btn") as HTMLButtonElement;
	const logoutButton = document.getElementById('logout-btn') as HTMLButtonElement;
	const addNewButton = document.getElementById("add-new-btn") as HTMLButtonElement;
	const savePasswordButton = document.getElementById("save-password") as HTMLButtonElement;
	const closeModalButton = document.querySelector('.close-modal') as HTMLButtonElement;
	const cancelModalButton = document.getElementById('cancel-password') as HTMLButtonElement;
	const searchInput = document.getElementById('search-input') as HTMLInputElement;

	addNewButton.addEventListener("click", openAddPasswordModal);
	savePasswordButton.addEventListener("click", onAddPassword)
	closeModalButton.addEventListener('click', closeModal);
	cancelModalButton.addEventListener('click', closeModal);
  	registerButton.addEventListener("click", onRegister);
	loginButton.addEventListener("click", onLogin);
	//gotoRegisterButton.addEventListener("click", () => goto("Register"));
	//gotoLoginButton.addEventListener("click", () => goto("Login"));
	
	logoutButton.addEventListener('click', () => {
		showSection(loginSection)
    });

    document.querySelector('.modal-content')?.addEventListener('click', e => {
        e.stopPropagation();
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

	searchInput.addEventListener('input', () => {
        fetchCredentials();
    });

	init();
});
