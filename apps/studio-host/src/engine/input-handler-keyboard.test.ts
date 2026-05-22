import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pasteCalls, upstreamPasteMock } = vi.hoisted(() => ({
  pasteCalls: [] as Array<{ html: string; text: string; hasInternalClipboard: boolean }>,
  upstreamPasteMock: vi.fn(function (this: { wasm: { hasInternalClipboard: () => boolean } }, event: ClipboardEvent) {
    pasteCalls.push({
      html: event.clipboardData?.getData('text/html') ?? '',
      text: event.clipboardData?.getData('text/plain') ?? '',
      hasInternalClipboard: this.wasm.hasInternalClipboard(),
    });
  }),
}));

vi.mock('@upstream/engine/input-handler-keyboard', () => ({
  onPaste: upstreamPasteMock,
}));

import { onPaste } from './input-handler-keyboard';

describe('ndbHwp keyboard paste wrapper', () => {
  beforeEach(() => {
    pasteCalls.length = 0;
    upstreamPasteMock.mockClear();
  });

  it('sanitizes blocked HTML fonts and disables stale internal clipboard for new documents', () => {
    const event = clipboardEventWithHtml(`<span style="font-family:'HY헤드라인M'">A</span>`);
    const context = {
      wasm: {
        isNewDocument: true,
        hasInternalClipboard: () => true,
        clipboardHasControl: () => true,
      },
    };

    onPaste.call(context, event);

    expect(upstreamPasteMock).toHaveBeenCalledTimes(1);
    expect(pasteCalls).toEqual([
      {
        html: `<span style="font-family:'함초롬돋움'">A</span>`,
        text: '',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('disables stale internal clipboard for new documents even when pasted HTML is already safe', () => {
    const event = clipboardEventWithHtml(`<span style="font-family:'나눔고딕'">A</span>`);
    const context = {
      wasm: {
        isNewDocument: true,
        hasInternalClipboard: () => true,
        clipboardHasControl: () => true,
      },
    };

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: `<span style="font-family:'나눔고딕'">A</span>`,
        text: '',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('preserves internal clipboard for existing documents when no paste rewrite is needed', () => {
    const event = clipboardEventWithHtml(`<span style="font-family:'나눔고딕'">A</span>`);
    const context = {
      wasm: {
        isNewDocument: false,
        hasInternalClipboard: () => true,
        clipboardHasControl: () => true,
      },
    };

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: `<span style="font-family:'나눔고딕'">A</span>`,
        text: '',
        hasInternalClipboard: true,
      },
    ]);
  });

  it('normalizes Windows plain text line endings without adding a trailing paragraph', () => {
    const event = clipboardEventWithData({
      'text/plain': 'A\r\nB\r\n',
    });
    const context = existingDocumentContext();

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '',
        text: 'A\nB',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('preserves an intentional trailing blank line in plain text', () => {
    const event = clipboardEventWithData({
      'text/plain': 'A\r\n\r\n',
    });
    const context = existingDocumentContext();

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '',
        text: 'A\n\n',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('normalizes Windows HTML fragment whitespace before upstream paste parsing', () => {
    const event = clipboardEventWithData({
      'text/html': '<html><body><!--StartFragment--><p>\r\n<span>A</span>\r\n</p><!--EndFragment--></body></html>',
      'text/plain': 'A\r\n',
    });
    const context = existingDocumentContext();

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '<html><body><!--StartFragment--><p><span>A</span></p><!--EndFragment--></body></html>',
        text: 'A',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('does not trim HTML text spaces that are not line-break indentation', () => {
    const event = clipboardEventWithData({
      'text/html': '<p> A </p>',
    });
    const context = existingDocumentContext();

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '<p> A </p>',
        text: '',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('routes plain text paragraph paste away from internal and HTML paste paths', () => {
    const event = clipboardEventWithData({
      'text/html': '<html><body><!--StartFragment--><p style="margin:0;"><span>A</span></p><p style="margin:0;"><span>B</span></p><!--EndFragment--></body></html>',
      'text/plain': 'A\n\nB',
    });
    const context = {
      wasm: {
        isNewDocument: false,
        hasInternalClipboard: () => true,
        clipboardHasControl: () => false,
      },
    };

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '',
        text: 'A\n\nB',
        hasInternalClipboard: false,
      },
    ]);
  });

  it('keeps rich HTML paste paths for tables even when plain text has newlines', () => {
    const event = clipboardEventWithData({
      'text/html': '<table><tr><td>A</td></tr></table>',
      'text/plain': 'A\nB',
    });
    const context = existingDocumentContext();

    onPaste.call(context, event);

    expect(pasteCalls).toEqual([
      {
        html: '<table><tr><td>A</td></tr></table>',
        text: 'A\nB',
        hasInternalClipboard: false,
      },
    ]);
  });
});

function clipboardEventWithHtml(html: string): ClipboardEvent {
  return clipboardEventWithData({ 'text/html': html });
}

function clipboardEventWithData(values: Record<string, string>): ClipboardEvent {
  return {
    clipboardData: {
      getData: vi.fn((type: string) => values[type] ?? ''),
      setData: vi.fn((type: string, value: string) => {
        values[type] = value;
      }),
      items: [] as unknown as DataTransferItemList,
    },
  } as unknown as ClipboardEvent;
}

function existingDocumentContext() {
  return {
    wasm: {
      isNewDocument: false,
      hasInternalClipboard: () => false,
      clipboardHasControl: () => false,
    },
  };
}
