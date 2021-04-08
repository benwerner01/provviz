import React, { SetStateAction } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import MenuBar, { MenuBarProps } from './MenuBar';
import DocumentContext from './context/DocumentContext';
import { NodeVariant, PROVJSONDocument } from '../lib/definition/document';

afterEach(cleanup);

const defaultMenuBarProps: MenuBarProps = {
  displaySettings: jest.fn(),
  isEmptyDocument: false,
  collapseButtons: false,
  collapseIconButtons: false,
  setSelected: jest.fn(),
  currentView: 'Graph',
  setCurrentView: jest.fn(),
  downloadVisualisation: jest.fn(),
  searching: false,
  setSearching: jest.fn(),
  searchString: '',
  setSearchString: jest.fn(),
};

const createButtonVariants: (NodeVariant | 'bundle')[] = ['entity', 'activity', 'agent', 'bundle'];

describe('MenuBar buttons', () => {
  test.each(createButtonVariants)('create %s button creates the variant', (variant) => {
    const document: PROVJSONDocument = {
      prefix: { default: 'value' },
      agent: {
        Agent: {},
      },
      entity: {
        Entity: {},
      },
      activity: {
        Activity: {},
      },
      bundle: {
        Bundle: {},
      },
    };

    const setDocument = jest.fn();
    const setSelected = jest.fn();

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
        <MenuBar {...defaultMenuBarProps} setSelected={setSelected} />
      </DocumentContext.Provider>,
    );

    const capitalisedVariant = variant.slice(0, 1).toUpperCase() + variant.slice(1);

    fireEvent.click(getByRole('button', { name: new RegExp(capitalisedVariant, 'g') }));

    const id = `${capitalisedVariant}1`;

    expect(setDocument).toHaveBeenCalledWith({
      ...document,
      [variant]: { ...document[variant], [id]: {} },
    });
    expect(setSelected).toHaveBeenCalledWith({ variant, id });
  });

  test.each(createButtonVariants)('collapsed create %s button creates the variant', (variant) => {
    const document: PROVJSONDocument = {
      prefix: { default: 'value' },
      agent: {
        Agent: {},
      },
      entity: {
        Entity: {},
      },
      activity: {
        Activity: {},
      },
      bundle: {
        Bundle: {},
      },
    };

    const setDocument = jest.fn();
    const setSelected = jest.fn();

    const { getByText, getByRole } = render(
      <DocumentContext.Provider
        value={{
          document,
          setDocument: (action: SetStateAction<PROVJSONDocument>) => {
            if (typeof action === 'function') setDocument(action(document));
            else setDocument(action);
          },
        }}
      >
        <MenuBar {...defaultMenuBarProps} collapseButtons setSelected={setSelected} />
      </DocumentContext.Provider>,
    );

    const capitalisedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    if (variant === 'agent') {
      fireEvent.click(getByRole('button', { name: new RegExp(capitalisedVariant, 'g') }));
    } else {
      fireEvent.click(getByText('Dropdown'));
      fireEvent.click(getByRole('menuitem', { name: new RegExp(capitalisedVariant, 'g') }));
      fireEvent.click(getByRole('button', { name: new RegExp(capitalisedVariant, 'g') }));
    }

    const id = `${capitalisedVariant}1`;

    expect(setDocument).toHaveBeenCalledWith({
      ...document,
      [variant]: { ...document[variant], [id]: {} },
    });
    expect(setSelected).toHaveBeenCalledWith({ variant, id });
  });

  test('search icon button displays search input', () => {
    const setSearching = jest.fn();

    const { getByText } = render(
      <MenuBar {...defaultMenuBarProps} setSearching={setSearching} />,
    );

    fireEvent.click(getByText('Search'));

    expect(setSearching).toHaveBeenCalled();
  });

  test('search input searches', () => {
    const setSearchString = jest.fn();

    const { container } = render(
      <MenuBar {...defaultMenuBarProps} searching setSearchString={setSearchString} />,
    );

    const input = container.querySelector('input')!;

    expect(input).toBeTruthy();

    input.focus();

    const searchString = 'search';

    fireEvent.change(input, { target: { value: searchString } });

    expect(setSearchString).toHaveBeenCalledWith(searchString);
  });

  test('download icon button downloads visualisation', () => {
    const downloadVisualisation = jest.fn();

    const { getByText } = render(
      <MenuBar {...defaultMenuBarProps} downloadVisualisation={downloadVisualisation} />,
    );

    fireEvent.click(getByText('Download'));

    expect(downloadVisualisation).toHaveBeenCalled();
  });

  test.each(['Graph', 'Tree'])('%s View icon button opens the View', (view) => {
    const setCurrentView = jest.fn();

    const { getByText } = render(
      <MenuBar
        {...defaultMenuBarProps}
        currentView={view === 'Graph' ? 'Tree' : 'Graph'}
        setCurrentView={setCurrentView}
      />,
    );

    fireEvent.click(getByText(`${view} View`));

    expect(setCurrentView).toHaveBeenCalledWith(view);
  });

  test('settings icon button displays settings', () => {
    const displaySettings = jest.fn();

    const { getByText } = render(
      <MenuBar {...defaultMenuBarProps} displaySettings={displaySettings} />,
    );

    fireEvent.click(getByText('Settings'));

    expect(displaySettings).toHaveBeenCalled();
  });
});
