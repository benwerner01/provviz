import React from 'react';
import { render, cleanup } from '@testing-library/react';
import SettingsInspector, { SettingsInspectorProps } from './SettingsInspector';
import { document1 as document } from '../../lib/examples';
import DocumentContext from '../context/DocumentContext';

afterEach(cleanup);

const defaultSettingsInspectorProps: SettingsInspectorProps = {

};

test('Settings Inspector renders', () => {
  render(
    <DocumentContext.Provider
      value={{
        document,
        setDocument: jest.fn(),
      }}
    >
      <SettingsInspector {...defaultSettingsInspectorProps} />
    </DocumentContext.Provider>,
  );
});
