import React, { SetStateAction } from 'react';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { render, cleanup, fireEvent } from '@testing-library/react';
import RelationInspector, { RelationInspectorProps } from './RelationInspector';
import { document3 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';
import { PROVJSONDocument } from '../../lib/definition/document';

afterEach(cleanup);

const defaultRelationInspectorProps: RelationInspectorProps = {
  variant: 'used',
  id: '_:id10',
  openSections: [],
  setOpenSections: jest.fn(),
  onDelete: jest.fn(),
};

test('Relation Inspector renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <RelationInspector {...defaultRelationInspectorProps} />
      </MuiPickersUtilsProvider>
    </DocumentContext.Provider>,
  );
});

test('Relation Inspector can delete node', () => {
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
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <RelationInspector {...defaultRelationInspectorProps} />
      </MuiPickersUtilsProvider>
    </DocumentContext.Provider>,
  );

  fireEvent.click(getByRole('button', { name: 'Delete' }));

  expect(setDocument).toHaveBeenCalledWith({
    ...document,
    bundle: {
      ...document.bundle,
      'ex:bundle': {
        ...document.bundle?.['ex:bundle'],
        used: { '_:id11': { 'prov:activity': 'ex:analysis', 'prov:entity': 'ex:dataset' }, '_:id12': { 'prov:activity': 'ex:surveying', 'prov:entity': 'ex:response2' } },
      },
    },
  });
});
