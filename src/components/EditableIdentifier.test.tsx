import React from 'react';
import { render, cleanup } from '@testing-library/react';
import EditableIdentifier, { EditableIdentifierProps } from './EditableIdentifier';

afterEach(cleanup);

const defaultEditableIdentifierProps: EditableIdentifierProps = {
  initialID: 'prefix:value',
};

test('EditableIdentifier component renders', () => {
  render(
    <EditableIdentifier {...defaultEditableIdentifierProps} />,
  );
});
