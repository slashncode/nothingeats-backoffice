import { ValidationError } from 'payload';
import { describe, expect, it } from 'vitest';

import { image, texts } from '../src/publishing';

describe('event snapshots', () => {
    it('carries both languages, trimmed', () => {
        expect(texts({ de: ' Pizza ', en: 'Pizza' }, 'section')).toEqual({ de: 'Pizza', en: 'Pizza' });
    });

    it('refuses a snapshot with a language that is not published', () => {
        expect(() => texts({ de: 'Pizza', en: null }, 'section', 'dishes')).toThrow(ValidationError);
        try {
            texts({ de: '  ', en: 'Pizza' }, 'section');
            expect.unreachable();
        }
        catch (error) {
            expect((error as ValidationError).data.errors[0]).toEqual({
                path: 'section',
                message: 'Not published in: de. The shop needs every language; publish all languages.',
            });
        }
    });

    it('turns an upload into public URLs, the English alt text falling back to the German one', () => {
        expect(image({
            url: '/media/1/burger.png',
            width: 1200,
            height: 800,
            focalX: 50,
            focalY: 40,
            alt: { de: 'Ein Burger', en: null },
            variants: {
                card: { url: '/media/1/burger-640x400.png' },
                wide: { url: '/media/1/burger-1280x640.png' },
            },
        })).toEqual({
            url: '/media/1/burger.png',
            cardUrl: '/media/1/burger-640x400.png',
            wideUrl: '/media/1/burger-1280x640.png',
            width: 1200,
            height: 800,
            focalX: 50,
            focalY: 40,
            alt: { de: 'Ein Burger', en: 'Ein Burger' },
        });
        expect(image(null)).toBeNull();
        expect(image('a-bare-id')).toBeNull();
    });
});
