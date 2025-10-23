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
        this.swapLanguages = $('#swapLanguages');

        this.micButton = $('#micButton');
        this.copyButton = $('#copyButton');
        this.speakerButton = $('#speakerButton');


        //configuracion inicial
        this.targetLanguage.value = GoogleTranslator.DEFAULT_TARGET_LANGUAGE;
        //verificar que el usuario tiene soporte para la api de traduccion
        this.checkAPISupport()
        
    }

    checkAPISupport() {
        this.hasNativeTranslator = "Translator" in window
        this.hasNativeDetector = "LanguageDetector" in window

        if (!this.hasNativeTranslator || !this.hasNativeDetector) {
            console.log("El navegador no soporta la API de traducción y detección nativa.")
        } else {
            console.log("APIs nativas de IA disponibles.")
        }
    }

    setupEventListeners() {
        this.inputText.addEventListener('input', () => {
            this.translate()
        });

        this.sourceLanguage.addEventListener('change', () => this.translate())
        this.targetLanguage.addEventListener('change', () => this.translate())

        this.swapLanguages.addEventListener('click', () => this.swapLanguages())

    }

    debounceTranslate() {
        clearTimeout(this.translationTimeout);
        this.translationTimeout = setTimeout(() => {
            this.translate();
        }, 500);
    }

    async getTranslation(text) {

        const sourceLanguage = this.sourceLanguage.value;
        const targetLanguage = this.targetLanguage.value;

        if (sourceLanguage === targetLanguage) return text;

        const hasSupport = this.checkAPISupport();
        if (!hasSupport) {
            this.outputText.textContent = "El navegador no soporta la API de traducción nativa.";
        }

        //1. revisar o verificar si realmente tenemos soporte para la traduccion nativa
        try {
            const status = await window.Translator.availability({
                sourceLanguage,
                targetLanguage
            });
            if (status === 'unavailable') {
                throw new Error(`La traducción de ${sourceLanguage} a ${targetLanguage} no está disponible.`);
            }
        } catch (error) {
            console.error(error);

            throw new Error(`La traducción de ${sourceLanguage} a ${targetLanguage} no está disponible.`);

        }

        //2. realizar la traduccion
        const translatorKey = `${sourceLanguage}->${targetLanguage}`;


        try {
            if (!this.currentTranslator || this.currentTranslatorKey !== translatorKey) {
                this.currentTranslator = await window.Translator.create({
                    sourceLanguage,
                    targetLanguage,
                    monitor: (monitor) => {
                        monitor.addEventListener("downloadprogress", (event) => {
                            this.outputText.innerHTML = `<span class="loading">Descargando modelo de traducción... ${Math.floor(event.loaded * 100)}%</span>`;
                        });
                    }
                });
            }
            this.currentTranslatorKey = translatorKey;

            const translation = await this.currentTranslator.translate(text);
            return translation;

        } catch (error) {
            console.error(error)
            return 'Error en la traducción.';
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
    swapLanguages() {

    }


}

const googleTranslator = new GoogleTranslator();