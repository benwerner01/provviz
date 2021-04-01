import React from 'react';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { render, cleanup } from '@testing-library/react';
import RelationInspector, { RelationInspectorProps } from './RelationInspector';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../contexts/DocumentContext';

afterEach(cleanup);

const defaultRelationInspectorProps: RelationInspectorProps = {
  variant: 'used',
  id: '',
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
