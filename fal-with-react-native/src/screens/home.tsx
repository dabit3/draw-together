import * as fal from '@fal-ai/serverless-client';
import React, { useState } from 'react';
import { View, Image, Input, Button } from '~/components/core';
import { Screen } from '~/components/screen';

const DEFAULT_PROMPT =
  'a city landscape of a cyberpunk metropolis, raining, purple, pink and teal neon lights, highly detailed, uhd';

type SdxlInput = {
  prompt: string;
  seed?: number;
};

type FalTiming = {
  inference: number;
  image_processing: number;
};

type FalImage = {
  url: string;
  width: number;
  height: number;
};

type SdxlResult = {
  images: FalImage[];
  timings: FalTiming;
};

export function HomeScreen() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<FalImage | null>(null);
  const generateImate = async () => {
    setLoading(true);
    try {
      const result = await fal.subscribe<SdxlInput, SdxlResult>(
        '110602490-fast-sdxl',
        {
          input: {
            prompt,
          },
        },
      );
      if (result.images && result.images.length > 0) {
        setImage(result.images[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Input label="Prompt" value={prompt} onChangeText={setPrompt} />
      <Button
        className={loading ? 'opacity-70' : 'opacity-100'}
        onPress={() => generateImate()}>
        {loading ? 'Loading...' : 'Generate'}
      </Button>
      <View className="flex w-full">
        {image && (
          <Image
            source={{ uri: image.url }}
            style={{ width: '100%', aspectRatio: 1, resizeMode: 'contain' }}
          />
        )}
      </View>
    </Screen>
  );
}
