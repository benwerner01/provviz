/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { Story, Meta } from '@storybook/react';
import Visualiser, { VisualiserProps } from './Visualiser';
import exampleDocument1 from '../../examples/document1.json';

export const Example1: Story<VisualiserProps> = (args) => (
  <Visualiser {...args} document={exampleDocument1} />
);

const meta: Meta<VisualiserProps> = {
  title: 'Visualiser',
  component: Visualiser,
  argTypes: {
    height: {
      name: 'height',
      defaultValue: 600,
      control: {
        type: 'range', min: 50, max: 1500, step: 50,
      },
    },
    width: {
      name: 'width',
      defaultValue: 1250,
      control: {
        type: 'range', min: 50, max: 1500, step: 50,
      },
    },
    wasmFolderURL: {
      name: 'wasmFolderURL',
      defaultValue: '/wasm',
      control: { type: 'text' },
    },
  },
};

export default meta;
