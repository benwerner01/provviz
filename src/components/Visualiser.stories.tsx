/* eslint-disable import/no-extraneous-dependencies */
import React, { useEffect, useState } from 'react';
import { Story, Meta } from '@storybook/react';
import Visualiser, { VisualiserProps } from './Visualiser';
import {
  document1, document2, document3, document4,
} from '../lib/examples';

const Uncontrolled: React.FC<VisualiserProps & { initialDocument: object }> = ({
  initialDocument, ...args
}) => {
  const [document, setDocument] = useState<object>(initialDocument);

  useEffect(() => {
    setTimeout(() => setDocument((prev) => ({
      ...prev,
      prefix: { ...(prev as any).prefix, best: 'value' },
    })), 5000);
  }, []);

  return (
    <Visualiser
      {...args}
      document={document}
      onChange={(change) => {
        console.log('Uncontrolled Visualiser got updated: ', change);
        setDocument(change);
      }}
    />
  );
};

export const Example1Controlled: Story<VisualiserProps> = (args) => (
  <Visualiser {...args} document={document1} onChange={null} />
);

export const Example1Uncontrolled: Story<VisualiserProps> = (args) => (
  <Uncontrolled initialDocument={document1} {...args} />
);

export const Example2: Story<VisualiserProps> = (args) => (
  <Visualiser {...args} document={document2} onChange={null} />
);

export const Example3: Story<VisualiserProps> = (args) => (
  <Visualiser {...args} document={document3} onChange={null} />
);

export const Example4: Story<VisualiserProps> = (args) => (
  <Visualiser {...args} document={document4} onChange={null} />
);

const meta: Meta<VisualiserProps> = {
  title: 'Visualiser',
  component: Visualiser,
  argTypes: {
    height: {
      name: 'height',
      defaultValue: 900,
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
