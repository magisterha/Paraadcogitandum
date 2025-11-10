document.addEventListener("DOMContentLoaded", () => {
  let pageContent; // Esta variable será rellenada por el script que carguemos

  // --- 1. DETECCIÓN DE IDIOMA (Sin cambios) ---
  const getLanguage = () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (["es", "en", "zh-tw"].includes(lang)) return lang;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh-tw") || browserLang.startsWith("zh-hant")) return "zh-tw";
    if (browserLang.startsWith("en")) return "en";
    return "es"; // Default
  };

  // --- 2. IDENTIFICADOR DE PÁGINA (Sin cambios) ---
  const pageId = document.body.id;
  if (!pageId) {
    console.error("Error: La etiqueta <body> necesita un 'id' para identificar la página.");
    return;
  }
  
  const currentLang = getLanguage();

  // --- 3. FUNCIÓN DE "PINTAR" CONTENIDO ---
  const paintPage = () => {
    if (!pageContent) {
      console.error("Error: El objeto 'pageContent' no está definido.");
      return;
    }

    // 3.1. Actualizar Título
    document.title = pageContent["page-title"] || "Para ad cogitantum";

    // 3.2. Rellenar todos los elementos 'data-i18n'
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (pageContent[key]) {
        el.innerHTML = pageContent[key];
      }
    });

    // 3.3. Rellenar el bloque de código del prompt
    const promptCodeEl = document.getElementById("prompt-code");
    if (promptCodeEl && pageContent["prompt-code"]) {
      promptCodeEl.textContent = pageContent["prompt-code"];
    }
  };

  // --- 4. FUNCIÓN DEL CAMBIADOR DE IDIOMA (Sin cambios) ---
  const updateLangSwitcher = (lang) => {
    document.querySelectorAll(".lang-switcher a").forEach(el => {
      if (el.getAttribute("data-lang") === lang) {
        const span = document.createElement("span");
        span.textContent = el.textContent;
        el.replaceWith(span);
      } else {
        el.href = `?lang=${el.getAttribute("data-lang")}`;
      }
    });
  };

  // --- 5. FUNCIÓN DE COPIAR (Modificada para usar pageContent) ---
  const initClipboard = () => {
    const copyButton = document.getElementById("copy-button");
    const promptCode = document.getElementById("prompt-code");
    if (!copyButton || !promptCode) return;

    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(promptCode.textContent).then(() => {
        const originalText = copyButton.textContent;
        const successText = pageContent["copy-success"] || "Copied!";
        copyButton.textContent = successText;
        copyButton.classList.add("copied");

        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove("copied");
        }, 2000);
      }).catch(err => {
        console.error("Error al copiar:", err);
      });
    });
  };

  // --- 6. NUEVA LÓGICA DE CARGA DINÁMICA ---
  const loadContentScript = (lang) => {
    const script = document.createElement("script");
    script.src = `assets/content/${pageId}.${lang}.js`; // Ej: assets/content/index.es.js
    
    // QUÉ HACER SI EL SCRIPT SE CARGA CON ÉXITO
    script.onload = () => {
      // La variable 'pageContent' ahora existe globalmente
      // (fue definida por el script que acabamos de cargar)
      paintPage();
      initClipboard();
    };
    
    // QUÉ HACER SI EL SCRIPT FALLA (Ej. no hay traducción de chino)
    script.onerror = () => {
      console.error(`Error al cargar ${script.src}.`);
      // Intenta cargar el idioma por defecto (español) si el que falló no era español
      if (lang !== 'es') {
        console.warn("Intentando cargar 'es' como fallback.");
        loadContentScript('es');
      }
    };
    
    document.head.appendChild(script); // Añade el <script> al <head> para cargarlo
  };

  // --- EJECUTAR TODO ---
  updateLangSwitcher(currentLang); // Actualiza los botones ES/EN/ZH
  loadContentScript(currentLang);  // Carga el contenido JS correcto
});
