import React, { SetStateAction } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import NodeInspector, { NodeInspectorProps } from './NodeInspector';
import { document3 as document } from '../../lib/examples';
import DocumentContext from '../context/DocumentContext';
import { PROVJSONDocument } from '../../lib/definition/document';

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

test('Node Inspector can delete node', () => {
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
      <NodeInspector {...defaultNodeInspectorProps} />
    </DocumentContext.Provider>,
  );

  fireEvent.click(getByRole('button', { name: 'Delete' }));

  expect(setDocument).toHaveBeenCalledWith({
    ...document,
    bundle: {
      ...document.bundle,
      'ex:bundle': {
        ...document.bundle?.['ex:bundle'],
        wasDerivedFrom: {},
        wasAttributedTo: { '_:id1': { 'prov:agent': 'ex:bob', 'prov:entity': 'ex:graph' }, '_:id13': { 'prov:agent': 'ex:patient7', 'prov:entity': 'ex:response2' }, '_:id14': { 'prov:agent': 'ex:patient4', 'prov:entity': 'ex:response1' } },
        wasGeneratedBy: { '_:id8': { 'prov:activity': 'ex:surveying', 'prov:entity': 'ex:graph' } },
        used: { '_:id10': { 'prov:activity': 'ex:surveying', 'prov:entity': 'ex:response1' }, '_:id12': { 'prov:activity': 'ex:surveying', 'prov:entity': 'ex:response2' } },
        entity: { 'ex:graph': {}, 'ex:response2': {}, 'ex:response1': {} },
      },
    },
  });
});
