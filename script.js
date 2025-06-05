document.addEventListener("DOMContentLoaded", () => {
    // Wybieramy elementy DOM
    const nav = document.querySelector("nav");
    const content = document.getElementById("content");
    const cache = new Map();
    const MAX_CACHE_SIZE = 10;

    // UI – zarządzanie interfejsem (spinner, wyświetlanie błędów)
    const UI = {
        spinner: null,
        errorContainer: null,

        init() {
            this.createSpinner();
            this.createErrorContainer();
        },

        createSpinner() {
            this.spinner = document.createElement("div");
            this.spinner.classList.add("spinner");
            this.spinner.setAttribute("aria-label", "Ładowanie");
            document.body.appendChild(this.spinner);
        },

        createErrorContainer() {
            this.errorContainer = document.createElement("div");
            this.errorContainer.id = "error-message";
            this.errorContainer.setAttribute("role", "alert");
            this.errorContainer.setAttribute("aria-live", "assertive");
            content.parentNode.insertBefore(this.errorContainer, content);
        },

        showSpinner() {
            if (this.spinner) this.spinner.style.display = "block";
        },

        hideSpinner() {
            if (this.spinner) this.spinner.style.display = "none";
        },

        displayError(message) {
            if (this.errorContainer) {
                this.errorContainer.textContent = message;
                this.errorContainer.style.display = "block";
                this.errorContainer.classList.add("error-shake");

                setTimeout(() => {
                    this.errorContainer.classList.remove("error-shake");
                }, 500);
            }
        },

        clearError() {
            if (this.errorContainer) {
                this.errorContainer.textContent = "";
                this.errorContainer.style.display = "none";
            }
        }
    };

    UI.init();

    // Funkcja pomocnicza do logowania odsłon strony (można rozszerzyć)
    const logPageView = (page) => {
        console.log(`Odwiedzono stronę: ${page}`);
    };

    // Funkcja pobierająca zawartość strony z określonym timeoutem
    const fetchPageWithTimeout = async (url, timeout = 5000) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "Cache-Control": "no-cache"
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Błąd sieci: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error("Błąd pobierania:", error);
            throw error;
        }
    };

    // Zarządzanie rozmiarem cache
    const manageCacheSize = (page) => {
        if (cache.size >= MAX_CACHE_SIZE) {
            const oldestPage = cache.keys().next().value;
            cache.delete(oldestPage);
        }
        return page;
    };

    // Obsługa nawigacji po stronach
    const handleNavigation = async (page) => {
        try {
            UI.showSpinner();
            UI.clearError();

            content.classList.add("fade-out");
            await new Promise(resolve => setTimeout(resolve, 300));

            let pageContent;

            if (cache.has(page)) {
                pageContent = cache.get(page);
            } else {
                pageContent = await fetchPageWithTimeout(page);
                manageCacheSize(page);
                cache.set(page, pageContent);
            }

            content.innerHTML = pageContent;
            content.classList.remove("fade-out");
            content.classList.add("fade-in");

            // Logowanie odsłony strony
            logPageView(page);

            setTimeout(() => content.classList.remove("fade-in"), 300);
        } catch (error) {
            UI.displayError("Nie udało się załadować treści. Sprawdź połączenie internetowe.");
            console.error("Błąd ładowania treści:", error);
        } finally {
            UI.hideSpinner();
        }
    };

    // Nasłuchiwanie kliknięć w elementy nawigacji
    nav.addEventListener("click", (e) => {
        const target = e.target;
        if (target.tagName === "A" && target.dataset.page) {
            e.preventDefault();
            const page = target.dataset.page;
            handleNavigation(page);
        }
    });

    // ----------- DODATKOWE FUNKCJONALNOŚCI ------------

    // Back-to-top button
    const backToTop = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Animacje przy przewijaniu z użyciem Intersection Observer
    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observerInstance.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    // Obserwuj wszystkie elementy oznaczone klasą "scroll-animation"
    const animElements = document.querySelectorAll(".scroll-animation");
    animElements.forEach(el => {
        observer.observe(el);
    });
});