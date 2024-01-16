/**
 * @format
 */
import App from '../App';
// Note: import explicitly to use the types shipped with jest.
import { it } from '@jest/globals';
import React from 'react';
import 'react-native';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
