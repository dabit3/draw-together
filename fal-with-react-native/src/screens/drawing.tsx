
import * as fal from '@fal-ai/serverless-client'
import { FAL_CREDENTIALS } from '../../credentials';
import {
  Canvas,
  useCanvasRef,
  Circle,
  Fill,
  ImageFormat,
  Image,
  Skia,
  SkImage,
} from '@shopify/react-native-skia';
import { useState, useEffect } from 'react';
import { GestureResponderEvent } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Text, View } from '~/components/core';

fal.config({
  credentials: FAL_CREDENTIALS
})

const APP_ID = '110602490-lcm-sd15-i2i';
const DEFAULT_PROMPT = 'A moon in a starry night sky';

type LcmInput = {
  prompt: string;
  image_url: string;
  seed?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  strength?: number;
  sync_mode?: boolean;
};

type LcmImage = {
  url: string;
  width: number;
  height: number;
};

type LcmOutput = {
  images: LcmImage[];
  seed: number;
};

export function DrawingScreen() {
  const currentImage = useSharedValue<SkImage | null>(null);

  const { send } = fal.realtime.connect<LcmInput, LcmOutput>(APP_ID, {
    // The connectionKey is used to identify the connection so that it's reused across
    // re-renders. This avoids multiple connections being opened without the need to
    // keep the reference as useRef or useState yourself.
    connectionKey: 'drawing-lcm-rn',
    // Throttles the number of requests sent to the server.
    throttleInterval: 64,
    onResult(result) {
      const imageUrl = result.images[0].url;
      const base64Data = imageUrl.split(',')[1];
      const data = Skia.Data.fromBase64(base64Data);
      currentImage.value = Skia.Image.MakeImageFromEncoded(data);
    },
  });

  const [isDragging, setIsDragging] = useState(false);
  const moonX = useSharedValue(50);
  const moonY = useSharedValue(50);

  const handleTouchMove = (event: GestureResponderEvent) => {
    'worklet';
    const { locationX, locationY } = event.nativeEvent;
    moonX.value = locationX;
    moonY.value = locationY;
  };

  const canvasRef = useCanvasRef();
  const canvasSize = useSharedValue({ width: 0, height: 0 });
  const resultCanvasSize = useSharedValue({ width: 0, height: 0 });

  const sendCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const image = canvas.makeImageSnapshot({
      x: 0,
      y: 0,
      width: 512,
      height: 512,
    });
    const imageUrl = `data:image/jpeg;base64,${image.encodeToBase64(
      ImageFormat.JPEG,
      50,
    )}`;

    send({
      prompt: DEFAULT_PROMPT,
      image_url: imageUrl,
      strength: 0.8,
      sync_mode: true,
      seed: 6252023,
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (isDragging && canvas) {
      const intervalTimeout = setInterval(() => {
        sendCanvasSnapshot();
      }, 8);

      return () => clearInterval(intervalTimeout);
    }
  }, [isDragging]);

  useEffect(() => {
    sendCanvasSnapshot();
  }, []);

  return (
    <View className="flex flex-col w-full h-full items-center justify-center">
      <View className="py-2 px-4">
        <Text className="text-sm font-light">
          <Text className="font-semibold">Hint:</Text> touch the canvas to move
          the moon around
        </Text>
      </View>
      <Canvas
        ref={canvasRef}
        style={{ flex: 1, width: '100%', height: 'auto' }}
        onSize={canvasSize}
        onTouchStart={(event) => {
          setIsDragging(true);
          handleTouchMove(event);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => {
          setIsDragging(false);
          sendCanvasSnapshot();
        }}>
        <Fill color="#120a3d" />
        <Circle cx={moonX} cy={moonY} r={30} color="yellow" />
      </Canvas>
      <Canvas
        style={{ flex: 1, width: '100%', height: 'auto' }}
        onSize={resultCanvasSize}>
        <Image
          image={currentImage}
          rect={{ x: 0, y: 0, width: 512, height: 512 }}
          fit="cover"
        />
      </Canvas>
    </View>
  );
}