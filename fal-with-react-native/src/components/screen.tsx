import { View } from './core';
import React, { type PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView>
      <View className="p-4 flex flex-col space-y-4">{children}</View>
    </ScrollView>
  );
}
