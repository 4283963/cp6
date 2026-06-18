import { useState, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const PLOT_SIZE = 100
const SOIL_DEPTH = 8
const SCALE_HEIGHT = 4
const MIN_PH = 3.5
const MAX_PH = 9.5

function phToColor(ph) {
  const t = Math.max(0, Math.min(1, (ph - MIN_PH) / (MAX_PH - MIN_PH)))
  if (t < 0.2) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#ff3b3b'),
      new THREE.Color('#ff8e53'),
      t / 0.2
    )
  } else if (t < 0.4) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#ff8e53'),
      new THREE.Color('#feca57'),
      (t - 0.2) / 0.2
    )
  } else if (t < 0.6) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#feca57'),
      new THREE.Color('#48dbfb'),
      (t - 0.4) / 0.2
    )
  } else if (t < 0.8) {
    return new THREE.Color().lerpColors(
      new THREE.Color('#48dbfb'),
      new THREE.Color('#54a0ff'),
      (t - 0.6) / 0.2
    )
  } else {
    return new THREE.Color().lerpColors(
      new THREE.Color('#54a0ff'),
      new THREE.Color('#2e86de'),
      (t - 0.8) / 0.2
    )
  }
}

function SoilBlock() {
  return (
    <group position={[PLOT_SIZE / 2, -SOIL_DEPTH / 2, PLOT_SIZE / 2]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[PLOT_SIZE, SOIL_DEPTH, PLOT_SIZE]} />
        <meshStandardMaterial
          color="#6b4423"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, SOIL_DEPTH / 2 + 0.05, 0]} receiveShadow>
        <planeGeometry args={[PLOT_SIZE, PLOT_SIZE]} />
        <meshStandardMaterial
          color="#3d7c40"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  )
}

function GridLines() {
  const lines = useMemo(() => {
    const points = []
    const step = 10
    for (let i = 0; i <= PLOT_SIZE; i += step) {
      points.push(new THREE.Vector3(i, 0.02, 0), new THREE.Vector3(i, 0.02, PLOT_SIZE))
      points.push(new THREE.Vector3(0, 0.02, i), new THREE.Vector3(PLOT_SIZE, 0.02, i))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [])
  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#ffffff" opacity={0.15} transparent />
    </lineSegments>
  )
}

function AxisLabels() {
  const labelStyle = {
    fontSize: 10,
    color: '#9fb0c7',
    anchorX: 'center',
    anchorY: 'middle',
  }
  return (
    <group>
      {[0, 25, 50, 75, 100].map((v) => (
        <Text
          key={`x-${v}`}
          position={[v, 0.1, -3]}
          rotation={[-Math.PI / 2, 0, 0]}
          {...labelStyle}
        >
          {v}
        </Text>
      ))}
      {[0, 25, 50, 75, 100].map((v) => (
        <Text
          key={`z-${v}`}
          position={[-3, 0.1, v]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          {...labelStyle}
        >
          {v}
        </Text>
      ))}
      <Text position={[PLOT_SIZE / 2, 0.2, -7]} {...labelStyle} fontSize={14}>
        X 坐标 (m)
      </Text>
      <Text position={[-7, 0.2, PLOT_SIZE / 2]} rotation={[0, Math.PI / 2, 0]} {...labelStyle} fontSize={14}>
        Y 坐标 (m)
      </Text>
    </group>
  )
}

function PHBar({ sample, index }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const height = (sample.ph - MIN_PH) / (MAX_PH - MIN_PH) * SCALE_HEIGHT
  const color = useMemo(() => phToColor(sample.ph), [sample.ph])

  useFrame((state) => {
    if (meshRef.current) {
      const target = hovered ? 1.08 : 1
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, target, 0.12)
    }
  })

  return (
    <group position={[sample.x, 0.01, sample.y]}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <cylinderGeometry args={[0.9, 1.1, height, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.35 : 0.08}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, height + 0.15, 0]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {hovered && (
        <Html position={[0, height + 2.2, 0]} center distanceFactor={12}>
          <div
            style={{
              background: 'rgba(16, 22, 36, 0.95)',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(88, 166, 255, 0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              color: '#e6edf3',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: color.getStyle() }}>
              采样点 #{sample.id}
            </div>
            <div style={{ color: '#9fb0c7' }}>
              坐标: ({sample.x}, {sample.y})
            </div>
            <div style={{ marginTop: 2 }}>
              pH 值:{' '}
              <span style={{ fontWeight: 700, color: color.getStyle() }}>
                {sample.ph}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function Scene({ samples }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[80, 120, 60]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={PLOT_SIZE + 20}
        shadow-camera-top={-20}
        shadow-camera-bottom={PLOT_SIZE + 20}
        shadow-camera-near={1}
        shadow-camera-far={500}
      />
      <pointLight position={[-20, 50, PLOT_SIZE + 20]} intensity={0.4} color="#54a0ff" />
      <pointLight position={[PLOT_SIZE + 20, 50, -20]} intensity={0.4} color="#ff6b6b" />

      <SoilBlock />
      <GridLines />
      <AxisLabels />

      {samples.map((s, i) => (
        <PHBar key={s.id} sample={s} index={i} />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={25}
        maxDistance={260}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[PLOT_SIZE / 2, 5, PLOT_SIZE / 2]}
      />

      <color attach="background" args={['#0a0e17']} />
      <fog attach="fog" args={['#0a0e17', 160, 320]} />
    </>
  )
}

export default function SoilScene({ samples, stats }) {
  return (
    <Canvas
      shadows
      camera={{
        position: [-50, 85, -55],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Scene samples={samples} stats={stats} />
    </Canvas>
  )
}
