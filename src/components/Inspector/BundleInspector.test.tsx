import React from 'react';
import { render, cleanup } from '@testing-library/react';
import BundleInspector, { BundleInspectorProps } from './BundleInspector';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';

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
