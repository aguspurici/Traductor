import { $ } from "./dom.js";

class GoogleTranslator {
    static SUPPORTED_LANGUAGES = [
        `auto`,
        `en`,
        `es`,
        `fr`,
        `de`,
        `it`,
        `pt`,
        `ru`,
        `ja`,
        `zh`
    ]
    static FULL_LANGUAGE_NAMES = {
        es: 'es-ES',
        en: 'en-US',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT',
        ru: 'ru-RU',
        ja: 'ja-JP',
        zh: 'zh-CN'
    }

    static DEFAULT_SOURCE_LANGUAGE = 'es';
    static DEFAULT_TARGET_LANGUAGE = 'en';

    constructor() {
        this.init();
        this.setupEventListeners();

        this.translationTimeout = null;
        this.currentTranslator = null;
        this.currentTranslatorKey = null;
        this.currentDetector = null;
    }

    init() {
        //recuperamos todos los elementos del DOM que vamos a usar
        this.inputText = $('#inputText');
        this.outputText = $('#outputText');

        this.sourceLanguage = $('#sourceLanguage');
        this.targetLanguage = $('#targetLanguage');

        this.micButton = $('#micButton');
        this.copyButton = $('#copyButton');
        this.speakerButton = $('#speakerButton');
        this.swapLanguagesButton = $('#swapLanguages');

        //configuracion inicial
        this.targetLanguage.value = GoogleTranslator.DEFAULT_TARGET_LANGUAGE;

        //verificar que el usuario tiene soporte para la api de traduccion
        this.checkAPISupport()
    }

    checkAPISupport() {
        this.hasNativeTranslator = "Translator" in window;
        this.hasNativeDetector = "LanguageDetector" in window;

        if (!this.hasNativeTranslator || !this.hasNativeDetector) {
            console.warn("APIs nativas de traducción y detección de idioma NO soportadas en tu navegador.");
            this.showAPIWarning();
            return false;
        } else {
            console.log("APIs nativas de IA disponibles.");
            return true;
        }
    }

    showAPIWarning() {
        const warning = $('#apiWarning');
        warning.style.display = 'block';
    }

    setupEventListeners() {
        this.inputText.addEventListener('input', () => {
            this.debounceTranslate();
        });

        this.sourceLanguage.addEventListener('change', () => this.translate())
        this.targetLanguage.addEventListener('change', () => this.translate())

        this.swapLanguagesButton.addEventListener('click', () => this.swapLanguages())
        this.micButton.addEventListener('click', () => this.startVoiceRecognition())
        this.speakerButton.addEventListener('click', () => this.speakTranslation())
    }

    debounceTranslate() {
        clearTimeout(this.translationTimeout);
        this.translationTimeout = setTimeout(() => {
            this.translate();
        }, 500);
    }


    updateDetectedLanguage(detectedLanguage) {
        // Actualizar visualmente el idioma detectado
        const option = this.sourceLanguage.querySelector(`option[value="${detectedLanguage}"]`)

        if (option) {
            const autoOption = this.sourceLanguage.querySelector(`option[value="auto"]`)
            autoOption.textContent = `Detectar idioma (${option.textContent})`
        }
    }

    async getTranslation(text) {
        const sourceLanguage = this.sourceLanguage.value === 'auto'
            ? await this.detectLanguage(text)
            : this.sourceLanguage.value;

        const targetLanguage = this.targetLanguage.value;

        if (sourceLanguage === targetLanguage) return text;

        const translatorKey = `${sourceLanguage}-${targetLanguage}`;

        try {
            if (
                !this.currentTranslator ||
                this.currentTranslatorKey !== translatorKey
            ) {
                this.outputText.textContent = 'Cargando modelo...';

                this.currentTranslator = await window.Translator.create({
                    sourceLanguage,
                    targetLanguage,
                    monitor: (monitor) => {
                        monitor.addEventListener("downloadprogress", (e) => {
                            this.outputText.innerHTML = `<span class="loading">Descargando modelo: ${Math.floor(e.loaded * 100)}%</span>`;
                        });
                    }
                });

                // Esperar hasta que el modelo esté listo
                await this.currentTranslator.ready;
            }

            this.currentTranslatorKey = translatorKey;

            const translation = await this.currentTranslator.translate(text);
            return translation;
        } catch (error) {
            console.error(error);
            return 'Error al traducir.';
        }
    }



