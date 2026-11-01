import * as migration_20261101_190144_initial from './20261101_190144_initial';

export const migrations = [
  {
    up: migration_20261101_190144_initial.up,
    down: migration_20261101_190144_initial.down,
    name: '20261101_190144_initial'
  },
];
