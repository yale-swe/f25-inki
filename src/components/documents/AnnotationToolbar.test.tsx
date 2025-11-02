import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import AnnotationToolbar from './AnnotationToolbar';

describe('AnnotationToolbar', () => {
  const defaultProps = {
    canCreate: true,
    onCreateHighlight: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.getSelection = jest.fn(() => ({
      removeAllRanges: jest.fn(),
      rangeCount: 0,
      toString: jest.fn(() => ''),
      getRangeAt: jest.fn()
    })) as unknown as typeof window.getSelection;
  });

  it('should not render when canCreate is false', () => {
    const { container } = render(<AnnotationToolbar {...defaultProps} canCreate={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when no selection', () => {
    const { container } = render(<AnnotationToolbar {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when selection exists and canCreate is true', () => {
    const { container } = render(<div className="document-text">This is some document text</div>);
    
    const mockElement = container.querySelector('.document-text');
    if (!mockElement) return;

    const textNode = mockElement.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.setEnd(textNode, 13);

    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => 'is some'),
      getRangeAt: jest.fn(() => range)
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    act(() => {
      render(<AnnotationToolbar {...defaultProps} />, { container });
    });

    act(() => {
      fireEvent(document, new Event('selectionchange'));
      fireEvent(document, new MouseEvent('mouseup', { bubbles: true }));
    });

    expect(screen.queryByText('Highlight')).toBeInTheDocument();
  });

  it('should call onCreateHighlight when highlight button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateHighlight = jest.fn().mockResolvedValue(undefined);

    const { container } = render(
      <div>
        <div className="document-text">This is some document text with selected text in it</div>
        <AnnotationToolbar {...defaultProps} onCreateHighlight={onCreateHighlight} />
      </div>
    );

    const mockElement = container.querySelector('.document-text');
    if (!mockElement || !mockElement.firstChild) return;

    const textNode = mockElement.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.setEnd(textNode, 17);

    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => 'is some docu'),
      getRangeAt: jest.fn(() => range)
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    act(() => {
      fireEvent(document, new Event('selectionchange'));
      fireEvent(document, new MouseEvent('mouseup', { bubbles: true }));
    });

    await waitFor(() => {
      expect(screen.queryByText('Highlight')).toBeInTheDocument();
    });

    const highlightButton = screen.getByText('Highlight');
    await user.click(highlightButton);

    await waitFor(() => {
      expect(onCreateHighlight).toHaveBeenCalled();
    });
  });

  it('should cancel selection when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveAllRanges = jest.fn();
    const mockSelection = {
      removeAllRanges: mockRemoveAllRanges,
      rangeCount: 1,
      toString: jest.fn(() => 'selected text'),
      getRangeAt: jest.fn(() => {
        const container = document.createElement('div');
        container.classList.add('document-text');
        container.textContent = 'This is some document text';
        return {
          commonAncestorContainer: container,
          getBoundingClientRect: jest.fn(() => ({
            left: 100,
            top: 200,
            right: 200,
            bottom: 220,
            width: 100,
            height: 20
          })),
          startContainer: container,
          startOffset: 0,
          endContainer: container,
          endOffset: 10
        };
      })
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    const mockElement = document.createElement('div');
    mockElement.classList.add('document-text');
    mockElement.textContent = 'This is some document text';
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    const { container } = render(<AnnotationToolbar {...defaultProps} />);

    const cancelButton = screen.getByTitle('Cancel (Esc)');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockRemoveAllRanges).toHaveBeenCalled();
      expect(container.firstChild).toBeNull();
    });
  });

  it('should cancel selection when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockRemoveAllRanges = jest.fn();
    const mockSelection = {
      removeAllRanges: mockRemoveAllRanges,
      rangeCount: 1,
      toString: jest.fn(() => 'selected text'),
      getRangeAt: jest.fn(() => {
        const container = document.createElement('div');
        container.classList.add('document-text');
        container.textContent = 'This is some document text';
        return {
          commonAncestorContainer: container,
          getBoundingClientRect: jest.fn(() => ({
            left: 100,
            top: 200,
            right: 200,
            bottom: 220,
            width: 100,
            height: 20
          })),
          startContainer: container,
          startOffset: 0,
          endContainer: container,
          endOffset: 10
        };
      })
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    const mockElement = document.createElement('div');
    mockElement.classList.add('document-text');
    mockElement.textContent = 'This is some document text';
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    render(<AnnotationToolbar {...defaultProps} />);

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(mockRemoveAllRanges).toHaveBeenCalled();
    });
  });

  it('should show creating state while highlight is being created', async () => {
    const user = userEvent.setup();
    const onCreateHighlight = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));

    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => 'selected text'),
      getRangeAt: jest.fn(() => {
        const container = document.createElement('div');
        container.classList.add('document-text');
        container.textContent = 'This is some document text';
        return {
          commonAncestorContainer: container,
          getBoundingClientRect: jest.fn(() => ({
            left: 100,
            top: 200,
            right: 200,
            bottom: 220,
            width: 100,
            height: 20
          })),
          startContainer: container,
          startOffset: 0,
          endContainer: container,
          endOffset: 10
        };
      })
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    const mockElement = document.createElement('div');
    mockElement.classList.add('document-text');
    mockElement.textContent = 'This is some document text';
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    render(<AnnotationToolbar {...defaultProps} onCreateHighlight={onCreateHighlight} />);

    const highlightButton = screen.getByText('Highlight');
    await user.click(highlightButton);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(highlightButton).toBeDisabled();
  });

  it('should ignore selection outside document-text container', () => {
    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => 'selected text'),
      getRangeAt: jest.fn(() => {
        const container = document.createElement('div');
        container.textContent = 'This is not in document-text';
        return {
          commonAncestorContainer: container,
          getBoundingClientRect: jest.fn(() => ({
            left: 100,
            top: 200,
            right: 200,
            bottom: 220,
            width: 100,
            height: 20
          })),
          startContainer: container,
          startOffset: 0,
          endContainer: container,
          endOffset: 10
        };
      })
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;
    jest.spyOn(document, 'querySelector').mockReturnValue(null);

    const { container } = render(<AnnotationToolbar {...defaultProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('should ignore empty selections', () => {
    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => '   '),
      getRangeAt: jest.fn()
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    const { container } = render(<AnnotationToolbar {...defaultProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('should handle errors when creating highlight', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const onCreateHighlight = jest.fn().mockRejectedValue(new Error('Failed to create'));

    const mockSelection = {
      removeAllRanges: jest.fn(),
      rangeCount: 1,
      toString: jest.fn(() => 'selected text'),
      getRangeAt: jest.fn(() => {
        const container = document.createElement('div');
        container.classList.add('document-text');
        container.textContent = 'This is some document text';
        return {
          commonAncestorContainer: container,
          getBoundingClientRect: jest.fn(() => ({
            left: 100,
            top: 200,
            right: 200,
            bottom: 220,
            width: 100,
            height: 20
          })),
          startContainer: container,
          startOffset: 0,
          endContainer: container,
          endOffset: 10
        };
      })
    };

    window.getSelection = jest.fn(() => mockSelection) as unknown as typeof window.getSelection;

    const mockElement = document.createElement('div');
    mockElement.classList.add('document-text');
    mockElement.textContent = 'This is some document text';
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    render(<AnnotationToolbar {...defaultProps} onCreateHighlight={onCreateHighlight} />);

    const highlightButton = screen.getByText('Highlight');
    await user.click(highlightButton);

    await waitFor(() => {
      expect(onCreateHighlight).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith('Failed to create highlight:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});

