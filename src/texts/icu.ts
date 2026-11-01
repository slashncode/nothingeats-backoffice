import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

/** The placeholders a message uses (`{count}`, `{prize}`, plural and select arguments included). */
export function placeholders(message: string): Set<string> {
    const names = new Set<string>();
    const visit = (elements: MessageFormatElement[]) => {
        for (const element of elements) {
            if (element.type === TYPE.argument || element.type === TYPE.number || element.type === TYPE.date || element.type === TYPE.time) {
                names.add(element.value);
            }
            else if (element.type === TYPE.select || element.type === TYPE.plural) {
                names.add(element.value);
                Object.values(element.options).forEach(option => visit(option.value));
            }
            else if (element.type === TYPE.tag) {
                visit(element.children);
            }
        }
    };
    visit(parse(message, { ignoreTag: true }));
    return names;
}

/**
 * Checks an editor's override against the default wording: it must be valid ICU and use exactly
 * the default's placeholders, otherwise the shop would show `{count}` or lose a number.
 */
export function checkOverride(override: string, fallback: string | undefined): true | string {
    let mine: Set<string>;
    try {
        mine = placeholders(override);
    }
    catch (error) {
        return `Not a valid message: ${(error as Error).message}`;
    }
    if (fallback === undefined)
        return true;
    let theirs: Set<string>;
    try {
        theirs = placeholders(fallback);
    }
    catch {
        return true;
    }
    const missing = [...theirs].filter(name => !mine.has(name));
    const unknown = [...mine].filter(name => !theirs.has(name));
    if (missing.length > 0)
        return `Missing placeholders: ${missing.map(name => `{${name}}`).join(', ')}`;
    if (unknown.length > 0)
        return `Unknown placeholders: ${unknown.map(name => `{${name}}`).join(', ')}`;
    return true;
}
