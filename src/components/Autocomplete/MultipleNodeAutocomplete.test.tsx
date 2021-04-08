import React from 'react';
import { render, cleanup } from '@testing-library/react';
import MultipleNodeAutocomplete, { MultipleNodeAutocompleteProps } from './MultipleNodeAutocomplete';

afterEach(cleanup);

const defaultMultipleNodeAutocompleteProps: MultipleNodeAutocompleteProps = {
  label: 'label',
  value: [],
  variant: 'agent',
  onChange: jest.fn(),
  onOptionClick: jest.fn(),
};

test('MultipleNodeAutocomplete component renders', () => {
  render(
    <MultipleNodeAutocomplete {...defaultMultipleNodeAutocompleteProps} />,
  );
});
