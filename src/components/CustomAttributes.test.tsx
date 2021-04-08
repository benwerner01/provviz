import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import CustomAttributes, { CustomAttributesProps } from './CustomAttributes';
import { testDocument1 as document } from '../lib/testDocuments';
import DocumentContext from './context/DocumentContext';

afterEach(cleanup);

const defaultCustomAttributesProps: CustomAttributesProps = {
  id: 'prefix1:Entity',
  variant: 'entity',
};

test('CustomAttributes component renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <CustomAttributes {...defaultCustomAttributesProps} />
    </DocumentContext.Provider>,
  );
});
