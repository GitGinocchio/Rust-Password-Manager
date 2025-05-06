


export function showToast(message : string, type = 'success') {
	const toastMessage = document.getElementById('toast-message') as HTMLInputElement;
	const toastIcon = document.getElementById('toast-icon') as HTMLElement;
	const toast = document.getElementById('toast') as HTMLElement;

	toastMessage.textContent = message;
	
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
	
	toast.classList.add('show');
	
	setTimeout(() => { toast.classList.remove('show'); }, 5000);
};

export function showSection(section : string | HTMLElement) {
    const sections = document.querySelectorAll(".active-section, .inactive-section");
    const sectionElement = typeof section === "string" ? document.getElementById(section) as HTMLElement : section;

    for (const section of sections) {
        section.classList.remove("active-section");
        section.classList.add("inactive-section");
    }

    sectionElement.classList.remove("inactive-section");
    sectionElement.classList.add("active-section");
}