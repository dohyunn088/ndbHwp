import { describe, expect, it, vi } from 'vitest';

vi.mock('@upstream/command/commands/table', () => ({
  tableCommands: [
    { id: 'table:cell-merge', label: '셀 합치기', execute: vi.fn() },
    { id: 'table:cell-split', label: '셀 나누기', execute: vi.fn() },
  ],
}));

import { tableCommands } from './table';

describe('table command overrides', () => {
  it('adds a ndbHwp-owned cell selection command that routes through the input handler', () => {
    const enterOrAdvanceCellSelectionMode = vi.fn();
    const getInputHandler = vi.fn(() => ({ enterOrAdvanceCellSelectionMode }));

    const command = tableCommands.find((item) => item.id === 'table:cell-selection-enter');
    expect(command).toBeDefined();
    expect(command?.shortcutLabel).toBe('CmdOrCtrl+Alt+T');

    command?.execute({
      getInputHandler,
    } as never);

    expect(getInputHandler).toHaveBeenCalled();
    expect(enterOrAdvanceCellSelectionMode).toHaveBeenCalled();
  });

  it('keeps upstream table commands available', () => {
    expect(tableCommands.some((item) => item.id === 'table:cell-merge')).toBe(true);
    expect(tableCommands.some((item) => item.id === 'table:cell-split')).toBe(true);
  });
});
