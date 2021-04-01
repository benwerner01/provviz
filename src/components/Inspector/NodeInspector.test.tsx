import React from 'react';
import { render, cleanup } from '@testing-library/react';
import NodeInspector, { NodeInspectorProps } from './NodeInspector';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';

afterEach(cleanup);

const defaultNodeInspectorProps: NodeInspectorProps = {
  variant: 'entity',
  id: 'ex:dataset',
  openSections: [],
  setOpenSections: jest.fn(),
  setSelected: jest.fn(),
  onIDChange: jest.fn(),
  onDelete: jest.fn(),
};

test('Node Inspector renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <NodeInspector {...defaultNodeInspectorProps} />
    </DocumentContext.Provider>,
  );
});
