import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import sv from './locales/sv.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import no from './locales/no.json';

const resources = {
  en: { translation: en },
  sv: { translation: sv },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  nl: { translation: nl },
  pl: { translation: pl },
  pt: { translation: pt },
  da: { translation: da },
  fi: { translation: fi },
  no: { translation: no },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;