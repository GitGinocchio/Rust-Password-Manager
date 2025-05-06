
document.addEventListener("DOMContentLoaded", () => {
    // Dati di esempio (in un'applicazione reale questi sarebbero crittografati)
    let passwords = [
        {
            id: 1,
            title: "Gmail",
            username: "utente@gmail.com",
            password: "Password123!",
            url: "https://mail.google.com",
            category: "websites",
            notes: "Account email principale",
            isFavorite: true
        },
        {
            id: 2,
            title: "Facebook",
            username: "nome.utente",
            password: "Fb@Secure456",
            url: "https://facebook.com",
            category: "websites",
            notes: "",
            isFavorite: false
        },
        {
            id: 3,
            title: "App Bancaria",
            username: "USERID2023",
            password: "B@nk!Secure789",
            url: "",
            category: "apps",
            notes: "PIN: 5432 (non salvare il PIN qui in un'app reale!)",
            isFavorite: true
        }
    ];

    // Variabili globali
    let currentPasswordId = null;
    let activeCategoryFilter = 'all';

    // Elementi DOM
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const passwordList = document.getElementById('password-list');
    const emptyState = document.getElementById('empty-state');
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const modalTitle = document.getElementById('modal-title');
    const addNewBtn = document.getElementById('add-new-btn');
    const savePasswordBtn = document.getElementById('save-password');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalCancelBtn = document.querySelector('.modal-cancel');
    const searchInput = document.getElementById('search-input');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const masterPasswordInput = document.getElementById('master-password');
    const generateBtn = document.getElementById('generate-btn');
    const passwordLengthSlider = document.getElementById('password-length');
    const passwordLengthValue = document.getElementById('length-value');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // Gestione login
    loginBtn.addEventListener('click', () => {
        const masterPassword = masterPasswordInput.value;
        
        if (masterPassword.length < 4) {
            showToast('La password master deve essere di almeno 4 caratteri', 'error');
            return;
        }
        
        // In un'app reale, qui ci sarebbe logica di autenticazione
        // Per questo demo, accettiamo qualsiasi password con almeno 4 caratteri
        loginSection.classList.remove('active-section');
        loginSection.classList.add('hidden-section');
        
        dashboardSection.classList.remove('hidden-section');
        dashboardSection.classList.add('active-section');
        
        renderPasswordList();
    });

    // Gestione logout
    logoutBtn.addEventListener('click', () => {
        dashboardSection.classList.remove('active-section');
        dashboardSection.classList.add('hidden-section');
        
        loginSection.classList.remove('hidden-section');
        loginSection.classList.add('active-section');
        
        masterPasswordInput.value = '';
    });

    // Toggle visualizzazione password
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const passwordField = button.parentElement.querySelector('input');
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordField.type = 'password';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });

    // Gestione slider generatore password
    passwordLengthSlider.addEventListener('input', () => {
        passwordLengthValue.textContent = `${passwordLengthSlider.value} caratteri`;
    });

    // Gestione generatore di password
    generateBtn.addEventListener('click', () => {
        const length = parseInt(passwordLengthSlider.value);
        const includeUppercase = document.getElementById('include-uppercase').checked;
        const includeNumbers = document.getElementById('include-numbers').checked;
        const includeSymbols = document.getElementById('include-symbols').checked;
        
        const password = generatePassword(length, includeUppercase, includeNumbers, includeSymbols);
        document.getElementById('password').value = password;
        
        // Cambia temporaneamente il pulsante per mostrare feedback
        generateBtn.innerHTML = '<i class="fas fa-check"></i> Password generata!';
        generateBtn.classList.add('primary-btn');
        generateBtn.classList.remove('secondary-btn');
        
        setTimeout(() => {
            generateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Genera Password';
            generateBtn.classList.remove('primary-btn');
            generateBtn.classList.add('secondary-btn');
        }, 1500);
    });

    // Funzione per generare una password casuale
    function generatePassword(length, uppercase, numbers, symbols) {
        let chars = 'abcdefghijklmnopqrstuvwxyz';
        if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (numbers) chars += '0123456789';
        if (symbols) chars += '!@#$%^&*()_+[]{}|;:,.<>?';
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return password;
    }

    // Gestione ricerca
    searchInput.addEventListener('input', () => {
        renderPasswordList();
    });

    // Gestione filtri categorie
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategoryFilter = btn.dataset.category;
            renderPasswordList();
        });
    });

    // Rendering della lista password
    function renderPasswordList() {
        // Filtraggio password
        let filteredPasswords = [...passwords];
        
        // Filtro per categorie
        if (activeCategoryFilter !== 'all') {
            if (activeCategoryFilter === 'favorites') {
                filteredPasswords = filteredPasswords.filter(p => p.isFavorite);
            } else {
                filteredPasswords = filteredPasswords.filter(p => p.category === activeCategoryFilter);
            }
        }
        
        // Filtro per ricerca
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredPasswords = filteredPasswords.filter(p => 
                p.title.toLowerCase().includes(searchTerm) || 
                p.username.toLowerCase().includes(searchTerm) ||
                (p.url && p.url.toLowerCase().includes(searchTerm))
            );
        }
        
        // Mostra stato vuoto se non ci sono password
        if (filteredPasswords.length === 0) {
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
        
        // Nascondi stato vuoto e mostra password
        emptyState.style.display = 'none';
        
        // Generazione HTML per ogni password
        passwordList.innerHTML = filteredPasswords.map(password => `
            <div class="password-item" data-id="${password.id}">
                ${password.isFavorite ? '<div class="favorite-badge"><i class="fas fa-star"></i></div>' : ''}
                
                <div class="password-icon">
                    <i class="fas fa-${password.category === 'websites' ? 'globe' : 'mobile-alt'}"></i>
                </div>
                
                <h3 class="password-title">${password.title}</h3>
                <div class="password-username">${password.username}</div>
                
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
                        <span>${password.category === 'websites' ? 'Sito Web' : 'App'}</span>
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
                                <i class="fas fa-${password.isFavorite ? 'star-half-alt' : 'star'}"></i>
                                <span>${password.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}</span>
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
        
        // Aggiungi eventi dopo che gli elementi sono stati creati
        attachPasswordItemEvents();
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
                toggle.nextElementSibling.classList.toggle('active');
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
            btn.addEventListener('click', () => {
                const passwordItem = btn.closest('.password-item');
                const id = parseInt(passwordItem.dataset.id);
                const password = passwords.find(p => p.id === id);
                
                const passwordDots = passwordItem.querySelector('.password-dots');
                const icon = btn.querySelector('i');
                
                if (passwordDots.classList.contains('showing')) {
                    // Nascondi password
                    passwordDots.textContent = '••••••••••';
                    passwordDots.classList.remove('showing');
                    icon.className = 'fas fa-eye';
                } else {
                    // Mostra password
                    passwordDots.textContent = password.password;
                    passwordDots.classList.add('showing');
                    icon.className = 'fas fa-eye-slash';
                }
            });
        });
        
        // Copia password
        document.querySelectorAll('.copy-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.closest('.password-item').dataset.id);
                const password = passwords.find(p => p.id === id);
                
                navigator.clipboard.writeText(password.password).then(() => {
                    showToast('Password copiata negli appunti!', 'success');
                    
                    // Feedback visuale sul pulsante
                    const originalIcon = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalIcon;
                    }, 1000);
                }).catch(() => {
                    showToast('Impossibile copiare la password', 'error');
                });
            });
        });
        
        // Modifica password
        document.querySelectorAll('.edit-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.closest('.password-item').dataset.id);
                openEditPasswordModal(id);
            });
        });
        
        // Elimina password
        document.querySelectorAll('.delete-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.closest('.password-item').dataset.id);
                deletePassword(id);
            });
        });
        
        // Toggle preferiti
        document.querySelectorAll('.toggle-favorite-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.closest('.password-item').dataset.id);
                toggleFavorite(id);
            });
        });
    }

    // Funzione per aprire il modal per aggiungere password
    function openAddPasswordModal() {
        modalTitle.textContent = 'Aggiungi Password';
        currentPasswordId = null;
        
        // Resetta il form
        document.getElementById('title').value = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('url').value = '';
        document.getElementById('category').value = 'websites';
        document.getElementById('notes').value = '';
        document.getElementById('is-favorite').checked = false;
        
        // Apri il modal
        passwordModal.classList.add('active');
    }

    // Funzione per aprire il modal per modificare una password
    function openEditPasswordModal(id) {
        modalTitle.textContent = 'Modifica Password';
        currentPasswordId = id;
        
        const password = passwords.find(p => p.id === id);
        
        // Compila il form con i dati della password
        document.getElementById('title').value = password.title;
        document.getElementById('username').value = password.username;
        document.getElementById('password').value = password.password;
        document.getElementById('url').value = password.url || '';
        document.getElementById('category').value = password.category;
        document.getElementById('notes').value = password.notes || '';
        document.getElementById('is-favorite').checked = password.isFavorite;
        
        // Apri il modal
        passwordModal.classList.add('active');
    }

    // Funzione per salvare la password
    function savePassword() {
        // Raccolta dati dal form
        const title = document.getElementById('title').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const url = document.getElementById('url').value;
        const category = document.getElementById('category').value;
        const notes = document.getElementById('notes').value;
        const isFavorite = document.getElementById('is-favorite').checked;
        
        // Validazione minima
        if (!title || !username || !password) {
            showToast('Compila tutti i campi obbligatori', 'warning');
            return;
        }
        
        if (currentPasswordId === null) {
            // Creazione nuovo record
            const newId = passwords.length > 0 ? Math.max(...passwords.map(p => p.id)) + 1 : 1;
            passwords.push({
                id: newId,
                title,
                username,
                password,
                url,
                category,
                notes,
                isFavorite
            });
            
            showToast('Password aggiunta con successo!', 'success');
        } else {
            // Modifica record esistente
            const index = passwords.findIndex(p => p.id === currentPasswordId);
            passwords[index] = {
                ...passwords[index],
                title,
                username,
                password,
                url,
                category,
                notes,
                isFavorite
            };
            
            showToast('Password aggiornata con successo!', 'success');
        }
        
        // Chiudi il modal e aggiorna la lista
        closeModal();
        renderPasswordList();
    }

    // Funzione per eliminare una password
    function deletePassword(id) {
        const password = passwords.find(p => p.id === id);
        if (confirm(`Sei sicuro di voler eliminare la password per "${password.title}"?`)) {
            passwords = passwords.filter(p => p.id !== id);
            renderPasswordList();
            showToast('Password eliminata con successo', 'success');
        }
    }

    // Funzione per impostare/rimuovere password preferita
    function toggleFavorite(id) {
        const index = passwords.findIndex(p => p.id === id);
        passwords[index].isFavorite = !passwords[index].isFavorite;
        
        renderPasswordList();
        showToast(
            passwords[index].isFavorite ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', 
            'success'
        );
    }

    // Funzione per chiudere il modal
    function closeModal() {
        passwordModal.classList.remove('active');
    }

    // Funzione per mostrare toast di notifica
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        // Imposta l'icona in base al tipo
        switch(type) {
            case 'success':
                toastIcon.className = 'fas fa-check-circle';
                break;
            case 'warning':
                toastIcon.className = 'fas fa-exclamation-circle';
                break;
            case 'error':
                toastIcon.className = 'fas fa-times-circle';
                break;
        }
        
        // Mostra il toast
        toast.classList.add('show');
        
        // Nascondi il toast dopo 3 secondi
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event listeners per i pulsanti
    addNewBtn.addEventListener('click', openAddPasswordModal);
    savePasswordBtn.addEventListener('click', savePassword);
    closeModalBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);

    // Prevenire che il click all'interno del contenuto del modal chiuda il modal
    document.querySelector('.modal-content').addEventListener('click', e => {
        e.stopPropagation();
    });

    // Chiudere il modal quando si clicca fuori dal contenuto
    passwordModal.addEventListener('click', closeModal);

    // Funzione di inizializzazione all'avvio
    function init() {
        // In un'applicazione reale, qui si farebbero controlli di persistenza
        // e verifica della presenza di dati salvati
        if (passwords.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }
    }

    // Inizializza l'app
    init();
});