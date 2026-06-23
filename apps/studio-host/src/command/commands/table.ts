import { tableCommands as upstreamTableCommands } from '@upstream/command/commands/table';
import type { CommandDef, EditorContext } from '@upstream/command/types';
import { CellBorderBgDialog } from '@/ui/cell-border-bg-dialog';

const canEnterCellSelection = (ctx: EditorContext) => ctx.inTable || ctx.inCellSelectionMode;

const hopTableCommands: CommandDef[] = [
  {
    id: 'table:cell-selection-enter',
    label: '셀 블록 선택',
    shortcutLabel: 'CmdOrCtrl+Alt+T',
    canExecute: canEnterCellSelection,
    execute(services) {
      services.getInputHandler()?.enterOrAdvanceCellSelectionMode();
    },
  },
  {
    id: 'table:apply-cell-bg',
    label: '셀 배경색 적용',
    canExecute: (ctx) => ctx.inCellSelectionMode || ctx.inTable,
    execute(services, params?: Record<string, unknown>) {
      const ih = services.getInputHandler();
      if (!ih || !params) return;
      const range = ih.getSelectedCellRange();
      const tableCtx = ih.getCellTableContext();
      if (!range || !tableCtx) return;

      const color = params.color as string;

      ih.executeOperation({
        kind: 'snapshot',
        operationType: 'applyCellBg',
        operation: (wasm) => {
          const { sec, ppi, ci } = tableCtx;
          const dims = wasm.getTableDimensions(sec, ppi, ci);

          for (let i = 0; i < dims.cellCount; i++) {
            const cellInfo = wasm.getCellInfo(sec, ppi, ci, i);
            const inside = cellInfo.row >= range.startRow && cellInfo.row <= range.endRow &&
              cellInfo.col >= range.startCol && cellInfo.col <= range.endCol;
            if (inside) {
              const props = wasm.getCellProperties(sec, ppi, ci, i);

              if (color === 'none' || !color) {
                props.fillType = 'none';
              } else {
                props.fillType = 'solid';
                props.fillColor = color;
                props.patternColor = '#000000';
                props.patternType = 0;
              }
              wasm.setCellProperties(sec, ppi, ci, i, props);
            }
          }
          return ih.getCursorPosition();
        }
      });
    },
  },
  {
    id: 'table:apply-cell-borders',
    label: '셀 테두리 적용',
    canExecute: (ctx) => ctx.inCellSelectionMode || ctx.inTable,
    execute(services, params?: Record<string, unknown>) {
      const ih = services.getInputHandler();
      if (!ih || !params) return;
      const range = ih.getSelectedCellRange();
      const tableCtx = ih.getCellTableContext();
      if (!range || !tableCtx) return;

      const direction = params.direction as string;
      const type = params.type as number;
      const width = params.width as number;
      const color = params.color as string;

      ih.executeOperation({
        kind: 'snapshot',
        operationType: 'applyCellBorders',
        operation: (wasm) => {
          const { sec, ppi, ci } = tableCtx;
          const dims = wasm.getTableDimensions(sec, ppi, ci);

          for (let i = 0; i < dims.cellCount; i++) {
            const cellInfo = wasm.getCellInfo(sec, ppi, ci, i);
            const inside = cellInfo.row >= range.startRow && cellInfo.row <= range.endRow &&
              cellInfo.col >= range.startCol && cellInfo.col <= range.endCol;
            if (!inside) continue;

            const props = wasm.getCellProperties(sec, ppi, ci, i);
            const borderVal = { type, width, color };

            // Determine boundary cells
            const isLeftEdge = cellInfo.col === range.startCol;
            const isRightEdge = cellInfo.col + cellInfo.colSpan - 1 === range.endCol;
            const isTopEdge = cellInfo.row === range.startRow;
            const isBottomEdge = cellInfo.row + cellInfo.rowSpan - 1 === range.endRow;

            let changed = false;
            switch (direction) {
              case 'all':
                props.borderLeft = borderVal;
                props.borderRight = borderVal;
                props.borderTop = borderVal;
                props.borderBottom = borderVal;
                changed = true;
                break;

              case 'none':
                props.borderLeft = { type: 0, width: 0, color: '#000000' };
                props.borderRight = { type: 0, width: 0, color: '#000000' };
                props.borderTop = { type: 0, width: 0, color: '#000000' };
                props.borderBottom = { type: 0, width: 0, color: '#000000' };
                changed = true;
                break;

              case 'outside':
                if (isLeftEdge) { props.borderLeft = borderVal; changed = true; }
                if (isRightEdge) { props.borderRight = borderVal; changed = true; }
                if (isTopEdge) { props.borderTop = borderVal; changed = true; }
                if (isBottomEdge) { props.borderBottom = borderVal; changed = true; }
                break;

              case 'inside':
                if (!isLeftEdge) { props.borderLeft = borderVal; changed = true; }
                if (!isRightEdge) { props.borderRight = borderVal; changed = true; }
                if (!isTopEdge) { props.borderTop = borderVal; changed = true; }
                if (!isBottomEdge) { props.borderBottom = borderVal; changed = true; }
                break;

              case 'left':
                if (isLeftEdge) { props.borderLeft = borderVal; changed = true; }
                break;

              case 'right':
                if (isRightEdge) { props.borderRight = borderVal; changed = true; }
                break;

              case 'top':
                if (isTopEdge) { props.borderTop = borderVal; changed = true; }
                break;

              case 'bottom':
                if (isBottomEdge) { props.borderBottom = borderVal; changed = true; }
                break;
            }

            if (changed) {
              wasm.setCellProperties(sec, ppi, ci, i, props);
            }
          }
          return ih.getCursorPosition();
        }
      });
    },
  },
  {
    id: 'table:border-each',
    label: '각 셀마다 적용(E)...',
    canExecute: (ctx) => ctx.inTable || ctx.inCellSelectionMode,
    execute(services) {
      const ih = services.getInputHandler();
      if (!ih) return;
      const pos = ih.getCursorPosition();
      if (pos.parentParaIndex === undefined || pos.controlIndex === undefined || pos.cellIndex === undefined) return;
      const tableCtx = { sec: pos.sectionIndex, ppi: pos.parentParaIndex, ci: pos.controlIndex };
      const range = ih.getSelectedCellRange?.() ?? null;
      const dialog = new CellBorderBgDialog(services.wasm, services.eventBus, tableCtx, pos.cellIndex, 'each', range);
      dialog.onApply = (mods, scope) => {
        ih.executeOperation({
          kind: 'snapshot',
          operationType: 'applyCellBorderBg',
          operation: (wasm) => {
            const dims = wasm.getTableDimensions(tableCtx.sec, tableCtx.ppi, tableCtx.ci);
            for (let i = 0; i < dims.cellCount; i++) {
              let inside = false;
              if (scope === 'all') {
                inside = true;
              } else if (scope === 'selected' && range) {
                const cellInfo = wasm.getCellInfo(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i);
                inside = cellInfo.row >= range.startRow && cellInfo.row <= range.endRow &&
                  cellInfo.col >= range.startCol && cellInfo.col <= range.endCol;
              } else if (i === pos.cellIndex) {
                inside = true;
              }
              if (inside) {
                const props = wasm.getCellProperties(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i);
                Object.assign(props, mods);
                wasm.setCellProperties(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i, props);
              }
            }
            return ih.getCursorPosition();
          }
        });
      };
      dialog.show();
    },
  },
  {
    id: 'table:border-one',
    label: '하나의 셀처럼 적용(Z)...',
    canExecute: (ctx) => ctx.inTable || ctx.inCellSelectionMode,
    execute(services) {
      const ih = services.getInputHandler();
      if (!ih) return;
      const pos = ih.getCursorPosition();
      if (pos.parentParaIndex === undefined || pos.controlIndex === undefined || pos.cellIndex === undefined) return;
      const tableCtx = { sec: pos.sectionIndex, ppi: pos.parentParaIndex, ci: pos.controlIndex };
      const range = ih.getSelectedCellRange?.() ?? null;
      const dialog = new CellBorderBgDialog(services.wasm, services.eventBus, tableCtx, pos.cellIndex, 'asOne', range);
      dialog.onApply = (mods, scope) => {
        ih.executeOperation({
          kind: 'snapshot',
          operationType: 'applyCellBorderBg',
          operation: (wasm) => {
            const dims = wasm.getTableDimensions(tableCtx.sec, tableCtx.ppi, tableCtx.ci);
            for (let i = 0; i < dims.cellCount; i++) {
              let inside = false;
              if (scope === 'all') {
                inside = true;
              } else if (scope === 'selected' && range) {
                const cellInfo = wasm.getCellInfo(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i);
                inside = cellInfo.row >= range.startRow && cellInfo.row <= range.endRow &&
                  cellInfo.col >= range.startCol && cellInfo.col <= range.endCol;
              } else if (i === pos.cellIndex) {
                inside = true;
              }
              if (inside) {
                const props = wasm.getCellProperties(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i);
                Object.assign(props, mods);
                wasm.setCellProperties(tableCtx.sec, tableCtx.ppi, tableCtx.ci, i, props);
              }
            }
            return ih.getCursorPosition();
          }
        });
      };
      dialog.show();
    },
  },
];

const hopCommandIds = new Set(hopTableCommands.map((command) => command.id));

export const tableCommands: CommandDef[] = [
  ...hopTableCommands,
  ...upstreamTableCommands.filter((command) => !hopCommandIds.has(command.id)),
];
