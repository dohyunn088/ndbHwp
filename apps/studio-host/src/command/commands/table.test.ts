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

  it('applies cell background color using table:apply-cell-bg', () => {
    const setCellProperties = vi.fn();
    const getCellInfo = vi.fn((sec, ppi, ci, idx) => ({ row: idx, col: 0, rowSpan: 1, colSpan: 1 }));
    const getTableDimensions = vi.fn(() => ({ cellCount: 2 }));

    const wasm = {
      setCellProperties,
      getCellInfo,
      getTableDimensions,
    };

    const executeOperation = vi.fn((desc) => {
      if (desc.kind === 'snapshot') {
        desc.operation(wasm);
      }
    });

    const getSelectedCellRange = vi.fn(() => ({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }));
    const getCellTableContext = vi.fn(() => ({ sec: 1, ppi: 2, ci: 3 }));
    const getCursorPosition = vi.fn();
    const emit = vi.fn();

    const getInputHandler = vi.fn(() => ({
      getSelectedCellRange,
      getCellTableContext,
      executeOperation,
      getCursorPosition,
      eventBus: { emit },
    }));

    const command = tableCommands.find((item) => item.id === 'table:apply-cell-bg');
    expect(command).toBeDefined();

    command?.execute(
      { getInputHandler } as never,
      { color: '#ff0000' } as never
    );

    expect(getTableDimensions).toHaveBeenCalledWith(1, 2, 3);
    // idx 0 is inside selection (row: 0, col: 0), so it should be styled
    expect(setCellProperties).toHaveBeenCalledWith(1, 2, 3, 0, { fillType: 'solid', fillColor: '#ff0000' });
    // idx 1 is outside selection (row: 1, col: 0), so it should NOT be styled
    expect(setCellProperties).not.toHaveBeenCalledWith(1, 2, 3, 1, expect.any(Object));
  });

  it('applies cell borders using table:apply-cell-borders', () => {
    const setCellProperties = vi.fn();
    const getCellInfo = vi.fn((sec, ppi, ci, idx) => ({ row: idx, col: 0, rowSpan: 1, colSpan: 1 }));
    const getTableDimensions = vi.fn(() => ({ cellCount: 2 }));

    const wasm = {
      setCellProperties,
      getCellInfo,
      getTableDimensions,
    };

    const executeOperation = vi.fn((desc) => {
      if (desc.kind === 'snapshot') {
        desc.operation(wasm);
      }
    });

    const getSelectedCellRange = vi.fn(() => ({ startRow: 0, startCol: 0, endRow: 1, endCol: 0 }));
    const getCellTableContext = vi.fn(() => ({ sec: 1, ppi: 2, ci: 3 }));
    const getCursorPosition = vi.fn();
    const emit = vi.fn();

    const getInputHandler = vi.fn(() => ({
      getSelectedCellRange,
      getCellTableContext,
      executeOperation,
      getCursorPosition,
      eventBus: { emit },
    }));

    const command = tableCommands.find((item) => item.id === 'table:apply-cell-borders');
    expect(command).toBeDefined();

    command?.execute(
      { getInputHandler } as never,
      { direction: 'all', type: 1, width: 2, color: '#0000ff' } as never
    );

    expect(setCellProperties).toHaveBeenCalledWith(1, 2, 3, 0, {
      borderLeft: { type: 1, width: 2, color: '#0000ff' },
      borderRight: { type: 1, width: 2, color: '#0000ff' },
      borderTop: { type: 1, width: 2, color: '#0000ff' },
      borderBottom: { type: 1, width: 2, color: '#0000ff' },
    });
    expect(setCellProperties).toHaveBeenCalledWith(1, 2, 3, 1, {
      borderLeft: { type: 1, width: 2, color: '#0000ff' },
      borderRight: { type: 1, width: 2, color: '#0000ff' },
      borderTop: { type: 1, width: 2, color: '#0000ff' },
      borderBottom: { type: 1, width: 2, color: '#0000ff' },
    });
  });
});
