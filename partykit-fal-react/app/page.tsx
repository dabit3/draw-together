'use client'
import { useState, useRef, useCallback } from 'react'
import usePartySocket from "partysocket/react";
import Image from 'next/image'
import { Excalidraw, exportToBlob, serializeAsJSON } from "@excalidraw/excalidraw"
import {ExcalidrawImperativeAPI} from "@excalidraw/excalidraw/types/types";
import * as fal from "@fal-ai/serverless-client"
import { v4 as uuid } from 'uuid'

fal.config({
  proxyUrl: "/api/fal",
})

const clientId = uuid()

export default function Home() {
  const [input, setInput] = useState('A cinematic, realistic shot of a baby panda wearing cute glasses and a hat.')
  const [image, setImage] = useState(null)
  const [sceneData, setSceneData] = useState<any>(null)
  const [_appState, setAppState] = useState<any>(null)
  const [seed, setSeed] = useState(Math.floor(Math.random() * 100000))
  const baseArgs = {
    sync_mode: true,
    strength: .99,
    seed
  }

  const history = useRef<any>([])

  const excalidrawApiRef = useRef<any>(null);
  const excalidrawRef = useCallback((excalidrawApi: ExcalidrawImperativeAPI) => {
    excalidrawApiRef.current = excalidrawApi;
  }, []);

  function resetSeed() {
    const _seed = Math.floor(Math.random() * 100000)
    setSeed(_seed)
    send({
      ...baseArgs,
      prompt: input,
      image_url: image,
      seed: _seed
    })
  }

  const ws = usePartySocket({
    host: "http://localhost:1999",
    room: "real-time-create",
    onOpen() {
      console.log("connected")
    },
    onMessage(e) {
      if (e.data.includes('DATAURI')) {
        let data = e.data.split('DATAURI')[1]
        if (data !== image) setImage(data)
      }
      if (e.data.includes('PROMPT')) {
        let data = e.data.split('PROMPT')[1]
        if (data !== input) setInput(data)
      }
      if (e.data.includes('SEED')) {
        let data = e.data.split('SEED')[1]
        setSeed(data)
      }
      if (e.data.includes('MAIN')) {
        let data = e.data.split('MAIN')[1]
        data = JSON.parse(data)
        excalidrawApiRef.current.updateScene(
          JSON.parse(data.sceneData)
        )
        setImage(data.imageUrl)
      }
    },
    onClose() {
      console.log("closed")
    },
    onError(e) {
      console.log("error", e)
    },
  })

  const { send } = fal.realtime.connect('110602490-sdxl-turbo-realtime', {
    connectionKey: 'realtime-nextjs-app',
    throttleInterval: 250,
    onResult(result) {
      if (result.error) return
      const imageUrl = result.images[0].url
      setImage(imageUrl)
      ws.send('PROMPT' + input)
      ws.send('SEED' + seed)
      ws.send('MAIN' + JSON.stringify({
        sceneData,
        clientId,
        imageUrl
      }))
    }
  })

  async function getDataUrl(appState = _appState) {
    const elements = excalidrawApiRef.current?.getSceneElements()
    if (!elements || !elements.length) return
    const blob = await exportToBlob({
      elements,
      exportPadding: 0,
      appState,
      quality: 0.5,
      files: excalidrawApiRef.current?.getFiles(),
      getDimensions: () => { return {width: 450, height: 450}}
    })
    return await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then(e => e.target.result)
  }
  
  return (
    <main className="p-10 px-12">
      <div className='flex items-center'>
        <Image
          src={'/owl.svg'}
          width={30}
          height={30}
          alt='logo'
          className='mr-1'
        />
        <p className="text-3xl font-semibold">Draw together</p>
      </div>
      <input
        className='mt-3 border rounded-lg p-2 w-full mb-2'
        value={input}
        onChange={async (e) => {
          setInput(e.target.value)
          let dataUrl = await getDataUrl()
          send({
            ...baseArgs,
            prompt: e.target.value,
            image_url: dataUrl
          })
        }}
      />
      <div className='flex'>
        <div className="w-[500px] h-[500px]">
          <Excalidraw
            excalidrawAPI={excalidrawRef}
            onChange={async (elements, appState) => {
              console.log('appState: ', appState)
              const newSceneData = serializeAsJSON(
                elements,
                appState,
                excalidrawApiRef.current?.getFiles(),
                'local'
              )
              if (newSceneData !== sceneData) {
                setAppState(appState)
                setSceneData(newSceneData)
                let dataUrl = await getDataUrl(appState)
                send({
                  ...baseArgs,
                  image_url: dataUrl,
                  prompt: input,
                })
              }
            }}
            initialData={{
              // @ts-ignore
              elements: initialData()
            }}
          />
        </div>
        {
          image && (
            <Image
              src={image}
              width={500}
              height={500}
              alt='fal image'
              style={{ marginLeft: 10 }}
            />
          )
        }
      </div>
      <button
        onClick={
          () => {
            resetSeed()
          }
        }
        className='
        bg-slate-800
        mt-3 hover:bg-black rounded-lg text-white px-5 py-2 text-sm'
      >Reset</button>
      <button
        onClick={
          () => {
            excalidrawApiRef.current.updateScene({
              elements: initialData()
            })
            resetSeed()
          }
        }
        className='
        bg-slate-800 ml-2
        mt-3 hover:bg-black rounded-lg text-white px-5 py-2 text-sm'
      >Clear Scene</button>

    </main>
  )
}

function initialData() {
  return [
    {
      "type": "rectangle",
      "version": 266,
      "versionNonce": 484822269,
      "isDeleted": false,
      "id": "bMCwlu9UJaOR-1fptGcjV",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": -1.6171875,
      "y": -5.94140625,
      "strokeColor": "transparent",
      "backgroundColor": "#66a9f1",
      "width": 514.296875,
      "height": 518.6796875,
      "seed": 819092073,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "boundElements": [],
      "updated": 1705266578106,
      "link": null,
      "locked": false
    }           
  ]
}