      async translate() {

        const text = this.inputText.value.trim()
        if (!text) {
            this.outputText.textContent = ''
            return
        }

        this.outputText.textContent = 'Traduciendo...';

        try {
            const translation = await this.getTranslation(text);
            this.outputText.textContent = translation;
        } catch (error) {
            console.error("Error durante la traducción:", error);
            this.outputText.textContent = 'Error en la traducción.';

        }
    }
    async swapLanguages() {
        // primero, detectar si source es 'auto' para saber qué idioma
        // hay que pasar al output
        if (this.sourceLanguage.value === 'auto') {
            const detectedLanguage = await this.detectLanguage(this.inputText.value)
            this.sourceLanguage.value = detectedLanguage
        }

        // intercambiar los valores
        const temporalLanguage = this.sourceLanguage.value
        this.sourceLanguage.value = this.targetLanguage.value
        this.targetLanguage.value = temporalLanguage

        // intercambiar los textos
        this.inputText.value = this.outputText.value
        this.outputText.textContent = ""


        if (this.inputText.value.trim()) {
            this.translate()
        }

        // restaurar la opción de auto-detectar
    }

    getFullLanguageCode(languageCode) {
        return GoogleTranslator.FULL_LANGUAGE_NAMES[languageCode] ?? GoogleTranslator.DEFAULT_SOURCE_LANGUAGE
    }


    async startVoiceRecognition() {
        const hasNativeRecognitionSupport = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
        if (!hasNativeRecognitionSupport) return

        const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = false

        const language = this.sourceLanguage.value === 'auto'
            ? await this.detectLanguage(this.inputText.value)
            : this.sourceLanguage.value

        recognition.lang = this.getFullLanguageCode(language)

        recognition.onstart = () => {
            this.micButton.style.backgroundColor = "var(--google-red)"
            this.micButton.style.color = "white"
        }

        recognition.onend = () => {
            this.micButton.style.backgroundColor = ""
            this.micButton.style.color = ""
        }

        recognition.onresult = (event) => {
            console.log(event.results)

            const [{ transcript }] = event.results[0]
            this.inputText.value = transcript
            this.translate()
        }

        recognition.onerror = (event) => {
            console.error('Error de reconocimiento de voz: ', event.error)
        }

        recognition.start()
    }

    speakTranslation() {
        const hasNativeSupportSynthesis = "SpeechSynthesis" in window
        if (!hasNativeSupportSynthesis) return

        const text = this.outputText.textContent
        if (!text) return

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = this.getFullLanguageCode(this.targetLanguage.value)
        utterance.rate = 0.8

        utterance.onstart = () => {
            this.speakerButton.style.backgroundColor = "var(--google-green)"
            this.speakerButton.style.color = "white"
        }

        utterance.onend = () => {
            this.speakerButton.style.backgroundColor = ""
            this.speakerButton.style.color = ""
        }

        window.speechSynthesis.speak(utterance)
    }

   async detectLanguage(text) {
  try {
    if (!this.currentDetector) {
      this.currentDetector = await window.LanguageDetector.create({
        expectedInputLanguages: GoogleTranslator.SUPPORTED_LANGUAGES.filter(lang => lang !== 'auto')
      });
    }

    const results = await this.currentDetector.detect(text);
    const detectedLanguage = results[0]?.detectedLanguage;

    return detectedLanguage === 'und'
      ? GoogleTranslator.DEFAULT_SOURCE_LANGUAGE
      : detectedLanguage;
  } catch (error) {
    console.error("No he podido averiguar el idioma: ", error);
    return GoogleTranslator.DEFAULT_SOURCE_LANGUAGE;
  }
}


}

const googleTranslator = new GoogleTranslator();