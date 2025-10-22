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

        this.currentTranslation = null;
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

    translate() {

        const text = this.inputText.value.trim()
        if (!text) {
            this.outputText.textContent = ''
            return
        }

        this.outputText.textContent = 'Traduciendo...';

        try {
            const sourceLanguage = this.sourceLanguage.value;
            const targetLanguage = this.targetLanguage.value;

            if (sourceLanguage === targetLanguage) {
                return this.outputText.textContent = text;
            }

            //vamos a llamar a la api de ia de tradduccion 
            setTimeout(() => {
                this.outputText.textContent = `${text} traducido`;
            }, 1000);
        } catch (error) {

        }
    }
    swapLanguages() {

    }


}

const googleTranslator = new GoogleTranslator();