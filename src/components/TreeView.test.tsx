import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import TreeView, { TreeViewProps } from './TreeView';
import { testDocument1 as document } from '../lib/testDocuments';
import DocumentContext from './context/DocumentContext';

afterEach(cleanup);

const defaultTreeViewProps: TreeViewProps = {
  width: 500,
  height: 500,
  selected: undefined,
  setSelected: jest.fn(),
  searchString: '',
};

test('TreeView component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <TreeView {...defaultTreeViewProps} />
    </DocumentContext.Provider>,
  );
});
