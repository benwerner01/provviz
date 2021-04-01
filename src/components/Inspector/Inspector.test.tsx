import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Inspector, { InspectorProps } from '.';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';

afterEach(cleanup);

const defaultInspectorProps: InspectorProps = {
  displaySettings: true,
  setDisplaySettings: jest.fn(),
  contentHeight: 500,
  setContentHeight: jest.fn(),
  selected: undefined,
  setSelected: jest.fn(),
  display: true,
  setDisplay: jest.fn(),
  open: true,
  setOpen: jest.fn(),
};

test('Inspector renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <Inspector {...defaultInspectorProps} />
    </DocumentContext.Provider>,
  );
});

describe('Inspector buttons', () => {
  test.each(['Open', 'Close'])('%s icon button toggles open', (title) => {
    const setOpen = jest.fn();

    const { getByTitle } = render(
      <Inspector {...defaultInspectorProps} open={title !== 'Open'} setOpen={setOpen} />,
    );

    fireEvent.click(getByTitle(title));

    expect(setOpen).toHaveBeenCalledWith(title === 'Open');
  });
});
