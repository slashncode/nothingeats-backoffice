// The shop's vocabulary, the same keys as catalog, search and nothingeats-ui. New keys need code in
// those places too (labels, facets, synonyms), so editors pick from these lists.

interface Option { value: string; label: { de: string; en: string } }

function options(entries: Record<string, [de: string, en: string]>): Option[] {
    return Object.entries(entries).map(([value, [de, en]]) => ({
        value,
        label: { de, en },
    }));
}

export const CUISINES = options({
    american: ['Amerikanisch', 'American'],
    asian: ['Asiatisch', 'Asian'],
    desserts: ['Desserts', 'Desserts'],
    greek: ['Griechisch', 'Greek'],
    hawaiian: ['Hawaiianisch', 'Hawaiian'],
    indian: ['Indisch', 'Indian'],
    italian: ['Italienisch', 'Italian'],
    japanese: ['Japanisch', 'Japanese'],
});

export const DIETARY_TAGS = options({
    vegan: ['Vegan', 'Vegan'],
    vegetarian: ['Vegetarisch', 'Vegetarian'],
    gluten_free: ['Glutenfrei', 'Gluten-free'],
    lactose_free: ['Laktosefrei', 'Lactose-free'],
    halal: ['Halal', 'Halal'],
});

/** The 14 allergens that EU law requires restaurants to declare. */
export const ALLERGENS = options({
    gluten: ['Gluten', 'Gluten'],
    crustaceans: ['Krebstiere', 'Crustaceans'],
    eggs: ['Eier', 'Eggs'],
    fish: ['Fisch', 'Fish'],
    peanuts: ['Erdnüsse', 'Peanuts'],
    soybeans: ['Soja', 'Soybeans'],
    milk: ['Milch', 'Milk'],
    nuts: ['Schalenfrüchte', 'Nuts'],
    celery: ['Sellerie', 'Celery'],
    mustard: ['Senf', 'Mustard'],
    sesame: ['Sesam', 'Sesame'],
    sulphites: ['Sulfite', 'Sulphites'],
    lupin: ['Lupinen', 'Lupin'],
    molluscs: ['Weichtiere', 'Molluscs'],
});

/** Cravings a dish satisfies: the vocabulary of search facets and the Craving Coach. */
export const MOODS = options({
    cheesy: ['Käsig', 'Cheesy'],
    classic: ['Klassisch', 'Classic'],
    comfort: ['Seelenfutter', 'Comfort'],
    creamy: ['Cremig', 'Creamy'],
    crispy: ['Knusprig', 'Crispy'],
    fresh: ['Frisch', 'Fresh'],
    hearty: ['Deftig', 'Hearty'],
    light: ['Leicht', 'Light'],
    salty: ['Salzig', 'Salty'],
    sharable: ['Zum Teilen', 'Sharable'],
    spicy: ['Scharf', 'Spicy'],
    sweet: ['Süß', 'Sweet'],
    umami: ['Umami', 'Umami'],
});
