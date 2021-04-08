import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import DefinedAttribute, { DefinedAttributeProps } from './DefinedAttribute';
import { testDocument1 as document } from '../lib/testDocuments';
import DocumentContext from './context/DocumentContext';
import { ATTRIBUTE_DEFINITIONS, PROVVIZ_ATTRIBUTE_DEFINITIONS } from '../lib/definition/attribute';

afterEach(cleanup);

const defaultDefinedAttributeProps: DefinedAttributeProps = {
  attribute: ATTRIBUTE_DEFINITIONS[0],
  domainID: 'prefix1:Entity',
  variant: 'entity',
};

test('DateTime DefinedAttribute component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <DefinedAttribute {...defaultDefinedAttributeProps} attribute={ATTRIBUTE_DEFINITIONS.find(({ range }) => range === 'DateTime')!} />
      </MuiPickersUtilsProvider>
    </DocumentContext.Provider>,
  );
});

test('Node DefinedAttribute component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <DefinedAttribute {...defaultDefinedAttributeProps} attribute={ATTRIBUTE_DEFINITIONS.find(({ range }) => range === 'entity')!} />
    </DocumentContext.Provider>,
  );
});

test('Color DefinedAttribute component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <DefinedAttribute {...defaultDefinedAttributeProps} attribute={PROVVIZ_ATTRIBUTE_DEFINITIONS.find(({ range }) => range === 'Color')!} />
    </DocumentContext.Provider>,
  );
});

test('Boolean DefinedAttribute component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <DefinedAttribute {...defaultDefinedAttributeProps} attribute={PROVVIZ_ATTRIBUTE_DEFINITIONS.find(({ range }) => range === 'Boolean')!} />
    </DocumentContext.Provider>,
  );
});

test('Shape DefinedAttribute component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <DefinedAttribute {...defaultDefinedAttributeProps} attribute={PROVVIZ_ATTRIBUTE_DEFINITIONS.find(({ range }) => range === 'Shape')!} />
    </DocumentContext.Provider>,
  );
});
