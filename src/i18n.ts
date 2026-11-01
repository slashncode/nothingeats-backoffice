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
    accountsTitle: 'Accounts',
    accountsIntro: 'The shop\'s accounts (identity). Actions take effect at once; a lock ends every session of the account.',
    accountsSearch: 'Search by email',
    accountsEmail: 'Email',
    accountsRoles: 'Roles',
    accountsCreated: 'Since',
    accountsState: 'State',
    accountsActions: 'Actions',
    accountsActive: 'Active',
    accountsUnverified: 'Not verified',
    accountsLocked: 'Locked since {{date}}',
    accountsLock: 'Lock',
    accountsUnlock: 'Unlock',
    accountsMakeAdmin: 'Make admin',
    accountsRevokeAdmin: 'Remove admin',
    accountsDelete: 'Delete',
    accountsYou: 'That\'s you',
    accountsMore: 'More',
    accountsNone: 'No accounts found.',
    accountsFailed: 'That did not work ({{code}}).',
    accountsConfirmTitle: 'Are you sure?',
    accountsConfirmLock: 'Lock {{email}}? Every session ends at once.',
    accountsConfirmGrant: 'Make {{email}} an admin?',
    accountsConfirmRevoke: 'Remove the admin role from {{email}}?',
    accountsConfirmDelete: 'Delete {{email}} for good? This cannot be undone.',
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
    accountsTitle: 'Konten',
    accountsIntro: 'Die Konten des Shops (Identity). Aktionen wirken sofort; eine Sperre beendet jede Sitzung des Kontos.',
    accountsSearch: 'Nach E-Mail suchen',
    accountsEmail: 'E-Mail',
    accountsRoles: 'Rollen',
    accountsCreated: 'Seit',
    accountsState: 'Zustand',
    accountsActions: 'Aktionen',
    accountsActive: 'Aktiv',
    accountsUnverified: 'Nicht bestätigt',
    accountsLocked: 'Gesperrt seit {{date}}',
    accountsLock: 'Sperren',
    accountsUnlock: 'Entsperren',
    accountsMakeAdmin: 'Zum Admin machen',
    accountsRevokeAdmin: 'Admin entziehen',
    accountsDelete: 'Löschen',
    accountsYou: 'Das bist du',
    accountsMore: 'Mehr',
    accountsNone: 'Keine Konten gefunden.',
    accountsFailed: 'Das hat nicht geklappt ({{code}}).',
    accountsConfirmTitle: 'Sicher?',
    accountsConfirmLock: '{{email}} sperren? Jede Sitzung endet sofort.',
    accountsConfirmGrant: '{{email}} zum Admin machen?',
    accountsConfirmRevoke: '{{email}} die Admin-Rolle entziehen?',
    accountsConfirmDelete: '{{email}} endgültig löschen? Das lässt sich nicht rückgängig machen.',
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
