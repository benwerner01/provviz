import React from 'react';
import { render, cleanup } from '@testing-library/react';
import Namespace from './Namespace';

afterEach(cleanup);

test('Namespace component renders', () => {
  render(<Namespace />);
});
