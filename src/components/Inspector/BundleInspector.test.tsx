import React, { SetStateAction } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import BundleInspector, { BundleInspectorProps } from './BundleInspector';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';
import { PROVJSONDocument } from '../../lib/definition/document';

afterEach(cleanup);

const defaultBundleInspectorProps: BundleInspectorProps = {
  id: 'ex:bundle',
  openSections: [],
  setOpenSections: jest.fn(),
  setSelected: jest.fn(),
  onIDChange: jest.fn(),
  onDelete: jest.fn(),
};

test('Bundle Inspector renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <BundleInspector {...defaultBundleInspectorProps} />
    </DocumentContext.Provider>,
  );
});

test('Bundle Inspector can delete bundle', () => {
  const setDocument = jest.fn();

  const { getByRole } = render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: (action: SetStateAction<PROVJSONDocument>) => {
          if (typeof action === 'function') setDocument(action(document));
          else setDocument(action);
        },
      }}
    >
      <BundleInspector {...defaultBundleInspectorProps} />
    </DocumentContext.Provider>,
  );

  fireEvent.click(getByRole('button', { name: 'Delete' }));

  expect(setDocument).toHaveBeenCalledWith({
    ...document,
    bundle: {},
  });
});
