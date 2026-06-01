import { tableCommands as upstreamTableCommands } from '@upstream/command/commands/table';
import type { CommandDef, EditorContext } from '@upstream/command/types';

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
              const newProps: any = {};
              if (color === 'none' || !color) {
                newProps.fillType = 'none';
              } else {
                newProps.fillType = 'solid';
                newProps.fillColor = color;
              }
              wasm.setCellProperties(sec, ppi, ci, i, newProps);
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

            const newProps: any = {};
            const borderVal = { type, width, color };

            // Determine boundary cells
            const isLeftEdge = cellInfo.col === range.startCol;
            const isRightEdge = cellInfo.col + cellInfo.colSpan - 1 === range.endCol;
            const isTopEdge = cellInfo.row === range.startRow;
            const isBottomEdge = cellInfo.row + cellInfo.rowSpan - 1 === range.endRow;

            switch (direction) {
              case 'all':
                newProps.borderLeft = borderVal;
                newProps.borderRight = borderVal;
                newProps.borderTop = borderVal;
                newProps.borderBottom = borderVal;
                break;

              case 'none':
                newProps.borderLeft = { type: 0, width: 0, color: '#000000' };
                newProps.borderRight = { type: 0, width: 0, color: '#000000' };
                newProps.borderTop = { type: 0, width: 0, color: '#000000' };
                newProps.borderBottom = { type: 0, width: 0, color: '#000000' };
                break;

              case 'outside':
                if (isLeftEdge) newProps.borderLeft = borderVal;
                if (isRightEdge) newProps.borderRight = borderVal;
                if (isTopEdge) newProps.borderTop = borderVal;
                if (isBottomEdge) newProps.borderBottom = borderVal;
                break;

              case 'inside':
                if (!isLeftEdge) newProps.borderLeft = borderVal;
                if (!isRightEdge) newProps.borderRight = borderVal;
                if (!isTopEdge) newProps.borderTop = borderVal;
                if (!isBottomEdge) newProps.borderBottom = borderVal;
                break;

              case 'left':
                if (isLeftEdge) newProps.borderLeft = borderVal;
                break;

              case 'right':
                if (isRightEdge) newProps.borderRight = borderVal;
                break;

              case 'top':
                if (isTopEdge) newProps.borderTop = borderVal;
                break;

              case 'bottom':
                if (isBottomEdge) newProps.borderBottom = borderVal;
                break;
            }

            if (Object.keys(newProps).length > 0) {
              wasm.setCellProperties(sec, ppi, ci, i, newProps);
            }
          }
          return ih.getCursorPosition();
        }
      });
    },
  },
];

const hopCommandIds = new Set(hopTableCommands.map((command) => command.id));

export const tableCommands: CommandDef[] = [
  ...hopTableCommands,
  ...upstreamTableCommands.filter((command) => !hopCommandIds.has(command.id)),
];
