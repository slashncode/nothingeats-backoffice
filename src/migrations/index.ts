import * as migration_20261101_190144_initial from './20261101_190144_initial';
import * as migration_20261101_204339_magazine_coach_texts from './20261101_204339_magazine_coach_texts';

export const migrations = [
  {
    up: migration_20261101_190144_initial.up,
    down: migration_20261101_190144_initial.down,
    name: '20261101_190144_initial',
  },
  {
    up: migration_20261101_204339_magazine_coach_texts.up,
    down: migration_20261101_204339_magazine_coach_texts.down,
    name: '20261101_204339_magazine_coach_texts'
  },
];
