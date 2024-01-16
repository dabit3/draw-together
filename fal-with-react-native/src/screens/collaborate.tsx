import { useEffect, useCallback, useState, useRef } from 'react'
import { FAL_CREDENTIALS } from '../../credentials';
import "partysocket/event-target-polyfill";
// @ts-ignore
import {usePartySocket} from "partysocket/dist/react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
  Dimensions
} from 'react-native'

import * as fal from '@fal-ai/serverless-client'

const baseArgs = {
  sync_mode: true,
  strength: .99,
}

const APP_ID = '110602490-sdxl-turbo-realtime'
const DEFAULT_PROMPT = 'masterpice, best quality, An in focus, cinematic shot of a bright bluebird sitting on a tree branch.'
const { width } = Dimensions.get('window')
const canvasSize = width - 20

type LcmInput = {
  prompt: string
  image_url: string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
  strength?: number
  sync_mode?: boolean
}

type LcmImage = {
  url: string
  width: number
  height: number
}

type LcmOutput = {
  images: LcmImage[]
  seed: number
}

fal.config({
  credentials: FAL_CREDENTIALS
})

export function DrawingCanvas() {
  const [image, setImage] = useState<any>(null)
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT)
  const [seed, setSeed] = useState(undefined)

  console.log('seed: ', seed)

  const ws = usePartySocket({
    host: "http://localhost:1999",
    room: "real-time-create",

    onOpen() {
      console.log("connected");
    },
    onMessage(e) {
      if (e.data.includes('MAIN')) {
        let data = e.data.split('MAIN')[1]
        data = JSON.parse(data)
        setImage(data.imageUrl)
      }
      if (e.data.includes('PROMPT')) {
        let data = e.data.split('PROMPT')[1]
        setPrompt(data)
      }
      if (e.data.includes('SEED')) {
        let data = e.data.split('SEED')[1]
        setSeed(data)
      }
    },
    onClose() {
      console.log("closed");
    },
    onError(e) {
      console.log("error", e);
    },
  });


  const { send } = fal.realtime.connect<LcmInput, LcmOutput>(APP_ID, {
    connectionKey: 'realtime-nextjs-app',
    onError(error) {
      console.log('error:', error)
    },
    onResult(result) {
      const imageUrl = result.images[0].url
      setImage(imageUrl)
      ws.send('DATAURI' + imageUrl)
    }
  })

  console.log('seed: ', seed)

  return (
    <View style={{
      flex: 1, alignItems: 'center', marginTop: 5
    }}>
        <Image
          source={{ uri: image}}
          style={{
            width: canvasSize, height: canvasSize, marginTop: 5,
            borderRadius: 10
          }}
        />
      <TextInput
        placeholder='prompt'
        onChangeText={v => {
          setPrompt(v)
          ws.send('PROMPT' + v)
          send({
            ...baseArgs,
            seed,
            prompt: v,
            image_url: image
          })
        }}
        value={prompt}
        style={{
          paddingHorizontal: 10,
          width: width - 20,
          borderRadius: 5,
          marginTop: 5,
          height: 40,
          backgroundColor: 'rgba(0, 0, 0, .05)' }}
      />
    </View>
  )
}

const Colors = ['black', 'red', 'blue', 'green', 'yellow', 'brown'] as const

type Color = (typeof Colors)[number]

type ToolbarProps = {
  color: Color
  strokeWidth: number
  setColor: (color: Color) => void
  setStrokeWidth: (strokeWidth: number) => void
}

const strokes = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

const Toolbar = ({
  color,
  strokeWidth,
  setColor,
  setStrokeWidth,
}: ToolbarProps) => {
  const [showStrokes, setShowStrokes] = useState(false)

  const handleStrokeWidthChange = (stroke: number) => {
    setStrokeWidth(stroke)
    setShowStrokes(false)
  }

  const handleChangeColor = (color: Color) => {
    setColor(color)
  }

  return (
    <>
      {showStrokes && (
        <View style={[style.toolbar, style.strokeToolbar]}>
          {strokes.map((stroke) => (
            <Pressable
              onPress={() => handleStrokeWidthChange(stroke)}
              key={stroke}
            >
              <Text style={style.strokeOption}>{stroke}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={[style.toolbar]}>
        <Pressable
          style={style.currentStroke}
          onPress={() => setShowStrokes(!showStrokes)}
        >
          <Text>{strokeWidth}</Text>
        </Pressable>
        <View style={style.separator} />
        {Colors.map((item) => (
          <ColorButton
            isSelected={item === color}
            key={item}
            color={item}
            onPress={() => handleChangeColor(item)}
          />
        ))}
      </View>
    </>
  )
}

type ColorButtonProps = {
  color: Color
  isSelected: boolean
  onPress: () => void
}

const ColorButton = ({ color, onPress, isSelected }: ColorButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        style.colorButton,
        { backgroundColor: color },
        isSelected && {
          borderWidth: 2,
          borderColor: 'black',
        },
      ]}
    />
  )
}

const style = StyleSheet.create({
  strokeOption: {
    fontSize: 15,
    backgroundColor: '#f7f7f7',
  },
  toolbar: {
    backgroundColor: '#ffffff',
    height: 50,
    width: 300,
    borderRadius: 100,
    borderColor: '#f0f0f0',
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  separator: {
    height: 30,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  currentStroke: {
    backgroundColor: '#f7f7f7',
    borderRadius: 5,
  },
  strokeToolbar: {
    position: 'absolute',
    top: 70,
    justifyContent: 'space-between',
    zIndex: 100,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 100,
    marginHorizontal: 5,
  },
})
