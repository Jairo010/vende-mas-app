import {
  needsBranchChoice,
  resolveActiveBranch,
  type UserBranch,
} from '@/core/types/company.types';

const MAIN: UserBranch = { id: 'b-1', code: 'MATRIZ', name: 'Matriz', isPrimary: true };
const NORTH: UserBranch = { id: 'b-2', code: 'NORTE', name: 'Norte', isPrimary: false };

describe('working branch', () => {
  it('uses the only branch of a single-branch user without asking', () => {
    expect(resolveActiveBranch([MAIN], null)).toBe('b-1');
    expect(needsBranchChoice([MAIN], 'b-1')).toBe(false);
  });

  it('asks a user of several branches until they choose', () => {
    expect(resolveActiveBranch([MAIN, NORTH], null)).toBeNull();
    expect(needsBranchChoice([MAIN, NORTH], null)).toBe(true);
    expect(needsBranchChoice([MAIN, NORTH], 'b-2')).toBe(false);
  });

  it('forgets a choice that is no longer one of their branches', () => {
    expect(resolveActiveBranch([MAIN, NORTH], 'b-2')).toBe('b-2');
    expect(resolveActiveBranch([MAIN, NORTH], 'b-9')).toBeNull();
  });
});
