
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

const DEFAULT_WIDTH = 1400
const DEFAULT_HEIGHT = 990

export default function Studio() {

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const areaRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#8B6B2E')
  const [fontFamily, setFontFamily] = useState('serif')
  const [names, setNames] = useState<string[]>([])
  const [currentName, setCurrentName] = useState('')
  const [layouts, setLayouts] = useState<string[]>([])
  const [backgrounds, setBackgrounds] = useState<string[]>([])
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_WIDTH)
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT)
  const [scale, setScale] = useState(1)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [isLocked, setIsLocked] = useState(true)
  const [password, setPassword] = useState('')

  const [logoFile, setLogoFile] = useState<string>('No file chosen')
  const [sigFile, setSigFile] = useState<string>('No file chosen')
  const [bgFile, setBgFile] = useState<string>('No file chosen')

  useEffect(() => {
    const auth = localStorage.getItem('auth')
    if (auth === 'true') {
      setIsLocked(false)
    }
  }, [])

  const handleUnlock = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'goagad123') {
      localStorage.setItem('auth', 'true')
      setIsLocked(false)
    } else {
      alert("Incorrect password")
    }
  }

  const updateScale = useCallback(() => {
    if (!areaRef.current) return
    const areaW = areaRef.current.clientWidth - 48
    const areaH = areaRef.current.clientHeight - 48

    const scaleX = areaW / canvasWidth
    const scaleY = areaH / canvasHeight
    setScale(Math.min(scaleX, scaleY, 1))
  }, [canvasWidth, canvasHeight])

  useEffect(() => {
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (areaRef.current) ro.observe(areaRef.current)
    return () => ro.disconnect()
  }, [updateScale])

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return
    const canvas = new fabric.Canvas(canvasRef.current, { width: canvasWidth, height: canvasHeight })
    fabricRef.current = canvas

    // Background (locked)
    fabric.Image.fromURL('/default-bg.png', img => {
      img.scaleToWidth(canvasWidth)
      img.scaleToHeight(canvasHeight)
      img.selectable = false
      img.evented = false
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
    })

    // Editable Layers
    addText("CERTIFICATE", canvasWidth / 2, 180, 80, true, 'Cinzel', '#8B6B2E', 1000)
    addText("OF ACHIEVEMENT", canvasWidth / 2, 250, 32, false, 'Cinzel', '#8B6B2E', 800)
    addText("Kalsubai Trek - Highest Peak of Maharashtra", canvasWidth / 2, 320, 24, true, 'Montserrat', '#1D1D1B', 1000)
    addText("This Certificate Is Proudly Presented To", canvasWidth / 2, 365, 18, false, 'Montserrat', '#555', 800)

    const nameField = new fabric.Textbox("MILIND GAUDE", {
      left: canvasWidth / 2,
      top: 415,
      width: 1000,
      fontSize: 64,
      textAlign: 'center',
      originX: 'center',
      fill: '#8B6B2E',
      fontWeight: 'bold',
      fontFamily: 'Cinzel'
    })
    nameField.set('customType', 'name')
    canvas.add(nameField)

    const description = "This certificate is awarded for successfully completing the Kalsubai trek. One of the most challenging treks in Maharashtra, and we commend you for your determination and perseverance. We hope this certificate serves as a reminder of your incredible achievement and inspires you to continue exploring the great outdoors. Congrats!"

    const descText = new fabric.Textbox(description, {
      left: canvasWidth / 2,
      top: 510,
      width: 1000,
      fontSize: 20,
      textAlign: 'center',
      originX: 'center',
      fill: '#1D1D1B',
      fontFamily: 'Lora',
      lineHeight: 1.2
    })
    canvas.add(descText)

    const footerY = 800
    const footerOffset = 300

    addText("21/08/2025", canvasWidth / 2 - footerOffset, footerY, 28, true, 'Montserrat', '#1D1D1B', 300)
    const dateLine = new fabric.Line([canvasWidth / 2 - footerOffset - 120, footerY + 40, canvasWidth / 2 - footerOffset + 120, footerY + 40], {
      stroke: '#1D1D1B', strokeWidth: 1, selectable: false
    })
    canvas.add(dateLine)
    addText("DATE", canvasWidth / 2 - footerOffset, footerY + 50, 18, true, 'Montserrat', '#1D1D1B', 200)

    addText("Milind Gaude", canvasWidth / 2 + footerOffset, footerY - 10, 36, false, 'Alex Brush', '#1D1D1B', 300)
    const sigLine = new fabric.Line([canvasWidth / 2 + footerOffset - 120, footerY + 40, canvasWidth / 2 + footerOffset + 120, footerY + 40], {
      stroke: '#1D1D1B', strokeWidth: 1, selectable: false
    })
    canvas.add(sigLine)
    addText("Head Operations", canvasWidth / 2 + footerOffset, footerY + 50, 18, true, 'Montserrat', '#1D1D1B', 300)

    loadLayouts()
    fetchBackgrounds()
  }, [canvasWidth, canvasHeight])

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch('/api/list-bgs')
      const data = await res.json()
      if (data.backgrounds) setBackgrounds(data.backgrounds)
    } catch (error) {
      console.error('Failed to fetch backgrounds:', error)
    }
  }

  const changeBackground = (url: string) => {
    if (!fabricRef.current) return
    fabric.Image.fromURL(url, img => {
      img.scaleToWidth(canvasWidth)
      img.scaleToHeight(canvasHeight)
      img.selectable = false
      img.evented = false
      fabricRef.current?.setBackgroundImage(img, fabricRef.current.renderAll.bind(fabricRef.current))
    })
  }

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgFile(file.name)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload-bg', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        fetchBackgrounds()
        changeBackground(data.url)
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch {
      alert('Upload failed')
    }
  }

  const addText = (text: string, x: number, y: number, size: number, bold: boolean, family = 'serif', color = '#000', width = 800) => {
    const t = new fabric.Textbox(text, {
      left: x, top: y, width, fontSize: size, fill: color,
      textAlign: 'center', originX: 'center', fontFamily: family,
      fontWeight: bold ? 'bold' : 'normal'
    })
    fabricRef.current?.add(t)
  }

  const applyStyle = () => {
    const obj: any = fabricRef.current?.getActiveObject()
    if (!obj) return
    obj.set({ fontSize, color, fill: color, fontFamily })
    fabricRef.current?.renderAll()
  }

  const uploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file.name)
    const reader = new FileReader()
    reader.onload = f => {
      fabric.Image.fromURL(f.target?.result as string, img => {
        img.left = canvasWidth - 300
        img.top = 60
        img.scaleToWidth(180)
        fabricRef.current?.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const uploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSigFile(file.name)
    const reader = new FileReader()
    reader.onload = f => {
      fabric.Image.fromURL(f.target?.result as string, img => {
        img.left = canvasWidth - 400
        img.top = 720
        img.scaleToWidth(200)
        fabricRef.current?.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const enableDraw = () => { if (fabricRef.current) fabricRef.current.isDrawingMode = true }
  const disableDraw = () => { if (fabricRef.current) fabricRef.current.isDrawingMode = false }

  const saveLayout = () => {
    if (!fabricRef.current) return
    const trekName = prompt("Enter Trek Name (e.g., Kalsubai, AMK)")
    if (!trekName) return

    const layoutData = fabricRef.current.toJSON(['customType'])
    const allTemplates = JSON.parse(localStorage.getItem("trekTemplates") || "{}")
    allTemplates[trekName] = layoutData
    localStorage.setItem("trekTemplates", JSON.stringify(allTemplates))

    loadLayouts()
  }

  const loadLayouts = () => {
    const allTemplates = JSON.parse(localStorage.getItem("trekTemplates") || "{}")
    setLayouts(Object.keys(allTemplates))
  }

  const loadLayout = (name: string) => {
    const allTemplates = JSON.parse(localStorage.getItem("trekTemplates") || "{}")
    const data = allTemplates[name]
    if (!data || !fabricRef.current) return
    fabricRef.current.loadFromJSON(data, () => fabricRef.current?.renderAll())
  }

  const exportCertificates = async () => {
    if (!fabricRef.current) return
    if (!names.length) return alert("Enter at least one name")

    if (names.length === 1) {
      const blob = await generatePDF(names[0])
      download(blob, names[0] + ".pdf")
      return
    }

    const zip = new JSZip()
    for (const n of names) {
      const blob = await generatePDF(n)
      zip.file(n + ".pdf", blob)
    }
    const content = await zip.generateAsync({ type: "blob" })
    download(content, "certificates.zip")
  }

  const generatePDF = async (name: string): Promise<Blob> => {
    return new Promise<Blob>((resolve) => {
      const clone = new fabric.Canvas(null, { width: canvasWidth, height: canvasHeight })
      clone.loadFromJSON(fabricRef.current!.toJSON(['customType']), () => {
        clone.getObjects().forEach((obj: any) => {
          if (obj.customType === "name") obj.set({ text: name })
        })
        clone.renderAll()
        const img = clone.toDataURL({ format: "png", multiplier: 2 })
        const pdf = new jsPDF("landscape", "pt", [canvasWidth, canvasHeight])
        pdf.addImage(img, "PNG", 0, 0, canvasWidth, canvasHeight)
        resolve(pdf.output("blob"))
      })
    })
  }

  const download = (blob: Blob, filename: string) => {
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const addParticipant = () => {
    if (!currentName.trim()) return
    setNames([...names, currentName.trim()])
    setCurrentName('')
  }

  const removeParticipant = (index: number) => {
    setNames(names.filter((_, i) => i !== index))
  }

  const clearAllParticipants = () => {
    if (confirm("Clear all participants?")) setNames([])
  }

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const UserIcon = () => (
    <svg className="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )

  const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  const SunIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )

  const MoonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )

  const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )

  const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )

  const UploadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )

  return (
    <div className={(theme === 'light' ? 'light-theme' : '') + (isSidebarOpen ? ' sidebar-open' : '')} style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Mobile Header ── */}
      <header className="mobile-only-header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
          <MenuIcon />
        </button>
        <h3>GOAGAD Studio</h3>
        <button className="theme-toggle-mobile" onClick={toggleTheme}>
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </header>

      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* ── Modern Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Certificate Editor</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              className="header-icon-btn"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="sidebar-body">

          {/* ── Typography ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Typography</div>

            <div className="field-group">
              <label className="field-label">Font Family</label>
              <select className="field-input" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans-serif</option>
                <option value="monospace">Monospace</option>
                <option value="Cinzel">Cinzel</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lora">Lora</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Font Size</label>
              <input
                type="number"
                className="field-input"
                value={fontSize}
                min={8}
                max={200}
                onChange={e => setFontSize(parseInt(e.target.value))}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Color</label>
              <div className="color-row">
                <div className="color-swatch-wrapper">
                  <div className="color-preview" style={{ background: color }} />
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                </div>
                <span className="color-value">{color.toUpperCase()}</span>
              </div>
            </div>

            <button className="btn btn-accent" onClick={applyStyle}>
              Apply Style
            </button>
          </div>

          {/* ── Backgrounds ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Backgrounds</div>

            {backgrounds.length > 0 && (
              <div className="bg-grid" style={{ marginBottom: 12 }}>
                {backgrounds.map(bg => (
                  <div key={bg} className="bg-thumb" onClick={() => changeBackground(bg)}>
                    <img src={bg} alt="Background" />
                  </div>
                ))}
              </div>
            )}

            <label className="file-upload-label">
              <UploadIcon />
              <span>{bgFile}</span>
              <input type="file" accept="image/*" onChange={uploadBackground} />
            </label>
          </div>

          {/* ── Logos & Signatures ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Logos & Signatures</div>

            <div className="field-group">
              <label className="field-label">Upload Logo</label>
              <label className="file-upload-label">
                <UploadIcon />
                <span>{logoFile}</span>
                <input type="file" accept="image/*" onChange={uploadLogo} />
              </label>
            </div>

            <div className="field-group">
              <label className="field-label">Upload Signature</label>
              <label className="file-upload-label">
                <UploadIcon />
                <span>{sigFile}</span>
                <input type="file" accept="image/*" onChange={uploadSignature} />
              </label>
            </div>

            <div className="btn-row" style={{ marginTop: 4 }}>
              <button className="btn btn-accent" onClick={enableDraw}>✏️ Draw</button>
              <button className="btn btn-danger" onClick={disableDraw}>⛔ Stop</button>
            </div>
          </div>

          {/* ── Trek Locations ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Trek Locations</div>

            <button className="btn btn-info" onClick={saveLayout} style={{ marginBottom: 10 }}>
              💾 Save Trek Template
            </button>

            <div className="field-group">
              <label className="field-label">Select Trek Location</label>
              <select className="field-input" onChange={e => loadLayout(e.target.value)}>
                <option value="">— Select trek —</option>
                {layouts.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* ── Bulk Certificates ── */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Bulk Certificates</div>

            <div className="add-input-group">
              <input
                type="text"
                className="field-input"
                placeholder="Add participant name..."
                value={currentName}
                onChange={e => setCurrentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addParticipant()}
              />
              <button className="add-btn" onClick={addParticipant}>
                <span>+</span> Add
              </button>
            </div>

            <div className="participant-list">
              {names.map((name, idx) => (
                <div key={idx} className="participant-chip">
                  <UserIcon />
                  <span>{name}</span>
                  <span className="delete-btn" onClick={() => removeParticipant(idx)}>×</span>
                </div>
              ))}
            </div>

            <div className="stats-row">
              <div>Total Participants: <span className="stats-count">{names.length}</span></div>
            </div>

            <div className="generate-btn-wrapper">
              <button className="btn btn-danger" onClick={clearAllParticipants}>
                Clear All
              </button>
              <button className="generate-btn" onClick={exportCertificates} disabled={names.length === 0}>
                <DownloadIcon />
                Generate {names.length} Certificates
              </button>
            </div>
          </div>

        </div>

        {/* ── Hidden Download ── */}
        <div style={{ display: 'none' }}>
        </div>
      </aside>

      {/* ── Canvas Area ── */}
      <div className="canvas-area" ref={areaRef}>

        <div
          ref={wrapperRef}
          className="canvas-scale-wrapper"
          style={{
            transform: `scale(${scale})`,
            width: canvasWidth,
            height: canvasHeight,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <canvas ref={canvasRef} />
        </div>

        {/* ── Auth Overlay ── */}
        {isLocked && (
          <div className="auth-overlay">
            <div className="auth-card">
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
              <h2>GOAGAD Certificate Studio</h2>
              <div className="field-group">
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  autoFocus
                />
              </div>
              <button className="btn btn-accent btn-primary" onClick={handleUnlock}>
                Unlock Studio
              </button>
              <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Restricted access for administrative use only.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
