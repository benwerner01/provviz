import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import ColorPicker, { ColorPickerProps } from './ColorPicker';

afterEach(cleanup);

const defaultColorPicker: ColorPickerProps = {
  initialColor: '',
  onChange: jest.fn(),
};

test('ColorPicker component renders', () => {
  render(
    <ColorPicker {...defaultColorPicker} />,
  );
});
