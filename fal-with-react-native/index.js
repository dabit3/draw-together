/* eslint-disable no-unused-vars */

/* eslint-disable import/namespace */

/**
 * @format
 */
import App from './App';
import { name as appName } from './app.json';
import React from 'react';
import { AppRegistry } from 'react-native';
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
