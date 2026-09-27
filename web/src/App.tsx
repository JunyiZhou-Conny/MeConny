import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, useScroll, useTransform } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import Resume from './ui/Resume'
import Works from './ui/Works'
import About from './ui/About'
import LoadingScreen from './ui/LoadingScreen'
import './editorial.css'

export default function App() {
  const worksRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const { scrollYProgress: readingProgress } = useScroll({
    target: worksRef,
    offset: ['start 160px', 'start 90px'],
  })
  const readingNavOpacity = useTransform(readingProgress, [0, 1], [0, 1])
  const cueOpacity = useTransform(scrollY, [0, 200], [1, 0])
  const heroOpacity = useTransform(scrollY, [0, 360], [1, 0])
  const heroVisibility = useTransform(scrollY, (value) =>
    value >= 360 ? 'hidden' : 'visible'
  )
  const heroY = useTransform(scrollY, [0, 500], [0, -70])
  const scrimOpacity = useTransform(scrollY, [0, 500], [0, 0.3])

  useEffect(() => {
    if (/^\/hub(?:\/|\.html)?$/.test(window.location.pathname)) {
      window.history.replaceState(null, '', '/#about')
    }
    const target = document.getElementById(window.location.hash.slice(1))
    if (target)
      requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: 'instant' })
      )
  }, [])

  return (
    <>
      <LoadingScreen />
      <div className="scene-bg" aria-hidden="true">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 5, 19], fov: 39, near: 0.1, far: 500 }}
          gl={{
            antialias: false,
            stencil: false,
            depth: true,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
        >
          <color attach="background" args={['#0a0e16']} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
        <NoiseOverlay />
      </div>
      <motion.div
        className="scrim"
        style={{ opacity: scrimOpacity }}
        aria-hidden="true"
      />
      <a className="skip-link" href="#works">
        Skip to selected work
      </a>
      <motion.div
        className="reading-nav-bg"
        style={{ opacity: readingNavOpacity }}
        aria-hidden="true"
      />
      <header className="demo-header">
        <a
          href="#start"
          className="demo-wordmark"
          aria-label="Conny Zhou, back to start"
        >
          Conny Zhou<span>Health data science</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#works">
            Works <span aria-hidden="true">↘</span>
          </a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main className="content">
        <section className="hero" id="start" aria-labelledby="hero-title">
          <motion.div
            className="about"
            style={{
              opacity: heroOpacity,
              y: heroY,
              visibility: heroVisibility,
            }}
          >
            <h1 className="about-title" id="hero-title">
              About Conny
            </h1>
            <p className="about-body">
              I build tools for clinical AI and computational biology.
              <br className="desktop-break" /> My aim is to turn an experiment
              into something another person can use.
            </p>
            <div className="hero-actions">
              <a href="#works">
                Explore my work <span aria-hidden="true">↘</span>
              </a>
              <a href="#about">More about me</a>
            </div>
          </motion.div>
          <motion.div
            className="scroll-cue"
            style={{ opacity: cueOpacity }}
            aria-hidden="true"
          >
            <span>Scroll to meet the work</span>
            <span>↓</span>
          </motion.div>
          <motion.div
            className="hero-footnote"
            style={{ opacity: cueOpacity }}
            aria-hidden="true"
          >
            <span>Cells · Code · Care</span>
            <span>Boston, MA · 2026</span>
          </motion.div>
        </section>
        <Resume lang="en" />
        <Works innerRef={worksRef} />
        <About />
      </main>
    </>
  )
}
