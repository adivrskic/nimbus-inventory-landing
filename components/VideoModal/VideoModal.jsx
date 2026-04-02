"use client";
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import styles from './VideoModal.module.css'

export default function VideoModal({ isOpen, onClose }) {
  const backdropRef = useRef(null)
  const playerRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)

  useEffect(() => { if (isOpen) setMounted(true) }, [isOpen])

  useEffect(() => {
    if (!mounted || !isOpen || !backdropRef.current) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(backdropRef.current, { opacity: 1, duration: 0.4 })
      .to(playerRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'power4.out' }, '-=0.2')
  }, [mounted, isOpen])

  useEffect(() => {
    if (!isOpen && mounted && !animatingOut) {
      setAnimatingOut(true)
      const tl = gsap.timeline({ defaults: { ease: 'power3.in' }, onComplete: () => { setMounted(false); setAnimatingOut(false) } })
      tl.to(playerRef.current, { scale: 0.95, opacity: 0, duration: 0.3 })
        .to(backdropRef.current, { opacity: 0, duration: 0.25 }, '-=0.15')
    }
  }, [isOpen, mounted, animatingOut])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <div ref={backdropRef} className={styles.backdrop} onClick={onClose}>
      <div ref={playerRef} className={styles.player} onClick={(e) => e.stopPropagation()}>
        <div className={styles.playerInner}>
          <button className={styles.playBtn}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28, marginLeft: 3 }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
          <div className={styles.title}>Product overview</div>
          <div className={styles.subtitle}>2 min · See how Nimbus transforms warehouse operations</div>
        </div>
        <div className={styles.escHint}>ESC to close</div>
      </div>
    </div>
  )
}
