import type { NestedKeysStripped } from '@payloadcms/translations';
import type { Config } from 'payload';
import { de } from '@payloadcms/translations/languages/de';
import { en } from '@payloadcms/translations/languages/en';

// The admin speaks German and English like the shop; texts of our own components live here.

const backofficeEn = {
    loginIntro: 'Sign in with your NothingEats account. Only admins get in.',
    loginEmail: 'Email',
    loginPassword: 'Password',
    loginSubmit: 'Sign in',
    loginWrong: 'Email or password is wrong.',
    loginNotAdmin: 'This account is not an admin.',
    loginTooMany: 'Too many attempts. Try again later.',
    loginFailed: 'Signing in did not work. Try again.',
    logout: 'Sign out',
};

const backofficeDe: typeof backofficeEn = {
    loginIntro: 'Melde dich mit deinem NothingEats-Konto an. Nur Admins kommen rein.',
    loginEmail: 'E-Mail',
    loginPassword: 'Passwort',
    loginSubmit: 'Anmelden',
    loginWrong: 'E-Mail oder Passwort ist falsch.',
    loginNotAdmin: 'Dieses Konto ist kein Admin.',
    loginTooMany: 'Zu viele Versuche. Versuch es später noch einmal.',
    loginFailed: 'Die Anmeldung hat nicht geklappt. Versuch es noch einmal.',
    logout: 'Abmelden',
};

export const i18n: Config['i18n'] = {
    supportedLanguages: { de, en },
    fallbackLanguage: 'de',
    translations: {
        de: { backoffice: backofficeDe },
        en: { backoffice: backofficeEn },
    },
};

export interface BackofficeTranslations { backoffice: typeof backofficeEn }
export type BackofficeTranslationKeys = NestedKeysStripped<BackofficeTranslations>;
