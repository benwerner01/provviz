import React from 'react';
import { render, cleanup } from '@testing-library/react';
import NodeAutocomplete, { NodeAutocompleteProps } from './NodeAutocomplete';

afterEach(cleanup);

const defaultNodeAutocompleteProps: NodeAutocompleteProps = {
  label: 'label',
  value: null,
  variant: 'agent',
  onChange: jest.fn(),
};

test('NodeAutocomplete component renders', () => {
  render(
    <NodeAutocomplete {...defaultNodeAutocompleteProps} />,
  );
});
